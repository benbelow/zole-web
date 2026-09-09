# Zole — Rules & AI Reference

The authoritative specification for the game logic, reverse-engineered from the original
Java implementation in `archive/Java Card Games/src/zole/`. The engine (`src/engine`) and AI
(`src/ai`) must conform to this document. Where this document and the archive disagree, this
document wins — but discrepancies should be raised in an OpenSpec change before diverging.

> Zole is a 3-player Latvian trick-taking game descended from Schafkopf.

## 1. Deck (26 cards)

- **Diamonds** — the full run **7, 8, 9, 10, J, Q, K, A** (8 cards; all are trumps).
- **Clubs, Spades, Hearts** — only **9, 10, K, A** plus their **Q** and **J** (6 cards each = 18).
  There are **no 7s or 8s** in these three suits.

Total = **26 cards**: 14 trumps (all 8 diamonds + the 3 non-diamond Queens + the 3 non-diamond
Jacks) and 12 non-trump cards (A, 10, K, 9 in each of ♣ ♠ ♥). This matches the deal of 3×8 = 24
to players plus 2 to the stock.

**Card point values** (total 120 points in the deck):

| Rank | Points |
| --- | --- |
| Ace | 11 |
| Ten | 10 |
| King | 4 |
| Queen | 3 |
| Jack | 2 |
| 9, 8, 7 | 0 |

## 2. Trumps & card ordering

**Trumps** (in every round) are, from highest to lowest:

```
Q♣ > Q♠ > Q♥ > Q♦ > J♣ > J♠ > J♥ > J♦ > A♦ > 10♦ > K♦ > 9♦ > 8♦ > 7♦
```

That is: **all Queens**, then **all Jacks**, then **the diamond suit** by rank (A,10,K,9,8,7).
So there are 14 trumps total.

**Non-trump suits** are ♣, ♠, ♥ (the remaining 12 cards). Within a led non-trump suit the rank
order is **A > 10 > K > 9** (these suits have no 7 or 8).

### Trick resolution
- The first card played sets the **lead suit** (its "zole-suit": TRUMPS or one of ♣/♠/♥).
- A trump always beats any non-trump.
- Among cards of the lead category, the highest-ranked (per the orders above) wins.
- Cards that are neither trump nor of the lead suit cannot win.

## 3. Round flow (state machine)

```
deal → choosing → ┬─ [putting-down] ─→ playing → scoring → reset → (next round)
                  └─ (all pass) ─────→ playing (galdiņš) → scoring → reset
```

**Deal**: 8 cards to each of 3 players + 2 cards face-down to the **stock** (the "talon"/table).
The turn to deal passes to the left after each hand; the player to the **dealer's left** bids
first. (The archive computes the first bidder as `(roundNumber + 2) % 3`.)

**Choosing (bidding)**: offered to each player once, in turn. Each may:
- **Pick up** (ordinary game) → takes the 2 talon cards, becomes the soloist ("big"); proceeds
  to *putting-down*.
- **Call Zole** (solo) → becomes soloist but does **not** take the talon; the 2 talon cards are
  set aside and count for the **opponents' (small)** points at scoring. Goes straight to
  *playing*. Scores a bonus (see §4).
- **Pass**. If **all three pass**, the hand is played as **galdiņš** ("the table") — there is no
  soloist; everyone plays to take the *fewest tricks* (see §4). A pass-out also adds a branch to
  the **zole tree** (§4).

**Putting-down** (ordinary game only): the soloist discards exactly 2 cards face-down. Those 2
cards count toward the **soloist's own** point total at scoring (private).

**Roles**: in an ordinary/Zole game the picker/caller is the **soloist ("big")**; the other two
are the **allied pair ("small")** who play cooperatively against the soloist. In galdiņš all
three play for themselves.

**Playing**: 8 tricks. Players must **follow the lead category** (trump or the led suit) if able;
otherwise may play any card. There is **no obligation to head/overtrump** the trick. The trick
winner leads the next trick.

## 4. Scoring

### 4a. Ordinary game & Zole

Let `bigScore` = card points won by the soloist. For an **ordinary game** that includes the
soloist's 2 face-down discards; for a **Zole** call the 2 talon cards instead count for the
**small** side, so `bigScore` is just the soloist's trick points. The pair's points are
`120 - bigScore`. The soloist needs **> 60** to win.

Base amount settled **per opponent** (`toScore`) — the archive's table, which matches the
canonical Pagat/catsatcards schedule:

| Condition | toScore | Meaning |
| --- | --- | --- |
| `bigScore == 120` | 3 | soloist took everything |
| `91 ≤ bigScore ≤ 119` | 2 | soloist won with ≥ 91 |
| `61 ≤ bigScore ≤ 90` | 1 | simple soloist win |
| `31 ≤ bigScore ≤ 60` | 2 | soloist lost (pair 60–89) |
| `1 ≤ bigScore ≤ 30` | 3 | soloist lost badly |
| `bigScore == 0` | 4 | soloist took no card points |

> Canonical rulesets split the bottom two bands by *tricks* (≥1 trick vs. no tricks); the archive
> keys on card points. We follow the archive (points) unless a later change decides otherwise.

Modifiers to `toScore`:
- **Zole called**: `+3`. (Pagat lists `+4`; the archive and catsatcards use `+3` — we use `+3`.)
- **Zole tree**: `+1 per branch currently on the tree` (see §4c).

**Settlement** (per opponent; soloist faces two opponents so nets double):
- If the **soloist won**: each of the 2 opponents `-toScore`; soloist `+2 * toScore`.
- If the **soloist lost**: each of the 2 opponents `+toScore`; soloist `-2 * toScore`.

When the soloist **wins**, any branches on the zole tree are consumed (§4c).

### 4b. Galdiņš ("the table" — all passed)

No soloist. All three play to take the **fewest tricks**. The player who takes the **most tricks**
pays **2 per opponent** (i.e. `+2` to each of the other two). A galdiņš hand also **adds a branch**
to the zole tree and does not itself consume branches.

> _Open edge cases to decide during engine design:_ how ties for "most tricks" are settled, and
> whether a variant scores by card points rather than tricks.

### 4c. Zole tree (pass-out / tie bonus)

A shared counter of "branches". A branch is added whenever **everyone passes** (galdiņš) or a hand
ends **tied 60–60** (no score that hand). When a subsequent hand is **won by a soloist**, that
winner collects an **extra `+1` per branch** from each loser, and the tree **resets to 0**. (The
archive models this as a single decrementing `+1`; the canonical rule pays all branches at once,
which is what we implement.)

### 4d. Mazā zole (small zole) — OUT OF SCOPE for v1

A known variant (soloist undertakes to lose *every* trick; no talon; `+6` per opponent if
successful, `-7` if any trick is won). Documented for completeness but **not implemented in v1**.

## 5. AI player

Two strategies exist in the archive; both are **deterministic heuristics — no minimax/lookahead
and no randomness**.

### Bidding (shared)
Let `trumps` = number of trumps in hand, `singleAces` = non-trump aces that are the only card of
their suit.
- `trumps + singleAces == 8` → **call Zole**.
- `trumps >= 6` → **pick up**.
- Otherwise compute `value = 3*(#queens) + 2*(#jacks) + 1*(#trump A or 10)` and:
  - `trumps == 4 && singleAces > 1 && value > 8` → pick up
  - `trumps == 5 && (value > 9 || (singleAces >= 1 && value >= 9))` → pick up
  - else → **pass**.

### Discard (soloist, put-down)
Heuristic elimination aiming to void suits and bank high card points privately: prefer voiding
single-card suits and discarding the highest-value 2-card combination among non-trumps; never
discard trump strength unless holding 8+ trumps.

### Play — `AIPlayer` (full)
Six handlers keyed by seat order (1st/2nd/3rd to act) × role (big/small). Themes:
- Lead single aces early (gather information / cash points before they're trumped).
- As soloist: win cheaply, avoid dumping points into tricks you'll lose, force out opponents' trumps.
- As pair: cooperate — help the partner win valuable tricks, only overtake when the partner can't win,
  and coordinate suit voiding. Track `outOfTrumps`, highest trump still out, and which point-trumps are gone.
- Contribute high points only when your side is winning the trick; otherwise discard low.

### Play — `GreedyPlayer` (baseline)
1. If it can win the trick, play the **lowest** winning card.
2. Else if it can follow suit, play the **lowest** card of the lead suit.
3. Else play the **lowest** card overall.

`GreedyPlayer` is a good first target for the TS engine (simple, testable); `AIPlayer` is the
stretch goal.

> **Gap:** the archive redeals when all pass, so it has **no galdiņš strategy**. Since galdiņš is
> now in scope, the AI needs a new "minimise tricks" heuristic for it (roughly an inverted
> `GreedyPlayer`: shed high cards, avoid winning tricks). To be designed in the AI OpenSpec change.

## 6. Engine API surface (informative)

The Java `PlayerInterface` is `{ choose(); putdown(); playRound(); }` driven by a `Game` state
machine. The TS engine should expose game logic as **pure functions / reducers over an immutable
`GameState`** (see the engine architecture OpenSpec proposal) rather than mutable singletons —
this is the main intentional deviation from the archive.

## Sources

- Original Java implementation: `archive/Java Card Games/src/zole/`
- Pagat — Rules of Card Games: Zole — https://www.pagat.com/schafkopf/zole.html
- catsatcards — How To Play the Card Game Zole — https://www.catsatcards.com/Games/Zole.html
- Wikipedia — Zole — https://en.wikipedia.org/wiki/Zole
