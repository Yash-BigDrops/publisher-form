type Bucket = { tokens: number; last: number };
const globalAny = globalThis as { __RL__?: Map<string, Bucket> };
if (!globalAny.__RL__) globalAny.__RL__ = new Map<string, Bucket>();
const RL: Map<string, Bucket> = globalAny.__RL__;

export function rateLimit(key: string, opts = { capacity: 10, refillPerSec: 1 }): boolean {
  const now = Date.now();
  const b = RL.get(key) || { tokens: opts.capacity, last: now };
  const elapsed = (now - b.last) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec);
  b.last = now;
  if (b.tokens < 1) { RL.set(key, b); return false; }
  b.tokens -= 1; RL.set(key, b);
  return true;
}
