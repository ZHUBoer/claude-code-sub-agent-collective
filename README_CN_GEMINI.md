# claude tdd agents 中文指南 (由 Gemini 生成)

## 1. 项目概述

`claude tdd agents` 是一个通过 NPX 分发的框架，旨在为以测试驱动开发（TDD）为中心的工作流安装专门的 AI 代理（agents）、钩子（hooks）和行为系统。该系统通过自动化的交付验证（handoff validation）来强制执行测试驱动开发，并通过中心辐射型（hub-and-spoke）架构提供智能任务路由。

该项目本质上是一个为 Claude Code AI 助手定制的“操作系统”，通过一系列规则和工具来规范其行为，确保开发过程的严谨性和一致性。

## 2. 核心架构与运行原理

项目的核心是其精密的架构，旨在实现高度自动化和严格的开发流程。

*   **中心辐射型架构 (Hub-and-Spoke Architecture)**:
    *   `@routing-agent` 作为中心协调器（hub），负责接收任务并将其分发给合适的专业代理（spoke）。
    *   这种模式确保了任务能够被最高效、最专业的代理处理。

    *   **架构图**:
        ```mermaid
        graph TD
            A[用户/任务] --> B["@routing-agent"];
            B --> C[agent: code-reviewer];
            B --> D[agent: test-generator];
            B --> E[agent: refactor-pro];
            B --> F[...其他 30+ 代理];
        ```

*   **行为操作系统 (Behavioral Operating System)**:
    *   项目的核心行为准则定义在 `CLAUDE.md` 文件中。
    *   Claude Code 在与此仓库交互时，必须严格遵守这些“最高指令”，这覆盖了其所有默认行为。

*   **测试驱动的交付 (Test-Driven Handoffs)**:
    *   在代理之间交接任务时，系统会进行“契约验证”（contract validation）。
    *   这确保了每个步骤的输出都符合预定义的规范，是 TDD 理念在 AI 协作中的创新应用。

    *   **流程图**:
        ```mermaid
        sequenceDiagram
            participant A as Agent A (e.g., test-generator)
            participant V as Validation (Contract Test)
            participant B as Agent B (e.g., code-generator)

            A->>V: 完成任务, 提交产出 (Handoff)
            V->>V: 运行契约测试
            alt 测试通过
                V->>B: 交付产出, 触发新任务
            else 测试失败
                V-->>A: 返回错误, 要求修正
            end
        ```

*   **即时上下文加载 (Just-in-time context loading)**:
    *   系统只在需要时加载相关上下文，以最大限度地减少内存使用和提高效率。

*   **关键组件**:
    *   **NPX 包 (`claude-tdd-agents`)**: 项目的入口，通过 `npx` 命令进行安装和初始化。
    *   **代理系统 (`templates/agents/`)**: 包含超过 30 个为特定任务（如代码审查、测试生成、重构等）设计的专业 AI 代理。
    *   **钩子系统 (`templates/hooks/`)**: 强制执行 TDD 流程的钩子脚本，例如在 git commit 前自动运行测试。
    *   **命令系统 (`lib/command-*.js`)**: 处理自然语言和结构化命令，将其转化为可执行的操作。
    *   **模板系统 (`templates/`)**: 包含了所有安装文件的模板，如代理定义、钩子脚本、配置文件等。

## 3. 项目配置

配置开发环境是使用和贡献该项目的第一步。

*   **环境要求**:
    *   **Node.js**: 版本需 `>= 16.0.0`。
    *   **包管理器**: 使用 `npm` 而非 `yarn`。

*   **安装依赖**:
    *   克隆仓库后，在根目录运行以下命令来安装所有必需的依赖项：
        ```bash
        npm install
        ```

*   **核心配置**:
    *   项目的主要配置模板位于 `templates/settings.json`。当用户运行 `npx claude-tdd-agents init` 时，此模板会被复制到用户的环境中（通常是 `.claude/settings.json`），并由 Claude Code 使用。
    *   开发者不应直接修改 `.claude/` 目录下的文件，而应修改 `templates/` 中的源文件来更新配置。

## 4. 如何使用

该项目有两种主要的使用场景：作为终端用户使用其功能，以及作为开发者为其贡献代码。

### 4.1 作为用户：安装和使用

你可以通过 `npx` 在任何项目目录中使用 `claude-tdd-agents`。

1.  **初始化和安装**:
    *   在你的项目根目录运行以下命令，它会引导你完成安装过程，将代理、钩子等集成到你的项目中。
        ```bash
        npx claude-tdd-agents init
        ```
    *   你也可以使用非交互模式进行最小化安装：
        ```bash
        npx claude-tdd-agents init --minimal
        ```

2.  **查看帮助和状态**:
    ```bash
    # 获取帮助信息
    npx claude-tdd-agents --help

    # 查看当前状态
    npx claude-tdd-agents status
    ```

### 4.2 作为开发者：开发与测试流程

`CLAUDE.md` 文件中定义了严格的本地测试工作流，以确保所有更改在合并前都经过充分验证。

*   **工作流图**:
    ```mermaid
    graph TD
        subgraph "cc-sub-agent-collective"
            A[1.创建功能分支] --> B[2.修改代码]
            B --> C[3.运行本地测试脚 './scripts/test-local.sh']
        end

        subgraph "自动创建的隔离环境"
            C --> D[4.脚本自动打包-tgz]
            D --> E[5.创建测试目录 '../npm-tests/ccc-testing-vN']
            E --> F[6.在测试目录中安装包]
            F --> G[7.运行自动验证]
        end
        
        subgraph "手动验证"
             G --> H[8.在测试目录中手动运行 npx 命令]
        end

        H --> I[发现问题?]
        I -- Yes --> B
        I -- No --> J[9.清理环境 './scripts/cleanup-tests.sh']
        J --> K[10.推送并创建 PR]

        style C fill:#f9f,stroke:#333,stroke-width:2px
        style J fill:#ccf,stroke:#333,stroke-width:2px
    ```

1.  **创建功能分支**:
    *   所有新功能或修复都应在单独的分支中进行。
        ```bash
        git checkout -b feature/your-feature-name
        ```

2.  **进行本地自动化测试 (核心步骤)**:
    *   在完成代码修改后，运行 `test-local.sh` 脚本。这是本地测试最关键的一步。
        ```bash
        ./scripts/test-local.sh
        ```
    *   该脚本会自动完成以下操作：
        1.  将当前项目打包成一个 `.tgz` 文件。
        2.  在父级目录下创建一个隔离的测试目录（如 `../npm-tests/ccc-testing-v1`）。
        3.  在测试目录中，通过 `npm install` 安装刚刚打包的 `.tgz` 文件，完美模拟真实用户的 `npx` 安装体验。
        4.  运行基本的验证测试。
        5.  **脚本执行完毕后，你会停留在该测试目录中**，以便进行后续的手动测试。

3.  **进行手动测试**:
    *   在上一步的测试目录中，你可以像真实用户一样使用 `npx` 命令来测试你的更改。
        ```bash
        # 运行交互式安装
        npx claude-tdd-agents init

        # 测试其他命令
        npx claude-tdd-agents status
        npx claude-tdd-agents validate
        ```

4.  **修复与迭代**:
    *   如果在测试中发现任何问题，返回主项目目录进行修复，然后重复步骤 2 和 3。
        ```bash
        # 返回主项目目录
        cd ../claude-tdd-agents

        # 修复代码并提交
        git add . && git commit -m "fix: your-fix-description"

        # 再次运行本地测试
        ./scripts/test-local.sh
        ```

5.  **清理测试环境**:
    *   测试完成后，返回主项目目录并运行清理脚本。
        ```bash
        ./scripts/cleanup-tests.sh
        ```
    *   这个脚本会删除所有测试生成的目录和 `.tgz` 文件。

6.  **推送与合并**:
    *   所有测试通过后，将你的功能分支推送到远程仓库，并创建 Pull Request。

## 5. 最佳实践

为确保项目质量和一致性，请务必遵守以下最佳实践。

*   **遵守测试驱动开发 (TDD)**:
    *   所有新功能必须先编写测试。
    *   代理之间的交付必须包含契约验证测试。

*   **遵循既定标准**:
    *   **绝对不要**在未获明确许可的情况下修改已建立的标准，包括命名约定（如测试目录 `ccc-*` 前缀）、代码格式、测试流程、Git 工作流等。
    *   当不确定时，**精确模仿**现有代码中的模式。

*   **使用本地测试工作流**:
    *   在推送代码或创建 PR 之前，**必须**使用 `./scripts/test-local.sh` 流程进行完整的本地测试。这可以捕获绝大多数与打包和安装相关的问题。

*   **修改模板而非生成文件**:
    *   始终修改 `templates/` 目录下的源文件，而不是修改由安装过程生成的 `.claude/` 或 `.claude-collective/` 目录下的文件。

*   **发布流程**:
    *   发布新版本时，使用 `npm version [patch|minor|major] -m "chore: release v%s - [summary]"` 命令，并提供有意义的提交信息，而不是使用默认信息。

## 6. 重要命令参考

| 命令 | 描述 |
| --- | --- |
| `npm test` | 运行 Jest 测试套件（用于全面的最终验证）。|
| `npm run test:vitest` | 运行 vitest 测试套件（用于快速开发迭代）。|
| `npm run test:coverage` | 生成测试覆盖率报告。 |
| `npm run test:contracts`| 运行契约验证测试。 |
| `./scripts/test-local.sh`| **（核心）** 运行自动化本地打包和安装测试。 |
| `./scripts/cleanup-tests.sh`| 清理本地测试环境。 |
| `npx . init` | 在当前目录中测试 NPX 包的安装。 |
| `npx . validate` | 在当前目录中测试验证命令。 |
