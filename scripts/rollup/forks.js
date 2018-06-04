'use strict';

const bundleTypes = require('./bundles').bundleTypes;
const moduleTypes = require('./bundles').moduleTypes;
const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

const UMD_DEV = bundleTypes.UMD_DEV;
const UMD_PROD = bundleTypes.UMD_PROD;
const FB_WWW_DEV = bundleTypes.FB_WWW_DEV;
const FB_WWW_PROD = bundleTypes.FB_WWW_PROD;
const RN_OSS_DEV = bundleTypes.RN_OSS_DEV;
const RN_OSS_PROD = bundleTypes.RN_OSS_PROD;
const RN_OSS_PROFILING = bundleTypes.RN_OSS_PROFILING;
const RN_FB_DEV = bundleTypes.RN_FB_DEV;
const RN_FB_PROD = bundleTypes.RN_FB_PROD;
const RENDERER = moduleTypes.RENDERER;
const RECONCILER = moduleTypes.RECONCILER;

// If you need to replace a file with another file for a specific environment,
// add it to this list with the logic for choosing the right replacement.
const forks = Object.freeze({
  // Optimization: for UMDs, use object-assign polyfill that is already a part
  // of the React package instead of bundling it again.
  'object-assign': (bundleType, entry, dependencies) => {
    if (bundleType !== UMD_DEV && bundleType !== UMD_PROD) {
      // It's only relevant for UMD bundles since that's where the duplication
      // happens. Other bundles just require('object-assign') anyway.
      return null;
    }
    if (dependencies.indexOf('react') === -1) {
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
        switch (bundleType) {
          case RN_FB_DEV:
          case RN_FB_PROD:
            return 'shared/forks/ReactFeatureFlags.native-fb.js';
          case RN_OSS_DEV:
          case RN_OSS_PROD:
          case RN_OSS_PROFILING:
            return 'shared/forks/ReactFeatureFlags.native-oss.js';
          default:
            throw Error(
              `Unexpected entry (${entry}) and bundleType (${bundleType})`
            );
        }
      case 'react-native-renderer/fabric':
        switch (bundleType) {
          case RN_FB_DEV:
          case RN_FB_PROD:
            return 'shared/forks/ReactFeatureFlags.native-fabric-fb.js';
          case RN_OSS_DEV:
          case RN_OSS_PROD:
          case RN_OSS_PROFILING:
            return 'shared/forks/ReactFeatureFlags.native-fabric-oss.js';
          default:
            throw Error(
              `Unexpected entry (${entry}) and bundleType (${bundleType})`
            );
        }
      case 'react-reconciler/persistent':
        return 'shared/forks/ReactFeatureFlags.persistent.js';
      case 'react-test-renderer':
        return 'shared/forks/ReactFeatureFlags.test-renderer.js';
      default:
        switch (bundleType) {
          case FB_WWW_DEV:
          case FB_WWW_PROD:
            return 'shared/forks/ReactFeatureFlags.www.js';
        }
    }
    return null;
  },

  'shared/ReactScheduler': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
        return 'shared/forks/ReactScheduler.www.js';
      default:
        return null;
    }
  },

  // This logic is forked on www to blacklist warnings.
  'shared/lowPriorityWarning': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
        return 'shared/forks/lowPriorityWarning.www.js';
      default:
        return null;
    }
  },

  // In FB bundles, we preserve an inline require to ReactCurrentOwner.
  // See the explanation in FB version of ReactCurrentOwner in www:
  'react/src/ReactCurrentOwner': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
        return 'react/src/forks/ReactCurrentOwner.www.js';
      default:
        return null;
    }
  },

  // Different wrapping/reporting for caught errors.
  'shared/invokeGuardedCallback': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
        return 'shared/forks/invokeGuardedCallback.www.js';
      default:
        return null;
    }
  },

  // Different dialogs for caught errors.
  'react-reconciler/src/ReactFiberErrorDialog': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
        // Use the www fork which shows an error dialog.
        return 'react-reconciler/src/forks/ReactFiberErrorDialog.www.js';
      case RN_OSS_DEV:
      case RN_OSS_PROD:
      case RN_OSS_PROFILING:
      case RN_FB_DEV:
      case RN_FB_PROD:
        switch (entry) {
          case 'react-native-renderer':
          case 'react-native-renderer/fabric':
            // Use the RN fork which plays well with redbox.
            return 'react-reconciler/src/forks/ReactFiberErrorDialog.native.js';
          default:
            return null;
        }
      default:
        return null;
    }
  },

  'react-reconciler/src/ReactFiberHostConfig': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-reconciler') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        return `react-reconciler/src/forks/ReactFiberHostConfig.${
          rendererInfo.shortName
        }.js`;
      }
    }
    throw new Error(
      'Expected ReactFiberHostConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  // We wrap top-level listeners into guards on www.
  'react-dom/src/events/EventListener': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
        // Use the www fork which is integrated with TimeSlice profiling.
        return 'react-dom/src/events/forks/EventListener-www.js';
      default:
        return null;
    }
  },

  // React DOM uses different top level event names and supports mouse events.
  'events/ResponderTopLevelEventTypes': (bundleType, entry) => {
    if (entry === 'react-dom' || entry.startsWith('react-dom/')) {
      return 'events/forks/ResponderTopLevelEventTypes.dom.js';
    }
    return null;
  },
});

module.exports = forks;
