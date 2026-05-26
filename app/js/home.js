const Home = {
  render(container, topicsIndex) {
    const html = `
      <div class="home-header">
        <h1>DK 英语10000词</h1>
      </div>
      <div class="home-content">
        ${this.renderReviewSection(topicsIndex)}
        ${this.renderAllTopics(topicsIndex)}
      </div>
    `;
    container.innerHTML = html;
  },

  renderReviewSection(topicsIndex) {
    const allTopics = [];
    topicsIndex.categories.forEach(cat => {
      cat.topics.forEach(t => allTopics.push(t));
    });

    const groups = { red: [], yellow: [], green: [] };
    allTopics.forEach(topic => {
      const status = Progress.getReviewStatus(topic.id);
      if (status !== 'gray' && groups[status]) {
        groups[status].push(topic);
      }
    });

    const hasAny = groups.red.length || groups.yellow.length || groups.green.length;
    if (!hasAny) {
      return `
        <div class="review-section">
          <div class="section-title">复习提醒</div>
          <p style="color:#999; padding:16px 0;">还没有学习记录，选择一个主题开始学习吧！</p>
        </div>
      `;
    }

    let html = '<div class="review-section"><div class="section-title">复习提醒</div>';

    if (groups.red.length) {
      html += '<div class="review-group-label red">7天以上未复习</div>';
      html += '<div class="topic-grid">';
      groups.red.forEach(t => { html += this.renderTopicCard(t); });
      html += '</div>';
    }
    if (groups.yellow.length) {
      html += '<div class="review-group-label yellow">3-7天未复习</div>';
      html += '<div class="topic-grid">';
      groups.yellow.forEach(t => { html += this.renderTopicCard(t); });
      html += '</div>';
    }
    if (groups.green.length) {
      html += '<div class="review-group-label green">3天内学习过</div>';
      html += '<div class="topic-grid">';
      groups.green.forEach(t => { html += this.renderTopicCard(t); });
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  renderAllTopics(topicsIndex) {
    let html = '<div class="section-title">全部主题</div>';
    topicsIndex.categories.forEach(cat => {
      html += '<div class="category-group">';
      html += `<span class="category-label" style="background:${cat.color}">${cat.name}</span>`;
      html += '<div class="topic-grid">';
      cat.topics.forEach(t => { html += this.renderTopicCard(t); });
      html += '</div></div>';
    });
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
      <div class="topic-card ${disabled ? 'disabled' : ''}" ${onclick}>
        <div class="topic-id">${topic.id}</div>
        <div class="topic-title">${topic.title}</div>
        <div class="topic-title-en">${topic.titleEn}</div>
        ${total > 0 ? `
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="progress-text">${learned}/${total} 已学习</div>
        ` : '<div class="progress-text">即将推出</div>'}
      </div>
    `;
  }
};
