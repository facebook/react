/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type ZoneContext = any;

let currentContext: ZoneContext | null = null;

export function getCurrentContext(): ZoneContext | null {
  if (!__PROFILE__) {
    return null;
  } else {
    return currentContext;
  }
}

export function trackContext(context: ZoneContext, callback: Function): void {
  if (!__PROFILE__) {
    callback();
    return;
  }

  let prevContext;
  try {
    prevContext = restoreContext(context);
    callback();
  } finally {
    completeContext(prevContext);
  }
}

export function wrapForCurrentContext(callback: Function): Function {
  const wrappedContext = currentContext;
  return (...args) => {
    trackContext(wrappedContext, () => callback(...args));
  };
}

export function restoreContext(
  context: ZoneContext | null,
): ZoneContext | null {
  if (!__PROFILE__) {
    return;
  }
  const prevContext = currentContext;
  currentContext = context;
  return prevContext;
}

export function completeContext(context: ZoneContext | null): void {
  if (!__PROFILE__) {
    return;
  }
  currentContext = context;
}
