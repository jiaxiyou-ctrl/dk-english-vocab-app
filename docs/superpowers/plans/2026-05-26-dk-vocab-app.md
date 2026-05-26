# DK中英双语10000词 互动发音 Web App — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个互动发音Web App原型，实现"01 身体各部分"主题的点击发音、中文遮蔽自测、学习进度追踪功能。

**Architecture:** 纯静态Web App，原生HTML/CSS/JS，无构建工具无框架依赖。单页应用通过hash路由切换主页和学习页。数据以JSON文件形式静态托管，学习进度存localStorage。

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, Web Speech API, PyMuPDF (数据准备)

---

## 文件结构

```
DK_english/
├── app/
│   ├── index.html              # 单页应用入口
│   ├── css/
│   │   └── style.css           # 全局样式
│   ├── js/
│   │   ├── app.js              # 应用初始化、hash路由
│   │   ├── speech.js           # Web Speech API 封装
│   │   ├── progress.js         # localStorage 进度管理
│   │   ├── home.js             # 主页渲染逻辑
│   │   └── learn.js            # 学习页渲染逻辑
│   ├── data/
│   │   ├── topics-index.json   # 全部主题索引（id, 标题, 分类, 总词数）
│   │   └── topic-01.json       # 主题01完整词汇数据
│   └── assets/
│       └── images/
│           ├── page_13.jpg     # 身体各部分 - 人的身体
│           └── page_14.jpg     # 身体各部分 - 脸、眼睛
├── scripts/
│   └── extract_data.py         # PDF图片提取脚本
├── docs/
│   └── superpowers/
│       ├── specs/...
│       └── plans/...           # 本文件
└── DK中英双语10000词.pdf
```

**职责划分：**
- `app.js`：监听hashchange，调用对应页面的render函数，管理页面切换
- `speech.js`：封装speechSynthesis，提供 `speak(text)` 函数，处理语音队列
- `progress.js`：封装localStorage读写，提供 `markWordLearned()`、`getTopicProgress()`、`getReviewStatus()` 等函数
- `home.js`：渲染主页DOM——复习提醒板块 + 全部主题列表
- `learn.js`：渲染学习页DOM——图片区 + 控制栏 + 单词列表，处理点击交互

---

### Task 1: 数据准备 — 提取图片和词汇数据

**Files:**
- Create: `scripts/extract_data.py`
- Create: `app/assets/images/page_13.jpg`
- Create: `app/assets/images/page_14.jpg`
- Create: `app/data/topic-01.json`
- Create: `app/data/topics-index.json`

- [ ] **Step 1: 创建图片提取脚本**

```python
# scripts/extract_data.py
import fitz
import os

PDF_PATH = os.path.join(os.path.dirname(__file__), '..', 'DK中英双语10000词.pdf')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'assets', 'images')

def extract_pages(page_numbers):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    doc = fitz.open(PDF_PATH)
    for page_num in page_numbers:
        page = doc[page_num - 1]  # fitz uses 0-indexed
        pix = page.get_pixmap(dpi=200)
        output_path = os.path.join(OUTPUT_DIR, f'page_{page_num}.jpg')
        pix.save(output_path)
        print(f'Saved page {page_num} -> {output_path}')
    doc.close()

if __name__ == '__main__':
    # Topic 01: 身体各部分 — pages 13, 14
    extract_pages([13, 14])
```

- [ ] **Step 2: 运行脚本提取图片**

Run: `cd /Users/youjiaxi/DK_english && python3 scripts/extract_data.py`

Expected: 输出两行 "Saved page 13 -> ..." 和 "Saved page 14 -> ..."，在 `app/assets/images/` 下生成 `page_13.jpg` 和 `page_14.jpg`。

- [ ] **Step 3: 创建主题01词汇数据文件**

根据扫描页面内容，手动整理词汇数据（OCR辅助 + 人工校正）：

```json
// app/data/topic-01.json
{
  "id": "01",
  "title": "身体各部分",
  "titleEn": "The Body",
  "category": "人",
  "pages": [
    {
      "pageNum": 13,
      "image": "assets/images/page_13.jpg",
      "section": "1.1",
      "sectionTitle": "人的身体",
      "sectionTitleEn": "The Human Body",
      "words": [
        { "id": 1, "en": "head", "zh": "头/头部" },
        { "id": 2, "en": "shoulder", "zh": "肩膀" },
        { "id": 3, "en": "chest", "zh": "胸部" },
        { "id": 4, "en": "abdomen", "zh": "腹部" },
        { "id": 5, "en": "hand", "zh": "手" },
        { "id": 6, "en": "leg", "zh": "腿" },
        { "id": 7, "en": "foot", "zh": "脚" },
        { "id": 8, "en": "breast", "zh": "乳房" },
        { "id": 9, "en": "nipple", "zh": "乳头" },
        { "id": 10, "en": "armpit", "zh": "腋窝" },
        { "id": 11, "en": "waist", "zh": "腰" },
        { "id": 12, "en": "forearm", "zh": "前臂" },
        { "id": 13, "en": "navel", "zh": "肚脐" },
        { "id": 14, "en": "genitals", "zh": "生殖器" },
        { "id": 15, "en": "groin", "zh": "腹股沟" },
        { "id": 16, "en": "shin", "zh": "胫骨" },
        { "id": 17, "en": "heel", "zh": "脚后跟" },
        { "id": 18, "en": "back", "zh": "背部" },
        { "id": 19, "en": "neck", "zh": "脖子" },
        { "id": 20, "en": "hip", "zh": "臀部" },
        { "id": 21, "en": "calf", "zh": "小腿" },
        { "id": 22, "en": "buttock", "zh": "屁股" }
      ]
    },
    {
      "pageNum": 14,
      "image": "assets/images/page_14.jpg",
      "section": "1.2",
      "sectionTitle": "脸",
      "sectionTitleEn": "The Face",
      "words": [
        { "id": 23, "en": "eyelid", "zh": "眼皮/眼睑" },
        { "id": 24, "en": "hair", "zh": "头发" },
        { "id": 25, "en": "temple", "zh": "太阳穴" },
        { "id": 26, "en": "forehead", "zh": "前额" },
        { "id": 27, "en": "eyebrow", "zh": "眉毛" },
        { "id": 28, "en": "cheek", "zh": "面颊" },
        { "id": 29, "en": "skin", "zh": "皮肤" },
        { "id": 30, "en": "chin", "zh": "下巴" },
        { "id": 31, "en": "jaw", "zh": "下颌" },
        { "id": 32, "en": "ear", "zh": "耳朵" },
        { "id": 33, "en": "eye", "zh": "眼睛" },
        { "id": 34, "en": "nose", "zh": "鼻子" },
        { "id": 35, "en": "nostril", "zh": "鼻孔" },
        { "id": 36, "en": "lip", "zh": "嘴唇" },
        { "id": 37, "en": "mouth", "zh": "嘴" },
        { "id": 38, "en": "tooth", "zh": "牙齿" }
      ]
    },
    {
      "pageNum": 14,
      "image": "assets/images/page_14.jpg",
      "section": "1.3",
      "sectionTitle": "眼睛",
      "sectionTitleEn": "The Eye",
      "words": [
        { "id": 39, "en": "eyelashes", "zh": "睫毛" },
        { "id": 40, "en": "tear duct", "zh": "泪腺" },
        { "id": 41, "en": "iris", "zh": "虹膜" },
        { "id": 42, "en": "pupil", "zh": "瞳孔" },
        { "id": 43, "en": "blue", "zh": "蓝色" },
        { "id": 44, "en": "green", "zh": "绿色" },
        { "id": 45, "en": "brown", "zh": "棕色" },
        { "id": 46, "en": "hazel", "zh": "淡褐色" },
        { "id": 47, "en": "gray", "zh": "灰色" }
      ]
    }
  ]
}
```

- [ ] **Step 4: 创建全局主题索引文件**

原型阶段只有主题01有完整数据，其他主题仅在索引中列出（用于主页展示），后续扩展时再补充。

```json
// app/data/topics-index.json
{
  "categories": [
    {
      "name": "人",
      "color": "#4a7c59",
      "topics": [
        { "id": "01", "title": "身体各部分", "titleEn": "The Body", "page": 12, "totalWords": 47, "hasData": true },
        { "id": "02", "title": "手和脚", "titleEn": "Hands and Feet", "page": 14, "totalWords": 0, "hasData": false },
        { "id": "03", "title": "肌肉和骨骼", "titleEn": "Muscles and Skeleton", "page": 16, "totalWords": 0, "hasData": false },
        { "id": "04", "title": "内部器官", "titleEn": "Internal Organs", "page": 18, "totalWords": 0, "hasData": false },
        { "id": "05", "title": "家庭", "titleEn": "Family", "page": 20, "totalWords": 0, "hasData": false }
      ]
    },
    {
      "name": "外貌",
      "color": "#7b5ea7",
      "topics": [
        { "id": "06", "title": "发型和美发", "titleEn": "Hair", "page": 24, "totalWords": 0, "hasData": false },
        { "id": "07", "title": "美容", "titleEn": "Beauty", "page": 26, "totalWords": 0, "hasData": false }
      ]
    },
    {
      "name": "健康",
      "color": "#c0392b",
      "topics": [
        { "id": "08", "title": "疾病和损伤", "titleEn": "Illness and Injury", "page": 48, "totalWords": 0, "hasData": false },
        { "id": "09", "title": "看医生", "titleEn": "Doctor", "page": 50, "totalWords": 0, "hasData": false }
      ]
    }
  ]
}
```

注意：这里只列出了部分主题作为示例。完整的100个主题索引在扩展阶段补充。`hasData: false` 的主题在主页显示为灰色不可点击状态。

- [ ] **Step 5: 验证数据文件**

Run: `python3 -c "import json; d=json.load(open('app/data/topic-01.json')); print(f'Topic: {d[\"title\"]}, Pages: {len(d[\"pages\"])}, Words: {sum(len(p[\"words\"]) for p in d[\"pages\"])}')"` (在项目根目录执行)

Expected: `Topic: 身体各部分, Pages: 3, Words: 47`

Run: `ls -la app/assets/images/`

Expected: 看到 `page_13.jpg` 和 `page_14.jpg`

- [ ] **Step 6: Commit**

```bash
git add scripts/extract_data.py app/data/ app/assets/images/
git commit -m "feat: add data preparation script and topic 01 vocabulary data"
```

---

### Task 2: 项目骨架 — HTML入口和CSS样式

**Files:**
- Create: `app/index.html`
- Create: `app/css/style.css`
- Create: `app/js/app.js`

- [ ] **Step 1: 创建 index.html**

```html
<!-- app/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DK 英语10000词</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app"></div>
  <script src="js/speech.js"></script>
  <script src="js/progress.js"></script>
  <script src="js/home.js"></script>
  <script src="js/learn.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建基础路由 app.js**

```javascript
// app/js/app.js
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
```

- [ ] **Step 3: 创建 CSS 样式文件**

```css
/* app/css/style.css */

/* === Reset & Base === */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

/* === Home Page === */
.home-header {
  background: #2c3e50;
  color: white;
  padding: 20px 24px;
  text-align: center;
}

.home-header h1 { font-size: 24px; font-weight: 600; }

.home-content { max-width: 960px; margin: 0 auto; padding: 20px; }

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ddd;
}

/* Review reminder section */
.review-section { margin-bottom: 32px; }

.review-group-label {
  font-size: 13px;
  font-weight: 600;
  margin: 12px 0 8px;
  padding: 4px 10px;
  border-radius: 4px;
  display: inline-block;
  color: white;
}

.review-group-label.green { background: #27ae60; }
.review-group-label.yellow { background: #f39c12; }
.review-group-label.red { background: #e74c3c; }
.review-group-label.gray { background: #95a5a6; }

/* Topic cards */
.category-group { margin-bottom: 24px; }

.category-label {
  font-size: 14px;
  font-weight: 600;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 8px;
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.topic-card {
  background: white;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.2s, transform 0.1s;
}

.topic-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  transform: translateY(-1px);
}

.topic-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.topic-card.disabled:hover {
  box-shadow: none;
  transform: none;
}

.topic-card .topic-id {
  font-size: 12px;
  color: #888;
}

.topic-card .topic-title {
  font-size: 15px;
  font-weight: 600;
  margin: 4px 0;
}

.topic-card .topic-title-en {
  font-size: 12px;
  color: #666;
}

.progress-bar {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #27ae60;
  border-radius: 2px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

/* === Learn Page === */
.learn-header {
  background: #2c3e50;
  color: white;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.learn-header .back-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}

.learn-header select {
  background: #3d566e;
  color: white;
  border: 1px solid #5a7a9a;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 14px;
  flex: 1;
  max-width: 300px;
}

.learn-body {
  display: flex;
  height: calc(100vh - 52px);
}

/* Left: image area */
.image-panel {
  flex: 1;
  overflow-y: auto;
  background: #e8e8e8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  gap: 16px;
}

.image-panel img {
  max-width: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Right: word list panel */
.word-panel {
  width: 380px;
  min-width: 320px;
  border-left: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  background: white;
}

.word-panel-controls {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.toggle-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
}

.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
}

.toggle-switch input { opacity: 0; width: 0; height: 0; }

.toggle-slider {
  position: absolute;
  inset: 0;
  background: #ccc;
  border-radius: 11px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background: #27ae60;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(18px);
}

/* Word list */
.word-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.section-divider {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #888;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.word-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
  gap: 12px;
}

.word-item:hover { background: #f8f9fa; }
.word-item:active { background: #e8f4fd; }

.word-item.learned { border-left: 3px solid #27ae60; }

.word-num {
  font-size: 11px;
  color: #bbb;
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}

.word-en {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
  flex: 1;
}

.word-zh {
  font-size: 13px;
  color: #666;
  transition: opacity 0.2s;
}

.word-zh.hidden {
  opacity: 0;
  user-select: none;
}

.word-zh.revealed {
  opacity: 1;
  color: #e67e22;
}

/* === Responsive: Mobile === */
@media (max-width: 768px) {
  .learn-body {
    flex-direction: column;
    height: auto;
  }

  .image-panel {
    max-height: 40vh;
    min-height: 0;
  }

  .image-panel.collapsed {
    max-height: 0;
    padding: 0;
    overflow: hidden;
  }

  .word-panel {
    width: 100%;
    min-width: 0;
    border-left: none;
    border-top: 1px solid #ddd;
    min-height: 60vh;
  }

  .topic-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }

  .image-toggle-btn {
    display: inline-block !important;
  }
}

@media (min-width: 769px) {
  .image-toggle-btn { display: none !important; }
}
```

- [ ] **Step 4: 用本地服务器验证页面能加载**

Run: `cd /Users/youjiaxi/DK_english/app && python3 -m http.server 8080 &`

在浏览器打开 `http://localhost:8080`，确认页面空白无报错（此时还没有页面内容，控制台不应有JS错误）。

- [ ] **Step 5: Commit**

```bash
git add app/index.html app/css/style.css app/js/app.js
git commit -m "feat: project scaffold with HTML entry, CSS styles, and hash router"
```

---

### Task 3: 语音模块 — Web Speech API 封装

**Files:**
- Create: `app/js/speech.js`

- [ ] **Step 1: 实现 speech.js**

```javascript
// app/js/speech.js
const Speech = {
  enabled: true,

  speak(text) {
    if (!this.enabled) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },

  setEnabled(val) {
    this.enabled = val;
  }
};
```

- [ ] **Step 2: 在浏览器控制台验证**

打开 `http://localhost:8080`，在浏览器控制台执行：

```javascript
Speech.speak('hello');       // 应听到 "hello" 的英文发音
Speech.speak('shoulder');    // 应听到 "shoulder" 的英文发音
Speech.toggle();             // 返回 false
Speech.speak('test');        // 应无声音
Speech.toggle();             // 返回 true
Speech.speak('test');        // 应听到 "test"
```

- [ ] **Step 3: Commit**

```bash
git add app/js/speech.js
git commit -m "feat: add Web Speech API wrapper module"
```

---

### Task 4: 进度管理模块 — localStorage 封装

**Files:**
- Create: `app/js/progress.js`

- [ ] **Step 1: 实现 progress.js**

```javascript
// app/js/progress.js
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
```

- [ ] **Step 2: 在浏览器控制台验证**

```javascript
Progress.recordStudy('01', 47);
Progress.markWordLearned('01', 1, 47);
Progress.markWordLearned('01', 2, 47);
console.log(Progress.getTopicProgress('01'));
// 应输出: { learnedWords: [1, 2], totalWords: 47, lastStudyDate: "2026-05-26", studyCount: 1 }
console.log(Progress.getReviewStatus('01'));
// 应输出: "green" (因为刚刚学习)
```

- [ ] **Step 3: Commit**

```bash
git add app/js/progress.js
git commit -m "feat: add localStorage progress management module"
```

---

### Task 5: 主页 — 复习提醒 + 主题列表

**Files:**
- Create: `app/js/home.js`

- [ ] **Step 1: 实现 home.js**

```javascript
// app/js/home.js
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
      html += `<div class="review-group-label red">7天以上未复习</div>`;
      html += '<div class="topic-grid">';
      groups.red.forEach(t => { html += this.renderTopicCard(t); });
      html += '</div>';
    }
    if (groups.yellow.length) {
      html += `<div class="review-group-label yellow">3-7天未复习</div>`;
      html += '<div class="topic-grid">';
      groups.yellow.forEach(t => { html += this.renderTopicCard(t); });
      html += '</div>';
    }
    if (groups.green.length) {
      html += `<div class="review-group-label green">3天内学习过</div>`;
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
      html += `<div class="category-group">`;
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
```

- [ ] **Step 2: 浏览器验证主页渲染**

在浏览器打开 `http://localhost:8080`，应看到：
- 顶部蓝色标题栏 "DK 英语10000词"
- 复习提醒板块（初始状态显示"还没有学习记录"）
- 全部主题板块，按分类分组展示
- 主题01可点击（白色卡片），其他主题灰色不可点击
- 点击主题01跳转到 `#/learn/01`（此时学习页还未实现，显示空白）

- [ ] **Step 3: Commit**

```bash
git add app/js/home.js
git commit -m "feat: add home page with review reminders and topic list"
```

---

### Task 6: 学习页 — 图片展示 + 单词列表 + 交互控制

**Files:**
- Create: `app/js/learn.js`

- [ ] **Step 1: 实现 learn.js**

```javascript
// app/js/learn.js
const Learn = {
  maskEnabled: false,
  revealedWords: new Set(),

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
        <button class="image-toggle-btn" style="background:none;border:1px solid #5a7a9a;color:white;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:13px;"
          onclick="Learn.toggleImagePanel()">
          收起图片
        </button>
      </div>
      <div class="learn-body">
        <div class="image-panel" id="imagePanel">
          ${topicData.pages.map(p => `<img src="${p.image}" alt="Page ${p.pageNum}">`).join('')}
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
    topicData.pages.forEach(page => {
      html += `<div class="section-divider">${page.section} ${page.sectionTitle}</div>`;
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
```

- [ ] **Step 2: 浏览器验证 — 基本渲染**

在浏览器打开 `http://localhost:8080#/learn/01`，确认：
- 顶部导航栏：返回箭头、主题下拉选择器
- 左侧显示两张扫描页面图片
- 右侧显示控制开关（遮蔽、发音）和单词列表
- 单词列表按 section 分组（1.1 人的身体、1.2 脸、1.3 眼睛）

- [ ] **Step 3: 浏览器验证 — 交互逻辑**

测试以下交互：

1. **默认状态（遮蔽关、发音开）：** 点击 "head" → 听到英文发音，单词左侧出现绿色竖条
2. **关闭发音：** 关闭发音开关 → 点击 "shoulder" → 无声音，但仍标记为已学习
3. **开启遮蔽：** 打开遮蔽开关 → 所有中文翻译消失 → 点击 "chest" → 中文"胸部"显示出来（橙色），同时播放发音
4. **关闭遮蔽：** 关闭遮蔽开关 → 所有中文翻译恢复显示
5. **返回主页：** 点击左箭头 → 回到主页，复习提醒板块应显示主题01为绿色（刚刚学习过）

- [ ] **Step 4: Commit**

```bash
git add app/js/learn.js
git commit -m "feat: add learn page with word list, mask mode, and speech controls"
```

---

### Task 7: 响应式适配验证 + 收尾

**Files:**
- Modify: `app/css/style.css` (如需微调)

- [ ] **Step 1: 桌面端验证**

在浏览器窗口 > 768px 宽度下确认：
- 主页：主题卡片网格自适应排列
- 学习页：左右分栏，左图片右单词列表
- 图片区可上下滚动查看两张图片

- [ ] **Step 2: 移动端验证**

使用浏览器开发者工具切换到移动设备模式（iPhone 14 / 390px），确认：
- 主页：卡片自适应为更窄的网格
- 学习页：上下布局，上方图片、下方单词列表
- "收起图片"按钮可见，点击可折叠图片区域
- 单词列表占满宽度，点击发音正常工作

- [ ] **Step 3: 进度持久化验证**

1. 在学习页点击若干单词
2. 关闭浏览器标签页
3. 重新打开 `http://localhost:8080`
4. 确认主页显示学习进度（已学习单词数）和绿色复习标记
5. 进入学习页，确认之前点击过的单词仍有绿色左边框标记

- [ ] **Step 4: 修复发现的问题（如有）**

根据测试中发现的样式或交互问题，进行修复。

- [ ] **Step 5: Final Commit**

```bash
git add -A
git commit -m "feat: complete DK vocab web app prototype with topic 01"
```

---

## 验收标准

完成以上所有Task后，原型应满足：

1. 主页展示全部主题列表，按分类分组，主题01可点击进入
2. 主页复习提醒板块按颜色分组显示已学习的主题
3. 学习页左侧显示原书扫描图片，右侧显示单词列表
4. 点击单词播放英文发音（Web Speech API）
5. 遮蔽开关：开启后隐藏中文，点击单词揭开翻译；关闭后恢复显示
6. 发音开关：关闭后点击不播放语音
7. 学习进度自动记录到localStorage，刷新页面不丢失
8. 移动端自适应为上下布局，可折叠图片区域
