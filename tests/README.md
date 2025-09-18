### 测试总览（claude-tdd-agents）

本文档详细说明本项目的测试范围、技术栈、目录结构、运行方式、Mock 约定、覆盖率门槛，以及如何快速新增或调整测试用例，以便后续维护与扩展。

### 一、技术栈与运行方式

- 测试框架：
  - Jest（主测试框架，覆盖 `tests/**`）
  - Vitest（演示/轻量用例，仅覆盖 `.claude-collective/tests/**`）

- Node 要求：`>= 20`

- 运行命令：
  - 运行 Jest 全量测试（默认）：
    - `npm test`
  - 运行 Jest 并统计覆盖率：
    - `npm run test:coverage`（等同 `jest --coverage`）
  - 仅运行 Vitest（仅扫描 `.claude-collective/tests/**`）：
    - `npm run test:vitest`

- 双栈隔离策略：
  - Jest：只处理 `tests/**`，该目录下允许使用 `jest.mock` / `jest.spyOn` 等 API。
  - Vitest：配置在 `vitest.config.js` 中，`include` 指向 `.claude-collective/tests/**`，并显式 `exclude: ['tests/**']`，避免执行使用 Jest API 的用例。

### 二、目录结构

```text
tests/
  agents/
    tdd-validation.test.js         # TDD 校验相关轻量用例
  contracts/
    advanced-contract.test.js      # 高级合约链/回滚/性能/安全/数据完整性
    contract-validation.test.js    # 合约解析、结构校验、前置/回滚/统计
  handoffs/
    agent-handoff.test.js          # Hub-Spoke 交接、质量门、上下文保真
  unit/
    agent-lifecycle-manager.unit.test.js   # 生命周期管理器（清理/监控/扩缩容）
    agent-spawn-command.unit.test.js       # 代理创建命令（quick/template/clone/列表等）
    agent-template-system.unit.test.js     # 模板系统（继承/校验/编译/注册）
    command-history.unit.test.js           # 命令历史（存取/过滤/导出/统计）
    command-parser.unit.test.js            # 命令解析器（别名/解析/格式化/各 handler）
    command-parser-van.unit.test.js        # van 维护 handler（健康/修复/优化/计划）
  command-system.test.js                   # 命令系统集成（解析、自动补全、帮助、性能）
  registry-persistence.test.js             # 注册表持久化、迁移、并发与一致性
  agent-lifecycle.test.js                  # 生命周期整体验证（生成/注册/清理/性能）
  installation.test.js                     # 安装器流程（当前被 Jest ignore，不参与执行）
  setup.js                                 # Jest 全局 setup（临时目录/全局工具）

.claude-collective/tests/
  smoke.test.js                            # Vitest 最小“冒烟”用例
```

说明：`installation.test.js` 在 `jest.config.js` 中通过 `testPathIgnorePatterns` 忽略，以加速与稳定主流程；如需参与测试，可从忽略列表中移除。

### 三、覆盖功能范围与要点

- `tests/command-system.test.js`
  - 解析：`/collective|/agent|/gate` 基本命令、flags、别名、自然语言拒绝与建议。
  - 自动补全：命名空间、命令、参数、flags、相关度排序。
  - 历史与度量：写入、搜索、统计、导出（JSON/CSV/Markdown）。
  - 集成与性能：批量执行、错误处理、简单性能门槛（<100ms/50ms）。

- `tests/registry-persistence.test.js`
  - 持久化：落盘/加载/自动保存/迁移。
  - 健壮性：缺失文件、损坏数据、并发访问、数据一致性与回滚。

- `tests/agent-lifecycle.test.js`
  - 生成/注册/清理/资源策略与并发。
  - 空闲回收、健康检查、资源管理、寿命与负载下的一致性。

- `tests/contracts/contract-validation.test.js`
  - 合约解析与结构校验。
  - 前置条件、交接校验与回滚策略。
  - 统计指标接口可用性。

- `tests/contracts/advanced-contract.test.js`
  - 多阶段合约链、性能/安全/数据完整性合约与回滚路径。

- `tests/handoffs/agent-handoff.test.js`
  - Hub-Spoke 路由、能力匹配、质量门。
  - 上下文保真、多代理真实工作流与并发协调。

- `tests/agents/tdd-validation.test.js`
  - TDD 三阶段（Red/Green/Refactor）合规性与缺失检测。
  - 质量门（覆盖率、构建、类型、Lint）与交接证据校验。

- `tests/unit/command-parser.unit.test.js`
  - 参数/flags 解析、别名展开、Levenshtein 建议。
  - `collective/agent/gate` 各 handler 的成功/错误路径与格式化输出。

- `tests/unit/command-parser-van.unit.test.js`
  - 通过 `jest.mock('../../lib/van-maintenance')` 覆盖健康检查、自动修复、优化与计划；覆盖格式化细节（如 `getScoreColor`）。

- `tests/unit/command-history.unit.test.js`
  - 写入/过滤/时间区间/搜索，导出三种格式（JSON/CSV/Markdown）。

- `tests/unit/agent-spawn-command.unit.test.js`
  - `quick/template/clone/list/info/cleanup/status/help` 多分支执行（Mock `AgentSpawner/AgentRegistry/AgentLifecycleManager`），仅关注返回结构与分支覆盖。

- `tests/unit/agent-template-system.unit.test.js`
  - 模板继承解析、参数校验、模板编译、注册/删除持久化。

- `tests/unit/agent-lifecycle-manager.unit.test.js`
  - 生命周期策略评估、清理执行、健康监控、深度清理与统计输出（Mock `registry/spawner`）。

### 四、运行环境与全局 Setup

- 全局 Setup：`tests/setup.js`
  - 统一将临时目录切换至 `os.tmpdir()/claude-tdd-agents-tests/${JEST_WORKER_ID}`，避免仓库内写入与并发冲突。
  - 提供 `global.testUtils`（Mock/清理工具）。
  - `jest.setTimeout(10000)` 统一超时设置。

### 五、Mock 与依赖隔离约定

- 优先通过顶层 `jest.mock()` 隔离模块依赖（避免真实 IO/网络/随机源）。
- 对具有复杂副作用的模块（如 `./lib/van-maintenance`、注册表、Spawner）使用模块级 Mock，覆盖成功与异常分支。
- 单元测试应聚焦返回结构与关键分支，不断言内部私有细节。

### 六、覆盖率统计与门槛

- 规则位置：`jest.config.js`
  - `collectCoverageFrom`: `lib/**/*.js`, `bin/**/*.js`
  - `coveragePathIgnorePatterns`: 忽略 `lib/metrics/`、安装器与合并策略等非核心执行路径（可按需调整）。
  - 全局门槛（默认）：
    - statements ≥ 80%
    - lines ≥ 80%
    - functions ≥ 80%
    - branches ≥ 80%

说明：若短期需要 CI 绿灯，可临时下调 `coverageThreshold` 或扩大忽略范围；推荐优先新增针对性单元测试以提升分支覆盖。

### 七、如何新增/调整测试用例

1) 选择合适层级：
   - 纯逻辑/工具：放入 `tests/unit/`，尽量 Mock 外部依赖。
   - 子系统集成：放入相应子目录（如 `contracts/`、`handoffs/`）。
   - 端到端或安装流程：建议独立目录，必要时从 `testPathIgnorePatterns` 中移除参与执行。

2) 约定与建议：
   - 命名：`*.unit.test.js` 用于单元，`*.test.js` 为功能/集成。
   - 数据：覆盖“有效/无效/边界”三类输入；必要时构造最小可复现输入。
   - Mock 顺序：必须在 `require` 被测模块之前声明 `jest.mock()`。
   - 性能门槛：与现有测试保持一致（见 `command-system.test.js`）。

3) 运行与定位：
   - 运行指定文件：`npx jest tests/unit/command-parser.unit.test.js -t "parse"`
   - 单测调试（建议用 VSCode/IDE 调试配置或 `--runInBand`）。

### 八、常见问题与排查

- “jest is not defined”：
  - 原因：Vitest 执行了 `tests/**` 下的 Jest 用例。
  - 处理：确保 `vitest.config.js` 的 `include` 指向 `.claude-collective/tests/**` 且 `exclude: ['tests/**']`。

- 覆盖率统计为 0%：
  - 原因：`collectCoverageFrom` 指向了测试目录或未包含源码目录。
  - 处理：确认 `jest.config.js` 中统计路径与忽略项正确。

- macOS 临时目录断言失败（`/var` vs `/private/var`）：
  - 处理：断言前使用 `fs.realpathSync()` 归一化路径（见 `installation.test.js` 修正方式）。

### 九、CI 与任务说明

- GitHub Actions（见 `.github/workflows/test.yml`）：
  - 安装依赖 → `npm test`（Jest）→（可选）`npm run test:jest` → NPX 包安装验证。
  - 若需要 Vitest 演示用例，可另加 `npm run test:vitest` 步骤（当前仅有 `smoke.test.js`）。

### 十、后续提升建议

- 分支覆盖重点：`lib/AgentRegistry.js`、`lib/AgentLifecycleManager.js` 的异常路径与复杂条件。
- 将安装器/合并策略的关键分支拆分为可 Mock 的纯函数后补单测，提高可测性。
- 保持“最小改动原则”，新增测试优先落在 `tests/unit/` 与 Mock 级隔离。

---
如需我基于以上结构继续补测至 ≥80% 覆盖率，请告知优先模块与时间预算，我会按模块拆分任务、分支覆盖清单并提交增量用例。


