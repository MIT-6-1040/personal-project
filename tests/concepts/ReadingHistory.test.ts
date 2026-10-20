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
  // The refused second record added nothing.
  expect(await history._readStories({ user: "alex" })).toEqual({ stories: ["barca"] });
});

test("read stories come back most recent first, per user", async () => {
  await history.record({ user: "sam", story: "first" });
  await Bun.sleep(5);
  await history.record({ user: "sam", story: "second" });
  expect(await history._readStories({ user: "sam" })).toEqual({ stories: ["second", "first"] });
  expect(await history._readStories({ user: "nobody" })).toEqual({ stories: [] });
});

test("readings list each story with when it was read, most recent first", async () => {
  await history.record({ user: "kim", story: "older" });
  await Bun.sleep(5);
  await history.record({ user: "kim", story: "newer" });
  const readings = await history._readings({ user: "kim", offset: 0, limit: 10 });
  expect(readings.map((row) => row.story)).toEqual(["newer", "older"]);
  expect(readings[0]!.readAt).toBeInstanceOf(Date);
  expect(readings[0]!.readAt.getTime()).toBeGreaterThan(readings[1]!.readAt.getTime());
  expect(await history._readings({ user: "nobody", offset: 0, limit: 10 })).toEqual([]);
});

test("readings come in pages that don't overlap", async () => {
  for (const story of ["a", "b", "c", "d", "e"]) {
    await history.record({ user: "pat", story });
    await Bun.sleep(2);
  }
  const page = async (offset: number) =>
    (await history._readings({ user: "pat", offset, limit: 2 })).map((row) => row.story);
  expect(await page(0)).toEqual(["e", "d"]);
  expect(await page(2)).toEqual(["c", "b"]);
  expect(await page(4)).toEqual(["a"]);
  expect(await page(6)).toEqual([]);
  expect(await history._readings({ user: "pat", offset: 0, limit: 0 })).toEqual([]);
});
