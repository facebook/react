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
  currentType: any,
  currentSignature: null | string,
|};

type HotUpdate = {|
  root: FiberRoot,
  updatedFamilies: Set<Family>,
  staleFamilies: Set<Family>,
|};

type HotReloadingInterface = {|
  scheduleHotUpdate: HotUpdate => void,
|};

// Avoid any overhead even in DEV when hot reloading is off:
export let resolveTypeForHotReloading = (type: any): any => type;
export let isCompatibleFamilyForHotReloading = (
  fiber: Fiber,
  element: ReactElement,
) => false;
export let shouldSkipBailoutsForHotReloading = (fiber: Fiber | null): boolean =>
  false;

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
      return family.currentType;
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

    let invalidatedFibers = null;
    let scheduleHotUpdate = ({
      root,
      updatedFamilies,
      staleFamilies,
    }: HotUpdate): void => {
      flushPassiveEffects();
      invalidatedFibers = new Set();
      try {
        batchedUpdates(() => {
          scheduleFibersWithFamiliesRecursively(
            root.current,
            updatedFamilies,
            staleFamilies,
          );
        });
      } finally {
        invalidatedFibers = null;
      }
    };

    shouldSkipBailoutsForHotReloading = (fiber: Fiber | null): boolean => {
      if (fiber === null) {
        return false;
      }
      if (invalidatedFibers === null) {
        // Not hot reloading now.
        return false;
      }
      return invalidatedFibers.has(fiber);
    };

    let scheduleFibersWithFamiliesRecursively = (
      fiber: Fiber,
      updatedFamilies: Set<Family>,
      staleFamilies: Set<Family>,
    ) => {
      const {child, sibling, tag, type} = fiber;
      const candidateTypes = [];
      switch (tag) {
        case FunctionComponent:
        case SimpleMemoComponent: {
          candidateTypes.push(type);
          // TODO: remount Hooks like useEffect.
          break;
        }
        case ForwardRef: {
          candidateTypes.push(type);
          candidateTypes.push(type.render);
          // TODO: remount Hooks like useEffect.
          break;
        }
        case MemoComponent: {
          candidateTypes.push(type);
          candidateTypes.push(type.type);
          break;
        }
        default:
        // TODO: handle other types.
      }

      if (invalidatedFibers === null) {
        throw new Error(
          'Expected invalidatedFibers to be set during hot reload.',
        );
      }

      for (let i = 0; i < candidateTypes.length; i++) {
        const candidateType = candidateTypes[i];
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
              invalidatedFibers.add(parent);
              if (parent.alternate !== null) {
                invalidatedFibers.add(parent.alternate);
              }
              scheduleWork(parent, Sync);
            }
          } else if (updatedFamilies.has(family)) {
            // Force a re-render.
            invalidatedFibers.add(fiber);
            if (fiber.alternate !== null) {
              invalidatedFibers.add(fiber.alternate);
            }
            // Schedule itself.
            scheduleWork(fiber, Sync);
            // TODO: remount Hooks like useEffect.
          }
          break;
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
    };

    return {
      scheduleHotUpdate,
    };
  }
}
