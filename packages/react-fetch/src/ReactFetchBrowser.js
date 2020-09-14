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

function toResult(thenable): Result {
  const result: Result = {
    status: Pending,
    value: thenable,
  };
  thenable.then(
    value => {
      if (result.status === Pending) {
        const resolvedResult = ((result: any): ResolvedResult);
        resolvedResult.status = Resolved;
        resolvedResult.value = value;
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

function Response(nativeResponse) {
  this.headers = nativeResponse.headers;
  this.ok = nativeResponse.ok;
  this.redirected = nativeResponse.redirected;
  this.status = nativeResponse.status;
  this.statusText = nativeResponse.statusText;
  this.type = nativeResponse.type;
  this.url = nativeResponse.url;

  this._response = nativeResponse;
  this._arrayBuffer = null;
  this._blob = null;
  this._json = null;
  this._text = null;
}

Response.prototype = {
  constructor: Response,
  arrayBuffer() {
    return readResult(
      this._arrayBuffer ||
        (this._arrayBuffer = toResult(this._response.arrayBuffer())),
    );
  },
  blob() {
    return readResult(
      this._blob || (this._blob = toResult(this._response.blob())),
    );
  },
  json() {
    return readResult(
      this._json || (this._json = toResult(this._response.json())),
    );
  },
  text() {
    return readResult(
      this._text || (this._text = toResult(this._response.text())),
    );
  },
};

function preloadResult(url: string, options: mixed): Result {
  const map = readResultMap();
  let entry = map.get(url);
  if (!entry) {
    if (options) {
      if (options.method || options.body || options.signal) {
        // TODO: wire up our own cancellation mechanism.
        // TODO: figure out what to do with POST.
        throw Error('Unsupported option');
      }
    }
    const thenable = nativeFetch(url, options);
    entry = toResult(thenable);
    map.set(url, entry);
  }
  return entry;
}

export function preload(url: string, options: mixed): void {
  preloadResult(url, options);
  // Don't return anything.
}

export function fetch(url: string, options: mixed): Object {
  const result = preloadResult(url, options);
  const nativeResponse = (readResult(result): any);
  if (nativeResponse._reactResponse) {
    return nativeResponse._reactResponse;
  } else {
    return (nativeResponse._reactResponse = new Response(nativeResponse));
  }
}
