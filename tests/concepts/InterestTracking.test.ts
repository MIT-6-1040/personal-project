import { expect, test } from "bun:test";
import {
  InterestTrackingConcept,
  InvalidCount,
  InvalidTopic,
  TopicAlreadyAdded,
  TopicNotFound,
} from "../../src/concepts/InterestTracking.ts";
import { testDb } from "../testDb.ts";

const interests = new InterestTrackingConcept(testDb());

test("principle: interests grow from reading and stay under the user's control", async () => {
  await interests.add({ user: "alex", topic: "OPT employment rules", count: 3 });

  expect(await interests.increase({ user: "alex", topic: "FC Barcelona matches" })).toEqual({ count: 1 });
  expect(await interests.increase({ user: "alex", topic: "FC Barcelona matches" })).toEqual({ count: 2 });
  expect(await interests._interests({ user: "alex" })).toEqual([
    { topic: "OPT employment rules", count: 3 },
    { topic: "FC Barcelona matches", count: 2 },
  ]);

  await interests.setCount({ user: "alex", topic: "OPT employment rules", count: 5 });
  await interests.remove({ user: "alex", topic: "FC Barcelona matches" });
  expect(await interests._profile({ user: "alex" })).toEqual({
    profile: [{ topic: "OPT employment rules", count: 5 }],
  });

  expect(await interests.reset({ user: "alex" })).toEqual({ removed: 1 });
  expect(await interests._interests({ user: "alex" })).toEqual([]);
});

test("one user's interests don't affect another's", async () => {
  await interests.add({ user: "sam", topic: "MIT campus news", count: 2 });
  await interests.increase({ user: "kim", topic: "MIT campus news" });
  expect(await interests._interests({ user: "sam" })).toEqual([{ topic: "MIT campus news", count: 2 }]);
  expect(await interests._interests({ user: "kim" })).toEqual([{ topic: "MIT campus news", count: 1 }]);
});

test("add refuses a duplicate, a blank topic, and a bad count", async () => {
  await interests.add({ user: "lee", topic: "Climate change", count: 1 });
  await expect(interests.add({ user: "lee", topic: "Climate change", count: 4 })).rejects.toThrow(TopicAlreadyAdded);
  await expect(interests.add({ user: "lee", topic: "  ", count: 1 })).rejects.toThrow(InvalidTopic);
  await expect(interests.add({ user: "lee", topic: "Tennis", count: -1 })).rejects.toThrow(InvalidCount);
  await expect(interests.add({ user: "lee", topic: "Tennis", count: 1.5 })).rejects.toThrow(InvalidCount);
});

test("setCount and remove refuse a topic the user doesn't have", async () => {
  await expect(interests.setCount({ user: "lee", topic: "Golf", count: 2 })).rejects.toThrow(TopicNotFound);
  await expect(interests.remove({ user: "lee", topic: "Golf" })).rejects.toThrow(TopicNotFound);
});
