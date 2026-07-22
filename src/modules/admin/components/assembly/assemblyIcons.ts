// Assembly slide icons — the branded set uploaded to the public badges
// bucket. Referenced remotely (not bundled) so designers can re-upload
// without a deploy; each slide shows its icon in the header and the menu
// card uses the same art.
const BADGES_BUCKET = "https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges";

export const ASSEMBLY_ICONS = {
  "top-scorers": `${BADGES_BUCKET}/Top%20Scorers%20by%20House.png`,
  leaderboard: `${BADGES_BUCKET}/House%20Leaderboard.png`,
  "house-stats": `${BADGES_BUCKET}/House%20Statistics.png`,
  "house-badges": `${BADGES_BUCKET}/House%20Badges.png`,
  "school-leaderboard": `${BADGES_BUCKET}/School%20Leaderboard.png`,
  challenge: `${BADGES_BUCKET}/Your%20Next%20Challenge.png`,
  "prize-draw": `${BADGES_BUCKET}/Spot%20Prize%20Draw.png`,
} as const;

export type AssemblyIconKey = keyof typeof ASSEMBLY_ICONS;
