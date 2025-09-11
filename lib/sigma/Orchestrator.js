const path = require('path');
const fs = require('fs-extra');
const SigmaPlanLoop = require('./PlanLoop');
const SigmaTDDLoop = require('./TDDLoop');
const AgentSpawner = require('../AgentSpawner');
const AgentRegistry = require('../AgentRegistry');

class SigmaOrchestrator {
  constructor(options = {}) {
    this.options = {
      memoryBankRoot: options.memoryBankRoot || path.join(process.cwd(), 'memory-bank', 'modules'),
      parallel: options.parallel || 2,
      coverageThreshold: options.coverageThreshold || { lines: 0, functions: 0, branches: 0, statements: 0 },
      outDir: options.outDir || null
    };
    this.planLoop = new SigmaPlanLoop({});
  }

  resolveModulePaths(moduleName) {
    const moduleRoot = path.join(this.options.memoryBankRoot, moduleName);
    return {
      moduleRoot,
      designPath: path.join(moduleRoot, 'design.md'),
      planPath: path.join(moduleRoot, 'tdd_plan.md')
    };
  }

  async runPlan(moduleName, opts = {}) {
    const { designPath, planPath } = this.resolveModulePaths(moduleName);
    if (!await fs.pathExists(designPath)) {
      throw new Error(`design.md not found: ${designPath}`);
    }
    const res = await this.planLoop.execute({ module: moduleName, designPath, planPath, rounds: opts.rounds || 1, overwrite: !!opts.overwrite });

    await this.writeMetrics('plan', moduleName, {
      module: moduleName,
      status: res.statusCode || '→PC',
      planPath,
      timestamp: new Date().toISOString()
    });

    return { success: res.success, status: 'plan_completed', statusCode: res.statusCode || '→PC', module: moduleName, planPath };
  }

  async runTDD(moduleName, opts = {}) {
    const { planPath } = this.resolveModulePaths(moduleName);
    if (!await fs.pathExists(planPath)) {
      throw new Error(`tdd_plan.md not found: ${planPath}`);
    }

    const spawner = new AgentSpawner({ config: { createTestContracts: false } });
    const registry = new AgentRegistry({});
    await Promise.all([spawner.initialize(), registry.initialize()]);

    const tddLoop = new SigmaTDDLoop({ spawner, registry, options: { parallel: opts.parallel || this.options.parallel, coverageThreshold: this.options.coverageThreshold, outDir: this.options.outDir } });
    const res = await tddLoop.execute({ module: moduleName, planPath });

    const failedCycles = [];
    for (const b of res.details?.batches || []) {
      for (const it of b.spawned || []) {
        const ok = it.rgr && it.rgr.green && it.rgr.green.exitCode === 0 && it.rgr.refactor && it.rgr.refactor.exitCode === 0 && it.rgr.green.coverageGate && it.rgr.refactor.coverageGate;
        if (!ok) failedCycles.push(it.id);
      }
    }
    const success = failedCycles.length === 0;

    await this.writeMetrics('tdd', moduleName, {
      module: moduleName,
      status: success ? 'completed' : 'failed',
      failedCycles,
      coverageThreshold: this.options.coverageThreshold,
      details: res.details || {},
      timestamp: new Date().toISOString()
    });

    return { success, status: success ? 'tdd_completed' : 'tdd_failed', details: res.details || {}, failedCycles, module: moduleName };
  }

  async runReview(moduleName, opts = {}) {
    const baseDir = path.join(process.cwd(), '.claude-collective', 'metrics', 'sigma', moduleName);
    if (!await fs.pathExists(baseDir)) {
      throw new Error(`metrics not found for module: ${moduleName}`);
    }

    const latestTddPath = path.join(baseDir, 'latest-tdd.json');
    let tdd;
    if (await fs.pathExists(latestTddPath)) {
      tdd = await fs.readJson(latestTddPath);
    } else {
      const files = (await fs.readdir(baseDir)).filter(f => f.endsWith('-tdd.json')).sort().reverse();
      if (files.length === 0) throw new Error('no tdd metrics found');
      tdd = await fs.readJson(path.join(baseDir, files[0]));
    }

    const eventsLog = path.join(baseDir, 'events.log');
    const events = await this.readEvents(eventsLog);

    const summary = this.buildReviewSummary(moduleName, tdd, events);
    const reviewJson = path.join(baseDir, 'review.json');
    const reviewMd = path.join(baseDir, 'review.md');

    await fs.writeJson(reviewJson, summary, { spaces: 2 });
    await fs.writeFile(reviewMd, this.renderReviewMarkdown(summary), 'utf8');

    return { success: true, status: 'review_completed', module: moduleName, reviewJson, reviewMd, summary };
  }

  async getStatus(moduleName) {
    const baseDir = path.join(process.cwd(), '.claude-collective', 'metrics', 'sigma', moduleName);
    const exists = await fs.pathExists(baseDir);
    if (!exists) {
      return { module: moduleName, installed: false };
    }
    const plan = await this.safeRead(path.join(baseDir, 'latest-plan.json'));
    const tdd = await this.safeRead(path.join(baseDir, 'latest-tdd.json'));
    const review = await this.safeRead(path.join(baseDir, 'review.json'));

    return {
      module: moduleName,
      installed: true,
      planStatus: plan?.status || 'unknown',
      tddStatus: tdd?.status || 'unknown',
      failedCycles: tdd?.failedCycles || [],
      coverageThreshold: tdd?.coverageThreshold || { lines: 0, functions: 0, branches: 0, statements: 0 },
      reviewSummary: review || null
    };
  }

  buildReviewSummary(moduleName, tdd, events) {
    const batches = tdd.details?.batches || [];
    const total = tdd.details?.totalCycles || 0;
    const failed = tdd.failedCycles || [];
    const threshold = tdd.coverageThreshold || { lines: 0, functions: 0, branches: 0, statements: 0 };

    const covValues = [];
    for (const b of batches) {
      for (const it of b.spawned || []) {
        const g = it.rgr?.green?.coverage?.lines;
        const r = it.rgr?.refactor?.coverage?.lines;
        if (typeof g === 'number') covValues.push(g);
        if (typeof r === 'number') covValues.push(r);
      }
    }
    const covMin = covValues.length ? Math.min(...covValues) : 0;
    const covAvg = covValues.length ? Math.round(covValues.reduce((a, b) => a + b, 0) / covValues.length) : 0;

    const phase = { RED: 0, GREEN: 0, REFACTOR: 0 };
    events.forEach(e => {
      if (e.phase && phase[e.phase] !== undefined) phase[e.phase] += 1;
    });

    return {
      module: moduleName,
      totalCycles: total,
      passedCycles: total - failed.length,
      failedCycles: failed,
      coverageThreshold: threshold,
      coverage: { lines: { min: covMin, avg: covAvg } },
      phases: phase,
      timestamp: new Date().toISOString()
    };
  }

  renderReviewMarkdown(s) {
    return `# Review Report for ${s.module}\n\nGenerated: ${s.timestamp}\n\n- Total cycles: ${s.totalCycles}\n- Passed cycles: ${s.passedCycles}\n- Failed cycles: ${s.failedCycles.length ? s.failedCycles.join(', ') : 'None'}\n- Coverage threshold: lines=${s.coverageThreshold.lines}% functions=${s.coverageThreshold.functions}% branches=${s.coverageThreshold.branches}% statements=${s.coverageThreshold.statements}%\n- Coverage (lines): min=${s.coverage.lines.min}% avg=${s.coverage.lines.avg}%\n\n## Phase Events\n- RED: ${s.phases.RED}\n- GREEN: ${s.phases.GREEN}\n- REFACTOR: ${s.phases.REFACTOR}\n`;
  }

  async writeMetrics(kind, moduleName, payload) {
    const baseDir = path.join(process.cwd(), '.claude-collective', 'metrics', 'sigma', moduleName);
    await fs.ensureDir(baseDir);
    const file = path.join(baseDir, `${Date.now()}-${kind}.json`);
    await fs.writeJson(file, payload, { spaces: 2 });
    const latest = path.join(baseDir, `latest-${kind}.json`);
    await fs.writeJson(latest, payload, { spaces: 2 });
    return file;
  }

  async readEvents(eventsPath) {
    if (!await fs.pathExists(eventsPath)) return [];
    const lines = (await fs.readFile(eventsPath, 'utf8')).split('\n').filter(Boolean);
    const out = [];
    for (const line of lines) {
      try { out.push(JSON.parse(line)); } catch { /* ignore */ }
    }
    return out;
  }

  async safeRead(p) {
    try {
      if (!await fs.pathExists(p)) return null;
      return await fs.readJson(p);
    } catch {
      return null;
    }
  }
}

module.exports = SigmaOrchestrator;
