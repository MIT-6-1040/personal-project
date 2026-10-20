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
  await expect(interests.add({ user: "lee", topic: "t".repeat(101), count: 1 })).rejects.toThrow(InvalidTopic);
  // Only the first add happened, and the duplicate didn't change its count.
  expect(await interests._interests({ user: "lee" })).toEqual([{ topic: "Climate change", count: 1 }]);
});

test("setCount and remove refuse a topic the user doesn't have, and a bad count, without changes", async () => {
  await expect(interests.setCount({ user: "lee", topic: "Golf", count: 2 })).rejects.toThrow(TopicNotFound);
  await expect(interests.remove({ user: "lee", topic: "Golf" })).rejects.toThrow(TopicNotFound);
  await expect(interests.setCount({ user: "lee", topic: "Climate change", count: 1001 })).rejects.toThrow(InvalidCount);
  expect(await interests._interests({ user: "lee" })).toEqual([{ topic: "Climate change", count: 1 }]);
});

test("a count can go down to 0, and reset only clears that user", async () => {
  await interests.add({ user: "pat", topic: "Tennis", count: 2 });
  await interests.add({ user: "pat", topic: "Golf", count: 1 });
  expect(await interests.setCount({ user: "pat", topic: "Golf", count: 0 })).toEqual({ count: 0 });
  expect(await interests._interests({ user: "pat" })).toEqual([
    { topic: "Tennis", count: 2 },
    { topic: "Golf", count: 0 },
  ]);
  expect(await interests.reset({ user: "pat" })).toEqual({ removed: 2 });
  expect(await interests.reset({ user: "pat" })).toEqual({ removed: 0 });
  expect(await interests._interests({ user: "lee" })).toHaveLength(1);
});
