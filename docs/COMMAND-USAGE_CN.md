# Claude Code Agents - 命令系统使用指南

## 概述

Claude Code Agents 命令系统为控制多智能体编排系统提供了自然语言和结构化命令两种接口。本指南涵盖了所有可用命令、使用模式和最佳实践。

## 快速入门

### 基本命令

```bash
# 检查系统状态
/collective status

# 列出可用智能体
/agent list

# 验证质量门
/gate status

# 获取帮助
/collective help
```

### 自然语言命令

```bash
# 这些命令和结构化命令一样有效
show me the system status
list all available agents
validate the quality gates
help me understand the routing system
```

## 命令命名空间

### `/collective` - 系统协调

`collective` 命名空间处理系统范围的操作和协调。

#### `/collective status [--verbose]`

显示整体系统健康状况和状态。

**示例:**

```bash
/collective status
/collective status --verbose
```

**自然语言:**

- "show system status" (显示系统状态)
- "how is the collective doing" (系统群运行得怎么样)
- "check system health" (检查系统健康状况)

#### `/collective route <request>`

使用智能选择将请求路由到适当的智能体。

**示例:**

```bash
/collective route create a button component
/collective route implement user authentication
/collective route fix failing tests --skip-test
```

**自然语言:**

- "route create a login form to the right agent" (将创建登录表单的任务路由到正确的智能体)
- "send this task to the appropriate agent: build a todo app" (将这个任务发送给合适的智能体：构建一个待办事项应用)

#### `/collective agents [--detailed]`

列出系统群中所有可用的智能体。

**示例:**

```bash
/collective agents
/collective agents --detailed
```

#### `/collective metrics [--detailed]`

显示系统群性能指标和假设验证。

**示例:**

```bash
/collective metrics
/collective metrics --detailed
```

#### `/collective validate [phase] [--strict]`

验证系统群的系统完整性。

**示例:**

```bash
/collective validate
/collective validate system --strict
/collective validate agents
```

#### `/collective help [topic]`

显示 `collective` 命令的帮助信息。

**示例:**

```bash
/collective help
/collective help route
/collective help metrics
```

### `/agent` - 智能体管理

`agent` 命名空间处理单个智能体的操作和管理。

#### `/agent list [--detailed]`

列出所有可用智能体及其当前状态。

**示例:**

```bash
/agent list
/agent list --detailed
```

**自然语言:**

- "show me all agents" (给我看所有智能体)
- "list available agents" (列出可用智能体)
- "what agents do we have" (我们有哪些智能体)

#### `/agent spawn <type> [specialization] [--template] [--skip-contract]`

创建一个新的专用智能体实例。

**可用类型:**

- `component` - UI 组件开发
- `feature` - 业务逻辑实现
- `testing` - 测试创建和验证
- `research` - 技术研究和文档
- `infrastructure` - 构建系统和工具
- `behavioral-transformation` - CLAUDE.md 行为系统

**示例:**

```bash
/agent spawn testing integration
/agent spawn component --template=custom
/agent spawn feature authentication --skip-contract
```

**自然语言:**

- "spawn a testing agent for integration work" (生成一个用于集成工作的测试智能体)
- "create a component agent" (创建一个组件智能体)
- "I need a new research agent" (我需要一个新的研究智能体)

#### `/agent status <id> [--verbose]`

显示特定智能体的详细状态。

**示例:**

```bash
/agent status routing-agent
/agent status testing-implementation-agent --verbose
```

#### `/agent route <request>`

测试路由逻辑，而不实际执行请求。

**示例:**

```bash
/agent route create a button component
/agent route fix authentication bug
```

#### `/agent health [id] [--verbose]`

检查智能体的健康状况和性能指标。

**示例:**

```bash
/agent health
/agent health routing-agent --verbose
```

#### `/agent handoff <from> <to> [--skip-test]`

在两个智能体之间执行手动交接。

**示例:**

```bash
/agent handoff component-agent testing-agent
/agent handoff routing-agent feature-agent --skip-test
```

#### `/agent help [topic]`

显示 `agent` 命令的帮助信息。

**示例:**

```bash
/agent help
/agent help spawn
/agent help handoff
```

### `/gate` - 质量门强制执行

`gate` 命名空间处理质量门验证和合规性。

#### `/gate status [--verbose]`

显示质量门状态和合规级别。

**示例:**

```bash
/gate status
/gate status --verbose
```

**自然语言:**

- "check quality gates" (检查质量门)
- "show gate status" (显示质量门状态)
- "are all gates passing" (所有质量门都通过了吗)

#### `/gate validate [phase] [--strict]`

验证特定阶段的质量门要求。

**可用阶段:**

- `planning` - 规划阶段验证
- `infrastructure` - 基础设施设置验证
- `implementation` - 实现质量验证
- `testing` - 测试覆盖率和质量验证
- `polish` - 代码质量和文档验证
- `completion` - 最终交付验证

**示例:**

```bash
/gate validate
/gate validate implementation --strict
/gate validate testing
```

#### `/gate bypass <gate> <reason> [--emergency]`

紧急质量门绕过（请极其谨慎使用）。

**示例:**

```bash
/gate bypass testing-gate "关键修补程序部署"
/gate bypass completion-gate "安全紧急补丁" --emergency
```

#### `/gate history [limit]`

显示质量门验证历史记录。

**示例:**

```bash
/gate history
/gate history 20
```

#### `/gate help [topic]`

显示 `gate` 命令的帮助信息。

**示例:**

```bash
/gate help
/gate help bypass
/gate help validate
```

## 命令别名

为方便起见，提供以下别名：

```bash
/c → /collective
/a → /agent
/g → /gate
/status → /collective status
/route → /collective route
/spawn → /agent spawn
```

## 自然语言支持

命令系统能理解自然语言指令并将其转换为适当的命令：

### 状态查询

- "show status" → `/collective status`
- "how are things" → `/collective status`
- "system health check" → `/collective status --verbose`

### 智能体操作

- "list agents" → `/agent list`
- "show available agents" → `/agent list --detailed`
- "spawn testing agent" → `/agent spawn testing`
- "create component agent" → `/agent spawn component`

### 质量门操作

- "check gates" → `/gate status`
- "validate gates" → `/gate validate`
- "gate compliance" → `/gate status --verbose`

### 路由操作

- "route this task" → `/collective route`
- "send to agent" → `/collective route`
- "delegate work" → `/collective route`

## 高级功能

### 命令历史

访问您最近的命令历史：

```bash
/collective history
/collective history 20
```

### 系统指标

监控系统性能：

```bash
/collective metrics --detailed
/agent metrics routing-agent
```

### 批量操作

执行多个命令（通过命令系统 API）：

```javascript
const commands = ["/collective status", "/agent list", "/gate validate"];
await commandSystem.executeBatch(commands);
```

### 导出数据

导出命令历史和指标：

```javascript
// JSON 导出
const jsonData = await commandSystem.exportData("json");

// Markdown 报告
const report = await commandSystem.exportData("markdown");
```

## 性能与优化

### 响应时间预期

- 简单命令：< 50ms
- 复杂路由：< 200ms
- 系统验证：< 500ms

### 自动完成

- 所有命令均支持 Tab 键自动完成
- 基于上下文的智能建议
- 用于拼写纠错的模糊匹配

### 缓存

- 命令建议被缓存
- 最近命令被缓存以便快速访问
- 系统状态被缓存以提供上下文相关的帮助

## 最佳实践

### 1. 定期状态检查

定期监控系统健康状况：

```bash
/collective status --verbose
```

### 2. 恰当的智能体管理

- 在生成新智能体之前先列出现有智能体
- 定期检查智能体健康状况
- 使用适当的专业领域

### 3. 遵守质量门

- 在执行主要操作前验证质量门
- 对生产部署使用严格模式
- 为所有绕过操作记录清晰的理由

### 4. 高效路由

- 使用描述性的任务说明
- 让系统选择最佳智能体
- 监控路由成功率

### 5. 使用帮助

- 使用 `/help` 获取一般指导
- 使用特定帮助获取详细信息
- 在不确定时尝试使用自然语言

## 故障排查

### 常见问题

**命令无法识别**

```bash
# 检查拼写并尝试建议
/collective status
# 或使用自然语言
show system status
```

**智能体未找到**

```bash
# 首先列出可用智能体
/agent list
# 然后通过正确的 ID 引用
/agent status routing-agent
```

**质量门验证失败**

```bash
# 检查详细状态
/gate status --verbose
# 查看特定阶段的要求
/gate validate implementation --strict
```

**响应时间慢**

```bash
# 检查系统指标
/collective metrics
# 运行维护
/collective maintain --repair
```

### 错误恢复

系统提供有用的错误消息和建议：

- 拼写纠错建议
- 可用的备选命令
- 上下文敏感的帮助
- 失败命令的使用示例

## 集成示例

### 工作流自动化

```bash
# 检查系统就绪状态
/collective status

# 验证环境
/gate validate planning

# 路由开发任务
/collective route "implement user dashboard"

# 监控进度
/agent status component-implementation-agent

# 验证完成情况
/gate validate implementation
```

### 调试会话

```bash
# 检查整体健康状况
/collective status --verbose

# 列出有问题的智能体
/agent health --verbose

# 查看最近的失败记录
/collective history 10

# 运行系统维护
/collective maintain --repair
```

### 质量保证

```bash
# 验证所有质量门
/gate status --verbose

# 运行系统测试
/collective test --coverage

# 生成合规报告
/gate report --format=markdown

# 导出指标
/collective metrics --detailed
```

## API 集成

如需以编程方式访问，请使用 `CommandSystem` 类：

```javascript
const CommandSystem = require("./lib/command-system");

const commandSystem = new CommandSystem({
  enableMetrics: true,
  enableAutocomplete: true,
  performanceThreshold: 100,
});

// 执行命令
const result = await commandSystem.executeCommand("/collective status");

// 获取建议
const suggestions = commandSystem.getSuggestions("/agent sp");

// 访问历史记录
const history = commandSystem.getCommandHistory(10);

// 获取帮助
const help = commandSystem.getHelp("collective route");
```

## 结论

Claude Code Agents 命令系统为管理多智能体编排系统提供了一个强大、直观的界面。无论您偏好结构化命令还是自然语言，该系统都能适应您的工作风格，同时保持复杂操作所需的精确性。

如需额外帮助：

- 输入 `/help` 获取一般性帮助
- 对任何命令使用 `--help` 获取具体指导
- 当命令感觉复杂时，尝试使用自然语言替代方案
- 利用自动完成功能进行发现和提高效率

系统会从您的使用模式中学习，以便随着时间的推移提供越来越相关的建议和更快的命令执行速度。
