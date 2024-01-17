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

// let serverExports;
let webpackServerMap;
let ReactServerDOMServer;
let ReactServerDOMClient;

describe('ReactFlightDOMReply', () => {
  beforeEach(() => {
    jest.resetModules();
    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.browser'),
    );
    const WebpackMock = require('./utils/WebpackMock');
    // serverExports = WebpackMock.serverExports;
    webpackServerMap = WebpackMock.webpackServerMap;
    ReactServerDOMServer = require('react-server-dom-webpack/server.browser');
    jest.resetModules();
    ReactServerDOMClient = require('react-server-dom-webpack/client');
  });

  // This method should exist on File but is not implemented in JSDOM
  async function arrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        return resolve(reader.result);
      };
      reader.onerror = function () {
        return reject(reader.error);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  it('can pass undefined as a reply', async () => {
    const body = await ReactServerDOMClient.encodeReply(undefined);
    const missing = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );
    expect(missing).toBe(undefined);

    const body2 = await ReactServerDOMClient.encodeReply({
      array: [undefined, null, undefined],
      prop: undefined,
    });
    const object = await ReactServerDOMServer.decodeReply(
      body2,
      webpackServerMap,
    );
    expect(object.array.length).toBe(3);
    expect(object.array[0]).toBe(undefined);
    expect(object.array[1]).toBe(null);
    expect(object.array[3]).toBe(undefined);
    expect(object.prop).toBe(undefined);
    // These should really be true but our deserialization doesn't currently deal with it.
    expect('3' in object.array).toBe(false);
    expect('prop' in object).toBe(false);
  });

  it('can pass an iterable as a reply', async () => {
    const body = await ReactServerDOMClient.encodeReply({
      [Symbol.iterator]: function* () {
        yield 'A';
        yield 'B';
        yield 'C';
      },
    });
    const iterable = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );
    const items = [];
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const item of iterable) {
      items.push(item);
    }
    expect(items).toEqual(['A', 'B', 'C']);
  });

  it('can pass weird numbers as a reply', async () => {
    const nums = [0, -0, Infinity, -Infinity, NaN];
    const body = await ReactServerDOMClient.encodeReply(nums);
    const nums2 = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

    expect(nums).toEqual(nums2);
    expect(nums.every((n, i) => Object.is(n, nums2[i]))).toBe(true);
  });

  it('can pass a BigInt as a reply', async () => {
    const body = await ReactServerDOMClient.encodeReply(90071992547409910000n);
    const n = await ReactServerDOMServer.decodeReply(body, webpackServerMap);

    expect(n).toEqual(90071992547409910000n);
  });

  it('can pass FormData as a reply', async () => {
    const formData = new FormData();
    formData.set('hello', 'world');
    formData.append('list', '1');
    formData.append('list', '2');
    formData.append('list', '3');
    const typedArray = new Uint8Array([0, 1, 2, 3]);
    const blob = new Blob([typedArray]);
    formData.append('blob', blob, 'filename.blob');

    const body = await ReactServerDOMClient.encodeReply(formData);
    const formData2 = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

    expect(formData2).not.toBe(formData);
    expect(Array.from(formData2).length).toBe(5);
    expect(formData2.get('hello')).toBe('world');
    expect(formData2.getAll('list')).toEqual(['1', '2', '3']);
    const blob2 = formData.get('blob');
    expect(blob2.size).toBe(4);
    expect(blob2.name).toBe('filename.blob');
    expect(blob2.type).toBe('');
    const typedArray2 = new Uint8Array(await arrayBuffer(blob2));
    expect(typedArray2).toEqual(typedArray);
  });

  it('can pass multiple Files in FormData', async () => {
    const typedArrayA = new Uint8Array([0, 1, 2, 3]);
    const typedArrayB = new Uint8Array([4, 5]);
    const blobA = new Blob([typedArrayA]);
    const blobB = new Blob([typedArrayB]);
    const formData = new FormData();
    formData.append('filelist', 'string');
    formData.append('filelist', blobA);
    formData.append('filelist', blobB);

    const body = await ReactServerDOMClient.encodeReply(formData);
    const formData2 = await ReactServerDOMServer.decodeReply(
      body,
      webpackServerMap,
    );

    const filelist2 = formData2.getAll('filelist');
    expect(filelist2.length).toBe(3);
    expect(filelist2[0]).toBe('string');
    const blobA2 = filelist2[1];
    expect(blobA2.size).toBe(4);
    expect(blobA2.name).toBe('blob');
    expect(blobA2.type).toBe('');
    const typedArrayA2 = new Uint8Array(await arrayBuffer(blobA2));
    expect(typedArrayA2).toEqual(typedArrayA);
    const blobB2 = filelist2[2];
    expect(blobB2.size).toBe(2);
    expect(blobB2.name).toBe('blob');
    expect(blobB2.type).toBe('');
    const typedArrayB2 = new Uint8Array(await arrayBuffer(blobB2));
    expect(typedArrayB2).toEqual(typedArrayB);
  });

  it('can pass two independent FormData with same keys', async () => {
    const formDataA = new FormData();
    formDataA.set('greeting', 'hello');
    const formDataB = new FormData();
    formDataB.set('greeting', 'hi');

    const body = await ReactServerDOMClient.encodeReply({
      a: formDataA,
      b: formDataB,
    });
    const {a: formDataA2, b: formDataB2} =
      await ReactServerDOMServer.decodeReply(body, webpackServerMap);

    expect(Array.from(formDataA2).length).toBe(1);
    expect(Array.from(formDataB2).length).toBe(1);
    expect(formDataA2.get('greeting')).toBe('hello');
    expect(formDataB2.get('greeting')).toBe('hi');
  });

  it('can pass a Date as a reply', async () => {
    const d = new Date(1234567890123);
    const body = await ReactServerDOMClient.encodeReply(d);
    const d2 = await ReactServerDOMServer.decodeReply(body, webpackServerMap);

    expect(d).toEqual(d2);
    expect(d % 1000).toEqual(123); // double-check the milliseconds made it through
  });

  it('can pass a Map as a reply', async () => {
    const objKey = {obj: 'key'};
    const m = new Map([
      ['hi', {greet: 'world'}],
      [objKey, 123],
    ]);
    const body = await ReactServerDOMClient.encodeReply(m);
    const m2 = await ReactServerDOMServer.decodeReply(body, webpackServerMap);

    expect(m2 instanceof Map).toBe(true);
    expect(m2.size).toBe(2);
    expect(m2.get('hi').greet).toBe('world');
    expect(m2).toEqual(m);
  });

  it('can pass a Set as a reply', async () => {
    const objKey = {obj: 'key'};
    const s = new Set(['hi', objKey]);

    const body = await ReactServerDOMClient.encodeReply(s);
    const s2 = await ReactServerDOMServer.decodeReply(body, webpackServerMap);

    expect(s2 instanceof Set).toBe(true);
    expect(s2.size).toBe(2);
    expect(s2.has('hi')).toBe(true);
    expect(s2).toEqual(s);
  });

  it('does not hang indefinitely when calling decodeReply with FormData', async () => {
    let error;
    try {
      await ReactServerDOMServer.decodeReply(new FormData(), webpackServerMap);
    } catch (e) {
      error = e;
    }
    expect(error.message).toBe('Connection closed.');
  });
});
