# Analytics Metric IDs

Metrics v2 exposes canonical identifiers for analytics.

- `tonnage_kg` – total load in kilograms
- `density_kg_min` – tonnage per minute
- `avg_rest_sec` – average rest time per set (seconds)
- `set_efficiency_kg_per_min` – set efficiency in kilograms per minute

Example usage:

```ts
import { TONNAGE_ID } from '@/pages/analytics/metricIds';

const value = totals[TONNAGE_ID];
```
