/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Thenable,
  FulfilledThenable,
  RejectedThenable,
} from 'shared/ReactTypes';

export type SSRManifest = string; // Module root path

export type ServerManifest = string; // Module root path

export type ServerReferenceId =
  | [
      string, // module path
      string, // export name
    ]
  | string;

export opaque type ClientReferenceMetadata = [
  string, // module path
  string, // export name
];

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = {
  specifier: string,
  name: string,
};

export function resolveClientReference<T>(
  bundlerConfig: SSRManifest,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  return {
    specifier: metadata[0],
    name: metadata[1],
  };
}

export function resolveServerReference<T>(
  config: ServerManifest,
  id: ServerReferenceId,
): ClientReference<T> {
  if (typeof id === 'string') {
    const [specifier, name] = id.split(',');
    return {
      specifier,
      name,
    };
  }
  return {
    specifier: id[0],
    name: id[1],
  };
}

export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  const existingPromise = __vite_module_cache__.get(metadata.specifier);
  if (existingPromise) {
    if (existingPromise.status === 'fulfilled') {
      return null;
    }
    return existingPromise;
  } else {
    // $FlowFixMe[unsupported-syntax]
    const modulePromise: Thenable<T> = __vite_require__(metadata.specifier);
    modulePromise.then(
      value => {
        const fulfilledThenable: FulfilledThenable<mixed> =
          (modulePromise: any);
        fulfilledThenable.status = 'fulfilled';
        fulfilledThenable.value = value;
      },
      reason => {
        const rejectedThenable: RejectedThenable<mixed> = (modulePromise: any);
        rejectedThenable.status = 'rejected';
        rejectedThenable.reason = reason;
      },
    );
    __vite_module_cache__.set(metadata.specifier, modulePromise);
    return modulePromise;
  }
}

export function requireModule<T>(metadata: ClientReference<T>): T {
  let moduleExports;
  // We assume that preloadModule has been called before, which
  // should have added something to the module cache.
  const promise: any = __vite_module_cache__.get(metadata.specifier);
  if (promise.status === 'fulfilled') {
    moduleExports = promise.value;
  } else {
    throw promise.reason;
  }
  return moduleExports[metadata.name];
}
