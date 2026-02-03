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
import {PROJECT_ROOT} from './constants';
import {TestFilter, getFixtures} from './fixture-utils';
import {TestResult, TestResults, report, update} from './reporter';
import {
  RunnerAction,
  RunnerState,
  makeWatchRunner,
  watchSrc,
} from './runner-watch';
import * as runnerWorker from './runner-worker';
import {execSync} from 'child_process';
import {runMinimize} from './minimize';

const WORKER_PATH = require.resolve('./runner-worker.js');
const NUM_WORKERS = cpus().length - 1;

readline.emitKeypressEvents(process.stdin);

type RunnerOptions = {
  sync: boolean;
  workerThreads: boolean;
  watch: boolean;
  update: boolean;
  pattern?: string;
  debug: boolean;
};

async function runTestCommand(opts: RunnerOptions): Promise<void> {
  await main(opts);
}

async function runMinimizeCommand(path: string): Promise<void> {
  await runMinimize({path});
}

yargs(hideBin(process.argv))
  .command(
    ['test', '$0'],
    'Run compiler tests',
    yargs => {
      return yargs
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
        .describe(
          'watch',
          'Run compiler in watch mode, re-running after changes',
        )
        .alias('w', 'watch')
        .default('watch', false)
        .boolean('update')
        .alias('u', 'update')
        .describe('update', 'Update fixtures')
        .default('update', false)
        .string('pattern')
        .alias('p', 'pattern')
        .describe(
          'pattern',
          'Optional glob pattern to filter fixtures (e.g., "error.*", "use-memo")',
        )
        .boolean('debug')
        .alias('d', 'debug')
        .describe('debug', 'Enable debug logging to print HIR for each pass')
        .default('debug', false);
    },
    async argv => {
      await runTestCommand(argv as RunnerOptions);
    },
  )
  .command(
    'minimize',
    'Minimize a test case to reproduce a compiler error',
    yargs => {
      return yargs
        .string('path')
        .alias('p', 'path')
        .describe('path', 'Path to the file to minimize')
        .demandOption('path');
    },
    async argv => {
      await runMinimizeCommand(argv.path as string);
    },
  )
  .help('help')
  .strict()
  .demandCommand()
  .parse();

/**
 * Do a test run and return the test results
 */
async function runFixtures(
  worker: Worker & typeof runnerWorker,
  filter: TestFilter | null,
  compilerVersion: number,
  debug: boolean,
  requireSingleFixture: boolean,
  sync: boolean,
): Promise<TestResults> {
  // We could in theory be fancy about tracking the contents of the fixtures
  // directory via our file subscription, but it's simpler to just re-read
  // the directory each time.
  const fixtures = await getFixtures(filter);
  const isOnlyFixture = filter !== null && fixtures.size === 1;
  const shouldLog = debug && (!requireSingleFixture || isOnlyFixture);

  let entries: Array<[string, TestResult]>;
  if (!sync) {
    // Note: promise.all to ensure parallelism when enabled
    const work: Array<Promise<[string, TestResult]>> = [];
    for (const [fixtureName, fixture] of fixtures) {
      work.push(
        worker
          .transformFixture(fixture, compilerVersion, shouldLog, true)
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
        shouldLog,
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
  sync: boolean,
) {
  const {compilerVersion, isCompilerBuildValid, mode, filter, debug} = state;
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
      debug,
      true, // requireSingleFixture in watch mode
      sync,
    );
    const end = performance.now();

    // Track fixture status for autocomplete suggestions
    for (const [basename, result] of results) {
      const failed =
        result.actual !== result.expected || result.unexpectedError != null;
      state.fixtureLastRunStatus.set(basename, failed ? 'fail' : 'pass');
    }

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
        ? `Current mode = FILTER, pattern = "${filter?.paths[0] ?? ''}".`
        : 'Current mode = NORMAL, run all test fixtures.') +
      '\nWaiting for input or file changes...\n' +
      'u     - update all fixtures\n' +
      `d     - toggle (turn ${debug ? 'off' : 'on'}) debug logging\n` +
      'p     - enter pattern to filter fixtures\n' +
      (mode.filter ? 'a     - run all tests (exit filter mode)\n' : '') +
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

  // Check if watch mode should be enabled
  const shouldWatch = opts.watch;

  if (shouldWatch) {
    makeWatchRunner(
      state => onChange(worker, state, opts.sync),
      opts.debug,
      opts.pattern,
    );
    if (opts.pattern) {
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
        async (isTypecheckSuccess: boolean) => {
          let isSuccess = false;
          if (!isTypecheckSuccess) {
            console.error(
              'Found typescript errors in Forget source code, skipping test fixtures.',
            );
          } else {
            try {
              execSync('yarn build', {cwd: PROJECT_ROOT});
              console.log('Built compiler successfully with tsup');

              // Determine which filter to use
              let testFilter: TestFilter | null = null;
              if (opts.pattern) {
                testFilter = {
                  paths: [opts.pattern],
                };
              }

              const results = await runFixtures(
                worker,
                testFilter,
                0,
                opts.debug,
                false, // no requireSingleFixture in non-watch mode
                opts.sync,
              );
              if (opts.update) {
                update(results);
                isSuccess = true;
              } else {
                isSuccess = report(results);
              }
            } catch (e) {
              console.warn('Failed to build compiler with tsup:', e);
            }
          }
          tsWatch?.close();
          await worker.end();
          process.exit(isSuccess ? 0 : 1);
        },
      );
  }
}
