'use strict';

const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

// When testing the custom renderer code path through `react-reconciler`,
// turn the export into a function, and use the argument as host config.
const shimHostConfigPath = 'react-reconciler/src/ReactFiberHostConfig';
jest.mock('react-reconciler', () => {
  return config => {
    jest.mock(shimHostConfigPath, () => config);
    return require.requireActual('react-reconciler');
  };
});
jest.mock('react-reconciler/persistent', () => {
  return config => {
    jest.mock(shimHostConfigPath, () => config);
    return require.requireActual('react-reconciler/persistent');
  };
});

// But for inlined host configs (such as React DOM, Native, etc), we
// mock their named entry points to establish a host config mapping.
inlinedHostConfigs.forEach(rendererInfo => {
  if (rendererInfo.shortName === 'custom') {
    // There is no inline entry point for the custom renderers.
    // Instead, it's handled by the generic `react-reconciler` entry point above.
    return;
  }
  jest.mock(`react-reconciler/inline.${rendererInfo.shortName}`, () => {
    jest.mock(shimHostConfigPath, () =>
      require.requireActual(
        `react-reconciler/src/forks/ReactFiberHostConfig.${
          rendererInfo.shortName
        }.js`
      )
    );
    return require.requireActual('react-reconciler');
  });
});
