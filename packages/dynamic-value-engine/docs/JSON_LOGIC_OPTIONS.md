# JSON Logic Engine Options 详细说明

本文档详细介绍 `JsonLogicEngine` 运行时可以使用的所有 `options` 配置项。

## 目录

- [基础选项](#基础选项)
- [自定义操作符](#自定义操作符)
- [内置扩展操作符](#内置扩展操作符)
- [严格模式](#严格模式)
- [调试模式](#调试模式)
- [上下文转换](#上下文转换)
- [结果后处理](#结果后处理)
- [自定义变量解析器](#自定义变量解析器)
- [完整示例](#完整示例)

---

## 基础选项

### `customOperators`

**类型**: `Record<string, (...args: any[]) => any>`

**默认值**: `undefined`

**说明**: 自定义操作符，允许你扩展 JSON Logic 的功能。

**示例**:

```typescript
const result = await calculator.jsonLogic(
  {
    startsWith: [{ var: 'name' }, 'John']
  },
  { name: 'John Doe' },
  {
    customOperators: {
      startsWith: (str: string, prefix: string) => str.startsWith(prefix)
    }
  }
);
console.log(result.value); // true
```

**更多示例**:

```typescript
// 多个自定义操作符
const options = {
  customOperators: {
    // 数学运算
    multiply: (a: number, b: number) => a * b,
    square: (n: number) => n * n,
    
    // 字符串操作
    reverse: (str: string) => str.split('').reverse().join(''),
    slugify: (str: string) => str.toLowerCase().replace(/\s+/g, '-'),
    
    // 日期操作
    isToday: (timestamp: number) => {
      const today = new Date().toDateString();
      const date = new Date(timestamp).toDateString();
      return today === date;
    },
    
    // 业务逻辑
    calculateDiscount: (price: number, level: string) => {
      const discounts: Record<string, number> = {
        vip: 0.8,
        gold: 0.85,
        silver: 0.9
      };
      return price * (discounts[level] || 1);
    }
  }
};
```

---

## 内置扩展操作符

### `builtInExtensions`

**类型**: `boolean`

**默认值**: `false`

**说明**: 启用后会自动注册一系列常用的扩展操作符，无需手动定义。

**示例**:

```typescript
const result = await calculator.jsonLogic(
  {
    and: [
      { startsWith: [{ var: 'email' }, 'admin'] },
      { includes: [{ var: 'email' }, '@company.com'] },
      { isNotEmpty: [{ var: 'name' }] }
    ]
  },
  { email: 'admin@company.com', name: 'John' },
  { builtInExtensions: true }
);
console.log(result.value); // true
```

### 内置扩展操作符列表

#### 字符串操作

| 操作符 | 参数 | 返回值 | 示例 |
|--------|------|--------|------|
| `startsWith` | `(str, prefix)` | `boolean` | `{ startsWith: ["hello", "he"] }` → `true` |
| `endsWith` | `(str, suffix)` | `boolean` | `{ endsWith: ["hello", "lo"] }` → `true` |
| `includes` | `(str, substr)` | `boolean` | `{ includes: ["hello", "ll"] }` → `true` |
| `toUpperCase` | `(str)` | `string` | `{ toUpperCase: ["hello"] }` → `"HELLO"` |
| `toLowerCase` | `(str)` | `string` | `{ toLowerCase: ["HELLO"] }` → `"hello"` |
| `trim` | `(str)` | `string` | `{ trim: ["  hello  "] }` → `"hello"` |
| `replace` | `(str, search, replace)` | `string` | `{ replace: ["hello", "l", "r"] }` → `"herro"` |
| `split` | `(str, separator)` | `array` | `{ split: ["a,b,c", ","] }` → `["a","b","c"]` |
| `join` | `(array, separator)` | `string` | `{ join: [["a","b"], "-"] }` → `"a-b"` |

#### 类型检查

| 操作符 | 参数 | 返回值 | 示例 |
|--------|------|--------|------|
| `isEmpty` | `(value)` | `boolean` | `{ isEmpty: [""] }` → `true` |
| `isNotEmpty` | `(value)` | `boolean` | `{ isNotEmpty: ["hello"] }` → `true` |
| `isNull` | `(value)` | `boolean` | `{ isNull: [null] }` → `true` |
| `isUndefined` | `(value)` | `boolean` | `{ isUndefined: [undefined] }` → `true` |
| `isNumber` | `(value)` | `boolean` | `{ isNumber: [123] }` → `true` |
| `isString` | `(value)` | `boolean` | `{ isString: ["hello"] }` → `true` |
| `isBoolean` | `(value)` | `boolean` | `{ isBoolean: [true] }` → `true` |
| `isArray` | `(value)` | `boolean` | `{ isArray: [[1,2,3]] }` → `true` |
| `isObject` | `(value)` | `boolean` | `{ isObject: [{"a":1}] }` → `true` |

#### 数组操作

| 操作符 | 参数 | 返回值 | 示例 |
|--------|------|--------|------|
| `length` | `(value)` | `number` | `{ length: [[1,2,3]] }` → `3` |
| `first` | `(array)` | `any` | `{ first: [[1,2,3]] }` → `1` |
| `last` | `(array)` | `any` | `{ last: [[1,2,3]] }` → `3` |
| `reverse` | `(array)` | `array` | `{ reverse: [[1,2,3]] }` → `[3,2,1]` |
| `unique` | `(array)` | `array` | `{ unique: [[1,1,2,3]] }` → `[1,2,3]` |
| `flatten` | `(array)` | `array` | `{ flatten: [[1,[2,3]]] }` → `[1,2,3]` |
| `sort` | `(array, order?)` | `array` | `{ sort: [[3,1,2], "asc"] }` → `[1,2,3]` |

#### 数学操作

| 操作符 | 参数 | 返回值 | 示例 |
|--------|------|--------|------|
| `abs` | `(number)` | `number` | `{ abs: [-5] }` → `5` |
| `ceil` | `(number)` | `number` | `{ ceil: [4.3] }` → `5` |
| `floor` | `(number)` | `number` | `{ floor: [4.7] }` → `4` |
| `round` | `(number, decimals?)` | `number` | `{ round: [4.567, 2] }` → `4.57` |
| `pow` | `(base, exponent)` | `number` | `{ pow: [2, 3] }` → `8` |
| `sqrt` | `(number)` | `number` | `{ sqrt: [16] }` → `4` |
| `random` | `()` | `number` | `{ random: [] }` → `0.123...` |

#### 对象操作

| 操作符 | 参数 | 返回值 | 示例 |
|--------|------|--------|------|
| `keys` | `(object)` | `array` | `{ keys: [{"a":1,"b":2}] }` → `["a","b"]` |
| `values` | `(object)` | `array` | `{ values: [{"a":1,"b":2}] }` → `[1,2]` |
| `entries` | `(object)` | `array` | `{ entries: [{"a":1}] }` → `[["a",1]]` |
| `has` | `(object, key)` | `boolean` | `{ has: [{"a":1}, "a"] }` → `true` |

#### 其他操作

| 操作符 | 参数 | 返回值 | 示例 |
|--------|------|--------|------|
| `regex` | `(str, pattern, flags?)` | `boolean` | `{ regex: ["hello", "^h"] }` → `true` |
| `now` | `()` | `number` | `{ now: [] }` → `1640000000000` |
| `dateFormat` | `(timestamp, locale?)` | `string` | `{ dateFormat: [1640000000000] }` |
| `default` | `(value, defaultValue)` | `any` | `{ default: [null, "N/A"] }` → `"N/A"` |
| `coalesce` | `(...values)` | `any` | `{ coalesce: [null, undefined, "ok"] }` → `"ok"` |

**实际应用示例**:

```typescript
// 表单验证
const validateEmail = await calculator.jsonLogic({
  and: [
    { isString: [{ var: 'email' }] },
    { isNotEmpty: [{ var: 'email' }] },
    { includes: [{ var: 'email' }, '@'] },
    { regex: [{ var: 'email' }, '^[^@]+@[^@]+\\.[^@]+$'] }
  ]
}, { email: 'user@example.com' }, { builtInExtensions: true });

// 数据处理
const processArray = await calculator.jsonLogic({
  length: [
    { unique: [
      { map: [
        { var: 'items' },
        { toUpperCase: [{ var: '' }] }
      ] }
    ] }
  ]
}, { items: ['apple', 'banana', 'Apple', 'cherry'] }, { builtInExtensions: true });

// 条件判断
const checkUser = await calculator.jsonLogic({
  and: [
    { isNotEmpty: [{ var: 'user.name' }] },
    { '>=': [{ var: 'user.age' }, 18] },
    { has: [{ var: 'user' }, 'email'] }
  ]
}, {
  user: { name: 'John', age: 25, email: 'john@example.com' }
}, { builtInExtensions: true });
```

---

## 严格模式

### `strictMode`

**类型**: `boolean`

**默认值**: `false`

**说明**: 启用严格模式后，如果表达式中引用的变量在上下文中不存在，会抛出错误。

**示例**:

```typescript
// 正常模式 - 不存在的变量返回 undefined
const result1 = await calculator.jsonLogic(
  { var: 'nonexistent' },
  { name: 'John' }
);
console.log(result1.value); // undefined

// 严格模式 - 抛出错误
try {
  const result2 = await calculator.jsonLogic(
    { var: 'nonexistent' },
    { name: 'John' },
    { strictMode: true }
  );
} catch (error) {
  console.error(error.message); // "严格模式：以下变量不存在: nonexistent"
}
```

### `defaultValue`

**类型**: `any`

**默认值**: `undefined`

**说明**: 在非严格模式下，当变量不存在时返回的默认值。

**示例**:

```typescript
const result = await calculator.jsonLogic(
  { var: 'nonexistent' },
  { name: 'John' },
  { defaultValue: 'N/A' }
);
console.log(result.value); // "N/A"
```

---

## 调试模式

### `debug`

**类型**: `boolean`

**默认值**: `false`

**说明**: 启用调试模式后，会在控制台输出详细的执行日志，包括表达式、上下文和结果。

**示例**:

```typescript
const result = await calculator.jsonLogic(
  {
    and: [
      { '>=': [{ var: 'age' }, 18] },
      { startsWith: [{ var: 'email' }, 'admin'] }
    ]
  },
  { age: 25, email: 'admin@example.com' },
  { 
    debug: true,
    builtInExtensions: true
  }
);

// 控制台输出：
// [JsonLogic Debug] Expression: { "and": [...] }
// [JsonLogic Debug] Context: { "age": 25, "email": "admin@example.com" }
// [JsonLogic Debug] Result: true
```

---

## 上下文转换

### `transformContext`

**类型**: `(context: Context) => Context`

**默认值**: `undefined`

**说明**: 在执行表达式前对上下文进行转换，可用于预处理数据、添加辅助字段等。

**示例**:

```typescript
const result = await calculator.jsonLogic(
  { '>=': [{ var: 'timestamp' }, { var: '_now' }] },
  { timestamp: Date.now() + 1000 },
  {
    transformContext: (ctx) => ({
      ...ctx,
      _now: Date.now(), // 添加当前时间
      _user: 'system',  // 添加系统信息
    })
  }
);
```

**实际应用场景**:

```typescript
// 数据标准化
const options = {
  transformContext: (ctx) => ({
    ...ctx,
    // 确保所有字符串都是小写
    email: ctx.email?.toLowerCase(),
    username: ctx.username?.toLowerCase(),
    // 添加计算字段
    fullName: `${ctx.firstName} ${ctx.lastName}`,
    // 添加时间戳
    _processedAt: Date.now(),
  })
};

// 添加权限信息
const options2 = {
  transformContext: (ctx) => ({
    ...ctx,
    _permissions: getUserPermissions(ctx.userId),
    _isAdmin: ctx.role === 'admin',
  })
};
```

---

## 结果后处理

### `postProcess`

**类型**: `(result: any) => any`

**默认值**: `undefined`

**说明**: 在返回结果前对结果进行转换或格式化。

**示例**:

```typescript
const result = await calculator.jsonLogic(
  { cat: [{ var: 'firstName' }, ' ', { var: 'lastName' }] },
  { firstName: '  John  ', lastName: '  Doe  ' },
  {
    postProcess: (result) => {
      // 清理字符串结果
      return typeof result === 'string' ? result.trim() : result;
    }
  }
);
console.log(result.value); // "John   Doe" (已去除首尾空格)
```

**更多示例**:

```typescript
// 数字格式化
const options1 = {
  postProcess: (result) => {
    if (typeof result === 'number') {
      return Number(result.toFixed(2)); // 保留两位小数
    }
    return result;
  }
};

// 布尔值转换
const options2 = {
  postProcess: (result) => {
    if (typeof result === 'boolean') {
      return result ? 'yes' : 'no';
    }
    return result;
  }
};

// 结果包装
const options3 = {
  postProcess: (result) => ({
    data: result,
    timestamp: Date.now(),
    version: '1.0'
  })
};
```

---

## 自定义变量解析器

### `customVarResolver`

**类型**: `(path: string | number, context: Context, defaultValue?: any) => any`

**默认值**: `undefined`

**说明**: 自定义 `var` 操作符的行为，可用于实现特殊的变量访问逻辑。

**示例**:

```typescript
const result = await calculator.jsonLogic(
  { var: 'user.profile.name' },
  {
    user: { id: 1 },
    profiles: {
      1: { name: 'John Doe' }
    }
  },
  {
    customVarResolver: (path, context, defaultValue) => {
      // 特殊处理：如果路径包含 'profile'，从 profiles 对象中查找
      if (typeof path === 'string' && path.includes('profile')) {
        const userId = context.user?.id;
        return context.profiles?.[userId]?.name || defaultValue;
      }
      
      // 默认行为
      return context[path] || defaultValue;
    }
  }
);
console.log(result.value); // "John Doe"
```

**实际应用场景**:

```typescript
// 实现大小写不敏感的变量访问
const caseInsensitiveResolver = (path: string, context: Context, defaultValue?: any) => {
  if (typeof path !== 'string') return context[path] || defaultValue;
  
  const lowerPath = path.toLowerCase();
  for (const key in context) {
    if (key.toLowerCase() === lowerPath) {
      return context[key];
    }
  }
  return defaultValue;
};

// 实现从多个数据源查找
const multiSourceResolver = (path: string, context: Context, defaultValue?: any) => {
  // 先从主数据源查找
  const mainValue = getNestedValue(context.main, path);
  if (mainValue !== undefined) return mainValue;
  
  // 再从备份数据源查找
  const backupValue = getNestedValue(context.backup, path);
  if (backupValue !== undefined) return backupValue;
  
  return defaultValue;
};
```

---

## 其他选项

### `clearPreviousOperators`

**类型**: `boolean`

**默认值**: `false`

**说明**: 是否在执行前清除之前注册的所有自定义操作符。

**示例**:

```typescript
// 第一次调用
await calculator.jsonLogic(expr1, ctx1, {
  customOperators: { op1: () => 'result1' }
});

// 第二次调用 - 清除之前的操作符
await calculator.jsonLogic(expr2, ctx2, {
  customOperators: { op2: () => 'result2' },
  clearPreviousOperators: true // op1 将被清除
});
```

### `maxDepth`

**类型**: `number`

**默认值**: `100`

**说明**: 最大执行深度限制，防止无限递归。

**示例**:

```typescript
// 复杂的嵌套表达式可能需要更大的深度
const result = await calculator.jsonLogic(
  deeplyNestedExpression,
  context,
  { maxDepth: 200 }
);
```

---

## 完整示例

### 综合应用示例

```typescript
import { DynamicValueCalculator } from '@aumi/dynamic-value-engine';

const calculator = new DynamicValueCalculator();

// 完整的选项配置
const options = {
  // 启用内置扩展
  builtInExtensions: true,
  
  // 自定义操作符
  customOperators: {
    // 业务相关的自定义操作符
    calculateTax: (amount: number, rate: number) => amount * rate,
    formatCurrency: (amount: number) => `¥${amount.toFixed(2)}`,
  },
  
  // 启用严格模式
  strictMode: true,
  
  // 调试模式
  debug: true,
  
  // 上下文转换
  transformContext: (ctx) => ({
    ...ctx,
    _timestamp: Date.now(),
    _version: '1.0',
  }),
  
  // 结果后处理
  postProcess: (result) => {
    if (typeof result === 'number') {
      return Number(result.toFixed(2));
    }
    return result;
  },
  
  // 最大深度
  maxDepth: 150,
};

// 执行计算
const result = await calculator.jsonLogic(
  {
    formatCurrency: [
      { calculateTax: [{ var: 'price' }, { var: 'taxRate' }] }
    ]
  },
  { price: 100, taxRate: 0.13 },
  options
);

console.log(result.value); // "¥13.00"
```

### 实战场景：订单价格计算

```typescript
const orderPricingOptions = {
  builtInExtensions: true,
  customOperators: {
    // 计算折扣后价格
    applyDiscount: (price: number, discountRate: number) => {
      return price * (1 - discountRate);
    },
    
    // 计算运费
    calculateShipping: (total: number, isFree: boolean) => {
      return isFree || total >= 100 ? 0 : 10;
    },
  },
  transformContext: (ctx) => ({
    ...ctx,
    // 添加计算字段
    subtotal: ctx.items.reduce((sum: number, item: any) => 
      sum + item.price * item.quantity, 0
    ),
    isVip: ctx.userLevel === 'vip',
  }),
  postProcess: (result) => Number(result.toFixed(2)),
  debug: false,
};

const orderExpression = {
  '+': [
    // 小计 - 折扣
    { applyDiscount: [
      { var: 'subtotal' },
      { if: [{ var: 'isVip' }, 0.1, 0] }
    ]},
    // 运费
    { calculateShipping: [
      { var: 'subtotal' },
      { '>=': [{ var: 'subtotal' }, 100] }
    ]}
  ]
};

const orderContext = {
  items: [
    { name: 'Product A', price: 50, quantity: 2 },
    { name: 'Product B', price: 30, quantity: 1 }
  ],
  userLevel: 'vip'
};

const finalPrice = await calculator.jsonLogic(
  orderExpression,
  orderContext,
  orderPricingOptions
);

console.log(finalPrice.value); // 117.00 (130 * 0.9 + 0)
```

---

## 最佳实践

1. **性能优化**：
   - 只在需要时启用 `builtInExtensions`
   - 避免在高频调用中使用 `debug` 模式
   - 合理设置 `maxDepth` 避免过深的递归

2. **安全性**：
   - 在生产环境使用 `strictMode` 确保数据完整性
   - 验证自定义操作符的输入参数
   - 使用 `transformContext` 进行数据清洗

3. **可维护性**：
   - 将常用的自定义操作符提取为独立模块
   - 使用 TypeScript 为自定义操作符添加类型
   - 编写单元测试验证操作符行为

4. **调试技巧**：
   - 使用 `debug` 模式快速定位问题
   - 利用 `postProcess` 添加日志
   - 结合 `transformContext` 打印中间状态

---

## 相关文档

- [README.md](../README.md) - 完整 API 文档
- [基础使用示例](../examples/basic-usage.ts)
- [高级使用示例](../examples/advanced-usage.ts)
