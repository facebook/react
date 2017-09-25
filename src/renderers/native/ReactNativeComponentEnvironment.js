/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeComponentEnvironment
 * @flow
 */
'use strict';

var ReactNativeDOMIDOperations = require('ReactNativeDOMIDOperations');
var ReactNativeReconcileTransaction = require('ReactNativeReconcileTransaction');

var ReactNativeComponentEnvironment = {
  processChildrenUpdates:
    ReactNativeDOMIDOperations.dangerouslyProcessChildrenUpdates,

  replaceNodeWithMarkup:
    ReactNativeDOMIDOperations.dangerouslyReplaceNodeWithMarkupByID,

  /**
   * @param {DOMElement} Element to clear.
   */
  clearNode: function(/*containerView*/) {},

  ReactReconcileTransaction: ReactNativeReconcileTransaction,
};

module.exports = ReactNativeComponentEnvironment;
