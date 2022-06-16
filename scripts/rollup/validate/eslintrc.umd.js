'use strict';

module.exports = {
  env: {
    browser: true,
  },
  globals: {
    // ES6
    Map: 'readonly',
    Set: 'readonly',
    Symbol: 'readonly',
    Proxy: 'readonly',
    WeakMap: 'readonly',
    WeakSet: 'readonly',
    Uint16Array: 'readonly',
    Reflect: 'readonly',
    // Vendor specific
    MSApp: 'readonly',
    __REACT_DEVTOOLS_GLOBAL_HOOK__: 'readonly',
    // UMD wrapper code
    // TODO: this is too permissive.
    // Ideally we should only allow these *inside* the UMD wrapper.
    exports: 'readonly',
    module: 'readonly',
    define: 'readonly',
    require: 'readonly',
    globalThis: 'readonly',
    global: 'readonly',
    // Internet Explorer
    setImmediate: 'readonly',
    // Trusted Types
    trustedTypes: 'readonly',

    // Scheduler profiling
    Int32Array: 'readonly',
    ArrayBuffer: 'readonly',

    TaskController: 'readonly',
    reportError: 'readonly',

    // Flight
    Uint8Array: 'readonly',
    Promise: 'readonly',

    // Flight Webpack
    __webpack_chunk_load__: 'readonly',
    __webpack_require__: 'readonly',

    // jest
    jest: 'readonly',

    // act
    IS_REACT_ACT_ENVIRONMENT: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'script',
  },
  rules: {
    'no-undef': 'error',
    'no-shadow-restricted-names': 'error',
  },

  // These plugins aren't used, but eslint complains if an eslint-ignore comment
  // references unused plugins. An alternate approach could be to strip
  // eslint-ignore comments as part of the build.
  plugins: ['jest', 'no-for-of-loops', 'react', 'react-internal'],
};
