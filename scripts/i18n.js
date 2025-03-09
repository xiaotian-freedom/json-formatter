/**
 * 国际化工具类
 */
class I18n {
  constructor() {
    // 当前语言
    this.currentLocale = 'zh_CN';
    // 存储所有翻译
    this.messages = {};
    // 初始化
    this.init();
  }

  /**
   * 初始化国际化系统
   */
  async init() {
    // 从存储中获取之前设置的语言
    const storedSettings = await this.getStoredSettings();
    this.currentLocale = storedSettings.language || 'zh_CN';
    
    // 加载翻译数据
    await this.loadMessages(this.currentLocale);
    
    // 翻译页面
    this.translatePage();
    
    // 设置语言选择器的初始值
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.value = this.currentLocale;
      
      // 监听语言变化
      languageSelect.addEventListener('change', async (e) => {
        const newLocale = e.target.value;
        await this.changeLanguage(newLocale);
      });
    }
  }

  /**
   * 获取存储的设置
   */
  getStoredSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        // 默认设置
        language: 'zh_CN',
        theme: 'light',
        autoFormat: true
      }, (items) => {
        resolve(items);
      });
    });
  }

  /**
   * 加载指定语言的翻译数据
   */
  async loadMessages(locale) {
    try {
      // 尝试加载指定语言的翻译
      const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
      if (response.ok) {
        this.messages = await response.json();
        return;
      }
    } catch (error) {
      console.warn(`Failed to load locale ${locale}:`, error);
    }
    
    // 如果加载失败，尝试加载默认语言
    try {
      const defaultResponse = await fetch(chrome.runtime.getURL('_locales/zh_CN/messages.json'));
      this.messages = await defaultResponse.json();
    } catch (error) {
      console.error('Failed to load default locale:', error);
      // 使用空对象避免进一步的错误
      this.messages = {};
    }
  }

  /**
   * 更改当前语言
   */
  async changeLanguage(locale) {
    // 保存新的语言设置
    chrome.storage.sync.set({ language: locale });
    
    // 更新当前语言并重新加载翻译
    this.currentLocale = locale;
    await this.loadMessages(locale);
    
    // 重新翻译页面
    this.translatePage();
  }

  /**
   * 获取翻译文本
   */
  getMessage(key, substitutions = []) {
    const message = this.messages[key];
    if (!message) {
      console.warn(`No translation found for key: ${key}`);
      return key;
    }
    
    let text = message.message;
    
    // 处理占位符替换
    if (substitutions.length > 0 && message.placeholders) {
      Object.keys(message.placeholders).forEach((placeholder, index) => {
        if (index < substitutions.length) {
          const regex = new RegExp('\\$' + placeholder.toUpperCase() + '\\$', 'g');
          text = text.replace(regex, substitutions[index]);
        }
      });
    }
    
    return text;
  }

  /**
   * 翻译整个页面
   */
  translatePage() {
    // 翻译普通文本内容
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.getMessage(key);
    });
    
    // 翻译属性（如placeholder）
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.setAttribute('placeholder', this.getMessage(key));
    });
    
    // 翻译title属性
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.setAttribute('title', this.getMessage(key));
    });
  }
}

// 创建全局国际化实例
const i18n = new I18n();

/**
 * 全局获取翻译的辅助函数
 */
function __(key, ...substitutions) {
  return i18n.getMessage(key, substitutions);
}

// 导出国际化实例
window.i18n = i18n;
window.__ = __; 