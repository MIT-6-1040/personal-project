import { expect, test } from "bun:test";
import {
  AuthenticatingConcept,
  InvalidCredentials,
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

test("bad usernames and short passwords are refused", async () => {
  await expect(auth.register({ username: "a!", password: "longenough" })).rejects.toThrow(InvalidUsername);
  await expect(auth.register({ username: "sam", password: "short" })).rejects.toThrow(WeakPassword);
  await expect(auth.authenticate({ username: "ghost", password: "whatever1" })).rejects.toThrow(InvalidCredentials);
});
