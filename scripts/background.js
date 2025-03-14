// 初始化右键菜单
chrome.runtime.onInstalled.addListener(() => {
  // 添加右键菜单支持
  chrome.contextMenus.create({
    id: "formatJson",
    title: "锦衣JSON",
    contexts: ["selection"]
  });
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(() => {
  // 检查用户设置的打开方式
  chrome.storage.sync.get("openInNewTab", (data) => {
    const url = chrome.runtime.getURL("popup/popup.html?standalone=true");

    if (data.openInNewTab === true) {
      // 在新标签页打开
      chrome.tabs.create({
        url: url
      });
    } else {
      // 默认在新窗口打开
      chrome.windows.create({
        url: url,
        type: "popup",
        width: 1280,
        height: 1000
      });
    }
  });
});

// 处理消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // 处理右键菜单点击
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "formatJson" && info.selectionText) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: selectedText => {
          try {
            // 将选中文本发送到扩展进行处理
            chrome.runtime.sendMessage({
              action: "formatSelectedJson",
              data: selectedText
            });
          } catch (e) {
            console.error("处理JSON失败:", e);
          }
        },
        args: [info.selectionText]
      });
    }
  });

  // 处理来自content.js的formatJson请求
  if (request.action === "formatJson" && request.json) {
    // 打开独立窗口并传递JSON数据
    chrome.storage.local.set({ "pendingJson": request.json }, function () {
      // 检查用户设置的打开方式
      chrome.storage.sync.get("openInNewTab", (data) => {
        const url = chrome.runtime.getURL("popup/popup.html?standalone=true&source=direct");

        if (data.openInNewTab === true) {
          // 在新标签页打开
          chrome.tabs.create({
            url: url
          });
        } else {
          // 默认在新窗口打开
          chrome.windows.create({
            url: url,
            type: "popup",
            width: 1280,
            height: 1000
          });
        }
      });
    });
  }

  // 处理formatSelectedJson请求
  if (request.action === "formatSelectedJson" && request.data) {
    // 保存选中的JSON到storage
    chrome.storage.local.set({ "pendingJson": request.data }, function () {
      // 检查用户设置的打开方式
      chrome.storage.sync.get("openInNewTab", (data) => {
        const url = chrome.runtime.getURL("popup/popup.html?standalone=true&source=selection");

        if (data.openInNewTab === true) {
          // 在新标签页打开
          chrome.tabs.create({
            url: url
          });
        } else {
          // 默认在新窗口打开
          chrome.windows.create({
            url: url,
            type: "popup",
            width: 1280,
            height: 1000
          });
        }
      });
    });
  }
}); 