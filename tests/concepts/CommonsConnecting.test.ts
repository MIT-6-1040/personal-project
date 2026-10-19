import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { CommonsConnectingConcept, CommonsRefused, UnknownAttempt } from "../../src/concepts/CommonsConnecting.ts";
import { testDb } from "../testDb.ts";

// A stand-in for Commons' redeem endpoint. It accepts one code, issued for one
// challenge, the way the real one does, and remembers what it was sent.
const sent: { code: string; app: string; code_verifier: string }[] = [];
let issued: { code: string; challenge: string } | null = null;

const fakeCommons = (async (_url: string | URL | Request, init?: RequestInit) => {
  const body = JSON.parse(String(init?.body));
  sent.push(body);
  const challenge = createHash("sha256").update(body.code_verifier).digest("base64url");
  if (issued && body.code === issued.code && challenge === issued.challenge) {
    issued = null;
    return Response.json({ user: "commons-alex", username: "alex", displayName: "Alex Kim", email: "alex@mit.edu" });
  }
  return Response.json({ error: "CONNECT_CODE_INVALID" }, { status: 400 });
}) as typeof fetch;

let now = new Date("2026-10-19T12:00:00Z");
const connecting = new CommonsConnectingConcept(testDb(), {
  app: "https://catchup.mit-sdg.dev",
  commons: "https://class.mit-sdg.dev",
  fetch: fakeCommons,
  clock: () => now,
});

// What Commons does when the person approves: issue a code for the attempt's challenge.
function approve(url: string, code: string) {
  const params = new URL(url).searchParams;
  issued = { code, challenge: params.get("code_challenge")! };
  return params.get("state")!;
}

test("principle: a sign-in begun here is finished once with Commons' code", async () => {
  const { attempt, url, expiresAt } = await connecting.begin({});
  const address = new URL(url);
  expect(address.origin + address.pathname).toBe("https://class.mit-sdg.dev/connect");
  expect(address.searchParams.get("app")).toBe("https://catchup.mit-sdg.dev");
  expect(address.searchParams.get("code_challenge_method")).toBe("S256");
  expect(address.searchParams.get("code_challenge")).toHaveLength(43);
  expect(expiresAt).toEqual(new Date("2026-10-19T12:10:00Z"));
  expect(await connecting._pending({ attempt })).toEqual([{ expiresAt }]);

  const state = approve(url, "code-1");
  expect(await connecting.complete({ attempt, state, code: "code-1" })).toEqual({
    person: "commons-alex",
    username: "alex",
    displayName: "Alex Kim",
    email: "alex@mit.edu",
  });
  // The verifier only leaves the server now, and it matches the challenge sent earlier.
  expect(sent.at(-1)!.app).toBe("https://catchup.mit-sdg.dev");
  expect(createHash("sha256").update(sent.at(-1)!.code_verifier).digest("base64url")).toBe(
    address.searchParams.get("code_challenge")!,
  );

  // The attempt is used up.
  expect(await connecting._pending({ attempt })).toEqual([]);
  await expect(connecting.complete({ attempt, state, code: "code-1" })).rejects.toThrow(UnknownAttempt);
});

test("every sign-in gets its own state and challenge", async () => {
  const first = new URL((await connecting.begin({})).url).searchParams;
  const second = new URL((await connecting.begin({})).url).searchParams;
  expect(first.get("state")).not.toBe(second.get("state"));
  expect(first.get("code_challenge")).not.toBe(second.get("code_challenge"));
});

test("a wrong state, an unknown attempt, or an expired one is refused without asking Commons", async () => {
  const { attempt, url } = await connecting.begin({});
  const state = approve(url, "code-2");
  const before = sent.length;

  await expect(connecting.complete({ attempt, state: "someone-elses-state", code: "code-2" })).rejects.toThrow(
    UnknownAttempt,
  );
  await expect(connecting.complete({ attempt: "made-up", state, code: "code-2" })).rejects.toThrow(UnknownAttempt);
  expect(sent.length).toBe(before);
  // A refused completion leaves the attempt in place.
  expect(await connecting._pending({ attempt })).toHaveLength(1);

  now = new Date("2026-10-19T12:30:00Z");
  await expect(connecting.complete({ attempt, state, code: "code-2" })).rejects.toThrow(UnknownAttempt);
  expect(await connecting._pending({ attempt })).toEqual([]);
});

test("a code Commons doesn't accept is refused and the attempt is kept", async () => {
  const { attempt, url } = await connecting.begin({});
  const state = approve(url, "real-code");
  await expect(connecting.complete({ attempt, state, code: "wrong-code" })).rejects.toThrow(CommonsRefused);
  expect(await connecting._pending({ attempt })).toHaveLength(1);
});
