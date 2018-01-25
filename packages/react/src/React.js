/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import assign from 'object-assign';
import ReactVersion from 'shared/ReactVersion';
import {REACT_FRAGMENT_TYPE, REACT_STRICT_MODE_TYPE} from 'shared/ReactSymbols';

import {AsyncComponent, Component, PureComponent} from './ReactBaseClasses';
import {forEach, map, count, toArray, only} from './ReactChildren';
import ReactCurrentOwner from './ReactCurrentOwner';
import {
  createElement,
  createFactory,
  cloneElement,
  isValidElement,
} from './ReactElement';
import {createContext} from 'shared/ReactContext';
import {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} from './ReactElementValidator';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';
import {enableNewContextAPI} from 'shared/ReactFeatureFlags';

const React = {
  Children: {
    map,
    forEach,
    count,
    toArray,
    only,
  },

  Component,
  PureComponent,
  unstable_AsyncComponent: AsyncComponent,

  Fragment: REACT_FRAGMENT_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,

  createElement: __DEV__ ? createElementWithValidation : createElement,
  cloneElement: __DEV__ ? cloneElementWithValidation : cloneElement,
  createFactory: __DEV__ ? createFactoryWithValidation : createFactory,
  isValidElement: isValidElement,

  version: ReactVersion,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner,
    // Used by renderers to avoid bundling object-assign twice in UMD bundles:
    assign,
  },
};

if (enableNewContextAPI) {
  React.unstable_createContext = createContext;
}

if (__DEV__) {
  Object.assign(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
    // These should not be included in production.
    ReactDebugCurrentFrame,
    // Shim for React DOM 16.0.0 which still destructured (but not used) this.
    // TODO: remove in React 17.0.
    ReactComponentTreeHook: {},
  });
}

export default React;
