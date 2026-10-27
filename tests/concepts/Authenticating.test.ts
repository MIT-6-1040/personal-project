import { expect, test } from "bun:test";
import {
  AuthenticatingConcept,
  InvalidCredentials,
  InvalidPerson,
  InvalidUsername,
  UsernameTaken,
  WeakPassword,
} from "../../src/concepts/Authenticating.ts";
import { testDb } from "../testDb.ts";

const auth = new AuthenticatingConcept(testDb());

test("principle: register, then only the right password signs in", async () => {
  const { account } = await auth.register({ username: "alex", password: "barca2026" });
  await expect(auth.register({ username: "alex", password: "another-pass" })).rejects.toThrow(UsernameTaken);
  await expect(auth.authenticate({ username: "alex", password: "wrong-pass" })).rejects.toThrow(InvalidCredentials);
  expect(await auth.authenticate({ username: "alex", password: "barca2026" })).toEqual({ account });
  expect(await auth._username({ account })).toEqual([{ username: "alex" }]);
});

test("usernames match in any capitalization and keep how they were registered", async () => {
  const { account } = await auth.register({ username: "Desire", password: "catchup2026" });
  expect(await auth.authenticate({ username: "desire", password: "catchup2026" })).toEqual({ account });
  expect(await auth.authenticate({ username: "DESIRE", password: "catchup2026" })).toEqual({ account });
  await expect(auth.register({ username: "desire", password: "another-pass" })).rejects.toThrow(UsernameTaken);
  expect(await auth._username({ account })).toEqual([{ username: "Desire" }]);
  // A Commons user named "DESIRE" doesn't take over or collide with the account.
  const commons = await auth.connect({ person: "commons-desire", username: "DESIRE" });
  expect(await auth._username(commons)).toEqual([{ username: "DESIRE-2" }]);
});

test("a Commons person always gets the same account, which has no password", async () => {
  const { account } = await auth.connect({ person: "commons-sam", username: "sam_k" });
  expect(await auth._username({ account })).toEqual([{ username: "sam_k" }]);
  expect(await auth.connect({ person: "commons-sam", username: "renamed" })).toEqual({ account });
  // Nobody can sign in to a Commons account with a password, not even an empty one.
  await expect(auth.authenticate({ username: "sam_k", password: "" })).rejects.toThrow(InvalidCredentials);
  await expect(auth.authenticate({ username: "sam_k", password: "anything123" })).rejects.toThrow(InvalidCredentials);
});

test("a Commons username that is taken or doesn't fit gets a usable one", async () => {
  // "alex" already belongs to the password account from the first test.
  const taken = await auth.connect({ person: "commons-alex", username: "alex" });
  expect(await auth._username(taken)).toEqual([{ username: "alex-2" }]);
  const odd = await auth.connect({ person: "commons-odd", username: "j.doe@mit" });
  expect(await auth._username(odd)).toEqual([{ username: "j-doe-mit" }]);
  // The password account named alex is untouched.
  await expect(auth.authenticate({ username: "alex", password: "barca2026" })).resolves.toBeDefined();
});

test("a blank Commons person is refused and makes no account", async () => {
  await expect(auth.connect({ person: " ", username: "ghost" })).rejects.toThrow(InvalidPerson);
  await expect(auth.register({ username: "ghost", password: "longenough" })).resolves.toBeDefined();
});

test("bad usernames and short passwords are refused, and no account is made", async () => {
  await expect(auth.register({ username: "a!", password: "longenough" })).rejects.toThrow(InvalidUsername);
  await expect(auth.register({ username: "sam", password: "short" })).rejects.toThrow(WeakPassword);
  await expect(auth.register({ username: "sam", password: "p".repeat(129) })).rejects.toThrow(WeakPassword);
  await expect(auth.authenticate({ username: "ghost", password: "whatever1" })).rejects.toThrow(InvalidCredentials);
  // "sam" was never created, so it can still be registered.
  await expect(auth.authenticate({ username: "sam", password: "short" })).rejects.toThrow(InvalidCredentials);
  await expect(auth.register({ username: "sam", password: "longenough" })).resolves.toBeDefined();
});
