export interface WizardState {
  eventId: string;
  activityType: string;
  customActivityName: string;
  activityDate: string;
  durationMinutes: number;
  activityContext: string;
  competitionName: string;
  location: string;
  participationType: "solo" | "with_others";
  notes: string;
}

export const STEP_LABELS: Record<number, string> = {
  1: "CHALLENGE",
  2: "ACTIVITY",
  3: "DATE & DURATION",
  4: "HOW WAS IT?",
  5: "CONFIRM",
};

export const TOTAL_STEPS = 5;

export const EVENT_TYPE_TO_ACTIVITY_TYPE: Record<string, string> = {
  running: "run_jog",
  cycling: "bike_cycle",
  swimming: "swimming",
};
