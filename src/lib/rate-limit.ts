const store = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000).unref?.();

function getKey(userId: string, fnName: string): string {
  return `${fnName}:${userId}`;
}

export interface RateLimitConfig {
  fnName: string;
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export function checkRateLimit(userId: string, config: RateLimitConfig): RateLimitResult {
  const key = getKey(userId, config.fnName);
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  entry.count += 1;

  const remaining = Math.max(0, config.max - entry.count);
  return {
    allowed: entry.count <= config.max,
    remaining,
    resetInMs: entry.resetAt - now,
  };
}

export function rateLimitExceededMessage(fnName: string, resetInMs: number): string {
  const seconds = Math.ceil(resetInMs / 1000);
  return `Rate limit exceeded for ${fnName}. Try again in ${seconds}s.`;
}

export const RATE_LIMITS = {
  sendStudentWelcomeEmail: { fnName: "sendStudentWelcomeEmail", max: 3, windowMs: 60 * 60 * 1000 },
  notifySchoolRegistrationPending: {
    fnName: "notifySchoolRegistrationPending",
    max: 3,
    windowMs: 60 * 60 * 1000,
  },
  generateBadgeImage: { fnName: "generateBadgeImage", max: 20, windowMs: 60 * 60 * 1000 },
  generateSurveyReport: { fnName: "generateSurveyReport", max: 5, windowMs: 60 * 60 * 1000 },
  scanWorkoutScreenshot: { fnName: "scanWorkoutScreenshot", max: 30, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;
