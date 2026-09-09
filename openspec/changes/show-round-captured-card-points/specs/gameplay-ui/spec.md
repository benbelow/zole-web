## MODIFIED Requirements

### Requirement: Round end shows the scored result and allows dealing the next round
At round end the UI SHALL show a summary of the round's result from `PlayerView.result` — the game
type, the soloist (if any), the human-readable settlement summary, and each player's game-point
change — and SHALL provide a control to deal the next round. Dealing the next round SHALL thread the
carry-over (cumulative game points, next dealer, zole-tree branches, round number) via
`carryOverFromEnd` and `dealRound`. (rules §4)

At round end the UI SHALL additionally display the **captured card points** for the round, read from
`RoundResult`, alongside the existing game-point delta:
- for an ordinary or Zole hand, the soloist's card points (`bigScore`) and the allied pair's card
  points (`smallScore`) SHALL be shown as the big/small split (rules §4a);
- for a galdiņš hand, each player's card points won in tricks (`cardPointsByPlayer`) SHALL be shown
  per seat, presented so as not to imply the three totals sum to 120 (rules §4b);
- each seat MAY additionally show its own captured card points for the round as a secondary figure
  beneath its game-point delta.
The captured card-point figures SHALL be presentational only and SHALL NOT alter any game state or
settlement. (rules §1, §4)

#### Scenario: Round summary is shown
- **WHEN** the round reaches its end
- **THEN** the UI displays the game type, the settlement summary, and each player's score change

#### Scenario: Ordinary/Zole shows the big/small card split
- **WHEN** an ordinary or Zole round has ended
- **THEN** the round summary shows the soloist's card points and the pair's card points for the hand

#### Scenario: Galdiņš shows per-seat card points
- **WHEN** a galdiņš round has ended
- **THEN** the round summary shows each player's card points won in tricks
- **AND** the display does not present those three totals as summing to 120

#### Scenario: Captured card points appear beside the delta
- **WHEN** the round has ended and a seat's per-round game-point delta is shown
- **THEN** that seat also shows its captured card points for the round as a secondary figure

#### Scenario: Deal the next round
- **WHEN** the round has ended and the human activates "Deal next round"
- **THEN** a new round is dealt carrying forward cumulative scores, rotated dealer, and zole-tree branches
