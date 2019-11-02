/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

// Polyfills for test environment
global.ReadableStream = require('@mattiasbuelens/web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextDecoder = require('util').TextDecoder;

let Stream;
let React;
let ReactFlightDOMServer;
let ReactFlightDOMClient;

describe('ReactFlightDOM', () => {
  beforeEach(() => {
    jest.resetModules();
    Stream = require('stream');
    React = require('react');
    ReactFlightDOMServer = require('react-dom/unstable-flight-server');
    ReactFlightDOMClient = require('react-dom/unstable-flight-client');
  });

  function getTestStream() {
    let writable = new Stream.PassThrough();
    let readable = new ReadableStream({
      start(controller) {
        writable.on('data', chunk => {
          controller.enqueue(chunk);
        });
        writable.on('end', () => {
          controller.close();
        });
      },
    });
    return {
      writable,
      readable,
    };
  }

  async function waitForSuspense(fn) {
    while (true) {
      try {
        return fn();
      } catch (promise) {
        if (typeof promise.then === 'function') {
          await promise;
        } else {
          throw promise;
        }
      }
    }
  }

  it('should resolve HTML using Node streams', async () => {
    function Text({children}) {
      return <span>{children}</span>;
    }
    function HTML() {
      return (
        <div>
          <Text>hello</Text>
          <Text>world</Text>
        </div>
      );
    }

    function App() {
      let model = {
        html: <HTML />,
      };
      return model;
    }

    let {writable, readable} = getTestStream();
    ReactFlightDOMServer.pipeToNodeWritable(<App />, writable);
    let result = ReactFlightDOMClient.readFromReadableStream(readable);
    await waitForSuspense(() => {
      expect(result.model).toEqual({
        html: '<div><span>hello</span><span>world</span></div>',
      });
    });
  });
});
