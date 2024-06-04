'use strict';

jest.mock('shared/ReactFeatureFlags', () => {
  jest.mock(
    'ReactNativeInternalFeatureFlags',
    () =>
      jest.requireActual('shared/forks/ReactFeatureFlags.native-fb-dynamic.js'),
    {virtual: true}
  );
  const actual = jest.requireActual(
    'shared/forks/ReactFeatureFlags.native-fb.js'
  );

  // Lots of tests use these, but we don't want to expose it to RN.
  // Since the xplat tests run with the www entry points, these tests pass.
  actual.enableLegacyCache = true;
  actual.enableScopeAPI = true;
  actual.enableTaint = false;

  return actual;
});

jest.mock('react-noop-renderer', () =>
  jest.requireActual('react-noop-renderer/persistent')
);

global.__PERSISTENT__ = true;
global.__XPLAT__ = true;
