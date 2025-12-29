import { Context } from '../types';

/**
 * 上下文管理器
 * 提供统一的上下文数据管理和访问
 */
export class ContextManager {
  private globalContext: Context;
  private contextStack: Context[];

  constructor(initialContext: Context = {}) {
    this.globalContext = { ...initialContext };
    this.contextStack = [];
  }

  /**
   * 获取合并后的上下文
   * 优先级：局部上下文 > 全局上下文
   */
  getMergedContext(localContext?: Context): Context {
    return {
      ...this.globalContext,
      ...this.getCurrentStackContext(),
      ...localContext,
    };
  }

  /**
   * 设置全局上下文
   */
  setGlobalContext(context: Context): void {
    this.globalContext = { ...context };
  }

  /**
   * 更新全局上下文
   */
  updateGlobalContext(updates: Context): void {
    this.globalContext = {
      ...this.globalContext,
      ...updates,
    };
  }

  /**
   * 获取全局上下文
   */
  getGlobalContext(): Context {
    return { ...this.globalContext };
  }

  /**
   * 推入新的上下文层级
   */
  pushContext(context: Context): void {
    this.contextStack.push(context);
  }

  /**
   * 弹出当前上下文层级
   */
  popContext(): Context | undefined {
    return this.contextStack.pop();
  }

  /**
   * 获取当前栈中的上下文（所有层级合并）
   */
  private getCurrentStackContext(): Context {
    return this.contextStack.reduce((acc, ctx) => ({ ...acc, ...ctx }), {});
  }

  /**
   * 清空所有上下文
   */
  clear(): void {
    this.globalContext = {};
    this.contextStack = [];
  }

  /**
   * 获取指定路径的值
   * 支持点号分隔的路径，如 'user.name'
   */
  getValue(path: string, localContext?: Context): any {
    const context = this.getMergedContext(localContext);
    const keys = path.split('.');
    let value: any = context;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }

    return value;
  }

  /**
   * 设置指定路径的值
   * 支持点号分隔的路径，如 'user.name'
   */
  setValue(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current: any = this.globalContext;

    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * 检查路径是否存在
   */
  hasPath(path: string, localContext?: Context): boolean {
    const value = this.getValue(path, localContext);
    return value !== undefined;
  }
}
