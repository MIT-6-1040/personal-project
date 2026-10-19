import { expect, test } from "bun:test";
import { FeedCuratingConcept } from "../../src/concepts/FeedCurating.ts";
import { testDb } from "../testDb.ts";

const feeds = new FeedCuratingConcept(testDb());

const candidates = [
  { story: "climate", topics: ["Climate change"], publishedAt: new Date("2026-10-11") },
  { story: "barca", topics: ["FC Barcelona matches", "Champions League"], publishedAt: new Date("2026-10-10") },
  { story: "old-barca", topics: ["FC Barcelona matches"], publishedAt: new Date("2026-10-01") },
  { story: "cars", topics: ["Electric vehicles"], publishedAt: new Date("2026-10-12") },
];

test("principle: stories matching the user's interests come first, read ones are left out", async () => {
  const result = await feeds.generate({
    user: "alex",
    candidates,
    weights: [
      { topic: "FC Barcelona matches", count: 8 },
      { topic: "Champions League", count: 2 },
    ],
    excluded: ["old-barca"],
  });
  expect(result).toEqual({ size: 3 });
  // barca scores 8 + 2. The rest score 0, so they go newest first.
  expect(await feeds._feed({ user: "alex" })).toEqual([
    { story: "barca", score: 10 },
    { story: "cars", score: 0 },
    { story: "climate", score: 0 },
  ]);
});

test("the feed comes in pages in ranked order", async () => {
  await feeds.generate({ user: "kim", candidates, weights: [{ topic: "FC Barcelona matches", count: 1 }], excluded: [] });
  // barca and old-barca score 1, then cars and climate score 0, newest first within a score.
  expect(await feeds._page({ user: "kim", offset: 0, limit: 2 })).toEqual([
    { story: "barca", score: 1 },
    { story: "old-barca", score: 1 },
  ]);
  expect(await feeds._page({ user: "kim", offset: 2, limit: 2 })).toEqual([
    { story: "cars", score: 0 },
    { story: "climate", score: 0 },
  ]);
  expect(await feeds._page({ user: "kim", offset: 4, limit: 2 })).toEqual([]);
  expect(await feeds._page({ user: "kim", offset: 0, limit: 0 })).toEqual([]);
  expect(await feeds._page({ user: "nobody", offset: 0, limit: 10 })).toEqual([]);
});

test("generating again replaces the old feed", async () => {
  await feeds.generate({ user: "sam", candidates, weights: [], excluded: [] });
  await feeds.generate({ user: "sam", candidates, weights: [{ topic: "Climate change", count: 1 }], excluded: ["cars", "barca", "old-barca"] });
  expect(await feeds._feed({ user: "sam" })).toEqual([{ story: "climate", score: 1 }]);
  expect(await feeds._feed({ user: "nobody" })).toEqual([]);
});
