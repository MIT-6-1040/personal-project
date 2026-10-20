import { expect, test } from "bun:test";
import {
  DuplicateArticle,
  InvalidHeadline,
  InvalidSummary,
  InvalidTopics,
  StoryGroupingConcept,
  StoryNotFound,
} from "../../src/concepts/StoryGrouping.ts";
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
  // The refused duplicate added nothing.
  expect(await grouping._articles({ story: bbc.story })).toHaveLength(2);
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
  const { catalog } = await grouping._catalog({ search: "", source: "" });
  expect(catalog.find((c) => c.story === climate.story)?.topics).toEqual(["Climate change"]);
});

test("the catalog can be narrowed by search words and by source", async () => {
  const sun = await grouping.addArticle({
    key: "solar-record",
    headline: "Solar power sets a record",
    summary: "Panels in Spain produced more power than ever (a new high).",
    image: "",
    topics: ["Energy"],
    source: "The Guardian",
    title: "Solar record",
    url: "https://guardian.example/solar",
    publishedAt: new Date("2026-10-12T09:00:00Z"),
  });
  const stories = async (search: string, source: string) =>
    (await grouping._catalog({ search, source })).catalog.map((c) => c.story);
  expect(await stories("SOLAR", "")).toEqual([sun.story]);
  expect(await stories("spain record", "")).toEqual([sun.story]);
  expect(await stories("spain barcelona", "")).toEqual([]);
  expect(await stories("(a new", "")).toEqual([sun.story]);
  expect(await stories("", "The Guardian")).toEqual([sun.story]);
  expect(await stories("solar", "BBC")).toEqual([]);
  expect((await grouping._sources({})).map((s) => s.source)).toContain("The Guardian");
});

test("revise rewrites the summary and topics but keeps the headline and image", async () => {
  const story = (await grouping._stories({})).find((s) => s.headline === barca.headline)!.story;
  expect(
    await grouping.revise({
      story,
      summary: "Barcelona beat Napoli 3-1 at home. ESPN adds that the young attack shone.",
      topics: ["FC Barcelona matches", "Champions League", "Lamine Yamal"],
    }),
  ).toEqual({ story });
  const [after] = await grouping._get({ story });
  expect(after!.summary).toContain("young attack");
  expect(after!.headline).toBe(barca.headline);
  expect(after!.image).toBe(barca.image);
  expect((await grouping._topics({ story })).map((t) => t.topic)).toEqual([
    "Champions League",
    "FC Barcelona matches",
    "Lamine Yamal",
  ]);
});

test("revise refuses an unknown story, a long summary, or bad topics, and changes nothing", async () => {
  const story = (await grouping._stories({})).find((s) => s.headline === barca.headline)!.story;
  const [before] = await grouping._get({ story });
  const topicsBefore = await grouping._topics({ story });

  await expect(grouping.revise({ story: "nope", summary: "Fine.", topics: ["Football"] })).rejects.toThrow(StoryNotFound);
  await expect(grouping.revise({ story, summary: "word ".repeat(61), topics: ["Football"] })).rejects.toThrow(
    InvalidSummary,
  );
  await expect(grouping.revise({ story, summary: "x".repeat(401), topics: ["Football"] })).rejects.toThrow(InvalidSummary);
  await expect(grouping.revise({ story, summary: "Fine.", topics: [] })).rejects.toThrow(InvalidTopics);
  await expect(grouping.revise({ story, summary: "Fine.", topics: ["a", "b", "c", "d", "e", "f"] })).rejects.toThrow(
    InvalidTopics,
  );

  expect(await grouping._get({ story })).toEqual([before!]);
  expect(await grouping._topics({ story })).toEqual(topicsBefore);
});

test("addArticle refuses a bad headline, summary, or topics, and adds nothing", async () => {
  const article = {
    key: "refused-story",
    headline: "A fine headline",
    summary: "A fine summary.",
    image: "",
    topics: ["Some topic"],
    source: "BBC",
    title: "Refused",
    url: "https://bbc.example/refused",
    publishedAt: new Date("2026-10-13T09:00:00Z"),
  };
  const storiesBefore = (await grouping._stories({})).length;

  await expect(grouping.addArticle({ ...article, headline: " " })).rejects.toThrow(InvalidHeadline);
  await expect(grouping.addArticle({ ...article, headline: "h".repeat(101) })).rejects.toThrow(InvalidHeadline);
  await expect(grouping.addArticle({ ...article, summary: "" })).rejects.toThrow(InvalidSummary);
  await expect(grouping.addArticle({ ...article, topics: [] })).rejects.toThrow(InvalidTopics);
  await expect(grouping.addArticle({ ...article, topics: ["ok", " "] })).rejects.toThrow(InvalidTopics);

  expect(await grouping._stories({})).toHaveLength(storiesBefore);
  expect(await grouping._hasArticle({ url: article.url })).toEqual({ added: false });
});

test("a story keeps the first image it gets, even from a later article", async () => {
  const first = {
    key: "no-image-yet",
    headline: "A story whose first article has no picture",
    summary: "The first outlet sent no image.",
    topics: ["Pictures"],
    title: "No picture",
    publishedAt: new Date("2026-10-14T09:00:00Z"),
  };
  const { story } = await grouping.addArticle({ ...first, image: "", source: "NPR", url: "https://npr.example/a" });
  expect((await grouping._get({ story }))[0]!.image).toBe("");

  await grouping.addArticle({ ...first, image: "https://img.example/second.jpg", source: "BBC", url: "https://bbc.example/b" });
  await grouping.addArticle({ ...first, image: "https://img.example/third.jpg", source: "ESPN", url: "https://espn.example/c" });
  expect((await grouping._get({ story }))[0]!.image).toBe("https://img.example/second.jpg");
});

test("an unknown story has no rows", async () => {
  expect(await grouping._get({ story: "nope" })).toEqual([]);
  expect(await grouping._articles({ story: "nope" })).toEqual([]);
  expect(await grouping._topics({ story: "nope" })).toEqual([]);
});
