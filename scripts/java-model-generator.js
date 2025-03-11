/**
 * Java模型生成器
 * 将JSON数据转换为Java类定义
 */
class JavaModelGenerator {
    /**
     * 构造函数
     */
    constructor() {
        // 默认配置
        this.config = {
            useGettersSetters: true,
            useLombok: false,
            useJacksonAnnotations: false,
            generateBuilders: false,
            packageName: ''
        };
    }

    /**
     * 生成Java模型代码
     * @param {Object|Array} jsonData - 要转换的JSON数据
     * @param {Object} options - 生成选项，包含rootClassName
     * @returns {string} 生成的Java代码
     */
    generate(jsonData, options = {}) {
        // 合并选项
        this.config = { ...this.config, ...options };
        const rootClassName = options.rootClassName || 'RootObject';

        // 处理数据
        if (Array.isArray(jsonData) && jsonData.length > 0) {
            // 如果是数组，使用第一个元素作为样本
            jsonData = jsonData[0];
        }

        // 生成代码
        let result = '';

        // 添加包声明
        if (this.config.packageName) {
            result += `package ${this.config.packageName};\n\n`;
        }

        // 添加导入语句
        if (this.config.useLombok) {
            result += 'import lombok.Data;\n';
            if (this.config.generateBuilders) {
                result += 'import lombok.Builder;\n';
            }
            result += '\n';
        }

        if (this.config.useJacksonAnnotations) {
            result += 'import com.fasterxml.jackson.annotation.JsonProperty;\n\n';
        }

        // 生成类定义
        result += this.generateClass(jsonData, rootClassName);

        return result;
    }

    /**
     * 生成Java类定义
     * @param {Object} obj - 对象数据
     * @param {string} className - 类名
     * @returns {string} 生成的Java类代码
     */
    generateClass(obj, className) {
        let classCode = '';
        let fields = [];
        let innerClasses = [];

        // 添加类注解
        if (this.config.useLombok) {
            classCode += '@Data\n';
            if (this.config.generateBuilders) {
                classCode += '@Builder\n';
            }
        }

        // 添加类定义
        classCode += `public class ${className} {\n`;

        // 处理字段
        for (const [key, value] of Object.entries(obj)) {
            // 格式化字段名
            const fieldName = this.formatFieldName(key);

            // 确定字段类型
            let fieldType = this.getJavaType(value, this.formatClassName(key));

            // 处理内部类
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const innerClassName = this.formatClassName(key);
                innerClasses.push(this.generateClass(value, innerClassName));
            }
            else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const innerClassName = this.formatClassName(this.singularize(key));
                innerClasses.push(this.generateClass(value[0], innerClassName));
            }

            // 添加Jackson注解
            let fieldCode = '';
            if (this.config.useJacksonAnnotations) {
                fieldCode += `    @JsonProperty("${key}")\n`;
            }

            // 添加字段定义
            fieldCode += `    private ${fieldType} ${fieldName};\n`;
            fields.push(fieldCode);
        }

        // 添加所有字段
        classCode += fields.join('\n');

        // 添加Getter和Setter方法(如果没有使用Lombok)
        if (this.config.useGettersSetters && !this.config.useLombok) {
            classCode += this.generateAccessors(obj);
        }

        // 关闭类定义
        classCode += '}\n\n';

        // 添加内部类
        classCode += innerClasses.join('\n');

        return classCode;
    }

    /**
     * 生成getter和setter方法
     * @param {Object} obj - 对象数据 
     * @returns {string} getter和setter代码
     */
    generateAccessors(obj) {
        let accessors = '\n';

        for (const [key, value] of Object.entries(obj)) {
            const fieldName = this.formatFieldName(key);
            const fieldType = this.getJavaType(value, this.formatClassName(key));
            const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

            // 生成getter
            accessors += `    public ${fieldType} get${capitalized}() {\n`;
            accessors += `        return ${fieldName};\n`;
            accessors += `    }\n\n`;

            // 生成setter
            accessors += `    public void set${capitalized}(${fieldType} ${fieldName}) {\n`;
            accessors += `        this.${fieldName} = ${fieldName};\n`;
            accessors += `    }\n\n`;
        }

        return accessors;
    }

    /**
     * 确定字段的Java类型
     * @param {*} value - 字段值
     * @param {string} className - 类名(用于对象类型)
     * @returns {string} Java类型名称
     */
    getJavaType(value, className) {
        if (value === null) {
            return 'Object';
        }

        switch (typeof value) {
            case 'string':
                return 'String';
            case 'number':
                // 判断是否为整数
                return Number.isInteger(value) ? 'int' : 'double';
            case 'boolean':
                return 'boolean';
            case 'object':
                if (Array.isArray(value)) {
                    // 确定列表类型
                    if (value.length === 0) {
                        return 'List<Object>';
                    }

                    const listType = typeof value[0] === 'object' && value[0] !== null
                        ? this.formatClassName(this.singularize(className))
                        : this.getJavaType(value[0], '');

                    return `List<${listType}>`;
                }
                return className;
            default:
                return 'Object';
        }
    }

    /**
     * 格式化字段名称为驼峰命名法
     * @param {string} name - 原始名称
     * @returns {string} 格式化后的名称
     */
    formatFieldName(name) {
        // 处理特殊字符和保留字
        name = name.replace(/[^\w]/g, '_');

        // 转换为驼峰命名法
        return name.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
            .replace(/^([A-Z])/, (match, letter) => letter.toLowerCase());
    }

    /**
     * 格式化类名为Pascal命名法
     * @param {string} name - 原始名称
     * @returns {string} 格式化后的类名
     */
    formatClassName(name) {
        // 处理特殊字符
        name = name.replace(/[^\w]/g, '_');

        // 转换为Pascal命名法
        return name.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
            .replace(/^([a-z])/, (match, letter) => letter.toUpperCase());
    }

    /**
     * 将复数形式转换为单数形式
     * @param {string} name - 复数形式
     * @returns {string} 单数形式
     */
    singularize(name) {
        // 简单的英语复数规则处理
        if (name.endsWith('ies')) {
            return name.slice(0, -3) + 'y';
        } else if (name.endsWith('es') && !name.endsWith('sses')) {
            return name.slice(0, -2);
        } else if (name.endsWith('s') && !name.endsWith('ss')) {
            return name.slice(0, -1);
        }
        return name;
    }

    /**
     * 获取配置
     * @returns {Object} 当前配置
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 更新配置
     * @param {Object} options - 新配置项
     * @returns {Object} 更新后的配置
     */
    updateConfig(options) {
        this.config = { ...this.config, ...options };
        return this.config;
    }
}

// 初始化并导出生成器
window.javaModelGenerator = new JavaModelGenerator(); 