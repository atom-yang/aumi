/**
 * @aumi/dynamic-value
 * 动态值计算模块
 *
 * 支持多种计算引擎：
 * - json-logic: JSON Logic 规则引擎
 * - json-rule-engine: JSON Rules Engine 规则引擎
 * - template: {{}} 模板表达式
 * - script: JavaScript 脚本执行
 */

// 导出主类
export {
  DynamicValue,
  createDynamicValue,
  getDefaultDynamicValue,
  resetDefaultDynamicValue,
} from './DynamicValue';

// 导出类型
export type {
  EngineType,
  DynamicContext,
  IEngine,
  JsonLogicRule,
  JsonLogicConfig,
  JsonRuleEngineCondition,
  JsonRuleEngineRule,
  JsonRuleEngineConfig,
  JsonRuleEngineResult,
  TemplateConfig,
  ScriptConfig,
  DynamicValueDefinition,
  ComputeResult,
  EngineRegistry,
  CustomOperator,
  CustomFact,
  DynamicValueOptions,
} from './types';

// 导出上下文管理
export {
  ContextManager,
  createContextManager,
  createDefaultContext,
  mergeContext,
} from './context';

// 导出引擎
export {
  // JSON Logic
  JsonLogicEngine,
  createJsonLogicEngine,
  builtInOperators,
  // JSON Rule Engine
  JsonRuleEngineAdapter,
  createJsonRuleEngine,
  builtInFacts,
  // Template
  TemplateEngine,
  createTemplateEngine,
  // Script
  ScriptEngine,
  createScriptEngine,
  scriptTemplates,
} from './engines';

// 导出工具
export {
  LRUCache,
  generateCacheKey,
  hashString,
  deepClone,
  debounce,
  throttle,
  retry,
  typeCheck,
} from './utils';
