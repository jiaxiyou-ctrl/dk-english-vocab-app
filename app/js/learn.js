const Learn = {
  maskEnabled: false,
  revealedWords: new Set(),
  observer: null,
  syncScrolling: false,
  topicData: null,
  topicsIndex: null,
  imageMap: [],
  visibilityMap: {},
  activeSectionIndex: null,
  bottomPull: {
    active: false,
    ready: false,
    startY: 0
  },
  wheelPullCount: 0,

  render(container, topicData, topicsIndex) {
    this.topicData = topicData;
    this.topicsIndex = topicsIndex;
    this.maskEnabled = false;
    this.revealedWords = new Set();
    this.visibilityMap = {};
    this.activeSectionIndex = null;
    this.bottomPull = { active: false, ready: false, startY: 0 };
    this.wheelPullCount = 0;

    const totalWords = this.getTotalWords(topicData);
    const nextTopic = this.getAdjacentTopic(topicData.id, 1);
    Progress.recordStudy(topicData.id, totalWords);

    const html = `
      <div class="learn-shell">
        <div class="learn-header">
          <button class="back-btn" onclick="window.location.hash='#/'" aria-label="返回首页">←</button>
          <div class="learn-title">
            <span>${topicData.id} ${topicData.title}</span>
            <small>${topicData.titleEn}</small>
          </div>
          ${this.renderTopicPicker(topicData.id, topicsIndex)}
          <button class="image-toggle-btn" onclick="Learn.toggleImagePanel()">收起图片</button>
        </div>
        ${this.renderTopicOverlay(topicData.id, topicsIndex)}
        <div class="learn-body">
          <div class="image-panel" id="imagePanel">
            ${this.renderImages(topicData)}
            ${this.renderImageEnd(topicData, nextTopic)}
          </div>
          <div class="word-panel">
            <div class="word-panel-controls">
              <div class="control-caption">
                <strong>${totalWords}</strong>
                <span>个词</span>
              </div>
              <div class="toggle-group">
                <span>遮蔽中文</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="maskToggle" onchange="Learn.onMaskToggle(this.checked)">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="toggle-group">
                <span>点击发音</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="speechToggle" checked onchange="Speech.setEnabled(this.checked)">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="word-list" id="wordList">
              ${this.renderWords(topicData)}
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.setupScrollSync();
    this.setupBottomPull();
  },

  getTotalWords(topicData) {
    return topicData.pages.reduce((sum, page) => sum + page.words.length, 0);
  },

  renderImages(topicData) {
    const seen = new Set();
    const fragments = [];
    this.imageMap = [];

    topicData.pages.forEach((page, sectionIndex) => {
      if (seen.has(page.image)) return;
      seen.add(page.image);
      const imageIndex = this.imageMap.length;
      this.imageMap.push({ image: page.image, pageNum: page.pageNum, sectionIndex });
      fragments.push(`
        <figure class="book-page" data-img-index="${imageIndex}">
          <img src="${page.image}" alt="${topicData.title} 第 ${page.pageNum} 页" loading="lazy">
          <figcaption>第 ${page.pageNum} 页</figcaption>
        </figure>
      `);
    });

    return fragments.join('');
  },

  renderImageEnd(topicData, nextTopic) {
    const nextButton = nextTopic
      ? `<button class="end-primary" onclick="Learn.goToTopic('${nextTopic.id}')">进入 ${nextTopic.id} ${nextTopic.title}</button>`
      : `<button class="end-primary" disabled>已经是最后一章</button>`;

    const hint = nextTopic
      ? `继续下滑释放，进入 ${nextTopic.id} ${nextTopic.title}`
      : '已经读到最后一章';

    return `
      <div class="chapter-end" id="chapterEnd">
        <div class="pull-hint" id="pullHint">${hint}</div>
        <div class="chapter-end-card">
          <span class="end-kicker">${topicData.id} ${topicData.title}</span>
          <h2>本章已到结尾</h2>
          <p>可以回到本章顶部再看一遍，也可以直接进入下一章继续浏览。</p>
          <div class="end-actions">
            <button class="end-secondary" onclick="Learn.scrollCurrentTopicTop()">返回本章顶部</button>
            ${nextButton}
          </div>
        </div>
      </div>
    `;
  },

  renderWords(topicData) {
    let html = '';
    topicData.pages.forEach((page, sectionIndex) => {
      html += `
        <div class="section-divider" data-section-index="${sectionIndex}">
          <span>${page.section}</span>
          <strong>${page.sectionTitle}</strong>
        </div>
      `;

      page.words.forEach(word => {
        const progress = Progress.getTopicProgress(topicData.id);
        const isLearned = progress && progress.learnedWords.includes(word.id);
        const safeEn = word.en.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        html += `
          <button class="word-item ${isLearned ? 'learned' : ''}"
                  data-word-id="${word.id}"
                  onclick="Learn.onWordClick(this, '${safeEn}', ${word.id})">
            <span class="word-num">${word.id}</span>
            <span class="word-main">
              <span class="word-en">${word.en}</span>
              <span class="word-zh" id="zh-${word.id}">${word.zh}</span>
            </span>
          </button>
        `;
      });
    });
    html += this.renderWordEnd(topicData);
    return html;
  },

  renderWordEnd(topicData) {
    const nextTopic = this.getAdjacentTopic(topicData.id, 1);
    const nextButton = nextTopic
      ? `<button class="end-primary" onclick="Learn.goToTopic('${nextTopic.id}')">下一章：${nextTopic.title}</button>`
      : `<button class="end-primary" disabled>已经是最后一章</button>`;

    return `
      <div class="word-end">
        <span>${topicData.id} ${topicData.title}</span>
        <strong>词表已到结尾</strong>
        <small class="word-pull-hint" id="wordPullHint">${nextTopic ? `继续下滑释放，进入 ${nextTopic.id} ${nextTopic.title}` : '已经读到最后一章'}</small>
        <div class="end-actions compact">
          <button class="end-secondary" onclick="Learn.scrollCurrentTopicTop()">返回顶部</button>
          ${nextButton}
        </div>
      </div>
    `;
  },

  setupScrollSync() {
    if (this.observer) this.observer.disconnect();

    const imagePanel = document.getElementById('imagePanel');
    const figures = imagePanel.querySelectorAll('.book-page[data-img-index]');
    if (!figures.length) return;

    this.observer = new IntersectionObserver((entries) => {
      if (this.syncScrolling) return;

      entries.forEach(entry => {
        this.visibilityMap[entry.target.dataset.imgIndex] = entry.intersectionRatio;
      });

      let bestIndex = null;
      let bestRatio = 0;
      Object.entries(this.visibilityMap).forEach(([idx, ratio]) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestIndex = Number(idx);
        }
      });

      if (bestIndex === null || bestRatio < 0.18) return;
      const targetSectionIndex = this.imageMap[bestIndex].sectionIndex;
      if (targetSectionIndex !== this.activeSectionIndex) {
        this.scrollWordListToSection(targetSectionIndex);
      }
    }, {
      root: imagePanel,
      threshold: [0, 0.18, 0.35, 0.55, 0.75, 1]
    });

    figures.forEach(figure => this.observer.observe(figure));
  },

  scrollWordListToSection(sectionIndex) {
    const target = document.querySelector(`.section-divider[data-section-index="${sectionIndex}"]`);
    if (!target) return;

    this.activeSectionIndex = sectionIndex;
    document.querySelectorAll('.section-divider').forEach(divider => {
      divider.classList.toggle('active', divider === target);
    });

    this.syncScrolling = true;
    const wordList = document.getElementById('wordList');
    wordList.scrollTo({
      top: target.offsetTop - wordList.offsetTop - 8,
      behavior: 'smooth'
    });
    setTimeout(() => { this.syncScrolling = false; }, 450);
  },

  renderTopicPicker(currentId, topicsIndex) {
    const currentTopic = this.flattenTopics(topicsIndex).find(topic => topic.id === currentId);
    return `
      <button class="topic-picker-button" onclick="Learn.openTopicPicker()" aria-label="切换学习单元">
        <span>${currentTopic.id} ${currentTopic.title}</span>
        <small>${currentTopic.titleEn}</small>
      </button>
    `;
  },

  renderTopicOverlay(currentId, topicsIndex) {
    return `
      <div class="topic-overlay" id="topicOverlay" aria-hidden="true">
        <div class="topic-overlay-backdrop" onclick="Learn.closeTopicPicker()"></div>
        <div class="topic-dialog" role="dialog" aria-modal="true" aria-label="选择学习单元">
          <div class="topic-dialog-header">
            <div>
              <strong>选择单元</strong>
              <span>按分类快速跳转</span>
            </div>
            <button onclick="Learn.closeTopicPicker()" aria-label="关闭">×</button>
          </div>
          <input class="topic-search" id="topicSearch" placeholder="搜索单元、中文或英文" oninput="Learn.filterTopicPicker(this.value)">
          <div class="topic-dialog-list" id="topicDialogList">
            ${this.renderTopicDialogList(currentId, topicsIndex)}
          </div>
        </div>
      </div>
    `;
  },

  renderTopicDialogList(currentId, topicsIndex) {
    return topicsIndex.categories.map(category => {
      const items = category.topics
        .filter(topic => topic.hasData)
        .map(topic => {
          const active = topic.id === currentId ? 'active' : '';
          return `
            <button class="topic-option ${active}"
                    data-search="${`${topic.id} ${topic.title} ${topic.titleEn}`.toLowerCase()}"
                    onclick="Learn.goToTopic('${topic.id}')">
              <span class="topic-option-id">${topic.id}</span>
              <span class="topic-option-main">
                <strong>${topic.title}</strong>
                <small>${topic.titleEn}</small>
              </span>
            </button>
          `;
        }).join('');

      return `
        <section class="topic-option-group">
          <div class="topic-option-category">
            <span style="background:${category.color}"></span>
            ${category.name}
          </div>
          ${items}
        </section>
      `;
    }).join('');
  },

  flattenTopics(topicsIndex = this.topicsIndex) {
    return topicsIndex.categories.flatMap(category => category.topics.filter(topic => topic.hasData));
  },

  getAdjacentTopic(topicId, direction) {
    const topics = this.flattenTopics();
    const index = topics.findIndex(topic => topic.id === topicId);
    if (index === -1) return null;
    return topics[index + direction] || null;
  },

  openTopicPicker() {
    const overlay = document.getElementById('topicOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => document.getElementById('topicSearch')?.focus(), 50);
  },

  closeTopicPicker() {
    const overlay = document.getElementById('topicOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  },

  filterTopicPicker(value) {
    const query = value.trim().toLowerCase();
    document.querySelectorAll('.topic-option').forEach(option => {
      const matched = !query || option.dataset.search.includes(query);
      option.hidden = !matched;
    });
  },

  goToTopic(topicId) {
    window.location.hash = `#/learn/${topicId}`;
  },

  scrollCurrentTopicTop() {
    document.getElementById('imagePanel')?.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('wordList')?.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setupBottomPull() {
    const imagePanel = document.getElementById('imagePanel');
    const wordList = document.getElementById('wordList');
    const nextTopic = this.getAdjacentTopic(this.topicData.id, 1);
    if (!nextTopic) return;

    const threshold = 76;

    const bindPanel = panel => {
      if (!panel) return;

      panel.addEventListener('pointerdown', event => {
        if (!this.isPanelAtBottom(panel)) return;
        this.bottomPull = { active: true, ready: false, startY: event.clientY };
      });

      panel.addEventListener('pointermove', event => {
        if (!this.bottomPull.active) return;
        const distance = this.bottomPull.startY - event.clientY;
        this.setPullHint(distance, threshold, nextTopic);
      });

      panel.addEventListener('pointerup', () => this.finishBottomPull(nextTopic));
      panel.addEventListener('pointercancel', () => this.resetPullHint(nextTopic));

      panel.addEventListener('wheel', event => {
        if (!this.isPanelAtBottom(panel) || event.deltaY < 18) return;
        const hints = this.getPullHints();
        if (!hints.length) return;
        this.wheelPullCount += 1;
        const text = this.wheelPullCount >= 2
          ? `正在进入 ${nextTopic.id} ${nextTopic.title}`
          : `再向下滚动，进入 ${nextTopic.id} ${nextTopic.title}`;
        hints.forEach(hint => {
          hint.classList.add('ready');
          hint.textContent = text;
        });
        window.clearTimeout(this.wheelTimer);
        if (this.wheelPullCount >= 2) {
          this.wheelTimer = window.setTimeout(() => this.goToTopic(nextTopic.id), 260);
        } else {
          this.wheelTimer = window.setTimeout(() => {
            this.wheelPullCount = 0;
            this.resetPullHint(nextTopic);
          }, 900);
        }
      }, { passive: true });
    };

    bindPanel(imagePanel);
    bindPanel(wordList);
  },

  isPanelAtBottom(panel) {
    return panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 6;
  },

  setPullHint(distance, threshold, nextTopic) {
    const hints = this.getPullHints();
    if (!hints.length || distance <= 0) return;
    const progress = Math.min(distance / threshold, 1);
    this.bottomPull.ready = distance >= threshold;
    const text = this.bottomPull.ready
      ? `释放进入 ${nextTopic.id} ${nextTopic.title}`
      : `继续下滑进入 ${nextTopic.id} ${nextTopic.title}`;
    hints.forEach(hint => {
      hint.style.transform = `translateY(${Math.min(distance * 0.28, 26)}px)`;
      hint.style.opacity = `${0.55 + progress * 0.45}`;
      hint.classList.toggle('ready', this.bottomPull.ready);
      hint.textContent = text;
    });
  },

  finishBottomPull(nextTopic) {
    if (!this.bottomPull.active) return;
    if (this.bottomPull.ready) {
      this.goToTopic(nextTopic.id);
      return;
    }
    this.resetPullHint(nextTopic);
  },

  resetPullHint(nextTopic) {
    this.bottomPull = { active: false, ready: false, startY: 0 };
    this.wheelPullCount = 0;
    this.getPullHints().forEach(hint => {
      hint.classList.remove('ready');
      hint.style.transform = '';
      hint.style.opacity = '';
      hint.textContent = `继续下滑释放，进入 ${nextTopic.id} ${nextTopic.title}`;
    });
  },

  getPullHints() {
    return [document.getElementById('pullHint'), document.getElementById('wordPullHint')].filter(Boolean);
  },

  onWordClick(el, enText, wordId) {
    const totalWords = this.getTotalWords(this.topicData);

    if (this.maskEnabled) {
      const zhEl = document.getElementById(`zh-${wordId}`);
      if (zhEl && zhEl.classList.contains('hidden')) {
        zhEl.classList.remove('hidden');
        zhEl.classList.add('revealed');
        this.revealedWords.add(wordId);
      }
    }

    Speech.speak(enText);
    Progress.markWordLearned(this.topicData.id, wordId, totalWords);
    el.classList.add('learned');
  },

  onMaskToggle(enabled) {
    this.maskEnabled = enabled;
    this.revealedWords.clear();
    document.querySelectorAll('.word-zh').forEach(el => {
      el.classList.remove('revealed');
      el.classList.toggle('hidden', enabled);
    });
  },

  toggleImagePanel() {
    const panel = document.getElementById('imagePanel');
    const btn = document.querySelector('.image-toggle-btn');
    const collapsed = panel.classList.toggle('collapsed');
    btn.textContent = collapsed ? '展开图片' : '收起图片';
  }
};
