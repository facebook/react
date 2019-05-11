/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';

import {
  batchedUpdates,
  scheduleWork,
  flushPassiveEffects,
} from './ReactFiberScheduler';
import {Sync} from './ReactFiberExpirationTime';

type Family = {|
  current: any,
|};

type HotReloadingInterface = {|
  scheduleHotUpdate: (root: FiberRoot, families: Set<Family>) => void,
|};

// By default, it is an identity. We override it on injection.
// TODO: this needs to be used by reconciliation too.
export let resolveTypeForHotReloading = (type: any): any => type;

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
      const {child, sibling, type} = fiber;
      // TODO: handle other types.
      if (typeof type === 'function') {
        const family = familiesByType.get(type);
        if (family !== undefined) {
          if (families.has(family)) {
            // TODO: skip shallow or custom memo bailouts too.
            fiber.memoizedProps = {...fiber.memoizedProps};
            scheduleWork(fiber, Sync);
            // TODO: remount Hooks like useEffect.
          }
          // TODO: remount the whole component if necessary.
        }
      }
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
