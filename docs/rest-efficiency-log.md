# Rest Efficiency Logging

This document describes the diagnostic logs emitted by the metrics v2 service for monitoring rest-related data quality.

## `[v2.audit.rest_eff]`
One-time audit log that checks whether derived rest efficiency metrics are present.

Fields:
- `hasKpi` – `true` when set efficiency KPI totals are available.
- `hasSeries` – `true` when set efficiency time series exists.
- `restCoveragePct` – percentage of potential rest intervals that include explicit rest values (0–100).

## `[v2.build.rest_eff]`
Summary log emitted after metrics are built.

Fields:
- `restCoveragePct` – percent of rest intervals with data (0–100).
- `avgRestSec` – average rest duration in seconds (0–600).
- `setEfficiencyKgPerMin` – set efficiency metric (0–10).

Use these logs to monitor rest data coverage and the availability of efficiency metrics.
