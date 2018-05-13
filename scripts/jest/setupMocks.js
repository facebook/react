'use strict';

const forkConfig = require('../rollup/forks');

const shimHostConfigPath = 'react-reconciler/src/ReactFiberHostConfig';
jest.mock('react-reconciler', () => {
  return (config) => {
    jest.mock(shimHostConfigPath, () => config);
    return require.requireActual('react-reconciler');
  };
});
[
  'react-dom',
  'react-art',
  'react-test-renderer',
  'react-native-renderer',
  'react-native-renderer/fabric',
].forEach(entry => {
  const actualHostConfigPath = forkConfig[shimHostConfigPath]('NODE_DEV', entry);
  if (typeof actualHostConfigPath !== 'string') {
    throw new Error('Could not find the host config for the renderer.');
  }
  jest.mock(entry, () => {
    jest.mock('react-reconciler/inline', () => {
      jest.mock(shimHostConfigPath,
        () => require.requireActual(actualHostConfigPath)
      );
      return require.requireActual('react-reconciler');
    });
    return require.requireActual(entry);
  });
});