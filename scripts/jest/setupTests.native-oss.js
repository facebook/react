'use strict';

jest.mock('shared/ReactFeatureFlags', () =>
  require('shared/forks/ReactFeatureFlags.native-oss')
);

jest.mock('react-noop-renderer', () =>
  jest.requireActual('react-noop-renderer/persistent')
);

global.__PERSISTENT__ = true;
