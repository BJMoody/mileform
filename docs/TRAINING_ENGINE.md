# Training Engine Notes

## Performance model

The prototype fits an athlete-specific power curve:

`time = exp(intercept) * distance^exponent`

With only one PR it falls back to a Riegel-style exponent of 1.06. With multiple PRs it estimates the exponent from the athlete's marks and bounds the result to avoid pathological fits.

The model is used for training calibration and equivalent-performance estimates, not as a guarantee that an athlete can immediately race the predicted time.

## Critical speed

When enough suitable performances are available, Mileform also estimates:

`distance = CS * time + D'`

Critical speed is used as another anchor for steady/threshold work only when the output passes sanity checks.

## Training zones

Current prototype zones:

- Recovery
- Easy
- Steady
- Threshold
- Critical velocity
- VO₂-oriented pace
- 5K rhythm
- 3K rhythm
- Mile rhythm
- 800 rhythm
- Repetition / speed

The UI should present pace ranges rather than pretending the boundaries are biologically exact.

## Season phases

Default structure before the goal race:

- Base: more than ~16 weeks out
- Build: ~8–16 weeks out
- Race Specific: ~3.5–8 weeks out
- Peak: ~1.5–3.5 weeks out
- Taper: final ~10 days

Future versions should make these windows event-specific and configurable.

## Load progression

Prototype guardrails are intentionally conservative. Youth athletes use a lower week-to-week build cap, periodic reduction weeks are inserted, and taper volume drops while small doses of intensity remain.

## Hard-day budget

Most distance weeks are built around two demanding running days. A race counts toward that budget.

The engine should not automatically stack:

- threshold + VO₂ on consecutive days
- race-specific work within 48 hours of an A race
- missed quality + scheduled quality as a make-up double

## Missed sessions

Priority logic:

1. Missed easy/recovery work is dropped.
2. Missed long runs are usually dropped rather than pushed into the next day.
3. Missed quality close to an important race is dropped.
4. Otherwise, a key session may move once only if recovery spacing remains safe.
5. Weekly volume is not increased just because something was missed.

## Race primer

Primers are deliberately low-volume: strides and a few short reps near race rhythm with full enough recovery to preserve mechanics. Their purpose is readiness, not new fitness.

## Double-threshold mode

`double-threshold` is an optional advanced training style, not the default.

Current activation requirements:

- age 18+
- at least four years of consistent run training
- recent mileage of at least 45 mi/week
- planned ceiling of at least 50 mi/week
- Build or Race Specific phase
- no race in the current week
- weekly target still high enough for the split structure

When active, one quality day is split into AM and PM controlled threshold sessions and another event-specific quality day remains later in the week. The mode does **not** raise the weekly mileage target. If either half is missed, that work is dropped rather than made up.

The evidence registry treats this as an emerging / elite-practice model. It should never be marketed as universally superior training.

## Activity matching

Uploaded GPX/FIT files can be compared against the planned session using:

- completion / volume
- pace-zone compliance
- interval structure
- pace steadiness
- stopped-time share

The result is an **execution score**, not a physiological readiness or injury-risk score.
