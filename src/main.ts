import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { assembleApplication } from "./assembly.ts";
import { db } from "./db.ts";
import { policy, publicOrigin } from "./http.ts";
import { startNewsSchedule } from "./news/schedule.ts";

const application = assembleApplication();
const gateway = createGateway({ application });
const api = createHttpHandler({ application, gateway, policy });

// The built frontend. fileURLToPath keeps spaces in the folder path as spaces.
const dist = fileURLToPath(new URL("../web/dist", import.meta.url));

// Everything that isn't the API or /health is the built frontend. Unknown paths, like
// Commons' /auth/commons/callback, get index.html so the app can handle them.
async function frontend(request: Request) {
  // In development, Vite serves the pages with live reloading, and signing in only
  // works from that address, so point there instead of serving an old build.
  if (process.env.NODE_ENV !== "production") {
    return new Response(`This is the backend. Open the app at ${publicOrigin}`, { status: 404 });
  }
  const { pathname } = new URL(request.url);
  let path = "";
  try {
    path = resolve(dist, `.${decodeURIComponent(pathname)}`);
  } catch {
    // A malformed address like /%E0 just gets the app's page.
  }
  // Never send a file from outside the built folder.
  if (path.startsWith(dist + sep)) {
    const file = Bun.file(path);
    if (await file.exists()) return new Response(file);
  }
  const index = Bun.file(`${dist}/index.html`);
  if (await index.exists()) return new Response(index, { headers: { "Cache-Control": "no-cache" } });
  return new Response("The frontend hasn't been built. Run bun run build.", { status: 404 });
}

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/api/*": api,
    "/health": async () => {
      try {
        await db.command({ ping: 1 }, { timeoutMS: 3000 });
        return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
      } catch {
        return Response.json(
          { status: "unavailable" },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
    },
  },
  fetch: frontend,
});

console.log(`Backend listening on ${server.url}`);

startNewsSchedule(db);
