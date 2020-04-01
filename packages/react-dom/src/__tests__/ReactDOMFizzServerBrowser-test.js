/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Polyfills for test environment
global.ReadableStream = require('@mattiasbuelens/web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;

let React;
let ReactDOMFizzServer;

describe('ReactDOMFizzServer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMFizzServer = require('react-dom/unstable-fizz.browser');
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

  it('should call renderToReadableStream', async () => {
    const stream = ReactDOMFizzServer.renderToReadableStream(
      <div>hello world</div>,
    );
    const result = await readResult(stream);
    expect(result).toBe('<div>hello world</div>');
  });
});
