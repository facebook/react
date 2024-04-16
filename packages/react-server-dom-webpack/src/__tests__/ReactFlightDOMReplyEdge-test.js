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

if (typeof Blob === 'undefined') {
  global.Blob = require('buffer').Blob;
}
if (typeof File === 'undefined') {
  global.File = require('buffer').File;
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

  if (typeof FormData === 'undefined') {
    // We can't test if we don't have a native FormData implementation because the JSDOM one
    // is missing the arrayBuffer() method.
    it('cannot test', () => {});
    return;
  }

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

  if (typeof FormData !== 'undefined' && typeof File !== 'undefined') {
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
  }
});
