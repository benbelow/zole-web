import { cardId, type Card } from '../../engine/index.ts';
import { CardView } from './CardView.tsx';

export interface DiscardTrayProps {
  cards: readonly Card[]; // human's 10 cards
  selected: readonly Card[]; // 0..2 currently selected
  onToggle: (card: Card) => void;
  onConfirm: () => void;
}

export function DiscardTray({ cards, selected, onToggle, onConfirm }: DiscardTrayProps) {
  const selectedIds = new Set<string>(selected.map(cardId));

  return (
    <div className="discard-tray">
      <p className="discard-prompt">Select two cards to discard</p>
      <div className="hand">
        {cards.map((card) => (
          <CardView
            key={cardId(card)}
            card={card}
            selected={selectedIds.has(cardId(card))}
            onClick={onToggle}
          />
        ))}
      </div>
      <button
        type="button"
        className="discard-confirm"
        disabled={selected.length !== 2}
        onClick={onConfirm}
      >
        Discard 2
      </button>
    </div>
  );
}
