## Purpose

Automated decision-making for a Zole player — how a computer opponent bids, discards, and plays
cards. This change delivers the baseline `GreedyPlayer` strategy so complete rounds can be simulated
without a human.

## ADDED Requirements

### Requirement: Legal moves only
An AI player SHALL only ever return moves that the engine considers legal for the current state
(a legal bid during bidding, exactly two held cards during put-down, a follow-suit-legal card during
trick play). (rules §5, §6)

#### Scenario: Play respects follow-suit
- **WHEN** the AI must play to a trick and holds cards of the led category
- **THEN** the card it returns is of the led category

### Requirement: Deterministic decisions
Given the same visible game state and the same injected RNG, an AI player SHALL always return the
same decision. AI logic SHALL be pure and depend only on information a player is allowed to see.
(rules §5, CLAUDE.md)

#### Scenario: Repeatable choice
- **WHEN** the same AI is asked to act twice on identical state with identically seeded RNG
- **THEN** it returns the same decision both times

### Requirement: Bidding strategy
The AI SHALL decide its bid from its hand: call Zole when trumps plus lone non-trump aces total 8;
otherwise pick up when holding 6 or more trumps, or when a hand-strength heuristic on 4–5 trumps is
met; otherwise pass. (rules §5)

#### Scenario: Strong trump hand picks up
- **WHEN** the AI holds 6 trumps at bidding
- **THEN** it chooses to pick up

#### Scenario: Weak hand passes
- **WHEN** the AI holds 2 trumps and no other qualifying strength
- **THEN** it passes

### Requirement: GreedyPlayer discard
As the ordinary-game soloist, the GreedyPlayer SHALL discard two cards using a simple, deterministic
rule that favors banking high card points while retaining trump strength. (rules §5)

#### Scenario: Discards exactly two legal cards
- **WHEN** the GreedyPlayer must put down after a pick-up
- **THEN** it returns exactly two cards from its own holding

### Requirement: GreedyPlayer card play
When playing to a trick, the GreedyPlayer SHALL: play its lowest winning card if it can currently win
the trick; otherwise play its lowest card of the led category if it must follow; otherwise play its
lowest card overall. (rules §5)

#### Scenario: Wins cheaply when able
- **WHEN** the GreedyPlayer can win the current trick
- **THEN** it plays the lowest-ranked card that still wins

#### Scenario: Sheds lowest when it cannot win
- **WHEN** the GreedyPlayer cannot win the current trick and is void in the led category
- **THEN** it plays its lowest-value card
