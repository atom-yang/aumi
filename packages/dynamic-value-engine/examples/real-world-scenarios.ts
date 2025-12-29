/**
 * 实际应用场景示例
 */

import { DynamicValueCalculator, EngineType } from '../src';

// 场景 1: 电商价格计算器
async function ecommercePricingExample() {
  console.log('=== 场景 1: 电商价格计算器 ===\n');

  const calculator = new DynamicValueCalculator({
    settings: {
      currency: 'USD',
      vipDiscount: 0.15,
      shippingFee: 10,
    },
  });

  const pricingRules = [
    // VIP 用户折扣规则
    {
      conditions: {
        all: [{ fact: 'userLevel', operator: 'equal', value: 'vip' }],
      },
      event: { type: 'discount', params: { rate: 0.15 } },
    },
    // 大额订单免运费
    {
      conditions: {
        all: [{ fact: 'totalAmount', operator: 'greaterThanInclusive', value: 100 }],
      },
      event: { type: 'freeShipping', params: { free: true } },
    },
  ];

  const orderContext = {
    userLevel: 'vip',
    items: [
      { name: 'Product A', price: 50, quantity: 2 },
      { name: 'Product B', price: 30, quantity: 1 },
    ],
    totalAmount: 130,
  };

  // 计算折扣
  const discountResult = await calculator.jsonRuleEngine(pricingRules[0], orderContext);
  console.log('VIP 折扣:', discountResult.value);

  // 计算最终价格
  const finalPrice = await calculator.sourceCode(
    `
    const subtotal = context.totalAmount;
    const discount = context.isVip ? subtotal * 0.15 : 0;
    const shipping = subtotal >= 100 ? 0 : 10;
    return subtotal - discount + shipping;
    `,
    { ...orderContext, isVip: true }
  );

  console.log('最终价格:', `$${finalPrice.value?.toFixed(2)}\n`);
}

// 场景 2: 动态表单验证
async function dynamicFormValidationExample() {
  console.log('=== 场景 2: 动态表单验证 ===\n');

  const calculator = new DynamicValueCalculator();

  const validationRules = {
    email: {
      type: EngineType.JSON_LOGIC,
      expression: {
        and: [
          { '!=': [{ var: 'email' }, ''] },
          { in: ['@', { var: 'email' }] },
        ],
      },
    },
    age: {
      type: EngineType.JSON_LOGIC,
      expression: {
        and: [
          { '>=': [{ var: 'age' }, 18] },
          { '<=': [{ var: 'age' }, 120] },
        ],
      },
    },
    password: {
      type: EngineType.SOURCE_CODE,
      expression: `
        const pwd = context.password;
        return pwd.length >= 8 && 
               /[A-Z]/.test(pwd) && 
               /[a-z]/.test(pwd) && 
               /[0-9]/.test(pwd);
      `,
    },
  };

  const formData = {
    email: 'user@example.com',
    age: 25,
    password: 'SecurePass123',
  };

  // 验证所有字段
  const validationResults = await calculator.calculateParallel([
    { ...validationRules.email, context: formData },
    { ...validationRules.age, context: formData },
    { ...validationRules.password, context: formData },
  ]);

  const fieldNames = ['email', 'age', 'password'];
  validationResults.forEach((result, index) => {
    console.log(`${fieldNames[index]} 验证:`, result.value ? '✓ 通过' : '✗ 失败');
  });
  console.log();
}

// 场景 3: 报表生成
async function reportGenerationExample() {
  console.log('=== 场景 3: 报表生成 ===\n');

  const calculator = new DynamicValueCalculator();

  const reportData = {
    company: 'ACME Corporation',
    period: '2025-Q1',
    revenue: 1500000,
    expenses: 800000,
    growthRate: 0.15,
    topProducts: [
      { name: 'Product A', sales: 500000 },
      { name: 'Product B', sales: 350000 },
      { name: 'Product C', sales: 250000 },
    ],
  };

  const reportTemplate = `
财务报表 - {{company}}
报告期：{{period}}

====================================
收入总额：${{revenue}}
支出总额：${{expenses}}
净利润：${{revenue - expenses}}
利润率：{{((revenue - expenses) / revenue * 100)}}%
同比增长：{{growthRate * 100}}%

Top 3 产品：
1. {{topProducts.0.name}} - ${{topProducts.0.sales}}
2. {{topProducts.1.name}} - ${{topProducts.1.sales}}
3. {{topProducts.2.name}} - ${{topProducts.2.sales}}
====================================
  `.trim();

  const report = await calculator.template(reportTemplate, reportData, {
    allowFunctions: true,
  });

  console.log(report.value);
  console.log();
}

// 场景 4: 权限控制
async function accessControlExample() {
  console.log('=== 场景 4: 权限控制 ===\n');

  const calculator = new DynamicValueCalculator();

  const accessRules = [
    // 管理员规则
    {
      conditions: {
        all: [{ fact: 'role', operator: 'equal', value: 'admin' }],
      },
      event: { type: 'access', params: { granted: true, level: 'full' } },
    },
    // 部门经理规则
    {
      conditions: {
        all: [
          { fact: 'role', operator: 'equal', value: 'manager' },
          { fact: 'department', operator: 'equal', value: { fact: 'resourceDepartment' } },
        ],
      },
      event: { type: 'access', params: { granted: true, level: 'department' } },
    },
    // 普通用户规则
    {
      conditions: {
        all: [
          { fact: 'role', operator: 'equal', value: 'user' },
          { fact: 'userId', operator: 'equal', value: { fact: 'resourceOwnerId' } },
        ],
      },
      event: { type: 'access', params: { granted: true, level: 'own' } },
    },
  ];

  const userContext = {
    role: 'manager',
    userId: 'user123',
    department: 'sales',
    resourceDepartment: 'sales',
    resourceOwnerId: 'user456',
  };

  const accessResult = await calculator.jsonRuleEngine(accessRules[1], userContext);

  console.log('访问权限:', accessResult.value);
  console.log();
}

// 场景 5: 配置化业务规则
async function businessRulesExample() {
  console.log('=== 场景 5: 配置化业务规则 ===\n');

  const calculator = new DynamicValueCalculator();

  // 贷款审批规则（完全配置化）
  const loanApprovalRules = {
    creditScoreCheck: {
      type: EngineType.JSON_LOGIC,
      expression: { '>=': [{ var: 'creditScore' }, 650] },
    },
    incomeCheck: {
      type: EngineType.JSON_LOGIC,
      expression: { '>=': [{ var: 'annualIncome' }, 30000] },
    },
    debtRatioCheck: {
      type: EngineType.SOURCE_CODE,
      expression: `
        const debtRatio = context.totalDebt / context.annualIncome;
        return debtRatio < 0.4;
      `,
    },
    employmentCheck: {
      type: EngineType.JSON_LOGIC,
      expression: { '>=': [{ var: 'employmentYears' }, 2] },
    },
  };

  const applicantData = {
    creditScore: 720,
    annualIncome: 60000,
    totalDebt: 15000,
    employmentYears: 3,
  };

  // 执行所有审批规则
  const approvalResults = await calculator.calculateParallel([
    { ...loanApprovalRules.creditScoreCheck, context: applicantData },
    { ...loanApprovalRules.incomeCheck, context: applicantData },
    { ...loanApprovalRules.debtRatioCheck, context: applicantData },
    { ...loanApprovalRules.employmentCheck, context: applicantData },
  ]);

  const allPassed = approvalResults.every((r) => r.success && r.value === true);

  console.log('贷款审批结果:');
  console.log('  信用评分检查:', approvalResults[0].value ? '✓' : '✗');
  console.log('  收入检查:', approvalResults[1].value ? '✓' : '✗');
  console.log('  债务比率检查:', approvalResults[2].value ? '✓' : '✗');
  console.log('  就业年限检查:', approvalResults[3].value ? '✓' : '✗');
  console.log('  最终结果:', allPassed ? '✓ 批准' : '✗ 拒绝');
  console.log();
}

// 运行所有场景示例
async function runAllScenarios() {
  await ecommercePricingExample();
  await dynamicFormValidationExample();
  await reportGenerationExample();
  await accessControlExample();
  await businessRulesExample();
}

runAllScenarios().catch(console.error);
