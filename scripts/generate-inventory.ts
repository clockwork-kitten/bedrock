import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildConsumerDocument,
  buildFreezeDispositionDocument,
  buildFreezeMarkdown,
  collectSourceFacts,
} from "../src/inventory/index.js";

const REPO_ROOT = join(import.meta.dirname, "..");
const DISPOSITION_PATH = join(REPO_ROOT, "docs/bedrock-disposition.json");
const CONSUMER_PATH = join(REPO_ROOT, "docs/bedrock-consumers.json");
const FREEZE_MD_PATH = join(REPO_ROOT, "docs/bedrock-freeze.md");

function nowIso(): string {
  return new Date().toISOString();
}

const sourceFacts = collectSourceFacts(REPO_ROOT);
const disposition = buildFreezeDispositionDocument(sourceFacts, nowIso());
const consumers = buildConsumerDocument(disposition);
const markdown = buildFreezeMarkdown(disposition);

writeFileSync(DISPOSITION_PATH, JSON.stringify(disposition, null, 2) + "\n", "utf8");
writeFileSync(CONSUMER_PATH, JSON.stringify(consumers, null, 2) + "\n", "utf8");
writeFileSync(FREEZE_MD_PATH, markdown, "utf8");

console.log("Generated docs/bedrock-disposition.json, docs/bedrock-consumers.json, docs/bedrock-freeze.md");
