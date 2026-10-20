// Runs the tests and saves what they did in tests/output.txt, one line per test.
// Bun only prints totals for passing runs, so the names come from its JUnit report.
// Run with: bun run test:save
import { unlink } from "node:fs/promises";

const report = "tests/results.xml";
const run = Bun.spawnSync(["bun", "test", "--reporter=junit", `--reporter-outfile=${report}`], {
  env: { ...process.env, NO_COLOR: "1" },
});
const summary = run.stderr.toString().trim();
const xml = await Bun.file(report).text();
await unlink(report);

const unescape = (text: string) =>
  text.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const lines: string[] = [];
for (const suite of xml.matchAll(/<testsuite name="([^"]+)"[^>]*>([\s\S]*?)<\/testsuite>/g)) {
  lines.push("", suite[1]!);
  for (const test of suite[2]!.matchAll(/<testcase name="([^"]+)"[^>]*?(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const failed = (test[3] ?? "").includes("<failure");
    lines.push(`  ${failed ? "(fail)" : "(pass)"} ${unescape(test[1]!)}`);
  }
}

const output = `Saved on ${new Date().toISOString()}\n\n${summary}\n${lines.join("\n")}\n`;
await Bun.write("tests/output.txt", output);
console.log(output);
process.exit(run.exitCode ?? 1);
