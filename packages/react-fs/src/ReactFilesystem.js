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

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type PendingResult = {|
  status: 0,
  value: Wakeable,
|};

type ResolvedResult<T> = {|
  status: 1,
  value: T,
|};

type RejectedResult = {|
  status: 2,
  value: mixed,
|};

type Result<T> = PendingResult | ResolvedResult<T> | RejectedResult;

function toResult<T>(thenable: Thenable<T>): Result<T> {
  const result: Result<T> = {
    status: Pending,
    value: thenable,
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

function createReadFileCache(): Map<string, Result<Buffer>> {
  return new Map();
}

export function readFile(
  path: string,
  options:
    | string
    | {
        encoding?: string | null,
        // Ignored:
        flag?: string,
        signal?: mixed,
      },
): string | Buffer {
  const map = unstable_getCacheForType(createReadFileCache);
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
  const encoding = typeof options === 'string' ? options : options.encoding;
  if (typeof encoding !== 'string') {
    return result;
  }
  const textCache =
    (result: any)._reactTextCache || ((result: any)._reactTextCache = []);
  for (let i = 0; i < textCache.length; i += 2) {
    if (textCache[i] === encoding) {
      return textCache[i + 1];
    }
  }
  const text = result.toString((encoding: any));
  textCache.push(encoding, text);
  return text;
}
