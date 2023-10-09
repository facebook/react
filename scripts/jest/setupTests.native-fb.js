'use strict';

jest.mock('shared/ReactFeatureFlags', () => {
  jest.mock(
    'ReactNativeInternalFeatureFlags',
    () =>
      jest.requireActual('shared/forks/ReactFeatureFlags.native-fb-dynamic'),
    {virtual: true}
  );
  return jest.requireActual('shared/forks/ReactFeatureFlags.native-fb');
});

jest.mock('react-noop-renderer', () =>
  jest.requireActual('react-noop-renderer/persistent')
);

global.__PERSISTENT__ = true;
