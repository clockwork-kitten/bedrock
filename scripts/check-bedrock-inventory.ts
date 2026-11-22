import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildConsumerDocument,
  buildFreezeDispositionDocument,
  buildFreezeMarkdown,
  collectSourceFacts,
} from "../src/inventory/index.js";

const REPO_ROOT = join(import.meta.dirname, "..");

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function assertEqual(path: string, actual: string, expected: string): void {
  if (actual !== expected) {
    throw new Error(path + " is out of date; run bun run inventory:generate");
  }
}

const dispositionPath = join(REPO_ROOT, "docs/bedrock-disposition.json");
const consumersPath = join(REPO_ROOT, "docs/bedrock-consumers.json");
const freezeMdPath = join(REPO_ROOT, "docs/bedrock-freeze.md");

const existingDisposition = JSON.parse(read(dispositionPath)) as {
  generatedAt: string;
  sourceRevision: string;
};
const sourceFacts = collectSourceFacts(REPO_ROOT, existingDisposition.sourceRevision);
const disposition = buildFreezeDispositionDocument(sourceFacts, existingDisposition.generatedAt);
const consumers = buildConsumerDocument(disposition);
const markdown = buildFreezeMarkdown(disposition);

assertEqual(dispositionPath, read(dispositionPath), JSON.stringify(disposition, null, 2) + "\n");
assertEqual(consumersPath, read(consumersPath), JSON.stringify(consumers, null, 2) + "\n");
assertEqual(freezeMdPath, read(freezeMdPath), markdown);

if (disposition.denominators.registryRuleIds !== disposition.rules.length) {
  throw new Error("Rule denominator mismatch");
}
if (disposition.downstreamSlices.some(function (slice) {
  return slice.size === "XL";
})) {
  throw new Error("Downstream slices must not include XL");
}

console.log("Bedrock inventory check passed.");
