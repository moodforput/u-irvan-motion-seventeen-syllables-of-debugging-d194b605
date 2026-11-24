// Tests for the debugging haiku (13 tests). Run: node test.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

// Exact syllable counts for every word in the haiku (verified by hand).
const SYLLABLES = {
  cursor: 2, blinks: 1, at: 1, three: 1,
  log: 1, line: 1, swears: 1, the: 1, bug: 1, is: 1, gone: 1,
  it: 1, moved: 1, to: 1, nine: 1,
};

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (SYLLABLES[w] !== undefined) return SYLLABLES[w];
  // Generic fallback (vowel-group counting) — never reached for this haiku.
  const groups = w.replace(/e$/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) { passed++; console.log(`ok   ${name}`); }
  else { failed++; console.log(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

const EXPECTED = [
  "cursor blinks at three",
  "log line swears the bug is gone",
  "it moved to line nine",
].join("\n");

check("main.ts exists", existsSync("main.ts"));

const dir = mkdtempSync(join(tmpdir(), "haiku-test-"));
try {
  const out1 = join(dir, "entry1.txt");
  const out2 = join(dir, "entry2.txt");
  execFileSync("node", ["main.ts", out1], { stdio: "pipe" });
  execFileSync("node", ["main.ts", out2], { stdio: "pipe" });

  const text1 = readFileSync(out1, "utf8");
  const text2 = readFileSync(out2, "utf8");
  const bytes1 = readFileSync(out1);
  const bytes2 = readFileSync(out2);

  check("output file is written", existsSync(out1));
  check("output is valid UTF-8 (no replacement char)", !text1.includes("\uFFFD"));
  check("output is not only whitespace", text1.trim().length > 0);
  check("output is 1-200 characters", text1.length >= 1 && text1.length <= 200, `len=${text1.length}`);
  check("output matches the haiku exactly", text1 === EXPECTED);

  const lines = text1.split("\n");
  check("exactly 3 lines", lines.length === 3, `lines=${lines.length}`);
  check("no trailing newline / no blank 4th line", !text1.endsWith("\n") && lines.every((l) => l.length > 0));

  const counts = lines.map((l) => l.split(" ").reduce((n, w) => n + countSyllables(w), 0));
  check("line 1 is 5 syllables", counts[0] === 5, `got ${counts[0]}`);
  check("line 2 is 7 syllables", counts[1] === 7, `got ${counts[1]}`);
  check("line 3 is 5 syllables", counts[2] === 5, `got ${counts[2]}`);
  check("total is 17 syllables", counts.reduce((a, b) => a + b, 0) === 17);
  check("concrete debugging imagery present", /cursor/.test(text1) && /log line/.test(text1) && /bug/.test(text1));
  check("two runs are byte-identical (deterministic)",
    createHash("sha256").update(bytes1).digest("hex") === createHash("sha256").update(bytes2).digest("hex"));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
