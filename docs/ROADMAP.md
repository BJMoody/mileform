# Roadmap

## Phase 0 — prototype

- dark responsive UI
- current PR + goal PR setup
- deterministic full-season generation
- Base → Build → Specific → Peak → Taper
- guarded double-threshold mode
- workout library
- missed-workout restructuring
- race-primer logic
- local GPX/FIT parsing
- workout execution scoring
- science registry
- D1 schema

## Phase 1 — private beta

- Cloudflare Worker API
- D1 athlete and plan persistence
- R2 activity-file storage
- authentication
- editable race calendar
- plan-regeneration history and diffs
- better FIT lap/session decoding
- interval segmentation using device laps before pace heuristics
- structured coach-plan import, starting with CSV
- engine invariant tests

## Phase 2 — data moat

- 1,000+ source-backed college/pro workout records
- college program pages
- verified Elite Build timelines
- filters by event, phase, level, purpose and source quality
- source verification/admin workflow
- versioned science/rules registry

## Phase 3 — coach interoperability

- coach accounts
- athlete groups
- coach overrides / locked sessions
- school and team schedule import
- compare Mileform framework against a coach plan instead of blindly replacing it
- structured workout export where technically and legally supported

## Phase 4 — more deterministic signals

Still rule-based:

- RPE
- soreness
- sleep quality
- heat / humidity adjustments
- terrain and elevation
- travel / school constraints
- actual vs planned load trend

## Phase 5 — sprint expansion

Do not reuse distance logic blindly. Build a separate sprint ruleset for:

- acceleration
- max velocity
- speed endurance
- extensive / intensive tempo
- lifting and plyometrics
- CNS recovery windows
- technical quality caps

The scheduling/data platform can be shared, but the training logic should be separate.
