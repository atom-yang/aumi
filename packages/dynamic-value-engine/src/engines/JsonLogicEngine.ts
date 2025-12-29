import jsonLogic from 'json-logic-js';
import { BaseEngine } from './BaseEngine';
import { Context, EngineType, JsonLogicExpression, JsonLogicOptions } from '../types';

/**
 * JSON Logic 引擎
 * 使用 json-logic-js 库进行逻辑计算
 * 
 * 示例：
 * expression: { "==": [{ "var": "user.age" }, 18] }
 * context: { user: { age: 18 } }
 * result: true
 */
export class JsonLogicEngine extends BaseEngine {
  private customOperators: Map<string, (...args: any[]) => any>;
  private builtInOperatorsRegistered: boolean = false;
  private executionDepth: number = 0;

  constructor() {
    super(EngineType.JSON_LOGIC);
    this.customOperators = new Map();
  }

  /**
   * 执行 JSON Logic 计算
   */
  protected async executeCalculation<T = any>(
    expression: JsonLogicExpression,
    context: Context,
    options?: JsonLogicOptions
  ): Promise<T> {
    // 重置执行深度
    this.executionDepth = 0;
    const maxDepth = options?.maxDepth ?? 100;

    // 清除之前的操作符（如果需要）
    if (options?.clearPreviousOperators) {
      this.clearAllCustomOperators();
    }

    // 注册内置扩展操作符
    if (options?.builtInExtensions && !this.builtInOperatorsRegistered) {
      this.registerBuiltInExtensions();
      this.builtInOperatorsRegistered = true;
    }

    // 注册自定义操作符
    if (options?.customOperators) {
      Object.entries(options.customOperators).forEach(([name, fn]) => {
        this.addCustomOperator(name, fn as (...args: any[]) => any);
      });
    }

    // 应用所有自定义操作符
    this.customOperators.forEach((fn, name) => {
      jsonLogic.add_operation(name, fn);
    });

    // 设置自定义变量解析器
    if (options?.customVarResolver) {
      const originalVar = jsonLogic.get_operator('var');
      jsonLogic.add_operation('var', (path: any, defaultVal: any) => {
        return options.customVarResolver!(path, context, defaultVal);
      });
    }

    // 转换上下文
    let processedContext = context;
    if (options?.transformContext) {
      processedContext = options.transformContext(context);
    }

    // 严格模式：检查变量是否存在
    if (options?.strictMode) {
      this.validateVariablesExist(expression, processedContext);
    }

    // 调试模式
    if (options?.debug) {
      console.log('[JsonLogic Debug] Expression:', JSON.stringify(expression, null, 2));
      console.log('[JsonLogic Debug] Context:', JSON.stringify(processedContext, null, 2));
    }

    // 执行计算（带深度限制）
    let result: any;
    try {
      result = this.applyWithDepthLimit(expression, processedContext, maxDepth);
    } catch (error) {
      if (options?.debug) {
        console.error('[JsonLogic Debug] Error:', error);
      }
      throw error;
    }

    // 后处理结果
    if (options?.postProcess) {
      result = options.postProcess(result);
    }

    // 调试模式：输出结果
    if (options?.debug) {
      console.log('[JsonLogic Debug] Result:', result);
    }

    return result as T;
  }

  /**
   * 带深度限制的 apply
   */
  private applyWithDepthLimit(expression: any, context: Context, maxDepth: number): any {
    if (this.executionDepth >= maxDepth) {
      throw new Error(`超出最大执行深度限制: ${maxDepth}`);
    }

    this.executionDepth++;
    try {
      return jsonLogic.apply(expression, context);
    } finally {
      this.executionDepth--;
    }
  }

  /**
   * 验证变量是否存在（严格模式）
   */
  private validateVariablesExist(expression: any, context: Context): void {
    const variables = this.extractVariables(expression);
    const missingVars: string[] = [];

    variables.forEach((varPath) => {
      if (!this.hasPath(context, varPath)) {
        missingVars.push(varPath);
      }
    });

    if (missingVars.length > 0) {
      throw new Error(`严格模式：以下变量不存在: ${missingVars.join(', ')}`);
    }
  }

  /**
   * 提取表达式中的所有变量
   */
  private extractVariables(expression: any, variables: Set<string> = new Set()): Set<string> {
    if (typeof expression !== 'object' || expression === null) {
      return variables;
    }

    if (Array.isArray(expression)) {
      expression.forEach((item) => this.extractVariables(item, variables));
      return variables;
    }

    Object.entries(expression).forEach(([key, value]) => {
      if (key === 'var' && typeof value === 'string') {
        variables.add(value);
      } else if (key === 'var' && Array.isArray(value) && typeof value[0] === 'string') {
        variables.add(value[0]);
      } else {
        this.extractVariables(value, variables);
      }
    });

    return variables;
  }

  /**
   * 检查路径是否存在
   */
  private hasPath(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  /**
   * 注册内置扩展操作符
   */
  private registerBuiltInExtensions(): void {
    // 字符串操作
    this.addCustomOperator('startsWith', (str: string, prefix: string) => {
      return String(str).startsWith(String(prefix));
    });

    this.addCustomOperator('endsWith', (str: string, suffix: string) => {
      return String(str).endsWith(String(suffix));
    });

    this.addCustomOperator('includes', (str: string, substr: string) => {
      return String(str).includes(String(substr));
    });

    this.addCustomOperator('toUpperCase', (str: string) => {
      return String(str).toUpperCase();
    });

    this.addCustomOperator('toLowerCase', (str: string) => {
      return String(str).toLowerCase();
    });

    this.addCustomOperator('trim', (str: string) => {
      return String(str).trim();
    });

    this.addCustomOperator('replace', (str: string, search: string, replace: string) => {
      return String(str).replace(search, replace);
    });

    this.addCustomOperator('split', (str: string, separator: string) => {
      return String(str).split(separator);
    });

    this.addCustomOperator('join', (arr: any[], separator: string = ',') => {
      return arr.join(separator);
    });

    // 类型检查
    this.addCustomOperator('isEmpty', (value: any) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.length === 0;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;
    });

    this.addCustomOperator('isNotEmpty', (value: any) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    });

    this.addCustomOperator('isNull', (value: any) => value === null);
    this.addCustomOperator('isUndefined', (value: any) => value === undefined);
    this.addCustomOperator('isNumber', (value: any) => typeof value === 'number' && !isNaN(value));
    this.addCustomOperator('isString', (value: any) => typeof value === 'string');
    this.addCustomOperator('isBoolean', (value: any) => typeof value === 'boolean');
    this.addCustomOperator('isArray', (value: any) => Array.isArray(value));
    this.addCustomOperator('isObject', (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value));

    // 数组操作
    this.addCustomOperator('length', (value: any) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length;
      }
      return 0;
    });

    this.addCustomOperator('first', (arr: any[]) => {
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
    });

    this.addCustomOperator('last', (arr: any[]) => {
      return Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : undefined;
    });

    this.addCustomOperator('reverse', (arr: any[]) => {
      return Array.isArray(arr) ? [...arr].reverse() : [];
    });

    this.addCustomOperator('unique', (arr: any[]) => {
      return Array.isArray(arr) ? [...new Set(arr)] : [];
    });

    this.addCustomOperator('flatten', (arr: any[]) => {
      return Array.isArray(arr) ? arr.flat() : [];
    });

    this.addCustomOperator('sort', (arr: any[], order: 'asc' | 'desc' = 'asc') => {
      if (!Array.isArray(arr)) return [];
      const sorted = [...arr].sort();
      return order === 'desc' ? sorted.reverse() : sorted;
    });

    // 数学操作
    this.addCustomOperator('abs', (num: number) => Math.abs(num));
    this.addCustomOperator('ceil', (num: number) => Math.ceil(num));
    this.addCustomOperator('floor', (num: number) => Math.floor(num));
    this.addCustomOperator('round', (num: number, decimals: number = 0) => {
      const factor = Math.pow(10, decimals);
      return Math.round(num * factor) / factor;
    });
    this.addCustomOperator('pow', (base: number, exponent: number) => Math.pow(base, exponent));
    this.addCustomOperator('sqrt', (num: number) => Math.sqrt(num));
    this.addCustomOperator('random', () => Math.random());

    // 正则表达式
    this.addCustomOperator('regex', (str: string, pattern: string, flags?: string) => {
      const regex = new RegExp(pattern, flags);
      return regex.test(String(str));
    });

    // 日期操作
    this.addCustomOperator('now', () => Date.now());
    this.addCustomOperator('dateFormat', (timestamp: number, locale: string = 'zh-CN') => {
      return new Date(timestamp).toLocaleString(locale);
    });

    // 对象操作
    this.addCustomOperator('keys', (obj: any) => {
      return typeof obj === 'object' && obj !== null ? Object.keys(obj) : [];
    });

    this.addCustomOperator('values', (obj: any) => {
      return typeof obj === 'object' && obj !== null ? Object.values(obj) : [];
    });

    this.addCustomOperator('entries', (obj: any) => {
      return typeof obj === 'object' && obj !== null ? Object.entries(obj) : [];
    });

    this.addCustomOperator('has', (obj: any, key: string) => {
      return typeof obj === 'object' && obj !== null && key in obj;
    });

    // 条件操作
    this.addCustomOperator('default', (value: any, defaultValue: any) => {
      return value !== null && value !== undefined ? value : defaultValue;
    });

    this.addCustomOperator('coalesce', (...values: any[]) => {
      return values.find(v => v !== null && v !== undefined);
    });
  }

  /**
   * 验证 JSON Logic 表达式
   */
  validate(expression: any): boolean {
    if (!expression || typeof expression !== 'object') {
      return false;
    }

    try {
      // JSON Logic 表达式应该是一个对象
      // 尝试获取操作符（顶层键）
      const operators = Object.keys(expression);
      return operators.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 添加自定义操作符
   */
  addCustomOperator(name: string, fn: (...args: any[]) => any): void {
    this.customOperators.set(name, fn);
    jsonLogic.add_operation(name, fn);
  }

  /**
   * 移除自定义操作符
   */
  removeCustomOperator(name: string): void {
    this.customOperators.delete(name);
    jsonLogic.rm_operation(name);
  }

  /**
   * 获取所有自定义操作符
   */
  getCustomOperators(): string[] {
    return Array.from(this.customOperators.keys());
  }

  /**
   * 清除所有自定义操作符
   */
  clearAllCustomOperators(): void {
    this.customOperators.forEach((fn, name) => {
      jsonLogic.rm_operation(name);
    });
    this.customOperators.clear();
  }

  /**
   * 重置为默认状态
   */
  reset(): void {
    this.clearAllCustomOperators();
    this.builtInOperatorsRegistered = false;
    this.executionDepth = 0;
  }

  /**
   * 获取所有内置扩展操作符列表
   */
  getBuiltInExtensions(): string[] {
    return [
      // 字符串操作
      'startsWith', 'endsWith', 'includes', 'toUpperCase', 'toLowerCase',
      'trim', 'replace', 'split', 'join',
      // 类型检查
      'isEmpty', 'isNotEmpty', 'isNull', 'isUndefined', 'isNumber',
      'isString', 'isBoolean', 'isArray', 'isObject',
      // 数组操作
      'length', 'first', 'last', 'reverse', 'unique', 'flatten', 'sort',
      // 数学操作
      'abs', 'ceil', 'floor', 'round', 'pow', 'sqrt', 'random',
      // 正则表达式
      'regex',
      // 日期操作
      'now', 'dateFormat',
      // 对象操作
      'keys', 'values', 'entries', 'has',
      // 条件操作
      'default', 'coalesce',
    ];
  }
}
