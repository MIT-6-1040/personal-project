# Feed

[Viewing the feed](reaction:Feed.Viewing.ViewFeed) gathers three things for the
signed-in user: every story with its topics, the user's interest counts, and the stories
they have already read. FeedCurating ranks the unread stories with those, and the answer
is the first page of [the personalized feed](former:Feed.Viewing.PersonalFeed), where
each story comes with its headline, summary, image, time, and topics. A page holds ten
stories.

The feed is ranked again on every visit, so it always reflects the latest reading and
interest changes.

The user can also give a search and a source. A search keeps only the stories whose
headline or summary contains every word of it, and a source keeps only the stories with
an article from that outlet. Both look through every story in the collection, not just
the ones already on screen, and the matches are then ranked by the user's interests in
the same way. A blank search or source leaves that filter off.

```endpoints
Feed.Viewing.ViewFeed at /feed
```

As the user scrolls to the bottom, the page asks for
[more of the feed](reaction:Feed.Viewing.MoreFeed) from where it left off. Later pages
come from the ranking saved on the visit instead of ranking again, so stories already on
screen never move or repeat. A page with fewer than ten stories means the feed has
ended. An offset that is not a whole number of 0 or more is refused as invalid input.

```endpoints
Feed.Viewing.MoreFeed at /feed/more
```

The source filters come from [listing the sources](reaction:Feed.Sources.ListSources),
which answers [every outlet](former:Feed.Sources.KnownSources) that has an article, in
alphabetical order.

```endpoints
Feed.Sources.ListSources at /feed/sources
```
