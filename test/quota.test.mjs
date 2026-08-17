import { test } from "node:test";
import assert from "node:assert/strict";
import { periodKey, resetIfNeeded, applyTokens, newQuota } from "../lib/quota.js";

test("periodKey: day / week / month / total", () => {
  const now = Date.UTC(2026, 7, 17, 12, 0, 0); // 2026-08-17
  assert.equal(periodKey("day", now), "2026-08-17");
  assert.equal(periodKey("month", now), "2026-08");
  assert.equal(periodKey("total", now), "total");
  assert.ok(/^2026-W\d{2}$/.test(periodKey("week", now)));
});

test("resetIfNeeded resets when the period rolls over", () => {
  const q = newQuota("day", 1000, Date.UTC(2026, 7, 17, 10, 0, 0));
  q.used = 500;
  resetIfNeeded(q, Date.UTC(2026, 7, 18, 0, 0, 0));
  assert.equal(q.used, 0);
  assert.equal(q.periodKey, "2026-08-18");
});

test("applyTokens accumulates and flags exceed", () => {
  const q = newQuota("day", 100, Date.UTC(2026, 7, 17, 10, 0, 0));
  const r1 = applyTokens(q, 60, Date.UTC(2026, 7, 17, 11, 0, 0));
  assert.equal(r1.exceeded, false);
  assert.equal(r1.remaining, 40);
  const r2 = applyTokens(q, 50, Date.UTC(2026, 7, 17, 12, 0, 0));
  assert.equal(r2.exceeded, true);
  assert.equal(r2.remaining, 0);
});

test("limit 0 means unlimited", () => {
  const q = newQuota("day", 0, Date.now());
  const r = applyTokens(q, 1e9, Date.now());
  assert.equal(r.exceeded, false);
  assert.equal(r.remaining, Infinity);
});


test("quota week period rolls over", () => {
  const mon = Date.UTC(2026, 7, 17, 0, 0, 0); // Monday
  const q = newQuota("week", 100, mon);
  q.used = 50;
  const r = applyTokens(q, 60, Date.UTC(2026, 7, 18, 12, 0, 0)); // Tuesday same week
  assert.equal(r.exceeded, true);
  resetIfNeeded(q, Date.UTC(2026, 7, 24, 0, 0, 0)); // next Monday
  assert.equal(q.used, 0);
});