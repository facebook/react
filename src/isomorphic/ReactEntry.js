/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactEntry
 */

'use strict';

import {
  Component,
  PureComponent,
  AsyncComponent as unstable_AsyncComponent,
} from 'ReactBaseClasses';
import {forEach, map, count, toArray, only} from 'ReactChildren';
import {
  createElement,
  createFactory,
  cloneElement,
  isValidElement,
} from 'ReactElement';
import {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} from 'ReactElementValidator';
import ReactCurrentOwner from 'ReactCurrentOwner';
import ReactVersion from 'ReactVersion';
import * as ReactDebugCurrentFrame from 'ReactDebugCurrentFrame';

var React = {
  Children: {
    map,
    forEach,
    count,
    toArray,
    only,
  },

  Component,
  PureComponent,
  unstable_AsyncComponent,

  createElement: __DEV__ ? createElementWithValidation : createElement,
  cloneElement: __DEV__ ? cloneElementWithValidation : cloneElement,
  createFactory: __DEV__ ? createFactoryWithValidation : createFactory,
  isValidElement: isValidElement,

  version: ReactVersion,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner,
  },
};

if (__DEV__) {
  Object.assign(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
    // These should not be included in production.
    ReactDebugCurrentFrame,
  });
}

export default React;
