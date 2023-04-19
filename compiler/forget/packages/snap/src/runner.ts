/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import watcher from "@parcel/watcher";
import chalk from "chalk";
import fs from "fs/promises";
import { diff } from "jest-diff";
import { Worker } from "jest-worker";
import path from "path";
import process from "process";
import * as readline from "readline";
import ts from "typescript";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { TestResult } from "./compiler-worker";
import * as compiler from "./compiler-worker.js";

readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

const argv: {
  sync?: boolean;
  disableWorkerThreads?: boolean;
  watch?: boolean;
  update?: boolean;
} = yargs(hideBin(process.argv)).argv as any;

// Parallel by default
const PARALLEL = !argv.sync;

// Enable worker threads by default
const ENABLE_WORKER_THREADS = !argv.disableWorkerThreads;

// Single-run by default, opt-in to watch mode
const WATCH = !!argv.watch;

// Test mode by default, opt-in to update
// NOTE: update mode only affects the first run, subsequent runs (in watch mode)
// require typing `u` to update
const UPDATE = !!argv.update;

const WORKER_PATH = require.resolve("./compiler-worker.js");
const COMPILER_PATH = path.join(
  process.cwd(),
  "dist",
  "Babel",
  "RunReactForgetBabelPlugin.js"
);
const FIXTURES_PATH = path.join(
  process.cwd(),
  "src",
  "__tests__",
  "fixtures",
  "compiler"
);

const worker: Worker & typeof compiler = new Worker(WORKER_PATH, {
  enableWorkerThreads: ENABLE_WORKER_THREADS,
}) as any;
worker.getStderr().pipe(process.stderr);
worker.getStdout().pipe(process.stdout);

type Results = Map<string, TestResult>;

/**
 * Do a test run and return the test results
 */
async function run(compilerVersion: number): Promise<Results> {
  // We could in theory be fancy about tracking the contents of the fixtures
  // directory via our file subscription, but it's simpler to just re-read
  // the directory each time.
  const files = await fs.readdir(FIXTURES_PATH);
  const fixtures = Array.from(
    new Set(
      files.map((file) => {
        return path.basename(path.basename(file, ".js"), ".expect.md");
      })
    )
  ).sort();

  // Note: promise.all to ensure parallelism when enabled
  const entries: Array<[string, TestResult]> = await Promise.all(
    fixtures.map(async (fixture) => {
      let output: TestResult;
      if (PARALLEL) {
        output = await worker.compile(
          COMPILER_PATH,
          FIXTURES_PATH,
          fixture,
          compilerVersion
        );
      } else {
        output = await compiler.compile(
          COMPILER_PATH,
          FIXTURES_PATH,
          fixture,
          compilerVersion
        );
      }
      return [fixture, output];
    })
  );

  return new Map(entries);
}

/**
 * Report test results to the user
 */
function report(results: Results): void {
  const failures: Array<[string, TestResult]> = [];
  for (const [basename, result] of results) {
    if (result.actual === result.expected) {
      console.log(
        chalk.green.inverse.bold(" PASS ") + " " + chalk.dim(basename)
      );
    } else {
      console.log(chalk.red.inverse.bold(" FAIL ") + " " + chalk.dim(basename));
      failures.push([basename, result]);
    }
  }

  if (failures.length !== 0) {
    console.log("\n" + chalk.red.bold("Failures:") + "\n");

    for (const [basename, result] of failures) {
      console.log(chalk.red.bold("FAIL:") + " " + basename);
      console.log(diff(result.actual, result.expected) + "\n");
    }
  }

  console.log(
    `${results.size} Tests, ${results.size - failures.length} Passed, ${
      failures.length
    } Failed`
  );
}

/**
 * Update the fixtures directory given the compilation results
 */
async function update(results: Results): Promise<void> {
  let deleted = 0;
  let updated = 0;
  let created = 0;
  for (const [basename, result] of results) {
    if (result.actual == null) {
      // Input was deleted but the expect file still existed, remove it
      console.log(
        chalk.red.inverse.bold(" REMOVE ") + " " + chalk.dim(basename)
      );
      // await fs.unlink(result.inputPath);
      // await fs.unlink(result.outputPath);
      console.log(" remove  " + result.inputPath);
      console.log(" remove  " + result.outputPath);
      deleted++;
    } else if (result.actual !== result.expected) {
      // Expected output has changed
      console.log(
        chalk.blue.inverse.bold(" UPDATE ") + " " + chalk.dim(basename)
      );
      await fs.writeFile(result.outputPath, result.actual, "utf8");
      if (result.expected == null) {
        created++;
      } else {
        updated++;
      }
    } else {
      // Expected output is current
      console.log(
        chalk.green.inverse.bold("  OKAY  ") + " " + chalk.dim(basename)
      );
    }
  }
  console.log(`${deleted} Deleted, ${created} Created, ${updated} Updated`);
}

function watchSrc(
  onStart: () => void,
  onComplete: () => void
): ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> {
  const configPath = ts.findConfigFile(
    /*searchPath*/ "./",
    ts.sys.fileExists,
    "tsconfig.json"
  );
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }
  const createProgram = ts.createSemanticDiagnosticsBuilderProgram;
  const host = ts.createWatchCompilerHost(
    configPath,
    {},
    ts.sys,
    createProgram,
    reportDiagnostic,
    reportWatchStatusChanged
  );

  const origCreateProgram = host.createProgram;
  host.createProgram = (rootNames, options, host, oldProgram) => {
    onStart();
    return origCreateProgram(rootNames, options, host, oldProgram);
  };
  const origPostProgramCreate = host.afterProgramCreate;
  host.afterProgramCreate = (program) => {
    origPostProgramCreate!(program);
    onComplete();
  };

  // `createWatchProgram` creates an initial program, watches files, and updates
  // the program over time.
  return ts.createWatchProgram(host);
}

const formatHost = {
  getCanonicalFileName: (path: string) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

// Gets called if TS reported any errors with the source.
// TODO: wire this up, if there are errors we should just report them and
// probably not run tests.
function reportDiagnostic(diagnostic: ts.Diagnostic): void {
  console.error(
    "Error",
    diagnostic.code,
    ":",
    ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      formatHost.getNewLine()
    )
  );
}

/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */
function reportWatchStatusChanged(diagnostic: ts.Diagnostic): void {
  // console.info(ts.formatDiagnostic(diagnostic, formatHost));
}

enum Mode {
  Test = "Test",
  Update = "Update",
}

/**
 * Runs the compiler in watch or single-execution mode
 */
async function main(): Promise<void> {
  // Monotonically increasing integer to describe the 'version' of the compiler.
  // This is passed to `compile()` (from compiler-worker) when compiling, so
  // that the worker knows when it has to reset its module cache and when its
  // safe to use a cached compiler version
  let compilerVersion = 0;

  if (WATCH) {
    function onStart() {
      // Notify the user when compilation starts but don't clear the screen yet
      console.log("Compiling...");
    }

    // Callback to re-run tests after some change
    async function onChange({ mode }: { mode: Mode }) {
      const start = performance.now();
      console.clear();
      console.log("Running tests...");
      const results = await run(compilerVersion);
      console.clear();
      if (mode === Mode.Update) {
        update(results);
      } else {
        report(results);
      }
      const end = performance.now();
      console.log(`Completed in ${end - start} ms`);
    }

    // Run TS in incremental watch mode
    const _tsWatch = watchSrc(onStart, () => {
      // Bump the compiler version after a build finishes
      // and re-run tests
      compilerVersion++;
      onChange({ mode: Mode.Test });
    });

    // Watch the fixtures directory for changes
    // TODO: ignore changes that occurred as a result of our explicitly updating
    // fixtures in update() - maybe keep a timestamp of last known changes, and
    // ignore events that occurred prior to that timestamp.
    const _fileSubscription = watcher.subscribe(
      FIXTURES_PATH,
      async (err, _events) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        // Fixtures changed, re-run tests
        onChange({ mode: Mode.Test });
      }
    );

    // Basic key event handling
    process.stdin.on("keypress", (str, key) => {
      if (key.name === "u") {
        // u => update fixtures
        onChange({ mode: Mode.Update });
      } else if (key.name === "q") {
        process.exit(0);
      } else if (key.ctrl && key.name === "c") {
        process.exit(0);
      } else {
        // any other key re-runs tests
        onChange({ mode: Mode.Test });
      }
    });
  } else {
    // Non-watch mode. For simplicity we re-use the same watchSrc() function.
    // After the first build completes run tests and exit
    let tsWatch: ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> | null =
      null;
    tsWatch = watchSrc(
      () => {},
      async () => {
        const results = await run(compilerVersion);
        if (UPDATE) {
          update(results);
        } else {
          report(results);
        }
        if (tsWatch != null) {
          tsWatch.close();
        }
        await worker.end();
        process.exit();
      }
    );
  }
}

// I couldn't figure out the right combination of settings to allow using `await` at the top-level,
// but it's easy enough to use the promise API just here
main().catch((error) => console.error(error));
