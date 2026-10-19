import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { CatchUpWireHttp } from "../../generated/wire.ts";

// The typed client knows every endpoint, so a typo in a name or field fails to compile.
export const api = createHttpClient<CatchUpWireHttp>({ baseUrl: "/api" });

export type FeedStory = CatchUpWireHttp["/feed"]["output"]["feed"][number];
export type ReadStory = CatchUpWireHttp["/history"]["output"]["history"][number];
export type ExpandedStory = CatchUpWireHttp["/stories/read"]["output"]["story"];
export type Interest = CatchUpWireHttp["/interests/list"]["output"]["interests"][number];

// The backend answers with an error code. These are what the user sees instead.
const messages: Record<string, string> = {
  INVALID_REQUEST: "Please check what you typed and try again.",
  INVALID_INPUT: "Please check what you typed and try again.",
  CONFLICT: "That already exists.",
  UNAUTHORIZED: "You are not signed in.",
  // The page's address isn't the one the backend expects (PUBLIC_ORIGIN).
  FORBIDDEN: "CatchUp can't sign you in from this address. Open the app at its usual address and try again.",
  NOT_FOUND: "We couldn't find that.",
  UNAVAILABLE: "CatchUp can't reach the server right now.",
};

export function errorMessage(error: string, overrides: Record<string, string> = {}) {
  return overrides[error] ?? messages[error] ?? "Something went wrong. Please try again.";
}

export function timeAgo(when: string) {
  const hours = Math.round((Date.now() - new Date(when).getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
