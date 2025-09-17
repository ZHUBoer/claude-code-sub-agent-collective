# CLAUDE.md(EN)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **claude tdd agents** - an NPX-distributed framework that installs specialized AI agents, hooks, and behavioral systems for TDD-focused development workflows. The system enforces test-driven development through automated handoff validation and provides intelligent task routing through a hub-and-spoke architecture.

## CRITICAL REPOSITORY INFORMATION

**Git Remote URL:** https://github.com/ZHUBoer/claude-code-sub-agent-collective.git
**NEVER CHANGE THIS URL** - Always use this exact repository URL for all git operations.

## Architecture

### Core System
- **Hub-and-spoke architecture** with `@routing-agent` as central coordinator
- **Behavioral Operating System** defined in `CLAUDE.md` with prime directives
- **Test-Driven Handoffs** with contract validation between agents
- **Just-in-time context loading** to minimize memory usage

### Key Components
- **NPX Package**: `claude-tdd-agents` - Installable via `npx claude-tdd-agents init`
- **Agent System**: 30+ specialized agents in `templates/agents/`
- **Hook System**: TDD enforcement hooks in `templates/hooks/`
- **Command System**: Natural language + structured commands in `lib/command-*.js`
- **Metrics Framework**: Research hypotheses tracking in `lib/metrics/`
- **Template System**: Installation templates in `templates/`

## Essential Commands

### Development
```bash
# Run tests (primary test suite)
npm test                    # Vitest tests
npm run test:jest          # Jest tests (comprehensive)
npm run test:coverage      # Coverage reports

# Run specific test suites  
npm run test:contracts     # Contract validation tests
npm run test:handoffs      # Agent handoff tests
npm run test:agents        # Agent system tests

# Package management
npm run install-collective # Install to current directory
npm run validate          # Validate installation
npm run metrics:report    # View metrics data
```

### Local Testing Workflow

For testing changes before publishing (see ai-docs/Simple-Local-Testing-Workflow.md):

```bash
# Automated testing (does everything automatically)
./scripts/test-local.sh
# This script automatically:
# - Creates package (.tgz file)  
# - Creates test directory ../npm-tests/ccc-testing-vN (auto-numbered)
# - Installs the package in test directory
# - Runs basic validation tests
# - Leaves you in the test directory ready for more testing

# Additional manual testing (you're already in test directory after script)
npx claude-tdd-agents init            # Interactive mode
npx claude-tdd-agents init --minimal  # Minimal installation  
npx claude-tdd-agents --help          # Help information

# Return to main directory and cleanup when done
cd ../claude-code-sub-agent-collective
./scripts/cleanup-tests.sh # Removes test directories and tarballs
```

#### Testing Scripts Available
- `scripts/test-local.sh` - Automated package testing in dedicated `../npm-tests/` directory
- `scripts/cleanup-tests.sh` - Clean up test artifacts and directories (removes npm-tests when empty)

#### NPM Testing Directory Naming Standards

**MANDATORY NAMING CONVENTION**: All npm testing directories MUST follow the established pattern:

- **Manual testing**: `ccc-manual-v[N]` (e.g., `ccc-manual-v1`, `ccc-manual-v2`)
- **Automated testing**: `ccc-automated-v[N]` (e.g., `ccc-automated-v1`, `ccc-automated-v2`) 
- **Feature-specific testing**: `ccc-[feature]-v[N]` (e.g., `ccc-backup-test-v1`, `ccc-hooks-test-v1`)

**DO NOT** use arbitrary names like `test-backup-validation` or any other format. Always use the `ccc-*` prefix followed by descriptive name and version number.

### NPX Package Testing
```bash
# Test the NPX package locally (quick testing)
npx . init                 # Test installation from current directory
npx . status              # Test status command
npx . validate            # Test validation
```

## Key Development Files

### Core Implementation
- [`lib/index.js`](lib/index.js) - Main entry point and ClaudeCodeCollective class
- [`lib/installer.js`](lib/installer.js) - NPX installation logic
- [`lib/command-system.js`](lib/command-system.js) - Natural language command processing
- [`lib/AgentRegistry.js`](lib/AgentRegistry.js) - Agent management and lifecycle
- [`lib/AgentLifecycleManager.js`](lib/AgentLifecycleManager.js) - Manages agent state and transitions
- [`lib/AgentSpawner.js`](lib/AgentSpawner.js) - Handles agent creation and instantiation
- [`lib/configurator.js`](lib/configurator.js) - Handles configuration setup and management
- [`bin/claude-tdd-agents.js`](bin/claude-tdd-agents.js) - CLI interface

### Testing Infrastructure
- [`jest.config.js`](jest.config.js) - Jest configuration for comprehensive testing
- [`vitest.config.js`](templates/vitest.config.js) - Vitest configuration for fast iteration
- `tests/` - Main directory for all test files
- `tests/contracts/` - Contract validation tests
- `tests/handoffs/` - Agent handoff tests

### Templates and Distribution
- [`templates/`](templates/) - All installation templates (agents, hooks, configs)
- [`templates/CLAUDE.md`](templates/CLAUDE.md) - Behavioral system template
- [`templates/settings.json.template`](templates/settings.json.template) - Claude Code configuration template
- [`lib/file-mapping.js`](lib/file-mapping.js) - Template to destination mapping

## Development Workflow

### Branch-Based Testing Workflow

**Standard process for testing changes before merging:**

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # Make changes...
   git add . && git commit -m "feat: your changes"
   ```

2. **Test Locally** 
   ```bash
   ./scripts/test-local.sh
   # This creates ccc-testing-vN directory and tests your changes
   # Script shows version number to confirm you're testing your branch
   ```

3. **Manual Testing** (you'll be in test directory)
   ```bash
   # Non-interactive testing (for validation/CI)
   npx claude-tdd-agents init --yes --force
   npx claude-tdd-agents status  
   npx claude-tdd-agents validate
   
   # Interactive testing (for development)
   npx claude-tdd-agents init
   # Test all functionality you changed
   ```

4. **Fix Issues** (if any)
   ```bash
   cd ../claude-code-sub-agent-collective
   # Make fixes...
   git add . && git commit -m "fix: issue description"
   # Repeat from step 2
   ```

5. **Clean Up & Merge**
   ```bash
   ./scripts/cleanup-tests.sh  # Remove test artifacts
   git push -u origin feature/your-feature-name
   # Create PR, merge when approved
   ```

**Key Benefits:**
- Tests exact user installation experience
- Catches template/file mapping issues
- Verifies version changes work correctly
- No need to push to test (works locally)

### Adding New Agents
1. Create agent definition in `templates/agents/agent-name.md`
2. Update [`lib/file-mapping.js`](lib/file-mapping.js) to include in installation
3. Add contract tests in `tests/agents/`
4. Test via `npm run test:agents`

### Modifying Hooks
1. Edit hook scripts in `templates/hooks/`
2. Update [`templates/settings.json.template`](templates/settings.json.template) if needed
3. Test hook behavior with `npm run test:handoffs`
4. Validate with `npm run test:contracts`

### Testing Installation
1. Make changes to templates or core logic
2. Test locally: `npx . init --force`
3. Validate: `npx . validate`
4. Run full test suite: `npm test`

## Code Architecture Patterns

### Agent System
- **Agent Registry**: Centralized agent tracking and lifecycle management
- **Template System**: Handlebars-based template rendering for dynamic agent creation
- **Spawning System**: Dynamic agent instantiation with proper context loading

### Hook System  
- **Test-Driven Handoffs**: Automated validation of agent transitions
- **Behavioral Enforcement**: Hooks enforce TDD and routing requirements
- **Metrics Collection**: Automated data gathering for research hypotheses

### Command System
- **Natural Language Processing**: Converts user intent to structured commands
- **Namespace Routing**: `/collective`, `/agent`, `/gate`, `/van` command spaces
- **Auto-completion**: Context-aware command suggestions

## Testing Strategy

### Test Suites
1. **Unit Tests** (`tests/*.test.js`) - Core functionality
2. **Contract Tests** (`tests/contracts/`) - Agent handoff validation
3. **Integration Tests** (`tests/handoffs/`) - End-to-end workflows
4. **Installation Tests** - NPX package validation

### Test Execution
- **Vitest**: Fast iteration during development (`npm test`)
- **Jest**: Comprehensive validation (`npm run test:jest`)
- **Coverage**: Track test coverage (`npm run test:coverage`)

### Quality Gates
- All tests must pass before releases
- Contract validation ensures agent compatibility
- Installation tests verify NPX package integrity

## Important Notes

### Development Environment
- **Node.js**: >= 16.0.0 required
- **Dependencies**: Use `npm install` not `yarn`
- **Testing**: Both Vitest and Jest configured for different use cases

### Release Process
1. Update version in `package.json`
2. Run full test suite: `npm run test:jest`
3. Test NPX installation: `npx . init --force`
4. Update `CHANGELOG.md` with changes
5. Commit and tag release

### File Management
- Never manually edit generated files in `.claude/` or `.claude-collective/`
- Template changes must be tested through full installation cycle
- Agent definitions follow strict markdown format requirements

### TDD Requirements
- All new functionality must have tests first
- Agent handoffs must include contract validation
- Behavioral changes require integration test updates

### Standards Compliance

**CRITICAL**: Do not modify established standards without explicit permission. This includes:

- **Naming conventions** (testing directories, file patterns, etc.)
- **Code formatting standards** 
- **Testing procedures and workflows**
- **Documentation structure**
- **Git workflow patterns**
- **Release processes**

When in doubt, follow existing patterns exactly. Ask for clarification before deviating from any established standard.

### NPM Version Release Automation

**When user says "npm version [patch|minor|major]":**
- Always use a proper commit message based on recent changes
- Check git log for recent features/fixes to craft meaningful message
- Use format: `npm version patch -m "chore: release v%s - [summary of changes]"`
- Example: `npm version patch -m "chore: release v%s - fix CI race conditions and add comprehensive testing"`
- Never use the default "2.0.7" commit message

This codebase implements a sophisticated agent collective system with strong TDD enforcement and intelligent routing capabilities.


# CLAUDE.md(CN)

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概览

这是 **Claude Code 子代理集合** ——一个通过 NPX 分发的框架，它为以测试驱动开发（TDD）为核心的开发工作流安装专门的 AI 代理、钩子和行为系统。该系统通过自动化的交接验证来强制执行测试驱动开发，并通过中心辐射型架构提供智能任务路由。

## 关键代码库信息

**Git 远程 URL:** https://github.com/ZHUBoer/claude-code-sub-agent-collective.git
**切勿更改此 URL** - 所有 Git 操作都必须使用这个确切的代码库 URL。

## 架构

### 核心系统
- **中心辐射型架构**，以 `@routing-agent` 作为中央协调器
- **行为操作系统**，在 CLAUDE.md 中定义，包含主要指令
- **测试驱动的交接**，在代理之间进行合约验证
- **即时上下文加载**，以最小化内存使用

### 关键组件
- **NPX 包**: `claude-tdd-agents` - 可通过 `npx claude-tdd-agents init` 安装
- **代理系统**: 30多个专用代理位于 `templates/agents/`
- **钩子系统**: TDD 强制执行钩子位于 `templates/hooks/`
- **命令系统**: 自然语言 + 结构化命令位于 `lib/command-*.js`
- **指标框架**: 研究假设跟踪位于 `lib/metrics/`
- **模板系统**: 安装模板位于 `templates/`

## 基本命令

### 开发
```bash
# 运行测试 (主测试套件)
npm test                    # Vitest 测试
npm run test:jest          # Jest 测试 (全面)
npm run test:coverage      # 覆盖率报告

# 运行特定测试套件  
npm run test:contracts     # 合约验证测试
npm run test:handoffs      # 代理交接测试
npm run test:agents        # 代理系统测试

# 包管理
npm run install-collective # 安装到当前目录
npm run validate          # 验证安装
npm run metrics:report    # 查看指标数据
```

### 本地测试工作流

用于在发布前测试变更 (参见 ai-docs/Simple-Local-Testing-Workflow.md):

```bash
# 自动化测试 (自动完成所有操作)
./scripts/test-local.sh
# 此脚本会自动执行以下操作：
# - 创建包 (.tgz 文件)  
# - 创建测试目录 ../npm-tests/ccc-testing-vN (自动编号)
# - 在测试目录中安装包
# - 运行基本验证测试
# - 将您留在测试目录中，以准备进行更多测试

# 额外的手动测试 (脚本运行后您已在测试目录中)
npx claude-tdd-agents init            # 交互模式
npx claude-tdd-agents init --minimal  # 最小化安装  
npx claude-tdd-agents --help          # 帮助信息

# 完成后返回主目录并进行清理
cd ../taskmaster-agent-claude-code
./scripts/cleanup-tests.sh # 删除测试目录和 tarball 文件
```

#### 可用的测试脚本
- `scripts/test-local.sh` - 在专用的 `../npm-tests/` 目录中进行自动化包测试
- `scripts/cleanup-tests.sh` - 清理测试产物和目录 (当 `npm-tests` 目录为空时会将其删除)

#### NPM 测试目录命名标准

**强制命名约定**：所有 NPM 测试目录都必须遵循既定模式：

- **手动测试**: `ccc-manual-v[N]` (例如, `ccc-manual-v1`, `ccc-manual-v2`)
- **自动化测试**: `ccc-automated-v[N]` (例如, `ccc-automated-v1`, `ccc-automated-v2`) 
- **特定功能测试**: `ccc-[feature]-v[N]` (例如, `ccc-backup-test-v1`, `ccc-hooks-test-v1`)

**请勿**使用任意名称，如 `test-backup-validation` 或任何其他格式。始终使用 `ccc-*` 前缀，后跟描述性名称和版本号。

### NPX 包测试
```bash
# 本地测试 NPX 包 (快速测试)
npx . init                 # 从当前目录测试安装
npx . status              # 测试 status 命令
npx . validate            # 测试 validation 命令
```

## 关键开发文件

### 核心实现
- `lib/index.js` - 主入口点和 `ClaudeCodeCollective` 类
- `lib/installer.js` - NPX 安装逻辑
- `lib/command-system.js` - 自然语言命令处理
- `lib/AgentRegistry.js` - 代理管理和生命周期
- `bin/claude-tdd-agents.js` - CLI 界面

### 测试基础设施
- `jest.config.js` - 用于全面测试的 Jest 配置
- `vitest.config.js` - 用于快速迭代的 Vitest 配置
- `tests/setup.js` - 测试环境设置
- `tests/contracts/` - 合约验证测试
- `tests/handoffs/` - 代理交接测试

### 模板和分发
- `templates/` - 所有安装模板 (代理、钩子、配置)
- `templates/CLAUDE.md` - 行为系统模板
- `templates/settings.json` - Claude Code 配置模板
- `lib/file-mapping.js` - 模板到目标文件的映射

## 开发工作流

### 基于分支的测试工作流

**在合并前测试变更的标准流程：**

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 进行更改...
   git add . && git commit -m "feat: your changes"
   ```

2. **本地测试** 
   ```bash
   ./scripts/test-local.sh
   # 这会创建 ccc-testing-vN 目录并测试您的更改
   # 脚本会显示版本号，以确认您正在测试您的分支
   ```

3. **手动测试** (您将位于测试目录中)
   ```bash
   # 非交互式测试 (用于验证/CI)
   npx claude-tdd-agents init --yes --force
   npx claude-tdd-agents status  
   npx claude-tdd-agents validate
   
   # 交互式测试 (用于开发)
   npx claude-tdd-agents init
   # 测试您更改的所有功能
   ```

4. **修复问题** (如果有)
   ```bash
   cd ../taskmaster-agent-claude-code
   # 进行修复...
   git add . && git commit -m "fix: issue description"
   # 从第2步重复
   ```

5. **清理并合并**
   ```bash
   ./scripts/cleanup-tests.sh  # 删除测试产物
   git push -u origin feature/your-feature-name
   # 创建 PR，批准后合并
   ```

**主要优点：**
- 测试确切的用户安装体验
- 捕获模板/文件映射问题
- 验证版本变更是否正常工作
- 无需推送到远程仓库即可在本地进行测试

### 添加新代理
1. 在 `templates/agents/agent-name.md` 中创建代理定义
2. 更新 `lib/file-mapping.js` 以便在安装时包含该代理
3. 在 `tests/agents/` 中添加合约测试
4. 通过 `npm run test:agents` 进行测试

### 修改钩子
1. 在 `templates/hooks/` 中编辑钩子脚本
2. 如果需要，更新 `templates/settings.json`
3. 使用 `npm run test:handoffs` 测试钩子行为
4. 使用 `npm run test:contracts` 进行验证

### 测试安装
1. 对模板或核心逻辑进行更改
2. 本地测试: `npx . init --force`
3. 验证: `npx . validate`
4. 运行完整测试套件: `npm test`

## 代码架构模式

### 代理系统
- **代理注册表**: 集中式的代理跟踪和生命周期管理
- **模板系统**: 基于 Handlebars 的模板渲染，用于动态创建代理
- **生成系统**: 动态代理实例化并加载适当的上下文

### 钩子系统  
- **测试驱动的交接**: 代理转换的自动化验证
- **行为强制**: 钩子强制执行 TDD 和路由要求
- **指标收集**: 为研究假设自动收集数据

### 命令系统
- **自然语言处理**: 将用户意图转换为结构化命令
- **命名空间路由**: `/collective`、`/agent`、`/gate`、`/van` 命令空间
- **自动补全**: 上下文感知的命令建议

## 测试策略

### 测试套件
1. **单元测试** (`tests/*.test.js`) - 测试核心功能
2. **合约测试** (`tests/contracts/`) - 代理交接验证
3. **集成测试** (`tests/handoffs/`) - 端到端工作流
4. **安装测试** - NPX 包验证

### 测试执行
- **Vitest**: 用于开发期间的快速迭代 (`npm test`)
- **Jest**: 用于全面验证 (`npm run test:jest`)
- **覆盖率**: 跟踪测试覆盖率 (`npm run test:coverage`)

### 质量门禁
- 发布前所有测试必须通过
- 合约验证确保代理兼容性
- 安装测试验证 NPX 包的完整性

## 重要说明

### 开发环境
- **Node.js**: 需要 >= 16.0.0 版本
- **依赖**: 使用 `npm install` 而不是 `yarn`，如果权限不足，可以使用 `npm ci`
- **测试**: Vitest 和 Jest 均已配置，用于不同的使用场景

### 发布流程
1. 更新 `package.json` 中的版本号
2. 运行完整测试套件: `npm run test:jest`
3. 测试 NPX 安装: `npx . init --force`
4. 在 `CHANGELOG.md` 中记录变更
5. 提交并为发布版本打上标签

### 文件管理
- 切勿手动编辑 `.claude/` 或 `.claude-collective/` 中生成的文件
- 模板的更改必须通过完整的安装周期进行测试
- 代理定义遵循严格的 Markdown 格式要求

### TDD 要求
- 所有新功能必须先编写测试
- 代理交接必须包含合约验证
- 行为变更需要更新集成测试

### 标准合规性

**关键**：未经明确许可，请勿修改既定标准。这包括：

- **命名约定** (测试目录、文件模式等)
- **代码格式化标准** 
- **测试程序和工作流**
- **文档结构**
- **Git 工作流模式**
- **发布流程**

如有疑问，请严格遵循现有模式。在偏离任何既定标准之前，请先寻求澄清。

### NPM 版本发布自动化

**当用户输入 "npm version [patch|minor|major]" 时：**
- 务必根据最近的更改撰写恰当的提交信息
- 检查 Git 日志以获取最近的功能/修复，从而撰写有意义的信息
- 使用格式: `npm version patch -m "chore: release v%s - [变更摘要]"`
- 示例: `npm version patch -m "chore: release v%s - 修复 CI 竞争条件并添加全面测试"`
- 切勿使用默认的 "2.0.7" 提交信息

此代码库实现了一个复杂的代理集合系统，具有强大的 TDD 强制执行和智能路由功能。
