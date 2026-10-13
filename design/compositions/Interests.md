# Interests

All of these act on the signed-in user's own interests, never on anyone else's.

The My Interests page [lists the topics](reaction:Interests.Viewing.ListInterests) as
[the user's interests](former:Interests.Viewing.MyInterests), highest count first.

```endpoints
Interests.Viewing.ListInterests at /interests/list
```

A user can [add a topic](reaction:Interests.Changing.AddInterest) with a starting count,
[change a count](reaction:Interests.Changing.SetCount) with the plus and minus buttons,
[remove a topic](reaction:Interests.Changing.RemoveInterest), or
[reset everything](reaction:Interests.Changing.ResetInterests).

```endpoints
Interests.Changing.AddInterest at /interests/add
Interests.Changing.SetCount at /interests/set-count
Interests.Changing.RemoveInterest at /interests/remove
Interests.Changing.ResetInterests at /interests/reset
```
