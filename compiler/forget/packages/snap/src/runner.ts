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
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { TestResult } from "./compiler-worker";
import * as compiler from "./compiler-worker.js";

readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

const argv: {
  sync: boolean;
  workerThreads: boolean;
  watch: boolean;
  update: boolean;
} = yargs
  .boolean("sync")
  .describe(
    "sync",
    "Run compiler in main thread (instead of using worker threads or subprocesses). Defaults to false."
  )
  .default("sync", false)
  .boolean("worker-threads")
  .describe(
    "worker-threads",
    "Run compiler in worker threads (instead of subprocesses). Defaults to true."
  )
  .default("worker-threads", true)
  .boolean("watch")
  .describe("watch", "Run in watch mode. Defaults to false (single run).")
  .default("watch", false)
  .boolean("update") // Test mode by default, opt-in to update
  .describe(
    "update",
    "Run in update mode. Update mode only affects the first run, subsequent runs (in watch mode) require typing `u` to update. Defaults to false."
  )
  .default("update", false)
  .help("help")
  .strict()
  .parseSync(hideBin(process.argv));

const PARALLEL = !argv.sync;
const ENABLE_WORKER_THREADS = argv.workerThreads;
const WATCH = argv.watch;
const UPDATE = argv.update;
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

  let entries: Array<[string, TestResult]>;
  if (PARALLEL) {
    // Note: promise.all to ensure parallelism when enabled
    entries = await Promise.all(
      fixtures.map(async (fixture) => {
        let output = await worker.compile(
          COMPILER_PATH,
          FIXTURES_PATH,
          fixture,
          compilerVersion
        );
        return [fixture, output];
      })
    );
  } else {
    entries = [];
    for (const fixture of fixtures) {
      let output = await compiler.compile(
        COMPILER_PATH,
        FIXTURES_PATH,
        fixture,
        compilerVersion
      );
      entries.push([fixture, output]);
    }
  }

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
  onComplete: (isSuccess: boolean) => void
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
    () => {}, // we manually report errors in afterProgramCreate
    () => {} // we manually report watch status
  );

  const origCreateProgram = host.createProgram;
  host.createProgram = (rootNames, options, host, oldProgram) => {
    onStart();
    return origCreateProgram(rootNames, options, host, oldProgram);
  };
  const origPostProgramCreate = host.afterProgramCreate;
  host.afterProgramCreate = (program) => {
    origPostProgramCreate!(program);

    // syntactic diagnostics refer to javascript syntax
    const errors = program
      .getSyntacticDiagnostics()
      .filter((diag) => diag.category === ts.DiagnosticCategory.Error);
    // semantic diagnostics refer to typescript semantics
    errors.push(
      ...program
        .getSemanticDiagnostics()
        .filter((diag) => diag.category === ts.DiagnosticCategory.Error)
    );

    if (errors.length > 0) {
      for (const diagnostic of errors) {
        let fileLoc: string;
        if (diagnostic.file) {
          // https://github.com/microsoft/TypeScript/blob/ddd5084659c423f4003d2176e12d879b6a5bcf30/src/compiler/program.ts#L663-L674
          const { line, character } = ts.getLineAndCharacterOfPosition(
            diagnostic.file,
            diagnostic.start!
          );
          const fileName = path.relative(
            ts.sys.getCurrentDirectory(),
            diagnostic.file.fileName
          );
          fileLoc = `${fileName}:${line + 1}:${character + 1} - `;
        } else {
          fileLoc = "";
        }
        console.error(
          `${fileLoc}error TS${diagnostic.code}:`,
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
        );
      }
      console.error(
        `Compilation failed (${errors.length} ${
          errors.length > 1 ? "errors" : "error"
        }).\n`
      );
    }

    const isSuccess = errors.length === 0;
    onComplete(isSuccess);
  };

  // `createWatchProgram` creates an initial program, watches files, and updates
  // the program over time.
  return ts.createWatchProgram(host);
}

enum Mode {
  Test = "Test",
  Update = "Update",
}

/**
 * Runs the compiler in watch or single-execution mode
 */
async function main(): Promise<void> {
  if (WATCH) {
    // Monotonically increasing integer to describe the 'version' of the compiler.
    // This is passed to `compile()` (from compiler-worker) when compiling, so
    // that the worker knows when it has to reset its module cache and when its
    // safe to use a cached compiler version
    let compilerVersion = 0;
    let isCompilerValid = false;

    function onStart() {
      // Notify the user when compilation starts but don't clear the screen yet
      console.log("\nCompiling...");
    }

    // Callback to re-run tests after some change
    async function onChange({ mode }: { mode: Mode }) {
      if (isCompilerValid) {
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
        console.log(`Completed in ${Math.floor(end - start)} ms`);
      } else {
        console.error(
          `${mode}: Found errors in Forget source code, skipping test fixtures.`
        );
      }
      console.log(
        "\nWaiting for input or file changes...\n" +
          "u     - update fixtures\n" +
          "q     - quit\n" +
          "[any] - rerun tests\n"
      );
    }

    // Run TS in incremental watch mode
    const _tsWatch = watchSrc(onStart, (isSuccess) => {
      // Bump the compiler version after a build finishes
      // and re-run tests
      if (isSuccess) {
        compilerVersion++;
      }
      isCompilerValid = isSuccess;
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
      async (isSuccess: boolean) => {
        if (isSuccess) {
          const results = await run(0);
          if (UPDATE) {
            update(results);
          } else {
            report(results);
          }
        } else {
          console.error(
            "Found errors in Forget source code, skipping test fixtures."
          );
        }
        if (tsWatch != null) {
          tsWatch.close();
        }
        await worker.end();
        process.exit(isSuccess ? 0 : -1);
      }
    );
  }
}

// I couldn't figure out the right combination of settings to allow using `await` at the top-level,
// but it's easy enough to use the promise API just here
main().catch((error) => console.error(error));
