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

// let serverExports;
let webpackServerMap;
let ReactServerDOMServer;
let ReactServerDOMClient;

describe('ReactFlightDOMReplyEdge', () => {
  beforeEach(() => {
    jest.resetModules();
    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.edge'),
    );
    const WebpackMock = require('./utils/WebpackMock');
    // serverExports = WebpackMock.serverExports;
    webpackServerMap = WebpackMock.webpackServerMap;
    ReactServerDOMServer = require('react-server-dom-webpack/server.edge');
    jest.resetModules();
    ReactServerDOMClient = require('react-server-dom-webpack/client.edge');
  });

  it('can encode a reply', async () => {
    const body = await ReactServerDOMClient.encodeReply({some: 'object'});
    const decoded = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

    expect(decoded).toEqual({some: 'object'});
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

    const body = await ReactServerDOMClient.encodeReply(buffers);
    const result = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

    expect(result).toEqual(buffers);
    // Array buffers can't use the toEqual helper.
    expect(new Uint8Array(result[0])).toEqual(new Uint8Array(buffers[0]));
  });

  // @gate enableBinaryFlight
  it('should be able to serialize a typed array inside a Map', async () => {
    const array = new Uint8Array([
      123, 4, 10, 5, 100, 255, 244, 45, 56, 67, 43, 124, 67, 89, 100, 20,
    ]);
    const map = new Map();
    map.set('array', array);

    const body = await ReactServerDOMClient.encodeReply(map);
    const result = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

    expect(result.get('array')).toEqual(array);
  });

  // @gate enableBinaryFlight
  it('should be able to serialize a blob', async () => {
    const bytes = new Uint8Array([
      123, 4, 10, 5, 100, 255, 244, 45, 56, 67, 43, 124, 67, 89, 100, 20,
    ]);
    const blob = new Blob([bytes, bytes], {
      type: 'application/x-test',
    });
    const body = await ReactServerDOMClient.encodeReply(blob);
    const result = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );
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

    const body = await ReactServerDOMClient.encodeReply(formData);
    const result = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

    expect(result instanceof FormData).toBe(true);
    expect(result.get('hi')).toBe('world');
    const resultBlob = result.get('file');
    expect(resultBlob instanceof Blob).toBe(true);
    expect(resultBlob.name).toBe('filename.test'); // In this direction we allow file name to pass through but not other direction.
    expect(resultBlob.size).toBe(bytes.length * 2);
    expect(await resultBlob.arrayBuffer()).toEqual(await blob.arrayBuffer());
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

    const body = await ReactServerDOMClient.encodeReply(s);
    const result = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

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

    const body = await ReactServerDOMClient.encodeReply(s);
    const result = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

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
});
