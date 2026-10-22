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

let webpackMap;
let webpackModuleLoading;
let ReactServer;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Stream;
let serverAct;

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
    webpackMap = WebpackMock.webpackMap;
    webpackModuleLoading = WebpackMock.moduleLoading;

    jest.resetModules();
    __unmockReact();
    jest.unmock('react-server-dom-webpack/server');
    jest.mock('react-server-dom-webpack/client', () =>
      jest.requireActual('react-server-dom-webpack/client.node'),
    );

    ReactServerDOMClient = require('react-server-dom-webpack/client');
    Stream = require('stream');
  });

  function readFromStream(result) {
    const readable = new Stream.PassThrough();
    ReactServerDOMServer.renderToPipeableStream(result, webpackMap).pipe(
      readable,
    );
    return ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: webpackMap,
      moduleLoading: webpackModuleLoading,
    });
  }

  it('serializes a Result to a stream started after the last consumer finished', async () => {
    let cacheSignal;
    function App() {
      cacheSignal = ReactServer.cacheSignal();
      return 'hi';
    }
    const result = ReactServerDOMServer.renderToResult(
      ReactServer.createElement(App, null),
    );
    let first;
    await serverAct(() => {
      first = readFromStream(result);
    });
    expect(await first).toBe('hi');
    // The only consumer is done, so the cache signal has ended. A framework
    // starts the hydration stream after the HTML is done.
    expect(cacheSignal.aborted).toBe(true);
    let second;
    await serverAct(() => {
      second = readFromStream(result);
    });
    expect(await second).toBe('hi');
  });
});
