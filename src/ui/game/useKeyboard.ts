/**
 * Keyboard-first controls (UI-only) to minimise clicking. Attaches a single window key listener and
 * maps keys to the game view-model based on the current phase. Card selection leans on native button
 * focus (cards are real <button>s), so this hook adds only hotkeys + arrow navigation and does not
 * need to change any component's props.
 *
 * Bindings:
 *   Bidding      U = pick up · Z = zole · P = pass
 *   Put-down     1–9/0 toggle the Nth card · Enter confirm · ←/→ move focus (Space toggles focused)
 *   Playing      1–9/0 play the Nth card (if legal) · ←/→ move focus (Enter/Space plays focused)
 *   Trick pause  Enter / Space = Continue
 *   Round over   Enter = Deal next round
 *   Any time     N = new game
 */
import { useEffect } from 'react';
import { cardId } from '../../engine/index.ts';
import { sortHand } from './cardText.ts';
import type { ZoleGameVM } from './useZoleGame.ts';

/** '1'..'9' → 0..8, '0' → 9, otherwise null. */
function digitIndex(key: string): number | null {
  if (key >= '1' && key <= '9') return key.charCodeAt(0) - '1'.charCodeAt(0);
  if (key === '0') return 9;
  return null;
}

/** Move DOM focus left/right across the enabled cards in the human's hand. */
function moveFocus(key: string, event: KeyboardEvent): void {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
  const cards = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.hand .card:not(:disabled)'),
  );
  if (cards.length === 0) return;
  const current = cards.findIndex((c) => c === document.activeElement);
  const start = current === -1 ? (key === 'ArrowRight' ? -1 : 0) : current;
  const next =
    key === 'ArrowRight'
      ? (start + 1) % cards.length
      : (start - 1 + cards.length) % cards.length;
  cards[next]?.focus();
  event.preventDefault();
}

export function useKeyboard(vm: ZoleGameVM): void {
  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const { key } = event;

      // New game is available any time.
      if (key.toLowerCase() === 'n') {
        vm.newGame();
        event.preventDefault();
        return;
      }

      // A finished trick waiting to be acknowledged takes precedence.
      if (vm.pendingTrick) {
        if (key === 'Enter' || key === ' ') {
          vm.continueAfterTrick();
          event.preventDefault();
        }
        return;
      }

      if (vm.isRoundOver) {
        if (key === 'Enter') {
          vm.dealNextRound();
          event.preventDefault();
        }
        return;
      }

      if (!vm.isHumanTurn) return;
      const view = vm.view;

      if (view.phase === 'bidding') {
        const legal = new Set(
          view.legalMoves.flatMap((m) => (m.type === 'bid' ? [m.action] : [])),
        );
        const k = key.toLowerCase();
        if (k === 'u' && legal.has('pickup')) vm.bid('pickup');
        else if (k === 'z' && legal.has('zole')) vm.bid('zole');
        else if (k === 'p' && legal.has('pass')) vm.bid('pass');
        else return;
        event.preventDefault();
        return;
      }

      if (view.phase === 'discarding') {
        if (key === 'Enter') {
          vm.confirmDiscard();
          event.preventDefault();
          return;
        }
        const n = digitIndex(key);
        if (n !== null) {
          const card = sortHand(view.hand)[n];
          if (card) {
            vm.toggleDiscardSelection(card);
            event.preventDefault();
          }
          return;
        }
        moveFocus(key, event);
        return;
      }

      if (view.phase === 'playing') {
        const n = digitIndex(key);
        if (n !== null) {
          const card = sortHand(view.hand)[n];
          const legalIds = new Set(
            view.legalMoves.flatMap((m) => (m.type === 'play' ? [cardId(m.card)] : [])),
          );
          if (card && legalIds.has(cardId(card))) {
            vm.playCard(card);
            event.preventDefault();
          }
          return;
        }
        moveFocus(key, event);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [vm]);
}
