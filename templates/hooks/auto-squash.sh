#!/usr/bin/env bash
set -euo pipefail
[ -d .git ] || exit 0
LOCKFILE="/tmp/claude_squash_lock_$$"
if ! [ -f "$LOCKFILE" ]; then
  trap 'rm -f "$LOCKFILE"' EXIT
  touch "$LOCKFILE"
  CHECKPOINT_COUNT=$(git log --oneline --grep="^checkpoint:" | head -20 | wc -l | tr -d ' ')
  if [ "$CHECKPOINT_COUNT" -gt 1 ]; then
    CHANGES=$(git log --oneline --grep="^checkpoint:" | head -10 | cut -d' ' -f2- | paste -sd ';' -)
    MSG=$(claude -p "请基于以下多条 checkpoint 生成一条中文的 conventional commit 提交信息：
1) 标题格式：'type(scope): 简短描述'（中文描述）；
2) 正文使用要点列表（- 开头），概括主要改动；
3) 专业、简洁；
4) 严格避免英文冗长描述。
checkpoint 汇总：$CHANGES" 2>/dev/null | head -5 || echo "feat: 汇总多条 checkpoint 变更")
    FIRST_CHECKPOINT=$(git log --grep="^checkpoint:" --format="%H" | tail -1)
    if [ -n "$FIRST_CHECKPOINT" ]; then
      git reset --soft "$FIRST_CHECKPOINT~1"
      git commit -m "$MSG" 2>/dev/null || true
    fi
  fi
fi
