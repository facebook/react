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
let React;
let ReactDOMServer;
let ReactServer;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Stream;
let use;
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

    React = require('react');
    ReactDOMServer = require('react-dom/server.node');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    Stream = require('stream');
    use = React.use;
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

  async function readHTML(element) {
    const output = new Stream.PassThrough();
    let html = '';
    output.setEncoding('utf8');
    output.on('data', chunk => {
      html += chunk;
    });
    const done = new Promise(resolve => output.on('end', resolve));
    await serverAct(() => {
      const {pipe} = ReactDOMServer.renderToPipeableStream(element, {
        onAllReady() {
          pipe(output);
        },
      });
    });
    await done;
    return html;
  }

  it('reads a Result in process', async () => {
    let renders = 0;
    async function Greeting({name}) {
      renders++;
      await 1;
      return ReactServer.createElement('p', null, 'Hello, ' + name);
    }
    const data = {items: [1, 2, 3]};
    const model = {
      header: ReactServer.createElement('h1', null, 'Title'),
      data,
      greeting: ReactServer.createElement(Greeting, {name: 'Seb'}),
    };
    const result = ReactServerDOMServer.renderToResult(model);
    const root = await ReactServerDOMClient.createFromResult(result);
    // Nothing about these needs to change for this consumer.
    expect(root.header).toBe(model.header);
    expect(root.data).toBe(data);
    // The Server Component is read once it has rendered.
    expect(root.greeting.$$typeof).toBe(Symbol.for('react.lazy'));
    const greeting = await serverAct(() => root.greeting._payload);
    expect(greeting.type).toBe('p');
    expect(greeting.props.children).toBe('Hello, Seb');
    expect(renders).toBe(1);
  });

  it('renders the HTML of a Result', async () => {
    async function Greeting({name}) {
      await 1;
      return ReactServer.createElement('p', null, 'Hello, ' + name);
    }
    function App() {
      return ReactServer.createElement(
        'div',
        null,
        ReactServer.createElement(Greeting, {name: 'Seb'}),
      );
    }
    const result = ReactServerDOMServer.renderToResult(
      ReactServer.createElement(App),
    );
    const response = ReactServerDOMClient.createFromResult(result);
    function Root() {
      return use(response);
    }
    expect(await readHTML(React.createElement(Root))).toBe(
      '<div><p>Hello, Seb</p></div>',
    );
  });

  it('rejects a value the wire rejects with the same error', async () => {
    const errors = [];
    function handler() {}
    function App() {
      return ReactServer.createElement('div', {data: {handler}});
    }
    const result = ReactServerDOMServer.renderToResult(
      ReactServer.createElement(App),
      {
        onError(error) {
          errors.push(error.message);
          return 'digest(' + error.message + ')';
        },
      },
    );
    const root = await ReactServerDOMClient.createFromResult(result);
    // The element holding the invalid value fails when it's rendered.
    let caught;
    try {
      root._init(root._payload);
    } catch (error) {
      caught = error;
    }
    expect(errors).toEqual([
      'Functions cannot be passed directly to Client Components unless you ' +
        'explicitly expose it by marking it with "use server". Or maybe you ' +
        'meant to call this function rather than return it.\n' +
        '  {handler: function handler}\n' +
        '            ^^^^^^^^^^^^^^^^',
    ]);
    expect(caught.digest).toBe('digest(' + errors[0] + ')');
    expect(caught.message).toBe(
      __DEV__
        ? errors[0]
        : 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.',
    );
  });

  // Reads a Result whose root element errors, and returns what was reported.
  async function readErrors(element) {
    const errors = [];
    const result = ReactServerDOMServer.renderToResult(element, {
      onError(error) {
        errors.push(error.message);
      },
    });
    const root = await ReactServerDOMClient.createFromResult(result);
    expect(() => root._init(root._payload)).toThrow();
    return errors;
  }

  // @gate enableTaint
  it('rejects a tainted object like the wire', async () => {
    const user = {name: 'Seb', age: 'rather not say'};
    ReactServer.experimental_taintObjectReference(
      "Don't pass the raw user object to the client",
      user,
    );
    const errors = await readErrors(ReactServer.createElement('div', {user}));
    expect(errors).toEqual(["Don't pass the raw user object to the client"]);
  });

  // @gate enableTaint
  it('rejects a tainted function like the wire', async () => {
    function change() {}
    ReactServer.experimental_taintObjectReference(
      'A change handler cannot be passed to a client component',
      change,
    );
    const errors = await readErrors(
      ReactServer.createElement('div', {onChange: change}),
    );
    expect(errors).toEqual([
      'A change handler cannot be passed to a client component',
    ]);
  });

  // @gate enableTaint
  it('rejects a tainted string like the wire', async () => {
    const process = {env: {SECRET: '3e971ecc1485fe78625598bf9b6f85db'}};
    ReactServer.experimental_taintUniqueValue(
      'Cannot pass a secret token to the client',
      process,
      process.env.SECRET,
    );
    const errors = await readErrors(
      ReactServer.createElement('div', {token: process.env.SECRET}),
    );
    expect(errors).toEqual(['Cannot pass a secret token to the client']);
    // Keeps the lifetime object alive through the read.
    expect(process.env.SECRET).toBe('3e971ecc1485fe78625598bf9b6f85db');
  });

  // @gate enableTaint
  it('rejects a tainted bigint like the wire', async () => {
    const currentUser = {token: BigInt('0x3e971ecc1485fe78625598bf9b6f85dc')};
    ReactServer.experimental_taintUniqueValue(
      'Cannot pass a secret token to the client',
      currentUser,
      currentUser.token,
    );
    const errors = await readErrors(
      ReactServer.createElement('div', {token: currentUser.token}),
    );
    expect(errors).toEqual(['Cannot pass a secret token to the client']);
  });

  // @gate enableTaint
  it('rejects a copy of a tainted binary value like the wire', async () => {
    const currentUser = {
      token: new Uint32Array([0x3e971ecc, 0x1485fe78, 0x625598bf, 0x9b6f85dd]),
    };
    ReactServer.experimental_taintUniqueValue(
      'Cannot pass a secret token to the client',
      currentUser,
      currentUser.token,
    );
    const errors = await readErrors(
      ReactServer.createElement('div', {token: currentUser.token.slice()}),
    );
    expect(errors).toEqual(['Cannot pass a secret token to the client']);
  });

  // @gate enableTaint
  it('rejects a tainted string inside a FormData like the wire', async () => {
    const process = {env: {SECRET: '3e971ecc1485fe78625598bf9b6f85db'}};
    ReactServer.experimental_taintUniqueValue(
      'Cannot pass a secret token to the client',
      process,
      process.env.SECRET,
    );
    const formData = new FormData();
    formData.append('token', process.env.SECRET);
    const errors = await readErrors(
      ReactServer.createElement('div', {formData}),
    );
    expect(errors).toEqual(['Cannot pass a secret token to the client']);
    expect(process.env.SECRET).toBe('3e971ecc1485fe78625598bf9b6f85db');
  });

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
