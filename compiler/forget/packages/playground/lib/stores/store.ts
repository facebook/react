/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import { createCompilerFlags, OutputKind } from "babel-plugin-react-forget";
import invariant from "invariant";
import { defaultStore } from "../defaultStore";
import { codec } from "../utils";
import { ForgetCompilerFlags } from "../compilerDriver";
import { parseCompilerFlags } from "babel-plugin-react-forget";

type VisualizedGraph =
  | `Visualized${OutputKind.ValGraph}`
  | `Visualized${OutputKind.SCCGraph}`
  | `Visualized${OutputKind.RedGraph}`;

export type OutputTabKind = OutputKind | VisualizedGraph | "Preview";

export function isGraph(
  tabKind: OutputTabKind
): tabKind is
  | OutputKind.ValGraph
  | OutputKind.SCCGraph
  | OutputKind.RedGraph
  | VisualizedGraph {
  return tabKind.endsWith("Graph");
}

export function isVisualizedGraph(
  tabKind: OutputTabKind
): tabKind is VisualizedGraph {
  return tabKind.startsWith("Visualized");
}

export function getVisualizedGraphKind(graphKind: VisualizedGraph) {
  const kind = graphKind.slice("Visualized".length);
  return kind as
    | OutputKind.ValGraph
    | OutputKind.SCCGraph
    | OutputKind.RedGraph;
}

export enum FileExt {
  js = "javascript",
  jsx = "javascript",
  ts = "typescript",
  tsx = "typescript",
  css = "css",
}

export interface InputFile {
  id: string;
  language: string;
  content: string;
}

/**
 * Match @param fileId with valid FileExt's.
 */
export function matchFileId(fileId: string) {
  return fileId.match(new RegExp(`.+\\.(${Object.keys(FileExt).join("|")})$`));
}

/**
 * Refine @param ext string to a key in FileExt.
 */
function isValidFileExt(ext: string): ext is keyof typeof FileExt {
  return Object.keys(FileExt).includes(ext);
}

/**
 * Checks if @param id is a valid file ID.
 * @returns an input file that may or may not be a valid input tab to add to Store.
 */
export function createInputFile(id: string, content: string): InputFile {
  const match = matchFileId(id);
  if (!match || !isValidFileExt(match[1])) {
    throw new Error(
      `Invalid tab name or extension. The tab must have a name and a supported extension (${Object.keys(
        FileExt
      ).join(", ")}).`
    );
  }

  return {
    id,
    language: FileExt[match[1]],
    content,
  };
}

export function checkInputFile(
  inputFile: InputFile,
  fromFile: InputFile | undefined,
  store: Store
) {
  const isDuplicateFileId =
    store.files.find((file) => file.id === inputFile.id) !== undefined;
  if (isDuplicateFileId) {
    throw new Error(`A tab with ID "${inputFile.id}" already exists.`);
  }

  const isIndexLikeId = (id: string) => /^index\..*$/.test(id);
  const fromIndex = fromFile && isIndexLikeId(fromFile.id);
  if (fromIndex && !isIndexLikeId(inputFile.id)) {
    throw new Error(`Only the file extension of the index tab can be changed.`);
  }
  if (!fromIndex && isIndexLikeId(inputFile.id)) {
    throw new Error(`Only the index tab can be named as "index".`);
  }
}

/**
 * Global Store for Playground
 */
export interface Store {
  /**
   * Input tabs. The key is FileId joined by a dot.
   *
   * @example "index.js" => { id: "index.js", language: "javascript", content: "// index.js", isIdEditable: false }
   */
  files: InputFile[];

  selectedFileId: string;

  /* Compiler settings */
  compilerFlags: ForgetCompilerFlags;
}

export function getSelectedFile(store: Store): InputFile {
  const selectedFile = store.files.find((f) => f.id === store.selectedFileId);
  invariant(selectedFile, "Selected file must exists.");
  return selectedFile;
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
 * - it has a `files` property and is an Array
 * - it has a `selectedFileId` property and is a string
 * - its `selectedFileId` has a corresponding file in `files`
 */
function getValidStore(raw: any): Store | null {
  if ("compilerFlags" in raw && !(raw["compilerFlags"] instanceof Object)) {
    return null;
  }
  const isValidStore =
    "files" in raw &&
    raw["files"] instanceof Array &&
    "selectedFileId" in raw &&
    typeof raw["selectedFileId"] === "string" &&
    raw["files"].find((f) => f.id === raw["selectedFileId"]);
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
