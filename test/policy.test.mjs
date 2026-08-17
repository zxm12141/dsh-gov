import { test } from "node:test";
import assert from "node:assert/strict";
import { globMatch, matchRule, decide, validateRules } from "../lib/policy.js";

test("globMatch supports wildcards and case-insensitivity", () => {
  assert.equal(globMatch("*", "anything"), true);
  assert.equal(globMatch("bash*", "bash_foo"), true);
  assert.equal(globMatch("bash*", "pwsh_foo"), false);
  assert.equal(globMatch("*write*", "my_writer"), true);
  assert.equal(globMatch("tool", "TOOL"), true);
  assert.equal(globMatch("tool", "tools"), false);
});

test("matchRule applies tool/agent/workspace filters", () => {
  const rule = { id: "r1", tool: "bash*", agents: ["alice"], workspaces: ["/work/a*"], action: "deny" };
  assert.equal(matchRule(rule, { tool: "bash_run", agent: "alice", workspace: "/work/app" }), true);
  assert.equal(matchRule(rule, { tool: "read", agent: "alice", workspace: "/work/app" }), false);
  assert.equal(matchRule(rule, { tool: "bash_run", agent: "bob", workspace: "/work/app" }), false);
  assert.equal(matchRule(rule, { tool: "bash_run", agent: "alice", workspace: "/other" }), false);
});

test("decide defaults to allow when nothing matches", () => {
  const r = decide([], { tool: "read" });
  assert.equal(r.decision, "allow");
  assert.equal(r.rule, void 0);
});

test("decide honors priority and fails closed on ties", () => {
  const rules = [
    { id: "a", tool: "bash*", action: "allow", priority: 1 },
    { id: "b", tool: "bash_run", action: "deny", priority: 2 },
  ];
  assert.equal(decide(rules, { tool: "bash_run" }).decision, "deny");
  const tie = [
    { id: "x", tool: "read", action: "allow", priority: 0 },
    { id: "y", tool: "read", action: "deny", priority: 0 },
  ];
  assert.equal(decide(tie, { tool: "read" }).decision, "deny");
});

test("decide returns the winning rule", () => {
  const rules = [{ id: "guard", tool: "pwsh*", action: "ask", reason: "shell is risky" }];
  const out = decide(rules, { tool: "pwsh_run" });
  assert.equal(out.decision, "ask");
  assert.equal(out.rule.id, "guard");
});

test("validateRules catches bad structures", () => {
  assert.ok(validateRules("nope").length > 0);
  assert.ok(validateRules([{ id: "a", action: "bogus" }]).length > 0);
  assert.ok(validateRules([{ id: "a", action: "allow" }, { id: "a", action: "deny" }]).length > 0);
  assert.equal(validateRules([{ id: "a", action: "allow" }]).length, 0);
});

test("globMatch handles multi-segment wildcards", () => {
  assert.equal(globMatch("*write*", "my_writer"), true);
  assert.equal(globMatch("*write*", "readonly"), false);
  assert.equal(globMatch("a*b*c", "aXbYc"), true);
});

test("decide fails closed across agent/workspace scopes", () => {
  const rules = [
    { id: "w", workspaces: ["/prod/*"], action: "deny", priority: 5 },
    { id: "a", agents: ["alice"], tool: "bash*", action: "allow", priority: 1 },
  ];
  assert.equal(decide(rules, { tool: "bash_x", agent: "alice", workspace: "/prod/app" }).decision, "deny");
  assert.equal(decide(rules, { tool: "bash_x", agent: "alice", workspace: "/dev/app" }).decision, "allow");
});
