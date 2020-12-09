/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable, Thenable} from 'shared/ReactTypes';

import {unstable_getCacheForType} from 'react';
import * as fs from 'fs/promises';
import {isAbsolute, normalize} from 'path';

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type PendingRecord = {|
  status: 0,
  value: Wakeable,
  cache: null,
|};

type ResolvedRecord<T> = {|
  status: 1,
  value: T,
  cache: null | Array<mixed>,
|};

type RejectedRecord = {|
  status: 2,
  value: mixed,
  cache: null,
|};

type Record<T> = PendingRecord | ResolvedRecord<T> | RejectedRecord;

function createRecordFromThenable<T>(thenable: Thenable<T>): Record<T> {
  const record: Record<T> = {
    status: Pending,
    value: thenable,
    cache: null,
  };
  thenable.then(
    value => {
      if (record.status === Pending) {
        const resolvedRecord = ((record: any): ResolvedRecord<T>);
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

function readRecord<T>(record: Record<T>): ResolvedRecord<T> {
  if (record.status === Resolved) {
    // This is just a type refinement.
    return record;
  } else {
    throw record.value;
  }
}

// We don't want to normalize every path ourselves in production.
// However, relative or non-normalized paths will lead to cache misses.
// So we encourage the developer to fix it in DEV and normalize on their end.
function checkPathInDev(path: string) {
  if (__DEV__) {
    if (!isAbsolute(path)) {
      console.error(
        'The provided path was not absolute: "%s". ' +
          'Convert it to an absolute path first.',
        path,
      );
    } else if (path !== normalize(path)) {
      console.error(
        'The provided path was not normalized: "%s". ' +
          'Convert it to a normalized path first.',
        path,
      );
    }
  }
}

function createAccessCache(): Map<string, Array<number | Record<void>>> {
  return new Map();
}

export function access(path: string, mode?: number): void {
  checkPathInDev(path);
  if (mode == null) {
    mode = 0; // fs.constants.F_OK
  }
  const map = unstable_getCacheForType(createAccessCache);
  let accessCache = map.get(path);
  if (!accessCache) {
    accessCache = [];
    map.set(path, accessCache);
  }
  let record;
  for (let i = 0; i < accessCache.length; i += 2) {
    const cachedMode: number = (accessCache[i]: any);
    if (mode === cachedMode) {
      const cachedRecord: Record<void> = (accessCache[i + 1]: any);
      record = cachedRecord;
      break;
    }
  }
  if (!record) {
    const thenable = fs.access(path, mode);
    record = createRecordFromThenable(thenable);
    accessCache.push(mode, record);
  }
  readRecord(record); // No return value.
}

function createReadFileCache(): Map<string, Record<Buffer>> {
  return new Map();
}

export function readFile(
  path: string,
  options:
    | string
    | {
        encoding?: string | null,
        // Unsupported:
        flag?: string, // Doesn't make sense except "r"
        signal?: mixed, // We'll have our own signal
      },
): string | Buffer {
  checkPathInDev(path);
  const map = unstable_getCacheForType(createReadFileCache);
  let record = map.get(path);
  if (!record) {
    const thenable = fs.readFile(path);
    record = createRecordFromThenable(thenable);
    map.set(path, record);
  }
  const resolvedRecord = readRecord(record);
  const buffer: Buffer = resolvedRecord.value;
  if (!options) {
    return buffer;
  }
  let encoding;
  if (typeof options === 'string') {
    encoding = options;
  } else {
    const flag = options.flag;
    if (flag != null && flag !== 'r') {
      throw Error(
        'The flag option is not supported, and always defaults to "r".',
      );
    }
    if (options.signal) {
      throw Error('The signal option is not supported.');
    }
    encoding = options.encoding;
  }
  if (typeof encoding !== 'string') {
    return buffer;
  }
  const textCache = resolvedRecord.cache || (resolvedRecord.cache = []);
  for (let i = 0; i < textCache.length; i += 2) {
    if (textCache[i] === encoding) {
      return (textCache[i + 1]: any);
    }
  }
  const text = buffer.toString((encoding: any));
  textCache.push(encoding, text);
  return text;
}
