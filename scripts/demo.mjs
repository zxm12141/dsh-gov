/**
 * dsh-gov — runnable demo of the governance engines (pure logic, no DSH runtime).
 * Run: node scripts/demo.mjs
 */
import { decide, validateRules } from "../lib/policy.js";
import { auditEntry, queryLog, summarize } from "../lib/audit.js";
import { newQuota, applyTokens, periodKey } from "../lib/quota.js";

console.log("── 1. 策略引擎 ──");
const rules = [
  { id: "r1", tool: "pwsh*", action: "ask", reason: "shell commands need approval", priority: 10 },
  { id: "r2", tool: "rm*", action: "deny", reason: "destructive", priority: 20 },
];
console.log(decide(rules, { tool: "pwsh_run" }));
console.log(decide(rules, { tool: "rm -rf /tmp/x" }));
console.log("valid:", validateRules(rules));

console.log("\n── 2. 审计 ──");
const entries = [
  auditEntry({ agent: "alice", workspace: "/w1", tool: "read", decision: "allow" }),
  auditEntry({ agent: "bob", workspace: "/w2", tool: "pwsh_run", decision: "ask" }),
  auditEntry({ agent: "alice", workspace: "/w1", tool: "rm_x", decision: "deny", reason: "destructive" }),
];
console.log("denied:", JSON.stringify(queryLog(entries, { decision: "deny" })));
console.log("summary:", JSON.stringify(summarize(entries)));

console.log("\n── 3. 配额 ──");
const q = newQuota("day", 1000);
console.log("period:", q.periodKey, "| week:", periodKey("week"));
console.log(applyTokens(q, 600, Date.now()));
console.log(applyTokens(q, 500, Date.now()));
