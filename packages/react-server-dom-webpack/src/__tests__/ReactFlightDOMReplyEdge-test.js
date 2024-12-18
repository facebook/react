/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// let serverExports;
let webpackServerMap;
let ReactServerDOMServer;
let ReactServerDOMClient;

describe('ReactFlightDOMReplyEdge', () => {
  beforeEach(() => {
    jest.resetModules();
    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.edge'),
    );
    const WebpackMock = require('./utils/WebpackMock');
    // serverExports = WebpackMock.serverExports;
    webpackServerMap = WebpackMock.webpackServerMap;
    ReactServerDOMServer = require('react-server-dom-webpack/server.edge');
    jest.resetModules();
    ReactServerDOMClient = require('react-server-dom-webpack/client.edge');
  });

  it('can encode a reply', async () => {
    const body = await ReactServerDOMClient.encodeReply({some: 'object'});
    const decoded = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

    expect(decoded).toEqual({some: 'object'});
  });

  it('should abort when parsing an incomplete payload', async () => {
    const infinitePromise = new Promise(() => {});
    const controller = new AbortController();
    const promiseForResult = ReactServerDOMClient.encodeReply(
      {promise: infinitePromise},
      {
        signal: controller.signal,
      },
    );
    controller.abort();
    const body = await promiseForResult;

    const decoded = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

    let error = null;
    try {
      await decoded.promise;
    } catch (x) {
      error = x;
    }
    expect(error).not.toBe(null);
    expect(error.message).toBe('Connection closed.');
  });
});
