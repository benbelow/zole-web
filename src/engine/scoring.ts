/**
 * Round scoring for Zole (rules §4).
 *
 * Pure: given a finished `PlayingState`, compute the per-player game-point deltas and the
 * resulting zole-tree branch count. No mutation, no React/DOM/I/O, no randomness.
 */

import { cardPoints } from './cards.ts';
import type { Card } from './cards.ts';
import type { PlayingState, RoundResult } from './state.ts';

/** Sum of card point values across a set of captured cards. */
function pointsOf(cards: readonly Card[]): number {
  return cards.reduce((sum, c) => sum + cardPoints(c), 0);
}

/** The ordinary/Zole settlement band for a given soloist card-point total (rules §4a). */
function baseToScore(bigScore: number): number {
  if (bigScore === 120) return 3;
  if (bigScore >= 91) return 2;
  if (bigScore >= 61) return 1;
  if (bigScore >= 31) return 2;
  if (bigScore >= 1) return 3;
  return 4;
}

/**
 * Score a finished round.
 *
 * At call time every trick has been played: each `players[i].captured` holds that player's won
 * cards, `players[i].tricksWon` its trick count, `soloistDiscard`/`pairStock` hold the banked
 * cards, and `zoleTreeBranches` is the current branch count.
 */
export function scoreRound(state: PlayingState): RoundResult {
  const treeBranchesBefore = state.zoleTreeBranches;

  // ----- Galdiņš (no soloist): fewest tricks wins; most tricks pays 2 per opponent. -----
  if (state.soloist === null || state.gameType === 'galdins') {
    const tricks = state.players.map((p) => p.tricksWon);
    const maxTricks = Math.max(...tricks);
    const losers = tricks.filter((t) => t === maxTricks).length;

    if (losers === 1) {
      const loser = tricks.indexOf(maxTricks);
      const deltas: [number, number, number] = [2, 2, 2];
      deltas[loser] = -4;
      return {
        gameType: 'galdins',
        soloist: null,
        bigScore: null,
        deltas,
        treeBranchesBefore,
        treeBranchesAfter: treeBranchesBefore,
        summary: `Galdiņš: player ${loser} took the most tricks (${maxTricks}) and pays 2 to each opponent.`,
      };
    }

    return {
      gameType: 'galdins',
      soloist: null,
      bigScore: null,
      deltas: [0, 0, 0],
      treeBranchesBefore,
      treeBranchesAfter: treeBranchesBefore,
      summary: `Galdiņš: ${losers} players tied for the most tricks (${maxTricks}); nobody pays.`,
    };
  }

  // ----- Ordinary / Zole -----
  const soloist = state.soloist;
  const captured = pointsOf(state.players[soloist].captured);
  const bigScore =
    state.gameType === 'ordinary' ? captured + pointsOf(state.soloistDiscard) : captured;

  const opponents = [0, 1, 2].filter((i) => i !== soloist) as [number, number];

  // Special case: exact 60–60 tie — nobody scores, tie adds a branch to the tree.
  if (bigScore === 60) {
    return {
      gameType: state.gameType,
      soloist,
      bigScore,
      deltas: [0, 0, 0],
      treeBranchesBefore,
      treeBranchesAfter: treeBranchesBefore + 1,
      summary: `60–60 tie: no score this hand; a branch is added to the zole tree.`,
    };
  }

  let toScore = baseToScore(bigScore);
  if (state.gameType === 'zole') toScore += 3;

  const soloistWon = bigScore >= 61;
  const deltas: [number, number, number] = [0, 0, 0];
  let treeBranchesAfter: number;
  let summary: string;

  if (soloistWon) {
    toScore += treeBranchesBefore; // branch payout
    deltas[soloist] = 2 * toScore;
    deltas[opponents[0]] = -toScore;
    deltas[opponents[1]] = -toScore;
    treeBranchesAfter = 0; // branches consumed on a soloist win
    const branchNote = treeBranchesBefore > 0 ? ` (incl. ${treeBranchesBefore} tree branch(es))` : '';
    summary =
      `${state.gameType === 'zole' ? 'Zole' : 'Ordinary'}: soloist (player ${soloist}) won with ` +
      `${bigScore} points${branchNote}; +${2 * toScore}, each opponent -${toScore}.`;
  } else {
    deltas[soloist] = -2 * toScore;
    deltas[opponents[0]] = toScore;
    deltas[opponents[1]] = toScore;
    treeBranchesAfter = treeBranchesBefore; // branches only consumed on a win
    summary =
      `${state.gameType === 'zole' ? 'Zole' : 'Ordinary'}: soloist (player ${soloist}) lost with ` +
      `${bigScore} points; -${2 * toScore}, each opponent +${toScore}.`;
  }

  return {
    gameType: state.gameType,
    soloist,
    bigScore,
    deltas,
    treeBranchesBefore,
    treeBranchesAfter,
    summary,
  };
}
