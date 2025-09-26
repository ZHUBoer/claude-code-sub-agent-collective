#!/usr/bin/env bash
set -euo pipefail
[ -d .git ] || exit 0
CUR=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [ "$CUR" = "HEAD" ] || [ -z "$CUR" ]; then exit 0; fi
TASK_BRANCH_PREFIX="${AI_TASK_BRANCH_PREFIX:-ai}"
SAFE_CUR=$(echo "$CUR" | sed 's#[^a-zA-Z0-9._/-]#-#g')
if ! git rev-parse --verify "$SAFE_CUR" >/dev/null 2>&1; then exit 0; fi
if [[ "$SAFE_CUR" =~ ^(main|master|develop)$ ]]; then
  NEW="${TASK_BRANCH_PREFIX}/$(date +%Y%m%d-%H%M%S)"
  git checkout -b "$NEW" || true
fi
