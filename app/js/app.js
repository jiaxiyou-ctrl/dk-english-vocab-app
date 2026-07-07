const App = {
  root: document.getElementById('app'),
  topicsIndex: null,

  init() {
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  route() {
    const hash = window.location.hash;
    if (hash.startsWith('#/learn')) {
      const topicId = hash.replace('#/learn/', '').replace('#/learn', '');
      this.showLearn(topicId || '01');
    } else {
      this.showHome();
    }
  },

  async showHome() {
    this.root.innerHTML = '';
    if (!this.topicsIndex) {
      this.topicsIndex = await this.fetchJSON('data/topics-index.json');
    }
    Home.render(this.root, this.topicsIndex);
  },

  async showLearn(topicId) {
    this.root.innerHTML = '<div class="loading-state">加载单元中...</div>';
    if (!this.topicsIndex) {
      this.topicsIndex = await this.fetchJSON('data/topics-index.json');
    }
    const topicData = await this.fetchJSON(`data/topic-${topicId}.json`);
    this.root.innerHTML = '';
    Learn.render(this.root, topicData, this.topicsIndex);
  },

  async fetchJSON(path) {
    const res = await fetch(path);
    return res.json();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
