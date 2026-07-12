#!/usr/bin/env bash
# =============================================================================
# run_segment1.sh — 《丁丁历险记·在刚果》船上第1段（私人收藏 / silent collectible）
#
# 工作流约定（Grok Build）：
#   - 本文件只含 bash + FFmpeg + IMAGINE_STEPS（英文 prompt 清单）
#   - 不调用任何图生 / imagine / image_to_video API
#   - 把本脚本复制到带 imagine 工具的 Grok 环境执行
#
# 规格：
#   ~30s 无声 | 1280x720 | 24fps | 镜间 xfade 0.25s
#   观感 = 老片修复连环画：鲜亮、对比够、清楚、短动作
#   禁止：灰扫描、与书上剧情不符的 AI 重绘、出版社封面、甲板长时间走路
#   颜色优先于字幕完整（火车挥手可略裁字）
#
# 验收（必须全部通过）：
#   [02] 单丁丁（EXACTLY ONE Tintin），握手艳+动像进舱；双丁丁则走方案 H，勿灰 PDF
#   [06] 必须开门 + 海景（禁止平面插画静格）
#   [08] 像 p08 剧情（追箱），无双狗；禁止 i2i 重画构图
#   [角色] 丁丁=年轻记者米色风衣灯笼裤；白雪=一只白狗，避免黑耳双狗
#   [风格] flat ligne claire, vivid album restoration, not photorealistic
#
# 三角约束：鲜艳+动效 与 单丁丁/单白雪/书上构图 不能 100% 同时；
#           握手以艳+动为主，出现双丁丁则方案 H，勿退回灰 PDF 推拉。
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# 路径
# -----------------------------------------------------------------------------
PANELS_DIR="${PANELS_DIR:-/home/workdir/artifacts/ship60/panels}"
V10_DIR="${V10_DIR:-/home/workdir/artifacts/segment1_v10}"
OUT_DIR="${OUT_DIR:-/home/workdir/artifacts/segment1_collectible}"
FINAL_MP4="${FINAL_MP4:-${OUT_DIR}/segment1_collectible_silent.mp4}"
TMP_DIR="${TMP_DIR:-${OUT_DIR}/.tmp_patch}"

mkdir -p "$OUT_DIR" "$TMP_DIR"

# -----------------------------------------------------------------------------
# 镜头顺序（成品文件名）
# -----------------------------------------------------------------------------
SHOTS=(
  01_title
  02_farewell
  03_dogs
  04_wave
  05_ship
  06_cabin
  07_spider
  08_chase
  09_trunk
)

# 标杆镜：禁止重生，脚本里只 cp（不重编码）
# 01 片头 | 03 狗群 | 05 上甲板 | 06 进舱(海景+开门) | 07 蜘蛛 | 09 碎镜箱内
BENCHMARK_SHOTS=(01_title 03_dogs 05_ship 06_cabin 07_spider 09_trunk)

# PATCH 默认只改这两镜；其余从 collectible 拷贝
# 覆盖示例：PATCH_SHOTS="02_farewell 08_chase 04_wave" ./run_segment1.sh
PATCH_SHOTS="${PATCH_SHOTS:-02_farewell 08_chase}"

# 02 方案：H=从 v10 截取（默认优先）；IMAGINE=走图生管线（见 IMAGINE_STEPS）
# 示例：FAREWELL_MODE=IMAGINE ./run_segment1.sh
FAREWELL_MODE="${FAREWELL_MODE:-H}"

# 方案 H 截取参数（可调 ss 避开双丁丁）
FAREWELL_SS="${FAREWELL_SS:-0.35}"
FAREWELL_T="${FAREWELL_T:-3.8}"

# 编码
CRF=15
XFADE_D=0.25
FPS=24
W=1280
H=720

# -----------------------------------------------------------------------------
# LUT / 滤镜
# 全片动效镜统一 CABIN_LUT；04 挥手用 WAVE_LUT（crop 满屏 + 同 eq）
# -----------------------------------------------------------------------------
CABIN_LUT="scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,fps=${FPS},format=yuv420p,eq=contrast=1.18:brightness=0.03:saturation=1.18,unsharp=luma_msize_x=5:luma_msize_y=5:luma_amount=0.8"

# 04_wave：先 crop 满屏再 pad 到 1280x720 + 同 eq（v10 源）
WAVE_LUT="crop=in_w:in_h*0.92:0:in_h*0.04,scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${FPS},format=yuv420p,eq=contrast=1.18:brightness=0.03:saturation=1.18,unsharp=luma_msize_x=5:luma_msize_y=5:luma_amount=0.8"

# 08 fallback zoompan（静图缓推，不用 i2i）
ZOOM_FALLBACK="scale=8000:-1,zoompan=z='min(zoom+0.0008,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=72:s=${W}x${H}:fps=${FPS},format=yuv420p,eq=contrast=1.18:brightness=0.03:saturation=1.18,unsharp=luma_msize_x=5:luma_msize_y=5:luma_amount=0.8"

log()  { printf '[segment1] %s\n' "$*"; }
die()  { printf '[segment1] ERROR: %s\n' "$*" >&2; exit 1; }

need_file() {
  [[ -f "$1" ]] || die "missing file: $1"
}

# 是否在 PATCH 列表
is_patch() {
  local s="$1"
  for p in $PATCH_SHOTS; do
    [[ "$p" == "$s" ]] && return 0
  done
  return 1
}

# 是否标杆镜
is_benchmark() {
  local s="$1"
  for b in "${BENCHMARK_SHOTS[@]}"; do
    [[ "$b" == "$s" ]] && return 0
  done
  return 1
}

# -----------------------------------------------------------------------------
# apply_lut <input> <output> [lut_name]
# lut_name: cabin (default) | wave
# -----------------------------------------------------------------------------
apply_lut() {
  local inp="$1"
  local out="$2"
  local which="${3:-cabin}"
  local vf
  case "$which" in
    cabin) vf="$CABIN_LUT" ;;
    wave)  vf="$WAVE_LUT"  ;;
    *) die "unknown lut: $which" ;;
  esac
  need_file "$inp"
  log "apply_lut($which): $(basename "$inp") -> $(basename "$out")"
  ffmpeg -y -i "$inp" \
    -vf "$vf" \
    -c:v libx264 -crf "$CRF" -pix_fmt yuv420p -an \
    "$out"
}

# -----------------------------------------------------------------------------
# plan_h_handshake — 痛点02：从 v10 截取握手段 + CABIN_LUT
# 优先保证艳+动像进舱；避免双丁丁与灰 PDF 推拉
# -----------------------------------------------------------------------------
plan_h_handshake() {
  local src="${V10_DIR}/02_farewell.mp4"
  local raw="${TMP_DIR}/02_farewell_raw.mp4"
  local out="${OUT_DIR}/02_farewell.mp4"
  need_file "$src"
  log "plan_h_handshake: ss=${FAREWELL_SS} t=${FAREWELL_T} from v10"
  # 先截取（可调 FAREWELL_SS 把起点放在双丁丁帧之后）
  ffmpeg -y -ss "$FAREWELL_SS" -i "$src" -t "$FAREWELL_T" \
    -c:v libx264 -crf "$CRF" -pix_fmt yuv420p -an \
    "$raw"
  apply_lut "$raw" "$out" cabin
  log "plan_h_handshake done -> $out"
}

# -----------------------------------------------------------------------------
# patch_04_wave — 若被纳入 PATCH：v10 源 + WAVE_LUT（默认不在 PATCH 内）
# -----------------------------------------------------------------------------
patch_04_wave() {
  local src="${V10_DIR}/04_wave.mp4"
  local out="${OUT_DIR}/04_wave.mp4"
  need_file "$src"
  apply_lut "$src" "$out" wave
}

# -----------------------------------------------------------------------------
# patch_08_chase — 痛点08：禁止 i2i 重画构图
# 主路径：使用已生成的 08 动效源（由 IMAGINE_STEPS 在外机产出）再 CABIN_LUT
# 查找顺序：
#   1) OUT_DIR/.imagine/08_chase_raw.mp4  （imagine 落盘约定）
#   2) TMP_DIR/08_chase_imagine.mp4
#   3) fallback: p08.png zoompan + CABIN_LUT 一体滤镜
# -----------------------------------------------------------------------------
patch_08_chase() {
  local panel="${PANELS_DIR}/p08.png"
  local out="${OUT_DIR}/08_chase.mp4"
  local imag_a="${OUT_DIR}/.imagine/08_chase_raw.mp4"
  local imag_b="${TMP_DIR}/08_chase_imagine.mp4"

  if [[ -f "$imag_a" ]]; then
    log "08_chase: apply CABIN_LUT on imagine source $imag_a"
    apply_lut "$imag_a" "$out" cabin
    return
  fi
  if [[ -f "$imag_b" ]]; then
    log "08_chase: apply CABIN_LUT on imagine source $imag_b"
    apply_lut "$imag_b" "$out" cabin
    return
  fi

  # fallback：静图 zoompan，保持 p08 构图，禁止 i2i
  need_file "$panel"
  log "08_chase FALLBACK: zoompan on p08.png (no i2i redraw)"
  ffmpeg -y -loop 1 -i "$panel" -t 3.0 \
    -vf "$ZOOM_FALLBACK" \
    -c:v libx264 -crf "$CRF" -pix_fmt yuv420p -an \
    "$out"
  log "08_chase fallback done -> $out"
}

# -----------------------------------------------------------------------------
# copy_benchmark_or_existing — 非 PATCH 镜：从已有 collectible 拷贝，不重编码
# -----------------------------------------------------------------------------
copy_shot() {
  local name="$1"
  local dst="${OUT_DIR}/${name}.mp4"
  if [[ -f "$dst" ]]; then
    log "keep existing (no re-encode): $dst"
    return
  fi
  die "missing benchmark/collectible shot (must pre-exist, do not regenerate): $dst"
}

# -----------------------------------------------------------------------------
# ensure_all_shots — 按 PATCH / 标杆 策略准备 01..09
# -----------------------------------------------------------------------------
ensure_all_shots() {
  log "PATCH_SHOTS=$PATCH_SHOTS | FAREWELL_MODE=$FAREWELL_MODE"
  for s in "${SHOTS[@]}"; do
    if is_patch "$s"; then
      case "$s" in
        02_farewell)
          if [[ "$FAREWELL_MODE" == "H" ]]; then
            plan_h_handshake
          else
            # IMAGINE 模式：期望外机已写入 .imagine/02_farewell_raw.mp4
            local imag="${OUT_DIR}/.imagine/02_farewell_raw.mp4"
            [[ -f "$imag" ]] || die "FAREWELL_MODE=IMAGINE but missing $imag — run IMAGINE_STEPS first"
            apply_lut "$imag" "${OUT_DIR}/02_farewell.mp4" cabin
          fi
          ;;
        08_chase)
          patch_08_chase
          ;;
        04_wave)
          patch_04_wave
          ;;
        *)
          die "no patch handler for $s (add handler or remove from PATCH_SHOTS)"
          ;;
      esac
    else
      # 标杆镜与其它非 PATCH：只允许已有成品 cp/keep，禁止重生
      if is_benchmark "$s"; then
        log "BENCHMARK copy-only: ${s}.mp4"
      else
        log "non-patch keep/copy: ${s}.mp4"
      fi
      copy_shot "$s"
    fi
  done
}

# -----------------------------------------------------------------------------
# concat_xfade — 镜间淡入淡出 XFADE_D 秒，输出无声成片
# 动态构建 filter_complex；各镜时长用 ffprobe 读取
# -----------------------------------------------------------------------------
shot_duration() {
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$1"
}

concat_xfade() {
  local n=${#SHOTS[@]}
  local -a inputs=()
  local -a durs=()
  local i=0
  local total_offset=0
  local fc=""
  local out_label

  log "concat_xfade: ${n} shots, xfade=${XFADE_D}s -> $FINAL_MP4"

  for s in "${SHOTS[@]}"; do
    local f="${OUT_DIR}/${s}.mp4"
    need_file "$f"
    inputs+=(-i "$f")
    local d
    d=$(shot_duration "$f")
    durs+=("$d")
  done

  if (( n == 1 )); then
    ffmpeg -y "${inputs[@]}" -c:v libx264 -crf "$CRF" -pix_fmt yuv420p -an "$FINAL_MP4"
    return
  fi

  # 归一化每路到统一 SAR/fps（保险；源已应是 1280x720/24）
  for ((i=0; i<n; i++)); do
    fc+="[${i}:v]fps=${FPS},format=yuv420p,setsar=1[v${i}];"
  done

  # 链式 xfade
  # offset_k = sum(dur[0..k-1]) - k * XFADE_D
  fc+="[v0][v1]xfade=transition=fade:duration=${XFADE_D}:offset=$(awk -v d="${durs[0]}" -v x="$XFADE_D" 'BEGIN{printf "%.4f", d-x}')[x1];"
  total_offset=$(awk -v d="${durs[0]}" -v x="$XFADE_D" 'BEGIN{printf "%.4f", d-x}')
  out_label="x1"
  for ((i=2; i<n; i++)); do
    local prev_d="${durs[$((i-1))]}"
    total_offset=$(awk -v o="$total_offset" -v d="$prev_d" -v x="$XFADE_D" 'BEGIN{printf "%.4f", o+d-x}')
    local next_label="x${i}"
    if (( i == n-1 )); then
      next_label="vout"
    fi
    fc+="[${out_label}][v${i}]xfade=transition=fade:duration=${XFADE_D}:offset=${total_offset}[${next_label}];"
    out_label="$next_label"
  done
  # 去掉末尾多余分号对 ffmpeg 无害；统一出口
  if [[ "$out_label" != "vout" ]]; then
    fc+="[${out_label}]null[vout]"
  fi

  ffmpeg -y "${inputs[@]}" \
    -filter_complex "$fc" \
    -map "[vout]" \
    -c:v libx264 -crf "$CRF" -pix_fmt yuv420p -an \
    "$FINAL_MP4"

  log "wrote $FINAL_MP4"
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_MP4" \
    | awk '{printf "[segment1] final duration: %.2fs\n", $1}'
}

# -----------------------------------------------------------------------------
# 主流程
# -----------------------------------------------------------------------------
main() {
  log "OUT_DIR=$OUT_DIR"
  ensure_all_shots
  concat_xfade
  log "DONE. Accept checklist:"
  log "  [02] single Tintin, vivid motion (Plan H if twin Tintin)"
  log "  [06] door open + sea view (benchmark, copy-only)"
  log "  [08] chase-to-trunk like p08, ONE white dog, no twin dogs"
  log "  [no] publisher cover / gray PDF / deck long walk"
}

# 仅当被直接执行时跑 main（可 source 复用函数）
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi

# =============================================================================
# IMAGINE_STEPS
# -----------------------------------------------------------------------------
# 在「有 imagine / create_asset / image_to_video 工具」的 Grok 里手工执行。
# Grok Build 本机不要调用图生 API。
# 落盘约定：
#   ${OUT_DIR}/.imagine/08_chase_raw.mp4
#   ${OUT_DIR}/.imagine/02_farewell_raw.mp4   # 仅 FAREWELL_MODE=IMAGINE
# 完成后回本脚本：默认 PATCH 会 apply_lut + concat。
# =============================================================================
: <<'IMAGINE_STEPS'

## Prerequisites
- panels: /home/workdir/artifacts/ship60/panels/p02.png … p09.png
- do NOT use publisher cover art
- do NOT image_to_image redraw composition (especially p08)
- style lock for all prompts:
  flat ligne claire, vivid Hergé album restoration colors, high contrast,
  clean outlines, NOT photorealistic, NOT gray scan, NOT muddy print
- characters:
  Tintin = young reporter, beige trench coat, plus-fours/baggy trousers
  Snowy = EXACTLY ONE small white dog (no black ears, no second dog)

------------------------------------------------------------------------------
### SHOT 08 — chase to trunk  (REQUIRED for default PATCH)
Pain point: must keep BOOK panel p08 composition/story beat.
FORBIDDEN: image_to_image / any redraw that invents a different AI plot.
Pipeline (same as spider 07):

  1) create_asset from panel file:
       source = /home/workdir/artifacts/ship60/panels/p08.png
       name   = ship60_p08_chase_source

  2) image_to_video (one pass) on that asset
     duration ~3.0s, motion short and readable
     save raw video to:
       /home/workdir/artifacts/segment1_collectible/.imagine/08_chase_raw.mp4

  FULL ENGLISH PROMPT (copy verbatim):

    Animate this EXACT panel composition only — do not invent a new scene.
    Story beat: short chase toward the trunk / travel chest on the ship,
    matching the album panel p08 (Tintin in the Congo, ship sequence).
    EXACTLY ONE white dog (Snowy) — vivid restored Hergé colors matching
    the spider scene (shot 07): bright yellows/reds/blues, clean ligne claire
    outlines, flat comic coloring, high contrast, album restoration look,
    NOT photorealistic, NOT gray scan, NOT muddy reprint.
    Chinese stable one pass chase to trunk. Short readable motion only.
    No second dog, no black-eared dog, no publisher cover, no long deck walk,
    no dialogue rewrite. Keep framing faithful to p08.png.

  3) After raw mp4 exists, run this script (default PATCH applies CABIN_LUT):
       bash run_segment1.sh
     If imagine fails, script auto-fallback:
       p08.png zoompan + CABIN_LUT (composition preserved, no i2i).

------------------------------------------------------------------------------
### SHOT 02 — farewell handshake  (ONLY if FAREWELL_MODE=IMAGINE)
Default is Plan H (ffmpeg crop from v10) — DO NOT run this block unless
user explicitly abandons Plan H.

Pain point: vivid + motion like cabin enter; EXACTLY ONE Tintin ONE Snowy;
no twin Tintin; no gray PDF push-zoom.

  1) create_asset:
       source = /home/workdir/artifacts/ship60/panels/p02.png
       name   = ship60_p02_farewell_source

  2) image_to_video on that asset
     save raw to:
       /home/workdir/artifacts/segment1_collectible/.imagine/02_farewell_raw.mp4

  FULL ENGLISH PROMPT (copy verbatim):

    Animate this EXACT farewell / handshake panel only.
    EXACTLY ONE Tintin and EXACTLY ONE Snowy — vivid ligne claire,
    not photorealistic. Chinese stable.
    Tintin: young reporter in beige trench coat and baggy plus-fours.
    Snowy: one small pure-white dog only (no black ears, no second dog).
    Vivid Hergé album restoration colors, bright contrast, clean outlines,
    short handshake motion with energy matching the cabin-entry shot,
    NOT gray PDF scan, NOT slow Ken-Burns on a muddy page, NOT publisher cover.
    Do not duplicate Tintin. Keep book-accurate composition.

  3) Run with imagine mode:
       FAREWELL_MODE=IMAGINE bash run_segment1.sh

------------------------------------------------------------------------------
### DO NOT REGENERATE (benchmark — script only cp / keep)
  01_title, 03_dogs, 05_ship, 06_cabin, 07_spider, 09_trunk
  06_cabin MUST already contain door-open + sea view (never replace with still).

### OPTIONAL (only if user adds to PATCH_SHOTS)
  04_wave: no imagine; script uses v10/04_wave.mp4 + WAVE_LUT

### Acceptance (human eye)
  [02] single Tintin; if twins appear → stick to Plan H, retune FAREWELL_SS
  [08] story matches p08 chase-to-trunk; ONE white dog; colors peer spider 07
  [06] door open + sea (benchmark untouched)
  [all] vivid restored comic, not gray scan; no publisher cover

IMAGINE_STEPS
# =============================================================================
