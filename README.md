# Mileform

**Build the race before you run it.**

Mileform is a deterministic training-planning and workout-analysis prototype for competitive runners. It is intentionally **not** an AI coach: plans are generated from explicit rules, athlete inputs, a versioned workout library, race dates, and evidence-backed constraints.

The current prototype is a dependency-free static web app designed to live at `/app/` and deploy cleanly on Cloudflare Pages or Workers Static Assets.

## What is working in v0.1

- Dark, mobile-first performance dashboard inspired by modern endurance apps without cloning another product's UI.
- Current PR + goal PR + goal date setup.
- Athlete-specific speed-duration curve from multiple PRs.
- Critical-speed estimate when the PR set supports it.
- Base → build → race-specific → peak → taper season phasing.
- Deterministic weekly mileage progression with youth guardrails.
- Optional **Double Threshold · Advanced** training style for eligible adults; it is disabled under 18, race-free only, phase-limited, and does not raise the weekly mileage target.
- Event-specific workout selection for 800m through 10K.
- Canonical workout library with scalable parameterized variants.
- Missed-workout restructuring that does **not** create make-up debt or stack hard sessions.
- Race-week primer logic.
- GPX parser and dependency-free FIT decoder for common activity record fields.
- Local workout-file analysis and planned-session matching.
- Plan audit: checks weekly volume, hard-day count, long-run share, recovery days, and race proximity.
- Science registry with evidence labels and source URLs.
- All prototype data stays in browser localStorage; uploaded files are parsed locally.

## Run locally

```bash
npm run dev
```

Open `http://localhost:4173/app/`.

No npm install is required for this prototype.

## Deploy on Cloudflare

### Workers Static Assets — recommended

The repo is configured for `wrangler deploy` with `assets.not_found_handling = "single-page-application"`. That setting handles direct requests such as `/app/plan` without a catch-all `_redirects` rewrite.

Use:

```bash
npm run build
npx wrangler deploy
```

The build output directory is `dist`.

### Pages

If you deploy with Cloudflare Pages instead, use build command `npm run build` and output directory `dist`. The app's root `index.html` sends `/` to `/app/`, while client-side routes are designed to use SPA fallback behavior. Do not add `/app/* /app/index.html 200` to `_redirects`; that rule also matches `/app/index.html` and Cloudflare rejects it as a redirect/rewrite loop.

For the production platform, add Worker API routes, D1 and R2 rather than storing athlete history only in localStorage. See `docs/ARCHITECTURE.md` and `db/schema.sql`.

## Why the workout library is not literally 1,000 copied sessions yet

A good database should not be a pile of near-duplicates or unsourced screenshots. Mileform separates:

1. **Canonical workout patterns** — threshold 1Ks, 800-rhythm 300s, hill reps, long runs, primers, etc.
2. **Generated variants** — rep count, target pace, recovery, total quality volume, phase and event constraints.
3. **Named public-source workouts** — college/pro sessions with source URL, date, athlete/program, phase, and attribution.

That lets the platform scale beyond 1,000 entries while preserving source quality. Named athlete timelines should never be fabricated.

## Safety / coaching boundaries

The engine is a training framework, not medical advice or an injury predictor. Youth defaults are deliberately conservative: no automatic make-up doubles, no hard-day stacking, and at least one rest/very-low-load day. Double-threshold mode is disabled for athletes under 18 in the prototype. For adults, the advanced mode is still gated by training history, volume, phase, and race proximity, and it splits existing weekly load rather than automatically adding more. A school/club coach with direct athlete context should override the app.

## Provisional name

**Mileform** is the working name used in this prototype. It has not gone through a full trademark/domain clearance process.

## Repository structure

```text
/app
  index.html
  styles.css
  app.js        # UI + routes
  engine.js     # deterministic planning rules
  fit.js        # GPX/FIT parsing + activity summary
  data.js       # workout/evidence seed data
/db
  schema.sql    # production D1 schema
/docs
  ARCHITECTURE.md
  TRAINING_ENGINE.md
  DATA_SOURCE_POLICY.md
  ROADMAP.md
  CLOUDFLARE.md
```

No open-source license is granted by this repository unless you add one later.
