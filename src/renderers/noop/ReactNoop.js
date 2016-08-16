/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNoop
 * @flow
 */

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { HostChildren } from 'ReactFiberReconciler';

var ReactFiberReconciler = require('ReactFiberReconciler');

var scheduledHighPriCallback = null;
var scheduledLowPriCallback = null;

const TERMINAL_TAG = 99;

type Container = { rootID: number, children: Array<Instance> };
type Props = { prop: any };
type Instance = { tag: 99, type: string, id: number, children: Array<Instance>, prop: any };

var instanceCounter = 0;

function recursivelyAppendChildren(flatArray : Array<Instance>, child : HostChildren<Instance>) {
  if (!child) {
    return;
  }
  if (child.tag === TERMINAL_TAG) {
    flatArray.push(child);
  } else {
    let node = child;
    do {
      recursivelyAppendChildren(flatArray, node.output);
    } while (node = node.sibling);
  }
}

function flattenChildren(children : HostChildren<Instance>) {
  const flatArray = [];
  recursivelyAppendChildren(flatArray, children);
  return flatArray;
}

var NoopRenderer = ReactFiberReconciler({

  updateContainer(containerInfo : Container, children : HostChildren<Instance>) : void {
    containerInfo.children = flattenChildren(children);
  },

  createInstance(type : string, props : Props, children : HostChildren<Instance>) : Instance {
    const inst = {
      tag: TERMINAL_TAG,
      id: instanceCounter++,
      type: type,
      children: flattenChildren(children),
      prop: props.prop,
    };
    // Hide from unit tests
    Object.defineProperty(inst, 'tag', { value: inst.tag, enumerable: false });
    Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
    return inst;
  },

  prepareUpdate(instance : Instance, oldProps : Props, newProps : Props, children : HostChildren<Instance>) : boolean {
    return true;
  },

  commitUpdate(instance : Instance, oldProps : Props, newProps : Props, children : HostChildren<Instance>) : void {
    instance.children = flattenChildren(children);
    instance.prop = newProps.prop;
  },

  deleteInstance(instance : Instance) : void {
  },

  scheduleHighPriCallback(callback) {
    scheduledHighPriCallback = callback;
  },

  scheduleLowPriCallback(callback) {
    scheduledLowPriCallback = callback;
  },

});

var rootContainer = { rootID: 0, children: [] };

var root = null;

var ReactNoop = {

  root: rootContainer,

  render(element : ReactElement<any>) {
    if (!root) {
      root = NoopRenderer.mountContainer(element, rootContainer);
    } else {
      NoopRenderer.updateContainer(element, root);
    }
  },

  flushHighPri() {
    var cb = scheduledHighPriCallback;
    if (cb === null) {
      return;
    }
    scheduledHighPriCallback = null;
    cb();
  },

  flushLowPri(timeout : number = Infinity) {
    var cb = scheduledLowPriCallback;
    if (cb === null) {
      return;
    }
    scheduledLowPriCallback = null;
    var timeRemaining = timeout;
    cb({
      timeRemaining() {
        // Simulate a fix amount of time progressing between each call.
        timeRemaining -= 5;
        if (timeRemaining < 0) {
          timeRemaining = 0;
        }
        return timeRemaining;
      },
    });
  },

  flush() {
    ReactNoop.flushHighPri();
    ReactNoop.flushLowPri();
  },

  // Logs the current state of the tree.
  dumpTree() {
    if (!root) {
      console.log('Nothing rendered yet.');
      return;
    }

    function logHostInstances(children: Array<Instance>, depth) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        console.log('  '.repeat(depth) + '- ' + child.type + '#' + child.id);
        logHostInstances(child.children, depth + 1);
      }
    }
    function logContainer(container : Container, depth) {
      console.log('  '.repeat(depth) + '- [root#' + container.rootID + ']');
      logHostInstances(container.children, depth + 1);
    }

    function logFiber(fiber : Fiber, depth) {
      console.log(
        '  '.repeat(depth) + '- ' + (fiber.type ? fiber.type.name || fiber.type : '[root]'),
        '[' + fiber.pendingWorkPriority + (fiber.pendingProps ? '*' : '') + ']'
      );
      const childInProgress = fiber.childInProgress;
      if (childInProgress) {
        if (childInProgress === fiber.child) {
          console.log('  '.repeat(depth + 1) + 'ERROR: IN PROGRESS == CURRENT');
        } else {
          console.log('  '.repeat(depth + 1) + 'IN PROGRESS');
          logFiber(childInProgress, depth + 1);
          if (fiber.child) {
            console.log('  '.repeat(depth + 1) + 'CURRENT');
          }
        }
      }
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
    logFiber((root.stateNode : any).current, 0);
  },

};

module.exports = ReactNoop;
