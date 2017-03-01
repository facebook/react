/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFrameScheduling
 * @flow
 */

'use strict';

// This a built-in polyfill for requestIdleCallback. It works by scheduling
// a requestAnimationFrame, store the time for the start of the frame, then
// schedule a postMessage which gets scheduled after paint. Within the
// postMessage handler do as much work as possible until time + frame rate.
// By separating the idle call into a separate event tick we ensure that
// layout, paint and other browser work is counted against the available time.
// The frame rate is dynamically adjusted.

import type { Deadline } from 'ReactFiberReconciler';

var invariant = require('fbjs/lib/invariant');

// TODO: There's no way to cancel these, because Fiber doesn't atm.
let rAF : (callback : (time : number) => void) => number;
let rIC : (callback : (deadline : Deadline) => void) => number;
if (typeof requestAnimationFrame !== 'function') {
  invariant(
    false,
    'React depends on requestAnimationFrame. Make sure that you load a ' +
    'polyfill in older browsers.'
  );
} else if (typeof requestIdleCallback !== 'function') {
  // Wrap requestAnimationFrame and polyfill requestIdleCallback.

  var scheduledRAFCallback = null;
  var scheduledRICCallback = null;

  var isIdleScheduled = false;
  var isAnimationFrameScheduled = false;

  var frameDeadline = 0;
  // We start out assuming that we run at 30fps but then the heuristic tracking
  // will adjust this value to a faster fps if we get more frequent animation
  // frames.
  var previousFrameTime = 33;
  var activeFrameTime = 33;

  var frameDeadlineObject = {
    timeRemaining: (
      typeof performance === 'object' &&
      typeof performance.now === 'function' ? function() {
        // We assume that if we have a performance timer that the rAF callback
        // gets a performance timer value. Not sure if this is always true.
        return frameDeadline - performance.now();
      } : function() {
        // As a fallback we use Date.now.
        return frameDeadline - Date.now();
      }
    ),
  };

  // We use the postMessage trick to defer idle work until after the repaint.
  var messageKey =
    '__reactIdleCallback$' + Math.random().toString(36).slice(2);
  var idleTick = function(event) {
    if (event.source !== window || event.data !== messageKey) {
      return;
    }
    isIdleScheduled = false;
    var callback = scheduledRICCallback;
    scheduledRICCallback = null;
    if (callback) {
      callback(frameDeadlineObject);
    }
  };
  // Assumes that we have addEventListener in this environment. Might need
  // something better for old IE.
  window.addEventListener('message', idleTick, false);

  var animationTick = function(rafTime) {
    isAnimationFrameScheduled = false;
    var nextFrameTime = rafTime - frameDeadline + activeFrameTime;
    if (nextFrameTime < activeFrameTime && previousFrameTime < activeFrameTime) {
      if (nextFrameTime < 8) {
        // Defensive coding. We don't support higher frame rates than 120hz.
        // If we get lower than that, it is probably a bug.
        nextFrameTime = 8;
      }
      // If one frame goes long, then the next one can be short to catch up.
      // If two frames are short in a row, then that's an indication that we
      // actually have a higher frame rate than what we're currently optimizing.
      // We adjust our heuristic dynamically accordingly. For example, if we're
      // running on 120hz display or 90hz VR display.
      // Take the max of the two in case one of them was an anomaly due to
      // missed frame deadlines.
      activeFrameTime = nextFrameTime < previousFrameTime ?
                        previousFrameTime : nextFrameTime;
    } else {
      previousFrameTime = nextFrameTime;
    }
    frameDeadline = rafTime + activeFrameTime;
    if (!isIdleScheduled) {
      isIdleScheduled = true;
      window.postMessage(messageKey, '*');
    }
    var callback = scheduledRAFCallback;
    scheduledRAFCallback = null;
    if (callback) {
      callback(rafTime);
    }
  };

  rAF = function(callback : (time : number) => void) : number {
    // This assumes that we only schedule one callback at a time because that's
    // how Fiber uses it.
    scheduledRAFCallback = callback;
    if (!isAnimationFrameScheduled) {
      // If rIC didn't already schedule one, we need to schedule a frame.
      isAnimationFrameScheduled = true;
      requestAnimationFrame(animationTick);
    }
    return 0;
  };

  rIC = function(callback : (deadline : Deadline) => void) : number {
    // This assumes that we only schedule one callback at a time because that's
    // how Fiber uses it.
    scheduledRICCallback = callback;
    if (!isAnimationFrameScheduled) {
      // If rAF didn't already schedule one, we need to schedule a frame.
      // TODO: If this rAF doesn't materialize because the browser throttles, we
      // might want to still have setTimeout trigger rIC as a backup to ensure
      // that we keep performing work.
      isAnimationFrameScheduled = true;
      requestAnimationFrame(animationTick);
    }
    return 0;
  };
} else {
  rAF = requestAnimationFrame;
  rIC = requestIdleCallback;
}

exports.rAF = rAF;
exports.rIC = rIC;
