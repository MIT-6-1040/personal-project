# CatchUp Beta

## Links

- **Live app:** https://catchup.mit-sdg.dev
- **Screen recording (2 minutes):** [CatchUp YouTube Video](https://youtu.be/iZD-DK6DTV4)
- **Visual design study:** [CatchUp_Visual_Design_Study.pdf](images/CatchUp_Visual_Design_Study.pdf)
- **Automated tests:** [how to run them](README.md#running-the-tests) and [saved output](tests/output.txt)
- **Concept specifications:** [design/concepts](design/concepts), composed in [design/compositions](design/compositions)

## User Journey

Alex, an MIT sophomore who follows FC Barcelona and the U.S. rules for OPT work after graduation, opens CatchUp and clicks **Sign in with Commons**. Commons asks him once whether CatchUp may see his name, username, and email, and after he allows it he lands on **Your Feed** without making a new password. The feed is real news from the last few days, pulled from outlets such as BBC Sport, The Guardian, ESPN, and the New York Times. Each card is one event, not one article: the story about Barcelona's Champions League match shows a single headline, a two-sentence summary, the topics `FC Barcelona matches` and `Champions League`, and the photo from the first outlet that reported it. Alex types "Barcelona" in the search bar to see every Barcelona story at once, then taps **BBC Sport** in the source filter to narrow it further. He opens the match story. The expanded story lists the BBC, ESPN, and Guardian articles, each linking to the outlet's own page, and he opens ESPN's to read the match report in full. Opening the story counts as reading it, so it is recorded and his counts for its topics go up. Back on the feed, that story is gone and the other Barcelona stories have moved up. A day later he wants the match report again, so he opens **History**, where it is at the top, read "1 day ago". On **Interests** he sees `La Liga table`, which CatchUp learned from his reading, lowers it with the minus button, and deletes a topic he no longer follows with the trash icon. He searches topics for "opt" and adds `OPT employment rules`. His next visit to the feed puts the stories about OPT and Barcelona first, without the ones he has already read, so he catches up in a few minutes.

**Stakeholders.** Readers like Alex get one feed for their own interests, with each event shown once. News organizations are still the source of everything CatchUp shows. Every story names the outlets that reported it and links to their articles, and the summary only gives the outline, so a reader who wants the full story goes to the outlet that wrote it.

## What Changed Since the MVP

### Real news instead of sample data

The MVP ran on hand-written stories. The beta reads 14 RSS feeds from 9 outlets ([src/news/feeds.ts](src/news/feeds.ts)). RSS is free, needs no key, has no rate limit, and gives each article's title, link, time, and usually a photo. The news APIs I looked at either can't be used on a deployed site on their free plan, delay articles by a day, or cover a single outlet, which would leave nothing to group. Feeds only go back a few days, so the first run takes up to 500 articles from the last 72 hours, and after that the backend checks every hour and adds at most 100 articles a day, which keeps the cost of the next step predictable.

Each batch of new articles goes to Claude, acting as an editor ([src/news/editor.ts](src/news/editor.ts)), along with the stories from the last three days. For every article it decides whether it reports the same specific event as an existing story or starts a new one. For a new story it writes a headline, a short summary, and 3 to 5 specific topics, reusing topic names that already exist so that stories and interests keep matching. For a story another outlet joins, it rewrites the summary to cover what the new article adds. StoryGrouping still only groups articles that share a key, so the concept stays deterministic and testable, and the pipeline ([src/news/ingest.ts](src/news/ingest.ts)) is tested with a stand-in editor instead of the real one. Runs never overlap, even across processes, and a batch that fails is tried again next hour.

### Concept changes

- **StoryGrouping** now refuses a headline over 100 characters, a summary over 400 characters or 60 words, and a story with no topics or more than 5. The limits keep every card readable and are also a check on what the editor writes. Its new `revise` action replaces a story's summary and topics when another outlet joins it, which answers what happens to a story when a new article arrives. The headline never changes, so a story doesn't jump around in the feed. A story keeps the first photo any of its articles brings, and has no photo if none of them has one.
- **FeedCurating** answers the saved feed ten stories at a time (`_page`). The first page ranks again, and later pages read the same saved ranking, so the stories already on screen never move or repeat while Alex scrolls. This is also the reason the concept keeps the ranked feed as state at all.
- **The feed can be searched and filtered by outlet.** StoryGrouping's catalog takes a search and a source and narrows every story in the collection, not just the ones already loaded. The matches are still ranked by Alex's interests.
- **ReadingHistory** gained `_readings`, which answers read stories with when each was read, ten at a time, for the new History page. Before this, a story disappeared for good once it was read.
- **Sign in with Commons.** A new concept, **CommonsConnecting**, follows Commons' contract for course apps: a new secret verifier for every sign-in, a one-time code redeemed only by our server, and a short-lived cookie that ties the sign-in to the browser that started it, so a link from someone else can't sign Alex in to the wrong account. **Authenticating** gained `connect`, which gives each Commons person the same account every time. Password accounts stay, because people outside the class can't use Commons.

### Interface changes

- A History page, and paging on every list instead of loading everything at once.
- A full-width header with icons for Home, History, and Interests and an underline on the current page. On phones it becomes a menu button that opens a full-screen menu.
- A profile button with the user's initial, which opens the username and Sign out, instead of a sign-out button with the name in the nav.
- Gray placeholder cards while pages load instead of "Loading…", so the layout doesn't jump.
- On phones, each interest takes two lines, so a long topic name no longer squeezes the buttons. Remove became a trash icon.
- Inputs use at least 16px text, because iPhones zoom into smaller inputs and don't zoom back out.
- A page title in each browser tab, a description for link previews, and an icon made from the logo.

## Responses to P1 Feedback

| Feedback | What changed |
|---|---|
| Methods that only read state should be queries | Done in P2: `_stories`, `_topics`, `_interests`, `_hasRead`, `_readStories`. The beta keeps that rule for the new `_page`, `_readings`, `_sources`, `_hasArticle`, and `_pending`. |
| `generate` gets no topics for each story | Done in P2: the catalog carries each story's topics into FeedCurating. |
| `increase` on a topic the user doesn't have | Done in P2: it adds the topic with a count of 1. |
| `requestFeedData` and `generateFeed` were redundant | Done in P2: they became the single `/feed` endpoint. |
| What happens to the summary and topics when an article joins a story | New `revise` action in StoryGrouping, used by the news pipeline whenever an outlet joins a story. |
| Principles restate the actions | Every principle now says how the concept achieves its purpose. For example, ReadingHistory explains that its history is what keeps read stories out of the feed. |
| When exactly a story counts as read | The first time it is opened, from the feed or from search. Opening it again, including from History, records nothing and doesn't raise any counts. |
| Stakeholders aren't connected to the journey | The journey above ends with how readers and news organizations each take part. |
| Comparables are too general | See below. |

**Comparables, revisited.** *Google News* builds a personalized "For you" feed and offers Full Coverage of a single story, but its feed still lists individual articles, so the same event can show up several times from different outlets, and its learned interests can't be seen or adjusted by count. *Ground News* is the closest to CatchUp's grouping: it collects every outlet's coverage of one story, but its purpose is comparing coverage and bias rather than following a few specific interests. *Apple News* and *SmartNews* personalize by followed channels and topic tabs, but a topic is broad, such as Sports, rather than as specific as Barcelona matches, and the reasons for the ranking aren't shown. For Alex, CatchUp combines one card per event with specific topics whose counts he can see and change, so he isn't scrolling past repeats or unrelated sports news.

## Testing

**Automated.** 37 tests cover every concept action and the news pipeline: each concept's principle, other scenarios such as repeated actions, deletions, and paging, and error cases that check both the refusal and that nothing changed. The [README](README.md#running-the-tests) explains how to run them, and [tests/output.txt](tests/output.txt) is the saved output.

**Checks against the real services.** Before the first full run, one batch of 8 real articles went to Claude without saving anything. It grouped 4 articles from BBC Sport, The Guardian, and ESPN about the same match into one story, kept every headline and summary within the limits, and gave each story 3 or 4 specific topics. The first full run turned 290 articles into 204 stories, 39 of them with more than one outlet. Sign in with Commons was tried locally against the real Commons.

## Known Limitations

- **Ranking ignores age.** A story's score is only the sum of the user's counts for its topics, so an older story with matching topics can rank above a newer one. A time cutoff or a decay would fix it, at the cost of making the counts a less direct explanation of the order.
- **Grouping depends on the editor.** Claude occasionally splits one event into two stories or gives a story only 2 topics. The length limits catch output that is too long, but not a wrong grouping.
- **Topics match by exact name.** The editor is told to reuse existing names, but `Barcelona` and `FC Barcelona matches` would still never match.
- **A Commons account has no password**, so a classmate who signs in with Commons can't later sign in with a password instead.
