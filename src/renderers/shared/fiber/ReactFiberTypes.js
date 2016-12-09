/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberTypes
 * @flow
 */

'use strict';

import type { ReactFragment, ReactNode } from 'ReactTypes';
import type { ReactCoroutine, ReactYield } from 'ReactCoroutine';
import type { ReactPortal } from 'ReactPortal';
import type { TypeOfSideEffect } from 'ReactTypeOfSideEffect';
import type { PriorityLevel } from 'ReactPriorityLevel';
import type { UpdateQueue } from 'ReactFiberUpdateQueue';

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.
type FiberOld = {
  // These first fields are conceptually members of an Instance. This used to
  // be split into a separate type and intersected with the other Fiber fields,
  // but until Flow fixes its intersection bugs, we've merged them into a
  // single type.

  // An Instance is shared between all versions of a component. We can easily
  // break this out into a separate object to avoid copying so much to the
  // alternate versions of the tree. We put this on a single object for now to
  // minimize the number of objects created during the initial render.

  // Tag identifying the type of fiber.
  tag: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,

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

type Node<T> = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?T,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,
};

type Parent = {
  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,
};

type Terminal = {
  // On terminal nodes, these fields are unused
  child: null,
  progressedChild: null,
  progressedFirstDeletion: null,
  progressedLastDeletion: null,
};

type Child = {
  sibling: ?ChildFiber,
  return: ?ParentFiber,
};

type Root = {
  // On root nodes, these fields are unused
  return: null,
  sibling: null,
};

type Stateless<Props> = {
  pendingProps: ?Props,
  memoizedProps: ?Props,
  // On stateless nodes, these fields are unused
  updateQueue: null,
  memoizedState: null,
  callbackList: null,
};

type Stateful<Props, State> = {
  pendingProps: ?Props,
  memoizedProps: ?Props,
  updateQueue: ?UpdateQueue, // TODO: Type UpdateQueue more precisely using State type.
  memoizedState: State,
  callbackList: ?UpdateQueue,
};

type ReactFunctionalComponent<Props> = (props : Props, context : any) => ReactNode;
type ReactClassComponent<Props, State> = React$Component<any, Props, State>;

export type IndeterminateComponentFiber =
  Node<IndeterminateComponentFiber>
  & Parent
  & Child
  & Stateless<any>
  & {
    tag: 0,
    type: ReactFunctionalComponent<any> | ReactClassComponent<any, any>,
    ref: null,
    stateNode: null,
  };

export type FunctionalComponentFiber<Props> =
  Node<FunctionalComponentFiber<Props>>
  & Parent
  & Child
  & Stateless<Props>
  & {
    tag: 1,
    type: ReactFunctionalComponent<Props>,
    ref: null,
    stateNode: null,
  };

export type ClassComponentFiber<Props, State> =
  Node<ClassComponentFiber<Props, State>>
  & Parent
  & Child
  & Stateful<Props, State>
  & {
    tag: 2,
    type: Class<ReactClassComponent<Props, State>>,
    ref: null | (((handle : ?ReactClassComponent<Props, State>) => void) & { _stringRef: ?string }),
    stateNode: ReactClassComponent<Props, State>,
  };

export type HostRootFiber =
  Node<HostRootFiber>
  & Parent
  & Root
  & Stateless<ReactNode>
  & {
    tag: 3,
    type: null,
    ref: null,
    stateNode: null,
  };

export type HostPortalFiber =
  Node<HostPortalFiber>
  & Child
  & Parent
  & Stateless<ReactNode>
  & {
    tag: 4,
    type: null,
    ref: null,
    stateNode: null,
  };

export type HostComponentFiber =
  Node<HostComponentFiber>
  & Child
  & Parent
  & Stateless<Object>
  & {
    tag: 5,
    type: string,
    ref: null | (((handle : ?Object) => void) & { _stringRef: ?string }),
    stateNode: ?Object,
  };

export type HostTextFiber =
  Node<HostTextFiber>
  & Child
  & Terminal
  & Stateless<string>
  & {
    tag: 6,
    type: null,
    ref: null,
    stateNode: ?Object,
  };

export type CoroutineComponentFiber =
  Node<CoroutineComponentFiber>
  & Child
  & Parent
  & Stateless<ReactCoroutine>
  & {
    tag: 7,
    type: any,
    ref: null,
    stateNode: ?Fiber,
  };

export type CoroutineHandlerPhaseFiber =
  Node<CoroutineHandlerPhaseFiber>
  & Child
  & Parent
  & Stateless<ReactCoroutine>
  & {
    tag: 8,
    type: any,
    ref: null,
    stateNode: ?Fiber,
  };

export type YieldComponentFiber =
  Node<YieldComponentFiber>
  & Child
  & Terminal
  & Stateless<{||}>
  & {
    tag: 9,
    type: any,
    ref: null,
    stateNode: null,
  };

export type FragmentFiber =
  Node<FragmentFiber>
  & Child
  & Parent
  & Stateless<ReactFragment>
  & {
    tag: 10,
    type: null,
    ref: null,
    stateNode: null,
  };
