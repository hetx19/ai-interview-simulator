import { AsyncLocalStorage } from 'node:async_hooks';

export interface CorrelationContext {
  correlationId: string;
  userId?: string;
}

export const store = new AsyncLocalStorage<CorrelationContext>();

export function runWithCorrelation<T>(
  ctx: CorrelationContext,
  fn: () => Promise<T> | T,
): Promise<T> {
  return Promise.resolve(store.run(ctx, fn));
}

export function getCorrelationId(): string {
  return store.getStore()?.correlationId ?? 'unknown';
}

export function getUserIdFromStore(): string | undefined {
  return store.getStore()?.userId;
}

export function setUserId(userId: string): void {
  const s = store.getStore();
  if (s) {
    s.userId = userId;
  }
}

export function resolveCorrelationId(headerValue?: string | null): string {
  if (headerValue && typeof headerValue === 'string' && headerValue.trim().length > 0) {
    return headerValue.trim().slice(0, 128);
  }
  return crypto.randomUUID();
}

