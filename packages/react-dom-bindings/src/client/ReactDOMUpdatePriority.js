/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';

import {getEventPriority} from '../events/ReactDOMEventListener';
import {
  NoEventPriority,
  DefaultEventPriority,
} from 'react-reconciler/src/ReactEventPriorities';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const ReactDOMCurrentUpdatePriority =
  ReactDOMSharedInternals.ReactDOMCurrentUpdatePriority;

export function setCurrentUpdatePriority(newPriority: EventPriority): void {
  ReactDOMCurrentUpdatePriority.current = newPriority;
}

export function getCurrentUpdatePriority(): EventPriority {
  return ReactDOMCurrentUpdatePriority.current;
}

export function resolveUpdatePriority(): EventPriority {
  const updatePriority = ReactDOMCurrentUpdatePriority.current;
  if (updatePriority !== NoEventPriority) {
    return updatePriority;
  }
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}

export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  const previousPriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(priority);
    return fn();
  } finally {
    setCurrentUpdatePriority(previousPriority);
  }
}
