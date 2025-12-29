# JSON Logic Engine Options 功能总结

## 概述

JsonLogicEngine 现在支持 **11 种** options 配置，包括 **40+ 个**内置扩展操作符，极大增强了 JSON Logic 的功能。

## 🎯 核心 Options

### 1. `customOperators` - 自定义操作符

**用途**: 扩展 JSON Logic 的功能，添加业务相关的操作符

**示例**:
```typescript
{
  customOperators: {
    startsWith: (str, prefix) => str.startsWith(prefix),
    calculateDiscount: (price, level) => price * discountRate[level],
  }
}
```

### 2. `builtInExtensions` - 内置扩展操作符

**用途**: 一键启用 40+ 个常用操作符

**包含操作符**:
- 9 个字符串操作
- 9 个类型检查
- 7 个数组操作
- 7 个数学操作
- 4 个对象操作
- 5 个其他操作

**示例**:
```typescript
{
  builtInExtensions: true
}
```

### 3. `strictMode` - 严格模式

**用途**: 确保所有变量都存在于上下文中

**示例**:
```typescript
{
  strictMode: true  // 访问不存在的变量会抛出错误
}
```

### 4. `debug` - 调试模式

**用途**: 输出详细的执行日志

**示例**:
```typescript
{
  debug: true  // 输出 expression、context、result
}
```

### 5. `transformContext` - 上下文转换

**用途**: 在执行前预处理上下文数据

**示例**:
```typescript
{
  transformContext: (ctx) => ({
    ...ctx,
    _timestamp: Date.now(),
    fullName: `${ctx.firstName} ${ctx.lastName}`
  })
}
```

### 6. `postProcess` - 结果后处理

**用途**: 在返回前处理计算结果

**示例**:
```typescript
{
  postProcess: (result) => {
    return typeof result === 'number' ? result.toFixed(2) : result;
  }
}
```

### 7. `customVarResolver` - 自定义变量解析器

**用途**: 自定义变量访问逻辑

**示例**:
```typescript
{
  customVarResolver: (path, context, defaultValue) => {
    // 实现自定义的变量访问逻辑
    return customGet(context, path, defaultValue);
  }
}
```

### 8. `maxDepth` - 最大执行深度

**用途**: 防止无限递归

**默认值**: 100

**示例**:
```typescript
{
  maxDepth: 150  // 允许更深的嵌套
}
```

### 9. `clearPreviousOperators` - 清除之前的操作符

**用途**: 清除之前注册的自定义操作符

**示例**:
```typescript
{
  clearPreviousOperators: true
}
```

### 10. `defaultValue` - 默认值

**用途**: 变量不存在时的默认返回值

**示例**:
```typescript
{
  defaultValue: 'N/A'
}
```

## 📊 内置扩展操作符完整列表

启用 `builtInExtensions: true` 后可用：

### 字符串操作（9个）
1. `startsWith(str, prefix)` - 检查开头
2. `endsWith(str, suffix)` - 检查结尾
3. `includes(str, substr)` - 包含检查
4. `toUpperCase(str)` - 转大写
5. `toLowerCase(str)` - 转小写
6. `trim(str)` - 去除空格
7. `replace(str, search, replace)` - 替换
8. `split(str, separator)` - 分割
9. `join(array, separator)` - 连接

### 类型检查（9个）
1. `isEmpty(value)` - 是否为空
2. `isNotEmpty(value)` - 是否非空
3. `isNull(value)` - 是否为 null
4. `isUndefined(value)` - 是否为 undefined
5. `isNumber(value)` - 是否为数字
6. `isString(value)` - 是否为字符串
7. `isBoolean(value)` - 是否为布尔值
8. `isArray(value)` - 是否为数组
9. `isObject(value)` - 是否为对象

### 数组操作（7个）
1. `length(value)` - 获取长度
2. `first(array)` - 第一个元素
3. `last(array)` - 最后一个元素
4. `reverse(array)` - 反转
5. `unique(array)` - 去重
6. `flatten(array)` - 扁平化
7. `sort(array, order?)` - 排序

### 数学操作（7个）
1. `abs(num)` - 绝对值
2. `ceil(num)` - 向上取整
3. `floor(num)` - 向下取整
4. `round(num, decimals?)` - 四舍五入
5. `pow(base, exponent)` - 幂运算
6. `sqrt(num)` - 平方根
7. `random()` - 随机数

### 对象操作（4个）
1. `keys(obj)` - 获取键数组
2. `values(obj)` - 获取值数组
3. `entries(obj)` - 获取键值对数组
4. `has(obj, key)` - 检查键是否存在

### 其他操作（5个）
1. `regex(str, pattern, flags?)` - 正则匹配
2. `now()` - 当前时间戳
3. `dateFormat(timestamp, locale?)` - 日期格式化
4. `default(value, defaultValue)` - 默认值
5. `coalesce(...values)` - 返回第一个非空值

## 💡 使用建议

### 1. 基础使用（最简单）
```typescript
const result = await calculator.jsonLogic(expression, context);
```

### 2. 启用内置扩展
```typescript
const result = await calculator.jsonLogic(
  expression, 
  context, 
  { builtInExtensions: true }
);
```

### 3. 完整配置（生产环境推荐）
```typescript
const result = await calculator.jsonLogic(
  expression,
  context,
  {
    builtInExtensions: true,
    strictMode: true,
    transformContext: (ctx) => enrichContext(ctx),
    postProcess: (result) => formatResult(result),
    maxDepth: 100,
  }
);
```

### 4. 开发调试
```typescript
const result = await calculator.jsonLogic(
  expression,
  context,
  {
    debug: true,
    builtInExtensions: true,
  }
);
```

## 📈 对比表

| 功能 | 不使用 Options | 使用 Options |
|------|---------------|--------------|
| 可用操作符 | 标准 JSON Logic（约15个） | 55+ 个操作符 |
| 变量验证 | 无 | 严格模式可选 |
| 调试能力 | 无 | 详细日志输出 |
| 上下文处理 | 原始数据 | 可预处理/后处理 |
| 自定义扩展 | 较复杂 | 简单配置即可 |

## 🎯 典型应用场景

### 场景 1: 表单验证
```typescript
{
  builtInExtensions: true,
  strictMode: true,
}
```

### 场景 2: 数据处理管道
```typescript
{
  builtInExtensions: true,
  transformContext: preprocessData,
  postProcess: formatOutput,
}
```

### 场景 3: 业务规则引擎
```typescript
{
  builtInExtensions: true,
  customOperators: businessRules,
  strictMode: true,
}
```

### 场景 4: 开发调试
```typescript
{
  debug: true,
  builtInExtensions: true,
}
```

## 📖 详细文档

- 📘 [JSON Logic Options 完整文档](./docs/JSON_LOGIC_OPTIONS.md) - 所有 options 的详细说明和示例
- 📗 [快速参考手册](./docs/QUICK_REFERENCE.md) - 常用配置速查
- 📙 [Options 汇总](./docs/OPTIONS_SUMMARY.md) - 所有引擎的 options 对比
- 💻 [Options 示例代码](./examples/json-logic-options.ts) - 可运行的完整示例

## 🚀 快速开始

```bash
# 查看示例
npx ts-node examples/json-logic-options.ts

# 安装依赖
pnpm install

# 构建
pnpm build
```

---

**提示**: 推荐在生产环境中使用 `strictMode: true` 以确保数据完整性，在开发环境中使用 `debug: true` 以便调试。
