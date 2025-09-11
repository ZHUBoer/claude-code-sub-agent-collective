### SIGMA 协议与数据契约 / FSM 规范

#### 状态机（FSM）
- Ω₂ Plan Loop
  - 产物：`tdd_plan.md`；
  - 角色：Ω₂ˢ（Spec）↔ Ω₂ᶜ（Critic）；
  - 状态：→PC(Plan Created), →PR(Plan Revised), →NR(Needs Revision), →PA(Plan Accepted)。
- Ω₃ TDD Loop
  - 角色：Ω₃ᵍ（QA）、Ω₃ᴱ（DEV）；
  - 阶段：RED→GREEN→REFACTOR（多轮收敛与交叉审查）；
  - 状态：→RC, →GC, →RTC, →RIC, review_tests, review_impl。
- Ω₄ Review
  - 状态：→VC, →DF, →QP, →QF。
- 错误码：→ME, →TO, →EX, →BL。

#### CTX Schema（简版）
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://sigma/protocol/ctx.json",
  "type": "object",
  "required": ["module", "designPath"],
  "properties": {
    "module": {"type": "string"},
    "designPath": {"type": "string"},
    "planPath": {"type": "string"},
    "interfaceSignature": {"type": "string"},
    "session": {
      "type": "object",
      "properties": {
        "sid": {"type": "string"},
        "cycle": {"type": "integer"},
        "phase": {"type": "string"},
        "round": {"type": "integer"}
      }
    }
  }
}
```

#### Handoff Schema（简版）
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://sigma/protocol/handoff.json",
  "type": "object",
  "required": ["from", "to", "task", "context"],
  "properties": {
    "from": {"type": "string"},
    "to": {"type": "string"},
    "task": {
      "type": "object",
      "required": ["type", "purpose"],
      "properties": {
        "type": {"type": "string"},
        "purpose": {"type": "string"},
        "parameters": {"type": "object"}
      }
    },
    "context": {"$ref": "ctx.json"},
    "metadata": {"type": "object"}
  }
}
```

#### Result Schema（简版）
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://sigma/protocol/result.json",
  "type": "object",
  "required": ["success", "status"],
  "properties": {
    "success": {"type": "boolean"},
    "status": {"type": "string"},
    "code": {"type": "string"},
    "message": {"type": "string"},
    "metrics": {"type": "object"}
  }
}
```

#### Gate（质量门）约束（节选）
- RED：必须存在新失败测试；
- GREEN：实现使所有测试通过，覆盖率阈值达标；
- REFACTOR：在不破坏语义的前提下降低复杂度/重复度，测试仍通过；
- Review：静态检查、偏差检测、接口与需求一致性验证。

#### 状态码映射（DPTR → Engine/Runtime）
- Ω₂ˢ →PC/→PR ↔ planDrafted/planRevised；Ω₂ᶜ →NR/→PA ↔ needsRevision/planAccepted。
- Ω₃ᵍ →RC/→RTC ↔ redComplete/refactorTestsComplete；Ω₃ᴱ →GC/→RIC ↔ greenComplete/refactorImplComplete。
- 错误：→TO/→EX/→BL ↔ timeout/exception/blocked。

#### 参考实现
- FSM/Schema 校验在 `@sigma/protocol`；
- 编排在 `@sigma/engine`；
- 质量门在 `@sigma/gates`；
- 代理/工具在 `@sigma/runtime` 与 `@sigma/mcp`。

---

#### 覆盖率门槛（Coverage Gate）
- 维度：lines / functions / branches / statements，单位为百分比 pct。
- 判定：各维度 pct 均需 ≥ 配置阈值（CLI: `--cov-*`；默认 0）。
- 采集：每个 cycle 的 GREEN/REFACTOR 阶段执行 jest，读取 per-cycle `coverage/coverage-summary.json` 聚合。

#### 事件流（Events）
- 路径：`.claude-collective/metrics/sigma/<module>/events.log`；一行一条 JSON。
- 字段：
  - ts：ISO 时间戳；phase：RED|GREEN|REFACTOR；code：→RC|→GC|→RIC；
  - exitCode：jest 退出码；coverage / coverageGate（GREEN/REFACTOR）。
- 用途：供审查与回放，统计阶段次数、失败点与质量门通过率。

#### 审查产物（Review Artifacts）
- 生成：`sigma review <module>` 汇总最新 TDD 指标与事件。
- 产物：
  - `review.json`：JSON 摘要（总/通过/失败 cycles、覆盖率 min/avg、各阶段计数）。
  - `review.md`：Markdown 摘要，便于人读与归档。

#### 工作目录（Workdir）
- 默认：`.claude-collective/sigma/<module>/<cycle>/`。
- 自定义：`sigma tdd --out <dir>` 将工作目录调整为 `<dir>/<module>/<cycle>/`，便于隔离或 CI 缓存。
