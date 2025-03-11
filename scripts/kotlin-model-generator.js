/**
 * Kotlin模型生成器
 * 将JSON数据转换为Kotlin类定义
 */
class KotlinModelGenerator {
    /**
     * 构造函数
     */
    constructor() {
        // 默认配置
        this.config = {
            useDataClass: true,
            useNullableDatatypes: true,
            useSerialAnnotation: false,
            useCompanionObject: false,
            packageName: ''
        };
    }

    /**
     * 生成Kotlin模型代码
     * @param {Object|Array} jsonData - 要转换的JSON数据
     * @param {Object} options - 生成选项，包含rootClassName
     * @returns {string} 生成的Kotlin代码
     */
    generate(jsonData, options = {}) {
        // 合并选项
        this.config = { ...this.config, ...options };
        const rootClassName = options.rootClassName || 'RootModel';

        // 处理数据
        if (Array.isArray(jsonData) && jsonData.length > 0) {
            // 如果是数组，使用第一个元素作为样本
            jsonData = jsonData[0];
        }

        // 生成代码
        let result = '';

        // 添加包声明
        if (this.config.packageName) {
            result += `package ${this.config.packageName}\n\n`;
        }

        // 添加导入语句
        if (this.config.useSerialAnnotation) {
            result += 'import kotlinx.serialization.Serializable\n';
            result += 'import kotlinx.serialization.SerialName\n\n';
        }

        // 生成类定义
        result += this.generateClass(jsonData, rootClassName);

        return result;
    }

    /**
     * 生成Kotlin类定义
     * @param {Object} obj - 对象数据
     * @param {string} className - 类名
     * @returns {string} 生成的Kotlin类代码
     */
    generateClass(obj, className) {
        let classCode = '';
        let properties = [];
        let innerClasses = [];

        // 添加类注解
        if (this.config.useSerialAnnotation) {
            classCode += '@Serializable\n';
        }

        // 添加类定义
        const classType = this.config.useDataClass ? 'data class' : 'class';
        classCode += `${classType} ${className}(\n`;

        // 处理属性
        for (const [key, value] of Object.entries(obj)) {
            // 格式化属性名
            const propName = this.formatPropertyName(key);

            // 确定属性类型
            let propType = this.getKotlinType(value, this.formatClassName(key));

            // 添加可空标记
            if (this.config.useNullableDatatypes && value === null) {
                propType += '?';
            }

            // 处理内部类
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const innerClassName = this.formatClassName(key);
                innerClasses.push(this.generateClass(value, innerClassName));
            }
            else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const innerClassName = this.formatClassName(this.singularize(key));
                innerClasses.push(this.generateClass(value[0], innerClassName));
            }

            // 添加字段定义（带注解）
            let propCode = '';
            if (this.config.useSerialAnnotation) {
                propCode += `    @SerialName("${key}")\n`;
            }

            // 添加属性定义
            propCode += `    val ${propName}: ${propType},\n`;
            properties.push(propCode);
        }

        // 添加所有属性
        classCode += properties.join('');

        // 移除最后一个逗号并关闭类定义
        if (properties.length > 0) {
            classCode = classCode.slice(0, -2) + '\n';
        }
        classCode += ')';

        // 添加伴生对象
        if (this.config.useCompanionObject) {
            classCode += ' {\n';
            classCode += '    companion object {\n';
            classCode += '        // 可以添加辅助方法\n';
            classCode += '    }\n';
            classCode += '}';
        }

        classCode += '\n\n';

        // 添加内部类
        classCode += innerClasses.join('\n');

        return classCode;
    }

    /**
     * 确定字段的Kotlin类型
     * @param {*} value - 字段值
     * @param {string} className - 类名(用于对象类型)
     * @returns {string} Kotlin类型名称
     */
    getKotlinType(value, className) {
        if (value === null) {
            return 'Any';
        }

        switch (typeof value) {
            case 'string':
                return 'String';
            case 'number':
                // 判断是否为整数
                return Number.isInteger(value) ? 'Int' : 'Double';
            case 'boolean':
                return 'Boolean';
            case 'object':
                if (Array.isArray(value)) {
                    // 确定列表类型
                    if (value.length === 0) {
                        return 'List<Any>';
                    }

                    const itemType = typeof value[0] === 'object' && value[0] !== null
                        ? this.formatClassName(this.singularize(className))
                        : this.getKotlinType(value[0], '');

                    return `List<${itemType}>`;
                }
                return className;
            default:
                return 'Any';
        }
    }

    /**
     * 格式化属性名称为驼峰命名法
     * @param {string} name - 原始名称
     * @returns {string} 格式化后的名称
     */
    formatPropertyName(name) {
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
window.kotlinModelGenerator = new KotlinModelGenerator(); 