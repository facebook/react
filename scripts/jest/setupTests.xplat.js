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

  console.log('__VARIANT__', __VARIANT__);
  return actual;
});

jest.mock('react-noop-renderer', () =>
  jest.requireActual('react-noop-renderer/persistent')
);

global.__PERSISTENT__ = true;
