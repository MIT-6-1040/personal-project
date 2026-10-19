import { createHash, randomBytes } from "node:crypto";
import type { Collection, Db } from "mongodb";

export class UnknownAttempt extends Error {}
export class CommonsRefused extends Error {}

interface Attempt {
  _id: string;
  state: string;
  verifier: string;
  expiresAt: Date;
}

interface Options {
  // This app's exact origin. Commons sends people back to <app>/auth/commons/callback.
  app: string;
  commons: string;
  fetch?: typeof fetch;
  clock?: () => Date;
}

const ATTEMPT_LENGTH_MS = 10 * 60 * 1000;

// Follows Commons' "Sign in with Commons for course apps" contract: a new verifier per
// sign-in, sent to Commons only as its SHA-256 challenge, and revealed only when our
// server redeems the code.
export class CommonsConnectingConcept {
  private readonly attempts: Collection<Attempt>;
  private readonly fetch: typeof fetch;
  private readonly clock: () => Date;

  constructor(
    db: Db,
    private readonly options: Options,
  ) {
    this.attempts = db.collection<Attempt>("commonsConnecting.attempts");
    this.fetch = options.fetch ?? fetch;
    this.clock = options.clock ?? (() => new Date());
  }

  async begin(_input: Record<string, never>) {
    const now = this.clock();
    await this.attempts.deleteMany({ expiresAt: { $lte: now } });
    const attempt = randomBytes(24).toString("base64url");
    const state = randomBytes(24).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const expiresAt = new Date(now.getTime() + ATTEMPT_LENGTH_MS);
    await this.attempts.insertOne({ _id: attempt, state, verifier, expiresAt });

    const url = new URL("/connect", this.options.commons);
    url.search = new URLSearchParams({
      app: this.options.app,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();
    return { attempt, url: url.toString(), expiresAt };
  }

  async complete({ attempt, state, code }: { attempt: string; state: string; code: string }) {
    const found = await this.attempts.findOne({ _id: attempt, expiresAt: { $gt: this.clock() } });
    if (found === null || found.state !== state) {
      throw new UnknownAttempt("This sign-in has expired. Please try again.");
    }
    const response = await this.fetch(new URL("/api/connect/redeem", this.options.commons), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, app: this.options.app, code_verifier: found.verifier }),
      signal: AbortSignal.timeout(10_000),
    });
    const person = (await response.json().catch(() => null)) as {
      user?: string;
      username?: string;
      displayName?: string;
      email?: string;
    } | null;
    if (!response.ok || !person?.user) {
      throw new CommonsRefused("Commons could not confirm this sign-in. Please try again.");
    }
    await this.attempts.deleteOne({ _id: attempt });
    return {
      person: person.user,
      username: person.username ?? "",
      displayName: person.displayName ?? "",
      email: person.email ?? "",
    };
  }

  async _pending({ attempt }: { attempt: string }) {
    const found = await this.attempts.findOne({ _id: attempt, expiresAt: { $gt: this.clock() } });
    return found === null ? [] : [{ expiresAt: found.expiresAt }];
  }
}
