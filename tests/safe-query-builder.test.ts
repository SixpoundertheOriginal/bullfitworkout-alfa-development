import { describe, it, expect } from 'vitest';
import { SafeQueryBuilder } from '../supabase/functions/_shared/safe-query-builder';

describe('SafeQueryBuilder', () => {
  it('throws when projectId contains backtick', () => {
    expect(() => new SafeQueryBuilder('aso`reporting')).toThrow();
  });

  it('throws when table name has invalid characters', () => {
    const builder = new SafeQueryBuilder('aso-reporting-1');
    expect(() =>
      builder.buildDiscoveryQuery('invalid-table!', [], '2024-01-01', '2024-01-02'),
    ).toThrow();
  });

  it('builds discovery query with parameters', () => {
    const builder = new SafeQueryBuilder('aso-reporting-1');
    const { query, parameters } = builder.buildDiscoveryQuery(
      'aso_all_apple',
      ['clientA'],
      '2024-01-01',
      '2024-01-31',
    );
    expect(query).toContain('`aso-reporting-1.client_reports.aso_all_apple`');
    expect(parameters.map((p) => p.name)).toEqual(['client0', 'dateFrom', 'dateTo']);
  });
});
