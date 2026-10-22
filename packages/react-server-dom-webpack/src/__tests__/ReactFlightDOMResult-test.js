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

  async function readAll(iterable) {
    const iterator = iterable[Symbol.asyncIterator]();
    const items = [];
    while (true) {
      const {done, value} = await iterator.next();
      if (done) {
        return items;
      }
      items.push(value);
    }
  }

  async function readStream(stream) {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        return chunks;
      }
      chunks.push(value);
    }
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

  it('serializes the same Result to more than one stream', async () => {
    let renders = 0;
    async function Greeting({name}) {
      renders++;
      await 1;
      return ReactServer.createElement('p', null, 'Hello, ' + name);
    }
    const result = ReactServerDOMServer.renderToResult(
      ReactServer.createElement(Greeting, {name: 'Seb'}),
    );
    let first;
    let second;
    await serverAct(() => {
      first = readFromStream(result);
      second = readFromStream(result);
    });
    expect((await first).props.children).toBe('Hello, Seb');
    expect((await second).props.children).toBe('Hello, Seb');
    expect(renders).toBe(1);
  });

  it('serializes an iterator, a stream and an async iterable to every stream', async () => {
    function* numbers() {
      yield 1;
      yield 2;
    }
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('a');
        controller.enqueue('b');
        controller.close();
      },
    });
    async function* letters() {
      yield 'x';
      yield 'y';
    }
    function App() {
      return {numbers: numbers(), stream, letters: letters()};
    }
    const result = ReactServerDOMServer.renderToResult(
      ReactServer.createElement(App),
    );
    let first;
    let second;
    await serverAct(() => {
      first = readFromStream(result);
      second = readFromStream(result);
    });
    const responses = [await first, await second];
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      expect(Array.from(response.numbers)).toEqual([1, 2]);
      expect(await readStream(response.stream)).toEqual(['a', 'b']);
      expect(await readAll(response.letters)).toEqual(['x', 'y']);
    }
  });
});
