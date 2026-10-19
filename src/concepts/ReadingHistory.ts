import type { Collection, Db } from "mongodb";

export class AlreadyRead extends Error {}

interface Reading {
  _id: string;
  user: string;
  story: string;
  readAt: Date;
}

export class ReadingHistoryConcept {
  private readonly readings: Collection<Reading>;
  private indexed = false;

  constructor(db: Db) {
    this.readings = db.collection<Reading>("readingHistory.readings");
  }

  async record({ user, story }: { user: string; story: string }) {
    if (!this.indexed) {
      await this.readings.createIndex({ user: 1, story: 1 }, { unique: true });
      this.indexed = true;
    }
    if (await this.readings.findOne({ user, story })) {
      throw new AlreadyRead("You have already read this story.");
    }
    const reading = crypto.randomUUID();
    await this.readings.insertOne({ _id: reading, user, story, readAt: new Date() });
    return { reading };
  }

  async _hasRead({ user, story }: { user: string; story: string }) {
    const found = await this.readings.findOne({ user, story });
    return { read: found !== null };
  }

  async _readStories({ user }: { user: string }): Promise<{ stories: string[] }> {
    const rows = await this.readings.find({ user }).sort({ readAt: -1 }).toArray();
    return { stories: rows.map((row) => row.story) };
  }

  async _readings({ user, offset, limit }: { user: string; offset: number; limit: number }) {
    if (limit < 1) return [];
    // The _id tiebreak keeps pages stable when two readings share a time.
    const rows = await this.readings
      .find({ user })
      .sort({ readAt: -1, _id: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return rows.map((row) => ({ story: row.story, readAt: row.readAt }));
  }
}
