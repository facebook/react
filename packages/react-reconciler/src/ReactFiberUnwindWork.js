/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';

import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostPortal,
  ContextProvider,
  SuspenseComponent,
  DehydratedSuspenseComponent,
  EventComponent,
  EventTarget,
} from 'shared/ReactWorkTags';
import {DidCapture, NoEffect, ShouldCapture} from 'shared/ReactSideEffectTags';
import {
  enableSuspenseServerRenderer,
  enableEventAPI,
} from 'shared/ReactFeatureFlags';

import {popHostContainer, popHostContext} from './ReactFiberHostContext';
import {popSuspenseContext} from './ReactFiberSuspenseContext';
import {
  isContextProvider as isLegacyContextProvider,
  popContext as popLegacyContext,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberContext';
import {popProvider} from './ReactFiberNewContext';

import invariant from 'shared/invariant';

function unwindWork(
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime,
) {
  switch (workInProgress.tag) {
    case ClassComponent: {
      const Component = workInProgress.type;
      if (isLegacyContextProvider(Component)) {
        popLegacyContext(workInProgress);
      }
      const effectTag = workInProgress.effectTag;
      if (effectTag & ShouldCapture) {
        workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
        return workInProgress;
      }
      return null;
    }
    case HostRoot: {
      popHostContainer(workInProgress);
      popTopLevelLegacyContextObject(workInProgress);
      const effectTag = workInProgress.effectTag;
      invariant(
        (effectTag & DidCapture) === NoEffect,
        'The root failed to unmount after an error. This is likely a bug in ' +
          'React. Please file an issue.',
      );
      workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
      return workInProgress;
    }
    case HostComponent: {
      // TODO: popHydrationState
      popHostContext(workInProgress);
      return null;
    }
    case SuspenseComponent: {
      popSuspenseContext(workInProgress);
      const effectTag = workInProgress.effectTag;
      if (effectTag & ShouldCapture) {
        workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
        // Captured a suspense effect. Re-render the boundary.
        return workInProgress;
      }
      return null;
    }
    case DehydratedSuspenseComponent: {
      if (enableSuspenseServerRenderer) {
        // TODO: popHydrationState
        popSuspenseContext(workInProgress);
        const effectTag = workInProgress.effectTag;
        if (effectTag & ShouldCapture) {
          workInProgress.effectTag = (effectTag & ~ShouldCapture) | DidCapture;
          // Captured a suspense effect. Re-render the boundary.
          return workInProgress;
        }
      }
      return null;
    }
    case HostPortal:
      popHostContainer(workInProgress);
      return null;
    case ContextProvider:
      popProvider(workInProgress);
      return null;
    case EventComponent:
    case EventTarget:
      if (enableEventAPI) {
        popHostContext(workInProgress);
      }
      return null;
    default:
      return null;
  }
}

function unwindInterruptedWork(interruptedWork: Fiber) {
  switch (interruptedWork.tag) {
    case ClassComponent: {
      const childContextTypes = interruptedWork.type.childContextTypes;
      if (childContextTypes !== null && childContextTypes !== undefined) {
        popLegacyContext(interruptedWork);
      }
      break;
    }
    case HostRoot: {
      popHostContainer(interruptedWork);
      popTopLevelLegacyContextObject(interruptedWork);
      break;
    }
    case HostComponent: {
      popHostContext(interruptedWork);
      break;
    }
    case HostPortal:
      popHostContainer(interruptedWork);
      break;
    case SuspenseComponent:
      popSuspenseContext(interruptedWork);
      break;
    case DehydratedSuspenseComponent:
      if (enableSuspenseServerRenderer) {
        // TODO: popHydrationState
        popSuspenseContext(interruptedWork);
      }
      break;
    case ContextProvider:
      popProvider(interruptedWork);
      break;
    case EventComponent:
    case EventTarget:
      if (enableEventAPI) {
        popHostContext(interruptedWork);
      }
      break;
    default:
      break;
  }
}

export {unwindWork, unwindInterruptedWork};
