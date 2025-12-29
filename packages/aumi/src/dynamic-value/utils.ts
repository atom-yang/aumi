import type { DynamicValueContext, DynamicValueDescriptor } from './types';

export function isDynamicValueDescriptor(value: unknown): value is DynamicValueDescriptor {
  if (!value || typeof value !== 'object') return false;
  const kind = (value as { kind?: unknown }).kind;
  return (
    kind === 'json-logic' ||
    kind === 'json-rules-engine' ||
    kind === 'source' ||
    kind === 'template'
  );
}

/**
 * 支持简单 path：
 * - a.b.c
 * - a[0].b
 * - a["x"].b / a['x'].b
 */
export function getByPath(
  obj: unknown,
  path: string,
  defaultValue?: unknown,
): unknown {
  if (!path) return defaultValue;
  const tokens: Array<string | number> = [];

  // tokenize: a.b[0]["x"] -> ["a","b",0,"x"]
  const re = /[^.[\]]+|\[(\d+|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\]/g;
  const matches = path.match(re);
  if (!matches) return defaultValue;

  for (const m of matches) {
    if (m[0] === '[' && m[m.length - 1] === ']') {
      const inner = m.slice(1, -1);
      if (/^\d+$/.test(inner)) {
        tokens.push(Number(inner));
      } else if (
        (inner.startsWith('"') && inner.endsWith('"')) ||
        (inner.startsWith("'") && inner.endsWith("'"))
      ) {
        const unquoted = inner.slice(1, -1);
        tokens.push(unescapeString(unquoted));
      } else {
        tokens.push(inner);
      }
    } else {
      tokens.push(m);
    }
  }

  let cur: unknown = obj;
  for (const t of tokens) {
    if (cur == null) return defaultValue;
    if (typeof t === 'number') {
      if (!Array.isArray(cur)) return defaultValue;
      cur = cur[t];
    } else {
      if (typeof cur !== 'object') return defaultValue;
      cur = (cur as Record<string, unknown>)[t];
    }
  }
  return cur === undefined ? defaultValue : cur;
}

function unescapeString(input: string): string {
  // 仅覆盖常见转义，避免引入额外依赖
  return input
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

export type ResolveDeepOptions = {
  /**
   * 防止循环引用导致无限递归
   */
  maxDepth?: number;
};

/**
 * 递归解析任意结构：
 * - descriptor => evaluate
 * - array/object => 深度遍历
 * - primitive => 原样返回
 */
export async function resolveDeep(
  value: unknown,
  ctx: DynamicValueContext,
  evaluate: (descriptor: DynamicValueDescriptor, ctx: DynamicValueContext) => Promise<unknown>,
  options: ResolveDeepOptions = {},
): Promise<unknown> {
  const maxDepth = options.maxDepth ?? 50;
  return await resolveDeepInner(value, ctx, evaluate, maxDepth, 0, new WeakSet());
}

async function resolveDeepInner(
  value: unknown,
  ctx: DynamicValueContext,
  evaluate: (descriptor: DynamicValueDescriptor, ctx: DynamicValueContext) => Promise<unknown>,
  maxDepth: number,
  depth: number,
  seen: WeakSet<object>,
): Promise<unknown> {
  if (depth > maxDepth) {
    throw new Error(`resolveDeep 超过最大深度限制: ${maxDepth}`);
  }

  if (isDynamicValueDescriptor(value)) {
    return await evaluate(value, ctx);
  }

  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      out.push(await resolveDeepInner(item, ctx, evaluate, maxDepth, depth + 1, seen));
    }
    return out;
  }

  if (value && typeof value === 'object') {
    if (seen.has(value as object)) return value;
    seen.add(value as object);

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = await resolveDeepInner(v, ctx, evaluate, maxDepth, depth + 1, seen);
    }
    return out;
  }

  return value;
}

