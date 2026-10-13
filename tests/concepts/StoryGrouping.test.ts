import { expect, test } from "bun:test";
import { DuplicateArticle, StoryGroupingConcept } from "../../src/concepts/StoryGrouping.ts";
import { testDb } from "../testDb.ts";

const grouping = new StoryGroupingConcept(testDb());

const barca = {
  key: "barcelona-napoli-ucl",
  headline: "Barcelona win 3-1 in Champions League",
  summary: "Barcelona beat Napoli 3-1 at home.",
  image: "https://example.com/barca.jpg",
  topics: ["FC Barcelona matches", "Champions League"],
};

test("principle: articles with the same key join one story", async () => {
  const bbc = await grouping.addArticle({
    ...barca,
    source: "BBC",
    title: "Barcelona take control",
    url: "https://bbc.example/barca",
    publishedAt: new Date("2026-10-10T10:00:00Z"),
  });
  const espn = await grouping.addArticle({
    ...barca,
    source: "ESPN",
    title: "Key moments from Barcelona's win",
    url: "https://espn.example/barca",
    publishedAt: new Date("2026-10-10T12:00:00Z"),
  });
  expect(espn.story).toBe(bbc.story);

  const articles = await grouping._articles({ story: bbc.story });
  expect(articles.map((a) => a.source)).toEqual(["ESPN", "BBC"]);
  expect(await grouping._topics({ story: bbc.story })).toEqual([
    { topic: "Champions League" },
    { topic: "FC Barcelona matches" },
  ]);

  // The story's time is its newest article's time.
  const [found] = await grouping._get({ story: bbc.story });
  expect(found!.publishedAt).toEqual(new Date("2026-10-10T12:00:00Z"));

  await expect(
    grouping.addArticle({ ...barca, source: "BBC", title: "again", url: "https://bbc.example/barca", publishedAt: new Date() }),
  ).rejects.toThrow(DuplicateArticle);
});

test("a different key makes a new story, and stories list newest first", async () => {
  const climate = await grouping.addArticle({
    key: "cop-dubai",
    headline: "World leaders meet on climate action",
    summary: "Leaders met in Dubai.",
    image: "",
    topics: ["Climate change"],
    source: "Reuters",
    title: "Climate summit opens",
    url: "https://reuters.example/cop",
    publishedAt: new Date("2026-10-11T09:00:00Z"),
  });
  const stories = await grouping._stories({});
  expect(stories.map((s) => s.story)[0]).toBe(climate.story);
  expect(stories).toHaveLength(2);
  expect((await grouping._allTopics({})).map((t) => t.topic)).toEqual([
    "Champions League",
    "Climate change",
    "FC Barcelona matches",
  ]);
  const { catalog } = await grouping._catalog({});
  expect(catalog.find((c) => c.story === climate.story)?.topics).toEqual(["Climate change"]);
});

test("an unknown story has no rows", async () => {
  expect(await grouping._get({ story: "nope" })).toEqual([]);
  expect(await grouping._articles({ story: "nope" })).toEqual([]);
  expect(await grouping._topics({ story: "nope" })).toEqual([]);
});
