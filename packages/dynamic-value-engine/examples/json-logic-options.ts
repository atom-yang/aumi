/**
 * JSON Logic Engine Options 使用示例
 * 展示所有可用的 options 配置
 */

import { DynamicValueCalculator, JsonLogicOptions } from '../src';

const calculator = new DynamicValueCalculator();

console.log('=== JSON Logic Engine Options 示例 ===\n');

// ============================================
// 1. 自定义操作符
// ============================================
async function customOperatorsExample() {
  console.log('1. 自定义操作符示例');

  const options: JsonLogicOptions = {
    customOperators: {
      // 字符串操作
      reverse: (str: string) => str.split('').reverse().join(''),
      slugify: (str: string) => str.toLowerCase().replace(/\s+/g, '-'),
      
      // 数学运算
      square: (n: number) => n * n,
      cube: (n: number) => n * n * n,
      
      // 业务逻辑
      calculateDiscount: (price: number, level: string) => {
        const discounts: Record<string, number> = {
          vip: 0.8,
          gold: 0.85,
          silver: 0.9,
          normal: 1,
        };
        return price * (discounts[level] || 1);
      },
    },
  };

  const result1 = await calculator.jsonLogic(
    { reverse: ['hello'] },
    {},
    options
  );
  console.log('  reverse("hello"):', result1.value); // "olleh"

  const result2 = await calculator.jsonLogic(
    { slugify: ['Hello World'] },
    {},
    options
  );
  console.log('  slugify("Hello World"):', result2.value); // "hello-world"

  const result3 = await calculator.jsonLogic(
    { calculateDiscount: [100, 'vip'] },
    {},
    options
  );
  console.log('  calculateDiscount(100, "vip"):', result3.value); // 80
  console.log();
}

// ============================================
// 2. 内置扩展操作符
// ============================================
async function builtInExtensionsExample() {
  console.log('2. 内置扩展操作符示例');

  const options: JsonLogicOptions = {
    builtInExtensions: true,
  };

  // 字符串操作
  const result1 = await calculator.jsonLogic(
    {
      and: [
        { startsWith: [{ var: 'email' }, 'admin'] },
        { includes: [{ var: 'email' }, '@'] },
        { endsWith: [{ var: 'email' }, '.com'] },
      ],
    },
    { email: 'admin@company.com' },
    options
  );
  console.log('  字符串检查:', result1.value); // true

  // 数组操作
  const result2 = await calculator.jsonLogic(
    {
      length: [{ unique: [{ var: 'items' }] }],
    },
    { items: [1, 2, 2, 3, 3, 3] },
    options
  );
  console.log('  唯一值数量:', result2.value); // 3

  // 类型检查
  const result3 = await calculator.jsonLogic(
    {
      and: [
        { isString: [{ var: 'name' }] },
        { isNumber: [{ var: 'age' }] },
        { isNotEmpty: [{ var: 'name' }] },
      ],
    },
    { name: 'John', age: 25 },
    options
  );
  console.log('  类型验证:', result3.value); // true

  // 数学操作
  const result4 = await calculator.jsonLogic(
    { round: [{ sqrt: [{ pow: [5, 2] }] }, 2] },
    {},
    options
  );
  console.log('  数学运算 round(sqrt(5^2)):', result4.value); // 5

  console.log();
}

// ============================================
// 3. 严格模式
// ============================================
async function strictModeExample() {
  console.log('3. 严格模式示例');

  // 正常模式 - 变量不存在返回 undefined
  const result1 = await calculator.jsonLogic(
    { var: 'nonexistent' },
    { name: 'John' },
    { strictMode: false }
  );
  console.log('  正常模式 - 不存在的变量:', result1.value); // undefined

  // 严格模式 - 变量不存在抛出错误
  try {
    await calculator.jsonLogic(
      { var: 'nonexistent' },
      { name: 'John' },
      { strictMode: true }
    );
  } catch (error) {
    console.log('  严格模式 - 错误:', (error as Error).message);
  }

  console.log();
}

// ============================================
// 4. 调试模式
// ============================================
async function debugModeExample() {
  console.log('4. 调试模式示例');

  const result = await calculator.jsonLogic(
    {
      and: [
        { '>=': [{ var: 'age' }, 18] },
        { '<=': [{ var: 'age' }, 65] },
      ],
    },
    { age: 30 },
    {
      debug: true, // 启用调试模式
      builtInExtensions: true,
    }
  );

  console.log('  计算结果:', result.value);
  console.log('  (查看上方的调试日志输出)\n');
}

// ============================================
// 5. 上下文转换
// ============================================
async function transformContextExample() {
  console.log('5. 上下文转换示例');

  const options: JsonLogicOptions = {
    transformContext: (ctx) => {
      console.log('  原始上下文:', ctx);
      
      // 添加计算字段
      const transformed = {
        ...ctx,
        fullName: `${ctx.firstName} ${ctx.lastName}`,
        age: new Date().getFullYear() - ctx.birthYear,
        _processedAt: Date.now(),
      };
      
      console.log('  转换后上下文:', transformed);
      return transformed;
    },
  };

  const result = await calculator.jsonLogic(
    {
      and: [
        { '>=': [{ var: 'age' }, 18] },
        { '!=': [{ var: 'fullName' }, ''] },
      ],
    },
    { firstName: 'John', lastName: 'Doe', birthYear: 1990 },
    options
  );

  console.log('  结果:', result.value);
  console.log();
}

// ============================================
// 6. 结果后处理
// ============================================
async function postProcessExample() {
  console.log('6. 结果后处理示例');

  // 数字格式化
  const result1 = await calculator.jsonLogic(
    { '/': [{ var: 'a' }, { var: 'b' }] },
    { a: 10, b: 3 },
    {
      postProcess: (result) => {
        console.log('  原始结果:', result);
        const formatted = Number(result.toFixed(2));
        console.log('  格式化后:', formatted);
        return formatted;
      },
    }
  );
  console.log('  最终结果:', result1.value); // 3.33

  // 布尔值转换
  const result2 = await calculator.jsonLogic(
    { '>=': [{ var: 'age' }, 18] },
    { age: 25 },
    {
      postProcess: (result) => {
        return result ? 'adult' : 'minor';
      },
    }
  );
  console.log('  布尔转文本:', result2.value); // "adult"

  console.log();
}

// ============================================
// 7. 自定义变量解析器
// ============================================
async function customVarResolverExample() {
  console.log('7. 自定义变量解析器示例');

  const options: JsonLogicOptions = {
    customVarResolver: (path, context, defaultValue) => {
      console.log(`  解析变量: ${path}`);
      
      // 特殊处理：environment 前缀从环境变量中读取
      if (typeof path === 'string' && path.startsWith('env.')) {
        const envVar = path.substring(4);
        return process.env[envVar] || defaultValue;
      }
      
      // 特殊处理：config 前缀从配置对象读取
      if (typeof path === 'string' && path.startsWith('config.')) {
        const configKey = path.substring(7);
        return (context as any)._config?.[configKey] || defaultValue;
      }
      
      // 默认行为
      const keys = String(path).split('.');
      let value: any = context;
      for (const key of keys) {
        if (value == null) return defaultValue;
        value = value[key];
      }
      return value ?? defaultValue;
    },
  };

  const result = await calculator.jsonLogic(
    {
      cat: [
        { var: 'config.appName' },
        ' - ',
        { var: 'user.name' },
      ],
    },
    {
      user: { name: 'John' },
      _config: { appName: 'MyApp' },
    },
    options
  );

  console.log('  结果:', result.value); // "MyApp - John"
  console.log();
}

// ============================================
// 8. 综合应用：订单价格计算
// ============================================
async function comprehensiveExample() {
  console.log('8. 综合应用：订单价格计算');

  const orderPricingOptions: JsonLogicOptions = {
    // 启用内置扩展
    builtInExtensions: true,

    // 自定义业务操作符
    customOperators: {
      sumItems: (items: Array<{ price: number; quantity: number }>) => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      
      getDiscountRate: (level: string) => {
        const rates: Record<string, number> = {
          vip: 0.15,
          gold: 0.1,
          silver: 0.05,
          normal: 0,
        };
        return rates[level] || 0;
      },
      
      calculateShipping: (total: number, address: any) => {
        if (total >= 100) return 0; // 满100免运费
        if (address.city === 'Beijing') return 5; // 本地配送便宜
        return 10; // 其他地区
      },
    },

    // 上下文转换：添加计算字段
    transformContext: (ctx) => ({
      ...ctx,
      subtotal: ctx.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      ),
      itemCount: ctx.items.reduce(
        (count: number, item: any) => count + item.quantity,
        0
      ),
      _timestamp: Date.now(),
    }),

    // 结果后处理：保留两位小数
    postProcess: (result) => {
      return typeof result === 'number' ? Number(result.toFixed(2)) : result;
    },

    debug: false,
  };

  // 订单价格计算表达式
  const orderExpression = {
    '+': [
      // 小计 - 折扣
      {
        '-': [
          { var: 'subtotal' },
          {
            '*': [
              { var: 'subtotal' },
              { getDiscountRate: [{ var: 'user.level' }] },
            ],
          },
        ],
      },
      // 运费
      {
        calculateShipping: [
          { var: 'subtotal' },
          { var: 'address' },
        ],
      },
    ],
  };

  const orderContext = {
    items: [
      { name: 'Product A', price: 50, quantity: 2 },
      { name: 'Product B', price: 30, quantity: 1 },
    ],
    user: { level: 'vip', name: 'John' },
    address: { city: 'Shanghai', street: 'Main St' },
  };

  const result = await calculator.jsonLogic(
    orderExpression,
    orderContext,
    orderPricingOptions
  );

  console.log('  订单详情:');
  console.log('    - 商品1: Product A x2 = ¥100');
  console.log('    - 商品2: Product B x1 = ¥30');
  console.log('    - 小计: ¥130');
  console.log('    - VIP折扣 (15%): -¥19.5');
  console.log('    - 运费: ¥0 (满100免运费)');
  console.log('  最终价格:', `¥${result.value}`); // 110.5
  console.log();
}

// ============================================
// 9. 内置扩展操作符完整展示
// ============================================
async function showcaseAllBuiltInOperators() {
  console.log('9. 内置扩展操作符完整展示');

  const options: JsonLogicOptions = {
    builtInExtensions: true,
  };

  const tests = [
    // 字符串操作
    { expr: { toUpperCase: ['hello'] }, expected: 'HELLO', desc: 'toUpperCase' },
    { expr: { toLowerCase: ['HELLO'] }, expected: 'hello', desc: 'toLowerCase' },
    { expr: { trim: ['  hello  '] }, expected: 'hello', desc: 'trim' },
    { expr: { replace: ['hello', 'l', 'r'] }, expected: 'herro', desc: 'replace' },
    { expr: { split: ['a,b,c', ','] }, expected: ['a', 'b', 'c'], desc: 'split' },
    { expr: { join: [['a', 'b'], '-'] }, expected: 'a-b', desc: 'join' },

    // 类型检查
    { expr: { isEmpty: [''] }, expected: true, desc: 'isEmpty' },
    { expr: { isNotEmpty: ['hello'] }, expected: true, desc: 'isNotEmpty' },
    { expr: { isNumber: [123] }, expected: true, desc: 'isNumber' },
    { expr: { isString: ['hello'] }, expected: true, desc: 'isString' },
    { expr: { isArray: [[1, 2, 3]] }, expected: true, desc: 'isArray' },

    // 数组操作
    { expr: { first: [[1, 2, 3]] }, expected: 1, desc: 'first' },
    { expr: { last: [[1, 2, 3]] }, expected: 3, desc: 'last' },
    { expr: { reverse: [[1, 2, 3]] }, expected: [3, 2, 1], desc: 'reverse' },
    { expr: { unique: [[1, 1, 2, 3]] }, expected: [1, 2, 3], desc: 'unique' },
    { expr: { length: [[1, 2, 3]] }, expected: 3, desc: 'length' },

    // 数学操作
    { expr: { abs: [-5] }, expected: 5, desc: 'abs' },
    { expr: { ceil: [4.3] }, expected: 5, desc: 'ceil' },
    { expr: { floor: [4.7] }, expected: 4, desc: 'floor' },
    { expr: { round: [4.567, 2] }, expected: 4.57, desc: 'round' },
    { expr: { pow: [2, 3] }, expected: 8, desc: 'pow' },
    { expr: { sqrt: [16] }, expected: 4, desc: 'sqrt' },

    // 对象操作
    { expr: { keys: [{ a: 1, b: 2 }] }, expected: ['a', 'b'], desc: 'keys' },
    { expr: { values: [{ a: 1, b: 2 }] }, expected: [1, 2], desc: 'values' },
    { expr: { has: [{ a: 1 }, 'a'] }, expected: true, desc: 'has' },

    // 其他
    { expr: { default: [null, 'N/A'] }, expected: 'N/A', desc: 'default' },
    { expr: { coalesce: [null, undefined, 'ok'] }, expected: 'ok', desc: 'coalesce' },
    { expr: { regex: ['hello', '^h'] }, expected: true, desc: 'regex' },
  ];

  for (const test of tests) {
    const result = await calculator.jsonLogic(test.expr, {}, options);
    const passed = JSON.stringify(result.value) === JSON.stringify(test.expected);
    console.log(
      `  ${passed ? '✓' : '✗'} ${test.desc}: ${JSON.stringify(result.value)}`
    );
  }

  console.log();
}

// ============================================
// 运行所有示例
// ============================================
async function runAll() {
  await customOperatorsExample();
  await builtInExtensionsExample();
  await strictModeExample();
  await debugModeExample();
  await transformContextExample();
  await postProcessExample();
  await customVarResolverExample();
  await comprehensiveExample();
  await showcaseAllBuiltInOperators();

  console.log('=== 所有示例执行完成 ===');
}

runAll().catch(console.error);
