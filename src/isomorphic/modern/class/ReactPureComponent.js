/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPureComponent
 */

'use strict';

var ReactComponent = require('ReactComponent');

/**
 * Base class helpers for the updating state of a component.
 */
function ReactPureComponent(props, context, updater) {
  ReactComponent.call(this, props, context, updater);
}

Object.assign(ReactPureComponent.prototype, ReactComponent.prototype);
ReactPureComponent.prototype.isPureReactComponent = true;

module.exports = ReactPureComponent;
