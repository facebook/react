/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
const maxSigned31BitInt = 1073741823;

export function mockRestore() {
  delete global._schedMock;
}

let callback = null;
let currentTime = -1;

function flushCallback(didTimeout, ms) {
  if (callback !== null) {
    let cb = callback;
    callback = null;
    try {
      currentTime = ms;
      cb(didTimeout);
    } finally {
      currentTime = -1;
    }
  }
}

function requestHostCallback(cb, ms) {
  if (currentTime !== -1) {
    // Protect against re-entrancy.
    setTimeout(requestHostCallback, 0, cb, ms);
  } else {
    callback = cb;
    setTimeout(flushCallback, ms, true, ms);
    setTimeout(flushCallback, maxSigned31BitInt, false, maxSigned31BitInt);
  }
}

function cancelHostCallback() {
  callback = null;
}

function shouldYieldToHost() {
  return false;
}

function getCurrentTime() {
  return currentTime === -1 ? 0 : currentTime;
}

global._schedMock = [
  requestHostCallback,
  cancelHostCallback,
  shouldYieldToHost,
  getCurrentTime,
];
