# dsh-gov — Agent 治理套件（企业级配套）

权限与合规、审计日志、成本控制 —— DSH 进企业前必须有的东西，做成一个插件。策略门禁（allow/deny/ask）、结构化审计日志、按 agent 的 token 配额，状态持久化在 `$DSH_HOME/gov/`。

## 为什么需要它

企业引入 DSH 时第一波问题永远是：

- **谁能让 agent 跑高危工具？** 策略门禁：按工具/agent/工作区规则 allow / deny / ask，通配符 + 优先级，默认放行、平局 fail-closed（deny > ask > allow）。
- **出事了怎么追溯？** 每次工具调用（决定 + 结果）写入结构化 JSONL 审计日志（`audit.jsonl`），可查询、可导出、可汇总。
- **钱花哪去了？** 接宿主 `tokenMeter` 按 agent 累计用量，周期配额（day/week/month/total），超限注入上下文警告，一键重置。

## 安装

```bash
dsh plugin --profile <profile名> add dsh-gov
```

## 用法

`gov` 工具 action：`status`（总览）、`policy_list/add/remove`（规则管理，tool 支持 `*` 通配）、`audit_query/export`（审计）、`quota_get/set/reset`（配额）。

```text
gov policy_add tool="pwsh*" policyAction=ask reason="shell 命令需审批" priority=10
gov quota_set id=alice quotaLimit=100000 period=day
gov audit_query decision=deny limit=20
```

## 配置

`root`（默认 `$DSH_HOME/gov`）、`defaultPeriod`（day）、`defaultLimit`（0=不限）、`prestepWarn`（true）、`sectionOrder`（5）。

## 设计

- 纯逻辑分层：`policy.js` / `audit.js` / `quota.js` 零依赖可单测；`index.js` 接线（`tools/pre-execute` 门禁、`tools/result` 观察、`agent/pre-step` 计量）。
- 全局治理（DSH home 持久化），跨工作区一致；fail-safe（计量/持久化失败不阻塞 agent）。
- 审计日志纯追加 JSONL，二期可导出合规报告、多租户隔离。

## License

MIT
