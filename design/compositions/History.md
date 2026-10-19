# History

Stories that a user has read leave the feed, so the History page is how they find one
again. [Viewing history](reaction:History.Viewing.ViewHistory) answers one page of
[the reading history](former:History.Viewing.ReadingList) of the signed-in user, most
recently read first. Each story comes with its headline, summary, image, topics, and
when the user read it.

A page holds ten stories. The first request leaves out the offset. As the user scrolls,
the page asks again with the number of stories it already shows, and a page with fewer
than ten stories means the history has ended. An offset that is not a whole number of 0
or more is refused as invalid input.

Opening a story from History goes through the same read endpoint as the feed. Since the
story is already in the user's history, it is shown without being recorded again, so
going back to an old story does not change the user's interests.

```endpoints
History.Viewing.ViewHistory at /history
```
