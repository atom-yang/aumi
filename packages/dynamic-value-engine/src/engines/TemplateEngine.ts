import { BaseEngine } from './BaseEngine';
import { Context, EngineType, TemplateOptions } from '../types';

/**
 * 模板表达式引擎
 * 支持 {{}} 语法的模板字符串
 * 
 * 示例：
 * expression: "Hello {{user.name}}, you are {{user.age}} years old"
 * context: { user: { name: "John", age: 25 } }
 * result: "Hello John, you are 25 years old"
 */
export class TemplateEngine extends BaseEngine {
  private readonly DEFAULT_START_DELIMITER = '{{';
  private readonly DEFAULT_END_DELIMITER = '}}';

  constructor() {
    super(EngineType.TEMPLATE);
  }

  /**
   * 执行模板计算
   */
  protected async executeCalculation<T = any>(
    expression: string,
    context: Context,
    options?: TemplateOptions
  ): Promise<T> {
    const startDelimiter =
      options?.startDelimiter || this.DEFAULT_START_DELIMITER;
    const endDelimiter = options?.endDelimiter || this.DEFAULT_END_DELIMITER;
    const allowFunctions = options?.allowFunctions || false;

    const result = this.processTemplate(
      expression,
      context,
      startDelimiter,
      endDelimiter,
      allowFunctions
    );

    return result as T;
  }

  /**
   * 验证模板表达式
   */
  validate(expression: any): boolean {
    if (typeof expression !== 'string') {
      return false;
    }

    try {
      // 检查模板标记是否配对
      const openCount = (expression.match(/\{\{/g) || []).length;
      const closeCount = (expression.match(/\}\}/g) || []).length;
      return openCount === closeCount;
    } catch {
      return false;
    }
  }

  /**
   * 处理模板字符串
   */
  private processTemplate(
    template: string,
    context: Context,
    startDelimiter: string,
    endDelimiter: string,
    allowFunctions: boolean
  ): string {
    // 转义正则表达式特殊字符
    const escapeRegex = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const startPattern = escapeRegex(startDelimiter);
    const endPattern = escapeRegex(endDelimiter);

    // 创建匹配模板变量的正则表达式
    const pattern = new RegExp(
      `${startPattern}\\s*([^${endPattern}]+?)\\s*${endPattern}`,
      'g'
    );

    return template.replace(pattern, (match, expression) => {
      try {
        const value = this.evaluateExpression(
          expression.trim(),
          context,
          allowFunctions
        );
        return value !== undefined && value !== null ? String(value) : '';
      } catch (error) {
        // 如果表达式求值失败，返回原始文本
        console.warn(
          `模板表达式求值失败: ${expression}`,
          error instanceof Error ? error.message : error
        );
        return match;
      }
    });
  }

  /**
   * 求值表达式
   */
  private evaluateExpression(
    expression: string,
    context: Context,
    allowFunctions: boolean
  ): any {
    // 简单的变量访问（如 user.name）
    if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(expression)) {
      return this.safeGet(context, expression);
    }

    // 如果允许函数调用，使用 Function 构造函数
    if (allowFunctions) {
      try {
        const fn = new Function('context', `with(context) { return ${expression}; }`);
        return fn(context);
      } catch {
        // 如果失败，尝试简单路径访问
        return this.safeGet(context, expression);
      }
    }

    // 支持简单的算术运算和比较
    if (this.isSimpleExpression(expression)) {
      return this.evaluateSimpleExpression(expression, context);
    }

    // 默认当作路径处理
    return this.safeGet(context, expression);
  }

  /**
   * 检查是否是简单表达式（只包含变量、数字、基本运算符）
   */
  private isSimpleExpression(expression: string): boolean {
    // 允许的简单表达式：变量、数字、基本运算符
    const simplePattern = /^[a-zA-Z0-9_$.\s+\-*/%()]+$/;
    return simplePattern.test(expression);
  }

  /**
   * 求值简单表达式
   */
  private evaluateSimpleExpression(expression: string, context: Context): any {
    try {
      // 替换变量为实际值
      const replaced = expression.replace(
        /[a-zA-Z_$][a-zA-Z0-9_$.]*(?![a-zA-Z0-9_$])/g,
        (match) => {
          const value = this.safeGet(context, match);
          if (typeof value === 'number') {
            return String(value);
          }
          if (typeof value === 'string') {
            return `"${value}"`;
          }
          if (value === null || value === undefined) {
            return 'undefined';
          }
          return JSON.stringify(value);
        }
      );

      // 安全求值
      const fn = new Function(`return ${replaced};`);
      return fn();
    } catch {
      return undefined;
    }
  }

  /**
   * 批量处理多个模板
   */
  async processBatch(
    templates: string[],
    context: Context,
    options?: TemplateOptions
  ): Promise<string[]> {
    const results: string[] = [];

    for (const template of templates) {
      const result = await this.calculate<string>(template, context, options);
      results.push(result.success ? result.value! : template);
    }

    return results;
  }

  /**
   * 检查模板中使用的变量
   */
  extractVariables(
    template: string,
    startDelimiter = this.DEFAULT_START_DELIMITER,
    endDelimiter = this.DEFAULT_END_DELIMITER
  ): string[] {
    const escapeRegex = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const startPattern = escapeRegex(startDelimiter);
    const endPattern = escapeRegex(endDelimiter);
    const pattern = new RegExp(
      `${startPattern}\\s*([^${endPattern}]+?)\\s*${endPattern}`,
      'g'
    );

    const variables = new Set<string>();
    let match;

    while ((match = pattern.exec(template)) !== null) {
      const expression = match[1].trim();
      // 提取变量名（简化版，只提取点号分隔的第一部分）
      const varMatch = expression.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
      if (varMatch) {
        variables.add(varMatch[0]);
      }
    }

    return Array.from(variables);
  }
}
