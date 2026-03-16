/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Unified Babel plugin-based test script for comparing TS and Rust compilers.
 *
 * Runs both compilers through their real Babel plugins, captures debug log
 * entries via the logger API, and diffs output for a specific pass.
 *
 * Usage: npx tsx compiler/scripts/test-rust-port.ts <pass> [<fixtures-path>]
 */

import * as babel from '@babel/core';
import fs from 'fs';
import path from 'path';

import {parseConfigPragmaForTests} from '../packages/babel-plugin-react-compiler/src/Utils/TestUtils';
import {printDebugHIR} from '../packages/babel-plugin-react-compiler/src/HIR/DebugPrintHIR';
import type {CompilerPipelineValue} from '../packages/babel-plugin-react-compiler/src/Entrypoint/Pipeline';

// --- ANSI colors ---
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// --- Parse args ---
const [passArg, fixturesPathArg] = process.argv.slice(2);

if (!passArg) {
  console.error(
    'Usage: npx tsx compiler/scripts/test-rust-port.ts <pass> [<fixtures-path>]',
  );
  console.error('');
  console.error('Arguments:');
  console.error(
    '  <pass>           Name of the compiler pass to compare (e.g., HIR)',
  );
  console.error(
    '  [<fixtures-path>] Fixture file or directory (default: compiler test fixtures)',
  );
  process.exit(1);
}

const REPO_ROOT = path.resolve(__dirname, '../..');
const DEFAULT_FIXTURES_DIR = path.join(
  REPO_ROOT,
  'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler',
);

const fixturesPath = fixturesPathArg
  ? path.resolve(fixturesPathArg)
  : DEFAULT_FIXTURES_DIR;

// --- Check that native module is built ---
const NATIVE_NODE_PATH = path.join(
  REPO_ROOT,
  'compiler/packages/babel-plugin-react-compiler-rust/native/index.node',
);

if (!fs.existsSync(NATIVE_NODE_PATH)) {
  console.error(`${RED}ERROR: Rust native module not built.${RESET}`);
  console.error(
    'Run: bash compiler/scripts/test-rust-port.sh to build automatically,',
  );
  console.error(
    'or build manually: cd compiler/crates && cargo build -p react_compiler_napi',
  );
  process.exit(1);
}

// --- Load plugins ---
const tsPlugin = require('../packages/babel-plugin-react-compiler/src').default;
const rustPlugin =
  require('../packages/babel-plugin-react-compiler-rust/src').default;

// --- Types ---
interface CapturedEntry {
  name: string;
  value: string;
}

type CompileMode = 'ts' | 'rust';

// --- Discover fixtures ---
function discoverFixtures(rootPath: string): string[] {
  const stat = fs.statSync(rootPath);
  if (stat.isFile()) {
    return [rootPath];
  }

  const results: string[] = [];
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        /\.(js|jsx|ts|tsx)$/.test(entry.name) &&
        !entry.name.endsWith('.expect.md')
      ) {
        results.push(fullPath);
      }
    }
  }
  walk(rootPath);
  results.sort();
  return results;
}

// --- Compile a fixture through a Babel plugin and capture debug entries ---
function compileFixture(
  mode: CompileMode,
  fixturePath: string,
): {entries: CapturedEntry[]; error: string | null} {
  const source = fs.readFileSync(fixturePath, 'utf8');
  const firstLine = source.substring(0, source.indexOf('\n'));

  // Parse pragma config
  const pragmaOpts = parseConfigPragmaForTests(firstLine, {
    compilationMode: 'all',
  });

  // Capture debug entries
  const entries: CapturedEntry[] = [];

  const logger = {
    logEvent(_filename: string | null, _event: unknown): void {
      // no-op for events
    },
    debugLogIRs(entry: CompilerPipelineValue): void {
      if (entry.kind === 'hir') {
        // TS pipeline emits HIR objects — convert to debug string
        entries.push({
          name: entry.name,
          value: printDebugHIR(entry.value),
        });
      } else if (entry.kind === 'debug') {
        // Rust pipeline (and TS EnvironmentConfig) emits pre-formatted strings
        entries.push({
          name: entry.name,
          value: entry.value,
        });
      }
      // Ignore 'reactive' and 'ast' kinds for now
    },
  };

  // Determine parser plugins
  const isFlow = firstLine.includes('@flow');
  const isScript = firstLine.includes('@script');
  const parserPlugins: string[] = isFlow
    ? ['flow', 'jsx']
    : ['typescript', 'jsx'];

  const plugin = mode === 'ts' ? tsPlugin : rustPlugin;

  const pluginOptions = {
    ...pragmaOpts,
    compilationMode: 'all' as const,
    panicThreshold: 'all_errors' as const,
    logger,
  };

  let error: string | null = null;
  try {
    babel.transformSync(source, {
      filename: fixturePath,
      sourceType: isScript ? 'script' : 'module',
      parserOpts: {
        plugins: parserPlugins,
      },
      plugins: [[plugin, pluginOptions]],
      configFile: false,
      babelrc: false,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return {entries, error};
}

// --- Simple unified diff ---
function unifiedDiff(expected: string, actual: string): string {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const lines: string[] = [];
  lines.push(`${RED}--- TypeScript${RESET}`);
  lines.push(`${GREEN}+++ Rust${RESET}`);

  // Simple line-by-line diff (not a real unified diff, but good enough for debugging)
  const maxLen = Math.max(expectedLines.length, actualLines.length);
  let contextStart = -1;
  for (let i = 0; i < maxLen; i++) {
    const eLine = i < expectedLines.length ? expectedLines[i] : undefined;
    const aLine = i < actualLines.length ? actualLines[i] : undefined;
    if (eLine === aLine) {
      // matching line — skip (or show as context near diffs)
      continue;
    }
    if (contextStart !== i) {
      lines.push(`${YELLOW}@@ line ${i + 1} @@${RESET}`);
    }
    contextStart = i + 1;
    if (eLine !== undefined && aLine !== undefined) {
      lines.push(`${RED}-${eLine}${RESET}`);
      lines.push(`${GREEN}+${aLine}${RESET}`);
    } else if (eLine !== undefined) {
      lines.push(`${RED}-${eLine}${RESET}`);
    } else if (aLine !== undefined) {
      lines.push(`${GREEN}+${aLine}${RESET}`);
    }
  }
  return lines.join('\n');
}

// --- Main ---
const fixtures = discoverFixtures(fixturesPath);
if (fixtures.length === 0) {
  console.error('No fixtures found at', fixturesPath);
  process.exit(1);
}

console.log(
  `Testing ${BOLD}${fixtures.length}${RESET} fixtures for pass: ${BOLD}${passArg}${RESET}`,
);
console.log('');

let passed = 0;
let failed = 0;
let tsHadEntries = false;
const failures: Array<{
  fixture: string;
  kind: 'count_mismatch' | 'content_mismatch' | 'error';
  detail: string;
}> = [];

for (const fixturePath of fixtures) {
  const relPath = path.relative(REPO_ROOT, fixturePath);
  const ts = compileFixture('ts', fixturePath);
  const rust = compileFixture('rust', fixturePath);

  // Filter entries for the requested pass
  const tsEntries = ts.entries.filter(e => e.name === passArg);
  const rustEntries = rust.entries.filter(e => e.name === passArg);

  if (tsEntries.length > 0) {
    tsHadEntries = true;
  }

  // If both produced errors and neither has entries for this pass, treat as matching
  if (
    tsEntries.length === 0 &&
    rustEntries.length === 0 &&
    ts.error != null &&
    rust.error != null
  ) {
    passed++;
    continue;
  }

  // If neither has entries (both skipped/no functions), treat as matching
  if (tsEntries.length === 0 && rustEntries.length === 0) {
    passed++;
    continue;
  }

  // Check entry count mismatch
  if (tsEntries.length !== rustEntries.length) {
    failed++;
    if (failures.length < 10) {
      failures.push({
        fixture: relPath,
        kind: 'count_mismatch',
        detail:
          `TS produced ${tsEntries.length} entries, Rust produced ${rustEntries.length} entries` +
          (ts.error ? `\n  TS error: ${ts.error}` : '') +
          (rust.error ? `\n  Rust error: ${rust.error}` : ''),
      });
    }
    continue;
  }

  // Compare entry content
  let allMatch = true;
  let firstDiff = '';
  for (let i = 0; i < tsEntries.length; i++) {
    if (tsEntries[i].value !== rustEntries[i].value) {
      allMatch = false;
      if (!firstDiff) {
        firstDiff = unifiedDiff(tsEntries[i].value, rustEntries[i].value);
      }
      break;
    }
  }

  if (allMatch) {
    passed++;
  } else {
    failed++;
    if (failures.length < 10) {
      failures.push({
        fixture: relPath,
        kind: 'content_mismatch',
        detail: firstDiff,
      });
    }
  }
}

// --- Check for invalid pass name ---
if (!tsHadEntries) {
  console.error(
    `${RED}ERROR: TypeScript compiler produced no log entries for pass "${passArg}" across all fixtures.${RESET}`,
  );
  console.error('This likely means the pass name is incorrect.');
  console.error('');
  console.error('Pass names must match exactly as used in Pipeline.ts, e.g.:');
  console.error(
    '  HIR, PruneMaybeThrows, SSA, InferTypes, AnalyseFunctions, ...',
  );
  process.exit(1);
}

// --- Show failures ---
for (const failure of failures) {
  console.log(`${RED}FAIL${RESET} ${failure.fixture}`);
  if (failure.kind === 'count_mismatch') {
    console.log(`  ${failure.detail}`);
  } else if (failure.kind === 'content_mismatch') {
    console.log(failure.detail);
  } else {
    console.log(`  ${failure.detail}`);
  }
  console.log('');
}

// --- Summary ---
console.log('---');
const total = fixtures.length;
if (failed === 0) {
  console.log(
    `${GREEN}Results: ${passed} passed, ${failed} failed (${total} total)${RESET}`,
  );
} else {
  console.log(
    `${RED}Results: ${passed} passed, ${failed} failed (${total} total)${RESET}`,
  );
  if (failures.length < failed) {
    console.log(
      `${DIM}  (showing first ${failures.length} of ${failed} failures)${RESET}`,
    );
  }
}

process.exit(failed > 0 ? 1 : 0);
