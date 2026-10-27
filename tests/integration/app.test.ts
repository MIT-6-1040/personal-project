import { beforeAll, describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { assembleApplication } from "../../src/assembly.ts";
import { StoryGroupingConcept } from "../../src/concepts/StoryGrouping.ts";
import { policy, publicOrigin } from "../../src/http.ts";
import { testDb } from "../testDb.ts";

// These tests go through the same HTTP handler the deployed app uses, so they check the
// endpoints, reactions, cookies, and error mapping together, not one concept at a time.
const db = testDb();
const application = assembleApplication(db);
const api = createHttpHandler({ application, gateway: createGateway({ application }), policy });

// A browser: it keeps the cookies the server sets and sends them back, from the app's origin.
function browser(origin = publicOrigin) {
  const cookies = new Map<string, string>();
  return {
    cookies,
    async post(path: string, body: Record<string, unknown> = {}) {
      const response = await api(
        new Request(`${publicOrigin}/api${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: origin,
            Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
          },
          body: JSON.stringify(body),
        }),
      );
      for (const header of response.headers.getSetCookie()) {
        const [pair = ""] = header.split(";");
        const [name = "", value = ""] = pair.split("=");
        if (value === "" || /Max-Age=0/i.test(header)) cookies.delete(name);
        else cookies.set(name, value);
      }
      return { status: response.status, body: (await response.json()) as any };
    },
  };
}

async function signedUp(username: string) {
  const user = browser();
  const { status } = await user.post("/auth/register", { username, password: "catchup2026" });
  expect(status).toBe(200);
  return user;
}

// Two stories that share no topics, so the feed's order shows which interest won.
let barca = "";
let opt = "";
beforeAll(async () => {
  const grouping = new StoryGroupingConcept(db);
  ({ story: barca } = await grouping.addArticle({
    key: "barca",
    headline: "Barcelona win 3-1 in Champions League",
    summary: "Barcelona beat Napoli 3-1 at home.",
    image: "",
    topics: ["FC Barcelona matches", "Champions League"],
    source: "BBC Sport",
    title: "Barcelona take control",
    url: "https://bbc.example/barca",
    publishedAt: new Date("2026-10-20T10:00:00Z"),
  }));
  ({ story: opt } = await grouping.addArticle({
    key: "opt",
    headline: "New guidance on OPT work after graduation",
    summary: "The agency clarified how long students may work on OPT.",
    image: "",
    topics: ["OPT employment rules"],
    source: "New York Times",
    title: "What OPT students need to know",
    url: "https://nyt.example/opt",
    publishedAt: new Date("2026-10-21T10:00:00Z"),
  }));
});

describe("signing in", () => {
  test("a username works in any capitalization and shows as registered", async () => {
    await signedUp("Desire");
    const other = browser();
    const signIn = await other.post("/auth/sign-in", { username: "desire", password: "catchup2026" });
    expect(signIn).toEqual({ status: 200, body: { username: "Desire" } });
    expect((await other.post("/auth/me")).body).toEqual({ username: "Desire" });
    // A second account that differs only in capitalization is refused.
    const copy = await browser().post("/auth/register", { username: "DESIRE", password: "another-pass" });
    expect(copy).toEqual({ status: 409, body: { error: "CONFLICT" } });
  });

  test("a wrong password or unknown user is refused and gets no session", async () => {
    await signedUp("wrongpass");
    for (const username of ["wrongpass", "nobody-here"]) {
      const user = browser();
      const result = await user.post("/auth/sign-in", { username, password: "not-the-password" });
      expect(result).toEqual({ status: 401, body: { error: "UNAUTHORIZED" } });
      expect(user.cookies.size).toBe(0);
    }
  });

  test("signing out ends the session for good", async () => {
    const user = await signedUp("leaver");
    const [[name, session] = []] = [...user.cookies];
    expect((await user.post("/auth/sign-out")).status).toBe(200);
    expect((await user.post("/auth/me")).status).toBe(401);
    // Even a copy of the old cookie no longer works.
    const thief = browser();
    thief.cookies.set(name!, session!);
    expect((await thief.post("/interests/list")).status).toBe(401);
  });
});

describe("the reading loop", () => {
  test("reading a story records it, raises its topics, and takes it out of the feed", async () => {
    const alex = await signedUp("alex");
    await alex.post("/interests/add", { topic: "OPT employment rules", count: 1 });

    // OPT matches an interest, so it ranks above Barcelona.
    const before = await alex.post("/feed");
    expect(before.body.feed.map((s: any) => s.story)).toEqual([opt, barca]);

    const read = await alex.post("/stories/read", { story: barca });
    expect(read.status).toBe(200);
    expect(read.body.story.sources).toEqual([
      expect.objectContaining({ source: "BBC Sport", url: "https://bbc.example/barca" }),
    ]);

    // InterestFollowsReading added both of the story's topics.
    expect((await alex.post("/interests/list")).body.interests).toEqual(
      expect.arrayContaining([
        { topic: "OPT employment rules", count: 1 },
        { topic: "FC Barcelona matches", count: 1 },
        { topic: "Champions League", count: 1 },
      ]),
    );
    expect((await alex.post("/feed")).body.feed.map((s: any) => s.story)).toEqual([opt]);
    expect((await alex.post("/history")).body.history.map((s: any) => s.story)).toEqual([barca]);
  });

  test("opening a story again, from History, raises nothing", async () => {
    const alex = browser();
    await alex.post("/auth/sign-in", { username: "alex", password: "catchup2026" });
    const before = (await alex.post("/interests/list")).body.interests;
    expect((await alex.post("/stories/read", { story: barca })).status).toBe(200);
    expect((await alex.post("/interests/list")).body.interests).toEqual(before);
    expect((await alex.post("/history")).body.history).toHaveLength(1);
  });

  test("interests and history persist across sign-ins", async () => {
    const later = browser();
    await later.post("/auth/sign-in", { username: "ALEX", password: "catchup2026" });
    expect((await later.post("/history")).body.history.map((s: any) => s.story)).toEqual([barca]);
    expect((await later.post("/interests/list")).body.interests).toHaveLength(3);
  });
});

describe("access control", () => {
  const protectedCalls: [string, Record<string, unknown>][] = [
    ["/auth/me", {}],
    ["/auth/sign-out", {}],
    ["/feed", {}],
    ["/feed/more", { offset: 10 }],
    ["/feed/sources", {}],
    ["/history", {}],
    ["/stories/read", { story: "any" }],
    ["/topics/list", {}],
    ["/interests/list", {}],
    ["/interests/add", { topic: "Anything", count: 1 }],
    ["/interests/set-count", { topic: "Anything", count: 2 }],
    ["/interests/remove", { topic: "Anything" }],
    ["/interests/reset", {}],
  ];

  test("every endpoint except signing in refuses a visitor who isn't signed in", async () => {
    for (const [path, body] of protectedCalls) {
      const result = await browser().post(path, body);
      expect({ path, ...result }).toEqual({ path, status: 401, body: { error: "UNAUTHORIZED" } });
    }
  });

  test("a made-up session is refused, whether in the cookie or the body", async () => {
    const forger = browser();
    forger.cookies.set("__Host-catchup-session", crypto.randomUUID());
    expect((await forger.post("/interests/list")).status).toBe(401);
    // The handler only takes the session from the cookie, so one in the body is ignored.
    expect((await browser().post("/interests/list", { session: crypto.randomUUID() })).status).toBe(401);
  });

  test("one user's actions never reach another user's interests or history", async () => {
    const sam = await signedUp("sam");
    const kim = await signedUp("kim");
    await kim.post("/interests/add", { topic: "Champions League", count: 5 });

    await sam.post("/stories/read", { story: barca });
    await sam.post("/interests/reset");

    expect((await kim.post("/interests/list")).body.interests).toEqual([{ topic: "Champions League", count: 5 }]);
    expect((await kim.post("/history")).body.history).toEqual([]);
    // Sam read the Barcelona story, but it stays in Kim's feed.
    expect((await kim.post("/feed")).body.feed.map((s: any) => s.story)).toContain(barca);
  });

  test("a request from another website is refused", async () => {
    const user = await signedUp("origin-check");
    const evil = browser("https://evil.example");
    for (const [name, value] of user.cookies) evil.cookies.set(name, value);
    const result = await evil.post("/interests/reset");
    expect(result.status).toBe(403);
  });
});

describe("errors", () => {
  test("bad requests are refused with a clear code and change nothing", async () => {
    const user = await signedUp("careful");
    await user.post("/interests/add", { topic: "La Liga table", count: 2 });

    const cases: [string, Record<string, unknown>, number, string][] = [
      ["/interests/add", { topic: "La Liga table", count: 1 }, 409, "CONFLICT"],
      ["/interests/add", { topic: "   ", count: 1 }, 400, "INVALID_REQUEST"],
      ["/interests/add", { topic: "Tennis", count: -1 }, 400, "INVALID_REQUEST"],
      ["/interests/set-count", { topic: "Not mine", count: 3 }, 404, "NOT_FOUND"],
      ["/interests/remove", { topic: "Not mine" }, 404, "NOT_FOUND"],
      ["/feed/more", { offset: -5 }, 400, "INVALID_REQUEST"],
      ["/history", { offset: 1.5 }, 400, "INVALID_REQUEST"],
    ];
    // The path and request go into the comparison so a failure says which case it was.
    for (const [path, request, status, error] of cases) {
      const result = await user.post(path, request);
      expect({ path, request, ...result }).toEqual({ path, request, status, body: { error } });
    }
    expect((await user.post("/interests/list")).body.interests).toEqual([{ topic: "La Liga table", count: 2 }]);
  });

  test("opening a story that doesn't exist records nothing", async () => {
    const user = await signedUp("explorer");
    const result = await user.post("/stories/read", { story: "no-such-story" });
    expect(result).toEqual({ status: 404, body: { error: "NOT_FOUND" } });
    expect((await user.post("/history")).body.history).toEqual([]);
    expect((await user.post("/interests/list")).body.interests).toEqual([]);
  });

  test("registering with a bad username or short password is refused", async () => {
    expect((await browser().post("/auth/register", { username: "a!", password: "catchup2026" })).status).toBe(400);
    expect((await browser().post("/auth/register", { username: "shorty", password: "short" })).status).toBe(400);
    expect((await browser().post("/auth/sign-in", { username: "shorty", password: "short" })).status).toBe(401);
  });
});
