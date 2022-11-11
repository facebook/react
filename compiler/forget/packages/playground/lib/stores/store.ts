/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import { createCompilerFlags } from "babel-plugin-react-forget";
import invariant from "invariant";
import { defaultStore } from "../defaultStore";
import { codec } from "../utils";
import { ForgetCompilerFlags } from "../compilerDriver";
import { parseCompilerFlags } from "babel-plugin-react-forget";

/**
 * Global Store for Playground
 */
export interface Store {
  source: string;

  compilerFlags: ForgetCompilerFlags;
}

/**
 * Serialize, encode, and save @param store to localStorage and update URL.
 */
export function saveStore(store: Store) {
  const base64 = codec.utoa(JSON.stringify(store));
  localStorage.setItem("playgroundStore", base64);
  history.replaceState({}, "", `#${base64}`);
}

/**
 * Check if @param raw is a valid Store by if
 * - it has a `source` property and is a string
 */
function getValidStore(raw: any): Store | null {
  if ("compilerFlags" in raw && !(raw["compilerFlags"] instanceof Object)) {
    return null;
  }
  const isValidStore = "source" in raw && typeof raw["source"] === "string";
  if (isValidStore) {
    if ("compilerFlags" in raw) {
      // Merge flags from decoded store into flags valid for this compiler version
      // Since the compiler is in active dev, if
      //   - a flag exists in the decoded store but is not supported by the compiler,
      //      we discard + ignore it
      //   - a flag does not exist in the decoded store but is used by the compiler,
      //      we use the default value
      raw.compilerFlags = parseCompilerFlags(raw.compilerFlags, true);
    } else {
      // some saved Stores may not have `compilerFlags`
      raw.compilerFlags = createCompilerFlags();
    }
    return raw;
  } else {
    return null;
  }
}

/**
 * Deserialize, decode, and initialize @param store from URL and then
 * localStorage. Throw an error if Store is malformed.
 */
export function initStoreFromUrlOrLocalStorage(): Store {
  const encodedSourceFromUrl = location.hash.slice(1);
  const encodedSourceFromLocal = localStorage.getItem("playgroundStore");
  const encodedSource = encodedSourceFromUrl || encodedSourceFromLocal;

  // No data in the URL and no data in the localStorage to fallback to.
  // Initialize with the default store.
  if (!encodedSource) return defaultStore;

  const raw = JSON.parse(codec.atou(encodedSource));
  const store = getValidStore(raw);
  invariant(store != null, "Invalid Store");
  return raw;
}
