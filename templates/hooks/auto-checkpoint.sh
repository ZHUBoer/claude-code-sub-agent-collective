#!/usr/bin/env bash
set -euo pipefail
[ -d .git ] || exit 0
[ -n "${CLAUDE_AUTO_COMMIT:-1}" ] || exit 0
if [ -n "$(git status --porcelain)" ]; then
  LOCKFILE="/tmp/claude_hooks_lock_$$"
  if ! [ -f "$LOCKFILE" ]; then
    trap 'rm -f "$LOCKFILE"' EXIT
    touch "$LOCKFILE"
    DIFF=$(git diff --name-only --diff-filter=M | head -10 | tr '\n' ' ')
    if [ -n "$DIFF" ]; then
      MSG=$(claude -p "请为以下变更生成简洁中文提交信息，格式固定：'checkpoint: [做了什么] - [HH:MM]'。要求：
1) 用中文描述主要改动内容；
2) 保持以 checkpoint: 开头；
3) 不超过 80 字。
文件：$DIFF
差异：$(git diff --no-color | head -50)" 2>/dev/null | head -1 | sed 's/^[^:]*:/checkpoint:/' || echo "checkpoint: 更新 $DIFF - $(date +%H:%M)")
      git add -A
      git commit -m "$MSG" 2>/dev/null || true
    fi
  fi
fi
