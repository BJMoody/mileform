# Workout + Source Data Policy

## Goal

Build a large training database without turning Mileform into an unsourced copy of paid plans, screenshots or internet mythology.

## Data classes

### 1. Canonical workout patterns

General structures such as threshold 1Ks, progression runs, hills, 800-rhythm 300s, long runs and race primers.

Store:

- purpose
- intensity domain
- event suitability
- phase suitability
- rep/recovery parameter ranges
- experience constraints
- evidence grade

### 2. College / program sessions

A named college or program workout must have a public source.

Store:

- program name
- coach when public
- source URL
- source publication date
- workout date when known
- event group
- season phase
- factual workout structure
- Mileform-written notes

Do not bulk-copy copyrighted explanatory text.

### 3. Pro / Elite Build timelines

A named athlete mode — for example a future mile-build timeline — must distinguish what is actually known from what is inferred.

Every reported session should be traceable to a public interview, article, training video, athlete/coach post, podcast, training log or other lawful public source.

The product must visibly label:

- **reported session**
- **inferred phase**
- **unknown / not reported**

Never invent sessions to fill timeline gaps.

## Source reliability tiers

1. athlete / coach direct statement or training log
2. reputable publication with direct quotes or session details
3. official team / program source
4. secondary reporting
5. anecdotal or community report — display only with an explicit low-confidence label

## Normalization

Different wording can map to one canonical pattern while preserving the sourced factual structure. For example:

- `6 x kilo at threshold`
- `6 × 1000 @ LT`
- `6x1k tempo`

can all map to one threshold-1K template.

## Database target

The 1,000+ goal should refer to useful, source-backed records and generated variants — not 1,000 manually duplicated workouts with tiny wording changes.
