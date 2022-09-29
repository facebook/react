/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// `getEventPriority` relies on `window.event` to be set, however this is not set for
// several APIs (e.g. MutationObserver, EventTarget.dispatchEvent)

function patchFunction(fn: Function, type: string): Function {
  return (...args) => {
    const previousEvent = window.event;
    window.event = {
      type,
    };
    const val = fn(...args);
    window.event = previousEvent;
    return val;
  };
}

function patchObserver(name: string): void {
  const OriginalObserver = window[name];
  if (!OriginalObserver) {
    return;
  }
  const nextObserver = function(callback, observer) {
    const nextCallback = patchFunction(callback, name);
    return new OriginalObserver(nextCallback, observer);
  };
  nextObserver.prototype = OriginalObserver.prototype;
  nextObserver.prototype.constructor = nextObserver;
  window[name] = nextObserver;
}

function patchFunctionWithCallback(name: string) {
  const fn = window[name];
  if (!fn) {
    return;
  }
  const nextFn = callback => {
    const nextCallback = patchFunction(callback, name);
    return fn(nextCallback);
  };
  window[name] = nextFn;
}

function monkeyPatchEvents() {
  patchObserver('MutationObserver');
  patchObserver('IntersectionObserver');
  patchObserver('ResizeObserver');
  patchFunctionWithCallback('requestAnimationFrame');
}

export default monkeyPatchEvents;
