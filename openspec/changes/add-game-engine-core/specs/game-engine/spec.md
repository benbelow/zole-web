## Purpose

The pure, deterministic rules engine for Zole: it defines the deck and card ordering, resolves
tricks, drives the round state machine (deal, bid, put-down, trick play, and the galdiņš pass-out),
and computes scoring. It is the single source of game truth that the AI and UI layers build on.

## ADDED Requirements

### Requirement: Deck composition
The engine SHALL use a 26-card Zole deck: diamonds 7,8,9,10,J,Q,K,A (8 cards) and, in each of
clubs, spades and hearts, only 9,10,K,A plus Q and J (6 each). There SHALL be no 7s or 8s outside
diamonds. (rules §1)

#### Scenario: Deck contents
- **WHEN** a fresh deck is created
- **THEN** it contains exactly 26 distinct cards
- **AND** it contains the 7♦ and 8♦ but none of 7♣/8♣/7♠/8♠/7♥/8♥

### Requirement: Card point values
Each card SHALL carry a point value: Ace 11, Ten 10, King 4, Queen 3, Jack 2, and 9/8/7 zero, so
the deck totals 120 points. (rules §1)

#### Scenario: Deck point total
- **WHEN** the point values of all 26 cards are summed
- **THEN** the total is 120

### Requirement: Trump and suit ordering
The engine SHALL treat as trumps, in descending strength: Q♣, Q♠, Q♥, Q♦, J♣, J♠, J♥, J♦, then the
diamonds A,10,K,9,8,7 (14 trumps). The three non-trump suits (♣ ♠ ♥) SHALL rank A > 10 > K > 9.
(rules §2)

#### Scenario: Trump outranks non-trump
- **WHEN** the lowest trump (7♦) is compared with any non-trump card
- **THEN** the 7♦ is the stronger card

#### Scenario: Queen ordering
- **WHEN** Q♣ and Q♦ are compared
- **THEN** Q♣ is the stronger card

### Requirement: Follow-suit legality
When it is a player's turn during trick play, a legal move SHALL be: if the player holds any card of
the led category (trumps if a trump led, otherwise the led suit), they MUST play a card of that
category; otherwise they MAY play any card. There SHALL be no obligation to play higher than the
current winning card. (rules §3, §6)

#### Scenario: Must follow the led suit
- **WHEN** hearts is led and the player holds at least one heart
- **THEN** only that player's hearts are legal moves

#### Scenario: May play anything when void
- **WHEN** hearts is led and the player holds no hearts
- **THEN** every card in the player's hand is a legal move

### Requirement: Trick winner
The engine SHALL award a completed 3-card trick to the highest trump played, or if no trump was
played, to the highest card of the led suit. The trick winner SHALL lead the next trick. (rules §2, §3)

#### Scenario: Highest trump wins
- **WHEN** a trick contains one or more trumps
- **THEN** the player of the highest-ranked trump wins the trick

#### Scenario: Off-suit discards cannot win
- **WHEN** a non-trump suit is led and a later player is void and plays a non-trump of another suit
- **THEN** that off-suit card cannot win the trick

### Requirement: Deal
On a new round the engine SHALL shuffle the deck using an injected RNG and deal 8 cards to each of
the 3 players and 2 cards face-down to the stock. Dealing SHALL be from a seeded, reproducible
shuffle. (rules §3)

#### Scenario: Deal distribution
- **WHEN** a round is dealt
- **THEN** each of the 3 players holds 8 cards and the stock holds 2 cards, accounting for all 26

#### Scenario: Reproducible shuffle
- **WHEN** two rounds are dealt with RNGs seeded identically
- **THEN** the two deals are identical

### Requirement: Bidding and roles
Each player in turn (starting left of the dealer) SHALL get one opportunity to pick up (ordinary
game), call Zole, or pass. A picker or Zole-caller becomes the soloist ("big") and the other two
become the allied pair ("small"). (rules §3)

#### Scenario: Pick up assigns soloist
- **WHEN** a player picks up
- **THEN** that player is the soloist and the other two are the pair
- **AND** the state advances to the put-down phase

#### Scenario: Zole skips the stock
- **WHEN** a player calls Zole
- **THEN** that player is the soloist, does not take the stock, and the state advances directly to trick play

### Requirement: Put-down (ordinary game)
After a pick-up the soloist SHALL discard exactly two cards face-down; those two cards SHALL count
toward the soloist's own points at scoring. In a Zole game the two stock cards SHALL instead count
for the pair. (rules §3, §4)

#### Scenario: Discard exactly two
- **WHEN** the soloist has picked up and attempts to discard
- **THEN** the discard is accepted only when it is exactly two cards from the soloist's holding

### Requirement: Galdiņš on all-pass
When all three players pass, the engine SHALL play the hand as galdiņš: no soloist, all three play
to take the fewest tricks. A galdiņš hand SHALL add one branch to the zole tree. (rules §3, §4)

#### Scenario: All pass triggers galdiņš
- **WHEN** every player passes during bidding
- **THEN** the round proceeds to trick play in galdiņš mode with no soloist
- **AND** the zole tree gains one branch

### Requirement: Trick play sequencing
The engine SHALL play 8 tricks per round; each trick collects one card from each player in turn,
enforces follow-suit legality, resolves a winner, and the winner leads next. The round ends when all
hands are empty. (rules §3)

#### Scenario: Round length
- **WHEN** a round is played to completion
- **THEN** exactly 8 tricks were resolved and every hand is empty

### Requirement: Ordinary and Zole scoring
At scoring the engine SHALL compute the soloist's card points and settle per opponent using the
bands: 120 → 3; 91–119 → 2; 61–90 → 1 (soloist wins); 31–60 → 2; 1–30 → 3; 0 → 4 (soloist loses).
The soloist SHALL receive/pay each of the two opponents this amount (net double for the soloist). A
Zole call SHALL add 3 to the per-opponent amount. (rules §4)

#### Scenario: Simple soloist win
- **WHEN** an ordinary soloist finishes with 75 card points
- **THEN** the soloist gains 2 game points total and each opponent loses 1

#### Scenario: Soloist heavy loss
- **WHEN** an ordinary soloist finishes with 20 card points
- **THEN** the soloist loses 6 game points total and each opponent gains 3

#### Scenario: Zole bonus
- **WHEN** a Zole soloist wins with 70 card points
- **THEN** the per-opponent amount is 4 (1 + 3) and the soloist gains 8 game points total

### Requirement: Galdiņš scoring
In galdiņš, game points SHALL change only when a single player has strictly the most tricks: that
player SHALL pay 2 game points to each of the other two. If two or three players tie for the most
tricks, no game points SHALL change that hand. (rules §4)

#### Scenario: Most tricks pays
- **WHEN** a galdiņš hand ends with one player having strictly the most tricks
- **THEN** that player loses 4 game points total and each other player gains 2

#### Scenario: Tie for most tricks pays nothing
- **WHEN** a galdiņš hand ends with two or more players tied for the most tricks
- **THEN** no player's game points change for that hand

### Requirement: Zole tree bonus
The engine SHALL maintain a shared branch counter; a branch is added on each all-pass (galdiņš) hand
and on a 60–60 tie. When a subsequent hand is won by a soloist, the winner SHALL collect an extra 1
game point per branch from each loser, and the branch counter SHALL reset to zero. (rules §4)

#### Scenario: Branches paid out and reset
- **WHEN** the tree has 2 branches and a soloist then wins a hand
- **THEN** the winner collects an extra 2 per opponent for the branches
- **AND** the branch counter is reset to 0 afterward

### Requirement: Purity and determinism
The engine SHALL be a pure function of its inputs: state transitions SHALL return new immutable
state without mutating inputs, and all randomness SHALL come from an injected RNG. The engine SHALL
NOT depend on React, the DOM, timers, I/O, or ambient randomness. (rules §6, CLAUDE.md)

#### Scenario: No input mutation
- **WHEN** a transition function is applied to a game state
- **THEN** the original state object is unchanged and a new state is returned
