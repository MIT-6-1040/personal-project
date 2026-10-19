# ReadingHistory

## Purpose

Remembers which stories a user has already read and prevents repeatedly showing the same stories to a user.

## Principle

Each story is recorded the first time the user reads it, and the stories in their
history are the ones left out of what they are shown next, so the same news does not
come back after it has been read.

For example, Alex opens the story about Barcelona beating Napoli, which counts as reading
it, so it is recorded with the time he read it. When Alex's feed is ranked again, the
stories he has read are excluded, so the Barcelona story is gone while the Sevilla story
he has not read is still there. Opening the Barcelona story again from his history
records nothing new, since recording a story twice is refused.

## Types

```types
external User
  The person who reads.

external Story
  Something that can be read.

opaque StoryList
  A list of stories, in one value.
```

## State

```state
a set of Readings with
  a user User
  a story Story
  a readAt DateTime
  unique user and story
```

## Actions

```actions
record (user: User, story: Story) : returns (reading: Reading)
  where user has already read story
  then
    refuses ALREADY_READ "You have already read this story."
  where user has not read story
  then
    add a new reading for user and story at the current time
    returns reading
```

## Queries

```queries
_hasRead (user: User, story: Story) : one (read: Flag)
  Answers whether the user has read the story, and false for an unknown user or story.

_readStories (user: User) : one (stories: StoryList)
  Answers every story the user has read in one list, most recent first, empty when there are none.

_readings (user: User, offset: Number, limit: Number) : many (story: Story, readAt: DateTime)
  Answers at most limit of the stories the user has read, with when they read each one, most recent first and skipping the first offset. No rows past the end, for a limit below 1, or when there are none.
```
