/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {readCache} from './cache';

// TODO: clean up and move to react-data/fetch.

// TODO: some other data provider besides fetch.

// TODO: base agnostic helper like createResource. Maybe separate.

let sigil = {};

function readFetchMap() {
  const cache = readCache();
  if (!cache.has(sigil)) {
    cache.set(sigil, new Map());
  }
  return cache.get(sigil);
}

export function fetch(url) {
  const map = readFetchMap();
  let entry = map.get(url);
  if (entry === undefined) {
    entry = {
      status: 'pending',
      result: new Promise(resolve => {
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
          entry.result = JSON.parse(xhr.response);
          entry.status = 'resolved';
          resolve();
        };
        xhr.onerror = function(err) {
          entry.result = err;
          entry.status = 'rejected';
          resolve();
        };
        xhr.open('GET', url);
        xhr.send();
      }),
    };
    map.set(url, entry);
  }
  switch (entry.status) {
    case 'resolved':
      return entry.result;
    case 'pending':
    case 'rejected':
      throw entry.result;
    default:
      throw new Error();
  }
}
