/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

import invariant from 'shared/invariant';

// TODO: Move to format config.
const isPrimaryRenderer = true;

let rendererSigil;
if (__DEV__) {
  // Use this to detect multiple renderers using the same context
  rendererSigil = {};
}

// Used to store the parent path of all context overrides in a shared linked list.
// Forming a reverse tree.
type ContextNode<T> = {
  parent: null | ContextNode<any>,
  depth: number, // Short hand to compute the depth of the tree at this node.
  context: ReactContext<T>,
  parentValue: T,
  value: T,
};

// The structure of a context snapshot is an implementation of this file.
// Currently, it's implemented as tracking the current active node.
export opaque type ContextSnapshot = null | ContextNode<any>;

export const rootContextSnapshot: ContextSnapshot = null;

// We assume that this runtime owns the "current" field on all ReactContext instances.
// This global (actually thread local) state represents what state all those "current",
// fields are currently in.
let currentActiveSnapshot: ContextSnapshot = null;

// Perform context switching to the new snapshot.
export function switchContext(newSnapshot: ContextSnapshot): void {
  // TODO: Switch the context.
}

export function pushProvider<T>(
  context: ReactContext<T>,
  nextValue: T,
): ContextSnapshot {
  let prevValue;
  if (isPrimaryRenderer) {
    prevValue = context._currentValue;
    context._currentValue = nextValue;
    if (__DEV__) {
      if (
        context._currentRenderer !== undefined &&
        context._currentRenderer !== null &&
        context._currentRenderer !== rendererSigil
      ) {
        console.error(
          'Detected multiple renderers concurrently rendering the ' +
            'same context provider. This is currently unsupported.',
        );
      }
      context._currentRenderer = rendererSigil;
    }
  } else {
    prevValue = context._currentValue2;
    context._currentValue2 = nextValue;
    if (__DEV__) {
      if (
        context._currentRenderer2 !== undefined &&
        context._currentRenderer2 !== null &&
        context._currentRenderer2 !== rendererSigil
      ) {
        console.error(
          'Detected multiple renderers concurrently rendering the ' +
            'same context provider. This is currently unsupported.',
        );
      }
      context._currentRenderer2 = rendererSigil;
    }
  }
  const prevNode = currentActiveSnapshot;
  const newNode: ContextNode<T> = {
    parent: prevNode,
    depth: prevNode === null ? 0 : prevNode.depth + 1,
    context: context,
    parentValue: prevValue,
    value: nextValue,
  };
  currentActiveSnapshot = newNode;
  return newNode;
}

export function popProvider<T>(context: ReactContext<T>): void {
  const prevSnapshot = currentActiveSnapshot;
  invariant(
    prevSnapshot !== null,
    'Tried to pop a Context at the root of the app. This is a bug in React.',
  );
  if (__DEV__) {
    if (prevSnapshot.context !== context) {
      console.error(
        'The parent context is not the expected context. This is probably a bug in React.',
      );
    }
  }
  if (isPrimaryRenderer) {
    prevSnapshot.context._currentValue = prevSnapshot.parentValue;
    if (__DEV__) {
      if (
        context._currentRenderer !== undefined &&
        context._currentRenderer !== null &&
        context._currentRenderer !== rendererSigil
      ) {
        console.error(
          'Detected multiple renderers concurrently rendering the ' +
            'same context provider. This is currently unsupported.',
        );
      }
      context._currentRenderer = rendererSigil;
    }
  } else {
    prevSnapshot.context._currentValue2 = prevSnapshot.parentValue;
    if (__DEV__) {
      if (
        context._currentRenderer2 !== undefined &&
        context._currentRenderer2 !== null &&
        context._currentRenderer2 !== rendererSigil
      ) {
        console.error(
          'Detected multiple renderers concurrently rendering the ' +
            'same context provider. This is currently unsupported.',
        );
      }
      context._currentRenderer2 = rendererSigil;
    }
  }
  currentActiveSnapshot = prevSnapshot.parent;
}

export function getActiveContext(): ContextSnapshot {
  return currentActiveSnapshot;
}
