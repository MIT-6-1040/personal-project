# FeedCurating

## Purpose

Provides each user with stories that are most relevant to them and prevents users from spending time searching through less relevant stories.

## Principle

Every story the user should still see is scored by how much its topics count for them,
and the feed lists the highest scores first, so the most relevant news is at the top and
the user can stop scrolling as soon as the stories stop mattering to them.

For example, there are three stories: one about FC Barcelona matches, one about climate
change, and one about Barcelona that Alex has already read. Alex has FC Barcelona matches
with a count of 8. When his feed is generated, the read story is excluded, the unread
Barcelona story scores 8 and comes first, and the climate story scores 0 and comes after
it. The feed is saved, so Alex can page through it ten stories at a time in the same
order until it is generated again.

## Types

```types
external User
  The person the feed is for.

external Story
  Something that can appear in a feed.

opaque Candidates
  Every story that could appear, each with its topics and time.

opaque Weights
  The user's topics with how much each one counts.

opaque Excluded
  Stories that must be left out, such as ones already read.
```

## State

```state
a set of Entries with
  a user User
  a story Story
  a score Number
  a position Number
  unique user and story
```

## Actions

```actions
generate (user: User, candidates: Candidates, weights: Weights, excluded: Excluded) : returns (size: Number)
  where true
  then
    remove the user's old entries
    score each candidate that is not excluded by adding the weights of its topics
    add an entry for each, ordered by score from highest to lowest and then newest first
    returns size
```

## Queries

```queries
_feed (user: User) : many (story: Story, score: Number)
  Answers the user's last generated feed in ranked order, and no rows before one is generated.

_page (user: User, offset: Number, limit: Number) : many (story: Story, score: Number)
  Answers at most limit entries of the user's last generated feed, starting at position offset, in ranked order. No rows past the end, for a limit below 1, or before a feed is generated.
```
