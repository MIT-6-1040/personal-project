import type { Collection, Db } from "mongodb";

export class UnknownSession extends Error {}

interface Session {
  _id: string;
  subject: string;
  expiresAt: Date;
}

const SESSION_LENGTH_MS = 7 * 24 * 60 * 60 * 1000;

export class SessioningConcept {
  private readonly sessions: Collection<Session>;

  constructor(
    db: Db,
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.sessions = db.collection<Session>("sessioning.sessions");
  }

  async start({ subject }: { subject: string }) {
    const now = this.clock();
    await this.sessions.deleteMany({ expiresAt: { $lte: now } });
    const session = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + SESSION_LENGTH_MS);
    await this.sessions.insertOne({ _id: session, subject, expiresAt });
    return { session, expiresAt };
  }

  async current({ session }: { session: string }) {
    const found = await this.#active(session);
    return { subject: found.subject };
  }

  async end({ session }: { session: string }) {
    await this.#active(session);
    await this.sessions.deleteOne({ _id: session });
    return { ended: true };
  }

  async _active({ session }: { session: string }) {
    const found = await this.sessions.findOne({ _id: session, expiresAt: { $gt: this.clock() } });
    return found === null ? [] : [{ subject: found.subject, expiresAt: found.expiresAt }];
  }

  async #active(session: string) {
    const found = await this.sessions.findOne({ _id: session, expiresAt: { $gt: this.clock() } });
    if (found === null) throw new UnknownSession("You are not signed in.");
    return found;
  }
}
