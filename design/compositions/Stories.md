# Stories

Every endpoint here first resolves the session to the signed-in account, so a request
can never act for another user.

Opening a story [reads it](reaction:Stories.Reading.ReadStory). The first time a user
opens a story it is recorded in their reading history. Opening it again just shows it
without recording anything, so re-reading does not count twice. A story that does not
exist answers `STORY_NOT_FOUND`. Otherwise the answer is the
[expanded story](former:Stories.Reading.ExpandedStory): the headline, summary, topics,
and every original source with its link.

```endpoints
Stories.Reading.ReadStory at /stories/read
```

When a reading is recorded, [interest grows](reaction:Stories.Learning.InterestFollowsReading)
by one for each topic of the story. This is how the app learns what a user cares about.

The Add Interest page searches [every known topic](former:Stories.Topics.KnownTopics),
which [anyone signed in can list](reaction:Stories.Topics.ListTopics).

```endpoints
Stories.Topics.ListTopics at /topics/list
```
