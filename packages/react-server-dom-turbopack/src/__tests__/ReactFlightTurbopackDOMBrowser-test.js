/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {patchMessageChannel} from '../../../../scripts/jest/patchMessageChannel';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

let React;
let ReactServerDOMServer;
let ReactServerDOMClient;
let ReactServerScheduler;
let reactServerAct;

describe('ReactFlightTurbopackDOMBrowser', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactServerScheduler = require('scheduler');
    patchMessageChannel(ReactServerScheduler);
    reactServerAct = require('internal-test-utils').act;

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-turbopack/server', () =>
      require('react-server-dom-turbopack/server.browser'),
    );

    ReactServerDOMServer = require('react-server-dom-turbopack/server.browser');

    __unmockReact();
    jest.resetModules();

    React = require('react');
    ReactServerDOMClient = require('react-server-dom-turbopack/client');
  });

  async function serverAct(callback) {
    let maybePromise;
    await reactServerAct(() => {
      maybePromise = callback();
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {});
      }
    });
    return maybePromise;
  }

  it('should resolve HTML using W3C streams', async () => {
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
      const model = {
        html: <HTML />,
      };
      return model;
    }

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(<App />),
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream);
    const model = await response;
    expect(model).toEqual({
      html: (
        <div>
          <span>hello</span>
          <span>world</span>
        </div>
      ),
    });
  });
});
