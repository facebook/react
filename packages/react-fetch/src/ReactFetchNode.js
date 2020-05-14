/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';

import * as http from 'http';
import * as https from 'https';

import {readCache} from 'react/unstable-cache';

type FetchResponse = {|
  // Properties
  headers: any,
  ok: boolean,
  redirected: boolean,
  status: number,
  statusText: string,
  type: 'basic',
  url: string,
  // Methods
  arrayBuffer(): ArrayBuffer,
  blob(): any,
  json(): any,
  text(): string,
|};

function nodeFetch(
  url: string,
  options: mixed,
  onResolve: any => void,
  onReject: any => void,
): void {
  const {hostname, pathname, search, port, protocol} = new URL(url);
  const nodeOptions = {
    hostname,
    port,
    path: pathname + search,
    // TODO: cherry-pick supported user-passed options.
  };
  const nodeImpl = protocol === 'https:' ? https : http;
  const request = nodeImpl.request(nodeOptions, response => {
    // TODO: support redirects.
    onResolve(new Response(response));
  });
  request.on('error', error => {
    onReject(error);
  });
  request.end();
}

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type PendingResult = {|
  status: 0,
  value: Wakeable,
|};

type ResolvedResult<V> = {|
  status: 1,
  value: V,
|};

type RejectedResult = {|
  status: 2,
  value: mixed,
|};

type Result<V> = PendingResult | ResolvedResult<V> | RejectedResult;

const fetchKey = {};

function readResultMap(): Map<string, Result<FetchResponse>> {
  const resources = readCache().resources;
  let map = resources.get(fetchKey);
  if (map === undefined) {
    map = new Map();
    resources.set(fetchKey, map);
  }
  return map;
}

function readResult<T>(result: Result<T>): T {
  if (result.status === Resolved) {
    return result.value;
  } else {
    throw result.value;
  }
}

function Response(nativeResponse) {
  this.headers = nativeResponse.headers;
  this.ok = nativeResponse.statusCode >= 200 && nativeResponse.statusCode < 300;
  this.redirected = false; // TODO
  this.status = nativeResponse.statusCode;
  this.statusText = nativeResponse.statusMessage;
  this.type = 'basic';
  this.url = nativeResponse.url;

  this._response = nativeResponse;
  this._blob = null;
  this._json = null;
  this._text = null;

  const callbacks = [];
  function wake() {
    // This assumes they won't throw.
    while (callbacks.length > 0) {
      const cb = callbacks.pop();
      cb();
    }
  }
  const result: PendingResult = (this._result = {
    status: Pending,
    value: {
      then(cb) {
        callbacks.push(cb);
      },
    },
  });
  const data = [];
  nativeResponse.on('data', chunk => data.push(chunk));
  nativeResponse.on('end', () => {
    if (result.status === Pending) {
      const resolvedResult = ((result: any): ResolvedResult<Buffer>);
      resolvedResult.status = Resolved;
      resolvedResult.value = Buffer.concat(data);
      wake();
    }
  });
  nativeResponse.on('error', err => {
    if (result.status === Pending) {
      const rejectedResult = ((result: any): RejectedResult);
      rejectedResult.status = Rejected;
      rejectedResult.value = err;
      wake();
    }
  });
}

Response.prototype = {
  constructor: Response,
  arrayBuffer() {
    const buffer = readResult(this._result);
    return buffer;
  },
  blob() {
    // TODO: Is this needed?
    throw new Error('Not implemented.');
  },
  json() {
    const buffer = readResult(this._result);
    return JSON.parse(buffer.toString());
  },
  text() {
    const buffer = readResult(this._result);
    return buffer.toString();
  },
};

function preloadResult(url: string, options: mixed): Result<FetchResponse> {
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
    const callbacks = [];
    const wakeable = {
      then(cb) {
        callbacks.push(cb);
      },
    };
    const wake = () => {
      // This assumes they won't throw.
      while (callbacks.length > 0) {
        const cb = callbacks.pop();
        cb();
      }
    };
    const result: Result<FetchResponse> = (entry = {
      status: Pending,
      value: wakeable,
    });
    nodeFetch(
      url,
      options,
      response => {
        if (result.status === Pending) {
          const resolvedResult = ((result: any): ResolvedResult<FetchResponse>);
          resolvedResult.status = Resolved;
          resolvedResult.value = response;
          wake();
        }
      },
      err => {
        if (result.status === Pending) {
          const rejectedResult = ((result: any): RejectedResult);
          rejectedResult.status = Rejected;
          rejectedResult.value = err;
          wake();
        }
      },
    );
    map.set(url, entry);
  }
  return entry;
}

export function preload(url: string, options: mixed): void {
  preloadResult(url, options);
  // Don't return anything.
}

export function fetch(url: string, options: mixed): FetchResponse {
  const result = preloadResult(url, options);
  return readResult(result);
}
