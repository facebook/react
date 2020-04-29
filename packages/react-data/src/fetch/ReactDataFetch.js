/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';

import {readCache} from 'react/unstable-cache';

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type PendingResult = {|
  status: 0,
  value: Wakeable,
|};

type ResolvedResult = {|
  status: 1,
  value: mixed,
|};

type RejectedResult = {|
  status: 2,
  value: mixed,
|};

type Result = PendingResult | ResolvedResult | RejectedResult;

// TODO: this is a browser-only version. Add a separate Node entry point.
const nativeFetch = window.fetch;
const fetchKey = {};

function readResultMap(): Map<string, Result> {
  const resources = readCache().resources;
  let map = resources.get(fetchKey);
  if (map === undefined) {
    map = new Map();
    resources.set(fetchKey, map);
  }
  return map;
}

function createFromThenable(thenable, wrapValue): Result {
  const result: Result = {
    status: Pending,
    value: (null: any),
  };
  result.value = thenable.then(
    value => {
      if (result.status === Pending) {
        const resolvedResult = ((result: any): ResolvedResult);
        resolvedResult.status = Resolved;
        resolvedResult.value = wrapValue(value);
      }
    },
    err => {
      if (result.status === Pending) {
        const rejectedResult = ((result: any): RejectedResult);
        rejectedResult.status = Rejected;
        rejectedResult.value = err;
      }
    },
  );
  return result;
}

function readResult(result: Result) {
  if (result.status === Resolved) {
    return result.value;
  } else {
    throw result.value;
  }
}

function getArrayBuffer(nativeResponse) {
  return nativeResponse.arrayBuffer();
}

function getBlob(nativeResponse) {
  return nativeResponse.blob();
}

function getJson(nativeResponse) {
  return nativeResponse.json();
}

function getText(nativeResponse) {
  return nativeResponse.json();
}

function Response(nativeResponse) {
  this.headers = nativeResponse.headers;
  this.ok = nativeResponse.ok;
  this.redirected = nativeResponse.redirected;
  this.status = nativeResponse.status;
  this.statusText = nativeResponse.statusText;
  this.type = nativeResponse.type;
  this.url = nativeResponse.url;

  this._entry = null;
  this._consumed = null;
  this._response = nativeResponse;
}

Response.prototype = {
  arrayBuffer() {
    return this._read('arrayBuffer', getArrayBuffer);
  },
  blob() {
    return this._read('blob', getBlob);
  },
  json() {
    return this._read('json', getJson);
  },
  text() {
    return this._read('text', getText);
  },
  _read(type: string, getThenable) {
    const consumed = this._consumed;
    if (consumed != null && type !== consumed) {
      throw new Error('Already read.');
    }
    let entry = this._entry;
    if (entry == null) {
      this._consumed = type;
      const thenable = getThenable(this._response);
      entry = this._entry = createFromThenable(thenable, r => r);
    }
    return readResult(entry);
  },
};

export function fetch(url: string, options: mixed): Object {
  const map = readResultMap();
  let entry = map.get(url);
  if (entry == null) {
    if (options) {
      if (options.method || options.body || options.signal) {
        // TODO: wire up our own cancellation mechanism.
        // TODO: figure out what to do with POST.
        throw Error('Unsupported option');
      }
    }
    const thenable = nativeFetch(url, options);
    entry = createFromThenable(
      thenable,
      nativeResponse => new Response(nativeResponse),
    );
    map.set(url, entry);
  }
  return readResult(entry);
}
