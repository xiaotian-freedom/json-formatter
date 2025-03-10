/**
 * TypeScript 模型对话框管理器
 * 处理TS模型生成界面交互
 */
class TypeScriptModelDialog {
    constructor() {
        // 创建对话框元素
        this.createDialogElement();

        // 获取元素引用
        this.setupElementReferences();

        // 绑定事件
        this.bindEvents();

        // 初始化语法高亮
        this.highlighter = this.createHighlighter();
    }

    /**
     * 创建对话框DOM元素
     */
    createDialogElement() {
        // 创建覆盖层
        this.overlay = document.createElement('div');
        this.overlay.className = 'ts-dialog-overlay';

        // 创建对话框
        this.dialog = document.createElement('div');
        this.dialog.className = 'ts-dialog';

        // 对话框内容
        this.dialog.innerHTML = `
      <div class="ts-dialog-header">
        <h3 class="ts-dialog-title" data-i18n="tsModelTitle">生成TypeScript模型</h3>
        <button class="ts-dialog-close" id="closeDialogBtn">&times;</button>
      </div>
      
      <div class="ts-dialog-body">
        <div class="ts-settings-panel">
          <div class="ts-setting-group">
            <div class="ts-setting-item">
              <input type="text" id="rootInterfaceName" value="RootObject" class="ts-setting-input">
              <label for="rootInterfaceName" data-i18n="rootInterfaceName">根接口名称</label>
            </div>
          </div>
          
          <div class="ts-setting-group">
            <div class="ts-setting-item">
              <input type="checkbox" id="exportKeyword" checked>
              <label for="exportKeyword" data-i18n="exportKeyword">添加export关键字</label>
            </div>
            <div class="ts-setting-item">
              <input type="checkbox" id="useType">
              <label for="useType" data-i18n="useType">使用type代替interface</label>
            </div>
          </div>
          
          <div class="ts-setting-group">
            <div class="ts-setting-item">
              <input type="checkbox" id="optionalProps">
              <label for="optionalProps" data-i18n="optionalProps">可选属性</label>
            </div>
            <div class="ts-setting-item">
              <input type="checkbox" id="semicolons" checked>
              <label for="semicolons" data-i18n="semicolons">使用分号</label>
            </div>
          </div>
          
          <div class="ts-setting-group">
            <div class="ts-setting-item">
              <input type="checkbox" id="usePascalCase" checked>
              <label for="usePascalCase" data-i18n="usePascalCase">PascalCase接口名</label>
            </div>
            <div class="ts-setting-item">
              <select id="unknownType" class="ts-setting-input">
                <option value="any">any</option>
                <option value="unknown">unknown</option>
              </select>
              <label for="unknownType" data-i18n="unknownType">未知类型</label>
            </div>
          </div>
        </div>
        
        <div class="ts-content-area">
          <div class="ts-code-container">
            <div class="ts-code-editor">
              <pre id="tsCodeOutput" class="ts-code"></pre>
            </div>
          </div>
        </div>
      </div>
      
      <div class="ts-dialog-footer">
        <div class="ts-dialog-actions">
          <button id="copyTsCodeBtn" class="glass-btn" data-i18n="copyTsCode">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            复制代码
          </button>
          <button id="regenerateBtn" class="glass-btn" data-i18n="regenerate">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            重新生成
          </button>
          <button id="closeDialogBtnBottom" class="glass-btn" data-i18n="close">
            关闭
          </button>
        </div>
      </div>
    `;

        // 添加对话框到覆盖层
        this.overlay.appendChild(this.dialog);
    }

    /**
     * 获取对话框中的元素引用
     */
    setupElementReferences() {
        // 获取按钮和输入元素引用
        this.closeDialogBtn = this.dialog.querySelector('#closeDialogBtn');
        this.closeDialogBtnBottom = this.dialog.querySelector('#closeDialogBtnBottom');
        this.copyTsCodeBtn = this.dialog.querySelector('#copyTsCodeBtn');
        this.regenerateBtn = this.dialog.querySelector('#regenerateBtn');

        // 获取设置输入元素
        this.rootInterfaceNameInput = this.dialog.querySelector('#rootInterfaceName');
        this.exportKeywordInput = this.dialog.querySelector('#exportKeyword');
        this.useTypeInput = this.dialog.querySelector('#useType');
        this.optionalPropsInput = this.dialog.querySelector('#optionalProps');
        this.semicolonsInput = this.dialog.querySelector('#semicolons');
        this.usePascalCaseInput = this.dialog.querySelector('#usePascalCase');
        this.unknownTypeInput = this.dialog.querySelector('#unknownType');

        // 代码输出区域
        this.codeOutput = this.dialog.querySelector('#tsCodeOutput');
    }

    /**
     * 绑定事件处理程序
     */
    bindEvents() {
        // 获取元素引用
        const closeBtn = this.dialog.querySelector('#closeDialogBtn');
        const closeBtnBottom = this.dialog.querySelector('#closeDialogBtnBottom');
        const copyCodeBtn = this.dialog.querySelector('#copyTsCodeBtn');
        const regenerateBtn = this.dialog.querySelector('#regenerateBtn');

        // 关闭按钮事件
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        if (closeBtnBottom) {
            closeBtnBottom.addEventListener('click', () => this.hide());
        }

        // 复制代码按钮事件
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => this.copyToClipboard());
        }

        // 重新生成按钮事件
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerate());
        }

        // 设置选项变更事件
        const settingInputs = this.dialog.querySelectorAll('input[type="checkbox"], input[type="text"], select');
        settingInputs.forEach(input => {
            input.addEventListener('change', () => this.regenerate());
        });

        // 点击背景关闭对话框
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }

    /**
     * 显示TS模型对话框 - 确保水波纹在每次显示时都初始化
     */
    show(jsonData) {
        // 保存当前JSON数据
        this.jsonData = jsonData;

        // 应用当前主题
        this.applyTheme();

        // 翻译界面元素
        this.translateDialogElements();

        // 添加到文档（移到前面确保DOM存在）
        if (!document.body.contains(this.overlay)) {
            document.body.appendChild(this.overlay);
        }

        // 显示对话框
        this.overlay.classList.add('active');

        // 生成TS模型
        this.generateTsModel();

        // 确保对话框在视口中居中
        this.centerDialog();

        // 使用直接方式添加水波纹效果
        this.addRippleEffects();
    }

    /**
     * 添加水波纹效果
     */
    addRippleEffects() {
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
    }

    /**
     * 翻译对话框中的元素
     */
    translateDialogElements() {
        // 获取所有需要翻译的元素
        const elementsToTranslate = this.dialog.querySelectorAll('[data-i18n]');

        // 手动翻译每个元素
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getMessage(key);
            if (translation) {
                element.textContent = translation;
            }
        });

        // 翻译占位符
        const placeholderElements = this.dialog.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.getMessage(key);
            if (translation) {
                element.setAttribute('placeholder', translation);
            }
        });
    }

    /**
     * 获取翻译消息
     * 安全地访问i18n API
     */
    getMessage(key, ...args) {
        if (window.i18n && typeof window.i18n.getMessage === 'function') {
            return window.i18n.getMessage(key, args);
        }

        // 如果没有i18n对象或getMessage方法，尝试使用chrome.i18n
        if (chrome && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
            return chrome.i18n.getMessage(key, args);
        }

        // 最后的回退机制 - 返回键名
        return key;
    }

    /**
     * 隐藏TS模型对话框
     */
    hide() {
        this.overlay.classList.remove('active');
    }

    /**
     * 确保对话框在视口中居中
     */
    centerDialog() {
        // 如果对话框已添加到文档，确保其居中
        if (document.body.contains(this.overlay)) {
            const windowHeight = window.innerHeight;
            const dialogHeight = this.dialog.offsetHeight;

            if (dialogHeight > windowHeight - 40) {
                // 如果对话框高度接近窗口高度，只留一小部分边距
                this.dialog.style.height = (windowHeight - 40) + 'px';
            } else {
                // 否则让它自然高度
                this.dialog.style.height = '';
            }
        }
    }

    /**
     * 生成TypeScript模型
     */
    generateTsModel() {
        // 获取当前配置
        const config = {
            rootInterfaceName: this.rootInterfaceNameInput.value,
            optional: this.optionalPropsInput.checked,
            useType: this.useTypeInput.checked,
            exportKeyword: this.exportKeywordInput.checked,
            usePascalCase: this.usePascalCaseInput.checked,
            semicolons: this.semicolonsInput.checked,
            unknownType: this.unknownTypeInput.value
        };

        try {
            // 使用TS模型生成器生成代码
            const code = window.tsModelGenerator.generate(this.jsonData, config);

            // 显示生成的代码（包含语法高亮）
            this.setCodeWithHighlight(code);
        } catch (error) {
            console.error('生成TS模型失败:', error);
            // 显示错误信息
            this.codeOutput.textContent = `// 生成失败: ${error.message}`;
        }
    }

    /**
     * 设置带有语法高亮的代码
     */
    setCodeWithHighlight(code) {
        // 检查代码输出元素是否存在
        if (!this.codeOutput) return;

        // 分割代码行
        const lines = code.split('\n');

        // 清空内容
        this.codeOutput.innerHTML = '';

        // 添加每一行并应用高亮，不添加行号
        lines.forEach((line) => {
            const lineElement = document.createElement('div');
            lineElement.className = 'ts-code-line';
            // 保留空行，确保格式正确
            lineElement.innerHTML = line.trim() ? this.highlighter(line) : '&nbsp;';
            this.codeOutput.appendChild(lineElement);
        });

        // 保存原始格式化代码作为数据属性，作为备份
        this.codeOutput.setAttribute('data-original-code', code);
    }

    /**
     * 创建语法高亮函数
     */
    createHighlighter() {
        // 基本的TypeScript语法规则
        const patterns = [
            // 关键字
            { pattern: /\b(interface|type|export|extends|implements|readonly|import|from)\b/g, className: 'ts-keyword' },
            // 接口名称
            { pattern: /\b([A-Z][a-zA-Z0-9]*)\b(?=\s*(\{|\=))/g, className: 'ts-interface' },
            // 属性名称
            { pattern: /([a-zA-Z0-9_']+)(?=\s*\??:)/g, className: 'ts-property' },
            // 类型
            { pattern: /:\s*([A-Z][a-zA-Z0-9]*|\b(string|number|boolean|any|null|undefined|unknown|void|never|object|symbol|bigint|Record|Date|ReactNode)\b)(\[\])?/g, className: 'ts-type' },
            // 字符串
            { pattern: /'([^']*)'/g, className: 'ts-string' },
            // 注释
            { pattern: /(\/\/.*|\/\*[\s\S]*?\*\/)/g, className: 'ts-comment' }
        ];

        // 返回高亮函数
        return (code) => {
            let highlightedCode = code;

            for (const { pattern, className } of patterns) {
                highlightedCode = highlightedCode.replace(pattern, (match) => {
                    return `<span class="${className}">${match}</span>`;
                });
            }

            return highlightedCode;
        };
    }

    /**
     * 获取纯文本代码
     * 修复复制时丢失换行格式问题
     */
    getPlainCode() {
        // 不直接使用textContent，而是收集所有代码行并添加换行符
        if (!this.codeOutput) return '';

        // 获取所有代码行
        const codeLines = this.codeOutput.querySelectorAll('.ts-code-line');

        // 如果没有使用行元素，则回退到原始方式
        if (!codeLines.length) {
            return this.codeOutput.textContent || '';
        }

        // 逐行收集文本并添加换行符
        const codeText = Array.from(codeLines)
            .map(line => line.textContent || '')
            .join('\n');

        return codeText;
    }

    /**
     * 复制生成的代码到剪贴板
     */
    copyToClipboard() {
        // 获取格式化的纯文本内容
        const code = this.getPlainCode();

        if (!code) return;

        try {
            // 使用现代clipboard API
            navigator.clipboard.writeText(code)
                .then(() => {
                    // 使用全局通知函数
                    showNotification(this.getMessage('tsCodeCopied') || '代码已复制到剪贴板', 'success');
                })
                .catch(err => {
                    console.error('复制失败:', err);
                    // 如果现代API失败，尝试备用方法
                    this.fallbackCopy(code);
                });
        } catch (e) {
            // 浏览器可能不支持clipboard API，使用备用方法
            this.fallbackCopy(code);
        }
    }

    /**
     * 备用复制方法
     * 使用传统的textarea复制方式
     */
    fallbackCopy(text) {
        // 创建临时textarea
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';  // 避免滚动到底部
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);

        try {
            // 选择文本并复制
            textarea.select();
            textarea.setSelectionRange(0, 99999);  // 对于移动设备

            const successful = document.execCommand('copy');
            if (successful) {
                // 使用全局通知函数
                showNotification(this.getMessage('tsCodeCopied') || '代码已复制到剪贴板', 'success');
            } else {
                showNotification(this.getMessage('tsCopyFailed') || '复制失败', 'error');
            }
        } catch (err) {
            console.error('备用复制方法失败:', err);
            showNotification(this.getMessage('tsCopyFailed') || '复制失败', 'error');
        } finally {
            // 清理
            document.body.removeChild(textarea);
        }
    }

    /**
     * 重新生成TS模型
     */
    regenerate() {
        this.generateTsModel();
    }

    /**
     * 应用当前主题到对话框
     */
    applyTheme() {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        if (isDarkTheme) {
            this.dialog.classList.add('dark-theme');
        } else {
            this.dialog.classList.remove('dark-theme');
        }
    }
}

// 在页面加载后初始化TS模型对话框
document.addEventListener('DOMContentLoaded', () => {
    // 加载CSS
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = chrome.runtime.getURL('styles/ts-model-dialog.css');
    document.head.appendChild(linkElement);

    // 初始化TS模型对话框
    window.tsModelDialog = new TypeScriptModelDialog();
}); 