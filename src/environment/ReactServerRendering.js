/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @typechecks static-only
 * @providesModule ReactServerRendering
 */
"use strict";

var ReactComponent = require('ReactComponent');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactMarkupChecksum = require('ReactMarkupChecksum');
var ReactReconcileTransaction = require('ReactReconcileTransaction');
var ReactServerRenderingUnmountableTransaction =
  require('ReactServerRenderingUnmountableTransaction');

var invariant = require('invariant');

function validateRenderParameters(methodName, component, callback) {
  invariant(
    ReactComponent.isValidComponent(component),
    '%s(): You must pass a valid ReactComponent.',
    methodName
  );

  invariant(
    typeof callback === 'function',
    '%s(): You must pass a function as a callback.',
    methodName
  );
}

/**
 * @param {ReactComponent} component
 * @param {function} callback
 */
function renderComponentToString(component, callback) {
  // We use a callback API to keep the API async in case in the future we ever
  // need it, but in reality this is a synchronous operation.
  validateRenderParameters('renderComponentToString', component, callback);
  var id = ReactInstanceHandles.createReactRootID();
  var transaction = ReactReconcileTransaction.getPooled();
  transaction.reinitializeTransaction();
  try {
    transaction.perform(function() {
      var markup = component.mountComponent(id, transaction, 0);
      markup = ReactMarkupChecksum.addChecksumToMarkup(markup);
      callback(markup);
    }, null);
  } finally {
    ReactReconcileTransaction.release(transaction);
  }
}

/**
 * @param {ReactComponent} component
 * @param {function} callback
 */
function renderComponentToUnmountableString(component, callback) {
  // We use a callback API to keep the API async in case in the future we ever
  // need it, but in reality this is a synchronous operation.
  validateRenderParameters(
    'renderComponentToUnmountableString',
    component,
    callback
  );
  var id = ReactInstanceHandles.createReactRootID();
  var transaction = ReactServerRenderingUnmountableTransaction.getPooled();
  transaction.reinitializeTransaction();
  try {
    transaction.perform(function() {
      var markup = component.mountComponent(id, transaction, 0);
      callback(markup);
    }, null);
  } finally {
    ReactServerRenderingUnmountableTransaction.release(transaction);
  }
}

module.exports = {
  renderComponentToString: renderComponentToString,
  renderComponentToUnmountableString: renderComponentToUnmountableString,
};
