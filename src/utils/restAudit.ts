// Temporary REST audit logging helpers. Guarded by a DEBUG flag.
// Usage: set localStorage.DEBUG_REST_AUDIT = '1' (or window.DEBUG_REST_AUDIT = true)
// or set VITE_DEBUG_REST_AUDIT=true for builds.

type AnyRecord = Record<string, any>;

function readEnvFlag(): boolean {
  try {
    // Vite-style env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viteFlag = (import.meta as any)?.env?.VITE_DEBUG_REST_AUDIT;
    if (typeof viteFlag === 'string') {
      return viteFlag.toLowerCase() === 'true' || viteFlag === '1';
    }
  } catch {}
  try {
    // Node env (unlikely in browser, but safe)
    // eslint-disable-next-line no-undef
    if (typeof process !== 'undefined' && process.env && process.env.DEBUG_REST_AUDIT) {
      // eslint-disable-next-line no-undef
      const v = process.env.DEBUG_REST_AUDIT as string;
      return v.toLowerCase() === 'true' || v === '1';
    }
  } catch {}
  return false;
}

export function isRestAuditEnabled(): boolean {
  try {
    if (typeof window !== 'undefined') {
      // window flag wins
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = (window as any).DEBUG_REST_AUDIT;
      if (typeof w === 'boolean') return w;
      // localStorage flag
      const v = localStorage.getItem('DEBUG_REST_AUDIT');
      if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
    }
  } catch {}
  return readEnvFlag();
}

function redact(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  // Avoid mutating input
  const clone: AnyRecord = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.toLowerCase();
    // redact common PII/user keys
    if (key === 'user_id' || key === 'userid') {
      clone[k] = '***';
    } else if (key === 'user' && v && typeof v === 'object') {
      const userClone: AnyRecord = { ...v };
      if ('id' in userClone) userClone.id = '***';
      if ('email' in userClone) userClone.email = '***';
      clone[k] = userClone;
    } else if (key === 'id' && typeof v === 'string' && v.length > 12) {
      // likely a UUID; mask
      clone[k] = `${v.slice(0, 6)}***`;
    } else {
      clone[k] = redact(v);
    }
  }
  return clone;
}

export function restAuditLog(event: string, data?: AnyRecord) {
  if (!isRestAuditEnabled()) return;
  const payload = data ? redact(data) : undefined;
  try {
    // Single structured console line for easy filtering
    console.log('[REST_AUDIT]', event, payload ?? {});
  } catch (e) {
    // no-op
  }
}

