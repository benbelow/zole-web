## Purpose

The interactive browser UI for Zole: it lets a human (player 0) play complete rounds and a
continuing game against two AI opponents (players 1 and 2). It renders the human's redacted
`PlayerView`, offers only legal moves, applies human moves through the engine, and automatically
advances AI turns. It is a thin presentation + driver layer over the pure engine and AI; it holds
no game rules of its own. (rules §3, §4; consumes `src/engine` and `src/ai`.)

## ADDED Requirements

### Requirement: Renders the human's redacted view only
The UI SHALL render the game exclusively from the human player's `PlayerView` (via
`viewFor(state, 0)`) and SHALL NOT display any hidden information — opponents' hands, the stock, or
the soloist's discard. Opponents SHALL be shown only by the public counts and flags in
`OpponentView` (hand count, tricks won, game points, whether they passed). (design D3 of the engine)

#### Scenario: Opponent hands stay hidden
- **WHEN** the game is in progress
- **THEN** each opponent panel shows only that opponent's card count and public status
- **AND** no opponent's individual card faces are rendered anywhere in the UI

#### Scenario: Stock and discard stay hidden
- **WHEN** the human is the soloist in an ordinary game after picking up
- **THEN** the two stock cards the human received are shown in the human's own hand
- **AND** no AI soloist's stock or discard is ever revealed to the human

### Requirement: Only legal moves are offered
The UI SHALL make actionable only the moves present in `PlayerView.legalMoves` for the human. Cards,
bid buttons, and the discard/confirm control that do not correspond to a legal move SHALL be
disabled (non-clickable) or hidden. The UI SHALL NOT call `applyMove` with a move that is not in
`legalMoves`. (rules §3)

#### Scenario: Illegal cards are not playable
- **WHEN** it is the human's turn during trick play and a suit is led that the human can follow
- **THEN** only the human's cards of the led category are clickable
- **AND** the human's other cards are shown disabled

#### Scenario: No controls when it is not the human's turn
- **WHEN** `current` is an AI seat
- **THEN** no human move control is actionable

### Requirement: Human plays a legal card
When it is the human's turn during trick play, clicking a legal card SHALL apply the corresponding
`{ type: 'play', card }` move via the engine and advance the game state. The played card SHALL move
from the human's hand into the trick area. (rules §3)

#### Scenario: Playing a card advances the trick
- **WHEN** it is the human's turn and the human clicks a legal card
- **THEN** that card appears in the trick area attributed to the human
- **AND** it is removed from the human's hand
- **AND** the turn passes to the next player

### Requirement: Human bids
During the bidding phase, when it is the human's turn, the UI SHALL present exactly the bid actions
that are legal (`pickup`, `zole`, and/or `pass`) and applying one SHALL advance the game. If the
human picks up in an ordinary game, the UI SHALL transition to the discard phase for the human.
(rules §3, §4a)

#### Scenario: Human passes
- **WHEN** it is the human's turn to bid and the human clicks "Pass"
- **THEN** a `{ type: 'bid', action: 'pass' }` move is applied
- **AND** the turn passes to the next bidder (or the round resolves if all have acted)

#### Scenario: Human picks up
- **WHEN** it is the human's turn to bid and the human clicks "Pick up"
- **THEN** the human becomes the soloist and the UI enters the discard phase with the human holding 10 cards

### Requirement: Human discards two cards in an ordinary game
In the discarding phase, when the human is the soloist, the UI SHALL let the human select exactly
two cards and confirm, applying `{ type: 'discard', cards: [a, b] }`. Confirmation SHALL be
disabled until exactly two cards are selected. After discarding, trick play SHALL begin. (rules §3, §4a)

#### Scenario: Confirm requires exactly two cards
- **WHEN** the human has selected fewer than two or more than two cards to discard
- **THEN** the confirm control is disabled

#### Scenario: Discard completes the put-down
- **WHEN** the human has exactly two cards selected and confirms
- **THEN** those two cards leave the human's hand and trick play begins

### Requirement: AI turns advance automatically
When `state.current` is an AI seat (player 1 or 2) and the round is not over, the UI SHALL compute
that seat's move via `greedyPlayer(viewFor(state, current), rng)` and apply it, without human input,
after a short readability delay. The UI SHALL continue advancing consecutive AI turns until it is
the human's turn or the round ends. (rules §5)

#### Scenario: AI plays without human input
- **WHEN** the game state's current player is an AI seat and the round is in progress
- **THEN** after a short delay the AI's move is applied automatically
- **AND** the resulting state is reflected in the UI

#### Scenario: Consecutive AI turns chain
- **WHEN** both AI players must act in sequence (e.g. two AI bids or plays in a row)
- **THEN** each AI move is applied in turn until control returns to the human or the round ends

### Requirement: All-pass leads to galdiņš in the UI
When all three players pass during bidding, the UI SHALL reflect that the round is played as galdiņš
(no soloist) and proceed into trick play, then round-end scoring, like any other round. (rules §3, §4b)

#### Scenario: Galdiņš after all pass
- **WHEN** the human passes and both AI players pass
- **THEN** the UI enters trick play with no soloist indicated
- **AND** the round is scored as galdiņš at round end

### Requirement: Round end shows the scored result and allows dealing the next round
At round end the UI SHALL show a summary of the round's result from `PlayerView.result` — the game
type, the soloist (if any), the human-readable settlement summary, and each player's game-point
change — and SHALL provide a control to deal the next round. Dealing the next round SHALL thread the
carry-over (cumulative game points, next dealer, zole-tree branches, round number) via
`carryOverFromEnd` and `dealRound`. (rules §4)

#### Scenario: Round summary is shown
- **WHEN** the round reaches its end
- **THEN** the UI displays the game type, the settlement summary, and each player's score change

#### Scenario: Deal the next round
- **WHEN** the round has ended and the human activates "Deal next round"
- **THEN** a new round is dealt carrying forward cumulative scores, rotated dealer, and zole-tree branches

### Requirement: Cumulative scoreboard
The UI SHALL display each player's cumulative game points across rounds, updated after each round is
scored. (rules §4)

#### Scenario: Scoreboard reflects settlement
- **WHEN** a round has been scored
- **THEN** the scoreboard shows each player's updated cumulative game points

### Requirement: Deterministic, seeded games
All randomness SHALL be supplied by the engine's injected RNG (`createRng(seed)`); the UI SHALL NOT
use `Math.random` inside the engine/AI. The UI/app layer MAY generate or accept a seed for a new
game, and the same seed with the same human choices SHALL reproduce the same game. (rules §6)

#### Scenario: Same seed reproduces the game
- **WHEN** a game is started with a given seed and the human makes the same sequence of choices
- **THEN** the deals and AI moves are identical to a prior game with that seed and choices
