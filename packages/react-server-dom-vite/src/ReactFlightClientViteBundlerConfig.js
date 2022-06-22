/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {BundlerConfig} from './ReactFlightServerViteBundlerConfig';
export type {BundlerConfig} from './ReactFlightServerViteBundlerConfig';
import {META_HOT, META_ENV_DEV} from './ViteImportMeta';

export opaque type ModuleMetaData = {
  id: string,
  name: string,
};

// eslint-disable-next-line no-unused-vars
export opaque type ModuleReference<T> = ModuleMetaData;

export function resolveModuleReference<T>(
  bundlerConfig: BundlerConfig,
  moduleData: ModuleMetaData,
): ModuleReference<T> {
  return moduleData;
}

// Vite import globs will be injected here.
const allClientComponents: any = {
  __INJECTED_CLIENT_IMPORTERS__: null,
};

// Mock client component imports during testing
declare var jest: {};
if (META_ENV_DEV && typeof jest !== 'undefined') {
  global.allClientComponents = allClientComponents;
}

function importClientComponent(moduleId: string): Promise<any> {
  const modImport = allClientComponents[moduleId];

  if (!modImport) {
    const error = new Error(`Could not find client component ${moduleId}`);

    if (META_HOT) {
      META_HOT.send('rsc:cc404', {id: moduleId});
      return new Promise((_, reject) => setTimeout(() => reject(error), 200));
    }

    return Promise.reject(error);
  }

  return typeof modImport === 'function'
    ? modImport()
    : Promise.resolve(modImport);
}

// The module cache contains all the modules we've preloaded so far.
// If they're still pending they're a thenable.
const moduleCache: Map<string, Object | Promise<Object> | Error> = new Map();

// Start preloading the modules since we might need them soon.
// This function doesn't suspend.
export function preloadModule<T>({id}: ModuleReference<T>): void {
  if (moduleCache.has(id)) return;

  function cacheResult(mod: any) {
    moduleCache.set(id, mod);
    return mod;
  }

  // Store the original promise first, then override cache with its result.
  const promise = importClientComponent(id);
  cacheResult(promise);
  promise.then(cacheResult, cacheResult);
}

// Actually require the module or suspend if it's not yet ready.
// Increase priority if necessary.
export function requireModule<T>({id, name}: ModuleReference<T>): T {
  const mod = moduleCache.get(id);

  if (!mod || mod instanceof Promise || mod instanceof Error) {
    // This module is still being downloaded or
    // it has errored out. Pass it to Suspense.
    throw mod;
  }

  return mod[name];
}
