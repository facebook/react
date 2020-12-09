/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

declare module 'create-react-class' {
  declare var exports: React$CreateClass;
}

declare var trustedTypes: {|
  isHTML: (value: any) => boolean,
  isScript: (value: any) => boolean,
  isScriptURL: (value: any) => boolean,
  // TrustedURLs are deprecated and will be removed soon: https://github.com/WICG/trusted-types/pull/204
  isURL?: (value: any) => boolean,
|};

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
  declare var Pool: (
    options: mixed,
  ) => {
    query: (query: string, values?: Array<mixed>) => void,
  };
}

declare module 'pg/lib/utils' {
  declare module.exports: {
    prepareValue(val: any): mixed,
  };
}
