import { test } from "node:test";
import assert from "node:assert/strict";
import { auditEntry, serializeEntry, parseLog, queryLog, summarize } from "../lib/audit.js";

test("auditEntry normalizes fields", () => {
  const e = auditEntry({ agent: "a", workspace: "/w", tool: "read", decision: "deny", reason: "policy r1" });
  assert.equal(e.decision, "deny");
  assert.ok(e.ts > 0);
  assert.equal(e.meta, null);
});

test("serialize/parse roundtrip preserves entries", () => {
  const entries = [
    auditEntry({ agent: "a", tool: "read", decision: "allow" }),
    auditEntry({ agent: "b", tool: "pwsh_run", decision: "deny", reason: "guard" }),
  ];
  const text = entries.map(serializeEntry).join("\n");
  const parsed = parseLog(text);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[1].decision, "deny");
});

test("parseLog skips malformed lines", () => {
  const parsed = parseLog("not json\n{\"ts\": 1}\n");
  assert.equal(parsed.length, 1);
});

test("queryLog filters, sorts newest first, and pages", () => {
  const entries = [
    { ts: 1, agent: "a", tool: "read", decision: "allow" },
    { ts: 2, agent: "b", tool: "pwsh_run", decision: "deny" },
    { ts: 3, agent: "a", tool: "read", decision: "deny" },
  ];
  const out = queryLog(entries, { agent: "a", limit: 1 });
  assert.equal(out.length, 1);
  assert.equal(out[0].ts, 3);
  const denied = queryLog(entries, { decision: "deny" });
  assert.equal(denied.length, 2);
});

test("summarize rolls up decisions and tools", () => {
  const entries = [
    { ts: 1, tool: "read", decision: "allow" },
    { ts: 2, tool: "read", decision: "deny" },
    { ts: 3, tool: "pwsh_run", decision: "deny" },
  ];
  const s = summarize(entries);
  assert.equal(s.total, 3);
  assert.equal(s.byDecision.deny, 2);
  assert.equal(s.byTool.read, 2);
});
