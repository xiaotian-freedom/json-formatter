/**
 * JSON图片预览功能
 * 当鼠标悬停在JSON中的图片URL上时显示图片预览
 */
class ImagePreview {
  constructor() {
    // 创建预览容器
    this.container = document.createElement('div');
    this.container.className = 'image-preview-container';
    document.body.appendChild(this.container);
    
    // 内部元素
    this.container.innerHTML = `
      <div class="image-preview-image-container">
        <div class="image-preview-loading">
          <div class="image-preview-spinner"></div>
        </div>
        <img class="image-preview-image" alt="预览">
      </div>
      <div class="image-preview-info">
        <span class="image-preview-filename">图片预览</span>
        <span class="image-preview-dimensions"></span>
      </div>
    `;
    
    // 获取元素引用
    this.imageElement = this.container.querySelector('.image-preview-image');
    this.loadingElement = this.container.querySelector('.image-preview-loading');
    this.filenameElement = this.container.querySelector('.image-preview-filename');
    this.dimensionsElement = this.container.querySelector('.image-preview-dimensions');
    
    // 绑定事件
    this.imageElement.addEventListener('load', this.handleImageLoad.bind(this));
    this.imageElement.addEventListener('error', this.handleImageError.bind(this));
    
    // 当前悬停的元素
    this.currentElement = null;
    this.hideTimeout = null;
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化图片预览功能
   */
  init() {
    // 监听JSON查看器中的变化
    this.setupMutationObserver();
    
    // 初始化现有的图片链接
    this.setupExistingImageLinks();
  }
  
  /**
   * 监听DOM变化以添加新的事件监听器
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          this.setupExistingImageLinks();
        }
      }
    });
    
    // 监听JSON查看器的变化
    const jsonViewer = document.getElementById('jsonViewer');
    if (jsonViewer) {
      observer.observe(jsonViewer, { childList: true, subtree: true });
    }
  }
  
  /**
   * 为现有的图片链接添加事件监听器
   */
  setupExistingImageLinks() {
    // 查找JSON中的所有字符串值
    const stringValues = document.querySelectorAll('.json-string');
    
    stringValues.forEach(element => {
      const text = element.textContent.trim();
      // 移除引号
      const value = text.startsWith('"') && text.endsWith('"') 
        ? text.substring(1, text.length - 1) 
        : text;
      
      // 检查是否为图片URL
      if (this.isImageUrl(value)) {
        // 添加鼠标事件监听器
        element.classList.add('json-image-link');
        
        // 仅在尚未添加监听器的元素上添加
        if (!element.dataset.hasImagePreview) {
          element.dataset.hasImagePreview = 'true';
          element.dataset.imageUrl = value;
          
          element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
          element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
          element.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }
      }
    });
  }
  
  /**
   * 检查URL是否为图片
   */
  isImageUrl(url) {
    if (!url) return false;
    
    try {
      // 先检查URL是否有效
      new URL(url);
      
      // 检查是否有常见图片扩展名
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      const urlLower = url.toLowerCase();
      
      // 检查扩展名
      for (const ext of imageExtensions) {
        if (urlLower.endsWith(ext)) return true;
      }
      
      // 检查URL中是否包含图片相关参数
      if (urlLower.includes('/image/') || urlLower.includes('/img/') || 
          urlLower.includes('&image=') || urlLower.includes('?image=')) {
        return true;
      }
      
      return false;
    } catch (e) {
      // URL无效
      return false;
    }
  }
  
  /**
   * 鼠标进入事件处理
   */
  handleMouseEnter(event) {
    this.currentElement = event.target;
    const imageUrl = event.target.dataset.imageUrl;
    
    // 清除任何现有的隐藏超时
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    
    // 设置加载状态
    this.showLoading();
    
    // 更新预览位置
    this.updatePreviewPosition(event);
    
    // 显示容器
    this.container.classList.add('visible');
    
    // 加载图片
    this.loadImage(imageUrl);
    
    // 设置文件名
    this.setFilename(imageUrl);
  }
  
  /**
   * 鼠标离开事件处理
   */
  handleMouseLeave() {
    this.currentElement = null;
    
    // 延迟隐藏，提供更流畅的体验
    this.hideTimeout = setTimeout(() => {
      this.container.classList.remove('visible');
      
      // 重置图片src，防止保留过多内存
      setTimeout(() => {
        if (!this.currentElement) {
          this.imageElement.src = '';
          this.imageElement.classList.remove('loaded');
        }
      }, 300);
    }, 200);
  }
  
  /**
   * 鼠标移动事件处理
   */
  handleMouseMove(event) {
    this.updatePreviewPosition(event);
  }
  
  /**
   * 更新预览窗口位置
   */
  updatePreviewPosition(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 获取预览容器尺寸
    const previewWidth = this.container.offsetWidth || 350;
    const previewHeight = this.container.offsetHeight || 350;
    
    // 计算位置，避免超出屏幕边界
    let posX = mouseX + 15; // 默认在鼠标右侧
    let posY = mouseY + 15; // 默认在鼠标下方
    
    // 检查右侧边界
    if (posX + previewWidth > windowWidth - 20) {
      posX = mouseX - previewWidth - 15; // 切换到鼠标左侧
    }
    
    // 检查底部边界
    if (posY + previewHeight > windowHeight - 20) {
      posY = windowHeight - previewHeight - 20; // 贴近底部留出间距
    }
    
    // 确保不会超出顶部或左侧
    posX = Math.max(20, posX);
    posY = Math.max(20, posY);
    
    // 应用位置
    this.container.style.left = `${posX}px`;
    this.container.style.top = `${posY}px`;
  }
  
  /**
   * 显示加载状态
   */
  showLoading() {
    this.loadingElement.style.display = 'flex';
    this.imageElement.classList.remove('loaded');
    
    // 清除任何错误显示
    const errorElement = this.container.querySelector('.image-preview-error');
    if (errorElement) {
      errorElement.remove();
    }
  }
  
  /**
   * 加载图片
   */
  loadImage(url) {
    // 设置图片源
    this.imageElement.src = url;
  }
  
  /**
   * 图片加载完成处理
   */
  handleImageLoad() {
    // 隐藏加载指示器
    this.loadingElement.style.display = 'none';
    
    // 显示图片
    this.imageElement.classList.add('loaded');
    
    // 更新尺寸信息
    this.dimensionsElement.textContent = `${this.imageElement.naturalWidth} × ${this.imageElement.naturalHeight}`;
  }
  
  /**
   * 图片加载错误处理
   */
  handleImageError() {
    // 隐藏加载指示器
    this.loadingElement.style.display = 'none';
    
    // 移除现有的错误信息
    const existingError = this.container.querySelector('.image-preview-error');
    if (existingError) {
      existingError.remove();
    }
    
    // 创建错误消息
    const errorElement = document.createElement('div');
    errorElement.className = 'image-preview-error';
    errorElement.textContent = '无法加载图片';
    
    // 插入到容器中
    this.container.querySelector('.image-preview-image-container').appendChild(errorElement);
  }
  
  /**
   * 设置文件名显示
   */
  setFilename(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      // 如果能提取到文件名则显示，否则显示域名
      this.filenameElement.textContent = filename || urlObj.hostname;
    } catch (e) {
      // URL解析错误，使用完整URL
      this.filenameElement.textContent = url.length > 40 ? url.substring(0, 37) + '...' : url;
    }
  }
}

// 在页面加载完成后初始化图片预览功能
document.addEventListener('DOMContentLoaded', () => {
  // 加载CSS
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = chrome.runtime.getURL('styles/image-preview.css');
  document.head.appendChild(linkElement);
  
  // 初始化图片预览
  window.imagePreview = new ImagePreview();
}); 