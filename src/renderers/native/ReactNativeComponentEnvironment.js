/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeComponentEnvironment
 * @flow
 */
'use strict';

var ReactNativeDOMIDOperations = require('ReactNativeDOMIDOperations');
var ReactNativeReconcileTransaction = require('ReactNativeReconcileTransaction');

var ReactNativeComponentEnvironment = {
  processChildrenUpdates: ReactNativeDOMIDOperations.dangerouslyProcessChildrenUpdates,

  replaceNodeWithMarkup: ReactNativeDOMIDOperations.dangerouslyReplaceNodeWithMarkupByID,

  /**
   * @param {DOMElement} Element to clear.
   */
  clearNode: function(/*containerView*/) {},

  ReactReconcileTransaction: ReactNativeReconcileTransaction,
};

module.exports = ReactNativeComponentEnvironment;
