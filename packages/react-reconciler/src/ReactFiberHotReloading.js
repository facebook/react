/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable react-internal/prod-error-codes */

import type {ReactElement} from 'shared/ReactElementType';
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {ReactNodeList} from 'shared/ReactTypes';

import {
  flushSyncWork,
  scheduleUpdateOnFiber,
  flushPendingEffects,
} from './ReactFiberWorkLoop';
import {enqueueConcurrentRenderForLane} from './ReactFiberConcurrentUpdates';
import {updateContainerSync} from './ReactFiberReconciler';
import {emptyContextObject} from './ReactFiberContext';
import {SyncLane} from './ReactFiberLane';
import {
  ClassComponent,
  FunctionComponent,
  ForwardRef,
  MemoComponent,
  SimpleMemoComponent,
  HostRoot,
  HostComponent,
} from './ReactWorkTags';
import {
  REACT_FORWARD_REF_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
} from 'shared/ReactSymbols';

export type Family = {
  current: any,
};

export type RefreshUpdate = {
  staleFamilies: Set<Family>,
  updatedFamilies: Set<Family>,
};

// Resolves type to a family.
type RefreshHandler = any => Family | void;

// Used by React Refresh runtime through DevTools Global Hook.
export type SetRefreshHandler = (handler: RefreshHandler | null) => void;
export type ScheduleRefresh = (root: FiberRoot, update: RefreshUpdate) => void;
export type ScheduleRoot = (root: FiberRoot, element: ReactNodeList) => void;

let resolveFamily: RefreshHandler | null = null;
let failedBoundaries: WeakSet<Fiber> | null = null;

export const setRefreshHandler = (handler: RefreshHandler | null): void => {
  if (__DEV__) {
    resolveFamily = handler;
  }
};

export function resolveFunctionForHotReloading(type: any): any {
  const location = new Error().stack
    .split('\n')
    .slice(2, 3)
    .join('')
    .replace(/(.*[\\/])/, '')
    .replace(')', '');
  if (__DEV__) {
    if (resolveFamily === null) {
      console.log(
        '  -> resolveFunctionForHotReloading',
        location,
        type,
        'result -> disabled',
      );
      // Hot reloading is disabled.
      return type;
    }
    const family = resolveFamily(type);
    if (family === undefined) {
      console.log(
        '  -> resolveFunctionForHotReloading',
        location,
        type,
        'result -> not found',
      );
      return type;
    }

    console.log(
      '  -> resolveFunctionForHotReloading',
      location,
      family.current,
      'result -> new family',
    );
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
  const location = new Error().stack
    .split('\n')
    .slice(2, 3)
    .join('')
    .replace(/(.*[\\/])/, '')
    .replace(')', '');
  if (__DEV__) {
    if (resolveFamily === null) {
      console.log(
        '  -> resolveForwardRefForHotReloading',
        location,
        type,
        'result -> disabled',
      );
      // Hot reloading is disabled.
      return type;
    }
    const family = resolveFamily(type);
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
          console.log(
            '  -> resolveForwardRefForHotReloading',
            location,
            syntheticType,
            'result -> synthetic',
          );
          return syntheticType;
        }
      }

      console.log(
        '  -> resolveForwardRefForHotReloading',
        location,
        type,
        'result -> not found',
      );
      return type;
    }
    console.log(
      '  -> resolveForwardRefForHotReloading',
      location,
      type,
      'result -> new family',
    );
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

    console.log('isCompatibleFamilyForHotReloading');
    console.log('      type -> ', fiber.type);
    console.log('  prevType -> ', prevType);
    console.log('  nextType -> ', nextType);

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
      // $FlowFixMe[not-a-function] found when upgrading Flow
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
      // Hot reloading is disabled.
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

export const scheduleRefresh: ScheduleRefresh = (
  root: FiberRoot,
  update: RefreshUpdate,
): void => {
  if (__DEV__) {
    if (resolveFamily === null) {
      // Hot reloading is disabled.
      return;
    }
    const {staleFamilies, updatedFamilies} = update;
    flushPendingEffects();
    scheduleFibersWithFamiliesRecursively(
      root.current,
      updatedFamilies,
      staleFamilies,
    );
    flushSyncWork();
  }
};

export const scheduleRoot: ScheduleRoot = (
  root: FiberRoot,
  element: ReactNodeList,
): void => {
  if (__DEV__) {
    if (root.context !== emptyContextObject) {
      // Super edge case: root has a legacy _renderSubtree context
      // but we don't know the parentComponent so we can't pass it.
      // Just ignore. We'll delete this with _renderSubtree code path later.
      return;
    }
    updateContainerSync(element, root, null, null);
    flushSyncWork();
  }
};

function scheduleFibersWithFamiliesRecursively(
  fiber: Fiber,
  updatedFamilies: Set<Family>,
  staleFamilies: Set<Family>,
): void {
  if (__DEV__) {
    const {alternate, child, sibling, tag, type, elementType} = fiber;

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
    const isTypeStale = staleFamilies.has(resolveFamily(type));
    const isElementTypeStale = staleFamilies.has(resolveFamily(elementType));
    const isCandidateTypeStale = staleFamilies.has(resolveFamily(elementType));

    if (staleFamilies.has(resolveFamily(elementType))) {
      needsRemount = true;
    }

    if (candidateType !== null) {
      const family = resolveFamily(candidateType);
      if (family !== undefined) {
        if (staleFamilies.has(family)) {
          needsRemount = true;
        } else if (updatedFamilies.has(family)) {
          if (tag === ClassComponent) {
            needsRemount = true;
          } else {
            needsRender = true;
          }
        }
      }
    }
    if (failedBoundaries !== null) {
      if (
        failedBoundaries.has(fiber) ||
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        (alternate !== null && failedBoundaries.has(alternate))
      ) {
        needsRemount = true;
      }
    }

    if (tag !== HostRoot && tag !== HostComponent) {
      console.log('scheduleFibersWithFamiliesRecursively');
      console.log('      type stale ->', isTypeStale);
      console.log(' candidate stale ->', isCandidateTypeStale);
      console.log('   element stale ->', isElementTypeStale);
      console.log('             tag ->', tag);
      console.log('   candidateType ->', candidateType);
      console.log('     elementType ->', elementType);
      console.log('            type ->', type);
      console.log('    needs render ->', needsRender);
      console.log('   needs remount ->', needsRemount);
    }

    if (needsRemount) {
      fiber._debugNeedsRemount = true;
    }
    if (needsRemount || needsRender) {
      const root = enqueueConcurrentRenderForLane(fiber, SyncLane);
      if (root !== null) {
        scheduleUpdateOnFiber(root, fiber, SyncLane);
      }
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
