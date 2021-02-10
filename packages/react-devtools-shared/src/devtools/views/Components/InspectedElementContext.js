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
  unstable_startTransition as startTransition,
  unstable_useCacheRefresh as useCacheRefresh,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {TreeStateContext} from './TreeContext';
import {BridgeContext, StoreContext} from '../context';
import {
  checkForUpdate,
  inspectElement,
} from 'react-devtools-shared/src/inspectedElementCache';

import type {ReactNodeList} from 'shared/ReactTypes';
import type {
  Element,
  InspectedElement,
} from 'react-devtools-shared/src/devtools/views/Components/types';

type Path = Array<string | number>;
type InspectPathFunction = (path: Path) => void;

type Context = {|
  inspectedElement: InspectedElement | null,
  inspectPaths: InspectPathFunction,
|};

export const InspectedElementContext = createContext<Context>(
  ((null: any): Context),
);

const POLL_INTERVAL = 1000;

export type Props = {|
  children: ReactNodeList,
|};

export function InspectedElementContextController({children}: Props) {
  const {selectedElementID} = useContext(TreeStateContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const refresh = useCacheRefresh();

  // Track the paths insepected for the currently selected element.
  const [state, setState] = useState<{|
    element: Element | null,
    path: Array<number | string> | null,
  |}>({
    element: null,
    path: null,
  });

  const element =
    selectedElementID !== null ? store.getElementByID(selectedElementID) : null;

  const elementHasChanged = element !== null && element !== state.element;

  // Reset the cached inspected paths when a new element is selected.
  if (elementHasChanged) {
    setState({
      element,
      path: null,
    });
  }

  // Don't load a stale element from the backend; it wastes bridge bandwidth.
  let inspectedElement = null;
  if (!elementHasChanged && element !== null) {
    inspectedElement = inspectElement(element, state.path, store, bridge);
  }

  const inspectPaths: InspectPathFunction = useCallback<InspectPathFunction>(
    (path: Path) => {
      startTransition(() => {
        setState({
          element: state.element,
          path,
        });
        refresh();
      });
    },
    [setState, state],
  );

  // Reset path
  useEffect(() => {
    if (state.path !== null) {
      setState({
        element: state.element,
        path: null,
      });
    }
  }, [state]);

  // Periodically poll the selected element for updates.
  useEffect(() => {
    if (element !== null) {
      const checkForUpdateWrapper = () => {
        checkForUpdate({bridge, element, refresh, store});
        timeoutID = setTimeout(checkForUpdateWrapper, POLL_INTERVAL);
      };
      let timeoutID = setTimeout(checkForUpdateWrapper, POLL_INTERVAL);
      return () => {
        clearTimeout(timeoutID);
      };
    }
  }, [
    element,
    // Reset this timer any time the element we're inspecting gets a new response.
    // No sense to ping right away after e.g. inspecting/hydrating a path.
    inspectedElement,
    state,
  ]);

  const value = useMemo<Context>(
    () => ({
      inspectedElement,
      inspectPaths,
    }),
    [inspectedElement, inspectPaths],
  );

  return (
    <InspectedElementContext.Provider value={value}>
      {children}
    </InspectedElementContext.Provider>
  );
}
