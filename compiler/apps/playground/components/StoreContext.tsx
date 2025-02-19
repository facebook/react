/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Dispatch, ReactNode} from 'react';
import {useEffect, useReducer} from 'react';
import createContext from '../lib/createContext';
import {emptyStore} from '../lib/defaultStore';
import {saveStore, type Store} from '../lib/stores';

const StoreContext = createContext<Store>();

/**
 * Hook to access the store.
 */
export const useStore = StoreContext.useContext;

const StoreDispatchContext = createContext<Dispatch<ReducerAction>>();

/**
 * Hook to access the store dispatch function.
 */
export const useStoreDispatch = StoreDispatchContext.useContext;

/**
 * Make Store and dispatch function available to all sub-components in children.
 */
export function StoreProvider({children}: {children: ReactNode}): JSX.Element {
  const [store, dispatch] = useReducer(storeReducer, emptyStore);
  useEffect(() => {
    if (store !== emptyStore) {
      saveStore(store);
    }
  }, [store]);

  return (
    <StoreContext.Provider value={store}>
      <StoreDispatchContext.Provider value={dispatch}>
        {children}
      </StoreDispatchContext.Provider>
    </StoreContext.Provider>
  );
}

type ReducerAction =
  | {
      type: 'setStore';
      payload: {
        store: Store;
      };
    }
  | {
      type: 'updateFile';
      payload: {
        source: string;
      };
    };

function storeReducer(store: Store, action: ReducerAction): Store {
  switch (action.type) {
    case 'setStore': {
      const newStore = action.payload.store;
      return newStore;
    }
    case 'updateFile': {
      const {source} = action.payload;
      const newStore = {
        ...store,
        source,
      };
      return newStore;
    }
  }
}
