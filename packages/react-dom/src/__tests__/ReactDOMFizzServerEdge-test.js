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
global.AsyncLocalStorage = require('async_hooks').AsyncLocalStorage;

let React;
let ReactDOM;
let ReactDOMFizzServer;

describe('ReactDOMFizzServerEdge', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useRealTimers();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMFizzServer = require('react-dom/server.edge');
  });

  async function readResult(stream) {
    const reader = stream.getReader();
    let result = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        return result;
      }
      result += Buffer.from(value).toString('utf8');
    }
  }

  // https://github.com/facebook/react/issues/27540
  it('does not try to write to the stream after it has been closed', async () => {
    async function preloadLate() {
      await 1;
      await 1;
      // need to wait a few microtasks to get the stream to close before this is called
      ReactDOM.preconnect('foo');
    }

    function Preload() {
      preloadLate();
      return null;
    }

    function App() {
      return (
        <html>
          <body>
            <main>hello</main>
            <Preload />
          </body>
        </html>
      );
    }
    const stream = await ReactDOMFizzServer.renderToReadableStream(<App />);
    const result = await readResult(stream);
    // need to wait a macrotask to let the scheduled work from the preconnect to execute
    await new Promise(resolve => {
      setTimeout(resolve, 1);
    });

    expect(result).toMatchInlineSnapshot(
      `"<!DOCTYPE html><html><head></head><body><main>hello</main></body></html>"`,
    );
  });
});
