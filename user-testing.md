# P5: User Testing — CatchUp

**Live app:** https://catchup.mit-sdg.dev

## 1. Testing Tasks

For this testing, I wanted to see how people who had never used CatchUp would interact with it without me explaining too much. I was mostly interested in how they find news, how they understand personalization, and whether the app actually makes reading news easier for them.

| Task                              | Instructions for the user                                                                                               | Why I included it                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1. Create an account              | Create an account on CatchUp and explore the app a little.                                                              | I wanted to see if signing up was easy and whether someone could understand the app without any introduction.         |
| 2. Find news you like             | Find a story about something you're interested in, open it, and check its original sources.                             | This tests how easily someone can find relevant news and whether combining articles from different sources is useful. |
| 3. Personalize your feed          | Try to make your feed show more news about the things you care about.                                                   | I wanted to see if users understood how interests work and whether they could control what appears first.             |
| 4. Find something you read before | Go back and find a story you opened earlier.                                                                            | This tests whether users understand History and how easy it is to find previously read stories.                       |
| 5. Fix unwanted recommendations   | Imagine you opened a story you weren't really interested in. Try to make sure it doesn't affect what news you get next. | I wanted to see if users noticed that opening stories changes their interests and whether they could fix that.        |
| 6. Share a story                  | Find an interesting story and try to share it with a friend.                                                            | I wanted to understand whether users expect sharing to be part of the app and what they would try to do.              |

## 2. Study Reports

### Study 1 — Alain

For my first study, I interviewed Alain, my friend who follows football, especially FC Barcelona. Like many MIT students, he doesn't want to spend too much time scrolling through news just to find something interesting.

One thing he really liked was how we display stories with images and short summaries. He also liked that we combine articles talking about the same event into one story instead of showing the same news multiple times from different outlets. For him, that made it much easier to quickly catch up without having to read too much.

However, we noticed a pretty important problem when he first started using the app. Since he hadn't set up his interests yet, the stories at the top weren't necessarily things he cared about. He started opening some of them just to explore the app, even though he wasn't actually interested in those topics. The problem is that CatchUp automatically considers every opened story as something the user likes and adds its topics to their interests.

This means his feed could start getting personalized based on stories he didn't even want to read in the first place. And since we don't explain that opening a story changes your interests, it's not something a new user would necessarily notice.

My biggest takeaway from Alain's test was that we need to be more careful about how we learn users' interests. I think letting people choose their interests when they first sign up, instead of immediately learning from everything they open, would make the experience much better.

### Study 2 — Salvi

For my second study, I interviewed Salvi, another friend who follows both technology and politics. Like Alain, he liked the idea of getting short summaries instead of having to scroll through a lot of news from different websites.

One thing that came up was how difficult it could become to find a story he read a while ago. We have a History page, which is useful, but there's no search bar there. So if someone has read a lot of stories, they would have to keep scrolling until they find the one they're looking for. He mentioned that having a search option in History would make things much easier.

Another interesting point was about personalization. Even though Salvi follows both politics and technology, he would prefer seeing more technology news than politics. Right now, our app increases interest counts whenever someone opens a story, so the ranking mostly depends on what they have been reading. But reading more political stories doesn't necessarily mean he wants politics to dominate his feed. He wanted a way to give some topics more importance regardless of how often he reads about others.

He also mentioned that it would be nice to share interesting stories with friends. Currently, we don't have a way to share a CatchUp story directly, even though sharing news is something people normally do.

Overall, Salvi's feedback made me realize that personalization should be more about what users actually want, not just what they happen to click on. We also need to make it easier to find old stories and share news with other people.

## 3. Design Flaws and Possible Improvements

Based on the two studies, these are the main things I think we should improve in CatchUp.

### 1. We assume opening a story means you're interested in it

- **Level:** Conceptual
- **Severity:** Major

This was probably the biggest issue from Alain's test. When someone opens a story, we automatically increase their interest in all its topics. But as we saw, people might open stories just to explore the app or because they happen to appear at the top of the feed.

I think we should stop treating every click as an expression of interest. We could add an "Interested" button, or at least let users undo the interest changes. It would also help to ask users to select a few topics when they first create an account, so the feed starts with something relevant.

### 2. Users can't give some interests more importance than others

- **Level:** Conceptual
- **Severity:** Major

Salvi follows both politics and technology, but he wants to see more technology news even if he happens to read a lot of political stories. Right now, interest counts mostly depend on how many stories someone opens, so users don't have a clear way to keep certain topics as their main priorities.

I think we should let users set their own preferences, maybe by marking topics as high, medium, or low priority. That way, the app can still learn from what they read without completely ignoring what they explicitly told us they prefer.

### 3. Finding old stories in History is difficult

- **Level:** Physical
- **Severity:** Moderate

Salvi pointed out that History becomes less useful as someone reads more stories. Right now, the only way to find an older story is to keep scrolling, which could take a while if you've been using the app for weeks.

We should add a search bar to History so users can find previously read stories by headline or topic. We could also add filters for dates or topics, but I think search alone would already make a big difference.

### 4. There's no way to share stories with friends

- **Level:** Conceptual
- **Severity:** Moderate

Salvi also wanted to share stories with friends, but CatchUp doesn't currently support that. We provide links to the original articles, but there's no way to directly share the combined story with its summary and sources.

I think the first step would be giving each story its own shareable link. Later, we could let users recommend stories to each other or create shared reading lists. That would also help make CatchUp more collaborative instead of having everyone use it completely independently.
