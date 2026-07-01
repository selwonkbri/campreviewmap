# Sentiment rebalance + gradient markers

## 1. Why Gulf Air currently shows "negative"

In `src/lib/parks.ts`, `sentimentScore()` averages review values (positive=+1, mixed=0, negative=-1) and labels anything below **-0.33** as negative. Gulf Air = (0 + 0 + -1)/3 = **-0.333**, which just barely crosses the line. The math is working — the thresholds are simply too eager to call something negative, especially with only a handful of reviews.

## 2. New labeling rules (bias toward "mixed")

Update `sentimentScore()` in `src/lib/parks.ts`:

- Widen the neutral band so only clearly one-sided parks get a label:
  - `positive` when score **≥ +0.6**
  - `negative` when score **≤ -0.6**
  - otherwise → `mixed`
- Require a minimum sample size before labeling positive/negative. Fewer than **4 reviews** → always `mixed` (unless every single review agrees, in which case allow the label).
- Also require that at least ~60% of reviews share the extreme sentiment — prevents one loud negative from dragging a small sample across the line.

Result for Gulf Air (2 mixed, 1 negative): score -0.33, only 3 reviews, no super-majority → **mixed**. Parks flip to negative/positive only when the community is overwhelmingly one-sided.

Keep `unknown` behavior unchanged (0 reviews).

## 3. Gradient dots on the map

Right now `IntelligenceMap.tsx` picks one of four solid colors from the label. Switch to a continuous color derived from the raw `score` (-1…+1), independent of the label bucket:

- Define three anchor colors in `src/styles.css` as CSS vars (reusing existing sentiment tokens):
  - negative red at score -1
  - mixed amber at score 0
  - positive green at score +1
- Add a small `scoreToColor(score)` helper in `src/lib/parks.ts` that linearly interpolates between red↔amber for negative scores and amber↔green for positive scores (HSL mix for smooth blending).
- In `IntelligenceMap.tsx`, use `scoreToColor(sent.score)` for each marker's background instead of the class-based color. A park at -0.2 will look dusty-amber, at -0.7 clearly red, at +0.9 vivid green — matching the "blend" intuition.
- Parks with 0 reviews keep the existing neutral gray (unknown) so they visually read as "no data" rather than "meh".
- Optional polish: give the marker a subtle radial gradient (dark center → sentiment color edge) so the color reads well at small zoom sizes; single line change in the marker CSS.

The badge/legend text in `ParkDetailPanel.tsx` still uses the bucketed label (positive/mixed/negative) so wording stays clean, but the dot color reflects the underlying score.

## 4. Files touched

- `src/lib/parks.ts` — new thresholds + min-sample rule in `sentimentScore()`; add `scoreToColor()` helper.
- `src/components/IntelligenceMap.tsx` — use `scoreToColor(score)` for marker fill.
- `src/styles.css` — expose sentiment anchor colors as CSS vars (if not already), tweak marker gradient.

## 5. Out of scope

- No DB changes.
- No changes to filters, list view, or the review feed.
- Individual review sentiment values are not re-classified — only the park-level aggregate.

## Open question

Are the proposed thresholds right for you (≥ +0.6 positive, ≤ -0.6 negative, min 4 reviews)? I can dial them tighter/looser — e.g. require 5+ reviews, or push positive to +0.7 so it's even harder to earn.
