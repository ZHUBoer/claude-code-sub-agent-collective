#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const SigmaOrchestrator = require('../lib/sigma/Orchestrator');

const program = new Command();
program
  .name('sigma')
  .description('SIGMA workflow CLI (DPTR × Collective)')
  .version('0.1.0');

program
  .command('plan')
  .description('Run Ω₂ plan loop for a module')
  .argument('<module>', 'module name under memory-bank/modules')
  .option('--memory-bank <path>', 'memory bank root')
  .option('--overwrite', 'overwrite existing tdd_plan.md', false)
  .action(async (moduleName, options) => {
    try {
      const orchestrator = new SigmaOrchestrator({ memoryBankRoot: options.memoryBank });
      const res = await orchestrator.runPlan(moduleName, options);
      console.log(chalk.green(`✅ ${res.status} for ${moduleName}`));
      console.log(chalk.cyan(`Plan: ${res.planPath}`));
    } catch (e) {
      console.error(chalk.red('❌ plan failed:'), e.message);
      process.exit(1);
    }
  });

program
  .command('tdd')
  .description('Run Ω₃ TDD loop for a module')
  .argument('<module>', 'module name under memory-bank/modules')
  .option('--memory-bank <path>', 'memory bank root')
  .option('--parallel <n>', 'parallel cycles', (v) => parseInt(v, 10))
  .option('--cov-lines <n>', 'coverage threshold lines %', (v) => parseInt(v, 10), 0)
  .option('--cov-funcs <n>', 'coverage threshold functions %', (v) => parseInt(v, 10), 0)
  .option('--cov-branches <n>', 'coverage threshold branches %', (v) => parseInt(v, 10), 0)
  .option('--cov-statements <n>', 'coverage threshold statements %', (v) => parseInt(v, 10), 0)
  .option('--out <dir>', 'custom work directory for cycles')
  .action(async (moduleName, options) => {
    try {
      const coverageThreshold = {
        lines: options.covLines,
        functions: options.covFuncs,
        branches: options.covBranches,
        statements: options.covStatements
      };
      const orchestrator = new SigmaOrchestrator({ memoryBankRoot: options.memoryBank, parallel: options.parallel, coverageThreshold, outDir: options.out });
      const res = await orchestrator.runTDD(moduleName, options);
      console.log(chalk.green(`✅ ${res.status} for ${moduleName}`));
      const batches = res.details?.batches || [];
      const total = res.details?.totalCycles || 0;
      console.log(chalk.cyan(`Batches: ${batches.length}, Total cycles: ${total}`));
      const failed = res.failedCycles || [];
      if (failed.length > 0) {
        console.log(chalk.yellow(`⚠️ Coverage/Test not met in cycles: ${failed.join(', ')}`));
        process.exit(2);
      }
    } catch (e) {
      console.error(chalk.red('❌ tdd failed:'), e.message);
      process.exit(1);
    }
  });

program
  .command('review')
  .description('Run Ω₄ review for a module')
  .argument('<module>', 'module name under memory-bank/modules')
  .option('--memory-bank <path>', 'memory bank root')
  .option('--json', 'output JSON summary')
  .action(async (moduleName, options) => {
    try {
      const orchestrator = new SigmaOrchestrator({ memoryBankRoot: options.memoryBank });
      const res = await orchestrator.runReview(moduleName, options);
      if (options.json) {
        console.log(JSON.stringify(res.summary, null, 2));
        return;
      }
      console.log(chalk.green(`✅ ${res.status} for ${moduleName}`));
      console.log(chalk.cyan(`Review JSON: ${res.reviewJson}`));
      console.log(chalk.cyan(`Review MD:   ${res.reviewMd}`));
      console.log(chalk.gray(`Total=${res.summary.totalCycles}, Passed=${res.summary.passedCycles}, Failed=${res.summary.failedCycles.length}`));
      console.log(chalk.gray(`Coverage(lines): min=${res.summary.coverage.lines.min} avg=${res.summary.coverage.lines.avg}`));
    } catch (e) {
      console.error(chalk.red('❌ review failed:'), e.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show SIGMA status for a module')
  .argument('<module>', 'module name under memory-bank/modules')
  .option('--memory-bank <path>', 'memory bank root')
  .option('--json', 'output JSON summary')
  .action(async (moduleName, options) => {
    try {
      const orchestrator = new SigmaOrchestrator({ memoryBankRoot: options.memoryBank });
      const s = await orchestrator.getStatus(moduleName);
      if (!s.installed) {
        if (options.json) {
          console.log(JSON.stringify(s, null, 2));
        } else {
          console.log(chalk.yellow(`No metrics found for module: ${moduleName}`));
        }
        process.exit(0);
      }
      if (options.json) {
        console.log(JSON.stringify(s, null, 2));
        return;
      }
      console.log(chalk.cyan(`Module: ${s.module}`));
      console.log(`Plan: ${s.planStatus}`);
      console.log(`TDD: ${s.tddStatus}`);
      console.log(`Failed cycles: ${s.failedCycles.length ? s.failedCycles.join(', ') : 'None'}`);
      console.log(`Coverage threshold: lines=${s.coverageThreshold.lines}% functions=${s.coverageThreshold.functions}% branches=${s.coverageThreshold.branches}% statements=${s.coverageThreshold.statements}%`);
      if (s.reviewSummary) {
        console.log(chalk.gray(`Review: total=${s.reviewSummary.totalCycles}, passed=${s.reviewSummary.passedCycles}, failed=${s.reviewSummary.failedCycles.length}`));
      }
    } catch (e) {
      console.error(chalk.red('❌ status failed:'), e.message);
      process.exit(1);
    }
  });

program.parse();
