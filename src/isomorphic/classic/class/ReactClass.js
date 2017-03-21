/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactClass
 */

'use strict';

var ReactComponent = require('ReactComponent');
var ReactElement = require('ReactElement');
var ReactNoopUpdateQueue = require('ReactNoopUpdateQueue');

var warning = require('warning');

var factory = require('react-create-class/factory');

var createClass = factory(
  ReactComponent,
  ReactElement.isValidElement,
  ReactNoopUpdateQueue
);

let didWarnDeprecated = false;

module.exports = {
  createClass(...args) {
    if (__DEV__) {
      warning(
        didWarnDeprecated,
        'React.createClass is deprecated and will be removed in version 16. ' +
        'Use plain JavaScript classes instead. If you\'re not yet ready to ' +
        'migrate, react-create-class is available on npm as a ' +
        'drop-in replacement.'
      );
      didWarnDeprecated = true;
    }
    return createClass(...args);
  },
};
