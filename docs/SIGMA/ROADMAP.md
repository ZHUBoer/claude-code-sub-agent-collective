### SIGMA 路线图与里程碑

#### Phase 1：协议与引擎骨架（2-3 周）
- @sigma/protocol：Ω₂/Ω₃ FSM 与 JSON Schemas；
- @sigma/engine：Orchestrator/PlanLoop/TDDLoop 最小可用；
- CLI：`sigma plan/tdd` MVP；
- 事件与基本指标：成功率、时延、并行度。

#### Phase 2：Runtime 与质量门（2 周）
- @sigma/runtime：Registry/Spawner/Health/限流；
- @sigma/gates：TDD 契约生成/执行、覆盖率阈值、静态检查；
- @sigma/agents：Ω₂/Ω₃ 核心模板首批。

#### Phase 3：MCP/Context7 与可观测（2 周）
- @sigma/mcp：Filesystem/Memory/Context7 适配器；
- 指标导出：Prometheus/Otel；
- 高级并行：背压/重试/断路器；
- `sigma review` 与偏差检测。

#### Phase 4：UI 与生态（2 周）
- @sigma/ui：仪表盘（进度/质量门/错误谱）；
- 适配器：collective/dptr 兼容层；
- 文档与示例模块；
- 稳定化与回归。

#### 度量指标（跨阶段）
- 计划质量：回合数、接受率、变更率；
- TDD 效能：RED/GREEN/REFACTOR 时延、失败率、覆盖率；
- 资源：并行度、排队时长、健康检查；
- 质量：偏差、静态缺陷、回归率。
