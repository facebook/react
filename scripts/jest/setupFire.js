'use strict';

jest.mock('shared/ReactFeatureFlags', () => {
  const ReactFeatureFlags = require.requireActual('shared/ReactFeatureFlags');
  // TODO: Set feature flags for Fire
  return ReactFeatureFlags;
});
