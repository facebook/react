/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var ReactDOMFiber = require('ReactDOMFiberEntry');

Object.assign(
  ReactDOMFiber.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  {
    ReactErrorUtils: require('ReactErrorUtils'),
    // This is used for ajaxify on www:
    DOMProperty: require('DOMProperty'),
    // used by react-fb/ReactDOM on FB www
    ReactFiberErrorLogger: require('ReactFiberErrorLogger'),
    // ReactInstanceMap are used to track instances
    // for reactComponentExpect and ReactLayeredComponentMixin_DEPRECATED
    ReactInstanceMap: require('ReactInstanceMap'),
    // These are dependencies of TapEventPlugin:
    EventPluginUtils: require('EventPluginUtils'),
    EventPropagators: require('EventPropagators'),
    SyntheticUIEvent: require('SyntheticUIEvent'),
  },
);

if (__DEV__) {
  Object.assign(
    ReactDOMFiber.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    {
      // ReactFiberTreeReflection is only used in reactComponentExpect
      // and internal Enzyme so this should be DEV only
      ReactFiberTreeReflection: require('ReactFiberTreeReflection'),
    },
  );
}

module.exports = ReactDOMFiber;
