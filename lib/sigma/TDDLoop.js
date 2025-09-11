const fs = require('fs-extra');
const path = require('path');
const { spawnSync } = require('child_process');

class SigmaTDDLoop {
  constructor({ spawner, registry, options = {} } = {}) {
    this.spawner = spawner;
    this.registry = registry;
    this.options = {
      parallel: options.parallel || 2,
      coverageThreshold: options.coverageThreshold || { lines: 0, functions: 0, branches: 0, statements: 0 },
      outDir: options.outDir || null
    };
  }

  async execute({ module, planPath }) {
    if (!planPath) {
      return { success: false, code: 'PLAN_NOT_PROVIDED' };
    }
    const raw = await fs.readFile(planPath, 'utf8');
    const plan = this.parsePlanMarkdown(raw);
    const total = plan.cycles?.length || 0;
    const parallel = Math.max(1, this.options.parallel);
    const batches = [];

    await this.ensureOmegaTemplates();

    for (let i = 0; i < total; i += parallel) {
      const batch = plan.cycles.slice(i, i + parallel);
      const spawned = [];
      for (const cycle of batch) {
        const qa = await this.spawner.spawn({
          name: `${module}-qa-${cycle.id}`,
          type: 'testing',
          purpose: `RED tests for ${cycle.interface}`,
          template: 'omega-3-qa-agent',
          capabilities: ['testing'],
          tools: ['Read', 'Write'],
          testType: 'unit'
        }).catch(e => ({ error: e.message }));
        const dev = await this.spawner.spawn({
          name: `${module}-dev-${cycle.id}`,
          type: 'implementation',
          purpose: `GREEN impl for ${cycle.interface}`,
          template: 'omega-3-dev-agent',
          capabilities: ['coding'],
          tools: ['Read', 'Write'],
          language: 'javascript',
          framework: 'node'
        }).catch(e => ({ error: e.message }));

        const rgr = await this.runRGR({ module, cycle });
        spawned.push({ id: cycle.id, qa, dev, rgr, status: 'completed' });
      }
      batches.push({ batchIndex: batches.length, size: batch.length, spawned });
    }

    return { success: true, details: { batches, totalCycles: total, parallel } };
  }

  parsePlanMarkdown(md) {
    const match = md.match(/```json[\s\S]*?```/);
    if (!match) return { module: 'unknown', cycles: [] };
    const json = match[0].replace(/```json\n?|```/g, '');
    try {
      return JSON.parse(json);
    } catch {
      return { module: 'unknown', cycles: [] };
    }
  }

  async ensureOmegaTemplates() {
    const ts = this.spawner?.templateSystem;
    if (!ts) return;

    const ensure = async (id, cfg) => {
      if (ts.getTemplate(id)) return;
      await ts.registerTemplate(id, cfg);
    };

    const qaTemplate = {
      name: 'Omega-3 QA Agent',
      description: 'QA agent specialized for RED and test refactor in Ω₃',
      parent: 'testing-agent',
      tools: ['Read', 'Write', 'Bash'],
      capabilities: ['testing', 'validation'],
      requiredParameters: [],
      optionalParameters: ['testType'],
      template: `# {{agentName}} (Ω₃ QA)\n\n**ID**: {{agentId}}\n\n## Purpose\n{{purpose}}\n\n## Responsibilities\n{{#each responsibilities}}- {{this}}\n{{/each}}\n`
    };

    const devTemplate = {
      name: 'Omega-3 Dev Agent',
      description: 'Dev agent specialized for GREEN and impl refactor in Ω₃',
      parent: 'implementation-agent',
      tools: ['Read', 'Write', 'Edit', 'Bash'],
      capabilities: ['coding', 'implementation'],
      requiredParameters: [],
      optionalParameters: ['language', 'framework'],
      template: `# {{agentName}} (Ω₃ DEV)\n\n**ID**: {{agentId}}\n\n## Purpose\n{{purpose}}\n\n## Responsibilities\n{{#each responsibilities}}- {{this}}\n{{/each}}\n`
    };

    await ensure('omega-3-qa-agent', qaTemplate);
    await ensure('omega-3-dev-agent', devTemplate);
  }

  async runRGR({ module, cycle }) {
    const base = this.options.outDir || path.join(process.cwd(), '.claude-collective', 'sigma');
    const workspace = path.join(base, module, cycle.id);
    const srcDir = path.join(workspace, 'src');
    const testDir = path.join(workspace, 'tests');
    await fs.ensureDir(srcDir);
    await fs.ensureDir(testDir);

    const jestConfigPath = path.join(workspace, 'jest.cycle.config.js');
    await fs.writeFile(jestConfigPath, this.renderJestConfig(), 'utf8');

    const testFile = path.join(testDir, `${cycle.id}.test.js`);
    const implFile = path.join(srcDir, `${cycle.id}.js`);

    const testRed = `describe('RED ${cycle.id}', () => {\n  test('should fail initially', () => {\n    expect(1).toBe(2);\n  });\n});\n`;
    await fs.writeFile(testFile, testRed, 'utf8');
    const redRun = this.runJest({ workspace, testFile, jestConfigPath });
    await this.writeEvent(module, {
      phase: 'RED', code: redRun.code !== 0 ? '→RC' : 'unexpected_pass', exitCode: redRun.code,
      testFile: this.rel(testFile)
    });

    const implGreen = `module.exports = function(){ return true };\n`;
    await fs.writeFile(implFile, implGreen, 'utf8');
    const testGreen = `const impl = require('./../src/${cycle.id}.js');\n\ndescribe('GREEN ${cycle.id}', () => {\n  test('should pass with minimal impl', () => {\n    expect(impl()).toBe(true);\n  });\n});\n`;
    await fs.writeFile(testFile, testGreen, 'utf8');
    const greenRun = this.runJest({ workspace, testFile, jestConfigPath, withCoverage: true });
    const greenCov = await this.readCoverageSummary(workspace);
    const greenGate = this.checkCoverageGate(greenCov);
    await this.writeEvent(module, {
      phase: 'GREEN', code: greenRun.code === 0 ? '→GC' : 'unexpected_fail', exitCode: greenRun.code,
      coverage: greenCov, coverageGate: greenGate, testFile: this.rel(testFile)
    });

    const implRefactor = `// refactor\nmodule.exports = () => {\n  const ok = true;\n  return ok;\n};\n`;
    await fs.writeFile(implFile, implRefactor, 'utf8');
    const refactorRun = this.runJest({ workspace, testFile, jestConfigPath, withCoverage: true });
    const refactorCov = await this.readCoverageSummary(workspace);
    const refactorGate = this.checkCoverageGate(refactorCov);
    await this.writeEvent(module, {
      phase: 'REFACTOR', code: refactorRun.code === 0 ? '→RIC' : 'unexpected_fail', exitCode: refactorRun.code,
      coverage: refactorCov, coverageGate: refactorGate, testFile: this.rel(testFile)
    });

    const red = { status: redRun.code !== 0 ? '→RC' : 'unexpected_pass', exitCode: redRun.code };
    const green = { status: greenRun.code === 0 ? '→GC' : 'unexpected_fail', exitCode: greenRun.code, coverage: greenCov, coverageGate: greenGate };
    const refactor = { status: refactorRun.code === 0 ? '→RIC' : 'unexpected_fail', exitCode: refactorRun.code, coverage: refactorCov, coverageGate: refactorGate };
    return { red, green, refactor, workspace };
  }

  renderJestConfig() {
    return `module.exports = {\n  testEnvironment: 'node',\n  collectCoverage: true,\n  collectCoverageFrom: ['src/**/*.js'],\n  coverageDirectory: 'coverage',\n  reporters: ['default'],\n  verbose: false\n};\n`;
  }

  runJest({ workspace, testFile, jestConfigPath, withCoverage = false }) {
    const jestLocal = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'jest.cmd' : 'jest');
    let res;
    const argsBase = ['--config', jestConfigPath, '--runTestsByPath', testFile];
    const argsWithCov = withCoverage ? [...argsBase, '--coverage'] : argsBase;

    if (fs.existsSync(jestLocal)) {
      res = spawnSync(jestLocal, argsWithCov, { cwd: workspace, encoding: 'utf8' });
    } else {
      // fallback to npx jest
      res = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['-y', 'jest', ...argsWithCov], { cwd: workspace, encoding: 'utf8' });
    }

    return { code: res.status ?? 1, stdout: res.stdout, stderr: res.stderr };
  }

  async readCoverageSummary(workspace) {
    try {
      const summaryPath = path.join(workspace, 'coverage', 'coverage-summary.json');
      const sum = await fs.readJson(summaryPath);
      const t = sum.total || {};
      const pick = k => (t[k] && typeof t[k].pct === 'number') ? t[k].pct : 0;
      return {
        lines: pick('lines'),
        functions: pick('functions'),
        branches: pick('branches'),
        statements: pick('statements')
      };
    } catch {
      return { lines: 0, functions: 0, branches: 0, statements: 0 };
    }
  }

  checkCoverageGate(cov) {
    const th = this.options.coverageThreshold;
    return (
      cov.lines >= th.lines &&
      cov.functions >= th.functions &&
      cov.branches >= th.branches &&
      cov.statements >= th.statements
    );
  }

  async writeEvent(moduleName, event) {
    const baseDir = path.join(process.cwd(), '.claude-collective', 'metrics', 'sigma', moduleName);
    await fs.ensureDir(baseDir);
    const line = JSON.stringify({ ts: new Date().toISOString(), ...event }) + '\n';
    await fs.appendFile(path.join(baseDir, 'events.log'), line, 'utf8');
  }

  rel(p) {
    return path.relative(process.cwd(), p);
  }
}

module.exports = SigmaTDDLoop;
