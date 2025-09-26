const fs = require("fs-extra");
const path = require("path");
const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");
const { FileMapping } = require("./file-mapping");

/**
 * @class CollectiveInstaller
 * @description 负责处理 "collective" 框架安装过程的核心类.
 */
class CollectiveInstaller {
  /**
   * @constructor
   * @description 初始化安装器.
   * @param {object} [options={}] - 安装选项, 例如 { force: true }.
   */
  constructor(options = {}) {
    this.options = options;
    this.projectDir = process.cwd();
    this.collectiveDir = path.join(this.projectDir, ".claude");

    // 为所有安装环境提供可靠的模板目录解析
    // 使用 package.json 的位置作为参照点
    const packageJsonPath = require.resolve("../package.json");
    const packageRoot = path.dirname(packageJsonPath);
    this.templateDir = path.join(packageRoot, "templates");

    // 如果主路径无效，则使用备用路径
    if (!fs.existsSync(this.templateDir)) {
      const fallbackPaths = [
        path.join(__dirname, "..", "templates"), // 开发环境
        path.join(__dirname, "..", "..", "templates"), // 备用的 npm 结构
      ];

      this.templateDir =
        fallbackPaths.find((templatePath) => {
          try {
            return fs.existsSync(templatePath);
          } catch {
            return false;
          }
        }) || this.templateDir;
    }

    // --- 安装配置 ---
    // 这些变量将用于填充模板文件中的占位符.
    this.config = {
      projectRoot: this.projectDir,
      installDate: new Date().toISOString(),
      version: require("../package.json").version,
      userName: process.env.USER || process.env.USERNAME || "developer",
      projectName: path.basename(this.projectDir),
    };
  }

  /**
   * @method install
   * @description 执行安装流程的主方法.
   */
  async install() {
    console.log(chalk.cyan("🚀 正在安装 claude-tdd-agents...\n"));

    try {
      // 检查是否存在现有安装
      await this.checkExistingInstallation();

      // 快速模式或合并模式，利用智能合并解决冲突
      if (this.options.express || this.options.mergeMode) {
        return await this.performExpressInstallation();
      }

      // 标准安装流程
      return await this.performStandardInstallation();
    } catch (error) {
      console.error(chalk.red("❌ 安装失败:"), error.message);
      throw error;
    }
  }

  /**
   * @method performStandardInstallation
   * @description 标准的, 分步执行的安装流程.
   */
  async performStandardInstallation() {
    // 创建目录结构
    await this.createDirectories();

    // 设置预配置的 TaskMaster
    await this.setupTaskMaster();

    // 安装模板
    await this.installTemplates();

    // 配置设置
    await this.configureSettings();

    // 设置钩子
    await this.setupHooks();

    // 安装agent
    await this.installAgents();

    // 验证安装
    await this.validateInstallation();

    console.log(chalk.green("\n✅ 安装完成！"));
    console.log(chalk.yellow("\n后续步骤:"));
    console.log("1. 请查阅 CLAUDE.md 了解行为指令");
    console.log("2. 使用简单请求测试agent的路由");
    console.log("3. 检查安装状态: npx claude-tdd-agents validate");

    return { success: true, path: this.collectiveDir };
  }

  /**
   * @method performExpressInstallation
   * @description 快速, 非交互式的安装模式, 会自动处理文件冲突.
   *              此模式主要用于自动化脚本或CI/CD环境.
   */
  async performExpressInstallation() {
    console.log(chalk.gray("[Debug] 启动 performExpressInstallation"));
    const { MergeStrategies } = require("./merge-strategies");
    const mergeStrategies = new MergeStrategies(this.projectDir, this.options);

    // 分析现有设置以查找冲突
    console.log(chalk.gray("[Debug] 正在创建加载动画并分析设置"));
    const spinner = ora("正在分析快速安装的现有设置...").start();
    const analysis = await mergeStrategies.analyzeExistingSetup(
      this.templateDir
    );
    console.log(
      chalk.gray("[Debug] 分析完成: " + JSON.stringify(analysis, null, 2))
    );

    if (analysis.hasConflicts) {
      spinner.text = "检测到冲突 - 正在应用智能合并策略...";

      // 如果有请求，则创建备份
      if (this.options.backup !== "none" && analysis.backupRequired) {
        const backupPaths = analysis.existingFiles.map((f) => f.path);
        await mergeStrategies.createBackups(backupPaths);
        console.log(chalk.blue("📦 已创建现有文件的备份"));
      }
    } else {
      spinner.text = "检测到全新安装 - 继续执行标准流程...";
    }

    spinner.stop();
    console.log(chalk.gray("[Debug] 加载动画已停止，继续执行安装步骤"));

    // 继续执行标准安装流程
    console.log(chalk.gray("[Debug] 第 1 步: 创建目录"));
    await this.createDirectories();
    console.log(chalk.gray("[Debug] 第 2 步: 设置 TaskMaster"));
    await this.setupTaskMaster();
    console.log(chalk.gray("[Debug] 第 3 步: 安装模板"));
    await this.installTemplates();

    // 配置设置（如果存在冲突，将会覆盖）
    console.log(chalk.gray("[Debug] 第 4 步: 配置设置"));
    await this.configureSettings();

    console.log(chalk.gray("[Debug] 第 5 步: 设置钩子"));
    await this.setupHooks();
    console.log(chalk.gray("[Debug] 第 6 步: 安装agent"));
    await this.installAgents();
    console.log(chalk.gray("[Debug] 第 7 步: 验证安装"));
    await this.validateInstallation();
    console.log(chalk.gray("[Debug] 所有步骤已完成"));

    console.log(chalk.green("\n✅ 快速安装成功完成！"));

    if (analysis.hasConflicts) {
      console.log(chalk.blue("📦 现有文件已备份并被新版本覆盖"));
    } else {
      console.log(
        chalk.green("✨ 全新安装 - 所有文件已安装或因内容相同而跳过")
      );
    }

    return {
      success: true,
      path: this.collectiveDir,
      expressMode: true,
      conflicts: analysis.hasConflicts,
    };
  }

  async smartMergeSettings(mergeStrategies) {
    const spinner = ora("正在对 settings.json 应用智能合并...").start();

    try {
      const settingsPath = path.join(this.collectiveDir, "settings.json");

      // 获取我们的模板设置
      const fileMapping = new FileMapping(this.projectDir, this.options);
      const configMappings = fileMapping.getConfigMapping();
      const settingsMapping = configMappings.find((m) =>
        m.target.endsWith("settings.json")
      );

      if (settingsMapping) {
        const templatePath = path.join(
          this.templateDir,
          settingsMapping.source
        );
        let ourSettings = await fs.readFile(templatePath, "utf8");
        ourSettings = this.processTemplate(ourSettings, this.config);
        const parsedSettings = JSON.parse(ourSettings);

        // 执行智能合并
        const mergedSettings = await mergeStrategies.smartMergeSettings(
          settingsPath,
          parsedSettings
        );

        // 写入合并后的结果
        await fs.ensureDir(path.dirname(settingsPath));
        await fs.writeFile(
          settingsPath,
          JSON.stringify(mergedSettings, null, 2)
        );

        spinner.succeed("设置合并成功");
      } else {
        // 回退到标准配置
        await this.configureSettings();
        spinner.succeed("设置已配置");
      }
    } catch (error) {
      spinner.fail("设置合并失败");
      throw error;
    }
  }

  /**
   * @method checkExistingInstallation
   * @description 检查是否已经存在 .claude 目录, 并据此决定下一步操作.
   */
  async checkExistingInstallation() {
    if ((await fs.pathExists(this.collectiveDir)) && !this.options.force) {
      // 快速模式：使用智能默认值，而非提示用户
      if (this.options.express) {
        console.log(chalk.gray("📁 检测到现有安装 - 使用智能合并模式"));
        this.options.mode = this.options.mode || "smart-merge";
        return;
      }

      // 交互模式：提示用户
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: "Claude 集体目录已存在。是否覆盖？",
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow("安装已取消"));
        process.exit(0);
      }
    }
  }

  /**
   * @method createDirectories
   * @description 创建框架所需的全部目录结构.
   */
  async createDirectories() {
    const spinner = ora("正在创建目录结构...").start();

    const dirs = [
      ".claude",
      ".claude/agents",
      ".claude/hooks",
      ".claude/commands",
      ".claude-collective",
      ".claude-collective/tests",
      ".claude-collective/tests/handoffs",
      ".claude-collective/tests/directives",
      ".claude-collective/tests/contracts",
      ".claude-collective/metrics",
      ".taskmaster",
      ".taskmaster/tasks",
      ".taskmaster/docs",
      ".taskmaster/reports",
      ".taskmaster/templates",
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.projectDir, dir));
    }

    spinner.succeed("目录结构创建成功");
  }

  /**
   * @method installTemplates
   * @description 安装所有通用的模板文件.
   */
  async installTemplates() {
    const spinner = ora("正在安装模板文件...").start();

    try {
      // 创建文件映射系统
      const fileMapping = new FileMapping(this.projectDir, this.options);
      const installationType = this.options.minimal ? "minimal" : "full";
      const mappings = fileMapping.getFilteredMapping(installationType);

      spinner.text = `正在安装 ${mappings.length} 个模板文件...`;

      // 安装每个已映射的文件
      for (const mapping of mappings) {
        await this.installMappedFile(mapping);
        spinner.text = `正在安装: ${mapping.description}`;
      }

      spinner.succeed(`模板文件安装成功 (${mappings.length} 个文件)`);
    } catch (error) {
      spinner.fail("模板安装失败");
      throw error;
    }
  }

  /**
   * @method installMappedFile
   * @description 安装单个由 file-mapping.js 定义的文件. 这是文件安装的核心逻辑.
   * @param {object} mapping - 文件映射对象, 定义了源, 目标, 是否覆盖等属性.
   */
  async installMappedFile(mapping) {
    const sourcePath = path.join(this.templateDir, mapping.source);

    // 检查源模板是否存在
    if (!(await fs.pathExists(sourcePath))) {
      console.warn(chalk.yellow(`警告: 未找到模板: ${mapping.source}`));
      console.warn(chalk.gray(`  查找路径: ${sourcePath}`));
      console.warn(chalk.gray(`  模板目录: ${this.templateDir}`));
      return;
    }

    // 检查目标文件是否存在
    if (await fs.pathExists(mapping.target)) {
      // 对于不应被覆盖的文件，首先检查它们是否完全相同
      if (!mapping.overwrite) {
        // 使用 MergeStrategies 检查文件是否相同
        const { MergeStrategies } = require("./merge-strategies");
        const mergeStrategies = new MergeStrategies(
          this.projectDir,
          this.options
        );

        // 读取并处理模板，以便与现有文件进行比较
        let templateContent = await fs.readFile(sourcePath, "utf8");
        templateContent = this.processTemplate(templateContent, this.config);

        // 将模板写入临时文件以供比较
        const tempFile = sourcePath + ".processed";
        await fs.writeFile(tempFile, templateContent);

        try {
          const isIdentical = await mergeStrategies.areFilesIdentical(
            mapping.target,
            tempFile
          );

          if (isIdentical) {
            // 文件内容相同 - 静默跳过，不显示消息
            return;
          } else {
            // 文件内容不同 - 如果未启用强制模式，则需要备份
            if (!this.options.force && !this.options.overwrite) {
              console.log(
                chalk.blue(`跳过现有文件: ${path.basename(mapping.target)}`)
              );
              return;
            }
            // 在强制/覆盖模式下，覆盖前先备份现有文件
            console.log(
              chalk.yellow(`正在备份并覆盖: ${path.basename(mapping.target)}`)
            );

            // 创建现有文件的备份
            const timestamp = Date.now();
            const backupDir = path.join(
              this.projectDir,
              ".claude-backups",
              timestamp.toString()
            );
            await fs.ensureDir(backupDir);

            const relativePath = path.relative(this.projectDir, mapping.target);
            const backupPath = path.join(backupDir, relativePath);
            await fs.ensureDir(path.dirname(backupPath));
            await fs.copy(mapping.target, backupPath);

            console.log(chalk.gray(`  → 已备份至: ${backupPath}`));
          }
        } finally {
          // 清理临时文件
          await fs.remove(tempFile);
        }
      }
    }

    // 读取并处理模板
    let content = await fs.readFile(sourcePath, "utf8");
    content = this.processTemplate(content, this.config);

    // 确保目标目录存在
    await fs.ensureDir(path.dirname(mapping.target));

    // 写入处理后的模板内容
    await fs.writeFile(mapping.target, content);

    // 为钩子脚本设置可执行权限
    if (mapping.executable) {
      await fs.chmod(mapping.target, "755");
    }
  }

  async installTemplate(templateName, targetPath, variables = {}) {
    const templatePath = path.join(this.templateDir, templateName);
    const fullTargetPath = path.join(this.projectDir, targetPath);

    if (await fs.pathExists(templatePath)) {
      let content = await fs.readFile(templatePath, "utf8");

      // 处理模板变量
      const allVariables = { ...this.config, ...variables };
      content = this.processTemplate(content, allVariables);

      await fs.ensureDir(path.dirname(fullTargetPath));
      await fs.writeFile(fullTargetPath, content);
    }
  }

  /**
   * @method processTemplate
   * @description 一个简单的模板处理器, 用于替换文件内容中的占位符.
   * @param {string} content - 文件内容.
   * @param {object} variables - 包含键值对的变量对象.
   * @returns {string} 处理过的文件内容.
   */
  processTemplate(content, variables) {
    let processed = content;

    // 替换模板变量
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      processed = processed.replace(regex, variables[key]);
    });

    // 替换通用模式
    processed = processed.replace(/{{PROJECT_ROOT}}/g, this.projectDir);
    processed = processed.replace(/{{INSTALL_DATE}}/g, this.config.installDate);
    processed = processed.replace(/{{VERSION}}/g, this.config.version);
    processed = processed.replace(/{{USER_NAME}}/g, this.config.userName);
    processed = processed.replace(/{{PROJECT_NAME}}/g, this.config.projectName);

    return processed;
  }

  async installTestTemplates() {
    const testTemplates = [
      {
        template: "tests/handoff-test.template.js",
        target: ".claude-collective/tests/handoffs/handoff.test.js",
      },
      {
        template: "tests/directive-test.template.js",
        target: ".claude-collective/tests/directives/directive.test.js",
      },
      {
        template: "tests/contract-test.template.js",
        target: ".claude-collective/tests/contracts/contract.test.js",
      },
    ];

    for (const { template, target } of testTemplates) {
      await this.installTemplate(template, target);
    }
  }

  /**
   * @method configureSettings
   * @description 安装所有配置文件.
   */
  async configureSettings() {
    const spinner = ora("正在配置设置...").start();

    // 使用 FileMapping 系统配置设置，而非硬编码对象
    const fileMapping = new FileMapping(this.projectDir, this.options);
    const configMappings = fileMapping.getConfigMapping();

    for (const mapping of configMappings) {
      await this.installMappedFile(mapping);
    }

    spinner.succeed("设置配置成功");
  }

  /**
   * @method setupHooks
   * @description 安装所有钩子脚本.
   */
  async setupHooks() {
    const spinner = ora("正在安装钩子脚本...").start();

    // 使用 FileMapping 系统安装钩子，而非硬编码数组
    const fileMapping = new FileMapping(this.projectDir, this.options);
    const hookMappings = fileMapping.getHookMapping();

    for (const mapping of hookMappings) {
      await this.installMappedFile(mapping);
    }

    spinner.succeed("钩子脚本安装成功");
  }

  /**
   * @method installAgents
   * @description 安装所有 Agent 定义文件.
   */
  async installAgents() {
    const spinner = ora("正在安装agent定义...").start();

    // 使用 FileMapping 系统安装agent，而非硬编码数组
    const fileMapping = new FileMapping(this.projectDir, this.options);
    const agentMappings = fileMapping.getAgentMapping();

    for (const mapping of agentMappings) {
      await this.installMappedFile(mapping);
    }

    spinner.succeed("agent定义安装成功");
  }

  /**
   * @method validateInstallation
   * @description 验证安装是否成功, 检查关键文件和目录是否存在.
   */
  async validateInstallation() {
    const spinner = ora("正在验证安装...").start();

    const checks = [
      { name: "CLAUDE.md 文件", path: "CLAUDE.md" },
      { name: "配置文件", path: ".claude/settings.json" },
      { name: "钩子目录", path: ".claude/hooks" },
      { name: "agent目录", path: ".claude/agents" },
      { name: "测试目录", path: ".claude-collective/tests" },
    ];

    let allPassed = true;
    const results = [];

    for (const check of checks) {
      const exists = await fs.pathExists(
        path.join(this.projectDir, check.path)
      );
      results.push({ name: check.name, passed: exists });

      if (!exists) {
        allPassed = false;
      }
    }

    if (allPassed) {
      spinner.succeed("安装验证通过");
    } else {
      spinner.fail("安装验证失败");
      console.log("\n验证结果:");
      results.forEach((result) => {
        const icon = result.passed ? "✅" : "❌";
        console.log(`${icon} ${result.name}`);
      });
      throw new Error("安装验证失败");
    }

    return results;
  }

  async getInstallationStatus() {
    const status = {
      version: this.config.version,
      installed: false,
      behavioral: false,
      testing: false,
      hooks: false,
      agents: [],
      issues: [],
    };

    // 检查是否已安装
    status.installed = await fs.pathExists(this.collectiveDir);

    if (status.installed) {
      // 检查组件
      status.behavioral = await fs.pathExists(
        path.join(this.projectDir, "CLAUDE.md")
      );
      status.testing = await fs.pathExists(
        path.join(this.projectDir, ".claude-collective/tests")
      );
      status.hooks = await fs.pathExists(
        path.join(this.collectiveDir, "hooks")
      );

      // 检查agent
      const agentsDir = path.join(this.collectiveDir, "agents");
      if (await fs.pathExists(agentsDir)) {
        const agentFiles = await fs.readdir(agentsDir);
        status.agents = agentFiles
          .filter((f) => f.endsWith(".json") || f.endsWith(".md"))
          .map((f) => f.replace(/\.(json|md)$/, ""));
      }

      // 检查问题
      if (!status.behavioral) status.issues.push("缺少 CLAUDE.md 文件");
      if (!status.testing) status.issues.push("未安装测试框架");
      if (!status.hooks) status.issues.push("未安装钩子");
      if (status.agents.length === 0) status.issues.push("未安装任何agent");
    }

    return status;
  }

  /**
   * @method setupTaskMaster
   * @description 设置预配置的 TaskMaster 环境.
   */
  async setupTaskMaster() {
    const spinner = ora("正在设置预配置的 TaskMaster...").start();

    try {
      // 从模板复制预配置的 .taskmaster 目录结构
      const taskmasterTemplate = path.join(this.templateDir, ".taskmaster");
      const taskmasterTarget = path.join(this.projectDir, ".taskmaster");

      if (await fs.pathExists(taskmasterTemplate)) {
        await fs.copy(taskmasterTemplate, taskmasterTarget);
        spinner.succeed("TaskMaster 已预先配置 (无需初始化)");
      } else {
        // 备用方案：手动创建最小化结构
        await this.createMinimalTaskMaster();
        spinner.succeed("TaskMaster 最小化结构创建成功");
      }

      // 兜底校验：确保关键文件存在（config.json / state.json / tasks/tasks.json）
      const configPath = path.join(taskmasterTarget, "config.json");
      const statePath = path.join(taskmasterTarget, "state.json");
      const tasksDir = path.join(taskmasterTarget, "tasks");
      const tasksPath = path.join(tasksDir, "tasks.json");

      await fs.ensureDir(tasksDir);

      if (!(await fs.pathExists(configPath))) {
        const config = {
          main: "claude-3-5-sonnet-20241022",
          research: "claude-3-5-sonnet-20241022",
          fallback: "claude-3-5-sonnet-20241022",
        };
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      }

      if (!(await fs.pathExists(statePath))) {
        const state = {
          currentTag: "master",
          availableTags: ["master"],
          projectRoot: this.projectDir,
        };
        await fs.writeFile(statePath, JSON.stringify(state, null, 2));
      }

      if (!(await fs.pathExists(tasksPath))) {
        const tasks = {
          master: {
            tasks: [],
            metadata: {
              createdAt: new Date().toISOString(),
              lastModified: new Date().toISOString(),
            },
          },
        };
        await fs.writeFile(tasksPath, JSON.stringify(tasks, null, 2));
      }
    } catch (error) {
      spinner.fail("TaskMaster 设置失败");
      throw error;
    }
  }

  /**
   * @method createMinimalTaskMaster
   * @description 如果模板不存在, 创建一个最小化的 TaskMaster 配置.
   */
  async createMinimalTaskMaster() {
    const taskmasterDir = path.join(this.projectDir, ".taskmaster");

    // 创建 config.json
    const config = {
      main: "claude-3-5-sonnet-20241022",
      research: "claude-3-5-sonnet-20241022",
      fallback: "claude-3-5-sonnet-20241022",
    };
    await fs.writeFile(
      path.join(taskmasterDir, "config.json"),
      JSON.stringify(config, null, 2)
    );

    // 创建 state.json
    const state = {
      currentTag: "master",
      availableTags: ["master"],
      projectRoot: this.projectDir,
    };
    await fs.writeFile(
      path.join(taskmasterDir, "state.json"),
      JSON.stringify(state, null, 2)
    );

    // 创建空的 tasks.json
    const tasks = {
      master: {
        tasks: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      },
    };
    await fs.writeFile(
      path.join(taskmasterDir, "tasks", "tasks.json"),
      JSON.stringify(tasks, null, 2)
    );
  }
}

module.exports = { CollectiveInstaller };
