import type {
  DynamicValueContext,
  EvaluateOptions,
  TemplateDescriptor,
} from '../types';
import { getByPath } from '../utils';
import { evaluateSource } from './source';

export async function evaluateTemplate(
  descriptor: TemplateDescriptor,
  ctx: DynamicValueContext,
  options?: EvaluateOptions,
): Promise<string> {
  const template = String(descriptor.template ?? '');
  const allowExpression = descriptor.allowExpression ?? false;

  // {{ ... }} 替换
  const re = /\{\{([\s\S]+?)\}\}/g;
  let out = '';
  let lastIndex = 0;

  for (;;) {
    const match = re.exec(template);
    if (!match) break;

    out += template.slice(lastIndex, match.index);
    lastIndex = match.index + match[0].length;

    const raw = String(match[1] ?? '').trim();
    if (allowExpression && raw.startsWith('=')) {
      const expr = raw.slice(1).trim();
      const v = await evaluateSource({ kind: 'source', code: expr, mode: 'expression' }, ctx, options);
      out += stringifyForTemplate(v);
      continue;
    }

    const v = getByPath(ctx, raw, '');
    out += stringifyForTemplate(v);
  }

  out += template.slice(lastIndex);
  return out;
}

function stringifyForTemplate(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

