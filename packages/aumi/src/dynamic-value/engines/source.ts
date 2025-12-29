import type { DynamicValueContext, EvaluateOptions, SourceDescriptor } from '../types';

// 在 Node.js 环境优先使用 vm 做隔离与超时控制
let vm: typeof import('node:vm') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  vm = require('node:vm');
} catch {
  vm = null;
}

export async function evaluateSource(
  descriptor: SourceDescriptor,
  ctx: DynamicValueContext,
  options?: EvaluateOptions,
): Promise<unknown> {
  const mode = descriptor.mode ?? 'expression';
  const code = String(descriptor.code ?? '');

  if (vm) {
    return await evaluateWithVm(vm, mode, code, ctx, options);
  }

  return await evaluateWithFunction(mode, code, ctx);
}

async function evaluateWithVm(
  nodeVm: typeof import('node:vm'),
  mode: 'expression' | 'function',
  code: string,
  ctx: DynamicValueContext,
  options?: EvaluateOptions,
): Promise<unknown> {
  const sandbox = createSandbox(ctx);
  const wrapped = wrapCode(mode, code);
  const script = new nodeVm.Script(wrapped, { filename: 'dynamic-value:source' });

  const timeout = options?.timeoutMs;
  const runOptions: Record<string, unknown> = {};
  if (typeof timeout === 'number') runOptions.timeout = timeout;
  // Node 16+ 支持 microtaskMode；老版本忽略即可
  runOptions.microtaskMode = 'afterEvaluate';

  // runInNewContext 可能返回 Promise（当调用 async function 时）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = script.runInNewContext(sandbox as any, runOptions as any) as any;
  return await Promise.resolve(result);
}

async function evaluateWithFunction(
  mode: 'expression' | 'function',
  code: string,
  ctx: DynamicValueContext,
): Promise<unknown> {
  const context = ctx;
  if (mode === 'function') {
    // code 应该是一个函数表达式： (ctx) => ... 或 function (ctx) { ... }
    // eslint-disable-next-line no-new-func
    const fn = new Function('ctx', 'context', '"use strict"; return (' + code + ');')(
      ctx,
      context,
    ) as unknown;
    if (typeof fn !== 'function') {
      throw new Error('source:function 模式要求 code 求值结果为 function');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = (fn as any)(ctx);
    return await Promise.resolve(out);
  }

  // expression：返回表达式结果
  // eslint-disable-next-line no-new-func
  const out = new Function('ctx', 'context', '"use strict"; return (' + code + ');')(
    ctx,
    context,
  ) as unknown;
  return await Promise.resolve(out);
}

function wrapCode(mode: 'expression' | 'function', code: string): string {
  if (mode === 'function') {
    // 返回：fn(ctx)
    return [
      '"use strict";',
      'const __fn = (' + code + ');',
      'if (typeof __fn !== "function") { throw new Error("source:function 模式要求 code 求值结果为 function"); }',
      '__fn(ctx);',
    ].join('\n');
  }
  // expression
  return ['"use strict";', '(' + code + ');'].join('\n');
}

function createSandbox(ctx: DynamicValueContext): Record<string, unknown> {
  // 默认只暴露无害内建，避免 require/process 等危险对象
  return {
    ctx,
    context: ctx,
    Math,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
  };
}

