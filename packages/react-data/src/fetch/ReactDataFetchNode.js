/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';

import * as https from 'https';

import {readCache} from 'react/unstable-cache';

type FetchOptions = {|
  method?: string,
  headers?: any,
  redirect?: 'follow' | 'manual' | 'error',
  // Not yet implemented
  signal?: any,
  body?: any,
|};

type FetchResponse = {|
  // Properties
  headers: any,
  ok: boolean,
  redirected: boolean,
  status: number,
  statusText: string,
  type: 'basic' | 'opaqueredirect',
  url: string,
  // Methods
  arrayBuffer(): ArrayBuffer,
  blob(): any,
  json(): any,
  text(): string,
|};

const defaultOptions: FetchOptions = {
  method: 'GET',
  headers: {},
  redirect: 'follow',
};

const assign = Object['as' + 'sign'];

function makeRequest(
  url: string,
  fetchOptions: FetchOptions,
  done: any => void,
  err: any => void,
  redirects: number = 0,
): void {
  const {hostname, pathname} = new URL(url);

  const options = assign({}, defaultOptions, fetchOptions, {
    hostname,
    path: pathname,
  });

  const request = https.request(options, response => {
    if (isRedirect(response.statusCode)) {
      if (options.redirect === 'error') {
        throw new Error('Failed to fetch');
      }

      let nextUrl = new URL(response.headers.location, url);
      nextUrl = nextUrl.href;

      if (options.redirect === 'manual') {
        createOpaqueRedirectResponse(url);
      } else {
        makeRequest(nextUrl, fetchOptions, done, err, redirects + 1);
      }

      return;
    }

    response.on('data', data => {
      done(createResponse(url, redirects > 0, response, data));
    });
  });

  request.on('error', error => {
    err(error);
  });

  request.end();
}

function isRedirect(code: number): boolean {
  switch (code) {
    case 301:
    case 302:
    case 303:
    case 307:
    case 308:
      return true;
    default:
      return false;
  }
}

function createOpaqueRedirectResponse(url: string): FetchResponse {
  return {
    headers: {},
    ok: false,
    redirected: false,
    status: 0,
    statusText: '',
    type: 'opaqueredirect',
    url,
    arrayBuffer() {
      throw new Error('TODO');
    },
    blob() {
      throw new Error('TODO');
    },
    json() {
      throw new Error('TODO');
    },
    text() {
      throw new Error('TODO');
    },
  };
}

function createResponse(
  url: string,
  redirected: boolean,
  response: any,
  data: Buffer,
): FetchResponse {
  return {
    headers: response.headers,
    ok: response.statusCode >= 200 && response.statusCode < 300,
    redirected,
    status: response.statusCode,
    statusText: response.statusMessage,
    type: 'basic',
    url,
    arrayBuffer() {
      return Uint8Array.from(data).buffer;
    },
    blob() {
      // TODO: Not sure how to handle this just yet.
      throw new Error('TODO');
    },
    json() {
      return JSON.parse(data.toString());
    },
    text() {
      return data.toString();
    },
  };
}

function nodeFetch(url: string, options: FetchOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    return makeRequest(url, options, resolve, reject);
  });
}

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

function preloadResult(url: string, options: FetchOptions): Result {
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
    const thenable = nodeFetch(url, options);
    entry = toResult(thenable);
    map.set(url, entry);
  }
  return entry;
}

export function preload(url: string, options: FetchOptions): void {
  // Don't return anything.
}

export function fetch(url: string, options: FetchOptions): Object {
  const result = preloadResult(url, options);
  const nativeResponse = (readResult(result): any);
  if (nativeResponse._reactResponse) {
    return nativeResponse._reactResponse;
  } else {
    return (nativeResponse._reactResponse = new Response(nativeResponse));
  }
}
