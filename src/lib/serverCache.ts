/**
 * Tiny in-process TTL cache for rows that are read on literally every request
 * but change rarely — the signed-in user and their workspace.
 *
 * Why in-process rather than the Next data cache: these lookups are per-user
 * and feed auth decisions, so they must never be shared across users or
 * persisted. A warm serverless instance serves them for free; a cold one pays
 * one round trip and then warms up.
 *
 * Deliberately NOT used for the dashboard's numbers — those change whenever an
 * invoice is uploaded or a voucher approved, and showing a stale count is worse
 * than spending 160ms.
 */
interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

// Bound the map so a long-lived instance with many users cannot grow forever.
const MAX_ENTRIES = 2000;

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): T {
  if (store.size >= MAX_ENTRIES) store.clear();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

/** Drop every entry whose key starts with `prefix` (used on workspace changes). */
export function cacheDeletePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export const TTL = {
  /** User row: only changes on profile edits, which are rare. */
  user: 60_000,
  /** Client row: name/GSTIN edits are rare; switching changes the cookie key. */
  client: 60_000,
  /** Client list for the switcher: invalidated explicitly on create/switch. */
  clientList: 30_000,
} as const;
