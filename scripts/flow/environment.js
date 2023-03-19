/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable */

declare var __PROFILE__: boolean;
declare var __UMD__: boolean;
declare var __EXPERIMENTAL__: boolean;
declare var __VARIANT__: boolean;

declare var __REACT_DEVTOOLS_GLOBAL_HOOK__: any; /*?{
  inject: ?((stuff: Object) => void)
};*/

declare var globalThis: Object;

declare var queueMicrotask: (fn: Function) => void;
declare var reportError: (error: mixed) => void;
declare var AggregateError: Class<Error>;

declare module 'create-react-class' {
  declare var exports: React$CreateClass;
}

declare var trustedTypes: {
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
declare function __webpack_require__(id: string): any;

declare module 'fs/promises' {
  declare var access: (path: string, mode?: number) => Promise<void>;
  declare var lstat: (
    path: string,
    options?: ?{bigint?: boolean},
  ) => Promise<mixed>;
  declare var readdir: (
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
          withFileTypes?: ?boolean,
        },
  ) => Promise<Buffer>;
  declare var readFile: (
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
        },
  ) => Promise<Buffer>;
  declare var readlink: (
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
        },
  ) => Promise<mixed>;
  declare var realpath: (
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
        },
  ) => Promise<mixed>;
  declare var stat: (
    path: string,
    options?: ?{bigint?: boolean},
  ) => Promise<mixed>;
}
declare module 'pg' {
  declare var Pool: (options: mixed) => {
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

declare class AsyncLocalStorage<T> {
  disable(): void;
  getStore(): T | void;
  run(store: T, callback: (...args: any[]) => void, ...args: any[]): void;
  enterWith(store: T): void;
}

declare module 'async_hooks' {
  declare class AsyncLocalStorage<T> {
    disable(): void;
    getStore(): T | void;
    run(store: T, callback: (...args: any[]) => void, ...args: any[]): void;
    enterWith(store: T): void;
  }
}

declare module 'node:worker_threads' {
  declare class MessageChannel {
    port1: MessagePort;
    port2: MessagePort;
  }
}
