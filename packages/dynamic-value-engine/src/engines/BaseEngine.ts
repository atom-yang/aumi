import {
  ICalculationEngine,
  CalculationResult,
  Context,
  EngineType,
} from '../types';

/**
 * 计算引擎基类
 * 提供通用的功能和错误处理
 */
export abstract class BaseEngine implements ICalculationEngine {
  protected engineType: EngineType;

  constructor(engineType: EngineType) {
    this.engineType = engineType;
  }

  /**
   * 计算表达式
   */
  async calculate<T = any>(
    expression: any,
    context: Context,
    options?: Record<string, any>
  ): Promise<CalculationResult<T>> {
    const startTime = Date.now();

    try {
      // 验证表达式
      if (!this.validate(expression)) {
        return {
          success: false,
          error: `无效的表达式格式：${this.engineType}`,
          executionTime: Date.now() - startTime,
        };
      }

      // 执行具体的计算逻辑
      const value = await this.executeCalculation<T>(
        expression,
        context,
        options
      );

      return {
        success: true,
        value,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '计算过程中发生未知错误',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 执行具体的计算逻辑（由子类实现）
   */
  protected abstract executeCalculation<T = any>(
    expression: any,
    context: Context,
    options?: Record<string, any>
  ): Promise<T>;

  /**
   * 验证表达式格式（由子类实现）
   */
  abstract validate(expression: any): boolean;

  /**
   * 获取引擎类型
   */
  getType(): EngineType {
    return this.engineType;
  }

  /**
   * 安全地访问对象属性
   */
  protected safeGet(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * 深度克隆对象
   */
  protected deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
