/* eslint-disable */
global.__DEV__ = true;

// For testing DOM Fiber, we synchronously invoke all the scheduling.
global.requestAnimationFrame = function(callback) {
  callback();
};

global.requestIdleCallback = function(callback) {
  callback({ timeRemaining() { return Infinity; } });
};
