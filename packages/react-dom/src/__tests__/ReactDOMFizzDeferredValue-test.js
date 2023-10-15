/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {insertNodesAndExecuteScripts} from '../test-utils/FizzTestUtils';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;

let act;
let container;
let React;
let ReactDOMServer;
let ReactDOMClient;
let useDeferredValue;

describe('ReactDOMFizzForm', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMServer = require('react-dom/server.browser');
    ReactDOMClient = require('react-dom/client');
    useDeferredValue = require('react').useDeferredValue;
    act = require('internal-test-utils').act;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  async function readIntoContainer(stream) {
    const reader = stream.getReader();
    let result = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      result += Buffer.from(value).toString('utf8');
    }
    const temp = document.createElement('div');
    temp.innerHTML = result;
    insertNodesAndExecuteScripts(temp, container, null);
  }

  // @gate enableUseDeferredValueInitialArg
  it('returns initialValue argument, if provided', async () => {
    function App() {
      return useDeferredValue('Final', 'Initial');
    }

    const stream = await ReactDOMServer.renderToReadableStream(<App />);
    await readIntoContainer(stream);
    expect(container.textContent).toEqual('Initial');

    // After hydration, it's updated to the final value
    await act(() => ReactDOMClient.hydrateRoot(container, <App />));
    expect(container.textContent).toEqual('Final');
  });
});
