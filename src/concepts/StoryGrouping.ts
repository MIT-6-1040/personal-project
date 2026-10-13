import type { Collection, Db } from "mongodb";

export class DuplicateArticle extends Error {}

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

  // For now, "the same event" means the same key. Later the news pipeline will
  // decide the key by comparing articles, and this action won't need to change.
  async addArticle(input: NewArticle) {
    await this.#index();
    const { key, headline, summary, image, topics, source, title, url, publishedAt } = input;
    if (await this.articles.findOne({ url })) {
      throw new DuplicateArticle("That article has already been added.");
    }
    let story = (await this.stories.findOne({ key }))?._id;
    if (story === undefined) {
      story = crypto.randomUUID();
      await this.stories.insertOne({ _id: story, key, headline, summary, image, topics });
    }
    const article = crypto.randomUUID();
    await this.articles.insertOne({ _id: article, story, source, title, url, publishedAt });
    return { article, story };
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
      .map(({ _id, headline, summary, image }) => ({
        story: _id,
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

  async _catalog(_input: Record<string, never>): Promise<{ catalog: Catalog }> {
    const times = await this.#latestTimes();
    const stories = await this.stories.find().toArray();
    return {
      catalog: stories.map(({ _id, topics }) => ({
        story: _id,
        topics,
        publishedAt: times.get(_id) ?? new Date(0),
      })),
    };
  }
}
