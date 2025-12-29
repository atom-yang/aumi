/**
 * 脚本执行引擎
 * 支持执行 JavaScript/TypeScript 代码
 */

import type { IEngine, DynamicContext, ScriptConfig } from '../types';

/**
 * 安全的全局变量白名单
 */
const SAFE_GLOBALS = [
  // 基础类型
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Symbol',
  'BigInt',
  // 数学
  'Math',
  'Date',
  'JSON',
  // 数据结构
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  // 正则
  'RegExp',
  // Promise
  'Promise',
  // 数组方法
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  // 编码
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
  // 错误类型
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  // 其他
  'console',
  'undefined',
  'NaN',
  'Infinity',
];

/**
 * 危险的代码模式
 */
const DANGEROUS_PATTERNS = [
  /\beval\b/,
  /\bFunction\b/,
  /\bimport\b/,
  /\brequire\b/,
  /\bprocess\b/,
  /\bglobal\b/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\b__proto__\b/,
  /\bconstructor\b/,
  /\bprototype\b/,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\bsetImmediate\b/,
  /\bfetch\b/,
  /\bXMLHttpRequest\b/,
  /\.call\b/,
  /\.apply\b/,
  /\.bind\b/,
];

/**
 * 脚本执行引擎
 */
export class ScriptEngine implements IEngine<ScriptConfig, unknown> {
  readonly type = 'script' as const;
  readonly name = 'Script Execution Engine';

  private defaultTimeout = 5000;
  private defaultAllowedGlobals = SAFE_GLOBALS;

  constructor(options?: { timeout?: number; allowedGlobals?: string[] }) {
    if (options?.timeout) {
      this.defaultTimeout = options.timeout;
    }
    if (options?.allowedGlobals) {
      this.defaultAllowedGlobals = options.allowedGlobals;
    }
  }

  /**
   * 执行脚本
   */
  async execute(config: ScriptConfig, context: DynamicContext): Promise<unknown> {
    const {
      code,
      async: isAsync = false,
      timeout = this.defaultTimeout,
      allowedGlobals = this.defaultAllowedGlobals,
    } = config;

    // 安全检查
    this.validateCodeSafety(code);

    // 准备执行上下文
    const executionContext = this.prepareExecutionContext(context, allowedGlobals);

    // 创建沙箱函数
    const sandboxedCode = this.createSandboxedCode(code, executionContext, isAsync);

    // 执行代码
    return this.executeWithTimeout(sandboxedCode, timeout);
  }

  /**
   * 验证代码安全性
   */
  private validateCodeSafety(code: string): void {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        throw new Error(
          `Unsafe code pattern detected: ${pattern.toString()}. ` +
          'This pattern is not allowed in sandboxed script execution.',
        );
      }
    }
  }

  /**
   * 准备执行上下文
   */
  private prepareExecutionContext(
    context: DynamicContext,
    allowedGlobals: string[],
  ): Record<string, unknown> {
    const executionContext: Record<string, unknown> = {};

    // 添加允许的全局变量
    for (const globalName of allowedGlobals) {
      if (globalName in globalThis) {
        executionContext[globalName] = (globalThis as Record<string, unknown>)[globalName];
      }
    }

    // 添加上下文数据
    executionContext.data = context.data;
    executionContext.vars = context.vars || {};
    executionContext.env = context.env || {};
    executionContext.user = context.user || {};
    executionContext.meta = context.meta || {};
    executionContext.context = context;

    // 添加工具函数
    executionContext.get = (path: string) => this.getByPath(context, path);
    executionContext.set = (path: string, value: unknown) => this.setByPath(context, path, value);
    executionContext.has = (path: string) => this.getByPath(context, path) !== undefined;

    return executionContext;
  }

  /**
   * 创建沙箱化的代码
   */
  private createSandboxedCode(
    code: string,
    executionContext: Record<string, unknown>,
    isAsync: boolean,
  ): () => Promise<unknown> {
    // 构建参数名和值
    const paramNames = Object.keys(executionContext);
    const paramValues = Object.values(executionContext);

    // 包装代码
    const wrappedCode = isAsync
      ? `return (async () => { ${code} })();`
      : `return (() => { ${code} })();`;

    // 创建函数
    try {
      // 使用 new Function 创建沙箱函数
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const sandboxFn = new Function(...paramNames, wrappedCode);

      return async () => {
        return sandboxFn(...paramValues);
      };
    } catch (error) {
      throw new Error(`Script compilation error: ${(error as Error).message}`);
    }
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout(
    fn: () => Promise<unknown>,
    timeout: number,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Script execution timeout after ${timeout}ms`));
      }, timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(new Error(`Script execution error: ${(error as Error).message}`));
        });
    });
  }

  /**
   * 通过路径获取值
   */
  private getByPath(context: DynamicContext, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = context;

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
   * 通过路径设置值
   */
  private setByPath(context: DynamicContext, path: string, value: unknown): void {
    const parts = path.split('.');
    const lastPart = parts.pop();

    if (!lastPart) {
      return;
    }

    let current: Record<string, unknown> = context as unknown as Record<string, unknown>;

    for (const part of parts) {
      if (current[part] === undefined || current[part] === null) {
        current[part] = {};
      }
      if (typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[lastPart] = value;
  }

  /**
   * 验证配置
   */
  validate(config: ScriptConfig): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }
    if (typeof config.code !== 'string') {
      return false;
    }
    if (config.code.trim().length === 0) {
      return false;
    }
    return true;
  }
}

/**
 * 创建脚本引擎的工厂函数
 */
export function createScriptEngine(options?: {
  timeout?: number;
  allowedGlobals?: string[];
}): ScriptEngine {
  return new ScriptEngine(options);
}

/**
 * 预定义的脚本模板
 */
export const scriptTemplates = {
  /**
   * 条件返回
   */
  conditional: (condition: string, ifTrue: string, ifFalse: string) =>
    `return ${condition} ? ${ifTrue} : ${ifFalse};`,

  /**
   * 数组过滤
   */
  arrayFilter: (arrayPath: string, condition: string) =>
    `return data.${arrayPath}.filter(item => ${condition});`,

  /**
   * 数组映射
   */
  arrayMap: (arrayPath: string, transform: string) =>
    `return data.${arrayPath}.map(item => ${transform});`,

  /**
   * 数组归约
   */
  arrayReduce: (arrayPath: string, reducer: string, initial: string) =>
    `return data.${arrayPath}.reduce((acc, item) => ${reducer}, ${initial});`,

  /**
   * 对象转换
   */
  objectTransform: (objectPath: string, transform: string) =>
    `const obj = data.${objectPath}; return ${transform};`,

  /**
   * 计算属性
   */
  computed: (expression: string) => `return ${expression};`,
};
