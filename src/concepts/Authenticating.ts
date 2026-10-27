import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import type { Collection, Db } from "mongodb";

export class InvalidUsername extends Error {}
export class WeakPassword extends Error {}
export class UsernameTaken extends Error {}
export class InvalidCredentials extends Error {}
export class InvalidPerson extends Error {}

// A Commons account has no password, and a password account has no Commons link.
interface Account {
  _id: string;
  username: string;
  salt?: string;
  passwordHash?: string;
  commonsPerson?: string;
}

const USERNAME = /^[A-Za-z0-9_-]{3,32}$/;

// Usernames match without regard to capitalization, so "Alex" and "alex" are the same
// account, but each is shown the way it was registered.
const ANY_CASE = { locale: "en", strength: 2 };

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
    await this.#index();
    if (await this.accounts.findOne({ username }, { collation: ANY_CASE })) {
      throw new UsernameTaken("That username is already taken.");
    }
    const account = crypto.randomUUID();
    const salt = crypto.randomUUID();
    await this.accounts.insertOne({ _id: account, username, salt, passwordHash: hash(password, salt) });
    return { account };
  }

  async authenticate({ username, password }: { username: string; password: string }) {
    const found = await this.accounts.findOne({ username }, { collation: ANY_CASE });
    // An account made through Commons has no password, so no password can sign in to it.
    // Compare in constant time so the response time doesn't leak anything.
    const matches =
      found !== null &&
      found.passwordHash !== undefined &&
      found.salt !== undefined &&
      timingSafeEqual(Buffer.from(found.passwordHash, "hex"), Buffer.from(hash(password, found.salt), "hex"));
    if (!matches) {
      throw new InvalidCredentials("The username or password is incorrect.");
    }
    return { account: found._id };
  }

  // Signing in with Commons: the same Commons person always gets the same account.
  async connect({ person, username }: { person: string; username: string }) {
    if (person.trim() === "") {
      throw new InvalidPerson("That Commons account could not be read.");
    }
    await this.#index();
    const linked = await this.accounts.findOne({ commonsPerson: person });
    if (linked) return { account: linked._id };

    // Commons usernames may not fit our rules or may already be taken here.
    const base = (username.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 28) || "commons").padEnd(3, "-");
    let name = base;
    for (let n = 2; await this.accounts.findOne({ username: name }, { collation: ANY_CASE }); n++) name = `${base}-${n}`;

    const account = crypto.randomUUID();
    await this.accounts.insertOne({ _id: account, username: name, commonsPerson: person });
    return { account };
  }

  async #index() {
    if (this.indexed) return;
    await this.accounts.createIndex({ username: 1 }, { unique: true });
    // Two registrations at once can both pass the check in register, so the database
    // also refuses a second "Alex" when "alex" exists.
    await this.accounts.createIndex(
      { username: 1 },
      { name: "username_any_case", unique: true, collation: ANY_CASE },
    );
    // Only accounts linked to Commons have this field, so the index skips the rest.
    await this.accounts.createIndex(
      { commonsPerson: 1 },
      { unique: true, partialFilterExpression: { commonsPerson: { $type: "string" } } },
    );
    this.indexed = true;
  }

  async _username({ account }: { account: string }) {
    const found = await this.accounts.findOne({ _id: account });
    return found === null ? [] : [{ username: found.username }];
  }
}
