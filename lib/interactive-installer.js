const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");
const { MergeStrategies } = require("./merge-strategies");
const { CollectiveInstaller } = require("./installer");

/**
 * Interactive installer with professional menu system
 * Provides guided installation experience like create-react-app, eslint --init
 */
class InteractiveInstaller {
  constructor(options = {}) {
    this.options = options;
    this.projectDir = process.cwd();
    this.mergeStrategies = new MergeStrategies(this.projectDir, options);
    this.baseInstaller = new CollectiveInstaller(options);
  }

  /**
   * Main interactive installation flow
   */
  async install() {
    console.log(chalk.cyan("🚀 Claude Code Agents交互式安装程序\n"));

    try {
      // 1. Analyze existing setup
      const spinner = ora("正在分析现有设置...").start();
      const analysis = await this.mergeStrategies.analyzeExistingSetup(
        this.baseInstaller.templateDir
      );
      spinner.stop();

      this.displayAnalysis(analysis);

      // 2. Main installation menu
      const { installMode } = await inquirer.prompt([
        {
          type: "list",
          name: "installMode",
          message: "您希望如何安装claude-tdd-agents？",
          choices: [
            {
              name: "📦 备份并覆盖 (推荐)",
              value: "smart-merge",
              short: "备份并覆盖",
            },
            {
              name: "💥 强制覆盖 (高风险)",
              value: "force",
              short: "强制覆盖",
            },
            {
              name: "⏭️  跳过冲突文件",
              value: "skip-conflicts",
              short: "跳过冲突",
            },
            {
              name: "🔍 显示详细分析",
              value: "analyze",
              short: "显示分析",
            },
            {
              name: "❌ 取消安装",
              value: "cancel",
              short: "取消",
            },
          ],
        },
      ]);

      if (installMode === "cancel") {
        console.log(chalk.yellow("用户已取消安装"));
        return { success: false, cancelled: true };
      }

      if (installMode === "analyze") {
        await this.showDetailedAnalysis(analysis);
        return this.install(); // Restart menu
      }

      // 3. Handle based on choice
      switch (installMode) {
        case "smart-merge":
          return await this.smartMergeFlow(analysis); // Now does backup+overwrite
        case "force":
          return await this.forceOverwriteFlow(analysis);
        case "skip-conflicts":
          return await this.skipConflictsFlow(analysis);
        default:
          throw new Error(`Unknown install mode: ${installMode}`);
      }
    } catch (error) {
      console.error(chalk.red("❌ 交互式安装失败:"), error.message);
      throw error;
    }
  }

  /**
   * Display initial analysis results
   */
  displayAnalysis(analysis) {
    if (!analysis.hasConflicts) {
      console.log(chalk.green("✓ 检测到干净项目 - 未发现冲突"));
      console.log(chalk.gray("  所有智能体集合文件将被全新安装\n"));
    } else {
      console.log(chalk.yellow("⚠️  检测到现有配置："));
      console.log(
        chalk.gray(`  • ${analysis.existingFiles.length} 个现有文件`)
      );
      console.log(chalk.gray(`  • ${analysis.conflicts.length} 个潜在冲突`));
      if (analysis.backupRequired) {
        console.log(chalk.gray("  • 建议在继续操作前进行备份"));
      }
      console.log("");
    }
  }

  /**
   * Smart merge installation flow
   */
  async smartMergeFlow(analysis) {
    console.log(chalk.cyan("\n📦 备份并覆盖配置\n"));

    console.log(
      chalk.gray(`发现 ${analysis.conflicts.length} 个文件将被备份并覆盖：`)
    );

    for (let i = 0; i < analysis.conflicts.length; i++) {
      const conflict = analysis.conflicts[i];
      console.log(
        chalk.gray(
          `• ${conflict.type}：${conflict.message || "将被备份并覆盖"}`
        )
      );
    }

    // Backup options
    const { backupStrategy } = await inquirer.prompt([
      {
        type: "list",
        name: "backupStrategy",
        message: "💾 覆盖文件前的备份策略是？",
        choices: [
          {
            name: "✅ 创建带时间戳的备份及恢复脚本 (推荐)",
            value: "full",
            short: "完整备份",
          },
          {
            name: "📦 仅创建简单的带时间戳备份",
            value: "simple",
            short: "简单备份",
          },
          {
            name: "🎲 不进行备份 (我选择冒险)",
            value: "none",
            short: "不备份",
          },
        ],
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "是否备份现有文件并安装claude-tdd-agents？",
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("用户已取消安装"));
      return { success: false, cancelled: true };
    }

    // Execute installation with backup
    return await this.executeBackupAndOverwrite(analysis, backupStrategy);
  }

  /**
   * Get conflict resolution strategy for a specific conflict
   */
  async getConflictStrategy(conflict) {
    console.log(
      chalk.gray(`Getting strategy for conflict type: ${conflict.type}`)
    );

    const choices = [
      {
        name: "🔄 智能合并 (保留现有配置并添加新配置)",
        value: "merge",
        short: "智能合并",
      },
      {
        name: "📝 使用新版本替换 (会备份旧文件)",
        value: "replace",
        short: "替换",
      },
      {
        name: "⏭️  保留现有版本 (跳过新版本)",
        value: "skip",
        short: "保留现有版本",
      },
      {
        name: "🔍 先显示详细对比",
        value: "diff",
        short: "显示对比",
      },
    ];

    console.log(chalk.gray(`Prompting user for strategy...`));

    const { strategy } = await inquirer.prompt([
      {
        type: "list",
        name: "strategy",
        message: `如何处理 ${
          conflict.type === "settings" ? "settings.json" : "钩子文件 (hooks)"
        }？`,
        choices,
      },
    ]);

    console.log(chalk.gray(`User selected strategy: ${strategy}`));

    if (strategy === "diff") {
      await this.showDetailedDiff(conflict);
      return this.getConflictStrategy(conflict); // Ask again after showing diff
    }

    return strategy;
  }

  /**
   * Force overwrite installation flow
   */
  async forceOverwriteFlow(analysis) {
    console.log(chalk.red("\n💥 强制覆盖模式\n"));
    console.log(chalk.yellow("⚠️  此操作将替换所有现有的智能体集合文件！"));

    if (analysis.hasConflicts) {
      console.log(
        chalk.gray(`• ${analysis.conflicts.length} 个冲突文件将被覆盖`)
      );
      console.log(
        chalk.gray(`• ${analysis.existingFiles.length} 个现有文件将受影响`)
      );
    }

    const { confirmForce } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmForce",
        message: "您确定要强制覆盖吗？",
        default: false,
      },
    ]);

    if (!confirmForce) {
      console.log(chalk.yellow("强制覆盖已取消"));
      return this.install(); // Back to main menu
    }

    // Backup before force overwrite
    const { createBackup } = await inquirer.prompt([
      {
        type: "confirm",
        name: "createBackup",
        message: "覆盖前创建备份？",
        default: true,
      },
    ]);

    return await this.executeForceOverwrite(analysis, createBackup);
  }

  /**
   * Skip conflicts installation flow
   */
  async skipConflictsFlow(analysis) {
    console.log(chalk.blue("\n⏭️  跳过冲突模式\n"));

    if (analysis.hasConflicts) {
      console.log(chalk.gray("将被跳过的文件："));
      for (const conflict of analysis.conflicts) {
        if (conflict.type === "settings") {
          console.log(chalk.gray("  • settings.json (保留您的版本)"));
        }
        if (conflict.type === "hooks") {
          console.log(
            chalk.gray(`  • ${conflict.conflictingFiles.length} 个钩子文件`)
          );
        }
      }
    } else {
      console.log(chalk.green("没有冲突可跳过 - 继续全新安装"));
    }

    const { confirmSkip } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmSkip",
        message: "是否继续并跳过冲突的文件？",
        default: true,
      },
    ]);

    if (!confirmSkip) {
      return this.install(); // Back to main menu
    }

    return await this.executeSkipConflicts(analysis);
  }

  /**
   * Execute backup and overwrite installation
   */
  async executeBackupAndOverwrite(analysis, backupStrategy) {
    const spinner = ora("正在执行备份并覆盖安装...").start();

    try {
      // Create backups if requested
      if (backupStrategy !== "none" && analysis.backupRequired) {
        const backupPaths = analysis.existingFiles.map((f) => f.path);
        await this.mergeStrategies.createBackups(backupPaths);
      }

      // CRITICAL: Stop spinner before any potential prompts
      spinner.stop();

      // Update installer options for overwrite mode
      const mergedOptions = {
        ...this.options,
        force: true,
        overwrite: true,
      };

      // Use the base installer with overwrite settings
      console.log(
        chalk.gray("Creating CollectiveInstaller with overwrite options...")
      );
      const installer = new CollectiveInstaller(mergedOptions);

      console.log(chalk.gray("Starting installation..."));
      const result = await installer.install();
      console.log(chalk.gray("Installation completed!"));

      console.log(chalk.green("✅ 安装成功完成！"));
      console.log(chalk.green("\n✅ 备份和覆盖操作完成！"));
      if (backupStrategy !== "none") {
        console.log(chalk.blue("📦 您的原始文件已备份"));
      }

      console.log(chalk.yellow("\n💡 后续步骤："));
      console.log("1. 发起一个简单请求来测试智能体集合的功能");
      console.log("2. 重启 Claude Code 以便加载新配置");

      return { ...result, overwriteMode: true };
    } catch (error) {
      spinner.fail("备份并覆盖安装失败");
      throw error;
    }
  }

  /**
   * Execute force overwrite installation
   */
  async executeForceOverwrite(analysis, createBackup) {
    const spinner = ora("正在执行强制覆盖安装...").start();

    try {
      // Create backups if requested
      if (createBackup && analysis.backupRequired) {
        const backupPaths = analysis.existingFiles.map((f) => f.path);
        await this.mergeStrategies.createBackups(backupPaths);
      }

      // Force overwrite mode
      const forceOptions = {
        ...this.options,
        force: true,
        overwrite: true,
      };

      const installer = new CollectiveInstaller(forceOptions);
      const result = await installer.install();

      spinner.succeed("强制覆盖安装完成！");

      console.log(chalk.green("\n✅ 使用强制覆盖模式安装完成！"));
      if (createBackup) {
        console.log(chalk.blue("📦 先前的文件已备份"));
      }

      return { ...result, forceMode: true };
    } catch (error) {
      spinner.fail("强制覆盖安装失败");
      throw error;
    }
  }

  /**
   * Execute skip conflicts installation
   */
  async executeSkipConflicts(analysis) {
    const spinner = ora("正在安装无冲突的文件...").start();

    try {
      // Skip conflicts mode
      const skipOptions = {
        ...this.options,
        skipConflicts: true,
        overwrite: false,
      };

      const installer = new CollectiveInstaller(skipOptions);
      const result = await installer.install();

      spinner.succeed("安装完成 (已跳过冲突)");

      console.log(chalk.green("\n✅ 安装完成，并已跳过冲突！"));
      console.log(
        chalk.yellow("⚠️  由于跳过部分文件，某些智能体集合功能可能无法使用")
      );
      console.log(
        chalk.blue("💡 建议使用“智能合并”模式重新运行，以体验完整功能")
      );

      return { ...result, skipMode: true };
    } catch (error) {
      spinner.fail("跳过冲突文件的安装失败");
      throw error;
    }
  }

  /**
   * Show detailed analysis of existing setup
   */
  async showDetailedAnalysis(analysis) {
    console.log(chalk.cyan("\n🔍 详细配置分析\n"));

    if (analysis.existingFiles.length > 0) {
      console.log(chalk.white("📄 现有文件："));
      for (const file of analysis.existingFiles) {
        console.log(chalk.gray(`  • ${file.name} (${file.type})`));
      }
      console.log("");
    }

    if (analysis.conflicts.length > 0) {
      console.log(chalk.yellow("⚠️  检测到的冲突："));
      for (const conflict of analysis.conflicts) {
        console.log(
          chalk.gray(
            `  • ${conflict.type}: ${conflict.message || "配置存在重叠"}`
          )
        );
        if (conflict.conflicts) {
          for (const subConflict of conflict.conflicts) {
            console.log(chalk.gray(`    - ${subConflict.message}`));
          }
        }
      }
      console.log("");
    }

    console.log(chalk.green("📋 建议方案："));
    for (const rec of analysis.recommendations) {
      console.log(chalk.gray(`  • ${rec}`));
    }
    console.log("");

    await inquirer.prompt([
      {
        type: "input",
        name: "continue",
        message: "按 Enter 键继续...",
      },
    ]);
  }

  /**
   * Show detailed diff for a specific conflict
   */
  async showDetailedDiff(conflict) {
    console.log(chalk.cyan(`\n🔍 详细差异: ${conflict.type}\n`));

    if (conflict.type === "settings") {
      console.log(chalk.gray("您现有的 settings.json 结构："));
      console.log(chalk.gray("├── hooks"));
      console.log(chalk.gray("│   ├── PreToolUse (已存在)"));
      console.log(chalk.gray("│   └── PostToolUse (已存在)"));
      console.log(chalk.gray("└── deniedTools (已存在)"));
      console.log("");

      console.log(chalk.green("新版本将包含以下内容："));
      console.log(chalk.green("├── hooks"));
      console.log(chalk.green("│   ├── SessionStart (新增)"));
      console.log(chalk.green("│   ├── PreToolUse (与现有内容合并)"));
      console.log(chalk.green("│   ├── PostToolUse (与现有内容合并)"));
      console.log(chalk.green("│   └── SubagentStop (新增)"));
      console.log(chalk.green("└── deniedTools (与现有内容合并)"));
    }

    if (conflict.type === "hooks" && conflict.conflictingFiles) {
      console.log(chalk.gray("存在冲突的钩子文件："));
      for (const file of conflict.conflictingFiles) {
        console.log(chalk.gray(`  • ${file} - 将被新版本替换`));
      }
    }

    console.log("");
    await inquirer.prompt([
      {
        type: "input",
        name: "continue",
        message: "按 Enter 键继续...",
      },
    ]);
  }
}

module.exports = { InteractiveInstaller };
