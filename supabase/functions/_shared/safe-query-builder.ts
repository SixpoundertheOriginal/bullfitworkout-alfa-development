export interface BigQueryParameter {
  name: string;
  parameterType: { type: string };
  parameterValue: { value: string | number };
}

export class SafeQueryBuilder {
  public readonly projectId: string;
  public readonly dataset: string;

  constructor(projectId: string, dataset = 'client_reports') {
    if (!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(projectId)) {
      throw new Error('Invalid projectId format');
    }
    if (projectId.includes('`')) {
      throw new Error('projectId must not contain backticks');
    }
    this.projectId = projectId;
    this.dataset = dataset;
  }

  private buildTableReference(tableName: string): string {
    if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }
    const fullTableName = `\`${this.projectId}.${this.dataset}.${tableName}\``;
    console.log('[SafeQueryBuilder] table reference constructed:', { fullTableName });
    return fullTableName;
  }

  private validateQuery(query: string, parameters: BigQueryParameter[]): { hasDoubleBacktick: boolean; backtickCount: number } {
    const hasDoubleBacktick = query.includes('``');
    const projectCount = (query.match(new RegExp(this.projectId, 'g')) || []).length;
    const backtickCount = (query.match(/`/g) || []).length;

    const paramNamesInQuery = Array.from(query.matchAll(/@(\w+)/g)).map(m => m[1]);
    const paramNames = parameters.map(p => p.name);

    const missing = paramNamesInQuery.filter(n => !paramNames.includes(n));
    const extra = paramNames.filter(n => !paramNamesInQuery.includes(n));

    if (hasDoubleBacktick) throw new Error('Query contains double backticks');
    if (projectCount !== 1) throw new Error('Project ID appears unexpected number of times in query');
    if (backtickCount % 2 !== 0) throw new Error('Unmatched backticks in query');
    if (missing.length || extra.length) throw new Error('Parameter mismatch in query');

    return { hasDoubleBacktick, backtickCount };
  }

  private log(methodName: string, fullTableName: string, query: string, parameters: BigQueryParameter[], info: { hasDoubleBacktick: boolean; backtickCount: number }) {
    console.log(`[SafeQueryBuilder] ${methodName} query constructed:`, {
      projectId: this.projectId,
      fullTableName,
      hasDoubleBacktick: info.hasDoubleBacktick,
      backtickCount: info.backtickCount,
      parameterCount: parameters.length,
      queryLength: query.length,
    });
  }

  buildDiscoveryQuery(tableName: string, clientFilters: string[], dateFrom: string, dateTo: string) {
    const fullTableName = this.buildTableReference(tableName);
    const clientConditions: string[] = [];
    const parameters: BigQueryParameter[] = [];

    clientFilters.forEach((client, idx) => {
      const name = `client${idx}`;
      clientConditions.push(`client = @${name}`);
      parameters.push({
        name,
        parameterType: { type: 'STRING' },
        parameterValue: { value: client },
      });
    });

    const whereClauses = [
      clientFilters.length ? `(${clientConditions.join(' OR ')})` : '1=1',
      `date >= @dateFrom`,
      `date <= @dateTo`,
    ];

    parameters.push(
      { name: 'dateFrom', parameterType: { type: 'STRING' }, parameterValue: { value: dateFrom } },
      { name: 'dateTo', parameterType: { type: 'STRING' }, parameterValue: { value: dateTo } },
    );

    const query = `SELECT * FROM ${fullTableName} WHERE ${whereClauses.join(' AND ')}`;

    const info = this.validateQuery(query, parameters);
    this.log('buildDiscoveryQuery', fullTableName, query, parameters, info);

    return { query, parameters };
  }

  buildDataQuery(
    tableName: string,
    clientFilters: string[],
    dateFrom: string,
    dateTo: string,
    trafficFilters: string[] = [],
    limit?: number,
  ) {
    const fullTableName = this.buildTableReference(tableName);
    const clientConditions: string[] = [];
    const trafficConditions: string[] = [];
    const parameters: BigQueryParameter[] = [];

    clientFilters.forEach((client, idx) => {
      const name = `client${idx}`;
      clientConditions.push(`client = @${name}`);
      parameters.push({
        name,
        parameterType: { type: 'STRING' },
        parameterValue: { value: client },
      });
    });

    trafficFilters.forEach((source, idx) => {
      const name = `trafficSource${idx}`;
      trafficConditions.push(`traffic_source = @${name}`);
      parameters.push({
        name,
        parameterType: { type: 'STRING' },
        parameterValue: { value: source },
      });
    });

    const conditions = [
      clientConditions.length ? `(${clientConditions.join(' OR ')})` : null,
      trafficConditions.length ? `(${trafficConditions.join(' OR ')})` : null,
      `date >= @dateFrom`,
      `date <= @dateTo`,
    ].filter(Boolean);

    parameters.push(
      { name: 'dateFrom', parameterType: { type: 'STRING' }, parameterValue: { value: dateFrom } },
      { name: 'dateTo', parameterType: { type: 'STRING' }, parameterValue: { value: dateTo } },
    );

    let query = `SELECT * FROM ${fullTableName} WHERE ${conditions.join(' AND ')}`;
    if (typeof limit === 'number') {
      query += ` LIMIT @queryLimit`;
      parameters.push({
        name: 'queryLimit',
        parameterType: { type: 'INTEGER' },
        parameterValue: { value: limit },
      });
    }

    const info = this.validateQuery(query, parameters);
    this.log('buildDataQuery', fullTableName, query, parameters, info);

    return { query, parameters };
  }

  buildAppDiscoveryQuery(
    tableName: string,
    dateFrom: string,
    dateTo: string,
    limit?: number,
  ) {
    const fullTableName = this.buildTableReference(tableName);
    const parameters: BigQueryParameter[] = [
      { name: 'dateFrom', parameterType: { type: 'STRING' }, parameterValue: { value: dateFrom } },
      { name: 'dateTo', parameterType: { type: 'STRING' }, parameterValue: { value: dateTo } },
    ];

    let query = `SELECT * FROM ${fullTableName} WHERE date >= @dateFrom AND date <= @dateTo`;
    if (typeof limit === 'number') {
      query += ` LIMIT @queryLimit`;
      parameters.push({
        name: 'queryLimit',
        parameterType: { type: 'INTEGER' },
        parameterValue: { value: limit },
      });
    }

    const info = this.validateQuery(query, parameters);
    this.log('buildAppDiscoveryQuery', fullTableName, query, parameters, info);

    return { query, parameters };
  }
}

