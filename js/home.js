const Home = {
  render(container, topicsIndex) {
    const allTopics = this.getAllTopics(topicsIndex);
    const totalWords = allTopics.reduce((sum, topic) => sum + (topic.totalWords || 0), 0);
    const learnedWords = this.getLearnedWords(allTopics);

    const html = `
      <main class="home-page">
        <section class="home-hero">
          <div>
            <p class="eyebrow">Visual Vocabulary Notebook</p>
            <h1>DK 英语 10000 词</h1>
            <p class="home-subtitle">按场景看图学词，点击听发音，遮住中文做一次轻量自测。</p>
          </div>
          <div class="hero-actions">
            <button onclick="window.location.hash='#/learn/01'" class="primary-action">开始学习</button>
            <span>${learnedWords}/${totalWords} 已点读</span>
          </div>
        </section>

        <section class="stat-strip" aria-label="内容统计">
          <div><strong>${allTopics.length}</strong><span>主题单元</span></div>
          <div><strong>${totalWords}</strong><span>词汇条目</span></div>
          <div><strong>${topicsIndex.categories.length}</strong><span>内容分类</span></div>
        </section>

        <div class="home-content">
          ${this.renderReviewSection(allTopics)}
          ${this.renderAllTopics(topicsIndex)}
        </div>
      </main>
    `;
    container.innerHTML = html;
  },

  getAllTopics(topicsIndex) {
    return topicsIndex.categories.flatMap(category => category.topics);
  },

  getLearnedWords(allTopics) {
    return allTopics.reduce((sum, topic) => {
      const progress = Progress.getTopicProgress(topic.id);
      return sum + (progress ? progress.learnedWords.length : 0);
    }, 0);
  },

  renderReviewSection(allTopics) {
    const groups = { red: [], yellow: [], green: [] };
    allTopics.forEach(topic => {
      const status = Progress.getReviewStatus(topic.id);
      if (status !== 'gray' && groups[status]) groups[status].push(topic);
    });

    const hasAny = groups.red.length || groups.yellow.length || groups.green.length;
    if (!hasAny) {
      return `
        <section class="review-section">
          <div class="section-heading">
            <span>轻量回看</span>
            <small>不用追任务，想起来就翻一页</small>
          </div>
          <div class="empty-review">还没有学习记录。先选一个感兴趣的主题，点读几分钟就可以开始积累。</div>
        </section>
      `;
    }

    let html = `
      <section class="review-section">
        <div class="section-heading">
          <span>轻量回看</span>
          <small>按最近学习时间给你一个温和提示</small>
        </div>
    `;

    if (groups.red.length) html += this.renderReviewGroup('放久了，可以回看', 'red', groups.red);
    if (groups.yellow.length) html += this.renderReviewGroup('适合顺手复习', 'yellow', groups.yellow);
    if (groups.green.length) html += this.renderReviewGroup('最近看过', 'green', groups.green);

    html += '</section>';
    return html;
  },

  renderReviewGroup(label, status, topics) {
    return `
      <div class="review-block">
        <div class="review-group-label ${status}">${label}</div>
        <div class="topic-grid compact">
          ${topics.slice(0, 8).map(topic => this.renderTopicCard(topic)).join('')}
        </div>
      </div>
    `;
  },

  renderAllTopics(topicsIndex) {
    let html = `
      <section class="topics-section">
        <div class="section-heading">
          <span>全部主题</span>
          <small>按生活场景整理</small>
        </div>
    `;

    topicsIndex.categories.forEach(category => {
      html += `
        <div class="category-group">
          <div class="category-title">
            <span class="category-dot" style="background:${category.color}"></span>
            <strong>${category.name}</strong>
            <small>${category.topics.length} 个单元</small>
          </div>
          <div class="topic-grid">
            ${category.topics.map(topic => this.renderTopicCard(topic)).join('')}
          </div>
        </div>
      `;
    });

    html += '</section>';
    return html;
  },

  renderTopicCard(topic) {
    const progress = Progress.getTopicProgress(topic.id);
    const learned = progress ? progress.learnedWords.length : 0;
    const total = topic.totalWords || 0;
    const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
    const disabled = !topic.hasData;
    const onclick = disabled ? '' : `onclick="window.location.hash='#/learn/${topic.id}'"`;

    return `
      <button class="topic-card ${disabled ? 'disabled' : ''}" ${onclick}>
        <span class="topic-id">${topic.id}</span>
        <span class="topic-title">${topic.title}</span>
        <span class="topic-title-en">${topic.titleEn}</span>
        ${total > 0 ? `
          <span class="progress-bar">
            <span class="progress-bar-fill" style="width:${pct}%"></span>
          </span>
          <span class="progress-text">${learned}/${total} 已点读</span>
        ` : '<span class="progress-text">整理中</span>'}
      </button>
    `;
  }
};
