import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Sessioning, StoryGrouping, InterestTracking, ReadingHistory, FeedCurating } = concepts;

// The ranked stories, each joined with what the feed card shows.
const PersonalFeed = former(
  "the personal feed of (user)",
  ({ user }, { story, score, headline, summary, image, publishedAt, topic }) =>
    each(FeedCurating._feed({ user }).is({ story, score }))
      .where(StoryGrouping._get({ story }).is({ headline, summary, image, publishedAt }))
      .form({
        story,
        score,
        headline,
        summary,
        image,
        publishedAt,
        topics: each(StoryGrouping._topics({ story }).is({ topic })).distinct(topic),
      }),
);

// P1's requestFeedData and generateFeed: gather the stories, the user's interests,
// and what they've read, then rank.
const ViewFeed = endpoint(
  "/feed",
  ({ session, user, catalog, profile, read }) =>
    receive({ session })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(
        where(
          StoryGrouping._catalog({}).is({ catalog }),
          InterestTracking._profile({ user }).is({ profile }),
          ReadingHistory._readStories({ user }).is({ stories: read }),
        )
          .then(FeedCurating.generate({ user, candidates: catalog, weights: profile, excluded: read }))
          .then(respond({ feed: PersonalFeed({ user }) })),
      ),
  { input: { required: ["session"] } },
);

export const composition = {
  Viewing: { ViewFeed, PersonalFeed },
};
