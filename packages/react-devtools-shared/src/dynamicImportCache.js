/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {__DEBUG__} from 'react-devtools-shared/src/constants';

import type {Thenable, Wakeable} from 'shared/ReactTypes';

const TIMEOUT = 30000;

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type PendingRecord = {
  status: 0,
  value: Wakeable,
};

type ResolvedRecord<T> = {
  status: 1,
  value: T,
};

type RejectedRecord = {
  status: 2,
  value: null,
};

type Record<T> = PendingRecord | ResolvedRecord<T> | RejectedRecord;

type Module = any;
type ModuleLoaderFunction = () => Thenable<Module>;

// This is intentionally a module-level Map, rather than a React-managed one.
// Otherwise, refreshing the inspected element cache would also clear this cache.
// Modules are static anyway.
const moduleLoaderFunctionToModuleMap: Map<ModuleLoaderFunction, Module> =
  new Map();

function readRecord<T>(record: Record<T>): ResolvedRecord<T> | RejectedRecord {
  if (record.status === Resolved) {
    // This is just a type refinement.
    return record;
  } else if (record.status === Rejected) {
    // This is just a type refinement.
    return record;
  } else {
    throw record.value;
  }
}

// TODO Flow type
export function loadModule(moduleLoaderFunction: ModuleLoaderFunction): Module {
  let record = moduleLoaderFunctionToModuleMap.get(moduleLoaderFunction);

  if (__DEBUG__) {
    console.log(
      `[dynamicImportCache] loadModule("${moduleLoaderFunction.name}")`,
    );
  }

  if (!record) {
    const callbacks = new Set<() => mixed>();
    const wakeable: Wakeable = {
      then(callback: () => mixed) {
        callbacks.add(callback);
      },

      // Optional property used by Timeline:
      displayName: `Loading module "${moduleLoaderFunction.name}"`,
    };

    const wake = () => {
      if (timeoutID) {
        clearTimeout(timeoutID);
        timeoutID = null;
      }

      // This assumes they won't throw.
      callbacks.forEach(callback => callback());
      callbacks.clear();
    };

    const newRecord: Record<Module> = (record = {
      status: Pending,
      value: wakeable,
    });

    let didTimeout = false;

    moduleLoaderFunction().then(
      module => {
        if (__DEBUG__) {
          console.log(
            `[dynamicImportCache] loadModule("${moduleLoaderFunction.name}") then()`,
          );
        }

        if (didTimeout) {
          return;
        }

        const resolvedRecord = ((newRecord: any): ResolvedRecord<Module>);
        resolvedRecord.status = Resolved;
        resolvedRecord.value = module;

        wake();
      },
      error => {
        if (__DEBUG__) {
          console.log(
            `[dynamicImportCache] loadModule("${moduleLoaderFunction.name}") catch()`,
          );
        }

        if (didTimeout) {
          return;
        }

        console.log(error);

        const thrownRecord = ((newRecord: any): RejectedRecord);
        thrownRecord.status = Rejected;
        thrownRecord.value = null;

        wake();
      },
    );

    // Eventually timeout and stop trying to load the module.
    let timeoutID: null | TimeoutID = setTimeout(function onTimeout() {
      if (__DEBUG__) {
        console.log(
          `[dynamicImportCache] loadModule("${moduleLoaderFunction.name}") onTimeout()`,
        );
      }

      timeoutID = null;

      didTimeout = true;

      const timedoutRecord = ((newRecord: any): RejectedRecord);
      timedoutRecord.status = Rejected;
      timedoutRecord.value = null;

      wake();
    }, TIMEOUT);

    moduleLoaderFunctionToModuleMap.set(moduleLoaderFunction, record);
  }

  // $FlowFixMe[underconstrained-implicit-instantiation]
  const response = readRecord(record).value;
  return response;
}
