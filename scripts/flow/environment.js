/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable */

declare var __PROFILE__: boolean;

declare var __REACT_DEVTOOLS_GLOBAL_HOOK__: any; /*?{
  inject: ?((stuff: Object) => void)
};*/

// ReactFeatureFlags www fork
declare module 'ReactFeatureFlags' {
  declare module.exports: any;
}

// ReactFiberErrorDialog www fork
declare module 'ReactFiberErrorDialog' {
  declare module.exports: {
    showErrorDialog: (error: mixed) => boolean,
  };
}

// EventListener www fork
declare module 'EventListener' {
  declare module.exports: {
    listen: (target: Element, type: string, callback: Function) => mixed,
    capture: (target: Element, type: string, callback: Function) => mixed,
  };
}
