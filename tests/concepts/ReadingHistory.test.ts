import { expect, test } from "bun:test";
import { AlreadyRead, ReadingHistoryConcept } from "../../src/concepts/ReadingHistory.ts";
import { testDb } from "../testDb.ts";

const history = new ReadingHistoryConcept(testDb());

test("principle: a recorded story is part of the user's history", async () => {
  expect(await history._hasRead({ user: "alex", story: "barca" })).toEqual({ read: false });
  await history.record({ user: "alex", story: "barca" });
  expect(await history._hasRead({ user: "alex", story: "barca" })).toEqual({ read: true });
  expect(await history._hasRead({ user: "alex", story: "climate" })).toEqual({ read: false });
  await expect(history.record({ user: "alex", story: "barca" })).rejects.toThrow(AlreadyRead);
});

test("read stories come back most recent first, per user", async () => {
  await history.record({ user: "sam", story: "first" });
  await Bun.sleep(5);
  await history.record({ user: "sam", story: "second" });
  expect(await history._readStories({ user: "sam" })).toEqual({ stories: ["second", "first"] });
  expect(await history._readStories({ user: "nobody" })).toEqual({ stories: [] });
});
