'use strict';

const forks = require('./forks');
const {UMD_DEV, UMD_PROD, UMD_PROFILING} = require('./bundles').bundleTypes;

// For any external that is used in a DEV-only condition, explicitly
// specify whether it has side effects during import or not. This lets
// us know whether we can safely omit them when they are unused.
const HAS_NO_SIDE_EFFECTS_ON_IMPORT = false;
// const HAS_SIDE_EFFECTS_ON_IMPORT = true;
const importSideEffects = Object.freeze({
  'prop-types/checkPropTypes': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  scheduler: HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  'scheduler/tracing': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  'react-dom/server': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  'react/jsx-dev-runtime': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  'react-fetch/node': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
});

// Bundles exporting globals that other modules rely on.
const knownGlobals = Object.freeze({
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/server': 'ReactDOMServer',
  'react-interactions/events/keyboard': 'ReactEventsKeyboard',
  'react-interactions/events/tap': 'ReactEventsTap',
  scheduler: 'Scheduler',
  'scheduler/tracing': 'SchedulerTracing',
  'scheduler/unstable_mock': 'SchedulerMock',
});

// Given ['react'] in bundle externals, returns { 'react': 'React' }.
function getPeerGlobals(externals, bundleType) {
  const peerGlobals = {};
  externals.forEach(name => {
    if (
      !knownGlobals[name] &&
      (bundleType === UMD_DEV ||
        bundleType === UMD_PROD ||
        bundleType === UMD_PROFILING)
    ) {
      throw new Error('Cannot build UMD without a global name for: ' + name);
    }
    peerGlobals[name] = knownGlobals[name];
  });
  return peerGlobals;
}

// Determines node_modules packages that are safe to assume will exist.
function getDependencies(bundleType, entry) {
  // Replaces any part of the entry that follow the package name (like
  // "/server" in "react-dom/server") by the path to the package settings
  const packageJson = require(entry.replace(/(\/.*)?$/, '/package.json'));
  // Both deps and peerDeps are assumed as accessible.
  return Array.from(
    new Set([
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ])
  );
}

// Hijacks some modules for optimization and integration reasons.
function getForks(bundleType, entry, moduleType, bundle) {
  const forksForBundle = {};
  Object.keys(forks).forEach(srcModule => {
    const dependencies = getDependencies(bundleType, entry);
    const targetModule = forks[srcModule](
      bundleType,
      entry,
      dependencies,
      moduleType,
      bundle
    );
    if (targetModule === null) {
      return;
    }
    forksForBundle[srcModule] = targetModule;
  });
  return forksForBundle;
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
