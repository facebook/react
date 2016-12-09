/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberTypes.exploded
 * @flow
 */

'use strict';

import type { ReactFragment, ReactNode } from 'ReactTypes';
import type { ReactCoroutine, ReactYield } from 'ReactCoroutine';
import type { ReactPortal } from 'ReactPortal';
import type { TypeOfWork } from 'ReactTypeOfWork';
import type { TypeOfSideEffect } from 'ReactTypeOfSideEffect';
import type { PriorityLevel } from 'ReactPriorityLevel';
import type { UpdateQueue } from 'ReactFiberUpdateQueue';

type ReactFunctionalComponent<Props> = (props : Props, context : any) => ReactNode;
type ReactClassComponent<Props, State> = React$Component<any, Props, State>;

export type IndeterminateComponentFiber = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?IndeterminateComponentFiber,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 0,
  type: ReactFunctionalComponent<any> | ReactClassComponent<any, any>,
  ref: null | (((handle : ?ReactClassComponent<any, any>) => void) & { _stringRef: ?string }),
  stateNode: null,

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,

  pendingProps: ?any,
  memoizedProps: ?any,
};

export type FunctionalComponentFiber<Props> = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?FunctionalComponentFiber<Props>,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 1,
  type: ReactFunctionalComponent<Props>,
  ref: null | (((handle : ?ReactClassComponent<any, any>) => void) & { _stringRef: ?string }),
  stateNode: null,

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,

  pendingProps: ?Props,
  memoizedProps: ?Props,
};

export type ClassComponentFiber<Props, State> = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?ClassComponentFiber<Props, State>,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 2,
  type: Class<ReactClassComponent<Props, State>>,
  ref: null | (((handle : ?ReactClassComponent<Props, State>) => void) & { _stringRef: ?string }),
  stateNode: ReactClassComponent<Props, State>,

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,

  pendingProps: ?Props,
  memoizedProps: ?Props,
  updateQueue: ?UpdateQueue, // TODO: Type UpdateQueue more precisely using State type.
  memoizedState: State,
  callbackList: ?UpdateQueue,
};

export type HostRootFiber = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?HostRootFiber,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 3,

  sibling: null,
  return: null,

  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,

  pendingProps: ?ReactNode,
  memoizedProps: ?ReactNode,
};

export type HostPortalFiber = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?HostPortalFiber,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 4,
  type: {
    containerInfo: any,
    implementation: any,
  },

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,

  pendingProps: ?ReactNode,
  memoizedProps: ?ReactNode,
};

export type HostComponentFiber = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?HostComponentFiber,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 5,
  type: string,
  ref: null | (((handle : ?Object) => void) & { _stringRef: ?string }),
  stateNode: ?Object,

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,

  pendingProps: ?Object,
  memoizedProps: ?Object,
};

export type HostTextFiber = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?HostTextFiber,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 6,
  stateNode: ?Object,

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: null,
  progressedChild: null,
  progressedFirstDeletion: null,
  progressedLastDeletion: null,

  pendingProps: ?string,
  memoizedProps: ?string,
};

export type CoroutineComponentFiber = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?CoroutineComponentFiber,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 7,
  type: any,
  stateNode: ?Fiber,

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,

  pendingProps: ?ReactCoroutine,
  memoizedProps: ?ReactCoroutine,
};

export type CoroutineHandlerPhaseFiber = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?CoroutineHandlerPhaseFiber,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 8,
  type: any,
  stateNode: ?Fiber,

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,

  pendingProps: ?ReactCoroutine,
  memoizedProps: ?ReactCoroutine,
};

export type YieldComponentFiber = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?YieldComponentFiber,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 9,
  type: any,
  stateNode: null,

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: null,
  progressedChild: null,
  progressedFirstDeletion: null,
  progressedLastDeletion: null,

  pendingProps: ?{||},
  memoizedProps: ?{||},
};

export type FragmentFiber = {
  _debugID ?: number, // __DEV__ only

  +key: null | string,
  index: number,
  alternate: ?FragmentFiber,

  pendingWorkPriority: PriorityLevel,
  progressedPriority: PriorityLevel,

  effectTag: TypeOfSideEffect,
  nextEffect: ?Fiber,
  firstEffect: ?Fiber,
  lastEffect: ?Fiber,

  tag: 10,

  sibling: ?ChildFiber,
  return: ?ParentFiber,

  child: ?ChildFiber,
  progressedChild: ?ChildFiber,
  progressedFirstDeletion: ?ChildFiber,
  progressedLastDeletion: ?ChildFiber,

  pendingProps: ?ReactFragment,
  memoizedProps: ?ReactFragment,
};
