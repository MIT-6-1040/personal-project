import { assemble } from "@mit-sdg/sync-engine/assembly";
import { composition as feed } from "./compositions/Feed.ts";
import { composition as history } from "./compositions/History.ts";
import { composition as interests } from "./compositions/Interests.ts";
import { composition as sessions } from "./compositions/Sessions.ts";
import { composition as stories } from "./compositions/Stories.ts";
import { AuthenticatingConcept } from "./concepts/Authenticating.ts";
import { CommonsConnectingConcept } from "./concepts/CommonsConnecting.ts";
import { FeedCuratingConcept } from "./concepts/FeedCurating.ts";
import { InterestTrackingConcept } from "./concepts/InterestTracking.ts";
import { ReadingHistoryConcept } from "./concepts/ReadingHistory.ts";
import { SessioningConcept } from "./concepts/Sessioning.ts";
import { StoryGroupingConcept } from "./concepts/StoryGrouping.ts";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";
import { publicOrigin } from "./http.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    // Every concept keeps its state in MongoDB, so each one gets the database.
    instances: {
      Authenticating: new AuthenticatingConcept(db),
      // Commons sends people back to this app's own address after they approve it.
      CommonsConnecting: new CommonsConnectingConcept(db, {
        app: publicOrigin,
        commons: process.env.COMMONS_URL ?? "https://class.mit-sdg.dev",
      }),
      Sessioning: new SessioningConcept(db),
      StoryGrouping: new StoryGroupingConcept(db),
      InterestTracking: new InterestTrackingConcept(db),
      ReadingHistory: new ReadingHistoryConcept(db),
      FeedCurating: new FeedCuratingConcept(db),
    },
    composition: { Sessions: sessions, Stories: stories, Interests: interests, Feed: feed, History: history },
    // Print what went wrong. Otherwise a failure only shows up as INTERNAL_ERROR.
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
