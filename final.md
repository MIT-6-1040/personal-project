# CatchUp: Final Design

CatchUp gives each reader one feed of real news, where every card is one event (grouped
across outlets and summarized) ranked by specific interests the reader can see and adjust.

- **Live app:** https://catchup.mit-sdg.dev
- **Final video:** [CatchUp Final Demo](https://youtu.be/PIXC6_5pIrU)
- **Specs by version:** [P1](https://github.com/MIT-6-1040/personal-project/blob/733cf966970ecb5e2b8271e56fe17c747c9d616e/design.md#concept-design) ·
  [MVP](https://github.com/MIT-6-1040/personal-project/tree/ce94e063a38808ce2738042968d9dda42a9d0e71/design/concepts) ·
  [Beta](https://github.com/MIT-6-1040/personal-project/tree/258f32c29446c3771c2df8e19585de8507d11dd4/design/concepts) ·
  [Final](https://github.com/MIT-6-1040/personal-project/tree/4bf5ed9bba06687f26703cb724ab9914b106d2ac/design/concepts)

## The design in one picture

```
 RSS feeds ──► Claude editor ──► StoryGrouping ──────────┐
 (14 feeds)    (group, summarize,  (stories, articles,   │ _catalog
               pick topics)        topics)               ▼
                                                    FeedCurating ──► /feed
 Sign in ──► Authenticating ──► Sessioning              ▲   ▲
             (password/Commons)  (cookie session)       │   │ _readStories
                                                        │   │
             /stories/read ──► ReadingHistory.record ───┼───┘
                                    │                   │ _profile
                                    └─ InterestFollowsReading ─► InterestTracking
                                                                 (topic counts,
                                                                  edited on /interests)
```

The core loop from P1 survived unchanged: **read a story → record it → raise its topics →
rerank the feed.** Everything else was added around it.

## How the final design differs from P1

**Concepts**

- **StoryGrouping no longer decides similarity.** In P1, `addArticle` found a "sufficiently
  similar" story and wrote its summary. Now the caller passes a grouping key, headline,
  summary, and topics, and the concept only groups articles that share a key. The judgment
  moved to a separate news pipeline (below), so the concept stays deterministic and testable.
  It also gained `revise` (update the summary when another outlet joins), and limits on
  headline, summary, and topic count that double as a check on the AI's output.
- **FeedCurating is generic.** P1's `generate` took interests and read stories directly. It
  now takes opaque candidates, weights, and exclusions, filled in by the Feed composition,
  so no concept depends on another. It also keeps the ranked feed so later pages
  (`_page`) don't shift while the reader scrolls.
- **ReadingHistory** records _when_ a story was read, which powers the History page.
- **Three new concepts:** Authenticating (password or Commons accounts), Sessioning
  (cookie sessions), and CommonsConnecting (the class sign-in protocol).
- **Reads became queries.** P1's `topics`, `getStories`, `hasRead`, etc. are now `_` queries,
  so actions only ever change state.

**Reactions**

- P1's `requestFeedData` + `generateFeed` merged into the `/feed` endpoint.
- `updateInterests` kept its shape as `InterestFollowsReading`, with one rule made precise:
  **only the first read counts**, so reopening a story (e.g. from History) never inflates counts.

**News source**

- P1 assumed articles would arrive. The final app reads 14 RSS feeds from 9 outlets every
  hour and asks Claude, acting as an editor, to assign each article to an existing story or
  start a new one, write the summary, and reuse existing topic names. RSS was chosen because
  it is free, keyless, and unrestricted on a deployed site, unlike the news APIs I tried.

## How the final design differs from the P3 visual design

- **Kept:** one calm blue accent for links, active tabs, and buttons; white surfaces with gray
  text for stories; red/green/amber only for feedback; orange reserved for Commons sign-in.
- **Changed while building:**
  - A full-width header with icons and an underline for the current page replaced plain
    text links; on phones it collapses into a full-screen menu.
  - A profile button with the user's initial replaced the name-plus-sign-out link.
  - Gray placeholder cards replaced "Loading…", so the layout doesn't jump.
  - On phones, interests wrap onto two lines and "Remove" became a trash icon, because long
    topic names squeezed the buttons.
  - Inputs use 16px text so iPhones don't zoom in on them.

## Significant decisions in P4

- **Usernames match in any capitalization** (MVP feedback). `Desire` and `desire` are the same
  account, a second account differing only in case is refused, and the name is shown as
  registered. A case-insensitive unique index enforces this even for simultaneous sign-ups.
- **Access control reviewed endpoint by endpoint.**
  - The user always comes from the session, and no endpoint accepts a user ID, so one user
    can't read or change another's data.
  - The session only comes from an `HttpOnly` cookie; a session sent in the body is ignored.
  - Requests from other websites are refused (403).
  - Signing out deletes the session on the server, so a copied cookie stops working.
  - A wrong password and an unknown username get the same answer.
- **Integration tests** (MVP feedback) now drive the real HTTP handler, not just single
  concepts: the reading loop, persistence across sign-ins, every protected endpoint
  refusing visitors who aren't signed in, cross-user isolation, and the error code for each
  bad input. There are 51 tests in total ([output](tests/output.txt)).

## Known limitations

- **Ranking ignores age.** The score is the sum of the reader's topic counts, so an older
  matching story can outrank a newer one. Kept because the counts then fully explain the order.
- **Topics match by exact name.** `Barcelona` and `FC Barcelona matches` never match; the
  editor is told to reuse names, which mostly but not always works.
- **Grouping depends on the editor.** Claude occasionally splits one event into two stories.
- **No limit on sign-in attempts**, so passwords could be guessed by brute force.
- **Commons accounts have no password**, so they can't later sign in with one.

## Further reading

- [P1 design](design.md) · [MVP notes](mvp.md) · [Beta notes](beta.md) · [P4 working notes](p4-notes.md)
