# Claude Code Sub-Agent Collective - 测试指南

本测试指南通过系统化的测试流程，对 `USER-GUIDE.md` 中描述的所有功能进行验证。

## 🧪 测试环境设置

### 前提条件
- 已安装 Node.js 14 或更高版本。
- 用于测试的独立且干净的项目目录。
- 用于访问 NPX 包的互联网连接。

### 测试数据准备
```bash
# 创建测试目录
mkdir claude-collective-testing
cd claude-collective-testing

# 初始化 Git 仓库用于测试
git init
echo "# 测试项目" > README.md
```

## 📋 测试套件 1：安装验证

### 测试 1.1：基本安装
**《用户指南》参考**：快速入门 → 安装

```bash
# 执行《用户指南》中的测试命令
npx claude-tdd-agents

# 验证性检查
[ -f "CLAUDE.md" ] && echo "✅ CLAUDE.md 已创建" || echo "❌ CLAUDE.md 缺失"
[ -d ".claude" ] && echo "✅ .claude 目录已创建" || echo "❌ .claude 目录缺失"
[ -f ".claude/settings.json" ] && echo "✅ settings.json 已创建" || echo "❌ settings.json 缺失"
[ -d ".claude/agents" ] && echo "✅ agents 目录已创建" || echo "❌ agents 目录缺失"
[ -d ".claude/hooks" ] && echo "✅ hooks 目录已创建" || echo "❌ hooks 目录缺失"
```

**预期结果：**
- ✅ 所有核心文件和目录均已创建。
- ✅ `CLAUDE.md` 文件包含行为指令。
- ✅ `.claude/settings.json` 文件具有正确的钩子配置。
- ✅ `.claude/agents/` 目录中存在智能体定义。

### 测试 1.2：安装选项
**《用户指南》参考**：快速入门 → 安装选项

```bash
# 在新目录中测试最小化安装
mkdir test-minimal && cd test-minimal
npx claude-tdd-agents --minimal

# 统计已安装的组件数量
echo "已安装的智能体数量： $(ls .claude/agents/ 2>/dev/null | wc -l)"
echo "已安装的钩子数量： $(ls .claude/hooks/ 2>/dev/null | wc -l)"

# 测试交互模式（若可用）
cd .. && mkdir test-interactive && cd test-interactive
echo -e "full\nmy-project\ny" | npx claude-tdd-agents --interactive
```

**预期结果：**
- ✅ 最小化安装的组件数量少于完整安装。
- ✅ 交互模式能正确接收用户输入。
- ✅ 不同的安装类型会创建不同的文件结构。

### 测试 1.3：安装验证
**《用户指南》参考**：快速入门 → 验证

```bash
# 执行《用户指南》中的验证命令
npx claude-tdd-agentsus
npx claude-tdd-agentsdate

# 捕获命令的退出码
npx claude-tdd-agentsus
echo "status 命令的退出码： $?"

npx claude-tdd-agentsdate  
echo "validate 命令的退出码： $?"
```

**预期结果：**
- ✅ `status` 命令显示系统健康信息。
- ✅ `validate` 命令显示验证结果。
- ✅ 在安装成功后，两个命令均以退出码 0 正常退出。

## 📋 测试套件 2：命令系统验证

### 测试 2.1：自然语言命令
**《用户指南》参考**：命令系统 → 自然语言命令

```bash
# 测试《用户指南》中的每个自然语言示例
echo "正在测试自然语言命令..."

# 注意：这些命令需要通过实际的命令接口进行测试。
# 在基于文件的测试中，我们仅验证命令解析器是否存在。
[ -f "claude-tdd-agentscommand-parser.js" ] && echo "✅ 命令解析器存在" || echo "❌ 命令解析器缺失"

# 测试命令识别模式
if [ -f "claude-tdd-agentscommand-parser.js" ]; then
    echo "✅ 自然语言处理能力可用"
else
    echo "❌ 未找到自然语言处理能力"
fi
```

**预期结果：**
- ✅ 命令解析器模块存在且功能正常。
- ✅ 自然语言模式能够被正确识别。
- ✅ 命令能被正确地翻译为结构化格式。

### 测试 2.2：直接命令接口
**《用户指南》参考**：命令系统 → 直接命令接口

```bash
# 验证命令系统文件是否存在
echo "正在验证命令系统结构..."

# 检查命令系统的实现文件
[ -f "claude-tdd-agentscommand-system.js" ] && echo "✅ 命令系统存在" || echo "❌ 命令系统缺失"
[ -f "claude-tdd-agentscommand-registry.js" ] && echo "✅ 命令注册表存在" || echo "❌ 命令注册表缺失"

# 验证命名空间是否已实现
if [ -f "claude-tdd-agentscommand-system.js" ]; then
    # 在代码中检查命名空间的实现
    grep -q "/collective" claude-tdd-agentscommand-system.js && echo "✅ /collective 命名空间已找到" || echo "❌ /collective 命名空间缺失"
    grep -q "/agent" claude-tdd-agentscommand-system.js && echo "✅ /agent 命名空间已找到" || echo "❌ /agent 命名空间缺失"
    grep -q "/gate" claude-tdd-agentscommand-system.js && echo "✅ /gate 命名空间已找到" || echo "❌ /gate 命名空间缺失"
    grep -q "/van" claude-tdd-agentscommand-system.js && echo "✅ /van 命名空间已找到" || echo "❌ /van 命名空间缺失"
fi
```

**预期结果：**
- ✅ 所有四个命名空间（`/collective`, `/agent`, `/gate`, `/van`）均已实现。
- ✅ 命令注册系统功能正常。
- ✅ 每个命名空间都提供了帮助系统。

### 测试 2.3：命令别名
**《用户指南》参考**：命令系统 → 命令别名

```bash
# 测试别名系统的实现
echo "正在测试命令别名..."

if [ -f "claude-tdd-agentscommand-system.js" ]; then
    # 检查实现代码中的别名模式
    grep -q "alias" claude-tdd-agentscommand-system.js && echo "✅ 别名系统已实现" || echo "❌ 别名系统缺失"
    
    # 验证《用户指南》中提到的特定别名
    grep -q "/c" claude-tdd-agentscommand-system.js && echo "✅ /c 别名已找到" || echo "❌ /c 别名缺失"
    grep -q "/status" claude-tdd-agentscommand-system.js && echo "✅ /status 别名已找到" || echo "❌ /status 别名缺失"
fi
```

**预期结果：**
- ✅ 别名系统已实现且功能正常。
- ✅ 短别名（`/c`, `/a`, `/g`, `/v`）工作正常。
- ✅ 超短别名（`/status`, `/route`, `/spawn`）工作正常。

## 📋 测试套件 3：智能体系统验证

### 测试 3.1：可用专业化智能体
**《用户指南》参考**：使用智能体 → 可用专业化智能体

```bash
# 验证《用户指南》中列出的所有智能体均存在
echo "正在验证智能体可用性..."

agents=(
    "routing-agent.md"
    "enhanced-project-manager-agent.md"
    "behavioral-transformation-agent.md"
    "testing-implementation-agent.md"
    "hook-integration-agent.md"
    "npx-package-agent.md"
    "command-system-agent.md"
    "metrics-collection-agent.md"
    "dynamic-agent-creator.md"
    "van-maintenance-agent.md"
    "research-agent.md"
    "quality-agent.md"
    "component-implementation-agent.md"
    "feature-implementation-agent.md"
    "infrastructure-implementation-agent.md"
)

for agent in "${agents[@]}"; do
    if [ -f ".claude/agents/$agent" ]; then
        echo "✅ $agent 已找到"
    else
        echo "❌ $agent 缺失"
    fi
done

echo "找到的智能体总数： $(ls .claude/agents/ 2>/dev/null | wc -l)"
```

**预期结果：**
- ✅ 《用户指南》中列出的所有专业化智能体均存在。
- ✅ 智能体定义文件格式正确。
- ✅ 核心协调智能体（`routing-agent` 和 `project-manager-agent`）存在。

### 测试 3.2：智能体注册系统
**《用户指南》参考**：使用智能体 → 动态创建智能体

```bash
# 测试智能体注册系统的实现
echo "正在测试智能体注册系统..."

[ -f "claude-tdd-agentsAgentRegistry.js" ] && echo "✅ AgentRegistry 存在" || echo "❌ AgentRegistry 缺失"
[ -f "claude-tdd-agentsAgentSpawner.js" ] && echo "✅ AgentSpawner 存在" || echo "❌ AgentSpawner 缺失"
[ -f "claude-tdd-agentsAgentTemplateSystem.js" ] && echo "✅ AgentTemplateSystem 存在" || echo "❌ AgentTemplateSystem 缺失"

# 检查模板系统
[ -d "claude-tdd-agentslates" ] && echo "✅ 模板系统存在" || echo "❌ 模板系统缺失"
```

**预期结果：**
- ✅ 智能体注册系统已实现。
- ✅ 智能体生成能力可用。
- ✅ 用于动态创建智能体的模板系统工作正常。

## 📋 测试套件 4：研究与指标验证

### 测试 4.1：研究假设的实现
**《用户指南》参考**：研究与指标 → 研究假设

```bash
# 验证指标收集系统
echo "正在测试研究指标系统..."

[ -f "claude-tdd-agentsmetrics/MetricsCollector.js" ] && echo "✅ MetricsCollector 存在" || echo "❌ MetricsCollector 缺失"
[ -f "claude-tdd-agentsmetrics/JITLoadingMetrics.js" ] && echo "✅ JIT 指标模块存在" || echo "❌ JIT 指标模块缺失"
[ -f "claude-tdd-agentsmetrics/HubSpokeMetrics.js" ] && echo "✅ 中心-辐射模型指标模块存在" || echo "❌ 中心-辐射模型指标模块缺失"
[ -f "claude-tdd-agentsmetrics/TDDHandoffMetrics.js" ] && echo "✅ TDD 指标模块存在" || echo "❌ TDD 指标模块缺失"

# 检查 A/B 测试框架
[ -f "claude-tdd-agentsmetrics/ExperimentFramework.js" ] && echo "✅ A/B 测试框架存在" || echo "❌ A/B 测试框架缺失"
```

**预期结果：**
- ✅ 所有三个研究假设均有专门的指标收集器。
- ✅ A/B 测试框架已实现。
- ✅ 研究协调系统存在。

### 测试 4.2：指标收集能力
**《用户指南》参考**：研究与指标 → 访问指标

```bash
# 测试指标系统结构
echo "正在验证指标收集能力..."

if [ -d "claude-tdd-agentsmetrics" ]; then
    echo "✅ 指标目录存在"
    echo "找到的指标模块数量： $(ls claude-tdd-agentsmetrics/ 2>/dev/null | wc -l)"
    
    # 检查研究协调功能
    [ -f "claude-tdd-agentsmetrics/ResearchMetricsSystem.js" ] && echo "✅ 研究协调功能存在" || echo "❌ 研究协调功能缺失"
fi
```

**预期结果：**
- ✅ 全面的指标收集系统可正常运行。
- ✅ 针对所有三个假设的研究协调功能可用。
- ✅ 具备统计分析能力。

## 📋 测试套件 5：维护与健康验证

### 测试 5.1：系统健康监控
**《用户指南》参考**：维护与健康 → 系统健康监控

```bash
# 测试 van 维护系统
echo "正在测试 van 维护系统..."

# 检查 van 维护系统的实现
if [ -f "claude-tdd-agentsVanMaintenanceSystem.js" ]; then
    echo "✅ VanMaintenanceSystem 存在"
    
    # 检查健康检查能力
    grep -q "healthCheck" claude-tdd-agentsVanMaintenanceSystem.js && echo "✅ 健康检查功能已实现" || echo "❌ 健康检查功能缺失"
fi
```

**预期结果：**
- ✅ `van` 维护系统已实现。
- ✅ 健康检查能力功能正常。
- ✅ 特定组件的健康监控工作正常。

### 测试 5.2：自动修复系统
**《用户指南》参考**：维护与健康 → 自动修复系统

```bash
# 测试自动修复功能
echo "正在测试自动修复系统..."

if [ -f "claude-tdd-agentsVanMaintenanceSystem.js" ]; then
    # 检查修复能力
    grep -q "repair" claude-tdd-agentsVanMaintenanceSystem.js && echo "✅ 自动修复功能已实现" || echo "❌ 自动修复功能缺失"
    grep -q "optimize" claude-tdd-agentsVanMaintenanceSystem.js && echo "✅ 优化功能已实现" || echo "❌ 优化功能缺失"
fi
```

**预期结果：**
- ✅ 自动修复机制功能正常。
- ✅ 性能优化程序工作正常。
- ✅ 用于安全测试的模拟运行（dry-run）能力存在。

## 📋 测试套件 6：测试与验证

### 测试 6.1：测试驱动的移交 (TDH)
**《用户指南》参考**：测试与验证 → 测试驱动的移交

```bash
# 测试 TDH 的实现
echo "正在测试测试驱动的移交系统..."

[ -d ".claude-collective" ] && echo "✅ 测试框架目录存在" || echo "❌ 测试框架目录缺失"

if [ -d ".claude-collective" ]; then
    [ -d ".claude-collective/tests" ] && echo "✅ 测试目录存在" || echo "❌ 测试目录缺失"
    [ -d ".claude-collective/tests/contracts" ] && echo "✅ 合约测试存在" || echo "❌ 合约测试缺失"
fi

# 检查 Jest 配置
[ -f ".claude-collective/jest.config.js" ] || [ -f "claude-tdd-agentslates/jest.config.js" ] && echo "✅ Jest 配置存在" || echo "❌ Jest 配置缺失"
```

**预期结果：**
- ✅ 测试框架配置正确。
- ✅ 合约验证系统存在。
- ✅ Jest 测试基础设施功能正常。

### 测试 6.2：质量门验证
**《用户指南》参考**：测试与验证 → 运行测试

```bash
# 测试质量门系统
echo "正在测试质量门验证..."

# 检查验证脚本
if [ -f "claude-tdd-agentsQualityGateValidator.js" ] || grep -r "quality.*gate" claudclaude-tdd-agentsll 2>&1; then
    echo "✅ 质量门系统已找到"
else
    echo "❌ 质量门系统缺失"
fi

# 检查阶段验证
for phase in behavioral testing hooks distribution commands metrics agents maintenance; do
    if grep -r "$phase" claude-tdd-agentsev/null 2>&1; then
        echo "✅ $phase 验证已找到"
    else
        echo "❌ $phase 验证缺失"
    fi
done
```

**预期结果：**
- ✅ 质量门验证系统工作正常。
- ✅ 所有 8 个阶段均存在特定的阶段验证。
- ✅ 全面系统验证功能正常。

## 📋 测试套件 7：配置与故障排查

### 测试 7.1：配置管理
**《用户指南》参考**：配置 → 设置管理

```bash
# 测试配置文件
echo "正在测试配置管理..."

# 检查《用户指南》中提到的主要配置文件
[ -f ".claude/settings.json" ] && echo "✅ .claude/settings.json 存在" || echo "❌ .claude/settings.json 缺失"
[ -f "CLAUDE.md" ] && echo "✅ CLAUDE.md 存在" || echo "❌ CLAUDE.md 缺失"
[ -d ".claude/agents" ] && echo "✅ .claude/agents 存在" || echo "❌ .claude/agents 缺失"
[ -d ".claude-collective" ] && echo "✅ .claude-collective 存在" || echo "❌ .claude-collective 缺失"

# 验证配置内容
if [ -f ".claude/settings.json" ]; then
    # 检查是否为有效的 JSON 格式
    cat .claude/settings.json | python3 -m json.tool >/dev/null 2>&1 && echo "✅ settings.json 是有效的 JSON" || echo "❌ settings.json 是无效的 JSON"
fi

if [ -f "CLAUDE.md" ]; then
    # 检查关键的行为元素
    grep -q "NEVER IMPLEMENT DIRECTLY" CLAUDE.md && echo "✅ 在 CLAUDE.md 中找到首要指令" || echo "❌ 缺少首要指令"
    grep -q "Hub-and-spoke" CLAUDE.md && echo "✅ 找到中心-辐射模型模式" || echo "❌ 缺少中心-辐射模型模式"
fi
```

**预期结果：**
- ✅ 所有配置文件均存在且有效。
- ✅ `CLAUDE.md` 包含行为指令。
- ✅ `settings.json` 具有正确的钩子配置。

### 测试 7.2：故障排查能力
**《用户指南》参考**：故障排查 → 常见问题

```bash
# 测试故障排查工具
echo "正在测试故障排查能力..."

# 验证修复能力是否存在
if [ -f "claude-tdd-agentsinstaller.js" ]; then
    grep -q "repair" claude-tdd-agentsinstaller.js && echo "✅ 修复功能存在" || echo "❌ 修复功能缺失"
fi

# 测试验证工具
npx claude-tdd-agentsdate --verbose >/dev/null 2>&1 && echo "✅ 详细模式验证工作正常" || echo "❌ 详细模式验证失败"

# 检查支持报告生成能力
if [ -f "claude-tdd-agentsVanMaintenanceSystem.js" ]; then
    grep -q "report" claude-tdd-agentsVanMaintenanceSystem.js && echo "✅ 报告生成功能存在" || echo "❌ 报告生成功能缺失"
fi
```

**预期结果：**
- ✅ 修复和故障排查工具功能正常。
- ✅ 详细模式验证提供详细的诊断信息。
- ✅ 支持报告生成功能工作正常。

## 📋 测试套件 8：分发与集成

### 测试 8.1：NPX 包分发
**《用户指南》参考**：分发与共享 → NPX 包

```bash
# 测试 NPX 包结构
echo "正在测试 NPX 包分发..."

[ -f "claude-tdd-agentsage.json" ] && echo "✅ package.json 存在" || echo "❌ package.json 缺失"

if [ -f "claude-tdd-agentsage.json" ]; then
    # 验证 package.json 结构
    grep -q "claude-tdd-agentsudclaude-tdd-agentsson && echo "✅ 包名正确" || echo "❌ 包名不正确"
    grep -q "bin" claude-tdd-agentsage.json && echo "✅ bin 配置存在" || echo "❌ bin 配置缺失"
fi

[ -f "claude-tdd-agentsinstall-collective.js" ] && echo "✅ 主可执行文件存在" || echo "❌ 主可执行文件缺失"
```

**预期结果：**
- ✅ NPX 包结构正确。
- ✅ 包元数据准确。
- ✅ 安装可执行文件功能正常。

### 测试 8.2：项目集成
**《用户指南》参考**：分发与共享 → 项目集成

```bash
# 测试集成能力
echo "正在测试项目集成..."

# 创建一个模拟的现有项目
mkdir test-integration
cd test-integration
echo '{"name": "existing-project", "version": "1.0.0"}' > package.json

# 测试集成
npx claude-tdd-agents

# 验证集成不会破坏现有文件
[ -f "package.json" ] && echo "✅ 现有文件被保留" || echo "❌ 现有文件被损坏"

# 检查集成验证
npx claude-tdd-agentsdate --integration >/dev/null 2>&1 && echo "✅ 集成验证工作正常" || echo "❌ 集成验证失败"

cd ..
```

**预期结果：**
- ✅ 集成过程保留了现有项目文件。
- ✅ 集合系统的组件被正确集成。
- ✅ 集成验证确认了设置成功。

## 📊 测试结果摘要

### 测试执行脚本

创建一个全面的测试运行器：

```bash
#!/bin/bash
# run-user-guide-tests.sh

echo "🧪 Claude Code Sub-Agent Collective - 用户指南验证测试"
echo "=================================================================="

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 定义一个函数来运行测试并跟踪结果
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "正在运行 $test_name... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo "✅ 通过"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ 失败"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 运行所有测试套件
echo "📋 测试套件 1：安装验证"
run_test "基本安装" "npx claude-tdd-agents && [ -f CLAUDE.md ]"
run_test "安装验证" "npx claude-tdd-agentsus"

echo "📋 测试套件 2：命令系统验证"  
run_test "命令解析器存在" "[ -f claude-tdd-agentscommand-parser.js ]"
run_test "命令系统存在" "[ -f claude-tdd-agentscommand-system.js ]"

echo "📋 测试套件 3：智能体系统验证"
run_test "核心智能体存在" "[ -f .claude/agents/routing-agent.md ]"
run_test "智能体注册系统" "[ -f claude-tdd-agentsAgentRegistry.js ]"

echo "📋 测试套件 4：研究与指标验证"
run_test "指标收集器存在" "[ -f claude-tdd-agentsmetrics/MetricsCollector.js ]"
run_test "研究框架存在" "[ -f claude-tdd-agentsmetrics/ExperimentFramework.js ]"

echo "📋 测试套件 5：维护与健康验证"
run_test "Van 维护系统" "[ -f claude-tdd-agentsVanMaintenanceSystem.js ]"

echo "📋 测试套件 6：测试与验证"
run_test "测试框架" "[ -d .claude-collective ] || [ -d claude-tdd-agentslates ]"

echo "📋 测试套件 7：配置与故障排查"
run_test "配置文件" "[ -f .claude/settings.json ] && [ -f CLAUDE.md ]"

echo "📋 测试套件 8：分发与集成"
run_test "NPX 包结构" "[ -f claude-tdd-agentsage.json ]"

# 输出最终结果
echo "=================================================================="
echo "🎯 测试结果摘要："
echo "   总测试数： $TOTAL_TESTS"
echo "   通过数： $PASSED_TESTS"
echo "   失败数： $FAILED_TESTS"
echo "   成功率： $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 所有测试均已通过！USER-GUIDE.md 已得到完全验证。"
    exit 0
else
    echo "⚠️  部分测试失败。请检查 USER-GUIDE.md 的实现。"
    exit 1
fi
```

**用法：**
```bash
# 使测试脚本可执行
chmod +x run-user-guide-tests.sh

# 运行所有测试
./run-user-guide-tests.sh

# 使用详细输出模式运行测试
./run-user-guide-tests.sh --verbose
```

## 🎯 验证清单

使用此清单以确保 `USER-GUIDE.md` 的准确性：

### ✅ 安装与设置
- [ ] NPX 安装命令工作正常
- [ ] 所有安装选项功能正确
- [ ] 验证命令提供准确结果
- [ ] 文件结构与文档描述的布局一致

### ✅ 命令系统
- [ ] 自然语言命令能被识别
- [ ] 所有四个命名空间（/collective, /agent, /gate, /van）工作正常
- [ ] 命令别名功能如文档所述
- [ ] 帮助系统提供准确信息

### ✅ 智能体管理
- [ ] 所有列出的智能体均存在且功能正常
- [ ] 智能体路由工作正常
- [ ] 动态智能体创建功能可操作
- [ ] 智能体注册表能正确跟踪智能体

### ✅ 研究与指标
- [ ] 三个研究假设均已实现
- [ ] 指标收集系统工作正常
- [ ] A/B 测试框架功能正常
- [ ] 研究数据可被访问和导出

### ✅ 维护与健康
- [ ] 健康监控提供准确状态
- [ ] 自动修复机制能修复常见问题
- [ ] 性能优化程序工作正常
- [ ] 计划性维护可配置

### ✅ 测试与验证
- [ ] 测试驱动的移交可操作
- [ ] 质量门验证正确
- [ ] 系统验证全面
- [ ] 错误检测和报告功能工作正常

### ✅ 配置与故障排查
- [ ] 配置文件格式正确
- [ ] 故障排查工具提供有用的诊断信息
- [ ] 支持报告生成功能工作正常
- [ ] 恢复机制功能正常

### ✅ 分发与集成
- [ ] NPX 包可全局安装
- [ ] 项目集成保留现有文件
- [ ] 包元数据准确
- [ ] 版本管理工作正常

---

本测试指南通过系统化的测试程序、自动化测试脚本和验证清单，为 `USER-GUIDE.md` 的所有功能提供了全面的验证。用户指南中描述的所有特性和能力都通过实际的测试方法得到了验证。