# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->


---

# Zole — Project Ground Rules

Zole is a web implementation of the Latvian card game **Zole** (React + Vite + TypeScript),
developed AI-first. The canonical game rules live in **`docs/zole-rules.md`** — treat that file
as the source of truth for all game logic and cite it in specs.

## Git & autonomy (IMPORTANT — overrides the beads section above)

- This repo is **local-only: there is no git remote.** Do **NOT** run `git push` (it will fail),
  and ignore the "MANDATORY push" workflow in the beads block above.
- **Commit per suitably atomic change.** You are trusted to `git commit` without asking each time:
  after each self-contained, working unit of work (a module + its tests, a bug fix, a doc update),
  make a focused commit. Keep commits atomic — one logical change each — with clear Conventional
  Commit messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`). Do **not** bundle
  unrelated changes into one commit, and prefer committing green (tests/lint passing) code.
- Do not `git push` (local-only) and do not rewrite published history.
- You are trusted to run all non-destructive dev commands (build, test, lint, format, `bd`,
  `openspec`, file edits) without asking. Still confirm before destructive/irreversible actions
  (`rm -rf`, history rewrites, deleting files you didn't create).

## Architecture: strict layering

Dependencies flow **one direction only**. This is enforced mechanically by
`eslint-plugin-boundaries` (see `eslint.config.js`) and reviewed by the code-review agent.

```
engine  →  (nothing else)      Pure game logic: deck, tricks, scoring, state machine.
ai      →  engine              AI players / decision heuristics.
ui      →  ai, engine          React components & hooks.
app     →  ui, ai, engine      Entry point / wiring.
```

Rules:
- **`src/engine` and `src/ai` must be pure**: no React, no DOM, no timers, no I/O, no randomness
  except via an injected RNG. They must run in plain Node with no browser globals.
- Never import "upward" (e.g. engine importing from ui) or sideways across siblings.
- The `archive/` Java code is **reference only** — never import or copy it wholesale; re-derive
  logic in idiomatic TypeScript against `docs/zole-rules.md`.

## Spec-driven workflow (architecture is reviewed BEFORE code)

Every non-trivial feature follows this gate:

1. **Propose** — create an OpenSpec change (`/opsx:propose "…"` or the `architect` agent). It
   contains the spec deltas + a design/architecture section.
2. **Human review** — the user reviews and approves the proposal. **Do not write implementation
   code until the change is approved.**
3. **Implement** — build against the approved spec; track the work in `bd`.
4. **Review** — the `code-reviewer` agent reviews the diff (enforced by the Stop hook).
5. **Archive** — once merged & verified, archive the change (`/opsx:archive`).

## Task tracking

Use **beads (`bd`)** for all task tracking (not TodoWrite / markdown TODOs), as described above.
Link issues to the OpenSpec change they implement.

## Code review gate

All code changes must be reviewed by the separate **`code-reviewer`** agent before they are
considered done — focus areas are architectural-boundary integrity, correctness vs.
`docs/zole-rules.md`, and code quality. A **Stop hook** blocks completion while there are
unreviewed source changes; run the reviewer, address findings, then mark reviewed.

## Coding conventions

- **TypeScript strict** everywhere (see `tsconfig.app.json`). No `any`; prefer precise types and
  discriminated unions for game state.
- **Immutable state**: model game state as plain data transformed by **pure reducer-style
  functions** returning new state — not mutable classes/singletons (the main deliberate deviation
  from the Java archive).
- **Determinism**: any randomness (shuffling) goes through an injected seedable RNG so games are
  reproducible and testable.
- **Tests**: colocate `*.test.ts(x)` next to source; the engine/AI must have high unit coverage.
  Use Vitest + Testing Library.
- Formatting/linting are automated (Prettier + ESLint); keep `npm run lint` clean.

## Build & test

```bash
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm run test     # Vitest (run once)
npm run lint     # ESLint incl. architectural-boundary checks
npm run format   # Prettier
```
