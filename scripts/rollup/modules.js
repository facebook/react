'use strict';

const path = require('path');
const bundleTypes = require('./bundles').bundleTypes;

const UMD_DEV = bundleTypes.UMD_DEV;
const UMD_PROD = bundleTypes.UMD_PROD;
const FB_DEV = bundleTypes.FB_DEV;
const FB_PROD = bundleTypes.FB_PROD;

// Bundles exporting globals that other modules rely on.
const knownGlobals = Object.freeze({
  react: 'React',
  'react-dom': 'ReactDOM',
});

// Redirect some modules to Haste forks in www.
// Assuming their names in www are the same, and also match
// imported names in corresponding ./shims/rollup/*-www.js shims.
const forkedFBModules = Object.freeze([
  // At FB, we don't know them statically:
  'shared/ReactFeatureFlags',
  // This logic is also forked internally.
  'shared/lowPriorityWarning',
  // In FB bundles, we preserve an inline require to ReactCurrentOwner.
  // See the explanation in FB version of ReactCurrentOwner in www:
  'react/src/ReactCurrentOwner',
]);

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
  let deps = Array.from(
    new Set([
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ])
  );
  // In www, forked modules are also require-able.
  if (bundleType === FB_DEV || bundleType === FB_PROD) {
    deps = [...deps, ...forkedFBModules.map(name => path.basename(name))];
  }
  return deps;
}

function getImportSideEffects() {
  return importSideEffects;
}

// Hijacks some modules for optimization and integration reasons.
function getShims(bundleType, entry, featureFlags) {
  const shims = {};
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
      if (getDependencies(bundleType, entry).indexOf('react') !== -1) {
        // Optimization: rely on object-assign polyfill that is already a part
        // of the React package instead of bundling it again.
        shims['object-assign'] = path.resolve(
          __dirname + '/shims/rollup/assign-umd.js'
        );
      }
      break;
    case FB_DEV:
    case FB_PROD:
      // FB forks a few modules in www that are usually bundled.
      // Instead of bundling them, they need to be kept as require()s in the
      // final bundles so that they import www modules with the same names.
      // Rollup doesn't make it very easy to rewrite and ignore such a require,
      // so we resort to using a shim that re-exports the www module, and then
      // treating shim's target destinations as external (see getDependencies).
      forkedFBModules.forEach(srcPath => {
        const wwwName = path.parse(srcPath).name;
        const shimPath = path.resolve(
          __dirname + `/shims/rollup/${wwwName}-www.js`
        );
        shims[srcPath] = shimPath;
      });
      break;
  }
  if (featureFlags) {
    shims['shared/ReactFeatureFlags'] = require.resolve(featureFlags);
  }
  return shims;
}

module.exports = {
  getImportSideEffects,
  getPeerGlobals,
  getDependencies,
  getShims,
};
