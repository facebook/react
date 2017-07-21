/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiber
 * @flow
 */

'use strict';

import type {ReactElement, Source} from 'ReactElementType';
import type {ReactInstance, DebugID} from 'ReactInstanceType';
import type {
  ReactCoroutine,
  ReactFragment,
  ReactPortal,
  ReactYield,
} from 'ReactTypes';
import type {TypeOfWork} from 'ReactTypeOfWork';
import type {TypeOfInternalContext} from 'ReactTypeOfInternalContext';
import type {TypeOfSideEffect} from 'ReactTypeOfSideEffect';
import type {PriorityLevel} from 'ReactPriorityLevel';
import type {UpdateQueue} from 'ReactFiberUpdateQueue';

var {
  IndeterminateComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CoroutineComponent,
  YieldComponent,
  Fragment,
} = require('ReactTypeOfWork');

var {NoWork} = require('ReactPriorityLevel');

var {NoContext} = require('ReactTypeOfInternalContext');

var {NoEffect} = require('ReactTypeOfSideEffect');

var invariant = require('fbjs/lib/invariant');

if (__DEV__) {
  var getComponentName = require('getComponentName');

  var hasBadMapPolyfill = false;
  try {
    const nonExtensibleObject = Object.preventExtensions({});
    /* eslint-disable no-new */
    new Map([[nonExtensibleObject, null]]);
    new Set([nonExtensibleObject]);
    /* eslint-enable no-new */
  } catch (e) {
    // TODO: Consider warning about bad polyfills
    hasBadMapPolyfill = true;
  }
}

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.
export type Fiber = {|
  // __DEV__ only
  _debugID?: DebugID,
  _debugSource?: Source | null,
  _debugOwner?: Fiber | ReactInstance | null, // Stack compatible
  _debugIsCurrentlyTiming?: boolean,

  // These first fields are conceptually members of an Instance. This used to
  // be split into a separate type and intersected with the other Fiber fields,
  // but until Flow fixes its intersection bugs, we've merged them into a
  // single type.

  // An Instance is shared between all versions of a component. We can easily
  // break this out into a separate object to avoid copying so much to the
  // alternate versions of the tree. We put this on a single object for now to
  // minimize the number of objects created during the initial render.

  // Tag identifying the type of fiber.
  tag: TypeOfWork,

  // Unique identifier of this child.
  key: null | string,

  // The function/class/module associated with this fiber.
  type: any,

  // The local state associated with this fiber.
  stateNode: any,

  // Conceptual aliases
  // parent : Instance -> return The parent happens to be the same as the
  // return fiber since we've merged the fiber and instance.

  // Remaining fields belong to Fiber

  // The Fiber to return to after finishing processing this one.
  // This is effectively the parent, but there can be multiple parents (two)
  // so this is only the parent of the thing we're currently processing.
  // It is conceptually the same as the return address of a stack frame.
  return: Fiber | null,

  // Singly Linked List Tree Structure.
  child: Fiber | null,
  sibling: Fiber | null,
  index: number,

  // The ref last used to attach this node.
  // I'll avoid adding an owner field for prod and model that as functions.
  ref: null | (((handle: mixed) => void) & {_stringRef: ?string}),

  // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any, // This type will be more specific once we overload the tag.
  memoizedProps: any, // The props used to create the output.

  // A queue of state updates and callbacks.
  updateQueue: UpdateQueue | null,

  // The state used to create the output
  memoizedState: any,

  // Bitfield that describes properties about the fiber and its subtree. E.g.
  // the AsyncUpdates flag indicates whether the subtree should be async-by-
  // default. When a fiber is created, it inherits the internalContextTag of its
  // parent. Additional flags can be set at creation time, but after than the
  // value should remain unchanged throughout the fiber's lifetime, particularly
  // before its child fibers are created.
  internalContextTag: TypeOfInternalContext,

  // Effect
  effectTag: TypeOfSideEffect,

  // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: Fiber | null,

  // The first and last fiber with side-effect within this subtree. This allows
  // us to reuse a slice of the linked list when we reuse the work done within
  // this fiber.
  firstEffect: Fiber | null,
  lastEffect: Fiber | null,

  // This will be used to quickly determine if a subtree has no pending changes.
  pendingWorkPriority: PriorityLevel,

  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null,

  // Conceptual aliases
  // workInProgress : Fiber ->  alternate The alternate used for reuse happens
  // to be the same as work in progress.
|};

if (__DEV__) {
  var debugCounter = 1;
}

// This is a constructor of a POJO instead of a constructor function for a few
// reasons:
// 1) Nobody should add any instance methods on this. Instance methods can be
//    more difficult to predict when they get optimized and they are almost
//    never inlined properly in static compilers.
// 2) Nobody should rely on `instanceof Fiber` for type testing. We should
//    always know when it is a fiber.
// 3) We can easily go from a createFiber call to calling a constructor if that
//    is faster. The opposite is not true.
// 4) We might want to experiment with using numeric keys since they are easier
//    to optimize in a non-JIT environment.
// 5) It should be easy to port this to a C struct and keep a C implementation
//    compatible.
var createFiber = function(
  tag: TypeOfWork,
  key: null | string,
  internalContextTag: TypeOfInternalContext,
): Fiber {
  var fiber: Fiber = {
    // Instance

    tag: tag,

    key: key,

    type: null,

    stateNode: null,

    // Fiber

    return: null,

    child: null,
    sibling: null,
    index: 0,

    ref: null,

    pendingProps: null,
    memoizedProps: null,
    updateQueue: null,
    memoizedState: null,

    internalContextTag,

    effectTag: NoEffect,
    nextEffect: null,
    firstEffect: null,
    lastEffect: null,

    pendingWorkPriority: NoWork,

    alternate: null,
  };

  if (__DEV__) {
    fiber._debugID = debugCounter++;
    fiber._debugSource = null;
    fiber._debugOwner = null;
    fiber._debugIsCurrentlyTiming = false;
    if (!hasBadMapPolyfill && typeof Object.preventExtensions === 'function') {
      Object.preventExtensions(fiber);
    }
  }

  return fiber;
};

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

// This is used to create an alternate fiber to do work on.
exports.createWorkInProgress = function(
  current: Fiber,
  renderPriority: PriorityLevel,
): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // We use a double buffering pooling technique because we know that we'll
    // only ever need at most two versions of a tree. We pool the "other" unused
    // node that we're free to reuse. This is lazily created to avoid allocating
    // extra objects for things that are never updated. It also allow us to
    // reclaim the extra memory if needed.
    workInProgress = createFiber(
      current.tag,
      current.key,
      current.internalContextTag,
    );
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    if (__DEV__) {
      // DEV-only fields
      workInProgress._debugID = current._debugID;
      workInProgress._debugSource = current._debugSource;
      workInProgress._debugOwner = current._debugOwner;
    }

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // We already have an alternate.
    // Reset the effect tag.
    workInProgress.effectTag = NoWork;

    // The effect list is no longer valid.
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }

  workInProgress.pendingWorkPriority = renderPriority;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // pendingProps is set by the parent during reconciliation.
  // TODO: Pass this as an argument.

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  return workInProgress;
};

exports.createHostRootFiber = function(): Fiber {
  const fiber = createFiber(HostRoot, null, NoContext);
  return fiber;
};

exports.createFiberFromElement = function(
  element: ReactElement,
  internalContextTag: TypeOfInternalContext,
  priorityLevel: PriorityLevel,
): Fiber {
  let owner = null;
  if (__DEV__) {
    owner = element._owner;
  }

  const fiber = createFiberFromElementType(
    element.type,
    element.key,
    internalContextTag,
    owner,
  );
  fiber.pendingProps = element.props;
  fiber.pendingWorkPriority = priorityLevel;

  if (__DEV__) {
    fiber._debugSource = element._source;
    fiber._debugOwner = element._owner;
  }

  return fiber;
};

exports.createFiberFromFragment = function(
  elements: ReactFragment,
  internalContextTag: TypeOfInternalContext,
  priorityLevel: PriorityLevel,
): Fiber {
  // TODO: Consider supporting keyed fragments. Technically, we accidentally
  // support that in the existing React.
  const fiber = createFiber(Fragment, null, internalContextTag);
  fiber.pendingProps = elements;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromText = function(
  content: string,
  internalContextTag: TypeOfInternalContext,
  priorityLevel: PriorityLevel,
): Fiber {
  const fiber = createFiber(HostText, null, internalContextTag);
  fiber.pendingProps = content;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

function createFiberFromElementType(
  type: mixed,
  key: null | string,
  internalContextTag: TypeOfInternalContext,
  debugOwner: null | Fiber | ReactInstance,
): Fiber {
  let fiber;
  if (typeof type === 'function') {
    fiber = shouldConstruct(type)
      ? createFiber(ClassComponent, key, internalContextTag)
      : createFiber(IndeterminateComponent, key, internalContextTag);
    fiber.type = type;
  } else if (typeof type === 'string') {
    fiber = createFiber(HostComponent, key, internalContextTag);
    fiber.type = type;
  } else if (
    typeof type === 'object' &&
    type !== null &&
    typeof type.tag === 'number'
  ) {
    // Currently assumed to be a continuation and therefore is a fiber already.
    // TODO: The yield system is currently broken for updates in some cases.
    // The reified yield stores a fiber, but we don't know which fiber that is;
    // the current or a workInProgress? When the continuation gets rendered here
    // we don't know if we can reuse that fiber or if we need to clone it.
    // There is probably a clever way to restructure this.
    fiber = ((type: any): Fiber);
  } else {
    let info = '';
    if (__DEV__) {
      if (
        type === undefined ||
        (typeof type === 'object' &&
          type !== null &&
          Object.keys(type).length === 0)
      ) {
        info +=
          ' You likely forgot to export your component from the file ' +
          "it's defined in.";
      }
      const ownerName = debugOwner ? getComponentName(debugOwner) : null;
      if (ownerName) {
        info += '\n\nCheck the render method of `' + ownerName + '`.';
      }
    }
    invariant(
      false,
      'Element type is invalid: expected a string (for built-in components) ' +
        'or a class/function (for composite components) but got: %s.%s',
      type == null ? type : typeof type,
      info,
    );
  }
  return fiber;
}

exports.createFiberFromElementType = createFiberFromElementType;

exports.createFiberFromHostInstanceForDeletion = function(): Fiber {
  const fiber = createFiber(HostComponent, null, NoContext);
  fiber.type = 'DELETED';
  return fiber;
};

exports.createFiberFromCoroutine = function(
  coroutine: ReactCoroutine,
  internalContextTag: TypeOfInternalContext,
  priorityLevel: PriorityLevel,
): Fiber {
  const fiber = createFiber(
    CoroutineComponent,
    coroutine.key,
    internalContextTag,
  );
  fiber.type = coroutine.handler;
  fiber.pendingProps = coroutine;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromYield = function(
  yieldNode: ReactYield,
  internalContextTag: TypeOfInternalContext,
  priorityLevel: PriorityLevel,
): Fiber {
  const fiber = createFiber(YieldComponent, null, internalContextTag);
  return fiber;
};

exports.createFiberFromPortal = function(
  portal: ReactPortal,
  internalContextTag: TypeOfInternalContext,
  priorityLevel: PriorityLevel,
): Fiber {
  const fiber = createFiber(HostPortal, portal.key, internalContextTag);
  fiber.pendingProps = portal.children || [];
  fiber.pendingWorkPriority = priorityLevel;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    implementation: portal.implementation,
  };
  return fiber;
};

exports.largerPriority = function(
  p1: PriorityLevel,
  p2: PriorityLevel,
): PriorityLevel {
  return p1 !== NoWork && (p2 === NoWork || p2 > p1) ? p1 : p2;
};
