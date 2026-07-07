const Progress = {
  STORAGE_KEY: 'dk-vocab-progress',

  _load() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : { topics: {} };
  },

  _save(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  markWordLearned(topicId, wordId, totalWords) {
    const data = this._load();
    if (!data.topics[topicId]) {
      data.topics[topicId] = {
        learnedWords: [],
        totalWords: totalWords,
        lastStudyDate: null,
        studyCount: 0
      };
    }
    const topic = data.topics[topicId];
    if (!topic.learnedWords.includes(wordId)) {
      topic.learnedWords.push(wordId);
    }
    topic.totalWords = totalWords;
    this._save(data);
  },

  recordStudy(topicId, totalWords) {
    const data = this._load();
    if (!data.topics[topicId]) {
      data.topics[topicId] = {
        learnedWords: [],
        totalWords: totalWords,
        lastStudyDate: null,
        studyCount: 0
      };
    }
    const topic = data.topics[topicId];
    topic.lastStudyDate = new Date().toISOString().split('T')[0];
    topic.studyCount += 1;
    topic.totalWords = totalWords;
    this._save(data);
  },

  getTopicProgress(topicId) {
    const data = this._load();
    return data.topics[topicId] || null;
  },

  getAllProgress() {
    return this._load();
  },

  getReviewStatus(topicId) {
    const progress = this.getTopicProgress(topicId);
    if (!progress || !progress.lastStudyDate) return 'gray';
    const lastDate = new Date(progress.lastStudyDate);
    const now = new Date();
    const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'green';
    if (diffDays <= 7) return 'yellow';
    return 'red';
  },

  getReviewLabel(status) {
    const labels = {
      green: '3天内学习过',
      yellow: '3-7天未复习',
      red: '7天以上未复习',
      gray: '尚未开始'
    };
    return labels[status] || '';
  }
};
