import { httpPolicy } from "@mit-sdg/sync-engine-http/policy";

// The address the browser uses. The frontend passes /api requests on to the
// backend, so this is the frontend's address.
export const publicOrigin = process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:5173";

export const policy = httpPolicy({
  publicOrigin,
  basePath: "/api",
  // What the browser sees when a concept refuses. Anything not listed is INTERNAL_ERROR.
  publicErrors: {
    INVALID_USERNAME: "INVALID_REQUEST",
    WEAK_PASSWORD: "INVALID_REQUEST",
    USERNAME_TAKEN: "CONFLICT",
    INVALID_CREDENTIALS: "UNAUTHORIZED",
    UNKNOWN_SESSION: "UNAUTHORIZED",
    INVALID_TOPIC: "INVALID_REQUEST",
    INVALID_COUNT: "INVALID_REQUEST",
    TOPIC_ALREADY_ADDED: "CONFLICT",
    TOPIC_NOT_FOUND: "NOT_FOUND",
    STORY_NOT_FOUND: "NOT_FOUND",
    UNKNOWN_ATTEMPT: "UNAUTHORIZED",
    COMMONS_REFUSED: "UNAUTHORIZED",
    INVALID_PERSON: "UNAUTHORIZED",
  },
  // The session lives in a cookie: set when signing in, cleared when signing out.
  cookies: {
    session: {
      name: "catchup-session",
      input: "session",
      issue: [
        { path: "/auth/register", value: "session", expires: "expiresAt" },
        { path: "/auth/sign-in", value: "session", expires: "expiresAt" },
        { path: "/auth/commons/finish", value: "session", expires: "expiresAt" },
      ],
      clear: ["/auth/sign-out"],
    },
    // Ties a Commons sign-in to the browser that started it, so a code sent to
    // someone else's browser can't sign them in to the wrong account.
    commonsAttempt: {
      name: "catchup-commons",
      input: "attempt",
      issue: [{ path: "/auth/commons/start", value: "attempt", expires: "attemptExpiresAt" }],
      clear: ["/auth/commons/finish"],
    },
  },
});
