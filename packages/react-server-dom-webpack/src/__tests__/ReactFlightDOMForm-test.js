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

let actionResult;
let container;
let serverExports;
let webpackServerMap;
let React;
let ReactDOMServer;
let ReactServerDOMServer;
let ReactServerDOMClient;

describe('ReactFlightDOMReply', () => {
  beforeEach(() => {
    jest.resetModules();
    const WebpackMock = require('./utils/WebpackMock');
    serverExports = WebpackMock.serverExports;
    webpackServerMap = WebpackMock.webpackServerMap;
    React = require('react');
    ReactServerDOMServer = require('react-server-dom-webpack/server.browser');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    ReactDOMServer = require('react-dom/server.browser');
    container = document.createElement('div');
    document.body.appendChild(container);
    actionResult = undefined;
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function requireServerRef(ref) {
    let name = '';
    let resolvedModuleData = webpackServerMap[ref];
    if (resolvedModuleData) {
      // The potentially aliased name.
      name = resolvedModuleData.name;
    } else {
      // We didn't find this specific export name but we might have the * export
      // which contains this name as well.
      // TODO: It's unfortunate that we now have to parse this string. We should
      // probably go back to encoding path and name separately on the client reference.
      const idx = ref.lastIndexOf('#');
      if (idx !== -1) {
        name = ref.slice(idx + 1);
        resolvedModuleData = webpackServerMap[ref.slice(0, idx)];
      }
      if (!resolvedModuleData) {
        throw new Error(
          'Could not find the module "' +
            ref +
            '" in the React Client Manifest. ' +
            'This is probably a bug in the React Server Components bundler.',
        );
      }
    }
    const mod = __webpack_require__(resolvedModuleData.id);
    if (name === '*') {
      return mod;
    }
    return mod[name];
  }

  function POST(formData) {
    let actionId = null;
    formData.forEach((v, key) => {
      if (key.startsWith('$ACTION_') && actionId === null) {
        actionId = key.slice(8);
      }
    });
    if (actionId === null) {
      throw new Error('Missing action');
    }
    const action = requireServerRef(actionId);
    actionResult = action(formData);
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
        let formData;
        if (submitter) {
          const temp = document.createElement('input');
          temp.name = submitter.name;
          temp.value = submitter.value;
          submitter.parentNode.insertBefore(temp, submitter);
          formData = new FormData(form);
          temp.parentNode.removeChild(temp);
        } else {
          formData = new FormData(form);
        }
        POST(formData);
        return;
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

  // @gate enableFormActions
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
    const response = ReactServerDOMClient.createFromReadableStream(rscStream);
    const ssrStream = await ReactDOMServer.renderToReadableStream(response);
    await readIntoContainer(ssrStream);

    const form = container.firstChild;

    expect(foo).toBe(null);

    submit(form);

    expect(foo).toBe('bar');
    expect(await actionResult).toBe('hello');
  });

  // @gate enableFormActions
  it('can submit an imported server action without hydrating it', async () => {
    let foo = null;

    const ServerModule = serverExports(function action(formData) {
      foo = formData.get('foo');
      return 'hi';
    });
    const serverAction = ReactServerDOMClient.createServerReference(
      ServerModule.$$id,
    );
    function App() {
      return (
        <form action={serverAction}>
          <input type="text" name="foo" defaultValue="bar" />
        </form>
      );
    }

    const ssrStream = await ReactDOMServer.renderToReadableStream(<App />);
    await readIntoContainer(ssrStream);

    const form = container.firstChild;

    expect(foo).toBe(null);

    submit(form);

    expect(foo).toBe('bar');

    expect(await actionResult).toBe('hi');
  });
});
