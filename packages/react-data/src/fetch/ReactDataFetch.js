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

// TODO: options, auth, etc.
export function fetch(url: string): Object {
  const map = readResultMap();
  const entry = map.get(url);
  if (entry === undefined) {
    let resolve = () => {};
    const wakeable: Wakeable = new Promise(r => {
      // TODO: should this be a plain thenable instead?
      resolve = r;
    });
    const result: Result = {
      status: Pending,
      value: wakeable,
    };
    map.set(url, result);
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      // TODO: should we handle status codes?
      if (result.status !== Pending) {
        return;
      }
      const resolvedResult = ((result: any): ResolvedResult);
      resolvedResult.status = Resolved;
      resolvedResult.value = xhr.response;
      resolve();
    };
    xhr.onerror = function() {
      if (result.status !== Pending) {
        return;
      }
      const rejectedResult = ((result: any): RejectedResult);
      rejectedResult.status = Rejected;
      // TODO: use something else as the error value?
      rejectedResult.value = xhr;
      resolve();
    };
    xhr.open('GET', url);
    xhr.send();
    throw wakeable;
  }
  const result: Result = entry;
  if (result.status === Resolved) {
    return result.value;
  } else {
    throw result.value;
  }
}
