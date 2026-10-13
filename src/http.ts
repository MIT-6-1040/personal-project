import { httpPolicy } from "@mit-sdg/sync-engine-http/policy";

// The address the browser uses. The frontend passes /api requests on to the
// backend, so this is the frontend's address.
const publicOrigin = process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:5173";

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
  },
  // The session lives in a cookie: set when signing in, cleared when signing out.
  cookies: {
    session: {
      name: "catchup-session",
      input: "session",
      issue: [
        { path: "/auth/register", value: "session", expires: "expiresAt" },
        { path: "/auth/sign-in", value: "session", expires: "expiresAt" },
      ],
      clear: ["/auth/sign-out"],
    },
  },
});
