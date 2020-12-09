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

type PendingResult = {|
  status: 0,
  value: Wakeable,
  cache: Array<mixed>,
|};

type ResolvedResult<T> = {|
  status: 1,
  value: T,
  cache: Array<mixed>,
|};

type RejectedResult = {|
  status: 2,
  value: mixed,
  cache: Array<mixed>,
|};

type Result<T> = PendingResult | ResolvedResult<T> | RejectedResult;

function toResult<T>(thenable: Thenable<T>): Result<T> {
  const result: Result<T> = {
    status: Pending,
    value: thenable,
    cache: [],
  };
  thenable.then(
    value => {
      if (result.status === Pending) {
        const resolvedResult = ((result: any): ResolvedResult<T>);
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

function readResult<T>(result: Result<T>): T {
  if (result.status === Resolved) {
    return result.value;
  } else {
    throw result.value;
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

function createReadFileCache(): Map<string, Result<Buffer>> {
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
  const map = unstable_getCacheForType(createReadFileCache);
  checkPathInDev(path);
  let entry = map.get(path);
  if (!entry) {
    const thenable = fs.readFile(path);
    entry = toResult(thenable);
    map.set(path, entry);
  }
  const result: Buffer = readResult(entry);
  if (!options) {
    return result;
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
    return result;
  }
  const textCache = entry.cache;
  for (let i = 0; i < textCache.length; i += 2) {
    if (textCache[i] === encoding) {
      return (textCache[i + 1]: any);
    }
  }
  const text = result.toString((encoding: any));
  textCache.push(encoding, text);
  return text;
}
