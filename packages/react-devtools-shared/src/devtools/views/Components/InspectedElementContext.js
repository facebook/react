/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  createContext,
  unstable_getCacheForType as getCacheForType,
  unstable_startTransition as startTransition,
  unstable_useCacheRefresh as useCacheRefresh,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {BridgeContext, StoreContext} from '../context';
import {hydrate, fillInPath} from 'react-devtools-shared/src/hydration';
import {TreeStateContext} from './TreeContext';
import {separateDisplayNameAndHOCs} from 'react-devtools-shared/src/utils';

import type {
  InspectedElement as InspectedElementBackend,
  InspectedElementPayload,
} from 'react-devtools-shared/src/backend/types';
import type {
  DehydratedData,
  Element,
  InspectedElement as InspectedElementFrontend,
} from 'react-devtools-shared/src/devtools/views/Components/types';

export type StoreAsGlobal = (id: number, path: Array<string | number>) => void;

export type CopyInspectedElementPath = (
  id: number,
  path: Array<string | number>,
) => void;

export type GetInspectedElementPath = (
  id: number,
  path: Array<string | number>,
) => void;

export type GetInspectedElement = (
  id: number,
) => InspectedElementFrontend | null;

type ClearErrorsForInspectedElement = () => void;
type ClearWarningsForInspectedElement = () => void;

export type InspectedElementContextType = {|
  clearErrorsForInspectedElement: ClearErrorsForInspectedElement,
  clearWarningsForInspectedElement: ClearWarningsForInspectedElement,
  copyInspectedElementPath: CopyInspectedElementPath,
  getInspectedElementPath: GetInspectedElementPath,
  getInspectedElement: GetInspectedElement,
  storeAsGlobal: StoreAsGlobal,
|};

const InspectedElementContext = createContext<InspectedElementContextType>(
  ((null: any): InspectedElementContextType),
);
InspectedElementContext.displayName = 'InspectedElementContext';

type ResolveFn = (inspectedElement: InspectedElementFrontend) => void;
type Callback = (inspectedElement: InspectedElementFrontend) => void;
type Thenable = {|
  callbacks: Set<Callback>,
  then: (callback: Callback) => void,
  resolve: ResolveFn,
|};

const inspectedElementThenables: WeakMap<Element, Thenable> = new WeakMap();

type InspectedElementCache = WeakMap<Element, InspectedElementFrontend>;

function createInspectedElementCache(): InspectedElementCache {
  return new WeakMap();
}

function getInspectedElementCache(): InspectedElementCache {
  return getCacheForType(createInspectedElementCache);
}

function setInspectedElement(
  element: Element,
  inspectedElement: InspectedElementFrontend,
  inspectedElementCache: InspectedElementCache,
): void {
  // TODO (cache) This mutation seems sketchy.
  // Probably need to refresh the cache with a new seed.
  inspectedElementCache.set(element, inspectedElement);

  const maybeThenable = inspectedElementThenables.get(element);
  if (maybeThenable != null) {
    inspectedElementThenables.delete(element);

    maybeThenable.resolve(inspectedElement);
  }
}

function getInspectedElement(element: Element): InspectedElementFrontend {
  const inspectedElementCache = getInspectedElementCache();
  const maybeInspectedElement = inspectedElementCache.get(element);
  if (maybeInspectedElement !== undefined) {
    return maybeInspectedElement;
  }

  const maybeThenable = inspectedElementThenables.get(element);
  if (maybeThenable != null) {
    throw maybeThenable;
  }

  const thenable: Thenable = {
    callbacks: new Set(),
    then: callback => {
      thenable.callbacks.add(callback);
    },
    resolve: inspectedElement => {
      thenable.callbacks.forEach(callback => callback(inspectedElement));
    },
  };

  inspectedElementThenables.set(element, thenable);

  throw thenable;
}

type Props = {|
  children: React$Node,
|};

function InspectedElementContextController({children}: Props) {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const storeAsGlobalCount = useRef(1);

  // Ask the backend to store the value at the specified path as a global variable.
  const storeAsGlobal = useCallback<GetInspectedElementPath>(
    (id: number, path: Array<string | number>) => {
      const rendererID = store.getRendererIDForElement(id);
      if (rendererID !== null) {
        bridge.send('storeAsGlobal', {
          count: storeAsGlobalCount.current++,
          id,
          path,
          rendererID,
        });
      }
    },
    [bridge, store],
  );

  // Ask the backend to copy the specified path to the clipboard.
  const copyInspectedElementPath = useCallback<GetInspectedElementPath>(
    (id: number, path: Array<string | number>) => {
      const rendererID = store.getRendererIDForElement(id);
      if (rendererID !== null) {
        bridge.send('copyElementPath', {id, path, rendererID});
      }
    },
    [bridge, store],
  );

  // Ask the backend to fill in a "dehydrated" path; this will result in a "inspectedElement".
  const getInspectedElementPath = useCallback<GetInspectedElementPath>(
    (id: number, path: Array<string | number>) => {
      const rendererID = store.getRendererIDForElement(id);
      if (rendererID !== null) {
        bridge.send('inspectElement', {id, path, rendererID});
      }
    },
    [bridge, store],
  );

  const getInspectedElementWrapper = useCallback<GetInspectedElement>(
    (id: number) => {
      const element = store.getElementByID(id);
      if (element !== null) {
        return getInspectedElement(element);
      }
      return null;
    },
    [store],
  );

  // It's very important that this context consumes selectedElementID and not inspectedElementID.
  // Otherwise the effect that sends the "inspect" message across the bridge-
  // would itself be blocked by the same render that suspends (waiting for the data).
  const {selectedElementID} = useContext(TreeStateContext);

  const refresh = useCacheRefresh();

  const clearErrorsForInspectedElement = useCallback<ClearErrorsForInspectedElement>(() => {
    if (selectedElementID !== null) {
      const rendererID = store.getRendererIDForElement(selectedElementID);
      if (rendererID !== null) {
        bridge.send('inspectElement', {id: selectedElementID, rendererID});

        startTransition(() => {
          store.clearErrorsForElement(selectedElementID);
          refresh();
        });
      }
    }
  }, [bridge, selectedElementID]);

  const clearWarningsForInspectedElement = useCallback<ClearWarningsForInspectedElement>(() => {
    if (selectedElementID !== null) {
      const rendererID = store.getRendererIDForElement(selectedElementID);
      if (rendererID !== null) {
        bridge.send('inspectElement', {id: selectedElementID, rendererID});

        startTransition(() => {
          store.clearWarningsForElement(selectedElementID);
          refresh();
        });
      }
    }
  }, [bridge, selectedElementID]);

  const [
    currentlyInspectedElement,
    setCurrentlyInspectedElement,
  ] = useState<InspectedElementFrontend | null>(null);

  const inspectedElementCache = getInspectedElementCache();

  // This effect handler invalidates the suspense cache and schedules rendering updates with React.
  useEffect(() => {
    const onInspectedElement = (data: InspectedElementPayload) => {
      const {id} = data;

      let element;

      switch (data.type) {
        case 'no-change':
        case 'not-found':
          // No-op
          break;
        case 'hydrated-path':
          // Merge new data into previous object and invalidate cache
          element = store.getElementByID(id);
          if (element !== null) {
            if (currentlyInspectedElement != null) {
              const value = hydrateHelper(data.value, data.path);
              const inspectedElement = {...currentlyInspectedElement};

              fillInPath(inspectedElement, data.value, data.path, value);

              setInspectedElement(
                element,
                inspectedElement,
                inspectedElementCache,
              );

              // Schedule update with React if the currently-selected element has been invalidated.
              if (id === selectedElementID) {
                setCurrentlyInspectedElement(inspectedElement);
              }
            }
          }
          break;
        case 'full-data':
          const {
            canEditFunctionProps,
            canEditFunctionPropsDeletePaths,
            canEditFunctionPropsRenamePaths,
            canEditHooks,
            canEditHooksAndDeletePaths,
            canEditHooksAndRenamePaths,
            canToggleSuspense,
            canViewSource,
            hasLegacyContext,
            source,
            type,
            owners,
            context,
            hooks,
            props,
            rendererPackageName,
            rendererVersion,
            rootType,
            state,
            key,
            errors,
            warnings,
          } = ((data.value: any): InspectedElementBackend);

          const inspectedElement: InspectedElementFrontend = {
            canEditFunctionProps,
            canEditFunctionPropsDeletePaths,
            canEditFunctionPropsRenamePaths,
            canEditHooks,
            canEditHooksAndDeletePaths,
            canEditHooksAndRenamePaths,
            canToggleSuspense,
            canViewSource,
            hasLegacyContext,
            id,
            key,
            rendererPackageName,
            rendererVersion,
            rootType,
            source,
            type,
            owners:
              owners === null
                ? null
                : owners.map(owner => {
                    const [
                      displayName,
                      hocDisplayNames,
                    ] = separateDisplayNameAndHOCs(
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

          element = store.getElementByID(id);
          if (element !== null) {
            setInspectedElement(
              element,
              inspectedElement,
              inspectedElementCache,
            );

            // Schedule update with React if the currently-selected element has been invalidated.
            if (id === selectedElementID) {
              setCurrentlyInspectedElement(inspectedElement);
            }
          }
          break;
        default:
          break;
      }
    };

    bridge.addListener('inspectedElement', onInspectedElement);
    return () => bridge.removeListener('inspectedElement', onInspectedElement);
  }, [bridge, currentlyInspectedElement, selectedElementID, store]);

  // This effect handler polls for updates on the currently selected element.
  useEffect(() => {
    if (selectedElementID === null) {
      return () => {};
    }

    const rendererID = store.getRendererIDForElement(selectedElementID);

    let timeoutID: TimeoutID | null = null;

    const sendRequest = () => {
      timeoutID = null;

      if (rendererID !== null) {
        bridge.send('inspectElement', {id: selectedElementID, rendererID});
      }
    };

    // Send the initial inspection request.
    // We'll poll for an update in the response handler below.
    sendRequest();

    const onInspectedElement = (data: InspectedElementPayload) => {
      // If this is the element we requested, wait a little bit and then ask for another update.
      if (data.id === selectedElementID) {
        switch (data.type) {
          case 'no-change':
          case 'full-data':
          case 'hydrated-path':
            if (timeoutID !== null) {
              clearTimeout(timeoutID);
            }
            timeoutID = setTimeout(sendRequest, 1000);
            break;
          default:
            break;
        }
      }
    };

    bridge.addListener('inspectedElement', onInspectedElement);

    return () => {
      bridge.removeListener('inspectedElement', onInspectedElement);

      if (timeoutID !== null) {
        clearTimeout(timeoutID);
      }
    };
  }, [bridge, selectedElementID, store]);

  const value = useMemo(
    () => ({
      clearErrorsForInspectedElement,
      clearWarningsForInspectedElement,
      copyInspectedElementPath,
      getInspectedElement: getInspectedElementWrapper,
      getInspectedElementPath,
      storeAsGlobal,
    }),
    // InspectedElement is used to invalidate the cache and schedule an update with React.
    [
      clearErrorsForInspectedElement,
      clearWarningsForInspectedElement,
      copyInspectedElementPath,
      currentlyInspectedElement,
      getInspectedElement,
      getInspectedElementPath,
      storeAsGlobal,
    ],
  );

  return (
    <InspectedElementContext.Provider value={value}>
      {children}
    </InspectedElementContext.Provider>
  );
}

function hydrateHelper(
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

export {InspectedElementContext, InspectedElementContextController};
