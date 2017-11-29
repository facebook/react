'use strict';

const path = require('path');
const bundleTypes = require('./bundles').bundleTypes;

const UMD_DEV = bundleTypes.UMD_DEV;
const UMD_PROD = bundleTypes.UMD_PROD;
const FB_DEV = bundleTypes.FB_DEV;
const FB_PROD = bundleTypes.FB_PROD;

// If you need to replace a file with another file for a specific environment,
// add it to this list with the logic for choosing the right replacement.
const forkedModules = Object.freeze({
  // Optimization: for UMDs, use object-assign polyfill that is already a part
  // of the React package instead of bundling it again.
  'object-assign': (bundleType, entry) => {
    if (bundleType !== UMD_DEV && bundleType !== UMD_PROD) {
      // It's only relevant for UMD bundles since that's where the duplication
      // happens. Other bundles just require('object-assign') anyway.
      return null;
    }
    if (getDependencies(bundleType, entry).indexOf('react') === -1) {
      // We can only apply the optimizations to bundle that depend on React
      // because we read assign() from an object exposed on React internals.
      return null;
    }
    // We can use the fork!
    return 'shared/forks/object-assign.umd.js';
  },

  // We have a few forks for different environments.
  'shared/ReactFeatureFlags': (bundleType, entry) => {
    switch (entry) {
      case 'react-native-renderer':
        return 'shared/forks/ReactFeatureFlags.native.js';
      case 'react-cs-renderer':
        return 'shared/forks/ReactFeatureFlags.native-cs.js';
      default:
        switch (bundleType) {
          case FB_DEV:
          case FB_PROD:
            return 'shared/forks/ReactFeatureFlags.www.js';
        }
    }
    return null;
  },

  // This logic is forked on www to blacklist warnings.
  'shared/lowPriorityWarning': (bundleType, entry) => {
    switch (bundleType) {
      case FB_DEV:
      case FB_PROD:
        return 'shared/forks/lowPriorityWarning.www.js';
      default:
        return null;
    }
  },

  // In FB bundles, we preserve an inline require to ReactCurrentOwner.
  // See the explanation in FB version of ReactCurrentOwner in www:
  'react/src/ReactCurrentOwner': (bundleType, entry) => {
    switch (bundleType) {
      case FB_DEV:
      case FB_PROD:
        return 'react/src/forks/ReactCurrentOwner.www.js';
      default:
        return null;
    }
  },
});

// Bundles exporting globals that other modules rely on.
const knownGlobals = Object.freeze({
  react: 'React',
  'react-dom': 'ReactDOM',
});

// For any external that is used in a DEV-only condition, explicitly
// specify whether it has side effects during import or not. This lets
// us know whether we can safely omit them when they are unused.
const HAS_NO_SIDE_EFFECTS_ON_IMPORT = false;
// const HAS_SIDE_EFFECTS_ON_IMPORT = true;
const importSideEffects = Object.freeze({
  'fbjs/lib/invariant': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  'fbjs/lib/warning': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  'prop-types/checkPropTypes': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  'fbjs/lib/camelizeStyleName': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  'fbjs/lib/hyphenateStyleName': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  deepFreezeAndThrowOnMutationInDev: HAS_NO_SIDE_EFFECTS_ON_IMPORT,
});

// Given ['react'] in bundle externals, returns { 'react': 'React' }.
function getPeerGlobals(externals, moduleType) {
  const peerGlobals = {};
  externals.forEach(name => {
    if (
      !knownGlobals[name] &&
      (moduleType === UMD_DEV || moduleType === UMD_PROD)
    ) {
      throw new Error('Cannot build UMD without a global name for: ' + name);
    }
    peerGlobals[name] = knownGlobals[name];
  });
  return peerGlobals;
}

// Determines node_modules packages that are safe to assume will exist.
function getDependencies(bundleType, entry) {
  const packageJson = require(path.basename(
    path.dirname(require.resolve(entry))
  ) + '/package.json');
  // Both deps and peerDeps are assumed as accessible.
  return Array.from(
    new Set([
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ])
  );
}

// Hijacks some modules for optimization and integration reasons.
function getForks(bundleType, entry) {
  const shims = {};
  Object.keys(forkedModules).forEach(srcModule => {
    const targetModule = forkedModules[srcModule](bundleType, entry);
    if (targetModule === null) {
      return;
    }
    const targetPath = require.resolve(targetModule);
    shims[srcModule] = targetPath;
    // <hack>
    // Unfortunately the above doesn't work for relative imports,
    // and Rollup isn't smart enough to understand they refer to the same file.
    // We should come up with a real fix for this, but for now this will do.
    // FIXME: this is gross.
    const fileName = path.parse(srcModule).name;
    shims['./' + fileName] = targetPath;
    shims['../' + fileName] = targetPath;
    // We don't have deeper relative requires between source files.
    // </hack>
  });
  return shims;
}

function getImportSideEffects() {
  return importSideEffects;
}

module.exports = {
  getImportSideEffects,
  getPeerGlobals,
  getDependencies,
  getForks,
};
