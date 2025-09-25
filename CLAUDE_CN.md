# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概览

这是 **Claude Code 子代理集合** ——一个通过 NPX 分发的框架，它为以测试驱动开发（TDD）为核心的开发工作流安装专门的 AI 代理、钩子和行为系统。该系统通过自动化的交接验证来强制执行测试驱动开发，并通过中心辐射型架构提供智能任务路由。

## 关键代码库信息

**Git 远程 URL:** https://github.com/ZHUBoer/claude-tdd-agents.git
**切勿更改此 URL** - 所有 Git 操作都必须使用这个确切的代码库 URL。

## 架构

### 核心系统

- **中心辐射型架构**，以 `@routing-agent` 作为中央协调器
- **行为操作系统**，在 CLAUDE.md 中定义，包含主要指令
- **测试驱动的交接**，在代理之间进行合约验证
- **即时上下文加载**，以最小化内存使用

### 关键组件

- **NPX 包**: `claude-tdd-agents` - 可通过 `npx claude-tdd-agents init` 安装
- **代理系统**: 30 多个专用代理位于 `templates/agents/`
- **钩子系统**: TDD 强制执行钩子位于 `templates/hooks/`
- **命令系统**: 自然语言 + 结构化命令位于 `lib/command-*.js`
- **指标框架**: 研究假设跟踪位于 `lib/metrics/`
- **模板系统**: 安装模板位于 `templates/`

## 基本命令

### 开发

```bash
# 运行测试 (主测试套件)
npm test                    # Jets 测试 (全面)
npm run test:vitest          # vitest 测试
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

- **Vitest**: 用于开发期间的快速迭代 (`npm run test:vitest`)
- **Jest**: 用于全面验证 (`npm test`)
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
2. 运行完整测试套件: `npm test`
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

## Router-first 协议（对 Claude Code 强制）

所有请求必须先进入 `@routing-agent`。Hub 控制器不应自行启发式选择子代理，而应遵循如下流程：

1. 将任务/请求上下文提供给 `@routing-agent`。
2. 期望严格 JSON 输出，字段包含：`sub_agents[]`、`route_type`、`confidence`、`reason`、`candidates[]`、`quality_gates`、`next_action`。
3. 若 `confidence < 0.7` 或 `next_action ∈ {unknown, clarify}`：
   - 提出 1–2 个最小化澄清问题，或回退到安全默认（如 `research-agent`）。
4. 若 `sub_agents` 非空且 `next_action=route`：
   - 将任务委派给所列代理（单个或多个）。当任务相互独立时可并行；否则按序执行。
5. 若 `quality_gates=true`，在接受完成前强制质量门禁。

建议置信度阈值：`0.7`。控制器必须把非 JSON 或不符合 Schema 的输出视为无效，并要求路由代理重新输出合法 JSON。

### 控制器向路由代理的示例提示

```
你是 routing-agent。仅进行分类与分配。返回严格 JSON，字段：sub_agents, route_type, confidence, reason, candidates, quality_gates, next_action。
任务：<插入任务摘要/上下文>
Agent 目录：<插入精简目录或 Top-K 候选>
```

### 解析与执行规则

- 对畸形 JSON 直接拒绝，并要求重发。
- 当返回多个 `sub_agents` 时，只有在相互独立时才并行，否则串行并设置检查点。
- 当无合适代理或置信度较低时，优先路由至 `research-agent` 进行范围界定。
