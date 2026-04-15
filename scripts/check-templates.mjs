#!/usr/bin/env node
/**
 * Validates every manifest referenced from templates.json against the
 * upstream bank-template JSON Schema.
 *
 * Adapted from vectorize-io/hindsight's check-templates.mjs for HindClaw's
 * flat repo layout (templates.json + templates/ at the repo root). Loads
 * the schema from ./bank-template-schema.json — CI fetches it fresh from
 * upstream/main at job start; running locally, curl it yourself:
 *
 *   curl -fsSL https://raw.githubusercontent.com/vectorize-io/hindsight/main/hindsight-docs/static/bank-template-schema.json \
 *     -o bank-template-schema.json
 *
 * Run: node scripts/check-templates.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const catalogPath = join(repoRoot, 'templates.json');
const schemaPath = join(repoRoot, 'bank-template-schema.json');
const templatesDir = join(repoRoot, 'templates');

if (!existsSync(schemaPath)) {
  console.error('\x1b[31m✗\x1b[0m Missing bank-template-schema.json at repo root.');
  console.error('  Fetch it first:');
  console.error('    curl -fsSL https://raw.githubusercontent.com/vectorize-io/hindsight/main/hindsight-docs/static/bank-template-schema.json \\');
  console.error('      -o bank-template-schema.json');
  process.exit(2);
}

const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'));
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

// HindClaw content guards — not enforced by the upstream schema but required
// at runtime by the engine's retain pipeline.
const VALID_EXTRACTION_MODES = new Set(['concise', 'verbose', 'custom', 'chunks']);

let failed = 0;

// ----- Layer 1: catalog integrity ------------------------------------- //

if (!Array.isArray(catalog.templates)) {
  console.error('\x1b[31m✗\x1b[0m templates.json is missing a "templates" array');
  process.exit(1);
}

const seenIds = new Set();
const referencedFiles = new Set();

for (const entry of catalog.templates) {
  if (!entry.id) {
    console.error('\x1b[31m✗\x1b[0m Catalog entry is missing "id" field');
    failed++;
    continue;
  }

  if (seenIds.has(entry.id)) {
    console.error(`\x1b[31m✗\x1b[0m Duplicate template id in catalog: "${entry.id}"`);
    failed++;
  }
  seenIds.add(entry.id);

  if (!entry.manifest_file) {
    console.error(`\x1b[31m✗\x1b[0m Template "${entry.id}" is missing "manifest_file" field`);
    failed++;
    continue;
  }
  referencedFiles.add(entry.manifest_file);

  const manifestPath = join(repoRoot, entry.manifest_file);
  if (!existsSync(manifestPath)) {
    console.error(
      `\x1b[31m✗\x1b[0m Template "${entry.id}" manifest_file "${entry.manifest_file}" does not exist`,
    );
    failed++;
  }
}

// Orphan check — files under templates/ that the catalog never references.
// Guards against contributors dropping a file into templates/ but forgetting
// to add the catalog entry.
if (existsSync(templatesDir)) {
  const onDisk = readdirSync(templatesDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => `templates/${name}`);
  for (const file of onDisk) {
    if (!referencedFiles.has(file)) {
      console.error(
        `\x1b[31m✗\x1b[0m Orphan manifest: "${file}" is not referenced by any catalog entry`,
      );
      failed++;
    }
  }
}

// ----- Layer 2: schema + content validation per manifest --------------- //

for (const entry of catalog.templates) {
  if (!entry.manifest_file) continue;
  const manifestPath = join(repoRoot, entry.manifest_file);
  if (!existsSync(manifestPath)) continue;

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (err) {
    console.error(`\x1b[31m✗\x1b[0m Template "${entry.id}" manifest JSON parse error: ${err.message}`);
    failed++;
    continue;
  }

  const valid = validate(manifest);
  if (!valid) {
    failed++;
    console.error(
      `\x1b[31m✗\x1b[0m Template "${entry.id}" (${entry.manifest_file}) failed schema validation:`,
    );
    // Filter out noisy anyOf wrapper errors and keep meaningful leaf errors.
    const meaningful = validate.errors.filter(
      (e) => e.keyword !== 'anyOf' && e.keyword !== 'if' && e.keyword !== 'then',
    );
    const shown = meaningful.length > 0 ? meaningful : validate.errors;
    for (const err of shown) {
      const path = err.instancePath || err.schemaPath || '(root)';
      const params = err.params ? ` ${JSON.stringify(err.params)}` : '';
      console.error(`    ${path}: ${err.message}${params}`);
    }
    continue;
  }

  // HindClaw content guard: retain_extraction_mode enum (runtime, not schema)
  const mode = manifest.bank?.retain_extraction_mode;
  if (mode && !VALID_EXTRACTION_MODES.has(mode)) {
    console.error(
      `\x1b[31m✗\x1b[0m Template "${entry.id}" uses retain_extraction_mode="${mode}"; ` +
        `valid values: ${[...VALID_EXTRACTION_MODES].join(', ')}`,
    );
    failed++;
    continue;
  }

  console.log(`\x1b[32m✓\x1b[0m Template "${entry.id}" — valid`);
}

// ----- Summary --------------------------------------------------------- //

if (failed > 0) {
  console.error(`\n\x1b[31m${failed} check(s) failed.\x1b[0m`);
  process.exit(1);
}
console.log(`\n\x1b[32mAll ${catalog.templates.length} templates are valid.\x1b[0m`);
