/* eslint-disable */
global.__DEV__ = false;
global.__suppressDevFailures = true;

// For testing DOM Fiber.
global.requestAnimationFrame = function(callback) {
  setTimeout(callback);
};

global.requestIdleCallback = function(callback) {
  setTimeout(() => {
    callback({
      timeRemaining() {
        return Infinity;
      },
    });
  });
};
