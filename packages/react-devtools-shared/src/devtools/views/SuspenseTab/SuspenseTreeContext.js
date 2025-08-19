/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {ReactContext} from 'shared/ReactTypes';

import * as React from 'react';
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type {SuspenseNode} from '../../../frontend/types';
import {StoreContext} from '../context';

export type SuspenseTreeState = {
  shells: $ReadOnlyArray<SuspenseNode['id']>,
};

type ACTION_HANDLE_SUSPENSE_TREE_MUTATION = {
  type: 'HANDLE_SUSPENSE_TREE_MUTATION',
};
export type SuspenseTreeAction = ACTION_HANDLE_SUSPENSE_TREE_MUTATION;
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

function SuspenseTreeContextController({children}: Props): React.Node {
  const store = useContext(StoreContext);

  const initialRevision = useMemo(() => store.revisionSuspense, [store]);

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
          case 'HANDLE_SUSPENSE_TREE_MUTATION':
            return {...state, shells: store.roots};
          default:
            throw new Error(`Unrecognized action "${type}"`);
        }
      },
    [],
  );

  const initialState: SuspenseTreeState = {
    shells: store.roots,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const transitionDispatch = useMemo(
    () => (action: SuspenseTreeAction) =>
      startTransition(() => {
        dispatch(action);
      }),
    [dispatch],
  );

  useEffect(() => {
    const handleSuspenseTreeMutated = () => {
      transitionDispatch({
        type: 'HANDLE_SUSPENSE_TREE_MUTATION',
      });
    };

    // Since this is a passive effect, the tree may have been mutated before our initial subscription.
    if (store.revisionSuspense !== initialRevision) {
      // At the moment, we can treat this as a mutation.
      // We don't know which Elements were newly added/removed, but that should be okay in this case.
      // It would only impact the search state, which is unlikely to exist yet at this point.
      transitionDispatch({
        type: 'HANDLE_SUSPENSE_TREE_MUTATION',
      });
    }

    store.addListener('suspenseTreeMutated', handleSuspenseTreeMutated);
    return () =>
      store.removeListener('suspenseTreeMutated', handleSuspenseTreeMutated);
  }, [dispatch, initialRevision, store]);

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
};
