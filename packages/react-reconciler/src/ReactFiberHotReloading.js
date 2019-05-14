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

import {
  flushSync,
  scheduleWork,
  flushPassiveEffects,
} from './ReactFiberScheduler';
import {Sync} from './ReactFiberExpirationTime';
import {
  FunctionComponent,
  ForwardRef,
  MemoComponent,
  SimpleMemoComponent,
} from 'shared/ReactWorkTags';
import {REACT_FORWARD_REF_TYPE, REACT_MEMO_TYPE} from 'shared/ReactSymbols';

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

let familiesByType: WeakMap<any, Family> | null = null;
let fibersWithForcedRender: Set<Fiber> | null = null;
let fibersWithIgnoredDependencies: Set<Fiber> | null = null;

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
          return {...type, render: currentRender};
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
    switch (fiber.tag) {
      case FunctionComponent: {
        if (typeof nextType === 'function') {
          needsCompareFamilies = true;
        }
        break;
      }
      case ForwardRef: {
        if (
          typeof nextType === 'object' &&
          nextType !== null &&
          nextType.$$typeof === REACT_FORWARD_REF_TYPE
        ) {
          needsCompareFamilies = true;
        }
        break;
      }
      case MemoComponent:
      case SimpleMemoComponent: {
        if (
          typeof nextType === 'object' &&
          nextType !== null &&
          nextType.$$typeof === REACT_MEMO_TYPE
        ) {
          // TODO: if it was but can no longer be simple,
          // we shouldn't set this.
          needsCompareFamilies = true;
        }
        break;
      }
      // TODO: maybe support lazy?
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

export function shouldForceRenderForHotReloading(fiber: Fiber | null): boolean {
  if (__DEV__) {
    if (fiber === null) {
      return false;
    }
    if (fibersWithForcedRender === null) {
      // Not hot reloading now.
      return false;
    }
    return fibersWithForcedRender.has(fiber);
  } else {
    return false;
  }
}

export function shouldIgnoreDependenciesForHotReloading(fiber: Fiber): boolean {
  if (__DEV__) {
    if (fibersWithIgnoredDependencies === null) {
      // Not hot reloading now.
      return false;
    }
    return fibersWithIgnoredDependencies.has(fiber);
  } else {
    return false;
  }
}

export function scheduleHotUpdate(hotUpdate: HotUpdate): void {
  if (__DEV__) {
    // TODO: warn if its identity changes over time?
    familiesByType = hotUpdate.familiesByType;

    const {root, staleFamilies, updatedFamilies} = hotUpdate;
    flushPassiveEffects();
    fibersWithForcedRender = new Set();
    fibersWithIgnoredDependencies = new Set();
    try {
      flushSync(() => {
        scheduleFibersWithFamiliesRecursively(
          root.current,
          updatedFamilies,
          staleFamilies,
        );
      });
    } finally {
      fibersWithForcedRender = null;
      fibersWithIgnoredDependencies = null;
    }
    flushPassiveEffects();
  }
}

function scheduleFibersWithFamiliesRecursively(
  fiber: Fiber,
  updatedFamilies: Set<Family>,
  staleFamilies: Set<Family>,
) {
  if (__DEV__) {
    const {child, sibling, tag, type} = fiber;

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

    if (fibersWithForcedRender === null) {
      throw new Error(
        'Expected fibersWithForcedRender to be set during hot reload.',
      );
    }
    if (fibersWithIgnoredDependencies === null) {
      throw new Error(
        'Expected fibersWithIgnoredDependencies to be set during hot reload.',
      );
    }
    if (familiesByType === null) {
      throw new Error('Expected familiesByType to be set during hot reload.');
    }

    if (candidateType !== null) {
      const family = familiesByType.get(candidateType);
      if (family !== undefined) {
        if (staleFamilies.has(family)) {
          let fiberToRemount = fiber;
          // Force a remount by changing the element type.
          // If necessary, do this for more than a single fiber on parent path.
          while (true) {
            fiberToRemount.elementType = 'DELETED';
            if (fiberToRemount.alternate !== null) {
              fiberToRemount.alternate.elementType = 'DELETED';
            }
            const parent = fiberToRemount.return;
            if (parent !== null && parent.tag === MemoComponent) {
              // Memo components can't reconcile themelves so
              // delete them too until we find a non-memo parent.
              fiberToRemount = parent;
            } else {
              break;
            }
          }
          // Schedule the parent.
          const parent = fiberToRemount.return;
          if (parent !== null) {
            fibersWithForcedRender.add(parent);
            const alternate = parent.alternate;
            if (alternate !== null) {
              fibersWithForcedRender.add(alternate);
            }
            scheduleWork(parent, Sync);
          }
        } else if (updatedFamilies.has(family)) {
          // Force a re-render and remount Hooks with dependencies.
          fibersWithForcedRender.add(fiber);
          fibersWithIgnoredDependencies.add(fiber);
          const alternate = fiber.alternate;
          if (alternate !== null) {
            fibersWithForcedRender.add(alternate);
            fibersWithIgnoredDependencies.add(alternate);
          }
          // Schedule itself.
          scheduleWork(fiber, Sync);
        }
      }
    }

    if (child !== null) {
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
