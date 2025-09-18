# claude tdd agents - 用户指南

## 🚀 快速入门

### 安装

使用一个简单的命令即可在任何项目中安装claude-tdd-agents：

```bash
npx claude-tdd-agents init
```

**安装选项：**
```bash
# 完整安装（推荐）
npx claude-tdd-agents init

# 最小化安装（仅包含核心智能体）
npx claude-tdd-agents init --minimal

# 交互式配置
npx claude-tdd-agents init --interactive

# 仅安装测试框架
npx claude-tdd-agents init --testing-only

# 仅安装钩子系统
npx claude-tdd-agents init --hooks-only
```

### 验证

验证您的安装是否成功：
```bash
npx claude-tdd-agents status
npx claude-tdd-agents validate
```

## 🎯 核心概念

### 中心-辐射型架构 (Hub-and-Spoke)

本系统采用**中心-辐射型**的协调模式：
- **中心 (Hub)**：`@routing-agent` - 作为中央协调点。
- **辐射 (Spokes)**：执行不同任务的专业化智能体。
- **工作流**：所有请求均首先流向中心，再由中心分发给合适的辐射智能体。

### 行为操作系统

系统遵循 `CLAUDE.md` 中定义的行为指令进行运作：
1. **绝不直接实现** - 始终通过专业化智能体进行路由。
2. **集体路由协议** - 必须通过中央协调中心进行任务分发。
3. **测试驱动验证** - 每一次任务移交都需通过预定义的“合约”进行验证。

## 💬 命令系统

### 自然语言命令

系统能够理解自然语言，并将其转换为结构化的命令：

```bash
# 自然语言到命令的转换示例
"show system status"           → /collective status
"list all available agents"    → /agent list
"validate quality gates"       → /gate validate
"spawn a testing agent"        → /agent spawn testing
"check system health"          → /van check
"route this to research agent" → /collective route research
```
*（注：为清晰起见，此处保留了英文原文以作对比。）*

### 直接命令接口

#### `/collective` - 系统管理
```bash
/collective status              # 显示系统整体健康状况
/collective agents              # 列出所有可用的智能体
/collective route <request>     # 将请求路由至合适的智能体
/collective metrics             # 显示性能指标
/collective validate            # 运行系统验证
/collective help                # 显示命令帮助
```

#### `/agent` - 智能体管理
```bash
/agent list                    # 列出所有智能体
/agent spawn <type> [params]   # 创建新的智能体实例
/agent status <name>           # 显示特定智能体的状态
/agent route <request>         # 测试路由逻辑
/agent help                    # 显示智能体相关的命令帮助
```

#### `/gate` - 质量门
```bash
/gate status                   # 显示质量门的状态
/gate validate [phase]         # 运行指定阶段的验证
/gate bypass <gate> <reason>   # 在紧急情况下绕过某个质量门
/gate history                  # 查看质量门验证历史
/gate help                     # 显示质量门相关的命令帮助
```

#### `/van` - 维护系统
```bash
/van check                     # 运行健康检查
/van repair                    # 自动修复检测到的问题
/van optimize                  # 执行性能优化
/van full                      # 执行完整的维护流程
/van report                    # 生成维护报告
/van schedule                  # 配置计划性维护任务
/van help                      # 显示维护相关的命令帮助
```

### 命令别名

常用操作的快捷方式：
```bash
# 短别名
/c status      # 等同于 /collective status
/a list        # 等同于 /agent list  
/g validate    # 等同于 /gate validate
/v check       # 等同于 /van check

# 超短别名
/status        # 等同于 /collective status
/route         # 等同于 /collective route
/spawn         # 等同于 /agent spawn
```

## 🤖 使用智能体

### 可用的专业化智能体

**核心协调：**
- `routing-agent` - 中央枢纽协调器
- `enhanced-project-manager-agent` - 多阶段项目管理器

**实现专家：**
- `behavioral-transformation-agent` - 负责 `CLAUDE.md` 行为操作系统的实现
- `testing-implementation-agent` - 负责 Jest 框架和 TDD
- `hook-integration-agent` - 负责指令强制执行脚本
- `npx-package-agent` - 负责 NPX 分发包
- `command-system-agent` - 负责自然语言解析
- `metrics-collection-agent` - 负责研究验证
- `dynamic-agent-creator` - 负责运行时智能体的生成
- `van-maintenance-agent` - 负责自我修复的生态系统

**跨领域支持：**
- `research-agent` - 负责技术研究和分析
- `quality-agent` - 负责代码审查和验证
- `component-implementation-agent` - 负责 UI 组件的实现
- `feature-implementation-agent` - 负责业务逻辑的实现
- `infrastructure-implementation-agent` - 负责构建系统的实现

### 智能体路由示例

```bash
# 路由复杂请求
/collective route "我需要使用 OAuth2 实现用户认证"
# → 将路由至 @feature-implementation-agent 或 @research-agent

# 路由 UI 请求
/collective route "创建一个带验证功能的登录表单组件"
# → 将路由至 @component-implementation-agent

# 路由研究请求
/collective route "处理 WebSocket 连接的最佳实践是什么？"
# → 将路由至 @research-agent

# 路由质量请求
/collective route "请审查此代码是否存在安全问题"
# → 将路由至 @quality-agent
```

### 动态创建智能体

按需创建专业化的智能体：

```bash
# 使用模板生成智能体
/agent spawn research data-analysis
/agent spawn testing integration
/agent spawn implementation frontend

# 交互式地创建智能体
/agent spawn --interactive

# 克隆现有的智能体
/agent spawn --clone existing-agent-id --name new-agent
```

## 📊 研究与指标

### 研究假设

系统旨在验证三个核心假设：

**H1：JIT 上下文加载**
- **理论**：按需加载比预加载更有效率。
- **指标**：加载时间、内存使用量、上下文相关性。
- **目标**：加载时间减少 30%，内存节省 25%。

**H2：中心-辐射型协调**  
- **理论**：集中式路由优于分布式通信。
- **指标**：路由准确率、协调开销、错误率。
- **目标**：路由准确率达到 90%，协调开销低于 10%。

**H3：测试驱动开发**
- **理论**：基于合约的移交能够提升质量。
- **指标**：成功率、错误检测率、验证覆盖率。
- **目标**：移交成功率达到 80%，验证覆盖率达到 95%。

### 访问指标

```bash
# 查看指标仪表板
/collective metrics

# 查看详细的研究数据
/collective metrics --detailed

# 导出指标以供分析
/collective metrics --export research-data.json
```

## 🛠️ 维护与健康

### 系统健康监控

```bash
# 快速健康检查
/van check

# 详细的健康报告
/van check --detailed

# 对特定组件进行检查
/van check --component hooks
/van check --component agents
/van check --component tests
```

### 自动修复系统

```bash
# 自动修复常见问题
/van repair

# 模拟运行（显示将要执行的修复操作）
/van repair --dry-run

# 修复特定问题
/van repair --missing-files
/van repair --permissions
/van repair --configurations
```

### 性能优化

```bash
# 运行优化程序
/van optimize

# 执行特定的优化操作
/van optimize --cache-cleanup
/van optimize --test-optimization
/van optimize --agent-archival
/van optimize --metrics-cleanup
```

### 计划性维护

```bash
# 查看维护计划
/van schedule

# 配置自动化维护任务
/van schedule --hourly health-check
/van schedule --daily full-maintenance
/van schedule --weekly optimization
```

## 🧪 测试与验证

### 运行测试

```bash
# 系统验证
/collective validate

# 质量门验证
/gate validate

# 特定组件的测试
/gate validate --phase behavioral
/gate validate --phase testing
/gate validate --phase hooks
```

### 测试驱动的移交 (TDH)

系统对所有智能体交互均使用基于合约的验证：

```bash
# 查看移交合约
ls .claude-collective/tests/contracts/

# 手动执行合约验证
/gate validate --contracts

# 查看移交成功相关的指标
/collective metrics --handoffs
```

## 🔧 配置

### 设置管理

主要配置文件：
- `.claude/settings.json` - 钩子配置
- `CLAUDE.md` - 行为操作系统
- `.claude/agents/` - 智能体定义
- `.claude-collective/` - 测试框架

### 自定义

```bash
# 查看当前配置
npx claude-tdd-agents status --config

# 更新安装
npx claude-tdd-agents update

# 修复损坏的安装
npx claude-tdd-agents repair

# 清理安装（重置为默认设置）
npx claude-tdd-agents clean --confirm
```

## 🚨 故障排查

### 常见问题

**命令未找到：**
```bash
# 检查安装状态
npx claude-tdd-agents status

# 如有需要，强制重新安装
npx claude-tdd-agents init --force
```

**钩子不工作：**
```bash
# 检查钩子状态
/van check --component hooks

# 修复钩子文件权限
/van repair --permissions

# 注意：对钩子的更改需要重启 Claude Code
```

**智能体路由问题：**
```bash
# 测试路由逻辑
/agent route "test request"

# 检查智能体注册表
/agent list --detailed

# 验证智能体定义
/gate validate --agents
```

**性能问题：**
```bash
# 运行优化
/van optimize

# 检查系统性能健康状况
/van check --performance

# 查看资源使用情况
/collective metrics --resources
```

### 获取帮助

```bash
# 获取特定命令的帮助信息
/collective help
/agent help  
/gate help
/van help

# 系统诊断
npx claude-tdd-agents validate --verbose

# 生成用于技术支持的报告
/van report --support
```

### 验证命令

```bash
# 全面系统验证
/collective validate --comprehensive

# 组件验证
/gate validate --component behavioral
/gate validate --component testing  
/gate validate --component hooks
/gate validate --component distribution
/gate validate --component commands
/gate validate --component metrics
/gate validate --component agents
/gate validate --component maintenance
```

## 🌍 分发与共享

### NPX 包

本系统通过 NPX 包进行分发，以简化安装过程：

```bash
# 任何人都可以使用以下命令进行安装：
npx claude-tdd-agents init

# 查看包信息
npm info claude-tdd-agents

# 版本管理
npx claude-tdd-agents@latest init
```

### 项目集成

```bash
# 添加到现有项目
cd your-project
npx claude-tdd-agents init

# 集成验证
npx claude-tdd-agents validate --integration
```

## 📈 高级用法

### 研究模式

启用详细的指标收集功能：

```bash
# 启用研究模式跟踪
/collective metrics --research-mode on

# 配置实验跟踪
/collective metrics --experiment "feature-comparison"

# 导出研究数据
/collective metrics --export --format research
```

### 自定义智能体模板

创建您自己的智能体模板：

```bash
# 创建自定义模板
/agent template create my-custom-agent

# 使用自定义模板
/agent spawn my-custom-agent specialized-task

# 共享模板
/agent template export my-custom-agent
```

### 性能监控

```bash
# 实时性能监控
/collective metrics --live

# 性能分析
/van check --profile

# 资源优化
/van optimize --resources
```

---

## 🎯 快速参考

### 核心命令
```bash
# 安装
npx claude-tdd-agents init

# 健康检查
/van check

# 路由请求
/collective route "<你的请求>"

# 系统验证
/collective validate

# 获取帮助
/<namespace> help
```

### 关键文件
- `CLAUDE.md` - 行为操作系统
- `.claude/settings.json` - 钩子配置
- `.claude/agents/` - 智能体定义
- `.claude-collective/` - 测试框架

### 技术支持
- 系统验证：`/collective validate`
- 健康诊断：`/van check --detailed`
- 支持报告：`/van report --support`

claude tdd agents 提供了一个强大的、具备自我修复能力的生态系统，专为 AI 辅助开发而设计，其核心能力包括中心-辐射型协调、自然语言界面以及全面的研究验证功能。