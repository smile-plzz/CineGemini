type CacheRecord<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheRecord<unknown>>();

const readSessionStorage = (key: string): string | null => {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeSessionStorage = (key: string, value: string) => {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage errors in restricted environments.
  }
};

export const readSessionValue = <T>(key: string): T | null => {
  const raw = readSessionStorage(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const writeSessionValue = <T>(key: string, value: T) => {
  writeSessionStorage(key, JSON.stringify(value));
};

export const getSessionCache = <T>(key: string): T | null => {
  const now = Date.now();
  const cached = memoryCache.get(key) as CacheRecord<T> | undefined;
  if (cached && cached.expiresAt > now) return cached.value;
  if (cached) memoryCache.delete(key);

  const raw = readSessionStorage(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CacheRecord<T>;
    if (parsed.expiresAt > now) {
      memoryCache.set(key, parsed);
      return parsed.value;
    }
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
  return null;
};

export const setSessionCache = <T>(key: string, value: T, ttlMs: number) => {
  const record: CacheRecord<T> = { value, expiresAt: Date.now() + ttlMs };
  memoryCache.set(key, record);
  writeSessionStorage(key, JSON.stringify(record));
};
