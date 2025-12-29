/**
 * 基础使用示例
 */

import { DynamicValueCalculator, EngineType } from '../src';

async function basicExamples() {
  // 创建计算器实例
  const calculator = new DynamicValueCalculator({
    // 全局上下文
    currency: 'USD',
    taxRate: 0.1,
  });

  console.log('=== 基础使用示例 ===\n');

  // 1. JSON Logic 示例
  console.log('1. JSON Logic - 年龄验证');
  const logicResult = await calculator.jsonLogic(
    {
      and: [
        { '>=': [{ var: 'age' }, 18] },
        { '<=': [{ var: 'age' }, 65] },
      ],
    },
    { age: 30 }
  );
  console.log('结果:', logicResult.value); // true
  console.log('执行时间:', logicResult.executionTime, 'ms\n');

  // 2. JSON Rule Engine 示例
  console.log('2. JSON Rule Engine - 会员等级判断');
  const ruleResult = await calculator.jsonRuleEngine(
    {
      conditions: {
        all: [{ fact: 'points', operator: 'greaterThanInclusive', value: 1000 }],
      },
      event: {
        type: 'vip',
        params: { level: 'gold', discount: 0.2 },
      },
    },
    { points: 1500 }
  );
  console.log('结果:', ruleResult.value);
  console.log('执行时间:', ruleResult.executionTime, 'ms\n');

  // 3. 源码执行示例
  console.log('3. 源码执行 - 价格计算');
  const codeResult = await calculator.sourceCode(
    'return context.price * context.quantity * (1 + context.taxRate)',
    { price: 100, quantity: 2 }
  );
  console.log('结果:', codeResult.value); // 220
  console.log('执行时间:', codeResult.executionTime, 'ms\n');

  // 4. 模板表达式示例
  console.log('4. 模板表达式 - 文本生成');
  const templateResult = await calculator.template(
    'Hello {{user.name}}, your total is {{price * quantity}} {{currency}}',
    {
      user: { name: 'John' },
      price: 50,
      quantity: 3,
    }
  );
  console.log('结果:', templateResult.value);
  console.log('执行时间:', templateResult.executionTime, 'ms\n');
}

// 运行示例
basicExamples().catch(console.error);
