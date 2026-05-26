const App = {
  root: document.getElementById('app'),

  init() {
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  route() {
    const hash = window.location.hash;
    if (hash.startsWith('#/learn/')) {
      const topicId = hash.replace('#/learn/', '');
      this.showLearn(topicId);
    } else {
      this.showHome();
    }
  },

  async showHome() {
    this.root.innerHTML = '';
    const topicsIndex = await this.fetchJSON('data/topics-index.json');
    Home.render(this.root, topicsIndex);
  },

  async showLearn(topicId) {
    this.root.innerHTML = '';
    const topicData = await this.fetchJSON(`data/topic-${topicId}.json`);
    const topicsIndex = await this.fetchJSON('data/topics-index.json');
    Learn.render(this.root, topicData, topicsIndex);
  },

  async fetchJSON(path) {
    const res = await fetch(path);
    return res.json();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
