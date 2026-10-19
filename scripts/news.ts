// Runs the news pipeline once, the same way the backend does every hour.
// Run with: bun run news
import { StoryGroupingConcept } from "../src/concepts/StoryGrouping.ts";
import { client, db } from "../src/db.ts";
import { runNews } from "../src/news/ingest.ts";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Set ANTHROPIC_API_KEY in your .env file first.");
  process.exit(1);
}

await runNews(db, new StoryGroupingConcept(db));
await client.close();
