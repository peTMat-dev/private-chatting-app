---
name: number-generator
description: 'Analyze lottery or random number draw history from tab-separated files and predict probable next numbers using frequency analysis. Use when asked to analyze number draws, find hot/cold numbers, suggest next lottery picks, or work with historical random number data.'
argument-hint: 'Path to tab-separated draw history file, or paste raw data'
---

# Number Generator — Lottery Frequency Analyzer

## What This Skill Does

Reads historical lottery/random number draw data from a tab-separated file and generates probable next draws using **gap + span + range-band analysis** — the correct structural approach.

**Why not global frequency?** Counting which numbers appear most often ignores the structure of a draw. The real signal is in *how numbers relate to each other* within a draw.

**Why not exact row matching?** Repeated rows in the dataset are data noise. The probability that all 6 exact numbers repeat is near zero.

**Correct approach — Gap/Span/Band model:**
1. Deduplicate rows first (remove exact repeats — they are noise)
2. Analyze the **span** (P6 − P1): what range does a typical draw cover?
3. Analyze the **gap** at each step (P2−P1, P3−P2, ...): median and mean per position
4. Analyze the **range band** most likely at each position (1–5, 6–10, ... 46–49)
5. For a given starting number, filter the dataset to that P1 subset and compute its own gap/span profile
6. Generate 3 options using different gap strategies: median profile, band-spread, rising staircase

## Data Format

**Input file structure** (tab-separated, one draw per line):

```
<n1>  <n2>  <n3>  <n4>  <n5>  <n6>  <bonus>
```

- Columns 1–6: main draw numbers
- Column 7: bonus/powerball number
- Range observed: 1–49 (main), 1–49 (bonus)
- Each row = one historical draw

## Analysis Procedure

1. Parse all rows — skip malformed lines (not exactly 7 columns)
2. **Deduplicate** — remove exact duplicate rows (noise, not signal)
3. Compute **span stats** (P6−P1) across all unique rows: median, mean, distribution
4. Compute **gap stats** per position across all unique rows: median, mean, stdev, top values
5. Compute **range band frequency** per position (bands: 1–5, 6–10, 11–15, ... 46–49)
6. Filter to **P1 subset** (rows starting with the requested first number)
7. Compute the P1 subset's own gap medians per position and span stats
8. Generate 3 options:
   - **Option A** — median gap profile of P1 subset
   - **Option B** — one number per range band, ~7 gap each step
   - **Option C** — rising staircase (small early gaps, larger later gaps)
9. For each option, report gaps and span; flag if span is atypical
10. Bonus: most common bonus number in the P1 subset

## Reference Script

```python
from collections import Counter
import statistics

with open('draws.tsv') as f:
    rows = [list(map(int, line.split())) for line in f if len(line.split()) == 7]

# Deduplicate
unique = list({tuple(r): r for r in rows}.values())
print(f"Total: {len(rows)} | Unique: {len(unique)}")

# Global span + gap profile
spans = [r[5]-r[0] for r in unique]
print(f"Span: median={statistics.median(spans):.0f} mean={statistics.mean(spans):.1f}")

for i in range(5):
    g = [r[i+1]-r[i] for r in unique]
    print(f"P{i+1}→P{i+2}: median={statistics.median(g):.1f} mean={statistics.mean(g):.1f} top={Counter(g).most_common(3)}")

def generate_options(start, unique):
    sub = [r for r in unique if r[0] == start]
    print(f"\nP1={start}: {len(sub)} unique draws")

    # Gap medians for this subset
    gap_meds = [round(statistics.median([r[i+1]-r[i] for r in sub])) for i in range(5)]

    # Option A: median gaps
    opt_a = [start]
    for g in gap_meds: opt_a.append(min(opt_a[-1]+g, 49))

    # Option B: band spread ~7 gap each
    bands = [(4,8),(12,18),(22,27),(31,36),(42,47)]
    opt_b = [start]
    for lo,hi in bands:
        prev = opt_b[-1]
        best = min(range(max(lo,prev+1),hi+1), key=lambda n: abs((n-prev)-7))
        opt_b.append(best)

    # Option C: rising staircase
    opt_c = [start]
    for g in [3,5,8,12,14]: opt_c.append(min(opt_c[-1]+g, 49))

    bc = Counter(r[6] for r in sub)
    bonuses = [b for b,_ in bc.most_common(3)]

    for label, opt in [("A median-gap", opt_a), ("B band-spread", opt_b), ("C rising-staircase", opt_c)]:
        gaps = [opt[i+1]-opt[i] for i in range(5)]
        print(f"  {label}: {opt}  gaps={gaps}  span={opt[-1]-opt[0]}")
    print(f"  Top bonuses: {bonuses}")

generate_options(1, unique)
generate_options(3, unique)
```

## Session Knowledge (April 2026)

### Dataset
- **250 rows**, **225 unique draws** (25 exact duplicates removed as noise)
- 7 columns: cols 1–6 = main numbers (sorted ascending), col 7 = bonus
- Range: 1–49

### Global Structural Facts

| Metric | Value |
|--------|-------|
| Typical draw span (P6−P1) | median **37**, mean **35.9** |
| Most probable P1 band | **1–5** (93% of draws) |
| Most probable P6 band | **41–49** (73% of draws) |
| Average gap between consecutive numbers | **~7** at every position |
| Gap stdev | ~5–6 (high variance — gaps are not fixed) |

**Range band most likely per position:**

| Position | Band | Notes |
|----------|------|-------|
| P1 | 1–5 | 93% of all draws |
| P2 | 6–10 | |
| P3 | 16–20 | |
| P4 | 31–35 | |
| P5 | 36–40 | |
| P6 | 46–49 | 73% of all draws |

### P1=1 Subset (31 unique draws)

Gap medians: `4, 6, 9, 6, 8`
Span: median **44**, mean **41.3** ← draws starting with 1 tend to reach high (41–49)

| Option | Draw | Gaps | Span | Bonus |
|--------|------|------|------|-------|
| A median-gap | `1 — 5 — 11 — 20 — 26 — 34` | 4,6,9,6,8 | 33 ⚠️ below typical |  13 |
| B band-spread | `1 — 8 — 15 — 22 — 31 — 42` | 7,7,7,9,11 | 41 | 33 |
| C rising-staircase | `1 — 4 — 9 — 17 — 29 — 43` | 3,5,8,12,14 | 42 | 38 |

**B and C are most credible for P1=1** (span 41–42 matches the subset median of 44).

### P1=3 Subset (19 unique draws)

Gap medians: `8, 7, 5, 6, 9`
Span: median **40**, mean **40.3**

| Option | Draw | Gaps | Span | Bonus |
|--------|------|------|------|-------|
| A median-gap | `3 — 11 — 18 — 23 — 29 — 38` | 8,7,5,6,9 | 35 | 21 |
| B band-spread | `3 — 10 — 17 — 26 — 36 — 44` | 7,7,9,10,8 | 41 | 16 |
| C rising-staircase | `3 — 5 — 9 — 18 — 29 — 41` | 2,4,9,11,12 | 38 | 19 |

### Global Frequency (naive — less useful)
Top main numbers: 38(44x), 36(41x), 7(41x), 29(37x), 20(37x)
Top bonus numbers: 4(11x), 3(10x), 21(9x), 13(9x)
Coldest main: 45, 14, 27, 37, 17

## Disclaimer

Lottery draws are statistically independent. Past frequency has no predictive power over future draws. This is a statistical pattern summary only.

## Future Work (TODO)
- Compute per-P1 span profiles for all starting numbers (1–15)
- Weight recent draws more heavily (recency bias option)
- Transition matrix: `P(gap at pos i+1 | gap at pos i)` — do gaps correlate?
- Auto-flag options whose span is outside ±1 stdev of the P1-subset median
- Accept file path as slash command argument
- Export options to CSV
