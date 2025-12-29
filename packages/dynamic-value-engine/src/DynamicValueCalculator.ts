import {
  CalculationConfig,
  CalculationResult,
  Context,
  EngineType,
  ICalculationEngine,
} from './types';
import { EngineFactory } from './EngineFactory';
import { ContextManager } from './context/ContextManager';

/**
 * 动态值计算器
 * 提供统一的API来使用不同的计算引擎
 */
export class DynamicValueCalculator {
  private engineFactory: EngineFactory;
  private contextManager: ContextManager;

  constructor(globalContext?: Context) {
    this.engineFactory = new EngineFactory();
    this.contextManager = new ContextManager(globalContext);
  }

  /**
   * 计算单个表达式
   */
  async calculate<T = any>(
    config: CalculationConfig
  ): Promise<CalculationResult<T>> {
    try {
      // 获取引擎
      const engine = this.engineFactory.createEngine(config.type);

      // 合并上下文
      const mergedContext = this.contextManager.getMergedContext(
        config.context
      );

      // 执行计算
      return await engine.calculate<T>(
        config.expression,
        mergedContext,
        config.options
      );
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : '计算过程中发生未知错误',
      };
    }
  }

  /**
   * 批量计算多个表达式
   */
  async calculateBatch<T = any>(
    configs: CalculationConfig[]
  ): Promise<CalculationResult<T>[]> {
    const results: CalculationResult<T>[] = [];

    for (const config of configs) {
      const result = await this.calculate<T>(config);
      results.push(result);
    }

    return results;
  }

  /**
   * 并行计算多个表达式
   */
  async calculateParallel<T = any>(
    configs: CalculationConfig[]
  ): Promise<CalculationResult<T>[]> {
    const promises = configs.map((config) => this.calculate<T>(config));
    return await Promise.all(promises);
  }

  /**
   * 使用指定引擎计算
   */
  async calculateWith<T = any>(
    type: EngineType,
    expression: any,
    context?: Context,
    options?: Record<string, any>
  ): Promise<CalculationResult<T>> {
    return this.calculate<T>({
      type,
      expression,
      context,
      options,
    });
  }

  /**
   * JSON Logic 计算快捷方法
   */
  async jsonLogic<T = any>(
    expression: any,
    context?: Context
  ): Promise<CalculationResult<T>> {
    return this.calculateWith<T>(EngineType.JSON_LOGIC, expression, context);
  }

  /**
   * JSON Rule Engine 计算快捷方法
   */
  async jsonRuleEngine<T = any>(
    expression: any,
    context?: Context
  ): Promise<CalculationResult<T>> {
    return this.calculateWith<T>(
      EngineType.JSON_RULE_ENGINE,
      expression,
      context
    );
  }

  /**
   * 源码执行快捷方法
   */
  async sourceCode<T = any>(
    code: string,
    context?: Context,
    options?: Record<string, any>
  ): Promise<CalculationResult<T>> {
    return this.calculateWith<T>(EngineType.SOURCE_CODE, code, context, options);
  }

  /**
   * 模板表达式快捷方法
   */
  async template<T = any>(
    template: string,
    context?: Context,
    options?: Record<string, any>
  ): Promise<CalculationResult<T>> {
    return this.calculateWith<T>(EngineType.TEMPLATE, template, context, options);
  }

  /**
   * 验证表达式
   */
  validate(type: EngineType, expression: any): boolean {
    try {
      const engine = this.engineFactory.createEngine(type);
      return engine.validate(expression);
    } catch {
      return false;
    }
  }

  /**
   * 获取上下文管理器
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }

  /**
   * 获取引擎工厂
   */
  getEngineFactory(): EngineFactory {
    return this.engineFactory;
  }

  /**
   * 获取指定类型的引擎
   */
  getEngine(type: EngineType): ICalculationEngine {
    return this.engineFactory.createEngine(type);
  }

  /**
   * 设置全局上下文
   */
  setGlobalContext(context: Context): void {
    this.contextManager.setGlobalContext(context);
  }

  /**
   * 更新全局上下文
   */
  updateGlobalContext(updates: Context): void {
    this.contextManager.updateGlobalContext(updates);
  }

  /**
   * 获取全局上下文
   */
  getGlobalContext(): Context {
    return this.contextManager.getGlobalContext();
  }

  /**
   * 注册自定义引擎
   */
  registerEngine(type: EngineType, engine: ICalculationEngine): void {
    this.engineFactory.registerEngine(type, engine);
  }

  /**
   * 获取所有可用的引擎类型
   */
  getAvailableEngines(): EngineType[] {
    return this.engineFactory.getAvailableEngines();
  }
}
