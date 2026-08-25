/**
 * The single owner of match-score thresholds and their colours.
 *
 * These were previously three separate constants and two copies of the banding logic, which is
 * how a score ends up reading as two different strengths in two places. Everything that colours
 * or filters by score reads from here.
 */

/** Blue band, the High Match filter, and what the search banner calls a "strong match". */
export const HIGH_MATCH_SCORE = 70;

/** Top band — green, and the only band that glows. */
export const GLOWING_MATCH_SCORE = 88;

/** Fill classes for the inline bar in the jobs table. */
export function matchBarClassName(score: number): string {
  if (score >= GLOWING_MATCH_SCORE) return "bg-success shadow-success-glow";
  if (score >= HIGH_MATCH_SCORE) return "bg-info";
  return "bg-warning";
}

/** Pill classes for the badge on the job details page — the same bands on `-light` surfaces. */
export function matchBadgeClassName(score: number): string {
  if (score >= GLOWING_MATCH_SCORE) return "bg-success-light text-success-dark shadow-success-glow";
  if (score >= HIGH_MATCH_SCORE) return "bg-info-light text-info-dark";
  return "bg-warning/15 text-warning";
}
