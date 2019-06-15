/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactElement} from 'shared/ReactElementType';
import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';
import type {Instance} from './ReactFiberHostConfig';

import {
  flushSync,
  scheduleWork,
  flushPassiveEffects,
} from './ReactFiberWorkLoop';
import {Sync} from './ReactFiberExpirationTime';
import {
  ClassComponent,
  FunctionComponent,
  ForwardRef,
  HostComponent,
  HostPortal,
  HostRoot,
  MemoComponent,
  SimpleMemoComponent,
} from 'shared/ReactWorkTags';
import {
  REACT_FORWARD_REF_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
} from 'shared/ReactSymbols';

export type Family = {|
  current: any,
|};

export type HotUpdate = {|
  resolveFamily: (any => Family | void) | null,
  staleFamilies: Set<Family>,
  updatedFamilies: Set<Family>,
|};

let resolveFamily: (any => Family | void) | null = null;
// $FlowFixMe Flow gets confused by a WeakSet feature check below.
let failedBoundaries: WeakSet<Fiber> | null = null;

export function resolveFunctionForHotReloading(type: any): any {
  if (__DEV__) {
    if (resolveFamily === null) {
      // Hot reloading is disabled.
      return type;
    }
    let family = resolveFamily(type);
    if (family === undefined) {
      return type;
    }
    // Use the latest known implementation.
    return family.current;
  } else {
    return type;
  }
}

export function resolveClassForHotReloading(type: any): any {
  // No implementation differences.
  return resolveFunctionForHotReloading(type);
}

export function resolveForwardRefForHotReloading(type: any): any {
  if (__DEV__) {
    if (resolveFamily === null) {
      // Hot reloading is disabled.
      return type;
    }
    let family = resolveFamily(type);
    if (family === undefined) {
      // Check if we're dealing with a real forwardRef. Don't want to crash early.
      if (
        type !== null &&
        type !== undefined &&
        typeof type.render === 'function'
      ) {
        // ForwardRef is special because its resolved .type is an object,
        // but it's possible that we only have its inner render function in the map.
        // If that inner render function is different, we'll build a new forwardRef type.
        const currentRender = resolveFunctionForHotReloading(type.render);
        if (type.render !== currentRender) {
          const syntheticType = {
            $$typeof: REACT_FORWARD_REF_TYPE,
            render: currentRender,
          };
          if (type.displayName !== undefined) {
            (syntheticType: any).displayName = type.displayName;
          }
          return syntheticType;
        }
      }
      return type;
    }
    // Use the latest known implementation.
    return family.current;
  } else {
    return type;
  }
}

export function isCompatibleFamilyForHotReloading(
  fiber: Fiber,
  element: ReactElement,
): boolean {
  if (__DEV__) {
    if (resolveFamily === null) {
      // Hot reloading is disabled.
      return false;
    }

    const prevType = fiber.elementType;
    const nextType = element.type;

    // If we got here, we know types aren't === equal.
    let needsCompareFamilies = false;

    const $$typeofNextType =
      typeof nextType === 'object' && nextType !== null
        ? nextType.$$typeof
        : null;

    switch (fiber.tag) {
      case ClassComponent: {
        if (typeof nextType === 'function') {
          needsCompareFamilies = true;
        }
        break;
      }
      case FunctionComponent: {
        if (typeof nextType === 'function') {
          needsCompareFamilies = true;
        } else if ($$typeofNextType === REACT_LAZY_TYPE) {
          // We don't know the inner type yet.
          // We're going to assume that the lazy inner type is stable,
          // and so it is sufficient to avoid reconciling it away.
          // We're not going to unwrap or actually use the new lazy type.
          needsCompareFamilies = true;
        }
        break;
      }
      case ForwardRef: {
        if ($$typeofNextType === REACT_FORWARD_REF_TYPE) {
          needsCompareFamilies = true;
        } else if ($$typeofNextType === REACT_LAZY_TYPE) {
          needsCompareFamilies = true;
        }
        break;
      }
      case MemoComponent:
      case SimpleMemoComponent: {
        if ($$typeofNextType === REACT_MEMO_TYPE) {
          // TODO: if it was but can no longer be simple,
          // we shouldn't set this.
          needsCompareFamilies = true;
        } else if ($$typeofNextType === REACT_LAZY_TYPE) {
          needsCompareFamilies = true;
        }
        break;
      }
      default:
        return false;
    }

    // Check if both types have a family and it's the same one.
    if (needsCompareFamilies) {
      // Note: memo() and forwardRef() we'll compare outer rather than inner type.
      // This means both of them need to be registered to preserve state.
      // If we unwrapped and compared the inner types for wrappers instead,
      // then we would risk falsely saying two separate memo(Foo)
      // calls are equivalent because they wrap the same Foo function.
      const prevFamily = resolveFamily(prevType);
      if (prevFamily !== undefined && prevFamily === resolveFamily(nextType)) {
        return true;
      }
    }
    return false;
  } else {
    return false;
  }
}

export function markFailedErrorBoundaryForHotReloading(fiber: Fiber) {
  if (__DEV__) {
    if (resolveFamily === null) {
      // Not hot reloading.
      return;
    }
    if (typeof WeakSet !== 'function') {
      return;
    }
    if (failedBoundaries === null) {
      failedBoundaries = new WeakSet();
    }
    failedBoundaries.add(fiber);
  }
}

export function scheduleHotUpdate(root: FiberRoot, hotUpdate: HotUpdate): void {
  if (__DEV__) {
    // TODO: warn if its identity changes over time?
    resolveFamily = hotUpdate.resolveFamily;

    const {staleFamilies, updatedFamilies} = hotUpdate;
    flushPassiveEffects();
    flushSync(() => {
      scheduleFibersWithFamiliesRecursively(
        root.current,
        updatedFamilies,
        staleFamilies,
      );
    });
  }
}

function scheduleFibersWithFamiliesRecursively(
  fiber: Fiber,
  updatedFamilies: Set<Family>,
  staleFamilies: Set<Family>,
) {
  if (__DEV__) {
    const {alternate, child, sibling, tag, type} = fiber;

    let candidateType = null;
    switch (tag) {
      case FunctionComponent:
      case SimpleMemoComponent:
      case ClassComponent:
        candidateType = type;
        break;
      case ForwardRef:
        candidateType = type.render;
        break;
      default:
        break;
    }

    if (resolveFamily === null) {
      throw new Error('Expected resolveFamily to be set during hot reload.');
    }

    let needsRender = false;
    let needsRemount = false;
    if (candidateType !== null) {
      const family = resolveFamily(candidateType);
      if (family !== undefined) {
        if (staleFamilies.has(family)) {
          needsRemount = true;
        } else if (updatedFamilies.has(family)) {
          needsRender = true;
        }
      }
    }
    if (failedBoundaries !== null) {
      if (
        failedBoundaries.has(fiber) ||
        (alternate !== null && failedBoundaries.has(alternate))
      ) {
        needsRemount = true;
      }
    }

    if (needsRemount) {
      fiber._debugNeedsRemount = true;
    }
    if (needsRemount || needsRender) {
      scheduleWork(fiber, Sync);
    }
    if (child !== null && !needsRemount) {
      scheduleFibersWithFamiliesRecursively(
        child,
        updatedFamilies,
        staleFamilies,
      );
    }
    if (sibling !== null) {
      scheduleFibersWithFamiliesRecursively(
        sibling,
        updatedFamilies,
        staleFamilies,
      );
    }
  }
}

export function findHostNodesForHotUpdate(
  root: FiberRoot,
  families: Array<Family>,
): Set<Instance> {
  if (__DEV__) {
    const hostNodes = new Set();
    const types = new Set(families.map(family => family.current));
    findHostNodesForMatchingFibersRecursively(root.current, types, hostNodes);
    return hostNodes;
  } else {
    throw new Error(
      'Did not expect findHostNodesForHotUpdate to be called in production.',
    );
  }
}

function findHostNodesForMatchingFibersRecursively(
  fiber: Fiber,
  types: Set<any>,
  hostNodes: Set<Instance>,
) {
  if (__DEV__) {
    const {child, sibling, tag, type} = fiber;

    let candidateType = null;
    switch (tag) {
      case FunctionComponent:
      case SimpleMemoComponent:
      case ClassComponent:
        candidateType = type;
        break;
      case ForwardRef:
        candidateType = type.render;
        break;
      default:
        break;
    }

    let didMatch = false;
    if (candidateType !== null) {
      if (types.has(candidateType)) {
        didMatch = true;
      }
    }

    if (didMatch) {
      // We have a match. This only drills down to the closest host components.
      // There's no need to search deeper because for the purpose of giving
      // visual feedback, "flashing" outermost parent rectangles is sufficient.
      findHostNodesForFiberShallowly(fiber, hostNodes);
    } else {
      // If there's no match, maybe there will be one further down in the child tree.
      if (child !== null) {
        findHostNodesForMatchingFibersRecursively(child, types, hostNodes);
      }
    }

    if (sibling !== null) {
      findHostNodesForMatchingFibersRecursively(sibling, types, hostNodes);
    }
  }
}

function findHostNodesForFiberShallowly(
  fiber: Fiber,
  hostNodes: Set<Instance>,
): void {
  if (__DEV__) {
    const foundHostNodes = findChildHostNodesForFiberShallowly(
      fiber,
      hostNodes,
    );
    if (foundHostNodes) {
      return;
    }
    // If we didn't find any host children, fallback to closest host parent.
    let node = fiber;
    while (true) {
      switch (node.tag) {
        case HostComponent:
          hostNodes.add(node.stateNode);
          return;
        case HostPortal:
          hostNodes.add(node.stateNode.containerInfo);
          return;
        case HostRoot:
          hostNodes.add(node.stateNode.containerInfo);
          return;
      }
      if (node.return === null) {
        throw new Error('Expected to reach root first.');
      }
      node = node.return;
    }
  }
}

function findChildHostNodesForFiberShallowly(
  fiber: Fiber,
  hostNodes: Set<Instance>,
): boolean {
  if (__DEV__) {
    let node: Fiber = fiber;
    let foundHostNodes = false;
    while (true) {
      if (node.tag === HostComponent) {
        // We got a match.
        foundHostNodes = true;
        hostNodes.add(node.stateNode);
        // There may still be more, so keep searching.
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === fiber) {
        return foundHostNodes;
      }
      while (node.sibling === null) {
        if (node.return === null || node.return === fiber) {
          return foundHostNodes;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
  return false;
}
