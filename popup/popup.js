document.addEventListener("DOMContentLoaded", () => {
  const jsonInput = document.getElementById("jsonInput");
  const jsonViewer = document.getElementById("jsonViewer");
  const formatBtn = document.getElementById("formatBtn");
  const copyBtn = document.getElementById("copyBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const expandAllBtn = document.getElementById("expandAllBtn");
  const collapseAllBtn = document.getElementById("collapseAllBtn");
  const themeToggle = document.getElementById("themeToggle");
  const autoFormatToggle = document.getElementById("autoFormatToggle");
  const tsModelBtn = document.getElementById("tsModelBtn");

  // 创建JSON查看器实例
  const viewer = new JsonViewer(jsonViewer);

  // 设置点击回调函数
  viewer.setClickCallback((value) => {
    jsonInput.value = value;
    // 自动格式化点击填充的JSON
    // if (autoFormatToggle.checked && value) {
    //   formatJson();
    // }
  });

  // 检查是否有待处理的JSON数据
  chrome.storage.local.get("pendingJson", (data) => {
    if (data.pendingJson) {
      jsonInput.value = data.pendingJson;
      // 自动格式化JSON
      formatJson();
      // 清除存储的数据
      chrome.storage.local.remove("pendingJson");
    }
  });

  // 加载保存的主题设置和自动格式化设置
  chrome.storage.sync.get(["theme", "autoFormat"], (data) => {
    if (data.theme === "dark") {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      themeToggle.checked = true;
    }

    // 加载自动格式化设置
    if (data.autoFormat === true) {
      autoFormatToggle.checked = true;
    }
  });

  // 检查是否有待处理的JSON数据
  chrome.storage.local.get("pendingJson", (data) => {
    if (data.pendingJson) {
      jsonInput.value = data.pendingJson;
      // 自动格式化JSON
      formatJson();
      // 清除存储的数据
      chrome.storage.local.remove("pendingJson");
    }
  });

  // 格式化JSON函数
  function formatJson() {
    const jsonString = jsonInput.value.trim();
    if (jsonString) {
      try {
        // 先尝试解析JSON，验证格式是否正确
        JSON.parse(jsonString);
        // JSON格式正确才加载到查看器
        viewer.load(jsonString);
        showNotification(__("formatSuccess"), "success");
      } catch (e) {
        viewer.load(jsonString);
        // showNotification(__("jsonInvalid", e.message), "error");
      }
    }
  }

  // 保存主题设置
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      chrome.storage.sync.set({ "theme": "dark" });
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
      chrome.storage.sync.set({ "theme": "light" });
    }
  });

  // 保存自动格式化设置
  autoFormatToggle.addEventListener("change", () => {
    chrome.storage.sync.set({ "autoFormat": autoFormatToggle.checked });
  });

  // 添加粘贴事件监听
  jsonInput.addEventListener("paste", () => {
    setTimeout(() => {
      if (autoFormatToggle.checked && jsonInput.value.trim()) {
        // 添加水波纹效果
        formatBtn.classList.add('ripple');
        setTimeout(() => {
          formatBtn.classList.remove('ripple');
        }, 600);

        formatJson();
      }
    }, 100);
  });

  // 格式化JSON
  formatBtn.addEventListener("click", (e) => {
    // 添加水波纹效果
    formatBtn.classList.add('ripple');

    // 动画结束后移除class
    setTimeout(() => {
      formatBtn.classList.remove('ripple');
    }, 600); // 与动画持续时间相同

    // 执行格式化
    formatJson();
  });

  // 复制格式化后的JSON
  copyBtn.addEventListener("click", () => {
    if (viewer.jsonData) {
      const formattedJson = JSON.stringify(viewer.jsonData, null, 2);
      navigator.clipboard.writeText(formattedJson)
        .then(() => {
          showNotification(__("copySuccess"), "success");
        })
        .catch(err => {
          showNotification(__("copyFailed", err), "error");
        });
    }
  });

  // 下载格式化后的JSON
  downloadBtn.addEventListener("click", () => {
    try {
      const jsonString = jsonInput.value.trim();
      if (!jsonString) {
        showNotification(__("jsonEmpty"), "error");
        return;
      }
      const jsonBlob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(jsonBlob);

      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `formatted_json_${new Date().getTime()}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      showNotification(__("downloadSuccess"), "success");
    } catch (err) {
      showNotification(__("downloadFailed", err), "error");
    }
  });

  // 展开所有节点
  expandAllBtn.addEventListener("click", () => {
    if (!viewer.jsonData) {
      showNotification("JSON为空", "error");
      return;
    }
    viewer.expandAll();
  });

  // 折叠所有节点
  collapseAllBtn.addEventListener("click", () => {
    if (!viewer.jsonData) {
      showNotification("JSON为空", "error");
      return;
    }
    viewer.collapseAll();
  });

  // 切换主题
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      chrome.storage.sync.set({ theme: "dark" });
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
      chrome.storage.sync.set({ theme: "light" });
    }
  });

  // 添加分隔线拖动调整功能
  const contentContainer = document.querySelector('.content-container');
  const inputArea = document.querySelector('.input-area');
  const outputArea = document.querySelector('.output-area');
  let isResizing = false;
  let startX, startWidth;

  // 创建并添加分隔线
  const resizer = document.createElement('div');
  resizer.className = 'resizer';
  contentContainer.appendChild(resizer);

  // 添加拖动事件
  resizer.addEventListener('mousedown', function (e) {
    isResizing = true;
    startX = e.clientX;
    startWidth = inputArea.getBoundingClientRect().width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', function (e) {
    if (!isResizing) return;

    // 计算新宽度比例
    const containerWidth = contentContainer.getBoundingClientRect().width;
    let newWidth = ((startWidth + e.clientX - startX) / containerWidth) * 100;

    // 限制最小/最大宽度
    newWidth = Math.max(20, Math.min(80, newWidth));

    // 应用新宽度
    inputArea.style.flex = `0 0 ${newWidth}%`;
    outputArea.style.flex = `0 0 ${100 - newWidth}%`;

    // 更新分隔线位置
    resizer.style.left = `${newWidth}%`;
    resizer.style.transform = 'translateX(-50%)';
  });

  document.addEventListener('mouseup', function () {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });

  // 为所有玻璃按钮添加水波纹效果
  const glassButtons = document.querySelectorAll('.glass-btn');
  glassButtons.forEach(button => {
    button.addEventListener('click', function () {
      this.classList.add('ripple');
      setTimeout(() => {
        this.classList.remove('ripple');
      }, 600);
    });
  });

  // 搜索功能元素
  const searchBtn = document.getElementById("searchBtn");
  const searchModal = document.getElementById("searchModal");
  const closeSearchBtn = document.getElementById("closeSearchBtn");
  const searchInput = document.getElementById("searchInput");
  const prevResultBtn = document.getElementById("prevResultBtn");
  const nextResultBtn = document.getElementById("nextResultBtn");
  const resultCount = document.getElementById("resultCount");
  const caseSensitiveToggle = document.getElementById("caseSensitiveToggle");

  // 搜索状态变量
  let searchResults = [];
  let currentResultIndex = -1;

  // 搜索按钮点击事件
  searchBtn.addEventListener("click", () => {
    searchModal.classList.add("active");
    searchInput.focus();
    // 如果已经有搜索内容，立即执行搜索
    if (searchInput.value.trim()) {
      performSearch();
    }
  });

  // 关闭搜索弹窗
  closeSearchBtn.addEventListener("click", () => {
    searchModal.classList.remove("active");
    // 清除所有高亮
    clearHighlights();
  });

  // 点击弹窗外部关闭
  searchModal.addEventListener("click", (e) => {
    if (e.target === searchModal) {
      searchModal.classList.remove("active");
      clearHighlights();
    }
  });

  // 快捷键支持
  document.addEventListener("keydown", (e) => {
    // Esc关闭弹窗
    if (e.key === "Escape" && searchModal.classList.contains("active")) {
      searchModal.classList.remove("active");
      clearHighlights();
    }

    // Ctrl+F打开搜索
    if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      searchModal.classList.add("active");
      searchInput.focus();
    }

    // 回车键执行搜索
    if (e.key === "Enter" && searchModal.classList.contains("active")) {
      if (e.shiftKey) {
        navigateToPrevResult();
      } else {
        navigateToNextResult();
      }
    }
  });

  // 输入框实时搜索
  searchInput.addEventListener("input", performSearch);

  // 区分大小写切换
  caseSensitiveToggle.addEventListener("change", performSearch);

  // 搜索导航按钮
  prevResultBtn.addEventListener("click", navigateToPrevResult);
  nextResultBtn.addEventListener("click", navigateToNextResult);

  // 执行搜索
  function performSearch() {
    const searchTerm = searchInput.value.trim();

    // 清除现有高亮
    clearHighlights();

    if (!searchTerm) {
      resultCount.textContent = __("noResults");
      searchResults = [];
      currentResultIndex = -1;
      return;
    }

    // 获取JSON查看器中的所有文本节点
    const jsonViewer = document.getElementById("jsonViewer");
    searchResults = [];
    findTextNodesWithTerm(jsonViewer, searchTerm, caseSensitiveToggle.checked);

    if (searchResults.length > 0) {
      resultCount.textContent = __("results", searchResults.length);
      currentResultIndex = 0;
      highlightResults();
      navigateToResult(0);
    } else {
      resultCount.textContent = __("noResults");
      currentResultIndex = -1;
    }
  }

  // 查找包含搜索词的文本节点
  function findTextNodesWithTerm(element, term, caseSensitive) {
    if (!element) return;

    // 检查所有子节点
    Array.from(element.childNodes).forEach(node => {
      // 文本节点
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        let searchText = text;
        let searchTerm = term;

        if (!caseSensitive) {
          searchText = text.toLowerCase();
          searchTerm = term.toLowerCase();
        }

        if (searchText.includes(searchTerm)) {
          searchResults.push({
            node: node,
            text: text,
            term: term,
            caseSensitive: caseSensitive
          });
        }
      }
      // 元素节点，递归搜索
      else if (node.nodeType === Node.ELEMENT_NODE) {
        // 不要搜索已经折叠的节点
        if (!node.classList || !node.classList.contains("collapsed")) {
          findTextNodesWithTerm(node, term, caseSensitive);
        }
      }
    });
  }

  // 高亮所有结果
  function highlightResults() {
    searchResults.forEach((result, index) => {
      const node = result.node;
      const parent = node.parentNode;
      const text = result.text;
      const term = result.term;
      const caseSensitive = result.caseSensitive;

      // 创建一个文档片段
      const fragment = document.createDocumentFragment();

      let remaining = text;
      let lastIndex = 0;

      // 查找所有匹配项
      while (true) {
        const searchText = caseSensitive ? remaining : remaining.toLowerCase();
        const searchTerm = caseSensitive ? term : term.toLowerCase();
        const index = searchText.indexOf(searchTerm, lastIndex);

        if (index === -1) break;

        // 添加前面的文本
        if (index > 0) {
          fragment.appendChild(document.createTextNode(
            remaining.substring(lastIndex, index)
          ));
        }

        // 创建高亮span
        const highlight = document.createElement("span");
        highlight.className = "json-highlight";
        highlight.textContent = remaining.substring(index, index + term.length);
        highlight.dataset.searchIndex = searchResults.indexOf(result);
        fragment.appendChild(highlight);

        lastIndex = index + term.length;
      }

      // 添加剩余文本
      if (lastIndex < remaining.length) {
        fragment.appendChild(document.createTextNode(
          remaining.substring(lastIndex)
        ));
      }

      // 替换原始节点
      parent.replaceChild(fragment, node);
    });
  }

  // 导航到特定结果
  function navigateToResult(index) {
    // 移除之前的当前高亮
    const currentHighlights = document.querySelectorAll(".json-current-highlight");
    currentHighlights.forEach(el => {
      el.classList.remove("json-current-highlight");
    });

    if (searchResults.length === 0 || index < 0 || index >= searchResults.length) {
      return;
    }

    // 查找当前索引对应的高亮元素
    const highlightElements = document.querySelectorAll(`.json-highlight[data-search-index="${index}"]`);

    if (highlightElements.length > 0) {
      const highlight = highlightElements[0];
      highlight.classList.add("json-current-highlight");

      // 滚动到视图
      highlight.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      // 更新结果计数显示
      resultCount.textContent = __("currentResult", index + 1, searchResults.length);
    }
  }

  // 导航到下一个结果
  function navigateToNextResult() {
    if (searchResults.length === 0) return;

    currentResultIndex = (currentResultIndex + 1) % searchResults.length;
    navigateToResult(currentResultIndex);
  }

  // 导航到上一个结果
  function navigateToPrevResult() {
    if (searchResults.length === 0) return;

    currentResultIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    navigateToResult(currentResultIndex);
  }

  // 清除所有高亮
  function clearHighlights() {
    const highlights = document.querySelectorAll(".json-highlight");

    highlights.forEach(highlight => {
      // 获取高亮元素的文本内容
      const text = highlight.textContent;
      // 创建文本节点并替换高亮元素
      const textNode = document.createTextNode(text);
      highlight.parentNode.replaceChild(textNode, highlight);
    });

    // 合并相邻的文本节点
    document.getElementById("jsonViewer").normalize();
  }

  // TS模型生成按钮点击事件
  tsModelBtn.addEventListener("click", () => {
    // 检查是否有有效的JSON数据
    if (!viewer.jsonData) {
      showNotification(__("jsonEmpty") || "请先输入有效的JSON数据", "error");
      return;
    }

    try {
      // 显示TS模型对话框
      if (window.tsModelDialog) {
        // 传递当前JSON数据
        window.tsModelDialog.show(viewer.jsonData);
      } else {
        showNotification(__("tsModelError") || "TS模型生成器初始化失败", "error");
      }
    } catch (error) {
      console.error("TS模型生成错误:", error);
      showNotification(__("tsModelGenerateError", error.message) || `生成TS模型失败: ${error.message}`, "error");
    }
  });
}); 