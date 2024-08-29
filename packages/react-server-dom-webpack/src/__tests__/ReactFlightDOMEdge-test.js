/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment ./scripts/jest/ReactDOMServerIntegrationEnvironment
 */

'use strict';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
global.Blob = require('buffer').Blob;
if (typeof File === 'undefined' || typeof FormData === 'undefined') {
  global.File = require('buffer').File || require('undici').File;
  global.FormData = require('undici').FormData;
}
// Patch for Edge environments for global scope
global.AsyncLocalStorage = require('async_hooks').AsyncLocalStorage;

let serverExports;
let clientExports;
let webpackMap;
let webpackModules;
let webpackModuleLoading;
let React;
let ReactServer;
let ReactDOMServer;
let ReactServerDOMServer;
let ReactServerDOMStaticServer;
let ReactServerDOMClient;
let use;
let reactServerAct;

function normalizeCodeLocInfo(str) {
  return (
    str &&
    str.replace(/^ +(?:at|in) ([\S]+)[^\n]*/gm, function (m, name) {
      return '    in ' + name + (/\d/.test(m) ? ' (at **)' : '');
    })
  );
}

describe('ReactFlightDOMEdge', () => {
  beforeEach(() => {
    jest.resetModules();

    reactServerAct = require('internal-test-utils').serverAct;

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.edge'),
    );

    const WebpackMock = require('./utils/WebpackMock');

    serverExports = WebpackMock.serverExports;
    clientExports = WebpackMock.clientExports;
    webpackMap = WebpackMock.webpackMap;
    webpackModules = WebpackMock.webpackModules;
    webpackModuleLoading = WebpackMock.moduleLoading;

    ReactServer = require('react');
    ReactServerDOMServer = require('react-server-dom-webpack/server');
    if (__EXPERIMENTAL__) {
      jest.mock('react-server-dom-webpack/static', () =>
        require('react-server-dom-webpack/static.edge'),
      );
      ReactServerDOMStaticServer = require('react-server-dom-webpack/static');
    }

    jest.resetModules();
    __unmockReact();
    jest.unmock('react-server-dom-webpack/server');
    jest.mock('react-server-dom-webpack/client', () =>
      require('react-server-dom-webpack/client.edge'),
    );
    React = require('react');
    ReactDOMServer = require('react-dom/server.edge');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    use = React.use;
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

  function passThrough(stream) {
    // Simulate more realistic network by splitting up and rejoining some chunks.
    // This lets us test that we don't accidentally rely on particular bounds of the chunks.
    return new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        let prevChunk = new Uint8Array(0);
        function push() {
          reader.read().then(({done, value}) => {
            if (done) {
              controller.enqueue(prevChunk);
              prevChunk = new Uint8Array(0);
              controller.close();
              return;
            }
            const chunk = new Uint8Array(prevChunk.length + value.length);
            chunk.set(prevChunk, 0);
            chunk.set(value, prevChunk.length);
            if (chunk.length > 50) {
              controller.enqueue(chunk.subarray(0, chunk.length - 50));
              prevChunk = chunk.subarray(chunk.length - 50);
            } else {
              // Wait to see if we get some more bytes to join in.
              prevChunk = chunk;
              // Flush if we don't get any more.
              (async function flushAfterAFewTasks() {
                for (let i = 0; i < 10; i++) {
                  await i;
                }
                if (prevChunk.byteLength > 0) {
                  controller.enqueue(prevChunk);
                }
                prevChunk = new Uint8Array(0);
              })();
            }
            push();
          });
        }
        push();
      },
    });
  }

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

  async function readByteLength(stream) {
    const reader = stream.getReader();
    let length = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        return length;
      }
      length += value.byteLength;
    }
  }

  it('should allow an alternative module mapping to be used for SSR', async () => {
    function ClientComponent() {
      return <span>Client Component</span>;
    }
    // The Client build may not have the same IDs as the Server bundles for the same
    // component.
    const ClientComponentOnTheClient = clientExports(ClientComponent);
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

    function App() {
      return <ClientComponentOnTheClient />;
    }

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(<App />, webpackMap),
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      ssrManifest: {
        moduleMap: translationMap,
        moduleLoading: webpackModuleLoading,
      },
    });

    function ClientRoot() {
      return use(response);
    }

    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToReadableStream(<ClientRoot />),
    );
    const result = await readResult(ssrStream);
    expect(result).toEqual('<span>Client Component</span>');
  });

  it('should encode long string in a compact format', async () => {
    const testString = '"\n\t'.repeat(500) + '🙃';
    const testString2 = 'hello'.repeat(400);

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream({
        text: testString,
        text2: testString2,
      }),
    );
    const [stream1, stream2] = passThrough(stream).tee();

    const serializedContent = await readResult(stream1);
    // The content should be compact an unescaped
    expect(serializedContent.length).toBeLessThan(4000);
    expect(serializedContent).not.toContain('\\n');
    expect(serializedContent).not.toContain('\\t');
    expect(serializedContent).not.toContain('\\"');
    expect(serializedContent).toContain('\t');

    const result = await ReactServerDOMClient.createFromReadableStream(
      stream2,
      {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );
    // Should still match the result when parsed
    expect(result.text).toBe(testString);
    expect(result.text2).toBe(testString2);
  });

  it('should encode repeated objects in a compact format by deduping', async () => {
    const obj = {
      this: {is: 'a large objected'},
      with: {many: 'properties in it'},
    };
    const props = {root: <div>{new Array(30).fill(obj)}</div>};
    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(props),
    );
    const [stream1, stream2] = passThrough(stream).tee();

    const serializedContent = await readResult(stream1);
    expect(serializedContent.length).toBeLessThan(1100);

    const result = await ReactServerDOMClient.createFromReadableStream(
      stream2,
      {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );
    // TODO: Cyclic references currently cause a Lazy wrapper which is not ideal.
    const resultElement = result.root._init(result.root._payload);
    // Should still match the result when parsed
    expect(resultElement).toEqual(props.root);
    expect(resultElement.props.children[5]).toBe(
      resultElement.props.children[10],
    ); // two random items are the same instance
  });

  it('should execute repeated server components only once', async () => {
    const str = 'this is a long return value';
    let timesRendered = 0;
    function ServerComponent() {
      timesRendered++;
      return str;
    }
    const element = <ServerComponent />;
    // Hardcoded list to avoid the key warning
    const children = (
      <>
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
      </>
    );
    const resolvedChildren = new Array(30).fill(str);
    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(children),
    );
    const [stream1, stream2] = passThrough(stream).tee();

    const serializedContent = await readResult(stream1);

    expect(serializedContent.length).toBeLessThan(425);
    expect(timesRendered).toBeLessThan(5);

    const model = await ReactServerDOMClient.createFromReadableStream(stream2, {
      ssrManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });

    // Use the SSR render to resolve any lazy elements
    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToReadableStream(model),
    );
    // Should still match the result when parsed
    const result = await readResult(ssrStream);
    expect(result).toEqual(resolvedChildren.join('<!-- -->'));
  });

  it('should execute repeated host components only once', async () => {
    const div = <div>this is a long return value</div>;
    let timesRendered = 0;
    function ServerComponent() {
      timesRendered++;
      return div;
    }
    const element = <ServerComponent />;
    // Hardcoded list to avoid the key warning
    const children = (
      <>
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
        {element}
      </>
    );
    const resolvedChildren = new Array(30).fill(
      '<div>this is a long return value</div>',
    );
    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(children),
    );
    const [stream1, stream2] = passThrough(stream).tee();

    const serializedContent = await readResult(stream1);
    expect(serializedContent.length).toBeLessThan(__DEV__ ? 605 : 400);
    expect(timesRendered).toBeLessThan(5);

    const model = await serverAct(() =>
      ReactServerDOMClient.createFromReadableStream(stream2, {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      }),
    );

    // Use the SSR render to resolve any lazy elements
    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToReadableStream(model),
    );
    // Should still match the result when parsed
    const result = await readResult(ssrStream);
    expect(result).toEqual(resolvedChildren.join(''));
  });

  it('should execute repeated server components in a compact form', async () => {
    async function ServerComponent({recurse}) {
      if (recurse > 0) {
        return <ServerComponent recurse={recurse - 1} />;
      }
      return <div>Fin</div>;
    }
    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(
        <ServerComponent recurse={20} />,
      ),
    );
    const serializedContent = await readResult(stream);
    const expectedDebugInfoSize = __DEV__ ? 300 * 20 : 0;
    expect(serializedContent.length).toBeLessThan(150 + expectedDebugInfoSize);
  });

  // @gate enableBinaryFlight
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
      passThrough(ReactServerDOMServer.renderToReadableStream(buffers)),
    );
    const result = await ReactServerDOMClient.createFromReadableStream(stream, {
      ssrManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    expect(result).toEqual(buffers);
  });

  // @gate enableBinaryFlight
  it('should be able to serialize a blob', async () => {
    const bytes = new Uint8Array([
      123, 4, 10, 5, 100, 255, 244, 45, 56, 67, 43, 124, 67, 89, 100, 20,
    ]);
    const blob = new Blob([bytes, bytes], {
      type: 'application/x-test',
    });
    const stream = await serverAct(() =>
      passThrough(ReactServerDOMServer.renderToReadableStream(blob)),
    );
    const result = await ReactServerDOMClient.createFromReadableStream(stream, {
      ssrManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    expect(result instanceof Blob).toBe(true);
    expect(result.size).toBe(bytes.length * 2);
    expect(await result.arrayBuffer()).toEqual(await blob.arrayBuffer());
  });

  // @gate enableBinaryFlight
  it('can transport FormData (blobs)', async () => {
    const bytes = new Uint8Array([
      123, 4, 10, 5, 100, 255, 244, 45, 56, 67, 43, 124, 67, 89, 100, 20,
    ]);
    const blob = new Blob([bytes, bytes], {
      type: 'application/x-test',
    });

    const formData = new FormData();
    formData.append('hi', 'world');
    formData.append('file', blob, 'filename.test');

    expect(formData.get('file') instanceof File).toBe(true);
    expect(formData.get('file').name).toBe('filename.test');

    const stream = await serverAct(() =>
      passThrough(ReactServerDOMServer.renderToReadableStream(formData)),
    );
    const result = await ReactServerDOMClient.createFromReadableStream(stream, {
      ssrManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });

    expect(result instanceof FormData).toBe(true);
    expect(result.get('hi')).toBe('world');
    const resultBlob = result.get('file');
    expect(resultBlob instanceof Blob).toBe(true);
    expect(resultBlob.name).toBe('blob'); // We should not pass through the file name for security.
    expect(resultBlob.size).toBe(bytes.length * 2);
    expect(await resultBlob.arrayBuffer()).toEqual(await blob.arrayBuffer());
  });

  it('can pass an async import that resolves later to an outline object like a Map', async () => {
    let resolve;
    const promise = new Promise(r => (resolve = r));

    const asyncClient = clientExports(promise);

    // We await the value on the servers so it's an async value that the client should wait for
    const awaitedValue = await asyncClient;

    const map = new Map();
    map.set('value', awaitedValue);

    const stream = await serverAct(() =>
      passThrough(ReactServerDOMServer.renderToReadableStream(map, webpackMap)),
    );

    // Parsing the root blocks because the module hasn't loaded yet
    const resultPromise = ReactServerDOMClient.createFromReadableStream(
      stream,
      {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );

    // Afterwards we finally resolve the module value so it's available on the client
    resolve('hello');

    const result = await resultPromise;
    expect(result instanceof Map).toBe(true);
    expect(result.get('value')).toBe('hello');
  });

  // @gate enableFlightReadableStream
  it('can pass an async import to a ReadableStream while enqueuing in order', async () => {
    let resolve;
    const promise = new Promise(r => (resolve = r));

    const asyncClient = clientExports(promise);

    // We await the value on the servers so it's an async value that the client should wait for
    const awaitedValue = await asyncClient;

    const s = new ReadableStream({
      start(c) {
        c.enqueue('hello');
        c.enqueue(awaitedValue);
        c.enqueue('!');
        c.close();
      },
    });

    const stream = await serverAct(() =>
      passThrough(ReactServerDOMServer.renderToReadableStream(s, webpackMap)),
    );

    const result = await serverAct(() =>
      ReactServerDOMClient.createFromReadableStream(stream, {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      }),
    );

    const reader = result.getReader();

    expect(await reader.read()).toEqual({value: 'hello', done: false});

    const readPromise = reader.read();
    // We resolve this after we've already received the '!' row.
    await resolve('world');

    expect(await readPromise).toEqual({value: 'world', done: false});
    expect(await reader.read()).toEqual({value: '!', done: false});
    expect(await reader.read()).toEqual({value: undefined, done: true});
  });

  // @gate enableFlightReadableStream
  it('can pass an async import a AsyncIterable while allowing peaking at future values', async () => {
    let resolve;
    const promise = new Promise(r => (resolve = r));

    const asyncClient = clientExports(promise);

    const multiShotIterable = {
      async *[Symbol.asyncIterator]() {
        yield 'hello';
        // We await the value on the servers so it's an async value that the client should wait for
        yield await asyncClient;
        yield '!';
      },
    };

    const stream = await serverAct(() =>
      passThrough(
        ReactServerDOMServer.renderToReadableStream(
          multiShotIterable,
          webpackMap,
        ),
      ),
    );

    // Parsing the root blocks because the module hasn't loaded yet
    const result = await serverAct(() =>
      ReactServerDOMClient.createFromReadableStream(stream, {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      }),
    );

    const iterator = result[Symbol.asyncIterator]();

    expect(await iterator.next()).toEqual({value: 'hello', done: false});

    const readPromise = iterator.next();

    // While the previous promise didn't resolve yet, we should be able to peak at the next value
    // by iterating past it.
    expect(await iterator.next()).toEqual({value: '!', done: false});

    // We resolve the previous row after we've already received the '!' row.
    await resolve('world');
    expect(await readPromise).toEqual({value: 'world', done: false});

    expect(await iterator.next()).toEqual({value: undefined, done: true});
  });

  // @gate enableFlightReadableStream
  it('should ideally dedupe objects inside async iterables but does not yet', async () => {
    const obj = {
      this: {is: 'a large objected'},
      with: {many: 'properties in it'},
    };
    const iterable = {
      async *[Symbol.asyncIterator]() {
        for (let i = 0; i < 30; i++) {
          yield obj;
        }
      },
    };

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream({
        iterable,
      }),
    );
    const [stream1, stream2] = passThrough(stream).tee();

    const serializedContent = await readResult(stream1);
    // TODO: Ideally streams should dedupe objects but because we never outline the objects
    // they end up not having a row to reference them nor any of its nested objects.
    // expect(serializedContent.length).toBeLessThan(400);
    expect(serializedContent.length).toBeGreaterThan(400);

    const result = await ReactServerDOMClient.createFromReadableStream(
      stream2,
      {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );

    const items = [];
    const iterator = result.iterable[Symbol.asyncIterator]();
    let entry;
    while (!(entry = await iterator.next()).done) {
      items.push(entry.value);
    }

    // Should still match the result when parsed
    expect(items.length).toBe(30);
    // TODO: These should be the same
    // expect(items[5]).toBe(items[10]); // two random items are the same instance
    expect(items[5]).toEqual(items[10]);
  });

  it('warns if passing a this argument to bind() of a server reference', async () => {
    const ServerModule = serverExports({
      greet: function () {},
    });

    const ServerModuleImportedOnClient = {
      greet: ReactServerDOMClient.createServerReference(
        ServerModule.greet.$$id,
        async function (ref, args) {},
      ),
    };

    expect(() => {
      ServerModule.greet.bind({}, 'hi');
    }).toErrorDev(
      'Cannot bind "this" of a Server Action. Pass null or undefined as the first argument to .bind().',
      {withoutStack: true},
    );

    expect(() => {
      ServerModuleImportedOnClient.greet.bind({}, 'hi');
    }).toErrorDev(
      'Cannot bind "this" of a Server Action. Pass null or undefined as the first argument to .bind().',
      {withoutStack: true},
    );
  });

  // @gate enableFlightReadableStream && enableBinaryFlight
  it('should supports ReadableStreams with typed arrays', async () => {
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

    // This is not a binary stream, it's a stream that contain binary chunks.
    const s = new ReadableStream({
      start(c) {
        for (let i = 0; i < buffers.length; i++) {
          c.enqueue(buffers[i]);
        }
        c.close();
      },
    });

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(s, {}),
    );

    const [stream1, stream2] = passThrough(stream).tee();

    const result = await ReactServerDOMClient.createFromReadableStream(
      stream1,
      {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );

    expect(await readByteLength(stream2)).toBeLessThan(300);

    const streamedBuffers = [];
    const reader = result.getReader();
    let entry;
    while (!(entry = await reader.read()).done) {
      streamedBuffers.push(entry.value);
    }

    expect(streamedBuffers).toEqual(buffers);
  });

  // @gate enableFlightReadableStream && enableBinaryFlight
  it('should support BYOB binary ReadableStreams', async () => {
    const buffer = new Uint8Array([
      123, 4, 10, 5, 100, 255, 244, 45, 56, 67, 43, 124, 67, 89, 100, 20,
    ]).buffer;
    const buffers = [
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

    // This a binary stream where each chunk ends up as Uint8Array.
    const s = new ReadableStream({
      type: 'bytes',
      start(c) {
        for (let i = 0; i < buffers.length; i++) {
          c.enqueue(buffers[i]);
        }
        c.close();
      },
    });

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(s, {}),
    );

    const [stream1, stream2] = passThrough(stream).tee();

    const result = await ReactServerDOMClient.createFromReadableStream(
      stream1,
      {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );

    expect(await readByteLength(stream2)).toBeLessThan(300);

    const streamedBuffers = [];
    const reader = result.getReader({mode: 'byob'});
    let entry;
    while (!(entry = await reader.read(new Uint8Array(10))).done) {
      expect(entry.value instanceof Uint8Array).toBe(true);
      streamedBuffers.push(entry.value);
    }

    // The streamed buffers might be in different chunks and in Uint8Array form but
    // the concatenated bytes should be the same.
    expect(streamedBuffers.flatMap(t => Array.from(t))).toEqual(
      buffers.flatMap(c =>
        Array.from(new Uint8Array(c.buffer, c.byteOffset, c.byteLength)),
      ),
    );
  });

  it('supports async server component debug info as the element owner in DEV', async () => {
    function Container({children}) {
      return children;
    }

    const promise = Promise.resolve(true);
    async function Greeting({firstName}) {
      // We can't use JSX here because it'll use the Client React.
      const child = ReactServer.createElement(
        'span',
        null,
        'Hello, ' + firstName,
      );
      // Yield the synchronous pass
      await promise;
      // We should still be able to track owner using AsyncLocalStorage.
      return ReactServer.createElement(Container, null, child);
    }

    const model = {
      greeting: ReactServer.createElement(Greeting, {firstName: 'Seb'}),
    };

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(model, webpackMap),
    );

    const rootModel = await serverAct(() =>
      ReactServerDOMClient.createFromReadableStream(stream, {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      }),
    );

    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToReadableStream(rootModel.greeting),
    );
    const result = await readResult(ssrStream);
    expect(result).toEqual('<span>Hello, Seb</span>');

    // Resolve the React Lazy wrapper which must have resolved by now.
    const lazyWrapper = rootModel.greeting;
    const greeting = lazyWrapper._init(lazyWrapper._payload);

    // We've rendered down to the span.
    expect(greeting.type).toBe('span');
    if (__DEV__) {
      const greetInfo = expect.objectContaining({
        name: 'Greeting',
        env: 'Server',
        owner: null,
      });
      expect(lazyWrapper._debugInfo).toEqual([
        greetInfo,
        expect.objectContaining({
          name: 'Container',
          env: 'Server',
          owner: greetInfo,
        }),
      ]);
      // The owner that created the span was the outer server component.
      // We expect the debug info to be referentially equal to the owner.
      expect(greeting._owner).toBe(lazyWrapper._debugInfo[0]);
    } else {
      expect(lazyWrapper._debugInfo).toBe(undefined);
      expect(greeting._owner).toBe(
        gate(flags => flags.disableStringRefs) ? undefined : null,
      );
    }
  });

  // @gate __DEV__ && enableOwnerStacks
  it('can get the component owner stacks asynchronously', async () => {
    let stack;

    function Foo() {
      return ReactServer.createElement(Bar, null);
    }
    function Bar() {
      return ReactServer.createElement(
        'div',
        null,
        ReactServer.createElement(Baz, null),
      );
    }

    const promise = Promise.resolve(0);

    async function Baz() {
      await promise;
      stack = ReactServer.captureOwnerStack();
      return ReactServer.createElement('span', null, 'hi');
    }

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(
        ReactServer.createElement(
          'div',
          null,
          ReactServer.createElement(Foo, null),
        ),
        webpackMap,
      ),
    );
    await readResult(stream);

    expect(normalizeCodeLocInfo(stack)).toBe(
      '\n    in Bar (at **)' + '\n    in Foo (at **)',
    );
  });

  it('supports server components in ssr component stacks', async () => {
    let reject;
    const promise = new Promise((_, r) => (reject = r));
    async function Erroring() {
      await promise;
      return 'should not render';
    }

    const model = {
      root: ReactServer.createElement(Erroring),
    };

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(model, webpackMap, {
        onError() {},
      }),
    );

    const rootModel = await serverAct(() =>
      ReactServerDOMClient.createFromReadableStream(stream, {
        ssrManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      }),
    );

    const errors = [];
    const result = serverAct(() =>
      ReactDOMServer.renderToReadableStream(<div>{rootModel.root}</div>, {
        onError(error, {componentStack}) {
          errors.push({
            error,
            componentStack: normalizeCodeLocInfo(componentStack),
          });
        },
      }),
    );

    const theError = new Error('my error');
    reject(theError);

    const expectedMessage = __DEV__
      ? 'my error'
      : 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.';

    try {
      await result;
    } catch (x) {
      expect(x).toEqual(
        expect.objectContaining({
          message: expectedMessage,
        }),
      );
    }

    expect(errors).toEqual([
      {
        error: expect.objectContaining({
          message: expectedMessage,
        }),
        componentStack: (__DEV__ ? '\n    in Erroring' : '') + '\n    in div',
      },
    ]);
  });

  // @gate experimental
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
        pendingResult: ReactServerDOMStaticServer.prerender(
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

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      ssrManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    // Use the SSR render to resolve any lazy elements
    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToReadableStream(
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
        pendingResult: ReactServerDOMStaticServer.prerender(
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
    const {prelude} = await pendingResult;

    expect(errors).toEqual(['boom']);

    function ClientRoot({response}) {
      return use(response);
    }

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      ssrManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    const fizzController = new AbortController();
    errors.length = 0;
    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToReadableStream(
        React.createElement(ClientRoot, {response}),
        {
          signal: fizzController.signal,
          onError(error) {
            errors.push(error);
          },
        },
      ),
    );
    fizzController.abort('bam');
    if (__DEV__) {
      expect(errors).toEqual([new Error('Connection closed.')]);
    } else {
      // This is likely a bug. In Dev we get a connection closed error
      // because the debug info creates a chunk that has a pending status
      // and when the stream finishes we error if any chunks are still pending.
      // In production there is no debug info so the missing chunk is never instantiated
      // because nothing triggers model evaluation before the stream completes
      expect(errors).toEqual(['bam']);
    }
    // Should still match the result when parsed
    const result = await readResult(ssrStream);
    const div = document.createElement('div');
    div.innerHTML = result;
    expect(div.textContent).toBe('loading...');
  });
});
