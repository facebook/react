/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * End-to-end test script comparing compiler output across all frontends.
 *
 * Runs fixtures through:
 *   - TS baseline (Babel plugin, in-process)
 *   - babel variant: Rust via Babel plugin (in-process via NAPI)
 *   - swc variant: Rust via SWC frontend (CLI binary)
 *   - oxc variant: Rust via OXC frontend (CLI binary)
 *
 * Usage: npx tsx compiler/scripts/test-e2e.ts [fixtures-path] [--variant babel|swc|oxc] [--limit N] [--no-color]
 */

import * as babel from '@babel/core';
import {execSync, spawnSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import prettier from 'prettier';

import {parseConfigPragmaForTests} from '../packages/babel-plugin-react-compiler/src/Utils/TestUtils';

const REPO_ROOT = path.resolve(__dirname, '../..');

// --- Parse flags ---
const rawArgs = process.argv.slice(2);
const noColor = rawArgs.includes('--no-color') || !!process.env.NO_COLOR;
const variantIdx = rawArgs.indexOf('--variant');
const variantArg =
  variantIdx >= 0 ? (rawArgs[variantIdx + 1] as 'babel' | 'swc' | 'oxc') : null;
const limitIdx = rawArgs.indexOf('--limit');
const limitArg = limitIdx >= 0 ? parseInt(rawArgs[limitIdx + 1], 10) : 50;

// Extract positional args (strip flags and flag values)
const skipIndices = new Set<number>();
for (const flag of ['--no-color']) {
  const idx = rawArgs.indexOf(flag);
  if (idx >= 0) skipIndices.add(idx);
}
for (const flag of ['--variant', '--limit']) {
  const idx = rawArgs.indexOf(flag);
  if (idx >= 0) {
    skipIndices.add(idx);
    skipIndices.add(idx + 1);
  }
}
const positional = rawArgs.filter((_a, i) => !skipIndices.has(i));

// --- ANSI colors ---
const useColor = !noColor;
const RED = useColor ? '\x1b[0;31m' : '';
const GREEN = useColor ? '\x1b[0;32m' : '';
const YELLOW = useColor ? '\x1b[0;33m' : '';
const BOLD = useColor ? '\x1b[1m' : '';
const DIM = useColor ? '\x1b[2m' : '';
const RESET = useColor ? '\x1b[0m' : '';

// --- Fixtures ---
const DEFAULT_FIXTURES_DIR = path.join(
  REPO_ROOT,
  'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler',
);

const fixturesPath = positional[0]
  ? path.resolve(positional[0])
  : DEFAULT_FIXTURES_DIR;

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

// --- Build ---
console.log('Building Rust native module and e2e CLI...');
try {
  execSync(
    '~/.cargo/bin/cargo build -p react_compiler_napi -p react_compiler_e2e_cli',
    {
      cwd: path.join(REPO_ROOT, 'compiler/crates'),
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    },
  );
} catch (e: any) {
  // Show stderr on build failure (includes errors + warnings)
  if (e.stderr) {
    process.stderr.write(e.stderr);
  }
  console.error(`${RED}ERROR: Failed to build Rust crates.${RESET}`);
  process.exit(1);
}

// Copy the built dylib as index.node
const NATIVE_DIR = path.join(
  REPO_ROOT,
  'compiler/packages/babel-plugin-react-compiler-rust/native',
);
const NATIVE_NODE_PATH = path.join(NATIVE_DIR, 'index.node');
const TARGET_DIR = path.join(REPO_ROOT, 'compiler/target/debug');
const dylib = fs.existsSync(
  path.join(TARGET_DIR, 'libreact_compiler_napi.dylib'),
)
  ? path.join(TARGET_DIR, 'libreact_compiler_napi.dylib')
  : path.join(TARGET_DIR, 'libreact_compiler_napi.so');

if (!fs.existsSync(dylib)) {
  console.error(
    `${RED}ERROR: Could not find built native module in ${TARGET_DIR}${RESET}`,
  );
  process.exit(1);
}
fs.copyFileSync(dylib, NATIVE_NODE_PATH);

const CLI_BINARY = path.join(TARGET_DIR, 'react-compiler-e2e');

// --- Load plugins ---
const tsPlugin = require('../packages/babel-plugin-react-compiler/src').default;
const rustPlugin =
  require('../packages/babel-plugin-react-compiler-rust/src').default;

// --- Format code with prettier ---
async function formatCode(code: string, isFlow: boolean): Promise<string> {
  try {
    return await prettier.format(code, {
      semi: true,
      parser: isFlow ? 'flow' : 'babel-ts',
    });
  } catch {
    return code;
  }
}

// --- Compile via Babel plugin ---
function compileBabel(
  plugin: any,
  fixturePath: string,
  source: string,
  firstLine: string,
): {code: string | null; error: string | null} {
  const isFlow = firstLine.includes('@flow');
  const isScript = firstLine.includes('@script');
  const parserPlugins: string[] = isFlow
    ? ['flow', 'jsx']
    : ['typescript', 'jsx'];

  const pragmaOpts = parseConfigPragmaForTests(firstLine, {
    compilationMode: 'all',
  });

  const pluginOptions = {
    ...pragmaOpts,
    compilationMode: 'all' as const,
    panicThreshold: 'all_errors' as const,
    logger: {
      logEvent(): void {},
      debugLogIRs(): void {},
    },
  };

  try {
    const result = babel.transformSync(source, {
      filename: fixturePath,
      sourceType: isScript ? 'script' : 'module',
      parserOpts: {plugins: parserPlugins},
      plugins: [[plugin, pluginOptions]],
      configFile: false,
      babelrc: false,
    });
    return {code: result?.code ?? null, error: null};
  } catch (e) {
    return {code: null, error: e instanceof Error ? e.message : String(e)};
  }
}

// --- Compile via CLI binary ---
function compileCli(
  frontend: 'swc' | 'oxc',
  fixturePath: string,
  source: string,
  firstLine: string,
): {code: string | null; error: string | null} {
  const pragmaOpts = parseConfigPragmaForTests(firstLine, {
    compilationMode: 'all',
  });

  const options = {
    shouldCompile: true,
    enableReanimated: false,
    isDev: false,
    ...pragmaOpts,
    compilationMode: 'all',
    panicThreshold: 'all_errors',
  };

  const result = spawnSync(
    CLI_BINARY,
    [
      '--frontend',
      frontend,
      '--filename',
      fixturePath,
      '--options',
      JSON.stringify(options),
    ],
    {
      input: source,
      encoding: 'utf-8',
      timeout: 30000,
    },
  );

  if (result.status !== 0) {
    return {
      code: null,
      error: result.stderr || `Process exited with code ${result.status}`,
    };
  }

  return {code: result.stdout, error: null};
}

// --- Simple unified diff ---
function unifiedDiff(
  expected: string,
  actual: string,
  leftLabel: string,
  rightLabel: string,
): string {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const lines: string[] = [];
  lines.push(`${RED}--- ${leftLabel}${RESET}`);
  lines.push(`${GREEN}+++ ${rightLabel}${RESET}`);

  const maxLen = Math.max(expectedLines.length, actualLines.length);
  let contextStart = -1;
  for (let i = 0; i < maxLen; i++) {
    const eLine = i < expectedLines.length ? expectedLines[i] : undefined;
    const aLine = i < actualLines.length ? actualLines[i] : undefined;
    if (eLine === aLine) continue;
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
type Variant = 'babel' | 'swc' | 'oxc';
const ALL_VARIANTS: Variant[] = ['babel', 'swc', 'oxc'];
const variants: Variant[] = variantArg ? [variantArg] : ALL_VARIANTS;

const fixtures = discoverFixtures(fixturesPath);
if (fixtures.length === 0) {
  console.error('No fixtures found at', fixturesPath);
  process.exit(1);
}

interface VariantStats {
  passed: number;
  failed: number;
  failures: Array<{fixture: string; detail: string}>;
  failedFixtures: string[];
}

function makeStats(): VariantStats {
  return {passed: 0, failed: 0, failures: [], failedFixtures: []};
}

// --- Progress helper ---
function writeProgress(msg: string): void {
  if (process.stderr.isTTY) {
    process.stderr.write(`\r\x1b[K${msg}`);
  }
}

function clearProgress(): void {
  if (process.stderr.isTTY) {
    process.stderr.write('\r\x1b[K');
  }
}

// --- Pre-compute TS baselines (shared across variants) ---
interface FixtureInfo {
  fixturePath: string;
  relPath: string;
  source: string;
  firstLine: string;
  isFlow: boolean;
}

async function runVariant(
  variant: Variant,
  fixtureInfos: FixtureInfo[],
  tsBaselines: Map<string, string>,
  s: VariantStats,
): Promise<void> {
  for (let i = 0; i < fixtureInfos.length; i++) {
    const {fixturePath, relPath, source, firstLine, isFlow} = fixtureInfos[i];
    const tsCode = tsBaselines.get(fixturePath)!;

    writeProgress(
      `  ${variant}: ${i + 1}/${fixtureInfos.length} (${s.passed} passed, ${s.failed} failed)`,
    );

    let variantResult: {code: string | null; error: string | null};
    if (variant === 'babel') {
      variantResult = compileBabel(rustPlugin, fixturePath, source, firstLine);
    } else {
      variantResult = compileCli(variant, fixturePath, source, firstLine);
    }

    const variantCode = await formatCode(variantResult.code ?? '', isFlow);

    if (tsCode === variantCode) {
      s.passed++;
    } else {
      s.failed++;
      s.failedFixtures.push(relPath);
      if (limitArg === 0 || s.failures.length < limitArg) {
        s.failures.push({
          fixture: relPath,
          detail: unifiedDiff(tsCode, variantCode, 'TypeScript', variant),
        });
      }
    }
  }
  clearProgress();
}

(async () => {
  const stats = new Map<Variant, VariantStats>();
  for (const v of variants) {
    stats.set(v, makeStats());
  }

  if (variantArg) {
    console.log(
      `Testing ${BOLD}${fixtures.length}${RESET} fixtures: TS baseline vs ${BOLD}${variantArg}${RESET}`,
    );
  } else {
    console.log(
      `Testing ${BOLD}${fixtures.length}${RESET} fixtures across all variants`,
    );
  }
  console.log('');

  // Pre-compute fixture info and TS baselines
  const fixtureInfos: FixtureInfo[] = [];
  const tsBaselines = new Map<string, string>();

  console.log('Computing TS baselines...');
  for (let i = 0; i < fixtures.length; i++) {
    const fixturePath = fixtures[i];
    const relPath = path.relative(REPO_ROOT, fixturePath);
    const source = fs.readFileSync(fixturePath, 'utf8');
    const firstLine = source.substring(0, source.indexOf('\n'));
    const isFlow = firstLine.includes('@flow');

    writeProgress(`  baseline: ${i + 1}/${fixtures.length}`);

    const tsResult = compileBabel(tsPlugin, fixturePath, source, firstLine);
    const tsCode = await formatCode(tsResult.code ?? '', isFlow);

    fixtureInfos.push({fixturePath, relPath, source, firstLine, isFlow});
    tsBaselines.set(fixturePath, tsCode);
  }
  clearProgress();
  console.log(`Computed ${fixtures.length} baselines.`);
  console.log('');

  // Run each variant
  for (const variant of variants) {
    console.log(`Running ${BOLD}${variant}${RESET} variant...`);
    await runVariant(variant, fixtureInfos, tsBaselines, stats.get(variant)!);
    const s = stats.get(variant)!;
    console.log(`  ${s.passed} passed, ${s.failed} failed`);
  }
  console.log('');

  // --- Output ---
  if (variantArg) {
    // Single variant mode: show diffs
    const s = stats.get(variantArg)!;
    const total = fixtures.length;
    const summaryColor = s.failed === 0 ? GREEN : RED;
    console.log(
      `${summaryColor}Results: ${s.passed} passed, ${s.failed} failed (${total} total)${RESET}`,
    );
    console.log('');

    for (const failure of s.failures) {
      console.log(`${RED}FAIL${RESET} ${failure.fixture}`);
      console.log(failure.detail);
      console.log('');
    }

    if (s.failures.length < s.failed) {
      console.log(
        `${DIM}  (showing first ${s.failures.length} of ${s.failed} failures)${RESET}`,
      );
    }

    console.log('---');
    console.log(
      `${summaryColor}Results: ${s.passed} passed, ${s.failed} failed (${total} total)${RESET}`,
    );
  } else {
    // Summary table mode
    const total = fixtures.length;

    // Table header
    const hdr = `${'Variant'.padEnd(10)} ${'Passed'.padEnd(8)} ${'Failed'.padEnd(8)} Total`;
    console.log(`${BOLD}${hdr}${RESET}`);

    for (const variant of ALL_VARIANTS) {
      const s = stats.get(variant)!;
      const color = s.failed === 0 ? GREEN : s.passed === 0 ? RED : YELLOW;
      const line = `${variant.padEnd(10)} ${String(s.passed).padEnd(8)} ${String(s.failed).padEnd(8)} ${total}`;
      console.log(`${color}${line}${RESET}`);
    }
  }

  // Exit with failure if any variant has failures
  const anyFailed = [...stats.values()].some(s => s.failed > 0);
  process.exit(anyFailed ? 1 : 0);
})();
