import { useState } from 'react';
import { cardId, type Card } from '../../engine/index.ts';
import { CardView } from './CardView.tsx';

export interface HandProps {
  cards: readonly Card[];
  legalCards?: readonly Card[]; // cards legal to play right now
  interactive: boolean; // whether cards may be clicked
  onPlay?: (card: Card) => void;
}

/**
 * Given the previously-rendered hand's card ids and the current ids, return the ids that are new
 * this render — the cards that should animate their entrance. Pure so it can be unit-tested.
 *
 * On a brand-new deal the previous set is empty, so every card is "new" and the full deal animates.
 * On pick-up (the soloist takes the 2 stock cards) only those 2 ids are new, so the 8 already-held
 * cards stay put. Re-renders that don't change the hand (discard selection, AI ticking) yield an
 * empty set, so nothing re-animates.
 */
export function diffNewCardIds(prevIds: ReadonlySet<string>, currentIds: readonly string[]): Set<string> {
  const next = new Set<string>();
  for (const id of currentIds) {
    if (!prevIds.has(id)) next.add(id);
  }
  return next;
}

export function Hand({ cards, legalCards, interactive, onPlay }: HandProps) {
  const legalIds = new Set<string>((legalCards ?? []).map(cardId));

  // Diff against the previously-rendered hand so only newly-arrived cards animate in. We use React's
  // "adjust state while rendering" pattern (see the React docs, "Storing information from previous
  // renders"): `tracker` holds the last id signature, the committed id set, and the ids that were new
  // at that signature. When the hand's id signature changes we recompute the entering ids and store
  // the new snapshot in the same render pass, so the render that commits already carries the correct
  // `card--dealing` markers on the freshly-mounted cards. It is idempotent under StrictMode's
  // double-render because the diff is a pure set difference. Re-renders that don't change the hand
  // (discard selection, AI ticking) keep the same signature, so no card gains the marker and no
  // already-held card re-animates. The `card--dealing` class lingering on a stable card across such
  // renders is harmless: the CSS entrance animation is one-shot (`both` fill) and only replays when
  // the element remounts, which happens only for a genuinely new card id (a new React key).
  const currentIds = cards.map(cardId);
  const signature = currentIds.join('|');
  const [tracker, setTracker] = useState<{
    signature: string;
    ids: ReadonlySet<string>;
    newIds: ReadonlySet<string>;
  }>(() => ({ signature, ids: new Set(currentIds), newIds: new Set(currentIds) }));
  let newIds = tracker.newIds;
  if (tracker.signature !== signature) {
    newIds = diffNewCardIds(tracker.ids, currentIds);
    setTracker({ signature, ids: new Set(currentIds), newIds });
  }

  return (
    <div className="hand">
      {cards.map((card) => {
        const id = cardId(card);
        const legal = !legalCards || legalIds.has(id);
        const clickable = interactive && legal;
        // Grey a card out ONLY when it's the human's turn to play and this card is an illegal
        // choice. When it isn't a play turn (bidding, an opponent's turn, round end) the hand is
        // simply not clickable — it should still render at full opacity, not look disabled.
        const dimmed = interactive && !legal;
        return (
          <CardView
            key={id}
            card={card}
            disabled={!clickable}
            dimmed={dimmed}
            playable={clickable}
            entering={newIds.has(id)}
            onClick={clickable ? onPlay : undefined}
          />
        );
      })}
    </div>
  );
}
