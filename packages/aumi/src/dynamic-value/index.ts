import type {
  DynamicValueContext,
  DynamicValueDescriptor,
  DynamicValueEngine,
  EvaluateOptions,
  JsonLogicDescriptor,
  JsonRulesEngineDescriptor,
  SourceDescriptor,
  TemplateDescriptor,
} from './types';
import { isDynamicValueDescriptor, resolveDeep } from './utils';
import { evaluateJsonLogic } from './engines/jsonLogic';
import { evaluateJsonRulesEngine } from './engines/jsonRulesEngine';
import { evaluateSource } from './engines/source';
import { evaluateTemplate } from './engines/template';

export * from './types';
export * from './utils';

class JsonLogicEngine implements DynamicValueEngine<JsonLogicDescriptor> {
  readonly kind = 'json-logic' as const;
  async evaluate(descriptor: JsonLogicDescriptor, ctx: DynamicValueContext): Promise<unknown> {
    return await evaluateJsonLogic(descriptor, ctx);
  }
}

class JsonRulesEngine implements DynamicValueEngine<JsonRulesEngineDescriptor> {
  readonly kind = 'json-rules-engine' as const;
  async evaluate(
    descriptor: JsonRulesEngineDescriptor,
    ctx: DynamicValueContext,
  ): Promise<unknown> {
    return await evaluateJsonRulesEngine(descriptor, ctx);
  }
}

class SourceEngine implements DynamicValueEngine<SourceDescriptor> {
  readonly kind = 'source' as const;
  async evaluate(
    descriptor: SourceDescriptor,
    ctx: DynamicValueContext,
    options?: EvaluateOptions,
  ): Promise<unknown> {
    return await evaluateSource(descriptor, ctx, options);
  }
}

class TemplateEngine implements DynamicValueEngine<TemplateDescriptor> {
  readonly kind = 'template' as const;
  async evaluate(
    descriptor: TemplateDescriptor,
    ctx: DynamicValueContext,
    options?: EvaluateOptions,
  ): Promise<unknown> {
    return await evaluateTemplate(descriptor, ctx, options);
  }
}

export class DynamicValueCalculator {
  private readonly engineMap: Map<DynamicValueDescriptor['kind'], DynamicValueEngine<any>>;

  constructor(engines?: Array<DynamicValueEngine<any>>) {
    const list =
      engines ??
      ([
        new JsonLogicEngine(),
        new JsonRulesEngine(),
        new SourceEngine(),
        new TemplateEngine(),
      ] as Array<DynamicValueEngine<any>>);

    this.engineMap = new Map(list.map((e) => [e.kind, e]));
  }

  /**
   * 计算单个 descriptor
   */
  async evaluate(
    descriptor: DynamicValueDescriptor,
    ctx: DynamicValueContext,
    options?: EvaluateOptions,
  ): Promise<unknown> {
    const engine = this.engineMap.get(descriptor.kind);
    if (!engine) {
      throw new Error(`未注册的动态计算引擎: ${descriptor.kind}`);
    }
    return await engine.evaluate(descriptor as any, ctx, options);
  }

  /**
   * 输入既可以是 descriptor，也可以是普通值。
   */
  async evaluateIfNeeded(
    value: unknown,
    ctx: DynamicValueContext,
    options?: EvaluateOptions,
  ): Promise<unknown> {
    if (!isDynamicValueDescriptor(value)) return value;
    return await this.evaluate(value, ctx, options);
  }

  /**
   * 深度解析：把任意对象/数组中出现的 descriptor 全部计算为最终值
   */
  async resolveDeep(
    value: unknown,
    ctx: DynamicValueContext,
    options?: EvaluateOptions,
  ): Promise<unknown> {
    return await resolveDeep(value, ctx, (d, c) => this.evaluate(d, c, options));
  }
}

// 便捷默认实例
const defaultCalculator = new DynamicValueCalculator();

export async function evaluateDynamicValue(
  descriptor: DynamicValueDescriptor,
  ctx: DynamicValueContext,
  options?: EvaluateOptions,
): Promise<unknown> {
  return await defaultCalculator.evaluate(descriptor, ctx, options);
}

export async function resolveDynamicValuesDeep(
  value: unknown,
  ctx: DynamicValueContext,
  options?: EvaluateOptions,
): Promise<unknown> {
  return await defaultCalculator.resolveDeep(value, ctx, options);
}

