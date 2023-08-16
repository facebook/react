/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from "chalk";
import { TestFixture } from "fixture-test-utils";
import { getFixtures, readTestFilter } from "fixture-test-utils";
import { Worker } from "jest-worker";
import process from "process";
import * as readline from "readline";
import * as RunnerWorker from "./runner-worker";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import SproutOnlyFilterTodoRemove from "./SproutOnlyFilterTodoRemove";
import { FILTER_FILENAME } from "fixture-test-utils";

const WORKER_PATH = require.resolve("./runner-worker");
readline.emitKeypressEvents(process.stdin);

process.stdin.on("keypress", function (_, key) {
  if (key && key.name === "c" && key.ctrl) {
    process.exit(1);
  }
});
process.on("SIGINT", function () {
  // Parent process may send SIGINT
  process.exit(1);
});

process.on("SIGTERM", function () {
  process.exit(1);
});

type RunnerOptions = {
  filter: boolean;
  sync: boolean;
  verbose: boolean;
};

const opts: RunnerOptions = yargs
  .boolean("sync")
  .describe(
    "sync",
    "Run compiler in main thread (instead of using worker threads or subprocesses). Defaults to false."
  )
  .default("sync", false)
  .boolean("filter")
  .describe(
    "filter",
    `Evaluate fixtures in filter mode ("${FILTER_FILENAME}")\n`
  )
  .default("filter", false)
  .boolean("verbose")
  .describe("verbose", "Print results of passing fixtures.")
  .default("verbose", false)
  .help("help")
  .strict()
  .parseSync(hideBin(process.argv));

function logsEqual(a: Array<string>, b: Array<string>) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((val, idx) => val === b[idx]);
}

function reportResults(
  results: Array<[string, RunnerWorker.TestResult]>,
  verbose: boolean
): boolean {
  const failures: Array<[string, RunnerWorker.TestResult]> = [];

  for (const [fixtureName, result] of results) {
    if (result.unexpectedError !== null) {
      console.log(
        chalk.red.inverse.bold(" FAIL ") + " " + chalk.dim(fixtureName)
      );
      failures.push([fixtureName, result]);
      continue;
    }
    const { forgetResult, nonForgetResult } = result;
    if (
      forgetResult.kind === "UnexpectedError" ||
      nonForgetResult.kind === "UnexpectedError" ||
      forgetResult.kind !== nonForgetResult.kind ||
      forgetResult.value !== nonForgetResult.value ||
      !logsEqual(forgetResult.logs, nonForgetResult.logs)
    ) {
      console.log(
        chalk.red.inverse.bold(" FAIL ") + " " + chalk.dim(fixtureName)
      );
      failures.push([fixtureName, result]);
    } else {
      console.log(
        chalk.green.inverse.bold(" PASS ") + " " + chalk.dim(fixtureName)
      );
      if (verbose) {
        console.log(
          ` ${forgetResult.kind} ${forgetResult.value} ${
            forgetResult.logs.length > 0
              ? JSON.stringify(forgetResult.logs, undefined, 2)
              : ""
          }`
        );
      }
    }
  }

  if (failures.length !== 0) {
    console.log("\n" + chalk.red.bold("Failures:") + "\n");

    for (const [fixtureName, result] of failures) {
      console.log(chalk.red.bold("FAIL:") + " " + fixtureName);

      if (result.unexpectedError !== null) {
        console.log(
          chalk.red("Unexpected error when building fixture:") +
            ` ${result.unexpectedError}`
        );
        continue;
      }
      const { forgetResult, nonForgetResult } = result;
      if (forgetResult.kind === "UnexpectedError") {
        console.log(
          chalk.red(
            "Unexpected error when evaluating Forget-transformed fixture:"
          ) + ` ${forgetResult.value}`
        );
      }
      if (nonForgetResult.kind === "UnexpectedError") {
        console.log(
          chalk.red("Unexpected error when evaluating original fixture:") +
            ` ${nonForgetResult.value}`
        );
      }
      const hasUnexpectedError =
        forgetResult.kind === "UnexpectedError" ||
        nonForgetResult.kind === "UnexpectedError";
      if (
        !hasUnexpectedError &&
        (forgetResult.kind !== nonForgetResult.kind ||
          forgetResult.value !== nonForgetResult.value ||
          !logsEqual(forgetResult.logs, nonForgetResult.logs))
      ) {
        console.log(
          chalk.red("Difference in forget and non-forget results.") +
            `\nExpected result: ${JSON.stringify(
              forgetResult,
              undefined,
              2
            )}\nFound: ${JSON.stringify(nonForgetResult, undefined, 2)}`
        );
      }
    }
  }

  console.log(
    `${results.length} Tests, ${results.length - failures.length} Passed, ${
      failures.length
    } Failed`
  );
  return failures.length === 0;
}

/**
 * Runs the compiler in watch or single-execution mode
 */
export async function main(opts: RunnerOptions): Promise<void> {
  const worker: Worker & typeof RunnerWorker = new Worker(WORKER_PATH, {
    enableWorkerThreads: true,
  }) as any;
  worker.getStderr().pipe(process.stderr);
  worker.getStdout().pipe(process.stdout);

  const testFilter = opts.filter ? await readTestFilter() : null;
  let allFixtures: Map<string, TestFixture> = getFixtures(testFilter);

  allFixtures = new Map(
    Array.from(allFixtures.entries()).filter(([filename, _]) =>
      SproutOnlyFilterTodoRemove.has(filename)
    )
  );

  const validFixtures = new Map();
  for (const [name, fixture] of allFixtures) {
    if (fixture.basename.startsWith("error.")) {
      // skip
      continue;
    }
    validFixtures.set(name, fixture);
  }

  const results: Array<[string, RunnerWorker.TestResult]> = [];
  if (!opts.sync) {
    const work: Array<Promise<[string, RunnerWorker.TestResult]>> = [];
    for (const [fixtureName, fixture] of validFixtures) {
      work.push(worker.run(fixture).then((result) => [fixtureName, result]));
    }
    results.push(...(await Promise.all(work)));
  } else {
    for (const [fixtureName, fixture] of validFixtures) {
      const result: [string, RunnerWorker.TestResult] = await RunnerWorker.run(
        fixture
      ).then((result) => [fixtureName, result]);
      results.push(result);
    }
  }

  const isSuccess = reportResults(results, opts.verbose);
  process.exit(isSuccess ? 0 : 1);
}

main(opts).catch((error) => console.error(error));
