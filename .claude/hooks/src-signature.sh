#!/usr/bin/env bash
# Prints a stable signature of the current state of everything under src/
# (tracked modifications + untracked file contents). Used by the review gate.
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "no-head"
  exit 0
fi
{
  git status --porcelain -- src
  git diff HEAD -- src
  git ls-files --others --exclude-standard -- src | sort | while read -r f; do
    [ -f "$f" ] && shasum "$f"
  done
} 2>/dev/null | shasum | awk '{print $1}'
