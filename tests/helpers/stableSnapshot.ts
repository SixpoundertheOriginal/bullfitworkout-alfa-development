export function withoutVolatile<T extends Record<string, any>>(o: T): T {
  if (!o || typeof o !== 'object') return o;
  const strip = (val: any): any => {
    if (Array.isArray(val)) return val.map(strip);
    if (val && typeof val === 'object') {
      const { generatedAt, updatedAt, createdAt, timestamp, ...rest } = val as any;
      return Object.fromEntries(
        Object.entries(rest).map(([k, v]) => [k, strip(v)])
      );
    }
    return val;
  };
  return strip(o);
}
