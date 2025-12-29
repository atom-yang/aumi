import Ajv from 'ajv';
import type { JSONSchemaType, ValidateFunction } from 'ajv';
import { Path } from '@formily/path';
import { produce } from 'immer';
import set from 'lodash-es/set';

export type ContextErrorCode = 'AUTH' | 'VALIDATION' | 'NOT_FOUND' | 'TRANSACTION';

export class AuthError extends Error {
  readonly code = 'AUTH' as const;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AuthError';
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends Error {
  readonly code = 'VALIDATION' as const;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND' as const;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'NotFoundError';
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TransactionError extends Error {
  readonly code = 'TRANSACTION' as const;
  readonly details?: Record<string, unknown>;
  readonly originalError?: Error;

  constructor(message: string, details?: Record<string, unknown>, originalError?: Error) {
    super(message);
    this.name = 'TransactionError';
    this.details = details;
    this.originalError = originalError;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 1. 基本类型与元数据定义
 */
export type ScopeType = 'root' | 'app' | 'page' | 'module' | 'single-run' | string;

export type LifecycleHook = 'onMount' | 'onUnmount' | 'onDataChange';

export interface ScopeLifecycleEvent<ScopeValue extends AnyRecord = AnyRecord> {
  hook: LifecycleHook;
  scopeId: string;
  node?: ScopeNode<ScopeValue>;
  path?: string;
  value?: unknown;
  meta?: ChangeMeta;
}

export type ScopeLifecycleCallback<ScopeValue extends AnyRecord = AnyRecord> = (
  event?: ScopeLifecycleEvent<ScopeValue>,
) => void | Promise<void>;

export interface FieldSchema<Value = unknown, Enum = unknown> {
  key: string; // 路径，如 "user.profile.name"
  description?: string;
  schema?: JSONSchemaType<Value>;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: Value;
  enums?: Enum[];
  validate?: (value: Value) => boolean | string | Promise<boolean | string>;
  writable?: boolean;
  writeRoles?: string[]; // 写的权限校验
}

export interface ChangeMeta {
  source?: string; // 溯源：哪个地方触发的
  timestamp: number;
  scopeId: string;
}

type AnyRecord = Record<string, any>;

export interface ScopeNode<Value extends AnyRecord = AnyRecord> {
  id: string;
  data: Value;
  parentId?: string;
  children: string[];
  type: ScopeType;
  name: string;
}

export type Subscriber<T = unknown> = (value: T, meta: ChangeMeta) => void;

/**
 * 订阅记录，包含唯一 ID 用于精确取消订阅
 */
interface SubscriptionRecord {
  id: string;
  pattern: Path;
  subscribers: Map<string, Subscriber<any>>; // 使用 Map 替代 Set，key 为订阅 ID
}

/**
 * 快照数据结构，用于事务回滚
 */
interface KernelSnapshot<ScopeValue extends AnyRecord = AnyRecord> {
  scopeNodes: Map<string, ScopeNode<ScopeValue>>;
  timestamp: number;
}

/**
 * 生成唯一 ID
 */
let subscriptionIdCounter = 0;
function generateSubscriptionId(): string {
  return `sub_${++subscriptionIdCounter}_${Date.now()}`;
}

export class Scope<ScopeValue extends AnyRecord = AnyRecord> {
  protected kernel: ContextKernel<ScopeValue>;
  protected scopeId: string;
  // 追踪该 Scope 实例创建的所有订阅，用于自动清理
  protected ownedSubscriptionIds: Set<string> = new Set();
  protected isDisposed: boolean = false;

  constructor(kernel: ContextKernel<ScopeValue>, scopeId: string) {
    this.kernel = kernel;
    this.scopeId = scopeId;
  }

  getCurrentScopeId(): string {
    return this.scopeId;
  }

  get<T = unknown>(path: string, options?: { scopeId?: string }): T | undefined {
    this.checkDisposed();
    return this.kernel.get(path, { ...options, scopeId: this.scopeId });
  }

  set<T = unknown>(
    path: string,
    value: T,
    opts?: {
      scopeId?: string;
      role?: string;
      source?: string;
    },
  ): void {
    this.checkDisposed();
    this.kernel.set(path, value, { ...opts, scopeId: this.scopeId });
  }

  setAsync<T = unknown>(
    path: string,
    value: T,
    opts?: {
      scopeId?: string;
      role?: string;
      source?: string;
    },
  ): Promise<void> {
    this.checkDisposed();
    return this.kernel.setAsync(path, value, { ...opts, scopeId: this.scopeId });
  }

  subscribe<T = unknown>(path: string, cb: Subscriber<T>, opts?: { scopeId?: string }): () => void {
    this.checkDisposed();
    const { unsubscribe, subscriptionId } = this.kernel.subscribeWithId(path, cb, {
      ...opts,
      scopeId: this.scopeId,
    });

    // 追踪订阅 ID
    this.ownedSubscriptionIds.add(subscriptionId);

    return () => {
      this.ownedSubscriptionIds.delete(subscriptionId);
      unsubscribe();
    };
  }

  notifyChange<T = unknown>(
    path: string,
    value: T,
    opts?: {
      scopeId?: string;
      source?: string;
      timestamp?: number;
    },
  ): void {
    this.checkDisposed();
    this.kernel.notifyChange(path, value, { ...opts, scopeId: this.scopeId });
  }

  getScopeValues(options?: { scopeId?: string; clone?: boolean }): AnyRecord {
    this.checkDisposed();
    return this.kernel.getScopeValues({ ...options, scopeId: this.scopeId });
  }

  getScopeAndDescendantsValues(options?: { scopeId?: string; clone?: boolean }): Record<string, AnyRecord> {
    this.checkDisposed();
    return this.kernel.getScopeAndDescendantsValues({ ...options, scopeId: this.scopeId });
  }

  getAllScopesValues(options?: { clone?: boolean }): Record<string, AnyRecord> {
    this.checkDisposed();
    return this.kernel.getAllScopesValues(options);
  }

  getSchemaDefinition(path: string): FieldSchema | undefined {
    return this.kernel.getSchemaDefinition(path);
  }

  getFieldDescription(path: string): string | undefined {
    return this.kernel.getFieldDescription(path);
  }

  registerSchema(schema: FieldSchema): void {
    this.kernel.registerSchema(schema);
  }

  on(hook: LifecycleHook, callback: ScopeLifecycleCallback<ScopeValue>): () => void {
    this.checkDisposed();
    return this.kernel.registerScopeLifecycle(this.scopeId, hook, callback);
  }

  createScope(id: string, type: ScopeType, name: string): Scope<ScopeValue> {
    this.checkDisposed();
    return this.kernel.createScope(id, type, name, this.scopeId);
  }

  /**
   * 异步创建子作用域，等待 onMount 生命周期完成后返回
   */
  async createScopeAsync(id: string, type: ScopeType, name: string): Promise<Scope<ScopeValue>> {
    this.checkDisposed();
    return this.kernel.createScopeAsync(id, type, name, this.scopeId);
  }

  unset(
    path: string,
    opts?: {
      scopeId?: string;
      role?: string;
      source?: string;
    },
  ): void {
    this.checkDisposed();
    this.kernel.unset(path, { ...opts, scopeId: this.scopeId });
  }

  clear(opts?: { scopeId?: string }): void {
    this.checkDisposed();
    this.kernel.clearScope({ ...opts, scopeId: this.scopeId });
  }

  remove(opts?: { scopeId?: string; removeDescendants?: boolean }): void {
    this.kernel.removeScope(this.scopeId, opts);
  }

  batchSet(
    operations: Array<{
      path: string;
      value: unknown;
      role?: string;
      source?: string;
    }>,
    opts?: { scopeId?: string; source?: string },
  ): void {
    this.checkDisposed();
    this.kernel.batchSet(
      operations.map(op => ({ ...op, scopeId: this.scopeId })),
      { ...opts, scopeId: this.scopeId },
    );
  }

  /**
   * 清理该 Scope 实例持有的所有订阅
   * 在作用域被移除时自动调用
   */
  dispose(): void {
    if (this.isDisposed) return;

    // 清理所有该实例创建的订阅
    this.ownedSubscriptionIds.forEach(subId => {
      this.kernel.unsubscribeById(this.scopeId, subId);
    });
    this.ownedSubscriptionIds.clear();
    this.isDisposed = true;
  }

  protected checkDisposed(): void {
    if (this.isDisposed) {
      throw new ValidationError(`Scope "${this.scopeId}" has been disposed`, { scopeId: this.scopeId });
    }
  }
}

/**
 * 2. 核心内核类
 */
export class ContextKernel<ScopeValue extends AnyRecord = AnyRecord> {
  protected schemas = new Map<string, FieldSchema>();
  protected scopeNodes = new Map<string, ScopeNode<ScopeValue>>();
  protected scopes = new Map<string, Scope<ScopeValue>>();
  protected subscriptions = new Map<string, Map<string, SubscriptionRecord>>();
  protected scopeLifecycles = new Map<string, Map<LifecycleHook, Set<ScopeLifecycleCallback<ScopeValue>>>>();
  protected schemaValidators = new Map<string, ValidateFunction>();
  protected ajv = new Ajv({ strict: false, allErrors: true });

  // 当前激活的作用域指针
  protected currentScopeId: string;

  protected rootScopeId: string;
  protected rootScopeName: string;

  // 事务状态
  protected isInTransaction: boolean = false;
  protected transactionSnapshot: KernelSnapshot<ScopeValue> | null = null;

  constructor(opts?: { rootId?: string; rootScopeName?: string }) {
    this.rootScopeId = opts?.rootId ?? 'global_root';
    this.rootScopeName = opts?.rootScopeName ?? 'Global Root';
    this.createScopeInternal(this.rootScopeId, 'root', this.rootScopeName, undefined, { skipLifecycle: true });
    this.currentScopeId = this.rootScopeId;
  }

  /**
   * 内部创建作用域方法，支持跳过生命周期
   */
  protected createScopeInternal(
    id: string,
    type: ScopeType,
    name: string,
    parentId?: string,
    options?: { skipLifecycle?: boolean },
  ): Scope<ScopeValue> {
    if (this.scopeNodes.has(id)) {
      throw new ValidationError(`[Context] Scope "${id}" already exists.`, { scopeId: id });
    }
    if (parentId && !this.scopeNodes.has(parentId)) {
      throw new NotFoundError(`[Context] Parent scope "${parentId}" not found.`, { scopeId: parentId });
    }
    this.scopeNodes.set(id, { id, data: {} as ScopeValue, parentId, children: [], type, name });

    if (parentId) {
      const parent = this.scopeNodes.get(parentId);
      if (parent && !parent.children.includes(id)) parent.children.push(id);
    }

    const scope = new Scope<ScopeValue>(this, id);
    this.scopes.set(id, scope);

    return scope;
  }

  /**
   * 创建作用域节点（同步版本）
   * onMount 生命周期同步触发，确保返回时生命周期已完成
   */
  createScope(id: string, type: ScopeType, name: string, parentId?: string): Scope<ScopeValue> {
    const scope = this.createScopeInternal(id, type, name, parentId);

    // 同步触发 onMount 生命周期
    const node = this.scopeNodes.get(id);
    if (node) {
      this.triggerScopeLifecycle(id, 'onMount', {
        hook: 'onMount',
        scopeId: id,
        node,
      });
    }

    return scope;
  }

  /**
   * 异步创建作用域节点
   * 等待所有 onMount 生命周期回调完成后返回
   */
  async createScopeAsync(id: string, type: ScopeType, name: string, parentId?: string): Promise<Scope<ScopeValue>> {
    const scope = this.createScopeInternal(id, type, name, parentId);

    // 异步触发 onMount 生命周期并等待完成
    const node = this.scopeNodes.get(id);
    if (node) {
      await this.triggerScopeLifecycleAsync(id, 'onMount', {
        hook: 'onMount',
        scopeId: id,
        node,
      });
    }

    return scope;
  }

  registerScopeLifecycle(
    scopeId: string,
    hook: LifecycleHook,
    callback: ScopeLifecycleCallback<ScopeValue>,
  ): () => void {
    if (!this.scopeNodes.has(scopeId)) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });
    let scopeRecord = this.scopeLifecycles.get(scopeId);
    if (!scopeRecord) {
      scopeRecord = new Map();
      this.scopeLifecycles.set(scopeId, scopeRecord);
    }

    let callbacks = scopeRecord.get(hook);
    if (!callbacks) {
      callbacks = new Set();
      scopeRecord.set(hook, callbacks);
    }

    callbacks.add(callback);
    return () => {
      const currentScopeRecord = this.scopeLifecycles.get(scopeId);
      if (!currentScopeRecord) return;
      const currentCallbacks = currentScopeRecord.get(hook);
      if (!currentCallbacks) return;
      currentCallbacks.delete(callback);
      if (currentCallbacks.size === 0) currentScopeRecord.delete(hook);
      if (currentScopeRecord.size === 0) this.scopeLifecycles.delete(scopeId);
    };
  }

  setCurrentScope(id: string) {
    if (!this.scopeNodes.has(id)) throw new NotFoundError(`Scope ${id} does not exist`, { scopeId: id });
    this.currentScopeId = id;
  }

  getCurrentScopeId(): string {
    return this.currentScopeId;
  }

  getCurrentScope(): Scope<ScopeValue> {
    return this.getScope(this.currentScopeId);
  }

  getScope(scopeId?: string): Scope<ScopeValue> {
    const id = scopeId ?? this.currentScopeId;
    if (!this.scopeNodes.has(id)) throw new NotFoundError(`Scope ${id} does not exist`, { scopeId: id });

    const cached = this.scopes.get(id);
    if (cached) return cached;

    const created = new Scope<ScopeValue>(this, id);
    this.scopes.set(id, created);
    return created;
  }

  withScope<T>(scopeId: string, fn: (scope: Scope<ScopeValue>) => T): T {
    return fn(this.getScope(scopeId));
  }

  unset(
    path: string,
    opts?: {
      scopeId?: string;
      role?: string;
      source?: string;
    },
  ): void {
    const scopeId = opts?.scopeId ?? this.currentScopeId;
    const schema = this.getSchema(path);

    this.validateWriteAccess(path, schema, opts?.role);

    const scope = this.scopeNodes.get(scopeId);
    if (!scope) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });
    scope.data = this.setValueByPath(scope.data, path, undefined) as ScopeValue;
    this.notify(path, undefined, {
      source: opts?.source,
      timestamp: Date.now(),
      scopeId,
    });
  }

  clearScope(opts?: { scopeId?: string }): void {
    const scopeId = opts?.scopeId ?? this.currentScopeId;
    const scope = this.scopeNodes.get(scopeId);
    if (!scope) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });
    scope.data = {} as ScopeValue;
    this.notify('.', undefined, {
      source: 'clearScope',
      timestamp: Date.now(),
      scopeId,
    });
  }

  setValueByPath(target: any, path: string, value: unknown): any {
    return produce(target, (draft: any) => {
      set(draft, path, value);
    });
  }

  removeScope(scopeId: string, opts?: { removeDescendants?: boolean }): void {
    if (scopeId === this.rootScopeId) {
      throw new ValidationError('[Context] Root scope cannot be removed', { scopeId });
    }

    const node = this.scopeNodes.get(scopeId);
    if (!node) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });

    const removeDescendants = opts?.removeDescendants ?? true;
    if (!removeDescendants && node.children.length > 0) {
      throw new ValidationError('[Context] Scope has children; removeDescendants=false', {
        scopeId,
        children: [...node.children],
      });
    }

    const idsToRemove = removeDescendants ? this.collectDescendantScopeIds(scopeId) : [scopeId];
    const idsToUnmount = [...idsToRemove].reverse();
    idsToUnmount.forEach(id => {
      const node = this.scopeNodes.get(id);
      if (!node) return;
      this.triggerScopeLifecycle(id, 'onUnmount', { hook: 'onUnmount', scopeId: id, node });
    });

    if (node.parentId) {
      const parent = this.scopeNodes.get(node.parentId);
      if (parent) parent.children = parent.children.filter(id => id !== scopeId);
    }

    idsToRemove.forEach(id => {
      // 清理 Scope 实例持有的资源
      const scope = this.scopes.get(id);
      if (scope) {
        scope.dispose();
      }

      this.scopeNodes.delete(id);
      this.subscriptions.delete(id);
      this.scopes.delete(id);
      this.scopeLifecycles.delete(id);
    });

    if (!this.scopeNodes.has(this.currentScopeId)) {
      this.currentScopeId = this.rootScopeId;
    }
  }

  async removeScopeAsync(scopeId: string, opts?: { removeDescendants?: boolean }): Promise<void> {
    if (scopeId === this.rootScopeId) {
      throw new ValidationError('[Context] Root scope cannot be removed', { scopeId });
    }

    const node = this.scopeNodes.get(scopeId);
    if (!node) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });

    const removeDescendants = opts?.removeDescendants ?? true;
    if (!removeDescendants && node.children.length > 0) {
      throw new ValidationError('[Context] Scope has children; removeDescendants=false', {
        scopeId,
        children: [...node.children],
      });
    }

    const idsToRemove = removeDescendants ? this.collectDescendantScopeIds(scopeId) : [scopeId];
    const idsToUnmount = [...idsToRemove].reverse();
    for (const id of idsToUnmount) {
      const currentNode = this.scopeNodes.get(id);
      if (!currentNode) continue;
      await this.triggerScopeLifecycleAsync(id, 'onUnmount', { hook: 'onUnmount', scopeId: id, node: currentNode });
    }

    if (node.parentId) {
      const parent = this.scopeNodes.get(node.parentId);
      if (parent) parent.children = parent.children.filter(id => id !== scopeId);
    }

    idsToRemove.forEach(id => {
      // 清理 Scope 实例持有的资源
      const scope = this.scopes.get(id);
      if (scope) {
        scope.dispose();
      }

      this.scopeNodes.delete(id);
      this.subscriptions.delete(id);
      this.scopes.delete(id);
      this.scopeLifecycles.delete(id);
    });

    if (!this.scopeNodes.has(this.currentScopeId)) {
      this.currentScopeId = this.rootScopeId;
    }
  }

  /**
   * 创建当前状态快照，用于事务回滚
   */
  protected createSnapshot(): KernelSnapshot<ScopeValue> {
    const scopeNodes = new Map<string, ScopeNode<ScopeValue>>();

    this.scopeNodes.forEach((node, id) => {
      scopeNodes.set(id, {
        ...node,
        data: this.cloneValue(node.data),
        children: [...node.children],
      });
    });

    return {
      scopeNodes,
      timestamp: Date.now(),
    };
  }

  /**
   * 从快照恢复状态
   */
  protected restoreSnapshot(snapshot: KernelSnapshot<ScopeValue>): void {
    // 恢复所有 scope 节点的数据
    snapshot.scopeNodes.forEach((snapshotNode, id) => {
      const currentNode = this.scopeNodes.get(id);
      if (currentNode) {
        currentNode.data = this.cloneValue(snapshotNode.data);
        currentNode.children = [...snapshotNode.children];
      }
    });
  }

  /**
   * 开始事务
   */
  beginTransaction(): void {
    if (this.isInTransaction) {
      throw new TransactionError('[Transaction] Already in a transaction');
    }
    this.isInTransaction = true;
    this.transactionSnapshot = this.createSnapshot();
  }

  /**
   * 提交事务
   */
  commitTransaction(): void {
    if (!this.isInTransaction) {
      throw new TransactionError('[Transaction] No active transaction to commit');
    }
    this.isInTransaction = false;
    this.transactionSnapshot = null;
  }

  /**
   * 回滚事务
   */
  rollbackTransaction(): void {
    if (!this.isInTransaction || !this.transactionSnapshot) {
      throw new TransactionError('[Transaction] No active transaction to rollback');
    }
    this.restoreSnapshot(this.transactionSnapshot);
    this.isInTransaction = false;
    this.transactionSnapshot = null;
  }

  /**
   * 在事务中执行操作，自动处理提交和回滚
   */
  transaction<T>(fn: () => T): T {
    this.beginTransaction();
    try {
      const result = fn();
      this.commitTransaction();
      return result;
    } catch (error) {
      this.rollbackTransaction();
      throw new TransactionError(
        '[Transaction] Transaction failed and rolled back',
        { originalError: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 异步事务
   */
  async transactionAsync<T>(fn: () => Promise<T>): Promise<T> {
    this.beginTransaction();
    try {
      const result = await fn();
      this.commitTransaction();
      return result;
    } catch (error) {
      this.rollbackTransaction();
      throw new TransactionError(
        '[Transaction] Transaction failed and rolled back',
        { originalError: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 批量设置（带原子性保证）
   */
  batchSet(
    operations: Array<{
      path: string;
      value: unknown;
      scopeId?: string;
      role?: string;
      source?: string;
    }>,
    opts?: {
      scopeId?: string;
      role?: string;
      source?: string;
    },
  ): void {
    if (operations.length === 0) return;

    const timestamp = Date.now();
    const normalized = operations.map(op => {
      const scopeId = op.scopeId ?? opts?.scopeId ?? this.currentScopeId;
      return {
        ...op,
        scopeId,
        role: op.role ?? opts?.role,
        source: op.source ?? opts?.source,
      };
    });

    // 创建快照用于回滚
    const snapshot = this.createSnapshot();
    const notificationsToSend: Array<{ path: string; value: unknown; meta: ChangeMeta }> = [];

    try {
      // 1. 校验所有操作
      normalized.forEach(op => {
        if (!this.scopeNodes.has(op.scopeId)) {
          throw new NotFoundError(`Scope ${op.scopeId} does not exist`, { scopeId: op.scopeId });
        }
        const schema = this.getSchema(op.path);
        this.validate(op.path, op.value, schema, op.role);
      });

      // 2. 准备更新数据
      const staged = new Map<string, ScopeValue>();
      normalized.forEach(op => {
        const node = this.scopeNodes.get(op.scopeId)!;
        const base = staged.get(op.scopeId) ?? node.data;
        const next = this.setValueByPath(base, op.path, op.value) as ScopeValue;
        staged.set(op.scopeId, next);
      });

      // 3. 应用更新
      staged.forEach((data, scopeId) => {
        const node = this.scopeNodes.get(scopeId);
        if (node) node.data = data;
      });

      // 4. 收集通知（在所有更新成功后）
      normalized.forEach(op => {
        notificationsToSend.push({
          path: op.path,
          value: op.value,
          meta: {
            source: op.source,
            timestamp,
            scopeId: op.scopeId,
          },
        });
      });
    } catch (error) {
      // 回滚到快照状态
      this.restoreSnapshot(snapshot);
      throw error;
    }

    // 5. 发送通知（在事务成功后）
    notificationsToSend.forEach(({ path, value, meta }) => {
      this.notify(path, value, meta);
    });
  }

  getCurrentScopeValues(options?: { clone?: boolean }): AnyRecord {
    return this.getScopeValues({ scopeId: this.currentScopeId, clone: options?.clone });
  }

  getScopeValues(options?: { scopeId?: string; clone?: boolean }): AnyRecord {
    const scopeId = options?.scopeId ?? this.currentScopeId;
    const node = this.scopeNodes.get(scopeId);
    if (!node) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });

    const raw = node.data;
    return options?.clone ?? true ? this.cloneValue(raw) : (raw as AnyRecord);
  }

  getScopeAndDescendantsValues(options?: { scopeId?: string; clone?: boolean }): Record<string, AnyRecord> {
    const scopeId = options?.scopeId ?? this.currentScopeId;
    if (!this.scopeNodes.has(scopeId)) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });

    const ids = this.collectDescendantScopeIds(scopeId);
    const result: Record<string, AnyRecord> = {};
    ids.forEach(id => {
      result[id] = this.getScopeValues({ scopeId: id, clone: options?.clone });
    });
    return result;
  }

  getAllScopesValues(options?: { clone?: boolean }): Record<string, AnyRecord> {
    const result: Record<string, AnyRecord> = {};
    this.scopeNodes.forEach((_node, id) => {
      result[id] = this.getScopeValues({ scopeId: id, clone: options?.clone });
    });
    return result;
  }

  getSchemaDefinition(path: string): FieldSchema | undefined {
    return this.getSchema(path);
  }

  getFieldDescription(path: string): string | undefined {
    return this.getSchema(path)?.description;
  }

  notifyChange<T = unknown>(
    path: string,
    value: T,
    opts?: {
      scopeId?: string;
      source?: string;
      timestamp?: number;
    },
  ): void {
    this.notify(path, value, {
      source: opts?.source,
      timestamp: opts?.timestamp ?? Date.now(),
      scopeId: opts?.scopeId ?? this.currentScopeId,
    });
  }

  destroy(opts?: { triggerUnmount?: boolean }): void {
    if (opts?.triggerUnmount) {
      const allScopeIds: string[] = [];
      this.scopeNodes.forEach((_node, id) => allScopeIds.push(id));
      const idsToUnmount = allScopeIds.reverse();
      idsToUnmount.forEach(id => {
        const node = this.scopeNodes.get(id);
        if (!node) return;
        this.triggerScopeLifecycle(id, 'onUnmount', { hook: 'onUnmount', scopeId: id, node });
      });
    }

    // 清理所有 Scope 实例
    this.scopes.forEach(scope => {
      scope.dispose();
    });

    this.subscriptions.forEach(scopeSubscriptions => {
      scopeSubscriptions.forEach(record => record.subscribers.clear());
      scopeSubscriptions.clear();
    });

    this.subscriptions.clear();
    this.schemas.clear();
    this.scopeNodes.clear();
    this.scopes.clear();
    this.schemaValidators.clear();
    this.scopeLifecycles.clear();

    // 重置事务状态
    this.isInTransaction = false;
    this.transactionSnapshot = null;

    this.createScopeInternal(this.rootScopeId, 'root', this.rootScopeName, undefined, { skipLifecycle: true });
    this.currentScopeId = this.rootScopeId;
  }

  /**
   * 向上查找逻辑：当前作用域 -> 父级 -> ... -> Root
   */
  get<T = unknown>(path: string, options?: { scopeId?: string }): T | undefined {
    let scopeId: string | undefined = options?.scopeId ?? this.currentScopeId;

    if (options?.scopeId && !this.scopeNodes.has(options.scopeId)) {
      throw new NotFoundError(`Scope ${options.scopeId} does not exist`, { scopeId: options.scopeId });
    }

    while (scopeId) {
      const node = this.scopeNodes.get(scopeId);
      if (!node) break;
      const scopeData = node?.data;

      const value = this.getValueByPath<T>(scopeData, path);
      if (value !== undefined || this.hasPath(scopeData, path)) return value;
      scopeId = node?.parentId;
    }

    // 最终回退到 Schema 默认值
    return this.getSchema(path)?.defaultValue as T | undefined;
  }

  set<T = unknown>(
    path: string,
    value: T,
    opts?: {
      scopeId?: string;
      role?: string;
      source?: string;
    },
  ): void {
    const scopeId = opts?.scopeId ?? this.currentScopeId;
    const schema = this.getSchema(path);

    // 1. 字段描述与权限校验
    this.validate(path, value, schema, opts?.role);

    // 2. 更新数据
    const scope = this.scopeNodes.get(scopeId);
    if (!scope) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });
    scope.data = this.setValueByPath(scope.data, path, value);
    this.notify(path, value, {
      source: opts?.source,
      timestamp: Date.now(),
      scopeId,
    });
  }

  async setAsync<T = unknown>(
    path: string,
    value: T,
    opts?: {
      scopeId?: string;
      role?: string;
      source?: string;
    },
  ): Promise<void> {
    const scopeId = opts?.scopeId ?? this.currentScopeId;
    const schema = this.getSchema(path);

    await this.validateAsync(path, value, schema, opts?.role);

    const scope = this.scopeNodes.get(scopeId);
    if (!scope) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });

    scope.data = this.setValueByPath(scope.data, path, value);
    this.notify(path, value, {
      source: opts?.source,
      timestamp: Date.now(),
      scopeId,
    });
  }

  /**
   * 订阅并返回订阅 ID（内部使用）
   */
  subscribeWithId<T = unknown>(
    path: string,
    cb: Subscriber<T>,
    opts?: { scopeId?: string },
  ): { unsubscribe: () => void; subscriptionId: string } {
    const scopeId = opts?.scopeId ?? this.currentScopeId;
    if (!this.scopeNodes.has(scopeId)) throw new NotFoundError(`Scope ${scopeId} does not exist`, { scopeId });

    const normalizedPath = Path.parse(path).toString();
    let scopeSubscriptions = this.subscriptions.get(scopeId);
    if (!scopeSubscriptions) {
      scopeSubscriptions = new Map();
      this.subscriptions.set(scopeId, scopeSubscriptions);
    }

    let record = scopeSubscriptions.get(normalizedPath);
    if (!record) {
      record = { id: normalizedPath, pattern: Path.parse(normalizedPath), subscribers: new Map() };
      scopeSubscriptions.set(normalizedPath, record);
    }

    const subscriptionId = generateSubscriptionId();
    record.subscribers.set(subscriptionId, cb as Subscriber<any>);

    const unsubscribe = () => {
      // 检查作用域是否还存在
      const currentScopeSubscriptions = this.subscriptions.get(scopeId);
      if (!currentScopeSubscriptions) return;

      const current = currentScopeSubscriptions.get(normalizedPath);
      if (!current) return;

      // 使用 ID 精确删除，避免闭包引用问题
      current.subscribers.delete(subscriptionId);

      // 清理空记录
      if (current.subscribers.size === 0) {
        currentScopeSubscriptions.delete(normalizedPath);
      }
      if (currentScopeSubscriptions.size === 0) {
        this.subscriptions.delete(scopeId);
      }
    };

    return { unsubscribe, subscriptionId };
  }

  /**
   * 通过订阅 ID 取消订阅（内部使用）
   */
  unsubscribeById(scopeId: string, subscriptionId: string): boolean {
    const scopeSubscriptions = this.subscriptions.get(scopeId);
    if (!scopeSubscriptions) return false;

    for (const [pathKey, record] of scopeSubscriptions) {
      if (record.subscribers.has(subscriptionId)) {
        record.subscribers.delete(subscriptionId);

        // 清理空记录
        if (record.subscribers.size === 0) {
          scopeSubscriptions.delete(pathKey);
        }
        if (scopeSubscriptions.size === 0) {
          this.subscriptions.delete(scopeId);
        }
        return true;
      }
    }
    return false;
  }

  subscribe<T = unknown>(path: string, cb: Subscriber<T>, opts?: { scopeId?: string }): () => void {
    const { unsubscribe } = this.subscribeWithId(path, cb, opts);
    return unsubscribe;
  }

  registerSchema(schema: FieldSchema) {
    this.schemas.set(schema.key, schema);
    this.schemaValidators.delete(schema.key);
  }

  // ===== 内部工具函数 ===== //

  protected getValueByPath<T = unknown>(obj: unknown, path: string): T | undefined {
    if (!obj) return undefined;
    return Path.getIn(obj as any, path) as T | undefined;
  }

  protected hasPath(obj: unknown, path: string): boolean {
    if (!obj) return false;
    return Boolean(Path.existIn(obj as any, path));
  }

  protected cloneValue<T>(value: T): T {
    if (!value || typeof value !== 'object') return value;
    const maybeStructuredClone = (globalThis as any).structuredClone as undefined | ((v: any) => any);
    if (typeof maybeStructuredClone === 'function') return maybeStructuredClone(value);
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  protected collectDescendantScopeIds(scopeId: string): string[] {
    const result: string[] = [];
    const queue: string[] = [scopeId];
    let i = 0;

    while (i < queue.length) {
      const current = queue[i++]!;
      const node = this.scopeNodes.get(current);
      if (!node) continue;
      result.push(current);
      queue.push(...node.children);
    }

    return result;
  }

  validate(path: string, value: unknown, schema?: FieldSchema, role?: string) {
    if (!schema) return;

    this.validateWriteAccess(path, schema, role);

    // 字段描述校验：枚举/自定义校验
    if (schema.enums && !schema.enums.includes(value)) {
      throw new ValidationError(`[Validation] Value "${value}" is not in enums for ${path}`, { path, value });
    }

    if (schema.schema) {
      const validator = this.getSchemaValidator(schema);
      const valid = validator(value);
      if (!valid) {
        throw new ValidationError(`[Validation] ${this.ajv.errorsText(validator.errors)}`, {
          path,
          errors: validator.errors,
        });
      }
    }

    if (schema.validate) {
      const result = schema.validate(value);
      if (this.isPromiseLike(result)) {
        throw new ValidationError('[Validation] Async validator is not supported in set(); use setAsync()', { path });
      }
      if (result !== true) throw new ValidationError(`[Validation] ${result || 'Invalid value'}`, { path, value });
    }
  }

  async validateAsync(path: string, value: unknown, schema?: FieldSchema, role?: string): Promise<void> {
    if (!schema) return;

    this.validateWriteAccess(path, schema, role);

    if (schema.enums && !schema.enums.includes(value)) {
      throw new ValidationError(`[Validation] Value "${value}" is not in enums for ${path}`, { path, value });
    }

    if (schema.schema) {
      const validator = this.getSchemaValidator(schema);
      const valid = validator(value);
      if (!valid) {
        throw new ValidationError(`[Validation] ${this.ajv.errorsText(validator.errors)}`, {
          path,
          errors: validator.errors,
        });
      }
    }

    if (schema.validate) {
      const result = schema.validate(value);
      const resolved = this.isPromiseLike(result) ? await result : result;
      if (resolved !== true) throw new ValidationError(`[Validation] ${resolved || 'Invalid value'}`, { path, value });
    }
  }

  protected validateWriteAccess(path: string, schema?: FieldSchema, role?: string) {
    if (!schema) return;

    if (schema.writable === false) {
      throw new AuthError(`[Auth] Field "${path}" is not writable`, { path, role });
    }

    if (schema.writeRoles && schema.writeRoles.length > 0) {
      if (!role || !schema.writeRoles.includes(role)) {
        throw new AuthError(`[Auth] Role "${role}" has no permission to write "${path}"`, { path, role });
      }
    }
  }

  protected isPromiseLike(value: unknown): value is PromiseLike<unknown> {
    return !!value && (typeof value === 'object' || typeof value === 'function') && 'then' in (value as any);
  }

  protected getSchemaValidator(schema: FieldSchema): ValidateFunction {
    const key = schema.key;
    const cached = this.schemaValidators.get(key);
    if (cached) return cached;
    const compiled = this.ajv.compile(schema.schema as any);
    this.schemaValidators.set(key, compiled);
    return compiled;
  }

  protected getSchema(path: string) {
    return this.schemas.get(path);
  }

  protected notify(path: string, value: unknown, meta: ChangeMeta) {
    const triggerPath = Path.parse(path);

    const scopeSubscriptions = this.subscriptions.get(meta.scopeId);
    if (!scopeSubscriptions) {
      this.triggerScopeLifecycle(meta.scopeId, 'onDataChange', {
        hook: 'onDataChange',
        scopeId: meta.scopeId,
        path,
        value,
        meta,
        node: this.scopeNodes.get(meta.scopeId),
      });
      return;
    }

    scopeSubscriptions.forEach((record, subPathStr) => {
      const subPattern = record.pattern;

      // A. 精确/通配符匹配 (Match)
      let isMatched = subPathStr === path;
      if (!isMatched) {
        // 只有不相等时才进行复杂的正则/AST 匹配
        try {
          isMatched = subPattern.match(triggerPath);
        } catch {
          isMatched = false;
        }
      }

      if (isMatched) {
        record.subscribers.forEach(cb => cb(value, meta));
        return;
      }

      // B. 向下级联 (Cascade): 父变子变
      if (subPattern.includes(triggerPath)) {
        const relativeSegments = this.getRelativeSegments(triggerPath, subPattern);

        if (this.segmentsHasWildcard(relativeSegments)) {
          const values = this.collectValuesBySegments(value, relativeSegments);
          if (values.length > 0) {
            record.subscribers.forEach(cb => {
              values.forEach(v => cb(v, { ...meta, source: 'cascade' }));
            });
          } else {
            record.subscribers.forEach(cb => cb(undefined, { ...meta, source: 'cascade' }));
          }
          return;
        }

        const subValue = this.getValueBySegments(value, relativeSegments);
        record.subscribers.forEach(cb => cb(subValue, { ...meta, source: 'cascade' }));
        return;
      }

      // C. 向上冒泡 (Bubble): 子变父变
      // 场景：订阅了 "user"，更新了 "user.name"
      if (triggerPath.includes(subPattern)) {
        // 父级需要获取完整的新数据。由于我们更新了 node.data，直接从 scope 取即可
        const fullValue = this.get(subPathStr, { scopeId: meta.scopeId });
        record.subscribers.forEach(cb => cb(fullValue, { ...meta, source: 'bubble' }));
      }
    });

    this.triggerScopeLifecycle(meta.scopeId, 'onDataChange', {
      hook: 'onDataChange',
      scopeId: meta.scopeId,
      path,
      value,
      meta,
      node: this.scopeNodes.get(meta.scopeId),
    });
  }

  protected triggerScopeLifecycle(scopeId: string, hook: LifecycleHook, event: ScopeLifecycleEvent<ScopeValue>) {
    const scopeRecord = this.scopeLifecycles.get(scopeId);
    const callbacks = scopeRecord?.get(hook);
    if (!callbacks || callbacks.size === 0) return;

    callbacks.forEach(cb => {
      try {
        void cb(event);
      } catch {
        return;
      }
    });
  }

  protected async triggerScopeLifecycleAsync(
    scopeId: string,
    hook: LifecycleHook,
    event: ScopeLifecycleEvent<ScopeValue>,
  ): Promise<void> {
    const scopeRecord = this.scopeLifecycles.get(scopeId);
    const callbacks = scopeRecord?.get(hook);
    if (!callbacks || callbacks.size === 0) return;

    const tasks: Array<Promise<void>> = [];
    callbacks.forEach(cb => {
      try {
        tasks.push(Promise.resolve(cb(event) as any));
      } catch (err) {
        tasks.push(Promise.reject(err));
      }
    });

    const results = await Promise.allSettled(tasks);
    const firstRejected = results.find(r => r.status === 'rejected');
    if (firstRejected && firstRejected.status === 'rejected') {
      throw firstRejected.reason;
    }
  }

  protected getRelativeSegments(triggerPath: Path, subPath: Path): Array<string | number> {
    const triggerSegments = triggerPath.toArr();
    const subSegments = subPath.toArr();
    return subSegments.slice(triggerSegments.length);
  }

  protected segmentsHasWildcard(segments: Array<string | number>): boolean {
    return segments.some(s => s === '*');
  }

  protected collectValuesBySegments(rootValue: unknown, segments: Array<string | number>): unknown[] {
    let values: unknown[] = [rootValue];

    for (const segment of segments) {
      if (segment === '*') {
        const expanded: unknown[] = [];
        for (const v of values) {
          if (!v || (typeof v !== 'object' && typeof v !== 'function')) continue;
          if (Array.isArray(v)) {
            expanded.push(...v);
            continue;
          }
          expanded.push(...Object.values(v as Record<string, unknown>));
        }
        values = expanded;
        continue;
      }

      values = values.map(v => {
        if (!v || (typeof v !== 'object' && typeof v !== 'function')) return undefined;
        return (v as any)[segment as any];
      });
    }

    return values;
  }

  protected getValueBySegments(rootValue: unknown, segments: Array<string | number>): unknown {
    if (segments.length === 0) return rootValue;
    let current: any = rootValue;
    for (const seg of segments) {
      if (!current || (typeof current !== 'object' && typeof current !== 'function')) return undefined;
      current = current[seg as any];
    }
    return current;
  }
}
