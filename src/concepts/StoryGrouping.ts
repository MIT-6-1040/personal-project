import type { Collection, Db, Filter } from "mongodb";

export class DuplicateArticle extends Error {}
export class InvalidHeadline extends Error {}
export class InvalidSummary extends Error {}
export class InvalidTopics extends Error {}
export class StoryNotFound extends Error {}

// Kept short so a card shows the whole headline and summary.
const maxHeadline = 100;
const maxSummaryChars = 400;
const maxSummaryWords = 60;
const maxTopics = 5;
const maxTopicLength = 100;

function checkHeadline(headline: string) {
  const text = headline.trim();
  if (text === "" || text.length > maxHeadline) {
    throw new InvalidHeadline("A headline must have 1 to 100 characters.");
  }
  return text;
}

function checkSummary(summary: string) {
  const text = summary.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  if (text === "" || text.length > maxSummaryChars || words > maxSummaryWords) {
    throw new InvalidSummary("A summary must have 1 to 400 characters and at most 60 words.");
  }
  return text;
}

// Answers the topics trimmed and without repeats.
function checkTopics(topics: string[]) {
  const unique = [...new Set(topics.map((topic) => topic.trim()))];
  const badTopic = unique.some((topic) => topic === "" || topic.length > maxTopicLength);
  if (unique.length === 0 || unique.length > maxTopics || badTopic) {
    throw new InvalidTopics("A story needs 1 to 5 topics of 1 to 100 characters each.");
  }
  return unique;
}

interface Story {
  _id: string;
  key: string;
  headline: string;
  summary: string;
  image: string;
  topics: string[];
}

interface Article {
  _id: string;
  story: string;
  source: string;
  title: string;
  url: string;
  publishedAt: Date;
}

export type Catalog = { story: string; topics: string[]; publishedAt: Date }[];

export interface NewArticle {
  key: string;
  headline: string;
  summary: string;
  image: string;
  topics: string[];
  source: string;
  title: string;
  url: string;
  publishedAt: Date;
}

export class StoryGroupingConcept {
  private readonly stories: Collection<Story>;
  private readonly articles: Collection<Article>;
  private indexed = false;

  constructor(db: Db) {
    this.stories = db.collection<Story>("storyGrouping.stories");
    this.articles = db.collection<Article>("storyGrouping.articles");
  }

  async #index() {
    if (this.indexed) return;
    await this.stories.createIndex({ key: 1 }, { unique: true });
    await this.articles.createIndex({ url: 1 }, { unique: true });
    this.indexed = true;
  }

  // "The same event" means the same key. The news pipeline decides the key by
  // asking which story an article is about, so this action stays simple.
  async addArticle(input: NewArticle) {
    await this.#index();
    const { key, image, source, title, url, publishedAt } = input;
    const headline = checkHeadline(input.headline);
    const summary = checkSummary(input.summary);
    const topics = checkTopics(input.topics);
    if (await this.articles.findOne({ url })) {
      throw new DuplicateArticle("That article has already been added.");
    }
    const existing = await this.stories.findOne({ key });
    let story: string;
    if (existing === null) {
      story = crypto.randomUUID();
      await this.stories.insertOne({ _id: story, key, headline, summary, image, topics });
    } else {
      story = existing._id;
      // The story keeps the first image it gets, from whichever article brings one.
      if (existing.image === "" && image !== "") {
        await this.stories.updateOne({ _id: story }, { $set: { image } });
      }
    }
    const article = crypto.randomUUID();
    await this.articles.insertOne({ _id: article, story, source, title, url, publishedAt });
    return { article, story };
  }

  // When another outlet joins a story, the summary is rewritten to cover it.
  async revise({ story, summary, topics }: { story: string; summary: string; topics: string[] }) {
    if ((await this.stories.findOne({ _id: story })) === null) {
      throw new StoryNotFound("That story does not exist.");
    }
    const newSummary = checkSummary(summary);
    const newTopics = checkTopics(topics);
    await this.stories.updateOne({ _id: story }, { $set: { summary: newSummary, topics: newTopics } });
    return { story };
  }

  // A story's time is the time of its newest article.
  async #latestTimes() {
    const times = new Map<string, Date>();
    for (const { story, publishedAt } of await this.articles.find().toArray()) {
      const current = times.get(story);
      if (current === undefined || publishedAt > current) times.set(story, publishedAt);
    }
    return times;
  }

  async _stories(_input: Record<string, never>) {
    const times = await this.#latestTimes();
    const stories = await this.stories.find().toArray();
    return stories
      .map(({ _id, key, headline, summary, image }) => ({
        story: _id,
        key,
        headline,
        summary,
        image,
        publishedAt: times.get(_id) ?? new Date(0),
      }))
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  async _get({ story }: { story: string }) {
    const found = await this.stories.findOne({ _id: story });
    if (found === null) return [];
    const times = await this.#latestTimes();
    const { headline, summary, image } = found;
    return [{ headline, summary, image, publishedAt: times.get(story) ?? new Date(0) }];
  }

  async _hasArticle({ url }: { url: string }) {
    return { added: (await this.articles.findOne({ url })) !== null };
  }

  async _articles({ story }: { story: string }) {
    const rows = await this.articles.find({ story }).sort({ publishedAt: -1 }).toArray();
    return rows.map(({ _id, source, title, url, publishedAt }) => ({
      article: _id,
      source,
      title,
      url,
      publishedAt,
    }));
  }

  async _topics({ story }: { story: string }) {
    const found = await this.stories.findOne({ _id: story });
    if (found === null) return [];
    return [...found.topics].sort().map((topic) => ({ topic }));
  }

  async _allTopics(_input: Record<string, never>) {
    const topics: string[] = await this.stories.distinct("topics");
    return topics.sort().map((topic) => ({ topic }));
  }

  async _sources(_input: Record<string, never>) {
    const sources: string[] = await this.articles.distinct("source");
    return sources.sort().map((source) => ({ source }));
  }

  // A blank search or source leaves that filter off. Every word of the search has
  // to appear in the headline or the summary, ignoring case.
  async _catalog({ search, source }: { search: string; source: string }): Promise<{ catalog: Catalog }> {
    const filter: Filter<Story> = {};
    const words = search.trim().split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      filter.$and = words.map((word) => {
        const pattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        return { $or: [{ headline: pattern }, { summary: pattern }] };
      });
    }
    if (source.trim() !== "") {
      filter._id = { $in: await this.articles.distinct("story", { source: source.trim() }) };
    }
    const times = await this.#latestTimes();
    const stories = await this.stories.find(filter).toArray();
    return {
      catalog: stories.map(({ _id, topics }) => ({
        story: _id,
        topics,
        publishedAt: times.get(_id) ?? new Date(0),
      })),
    };
  }
}
