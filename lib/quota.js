/**
 * dsh-gov — pure quota model: period keys, token accumulation, reset. Zero
 * DSH imports.
 * @module dsh-gov/quota
 */

/** Period key for a timestamp: day / week (ISO) / month / total. */
export function periodKey(period, now = Date.now()) {
  const d = new Date(now);
  if (period === "month") return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
  if (period === "week") {
    const day = (d.getUTCDay() + 6) % 7; // Monday = 0
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
    const year = monday.getUTCFullYear();
    const week = Math.ceil(((monday - new Date(Date.UTC(year, 0, 1))) / 86400000 + 1) / 7);
    return year + "-W" + String(week).padStart(2, "0");
  }
  if (period === "total") return "total";
  return d.toISOString().slice(0, 10); // day
}

/** Reset a quota when its period rolled over. Returns the same object (mutated). */
export function resetIfNeeded(quota, now = Date.now()) {
  const key = periodKey(quota.period, now);
  if (quota.periodKey !== key) {
    quota.periodKey = key;
    quota.used = 0;
  }
  return quota;
}

/**
 * Apply a token delta to a quota (after resetIfNeeded). Mutates and returns
 * the quota plus the exceeded flag.
 * @returns { quota, exceeded, remaining }.
 */
export function applyTokens(quota, tokens, now = Date.now()) {
  resetIfNeeded(quota, now);
  quota.used += Math.max(0, tokens);
  const limit = quota.limit > 0 ? quota.limit : Infinity;
  const exceeded = quota.used > limit;
  return { quota, exceeded, remaining: limit === Infinity ? Infinity : Math.max(0, limit - quota.used) };
}

/** Build a default quota object. */
export function newQuota(period = "day", limit = 0, now = Date.now()) {
  return { period, limit, used: 0, periodKey: periodKey(period, now) };
}
