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

import fs from 'fs';
import os from 'os';
import path from 'path';
import {patchSetImmediate} from '../../../../scripts/jest/patchSetImmediate';

let clientExports;
let webpackMap;
let webpackModules;
let webpackModuleLoading;
let React;
let ReactDOMServer;
let ReactDOMFizzStatic;
let ReactServer;
let ReactServerDOMServer;
let ReactServerDOMStaticServer;
let ReactServerDOMClient;
let Stream;
let use;
let serverAct;

// We test pass-through without encoding strings but it should work without it too.
const streamOptions = {
  objectMode: true,
};

describe('ReactFlightDOMNode', () => {
  beforeEach(() => {
    jest.resetModules();

    patchSetImmediate();
    serverAct = require('internal-test-utils').serverAct;

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.node'),
    );
    ReactServer = require('react');
    ReactServerDOMServer = require('react-server-dom-webpack/server');
    jest.mock('react-server-dom-webpack/static', () =>
      require('react-server-dom-webpack/static.node'),
    );
    ReactServerDOMStaticServer = require('react-server-dom-webpack/static');

    const WebpackMock = require('./utils/WebpackMock');
    clientExports = WebpackMock.clientExports;
    webpackMap = WebpackMock.webpackMap;
    webpackModules = WebpackMock.webpackModules;
    webpackModuleLoading = WebpackMock.moduleLoading;

    jest.resetModules();
    __unmockReact();
    jest.unmock('react-server-dom-webpack/server');
    jest.mock('react-server-dom-webpack/client', () =>
      require('react-server-dom-webpack/client.node'),
    );

    React = require('react');
    ReactDOMServer = require('react-dom/server.node');
    ReactDOMFizzStatic = require('react-dom/static');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    Stream = require('stream');
    use = React.use;
  });

  function filterStackFrame(filename, functionName) {
    return (
      filename !== '' &&
      !filename.startsWith('node:') &&
      !filename.includes('node_modules') &&
      // Filter out our own internal source code since it'll typically be in node_modules
      (!filename.includes('/packages/') || filename.includes('/__tests__/')) &&
      !filename.includes('/build/')
    );
  }

  function normalizeCodeLocInfo(str) {
    return (
      str &&
      str.replace(/^ +(?:at|in) ([\S]+)[^\n]*/gm, function (m, name) {
        return '    in ' + name + (/\d/.test(m) ? ' (at **)' : '');
      })
    );
  }

  function readResult(stream) {
    return new Promise((resolve, reject) => {
      let buffer = '';
      const writable = new Stream.PassThrough(streamOptions);
      writable.setEncoding('utf8');
      writable.on('data', chunk => {
        buffer += chunk;
      });
      writable.on('error', error => {
        reject(error);
      });
      writable.on('end', () => {
        resolve(buffer);
      });
      stream.pipe(writable);
    });
  }

  async function readWebResult(webStream: ReadableStream<Uint8Array>) {
    const reader = webStream.getReader();
    let result = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        return result;
      }
      result += Buffer.from(value).toString('utf8');
    }
  }

  async function createBufferedUnclosingStream(
    stream: ReadableStream<Uint8Array>,
  ): ReadableStream<Uint8Array> {
    const chunks: Array<Uint8Array> = [];
    const reader = stream.getReader();
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      } else {
        chunks.push(value);
      }
    }

    let i = 0;
    return new ReadableStream({
      async pull(controller) {
        if (i < chunks.length) {
          controller.enqueue(chunks[i++]);
        }
      },
    });
  }

  function createDelayedStream() {
    let resolveDelayedStream;
    const promise = new Promise(resolve => (resolveDelayedStream = resolve));
    const delayedStream = new Stream.Transform({
      ...streamOptions,
      transform(chunk, encoding, callback) {
        // Artificially delay pushing the chunk.
        promise.then(() => {
          this.push(chunk);
          callback();
        });
      },
    });
    return {delayedStream, resolveDelayedStream};
  }

  it('should support web streams in node', async () => {
    function Text({children}) {
      return <span>{children}</span>;
    }
    // Large strings can get encoded differently so we need to test that.
    const largeString = 'world'.repeat(1000);
    function HTML() {
      return (
        <div>
          <Text>hello</Text>
          <Text>{largeString}</Text>
        </div>
      );
    }

    function App() {
      const model = {
        html: <HTML />,
      };
      return model;
    }

    const readable = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(<App />, webpackMap),
    );
    const response = ReactServerDOMClient.createFromReadableStream(readable, {
      serverConsumerManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    const model = await response;
    expect(model).toEqual({
      html: (
        <div>
          <span>hello</span>
          <span>{largeString}</span>
        </div>
      ),
    });
  });

  it('should allow an alternative module mapping to be used for SSR', async () => {
    function ClientComponent() {
      return <span>Client Component</span>;
    }
    // The Client build may not have the same IDs as the Server bundles for the same
    // component.
    const ClientComponentOnTheClient = clientExports(
      ClientComponent,
      123,
      'path/to/chunk.js',
    );
    const ClientComponentOnTheServer = clientExports(ClientComponent);

    // In the SSR bundle this module won't exist. We simulate this by deleting it.
    const clientId = webpackMap[ClientComponentOnTheClient.$$id].id;
    delete webpackModules[clientId];

    // Instead, we have to provide a translation from the client meta data to the SSR
    // meta data.
    const ssrMetadata = webpackMap[ClientComponentOnTheServer.$$id];
    const translationMap = {
      [clientId]: {
        '*': ssrMetadata,
      },
    };
    const serverConsumerManifest = {
      moduleMap: translationMap,
      moduleLoading: webpackModuleLoading,
    };

    function App() {
      return <ClientComponentOnTheClient />;
    }

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(<App />, webpackMap),
    );
    const readable = new Stream.PassThrough(streamOptions);
    let response;

    stream.pipe(readable);

    function ClientRoot() {
      if (response) return use(response);
      response = ReactServerDOMClient.createFromNodeStream(
        readable,
        serverConsumerManifest,
      );
      return use(response);
    }

    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToPipeableStream(<ClientRoot />),
    );
    const result = await readResult(ssrStream);
    expect(result).toEqual(
      '<script src="/path/to/chunk.js" async=""></script><span>Client Component</span>',
    );
  });

  it('should encode long string in a compact format', async () => {
    const testString = '"\n\t'.repeat(500) + '🙃';

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream({
        text: testString,
      }),
    );

    const readable = new Stream.PassThrough(streamOptions);

    const stringResult = readResult(readable);
    const parsedResult = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: webpackModuleLoading,
    });

    stream.pipe(readable);

    const serializedContent = await stringResult;
    // The content should be compact an unescaped
    expect(serializedContent.length).toBeLessThan(2000);
    expect(serializedContent).not.toContain('\\n');
    expect(serializedContent).not.toContain('\\t');
    expect(serializedContent).not.toContain('\\"');
    expect(serializedContent).toContain('\t');

    const result = await parsedResult;
    // Should still match the result when parsed
    expect(result.text).toBe(testString);
  });

  it('should be able to serialize any kind of typed array', async () => {
    const buffer = new Uint8Array([
      123, 4, 10, 5, 100, 255, 244, 45, 56, 67, 43, 124, 67, 89, 100, 20,
    ]).buffer;
    const buffers = [
      buffer,
      new Int8Array(buffer, 1),
      new Uint8Array(buffer, 2),
      new Uint8ClampedArray(buffer, 2),
      new Int16Array(buffer, 2),
      new Uint16Array(buffer, 2),
      new Int32Array(buffer, 4),
      new Uint32Array(buffer, 4),
      new Float32Array(buffer, 4),
      new Float64Array(buffer, 0),
      new BigInt64Array(buffer, 0),
      new BigUint64Array(buffer, 0),
      new DataView(buffer, 3),
    ];
    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(buffers),
    );
    const readable = new Stream.PassThrough(streamOptions);
    const promise = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: webpackModuleLoading,
    });
    stream.pipe(readable);
    const result = await promise;
    expect(result).toEqual(buffers);
  });

  it('should allow accept a nonce option for Flight preinitialized scripts', async () => {
    function ClientComponent() {
      return <span>Client Component</span>;
    }
    // The Client build may not have the same IDs as the Server bundles for the same
    // component.
    const ClientComponentOnTheClient = clientExports(
      ClientComponent,
      123,
      'path/to/chunk.js',
    );
    const ClientComponentOnTheServer = clientExports(ClientComponent);

    // In the SSR bundle this module won't exist. We simulate this by deleting it.
    const clientId = webpackMap[ClientComponentOnTheClient.$$id].id;
    delete webpackModules[clientId];

    // Instead, we have to provide a translation from the client meta data to the SSR
    // meta data.
    const ssrMetadata = webpackMap[ClientComponentOnTheServer.$$id];
    const translationMap = {
      [clientId]: {
        '*': ssrMetadata,
      },
    };
    const serverConsumerManifest = {
      moduleMap: translationMap,
      moduleLoading: webpackModuleLoading,
    };

    function App() {
      return <ClientComponentOnTheClient />;
    }

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(<App />, webpackMap),
    );
    const readable = new Stream.PassThrough(streamOptions);
    let response;

    stream.pipe(readable);

    function ClientRoot() {
      if (response) return use(response);
      response = ReactServerDOMClient.createFromNodeStream(
        readable,
        serverConsumerManifest,
        {
          nonce: 'r4nd0m',
        },
      );
      return use(response);
    }

    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToPipeableStream(<ClientRoot />),
    );
    const result = await readResult(ssrStream);
    expect(result).toEqual(
      '<script src="/path/to/chunk.js" async="" nonce="r4nd0m"></script><span>Client Component</span>',
    );
  });

  it('should cancels the underlying ReadableStream when we are cancelled', async () => {
    let controller;
    let cancelReason;
    const s = new ReadableStream({
      start(c) {
        controller = c;
      },
      cancel(r) {
        cancelReason = r;
      },
    });

    const rscStream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(
        s,
        {},
        {
          onError(error) {
            return error.message;
          },
        },
      ),
    );

    const writable = new Stream.PassThrough(streamOptions);
    rscStream.pipe(writable);

    controller.enqueue('hi');

    const reason = new Error('aborted');
    writable.destroy(reason);

    await new Promise(resolve => {
      writable.on('error', () => {
        resolve();
      });
    });

    expect(cancelReason.message).toBe(
      'The destination stream errored while writing data.',
    );
  });

  it('should cancels the underlying ReadableStream when we abort', async () => {
    const errors = [];
    let controller;
    let cancelReason;
    const s = new ReadableStream({
      start(c) {
        controller = c;
      },
      cancel(r) {
        cancelReason = r;
      },
    });
    const rscStream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(
        s,
        {},
        {
          onError(x) {
            errors.push(x);
            return x.message;
          },
        },
      ),
    );

    const readable = new Stream.PassThrough(streamOptions);
    rscStream.pipe(readable);

    const result = await ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: webpackModuleLoading,
    });
    const reader = result.getReader();
    controller.enqueue('hi');

    const reason = new Error('aborted');
    rscStream.abort(reason);

    expect(cancelReason).toBe(reason);

    let error = null;
    try {
      await reader.read();
    } catch (x) {
      error = x;
    }
    expect(error.digest).toBe('aborted');
    expect(errors).toEqual([reason]);
  });

  // @gate enableHalt || enablePostpone
  it('can prerender', async () => {
    let resolveGreeting;
    const greetingPromise = new Promise(resolve => {
      resolveGreeting = resolve;
    });

    function App() {
      return (
        <div>
          <Greeting />
        </div>
      );
    }

    async function Greeting() {
      await greetingPromise;
      return 'hello world';
    }

    const {pendingResult} = await serverAct(async () => {
      // destructure trick to avoid the act scope from awaiting the returned value
      return {
        pendingResult: ReactServerDOMStaticServer.prerenderToNodeStream(
          <App />,
          webpackMap,
        ),
      };
    });

    resolveGreeting();
    const {prelude} = await pendingResult;

    function ClientRoot({response}) {
      return use(response);
    }

    const response = ReactServerDOMClient.createFromNodeStream(prelude, {
      serverConsumerManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    // Use the SSR render to resolve any lazy elements
    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToPipeableStream(
        React.createElement(ClientRoot, {response}),
      ),
    );
    // Should still match the result when parsed
    const result = await readResult(ssrStream);
    expect(result).toBe('<div>hello world</div>');
  });

  // @gate enableHalt
  it('does not propagate abort reasons errors when aborting a prerender', async () => {
    let resolveGreeting;
    const greetingPromise = new Promise(resolve => {
      resolveGreeting = resolve;
    });

    function App() {
      return (
        <div>
          <ReactServer.Suspense fallback="loading...">
            <Greeting />
          </ReactServer.Suspense>
        </div>
      );
    }

    async function Greeting() {
      await greetingPromise;
      return 'hello world';
    }

    const controller = new AbortController();
    const errors = [];
    const {pendingResult} = await serverAct(async () => {
      // destructure trick to avoid the act scope from awaiting the returned value
      return {
        pendingResult: ReactServerDOMStaticServer.prerenderToNodeStream(
          <App />,
          webpackMap,
          {
            signal: controller.signal,
            onError(err) {
              errors.push(err);
            },
          },
        ),
      };
    });

    controller.abort('boom');
    resolveGreeting();
    const {prelude} = await serverAct(() => pendingResult);
    expect(errors).toEqual([]);

    function ClientRoot({response}) {
      return use(response);
    }

    const response = ReactServerDOMClient.createFromNodeStream(prelude, {
      serverConsumerManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    errors.length = 0;
    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToPipeableStream(
        React.createElement(ClientRoot, {response}),
        {
          onError(error) {
            errors.push(error);
          },
        },
      ),
    );
    ssrStream.abort('bam');
    expect(errors).toEqual([new Error('Connection closed.')]);
    // Should still match the result when parsed
    const result = await readResult(ssrStream);
    expect(result).toContain('loading...');
  });

  // @gate enableHalt
  it('includes source locations in component and owner stacks for halted components', async () => {
    async function Component() {
      await new Promise(() => {});
      return null;
    }

    function App() {
      return ReactServer.createElement(
        'html',
        null,
        ReactServer.createElement(
          'body',
          null,
          ReactServer.createElement(
            ReactServer.Suspense,
            {fallback: 'Loading...'},
            ReactServer.createElement(Component, null),
          ),
        ),
      );
    }

    const errors = [];
    const serverAbortController = new AbortController();
    const {pendingResult} = await serverAct(async () => {
      // destructure trick to avoid the act scope from awaiting the returned value
      return {
        pendingResult: ReactServerDOMStaticServer.prerender(
          ReactServer.createElement(App, null),
          webpackMap,
          {
            signal: serverAbortController.signal,
            onError(error) {
              errors.push(error);
            },
          },
        ),
      };
    });

    await await serverAct(
      async () =>
        new Promise(resolve => {
          setImmediate(() => {
            serverAbortController.abort();
            resolve();
          });
        }),
    );

    const {prelude} = await pendingResult;

    expect(errors).toEqual([]);

    function ClientRoot({response}) {
      return use(response);
    }

    const prerenderResponse = ReactServerDOMClient.createFromReadableStream(
      await createBufferedUnclosingStream(prelude),
      {
        serverConsumerManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );

    let componentStack;
    let ownerStack;

    const clientAbortController = new AbortController();

    const fizzPrerenderStreamResult = ReactDOMFizzStatic.prerender(
      React.createElement(ClientRoot, {response: prerenderResponse}),
      {
        signal: clientAbortController.signal,
        onError(error, errorInfo) {
          componentStack = errorInfo.componentStack;
          ownerStack = React.captureOwnerStack
            ? React.captureOwnerStack()
            : null;
        },
      },
    );

    await await serverAct(
      async () =>
        new Promise(resolve => {
          setImmediate(() => {
            clientAbortController.abort();
            resolve();
          });
        }),
    );

    const fizzPrerenderStream = await fizzPrerenderStreamResult;
    const prerenderHTML = await readWebResult(fizzPrerenderStream.prelude);

    expect(prerenderHTML).toContain('Loading...');

    if (__DEV__) {
      expect(normalizeCodeLocInfo(componentStack)).toBe(
        '\n' +
          '    in Component' +
          (gate(flags => flags.enableAsyncDebugInfo) ? ' (at **)\n' : '\n') +
          '    in Suspense\n' +
          '    in body\n' +
          '    in html\n' +
          '    in App (at **)\n' +
          '    in ClientRoot (at **)',
      );
    } else {
      expect(normalizeCodeLocInfo(componentStack)).toBe(
        '\n    in Suspense\n' +
          '    in body\n' +
          '    in html\n' +
          '    in ClientRoot (at **)',
      );
    }

    if (__DEV__) {
      if (gate(flags => flags.enableAsyncDebugInfo)) {
        expect(normalizeCodeLocInfo(ownerStack)).toBe(
          '\n    in Component (at **)\n    in App (at **)',
        );
      } else {
        expect(normalizeCodeLocInfo(ownerStack)).toBe('\n    in App (at **)');
      }
    } else {
      expect(ownerStack).toBeNull();
    }
  });

  // @gate enableHalt
  it('includes deeper location for aborted stacks', async () => {
    async function getData() {
      const signal = ReactServer.cacheSignal();
      await new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason));
      });
    }

    async function thisShouldNotBeInTheStack() {
      await new Promise((resolve, reject) => {
        resolve();
      });
    }

    async function Component() {
      try {
        await getData();
      } catch (x) {
        await thisShouldNotBeInTheStack(); // This is issued after the rejection so should not be included.
      }
      return null;
    }

    function App() {
      return ReactServer.createElement(
        'html',
        null,
        ReactServer.createElement(
          'body',
          null,
          ReactServer.createElement(
            ReactServer.Suspense,
            {fallback: 'Loading...'},
            ReactServer.createElement(Component, null),
          ),
        ),
      );
    }

    const errors = [];
    const serverAbortController = new AbortController();
    const {pendingResult} = await serverAct(async () => {
      // destructure trick to avoid the act scope from awaiting the returned value
      return {
        pendingResult: ReactServerDOMStaticServer.prerender(
          ReactServer.createElement(App, null),
          webpackMap,
          {
            signal: serverAbortController.signal,
            onError(error) {
              errors.push(error);
            },
            filterStackFrame,
          },
        ),
      };
    });

    await serverAct(
      () =>
        new Promise(resolve => {
          setImmediate(() => {
            serverAbortController.abort();
            resolve();
          });
        }),
    );

    const {prelude} = await pendingResult;

    expect(errors).toEqual([]);

    function ClientRoot({response}) {
      return use(response);
    }

    const prerenderResponse = ReactServerDOMClient.createFromReadableStream(
      await createBufferedUnclosingStream(prelude),
      {
        serverConsumerManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );

    let componentStack;
    let ownerStack;

    const clientAbortController = new AbortController();

    const fizzPrerenderStreamResult = ReactDOMFizzStatic.prerender(
      React.createElement(ClientRoot, {response: prerenderResponse}),
      {
        signal: clientAbortController.signal,
        onError(error, errorInfo) {
          componentStack = errorInfo.componentStack;
          ownerStack = React.captureOwnerStack
            ? React.captureOwnerStack()
            : null;
        },
      },
    );

    await await serverAct(
      async () =>
        new Promise(resolve => {
          setImmediate(() => {
            clientAbortController.abort();
            resolve();
          });
        }),
    );

    const fizzPrerenderStream = await fizzPrerenderStreamResult;
    const prerenderHTML = await readWebResult(fizzPrerenderStream.prelude);

    expect(prerenderHTML).toContain('Loading...');

    if (__DEV__) {
      expect(normalizeCodeLocInfo(componentStack)).toBe(
        '\n' +
          '    in Component' +
          (gate(flags => flags.enableAsyncDebugInfo) ? ' (at **)\n' : '\n') +
          '    in Suspense\n' +
          '    in body\n' +
          '    in html\n' +
          '    in App (at **)\n' +
          '    in ClientRoot (at **)',
      );
    } else {
      expect(normalizeCodeLocInfo(componentStack)).toBe(
        '\n    in Suspense\n' +
          '    in body\n' +
          '    in html\n' +
          '    in ClientRoot (at **)',
      );
    }

    if (__DEV__) {
      if (gate(flags => flags.enableAsyncDebugInfo)) {
        expect(normalizeCodeLocInfo(ownerStack)).toBe(
          '' +
            '\n    in getData (at **)' +
            '\n    in Component (at **)' +
            '\n    in App (at **)',
        );
      } else {
        expect(normalizeCodeLocInfo(ownerStack)).toBe(
          '' + '\n    in App (at **)',
        );
      }
    } else {
      expect(ownerStack).toBeNull();
    }
  });

  // @gate enableHalt || enablePostpone
  // @gate enableHalt
  it('can handle an empty prelude when prerendering', async () => {
    function App() {
      return null;
    }

    const serverAbortController = new AbortController();
    serverAbortController.abort();
    const errors = [];
    const {pendingResult} = await serverAct(async () => {
      // destructure trick to avoid the act scope from awaiting the returned value
      return {
        pendingResult: ReactServerDOMStaticServer.prerender(
          ReactServer.createElement(App, null),
          webpackMap,
          {
            signal: serverAbortController.signal,
            onError(error) {
              errors.push(error);
            },
          },
        ),
      };
    });

    expect(errors).toEqual([]);

    const {prelude} = await pendingResult;

    const reader = prelude.getReader();
    while (true) {
      const {done} = await reader.read();
      if (done) {
        break;
      }
    }

    // We don't really have an assertion other than to make sure
    // the stream doesn't hang.
  });

  // @gate __DEV__
  it('can transport debug info through a separate debug channel', async () => {
    function Thrower() {
      throw new Error('ssr-throw');
    }

    const ClientComponentOnTheClient = clientExports(
      Thrower,
      123,
      'path/to/chunk.js',
    );

    const ClientComponentOnTheServer = clientExports(Thrower);

    function App() {
      return ReactServer.createElement(
        ReactServer.Suspense,
        null,
        ReactServer.createElement(ClientComponentOnTheClient, null),
      );
    }

    const debugReadable = new Stream.PassThrough(streamOptions);

    const rscStream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(
        ReactServer.createElement(App, null),
        webpackMap,
        {
          debugChannel: new Stream.Writable({
            write(chunk, encoding, callback) {
              debugReadable.write(chunk, encoding);
              callback();
            },
            final() {
              debugReadable.end();
            },
          }),
        },
      ),
    );

    // Create a delayed stream to simulate that the RSC stream might be
    // transported slower than the debug channel, which must not lead to a
    // `Connection closed` error in the Flight client.
    const {delayedStream, resolveDelayedStream} = createDelayedStream();

    rscStream.pipe(delayedStream);

    function ClientRoot({response}) {
      return use(response);
    }

    const serverConsumerManifest = {
      moduleMap: {
        [webpackMap[ClientComponentOnTheClient.$$id].id]: {
          '*': webpackMap[ClientComponentOnTheServer.$$id],
        },
      },
      moduleLoading: webpackModuleLoading,
    };

    const response = ReactServerDOMClient.createFromNodeStream(
      delayedStream,
      serverConsumerManifest,
      {debugChannel: debugReadable},
    );

    setTimeout(resolveDelayedStream);

    let ownerStack;

    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToPipeableStream(
        <ClientRoot response={response} />,
        {
          onError(err, errorInfo) {
            ownerStack = React.captureOwnerStack
              ? React.captureOwnerStack()
              : null;
          },
        },
      ),
    );

    const result = await readResult(ssrStream);

    expect(normalizeCodeLocInfo(ownerStack)).toBe('\n    in App (at **)');

    expect(result).toContain(
      'Switched to client rendering because the server rendering errored:\n\nssr-throw',
    );
  });

  // @gate __DEV__
  it('can transport debug info through a slow debug channel', async () => {
    function Thrower() {
      throw new Error('ssr-throw');
    }

    const ClientComponentOnTheClient = clientExports(
      Thrower,
      123,
      'path/to/chunk.js',
    );

    const ClientComponentOnTheServer = clientExports(Thrower);

    function App() {
      return ReactServer.createElement(
        ReactServer.Suspense,
        null,
        ReactServer.createElement(ClientComponentOnTheClient, null),
      );
    }

    // Create a delayed stream to simulate that the debug stream might be
    // transported slower than the RSC stream, which must not lead to missing
    // debug info.
    const {delayedStream, resolveDelayedStream} = createDelayedStream();

    const rscStream = await serverAct(() =>
      ReactServerDOMServer.renderToPipeableStream(
        ReactServer.createElement(App, null),
        webpackMap,
        {
          debugChannel: new Stream.Writable({
            write(chunk, encoding, callback) {
              delayedStream.write(chunk, encoding);
              callback();
            },
            final() {
              delayedStream.end();
            },
          }),
        },
      ),
    );

    const readable = new Stream.PassThrough(streamOptions);

    rscStream.pipe(readable);

    function ClientRoot({response}) {
      return use(response);
    }

    const serverConsumerManifest = {
      moduleMap: {
        [webpackMap[ClientComponentOnTheClient.$$id].id]: {
          '*': webpackMap[ClientComponentOnTheServer.$$id],
        },
      },
      moduleLoading: webpackModuleLoading,
    };

    const response = ReactServerDOMClient.createFromNodeStream(
      readable,
      serverConsumerManifest,
      {debugChannel: delayedStream},
    );

    setTimeout(resolveDelayedStream);

    let ownerStack;

    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToPipeableStream(
        <ClientRoot response={response} />,
        {
          onError(err, errorInfo) {
            ownerStack = React.captureOwnerStack
              ? React.captureOwnerStack()
              : null;
          },
        },
      ),
    );

    const result = await readResult(ssrStream);

    expect(normalizeCodeLocInfo(ownerStack)).toBe('\n    in App (at **)');

    expect(result).toContain(
      'Switched to client rendering because the server rendering errored:\n\nssr-throw',
    );
  });

  // This is a regression test for a specific issue where byte Web Streams are
  // detaching ArrayBuffers, which caused downstream issues (e.g. "Cannot
  // perform Construct on a detached ArrayBuffer") for chunks that are using
  // Node's internal Buffer pool.
  it('should not corrupt the Node.js Buffer pool by detaching ArrayBuffers when using Web Streams', async () => {
    // Create a temp file smaller than 4KB to ensure it uses the Buffer pool.
    const file = path.join(os.tmpdir(), 'test.bin');
    fs.writeFileSync(file, Buffer.alloc(4095));
    const fileChunk = fs.readFileSync(file);
    fs.unlinkSync(file);

    // Verify this chunk uses the Buffer pool (8192 bytes for files < 4KB).
    expect(fileChunk.buffer.byteLength).toBe(8192);

    const readable = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(fileChunk, webpackMap),
    );

    // Create a Web Streams WritableStream that tries to use Buffer operations.
    const writable = new WritableStream({
      write(chunk) {
        // Only write one byte to ensure Node.js is not creating a new Buffer
        // pool. Typically, library code (e.g. a compression middleware) would
        // call Buffer.from(chunk) or similar, instead of allocating a new
        // Buffer directly. With that, the test file could only be ~2600 bytes.
        Buffer.allocUnsafe(1);
      },
    });

    // Must not throw an error.
    await readable.pipeTo(writable);
  });
});
