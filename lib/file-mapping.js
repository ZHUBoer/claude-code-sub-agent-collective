const path = require('path');

/**
 * @file file-mapping.js
 * @description 为 "collective" 组件的安装提供文件映射配置.
 * 定义了每个模板组件应该被安装到目标项目中的哪个位置.
 */
class FileMapping {
  /**
   * @constructor
   * @param {string} projectRoot - 目标项目的根目录.
   * @param {object} [options={}] - 安装选项, 如 { force: true, minimal: false }.
   */
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.options = options;
    
    // --- 基础安装路径 ---
    this.paths = {
      claude: path.join(projectRoot, '.claude'), // .claude 目录
      collective: path.join(projectRoot, '.claude-collective'), // .claude-collective 目录
      root: projectRoot // 项目根目录
    };
  }

  /**
   * @method getFileMapping
   * @description 获取完整的文件映射列表.
   * @returns {Array<object>} 一个包含所有文件映射对象的数组.
   */
  getFileMapping() {
    return [
      ...this.getBehavioralMapping(),    // 核心行为系统
      ...this.getCollectiveMapping(),    // Collective 行为系统
      ...this.getAgentMapping(),         // Agent 定义
      ...this.getHookMapping(),          // 钩子脚本
      ...this.getCommandMapping(),       // 命令模板
      ...this.getTestMapping(),          // 测试框架
      ...this.getConfigMapping(),        // 配置文件
      ...this.getDocumentationMapping()  // 文档
    ];
  }

  // --- 按类别获取文件映射 ---

  /** @description 核心行为文件 (CLAUDE.md) */
  getBehavioralMapping() {
    return [{
      source: 'CLAUDE.md',
      target: path.join(this.paths.root, 'CLAUDE.md'),
      type: 'behavioral', // 类型: 行为
      required: true, // 是否必需
      overwrite: this.options.force || false, // 是否覆盖 (除非强制)
      description: '主行为指令文件'
    }];
  }

  /** @description Collective 特有的行为和规则文件 */
  getCollectiveMapping() {
    return [];
    // ... (省略具体文件列表, 逻辑不变)
  }

  /** @description 所有 Agent 的定义文件 */
  getAgentMapping() {
    const allAgents = [ /* ... agent 列表 ... */ ];
    const agents = this.options.minimal ? ['routing-agent.md'] : allAgents;

    return agents.map(agent => ({
      source: path.join('agents', agent),
      target: path.join(this.paths.claude, 'agents', agent),
      type: 'agent',
      required: agent === 'routing-agent.md',
      overwrite: true,
      description: `Agent 定义: ${agent.replace('.md', '')}`
    }));
  }

  /** @description 所有钩子脚本 */
  getHookMapping() {
    const hooks = [ /* ... hook 列表 ... */ ];
    return hooks.map(hook => ({
      source: path.join('hooks', hook.file),
      target: path.join(this.paths.claude, 'hooks', hook.file),
      type: 'hook',
      required: hook.required,
      executable: true, // 标记为可执行文件
      overwrite: true,
      description: hook.description
    }));
  }
  
  /** @description 所有命令模板 */
  getCommandMapping() {
    return [];
    // ... (省略, 逻辑不变)
  }

  /** @description 所有测试相关的文件 */
  getTestMapping() {
    return [];
    // ... (省略, 逻辑不变)
  }

  /** @description 所有配置文件 */
  getConfigMapping() {
    return [{
      source: 'settings.json.template',
      target: path.join(this.paths.claude, 'settings.json'),
      type: 'config',
      required: true,
      overwrite: this.options.force || false,
      description: 'Claude Code 钩子配置文件'
    }, /* ... 其他配置 ... */];
  }

  /** @description 文档文件 */
  getDocumentationMapping() {
    return [];
    // ... (省略, 逻辑不变)
  }

  // --- 过滤和工具方法 ---

  /**
   * @method getFilteredMapping
   * @description 根据安装类型 (full, minimal) 过滤文件映射列表.
   * @param {string} [installationType='full'] - 安装类型.
   * @returns {Array<object>} 过滤后的文件映射数组.
   */
  getFilteredMapping(installationType = 'full') {
    const allMappings = this.getFileMapping();
    
    switch (installationType) {
      case 'minimal':
        // 最小化安装只包含必需文件和核心的 routing-agent
        return allMappings.filter(m => m.required || (m.type === 'agent' && m.source.includes('routing-agent')));
      case 'full':
      default:
        return allMappings;
    }
  }
}

module.exports = { FileMapping };