const App = {
  root: document.getElementById('app'),
  allTopics: null,
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
    this.root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#9B9B9B;">加载中...</div>';
    if (!this.allTopics) {
      this.allTopics = await this.fetchJSON('data/all-topics.json');
    }
    if (!this.topicsIndex) {
      this.topicsIndex = await this.fetchJSON('data/topics-index.json');
    }
    this.root.innerHTML = '';
    Learn.render(this.root, this.allTopics, this.topicsIndex, topicId);
  },

  async fetchJSON(path) {
    const res = await fetch(path);
    return res.json();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
