/**
 * Conversion rate = (leads with disposition "converted" among those with ≥1 follow-up) / (leads with ≥1 follow-up) × 100
 * Always capped at 0–100%.
 */
export function calculateConversionRate(convertedCount, leadsWithFollowups) {
  const converted = Math.max(0, Number(convertedCount) || 0);
  const denominator = Math.max(0, Number(leadsWithFollowups) || 0);
  if (denominator === 0) return 0;
  const raw = (converted / denominator) * 100;
  return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}

export function calculateLeaderboardConversion(convertedCount, leadsWithFollowups) {
  return calculateConversionRate(convertedCount, leadsWithFollowups);
}
