'use strict';

// We want to globally mock this but jest doesn't let us do that by default
// for a file that already exists. So we have to explicitly mock it.
jest.mock('shared/ReactFeatureFlags', () => {
  const flags = require.requireActual('shared/ReactFeatureFlags');
  return Object.assign({}, flags, {
    disableNewFiberFeatures: true,
  });
});

// Error logging varies between Fiber and Stack;
// Rather than fork dozens of tests, mock the error-logging file by default.
// TODO: direct imports like some-package/src/* are bad. Fix me.
jest.mock('react-reconciler/src/ReactFiberErrorLogger');
