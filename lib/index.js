#!/usr/bin/env node

/**
 * @file Claude Code Sub-Agent Collective
 * @description 这是整个框架的主入口文件.
 */

const fs = require('fs-extra');
const path = require('path');
const { CollectiveInstaller } = require('./installer');
const { CollectiveValidator } = require('./validator');

/**
 * @class ClaudeCodeCollective
 * @description 框架的核心类, 负责处理安装, 校验和信息获取等主要功能.
 */
class ClaudeCodeCollective {
  /**
   * @constructor
   * @description 初始化一个新的 ClaudeCodeCollective 实例.
   * - `version`: 从 package.json 中读取当前版本号.
   * - `templatesPath`: 设置模板文件的路径.
   */
  constructor() {
    this.version = require('../package.json').version;
    this.templatesPath = path.join(__dirname, '../templates');
  }

  /**
   * @method install
   * @description 在指定路径安装 "agent collective" 框架.
   * @param {string} [targetPath='.'] - 目标安装路径, 默认为当前目录.
   */
  async install(targetPath = '.') {
    console.log(`Claude Code Sub-Agent Collective v${this.version}`);
    console.log('正在安装 "collective" 框架...');
    
    try {
      // 使用 installer 来处理具体的安装逻辑
      const installer = new CollectiveInstaller({ targetPath });
      await installer.install();
      console.log('✅ 安装完成!');
    } catch (error) {
      console.error('❌ 安装失败:', error.message);
      process.exit(1); // 安装失败则退出进程
    }
  }

  /**
   * @method validate
   * @description 校验指定项目路径下的 "collective" 安装是否正确.
   * @param {string} [projectPath='.'] - 需要校验的项目路径, 默认为当前目录.
   * @returns {Promise<object>} 返回一个包含校验结果的对象.
   */
  async validate(projectPath = '.') {
    console.log('正在校验 "collective" 的安装...');
    
    try {
      const validator = new CollectiveValidator(projectPath);
      const result = await validator.validateInstallation();
      
      // 处理校验结果
      const failures = result.tests.filter(test => !test.passed);
      const successes = result.tests.filter(test => test.passed);
      
      if (failures.length === 0) {
        console.log('✅ "Collective" 校验通过!');
        console.log(`所有 ${successes.length} 项检查均成功通过.`);
        return { valid: true, tests: result.tests };
      } else {
        console.log('❌ 校验失败:');
        failures.forEach(failure => {
          console.log(`  - ${failure.name}: ${failure.error || '失败'}`);
        });
        console.log(`\n在 ${result.tests.length} 项检查中, 有 ${failures.length} 项失败.`);
        return { valid: false, tests: result.tests, failures };
      }
    } catch (error) {
      console.error('❌ 校验出错:', error.message);
      process.exit(1); // 校验出错则退出进程
    }
  }

  /**
   * @method getInfo
   * @description 获取关于 "collective" 框架的信息.
   * @returns {object} 返回一个包含框架名称, 版本, 描述和功能列表的对象.
   */
  getInfo() {
    return {
      name: 'claude-tdd-agents
      version: this.version,
      description: '用于 Claude Code 的 "sub-agent collective" 框架, 具备 TDD 校验, hub-spoke 协调和自动化切换功能',
      features: [
        'TDD 校验框架',
        'Hub-Spoke Agent 协调', 
        '自动化 Agent 切换',
        '基于契约的质量门',
        '研究指标收集',
        '动态 Agent 生成'
      ]
    };
  }
}

// 将核心类导出, 以便其他模块使用
module.exports = { ClaudeCodeCollective };

// --- 命令行接口 (CLI) ---
// 这部分代码使得该脚本可以作为命令行工具直接运行.
if (require.main === module) {
  const collective = new ClaudeCodeCollective();
  const command = process.argv[2];     // 获取命令 (如: install, validate)
  const target = process.argv[3] || '.'; // 获取目标路径, 默认为当前目录

  switch (command) {
    case 'install':
      collective.install(target);
      break;
    case 'validate':
      collective.validate(target);
      break;
    case 'info':
      console.log(JSON.stringify(collective.getInfo(), null, 2));
      break;
    default:
      console.log('用法: claude-tdd-agentstall|validate|info> [target-path]');
      console.log('  install   - 安装 "collective" 框架');
      console.log('  validate  - 校验框架安装的完整性');
      console.log('  info      - 显示框架相关信息');
  }
}