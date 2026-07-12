import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://*.posthog.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https://*.supabase.co; " +
    "connect-src 'self' https://*.supabase.co https://*.posthog.com; " +
    "font-src 'self'; " +
    "frame-src 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';",
};

const SECURITY_HEADER_KEYS = Object.keys(SECURITY_HEADERS);

function applySecurityHeaders(response: Response): Response {
  if (response.headers.get("content-type")?.includes("text/html") || response.status >= 400) {
    const headers = new Headers(response.headers);
    for (const key of SECURITY_HEADER_KEYS) {
      if (!headers.has(key)) headers.set(key, SECURITY_HEADERS[key]);
    }
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }
  return response;
}

async function healthCheck(): Promise<Response> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const payload: {
    status: "ok" | "degraded" | "error";
    supabase_ms?: number;
    error?: string;
  } = { status: "degraded" };

  if (!supabaseUrl || !supabaseKey) {
    payload.status = "degraded";
    payload.error = "Supabase config missing";
    return Response.json(payload, { status: 503 });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const start = Date.now();
    const { error } = await sb.from("schools").select("id", { count: "exact", head: true });
    payload.supabase_ms = Date.now() - start;
    if (!error) {
      payload.status = "ok";
    } else {
      payload.status = "degraded";
      payload.error = error.message;
    }
  } catch (err) {
    payload.status = "error";
    payload.error = err instanceof Error ? err.message : "Supabase unreachable";
    return Response.json(payload, { status: 503 });
  }

  return Response.json(payload, {
    status: payload.status === "ok" ? 200 : 503,
  });
}

function isHealthCheckRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.pathname === "/api/health" && request.method === "GET";
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  const error = consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`);
  console.error(error);
  captureServerError(error);
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function captureServerError(error: unknown) {
  const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  try {
    const Sentry = await import("@sentry/node");
    Sentry.captureException(error);
  } catch {
    // Sentry unavailable — silently ignore
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    if (isHealthCheckRequest(request)) {
      try {
        return await healthCheck();
      } catch {
        return Response.json({ status: "error" }, { status: 503 });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return applySecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      captureServerError(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
