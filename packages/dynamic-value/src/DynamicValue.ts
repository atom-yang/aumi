/**
 * DynamicValue - 动态值计算模块主类
 * 提供统一的接口来使用各种计算引擎
 */

import type {
  EngineType,
  DynamicContext,
  DynamicValueDefinition,
  DynamicValueOptions,
  ComputeResult,
  IEngine,
  JsonLogicConfig,
  JsonRuleEngineConfig,
  JsonRuleEngineResult,
  TemplateConfig,
  ScriptConfig,
} from './types';
import {
  JsonLogicEngine,
  JsonRuleEngineAdapter,
  TemplateEngine,
  ScriptEngine,
  builtInOperators,
  builtInFacts,
} from './engines';
import { ContextManager, createDefaultContext, mergeContext } from './context';
import { LRUCache, generateCacheKey } from './utils';

/**
 * DynamicValue 主类
 * 统一管理各种计算引擎，提供一致的 API
 */
export class DynamicValue {
  private readonly engines: Map<EngineType, IEngine> = new Map();
  private readonly contextManager: ContextManager;
  private readonly cache: LRUCache<string, unknown>;
  private readonly options: DynamicValueOptions;

  constructor(options: DynamicValueOptions = {}) {
    this.options = options;
    this.cache = new LRUCache(100);

    // 初始化上下文管理器
    this.contextManager = new ContextManager(options.defaultContext);

    // 初始化各个引擎
    this.initializeEngines();
  }

  /**
   * 初始化所有引擎
   */
  private initializeEngines(): void {
    // JSON Logic 引擎
    const jsonLogicEngine = new JsonLogicEngine([
      ...builtInOperators,
      ...(this.options.customOperators || []),
    ]);
    this.engines.set('json-logic', jsonLogicEngine);

    // JSON Rule Engine
    const jsonRuleEngine = new JsonRuleEngineAdapter([
      ...builtInFacts,
      ...(this.options.customFacts || []),
    ]);
    this.engines.set('json-rule-engine', jsonRuleEngine);

    // 模板引擎
    const templateEngine = new TemplateEngine(this.options.templateHelpers);
    this.engines.set('template', templateEngine);

    // 脚本引擎
    const scriptEngine = new ScriptEngine(this.options.scriptSandbox);
    this.engines.set('script', scriptEngine);
  }

  /**
   * 获取指定类型的引擎
   */
  getEngine<T extends EngineType>(type: T): IEngine {
    const engine = this.engines.get(type);
    if (!engine) {
      throw new Error(`Engine "${type}" not found`);
    }
    return engine;
  }

  /**
   * 注册自定义引擎
   */
  registerEngine(type: EngineType, engine: IEngine): void {
    this.engines.set(type, engine);
  }

  /**
   * 获取上下文管理器
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }

  /**
   * 获取当前上下文
   */
  getContext(): DynamicContext {
    return this.contextManager.getContext();
  }

  /**
   * 设置上下文
   */
  setContext(context: Partial<DynamicContext>): void {
    this.contextManager.setContext(context);
  }

  /**
   * 计算动态值
   * @param definition 动态值定义
   * @param contextOverride 上下文覆盖（可选）
   */
  async compute<T = unknown>(
    definition: DynamicValueDefinition,
    contextOverride?: Partial<DynamicContext>,
  ): Promise<ComputeResult<T>> {
    const startTime = Date.now();

    try {
      // 获取引擎
      const engine = this.getEngine(definition.engine);

      // 合并上下文
      const context = contextOverride
        ? mergeContext(this.contextManager.getContext(), contextOverride)
        : this.contextManager.getContext();

      // 检查缓存
      if (definition.cache?.enabled) {
        const cacheKey = definition.cache.key ||
          generateCacheKey(definition.engine, definition.config, context);
        const cachedValue = this.cache.get(cacheKey);

        if (cachedValue !== undefined) {
          return {
            success: true,
            value: cachedValue as T,
            duration: Date.now() - startTime,
            fromCache: true,
          };
        }
      }

      // 执行计算
      const value = await engine.execute(definition.config, context);

      // 存入缓存
      if (definition.cache?.enabled) {
        const cacheKey = definition.cache.key ||
          generateCacheKey(definition.engine, definition.config, context);
        this.cache.set(cacheKey, value, definition.cache.ttl);
      }

      this.log('debug', `Computed value using ${definition.engine}:`, value);

      return {
        success: true,
        value: value as T,
        duration: Date.now() - startTime,
        fromCache: false,
      };
    } catch (error) {
      this.log('error', `Compute error:`, error);

      return {
        success: false,
        error: error as Error,
        value: definition.defaultValue as T,
        duration: Date.now() - startTime,
        fromCache: false,
      };
    }
  }

  /**
   * 使用 JSON Logic 计算
   */
  async computeJsonLogic<T = unknown>(
    rule: JsonLogicConfig['rule'],
    contextOverride?: Partial<DynamicContext>,
  ): Promise<ComputeResult<T>> {
    return this.compute<T>(
      {
        engine: 'json-logic',
        config: { rule },
      },
      contextOverride,
    );
  }

  /**
   * 使用 JSON Rule Engine 计算
   */
  async computeRules(
    rules: JsonRuleEngineConfig['rules'],
    contextOverride?: Partial<DynamicContext>,
    options?: { stopOnFirstMatch?: boolean },
  ): Promise<ComputeResult<JsonRuleEngineResult>> {
    return this.compute<JsonRuleEngineResult>(
      {
        engine: 'json-rule-engine',
        config: { rules, stopOnFirstMatch: options?.stopOnFirstMatch },
      },
      contextOverride,
    );
  }

  /**
   * 使用模板表达式计算
   */
  async computeTemplate(
    template: string,
    contextOverride?: Partial<DynamicContext>,
    options?: { safeMode?: boolean },
  ): Promise<ComputeResult<string>> {
    return this.compute<string>(
      {
        engine: 'template',
        config: { template, safeMode: options?.safeMode },
      },
      contextOverride,
    );
  }

  /**
   * 使用脚本计算
   */
  async computeScript<T = unknown>(
    code: string,
    contextOverride?: Partial<DynamicContext>,
    options?: { async?: boolean; timeout?: number },
  ): Promise<ComputeResult<T>> {
    return this.compute<T>(
      {
        engine: 'script',
        config: {
          code,
          async: options?.async,
          timeout: options?.timeout,
        },
      },
      contextOverride,
    );
  }

  /**
   * 批量计算
   */
  async computeBatch<T = unknown>(
    definitions: DynamicValueDefinition[],
    contextOverride?: Partial<DynamicContext>,
  ): Promise<ComputeResult<T>[]> {
    const promises = definitions.map(def => this.compute<T>(def, contextOverride));
    return Promise.all(promises);
  }

  /**
   * 验证定义是否有效
   */
  async validate(definition: DynamicValueDefinition): Promise<boolean> {
    try {
      const engine = this.getEngine(definition.engine);
      if (engine.validate) {
        return await engine.validate(definition.config);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 日志输出
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    ...args: unknown[]
  ): void {
    if (!this.options.debug && level === 'debug') {
      return;
    }

    const logger = this.options.logger;
    if (logger && logger[level]) {
      logger[level]('[DynamicValue]', ...args);
    } else if (this.options.debug) {
      console[level]('[DynamicValue]', ...args);
    }
  }
}

/**
 * 创建 DynamicValue 实例的工厂函数
 */
export function createDynamicValue(options?: DynamicValueOptions): DynamicValue {
  return new DynamicValue(options);
}

/**
 * 默认的 DynamicValue 实例（单例）
 */
let defaultInstance: DynamicValue | null = null;

/**
 * 获取默认的 DynamicValue 实例
 */
export function getDefaultDynamicValue(): DynamicValue {
  if (!defaultInstance) {
    defaultInstance = new DynamicValue();
  }
  return defaultInstance;
}

/**
 * 重置默认实例
 */
export function resetDefaultDynamicValue(): void {
  defaultInstance = null;
}
