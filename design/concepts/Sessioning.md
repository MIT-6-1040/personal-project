# Sessioning

## Purpose

Keep a person signed in for a while without sending their password on every request.

## Principle

A session is started for Alex. Until it expires, `current` resolves the session to
Alex. After the session is ended, `current` is refused, and the same happens for a
made-up or expired session.

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
