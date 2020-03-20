/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type ModuleMetaData = {
  id: string,
  chunks: Array<string>,
  name: string,
};

// eslint-disable-next-line no-unused-vars
export type ModuleReference<T> = ModuleMetaData;

export function resolveModuleReference<T>(
  moduleData: ModuleMetaData,
): ModuleReference<T> {
  return moduleData;
}

type Thenable = {
  then(resolve: () => mixed, reject: (mixed) => mixed): mixed,
  ...
};

// The chunk cache contains all the chunks we've preloaded so far.
// If they're still pending they're a thenable. This map also exists
// in Webpack but unfortunately it's not exposed so we have to
// replicate it in user space. null means that it has already loaded.
const chunkCache: Map<string, null | Thenable> = new Map();

// Returning null means that all dependencies are fulfilled and we
// can synchronously require the module now. A thenable is returned
// that when resolved, means we can try again.
export function preloadModule<T>(moduleData: ModuleReference<T>): void {
  loadModule(moduleData);
}

export function loadModule<T>(moduleData: ModuleReference<T>): null | Thenable {
  let chunks = moduleData.chunks;
  let anyRemainingThenable = null;
  for (let i = 0; i < chunks.length; i++) {
    let chunkId = chunks[i];
    let entry = chunkCache.get(chunkId);
    if (entry === undefined) {
      anyRemainingThenable = __webpack_chunk_load__(chunkId);
      chunkCache.set(chunkId, anyRemainingThenable);
      anyRemainingThenable.then(chunkCache.set.bind(chunkCache, chunkId, null));
    } else if (entry !== null) {
      anyRemainingThenable = entry;
    }
  }
  return anyRemainingThenable;
}

export function requireModule<T>(moduleData: ModuleReference<T>): T {
  return __webpack_require__(moduleData.id)[moduleData.name];
}
