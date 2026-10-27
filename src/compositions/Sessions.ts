import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Authenticating, CommonsConnecting, Sessioning } = concepts;

const Register = endpoint(
  "/auth/register",
  ({ username, password, account, session, expiresAt }) =>
    receive({ username, password })
      .then(Authenticating.register({ username, password }).responds({ account }))
      .then(Sessioning.start({ subject: account }).responds({ session, expiresAt }))
      .then(respond({ username, session, expiresAt })),
  { input: { required: ["username", "password"] } },
);

// Answers the username as registered, since it may have been typed in another capitalization.
const SignIn = endpoint(
  "/auth/sign-in",
  ({ typed, password, account, session, expiresAt, username }) =>
    receive({ username: typed, password })
      .then(Authenticating.authenticate({ username: typed, password }).responds({ account }))
      .then(Sessioning.start({ subject: account }).responds({ session, expiresAt }))
      .then(
        where(Authenticating._username({ account }).is({ username })).then(respond({ username, session, expiresAt })),
      ),
  { input: { required: ["username", "password"] } },
);

// The attempt goes back in a cookie and the browser is sent on to Commons' approval page.
const StartCommons = endpoint(
  "/auth/commons/start",
  ({ attempt, url, expiresAt }) =>
    receive({})
      .then(CommonsConnecting.begin({}).responds({ attempt, url, expiresAt }))
      .then(respond({ url, attempt, attemptExpiresAt: expiresAt })),
);

// Commons sent the browser back with a code. The attempt comes from the cookie, so only
// the browser that started this sign-in can finish it.
const FinishCommons = endpoint(
  "/auth/commons/finish",
  ({ attempt, state, code, person, commonsName, account, session, expiresAt, username }) =>
    receive({ attempt, state, code })
      .then(CommonsConnecting.complete({ attempt, state, code }).responds({ person, username: commonsName }))
      .then(Authenticating.connect({ person, username: commonsName }).responds({ account }))
      .then(Sessioning.start({ subject: account }).responds({ session, expiresAt }))
      .then(
        where(Authenticating._username({ account }).is({ username })).then(respond({ username, session, expiresAt })),
      ),
  { input: { required: ["attempt", "state", "code"] } },
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
  Commons: { StartCommons, FinishCommons },
  Current: { Me },
  Leaving: { SignOut },
};
