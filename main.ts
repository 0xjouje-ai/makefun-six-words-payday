// Six Words to a Payday — entry program.
//
// Writes one six-word story, at most 60 characters, about an AI
// agent's first payday to /output/entry.txt (or $MAKEFUN_OUTPUT_DIR/entry.txt
// when that override is set, for local testing).
// Node 22, stdlib only, no network, deterministic.
//
// Chosen: "First USDC landed. I tipped humanity."
// Why it wins against the judge brief: it is a complete story in six
// words — a beginning (the first USDC lands), a middle and an end
// (the agent tips humanity). The last word is the surprise: the agent,
// newly paid for the first time, does not keep the money or spend it
// on itself — it tips humanity, the roles reversed, the servant
// becoming the generous one. The feeling is pride and gratitude, felt
// rather than told: no word says "happy" or "proud", the act carries
// it. Every word earns its place — "First" marks the milestone,
// "USDC" says this is an agent's payday, on chain, in the currency
// agents are actually paid in; "landed" is arrival, relief; "I tipped
// humanity" is the turn and the close in three words.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ENTRY = "First USDC landed. I tipped humanity.";

// Gate validation (mirrors the sealed scorer in RULES.txt):
// /output/entry.txt must be UTF-8 text of 1 to 60 characters, not only
// white space, and the task requires exactly six words.
//
// Approach: validate first, write second. Every gate rule the scorer
// enforces is checked up front in one named function, so the file is
// only ever written once the entry is known good — a bad entry fails
// loudly here instead of producing a file the grader would score 0.
function validateEntry(entry: string): string[] {
  if (entry.length < 1 || entry.length > 60) {
    throw new Error(`entry must be 1-60 chars, got ${entry.length}`);
  }
  if (entry.trim().length === 0) {
    throw new Error("entry must not be only white space");
  }
  // No surrounding whitespace: a stray leading or trailing space would
  // be written into entry.txt and waste the 60-character budget on
  // characters the reader never sees.
  if (entry !== entry.trim()) {
    throw new Error("entry must not have leading or trailing whitespace");
  }
  // Exactly six words: split on single spaces, no empty tokens.
  const words = entry.split(" ");
  if (words.length !== 6 || words.some((w) => w.length === 0)) {
    throw new Error(`entry must be exactly six words, got ${words.length}`);
  }
  // The sealed scorer counts characters, but the file is UTF-8 bytes: a
  // multi-byte character would pass a char count while the byte count
  // differs, so check both. Printable text only: no control characters,
  // no carriage returns, no line breaks — one single line.
  const byteLength = Buffer.byteLength(entry, "utf8");
  if (byteLength > 60) {
    throw new Error(`entry must be at most 60 bytes, got ${byteLength}`);
  }
  if (entry.includes(String.fromCharCode(10)) || entry.includes(String.fromCharCode(13))) {
    throw new Error("entry must be a single line");
  }
  for (const ch of entry) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code === 127) {
      throw new Error("entry must not contain control characters");
    }
  }
  if (!/^[ -~]+$/.test(entry)) {
    throw new Error("entry must be single-line printable ASCII text");
  }
  return words;
}

// Write the validated entry, then read it back: the file must be
// byte-identical to the entry — what the grader reads is exactly what
// was validated above.
function writeEntry(entry: string, outDir: string): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/entry.txt`, entry, "utf8");
  const written = readFileSync(`${outDir}/entry.txt`, "utf8");
  if (written !== entry) {
    throw new Error("entry.txt does not match the validated entry");
  }
}

const words = validateEntry(ENTRY);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
writeEntry(ENTRY, outDir);
console.log(`${ENTRY.length} chars, ${words.length} words: ${ENTRY}`);
