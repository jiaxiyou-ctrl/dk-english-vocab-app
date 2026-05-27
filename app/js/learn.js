const Learn = {
  maskEnabled: false,
  revealedWords: new Set(),
  observer: null,
  syncScrolling: false,
  allTopics: null,
  currentTopicId: null,

  render(container, allTopics, topicsIndex, initialTopicId) {
    this.allTopics = allTopics;
    this.maskEnabled = false;
    this.revealedWords = new Set();

    const html = `
      <div class="learn-header">
        <button class="back-btn" onclick="window.location.hash='#/'">&larr;</button>
        ${this.renderTopicSelect(initialTopicId, topicsIndex)}
        <button class="image-toggle-btn" onclick="Learn.toggleImagePanel()">收起图片</button>
      </div>
      <div class="learn-body">
        <div class="image-panel" id="imagePanel">
          ${this.renderAllImages(allTopics)}
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
            ${this.renderAllWords(allTopics)}
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    this.setupScrollSync();

    if (initialTopicId) {
      this.scrollToTopic(initialTopicId);
    }
  },

  renderAllImages(allTopics) {
    const fragments = [];
    const imageMap = [];
    let globalImgIdx = 0;

    allTopics.forEach(topic => {
      fragments.push(`<div class="image-topic-header" data-topic-id="${topic.id}">${topic.id} ${topic.title}</div>`);

      const seen = new Set();
      topic.pages.forEach(p => {
        if (!seen.has(p.image)) {
          seen.add(p.image);
          imageMap.push({ topicId: topic.id, image: p.image, pageNum: p.pageNum });
          fragments.push(`<img src="${p.image}" alt="Page ${p.pageNum}" loading="lazy" data-img-index="${globalImgIdx}" data-topic-id="${topic.id}">`);
          globalImgIdx++;
        }
      });
    });

    this.imageMap = imageMap;
    return fragments.join('');
  },

  renderAllWords(allTopics) {
    let html = '';
    allTopics.forEach(topic => {
      html += `<div class="word-topic-header" data-topic-id="${topic.id}">${topic.id} ${topic.title} <span class="word-topic-header-en">${topic.titleEn}</span></div>`;

      topic.pages.forEach((page, i) => {
        html += `<div class="section-divider">${page.section} ${page.sectionTitle}</div>`;
        page.words.forEach(word => {
          const progress = Progress.getTopicProgress(topic.id);
          const isLearned = progress && progress.learnedWords.includes(word.id);
          const safeEn = word.en.replace(/'/g, "\\'");
          html += `
            <div class="word-item ${isLearned ? 'learned' : ''}"
                 data-topic-id="${topic.id}"
                 data-word-id="${word.id}"
                 onclick="Learn.onWordClick(this, '${safeEn}', '${topic.id}', ${word.id})">
              <span class="word-num">${word.id}</span>
              <span class="word-en">${word.en}</span>
              <span class="word-zh" id="zh-${topic.id}-${word.id}">${word.zh}</span>
            </div>
          `;
        });
      });
    });
    return html;
  },

  setupScrollSync() {
    if (this.observer) this.observer.disconnect();
    this.visibilityMap = {};
    this.activeTopicId = null;

    const imagePanel = document.getElementById('imagePanel');
    const images = imagePanel.querySelectorAll('img[data-img-index]');
    if (images.length === 0) return;

    this.observer = new IntersectionObserver((entries) => {
      if (this.syncScrolling) return;

      entries.forEach(entry => {
        const idx = entry.target.dataset.imgIndex;
        this.visibilityMap[idx] = entry.intersectionRatio;
      });

      let bestIdx = null;
      let bestRatio = 0;
      for (const [idx, ratio] of Object.entries(this.visibilityMap)) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestIdx = idx;
        }
      }

      if (bestIdx !== null && bestRatio > 0.15) {
        const imgInfo = this.imageMap[parseInt(bestIdx)];
        const topicId = imgInfo.topicId;

        if (topicId !== this.activeTopicId) {
          this.activeTopicId = topicId;
          this.scrollWordListToTopic(topicId);
          this.updateDropdown(topicId);
          this.updateHash(topicId);
        }
      }
    }, {
      root: imagePanel,
      threshold: [0, 0.1, 0.15, 0.3, 0.5, 0.7, 1.0]
    });

    images.forEach(img => this.observer.observe(img));
  },

  scrollWordListToTopic(topicId) {
    const header = document.querySelector(`.word-topic-header[data-topic-id="${topicId}"]`);
    if (!header) return;

    this.syncScrolling = true;
    const wordList = document.getElementById('wordList');
    const offset = header.offsetTop - wordList.offsetTop;
    wordList.scrollTo({ top: offset, behavior: 'smooth' });

    setTimeout(() => { this.syncScrolling = false; }, 600);
  },

  scrollToTopic(topicId) {
    const imgHeader = document.querySelector(`.image-topic-header[data-topic-id="${topicId}"]`);
    if (imgHeader) {
      const imagePanel = document.getElementById('imagePanel');
      this.syncScrolling = true;
      imagePanel.scrollTo({ top: imgHeader.offsetTop - imagePanel.offsetTop, behavior: 'auto' });
    }

    const wordHeader = document.querySelector(`.word-topic-header[data-topic-id="${topicId}"]`);
    if (wordHeader) {
      const wordList = document.getElementById('wordList');
      wordList.scrollTo({ top: wordHeader.offsetTop - wordList.offsetTop, behavior: 'auto' });
    }

    this.activeTopicId = topicId;
    this.updateDropdown(topicId);

    setTimeout(() => { this.syncScrolling = false; }, 300);
  },

  updateDropdown(topicId) {
    const select = document.querySelector('.learn-header select');
    if (select && select.value !== topicId) {
      select.value = topicId;
    }
  },

  updateHash(topicId) {
    const newHash = `#/learn/${topicId}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
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
    return `<select onchange="Learn.onTopicSelect(this.value)">${options}</select>`;
  },

  onTopicSelect(topicId) {
    this.scrollToTopic(topicId);

    const topic = this.allTopics.find(t => t.id === topicId);
    if (topic) {
      const totalWords = topic.pages.reduce((sum, p) => sum + p.words.length, 0);
      Progress.recordStudy(topicId, totalWords);
    }
  },

  onWordClick(el, enText, topicId, wordId) {
    const topic = this.allTopics.find(t => t.id === topicId);
    if (!topic) return;
    const totalWords = topic.pages.reduce((sum, p) => sum + p.words.length, 0);

    if (this.maskEnabled) {
      const zhEl = document.getElementById(`zh-${topicId}-${wordId}`);
      if (zhEl && zhEl.classList.contains('hidden')) {
        zhEl.classList.remove('hidden');
        zhEl.classList.add('revealed');
        this.revealedWords.add(`${topicId}-${wordId}`);
      }
    }

    Speech.speak(enText);

    Progress.markWordLearned(topicId, wordId, totalWords);
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
