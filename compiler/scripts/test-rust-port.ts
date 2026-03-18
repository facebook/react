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
 * Usage: npx tsx compiler/scripts/test-rust-port.ts [<pass>] [<fixtures-path>]
 */

import * as babel from '@babel/core';
import {execSync} from 'child_process';
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

const REPO_ROOT = path.resolve(__dirname, '../..');

// --- Ordered pass list (HIR passes from Pipeline.ts) ---
const PASS_ORDER: string[] = [
  'HIR',
  'PruneMaybeThrows',
  'DropManualMemoization',
  'InlineImmediatelyInvokedFunctionExpressions',
  'MergeConsecutiveBlocks',
  'SSA',
  'EliminateRedundantPhi',
  'ConstantPropagation',
  'InferTypes',
  'OptimizePropsMethodCalls',
  'AnalyseFunctions',
  'InferMutationAliasingEffects',
  'OptimizeForSSR',
  'DeadCodeElimination',
  'InferMutationAliasingRanges',
  'InferReactivePlaces',
  'RewriteInstructionKindsBasedOnReassignment',
  'InferReactiveScopeVariables',
  'MemoizeFbtAndMacroOperandsInSameScope',
  'NameAnonymousFunctions',
  'OutlineFunctions',
  'AlignMethodCallScopes',
  'AlignObjectMethodScopes',
  'PruneUnusedLabelsHIR',
  'AlignReactiveScopesToBlockScopesHIR',
  'MergeOverlappingReactiveScopesHIR',
  'BuildReactiveScopeTerminalsHIR',
  'FlattenReactiveLoopsHIR',
  'FlattenScopesWithHooksOrUseHIR',
  'PropagateScopeDependenciesHIR',
];

// --- Detect last ported pass from pipeline.rs ---
function detectLastPortedPass(): string {
  const pipelinePath = path.join(
    REPO_ROOT,
    'compiler/crates/react_compiler/src/entrypoint/pipeline.rs',
  );
  const content = fs.readFileSync(pipelinePath, 'utf8');
  const matches = [...content.matchAll(/DebugLogEntry::new\("([^"]+)"/g)];
  const portedNames = new Set(matches.map(m => m[1]));

  let lastPorted: string | null = null;
  for (const pass of PASS_ORDER) {
    if (portedNames.has(pass)) {
      lastPorted = pass;
    }
  }
  if (!lastPorted) {
    throw new Error('No ported passes found in pipeline.rs');
  }
  return lastPorted;
}

// --- Parse args ---
const [passArgRaw, fixturesPathArg] = process.argv.slice(2);

let passArg: string;
if (passArgRaw) {
  passArg = passArgRaw;
} else {
  passArg = detectLastPortedPass();
  console.log(
    `No pass argument given, auto-detected last ported pass: ${BOLD}${passArg}${RESET}`,
  );
}
const DEFAULT_FIXTURES_DIR = path.join(
  REPO_ROOT,
  'compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler',
);

const fixturesPath = fixturesPathArg
  ? path.resolve(fixturesPathArg)
  : DEFAULT_FIXTURES_DIR;

// --- Build native module ---
const NATIVE_DIR = path.join(
  REPO_ROOT,
  'compiler/packages/babel-plugin-react-compiler-rust/native',
);
const NATIVE_NODE_PATH = path.join(NATIVE_DIR, 'index.node');

console.log('Building Rust native module...');
try {
  execSync('~/.cargo/bin/cargo build -p react_compiler_napi', {
    cwd: path.join(REPO_ROOT, 'compiler/crates'),
    stdio: 'inherit',
    shell: true,
  });
} catch {
  console.error(`${RED}ERROR: Failed to build Rust native module.${RESET}`);
  process.exit(1);
}

// Copy the built dylib as index.node (Node requires .node extension for native addons)
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

// --- Load plugins ---
const tsPlugin = require('../packages/babel-plugin-react-compiler/src').default;
const rustPlugin =
  require('../packages/babel-plugin-react-compiler-rust/src').default;

// --- Types ---
interface LogEntry {
  kind: 'entry';
  name: string;
  value: string;
}

interface LogEvent {
  kind: 'event';
  eventKind: string;
  fnName: string | null;
  detail: string;
}

type LogItem = LogEntry | LogEvent;

interface CompileOutput {
  log: LogItem[];
  error: string | null;
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

// --- Format a source location for comparison ---
function formatLoc(loc: unknown): string {
  if (loc == null) return '(none)';
  if (typeof loc === 'symbol') return '(generated)';
  const l = loc as Record<string, unknown>;
  const start = l.start as Record<string, unknown> | undefined;
  const end = l.end as Record<string, unknown> | undefined;
  if (start && end) {
    return `${start.line}:${start.column}-${end.line}:${end.column}`;
  }
  return String(loc);
}

// --- Compile a fixture through a Babel plugin and capture debug entries ---
function compileFixture(mode: CompileMode, fixturePath: string): CompileOutput {
  const source = fs.readFileSync(fixturePath, 'utf8');
  const firstLine = source.substring(0, source.indexOf('\n'));

  // Parse pragma config
  const pragmaOpts = parseConfigPragmaForTests(firstLine, {
    compilationMode: 'all',
  });

  // Capture debug entries and logger events in order, stopping after the target pass
  const log: LogItem[] = [];
  let reachedTarget = false;

  const logger = {
    logEvent(_filename: string | null, event: Record<string, unknown>): void {
      if (reachedTarget) return;
      const kind = event.kind as string;
      if (
        kind === 'CompileError' ||
        kind === 'CompileSkip' ||
        kind === 'CompileUnexpectedThrow' ||
        kind === 'PipelineError'
      ) {
        const fnName = (event.fnName as string | null) ?? null;
        let detail: string;
        if (kind === 'CompileError') {
          const d = event.detail as Record<string, unknown> | undefined;
          if (d) {
            const lines = [
              `reason: ${d.reason ?? '(none)'}`,
              `severity: ${d.severity ?? '(none)'}`,
              `category: ${d.category ?? '(none)'}`,
            ];
            if (d.description) {
              lines.push(`description: ${d.description}`);
            }
            // CompilerDiagnostic stores details in this.options.details (no getter),
            // while Rust JSON has details as a direct field. Check both paths.
            const opts = (d as Record<string, unknown>).options as
              | Record<string, unknown>
              | undefined;
            const details = (opts?.details ?? d.details) as
              | Array<Record<string, unknown>>
              | undefined;
            if (details && details.length > 0) {
              for (const item of details) {
                if (item.kind === 'error') {
                  lines.push(
                    `  error: ${formatLoc(item.loc)}${item.message ? ': ' + item.message : ''}`,
                  );
                } else if (item.kind === 'hint') {
                  lines.push(`  hint: ${item.message ?? ''}`);
                }
              }
            }
            // Legacy CompilerErrorDetail has loc directly
            if (d.loc && !details) {
              lines.push(`loc: ${formatLoc(d.loc)}`);
            }
            detail = lines.join('\n    ');
          } else {
            detail = '(no detail)';
          }
        } else if (kind === 'CompileSkip') {
          detail = (event.reason as string) ?? '(no reason)';
        } else {
          detail = (event.data as string) ?? '(no data)';
        }
        log.push({kind: 'event', eventKind: kind, fnName, detail});
      }
    },
    debugLogIRs(entry: CompilerPipelineValue): void {
      if (reachedTarget) return;
      if (entry.name === 'EnvironmentConfig') return;
      if (entry.kind === 'hir') {
        // TS pipeline emits HIR objects — convert to debug string
        log.push({
          kind: 'entry',
          name: entry.name,
          value: printDebugHIR(entry.value),
        });
      } else if (entry.kind === 'debug') {
        // Rust pipeline (and TS EnvironmentConfig) emits pre-formatted strings
        log.push({
          kind: 'entry',
          name: entry.name,
          value: entry.value,
        });
      } else if (
        (entry.kind === 'reactive' || entry.kind === 'ast') &&
        entry.name === passArg
      ) {
        throw new Error(
          `TODO: test-rust-port does not yet support '${entry.kind}' log entries ` +
            `(pass "${entry.name}"). Extend the debugLogIRs handler to support this kind.`,
        );
      }
      if (entry.name === passArg) {
        reachedTarget = true;
      }
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

  return {log, error};
}

// --- Format a single log item as comparable string ---
function formatLogItem(item: LogItem): string {
  if (item.kind === 'entry') {
    return `## ${item.name}\n${item.value}`;
  } else {
    return `[${item.eventKind}]${item.fnName ? ' ' + item.fnName : ''}: ${item.detail}`;
  }
}

// --- Format log items as comparable string ---
function formatLog(log: LogItem[]): string {
  return log.map(formatLogItem).join('\n');
}

// --- Normalize opaque IDs ---
// Type IDs and Identifier IDs are opaque identifiers whose absolute values
// differ between TS and Rust due to differences in allocation order.
// We normalize by remapping each unique ID to a sequential index.
function normalizeIds(text: string): string {
  const typeMap = new Map<string, number>();
  let nextTypeId = 0;
  const idMap = new Map<string, number>();
  let nextIdId = 0;
  const declMap = new Map<string, number>();
  let nextDeclId = 0;

  return text
    .replace(/\(generated\)/g, '(none)')
    .replace(/Type\(\d+\)/g, match => {
      if (!typeMap.has(match)) {
        typeMap.set(match, nextTypeId++);
      }
      return `Type(${typeMap.get(match)})`;
    })
    .replace(/((?:id|declarationId): )(\d+)/g, (_match, prefix, num) => {
      if (prefix === 'id: ') {
        const key = `id:${num}`;
        if (!idMap.has(key)) {
          idMap.set(key, nextIdId++);
        }
        return `${prefix}${idMap.get(key)}`;
      } else {
        const key = `decl:${num}`;
        if (!declMap.has(key)) {
          declMap.set(key, nextDeclId++);
        }
        return `${prefix}${declMap.get(key)}`;
      }
    })
    .replace(/Identifier\((\d+)\)/g, (_match, num) => {
      const key = `id:${num}`;
      if (!idMap.has(key)) {
        idMap.set(key, nextIdId++);
      }
      return `Identifier(${idMap.get(key)})`;
    });
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
  detail: string;
}> = [];

// Per-pass failure tracking for frontier detection
const perPassResults = new Map<string, {passed: number; failed: number}>();
for (const pass of PASS_ORDER) {
  perPassResults.set(pass, {passed: 0, failed: 0});
}

// --- Find the earliest diverging pass for a fixture ---
function findDivergencePass(tsLog: LogItem[], rustLog: LogItem[]): string {
  const maxLen = Math.max(tsLog.length, rustLog.length);
  for (let i = 0; i < maxLen; i++) {
    const tsItem = i < tsLog.length ? tsLog[i] : undefined;
    const rustItem = i < rustLog.length ? rustLog[i] : undefined;

    if (tsItem === undefined || rustItem === undefined) {
      // One log is shorter — attribute to the pass of the last available entry
      const item = tsItem ?? rustItem;
      if (item && item.kind === 'entry') {
        return item.name;
      }
      // For events, attribute to the preceding entry's pass
      for (let j = i - 1; j >= 0; j--) {
        const prev = tsLog[j] ?? rustLog[j];
        if (prev && prev.kind === 'entry') return prev.name;
      }
      // No preceding entry — attribute to first pass
      return PASS_ORDER[0];
    }

    const tsFormatted = normalizeIds(formatLogItem(tsItem));
    const rustFormatted = normalizeIds(formatLogItem(rustItem));
    if (tsFormatted !== rustFormatted) {
      if (tsItem.kind === 'entry') {
        return tsItem.name;
      }
      // For events, find the most recent entry pass
      for (let j = i - 1; j >= 0; j--) {
        if (tsLog[j] && tsLog[j].kind === 'entry') {
          return (tsLog[j] as LogEntry).name;
        }
      }
      // No preceding entry — attribute to first pass
      return PASS_ORDER[0];
    }
  }
  // No divergence found (shouldn't happen since caller verified logs differ)
  return PASS_ORDER[0];
}

for (const fixturePath of fixtures) {
  const relPath = path.relative(REPO_ROOT, fixturePath);
  const ts = compileFixture('ts', fixturePath);
  const rust = compileFixture('rust', fixturePath);

  // Check if TS produced any entries for the target pass
  if (ts.log.some(item => item.kind === 'entry' && item.name === passArg)) {
    tsHadEntries = true;
  }

  // Compare the full log (entries + events in order, up to target pass)
  const tsFormatted = normalizeIds(formatLog(ts.log));
  const rustFormatted = normalizeIds(formatLog(rust.log));

  if (tsFormatted === rustFormatted) {
    passed++;
    // Count as passed for all passes that appeared in the log
    const seenPasses = new Set<string>();
    for (const item of ts.log) {
      if (item.kind === 'entry') seenPasses.add(item.name);
    }
    for (const pass of seenPasses) {
      const stats = perPassResults.get(pass);
      if (stats) stats.passed++;
    }
  } else {
    failed++;
    // Find which pass diverged and attribute the failure
    const divergePass = findDivergencePass(ts.log, rust.log);
    const stats = perPassResults.get(divergePass);
    if (stats) stats.failed++;
    // Count passes before divergence as passed
    const seenPasses: string[] = [];
    for (const item of ts.log) {
      if (item.kind === 'entry' && item.name !== divergePass) {
        seenPasses.push(item.name);
      } else if (item.kind === 'entry') {
        break;
      }
    }
    for (const pass of seenPasses) {
      const stats = perPassResults.get(pass);
      if (stats) stats.passed++;
    }

    if (failures.length < 50) {
      failures.push({
        fixture: relPath,
        detail: unifiedDiff(tsFormatted, rustFormatted),
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

// --- Compute frontier ---
let frontier: string | null = null;
for (const pass of PASS_ORDER) {
  const stats = perPassResults.get(pass);
  if (stats && stats.failed > 0) {
    frontier = pass;
    break;
  }
}

// --- Summary line ---
const total = fixtures.length;
let frontierStr: string;
if (frontier != null) {
  frontierStr = frontier;
} else if (passArgRaw) {
  // Explicit pass arg given and it's clean — we can't know the global frontier
  frontierStr = `${passArg} passes, rerun without a pass name to find frontier`;
} else {
  frontierStr = 'none';
}
const summaryColor = failed === 0 ? GREEN : RED;
const summaryLine = `${summaryColor}Results: ${passed} passed, ${failed} failed (${total} total), frontier: ${frontierStr}${RESET}`;

// Print summary first
console.log(summaryLine);
console.log('');

// --- Show failures ---
for (const failure of failures) {
  console.log(`${RED}FAIL${RESET} ${failure.fixture}`);
  console.log(failure.detail);
  console.log('');
}

// --- Summary again (so tail -1 works) ---
console.log('---');
if (failures.length < failed) {
  console.log(
    `${DIM}  (showing first ${failures.length} of ${failed} failures)${RESET}`,
  );
}
console.log(summaryLine);

process.exit(failed > 0 ? 1 : 0);
