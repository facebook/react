/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import watcher from "@parcel/watcher";
import {
  COMPILER_PATH,
  FILTER_FILENAME,
  FILTER_PATH,
  FIXTURES_PATH,
  LOGGER_PATH,
  PARSE_CONFIG_PRAGMA_PATH,
  TestFilter,
  TestResult,
  TestResults,
  getFixtures,
  readTestFilter,
  report,
  update,
} from "fixture-test-utils";
import { Worker } from "jest-worker";
import path from "path";
import process from "process";
import * as readline from "readline";
import ts from "typescript";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as compiler from "./compiler-worker";

const WORKER_PATH = require.resolve("./compiler-worker.js");

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
): Promise<TestResults> {
  // We could in theory be fancy about tracking the contents of the fixtures
  // directory via our file subscription, but it's simpler to just re-read
  // the directory each time.
  const fixtures = await getFixtures(filter);
  const isOnlyFixture = filter !== null && fixtures.size === 1;

  let entries: Array<[string, TestResult]>;
  if (!opts.sync) {
    // Note: promise.all to ensure parallelism when enabled
    const work: Array<Promise<[string, TestResult]>> = [];
    for (const [fixtureName, fixture] of fixtures) {
      work.push(
        worker
          .compile(
            COMPILER_PATH,
            LOGGER_PATH,
            PARSE_CONFIG_PRAGMA_PATH,
            fixture,
            compilerVersion,
            filter?.debug ?? false,
            isOnlyFixture
          )
          .then((result) => [fixtureName, result])
      );
    }

    entries = await Promise.all(work);
  } else {
    entries = [];
    for (const [fixtureName, fixture] of fixtures) {
      let output = await compiler.compile(
        COMPILER_PATH,
        LOGGER_PATH,
        PARSE_CONFIG_PRAGMA_PATH,
        fixture,
        compilerVersion,
        filter?.debug ?? false,
        isOnlyFixture
      );
      entries.push([fixtureName, output]);
    }
  }

  return new Map(entries);
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
    let testFilter: TestFilter | null;

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
        // we don't clear console after this point, since
        // it may contain debug console logging
        const results = await run(
          worker,
          opts,
          filterMode ? await readTestFilter() : null,
          compilerVersion
        );
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
            ? `Current mode = FILTER, filter test fixtures by "${FILTER_PATH}".`
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
          if (filterMode) {
            testFilter = await readTestFilter();
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
      async (compileSuccess: boolean) => {
        let isSuccess = compileSuccess;
        if (compileSuccess) {
          const testFilter =
            opts.mode === "filter" ? await readTestFilter() : null;
          const results = await run(worker, opts, testFilter, 0);
          if (opts.mode === "update") {
            update(results);
          } else {
            const testSuccess = report(results);
            isSuccess &&= testSuccess;
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
        process.exit(isSuccess ? 0 : 1);
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
