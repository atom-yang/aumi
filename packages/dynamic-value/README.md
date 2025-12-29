# @aumi/dynamic-value

动态值计算模块 - 支持多种计算引擎，提供统一的上下文和 API。

## 特性

- 🔧 **多引擎支持**: JSON Logic、JSON Rule Engine、模板表达式、脚本执行
- 🎯 **统一上下文**: 所有引擎共享相同的数据上下文
- 🔌 **可扩展**: 支持自定义操作符、Facts、助手函数
- 💾 **缓存支持**: 内置 LRU 缓存，提高性能
- 🛡️ **安全执行**: 脚本引擎内置沙箱保护
- 📦 **按需加载**: 各引擎依赖按需加载

## 安装

```bash
npm install @aumi/dynamic-value

# 根据需要安装对应引擎的依赖
npm install json-logic-js  # 如果使用 JSON Logic
npm install json-rules-engine  # 如果使用 JSON Rule Engine
```

## 快速开始

```typescript
import { createDynamicValue } from '@aumi/dynamic-value';

// 创建实例
const dv = createDynamicValue();

// 设置上下文
dv.setContext({
  data: {
    user: { name: 'Alice', age: 25 },
    products: [
      { name: 'Product A', price: 100 },
      { name: 'Product B', price: 200 },
    ],
  },
});

// 使用不同引擎计算
```

## 使用示例

### 1. JSON Logic 引擎

适用于简单的条件判断和数据处理。

```typescript
// 条件判断
const result = await dv.computeJsonLogic({
  if: [
    { '>': [{ var: 'user.age' }, 18] },
    '成年人',
    '未成年人',
  ],
});
console.log(result.value); // '成年人'

// 数据比较
const comparison = await dv.computeJsonLogic({
  '==': [{ var: 'user.name' }, 'Alice'],
});
console.log(comparison.value); // true

// 数组操作
const filtered = await dv.computeJsonLogic({
  filter: [
    { var: 'products' },
    { '>=': [{ var: 'price' }, 150] },
  ],
});
console.log(filtered.value); // [{ name: 'Product B', price: 200 }]
```

### 2. JSON Rule Engine

适用于复杂的业务规则引擎场景。

```typescript
const ruleResult = await dv.computeRules([
  {
    name: 'adult-discount',
    conditions: {
      all: [
        { fact: 'user.age', operator: 'greaterThanInclusive', value: 18 },
        { fact: 'user.age', operator: 'lessThan', value: 60 },
      ],
    },
    event: {
      type: 'discount',
      params: { rate: 0.1 },
    },
  },
  {
    name: 'senior-discount',
    conditions: {
      all: [
        { fact: 'user.age', operator: 'greaterThanInclusive', value: 60 },
      ],
    },
    event: {
      type: 'discount',
      params: { rate: 0.2 },
    },
  },
]);

if (ruleResult.value?.matched) {
  console.log('触发的事件:', ruleResult.value.events);
}
```

### 3. 模板表达式引擎

适用于字符串模板和简单计算。

```typescript
// 简单变量替换
const greeting = await dv.computeTemplate(
  '你好，{{user.name}}！你今年 {{user.age}} 岁。',
);
console.log(greeting.value); // '你好，Alice！你今年 25 岁。'

// 使用助手函数
const formatted = await dv.computeTemplate(
  '用户名：{{user.name | upper}}，年龄：{{add(user.age, 5)}}',
);
console.log(formatted.value); // '用户名：ALICE，年龄：30'

// 条件表达式
const status = await dv.computeTemplate(
  '状态：{{if(gt(user.age, 18), "成年", "未成年")}}',
);
console.log(status.value); // '状态：成年'
```

### 4. 脚本执行引擎

适用于复杂的计算逻辑。

```typescript
// 简单计算
const total = await dv.computeScript(`
  const prices = data.products.map(p => p.price);
  return prices.reduce((sum, price) => sum + price, 0);
`);
console.log(total.value); // 300

// 复杂逻辑
const analysis = await dv.computeScript(`
  const { products, user } = data;
  const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
  const affordable = products.filter(p => p.price <= avgPrice);
  
  return {
    user: user.name,
    totalProducts: products.length,
    averagePrice: avgPrice,
    affordableProducts: affordable.map(p => p.name),
  };
`);
console.log(analysis.value);
// {
//   user: 'Alice',
//   totalProducts: 2,
//   averagePrice: 150,
//   affordableProducts: ['Product A']
// }
```

## 统一配置方式

使用 `compute` 方法和 `DynamicValueDefinition` 进行统一调用：

```typescript
import { DynamicValueDefinition } from '@aumi/dynamic-value';

const definition: DynamicValueDefinition = {
  engine: 'json-logic',
  config: {
    rule: {
      if: [
        { '>': [{ var: 'user.age' }, 18] },
        '成年',
        '未成年',
      ],
    },
  },
  defaultValue: '未知',
  cache: {
    enabled: true,
    ttl: 60000, // 缓存 1 分钟
  },
  description: '判断用户年龄状态',
};

const result = await dv.compute(definition);
```

## 上下文管理

```typescript
const dv = createDynamicValue({
  defaultContext: {
    data: { appName: 'MyApp' },
    env: { NODE_ENV: 'production' },
    user: { id: '123', role: 'admin' },
  },
});

// 获取上下文管理器
const ctx = dv.getContextManager();

// 设置数据
ctx.setData('counter', 0);
ctx.setDataBatch({ a: 1, b: 2 });

// 路径访问
ctx.setByPath('config.theme.color', 'blue');
const color = ctx.getByPath('config.theme.color');

// 创建子上下文
const childContext = ctx.createChildContext({
  data: { override: true },
});
```

## 自定义扩展

### 自定义 JSON Logic 操作符

```typescript
const dv = createDynamicValue({
  customOperators: [
    {
      name: 'isEmpty',
      fn: (val) => {
        if (val === null || val === undefined) return true;
        if (typeof val === 'string') return val.trim() === '';
        if (Array.isArray(val)) return val.length === 0;
        return false;
      },
    },
  ],
});
```

### 自定义 JSON Rule Engine Facts

```typescript
const dv = createDynamicValue({
  customFacts: [
    {
      name: 'currentUserRole',
      fn: async (params, context) => {
        return context.user?.role || 'guest';
      },
      options: { cache: false },
    },
  ],
});
```

### 自定义模板助手函数

```typescript
const dv = createDynamicValue({
  templateHelpers: {
    currency: (val, symbol = '¥') => {
      return `${symbol}${Number(val).toFixed(2)}`;
    },
    pluralize: (count, singular, plural) => {
      return count === 1 ? singular : plural;
    },
  },
});

// 使用
await dv.computeTemplate('价格：{{currency(price)}}'); // 价格：¥100.00
```

## 内置助手函数（模板引擎）

### 字符串操作
- `upper(str)` - 转大写
- `lower(str)` - 转小写
- `trim(str)` - 去除首尾空格
- `capitalize(str)` - 首字母大写
- `replace(str, search, replacement)` - 替换
- `substr(str, start, length)` - 截取
- `split(str, separator)` - 分割
- `join(arr, separator)` - 连接

### 数学操作
- `add(a, b)` - 加法
- `sub(a, b)` - 减法
- `mul(a, b)` - 乘法
- `div(a, b)` - 除法
- `mod(a, b)` - 取模
- `round(n, decimals)` - 四舍五入
- `floor(n)` - 向下取整
- `ceil(n)` - 向上取整
- `abs(n)` - 绝对值
- `min(...args)` - 最小值
- `max(...args)` - 最大值

### 日期操作
- `now()` - 当前 ISO 时间
- `timestamp()` - 当前时间戳
- `formatDate(date, format)` - 格式化日期

### 条件判断
- `if(condition, ifTrue, ifFalse)` - 条件
- `eq(a, b)` - 等于
- `ne(a, b)` - 不等于
- `gt(a, b)` - 大于
- `gte(a, b)` - 大于等于
- `lt(a, b)` - 小于
- `lte(a, b)` - 小于等于
- `and(...args)` - 且
- `or(...args)` - 或
- `not(val)` - 非

### 类型转换
- `str(val)` - 转字符串
- `num(val)` - 转数字
- `bool(val)` - 转布尔
- `json(val)` - 转 JSON 字符串
- `parse(val)` - 解析 JSON

### 数组操作
- `length(arr)` - 长度
- `first(arr)` - 第一个元素
- `last(arr)` - 最后一个元素
- `at(arr, index)` - 指定索引元素
- `includes(arr, item)` - 是否包含
- `reverse(arr)` - 反转
- `sort(arr)` - 排序

### 空值处理
- `default(val, defaultVal)` - 默认值
- `coalesce(...args)` - 返回第一个非空值

### 对象操作
- `keys(obj)` - 获取键数组
- `values(obj)` - 获取值数组
- `entries(obj)` - 获取键值对数组
- `get(obj, path)` - 路径访问

## API 参考

### DynamicValue

```typescript
class DynamicValue {
  // 通用计算方法
  compute<T>(definition: DynamicValueDefinition, contextOverride?: Partial<DynamicContext>): Promise<ComputeResult<T>>
  
  // 便捷方法
  computeJsonLogic<T>(rule: JsonLogicRule, contextOverride?): Promise<ComputeResult<T>>
  computeRules(rules: JsonRuleEngineRule[], contextOverride?, options?): Promise<ComputeResult<JsonRuleEngineResult>>
  computeTemplate(template: string, contextOverride?, options?): Promise<ComputeResult<string>>
  computeScript<T>(code: string, contextOverride?, options?): Promise<ComputeResult<T>>
  
  // 批量计算
  computeBatch<T>(definitions: DynamicValueDefinition[], contextOverride?): Promise<ComputeResult<T>[]>
  
  // 上下文管理
  getContext(): DynamicContext
  setContext(context: Partial<DynamicContext>): void
  getContextManager(): ContextManager
  
  // 引擎管理
  getEngine(type: EngineType): IEngine
  registerEngine(type: EngineType, engine: IEngine): void
  
  // 验证
  validate(definition: DynamicValueDefinition): boolean
  
  // 缓存
  clearCache(): void
}
```

### ComputeResult

```typescript
interface ComputeResult<T> {
  success: boolean;      // 是否成功
  value?: T;             // 计算结果
  error?: Error;         // 错误信息
  duration?: number;     // 执行时间（毫秒）
  fromCache?: boolean;   // 是否来自缓存
}
```

## License

MIT
