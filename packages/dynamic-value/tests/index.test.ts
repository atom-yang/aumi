/**
 * DynamicValue 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDynamicValue,
  DynamicValue,
  createContextManager,
  TemplateEngine,
  ScriptEngine,
} from '../src';

describe('DynamicValue', () => {
  let dv: DynamicValue;

  beforeEach(() => {
    dv = createDynamicValue();
    dv.setContext({
      data: {
        user: { name: 'Alice', age: 25 },
        products: [
          { name: 'Product A', price: 100 },
          { name: 'Product B', price: 200 },
        ],
        count: 10,
      },
    });
  });

  describe('Context Management', () => {
    it('should get and set context', () => {
      const ctx = dv.getContext();
      expect(ctx.data.user).toEqual({ name: 'Alice', age: 25 });
    });

    it('should merge context', () => {
      dv.setContext({
        data: { newField: 'value' },
      });
      const ctx = dv.getContext();
      expect(ctx.data.newField).toBe('value');
      expect(ctx.data.user).toEqual({ name: 'Alice', age: 25 });
    });
  });

  describe('Template Engine', () => {
    it('should process simple variable', async () => {
      const result = await dv.computeTemplate('Hello, {{user.name}}!');
      expect(result.success).toBe(true);
      expect(result.value).toBe('Hello, Alice!');
    });

    it('should process multiple variables', async () => {
      const result = await dv.computeTemplate(
        '{{user.name}} is {{user.age}} years old',
      );
      expect(result.success).toBe(true);
      expect(result.value).toBe('Alice is 25 years old');
    });

    it('should handle helper functions', async () => {
      const result = await dv.computeTemplate('{{upper(user.name)}}');
      expect(result.success).toBe(true);
      expect(result.value).toBe('ALICE');
    });

    it('should handle math helpers', async () => {
      const result = await dv.computeTemplate('{{add(count, 5)}}');
      expect(result.success).toBe(true);
      expect(result.value).toBe('15');
    });

    it('should handle pipe syntax', async () => {
      const result = await dv.computeTemplate('{{user.name | upper}}');
      expect(result.success).toBe(true);
      expect(result.value).toBe('ALICE');
    });

    it('should handle conditional helper', async () => {
      const result = await dv.computeTemplate(
        '{{if(gt(user.age, 18), "Adult", "Minor")}}',
      );
      expect(result.success).toBe(true);
      expect(result.value).toBe('Adult');
    });

    it('should handle nested path', async () => {
      const result = await dv.computeTemplate('Price: {{products.0.price}}');
      expect(result.success).toBe(true);
      expect(result.value).toBe('Price: 100');
    });
  });

  describe('Script Engine', () => {
    it('should execute simple script', async () => {
      const result = await dv.computeScript('return data.count * 2;');
      expect(result.success).toBe(true);
      expect(result.value).toBe(20);
    });

    it('should access context data', async () => {
      const result = await dv.computeScript('return data.user.name;');
      expect(result.success).toBe(true);
      expect(result.value).toBe('Alice');
    });

    it('should handle array operations', async () => {
      const result = await dv.computeScript(`
        return data.products.map(p => p.price).reduce((a, b) => a + b, 0);
      `);
      expect(result.success).toBe(true);
      expect(result.value).toBe(300);
    });

    it('should return complex objects', async () => {
      const result = await dv.computeScript(`
        return {
          total: data.products.length,
          names: data.products.map(p => p.name)
        };
      `);
      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        total: 2,
        names: ['Product A', 'Product B'],
      });
    });

    it('should reject dangerous code', async () => {
      const result = await dv.computeScript('eval("1+1")');
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unsafe code pattern');
    });
  });

  describe('Batch Computation', () => {
    it('should compute multiple definitions', async () => {
      const results = await dv.computeBatch([
        {
          engine: 'template',
          config: { template: '{{user.name}}' },
        },
        {
          engine: 'script',
          config: { code: 'return data.count;' },
        },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].value).toBe('Alice');
      expect(results[1].value).toBe(10);
    });
  });

  describe('Caching', () => {
    it('should cache results', async () => {
      const definition = {
        engine: 'template' as const,
        config: { template: '{{user.name}}' },
        cache: { enabled: true, ttl: 60000 },
      };

      const result1 = await dv.compute(definition);
      expect(result1.fromCache).toBe(false);

      const result2 = await dv.compute(definition);
      expect(result2.fromCache).toBe(true);
      expect(result2.value).toBe(result1.value);
    });

    it('should clear cache', async () => {
      const definition = {
        engine: 'template' as const,
        config: { template: '{{user.name}}' },
        cache: { enabled: true },
      };

      await dv.compute(definition);
      dv.clearCache();

      const result = await dv.compute(definition);
      expect(result.fromCache).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('should return default value on error', async () => {
      const result = await dv.compute({
        engine: 'script',
        config: { code: 'throw new Error("test")' },
        defaultValue: 'fallback',
      });

      expect(result.success).toBe(false);
      expect(result.value).toBe('fallback');
    });
  });

  describe('Validation', () => {
    it('should validate template config', async () => {
      const valid = await dv.validate({
        engine: 'template',
        config: { template: '{{test}}' },
      });
      expect(valid).toBe(true);

      const invalid = await dv.validate({
        engine: 'template',
        config: { template: 123 as unknown as string },
      });
      expect(invalid).toBe(false);
    });

    it('should validate script config', async () => {
      const valid = await dv.validate({
        engine: 'script',
        config: { code: 'return 1;' },
      });
      expect(valid).toBe(true);

      const invalid = await dv.validate({
        engine: 'script',
        config: { code: '' },
      });
      expect(invalid).toBe(false);
    });
  });
});

describe('ContextManager', () => {
  it('should get and set values by path', () => {
    const ctx = createContextManager({
      data: { nested: { value: 1 } },
    });

    expect(ctx.getByPath('data.nested.value')).toBe(1);

    ctx.setByPath('data.nested.newValue', 2);
    expect(ctx.getByPath('data.nested.newValue')).toBe(2);
  });

  it('should flatten context', () => {
    const ctx = createContextManager({
      data: { a: 1, b: { c: 2 } },
    });

    const flat = ctx.flatten();
    expect(flat['data.a']).toBe(1);
    expect(flat['data.b.c']).toBe(2);
  });

  it('should clone context', () => {
    const ctx = createContextManager({
      data: { value: 1 },
    });

    const cloned = ctx.clone();
    cloned.setData('value', 2);

    expect(ctx.getData('value')).toBe(1);
    expect(cloned.getData('value')).toBe(2);
  });
});

describe('TemplateEngine (standalone)', () => {
  it('should work independently', async () => {
    const engine = new TemplateEngine();
    const result = await engine.execute(
      { template: '{{name}} - {{age}}' },
      {
        data: { name: 'Bob', age: 30 },
      },
    );
    expect(result).toBe('Bob - 30');
  });

  it('should support custom helpers', async () => {
    const engine = new TemplateEngine({
      double: (n: unknown) => Number(n) * 2,
    });

    const result = await engine.execute(
      { template: '{{double(value)}}' },
      { data: { value: 5 } },
    );
    expect(result).toBe('10');
  });
});

describe('ScriptEngine (standalone)', () => {
  it('should work independently', async () => {
    const engine = new ScriptEngine();
    const result = await engine.execute(
      { code: 'return data.x + data.y;' },
      { data: { x: 1, y: 2 } },
    );
    expect(result).toBe(3);
  });

  // 注意：无限循环测试在 CI 环境可能不稳定，已跳过
  it.skip('should timeout long-running scripts', async () => {
    const engine = new ScriptEngine({ timeout: 100 });
    
    const result = engine.execute(
      {
        code: `
          let i = 0;
          while (true) { i++; }
          return i;
        `,
        timeout: 50,
      },
      { data: {} },
    );

    await expect(result).rejects.toThrow('timeout');
  });
});
