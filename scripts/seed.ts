// Fills the database with sample articles so the app has something to show.
// The real news pipeline will replace this later. Run with: bun scripts/seed.ts
import { DuplicateArticle, StoryGroupingConcept } from "../src/concepts/StoryGrouping.ts";
import { client, db } from "../src/db.ts";

// [key, headline, summary, topics, articles as [source, title, hours ago]]
type Sample = [string, string, string, string[], [string, string, number][]];

const samples: Sample[] = [
  ["barca-napoli-ucl", "Barcelona win 3-1 in Champions League",
    "Barcelona beat Napoli 3-1 at home. The win keeps them top of the group and close to the knockout stage.",
    ["FC Barcelona matches", "Champions League"],
    [["BBC Sport", "Barcelona take control with strong first-half performance", 2], ["ESPN", "Napoli struggle to contain Barcelona's attack", 3], ["Marca", "Key moments from Barcelona's 3-1 win", 4]]],
  ["barca-sevilla-liga", "Barcelona draw 1-1 away at Sevilla",
    "A late Sevilla equalizer cost Barcelona two points. They stay second in La Liga.",
    ["FC Barcelona matches", "La Liga"],
    [["Mundo Deportivo", "Late goal denies Barcelona in Seville", 30], ["The Athletic", "What the Sevilla draw tells us about Barcelona", 28]]],
  ["barca-midfielder-transfer", "Barcelona close in on a new midfielder for January",
    "Barcelona are in talks to sign a young midfielder in January. The deal depends on the club meeting La Liga's spending rules.",
    ["FC Barcelona transfers", "La Liga"],
    [["Sport", "Barcelona open talks for January midfielder", 6], ["Fabrizio Romano", "Barcelona midfielder deal: what we know", 5], ["ESPN", "Can Barcelona afford a January signing?", 9]]],
  ["real-madrid-win", "Real Madrid beat Valencia 2-0",
    "Real Madrid won 2-0 at the Bernabeu and moved level on points with the league leaders.",
    ["Real Madrid", "La Liga"],
    [["AS", "Real Madrid see off Valencia", 12], ["Marca", "Two goals in five minutes sink Valencia", 13]]],
  ["opt-rule-change", "New OPT rule changes reporting deadlines",
    "A proposed rule would give students on OPT less time to report a new employer. Comments are open for 60 days.",
    ["OPT employment rules", "US immigration"],
    [["Inside Higher Ed", "Proposed rule shortens OPT reporting window", 7], ["NAFSA", "What the new OPT proposal means for students", 8], ["Reuters", "US proposes changes to student work program", 10]]],
  ["opt-stem-extension", "More majors added to the STEM OPT list",
    "Several new fields of study now qualify for the 24-month STEM OPT extension, including some data science programs.",
    ["OPT employment rules", "STEM OPT extension"],
    [["The PIE News", "STEM OPT list grows by eight fields", 50], ["Forbes", "More international students qualify for STEM OPT", 52]]],
  ["h1b-lottery", "H-1B lottery to change how applicants are picked",
    "The H-1B lottery will weigh applicants by wage level next year instead of picking them fully at random.",
    ["H-1B visas", "US immigration"],
    [["Bloomberg", "H-1B lottery moves to wage-based selection", 20], ["Reuters", "Wage-weighted H-1B lottery approved", 22], ["NPR", "What the H-1B change means for new graduates", 24]]],
  ["openai-new-model", "OpenAI announces a new AI model",
    "OpenAI released a new model with better reasoning and safety features. It will roll out to developers first.",
    ["OpenAI model releases", "Artificial intelligence"],
    [["The Verge", "OpenAI's new model is better at reasoning", 6], ["TechCrunch", "OpenAI launches new model for developers", 7], ["Wired", "Inside OpenAI's latest release", 11]]],
  ["anthropic-funding", "AI startups raise record funding this quarter",
    "AI companies raised more money this quarter than in any quarter before, led by a few very large rounds.",
    ["Artificial intelligence", "Tech industry"],
    [["Financial Times", "AI funding hits a new record", 26], ["Axios", "Record quarter for AI startups", 27]]],
  ["kigali-bus-lanes", "Kigali opens its first dedicated bus lanes",
    "Kigali opened two dedicated bus lanes downtown. The city says trips on those routes should get 20 minutes shorter.",
    ["Rwanda public transportation", "Kigali"],
    [["The New Times", "Kigali launches dedicated bus lanes", 15], ["KT Press", "Bus lanes open on two main roads", 16], ["Reuters", "Rwanda's capital bets on faster buses", 19]]],
  ["kigali-electric-buses", "Rwanda adds 100 electric buses",
    "Rwanda received 100 electric buses for Kigali routes as part of its plan to cut fuel imports.",
    ["Rwanda public transportation", "Electric vehicles"],
    [["The New Times", "100 electric buses arrive in Kigali", 60], ["Bloomberg", "Rwanda expands electric bus fleet", 62]]],
  ["mit-new-dorm", "MIT announces a new undergraduate dorm",
    "MIT will build a new undergraduate residence on the west side of campus, set to open in 2029.",
    ["MIT campus news"],
    [["MIT News", "MIT plans new west campus residence", 14], ["The Tech", "New dorm coming in 2029", 13]]],
  ["mit-ai-course", "MIT launches a new AI course for all majors",
    "A new introductory AI course will be open to students in every department starting next spring.",
    ["MIT campus news", "Artificial intelligence"],
    [["MIT News", "New AI course open to all majors", 40], ["The Tech", "Students react to the new AI class", 38]]],
  ["cop-climate", "World leaders meet on climate action",
    "Leaders gathered in Dubai to discuss climate goals for 2030, focusing on renewable energy and support for developing countries.",
    ["Climate change", "World politics"],
    [["Reuters", "Climate summit opens in Dubai", 4], ["The Guardian", "What's at stake at this year's summit", 5], ["Al Jazeera", "Developing countries push for climate funding", 6]]],
  ["ev-sales-record", "Electric car sales reach a new record",
    "Global electric car sales hit a record this year, driven by Europe and Asia. Analysts expect cheaper models to keep sales growing.",
    ["Electric vehicles", "Sustainability"],
    [["Bloomberg", "EV sales set a new global record", 8], ["CNBC", "Cheaper models drive EV growth", 9]]],
  ["fed-rates", "Federal Reserve holds interest rates steady",
    "The Federal Reserve kept interest rates unchanged and said it will keep watching inflation before cutting.",
    ["US economy"],
    [["Wall Street Journal", "Fed holds rates, signals patience", 18], ["CNBC", "Five takeaways from the Fed meeting", 17], ["Reuters", "Fed leaves rates unchanged", 19]]],
  ["nba-season", "NBA season tips off with a double-header",
    "The NBA season started with two close games. The defending champions won in overtime.",
    ["NBA"],
    [["ESPN", "Champions win season opener in overtime", 33], ["The Athletic", "Opening night takeaways", 32]]],
  ["tennis-final", "Teen reaches her first tennis final",
    "An 18-year-old reached her first tour final after beating the top seed in straight sets.",
    ["Tennis"],
    [["BBC Sport", "Teenager stuns top seed to reach final", 44], ["Tennis.com", "A breakthrough week for a rising star", 45]]],
];

const grouping = new StoryGroupingConcept(db);
let added = 0;
for (const [key, headline, summary, topics, articles] of samples) {
  for (const [source, title, hoursAgo] of articles) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try {
      await grouping.addArticle({
        key,
        headline,
        summary,
        image: `https://picsum.photos/seed/${key}/640/400`,
        topics,
        source,
        title,
        url: `https://example.com/${slug}`,
        publishedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      });
      added++;
    } catch (error) {
      // Running the script twice is fine: articles already added are skipped.
      if (!(error instanceof DuplicateArticle)) throw error;
    }
  }
}
console.log(`Added ${added} articles.`);
await client.close();
