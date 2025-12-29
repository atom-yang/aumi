import type { DynamicValueContext, JsonLogicDescriptor } from '../types';

// json-logic-js 的导出在 CJS/ESM 场景不完全一致，这里做一层兼容
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getJsonLogicApply(mod: any): (logic: unknown, data?: unknown) => unknown {
  const candidate = mod?.apply ?? mod?.default?.apply;
  if (typeof candidate !== 'function') {
    throw new Error('未找到 json-logic-js 的 apply 方法，请确认依赖已安装');
  }
  return candidate;
}

export async function evaluateJsonLogic(
  descriptor: JsonLogicDescriptor,
  ctx: DynamicValueContext,
): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('json-logic-js');
  const apply = getJsonLogicApply(mod);
  return apply(descriptor.logic, ctx);
}

