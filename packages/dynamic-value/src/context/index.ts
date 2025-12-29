/**
 * 动态值计算模块 - 上下文管理器
 */

import type { DynamicContext } from '../types';

/**
 * 创建默认上下文
 */
export function createDefaultContext(): DynamicContext {
  return {
    data: {},
    vars: {},
    env: {},
    user: {},
    meta: {},
  };
}

/**
 * 合并上下文
 * @param base 基础上下文
 * @param override 覆盖的上下文
 * @returns 合并后的上下文
 */
export function mergeContext(
  base: DynamicContext,
  override: Partial<DynamicContext>,
): DynamicContext {
  return {
    ...base,
    ...override,
    data: { ...base.data, ...override.data },
    vars: { ...base.vars, ...override.vars },
    env: { ...base.env, ...override.env },
    user: { ...base.user, ...override.user },
    meta: { ...base.meta, ...override.meta },
  };
}

/**
 * 上下文管理器类
 * 提供上下文的创建、管理和变量访问功能
 */
export class ContextManager {
  private context: DynamicContext;
  private readonly defaultContext: DynamicContext;

  constructor(initialContext?: Partial<DynamicContext>) {
    this.defaultContext = createDefaultContext();
    this.context = mergeContext(this.defaultContext, initialContext || {});
  }

  /**
   * 获取当前上下文
   */
  getContext(): DynamicContext {
    return { ...this.context };
  }

  /**
   * 设置上下文
   */
  setContext(context: Partial<DynamicContext>): void {
    this.context = mergeContext(this.context, context);
  }

  /**
   * 重置上下文到默认值
   */
  reset(): void {
    this.context = { ...this.defaultContext };
  }

  /**
   * 设置数据
   */
  setData(key: string, value: unknown): void {
    this.context.data[key] = value;
  }

  /**
   * 获取数据
   */
  getData(key: string): unknown {
    return this.context.data[key];
  }

  /**
   * 批量设置数据
   */
  setDataBatch(data: Record<string, unknown>): void {
    this.context.data = { ...this.context.data, ...data };
  }

  /**
   * 设置变量
   */
  setVar(key: string, value: unknown): void {
    if (!this.context.vars) {
      this.context.vars = {};
    }
    this.context.vars[key] = value;
  }

  /**
   * 获取变量
   */
  getVar(key: string): unknown {
    return this.context.vars?.[key];
  }

  /**
   * 通过路径获取值
   * 支持点号分隔的路径，如 "data.user.name"
   */
  getByPath(path: string): unknown {
    const parts = path.split('.');
    let current: unknown = this.context;

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
   * 支持点号分隔的路径，如 "data.user.name"
   */
  setByPath(path: string, value: unknown): void {
    const parts = path.split('.');
    const lastPart = parts.pop();

    if (!lastPart) {
      return;
    }

    let current: Record<string, unknown> = this.context as Record<string, unknown>;

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
   * 创建子上下文（用于隔离作用域）
   */
  createChildContext(overrides?: Partial<DynamicContext>): DynamicContext {
    return mergeContext(this.context, overrides || {});
  }

  /**
   * 将上下文扁平化为单层对象（用于模板引擎）
   */
  flatten(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    const flattenObject = (obj: Record<string, unknown>, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenObject(value as Record<string, unknown>, newKey);
        } else {
          result[newKey] = value;
        }
      }
    };

    flattenObject(this.context as Record<string, unknown>);
    return result;
  }

  /**
   * 克隆上下文管理器
   */
  clone(): ContextManager {
    const cloned = new ContextManager();
    cloned.context = JSON.parse(JSON.stringify(this.context));
    return cloned;
  }
}

/**
 * 创建上下文管理器的工厂函数
 */
export function createContextManager(
  initialContext?: Partial<DynamicContext>,
): ContextManager {
  return new ContextManager(initialContext);
}
