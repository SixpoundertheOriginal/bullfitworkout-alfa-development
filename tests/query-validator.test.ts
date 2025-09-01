import { describe, it, expect } from 'vitest';
import {
  validateQuery,
  quickValidateQuery,
} from '../supabase/functions/_shared/query-validator';
import { createErrorResponse } from '../supabase/functions/_shared/error-response';

describe('query validator', () => {
  const projectId = 'aso-reporting-1';

  it('detects double backticks', () => {
    const q = 'SELECT * FROM ``bad.table`';
    const res = validateQuery(q, projectId);
    expect(res.valid).toBe(false);
    expect(res.issues.some(i => i.message.includes('Double backticks'))).toBe(true);
  });

  it('flags missing project id', () => {
    const q = 'SELECT * FROM `other.dataset.table`';
    const res = validateQuery(q, projectId);
    expect(res.valid).toBe(false);
  });

  it('quick validation blocks injection patterns', () => {
    const q = 'SELECT * FROM `aso-reporting-1.d.t`; DROP TABLE users';
    const res = quickValidateQuery(q, projectId);
    expect(res.valid).toBe(false);
  });

  it('accepts valid parameterized query', () => {
    const q = `SELECT * FROM \`${projectId}.d.t\` WHERE id = @id LIMIT 10`;
    const res = validateQuery(q, projectId);
    expect(res.valid).toBe(true);
  });

  it('warns on large limit and missing where', () => {
    const q = `SELECT * FROM \`${projectId}.d.t\` LIMIT 20000`;
    const res = validateQuery(q, projectId);
    expect(res.issues.some(i => i.message.includes('LIMIT value too large'))).toBe(true);
    expect(res.issues.some(i => i.message.includes('Missing WHERE clause'))).toBe(true);
  });

  it('formats error response', async () => {
    const r = createErrorResponse('TEST', { message: 'oops', extra: 1 });
    expect(r.status).toBe(400);
    const body = await r.json();
    expect(body.error.type).toBe('TEST');
    expect(body.error.message).toBe('oops');
    expect(body.error.details).toEqual({ extra: 1 });
  });
});
