/**
 * Top-level game layout (design D4). Pure presentation: it derives everything from the view-model's
 * `PlayerView` + callbacks and shows only the control for the active phase.
 */
import type { BidAction, Card } from '../../engine/index.ts';
import { HUMAN, seatName } from '../game/driver.ts';
import { sortHand } from '../game/cardText.ts';
import type { ZoleGameVM } from '../game/useZoleGame.ts';
import { StatusBanner } from './StatusBanner.tsx';
import { Scoreboard, type ScoreEntry } from './Scoreboard.tsx';
import { OpponentPanel } from './OpponentPanel.tsx';
import { TrickArea } from './TrickArea.tsx';
import { Hand } from './Hand.tsx';
import { BiddingControls } from './BiddingControls.tsx';
import { DiscardTray } from './DiscardTray.tsx';
import { RoundSummary } from './RoundSummary.tsx';
import { GameControls } from './GameControls.tsx';

export interface TableProps {
  vm: ZoleGameVM;
}

export function Table({ vm }: TableProps) {
  const { view, phase, isHumanTurn } = vm;

  const legalPlayCards: Card[] = view.legalMoves.flatMap((m) => (m.type === 'play' ? [m.card] : []));
  const legalBids: BidAction[] = view.legalMoves.flatMap((m) =>
    m.type === 'bid' ? [m.action] : [],
  );

  const humanIsSoloist = view.soloist === HUMAN;
  const showBidding = phase === 'bidding' && isHumanTurn;
  const showDiscard = phase === 'discarding' && humanIsSoloist && isHumanTurn;
  const pending = vm.pendingTrick;
  const sortedHand = sortHand(view.hand);

  const scoreEntries: ScoreEntry[] = [
    { seat: view.me, name: seatName(view.me), gamePoints: view.gamePoints, isMe: true },
    ...view.opponents.map((o) => ({
      seat: o.id,
      name: seatName(o.id),
      gamePoints: o.gamePoints,
      isMe: false,
    })),
  ].sort((a, b) => a.seat - b.seat);

  return (
    <div className="zole-table">
      <header className="zole-header">
        <h1>Zole</h1>
        <StatusBanner
          phase={view.phase}
          current={view.current}
          gameType={view.gameType}
          soloist={view.soloist}
          isHumanTurn={isHumanTurn}
        />
      </header>

      <Scoreboard entries={scoreEntries} zoleTreeBranches={view.zoleTreeBranches} />

      <section className="opponents">
        {view.opponents.map((o) => (
          <OpponentPanel
            key={o.id}
            opponent={o}
            isCurrent={phase !== 'roundEnd' && view.current === o.id}
            isSoloist={view.soloist === o.id}
            phase={view.phase}
          />
        ))}
      </section>

      <TrickArea trick={pending ? pending.cards : view.trick} />

      {pending ? (
        <div className="trick-resolution">
          <span className="trick-resolution__text">Trick won by {seatName(pending.winner)}</span>
          <button type="button" className="btn" onClick={vm.continueAfterTrick}>
            Continue
          </button>
        </div>
      ) : null}

      {phase === 'roundEnd' && !pending && view.result ? (
        <RoundSummary result={view.result} />
      ) : null}

      <section className="human-area">
        <div className="human-label">Your hand</div>
        {showDiscard ? (
          <DiscardTray
            cards={sortedHand}
            selected={vm.selectedDiscards}
            onToggle={vm.toggleDiscardSelection}
            onConfirm={vm.confirmDiscard}
          />
        ) : (
          <Hand
            cards={sortedHand}
            legalCards={legalPlayCards}
            interactive={isHumanTurn && phase === 'playing' && !pending}
            onPlay={vm.playCard}
          />
        )}

        {showBidding ? <BiddingControls legalBids={legalBids} onBid={vm.bid} /> : null}
      </section>

      <GameControls
        isRoundOver={vm.isRoundOver}
        seed={vm.seed}
        onDealNext={vm.dealNextRound}
        onNewGame={() => vm.newGame()}
      />
    </div>
  );
}
