# Changelog

## [0.1.0] — 2026-08-16

- `gov` tool: status / policy_list / policy_add / policy_remove / audit_query / audit_export / quota_get / quota_set / quota_reset.
- Policy gating on `tools/pre-execute`: allow/deny/ask rules with `*` wildcards, priorities, fail-closed ties.
- Audit trail: structured JSONL log (`$DSH_HOME/gov/audit.jsonl`) recording every decision and tool outcome.
- Token quotas: per-agent budgets against `ctx.tokenMeter`, day/week/month/total periods, pre-step context warning on exceed.
- 15 unit tests across policy/audit/quota pure modules.
