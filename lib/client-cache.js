const CACHE_PREFIX = "sw-cache:v1:";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getKey(key) {
  return `${CACHE_PREFIX}${key}`;
}

export function readCachedValue(key, maxAgeMs) {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(getKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { value, savedAt } = parsed;
    if (!savedAt || !Number.isFinite(savedAt)) return null;
    if (Number.isFinite(maxAgeMs) && maxAgeMs > 0 && Date.now() - savedAt > maxAgeMs) {
      return null;
    }
    return { value, savedAt };
  } catch {
    return null;
  }
}

export function writeCachedValue(key, value) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(
      getKey(key),
      JSON.stringify({
        value,
        savedAt: Date.now(),
      })
    );
  } catch {
    // ignore cache write failures
  }
}

export function clearCachedValue(key) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(getKey(key));
  } catch {
    // ignore cache delete failures
  }
}
