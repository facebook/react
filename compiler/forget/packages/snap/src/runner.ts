/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import watcher from "@parcel/watcher";
import chalk from "chalk";
import fs from "fs/promises";
import invariant from "invariant";
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
import { exists } from "./utils";

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
const FILTER_FILENAME = "testfilter.txt";
const FILTER_PATH = path.join(process.cwd(), FILTER_FILENAME);

readline.emitKeypressEvents(process.stdin);

process.stdin.on("keypress", function (chunk, key) {
  if (key && key.name === "c" && key.ctrl) {
    cleanup(-1);
  }
});
process.on("SIGINT", function () {
  // Parent process may send SIGINT
  cleanup(-1);
});

process.on("SIGTERM", function () {
  cleanup(-1);
});

type Results = Map<string, TestResult>;
type RunnerOptions = {
  sync: boolean;
  workerThreads: boolean;
  mode: "watch" | "update" | "filter" | null;
};

const opts: RunnerOptions = yargs
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
  .describe(
    "mode",
    "Snap tester modes:\n" +
      "  [default] - test all test fixtures\n" +
      `  filter    - test filtered fixtures ("${FILTER_FILENAME}")\n` +
      "  update    - update all test fixtures)\n" +
      "  watch     - watch for changes"
  )
  .choices("mode", ["watch", "update", "filter", null])
  .default("mode", null)
  .help("help")
  .strict()
  .parseSync(hideBin(process.argv));

/**
 * Cleanup / handle interrupts
 */
const cleanupTasks: Array<() => void> = new Array();
function pushCleanupTask(fn: () => void) {
  cleanupTasks.push(fn);
}
function cleanup(code: number) {
  for (const task of cleanupTasks) {
    task();
  }
  process.exit(code);
}
function clearConsole() {
  // console.clear() only works when stdout is connected to a TTY device.
  // we're currently piping stdout (see main.ts), so let's do a 'hack'
  console.log("\u001Bc");
}

/**
 * Do a test run and return the test results
 */
async function run(
  worker: Worker & typeof compiler,
  opts: RunnerOptions,
  filter: TestFilter | null,
  compilerVersion: number
): Promise<Results> {
  // We could in theory be fancy about tracking the contents of the fixtures
  // directory via our file subscription, but it's simpler to just re-read
  // the directory each time.
  const files = await fs.readdir(FIXTURES_PATH);
  const allFixtures = Array.from(
    new Set(
      files.map((file) => {
        return path.basename(path.basename(file, ".js"), ".expect.md");
      })
    )
  ).sort();

  let fixtures;
  if (filter) {
    if (filter.kind === "only") {
      fixtures = allFixtures.filter(
        (name) => filter.paths.indexOf(name) !== -1
      );
    } else if (filter.kind === "skip") {
      fixtures = allFixtures.filter(
        (name) => filter.paths.indexOf(name) === -1
      );
    } else {
      invariant(false, "Internal snap error.");
    }
  } else {
    fixtures = allFixtures;
  }

  let entries: Array<[string, TestResult]>;
  if (!opts.sync) {
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
    if (result.actual === result.expected && result.unexpectedError == null) {
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
      if (result.unexpectedError != null) {
        console.log(
          ` >> Unexpected error during test: \n${result.unexpectedError}`
        );
      } else {
        console.log(diff(result.actual, result.expected) + "\n");
      }
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
  const failed = [];
  for (const [basename, result] of results) {
    if (result.unexpectedError != null) {
      console.log(
        chalk.red.inverse.bold(" FAILED ") + " " + chalk.dim(basename)
      );
      failed.push([basename, result.unexpectedError]);
    } else if (result.actual == null) {
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
  console.log(
    `${deleted} Deleted, ${created} Created, ${updated} Updated, ${failed.length} Failed`
  );
  for (const [basename, errorMsg] of failed) {
    console.log(`${chalk.red.bold("Fail:")} ${basename}\n${errorMsg}`);
  }
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

type TestFilter =
  | {
      kind: "only";
      paths: Array<string>;
    }
  | {
      kind: "skip";
      paths: Array<string>;
    };

async function readTestFilter(): Promise<TestFilter | null> {
  const input = (await exists(FILTER_PATH))
    ? await fs.readFile(FILTER_PATH, "utf8")
    : null;
  if (input === null) {
    return null;
  }

  const lines = input.trim().split("\n");
  if (lines.length < 2) {
    console.warn("Misformed filter file. Expected at least two lines.");
    return null;
  }

  let filter: "only" | "skip" | null = null;
  if (lines[0]!.indexOf("@only") !== -1) {
    filter = "only";
  }
  if (lines[0]!.indexOf("@skip") !== -1) {
    filter = "skip";
  }
  if (filter === null) {
    console.warn(
      "Misformed filter file. Expected first line to contain @only or @skip"
    );
    return null;
  }
  lines.shift();
  return {
    kind: filter,
    paths: lines,
  };
}

/**
 * Runs the compiler in watch or single-execution mode
 */
export async function main(opts: RunnerOptions): Promise<void> {
  const worker: Worker & typeof compiler = new Worker(WORKER_PATH, {
    enableWorkerThreads: opts.workerThreads,
  }) as any;
  worker.getStderr().pipe(process.stderr);
  worker.getStdout().pipe(process.stdout);
  pushCleanupTask(() => {
    worker.end();
  });

  if (opts.mode === "watch") {
    // Monotonically increasing integer to describe the 'version' of the compiler.
    // This is passed to `compile()` (from compiler-worker) when compiling, so
    // that the worker knows when it has to reset its module cache and when its
    // safe to use a cached compiler version
    let compilerVersion = 0;
    let isCompilerValid = false;
    let lastUpdate = -1;
    let filterMode: boolean = false;
    let testFilter: TestFilter | null = await readTestFilter();

    function isRealUpdate(): boolean {
      // Try to ignore changes that occurred as a result of our explicitly updating
      // fixtures in update().
      // Currently keeps a timestamp of last known changes, and ignore events that occurred
      // around that timestamp.
      return performance.now() - lastUpdate > 5000;
    }

    function onStart() {
      // Notify the user when compilation starts but don't clear the screen yet
      console.log("\nCompiling...");
    }

    // Callback to re-run tests after some change
    async function onChange({ mode }: { mode: Mode }) {
      if (isCompilerValid) {
        const start = performance.now();
        clearConsole();
        console.log("Running tests...");
        const results = await run(
          worker,
          opts,
          filterMode ? testFilter : null,
          compilerVersion
        );
        clearConsole();
        if (mode === Mode.Update) {
          update(results);
        } else {
          report(results);
        }
        const end = performance.now();
        if (mode === Mode.Update) {
          lastUpdate = end;
        }
        console.log(`Completed in ${Math.floor(end - start)} ms`);
      } else {
        console.error(
          `${mode}: Found errors in Forget source code, skipping test fixtures.`
        );
      }
      console.log(
        "\n" +
          (filterMode
            ? `Current mode = FILTER, filter test fixtures by "${FILTER_FILENAME}".`
            : "Current mode = NORMAL, run all test fixtures.") +
          "\nWaiting for input or file changes...\n" +
          "u     - update all fixtures\n" +
          `f     - toggle (turn ${filterMode ? "off" : "on"}) filter mode\n` +
          "q     - quit\n" +
          "[any] - rerun tests\n"
      );
    }

    // Run TS in incremental watch mode
    const tsWatch = watchSrc(onStart, (isSuccess) => {
      // Bump the compiler version after a build finishes
      // and re-run tests
      if (isSuccess) {
        compilerVersion++;
      }
      isCompilerValid = isSuccess;
      onChange({ mode: Mode.Test });
    });
    pushCleanupTask(() => {
      tsWatch.close();
    });

    // Watch the fixtures directory for changes
    const fileSubscription = watcher.subscribe(
      FIXTURES_PATH,
      async (err, _events) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        if (isRealUpdate()) {
          // Fixtures changed, re-run tests
          onChange({ mode: Mode.Test });
        }
      }
    );

    pushCleanupTask(() => {
      fileSubscription
        .then((subscription) => {
          subscription.unsubscribe();
        })
        .catch((err) => {
          console.log("error cleaning up file subscription", err);
        });
    });

    const filterSubscription = watcher.subscribe(
      process.cwd(),
      async (err, events) => {
        if (err) {
          console.error(err);
          process.exit(1);
        } else if (
          events.findIndex((event) => event.path.includes(FILTER_FILENAME)) !==
          -1
        ) {
          testFilter = await readTestFilter();
          if (filterMode) {
            onChange({ mode: Mode.Test });
          }
        }
      }
    );
    pushCleanupTask(() => {
      filterSubscription
        .then((subscription) => {
          subscription.unsubscribe();
        })
        .catch((err) => {
          console.log("error cleaning up filter subscription", err);
        });
    });

    // Basic key event handling
    process.stdin.on("keypress", (str, key) => {
      if (key.name === "u") {
        // u => update fixtures
        onChange({ mode: Mode.Update });
      } else if (key.name === "q") {
        process.exit(0);
      } else if (key.name === "f") {
        filterMode = !filterMode;
        onChange({ mode: Mode.Test });
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
          const testFilter =
            opts.mode === "filter" ? await readTestFilter() : null;
          const results = await run(worker, opts, testFilter, 0);
          if (opts.mode === "update") {
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
          tsWatch = null;
        }
        await worker.end();
        process.exit(isSuccess ? 0 : -1);
      }
    );
    pushCleanupTask(() => {
      tsWatch?.close();
      tsWatch = null;
    });
  }
}

// I couldn't figure out the right combination of settings to allow using `await` at the top-level,
// but it's easy enough to use the promise API just here
main(opts).catch((error) => console.error(error));
