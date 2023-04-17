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

describe('ReactFlightDOMReply', () => {
  beforeEach(() => {
    jest.resetModules();
    const WebpackMock = require('./utils/WebpackMock');
    // serverExports = WebpackMock.serverExports;
    webpackServerMap = WebpackMock.webpackServerMap;
    ReactServerDOMServer = require('react-server-dom-webpack/server.browser');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
  });

  it('can pass undefined as a reply', async () => {
    const body = await ReactServerDOMClient.encodeReply(undefined);
    const missing = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );
    expect(missing).toBe(undefined);

    const body2 = await ReactServerDOMClient.encodeReply({
      array: [undefined, null, undefined],
      prop: undefined,
    });
    const object = await ReactServerDOMServer.decodeReply(
      body2,
      webpackServerMap,
    );
    expect(object.array.length).toBe(3);
    expect(object.array[0]).toBe(undefined);
    expect(object.array[1]).toBe(null);
    expect(object.array[3]).toBe(undefined);
    expect(object.prop).toBe(undefined);
    // These should really be true but our deserialization doesn't currently deal with it.
    expect('3' in object.array).toBe(false);
    expect('prop' in object).toBe(false);
  });

  it('can pass an iterable as a reply', async () => {
    const body = await ReactServerDOMClient.encodeReply({
      [Symbol.iterator]: function* () {
        yield 'A';
        yield 'B';
        yield 'C';
      },
    });
    const iterable = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );
    const items = [];
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const item of iterable) {
      items.push(item);
    }
    expect(items).toEqual(['A', 'B', 'C']);
  });

  it('can pass a BigInt as a reply', async () => {
    const body = await ReactServerDOMClient.encodeReply(90071992547409910000n);
    const n = await ReactServerDOMServer.decodeReply(body, webpackServerMap);

    expect(n).toEqual(90071992547409910000n);
  });
});
