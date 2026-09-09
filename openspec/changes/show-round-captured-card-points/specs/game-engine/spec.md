## MODIFIED Requirements

### Requirement: Ordinary and Zole scoring
At scoring the engine SHALL compute the soloist's card points and settle per opponent using the
bands: 120 → 3; 91–119 → 2; 61–90 → 1 (soloist wins); 31–60 → 2; 1–30 → 3; 0 → 4 (soloist loses).
The soloist SHALL receive/pay each of the two opponents this amount (net double for the soloist). A
Zole call SHALL add 3 to the per-opponent amount. (rules §4)

The round result SHALL additionally report the captured card-point totals for the hand, without
affecting any settlement outcome:
- the soloist's card points (`bigScore`) — the soloist's trick points plus, in an ordinary game, the
  two banked discards (rules §4a);
- the allied pair's card points (`smallScore`) — the two opponents' trick points plus, in a Zole
  call, the two banked talon cards; this SHALL equal `120 − bigScore` for ordinary and Zole games;
- each player's card points won in tricks this round (`cardPointsByPlayer`, indexed by player),
  excluding banked cards (the ordinary discard and the Zole talon). (rules §1, §4a)

#### Scenario: Simple soloist win
- **WHEN** an ordinary soloist finishes with 75 card points
- **THEN** the soloist gains 2 game points total and each opponent loses 1

#### Scenario: Soloist heavy loss
- **WHEN** an ordinary soloist finishes with 20 card points
- **THEN** the soloist loses 6 game points total and each opponent gains 3

#### Scenario: Zole bonus
- **WHEN** a Zole soloist wins with 70 card points
- **THEN** the per-opponent amount is 4 (1 + 3) and the soloist gains 8 game points total

#### Scenario: Result reports the big/small card-point split
- **WHEN** an ordinary or Zole hand is scored with soloist card points `bigScore`
- **THEN** the result reports `smallScore` equal to `120 − bigScore`
- **AND** the result reports each player's trick card points in `cardPointsByPlayer`

#### Scenario: Zole talon counts toward the pair total
- **WHEN** a Zole hand is scored and the two banked talon cards are worth `t` card points
- **THEN** the reported `smallScore` exceeds the sum of the two opponents' trick card points by exactly `t`

### Requirement: Galdiņš scoring
In galdiņš, game points SHALL change only when a single player has strictly the most tricks: that
player SHALL pay 2 game points to each of the other two. If two or three players tie for the most
tricks, no game points SHALL change that hand. (rules §4)

The round result SHALL report each player's card points won in tricks this round
(`cardPointsByPlayer`, indexed by player), and SHALL report no big/small split (both the soloist's
and the pair's card-point totals are absent, since galdiņš has no soloist or pair). Because the two
set-aside talon cards are not captured by any player, `cardPointsByPlayer` MAY sum to fewer than 120
card points in galdiņš; this SHALL NOT affect the trick-based settlement. (rules §1, §4b)

#### Scenario: Most tricks pays
- **WHEN** a galdiņš hand ends with one player having strictly the most tricks
- **THEN** that player loses 4 game points total and each other player gains 2

#### Scenario: Tie for most tricks pays nothing
- **WHEN** a galdiņš hand ends with two or more players tied for the most tricks
- **THEN** no player's game points change for that hand

#### Scenario: Galdiņš result reports per-player card points
- **WHEN** a galdiņš hand is scored
- **THEN** the result reports each player's trick card points in `cardPointsByPlayer`
- **AND** the result reports no soloist card total and no pair card total
