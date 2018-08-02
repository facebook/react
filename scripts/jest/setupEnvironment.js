/* eslint-disable */

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV !== 'development' && NODE_ENV !== 'production') {
  throw new Error('NODE_ENV must either be set to development or production.');
}
global.__DEV__ = NODE_ENV === 'development';
global.__PROFILE__ = NODE_ENV === 'development';

// By default React console.error()'s any errors, caught or uncaught.
// However it is annoying to assert that a warning fired each time
// we assert that there is an exception in our tests. This lets us
// opt out of extra console error reporting for most tests except
// for the few that specifically test the logging by shadowing this
// property. In real apps, it would usually not be defined at all.
Error.prototype.suppressReactErrorLogging = true;

if (typeof window !== 'undefined') {
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

  // Same as we did with Error.prototype above.
  DOMException.prototype.suppressReactErrorLogging = true;

  // Also prevent JSDOM from logging intentionally thrown errors.
  // TODO: it might make sense to do it the other way around.
  // https://github.com/facebook/react/issues/11098#issuecomment-355032539
  window.addEventListener('error', event => {
    if (event.error != null && event.error.suppressReactErrorLogging) {
      event.preventDefault();
    }
  });
}
