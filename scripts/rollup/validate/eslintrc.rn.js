'use strict';

module.exports = {
  env: {
    commonjs: true,
    browser: true,
  },
  globals: {
    // ES6
    Map: true,
    Set: true,
    Symbol: true,
    Proxy: true,
    WeakMap: true,
    WeakSet: true,
    // Vendor specific
    MSApp: true,
    __REACT_DEVTOOLS_GLOBAL_HOOK__: true,
    // FB
    __DEV__: true,
    // Fabric. See https://github.com/facebook/react/pull/15490
    // for more information
    nativeFabricUIManager: true,
  },
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'script',
  },
  rules: {
    'no-undef': 'error',
    'no-shadow-restricted-names': 'error',
  },
};
