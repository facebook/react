/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Worker} from 'jest-worker';
import {cpus} from 'os';
import process from 'process';
import * as readline from 'readline';
import ts from 'typescript';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {FILTER_PATH} from './constants';
import {TestFilter, getFixtures, readTestFilter} from './fixture-utils';
import {TestResult, TestResults, report, update} from './reporter';
import {
  RunnerAction,
  RunnerState,
  makeWatchRunner,
  watchSrc,
} from './runner-watch';
import * as runnerWorker from './runner-worker';

const WORKER_PATH = require.resolve('./runner-worker.js');
const NUM_WORKERS = cpus().length - 1;

readline.emitKeypressEvents(process.stdin);

type RunnerOptions = {
  sync: boolean;
  workerThreads: boolean;
  watch: boolean;
  filter: boolean;
  update: boolean;
};

const opts: RunnerOptions = yargs
  .boolean('sync')
  .describe(
    'sync',
    'Run compiler in main thread (instead of using worker threads or subprocesses). Defaults to false.',
  )
  .default('sync', false)
  .boolean('worker-threads')
  .describe(
    'worker-threads',
    'Run compiler in worker threads (instead of subprocesses). Defaults to true.',
  )
  .default('worker-threads', true)
  .boolean('watch')
  .describe('watch', 'Run compiler in watch mode, re-running after changes')
  .default('watch', false)
  .boolean('update')
  .describe('update', 'Update fixtures')
  .default('update', false)
  .boolean('filter')
  .describe(
    'filter',
    'Only run fixtures which match the contents of testfilter.txt',
  )
  .default('filter', false)
  .help('help')
  .strict()
  .parseSync(hideBin(process.argv));

/**
 * Do a test run and return the test results
 */
async function runFixtures(
  worker: Worker & typeof runnerWorker,
  filter: TestFilter | null,
  compilerVersion: number,
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
          .transformFixture(
            fixture,
            compilerVersion,
            (filter?.debug ?? false) && isOnlyFixture,
            true,
          )
          .then(result => [fixtureName, result]),
      );
    }

    entries = await Promise.all(work);
  } else {
    entries = [];
    for (const [fixtureName, fixture] of fixtures) {
      let output = await runnerWorker.transformFixture(
        fixture,
        compilerVersion,
        (filter?.debug ?? false) && isOnlyFixture,
        true,
      );
      entries.push([fixtureName, output]);
    }
  }

  return new Map(entries);
}

// Callback to re-run tests after some change
async function onChange(
  worker: Worker & typeof runnerWorker,
  state: RunnerState,
) {
  const {compilerVersion, isCompilerBuildValid, mode, filter} = state;
  if (isCompilerBuildValid) {
    const start = performance.now();

    // console.clear() only works when stdout is connected to a TTY device.
    // we're currently piping stdout (see main.ts), so let's do a 'hack'
    console.log('\u001Bc');

    // we don't clear console after this point, since
    // it may contain debug console logging
    const results = await runFixtures(
      worker,
      mode.filter ? filter : null,
      compilerVersion,
    );
    const end = performance.now();
    if (mode.action === RunnerAction.Update) {
      update(results);
      state.lastUpdate = end;
    } else {
      report(results);
    }
    console.log(`Completed in ${Math.floor(end - start)} ms`);
  } else {
    console.error(
      `${mode}: Found errors in Forget source code, skipping test fixtures.`,
    );
  }
  console.log(
    '\n' +
      (mode.filter
        ? `Current mode = FILTER, filter test fixtures by "${FILTER_PATH}".`
        : 'Current mode = NORMAL, run all test fixtures.') +
      '\nWaiting for input or file changes...\n' +
      'u     - update all fixtures\n' +
      `f     - toggle (turn ${mode.filter ? 'off' : 'on'}) filter mode\n` +
      'q     - quit\n' +
      '[any] - rerun tests\n',
  );
}

/**
 * Runs the compiler in watch or single-execution mode
 */
export async function main(opts: RunnerOptions): Promise<void> {
  const worker: Worker & typeof runnerWorker = new Worker(WORKER_PATH, {
    enableWorkerThreads: opts.workerThreads,
    numWorkers: NUM_WORKERS,
  }) as any;
  worker.getStderr().pipe(process.stderr);
  worker.getStdout().pipe(process.stdout);

  if (opts.watch) {
    makeWatchRunner(state => onChange(worker, state), opts.filter);
    if (opts.filter) {
      /**
       * Warm up wormers when in watch mode. Loading the Forget babel plugin
       * and all of its transitive dependencies takes 1-3s (per worker) on a M1.
       * As jest-worker dispatches tasks using a round-robin strategy, we can
       * avoid an additional 1-3s wait on the first num_workers runs by warming
       * up workers eagerly.
       */
      for (let i = 0; i < NUM_WORKERS - 1; i++) {
        worker.transformFixture(
          {
            fixturePath: 'tmp',
            snapshotPath: './tmp.expect.md',
            inputPath: './tmp.js',
            input: `
            function Foo(props) {
              return identity(props);
            }
            `,
            snapshot: null,
          },
          0,
          false,
          false,
        );
      }
    }
  } else {
    // Non-watch mode. For simplicity we re-use the same watchSrc() function.
    // After the first build completes run tests and exit
    const tsWatch: ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> =
      watchSrc(
        () => {},
        async (compileSuccess: boolean) => {
          let isSuccess = compileSuccess;
          if (compileSuccess) {
            const testFilter = opts.filter ? await readTestFilter() : null;
            const results = await runFixtures(worker, testFilter, 0);
            if (opts.update) {
              update(results);
            } else {
              const testSuccess = report(results);
              isSuccess &&= testSuccess;
            }
          } else {
            console.error(
              'Found errors in Forget source code, skipping test fixtures.',
            );
          }
          tsWatch.close();
          await worker.end();
          process.exit(isSuccess ? 0 : 1);
        },
      );
  }
}

main(opts).catch(error => console.error(error));
