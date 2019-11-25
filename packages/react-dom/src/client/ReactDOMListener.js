/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'shared/ReactTypes';
import type {ReactDOMListener} from 'shared/ReactDOMTypes';

import {hasBadMapPolyfill} from 'shared/hasBadMapPolyfill';
import {customEventPriorities} from '../events/DOMEventListenerSystem';

type ReactDOMListenerOptions = {
  capture?: boolean,
  passive?: boolean,
};

function createReactListener(
  type: string,
  callback: mixed => void,
  isRootListener: boolean,
  options?: ReactDOMListenerOptions,
): ReactDOMListener {
  let capture = false;
  let passive = true;

  if (options) {
    const optionsCapture = options.capture;
    if (optionsCapture != null) {
      capture = optionsCapture;
    }
    const optionsPassive = options.passive;
    if (optionsPassive != null) {
      passive = optionsPassive;
    }
  }

  const reactListener = {
    callback,
    capture,
    type,
    passive,
    root: isRootListener,
  };
  if (__DEV__ && !hasBadMapPolyfill) {
    Object.freeze(reactListener);
  }
  return reactListener;
}

export function createListener(
  type: string,
  callback: mixed => void,
  options?: ReactDOMListenerOptions,
): ReactDOMListener {
  const isRootListener = false;
  return createReactListener(type, callback, isRootListener, options);
}

export function createRootListener(
  type: string,
  callback: mixed => void,
  options?: ReactDOMListenerOptions,
): ReactDOMListener {
  const isRootListener = true;
  return createReactListener(type, callback, isRootListener, options);
}

export function setEventPriority(type: string, priority: EventPriority): void {
  customEventPriorities.set(type, priority);
}
