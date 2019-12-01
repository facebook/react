'use strict';

const path = require('path');
const Bundles = require('../bundles');

const {
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  ESM_DEV,
  ESM_PROD,
  NODE_DEV,
  NODE_PROD,
  NODE_PROFILING,
  FB_WWW_DEV,
  FB_WWW_PROD,
  FB_WWW_PROFILING,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_OSS_PROFILING,
  RN_FB_DEV,
  RN_FB_PROD,
  RN_FB_PROFILING,
} = Bundles.bundleTypes;

module.exports = function getBabelConfig(
  updateBabelOptions,
  bundleType,
  filename
) {
  let options = {
    exclude: '/**/node_modules/**',
    presets: [],
    plugins: [],
  };
  if (updateBabelOptions) {
    options = updateBabelOptions(options);
  }
  switch (bundleType) {
    case FB_WWW_DEV:
    case FB_WWW_PROD:
    case FB_WWW_PROFILING:
      return Object.assign({}, options, {
        plugins: options.plugins.concat([
          // Minify invariant messages
          require('../../error-codes/transform-error-messages'),
          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('../../babel/wrap-warning-with-env-check'),
          // Remove getters for IE8 support
          require('../../babel/transform-remove-getters'),
        ]),
      });
    case RN_OSS_DEV:
    case RN_OSS_PROD:
    case RN_OSS_PROFILING:
    case RN_FB_DEV:
    case RN_FB_PROD:
    case RN_FB_PROFILING:
      return Object.assign({}, options, {
        plugins: options.plugins.concat([
          [
            require('../../error-codes/transform-error-messages'),
            // Preserve full error messages in React Native build
            {noMinify: true},
          ],
          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('../../babel/wrap-warning-with-env-check'),
        ]),
      });
    case UMD_DEV:
    case UMD_PROD:
    case UMD_PROFILING:
    case ESM_DEV:
    case ESM_PROD:
    case NODE_DEV:
    case NODE_PROD:
    case NODE_PROFILING:
      return Object.assign({}, options, {
        plugins: options.plugins.concat([
          // Use object-assign polyfill in open source
          path.resolve('./scripts/babel/transform-object-assign-require'),
          // Minify invariant messages
          require('../../error-codes/transform-error-messages'),
          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('../../babel/wrap-warning-with-env-check'),
        ]),
      });
    default:
      return options;
  }
};
