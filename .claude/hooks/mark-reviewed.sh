#!/usr/bin/env bash
# Record that the current state of src/ has been reviewed by the code-reviewer agent.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
"$HERE/src-signature.sh" >.claude/.last-reviewed
echo "Review baseline recorded: $(cat .claude/.last-reviewed)"
