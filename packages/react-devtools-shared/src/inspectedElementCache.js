/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  unstable_getCacheForType as getCacheForType,
  startTransition,
} from 'react';
import Store from './devtools/store';
import {inspectElement as inspectElementMutableSource} from './inspectedElementMutableSource';

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Wakeable} from 'shared/ReactTypes';
import type {
  Element,
  InspectedElement as InspectedElementFrontend,
  InspectedElementResponseType,
} from 'react-devtools-shared/src/devtools/views/Components/types';

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
  value: Error | string,
|};

type Record<T> = PendingRecord | ResolvedRecord<T> | RejectedRecord;

function readRecord<T>(record: Record<T>): ResolvedRecord<T> {
  if (record.status === Resolved) {
    // This is just a type refinement.
    return record;
  } else {
    throw record.value;
  }
}

type InspectedElementMap = WeakMap<Element, Record<InspectedElementFrontend>>;
type CacheSeedKey = () => InspectedElementMap;

function createMap(): InspectedElementMap {
  return new WeakMap();
}

function getRecordMap(): WeakMap<Element, Record<InspectedElementFrontend>> {
  return getCacheForType(createMap);
}

function createCacheSeed(
  element: Element,
  inspectedElement: InspectedElementFrontend,
): [CacheSeedKey, InspectedElementMap] {
  const newRecord: Record<InspectedElementFrontend> = {
    status: Resolved,
    value: inspectedElement,
  };
  const map = createMap();
  map.set(element, newRecord);
  return [createMap, map];
}

/**
 * Fetches element props and state from the backend for inspection.
 * This method should be called during render; it will suspend if data has not yet been fetched.
 */
export function inspectElement(
  element: Element,
  path: Array<string | number> | null,
  store: Store,
  bridge: FrontendBridge,
): InspectedElementFrontend | null {
  const map = getRecordMap();
  let record = map.get(element);
  if (!record) {
    const callbacks = new Set();
    const wakeable: Wakeable = {
      then(callback) {
        callbacks.add(callback);
      },

      // Optional property used by Timeline:
      displayName: `Inspecting ${element.displayName || 'Unknown'}`,
    };

    const wake = () => {
      // This assumes they won't throw.
      callbacks.forEach(callback => callback());
      callbacks.clear();
    };
    const newRecord: Record<InspectedElementFrontend> = (record = {
      status: Pending,
      value: wakeable,
    });

    const rendererID = store.getRendererIDForElement(element.id);
    if (rendererID == null) {
      const rejectedRecord = ((newRecord: any): RejectedRecord);
      rejectedRecord.status = Rejected;
      rejectedRecord.value = new Error(
        `Could not inspect element with id "${element.id}". No renderer found.`,
      );

      map.set(element, record);

      return null;
    }

    inspectElementMutableSource({
      bridge,
      element,
      path,
      rendererID: ((rendererID: any): number),
    }).then(
      ([inspectedElement: InspectedElementFrontend]) => {
        const resolvedRecord = ((newRecord: any): ResolvedRecord<InspectedElementFrontend>);
        resolvedRecord.status = Resolved;
        resolvedRecord.value = inspectedElement;

        wake();
      },

      error => {
        console.error(error);

        const rejectedRecord = ((newRecord: any): RejectedRecord);
        rejectedRecord.status = Rejected;
        rejectedRecord.value = error;

        wake();
      },
    );
    map.set(element, record);
  }

  const response = readRecord(record).value;
  return response;
}

type RefreshFunction = (
  seedKey: CacheSeedKey,
  cacheMap: InspectedElementMap,
) => void;

/**
 * Asks the backend for updated props and state from an expected element.
 * This method should never be called during render; call it from an effect or event handler.
 * This method will schedule an update if updated information is returned.
 */
export function checkForUpdate({
  bridge,
  element,
  refresh,
  store,
}: {
  bridge: FrontendBridge,
  element: Element,
  refresh: RefreshFunction,
  store: Store,
}): void {
  const {id} = element;
  const rendererID = store.getRendererIDForElement(id);
  if (rendererID != null) {
    inspectElementMutableSource({
      bridge,
      element,
      path: null,
      rendererID: ((rendererID: any): number),
    }).then(
      ([
        inspectedElement: InspectedElementFrontend,
        responseType: InspectedElementResponseType,
      ]) => {
        if (responseType === 'full-data') {
          startTransition(() => {
            const [key, value] = createCacheSeed(element, inspectedElement);
            refresh(key, value);
          });
        }
      },

      // There isn't much to do about errors in this case,
      // but we should at least log them so they aren't silent.
      error => {
        console.error(error);
      },
    );
  }
}

export function clearCacheBecauseOfError(refresh: RefreshFunction): void {
  startTransition(() => {
    const map = createMap();
    refresh(createMap, map);
  });
}
