const Learn = {
  maskEnabled: false,
  revealedWords: new Set(),
  observer: null,
  syncScrolling: false,

  render(container, topicData, topicsIndex) {
    this.topicData = topicData;
    this.maskEnabled = false;
    this.revealedWords = new Set();

    const totalWords = topicData.pages.reduce((sum, p) => sum + p.words.length, 0);
    Progress.recordStudy(topicData.id, totalWords);

    const html = `
      <div class="learn-header">
        <button class="back-btn" onclick="window.location.hash='#/'">&larr;</button>
        ${this.renderTopicSelect(topicData.id, topicsIndex)}
        <button class="image-toggle-btn" onclick="Learn.toggleImagePanel()">收起图片</button>
      </div>
      <div class="learn-body">
        <div class="image-panel" id="imagePanel">
          ${this.renderUniqueImages(topicData)}
        </div>
        <div class="word-panel">
          <div class="word-panel-controls">
            <div class="toggle-group">
              <span>遮蔽</span>
              <label class="toggle-switch">
                <input type="checkbox" id="maskToggle" onchange="Learn.onMaskToggle(this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="toggle-group">
              <span>发音</span>
              <label class="toggle-switch">
                <input type="checkbox" id="speechToggle" checked onchange="Speech.setEnabled(this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="word-list" id="wordList">
            ${this.renderWordList(topicData)}
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    this.setupScrollSync();
  },

  renderUniqueImages(topicData) {
    const seen = new Set();
    const imageMap = [];
    topicData.pages.forEach((p, i) => {
      if (!seen.has(p.image)) {
        seen.add(p.image);
        imageMap.push({ image: p.image, pageNum: p.pageNum, firstSectionIndex: i });
      }
    });
    this.imageMap = imageMap;
    return imageMap.map((m, imgIdx) =>
      `<img src="${m.image}" alt="Page ${m.pageNum}" data-img-index="${imgIdx}">`
    ).join('');
  },

  setupScrollSync() {
    if (this.observer) this.observer.disconnect();

    const imagePanel = document.getElementById('imagePanel');
    const images = imagePanel.querySelectorAll('img[data-img-index]');
    if (images.length === 0) return;

    this.observer = new IntersectionObserver((entries) => {
      if (this.syncScrolling) return;

      let mostVisible = null;
      let maxRatio = 0;
      entries.forEach(entry => {
        if (entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostVisible = entry.target;
        }
      });

      if (mostVisible && maxRatio > 0.3) {
        const imgIdx = parseInt(mostVisible.dataset.imgIndex);
        const sectionIdx = this.imageMap[imgIdx].firstSectionIndex;
        this.scrollWordListToSection(sectionIdx);
      }
    }, {
      root: imagePanel,
      threshold: [0, 0.3, 0.5, 0.7, 1.0]
    });

    images.forEach(img => this.observer.observe(img));
  },

  scrollWordListToSection(sectionIndex) {
    const dividers = document.querySelectorAll('.section-divider');
    const target = dividers[sectionIndex];
    if (!target) return;

    if (target.dataset.active === 'true') return;

    dividers.forEach(d => d.dataset.active = 'false');
    target.dataset.active = 'true';

    this.syncScrolling = true;
    const wordList = document.getElementById('wordList');
    const offset = target.offsetTop - wordList.offsetTop;
    wordList.scrollTo({ top: offset, behavior: 'smooth' });

    setTimeout(() => { this.syncScrolling = false; }, 500);
  },

  renderTopicSelect(currentId, topicsIndex) {
    let options = '';
    topicsIndex.categories.forEach(cat => {
      cat.topics.forEach(t => {
        if (t.hasData) {
          const selected = t.id === currentId ? 'selected' : '';
          options += `<option value="${t.id}" ${selected}>${t.id} ${t.title} - ${t.titleEn}</option>`;
        }
      });
    });
    return `<select onchange="window.location.hash='#/learn/'+this.value">${options}</select>`;
  },

  renderWordList(topicData) {
    let html = '';
    topicData.pages.forEach((page, i) => {
      html += `<div class="section-divider" data-section-index="${i}">${page.section} ${page.sectionTitle}</div>`;
      page.words.forEach(word => {
        const progress = Progress.getTopicProgress(topicData.id);
        const isLearned = progress && progress.learnedWords.includes(word.id);
        html += `
          <div class="word-item ${isLearned ? 'learned' : ''}"
               data-word-id="${word.id}"
               data-en="${word.en}"
               onclick="Learn.onWordClick(this, '${word.en.replace(/'/g, "\\'")}', ${word.id})">
            <span class="word-num">${word.id}</span>
            <span class="word-en">${word.en}</span>
            <span class="word-zh" id="zh-${word.id}">${word.zh}</span>
          </div>
        `;
      });
    });
    return html;
  },

  onWordClick(el, enText, wordId) {
    const totalWords = this.topicData.pages.reduce((sum, p) => sum + p.words.length, 0);

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
    const zhElements = document.querySelectorAll('.word-zh');
    zhElements.forEach(el => {
      el.classList.remove('revealed');
      if (enabled) {
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    });
  },

  toggleImagePanel() {
    const panel = document.getElementById('imagePanel');
    const btn = document.querySelector('.image-toggle-btn');
    if (panel.classList.contains('collapsed')) {
      panel.classList.remove('collapsed');
      btn.textContent = '收起图片';
    } else {
      panel.classList.add('collapsed');
      btn.textContent = '展开图片';
    }
  }
};
