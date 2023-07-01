/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Don't wait before processing work on the server.
// TODO: we can replace this with FlightServer.act().
global.setTimeout = cb => cb();

let clientExports;
let webpackMap;
let webpackModules;
let React;
let ReactDOMServer;
let ReactServerDOMServer;
let ReactServerDOMClient;
let use;

describe('ReactFlightDOMEdge', () => {
  beforeEach(() => {
    jest.resetModules();
    const WebpackMock = require('./utils/WebpackMock');
    clientExports = WebpackMock.clientExports;
    webpackMap = WebpackMock.webpackMap;
    webpackModules = WebpackMock.webpackModules;
    React = require('react');
    ReactDOMServer = require('react-dom/server.edge');
    ReactServerDOMServer = require('react-server-dom-webpack/server.edge');
    ReactServerDOMClient = require('react-server-dom-webpack/client.edge');
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
              prevChunk = chunk;
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

    const stream = ReactServerDOMServer.renderToReadableStream(
      <App />,
      webpackMap,
    );
    const response = ReactServerDOMClient.createFromReadableStream(stream, {
      moduleMap: translationMap,
    });

    function ClientRoot() {
      return use(response);
    }

    const ssrStream = await ReactDOMServer.renderToReadableStream(
      <ClientRoot />,
    );
    const result = await readResult(ssrStream);
    expect(result).toEqual('<span>Client Component</span>');
  });

  it('should encode long string in a compact format', async () => {
    const testString = '"\n\t'.repeat(500) + '🙃';
    const testString2 = 'hello'.repeat(400);

    const stream = ReactServerDOMServer.renderToReadableStream({
      text: testString,
      text2: testString2,
    });
    const [stream1, stream2] = passThrough(stream).tee();

    const serializedContent = await readResult(stream1);
    // The content should be compact an unescaped
    expect(serializedContent.length).toBeLessThan(4000);
    expect(serializedContent).not.toContain('\\n');
    expect(serializedContent).not.toContain('\\t');
    expect(serializedContent).not.toContain('\\"');
    expect(serializedContent).toContain('\t');

    const result = await ReactServerDOMClient.createFromReadableStream(stream2);
    // Should still match the result when parsed
    expect(result.text).toBe(testString);
    expect(result.text2).toBe(testString2);
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
    const stream = passThrough(
      ReactServerDOMServer.renderToReadableStream(buffers),
    );
    const result = await ReactServerDOMClient.createFromReadableStream(stream);
    expect(result).toEqual(buffers);
  });
});
