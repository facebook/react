/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable */

declare const __PROFILE__: boolean;
declare const __EXPERIMENTAL__: boolean;
declare const __VARIANT__: boolean;

declare const __REACT_DEVTOOLS_GLOBAL_HOOK__: any; /*?{
  inject: ?((stuff: Object) => void)
};*/

declare const globalThis: Object;

declare const queueMicrotask: (fn: Function) => void;
declare const reportError: (error: mixed) => void;
declare const AggregateError: Class<Error>;

declare const FinalizationRegistry: any;

declare module 'create-react-class' {
  declare const exports: $FlowFixMe;
}

declare interface ConsoleTask {
  run<T>(f: () => T): T;
}

declare var console: {
  assert(condition: mixed, ...data: Array<any>): void,
  clear(): void,
  count(label?: string): void,
  countReset(label?: string): void,
  debug(...data: Array<any>): void,
  dir(...data: Array<any>): void,
  dirxml(...data: Array<any>): void,
  error(...data: Array<any>): void,
  _exception(...data: Array<any>): void,
  group(...data: Array<any>): void,
  groupCollapsed(...data: Array<any>): void,
  groupEnd(): void,
  info(...data: Array<any>): void,
  log(...data: Array<any>): void,
  profile(name?: string): void,
  profileEnd(name?: string): void,
  table(
    tabularData:
      | {[key: string]: any, ...}
      | Array<{[key: string]: any, ...}>
      | Array<Array<any>>,
  ): void,
  time(label?: string): void,
  timeEnd(label: string): void,
  timeStamp(
    label?: string,
    start?: string | number,
    end?: string | number,
    trackName?: string,
    trackGroup?: string,
    color?: string,
  ): void,
  timeLog(label?: string, ...data?: Array<any>): void,
  trace(...data: Array<any>): void,
  warn(...data: Array<any>): void,
  createTask(label: string): ConsoleTask,
  ...
};

type ScrollTimelineOptions = {
  source: Element,
  axis?: 'block' | 'inline' | 'x' | 'y',
  ...
};

declare class ScrollTimeline extends AnimationTimeline {
  constructor(options?: ScrollTimelineOptions): void;
  axis: 'block' | 'inline' | 'x' | 'y';
  source: Element;
}

// Flow hides the props of React$Element, this overrides it to unhide
// them for React internals.
// prettier-ignore
declare opaque type React$Element<
  +ElementType: React$ElementType,
  +P = React$ElementProps<ElementType>,
>: {
  +type: ElementType,
  +props: P,
  +key: React$Key | null,
  +ref: any,
};

declare type React$CustomJSXFactory = any;

declare const trustedTypes: {
  isHTML: (value: any) => boolean,
  isScript: (value: any) => boolean,
  isScriptURL: (value: any) => boolean,
  // TrustedURLs are deprecated and will be removed soon: https://github.com/WICG/trusted-types/pull/204
  isURL?: (value: any) => boolean,
};

// ReactFeatureFlags www fork
declare module 'ReactFeatureFlags' {
  declare module.exports: any;
}

// ReactFiberErrorDialog www fork
declare module 'ReactFiberErrorDialog' {
  declare module.exports: {showErrorDialog: (error: mixed) => boolean, ...};
}

// EventListener www fork
declare module 'EventListener' {
  declare module.exports: {
    listen: (
      target: EventTarget,
      type: string,
      callback: Function,
      priority?: number,
      options?: {passive: boolean, ...},
    ) => mixed,
    capture: (target: EventTarget, type: string, callback: Function) => mixed,
    captureWithPassiveFlag: (
      target: EventTarget,
      type: string,
      callback: Function,
      passive: boolean,
    ) => mixed,
    bubbleWithPassiveFlag: (
      target: EventTarget,
      type: string,
      callback: Function,
      passive: boolean,
    ) => mixed,
    ...
  };
}

declare function __webpack_chunk_load__(id: string): Promise<mixed>;
declare const __webpack_require__: ((id: string) => any) & {
  u: string => string,
};

declare function __turbopack_load__(id: string): Promise<mixed>;
declare const __turbopack_require__: ((id: string) => any) & {
  u: string => string,
};

declare var parcelRequire: {
  (id: string): any,
  load: (url: string) => Promise<mixed>,
  extendImportMap: (importMap: {[string]: string}) => void,
  meta: {
    publicUrl: string,
    devServer: string | null,
  },
};

declare module 'fs/promises' {
  declare const access: (path: string, mode?: number) => Promise<void>;
  declare const lstat: (
    path: string,
    options?: ?{bigint?: boolean},
  ) => Promise<mixed>;
  declare const readdir: (
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
          withFileTypes?: ?boolean,
        },
  ) => Promise<Buffer>;
  declare const readFile: (
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
        },
  ) => Promise<Buffer>;
  declare const readlink: (
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
        },
  ) => Promise<mixed>;
  declare const realpath: (
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
        },
  ) => Promise<mixed>;
  declare const stat: (
    path: string,
    options?: ?{bigint?: boolean},
  ) => Promise<mixed>;
}
declare module 'pg' {
  declare const Pool: (options: mixed) => {
    query: (query: string, values?: Array<mixed>) => void,
  };
}

declare module 'util' {
  declare function debuglog(section: string): (data: any, ...args: any) => void;
  declare function format(format: string, ...placeholders: any): string;
  declare function log(string: string): void;
  declare function inspect(object: any, options?: util$InspectOptions): string;
  declare function isArray(object: any): boolean;
  declare function isRegExp(object: any): boolean;
  declare function isDate(object: any): boolean;
  declare function isError(object: any): boolean;
  declare function inherits(
    constructor: Function,
    superConstructor: Function,
  ): void;
  declare function deprecate(f: Function, string: string): Function;
  declare function promisify(f: Function): Function;
  declare function callbackify(f: Function): Function;
  declare class TextDecoder {
    constructor(
      encoding?: string,
      options?: {
        fatal?: boolean,
        ignoreBOM?: boolean,
        ...
      },
    ): void;
    decode(
      input?: ArrayBuffer | DataView | $TypedArray,
      options?: {stream?: boolean, ...},
    ): string;
    encoding: string;
    fatal: boolean;
    ignoreBOM: boolean;
  }
  declare class TextEncoder {
    constructor(encoding?: string): TextEncoder;
    encode(buffer: string): Uint8Array;
    encodeInto(
      buffer: string,
      dest: Uint8Array,
    ): {read: number, written: number};
    encoding: string;
  }
}

declare module 'busboy' {
  import type {Writable, Readable} from 'stream';

  declare interface Info {
    encoding: string;
    mimeType: string;
  }

  declare interface FileInfo extends Info {
    filename: string;
  }

  declare interface FieldInfo extends Info {
    nameTruncated: boolean;
    valueTruncated: boolean;
  }

  declare interface BusboyEvents {
    file: (name: string, stream: Readable, info: FileInfo) => void;
    field: (name: string, value: string, info: FieldInfo) => void;
    partsLimit: () => void;
    filesLimit: () => void;
    fieldsLimit: () => void;
    error: (error: mixed) => void;
    close: () => void;
  }
  declare interface Busboy extends Writable {
    addListener<Event: $Keys<BusboyEvents>>(
      event: Event,
      listener: BusboyEvents[Event],
    ): Busboy;
    addListener(
      event: string | symbol,
      listener: (...args: any[]) => void,
    ): Busboy;

    on<Event: $Keys<BusboyEvents>>(
      event: Event,
      listener: BusboyEvents[Event],
    ): Busboy;
    on(event: string | symbol, listener: (...args: any[]) => void): Busboy;

    once<Event: $Keys<BusboyEvents>>(
      event: Event,
      listener: BusboyEvents[Event],
    ): Busboy;
    once(event: string | symbol, listener: (...args: any[]) => void): Busboy;

    removeListener<Event: $Keys<BusboyEvents>>(
      event: Event,
      listener: BusboyEvents[Event],
    ): Busboy;
    removeListener(
      event: string | symbol,
      listener: (...args: any[]) => void,
    ): Busboy;

    off<Event: $Keys<BusboyEvents>>(
      event: Event,
      listener: BusboyEvents[Event],
    ): Busboy;
    off(event: string | symbol, listener: (...args: any[]) => void): Busboy;

    prependListener<Event: $Keys<BusboyEvents>>(
      event: Event,
      listener: BusboyEvents[Event],
    ): Busboy;
    prependListener(
      event: string | symbol,
      listener: (...args: any[]) => void,
    ): Busboy;

    prependOnceListener<Event: $Keys<BusboyEvents>>(
      event: Event,
      listener: BusboyEvents[Event],
    ): Busboy;
    prependOnceListener(
      event: string | symbol,
      listener: (...args: any[]) => void,
    ): Busboy;
  }
}

declare module 'pg/lib/utils' {
  declare module.exports: {
    prepareValue(val: any): mixed,
  };
}

// Node
declare module 'async_hooks' {
  declare class AsyncLocalStorage<T> {
    disable(): void;
    getStore(): T | void;
    run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R;
    enterWith(store: T): void;
  }
  declare interface AsyncResource {}
  declare function executionAsyncId(): number;
  declare function executionAsyncResource(): AsyncResource;
  declare function triggerAsyncId(): number;
  declare type HookCallbacks = {
    init?: (
      asyncId: number,
      type: string,
      triggerAsyncId: number,
      resource: AsyncResource,
    ) => void,
    before?: (asyncId: number) => void,
    after?: (asyncId: number) => void,
    promiseResolve?: (asyncId: number) => void,
    destroy?: (asyncId: number) => void,
  };
  declare class AsyncHook {
    enable(): this;
    disable(): this;
  }
  declare function createHook(callbacks: HookCallbacks): AsyncHook;
}

// Edge
declare class AsyncLocalStorage<T> {
  disable(): void;
  getStore(): T | void;
  run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R;
  enterWith(store: T): void;
}

declare const async_hooks: {
  createHook(callbacks: any): any,
  executionAsyncId(): number,
};

declare module 'node:worker_threads' {
  declare class MessageChannel {
    port1: MessagePort;
    port2: MessagePort;
  }
}

declare module 'jest-diff' {
  declare type CompareKeys = ((a: string, b: string) => number) | void;
  declare type DiffOptions = {
    aAnnotation?: string,
    aColor?: (arg: string) => string,
    aIndicator?: string,
    bAnnotation?: string,
    bColor?: (arg: string) => string,
    bIndicator?: string,
    changeColor?: (arg: string) => string,
    changeLineTrailingSpaceColor?: (arg: string) => string,
    commonColor?: (arg: string) => string,
    commonIndicator?: string,
    commonLineTrailingSpaceColor?: (arg: string) => string,
    contextLines?: number,
    emptyFirstOrLastLinePlaceholder?: string,
    expand?: boolean,
    includeChangeCounts?: boolean,
    omitAnnotationLines?: boolean,
    patchColor?: (arg: string) => string,
    compareKeys?: CompareKeys,
  };
  declare function diff(a: any, b: any, options?: DiffOptions): string;
}

declare const Bun: {
  hash(
    input: string | $TypedArray | DataView | ArrayBuffer | SharedArrayBuffer,
  ): number,
};

// Navigation API

declare const navigation: Navigation;

interface NavigationResult {
  committed: Promise<NavigationHistoryEntry>;
  finished: Promise<NavigationHistoryEntry>;
}

declare class Navigation extends EventTarget {
  entries(): NavigationHistoryEntry[];
  +currentEntry: NavigationHistoryEntry | null;
  updateCurrentEntry(options: NavigationUpdateCurrentEntryOptions): void;
  +transition: NavigationTransition | null;

  +canGoBack: boolean;
  +canGoForward: boolean;

  navigate(url: string, options?: NavigationNavigateOptions): NavigationResult;
  reload(options?: NavigationReloadOptions): NavigationResult;

  traverseTo(key: string, options?: NavigationOptions): NavigationResult;
  back(options?: NavigationOptions): NavigationResult;
  forward(options?: NavigationOptions): NavigationResult;

  onnavigate: ((this: Navigation, ev: NavigateEvent) => any) | null;
  onnavigatesuccess: ((this: Navigation, ev: Event) => any) | null;
  onnavigateerror: ((this: Navigation, ev: ErrorEvent) => any) | null;
  oncurrententrychange:
    | ((this: Navigation, ev: NavigationCurrentEntryChangeEvent) => any)
    | null;

  // TODO: Implement addEventListener overrides. Doesn't seem like Flow supports this.
}

declare class NavigationTransition {
  +navigationType: NavigationTypeString;
  +from: NavigationHistoryEntry;
  +finished: Promise<void>;
}

interface NavigationHistoryEntryEventMap {
  dispose: Event;
}

interface NavigationHistoryEntry extends EventTarget {
  +key: string;
  +id: string;
  +url: string | null;
  +index: number;
  +sameDocument: boolean;

  getState(): mixed;

  ondispose: ((this: NavigationHistoryEntry, ev: Event) => any) | null;

  // TODO: Implement addEventListener overrides. Doesn't seem like Flow supports this.
}

declare var NavigationHistoryEntry: {
  prototype: NavigationHistoryEntry,
  new(): NavigationHistoryEntry,
};

type NavigationTypeString = 'reload' | 'push' | 'replace' | 'traverse';

interface NavigationUpdateCurrentEntryOptions {
  state: mixed;
}

interface NavigationOptions {
  info?: mixed;
}

interface NavigationNavigateOptions extends NavigationOptions {
  state?: mixed;
  history?: 'auto' | 'push' | 'replace';
}

interface NavigationReloadOptions extends NavigationOptions {
  state?: mixed;
}

declare class NavigationCurrentEntryChangeEvent extends Event {
  constructor(type: string, eventInit?: any): void;

  +navigationType: NavigationTypeString | null;
  +from: NavigationHistoryEntry;
}

declare class NavigateEvent extends Event {
  constructor(type: string, eventInit?: any): void;

  +navigationType: NavigationTypeString;
  +canIntercept: boolean;
  +userInitiated: boolean;
  +hashChange: boolean;
  +hasUAVisualTransition: boolean;
  +destination: NavigationDestination;
  +signal: AbortSignal;
  +formData: FormData | null;
  +downloadRequest: string | null;
  +info?: mixed;

  intercept(options?: NavigationInterceptOptions): void;
  scroll(): void;
}

interface NavigationInterceptOptions {
  handler?: () => Promise<void>;
  focusReset?: 'after-transition' | 'manual';
  scroll?: 'after-transition' | 'manual';
}

declare class NavigationDestination {
  +url: string;
  +key: string | null;
  +id: string | null;
  +index: number;
  +sameDocument: boolean;

  getState(): mixed;
}
