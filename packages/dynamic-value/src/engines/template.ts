/**
 * 模板表达式引擎
 * 支持 {{expression}} 语法
 */

import type { IEngine, DynamicContext, TemplateConfig } from '../types';

/**
 * 模板表达式引擎
 */
export class TemplateEngine implements IEngine<TemplateConfig, string> {
  readonly type = 'template' as const;
  readonly name = 'Template Expression Engine';

  private helpers: Record<string, (...args: unknown[]) => unknown> = {};
  private readonly expressionRegex = /\{\{(.+?)\}\}/g;

  constructor(helpers?: Record<string, (...args: unknown[]) => unknown>) {
    // 注册内置助手函数
    this.registerBuiltInHelpers();

    // 注册自定义助手函数
    if (helpers) {
      for (const [name, fn] of Object.entries(helpers)) {
        this.helpers[name] = fn;
      }
    }
  }

  /**
   * 注册内置助手函数
   */
  private registerBuiltInHelpers(): void {
    // 字符串操作
    this.helpers.upper = (str: unknown) =>
      typeof str === 'string' ? str.toUpperCase() : String(str);
    this.helpers.lower = (str: unknown) =>
      typeof str === 'string' ? str.toLowerCase() : String(str);
    this.helpers.trim = (str: unknown) =>
      typeof str === 'string' ? str.trim() : String(str);
    this.helpers.capitalize = (str: unknown) => {
      const s = typeof str === 'string' ? str : String(str);
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };
    this.helpers.replace = (str: unknown, search: unknown, replacement: unknown) =>
      typeof str === 'string'
        ? str.replace(String(search), String(replacement))
        : String(str);
    this.helpers.substr = (str: unknown, start: unknown, length?: unknown) => {
      const s = typeof str === 'string' ? str : String(str);
      return s.substring(Number(start), length !== undefined ? Number(length) : undefined);
    };
    this.helpers.split = (str: unknown, separator: unknown) =>
      typeof str === 'string' ? str.split(String(separator)) : [];
    this.helpers.join = (arr: unknown, separator?: unknown) =>
      Array.isArray(arr) ? arr.join(separator !== undefined ? String(separator) : ',') : '';

    // 数学操作
    this.helpers.add = (a: unknown, b: unknown) => Number(a) + Number(b);
    this.helpers.sub = (a: unknown, b: unknown) => Number(a) - Number(b);
    this.helpers.mul = (a: unknown, b: unknown) => Number(a) * Number(b);
    this.helpers.div = (a: unknown, b: unknown) => Number(a) / Number(b);
    this.helpers.mod = (a: unknown, b: unknown) => Number(a) % Number(b);
    this.helpers.round = (n: unknown, decimals?: unknown) => {
      const num = Number(n);
      const d = decimals !== undefined ? Number(decimals) : 0;
      const factor = Math.pow(10, d);
      return Math.round(num * factor) / factor;
    };
    this.helpers.floor = (n: unknown) => Math.floor(Number(n));
    this.helpers.ceil = (n: unknown) => Math.ceil(Number(n));
    this.helpers.abs = (n: unknown) => Math.abs(Number(n));
    this.helpers.min = (...args: unknown[]) => Math.min(...args.map(Number));
    this.helpers.max = (...args: unknown[]) => Math.max(...args.map(Number));

    // 日期操作
    this.helpers.now = () => new Date().toISOString();
    this.helpers.timestamp = () => Date.now();
    this.helpers.formatDate = (date: unknown, format?: unknown) => {
      const d = date ? new Date(date as string | number) : new Date();
      const fmt = typeof format === 'string' ? format : 'YYYY-MM-DD';
      return this.formatDateString(d, fmt);
    };

    // 条件判断
    this.helpers.if = (condition: unknown, ifTrue: unknown, ifFalse?: unknown) =>
      condition ? ifTrue : ifFalse ?? '';
    this.helpers.eq = (a: unknown, b: unknown) => a === b;
    this.helpers.ne = (a: unknown, b: unknown) => a !== b;
    this.helpers.gt = (a: unknown, b: unknown) => Number(a) > Number(b);
    this.helpers.gte = (a: unknown, b: unknown) => Number(a) >= Number(b);
    this.helpers.lt = (a: unknown, b: unknown) => Number(a) < Number(b);
    this.helpers.lte = (a: unknown, b: unknown) => Number(a) <= Number(b);
    this.helpers.and = (...args: unknown[]) => args.every(Boolean);
    this.helpers.or = (...args: unknown[]) => args.some(Boolean);
    this.helpers.not = (val: unknown) => !val;

    // 类型转换
    this.helpers.str = (val: unknown) => String(val ?? '');
    this.helpers.num = (val: unknown) => Number(val);
    this.helpers.bool = (val: unknown) => Boolean(val);
    this.helpers.json = (val: unknown) => JSON.stringify(val);
    this.helpers.parse = (val: unknown) => {
      try {
        return JSON.parse(String(val));
      } catch {
        return null;
      }
    };

    // 数组操作
    this.helpers.length = (val: unknown) =>
      Array.isArray(val) || typeof val === 'string' ? val.length : 0;
    this.helpers.first = (arr: unknown) => (Array.isArray(arr) ? arr[0] : undefined);
    this.helpers.last = (arr: unknown) =>
      Array.isArray(arr) ? arr[arr.length - 1] : undefined;
    this.helpers.at = (arr: unknown, index: unknown) =>
      Array.isArray(arr) ? arr[Number(index)] : undefined;
    this.helpers.includes = (arr: unknown, item: unknown) =>
      Array.isArray(arr) ? arr.includes(item) : false;
    this.helpers.reverse = (arr: unknown) =>
      Array.isArray(arr) ? [...arr].reverse() : [];
    this.helpers.sort = (arr: unknown) =>
      Array.isArray(arr) ? [...arr].sort() : [];

    // 空值处理
    this.helpers.default = (val: unknown, defaultVal: unknown) =>
      val ?? defaultVal;
    this.helpers.coalesce = (...args: unknown[]) =>
      args.find((arg) => arg !== null && arg !== undefined);

    // 对象操作
    this.helpers.keys = (obj: unknown) =>
      obj && typeof obj === 'object' ? Object.keys(obj) : [];
    this.helpers.values = (obj: unknown) =>
      obj && typeof obj === 'object' ? Object.values(obj) : [];
    this.helpers.entries = (obj: unknown) =>
      obj && typeof obj === 'object' ? Object.entries(obj) : [];
    this.helpers.get = (obj: unknown, path: unknown) =>
      this.getByPath(obj as Record<string, unknown>, String(path));
  }

  /**
   * 格式化日期字符串
   */
  private formatDateString(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 通过路径获取值
   */
  private getByPath(obj: Record<string, unknown> | null | undefined, path: string): unknown {
    if (!obj) {
      return undefined;
    }

    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * 添加助手函数
   */
  addHelper(name: string, fn: (...args: unknown[]) => unknown): void {
    this.helpers[name] = fn;
  }

  /**
   * 执行模板表达式
   */
  async execute(config: TemplateConfig, context: DynamicContext): Promise<string> {
    const { template, safeMode = true, helpers: configHelpers } = config;

    // 合并助手函数
    const allHelpers = { ...this.helpers };
    if (configHelpers) {
      for (const [name, fn] of Object.entries(configHelpers)) {
        allHelpers[name] = fn;
      }
    }

    // 准备数据上下文
    const dataContext = this.prepareDataContext(context);

    // 替换所有 {{expression}}
    const result = template.replace(this.expressionRegex, (match, expression: string) => {
      try {
        const trimmedExpr = expression.trim();
        const value = this.evaluateExpression(trimmedExpr, dataContext, allHelpers, safeMode);
        return this.formatValue(value);
      } catch (error) {
        // 如果表达式求值失败，返回原始匹配或空字符串
        console.warn(`Template expression error for "${expression}":`, error);
        return '';
      }
    });

    return result;
  }

  /**
   * 准备数据上下文
   */
  private prepareDataContext(context: DynamicContext): Record<string, unknown> {
    return {
      ...context.data,
      $data: context.data,
      $vars: context.vars,
      $env: context.env,
      $user: context.user,
      $meta: context.meta,
      $context: context,
    };
  }

  /**
   * 求值表达式
   */
  private evaluateExpression(
    expression: string,
    dataContext: Record<string, unknown>,
    helpers: Record<string, (...args: unknown[]) => unknown>,
    safeMode: boolean,
  ): unknown {
    // 检查是否是函数调用: helper(arg1, arg2, ...)
    const funcMatch = expression.match(/^(\w+)\((.*)\)$/);
    if (funcMatch) {
      const [, funcName, argsStr] = funcMatch;
      const helperFn = helpers[funcName];
      if (helperFn) {
        const args = this.parseArguments(argsStr, dataContext, helpers, safeMode);
        return helperFn(...args);
      }
    }

    // 检查是否是管道操作: value | helper | helper(arg)
    if (expression.includes('|')) {
      return this.evaluatePipeline(expression, dataContext, helpers, safeMode);
    }

    // 简单变量访问
    return this.resolveValue(expression, dataContext);
  }

  /**
   * 解析函数参数
   */
  private parseArguments(
    argsStr: string,
    dataContext: Record<string, unknown>,
    helpers: Record<string, (...args: unknown[]) => unknown>,
    safeMode: boolean,
  ): unknown[] {
    if (!argsStr.trim()) {
      return [];
    }

    const args: unknown[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];

      if (inString) {
        current += char;
        if (char === stringChar && argsStr[i - 1] !== '\\') {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === '(') {
        depth++;
        current += char;
        continue;
      }

      if (char === ')') {
        depth--;
        current += char;
        continue;
      }

      if (char === ',' && depth === 0) {
        args.push(this.parseArgumentValue(current.trim(), dataContext, helpers, safeMode));
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      args.push(this.parseArgumentValue(current.trim(), dataContext, helpers, safeMode));
    }

    return args;
  }

  /**
   * 解析单个参数值
   */
  private parseArgumentValue(
    value: string,
    dataContext: Record<string, unknown>,
    helpers: Record<string, (...args: unknown[]) => unknown>,
    safeMode: boolean,
  ): unknown {
    // 字符串字面量
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // 数字字面量
    if (/^-?\d+\.?\d*$/.test(value)) {
      return Number(value);
    }

    // 布尔字面量
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }

    // null/undefined
    if (value === 'null') {
      return null;
    }
    if (value === 'undefined') {
      return undefined;
    }

    // 函数调用
    const funcMatch = value.match(/^(\w+)\((.*)\)$/);
    if (funcMatch) {
      const [, funcName, argsStr] = funcMatch;
      const helperFn = helpers[funcName];
      if (helperFn) {
        const args = this.parseArguments(argsStr, dataContext, helpers, safeMode);
        return helperFn(...args);
      }
    }

    // 变量引用
    return this.resolveValue(value, dataContext);
  }

  /**
   * 求值管道表达式
   */
  private evaluatePipeline(
    expression: string,
    dataContext: Record<string, unknown>,
    helpers: Record<string, (...args: unknown[]) => unknown>,
    safeMode: boolean,
  ): unknown {
    const parts = expression.split('|').map((p) => p.trim());
    let value = this.resolveValue(parts[0], dataContext);

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const funcMatch = part.match(/^(\w+)(?:\((.*)\))?$/);

      if (funcMatch) {
        const [, funcName, argsStr] = funcMatch;
        const helperFn = helpers[funcName];

        if (helperFn) {
          const args = argsStr
            ? this.parseArguments(argsStr, dataContext, helpers, safeMode)
            : [];
          value = helperFn(value, ...args);
        }
      }
    }

    return value;
  }

  /**
   * 解析变量值
   */
  private resolveValue(expression: string, dataContext: Record<string, unknown>): unknown {
    const trimmed = expression.trim();

    // 字符串字面量
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // 数字字面量
    if (/^-?\d+\.?\d*$/.test(trimmed)) {
      return Number(trimmed);
    }

    // 布尔字面量
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }

    // 路径访问
    return this.getByPath(dataContext, trimmed);
  }

  /**
   * 格式化输出值
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * 验证配置
   */
  validate(config: TemplateConfig): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }
    if (typeof config.template !== 'string') {
      return false;
    }
    return true;
  }
}

/**
 * 创建模板引擎的工厂函数
 */
export function createTemplateEngine(
  helpers?: Record<string, (...args: unknown[]) => unknown>,
): TemplateEngine {
  return new TemplateEngine(helpers);
}
