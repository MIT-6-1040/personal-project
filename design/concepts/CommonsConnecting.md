# CommonsConnecting

## Purpose

Let a person prove who they are with their Commons account, so classmates can sign in
without making a new password and CatchUp never handles their Commons password.

## Principle

Each sign-in starts with a fresh secret that only this app knows, and Commons only
confirms who the person is to the app holding that secret, so a sign-in can't be
finished by anyone else or used twice.

For example, Alex chooses to continue with Commons. A sign-in attempt is begun, which
keeps a new random verifier and a state value and gives the address of Commons' approval
page. Alex approves CatchUp there, and Commons sends his browser back with a one-time
code and the same state. Completing the attempt with that state and code redeems the
code with the kept verifier, and Commons answers that this is Alex, with his Commons ID,
username, name, and email. The attempt is then used up, so completing it again is
refused, and so is completing it with a different state or after it has expired.

## Types

```types
opaque Attempt
  One sign-in in progress, known only to the browser that began it.
```

## State

```state
a set of Attempts with
  a state String
  a verifier String
  an expiresAt DateTime
```

## Actions

```actions
begin () : returns (attempt: Attempt, url: String, expiresAt: DateTime)
  where true
  then
    delete every expired attempt
    add a new attempt with a random state and a random verifier that expires 10 minutes from now
    set url to the Commons approval address carrying the app, the state, and the verifier's challenge
    returns attempt, url, expiresAt

complete (attempt: Attempt, state: String, code: String) : returns (person: String, username: String, displayName: String, email: String)
  where attempt is unknown or expired, or state is not the attempt's state
  then
    refuses UNKNOWN_ATTEMPT "This sign-in has expired. Please try again."
  where Commons does not accept code with the attempt's verifier
  then
    refuses COMMONS_REFUSED "Commons could not confirm this sign-in. Please try again."
  where Commons accepts code
  then
    delete attempt
    set person to the Commons ID that Commons answers, with that person's username, displayName, and email
    returns person, username, displayName, email
```

## Queries

```queries
_pending (attempt: Attempt) : optional (expiresAt: DateTime)
  Answers when the attempt expires, and no row for an attempt that is unknown, used up, or expired.
```
