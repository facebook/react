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
let webpackServerMap;
let React;
let ReactDOMServer;
let ReactServerDOMServer;
let ReactServerDOMClient;

describe('ReactFlightDOMForm', () => {
  beforeEach(() => {
    jest.resetModules();
    const WebpackMock = require('./utils/WebpackMock');
    serverExports = WebpackMock.serverExports;
    webpackServerMap = WebpackMock.webpackServerMap;
    React = require('react');
    ReactServerDOMServer = require('react-server-dom-webpack/server.edge');
    ReactServerDOMClient = require('react-server-dom-webpack/client.edge');
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
      webpackServerMap,
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

    const result = await submit(form);

    expect(result).toBe('hello');
    expect(foo).toBe('bar');
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

    const result = await submit(form);

    expect(result).toBe('hi');

    expect(foo).toBe('bar');
  });

  // @gate enableFormActions
  it('can submit a complex closure server action without hydrating it', async () => {
    let foo = null;

    const serverAction = serverExports(function action(bound, formData) {
      foo = formData.get('foo') + bound.complex;
      return 'hello';
    });
    function App() {
      return (
        <form action={serverAction.bind(null, {complex: 'object'})}>
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

    const result = await submit(form);

    expect(result).toBe('hello');
    expect(foo).toBe('barobject');
  });

  // @gate enableFormActions
  it('can submit a multiple complex closure server action without hydrating it', async () => {
    let foo = null;

    const serverAction = serverExports(function action(bound, formData) {
      foo = formData.get('foo') + bound.complex;
      return 'hello' + bound.complex;
    });
    function App() {
      return (
        <form action={serverAction.bind(null, {complex: 'a'})}>
          <input type="text" name="foo" defaultValue="bar" />
          <button formAction={serverAction.bind(null, {complex: 'b'})} />
          <button formAction={serverAction.bind(null, {complex: 'c'})} />
          <input
            type="submit"
            formAction={serverAction.bind(null, {complex: 'd'})}
          />
        </form>
      );
    }
    const rscStream = ReactServerDOMServer.renderToReadableStream(<App />);
    const response = ReactServerDOMClient.createFromReadableStream(rscStream);
    const ssrStream = await ReactDOMServer.renderToReadableStream(response);
    await readIntoContainer(ssrStream);

    const form = container.firstChild;

    expect(foo).toBe(null);

    const result = await submit(form.getElementsByTagName('button')[1]);

    expect(result).toBe('helloc');
    expect(foo).toBe('barc');
  });
});
