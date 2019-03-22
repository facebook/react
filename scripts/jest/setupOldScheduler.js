'use strict';

jest.mock('shared/ReactFeatureFlags', () => {
  const ReactFeatureFlags = require.requireActual('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableNewScheduler = false;
  return ReactFeatureFlags;
});
