# CatchUp

CatchUp is a personalized news app that helps readers stay informed about the specific topics they care about without spending too much time searching through unrelated or repeated news.

**Live app:** https://catchup.mit-sdg.dev

## Deliverables

- [P1: Design](design.md)
- [P2: MVP — user journey and design notes](mvp.md)
- [P3: Beta — user journey, changes, and testing](beta.md)
  - Screen recording: [CatchUp YouTube Video](https://youtu.be/iZD-DK6DTV4)
  - Visual design study: [CatchUp_Visual_Design_Study.pdf](images/CatchUp_Visual_Design_Study.pdf)
  - Test output: [tests/output.txt](tests/output.txt)
- [P4: Final design document](final.md)
  - Final video: [CatchUp Final Demo](https://youtu.be/PIXC6_5pIrU)

The concept specifications are in [design/concepts](design/concepts), and the compositions that connect them are in [design/compositions](design/compositions).

## Running Locally

You need [Bun](https://bun.sh) 1.4 and [Podman](https://podman.io) (or Docker with `podman` aliased), which runs MongoDB.

1. Install the packages:

   ```sh
   bun install
   ```

2. Copy `.env.example` to `.env`. It already points at the local database. To fetch real news, also add an Anthropic API key:

   ```sh
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   Without a key the app still runs, but no news is fetched.

3. Start MongoDB, the backend, and the frontend together:

   ```sh
   bun run dev
   ```

4. Open **http://127.0.0.1:5173**. Use `127.0.0.1`, not `localhost`: signing in only works from the address the backend expects.

The backend fetches news when it starts and then every hour. To fetch once by hand, run `bun run news`. `bun run clear-stories` removes every story but keeps accounts and interests.

To try the production build the way the class platform runs it, stop `bun run dev` and run `bun run preview`, then open http://127.0.0.1:3000.

## Running the Tests

The tests use [Bun's test runner](https://bun.sh/docs/cli/test) against a real MongoDB.

1. Start the database, if `bun run dev` isn't already running:

   ```sh
   bun run db:up
   ```

   This starts MongoDB in a container on `127.0.0.1:27017`. The tests connect with the `MONGODB_URL` in `.env`, so copy `.env.example` to `.env` first if you haven't.

2. Run the tests:

   ```sh
   bun test
   ```

   Each test file gets its own new database named `catchup_test_<random>`, which is dropped when the file finishes, so the tests never touch the app's data. Every test creates the data it needs by calling concept actions. The integration tests in [tests/integration](tests/integration) instead send requests through the same HTTP handler the deployed app uses, checking the reading loop, sign-in, access control, and error codes end to end. The news pipeline tests use stand-in feeds and a stand-in editor, so they need neither the network nor an API key.

3. To save the results, run:

   ```sh
   bun run test:save
   ```

   This runs the tests again and writes [tests/output.txt](tests/output.txt), listing every test by file.

`bun run check` checks that the code matches the specifications and type-checks the backend, and `bun run check:design` checks the specifications' format.

## Project Layout

| Folder              | What's in it                                                          |
| ------------------- | --------------------------------------------------------------------- |
| `design/`           | Concept specifications, compositions, and shared types                |
| `src/concepts/`     | One class per concept                                                 |
| `src/compositions/` | Endpoints and reactions that connect the concepts                     |
| `src/news/`         | Fetching RSS feeds and asking Claude to group and summarize them      |
| `web/`              | The Vue frontend                                                      |
| `tests/`            | Concept, integration, and news pipeline tests, and saved output       |
| `scripts/`          | One-off commands: fetching news, clearing stories, saving test output |
