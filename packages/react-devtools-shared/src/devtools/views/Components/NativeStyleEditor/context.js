/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {unstable_batchedUpdates as batchedUpdates} from 'react-dom';
import {createResource} from 'react-devtools-shared/src/devtools/cache';
import {
  BridgeContext,
  StoreContext,
} from 'react-devtools-shared/src/devtools/views/context';
import {TreeStateContext} from '../TreeContext';

import type {StyleAndLayout as StyleAndLayoutBackend} from 'react-devtools-shared/src/backend/NativeStyleEditor/types';
import type {StyleAndLayout as StyleAndLayoutFrontend} from './types';
import type {Element} from 'react-devtools-shared/src/devtools/views/Components/types';
import type {
  Resource,
  Thenable,
} from 'react-devtools-shared/src/devtools/cache';

export type GetStyleAndLayout = (id: number) => StyleAndLayoutFrontend | null;

type Context = {|
  getStyleAndLayout: GetStyleAndLayout,
|};

const NativeStyleContext = createContext<Context>(((null: any): Context));
NativeStyleContext.displayName = 'NativeStyleContext';

type ResolveFn = (styleAndLayout: StyleAndLayoutFrontend) => void;
type InProgressRequest = {|
  promise: Thenable<StyleAndLayoutFrontend>,
  resolveFn: ResolveFn,
|};

const inProgressRequests: WeakMap<Element, InProgressRequest> = new WeakMap();
const resource: Resource<
  Element,
  Element,
  StyleAndLayoutFrontend,
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

function NativeStyleContextController({children}: Props) {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const getStyleAndLayout = useCallback<GetStyleAndLayout>(
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

  // It's very important that this context consumes selectedElementID and not NativeStyleID.
  // Otherwise the effect that sends the "inspect" message across the bridge-
  // would itself be blocked by the same render that suspends (waiting for the data).
  const {selectedElementID} = useContext(TreeStateContext);

  const [
    currentStyleAndLayout,
    setCurrentStyleAndLayout,
  ] = useState<StyleAndLayoutFrontend | null>(null);

  // This effect handler invalidates the suspense cache and schedules rendering updates with React.
  useEffect(
    () => {
      const onStyleAndLayout = ({id, layout, style}: StyleAndLayoutBackend) => {
        let element = store.getElementByID(id);
        if (element !== null) {
          const styleAndLayout: StyleAndLayoutFrontend = {
            layout,
            style,
          };
          const request = inProgressRequests.get(element);
          if (request != null) {
            inProgressRequests.delete(element);
            batchedUpdates(() => {
              request.resolveFn(styleAndLayout);
              setCurrentStyleAndLayout(styleAndLayout);
            });
          } else {
            resource.write(element, styleAndLayout);

            // Schedule update with React if the currently-selected element has been invalidated.
            if (id === selectedElementID) {
              setCurrentStyleAndLayout(styleAndLayout);
            }
          }
        }
      };

      bridge.addListener('NativeStyleEditor_styleAndLayout', onStyleAndLayout);
      return () =>
        bridge.removeListener(
          'NativeStyleEditor_styleAndLayout',
          onStyleAndLayout,
        );
    },
    [bridge, currentStyleAndLayout, selectedElementID, store],
  );

  // This effect handler polls for updates on the currently selected element.
  useEffect(
    () => {
      if (selectedElementID === null) {
        return () => {};
      }

      const rendererID = store.getRendererIDForElement(selectedElementID);

      let timeoutID: TimeoutID | null = null;

      const sendRequest = () => {
        timeoutID = null;

        if (rendererID !== null) {
          bridge.send('NativeStyleEditor_measure', {
            id: selectedElementID,
            rendererID,
          });
        }
      };

      // Send the initial measurement request.
      // We'll poll for an update in the response handler below.
      sendRequest();

      const onStyleAndLayout = ({id}: StyleAndLayoutBackend) => {
        // If this is the element we requested, wait a little bit and then ask for another update.
        if (id === selectedElementID) {
          if (timeoutID !== null) {
            clearTimeout(timeoutID);
          }
          timeoutID = setTimeout(sendRequest, 1000);
        }
      };

      bridge.addListener('NativeStyleEditor_styleAndLayout', onStyleAndLayout);

      return () => {
        bridge.removeListener(
          'NativeStyleEditor_styleAndLayout',
          onStyleAndLayout,
        );

        if (timeoutID !== null) {
          clearTimeout(timeoutID);
        }
      };
    },
    [bridge, selectedElementID, store],
  );

  const value = useMemo(
    () => ({getStyleAndLayout}),
    // NativeStyle is used to invalidate the cache and schedule an update with React.
    [currentStyleAndLayout, getStyleAndLayout],
  );

  return (
    <NativeStyleContext.Provider value={value}>
      {children}
    </NativeStyleContext.Provider>
  );
}

export {NativeStyleContext, NativeStyleContextController};
