/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule React
 */

import ReactBaseClasses from 'ReactBaseClasses';
import ReactChildren from 'ReactChildren';
import {
  createElement,
  createFactory,
  cloneElement,
} from 'ReactElement';
import ReactVersion from 'ReactVersion';
import onlyChild from 'onlyChild';
import ReactElementValidator from 'ReactElementValidator';
import ReactComponentTreeHook from 'ReactComponentTreeHook';
import ReactDebugCurrentFrame from 'ReactDebugCurrentFrame';
import ReactCurrentOwner from 'ReactCurrentOwner';

const React = {
  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    count: ReactChildren.count,
    toArray: ReactChildren.toArray,
    only: onlyChild,
  },

  Component: ReactBaseClasses.Component,
  PureComponent: ReactBaseClasses.PureComponent,

  createElement: createElement,
  cloneElement: cloneElement,
  isValidElement: ReactElement.isValidElement,

  createFactory: createFactory,

  version: ReactVersion,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner,
  },
};

if (__DEV__) {
  React.createElement = ReactElementValidator.createElement;
  React.createFactory = ReactElementValidator.createFactory;
  React.cloneElement = ReactElementValidator.cloneElement;
  Object.assign(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
    // These should not be included in production.
    ReactComponentTreeHook,
    ReactDebugCurrentFrame,
  });
}

export default React;
