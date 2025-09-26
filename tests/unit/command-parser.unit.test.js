const CollectiveCommandParser = require("../../lib/command-parser");

describe("CollectiveCommandParser - unit", () => {
  let parser;

  beforeEach(() => {
    parser = new CollectiveCommandParser();
  });

  test("parseArgsAndFlags should split args and flags correctly", () => {
    const input = 'foo "bar baz" --alpha --beta=123 --gamma="hello world" 42';
    const { args, flags } = parser.parseArgsAndFlags(input);

    expect(args).toEqual(["foo", "bar baz", "42"]);
    expect(flags).toEqual({ alpha: true, beta: "123", gamma: "hello world" });
  });

  test("expandAliases should expand known aliases", () => {
    expect(parser.expandAliases("/c status")).toBe("/collective status");
    expect(parser.expandAliases("/status")).toBe("/collective status");
    expect(parser.expandAliases("/route create component")).toBe(
      "/collective route create component"
    );
    expect(parser.expandAliases("/unknown cmd")).toBe("/unknown cmd");
  });

  test("getSuggestion should suggest closest command for typo", () => {
    // Using a slight typo of an existing command
    const suggestion = parser.getSuggestion("/collective sttaus");
    expect(suggestion).toContain("Did you mean");
  });

  test("levenshteinDistance returns 0 for identical strings and >0 otherwise", () => {
    expect(parser.levenshteinDistance("abc", "abc")).toBe(0);
    expect(parser.levenshteinDistance("abc", "axc")).toBe(1);
    expect(parser.levenshteinDistance("kitten", "sitting")).toBeGreaterThan(0);
  });

  test("getAvailableCommands should list commands for namespace", () => {
    const cmds = parser.getAvailableCommands("collective");
    expect(Array.isArray(cmds)).toBe(true);
    expect(cmds.length).toBeGreaterThan(0);
    expect(cmds).toContain("status");
  });

  test("formatting helpers produce expected strings", async () => {
    const status = await parser.getCollectiveStatus();
    const formatted = parser.formatStatus(status, true);
    expect(formatted).toContain("Collective Status");
    expect(formatted).toContain("Agents:");

    const metrics = await parser.getCollectiveMetrics();
    const metricsOut = parser.formatMetrics(metrics, true);
    expect(metricsOut).toContain("Collective Metrics");
    expect(metricsOut).toContain("Handoff Success");

    const history = [{ command: "/c status", timestamp: Date.now() }];
    const histOut = parser.formatHistory(history);
    expect(histOut).toContain("Command History");
  });

  test("gate bypass should strip surrounding quotes in reason", async () => {
    const result = await parser.gateBypass(
      ["testing", '"Emergency deploy"'],
      {}
    );
    expect(result.success).toBe(true);
    expect(result.reason).toBe("Emergency deploy");
  });

  test("parseCommandStructure returns null for invalid input", () => {
    expect(parser.parseCommandStructure("invalid")).toBeNull();
  });

  test("collective handlers return structured outputs", async () => {
    const status = await parser.collectiveStatus([], { verbose: true });
    expect(status.action).toBe("status");

    const agents = await parser.collectiveAgents([], { detailed: true });
    expect(agents.action).toBe("agents");
    expect(Array.isArray(agents.agents)).toBe(true);

    const metrics = await parser.collectiveMetrics([], { detailed: true });
    expect(metrics.action).toBe("metrics");

    const validate = await parser.collectiveValidate(["current"], {
      strict: true,
    });
    expect(validate.action).toBe("validate");

    const help = await parser.collectiveHelp(["status"], {});
    expect(help.output).toContain("/collective status");

    const test = await parser.collectiveTest(["all"], { coverage: true });
    expect(test.type).toBe("all");

    const researchErr = await parser.collectiveResearch([], {});
    expect(researchErr.error).toBeTruthy();

    const coord = await parser.collectiveCoordinate(
      ["implement feature X"],
      {}
    );
    expect(coord.action).toBe("coordinate");

    const maintain = await parser.collectiveMaintain([], { repair: true });
    expect(maintain.action).toBe("maintain");

    const hist = await parser.collectiveHistory(["5"], {});
    expect(hist.action).toBe("history");
  });

  test("agent handlers cover error and normal paths", async () => {
    const list = await parser.agentList([], { detailed: true });
    expect(list.action).toBe("list");

    const status = await parser.agentStatus(["routing-agent"], {
      verbose: true,
    });
    expect(status.action).toBe("status");

    const route = await parser.agentRoute(["test request"], {});
    expect(route.action).toBe("route");

    const help = await parser.agentHelp(["spawn"], {});
    expect(help.output).toContain("/agent spawn");

    const health = await parser.agentHealth(["routing-agent"], {
      verbose: true,
    });
    expect(health.action).toBe("health");

    const handoffErr = await parser.agentHandoff([], {});
    expect(handoffErr.error).toBeTruthy();

    const metrics = await parser.agentMetrics(["routing-agent"], {
      detailed: true,
    });
    expect(metrics.action).toBe("metrics");

    const infoErr = await parser.agentInfo([], {});
    expect(infoErr.error).toBeTruthy();

    const testRes = await parser.agentTest(["routing-agent"], {});
    expect(testRes.action).toBe("test");

    const killErr = await parser.agentKill([], {});
    expect(killErr.error).toBeTruthy();
  });

  test("gate handlers cover success and error paths", async () => {
    const status = await parser.gateStatus([], { verbose: true });
    expect(status.action).toBe("status");

    const validate = await parser.gateValidate(["testing"], { strict: true });
    expect(validate.action).toBe("validate");

    const bypassErr = await parser.gateBypass([], {});
    expect(bypassErr.error).toBeTruthy();

    const hist = await parser.gateHistory(["5"], {});
    expect(hist.action).toBe("history");

    const help = await parser.gateHelp(["status"], {});
    expect(help.output).toContain("/gate status");

    const enforceErr = await parser.gateEnforce([], {});
    expect(enforceErr.error).toBeTruthy();

    const report = await parser.gateReport([], { format: "json" });
    expect(report.action).toBe("report");
  });

  test("help methods should return topic help when provided", () => {
    expect(parser.getCollectiveHelp("status")).toContain("/collective status");
    expect(parser.getAgentHelp("spawn")).toContain("/agent spawn");
    expect(parser.getGateHelp("status")).toContain("/gate status");
  });
});
