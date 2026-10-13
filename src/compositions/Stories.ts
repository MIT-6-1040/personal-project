import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Sessioning, StoryGrouping, ReadingHistory, InterestTracking } = concepts;

// The story with its topics and every original source.
const ExpandedStory = former(
  "the expanded story (story)",
  ({ story }, { headline, summary, image, publishedAt, topic, article, source, title, url, articleTime }) =>
    where(StoryGrouping._get({ story }).is({ headline, summary, image, publishedAt })).form({
      story,
      headline,
      summary,
      image,
      publishedAt,
      topics: each(StoryGrouping._topics({ story }).is({ topic })).distinct(topic),
      sources: each(
        StoryGrouping._articles({ story }).is({ article, source, title, url, publishedAt: articleTime }),
      ).form({ article, source, title, url, publishedAt: articleTime }),
    }),
);

// Only the first read is recorded, so re-reading a story doesn't raise interest again.
const ReadStory = endpoint(
  "/stories/read",
  ({ session, story, user }) =>
    receive({ session, story })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(
        where(StoryGrouping._get({ story }), ReadingHistory._hasRead({ user, story }).is({ read: false }))
          .then(ReadingHistory.record({ user, story }))
          .then(respond({ story: ExpandedStory({ story }) }))
          .named("first-read"),
        where(StoryGrouping._get({ story }), ReadingHistory._hasRead({ user, story }).is({ read: true }))
          .then(respond({ story: ExpandedStory({ story }) }))
          .named("reread"),
        where(no(StoryGrouping._get({ story })))
          .then(respond({ error: "STORY_NOT_FOUND" }))
          .named("missing"),
      ),
  { input: { required: ["session", "story"] } },
);

// P1's updateInterests: reading a story raises the count of each of its topics.
const InterestFollowsReading = reaction(({ user, story, topic }) =>
  when(ReadingHistory.record({ user, story }))
    .where(StoryGrouping._topics({ story }).is({ topic }))
    .then(InterestTracking.increase({ user, topic })),
);

const KnownTopics = former("every known topic", (_input, { topic }) =>
  each(StoryGrouping._allTopics({}).is({ topic })).distinct(topic),
);

const ListTopics = endpoint(
  "/topics/list",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(respond({ topics: KnownTopics({}) })),
  { input: { required: ["session"] } },
);

export const composition = {
  Reading: { ReadStory, ExpandedStory },
  Learning: { InterestFollowsReading },
  Topics: { ListTopics, KnownTopics },
};
