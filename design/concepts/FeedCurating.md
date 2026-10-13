# FeedCurating

## Purpose

Provides each user with stories that are most relevant to them and prevents users from spending time searching through less relevant stories.

## Principle

When a feed is generated for a user, relevant unread stories are ranked higher based on the user's interests.

For example, there are two unread stories, one about FC Barcelona matches and one about climate
change, and Alex has FC Barcelona matches with a count of 8. When Alex's feed is
generated, the Barcelona story comes first. A story Alex has already read is left out
of the feed.

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
```
