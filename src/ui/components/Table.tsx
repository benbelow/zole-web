/**
 * Top-level game layout (design D4). Pure presentation: it derives everything from the view-model's
 * `PlayerView` + callbacks and shows only the control for the active phase.
 */
import type { BidAction, Card, PlayerId } from '../../engine/index.ts';
import { HUMAN, seatName } from '../game/driver.ts';
import { sortHand } from '../game/cardText.ts';
import type { ZoleGameVM } from '../game/useZoleGame.ts';
import type { ThemeId } from '../theme/useTheme.ts';
import { ThemeSwitcher } from './ThemeSwitcher.tsx';
import { StatusBanner } from './StatusBanner.tsx';
import { Scoreboard, type ScoreEntry } from './Scoreboard.tsx';
import { OpponentPanel, type Role } from './OpponentPanel.tsx';
import { TrickArea } from './TrickArea.tsx';
import { Hand } from './Hand.tsx';
import { BiddingControls } from './BiddingControls.tsx';
import { DiscardTray } from './DiscardTray.tsx';
import { RoundSummary } from './RoundSummary.tsx';
import { RoundDelta } from './RoundDelta.tsx';
import { CardPointsPill } from './CardPointsPill.tsx';
import { GameControls } from './GameControls.tsx';

export interface TableProps {
  vm: ZoleGameVM;
  theme?: ThemeId;
  onThemeChange?: (theme: ThemeId) => void;
}

export function Table({ vm, theme, onThemeChange }: TableProps) {
  const { view, phase, isHumanTurn } = vm;

  const legalPlayCards: Card[] = view.legalMoves.flatMap((m) =>
    m.type === 'play' ? [m.card] : [],
  );
  const legalBids: BidAction[] = view.legalMoves.flatMap((m) =>
    m.type === 'bid' ? [m.action] : [],
  );

  const humanIsSoloist = view.soloist === HUMAN;
  const showBidding = phase === 'bidding' && isHumanTurn;
  const showDiscard = phase === 'discarding' && humanIsSoloist && isHumanTurn;
  const pending = vm.pendingTrick;
  const sortedHand = sortHand(view.hand);

  // Big (soloist) vs Small (pair) is meaningful once a soloist is decided (ordinary/Zole, not
  // galdiņš). Surface it prominently on every seat.
  const rolesVisible =
    (phase === 'discarding' || phase === 'playing' || phase === 'roundEnd') &&
    view.soloist !== null;
  const roleOf = (seat: PlayerId): Role =>
    rolesVisible ? (seat === view.soloist ? 'big' : 'small') : null;
  const myRole = roleOf(HUMAN);

  // At round end, surface each seat's per-round game-point change large in its own space. The full
  // breakdown still lives in RoundSummary; this is the at-a-glance number. Hidden mid-trick so the
  // reveal lands with the round-over summary.
  const roundOver = phase === 'roundEnd' && !pending && view.result !== null;
  const deltaFor = (seat: PlayerId): number | null =>
    roundOver && view.result ? view.result.deltas[seat] : null;
  const humanDelta = deltaFor(HUMAN);

  // Each seat's card points taken in tricks this round — a small secondary figure under the delta.
  // Consistent "points taken in play" for every seat; the soloist's full bigScore stays in the
  // summary. Hidden mid-trick (shares the roundOver gate).
  const cardPointsFor = (seat: PlayerId): number | null =>
    roundOver && view.result ? view.result.cardPointsByPlayer[seat] : null;
  const humanCardPoints = cardPointsFor(HUMAN);

  const scoreEntries: ScoreEntry[] = [
    { seat: view.me, name: seatName(view.me), gamePoints: view.gamePoints, isMe: true },
    ...view.opponents.map((o) => ({
      seat: o.id,
      name: seatName(o.id),
      gamePoints: o.gamePoints,
      isMe: false,
    })),
  ].sort((a, b) => a.seat - b.seat);

  const isGaldins = view.gameType === 'galdins';

  return (
    <div className={`zole-table${isGaldins ? ' zole-table--galdins' : ''}`}>
      <header className={`zole-header${isGaldins ? ' zole-header--galdins' : ''}`}>
        <h1>Zole</h1>
        {theme && onThemeChange ? <ThemeSwitcher theme={theme} onChange={onThemeChange} /> : null}
        {isGaldins ? (
          <div className="galdins-banner" role="note">
            <span className="galdins-banner__label">Galdiņš</span>
            <span className="galdins-banner__desc">No soloist — fewest tricks wins</span>
          </div>
        ) : null}
        <StatusBanner
          phase={view.phase}
          current={view.current}
          gameType={view.gameType}
          soloist={view.soloist}
          isHumanTurn={isHumanTurn}
          dealer={view.dealer}
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
            role={roleOf(o.id)}
            isDealer={view.dealer === o.id}
            strategyId={vm.aiStrategies[o.id]}
            onStrategyChange={(id) => vm.setAiStrategy(o.id, id)}
            roundDelta={deltaFor(o.id)}
            cardPoints={cardPointsFor(o.id)}
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
        <div className="human-label">
          Your hand
          {view.dealer === HUMAN && (
            <span className="dealer-chip" title="Dealer">
              D
            </span>
          )}
          {myRole && (
            <span className={`role-badge role-badge--${myRole}`}>
              {myRole === 'big' ? 'BIG' : 'SMALL'}
            </span>
          )}
        </div>
        {humanDelta !== null && <RoundDelta delta={humanDelta} />}
        {humanCardPoints !== null && <CardPointsPill points={humanCardPoints} />}
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

      <p className="key-hints">
        Keys: <kbd>U</kbd> pick up · <kbd>Z</kbd> zole · <kbd>P</kbd> pass · number keys pick a card
        · <kbd>←</kbd>/<kbd>→</kbd> move · <kbd>Enter</kbd> confirm / continue · <kbd>N</kbd> new
        game
      </p>
    </div>
  );
}
