#!/usr/bin/env bash
# SessionStart nudge: if the feature inbox has unprocessed requests, tell the assistant to drain it.
# Commented-out example items in the inbox are indented, so the anchored pattern won't match them.
set -euo pipefail

file="docs/feature-requests.md"
[ -f "$file" ] || exit 0

count=$(grep -cE '^- \[ \] ' "$file" || true)
if [ "${count:-0}" -gt 0 ]; then
  echo "Feature inbox: docs/feature-requests.md has ${count} unprocessed request(s). Run the /process-inbox command now to handle the oldest one."
fi
exit 0
