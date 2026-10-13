import type { Collection, Db } from "mongodb";

interface Entry {
  user: string;
  story: string;
  score: number;
  position: number;
}

export type Candidates = { story: string; topics: string[]; publishedAt: Date }[];
export type Weights = { topic: string; count: number }[];
export type Excluded = string[];

export class FeedCuratingConcept {
  private readonly entries: Collection<Entry>;

  constructor(db: Db) {
    this.entries = db.collection<Entry>("feedCurating.entries");
  }

  async generate({
    user,
    candidates,
    weights,
    excluded,
  }: {
    user: string;
    candidates: Candidates;
    weights: Weights;
    excluded: Excluded;
  }) {
    const weightOf = new Map(weights.map(({ topic, count }) => [topic, count]));
    const skip = new Set(excluded);

    // A story's score is the sum of the user's counts for its topics.
    const ranked = candidates
      .filter(({ story }) => !skip.has(story))
      .map(({ story, topics, publishedAt }) => ({
        story,
        publishedAt: new Date(publishedAt),
        score: topics.reduce((sum, topic) => sum + (weightOf.get(topic) ?? 0), 0),
      }))
      .sort((a, b) => b.score - a.score || b.publishedAt.getTime() - a.publishedAt.getTime());

    await this.entries.deleteMany({ user });
    if (ranked.length > 0) {
      await this.entries.insertMany(
        ranked.map(({ story, score }, position) => ({ user, story, score, position })),
      );
    }
    return { size: ranked.length };
  }

  async _feed({ user }: { user: string }) {
    const rows = await this.entries.find({ user }).sort({ position: 1 }).toArray();
    return rows.map(({ story, score }) => ({ story, score }));
  }
}
