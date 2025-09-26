const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const AgentTemplateSystem = require("../../lib/AgentTemplateSystem");

describe("AgentTemplateSystem - unit", () => {
  let tempDir;
  let sys;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ats-unit-"));
    sys = new AgentTemplateSystem({ templatesDir: tempDir });
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  test("initializeDefaultTemplates provides base and specialized templates", () => {
    expect(sys.getTemplate("base")).toBeDefined();
    expect(sys.getTemplate("research-agent")).toBeDefined();
    expect(sys.getTemplate("testing-agent")).toBeDefined();
  });

  test("getResolvedTemplate merges inheritance", () => {
    const t = sys.getResolvedTemplate("research-agent");
    expect(t.tools.length).toBeGreaterThan(0);
    expect(t.capabilities.length).toBeGreaterThan(0);
    expect(t.requiredParameters).toContain("researchDomain");
  });

  test("validateParameters enforces requireds and types", () => {
    const t = sys.getResolvedTemplate("base");
    expect(() => sys.validateParameters(t, {})).toThrow(/Required parameter/);
    expect(() =>
      sys.validateParameters(t, {
        agentName: "a",
        purpose: "p",
        responsibilities: "x",
      })
    ).toThrow(/array/);
    // Valid
    expect(() =>
      sys.validateParameters(t, {
        agentName: "a",
        purpose: "p",
        responsibilities: [],
      })
    ).not.toThrow();
  });

  test("createAgent compiles template content", async () => {
    const res = await sys.createAgent("base", {
      agentName: "alpha",
      purpose: "demo",
    });
    expect(res.id).toContain("alpha-base-");
    expect(res.content).toContain("# alpha Agent");
    expect(res.metadata.templateId).toBe("base");
  });

  test("registerTemplate persists custom template and can delete", async () => {
    const custom = { name: "Custom", description: "desc", template: "X" };
    const reg = await sys.registerTemplate("custom-1", custom);
    expect(reg.success).toBe(true);
    const file = path.join(tempDir, "custom", "custom-1.json");
    expect(await fs.pathExists(file)).toBe(true);

    // delete
    const del = await sys.deleteTemplate("custom-1");
    expect(del.success).toBe(true);
  });
});
