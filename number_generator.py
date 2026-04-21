"""
Lottery draw generator — gap/span + odd/even balance filter.
Usage: python3 lottery_generator.py <draws_file.tsv> <starting_number>
       python3 lottery_generator.py draws.tsv 7
"""
from collections import Counter
import statistics
import sys


def load_draws(path):
    with open(path) as f:
        rows = [list(map(int, line.split())) for line in f if len(line.split()) == 7]
    unique = list({tuple(r): r for r in rows}.values())
    return unique


def oe_label(draw):
    o = sum(1 for n in draw if n % 2 == 1)
    return f"{o}o+{6-o}e"


def enforce_oe(draw, target_odd):
    """Nudge draw by ±1 on one number (never P1) to hit target_odd count."""
    draw = sorted(draw)
    current_odd = sum(1 for n in draw if n % 2 == 1)
    if current_odd == target_odd:
        return draw

    p1 = draw[0]  # lock — never touch the starting number
    need_more_odd = current_odd < target_odd  # need to flip an even→odd

    for i, n in enumerate(draw):
        if n == p1:
            continue  # skip P1
        if need_more_odd and n % 2 == 0:
            for delta in [1, -1]:
                candidate = n + delta
                if 1 <= candidate <= 49 and candidate not in draw:
                    new_draw = sorted(draw[:i] + [candidate] + draw[i + 1:])
                    if len(set(new_draw)) == 6:
                        result = enforce_oe(new_draw, target_odd)
                        if result:
                            return result
        elif not need_more_odd and n % 2 == 1:
            for delta in [1, -1]:
                candidate = n + delta
                if 1 <= candidate <= 49 and candidate not in draw:
                    new_draw = sorted(draw[:i] + [candidate] + draw[i + 1:])
                    if len(set(new_draw)) == 6:
                        result = enforce_oe(new_draw, target_odd)
                        if result:
                            return result
    return draw  # fallback: no safe nudge found


def analyse_oe(unique):
    oe_counts = Counter()
    for r in unique:
        m = r[:6]
        o = sum(1 for n in m if n % 2 == 1)
        oe_counts[(o, 6 - o)] += 1
    return oe_counts


def print_oe_report(oe_counts, total):
    print("=" * 50)
    print("ODD / EVEN PATTERN ANALYSIS (main 6 numbers)")
    print("=" * 50)
    print(f"\n{'Pattern':<18} {'Count':>6} {'%':>7}")
    print("-" * 34)
    for (o, e), cnt in sorted(oe_counts.items(), key=lambda x: -x[1]):
        bar = '█' * int(cnt / total * 30)
        print(f"{o} odd + {e} even    {cnt:>6}   {cnt / total * 100:>5.1f}%  {bar}")
    best = oe_counts.most_common(1)[0]
    print(f"\n>>> MOST COMMON: {best[0][0]} odd + {best[0][1]} even  "
          f"({best[1]} draws, {best[1] / total * 100:.1f}%)")
    top2 = oe_counts.most_common(2)
    combined = sum(c for _, c in top2)
    print(f">>> TOP 2 COMBINED: {combined} draws ({combined / total * 100:.1f}%)\n")


def print_gap_report(unique):
    spans = [r[5] - r[0] for r in unique]
    print("=" * 50)
    print("GLOBAL GAP / SPAN PROFILE")
    print("=" * 50)
    print(f"\nSpan (P6-P1): median={statistics.median(spans):.0f}  "
          f"mean={statistics.mean(spans):.1f}  min={min(spans)}  max={max(spans)}")
    for i in range(5):
        g = [r[i + 1] - r[i] for r in unique]
        print(f"P{i + 1}→P{i + 2}: median={statistics.median(g):.1f}  "
              f"mean={statistics.mean(g):.1f}  top3={Counter(g).most_common(3)}")


def generate_options(start, unique):
    sub = [r for r in unique if r[0] == start]
    if len(sub) < 3:
        print(f"P1={start}: only {len(sub)} historical draws — using global gap medians")
        gap_meds = [round(statistics.median([r[i + 1] - r[i] for r in unique])) for i in range(5)]
        span_source = unique
    else:
        gap_meds = [round(statistics.median([r[i + 1] - r[i] for r in sub])) for i in range(5)]
        span_source = sub

    # Option A — span-anchored: scale gap medians so P6 matches median span of subset
    median_span = round(statistics.median([r[5] - r[0] for r in span_source]))
    raw_gaps_sum = sum(gap_meds)
    if raw_gaps_sum > 0:
        scale = median_span / raw_gaps_sum
        scaled_gaps = [max(1, round(g * scale)) for g in gap_meds]
        # Adjust last gap to hit exactly median_span
        scaled_gaps[-1] = max(1, median_span - sum(scaled_gaps[:-1]))
    else:
        scaled_gaps = gap_meds
    raw_a = [start]
    for g in scaled_gaps:
        raw_a.append(min(raw_a[-1] + g, 49))

    # Option B — band spread ~7 gap each step
    bands = [(4, 10), (13, 20), (22, 29), (32, 39), (41, 49)]
    raw_b = [start]
    for lo, hi in bands:
        prev = raw_b[-1]
        cands = [n for n in range(max(lo, prev + 1), hi + 1) if n not in raw_b]
        if cands:
            best = min(cands, key=lambda n: abs((n - prev) - 7))
            raw_b.append(best)
        else:
            raw_b.append(min(prev + 7, 49))

    # Option C — rising staircase
    raw_c = [start]
    for g in [3, 5, 8, 12, 14]:
        raw_c.append(min(raw_c[-1] + g, 49))

    bonus_c = Counter(r[6] for r in sub)
    top_bonus = [b for b, _ in bonus_c.most_common(3)] if sub else ["?"]

    # Top 3 OE targets assigned to A, B, C respectively
    oe_counts = analyse_oe(unique)
    top3_targets = [p for p, _ in oe_counts.most_common(3)]
    # Ensure we have 3 (dataset could have fewer than 3 patterns in theory)
    while len(top3_targets) < 3:
        top3_targets.append(top3_targets[-1])

    print(f"\nP1={start}  |  {len(sub)} historical draws in subset")
    print(f"Gap medians: {gap_meds}  →  scaled to span={median_span} → {scaled_gaps}")
    total = len(unique)
    print(f"OE targets — A: {top3_targets[0][0]}o+{top3_targets[0][1]}e "
          f"({oe_counts[top3_targets[0]]/total*100:.1f}%)  "
          f"B: {top3_targets[1][0]}o+{top3_targets[1][1]}e "
          f"({oe_counts[top3_targets[1]]/total*100:.1f}%)  "
          f"C: {top3_targets[2][0]}o+{top3_targets[2][1]}e "
          f"({oe_counts[top3_targets[2]]/total*100:.1f}%)\n")

    for (label, raw), (oe_odd, oe_even) in zip(
        [("A (median gaps)", raw_a), ("B (band spread)", raw_b), ("C (staircase)  ", raw_c)],
        top3_targets
    ):
        fixed = enforce_oe(raw[:], oe_odd)
        changed = fixed != sorted(raw)
        span = fixed[-1] - fixed[0]
        gaps_out = [fixed[i + 1] - fixed[i] for i in range(5)]
        flag = "  ← nudged" if changed else ""
        print(f"  Option {label}: {fixed}  gaps={gaps_out}  span={span}  {oe_label(fixed)}{flag}")

    print(f"  Bonus (top 3 from P1 subset): {top_bonus}")


def chain_generate(start, unique):
    """Generate 3 draw candidates using the conditional chain model."""
    import statistics

    def band(n):
        if n <= 10: return "1-10"
        elif n <= 20: return "11-20"
        elif n <= 30: return "21-30"
        elif n <= 40: return "31-40"
        else: return "41-49"

    subset = [r for r in unique if r[0] == start]
    if not subset:
        print(f"No historical draws for P1={start}")
        return

    # OE target from P1 subset
    oe_counts = analyse_oe(subset)
    target_odd = oe_counts.most_common(1)[0][0][0]

    print("=" * 65)
    print(f"CHAIN MODEL  |  P1={start}  |  {len(subset)} draws in subset")
    print(f"OE target: {target_odd} odd + {6 - target_odd} even  "
          f"({oe_counts.most_common(1)[0][1]} draws, "
          f"{oe_counts.most_common(1)[0][1]/len(subset)*100:.0f}%)")
    print("=" * 65)

    # Top 3 P2 values → 3 candidate branches
    p2_top = [v for v, _ in Counter(r[1] for r in subset).most_common(3)]
    candidates = []

    for p2 in p2_top:
        draw = [start, p2]
        method = ["exact", "exact"]
        remaining = [r for r in subset if r[1] == p2]

        for pos in range(2, 6):  # P3 through P6
            if len(remaining) >= 3:
                val = Counter(r[pos] for r in remaining).most_common(1)[0][0]
                method.append("exact")
            else:
                # Range: use median, nudge for OE
                vals = [r[pos] for r in remaining] if remaining else [r[pos] for r in subset]
                lo, hi = min(vals), max(vals)
                med = round(statistics.median(vals))
                # Determine how many odds we still need
                current_odd = sum(1 for n in draw if n % 2 != 0)
                still_need_odd = target_odd - current_odd
                positions_left = 6 - len(draw)
                # Pick odd or even from range based on need
                if still_need_odd >= positions_left:
                    # Need all remaining to be odd
                    candidates_range = [n for n in range(lo, hi + 1) if n % 2 != 0 and n not in draw]
                elif still_need_odd <= 0:
                    # Need all remaining to be even
                    candidates_range = [n for n in range(lo, hi + 1) if n % 2 == 0 and n not in draw]
                else:
                    # Mixed — pick closest to median with correct parity
                    need_odd_here = (med % 2 != 0) if still_need_odd > 0 else (med % 2 == 0)
                    parity = 1 if need_odd_here else 0
                    candidates_range = [n for n in range(lo, hi + 1) if n % 2 == parity and n not in draw]
                    if not candidates_range:
                        candidates_range = [n for n in range(lo, hi + 1) if n not in draw]

                if not candidates_range:
                    val = med
                else:
                    val = min(candidates_range, key=lambda n: abs(n - med))
                method.append(f"range({lo}-{hi})")

            draw.append(val)
            remaining = [r for r in remaining if r[pos] == val]

        draw = sorted(draw)
        # Dedup check — if exact match exists, nudge P6
        if tuple(draw) in {tuple(r[:6]) for r in unique}:
            for delta in [1, -1, 2, -2]:
                candidate = draw[5] + delta
                if 1 <= candidate <= 49 and candidate not in draw:
                    draw[5] = candidate
                    draw = sorted(draw)
                    break

        # Final OE check
        draw = enforce_oe(draw, target_odd)
        candidates.append((draw, method, p2))

    print()
    for i, (draw, method, p2) in enumerate(candidates, 1):
        flags = [f"P{j+1}={method[j]}" for j in range(len(method)) if "range" in method[j]]
        flag_str = f"  ← range at: {', '.join(flags)}" if flags else ""
        print(f"  Chain {i} (P2={p2}): {draw}  {oe_label(draw)}{flag_str}")

    print()


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 lottery_generator.py <draws_file.tsv> <starting_number>")
        print("Example: python3 lottery_generator.py draws.tsv 7")
        sys.exit(1)

    path = sys.argv[1]
    start = int(sys.argv[2])

    unique = load_draws(path)
    print(f"\nDataset: {len(unique)} unique draws\n")

    oe_counts = analyse_oe(unique)
    print_oe_report(oe_counts, len(unique))
    print_gap_report(unique)

    print("\n" + "=" * 65)
    generate_options(start, unique)
    print()
    chain_generate(start, unique)


if __name__ == "__main__":
    main()
