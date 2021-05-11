/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import type { Dispatch, ReactNode } from "react";
import { useReducer } from "react";
import createContext from "../lib/createContext";
import { emptyStore } from "../lib/defaultStore";
import type { InputFile, Store } from "../lib/stores";
import { saveStore } from "../lib/stores";
import { ForgetCompilerFlags } from "../lib/compilerDriver";

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
export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(storeReducer, emptyStore);

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
      type: "setStore";
      payload: {
        store: Store;
      };
    }
  | {
      type: "addFile";
      payload: {
        file: InputFile;
      };
    }
  | {
      type: "updateFile";
      payload: {
        file: InputFile;
        oldFileId?: string;
      };
    }
  | {
      type: "deleteFile";
      payload: { fileId: string };
    }
  | {
      type: "switchInputTab";
      payload: { selectedFileId: string };
    }
  | {
      type: "setCompilerFlag";
      payload: { flag: keyof ForgetCompilerFlags; value: boolean };
    };

function storeReducer(store: Store, action: ReducerAction): Store {
  switch (action.type) {
    case "setStore": {
      const newStore = action.payload.store;

      saveStore(newStore);
      return newStore;
    }
    case "addFile": {
      const { file } = action.payload;

      const newStore = {
        ...store,
        files: [...store.files, file],
        selectedFileId: file.id,
      };

      saveStore(newStore);
      return newStore;
    }
    case "updateFile": {
      const { file, oldFileId } = action.payload;

      const newStore = {
        ...store,
        files: store.files.map((f) =>
          f.id === file.id || f.id === oldFileId ? file : f
        ),
        selectedFileId: file.id,
      };

      saveStore(newStore);
      return newStore;
    }
    case "deleteFile": {
      const { fileId } = action.payload;

      // If the current selected file is deleted, fall back to selecting
      // the index file (at index 1 of the files array).
      const fallbackFileId =
        store.selectedFileId === fileId
          ? store.files[1].id
          : store.selectedFileId;

      const newStore = {
        ...store,
        files: store.files.filter((f) => f.id !== fileId),
        selectedFileId: fallbackFileId,
      };

      saveStore(newStore);
      return newStore;
    }
    case "switchInputTab": {
      const { selectedFileId } = action.payload;

      const newStore = {
        ...store,
        selectedFileId: selectedFileId,
      };

      saveStore(newStore);
      return newStore;
    }
    case "setCompilerFlag": {
      const { flag, value } = action.payload;

      const newStore = {
        ...store,
        compilerFlags: { ...store.compilerFlags },
      };
      newStore.compilerFlags[flag] = value;
      saveStore(newStore);
      return newStore;
    }
  }
}
