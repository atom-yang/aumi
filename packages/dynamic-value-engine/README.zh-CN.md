# @aumi/dynamic-value-engine

一个强大的动态值计算引擎，支持多种计算方式：JSON Logic、JSON Rule Engine、源码执行和模板表达式。提供统一的上下文管理和简洁的 API。

[English](./README.md) | 简体中文

## ✨ 特性

- 🚀 **多引擎支持**：集成 4 种常用的计算引擎
  - JSON Logic：逻辑表达式计算
  - JSON Rule Engine：规则引擎
  - Source Code：源码执行（Function）
  - Template：模板表达式（{{}}）

- 🔧 **统一接口**：所有引擎使用相同的 API 调用方式
- 📦 **上下文管理**：内置上下文管理器，支持全局和局部上下文
- 🔒 **类型安全**：完整的 TypeScript 类型定义
- ⚡ **高性能**：支持并行计算和批量处理
- 🎨 **可扩展**：支持自定义引擎和操作符注册
- 🛡️ **安全可靠**：源码执行使用沙箱环境，支持超时控制

## 📦 安装

```bash
npm install @aumi/dynamic-value-engine
# 或
pnpm add @aumi/dynamic-value-engine
# 或
yarn add @aumi/dynamic-value-engine
```

## 🚀 快速开始

```typescript
import { DynamicValueCalculator, EngineType } from '@aumi/dynamic-value-engine';

// 创建计算器实例
const calculator = new DynamicValueCalculator({
  // 全局上下文
  user: { name: 'John', age: 25 },
});

// 使用 JSON Logic
const result1 = await calculator.calculate({
  type: EngineType.JSON_LOGIC,
  expression: { ">=": [{ "var": "user.age" }, 18] },
});
console.log(result1.value); // true

// 使用模板表达式
const result2 = await calculator.calculate({
  type: EngineType.TEMPLATE,
  expression: "你好 {{user.name}}，你今年 {{user.age}} 岁",
});
console.log(result2.value); // "你好 John，你今年 25 岁"
```

## 📖 支持的引擎

### 1. JSON Logic 引擎

基于 [json-logic-js](https://github.com/jwadhams/json-logic-js) 的逻辑计算引擎。

```typescript
const result = await calculator.jsonLogic(
  {
    "and": [
      { ">=": [{ "var": "age" }, 18] },
      { "<=": [{ "var": "age" }, 65] }
    ]
  },
  { age: 30 }
);
console.log(result.value); // true
```

**支持的操作符**：
- 比较：`==`, `!=`, `>`, `>=`, `<`, `<=`
- 逻辑：`and`, `or`, `not`, `!!`, `if`
- 数据访问：`var`, `missing`, `missing_some`
- 数组：`map`, `filter`, `reduce`, `all`, `none`, `some`, `merge`, `in`
- 字符串：`cat`, `substr`, `in`（字符串包含）
- 算术：`+`, `-`, `*`, `/`, `%`, `max`, `min`

#### JSON Logic 高级选项

JSON Logic 引擎支持丰富的 options 配置：

```typescript
import { JsonLogicOptions } from '@aumi/dynamic-value-engine';

const options: JsonLogicOptions = {
  // 自定义操作符
  customOperators: {
    startsWith: (str: string, prefix: string) => str.startsWith(prefix),
    multiply: (a: number, b: number) => a * b,
  },
  
  // 启用内置扩展（40+ 个实用操作符）
  builtInExtensions: true,
  
  // 严格模式：变量不存在时抛出错误
  strictMode: true,
  
  // 调试模式：输出详细日志
  debug: true,
  
  // 上下文转换
  transformContext: (ctx) => ({
    ...ctx,
    _timestamp: Date.now(),
  }),
  
  // 结果后处理
  postProcess: (result) => {
    return typeof result === 'number' ? result.toFixed(2) : result;
  },
  
  // 自定义变量解析器
  customVarResolver: (path, context, defaultValue) => {
    // 自定义变量访问逻辑
    return context[path] || defaultValue;
  },
  
  // 最大执行深度
  maxDepth: 100,
};

const result = await calculator.jsonLogic(expression, context, options);
```

**内置扩展操作符**（`builtInExtensions: true`）：

- **字符串**：`startsWith`, `endsWith`, `includes`, `toUpperCase`, `toLowerCase`, `trim`, `replace`, `split`, `join`
- **类型检查**：`isEmpty`, `isNotEmpty`, `isNull`, `isNumber`, `isString`, `isArray`, `isObject`
- **数组**：`length`, `first`, `last`, `reverse`, `unique`, `flatten`, `sort`
- **数学**：`abs`, `ceil`, `floor`, `round`, `pow`, `sqrt`, `random`
- **对象**：`keys`, `values`, `entries`, `has`
- **其他**：`regex`, `now`, `dateFormat`, `default`, `coalesce`

📖 查看完整文档：[JSON Logic Options 详细说明](./docs/JSON_LOGIC_OPTIONS.md)

### 2. JSON Rule Engine 引擎

基于 [json-rules-engine](https://github.com/CacheControl/json-rules-engine) 的规则引擎。

```typescript
const result = await calculator.jsonRuleEngine(
  {
    conditions: {
      all: [
        { fact: 'age', operator: 'greaterThanInclusive', value: 18 }
      ]
    },
    event: {
      type: 'adult',
      params: { message: '用户已成年' }
    }
  },
  { age: 25 }
);
console.log(result.value); // { type: 'adult', params: { message: '用户已成年' } }
```

**支持的操作符**：
- `equal` / `notEqual`
- `greaterThan` / `greaterThanInclusive`
- `lessThan` / `lessThanInclusive`
- `in` / `notIn`
- `contains` / `doesNotContain`

### 3. 源码执行引擎

使用 Function 构造函数执行 JavaScript 代码。

```typescript
const result = await calculator.sourceCode(
  "return context.price * context.quantity * (1 - context.discount)",
  { price: 100, quantity: 2, discount: 0.1 },
  { timeout: 5000 }
);
console.log(result.value); // 180
```

**安全特性**：
- ⏱️ 超时控制（默认 5 秒）
- 🔒 受限的全局变量访问
- 🏖️ 沙箱环境执行
- 🚫 无法访问 Node.js 敏感 API

**允许的全局变量**（默认）：
`Math`, `Date`, `String`, `Number`, `Boolean`, `Array`, `Object`, `JSON`

### 4. 模板表达式引擎

支持 `{{}}` 语法的模板字符串引擎。

```typescript
const result = await calculator.template(
  "总价：{{price * quantity}} 元",
  { price: 10, quantity: 5 }
);
console.log(result.value); // "总价：50 元"
```

**支持的特性**：
- 变量访问：`{{user.name}}`
- 嵌套访问：`{{user.profile.email}}`
- 简单表达式：`{{price * quantity}}`
- 算术运算：`{{a + b}}`, `{{x * y}}`
- 自定义定界符
- 变量提取功能

## 💡 使用示例

### 上下文管理

```typescript
// 设置全局上下文
calculator.setGlobalContext({
  currency: 'CNY',
  taxRate: 0.13,
});

// 更新全局上下文
calculator.updateGlobalContext({
  taxRate: 0.09,
});

// 使用局部上下文（优先级更高）
await calculator.calculate({
  type: EngineType.TEMPLATE,
  expression: "价格：{{price}} {{currency}}",
  context: { price: 100 }, // 局部上下文
});
```

### 批量计算

```typescript
// 串行批量计算
const results = await calculator.calculateBatch([
  {
    type: EngineType.JSON_LOGIC,
    expression: { "==": [{ "var": "x" }, 10] },
    context: { x: 10 },
  },
  {
    type: EngineType.TEMPLATE,
    expression: "结果：{{y}}",
    context: { y: 20 },
  },
]);

// 并行批量计算（更快）
const results = await calculator.calculateParallel([
  // ... 配置数组
]);
```

### 自定义操作符

```typescript
// 为 JSON Logic 添加自定义操作符
const engine = calculator.getEngine(EngineType.JSON_LOGIC) as JsonLogicEngine;
engine.addCustomOperator('startsWith', (str: string, prefix: string) => {
  return str.startsWith(prefix);
});

const result = await calculator.jsonLogic({
  startsWith: [{ var: 'name' }, 'John']
}, { name: 'John Doe' });
```

## 🎯 实际应用场景

### 1. 电商价格计算

```typescript
const finalPrice = await calculator.sourceCode(
  `
  const subtotal = context.price * context.quantity;
  const discount = context.isVip ? subtotal * 0.15 : 0;
  const shipping = subtotal >= 100 ? 0 : 10;
  return subtotal - discount + shipping;
  `,
  { price: 50, quantity: 3, isVip: true }
);
```

### 2. 动态表单验证

```typescript
const emailValid = await calculator.jsonLogic(
  {
    and: [
      { "!=": [{ "var": "email" }, ""] },
      { "in": ["@", { "var": "email" }] }
    ]
  },
  { email: "user@example.com" }
);
```

### 3. 报表生成

```typescript
const report = await calculator.template(
  `
财务报表 - {{company}}
收入：{{revenue}} 元
支出：{{expenses}} 元
利润：{{revenue - expenses}} 元
  `,
  { company: "某公司", revenue: 1000000, expenses: 600000 }
);
```

### 4. 业务规则引擎

```typescript
// 贷款审批规则
const approved = await calculator.jsonRuleEngine({
  conditions: {
    all: [
      { fact: 'creditScore', operator: 'greaterThanInclusive', value: 650 },
      { fact: 'annualIncome', operator: 'greaterThanInclusive', value: 50000 },
    ]
  },
  event: { type: 'approved' }
}, { creditScore: 720, annualIncome: 80000 });
```

## 📚 API 文档

### DynamicValueCalculator

主要的计算器类。

#### 核心方法

```typescript
// 计算单个表达式
calculate<T>(config: CalculationConfig): Promise<CalculationResult<T>>

// 批量计算（串行）
calculateBatch<T>(configs: CalculationConfig[]): Promise<CalculationResult<T>[]>

// 并行计算
calculateParallel<T>(configs: CalculationConfig[]): Promise<CalculationResult<T>[]>
```

#### 快捷方法

```typescript
// JSON Logic 快捷方法
jsonLogic<T>(expression, context?): Promise<CalculationResult<T>>

// JSON Rule Engine 快捷方法
jsonRuleEngine<T>(expression, context?): Promise<CalculationResult<T>>

// 源码执行快捷方法
sourceCode<T>(code, context?, options?): Promise<CalculationResult<T>>

// 模板表达式快捷方法
template<T>(template, context?, options?): Promise<CalculationResult<T>>
```

#### 上下文管理

```typescript
// 设置全局上下文
setGlobalContext(context: Context): void

// 更新全局上下文
updateGlobalContext(updates: Context): void

// 获取全局上下文
getGlobalContext(): Context
```

#### 引擎管理

```typescript
// 注册自定义引擎
registerEngine(type: EngineType, engine: ICalculationEngine): void

// 获取引擎实例
getEngine(type: EngineType): ICalculationEngine

// 获取所有可用引擎
getAvailableEngines(): EngineType[]
```

### ContextManager

上下文管理器，提供高级的上下文管理功能。

```typescript
// 获取合并后的上下文
getMergedContext(localContext?: Context): Context

// 获取指定路径的值
getValue(path: string, localContext?: Context): any

// 设置指定路径的值
setValue(path: string, value: any): void

// 推入上下文层级
pushContext(context: Context): void

// 弹出上下文层级
popContext(): Context | undefined
```

## 🔧 类型定义

```typescript
// 引擎类型
enum EngineType {
  JSON_LOGIC = 'json-logic',
  JSON_RULE_ENGINE = 'json-rule-engine',
  SOURCE_CODE = 'source-code',
  TEMPLATE = 'template',
}

// 计算配置
interface CalculationConfig {
  type: EngineType;           // 引擎类型
  expression: any;            // 表达式或规则
  context?: Context;          // 上下文数据
  options?: Record<string, any>; // 引擎选项
}

// 计算结果
interface CalculationResult<T = any> {
  success: boolean;           // 是否成功
  value?: T;                  // 计算结果
  error?: string;             // 错误信息
  executionTime?: number;     // 执行时间（毫秒）
}

// 上下文类型
type Context = Record<string, any>;
```

## ⚙️ 高级配置

### 源码执行选项

```typescript
interface SourceCodeOptions {
  timeout?: number;           // 超时时间（毫秒），默认 5000
  allowedGlobals?: string[];  // 允许的全局变量白名单
}
```

### 模板表达式选项

```typescript
interface TemplateOptions {
  startDelimiter?: string;    // 开始定界符，默认 '{{'
  endDelimiter?: string;      // 结束定界符，默认 '}}'
  allowFunctions?: boolean;   // 是否允许执行函数，默认 false
}
```

## 🔒 安全性说明

1. **源码执行**：
   - 使用沙箱环境，限制访问敏感 API
   - 默认超时 5 秒，防止无限循环
   - 只允许访问白名单中的全局变量
   - 建议只执行可信的代码

2. **模板表达式**：
   - 默认只支持简单的变量访问和算术运算
   - 可通过 `allowFunctions` 选项启用函数执行
   - 执行不可信模板时请谨慎使用函数功能

3. **JSON Logic / Rule Engine**：
   - 纯数据驱动，无代码执行风险
   - 推荐用于需要高安全性的场景

## 📚 文档导航

### 核心文档
- 📖 [README.md](./README.md) - 完整的使用指南
- 📖 [README.zh-CN.md](./README.zh-CN.md) - 中文版完整文档（本文档）
- 🚀 [GETTING_STARTED.md](./GETTING_STARTED.md) - 5分钟快速开始

### Options 配置文档
- 🔧 [JSON Logic Options 详细说明](./docs/JSON_LOGIC_OPTIONS.md) - JsonLogicEngine 的完整配置指南
- 📊 [所有引擎 Options 汇总](./docs/OPTIONS_SUMMARY.md) - 所有引擎的 options 对比
- ⚡ [快速参考手册](./docs/QUICK_REFERENCE.md) - 常用配置速查

### 示例代码
- 💡 [基础使用示例](./examples/basic-usage.ts) - 四种引擎的基础用法
- 🎯 [高级使用示例](./examples/advanced-usage.ts) - 批量计算、自定义操作符等
- 🏢 [实际应用场景](./examples/real-world-scenarios.ts) - 5个真实业务场景
- 🔍 [JSON Logic Options 示例](./examples/json-logic-options.ts) - 所有 options 的使用示例

### 运行示例

```bash
# 基础示例
npx ts-node examples/basic-usage.ts

# 高级示例
npx ts-node examples/advanced-usage.ts

# JSON Logic Options 示例
npx ts-node examples/json-logic-options.ts

# 实际场景示例
npx ts-node examples/real-world-scenarios.ts
```

## 📝 最佳实践

1. **选择合适的引擎**：
   - 简单逻辑判断 → JSON Logic
   - 复杂业务规则 → JSON Rule Engine
   - 动态计算 → Source Code
   - 文本生成 → Template

2. **上下文管理**：
   - 公共配置使用全局上下文
   - 特定数据使用局部上下文
   - 避免上下文数据过大

3. **性能优化**：
   - 独立计算使用并行模式
   - 避免在循环中创建计算器实例
   - 复用引擎实例
   - 只在需要时启用 `builtInExtensions`

4. **错误处理**：
   - 始终检查 `result.success`
   - 记录 `result.error` 便于调试
   - 使用 try-catch 包裹异步调用
   - 生产环境使用 `strictMode` 确保数据完整性

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 📮 联系方式

如有问题或建议，请提交 Issue。
