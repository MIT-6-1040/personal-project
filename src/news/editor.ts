import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

// Claude acts as the editor: it decides which story each article belongs to and
// writes the headline, summary, and topics. Grouping stays in StoryGrouping.

export const model = process.env.NEWS_MODEL ?? "claude-opus-5-5";

export interface RecentStory {
  key: string;
  headline: string;
  summary: string;
  topics: string[];
}

export interface IncomingArticle {
  id: number;
  source: string;
  title: string;
  description: string;
  publishedAt: Date;
}

const EditorAnswer = z.object({
  articles: z.array(z.object({ id: z.number(), story: z.string() })),
  newStories: z.array(
    z.object({ key: z.string(), headline: z.string(), summary: z.string(), topics: z.array(z.string()) }),
  ),
  revisedStories: z.array(z.object({ key: z.string(), summary: z.string(), topics: z.array(z.string()) })),
});

export type EditorAnswer = z.infer<typeof EditorAnswer>;

const instructions = `You are the editor of CatchUp, a news app that shows each real-world event once, as one story with a short summary, and links to every outlet that reported it.

You get the stories CatchUp already has from the last few days, the topic names already in use, and a batch of new articles. Put every new article in exactly one story.

Grouping
- An article joins an existing story only when it reports the same specific event: the same match, the same announcement, the same court ruling. Being about the same team or subject is not enough.
- Articles in this batch can also be grouped with each other into one new story.

For each new story, add an entry to newStories:
- key: a short lowercase slug with hyphens, such as "barcelona-beat-napoli-ucl".
- headline: at most 100 characters. Plain and factual, in your own words, not clickbait.
- summary: two or three plain sentences, at most 60 words and 400 characters. Only facts stated in the articles.
- topics: 3 to 5 specific topics. Name the actual teams, people, organizations, competitions, products, laws, or places, phrased like "FC Barcelona matches", "Champions League", "OPT employment rules", "OpenAI model releases". Never use broad topics like "Sports", "World news", "Technology", or "Politics". When a topic in the known topics list fits, reuse its exact spelling.

When an article joins an existing story, add one entry to revisedStories for that story (once, even if several articles join it):
- summary: rewrite the existing summary so it also covers anything new the joining articles add, with the same limits.
- topics: 3 to 5 topics. Keep the existing ones unless they are wrong, and add a specific one only if the new articles introduce it.

In articles, list every article id once with the key of its story, either an existing key or one of your new keys.`;

// Made on first use, so the backend still starts when no API key is configured.
let client: Anthropic | undefined;

export async function editBatch(
  recent: RecentStory[],
  knownTopics: string[],
  incoming: IncomingArticle[],
): Promise<EditorAnswer> {
  const batch = {
    existingStories: recent,
    knownTopics,
    newArticles: incoming.map(({ id, source, title, description, publishedAt }) => ({
      id,
      source,
      title,
      description: description.slice(0, 600),
      publishedAt: publishedAt.toISOString(),
    })),
  };

  client ??= new Anthropic();
  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    // If a request is declined, the API retries it on a fallback model it picks.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(EditorAnswer) },
    system: instructions,
    messages: [{ role: "user", content: JSON.stringify(batch) }],
  });

  if (response.stop_reason === "refusal") throw new Error("The editor declined this batch.");
  if (response.stop_reason === "max_tokens") throw new Error("The editor's answer was cut off.");
  if (!response.parsed_output) throw new Error("The editor's answer did not match the expected format.");
  return response.parsed_output;
}
