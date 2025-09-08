/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {ReactContext} from 'shared/ReactTypes';
import type Store from '../../store';

import * as React from 'react';
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {StoreContext} from '../context';

export type SuspenseTreeState = {};

// unused for now
export type SuspenseTreeAction = {type: 'unused'};
export type SuspenseTreeDispatch = (action: SuspenseTreeAction) => void;

const SuspenseTreeStateContext: ReactContext<SuspenseTreeState> =
  createContext<SuspenseTreeState>(((null: any): SuspenseTreeState));
SuspenseTreeStateContext.displayName = 'SuspenseTreeStateContext';

const SuspenseTreeDispatcherContext: ReactContext<SuspenseTreeDispatch> =
  createContext<SuspenseTreeDispatch>(((null: any): SuspenseTreeDispatch));
SuspenseTreeDispatcherContext.displayName = 'SuspenseTreeDispatcherContext';

type Props = {
  children: React$Node,
};

/**
 * The Store is mutable. This Hook ensures renders read the latest Suspense related
 * data.
 */
function useSuspenseStore(): Store {
  const store = useContext(StoreContext);
  const [, storeUpdated] = useReducer<number, number, void>(
    (x: number) => (x + 1) % Number.MAX_SAFE_INTEGER,
    0,
  );
  const initialRevision = useMemo(() => store.revisionSuspense, [store]);
  // We're currently storing everything Suspense related in the same Store as
  // Components. However, most reads are currently stateless. This ensures
  // the latest state is always read from the Store.
  useEffect(() => {
    const handleSuspenseTreeMutated = () => {
      storeUpdated();
    };

    // Since this is a passive effect, the tree may have been mutated before our initial subscription.
    if (store.revisionSuspense !== initialRevision) {
      // At the moment, we can treat this as a mutation.
      handleSuspenseTreeMutated();
    }

    store.addListener('suspenseTreeMutated', handleSuspenseTreeMutated);
    return () =>
      store.removeListener('suspenseTreeMutated', handleSuspenseTreeMutated);
  }, [initialRevision, store]);
  return store;
}

function SuspenseTreeContextController({children}: Props): React.Node {
  // This reducer is created inline because it needs access to the Store.
  // The store is mutable, but the Store itself is global and lives for the lifetime of the DevTools,
  // so it's okay for the reducer to have an empty dependencies array.
  const reducer = useMemo(
    () =>
      (
        state: SuspenseTreeState,
        action: SuspenseTreeAction,
      ): SuspenseTreeState => {
        const {type} = action;
        switch (type) {
          default:
            throw new Error(`Unrecognized action "${type}"`);
        }
      },
    [],
  );

  const initialState: SuspenseTreeState = {};
  const [state, dispatch] = useReducer(reducer, initialState);
  const transitionDispatch = useMemo(
    () => (action: SuspenseTreeAction) =>
      startTransition(() => {
        dispatch(action);
      }),
    [dispatch],
  );

  return (
    <SuspenseTreeStateContext.Provider value={state}>
      <SuspenseTreeDispatcherContext.Provider value={transitionDispatch}>
        {children}
      </SuspenseTreeDispatcherContext.Provider>
    </SuspenseTreeStateContext.Provider>
  );
}

export {
  SuspenseTreeDispatcherContext,
  SuspenseTreeStateContext,
  SuspenseTreeContextController,
  useSuspenseStore,
};
