import type { Db } from "mongodb";
import type { StoryGroupingConcept } from "../concepts/StoryGrouping.ts";
import { editBatch, type IncomingArticle, type RecentStory } from "./editor.ts";
import { feeds } from "./feeds.ts";
import { fetchFeed, fetchPreviewImage, type FeedItem } from "./rss.ts";

const hour = 60 * 60 * 1000;

// How much news comes in. The first run fills an empty app, then the daily cap
// keeps the cost of the editor predictable.
export const limits = {
  firstRun: 500,
  perDay: 100,
  perRun: 10,
  maxAgeHours: 72,
  batchSize: 12,
  recentStories: 150,
};

interface Run {
  at: Date;
  added: number;
  firstRun: boolean;
}

export interface RunReport {
  fetched: number;
  added: number;
  skipped: number;
}

function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// Fetches every feed at once. A feed that fails is logged and left out of this run.
async function fetchAll(log: (line: string) => void) {
  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const items: FeedItem[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") items.push(...result.value);
    else log(`Skipped ${feeds[index]!.url}: ${(result.reason as Error).message}`);
  });
  return items;
}

// Tests swap in fake feeds, a fake editor, and no preview lookups, so they don't need
// the network or an API key.
export interface Sources {
  fetchItems: (log: (line: string) => void) => Promise<FeedItem[]>;
  edit: typeof editBatch;
  previewImage: (url: string) => Promise<string>;
}

const liveSources: Sources = { fetchItems: fetchAll, edit: editBatch, previewImage: fetchPreviewImage };

// Only one run at a time, even across processes (the dev server and `bun run news`, or
// a restarted deployment). A run holds the lock for at most an hour in case it crashes.
async function takeLock(db: Db) {
  const now = new Date();
  try {
    await db
      .collection<{ _id: string; until: Date }>("news.lock")
      .updateOne({ _id: "news", until: { $lt: now } }, { $set: { until: new Date(now.getTime() + hour) } }, { upsert: true });
    return true;
  } catch (error) {
    // The lock exists and hasn't expired, so the upsert tried to insert a second one.
    if ((error as { code?: number }).code === 11000) return false;
    throw error;
  }
}

async function releaseLock(db: Db) {
  await db.collection<{ _id: string; until: Date }>("news.lock").updateOne({ _id: "news" }, { $set: { until: new Date(0) } });
}

export async function runNews(
  db: Db,
  grouping: StoryGroupingConcept,
  log: (line: string) => void = console.log,
  sources: Sources = liveSources,
): Promise<RunReport> {
  if (!(await takeLock(db))) {
    log("Another news run is in progress, so this one was skipped.");
    return { fetched: 0, added: 0, skipped: 0 };
  }
  try {
    return await runLocked(db, grouping, log, sources);
  } finally {
    await releaseLock(db);
  }
}

async function runLocked(
  db: Db,
  grouping: StoryGroupingConcept,
  log: (line: string) => void,
  sources: Sources,
): Promise<RunReport> {
  const runs = db.collection<Run>("news.runs");
  const firstRun = (await db.collection("storyGrouping.articles").estimatedDocumentCount()) === 0;

  // Articles added by hourly runs in the last 24 hours count against the daily cap.
  const [today] = await runs
    .aggregate<{ added: number }>([
      { $match: { firstRun: false, at: { $gt: new Date(Date.now() - 24 * hour) } } },
      { $group: { _id: null, added: { $sum: "$added" } } },
    ])
    .toArray();
  const budget = firstRun ? limits.firstRun : Math.min(limits.perRun, limits.perDay - (today?.added ?? 0));
  if (budget <= 0) {
    log("Daily news limit reached, so nothing was fetched.");
    return { fetched: 0, added: 0, skipped: 0 };
  }

  // Keep recent articles we don't have yet, once each, and take the newest ones that fit.
  const cutoff = Date.now() - limits.maxAgeHours * hour;
  const seen = new Set<string>();
  const fresh: FeedItem[] = [];
  for (const item of await sources.fetchItems(log)) {
    if (item.publishedAt.getTime() < cutoff || seen.has(item.url)) continue;
    seen.add(item.url);
    if (!(await grouping._hasArticle({ url: item.url })).added) fresh.push(item);
  }
  const chosen = fresh
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, budget)
    // Oldest first, so a story's first article really is the first one we got.
    .reverse();
  log(`Found ${fresh.length} new articles, adding up to ${chosen.length}.`);

  let added = 0;
  let skipped = 0;
  for (let start = 0; start < chosen.length; start += limits.batchSize) {
    const batch = chosen.slice(start, start + limits.batchSize);
    try {
      const result = await addBatch(grouping, batch, log, sources);
      added += result.added;
      skipped += result.skipped;
    } catch (error) {
      // The articles are still new, so the next run tries them again.
      skipped += batch.length;
      log(`Skipped a batch of ${batch.length}: ${(error as Error).message}`);
    }
  }

  await runs.insertOne({ at: new Date(), added, firstRun });
  log(`Added ${added} articles, skipped ${skipped}.`);
  return { fetched: fresh.length, added, skipped };
}

async function recentStories(grouping: StoryGroupingConcept) {
  const cutoff = Date.now() - limits.maxAgeHours * hour;
  const stories = (await grouping._stories({}))
    .filter((story) => story.publishedAt.getTime() >= cutoff)
    .slice(0, limits.recentStories);
  return Promise.all(
    stories.map(async (story) => ({
      story: story.story,
      key: story.key,
      headline: story.headline,
      summary: story.summary,
      image: story.image,
      topics: (await grouping._topics({ story: story.story })).map((row) => row.topic),
    })),
  );
}

async function addBatch(
  grouping: StoryGroupingConcept,
  batch: FeedItem[],
  log: (line: string) => void,
  sources: Sources,
) {
  const recent = await recentStories(grouping);
  const knownTopics = (await grouping._allTopics({})).map((row) => row.topic);
  const incoming: IncomingArticle[] = batch.map((item, id) => ({ id, ...item }));
  const prompt: RecentStory[] = recent.map(({ key, headline, summary, topics }) => ({ key, headline, summary, topics }));
  const answer = await sources.edit(prompt, knownTopics, incoming);

  const existing = new Map(recent.map((story) => [story.key, story]));
  const created = new Map(answer.newStories.map((story) => [story.key, story]));
  // New keys get a short suffix so they can never collide with an older story's key.
  const storedKey = new Map(answer.newStories.map((story) => [story.key, `${slug(story.key) || "story"}-${crypto.randomUUID().slice(0, 6)}`]));
  const storyOf = new Map(answer.articles.map((row) => [row.id, row.story]));
  const hasImage = new Map(recent.map((story) => [story.key, story.image !== ""]));

  let added = 0;
  let skipped = 0;
  for (const [id, item] of batch.entries()) {
    const key = storyOf.get(id);
    const target = key === undefined ? undefined : (created.get(key) ?? existing.get(key));
    if (key === undefined || target === undefined) {
      skipped++;
      log(`No story given for "${item.title}".`);
      continue;
    }
    const finalKey = storedKey.get(key) ?? key;
    // Only look for a preview picture when the story doesn't have one yet.
    let image = item.image;
    if (!image && !hasImage.get(finalKey)) image = await sources.previewImage(item.url);
    if (image) hasImage.set(finalKey, true);

    try {
      await grouping.addArticle({
        key: finalKey,
        headline: target.headline,
        summary: target.summary,
        topics: target.topics.slice(0, 5),
        image,
        source: item.source,
        title: item.title,
        url: item.url,
        publishedAt: item.publishedAt,
      });
      added++;
    } catch (error) {
      skipped++;
      log(`Could not add "${item.title}": ${(error as Error).message}`);
    }
  }

  // A story that gained sources gets the summary rewritten to cover them.
  for (const revision of answer.revisedStories) {
    const story = existing.get(revision.key);
    if (!story) continue;
    try {
      await grouping.revise({ story: story.story, summary: revision.summary, topics: revision.topics.slice(0, 5) });
    } catch (error) {
      log(`Could not revise "${story.headline}": ${(error as Error).message}`);
    }
  }
  return { added, skipped };
}
