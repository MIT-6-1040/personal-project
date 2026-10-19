import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { pageSize, validOffset } from "./paging.ts";

const { Sessioning, StoryGrouping, ReadingHistory } = concepts;

// One page of the stories the user has read, most recent first, with what the card shows.
const ReadingList = former(
  "the reading history of (user) from (offset)",
  ({ user, offset }, { story, readAt, headline, summary, image, publishedAt, topic }) =>
    each(ReadingHistory._readings({ user, offset, limit: pageSize }).is({ story, readAt }))
      .where(StoryGrouping._get({ story }).is({ headline, summary, image, publishedAt }))
      .form({
        story,
        readAt,
        headline,
        summary,
        image,
        publishedAt,
        topics: each(StoryGrouping._topics({ story }).is({ topic })).distinct(topic),
      }),
);

const ViewHistory = endpoint(
  "/history",
  ({ session, user, offset }) =>
    receive({ session, offset })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(respond({ history: ReadingList({ user, offset }) })),
  { input: { required: ["session"], defaults: { offset: 0 } }, validators: { input: validOffset } },
);

export const composition = {
  Viewing: { ViewHistory, ReadingList },
};
