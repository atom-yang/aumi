/**
 * 高级使用示例
 */

import {
  DynamicValueCalculator,
  EngineType,
  JsonLogicEngine,
} from '../src';

async function advancedExamples() {
  const calculator = new DynamicValueCalculator();

  console.log('=== 高级使用示例 ===\n');

  // 1. 批量计算
  console.log('1. 批量计算示例');
  const batchResults = await calculator.calculateBatch([
    {
      type: EngineType.JSON_LOGIC,
      expression: { '==': [{ var: 'status' }, 'active'] },
      context: { status: 'active' },
    },
    {
      type: EngineType.TEMPLATE,
      expression: 'User: {{name}}',
      context: { name: 'Alice' },
    },
    {
      type: EngineType.SOURCE_CODE,
      expression: 'return context.a + context.b',
      context: { a: 10, b: 20 },
    },
  ]);

  batchResults.forEach((result, index) => {
    console.log(`  结果 ${index + 1}:`, result.value);
  });
  console.log();

  // 2. 并行计算
  console.log('2. 并行计算示例');
  const startTime = Date.now();
  const parallelResults = await calculator.calculateParallel([
    {
      type: EngineType.SOURCE_CODE,
      expression: 'return context.x * 2',
      context: { x: 5 },
    },
    {
      type: EngineType.SOURCE_CODE,
      expression: 'return context.y * 3',
      context: { y: 10 },
    },
    {
      type: EngineType.SOURCE_CODE,
      expression: 'return context.z * 4',
      context: { z: 15 },
    },
  ]);
  const endTime = Date.now();

  parallelResults.forEach((result, index) => {
    console.log(`  结果 ${index + 1}:`, result.value);
  });
  console.log(`  总执行时间: ${endTime - startTime}ms\n`);

  // 3. 自定义操作符
  console.log('3. 自定义操作符示例');
  const jsonLogicEngine = calculator.getEngine(
    EngineType.JSON_LOGIC
  ) as JsonLogicEngine;

  // 添加自定义操作符：检查字符串是否包含子串
  jsonLogicEngine.addCustomOperator(
    'contains',
    (str: string, substr: string) => {
      return str.includes(substr);
    }
  );

  const customOpResult = await calculator.jsonLogic({
    contains: [{ var: 'email' }, '@gmail.com'],
  }, { email: 'user@gmail.com' });

  console.log('  结果:', customOpResult.value); // true
  console.log();

  // 4. 上下文管理
  console.log('4. 上下文管理示例');
  const contextManager = calculator.getContextManager();

  // 设置全局上下文
  contextManager.setGlobalContext({
    companyName: 'ACME Corp',
    website: 'www.acme.com',
  });

  // 使用局部上下文（优先级更高）
  const contextResult = await calculator.template(
    'Company: {{companyName}}, Product: {{product}}',
    { product: 'Widget' } // 局部上下文
  );

  console.log('  结果:', contextResult.value);
  console.log();

  // 5. 嵌套路径访问
  console.log('5. 嵌套路径访问示例');
  contextManager.setGlobalContext({
    user: {
      profile: {
        name: 'John Doe',
        contact: {
          email: 'john@example.com',
          phone: '123-456-7890',
        },
      },
    },
  });

  const nestedValue = contextManager.getValue('user.profile.contact.email');
  console.log('  Email:', nestedValue);
  console.log();

  // 6. 多规则执行
  console.log('6. 多规则执行示例');
  const multiRuleResult = await calculator.jsonRuleEngine(
    [
      {
        conditions: {
          all: [{ fact: 'score', operator: 'greaterThanInclusive', value: 90 }],
        },
        event: { type: 'grade', params: { grade: 'A' } },
      },
      {
        conditions: {
          all: [
            { fact: 'score', operator: 'greaterThanInclusive', value: 80 },
            { fact: 'score', operator: 'lessThan', value: 90 },
          ],
        },
        event: { type: 'grade', params: { grade: 'B' } },
      },
    ],
    { score: 85 }
  );

  console.log('  结果:', multiRuleResult.value);
  console.log();

  // 7. 复杂的模板表达式
  console.log('7. 复杂的模板表达式示例');
  const complexTemplate = await calculator.template(
    `
订单摘要：
- 商品：{{product.name}}
- 单价：${{product.price}}
- 数量：{{quantity}}
- 小计：${{product.price * quantity}}
- 税费：${{product.price * quantity * 0.1}}
- 总计：${{product.price * quantity * 1.1}}
    `.trim(),
    {
      product: { name: 'Laptop', price: 999 },
      quantity: 2,
    }
  );

  console.log('结果:\n', complexTemplate.value);
  console.log();
}

// 运行示例
advancedExamples().catch(console.error);
