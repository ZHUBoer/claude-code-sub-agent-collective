const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const { FileMapping } = require('./file-mapping');

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
    this.projectDir = process.cwd(); // 当前工作目录, 即项目根目录
    this.collectiveDir = path.join(this.projectDir, '.claude'); // .claude 目录的路径
    
    // --- 模板目录解析 ---
    // 为了在不同安装环境 (本地开发, 全局npm包) 下都能准确找到模板文件,
    // 我们以 `package.json` 的位置作为基准来定位 `templates` 目录.
    const packageJsonPath = require.resolve('../package.json');
    const packageRoot = path.dirname(packageJsonPath);
    this.templateDir = path.join(packageRoot, 'templates');
    
    // 如果主路径找不到, 尝试备用路径 (主要用于开发环境)
    if (!fs.existsSync(this.templateDir)) {
      const fallbackPaths = [
        path.join(__dirname, '..', 'templates'),  // 开发环境路径
        path.join(__dirname, '..', '..', 'templates'),  // 另一种 npm 结构
      ];
      
      this.templateDir = fallbackPaths.find(templatePath => fs.existsSync(templatePath)) || this.templateDir;
    }
    
    // --- 安装配置 ---
    // 这些变量将用于填充模板文件中的占位符.
    this.config = {
      projectRoot: this.projectDir,
      installDate: new Date().toISOString(),
      version: require('../package.json').version,
      userName: process.env.USER || process.env.USERNAME || 'developer',
      projectName: path.basename(this.projectDir)
    };
  }

  /**
   * @method install
   * @description 执行安装流程的主方法.
   */
  async install() {
    console.log(chalk.cyan('🚀 正在安装 claude-code-sub-agent-collective...\n'));

    try {
      // 1. 检查是否已存在安装
      await this.checkExistingInstallation();
      
      // 2. 根据选项决定安装模式
      // "Express" 或 "mergeMode" 会启用快速智能合并模式
      if (this.options.express || this.options.mergeMode) {
        return await this.performExpressInstallation();
      }
      
      // 3. 否则, 执行标准的交互式安装流程
      return await this.performStandardInstallation();
      
    } catch (error) {
      console.error(chalk.red('❌ 安装失败:'), error.message);
      throw error;
    }
  }

  /**
   * @method performStandardInstallation
   * @description 标准的, 分步执行的安装流程.
   */
  async performStandardInstallation() {
    await this.createDirectories();      // 创建目录结构
    await this.setupTaskMaster();       // 设置 TaskMaster
    await this.installTemplates();      // 安装模板文件
    await this.configureSettings();     // 配置 settings.json
    await this.setupHooks();            // 安装钩子脚本
    await this.installAgents();         // 安装 Agent 定义
    await this.validateInstallation();  // 验证安装结果
    
    console.log(chalk.green('\n✅ 安装完成!'));
    console.log(chalk.yellow('\n后续步骤:'));
    console.log('1. 查看 CLAUDE.md 以了解行为指令');
    console.log('2. 使用一个简单的请求测试 Agent 路由');
    console.log('3. 运行 npx claude-tdd-agents validate 来检查安装');
    
    return { success: true, path: this.collectiveDir };
  }

  /**
   * @method performExpressInstallation
   * @description 快速, 非交互式的安装模式, 会自动处理文件冲突.
   *              此模式主要用于自动化脚本或CI/CD环境.
   */
  async performExpressInstallation() {
    console.log(chalk.gray('[调试] 启动 performExpressInstallation'));
    const { MergeStrategies } = require('./merge-strategies');
    const mergeStrategies = new MergeStrategies(this.projectDir, this.options);
    
    // 1. 分析现有安装, 检查与模板文件的冲突.
    const spinner = ora('正在分析现有设置以进行快速安装...').start();
    const analysis = await mergeStrategies.analyzeExistingSetup(this.templateDir);
    
    // 2. 如果存在冲突, 根据策略处理.
    if (analysis.hasConflicts) {
      spinner.text = '检测到冲突 - 正在应用智能合并策略...';
      
      // 2a. 如果配置了备份, 则创建备份.
      if (this.options.backup !== 'none' && analysis.backupRequired) {
        const backupPaths = analysis.existingFiles.map(f => f.path);
        await mergeStrategies.createBackups(backupPaths);
        console.log(chalk.blue('📦 已创建现有文件的备份'));
      }
    } else {
      spinner.text = '检测到全新安装 - 继续标准流程...';
    }
    
    spinner.stop();
    
    // 3. 执行与标准安装相同的安装步骤. 
    //    关键区别在于所有决策都是自动化的, 不会提示用户.
    await this.createDirectories();
    await this.setupTaskMaster();
    await this.installTemplates(); // installMappedFile 会处理覆盖逻辑
    await this.configureSettings();
    await this.setupHooks();
    await this.installAgents();
    await this.validateInstallation();
    
    console.log(chalk.green('\n✅ 快速安装成功完成!'));
    
    if (analysis.hasConflicts) {
      console.log(chalk.blue('📦 现有文件已备份并被新版本覆盖'));
    } else {
      console.log(chalk.green('✨ 全新安装 - 所有文件已安装或因内容相同而跳过'));
    }
    
    return { success: true, path: this.collectiveDir, expressMode: true, conflicts: analysis.hasConflicts };
  }

  /**
   * @method checkExistingInstallation
   * @description 检查是否已经存在 .claude 目录, 并据此决定下一步操作.
   */
  async checkExistingInstallation() {
    if (await fs.pathExists(this.collectiveDir) && !this.options.force) {
      // 在快速模式下, 自动采用智能合并, 不提示用户
      if (this.options.express) {
        console.log(chalk.gray('📁 检测到现有安装 - 使用智能合并模式'));
        this.options.mode = this.options.mode || 'smart-merge';
        return;
      }
      
      // 在交互模式下, 提示用户是否覆盖
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'Claude collective 目录已存在. 是否覆盖?',
        default: false
      }]);
      
      if (!overwrite) {
        console.log(chalk.yellow('安装已取消'));
        process.exit(0);
      }
    }
  }

  /**
   * @method createDirectories
   * @description 创建框架所需的全部目录结构.
   */
  async createDirectories() {
    const spinner = ora('正在创建目录结构...').start();
    
    const dirs = [
      '.claude', '.claude/agents', '.claude/hooks', '.claude/commands',
      '.claude-collective', '.claude-collective/tests', '.claude-collective/tests/handoffs',
      '.claude-collective/tests/directives', '.claude-collective/tests/contracts', '.claude-collective/metrics',
      '.taskmaster', '.taskmaster/tasks', '.taskmaster/docs', '.taskmaster/reports', '.taskmaster/templates'
    ];
    
    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.projectDir, dir));
    }
    
    spinner.succeed('目录结构创建完毕');
  }

  /**
   * @method installTemplates
   * @description 安装所有通用的模板文件.
   */
  async installTemplates() {
    const spinner = ora('正在安装模板文件...').start();
    try {
      const fileMapping = new FileMapping(this.projectDir, this.options);
      const installationType = this.options.minimal ? 'minimal' : 'full';
      const mappings = fileMapping.getFilteredMapping(installationType);
      
      spinner.text = `正在安装 ${mappings.length} 个模板文件...`;
      
      for (const mapping of mappings) {
        await this.installMappedFile(mapping);
        spinner.text = `正在安装: ${mapping.description}`;
      }
      
      spinner.succeed(`模板文件安装完毕 (${mappings.length} 个文件)`);
    } catch (error) {
      spinner.fail('模板安装失败');
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
    
    // 1. 检查模板源文件是否存在.
    if (!await fs.pathExists(sourcePath)) {
      console.warn(chalk.yellow(`警告: 找不到模板文件: ${mapping.source}`));
      return;
    }
    
    // 2. 检查目标文件是否已存在.
    if (await fs.pathExists(mapping.target)) {
      // 3. 如果文件映射被标记为不覆盖 (`overwrite: false`), 例如用户配置文件,
      //    则需要进行特殊处理以避免覆盖用户的修改.
      if (!mapping.overwrite) {
        const { MergeStrategies } = require('./merge-strategies');
        const mergeStrategies = new MergeStrategies(this.projectDir, this.options);
        
        // 3a. 比较模板文件和目标文件的内容是否完全相同.
        let templateContent = await fs.readFile(sourcePath, 'utf8');
        templateContent = this.processTemplate(templateContent, this.config);
        
        const tempFile = sourcePath + '.processed';
        await fs.writeFile(tempFile, templateContent);
        
        try {
          const isIdentical = await mergeStrategies.areFilesIdentical(mapping.target, tempFile);
          
          // 3b. 如果内容相同, 则无需任何操作, 直接跳过.
          if (isIdentical) {
            return;
          }

          // 3c. 如果内容不同, 且用户没有使用 --force 强制覆盖, 则跳过此文件.
          if (!this.options.force && !this.options.overwrite) {
            console.log(chalk.blue(`跳过已存在且内容不同的文件: ${path.basename(mapping.target)}`));
            return;
          }
          
          // 3d. 在强制覆盖模式下, 先创建备份, 然后再继续执行覆盖操作.
          console.log(chalk.yellow(`正在备份并覆盖: ${path.basename(mapping.target)}`));
          await this.createBackupOfFile(mapping.target);

        } finally {
          await fs.remove(tempFile); // 确保临时文件被清理.
        }
      }
    }
    
    // 4. 读取模板内容, 替换占位符.
    let content = await fs.readFile(sourcePath, 'utf8');
    content = this.processTemplate(content, this.config);
    
    // 5. 确保目标目录存在, 然后写入文件.
    await fs.ensureDir(path.dirname(mapping.target));
    await fs.writeFile(mapping.target, content);
    
    // 6. 如果文件被标记为可执行 (如钩子脚本), 添加执行权限.
    if (mapping.executable) {
      await fs.chmod(mapping.target, '755');
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
    // 替换动态变量, 例如 {{projectName}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, variables[key]);
    });
    return processed;
  }

  /**
   * @method configureSettings
   * @description 安装所有配置文件.
   */
  async configureSettings() {
    const spinner = ora('正在配置 settings.json...').start();
    const fileMapping = new FileMapping(this.projectDir, this.options);
    const configMappings = fileMapping.getConfigMapping();
    
    for (const mapping of configMappings) {
      await this.installMappedFile(mapping);
    }
    
    spinner.succeed('配置文件安装完毕');
  }

  /**
   * @method setupHooks
   * @description 安装所有钩子脚本.
   */
  async setupHooks() {
    const spinner = ora('正在安装钩子脚本...').start();
    const fileMapping = new FileMapping(this.projectDir, this.options);
    const hookMappings = fileMapping.getHookMapping();
    
    for (const mapping of hookMappings) {
      await this.installMappedFile(mapping);
    }
    
    spinner.succeed('钩子脚本安装完毕');
  }

  /**
   * @method installAgents
   * @description 安装所有 Agent 定义文件.
   */
  async installAgents() {
    const spinner = ora('正在安装 Agent 定义...').start();
    const fileMapping = new FileMapping(this.projectDir, this.options);
    const agentMappings = fileMapping.getAgentMapping();
    
    for (const mapping of agentMappings) {
      await this.installMappedFile(mapping);
    }
    
    spinner.succeed('Agent 定义安装完毕');
  }

  /**
   * @method validateInstallation
   * @description 验证安装是否成功, 检查关键文件和目录是否存在.
   */
  async validateInstallation() {
    const spinner = ora('正在验证安装...').start();
    const checks = [
      { name: 'CLAUDE.md 存在', path: 'CLAUDE.md' },
      { name: 'settings.json 已配置', path: '.claude/settings.json' },
      { name: 'Hooks 目录存在', path: '.claude/hooks' },
      { name: 'Agents 目录存在', path: '.claude/agents' },
      { name: 'Tests 目录存在', path: '.claude-collective/tests' }
    ];
    
    let allPassed = true;
    for (const check of checks) {
      const exists = await fs.pathExists(path.join(this.projectDir, check.path));
      if (!exists) allPassed = false;
    }
    
    if (allPassed) {
      spinner.succeed('安装验证通过');
    } else {
      spinner.fail('安装验证失败');
      throw new Error('安装验证失败, 缺少关键文件.');
    }
  }

  /**
   * @method setupTaskMaster
   * @description 设置预配置的 TaskMaster 环境.
   */
  async setupTaskMaster() {
    const spinner = ora('正在设置预配置的 TaskMaster...').start();
    try {
      const taskmasterTemplate = path.join(this.templateDir, '.taskmaster');
      const taskmasterTarget = path.join(this.projectDir, '.taskmaster');
      
      if (await fs.pathExists(taskmasterTemplate)) {
        await fs.copy(taskmasterTemplate, taskmasterTarget);
        spinner.succeed('TaskMaster 已预配置 (无需初始化)');
      } else {
        spinner.warn('未找到 TaskMaster 模板, 将创建最小化结构');
        await this.createMinimalTaskMaster();
      }
    } catch (error) {
      spinner.fail('TaskMaster 设置失败');
      throw error;
    }
  }

  /**
   * @method createMinimalTaskMaster
   * @description 如果模板不存在, 创建一个最小化的 TaskMaster 配置.
   */
  async createMinimalTaskMaster() {
    const taskmasterDir = path.join(this.projectDir, '.taskmaster');
    const config = { main: "claude-3-5-sonnet-20241022" };
    await fs.writeFile(path.join(taskmasterDir, 'config.json'), JSON.stringify(config, null, 2));
    // ... 创建其他必要的文件
  }

  /**
   * @method getInstallationStatus
   * @description 检查安装状态并返回一个包含详细信息的对象.
   * @returns {Promise<object>} 一个包含安装状态详细信息的对象.
   */
  async getInstallationStatus() {
    const status = {
      version: require('../package.json').version,
      installed: false,
      behavioral: false,
      testing: false,
      hooks: false,
      agents: [],
      issues: []
    };

    const claudeDirExists = await fs.pathExists(this.collectiveDir);
    if (!claudeDirExists) {
      status.issues.push('.claude 目录不存在.');
      return status;
    }

    const checks = {
      behavioral: path.join(this.projectDir, 'CLAUDE.md'),
      hooks: path.join(this.collectiveDir, 'settings.json'),
      testing: path.join(this.projectDir, '.claude-collective', 'tests'),
    };

    status.behavioral = await fs.pathExists(checks.behavioral);
    if (!status.behavioral) {
        status.issues.push('CLAUDE.md 文件缺失.');
    }

    status.hooks = await fs.pathExists(checks.hooks);
    if (!status.hooks) {
        status.issues.push('.claude/settings.json 文件缺失.');
    }

    status.testing = await fs.pathExists(checks.testing);
    if (!status.testing) {
        status.issues.push('.claude-collective/tests 目录缺失.');
    }
    
    try {
        const agentsDir = path.join(this.collectiveDir, 'agents');
        if (await fs.pathExists(agentsDir)) {
          status.agents = (await fs.readdir(agentsDir)).filter(f => f.endsWith('.md'));
        } else {
          status.issues.push('.claude/agents 目录缺失.');
        }
    } catch (e) {
        status.issues.push('无法读取 agents 目录.');
    }

    status.installed = status.behavioral && status.hooks;
    
    return status;
  }
}

module.exports = { CollectiveInstaller };