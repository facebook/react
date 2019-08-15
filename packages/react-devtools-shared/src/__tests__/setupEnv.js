'use strict';

// Import test renderer and then reset modules for two reasons:
// 1. We don't want test renderer connected to the DevTools hooks.
// 2. This enables us to work around the on-renderer limitation.
// TODO This (or the resetModules below) might be the cause of the hooks erorr in some tests
const ReactTestRenderer = require.requireActual('react-test-renderer');

jest.resetModules();

jest.mock('react-test-renderer', () => ReactTestRenderer);

// DevTools stores preferences between sessions in localStorage
if (!global.hasOwnProperty('localStorage')) {
  global.localStorage = require('local-storage-fallback').default;
}

// Mimic the global we set with Webpack's DefinePlugin
global.__DEV__ = process.env.NODE_ENV !== 'production';
