<!-- Generated from the CatchUp assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# CatchUp — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `register(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_USERNAME`: A username must have 3 to 32 letters, numbers, underscores, or hyphens.
  - Refuses `WEAK_PASSWORD`: A password must have 8 to 128 characters.
  - Refuses `USERNAME_TAKEN`: That username is already taken.
- `authenticate(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.
- `connect(person: String, username: String) : returns (account: Account)`
  - Refuses `INVALID_PERSON`: That Commons account could not be read.

#### Queries

- `_username(account: Account) : optional (username: String)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [CatchUp application types](../design/types.md), line 15.

### CommonsConnecting

Defined in [CommonsConnecting](../design/concepts/CommonsConnecting.md), line 1.

#### Actions

- `begin() : returns (attempt: Attempt, url: String, expiresAt: DateTime)`
- `complete(attempt: Attempt, state: String, code: String) : returns (person: String, username: String, displayName: String, email: String)`
  - Refuses `UNKNOWN_ATTEMPT`: This sign-in has expired. Please try again.
  - Refuses `COMMONS_REFUSED`: Commons could not confirm this sign-in. Please try again.

#### Queries

- `_pending(attempt: Attempt) : optional (expiresAt: DateTime)`

#### Instances

- `CommonsConnecting` — instance of `CommonsConnecting` — [CatchUp application types](../design/types.md), line 17.

### FeedCurating

Defined in [FeedCurating](../design/concepts/FeedCurating.md), line 1.

#### Actions

- `generate(user: User, candidates: Candidates, weights: Weights, excluded: Excluded) : returns (size: Number)`

#### Queries

- `_feed(user: User) : many (story: Story, score: Number)`
- `_page(user: User, offset: Number, limit: Number) : many (story: Story, score: Number)`

#### Instances

- `FeedCurating` — instance of `FeedCurating` — [CatchUp application types](../design/types.md), line 33.
  - `Story` is `StoryGrouping.Story` — [CatchUp application types](../design/types.md), line 35.
  - `User` is `Authenticating.Account` — [CatchUp application types](../design/types.md), line 34.

### InterestTracking

Defined in [InterestTracking](../design/concepts/InterestTracking.md), line 1.

#### Actions

- `increase(user: User, topic: Topic) : returns (count: Number)`
- `add(user: User, topic: Topic, count: Number) : returns (count: Number)`
  - Refuses `INVALID_TOPIC`: A topic must have 1 to 100 characters.
  - Refuses `INVALID_COUNT`: A count must be a whole number from 0 to 1000.
  - Refuses `TOPIC_ALREADY_ADDED`: That topic is already in your interests.
- `setCount(user: User, topic: Topic, count: Number) : returns (count: Number)`
  - Refuses `INVALID_COUNT`: A count must be a whole number from 0 to 1000.
  - Refuses `TOPIC_NOT_FOUND`: That topic is not in your interests.
- `remove(user: User, topic: Topic) : returns (topic: Topic)`
  - Refuses `TOPIC_NOT_FOUND`: That topic is not in your interests.
- `reset(user: User) : returns (removed: Number)`

#### Queries

- `_interests(user: User) : many (topic: Topic, count: Number)`
- `_profile(user: User) : one (profile: Profile)`

#### Instances

- `InterestTracking` — instance of `InterestTracking` — [CatchUp application types](../design/types.md), line 25.
  - `Topic` is `TopicName` — [CatchUp application types](../design/types.md), line 27.
  - `User` is `Authenticating.Account` — [CatchUp application types](../design/types.md), line 26.

### ReadingHistory

Defined in [ReadingHistory](../design/concepts/ReadingHistory.md), line 1.

#### Actions

- `record(user: User, story: Story) : returns (reading: Reading)`
  - Refuses `ALREADY_READ`: You have already read this story.

#### Queries

- `_hasRead(user: User, story: Story) : one (read: Flag)`
- `_readStories(user: User) : one (stories: StoryList)`
- `_readings(user: User, offset: Number, limit: Number) : many (story: Story, readAt: DateTime)`

#### Instances

- `ReadingHistory` — instance of `ReadingHistory` — [CatchUp application types](../design/types.md), line 29.
  - `Story` is `StoryGrouping.Story` — [CatchUp application types](../design/types.md), line 31.
  - `User` is `Authenticating.Account` — [CatchUp application types](../design/types.md), line 30.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `current(session: Session) : returns (subject: Subject)`
  - Refuses `UNKNOWN_SESSION`: You are not signed in.
- `end(session: Session) : returns (ended: Flag)`
  - Refuses `UNKNOWN_SESSION`: You are not signed in.

#### Queries

- `_active(session: Session) : optional (subject: Subject, expiresAt: DateTime)`

#### Instances

- `Sessioning` — instance of `Sessioning` — [CatchUp application types](../design/types.md), line 19.
  - `Subject` is `Authenticating.Account` — [CatchUp application types](../design/types.md), line 20.

### StoryGrouping

Defined in [StoryGrouping](../design/concepts/StoryGrouping.md), line 1.

#### Actions

- `addArticle(key: String, headline: String, summary: String, image: String, topics: TopicList, source: String, title: String, url: String, publishedAt: DateTime) : returns (article: Article, story: Story)`
  - Refuses `INVALID_HEADLINE`: A headline must have 1 to 100 characters.
  - Refuses `INVALID_SUMMARY`: A summary must have 1 to 400 characters and at most 60 words.
  - Refuses `INVALID_TOPICS`: A story needs 1 to 5 topics of 1 to 100 characters each.
  - Refuses `DUPLICATE_ARTICLE`: That article has already been added.
- `revise(story: Story, summary: String, topics: TopicList) : returns (story: Story)`
  - Refuses `STORY_NOT_FOUND`: That story does not exist.
  - Refuses `INVALID_SUMMARY`: A summary must have 1 to 400 characters and at most 60 words.
  - Refuses `INVALID_TOPICS`: A story needs 1 to 5 topics of 1 to 100 characters each.

#### Queries

- `_stories() : many (story: Story, key: String, headline: String, summary: String, image: String, publishedAt: DateTime)`
- `_get(story: Story) : optional (headline: String, summary: String, image: String, publishedAt: DateTime)`
- `_articles(story: Story) : many (article: Article, source: String, title: String, url: String, publishedAt: DateTime)`
- `_hasArticle(url: String) : one (added: Flag)`
- `_topics(story: Story) : many (topic: Topic)`
- `_allTopics() : many (topic: Topic)`
- `_sources() : many (source: String)`
- `_catalog(search: String, source: String) : one (catalog: Catalog)`

#### Instances

- `StoryGrouping` — instance of `StoryGrouping` — [CatchUp application types](../design/types.md), line 22.
  - `Topic` is `TopicName` — [CatchUp application types](../design/types.md), line 23.

## Application types

Concrete types:

- `TopicName` — [CatchUp application types](../design/types.md), line 10.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### every known source

Authored path: `Feed.Sources.KnownSources`.
- Covered by [Feed](../design/compositions/Feed.md), line 34.

```former
Former "every known source" — inputs (); bindings (source); promises exactly one record — forms:
  the distinct source of each StoryGrouping._sources () has (source)
```

### every known topic

Authored path: `Stories.Topics.KnownTopics`.
- Covered by [Stories](../design/compositions/Stories.md), line 20.

```former
Former "every known topic" — inputs (); bindings (topic); promises exactly one record — forms:
  the distinct topic of each StoryGrouping._allTopics () has (topic)
```

### the expanded story (story)

Authored path: `Stories.Reading.ExpandedStory`.
- Covered by [Stories](../design/compositions/Stories.md), line 10.

```former
Former "the expanded story (story)" — inputs (story); bindings (headline, summary, image, publishedAt, topic, article, source, title, url, articleTime); promises exactly one record — forms:
  a record of
    where StoryGrouping._get (story) has (headline, image, publishedAt, summary)
    headline
    image
    publishedAt
    sources: each StoryGrouping._articles (story) has (article, publishedAt: articleTime, source, title, url)
      form a record of
        article
        publishedAt: articleTime
        source
        title
        url
    story
    summary
    topics: the distinct topic of each StoryGrouping._topics (story) has (topic)
```

### the interests of (user)

Authored path: `Interests.Viewing.MyInterests`.
- Covered by [Interests](../design/compositions/Interests.md), line 6.

```former
Former "the interests of (user)" — inputs (user); bindings (topic, count); promises exactly one record — forms:
  each InterestTracking._interests (user) has (count, topic)
    form a record of
      count
      topic
```

### the personal feed of (user) from (offset)

Authored path: `Feed.Viewing.PersonalFeed`.
- Covered by [Feed](../design/compositions/Feed.md), line 6.

```former
Former "the personal feed of (user) from (offset)" — inputs (user, offset); bindings (story, score, headline, summary, image, publishedAt, topic); promises exactly one record — forms:
  each FeedCurating._page (limit: 10, offset, user) has (score, story)
    where StoryGrouping._get (story) has (headline, image, publishedAt, summary)
    form a record of
      headline
      image
      publishedAt
      score
      story
      summary
      topics: the distinct topic of each StoryGrouping._topics (story) has (topic)
```

### the reading history of (user) from (offset)

Authored path: `History.Viewing.ReadingList`.
- Covered by [History](../design/compositions/History.md), line 5.

```former
Former "the reading history of (user) from (offset)" — inputs (user, offset); bindings (story, readAt, headline, summary, image, publishedAt, topic); promises exactly one record — forms:
  each ReadingHistory._readings (limit: 10, offset, user) has (readAt, story)
    where StoryGrouping._get (story) has (headline, image, publishedAt, summary)
    form a record of
      headline
      image
      publishedAt
      readAt
      story
      summary
      topics: the distinct topic of each StoryGrouping._topics (story) has (topic)
```

## Reactions

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### Feed.Sources.ListSources

Authored path: `Feed.Sources.ListSources`.
- Covered by [Feed](../design/compositions/Feed.md), line 33.
- Covered by [Feed](../design/compositions/Feed.md), line 38.

```reaction
when RequestBoundary.request (path: "/feed/sources", requestId, session)
then
  Sessioning.current (session)
```

### Feed.Sources.ListSources#2

Authored path: `Feed.Sources.ListSources`.
- Covered by [Feed](../design/compositions/Feed.md), line 33.
- Covered by [Feed](../design/compositions/Feed.md), line 38.

```reaction
when Sessioning.current (session, subject: user), asked by Feed.Sources.ListSources
where
  earlier, RequestBoundary.request (path: "/feed/sources", requestId, session)
then
  RequestBoundary.respond (requestId, sources: former "every known source")
```

### Feed.Viewing.MoreFeed

Authored path: `Feed.Viewing.MoreFeed`.
- Covered by [Feed](../design/compositions/Feed.md), line 24.
- Covered by [Feed](../design/compositions/Feed.md), line 30.

```reaction
when RequestBoundary.request (offset, path: "/feed/more", requestId, session)
then
  Sessioning.current (session)
```

### Feed.Viewing.MoreFeed#2

Authored path: `Feed.Viewing.MoreFeed`.
- Covered by [Feed](../design/compositions/Feed.md), line 24.
- Covered by [Feed](../design/compositions/Feed.md), line 30.

```reaction
when Sessioning.current (session, subject: user), asked by Feed.Viewing.MoreFeed
where
  earlier, RequestBoundary.request (offset, path: "/feed/more", requestId, session)
then
  RequestBoundary.respond (feed: former "the personal feed of (user) from (offset)" with (offset, user), requestId)
```

### Feed.Viewing.ViewFeed

Authored path: `Feed.Viewing.ViewFeed`.
- Covered by [Feed](../design/compositions/Feed.md), line 3.
- Covered by [Feed](../design/compositions/Feed.md), line 20.

```reaction
when RequestBoundary.request (path: "/feed", requestId, search, session, source)
then
  Sessioning.current (session)
```

### Feed.Viewing.ViewFeed#2

Authored path: `Feed.Viewing.ViewFeed`.
- Covered by [Feed](../design/compositions/Feed.md), line 3.
- Covered by [Feed](../design/compositions/Feed.md), line 20.

```reaction
when Sessioning.current (session, subject: user), asked by Feed.Viewing.ViewFeed
where
  InterestTracking._profile (user) has (profile)
  ReadingHistory._readStories (user) has (stories: read)
  earlier, RequestBoundary.request (path: "/feed", requestId, search, session, source)
  StoryGrouping._catalog (search, source) has (catalog)
then
  FeedCurating.generate (candidates: catalog, excluded: read, user, weights: profile)
```

### Feed.Viewing.ViewFeed#3

Authored path: `Feed.Viewing.ViewFeed`.
- Covered by [Feed](../design/compositions/Feed.md), line 3.
- Covered by [Feed](../design/compositions/Feed.md), line 20.

```reaction
when FeedCurating.generate (candidates: catalog, excluded: read, user, weights: profile), asked by Feed.Viewing.ViewFeed#2
where
  earlier, RequestBoundary.request (path: "/feed", requestId, search, session, source)
then
  RequestBoundary.respond (feed: former "the personal feed of (user) from (offset)" with (offset: 0, user), requestId)
```

### History.Viewing.ViewHistory

Authored path: `History.Viewing.ViewHistory`.
- Covered by [History](../design/compositions/History.md), line 4.
- Covered by [History](../design/compositions/History.md), line 19.

```reaction
when RequestBoundary.request (offset, path: "/history", requestId, session)
then
  Sessioning.current (session)
```

### History.Viewing.ViewHistory#2

Authored path: `History.Viewing.ViewHistory`.
- Covered by [History](../design/compositions/History.md), line 4.
- Covered by [History](../design/compositions/History.md), line 19.

```reaction
when Sessioning.current (session, subject: user), asked by History.Viewing.ViewHistory
where
  earlier, RequestBoundary.request (offset, path: "/history", requestId, session)
then
  RequestBoundary.respond (history: former "the reading history of (user) from (offset)" with (offset, user), requestId)
```

### Interests.Changing.AddInterest

Authored path: `Interests.Changing.AddInterest`.
- Covered by [Interests](../design/compositions/Interests.md), line 12.
- Covered by [Interests](../design/compositions/Interests.md), line 18.

```reaction
when RequestBoundary.request (count, path: "/interests/add", requestId, session, topic)
then
  Sessioning.current (session)
```

### Interests.Changing.AddInterest#2

Authored path: `Interests.Changing.AddInterest`.
- Covered by [Interests](../design/compositions/Interests.md), line 12.
- Covered by [Interests](../design/compositions/Interests.md), line 18.

```reaction
when Sessioning.current (session, subject: user), asked by Interests.Changing.AddInterest
where
  earlier, RequestBoundary.request (count, path: "/interests/add", requestId, session, topic)
then
  InterestTracking.add (count, topic, user)
```

### Interests.Changing.AddInterest#3

Authored path: `Interests.Changing.AddInterest`.
- Covered by [Interests](../design/compositions/Interests.md), line 12.
- Covered by [Interests](../design/compositions/Interests.md), line 18.

```reaction
when InterestTracking.add (count, topic, user), asked by Interests.Changing.AddInterest#2
where
  earlier, RequestBoundary.request (count, path: "/interests/add", requestId, session, topic)
then
  RequestBoundary.respond (interests: former "the interests of (user)" with (user), requestId)
```

### Interests.Changing.RemoveInterest

Authored path: `Interests.Changing.RemoveInterest`.
- Covered by [Interests](../design/compositions/Interests.md), line 14.
- Covered by [Interests](../design/compositions/Interests.md), line 20.

```reaction
when RequestBoundary.request (path: "/interests/remove", requestId, session, topic)
then
  Sessioning.current (session)
```

### Interests.Changing.RemoveInterest#2

Authored path: `Interests.Changing.RemoveInterest`.
- Covered by [Interests](../design/compositions/Interests.md), line 14.
- Covered by [Interests](../design/compositions/Interests.md), line 20.

```reaction
when Sessioning.current (session, subject: user), asked by Interests.Changing.RemoveInterest
where
  earlier, RequestBoundary.request (path: "/interests/remove", requestId, session, topic)
then
  InterestTracking.remove (topic, user)
```

### Interests.Changing.RemoveInterest#3

Authored path: `Interests.Changing.RemoveInterest`.
- Covered by [Interests](../design/compositions/Interests.md), line 14.
- Covered by [Interests](../design/compositions/Interests.md), line 20.

```reaction
when InterestTracking.remove (topic, user), asked by Interests.Changing.RemoveInterest#2
where
  earlier, RequestBoundary.request (path: "/interests/remove", requestId, session, topic)
then
  RequestBoundary.respond (interests: former "the interests of (user)" with (user), requestId)
```

### Interests.Changing.ResetInterests

Authored path: `Interests.Changing.ResetInterests`.
- Covered by [Interests](../design/compositions/Interests.md), line 15.
- Covered by [Interests](../design/compositions/Interests.md), line 21.

```reaction
when RequestBoundary.request (path: "/interests/reset", requestId, session)
then
  Sessioning.current (session)
```

### Interests.Changing.ResetInterests#2

Authored path: `Interests.Changing.ResetInterests`.
- Covered by [Interests](../design/compositions/Interests.md), line 15.
- Covered by [Interests](../design/compositions/Interests.md), line 21.

```reaction
when Sessioning.current (session, subject: user), asked by Interests.Changing.ResetInterests
then
  InterestTracking.reset (user)
```

### Interests.Changing.ResetInterests#3

Authored path: `Interests.Changing.ResetInterests`.
- Covered by [Interests](../design/compositions/Interests.md), line 15.
- Covered by [Interests](../design/compositions/Interests.md), line 21.

```reaction
when InterestTracking.reset (user), asked by Interests.Changing.ResetInterests#2
where
  earlier, RequestBoundary.request (path: "/interests/reset", requestId, session)
then
  RequestBoundary.respond (interests: former "the interests of (user)" with (user), requestId)
```

### Interests.Changing.SetCount

Authored path: `Interests.Changing.SetCount`.
- Covered by [Interests](../design/compositions/Interests.md), line 13.
- Covered by [Interests](../design/compositions/Interests.md), line 19.

```reaction
when RequestBoundary.request (count, path: "/interests/set-count", requestId, session, topic)
then
  Sessioning.current (session)
```

### Interests.Changing.SetCount#2

Authored path: `Interests.Changing.SetCount`.
- Covered by [Interests](../design/compositions/Interests.md), line 13.
- Covered by [Interests](../design/compositions/Interests.md), line 19.

```reaction
when Sessioning.current (session, subject: user), asked by Interests.Changing.SetCount
where
  earlier, RequestBoundary.request (count, path: "/interests/set-count", requestId, session, topic)
then
  InterestTracking.setCount (count, topic, user)
```

### Interests.Changing.SetCount#3

Authored path: `Interests.Changing.SetCount`.
- Covered by [Interests](../design/compositions/Interests.md), line 13.
- Covered by [Interests](../design/compositions/Interests.md), line 19.

```reaction
when InterestTracking.setCount (count, topic, user), asked by Interests.Changing.SetCount#2
where
  earlier, RequestBoundary.request (count, path: "/interests/set-count", requestId, session, topic)
then
  RequestBoundary.respond (interests: former "the interests of (user)" with (user), requestId)
```

### Interests.Viewing.ListInterests

Authored path: `Interests.Viewing.ListInterests`.
- Covered by [Interests](../design/compositions/Interests.md), line 5.
- Covered by [Interests](../design/compositions/Interests.md), line 9.

```reaction
when RequestBoundary.request (path: "/interests/list", requestId, session)
then
  Sessioning.current (session)
```

### Interests.Viewing.ListInterests#2

Authored path: `Interests.Viewing.ListInterests`.
- Covered by [Interests](../design/compositions/Interests.md), line 5.
- Covered by [Interests](../design/compositions/Interests.md), line 9.

```reaction
when Sessioning.current (session, subject: user), asked by Interests.Viewing.ListInterests
where
  earlier, RequestBoundary.request (path: "/interests/list", requestId, session)
then
  RequestBoundary.respond (interests: former "the interests of (user)" with (user), requestId)
```

### Sessions.Commons.FinishCommons

Authored path: `Sessions.Commons.FinishCommons`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 20.
- Covered by [Sessions](../design/compositions/Sessions.md), line 31.

```reaction
when RequestBoundary.request (attempt, code, path: "/auth/commons/finish", requestId, state)
then
  CommonsConnecting.complete (attempt, code, state)
```

### Sessions.Commons.FinishCommons#2

Authored path: `Sessions.Commons.FinishCommons`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 20.
- Covered by [Sessions](../design/compositions/Sessions.md), line 31.

```reaction
when CommonsConnecting.complete (attempt, code, state, person, username: commonsName), asked by Sessions.Commons.FinishCommons
then
  Authenticating.connect (person, username: commonsName)
```

### Sessions.Commons.FinishCommons#3

Authored path: `Sessions.Commons.FinishCommons`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 20.
- Covered by [Sessions](../design/compositions/Sessions.md), line 31.

```reaction
when Authenticating.connect (person, username: commonsName, account), asked by Sessions.Commons.FinishCommons#2
then
  Sessioning.start (subject: account)
```

### Sessions.Commons.FinishCommons#4

Authored path: `Sessions.Commons.FinishCommons`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 20.
- Covered by [Sessions](../design/compositions/Sessions.md), line 31.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.Commons.FinishCommons#3
where
  Authenticating._username (account) has (username)
  earlier, RequestBoundary.request (attempt, code, path: "/auth/commons/finish", requestId, state)
then
  RequestBoundary.respond (expiresAt, requestId, session, username)
```

### Sessions.Commons.StartCommons

Authored path: `Sessions.Commons.StartCommons`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 15.
- Covered by [Sessions](../design/compositions/Sessions.md), line 30.

```reaction
when RequestBoundary.request (path: "/auth/commons/start", requestId)
then
  CommonsConnecting.begin ()
```

### Sessions.Commons.StartCommons#2

Authored path: `Sessions.Commons.StartCommons`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 15.
- Covered by [Sessions](../design/compositions/Sessions.md), line 30.

```reaction
when CommonsConnecting.begin (attempt, expiresAt, url), asked by Sessions.Commons.StartCommons
where
  earlier, RequestBoundary.request (path: "/auth/commons/start", requestId)
then
  RequestBoundary.respond (attempt, attemptExpiresAt: expiresAt, requestId, url)
```

### Sessions.Current.Me

Authored path: `Sessions.Current.Me`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 34.
- Covered by [Sessions](../design/compositions/Sessions.md), line 39.

```reaction
when RequestBoundary.request (path: "/auth/me", requestId, session)
then
  Sessioning.current (session)
```

### Sessions.Current.Me#2

Authored path: `Sessions.Current.Me`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 34.
- Covered by [Sessions](../design/compositions/Sessions.md), line 39.

```reaction
when Sessioning.current (session, subject: account), asked by Sessions.Current.Me
where
  Authenticating._username (account) has (username)
  earlier, RequestBoundary.request (path: "/auth/me", requestId, session)
then
  RequestBoundary.respond (requestId, username)
```

### Sessions.Entering.Register

Authored path: `Sessions.Entering.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 3.
- Covered by [Sessions](../design/compositions/Sessions.md), line 10.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.register (password, username)
```

### Sessions.Entering.Register#2

Authored path: `Sessions.Entering.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 3.
- Covered by [Sessions](../design/compositions/Sessions.md), line 10.

```reaction
when Authenticating.register (password, username, account), asked by Sessions.Entering.Register
then
  Sessioning.start (subject: account)
```

### Sessions.Entering.Register#3

Authored path: `Sessions.Entering.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 3.
- Covered by [Sessions](../design/compositions/Sessions.md), line 10.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.Entering.Register#2
where
  earlier, Authenticating.register (password, username, account), asked by Sessions.Entering.Register
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, username)
```

### Sessions.Entering.SignIn

Authored path: `Sessions.Entering.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 4.
- Covered by [Sessions](../design/compositions/Sessions.md), line 11.

```reaction
when RequestBoundary.request (password, path: "/auth/sign-in", requestId, username: typed)
then
  Authenticating.authenticate (password, username: typed)
```

### Sessions.Entering.SignIn#2

Authored path: `Sessions.Entering.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 4.
- Covered by [Sessions](../design/compositions/Sessions.md), line 11.

```reaction
when Authenticating.authenticate (password, username: typed, account), asked by Sessions.Entering.SignIn
then
  Sessioning.start (subject: account)
```

### Sessions.Entering.SignIn#3

Authored path: `Sessions.Entering.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 4.
- Covered by [Sessions](../design/compositions/Sessions.md), line 11.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.Entering.SignIn#2
where
  Authenticating._username (account) has (username)
  earlier, RequestBoundary.request (password, path: "/auth/sign-in", requestId, username: typed)
then
  RequestBoundary.respond (expiresAt, requestId, session, username)
```

### Sessions.Leaving.SignOut

Authored path: `Sessions.Leaving.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 36.
- Covered by [Sessions](../design/compositions/Sessions.md), line 40.

```reaction
when RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  Sessioning.end (session)
```

### Sessions.Leaving.SignOut#2

Authored path: `Sessions.Leaving.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 36.
- Covered by [Sessions](../design/compositions/Sessions.md), line 40.

```reaction
when Sessioning.end (session, ended: signedOut), asked by Sessions.Leaving.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  RequestBoundary.respond (requestId, signedOut)
```

### Stories.Learning.InterestFollowsReading

Authored path: `Stories.Learning.InterestFollowsReading`.
- Covered by [Stories](../design/compositions/Stories.md), line 17.

```reaction
when requested ReadingHistory.record (story, user)
where
  StoryGrouping._topics (story) has (topic)
then
  InterestTracking.increase (topic, user)
```

### Stories.Reading.ReadStory

Authored path: `Stories.Reading.ReadStory`.
- Covered by [Stories](../design/compositions/Stories.md), line 6.
- Covered by [Stories](../design/compositions/Stories.md), line 14.

```reaction
when RequestBoundary.request (path: "/stories/read", requestId, session, story)
then
  Sessioning.current (session)
```

### Stories.Reading.ReadStory:first-read#2

Authored path: `Stories.Reading.ReadStory`.
- Covered by [Stories](../design/compositions/Stories.md), line 6.
- Covered by [Stories](../design/compositions/Stories.md), line 14.

```reaction
when Sessioning.current (session, subject: user), asked by Stories.Reading.ReadStory
where
  earlier, RequestBoundary.request (path: "/stories/read", requestId, session, story)
  StoryGrouping._get (story)
  ReadingHistory._hasRead (story, user) has (read: false)
then
  ReadingHistory.record (story, user)
```

### Stories.Reading.ReadStory:first-read#3

Authored path: `Stories.Reading.ReadStory`.
- Covered by [Stories](../design/compositions/Stories.md), line 6.
- Covered by [Stories](../design/compositions/Stories.md), line 14.

```reaction
when ReadingHistory.record (story, user), asked by Stories.Reading.ReadStory:first-read#2
where
  earlier, RequestBoundary.request (path: "/stories/read", requestId, session, story)
then
  RequestBoundary.respond (requestId, story: former "the expanded story (story)" with (story))
```

### Stories.Reading.ReadStory:missing#2

Authored path: `Stories.Reading.ReadStory`.
- Covered by [Stories](../design/compositions/Stories.md), line 6.
- Covered by [Stories](../design/compositions/Stories.md), line 14.

```reaction
when Sessioning.current (session, subject: user), asked by Stories.Reading.ReadStory
where
  earlier, RequestBoundary.request (path: "/stories/read", requestId, session, story)
  no StoryGrouping._get (story)
then
  RequestBoundary.respond (error: "STORY_NOT_FOUND", requestId)
```

### Stories.Reading.ReadStory:reread#2

Authored path: `Stories.Reading.ReadStory`.
- Covered by [Stories](../design/compositions/Stories.md), line 6.
- Covered by [Stories](../design/compositions/Stories.md), line 14.

```reaction
when Sessioning.current (session, subject: user), asked by Stories.Reading.ReadStory
where
  earlier, RequestBoundary.request (path: "/stories/read", requestId, session, story)
  StoryGrouping._get (story)
  ReadingHistory._hasRead (story, user) has (read: true)
then
  RequestBoundary.respond (requestId, story: former "the expanded story (story)" with (story))
```

### Stories.Topics.ListTopics

Authored path: `Stories.Topics.ListTopics`.
- Covered by [Stories](../design/compositions/Stories.md), line 21.
- Covered by [Stories](../design/compositions/Stories.md), line 24.

```reaction
when RequestBoundary.request (path: "/topics/list", requestId, session)
then
  Sessioning.current (session)
```

### Stories.Topics.ListTopics#2

Authored path: `Stories.Topics.ListTopics`.
- Covered by [Stories](../design/compositions/Stories.md), line 21.
- Covered by [Stories](../design/compositions/Stories.md), line 24.

```reaction
when Sessioning.current (session, subject: user), asked by Stories.Topics.ListTopics
where
  earlier, RequestBoundary.request (path: "/topics/list", requestId, session)
then
  RequestBoundary.respond (requestId, topics: former "every known topic")
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/commons/finish` — requires `attempt`, `state`, `code`
- `/auth/me` — requires `session`
- `/auth/register` — requires `username`, `password`
- `/auth/sign-in` — requires `username`, `password`
- `/auth/sign-out` — requires `session`
- `/feed` — requires `session`; fills `search` with "" when absent; fills `source` with "" when absent
- `/feed/more` — requires `session`, `offset`
- `/feed/sources` — requires `session`
- `/history` — requires `session`; fills `offset` with 0 when absent
- `/interests/add` — requires `session`, `topic`, `count`
- `/interests/list` — requires `session`
- `/interests/remove` — requires `session`, `topic`
- `/interests/reset` — requires `session`
- `/interests/set-count` — requires `session`, `topic`, `count`
- `/stories/read` — requires `session`, `story`
- `/topics/list` — requires `session`
