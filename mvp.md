# CatchUp MVP

## User Journey

Alex, an MIT student who follows FC Barcelona and U.S. OPT employment rules, registers for CatchUp and lands on **Your Feed**. Every story there is one event reported by several outlets, shown with a single headline, a short summary, and its topics. Alex opens the story about Barcelona beating Napoli. The **expanded story** shows the full summary and links to BBC Sport, ESPN, and Marca, and opening it records the story as read, which quietly raises Alex's count for `FC Barcelona matches` and `Champions League`. Back on the feed, that story is gone and the other Barcelona stories have moved up. Alex then opens **My Interests**, sees the topics CatchUp has learned from his reading, and uses the minus button to lower `Champions League`. On **Search Topics** he types "opt" and adds `OPT employment rules`. When he returns to the feed, the OPT rule-change stories are near the top and the stories he already read are not shown, so he catches up on what he cares about without scrolling past unrelated or repeated news.

## Design Notes

### Plan

The P1 design had four concepts (StoryGrouping, InterestTracking, ReadingHistory, FeedCurating) and one core loop: **read a story → record it → raise interest in its topics → rerank the feed**. The P2 plan was to get that loop working from start to finish on real infrastructure before working on where the news comes from. In order, I:

1. Turned each P1 concept into a full spec under [design/concepts](design/concepts), with refusals, queries, and a worked principle. Then I implemented and tested each one by itself ([tests/concepts](tests/concepts)).
2. Wrote the compositions in [design/compositions](design/compositions) (Sessions, Feed, Stories, Interests) and implemented them as sync-engine endpoints and reactions in [src/compositions](src/compositions).
3. Built the four screens from the P1 sketches in Vue: Feed, Expanded Story, My Interests, and Add Interest.
4. Filled the database with hand-written sample stories ([scripts/seed.ts](scripts/seed.ts)) so the loop could be demonstrated before the news pipeline exists.

### Significant Decisions

- **The AI is kept out of StoryGrouping.** In P1, `addArticle` itself found a "sufficiently similar" story and generated the summary and topics. In the MVP, the caller passes in a grouping `key`, the headline, the summary, and the topics. StoryGrouping only stores articles and groups the ones that share a key. This keeps the concept deterministic and testable. Deciding which story an article belongs to and summarizing it is the job of the P3 pipeline, which will compute those arguments before calling `addArticle`.
- **FeedCurating knows nothing about interests or reading.** In P1, `generate` took the user's interests map and read stories directly. It now takes generic `Candidates`, `Weights`, and `Excluded` values. The Feed composition fills those from StoryGrouping's `_catalog`, InterestTracking's `_profile`, and ReadingHistory's `_readStories`. FeedCurating can be reused with other kinds of weights, and none of the three concepts depend on each other.
- **Ranking is simple and easy to explain.** A story's score is the sum of the user's counts for its topics. Ties are broken newest first, and stories already read are left out. Because of this, the counts on My Interests directly explain the order of the feed, which matters since readers distrust personalization they cannot see or control.
- **Topics are matched by exact name.** A topic is a plain name (`TopicName` in [design/types.md](design/types.md)) shared by stories and interests. A story matches an interest only if the names are identical. To make that workable, Add Interest searches the topics stories already use, and it still lets the user type a new topic for news that hasn't arrived yet.
- **Only the first read counts.** Opening a story you have already read shows it again but does not record a second reading, so re-reading never inflates interest counts (see the `first-read` and `reread` branches in [src/compositions/Stories.ts](src/compositions/Stories.ts)).
- **The feed is regenerated on every visit** instead of being updated by reactions, so it always reflects the latest reads and interest edits.

### Design Changes from P1

- **Added Authenticating and Sessioning.** P1 assumed an "authenticated user." The MVP has username/password accounts and cookie-based sessions. Every endpoint resolves the session to the account first, so no request can act on another user's interests or history.
- **Separated actions from queries.** P1 actions like `topics`, `getStories`, `hasRead`, `getReadStories`, and `getInterests` are now queries (`_topics`, `_stories`, `_hasRead`, `_readStories`, `_interests`). The action lists now only contain operations that change state.
- **StoryGrouping got richer state.** Stories now have a headline, image, and unique key. Articles have their own source, title, unique URL, and publish time. Adding the same URL twice is refused with `DUPLICATE_ARTICLE`.
- **InterestTracking is more fully specified.** `increase` now adds a missing topic with a count of 1, which is how reading teaches the app new topics. `add` and `setCount` check that the topic is 1–100 characters and the count is a whole number from 0 to 1000.
- **ReadingHistory records when** a story was read (`readAt`) and refuses duplicate records.
- **P1's `Requesting` reactions became endpoints** (`/feed`, `/stories/read`, `/interests/*`, `/auth/*`). The `updateInterests` reaction kept its P1 shape as `InterestFollowsReading`.

### Challenges

- **Story similarity without an LLM.** In P1, "sufficiently similar" was left vague, and it is hard to do well without a language model. Grouping by an explicit key lets the MVP show the multi-source behavior now and leaves the real decision to P3.
- **Topic naming.** Matching by exact name only works if stories and users use the same names. `FC Barcelona matches` and `Barcelona` would never match. Searching existing topics helps for now, but P3's extraction step needs to choose topic names consistently.
- **Keeping concepts independent.** It would have been easy for FeedCurating to read the other concepts' state directly. Passing opaque values through the Feed composition took more design work but kept each concept testable by itself.

### Interesting Moments

- With interests learned from reading, the app needed no setup screen. A new user's feed just starts out newest first, and after one or two reads it already reorders around them.
- Because `increase` creates missing topics, reading a story can add an interest the user never chose (for example, `La Liga` from a Barcelona match). That is useful, but it is also why being able to lower or remove interests on My Interests matters.

### Remaining for P3

- **Real news ingestion.** Pull articles from news sites and other platforms (RSS feeds and news APIs) on a schedule, replacing the seed script.
- **LLM processing for each article:**
  - decide which existing story it belongs to, or start a new one (this produces the grouping `key`);
  - write the story's summary, and update it as more sources arrive;
  - extract the story's specific topics, reusing existing topic names where possible.
- **Ranking refinements** if needed after real data arrives, such as favoring recent stories and capping how much one topic can dominate the feed.
- **Deployment.** Package the backend and frontend as containers alongside Mongo.
