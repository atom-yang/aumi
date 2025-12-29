/**
 * @aumi/dynamic-value-engine
 * 动态值计算引擎 - 支持多种计算方式的统一接口
 */

// 主要类导出
export { DynamicValueCalculator } from './DynamicValueCalculator';
export { EngineFactory } from './EngineFactory';
export { ContextManager } from './context/ContextManager';

// 引擎导出
export { BaseEngine } from './engines/BaseEngine';
export { JsonLogicEngine } from './engines/JsonLogicEngine';
export { JsonRuleEngine } from './engines/JsonRuleEngine';
export { SourceCodeEngine } from './engines/SourceCodeEngine';
export { TemplateEngine } from './engines/TemplateEngine';

// 类型导出
export {
  EngineType,
  Context,
  CalculationConfig,
  CalculationResult,
  ICalculationEngine,
  IEngineFactory,
  JsonLogicExpression,
  JsonRuleEngineRule,
  TemplateOptions,
  SourceCodeOptions,
  JsonLogicOptions,
} from './types';

// 默认导出
export { DynamicValueCalculator as default } from './DynamicValueCalculator';

// 便捷工厂函数
import { DynamicValueCalculator } from './DynamicValueCalculator';
import { Context } from './types';

/**
 * 创建计算器实例
 * @param globalContext 全局上下文
 */
export function createCalculator(globalContext?: Context): DynamicValueCalculator {
  return new DynamicValueCalculator(globalContext);
}
