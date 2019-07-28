/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, Dependencies} from './ReactFiber';
import type {
  ReactEventResponder,
  ReactEventResponderInstance,
} from 'shared/ReactTypes';
import type {Instance} from './ReactFiberHostConfig';

import {NoWork} from './ReactFiberExpirationTime';

import {SuspenseComponent, Fragment} from 'shared/ReactWorkTags';

let currentlyRenderingFiber: null | Fiber = null;
let currentListenerHookIndex: number = 0;

export function prepareToReadListenerHooks(workInProgress: Fiber): void {
  currentlyRenderingFiber = workInProgress;
  currentListenerHookIndex = 0;
}

function getListenerHooks(): Array<{
  responder: ReactEventResponder<any, any>,
  props: Object,
}> {
  let listeners;
  let dependencies: Dependencies | null = ((currentlyRenderingFiber: any): Fiber)
    .dependencies;
  if (dependencies === null) {
    dependencies = ((currentlyRenderingFiber: any): Fiber).dependencies = {
      expirationTime: NoWork,
      firstContext: null,
      listeners: [],
      responders: null,
    };
  }
  listeners = dependencies.listeners;
  if (listeners === null) {
    dependencies.listeners = listeners = [];
  }
  return listeners;
}

export function updateListenerHook(
  responder: ReactEventResponder<any, any>,
  props: Object,
) {
  const listeners = getListenerHooks();
  if (listeners.length === currentListenerHookIndex) {
    listeners.push({
      responder,
      props,
    });
    currentListenerHookIndex++;
  } else {
    const currentListenerHook = listeners[currentListenerHookIndex++];
    currentListenerHook.responder = responder;
    currentListenerHook.props = props;
  }
}

export function isFiberSuspenseAndTimedOut(fiber: Fiber): boolean {
  return fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
}

export function getSuspenseFallbackChild(fiber: Fiber): Fiber | null {
  return ((((fiber.child: any): Fiber).sibling: any): Fiber).child;
}

export function isFiberSuspenseTimedOutChild(fiber: Fiber | null): boolean {
  if (fiber === null) {
    return false;
  }
  const parent = fiber.return;
  if (parent !== null && parent.tag === Fragment) {
    const grandParent = parent.return;

    if (
      grandParent !== null &&
      grandParent.tag === SuspenseComponent &&
      grandParent.stateNode !== null
    ) {
      return true;
    }
  }
  return false;
}

export function getSuspenseFiberFromTimedOutChild(fiber: Fiber): Fiber {
  return ((((fiber.return: any): Fiber).return: any): Fiber);
}

export function createResponderInstance(
  responder: ReactEventResponder<any, any>,
  responderProps: Object,
  responderState: Object,
  target: Instance,
  fiber: Fiber,
): ReactEventResponderInstance<any, any> {
  return {
    fiber,
    props: responderProps,
    responder,
    rootEventTypes: null,
    state: responderState,
    target,
  };
}
