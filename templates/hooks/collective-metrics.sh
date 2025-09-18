#!/bin/bash
# collective-metrics.sh
# Phase 3 - Hook Integration System
# Collects performance metrics and coordination statistics for research validation

# 解析项目根目录（优先使用环境变量，其次根据脚本位置反推，最后使用保底默认）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT_FROM_SCRIPT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"$PROJECT_ROOT_FROM_SCRIPT"}

# Set up metrics storage
METRICS_DIR="$PROJECT_DIR/.claude-collective/metrics"
METRICS_FILE="$METRICS_DIR/metrics-$(date +%Y%m%d).json"
LOG_FILE="$METRICS_DIR/collective-metrics.log"

mkdir -p "$METRICS_DIR"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
# 兼容 macOS（BSD date 无 %N）与 Linux 的毫秒时间戳
epoch_ms() {
    # 优先 GNU date（coreutils 的 gdate）
    if command -v gdate >/dev/null 2>&1; then
        local ts
        ts="$(gdate +%s%3N 2>/dev/null | tr -cd '0-9')"
        if printf '%s' "$ts" | grep -Eq '^[0-9]+$'; then
            echo "$ts"
            return
        fi
    fi
    # 回退到 Python3（最可靠）
    if command -v python3 >/dev/null 2>&1; then
        python3 - <<'PY'
import time, sys
sys.stdout.write(str(int(time.time()*1000)))
PY
        return
    fi
    # BSD date 清洗非数字字符（防止 %N 输出字母）
    local ts
    ts="$(date +%s%3N 2>/dev/null | tr -cd '0-9')"
    if printf '%s' "$ts" | grep -Eq '^[0-9]+$'; then
        echo "$ts"
        return
    fi
    # 最终回退：秒 * 1000（纯数字）
    echo $(( $(date +%s) * 1000 ))
}

log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# 初始化上下文：优先读取环境变量；如缺失则从标准输入 JSON 中解析
EVENT=${EVENT:-""}
TOOL_NAME=${TOOL_NAME:-""}
SUBAGENT_NAME=${SUBAGENT_NAME:-""}
USER_PROMPT=${USER_PROMPT:-""}
EXECUTION_TIME_MS=${EXECUTION_TIME_MS:-0}
CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"$PROJECT_DIR"}

# 尝试读取 JSON 输入（与 test-driven-handoff/handoff-automation 保持一致的模式）
INPUT_JSON="$(cat 2>/dev/null)"

if command -v jq >/dev/null 2>&1; then
    # 如果环境变量为空，则回退到从 JSON 提取
    if [[ -z "$EVENT" || "$EVENT" == "null" ]]; then
        EVENT=$(echo "$INPUT_JSON" | jq -r '.hook_event_name // .event // .type // ""' 2>/dev/null)
    fi
    if [[ -z "$TOOL_NAME" || "$TOOL_NAME" == "null" ]]; then
        TOOL_NAME=$(echo "$INPUT_JSON" | jq -r '.tool_name // .tool // ""' 2>/dev/null)
    fi
    if [[ -z "$SUBAGENT_NAME" || "$SUBAGENT_NAME" == "null" ]]; then
        SUBAGENT_NAME=$(echo "$INPUT_JSON" | jq -r '.tool_input.subagent_type // .subagent // .agent // .agent_name // ""' 2>/dev/null)
    fi
    if [[ -z "$USER_PROMPT" || "$USER_PROMPT" == "null" ]]; then
        USER_PROMPT=$(echo "$INPUT_JSON" | jq -r '.user_prompt // .prompt // .input // ""' 2>/dev/null)
    fi
    if [[ -z "$EXECUTION_TIME_MS" || "$EXECUTION_TIME_MS" == "null" || "$EXECUTION_TIME_MS" == "0" ]]; then
        EXECUTION_TIME_MS=$(echo "$INPUT_JSON" | jq -r '.execution_time_ms // .executionTime // .duration_ms // 0' 2>/dev/null)
        EXECUTION_TIME_MS=${EXECUTION_TIME_MS:-0}
    fi
    # 提取常见的 tool_input 关键信息，便于定位
    TOOL_INPUT_KEYS=$(echo "$INPUT_JSON" | jq -r '.tool_input | if type=="object" then (keys|join(",")) else "" end' 2>/dev/null)
    TOOL_INPUT_TARGET=$(echo "$INPUT_JSON" | jq -r '.tool_input.path // .tool_input.pattern // .tool_input.file // ""' 2>/dev/null)
else
    # 无 jq 时的简单回退（尽量不阻塞，不保证健壮性）
    if [[ -z "$EVENT" ]]; then
        EVENT=$(echo "$INPUT_JSON" | grep -o '"hook_event_name":"[^"]*"' | cut -d '"' -f4)
    fi
    if [[ -z "$TOOL_NAME" ]]; then
        TOOL_NAME=$(echo "$INPUT_JSON" | grep -o '"tool_name":"[^"]*"' | cut -d '"' -f4)
    fi
    if [[ -z "$SUBAGENT_NAME" ]]; then
        SUBAGENT_NAME=$(echo "$INPUT_JSON" | grep -o '"subagent_type":"[^"]*"' | cut -d '"' -f4)
    fi
fi

# 构建紧凑上下文，避免空字段占位
CONTEXT_PARTS=()
[[ -n "$EVENT" ]] && CONTEXT_PARTS+=("Event: $EVENT")
[[ -n "$TOOL_NAME" ]] && CONTEXT_PARTS+=("Tool: $TOOL_NAME")
[[ -n "$SUBAGENT_NAME" ]] && CONTEXT_PARTS+=("Agent: $SUBAGENT_NAME")
CONTEXT="$(IFS=", "; echo "${CONTEXT_PARTS[*]}")"

if [[ -n "$CONTEXT" ]]; then
    log "METRICS COLLECTION TRIGGERED - ${CONTEXT}"
else
    log "METRICS COLLECTION TRIGGERED"
fi

# 可选：记录典型工具的目标参数（如 Read/Glob 的 path/pattern）
if [[ -n "$TOOL_INPUT_TARGET" ]]; then
    log "Target: $TOOL_INPUT_TARGET"
fi

# Initialize metrics file if it doesn't exist
initialize_metrics_file() {
    if [[ ! -f "$METRICS_FILE" ]]; then
        cat > "$METRICS_FILE" << 'EOF'
{
  "date": "",
  "research_metrics": {
    "jit_hypothesis": {
      "context_load_times": [],
      "memory_usage": [],
      "agent_spawn_times": []
    },
    "hub_spoke_hypothesis": {
      "routing_accuracy": [],
      "coordination_overhead": [],
      "peer_communication_violations": 0
    },
    "tdd_hypothesis": {
      "handoff_success_rate": [],
      "integration_defects": [],
      "test_coverage": []
    }
  },
  "performance_metrics": {
    "tool_executions": [],
    "agent_handoffs": [],
    "directive_violations": [],
    "quality_gates": []
  },
  "system_health": {
    "uptime": 0,
    "error_rate": 0,
    "response_times": []
  }
}
EOF
        # Set the date
        jq --arg date "$(date -I)" '.date = $date' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        log "Initialized metrics file: $METRICS_FILE"
    fi
}

# Collect JIT (Just-in-Time) Context Loading metrics
collect_jit_metrics() {
    local start_time="$1"
    local context_size="$2"
    
    if [[ "$EVENT" == "PreToolUse" ]]; then
        # Record context load time
        local load_time=$(($(epoch_ms) - start_time))
        
        jq --argjson load_time "$load_time" \
           --argjson context_size "${context_size:-0}" \
           '.research_metrics.jit_hypothesis.context_load_times += [{
             "timestamp": now,
             "load_time_ms": $load_time,
             "context_size": $context_size,
             "tool": "'$TOOL_NAME'"
           }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "JIT Metrics: Context load time: ${load_time}ms, Size: $context_size"
    fi
}

# Collect Hub-Spoke Coordination metrics
collect_hub_spoke_metrics() {
    local routing_decision="$1"
    local coordination_start="$2"
    
    if [[ "$EVENT" == "SubagentStop" ]]; then
        # Calculate coordination overhead
        local coordination_time=$(($(epoch_ms) - coordination_start))
        
        # Determine routing accuracy (simplified heuristic)
        local accuracy=1
        if echo "$USER_PROMPT" | grep -qi "error\|fail\|retry"; then
            accuracy=0
        fi
        
        jq --argjson accuracy "$accuracy" \
           --argjson coord_time "$coordination_time" \
           '.research_metrics.hub_spoke_hypothesis.routing_accuracy += [$accuracy] |
            .research_metrics.hub_spoke_hypothesis.coordination_overhead += [{
              "timestamp": now,
              "coordination_time_ms": $coord_time,
              "agent": "'$SUBAGENT_NAME'"
            }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "Hub-Spoke Metrics: Accuracy: $accuracy, Coordination time: ${coordination_time}ms"
    fi
    
    # Check for peer-to-peer communication violations
    if echo "$USER_PROMPT" | grep -qi -E "@[a-z-]*agent.*@[a-z-]*agent"; then
        jq '.research_metrics.hub_spoke_hypothesis.peer_communication_violations += 1' \
           "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        log "Hub-Spoke Violation: Peer-to-peer communication detected"
    fi
}

# Collect Test-Driven Development metrics
collect_tdd_metrics() {
    local handoff_quality="$1"
    local test_coverage="$2"
    
    if [[ "$EVENT" == "SubagentStop" ]]; then
        # Assess handoff success (simplified scoring)
        local handoff_success=1
        if echo "$USER_PROMPT" | grep -qi -E "error\|fail\|incomplete\|retry"; then
            handoff_success=0
        fi
        
        # Check for test mentions
        local has_tests=0
        if echo "$USER_PROMPT" | grep -qi -E "test\|spec\|coverage\|validate"; then
            has_tests=1
        fi
        
        jq --argjson success "$handoff_success" \
           --argjson has_tests "$has_tests" \
           --argjson coverage "${test_coverage:-0}" \
           '.research_metrics.tdd_hypothesis.handoff_success_rate += [$success] |
            .research_metrics.tdd_hypothesis.test_coverage += [{
              "timestamp": now,
              "coverage": $coverage,
              "has_tests": $has_tests,
              "agent": "'$SUBAGENT_NAME'"
            }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "TDD Metrics: Handoff success: $handoff_success, Has tests: $has_tests, Coverage: $test_coverage"
    fi
}

# Collect performance metrics
collect_performance_metrics() {
    local execution_start=$(epoch_ms)
    
    # Record tool execution
    if [[ -n "$TOOL_NAME" ]]; then
        jq --arg tool "$TOOL_NAME" \
           --argjson exec_time "${EXECUTION_TIME_MS:-0}" \
           '.performance_metrics.tool_executions += [{
             "timestamp": now,
             "tool": $tool,
             "execution_time_ms": $exec_time,
             "event": "'$EVENT'"
           }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "Performance: Tool $TOOL_NAME executed in ${EXECUTION_TIME_MS}ms"
    fi
    
    # Record agent handoffs
    if [[ "$EVENT" == "SubagentStop" && -n "$SUBAGENT_NAME" ]]; then
        jq --arg agent "$SUBAGENT_NAME" \
           '.performance_metrics.agent_handoffs += [{
             "timestamp": now,
             "agent": $agent,
             "event": "'$EVENT'"
           }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "Performance: Agent handoff recorded for $SUBAGENT_NAME"
    fi
}

# Collect system health metrics
collect_system_health() {
    # Update response times
    if [[ "$EXECUTION_TIME_MS" -gt 0 ]]; then
        jq --argjson response_time "$EXECUTION_TIME_MS" \
           '.system_health.response_times += [$response_time]' \
           "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
    fi
    
    # Calculate error rate (simplified)
    local is_error=0
    if echo "$USER_PROMPT" | grep -qi -E "error\|fail\|exception"; then
        is_error=1
    fi
    
    if [[ "$is_error" == "1" ]]; then
        jq '.system_health.error_rate += 1' \
           "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        log "System Health: Error detected and recorded"
    fi
}

# Generate metrics summary
generate_summary() {
    if [[ ! -f "$METRICS_FILE" ]]; then
        return 0
    fi
    
    local summary_file="$METRICS_DIR/summary-$(date +%Y%m%d).txt"
    
    cat > "$summary_file" << EOF
# Collective Metrics Summary - $(date)

## Research Hypothesis Validation

### JIT Hypothesis
- Context load times collected: $(jq '.research_metrics.jit_hypothesis.context_load_times | length' "$METRICS_FILE")
- Average load time: $(jq '[.research_metrics.jit_hypothesis.context_load_times[].load_time_ms] | add / length' "$METRICS_FILE" 2>/dev/null || echo "N/A")ms

### Hub-Spoke Hypothesis  
- Routing accuracy: $(jq '[.research_metrics.hub_spoke_hypothesis.routing_accuracy] | add / length * 100' "$METRICS_FILE" 2>/dev/null || echo "N/A")%
- Peer communication violations: $(jq '.research_metrics.hub_spoke_hypothesis.peer_communication_violations' "$METRICS_FILE")

### TDD Hypothesis
- Handoff success rate: $(jq '[.research_metrics.tdd_hypothesis.handoff_success_rate] | add / length * 100' "$METRICS_FILE" 2>/dev/null || echo "N/A")%
- Test coverage events: $(jq '.research_metrics.tdd_hypothesis.test_coverage | length' "$METRICS_FILE")

## Performance Metrics
- Tool executions: $(jq '.performance_metrics.tool_executions | length' "$METRICS_FILE")
- Agent handoffs: $(jq '.performance_metrics.agent_handoffs | length' "$METRICS_FILE")
- Average response time: $(jq '[.system_health.response_times] | add / length' "$METRICS_FILE" 2>/dev/null || echo "N/A")ms

EOF
    
    log "Generated metrics summary: $summary_file"
}

# Main collection logic
main() {
    local start_time=$(epoch_ms)
    
    log "Starting metrics collection for event: $EVENT"
    
    # Initialize metrics file
    initialize_metrics_file
    
    # Collect metrics based on event type
    case "$EVENT" in
        "PreToolUse")
            collect_jit_metrics "$start_time" "$(echo "$USER_PROMPT" | wc -c)"
            collect_performance_metrics
            ;;
        "PostToolUse")
            collect_performance_metrics
            collect_system_health
            ;;
        "SubagentStop")
            collect_hub_spoke_metrics "routing" "$start_time"
            collect_tdd_metrics "quality" "0"
            collect_performance_metrics
            ;;
        *)
            collect_performance_metrics
            ;;
    esac
    
    # Generate summary periodically (every 10th execution)
    local execution_count=$(jq '.performance_metrics.tool_executions | length' "$METRICS_FILE" 2>/dev/null || echo "0")
    if [[ $((execution_count % 10)) -eq 0 && $execution_count -gt 0 ]]; then
        generate_summary
    fi
    
    log "Metrics collection completed for event: $EVENT"
    return 0
}

# Execute main function
main "$@"