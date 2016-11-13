'use strict';

// We want to globally mock this but jest doesn't let us do that by default
// for a file that already exists. So we have to explicitly mock it.
jest.mock('ReactDOM');
jest.mock('ReactDOMFeatureFlags', () => {
  const flags = require.requireActual('ReactDOMFeatureFlags');
  return Object.assign({}, flags, {
    useFiber: flags.useFiber || !!process.env.REACT_DOM_JEST_USE_FIBER,
  });
});

var env = jasmine.getEnv();

var callCount = 0;
var windowErrorCallCount = 0;
var oldWindowError = window.onerror;
var oldError = console.error;
var newError = function() {
  callCount++;
  oldError.apply(this, arguments);
};

var newWindowError = function() {
  windowErrorCallCount++;
  oldWindowError.apply(this, arguments);
};

console.error = newError;
window.onerror = newWindowError;

env.beforeEach(() => {
  callCount = 0;
  windowErrorCallCount = 0;
  jasmine.addMatchers({
    toBeReset() {
      return {
        compare(actual) {
          // TODO: Catch test cases that call spyOn() but don't inspect the mock
          // properly.
          if (actual !== newError && actual !== newWindowError
          && !jasmine.isSpy(actual)) {
            return {
              pass: false,
              message: 'Test did not tear down console.error mock properly.',
            };
          }
          return {pass: true};
        },
      };
    },
    toNotHaveBeenCalled() {
      return {
        compare(actual) {
          if (actual === newWindowError) {
            return {
              pass: windowErrorCallCount === 0,
              message:
                'Expected test not to trigger a window error. If the ' +
                'error is expected, mock it out using ' +
                'spyOn(window, \'onerror\'); and test that the error occurs.',
            };
          }
          return {
            pass: callCount === 0,
            message:
              'Expected test not to warn. If the warning is expected, mock ' +
              'it out using spyOn(console, \'error\'); and test that the ' +
              'warning occurs.',
          };
        },
      };
    },
  });
});
env.afterEach(() => {
  expect(console.error).toBeReset();
  expect(console.error).toNotHaveBeenCalled();
  expect(window.onerror).toNotHaveBeenCalled();
});
