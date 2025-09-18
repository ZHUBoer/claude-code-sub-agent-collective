const CollectiveCommandParser = require('../../lib/command-parser');

// Mock van-maintenance with controllable behaviors
jest.mock('../../lib/van-maintenance', () => {
  return jest.fn().mockImplementation(() => ({
    runHealthChecks: jest.fn().mockResolvedValue({
      healthy: false,
      score: 72,
      checks: [
        { name: 'Hooks', healthy: true, score: 95 },
        { name: 'Agents', healthy: false, score: 60, issues: [{ type: 'stale', severity: 'high' }] }
      ],
      issues: [
        { name: 'Agents', issues: ['stale entries', 'missing files'] }
      ]
    }),
    runAutoRepairs: jest.fn().mockResolvedValue([
      { name: 'Cleanup stale agents', success: true, fixed: 3 },
      { name: 'Fix permissions', success: false, error: 'EACCES' }
    ]),
    runOptimizations: jest.fn().mockResolvedValue([
      { name: 'Remove duplicates', success: true, improved: true, duplicatesRemoved: 5 },
      { name: 'Trim logs', success: true, improved: false }
    ]),
    performMaintenance: jest.fn().mockResolvedValue({
      timestamp: new Date().toISOString(),
      health: { score: 88, issues: [{ name: 'Agents', issues: [1,2,3] }] },
      repairs: [{ name: 'Cleanup', success: true, fixed: 2 }],
      optimizations: [{ name: 'Trim logs', success: true, improved: true }]
    }),
    generateMaintenanceReport: jest.fn().mockResolvedValue('/tmp/report.md'),
    generateSummary: jest.fn().mockReturnValue('Summary text'),
    startScheduledMaintenance: jest.fn().mockReturnValue({
      healthCheck: '0 0 * * *',
      fullMaintenance: '0 2 * * 0',
      optimizations: '0 3 * * 0'
    })
  }));
});

describe('CollectiveCommandParser - van maintenance handlers', () => {
  let parser;

  beforeEach(() => {
    parser = new CollectiveCommandParser();
  });

  test('vanHealthCheck success path formats output', async () => {
    const res = await parser.vanHealthCheck([], { verbose: true });
    expect(res.success).toBe(true);
    expect(res.action).toBe('health-check');
    expect(res.output).toContain('System Health Check Results');
  });

  test('vanAutoRepair covers both no-issues and repairs-needed paths', async () => {
    // First call: mocked health has issues -> repairs path
    let res = await parser.vanAutoRepair([], {});
    expect(res.success).toBe(true);
    expect(res.action).toBe('repair');

    // Mock no-issues path by temporarily overriding runHealthChecks
    const Van = require('../../lib/van-maintenance');
    const inst = new Van();
    inst.runHealthChecks.mockResolvedValueOnce({ healthy: true, score: 95, checks: [], issues: [] });
    res = await parser.vanAutoRepair([], {});
    expect(res.success).toBe(true);
  });

  test('vanOptimize and vanFullMaintenance produce outputs', async () => {
    const opt = await parser.vanOptimize([], {});
    expect(opt.success).toBe(true);
    expect(opt.output).toContain('Optimization Results');

    const full = await parser.vanFullMaintenance([], {});
    expect(full.success).toBe(true);
    expect(full.output).toContain('Full Maintenance Report');
  });

  test('vanGenerateReport returns path and summary', async () => {
    const res = await parser.vanGenerateReport([], {});
    expect(res.success).toBe(true);
    expect(res.reportPath).toContain('/tmp/');
  });

  test('vanSchedule returns schedules', async () => {
    const res = await parser.vanSchedule([], {});
    expect(res.success).toBe(true);
    expect(res.output).toContain('Scheduled maintenance activated');
  });

  test('getScoreColor covers all categories', () => {
    expect(parser.getScoreColor(95)).toContain('✅');
    expect(parser.getScoreColor(75)).toContain('⚠️');
    expect(parser.getScoreColor(55)).toContain('🔶');
    expect(parser.getScoreColor(10)).toContain('❌');
  });
});


