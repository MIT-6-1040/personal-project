# InterestTracking

## Purpose

Tracks how strongly a user is interested in different topics and allows interests to adapt from reading while remaining under user control.

## Principle

After recording interest in a topic for a user, that topic's count reflects the user's interest in it.

For example, Alex adds OPT employment rules with a count of 3. Each time interest in FC Barcelona
matches is increased for Alex, its count goes up by one, starting from 1 the first
time. Alex sets OPT employment rules to 5, then removes FC Barcelona matches, and only
OPT employment rules is left with a count of 5. After Alex resets, he has no topics.

## Types

```types
external User
  The person whose interests are tracked.

external Topic
  A subject the person can be interested in.

opaque Profile
  All of one user's topics with their counts, in one value.
```

## State

```state
a set of Interests with
  a user User
  a topic Topic
  a count Number
  unique user and topic
```

## Actions

```actions
increase (user: User, topic: Topic) : returns (count: Number)
  where user has topic
  then
    add 1 to its count
    returns count
  where user does not have topic
  then
    add topic for user with a count of 1
    returns count

add (user: User, topic: Topic, count: Number) : returns (count: Number)
  where topic is blank or longer than 100 characters
  then
    refuses INVALID_TOPIC "A topic must have 1 to 100 characters."
  where count is not a whole number from 0 to 1000
  then
    refuses INVALID_COUNT "A count must be a whole number from 0 to 1000."
  where user already has topic
  then
    refuses TOPIC_ALREADY_ADDED "That topic is already in your interests."
  where user does not have topic
  then
    add topic for user with count
    returns count

setCount (user: User, topic: Topic, count: Number) : returns (count: Number)
  where count is not a whole number from 0 to 1000
  then
    refuses INVALID_COUNT "A count must be a whole number from 0 to 1000."
  where user does not have topic
  then
    refuses TOPIC_NOT_FOUND "That topic is not in your interests."
  where user has topic
  then
    change its count to count
    returns count

remove (user: User, topic: Topic) : returns (topic: Topic)
  where user does not have topic
  then
    refuses TOPIC_NOT_FOUND "That topic is not in your interests."
  where user has topic
  then
    remove topic for user
    returns topic

reset (user: User) : returns (removed: Number)
  where true
  then
    remove every topic for user
    returns removed
```

## Queries

```queries
_interests (user: User) : many (topic: Topic, count: Number)
  Answers the user's topics, highest count first and then alphabetically. No rows when the user has none.

_profile (user: User) : one (profile: Profile)
  Answers all of the user's topics with their counts in one value, empty when the user has none.
```
