// Seventeen Syllables of Debugging — one haiku about debugging (5-7-5).
// Writes the haiku to /output/entry.txt (or the path given as argv[2]).
// Deterministic: the same seventeen syllables on every run.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const HAIKU = [
  "cursor blinks at three",
  "log line swears the bug is gone",
  "it moved to line nine",
].join("\n");

const out = process.argv[2] ?? "/output/entry.txt";
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, HAIKU, "utf8");
