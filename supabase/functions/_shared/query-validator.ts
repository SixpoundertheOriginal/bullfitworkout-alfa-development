export type IssueType = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ValidationIssue {
  type: IssueType;
  message: string;
  position?: number;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  metadata: {
    backtickCount: number;
    hasParameters: boolean;
    queryLength: number;
    tableReferences: string[];
  };
}

export function validateQuery(query: string, expectedProjectId: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const backtickCount = (query.match(/`/g) || []).length;
  const tableReferences: Set<string> = new Set();

  if (query.includes('``')) {
    issues.push({
      type: 'CRITICAL',
      message: 'Double backticks detected',
      position: query.indexOf('``'),
    });
  }

  if (backtickCount % 2 !== 0) {
    issues.push({ type: 'CRITICAL', message: 'Unmatched backticks' });
  }

  if (!query.includes(expectedProjectId)) {
    issues.push({ type: 'CRITICAL', message: 'Missing expected project ID' });
  }

  const tableRegex = /`?([\w-]+\.[\w-]+\.[\w-]+)`?/g;
  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(query)) !== null) {
    const ref = match[1];
    tableReferences.add(ref);
    if (!ref.startsWith(`${expectedProjectId}.`)) {
      issues.push({ type: 'CRITICAL', message: `Malformed table reference: ${ref}` });
    }
  }

  if (/;|--/.test(query)) {
    issues.push({ type: 'CRITICAL', message: 'SQL statement delimiter detected' });
  }
  if (/\b(drop|delete|insert)\b/i.test(query)) {
    issues.push({ type: 'WARNING', message: 'Destructive SQL keyword detected' });
  }
  if (query.includes('${') || query.includes('{{')) {
    issues.push({ type: 'WARNING', message: 'Dynamic table name indicator detected' });
  }
  const hasParameters = query.includes('@');
  if (!hasParameters) {
    issues.push({ type: 'WARNING', message: 'Query has no parameters' });
  }

  if (/^\s*select/i.test(query)) {
    if (!/\blimit\s+\d+/i.test(query)) {
      issues.push({ type: 'WARNING', message: 'Missing LIMIT clause' });
    }
    const limitMatch = query.match(/\blimit\s+(\d+)/i);
    if (limitMatch && parseInt(limitMatch[1], 10) > 10000) {
      issues.push({ type: 'WARNING', message: 'LIMIT value too large' });
    }
    if (!/\bwhere\b/i.test(query)) {
      issues.push({ type: 'WARNING', message: 'Missing WHERE clause' });
    }
  }

  const complexity = (query.match(/\b(join|union|with)\b/gi) || []).length;
  if (complexity > 3) {
    issues.push({ type: 'INFO', message: 'High query complexity' });
  }

  return {
    valid: issues.every((i) => i.type !== 'CRITICAL'),
    issues,
    metadata: {
      backtickCount,
      hasParameters,
      queryLength: query.length,
      tableReferences: Array.from(tableReferences),
    },
  };
}

export function quickValidateQuery(
  query: string,
  projectId: string,
): { valid: boolean; reason?: string } {
  if (query.includes('``')) {
    return { valid: false, reason: 'Double backticks detected' };
  }
  if (!query.includes(projectId)) {
    return { valid: false, reason: 'Missing project ID' };
  }
  if (/;|--|\b(drop|delete|insert)\b/i.test(query)) {
    return { valid: false, reason: 'SQL injection risk' };
  }
  return { valid: true };
}
