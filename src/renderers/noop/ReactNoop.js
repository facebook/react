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
import type { UpdateQueue } from 'ReactFiberUpdateQueue';

var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactInstanceMap = require('ReactInstanceMap');
var {
  AnimationPriority,
} = require('ReactPriorityLevel');
var emptyObject = require('fbjs/lib/emptyObject');

const UPDATE_SIGNAL = {};

var scheduledAnimationCallback = null;
var scheduledDeferredCallback = null;

type Container = { rootID: string, children: Array<Instance | TextInstance> };
type Props = { prop: any, hidden ?: boolean };
type Instance = {| type: string, id: number, children: Array<Instance | TextInstance>, prop: any |};
type TextInstance = {| text: string, id: number |};

var instanceCounter = 0;

var failInBeginPhase = false;

var NoopRenderer = ReactFiberReconciler({

  getRootHostContext() {
    if (failInBeginPhase) {
      throw new Error('Error in host config.');
    }
    return emptyObject;
  },

  getChildHostContext() {
    return emptyObject;
  },

  getPublicInstance(instance) {
    return instance;
  },

  createInstance(type : string, props : Props) : Instance {
    const inst = {
      id: instanceCounter++,
      type: type,
      children: [],
      prop: props.prop,
    };
    // Hide from unit tests
    Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
    return inst;
  },

  appendInitialChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    parentInstance.children.push(child);
  },

  finalizeInitialChildren(domElement : Instance, type : string, props : Props) : boolean {
    return false;
  },

  prepareUpdate(instance : Instance, type : string, oldProps : Props, newProps : Props) : null | {} {
    return UPDATE_SIGNAL;
  },

  commitMount(instance : Instance, type : string, newProps : Props) : void {
    // Noop
  },

  commitUpdate(instance : Instance, updatePayload : Object, type : string, oldProps : Props, newProps : Props) : void {
    instance.prop = newProps.prop;
  },

  shouldSetTextContent(props : Props) : boolean {
    return (
      typeof props.children === 'string' ||
      typeof props.children === 'number'
    );
  },

  resetTextContent(instance : Instance) : void {},

  shouldDeprioritizeSubtree(type : string, props : Props) : boolean {
    return Boolean(props.hidden);
  },

  createTextInstance(
    text : string,
    rootContainerInstance : Container,
    hostContext : Object,
    internalInstanceHandle : Object
  ) : TextInstance {
    var inst = { text : text, id: instanceCounter++ };
    // Hide from unit tests
    Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
    return inst;
  },

  commitTextUpdate(textInstance : TextInstance, oldText : string, newText : string) : void {
    textInstance.text = newText;
  },

  appendChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  },

  insertBefore(
    parentInstance : Instance | Container,
    child : Instance | TextInstance,
    beforeChild : Instance | TextInstance
  ) : void {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    const beforeIndex = parentInstance.children.indexOf(beforeChild);
    if (beforeIndex === -1) {
      throw new Error('This child does not exist.');
    }
    parentInstance.children.splice(beforeIndex, 0, child);
  },

  removeChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    const index = parentInstance.children.indexOf(child);
    if (index === -1) {
      throw new Error('This child does not exist.');
    }
    parentInstance.children.splice(index, 1);
  },

  scheduleAnimationCallback(callback) {
    if (scheduledAnimationCallback) {
      throw new Error(
        'Scheduling an animation callback twice is excessive. ' +
        'Instead, keep track of whether the callback has already been scheduled.'
      );
    }
    scheduledAnimationCallback = callback;
  },

  scheduleDeferredCallback(callback) {
    if (scheduledDeferredCallback) {
      throw new Error(
        'Scheduling deferred callback twice is excessive. ' +
        'Instead, keep track of whether the callback has already been scheduled.'
      );
    }
    scheduledDeferredCallback = callback;
  },

  prepareForCommit() : void {
  },

  resetAfterCommit() : void {
  },

});

var rootContainers = new Map();
var roots = new Map();
var DEFAULT_ROOT_ID = '<default>';

var ReactNoop = {

  getChildren(rootID : string = DEFAULT_ROOT_ID) {
    const container = rootContainers.get(rootID);
    if (container) {
      return container.children;
    } else {
      return null;
    }
  },

  // Shortcut for testing a single root
  render(element : ReactElement<any>, callback: ?Function) {
    ReactNoop.renderToRootWithID(element, DEFAULT_ROOT_ID, callback);
  },

  renderToRootWithID(element : ReactElement<any>, rootID : string, callback : ?Function) {
    let root = roots.get(rootID);
    if (!root) {
      const container = { rootID: rootID, children: [] };
      rootContainers.set(rootID, container);
      root = NoopRenderer.createContainer(container);
      roots.set(rootID, root);
    }
    NoopRenderer.updateContainer(element, root, null, callback);
  },

  unmountRootWithID(rootID : string) {
    const root = roots.get(rootID);
    if (root) {
      NoopRenderer.updateContainer(null, root, null, () => {
        roots.delete(rootID);
        rootContainers.delete(rootID);
      });
    }
  },

  findInstance(componentOrElement : Element | ?ReactComponent<any, any, any>) : null | Instance | TextInstance {
    if (componentOrElement == null) {
      return null;
    }
    // Unsound duck typing.
    const component = (componentOrElement : any);
    if (typeof component.id === 'number') {
      return component;
    }
    const inst = ReactInstanceMap.get(component);
    return inst ? NoopRenderer.findHostInstance(inst) : null;
  },

  flushAnimationPri() {
    var cb = scheduledAnimationCallback;
    if (cb === null) {
      return;
    }
    scheduledAnimationCallback = null;
    cb();
  },

  flushDeferredPri(timeout : number = Infinity) {
    var cb = scheduledDeferredCallback;
    if (cb === null) {
      return;
    }
    scheduledDeferredCallback = null;
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
    ReactNoop.flushAnimationPri();
    ReactNoop.flushDeferredPri();
  },

  performAnimationWork(fn: Function) {
    NoopRenderer.performWithPriority(AnimationPriority, fn);
  },

  batchedUpdates: NoopRenderer.batchedUpdates,

  unbatchedUpdates: NoopRenderer.unbatchedUpdates,

  syncUpdates: NoopRenderer.syncUpdates,

  // Logs the current state of the tree.
  dumpTree(rootID : string = DEFAULT_ROOT_ID) {
    const root = roots.get(rootID);
    const rootContainer = rootContainers.get(rootID);
    if (!root || !rootContainer) {
      console.log('Nothing rendered yet.');
      return;
    }

    var bufferedLog = [];
    function log(...args) {
      bufferedLog.push(...args, '\n');
    }

    function logHostInstances(children: Array<Instance | TextInstance>, depth) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var indent = '  '.repeat(depth);
        if (typeof child.text === 'string') {
          log(indent + '- ' + child.text);
        } else {
          // $FlowFixMe - The child should've been refined now.
          log(indent + '- ' + child.type + '#' + child.id);
          // $FlowFixMe - The child should've been refined now.
          logHostInstances(child.children, depth + 1);
        }
      }
    }
    function logContainer(container : Container, depth) {
      log('  '.repeat(depth) + '- [root#' + container.rootID + ']');
      logHostInstances(container.children, depth + 1);
    }

    function logUpdateQueue(updateQueue : UpdateQueue, depth) {
      log(
        '  '.repeat(depth + 1) + 'QUEUED UPDATES'
      );
      const firstUpdate = updateQueue.first;
      if (!firstUpdate) {
        return;
      }

      log(
        '  '.repeat(depth + 1) + '~',
        firstUpdate && firstUpdate.partialState,
        firstUpdate.callback ? 'with callback' : '',
        '[' + firstUpdate.priorityLevel + ']'
      );
      var next;
      while (next = firstUpdate.next) {
        log(
          '  '.repeat(depth + 1) + '~',
          next.partialState,
          next.callback ? 'with callback' : '',
          '[' + firstUpdate.priorityLevel + ']'
        );
      }
    }

    function logFiber(fiber : Fiber, depth) {
      log(
        '  '.repeat(depth) + '- ' + (fiber.type ? fiber.type.name || fiber.type : '[root]'),
        '[' + fiber.pendingWorkPriority + (fiber.pendingProps ? '*' : '') + ']'
      );
      if (fiber.updateQueue) {
        logUpdateQueue(fiber.updateQueue, depth);
      }
      const childInProgress = fiber.progressedChild;
      if (childInProgress && childInProgress !== fiber.child) {
        log('  '.repeat(depth + 1) + 'IN PROGRESS: ' + fiber.progressedPriority);
        logFiber(childInProgress, depth + 1);
        if (fiber.child) {
          log('  '.repeat(depth + 1) + 'CURRENT');
        }
      } else if (fiber.child && fiber.updateQueue) {
        log('  '.repeat(depth + 1) + 'CHILDREN');
      }
      if (fiber.child) {
        logFiber(fiber.child, depth + 1);
      }
      if (fiber.sibling) {
        logFiber(fiber.sibling, depth);
      }
    }

    log('HOST INSTANCES:');
    logContainer(rootContainer, 0);
    log('FIBERS:');
    logFiber(root.current, 0);

    console.log(...bufferedLog);
  },

  simulateErrorInHostConfig(fn : () => void) {
    failInBeginPhase = true;
    try {
      fn();
    } finally {
      failInBeginPhase = false;
    }
  },

};

module.exports = ReactNoop;
