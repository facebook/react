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

import type { ReactFragment } from 'ReactTypes';
import type { ReactCoroutine, ReactYield } from 'ReactCoroutine';
import type { ReactPortal } from 'ReactPortal';
import type { TypeOfWork } from 'ReactTypeOfWork';
import type { TypeOfSideEffect } from 'ReactTypeOfSideEffect';
import type { PriorityLevel } from 'ReactPriorityLevel';
import type { UpdateQueue } from 'ReactFiberUpdateQueue';

var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  IndeterminateComponent,
  ClassComponent,
  HostContainer,
  HostComponent,
  HostText,
  CoroutineComponent,
  YieldComponent,
  Fragment,
  Portal,
} = ReactTypeOfWork;

var {
  NoWork,
} = require('ReactPriorityLevel');

var {
  NoEffect,
} = require('ReactTypeOfSideEffect');

var invariant = require('invariant');

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.
export type Fiber = {
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
  return: ?Fiber,

  // Singly Linked List Tree Structure.
  child: ?Fiber,
  sibling: ?Fiber,
  index: number,

  // The ref last used to attach this node.
  // I'll avoid adding an owner field for prod and model that as functions.
  ref: null | (((handle : ?Object) => void) & { _stringRef: ?string }),

  // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any, // This type will be more specific once we overload the tag.
  // TODO: I think that there is a way to merge pendingProps and memoizedProps.
  memoizedProps: any, // The props used to create the output.
  // A queue of local state updates.
  updateQueue: ?UpdateQueue,
  // The state used to create the output. This is a full state object.
  memoizedState: any,
  // Linked list of callbacks to call after updates are committed.
  callbackList: ?UpdateQueue,

  // Effect
  effectTag: TypeOfSideEffect,

  // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: ?Fiber,

  // The first and last fiber with side-effect within this subtree. This allows
  // us to reuse a slice of the linked list when we reuse the work done within
  // this fiber.
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  // This will be used to quickly determine if a subtree has no pending changes.
  pendingWorkPriority: PriorityLevel,

  // This value represents the priority level that was last used to process this
  // component. This indicates whether it is better to continue from the
  // progressed work or if it is better to continue from the current state.
  progressedPriority: PriorityLevel,

  // If work bails out on a Fiber that already had some work started at a lower
  // priority, then we need to store the progressed work somewhere. This holds
  // the started child set until we need to get back to working on it. It may
  // or may not be the same as the "current" child.
  progressedChild: ?Fiber,

  // When we reconcile children onto progressedChild it is possible that we have
  // to delete some child fibers. We need to keep track of this side-effects so
  // that if we continue later on, we have to include those effects. Deletions
  // are added in the reverse order from sibling pointers.
  progressedFirstDeletion: ?Fiber,
  progressedLastDeletion: ?Fiber,

  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: ?Fiber,

  // Conceptual aliases
  // workInProgress : Fiber ->  alternate The alternate used for reuse happens
  // to be the same as work in progress.

};

if (__DEV__) {
  var debugCounter = 0;
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
var createFiber = function(tag : TypeOfWork, key : null | string) : Fiber {
  var fiber = {

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
    callbackList: null,

    effectTag: NoEffect,
    nextEffect: null,
    firstEffect: null,
    lastEffect: null,

    pendingWorkPriority: NoWork,
    progressedPriority: NoWork,
    progressedChild: null,
    progressedFirstDeletion: null,
    progressedLastDeletion: null,

    alternate: null,

  };
  if (__DEV__) {
    (fiber : any)._debugID = debugCounter++;
  }
  return fiber;
};

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

// This is used to create an alternate fiber to do work on.
// TODO: Rename to createWorkInProgressFiber or something like that.
exports.cloneFiber = function(fiber : Fiber, priorityLevel : PriorityLevel) : Fiber {
  // We clone to get a work in progress. That means that this fiber is the
  // current. To make it safe to reuse that fiber later on as work in progress
  // we need to reset its work in progress flag now. We don't have an
  // opportunity to do this earlier since we don't traverse the tree when
  // the work in progress tree becomes the current tree.
  // fiber.progressedPriority = NoWork;
  // fiber.progressedChild = null;

  // We use a double buffering pooling technique because we know that we'll only
  // ever need at most two versions of a tree. We pool the "other" unused node
  // that we're free to reuse. This is lazily created to avoid allocating extra
  // objects for things that are never updated. It also allow us to reclaim the
  // extra memory if needed.
  let alt = fiber.alternate;
  if (alt) {
    // If we clone, then we do so from the "current" state. The current state
    // can't have any side-effects that are still valid so we reset just to be
    // sure.
    alt.effectTag = NoEffect;
    alt.nextEffect = null;
    alt.firstEffect = null;
    alt.lastEffect = null;
  } else {
    // This should not have an alternate already
    alt = createFiber(fiber.tag, fiber.key);
    alt.type = fiber.type;

    alt.progressedChild = fiber.progressedChild;
    alt.progressedPriority = fiber.progressedPriority;

    alt.alternate = fiber;
    fiber.alternate = alt;
  }

  alt.stateNode = fiber.stateNode;
  alt.child = fiber.child;
  alt.sibling = fiber.sibling; // This should always be overridden. TODO: null
  alt.index = fiber.index; // This should always be overridden.
  alt.ref = fiber.ref;
  // pendingProps is here for symmetry but is unnecessary in practice for now.
  // TODO: Pass in the new pendingProps as an argument maybe?
  alt.pendingProps = fiber.pendingProps;
  alt.updateQueue = fiber.updateQueue;
  alt.callbackList = fiber.callbackList;
  alt.pendingWorkPriority = priorityLevel;

  alt.memoizedProps = fiber.memoizedProps;
  alt.memoizedState = fiber.memoizedState;

  return alt;
};

exports.createHostContainerFiber = function() : Fiber {
  const fiber = createFiber(HostContainer, null);
  return fiber;
};

exports.createFiberFromElement = function(element : ReactElement<*>, priorityLevel : PriorityLevel) : Fiber {
// $FlowFixMe: ReactElement.key is currently defined as ?string but should be defined as null | string in Flow.
  const fiber = createFiberFromElementType(element.type, element.key);
  fiber.pendingProps = element.props;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromFragment = function(elements : ReactFragment, priorityLevel : PriorityLevel) : Fiber {
  // TODO: Consider supporting keyed fragments. Technically, we accidentally
  // support that in the existing React.
  const fiber = createFiber(Fragment, null);
  fiber.pendingProps = elements;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromText = function(content : string, priorityLevel : PriorityLevel) : Fiber {
  const fiber = createFiber(HostText, null);
  fiber.pendingProps = content;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

function createFiberFromElementType(type : mixed, key : null | string) : Fiber {
  let fiber;
  if (typeof type === 'function') {
    fiber = shouldConstruct(type) ?
      createFiber(ClassComponent, key) :
      createFiber(IndeterminateComponent, key);
    fiber.type = type;
  } else if (typeof type === 'string') {
    fiber = createFiber(HostComponent, key);
    fiber.type = type;
  } else if (typeof type === 'object' && type !== null) {
    // Currently assumed to be a continuation and therefore is a fiber already.
    // TODO: The yield system is currently broken for updates in some cases.
    // The reified yield stores a fiber, but we don't know which fiber that is;
    // the current or a workInProgress? When the continuation gets rendered here
    // we don't know if we can reuse that fiber or if we need to clone it.
    // There is probably a clever way to restructure this.
    fiber = ((type : any) : Fiber);
  } else {
    invariant(
      false,
      'Element type is invalid: expected a string (for built-in components) ' +
      'or a class/function (for composite components) but got: %s.',
      type == null ? type : typeof type,
      // TODO: Stack also includes owner name in the message.
    );
  }
  return fiber;
}

exports.createFiberFromElementType = createFiberFromElementType;

exports.createFiberFromCoroutine = function(coroutine : ReactCoroutine, priorityLevel : PriorityLevel) : Fiber {
  const fiber = createFiber(CoroutineComponent, coroutine.key);
  fiber.type = coroutine.handler;
  fiber.pendingProps = coroutine;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromYield = function(yieldNode : ReactYield, priorityLevel : PriorityLevel) : Fiber {
  const fiber = createFiber(YieldComponent, yieldNode.key);
  fiber.pendingProps = {};
  return fiber;
};

exports.createFiberFromPortal = function(portal : ReactPortal, priorityLevel : PriorityLevel) : Fiber {
  const fiber = createFiber(Portal, portal.key);
  fiber.pendingProps = portal.children;
  fiber.pendingWorkPriority = priorityLevel;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    implementation: portal.implementation,
  };
  return fiber;
};
