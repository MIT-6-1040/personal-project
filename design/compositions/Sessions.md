# Sessions

Registering [creates an account and signs the person in](reaction:Sessions.Entering.Register)
by starting a session for the new account. [Signing in](reaction:Sessions.Entering.SignIn)
checks the password and starts a new session. The browser keeps the session in a cookie,
so the frontend never handles it directly.

```endpoints
Sessions.Entering.Register at /auth/register
Sessions.Entering.SignIn at /auth/sign-in
```

The frontend asks [who is signed in](reaction:Sessions.Current.Me) when the page loads.
An unknown or expired session is refused, so the frontend shows the sign-in form.
[Signing out](reaction:Sessions.Leaving.SignOut) ends the session.

```endpoints
Sessions.Current.Me at /auth/me
Sessions.Leaving.SignOut at /auth/sign-out
```
