# Analytics Metric IDs

Metrics v2 exposes canonical identifiers for analytics.

- `tonnage_kg` – total load in kilograms
- `density_kg_min` – tonnage per minute
- `avg_rest_ms` – average rest time per set (milliseconds)
- `set_efficiency_pct` – set efficiency percentage

Example usage:

```ts
import { TONNAGE_ID } from '@/pages/analytics/metricIds';

const value = totals[TONNAGE_ID];
```
