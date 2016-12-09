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

import type { ReactFragment, ReactNode } from 'ReactTypes';
import type { ReactCoroutine, ReactYield } from 'ReactCoroutine';
import type { ReactPortal } from 'ReactPortal';
import type { TypeOfSideEffect } from 'ReactTypeOfSideEffect';
import type { PriorityLevel } from 'ReactPriorityLevel';
import type { UpdateQueue } from 'ReactFiberUpdateQueue';

import type {
 IndeterminateComponentFiber,
 FunctionalComponentFiber,
 ClassComponentFiber,
 HostRootFiber,
 HostPortalFiber,
 HostComponentFiber,
 HostTextFiber,
 CoroutineComponentFiber,
 CoroutineHandlerPhaseFiber,
 YieldComponentFiber,
 FragmentFiber,
} from 'ReactFiberTypes.exploded';

var ReactTypeOfWork = require('ReactTypeOfWork');
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
} = ReactTypeOfWork;

var {
  NoWork,
} = require('ReactPriorityLevel');

var {
  NoEffect,
} = require('ReactTypeOfSideEffect');

var invariant = require('invariant');

export type ElementFiber =
  | IndeterminateComponentFiber
  | FunctionalComponentFiber<any>
  | HostComponentFiber
  | ClassComponentFiber<any, any>;

export type Fiber =
  | IndeterminateComponentFiber
  | FunctionalComponentFiber<any>
  | ClassComponentFiber<any, any>
  | HostRootFiber
  | HostPortalFiber
  | HostComponentFiber
  | HostTextFiber
  | CoroutineComponentFiber
  | CoroutineHandlerPhaseFiber
  | YieldComponentFiber
  | FragmentFiber;

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

// To be able to match the overloaded method to the proper return type, we need
// to use declares.
declare function createFiber(tag : 0, key : null | string) : IndeterminateComponentFiber;
declare function createFiber(tag : 1, key : null | string) : FunctionalComponentFiber<any>;
declare function createFiber(tag : 2, key : null | string) : ClassComponentFiber<any, any>;
declare function createFiber(tag : 3, key : null | string) : HostRootFiber;
declare function createFiber(tag : 4, key : null | string) : HostPortalFiber;
declare function createFiber(tag : 5, key : null | string) : HostComponentFiber;
declare function createFiber(tag : 6, key : null | string) : HostTextFiber;
declare function createFiber(tag : 7, key : null | string) : CoroutineComponentFiber;
declare function createFiber(tag : 8, key : null | string) : CoroutineHandlerPhaseFiber;
declare function createFiber(tag : 9, key : null | string) : YieldComponentFiber;
declare function createFiber(tag : 10, key : null | string) : FragmentFiber;

function createFiber(tag : number, key : null | string) : Fiber {
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

exports.createHostRootFiber = function() : HostRootFiber {
  const fiber = createFiber(HostRoot, null);
  return fiber;
};

exports.createFiberFromElement = function(element : ReactElement<*>, priorityLevel : PriorityLevel) : ElementFiber {
// $FlowFixMe: ReactElement.key is currently defined as ?string but should be defined as null | string in Flow.
  const fiber = createFiberFromElementType(element.type, element.key);
  fiber.pendingProps = element.props;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromFragment = function(elements : ReactFragment, priorityLevel : PriorityLevel) : FragmentFiber {
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

function createFiberFromElementType(type : mixed, key : null | string) : ElementFiber {
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
    // The only way to create a continuation is through this method so we know
    // that it is the same return type.
    // TODO: The yield system is currently broken for updates in some cases.
    // The reified yield stores a fiber, but we don't know which fiber that is;
    // the current or a workInProgress? When the continuation gets rendered here
    // we don't know if we can reuse that fiber or if we need to clone it.
    // There is probably a clever way to restructure this.
    fiber = ((type : any) : ElementFiber);
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

exports.createFiberFromCoroutine = function(coroutine : ReactCoroutine, priorityLevel : PriorityLevel) : CoroutineComponentFiber {
  const fiber = createFiber(CoroutineComponent, coroutine.key);
  fiber.type = coroutine.handler;
  fiber.pendingProps = coroutine;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromYield = function(yieldNode : ReactYield, priorityLevel : PriorityLevel) : YieldComponentFiber {
  const fiber = createFiber(YieldComponent, yieldNode.key);
  fiber.pendingProps = {};
  return fiber;
};

exports.createFiberFromPortal = function(portal : ReactPortal, priorityLevel : PriorityLevel) : HostPortalFiber {
  const fiber = createFiber(HostPortal, portal.key);
  fiber.pendingProps = portal.children;
  fiber.pendingWorkPriority = priorityLevel;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    implementation: portal.implementation,
  };
  return fiber;
};
