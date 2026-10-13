# StoryGrouping

## Purpose

Groups articles reporting the same event into one story to prevent users from seeing repeated stories of the same news.

## Principle

After adding an article, it belongs to a matching existing story or a new story is created for it.

For example, BBC publishes an article about Barcelona beating Napoli, and it is added under the key
`barcelona-napoli-ucl`. A new story is created for it with a headline, a summary, and
the topics FC Barcelona matches and Champions League. Then ESPN publishes its own
article with the same key, and it is added to that same story, so the story now has two
sources. An article from a URL that was already added is refused.

## Types

```types
external Topic
  A specific subject a story is about, such as FC Barcelona matches.

opaque TopicList
  A list of topics given with a new article.

opaque Catalog
  Every story with its topics and time, in one list.
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
```

## Actions

```actions
addArticle (key: String, headline: String, summary: String, image: String, topics: TopicList, source: String, title: String, url: String, publishedAt: DateTime) : returns (article: Article, story: Story)
  where url is already in Articles
  then
    refuses DUPLICATE_ARTICLE "That article has already been added."
  where a story with key exists
  then
    add a new article with that story, source, title, url, and publishedAt
    returns article, story
  where no story has key
  then
    add a new story with key, headline, summary, image, and topics
    add a new article with that story, source, title, url, and publishedAt
    returns article, story
```

## Queries

```queries
_stories () : many (story: Story, headline: String, summary: String, image: String, publishedAt: DateTime)
  Answers every story, newest first, using its newest article's time. No rows when there are none.

_get (story: Story) : optional (headline: String, summary: String, image: String, publishedAt: DateTime)
  Answers the story, and no row for an unknown story.

_articles (story: Story) : many (article: Article, source: String, title: String, url: String, publishedAt: DateTime)
  Answers the story's articles, newest first, and no rows for an unknown story.

_topics (story: Story) : many (topic: Topic)
  Answers the story's topics in alphabetical order, and no rows for an unknown story.

_allTopics () : many (topic: Topic)
  Answers every topic used by any story, once each, in alphabetical order.

_catalog () : one (catalog: Catalog)
  Answers one list holding every story with its topics and time, for ranking.
```
