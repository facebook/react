/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactComponentInfo} from 'shared/ReactTypes';

import {
  describeBuiltInComponentFrame,
  describeFunctionComponentFrame,
  describeClassComponentFrame,
} from 'shared/ReactComponentStackFrame';

import {enableOwnerStacks} from 'shared/ReactFeatureFlags';

import {formatOwnerStack} from './ReactFizzOwnerStack';

// DEV-only reverse linked list representing the current component stack
type BuiltInComponentStackNode = {
  tag: 0,
  parent: null | ComponentStackNode,
  type: string,
  owner?: null | ReactComponentInfo | ComponentStackNode, // DEV only
  stack?: null | string | Error, // DEV only
};
type FunctionComponentStackNode = {
  tag: 1,
  parent: null | ComponentStackNode,
  type: Function,
  owner?: null | ReactComponentInfo | ComponentStackNode, // DEV only
  stack?: null | string | Error, // DEV only
};
type ClassComponentStackNode = {
  tag: 2,
  parent: null | ComponentStackNode,
  type: Function,
  owner?: null | ReactComponentInfo | ComponentStackNode, // DEV only
  stack?: null | string | Error, // DEV only
};
type ServerComponentStackNode = {
  // DEV only
  tag: 3,
  parent: null | ComponentStackNode,
  type: string, // name + env
  owner?: null | ReactComponentInfo | ComponentStackNode, // DEV only
  stack?: null | string | Error, // DEV only
};
export type ComponentStackNode =
  | BuiltInComponentStackNode
  | FunctionComponentStackNode
  | ClassComponentStackNode
  | ServerComponentStackNode;

export function getStackByComponentStackNode(
  componentStack: ComponentStackNode,
): string {
  try {
    let info = '';
    let node: ComponentStackNode = componentStack;
    do {
      switch (node.tag) {
        case 0:
          info += describeBuiltInComponentFrame(node.type);
          break;
        case 1:
          info += describeFunctionComponentFrame(node.type);
          break;
        case 2:
          info += describeClassComponentFrame(node.type);
          break;
        case 3:
          if (__DEV__) {
            info += describeBuiltInComponentFrame(node.type);
            break;
          }
      }
      // $FlowFixMe[incompatible-type] we bail out when we get a null
      node = node.parent;
    } while (node);
    return info;
  } catch (x) {
    return '\nError generating stack: ' + x.message + '\n' + x.stack;
  }
}

function describeFunctionComponentFrameWithoutLineNumber(fn: Function): string {
  // We use this because we don't actually want to describe the line of the component
  // but just the component name.
  const name = fn ? fn.displayName || fn.name : '';
  return name ? describeBuiltInComponentFrame(name) : '';
}

export function getOwnerStackByComponentStackNodeInDev(
  componentStack: ComponentStackNode,
): string {
  if (!enableOwnerStacks || !__DEV__) {
    return '';
  }
  try {
    let info = '';

    // The owner stack of the current component will be where it was created, i.e. inside its owner.
    // There's no actual name of the currently executing component. Instead, that is available
    // on the regular stack that's currently executing. However, for built-ins there is no such
    // named stack frame and it would be ignored as being internal anyway. Therefore we add
    // add one extra frame just to describe the "current" built-in component by name.
    // Similarly, if there is no owner at all, then there's no stack frame so we add the name
    // of the root component to the stack to know which component is currently executing.
    switch (componentStack.tag) {
      case 0:
        info += describeBuiltInComponentFrame(componentStack.type);
        break;
      case 1:
      case 2:
        if (!componentStack.owner) {
          // Only if we have no other data about the callsite do we add
          // the component name as the single stack frame.
          info += describeFunctionComponentFrameWithoutLineNumber(
            componentStack.type,
          );
        }
        break;
      case 3:
        if (!componentStack.owner) {
          info += describeBuiltInComponentFrame(componentStack.type);
        }
        break;
    }

    let owner: void | null | ComponentStackNode | ReactComponentInfo =
      componentStack;

    while (owner) {
      if (typeof owner.tag === 'number') {
        const node: ComponentStackNode = (owner: any);
        owner = node.owner;
        let debugStack = node.stack;
        // If we don't actually print the stack if there is no owner of this JSX element.
        // In a real app it's typically not useful since the root app is always controlled
        // by the framework. These also tend to have noisy stacks because they're not rooted
        // in a React render but in some imperative bootstrapping code. It could be useful
        // if the element was created in module scope. E.g. hoisted. We could add a a single
        // stack frame for context for example but it doesn't say much if that's a wrapper.
        if (owner && debugStack) {
          if (typeof debugStack !== 'string') {
            // Stash the formatted stack so that we can avoid redoing the filtering.
            node.stack = debugStack = formatOwnerStack(debugStack);
          }
          if (debugStack !== '') {
            info += '\n' + debugStack;
          }
        }
      } else if (typeof owner.stack === 'string') {
        // Server Component
        const ownerStack: string = owner.stack;
        owner = owner.owner;
        if (owner && ownerStack !== '') {
          info += '\n' + ownerStack;
        }
      } else {
        break;
      }
    }
    return info;
  } catch (x) {
    return '\nError generating stack: ' + x.message + '\n' + x.stack;
  }
}
