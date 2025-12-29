import { BaseEngine } from './BaseEngine';
import { Context, EngineType, SourceCodeOptions } from '../types';

/**
 * 源码执行引擎
 * 使用 Function 构造函数执行 JavaScript 代码
 * 
 * 示例：
 * expression: "return context.price * context.quantity * (1 - context.discount)"
 * context: { price: 100, quantity: 2, discount: 0.1 }
 * result: 180
 */
export class SourceCodeEngine extends BaseEngine {
  private readonly DEFAULT_TIMEOUT = 5000; // 5秒
  private readonly DEFAULT_ALLOWED_GLOBALS = [
    'Math',
    'Date',
    'String',
    'Number',
    'Boolean',
    'Array',
    'Object',
    'JSON',
  ];

  constructor() {
    super(EngineType.SOURCE_CODE);
  }

  /**
   * 执行源码计算
   */
  protected async executeCalculation<T = any>(
    expression: string,
    context: Context,
    options?: SourceCodeOptions
  ): Promise<T> {
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const allowedGlobals =
      options?.allowedGlobals || this.DEFAULT_ALLOWED_GLOBALS;

    // 创建受限的全局变量环境
    const sandbox = this.createSandbox(context, allowedGlobals);

    // 使用 Promise 和 setTimeout 实现超时控制
    return await this.executeWithTimeout(
      expression,
      sandbox,
      timeout
    );
  }

  /**
   * 验证源码表达式
   */
  validate(expression: any): boolean {
    if (typeof expression !== 'string' || !expression.trim()) {
      return false;
    }

    try {
      // 尝试创建函数，验证语法
      new Function('context', expression);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 创建沙箱环境
   */
  private createSandbox(
    context: Context,
    allowedGlobals: string[]
  ): Record<string, any> {
    const sandbox: Record<string, any> = {
      context: this.deepClone(context),
    };

    // 添加允许的全局变量
    allowedGlobals.forEach((globalName) => {
      if (typeof (global as any)[globalName] !== 'undefined') {
        sandbox[globalName] = (global as any)[globalName];
      } else if (typeof (globalThis as any)[globalName] !== 'undefined') {
        sandbox[globalName] = (globalThis as any)[globalName];
      }
    });

    return sandbox;
  }

  /**
   * 带超时的代码执行
   */
  private async executeWithTimeout<T>(
    code: string,
    sandbox: Record<string, any>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`代码执行超时（${timeout}ms）`));
      }, timeout);

      try {
        // 创建函数参数列表
        const paramNames = Object.keys(sandbox);
        const paramValues = Object.values(sandbox);

        // 确保代码返回值
        const wrappedCode = code.trim().startsWith('return')
          ? code
          : `return (${code})`;

        // 创建并执行函数
        const fn = new Function(...paramNames, wrappedCode);
        const result = fn(...paramValues);

        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(
          new Error(
            `代码执行错误: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        );
      }
    });
  }

  /**
   * 执行异步代码
   */
  async executeAsync<T = any>(
    expression: string,
    context: Context,
    options?: SourceCodeOptions
  ): Promise<T> {
    const timeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const allowedGlobals =
      options?.allowedGlobals || this.DEFAULT_ALLOWED_GLOBALS;

    const sandbox = this.createSandbox(context, allowedGlobals);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`异步代码执行超时（${timeout}ms）`));
      }, timeout);

      try {
        const paramNames = Object.keys(sandbox);
        const paramValues = Object.values(sandbox);

        // 创建异步函数
        const wrappedCode = expression.trim().startsWith('return')
          ? expression
          : `return (async () => { ${expression} })()`;

        const fn = new Function(...paramNames, wrappedCode);
        const resultPromise = fn(...paramValues);

        if (resultPromise && typeof resultPromise.then === 'function') {
          resultPromise
            .then((result: T) => {
              clearTimeout(timer);
              resolve(result);
            })
            .catch((error: Error) => {
              clearTimeout(timer);
              reject(error);
            });
        } else {
          clearTimeout(timer);
          resolve(resultPromise);
        }
      } catch (error) {
        clearTimeout(timer);
        reject(
          new Error(
            `异步代码执行错误: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        );
      }
    });
  }
}
