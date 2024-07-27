/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {hydrate, fillInPath} from 'react-devtools-shared/src/hydration';
import {backendToFrontendSerializedElementMapper} from 'react-devtools-shared/src/utils';
import Store from 'react-devtools-shared/src/devtools/store';
import TimeoutError from 'react-devtools-shared/src/errors/TimeoutError';
import ElementPollingCancellationError from 'react-devtools-shared/src/errors/ElementPollingCancellationError';

import type {
  InspectedElement as InspectedElementBackend,
  InspectedElementPayload,
} from 'react-devtools-shared/src/backend/types';
import type {
  BackendEvents,
  FrontendBridge,
} from 'react-devtools-shared/src/bridge';
import type {
  DehydratedData,
  InspectedElement as InspectedElementFrontend,
} from 'react-devtools-shared/src/frontend/types';
import type {InspectedElementPath} from 'react-devtools-shared/src/frontend/types';

export function clearErrorsAndWarnings({
  bridge,
  store,
}: {
  bridge: FrontendBridge,
  store: Store,
}): void {
  store.rootIDToRendererID.forEach(rendererID => {
    bridge.send('clearErrorsAndWarnings', {rendererID});
  });
}

export function clearErrorsForElement({
  bridge,
  id,
  rendererID,
}: {
  bridge: FrontendBridge,
  id: number,
  rendererID: number,
}): void {
  bridge.send('clearErrorsForElementID', {
    rendererID,
    id,
  });
}

export function clearWarningsForElement({
  bridge,
  id,
  rendererID,
}: {
  bridge: FrontendBridge,
  id: number,
  rendererID: number,
}): void {
  bridge.send('clearWarningsForElementID', {
    rendererID,
    id,
  });
}

export function copyInspectedElementPath({
  bridge,
  id,
  path,
  rendererID,
}: {
  bridge: FrontendBridge,
  id: number,
  path: Array<string | number>,
  rendererID: number,
}): void {
  bridge.send('copyElementPath', {
    id,
    path,
    rendererID,
  });
}

export function inspectElement(
  bridge: FrontendBridge,
  forceFullData: boolean,
  id: number,
  path: InspectedElementPath | null,
  rendererID: number,
  shouldListenToPauseEvents: boolean = false,
): Promise<InspectedElementPayload> {
  const requestID = requestCounter++;
  const promise = getPromiseForRequestID<InspectedElementPayload>(
    requestID,
    'inspectedElement',
    bridge,
    `Timed out while inspecting element ${id}.`,
    shouldListenToPauseEvents,
  );

  bridge.send('inspectElement', {
    forceFullData,
    id,
    path,
    rendererID,
    requestID,
  });

  return promise;
}

let storeAsGlobalCount = 0;

export function storeAsGlobal({
  bridge,
  id,
  path,
  rendererID,
}: {
  bridge: FrontendBridge,
  id: number,
  path: Array<string | number>,
  rendererID: number,
}): void {
  bridge.send('storeAsGlobal', {
    count: storeAsGlobalCount++,
    id,
    path,
    rendererID,
  });
}

const TIMEOUT_DELAY = 10_000;

let requestCounter = 0;

function getPromiseForRequestID<T>(
  requestID: number,
  eventType: $Keys<BackendEvents>,
  bridge: FrontendBridge,
  timeoutMessage: string,
  shouldListenToPauseEvents: boolean = false,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      bridge.removeListener(eventType, onInspectedElement);
      bridge.removeListener('shutdown', onShutdown);

      if (shouldListenToPauseEvents) {
        bridge.removeListener('pauseElementPolling', onDisconnect);
      }

      clearTimeout(timeoutID);
    };

    const onShutdown = () => {
      cleanup();
      reject(
        new Error(
          'Failed to inspect element. Try again or restart React DevTools.',
        ),
      );
    };

    const onDisconnect = () => {
      cleanup();
      reject(new ElementPollingCancellationError());
    };

    const onInspectedElement = (data: any) => {
      if (data.responseID === requestID) {
        cleanup();
        resolve((data: T));
      }
    };

    const onTimeout = () => {
      cleanup();
      reject(new TimeoutError(timeoutMessage));
    };

    bridge.addListener(eventType, onInspectedElement);
    bridge.addListener('shutdown', onShutdown);

    if (shouldListenToPauseEvents) {
      bridge.addListener('pauseElementPolling', onDisconnect);
    }

    const timeoutID = setTimeout(onTimeout, TIMEOUT_DELAY);
  });
}

export function cloneInspectedElementWithPath(
  inspectedElement: InspectedElementFrontend,
  path: Array<string | number>,
  value: Object,
): InspectedElementFrontend {
  const hydratedValue = hydrateHelper(value, path);
  const clonedInspectedElement = {...inspectedElement};

  fillInPath(clonedInspectedElement, value, path, hydratedValue);

  return clonedInspectedElement;
}

export function convertInspectedElementBackendToFrontend(
  inspectedElementBackend: InspectedElementBackend,
): InspectedElementFrontend {
  const {
    canEditFunctionProps,
    canEditFunctionPropsDeletePaths,
    canEditFunctionPropsRenamePaths,
    canEditHooks,
    canEditHooksAndDeletePaths,
    canEditHooksAndRenamePaths,
    canToggleError,
    isErrored,
    targetErrorBoundaryID,
    canToggleSuspense,
    canViewSource,
    hasLegacyContext,
    id,
    type,
    owners,
    source,
    context,
    hooks,
    plugins,
    props,
    rendererPackageName,
    rendererVersion,
    rootType,
    state,
    key,
    errors,
    warnings,
  } = inspectedElementBackend;

  const inspectedElement: InspectedElementFrontend = {
    canEditFunctionProps,
    canEditFunctionPropsDeletePaths,
    canEditFunctionPropsRenamePaths,
    canEditHooks,
    canEditHooksAndDeletePaths,
    canEditHooksAndRenamePaths,
    canToggleError,
    isErrored,
    targetErrorBoundaryID,
    canToggleSuspense,
    canViewSource,
    hasLegacyContext,
    id,
    key,
    plugins,
    rendererPackageName,
    rendererVersion,
    rootType,
    // Previous backend implementations (<= 5.0.1) have a different interface for Source, with fileName.
    // This gates the source features for only compatible backends: >= 5.0.2
    source: source && source.sourceURL ? source : null,
    type,
    owners:
      owners === null
        ? null
        : owners.map(backendToFrontendSerializedElementMapper),
    context: hydrateHelper(context),
    hooks: hydrateHelper(hooks),
    props: hydrateHelper(props),
    state: hydrateHelper(state),
    errors,
    warnings,
  };

  return inspectedElement;
}

export function hydrateHelper(
  dehydratedData: DehydratedData | null,
  path: ?InspectedElementPath,
): Object | null {
  if (dehydratedData !== null) {
    const {cleaned, data, unserializable} = dehydratedData;

    if (path) {
      const {length} = path;
      if (length > 0) {
        // Hydration helper requires full paths, but inspection dehydrates with relative paths.
        // In that event it's important that we adjust the "cleaned" paths to match.
        return hydrate(
          data,
          cleaned.map(cleanedPath => cleanedPath.slice(length)),
          unserializable.map(unserializablePath =>
            unserializablePath.slice(length),
          ),
        );
      }
    }

    return hydrate(data, cleaned, unserializable);
  } else {
    return null;
  }
}
