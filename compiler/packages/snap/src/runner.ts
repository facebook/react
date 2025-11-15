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
import {FILTER_PATH, FIXTURES_PATH, PROJECT_ROOT} from './constants';
import {TestFilter, getFixtures, readTestFilter} from './fixture-utils';
import {TestResult, TestResults, report, update} from './reporter';
import {
  RunnerAction,
  RunnerState,
  makeWatchRunner,
  watchSrc,
} from './runner-watch';
import * as runnerWorker from './runner-worker';
import {execSync} from 'child_process';
import * as glob from 'glob';

const WORKER_PATH = require.resolve('./runner-worker.js');
const NUM_WORKERS = cpus().length - 1;

readline.emitKeypressEvents(process.stdin);

type RunnerOptions = {
  sync: boolean;
  workerThreads: boolean;
  watch: boolean;
  filter: boolean;
  update: boolean;
  pattern?: string;
};

const opts: RunnerOptions = yargs
  .command('$0 [pattern]', 'Run snapshot tests', yargs => {
    yargs.positional('pattern', {
      type: 'string',
      describe:
        'Optional glob pattern to filter fixtures (e.g., "error.*", "use-memo")',
    });
  })
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
 * Create a TestFilter from a glob pattern
 */
async function createPatternFilter(pattern: string): Promise<TestFilter> {
  // The pattern works against the base fixture path (without extensions)
  // We need to append extensions to find the actual files, similar to how
  // readInputFixtures works in fixture-utils.ts
  const INPUT_EXTENSIONS = [
    '.js',
    '.cjs',
    '.mjs',
    '.ts',
    '.cts',
    '.mts',
    '.jsx',
    '.tsx',
  ];
  const SNAPSHOT_EXTENSION = '.expect.md';

  // Try to match both input files and snapshot files
  const [inputMatches, snapshotMatches] = await Promise.all([
    glob.glob(`${pattern}{${INPUT_EXTENSIONS.join(',')}}`, {
      cwd: FIXTURES_PATH,
    }),
    glob.glob(`${pattern}${SNAPSHOT_EXTENSION}`, {cwd: FIXTURES_PATH}),
  ]);

  // Remove file extensions to get the base paths
  const allMatches = [...inputMatches, ...snapshotMatches];
  const paths = allMatches.map((match: string) => {
    // Remove common test file extensions
    return match
      .replace(/\.(js|jsx|ts|tsx|mjs|cjs|mts|cts)$/, '')
      .replace(/\.expect\.md$/, '');
  });

  // Deduplicate paths
  const uniquePaths = Array.from(new Set(paths)) as string[];

  // Enable debug if there's only one unique match
  const debug = uniquePaths.length === 1;

  return {
    debug,
    paths: uniquePaths,
  };
}

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

  // If pattern is provided, force watch mode off and use pattern filter
  const shouldWatch = opts.pattern ? false : opts.watch;

  if (shouldWatch) {
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
                testFilter = await createPatternFilter(opts.pattern);
              } else if (opts.filter) {
                testFilter = await readTestFilter();
              }

              const results = await runFixtures(worker, testFilter, 0);
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

main(opts).catch(error => console.error(error));
