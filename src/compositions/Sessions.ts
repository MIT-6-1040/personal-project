import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Authenticating, Sessioning } = concepts;

const Register = endpoint(
  "/auth/register",
  ({ username, password, account, session, expiresAt }) =>
    receive({ username, password })
      .then(Authenticating.register({ username, password }).responds({ account }))
      .then(Sessioning.start({ subject: account }).responds({ session, expiresAt }))
      .then(respond({ username, session, expiresAt })),
  { input: { required: ["username", "password"] } },
);

const SignIn = endpoint(
  "/auth/sign-in",
  ({ username, password, account, session, expiresAt }) =>
    receive({ username, password })
      .then(Authenticating.authenticate({ username, password }).responds({ account }))
      .then(Sessioning.start({ subject: account }).responds({ session, expiresAt }))
      .then(respond({ username, session, expiresAt })),
  { input: { required: ["username", "password"] } },
);

const Me = endpoint(
  "/auth/me",
  ({ session, account, username }) =>
    receive({ session })
      .then(Sessioning.current({ session }).responds({ subject: account }))
      .then(where(Authenticating._username({ account }).is({ username })).then(respond({ username }))),
  { input: { required: ["session"] } },
);

const SignOut = endpoint(
  "/auth/sign-out",
  ({ session, signedOut }) =>
    receive({ session })
      .then(Sessioning.end({ session }).responds({ ended: signedOut }))
      .then(respond({ signedOut })),
  { input: { required: ["session"] } },
);

export const composition = {
  Entering: { Register, SignIn },
  Current: { Me },
  Leaving: { SignOut },
};
