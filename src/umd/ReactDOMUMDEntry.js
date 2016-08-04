/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMUMDEntry
 */

'use strict';

var ReactDOM = require('ReactDOM');

var ReactDOMUMDEntry = Object.assign({
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactInstanceMap: require('ReactInstanceMap'),
  },
}, ReactDOM);

if (__DEV__) {
  // These are used by ReactTestUtils in ReactWithAddons. Ugh.
  Object.assign(
    ReactDOMUMDEntry.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    {
      EventConstants: require('EventConstants'),
      EventPluginHub: require('EventPluginHub'),
      EventPluginRegistry: require('EventPluginRegistry'),
      EventPropagators: require('EventPropagators'),
      ReactDefaultInjection: require('ReactDefaultInjection'),
      ReactDOMComponentTree: require('ReactDOMComponentTree'),
      ReactBrowserEventEmitter: require('ReactBrowserEventEmitter'),
      ReactCompositeComponent: require('ReactCompositeComponent'),
      ReactInstrumentation: require('ReactInstrumentation'),
      ReactReconciler: require('ReactReconciler'),
      ReactUpdates: require('ReactUpdates'),
      SyntheticEvent: require('SyntheticEvent'),
      findDOMNode: require('findDOMNode'),
    }
  );
}

module.exports = ReactDOMUMDEntry;
