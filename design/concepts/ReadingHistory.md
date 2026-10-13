# ReadingHistory

## Purpose

Remembers which stories a user has already read and prevents repeatedly showing the same stories to a user.

## Principle

After recording that a user read a story, that story is part of the user's reading history.

For example, Alex reads the Barcelona story and it is recorded. After that, the Barcelona story is
in Alex's history, and recording it again is refused. Stories Alex has not read are not
in his history.

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
```
