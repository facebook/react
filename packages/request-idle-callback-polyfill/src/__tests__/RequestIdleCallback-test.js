/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let highResolutionTimer;
let requestIdleCallback;
let cancelIdleCallback;
let animationFrameCallbacks;

// Overwritten global methods
let previousPostMessage;
let previousRAF;

function performanceNow() {
  return highResolutionTimer;
}

/**
 * A synchronous version of jsdom's postMessage. Meant
 * to work with mockRunNextFrame.
 */
function postMessage(message, targetOrign) {
  const event = new MessageEvent('message', {data: message});
  event.initEvent('message', false, false);
  // MessageEvent.source is defined as read-only and null in jsdom.
  // Override the getter so the event.source check doesn't cause early
  // returns in idleTick.
  Object.defineProperty(event, 'source', {
    value: window,
  });
  window.dispatchEvent(event);
}

function requestAnimationFrame(callback) {
  animationFrameCallbacks.push(callback);
}

function mockRunNextFrame() {
  const callbacksToRun = animationFrameCallbacks.slice();
  const animationFrameStart = highResolutionTimer++;
  animationFrameCallbacks.length = 0;
  callbacksToRun.forEach(cb => cb(animationFrameStart));
}

function mockLongRunningCode() {
  highResolutionTimer += 100;
}

describe('RequestIdleCallback', () => {
  beforeAll(() => {
    previousRAF = window.requestAnimationFrame;
    previousPostMessage = window.postMessage;
    window.postMessage = postMessage;
    window.performance = {now: performanceNow};
    window.requestAnimationFrame = requestAnimationFrame;
  });

  afterAll(() => {
    window.requestAnimationFrame = previousRAF;
    window.postMessage = previousPostMessage;
    previousPostMessage = null;
    previousRAF = null;
    delete window.performance;
  });

  beforeEach(() => {
    animationFrameCallbacks = [];
    highResolutionTimer = 0xf000;
    jest.resetModules();
    requestIdleCallback = require('request-idle-callback-polyfill')
      .requestIdleCallback;
    cancelIdleCallback = require('request-idle-callback-polyfill')
      .cancelIdleCallback;
  });

  describe('requestIdleCallback', () => {
    it('returns a number', () => {
      const callback = jest.fn();
      expect(typeof requestIdleCallback(callback)).toBe('number');
    });
    it('executes callbacks asynchronously', () => {
      const callback = jest.fn();
      requestIdleCallback(callback);
      expect(callback).not.toBeCalled();
      mockRunNextFrame();
      expect(callback).toBeCalled();
    });
    it('cancels callbacks', () => {
      const callback = jest.fn();
      const handle = requestIdleCallback(callback);
      cancelIdleCallback(handle);
      mockRunNextFrame();
      expect(callback).not.toBeCalled();
    });

    it('passes a deadline to the callback', () => {
      const ops = [];
      const callback = jest.fn(deadline => {
        ops.push(deadline.didTimeout);
        ops.push(deadline.timeRemaining());
        mockLongRunningCode();
        ops.push(deadline.timeRemaining());
      });
      requestIdleCallback(callback);
      mockRunNextFrame();
      expect(callback).toBeCalled();
      expect(ops[0]).toBe(false);
      expect(ops[1]).toBeGreaterThan(0);
      expect(ops[2]).toBe(0);
    });

    it('stops executing callbacks if the deadline expires', () => {
      const ops = [];
      requestIdleCallback(() => ops.push('first'));
      requestIdleCallback(() => {
        ops.push('second');
        mockLongRunningCode();
      });
      requestIdleCallback(() => ops.push('third'));
      expect(ops).toEqual([]);
      mockRunNextFrame();
      expect(ops).toEqual(['first', 'second']);
      mockRunNextFrame();
      expect(ops).toEqual(['first', 'second', 'third']);
    });

    it('executes callbacks that timeout', () => {
      const ops = [];
      const callback = jest.fn(deadline => {
        ops.push(deadline.didTimeout);
        ops.push(deadline.timeRemaining());
      });
      requestIdleCallback(callback, {timeout: 100});
      jest.runAllTimers();
      expect(ops).toEqual([true, 0]);
    });
  });
});
