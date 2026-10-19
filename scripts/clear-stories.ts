// Removes every story and what points at stories (reading history, saved feeds, and
// the news run log). Accounts, sessions, and interests are kept.
// Run with: bun run clear-stories
import { client, db } from "../src/db.ts";

const collections = [
  "storyGrouping.stories",
  "storyGrouping.articles",
  "readingHistory.readings",
  "feedCurating.entries",
  "news.runs",
  "news.lock",
];

for (const name of collections) {
  const { deletedCount } = await db.collection(name).deleteMany({});
  console.log(`${name}: removed ${deletedCount}`);
}
await client.close();
