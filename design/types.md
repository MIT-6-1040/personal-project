# CatchUp application types

Every concept that needs a user gets the account that Authenticating returns, and a
session stands for that account. Topics are plain names like `FC Barcelona matches`,
shared by the stories and by the interests, so a story's topic and an interest match
when their names are the same. Reading history and the feed hold the stories that
StoryGrouping creates.

```types
concrete TopicName
  A short name for a specific subject, such as FC Barcelona matches or OPT employment rules.
```

```instances
instantiate Authenticating

instantiate CommonsConnecting

instantiate Sessioning with
  Subject is Authenticating.Account

instantiate StoryGrouping with
  Topic is TopicName

instantiate InterestTracking with
  User is Authenticating.Account
  Topic is TopicName

instantiate ReadingHistory with
  User is Authenticating.Account
  Story is StoryGrouping.Story

instantiate FeedCurating with
  User is Authenticating.Account
  Story is StoryGrouping.Story
```
