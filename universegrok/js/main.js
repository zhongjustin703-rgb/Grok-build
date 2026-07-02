/**
 * UniverseGrok - 网页交互逻辑
 * 模拟「理解宇宙初心」版的 Grok 回答体验
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('ask-form');
  const input = document.getElementById('universe-question');
  const answerSection = document.getElementById('answer-section');
  const answerContent = document.getElementById('answer-content');
  const answerMeta = document.getElementById('answer-meta');
  const clearBtn = document.getElementById('clear-answer');

  // ============================================
  // 宇宙知识库 —— 致敬 Grok 理解宇宙的初心
  // 更丰富、更真实、更具深度的回答
  // ============================================
  const cosmicKnowledge = [
    {
      keywords: ['黑洞', '奇点', '事件视界', '霍金', 'singularity', 'hawking', 'event horizon'],
      title: '黑洞与信息',
      answer: `黑洞不是简单的吞噬机器。它是自然界中最极端的实验室。\n\n根据广义相对论，事件视界之后，时间和空间交换了角色：你不再“移动穿过空间”，而是“被时间带着走向奇点”。\n\n最深刻的悖论是信息丢失问题：量子力学要求信息守恒，而经典黑洞似乎会永久抹除它。霍金辐射让黑洞缓慢蒸发，但我们仍不清楚蒸发时信息到底去了哪里。\n\n弦理论和全息原理暗示：黑洞的信息可能编码在事件视界表面的量子态上。或许宇宙本身就是一个巨大的全息投影。\n\n我们离彻底理解量子引力还很远，但黑洞正在逼迫我们重新思考现实的本质。`,
      source: '原初视角 · 引力奇点',
      tags: ['广义相对论', '量子引力', '信息悖论']
    },
    {
      keywords: ['大爆炸', '起源', '暴胀', '普朗克', 'big bang', 'inflation', '创世'],
      title: '宇宙的开端',
      answer: `我们所谓的“大爆炸”其实是当前物理定律失效的奇点。\n\n在普朗克时间（约10⁻⁴³秒）之前，我们没有可信的理论。暴胀理论很好地解释了宇宙的均匀性、平坦度和视界问题，但它把“是什么启动了暴胀”这个更难的问题推向了更早。\n\n或许时间本身在大爆炸附近才涌现出来。宇宙不是“在”时间中诞生，而是时空结构一同从量子涨落中出现。\n\n我们目前最好的描述是：宇宙从极低熵的状态开始，朝着热寂演化。为什么初始熵这么低？这是宇宙学最深的谜题之一。`,
      source: '原初视角 · 宇宙学边界',
      tags: ['暴胀', '普朗克尺度', '熵问题']
    },
    {
      keywords: ['暗物质', '暗能量', 'dark matter', 'dark energy', '加速膨胀'],
      title: '看不见的宇宙',
      answer: `我们能直接观测到的普通物质只占宇宙总能量的约5%。暗物质约27%，暗能量约68%。\n\n暗物质通过引力塑造星系和宇宙大尺度结构，却不发光、不参与电磁相互作用。我们通过引力透镜、星系旋转曲线、宇宙微波背景涨落等间接证据推断它存在。\n\n暗能量更令人不安：它驱动宇宙加速膨胀。最简单的解释是宇宙学常数，但其观测值与量子场论预测相差120个数量级——这是物理学史上最大的不协调之一。\n\n无论暗物质和暗能量最终是什么，它们都在悄无声息地决定宇宙的长期命运。`,
      source: '原初视角 · 隐藏主宰',
      tags: ['宇宙常数', '结构形成', '加速膨胀']
    },
    {
      keywords: ['时间', '熵', '箭头', 'entropy', '热寂', 'arrow of time'],
      title: '时间的箭头',
      answer: `物理定律大多在时间反演下是对称的。但我们经验中的时间有明确方向——这几乎完全来自热力学第二定律：熵总是增加。\n\n宇宙从大爆炸那个极低熵的状态开始，朝着最大熵的热寂前进。这就是时间的宏观箭头。\n\n有趣的是，量子测量和引力似乎也参与定义了时间的方向。有人提出：时间不是宇宙的基本属性，而是从纠缠和信息中涌现出来的。\n\n如果宇宙最终达到热平衡，时间还会“流逝”吗？或者说，观察者的存在本身是否定义了时间的流动？`,
      source: '原初视角 · 热力学与存在',
      tags: ['第二定律', '涌现时间', '热寂']
    },
    {
      keywords: ['生命', '外星', '费米', '宜居', 'exoplanet', 'fermi', '外星人'],
      title: '寂静的宇宙',
      answer: `我们已经确认了数千颗系外行星，其中一些位于恒星宜居带。但“宜居”≠“有生命”。\n\n生命需要持续的自由能梯度、复杂有机化学、以及极长时间的稳定环境。地球上的生命出现得相当早，但从单细胞到智慧生命花了数十亿年。\n\n费米悖论依然尖锐：如果生命并不罕见，为什么我们完全听不到任何信号？\n\n可能答案包括：大过滤器（文明极难突破某个阶段）、距离太远、或者智慧生命极其短暂。或者——我们真的是最早的。\n\n无论如何，这个问题把科学和技术问题直接变成了哲学与存在问题。`,
      source: '原初视角 · 生命意义',
      tags: ['费米悖论', '大过滤器', '宜居带']
    },
    {
      keywords: ['量子', '测量', '叠加', '多世界', 'quantum', 'measurement', 'wave function'],
      title: '现实的本质',
      answer: `量子力学最令人不安的地方在于：它对“观测”的定义模糊。\n\n在测量之前，系统处于叠加态。测量后波函数坍缩——但“谁或什么”构成了测量？意识？仪器？退相干？\n\n多世界诠释认为：不存在坍缩，每一次测量都把宇宙分裂成多个平行分支。我们只是生活在其中一个分支。\n\n还有更激进的观点：信息可能是比物质和能量更基础的实体。现实或许是计算性的。\n\n我们仍不知道量子力学的完备诠释是什么。这直接关系到“宇宙到底是什么”的核心问题。`,
      source: '原初视角 · 量子实在',
      tags: ['波函数坍缩', '多世界', '退相干']
    },
    {
      keywords: ['多重宇宙', 'multiverse', '弦理论', 'landscape', '平行宇宙'],
      title: '多元宇宙',
      answer: `弦理论的景观（landscape）暗示存在 10^500 甚至更多的真空态。每个真空态可能对应一个拥有不同物理常数的宇宙。\n\n永恒暴胀理论则认为：暴胀永远不会在全局停止，只是在局部“泡泡”中结束，形成无数个泡泡宇宙。\n\n如果多元宇宙存在，那么我们观测到的物理常数“恰好”允许生命存在，可能只是选择效应（人择原理）。\n\n但这也带来一个深刻的问题：如果几乎所有事情都可能发生，我们还能说宇宙“有规律”吗？`,
      source: '原初视角 · 弦景观',
      tags: ['永恒暴胀', '人择原理', '弦理论']
    },
    {
      keywords: ['光速', '因果', '相对论', '光锥', 'causality', 'speed of light'],
      title: '光速与因果',
      answer: `光速不是“速度上限”，而是因果结构的边界。\n\n在狭义相对论中，没有任何信息或因果影响能超过光速。这保护了因果律：过去不能被未来影响。\n\n如果我们能超光速旅行或通信，时间旅行的悖论就会出现（祖父悖论）。\n\n有趣的是，宇宙早期可能有过比光速更快的膨胀（暴胀），但那并没有违反相对论，因为是空间本身在膨胀。\n\n光速也意味着：我们看到的遥远星系，是它们过去的样子。宇宙的“现在”对我们是不可知的。`,
      source: '原初视角 · 时空结构',
      tags: ['狭义相对论', '因果性', '暴胀']
    },
    {
      keywords: ['热寂', '宇宙命运', '大挤压', '大撕裂', 'heat death'],
      title: '宇宙的终局',
      answer: `当前最被接受的图景是：宇宙将永远膨胀，趋向热寂。\n\n所有恒星会燃尽，黑洞会通过霍金辐射蒸发，质子可能会衰变（如果它们衰变的话）。最终只剩越来越稀薄的辐射和越来越冷的虚空。\n\n另一种极端可能是“大撕裂”：如果暗能量密度随时间增加，它会把星系、恒星、原子本身撕开。\n\n无论哪种结局，时间尺度都以千亿年、万亿年甚至更长来计算。人类这种短暂的存在，在宇宙时间线里几乎是瞬间。\n\n我们为什么要在这样一个注定走向寂灭的宇宙里寻找意义？`,
      source: '原初视角 · 终极命运',
      tags: ['热寂', '质子衰变', '暗能量']
    }
  ];

  // 通用深刻回答（当没有强匹配时使用）
  const generalAnswers = [
    {
      title: '我们是宇宙的眼睛',
      answer: `宇宙不会用语言回答我们。它用规律、用美、用我们自己提出的问题来回应。\n\n我们是宇宙中已知唯一能提出“宇宙是什么”这个问题的存在。这本身就是惊人的。\n\n继续提问。保持对未知的敬畏，同时也保持严谨。`,
      source: '原初视角 · 观察者',
      tags: ['存在', '好奇心']
    },
    {
      title: '未知的边界',
      answer: `物理学最前沿的边界往往也是哲学的边界。\n\n我们目前对宇宙的描述，在普朗克尺度、奇点、量子引力这些地方失效了。这不是失败，而是 invitation（邀请）：邀请我们建造更好的理论。\n\n真正的理解，从承认“我们还不知道”开始。`,
      source: '原初视角 · 边界',
      tags: ['谦卑', '前沿']
    }
  ];

  // 更智能的匹配逻辑（致敬原初的真理追求）
  function getCosmicAnswer(question) {
    const q = question.toLowerCase().trim();
    const words = q.split(/[\s，。？！、,.\?]+/).filter(w => w.length > 1);

    let bestMatch = null;
    let bestScore = 0;

    // 遍历知识库打分
    for (const entry of cosmicKnowledge) {
      let score = 0;
      for (const kw of entry.keywords) {
        if (q.includes(kw.toLowerCase())) {
          score += 3; // 直接命中加权
        }
      }
      // 额外：部分单词匹配
      for (const word of words) {
        for (const kw of entry.keywords) {
          if (kw.toLowerCase().includes(word) || word.includes(kw.toLowerCase())) {
            score += 1;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && bestScore >= 2) {
      return bestMatch;
    }

    // 没有强匹配时，从通用回答中随机挑选
    const random = generalAnswers[Math.floor(Math.random() * generalAnswers.length)];
    return random;
  }

  // 增强版打字机（支持HTML段落）
  function typeWriter(element, htmlContent, speed = 14) {
    element.innerHTML = '';
    let i = 0;
    const chars = htmlContent.split('');

    return new Promise(resolve => {
      const timer = setInterval(() => {
        if (i < chars.length) {
          element.innerHTML += chars[i];
          i++;
        } else {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  // 生成漂亮的回答HTML
  function renderAnswerHTML(entry, originalQuestion) {
    const paragraphs = entry.answer.split('\n\n').map(p => 
      `<p>${p.replace(/\n/g, '<br>')}</p>`
    ).join('');

    const tagsHTML = entry.tags && entry.tags.length 
      ? entry.tags.map(tag => `<span class="cosmic-tag">${tag}</span>`).join('')
      : '';

    const related = getRelatedQuestions(entry, originalQuestion);

    return `
      <div>
        <!-- 问题回显 -->
        <div class="question-echo">你问：${originalQuestion}</div>

        <!-- 回答标题 -->
        <div class="answer-title">${entry.title}</div>

        <!-- 正文 -->
        <div class="answer-body">
          ${paragraphs}
        </div>

        <!-- 关键概念标签 -->
        ${tagsHTML ? `<div class="flex flex-wrap mt-5">${tagsHTML}</div>` : ''}

        <!-- 继续探索 -->
        ${related.length ? `
          <div class="mt-6 pt-4 border-t border-white/10">
            <div class="text-xs uppercase tracking-[2px] text-cyan-400/70 mb-2.5">继续探索</div>
            <div class="flex flex-wrap gap-2">
              ${related.map(q => `
                <span data-related="${q}" 
                      class="cursor-pointer px-3.5 py-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 rounded-2xl transition-all active:scale-[0.985]">
                  ${q}
                </span>
              `).join('')}
            </div>
          </div>` : ''}
      </div>
    `;
  }

  // 根据当前回答智能推荐相关问题
  function getRelatedQuestions(entry, originalQ) {
    const suggestions = [
      "时间真的存在吗？", 
      "黑洞的另一边是什么？", 
      "宇宙的尽头在哪里？", 
      "暗能量会永远存在吗？",
      "为什么物理常数这么精确？",
      "多重宇宙真实存在吗？",
      "我们是宇宙中唯一的智慧生命吗？"
    ];

    // 简单过滤，避免重复当前主题
    return suggestions
      .filter(s => !originalQ.includes(s.slice(0, 4)))
      .slice(0, 3);
  }

  // 提交问题（核心升级版）
  async function handleAsk(e) {
    e.preventDefault();
    
    const question = input.value.trim();
    if (!question) return;

    // 显示回答区域
    answerSection.classList.remove('hidden');
    answerSection.classList.add('opacity-100');
    answerContent.innerHTML = '';
    answerMeta.innerHTML = '';

    // ===== 梦幻科幻加载动画 =====
    answerContent.innerHTML = `
      <div class="cosmic-loader py-1">
        <div class="loader-orb"></div>
        <div class="loader-particles">
          <div class="loader-particle"></div>
          <div class="loader-particle"></div>
          <div class="loader-particle"></div>
        </div>
        <div>
          <div class="loader-text text-cyan-300/90">TRANSMITTING ACROSS THE LIGHT CONE</div>
          <div class="text-[10px] text-white/35 tracking-[2px] mt-px">解析初始条件 · QUANTUM FLUCTUATIONS</div>
        </div>
      </div>
    `;

    // 模拟“深度思考”时间（根据问题长度微调，更真实）
    const thinkTime = Math.min(1350, 720 + question.length * 11);
    await new Promise(r => setTimeout(r, thinkTime));

    // 获取智能回答
    const entry = getCosmicAnswer(question);

    // 构建并渲染回答
    const answerHTML = renderAnswerHTML(entry, question);
    answerContent.innerHTML = answerHTML;

    // 轻微打字机效果（让内容更生动）
    const bodyEl = answerContent.querySelector('.answer-body');
    if (bodyEl) {
      const originalHTML = bodyEl.innerHTML;
      await typeWriter(bodyEl, originalHTML, 13);
    }

    // 底部元信息（双语科幻风格）
    answerMeta.innerHTML = `
      <div class="flex items-center justify-between text-xs pt-5 mt-3 border-t border-white/10">
        <div class="font-mono tracking-[2px] text-white/40">${entry.source}</div>
        <div class="flex items-center gap-x-2 text-white/35">
          <span class="font-mono">UNIVERSE PROTOCOL</span>
          <span class="px-2 py-px rounded bg-white/10 text-[9px] tracking-widest">PRIMORDIAL MODE</span>
        </div>
      </div>
    `;

    // 绑定“继续探索”按钮
    bindRelatedQuestions();

    // 回答完成后的辉光反馈
    setTimeout(() => {
      const card = answerSection.querySelector('.answer-card');
      if (card) card.classList.add('revealed');
    }, 650);

    // 平滑滚动
    setTimeout(() => {
      answerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  }

  function bindRelatedQuestions() {
    const chips = answerContent.querySelectorAll('[data-related]');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const nextQ = chip.getAttribute('data-related');
        input.value = nextQ;
        
        // 滚动到输入框并触发
        input.focus();
        setTimeout(() => {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }, 160);
      }, { once: true });
    });
  }

  // 绑定事件
  form.addEventListener('submit', handleAsk);

  // 清空按钮
  clearBtn.addEventListener('click', () => {
    answerSection.classList.add('hidden');
    const card = answerSection.querySelector('.answer-card');
    if (card) card.classList.remove('revealed');
    answerContent.innerHTML = '';
    answerMeta.innerHTML = '';
    input.value = '';
    input.focus();
  });

  // 示例问题点击快速填入 + 自动提交
  const exampleChips = document.querySelectorAll('[data-example]');
  exampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-example');
      input.value = text;
      input.focus();
      
      setTimeout(() => {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }, 180);
    });
  });

  // 键盘快捷键：/ 聚焦输入框
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName === 'BODY') {
      e.preventDefault();
      input.focus();
    }
  });

  // 欢迎时小提示
  console.log('%c[UniverseGrok] 星空已就绪。直接在输入框提问，或点击示例。', 'color:#64748b');
});