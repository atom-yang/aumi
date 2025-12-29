# @aumi/dynamic-value-engine

一个强大的动态值计算引擎，支持多种计算方式：JSON Logic、JSON Rule Engine、源码执行和模板表达式。提供统一的上下文管理和简洁的 API。

## 特性

- 🚀 **多引擎支持**：集成 4 种常用的计算引擎
- 🔧 **统一接口**：所有引擎使用相同的 API 调用方式
- 📦 **上下文管理**：内置上下文管理器，支持全局和局部上下文
- 🔒 **类型安全**：完整的 TypeScript 类型定义
- ⚡ **高性能**：支持并行计算和批量处理
- 🎨 **可扩展**：支持自定义引擎注册

## 安装

```bash
npm install @aumi/dynamic-value-engine
# 或
pnpm add @aumi/dynamic-value-engine
# 或
yarn add @aumi/dynamic-value-engine
```

## 快速开始

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
  expression: "Hello {{user.name}}, you are {{user.age}} years old",
});
console.log(result2.value); // "Hello John, you are 25 years old"
```

## 支持的引擎

### 1. JSON Logic Engine

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

**支持的操作符**：`==`, `!=`, `>`, `>=`, `<`, `<=`, `and`, `or`, `not`, `if`, `var`, `in`, `cat`, `substr`, `map`, `filter`, `reduce` 等。

### 2. JSON Rule Engine

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
      params: { message: 'User is an adult' }
    }
  },
  { age: 25 }
);
console.log(result.value); // { type: 'adult', params: { message: 'User is an adult' } }
```

### 3. Source Code Engine

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
- 超时控制（默认 5 秒）
- 受限的全局变量访问
- 沙箱环境执行

### 4. Template Engine

支持 `{{}}` 语法的模板字符串引擎。

```typescript
const result = await calculator.template(
  "Total: {{price * quantity}}",
  { price: 10, quantity: 5 }
);
console.log(result.value); // "Total: 50"
```

**特性**：
- 变量访问：`{{user.name}}`
- 简单表达式：`{{price * quantity}}`
- 自定义定界符支持
- 变量提取功能

## 高级用法

### 上下文管理

```typescript
// 设置全局上下文
calculator.setGlobalContext({
  currency: 'USD',
  taxRate: 0.1,
});

// 更新全局上下文
calculator.updateGlobalContext({
  taxRate: 0.15,
});

// 使用局部上下文（优先级更高）
await calculator.calculate({
  type: EngineType.TEMPLATE,
  expression: "Price: {{price}} {{currency}}",
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
    expression: "Result: {{y}}",
    context: { y: 20 },
  },
]);

// 并行批量计算（更快）
const results = await calculator.calculateParallel([
  // ... 配置数组
]);
```

### 自定义引擎

```typescript
import { BaseEngine, EngineType, Context } from '@aumi/dynamic-value-engine';

class MyCustomEngine extends BaseEngine {
  constructor() {
    super('custom' as EngineType);
  }

  protected async executeCalculation<T>(
    expression: any,
    context: Context
  ): Promise<T> {
    // 自定义计算逻辑
    return expression(context) as T;
  }

  validate(expression: any): boolean {
    return typeof expression === 'function';
  }
}

// 注册自定义引擎
calculator.registerEngine('custom' as EngineType, new MyCustomEngine());
```

### 自定义操作符

```typescript
// JSON Logic 自定义操作符
const engine = calculator.getEngine(EngineType.JSON_LOGIC) as JsonLogicEngine;
engine.addCustomOperator('startsWith', (str: string, prefix: string) => {
  return str.startsWith(prefix);
});

const result = await calculator.jsonLogic({
  startsWith: [{ var: 'name' }, 'John']
}, { name: 'John Doe' });
```

## API 文档

### DynamicValueCalculator

主要的计算器类。

#### 方法

- `calculate<T>(config: CalculationConfig): Promise<CalculationResult<T>>`
  - 计算单个表达式

- `calculateBatch<T>(configs: CalculationConfig[]): Promise<CalculationResult<T>[]>`
  - 串行批量计算

- `calculateParallel<T>(configs: CalculationConfig[]): Promise<CalculationResult<T>[]>`
  - 并行批量计算

- `jsonLogic<T>(expression, context?): Promise<CalculationResult<T>>`
  - JSON Logic 快捷方法

- `jsonRuleEngine<T>(expression, context?): Promise<CalculationResult<T>>`
  - JSON Rule Engine 快捷方法

- `sourceCode<T>(code, context?, options?): Promise<CalculationResult<T>>`
  - 源码执行快捷方法

- `template<T>(template, context?, options?): Promise<CalculationResult<T>>`
  - 模板表达式快捷方法

- `setGlobalContext(context: Context): void`
  - 设置全局上下文

- `updateGlobalContext(updates: Context): void`
  - 更新全局上下文

- `registerEngine(type: EngineType, engine: ICalculationEngine): void`
  - 注册自定义引擎

### ContextManager

上下文管理器。

#### 方法

- `getMergedContext(localContext?: Context): Context`
  - 获取合并后的上下文

- `getValue(path: string, localContext?: Context): any`
  - 获取指定路径的值

- `setValue(path: string, value: any): void`
  - 设置指定路径的值

- `pushContext(context: Context): void`
  - 推入新的上下文层级

- `popContext(): Context | undefined`
  - 弹出当前上下文层级

## 类型定义

```typescript
enum EngineType {
  JSON_LOGIC = 'json-logic',
  JSON_RULE_ENGINE = 'json-rule-engine',
  SOURCE_CODE = 'source-code',
  TEMPLATE = 'template',
}

interface CalculationConfig {
  type: EngineType;
  expression: any;
  context?: Context;
  options?: Record<string, any>;
}

interface CalculationResult<T = any> {
  success: boolean;
  value?: T;
  error?: string;
  executionTime?: number;
}

type Context = Record<string, any>;
```

## 使用场景

1. **动态表单验证**：使用规则引擎实现复杂的表单验证逻辑
2. **配置化计算**：将计算逻辑配置化，无需修改代码
3. **报表生成**：使用模板引擎生成动态报表
4. **业务规则引擎**：实现可配置的业务规则系统
5. **价格计算器**：动态计算商品价格、折扣等
6. **权限控制**：基于规则的动态权限判断

## 注意事项

1. **源码执行安全性**：源码执行引擎使用沙箱环境，但仍需谨慎使用，避免执行不可信的代码
2. **超时控制**：源码执行默认超时 5 秒，可根据需要调整
3. **性能考虑**：对于大量计算，建议使用并行计算模式
4. **上下文管理**：合理使用全局和局部上下文，避免数据冲突

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 更新日志

### 1.0.0

- 初始版本发布
- 支持 JSON Logic、JSON Rule Engine、源码执行、模板表达式四种引擎
- 提供统一的上下文管理
- 完整的 TypeScript 类型支持
