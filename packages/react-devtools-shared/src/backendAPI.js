/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {hydrate, fillInPath} from 'react-devtools-shared/src/hydration';
import {separateDisplayNameAndHOCs} from 'react-devtools-shared/src/utils';
import Store from 'react-devtools-shared/src/devtools/store';
import TimeoutError from 'react-devtools-shared/src/TimeoutError';

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
} from 'react-devtools-shared/src/devtools/views/Components/types';

export function clearErrorsAndWarnings({
  bridge,
  store,
}: {|
  bridge: FrontendBridge,
  store: Store,
|}): void {
  store.rootIDToRendererID.forEach(rendererID => {
    bridge.send('clearErrorsAndWarnings', {rendererID});
  });
}

export function clearErrorsForElement({
  bridge,
  id,
  rendererID,
}: {|
  bridge: FrontendBridge,
  id: number,
  rendererID: number,
|}): void {
  bridge.send('clearErrorsForFiberID', {
    rendererID,
    id,
  });
}

export function clearWarningsForElement({
  bridge,
  id,
  rendererID,
}: {|
  bridge: FrontendBridge,
  id: number,
  rendererID: number,
|}): void {
  bridge.send('clearWarningsForFiberID', {
    rendererID,
    id,
  });
}

export function copyInspectedElementPath({
  bridge,
  id,
  path,
  rendererID,
}: {|
  bridge: FrontendBridge,
  id: number,
  path: Array<string | number>,
  rendererID: number,
|}): void {
  bridge.send('copyElementPath', {
    id,
    path,
    rendererID,
  });
}

export function inspectElement({
  bridge,
  forceFullData,
  id,
  path,
  rendererID,
}: {|
  bridge: FrontendBridge,
  forceFullData: boolean,
  id: number,
  path: Array<string | number> | null,
  rendererID: number,
|}): Promise<InspectedElementPayload> {
  const requestID = requestCounter++;
  const promise = getPromiseForRequestID<InspectedElementPayload>(
    requestID,
    'inspectedElement',
    bridge,
    `Timed out while inspecting element ${id}.`,
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
}: {|
  bridge: FrontendBridge,
  id: number,
  path: Array<string | number>,
  rendererID: number,
|}): void {
  bridge.send('storeAsGlobal', {
    count: storeAsGlobalCount++,
    id,
    path,
    rendererID,
  });
}

const TIMEOUT_DELAY = 5000;

let requestCounter = 0;

function getPromiseForRequestID<T>(
  requestID: number,
  eventType: $Keys<BackendEvents>,
  bridge: FrontendBridge,
  timeoutMessage: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      bridge.removeListener(eventType, onInspectedElement);

      clearTimeout(timeoutID);
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
    source,
    type,
    owners,
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
    source,
    type,
    owners:
      owners === null
        ? null
        : owners.map(owner => {
            const [displayName, hocDisplayNames] = separateDisplayNameAndHOCs(
              owner.displayName,
              owner.type,
            );
            return {
              ...owner,
              displayName,
              hocDisplayNames,
            };
          }),
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
  path?: Array<string | number>,
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
