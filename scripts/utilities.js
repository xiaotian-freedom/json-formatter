/**
 * 显示通知消息
 * 全局通知功能，所有脚本均可调用
 * @param {string} message - 通知消息内容
 * @param {string} type - 通知类型 (info, success, error 等)
 */
function showNotification(message, type = "info") {
  // 检查并创建通知容器
  let notificationContainer = document.querySelector('.notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
  }

  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // 添加到容器
  notificationContainer.appendChild(notification);

  // 显示通知
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // 设置自动隐藏
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
      // 如果没有其他通知，移除容器
      if (notificationContainer.children.length === 0) {
        notificationContainer.remove();
      }
    }, 400);
  }, 3000);
}

// 确保函数在全局作用域可用
window.showNotification = showNotification; 