const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const CommandHistoryManager = require('../../lib/command-history');

describe('CommandHistoryManager - unit', () => {
  let tempDir;
  let historyFile;
  let history;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'history-unit-'));
    historyFile = path.join(tempDir, 'history.json');
    history = new CommandHistoryManager(historyFile);
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  test('addCommand and getHistory should work with filters', async () => {
    await history.addCommand('/collective status', { success: true, namespace: 'collective', command: 'status' }, 100);
    await history.addCommand('/agent list', { success: false, namespace: 'agent', command: 'list', error: 'x' }, 50);

    const all = history.getHistory(10);
    expect(all.length).toBe(2);

    const filteredNs = history.getHistory(10, { namespace: 'collective' });
    expect(filteredNs.length).toBe(1);
  });

  test('exportHistory should support json/csv/markdown', async () => {
    await history.addCommand('/collective status', { success: true, namespace: 'collective', command: 'status' }, 100);

    const json = history.exportHistory('json');
    expect(() => JSON.parse(json)).not.toThrow();

    const csv = history.exportHistory('csv');
    expect(csv).toContain('Timestamp,Command');

    const md = history.exportHistory('markdown');
    expect(md).toContain('# Command History Export');
  });
});


