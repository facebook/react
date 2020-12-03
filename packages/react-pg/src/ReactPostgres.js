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
import {Pool as PostgresPool} from 'pg';

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

export function Pool(options: mixed) {
  this.pool = new PostgresPool(options);
  // Unique function per instance because it's used for cache identity.
  this.createResultMap = function() {
    return new Map();
  };
}

Pool.prototype.query = function(query: string, values?: Array<mixed>) {
  const pool = this.pool;
  const map = unstable_getCacheForType(this.createResultMap);
  // TODO: Is this sufficient? What about more complex types?
  const key = JSON.stringify({query, values});
  let entry = map.get(key);
  if (!entry) {
    const thenable = pool.query(query, values);
    entry = toResult(thenable);
    map.set(key, entry);
  }
  return readResult(entry);
};
