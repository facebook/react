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
} from './ReactFiberScheduler';
import {Sync} from './ReactFiberExpirationTime';
import {findCurrentFiberUsingSlowPath} from './ReactFiberTreeReflection';
import {
  FunctionComponent,
  ForwardRef,
  MemoComponent,
  SimpleMemoComponent,
  HostComponent,
} from 'shared/ReactWorkTags';
import {
  REACT_FORWARD_REF_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
} from 'shared/ReactSymbols';

type Family = {|
  currentType: any,
  currentSignature: null | string,
|};

type HotUpdate = {|
  familiesByType: WeakMap<any, Family>,
  root: FiberRoot,
  staleFamilies: Set<Family>,
  updatedFamilies: Set<Family>,
|};

type HotUpdateResult = {|
  hostNodesForVisualFeedback: Array<Instance>,
|};

let familiesByType: WeakMap<any, Family> | null = null;
// $FlowFixMe Flow gets confused by a WeakSet feature check below.
let failedBoundaries: WeakSet<Fiber> | null = null;

export function resolveFunctionForHotReloading(type: any): any {
  if (__DEV__) {
    if (familiesByType === null) {
      // Hot reloading is disabled.
      return type;
    }
    let family = familiesByType.get(type);
    if (family === undefined) {
      return type;
    }
    // Use the latest known implementation.
    return family.currentType;
  } else {
    return type;
  }
}

export function resolveForwardRefForHotReloading(type: any): any {
  if (__DEV__) {
    if (familiesByType === null) {
      // Hot reloading is disabled.
      return type;
    }
    let family = familiesByType.get(type);
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
    return family.currentType;
  } else {
    return type;
  }
}

export function isCompatibleFamilyForHotReloading(
  fiber: Fiber,
  element: ReactElement,
): boolean {
  if (__DEV__) {
    if (familiesByType === null) {
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
      const prevFamily = familiesByType.get(prevType);
      if (
        prevFamily !== undefined &&
        prevFamily === familiesByType.get(nextType)
      ) {
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
    if (familiesByType === null) {
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

export function scheduleHotUpdate(hotUpdate: HotUpdate): HotUpdateResult {
  if (__DEV__) {
    // TODO: warn if its identity changes over time?
    familiesByType = hotUpdate.familiesByType;

    const affectedSubtrees = new Set();
    const {root, staleFamilies, updatedFamilies} = hotUpdate;
    flushPassiveEffects();
    flushSync(() => {
      scheduleFibersWithFamiliesRecursively(
        root.current,
        updatedFamilies,
        staleFamilies,
        affectedSubtrees,
      );
    });

    const hostNodesForVisualFeedback = findHostNodesForVisualFeedback(
      affectedSubtrees,
    );
    return {hostNodesForVisualFeedback};
  } else {
    throw new Error(
      'Did not expect this call in production. ' +
        'This is a bug in React. Please file an issue.',
    );
  }
}

function scheduleFibersWithFamiliesRecursively(
  fiber: Fiber,
  updatedFamilies: Set<Family>,
  staleFamilies: Set<Family>,
  affectedSubtrees: Set<Fiber> | null,
) {
  if (__DEV__) {
    const {alternate, child, sibling, tag, type} = fiber;

    let candidateType = null;
    switch (tag) {
      case FunctionComponent:
      case SimpleMemoComponent:
        candidateType = type;
        break;
      case ForwardRef:
        candidateType = type.render;
        break;
      default:
        break;
    }

    if (familiesByType === null) {
      throw new Error('Expected familiesByType to be set during hot reload.');
    }

    let needsRender = false;
    let needsRemount = false;
    if (candidateType !== null) {
      const family = familiesByType.get(candidateType);
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
      if (affectedSubtrees !== null) {
        affectedSubtrees.add(fiber);
      }
    }

    if (child !== null && !needsRemount) {
      scheduleFibersWithFamiliesRecursively(
        child,
        updatedFamilies,
        staleFamilies,
        // We don't track affected Fibers deeper than
        // the outermost component that was affected.
        // So if we re-render this Fiber, there's no need
        // to pass the affected subtree Set to its children.
        needsRender ? null : affectedSubtrees,
      );
    }

    if (sibling !== null) {
      scheduleFibersWithFamiliesRecursively(
        sibling,
        updatedFamilies,
        staleFamilies,
        affectedSubtrees,
      );
    }
  }
}

function findHostNodesForVisualFeedback(fibers: Set<Fiber>): Array<Instance> {
  if (__DEV__) {
    // TODO: deal with unmounted Fibers.
    const hostNodeSet = new Set();
    fibers.forEach(fiber => {
      const hostFibers = findAllCurrentHostFibers(fiber);
      hostFibers.forEach(hostFiber => {
        hostNodeSet.add(hostFiber.stateNode);
      });
    });
    return Array.from(hostNodeSet);
  } else {
    throw new Error(
      'Did not expect this call in production. ' +
        'This is a bug in React. Please file an issue.',
    );
  }
}

function findAllCurrentHostFibers(parent: Fiber): Array<Fiber> {
  if (__DEV__) {
    const fibers = [];
    const currentParent = findCurrentFiberUsingSlowPath(parent);
    if (!currentParent) {
      return fibers;
    }

    let node: Fiber = currentParent;
    while (true) {
      if (node.tag === HostComponent) {
        fibers.push(node);
      } else if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === currentParent) {
        return fibers;
      }
      while (!node.sibling) {
        if (!node.return || node.return === currentParent) {
          return fibers;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
    // eslint-disable-next-line no-unreachable
    return fibers;
  } else {
    throw new Error(
      'Did not expect this call in production. ' +
        'This is a bug in React. Please file an issue.',
    );
  }
}
