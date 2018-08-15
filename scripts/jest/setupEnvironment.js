/* eslint-disable */

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV !== 'development' && NODE_ENV !== 'production') {
  throw new Error('NODE_ENV must either be set to development or production.');
}
global.__DEV__ = NODE_ENV === 'development';
global.__PROFILE__ = NODE_ENV === 'development';

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
}
