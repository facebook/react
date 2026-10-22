/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

import {patchSetImmediate} from '../../../../scripts/jest/patchSetImmediate';

// Scenarios are seeded from FUZZ_TEST_SEED, which the hourly fuzz workflow
// sets at random; the default seed runs a fixed sample. RESULT_SEEDS=first-last
// replays a range of seeds, and a failure prints the one to replay.
const SEED = process.env.FUZZ_TEST_SEED || 'default';
const SEED_RANGE = process.env.RESULT_SEEDS
  ? process.env.RESULT_SEEDS.split('-').map(Number)
  : null;
const SEEDS_PER_RUN = 40;
// Each scenario test renders every seed a few times over.
jest.setTimeout(SEED_RANGE ? 30 * 60 * 1000 : 60 * 1000);

let FlightFuzz;
let env;
let harness;

describe(`ReactFlightDOMResultFuzz (random seed: ${SEED})`, () => {
  let stackTraceLimit;
  beforeEach(() => {
    // Fizz escapes an error's stack into the HTML in DEV; a deep generated
    // tree produces one long enough to trip the test loop guard.
    stackTraceLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 20;
    jest.resetModules();

    patchSetImmediate();
    const serverAct = require('internal-test-utils').serverAct;

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      jest.requireActual('react-server-dom-webpack/server.node'),
    );
    jest.mock('react-server-dom-webpack/static', () =>
      jest.requireActual('react-server-dom-webpack/static.node'),
    );
    const ReactServer = require('react');
    const ReactServerDOMServer = require('react-server-dom-webpack/server');
    const ReactServerDOMStaticServer = require('react-server-dom-webpack/static');

    const WebpackMock = require('./utils/WebpackMock');

    jest.resetModules();
    __unmockReact();
    jest.unmock('react-server-dom-webpack/server');
    jest.unmock('react-server-dom-webpack/static');
    jest.mock('react-server-dom-webpack/client', () =>
      jest.requireActual('react-server-dom-webpack/client.node'),
    );

    const React = require('react');
    const ReactDOMFizzStatic = require('react-dom/static');
    const ReactServerDOMClient = require('react-server-dom-webpack/client');
    const Stream = require('stream');
    FlightFuzz = require('./utils/FlightFuzz');
    env = {
      React,
      ReactServer,
      ReactDOMFizzStatic,
      ReactServerDOMServer,
      ReactServerDOMClient,
      ReactServerDOMStaticServer,
      Stream,
      serverAct,
      clientExports: WebpackMock.clientExports,
      webpackMap: WebpackMock.webpackMap,
      webpackModuleLoading: WebpackMock.moduleLoading,
    };
    harness = FlightFuzz.createHarness(env);
  });

  afterEach(() => {
    Error.stackTraceLimit = stackTraceLimit;
  });

  async function forEachSeed(run) {
    let first;
    let last;
    if (SEED_RANGE) {
      first = SEED_RANGE[0];
      last = SEED_RANGE[1];
    } else {
      // A random seed picks one of a million fixed ranges, so a failure
      // replays by seed number.
      first =
        SEED === 'default'
          ? 1
          : 1 + FlightFuzz.createRng(+SEED).int(1000000) * SEEDS_PER_RUN;
      last = first + SEEDS_PER_RUN - 1;
    }
    for (let seed = first; seed <= last; seed++) {
      try {
        await run(seed);
      } catch (error) {
        console.log(
          `Failed seed ${seed} (FUZZ_TEST_SEED=${SEED}). Replay with ` +
            `RESULT_SEEDS=${seed}-${seed} yarn test ReactFlightDOMResultFuzz`,
        );
        throw error;
      }
    }
  }

  // RESULT_DUMP=seed prints a generated model and its wire, to debug a seed.
  if (process.env.RESULT_DUMP) {
    it('dumps a scenario', async () => {
      const a = harness.createScenario(+process.env.RESULT_DUMP, {
        allowErrors: process.env.RESULT_DUMP_ERRORS === '1',
      });
      const readable = new env.Stream.PassThrough();
      let wire = '';
      readable.on('data', c => (wire += c.toString('utf8')));
      await env.serverAct(() => {
        env.ReactServerDOMServer.renderToPipeableStream(
          a.model,
          env.webpackMap,
          {
            onError: harness.onError,
          },
        ).pipe(readable);
      });
      await harness.settleAll(a.scheduler);
      await env.serverAct(() => {});
      process.stdout.write(
        'MODEL\n' + FlightFuzz.describeModel(a.model) + '\nWIRE\n' + wire,
      );
    });
  }

  it('normalizes generated scenarios the same way across independent renders', async () => {
    await forEachSeed(async seed => {
      const a = harness.createScenario(seed, {});
      const first = await harness.observe(a, await harness.readDirect(a));
      const b = harness.createScenario(seed, {});
      const second = await harness.observe(b, await harness.readDirect(b));
      expect(second).toEqual(first);
    });
  });

  it('serializes a Result the same as rendering the model directly', async () => {
    await forEachSeed(async seed => {
      const a = harness.createScenario(seed, {});
      const direct = await harness.observe(a, await harness.readDirect(a));
      const b = harness.createScenario(seed, {});
      const viaResult = await harness.observe(
        b,
        await harness.readResultStream(b),
      );
      expect(viaResult).toEqual(direct);
    });
  });

  it('serializes a Result with errors the same as rendering the model directly', async () => {
    await forEachSeed(async seed => {
      const a = harness.createScenario(seed, {allowErrors: true});
      const direct = await harness.observe(a, await harness.readDirect(a));
      const b = harness.createScenario(seed, {allowErrors: true});
      const viaResult = await harness.observe(
        b,
        await harness.readResultStream(b),
      );
      expect(viaResult).toEqual(direct);
    });
  });
});
