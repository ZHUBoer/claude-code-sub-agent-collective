# Claude Code Sub-Agent Collective - User Guide

## 🚀 Quick Start

### Installation

Install the collective system in any project with a single command:

```bash
npx claude-code-collective init
```

**Installation Options:**
```bash
# Full installation (recommended)
npx claude-code-collective init

# Minimal installation (core agents only)
npx claude-code-collective init --minimal

# Interactive configuration
npx claude-code-collective init --interactive

# Testing framework only
npx claude-code-collective init --testing-only

# Hook system only
npx claude-code-collective init --hooks-only
```

### Verification

Verify your installation:
```bash
npx claude-code-collective status
npx claude-code-collective validate
```

## 🎯 Core Concepts

### Hub-and-Spoke Architecture

The collective uses a **hub-and-spoke** coordination pattern:
- **Hub**: `@routing-agent` - Central coordination point
- **Spokes**: Specialized agents for different tasks
- **Flow**: All requests → Hub → Appropriate Spoke Agent

### Behavioral Operating System

The system operates under behavioral directives in `CLAUDE.md`:
1. **NEVER IMPLEMENT DIRECTLY** - Always route through specialized agents
2. **COLLECTIVE ROUTING PROTOCOL** - Central hub coordination required
3. **TEST-DRIVEN VALIDATION** - Every handoff validated through contracts

## 💬 Command System

### Natural Language Commands

The system understands natural language and converts it to structured commands:

```bash
# Natural language → Command translation
"show system status"           → /collective status
"list all available agents"    → /agent list
"validate quality gates"       → /gate validate
"spawn a testing agent"        → /agent spawn testing
"check system health"          → /van check
"route this to research agent" → /collective route research
```

### Direct Command Interface

#### `/collective` - System Management
```bash
/collective status              # Show overall system health
/collective agents              # List all available agents
/collective route <request>     # Route request to appropriate agent
/collective metrics             # Display performance metrics
/collective validate            # Run system validation
/collective help               # Command help
```

#### `/agent` - Agent Management  
```bash
/agent list                    # List all agents
/agent spawn <type> [params]   # Create new agent instance
/agent status <name>           # Show specific agent status
/agent route <request>         # Test routing logic
/agent help                    # Agent command help
```

#### `/gate` - Quality Gates
```bash
/gate status                   # Show quality gate status
/gate validate [phase]         # Run phase validation
/gate bypass <gate> <reason>   # Emergency gate bypass
/gate history                  # Gate validation history
/gate help                     # Gate command help
```

#### `/van` - Maintenance System
```bash
/van check                     # Run health checks
/van repair                    # Auto-repair issues
/van optimize                  # Performance optimization
/van full                      # Complete maintenance
/van report                    # Generate maintenance report
/van schedule                  # Configure scheduled maintenance
/van help                      # Maintenance help
```

### Command Aliases

Quick shortcuts for common operations:
```bash
# Short aliases
/c status      # → /collective status
/a list        # → /agent list  
/g validate    # → /gate validate
/v check       # → /van check

# Ultra-short
/status        # → /collective status
/route         # → /collective route
/spawn         # → /agent spawn
```

## 🤖 Working with Agents

### Available Specialized Agents

**Core Coordination:**
- `routing-agent` - Central hub coordinator
- `enhanced-project-manager-agent` - Multi-phase project management

**Implementation Specialists:**
- `behavioral-transformation-agent` - CLAUDE.md behavioral OS
- `testing-implementation-agent` - Jest framework and TDD
- `hook-integration-agent` - Directive enforcement scripts
- `npx-package-agent` - NPX distribution packages
- `command-system-agent` - Natural language parsing
- `metrics-collection-agent` - Research validation
- `dynamic-agent-creator` - Runtime agent spawning
- `van-maintenance-agent` - Self-healing ecosystem

**Cross-Cutting Support:**
- `research-agent` - Technical research and analysis
- `quality-agent` - Code review and validation
- `component-implementation-agent` - UI components
- `feature-implementation-agent` - Business logic
- `infrastructure-implementation-agent` - Build systems

### Agent Routing Examples

```bash
# Route complex requests
/collective route "I need to implement authentication with OAuth2"
# → Routes to @feature-implementation-agent or @research-agent

# Route UI requests  
/collective route "Create a login form component with validation"
# → Routes to @component-implementation-agent

# Route research requests
/collective route "What's the best way to handle WebSocket connections?"
# → Routes to @research-agent

# Route quality requests
/collective route "Review this code for security issues"
# → Routes to @quality-agent
```

### Dynamic Agent Creation

Create specialized agents on-demand:

```bash
# Spawn agents with templates
/agent spawn research data-analysis
/agent spawn testing integration
/agent spawn implementation frontend

# Interactive agent creation
/agent spawn --interactive

# Clone existing agents
/agent spawn --clone existing-agent-id --name new-agent
```

## 📊 Research and Metrics

### Research Hypotheses

The system validates three core hypotheses:

**H1: JIT Context Loading**
- Theory: On-demand loading is more efficient than preloading
- Metrics: Load times, memory usage, context relevance
- Target: 30% load time reduction, 25% memory savings

**H2: Hub-and-Spoke Coordination**  
- Theory: Centralized routing outperforms distributed communication
- Metrics: Routing accuracy, coordination overhead, error rates
- Target: 90% routing accuracy, <10% coordination overhead

**H3: Test-Driven Development**
- Theory: Contract-based handoffs improve quality
- Metrics: Success rates, error detection, validation coverage
- Target: 80% handoff success, 95% validation coverage

### Accessing Metrics

```bash
# View metrics dashboard
/collective metrics

# Detailed research data
/collective metrics --detailed

# Export metrics for analysis
/collective metrics --export research-data.json
```

## 🛠️ Maintenance and Health

### System Health Monitoring

```bash
# Quick health check
/van check

# Detailed health report
/van check --detailed

# Specific component checks
/van check --component hooks
/van check --component agents
/van check --component tests
```

### Auto-Repair System

```bash
# Auto-repair common issues
/van repair

# Dry run (show what would be fixed)
/van repair --dry-run

# Repair specific issues
/van repair --missing-files
/van repair --permissions
/van repair --configurations
```

### Performance Optimization

```bash
# Run optimization routines
/van optimize

# Specific optimizations
/van optimize --cache-cleanup
/van optimize --test-optimization
/van optimize --agent-archival
/van optimize --metrics-cleanup
```

### Scheduled Maintenance

```bash
# View maintenance schedule
/van schedule

# Configure automated maintenance
/van schedule --hourly health-check
/van schedule --daily full-maintenance
/van schedule --weekly optimization
```

## 🧪 Testing and Validation

### Running Tests

```bash
# System validation
/collective validate

# Quality gate validation
/gate validate

# Component-specific tests
/gate validate --phase behavioral
/gate validate --phase testing
/gate validate --phase hooks
```

### Test-Driven Handoffs (TDH)

The system uses contract-based validation for all agent interactions:

```bash
# View handoff contracts
ls .claude-collective/tests/contracts/

# Manual contract validation
/gate validate --contracts

# Handoff success metrics  
/collective metrics --handoffs
```

## 🔧 Configuration

### Settings Management

Main configuration files:
- `.claude/settings.json` - Hook configuration
- `CLAUDE.md` - Behavioral operating system
- `.claude/agents/` - Agent definitions
- `.claude-collective/` - Testing framework

### Customization

```bash
# View current configuration
npx claude-code-collective status --config

# Update installation
npx claude-code-collective update

# Repair corrupted installation
npx claude-code-collective repair

# Clean installation (reset to defaults)
npx claude-code-collective clean --confirm
```

## 🚨 Troubleshooting

### Common Issues

**Command not found:**
```bash
# Check installation
npx claude-code-collective status

# Reinstall if needed
npx claude-code-collective init --force
```

**Hooks not working:**
```bash
# Check hook status
/van check --component hooks

# Repair hook permissions
/van repair --permissions

# Note: Hook changes require Claude Code restart
```

**Agent routing issues:**
```bash
# Test routing logic
/agent route "test request"

# Check agent registry
/agent list --detailed

# Validate agent definitions
/gate validate --agents
```

**Performance issues:**
```bash
# Run optimization
/van optimize

# Check system health
/van check --performance

# View resource usage
/collective metrics --resources
```

### Getting Help

```bash
# Command-specific help
/collective help
/agent help  
/gate help
/van help

# System diagnostics
npx claude-code-collective validate --verbose

# Generate support report
/van report --support
```

### Validation Commands

```bash
# Full system validation
/collective validate --comprehensive

# Component validation
/gate validate --component behavioral
/gate validate --component testing  
/gate validate --component hooks
/gate validate --component distribution
/gate validate --component commands
/gate validate --component metrics
/gate validate --component agents
/gate validate --component maintenance
```

## 🌍 Distribution and Sharing

### NPX Package

The collective is distributed as an NPX package for easy installation:

```bash
# Anyone can install with:
npx claude-code-collective init

# Package information
npm info claude-code-collective

# Version management
npx claude-code-collective@latest init
```

### Project Integration

```bash
# Add to existing projects
cd your-project
npx claude-code-collective init

# Integration validation
npx claude-code-collective validate --integration
```

## 📈 Advanced Usage

### Research Mode

Enable detailed metrics collection:

```bash
# Enable research tracking
/collective metrics --research-mode on

# Configure experiment tracking
/collective metrics --experiment "feature-comparison"

# Export research data
/collective metrics --export --format research
```

### Custom Agent Templates

Create your own agent templates:

```bash
# Create custom template
/agent template create my-custom-agent

# Use custom template
/agent spawn my-custom-agent specialized-task

# Share templates
/agent template export my-custom-agent
```

### Performance Monitoring

```bash
# Real-time performance monitoring
/collective metrics --live

# Performance profiling
/van check --profile

# Resource optimization
/van optimize --resources
```

---

## 🎯 Quick Reference

### Essential Commands
```bash
# Installation
npx claude-code-collective init

# Health check
/van check

# Route requests
/collective route "<your request>"

# System validation  
/collective validate

# Get help
/<namespace> help
```

### Key Files
- `CLAUDE.md` - Behavioral operating system
- `.claude/settings.json` - Hook configuration  
- `.claude/agents/` - Agent definitions
- `.claude-collective/` - Testing framework

### Support
- System validation: `/collective validate`
- Health diagnostics: `/van check --detailed`
- Support report: `/van report --support`

---

## 🧭 SIGMA: DPTR × Collective（Plan → TDD → Review → Status）

### 1) 生成计划（Ω₂）
```bash
# 在 memory-bank/modules/<module>/design.md 基础上生成 tdd_plan.md
npx sigma plan <module> --memory-bank ./memory-bank/modules [--overwrite]
```

### 2) 执行 TDD（Ω₃）
```bash
# 并行执行 cycles，按 RED→GREEN→REFACTOR 三阶段运行真实 jest
# 支持覆盖率门槛与自定义工作目录
npx sigma tdd <module> \
  --memory-bank ./memory-bank/modules \
  --parallel 1 \
  --cov-lines 60 --cov-funcs 50 --cov-branches 40 --cov-statements 60 \
  --out ./.work/sigma

# 失败 cycles 将导致非零退出码（2），便于 CI 使用
```

产物：
- 工作区：`.work/sigma/<module>/<cycle>/`（未指定 --out 时默认 `.claude-collective/sigma/...`）
- 指标与事件：`.claude-collective/metrics/sigma/<module>/`
  - `latest-plan.json` / `latest-tdd.json` / `events.log`

### 3) 审查（Ω₄）
```bash
# 汇总生成 review.json 与 review.md
npx sigma review <module> --memory-bank ./memory-bank/modules
```
产物：`.claude-collective/metrics/sigma/<module>/review.json|review.md`

### 4) 状态（总览）
```bash
# 查看最新计划/TDD/审查摘要与失败 cycles、覆盖率阈值
npx sigma status <module> --memory-bank ./memory-bank/modules
```

### 说明
- 覆盖率门槛：四维（lines/functions/branches/statements）全部达标视为通过。
- 事件流：RED/GREEN/REFACTOR 三阶段写入 `events.log`（一行一事件），含状态码与覆盖率。
- 设计对齐：完整遵循 DPTR（Ω₂/Ω₃/Ω₄）与 σ Memory-Bank 组织。