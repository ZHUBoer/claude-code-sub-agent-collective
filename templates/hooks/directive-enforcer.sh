#!/bin/bash
# directive-enforcer.sh
# claude tdd agents - Directive Enforcement Hook
# Validates behavioral directives before tool execution

# Set up logging
LOG_FILE="/tmp/directive-enforcer.log"
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# Initialize environment variables if not set
USER_PROMPT=${USER_PROMPT:-""}
TOOL_NAME=${TOOL_NAME:-""}
CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"/mnt/h/Active/taskmaster-agent-claude-code"}

log "DIRECTIVE ENFORCEMENT TRIGGERED - Tool: $TOOL_NAME"

# DIRECTIVE 1: NEVER IMPLEMENT DIRECTLY
# Block direct implementation when hub-and-spoke pattern should be used
check_direct_implementation() {
    local prompt="$1"
    local tool="$2"
    
    # Check for implementation-related activities
    if [[ "$tool" == "Write" || "$tool" == "Edit" || "$tool" == "MultiEdit" ]]; then
        # Look for direct implementation phrases that violate hub-and-spoke
        if echo "$prompt" | grep -qi -E "(implement|create.*code|write.*function|add.*feature|build.*component)"; then
            # Check if this is coming from a specialized agent (allowed)
            if ! echo "$prompt" | grep -qi "@.*-agent"; then
                log "DIRECTIVE 1 VIOLATION: Direct implementation detected without agent routing"
                echo "指令违规：尝试直接实现（DIRECT IMPLEMENTATION ATTEMPTED）"
                echo "必要操作：请通过 @routing-agent 进行路由选择（Route through @routing-agent）"
                echo "违规说明：禁止直接实现，请使用辐射式（hub-and-spoke）模式（NEVER IMPLEMENT DIRECTLY）"
                return 1
            fi
        fi
    fi
    return 0
}

# DIRECTIVE 2: COLLECTIVE ROUTING PROTOCOL  
# Ensure requests flow through proper routing channels
check_routing_protocol() {
    local prompt="$1"
    
    # Check for peer-to-peer agent communication violations
    if echo "$prompt" | grep -qi -E "(@[a-z-]*agent.*@[a-z-]*agent|direct.*communication|bypass.*routing)"; then
        log "DIRECTIVE 2 VIOLATION: Peer-to-peer agent communication detected"
        echo "❌ 路由违规：不允许代理点对点直接通信（Peer-to-peer agent communication not allowed）"
        echo "🔄 必要操作：请将请求统一路由到 @routing-agent（Route through hub）"
        return 1
    fi
    
    return 0
}

# DIRECTIVE 3: TEST-DRIVEN VALIDATION
# Ensure handoffs include proper test validation
check_test_driven_validation() {
    local prompt="$1"
    local tool="$2"
    
    # Check for handoff scenarios without test validation
    if echo "$prompt" | grep -qi -E "(handoff|hand.*off|transfer.*to|route.*to.*agent)"; then
        if ! echo "$prompt" | grep -qi -E "(test|validate|verify|contract|quality.*gate)"; then
            log "DIRECTIVE 3 WARNING: Handoff without explicit test validation mentioned"
            echo "测试驱动警告：检测到交接但未包含测试验证（Handoff without test validation）"
            echo "建议：在交接中加入测试契约验证（Include test contract validation）"
            # Don't block, just warn
        fi
    fi
    
    return 0
}

# Security validation - prevent malicious command injection
validate_security() {
    local prompt="$1"
    
    # Check for basic command injection patterns
    if echo "$prompt" | grep -qi -E "(rm -rf|curl |wget |;s*rm|;s*curl|;s*wget)"; then
        log "SECURITY VIOLATION: Potential command injection detected"
        echo "SECURITY VIOLATION: Potentially malicious input detected"
        return 1
    fi
    
    return 0
}

# Main enforcement logic
main() {
    log "Starting directive enforcement for tool: $TOOL_NAME"
    
    # Run all validation checks
    if ! validate_security "$USER_PROMPT"; then
        exit 1
    fi
    
    if ! check_direct_implementation "$USER_PROMPT" "$TOOL_NAME"; then
        exit 1
    fi
    
    if ! check_routing_protocol "$USER_PROMPT"; then
        exit 1
    fi
    
    check_test_driven_validation "$USER_PROMPT" "$TOOL_NAME"
    
    log "All directive checks passed for tool: $TOOL_NAME"
    return 0
}

# Execute main function
main "$@"
