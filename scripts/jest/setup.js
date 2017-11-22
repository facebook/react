'use strict';

jest.mock('shared/ReactFeatureFlags', () => {
  // We can alter flags based on environment here
  // (e.g. for CI runs with different flags).
  return require.requireActual('shared/ReactFeatureFlags');
});

// Error logging varies between Fiber and Stack;
// Rather than fork dozens of tests, mock the error-logging file by default.
// TODO: direct imports like some-package/src/* are bad. Fix me.
jest.mock('react-reconciler/src/ReactFiberErrorLogger');
