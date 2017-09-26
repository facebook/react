/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var ReactDOMFiber = require('ReactDOMFiberEntry');

Object.assign(
  ReactDOMFiber.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  {
    // These are real internal dependencies that are trickier to remove:
    ReactBrowserEventEmitter: require('ReactBrowserEventEmitter'),
    ReactErrorUtils: require('ReactErrorUtils'),
    ReactFiberErrorLogger: require('ReactFiberErrorLogger'),
    ReactFiberTreeReflection: require('ReactFiberTreeReflection'),
    ReactDOMComponentTree: require('ReactDOMComponentTree'),
    ReactInstanceMap: require('ReactInstanceMap'),
    // This is used for ajaxify on www:
    DOMProperty: require('DOMProperty'),
    // These are dependencies of TapEventPlugin:
    EventPluginUtils: require('EventPluginUtils'),
    EventPropagators: require('EventPropagators'),
    SyntheticUIEvent: require('SyntheticUIEvent'),
  },
);

module.exports = ReactDOMFiber;
