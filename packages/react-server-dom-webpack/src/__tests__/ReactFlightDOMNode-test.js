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

const path = require('path');

import {patchSetImmediate} from '../../../../scripts/jest/patchSetImmediate';

global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;

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

  function getLineNumber() {
    const error = new Error();
    Error.captureStackTrace(error, getLineNumber);
    const firstStackFrame = error.stack.split('\n')[1];

    const lineNumber = firstStackFrame.slice(
      firstStackFrame.indexOf(':') + 1,
      firstStackFrame.lastIndexOf(':'),
    );

    return parseInt(lineNumber, 10);
  }

  function createFilterStackFrame(
    userSpaceStart: number,
    userSpaceEnd: number,
  ) {
    return (filename: string, functionName: string, lineNumber: number) => {
      if (filename === __filename) {
        return lineNumber >= userSpaceStart && lineNumber <= userSpaceEnd;
      }

      return (
        filename !== '' &&
        !filename.startsWith('node:') &&
        !filename.includes('node_modules') &&
        // Filter out our own internal source code since it'll typically be in
        // node_modules. This also includes the current test file. Only user space
        // code that has been marked explicitly is included (see above).
        !filename.includes('/packages/') &&
        !filename.includes('/build/')
      );
    };
  }

  const repoRoot = path.resolve(__dirname, '../../../../');

  function normalizeCodeLocInfo(str, {preserveLocation = false} = {}) {
    return (
      str &&
      str.replace(
        /^ +(?:at|in) ([\S]+) ([^\n]*)/gm,
        function (m, name, location) {
          return (
            '    in ' +
            name +
            (/\d/.test(m)
              ? preserveLocation
                ? ' ' + location.replace(repoRoot, '')
                : ' (at **)'
              : '')
          );
        },
      )
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
    const userSpaceStart = getLineNumber();

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

    const userSpaceEnd = getLineNumber();

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
            filterStackFrame: createFilterStackFrame(
              userSpaceStart,
              userSpaceEnd,
            ),
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

  // @gate enableHalt
  describe.each(['setImmediate', 'setTimeout'])(
    'when scheduling prerendering and aborting in successive tasks using %s',
    timerFunctionName => {
      let scheduleTask;

      beforeEach(() => {
        // These tests rely on tasks resolving exactly as they would in a real
        // environment, which is not the case when using fake timers and
        // serverAct.
        jest.useRealTimers();
        scheduleTask = globalThis[timerFunctionName];
      });

      afterEach(() => {
        jest.useFakeTimers();
      });

      function createHangingPromise(signal) {
        const promise = new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason));
        });
        promise.displayName = 'hanging';
        return promise;
      }

      function ClientRoot({response}) {
        return use(response);
      }

      it('includes deeper location for hanging promises', async () => {
        const userSpaceStart = getLineNumber();

        async function Component({promise}) {
          await promise;
          return null;
        }

        function App({promise}) {
          return ReactServer.createElement(
            'html',
            null,
            ReactServer.createElement(
              'body',
              null,
              ReactServer.createElement(Component, {promise}),
            ),
          );
        }

        const userSpaceEnd = getLineNumber();

        const serverRenderAbortController = new AbortController();
        const serverCleanupAbortController = new AbortController();
        const errors = [];

        const promise = createHangingPromise(
          serverCleanupAbortController.signal,
        );

        // destructure trick to avoid the act scope from awaiting the returned value
        const {prelude} = await new Promise((resolve, reject) => {
          let result;

          scheduleTask(() => {
            result = ReactServerDOMStaticServer.prerender(
              ReactServer.createElement(App, {promise}),
              webpackMap,
              {
                signal: serverRenderAbortController.signal,
                onError(error) {
                  errors.push(error);
                },
                filterStackFrame: createFilterStackFrame(
                  userSpaceStart,
                  userSpaceEnd,
                ),
              },
            );

            serverRenderAbortController.signal.addEventListener('abort', () => {
              serverCleanupAbortController.abort();
            });
          });

          scheduleTask(() => {
            serverRenderAbortController.abort();
            resolve(result);
          });
        });

        expect(errors).toEqual([]);

        const prerenderResponse = ReactServerDOMClient.createFromReadableStream(
          await createBufferedUnclosingStream(prelude),
          {serverConsumerManifest: {moduleMap: null, moduleLoading: null}},
        );

        let componentStack;
        let ownerStack;

        const clientAbortController = new AbortController();

        const fizzPrerenderStream = await new Promise(resolve => {
          let result;

          scheduleTask(() => {
            result = ReactDOMFizzStatic.prerender(
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
          });

          scheduleTask(() => {
            clientAbortController.abort();
            resolve(result);
          });
        });

        const prerenderHTML = await readWebResult(fizzPrerenderStream.prelude);

        expect(prerenderHTML).toBe('');

        const normalizedComponentStack = normalizeCodeLocInfo(componentStack, {
          preserveLocation: true,
        });

        if (__DEV__) {
          if (gate(flags => flags.enableAsyncDebugInfo)) {
            expect(normalizedComponentStack).toMatchInlineSnapshot(`
              "
                  in Component (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:990:11)
                  in body
                  in html
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1001:27)
                  in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)"
            `);
          } else {
            expect(normalizedComponentStack).toMatchInlineSnapshot(`
              "
                  in Component
                  in body
                  in html
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1001:27)
                  in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)"
            `);
          }
        } else {
          expect(normalizedComponentStack).toMatchInlineSnapshot(`
            "
                in body
                in html
                in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)"
          `);
        }

        const normalizedOwnerStack = normalizeCodeLocInfo(ownerStack, {
          preserveLocation: true,
        });

        if (__DEV__) {
          if (gate(flags => flags.enableAsyncDebugInfo)) {
            expect(normalizedOwnerStack).toMatchInlineSnapshot(`
              "
                  in Component (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:990:11)
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1001:27)"
            `);
          } else {
            expect(normalizedOwnerStack).toMatchInlineSnapshot(`
              "
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1001:27)"
            `);
          }
        } else {
          expect(normalizedOwnerStack).toBeNull();
        }
      });

      it('includes deeper location for hanging promises in ignore-listed components', async () => {
        async function IgnoreListedComponent({signal}) {
          return createHangingPromise(signal);
        }

        const userSpaceStart = getLineNumber();

        function App({signal}) {
          return ReactServer.createElement(
            'html',
            null,
            ReactServer.createElement(
              'body',
              null,
              ReactServer.createElement(IgnoreListedComponent, {signal}),
            ),
          );
        }

        const userSpaceEnd = getLineNumber();

        const serverRenderAbortController = new AbortController();
        const serverCleanupAbortController = new AbortController();
        const errors = [];

        // destructure trick to avoid the act scope from awaiting the returned value
        const {prelude} = await new Promise((resolve, reject) => {
          let result;

          scheduleTask(() => {
            result = ReactServerDOMStaticServer.prerender(
              ReactServer.createElement(App, {
                signal: serverCleanupAbortController.signal,
              }),
              webpackMap,
              {
                signal: serverRenderAbortController.signal,
                onError(error) {
                  errors.push(error);
                },
                filterStackFrame: createFilterStackFrame(
                  userSpaceStart,
                  userSpaceEnd,
                ),
              },
            );

            serverRenderAbortController.signal.addEventListener('abort', () => {
              serverCleanupAbortController.abort();
            });
          });

          scheduleTask(() => {
            serverRenderAbortController.abort();
            resolve(result);
          });
        });

        expect(errors).toEqual([]);

        const prerenderResponse = ReactServerDOMClient.createFromReadableStream(
          await createBufferedUnclosingStream(prelude),
          {serverConsumerManifest: {moduleMap: null, moduleLoading: null}},
        );

        let componentStack;
        let ownerStack;

        const clientAbortController = new AbortController();

        const fizzPrerenderStream = await new Promise(resolve => {
          let result;

          scheduleTask(() => {
            result = ReactDOMFizzStatic.prerender(
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
          });

          scheduleTask(() => {
            clientAbortController.abort();
            resolve(result);
          });
        });

        const prerenderHTML = await readWebResult(fizzPrerenderStream.prelude);

        expect(prerenderHTML).toBe('');

        const normalizedComponentStack = normalizeCodeLocInfo(componentStack, {
          preserveLocation: true,
        });

        if (__DEV__) {
          expect(normalizedComponentStack).toMatchInlineSnapshot(`
            "
                in IgnoreListedComponent
                in body
                in html
                in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1156:27)
                in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)"
          `);
        } else {
          expect(normalizedComponentStack).toMatchInlineSnapshot(`
            "
                in body
                in html
                in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)"
          `);
        }

        const normalizedOwnerStack = normalizeCodeLocInfo(ownerStack, {
          preserveLocation: true,
        });

        if (__DEV__) {
          expect(normalizedOwnerStack).toMatchInlineSnapshot(`
            "
                in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1156:27)"
          `);
        } else {
          expect(normalizedOwnerStack).toBeNull();
        }
      });

      it('includes deeper location for unresolved I/O', async () => {
        const userSpaceStart = getLineNumber();

        async function ComponentA() {
          await Promise.resolve();
          await new Promise(r => setTimeout(r));
          return null;
        }

        async function ComponentB() {
          await new Promise(r => setTimeout(r));
          return null;
        }

        async function ComponentC({promise}) {
          await promise;
          return null;
        }

        function ComponentD() {
          const promise = new Promise(r => setTimeout(r, 10));
          return ReactServer.createElement(ComponentC, {promise});
        }

        function App() {
          return ReactServer.createElement(
            'html',
            null,
            ReactServer.createElement(
              'body',
              null,
              ReactServer.createElement(ComponentA),
              ReactServer.createElement(ComponentB),
              ReactServer.createElement(ComponentD),
            ),
          );
        }

        const userSpaceEnd = getLineNumber();

        const serverRenderAbortController = new AbortController();
        const errors = [];

        // destructure trick to avoid the act scope from awaiting the returned value
        const {prelude} = await new Promise((resolve, reject) => {
          let result;

          scheduleTask(() => {
            result = ReactServerDOMStaticServer.prerender(
              ReactServer.createElement(App),
              webpackMap,
              {
                signal: serverRenderAbortController.signal,
                onError(error) {
                  errors.push(error);
                },
                filterStackFrame: createFilterStackFrame(
                  userSpaceStart,
                  userSpaceEnd,
                ),
              },
            );
          });

          scheduleTask(() => {
            serverRenderAbortController.abort();
            resolve(result);
          });
        });

        expect(errors).toEqual([]);

        const prerenderResponse = ReactServerDOMClient.createFromReadableStream(
          await createBufferedUnclosingStream(prelude),
          {serverConsumerManifest: {moduleMap: null, moduleLoading: null}},
        );

        const componentStacks = [];
        const ownerStacks = [];

        const clientAbortController = new AbortController();

        const fizzPrerenderStream = await new Promise(resolve => {
          let result;

          scheduleTask(() => {
            result = ReactDOMFizzStatic.prerender(
              React.createElement(ClientRoot, {response: prerenderResponse}),
              {
                signal: clientAbortController.signal,
                onError(error, errorInfo) {
                  componentStacks.push(errorInfo.componentStack);
                  if (React.captureOwnerStack) {
                    ownerStacks.push(React.captureOwnerStack());
                  }
                },
              },
            );
          });

          scheduleTask(() => {
            clientAbortController.abort();
            resolve(result);
          });
        });

        const prerenderHTML = await readWebResult(fizzPrerenderStream.prelude);

        expect(prerenderHTML).toBe('');

        const normalizedComponentStacks = componentStacks.map(stack =>
          normalizeCodeLocInfo(stack, {
            preserveLocation: true,
          }),
        );

        if (__DEV__) {
          // TODO: The location for App is not quite right. It's the "implied
          // location of the owner" that always points at where the first child
          // is created (see initializeFakeStack in ReactFlightClient). This
          // frame is not that important thought, so we accept that for now.

          if (gate(flags => flags.enableAsyncDebugInfo)) {
            expect(normalizedComponentStacks).toMatchInlineSnapshot(`
              [
                "
                  in ComponentA (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1281:17)
                  in body
                  in html
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1307:27)
                  in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)",
                "
                  in ComponentB (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1286:17)
                  in body
                  in html
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1307:27)
                  in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)",
                "
                  in ComponentC (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1291:11)
                  in ComponentD (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1297:30)
                  in body
                  in html
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1307:27)
                  in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)",
              ]
            `);
          } else {
            expect(normalizedComponentStacks).toMatchInlineSnapshot(`
              [
                "
                  in ComponentA
                  in body
                  in html
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1307:27)
                  in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)",
                "
                  in ComponentB
                  in body
                  in html
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1307:27)
                  in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)",
                "
                  in ComponentC
                  in ComponentD (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1297:30)
                  in body
                  in html
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1307:27)
                  in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)",
              ]
            `);
          }
        } else {
          expect(normalizedComponentStacks).toMatchInlineSnapshot(`
            [
              "
                in body
                in html
                in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)",
              "
                in body
                in html
                in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)",
              "
                in body
                in html
                in ClientRoot (/packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:982:56)",
            ]
          `);
        }

        const normalizedOwnerStacks = ownerStacks.map(stack =>
          normalizeCodeLocInfo(stack, {
            preserveLocation: true,
          }),
        );

        if (__DEV__) {
          if (gate(flags => flags.enableAsyncDebugInfo)) {
            expect(normalizedOwnerStacks).toMatchInlineSnapshot(`
              [
                "
                  in ComponentA (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1281:17)
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1307:27)",
                "
                  in ComponentB (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1286:17)
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1308:27)",
                "
                  in ComponentC (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1291:11)
                  in ComponentD (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1297:30)
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1309:27)",
              ]
            `);
          } else {
            expect(normalizedOwnerStacks).toMatchInlineSnapshot(`
              [
                "
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1307:27)",
                "
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1308:27)",
                "
                  in ComponentD (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1297:30)
                  in App (file:///packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMNode-test.js:1309:27)",
              ]
            `);
          }
        } else {
          expect(normalizedOwnerStacks).toEqual([]);
        }
      });
    },
  );

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
});
