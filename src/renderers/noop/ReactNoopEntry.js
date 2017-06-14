/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNoopEntry
 * @flow
 */

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {UpdateQueue} from 'ReactFiberUpdateQueue';

var ReactFiberInstrumentation = require('ReactFiberInstrumentation');
var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactInstanceMap = require('ReactInstanceMap');
var {AnimationPriority} = require('ReactPriorityLevel');
var emptyObject = require('fbjs/lib/emptyObject');

var expect = require('jest-matchers');

const UPDATE_SIGNAL = {};

var scheduledAnimationCallback = null;
var scheduledDeferredCallback = null;

type Container = {rootID: string, children: Array<Instance | TextInstance>};
type Props = {prop: any, hidden?: boolean};
type Instance = {|
  type: string,
  id: number,
  children: Array<Instance | TextInstance>,
  prop: any,
|};
type TextInstance = {|text: string, id: number|};

var instanceCounter = 0;

var failInBeginPhase = false;

function appendChild(
  parentInstance: Instance | Container,
  child: Instance | TextInstance,
): void {
  const index = parentInstance.children.indexOf(child);
  if (index !== -1) {
    parentInstance.children.splice(index, 1);
  }
  parentInstance.children.push(child);
}

function insertBefore(
  parentInstance: Instance | Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance,
): void {
  const index = parentInstance.children.indexOf(child);
  if (index !== -1) {
    parentInstance.children.splice(index, 1);
  }
  const beforeIndex = parentInstance.children.indexOf(beforeChild);
  if (beforeIndex === -1) {
    throw new Error('This child does not exist.');
  }
  parentInstance.children.splice(beforeIndex, 0, child);
}

function removeChild(
  parentInstance: Instance | Container,
  child: Instance | TextInstance,
): void {
  const index = parentInstance.children.indexOf(child);
  if (index === -1) {
    throw new Error('This child does not exist.');
  }
  parentInstance.children.splice(index, 1);
}

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

  createInstance(type: string, props: Props): Instance {
    const inst = {
      id: instanceCounter++,
      type: type,
      children: [],
      prop: props.prop,
    };
    // Hide from unit tests
    Object.defineProperty(inst, 'id', {value: inst.id, enumerable: false});
    return inst;
  },

  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    parentInstance.children.push(child);
  },

  finalizeInitialChildren(
    domElement: Instance,
    type: string,
    props: Props,
  ): boolean {
    return false;
  },

  prepareUpdate(
    instance: Instance,
    type: string,
    oldProps: Props,
    newProps: Props,
  ): null | {} {
    return UPDATE_SIGNAL;
  },

  commitMount(instance: Instance, type: string, newProps: Props): void {
    // Noop
  },

  commitUpdate(
    instance: Instance,
    updatePayload: Object,
    type: string,
    oldProps: Props,
    newProps: Props,
  ): void {
    instance.prop = newProps.prop;
  },

  shouldSetTextContent(type: string, props: Props): boolean {
    return (
      typeof props.children === 'string' || typeof props.children === 'number'
    );
  },

  resetTextContent(instance: Instance): void {},

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return !!props.hidden;
  },

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: Object,
    internalInstanceHandle: Object,
  ): TextInstance {
    var inst = {text: text, id: instanceCounter++};
    // Hide from unit tests
    Object.defineProperty(inst, 'id', {value: inst.id, enumerable: false});
    return inst;
  },

  commitTextUpdate(
    textInstance: TextInstance,
    oldText: string,
    newText: string,
  ): void {
    textInstance.text = newText;
  },

  appendChild: appendChild,
  appendChildToContainer: appendChild,
  insertBefore: insertBefore,
  insertInContainerBefore: insertBefore,
  removeChild: removeChild,
  removeChildFromContainer: removeChild,

  scheduleAnimationCallback(callback) {
    if (scheduledAnimationCallback) {
      throw new Error(
        'Scheduling an animation callback twice is excessive. ' +
          'Instead, keep track of whether the callback has already been scheduled.',
      );
    }
    scheduledAnimationCallback = callback;
  },

  scheduleDeferredCallback(callback) {
    if (scheduledDeferredCallback) {
      throw new Error(
        'Scheduling deferred callback twice is excessive. ' +
          'Instead, keep track of whether the callback has already been scheduled.',
      );
    }
    scheduledDeferredCallback = callback;
  },

  prepareForCommit(): void {},

  resetAfterCommit(): void {},
});

var rootContainers = new Map();
var roots = new Map();
var DEFAULT_ROOT_ID = '<default>';

let yieldedValues = null;

function* flushUnitsOfWork(
  n: number = Infinity,
): Generator<Array<mixed>, void, void> {
  var didStop = false;
  while (!didStop && scheduledDeferredCallback !== null) {
    var cb = scheduledDeferredCallback;
    scheduledDeferredCallback = null;
    yieldedValues = null;
    var unitsRemaining = n;
    cb({
      timeRemaining() {
        if (yieldedValues !== null) {
          return 0;
        }
        if (unitsRemaining-- > 0) {
          return 999;
        }
        didStop = true;
        return 0;
      },
    });

    if (yieldedValues !== null) {
      const values = yieldedValues;
      yieldedValues = null;
      yield values;
    }
  }
}

var ReactNoop = {
  getChildren(rootID: string = DEFAULT_ROOT_ID) {
    const container = rootContainers.get(rootID);
    if (container) {
      return container.children;
    } else {
      return null;
    }
  },

  // Shortcut for testing a single root
  render(element: ReactElement<any>, callback: ?Function) {
    ReactNoop.renderToRootWithID(element, DEFAULT_ROOT_ID, callback);
  },

  renderToRootWithID(
    element: ReactElement<any>,
    rootID: string,
    callback: ?Function,
  ) {
    let root = roots.get(rootID);
    if (!root) {
      const container = {rootID: rootID, children: []};
      rootContainers.set(rootID, container);
      root = NoopRenderer.createContainer(container);
      roots.set(rootID, root);
    }
    NoopRenderer.updateContainer(element, root, null, callback);
  },

  unmountRootWithID(rootID: string) {
    const root = roots.get(rootID);
    if (root) {
      NoopRenderer.updateContainer(null, root, null, () => {
        roots.delete(rootID);
        rootContainers.delete(rootID);
      });
    }
  },

  findInstance(
    componentOrElement: Element | ?ReactComponent<any, any, any>,
  ): null | Instance | TextInstance {
    if (componentOrElement == null) {
      return null;
    }
    // Unsound duck typing.
    const component = (componentOrElement: any);
    if (typeof component.id === 'number') {
      return component;
    }
    const inst = ReactInstanceMap.get(component);
    return inst ? NoopRenderer.findHostInstance(inst) : null;
  },

  // TODO: Remove this method
  flushAnimationPri() {
    var cb = scheduledAnimationCallback;
    if (cb === null) {
      return;
    }
    scheduledAnimationCallback = null;
    cb();
  },

  flushDeferredPri(timeout: number = Infinity): Array<mixed> {
    // The legacy version of this function decremented the timeout before
    // returning the new time.
    // TODO: Convert tests to use flushUnitsOfWork or flushAndYield instead.
    const n = timeout / 5 - 1;

    let values = [];
    for (const value of flushUnitsOfWork(n)) {
      values.push(...value);
    }
    // Don't flush animation priority in this legacy function. Some tests may
    // still rely on this behavior.
    return values;
  },

  flush(): Array<mixed> {
    ReactNoop.flushAnimationPri();
    return ReactNoop.flushDeferredPri();
  },

  *flushAndYield(
    unitsOfWork: number = Infinity,
  ): Generator<Array<mixed>, void, void> {
    for (const value of flushUnitsOfWork(unitsOfWork)) {
      yield value;
    }
    ReactNoop.flushAnimationPri();
  },

  flushUnitsOfWork(n: number): Array<mixed> {
    let values = [];
    for (const value of flushUnitsOfWork(n)) {
      values.push(...value);
    }
    // TODO: We should always flush animation priority after flushing normal/low
    // priority. Move this to flushUnitsOfWork generator once tests
    // are converted.
    ReactNoop.flushAnimationPri();
    return values;
  },

  flushThrough(expected: Array<mixed>): void {
    let actual = [];
    if (expected.length !== 0) {
      for (const value of flushUnitsOfWork()) {
        actual.push(...value);
        if (actual.length >= expected.length) {
          break;
        }
      }
    }
    ReactNoop.flushAnimationPri();
    expect(actual).toEqual(expected);
  },

  yield(value: mixed) {
    if (yieldedValues === null) {
      yieldedValues = [value];
    } else {
      yieldedValues.push(value);
    }
  },

  hasScheduledDeferredCallback() {
    return !!scheduledDeferredCallback;
  },

  performAnimationWork(fn: Function) {
    NoopRenderer.performWithPriority(AnimationPriority, fn);
  },

  batchedUpdates: NoopRenderer.batchedUpdates,

  unbatchedUpdates: NoopRenderer.unbatchedUpdates,

  syncUpdates: NoopRenderer.syncUpdates,

  // Logs the current state of the tree.
  dumpTree(rootID: string = DEFAULT_ROOT_ID) {
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
    function logContainer(container: Container, depth) {
      log('  '.repeat(depth) + '- [root#' + container.rootID + ']');
      logHostInstances(container.children, depth + 1);
    }

    function logUpdateQueue(updateQueue: UpdateQueue, depth) {
      log('  '.repeat(depth + 1) + 'QUEUED UPDATES');
      const firstUpdate = updateQueue.first;
      if (!firstUpdate) {
        return;
      }

      log(
        '  '.repeat(depth + 1) + '~',
        firstUpdate && firstUpdate.partialState,
        firstUpdate.callback ? 'with callback' : '',
        '[' + firstUpdate.priorityLevel + ']',
      );
      var next;
      while ((next = firstUpdate.next)) {
        log(
          '  '.repeat(depth + 1) + '~',
          next.partialState,
          next.callback ? 'with callback' : '',
          '[' + firstUpdate.priorityLevel + ']',
        );
      }
    }

    function logFiber(fiber: Fiber, depth) {
      log(
        '  '.repeat(depth) +
          '- ' +
          (fiber.type ? fiber.type.name || fiber.type : '[root]'),
        '[' + fiber.pendingWorkPriority + (fiber.pendingProps ? '*' : '') + ']',
      );
      if (fiber.updateQueue) {
        logUpdateQueue(fiber.updateQueue, depth);
      }
      const childInProgress = fiber.progressedChild;
      if (childInProgress && childInProgress !== fiber.child) {
        log(
          '  '.repeat(depth + 1) + 'IN PROGRESS: ' + fiber.progressedPriority,
        );
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

  simulateErrorInHostConfig(fn: () => void) {
    failInBeginPhase = true;
    try {
      fn();
    } finally {
      failInBeginPhase = false;
    }
  },

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Private. Used only by fixtures/fiber-debugger.
    // (To be fair, it's the only place where `react-noop-renderer` package is used at all.)
    ReactFiberInstrumentation,
  },
};

module.exports = ReactNoop;
