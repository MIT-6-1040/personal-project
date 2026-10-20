import { expect, test } from "bun:test";
import { SessioningConcept, UnknownSession } from "../../src/concepts/Sessioning.ts";
import { testDb } from "../testDb.ts";

const db = testDb();
let now = new Date("2026-10-12T12:00:00Z");
const sessions = new SessioningConcept(db, () => now);

test("principle: a session resolves to its subject until it ends", async () => {
  const { session } = await sessions.start({ subject: "alex" });
  expect(await sessions.current({ session })).toEqual({ subject: "alex" });
  expect(await sessions.end({ session })).toEqual({ ended: true });
  await expect(sessions.current({ session })).rejects.toThrow(UnknownSession);
  await expect(sessions.current({ session: "made-up" })).rejects.toThrow(UnknownSession);
});

test("ending a session twice, or one that never existed, is refused and ends nothing else", async () => {
  const { session } = await sessions.start({ subject: "kim" });
  const { session: other } = await sessions.start({ subject: "lee" });
  await sessions.end({ session });
  await expect(sessions.end({ session })).rejects.toThrow(UnknownSession);
  await expect(sessions.end({ session: "made-up" })).rejects.toThrow(UnknownSession);
  // Lee's session is untouched.
  expect(await sessions.current({ session: other })).toEqual({ subject: "lee" });
});

test("a session stops working after it expires", async () => {
  const { session } = await sessions.start({ subject: "sam" });
  expect(await sessions._active({ session })).toHaveLength(1);
  now = new Date("2026-10-20T12:00:00Z");
  expect(await sessions._active({ session })).toEqual([]);
  await expect(sessions.current({ session })).rejects.toThrow(UnknownSession);
});
