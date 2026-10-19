// RSS feeds checked on 2026-10-19. Several outlets cover the same areas
// (football, world news, tech) so that one event arrives from more than one source.
export interface Feed {
  source: string;
  url: string;
}

export const feeds: Feed[] = [
  { source: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { source: "BBC News", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
  { source: "The Guardian", url: "https://www.theguardian.com/world/rss" },
  { source: "The Guardian", url: "https://www.theguardian.com/football/rss" },
  { source: "The Guardian", url: "https://www.theguardian.com/technology/rss" },
  { source: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { source: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml" },
  { source: "ESPN", url: "https://www.espn.com/espn/rss/soccer/news" },
  { source: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
  { source: "Sky News", url: "https://feeds.skynews.com/feeds/rss/world.xml" },
  { source: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { source: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { source: "Inside Higher Ed", url: "https://www.insidehighered.com/rss.xml" },
];
