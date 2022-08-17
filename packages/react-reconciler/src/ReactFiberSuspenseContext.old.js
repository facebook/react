/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {StackCursor} from './ReactFiberStack.old';
import type {SuspenseState} from './ReactFiberSuspenseComponent.old';

import {enableSuspenseAvoidThisFallback} from 'shared/ReactFeatureFlags';
import {createCursor, push, pop} from './ReactFiberStack.old';
import {isCurrentTreeHidden} from './ReactFiberHiddenContext.old';
import {SuspenseComponent, OffscreenComponent} from './ReactWorkTags';

// The Suspense handler is the boundary that should capture if something
// suspends, i.e. it's the nearest `catch` block on the stack.
const suspenseHandlerStackCursor: StackCursor<Fiber | null> = createCursor(
  null,
);

function shouldAvoidedBoundaryCapture(
  workInProgress: Fiber,
  handlerOnStack: Fiber,
  props: any,
): boolean {
  if (enableSuspenseAvoidThisFallback) {
    // If the parent is already showing content, and we're not inside a hidden
    // tree, then we should show the avoided fallback.
    if (handlerOnStack.alternate !== null && !isCurrentTreeHidden()) {
      return true;
    }

    // If the handler on the stack is also an avoided boundary, then we should
    // favor this inner one.
    if (
      handlerOnStack.tag === SuspenseComponent &&
      handlerOnStack.memoizedProps.unstable_avoidThisFallback === true
    ) {
      return true;
    }

    // If this avoided boundary is dehydrated, then it should capture.
    const suspenseState: SuspenseState | null = workInProgress.memoizedState;
    if (suspenseState !== null && suspenseState.dehydrated !== null) {
      return true;
    }
  }

  // If none of those cases apply, then we should avoid this fallback and show
  // the outer one instead.
  return false;
}

export function pushPrimaryTreeSuspenseHandler(handler: Fiber): void {
  const props = handler.pendingProps;
  const handlerOnStack = suspenseHandlerStackCursor.current;
  if (
    enableSuspenseAvoidThisFallback &&
    props.unstable_avoidThisFallback === true &&
    handlerOnStack !== null &&
    !shouldAvoidedBoundaryCapture(handler, handlerOnStack, props)
  ) {
    // This boundary should not capture if something suspends. Reuse the
    // existing handler on the stack.
    push(suspenseHandlerStackCursor, handlerOnStack, handler);
  } else {
    // Push this handler onto the stack.
    push(suspenseHandlerStackCursor, handler, handler);
  }
}

export function pushFallbackTreeSuspenseHandler(fiber: Fiber): void {
  // We're about to render the fallback. If something in the fallback suspends,
  // it's akin to throwing inside of a `catch` block. This boundary should not
  // capture. Reuse the existing handler on the stack.
  reuseSuspenseHandlerOnStack(fiber);
}

export function pushOffscreenSuspenseHandler(fiber: Fiber): void {
  if (fiber.tag === OffscreenComponent) {
    push(suspenseHandlerStackCursor, fiber, fiber);
  } else {
    // This is a LegacyHidden component.
    reuseSuspenseHandlerOnStack(fiber);
  }
}

export function reuseSuspenseHandlerOnStack(fiber: Fiber) {
  push(suspenseHandlerStackCursor, getSuspenseHandler(), fiber);
}

export function getSuspenseHandler(): Fiber | null {
  return suspenseHandlerStackCursor.current;
}

export function popSuspenseHandler(fiber: Fiber): void {
  pop(suspenseHandlerStackCursor, fiber);
}

// SuspenseList context
// TODO: Move to a separate module? We may change the SuspenseList
// implementation to hide/show in the commit phase, anyway.
export opaque type SuspenseContext = number;
export opaque type SubtreeSuspenseContext: SuspenseContext = number;
export opaque type ShallowSuspenseContext: SuspenseContext = number;

const DefaultSuspenseContext: SuspenseContext = 0b00;

const SubtreeSuspenseContextMask: SuspenseContext = 0b01;

// ForceSuspenseFallback can be used by SuspenseList to force newly added
// items into their fallback state during one of the render passes.
export const ForceSuspenseFallback: ShallowSuspenseContext = 0b10;

export const suspenseStackCursor: StackCursor<SuspenseContext> = createCursor(
  DefaultSuspenseContext,
);

export function hasSuspenseListContext(
  parentContext: SuspenseContext,
  flag: SuspenseContext,
): boolean {
  return (parentContext & flag) !== 0;
}

export function setDefaultShallowSuspenseListContext(
  parentContext: SuspenseContext,
): SuspenseContext {
  return parentContext & SubtreeSuspenseContextMask;
}

export function setShallowSuspenseListContext(
  parentContext: SuspenseContext,
  shallowContext: ShallowSuspenseContext,
): SuspenseContext {
  return (parentContext & SubtreeSuspenseContextMask) | shallowContext;
}

export function pushSuspenseListContext(
  fiber: Fiber,
  newContext: SuspenseContext,
): void {
  push(suspenseStackCursor, newContext, fiber);
}

export function popSuspenseListContext(fiber: Fiber): void {
  pop(suspenseStackCursor, fiber);
}
