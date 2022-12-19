/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import invariant from "invariant";
import { defaultStore } from "../defaultStore";
import { codec } from "../utils";

/**
 * Global Store for Playground
 */
export interface Store {
  source: string;
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
  const isValidStore = "source" in raw && typeof raw["source"] === "string";
  if (isValidStore) {
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
