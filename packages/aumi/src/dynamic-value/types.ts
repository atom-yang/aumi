export type JsonObject = Record<string, unknown>;

/**
 * 统一上下文：所有计算引擎只从这里取值。
 * 约定为可序列化的普通对象（但不强制）。
 */
export type DynamicValueContext = JsonObject;

export type DynamicValueKind =
  | 'json-logic'
  | 'json-rules-engine'
  | 'source'
  | 'template';

export interface BaseDescriptor {
  kind: DynamicValueKind;
}

/**
 * json-logic 描述：直接传入 json-logic 规则对象
 * 参考：json-logic-js 的 apply(logic, data)
 */
export interface JsonLogicDescriptor extends BaseDescriptor {
  kind: 'json-logic';
  logic: unknown;
}

/**
 * json-rules-engine 描述：
 * - rules: 规则数组（json-rules-engine 的规则 JSON）
 * - facts: 将 context 映射为引擎可用的 fact 名称
 *   - string：表示从 context 中按 path 取值
 *   - function：自定义计算 fact（仍只接收 context）
 * - return: 返回值形态
 */
export interface JsonRulesEngineDescriptor extends BaseDescriptor {
  kind: 'json-rules-engine';
  rules: unknown[];
  facts?: Record<
    string,
    string | ((ctx: DynamicValueContext) => unknown | Promise<unknown>)
  >;
  return?: 'events' | 'success';
}

/**
 * 源码计算描述：
 * - expression: 作为 JS 表达式求值（返回表达式的值）
 * - function: 作为函数源码求值并调用 (ctx) => any
 *
 * 默认不暴露 require/process 等危险对象。
 */
export interface SourceDescriptor extends BaseDescriptor {
  kind: 'source';
  code: string;
  mode?: 'expression' | 'function';
}

/**
 * {{}} 模板描述：
 * - {{a.b.c}}：按路径取值并转字符串
 * - {{= 1 + ctx.a }}：走 source 引擎计算（可选）
 */
export interface TemplateDescriptor extends BaseDescriptor {
  kind: 'template';
  template: string;
  /**
   * 是否允许 {{= ...}} 形式的表达式（默认 false）
   */
  allowExpression?: boolean;
}

export type DynamicValueDescriptor =
  | JsonLogicDescriptor
  | JsonRulesEngineDescriptor
  | SourceDescriptor
  | TemplateDescriptor;

export interface EvaluateOptions {
  /**
   * source 引擎的超时（仅 Node.js vm 生效）
   */
  timeoutMs?: number;
}

export interface DynamicValueEngine<TDescriptor extends DynamicValueDescriptor> {
  readonly kind: TDescriptor['kind'];
  evaluate(
    descriptor: TDescriptor,
    ctx: DynamicValueContext,
    options?: EvaluateOptions,
  ): unknown | Promise<unknown>;
}

