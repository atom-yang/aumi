import type {
  DynamicValueContext,
  JsonRulesEngineDescriptor,
} from '../types';
import { getByPath } from '../utils';

type JsonRulesEngineModule = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Engine: new (...args: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addRule(rule: any): void;
    addFact(
      name: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fn: (...args: any[]) => any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options?: any,
    ): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    run(facts?: any): Promise<{ events: any[] }>;
  };
};

function getJsonRulesEngine(mod: unknown): JsonRulesEngineModule {
  const candidate = (mod as { Engine?: unknown })?.Engine ?? (mod as { default?: { Engine?: unknown } })?.default?.Engine;
  if (typeof candidate !== 'function') {
    throw new Error('未找到 json-rules-engine 的 Engine，请确认依赖已安装');
  }
  return { Engine: candidate as JsonRulesEngineModule['Engine'] };
}

export async function evaluateJsonRulesEngine(
  descriptor: JsonRulesEngineDescriptor,
  ctx: DynamicValueContext,
): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('json-rules-engine');
  const { Engine } = getJsonRulesEngine(mod);

  const engine = new Engine();

  // 约定：默认提供一个名为 ctx 的 fact，便于在 rules 里通过 path 引用
  engine.addFact('ctx', async () => ctx);

  if (descriptor.facts) {
    for (const [factName, provider] of Object.entries(descriptor.facts)) {
      if (typeof provider === 'string') {
        engine.addFact(factName, async () => getByPath(ctx, provider));
      } else if (typeof provider === 'function') {
        engine.addFact(factName, async () => await provider(ctx));
      }
    }
  }

  for (const rule of descriptor.rules) {
    engine.addRule(rule);
  }

  const res = await engine.run({});
  const returnMode = descriptor.return ?? 'events';
  if (returnMode === 'success') {
    return res.events.length > 0;
  }
  return res.events;
}

