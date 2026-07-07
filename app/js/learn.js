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
  edgePull: {
    active: false,
    ready: false,
    startY: 0,
    edge: null
  },
  wheelPull: {
    edge: null,
    count: 0,
    distance: 0
  },
  drawerExpanded: false,
  drawerDrag: {
    startY: 0,
    moved: false
  },
  wheelTimer: null,

  render(container, topicData, topicsIndex) {
    this.topicData = topicData;
    this.topicsIndex = topicsIndex;
    this.maskEnabled = false;
    this.revealedWords = new Set();
    this.visibilityMap = {};
    this.activeSectionIndex = null;
    this.edgePull = { active: false, ready: false, startY: 0, edge: null };
    this.wheelPull = { edge: null, count: 0, distance: 0 };
    this.drawerExpanded = false;
    this.drawerDrag = { startY: 0, moved: false };

    const totalWords = this.getTotalWords(topicData);
    const prevTopic = this.getAdjacentTopic(topicData.id, -1);
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
            ${this.renderImageStart(topicData, prevTopic)}
            ${this.renderImages(topicData)}
            ${this.renderImageEnd(topicData, nextTopic)}
          </div>
          <div class="word-panel" id="wordPanel">
            <button class="word-drawer-handle" id="wordDrawerHandle" type="button" aria-expanded="false">
              <span></span>
              <strong>词表</strong>
              <small id="wordDrawerHint">上滑展开</small>
            </button>
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
    this.setupEdgePull();
    this.setupMobileDrawer();
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

  renderImageStart(topicData, prevTopic) {
    const prevButton = prevTopic
      ? `<button class="end-primary" onclick="Learn.goToTopic('${prevTopic.id}')">进入 ${prevTopic.id} ${prevTopic.title}</button>`
      : `<button class="end-primary" disabled>已经是第一章</button>`;

    const hint = prevTopic
      ? `在顶部继续向上滚动释放，进入 ${prevTopic.id} ${prevTopic.title}`
      : '已经是第一章';

    return `
      <div class="chapter-start" id="chapterStart">
        <div class="top-pull-hint" id="pullTopHint">${hint}</div>
        <div class="chapter-start-card">
          <span class="end-kicker">${topicData.id} ${topicData.title}</span>
          <h2>本章开头</h2>
          <p>可以直接进入上一章，也可以跳到本章结尾快速继续。</p>
          <div class="end-actions">
            ${prevButton}
            <button class="end-secondary" onclick="Learn.scrollCurrentTopicBottom()">跳到本章结尾</button>
          </div>
        </div>
      </div>
    `;
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
    let html = this.renderWordStart(topicData);
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

  renderWordStart(topicData) {
    const prevTopic = this.getAdjacentTopic(topicData.id, -1);
    const prevButton = prevTopic
      ? `<button class="end-primary" onclick="Learn.goToTopic('${prevTopic.id}')">上一章：${prevTopic.title}</button>`
      : `<button class="end-primary" disabled>已经是第一章</button>`;

    return `
      <div class="word-start">
        <span>${topicData.id} ${topicData.title}</span>
        <strong>词表开头</strong>
        <small class="word-top-pull-hint" id="wordPullTopHint">${prevTopic ? `继续向上滚动释放，进入 ${prevTopic.id} ${prevTopic.title}` : '已经是第一章'}</small>
        <div class="end-actions compact">
          ${prevButton}
          <button class="end-secondary" onclick="Learn.scrollCurrentTopicBottom()">跳到结尾</button>
        </div>
      </div>
    `;
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

      if (this.isImagePanelAtTopicStart(imagePanel)) {
        this.scrollWordListToTopicStart();
        return;
      }

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

  isImagePanelAtTopicStart(imagePanel) {
    const chapterStart = document.getElementById('chapterStart');
    if (!chapterStart) return imagePanel.scrollTop <= 8;
    return imagePanel.scrollTop <= chapterStart.offsetTop + chapterStart.offsetHeight * 0.7;
  },

  scrollWordListToTopicStart() {
    this.activeSectionIndex = null;
    document.querySelectorAll('.section-divider').forEach(divider => {
      divider.classList.remove('active');
    });

    const wordList = document.getElementById('wordList');
    if (!wordList || wordList.scrollTop <= 2) return;

    this.syncScrolling = true;
    wordList.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { this.syncScrolling = false; }, 450);
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

  scrollCurrentTopicBottom() {
    const imagePanel = document.getElementById('imagePanel');
    const wordList = document.getElementById('wordList');
    if (imagePanel) {
      imagePanel.scrollTo({ top: imagePanel.scrollHeight - imagePanel.clientHeight, behavior: 'smooth' });
    }
    if (wordList) {
      wordList.scrollTo({ top: wordList.scrollHeight - wordList.clientHeight, behavior: 'smooth' });
    }
  },

  setupMobileDrawer() {
    const panel = document.getElementById('wordPanel');
    const handle = document.getElementById('wordDrawerHandle');
    if (!panel || !handle) return;

    const toggleFromGesture = event => {
      const deltaY = event.clientY - this.drawerDrag.startY;
      if (Math.abs(deltaY) < 24) return false;
      this.toggleWordDrawer(deltaY < 0);
      return true;
    };

    handle.addEventListener('click', () => {
      if (this.drawerDrag.moved) {
        this.drawerDrag.moved = false;
        return;
      }
      this.toggleWordDrawer();
    });

    handle.addEventListener('pointerdown', event => {
      this.drawerDrag = { startY: event.clientY, moved: false };
      handle.setPointerCapture?.(event.pointerId);
    });

    handle.addEventListener('pointerup', event => {
      this.drawerDrag.moved = toggleFromGesture(event);
    });

    handle.addEventListener('pointercancel', () => {
      this.drawerDrag = { startY: 0, moved: false };
    });

    this.applyWordDrawerState();
  },

  toggleWordDrawer(forceExpanded = null) {
    this.drawerExpanded = forceExpanded === null ? !this.drawerExpanded : forceExpanded;
    this.applyWordDrawerState();
  },

  applyWordDrawerState() {
    const panel = document.getElementById('wordPanel');
    const handle = document.getElementById('wordDrawerHandle');
    const hint = document.getElementById('wordDrawerHint');
    if (!panel || !handle) return;

    panel.classList.toggle('expanded', this.drawerExpanded);
    handle.setAttribute('aria-expanded', String(this.drawerExpanded));
    if (hint) hint.textContent = this.drawerExpanded ? '下滑收起' : '上滑展开';
  },

  setupEdgePull() {
    const imagePanel = document.getElementById('imagePanel');
    const wordList = document.getElementById('wordList');
    const prevTopic = this.getAdjacentTopic(this.topicData.id, -1);
    const nextTopic = this.getAdjacentTopic(this.topicData.id, 1);
    if (!prevTopic && !nextTopic) return;

    const threshold = 150;
    const minWheelDelta = 32;
    const requiredWheelCount = 7;
    const requiredWheelDistance = 680;
    const wheelResetDelay = 1250;

    const getTopicForEdge = edge => edge === 'top' ? prevTopic : nextTopic;
    const getEdgeLabel = edge => edge === 'top' ? '向上' : '向下';
    const resetActivePull = () => {
      if (!this.edgePull.edge) return;
      const edge = this.edgePull.edge;
      this.resetPullHint(edge, getTopicForEdge(edge));
    };

    const bindPanel = panel => {
      if (!panel) return;

      panel.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

        const edge = this.isPanelAtTop(panel)
          ? 'top'
          : this.isPanelAtBottom(panel)
            ? 'bottom'
            : null;
        const targetTopic = edge ? getTopicForEdge(edge) : null;
        if (!edge || !targetTopic) return;

        this.edgePull = { active: true, ready: false, startY: event.clientY, edge };
      });

      panel.addEventListener('pointermove', event => {
        if (!this.edgePull.active) return;
        const edge = this.edgePull.edge;
        const distance = edge === 'top'
          ? event.clientY - this.edgePull.startY
          : this.edgePull.startY - event.clientY;
        this.setPullHint(edge, distance, threshold, getTopicForEdge(edge));
      });

      panel.addEventListener('pointerup', () => this.finishEdgePull(prevTopic, nextTopic));
      panel.addEventListener('pointercancel', resetActivePull);

      panel.addEventListener('wheel', event => {
        const edge = event.deltaY <= -minWheelDelta && this.isPanelAtTop(panel)
          ? 'top'
          : event.deltaY >= minWheelDelta && this.isPanelAtBottom(panel)
            ? 'bottom'
            : null;
        const targetTopic = edge ? getTopicForEdge(edge) : null;
        if (!edge || !targetTopic) return;

        const hints = this.getPullHints(edge);
        if (!hints.length) return;

        if (this.wheelPull.edge !== edge) {
          this.wheelPull = { edge, count: 0, distance: 0 };
          this.resetWheelHint(edge === 'top' ? 'bottom' : 'top');
        }

        this.wheelPull.count += 1;
        this.wheelPull.distance += Math.abs(event.deltaY);

        const ready = this.wheelPull.count >= requiredWheelCount && this.wheelPull.distance >= requiredWheelDistance;
        const remaining = Math.max(requiredWheelCount - this.wheelPull.count, 0);
        const text = ready
          ? `正在进入 ${targetTopic.id} ${targetTopic.title}`
          : `继续${getEdgeLabel(edge)}滚动，进入 ${targetTopic.id} ${targetTopic.title}${remaining ? `（还需 ${remaining} 次）` : ''}`;
        hints.forEach(hint => {
          hint.classList.toggle('ready', ready);
          hint.style.opacity = ready ? '1' : '0.82';
          hint.textContent = text;
        });
        window.clearTimeout(this.wheelTimer);
        if (ready) {
          this.wheelTimer = window.setTimeout(() => this.goToTopic(targetTopic.id), 260);
        } else {
          this.wheelTimer = window.setTimeout(() => {
            this.wheelPull = { edge: null, count: 0, distance: 0 };
            this.resetPullHint(edge, targetTopic);
          }, wheelResetDelay);
        }
      }, { passive: true });
    };

    bindPanel(imagePanel);
    bindPanel(wordList);
  },

  isPanelAtTop(panel) {
    return panel.scrollTop <= 6;
  },

  isPanelAtBottom(panel) {
    return panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 6;
  },

  setPullHint(edge, distance, threshold, targetTopic) {
    const hints = this.getPullHints(edge);
    if (!hints.length || distance <= 0) return;
    const progress = Math.min(distance / threshold, 1);
    this.edgePull.ready = distance >= threshold;
    const text = this.edgePull.ready
      ? `释放进入 ${targetTopic.id} ${targetTopic.title}`
      : `${edge === 'top' ? '继续向上' : '继续下滑'}进入 ${targetTopic.id} ${targetTopic.title}`;
    const direction = edge === 'top' ? -1 : 1;
    hints.forEach(hint => {
      hint.style.transform = `translateY(${direction * Math.min(distance * 0.22, 30)}px)`;
      hint.style.opacity = `${0.55 + progress * 0.45}`;
      hint.classList.toggle('ready', this.edgePull.ready);
      hint.textContent = text;
    });
  },

  finishEdgePull(prevTopic, nextTopic) {
    if (!this.edgePull.active) return;
    const edge = this.edgePull.edge;
    const targetTopic = edge === 'top' ? prevTopic : nextTopic;
    if (this.edgePull.ready && targetTopic) {
      this.goToTopic(targetTopic.id);
      return;
    }
    this.resetPullHint(edge, targetTopic);
  },

  resetPullHint(edge, targetTopic) {
    this.edgePull = { active: false, ready: false, startY: 0, edge: null };
    this.wheelPull = { edge: null, count: 0, distance: 0 };
    this.getPullHints(edge).forEach(hint => {
      hint.classList.remove('ready');
      hint.style.transform = '';
      hint.style.opacity = '';
      hint.textContent = this.getPullDefaultText(edge, targetTopic);
    });
  },

  resetWheelHint(edge) {
    const targetTopic = edge === 'top'
      ? this.getAdjacentTopic(this.topicData.id, -1)
      : this.getAdjacentTopic(this.topicData.id, 1);
    this.getPullHints(edge).forEach(hint => {
      hint.classList.remove('ready');
      hint.style.opacity = '';
      hint.textContent = this.getPullDefaultText(edge, targetTopic);
    });
  },

  getPullDefaultText(edge, targetTopic) {
    if (!targetTopic) return edge === 'top' ? '已经是第一章' : '已经读到最后一章';
    return edge === 'top'
      ? `在顶部继续向上滚动释放，进入 ${targetTopic.id} ${targetTopic.title}`
      : `继续下滑释放，进入 ${targetTopic.id} ${targetTopic.title}`;
  },

  getPullHints(edge) {
    const ids = edge === 'top'
      ? ['pullTopHint', 'wordPullTopHint']
      : ['pullHint', 'wordPullHint'];
    return ids.map(id => document.getElementById(id)).filter(Boolean);
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
