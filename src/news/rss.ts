import { XMLParser } from "fast-xml-parser";
import type { Feed } from "./feeds.ts";

export interface FeedItem {
  source: string;
  title: string;
  url: string;
  description: string;
  image: string;
  publishedAt: Date;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  htmlEntities: true,
});

// Some sites refuse requests that don't look like they come from a browser or reader.
const headers = { "User-Agent": "Mozilla/5.0 (compatible; CatchUp news reader)" };

// Elements with attributes parse as objects, so the text can be under "#text".
function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) return text((value as { "#text": unknown })["#text"]);
  return "";
}

function list<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

// Descriptions often contain HTML. We only want the words.
export function plainText(html: string) {
  return (
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      // Some feeds escape twice, so codes like &#8216; are still left after parsing.
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function firstImageInHtml(html: string) {
  return html.match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? "";
}

type Node = Record<string, unknown>;

// Feeds put the picture in different places: media:content, media:thumbnail,
// an image enclosure, or an <img> inside the description.
function findImage(item: Node, html: string): string {
  const attribute = (node: unknown, name: string) =>
    node && typeof node === "object" ? String((node as Node)[`@_${name}`] ?? "") : "";

  for (const media of list(item["media:content"] as Node | Node[])) {
    const url = attribute(media, "url");
    const medium = attribute(media, "medium");
    const type = attribute(media, "type");
    if (url && (medium === "image" || type.startsWith("image") || (!medium && !type))) return url;
  }
  for (const media of list(item["media:group"] as Node | Node[])) {
    const found = findImage(media, "");
    if (found) return found;
  }
  for (const thumbnail of list(item["media:thumbnail"] as Node | Node[])) {
    const url = attribute(thumbnail, "url");
    if (url) return url;
  }
  for (const enclosure of list(item.enclosure as Node | Node[])) {
    if (attribute(enclosure, "type").startsWith("image")) return attribute(enclosure, "url");
  }
  return firstImageInHtml(html);
}

function fromRss(item: Node, source: string): FeedItem | null {
  const description = text(item.description);
  const content = text(item["content:encoded"]);
  const url = text(item.link).trim();
  const publishedAt = new Date(text(item.pubDate) || text(item["dc:date"]));
  const title = plainText(text(item.title));
  if (!url || !title || Number.isNaN(publishedAt.getTime())) return null;
  return {
    source,
    title,
    url,
    description: plainText(description || content),
    // NPR, for example, only has the picture inside the full content.
    image: findImage(item, description + content),
    publishedAt,
  };
}

function fromAtom(entry: Node, source: string): FeedItem | null {
  const links = list(entry.link as Node | Node[]);
  const link = links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? links[0];
  const url = String(link?.["@_href"] ?? "").trim();
  const html = text(entry.content) || text(entry.summary);
  const publishedAt = new Date(text(entry.published) || text(entry.updated));
  const title = plainText(text(entry.title));
  if (!url || !title || Number.isNaN(publishedAt.getTime())) return null;
  return { source, title, url, description: plainText(html), image: findImage(entry, html), publishedAt };
}

export function parseFeed(xml: string, source: string): FeedItem[] {
  const document = parser.parse(xml) as Node;
  const rss = (document.rss as Node | undefined)?.channel as Node | undefined;
  if (rss) return list(rss.item as Node | Node[]).map((item) => fromRss(item, source)).filter((item) => item !== null);
  const atom = document.feed as Node | undefined;
  if (atom) return list(atom.entry as Node | Node[]).map((entry) => fromAtom(entry, source)).filter((entry) => entry !== null);
  return [];
}

export async function fetchFeed(feed: Feed): Promise<FeedItem[]> {
  const response = await fetch(feed.url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${feed.url} answered ${response.status}`);
  return parseFeed(await response.text(), feed.source);
}

// Used when the feed has no picture: most article pages name one for link previews.
export async function fetchPreviewImage(url: string): Promise<string> {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return "";
    const html = (await response.text()).slice(0, 200_000);
    const tag =
      html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i)?.[0] ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]*>/i)?.[0];
    const image = tag?.match(/content=["']([^"']+)["']/i)?.[1] ?? "";
    return image.startsWith("http") ? image.replace(/&amp;/g, "&") : "";
  } catch {
    return "";
  }
}
