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
        // 创建模态框覆盖层
        this.overlay = document.createElement('div');
        this.overlay.className = 'common-model-overlay';

        // 创建对话框容器
        this.dialog = document.createElement('div');
        this.dialog.className = 'common-model-dialog';

        // 添加对话框内容
        this.dialog.innerHTML = `
            <div class="common-dialog-header">  
                <h2 data-i18n="tsModelGenerator">TypeScript 模型生成器</h2>
                <button id="closeDialogBtn" class="common-close-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <div class="common-dialog-body">
                <div class="common-settings-panel">
                    <div class="common-setting-group">
                        <div class="common-setting-item">
                            <input type="text" id="rootInterfaceName" value="RootObject" class="common-setting-input">
                            <label for="rootInterfaceName" data-i18n="rootInterfaceName">根接口名称</label>
                        </div>
                        <div class="common-setting-item">
                            <select id="unknownType" class="common-setting-select">
                                <option value="any">any</option>
                                <option value="unknown">unknown</option>
                            </select>
                            <label for="unknownType" data-i18n="unknownType">未知类型</label>
                        </div>
                    </div>
                    
                    <div class="common-setting-group">
                        <div class="common-setting-item" style="margin-top: 5px;">
                            <input type="checkbox" id="exportKeyword" checked>
                            <label for="exportKeyword" data-i18n="exportKeyword">添加export关键字</label>
                        </div>
                        <div class="common-setting-item" style="margin-bottom: 5px;">
                            <input type="checkbox" id="useType">
                            <label for="useType" data-i18n="useType">使用type代替interface</label>
                        </div>
                    </div>
                    
                    <div class="common-setting-group">
                        <div class="common-setting-item" style="margin-top: 5px;">
                            <input type="checkbox" id="optionalProps">
                            <label for="optionalProps" data-i18n="optionalProps">可选属性</label>
                        </div>
                        <div class="common-setting-item" style="margin-bottom: 5px;">
                            <input type="checkbox" id="semicolons" checked>
                            <label for="semicolons" data-i18n="semicolons">使用分号</label>
                        </div>
                    </div>
                    
                    <div class="common-setting-group">
                        <div class="common-setting-item" style="margin-top: 5px;">
                            <input type="checkbox" id="usePascalCase" checked>
                            <label for="usePascalCase" data-i18n="usePascalCase">PascalCase接口名</label>
                        </div>
                    </div>
                </div>
                
                <div class="common-content-area">
                    <div class="common-code-container">
                        <div class="common-code-editor">
                            <pre id="tsCodeOutput" class="common-code"></pre>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="common-dialog-footer">
                <div class="common-dialog-actions">
                    <button id="copyTsCodeBtn" class="glass-btn" data-i18n="copyTsCode">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span data-i18n="copyTsCode">复制代码</span>
                    </button>
                    <button id="regenerateBtn" class="glass-btn" data-i18n="regenerate">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                        </svg>
                        <span data-i18n="regenerate">重新生成</span>
                    </button>
                    <button id="closeDialogBtnBottom" class="glass-btn" data-i18n="close">
                        <span data-i18n="close">关闭</span>
                    </button>
                </div>
            </div>
        `;

        // 将对话框添加到覆盖层
        this.overlay.appendChild(this.dialog);

        // 添加窗口大小变化监听器
        this.addResizeListener();
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
     * 使用事件委托模式减少事件监听器数量
     */
    bindEvents() {
        // 使用事件委托来处理所有按钮点击
        this.dialog.addEventListener('click', (e) => {
            console.log('点击事件触发', e.target.id, e.target.tagName);

            // 关闭按钮 - 检查是否点击的是按钮本身或其子元素
            if (e.target.id === 'closeDialogBtn' || e.target.closest('#closeDialogBtn')) {
                console.log('触发关闭按钮');
                this.hide();
                return;
            }

            // 关闭底部按钮
            if (e.target.id === 'closeDialogBtnBottom' || e.target.closest('#closeDialogBtnBottom')) {
                this.hide();
                return;
            }

            // 复制代码按钮
            if (e.target.id === 'copyTsCodeBtn' || e.target.closest('#copyTsCodeBtn')) {
                this.copyToClipboard();
                return;
            }

            // 重新生成按钮
            if (e.target.id === 'regenerateBtn' || e.target.closest('#regenerateBtn')) {
                this.regenerate();
                return;
            }
        });

        // 监听设置变更事件
        const settingsPanel = this.dialog.querySelector('.common-settings-panel');
        if (settingsPanel) {
            settingsPanel.addEventListener('change', (e) => {
                // 只有当变更来自输入元素时才重新生成
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                    this.regenerate();
                }
            });

            // 监听文本输入事件（仅适用于根接口名称）
            this.rootInterfaceNameInput.addEventListener('input', () => {
                this.regenerate();
            });
        }

        // 点击背景关闭对话框
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }

    /**
     * 显示TS模型对话框
     * @param {Object} jsonData - 要转换的JSON数据
     */
    show(jsonData) {
        // 只有当提供了新数据时才更新
        if (jsonData) {
            this.jsonData = jsonData;
        }

        // 验证JSON数据
        if (!this.jsonData) {
            console.error('没有可用的JSON数据');
            alert(this.getMessage('noValidJson') || '没有提供有效的JSON数据，无法生成模型');
            return;
        }

        // 应用当前主题
        this.applyTheme();

        // 翻译对话框元素
        this.translateDialogElements();

        // 添加到文档（如果尚未添加）
        if (!document.body.contains(this.overlay)) {
            document.body.appendChild(this.overlay);
        }

        // 显示对话框
        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
            // 调整对话框大小以适应当前窗口
            this.adjustDialogSize();
        });

        // 恢复之前的设置
        this.restoreSettings();

        // 生成TS模型
        setTimeout(() => {
            this.generateTsModel();
        }, 50);
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
     * 隐藏TS模型对话框
     */
    hide() {
        console.log('隐藏TS模型对话框，应用关闭动画');

        // 保存当前设置
        this.saveSettings();

        // 添加关闭动画类
        this.overlay.classList.add('closing');
        this.overlay.classList.remove('active');

        // 等待动画完成后再处理其他逻辑
        setTimeout(() => {
            this.overlay.classList.remove('closing');
            // 不要从DOM中移除元素，只是隐藏它
        }, 300);
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
        if (!this.jsonData) {
            this.codeOutput.textContent = this.getMessage('errorNoJsonData') || '// 错误：没有提供JSON数据';
            return;
        }

        // 验证JSON数据不为空对象或空数组
        const isEmpty =
            (Array.isArray(this.jsonData) && this.jsonData.length === 0) ||
            (typeof this.jsonData === 'object' &&
                this.jsonData !== null &&
                Object.keys(this.jsonData).length === 0);

        if (isEmpty) {
            this.codeOutput.textContent = this.getMessage('errorEmptyJson') || '// 错误：JSON数据为空对象或空数组';
            return;
        }

        // 获取当前配置
        const config = {
            rootInterfaceName: this.rootInterfaceNameInput.value || 'RootObject',
            optional: this.optionalPropsInput.checked,
            useType: this.useTypeInput.checked,
            exportKeyword: this.exportKeywordInput.checked,
            usePascalCase: this.usePascalCaseInput.checked,
            semicolons: this.semicolonsInput.checked,
            unknownType: this.unknownTypeInput.value || 'any',
            optimizeInterfaces: true // 启用接口优化
        };

        try {
            // 使用TS模型生成器生成代码
            if (!window.tsModelGenerator) {
                throw new Error('TS模型生成器未初始化');
            }

            const code = window.tsModelGenerator.generate(this.jsonData, config);

            if (!code || code.length === 0) {
                throw new Error('生成的代码为空');
            }

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
            lineElement.className = 'common-code-line';
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
            { pattern: /\b(interface|type|export|extends|implements|readonly|import|from)\b/g, className: 'common-keyword' },
            // 接口名称
            { pattern: /\b([A-Z][a-zA-Z0-9]*)\b(?=\s*(\{|\=))/g, className: 'common-interface' },
            // 属性名称
            { pattern: /([a-zA-Z0-9_']+)(?=\s*\??:)/g, className: 'common-property' },
            // 类型
            { pattern: /:\s*([A-Z][a-zA-Z0-9]*|\b(string|number|boolean|any|null|undefined|unknown|void|never|object|symbol|bigint|Record|Date|ReactNode)\b)(\[\])?/g, className: 'common-type' },
            // 字符串
            { pattern: /'([^']*)'/g, className: 'common-string' },
            // 注释
            { pattern: /(\/\/.*|\/\*[\s\S]*?\*\/)/g, className: 'common-comment' }
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
        const codeLines = this.codeOutput.querySelectorAll('.common-code-line');

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
        // 保存当前的滚动位置
        const codeEditor = this.dialog.querySelector('.common-code-editor');
        const scrollTop = codeEditor ? codeEditor.scrollTop : 0;

        // 创建并触发Siri风格动画
        this.playSiriAnimation();

        // 生成TS模型
        this.generateTsModel();

        // 恢复滚动位置
        setTimeout(() => {
            if (codeEditor) {
                codeEditor.scrollTop = scrollTop;
            }
        }, 50);
    }

    /**
     * 播放Siri风格的动画效果
     */
    playSiriAnimation() {
        const codeContainer = this.dialog.querySelector('.common-code-container');
        if (!codeContainer) return;

        // 检查是否已有动画元素
        let siriEffect = codeContainer.querySelector('.common-siri-effect');

        // 如果没有，创建动画元素
        if (!siriEffect) {
            siriEffect = document.createElement('div');
            siriEffect.className = 'common-siri-effect';

            const siriWave = document.createElement('div');
            siriWave.className = 'common-siri-wave';

            siriEffect.appendChild(siriWave);
            codeContainer.appendChild(siriEffect);
        }

        // 移除旧的动画元素
        const oldWave = siriEffect.querySelector('.common-siri-wave');
        if (oldWave) {
            oldWave.remove();
        }

        // 创建新的波浪元素
        const newWave = document.createElement('div');
        newWave.className = 'common-siri-wave';
        siriEffect.appendChild(newWave);

        // 激活动画
        codeContainer.classList.add('common-siri-active');

        // 动画结束后移除类
        setTimeout(() => {
            codeContainer.classList.remove('common-siri-active');
        }, 2000);
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

    /**
     * 保存当前设置到localStorage
     */
    saveSettings() {
        const settings = {
            rootInterfaceName: this.rootInterfaceNameInput.value,
            exportKeyword: this.exportKeywordInput.checked,
            useType: this.useTypeInput.checked,
            optionalProps: this.optionalPropsInput.checked,
            semicolons: this.semicolonsInput.checked,
            usePascalCase: this.usePascalCaseInput.checked,
            unknownType: this.unknownTypeInput.value
        };

        try {
            localStorage.setItem('common-model-settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('无法保存TS模型设置', e);
        }
    }

    /**
     * 从localStorage恢复设置
     */
    restoreSettings() {
        try {
            const savedSettings = localStorage.getItem('common-model-settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);

                // 恢复设置值
                if (settings.rootInterfaceName) this.rootInterfaceNameInput.value = settings.rootInterfaceName;
                if (settings.exportKeyword !== undefined) this.exportKeywordInput.checked = settings.exportKeyword;
                if (settings.useType !== undefined) this.useTypeInput.checked = settings.useType;
                if (settings.optionalProps !== undefined) this.optionalPropsInput.checked = settings.optionalProps;
                if (settings.semicolons !== undefined) this.semicolonsInput.checked = settings.semicolons;
                if (settings.usePascalCase !== undefined) this.usePascalCaseInput.checked = settings.usePascalCase;
                if (settings.unknownType) this.unknownTypeInput.value = settings.unknownType;
            }
        } catch (e) {
            console.warn('无法恢复TS模型设置', e);
        }
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
     * 添加窗口大小变化监听器
     */
    addResizeListener() {
        // 创建一个节流函数，避免频繁触发
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.adjustDialogSize();
            }, 100);
        });
    }

    /**
     * 调整对话框大小以适应窗口
     */
    adjustDialogSize() {
        if (!document.body.contains(this.overlay)) return;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // 根据窗口大小设置对话框尺寸
        if (windowWidth > 1600) {
            // 大屏幕，使用更大的尺寸
            this.dialog.style.width = '80%';
            this.dialog.style.maxWidth = '1400px';
            this.dialog.style.height = `${windowHeight * 0.9}px`;
        } else if (windowWidth > 1200) {
            // 中等屏幕
            this.dialog.style.width = '85%';
            this.dialog.style.maxWidth = '1200px';
            this.dialog.style.height = `${windowHeight * 0.85}px`;
        } else {
            // 小屏幕，使用更紧凑的布局
            this.dialog.style.width = '90%';
            this.dialog.style.maxWidth = '900px';
            this.dialog.style.height = `${windowHeight * 0.8}px`;
        }

        // 确保对话框不会超出屏幕边界
        const maxHeight = windowHeight - 40; // 留出一些边距
        if (this.dialog.offsetHeight > maxHeight) {
            this.dialog.style.height = `${maxHeight}px`;
        }
    }
}

// 在页面加载后初始化TS模型对话框
document.addEventListener('DOMContentLoaded', () => {
    // 加载CSS
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = chrome.runtime.getURL('styles/common-model-dialog.css');
    document.head.appendChild(linkElement);

    // 初始化TS模型对话框
    window.tsModelDialog = new TypeScriptModelDialog();
}); 