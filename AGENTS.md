# AGENTS.md — BullFit (fitness tracking application)

## Mission
Ship small, reversible changes with tests. Follow Lovable.dev prompt discipline:
- Ask: "Is this prompt clear, scoped, and testable?"
- Prefer incremental patches, never refactor broad areas in one go.
- Only edit files you are asked to.

## Repo Map (authoritative)

### Core Application Structure
```
src/
├── components/
│   ├── exercises/           # Exercise management components  
│   │   ├── AllExercisesPage.tsx      # Main exercises page (698 lines - NEEDS REFACTORING)
│   │   ├── ExerciseDialog.tsx        # Exercise CRUD dialog (370 lines - NEEDS REFACTORING)
│   │   ├── FilterPanel.tsx           # Recently extracted filter controls
│   │   ├── ExerciseListView.tsx      # Recently extracted exercise list
│   │   └── ExerciseSearchBar.tsx     # Recently extracted search
│   ├── workouts/
│   │   ├── ManualWorkoutLogger.tsx   # Manual workout entry (424 lines - NEEDS REFACTORING)
│   │   ├── WorkoutManagementHeader.tsx # Workout header (340 lines - NEEDS REFACTORING)
│   │   ├── WorkoutCard.tsx           # Workout display (347 lines - NEEDS REFACTORING)
│   │   └── useWorkoutSave.ts         # Save logic (306 lines - NEEDS REFACTORING)
│   ├── ui/                 # shadcn/ui components
│   │   ├── command.tsx              # CRITICAL: Has type issues causing MultiSelect flickering
│   │   └── multiselect.tsx          # Custom multi-select component
│   └── layout/
│       ├── MainLayout.tsx
│       ├── Header.tsx
│       └── Footer.tsx
├── services/
│   ├── metrics-v2/         # New metrics calculation system
│   │   ├── dto.ts, types.ts, flags.ts, registry.ts
│   │   ├── service.ts (v1 façade), index.ts (v2 façade)
│   │   ├── repository/     # interfaces + stubs
│   │   ├── calculators/    # Individual metric calculations
│   │   ├── aggregators.ts, chartAdapter.ts
│   │   ├── engine/
│   │   │   ├── calculators.ts
│   │   │   ├── seriesAdapter.ts
│   │   │   └── dayContextBuilder.ts  # CRITICAL: Has TZ bug (uses split('T')[0])
│   │   └── __tests__/      # Vitest test suite
│   └── supabase/          # Database integration
├── contexts/
│   ├── ExerciseFilterContext.tsx    # Recently created for state management
│   ├── LayoutContext.tsx
│   └── WeightUnitContext.tsx        # Well-implemented context example
├── hooks/
│   ├── useFilteredExercises.ts     # Recently extracted
│   ├── useExercises.ts
│   ├── useTrainingState.ts
│   └── useCustomTrainingTypes.ts
└── utils/
    └── date-fns integration for TZ handling
```

### Configuration Files
- `vitest.config.ts`, `vitest.setup.ts` - Testing configuration
- `package.json` - Dependencies and scripts
- `tailwind.config.js` - UI styling configuration
- `supabase/` - Database schema and migrations

## Environment & Commands

### Development Environment
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components with Tailwind CSS  
- **Database**: Supabase with Row Level Security
- **State Management**: React Context + custom hooks (transitioning to more structured approach)
- **Testing**: Vitest for unit tests
- **Build Tool**: Vite

### Available Scripts
```bash
npm ci                    # Install dependencies
npm run dev              # Start development server
npm run build            # Production build
npm run test             # Run tests (interactive)
npm run test:ci          # Run tests (CI mode) - CRITICAL: Must show output, no redirection
npm run lint             # ESLint checking
npm run typecheck        # TypeScript type checking
npm run check:db-types   # Supabase type generation
```

### Required Preflight Check (Before/After Every Change)
```bash
npm run typecheck && npm run lint && npm run test:ci
```
**CRITICAL**: Never redirect test output. Must show pass/fail status clearly.

### Known Issues & Warnings
- npm warning: `Unknown env config "http-proxy"` (non-blocking, can be ignored)

## Critical Technical Debt & Bugs

### Priority 1: Data Integrity Issues

#### TZ-Aware Day Bucketing (URGENT BUG)
- **Location**: `src/services/metrics-v2/engine/dayContextBuilder.ts`
- **Problem**: Uses `startedAt.split('T')[0]` which creates UTC day bugs
- **Impact**: Late evening workouts appear on wrong day for European users
- **Fix**: Use Europe/Warsaw timezone conversion before day extraction
- **Test**: 23:30 UTC should map to correct Warsaw day

#### Bodyweight Parameter Plumbing (URGENT BUG)
- **Location**: `src/services/metrics-v2/` calculators
- **Problem**: Hardcoded `bodyweightKg: 0` undercounts bodyweight exercise load
- **Impact**: Inaccurate volume calculations for bodyweight movements
- **Fix**: Thread actual bodyweight from user profile/config
- **Test**: Bodyweight exercises should contribute proper load when weight known

### Priority 2: Component Size Violations (Technical Debt)
All components must be under 200 lines per project standards:
- `AllExercisesPage.tsx`: 698 lines → Extract into focused components
- `ManualWorkoutLogger.tsx`: 424 lines → Extract logging workflow
- `WorkoutManagementHeader.tsx`: 340 lines → Extract header, filters, actions
- `ExerciseDialog.tsx`: 370 lines → Extract dialog content components
- `WorkoutCard.tsx`: 347 lines → Extract presentation vs logic
- `useWorkoutSave.ts`: 306 lines → Extract save service

### Priority 3: Performance Issues
- **MultiSelect Flickering**: Type handling in `command.tsx` causes UI flicker
- **N+1 Query Problem**: Individual exercise set fetching in workout views
- **Excessive Rerenders**: Missing memoization in contexts and large components
- **Double Data Pass**: `perWorkout` and `dayContextBuilder` both iterate over sets

## Architectural Standards

### Component Guidelines
- **Size Limit**: 200 lines maximum
- **Single Responsibility**: One concern per component
- **Memoization**: Use React.memo for pure components, useMemo/useCallback for expensive operations
- **Context Pattern**: Follow `WeightUnitContext.tsx` as best practice example

### State Management Patterns
- **Context API**: For feature-level state (follow ExerciseFilterContext pattern)
- **Custom Hooks**: For reusable logic extraction
- **Local State**: Only for component-specific UI state
- **Server State**: Use Supabase real-time subscriptions efficiently

### TypeScript Standards
- **No `any` type** unless absolutely necessary
- **Explicit interfaces** for all props and data structures
- **Type guards** instead of type assertions
- **Prevent circular dependencies** between type files

### Service Layer Architecture (Target State)
```
src/services/
├── workout/
│   ├── WorkoutDataService.ts      # Centralized data fetching
│   ├── WorkoutCalculationService.ts # Unified calculation methods
│   ├── WorkoutValidationService.ts # Business rule validation
│   └── WorkoutSaveService.ts      # Persistence operations
├── overview/
│   ├── OverviewAggregationService.ts # Dashboard data compilation  
│   └── OverviewMetricsService.ts    # KPI calculations
└── shared/
    ├── DateRangeService.ts        # Consistent date handling
    └── PersonalRecordsService.ts  # PR detection and management
```

## Guardrails

### Development Rules
- **No new dependencies** without explicit approval
- **Patches < 200 lines** unless specifically justified
- **No breaking changes** to metrics v2 without v1 compatibility
- **TZ handling**: Always use Europe/Warsaw as default for day bucketing
- **Database changes**: No RLS/security or schema changes in this repo
- **Metrics compatibility**: v2 must not break v1 surfaces

### Testing Requirements
- **All changes must have tests** (unit tests minimum)
- **Test output must be visible** (no redirection)
- **TZ test required** for any time-related logic changes
- **Regression testing** for metrics calculations
- **Type safety validation** (npm run typecheck must pass)

## Feature Flags (read-only)
- `KPI_ANALYTICS_ENABLED`
- `ANALYTICS_DERIVED_KPIS_ENABLED`
- Others may exist in `src/constants/featureFlags.ts`

## Task Template (use for every change)

```
**Context**: (why we're changing - link to specific technical debt/bug)
**Task**: (single, clear deliverable - no compound tasks)
**Edit Allowlist**:
✅ [specific file paths that can be modified]
❌ [everything else - no modifications allowed]
**Requirements**:
- Inputs/outputs with explicit TypeScript types
- Specific test cases to add/adjust
- Integration points with existing code
**Constraints**:
- No new deps unless approved
- Maintain API stability (especially metrics v1/v2 compatibility)
- Patch size < 200 lines unless justified
- Europe/Warsaw TZ handling for any date logic
**Acceptance Criteria**:
- `npm run typecheck && npm run lint && npm run test:ci` passes
- Specific functional requirements met
- No regressions in existing tests
- Test output visible (no redirection)
**Critical Fixes Applied** (if applicable):
- TZ-aware day bucketing implemented
- Bodyweight parameter properly threaded
- Component size under 200 lines
```

## Known Pitfalls & Anti-Patterns

### Time Handling Pitfalls
- ❌ Using `split('T')[0]` → UTC day bugs
- ❌ Direct Date() manipulation without timezone
- ✅ Use date-fns-tz or Intl.DateTimeFormat with Europe/Warsaw

### Component Development Pitfalls
- ❌ Components > 200 lines with mixed responsibilities
- ❌ Missing memoization causing excessive rerenders
- ❌ Direct prop drilling instead of context
- ✅ Single responsibility, memoized components with context

### State Management Pitfalls
- ❌ Query keys with `new Date()` in render → infinite loading
- ❌ Context values not memoized → performance issues
- ❌ Multiple sources of truth → data inconsistency
- ✅ Stable query keys, memoized contexts, single source of truth

### Testing Pitfalls
- ❌ Redirected test output masking failures
- ❌ Missing TZ boundary tests
- ❌ Mock-heavy tests that don't catch real issues
- ✅ Visible test output, TZ edge cases, integration testing

### Component Development Pitfalls
- ❌ Components > 200 lines with mixed responsibilities
- ❌ Missing memoization causing excessive rerenders
- ❌ Direct prop drilling instead of context
- ✅ Single responsibility, memoized components with context

### State Management Pitfalls
- ❌ Query keys with `new Date()` in render → infinite loading
- ❌ Context values not memoized → performance issues
- ❌ Multiple sources of truth → data inconsistency
- ✅ Stable query keys, memoized contexts, single source of truth

### Testing Pitfalls
- ❌ Redirected test output masking failures
- ❌ Missing TZ boundary tests
- ❌ Mock-heavy tests that don't catch real issues
- ✅ Visible test output, TZ edge cases, integration testing

## Definition of Done (DoD)
- [ ] Preflight check passes: `npm run typecheck && npm run lint && npm run test:ci`
- [ ] Patch is minimal and focused (< 200 lines unless justified)
- [ ] All specified tests are green with visible output
- [ ] No regressions in existing functionality
- [ ] Code comments on non-obvious logic (especially time/TZ handling)
- [ ] If touching time logic, TZ test included
- [ ] If component work, size is under 200 lines
- [ ] Edit allowlist was respected (only specified files changed)

## Data Consistency Issues (Context for Future Fixes)

### Overview vs Analytics Discrepancy
- **Problem**: Performance Summary shows "0kg volume", "No PRs yet" while detailed analytics display real data
- **Root Cause**: Multiple independent data sources with different calculation methods
- **Impact**: User confusion and loss of trust in data accuracy
- **Solution Path**: Unify data sources through service layer architecture

### Calculation Method Conflicts
- **Overview Page**: Simple `weight × reps` volume calculation
- **Analytics Page**: Sophisticated `workoutMetricsProcessor` with bodyweight/isometric handling
- **Goal**: Single source of truth for all fitness calculations

This AGENTS.md provides the complete operational context for AI agents working on BullFit codebase while maintaining focus on incremental, testable improvements.
