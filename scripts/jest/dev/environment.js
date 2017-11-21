/* eslint-disable */
global.__DEV__ = true;

// For testing DOM Fiber.
global.requestAnimationFrame = function(callback) {
  setTimeout(callback);
};

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
