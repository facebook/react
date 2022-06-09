/* eslint-disable */

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV !== 'development' && NODE_ENV !== 'production') {
  throw new Error('NODE_ENV must either be set to development or production.');
}
global.__DEV__ = NODE_ENV === 'development';
global.__EXTENSION__ = false;
global.__TEST__ = NODE_ENV === 'test';
global.__PROFILE__ = NODE_ENV === 'development';
global.__UMD__ = false;

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to running tests in experimental mode. If the release channel is
// set via an environment variable, then check if it's "experimental".
global.__EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

global.__VARIANT__ = !!process.env.VARIANT;

if (typeof window !== 'undefined') {
  global.requestIdleCallback = function(callback) {
    return setTimeout(() => {
      callback({
        timeRemaining() {
          return Infinity;
        },
      });
    });
  };

  global.cancelIdleCallback = function(callbackID) {
    clearTimeout(callbackID);
  };

  // We need to mock rAF because Jest 26 does not flush rAF.
  // Once we upgrade to Jest 27+, rAF is flushed every 16ms.
  global.requestAnimationFrameQueue = null;
  global.requestAnimationFrame = function(callback) {
    if (global.requestAnimationFrameQueue == null) {
      global.requestAnimationFrameQueue = [];
    }
    global.requestAnimationFrameQueue.push(callback);
    return global.requestAnimationFrameQueue.length - 1;
  };

  global.cancelAnimationFrame = function(id) {
    if (global.requestAnimationFrameQueue != null) {
      global.requestAnimationFrameQueue.splice(id, 1);
    }
  };

  global.flushRequestAnimationFrameQueue = function() {
    if (global.requestAnimationFrameQueue != null) {
      global.requestAnimationFrameQueue.forEach(callback => callback());
      global.requestAnimationFrameQueue = null;
    }
  };
}
