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
  batchedUpdates,
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
  current: any,
|};

type HotReloadingInterface = {|
  scheduleHotUpdate: (root: FiberRoot, families: Set<Family>) => void,
|};

// Avoid any overhead even in DEV when hot reloading is off:
export let resolveTypeForHotReloading = (type: any): any => type;
export let isCompatibleFamilyForHotReloading = (
  fiber: Fiber,
  element: ReactElement,
) => false;

export function enableHotReloading(
  familiesByType: WeakMap<any, Family>,
): ?HotReloadingInterface {
  if (__DEV__) {
    resolveTypeForHotReloading = type => {
      let family = familiesByType.get(type);
      if (family === undefined) {
        return type;
      }
      // Use the latest known implementation.
      return family.current;
    };

    isCompatibleFamilyForHotReloading = (
      fiber: Fiber,
      element: ReactElement,
    ): boolean => {
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
    };

    let scheduleHotUpdate = (root: FiberRoot, families: Set<Family>): void => {
      flushPassiveEffects();
      batchedUpdates(() => {
        scheduleFibersWithFamiliesRecursively(root.current, families);
      });
    };

    let scheduleFibersWithFamiliesRecursively = (
      fiber: Fiber,
      families: Set<Family>,
    ) => {
      const {child, sibling, tag, type} = fiber;

      switch (tag) {
        case FunctionComponent:
        case SimpleMemoComponent: {
          if (familiesByType.has(type)) {
            fiber.memoizedProps = {...fiber.memoizedProps};
            scheduleWork(fiber, Sync);
            // TODO: remount Hooks like useEffect.
            // TODO: skip shallow or custom memo bailout.
          }
          break;
        }
        case ForwardRef:
          if (familiesByType.has(type) || familiesByType.has(type.render)) {
            fiber.memoizedProps = {...fiber.memoizedProps};
            scheduleWork(fiber, Sync);
            // TODO: remount Hooks like useEffect.
          }
          break;
        case MemoComponent:
          if (familiesByType.has(type) || familiesByType.has(type.type)) {
            fiber.memoizedProps = {...fiber.memoizedProps};
            scheduleWork(fiber, Sync);
            // TODO: skip shallow or custom memo bailout.
          }
          break;
        default:
        // TODO: handle other types.
      }
      // TODO: remount the whole component if necessary.

      if (child !== null) {
        scheduleFibersWithFamiliesRecursively(child, families);
      }
      if (sibling !== null) {
        scheduleFibersWithFamiliesRecursively(sibling, families);
      }
    };

    return {
      scheduleHotUpdate,
    };
  }
}
