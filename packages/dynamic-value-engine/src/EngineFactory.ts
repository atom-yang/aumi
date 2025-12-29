import {
  IEngineFactory,
  ICalculationEngine,
  EngineType,
} from './types';
import { JsonLogicEngine } from './engines/JsonLogicEngine';
import { JsonRuleEngine } from './engines/JsonRuleEngine';
import { SourceCodeEngine } from './engines/SourceCodeEngine';
import { TemplateEngine } from './engines/TemplateEngine';

/**
 * 引擎工厂
 * 负责创建和管理计算引擎实例
 */
export class EngineFactory implements IEngineFactory {
  private engines: Map<EngineType, ICalculationEngine>;
  private customEngines: Map<EngineType, ICalculationEngine>;

  constructor() {
    this.engines = new Map();
    this.customEngines = new Map();
    this.initializeDefaultEngines();
  }

  /**
   * 初始化默认引擎
   */
  private initializeDefaultEngines(): void {
    this.engines.set(EngineType.JSON_LOGIC, new JsonLogicEngine());
    this.engines.set(EngineType.JSON_RULE_ENGINE, new JsonRuleEngine());
    this.engines.set(EngineType.SOURCE_CODE, new SourceCodeEngine());
    this.engines.set(EngineType.TEMPLATE, new TemplateEngine());
  }

  /**
   * 创建引擎实例
   */
  createEngine(type: EngineType): ICalculationEngine {
    // 优先使用自定义引擎
    if (this.customEngines.has(type)) {
      return this.customEngines.get(type)!;
    }

    // 使用默认引擎
    const engine = this.engines.get(type);
    if (!engine) {
      throw new Error(`不支持的引擎类型: ${type}`);
    }

    return engine;
  }

  /**
   * 注册自定义引擎
   */
  registerEngine(type: EngineType, engine: ICalculationEngine): void {
    this.customEngines.set(type, engine);
  }

  /**
   * 注销自定义引擎
   */
  unregisterEngine(type: EngineType): void {
    this.customEngines.delete(type);
  }

  /**
   * 获取所有可用的引擎类型
   */
  getAvailableEngines(): EngineType[] {
    const defaultEngines = Array.from(this.engines.keys());
    const customEngines = Array.from(this.customEngines.keys());
    return [...new Set([...defaultEngines, ...customEngines])];
  }

  /**
   * 检查引擎类型是否可用
   */
  hasEngine(type: EngineType): boolean {
    return this.engines.has(type) || this.customEngines.has(type);
  }

  /**
   * 重置所有自定义引擎
   */
  resetCustomEngines(): void {
    this.customEngines.clear();
  }
}
