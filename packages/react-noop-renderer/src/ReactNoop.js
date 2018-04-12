/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {UpdateQueue} from 'react-reconciler/src/ReactFiberUpdateQueue';
import type {ReactNodeList} from 'shared/ReactTypes';
import ReactFiberReconciler from 'react-reconciler';
import {enablePersistentReconciler} from 'shared/ReactFeatureFlags';
import * as ReactPortal from 'shared/ReactPortal';
import emptyObject from 'fbjs/lib/emptyObject';
import expect from 'expect';

const UPDATE_SIGNAL = {};

let scheduledCallback = null;

type Container = {rootID: string, children: Array<Instance | TextInstance>};
type Props = {prop: any, hidden?: boolean};
type Instance = {|
  type: string,
  id: number,
  children: Array<Instance | TextInstance>,
  prop: any,
|};
type TextInstance = {|text: string, id: number|};

let instanceCounter = 0;
let failInBeginPhase = false;

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

let elapsedTimeInMs = 0;

let SharedHostConfig = {
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
    if (oldProps === null) {
      throw new Error('Should have old props');
    }
    if (newProps === null) {
      throw new Error('Should have new props');
    }
    return UPDATE_SIGNAL;
  },

  shouldSetTextContent(type: string, props: Props): boolean {
    return (
      typeof props.children === 'string' || typeof props.children === 'number'
    );
  },

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return !!props.hidden;
  },

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: Object,
    internalInstanceHandle: Object,
  ): TextInstance {
    const inst = {text: text, id: instanceCounter++};
    // Hide from unit tests
    Object.defineProperty(inst, 'id', {value: inst.id, enumerable: false});
    return inst;
  },

  scheduleDeferredCallback(callback) {
    if (scheduledCallback) {
      throw new Error(
        'Scheduling a callback twice is excessive. Instead, keep track of ' +
          'whether the callback has already been scheduled.',
      );
    }
    scheduledCallback = callback;
    return 0;
  },

  cancelDeferredCallback() {
    if (scheduledCallback === null) {
      throw new Error('No callback is scheduled.');
    }
    scheduledCallback = null;
  },

  prepareForCommit(): void {},

  resetAfterCommit(): void {},

  now(): number {
    return elapsedTimeInMs;
  },
};

const NoopRenderer = ReactFiberReconciler({
  ...SharedHostConfig,
  mutation: {
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
      if (oldProps === null) {
        throw new Error('Should have old props');
      }
      instance.prop = newProps.prop;
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

    resetTextContent(instance: Instance): void {},
  },
});

const PersistentNoopRenderer = enablePersistentReconciler
  ? ReactFiberReconciler({
      ...SharedHostConfig,
      persistence: {
        cloneInstance(
          instance: Instance,
          updatePayload: null | Object,
          type: string,
          oldProps: Props,
          newProps: Props,
          internalInstanceHandle: Object,
          keepChildren: boolean,
          recyclableInstance: null | Instance,
        ): Instance {
          const clone = {
            id: instance.id,
            type: type,
            children: keepChildren ? instance.children : [],
            prop: newProps.prop,
          };
          Object.defineProperty(clone, 'id', {
            value: clone.id,
            enumerable: false,
          });
          return clone;
        },

        createContainerChildSet(
          container: Container,
        ): Array<Instance | TextInstance> {
          return [];
        },

        appendChildToContainerChildSet(
          childSet: Array<Instance | TextInstance>,
          child: Instance | TextInstance,
        ): void {
          childSet.push(child);
        },

        finalizeContainerChildren(
          container: Container,
          newChildren: Array<Instance | TextInstance>,
        ): void {},

        replaceContainerChildren(
          container: Container,
          newChildren: Array<Instance | TextInstance>,
        ): void {
          container.children = newChildren;
        },
      },
    })
  : null;

const rootContainers = new Map();
const roots = new Map();
const persistentRoots = new Map();
const DEFAULT_ROOT_ID = '<default>';

let yieldedValues = null;

let unitsRemaining;

function* flushUnitsOfWork(n: number): Generator<Array<mixed>, void, void> {
  let didStop = false;
  while (!didStop && scheduledCallback !== null) {
    let cb = scheduledCallback;
    scheduledCallback = null;
    unitsRemaining = n;
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
      // React's scheduler has its own way of keeping track of expired
      // work and doesn't read this, so don't bother setting it to the
      // correct value.
      didTimeout: false,
    });

    if (yieldedValues !== null) {
      const values = yieldedValues;
      yieldedValues = null;
      yield values;
    }
  }
}

const ReactNoop = {
  getChildren(rootID: string = DEFAULT_ROOT_ID) {
    const container = rootContainers.get(rootID);
    if (container) {
      return container.children;
    } else {
      return null;
    }
  },

  createPortal(
    children: ReactNodeList,
    container: Container,
    key: ?string = null,
  ) {
    return ReactPortal.createPortal(children, container, null, key);
  },

  // Shortcut for testing a single root
  render(element: React$Element<any>, callback: ?Function) {
    ReactNoop.renderToRootWithID(element, DEFAULT_ROOT_ID, callback);
  },

  renderToRootWithID(
    element: React$Element<any>,
    rootID: string,
    callback: ?Function,
  ) {
    let root = roots.get(rootID);
    if (!root) {
      const container = {rootID: rootID, children: []};
      rootContainers.set(rootID, container);
      root = NoopRenderer.createContainer(container, true, false);
      roots.set(rootID, root);
    }
    NoopRenderer.updateContainer(element, root, null, callback);
  },

  renderToPersistentRootWithID(
    element: React$Element<any>,
    rootID: string,
    callback: ?Function,
  ) {
    if (PersistentNoopRenderer === null) {
      throw new Error(
        'Enable ReactFeatureFlags.enablePersistentReconciler to use it in tests.',
      );
    }
    let root = persistentRoots.get(rootID);
    if (!root) {
      const container = {rootID: rootID, children: []};
      rootContainers.set(rootID, container);
      root = PersistentNoopRenderer.createContainer(container, true, false);
      persistentRoots.set(rootID, root);
    }
    PersistentNoopRenderer.updateContainer(element, root, null, callback);
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
    componentOrElement: Element | ?React$Component<any, any>,
  ): null | Instance | TextInstance {
    if (componentOrElement == null) {
      return null;
    }
    // Unsound duck typing.
    const component = (componentOrElement: any);
    if (typeof component.id === 'number') {
      return component;
    }
    return NoopRenderer.findHostInstance(component);
  },

  flushDeferredPri(timeout: number = Infinity): Array<mixed> {
    // The legacy version of this function decremented the timeout before
    // returning the new time.
    // TODO: Convert tests to use flushUnitsOfWork or flushAndYield instead.
    const n = timeout / 5 - 1;

    let values = [];
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const value of flushUnitsOfWork(n)) {
      values.push(...value);
    }
    return values;
  },

  flush(): Array<mixed> {
    return ReactNoop.flushUnitsOfWork(Infinity);
  },

  flushAndYield(
    unitsOfWork: number = Infinity,
  ): Generator<Array<mixed>, void, void> {
    return flushUnitsOfWork(unitsOfWork);
  },

  flushUnitsOfWork(n: number): Array<mixed> {
    let values = yieldedValues || [];
    yieldedValues = null;
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const value of flushUnitsOfWork(n)) {
      values.push(...value);
    }
    return values;
  },

  flushThrough(expected: Array<mixed>): void {
    let actual = [];
    if (expected.length !== 0) {
      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (const value of flushUnitsOfWork(Infinity)) {
        actual.push(...value);
        if (actual.length >= expected.length) {
          break;
        }
      }
    }
    expect(actual).toEqual(expected);
  },

  expire(ms: number): void {
    elapsedTimeInMs += ms;
  },

  flushExpired(): Array<mixed> {
    return ReactNoop.flushUnitsOfWork(0);
  },

  yield(value: mixed) {
    if (yieldedValues === null) {
      yieldedValues = [value];
    } else {
      yieldedValues.push(value);
    }
  },

  clearYields() {
    const values = yieldedValues;
    yieldedValues = null;
    return values;
  },

  hasScheduledCallback() {
    return !!scheduledCallback;
  },

  batchedUpdates: NoopRenderer.batchedUpdates,

  deferredUpdates: NoopRenderer.deferredUpdates,

  unbatchedUpdates: NoopRenderer.unbatchedUpdates,

  interactiveUpdates: NoopRenderer.interactiveUpdates,

  flushSync(fn: () => mixed) {
    yieldedValues = [];
    NoopRenderer.flushSync(fn);
    return yieldedValues;
  },

  // Logs the current state of the tree.
  dumpTree(rootID: string = DEFAULT_ROOT_ID) {
    const root = roots.get(rootID);
    const rootContainer = rootContainers.get(rootID);
    if (!root || !rootContainer) {
      console.log('Nothing rendered yet.');
      return;
    }

    let bufferedLog = [];
    function log(...args) {
      bufferedLog.push(...args, '\n');
    }

    function logHostInstances(children: Array<Instance | TextInstance>, depth) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const indent = '  '.repeat(depth);
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

    function logUpdateQueue(updateQueue: UpdateQueue<mixed>, depth) {
      log('  '.repeat(depth + 1) + 'QUEUED UPDATES');
      const firstUpdate = updateQueue.first;
      if (!firstUpdate) {
        return;
      }

      log(
        '  '.repeat(depth + 1) + '~',
        firstUpdate && firstUpdate.partialState,
        firstUpdate.callback ? 'with callback' : '',
        '[' + firstUpdate.expirationTime + ']',
      );
      let next;
      while ((next = firstUpdate.next)) {
        log(
          '  '.repeat(depth + 1) + '~',
          next.partialState,
          next.callback ? 'with callback' : '',
          '[' + firstUpdate.expirationTime + ']',
        );
      }
    }

    function logFiber(fiber: Fiber, depth) {
      log(
        '  '.repeat(depth) +
          '- ' +
          // need to explicitly coerce Symbol to a string
          (fiber.type ? fiber.type.name || fiber.type.toString() : '[root]'),
        '[' + fiber.expirationTime + (fiber.pendingProps ? '*' : '') + ']',
      );
      if (fiber.updateQueue) {
        logUpdateQueue(fiber.updateQueue, depth);
      }
      // const childInProgress = fiber.progressedChild;
      // if (childInProgress && childInProgress !== fiber.child) {
      //   log(
      //     '  '.repeat(depth + 1) + 'IN PROGRESS: ' + fiber.pendingWorkPriority,
      //   );
      //   logFiber(childInProgress, depth + 1);
      //   if (fiber.child) {
      //     log('  '.repeat(depth + 1) + 'CURRENT');
      //   }
      // } else if (fiber.child && fiber.updateQueue) {
      //   log('  '.repeat(depth + 1) + 'CHILDREN');
      // }
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
};

export default ReactNoop;
