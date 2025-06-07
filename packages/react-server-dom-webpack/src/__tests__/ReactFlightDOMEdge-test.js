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
let webpackServerMap;
let webpackModules;
let webpackModuleLoading;
let React;
let ReactServer;
let ReactDOMServer;
let ReactServerDOMServer;
let ReactServerDOMStaticServer;
let ReactServerDOMClient;
let use;
let serverAct;
let assertConsoleErrorDev;

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
    // Mock performance.now for timing tests
    let time = 10;
    const now = jest.fn().mockImplementation(() => {
      return time++;
    });
    Object.defineProperty(performance, 'timeOrigin', {
      value: time,
      configurable: true,
    });
    Object.defineProperty(performance, 'now', {
      value: now,
      configurable: true,
    });

    jest.resetModules();

    serverAct = require('internal-test-utils').serverAct;
    assertConsoleErrorDev =
      require('internal-test-utils').assertConsoleErrorDev;

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.edge'),
    );

    const WebpackMock = require('./utils/WebpackMock');

    serverExports = WebpackMock.serverExports;
    clientExports = WebpackMock.clientExports;
    webpackMap = WebpackMock.webpackMap;
    webpackServerMap = WebpackMock.webpackServerMap;
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

  function dripStream(input) {
    const reader = input.getReader();
    let nextDrop = 0;
    let controller = null;
    let streamDone = false;
    const buffer = [];
    function flush() {
      if (controller === null || nextDrop === 0) {
        return;
      }
      while (buffer.length > 0 && nextDrop > 0) {
        const nextChunk = buffer[0];
        if (nextChunk.byteLength <= nextDrop) {
          nextDrop -= nextChunk.byteLength;
          controller.enqueue(nextChunk);
          buffer.shift();
          if (streamDone && buffer.length === 0) {
            controller.done();
          }
        } else {
          controller.enqueue(nextChunk.subarray(0, nextDrop));
          buffer[0] = nextChunk.subarray(nextDrop);
          nextDrop = 0;
        }
      }
    }
    const output = new ReadableStream({
      start(c) {
        controller = c;
        async function pump() {
          for (;;) {
            const {value, done} = await reader.read();
            if (done) {
              streamDone = true;
              break;
            }
            buffer.push(value);
            flush();
          }
        }
        pump();
      },
      pull() {},
      cancel(reason) {
        reader.cancel(reason);
      },
    });
    function drip(n) {
      nextDrop += n;
      flush();
    }

    return [output, drip];
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
      serverConsumerManifest: {
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

  it('should be able to load a server reference on a consuming server if a mapping exists', async () => {
    function greet(name) {
      return 'hi, ' + name;
    }
    const ServerModule = serverExports({
      greet,
    });

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(
        {
          method: ServerModule.greet,
          boundMethod: ServerModule.greet.bind(null, 'there'),
        },
        webpackMap,
      ),
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      serverConsumerManifest: {
        moduleMap: webpackMap,
        serverModuleMap: webpackServerMap,
        moduleLoading: webpackModuleLoading,
      },
    });

    const result = await response;

    expect(result.method).toBe(greet);
    expect(result.boundMethod()).toBe('hi, there');
  });

  it('should be able to load a server reference on a consuming server if a mapping exists (async)', async () => {
    let resolve;
    const chunkPromise = new Promise(r => (resolve = r));

    function greet(name) {
      return 'hi, ' + name;
    }
    const ServerModule = serverExports(
      {
        greet,
      },
      chunkPromise,
    );

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(
        {
          method: ServerModule.greet,
          boundMethod: ServerModule.greet.bind(null, 'there'),
        },
        webpackMap,
      ),
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      serverConsumerManifest: {
        moduleMap: webpackMap,
        serverModuleMap: webpackServerMap,
        moduleLoading: webpackModuleLoading,
      },
    });

    await resolve();

    const result = await response;

    expect(result.method).toBe(greet);
    expect(result.boundMethod()).toBe('hi, there');
  });

  it('should load a server reference on a consuming server and pass it back', async () => {
    function greet(name) {
      return 'hi, ' + name;
    }
    const ServerModule = serverExports({
      greet,
    });

    // Registering the server reference also with the client must not break
    // subsequent `.bind` calls.
    ReactServerDOMClient.registerServerReference(
      ServerModule.greet,
      ServerModule.greet.$$id,
    );

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(
        {
          method: ServerModule.greet,
          boundMethod: ServerModule.greet.bind(null, 'there'),
        },
        webpackMap,
      ),
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      serverConsumerManifest: {
        moduleMap: webpackMap,
        serverModuleMap: webpackServerMap,
        moduleLoading: webpackModuleLoading,
      },
    });

    const result = await response;

    expect(result.method).toBe(greet);
    expect(result.boundMethod()).toBe('hi, there');

    const body = await ReactServerDOMClient.encodeReply({
      method: result.method,
      boundMethod: result.boundMethod,
    });
    const replyResult = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );
    expect(replyResult.method).toBe(greet);
    expect(replyResult.boundMethod()).toBe('hi, there');
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
        serverConsumerManifest: {
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
        serverConsumerManifest: {
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

    expect(serializedContent.length).toBeLessThan(490);
    expect(timesRendered).toBeLessThan(5);

    const model = await ReactServerDOMClient.createFromReadableStream(stream2, {
      serverConsumerManifest: {
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
    expect(serializedContent.length).toBeLessThan(__DEV__ ? 680 : 400);
    expect(timesRendered).toBeLessThan(5);

    const model = await serverAct(() =>
      ReactServerDOMClient.createFromReadableStream(stream2, {
        serverConsumerManifest: {
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
    const expectedDebugInfoSize = __DEV__ ? 320 * 20 : 0;
    expect(serializedContent.length).toBeLessThan(150 + expectedDebugInfoSize);
  });

  it('should break up large sync components by outlining into streamable elements', async () => {
    const paragraphs = [];
    for (let i = 0; i < 20; i++) {
      const text =
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris' +
        'porttitor tortor ac lectus faucibus, eget eleifend elit hendrerit.' +
        'Integer porttitor nisi in leo congue rutrum. Morbi sed ante posuere,' +
        'aliquam lorem ac, imperdiet orci. Duis malesuada gravida pharetra. Cras' +
        'facilisis arcu diam, id dictum lorem imperdiet a. Suspendisse aliquet' +
        'tempus tortor et ultricies. Aliquam libero velit, posuere tempus ante' +
        'sed, pellentesque tincidunt lorem. Nullam iaculis, eros a varius' +
        'aliquet, tortor felis tempor metus, nec cursus felis eros aliquam nulla.' +
        'Vivamus ut orci sed mauris congue lacinia. Cras eget blandit neque.' +
        'Pellentesque a massa in turpis ullamcorper volutpat vel at massa. Sed' +
        'ante est, auctor non diam non, vulputate ultrices metus. Maecenas dictum' +
        'fermentum quam id aliquam. Donec porta risus vitae pretium posuere.' +
        'Fusce facilisis eros in lacus tincidunt congue.' +
        i; /* trick dedupe */
      paragraphs.push(<p key={i}>{text}</p>);
    }

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(paragraphs),
    );

    const [stream2, drip] = dripStream(stream);

    // Allow some of the content through.
    drip(5000);

    const result = await ReactServerDOMClient.createFromReadableStream(
      stream2,
      {
        serverConsumerManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );

    // We should have resolved enough to be able to get the array even though some
    // of the items inside are still lazy.
    expect(result.length).toBe(20);

    // Unblock the rest
    drip(Infinity);

    // Use the SSR render to resolve any lazy elements
    const ssrStream = await serverAct(() =>
      ReactDOMServer.renderToReadableStream(result),
    );
    const html = await readResult(ssrStream);

    const ssrStream2 = await serverAct(() =>
      ReactDOMServer.renderToReadableStream(paragraphs),
    );
    const html2 = await readResult(ssrStream2);

    expect(html).toBe(html2);
  });

  it('regression: should not leak serialized size', async () => {
    const MAX_ROW_SIZE = 3200;
    // This test case is a bit convoluted and may no longer trigger the original bug.
    // Originally, the size of `promisedText` was not cleaned up so the sync portion
    // ended up being deferred immediately when we called `renderToReadableStream` again
    // i.e. `result2.syncText` became a Lazy element on the second request.
    const longText = 'd'.repeat(MAX_ROW_SIZE);
    const promisedText = Promise.resolve(longText);
    const model = {syncText: <p>{longText}</p>, promisedText};

    const stream = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(model),
    );

    const result = await ReactServerDOMClient.createFromReadableStream(stream, {
      serverConsumerManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });

    const stream2 = await serverAct(() =>
      ReactServerDOMServer.renderToReadableStream(model),
    );

    const result2 = await ReactServerDOMClient.createFromReadableStream(
      stream2,
      {
        serverConsumerManifest: {
          moduleMap: null,
          moduleLoading: null,
        },
      },
    );

    expect(result2.syncText).toEqual(result.syncText);
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
      passThrough(ReactServerDOMServer.renderToReadableStream(buffers)),
    );
    const result = await ReactServerDOMClient.createFromReadableStream(stream, {
      serverConsumerManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    expect(result).toEqual(buffers);
  });

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
      serverConsumerManifest: {
        moduleMap: null,
        moduleLoading: null,
      },
    });
    expect(result instanceof Blob).toBe(true);
    expect(result.size).toBe(bytes.length * 2);
    expect(await result.arrayBuffer()).toEqual(await blob.arrayBuffer());
  });

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
      serverConsumerManifest: {
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
        serverConsumerManifest: {
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
        serverConsumerManifest: {
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
        serverConsumerManifest: {
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
        serverConsumerManifest: {
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

    ServerModule.greet.bind({}, 'hi');
    assertConsoleErrorDev(
      [
        'Cannot bind "this" of a Server Action. Pass null or undefined as the first argument to .bind().',
      ],
      {withoutStack: true},
    );

    ServerModuleImportedOnClient.greet.bind({}, 'hi');
    assertConsoleErrorDev(
      [
        'Cannot bind "this" of a Server Action. Pass null or undefined as the first argument to .bind().',
      ],
      {withoutStack: true},
    );
  });

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
        serverConsumerManifest: {
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
        serverConsumerManifest: {
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

  // @gate !__DEV__ || enableComponentPerformanceTrack
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
        serverConsumerManifest: {
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
      });
      expect(lazyWrapper._debugInfo).toEqual([
        {time: 12},
        greetInfo,
        {time: 13},
        expect.objectContaining({
          name: 'Container',
          env: 'Server',
          owner: greetInfo,
        }),
        {time: 14},
      ]);
      // The owner that created the span was the outer server component.
      // We expect the debug info to be referentially equal to the owner.
      expect(greeting._owner).toBe(lazyWrapper._debugInfo[1]);
    } else {
      expect(lazyWrapper._debugInfo).toBe(undefined);
      expect(greeting._owner).toBe(undefined);
    }
  });

  // @gate __DEV__
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
        serverConsumerManifest: {
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
        pendingResult: ReactServerDOMStaticServer.unstable_prerender(
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
      serverConsumerManifest: {
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
        pendingResult: ReactServerDOMStaticServer.unstable_prerender(
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

    expect(errors).toEqual([]);

    function ClientRoot({response}) {
      return use(response);
    }

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      serverConsumerManifest: {
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
    expect(errors).toEqual([new Error('Connection closed.')]);
    // Should still match the result when parsed
    const result = await readResult(ssrStream);
    const div = document.createElement('div');
    div.innerHTML = result;
    expect(div.textContent).toBe('loading...');
  });

  // @gate enableHalt
  it('should abort parsing an incomplete prerender payload', async () => {
    const infinitePromise = new Promise(() => {});
    const controller = new AbortController();
    const errors = [];
    const {pendingResult} = await serverAct(async () => {
      // destructure trick to avoid the act scope from awaiting the returned value
      return {
        pendingResult: ReactServerDOMStaticServer.unstable_prerender(
          {promise: infinitePromise},
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

    controller.abort();
    const {prelude} = await pendingResult;

    expect(errors).toEqual([]);

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      serverConsumerManifest: {
        moduleMap: {},
        moduleLoading: {},
      },
    });

    // Wait for the stream to finish and therefore abort before we try to .then the response.
    await 0;

    const result = await response;

    let error = null;
    try {
      await result.promise;
    } catch (x) {
      error = x;
    }
    expect(error).not.toBe(null);
    expect(error.message).toBe('Connection closed.');
  });

  // @gate experimental
  it('should be able to handle a rejected promise in unstable_prerender', async () => {
    const expectedError = new Error('Bam!');
    const errors = [];

    const {prelude} = await ReactServerDOMStaticServer.unstable_prerender(
      Promise.reject(expectedError),
      webpackMap,
      {
        onError(err) {
          errors.push(err);
        },
      },
    );

    expect(errors).toEqual([expectedError]);

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      serverConsumerManifest: {
        moduleMap: {},
        moduleLoading: {},
      },
    });

    let error = null;
    try {
      await response;
    } catch (x) {
      error = x;
    }

    const expectedMessage = __DEV__
      ? expectedError.message
      : 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.';

    expect(error).not.toBe(null);
    expect(error.message).toBe(expectedMessage);
  });

  // @gate experimental
  it('should be able to handle an erroring async iterable in unstable_prerender', async () => {
    const expectedError = new Error('Bam!');
    const errors = [];

    const {prelude} = await ReactServerDOMStaticServer.unstable_prerender(
      {
        async *[Symbol.asyncIterator]() {
          await serverAct(() => {
            throw expectedError;
          });
        },
      },
      webpackMap,
      {
        onError(err) {
          errors.push(err);
        },
      },
    );

    expect(errors).toEqual([expectedError]);

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      serverConsumerManifest: {
        moduleMap: {},
        moduleLoading: {},
      },
    });

    let error = null;
    try {
      const result = await response;
      const iterator = result[Symbol.asyncIterator]();
      await iterator.next();
    } catch (x) {
      error = x;
    }

    const expectedMessage = __DEV__
      ? expectedError.message
      : 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.';

    expect(error).not.toBe(null);
    expect(error.message).toBe(expectedMessage);
  });

  // @gate experimental
  it('should be able to handle an erroring readable stream in unstable_prerender', async () => {
    const expectedError = new Error('Bam!');
    const errors = [];

    const {prelude} = await ReactServerDOMStaticServer.unstable_prerender(
      new ReadableStream({
        async start(controller) {
          await serverAct(() => {
            setTimeout(() => {
              controller.error(expectedError);
            });
          });
        },
      }),
      webpackMap,
      {
        onError(err) {
          errors.push(err);
        },
      },
    );

    expect(errors).toEqual([expectedError]);

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      serverConsumerManifest: {
        moduleMap: {},
        moduleLoading: {},
      },
    });

    let error = null;
    try {
      const stream = await response;
      await stream.getReader().read();
    } catch (x) {
      error = x;
    }

    const expectedMessage = __DEV__
      ? expectedError.message
      : 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.';

    expect(error).not.toBe(null);
    expect(error.message).toBe(expectedMessage);
  });

  // @gate experimental
  it('can prerender an async iterable', async () => {
    const errors = [];

    const {prelude} = await ReactServerDOMStaticServer.unstable_prerender(
      {
        async *[Symbol.asyncIterator]() {
          yield 'hello';
          yield ' ';
          yield 'world';
        },
      },
      webpackMap,
      {
        onError(err) {
          errors.push(err);
        },
      },
    );

    expect(errors).toEqual([]);

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      serverConsumerManifest: {
        moduleMap: {},
        moduleLoading: {},
      },
    });

    let text = '';
    const result = await response;
    const iterator = result[Symbol.asyncIterator]();

    while (true) {
      const {done, value} = await iterator.next();
      if (done) {
        break;
      }
      text += value;
    }

    expect(text).toBe('hello world');
  });

  // @gate experimental
  it('can prerender a readable stream', async () => {
    const errors = [];

    const {prelude} = await ReactServerDOMStaticServer.unstable_prerender(
      new ReadableStream({
        start(controller) {
          controller.enqueue('hello world');
          controller.close();
        },
      }),
      webpackMap,
      {
        onError(err) {
          errors.push(err);
        },
      },
    );

    expect(errors).toEqual([]);

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      serverConsumerManifest: {
        moduleMap: {},
        moduleLoading: {},
      },
    });

    const stream = await response;
    const result = await readResult(stream);

    expect(result).toBe('hello world');
  });

  // @gate experimental
  it('does not return a prerender prelude early when an error is emitted and there are still pending tasks', async () => {
    let rejectPromise;
    const rejectingPromise = new Promise(
      (resolve, reject) => (rejectPromise = reject),
    );
    const expectedError = new Error('Boom!');
    const errors = [];

    const {prelude} = await ReactServerDOMStaticServer.unstable_prerender(
      [
        rejectingPromise,
        {
          async *[Symbol.asyncIterator]() {
            yield 'hello';
            yield ' ';
            await serverAct(() => {
              rejectPromise(expectedError);
            });
            yield 'world';
          },
        },
      ],
      webpackMap,
      {
        onError(err) {
          errors.push(err);
        },
      },
    );

    expect(errors).toEqual([expectedError]);

    const response = ReactServerDOMClient.createFromReadableStream(prelude, {
      serverConsumerManifest: {
        moduleMap: {},
        moduleLoading: {},
      },
    });

    let text = '';
    const [promise, iterable] = await response;
    const iterator = iterable[Symbol.asyncIterator]();

    while (true) {
      const {done, value} = await iterator.next();
      if (done) {
        break;
      }
      text += value;
    }

    expect(text).toBe('hello world');

    let error = null;
    try {
      await promise;
    } catch (x) {
      error = x;
    }

    const expectedMessage = __DEV__
      ? expectedError.message
      : 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.';

    expect(error).not.toBe(null);
    expect(error.message).toBe(expectedMessage);
  });
});
