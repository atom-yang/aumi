import { Engine, Rule } from 'json-rules-engine';
import { BaseEngine } from './BaseEngine';
import { Context, EngineType, JsonRuleEngineRule } from '../types';

/**
 * JSON Rule Engine 引擎
 * 使用 json-rules-engine 库进行规则计算
 * 
 * 示例：
 * expression: {
 *   conditions: {
 *     all: [{ fact: 'age', operator: 'greaterThanInclusive', value: 18 }]
 *   },
 *   event: { type: 'adult' }
 * }
 * context: { age: 20 }
 * result: { type: 'adult', params: undefined }
 */
export class JsonRuleEngine extends BaseEngine {
  constructor() {
    super(EngineType.JSON_RULE_ENGINE);
  }

  /**
   * 执行 JSON Rule Engine 计算
   */
  protected async executeCalculation<T = any>(
    expression: JsonRuleEngineRule | JsonRuleEngineRule[],
    context: Context,
    options?: Record<string, any>
  ): Promise<T> {
    const engine = new Engine();

    // 支持单个规则或规则数组
    const rules = Array.isArray(expression) ? expression : [expression];

    // 添加规则
    rules.forEach((ruleDefinition) => {
      const rule = new Rule(ruleDefinition);
      engine.addRule(rule);
    });

    // 添加自定义操作符
    if (options?.customOperators) {
      Object.entries(options.customOperators).forEach(([name, fn]) => {
        engine.addOperator(name, fn as any);
      });
    }

    // 注册 facts
    Object.entries(context).forEach(([key, value]) => {
      engine.addFact(key, value);
    });

    // 运行引擎
    const results = await engine.run();

    // 返回触发的事件
    const events = results.events.map((event) => ({
      type: event.type,
      params: event.params,
    }));

    // 如果只有一个规则，返回单个事件；否则返回事件数组
    return (rules.length === 1 ? events[0] : events) as T;
  }

  /**
   * 验证 JSON Rule Engine 规则
   */
  validate(expression: any): boolean {
    if (!expression) {
      return false;
    }

    try {
      // 支持单个规则或规则数组
      const rules = Array.isArray(expression) ? expression : [expression];

      // 验证每个规则的基本结构
      return rules.every((rule) => {
        if (!rule || typeof rule !== 'object') {
          return false;
        }

        // 必须有 conditions 和 event
        if (!rule.conditions || !rule.event) {
          return false;
        }

        // conditions 必须包含 all 或 any
        if (!rule.conditions.all && !rule.conditions.any) {
          return false;
        }

        // event 必须有 type
        if (!rule.event.type) {
          return false;
        }

        return true;
      });
    } catch {
      return false;
    }
  }

  /**
   * 创建规则引擎实例（用于更复杂的场景）
   */
  createEngine(): Engine {
    return new Engine();
  }
}
