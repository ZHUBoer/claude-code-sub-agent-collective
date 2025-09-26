const path = require("path");

/**
 * 用于 Collective 组件安装的文件映射配置
 * 定义每个模板组件在目标项目中的安装位置
 */
class FileMapping {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.options = options;

    // 基础安装路径
    this.paths = {
      claude: path.join(projectRoot, ".claude"),
      collective: path.join(projectRoot, ".claude-collective"),
      root: projectRoot,
    };
  }

  /**
   * 获取安装所需的完整文件映射清单
   * @returns {Array} 包含源路径与目标路径的映射对象数组
   */
  getFileMapping() {
    return [
      // 核心行为系统
      ...this.getBehavioralMapping(),

      // 集体（Collective）行为系统
      ...this.getCollectiveMapping(),

      // Agent 定义
      ...this.getAgentMapping(),

      // Agent 辅助库文件
      ...this.getAgentLibMapping(),

      // Hook 脚本
      ...this.getHookMapping(),

      // 命令模板
      ...this.getCommandMapping(),

      // 测试框架
      ...this.getTestMapping(),

      // 配置文件
      ...this.getConfigMapping(),

      // 文档
      ...this.getDocumentationMapping(),
    ];
  }

  getBehavioralMapping() {
    return [
      {
        source: "CLAUDE.md",
        target: path.join(this.paths.root, "CLAUDE.md"),
        type: "behavioral",
        required: true,
        overwrite: this.options.force || false,
        description: "主行为指令文件",
      },
    ];
  }

  getCollectiveMapping() {
    const collectiveFiles = [
      {
        file: "CLAUDE.md",
        required: true,
        description: "集体行为规则和首要指令",
      },
      {
        file: "DECISION.md",
        required: true,
        description: "用于自动委派的全局决策引擎",
      },
      {
        file: "agents.md",
        required: true,
        description: "可用的专用agent目录",
      },
      {
        file: "hooks.md",
        required: true,
        description: "钩子系统集成要求",
      },
      {
        file: "quality.md",
        required: true,
        description: "质量门和TDD报告标准",
      },
      {
        file: "research.md",
        required: true,
        description: "研究假设和验证指标",
      },
    ];

    return collectiveFiles.map((file) => ({
      source: path.join(".claude-collective", file.file),
      target: path.join(this.paths.collective, file.file),
      type: "collective",
      required: file.required,
      overwrite: true,
      description: file.description,
    }));
  }

  getAgentMapping() {
    const allAgents = [
      "behavioral-transformation-agent.md",
      "command-system-agent.md",
      "completion-gate.md",
      "component-implementation-agent.md",
      "devops-agent.md",
      "dynamic-agent-creator.md",
      "enhanced-project-manager-agent.md",
      "enhanced-quality-gate.md",
      "feature-implementation-agent.md",
      "functional-testing-agent.md",
      "hook-integration-agent.md",
      "infrastructure-implementation-agent.md",
      "metrics-collection-agent.md",
      "npx-package-agent.md",
      "polish-implementation-agent.md",
      "prd-agent.md",
      "prd-mvp.md",
      "prd-research-agent.md",
      "quality-agent.md",
      "readiness-gate.md",
      "research-agent.md",
      "routing-agent.md",
      "task-checker.md",
      "task-executor.md",
      "task-orchestrator.md",
      "tdd-validation-agent.md",
      "testing-implementation-agent.md",
      "van-maintenance-agent.md",
      "workflow-agent.md",
      "tdd-contract-agent.md",
      "testcraft-generator-agent.md",
    ];

    const agents = this.options.minimal ? ["routing-agent.md"] : allAgents;

    return agents.map((agent) => ({
      source: path.join("agents", agent),
      target: path.join(this.paths.claude, "agents", agent),
      type: "agent",
      required: agent === "routing-agent.md",
      overwrite: true,
      description: `agent定义: ${agent.replace(".md", "")}`,
    }));
  }

  getAgentLibMapping() {
    const libFiles = ["research-analyzer.js"];

    return libFiles.map((libFile) => ({
      source: path.join("agents", "lib", libFile),
      target: path.join(this.paths.claude, "agents", "lib", libFile),
      type: "agent-lib",
      required: false,
      overwrite: true,
      description: `agent库文件: ${libFile}`,
    }));
  }

  getHookMapping() {
    const hooks = [
      {
        file: "directive-enforcer.sh",
        required: true,
        description: "在工具执行前强制执行行为指令",
      },
      {
        file: "collective-metrics.sh",
        required: true,
        description: "收集性能和研究指标",
      },
      {
        file: "routing-executor.sh",
        required: true,
        description: "执行路由决策和agent交接",
      },
      {
        file: "load-behavioral-system.sh",
        required: true,
        description: "在会话启动事件期间加载集体行为系统",
      },
      {
        file: "test-driven-handoff.sh",
        required: true,
        description: "TDD验证和交接协调钩子",
      },
      {
        file: "block-destructive-commands.sh",
        required: true,
        description: "在执行前阻止危险的破坏性命令",
      },
      {
        file: "auto-branch.sh",
        required: true,
        description: "会话启动/恢复时自动创建或切换工作分支",
      },
      {
        file: "auto-format.sh",
        required: false,
        description: "在编辑类操作前执行自动格式化/校验",
      },
      {
        file: "auto-checkpoint.sh",
        required: true,
        description: "在关键操作后生成检查点/最小提交",
      },
      {
        file: "auto-squash.sh",
        required: true,
        description: "在阶段收敛时自动整理/压缩提交",
      },
      {
        file: "mock-deliverable-generator.sh",
        required: false,
        description: "在 mock 子代理交付后生成伪交付物",
      },
      {
        file: "agent-detection.sh",
        required: false,
        description: "在需要时检测可用子代理与能力画像",
      },
      {
        file: "handoff-automation.sh",
        required: false,
        description: "辅助自动化交接编排（可选）",
      },
      {
        file: "research-evidence-validation.sh",
        required: false,
        description: "研究证据/引用的自动化验证（可选）",
      },
      {
        file: "workflow-coordinator.sh",
        required: false,
        description: "多代理工作流的轻量协调器（可选）",
      },
    ];

    return hooks.map((hook) => ({
      source: path.join("hooks", hook.file),
      target: path.join(this.paths.claude, "hooks", hook.file),
      type: "hook",
      required: hook.required,
      executable: true,
      overwrite: true,
      description: hook.description,
    }));
  }

  getCommandMapping() {
    const commands = [
      // 核心 Collective 命令
      "autocompact.md",
      "continue-handoff.md",
      "mock.md",
      "reset-handoff.md",
      "van.md",
    ];

    const mappings = [];

    // 映射核心命令
    for (const command of commands) {
      mappings.push({
        source: path.join("commands", command),
        target: path.join(this.paths.claude, "commands", command),
        type: "command",
        required: false,
        overwrite: true,
        description: `命令模板: ${command.replace(".md", "")}`,
      });
    }

    // 映射 TaskMaster 命令结构
    const tmCommands = [
      "help.md",
      "learn.md",
      "tm-main.md",
      "add-dependency/add-dependency.md",
      "add-subtask/add-subtask.md",
      "add-subtask/convert-task-to-subtask.md",
      "add-task/add-task.md",
      "analyze-complexity/analyze-complexity.md",
      "clear-subtasks/clear-all-subtasks.md",
      "clear-subtasks/clear-subtasks.md",
      "complexity-report/complexity-report.md",
      "expand/expand-all-tasks.md",
      "expand/expand-task.md",
      "fix-dependencies/fix-dependencies.md",
      "generate/generate-tasks.md",
      "init/init-project-quick.md",
      "init/init-project.md",
      "list/list-tasks-by-status.md",
      "list/list-tasks-with-subtasks.md",
      "list/list-tasks.md",
      "models/setup-models.md",
      "models/view-models.md",
      "next/next-task.md",
      "parse-prd/parse-prd-with-research.md",
      "parse-prd/parse-prd.md",
      "remove-dependency/remove-dependency.md",
      "remove-subtask/remove-subtask.md",
      "remove-task/remove-task.md",
      "set-status/to-cancelled.md",
      "set-status/to-deferred.md",
      "set-status/to-done.md",
      "set-status/to-in-progress.md",
      "set-status/to-pending.md",
      "set-status/to-review.md",
      "setup/install-taskmaster.md",
      "setup/quick-install-taskmaster.md",
      "show/show-task.md",
      "status/project-status.md",
      "sync-readme/sync-readme.md",
      "update/update-single-task.md",
      "update/update-task.md",
      "update/update-tasks-from-id.md",
      "utils/analyze-project.md",
      "validate-dependencies/validate-dependencies.md",
      "workflows/auto-implement-tasks.md",
      "workflows/command-pipeline.md",
      "workflows/smart-workflow.md",
    ];

    // 映射 TaskMaster 命令
    for (const tmCommand of tmCommands) {
      mappings.push({
        source: path.join("commands", "tm", tmCommand),
        target: path.join(this.paths.claude, "commands", "tm", tmCommand),
        type: "command",
        required: false,
        overwrite: true,
        description: `TaskMaster 命令: ${tmCommand.replace(".md", "")}`,
      });
    }

    return mappings;
  }

  getTestMapping() {
    return [
      // 测试所需的 package 配置
      {
        source: path.join(".claude-collective", "package.json"),
        target: path.join(this.paths.collective, "package.json"),
        type: "config",
        required: true,
        overwrite: true,
        description: "测试框架的 package.json 配置",
      },

      // Jest 配置
      {
        source: path.join(".claude-collective", "jest.config.js"),
        target: path.join(this.paths.collective, "jest.config.js"),
        type: "config",
        required: true,
        overwrite: true,
        description: "Jest 测试框架配置",
      },

      // 指标上报脚本
      {
        source: path.join(".claude-collective", "metrics-report.js"),
        target: path.join(this.paths.collective, "metrics-report.js"),
        type: "config",
        required: true,
        overwrite: true,
        description: "指标收集和报告系统",
      },

      // 测试套件文件
      {
        source: path.join(
          ".claude-collective",
          "tests",
          "agents",
          "tdd-validation.test.js"
        ),
        target: path.join(
          this.paths.collective,
          "tests",
          "agents",
          "tdd-validation.test.js"
        ),
        type: "test",
        required: true,
        overwrite: true,
        description: "TDD 验证agent测试",
      },

      {
        source: path.join(
          ".claude-collective",
          "tests",
          "contracts",
          "contract-validation.test.js"
        ),
        target: path.join(
          this.paths.collective,
          "tests",
          "contracts",
          "contract-validation.test.js"
        ),
        type: "test",
        required: true,
        overwrite: true,
        description: "合约验证测试",
      },

      {
        source: path.join(
          ".claude-collective",
          "tests",
          "contracts",
          "advanced-contract.test.js"
        ),
        target: path.join(
          this.paths.collective,
          "tests",
          "contracts",
          "advanced-contract.test.js"
        ),
        type: "test",
        required: true,
        overwrite: true,
        description: "高级合约验证测试",
      },

      {
        source: path.join(
          ".claude-collective",
          "tests",
          "handoffs",
          "agent-handoff.test.js"
        ),
        target: path.join(
          this.paths.collective,
          "tests",
          "handoffs",
          "agent-handoff.test.js"
        ),
        type: "test",
        required: true,
        overwrite: true,
        description: "agent交接验证测试",
      },

      {
        source: path.join(".claude-collective", "tests", "setup.js"),
        target: path.join(this.paths.collective, "tests", "setup.js"),
        type: "test",
        required: true,
        overwrite: true,
        description: "测试套件设置和实用工具",
      },

      // 初始化 metrics 基线文件
      {
        source: path.join(
          ".claude-collective",
          "metrics",
          "metrics-20250812.json"
        ),
        target: path.join(this.paths.collective, "metrics", "baseline.json"),
        type: "config",
        required: true,
        overwrite: true,
        description: "基线指标配置",
      },
    ];
  }

  getConfigMapping() {
    return [
      // Claude 设置
      {
        source: "settings.json.template",
        target: path.join(this.paths.claude, "settings.json"),
        type: "config",
        required: true,
        overwrite: this.options.force || false,
        description: "Claude Code 钩子配置",
      },

      // 用于 TDD 校验的 Vitest 配置（项目根级）
      {
        source: "vitest.config.js",
        target: path.join(this.paths.root, "vitest.config.js"),
        type: "config",
        required: true,
        overwrite: true,
        description: "用于TDD钩子验证的Vitest配置",
      },

      // .claude-collective 内的 Vitest 配置（依赖所在处）
      {
        source: path.join(".claude-collective", "vitest.config.js"),
        target: path.join(this.paths.collective, "vitest.config.js"),
        type: "config",
        required: true,
        overwrite: true,
        description: "在collective目录中包含依赖项的Vitest配置",
      },
    ];
  }

  getDocumentationMapping() {
    return [
      {
        source: "TM_COMMANDS_GUIDE.md",
        target: path.join(this.paths.claude, "TM_COMMANDS_GUIDE.md"),
        type: "docs",
        required: false,
        overwrite: true,
        description: "TaskMaster 命令使用指南（放置于 .claude 根目录）",
      },
      {
        source: path.join("docs", "README.md"),
        target: path.join(this.paths.claude, "docs", "README.md"),
        type: "docs",
        required: false,
        overwrite: true,
        description: "系统文档",
      },

      {
        source: path.join("docs", "TROUBLESHOOTING.md"),
        target: path.join(this.paths.claude, "docs", "TROUBLESHOOTING.md"),
        type: "docs",
        required: false,
        overwrite: true,
        description: "故障排除指南",
      },
    ];
  }

  /**
   * 按安装类型返回过滤后的映射清单
   * @param {string} installationType - 可选：'full' (完整)、'minimal' (最小)、'testing-only' (仅测试)
   * @returns {Array} 过滤后的映射数组
   */
  getFilteredMapping(installationType = "full") {
    const allMappings = this.getFileMapping();

    switch (installationType) {
      case "minimal":
        return allMappings.filter(
          (mapping) =>
            mapping.required ||
            (mapping.type === "agent" &&
              mapping.source.includes("routing-agent"))
        );

      case "testing-only":
        return allMappings.filter(
          (mapping) =>
            mapping.type === "test" ||
            mapping.type === "config" ||
            mapping.type === "collective" ||
            (mapping.type === "behavioral" && mapping.required)
        );

      case "hooks-only":
        return allMappings.filter(
          (mapping) =>
            mapping.type === "hook" ||
            mapping.type === "config" ||
            mapping.type === "collective" ||
            (mapping.type === "behavioral" && mapping.required)
        );

      case "full":
      default:
        return allMappings;
    }
  }

  /**
   * 获取需要创建的目录结构清单
   * @returns {Array} 目录路径数组
   */
  getDirectoryStructure() {
    const mapping = this.getFileMapping();
    const dirs = new Set();

    // 从目标路径中提取唯一目录
    mapping.forEach((item) => {
      const dir = path.dirname(item.target);
      dirs.add(dir);

      // 递归添加父级目录
      let parentDir = path.dirname(dir);
      while (parentDir !== this.projectRoot && parentDir !== "/") {
        dirs.add(parentDir);
        parentDir = path.dirname(parentDir);
      }
    });

    return Array.from(dirs).sort();
  }

  /**
   * 校验文件映射的冲突与必要项
   * @returns {Object} 校验结果
   */
  validateMapping() {
    const mapping = this.getFileMapping();
    const issues = [];
    const warnings = [];

    // 检查目标路径是否冲突
    const targetPaths = new Set();
    mapping.forEach((item) => {
      if (targetPaths.has(item.target)) {
        issues.push(`目标路径重复: ${item.target}`);
      }
      targetPaths.add(item.target);
    });

    // 检查必需文件是否定义
    const requiredFiles = mapping.filter((item) => item.required);
    if (requiredFiles.length === 0) {
      issues.push("未定义必需文件");
    }

    // 在未指定 --force 时提示可能的覆盖风险
    if (!this.options.force) {
      const overwriteFiles = mapping.filter((item) => item.overwrite);
      overwriteFiles.forEach((item) => {
        warnings.push(`将覆盖: ${item.target}`);
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      totalFiles: mapping.length,
      requiredFiles: requiredFiles.length,
    };
  }

  /**
   * 汇总映射信息用于展示
   * @returns {Object} 汇总对象
   */
  getSummary() {
    const mapping = this.getFileMapping();
    const byType = {};

    mapping.forEach((item) => {
      if (!byType[item.type]) {
        byType[item.type] = [];
      }
      byType[item.type].push(item);
    });

    return {
      totalFiles: mapping.length,
      byType,
      directories: this.getDirectoryStructure().length,
      requiredFiles: mapping.filter((item) => item.required).length,
      optionalFiles: mapping.filter((item) => !item.required).length,
    };
  }
}

module.exports = { FileMapping };
