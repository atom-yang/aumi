/**
 * 引擎类型枚举
 */
export enum EngineType {
  /** JSON Logic 引擎 */
  JSON_LOGIC = 'json-logic',
  /** JSON Rule Engine 引擎 */
  JSON_RULE_ENGINE = 'json-rule-engine',
  /** 源码执行引擎 */
  SOURCE_CODE = 'source-code',
  /** 模板表达式引擎 */
  TEMPLATE = 'template',
}

/**
 * 上下文数据类型
 */
export type Context = Record<string, any>;

/**
 * 计算配置
 */
export interface CalculationConfig {
  /** 引擎类型 */
  type: EngineType;
  /** 表达式或规则 */
  expression: any;
  /** 上下文数据 */
  context?: Context;
  /** 引擎特定选项 */
  options?: Record<string, any>;
}

/**
 * 计算结果
 */
export interface CalculationResult<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 计算结果 */
  value?: T;
  /** 错误信息 */
  error?: string;
  /** 执行时间（毫秒） */
  executionTime?: number;
}

/**
 * 计算引擎接口
 */
export interface ICalculationEngine {
  /**
   * 计算表达式
   * @param expression 表达式或规则
   * @param context 上下文数据
   * @param options 引擎选项
   */
  calculate<T = any>(
    expression: any,
    context: Context,
    options?: Record<string, any>
  ): Promise<CalculationResult<T>>;

  /**
   * 验证表达式格式
   * @param expression 表达式或规则
   */
  validate(expression: any): boolean;

  /**
   * 获取引擎类型
   */
  getType(): EngineType;
}

/**
 * 引擎工厂接口
 */
export interface IEngineFactory {
  /**
   * 创建引擎实例
   * @param type 引擎类型
   */
  createEngine(type: EngineType): ICalculationEngine;

  /**
   * 注册自定义引擎
   * @param type 引擎类型
   * @param engine 引擎实例
   */
  registerEngine(type: EngineType, engine: ICalculationEngine): void;
}

/**
 * JSON Logic 表达式类型
 */
export type JsonLogicExpression = Record<string, any>;

/**
 * JSON Rule Engine 规则类型
 */
export interface JsonRuleEngineRule {
  conditions: {
    all?: Array<Record<string, any>>;
    any?: Array<Record<string, any>>;
  };
  event: {
    type: string;
    params?: Record<string, any>;
  };
  priority?: number;
}

/**
 * 模板表达式选项
 */
export interface TemplateOptions {
  /** 开始定界符，默认 '{{' */
  startDelimiter?: string;
  /** 结束定界符，默认 '}}' */
  endDelimiter?: string;
  /** 是否允许执行函数，默认 false */
  allowFunctions?: boolean;
}

/**
 * 源码执行选项
 */
export interface SourceCodeOptions {
  /** 超时时间（毫秒），默认 5000 */
  timeout?: number;
  /** 允许的全局变量白名单 */
  allowedGlobals?: string[];
}
