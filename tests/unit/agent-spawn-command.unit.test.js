const AgentSpawnCommand = require('../../lib/AgentSpawnCommand');

// Mock dependencies to avoid real filesystem/registry operations
jest.mock('../../lib/AgentSpawner', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    getStatistics: jest.fn().mockReturnValue({ spawned: 0 }),
    templateSystem: { listTemplates: jest.fn().mockReturnValue([]) },
    spawn: jest.fn().mockResolvedValue({
      agent: { id: 'a1', name: 'n1', template: 'base', path: '/tmp/a1', testPath: '/tmp/a1.test', metadata: {} }
    })
  }));
});

jest.mock('../../lib/AgentRegistry', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(undefined),
    getStatistics: jest.fn().mockReturnValue({ registered: 1 }),
    getAgent: jest.fn().mockReturnValue({ id: 'a-src', name: 'src', template: 'base', path: '/tmp/src', testPath: '/tmp/src.test', metadata: { tools: [], capabilities: [] }, health: { status: 'healthy', issues: [] } }),
    query: jest.fn().mockReturnValue([{ id: 'a1', status: 'active', health: { status: 'healthy' } }]),
    unregister: jest.fn().mockResolvedValue(undefined)
  }));
});

jest.mock('../../lib/AgentLifecycleManager', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    getStatistics: jest.fn().mockReturnValue({ cleaned: 0 }),
    runCleanup: jest.fn().mockResolvedValue([{ id: 'a1', success: true }])
  }));
});

describe('AgentSpawnCommand - unit', () => {
  let cmd;

  beforeEach(() => {
    cmd = new AgentSpawnCommand({});
  });

  test('quick spawn returns success', async () => {
    const res = await cmd.execute('quick base "do work"');
    expect(res.success).toBe(true);
    expect(res.type).toBe('quick-spawn');
  });

  test('template spawn requires template id', async () => {
    await expect(cmd.execute('template')).resolves.toMatchObject({ success: false });
  });

  test('clone agent requires sourceId', async () => {
    await expect(cmd.execute('clone')).resolves.toMatchObject({ success: false });
  });

  test('template spawn success', async () => {
    const res = await cmd.execute('template base --name=myagent --purpose=work');
    expect(res.success).toBe(true);
    expect(res.type).toBe('template-spawn');
  });

  test('list-templates and list-agents', async () => {
    const lt = await cmd.execute('list-templates');
    expect(lt.success).toBe(true);
    const la = await cmd.execute('list-agents --status=active');
    expect(la.success).toBe(true);
    expect(Array.isArray(la.agents)).toBe(true);
  });

  test('getAgentInfo success', async () => {
    const res = await cmd.execute('info a-src');
    expect(res.success).toBe(true);
    expect(res.type).toBe('agent-info');
  });

  test('cleanup specific and automatic', async () => {
    const specific = await cmd.execute('cleanup a1 a2');
    expect(specific.success).toBe(true);
    const auto = await cmd.execute('cleanup');
    expect(auto.success).toBe(true);
    expect(auto.type).toBe('cleanup-automatic');
  });

  test('status and help', async () => {
    const status = await cmd.execute('status');
    expect(status.success).toBe(true);
    const help = await cmd.execute('help');
    expect(help.success).toBe(true);
  });
});


