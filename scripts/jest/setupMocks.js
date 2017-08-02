'use strict';

// We want to globally mock this but jest doesn't let us do that by default
// for a file that already exists. So we have to explicitly mock it.
jest.mock('ReactDOMFeatureFlags', () => {
  const flags = require.requireActual('ReactDOMFeatureFlags');
  return Object.assign({}, flags, {
    useFiber: !!process.env.REACT_JEST_USE_FIBER,
  });
});
jest.mock('ReactFeatureFlags', () => {
  const flags = require.requireActual('ReactFeatureFlags');
  return Object.assign({}, flags, {
    disableNewFiberFeatures: true,
  });
});
jest.mock('ReactNativeFeatureFlags', () => {
  const flags = require.requireActual('ReactNativeFeatureFlags');
  return Object.assign({}, flags, {
    useFiber: !!process.env.REACT_JEST_USE_FIBER,
  });
});

// Error logging varies between Fiber and Stack;
// Rather than fork dozens of tests, mock the error-logging file by default.
jest.mock('ReactFiberErrorLogger');
