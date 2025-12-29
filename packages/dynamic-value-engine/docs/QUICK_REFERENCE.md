# 快速参考手册

## JSON Logic Engine Options

```typescript
await calculator.jsonLogic(expression, context, {
  // 📦 功能扩展
  customOperators: { myOp: (a, b) => a + b },    // 自定义操作符
  builtInExtensions: true,                        // 启用40+内置操作符
  
  // 🔍 运行模式
  strictMode: true,                               // 严格模式（变量必须存在）
  debug: true,                                    // 调试模式（输出日志）
  maxDepth: 100,                                  // 最大递归深度
  
  // 🔄 数据处理
  transformContext: (ctx) => ({ ...ctx }),        // 预处理上下文
  postProcess: (result) => result,                // 后处理结果
  customVarResolver: (path, ctx) => ctx[path],    // 自定义变量解析
  
  // 🧹 其他
  clearPreviousOperators: false,                  // 清除之前的操作符
  defaultValue: undefined,                        // 变量不存在时的默认值
});
```

## 内置扩展操作符速查（builtInExtensions: true）

### 字符串（9个）
```typescript
{ startsWith: ["hello", "he"] }           // → true
{ endsWith: ["hello", "lo"] }             // → true
{ includes: ["hello", "ll"] }             // → true
{ toUpperCase: ["hello"] }                // → "HELLO"
{ toLowerCase: ["HELLO"] }                // → "hello"
{ trim: ["  hello  "] }                   // → "hello"
{ replace: ["hello", "l", "r"] }          // → "herro"
{ split: ["a,b,c", ","] }                 // → ["a","b","c"]
{ join: [["a","b"], "-"] }                // → "a-b"
```

### 类型检查（9个）
```typescript
{ isEmpty: [""] }                         // → true
{ isNotEmpty: ["hello"] }                 // → true
{ isNull: [null] }                        // → true
{ isUndefined: [undefined] }              // → true
{ isNumber: [123] }                       // → true
{ isString: ["hello"] }                   // → true
{ isBoolean: [true] }                     // → true
{ isArray: [[1,2,3]] }                    // → true
{ isObject: [{"a":1}] }                   // → true
```

### 数组（7个）
```typescript
{ length: [[1,2,3]] }                     // → 3
{ first: [[1,2,3]] }                      // → 1
{ last: [[1,2,3]] }                       // → 3
{ reverse: [[1,2,3]] }                    // → [3,2,1]
{ unique: [[1,1,2,3]] }                   // → [1,2,3]
{ flatten: [[1,[2,3]]] }                  // → [1,2,3]
{ sort: [[3,1,2], "asc"] }                // → [1,2,3]
```

### 数学（7个）
```typescript
{ abs: [-5] }                             // → 5
{ ceil: [4.3] }                           // → 5
{ floor: [4.7] }                          // → 4
{ round: [4.567, 2] }                     // → 4.57
{ pow: [2, 3] }                           // → 8
{ sqrt: [16] }                            // → 4
{ random: [] }                            // → 0.123...
```

### 对象（4个）
```typescript
{ keys: [{"a":1,"b":2}] }                 // → ["a","b"]
{ values: [{"a":1,"b":2}] }               // → [1,2]
{ entries: [{"a":1}] }                    // → [["a",1]]
{ has: [{"a":1}, "a"] }                   // → true
```

### 其他（5个）
```typescript
{ regex: ["hello", "^h"] }                // → true
{ now: [] }                               // → 1640000000000
{ dateFormat: [1640000000000] }           // → "2021/12/20 ..."
{ default: [null, "N/A"] }                // → "N/A"
{ coalesce: [null, undefined, "ok"] }     // → "ok"
```

## Source Code Engine Options

```typescript
await calculator.sourceCode(code, context, {
  timeout: 5000,                                  // 超时时间（毫秒）
  allowedGlobals: ['Math', 'Date', 'JSON'],      // 允许的全局变量
});
```

## Template Engine Options

```typescript
await calculator.template(template, context, {
  startDelimiter: '{{',                          // 开始定界符
  endDelimiter: '}}',                            // 结束定界符
  allowFunctions: false,                         // 是否允许函数执行
});
```

## 常用代码片段

### 1. 完整配置的 JSON Logic

```typescript
const result = await calculator.jsonLogic(
  {
    and: [
      { startsWith: [{ var: 'email' }, 'admin'] },
      { '>=': [{ var: 'age' }, 18] },
      { isNotEmpty: [{ var: 'name' }] }
    ]
  },
  { email: 'admin@example.com', age: 25, name: 'John' },
  {
    builtInExtensions: true,
    strictMode: true,
    debug: true,
  }
);
```

### 2. 自定义操作符

```typescript
const result = await calculator.jsonLogic(
  { calculatePrice: [100, 0.1, 0.13] },
  {},
  {
    customOperators: {
      calculatePrice: (price: number, discount: number, tax: number) => {
        return price * (1 - discount) * (1 + tax);
      }
    }
  }
);
```

### 3. 上下文转换

```typescript
const result = await calculator.jsonLogic(
  { '>=': [{ var: 'age' }, 18] },
  { birthYear: 1990 },
  {
    transformContext: (ctx) => ({
      ...ctx,
      age: new Date().getFullYear() - ctx.birthYear
    })
  }
);
```

### 4. 结果后处理

```typescript
const result = await calculator.jsonLogic(
  { '/': [10, 3] },
  {},
  {
    postProcess: (result) => Number(result.toFixed(2))
  }
);
// result.value → 3.33
```

### 5. 自定义变量解析器

```typescript
const result = await calculator.jsonLogic(
  { var: 'user.name' },
  { users: { '123': { name: 'John' } }, currentUserId: '123' },
  {
    customVarResolver: (path, ctx) => {
      if (path === 'user.name') {
        return ctx.users[ctx.currentUserId].name;
      }
      return ctx[path];
    }
  }
);
```

## 实际应用场景

### 场景 1: 表单验证

```typescript
const validateForm = await calculator.jsonLogic({
  and: [
    { isNotEmpty: [{ var: 'username' }] },
    { '>=': [{ length: [{ var: 'username' }] }, 3] },
    { regex: [{ var: 'email' }, '^[^@]+@[^@]+\\.[^@]+$'] },
    { '>=': [{ var: 'age' }, 18] }
  ]
}, formData, { builtInExtensions: true });
```

### 场景 2: 价格计算

```typescript
const calculateTotal = await calculator.jsonLogic({
  '+': [
    { '-': [
      { var: 'subtotal' },
      { '*': [{ var: 'subtotal' }, { var: 'discount' }] }
    ]},
    { var: 'shipping' }
  ]
}, orderData);
```

### 场景 3: 权限检查

```typescript
const hasPermission = await calculator.jsonLogic({
  or: [
    { '==': [{ var: 'role' }, 'admin'] },
    { and: [
      { '==': [{ var: 'role' }, 'owner'] },
      { '==': [{ var: 'resourceOwner' }, { var: 'userId' }] }
    ]}
  ]
}, userData);
```

### 场景 4: 数据转换

```typescript
const processData = await calculator.jsonLogic({
  map: [
    { var: 'items' },
    {
      name: { toUpperCase: [{ var: 'name' }] },
      price: { round: [{ var: 'price' }, 2] },
      available: { isNotEmpty: [{ var: 'stock' }] }
    }
  ]
}, { items: [...] }, { builtInExtensions: true });
```

## 性能优化建议

1. **只在需要时启用内置扩展**
   ```typescript
   // ❌ 不好 - 每次都启用
   await calculator.jsonLogic(expr, ctx, { builtInExtensions: true });
   
   // ✅ 好 - 只在需要时启用
   if (needsExtensions) {
     await calculator.jsonLogic(expr, ctx, { builtInExtensions: true });
   }
   ```

2. **避免在循环中启用调试模式**
   ```typescript
   // ❌ 不好
   for (const item of items) {
     await calculator.jsonLogic(expr, item, { debug: true });
   }
   
   // ✅ 好
   const debug = process.env.NODE_ENV === 'development';
   for (const item of items) {
     await calculator.jsonLogic(expr, item, { debug });
   }
   ```

3. **复用自定义操作符**
   ```typescript
   // ❌ 不好 - 每次创建新对象
   for (const item of items) {
     await calculator.jsonLogic(expr, item, {
       customOperators: { myOp: () => {} }
     });
   }
   
   // ✅ 好 - 复用配置
   const options = {
     customOperators: { myOp: () => {} }
   };
   for (const item of items) {
     await calculator.jsonLogic(expr, item, options);
   }
   ```

4. **使用并行计算**
   ```typescript
   // ❌ 不好 - 串行
   const results = [];
   for (const item of items) {
     results.push(await calculator.jsonLogic(expr, item));
   }
   
   // ✅ 好 - 并行
   const results = await calculator.calculateParallel(
     items.map(item => ({ type: EngineType.JSON_LOGIC, expression: expr, context: item }))
   );
   ```

## 常见问题

### Q: 如何判断是否需要 builtInExtensions？

A: 如果你的表达式使用了以下操作符之一，就需要启用：
- 字符串：`startsWith`, `endsWith`, `includes`, `trim`, `split`, `join` 等
- 类型检查：`isEmpty`, `isNumber`, `isString`, `isArray` 等
- 数组：`first`, `last`, `unique`, `flatten` 等
- 数学：`abs`, `ceil`, `floor`, `round`, `pow`, `sqrt` 等

### Q: strictMode 和 debug 可以同时使用吗？

A: 可以！它们是独立的选项：
```typescript
{
  strictMode: true,  // 确保数据完整性
  debug: true,       // 查看执行过程
}
```

### Q: customVarResolver 会影响性能吗？

A: 会有轻微影响，但通常可以忽略。如果需要高性能，建议在 `transformContext` 中预处理数据。

### Q: 如何同时使用自定义操作符和内置扩展？

A: 直接同时启用即可，它们不冲突：
```typescript
{
  builtInExtensions: true,
  customOperators: {
    myOp: () => {}
  }
}
```

## 相关文档

- 📖 [JSON Logic Options 详细说明](./JSON_LOGIC_OPTIONS.md)
- 📊 [所有引擎 Options 汇总](./OPTIONS_SUMMARY.md)
- 📝 [完整 README](../README.md)
- 💡 [使用示例](../examples/)
