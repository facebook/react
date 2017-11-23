/* eslint-disable */

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV !== 'development' && NODE_ENV !== 'production') {
  throw new Error('NODE_ENV must either be set to development or production.');
}
global.__DEV__ = NODE_ENV === 'development';

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

// By default React console.error()'s any errors, caught or uncaught.
// However it is annoying to assert that a warning fired each time
// we assert that there is an exception in our tests. This lets us
// opt out of extra console error reporting for most tests except
// for the few that specifically test the logging by shadowing this
// property. In real apps, it would usually not be defined at all.
Error.prototype.suppressReactErrorLogging = true;
DOMException.prototype.suppressReactErrorLogging = true;
