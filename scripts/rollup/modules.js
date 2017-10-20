'use strict';

const path = require('path');
const bundleTypes = require('./bundles').bundleTypes;
const moduleTypes = require('./bundles').moduleTypes;
const extractErrorCodes = require('../error-codes/extract-errors');

const UMD_DEV = bundleTypes.UMD_DEV;
const UMD_PROD = bundleTypes.UMD_PROD;
const NODE_DEV = bundleTypes.NODE_DEV;
const NODE_PROD = bundleTypes.NODE_PROD;
const FB_DEV = bundleTypes.FB_DEV;
const FB_PROD = bundleTypes.FB_PROD;
const RN_DEV = bundleTypes.RN_DEV;
const RN_PROD = bundleTypes.RN_PROD;

const ISOMORPHIC = moduleTypes.ISOMORPHIC;
const RENDERER = moduleTypes.RENDERER;

const knownExternalGlobals = {
  'react': 'React',
  'react-dom': 'ReactDOM',
};

function getExternalGlobals(externals, bundleType, moduleType, entry) {
  const externalGlobals = {};

  externals.forEach(name => {
    if (!knownExternalGlobals[name] && (
      moduleType === UMD_DEV ||
      moduleType === UMD_PROD
    )) {
      throw new Error('Unknown global for an external: ' + name);
    }
    externalGlobals[name] = knownExternalGlobals[name];
  });

  return externalGlobals;
}

function getNodeDependencies(entry) {
  const packageJson = require(
    path.basename(path.dirname(require.resolve(entry))) + '/package.json'
  );
  return Array.from(new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {})
  ]));
}

function getModuleAliases(bundleType, entry) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
      if (getNodeDependencies(entry).indexOf('react') !== -1) {
        // Optimization: rely on object-assign polyfill that is already a part
        // of the React package instead of bundling it again.
        return {
          'object-assign': path.resolve(__dirname + '/shims/rollup/assign.js')
        };
      }
      return {};
    default:
      return {};
  }
}

function getIgnoredModules(bundleType) {
  // TODO
  return [];
}

module.exports = {
  getExternalGlobals,
  getNodeDependencies,
  getIgnoredModules,
  getModuleAliases,
};
