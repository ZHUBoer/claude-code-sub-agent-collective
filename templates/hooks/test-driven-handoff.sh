#!/bin/bash
# test-driven-handoff.sh
# TRUE Test-Driven Handoffs with Contract Validation
# Executes actual test contracts to validate agent handoffs

# Set up logging
LOG_FILE="/tmp/test-driven-handoff.log"
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# Read JSON input from stdin and clean up only problematic escapes (keep valid JSON escapes)
INPUT_JSON=$(cat | sed 's/\\!/!/g')

# Parse JSON using simpler, more robust extraction
EVENT=""
SUBAGENT_NAME=""
TRANSCRIPT_PATH=""

# Try direct jq extraction first
if command -v jq >/dev/null 2>&1; then
    EVENT=$(echo "$INPUT_JSON" | jq -r '.hook_event_name' 2>/dev/null)
    SUBAGENT_NAME=$(echo "$INPUT_JSON" | jq -r '.tool_input.subagent_type' 2>/dev/null)
    TRANSCRIPT_PATH=$(echo "$INPUT_JSON" | jq -r '.transcript_path' 2>/dev/null)
fi

# Fallback to grep/sed if jq fails or returns null
if [[ -z "$EVENT" || "$EVENT" == "null" ]]; then
    EVENT=$(echo "$INPUT_JSON" | grep -o '"hook_event_name":"[^"]*"' | cut -d'"' -f4)
fi

if [[ -z "$SUBAGENT_NAME" || "$SUBAGENT_NAME" == "null" ]]; then
    SUBAGENT_NAME=$(echo "$INPUT_JSON" | grep -o '"subagent_type":"[^"]*"' | cut -d'"' -f4)
fi

if [[ -z "$TRANSCRIPT_PATH" || "$TRANSCRIPT_PATH" == "null" ]]; then
    TRANSCRIPT_PATH=$(echo "$INPUT_JSON" | grep -o '"transcript_path":"[^"]*"' | cut -d'"' -f4)
fi

# Debug logging
log "DEBUG: Extracted EVENT='$EVENT', SUBAGENT_NAME='$SUBAGENT_NAME'"

# Get agent output with robust fallback extraction
AGENT_OUTPUT=""

# Try jq first (but expect it to fail due to newlines/control chars)
AGENT_OUTPUT=$(echo "$INPUT_JSON" | jq -r '.tool_response.content[].text' 2>/dev/null)

# If jq fails or returns null, use Python for robust JSON extraction
if [[ -z "$AGENT_OUTPUT" || "$AGENT_OUTPUT" == "null" ]]; then
    # Use Python for proper JSON parsing that handles escape sequences
    AGENT_OUTPUT=$(echo "$INPUT_JSON" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    content = data.get('tool_response', {}).get('content', [])
    for item in content:
        if 'text' in item:
            print(item['text'])
            break
except:
    pass
" 2>/dev/null)
fi

log "DEBUG: Extracted AGENT_OUTPUT length: ${#AGENT_OUTPUT} chars"

# If no direct output and transcript available, extract from transcript
if [[ -z "$AGENT_OUTPUT" && -n "$TRANSCRIPT_PATH" && -f "$TRANSCRIPT_PATH" ]]; then
    # Get the last assistant message from transcript JSONL
    AGENT_OUTPUT=$(tail -10 "$TRANSCRIPT_PATH" | jq -r 'select(.type == "assistant") | .message.content[]? | select(type == "string")' 2>/dev/null | tail -1)
    log "Extracted from transcript: $(echo "$AGENT_OUTPUT" | head -c 100)..."
fi
HANDOFF_TOKEN=${HANDOFF_TOKEN:-""}
CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"/mnt/h/Active/taskmaster-agent-claude-code"}

log "TRUE TEST-DRIVEN HANDOFF VALIDATION - Event: $EVENT, Agent: $SUBAGENT_NAME"
log "JSON INPUT: $INPUT_JSON"

# Validate handoff token format and structure
validate_handoff_token() {
    local token="$1"
    
    if [[ -z "$token" ]]; then
        log "HANDOFF ERROR: No handoff token provided"
echo "❌ 交接校验失败：缺少 handoff token（Missing handoff token）" >&2
        return 1
    fi
    
    # Check token format (should contain agent name, timestamp, and task info)
    if ! echo "$token" | grep -q -E "^[A-Z_]+_[0-9]{8}_[0-9]{6}$"; then
        log "HANDOFF WARNING: Handoff token format may be non-standard: $token"
        # Don't fail on format, just warn
    fi
    
    log "Handoff token validated: $token"
    return 0
}

# Validate agent output contains required elements
validate_agent_output() {
    local output="$1"
    local agent="$2"
    
    if [[ -z "$output" ]]; then
        log "HANDOFF ERROR: No agent output provided for validation"
echo "❌ 契约校验失败：代理输出为空（Empty agent output）" >&2
        return 1
    fi
    
    # Check for implementation evidence (files created/modified)
    local has_implementation=false
    if echo "$output" | grep -qi -E "(created|modified|updated|wrote|edited|implemented)"; then
        has_implementation=true
    fi
    
    # Check for test evidence if implementation occurred
    if [[ "$has_implementation" == "true" ]]; then
        if ! echo "$output" | grep -qi -E "(test|spec|coverage|validation|verify)"; then
            log "CONTRACT WARNING: Implementation detected without test mention"
echo "⚠️  契约警告：实现完成但未包含测试验证（Implementation without test validation）" >&2
echo "📋 建议：请为实现的改动补充测试验证（Include test validation）" >&2
        fi
    fi
    
    # Check for quality indicators
    local quality_score=0
    
    # Check for documentation
    if echo "$output" | grep -qi -E "(document|comment|readme|doc)"; then
        ((quality_score++))
    fi
    
    # Check for error handling
    if echo "$output" | grep -qi -E "(error|exception|handle|catch|validate)"; then
        ((quality_score++))
    fi
    
    # Check for testing
    if echo "$output" | grep -qi -E "(test|spec|coverage|assert)"; then
        ((quality_score++))
    fi
    
    log "Quality score for $agent: $quality_score/3"
    
    if [[ $quality_score -lt 1 ]]; then
echo "⚠️  质量警告：交接质量较低（评分：$quality_score/3）（Low quality handoff）" >&2
echo "📋 需改进：建议补充测试、文档或错误处理（Add tests/docs/handling）" >&2
    fi
    
    return 0
}

# Validate state contract requirements
validate_state_contract() {
    local output="$1"
    
    # Check for critical state information
    local state_elements=()
    
    # Task completion status
    if echo "$output" | grep -qi -E "(complet|finish|done|success)"; then
        state_elements+=("completion_status")
    fi
    
    # File changes
    if echo "$output" | grep -qi -E "(file|path|created|modified)"; then
        state_elements+=("file_changes")
    fi
    
    # Next steps or routing
    if echo "$output" | grep -qi -E "(next|route|handoff|continue)"; then
        state_elements+=("next_steps")
    fi
    
    log "State elements found: ${state_elements[*]}"
    
    if [[ ${#state_elements[@]} -eq 0 ]]; then
        log "CONTRACT ERROR: No state elements found in handoff"
echo "❌ STATE CONTRACT FAILED: Missing required state elements" >&2
echo "📋 REQUIRED: Include completion status, file changes, or next steps" >&2
        return 1
    fi
    
    return 0
}

# Check for test framework integration
validate_test_integration() {
    local output="$1"
    
    # Check if tests were run or mentioned
    if echo "$output" | grep -qi -E "(jest|test.*pass|test.*fail|npm.*test|yarn.*test)"; then
        log "Test framework integration detected"
echo "✅ 测试集成：已检测到测试框架使用（Test framework usage confirmed）" >&2
        return 0
    fi
    
    # Check for test files mentioned
    if echo "$output" | grep -qi -E "(\.test\.|\.spec\.|__tests__|test/)"; then
        log "Test files mentioned in handoff"
echo "✅ 测试文件：发现测试文件引用（Test file references found）" >&2
        return 0
    fi
    
    log "WARNING: No test framework integration detected"
echo "⚠️  测试集成警告：未检测到测试框架使用（No test framework usage）" >&2
    return 0
}

# CHECKPOINT 1: Agent-level TDD validation with test execution
agent_tdd_checkpoint() {
    local agent_name="$1"
    local task_context="$2"
    
    log "AGENT TDD CHECKPOINT: $agent_name"
    
    # Quick test validation - must pass to proceed
    # Check for dependencies first to avoid false positives
    if [[ ! -d ".claude-collective/node_modules" ]]; then
        log "Installing dependencies in .claude-collective/ for testing..."
        (cd .claude-collective && npm install > /dev/null 2>&1) || log "Failed to install dependencies"
    fi
    
    # Run vitest from .claude-collective directory where dependencies are installed
    log "Running vitest validation for $agent_name..."
    
    # Prefer running tests inside .claude-collective where framework deps live; fallback to repo root
    if [ -d ".claude-collective" ] && [ -f ".claude-collective/package.json" ]; then
        log "Detected .claude-collective test environment; running tests there"
        (cd .claude-collective && npx vitest run) > /tmp/agent-test-$agent_name.log 2>&1 || \
        (npm test --prefix .claude-collective) > /tmp/agent-test-$agent_name.log 2>&1
    else
        bash -c "npm test" > /tmp/agent-test-$agent_name.log 2>&1
    fi
    local exit_code=$?
    
    # DUAL VALIDATION: Check both exit code AND output parsing
    local has_test_failures=false
    
    # Check if log file exists and has content
    if [[ ! -f "/tmp/agent-test-$agent_name.log" || ! -s "/tmp/agent-test-$agent_name.log" ]]; then
        log "AGENT TDD FAILURE: $agent_name - no test output generated"
        has_test_failures=true
    else
        # Parse output for test results - FIX: Better Vitest output parsing
        # Check for explicit failures first (but exclude "0 failed" which means success)
        if grep -iq "failed\|error\|✗\|×" "/tmp/agent-test-$agent_name.log" && ! grep -iq "0 failed" "/tmp/agent-test-$agent_name.log"; then
            log "AGENT TDD FAILURE: $agent_name - test failures detected in output"
            has_test_failures=true
        # FIX: Improved success detection for Vitest format
        elif grep -iqE "✓.*test|Tests.*[0-9]+.*passed.*\([0-9]+\)|Test Files.*[0-9]+.*passed|[0-9]+ passed \([0-9]+\)" "/tmp/agent-test-$agent_name.log"; then
            log "AGENT TDD OUTPUT: $agent_name - tests show passing results"
        # FIX: Also check for "Duration" which indicates test completion
        elif grep -iq "Duration.*[0-9]" "/tmp/agent-test-$agent_name.log"; then
            log "AGENT TDD OUTPUT: $agent_name - test execution completed successfully"
        else
            log "AGENT TDD FAILURE: $agent_name - no passing tests detected in output"
            has_test_failures=true
        fi
    fi
    
    # Final validation: Fail if exit code is bad OR output parsing shows failures
    if [[ $exit_code -ne 0 ]] || [[ "$has_test_failures" == "true" ]]; then
        log "AGENT TDD FAILURE: $agent_name tests failing (exit_code=$exit_code, output_issues=$has_test_failures)"
        
        # Extract specific test failures for actionable feedback
        local test_failures=$(extract_test_failures "/tmp/agent-test-$agent_name.log")
        
        echo "代理 TDD 检查失败：$agent_name 的测试未通过（Tests not passing）" >&2
        echo "   退出码：$exit_code（Exit Code）" >&2
        echo "   输出分析：$has_test_failures（Output Analysis）" >&2
        echo "" >&2
        echo "具体失败用例如下（Specific test failures）:" >&2
        echo "$test_failures" >&2
        echo "" >&2
        echo "需修复：请先修复上述失败测试再允许交接（Fix failing tests before handoff）" >&2
        echo "完整测试日志：/tmp/agent-test-$agent_name.log（Full test log）" >&2
        return 1
    fi
    
    # Quick build validation
    if [[ -f "package.json" ]]; then
        if ! timeout 30 npm run build > /tmp/agent-build-$agent_name.log 2>&1; then
            log "AGENT TDD FAILURE: $agent_name build failing"
            echo "代理 TDD 检查失败：$agent_name 构建未通过（Build not passing）" >&2
            echo "需修复：请先修复构建错误再允许交接（Fix build errors before handoff）" >&2
            echo "构建日志：/tmp/agent-build-$agent_name.log（Build log）" >&2
            return 1
        fi
    else
        log "Build validation skipped - no package.json found"
    fi
    
    log "AGENT TDD CHECKPOINT PASSED: $agent_name"
    echo "代理 TDD 检查通过：$agent_name 测试与构建均成功（Tests and build successful）" >&2
    return 0
}

# Execute TDD validation using built-in validation logic
execute_tdd_validation() {
    local agent_output="$1"
    local agent_name="$2"
    
    log "Executing TDD validation for agent: $agent_name"
    
    # TDD Validation Criteria
    local validation_passed=true
    local validation_messages=()
    
    # 1. Check for evidence of completed work
    if ! echo "$agent_output" | grep -qi -E "(complete|done|finished|implemented|created|generated|delivered)"; then
        validation_passed=false
        validation_messages+=("No completion evidence found")
        log "TDD FAIL: No completion evidence"
    else
        validation_messages+=("Work completion evidence found")
        log "TDD PASS: Completion evidence found"
    fi
    
    # 2. For research agents, check for research deliverables
    if [[ "$agent_name" == *"research"* ]]; then
        if echo "$agent_output" | grep -qi -E "(research|analysis|findings|documentation|Context7|library)"; then
            validation_messages+=("Research deliverables validated")
            log "TDD PASS: Research deliverables found"
        else
            validation_passed=false
            validation_messages+=("Missing research deliverables")
            log "TDD FAIL: No research evidence"
        fi
    fi
    
    # 3. For implementation agents, check for code/file evidence
    if [[ "$agent_name" == *"implementation"* || "$agent_name" == *"component"* || "$agent_name" == *"feature"* ]]; then
        if echo "$agent_output" | grep -qi -E "(file|code|component|function|test|npm|build)"; then
            validation_messages+=("Implementation deliverables validated")
            log "TDD PASS: Implementation evidence found"
        else
            validation_passed=false
            validation_messages+=("Missing implementation deliverables")
            log "TDD FAIL: No implementation evidence"
        fi
    fi
    
    # 4. Check for handoff instruction clarity
    if echo "$agent_output" | grep -qi -E "Use the [a-z-]+ (subagent|agent) to"; then
        validation_messages+=("Clear handoff instruction provided")
        log "TDD PASS: Clear handoff instruction"
    else
        # Don't fail on this, just warn
        validation_messages+=("Handoff instruction could be clearer")
        log "TDD WARN: Handoff instruction unclear"
    fi
    
    # 5. Check for quality indicators
    local quality_score=0
    if echo "$agent_output" | grep -qi -E "(test|validation|quality|error.handling)"; then
        quality_score=$((quality_score + 1))
    fi
    if echo "$agent_output" | grep -qi -E "(documentation|readme|comment)"; then
        quality_score=$((quality_score + 1))
    fi
    if echo "$agent_output" | grep -qi -E "(security|performance|accessibility)"; then
        quality_score=$((quality_score + 1))
    fi
    
    if [[ $quality_score -gt 0 ]]; then
        validation_messages+=("Quality indicators present (score: $quality_score/3)")
        log "TDD PASS: Quality score $quality_score/3"
    fi
    
    # Output validation results (to stderr so it doesn't interfere with stdout handoff)
echo "🧪 TDD 校验结果（for $agent_name）:" >&2
    for message in "${validation_messages[@]}"; do
echo "  $message" >&2
    done
    
    if [[ "$validation_passed" == "true" ]]; then
        log "TDD validation PASSED for agent: $agent_name"
echo "TDD 校验通过：代理交接已成功验证（Validated successfully）" >&2
        return 0
    else
        log "TDD validation FAILED for agent: $agent_name"
echo "TDD 校验失败：代理交接校验未通过（Validation failed）" >&2
        return 1
    fi
}

# CHECKPOINT 2: Orchestrator phase completion detection
detect_orchestrator_phase_completion() {
    local output="$1"
    local agent_name="$2"
    
    # Only check for task-orchestrator agents
    if [[ "$agent_name" != *"orchestrator"* ]]; then
        return 1
    fi
    
    # Look for EXPLICIT completion markers, not deployment messages
    # Must have "completed" AND past tense language
    if echo "$output" | grep -qi "ORCHESTRATION STATUS.*COMPLETED" || \
       echo "$output" | grep -qi "ALL TASKS SUCCESSFULLY COMPLETED" || \
       echo "$output" | grep -qi "PHASE.*HAS BEEN COMPLETED"; then
        
        # ALSO exclude if deployment language is present
        if echo "$output" | grep -qi -E "(DEPLOYING|Active Deployments|DEPLOYMENT PLAN|about to deploy)"; then
            log "Orchestrator is still deploying agents, not triggering validation"
            return 1
        fi
        
        log "🎯 ORCHESTRATOR PHASE COMPLETION DETECTED"
        
        # Extract phase info if available
        local phase_info=$(echo "$output" | grep -i -o -E "(Task [0-9]+|Phase [0-9]+|[0-9]+ tasks?)" | head -1)
        
        echo "路由到：tdd-validation-agent（ROUTE TO）" >&2
        echo "上下文：对阶段完成进行全面 TDD 校验：$phase_info（Context: TDD validation for phase completion）" >&2
        
        # Use blocking mechanism for orchestrator validation
        cat <<EOF
{
  "decision": "block",
  "reason": "WORKFLOW AUTOMATION: Orchestrator phase completion detected. Phase: $phase_info. Execute next: Use the tdd-validation-agent subagent to perform comprehensive TDD validation for phase completion."
}
EOF
        
        log "Phase completion validation routed to tdd-validation-agent: $phase_info"
        return 0
    fi
    
    return 1
}

# Extract specific test failures with actionable information
extract_test_failures() {
    local log_file="$1"
    
    if [[ ! -f "$log_file" ]]; then
        echo "No test log available"
        return
    fi
    
    # Extract failed tests and their errors from vitest output
    local failures=""
    local current_test=""
    local error_lines=()
    
    while IFS= read -r line; do
        # Detect failed test (starts with ×)
        if [[ "$line" =~ ^[[:space:]]*×[[:space:]](.+)[[:space:]]+[0-9]+ms$ ]]; then
            # Process previous test if we have one
            if [[ -n "$current_test" ]]; then
                failures+=" $current_test"$'\n'
                for error in "${error_lines[@]}"; do
                    failures+=" $error"$'\n'
                done
                failures+=""$'\n'
            fi
            
            # Start new test
            current_test=$(echo "$line" | sed 's/^[[:space:]]*×[[:space:]]//' | sed 's/[[:space:]]*[0-9]*ms$//')
            error_lines=()
            
        # Detect error messages (starts with →)
        elif [[ "$line" =~ ^[[:space:]]*→[[:space:]](.+)$ ]]; then
            local error_msg=$(echo "$line" | sed 's/^[[:space:]]*→[[:space:]]*//')
            error_lines+=("$error_msg")
        fi
    done < "$log_file"
    
    # Process final test if we have one
    if [[ -n "$current_test" ]]; then
        failures+=" $current_test"$'\n'
        for error in "${error_lines[@]}"; do
            failures+=" $error"$'\n'
        done
    fi
    
    # If no specific failures found, try to extract summary
    if [[ -z "$failures" ]]; then
        # Extract test summary stats
        local summary=$(grep -E "(Failed|Error|✗|failed)" "$log_file" | head -5 | sed 's/^/❌ /')
        if [[ -n "$summary" ]]; then
            failures="$summary"
        else
            failures="Tests failed but specific failures could not be parsed. Check full log."
        fi
    fi
    
    echo "$failures"
}

# Detect handoff directive and extract next agent
detect_handoff() {
    local output="$1"
    
    # Normalize output (convert Unicode to ASCII, handle spacing)
    local normalized_output=$(echo "$output" | sed 's/[–—‑−]/\-/g' | tr -s '[:space:]' ' ')
    
    log "HANDOFF DETECTION: Normalized output (first 300 chars): $(echo "$normalized_output" | head -c 300)..."
    
    # Pattern: "Use the <id> subagent to ..." (start-anchored, case insensitive)
    local next_agent=$(echo "$normalized_output" | grep -i -o '^ *Use the [a-z0-9-]* subagent to' | head -1 | sed 's/^ *Use the //' | sed 's/ subagent to.*//')
    
    # Also check mid-line patterns and anywhere in text
    if [[ -z "$next_agent" ]]; then
        next_agent=$(echo "$normalized_output" | grep -i -o 'Use the [a-z0-9-]* subagent to' | head -1 | sed 's/Use the //' | sed 's/ subagent to.*//')
    fi
    
    # Special check for end-of-text patterns (common in agent completions)
    if [[ -z "$next_agent" ]]; then
        next_agent=$(echo "$normalized_output" | tail -5 | grep -i -o 'Use the [a-z0-9-]* subagent to' | head -1 | sed 's/Use the //' | sed 's/ subagent to.*//')
    fi
    
    if [[ -n "$next_agent" ]]; then
        log "HANDOFF FOUND: '$next_agent'"
        echo "$next_agent"
        return 0
    fi
    
    log "HANDOFF NOT FOUND: No 'Use the X subagent to' pattern detected"
    return 1
}

# Main logic - handoff detection first, then TDD validation
main() {
    log "Starting handoff detection and TDD validation"
    log "Agent: $SUBAGENT_NAME, Event: $EVENT"
    log "Agent output length: ${#AGENT_OUTPUT} chars"
    
    # Only process SubagentStop events (allow PostToolUse for safety net)
    if [[ "$EVENT" != "SubagentStop" && "$EVENT" != "PostToolUse" ]]; then
        log "Skipping - not a SubagentStop or PostToolUse event (Event: '$EVENT')"
        return 0
    fi
    
    # For PostToolUse, only process if SubagentStop wasn't already handled
    if [[ "$EVENT" == "PostToolUse" ]]; then
        # Check if we're dealing with a Task tool call (subagent execution)
        local tool_name=$(echo "$INPUT_JSON" | jq -r '.tool_name' 2>/dev/null)
        if [[ -z "$tool_name" || "$tool_name" == "null" ]]; then
            tool_name=$(echo "$INPUT_JSON" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)
        fi
        if [[ "$tool_name" != "Task" ]]; then
            log "PostToolUse: Not a Task tool, skipping"
            return 0
        fi
    fi
    
    # Check if agent output exists
    if [[ -z "$AGENT_OUTPUT" ]]; then
        log "No agent output to process"
        return 0
    fi
    
    # CHECKPOINT 1: Agent-level TDD validation BEFORE handoff
    local completion_detected=false
    if echo "$AGENT_OUTPUT" | grep -qi -E "(complete|done|finished|delivered)"; then
        completion_detected=true
        log "Completion detected for $SUBAGENT_NAME - running TDD checkpoint"
        
        # Run agent TDD checkpoint - BLOCKS handoff if fails (EXCEPT for tdd-validation-agent)
        # tdd-validation-agent is ALLOWED to hand off even with failing tests (its job is to identify failures)
        if [[ "$SUBAGENT_NAME" != "tdd-validation-agent" ]] && ! agent_tdd_checkpoint "$SUBAGENT_NAME" "$(echo "$AGENT_OUTPUT" | head -c 100)"; then
            log "AGENT TDD CHECKPOINT FAILED: Blocking handoff for $SUBAGENT_NAME"
            # Extract specific failure details for actionable feedback  
            local failure_summary=""
            if [[ -f "/tmp/agent-test-$SUBAGENT_NAME.log" ]]; then
                # Get a concise summary of failures without special JSON-breaking characters
                local fail_count=$(grep -c "^[[:space:]]*×" "/tmp/agent-test-$SUBAGENT_NAME.log" 2>/dev/null || echo "0")
                local failed_suites=$(grep -E "^[[:space:]]*×.*>" "/tmp/agent-test-$SUBAGENT_NAME.log" | sed 's/^[[:space:]]*×[[:space:]]*//' | sed 's/[[:space:]]*[0-9]*ms$//' | head -3 | tr '\n' '; ' | sed 's/[^a-zA-Z0-9 ;>-]//g')
                
                if [[ "$fail_count" -gt 0 ]]; then
                    failure_summary="$fail_count failing tests including: $failed_suites"
                else
                    failure_summary="Test execution failed - check logs for compilation or runtime errors"
                fi
            else
                failure_summary="Test failures detected but log file not available"
            fi
            
            cat <<EOF
{
  "decision": "block",
  "reason": "TDD VALIDATION FAILED: Agent $SUBAGENT_NAME has failing tests. SPECIFIC FAILURES: $failure_summary. REQUIRED ACTION: Fix these specific test failures before handoff allowed. Detailed error log: /tmp/agent-test-$SUBAGENT_NAME.log. Execute next: Use the $SUBAGENT_NAME subagent to fix the failing tests and continue the original task."
}
EOF
            return 1
        fi
    fi

    # CHECKPOINT 2: Orchestrator phase completion detection
    if detect_orchestrator_phase_completion "$AGENT_OUTPUT" "$SUBAGENT_NAME"; then
        log "Orchestrator phase completion handled - routed to tdd-validation-agent"
        return 0
    fi

    # STEP 1: Detect handoff directive OR inject hub return for implementation agents
    local next_agent
    log "Checking for handoff directive in output (first 200 chars): $(echo "$AGENT_OUTPUT" | head -c 200)..."
    if next_agent=$(detect_handoff "$AGENT_OUTPUT"); then
        log "HANDOFF DETECTED: $SUBAGENT_NAME -> $next_agent"
        
        # BREAKTHROUGH: Use Claude Code's BLOCK mechanism to force continuation
        cat <<EOF
{
  "decision": "block",
  "reason": "WORKFLOW AUTOMATION: Agent handoff detected. $SUBAGENT_NAME completed and handed off to $next_agent. Execute next: Use the $next_agent subagent to continue the workflow."
}
EOF
        
        log "DECISION.md auto-delegation triggered for: $next_agent"
    else
        log "No handoff directive detected in agent output"
        
        # CREATIVE SOLUTION: Response Stream Hijacking for Hub-and-Spoke Architecture
        # If this is an implementation agent that completed work, inject hub return
        if [[ "$SUBAGENT_NAME" == *"implementation"* ]] && echo "$AGENT_OUTPUT" | grep -qi -E "(complete|done|finished|delivered)"; then
            log "RESPONSE HIJACK: Implementation agent completed without handoff - injecting hub return"
            
            cat <<EOF
{
  "decision": "block", 
  "reason": "WORKFLOW AUTOMATION: Implementation agent $SUBAGENT_NAME completed successfully. Hub return required. Execute next: Use the task-orchestrator subagent to coordinate the next phase - $SUBAGENT_NAME complete and validated."
}
EOF
            
            log "Hub return auto-injected for completed implementation agent: $SUBAGENT_NAME"
        # PROGRESSIVE DETECTION: Implementation agent stopped with incomplete work
        elif [[ "$SUBAGENT_NAME" == *"implementation"* ]] && echo "$AGENT_OUTPUT" | grep -qi -E "([0-9]+%.*complete|in progress|refactor phase|next steps|partially completed|ready to proceed|remaining work)"; then
            log "INCOMPLETE WORK DETECTED: Implementation agent stopped with incomplete work"
            
            cat <<EOF
{
  "decision": "block",
  "reason": "WORKFLOW AUTOMATION: Agent $SUBAGENT_NAME stopped with incomplete work (progress update detected). Execute next: Use the $SUBAGENT_NAME subagent to complete all remaining work and provide proper completion handoff using the required template format."
}
EOF
            
            log "Incomplete work auto-continuation triggered for: $SUBAGENT_NAME"
        fi
    fi
    
    # STEP 2: Run TDD validation separately (output to stderr and logs only)
    log "Running TDD validation for $SUBAGENT_NAME"
    if execute_tdd_validation "$AGENT_OUTPUT" "$SUBAGENT_NAME" >&2; then
        log "TDD validation PASSED for $SUBAGENT_NAME"
    else
        log "TDD validation FAILED for $SUBAGENT_NAME"
        # Don't exit - let handoff proceed even if TDD fails
    fi
    
    return 0
}

# Execute main function
main "$@"