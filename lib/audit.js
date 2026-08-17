/**
 * dsh-gov — pure audit model: entry shape, serialization, query, summary.
 * Zero DSH imports; file IO is injected by the caller.
 * @module dsh-gov/audit
 */

/** Build a normalized audit entry. */
export function auditEntry({ ts, agent, workspace, tool, decision, reason, meta }) {
  return {
    ts: typeof ts === "number" ? ts : Date.now(),
    agent: agent ?? "unknown",
    workspace: workspace ?? "",
    tool: tool ?? "",
    decision: decision ?? "observe",
    reason: reason ?? "",
    meta: meta ?? null,
  };
}

/** Serialize one entry as a JSON line (for a JSONL audit log). */
export function serializeEntry(entry) {
  return JSON.stringify(entry);
}

/** Parse a JSONL audit log into entries (skipping malformed lines). */
export function parseLog(text) {
  const entries = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (line.trim().length === 0) continue;
    try {
      const e = JSON.parse(line);
      if (e && typeof e === "object" && e.ts !== void 0) entries.push(e);
    } catch { /* skip malformed line */ }
  }
  return entries;
}

/** Filter and page a log. */
export function queryLog(entries, opts = {}) {
  const { limit = 50, agent, tool, decision, since, until } = opts;
  return entries
    .filter((e) => agent === void 0 || e.agent === agent)
    .filter((e) => tool === void 0 || globEquals(e.tool, tool))
    .filter((e) => decision === void 0 || e.decision === decision)
    .filter((e) => since === void 0 || e.ts >= since)
    .filter((e) => until === void 0 || e.ts <= until)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, Math.max(1, Math.min(limit, 200)));
}

function globEquals(value, pattern) {
  const p = String(pattern).toLowerCase();
  const v = String(value ?? "").toLowerCase();
  if (!p.includes("*")) return p === v;
  const [head, tail] = p.split("*", 2);
  return v.startsWith(head) && (tail === void 0 ? true : v.endsWith(tail));
}

/** Rollup counts over a log. */
export function summarize(entries) {
  const total = entries.length;
  const byDecision = { allow: 0, deny: 0, ask: 0, observe: 0 };
  const byTool = {};
  for (const e of entries) {
    byDecision[e.decision] = (byDecision[e.decision] ?? 0) + 1;
    const key = e.tool || "(none)";
    byTool[key] = (byTool[key] ?? 0) + 1;
  }
  return { total, byDecision, byTool };
}
