# Authenticating

## Purpose

Let a person prove who they are with a username and password, so nobody can act as
someone else just by typing their name.

## Principle

Alex registers the username `alex` with a password. Another registration of `alex` is
refused. Signing in as `alex` with the wrong password is refused, and signing in with
the right password returns Alex's account.

## Types

```types
opaque Secret
  A hash of the password. How it is computed is up to the implementation.
```

## State

```state
a set of Accounts with
  a unique username String
  a salt String
  a passwordHash Secret
```

## Actions

```actions
register (username: String, password: String) : returns (account: Account)
  where username is not 3 to 32 letters, digits, underscores, or hyphens
  then
    refuses INVALID_USERNAME "A username must have 3 to 32 letters, numbers, underscores, or hyphens."
  where password is shorter than 8 characters or longer than 128 characters
  then
    refuses WEAK_PASSWORD "A password must have 8 to 128 characters."
  where username is already registered
  then
    refuses USERNAME_TAKEN "That username is already taken."
  where username and password are accepted
  then
    add a new account with username, a fresh salt, and a hash of password with that salt
    returns account

authenticate (username: String, password: String) : returns (account: Account)
  where username is unknown or password does not match
  then
    refuses INVALID_CREDENTIALS "The username or password is incorrect."
  where password matches
  then
    returns account
```

## Queries

```queries
_username (account: Account) : optional (username: String)
  Answers the account's username, and no row for an unknown account.
```
