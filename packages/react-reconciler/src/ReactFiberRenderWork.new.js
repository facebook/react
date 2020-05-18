/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactProviderType, ReactContext} from 'shared/ReactTypes';
import type {Fiber} from './ReactInternalTypes';
import type {Lanes} from './ReactFiberLane';
import type {RenderStateMachine} from './ReactFiberGeneratorComponent.new';

import {enableProfilerTimer} from 'shared/ReactFeatureFlags';

import {includesSomeLane} from './ReactFiberLane';
import {reconcileChildren} from './ReactFiberBeginWork.new';
import {cloneChildFibers} from './ReactChildFiber.new';
import {
  pushProvider,
  popProvider,
  propagateContextChange,
  calculateChangedBits,
} from './ReactFiberNewContext.new';
import {hasContextChanged as hasLegacyContextChanged} from './ReactFiberContext.new';
import checkPropTypes from 'shared/checkPropTypes';
import {stopProfilerTimerIfRunning} from './ReactProfilerTimer.new';

export function* renderContextProvider(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): RenderStateMachine {
  const providerType: ReactProviderType<any> = workInProgress.type;
  const context: ReactContext<any> = providerType._context;

  const newProps = workInProgress.pendingProps;
  const oldProps = workInProgress.memoizedProps;

  if (__DEV__) {
    const providerPropTypes = workInProgress.type.propTypes;

    if (providerPropTypes) {
      checkPropTypes(providerPropTypes, newProps, 'prop', 'Context.Provider');
    }
  }

  const newValue = newProps.value;
  pushProvider(workInProgress, newValue);

  try {
    if (oldProps !== null) {
      const oldValue = oldProps.value;
      const changedBits = calculateChangedBits(context, newValue, oldValue);
      if (changedBits === 0) {
        // No change. Bailout early if children are the same.
        if (
          oldProps.children === newProps.children &&
          !hasLegacyContextChanged()
        ) {
          return yield* bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderLanes,
          );
        }
      } else {
        propagateContextChange(
          workInProgress,
          context,
          changedBits,
          renderLanes,
        );
      }
    }

    const newChildren = newProps.children;
    reconcileChildren(current, workInProgress, newChildren, renderLanes);
    yield workInProgress.child;
  } finally {
    popProvider(workInProgress);
  }
}

function* bailoutOnAlreadyFinishedWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): RenderStateMachine {
  // Fork of function with the same name in ReactFiberBeginWork
  //
  // These lines aren't used by any of the components in this module
  // if (current !== null) {
  //   // Reuse previous dependencies
  //   workInProgress.dependencies_new = current.dependencies_new;
  // }
  //
  // markSkippedUpdateLanes(workInProgress.lanes);

  if (enableProfilerTimer) {
    // Don't update "base" render times for bailouts.
    stopProfilerTimerIfRunning(workInProgress);
  }

  // Check if the children have any pending work.
  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
    // The children don't have any work either. We can skip them.
    // TODO: Once we add back resuming, we should check if the children are
    // a work-in-progress set. If so, we need to transfer their effects.
  } else {
    // This fiber doesn't have work, but its subtree does. Clone the child
    // fibers and continue.
    cloneChildFibers(current, workInProgress);
    yield workInProgress.child;
  }
}
