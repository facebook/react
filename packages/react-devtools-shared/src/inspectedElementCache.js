/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  unstable_getCacheForType,
  unstable_startTransition as startTransition,
} from 'react';
import Store from './devtools/store';
import {
  convertInspectedElementBackendToFrontend,
  inspectElement as inspectElementAPI,
} from './backendAPI';

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Wakeable} from 'shared/ReactTypes';
import type {
  InspectedElement as InspectedElementBackend,
  InspectedElementPayload,
} from 'react-devtools-shared/src/backend/types';
import type {
  Element,
  InspectedElement as InspectedElementFrontend,
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
  value: string,
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
  return unstable_getCacheForType(createMap);
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
  inspectedPaths: Object,
  forceUpdate: boolean,
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
      rejectedRecord.value = 'Inspected element not found.';
      return null;
    }

    inspectElementAPI({
      bridge,
      forceUpdate: true,
      id: element.id,
      inspectedPaths,
      rendererID: ((rendererID: any): number),
    }).then(
      (data: InspectedElementPayload) => {
        if (newRecord.status === Pending) {
          switch (data.type) {
            case 'no-change':
              // This response type should never be received.
              // We always send forceUpdate:true when we have a cache miss.
              break;

            case 'not-found':
              const notFoundRecord = ((newRecord: any): RejectedRecord);
              notFoundRecord.status = Rejected;
              notFoundRecord.value = 'Inspected element not found.';
              wake();
              break;

            case 'full-data':
              const resolvedRecord = ((newRecord: any): ResolvedRecord<InspectedElementFrontend>);
              resolvedRecord.status = Resolved;
              resolvedRecord.value = convertInspectedElementBackendToFrontend(
                ((data.value: any): InspectedElementBackend),
              );
              wake();
              break;
          }
        }
      },

      () => {
        // Timed out without receiving a response.
        if (newRecord.status === Pending) {
          const timedOutRecord = ((newRecord: any): RejectedRecord);
          timedOutRecord.status = Rejected;
          timedOutRecord.value = 'Inspected element timed out.';
          wake();
        }
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
  inspectedPaths,
  refresh,
  store,
}: {
  bridge: FrontendBridge,
  element: Element,
  inspectedPaths: Object,
  refresh: RefreshFunction,
  store: Store,
}): void {
  const {id} = element;
  const rendererID = store.getRendererIDForElement(id);
  if (rendererID != null) {
    inspectElementAPI({
      bridge,
      forceUpdate: false,
      id,
      inspectedPaths,
      rendererID,
    }).then((data: InspectedElementPayload) => {
      switch (data.type) {
        case 'full-data':
          const inspectedElement = convertInspectedElementBackendToFrontend(
            ((data.value: any): InspectedElementBackend),
          );
          startTransition(() => {
            const [key, value] = createCacheSeed(element, inspectedElement);
            refresh(key, value);
          });
          break;
      }
    });
  }
}
