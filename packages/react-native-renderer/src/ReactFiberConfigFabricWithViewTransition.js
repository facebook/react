/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TransitionTypes} from 'react/src/ReactTransitionType';
import type {
  Instance,
  Props,
  Container,
  SuspendedState,
  GestureTimeline,
} from './ReactFiberConfigFabric';

import {enableViewTransitionForPersistenceMode} from 'shared/ReactFeatureFlags';

const {
  measureInstance: fabricMeasureInstance,
  applyViewTransitionName: fabricApplyViewTransitionName,
  startViewTransition: fabricStartViewTransition,
  restoreViewTransitionName: fabricRestoreViewTransitionName,
  cancelViewTransitionName: fabricCancelViewTransitionName,
} = nativeFabricUIManager;

function shim(...args: any): empty {
  throw new Error(
    'The current renderer does not support view transitions. ' +
      'This error is likely caused by a bug in React. ' +
      'Please file an issue.',
  );
}

export type InstanceMeasurement = {
  rect: {x: number, y: number, width: number, height: number},
  abs: boolean,
  clip: boolean,
  view: boolean,
};

export type RunningViewTransition = {
  skipTransition(): void,
  finished: Promise<void>,
  ready: Promise<void>,
  ...
};

interface ViewTransitionPseudoElementType extends mixin$Animatable {
  _scope: HTMLElement;
  _selector: string;
  getComputedStyle(): CSSStyleDeclaration;
}

function ViewTransitionPseudoElement(
  this: ViewTransitionPseudoElementType,
  pseudo: string,
  name: string,
) {
  // TODO: Get the owner document from the root container.
  this._pseudo = pseudo;
  this._name = name;
}

export type ViewTransitionInstance = null | {
  name: string,
  old: mixin$Animatable,
  new: mixin$Animatable,
  ...
};

export function restoreViewTransitionName(
  instance: Instance,
  props: Props,
): void {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  fabricRestoreViewTransitionName(instance.node);
}

// Cancel the old and new snapshots of viewTransitionName
export function cancelViewTransitionName(
  instance: Instance,
  oldName: string,
  props: Props,
): void {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  fabricCancelViewTransitionName(instance.node, oldName);
}

export function cancelRootViewTransitionName(rootContainer: Container): void {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  if (__DEV__) {
    console.warn('cancelRootViewTransitionName is not implemented');
  }
}

export function restoreRootViewTransitionName(rootContainer: Container): void {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  if (__DEV__) {
    console.warn('restoreRootViewTransitionName is not implemented');
  }
}

export function cloneRootViewTransitionContainer(
  rootContainer: Container,
): Instance {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  if (__DEV__) {
    console.warn('cloneRootViewTransitionContainer is not implemented');
  }
  // $FlowFixMe[incompatible-return] Return empty stub
  return null;
}

export function removeRootViewTransitionClone(
  rootContainer: Container,
  clone: Instance,
): void {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  if (__DEV__) {
    console.warn('removeRootViewTransitionClone is not implemented');
  }
}

export function measureInstance(instance: Instance): InstanceMeasurement {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  const measurement = fabricMeasureInstance(instance.node);
  return {
    rect: {
      x: measurement.x,
      y: measurement.y,
      width: measurement.width,
      height: measurement.height,
    },
    abs: false,
    clip: false,
    // TODO: properly calculate whether instance is in viewport
    view: true,
  };
}

export function measureClonedInstance(instance: Instance): InstanceMeasurement {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  if (__DEV__) {
    console.warn('measureClonedInstance is not implemented');
  }
  return {
    rect: {x: 0, y: 0, width: 0, height: 0},
    abs: false,
    clip: false,
    view: true,
  };
}

export function wasInstanceInViewport(
  measurement: InstanceMeasurement,
): boolean {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  return measurement.view;
}

export function hasInstanceChanged(
  oldMeasurement: InstanceMeasurement,
  newMeasurement: InstanceMeasurement,
): boolean {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  if (__DEV__) {
    console.warn('hasInstanceChanged is not implemented');
  }
  return false;
}

export function hasInstanceAffectedParent(
  oldMeasurement: InstanceMeasurement,
  newMeasurement: InstanceMeasurement,
): boolean {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  if (__DEV__) {
    console.warn('hasInstanceAffectedParent is not implemented');
  }
  return false;
}

export function startGestureTransition(
  suspendedState: null | SuspendedState,
  rootContainer: Container,
  timeline: GestureTimeline,
  rangeStart: number,
  rangeEnd: number,
  transitionTypes: null | TransitionTypes,
  mutationCallback: () => void,
  animateCallback: () => void,
  errorCallback: (error: mixed) => void,
  finishedAnimation: () => void,
): RunningViewTransition {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  if (__DEV__) {
    console.warn('startGestureTransition is not implemented');
  }
  return null;
}

export function stopViewTransition(transition: RunningViewTransition): void {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  if (__DEV__) {
    console.warn('stopViewTransition is not implemented');
  }
}

export function addViewTransitionFinishedListener(
  transition: RunningViewTransition,
  callback: () => void,
): void {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  transition.finished.finally(callback);
}

export function createViewTransitionInstance(
  name: string,
): ViewTransitionInstance {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  return {
    name,
    old: new (ViewTransitionPseudoElement: any)('old', name),
    new: new (ViewTransitionPseudoElement: any)('new', name),
  };
}

export function applyViewTransitionName(
  instance: Instance,
  name: string,
  className: ?string,
): void {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  // add view-transition-name to things that might animate for browser
  fabricApplyViewTransitionName(instance.node, name, className);
}

export function startViewTransition(
  suspendedState: null | SuspendedState,
  rootContainer: Container,
  transitionTypes: null | TransitionTypes,
  mutationCallback: () => void,
  layoutCallback: () => void,
  afterMutationCallback: () => void,
  spawnedWorkCallback: () => void,
  passiveCallback: () => mixed,
  errorCallback: (error: mixed) => void,
  blockedCallback: (name: string) => void,
  finishedAnimation: () => void,
): null | RunningViewTransition {
  if (!enableViewTransitionForPersistenceMode) {
    return;
  }
  const transition = fabricStartViewTransition(
    // mutation
    () => {
      mutationCallback(); // completeRoot should run here
      layoutCallback();
      afterMutationCallback();
    },
  );

  if (transition == null) {
    if (__DEV__) {
      console.warn(
        "startViewTransition didn't kick off transition in Fabric, the ViewTransition ReactNativeFeatureFlag might not be enabled.",
      );
    }
    // Flush remaining work synchronously.
    mutationCallback();
    layoutCallback();
    // Skip afterMutationCallback(). We don't need it since we're not animating.
    spawnedWorkCallback();
    // Skip passiveCallback(). Spawned work will schedule a task.
    return null;
  }

  transition.ready.then(() => {
    spawnedWorkCallback();
  });

  transition.finished.finally(() => {
    passiveCallback();
  });

  return transition;
}
