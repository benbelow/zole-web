#!/usr/bin/env bash
# SessionStart nudge: if the feature inbox has unprocessed requests, tell the assistant to drain it.
# Commented-out example items in the inbox are indented, so the anchored pattern won't match them.
set -euo pipefail

file="docs/feature-requests.md"
[ -f "$file" ] || exit 0

# Count unchecked items in "## Inbox" and in-progress markers in "## In Progress" (section-scoped, so
# the intro code-block example and commented/indented examples don't match).
inbox=$(awk '/^## Inbox/{f=1;next} /^## /{f=0} f && /^- \[ \] /{c++} END{print c+0}' "$file")
wip=$(awk '/^## In Progress/{f=1;next} /^## /{f=0} f && /^- \[~\] /{c++} END{print c+0}' "$file")

if [ "${inbox:-0}" -gt 0 ] || [ "${wip:-0}" -gt 0 ]; then
  msg="Feature inbox: docs/feature-requests.md has ${inbox} queued request(s)"
  [ "${wip:-0}" -gt 0 ] && msg="${msg} and ${wip} in-progress marker(s) (a run may reclaim stale ones)"
  echo "${msg}. Run the /process-inbox command to make progress."
fi
exit 0
