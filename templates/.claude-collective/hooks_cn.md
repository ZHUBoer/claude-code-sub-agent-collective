# 钩子（Hook）与智能体（Agent）系统集成

## 钩子的关键要求
**关键**：对钩子（位于 .claude/hooks/ 目录）或智能体配置的任何更改，都要求用户重启 Claude Code。

## 何时需要请求重启
- 修改 .claude/hooks/pre-task.sh
- 修改 .claude/hooks/post-task.sh  
- 修改 .claude/settings.json 文件中的钩子配置
- 更改智能体的验证逻辑
- 更新强制执行规则
- 创建或修改 .claude/agents/ 目录下的文件
- 更新行为系统的强制执行策略

## 重启流程
1. 首先提交更改
2. 请求用户重启 Claude Code
3. 在确认重启之前，绝不继续测试
4. 切勿想当然地认为钩子或智能体在未经重启的情况下能够正常工作

## 钩子与智能体的集成点
- **任务前钩子 (Pre-task hooks)**：验证指令的合规性。
- **任务后钩子 (Post-task hooks)**：收集研究指标。
- **智能体交接钩子 (Agent handoff hooks)**：确保合约验证。
- **紧急钩子 (Emergency hooks)**：触发违规处理机制。