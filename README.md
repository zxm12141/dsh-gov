# dsh-gov — Agent Governance Suite (enterprise companion)

权限、审计、成本 —— DSH 进企业前必须有的东西，做成一个插件。策略门禁（allow/deny/ask）、结构化审计日志、按 agent 的 token 配额，状态持久化在 `$DSH_HOME/gov/`。

## 为什么需要它

企业引入 DSH 时第一波问题永远是：

- **谁能让 agent 跑高危工具？** 策略门禁：按工具/agent/工作区规则，allow / deny / ask，通配符 + 优先级，默认放行、命中即裁决、平局 fail-closed（deny > ask > allow）。
- **出事了怎么追溯？** 每次工具调用（决定 + 结果）都写入结构化 JSONL 审计日志（`audit.jsonl`），可查询、可导出、可汇总。
- **钱花哪去了？** 接宿主 `tokenMeter`，按 agent 累计 token 用量，周期配额（day/week/month/total），超限注入上下文警告，可一键重置。

## 安装

```bash
dsh plugin --profile <profile> add dsh-gov
```

## 用法（模型侧）

工具 `gov`，action 一览：

| action | 说明 |
| --- | --- |
| `status` | 治理总览：规则数、审计事件汇总（allow/deny/ask/error/ok）、配额用量 |
| `policy_list` / `policy_add` / `policy_remove` | 规则管理（tool 支持 `*` 通配；priority 高者胜；平局 fail-closed） |
| `audit_query` / `audit_export` | 查询审计（limit/agent/tool/since 过滤）；导出日志路径 |
| `quota_get` / `quota_set` / `quota_reset` | 按 agent id（或 global）的 token 预算 |

示例：

```text
gov policy_add tool="pwsh*" policyAction=ask reason="shell commands require approval" priority=10
gov quota_set id=alice quotaLimit=100000 period=day
gov audit_query decision=deny limit=20
```

## 配置

| key | 默认 | 说明 |
| --- | --- | --- |
| `root` | `$DSH_HOME/gov` | 治理数据目录（gov.json + audit.jsonl） |
| `defaultPeriod` | `day` | 新配额默认周期 |
| `defaultLimit` | `0` | 默认配额（0 = 不限；>0 时启用 step 计量） |
| `prestepWarn` | `true` | 超限时向模型上下文注入警告 |
| `sectionOrder` | `5` | 提示词段落顺序 |

## 设计

- **纯逻辑分层**：`lib/policy.js`（规则引擎）、`lib/audit.js`（审计模型）、`lib/quota.js`（配额计算）零依赖可单测；`lib/index.js` 负责接线（`tools/pre-execute` 门禁、`tools/result` 观察、`agent/pre-step` 计量）。
- **全局而非会话**：状态和日志在 DSH home，跨工作区一致。
- **fail-safe**：计量失败、持久化失败都不阻塞 agent；策略引擎平局默认 fail-closed。
- 审计日志是纯追加 JSONL，可被任何合规管道消费（二期：导出 SOC2 素材、多租户隔离）。

## 测试

```bash
node test/policy.test.mjs && node test/audit.test.mjs && node test/quota.test.mjs
```

## License

MIT
