import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import type { Collection, Db } from "mongodb";

export class InvalidUsername extends Error {}
export class WeakPassword extends Error {}
export class UsernameTaken extends Error {}
export class InvalidCredentials extends Error {}

interface Account {
  _id: string;
  username: string;
  salt: string;
  passwordHash: string;
}

const USERNAME = /^[A-Za-z0-9_-]{3,32}$/;

// We never store the password itself, only a slow hash of it with a random salt.
function hash(password: string, salt: string) {
  return pbkdf2Sync(password, salt, 100_000, 32, "sha256").toString("hex");
}

export class AuthenticatingConcept {
  private readonly accounts: Collection<Account>;
  private indexed = false;

  constructor(db: Db) {
    this.accounts = db.collection<Account>("authenticating.accounts");
  }

  async register({ username, password }: { username: string; password: string }) {
    if (!USERNAME.test(username)) {
      throw new InvalidUsername(
        "A username must have 3 to 32 letters, numbers, underscores, or hyphens.",
      );
    }
    if (password.length < 8 || password.length > 128) {
      throw new WeakPassword("A password must have 8 to 128 characters.");
    }
    if (!this.indexed) {
      await this.accounts.createIndex({ username: 1 }, { unique: true });
      this.indexed = true;
    }
    if (await this.accounts.findOne({ username })) {
      throw new UsernameTaken("That username is already taken.");
    }
    const account = crypto.randomUUID();
    const salt = crypto.randomUUID();
    await this.accounts.insertOne({ _id: account, username, salt, passwordHash: hash(password, salt) });
    return { account };
  }

  async authenticate({ username, password }: { username: string; password: string }) {
    const found = await this.accounts.findOne({ username });
    // Compare in constant time so the response time doesn't leak anything.
    const matches =
      found !== null &&
      timingSafeEqual(Buffer.from(found.passwordHash, "hex"), Buffer.from(hash(password, found.salt), "hex"));
    if (!matches) {
      throw new InvalidCredentials("The username or password is incorrect.");
    }
    return { account: found._id };
  }

  async _username({ account }: { account: string }) {
    const found = await this.accounts.findOne({ _id: account });
    return found === null ? [] : [{ username: found.username }];
  }
}
