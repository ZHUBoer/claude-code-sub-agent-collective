### SIGMA 融合架构蓝图（DPTR × Collective）

#### 目标
- 将 DPTR-SIGMA 的协议/方法论（Ω₁→Ω₂→Ω₃→Ω₄、CTX/状态码/会话隔离、σ Memory-Bank）与 Collective 的工程化能力（CLI/安装器/模板化 Agent/注册表/度量/TDD 契约）融合为“协议驱动型多代理开发系统”。

#### 核心原则
- 协议优先：Ω 协议（状态机与契约）是唯一真理；实现引擎可替换。
- 清晰分层：Protocol（FSM/Schema）→ Engine（Orchestrator/Loops）→ Runtime（Agent/Tools）→ Memory（σ/MCP）→ Gates（质量门）→ Observability（事件/度量）。
- 可插拔：代理以模板+能力声明方式接入；工具通过适配器接入（MCP/本地）。
- 可观测：事件总线统一采集状态迁移、hand-off、质量门与性能指标。

#### 分层与组件
- Protocol 层（不可变标准）
  - FSM：Ω₂ 计划循环、Ω₃ TDD 循环、会话隔离（sid/tdd_session_id）。
  - Schemas：CTX、Handoff、Result、Gate 统一 JSON Schema。
- Engine 层（编排执行）
  - Orchestrator：统一入口，驱动 Ω₂/Ω₃/Ω₄。
  - PlanLoop/TDDLoop/ReviewLoop：并行/背压/重试/收敛判定与进度上报。
  - DAG：由 `tdd_plan.md` 生成 RED→GREEN→REFACTOR 的任务图与并行窗口。
- Runtime 层（代理与工具）
  - Agent Runtime：模板→实例化→生命周期→健康检查→资源限流。
  - Tools Adapter：Filesystem/Memory/Context7/Bash/Web 等工具桥接。
  - Handoff 合同测试：自动生成并执行。
- Memory 层
  - σ Memory-Bank：`/memory-bank/modules/<module>/{design.md,tdd_plan.md}` 为唯一真源。
  - MCP Memory：会话对话、观察事件的可查询存储。
- Gates（质量门）
  - RED/GREEN/REFACTOR/Review 的进入/退出条件、覆盖率与偏差检测。
- Observability（可观测）
  - 事件总线、指标聚合、报告导出（JSON/Prometheus/Otel）。

#### 核心执行流
- Ω₂（Plan）
  1) 读取 `design.md` → PlanLoop 生成/修订 `tdd_plan.md`；
  2) 计划审查通过（→PA）后进入 Ω₃。
- Ω₃（TDD）
  1) 读取 `tdd_plan.md` → 切分 cycles，分批并行；
  2) RED（QA 失败测试）→ GREEN（DEV 最小实现）→ REFACTOR（QA/DEV 协作）收敛；
  3) 所有批次收敛后进入 Ω₄。
- Ω₄（Review）
  最终质量门与偏差检测，生成交付报告。

#### 数据契约（概览）
- CTX：module/designPath/planPath/interfaceSignature + session(sid/cycle/phase/round)。
- Handoff：from/to/task/context/metadata；Result：status/code/message/metrics。
- 详见 `PROTOCOL_AND_CONTRACTS.md`。

#### CLI（建议）
- `sigma init`：初始化配置与目录；
- `sigma plan <module> [--rounds <n>]`：运行 Ω₂；
- `sigma tdd <module> [--parallel <n>]`：运行 Ω₃；
- `sigma review <module>`：运行 Ω₄；
- `sigma status|metrics|agents`：可观测与运维。

#### 目录拓扑（Monorepo 设想）
- packages/
  - @sigma/protocol（FSM/Schemas）
  - @sigma/engine（Orchestrator/Loops/DAG）
  - @sigma/runtime（Registry/Spawner/Handoff）
  - @sigma/gates（质量门/TDD 契约）
  - @sigma/mcp（工具适配器）
  - @sigma/cli（统一 CLI）
  - @sigma/metrics（事件与指标）
  - @sigma/agents（Ω₂/Ω₃ 模板库）
- examples/（演示模块）

#### 与现有仓库关系
- DPTR-SIGMA：延用 σ Memory-Bank 结构与 MCP 运行模式；
- Collective：吸收工程基建理念（Spawner/Registry/命令/契约/度量），在新框架中类型化重写并模块化。

#### 风险与对策
- 协议-实现偏差：以 Schema 校验与事件回放保证一致性；
- 并行与资源：工作池+速率限制+健康检查；
- 秘钥：移出 `.mcp.json` 明文，统一 secret 管理；
- 复杂度：分层清晰，接口稳定，模块解耦。

#### 实施要点（覆盖率与事件）
- 覆盖率：每个 cycle 独立目录执行 jest，读取 `coverage-summary.json`，按阈值（lines/functions/branches/statements）判定通过；阈值支持 CLI 配置。
- 事件：RED/GREEN/REFACTOR 阶段将状态码、退出码与覆盖率写入 `events.log`（一行一事件），供审查与追踪；`review` 汇总输出 JSON/Markdown 报告。
