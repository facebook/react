/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, FiberRoot} from './ReactInternalTypes';

import {enableTracingHooks} from 'shared/ReactFeatureFlags';
import getComponentNameFromFiber from './getComponentNameFromFiber';

export function markCommitStarted(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onCommitStarted === 'function'
    ) {
      root.tracingHooks.onCommitStarted();
    }
  }
}

export function markCommitStopped(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onCommitStopped === 'function'
    ) {
      root.tracingHooks.onCommitStopped();
    }
  }
}

export function markComponentRenderStarted(
  root: ?FiberRoot,
  workInProgress: Fiber,
): void {
  if (enableTracingHooks) {
    const onComponentRenderStarted =
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentRenderStarted === 'function'
        ? root.tracingHooks.onComponentRenderStarted
        : null;
    if (onComponentRenderStarted != null) {
      const componentName = getComponentNameFromFiber(workInProgress);
      onComponentRenderStarted(componentName);
    }
  }
}

export function markComponentRenderStopped(root: ?FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentRenderStopped === 'function'
    ) {
      root.tracingHooks.onComponentRenderStopped();
    }
  }
}

export function markComponentPassiveEffectMountStarted(
  root: ?FiberRoot,
  workInProgress: Fiber,
): void {
  if (enableTracingHooks) {
    const onComponentPassiveEffectMountStarted =
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentPassiveEffectMountStarted ===
        'function'
        ? root.tracingHooks.onComponentPassiveEffectMountStarted
        : null;
    if (onComponentPassiveEffectMountStarted != null) {
      const componentName = getComponentNameFromFiber(workInProgress);
      onComponentPassiveEffectMountStarted(componentName);
    }
  }
}

export function markComponentPassiveEffectMountStopped(root: ?FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentPassiveEffectMountStopped ===
        'function'
    ) {
      root.tracingHooks.onComponentPassiveEffectMountStopped();
    }
  }
}

export function markComponentPassiveEffectUnmountStarted(
  root: ?FiberRoot,
  workInProgress: Fiber,
): void {
  if (enableTracingHooks) {
    const onComponentPassiveEffectUnmountStarted =
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentPassiveEffectUnmountStarted ===
        'function'
        ? root.tracingHooks.onComponentPassiveEffectUnmountStarted
        : null;
    if (onComponentPassiveEffectUnmountStarted) {
      const componentName = getComponentNameFromFiber(workInProgress);
      onComponentPassiveEffectUnmountStarted(componentName);
    }
  }
}

export function markComponentPassiveEffectUnmountStopped(
  root: ?FiberRoot,
): void {
  if (enableTracingHooks) {
    if (
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentPassiveEffectUnmountStopped ===
        'function'
    ) {
      root.tracingHooks.onComponentPassiveEffectUnmountStopped();
    }
  }
}

export function markComponentLayoutEffectMountStarted(
  root: ?FiberRoot,
  workInProgress: Fiber,
): void {
  if (enableTracingHooks) {
    const onComponentLayoutEffectMountStarted =
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentLayoutEffectMountStarted ===
        'function'
        ? root.tracingHooks.onComponentLayoutEffectMountStarted
        : null;
    if (onComponentLayoutEffectMountStarted) {
      const componentName = getComponentNameFromFiber(workInProgress);
      onComponentLayoutEffectMountStarted(componentName);
    }
  }
}

export function markComponentLayoutEffectMountStopped(root: ?FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentLayoutEffectMountStopped ===
        'function'
    ) {
      root.tracingHooks.onComponentLayoutEffectMountStopped();
    }
  }
}

export function markComponentLayoutEffectUnmountStarted(
  root: ?FiberRoot,
  workInProgress: Fiber,
): void {
  if (enableTracingHooks) {
    const onComponentLayoutEffectUnmountStarted =
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentLayoutEffectUnmountStarted ===
        'function'
        ? root.tracingHooks.onComponentLayoutEffectUnmountStarted
        : null;
    if (onComponentLayoutEffectUnmountStarted) {
      const componentName = getComponentNameFromFiber(workInProgress);
      onComponentLayoutEffectUnmountStarted(componentName);
    }
  }
}

export function markComponentLayoutEffectUnmountStopped(
  root: ?FiberRoot,
): void {
  if (enableTracingHooks) {
    if (
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentLayoutEffectUnmountStopped ===
        'function'
    ) {
      root.tracingHooks.onComponentLayoutEffectUnmountStopped();
    }
  }
}

export function markComponentErrored(
  root: FiberRoot,
  thrownValue: mixed,
): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentErrored === 'function'
    ) {
      root.tracingHooks.onComponentErrored(thrownValue);
    }
  }
}

export function markComponentSuspended(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onComponentSuspended === 'function'
    ) {
      root.tracingHooks.onComponentSuspended();
    }
  }
}

export function markLayoutEffectsStarted(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onLayoutEffectsStarted === 'function'
    ) {
      root.tracingHooks.onLayoutEffectsStarted();
    }
  }
}

export function markLayoutEffectsStopped(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onLayoutEffectsStopped === 'function'
    ) {
      root.tracingHooks.onLayoutEffectsStopped();
    }
  }
}

export function markPassiveEffectsStarted(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onPassiveEffectsStarted === 'function'
    ) {
      root.tracingHooks.onPassiveEffectsStarted();
    }
  }
}

export function markPassiveEffectsStopped(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onPassiveEffectsStopped === 'function'
    ) {
      root.tracingHooks.onPassiveEffectsStopped();
    }
  }
}

export function markRenderStarted(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onRenderStarted === 'function'
    ) {
      root.tracingHooks.onRenderStarted();
    }
  }
}

export function markRenderYielded(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onRenderYielded === 'function'
    ) {
      root.tracingHooks.onRenderYielded();
    }
  }
}

export function markRenderStopped(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onRenderStopped === 'function'
    ) {
      root.tracingHooks.onRenderStopped();
    }
  }
}

export function markRenderScheduled(root: FiberRoot): void {
  if (enableTracingHooks) {
    if (
      root.tracingHooks != null &&
      typeof root.tracingHooks.onRenderScheduled === 'function'
    ) {
      root.tracingHooks.onRenderScheduled();
    }
  }
}

export function markForceUpdateScheduled(
  root: ?FiberRoot,
  workInProgress: Fiber,
): void {
  if (enableTracingHooks) {
    const onForceUpdateScheduled =
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onForceUpdateScheduled === 'function'
        ? root.tracingHooks.onForceUpdateScheduled
        : null;
    if (onForceUpdateScheduled) {
      const componentName = getComponentNameFromFiber(workInProgress);
      onForceUpdateScheduled(componentName);
    }
  }
}

export function markStateUpdateScheduled(
  root: ?FiberRoot,
  workInProgress: Fiber,
): void {
  if (enableTracingHooks) {
    const onStateUpdateScheduled =
      root &&
      root.tracingHooks != null &&
      typeof root.tracingHooks.onStateUpdateScheduled === 'function'
        ? root.tracingHooks.onStateUpdateScheduled
        : null;
    if (onStateUpdateScheduled) {
      const componentName = getComponentNameFromFiber(workInProgress);
      onStateUpdateScheduled(componentName);
    }
  }
}
