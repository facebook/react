/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';

import {unstable_getCacheForType} from 'react';

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type PendingRecord = {
  status: 0,
  value: Wakeable,
};

type ResolvedRecord = {
  status: 1,
  value: mixed,
};

type RejectedRecord = {
  status: 2,
  value: mixed,
};

type Record = PendingRecord | ResolvedRecord | RejectedRecord;

declare var globalThis: any;

// TODO: this is a browser-only version. Add a separate Node entry point.
const nativeFetch = (typeof globalThis !== 'undefined' ? globalThis : window)
  .fetch;

function getRecordMap(): Map<string, Record> {
  return unstable_getCacheForType(createRecordMap);
}

function createRecordMap(): Map<string, Record> {
  return new Map();
}

function createRecordFromThenable(thenable): Record {
  const record: Record = {
    status: Pending,
    value: thenable,
  };
  thenable.then(
    value => {
      if (record.status === Pending) {
        const resolvedRecord = ((record: any): ResolvedRecord);
        resolvedRecord.status = Resolved;
        resolvedRecord.value = value;
      }
    },
    err => {
      if (record.status === Pending) {
        const rejectedRecord = ((record: any): RejectedRecord);
        rejectedRecord.status = Rejected;
        rejectedRecord.value = err;
      }
    },
  );
  return record;
}

function readRecordValue(record: Record) {
  if (record.status === Resolved) {
    return record.value;
  } else {
    throw record.value;
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
    return readRecordValue(
      this._arrayBuffer ||
        (this._arrayBuffer = createRecordFromThenable(
          this._response.arrayBuffer(),
        )),
    );
  },
  blob() {
    return readRecordValue(
      this._blob ||
        (this._blob = createRecordFromThenable(this._response.blob())),
    );
  },
  json() {
    return readRecordValue(
      this._json ||
        (this._json = createRecordFromThenable(this._response.json())),
    );
  },
  text() {
    return readRecordValue(
      this._text ||
        (this._text = createRecordFromThenable(this._response.text())),
    );
  },
};

function preloadRecord(url: string, options: mixed): Record {
  const map = getRecordMap();
  let record = map.get(url);
  if (!record) {
    if (options) {
      if (options.method || options.body || options.signal) {
        // TODO: wire up our own cancellation mechanism.
        // TODO: figure out what to do with POST.
        // eslint-disable-next-line react-internal/prod-error-codes
        throw Error('Unsupported option');
      }
    }
    const thenable = nativeFetch(url, options);
    record = createRecordFromThenable(thenable);
    map.set(url, record);
  }
  return record;
}

export function preload(url: string, options: mixed): void {
  preloadRecord(url, options);
  // Don't return anything.
}

export function fetch(url: string, options: mixed): Object {
  const record = preloadRecord(url, options);
  const nativeResponse = (readRecordValue(record): any);
  if (nativeResponse._reactResponse) {
    return nativeResponse._reactResponse;
  } else {
    return (nativeResponse._reactResponse = new Response(nativeResponse));
  }
}
