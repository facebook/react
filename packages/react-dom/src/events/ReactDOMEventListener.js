/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var ReactGenericBatching = require('events/ReactGenericBatching');
var ReactErrorUtils = require('shared/ReactErrorUtils');
var ReactFiberTreeReflection = require('shared/ReactFiberTreeReflection');
var ReactTypeOfWork = require('shared/ReactTypeOfWork');
var {HostRoot} = ReactTypeOfWork;

var getEventTarget = require('./getEventTarget');
var ReactDOMComponentTree = require('../client/ReactDOMComponentTree');

var CALLBACK_BOOKKEEPING_POOL_SIZE = 10;
var callbackBookkeepingPool = [];

/**
 * Find the deepest React component completely containing the root of the
 * passed-in instance (for use when entire React trees are nested within each
 * other). If React trees are not nested, returns null.
 */
function findRootContainerNode(inst) {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  while (inst.return) {
    inst = inst.return;
  }
  if (inst.tag !== HostRoot) {
    // This can happen if we're in a detached tree.
    return null;
  }
  return inst.stateNode.containerInfo;
}

// Used to store ancestor hierarchy in top level callback
function getTopLevelCallbackBookKeeping(topLevelType, nativeEvent, targetInst) {
  if (callbackBookkeepingPool.length) {
    const instance = callbackBookkeepingPool.pop();
    instance.topLevelType = topLevelType;
    instance.nativeEvent = nativeEvent;
    instance.targetInst = targetInst;
    return instance;
  }
  return {
    topLevelType,
    nativeEvent,
    targetInst,
    ancestors: [],
  };
}

function releaseTopLevelCallbackBookKeeping(instance) {
  instance.topLevelType = null;
  instance.nativeEvent = null;
  instance.targetInst = null;
  instance.ancestors.length = 0;
  if (callbackBookkeepingPool.length < CALLBACK_BOOKKEEPING_POOL_SIZE) {
    callbackBookkeepingPool.push(instance);
  }
}

function handleTopLevelImpl(bookKeeping) {
  var targetInst = bookKeeping.targetInst;

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  var ancestor = targetInst;
  do {
    if (!ancestor) {
      bookKeeping.ancestors.push(ancestor);
      break;
    }
    var root = findRootContainerNode(ancestor);
    if (!root) {
      break;
    }
    bookKeeping.ancestors.push(ancestor);
    ancestor = ReactDOMComponentTree.getClosestInstanceFromNode(root);
  } while (ancestor);

  for (var i = 0; i < bookKeeping.ancestors.length; i++) {
    targetInst = bookKeeping.ancestors[i];
    ReactDOMEventListener._handleTopLevel(
      bookKeeping.topLevelType,
      targetInst,
      bookKeeping.nativeEvent,
      getEventTarget(bookKeeping.nativeEvent),
    );
  }
}

var ReactDOMEventListener = {
  _enabled: true,
  _handleTopLevel: null,

  setHandleTopLevel: function(handleTopLevel) {
    ReactDOMEventListener._handleTopLevel = handleTopLevel;
  },

  setEnabled: function(enabled) {
    ReactDOMEventListener._enabled = !!enabled;
  },

  isEnabled: function() {
    return ReactDOMEventListener._enabled;
  },

  /**
   * Traps top-level events by using event bubbling.
   *
   * @param {string} topLevelType Record from `BrowserEventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {object} element Element on which to attach listener.
   * @return {?object} An object with a remove function which will forcefully
   *                  remove the listener.
   * @internal
   */
  trapBubbledEvent: function(topLevelType, handlerBaseName, element) {
    if (!element) {
      return null;
    }
    // TODO: Once we have static injection we should just wrap
    // ReactDOMEventListener.dispatchEvent statically so we don't have to do
    // it for every event type.
    var callback = ReactErrorUtils.wrapEventListener(
      handlerBaseName,
      ReactDOMEventListener.dispatchEvent.bind(null, topLevelType),
    );
    if (element.addEventListener) {
      element.addEventListener(handlerBaseName, callback, false);
    } else if (element.attachEvent) {
      element.attachEvent('on' + handlerBaseName, callback);
    }
  },

  /**
   * Traps a top-level event by using event capturing.
   *
   * @param {string} topLevelType Record from `BrowserEventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {object} element Element on which to attach listener.
   * @return {?object} An object with a remove function which will forcefully
   *                  remove the listener.
   * @internal
   */
  trapCapturedEvent: function(topLevelType, handlerBaseName, element) {
    if (!element) {
      return null;
    }
    if (element.addEventListener) {
      // TODO: Once we have static injection we should just wrap
      // ReactDOMEventListener.dispatchEvent statically so we don't have to do
      // it for every event type.
      var callback = ReactErrorUtils.wrapEventListener(
        handlerBaseName,
        ReactDOMEventListener.dispatchEvent.bind(null, topLevelType),
      );
      element.addEventListener(handlerBaseName, callback, true);
    } else {
      if (__DEV__) {
        console.error(
          'Attempted to listen to events during the capture phase on a ' +
            'browser that does not support the capture phase. Your application ' +
            'will not receive some events.',
        );
      }
    }
  },

  dispatchEvent: function(topLevelType, nativeEvent) {
    if (!ReactDOMEventListener._enabled) {
      return;
    }

    var nativeEventTarget = getEventTarget(nativeEvent);
    var targetInst = ReactDOMComponentTree.getClosestInstanceFromNode(
      nativeEventTarget,
    );
    if (
      targetInst !== null &&
      typeof targetInst.tag === 'number' &&
      !ReactFiberTreeReflection.isFiberMounted(targetInst)
    ) {
      // If we get an event (ex: img onload) before committing that
      // component's mount, ignore it for now (that is, treat it as if it was an
      // event on a non-React tree). We might also consider queueing events and
      // dispatching them after the mount.
      targetInst = null;
    }

    var bookKeeping = getTopLevelCallbackBookKeeping(
      topLevelType,
      nativeEvent,
      targetInst,
    );

    try {
      // Event queue being processed in the same cycle allows
      // `preventDefault`.
      ReactGenericBatching.batchedUpdates(handleTopLevelImpl, bookKeeping);
    } finally {
      releaseTopLevelCallbackBookKeeping(bookKeeping);
    }
  },
};

module.exports = ReactDOMEventListener;
