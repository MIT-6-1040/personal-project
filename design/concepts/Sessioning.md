# Sessioning

## Purpose

Keep a person signed in for a while without sending their password on every request.

## Principle

Signing in once starts a session that stands for the person for seven days, so every
later request proves who they are with the session instead of the password, and the
session stops working as soon as it is ended or expires.

For example, Alex signs in and a session is started for him. For the next week, each
request carrying that session resolves to Alex without asking for his password. When he
signs out, the session is ended, and a request with it is refused as not signed in, the
same as a made-up session or one more than seven days old.

## Types

```types
external Subject
  Whoever the session stands for.
```

## State

```state
a set of Sessions with
  a subject Subject
  an expiresAt DateTime
```

## Actions

```actions
start (subject: Subject) : returns (session: Session, expiresAt: DateTime)
  where true
  then
    delete every expired session
    add a new session for subject that expires 7 days from now
    returns session, expiresAt

current (session: Session) : returns (subject: Subject)
  where session is unknown or expired
  then
    refuses UNKNOWN_SESSION "You are not signed in."
  where session is active
  then
    returns subject

end (session: Session) : returns (ended: Flag)
  where session is unknown or expired
  then
    refuses UNKNOWN_SESSION "You are not signed in."
  where session is active
  then
    delete session
    set ended to true
    returns ended
```

## Queries

```queries
_active (session: Session) : optional (subject: Subject, expiresAt: DateTime)
  Answers the session's subject, and no row for an unknown or expired session.
```
