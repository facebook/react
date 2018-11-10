/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Allocates a new index for each request. Tries to stay as compact as possible so that these
// indices can be used to reference a tightly packaged array. As opposed to being used in a Map.
// The first allocated index is 1.

import invariant from 'shared/invariant';

export type ThreadID = number;

let nextAvailableThreadIDs = new Uint16Array(16);
for (let i = 0; i < 15; i++) {
  nextAvailableThreadIDs[i] = i + 1;
}
nextAvailableThreadIDs[15] = 0;

function growThreadCountAndReturnNextAvailable() {
  let oldArray = nextAvailableThreadIDs;
  let oldSize = oldArray.length;
  let newSize = oldSize * 2;
  invariant(
    newSize <= 0x10000,
    'Maximum number of concurrent React renderers exceeded. ' +
      'This can happen if you are not properly destroying the Readable provided by React. ' +
      'Ensure that you call .destroy() on it if you no longer want to read from it, ' +
      'and did not read to the end. If you use .pipe() this should be automatic.',
  );
  let newArray = new Uint16Array(newSize);
  newArray.set(oldArray);
  nextAvailableThreadIDs = newArray;
  nextAvailableThreadIDs[0] = oldSize + 1;
  for (let i = oldSize; i < newSize - 1; i++) {
    nextAvailableThreadIDs[i] = i + 1;
  }
  nextAvailableThreadIDs[newSize - 1] = 0;
  return oldSize;
}

export function allocThreadID(): ThreadID {
  let nextID = nextAvailableThreadIDs[0];
  if (nextID === 0) {
    return growThreadCountAndReturnNextAvailable();
  }
  nextAvailableThreadIDs[0] = nextAvailableThreadIDs[nextID];
  return nextID;
}

export function freeThreadID(id: ThreadID) {
  nextAvailableThreadIDs[id] = nextAvailableThreadIDs[0];
  nextAvailableThreadIDs[0] = id;
}
