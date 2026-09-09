import { cardId, isTrump, type Card } from '../../engine/index.ts';
import { cardLabel, isRedSuit } from '../game/cardText.ts';

export interface CardViewProps {
  card: Card;
  disabled?: boolean | undefined; // dimmed, not clickable
  selected?: boolean | undefined; // highlighted (discard selection)
  playable?: boolean | undefined; // subtle affordance when it is a legal move
  onClick?: ((card: Card) => void) | undefined;
}

export function CardView({ card, disabled, selected, playable, onClick }: CardViewProps) {
  const className = [
    'card',
    isRedSuit(card.suit) ? 'card--red' : 'card--black',
    isTrump(card) && 'card--trump',
    selected && 'card--selected',
    disabled && 'card--disabled',
    playable && !disabled && 'card--playable',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      data-testid={`card-${cardId(card)}`}
      aria-label={cardLabel(card)}
      className={className}
      disabled={disabled}
      onClick={() => !disabled && onClick?.(card)}
    >
      {cardLabel(card)}
    </button>
  );
}
