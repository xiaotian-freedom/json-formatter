// 检测页面中的JSON内容并添加格式化功能
(function() {
  // 监听来自background.js或popup.js的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkForJson") {
      // 检查当前页面是否为纯JSON内容
      detectJsonContent();
      sendResponse({success: true});
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
        
        // 如果解析成功，添加"格式化"按钮
        addFormatButton(preElements[0], content);
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
        
        // 如果解析成功，添加"格式化"按钮到页面顶部
        addFormatButtonToBody(content);
        return true;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }
  
  // 为pre元素添加格式化按钮
  function addFormatButton(preElement, jsonContent) {
    // 创建一个格式化按钮
    const button = document.createElement('button');
    button.textContent = '使用JSON格式化工具';
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
    button.onmouseover = function() {
      this.style.backgroundColor = '#3367d6';
    }
    button.onmouseout = function() {
      this.style.backgroundColor = '#4285f4';
    }
    
    // 点击按钮时，发送JSON内容到扩展
    button.onclick = function() {
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
  
  // 为整个页面添加格式化按钮
  function addFormatButtonToBody(jsonContent) {
    // 创建一个浮动按钮
    const button = document.createElement('button');
    button.textContent = '使用JSON格式化工具';
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
    button.onmouseover = function() {
      this.style.backgroundColor = '#3367d6';
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    }
    button.onmouseout = function() {
      this.style.backgroundColor = '#4285f4';
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    }
    
    // 添加过渡效果
    button.style.transition = 'all 0.2s ease-in-out';
    
    // 点击按钮时，发送JSON内容到扩展
    button.onclick = function() {
      chrome.runtime.sendMessage({
        action: "formatJson",
        json: jsonContent
      });
    }
    
    // 添加按钮到body
    document.body.appendChild(button);
  }
  
  // 为选中文本添加右键菜单处理
  document.addEventListener('mouseup', function(event) {
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
  window.addEventListener('load', function() {
    detectJsonContent();
  });
})(); 