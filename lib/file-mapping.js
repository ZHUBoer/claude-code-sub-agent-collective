
const path = require('path');

class FileMapping {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.options = options;
    this.paths = {
      claude: path.join(projectRoot, '.claude'),
      collective: path.join(projectRoot, '.claude-collective'),
      root: projectRoot
    };
  }

  getFileMapping() {
    return [
      ...this.getBehavioralMapping(),
      ...this.getCollectiveMapping(),
      ...this.getAgentMapping(),
      ...this.getHookMapping(),
      ...this.getCommandMapping(),
      ...this.getTestMapping(),
      ...this.getConfigMapping(),
      ...this.getDocumentationMapping()
    ];
  }

  getBehavioralMapping() {
    return [{
      source: 'CLAUDE.md',
      target: path.join(this.paths.root, 'CLAUDE.md'),
      type: 'behavioral',
      required: true,
      overwrite: this.options.force || false,
      description: '主行为指令文件'
    }];
  }

  getCollectiveMapping() {
    return [{
        source: 'collective-package.json',
        target: path.join(this.paths.collective, 'package.json'),
        type: 'collective',
        required: true,
        overwrite: true,
        description: 'Collective a test package.json'
    }];
  }

  getAgentMapping() {
    const allAgents = [
        'behavioral-transformation-agent.md', 'command-system-agent.md', 'completion-gate.md',
        'component-implementation-agent.md', 'devops-agent.md', 'dynamic-agent-creator.md',
        'enhanced-project-manager-agent.md', 'enhanced-quality-gate.md', 'feature-implementation-agent.md',
        'functional-testing-agent.md', 'hook-integration-agent.md', 'infrastructure-implementation-agent.md',
        'metrics-collection-agent.md', 'npx-package-agent.md', 'polish-implementation-agent.md',
        'prd-agent.md', 'prd-mvp.md', 'prd-parser-agent.md', 'prd-research-agent.md',
        'quality-agent.md', 'readiness-gate.md', 'research-agent.md', 'routing-agent.md',
        'task-checker.md', 'task-executor.md', 'task-generator-agent.md', 'task-orchestrator.md',
        'tdd-validation-agent.md', 'test-handoff-agent.md', 'testing-implementation-agent.md',
        'van-maintenance-agent.md', 'workflow-agent.md'
    ];
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

  getHookMapping() {
    const hooks = [
        { file: 'agent-detection.sh', required: true, description: 'Detects active agent' },
        { file: 'block-destructive-commands.sh', required: true, description: 'Blocks harmful commands' },
        { file: 'collective-metrics.sh', required: true, description: 'Collects usage metrics' },
        { file: 'directive-enforcer.sh', required: true, description: 'Enforces CLAUDE.md directives' },
        { file: 'handoff-automation.sh', required: false, description: 'Automates agent handoffs' },
        { file: 'load-behavioral-system.sh', required: true, description: 'Loads behavioral system' },
        { file: 'mock-deliverable-generator.sh', required: false, description: 'Generates mock deliverables' },
        { file: 'research-evidence-validation.sh', required: false, description: 'Validates research evidence' },
        { file: 'routing-executor.sh', required: true, description: 'Executes routing decisions' },
        { file: 'test-driven-handoff.sh', required: true, description: 'Enforces TDD on handoffs' },
        { file: 'workflow-coordinator.sh', required: false, description: 'Coordinates complex workflows' }
    ];
    return hooks.map(hook => ({
      source: path.join('hooks', hook.file),
      target: path.join(this.paths.claude, 'hooks', hook.file),
      type: 'hook',
      required: hook.required,
      executable: true,
      overwrite: true,
      description: hook.description
    }));
  }

  getCommandMapping() {
    return [];
  }

  getTestMapping() {
    return [{
        source: 'jest.config.js',
        target: path.join(this.paths.collective, 'jest.config.js'),
        type: 'test',
        required: true,
        overwrite: true,
        description: 'Jest configuration for collective tests'
    }];
  }

  getConfigMapping() {
    return [{
      source: 'settings.json.template',
      target: path.join(this.paths.claude, 'settings.json'),
      type: 'config',
      required: true,
      overwrite: this.options.force || false,
      description: 'Claude Code 钩子配置文件'
    }];
  }

  getDocumentationMapping() {
    const docs = [
        'AGENT-INTERACTION-DIAGRAM.md', 'Hub-Spoke-Coordination-Guide.md', 'README.md',
        'RESEARCH-CACHE-PROTOCOL.md', 'RESEARCH-TASK-TEMPLATE.md', 'TROUBLESHOOTING.md'
    ];
    return docs.map(doc => ({
        source: path.join('docs', doc),
        target: path.join(this.paths.collective, 'docs', doc),
        type: 'doc',
        required: false,
        overwrite: true,
        description: `Documentation: ${doc}`
    }));
  }

  getFilteredMapping(installationType = 'full') {
    const allMappings = this.getFileMapping();
    
    if (installationType === 'minimal') {
      return allMappings.filter(m => m.required);
    }
    return allMappings;
  }
}

module.exports = { FileMapping };
