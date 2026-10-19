import { expect, test } from "bun:test";
import { StoryGroupingConcept } from "../../src/concepts/StoryGrouping.ts";
import type { EditorAnswer, IncomingArticle, RecentStory } from "../../src/news/editor.ts";
import { limits, runNews, type Sources } from "../../src/news/ingest.ts";
import type { FeedItem } from "../../src/news/rss.ts";
import { testDb } from "../testDb.ts";

// The pipeline with fake feeds and a fake editor, so no network or API key is needed.
const db = testDb();
const grouping = new StoryGroupingConcept(db);
const quiet = () => {};

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

function item(source: string, title: string, image: string, hours: number): FeedItem {
  const url = `https://${source.toLowerCase().replace(/\s/g, "")}.example/${title.toLowerCase().replace(/\W+/g, "-")}`;
  return { source, title, url, description: `${title}.`, image, publishedAt: hoursAgo(hours) };
}

const bbc = item("BBC Sport", "Barcelona beat Napoli", "https://img.example/bbc.jpg", 5);
const espn = item("ESPN", "Napoli lose in Barcelona", "", 4);
const climate = item("NPR", "Climate talks open in Belem", "", 3);
const tooOld = item("NPR", "Last week's news", "https://img.example/old.jpg", 100);

const barcaStory = {
  key: "barcelona-beat-napoli",
  headline: "Barcelona beat Napoli in the Champions League",
  summary: "Barcelona won 3-1 at home against Napoli.",
  topics: ["FC Barcelona matches", "Champions League", "SSC Napoli"],
};
const climateStory = {
  key: "climate-talks-belem",
  headline: "Climate talks open in Belem",
  summary: "Countries met in Brazil to discuss emission targets.",
  topics: ["UN climate talks", "Brazil", "Emission targets"],
};

// Groups by matching words in the title, the way a real editor would group by event.
function fakeEditor(seen: { recent: RecentStory[]; incoming: IncomingArticle[] }[]): Sources["edit"] {
  return async (recent, _topics, incoming): Promise<EditorAnswer> => {
    seen.push({ recent, incoming });
    const answer: EditorAnswer = { articles: [], newStories: [], revisedStories: [] };
    for (const article of incoming) {
      const existingBarca = recent.find((story) => story.headline.includes("Barcelona"));
      if (/Barcelona/.test(article.title) && existingBarca) {
        answer.articles.push({ id: article.id, story: existingBarca.key });
        if (answer.revisedStories.length === 0) {
          answer.revisedStories.push({
            key: existingBarca.key,
            summary: "Barcelona won 3-1 at home against Napoli. Their coach praised the young attack.",
            topics: [...existingBarca.topics, "Hansi Flick"],
          });
        }
      } else if (/Barcelona/.test(article.title)) {
        if (!answer.newStories.some((story) => story.key === barcaStory.key)) answer.newStories.push(barcaStory);
        answer.articles.push({ id: article.id, story: barcaStory.key });
      } else if (/Climate/.test(article.title)) {
        answer.newStories.push(climateStory);
        answer.articles.push({ id: article.id, story: climateStory.key });
      } else {
        const key = `story-${article.id}`;
        answer.newStories.push({ key, headline: article.title, summary: `${article.title}.`, topics: ["Other news"] });
        answer.articles.push({ id: article.id, story: key });
      }
    }
    return answer;
  };
}

function sources(items: FeedItem[], seen: { recent: RecentStory[]; incoming: IncomingArticle[] }[] = []): Sources {
  return {
    fetchItems: async () => items,
    edit: fakeEditor(seen),
    previewImage: async (url) => (url.includes("npr") ? "https://img.example/npr-preview.jpg" : ""),
  };
}

test("the first run groups articles into stories and skips old news", async () => {
  const report = await runNews(db, grouping, quiet, sources([bbc, espn, climate, tooOld]));
  expect(report).toEqual({ fetched: 3, added: 3, skipped: 0 });

  const stories = await grouping._stories({});
  expect(stories.map((story) => story.headline).sort()).toEqual([barcaStory.headline, climateStory.headline]);

  const barca = stories.find((story) => story.headline === barcaStory.headline)!;
  expect((await grouping._articles({ story: barca.story })).map((article) => article.source).sort()).toEqual([
    "BBC Sport",
    "ESPN",
  ]);
  // The image comes from the first article, and a story with none in its feed gets the page's preview.
  expect(barca.image).toBe("https://img.example/bbc.jpg");
  expect(stories.find((story) => story.headline === climateStory.headline)!.image).toBe(
    "https://img.example/npr-preview.jpg",
  );
  expect((await grouping._hasArticle({ url: tooOld.url })).added).toBe(false);
});

test("a later run skips articles it already has and revises a story another outlet joins", async () => {
  const seen: { recent: RecentStory[]; incoming: IncomingArticle[] }[] = [];
  const marca = item("Marca", "Barcelona's young attack shines", "https://img.example/marca.jpg", 1);
  const report = await runNews(db, grouping, quiet, sources([bbc, espn, climate, marca], seen));

  expect(report).toEqual({ fetched: 1, added: 1, skipped: 0 });
  // Only the new article went to the editor, along with the stories it could join.
  expect(seen[0]!.incoming.map((article) => article.title)).toEqual([marca.title]);
  expect(seen[0]!.recent.map((story) => story.headline)).toContain(barcaStory.headline);

  const barca = (await grouping._stories({})).find((story) => story.headline === barcaStory.headline)!;
  expect(await grouping._articles({ story: barca.story })).toHaveLength(3);
  const [details] = await grouping._get({ story: barca.story });
  expect(details!.summary).toContain("young attack");
  expect((await grouping._topics({ story: barca.story })).map((row) => row.topic)).toContain("Hansi Flick");
  // The headline and the first image stay the same.
  expect(details!.headline).toBe(barcaStory.headline);
  expect(details!.image).toBe("https://img.example/bbc.jpg");
});

test("runs after the first one add at most the per-run limit, newest first", async () => {
  const many = Array.from({ length: limits.perRun + 5 }, (_, n) => item("Sky News", `Update number ${n}`, "", 20 - n));
  const report = await runNews(db, grouping, quiet, sources(many));
  expect(report.added).toBe(limits.perRun);
  expect(report.fetched).toBe(limits.perRun + 5);
  // The newest updates were kept and the oldest ones wait for the next run.
  expect((await grouping._hasArticle({ url: many.at(-1)!.url })).added).toBe(true);
  expect((await grouping._hasArticle({ url: many[0]!.url })).added).toBe(false);
});

test("two runs at the same time don't both add news", async () => {
  const one = item("Sky News", "First of two parallel runs", "", 1);
  const two = item("Sky News", "Second of two parallel runs", "", 1);
  const reports = await Promise.all([
    runNews(db, grouping, quiet, sources([one, two])),
    runNews(db, grouping, quiet, sources([one, two])),
  ]);
  // One run did the work and the other stepped aside.
  expect(reports.map((report) => report.added).sort()).toEqual([0, 2]);
  // The lock is released afterwards, so the next run goes ahead.
  const three = item("Sky News", "A run after the parallel ones", "", 1);
  expect((await runNews(db, grouping, quiet, sources([three]))).added).toBe(1);
});

test("a batch the editor fails on is skipped and nothing from it is added", async () => {
  const late = item("Sky News", "A story the editor fails on", "", 1);
  const failing: Sources = { ...sources([late]), edit: async () => Promise.reject(new Error("editor unavailable")) };
  const report = await runNews(db, grouping, quiet, failing);
  expect(report).toEqual({ fetched: 1, added: 0, skipped: 1 });
  expect((await grouping._hasArticle({ url: late.url })).added).toBe(false);
});
