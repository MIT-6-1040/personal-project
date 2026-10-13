import type { Collection, Db } from "mongodb";

export class InvalidTopic extends Error {}
export class InvalidCount extends Error {}
export class TopicAlreadyAdded extends Error {}
export class TopicNotFound extends Error {}

interface Interest {
  user: string;
  topic: string;
  count: number;
}

export type Profile = { topic: string; count: number }[];

function checkCount(count: number) {
  if (!Number.isInteger(count) || count < 0 || count > 1000) {
    throw new InvalidCount("A count must be a whole number from 0 to 1000.");
  }
}

export class InterestTrackingConcept {
  private readonly interests: Collection<Interest>;
  private indexed = false;

  constructor(db: Db) {
    this.interests = db.collection<Interest>("interestTracking.interests");
  }

  // Each user has a topic at most once.
  async #index() {
    if (this.indexed) return;
    await this.interests.createIndex({ user: 1, topic: 1 }, { unique: true });
    this.indexed = true;
  }

  async increase({ user, topic }: { user: string; topic: string }) {
    await this.#index();
    // upsert creates the topic with a count of 1 if the user doesn't have it yet
    const updated = await this.interests.findOneAndUpdate(
      { user, topic },
      { $inc: { count: 1 } },
      { upsert: true, returnDocument: "after" },
    );
    return { count: updated!.count };
  }

  async add({ user, topic, count }: { user: string; topic: string; count: number }) {
    await this.#index();
    if (topic.trim() === "" || topic.length > 100) {
      throw new InvalidTopic("A topic must have 1 to 100 characters.");
    }
    checkCount(count);
    if (await this.interests.findOne({ user, topic })) {
      throw new TopicAlreadyAdded("That topic is already in your interests.");
    }
    await this.interests.insertOne({ user, topic, count });
    return { count };
  }

  async setCount({ user, topic, count }: { user: string; topic: string; count: number }) {
    checkCount(count);
    const result = await this.interests.updateOne({ user, topic }, { $set: { count } });
    if (result.matchedCount === 0) {
      throw new TopicNotFound("That topic is not in your interests.");
    }
    return { count };
  }

  async remove({ user, topic }: { user: string; topic: string }) {
    const result = await this.interests.deleteOne({ user, topic });
    if (result.deletedCount === 0) {
      throw new TopicNotFound("That topic is not in your interests.");
    }
    return { topic };
  }

  async reset({ user }: { user: string }) {
    const result = await this.interests.deleteMany({ user });
    return { removed: result.deletedCount };
  }

  async _interests({ user }: { user: string }) {
    const rows = await this.interests.find({ user }).sort({ count: -1, topic: 1 }).toArray();
    return rows.map(({ topic, count }) => ({ topic, count }));
  }

  async _profile({ user }: { user: string }): Promise<{ profile: Profile }> {
    return { profile: await this._interests({ user }) };
  }
}
