/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import getComponentName from 'shared/getComponentName';
import {getStackAddendumByWorkInProgressFiber} from 'shared/ReactFiberComponentTreeHook';
import {AsyncUpdates} from './ReactTypeOfInternalContext';
import warning from 'fbjs/lib/warning';

type LIFECYCLE =
  | 'UNSAFE_componentWillMount'
  | 'UNSAFE_componentWillReceiveProps'
  | 'UNSAFE_componentWillUpdate';
type LifecycleToComponentsMap = {[lifecycle: LIFECYCLE]: Array<Fiber>};
type FiberToLifecycleMap = Map<Fiber, LifecycleToComponentsMap>;

const ReactDebugAsyncWarnings = {
  discardPendingWarnings(): void {},
  flushPendingAsyncWarnings(): void {},
  recordLifecycleWarnings(fiber: Fiber, instance: any): void {},
};

if (__DEV__) {
  const LIFECYCLE_SUGGESTIONS = {
    UNSAFE_componentWillMount: 'componentDidMount',
    UNSAFE_componentWillReceiveProps: 'static getDerivedStateFromProps',
    UNSAFE_componentWillUpdate: 'componentDidUpdate',
  };

  let pendingWarningsMap: FiberToLifecycleMap = new Map();

  // Tracks components we have already warned about.
  const didWarnSet = new Set();

  ReactDebugAsyncWarnings.discardPendingWarnings = () => {
    pendingWarningsMap = new Map();
  };

  ReactDebugAsyncWarnings.flushPendingAsyncWarnings = () => {
    ((pendingWarningsMap: any): FiberToLifecycleMap).forEach(
      (lifecycleWarningsMap, asyncRoot) => {
        const lifecyclesWarningMesages = [];

        Object.keys(lifecycleWarningsMap).forEach(lifecycle => {
          const lifecycleWarnings = lifecycleWarningsMap[lifecycle];
          if (lifecycleWarnings.length > 0) {
            const componentNames = new Set();
            lifecycleWarnings.forEach(fiber => {
              componentNames.add(getComponentName(fiber) || 'Component');
              didWarnSet.add(fiber.type);
            });

            const formatted = lifecycle.replace('UNSAFE_', '');
            const suggestion = LIFECYCLE_SUGGESTIONS[lifecycle];
            const sortedComponentNames = Array.from(componentNames)
              .sort()
              .join(', ');

            lifecyclesWarningMesages.push(
              `${formatted}: Please update the following components to use ` +
                `${suggestion} instead: ${sortedComponentNames}`,
            );
          }
        });

        if (lifecyclesWarningMesages.length > 0) {
          const asyncRootComponentStack = getStackAddendumByWorkInProgressFiber(
            asyncRoot,
          );

          warning(
            false,
            'Unsafe lifecycle methods were found within the following async tree:%s' +
              '\n\n%s' +
              '\n\nLearn more about this warning here:' +
              '\nhttps://fb.me/react-async-component-lifecycle-hooks',
            asyncRootComponentStack,
            lifecyclesWarningMesages.join('\n\n'),
          );
        }
      },
    );

    pendingWarningsMap = new Map();
  };

  const getAsyncRoot = (fiber: Fiber): Fiber => {
    let maybeAsyncRoot = null;

    while (fiber !== null) {
      if (fiber.internalContextTag & AsyncUpdates) {
        maybeAsyncRoot = fiber;
      }

      fiber = fiber.return;
    }

    return maybeAsyncRoot;
  };

  ReactDebugAsyncWarnings.recordLifecycleWarnings = (
    fiber: Fiber,
    instance: any,
  ) => {
    const asyncRoot = getAsyncRoot(fiber);

    // Dedup strategy: Warn once per component.
    // This is difficult to track any other way since component names
    // are often vague and are likely to collide between 3rd party libraries.
    // An expand property is probably okay to use here since it's DEV-only,
    // and will only be set in the event of serious warnings.
    if (didWarnSet.has(fiber.type)) {
      return;
    }

    let warningsForRoot;
    if (!pendingWarningsMap.has(asyncRoot)) {
      warningsForRoot = {
        UNSAFE_componentWillMount: [],
        UNSAFE_componentWillReceiveProps: [],
        UNSAFE_componentWillUpdate: [],
      };

      pendingWarningsMap.set(asyncRoot, warningsForRoot);
    } else {
      warningsForRoot = pendingWarningsMap.get(asyncRoot);
    }

    const unsafeLifecycles = [];
    if (
      typeof instance.componentWillMount === 'function' ||
      typeof instance.UNSAFE_componentWillMount === 'function'
    ) {
      unsafeLifecycles.push('UNSAFE_componentWillMount');
    }
    if (
      typeof instance.componentWillReceiveProps === 'function' ||
      typeof instance.UNSAFE_componentWillReceiveProps === 'function'
    ) {
      unsafeLifecycles.push('UNSAFE_componentWillReceiveProps');
    }
    if (
      typeof instance.componentWillUpdate === 'function' ||
      typeof instance.UNSAFE_componentWillUpdate === 'function'
    ) {
      unsafeLifecycles.push('UNSAFE_componentWillUpdate');
    }

    if (unsafeLifecycles.length > 0) {
      unsafeLifecycles.forEach(lifecycle => {
        ((warningsForRoot: any): LifecycleToComponentsMap)[lifecycle].push(
          fiber,
        );
      });
    }
  };
}

export default ReactDebugAsyncWarnings;
