/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestFixture } from "fixture-test-utils";
import { getFixtures, readTestFilter } from "fixture-test-utils";
import { Worker } from "jest-worker";
import process from "process";
import * as readline from "readline";
import * as RunnerWorker from "./runner-worker";
import SproutOnlyFilterTodoRemove from "./SproutOnlyFilterTodoRemove";

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
  useFilter: boolean;
  sync: boolean;
  useTodoFilter: boolean;
};

function logsEqual(a: Array<string>, b: Array<string>) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((val, idx) => val === b[idx]);
}

function reportResults(results: Array<[string, RunnerWorker.TestResult]>) {
  for (const [fixtureName, result] of results) {
    if (result.unexpectedError !== null) {
      console.log(`ERROR ${fixtureName}: ${result.unexpectedError}`);
      continue;
    }
    const { forgetResult, nonForgetResult } = result;
    if (forgetResult.kind === "UnexpectedError") {
      console.log(`ERROR ${fixtureName}: ${forgetResult.value}`);
    } else if (nonForgetResult.kind === "UnexpectedError") {
      console.log(`ERROR ${fixtureName}: ${nonForgetResult.value}`);
    } else if (
      forgetResult.kind !== nonForgetResult.kind ||
      forgetResult.value !== nonForgetResult.value ||
      !logsEqual(forgetResult.logs, nonForgetResult.logs)
    ) {
      console.log(
        `FAIL  ${fixtureName}: Difference in forget and non-forget results. \nExpected result: ${JSON.stringify(
          forgetResult,
          undefined,
          2
        )}\nFound: ${JSON.stringify(nonForgetResult, undefined, 2)}`
      );
    } else {
      console.log(`PASS  ${fixtureName}`);
    }
  }
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

  const testFilter = opts.useFilter ? await readTestFilter() : null;
  let allFixtures: Map<string, TestFixture> = getFixtures(testFilter);

  if (opts.useTodoFilter) {
    allFixtures = new Map(
      Array.from(allFixtures.entries()).filter(([filename, _]) =>
        SproutOnlyFilterTodoRemove.has(filename)
      )
    );
  }

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

  reportResults(results);
  process.exit(0);
}

main({ useFilter: false, sync: true, useTodoFilter: true }).catch((error) =>
  console.error(error)
);
