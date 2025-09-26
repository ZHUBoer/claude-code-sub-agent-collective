// Jest setup file for claude-collective tests
// Configures test environment and global utilities

const fs = require("fs-extra");
const path = require("path");
const os = require("os");

// Set up test environment
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// Global test utilities
global.testUtils = {
  createMockAgent: (name, capabilities = []) => ({
    name,
    capabilities,
    status: "active",
    lastUsed: new Date().toISOString(),
  }),

  createMockHandoff: (from, to, context = {}) => ({
    from,
    to,
    context,
    timestamp: new Date().toISOString(),
    handoffId: `test_${Date.now()}`,
  }),

  createMockContract: (preconditions = [], postconditions = []) => ({
    preconditions: preconditions.map((name) => ({
      name,
      test: () => true,
      critical: true,
      errorMessage: `${name} validation failed`,
    })),
    postconditions: postconditions.map((name) => ({
      name,
      test: () => true,
      critical: false,
      errorMessage: `${name} validation failed`,
    })),
    rollback: async () => ({ rolled_back: true }),
  }),

  mockFileExists: (filePath, exists = true) => {
    jest.spyOn(fs, "existsSync").mockImplementation((path) => {
      return path === filePath
        ? exists
        : jest.requireActual("fs-extra").existsSync(path);
    });
  },

  cleanup: () => {
    jest.restoreAllMocks();
  },
};

// Set up test directories (use OS tmpdir and worker-specific folder to avoid repo writes & races)
const workerId = process.env.JEST_WORKER_ID || "0";
const testTempDir = path.join(os.tmpdir(), "claude-tdd-agents-tests", workerId);

// Robust cleanup function for concurrent test safety
async function cleanupTempDir() {
  if (!fs.existsSync(testTempDir)) return;

  try {
    fs.removeSync(testTempDir);
  } catch (error) {
    if (error.code === "ENOTEMPTY" || error.code === "EBUSY") {
      // Directory in use, try force cleanup
      try {
        await new Promise((resolve) => setTimeout(resolve, 10));
        fs.removeSync(testTempDir);
      } catch (retryError) {
        // If still failing, just clear contents
        try {
          fs.emptyDirSync(testTempDir);
        } catch (emptyError) {
          // Silent fail for CI race conditions
        }
      }
    }
  }
}

beforeEach(async () => {
  await cleanupTempDir();
  fs.ensureDirSync(testTempDir);
});

afterEach(async () => {
  global.testUtils.cleanup();
  await cleanupTempDir();
});

// Configure test timeout
jest.setTimeout(10000);
