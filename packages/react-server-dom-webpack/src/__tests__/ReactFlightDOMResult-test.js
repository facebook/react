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

let clientExports;
let webpackMap;
let webpackModuleLoading;
let React;
let ReactDOMFizzStatic;
let ReactServer;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Stream;
let serverAct;
let FlightOracle;

const SEEDS = 40;

describe('ReactFlightDOMResult', () => {
  beforeEach(() => {
    jest.resetModules();

    patchSetImmediate();
    serverAct = require('internal-test-utils').serverAct;

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      jest.requireActual('react-server-dom-webpack/server.node'),
    );
    ReactServer = require('react');
    ReactServerDOMServer = require('react-server-dom-webpack/server');

    const WebpackMock = require('./utils/WebpackMock');
    clientExports = WebpackMock.clientExports;
    webpackMap = WebpackMock.webpackMap;
    webpackModuleLoading = WebpackMock.moduleLoading;

    jest.resetModules();
    __unmockReact();
    jest.unmock('react-server-dom-webpack/server');
    jest.mock('react-server-dom-webpack/client', () =>
      jest.requireActual('react-server-dom-webpack/client.node'),
    );

    React = require('react');
    ReactDOMFizzStatic = require('react-dom/static');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    Stream = require('stream');
    FlightOracle = require('./utils/FlightOracle');
  });

  // Client Components shared by every generated scenario. `Show` renders a
  // description of its props so the HTML reflects the data it received;
  // `Box` renders children passed through a Client Component.
  function createClientComponents() {
    const {describeProps} = FlightOracle;
    function Show({value}) {
      return React.createElement('pre', null, describeProps(value, React.use));
    }
    function Box({label, children}) {
      return React.createElement('section', {'data-label': label}, children);
    }
    const ShowReference = clientExports(Show);
    const BoxReference = clientExports(Box);
    // The SSR bundle loads the same module the server referenced.
    const moduleMap = {};
    const references = [ShowReference, BoxReference];
    for (let i = 0; i < references.length; i++) {
      const metadata = webpackMap[references[i].$$id];
      moduleMap[metadata.id] = {'*': metadata};
    }
    return {
      Show: ShowReference,
      Box: BoxReference,
      serverConsumerManifest: {moduleMap, moduleLoading: webpackModuleLoading},
      nameOf(fn) {
        if (fn === Show) return 'Show';
        if (fn === Box) return 'Box';
        return fn.name;
      },
    };
  }

  function createScenario(seed, options) {
    const rng = FlightOracle.createRng(seed);
    const scheduler = FlightOracle.createScheduler(rng);
    const components = createClientComponents();
    const {model, kind} = FlightOracle.generateModel(
      rng,
      {
        React: ReactServer,
        Show: components.Show,
        Box: components.Box,
        scheduler,
      },
      options,
    );
    return {model, kind, scheduler, components};
  }

  async function settleAll(scheduler) {
    while (scheduler.hasPending()) {
      await serverAct(() => {
        scheduler.settleOne();
      });
    }
  }

  async function readDirect(scenario) {
    const readable = new Stream.PassThrough({objectMode: true});
    await serverAct(() => {
      ReactServerDOMServer.renderToPipeableStream(scenario.model, webpackMap, {
        onError() {},
      }).pipe(readable);
    });
    const response = ReactServerDOMClient.createFromNodeStream(
      readable,
      scenario.components.serverConsumerManifest,
    );
    await settleAll(scenario.scheduler);
    await serverAct(() => {});
    // Boxed so that awaiting this function does not adopt the thenable.
    return {response};
  }

  async function renderHTML(response) {
    function Root() {
      return React.use(response);
    }
    const result = await serverAct(() =>
      ReactDOMFizzStatic.prerender(React.createElement(Root), {
        onError() {},
      }),
    );
    const reader = result.prelude.getReader();
    let html = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        return html;
      }
      html += Buffer.from(value).toString('utf8');
    }
  }

  async function observe(scenario, {response}) {
    const value = await FlightOracle.normalize(response, scenario.components);
    const html = scenario.kind === 'tree' ? await renderHTML(response) : null;
    return {value, html};
  }

  it('normalizes generated scenarios the same way across independent renders', async () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const a = createScenario(seed, {});
      const first = await observe(a, await readDirect(a));
      const b = createScenario(seed, {});
      const second = await observe(b, await readDirect(b));
      expect(second).toEqual(first);
    }
  });
});
