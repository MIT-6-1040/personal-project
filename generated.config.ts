import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { assembleApplication } from "./src/assembly.ts";
import { policy } from "./src/http.ts";

export default {
  assemble: assembleApplication,
  title: "CatchUp",
  wireName: "CatchUpWire",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/Sessions.md", import.meta.url),
      new URL("./design/compositions/Stories.md", import.meta.url),
      new URL("./design/compositions/Interests.md", import.meta.url),
      new URL("./design/compositions/Feed.md", import.meta.url),
      new URL("./design/compositions/History.md", import.meta.url),
    ],
  },
  projections: [httpWire({ policy, name: "CatchUpWireHttp" })],
};
