/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as https from 'https';

export type FetchOptions = {|
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

export function nodeFetch(url: string, options: FetchOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    return makeRequest(url, options, resolve, reject);
  });
}
