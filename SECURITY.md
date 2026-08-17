# Security

## Trust model

`dsh-gov` is a host-side governance plugin — it intentionally holds policy authority over tool calls. Review the source before installing; a misconfigured rule can block or allow tool use.

## Capabilities

- **Policy gating**: `tools/pre-execute` waterfall returns deny/ask/allow. Denied calls never reach the tool body.
- **Audit trail**: appends JSONL to `$DSH_HOME/gov/audit.jsonl` (tool name, agent, workspace, decision, reason, outcome). Never logs tool arguments.
- **Quota metering**: reads host `tokenMeter` measurements; state in `$DSH_HOME/gov/gov.json`.
- **Network**: none.

## Fail-safe behavior

- Metering or persistence errors never block the agent (best-effort).
- Policy ties fail closed (deny > ask > allow).

## Reporting

Open an issue in this repository.
