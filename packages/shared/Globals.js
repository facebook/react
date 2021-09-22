/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const _w = global.window;
export const window = _w;

const windowDefined = typeof window !== 'undefined';

export const PointerEvent = windowDefined ? window.PointerEvent : undefined;

export const canUseDOM: boolean = !!(
  windowDefined &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
);

export const addEventListener = windowDefined
  ? window.addEventListener
  : undefined;
export const dispatchEvent = windowDefined ? window.dispatchEvent : undefined;
export const document = windowDefined ? window.document : undefined;
export const fetch = windowDefined ? window.fetch : undefined;
export const hasOwnProperty = windowDefined
  ? window.hasOwnProperty
  : global.hasOwnProperty;
export const navigator = windowDefined ? window.navigator : undefined;
export const performance = windowDefined ? window.performance : undefined;
export const removeEventListener = windowDefined
  ? window.removeEventListener
  : undefined;
export const setInterval = windowDefined ? window.setInterval : undefined;
export const setTimeout = windowDefined ? window.setTimeout : undefined;
export const scheduler = windowDefined ? window.scheduler : global.scheduler;
