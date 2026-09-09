# Zole

A web implementation of the Latvian trick-taking card game **Zole**, built AI-first with React + Vite + TypeScript.

This repo is designed for autonomous AI development with strong guardrails:

- **Spec-driven**: features begin as [OpenSpec](https://github.com/Fission-AI/OpenSpec) change proposals that are reviewed *before* implementation.
- **Task tracking**: work is tracked with [beads](https://github.com/steveyegge/beads) (`bd`).
- **Enforced architecture**: a layered design (`engine` → `ai` → `ui` → `app`) is enforced both by `eslint-plugin-boundaries` and by a dedicated code-review agent.

## Layout

```
src/
  engine/   Pure game logic (rules, deck, tricks, scoring). No React, no DOM, no I/O.
  ai/       AI players. Depends on engine only.
  ui/       React components + hooks. Depends on engine + ai.
  app/      Application wiring / entry point.
docs/       Design docs, incl. the extracted Zole rules (source of truth).
openspec/   Change proposals & specs.
archive/    Original Java implementation (reference only — do not import).
```

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run test` | Run the Vitest test suite |
| `npm run lint` | Lint, including architectural-boundary checks |
| `npm run format` | Format with Prettier |

See `CLAUDE.md` for the ground rules that govern how AI agents work in this repo.
