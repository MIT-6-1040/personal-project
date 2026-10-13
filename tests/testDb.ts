import { afterAll } from "bun:test";
import { client } from "../src/db.ts";

// Each test file gets its own empty database, which is dropped at the end.
// The client is shared by every test file, so it stays open.
export function testDb() {
  const db = client.db(`catchup_test_${crypto.randomUUID().slice(0, 8)}`);
  afterAll(async () => {
    await db.dropDatabase();
  });
  return db;
}
