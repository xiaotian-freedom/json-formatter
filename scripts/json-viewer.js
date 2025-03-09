class JsonViewer {
  constructor(targetElement) {
    this.targetElement = targetElement;
    this.jsonData = null;
  }
  
  // 加载并格式化JSON
  load(jsonString) {
    try {
      this.jsonData = JSON.parse(jsonString);
      console.log(this.jsonData);
      this.render();
      return true;
    } catch (e) {
      this.showError("JSON格式无效: " + e.message);
      return false;
    }
  }
  
  // 渲染JSON树
  render() {
    this.targetElement.innerHTML = "";
    const tree = this.createTree(this.jsonData);
    this.targetElement.appendChild(tree);
    
    // 添加进入动画
    this.addEntranceAnimation(this.targetElement);
  }
  
  // 创建JSON树结构
  createTree(data, key = null, isLast = true) {
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
      this.createArrayView(container, data, isLast);
    } else if (data !== null && typeof data === "object") {
      this.createObjectView(container, data, isLast);
    } else {
      this.createPrimitiveView(container, data, isLast);
    }
    
    return container;
  }
  
  // 创建对象视图
  createObjectView(container, data, isLast) {
    const toggleBtn = document.createElement("span");
    toggleBtn.className = "toggle-btn expanded";
    toggleBtn.textContent = "";
    container.appendChild(toggleBtn);
    
    const startBrace = document.createElement("span");
    startBrace.className = "json-brace";
    startBrace.textContent = "{";
    container.appendChild(startBrace);
    
    const childContainer = document.createElement("div");
    childContainer.className = "json-children";
    
    const keys = Object.keys(data);
    keys.forEach((key, index) => {
      const isLastItem = index === keys.length - 1;
      const childItem = this.createTree(data[key], key, isLastItem);
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
  }
  
  // 创建数组视图
  createArrayView(container, data, isLast) {
    const toggleBtn = document.createElement("span");
    toggleBtn.className = "toggle-btn expanded";
    toggleBtn.textContent = "";
    container.appendChild(toggleBtn);
    
    const startBracket = document.createElement("span");
    startBracket.className = "json-brace";
    startBracket.textContent = "[";
    container.appendChild(startBracket);
    
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
      
      // 根据数组元素类型创建不同的视图
      if (Array.isArray(item)) {
        this.createArrayView(itemContainer, item, isLastItem);
      } else if (item !== null && typeof item === "object") {
        this.createObjectView(itemContainer, item, isLastItem);
      } else {
        this.createPrimitiveView(itemContainer, item, isLastItem);
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
  }
  
  // 创建基本类型值的视图
  createPrimitiveView(container, data, isLast) {
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