/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactReconciler
 */

'use strict';

var ReactRef = require('ReactRef');
var ReactInstrumentation = require('ReactInstrumentation');

var warning = require('fbjs/lib/warning');

/**
 * Helper to call ReactRef.attachRefs with this composite component, split out
 * to avoid allocations in the transaction mount-ready queue.
 */
function attachRefs() {
  ReactRef.attachRefs(this, this._currentElement);
}

var ReactReconciler = {
  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {?object} the containing host component instance
   * @param {?object} info about the host container
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: function(
    internalInstance,
    transaction,
    hostParent,
    hostContainerInfo,
    context,
    parentDebugID, // 0 in production and for roots
  ) {
    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onBeforeMountComponent(
          internalInstance._debugID,
          internalInstance._currentElement,
          parentDebugID,
        );
      }
    }
    var markup = internalInstance.mountComponent(
      transaction,
      hostParent,
      hostContainerInfo,
      context,
      parentDebugID,
    );
    if (
      internalInstance._currentElement &&
      internalInstance._currentElement.ref != null
    ) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
    }
    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onMountComponent(
          internalInstance._debugID,
        );
      }
    }
    return markup;
  },

  /**
   * Returns a value that can be passed to
   * ReactComponentEnvironment.replaceNodeWithMarkup.
   */
  getHostNode: function(internalInstance) {
    return internalInstance.getHostNode();
  },

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function(internalInstance, safely, skipLifecycle) {
    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onBeforeUnmountComponent(
          internalInstance._debugID,
        );
      }
    }
    ReactRef.detachRefs(internalInstance, internalInstance._currentElement);
    internalInstance.unmountComponent(safely, skipLifecycle);
    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onUnmountComponent(
          internalInstance._debugID,
        );
      }
    }
  },

  /**
   * Update a component using a new element.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactElement} nextElement
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @internal
   */
  receiveComponent: function(
    internalInstance,
    nextElement,
    transaction,
    context,
  ) {
    var prevElement = internalInstance._currentElement;

    if (nextElement === prevElement && context === internalInstance._context) {
      // Since elements are immutable after the owner is rendered,
      // we can do a cheap identity compare here to determine if this is a
      // superfluous reconcile. It's possible for state to be mutable but such
      // change should trigger an update of the owner which would recreate
      // the element. We explicitly check for the existence of an owner since
      // it's possible for an element created outside a composite to be
      // deeply mutated and reused.

      // TODO: Bailing out early is just a perf optimization right?
      // TODO: Removing the return statement should affect correctness?
      return;
    }

    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onBeforeUpdateComponent(
          internalInstance._debugID,
          nextElement,
        );
      }
    }

    var refsChanged = ReactRef.shouldUpdateRefs(prevElement, nextElement);

    if (refsChanged) {
      ReactRef.detachRefs(internalInstance, prevElement);
    }

    internalInstance.receiveComponent(nextElement, transaction, context);

    if (
      refsChanged &&
      internalInstance._currentElement &&
      internalInstance._currentElement.ref != null
    ) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
    }

    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onUpdateComponent(
          internalInstance._debugID,
        );
      }
    }
  },

  /**
   * Flush any dirty changes in a component.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function(
    internalInstance,
    transaction,
    updateBatchNumber,
  ) {
    if (internalInstance._updateBatchNumber !== updateBatchNumber) {
      // The component's enqueued batch number should always be the current
      // batch or the following one.
      warning(
        internalInstance._updateBatchNumber == null ||
          internalInstance._updateBatchNumber === updateBatchNumber + 1,
        'performUpdateIfNecessary: Unexpected batch number (current %s, ' +
          'pending %s)',
        updateBatchNumber,
        internalInstance._updateBatchNumber,
      );
      return;
    }
    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onBeforeUpdateComponent(
          internalInstance._debugID,
          internalInstance._currentElement,
        );
      }
    }
    internalInstance.performUpdateIfNecessary(transaction);
    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onUpdateComponent(
          internalInstance._debugID,
        );
      }
    }
  },
};

module.exports = ReactReconciler;
