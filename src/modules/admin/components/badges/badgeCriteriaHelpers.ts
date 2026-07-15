import { object, string, boolean, mixed, type ObjectSchema } from "yup";
import { ACTIVITY_TYPES } from "@/models/activities/interfaces/ActivityInterface";
import { AchievementInterface } from "@/models/achievements/interfaces/AchievementInterface";

export const CRITERIA_TYPE_OPTIONS = [
  {
    value: "specific_activity",
    label: "Specific Activity",
    description: "Awarded for completing a set duration of a chosen activity type.",
  },
  {
    value: "social_activity",
    label: "Social Activity",
    description: "Earned by spending time being active with others.",
  },
  {
    value: "time_in_nature",
    label: "Time in Nature",
    description: "Awarded for time spent doing outdoor nature-based activities.",
  },
  {
    value: "walk_and_talk",
    label: "Walk & Talk",
    description: "Earned by walking with others for a set duration.",
  },
  {
    value: "entry_count",
    label: "Entry Count",
    description: "Earned after logging a specific number of activities.",
  },
  {
    value: "total_time",
    label: "Total Time",
    description: "Awarded after reaching a total number of activity minutes.",
  },
  {
    value: "streak",
    label: "Streak",
    description: "Earned by holding a daily activity streak for a set number of days.",
  },
  {
    value: "activity_variety",
    label: "Activity Variety",
    description: "Awarded for trying a number of different activity types.",
  },
  {
    value: "first_challenge",
    label: "First Challenge",
    description:
      "Automatically awarded when a user completes their first challenge-linked activity.",
  },
  {
    value: "leaderboard_entry",
    label: "Leaderboard Entry",
    description: "Awarded when a user reaches the top of the leaderboard based on earned points.",
  },
] as const;

export const SCOPE_OPTIONS = [
  { value: "student", label: "Student (individual badge)" },
  { value: "house", label: "House (house vs house challenge)" },
] as const;

export type Scope = (typeof SCOPE_OPTIONS)[number]["value"];

export const HOUSE_CHALLENGE_METRICS = [
  { value: "total_minutes", label: "Most Active House — Total minutes" },
  { value: "average_minutes_per_student", label: "Average minutes per student" },
  { value: "participation_rate", label: "Participation rate (% active)" },
  { value: "average_streak", label: "Average streak per member" },
  { value: "challenge_completions", label: "Total challenge completions" },
  { value: "challenge_completion_rate", label: "Challenge completion rate" },
  { value: "unique_active_students", label: "Unique active students" },
  { value: "weekly_growth", label: "Most improved — Weekly growth" },
] as const;

export const PARTICIPATION_OPTIONS = [
  { value: "solo", label: "Solo" },
  { value: "with_others", label: "With Others" },
] as const;

const CORE_ACTIVITY_LABELS: Record<string, string> = {
  walking: "Walking",
  running: "Running",
  cycling: "Cycling",
  team_sports: "Team Sports",
  vr_gaming: "VR Gaming",
};

const ACTIVITY_OPTION_LABELS: Record<string, string> = {
  ...CORE_ACTIVITY_LABELS,
  ...ACTIVITY_TYPES,
};

export const ACTIVITY_OPTIONS = Object.entries(ACTIVITY_OPTION_LABELS);

export type CriteriaType = (typeof CRITERIA_TYPE_OPTIONS)[number]["value"];

export interface BadgeFormValues {
  name: string;
  description: string;
  icon_name: string;
  points_reward: string;
  is_active: "true" | "false";
  scope: Scope;
  criteriaType: CriteriaType;
  houseMetric: string;
  awardTopN: string;
  activeMinutesThreshold: string;
  activityType: string | null;
  customActivityName: string | null;
  durationMinutes: string | null;
  participationType: string;
  count: string | null;
  totalMinutes: string | null;
  streakDays: string | null;
  varietyCount: string | null;
  leaderboardRank: string | null;
  includesDateRange: boolean;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
}

export const CRITERIA_FIELD_DEFAULTS: Record<CriteriaType, Partial<BadgeFormValues>> = {
  specific_activity: {
    activityType: "walking",
    durationMinutes: "30",
  },
  social_activity: {
    participationType: "with_others",
    durationMinutes: "20",
  },
  time_in_nature: {
    durationMinutes: "60",
  },
  walk_and_talk: {
    activityType: "walking",
    participationType: "with_others",
    durationMinutes: "30",
  },
  entry_count: {
    count: "5",
  },
  total_time: {
    totalMinutes: "120",
  },
  streak: {
    streakDays: "5",
  },
  activity_variety: {
    varietyCount: "5",
  },
  first_challenge: {},
  leaderboard_entry: {
    leaderboardRank: "10",
  },
};

export const CRITERIA_STRING_FIELDS: Array<keyof BadgeFormValues> = [
  "activityType",
  "customActivityName",
  "durationMinutes",
  "participationType",
  "count",
  "totalMinutes",
  "streakDays",
  "varietyCount",
  "leaderboardRank",
  "dateRangeStart",
  "dateRangeEnd",
];

export const parseBadgeNumberField = (value: unknown) => {
  if (value === "" || value === null || typeof value === "undefined") {
    return undefined;
  }
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return undefined;
  }
  return numberValue;
};

const badgeNumberStringSchema = (minValue = 1) =>
  string()
    .nullable()
    .transform((value: string | null | undefined) => {
      if (value === "" || typeof value === "undefined") {
        return null;
      }
      return value;
    })
    .default(null)
    .test("is-number", "Enter a valid number", (value) => {
      if (value === null) {
        return true;
      }
      return !Number.isNaN(Number(value));
    })
    .test("min", `Enter a value of at least ${minValue}`, (value) => {
      if (value === null) {
        return true;
      }
      return Number(value) >= minValue;
    });

export const badgeFormValidationSchema = object().shape({
  name: string().required("Badge name is required"),
  description: string().required("Badge description is required"),
  icon_name: string().required("Icon name is required"),
  points_reward: string()
    .transform((value) => value ?? "0")
    .required("Points reward is required")
    .test("is-number", "Enter a valid number", (value) => !Number.isNaN(Number(value)))
    .test("non-negative", "Points must be 0 or greater", (value) => Number(value ?? 0) >= 0),
  is_active: string().oneOf(["true", "false"]).required(),
  scope: string()
    .oneOf(SCOPE_OPTIONS.map((o) => o.value))
    .required("Select a badge scope"),
  criteriaType: mixed<CriteriaType>()
    .oneOf(CRITERIA_TYPE_OPTIONS.map((option) => option.value))
    .when("scope", {
      is: "house" as Scope,
      then: (schema) => schema.optional(),
      otherwise: (schema) => schema.required("Select a criteria type"),
    }),
  houseMetric: string().when("scope", {
    is: "house" as Scope,
    then: (schema) =>
      schema
        .oneOf(HOUSE_CHALLENGE_METRICS.map((m) => m.value))
        .required("Select a house challenge metric"),
    otherwise: (schema) => schema.optional(),
  }),
  awardTopN: badgeNumberStringSchema().when("scope", {
    is: "house" as Scope,
    then: (schema) => schema.required("Enter number of houses to award"),
    otherwise: (schema) => schema.optional(),
  }),
  activeMinutesThreshold: badgeNumberStringSchema().when(["scope", "houseMetric"], {
    is: (scope: Scope, houseMetric: string) =>
      scope === "house" && houseMetric === "participation_rate",
    then: (schema) => schema.required("Enter minimum active minutes"),
    otherwise: (schema) => schema.optional(),
  }),
  activityType: string()
    .nullable()
    .default(null)
    .when("criteriaType", {
      is: (criteriaType: CriteriaType) =>
        ["specific_activity", "walk_and_talk"].includes(criteriaType),
      then: (schema) => schema.required("Select an activity type"),
      otherwise: (schema) => schema.optional(),
    }),
  durationMinutes: badgeNumberStringSchema().when("criteriaType", {
    is: (criteriaType: CriteriaType) =>
      ["specific_activity", "social_activity", "time_in_nature", "walk_and_talk"].includes(
        criteriaType,
      ),
    then: (schema) => schema.required("Enter duration in minutes"),
    otherwise: (schema) => schema.optional(),
  }),
  participationType: string()
    .default("")
    .when("criteriaType", {
      is: (criteriaType: CriteriaType) =>
        ["social_activity", "walk_and_talk"].includes(criteriaType),
      then: (schema) =>
        schema
          .oneOf(PARTICIPATION_OPTIONS.map((option) => option.value))
          .required("Select participation type"),
      otherwise: (schema) =>
        schema.oneOf(["", ...PARTICIPATION_OPTIONS.map((option) => option.value)]),
    }),
  count: badgeNumberStringSchema().when("criteriaType", {
    is: (criteriaType: CriteriaType) => ["entry_count", "activity_variety"].includes(criteriaType),
    then: (schema) => schema.required("Enter a number"),
    otherwise: (schema) => schema.optional(),
  }),
  totalMinutes: badgeNumberStringSchema().when("criteriaType", {
    is: (criteriaType: CriteriaType) => criteriaType === "total_time",
    then: (schema) => schema.required("Enter total minutes"),
    otherwise: (schema) => schema.optional(),
  }),
  streakDays: badgeNumberStringSchema().when("criteriaType", {
    is: (criteriaType: CriteriaType) => criteriaType === "streak",
    then: (schema) => schema.required("Enter streak length"),
    otherwise: (schema) => schema.optional(),
  }),
  varietyCount: badgeNumberStringSchema().when("criteriaType", {
    is: (criteriaType: CriteriaType) => criteriaType === "activity_variety",
    then: (schema) => schema.required("Enter number of activity types"),
    otherwise: (schema) => schema.optional(),
  }),
  leaderboardRank: badgeNumberStringSchema().when("criteriaType", {
    is: (criteriaType: CriteriaType) => criteriaType === "leaderboard_entry",
    then: (schema) => schema.required("Enter number of top positions"),
    otherwise: (schema) => schema.optional(),
  }),
  includesDateRange: boolean().default(false),
  dateRangeStart: string()
    .nullable()
    .default(null)
    .when("includesDateRange", {
      is: true,
      then: (schema) => schema.required("Start date is required"),
      otherwise: (schema) => schema.optional(),
    }),
  dateRangeEnd: string()
    .nullable()
    .default(null)
    .when("includesDateRange", {
      is: true,
      then: (schema) =>
        schema
          .required("End date is required")
          .test("end-after-start", "End date must be on or after start date", function (value) {
            const { dateRangeStart } = this.parent as BadgeFormValues;
            if (!value || !dateRangeStart) {
              return true;
            }
            return new Date(value) >= new Date(dateRangeStart);
          }),
      otherwise: (schema) => schema.optional(),
    }),
}) as unknown as ObjectSchema<BadgeFormValues>;

const defaultCriteria = {
  type: "specific_activity",
  activity_type: "walking",
  duration_minutes: 30,
};

const ensureStringValue = (value?: string | number | null) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
};

export const getActivityLabel = (activityType?: string) => {
  if (!activityType) {
    return "the activity";
  }

  const label = ACTIVITY_OPTION_LABELS[activityType];
  if (label) {
    return label;
  }

  return activityType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const getInitialBadgeFormValues = (badge: AchievementInterface | null): BadgeFormValues => {
  const rawCriteria: any =
    badge?.criteria && typeof badge.criteria === "object" ? badge.criteria : defaultCriteria;
  const criteriaType = (rawCriteria?.type as CriteriaType) || "specific_activity";
  const scope: Scope = (badge?.scope as Scope) || "student";

  const baseValues: BadgeFormValues = {
    name: badge?.name || "",
    description: badge?.description || "",
    icon_name: badge?.icon_name || "award",
    points_reward: String(badge?.points_reward ?? 10),
    is_active: (badge?.is_active ?? true) ? "true" : "false",
    scope,
    criteriaType,
    houseMetric: (rawCriteria?.metric as string) || "total_minutes",
    awardTopN: ensureStringValue(
      rawCriteria?.award_config?.award_top_n || rawCriteria?.award_top_n || 1,
    ),
    activeMinutesThreshold: ensureStringValue(
      rawCriteria?.award_config?.active_definition?.min_total_minutes ||
        rawCriteria?.active_minutes_threshold ||
        30,
    ),
    activityType: "",
    customActivityName: "",
    durationMinutes: "",
    participationType: "",
    count: "",
    totalMinutes: "",
    streakDays: "",
    varietyCount: "",
    leaderboardRank: "",
    includesDateRange: Boolean(rawCriteria?.date_range),
    dateRangeStart: (rawCriteria?.date_range as Record<string, string> | undefined)?.start || "",
    dateRangeEnd: (rawCriteria?.date_range as Record<string, string> | undefined)?.end || "",
  };

  switch (criteriaType) {
    case "specific_activity":
      baseValues.activityType =
        rawCriteria?.activity_type &&
        ACTIVITY_OPTION_LABELS[rawCriteria.activity_type as string] === undefined
          ? "something_else"
          : (rawCriteria?.activity_type as string) || "walking";
      if (baseValues.activityType === "something_else") {
        baseValues.customActivityName = (rawCriteria?.activity_type as string) || "";
      }
      baseValues.durationMinutes = ensureStringValue(rawCriteria?.duration_minutes);
      break;
    case "social_activity":
      baseValues.participationType = rawCriteria?.participation_type || "with_others";
      baseValues.durationMinutes = ensureStringValue(rawCriteria?.duration_minutes);
      break;
    case "time_in_nature":
      baseValues.durationMinutes = ensureStringValue(rawCriteria?.duration_minutes);
      break;
    case "walk_and_talk":
      baseValues.activityType =
        rawCriteria?.activity_type &&
        ACTIVITY_OPTION_LABELS[rawCriteria.activity_type as string] === undefined
          ? "something_else"
          : (rawCriteria?.activity_type as string) || "walking";
      if (baseValues.activityType === "something_else") {
        baseValues.customActivityName = (rawCriteria?.activity_type as string) || "";
      }
      baseValues.participationType = rawCriteria?.participation_type || "with_others";
      baseValues.durationMinutes = ensureStringValue(rawCriteria?.duration_minutes);
      break;
    case "entry_count":
      baseValues.count = ensureStringValue(rawCriteria?.count);
      break;
    case "total_time":
      baseValues.totalMinutes = ensureStringValue(rawCriteria?.minutes);
      break;
    case "streak":
      baseValues.streakDays = ensureStringValue(rawCriteria?.days);
      break;
    case "activity_variety":
      baseValues.varietyCount = ensureStringValue(rawCriteria?.count);
      break;
    case "first_challenge":
      break;
    case "leaderboard_entry":
      baseValues.leaderboardRank = ensureStringValue(rawCriteria?.rank || 10);
      break;
    default:
      break;
  }

  if (!baseValues.activityType && ["specific_activity", "walk_and_talk"].includes(criteriaType)) {
    baseValues.activityType = "walking";
  }

  if (
    !baseValues.participationType &&
    ["social_activity", "walk_and_talk"].includes(criteriaType)
  ) {
    baseValues.participationType = "with_others";
  }

  return baseValues;
};

export const buildBadgeCriteriaFromValues = (values: BadgeFormValues) => {
  const criteria: Record<string, unknown> = {
    type: values.criteriaType,
  };

  if (values.scope === "house") {
    criteria.metric = values.houseMetric;
    criteria.award_config = {
      winner_rule: "highest_total" as const,
      award_top_n: parseBadgeNumberField(values.awardTopN) ?? 1,
      ...(values.houseMetric === "participation_rate"
        ? {
            active_definition: {
              min_total_minutes: parseBadgeNumberField(values.activeMinutesThreshold) ?? 30,
            },
          }
        : {}),
      ...(values.houseMetric === "average_streak" ? { min_minutes_per_streak_day: 1 } : {}),
    };

    if (values.includesDateRange && values.dateRangeStart && values.dateRangeEnd) {
      criteria.date_range = {
        start: values.dateRangeStart,
        end: values.dateRangeEnd,
      };
    }

    return criteria;
  }

  switch (values.criteriaType) {
    case "specific_activity":
      criteria.activity_type =
        values.activityType === "something_else" && values.customActivityName
          ? values.customActivityName
          : values.activityType;
      criteria.duration_minutes = parseBadgeNumberField(values.durationMinutes) ?? 0;
      break;
    case "social_activity":
      criteria.participation_type = values.participationType;
      criteria.duration_minutes = parseBadgeNumberField(values.durationMinutes) ?? 0;
      break;
    case "time_in_nature":
      criteria.duration_minutes = parseBadgeNumberField(values.durationMinutes) ?? 0;
      break;
    case "walk_and_talk":
      criteria.activity_type =
        values.activityType === "something_else" && values.customActivityName
          ? values.customActivityName
          : values.activityType;
      criteria.participation_type = values.participationType;
      criteria.duration_minutes = parseBadgeNumberField(values.durationMinutes) ?? 0;
      break;
    case "entry_count":
      criteria.count = parseBadgeNumberField(values.count) ?? 0;
      break;
    case "total_time":
      criteria.minutes = parseBadgeNumberField(values.totalMinutes) ?? 0;
      break;
    case "streak":
      criteria.days = parseBadgeNumberField(values.streakDays) ?? 0;
      break;
    case "activity_variety":
      criteria.count = parseBadgeNumberField(values.varietyCount || values.count) ?? 0;
      break;
    case "first_challenge":
      break;
    case "leaderboard_entry":
      criteria.rank = parseBadgeNumberField(values.leaderboardRank) ?? 10;
      break;
    default:
      break;
  }

  if (values.includesDateRange && values.dateRangeStart && values.dateRangeEnd) {
    criteria.date_range = {
      start: values.dateRangeStart,
      end: values.dateRangeEnd,
    };
  }

  return criteria;
};

export const getBadgeCriteriaSummary = (values: BadgeFormValues) => {
  let summary: string;

  if (values.scope === "house") {
    const metricLabel =
      HOUSE_CHALLENGE_METRICS.find((m) => m.value === values.houseMetric)?.label ||
      values.houseMetric;
    summary = `House Challenge — ${metricLabel} (award top ${values.awardTopN || "1"} house${values.awardTopN && values.awardTopN !== "1" ? "s" : ""})`;
  } else {
    switch (values.criteriaType) {
      case "specific_activity":
        summary = `${values.durationMinutes || "0"} minutes of ${getActivityLabel(values.activityType === "something_else" ? (values.customActivityName ?? undefined) : (values.activityType ?? undefined))}`;
        break;
      case "social_activity":
        summary = `${values.durationMinutes || "0"} minutes being active ${values.participationType === "with_others" ? "with others" : "solo"}`;
        break;
      case "time_in_nature":
        summary = `${values.durationMinutes || "0"} minutes spent in nature-based activities`;
        break;
      case "walk_and_talk":
        summary = `${values.durationMinutes || "0"} minutes of ${getActivityLabel(values.activityType === "something_else" ? (values.customActivityName ?? undefined) : (values.activityType ?? undefined))} ${values.participationType === "with_others" ? "with others" : "solo"}`;
        break;
      case "entry_count":
        summary = `Log ${values.count || "0"} activities`;
        break;
      case "total_time":
        summary = `Accumulate ${values.totalMinutes || "0"} total activity minutes`;
        break;
      case "streak":
        summary = `Maintain a ${values.streakDays || "0"} day activity streak`;
        break;
      case "activity_variety":
        summary = `Participate in ${values.varietyCount || values.count || "0"} different activity types`;
        break;
      case "first_challenge":
        summary = "Complete your first challenge activity";
        break;
      case "leaderboard_entry":
        summary = `Reach the top ${values.leaderboardRank || "10"} on the activity leaderboard through earned points`;
        break;
      default:
        summary = "Configure the achievement criteria";
    }
  }

  if (values.includesDateRange && values.dateRangeStart && values.dateRangeEnd) {
    summary += ` between ${values.dateRangeStart} and ${values.dateRangeEnd}`;
  }

  return summary;
};
