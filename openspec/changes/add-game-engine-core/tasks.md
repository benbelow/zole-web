## 1. Cards & ordering (engine)

- [ ] 1.1 Add `cards.ts` with `Suit`/`Rank`/`Card` types, `createDeck()`, and `cardId()`; verify a unit test asserts 26 unique cards including 7♦/8♦ and excluding 7/8 of other suits (spec: Deck composition).
- [ ] 1.2 Add card point values and `deckPointTotal`; verify a test asserts the total is 120 (spec: Card point values).
- [ ] 1.3 Implement `isTrump`, trump/non-trump rank tables, and `compareCards`; verify tests cover trump-beats-non-trump and Q♣ > Q♦ (spec: Trump and suit ordering).

## 2. Trick resolution (engine)

- [ ] 2.1 Implement `ledCategory` and `legalPlays(hand, trick)`; verify tests for must-follow and void-plays-anything (spec: Follow-suit legality).
- [ ] 2.2 Implement `trickWinner(trick)`; verify tests for highest-trump-wins and off-suit-cannot-win (spec: Trick winner).

## 3. RNG & deal (engine)

- [ ] 3.1 Add `rng.ts` with the `Rng` interface and `createRng(seed)`; verify identical seeds produce identical sequences.
- [ ] 3.2 Implement `dealRound(carryOver, rng)` producing a `BiddingState`; verify each player has 8 cards, stock has 2, all 26 accounted for, and equal seeds deal identically (spec: Deal).

## 4. State model & transitions (engine)

- [ ] 4.1 Add `state.ts` with the `GameState` union, `Move` union, and `RoundCarryOver` per design D1; verify it type-checks and states are `readonly`.
- [ ] 4.2 Implement `legalMoves` + `isLegal` for every phase; verify tests enumerate legal bids, discard-exactly-two, and follow-suit-legal plays (specs: Bidding, Put-down, Follow-suit).
- [ ] 4.3 Implement `applyMove` bidding transitions incl. role assignment, Zole (stock → pair), and all-pass → galdiņš with a tree branch added; verify tests for pickup/zole/all-pass (specs: Bidding and roles, Galdiņš on all-pass).
- [ ] 4.4 Implement `applyMove` discard and trick-play transitions (trick fills, resolves winner, leads next, ends after 8 tricks); verify a test plays a scripted full round to `roundEnd` (specs: Put-down, Trick play sequencing).
- [ ] 4.5 Implement `viewFor(state, player)` returning a redacted `PlayerView`; verify a test asserts opponents' hands, stock, and discard are not present (design D3).

## 5. Scoring (engine)

- [ ] 5.1 Implement `scoreRound` for ordinary/Zole bands and per-opponent settlement (net double for soloist); verify worked-number tests for 75-point win, 20-point loss, and the Zole bonus (spec: Ordinary and Zole scoring).
- [ ] 5.2 Implement galdiņš scoring: only a single strictly-most-tricks player pays 2 to each other; any tie at the top pays nothing; verify tests for both the single-loser and tied-no-payment cases (spec: Galdiņš scoring).
- [ ] 5.3 Implement zole-tree accrual/payout/reset and 60–60-tie branch; verify a test that 2 branches pay +2 per opponent on the next soloist win and reset to 0 (spec: Zole tree bonus).
- [ ] 5.4 Wire scoring into the `roundEnd` transition and `RoundCarryOver` (gamePoints, next dealer, branches); verify per-round game-point deltas net to zero across players.

## 6. Public engine surface

- [ ] 6.1 Re-export the public API from `src/engine/index.ts` (types, `dealRound`, `legalMoves`, `isLegal`, `applyMove`, `viewFor`, `scoreRound`); verify `npm run lint` passes (no boundary/purity violations) and no React/DOM references exist in `src/engine`.

## 7. GreedyPlayer (ai)

- [ ] 7.1 Add `src/ai/strategy.ts` with the `Strategy` type over `PlayerView`; verify it compiles and imports only from `engine`.
- [ ] 7.2 Implement `greedyPlayer` bidding (Zole/pickup/pass thresholds); verify tests for 6-trumps→pickup and weak-hand→pass (spec: Bidding strategy).
- [ ] 7.3 Implement `greedyPlayer` discard (two legal cards) and card play (lowest winning / lowest of led / lowest overall); verify tests for wins-cheaply and sheds-lowest (specs: GreedyPlayer discard, GreedyPlayer card play).
- [ ] 7.4 Guarantee legality: every move returned is in `legalMoves`; verify a property test over random views (spec: Legal moves only).

## 8. Integration & verification

- [ ] 8.1 Add a simulation test: play many full games with three `greedyPlayer`s under fixed seeds, asserting per round — all moves legal, exactly 8 tricks, captured points sum to 120, and game-point deltas net to zero (design D7).
- [ ] 8.2 Run `npm run lint`, `npm run test`, and `npm run build`; verify all pass, then run the code-reviewer agent and `.claude/hooks/mark-reviewed.sh`.
