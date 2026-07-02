import { object, string, date, number } from "yup";
import { subDays, startOfDay } from "date-fns";
import {
  MAX_ACTIVITY_DURATION_MINUTES,
  MAX_ACTIVITY_DAYS_AGO,
  MAX_ACTIVITIES_PER_DAY,
} from "@/models/activities/constants/activityValidationConstants";

const ACTIVITY_LIMIT_ERROR = `Something isn't right. Please ensure your activity is less than ${MAX_ACTIVITY_DURATION_MINUTES} minutes, within the last ${MAX_ACTIVITY_DAYS_AGO} days, and that you haven't exceeded ${MAX_ACTIVITIES_PER_DAY} logs for the day.`;

export const logActivitySchema = object().shape({
  activity_type: string().required("Select an activity type"),
  activity_date: date()
    .min(startOfDay(subDays(new Date(), MAX_ACTIVITY_DAYS_AGO)), ACTIVITY_LIMIT_ERROR)
    .max(new Date(), "Cannot log activities for future dates")
    .required("Select activity date"),
  duration_minutes: number()
    .min(1, "Duration must be at least 1 minute")
    .max(MAX_ACTIVITY_DURATION_MINUTES, ACTIVITY_LIMIT_ERROR)
    .required("Enter duration in minutes"),
  feeling: string().required("Select how you felt"),
  participation_type: string().required("Select participation type"),
  description: string(),
  event_id: string().nullable(),
  custom_activity_name: string()
    .trim()
    .when("activity_type", {
      is: "something_else",
      then: (schema) =>
        schema.required("Describe your activity").min(2, "Enter at least 2 characters"),
      otherwise: (schema) => schema.notRequired().nullable(),
    }),
});
