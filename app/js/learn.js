const Learn = {
  maskEnabled: false,
  revealedWords: new Set(),
  observer: null,
  syncScrolling: false,
  topicData: null,
  imageMap: [],
  visibilityMap: {},
  activeSectionIndex: null,

  render(container, topicData, topicsIndex) {
    this.topicData = topicData;
    this.maskEnabled = false;
    this.revealedWords = new Set();
    this.visibilityMap = {};
    this.activeSectionIndex = null;

    const totalWords = this.getTotalWords(topicData);
    Progress.recordStudy(topicData.id, totalWords);

    const html = `
      <div class="learn-shell">
        <div class="learn-header">
          <button class="back-btn" onclick="window.location.hash='#/'" aria-label="返回首页">←</button>
          <div class="learn-title">
            <span>${topicData.id} ${topicData.title}</span>
            <small>${topicData.titleEn}</small>
          </div>
          ${this.renderTopicSelect(topicData.id, topicsIndex)}
          <button class="image-toggle-btn" onclick="Learn.toggleImagePanel()">收起图片</button>
        </div>
        <div class="learn-body">
          <div class="image-panel" id="imagePanel">
            ${this.renderImages(topicData)}
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
    return html;
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

  renderTopicSelect(currentId, topicsIndex) {
    let options = '';
    topicsIndex.categories.forEach(category => {
      category.topics.forEach(topic => {
        if (!topic.hasData) return;
        const selected = topic.id === currentId ? 'selected' : '';
        options += `<option value="${topic.id}" ${selected}>${topic.id} ${topic.title} - ${topic.titleEn}</option>`;
      });
    });
    return `<select onchange="Learn.onTopicSelect(this.value)" aria-label="切换学习单元">${options}</select>`;
  },

  onTopicSelect(topicId) {
    window.location.hash = `#/learn/${topicId}`;
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
