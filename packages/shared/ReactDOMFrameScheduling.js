/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This is a built-in polyfill for requestIdleCallback. It works by scheduling
// a requestAnimationFrame, storing the time for the start of the frame, then
// scheduling a postMessage which gets scheduled after paint. Within the
// postMessage handler do as much work as possible until time + frame rate.
// By separating the idle call into a separate event tick we ensure that
// layout, paint and other browser work is counted against the available time.
// The frame rate is dynamically adjusted.

import type {IdleRequestCallback} from 'request-idle-callback-polyfill';

import {
  requestIdleCallback,
  cancelIdleCallback,
} from 'request-idle-callback-polyfill';
import ExecutionEnvironment from 'fbjs/lib/ExecutionEnvironment';
import warning from 'fbjs/lib/warning';

if (__DEV__) {
  if (
    ExecutionEnvironment.canUseDOM &&
    typeof requestAnimationFrame !== 'function'
  ) {
    warning(
      false,
      'React depends on requestAnimationFrame. Make sure that you load a ' +
        'polyfill in older browsers. https://fb.me/react-polyfills',
    );
  }
}

const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

let now;
if (hasNativePerformanceNow) {
  now = function() {
    return performance.now();
  };
} else {
  now = function() {
    return Date.now();
  };
}

let rIC: requestIdleCallback;
let cIC: cancelIdleCallback;

if (!ExecutionEnvironment.canUseDOM) {
  rIC = function(frameCallback: IdleRequestCallback): number {
    return setTimeout(() => {
      frameCallback({
        didTimeout: false,
        timeRemaining() {
          return Infinity;
        },
      });
    });
  };
  cIC = function(timeoutID: number) {
    clearTimeout(timeoutID);
  };
} else if (
  typeof requestIdleCallback !== 'function' ||
  typeof cancelIdleCallback !== 'function'
) {
  rIC = requestIdleCallback;
  cIC = cancelIdleCallback;
} else {
  rIC = window.requestIdleCallback;
  cIC = window.cancelIdleCallback;
}

export {now, rIC, cIC};
