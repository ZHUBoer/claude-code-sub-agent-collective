#!/bin/bash
# collective-mode.sh
# Toggle collective mode (JIT full behavioral load) for claude-tdd-agents

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${PROJECT_ROOT}/.claude/state"
MODE_FILE="${STATE_DIR}/collective_mode"

print_usage() {
  cat <<EOF
Usage: ./.claude/scripts/collective-mode.sh <enable|disable|status>

Commands:
  enable   Enable collective mode (sets COLLECTIVE_MODE=1 via state file)
  disable  Disable collective mode (minimal JIT load only)
  status   Show current collective mode status

Notes:
  - This toggles a state file used by hooks/load-behavioral-system.sh.
  - You can still temporarily enable via env: COLLECTIVE_MODE=1 claude
EOF
}

ensure_state_dir() {
  mkdir -p "${STATE_DIR}"
}

cmd_enable() {
  ensure_state_dir
  echo "1" > "${MODE_FILE}"
  echo "✅ Collective mode ENABLED (state file written: ${MODE_FILE})"
}

cmd_disable() {
  ensure_state_dir
  echo "0" > "${MODE_FILE}"
  echo "✅ Collective mode DISABLED (state file written: ${MODE_FILE})"
}

cmd_status() {
  if [[ -f "${MODE_FILE}" ]]; then
    mode=$(cat "${MODE_FILE}" | tr -d '\n' | tr -dc '01')
    if [[ "$mode" == "1" ]]; then
      echo "📟 Collective mode: ENABLED (state file=${MODE_FILE})"
    else
      echo "📟 Collective mode: DISABLED (state file=${MODE_FILE})"
    fi
  else
    echo "📟 Collective mode: DISABLED (no state file)"
  fi
}

main() {
  case "$1" in
    enable) cmd_enable ;;
    disable) cmd_disable ;;
    status) cmd_status ;;
    -h|--help|help|"") print_usage ;;
    *) echo "Unknown command: $1" ; print_usage ; exit 1 ;;
  esac
}

main "$@"
