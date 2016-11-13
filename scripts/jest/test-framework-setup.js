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

var oldError = console.error;
var oldWindowOnError = window.onerror;

var callCount = 0;
var windowCallCount = 0;
var newError = function() {
  callCount++;
  oldError.apply(this, arguments);
};
var newWindowOnError = function() {
  windowCallCount++;
  oldWindowOnError.apply(this, arguments);
}

console.error = newError;
window.onerror = newWindowOnError;

env.beforeEach(() => {
  callCount = 0;
  windowCallCount = 0;
  jasmine.addMatchers({
    toBeReset() {
      return {
        compare(actual) {
          // TODO: Catch test cases that call spyOn() but don't inspect the mock
          // properly.
          if (actual !== newError && !jasmine.isSpy(actual)) {
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
          if (actual === newWindowOnError) {
            return {
              pass: windowCallCount === 0,
              message:
                'Expected test not to trigger a global window error. If the error is expected, mock ' +
                'it out using spyOn(window, \'onerror\'); and test that the ' +
                'error occurs.',
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
