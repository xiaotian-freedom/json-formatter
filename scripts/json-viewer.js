class JsonViewer {
  constructor(targetElement) {
    this.targetElement = targetElement;
    this.jsonData = null;
    this.clickCallback = null;
    this.showJsonPath = false; // 默认不显示路径
  }

  // 加载并格式化JSON
  load(jsonString) {
    try {
      // 首先去除可能的JSONC注释
      const strippedJson = typeof window.stripJsonComments === 'function'
        ? window.stripJsonComments(jsonString)
        : jsonString;

      // 添加JSON格式转换 - 处理非标准格式
      const normalizedJson = this.normalizeJsonString(strippedJson);

      this.jsonData = JSON.parse(normalizedJson);
      // 保存原始字符串，以便可以显示注释
      this.originalJsonString = jsonString;
      this.render();
      return true;
    } catch (e) {
      this.showError("JSON格式无效: " + e.message);
      return false;
    }
  }

  // 规范化JSON字符串 - 处理非标准格式
  normalizeJsonString(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      return jsonString;
    }

    let normalized = jsonString;

    // 处理JavaScript特有的值，将其转换为JSON兼容格式
    const transformations = [
      // undefined -> "undefined"
      {
        pattern: /\bundefined\b/g,
        replacement: '"undefined"'
      },
      // NaN -> "NaN"
      {
        pattern: /\bNaN\b/g,
        replacement: '"NaN"'
      },
      // Infinity -> "Infinity"
      {
        pattern: /\bInfinity\b/g,
        replacement: '"Infinity"'
      },
      // -Infinity -> "-Infinity"
      {
        pattern: /\b-Infinity\b/g,
        replacement: '"-Infinity"'
      },
      // 简单的函数表达式 -> "function"
      {
        pattern: /function\s*\([^)]*\)\s*\{[^}]*\}/g,
        replacement: '"function"'
      },
      // 箭头函数 -> "function"
      {
        pattern: /\([^)]*\)\s*=>\s*[^,}\]]+/g,
        replacement: '"function"'
      },
      // Symbol -> "Symbol"
      {
        pattern: /Symbol\([^)]*\)/g,
        replacement: '"Symbol"'
      }
    ];

    // 需要在字符串外部进行替换，避免误替换字符串内容
    normalized = this.replaceOutsideStrings(normalized, transformations);

    // 处理无引号的属性名和字符串值
    normalized = this.addMissingQuotes(normalized);

    return normalized;
  }

  // 在字符串外部进行替换 - 避免误替换字符串内的内容
  replaceOutsideStrings(jsonString, transformations) {
    if (!jsonString) return jsonString;

    let result = '';
    let inString = false;
    let escapeNext = false;
    let currentQuote = '';

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];

      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        escapeNext = true;
        continue;
      }

      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        currentQuote = char;
        result += char;
        continue;
      }

      if (inString && char === currentQuote) {
        inString = false;
        currentQuote = '';
        result += char;
        continue;
      }

      if (inString) {
        result += char;
        continue;
      }

      // 在字符串外部，检查是否需要替换
      let replaced = false;
      for (const transformation of transformations) {
        const remaining = jsonString.slice(i);
        const match = remaining.match(transformation.pattern);
        if (match && match.index === 0) {
          result += transformation.replacement;
          i += match[0].length - 1; // -1 因为for循环会自动+1
          replaced = true;
          break;
        }
      }

      if (!replaced) {
        result += char;
      }
    }

    return result;
  }

  // 添加缺失的引号 - 处理无引号的属性名和字符串值
  addMissingQuotes(jsonString) {
    if (!jsonString) return jsonString;

    let result = '';
    let inString = false;
    let escapeNext = false;
    let currentQuote = '';
    let i = 0;

    while (i < jsonString.length) {
      const char = jsonString[i];

      if (escapeNext) {
        result += char;
        escapeNext = false;
        i++;
        continue;
      }

      if (char === '\\') {
        result += char;
        escapeNext = true;
        i++;
        continue;
      }

      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        currentQuote = char;
        result += char;
        i++;
        continue;
      }

      if (inString && char === currentQuote) {
        inString = false;
        currentQuote = '';
        result += char;
        i++;
        continue;
      }

      if (inString) {
        result += char;
        i++;
        continue;
      }

      // 在字符串外部，查找需要加引号的情况

      // 1. 处理属性名（在 { 或 , 后面，: 前面的标识符）
      if (this.isStartOfPropertyName(jsonString, i)) {
        const propertyResult = this.processPropertyName(jsonString, i);
        result += propertyResult.text;
        i = propertyResult.nextIndex;
        continue;
      }

      // 2. 处理属性值（在 : 后面的无引号标识符）
      if (char === ':') {
        result += char;
        i++;

        // 跳过空白
        while (i < jsonString.length && /\s/.test(jsonString[i])) {
          result += jsonString[i];
          i++;
        }

        // 检查是否是无引号的字符串值
        if (i < jsonString.length) {
          const valueResult = this.processPropertyValue(jsonString, i);
          result += valueResult.text;
          i = valueResult.nextIndex;
        }
        continue;
      }

      result += char;
      i++;
    }

    return result;
  }

  // 检查是否是属性名的开始位置
  isStartOfPropertyName(jsonString, index) {
    // 向前查找最近的非空白字符
    let j = index - 1;
    while (j >= 0 && /\s/.test(jsonString[j])) {
      j--;
    }

    if (j < 0) return false;

    const prevChar = jsonString[j];
    return prevChar === '{' || prevChar === ',';
  }

  // 处理属性名
  processPropertyName(jsonString, startIndex) {
    let i = startIndex;
    let identifier = '';

    // 跳过前导空白
    while (i < jsonString.length && /\s/.test(jsonString[i])) {
      i++;
    }

    const leadingWhitespace = jsonString.slice(startIndex, i);

    // 收集标识符字符
    while (i < jsonString.length && /[a-zA-Z_$][a-zA-Z0-9_$]*/.test(jsonString[i])) {
      identifier += jsonString[i];
      i++;
    }

    if (identifier.length === 0) {
      return {
        text: jsonString[startIndex],
        nextIndex: startIndex + 1
      };
    }

    // 检查后面是否跟着冒号
    let j = i;
    while (j < jsonString.length && /\s/.test(jsonString[j])) {
      j++;
    }

    if (j < jsonString.length && jsonString[j] === ':') {
      // 这是一个属性名，需要加引号
      return {
        text: leadingWhitespace + '"' + identifier + '"',
        nextIndex: i
      };
    }

    // 不是属性名，返回原始文本
    return {
      text: jsonString.slice(startIndex, i),
      nextIndex: i
    };
  }

  // 处理属性值
  processPropertyValue(jsonString, startIndex) {
    let i = startIndex;

    // 如果已经是引号开头，直接返回
    if (jsonString[i] === '"' || jsonString[i] === "'") {
      return {
        text: jsonString[i],
        nextIndex: i + 1
      };
    }

    // 如果是数字
    if (/[-+]?\d/.test(jsonString[i])) {
      return this.processNumericValue(jsonString, i);
    }

    // 如果是布尔值或null
    if (jsonString.slice(i).match(/^(true|false|null)\b/)) {
      const match = jsonString.slice(i).match(/^(true|false|null)\b/)[0];
      return {
        text: match,
        nextIndex: i + match.length
      };
    }

    // 如果是对象或数组开始
    if (jsonString[i] === '{' || jsonString[i] === '[') {
      return {
        text: jsonString[i],
        nextIndex: i + 1
      };
    }

    // 处理无引号字符串
    return this.processUnquotedString(jsonString, i);
  }

  // 处理数值
  processNumericValue(jsonString, startIndex) {
    let i = startIndex;
    let value = '';

    // 处理可选的符号
    if (jsonString[i] === '+' || jsonString[i] === '-') {
      value += jsonString[i];
      i++;
    }

    // 处理数字
    while (i < jsonString.length && /[0-9.]/.test(jsonString[i])) {
      value += jsonString[i];
      i++;
    }

    // 处理科学记数法
    if (i < jsonString.length && (jsonString[i] === 'e' || jsonString[i] === 'E')) {
      value += jsonString[i];
      i++;
      if (i < jsonString.length && (jsonString[i] === '+' || jsonString[i] === '-')) {
        value += jsonString[i];
        i++;
      }
      while (i < jsonString.length && /[0-9]/.test(jsonString[i])) {
        value += jsonString[i];
        i++;
      }
    }

    return {
      text: value,
      nextIndex: i
    };
  }

  // 处理无引号字符串
  processUnquotedString(jsonString, startIndex) {
    let i = startIndex;
    let value = '';

    // 收集字符直到遇到分隔符
    while (i < jsonString.length) {
      const char = jsonString[i];

      // 遇到这些字符时停止
      if (char === ',' || char === '}' || char === ']' || char === '\n' || char === '\r') {
        break;
      }

      value += char;
      i++;
    }

    // 去除尾部空白
    value = value.trim();

    if (value.length === 0) {
      return {
        text: jsonString[startIndex],
        nextIndex: startIndex + 1
      };
    }

    // 检查是否确实是字符串（不是已知的非字符串值）
    if (!/^(true|false|null|\d+\.?\d*|[-+]?\d*\.?\d+([eE][-+]?\d+)?)$/.test(value)) {
      // 这是一个字符串，需要加引号
      const leadingSpaces = jsonString.slice(startIndex, startIndex + (jsonString.slice(startIndex).length - jsonString.slice(startIndex).trimStart().length));
      const trailingSpaces = jsonString.slice(startIndex + leadingSpaces.length + value.length, i);

      return {
        text: leadingSpaces + '"' + value + '"' + trailingSpaces,
        nextIndex: i
      };
    }

    // 返回原始值
    return {
      text: jsonString.slice(startIndex, i),
      nextIndex: i
    };
  }

  // 渲染JSON树
  render() {
    this.targetElement.innerHTML = "";
    const tree = this.createTree(this.jsonData, null, true, "$");
    this.targetElement.appendChild(tree);

    // 添加进入动画
    this.addEntranceAnimation(this.targetElement);
  }

  // 创建JSON树结构 - 添加path参数
  createTree(data, key = null, isLast = true, path = "$") {
    const container = document.createElement("div");
    container.className = "json-item";

    if (key !== null) {
      const keyElement = document.createElement("span");
      keyElement.className = "json-key";
      keyElement.textContent = `"${key}": `;
      container.appendChild(keyElement);
    }

    // 根据数据类型创建不同的显示元素
    if (Array.isArray(data)) {
      this.createArrayView(container, data, isLast, path);
    } else if (data !== null && typeof data === "object") {
      this.createObjectView(container, data, isLast, path);
    } else {
      this.createPrimitiveView(container, data, isLast, path);
    }

    return container;
  }

  // 创建对象视图 - 添加路径参数
  createObjectView(container, data, isLast, path) {
    const toggleBtn = document.createElement("span");
    toggleBtn.className = "toggle-btn expanded";
    toggleBtn.textContent = "";
    container.appendChild(toggleBtn);

    const startBrace = document.createElement("span");
    startBrace.className = "json-brace";
    startBrace.textContent = "{";
    container.appendChild(startBrace);

    // 添加JSONPath显示
    if (this.showJsonPath) {
      const pathElement = document.createElement("span");
      pathElement.className = "json-path";
      pathElement.textContent = path;
      pathElement.title = path;
      container.appendChild(pathElement);
    }

    const childContainer = document.createElement("div");
    childContainer.className = "json-children";

    const keys = Object.keys(data);
    keys.forEach((key, index) => {
      const isLastItem = index === keys.length - 1;
      // 构建子节点的路径
      const childPath = `${path}.${key}`;
      const childItem = this.createTree(data[key], key, isLastItem, childPath);
      childContainer.appendChild(childItem);
    });

    container.appendChild(childContainer);

    const endBraceContainer = document.createElement("div");
    endBraceContainer.className = "json-end-brace";
    const endBrace = document.createElement("span");
    endBrace.className = "json-brace";
    endBrace.textContent = "}" + (isLast ? "" : ",");
    endBraceContainer.appendChild(endBrace);
    container.appendChild(endBraceContainer);

    // 添加折叠/展开功能
    this.addToggleFunction(toggleBtn, childContainer, endBraceContainer);

    // 为整个对象添加可点击功能
    this.makeClickable(container, data);
  }

  // 创建数组视图 - 添加路径参数
  createArrayView(container, data, isLast, path) {
    const toggleBtn = document.createElement("span");
    toggleBtn.className = "toggle-btn expanded";
    toggleBtn.textContent = "";
    container.appendChild(toggleBtn);

    const startBracket = document.createElement("span");
    startBracket.className = "json-brace";
    startBracket.textContent = "[";
    container.appendChild(startBracket);

    // 添加JSONPath显示
    if (this.showJsonPath) {
      const pathElement = document.createElement("span");
      pathElement.className = "json-path";
      pathElement.textContent = path;
      pathElement.title = path;
      container.appendChild(pathElement);
    }

    const childContainer = document.createElement("div");
    childContainer.className = "json-children";

    // 遍历数组元素
    data.forEach((item, index) => {
      const isLastItem = index === data.length - 1;
      // 为数组元素创建包装容器
      const itemContainer = document.createElement("div");
      itemContainer.className = "json-item";

      // 添加数组索引作为备注
      const indexElement = document.createElement("span");
      indexElement.className = "json-array-index";
      indexElement.textContent = `[${index}] `;
      itemContainer.appendChild(indexElement);

      // 构建数组项的路径
      const itemPath = `${path}[${index}]`;

      // 根据数组元素类型创建不同的视图
      if (Array.isArray(item)) {
        this.createArrayView(itemContainer, item, isLastItem, itemPath);
      } else if (item !== null && typeof item === "object") {
        this.createObjectView(itemContainer, item, isLastItem, itemPath);
      } else {
        this.createPrimitiveView(itemContainer, item, isLastItem, itemPath);
      }

      childContainer.appendChild(itemContainer);
    });

    container.appendChild(childContainer);

    const endBracketContainer = document.createElement("div");
    endBracketContainer.className = "json-end-brace";
    const endBracket = document.createElement("span");
    endBracket.className = "json-brace";
    endBracket.textContent = "]" + (isLast ? "" : ",");
    endBracketContainer.appendChild(endBracket);
    container.appendChild(endBracketContainer);

    // 添加折叠/展开功能
    this.addToggleFunction(toggleBtn, childContainer, endBracketContainer);

    // 为整个数组添加可点击功能
    this.makeClickable(container, data);
  }

  // 创建基本类型值的视图 - 添加路径参数
  createPrimitiveView(container, data, isLast, path) {
    const valueElement = document.createElement("span");

    if (typeof data === "string") {
      valueElement.className = "json-string";
      valueElement.textContent = `"${data}"${isLast ? "" : ","}`;
    } else if (typeof data === "number") {
      valueElement.className = "json-number";
      valueElement.textContent = `${data}${isLast ? "" : ","}`;
    } else if (typeof data === "boolean") {
      valueElement.className = "json-boolean";
      valueElement.textContent = `${data}${isLast ? "" : ","}`;
    } else if (data === null) {
      valueElement.className = "json-null";
      valueElement.textContent = `null${isLast ? "" : ","}`;
    }

    container.appendChild(valueElement);

    // 添加JSONPath显示
    if (this.showJsonPath) {
      const pathElement = document.createElement("span");
      pathElement.className = "json-path";
      pathElement.textContent = path;
      pathElement.title = path;
      container.appendChild(pathElement);
    }

    // 添加可点击样式和事件
    this.makeClickable(valueElement, data);
  }

  // 添加折叠/展开功能 - 提取为独立方法以复用
  addToggleFunction(toggleBtn, childContainer, endBraceContainer) {
    toggleBtn.addEventListener("click", () => {
      toggleBtn.classList.toggle("expanded");
      toggleBtn.classList.toggle("collapsed");
      childContainer.classList.toggle("hidden");
      endBraceContainer.classList.toggle("collapsed-end");

      // 添加展开/折叠动画
      if (childContainer.classList.contains("hidden")) {
        this.addCollapseAnimation(childContainer);
      } else {
        this.addExpandAnimation(childContainer);
      }
    });
  }

  // 展开全部节点
  expandAll() {
    const toggleButtons = this.targetElement.querySelectorAll(".toggle-btn.collapsed");
    toggleButtons.forEach(btn => btn.click());
  }

  // 折叠全部节点
  collapseAll() {
    const toggleButtons = this.targetElement.querySelectorAll(".toggle-btn.expanded");
    toggleButtons.forEach(btn => btn.click());
  }

  // 显示错误信息
  showError(message) {
    this.targetElement.innerHTML = `<div class="json-error">${message}</div>`;
  }

  // 添加进入动画
  addEntranceAnimation(element) {
    element.classList.add("entrance-animation");
    setTimeout(() => {
      element.classList.remove("entrance-animation");
    }, 500);
  }

  // 添加展开动画
  addExpandAnimation(element) {
    element.classList.add("expand-animation");
    setTimeout(() => {
      element.classList.remove("expand-animation");
    }, 300);
  }

  // 添加折叠动画
  addCollapseAnimation(element) {
    element.classList.add("collapse-animation");
    setTimeout(() => {
      element.classList.remove("collapse-animation");
    }, 300);
  }

  // 设置点击回调函数
  setClickCallback(callback) {
    this.clickCallback = callback;
  }

  // 添加可点击功能的方法
  makeClickable(element, data) {
    // 添加可点击的样式
    element.classList.add('json-clickable');
    element.title = '点击复制到输入框';

    // 添加点击事件
    element.addEventListener('click', (e) => {
      // 阻止事件冒泡，防止触发父元素的折叠/展开
      e.stopPropagation();

      // 如果有回调函数，则调用它并传递数据
      if (this.clickCallback) {
        let valueToFill;
        if (typeof data === 'object' && data !== null) {
          valueToFill = JSON.stringify(data, null, 2);
        } else {
          valueToFill = JSON.stringify(data);
        }
        this.clickCallback(valueToFill);
      }
    });
  }

  // 添加切换路径显示的方法
  toggleJsonPath(show) {
    this.showJsonPath = show;
    if (this.jsonData) {
      this.render(); // 重新渲染以应用更改
    }
  }
}

// 在渲染字符串值时添加图片链接检测
function renderStringValue(value) {
  const stringContainer = document.createElement('span');
  stringContainer.className = 'json-string';
  stringContainer.textContent = `"${value}"`;

  // 这里不需要进行图片检测，因为已经在image-preview.js中处理
  // 只需确保值正确显示

  return stringContainer;
} 