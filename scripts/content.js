// 检测页面中的JSON内容并添加格式化功能
(function () {
  // 监听来自background.js或popup.js的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkForJson") {
      // 检查当前页面是否为纯JSON内容
      detectJsonContent();
      sendResponse({ success: true });
    }
  });

  // 检测页面是否为JSON内容
  function detectJsonContent() {
    // 尝试获取pre标签中的内容(通常API返回的JSON会在pre标签中)
    const preElements = document.getElementsByTagName('pre');
    if (preElements.length === 1) {
      const content = preElements[0].textContent;
      try {
        JSON.parse(content); // 尝试解析内容

        // 如果解析成功，添加"格式化"按钮和直接格式化界面选项
        addFormatOptionsForPre(preElements[0], content);
        return true;
      } catch (e) {
        // 不是有效的JSON，无需处理
        return false;
      }
    }

    // 检查页面内容类型
    const contentType = document.contentType || "";
    if (contentType.includes('application/json')) {
      try {
        const content = document.body.textContent;
        JSON.parse(content); // 尝试解析内容

        // 如果解析成功，添加格式化选项到页面
        addFormatOptionsForBody(content);
        return true;
      } catch (e) {
        return false;
      }
    }

    return false;
  }

  // 为pre元素添加格式化选项
  function addFormatOptionsForPre(preElement, jsonContent) {
    // 创建容器
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'json-format-options';
    optionsContainer.style.position = 'absolute';
    optionsContainer.style.top = '10px';
    optionsContainer.style.right = '10px';
    optionsContainer.style.zIndex = '9999';
    optionsContainer.style.display = 'flex';
    optionsContainer.style.gap = '10px';

    // 创建一个格式化按钮 (打开新窗口)
    const formatButton = document.createElement('button');
    formatButton.textContent = '插件内格式化';
    formatButton.style.padding = '5px 10px';
    formatButton.style.backgroundColor = '#4285f4';
    formatButton.style.color = 'white';
    formatButton.style.border = 'none';
    formatButton.style.borderRadius = '4px';
    formatButton.style.cursor = 'pointer';
    formatButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    // 添加鼠标悬停效果
    formatButton.onmouseover = function () {
      this.style.backgroundColor = '#3367d6';
    }
    formatButton.onmouseout = function () {
      this.style.backgroundColor = '#4285f4';
    }

    // 点击按钮时，发送JSON内容到扩展
    formatButton.onclick = function () {
      chrome.runtime.sendMessage({
        action: "formatJson",
        json: jsonContent
      });
    }

    // 创建内联格式化按钮
    const inlineFormatButton = document.createElement('button');
    inlineFormatButton.textContent = '页面内格式化';
    inlineFormatButton.style.padding = '5px 10px';
    inlineFormatButton.style.backgroundColor = '#0f9d58';
    inlineFormatButton.style.color = 'white';
    inlineFormatButton.style.border = 'none';
    inlineFormatButton.style.borderRadius = '4px';
    inlineFormatButton.style.cursor = 'pointer';
    inlineFormatButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    // 添加鼠标悬停效果
    inlineFormatButton.onmouseover = function () {
      this.style.backgroundColor = '#0b8043';
    }
    inlineFormatButton.onmouseout = function () {
      this.style.backgroundColor = '#0f9d58';
    }

    // 点击按钮时，在页面内格式化显示
    inlineFormatButton.onclick = function () {
      createInPageJsonFormatter(jsonContent);
    }

    // 添加按钮到容器
    optionsContainer.appendChild(formatButton);
    optionsContainer.appendChild(inlineFormatButton);

    // 确保pre元素的父级有相对定位
    const parent = preElement.parentElement;
    const originalPosition = window.getComputedStyle(parent).position;
    if (originalPosition === 'static') {
      parent.style.position = 'relative';
    }

    // 添加容器到pre元素的父级
    parent.appendChild(optionsContainer);

    // 检查是否配置为自动格式化，如果是则直接开启格式化视图
    chrome.storage.sync.get(['autoFormat'], function (result) {
      if (result.autoFormat) {
        createInPageJsonFormatter(jsonContent);
      }
    });
  }

  // 为整个页面添加格式化选项
  function addFormatOptionsForBody(jsonContent) {
    // 创建容器
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'json-format-options';
    optionsContainer.style.position = 'fixed';
    optionsContainer.style.top = '10px';
    optionsContainer.style.right = '10px';
    optionsContainer.style.zIndex = '9999';
    optionsContainer.style.display = 'flex';
    optionsContainer.style.gap = '10px';

    // 创建一个格式化按钮 (打开新窗口)
    const formatButton = document.createElement('button');
    formatButton.textContent = '插件内格式化';
    formatButton.style.padding = '8px 12px';
    formatButton.style.backgroundColor = '#4285f4';
    formatButton.style.color = 'white';
    formatButton.style.border = 'none';
    formatButton.style.borderRadius = '4px';
    formatButton.style.cursor = 'pointer';
    formatButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    formatButton.style.fontSize = '14px';

    // 添加鼠标悬停效果
    formatButton.onmouseover = function () {
      this.style.backgroundColor = '#3367d6';
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    }
    formatButton.onmouseout = function () {
      this.style.backgroundColor = '#4285f4';
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    }

    // 添加过渡效果
    formatButton.style.transition = 'all 0.2s ease-in-out';

    // 点击按钮时，发送JSON内容到扩展
    formatButton.onclick = function () {
      chrome.runtime.sendMessage({
        action: "formatJson",
        json: jsonContent
      });
    }

    // 创建内联格式化按钮
    const inlineFormatButton = document.createElement('button');
    inlineFormatButton.textContent = '页面内格式化';
    inlineFormatButton.style.padding = '8px 12px';
    inlineFormatButton.style.backgroundColor = '#0f9d58';
    inlineFormatButton.style.color = 'white';
    inlineFormatButton.style.border = 'none';
    inlineFormatButton.style.borderRadius = '4px';
    inlineFormatButton.style.cursor = 'pointer';
    inlineFormatButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    inlineFormatButton.style.fontSize = '14px';

    // 添加鼠标悬停效果
    inlineFormatButton.onmouseover = function () {
      this.style.backgroundColor = '#0b8043';
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    }
    inlineFormatButton.onmouseout = function () {
      this.style.backgroundColor = '#0f9d58';
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    }

    // 添加过渡效果
    inlineFormatButton.style.transition = 'all 0.2s ease-in-out';

    // 点击按钮时，在页面内格式化显示
    inlineFormatButton.onclick = function () {
      createInPageJsonFormatter(jsonContent);
    }

    // 添加按钮到容器
    optionsContainer.appendChild(formatButton);
    optionsContainer.appendChild(inlineFormatButton);

    // 添加容器到页面
    document.body.appendChild(optionsContainer);

    // 检查是否配置为自动格式化，如果是则直接开启格式化视图
    chrome.storage.sync.get(['autoFormat'], function (result) {
      if (result.autoFormat) {
        createInPageJsonFormatter(jsonContent);
      }
    });
  }

  // 创建页面内JSON格式化器
  function createInPageJsonFormatter(jsonContent) {
    // 保存原始内容
    const originalContent = jsonContent;
    let jsonData;

    try {
      jsonData = JSON.parse(originalContent);
    } catch (e) {
      console.error('JSON解析错误:', e);
      return;
    }

    // 清空当前页面内容
    document.body.innerHTML = '';

    // 设置页面标题
    document.title = 'JSON格式化视图';

    // 创建工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'json-formatter-toolbar';
    toolbar.style.position = 'sticky';
    toolbar.style.top = '0';
    toolbar.style.padding = '10px';
    toolbar.style.background = 'rgba(var(--header-bg-rgb, 255, 255, 255), 0.7)';
    toolbar.style.backdropFilter = 'blur(10px)';
    toolbar.style.webkitBackdropFilter = 'blur(10px)';
    toolbar.style.borderBottom = '1px solid rgba(var(--border-rgb, 222, 226, 230), 0.2)';
    toolbar.style.display = 'flex';
    toolbar.style.gap = '10px';
    toolbar.style.zIndex = '1000';
    toolbar.style.alignItems = 'center';
    toolbar.style.flexWrap = 'wrap';
    toolbar.style.marginBottom = '10px';
    toolbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';

    // 更新工具栏HTML，使用搜索按钮替代搜索框
    toolbar.innerHTML = `
      <button id="edit-mode-btn" class="glass-btn" style="padding:8px 14px;border-radius:8px;cursor:pointer;">编辑模式</button>
      <button id="preview-mode-btn" class="glass-btn active" style="padding:8px 14px;border-radius:8px;cursor:pointer;background:var(--accent-color, #4285f4);color:white;">预览模式</button>
      <button id="copy-btn" class="glass-btn" style="padding:8px 14px;border-radius:8px;cursor:pointer;">复制</button>
      <button id="save-btn" class="glass-btn" style="padding:8px 14px;border-radius:8px;cursor:pointer;">保存</button>
      <button id="expand-all-btn" class="glass-btn" style="padding:8px 14px;border-radius:8px;cursor:pointer;">展开全部</button>
      <button id="collapse-all-btn" class="glass-btn" style="padding:8px 14px;border-radius:8px;cursor:pointer;">折叠全部</button>
      <div class="theme-selector-container">
        <select id="theme-selector" class="theme-selector">
          <option value="light">明亮主题</option>
          <option value="dark">暗黑主题</option>
        </select>
      </div>
      <button id="searchBtn" class="glass-btn icon-btn" title="搜索">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    `;

    // 创建搜索模态框
    const searchModal = document.createElement('div');
    searchModal.id = 'searchModal';
    searchModal.className = 'search-modal';
    searchModal.innerHTML = `
      <div class="search-container glass-effect">
        <div class="search-header">
          <h3>搜索JSON</h3>
          <button id="closeSearchBtn" class="close-btn">×</button>
        </div>
        <div class="search-body">
          <div class="search-input-container">
            <input type="text" id="searchInput" placeholder="输入搜索关键词...">
            <button id="prevResultBtn" class="nav-btn" title="上一个结果">↑</button>
            <button id="nextResultBtn" class="nav-btn" title="下一个结果">↓</button>
          </div>
          <div class="search-info">
            <span id="resultCount">未找到结果</span>
            <label class="case-sensitive">
              <input type="checkbox" id="caseSensitiveToggle">
              <span>区分大小写</span>
            </label>
          </div>
        </div>
      </div>
    `;

    // 创建主容器
    const container = document.createElement('div');
    container.className = 'json-formatter-container';
    container.style.padding = '15px';
    container.style.paddingTop = '0';
    container.style.height = '96%'; // 设置容器高度
    container.style.overflow = 'auto'; // 添加滚动功能

    // 创建编辑器区域
    const editor = document.createElement('div');
    editor.id = 'json-editor';
    editor.style.display = 'none';
    editor.style.width = '100%';

    const textarea = document.createElement('textarea');
    textarea.value = JSON.stringify(jsonData, null, 2);
    textarea.spellcheck = false;
    textarea.style.width = '90%';
    textarea.style.height = '100%';
    textarea.style.border = '1px solid #ddd';
    textarea.style.borderRadius = '8px';
    textarea.style.padding = '10px';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontSize = '14px';
    textarea.style.resize = 'none';
    textarea.style.tabSize = '2';

    editor.appendChild(textarea);

    // 创建预览区域
    const preview = document.createElement('div');
    preview.id = 'json-preview';
    preview.style.fontFamily = 'monospace';
    preview.style.fontSize = '14px';
    preview.style.lineHeight = '1.5';
    preview.style.height = '100%'; // 设置高度为100%以适应容器

    // 添加到页面
    container.appendChild(editor);
    container.appendChild(preview);
    document.body.appendChild(toolbar);
    document.body.appendChild(container);
    document.body.appendChild(searchModal);
    // 注入样式
    injectStyles();

    // 初始渲染JSON
    renderJson(preview, jsonData);

    // 设置事件监听
    setupEventListeners(textarea, preview, originalContent);
  }

  // 注入样式
  function injectStyles() {
    if (document.getElementById('json-formatter-styles')) {
      return; // 避免重复注入
    }

    const style = document.createElement('style');
    style.id = 'json-formatter-styles';
    style.textContent = `
      body { 
        margin: 0; 
        padding: 0; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        overflow: hidden; /* 防止双重滚动条 */
      }
      /* CSS变量定义 */
      :root {
        --accent-rgb: 66, 133, 244;
        --secondary-rgb: 255, 64, 129;
        --card-bg-rgb: 255, 255, 255;
        --input-bg-rgb: 248, 249, 250;
        --button-bg-rgb: 226, 230, 234;
        --button-hover-bg-rgb: 211, 217, 223;
        --border-rgb: 222, 226, 230;
        --header-bg-rgb: 255, 255, 255;
        --scrollbar-thumb: rgba(0, 0, 0, 0.2);
        --accent-color: #4285f4;
        --accent-dark: #3367d6;
        --secondary-color: #ff4081;
        --foreground-color: #333;
        --foreground-rgb: 51, 51, 51;
        --key-color: #881391;
      }
      .json-key {
        color: var(--key-color);
        margin-right: 4px;
      }
      /* 按钮样式 */
      .glass-btn {
        padding: 8px 14px;
        border: none;
        border-radius: 8px;
        background-color: rgba(var(--button-bg-rgb, 226, 230, 234), 0.8);
        color: var(--button-color, #333);
        cursor: pointer;
        font-weight: 500;
        font-size: 13px;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        position: relative;
        overflow: hidden;
      }
      .glass-btn:hover {
        background-color: rgba(var(--button-hover-bg-rgb, 211, 217, 223), 0.9);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }
      .glass-btn:active {
        transform: translateY(1px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      .glass-btn.active {
        background-color: var(--accent-color);
        color: white;
      }
      /* 水波纹效果 - 修复版本 */
      .glass-btn .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.7);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      }
      
      @keyframes ripple {
        to {
          transform: scale(1);
          opacity: 0;
        }
      }
      
      body.dark-theme .glass-btn .ripple {
        background-color: rgba(255, 255, 255, 0.3);
      }
      
      /* 主题选择器美化 */
      .theme-selector-container {
        position: relative;
        display: inline-flex;
        align-items: center;
      }
      
      .theme-selector {
        appearance: none;
        -webkit-appearance: none;
        padding: 8px 32px 8px 14px;
        border: none;
        border-radius: 8px;
        background-color: rgba(var(--button-bg-rgb, 226, 230, 234), 0.8);
        color: var(--foreground-color, #333);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        position: relative;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      
      .theme-selector:hover {
        background-color: rgba(var(--button-hover-bg-rgb, 211, 217, 223), 0.9);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }
      
      .theme-selector:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.2);
      }
      
      .theme-selector-container::after {
        content: "▼";
        font-size: 9px;
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--foreground-color, #333);
        opacity: 0.7;
        transition: all 0.2s ease;
      }
      
      .theme-selector-container:hover::after {
        opacity: 1;
        transform: translateY(-50%) translateY(1px);
      }
      
      /* 搜索按钮样式 */
      .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px !important;
        width: 36px;
        height: 36px;
      }
      
      /* 搜索模态框样式 */
      .search-modal {
        display: none;
        position: fixed;
        top: 20px;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1001;
        align-items: flex-start;
        justify-content: center;
        animation: fadeIn 0.2s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .search-container {
        width: 450px;
        background-color: rgba(var(--card-bg-rgb, 255, 255, 255), 0.9);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        animation: slideDown 0.3s ease-out;
      }
      
      @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .glass-effect {
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(var(--border-rgb, 222, 226, 230), 0.2);
      }
      
      .search-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid rgba(var(--border-rgb, 222, 226, 230), 0.3);
      }
      
      .search-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--foreground-color, #333);
      }
      
      .close-btn {
        background: none;
        border: none;
        font-size: 22px;
        color: var(--foreground-color, #333);
        cursor: pointer;
        opacity: 0.7;
        transition: all 0.2s ease;
      }
      
      .close-btn:hover {
        opacity: 1;
        transform: scale(1.1);
      }
      
      .search-body {
        padding: 20px;
      }
      
      .search-input-container {
        display: flex;
        position: relative;
        margin-bottom: 15px;
      }
      
      #searchInput {
        flex: 1;
        padding: 10px 15px;
        border: none;
        border-radius: 8px;
        background-color: rgba(var(--input-bg-rgb, 248, 249, 250), 0.7);
        color: var(--foreground-color, #333);
        font-size: 14px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
      }
      
      #searchInput:focus {
        outline: none;
        background-color: rgba(var(--input-bg-rgb, 248, 249, 250), 0.9);
        box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.2);
      }
      
      .nav-btn {
        width: 36px;
        height: 36px;
        margin-left: 8px;
        background-color: rgba(var(--button-bg-rgb, 226, 230, 234), 0.8);
        color: var(--foreground-color, #333);
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .nav-btn:hover {
        background-color: rgba(var(--button-hover-bg-rgb, 211, 217, 223), 0.9);
        transform: translateY(-1px);
      }
      
      .nav-btn:active {
        transform: translateY(1px);
      }
      
      .search-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        color: rgba(var(--foreground-rgb, 51, 51, 51), 0.7);
      }
      
      .case-sensitive {
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      
      .case-sensitive input {
        margin-right: 5px;
      }
      
      /* 搜索结果高亮 - 增强对比度版本 */
      .json-highlight {
        background-color: rgba(255, 255, 0, 0.4);
        border-radius: 3px;
        box-shadow: 0 0 0 1px rgba(255, 180, 0, 0.6);
        padding: 0 2px;
        margin: 0;
        transition: all 0.2s ease;
        text-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
      }
      
      .json-highlight.json-active-highlight {
        background-color: rgba(255, 165, 0, 0.6);
        box-shadow: 0 0 0 2px rgba(255, 140, 0, 0.7);
        z-index: 1;
        position: relative;
        text-shadow: 0 0 1px rgba(0, 0, 0, 0.2);
      }
      
      /* 暗黑主题样式适配 */
      body.dark-theme .json-highlight {
        background-color: rgba(255, 255, 0, 0.35);
        box-shadow: 0 0 0 1px rgba(255, 180, 0, 0.7);
        color: #ffffff;
      }
      
      body.dark-theme .json-highlight.json-active-highlight {
        background-color: rgba(255, 165, 0, 0.7);
        box-shadow: 0 0 0 2px rgba(255, 140, 0, 0.8);
        color: #ffffff;
      }
      
      body.dark-theme {
        --accent-rgb: 66, 133, 244;
        --secondary-rgb: 255, 64, 129;
        --card-bg-rgb: 35, 39, 47;
        --input-bg-rgb: 29, 32, 38;
        --button-bg-rgb: 49, 54, 63;
        --button-hover-bg-rgb: 59, 64, 74;
        --border-rgb: 73, 80, 87;
        --header-bg-rgb: 35, 39, 47;
        --scrollbar-thumb: rgba(255, 255, 255, 0.2);
        --foreground-color: #d4d4d4;
        --foreground-rgb: 212, 212, 212;
        --key-color: #9cdcfe;
        background-color: #1e1e1e;
        color: #d4d4d4;
      }
      .json-string {
        color: #1a1aa6;
      }
      .json-number {
        color: #0971b2;
      }
      .json-boolean {
        color: #0971b2;
      }
      .json-null {
        color: #0971b2;
      }
      .json-bracket {
        cursor: pointer;
        user-select: none;
        transition: transform 0.2s ease;
        position: relative;
        padding-left: 15px;
        display: inline-block;
      }
      .json-bracket:hover {
        color: #4285f4;
      }
      .json-expanded::before {
        content: '-';
        position: absolute;
        left: 0;
        width: 12px;
        height: 12px;
        line-height: 12px;
        font-size: 16px;
        text-align: center;
        color: #888;
        transition: transform 0.2s ease;
      }
      .json-collapsed::before {
        content: '+';
        position: absolute;
        left: 0;
        width: 12px;
        height: 12px;
        line-height: 12px;
        font-size: 16px;
        text-align: center;
        color: #888;
        transition: transform 0.2s ease;
      }
      .json-bracket:hover::before {
        color: #4285f4;
      }
      .collapsible-content {
        padding-left: 20px !important;
        overflow: hidden !important;
        transition: height 0.3s ease-in-out, opacity 0.2s ease-in-out !important;
        border-left: 1px dashed rgba(222, 226, 230, 0.8) !important;
        margin-left: 4px !important;
        position: relative !important;
      }
      .collapsible-content::before {
        content: '' !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        height: 100% !important;
        border-left: 1px solid rgba(222, 226, 230, 0.4) !important;
        margin-left: -1px !important;
      }
      .collapsible-content.collapsed {
        height: 0 !important;
        opacity: 0 !important;
      }
      .collapsible-content > div {
        position: relative !important;
        min-height: 20px !important;
        line-height: 1.5 !important;
      }
      body.dark-theme {
        background-color: #1e1e1e;
        color: #d4d4d4;
      }
      body.dark-theme .json-formatter-toolbar {
        background: #2d2d2d;
        border-bottom: 1px solid #444;
      }
      body.dark-theme .json-formatter-toolbar button, 
      body.dark-theme .json-formatter-toolbar select,
      body.dark-theme .json-formatter-toolbar input {
        background: #3a3a3a;
        color: #d4d4d4;
        border-color: #555;
      }
      body.dark-theme #json-editor textarea {
        background: #1e1e1e;
        color: #d4d4d4;
        border-color: #444;
      }
      body.dark-theme .json-key {
        color: #9cdcfe;
      }
      body.dark-theme .json-string {
        color: #ce9178;
      }
      body.dark-theme .json-number, 
      body.dark-theme .json-boolean, 
      body.dark-theme .json-null {
        color: #b5cea8;
      }
      body.dark-theme .json-bracket:hover::before {
        color: #6ca9f0;
      }
      body.dark-theme .collapsible-content {
        border-left: 1px dashed rgba(73, 80, 87, 0.8) !important;
      }
      body.dark-theme .collapsible-content::before {
        border-left: 1px solid rgba(73, 80, 87, 0.4) !important;
      }
      .json-formatter-toolbar {
        position: sticky;
        top: 0;
        padding: 10px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        display: flex;
        gap: 10px;
        z-index: 1000;
        margin-bottom: 10px;
      }
      .json-formatter-container {
        padding: 15px;
        padding-top: 0;
        margin-top: 10px;
        overflow: auto; /* 添加滚动功能 */
      }
      #json-editor {
        width: 80%;
        height: calc(100vh - 120px);
        margin-top: 60px;
      }
      #json-preview {
        margin-top: 80px;
      }
    `;
    document.head.appendChild(style);
  }

  // 渲染JSON
  function renderJson(element, data, isCollapsed = false) {
    element.innerHTML = '';
    element.appendChild(createJsonView(data, isCollapsed));
  }

  // 创建JSON视图
  function createJsonView(data, isCollapsed = false) {
    const container = document.createElement('div');
    container.style.display = 'inline'; // 确保元素内联显示

    if (data === null) {
      const nullNode = document.createElement('span');
      nullNode.className = 'json-null';
      nullNode.textContent = 'null';
      container.appendChild(nullNode);
      return container;
    }

    if (typeof data === 'boolean') {
      const boolNode = document.createElement('span');
      boolNode.className = 'json-boolean';
      boolNode.textContent = data ? 'true' : 'false';
      container.appendChild(boolNode);
      return container;
    }

    if (typeof data === 'number') {
      const numNode = document.createElement('span');
      numNode.className = 'json-number';
      numNode.textContent = data;
      container.appendChild(numNode);
      return container;
    }

    if (typeof data === 'string') {
      const strNode = document.createElement('span');
      strNode.className = 'json-string';
      strNode.textContent = `"${data}"`;
      container.appendChild(strNode);
      return container;
    }

    if (Array.isArray(data)) {
      return createArrayView(data, isCollapsed);
    }

    if (typeof data === 'object') {
      return createObjectView(data, isCollapsed);
    }

    return container;
  }

  // 创建对象视图
  function createObjectView(obj, isCollapsed) {
    const container = document.createElement('div');
    container.style.display = 'inline-block';

    const isEmpty = Object.keys(obj).length === 0;

    if (isEmpty) {
      container.textContent = '{}';
      return container;
    }

    const bracketSpan = document.createElement('span');
    bracketSpan.className = isCollapsed ? 'json-bracket json-collapsed' : 'json-bracket json-expanded';
    bracketSpan.textContent = '{';
    container.appendChild(bracketSpan);

    const content = document.createElement('div');
    content.className = 'collapsible-content';
    if (isCollapsed) {
      content.classList.add('collapsed');
    }

    // 填充内容
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';

      // 创建key部分
      const keySpan = document.createElement('span');
      keySpan.className = 'json-key';
      keySpan.textContent = `"${key}": `;
      row.appendChild(keySpan);

      // 添加value部分
      const valueContainer = createJsonView(obj[key], isCollapsed);
      valueContainer.style.display = 'inline';
      row.appendChild(valueContainer);

      // 如果不是最后一个元素，添加逗号
      if (i < keys.length - 1) {
        row.appendChild(document.createTextNode(','));
      }

      content.appendChild(row);
    }

    container.appendChild(content);

    // 闭合括号改为span，保持在同一行
    const closingBracket = document.createElement('span');
    closingBracket.textContent = '}';
    closingBracket.style.display = 'inline-block';
    container.appendChild(closingBracket);

    // 单击展开/折叠功能
    bracketSpan.addEventListener('click', () => {
      const isExpanded = bracketSpan.classList.contains('json-expanded');

      if (isExpanded) {
        // 折叠
        const contentHeight = content.scrollHeight;
        content.style.height = contentHeight + 'px';
        content.offsetHeight; // 触发重绘

        bracketSpan.classList.remove('json-expanded');
        bracketSpan.classList.add('json-collapsed');
        content.classList.add('collapsed');
      } else {
        // 展开
        bracketSpan.classList.remove('json-collapsed');
        bracketSpan.classList.add('json-expanded');
        content.classList.remove('collapsed');

        const contentHeight = content.scrollHeight;
        content.style.height = contentHeight + 'px';

        setTimeout(() => {
          content.style.height = '';
        }, 300);
      }
    });

    return container;
  }

  // 创建数组视图
  function createArrayView(arr, isCollapsed) {
    const container = document.createElement('div');
    container.style.display = 'inline-block';

    const isEmpty = arr.length === 0;

    if (isEmpty) {
      container.textContent = '[]';
      return container;
    }

    const bracketSpan = document.createElement('span');
    bracketSpan.className = isCollapsed ? 'json-bracket json-collapsed' : 'json-bracket json-expanded';
    bracketSpan.textContent = '[';
    container.appendChild(bracketSpan);

    const content = document.createElement('div');
    content.className = 'collapsible-content';
    if (isCollapsed) {
      content.classList.add('collapsed');
    }

    // 填充数组内容
    for (let i = 0; i < arr.length; i++) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';

      // 添加值
      const valueContainer = createJsonView(arr[i], isCollapsed);
      valueContainer.style.display = 'inline';
      row.appendChild(valueContainer);

      // 如果不是最后一个元素，添加逗号
      if (i < arr.length - 1) {
        row.appendChild(document.createTextNode(','));
      }

      content.appendChild(row);
    }

    container.appendChild(content);

    // 闭合括号改为span，保持在同一行
    const closingBracket = document.createElement('span');
    closingBracket.textContent = ']';
    closingBracket.style.display = 'inline-block';
    container.appendChild(closingBracket);

    // 单击展开/折叠功能
    bracketSpan.addEventListener('click', () => {
      const isExpanded = bracketSpan.classList.contains('json-expanded');

      if (isExpanded) {
        // 折叠
        const contentHeight = content.scrollHeight;
        content.style.height = contentHeight + 'px';
        content.offsetHeight; // 触发重绘

        bracketSpan.classList.remove('json-expanded');
        bracketSpan.classList.add('json-collapsed');
        content.classList.add('collapsed');
      } else {
        // 展开
        bracketSpan.classList.remove('json-collapsed');
        bracketSpan.classList.add('json-expanded');
        content.classList.remove('collapsed');

        const contentHeight = content.scrollHeight;
        content.style.height = contentHeight + 'px';

        setTimeout(() => {
          content.style.height = '';
        }, 300);
      }
    });

    return container;
  }

  // 设置事件监听
  function setupEventListeners(textarea, preview, originalContent) {
    const editBtn = document.getElementById('edit-mode-btn');
    const previewBtn = document.getElementById('preview-mode-btn');
    const copyBtn = document.getElementById('copy-btn');
    const saveBtn = document.getElementById('save-btn');
    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    const themeSelector = document.getElementById('theme-selector');

    // 搜索相关元素
    const searchBtn = document.getElementById('searchBtn');
    const searchModal = document.getElementById('searchModal');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchInput = document.getElementById('searchInput');
    const prevResultBtn = document.getElementById('prevResultBtn');
    const nextResultBtn = document.getElementById('nextResultBtn');
    const resultCount = document.getElementById('resultCount');
    const caseSensitiveToggle = document.getElementById('caseSensitiveToggle');

    // 搜索状态变量
    let currentHighlightIndex = -1;
    let highlightedElements = [];

    // 确保搜索相关元素已正确加载
    if (!searchBtn || !searchModal || !closeSearchBtn || !searchInput) {
      console.error('搜索相关元素未找到，可能DOM尚未完全加载');
      return;
    }

    // 添加水波纹效果到所有按钮 - 修复版本
    const buttons = document.querySelectorAll('.glass-btn');
    buttons.forEach(button => {
      button.addEventListener('click', function (e) {
        // 删除之前可能存在的ripple元素
        const oldRipples = this.querySelectorAll('.ripple');
        oldRipples.forEach(oldRipple => oldRipple.remove());

        // 获取按钮尺寸和点击位置
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 计算需要的圆形直径（取按钮对角线长度的两倍确保覆盖）
        const diameter = Math.max(rect.width, rect.height) * 2;

        // 创建水波纹元素
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = `${diameter}px`;
        ripple.style.height = `${diameter}px`;
        ripple.style.left = `${x - diameter / 2}px`;
        ripple.style.top = `${y - diameter / 2}px`;

        this.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });

    // 修复模式切换 - 确保只有当前选中的模式按钮显示为激活状态
    editBtn.addEventListener('click', () => {
      document.getElementById('json-editor').style.display = 'block';
      document.getElementById('json-preview').style.display = 'none';

      // 更新按钮状态
      editBtn.classList.add('active');
      editBtn.style.backgroundColor = 'var(--accent-color, #4285f4)';
      editBtn.style.color = 'white';

      previewBtn.classList.remove('active');
      previewBtn.style.backgroundColor = 'rgba(var(--button-bg-rgb, 226, 230, 234), 0.8)';
      previewBtn.style.color = 'var(--button-color, #333)';
    });

    previewBtn.addEventListener('click', () => {
      try {
        const jsonData = JSON.parse(textarea.value);
        renderJson(preview, jsonData);
        document.getElementById('json-editor').style.display = 'none';
        document.getElementById('json-preview').style.display = 'block';

        // 更新按钮状态
        previewBtn.classList.add('active');
        previewBtn.style.backgroundColor = 'var(--accent-color, #4285f4)';
        previewBtn.style.color = 'white';

        editBtn.classList.remove('active');
        editBtn.style.backgroundColor = 'rgba(var(--button-bg-rgb, 226, 230, 234), 0.8)';
        editBtn.style.color = 'var(--button-color, #333)';
      } catch (e) {
        alert('JSON格式错误: ' + e.message);
      }
    });

    // 复制按钮
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(textarea.value)
        .then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = '已复制!';
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 1500);
        })
        .catch(err => {
          console.error('复制失败:', err);
        });
    });

    // 保存按钮 (下载JSON文件)
    saveBtn.addEventListener('click', () => {
      try {
        const jsonData = JSON.parse(textarea.value);
        const formattedJson = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([formattedJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        alert('JSON格式错误: ' + e.message);
      }
    });

    // 展开/折叠
    expandAllBtn.addEventListener('click', () => {
      if (document.getElementById('json-preview').style.display !== 'none') {
        const collapsedElements = document.querySelectorAll('.json-collapsed');
        collapsedElements.forEach(elem => {
          elem.click();
        });
      }
    });

    collapseAllBtn.addEventListener('click', () => {
      if (document.getElementById('json-preview').style.display !== 'none') {
        const expandedElements = document.querySelectorAll('.json-expanded');
        expandedElements.forEach(elem => {
          elem.click();
        });
      }
    });

    // 主题切换
    themeSelector.addEventListener('change', (e) => {
      if (e.target.value === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    });

    // 搜索按钮点击事件 - 显示搜索模态框
    searchBtn.addEventListener('click', () => {
      searchModal.style.display = 'flex';
      searchInput.focus();

      // 如果之前有搜索内容，重新执行搜索以刷新高亮
      if (searchInput.value.trim() !== '') {
        performSearch();
      }
    });

    // 关闭搜索模态框
    closeSearchBtn.addEventListener('click', () => {
      searchModal.style.display = 'none';
    });

    // 点击模态框背景关闭
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        searchModal.style.display = 'none';
      }
    });

    // 搜索输入框事件
    searchInput.addEventListener('input', performSearch);

    // 区分大小写切换
    caseSensitiveToggle.addEventListener('change', performSearch);

    // 上一个/下一个结果导航
    prevResultBtn.addEventListener('click', () => navigateResults(-1));
    nextResultBtn.addEventListener('click', () => navigateResults(1));

    // 键盘快捷键 - 回车(下一个)，Shift+回车(上一个)，Esc(关闭)
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          navigateResults(-1); // 上一个结果
        } else {
          navigateResults(1); // 下一个结果
        }
        e.preventDefault();
      } else if (e.key === 'Escape') {
        searchModal.style.display = 'none';
      }
    });

    // 执行搜索
    function performSearch() {
      const searchTerm = searchInput.value.trim();
      const isCaseSensitive = caseSensitiveToggle.checked;

      // 清除之前的高亮
      clearHighlights();

      if (searchTerm === '') {
        resultCount.textContent = '未找到结果';
        return;
      }

      if (document.getElementById('json-preview').style.display !== 'none') {
        // 高亮匹配项
        const allTextNodes = document.querySelectorAll('.json-key, .json-string, .json-number, .json-boolean, .json-null');

        allTextNodes.forEach(node => {
          const nodeText = node.textContent;
          const searchValue = isCaseSensitive ? searchTerm : searchTerm.toLowerCase();
          const compareText = isCaseSensitive ? nodeText : nodeText.toLowerCase();

          if (compareText.includes(searchValue)) {
            // 展开所有父节点
            let parent = node.parentElement;
            while (parent) {
              const collapsible = parent.querySelector('.json-collapsed');
              if (collapsible) {
                collapsible.click();
              }
              parent = parent.parentElement;
            }

            // 高亮节点
            node.classList.add('json-highlight');
            highlightedElements.push(node);
          }
        });

        // 更新结果计数
        if (highlightedElements.length > 0) {
          resultCount.textContent = `找到 ${highlightedElements.length} 个结果`;
          // 自动导航到第一个结果
          currentHighlightIndex = 0;
          setActiveHighlight();
        } else {
          resultCount.textContent = '未找到结果';
        }
      }
    }

    // 清除所有高亮
    function clearHighlights() {
      document.querySelectorAll('.json-highlight').forEach(elem => {
        elem.classList.remove('json-highlight', 'json-active-highlight');
      });
      highlightedElements = [];
      currentHighlightIndex = -1;
    }

    // 设置当前活动高亮
    function setActiveHighlight() {
      if (highlightedElements.length === 0) return;

      // 移除之前的活动高亮
      document.querySelectorAll('.json-active-highlight').forEach(elem => {
        elem.classList.remove('json-active-highlight');
      });

      // 设置新的活动高亮
      const activeElement = highlightedElements[currentHighlightIndex];
      activeElement.classList.add('json-active-highlight');

      // 滚动到视图中
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // 更新结果计数显示
      resultCount.textContent = `结果 ${currentHighlightIndex + 1} / ${highlightedElements.length}`;
    }

    // 导航结果
    function navigateResults(direction) {
      if (highlightedElements.length === 0) return;

      currentHighlightIndex = (currentHighlightIndex + direction + highlightedElements.length) % highlightedElements.length;
      setActiveHighlight();
    }
  }

  // 为pre元素添加格式化按钮 (原有功能)
  function addFormatButton(preElement, jsonContent) {
    // 创建一个格式化按钮
    const button = document.createElement('button');
    button.textContent = '插件内格式化';
    button.style.position = 'absolute';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = '5px 10px';
    button.style.backgroundColor = '#4285f4';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    // 添加鼠标悬停效果
    button.onmouseover = function () {
      this.style.backgroundColor = '#3367d6';
    }
    button.onmouseout = function () {
      this.style.backgroundColor = '#4285f4';
    }

    // 点击按钮时，发送JSON内容到扩展
    button.onclick = function () {
      chrome.runtime.sendMessage({
        action: "formatJson",
        json: jsonContent
      });
    }

    // 确保pre元素的父级有相对定位
    const parent = preElement.parentElement;
    const originalPosition = window.getComputedStyle(parent).position;
    if (originalPosition === 'static') {
      parent.style.position = 'relative';
    }

    // 添加按钮到pre元素的父级
    parent.appendChild(button);
  }

  // 为整个页面添加格式化按钮 (原有功能)
  function addFormatButtonToBody(jsonContent) {
    // 创建一个浮动按钮
    const button = document.createElement('button');
    button.textContent = '插件内格式化';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = '8px 12px';
    button.style.backgroundColor = '#4285f4';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    button.style.fontSize = '14px';

    // 添加鼠标悬停效果
    button.onmouseover = function () {
      this.style.backgroundColor = '#3367d6';
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    }
    button.onmouseout = function () {
      this.style.backgroundColor = '#4285f4';
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    }

    // 添加过渡效果
    button.style.transition = 'all 0.2s ease-in-out';

    // 点击按钮时，发送JSON内容到扩展
    button.onclick = function () {
      chrome.runtime.sendMessage({
        action: "formatJson",
        json: jsonContent
      });
    }

    // 添加按钮到body
    document.body.appendChild(button);
  }

  // 为选中文本添加右键菜单处理
  document.addEventListener('mouseup', function (event) {
    // 检查是否有选中的文本
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      // 尝试解析为JSON
      try {
        JSON.parse(selectedText);
        // 如果是有效的JSON，通知background脚本
        chrome.runtime.sendMessage({
          action: "enableContextMenu",
          hasSelection: true
        });
      } catch (e) {
        // 不是有效的JSON
        chrome.runtime.sendMessage({
          action: "enableContextMenu",
          hasSelection: false
        });
      }
    } else {
      // 没有选中文本
      chrome.runtime.sendMessage({
        action: "enableContextMenu",
        hasSelection: false
      });
    }
  });

  // 页面加载完成后检测JSON内容
  window.addEventListener('load', function () {
    detectJsonContent();
  });
})();
