import { cardId, isTrump, type Card, type Rank } from '../../engine/index.ts';
import { cardLabel, isRedSuit, rankLabel, SUIT_GLYPH } from '../game/cardText.ts';

export interface CardViewProps {
  card: Card;
  disabled?: boolean | undefined; // not clickable (renders at full opacity — see `dimmed` for greying)
  dimmed?: boolean | undefined; // greyed out: an illegal choice during the player's turn to act
  selected?: boolean | undefined; // highlighted (discard selection)
  playable?: boolean | undefined; // subtle affordance when it is a legal move
  entering?: boolean | undefined; // newly-arrived card: run the deal-in entrance animation
  onClick?: ((card: Card) => void) | undefined;
}

const COURT_RANKS: ReadonlySet<Rank> = new Set(['J', 'Q', 'K']);

/** A stacked corner index: rank above a small suit glyph. Rendered top-left and bottom-right. */
function CornerIndex({ rank, glyph }: { rank: Rank; glyph: string }) {
  return (
    <span className="card__corner" aria-hidden="true">
      <span className="card__corner-rank">{rankLabel(rank)}</span>
      <span className="card__corner-suit">{glyph}</span>
    </span>
  );
}

/** The large central artwork. Court cards get an emblem ring, aces a single oversized pip. */
function CardCenter({ card, glyph }: { card: Card; glyph: string }) {
  const isCourt = COURT_RANKS.has(card.rank);
  const isAce = card.rank === 'A';

  if (isCourt) {
    return (
      <span className="card__center card__center--court" aria-hidden="true">
        <span className="card__court-ring">
          <span className="card__court-letter">{rankLabel(card.rank)}</span>
          <span className="card__court-emblem">{glyph}</span>
        </span>
      </span>
    );
  }

  if (isAce) {
    return (
      <span className="card__center card__center--ace" aria-hidden="true">
        <span className="card__ace-pip">{glyph}</span>
      </span>
    );
  }

  return (
    <span className="card__center card__center--number" aria-hidden="true">
      <span className="card__pip">{glyph}</span>
    </span>
  );
}

export function CardView({
  card,
  disabled,
  dimmed,
  selected,
  playable,
  entering,
  onClick,
}: CardViewProps) {
  const red = isRedSuit(card.suit);
  const trump = isTrump(card);
  const glyph = SUIT_GLYPH[card.suit];

  const className = [
    'card',
    red ? 'card--red' : 'card--black',
    trump && 'card--trump',
    selected && 'card--selected',
    dimmed && 'card--disabled',
    playable && !dimmed && 'card--playable',
    entering && 'card--dealing',
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
      <span className="card__face">
        <CornerIndex rank={card.rank} glyph={glyph} />
        <CardCenter card={card} glyph={glyph} />
        <CornerIndex rank={card.rank} glyph={glyph} />
        {trump && (
          <span className="card__trump-badge" aria-hidden="true">
            ★
          </span>
        )}
      </span>
    </button>
  );
}
