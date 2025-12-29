# 所有引擎的 Options 配置汇总

本文档汇总了所有引擎可用的 options 配置。

## 目录

- [JSON Logic Engine](#json-logic-engine)
- [JSON Rule Engine](#json-rule-engine)
- [Source Code Engine](#source-code-engine)
- [Template Engine](#template-engine)

---

## JSON Logic Engine

### JsonLogicOptions

```typescript
interface JsonLogicOptions {
  // 自定义操作符
  customOperators?: Record<string, (...args: any[]) => any>;
  
  // 启用内置扩展操作符（40+）
  builtInExtensions?: boolean; // default: false
  
  // 严格模式
  strictMode?: boolean; // default: false
  
  // 变量不存在时的默认值
  defaultValue?: any; // default: undefined
  
  // 上下文转换函数
  transformContext?: (context: Context) => Context;
  
  // 调试模式
  debug?: boolean; // default: false
  
  // 自定义变量解析器
  customVarResolver?: (path: string | number, context: Context, defaultValue?: any) => any;
  
  // 结果后处理函数
  postProcess?: (result: any) => any;
  
  // 清除之前注册的操作符
  clearPreviousOperators?: boolean; // default: false
  
  // 最大执行深度
  maxDepth?: number; // default: 100
}
```

### 使用示例

```typescript
const result = await calculator.jsonLogic(
  expression,
  context,
  {
    builtInExtensions: true,
    customOperators: {
      myOp: (a, b) => a + b
    },
    strictMode: true,
    debug: true,
  }
);
```

### 内置扩展操作符列表

当 `builtInExtensions: true` 时，以下 40+ 操作符自动可用：

#### 字符串操作（9个）
- `startsWith(str, prefix)` - 检查字符串开头
- `endsWith(str, suffix)` - 检查字符串结尾
- `includes(str, substr)` - 检查是否包含子串
- `toUpperCase(str)` - 转大写
- `toLowerCase(str)` - 转小写
- `trim(str)` - 去除首尾空格
- `replace(str, search, replace)` - 替换字符串
- `split(str, separator)` - 分割字符串
- `join(array, separator)` - 连接数组为字符串

#### 类型检查（9个）
- `isEmpty(value)` - 检查是否为空
- `isNotEmpty(value)` - 检查是否非空
- `isNull(value)` - 是否为 null
- `isUndefined(value)` - 是否为 undefined
- `isNumber(value)` - 是否为数字
- `isString(value)` - 是否为字符串
- `isBoolean(value)` - 是否为布尔值
- `isArray(value)` - 是否为数组
- `isObject(value)` - 是否为对象

#### 数组操作（7个）
- `length(value)` - 获取长度
- `first(array)` - 获取第一个元素
- `last(array)` - 获取最后一个元素
- `reverse(array)` - 反转数组
- `unique(array)` - 去重
- `flatten(array)` - 扁平化
- `sort(array, order?)` - 排序

#### 数学操作（7个）
- `abs(num)` - 绝对值
- `ceil(num)` - 向上取整
- `floor(num)` - 向下取整
- `round(num, decimals?)` - 四舍五入
- `pow(base, exponent)` - 幂运算
- `sqrt(num)` - 平方根
- `random()` - 随机数

#### 对象操作（4个）
- `keys(obj)` - 获取所有键
- `values(obj)` - 获取所有值
- `entries(obj)` - 获取键值对数组
- `has(obj, key)` - 检查是否有某个键

#### 其他操作（5个）
- `regex(str, pattern, flags?)` - 正则匹配
- `now()` - 当前时间戳
- `dateFormat(timestamp, locale?)` - 格式化日期
- `default(value, defaultValue)` - 默认值
- `coalesce(...values)` - 返回第一个非空值

📖 详细文档：[JSON Logic Options](./JSON_LOGIC_OPTIONS.md)

---

## JSON Rule Engine

### JsonRuleEngineOptions

JSON Rule Engine 使用标准的 json-rules-engine 配置，通过 `options` 传递：

```typescript
interface JsonRuleEngineOptions {
  // 自定义操作符
  customOperators?: Record<string, any>;
  
  // 其他 json-rules-engine 配置
  [key: string]: any;
}
```

### 使用示例

```typescript
const result = await calculator.jsonRuleEngine(
  rules,
  context,
  {
    customOperators: {
      myOperator: (factValue, jsonValue) => {
        return factValue === jsonValue;
      }
    }
  }
);
```

### 标准操作符

- `equal` / `notEqual`
- `greaterThan` / `greaterThanInclusive`
- `lessThan` / `lessThanInclusive`
- `in` / `notIn`
- `contains` / `doesNotContain`

---

## Source Code Engine

### SourceCodeOptions

```typescript
interface SourceCodeOptions {
  // 超时时间（毫秒）
  timeout?: number; // default: 5000
  
  // 允许的全局变量白名单
  allowedGlobals?: string[]; // default: ['Math', 'Date', 'String', ...]
}
```

### 默认允许的全局变量

```typescript
[
  'Math',
  'Date',
  'String',
  'Number',
  'Boolean',
  'Array',
  'Object',
  'JSON'
]
```

### 使用示例

```typescript
const result = await calculator.sourceCode(
  'return context.price * context.quantity',
  { price: 100, quantity: 2 },
  {
    timeout: 10000, // 10秒超时
    allowedGlobals: ['Math', 'Date', 'JSON'] // 只允许这些全局变量
  }
);
```

### 安全说明

- 代码在沙箱环境中执行
- 超时自动终止
- 只能访问白名单中的全局变量
- 无法访问 Node.js 敏感 API（如 fs, process 等）

---

## Template Engine

### TemplateOptions

```typescript
interface TemplateOptions {
  // 开始定界符
  startDelimiter?: string; // default: '{{'
  
  // 结束定界符
  endDelimiter?: string; // default: '}}'
  
  // 是否允许执行函数
  allowFunctions?: boolean; // default: false
}
```

### 使用示例

```typescript
// 基础用法
const result1 = await calculator.template(
  'Hello {{name}}',
  { name: 'John' }
);

// 自定义定界符
const result2 = await calculator.template(
  'Hello <%= name %>',
  { name: 'John' },
  {
    startDelimiter: '<%=',
    endDelimiter: '%>'
  }
);

// 允许函数执行
const result3 = await calculator.template(
  'Total: {{price * quantity}}',
  { price: 10, quantity: 5 },
  {
    allowFunctions: true
  }
);
```

### 支持的语法

1. **变量访问**：`{{name}}`
2. **嵌套访问**：`{{user.profile.email}}`
3. **简单表达式**：`{{a + b}}`（需要 `allowFunctions: false` 或简单运算）
4. **复杂表达式**：`{{user.age >= 18 ? 'adult' : 'minor'}}`（需要 `allowFunctions: true`）

---

## 完整示例

### 综合使用所有 Options

```typescript
import {
  DynamicValueCalculator,
  JsonLogicOptions,
  SourceCodeOptions,
  TemplateOptions,
} from '@aumi/dynamic-value-engine';

const calculator = new DynamicValueCalculator();

// JSON Logic with full options
const logicOptions: JsonLogicOptions = {
  builtInExtensions: true,
  customOperators: {
    multiply: (a, b) => a * b,
  },
  strictMode: true,
  debug: true,
  transformContext: (ctx) => ({
    ...ctx,
    _now: Date.now(),
  }),
  postProcess: (result) => {
    return typeof result === 'number' ? result.toFixed(2) : result;
  },
  maxDepth: 150,
};

const result1 = await calculator.jsonLogic(
  { multiply: [{ var: 'a' }, { var: 'b' }] },
  { a: 10, b: 20 },
  logicOptions
);

// Source Code with options
const codeOptions: SourceCodeOptions = {
  timeout: 10000,
  allowedGlobals: ['Math', 'Date'],
};

const result2 = await calculator.sourceCode(
  'return Math.round(context.price * 1.13)',
  { price: 100 },
  codeOptions
);

// Template with options
const templateOptions: TemplateOptions = {
  startDelimiter: '<%=',
  endDelimiter: '%>',
  allowFunctions: true,
};

const result3 = await calculator.template(
  'Total: <%= price * quantity %>',
  { price: 50, quantity: 3 },
  templateOptions
);
```

---

## 快速参考表

| 引擎 | 主要 Options | 默认值 | 说明 |
|------|--------------|--------|------|
| JSON Logic | `builtInExtensions` | `false` | 启用40+内置操作符 |
| JSON Logic | `customOperators` | `{}` | 自定义操作符 |
| JSON Logic | `strictMode` | `false` | 严格模式 |
| JSON Logic | `debug` | `false` | 调试模式 |
| JSON Logic | `maxDepth` | `100` | 最大深度 |
| Source Code | `timeout` | `5000` | 超时时间(ms) |
| Source Code | `allowedGlobals` | `[...]` | 允许的全局变量 |
| Template | `startDelimiter` | `'{{'` | 开始定界符 |
| Template | `endDelimiter` | `'}}'` | 结束定界符 |
| Template | `allowFunctions` | `false` | 允许函数执行 |

---

## 相关文档

- [JSON Logic Options 详细说明](./JSON_LOGIC_OPTIONS.md) - JSON Logic 完整配置指南
- [README.md](../README.md) - 项目主文档
- [示例代码](../examples/) - 实际使用示例
