/**
 * 动态值计算模块 - 类型定义
 */

/**
 * 支持的计算引擎类型
 */
export type EngineType = 'json-logic' | 'json-rule-engine' | 'template' | 'script';

/**
 * 统一上下文类型 - 所有引擎共享的数据上下文
 */
export interface DynamicContext {
  /** 数据对象，用于存放业务数据 */
  data: Record<string, unknown>;
  /** 变量对象，用于存放临时变量 */
  vars?: Record<string, unknown>;
  /** 环境变量 */
  env?: Record<string, string>;
  /** 用户信息 */
  user?: Record<string, unknown>;
  /** 元数据 */
  meta?: Record<string, unknown>;
  /** 自定义扩展字段 */
  [key: string]: unknown;
}

/**
 * 计算引擎的基础接口
 */
export interface IEngine<TConfig = unknown, TResult = unknown> {
  /** 引擎类型 */
  readonly type: EngineType;
  /** 引擎名称 */
  readonly name: string;
  /**
   * 执行计算
   * @param config 计算配置
   * @param context 上下文
   */
  execute(config: TConfig, context: DynamicContext): Promise<TResult>;
  /**
   * 校验配置是否有效
   * @param config 计算配置
   */
  validate?(config: TConfig): boolean | Promise<boolean>;
}

/**
 * JSON Logic 配置类型
 * @see https://jsonlogic.com/
 */
export type JsonLogicRule = Record<string, unknown>;

/**
 * JSON Logic 引擎配置
 */
export interface JsonLogicConfig {
  /** JSON Logic 规则 */
  rule: JsonLogicRule;
}

/**
 * JSON Rule Engine 规则定义
 * @see https://github.com/CacheControl/json-rules-engine
 */
export interface JsonRuleEngineCondition {
  fact: string;
  operator: string;
  value: unknown;
  path?: string;
}

export interface JsonRuleEngineRule {
  conditions: {
    all?: JsonRuleEngineCondition[];
    any?: JsonRuleEngineCondition[];
  };
  event: {
    type: string;
    params?: Record<string, unknown>;
  };
  priority?: number;
  name?: string;
}

/**
 * JSON Rule Engine 引擎配置
 */
export interface JsonRuleEngineConfig {
  /** 规则数组 */
  rules: JsonRuleEngineRule[];
  /** 是否在第一个匹配后停止 */
  stopOnFirstMatch?: boolean;
}

/**
 * JSON Rule Engine 执行结果
 */
export interface JsonRuleEngineResult {
  /** 是否有匹配的规则 */
  matched: boolean;
  /** 触发的事件列表 */
  events: Array<{
    type: string;
    params?: Record<string, unknown>;
  }>;
  /** 匹配的规则名称 */
  matchedRules: string[];
}

/**
 * 模板表达式引擎配置
 * 支持 {{expression}} 语法
 */
export interface TemplateConfig {
  /** 模板字符串 */
  template: string;
  /** 是否启用安全模式（禁用危险表达式） */
  safeMode?: boolean;
  /** 自定义函数 */
  helpers?: Record<string, (...args: unknown[]) => unknown>;
}

/**
 * 脚本引擎配置
 */
export interface ScriptConfig {
  /** 脚本代码 */
  code: string;
  /** 是否异步执行 */
  async?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 允许访问的全局变量 */
  allowedGlobals?: string[];
}

/**
 * 动态值定义 - 统一的配置格式
 */
export interface DynamicValueDefinition<T extends EngineType = EngineType> {
  /** 引擎类型 */
  engine: T;
  /** 引擎配置 */
  config: T extends 'json-logic'
    ? JsonLogicConfig
    : T extends 'json-rule-engine'
      ? JsonRuleEngineConfig
      : T extends 'template'
        ? TemplateConfig
        : T extends 'script'
          ? ScriptConfig
          : never;
  /** 默认值（计算失败时使用） */
  defaultValue?: unknown;
  /** 缓存配置 */
  cache?: {
    /** 是否启用缓存 */
    enabled: boolean;
    /** 缓存时间（毫秒） */
    ttl?: number;
    /** 缓存键 */
    key?: string;
  };
  /** 描述信息 */
  description?: string;
}

/**
 * 计算结果
 */
export interface ComputeResult<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 计算结果 */
  value?: T;
  /** 错误信息 */
  error?: Error;
  /** 执行时间（毫秒） */
  duration?: number;
  /** 是否来自缓存 */
  fromCache?: boolean;
}

/**
 * 引擎注册表类型
 */
export type EngineRegistry = Map<EngineType, IEngine>;

/**
 * 自定义操作符定义（用于 JSON Logic）
 */
export interface CustomOperator {
  name: string;
  fn: (a: unknown, b?: unknown) => unknown;
}

/**
 * 自定义 Fact 定义（用于 JSON Rule Engine）
 */
export interface CustomFact {
  name: string;
  fn: (params: unknown, context: DynamicContext) => unknown | Promise<unknown>;
  options?: {
    cache?: boolean;
    priority?: number;
  };
}

/**
 * DynamicValue 配置选项
 */
export interface DynamicValueOptions {
  /** 默认上下文 */
  defaultContext?: Partial<DynamicContext>;
  /** 自定义操作符（用于 JSON Logic） */
  customOperators?: CustomOperator[];
  /** 自定义 Facts（用于 JSON Rule Engine） */
  customFacts?: CustomFact[];
  /** 模板助手函数 */
  templateHelpers?: Record<string, (...args: unknown[]) => unknown>;
  /** 脚本沙箱配置 */
  scriptSandbox?: {
    timeout?: number;
    allowedGlobals?: string[];
  };
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 日志函数 */
  logger?: {
    debug?: (...args: unknown[]) => void;
    info?: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  };
}
