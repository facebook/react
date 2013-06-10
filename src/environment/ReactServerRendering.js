/**
 * @typechecks
 * @providesModule ReactServerRendering
 */
"use strict";

var ReactReconcileTransaction = require('ReactReconcileTransaction');
var ReactInstanceHandles = require('ReactInstanceHandles');

/**
 * @param {object} component
 * @param {function} callback
 */
function renderComponentToString(component, callback) {
  // We use a callback API to keep the API async in case in the future we ever
  // need it, but in reality this is a synchronous operation.
  var id = ReactInstanceHandles.createReactRootID();
  var transaction = ReactReconcileTransaction.getPooled();
  transaction.reinitializeTransaction();
  try {
    transaction.perform(function() {
      callback(component.mountComponent(id, transaction));
    }, null);
  } finally {
    ReactReconcileTransaction.release(transaction);
  }
}

module.exports = {
  renderComponentToString: renderComponentToString
};
