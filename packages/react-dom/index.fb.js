/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var ReactDOM = require('./src/client/ReactDOM');

Object.assign(ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
  // These are real internal dependencies that are trickier to remove:
  ReactBrowserEventEmitter: require('./src/events/ReactBrowserEventEmitter'),
  ReactErrorUtils: require('shared/ReactErrorUtils'),
  // TODO: direct imports like some-package/src/* are bad. Fix me.
  ReactFiberErrorLogger: require('react-reconciler/src/ReactFiberErrorLogger'),
  ReactFiberTreeReflection: require('shared/ReactFiberTreeReflection'),
  ReactDOMComponentTree: require('./src/client/ReactDOMComponentTree'),
  ReactInstanceMap: require('shared/ReactInstanceMap'),
  // These are dependencies of TapEventPlugin:
  EventPluginUtils: require('events/EventPluginUtils'),
  EventPropagators: require('events/EventPropagators'),
  SyntheticUIEvent: require('./src/events/SyntheticUIEvent'),
});

module.exports = ReactDOM;
