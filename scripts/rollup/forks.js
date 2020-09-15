'use strict';

const {bundleTypes, moduleTypes} = require('./bundles');
const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

const {
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  FB_WWW_DEV,
  FB_WWW_PROD,
  FB_WWW_PROFILING,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_OSS_PROFILING,
  RN_FB_DEV,
  RN_FB_PROD,
  RN_FB_PROFILING,
} = bundleTypes;
const {RENDERER, RECONCILER} = moduleTypes;

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to building in experimental mode. If the release channel is set via
// an environment variable, then check if it's "experimental".
const __EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

// If you need to replace a file with another file for a specific environment,
// add it to this list with the logic for choosing the right replacement.
const forks = Object.freeze({
  // Optimization: for UMDs, use a version that we can inline into the React bundle.
  // Use that from all other bundles.
  'object-assign': (bundleType, entry, dependencies) => {
    if (
      bundleType !== UMD_DEV &&
      bundleType !== UMD_PROD &&
      bundleType !== UMD_PROFILING
    ) {
      // It's only relevant for UMD bundles since that's where the duplication
      // happens. Other bundles just require('object-assign') anyway.
      return null;
    }
    if (entry === 'react') {
      // Use the forked version that uses ES modules instead of CommonJS.
      return 'shared/forks/object-assign.inline-umd.js';
    }
    if (dependencies.indexOf('react') === -1) {
      // We can only apply the optimizations to bundle that depend on React
      // because we read assign() from an object exposed on React internals.
      return null;
    }
    // We can use the fork that reads the secret export!
    return 'shared/forks/object-assign.umd.js';
  },

  'react-shallow-renderer': () => {
    // Use ESM build of `react-shallow-renderer`.
    return 'react-shallow-renderer/esm/index.js';
  },

  // Without this fork, importing `shared/ReactSharedInternals` inside
  // the `react` package itself would not work due to a cyclical dependency.
  'shared/ReactSharedInternals': (bundleType, entry, dependencies) => {
    if (entry === 'react') {
      return 'react/src/ReactSharedInternals';
    }
    if (!entry.startsWith('react/') && dependencies.indexOf('react') === -1) {
      // React internals are unavailable if we can't reference the package.
      // We return an error because we only want to throw if this module gets used.
      return new Error(
        'Cannot use a module that depends on ReactSharedInternals ' +
          'from "' +
          entry +
          '" because it does not declare "react" in the package ' +
          'dependencies or peerDependencies.'
      );
    }
    return null;
  },

  // We have a few forks for different environments.
  'shared/ReactFeatureFlags': (bundleType, entry) => {
    switch (entry) {
      case 'react-native-renderer':
        switch (bundleType) {
          case RN_FB_DEV:
          case RN_FB_PROD:
          case RN_FB_PROFILING:
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
          case RN_FB_PROFILING:
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
      case 'react-test-renderer':
        switch (bundleType) {
          case RN_FB_DEV:
          case RN_FB_PROD:
          case RN_FB_PROFILING:
          case RN_OSS_DEV:
          case RN_OSS_PROD:
          case RN_OSS_PROFILING:
            return 'shared/forks/ReactFeatureFlags.test-renderer.native.js';
          case FB_WWW_DEV:
          case FB_WWW_PROD:
          case FB_WWW_PROFILING:
            return 'shared/forks/ReactFeatureFlags.test-renderer.www.js';
        }
        return 'shared/forks/ReactFeatureFlags.test-renderer.js';
      case 'react-dom/testing':
        switch (bundleType) {
          case FB_WWW_DEV:
          case FB_WWW_PROD:
          case FB_WWW_PROFILING:
            return 'shared/forks/ReactFeatureFlags.testing.www.js';
        }
        return 'shared/forks/ReactFeatureFlags.testing.js';
      default:
        switch (bundleType) {
          case FB_WWW_DEV:
          case FB_WWW_PROD:
          case FB_WWW_PROFILING:
            return 'shared/forks/ReactFeatureFlags.www.js';
          case RN_FB_DEV:
          case RN_FB_PROD:
          case RN_FB_PROFILING:
            return 'shared/forks/ReactFeatureFlags.native-fb.js';
        }
    }
    return null;
  },

  scheduler: (bundleType, entry, dependencies) => {
    switch (bundleType) {
      case UMD_DEV:
      case UMD_PROD:
      case UMD_PROFILING:
        if (dependencies.indexOf('react') === -1) {
          // It's only safe to use this fork for modules that depend on React,
          // because they read the re-exported API from the SECRET_INTERNALS object.
          return null;
        }
        // Optimization: for UMDs, use the API that is already a part of the React
        // package instead of requiring it to be loaded via a separate <script> tag
        return 'shared/forks/Scheduler.umd.js';
      default:
        // For other bundles, use the shared NPM package.
        return null;
    }
  },

  'scheduler/tracing': (bundleType, entry, dependencies) => {
    switch (bundleType) {
      case UMD_DEV:
      case UMD_PROD:
      case UMD_PROFILING:
        if (dependencies.indexOf('react') === -1) {
          // It's only safe to use this fork for modules that depend on React,
          // because they read the re-exported API from the SECRET_INTERNALS object.
          return null;
        }
        // Optimization: for UMDs, use the API that is already a part of the React
        // package instead of requiring it to be loaded via a separate <script> tag
        return 'shared/forks/SchedulerTracing.umd.js';
      default:
        // For other bundles, use the shared NPM package.
        return null;
    }
  },

  'scheduler/src/SchedulerFeatureFlags': (bundleType, entry, dependencies) => {
    if (
      bundleType === FB_WWW_DEV ||
      bundleType === FB_WWW_PROD ||
      bundleType === FB_WWW_PROFILING
    ) {
      return 'scheduler/src/forks/SchedulerFeatureFlags.www.js';
    }
    return 'scheduler/src/SchedulerFeatureFlags';
  },

  'scheduler/src/SchedulerHostConfig': (bundleType, entry, dependencies) => {
    if (
      entry === 'scheduler/unstable_mock' ||
      entry === 'react-noop-renderer' ||
      entry === 'react-noop-renderer/persistent' ||
      entry === 'react-test-renderer'
    ) {
      return 'scheduler/src/forks/SchedulerHostConfig.mock';
    }
    return 'scheduler/src/forks/SchedulerHostConfig.default';
  },

  'shared/consoleWithStackDev': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
        return 'shared/forks/consoleWithStackDev.www.js';
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
      case FB_WWW_PROFILING:
        return 'react/src/forks/ReactCurrentOwner.www.js';
      default:
        return null;
    }
  },

  // Similarly, we preserve an inline require to ReactCurrentDispatcher.
  // See the explanation in FB version of ReactCurrentDispatcher in www:
  'react/src/ReactCurrentDispatcher': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        return 'react/src/forks/ReactCurrentDispatcher.www.js';
      default:
        return null;
    }
  },

  'react/src/ReactSharedInternals.js': (bundleType, entry) => {
    switch (bundleType) {
      case UMD_DEV:
      case UMD_PROD:
      case UMD_PROFILING:
        return 'react/src/forks/ReactSharedInternals.umd.js';
      default:
        return null;
    }
  },

  // Different wrapping/reporting for caught errors.
  'shared/invokeGuardedCallbackImpl': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        return 'shared/forks/invokeGuardedCallbackImpl.www.js';
      default:
        return null;
    }
  },

  'react-reconciler/src/ReactFiberReconciler': (
    bundleType,
    entry,
    dependencies,
    moduleType,
    bundle
  ) => {
    if (bundle.enableNewReconciler) {
      switch (bundleType) {
        case FB_WWW_DEV:
        case FB_WWW_PROD:
        case FB_WWW_PROFILING:
          // Use the forked version of the reconciler
          return 'react-reconciler/src/ReactFiberReconciler.new.js';
      }
    }
    // Otherwise, use the non-forked version.
    return 'react-reconciler/src/ReactFiberReconciler.old.js';
  },

  'react-reconciler/src/ReactFiberHotReloading': (
    bundleType,
    entry,
    dependencies,
    moduleType,
    bundle
  ) => {
    if (bundle.enableNewReconciler) {
      switch (bundleType) {
        case FB_WWW_DEV:
        case FB_WWW_PROD:
        case FB_WWW_PROFILING:
          // Use the forked version of the reconciler
          return 'react-reconciler/src/ReactFiberHotReloading.new.js';
      }
    }
    // Otherwise, use the non-forked version.
    return 'react-reconciler/src/ReactFiberHotReloading.old.js';
  },

  // Different dialogs for caught errors.
  'react-reconciler/src/ReactFiberErrorDialog': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        // Use the www fork which shows an error dialog.
        return 'react-reconciler/src/forks/ReactFiberErrorDialog.www.js';
      case RN_OSS_DEV:
      case RN_OSS_PROD:
      case RN_OSS_PROFILING:
      case RN_FB_DEV:
      case RN_FB_PROD:
      case RN_FB_PROFILING:
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
        return `react-reconciler/src/forks/ReactFiberHostConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactFiberHostConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  'react-server/src/ReactServerStreamConfig': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-server') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        if (!rendererInfo.isServerSupported) {
          return null;
        }
        return `react-server/src/forks/ReactServerStreamConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactServerStreamConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  'react-server/src/ReactServerFormatConfig': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-server') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        if (!rendererInfo.isServerSupported) {
          return null;
        }
        return `react-server/src/forks/ReactServerFormatConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactServerFormatConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  'react-server/src/ReactFlightServerConfig': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-server') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        if (!rendererInfo.isServerSupported) {
          return null;
        }
        return `react-server/src/forks/ReactFlightServerConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactFlightServerConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  'react-client/src/ReactFlightClientHostConfig': (
    bundleType,
    entry,
    dependencies,
    moduleType
  ) => {
    if (dependencies.indexOf('react-client') !== -1) {
      return null;
    }
    if (moduleType !== RENDERER && moduleType !== RECONCILER) {
      return null;
    }
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (let rendererInfo of inlinedHostConfigs) {
      if (rendererInfo.entryPoints.indexOf(entry) !== -1) {
        if (!rendererInfo.isServerSupported) {
          return null;
        }
        return `react-client/src/forks/ReactFlightClientHostConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactFlightClientHostConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  // We wrap top-level listeners into guards on www.
  'react-dom/src/events/EventListener': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        if (__EXPERIMENTAL__) {
          // In modern builds we don't use the indirection. We just use raw DOM.
          return null;
        } else {
          // Use the www fork which is integrated with TimeSlice profiling.
          return 'react-dom/src/events/forks/EventListener-www.js';
        }
      default:
        return null;
    }
  },
});

module.exports = forks;
