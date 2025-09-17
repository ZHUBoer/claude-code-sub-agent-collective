# Task Master for Claude Code 命令指南

通过 Claude Code 的斜杠命令使用 Task Master 的完整指南。

## 概览

所有 Task Master 功能均通过 `/project:tm/` 命名空间提供，并支持自然语言和智能特性。

## 快速入门

```bash
# 安装 Task Master
/project:tm/setup/quick-install

# 初始化项目
/project:tm/init/quick

# 解析需求文档 (PRD)
/project:tm/parse-prd requirements.md

# 开始处理下一个任务
/project:tm/next
```

## 命令结构

为了与 Task Master 的命令行界面（CLI）保持一致，命令按层级结构组织：
- 主命令：`/project:tm/[command]`
- 子命令：`/project:tm/[command]/[subcommand]`
- 所有命令均支持自然语言参数。

## 完整命令参考

### 设置与配置
- `/project:tm/setup/install` - 显示完整的安装指南。
- `/project:tm/setup/quick-install` - 使用一行命令快速安装。
- `/project:tm/init` - 初始化项目。
- `/project:tm/init/quick` - 使用 `-y` 参数快速初始化。
- `/project:tm/models` - 查看 AI 模型配置。
- `/project:tm/models/setup` - 配置 AI 模型。

### 任务生成
- `/project:tm/parse-prd` - 从产品需求文档（PRD）生成任务。
- `/project:tm/parse-prd/with-research` - 结合研究功能进行增强解析。
- `/project:tm/generate` - 创建任务文件。

### 任务管理
- `/project:tm/list` - 使用自然语言过滤器列出任务。
- `/project:tm/list/with-subtasks` - 以层级结构查看任务。
- `/project:tm/list/by-status <status>` - 按状态筛选任务。
- `/project:tm/show <id>` - 显示任务详情。
- `/project:tm/add-task` - 创建新任务。
- `/project:tm/update` - 更新任务。
- `/project:tm/remove-task` - 删除任务。

### 状态管理
- `/project:tm/set-status/to-pending <id>` - 将任务状态设置为“待定”。
- `/project:tm/set-status/to-in-progress <id>` - 将任务状态设置为“进行中”。
- `/project:tm/set-status/to-done <id>` - 将任务状态设置为“已完成”。
- `/project:tm/set-status/to-review <id>` - 将任务状态设置为“审查中”。
- `/project:tm/set-status/to-deferred <id>` - 将任务状态设置为“已推迟”。
- `/project:tm/set-status/to-cancelled <id>` - 将任务状态设置为“已取消”。

### 任务分析
- `/project:tm/analyze-complexity` - 对任务进行 AI 复杂度分析。
- `/project:tm/complexity-report` - 查看复杂度分析报告。
- `/project:tm/expand <id>` - 分解指定任务。
- `/project:tm/expand/all` - 分解所有复杂任务。

### 依赖管理
- `/project:tm/add-dependency` - 添加依赖关系。
- `/project:tm/remove-dependency` - 移除依赖关系。
- `/project:tm/validate-dependencies` - 检查依赖问题。
- `/project:tm/fix-dependencies` - 自动修复依赖问题。

### 工作流
- `/project:tm/workflows/smart-flow` - 启动自适应工作流。
- `/project:tm/workflows/pipeline` - 串联命令以构建自动化流水线。
- `/project:tm/workflows/auto-implement` - 使用 AI 自动实现任务。

### 实用工具
- `/project:tm/status` - 显示项目仪表盘。
- `/project:tm/next` - 获取下一个建议执行的任务。
- `/project:tm/utils/analyze` - 分析当前项目。
- `/project:tm/learn` - 获取交互式帮助。

## 主要特性

### 自然语言支持
所有命令都能理解自然语言，例如：
```
/project:tm/list pending high priority
/project:tm/update mark 23 as done
/project:tm/add-task implement OAuth login
```

### 智能上下文
命令能够分析项目状态，并根据以下信息提供智能建议：
- 当前任务的状态
- 任务间的依赖关系
- 团队的工作模式
- 项目所处的阶段

### 视觉化增强
- 进度条和状态指示器
- 状态徽章
- 结构化的信息展示
- 清晰的层级视图

## 常见工作流

### 日常开发
```
/project:tm/workflows/smart-flow morning
/project:tm/next
/project:tm/set-status/to-in-progress <id>
/project:tm/set-status/to-done <id>
```

### 任务分解
```
/project:tm/show <id>
/project:tm/expand <id>
/project:tm/list/with-subtasks
```

### Sprint 规划
```
/project:tm/analyze-complexity
/project:tm/workflows/pipeline init → expand/all → status
```

## 从旧版本命令迁移

| 旧命令 | 新命令 |
|-----|-----|
| `/project:task-master:list` | `/project:tm/list` |
| `/project:task-master:complete` | `/project:tm/set-status/to-done` |
| `/project:workflows:auto-implement` | `/project:tm/workflows/auto-implement` |

## 使用技巧

1. 使用 `/project:tm/` 后按 `Tab` 键，可以发现并自动补全命令。
2. 所有命令都支持自然语言输入。
3. 命令会提供智能的默认参数。
4. 可以串联多个命令以实现自动化。
5. 执行 `/project:tm/learn` 获取交互式帮助。