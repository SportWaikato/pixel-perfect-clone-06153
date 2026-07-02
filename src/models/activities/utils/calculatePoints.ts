export const DEFAULT_POINTS_PER_HOUR = 60;

export const calculateBasePoints = (durationMinutes: number): number =>
  Math.round((durationMinutes / 60) * DEFAULT_POINTS_PER_HOUR);

export const calculatePointsWithMultiplier = (
  basePoints: number,
  eventMultiplier = 1.0,
): { base_points: number; final_points: number; challenge_points_multiplier: number } => ({
  base_points: basePoints,
  final_points: Math.round(basePoints * eventMultiplier),
  challenge_points_multiplier: eventMultiplier,
});

// Challenge bonus: student earns per-minute base points plus the fixed challenge bonus.
export const calculateFixedChallengePoints = (
  basePoints: number,
  challengePoints: number,
): { base_points: number; final_points: number; challenge_points_multiplier: number } => ({
  base_points: basePoints,
  final_points: basePoints + challengePoints,
  challenge_points_multiplier: 1.0,
});
