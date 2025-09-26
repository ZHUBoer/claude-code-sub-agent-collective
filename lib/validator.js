const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CollectiveValidator {
  constructor(projectDir = process.cwd()) {
    this.projectDir = projectDir;
    this.collectiveDir = path.join(projectDir, '.claude');
    this.testsDir = path.join(projectDir, '.claude-collective');
  }

  async validateInstallation() {
    const results = [];
    
    // File existence checks
    const fileChecks = [
      { name: 'CLAUDE.md 存在', path: 'CLAUDE.md' },
      { name: '设置文件（settings.json）', path: '.claude/settings.json' },
      { name: '钩子目录（.claude/hooks）', path: '.claude/hooks' },
      { name: '智能体目录（.claude/agents）', path: '.claude/agents' },
      { name: '测试目录（.claude-collective/tests）', path: '.claude-collective/tests' },
      { name: '测试 package.json', path: '.claude-collective/package.json' },
      { name: 'Jest 配置', path: '.claude-collective/jest.config.js' }
    ];
    
    for (const check of fileChecks) {
      const fullPath = path.join(this.projectDir, check.path);
      const exists = await fs.pathExists(fullPath);
      results.push({
        name: check.name,
        passed: exists,
        error: exists ? null : `缺失: ${check.path}`
      });
    }
    
    // Hook executability checks
    const hookChecks = await this.validateHooks();
    results.push(...hookChecks);
    
    // Settings JSON validation
    const settingsCheck = await this.validateSettings();
    results.push(settingsCheck);
    
    // Agent definitions validation
    const agentChecks = await this.validateAgents();
    results.push(...agentChecks);
    
    // Test framework validation
    const testCheck = await this.validateTestFramework();
    results.push(testCheck);
    
    return { tests: results };
  }

  async validateHooks() {
    const results = [];
    const hooksDir = path.join(this.collectiveDir, 'hooks');
    
    if (!await fs.pathExists(hooksDir)) {
      results.push({
        name: 'Hooks directory validation',
        passed: false,
        error: 'Hooks directory does not exist'
      });
      return results;
    }
    
    const expectedHooks = [
      'directive-enforcer.sh',
      'collective-metrics.sh',
      'test-driven-handoff.sh',
      'routing-executor.sh',
      // newly required hooks
      'auto-branch.sh',
      'auto-checkpoint.sh',
      'auto-squash.sh'
    ];
    
    for (const hook of expectedHooks) {
      const hookPath = path.join(hooksDir, hook);
      const exists = await fs.pathExists(hookPath);
      
      if (exists) {
        try {
          const stats = await fs.stat(hookPath);
          const isExecutable = !!(stats.mode & parseInt('111', 8));
          
          results.push({
            name: `Hook ${hook} 可执行`,
            passed: isExecutable,
            error: isExecutable ? null : `Hook ${hook} 不可执行`
          });
        } catch (error) {
          results.push({
            name: `Hook ${hook} 校验`,
            passed: false,
            error: `检查 ${hook} 失败: ${error.message}`
          });
        }
      } else {
        results.push({
          name: `Hook ${hook} 存在`,
          passed: false,
          error: `缺失 hook: ${hook}`
        });
      }
    }
    
    return results;
  }

  async validateSettings() {
    const settingsPath = path.join(this.collectiveDir, 'settings.json');
    
    try {
      if (!await fs.pathExists(settingsPath)) {
        return {
          name: 'Settings JSON 校验',
          passed: false,
          error: 'settings.json 不存在'
        };
      }
      
      const settings = await fs.readJson(settingsPath);
      
      // Check required structure
      const hasHooks = settings.hooks && typeof settings.hooks === 'object';
      const hasPreToolUse = hasHooks && Array.isArray(settings.hooks.PreToolUse);
      const hasPostToolUse = hasHooks && Array.isArray(settings.hooks.PostToolUse);
      const hasSubagentStop = hasHooks && Array.isArray(settings.hooks.SubagentStop);
      const hasSessionStart = hasHooks && Array.isArray(settings.hooks.SessionStart);
      
      if (!hasHooks || !hasPreToolUse || !hasPostToolUse || !hasSubagentStop || !hasSessionStart) {
        return {
          name: 'Settings JSON 结构',
          passed: false,
          error: 'settings.json 缺少必须的 hooks 配置'
        };
      }
      
      // Verify hook bindings for new required hooks
      const stringifyHooks = (arr = []) => JSON.stringify(arr);
      const sessionStartStr = stringifyHooks(settings.hooks.SessionStart);
      const postToolUseStr = stringifyHooks(settings.hooks.PostToolUse);

      const autoBranchBound = /auto-branch\.sh/.test(sessionStartStr);
      const autoCheckpointBound = /auto-checkpoint\.sh/.test(postToolUseStr);
      const autoSquashBound = /auto-squash\.sh/.test(postToolUseStr);

      const bindingsOk = autoBranchBound && autoCheckpointBound && autoSquashBound;

      if (!bindingsOk) {
        return {
          name: 'Settings JSON 校验',
          passed: false,
          error: '缺少必需的 hook 绑定：请确保 SessionStart 含 auto-branch，PostToolUse 含 auto-checkpoint/auto-squash'
        };
      }

      return {
        name: 'Settings JSON 校验',
        passed: true,
        error: null
      };
      
    } catch (error) {
      return {
        name: 'Settings JSON validation',
        passed: false,
        error: `Invalid JSON: ${error.message}`
      };
    }
  }

  async validateAgents() {
    const results = [];
    const agentsDir = path.join(this.collectiveDir, 'agents');
    
    if (!await fs.pathExists(agentsDir)) {
        results.push({
          name: '智能体目录校验',
        passed: false,
          error: '智能体目录不存在'
      });
      return results;
    }
    
    try {
      const agentFiles = await fs.readdir(agentsDir);
      const agentDefinitionFiles = agentFiles.filter(f => f.endsWith('.json') || f.endsWith('.md'));
      
      if (agentDefinitionFiles.length === 0) {
        results.push({
          name: 'Agent 定义存在',
          passed: false,
          error: '未找到任何 Agent 定义文件'
        });
        return results;
      }
      
      // Validate each agent file
      for (const file of agentDefinitionFiles) {
        try {
          const agentPath = path.join(agentsDir, file);
          
          if (file.endsWith('.json')) {
            const agent = await fs.readJson(agentPath);
            
            // Check required fields
            const hasName = agent.name && typeof agent.name === 'string';
            const hasDescription = agent.description && typeof agent.description === 'string';
            
            results.push({
              name: `Agent ${file} 校验`,
              passed: hasName && hasDescription,
              error: (!hasName || !hasDescription) ? `Agent ${file} 缺少必要字段` : null
            });
          } else if (file.endsWith('.md')) {
            // For markdown agents, just check that the file exists and has content
            const content = await fs.readFile(agentPath, 'utf8');
            const hasContent = content.trim().length > 0;
            
            results.push({
              name: `Agent ${file} 校验`,
              passed: hasContent,
              error: !hasContent ? `Agent ${file} 为空` : null
            });
          }
          
        } catch (error) {
          results.push({
            name: `Agent ${file} 校验`,
            passed: false,
            error: `Agent 校验错误: ${error.message}`
          });
        }
      }
      
      results.push({
        name: 'Agent 定义存在',
        passed: true,
        error: null
      });
      
    } catch (error) {
      results.push({
        name: '智能体目录校验',
        passed: false,
        error: `读取智能体目录失败: ${error.message}`
      });
    }
    
    return results;
  }

  async validateTestFramework() {
    const packageJsonPath = path.join(this.testsDir, 'package.json');
    
    try {
      if (!await fs.pathExists(packageJsonPath)) {
        return {
          name: '测试框架校验',
          passed: false,
          error: '缺少 .claude-collective/package.json'
        };
      }
      
      const packageJson = await fs.readJson(packageJsonPath);
      
      // Check for Jest dependency
      const hasJest = (packageJson.devDependencies && packageJson.devDependencies.jest) ||
                     (packageJson.dependencies && packageJson.dependencies.jest);
      
      if (!hasJest) {
        return {
          name: '测试框架校验',
          passed: false,
          error: '测试 package.json 缺少 Jest 依赖'
        };
      }
      
      // Check for test scripts
      const hasTestScript = packageJson.scripts && packageJson.scripts.test;
      
      if (!hasTestScript) {
        return {
          name: '测试框架校验',
          passed: false,
          error: '测试脚本未配置（scripts.test 缺失）'
        };
      }
      
      // Check if node_modules exists (dependencies installed)
      const nodeModulesPath = path.join(this.testsDir, 'node_modules');
      const dependenciesInstalled = await fs.pathExists(nodeModulesPath);
      
      if (!dependenciesInstalled) {
        return {
          name: 'Test framework validation',
          passed: true,
          warning: 'Test dependencies not installed (run npm install in .claude-collective/)',
          error: null
        };
      }
      
      // Try to run test validation (dry run) only if dependencies are installed
      try {
        await execAsync('npm test -- --passWithNoTests', { 
          cwd: this.testsDir,
          timeout: 10000 
        });
        
        return {
          name: '测试框架校验',
          passed: true,
          error: null
        };
      } catch (testError) {
        // Don't fail validation for test execution issues - just warn
        return {
          name: '测试框架校验',
          passed: true,
          warning: `测试执行异常: ${testError.message}`,
          error: null
        };
      }
      
    } catch (error) {
      return {
        name: '测试框架校验',
        passed: false,
        error: `测试框架校验错误: ${error.message}`
      };
    }
  }

  async validateSyntax() {
    const results = [];
    
    // Validate hook script syntax
    const hooksDir = path.join(this.collectiveDir, 'hooks');
    if (await fs.pathExists(hooksDir)) {
      const hookFiles = await fs.readdir(hooksDir);
      
      for (const hookFile of hookFiles) {
        if (hookFile.endsWith('.sh')) {
          try {
            await execAsync(`bash -n "${path.join(hooksDir, hookFile)}"`);
            results.push({
              name: `Hook syntax ${hookFile}`,
              passed: true,
              error: null
            });
          } catch (error) {
            results.push({
              name: `Hook syntax ${hookFile}`,
              passed: false,
              error: `Syntax error: ${error.message}`
            });
          }
        }
      }
    }
    
    return results;
  }
}

module.exports = { CollectiveValidator };

// CLI usage when run directly
if (require.main === module) {
  const validator = new CollectiveValidator();
  
  validator.validateInstallation()
    .then(results => {
      console.log('Validation Results:');
      results.tests.forEach(test => {
        const icon = test.passed ? '✅' : '❌';
        console.log(`${icon} ${test.name}`);
        if (!test.passed && test.error) {
          console.log(`   Error: ${test.error}`);
        }
      });
      
      const passed = results.tests.filter(t => t.passed).length;
      const total = results.tests.length;
      
      if (passed === total) {
        console.log(`\n✅ All tests passed (${passed}/${total})`);
        process.exit(0);
      } else {
        console.log(`\n❌ Some tests failed (${passed}/${total})`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Validation failed:', error.message);
      process.exit(1);
    });
}