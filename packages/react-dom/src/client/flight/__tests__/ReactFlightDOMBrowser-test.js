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
let ReactFlightDOMServer;

describe('ReactFlightDOM', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFlightDOMServer = require('react-dom/unstable-flight-server.browser');
  });

  async function readResult(stream) {
    let reader = stream.getReader();
    let result = '';
    while (true) {
      let {done, value} = await reader.read();
      if (done) {
        return result;
      }
      result += Buffer.from(value).toString('utf8');
    }
  }

  it('should resolve HTML', async () => {
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

    let model = {
      html: <HTML />,
    };
    let stream = ReactFlightDOMServer.renderToReadableStream(model);
    jest.runAllTimers();
    let result = JSON.parse(await readResult(stream));
    expect(result).toEqual({
      html: '<div><span>hello</span><span>world</span></div>',
    });
  });
});
