'use strict';

jest.mock('react-dom', () => require.requireActual('react-dom/unstable-fire'));

jest.mock('shared/ReactFeatureFlags', () => {
  const ReactFeatureFlags = require.requireActual('shared/ReactFeatureFlags');
  ReactFeatureFlags.disableInputAttributeSyncing = true;
  return ReactFeatureFlags;
});
