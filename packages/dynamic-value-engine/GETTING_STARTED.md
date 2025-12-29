# 快速开始指南

本指南将帮助你快速上手 `@aumi/dynamic-value-engine`。

## 安装

```bash
pnpm install
# 在 dynamic-value-engine 目录下
pnpm build
```

## 5 分钟教程

### 1. 创建计算器实例

```typescript
import { DynamicValueCalculator } from '@aumi/dynamic-value-engine';

const calculator = new DynamicValueCalculator();
```

### 2. 使用 JSON Logic（最简单）

适合：条件判断、逻辑运算

```typescript
// 检查年龄是否大于等于 18
const result = await calculator.jsonLogic(
  { ">=": [{ "var": "age" }, 18] },
  { age: 20 }
);
console.log(result.value); // true
```

### 3. 使用模板表达式（最直观）

适合：字符串拼接、简单计算

```typescript
// 生成欢迎消息
const result = await calculator.template(
  "欢迎 {{name}}，您的账户余额为 {{balance}} 元",
  { name: "张三", balance: 1000 }
);
console.log(result.value); // "欢迎 张三，您的账户余额为 1000 元"
```

### 4. 使用源码执行（最灵活）

适合：复杂计算、自定义逻辑

```typescript
// 计算订单总价
const result = await calculator.sourceCode(
  `
  const subtotal = context.price * context.quantity;
  const tax = subtotal * context.taxRate;
  return subtotal + tax;
  `,
  { price: 100, quantity: 2, taxRate: 0.13 }
);
console.log(result.value); // 226
```

### 5. 使用规则引擎（最强大）

适合：业务规则、条件触发

```typescript
// VIP 用户判断
const result = await calculator.jsonRuleEngine({
  conditions: {
    all: [
      { fact: 'points', operator: 'greaterThanInclusive', value: 1000 }
    ]
  },
  event: {
    type: 'vip',
    params: { level: 'gold' }
  }
}, { points: 1500 });

console.log(result.value); // { type: 'vip', params: { level: 'gold' } }
```

## 运行示例

```bash
# 基础示例
ts-node examples/basic-usage.ts

# 高级示例
ts-node examples/advanced-usage.ts

# 实际场景示例
ts-node examples/real-world-scenarios.ts
```

## 常见问题

### Q: 如何选择引擎？

- **JSON Logic**：简单的条件判断和逻辑运算
- **JSON Rule Engine**：复杂的业务规则和多条件判断
- **Source Code**：需要执行自定义 JavaScript 代码
- **Template**：字符串拼接和简单的变量替换

### Q: 如何处理错误？

```typescript
const result = await calculator.calculate(config);

if (!result.success) {
  console.error('计算失败:', result.error);
} else {
  console.log('计算成功:', result.value);
}
```

### Q: 如何提高性能？

```typescript
// 使用并行计算
const results = await calculator.calculateParallel([
  config1,
  config2,
  config3
]);
```

### Q: 如何设置全局配置？

```typescript
calculator.setGlobalContext({
  currency: 'CNY',
  locale: 'zh-CN'
});

// 之后所有计算都可以访问这些全局变量
```

## 下一步

- 查看 [README.md](./README.md) 了解完整的 API 文档
- 查看 [examples/](./examples/) 目录了解更多示例
- 尝试自定义引擎和操作符

祝你使用愉快！ 🎉
