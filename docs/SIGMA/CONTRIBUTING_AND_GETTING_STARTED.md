### 贡献与上手指南（SIGMA）

#### 角色与分工
- Protocol：维护 FSM/Schema；
- Engine：编排、并行与收敛；
- Runtime：代理生命周期与手递手；
- Gates：质量门与契约；
- MCP：工具适配与密钥治理；
- Docs：标准与教程。

#### 开发约定
- 设计优先：先提 RFC（含状态迁移与边界条件）。
- 类型安全：TS 强类型；Schema 校验失败即阻断。
- 小步提交：每次仅改一个层的职责；
- 可观测优先：每次变更需可被事件与指标观测。

#### 目录与分支
- Monorepo（见 ARCHITECTURE.md）；
- 分支：`feat/*`、`fix/*`、`docs/*`，走 PR 与评审；
- 版本：SemVer，按包发布；
- 变更日志：按包维护。

#### 上手步骤（本仓示例）
1) 克隆与安装依赖；
2) 配置 `.env`，移除 `.mcp.json` 的明文 key；
3) 新建/导入一个模块到 `memory-bank/modules/<module>/`；
4) 运行 `sigma plan <module>` 生成/校验 `tdd_plan.md`；
5) 运行 `sigma tdd <module>` 完成 RED→GREEN→REFACTOR；
6) 查看事件/指标/报告，提交 PR。

#### 代码评审清单（节选）
- 协议一致性：状态码/CTX/会话是否合规；
- 质量门：是否新增或调整阈值；
- 并行与资源：是否引入堵塞/雪崩风险；
- 安全：秘钥/路径/命令安全；
- 观测：事件/指标是否覆盖关键路径。
