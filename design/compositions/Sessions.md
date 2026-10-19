# Sessions

Registering [creates an account and signs the person in](reaction:Sessions.Entering.Register)
by starting a session for the new account. [Signing in](reaction:Sessions.Entering.SignIn)
checks the password and starts a new session. The browser keeps the session in a cookie,
so the frontend never handles it directly.

```endpoints
Sessions.Entering.Register at /auth/register
Sessions.Entering.SignIn at /auth/sign-in
```

Classmates can also continue with their Commons account instead of making a password.
[Starting a Commons sign-in](reaction:Sessions.Commons.StartCommons) begins an attempt
and answers the address of Commons' approval page. The attempt goes into its own
short-lived cookie, and the browser is sent to Commons. After the person approves
CatchUp there, Commons sends the browser back to `/auth/commons/callback` with a code
and the state, and the page then
[finishes the Commons sign-in](reaction:Sessions.Commons.FinishCommons). The attempt is
read from the cookie, so only the browser that started a sign-in can finish it, which
stops anyone from signing a classmate in to the wrong account with a link. The code is
redeemed with the attempt's verifier, the Commons person is connected to their CatchUp
account (created the first time), and a session starts the same way it does for a
password. An expired or unknown attempt, or a code Commons does not accept, is refused
as not signed in. If the person cancels on Commons, no request is made and the sign-in
form says so.

```endpoints
Sessions.Commons.StartCommons at /auth/commons/start
Sessions.Commons.FinishCommons at /auth/commons/finish
```

The frontend asks [who is signed in](reaction:Sessions.Current.Me) when the page loads.
An unknown or expired session is refused, so the frontend shows the sign-in form.
[Signing out](reaction:Sessions.Leaving.SignOut) ends the session.

```endpoints
Sessions.Current.Me at /auth/me
Sessions.Leaving.SignOut at /auth/sign-out
```
