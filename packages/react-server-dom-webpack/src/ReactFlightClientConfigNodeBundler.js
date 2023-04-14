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

export type SSRManifest = {
  [clientId: string]: {
    [clientExportName: string]: ClientReference<any>,
  },
};

export type ServerManifest = void;

export type ServerReferenceId = string;

export opaque type ClientReferenceMetadata = {
  id: string,
  chunks: Array<string>,
  name: string,
};

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = {
  specifier: string,
  name: string,
};

export function resolveClientReference<T>(
  bundlerConfig: SSRManifest,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  const resolvedModuleData = bundlerConfig[metadata.id][metadata.name];
  return resolvedModuleData;
}

export function resolveServerReference<T>(
  bundlerConfig: ServerManifest,
  id: ServerReferenceId,
): ClientReference<T> {
  const idx = id.lastIndexOf('#');
  const specifier = id.substr(0, idx);
  const name = id.substr(idx + 1);
  return {specifier, name};
}

const asyncModuleCache: Map<string, Thenable<any>> = new Map();

export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  const existingPromise = asyncModuleCache.get(metadata.specifier);
  if (existingPromise) {
    if (existingPromise.status === 'fulfilled') {
      return null;
    }
    return existingPromise;
  } else {
    // $FlowFixMe[unsupported-syntax]
    const modulePromise: Thenable<T> = import(metadata.specifier);
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
    asyncModuleCache.set(metadata.specifier, modulePromise);
    return modulePromise;
  }
}

export function requireModule<T>(metadata: ClientReference<T>): T {
  let moduleExports;
  // We assume that preloadModule has been called before, which
  // should have added something to the module cache.
  const promise: any = asyncModuleCache.get(metadata.specifier);
  if (promise.status === 'fulfilled') {
    moduleExports = promise.value;
  } else {
    throw promise.reason;
  }
  if (metadata.name === '*') {
    // This is a placeholder value that represents that the caller imported this
    // as a CommonJS module as is.
    return moduleExports;
  }
  if (metadata.name === '') {
    // This is a placeholder value that represents that the caller accessed the
    // default property of this if it was an ESM interop module.
    return moduleExports.default;
  }
  return moduleExports[metadata.name];
}
