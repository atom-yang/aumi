/**
 * 工具函数
 */

/**
 * 简单的 LRU 缓存实现
 */
export class LRUCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) {
      return undefined;
    }

    // 检查是否过期
    if (item.expiry > 0 && Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // LRU: 重新插入以更新顺序
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 生存时间（毫秒），0 表示永不过期
   */
  set(key: K, value: V, ttl = 0): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果达到最大容量，删除最老的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = ttl > 0 ? Date.now() + ttl : 0;
    this.cache.set(key, { value, expiry });
  }

  /**
   * 删除缓存
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    if (item.expiry > 0 && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * 生成缓存键
 */
export function generateCacheKey(
  engine: string,
  config: unknown,
  context: unknown,
): string {
  const configStr = JSON.stringify(config);
  const contextStr = JSON.stringify(context);
  return `${engine}:${hashString(configStr)}:${hashString(contextStr)}`;
}

/**
 * 简单的字符串哈希函数
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
  } = {},
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error | undefined;
  let currentDelay = delay;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }

  throw lastError;
}

/**
 * 类型检查工具
 */
export const typeCheck = {
  isString: (val: unknown): val is string => typeof val === 'string',
  isNumber: (val: unknown): val is number => typeof val === 'number' && !Number.isNaN(val),
  isBoolean: (val: unknown): val is boolean => typeof val === 'boolean',
  isArray: <T = unknown>(val: unknown): val is T[] => Array.isArray(val),
  isObject: (val: unknown): val is Record<string, unknown> =>
    val !== null && typeof val === 'object' && !Array.isArray(val),
  isFunction: (val: unknown): val is (...args: unknown[]) => unknown =>
    typeof val === 'function',
  isNullOrUndefined: (val: unknown): val is null | undefined =>
    val === null || val === undefined,
  isPromise: <T = unknown>(val: unknown): val is Promise<T> =>
    val instanceof Promise || (
      val !== null &&
      typeof val === 'object' &&
      typeof (val as { then?: unknown }).then === 'function'
    ),
};
