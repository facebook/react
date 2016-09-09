/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNoop
 * 
 */

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

'use strict';

var ReactFiberReconciler = require('./ReactFiberReconciler');

var scheduledHighPriCallback = null;
var scheduledLowPriCallback = null;

var TERMINAL_TAG = 99;

var instanceCounter = 0;

function recursivelyAppendChildren(flatArray, child) {
  if (!child) {
    return;
  }
  if (child.tag === TERMINAL_TAG) {
    flatArray.push(child);
  } else {
    var node = child;
    do {
      recursivelyAppendChildren(flatArray, node.output);
    } while (node = node.sibling);
  }
}

function flattenChildren(children) {
  var flatArray = [];
  recursivelyAppendChildren(flatArray, children);
  return flatArray;
}

var NoopRenderer = ReactFiberReconciler({
  updateContainer: function (containerInfo, children) {
    console.log('Update container #' + containerInfo.rootID);
    containerInfo.children = flattenChildren(children);
  },
  createInstance: function (type, props, children) {
    console.log('Create instance #' + instanceCounter);
    var inst = {
      tag: TERMINAL_TAG,
      id: instanceCounter++,
      type: type,
      children: flattenChildren(children)
    };
    // Hide from unit tests
    Object.defineProperty(inst, 'tag', { value: inst.tag, enumerable: false });
    Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
    return inst;
  },
  prepareUpdate: function (instance, oldProps, newProps, children) {
    console.log('Prepare for update on #' + instance.id);
    return true;
  },
  commitUpdate: function (instance, oldProps, newProps, children) {
    console.log('Commit update on #' + instance.id);
    instance.children = flattenChildren(children);
  },
  deleteInstance: function (instance) {
    console.log('Delete #' + instance.id);
  },
  scheduleHighPriCallback: function (callback) {
    scheduledHighPriCallback = callback;
  },
  scheduleLowPriCallback: function (callback) {
    scheduledLowPriCallback = callback;
  }
});

var rootContainer = { rootID: 0, children: [] };

var root = null;

var ReactNoop = {

  root: rootContainer,

  render: function (element) {
    if (!root) {
      root = NoopRenderer.mountContainer(element, rootContainer);
    } else {
      NoopRenderer.updateContainer(element, root);
    }
  },
  flushHighPri: function () {
    var cb = scheduledHighPriCallback;
    if (cb === null) {
      return;
    }
    scheduledHighPriCallback = null;
    cb();
  },
  flushLowPri: function () {
    var timeout = arguments.length <= 0 || arguments[0] === undefined ? Infinity : arguments[0];

    var cb = scheduledLowPriCallback;
    if (cb === null) {
      return;
    }
    scheduledLowPriCallback = null;
    var timeRemaining = timeout;
    cb({
      timeRemaining: function () {
        // Simulate a fix amount of time progressing between each call.
        timeRemaining -= 5;
        if (timeRemaining < 0) {
          timeRemaining = 0;
        }
        return timeRemaining;
      }
    });
  },
  flush: function () {
    ReactNoop.flushHighPri();
    ReactNoop.flushLowPri();
  },


  // Logs the current state of the tree.
  dumpTree: function () {
    if (!root) {
      console.log('Nothing rendered yet.');
      return;
    }

    function logHostInstances(children, depth) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        console.log('  '.repeat(depth) + '- ' + child.type + '#' + child.id);
        logHostInstances(child.children, depth + 1);
      }
    }
    function logContainer(container, depth) {
      console.log('  '.repeat(depth) + '- [root#' + container.rootID + ']');
      logHostInstances(container.children, depth + 1);
    }

    function logFiber(fiber, depth) {
      console.log('  '.repeat(depth) + '- ' + (fiber.type ? fiber.type.name || fiber.type : '[root]'), '[' + fiber.pendingWorkPriority + (fiber.pendingProps ? '*' : '') + ']');
      if (fiber.child) {
        logFiber(fiber.child, depth + 1);
      }
      if (fiber.sibling) {
        logFiber(fiber.sibling, depth);
      }
    }

    console.log('HOST INSTANCES:');
    logContainer(rootContainer, 0);
    console.log('FIBERS:');
    logFiber(root.stateNode.current, 0);
  }
};

module.exports = ReactNoop;