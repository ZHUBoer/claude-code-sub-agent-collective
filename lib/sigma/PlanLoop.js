const fs = require('fs-extra');

class SigmaPlanLoop {
  constructor(options = {}) {
    this.options = options;
  }

  async execute({ module, designPath, planPath, rounds = 1, overwrite = false }) {
    const hasDesign = await fs.pathExists(designPath);
    if (!hasDesign) {
      return { success: false, code: 'DESIGN_NOT_FOUND', designPath };
    }
    if (!overwrite && await fs.pathExists(planPath)) {
      return { success: true, statusCode: '→PR', planPath };
    }

    const design = await fs.readFile(designPath, 'utf8');
    const interfaces = this.extractInterfaceSignatures(design);

    const plan = {
      module,
      cycles: interfaces.map((sig, idx) => ({
        id: `TDD_${idx + 1}`,
        interface: sig,
        phases: ['RED', 'GREEN', 'REFACTOR']
      })),
      generatedAt: new Date().toISOString()
    };

    const md = this.renderPlanMarkdown(plan);
    await fs.writeFile(planPath, md, 'utf8');
    return { success: true, statusCode: '→PC', planPath };
  }

  extractInterfaceSignatures(text) {
    const result = [];
    const codeBlocks = text.match(/```(js|ts)[\s\S]*?```/g) || [];
    codeBlocks.forEach(block => {
      const lines = block.split('\n').slice(1, -1);
      lines.forEach(line => {
        const m = line.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
        if (m) {
          result.push(line.trim());
        }
      });
    });
    if (result.length === 0) {
      result.push('function placeholder() {}');
    }
    return result;
  }

  renderPlanMarkdown(plan) {
    const json = JSON.stringify(plan, null, 2);
    const lines = [
      `# TDD Plan for ${plan.module}`,
      '',
      `Generated: ${plan.generatedAt}`,
      '',
      '## Cycles',
      '',
      `Cycles: ${plan.cycles.length}`,
      '',
      '```json',
      json,
      '```',
      ''
    ];
    return lines.join('\n');
  }
}

module.exports = SigmaPlanLoop;
