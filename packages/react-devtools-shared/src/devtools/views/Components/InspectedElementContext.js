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
  useRef,
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

  // Track when insepected paths have changed; we need to force the backend to send an udpate then.
  const forceUpdateRef = useRef<boolean>(true);

  // Track the paths insepected for the currently selected element.
  const [state, setState] = useState<{|
    element: Element | null,
    inspectedPaths: Object,
  |}>({
    element: null,
    inspectedPaths: {},
  });

  const element =
    selectedElementID !== null ? store.getElementByID(selectedElementID) : null;

  const elementHasChanged = element !== null && element !== state.element;

  // Reset the cached inspected paths when a new element is selected.
  if (elementHasChanged) {
    setState({
      element,
      inspectedPaths: {},
    });
  }

  // Don't load a stale element from the backend; it wastes bridge bandwidth.
  const inspectedElement =
    !elementHasChanged && element !== null
      ? inspectElement(
          element,
          state.inspectedPaths,
          forceUpdateRef.current,
          store,
          bridge,
        )
      : null;

  const inspectPaths: InspectPathFunction = useCallback<InspectPathFunction>(
    (path: Path) => {
      startTransition(() => {
        forceUpdateRef.current = true;
        setState(prevState => {
          const cloned = {...prevState};
          let current = cloned.inspectedPaths;
          path.forEach(key => {
            if (!current[key]) {
              current[key] = {};
            }
            current = current[key];
          });
          return cloned;
        });
        refresh();
      });
    },
    [setState],
  );

  // Force backend update when inspected paths change.
  useEffect(() => {
    forceUpdateRef.current = false;
  }, [element, state]);

  // Periodically poll the selected element for updates.
  useEffect(() => {
    if (element !== null) {
      const inspectedPaths = state.inspectedPaths;
      const checkForUpdateWrapper = () => {
        checkForUpdate({bridge, element, inspectedPaths, refresh, store});
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
