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
import {prepareValue} from 'pg/lib/utils';
import invariant from 'shared/invariant';

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

type NestedMap = Map<any, Result | NestedMap>;

Pool.prototype.query = function(query: string, values?: Array<mixed>) {
  const pool = this.pool;
  const outerMap = unstable_getCacheForType(this.createResultMap);

  let innerMap: NestedMap = outerMap;
  let key = query;
  if (values != null) {
    // If we have parameters, each becomes as a nesting layer for Maps.
    // We want to find (or create as needed) the innermost Map, and return that.
    for (let i = 0; i < values.length; i++) {
      let nextMap = innerMap.get(key);
      if (nextMap === undefined) {
        nextMap = new Map();
        innerMap.set(key, nextMap);
      } else if (!(nextMap instanceof Map)) {
        invariant(
          false,
          'This query has received more parameters than the last time ' +
            'the same query was used. Always pass the exact number of ' +
            'parameters that the query needs.',
        );
      }
      innerMap = nextMap;
      // Postgres bindings convert everything to strings:
      // https://node-postgres.com/features/queries#parameterized-query
      // We reuse their algorithm instead of reimplementing.
      key = prepareValue(values[i]);
    }
  }

  let entry = innerMap.get(key);
  if (!entry) {
    const thenable = pool.query(query, values);
    entry = toResult(thenable);
    innerMap.set(key, entry);
  } else if (entry instanceof Map) {
    invariant(
      false,
      'This query has received fewer parameters than the last time ' +
        'the same query was used. Always pass the exact number of ' +
        'parameters that the query needs.',
    );
  }
  return readResult(entry);
};
