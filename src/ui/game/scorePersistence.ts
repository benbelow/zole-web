/**
 * localStorage persistence for the cumulative meta score (design D-persist).
 *
 * This is deliberately a `ui`-layer module: it is the ONLY place the running scoreboard touches
 * browser storage. The engine and AI stay pure (no DOM/I/O), so all impurity — reading/writing
 * localStorage, parsing, and swallowing storage failures — lives here. The unit of persistence is
 * the engine's `RoundCarryOver`, which captures the cumulative game points, the dealer, the zole
 * tree-branch count, and the round number, i.e. exactly what the next round is dealt from.
 *
 * Every access is wrapped in try/catch: localStorage can be unavailable (privacy mode, quota,
 * SSR/Node) and a persistence failure must never break the game.
 */
import type { RoundCarryOver } from '../../engine/index.ts';

const STORAGE_KEY = 'zole-scores';

/** Type guard for a persisted, well-shaped `RoundCarryOver`. */
function isRoundCarryOver(value: unknown): value is RoundCarryOver {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  const gp = v.gamePoints;
  if (!Array.isArray(gp) || gp.length !== 3 || !gp.every((n) => Number.isInteger(n))) {
    return false;
  }

  const dealer = v.dealer;
  if (dealer !== 0 && dealer !== 1 && dealer !== 2) return false;

  if (!Number.isInteger(v.zoleTreeBranches)) return false;
  if (!Number.isInteger(v.roundNumber)) return false;

  return true;
}

/**
 * Read the persisted carry-over. Returns `null` when nothing is stored or the stored value is
 * missing/corrupt/malformed — the caller then starts a fresh game.
 */
export function loadCarryOver(): RoundCarryOver | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRoundCarryOver(parsed)) return null;
    // Reconstruct as a fresh, correctly-typed object (do not leak the parsed reference's extras).
    return {
      gamePoints: [parsed.gamePoints[0], parsed.gamePoints[1], parsed.gamePoints[2]] as const,
      dealer: parsed.dealer,
      zoleTreeBranches: parsed.zoleTreeBranches,
      roundNumber: parsed.roundNumber,
    };
  } catch {
    return null;
  }
}

/** Persist the running carry-over. Failures are swallowed — storage may be unavailable. */
export function saveCarryOver(carry: RoundCarryOver): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carry));
  } catch {
    // Ignore: persistence is best-effort.
  }
}

/** Clear the persisted scores (used by `newGame`, which resets the scoreboard to zero). */
export function clearScores(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore: persistence is best-effort.
  }
}
