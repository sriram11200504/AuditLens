// Pure, isomorphic utility functions – safe to import in both client and server components

export type SeverityLevel = 'high' | 'medium' | 'low';

const SEVERITY_WEIGHTS: Record<string, number> = {
  high: 25,
  medium: 12,
  low: 5,
};

/**
 * Deterministic risk score calculator.
 * - dismissed findings contribute 0
 * - accepted findings contribute 20% (mitigation credit)
 * - pending findings contribute full weight
 * Capped at 100.
 */
export function calculateRiskScore(
  findings: Array<{ severity: string; userDecision: string }>
): number {
  let score = 0;
  for (const f of findings) {
    if (f.userDecision === 'dismissed') continue;
    if (f.userDecision === 'accepted') {
      score += Math.round((SEVERITY_WEIGHTS[f.severity] ?? 0) * 0.2);
    } else {
      score += SEVERITY_WEIGHTS[f.severity] ?? 0;
    }
  }
  return Math.min(100, score);
}

