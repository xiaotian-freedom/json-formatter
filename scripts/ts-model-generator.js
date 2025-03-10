/**
 * TypeScript模型生成器
 * 将JSON数据转换为TypeScript接口定义
 */
class TypeScriptModelGenerator {
  constructor() {
    // 配置选项
    this.config = {
      rootInterfaceName: 'RootObject',
      indent: '  ', // 两个空格缩进
      optional: false, // 属性是否可选
      useType: false, // 使用type还是interface
      exportKeyword: true, // 添加export关键字
      useReact: false, // 是否包含React类型
      singleLineArray: true, // 简单数组是否单行显示
      usePascalCase: true, // 是否将接口名转为PascalCase
      semicolons: true, // 是否添加分号
      unknownType: 'any', // 未知类型用any还是unknown
    };
    
    // 用于跟踪已经生成的接口，防止重复生成
    this.generatedInterfaces = new Map();
    this.interfaceCounter = 0;
  }
  
  /**
   * 生成TypeScript接口
   * @param {any} data - JSON数据
   * @param {Object} options - 配置选项
   * @returns {string} 生成的TypeScript接口代码
   */
  generate(data, options = {}) {
    // 合并配置
    this.config = { ...this.config, ...options };
    
    // 重置状态
    this.generatedInterfaces = new Map();
    this.interfaceCounter = 0;
    
    // 生成接口
    const rootInterface = this.generateInterface(data, this.config.rootInterfaceName);
    
    // 组装所有生成的接口
    let code = '';
    
    // 添加React导入（如果需要）
    if (this.config.useReact) {
      code += 'import { ReactNode } from \'react\';\n\n';
    }
    
    // 添加所有生成的接口
    for (const [name, interfaceCode] of this.generatedInterfaces.entries()) {
      const exportKeyword = this.config.exportKeyword ? 'export ' : '';
      const typeOrInterface = this.config.useType ? 'type' : 'interface';
      
      code += `${exportKeyword}${typeOrInterface} ${name} ${this.config.useType ? '=' : ''} ${interfaceCode}`;
      
      if (this.config.useType && this.config.semicolons) {
        code += ';';
      }
      
      code += '\n\n';
    }
    
    return code.trim();
  }
  
  /**
   * 生成单个接口
   * @param {any} data - 数据对象
   * @param {string} interfaceName - 接口名称
   * @returns {string} 接口名称
   */
  generateInterface(data, interfaceName) {
    // 如果不是对象，则直接返回类型
    if (typeof data !== 'object' || data === null) {
      return this.getTypeOf(data);
    }
    
    // 如果是数组
    if (Array.isArray(data)) {
      // 检查数组是否为空
      if (data.length === 0) {
        return 'any[]';
      }
      
      // 分析数组元素类型
      const elementTypes = new Set();
      const elementObjects = [];
      
      for (const item of data) {
        if (typeof item === 'object' && item !== null) {
          elementObjects.push(item);
        } else {
          elementTypes.add(this.getTypeOf(item));
        }
      }
      
      // 如果数组包含对象，为这些对象创建接口
      if (elementObjects.length > 0) {
        const elementInterfaceName = `${interfaceName}Item`;
        
        // 合并所有对象属性
        const mergedObject = this.mergeObjects(elementObjects);
        
        // 生成元素接口
        this.generateInterface(mergedObject, elementInterfaceName);
        
        return `${elementInterfaceName}[]`;
      }
      
      // 如果数组包含多种类型，使用联合类型
      if (elementTypes.size > 0) {
        const typeStr = [...elementTypes].join(' | ');
        return `${typeStr}[]`;
      }
      
      return 'any[]';
    }
    
    // 接口名称使用PascalCase
    if (this.config.usePascalCase) {
      interfaceName = this.toPascalCase(interfaceName);
    }
    
    // 如果此接口已经生成过，直接返回
    if (this.generatedInterfaces.has(interfaceName)) {
      return interfaceName;
    }
    
    // 为了防止接口名冲突，确保接口名唯一
    const uniqueInterfaceName = this.ensureUniqueInterfaceName(interfaceName);
    
    // 先将接口添加到生成的接口列表中，防止循环引用
    this.generatedInterfaces.set(uniqueInterfaceName, '');
    
    const properties = [];
    
    // 处理所有属性
    for (const [key, value] of Object.entries(data)) {
      const propertyName = this.formatPropertyName(key);
      const optional = this.config.optional ? '?' : '';
      
      // 如果是对象或数组，需要生成嵌套接口
      let propertyType;
      
      if (typeof value === 'object' && value !== null) {
        const nestedInterfaceName = this.generateNestedInterfaceName(uniqueInterfaceName, key);
        propertyType = this.generateInterface(value, nestedInterfaceName);
      } else {
        propertyType = this.getTypeOf(value);
      }
      
      properties.push(`${propertyName}${optional}: ${propertyType}${this.config.semicolons ? ';' : ''}`);
    }
    
    // 生成接口代码
    const indent = this.config.indent;
    let interfaceCode;
    
    if (properties.length === 0) {
      interfaceCode = `${this.config.useType ? '{' : '{'} }`;
    } else {
      interfaceCode = `{\n${indent}${properties.join(`\n${indent}`)}\n}`;
    }
    
    // 更新已生成的接口
    this.generatedInterfaces.set(uniqueInterfaceName, interfaceCode);
    
    return uniqueInterfaceName;
  }
  
  /**
   * 获取值的TypeScript类型
   */
  getTypeOf(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    const type = typeof value;
    
    switch (type) {
      case 'string':
        return 'string';
      case 'number':
        return Number.isInteger(value) ? 'number' : 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        // 处理日期
        if (value instanceof Date) {
          return 'Date';
        }
        return Array.isArray(value) ? 'any[]' : 'Record<string, any>';
      default:
        return this.config.unknownType;
    }
  }
  
  /**
   * 确保接口名称唯一
   */
  ensureUniqueInterfaceName(name) {
    if (!this.generatedInterfaces.has(name)) {
      return name;
    }
    
    // 如果接口名已存在，添加数字后缀
    let counter = 1;
    let uniqueName = `${name}${counter}`;
    
    while (this.generatedInterfaces.has(uniqueName)) {
      counter++;
      uniqueName = `${name}${counter}`;
    }
    
    return uniqueName;
  }
  
  /**
   * 生成嵌套接口的名称
   */
  generateNestedInterfaceName(parentName, propertyName) {
    return `${parentName}${this.toPascalCase(propertyName)}`;
  }
  
  /**
   * 将字符串转换为PascalCase
   */
  toPascalCase(str) {
    // 处理特殊字符
    const cleanStr = str.replace(/[^\w\s]/g, ' ');
    
    // 转换为PascalCase
    return cleanStr
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }
  
  /**
   * 格式化属性名
   */
  formatPropertyName(name) {
    // 如果属性名包含特殊字符或空格，使用引号包裹
    if (/[^a-zA-Z0-9_$]/.test(name) || /^\d/.test(name)) {
      return `'${name.replace(/'/g, "\\'")}'`;
    }
    return name;
  }
  
  /**
   * 合并多个对象的属性
   */
  mergeObjects(objects) {
    const result = {};
    
    for (const obj of objects) {
      if (typeof obj !== 'object' || obj === null) continue;
      
      for (const [key, value] of Object.entries(obj)) {
        // 如果属性已经存在
        if (key in result) {
          const existingValue = result[key];
          
          // 如果两者类型不同
          if (typeof existingValue !== typeof value) {
            // 使用联合类型，但实际在TS中会直接用any
            result[key] = null; // 使用null标记为需要联合类型
          } 
          // 如果两者都是对象，递归合并
          else if (typeof existingValue === 'object' && typeof value === 'object' && 
                  !Array.isArray(existingValue) && !Array.isArray(value) &&
                  existingValue !== null && value !== null) {
            result[key] = this.mergeObjects([existingValue, value]);
          }
          // 如果两者都是数组，合并数组项
          else if (Array.isArray(existingValue) && Array.isArray(value)) {
            result[key] = [...existingValue, ...value];
          }
        } else {
          // 属性不存在，直接添加
          result[key] = value;
        }
      }
    }
    
    return result;
  }
  
  /**
   * 获取配置选项
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * 更新配置选项
   */
  updateConfig(options) {
    this.config = { ...this.config, ...options };
    return this.config;
  }
}

// 导出生成器
window.tsModelGenerator = new TypeScriptModelGenerator(); 