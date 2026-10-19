import type { Db } from "mongodb";
import { StoryGroupingConcept } from "../concepts/StoryGrouping.ts";
import { runNews } from "./ingest.ts";

const hour = 60 * 60 * 1000;

// Fetches news when the backend starts and then every hour, for as long as it runs.
export function startNewsSchedule(db: Db) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("News updates are off because ANTHROPIC_API_KEY is not set.");
    return;
  }
  const grouping = new StoryGroupingConcept(db);
  let running = false;

  async function run() {
    // A slow run is never overlapped by the next one.
    if (running) return;
    running = true;
    try {
      // The dev server restarts on every save, so skip if a run happened within the hour.
      const [last] = await db.collection<{ at: Date }>("news.runs").find().sort({ at: -1 }).limit(1).toArray();
      if (last && Date.now() - last.at.getTime() < hour - 5 * 60 * 1000) return;
      await runNews(db, grouping, (line) => console.log(`[news] ${line}`));
    } catch (error) {
      console.error("[news] Run failed:", error);
    } finally {
      running = false;
    }
  }

  void run();
  setInterval(run, hour);
}
