/**
 * JSON Rule Engine 引擎适配器
 * @see https://github.com/CacheControl/json-rules-engine
 */

import type {
  IEngine,
  DynamicContext,
  JsonRuleEngineConfig,
  JsonRuleEngineResult,
  CustomFact,
} from '../types';

// JSON Rules Engine 类型定义
interface RuleEngineLib {
  Engine: new (rules?: unknown[], options?: Record<string, unknown>) => EngineInstance;
}

interface EngineInstance {
  addRule: (rule: unknown) => void;
  addFact: (
    name: string,
    fn: (params: unknown, almanac: unknown) => unknown | Promise<unknown>,
    options?: Record<string, unknown>,
  ) => void;
  run: (facts: Record<string, unknown>) => Promise<EngineRunResult>;
}

interface EngineRunResult {
  events: Array<{
    type: string;
    params?: Record<string, unknown>;
  }>;
  almanac: {
    factValue: (name: string) => Promise<unknown>;
  };
  results: Array<{
    name?: string;
    conditions: unknown;
    event: {
      type: string;
      params?: Record<string, unknown>;
    };
    result: boolean;
  }>;
}

/**
 * JSON Rule Engine 引擎
 */
export class JsonRuleEngineAdapter
  implements IEngine<JsonRuleEngineConfig, JsonRuleEngineResult>
{
  readonly type = 'json-rule-engine' as const;
  readonly name = 'JSON Rule Engine';

  private engineLib: RuleEngineLib | null = null;
  private customFacts: CustomFact[] = [];
  private initialized = false;

  constructor(customFacts?: CustomFact[]) {
    if (customFacts) {
      this.customFacts = customFacts;
    }
  }

  /**
   * 延迟加载 json-rules-engine
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 动态导入 json-rules-engine
      const module = await import('json-rules-engine');
      this.engineLib = module as unknown as RuleEngineLib;
      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize JSON Rule Engine: ${(error as Error).message}. ` +
        'Please ensure json-rules-engine is installed: npm install json-rules-engine',
      );
    }
  }

  /**
   * 添加自定义 Fact
   */
  addFact(fact: CustomFact): void {
    this.customFacts.push(fact);
  }

  /**
   * 执行规则引擎
   */
  async execute(
    config: JsonRuleEngineConfig,
    context: DynamicContext,
  ): Promise<JsonRuleEngineResult> {
    await this.ensureInitialized();

    if (!this.engineLib) {
      throw new Error('JSON Rule Engine not initialized');
    }

    const { rules, stopOnFirstMatch = false } = config;

    // 创建引擎实例
    const engine = new this.engineLib.Engine([], {
      allowUndefinedFacts: true,
    });

    // 添加规则
    for (const rule of rules) {
      engine.addRule(this.convertRule(rule));
    }

    // 注册自定义 Facts
    this.registerCustomFacts(engine, context);

    // 注册上下文数据作为 Facts
    this.registerContextFacts(engine, context);

    try {
      // 准备 facts 数据
      const facts = this.prepareFacts(context);

      // 运行引擎
      const result = await engine.run(facts);

      // 如果只需要第一个匹配
      if (stopOnFirstMatch && result.events.length > 0) {
        return {
          matched: true,
          events: [result.events[0]],
          matchedRules: result.results
            .filter((r) => r.result && r.name)
            .slice(0, 1)
            .map((r) => r.name!),
        };
      }

      return {
        matched: result.events.length > 0,
        events: result.events,
        matchedRules: result.results
          .filter((r) => r.result && r.name)
          .map((r) => r.name!),
      };
    } catch (error) {
      throw new Error(`JSON Rule Engine execution error: ${(error as Error).message}`);
    }
  }

  /**
   * 转换规则格式
   */
  private convertRule(rule: JsonRuleEngineConfig['rules'][0]): Record<string, unknown> {
    return {
      name: rule.name,
      priority: rule.priority ?? 1,
      conditions: rule.conditions,
      event: rule.event,
    };
  }

  /**
   * 注册自定义 Facts
   */
  private registerCustomFacts(engine: EngineInstance, context: DynamicContext): void {
    for (const fact of this.customFacts) {
      engine.addFact(
        fact.name,
        async (params: unknown) => {
          return fact.fn(params, context);
        },
        fact.options,
      );
    }
  }

  /**
   * 将上下文数据注册为 Facts
   */
  private registerContextFacts(engine: EngineInstance, context: DynamicContext): void {
    // 注册一个通用的上下文访问 Fact
    engine.addFact('$context', async (params: unknown) => {
      if (typeof params === 'string') {
        return this.getValueByPath(context, params);
      }
      return context;
    });

    // 注册数据访问 Fact
    engine.addFact('$data', async (params: unknown) => {
      if (typeof params === 'string') {
        return this.getValueByPath(context.data, params);
      }
      return context.data;
    });

    // 注册变量访问 Fact
    engine.addFact('$vars', async (params: unknown) => {
      if (typeof params === 'string') {
        return this.getValueByPath(context.vars || {}, params);
      }
      return context.vars;
    });

    // 注册用户信息访问 Fact
    engine.addFact('$user', async (params: unknown) => {
      if (typeof params === 'string') {
        return this.getValueByPath(context.user || {}, params);
      }
      return context.user;
    });
  }

  /**
   * 准备 Facts 数据
   */
  private prepareFacts(context: DynamicContext): Record<string, unknown> {
    return {
      ...context.data,
      _context: context,
      _vars: context.vars,
      _env: context.env,
      _user: context.user,
      _meta: context.meta,
    };
  }

  /**
   * 通过路径获取值
   */
  private getValueByPath(obj: Record<string, unknown>, path: string): unknown {
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
   * 验证配置
   */
  validate(config: JsonRuleEngineConfig): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }
    if (!Array.isArray(config.rules)) {
      return false;
    }
    for (const rule of config.rules) {
      if (!rule.conditions || !rule.event) {
        return false;
      }
    }
    return true;
  }
}

/**
 * 创建 JSON Rule Engine 的工厂函数
 */
export function createJsonRuleEngine(customFacts?: CustomFact[]): JsonRuleEngineAdapter {
  return new JsonRuleEngineAdapter(customFacts);
}

/**
 * 内置的常用 Facts
 */
export const builtInFacts: CustomFact[] = [
  // 当前时间戳
  {
    name: 'currentTime',
    fn: () => Date.now(),
    options: { cache: false },
  },
  // 当前日期（YYYY-MM-DD）
  {
    name: 'currentDate',
    fn: () => new Date().toISOString().split('T')[0],
    options: { cache: false },
  },
  // 当前小时
  {
    name: 'currentHour',
    fn: () => new Date().getHours(),
    options: { cache: false },
  },
  // 当前是否为工作日
  {
    name: 'isWeekday',
    fn: () => {
      const day = new Date().getDay();
      return day !== 0 && day !== 6;
    },
    options: { cache: false },
  },
  // 数组长度
  {
    name: 'arrayLength',
    fn: (params: unknown) => {
      if (Array.isArray(params)) {
        return params.length;
      }
      return 0;
    },
  },
  // 字符串长度
  {
    name: 'stringLength',
    fn: (params: unknown) => {
      if (typeof params === 'string') {
        return params.length;
      }
      return 0;
    },
  },
  // 检查是否为空
  {
    name: 'isEmpty',
    fn: (params: unknown) => {
      if (params === null || params === undefined) {
        return true;
      }
      if (typeof params === 'string') {
        return params.trim().length === 0;
      }
      if (Array.isArray(params)) {
        return params.length === 0;
      }
      if (typeof params === 'object') {
        return Object.keys(params).length === 0;
      }
      return false;
    },
  },
];
