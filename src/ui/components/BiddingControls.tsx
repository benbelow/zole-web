import type { BidAction } from '../../engine/index.ts';

export interface BiddingControlsProps {
  legalBids: readonly BidAction[];
  onBid: (action: BidAction) => void;
  disabled?: boolean;
}

const BID_LABELS: Record<BidAction, string> = {
  pickup: 'Pick up',
  zole: 'Zole',
  pass: 'Pass',
};

const BID_ORDER = ['pickup', 'zole', 'pass'] as const;

export function BiddingControls({ legalBids, onBid, disabled }: BiddingControlsProps) {
  return (
    <div className="bidding-controls">
      {BID_ORDER.filter((action) => legalBids.includes(action)).map((action) => (
        <button
          key={action}
          type="button"
          className="bid-button"
          disabled={disabled}
          onClick={() => onBid(action)}
        >
          {BID_LABELS[action]}
        </button>
      ))}
    </div>
  );
}
