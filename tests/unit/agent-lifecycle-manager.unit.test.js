const AgentLifecycleManager = require("../../lib/AgentLifecycleManager");

// Minimal mocks for spawner/registry
const makeRegistry = () => {
  const handlers = {};
  return {
    on: (evt, fn) => {
      handlers[evt] = fn;
    },
    emit: (evt, payload) => handlers[evt] && handlers[evt](payload),
    query: jest
      .fn()
      .mockReturnValue([
        {
          id: "a1",
          name: "n1",
          status: "active",
          activity: {
            lastSeen: new Date(Date.now() - 2 * 3600_000).toISOString(),
            invocations: 20,
          },
          performance: { successRate: 0.5, avgResponseTime: 100 },
          resources: {
            memoryUsage: 999999999,
            cpuUsage: 90,
            diskUsage: 9999999,
          },
          metadata: {
            registeredAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
          },
        },
      ]),
    unregister: jest.fn().mockResolvedValue(undefined),
    checkHealth: jest
      .fn()
      .mockResolvedValue({
        agentId: "a1",
        status: "healthy",
        timestamp: new Date().toISOString(),
        issues: [],
      }),
    saveRegistry: jest.fn().mockResolvedValue(undefined),
  };
};

const makeSpawner = () => ({
  spawn: jest
    .fn()
    .mockResolvedValue({ agent: { id: "auto", name: "auto-scaled-agent" } }),
});

describe("AgentLifecycleManager - unit", () => {
  test("initialize, run cleanup paths, and shutdown", async () => {
    const registry = makeRegistry();
    const spawner = makeSpawner();
    const mgr = new AgentLifecycleManager(spawner, registry, {
      idleTimeout: 1000,
      maxAge: 1000,
      minPerformanceThreshold: 0.9,
      maxMemoryUsage: 1000,
      maxCpuUsage: 10,
      maxDiskUsage: 1000,
      healthCheckInterval: 0, // disable timers in tests
      cleanupInterval: 0,
      deepCleanupInterval: 0,
    });

    const init = await mgr.initialize();
    expect(init.success).toBe(true);

    const results = await mgr.runCleanup();
    expect(Array.isArray(results)).toBe(true);

    // evaluatePolicies should detect multiple violations → action cleanup/warn
    const violations = await mgr.evaluatePolicies(registry.query()[0]);
    expect(violations.length).toBeGreaterThan(0);
    const action = mgr.determineAction(violations);
    expect(["cleanup", "warn", "monitor"]).toContain(action);

    await mgr.runDeepCleanup();
    await mgr.runHealthMonitoring();

    const stats = mgr.getStatistics();
    expect(stats.policies).toBeGreaterThan(0);

    const down = await mgr.shutdown();
    expect(down.success).toBe(true);
  });
});
