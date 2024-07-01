/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {insertNodesAndExecuteScripts} from 'react-dom/src/test-utils/FizzTestUtils';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Don't wait before processing work on the server.
// TODO: we can replace this with FlightServer.act().
global.setTimeout = cb => cb();

let container;
let serverExports;
let turbopackServerMap;
let React;
let ReactDOMServer;
let ReactServerDOMServer;
let ReactServerDOMClient;

describe('ReactFlightDOMForm', () => {
  beforeEach(() => {
    jest.resetModules();
    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-turbopack/server', () =>
      require('react-server-dom-turbopack/server.edge'),
    );
    ReactServerDOMServer = require('react-server-dom-turbopack/server.edge');
    const TurbopackMock = require('./utils/TurbopackMock');
    serverExports = TurbopackMock.serverExports;
    turbopackServerMap = TurbopackMock.turbopackServerMap;
    __unmockReact();
    jest.resetModules();
    React = require('react');
    ReactServerDOMClient = require('react-server-dom-turbopack/client.edge');
    ReactDOMServer = require('react-dom/server.edge');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  async function POST(formData) {
    const boundAction = await ReactServerDOMServer.decodeAction(
      formData,
      turbopackServerMap,
    );
    return boundAction();
  }

  function submit(submitter) {
    const form = submitter.form || submitter;
    if (!submitter.form) {
      submitter = undefined;
    }
    const submitEvent = new Event('submit', {bubbles: true, cancelable: true});
    submitEvent.submitter = submitter;
    const returnValue = form.dispatchEvent(submitEvent);
    if (!returnValue) {
      return;
    }
    const action =
      (submitter && submitter.getAttribute('formaction')) || form.action;
    if (!/\s*javascript:/i.test(action)) {
      const method = (submitter && submitter.formMethod) || form.method;
      const encType = (submitter && submitter.formEnctype) || form.enctype;
      if (method === 'post' && encType === 'multipart/form-data') {
        const formData = new FormData(form, submitter);
        return POST(formData);
      }
      throw new Error('Navigate to: ' + action);
    }
  }

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

  it('can submit a passed server action without hydrating it', async () => {
    let foo = null;

    const serverAction = serverExports(function action(formData) {
      foo = formData.get('foo');
      return 'hello';
    });
    function App() {
      return (
        <form action={serverAction}>
          <input type="text" name="foo" defaultValue="bar" />
        </form>
      );
    }
    const rscStream = ReactServerDOMServer.renderToReadableStream(<App />);
    const response = ReactServerDOMClient.createFromReadableStream(rscStream, {
      ssrManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    const ssrStream = await ReactDOMServer.renderToReadableStream(response);
    await readIntoContainer(ssrStream);

    const form = container.firstChild;

    expect(foo).toBe(null);

    const result = await submit(form);

    expect(result).toBe('hello');
    expect(foo).toBe('bar');
  });
});
