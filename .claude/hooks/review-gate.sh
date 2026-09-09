#!/usr/bin/env bash
# Stop hook: block finishing while there are unreviewed changes under src/.
# Escape hatch: run .claude/hooks/mark-reviewed.sh after the code-reviewer agent has run.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# Not a git repo yet / no commits -> nothing to gate.
git rev-parse HEAD >/dev/null 2>&1 || exit 0

# No changes under src/ -> allow.
CHANGES="$(git status --porcelain -- src 2>/dev/null || true)"
[ -z "$CHANGES" ] && exit 0

SIG="$("$HERE/src-signature.sh")"
LAST=""
[ -f .claude/.last-reviewed ] && LAST="$(cat .claude/.last-reviewed)"
[ "$SIG" = "$LAST" ] && exit 0

# Unreviewed changes: block and instruct.
cat <<'JSON'
{"decision":"block","reason":"Unreviewed changes under src/ were detected. Before you finish: launch the code-reviewer subagent (Agent tool with subagent_type: code-reviewer) to review the current diff, fix any blocking findings, then run `.claude/hooks/mark-reviewed.sh` to record the review. Only stop once that is done. If you are mid-task and not ready for review, that's fine — continue working."}
JSON
exit 0
