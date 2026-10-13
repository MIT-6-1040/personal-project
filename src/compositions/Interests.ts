import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Sessioning, InterestTracking } = concepts;

const MyInterests = former("the interests of (user)", ({ user }, { topic, count }) =>
  each(InterestTracking._interests({ user }).is({ topic, count })).form({ topic, count }),
);

// Every endpoint answers with the updated list, so the page can redraw right away.

const ListInterests = endpoint(
  "/interests/list",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(respond({ interests: MyInterests({ user }) })),
  { input: { required: ["session"] } },
);

const AddInterest = endpoint(
  "/interests/add",
  ({ session, user, topic, count }) =>
    receive({ session, topic, count })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(InterestTracking.add({ user, topic, count }))
      .then(respond({ interests: MyInterests({ user }) })),
  { input: { required: ["session", "topic", "count"] } },
);

const SetCount = endpoint(
  "/interests/set-count",
  ({ session, user, topic, count }) =>
    receive({ session, topic, count })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(InterestTracking.setCount({ user, topic, count }))
      .then(respond({ interests: MyInterests({ user }) })),
  { input: { required: ["session", "topic", "count"] } },
);

const RemoveInterest = endpoint(
  "/interests/remove",
  ({ session, user, topic }) =>
    receive({ session, topic })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(InterestTracking.remove({ user, topic }))
      .then(respond({ interests: MyInterests({ user }) })),
  { input: { required: ["session", "topic"] } },
);

const ResetInterests = endpoint(
  "/interests/reset",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(InterestTracking.reset({ user }))
      .then(respond({ interests: MyInterests({ user }) })),
  { input: { required: ["session"] } },
);

export const composition = {
  Viewing: { ListInterests, MyInterests },
  Changing: { AddInterest, SetCount, RemoveInterest, ResetInterests },
};
