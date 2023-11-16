/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  FILTER_FILENAME,
  TestResult,
  UpdateSnapshotKind,
  getFixtures,
  getUpdatedSnapshot,
  isExpectError,
  readTestFilter,
  report,
  update,
} from "fixture-test-utils";
import { Worker } from "jest-worker";
import process from "process";
import * as readline from "readline";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import SproutTodoFilter from "./SproutTodoFilter";
import { EvaluatorResult } from "./runner-evaluator";
import type { SproutFixtureResult } from "./runner-worker";
import * as RunnerWorker from "./runner-worker";

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
  sync: boolean;
  mode: "update" | "filter" | undefined;
};

const opts: RunnerOptions = yargs
  .boolean("sync")
  .describe(
    "sync",
    "Run compiler in main thread (instead of using worker threads)."
  )
  .default("sync", false)
  .option("mode", {
    type: "string",
    desc:
      "Sprout tester modes:\n" +
      "  [default] - test all test fixtures\n" +
      `  filter    - test filtered fixtures ("${FILTER_FILENAME}")\n` +
      "  update    - update all test fixtures)\n",
    choices: ["update", "filter", undefined],
    default: undefined,
  })
  .help("help")
  .strict()
  .parseSync(hideBin(process.argv));

function logsEqual(a: Array<string>, b: Array<string>) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((val, idx) => val === b[idx]);
}
function stringify(result: EvaluatorResult): string {
  return `(kind: ${result.kind}) ${result.value}${
    result.logs.length > 0 ? `\nlogs: [${result.logs.toString()}]` : ""
  }`;
}

function transformResult(result: SproutFixtureResult): TestResult {
  function makeError(description: string, value: string) {
    return {
      outputPath: result.snapshotPath,
      actual: null,
      expected: null,
      unexpectedError: `${description}\n${value}`,
    };
  }
  if (result.unexpectedError !== null) {
    return makeError("UnexpectedError in runner", result.unexpectedError);
  }
  const { forgetResult, nonForgetResult } = result;
  if (forgetResult.kind === "UnexpectedError") {
    return makeError("UnexpectedError in Forget runner", forgetResult.value);
  } else if (nonForgetResult.kind === "UnexpectedError") {
    return makeError(
      "UnexpectedError in non-forget runner",
      nonForgetResult.value
    );
  } else if (
    forgetResult.kind !== nonForgetResult.kind ||
    forgetResult.value !== nonForgetResult.value ||
    !logsEqual(forgetResult.logs, nonForgetResult.logs)
  ) {
    return makeError(
      "Found differences in evaluator results",
      `Non-forget (expected):
${stringify(nonForgetResult)}
Forget:
${stringify(forgetResult)}
`
    );
  } else {
    return {
      outputPath: result.snapshotPath,
      expected: result.snapshot,
      actual: getUpdatedSnapshot(
        result.snapshot,
        stringify(forgetResult),
        UpdateSnapshotKind.Sprout
      ),
      unexpectedError: null,
    };
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

  const testFilter = opts.mode === "filter" ? await readTestFilter() : null;
  const allFixtures = await getFixtures(testFilter);

  const validFixtures = new Map(
    Array.from(allFixtures.entries()).filter(([fixtureName, fixture]) => {
      return !SproutTodoFilter.has(fixtureName) && !isExpectError(fixture);
    })
  );
  const sproutResults: Array<[string, SproutFixtureResult]> = [];
  if (!opts.sync) {
    const work: Array<Promise<[string, SproutFixtureResult]>> = [];
    for (const [fixtureName, fixture] of validFixtures) {
      work.push(worker.run(fixture).then((result) => [fixtureName, result]));
    }
    sproutResults.push(...(await Promise.all(work)));
  } else {
    for (const [fixtureName, fixture] of validFixtures) {
      const result: [string, SproutFixtureResult] = await RunnerWorker.run(
        fixture
      ).then((result) => [fixtureName, result]);
      sproutResults.push(result);
    }
  }

  const results = new Map(
    sproutResults.map(([fixtureName, result]) => [
      fixtureName,
      transformResult(result),
    ])
  );
  let isSuccess;
  if (opts.mode === "update") {
    isSuccess = true;
    update(results);
  } else {
    isSuccess = report(results);
  }
  /**
   * This is important, as we're using jsdom (which seems to be attaching some
   * tasks that require force exiting. If we do not await workers terminating,
   * we may miss some console logs from jest workers.
   */
  await worker.end();
  process.exit(isSuccess ? 0 : 1);
}

main(opts).catch((error) => console.error(error));
