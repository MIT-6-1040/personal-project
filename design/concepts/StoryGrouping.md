# StoryGrouping

## Purpose

Groups articles reporting the same event into one story to prevent users from seeing repeated stories of the same news.

## Principle

Each event becomes one story that collects every outlet's article about it, so a reader
sees the event once with one short summary and can still choose any original source.

For example, BBC publishes an article about Barcelona beating Napoli, and it is added
under the key `barcelona-napoli-ucl`. No story has that key yet, so a new story is
created with a headline, a short summary, the topics FC Barcelona matches and Champions
League, and BBC's photo. Then ESPN publishes its own article about the same match. It
is added with the same key, so it joins that story instead of making a second one, and
the story now lists two sources. The summary is then revised to cover what ESPN adds,
and the topic La Liga table is added. The headline and photo stay the same, so the
story looks the same in the feed. Adding the ESPN article a second time is refused,
since its URL is already there.

## Types

```types
external Topic
  A specific subject a story is about, such as FC Barcelona matches.

opaque TopicList
  A list of topics given with a new article or a revision.

opaque Catalog
  The matching stories with their topics and times, in one list.
```

## State

```state
a set of Stories with
  a unique key String
  a headline String
  a summary String
  an image String
  a topics set of Topic

a set of Articles with
  a story Story
  a source String
  a title String
  a unique url String
  a publishedAt DateTime

Rule: a story's image is empty until one of its articles brings one, and its time is the time of its newest article.
```

## Actions

```actions
addArticle (key: String, headline: String, summary: String, image: String, topics: TopicList, source: String, title: String, url: String, publishedAt: DateTime) : returns (article: Article, story: Story)
  where headline is blank or longer than 100 characters
  then
    refuses INVALID_HEADLINE "A headline must have 1 to 100 characters."
  where summary is blank, longer than 400 characters, or longer than 60 words
  then
    refuses INVALID_SUMMARY "A summary must have 1 to 400 characters and at most 60 words."
  where topics has no topics, more than 5 different topics, or a blank topic or one longer than 100 characters
  then
    refuses INVALID_TOPICS "A story needs 1 to 5 topics of 1 to 100 characters each."
  where url is already in Articles
  then
    refuses DUPLICATE_ARTICLE "That article has already been added."
  where a story with key exists
  then
    add a new article with that story, source, title, url, and publishedAt
    if the story has no image, set its image to image
    returns article, story
  where no story has key
  then
    add a new story with key, headline, summary, image, and topics
    add a new article with that story, source, title, url, and publishedAt
    returns article, story

revise (story: Story, summary: String, topics: TopicList) : returns (story: Story)
  where story is unknown
  then
    refuses STORY_NOT_FOUND "That story does not exist."
  where summary is blank, longer than 400 characters, or longer than 60 words
  then
    refuses INVALID_SUMMARY "A summary must have 1 to 400 characters and at most 60 words."
  where topics has no topics, more than 5 different topics, or a blank topic or one longer than 100 characters
  then
    refuses INVALID_TOPICS "A story needs 1 to 5 topics of 1 to 100 characters each."
  where story exists
  then
    replace the story's summary with summary and its topics with topics
    returns story
```

## Queries

```queries
_stories () : many (story: Story, key: String, headline: String, summary: String, image: String, publishedAt: DateTime)
  Answers every story with its key, newest first, using its newest article's time. No rows when there are none.

_get (story: Story) : optional (headline: String, summary: String, image: String, publishedAt: DateTime)
  Answers the story, and no row for an unknown story.

_articles (story: Story) : many (article: Article, source: String, title: String, url: String, publishedAt: DateTime)
  Answers the story's articles, newest first, and no rows for an unknown story.

_hasArticle (url: String) : one (added: Flag)
  Answers whether an article with that URL has been added.

_topics (story: Story) : many (topic: Topic)
  Answers the story's topics in alphabetical order, and no rows for an unknown story.

_allTopics () : many (topic: Topic)
  Answers every topic used by any story, once each, in alphabetical order.

_sources () : many (source: String)
  Answers every source that has an article, once each, in alphabetical order.

_catalog (search: String, source: String) : one (catalog: Catalog)
  Answers one list holding every matching story with its topics and time, for ranking. When search is not blank, a story matches only if every word of search appears in its headline or summary, ignoring case. When source is not blank, a story matches only if one of its articles is from that source.
```
