# Task Master AI - Agent 集成指南

## 核心命令

### 核心工作流命令

```bash
# 项目设置
task-master init                                    # 在当前项目中初始化 Task Master
task-master parse-prd .taskmaster/docs/prd.txt      # 从产品需求文档(PRD)生成任务
task-master models --setup                        # 交互式配置 AI 模型

# 日常开发工作流
task-master list                                   # 显示所有任务及其状态
task-master next                                   # 获取下一个待办任务
task-master show <id>                             # 查看任务详情 (例如: task-master show 1.2)
task-master set-status --id=<id> --status=done    # 标记任务为完成状态

# 任务管理
task-master add-task --prompt="description" --research        # 在 AI 辅助下添加新任务
task-master expand --id=<id> --research --force              # 将任务分解为子任务
task-master update-task --id=<id> --prompt="changes"         # 更新指定任务
task-master update --from=<id> --prompt="changes"            # 从指定 ID 开始更新后续多个任务
task-master update-subtask --id=<id> --prompt="notes"        # 为子任务添加实现笔记

# 分析与规划
task-master analyze-complexity --research          # 分析任务复杂度
task-master complexity-report                      # 查看复杂度分析报告
task-master expand --all --research               # 展开所有符合条件的任务

# 依赖与组织
task-master add-dependency --id=<id> --depends-on=<id>       # 添加任务依赖关系
task-master move --from=<id> --to=<id>                       # 调整任务层级结构
task-master validate-dependencies                            # 校验依赖关系
task-master generate                                         # 更新任务 Markdown 文件 (通常由系统自动调用)
```

## 关键文件与项目结构

### 核心文件

- `.taskmaster/tasks/tasks.json` - 主任务数据文件 (由系统自动管理)
- `.taskmaster/config.json` - AI 模型配置文件 (请使用 `task-master models` 命令修改)
- `.taskmaster/docs/prd.txt` - 用于解析的产品需求文档 (PRD)
- `.taskmaster/tasks/*.txt` - 独立任务文件 (由 tasks.json 自动生成)
- `.env` - 供 CLI 使用的 API 密钥

### Claude Code 集成文件

- `CLAUDE.md` - Claude Code 自动加载的上下文文件 (即本文)
- `.claude/settings.json` - Claude Code 的工具白名单与偏好设置
- `.claude/commands/` - 用于固化重复工作流的自定义斜杠命令
- `.mcp.json` - MCP (模型上下文协议) 服务器配置文件 (项目级)

### 目录结构

```
project/
├── .taskmaster/
│   ├── tasks/              # 任务文件目录
│   │   ├── tasks.json      # 主任务数据库
│   │   ├── task-1.md       # 独立任务文件
│   │   └── task-2.md
│   ├── docs/               # 文档目录
│   │   ├── prd.txt         # 产品需求
│   ├── reports/            # 分析报告目录
│   │   └── task-complexity-report.json
│   ├── templates/          # 模板目录
│   │   └── example_prd.txt   # PRD 模板示例
│   └── config.json         # AI 模型及设置
├── .claude/
│   ├── settings.json       # Claude Code 配置
│   └── commands/           # 自定义斜杠命令
├── .env                    # API 密钥
├── .mcp.json               # MCP 配置
└── CLAUDE.md               # 本文件 - 由 Claude Code 自动加载
```


### 核心 MCP 工具

```javascript
help; // 等同于显示所有可用的 taskmaster 命令
// 项目设置
initialize_project; // 等同于 task-master init
parse_prd; // 等同于 task-master parse-prd

// 日常工作流
get_tasks; // 等同于 task-master list
next_task; // 等同于 task-master next
get_task; // 等同于 task-master show <id>
set_task_status; // 等同于 task-master set-status

// 任务管理
add_task; // 等同于 task-master add-task
expand_task; // 等同于 task-master expand
update_task; // 等同于 task-master update-task
update_subtask; // 等同于 task-master update-subtask
update; // 等同于 task-master update

// 分析
analyze_project_complexity; // 等同于 task-master analyze-complexity
complexity_report; // 等同于 task-master complexity-report
```

## Claude Code 工作流集成

### 标准开发工作流

#### 1. 项目初始化

```bash
# 初始化 Task Master
task-master init

# 创建或获取 PRD, 然后进行解析
task-master parse-prd .taskmaster/docs/prd.txt

# 分析任务复杂度并展开任务
task-master analyze-complexity --research
task-master expand --all --research
```

如果项目中已有任务，可以使用 `parse-prd` 命令并附带 `--append` 标志来解析新的 PRD（注意：只应包含新增信息！）。此操作会将新生成的任务追加到现有任务列表的末尾。

#### 2. 日常开发循环

```bash
# 每个开发会话开始时
task-master next                           # 查找下一个可用任务
task-master show <id>                     # 查看任务详情

# 在实现过程中, 将代码上下文更新到任务和子任务中
task-master update-subtask --id=<id> --prompt="具体的实现笔记..."

# 完成任务
task-master set-status --id=<id> --status=done
```

#### 3. 多 Claude 实例协作工作流

对于复杂项目，可使用多个 Claude Code 会话并行工作：

```bash
# 终端 1: 核心功能实现
cd project && claude

# 终端 2: 测试与验证
cd project-test-worktree && claude

# 终端 3: 文档更新
cd project-docs-worktree && claude
```

### 自定义斜杠命令

创建 `.claude/commands/taskmaster-next.md` 文件：

```markdown
查找下一个可用的 Task Master 任务并显示其详情。

执行步骤：

1. 运行 `task-master next` 命令获取下一个任务。
2. 若任务存在，则运行 `task-master show <id>` 获取完整详情。
3. 总结需要实现的核心功能。
4. 给出第一个实现步骤的建议。
```

创建 `.claude/commands/taskmaster-complete.md` 文件：

```markdown
完成指定的 Task Master 任务: $ARGUMENTS

执行步骤：

1. 使用 `task-master show $ARGUMENTS` 命令回顾当前任务。
2. 确认所有功能实现均已完成。
3. 运行与此任务相关的测试。
4. 标记任务为完成状态: `task-master set-status --id=$ARGUMENTS --status=done`。
5. 使用 `task-master next` 命令显示下一个可用任务。
```

## 工具白名单推荐配置

将以下内容添加到 `.claude/settings.json` 文件中：

```json
{
  "allowedTools": [
    "Edit",
    "Bash(task-master *)",
    "Bash(git commit:*)",
    "Bash(git add:*)",
    "Bash(npm run *)",
    "mcp__task_master_ai__*"
  ]
}
```

## 配置与设置

### 必需的 API 密钥

你必须配置以下 API 密钥中的**至少一个**：

- `ANTHROPIC_API_KEY` (用于 Claude 系列模型) - **推荐**
- `PERPLEXITY_API_KEY` (用于研究功能) - **强烈推荐**
- `OPENAI_API_KEY` (用于 GPT 系列模型)
- `GOOGLE_API_KEY` (用于 Gemini 系列模型)
- `MISTRAL_API_KEY` (用于 Mistral 系列模型)
- `OPENROUTER_API_KEY` (用于多种模型)
- `XAI_API_KEY` (用于 Grok 系列模型)

只要在 `models` 命令定义的三种角色（main, research, fallback）中使用了某个模型提供商，就必须提供其对应的 API 密钥。

### 模型配置

```bash
# 交互式设置 (推荐)
task-master models --setup

# 指定特定模型
task-master models --set-main claude-3-5-sonnet-20241022
task-master models --set-research perplexity-llama-3.1-sonar-large-128k-online
task-master models --set-fallback gpt-4o-mini
```

## 任务结构与 ID

### 任务 ID 格式

- 主任务: `1`, `2`, `3`, 等。
- 子任务: `1.1`, `1.2`, `2.1`, 等。
- 子任务的子任务: `1.1.1`, `1.1.2`, 等。

### 任务状态值

- `pending` - 待处理
- `in-progress` - 进行中
- `done` - 已完成
- `deferred` - 已延期
- `cancelled` - 已取消
- `blocked` - 受阻

### 任务字段

```json
{
  "id": "1.2",
  "title": "实现用户认证功能",
  "description": "建立基于 JWT 的认证系统",
  "status": "pending",
  "priority": "high",
  "dependencies": ["1.1"],
  "details": "使用 bcrypt 进行密码哈希，使用 JWT 生成令牌...",
  "testStrategy": "为认证函数编写单元测试，为登录流程编写集成测试",
  "subtasks": []
}
```

## Task Master 与 Claude Code 结合使用的最佳实践

### 上下文管理

- 在处理不同任务时，使用 `/clear` 命令清空上下文以保持专注。
- `CLAUDE.md` 这个文件会自动加载为上下文。
- 在需要时，使用 `task-master show <id>` 命令来获取特定任务的上下文。

### 迭代式实现

1. `task-master show <subtask-id>` - 理解需求。
2. 浏览代码库并规划实现方案。
3. `task-master update-subtask --id=<id> --prompt="详细计划"` - 记录实施计划。
4. `task-master set-status --id=<id> --status=in-progress` - 开始工作。
5. 遵循已记录的计划进行编码实现。
6. `task-master update-subtask --id=<id> --prompt="记录有效与无效的尝试"` - 记录进展。
7. `task-master set-status --id=<id> --status=done` - 完成任务。

### 使用清单处理复杂工作流

对于大型迁移或包含多个步骤的复杂流程：

1. 创建一个 Markdown 格式的 PRD 文件来描述变更：`touch task-migration-checklist.md` (PRD 文件可以是 `.txt` 或 `.md` 格式)。
2. 使用 Taskmaster 的 `task-master parse-prd --append` 命令来解析这个新的 PRD (该功能在 MCP 中也可用)。
3. 使用 Taskmaster 将新生成的任务分解为子任务。可以考虑使用 `analyze-complexity` 命令，并指定正确的 `--to` 和 `--from` ID (新生成的 ID)，来为每个任务确定理想的子任务数量，然后进行分解。
4. 系统地完成清单中的项目，每完成一项就标记一项。
5. 在遇到困难时，使用 `task-master update-subtask` 来记录每个任务/子任务的进展，或在实现前/中对其进行更新或研究。

### Git 集成

Task Master 与 `gh` (GitHub CLI) 工具能很好地协同工作：

```bash
# 为已完成的任务创建拉取请求 (PR)
gh pr create --title "完成任务 1.2: 用户认证" --body "根据任务 1.2 的要求，实现 JWT 认证系统"

# 在提交信息中引用任务 ID
git commit -m "feat: 实现 JWT 认证 (task 1.2)"
```

### 使用 Git Worktrees 进行并行开发

```bash
# 为并行开发不同任务创建 worktree
git worktree add ../project-auth feature/auth-system
git worktree add ../project-api feature/api-refactor

# 在每个 worktree 目录中分别运行 Claude Code
cd ../project-auth && claude    # 终端 1: 开发认证功能
cd ../project-api && claude     # 终端 2: 开发 API 相关功能
```

## 问题排查

### AI 命令执行失败

```bash
# 检查 API 密钥是否已配置正确
cat .env                           # 检查供 CLI 使用的密钥

# 验证模型配置
task-master models

# 尝试更换模型进行测试
task-master models --set-fallback gpt-4o-mini
```

### MCP 连接问题

- 检查 `.mcp.json` 文件的配置是否正确。
- 确认 Node.js 已正确安装。
- 启动 Claude Code 时添加 `--mcp-debug` 标志以获取调试信息。
- 如果 MCP 无法连接，可使用 CLI 命令作为备用方案。

### 任务文件同步问题

```bash
# 从 tasks.json 重新生成所有任务文件
task-master generate

# 自动修复依赖关系问题
task-master fix-dependencies
```

请勿重新初始化项目 (`task-master init`)。该命令除了会重新添加 Taskmaster 的核心文件外，不会产生其他作用。

## 重要注意事项

### AI 驱动的操作

以下命令会调用 AI 服务，可能需要长达一分钟的执行时间：

- `parse_prd` / `task-master parse-prd`
- `analyze_project_complexity` / `task-master analyze-complexity`
- `expand_task` / `task-master expand`
- `expand_all` / `task-master expand --all`
- `add_task` / `task-master add-task`
- `update` / `task-master update`
- `update_task` / `task-master update-task`
- `update_subtask` / `task-master update-subtask`

### 文件管理

- **绝对不要**手动编辑 `tasks.json` 文件，应始终使用命令进行操作。
- **绝对不要**手动编辑 `.taskmaster/config.json` 文件，应使用 `task-master models` 命令。
- `tasks/` 目录中的任务 Markdown 文件是自动生成的。
- 如果你手动修改了 `tasks.json`，之后请务必运行 `task-master generate` 命令以同步变更。

### Claude Code 会话管理

- 频繁使用 `/clear` 命令以保持上下文的清晰与专注。
- 为重复性的 Task Master 工作流创建自定义斜杠命令。
- 配置工具白名单以简化权限授予流程。
- 使用无头模式实现自动化: `claude -p "task-master next"`。

### 多任务更新

- 使用 `update --from=<id>` 来一次性更新从指定 ID 开始的多个未来任务。
- 使用 `update-task --id=<id>` 来更新单个任务。
- 使用 `update-subtask --id=<id>` 来记录实现过程的笔记。

### 研究模式 (Research Mode)

- 添加 `--research` 标志可启用基于研究的 AI 增强功能。
- 此模式要求在环境变量中配置研究型模型的 API 密钥，例如 Perplexity 的 `PERPLEXITY_API_KEY`。
- 它能提供信息更充分的任务创建和更新。
- 推荐在处理复杂技术任务时使用此模式。

---

_本指南旨在确保 Claude Code 能即时访问 Task Master 的核心功能，从而支持基于 Agent 的开发工作流。_