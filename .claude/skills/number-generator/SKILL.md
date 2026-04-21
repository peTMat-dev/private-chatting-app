---
name: number-generator
description: 'Analyze draw history from draws.tsv and generate probable next draws using the chain model. Use when asked to generate numbers, analyze patterns, or extend the model.'
argument-hint: 'Starting number (P1) and path to draws TSV file'
---

# Number Generator

## Dataset

- File: `draws.tsv` — tab-separated, 7 columns per row: 6 main numbers + 1 bonus, all in range 1–49
- Numbers within each row are sorted ascending (P1 < P2 < P3 < P4 < P5 < P6)
- Always deduplicate rows before any analysis — exact duplicate draws are data noise

---

## The Chain Model — Primary Algorithm

This is the preferred method. It reads the historical data position by position and builds
draws using conditional frequency — what actually followed what, not abstract gap formulas.

### Core principle

Given P1=X, filter all historical draws to those starting with X. That is the working subset.
Then at each next position, filter further based on every pick already made, and ask:
"Given everything chosen so far, what value appears most at this next position?"

### Step-by-step process

**Step 1 — Build the P1 subset**
Filter draws.tsv to rows where col[0] == P1.
Count how many draws are in this subset. This is the base sample.

**Step 2 — OE target**
Count OE patterns across the P1 subset (3o+3e, 4o+2e, 2o+4e, etc.).

OE is a pre-filter: it determines which profiles are even eligible before chains are built.
Never assign a rare profile to a chain just to add variety.

- If one profile is >50% of the subset → all 3 chains use that profile
- If two profiles are within ~5% of each other (tied) → 2 chains use the dominant, 1 chain uses the second
- If no profile exceeds 40%, treat the top two as tied

The OE target is still a soft constraint within a chain — chain data takes priority.
Only nudge at Step 7 if the assembled set misses the target by more than 1.

**Step 3 — P2 candidates**
From the P1 subset, count frequency of each P2 value.
Take the top 3 most frequent P2 values. Each becomes a separate branch (Chain 1, Chain 2, Chain 3).
If values tie on frequency, all tied values are valid — pick 3 to maximize branch diversity.

**Step 4 — Chain forward through P3, P4, P5, P6**
For each branch:
- List ALL rows where P2 == chosen value (write them out explicitly)
- Count P3 frequencies across those rows → pick the most common
- List rows where P3 == chosen value
- Count P4 frequencies → pick the most common
- Continue to P5 and P6
- Write out all values at each position before picking — do not guess

**Step 5 — Thin data: step back to broader subset**
When the filtered set has fewer than 3 rows at a position:
- Step back to the broadest subset that still includes this P1+P2 combination
- List what values appear at this position across those broader rows
- Pick the mode from that broader set, not from just the 1–2 remaining rows
- Never use median — it ignores hot values and centers artificially
- If all values are unique (1x each), use the P1-subset mode for that position

**Step 6 — Tail anchoring (P5 and P6)**
After P3 is fixed, always check P5 and P6 distribution across ALL rows sharing P1+P2:
- List the P6 values from P1+P2 matching rows explicitly
- Identify the mode (most frequent P6) — this is the tail anchor
- Each branch should have a different P6 — use mode for chain 1, second most common for chain 2, third for chain 3
- P6 for P1 in range 1–9 is almost always 40–49, mode typically 43–48
- Never cap P6 at 40 or pick a low value just because it appeared once

**Step 7 — OE check and nudge**
After all 6 numbers are assembled:
- Count odds and evens, compare to target
- If off by 1: find a range-picked position and nudge ±1 for parity
- Never nudge P1
- Never create alternating o,e,o,e,o,e patterns — real draws cluster parities
- If the chain naturally produces a clustered pattern (o,o,o,e,e,e or o,o,e,o,o,e etc.) that is correct even if it does not match the target exactly — only force a nudge if the count is clearly wrong

**Step 8 — Dedup check**
Check if the 6-number sorted tuple exactly matches any row in draws.tsv.
If yes: nudge P6 ±1 (prefer +1). Check ±2 if needed.
Partial matches (2–5 shared numbers) are fine and expected.


they indicate the chain is anchored in real data, not a problem.

**Step 8 — Output**
For each of the 3 branches, output:
- The 6 numbers sorted ascending
- The OE pattern (e.g. 4o+2e) written as actual parity sequence (e.g. o,o,e,o,o,e)
- Which positions were exact picks vs range picks
- The branch label (Chain 1 / Chain 2 / Chain 3) with the P2 anchor shown

---

## OE Pattern Reference

Across the full 312-draw dataset:
- 3o+3e: ~33% (most common overall)
- 4o+2e: ~26%
- 2o+4e: ~22%
- 1o+5e: ~10%
- 5o+1e: ~7%

Per P1 subset the dominant pattern can differ. Always compute from the actual subset, not global.

Examples observed:
- P1=1 subset: 4o+2e most common
- P1=3 subset: 4o+2e most common
- P1=5 subset: 4o+2e and 3o+3e tied

When two patterns tie (within ~5%), generate two chains for the dominant and one for the second.
When one pattern clearly dominates (>50%), all three chains use that profile — do not assign a rare profile to a chain for variety.

---

## Span and Tail Profile

Span is P6 - P1. Across all draws: median span = 36, range 14–48.

P6 distribution per P1 (approximate from 312-draw dataset):
- P1=1: P6 typically 39–48, modal values 42–44
- P1=3: P6 typically 44–49, modal values 45–48
- P1=4: P6 typically 43–49
- P1=5: P6 typically 39–49, mode ~46
- P1=6–9: P6 typically 42–49
- Lower P1 values tend to produce higher P6 values (larger span)

Never cap P6 below 40 for any P1 in range 1–9. Always verify against actual tail data.

---

## Range Picking — Detailed Rules

When fewer than 3 rows remain at a position, do NOT pick the median. The median ignores
hot values and produces artificially centered numbers that do not reflect the real distribution.

**Picking hierarchy for thin data:**

1. **Mode from the broadest matching subset** — e.g. if P1+P2+P3 gives 1 row, step back to P1+P2 rows and find the most frequent value at this position across those rows. Use that mode.
2. **Second most common** — if the mode is already used elsewhere in the draw.
3. **Frequency from full P1 subset** — if P1+P2 is also too thin, check what values are most common at this position across all P1 rows.
4. **Position heuristic as absolute last resort** — only when zero frequency data exists at that position for this P1 at all:
   - P2, P3, P4: pick a value that fits the gap pattern (roughly +5 to +10 from previous)
   - P5: pick from the upper half of remaining range
   - P6: pick from the upper third of remaining range (never use median — P6 clusters high)

**Never use median at any position.** It gravitates to the center and systematically underestimates P6.

Parity (odd/even): once a value is selected via mode/frequency, check if it matches the remaining OE budget. If not, try the next most frequent value. Only nudge ±1 as a last resort.

Never pick a value already used in the draw. Never exceed 49.

---

## Gap/Span Model — Secondary Algorithm

This is the older model, kept for reference and comparison.

Options A/B/C each get the 1st/2nd/3rd most common OE pattern respectively.

| Option | Strategy |
|--------|---------|
| **A** — span-anchored | Gap medians from P1 subset, scaled so P6 hits median span |
| **B** — band spread | One number per band (1–10, 11–20, 21–30, 31–40, 41–49), ~7 gap each step |
| **C** — rising staircase | Fixed gaps [3, 5, 8, 12, 14] from P1 |

Limitation: this model does not respect actual sequential relationships in the data.
It produces plausible-looking draws but misses conditional structure.
The chain model is always preferred when the P1 subset has 10+ draws.

---

## Files

| File | Purpose |
|------|---------|
| `number_generator.py` | Python implementation — chain_generate() + gap/span model |
| `draws.tsv` | Tab-separated draw history, 7 cols (6 main + 1 bonus) |

Run: `python3 number_generator.py draws.tsv <starting_number>`

---

## Worked Example — P1=1 (from 312-draw dataset, 38 subset draws)

OE: 4o+2e and 3o+3e tied at 15x each (39% each) → Chain 1+2 use 4o+2e, Chain 3 uses 3o+3e
P2 top: 3(5x), 4(5x), 7(5x) — all tied, take all three

**Chain 1 — P2=3**
Rows with P1=1, P2=3:
  1,3,4,15,22,42 / 1,3,4,14,17,33 / 1,3,5,21,29,40 / 1,3,7,9,28,40 / 1,3,19,33,36,43
P3 values: 4,4,5,7,19 → mode = 4 (2x). Pick P3=4.
Rows with 1,3,4: 1,3,4,15,22,42 and 1,3,4,14,17,33
P4 values: 15,14. So far 1(o),3(o),4(e) — need 2 more odds.
P4=15(o) ✓. P5 from 2 rows: 22,17. Pick 22(e). P6 tail across all P2=3 rows: 40(2x),43,42,33 → mode=40(e) but need odd → use 43(o).
Result: [1,3,4,15,22,43] → o,o,e,o,e,o = 4o+2e ✓ (deduped from existing row ending 42)

**Chain 2 — P2=4**
Rows with P1=1, P2=4:
  1,4,5,14,33,34 / 1,4,10,15,17,19 / 1,4,16,26,38,42 / 1,4,19,26,27,31 / 1,4,21,23,24,26
P3 values: 5,10,16,19,21 — all unique (1x). Step back: whole P1=1 subset hot P3 odd values → 19(o) picked (also anchors to actual row).
Row 1,4,19,26,27,31: P4=26(e), P5=27(o), P6=31. Nudge P6 31→33(o) for dedup.
Result: [1,4,19,26,27,33] → o,e,o,e,o,o = 4o+2e ✓

**Chain 3 — P2=7**
Rows with P1=1, P2=7:
  1,7,10,16,38,43 / 1,7,12,17,21,30 / 1,7,17,28,32,44 / 1,7,18,25,28,36 / 1,7,32,35,36,39
P3 values: 10,12,17,18,32 — all unique. P2=7 subset hot P3: 17(o) (anchors to row 1,7,17,28,32,44).
P4=28(e), P5=32(e). P6 tail from P2=7 rows: 43,30,44,36,39 → mode=44(e). Nudge to 46(e) for dedup.
Result: [1,7,17,28,32,46] → o,o,o,e,e,e = 3o+3e ✓ (natural clustering, no alternating)

**Final output:**
  Chain 1 (P2=3): [1, 3, 4, 15, 22, 43]  o,o,e,o,e,o
  Chain 2 (P2=4): [1, 4, 19, 26, 27, 33]  o,e,o,e,o,o
  Chain 3 (P2=7): [1, 7, 17, 28, 32, 46]  o,o,o,e,e,e

---

## Worked Example — P1=1, 2-set variant (from 312-draw dataset, 42 subset draws)

Use this when only 2 sets are requested for P1=1.
OE: 4o+2e = 16× (38%), 3o+3e = 16× (38%) — tied → Set 1 targets 4o+2e, Set 2 targets 3o+3e.
Top P2: 2(5×), 3(5×), 4(5×), 7(5×) — all tied. Pick P2=3 and P2=7 for maximum diversity.

**Set 1 — P2=3 (target 4o+2e)**
Rows with P1=1, P2=3:
  1,3,4,14,17,33 / 1,3,4,15,22,42 / 1,3,5,21,29,40 / 1,3,7,9,28,40 / 1,3,19,33,36,43
P3: 4,4,5,7,19 → mode=4(e, 2×). Filter rows with 1,3,4: two rows.
P4: 14(e) or 15(o). So far: 1(o),3(o),4(e) — pick P4=14(e), anchors to row 1,3,4,14,17,33.
P5=17(o), P6=33(o). OE tally: o,o,e,e,o,o = 4o+2e ✓.
Dedup: [1,3,4,14,17,33] IS in dataset → nudge P6 33→43(o). [1,3,4,14,17,43] not in dataset ✓.
Result: [1, 3, 4, 14, 17, 43]  o,o,e,e,o,o = 4o+2e ✓

**Set 2 — P2=7 (target 3o+3e)**
Rows with P1=1, P2=7:
  1,7,10,16,38,43 / 1,7,12,17,21,30 / 1,7,17,28,32,44 / 1,7,18,25,28,36 / 1,7,32,35,36,39
P3: 10,12,17,18,32 — all unique. Step back to full P1=1 subset → P3=19 is hot (4×).
P1=1, P3=19 rows: 1,3,19,33,36,43 / 1,4,19,26,27,31 / 1,5,19,28,34,48 / 1,17,19,28,35,47
P4: 33,26,28,28 → mode=28(e, 2×). P3=19, P4=28 rows: 1,5,19,28,34,48 and 1,17,19,28,35,47.
P5: 34(e) or 35(o) — both 1×. Pick 34(e). P6=48(e).
OE: 1(o),7(o),19(o),28(e),34(e),48(e) = 3o+3e ✓. [1,7,19,28,34,48] not in dataset ✓.
Result: [1, 7, 19, 28, 34, 48]  o,o,o,e,e,e = 3o+3e ✓

---

## Worked Example — P1=3, 2-set variant (from 312-draw dataset, 28 subset draws)

Use this when only 2 sets are requested for P1=3.
OE: 4o+2e = 10× (36%), 3o+3e = 9× (32%) — within 5%, treat as tied → Set 1 targets 4o+2e, Set 2 targets 3o+3e.
Top P2: 4(4×), 10(4×) — tied. Use both.

**Set 1 — P2=4 (target 4o+2e)**
Rows with P1=3, P2=4:
  3,4,13,43,45,46 / 3,4,14,30,33,37 / 3,4,20,29,35,46 / 3,4,20,36,41,46
P3: 13,14,20,20 → mode=20(e, 2×). Filter rows with 3,4,20: two rows.
P4: 29(o) or 36(e). So far: 3(o),4(e),20(e) — pick P4=29(o). Anchors to row 3,4,20,29,35,46.
P5=35(o), P6=46(e). OE: o,e,e,o,o,e = 3o+3e — off.
Nudge P6 46→47(o). [3,4,20,29,35,47] not in dataset ✓.
Result: [3, 4, 20, 29, 35, 47]  o,e,e,o,o,o = 4o+2e ✓

**Set 2 — P2=10 (target 3o+3e)**
Rows with P1=3, P2=10:
  3,10,13,37,39,46 / 3,10,14,25,27,35 / 3,10,16,34,43,48 / 3,10,18,27,34,45
P3: 13,14,16,18 — all unique. Step back to full P1=3 subset → P3=13 is hot (4×).
P1=3, P3=13 rows include: 3,10,13,37,39,46. Use this row as anchor.
P4=37(o), P5=39(o), P6=46(e). OE: o,e,o,o,o,e = 4o+2e — off.
Nudge P5 39→38(e). Sorted: [3,10,13,37,38,46]. Not in dataset ✓.
Result: [3, 10, 13, 37, 38, 46]  o,e,o,o,e,e = 3o+3e ✓

---

## Key Functions in number_generator.py

| Function | Does |
|----------|------|
| `load_draws(path)` | Parse TSV, skip malformed rows, deduplicate, return list of 7-int lists |
| `analyse_oe(draws)` | Count OE patterns; returns Counter keyed by (odd_count, even_count) |
| `enforce_oe(draw, target_odd)` | Nudge one number ±1 to hit target; never touches P1 (index 0) |
| `chain_generate(start, unique)` | Chain model — 3 branches from top 3 P2 values |
| `generate_options(start, unique)` | Gap/span model — options A/B/C |
| `print_oe_report(oe_counts, total)` | OE frequency table |
| `print_gap_report(unique)` | Gap and span statistics |

---

## Common Mistakes to Avoid

**DO NOT alternate odd/even mechanically.**
o,e,o,e,o,e is an artificial pattern. Real draws cluster parities.
Correct examples: o,o,e,o,o,e or o,o,o,e,o,e or o,e,e,o,e,e

**DO NOT use the median at any position.**
Median ignores hot values and gravitates to the center. Use mode from the broadest
matching subset instead. Position heuristics (upper third for P6 etc.) only as last resort.

**DO NOT treat range picks as fixed.**
When data is thin, the range pick is directional. Acknowledge uncertainty in output.

**DO NOT skip the tail profile.**
After P3 is fixed, always look at the P5 and P6 distribution for that prefix
across all matching rows — even if only 1–2 rows exist. Their values anchor the tail.

**DO NOT generate all 3 branches from separate OE targets.**
All 3 branches share the same OE target (the top pattern for the P1 subset),
unless two patterns genuinely tie — in which case branch 1+2 use the two tied patterns
and branch 3 follows the chain naturally without OE override.

**DO NOT produce the same P6 in all 3 branches.**
Each branch takes a different P2, which leads to a different tail. Force diversity if needed
by using the 2nd-most-common P6 for branch 2 and 3rd-most for branch 3.

---

## Worked Example — P1=3 (from 312-draw dataset, 28 subset draws)

OE target: 4o+2e (most common in P1=3 subset, 36%)
P2 top 3: 10 (4x), 4 (4x), 12 (3x)

**Chain 1 — P2=10**
Rows with P1=3,P2=10: 4 draws. P3 values: 16,14,13,18 (all unique, thin → range 13–18, median 15)
Range pick P3, need odd → 15. Now 3,10,15 — 2 odds so far, need 2 more odds from P4/P5/P6.
P4 from remaining after P3=15: 1 row only → range. That row has P4=29(odd), P5=35(odd), P6=44(even)
But tail across all P1=3,P2=10: P5 range 27–43, P6 range 35–48. Mode P6=48.
Pick P4=29(odd), P5=35(odd from tail), P6=44(even) — pattern: o,e,o,o,o,e = 4o+2e ✓
Result: [3, 10, 15, 29, 35, 44]

**Chain 2 — P2=4**
Rows with P1=3,P2=4: 4 draws. P3 values: 20(2x),13,14. Most common: 20.
P4 from P1=3,P2=4,P3=20: 2 rows → range 29–36, median ~32. Need odd → 29.
Tail P5: range 35–41, P6: range 35–46, mode 46.
Pick P5=41(odd), P6=46(even) — pattern: o,e,e,o,o,e = 3o+3e, nudge one → swap P4=29→P4=31
Result: [3, 4, 20, 31, 41, 46] — 4o+2e ✓

**Chain 3 — P2=12**
Rows with P1=3,P2=12: 3 draws. P3 values: 34,20,13 (all unique, range 13–34, median 22)
Range pick P3, need odd → 13. Now 3,12,13 — 2 odds, need 2 more.
Tail from P1=3,P2=12: P5 range 43–45, P6 range 47–48, mode 48.
P4 range from 3 rows: 36–45, median ~42, need even → 36.
P5 from tail: 43(odd). P6 from tail mode: 48(even). Pattern: o,e,o,e,o,e — too alternating.
Adjust: P4=38(even), P5=43(odd), P6=48(even) — o,e,o,e,o,e still.
Use tail to cluster: P4=43(odd), P5=45(odd), P6=48(even) — o,e,o,o,o,e = 4o+2e ✓
Result: [3, 12, 13, 43, 45, 48]

---

## Disclaimer

Draw outcomes are statistically independent events. Past frequency does not predict future results.
This model is a pattern-analysis tool only.
