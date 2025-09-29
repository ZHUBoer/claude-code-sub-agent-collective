#!/usr/bin/env bash
set -euo pipefail
[ -d .git ] || exit 0
LOCKFILE="/tmp/claude_squash_lock_$$"
if ! [ -f "$LOCKFILE" ]; then
  trap 'rm -f "$LOCKFILE"' EXIT
  touch "$LOCKFILE"
  # Avoid SIGPIPE by using git's own limiting (-n) instead of head
  CHECKPOINT_COUNT=$(git log --oneline --grep="^checkpoint:" -n 20 | wc -l | tr -d ' ')
  if [ "$CHECKPOINT_COUNT" -gt 1 ]; then
    # Limit inside git to prevent upstream SIGPIPE
    CHANGES=$(git log --oneline --grep="^checkpoint:" -n 10 | cut -d' ' -f2- | paste -sd ';' -)
    # If 'claude' CLI isn't available, fallback to default message. Use awk to avoid SIGPIPE
    if command -v claude >/dev/null 2>&1; then
      MSG=$(claude -p "请基于以下多条 checkpoint 生成一条中文的 conventional commit 提交信息：
1) 标题格式：'type(scope): 简短描述'（中文描述）；
2) 正文使用要点列表（- 开头），概括主要改动；
3) 专业、简洁；
4) 严格避免英文冗长描述。
checkpoint 汇总：$CHANGES" 2>/dev/null | awk 'NR<=5')
    fi
    MSG=${MSG:-"feat: 汇总多条 checkpoint 变更"}
    # Oldest checkpoint commit (avoid tail which can induce SIGPIPE)
    FIRST_CHECKPOINT=$(git log --grep="^checkpoint:" --format="%H" --reverse -n 1)
    if [ -n "$FIRST_CHECKPOINT" ]; then
      # Only reset if parent exists (skip when checkpoint is the first commit)
      if git rev-parse "$FIRST_CHECKPOINT~1" >/dev/null 2>&1; then
        git reset --soft "$FIRST_CHECKPOINT~1"
        git commit -m "$MSG" 2>/dev/null || true
      fi
    fi
  fi
fi
