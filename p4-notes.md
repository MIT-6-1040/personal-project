# P4 Design Notes (working draft)

Raw notes for the final design document. Each change says what it was and why.

## Access-control review

Checked every endpoint in [src/compositions](src/compositions):

- **The user always comes from the session, never from the request.** Every endpoint except
  register, sign-in, and the Commons sign-in starts with `Sessioning.current`, and none of them
  takes a user ID as input. So there is no request one user can send to read or change another
  user's interests, history, or feed.
- **The session only comes from the cookie.** The cookie is `HttpOnly` and `Secure`, so page
  scripts can't read it, and the HTTP handler replaces any `session` sent in the request body
  with the cookie's value.
- **Requests from other websites are refused** (403), so another site can't make a signed-in
  browser reset someone's interests.
- **Signing out deletes the session on the server**, so a copied cookie stops working right
  away. Sessions also expire after 7 days.
- **Passwords** are stored as salted PBKDF2 hashes and compared in constant time. A wrong
  password and an unknown username get the same answer, so sign-in doesn't reveal which
  usernames exist. Registering does reveal it ("already taken"), which can't be avoided
  without confusing new users.
- **Opening a missing story** answers 404 and records nothing.
- `/topics/list` and `/feed/sources` hold no private data, but they still require signing in,
  since nothing in the app is meant for visitors who aren't signed in.

All of this is now checked by [tests/integration/app.test.ts](tests/integration/app.test.ts),
which sends requests through the same HTTP handler the deployed app uses.

## Changes

- **Usernames match without regard to capitalization** (MVP feedback). `Desire`, `desire`,
  and `DESIRE` are the same account, and a second account differing only in capitalization
  is refused. The username is still shown the way it was registered. Done with a
  case-insensitive MongoDB collation and a unique index under the same collation, so two
  registrations sent at the same moment can't both succeed.
- **Sign-in answers the username as registered**, not as typed, so the profile button
  doesn't show `DESIRE` after someone types it that way.
- **Integration tests** (MVP feedback): the reading loop (read → topics raised → leaves feed
  → shows in History), re-reading raises nothing, persistence across sign-ins, every
  protected endpoint refusing visitors who aren't signed in, made-up and signed-out
  sessions, one user's actions never reaching another, requests from other websites, and
  error codes for bad input.
- `assembleApplication` takes a database, so the integration tests use a throwaway one.
