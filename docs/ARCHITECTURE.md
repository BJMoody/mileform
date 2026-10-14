# Production Architecture

Mileform is designed to stay deterministic at runtime: plans come from explicit athlete state, versioned rules, workout metadata, race dates and evidence-backed constraints rather than a generative model.

## Core inputs

- athlete age and training history
- current PRs with event, time and date
- recent weekly mileage and planned ceiling
- goal event, goal time and goal date
- A/B/C race calendar
- training style (`standard` or guarded `double-threshold`)
- completed activities and uploaded GPX/FIT files
- later: RPE, soreness, sleep, heat, terrain and travel

## Core engine modules

1. **PerformanceModel** — fits the athlete speed-duration curve and critical-speed model when valid.
2. **ZoneModel** — translates current fitness into recovery, easy, steady, threshold, CV, VO₂ and event-specific pace bands.
3. **SeasonModel** — assigns Base → Build → Specific → Peak → Taper and sets the weekly mileage arc.
4. **WorkoutSelector** — filters canonical workouts by phase, event, experience, hard-day budget and training style.
5. **Scheduler** — places quality, long runs, races, primers and optional AM/PM split threshold sessions.
6. **Rescheduler** — restructures a week after missed sessions without creating make-up debt.
7. **ActivityMatcher** — compares uploaded activities with planned sessions and returns transparent execution metrics.
8. **PlanAuditor** — checks an outside training plan for volume, hard-day density, long-run share and race proximity.

## Cloudflare target

### Static app

The prototype lives under `/app/` and builds to `dist/` for Cloudflare Pages or Workers Static Assets.

### Worker API

Suggested future endpoints:

- `POST /api/profile`
- `POST /api/prs`
- `POST /api/goals`
- `POST /api/races`
- `POST /api/plans/generate`
- `POST /api/plans/:id/restructure`
- `POST /api/activities/init-upload`
- `POST /api/activities/:id/analyze`
- `GET /api/workouts`
- `GET /api/elite-builds/:slug`
- `POST /api/plan-audit`

### D1

Use D1 for profiles, PRs, goals, races, plan history, workout metadata, source records, rules and activity-analysis summaries. See `db/schema.sql`.

### R2

Use R2 for raw GPX/FIT files. Store parsed summaries in D1 and keep raw files under keys such as:

`activity/{user_id}/{yyyy}/{mm}/{activity_id}.{fit|gpx}`

### Queues

When activity ingestion gets large, use Cloudflare Queues to decouple upload from parsing and analysis.

## Reproducibility

Every generated plan should eventually record:

- `engine_version`
- `ruleset_version`
- `workout_library_version`
- `science_registry_version`
- an input snapshot/hash

That makes plan decisions explainable and reproducible as the product evolves.
