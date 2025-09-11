### SIGMA 迁移指南（DPTR / Collective → Sigma）

#### 适用对象
- 已有 DPTR-SIGMA 的 `memory-bank/modules/*/{design.md,tdd_plan.md}`；
- 已使用 Collective 的 `.claude/`、`.claude-collective/`、agent 模板与测试契约。

#### 迁移步骤（建议）
1) 规范元数据：确保所有模块的 `design.md`、`tdd_plan.md` 存放于 `memory-bank/modules/<module>/`。
2) 秘钥与 MCP：将 `.mcp.json` 中的敏感 key 移至环境变量（.env/Secrets），`.mcp.json` 仅保留结构与占位符。
3) 初始化 SIGMA：
   - 安装/切换至新 CLI：`sigma init`；
   - 配置 `sigma.memoryBankRoot` 指向 `./memory-bank/modules`。
4) 计划阶段：`sigma plan <module>`（Ω₂），人工快速校验计划（DPTR 原则三）。
5) TDD 阶段：`sigma tdd <module> --parallel 2`（Ω₃），观察事件/指标/质量门报告。
6) 审查与交付：`sigma review <module>`（Ω₄），归档报告与产物。

#### 映射关系
- DPTR 的 CTX/状态码/会话标识 → 详见 `PROTOCOL_AND_CONTRACTS.md` 映射表。
- Collective 的 Agent 模板 → 可通过适配器装载，逐步迁移至 `@sigma/agents` 新模板。

#### 回滚与共存
- 共存期：允许保留旧 CLI 与目录结构，新 CLI 只读入 `memory-bank/` 与生成额外的报告目录；
- 回滚：如需回到旧流程，保留 `tdd_plan.md` 与测试/实现代码即可，无数据损失。

#### 常见问题
- 并行导致资源紧张：降低 `--parallel`，或配置工作池资源限流；
- 计划无法通过 →PA：检查 `design.md` 的接口签名/路径是否与项目规范一致；
- 覆盖率未达标：调整阈值或拆分 cycles，优先关键路径。
