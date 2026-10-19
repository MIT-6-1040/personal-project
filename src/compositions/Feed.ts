import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { pageSize, validOffset } from "./paging.ts";

const { Sessioning, StoryGrouping, InterestTracking, ReadingHistory, FeedCurating } = concepts;

// One page of the ranked stories, each joined with what the feed card shows.
const PersonalFeed = former(
  "the personal feed of (user) from (offset)",
  ({ user, offset }, { story, score, headline, summary, image, publishedAt, topic }) =>
    each(FeedCurating._page({ user, offset, limit: pageSize }).is({ story, score }))
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
// and what they've read, then rank and answer the first page. A search or a source
// narrows the stories across the whole collection before they are ranked.
const ViewFeed = endpoint(
  "/feed",
  ({ session, search, source, user, catalog, profile, read }) =>
    receive({ session, search, source })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(
        where(
          StoryGrouping._catalog({ search, source }).is({ catalog }),
          InterestTracking._profile({ user }).is({ profile }),
          ReadingHistory._readStories({ user }).is({ stories: read }),
        )
          .then(FeedCurating.generate({ user, candidates: catalog, weights: profile, excluded: read }))
          .then(respond({ feed: PersonalFeed({ user, offset: 0 }) })),
      ),
  { input: { required: ["session"], defaults: { search: "", source: "" } } },
);

// Later pages come from the feed ranked on the visit, without ranking again,
// so stories don't shift or repeat while the user scrolls.
const MoreFeed = endpoint(
  "/feed/more",
  ({ session, user, offset }) =>
    receive({ session, offset })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(respond({ feed: PersonalFeed({ user, offset }) })),
  { input: { required: ["session", "offset"] }, validators: { input: validOffset } },
);

const KnownSources = former("every known source", (_input, { source }) =>
  each(StoryGrouping._sources({}).is({ source })).distinct(source),
);

// The outlets the feed can be filtered by.
const ListSources = endpoint(
  "/feed/sources",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(respond({ sources: KnownSources({}) })),
  { input: { required: ["session"] } },
);

export const composition = {
  Viewing: { ViewFeed, MoreFeed, PersonalFeed },
  Sources: { ListSources, KnownSources },
};
