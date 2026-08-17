/**
 * dsh-gov — pure policy engine: rule matching and decision. Zero DSH imports.
 *
 * A rule: { id, tool?, agents?, workspaces?, action: 'allow'|'deny'|'ask',
 *           reason?, priority? }. `tool`/agent/workspace patterns support
 * simple `*` wildcards. Rules are evaluated by priority (higher wins);
 * ties resolve deny > ask > allow (fail-closed).
 * @module dsh-gov/policy
 */

/** Simple glob: `*` matches any sequence; otherwise exact, case-insensitive. */
export function globMatch(pattern, value) {
  if (pattern === "*" || pattern === void 0) return true;
  const p = String(pattern).toLowerCase();
  const v = String(value ?? "").toLowerCase();
  if (!p.includes("*")) return p === v;
  const parts = p.split("*");
  if (!v.startsWith(parts[0]) || !v.endsWith(parts[parts.length - 1])) return false;
  let rest = v.slice(parts[0].length, v.length - parts[parts.length - 1].length);
  for (let i = 1; i < parts.length - 1; i++) {
    const idx = rest.indexOf(parts[i]);
    if (idx === -1) return false;
    rest = rest.slice(idx + parts[i].length);
  }
  return true;
}

/** Whether one rule applies to a call context. */
export function matchRule(rule, call) {
  if (!rule || typeof rule !== "object") return false;
  if (rule.tool !== void 0 && !globMatch(rule.tool, call.tool)) return false;
  if (rule.agents !== void 0 && rule.agents.length > 0 && !rule.agents.some((a) => globMatch(a, call.agent))) return false;
  if (rule.workspaces !== void 0 && rule.workspaces.length > 0 && !rule.workspaces.some((w) => globMatch(w, call.workspace))) return false;
  return true;
}

const ACTION_RANK = { deny: 2, ask: 1, allow: 0 };

/**
 * Decide on a call against the rule list. Defaults to `allow` (matching the
 * harness default posture); a matched rule's priority decides, ties fail
 * closed (deny > ask > allow).
 * @param rules - policy rules.
 * @param call - { tool, agent?, workspace? }.
 * @returns { decision, rule? }.
 */
export function decide(rules, call) {
  const matched = (rules ?? [])
    .filter((r) => matchRule(r, call))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || ACTION_RANK[b.action] - ACTION_RANK[a.action]);
  if (matched.length === 0) return { decision: "allow" };
  return { decision: matched[0].action, rule: matched[0] };
}

/** Validate a rules list; returns problem strings (empty = valid). */
export function validateRules(rules) {
  const problems = [];
  if (!Array.isArray(rules)) return ["rules must be an array"];
  const ids = new Set();
  for (const r of rules) {
    if (!r || typeof r !== "object") { problems.push("rule is not an object"); continue; }
    if (typeof r.id !== "string" || r.id.length === 0) problems.push("rule missing id");
    else if (ids.has(r.id)) problems.push("duplicate rule id: " + r.id);
    else ids.add(r.id);
    if (!["allow", "deny", "ask"].includes(r.action)) problems.push("rule " + (r.id ?? "?") + " has invalid action: " + String(r.action));
  }
  return problems;
}