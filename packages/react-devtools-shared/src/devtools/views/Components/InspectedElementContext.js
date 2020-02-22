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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {unstable_batchedUpdates as batchedUpdates} from 'react-dom';
import {createResource} from '../../cache';
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
import type {Resource, Thenable} from '../../cache';

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

type Context = {|
  copyInspectedElementPath: CopyInspectedElementPath,
  getInspectedElementPath: GetInspectedElementPath,
  getInspectedElement: GetInspectedElement,
  storeAsGlobal: StoreAsGlobal,
|};

const InspectedElementContext = createContext<Context>(((null: any): Context));
InspectedElementContext.displayName = 'InspectedElementContext';

type ResolveFn = (inspectedElement: InspectedElementFrontend) => void;
type InProgressRequest = {|
  promise: Thenable<InspectedElementFrontend>,
  resolveFn: ResolveFn,
|};

const inProgressRequests: WeakMap<Element, InProgressRequest> = new WeakMap();
const resource: Resource<
  Element,
  Element,
  InspectedElementFrontend,
> = createResource(
  (element: Element) => {
    let request = inProgressRequests.get(element);
    if (request != null) {
      return request.promise;
    }

    let resolveFn = ((null: any): ResolveFn);
    const promise = new Promise(resolve => {
      resolveFn = resolve;
    });

    inProgressRequests.set(element, {promise, resolveFn});

    return promise;
  },
  (element: Element) => element,
  {useWeakMap: true},
);

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

  const getInspectedElement = useCallback<GetInspectedElement>(
    (id: number) => {
      const element = store.getElementByID(id);
      if (element !== null) {
        return resource.read(element);
      } else {
        return null;
      }
    },
    [store],
  );

  // It's very important that this context consumes selectedElementID and not inspectedElementID.
  // Otherwise the effect that sends the "inspect" message across the bridge-
  // would itself be blocked by the same render that suspends (waiting for the data).
  const {selectedElementID} = useContext(TreeStateContext);

  const [
    currentlyInspectedElement,
    setCurrentlyInspectedElement,
  ] = useState<InspectedElementFrontend | null>(null);

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

              resource.write(element, inspectedElement);

              // Schedule update with React if the curently-selected element has been invalidated.
              if (id === selectedElementID) {
                setCurrentlyInspectedElement(inspectedElement);
              }
            }
          }
          break;
        case 'full-data':
          const {
            canEditFunctionProps,
            canEditHooks,
            canToggleSuspense,
            canViewSource,
            hasLegacyContext,
            source,
            type,
            owners,
            context,
            hooks,
            props,
            state,
          } = ((data.value: any): InspectedElementBackend);

          const inspectedElement: InspectedElementFrontend = {
            canEditFunctionProps,
            canEditHooks,
            canToggleSuspense,
            canViewSource,
            hasLegacyContext,
            id,
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
          };

          element = store.getElementByID(id);
          if (element !== null) {
            const request = inProgressRequests.get(element);
            if (request != null) {
              inProgressRequests.delete(element);
              batchedUpdates(() => {
                request.resolveFn(inspectedElement);
                setCurrentlyInspectedElement(inspectedElement);
              });
            } else {
              resource.write(element, inspectedElement);

              // Schedule update with React if the curently-selected element has been invalidated.
              if (id === selectedElementID) {
                setCurrentlyInspectedElement(inspectedElement);
              }
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
      copyInspectedElementPath,
      getInspectedElement,
      getInspectedElementPath,
      storeAsGlobal,
    }),
    // InspectedElement is used to invalidate the cache and schedule an update with React.
    [
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
    let {cleaned, data, unserializable} = dehydratedData;

    if (path) {
      const {length} = path;
      if (length > 0) {
        // Hydration helper requires full paths, but inspection dehydrates with relative paths.
        // In that event it's important that we adjust the "cleaned" paths to match.
        cleaned = cleaned.map(cleanedPath => cleanedPath.slice(length));
        unserializable = unserializable.map(unserializablePath =>
          unserializablePath.slice(length),
        );
      }
    }

    return hydrate(data, cleaned, unserializable);
  } else {
    return null;
  }
}

export {InspectedElementContext, InspectedElementContextController};
