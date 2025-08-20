export interface Cursor {
  ts: string;
  id: string | number;
}

export function buildCursorFilter(cursor: Cursor | null) {
  if (!cursor) return undefined;
  const { ts, id } = cursor;
  return [
    `start_time.gt.${ts}`,
    `and(start_time.eq.${ts},id.gt.${id})`,
    `and(start_time.is.null,created_at.gt.${ts})`,
    `and(start_time.is.null,created_at.eq.${ts},id.gt.${id})`
  ].join(',');
}
