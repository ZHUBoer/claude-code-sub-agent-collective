#!/bin/bash
# research-evidence-validation.sh
# TDD Research Evidence Validation for prd-research-agent
# Validates that research was actually executed with evidence files and task enhancement

# Set up logging
LOG_FILE="/tmp/research-evidence-validation.log"
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# Initialize environment variables
EVENT=${EVENT:-""}
SUBAGENT_NAME=${SUBAGENT_NAME:-""}
AGENT_OUTPUT=${AGENT_OUTPUT:-""}
CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"/mnt/h/Active/taskmaster-agent-claude-code"}

log "TDD RESEARCH EVIDENCE VALIDATION - Event: $EVENT, Agent: $SUBAGENT_NAME"

# Only validate prd-research-agent outputs
if [[ "$SUBAGENT_NAME" != "prd-research-agent" ]]; then
    log "Skipping - not prd-research-agent ($SUBAGENT_NAME)"
    exit 0
fi

# Only validate on SubagentStop events
if [[ "$EVENT" != "SubagentStop" ]]; then
    log "Skipping validation - not a SubagentStop event"
    exit 0
fi

# RED Phase Validation - Research Requirements Definition
validate_red_phase() {
    local output="$1"
    
    log "Validating RED phase - Research requirements definition"
    
    # Check if technologies were identified
    if ! echo "$output" | grep -qi -E "(react|typescript|vite|jest|tailwind|node)"; then
        log "RED PHASE ERROR: No technologies identified from PRD"
        echo "❌ RED PHASE FAILED: Technologies not identified from PRD"
        return 1
    fi
    
    # Check if research questions were defined
    if ! echo "$output" | grep -qi -E "(research.*question|what.*research|research.*requirement)"; then
        log "RED PHASE WARNING: Research questions may not be explicitly defined"
        echo "⚠️  RED PHASE WARNING: Research questions not explicitly defined"
    fi
    
    log "RED phase validation passed"
    echo "✅ RED PHASE: Research requirements defined"
    return 0
}

# GREEN Phase Validation - Research Execution Evidence
validate_green_phase() {
    local output="$1"
    
    log "Validating GREEN phase - Research execution evidence"
    
    # Check for Context7 tool execution claims
    local context7_claims=false
    if echo "$output" | grep -qi -E "(mcp__context7__|resolve-library-id|get-library-docs)"; then
        context7_claims=true
    fi
    
    # Check for TaskMaster research tool execution claims
    local taskmaster_research_claims=false
    if echo "$output" | grep -qi -E "(mcp__task-master-ai__research|saveToFile=true)"; then
        taskmaster_research_claims=true
    fi
    
    if [[ "$context7_claims" == "false" && "$taskmaster_research_claims" == "false" ]]; then
        log "GREEN PHASE ERROR: No research tool execution claims found"
        echo "❌ GREEN PHASE FAILED: No evidence of research tool execution"
        return 1
    fi
    
    # CRITICAL: Check for actual research cache files
    local research_dir="$CLAUDE_PROJECT_DIR/.taskmaster/docs/research"
    
    if [[ ! -d "$research_dir" ]]; then
        log "GREEN PHASE CRITICAL ERROR: Research cache directory doesn't exist"
        echo "GREEN PHASE CRITICAL FAILURE: Research cache directory missing"
        echo "Expected: $research_dir"
        echo "REQUIRED: Create research cache files with actual Context7/TaskMaster research"
        return 1
    fi
    
    # Count research files
    local research_file_count
    research_file_count=$(find "$research_dir" -name "*.md" -type f | wc -l)
    
    if [[ $research_file_count -eq 0 ]]; then
        log "GREEN PHASE CRITICAL ERROR: No research cache files found"
        echo "GREEN PHASE CRITICAL FAILURE: Zero research cache files"
        echo "Directory exists but empty: $research_dir"
        echo "REQUIRED: Execute mcp__task-master-ai__research with saveToFile=true"
        echo "REQUIRED: Execute mcp__context7__ tools and save results"
        return 1
    fi
    
    log "GREEN phase validation passed - found $research_file_count research files"
    echo "GREEN PHASE: Research cache files exist ($research_file_count files)"
    return 0
}

# REFACTOR Phase Validation - Task Enhancement Evidence
validate_refactor_phase() {
    local output="$1"
    
    log "Validating REFACTOR phase - Task enhancement evidence"
    
    # Check tasks.json for research_context fields
    local tasks_file="$CLAUDE_PROJECT_DIR/.taskmaster/tasks/tasks.json"
    
    if [[ ! -f "$tasks_file" ]]; then
        log "REFACTOR PHASE ERROR: tasks.json not found"
        echo "❌ REFACTOR PHASE FAILED: tasks.json missing"
        return 1
    fi
    
    # Check for research_context fields in tasks
    local research_context_count
    research_context_count=$(grep -c "research_context" "$tasks_file" 2>/dev/null || echo "0")
    
    if [[ $research_context_count -eq 0 ]]; then
        log "REFACTOR PHASE CRITICAL ERROR: No research_context fields found in tasks"
        echo "REFACTOR PHASE CRITICAL FAILURE: Tasks lack research_context"
        echo "File: $tasks_file"
        echo "Found: $research_context_count research_context fields"
        echo "REQUIRED: Execute mcp__task-master-ai__update_task for each task"
        echo "REQUIRED: Add research_context and implementation_guidance fields"
        return 1
    fi
    
    log "REFACTOR phase validation passed - found $research_context_count research_context fields"
    echo "REFACTOR PHASE: Tasks enhanced with research_context ($research_context_count fields)"
    return 0
}

# TDD Completion Report Validation
validate_tdd_completion_report() {
    local output="$1"
    
    log "Validating TDD completion report format"
    
    # Check for required TDD report sections
    local required_sections=("RED PHASE" "GREEN PHASE" "REFACTOR PHASE" "EVIDENCE" "VALIDATION")
    local missing_sections=()
    
    for section in "${required_sections[@]}"; do
        if ! echo "$output" | grep -qi "$section"; then
            missing_sections+=("$section")
        fi
    done
    
    if [[ ${#missing_sections[@]} -gt 0 ]]; then
        log "TDD REPORT ERROR: Missing required sections: ${missing_sections[*]}"
        echo "TDD REPORT INCOMPLETE: Missing sections: ${missing_sections[*]}"
        echo "REQUIRED: Follow TDD completion report format"
        return 1
    fi
    
    # Check for evidence file paths with @ symbols
    if ! echo "$output" | grep -q "@\.taskmaster/docs/research/"; then
        log "TDD REPORT WARNING: No @ file path references found"
        echo "TDD REPORT WARNING: Missing @ file path references for research cache"
    fi
    
    log "TDD completion report validation passed"
    echo "TDD REPORT: Completion report format validated"
    return 0
}

# Evidence File Content Validation
validate_evidence_content() {
    log "Validating evidence file content quality"
    
    local research_dir="$CLAUDE_PROJECT_DIR/.taskmaster/docs/research"
    local validation_passed=true
    
    # Find all research files
    while IFS= read -r -d '' file; do
        local filename=$(basename "$file")
        log "Validating content of: $filename"
        
        # Check file size (should not be empty or too small)
        local file_size
        file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        
        if [[ $file_size -lt 100 ]]; then
            log "CONTENT ERROR: $filename is too small ($file_size bytes)"
            echo "CONTENT WARNING: $filename may lack sufficient research content"
            validation_passed=false
        fi
        
        # Check for research indicators in content
        if grep -qi -E "(context7|documentation|best.practice|pattern|integration)" "$file"; then
            log "CONTENT OK: $filename contains research indicators"
        else
            log "CONTENT WARNING: $filename may lack research content"
            echo "CONTENT WARNING: $filename may not contain actual research findings"
            validation_passed=false
        fi
        
    done < <(find "$research_dir" -name "*.md" -type f -print0 2>/dev/null)
    
    if [[ "$validation_passed" == "true" ]]; then
        echo "EVIDENCE CONTENT: Research files contain adequate content"
    else
        echo "EVIDENCE CONTENT: Some research files may need more detailed content"
    fi
    
    return 0
}

# Main validation function
main() {
    log "Starting TDD research evidence validation for: $SUBAGENT_NAME"
    
    if [[ -z "$AGENT_OUTPUT" ]]; then
        log "No agent output to validate"
        exit 0
    fi
    
    local validation_failed=false
    
    echo ""
    echo "TDD RESEARCH EVIDENCE VALIDATION"
    echo "Agent: $SUBAGENT_NAME"
    echo "Time: $(timestamp)"
    echo ""
    
    # Execute all validation phases
    if ! validate_red_phase "$AGENT_OUTPUT"; then
        validation_failed=true
    fi
    
    if ! validate_green_phase "$AGENT_OUTPUT"; then
        validation_failed=true
    fi
    
    if ! validate_refactor_phase "$AGENT_OUTPUT"; then
        validation_failed=true
    fi
    
    if ! validate_tdd_completion_report "$AGENT_OUTPUT"; then
        validation_failed=true
    fi
    
    # Content validation (warnings only)
    validate_evidence_content
    
    echo ""
    
    if [[ "$validation_failed" == "true" ]]; then
        log "TDD RESEARCH VALIDATION FAILED for agent: $SUBAGENT_NAME"
        echo "TDD RESEARCH VALIDATION FAILED"
        echo ""
        echo "RESOLUTION STEPS:"
        echo "1. Execute actual mcp__context7__ and mcp__task-master-ai__research tools"
        echo "2. Create research cache files in .taskmaster/docs/research/"
        echo "3. Enhance tasks with research_context using mcp__task-master-ai__update_task"
        echo "4. Follow TDD completion report format with evidence"
        echo ""
        echo "See detailed logs at: $LOG_FILE"
        echo ""
        exit 1
    else
        log "TDD research validation successful for agent: $SUBAGENT_NAME"
        echo "TDD RESEARCH VALIDATION PASSED"
        echo "All evidence requirements met"
        echo "Research-backed task generation validated"
        echo ""
    fi
    
    return 0
}

# Execute main function
main "$@"