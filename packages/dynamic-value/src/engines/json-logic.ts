/**
 * JSON Logic 引擎适配器
 * @see https://jsonlogic.com/
 */

import type {
  IEngine,
  DynamicContext,
  JsonLogicConfig,
  CustomOperator,
} from '../types';

// JSON Logic 库类型定义
interface JsonLogicLib {
  apply: (logic: Record<string, unknown>, data: unknown) => unknown;
  add_operation: (name: string, fn: (...args: unknown[]) => unknown) => void;
}

/**
 * JSON Logic 引擎
 */
export class JsonLogicEngine implements IEngine<JsonLogicConfig, unknown> {
  readonly type = 'json-logic' as const;
  readonly name = 'JSON Logic Engine';

  private jsonLogic: JsonLogicLib | null = null;
  private customOperators: CustomOperator[] = [];
  private initialized = false;

  constructor(customOperators?: CustomOperator[]) {
    if (customOperators) {
      this.customOperators = customOperators;
    }
  }

  /**
   * 延迟加载 json-logic-js
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 动态导入 json-logic-js
      const jsonLogicModule = await import('json-logic-js');
      this.jsonLogic = jsonLogicModule.default || jsonLogicModule;

      // 注册自定义操作符
      for (const op of this.customOperators) {
        this.addOperation(op.name, op.fn);
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize JSON Logic engine: ${(error as Error).message}. ` +
        'Please ensure json-logic-js is installed: npm install json-logic-js',
      );
    }
  }

  /**
   * 添加自定义操作符
   */
  addOperation(name: string, fn: (...args: unknown[]) => unknown): void {
    if (this.jsonLogic) {
      this.jsonLogic.add_operation(name, fn);
    } else {
      // 如果还未初始化，先存储起来
      this.customOperators.push({ name, fn });
    }
  }

  /**
   * 执行 JSON Logic 规则
   */
  async execute(config: JsonLogicConfig, context: DynamicContext): Promise<unknown> {
    await this.ensureInitialized();

    if (!this.jsonLogic) {
      throw new Error('JSON Logic engine not initialized');
    }

    const { rule } = config;

    // 将上下文作为数据传递给 JSON Logic
    const data = this.prepareData(context);

    try {
      return this.jsonLogic.apply(rule, data);
    } catch (error) {
      throw new Error(`JSON Logic execution error: ${(error as Error).message}`);
    }
  }

  /**
   * 准备数据，将上下文转换为 JSON Logic 可用的格式
   */
  private prepareData(context: DynamicContext): Record<string, unknown> {
    return {
      ...context.data,
      $vars: context.vars,
      $env: context.env,
      $user: context.user,
      $meta: context.meta,
      $context: context,
    };
  }

  /**
   * 验证规则配置
   */
  validate(config: JsonLogicConfig): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }
    if (!config.rule || typeof config.rule !== 'object') {
      return false;
    }
    return true;
  }
}

/**
 * 创建 JSON Logic 引擎的工厂函数
 */
export function createJsonLogicEngine(customOperators?: CustomOperator[]): JsonLogicEngine {
  return new JsonLogicEngine(customOperators);
}

/**
 * 内置的常用自定义操作符
 */
export const builtInOperators: CustomOperator[] = [
  // 字符串操作
  {
    name: 'startsWith',
    fn: (str: unknown, prefix: unknown) => {
      if (typeof str !== 'string' || typeof prefix !== 'string') {
        return false;
      }
      return str.startsWith(prefix);
    },
  },
  {
    name: 'endsWith',
    fn: (str: unknown, suffix: unknown) => {
      if (typeof str !== 'string' || typeof suffix !== 'string') {
        return false;
      }
      return str.endsWith(suffix);
    },
  },
  {
    name: 'includes',
    fn: (str: unknown, search: unknown) => {
      if (typeof str === 'string' && typeof search === 'string') {
        return str.includes(search);
      }
      if (Array.isArray(str)) {
        return str.includes(search);
      }
      return false;
    },
  },
  {
    name: 'toLowerCase',
    fn: (str: unknown) => {
      if (typeof str !== 'string') {
        return str;
      }
      return str.toLowerCase();
    },
  },
  {
    name: 'toUpperCase',
    fn: (str: unknown) => {
      if (typeof str !== 'string') {
        return str;
      }
      return str.toUpperCase();
    },
  },
  {
    name: 'trim',
    fn: (str: unknown) => {
      if (typeof str !== 'string') {
        return str;
      }
      return str.trim();
    },
  },
  // 数组操作
  {
    name: 'length',
    fn: (arr: unknown) => {
      if (Array.isArray(arr) || typeof arr === 'string') {
        return arr.length;
      }
      return 0;
    },
  },
  {
    name: 'first',
    fn: (arr: unknown) => {
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[0];
      }
      return undefined;
    },
  },
  {
    name: 'last',
    fn: (arr: unknown) => {
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[arr.length - 1];
      }
      return undefined;
    },
  },
  // 类型检查
  {
    name: 'isNull',
    fn: (val: unknown) => val === null,
  },
  {
    name: 'isUndefined',
    fn: (val: unknown) => val === undefined,
  },
  {
    name: 'isNullOrUndefined',
    fn: (val: unknown) => val === null || val === undefined,
  },
  {
    name: 'isArray',
    fn: (val: unknown) => Array.isArray(val),
  },
  {
    name: 'isString',
    fn: (val: unknown) => typeof val === 'string',
  },
  {
    name: 'isNumber',
    fn: (val: unknown) => typeof val === 'number' && !Number.isNaN(val),
  },
  // 数学操作
  {
    name: 'round',
    fn: (num: unknown, decimals?: unknown) => {
      if (typeof num !== 'number') {
        return num;
      }
      const d = typeof decimals === 'number' ? decimals : 0;
      const factor = Math.pow(10, d);
      return Math.round(num * factor) / factor;
    },
  },
  {
    name: 'floor',
    fn: (num: unknown) => {
      if (typeof num !== 'number') {
        return num;
      }
      return Math.floor(num);
    },
  },
  {
    name: 'ceil',
    fn: (num: unknown) => {
      if (typeof num !== 'number') {
        return num;
      }
      return Math.ceil(num);
    },
  },
  {
    name: 'abs',
    fn: (num: unknown) => {
      if (typeof num !== 'number') {
        return num;
      }
      return Math.abs(num);
    },
  },
  // 日期操作
  {
    name: 'now',
    fn: () => Date.now(),
  },
  {
    name: 'timestamp',
    fn: (date: unknown) => {
      if (date instanceof Date) {
        return date.getTime();
      }
      if (typeof date === 'string') {
        return new Date(date).getTime();
      }
      return Date.now();
    },
  },
];
