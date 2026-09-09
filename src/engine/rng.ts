/**
 * Injected seedable RNG (rules §6, CLAUDE.md). The engine never touches `Math.random`; all
 * randomness (shuffling) flows through this interface so games are reproducible and testable.
 */

export interface Rng {
  /** Returns an integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
}

/**
 * A small deterministic PRNG (mulberry32). Same seed → same sequence.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const nextFloat = (): number => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    nextInt(maxExclusive: number): number {
      if (maxExclusive <= 0) return 0;
      return Math.floor(nextFloat() * maxExclusive);
    },
  };
}

/**
 * Returns a new array that is a Fisher–Yates shuffle of `items` using the injected RNG.
 * Pure: does not mutate the input.
 */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}
