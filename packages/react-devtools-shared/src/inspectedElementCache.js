/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
import Store from 'react-devtools-shared/src/devtools/store';
import {inspectElement as inspectElementMutableSource} from 'react-devtools-shared/src/inspectedElementMutableSource';
import ElementPollingCancellationError from 'react-devtools-shared/src//errors/ElementPollingCancellationError';

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Wakeable} from 'shared/ReactTypes';
import type {
  Element,
  InspectedElement as InspectedElementFrontend,
  InspectedElementResponseType,
  InspectedElementPath,
} from 'react-devtools-shared/src/frontend/types';

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
  value: Error | string,
};

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
  path: InspectedElementPath | null,
  store: Store,
  bridge: FrontendBridge,
): InspectedElementFrontend | null {
  const map = getRecordMap();
  let record = map.get(element);
  if (!record) {
    const callbacks = new Set<() => mixed>();
    const wakeable: Wakeable = {
      then(callback: () => mixed) {
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

    inspectElementMutableSource(bridge, element, path, rendererID).then(
      ([inspectedElement]: [
        InspectedElementFrontend,
        InspectedElementResponseType,
      ]) => {
        const resolvedRecord =
          ((newRecord: any): ResolvedRecord<InspectedElementFrontend>);
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
}): void | Promise<void> {
  const {id} = element;
  const rendererID = store.getRendererIDForElement(id);

  if (rendererID == null) {
    return;
  }

  return inspectElementMutableSource(
    bridge,
    element,
    null,
    rendererID,
    true,
  ).then(
    ([inspectedElement, responseType]: [
      InspectedElementFrontend,
      InspectedElementResponseType,
    ]) => {
      if (responseType === 'full-data') {
        startTransition(() => {
          const [key, value] = createCacheSeed(element, inspectedElement);
          refresh(key, value);
        });
      }
    },
  );
}

function createPromiseWhichResolvesInOneSecond() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

type PollingStatus = 'idle' | 'running' | 'paused' | 'aborted';

export function startElementUpdatesPolling({
  bridge,
  element,
  refresh,
  store,
}: {
  bridge: FrontendBridge,
  element: Element,
  refresh: RefreshFunction,
  store: Store,
}): {abort: () => void, pause: () => void, resume: () => void} {
  let status: PollingStatus = 'idle';

  function abort() {
    status = 'aborted';
  }

  function resume() {
    if (status === 'running' || status === 'aborted') {
      return;
    }

    status = 'idle';
    poll();
  }

  function pause() {
    if (status === 'paused' || status === 'aborted') {
      return;
    }

    status = 'paused';
  }

  function poll(): Promise<void> {
    status = 'running';

    return Promise.allSettled([
      checkForUpdate({bridge, element, refresh, store}),
      createPromiseWhichResolvesInOneSecond(),
    ])
      .then(([{status: updateStatus, reason}]) => {
        // There isn't much to do about errors in this case,
        // but we should at least log them, so they aren't silent.
        // Log only if polling is still active, we can't handle the case when
        // request was sent, and then bridge was remounted (for example, when user did navigate to a new page),
        // but at least we can mark that polling was aborted
        if (updateStatus === 'rejected' && status !== 'aborted') {
          // This is expected Promise rejection, no need to log it
          if (reason instanceof ElementPollingCancellationError) {
            return;
          }

          console.error(reason);
        }
      })
      .finally(() => {
        const shouldContinuePolling =
          status !== 'aborted' && status !== 'paused';

        status = 'idle';

        if (shouldContinuePolling) {
          return poll();
        }
      });
  }

  poll();

  return {abort, resume, pause};
}

export function clearCacheBecauseOfError(refresh: RefreshFunction): void {
  startTransition(() => {
    const map = createMap();
    refresh(createMap, map);
  });
}
