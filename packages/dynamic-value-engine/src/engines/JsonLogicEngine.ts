import jsonLogic from 'json-logic-js';
import { BaseEngine } from './BaseEngine';
import { Context, EngineType, JsonLogicExpression } from '../types';

/**
 * JSON Logic 引擎
 * 使用 json-logic-js 库进行逻辑计算
 * 
 * 示例：
 * expression: { "==": [{ "var": "user.age" }, 18] }
 * context: { user: { age: 18 } }
 * result: true
 */
export class JsonLogicEngine extends BaseEngine {
  private customOperators: Map<string, (...args: any[]) => any>;

  constructor() {
    super(EngineType.JSON_LOGIC);
    this.customOperators = new Map();
  }

  /**
   * 执行 JSON Logic 计算
   */
  protected async executeCalculation<T = any>(
    expression: JsonLogicExpression,
    context: Context,
    options?: Record<string, any>
  ): Promise<T> {
    // 注册自定义操作符
    if (options?.customOperators) {
      Object.entries(options.customOperators).forEach(([name, fn]) => {
        this.addCustomOperator(name, fn as (...args: any[]) => any);
      });
    }

    // 应用自定义操作符
    this.customOperators.forEach((fn, name) => {
      jsonLogic.add_operation(name, fn);
    });

    // 执行计算
    const result = jsonLogic.apply(expression, context);

    return result as T;
  }

  /**
   * 验证 JSON Logic 表达式
   */
  validate(expression: any): boolean {
    if (!expression || typeof expression !== 'object') {
      return false;
    }

    try {
      // JSON Logic 表达式应该是一个对象
      // 尝试获取操作符（顶层键）
      const operators = Object.keys(expression);
      return operators.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 添加自定义操作符
   */
  addCustomOperator(name: string, fn: (...args: any[]) => any): void {
    this.customOperators.set(name, fn);
    jsonLogic.add_operation(name, fn);
  }

  /**
   * 移除自定义操作符
   */
  removeCustomOperator(name: string): void {
    this.customOperators.delete(name);
    jsonLogic.rm_operation(name);
  }

  /**
   * 获取所有自定义操作符
   */
  getCustomOperators(): string[] {
    return Array.from(this.customOperators.keys());
  }
}
