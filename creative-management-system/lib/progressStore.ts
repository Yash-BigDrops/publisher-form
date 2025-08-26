type ProgressState =
  | { status: 'queued' | 'running'; pct: number; note?: string; meta?: unknown }
  | { status: 'done'; pct: 100; result?: unknown; meta?: unknown }
  | { status: 'error'; pct: number; error: string; meta?: unknown };

const GLOBAL = globalThis as { __PROGRESS_KV__?: Map<string, { value: ProgressState; expiresAt: number }> };
if (!GLOBAL.__PROGRESS_KV__) GLOBAL.__PROGRESS_KV__ = new Map<string, { value: ProgressState; expiresAt: number }>();
const KV: Map<string, { value: ProgressState; expiresAt: number }> = GLOBAL.__PROGRESS_KV__;

const DEFAULT_TTL_MS = 30 * 60 * 1000; 

function now() { return Date.now(); }
function gc() {
  const t = now();
  for (const [k, v] of KV.entries()) if (v.expiresAt <= t) KV.delete(k);
}

export function progressStart(id: string, meta?: unknown, ttlMs = DEFAULT_TTL_MS) {
  gc();
  KV.set(id, { value: { status: 'queued', pct: 0, meta }, expiresAt: now() + ttlMs });
}

export function progressUpdate(id: string, pct: number, note?: string, metaPatch?: unknown, ttlMs = DEFAULT_TTL_MS) {
  const cur = KV.get(id)?.value;
  const mergedMeta = { ...(cur as { meta?: Record<string, unknown> })?.meta, ...(metaPatch as Record<string, unknown> || {}) };
  KV.set(id, {
    value: { status: 'running', pct: Math.max(0, Math.min(99, Math.round(pct))), note, meta: mergedMeta },
    expiresAt: now() + ttlMs
  });
}

export function progressDone(id: string, result?: unknown, ttlMs = DEFAULT_TTL_MS) {
  KV.set(id, { value: { status: 'done', pct: 100, result }, expiresAt: now() + ttlMs });
}

export function progressError(id: string, error: string, pct = 0, ttlMs = DEFAULT_TTL_MS) {
  KV.set(id, { value: { status: 'error', pct, error }, expiresAt: now() + ttlMs });
}

export function progressGet(id: string): ProgressState | null {
  gc();
  const v = KV.get(id);
  return v ? v.value : null;
}
