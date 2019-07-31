/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {
  ReactEventResponder,
  ReactEventResponderInstance,
  ReactEventResponderListener,
} from 'shared/ReactTypes';
import type {Instance} from './ReactFiberHostConfig';

import {SuspenseComponent, Fragment} from 'shared/ReactWorkTags';

export function createResponderListener(
  responder: ReactEventResponder<any, any>,
  props: Object,
): ReactEventResponderListener<any, any> {
  const eventResponderListener = {
    responder,
    props,
  };
  if (__DEV__) {
    Object.freeze(eventResponderListener);
  }
  return eventResponderListener;
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
