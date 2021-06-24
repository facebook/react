/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {unstable_getCacheForType as getCacheForType} from 'react';
import {enableHookNameParsing} from 'react-devtools-feature-flags';

import type {HooksTree} from 'react-debug-tools/src/ReactDebugHooks';
import type {Thenable, Wakeable} from 'shared/ReactTypes';
import type {Element} from './devtools/views/Components/types';

const TIMEOUT = 3000;

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type PendingRecord = {|
  status: 0,
  value: Wakeable,
|};

type ResolvedRecord<T> = {|
  status: 1,
  value: T,
|};

type RejectedRecord = {|
  status: 2,
  value: null,
|};

type Record<T> = PendingRecord | ResolvedRecord<T> | RejectedRecord;

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

export type HookName = string | null;
export type HookNames = Array<HookName>;

type HookNamesMap = WeakMap<Element, Record<HookNames>>;

function createMap(): HookNamesMap {
  return new WeakMap();
}

function getRecordMap(): WeakMap<Element, Record<HookNames>> {
  return getCacheForType(createMap);
}

export function loadHookNames(
  element: Element,
  hooksTree: HooksTree,
  loadHookNamesFunction: (hookLog: HooksTree) => Thenable<HookNames>,
): HookNames | null {
  if (!enableHookNameParsing) {
    return null;
  }

  const map = getRecordMap();

  // TODO (named hooks) Make sure caching layer works and we aren't re-parsing ASTs.
  let record = map.get(element);
  if (!record) {
    const callbacks = new Set();
    const wakeable: Wakeable = {
      then(callback) {
        callbacks.add(callback);
      },
    };
    const wake = () => {
      // This assumes they won't throw.
      callbacks.forEach(callback => callback());
      callbacks.clear();
    };
    const newRecord: Record<HookNames> = (record = {
      status: Pending,
      value: wakeable,
    });

    let didTimeout = false;

    loadHookNamesFunction(hooksTree).then(
      function onSuccess(hookNames) {
        if (didTimeout) {
          return;
        }

        if (hookNames) {
          const resolvedRecord = ((newRecord: any): ResolvedRecord<HookNames>);
          resolvedRecord.status = Resolved;
          resolvedRecord.value = hookNames;
        } else {
          const notFoundRecord = ((newRecord: any): RejectedRecord);
          notFoundRecord.status = Rejected;
          notFoundRecord.value = null;
        }

        wake();
      },
      function onError(error) {
        const thrownRecord = ((newRecord: any): RejectedRecord);
        thrownRecord.status = Rejected;
        thrownRecord.value = null;

        wake();
      },
    );

    // Eventually timeout and stop trying to load names.
    setTimeout(() => {
      didTimeout = true;

      const timedoutRecord = ((newRecord: any): RejectedRecord);
      timedoutRecord.status = Rejected;
      timedoutRecord.value = null;

      wake();
    }, TIMEOUT);

    map.set(element, record);
  }

  const response = readRecord(record).value;
  return response;
}
