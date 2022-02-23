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

// Fork paths are relative to the project root. They must include the full path,
// including the extension. We intentionally don't use Node's module resolution
// algorithm because 1) require.resolve doesn't work with ESM modules, and 2)
// the behavior is easier to predict.
const forks = Object.freeze({
  // NOTE: This is hard-coded to the main entry point of the (third-party)
  // react-shallow-renderer package.
  './node_modules/react-shallow-renderer/index.js': () => {
    // Use ESM build of `react-shallow-renderer`.
    return './node_modules/react-shallow-renderer/esm/index.js';
  },

  // Without this fork, importing `shared/ReactSharedInternals` inside
  // the `react` package itself would not work due to a cyclical dependency.
  './packages/shared/ReactSharedInternals.js': (
    bundleType,
    entry,
    dependencies
  ) => {
    if (entry === 'react' || entry === 'react/src/ReactSharedSubset.js') {
      return './packages/react/src/ReactSharedInternals.js';
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
  './packages/shared/ReactFeatureFlags.js': (bundleType, entry) => {
    switch (entry) {
      case 'react-native-renderer':
        switch (bundleType) {
          case RN_FB_DEV:
          case RN_FB_PROD:
          case RN_FB_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.native-fb.js';
          case RN_OSS_DEV:
          case RN_OSS_PROD:
          case RN_OSS_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.native-oss.js';
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
            return './packages/shared/forks/ReactFeatureFlags.native-fb.js';
          case RN_OSS_DEV:
          case RN_OSS_PROD:
          case RN_OSS_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.native-oss.js';
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
            return './packages/shared/forks/ReactFeatureFlags.test-renderer.native.js';
          case FB_WWW_DEV:
          case FB_WWW_PROD:
          case FB_WWW_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.test-renderer.www.js';
        }
        return './packages/shared/forks/ReactFeatureFlags.test-renderer.js';
      case 'react-dom/unstable_testing':
        switch (bundleType) {
          case FB_WWW_DEV:
          case FB_WWW_PROD:
          case FB_WWW_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.testing.www.js';
        }
        return './packages/shared/forks/ReactFeatureFlags.testing.js';
      default:
        switch (bundleType) {
          case FB_WWW_DEV:
          case FB_WWW_PROD:
          case FB_WWW_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.www.js';
          case RN_FB_DEV:
          case RN_FB_PROD:
          case RN_FB_PROFILING:
            return './packages/shared/forks/ReactFeatureFlags.native-fb.js';
        }
    }
    return null;
  },

  './packages/scheduler/index.js': (bundleType, entry, dependencies) => {
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
        return './packages/shared/forks/Scheduler.umd.js';
      default:
        // For other bundles, use the shared NPM package.
        return null;
    }
  },

  './packages/scheduler/src/SchedulerFeatureFlags.js': (
    bundleType,
    entry,
    dependencies
  ) => {
    if (
      bundleType === FB_WWW_DEV ||
      bundleType === FB_WWW_PROD ||
      bundleType === FB_WWW_PROFILING
    ) {
      return './packages/scheduler/src/forks/SchedulerFeatureFlags.www.js';
    }
    return './packages/scheduler/src/SchedulerFeatureFlags.js';
  },

  './packages/shared/consoleWithStackDev.js': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
        return './packages/shared/forks/consoleWithStackDev.www.js';
      default:
        return null;
    }
  },

  // In FB bundles, we preserve an inline require to ReactCurrentOwner.
  // See the explanation in FB version of ReactCurrentOwner in www:
  './packages/react/src/ReactCurrentOwner.js': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        return './packages/react/src/forks/ReactCurrentOwner.www.js';
      default:
        return null;
    }
  },

  // Similarly, we preserve an inline require to ReactCurrentDispatcher.
  // See the explanation in FB version of ReactCurrentDispatcher in www:
  './packages/react/src/ReactCurrentDispatcher.js': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        return './packages/react/src/forks/ReactCurrentDispatcher.www.js';
      default:
        return null;
    }
  },

  './packages/react/src/ReactSharedInternals.js': (bundleType, entry) => {
    switch (bundleType) {
      case UMD_DEV:
      case UMD_PROD:
      case UMD_PROFILING:
        return './packages/react/src/forks/ReactSharedInternals.umd.js';
      default:
        return null;
    }
  },

  // Different wrapping/reporting for caught errors.
  './packages/shared/invokeGuardedCallbackImpl.js': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        return './packages/shared/forks/invokeGuardedCallbackImpl.www.js';
      default:
        return null;
    }
  },

  './packages/react-reconciler/src/ReactFiberReconciler.js': (
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
          return './packages/react-reconciler/src/ReactFiberReconciler.new.js';
      }
    }
    // Otherwise, use the non-forked version.
    return './packages/react-reconciler/src/ReactFiberReconciler.old.js';
  },

  './packages/react-reconciler/src/ReactEventPriorities.js': (
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
          return './packages/react-reconciler/src/ReactEventPriorities.new.js';
      }
    }
    // Otherwise, use the non-forked version.
    return './packages/react-reconciler/src/ReactEventPriorities.old.js';
  },

  './packages/react-reconciler/src/ReactFiberHotReloading.js': (
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
          return './packages/react-reconciler/src/ReactFiberHotReloading.new.js';
      }
    }
    // Otherwise, use the non-forked version.
    return './packages/react-reconciler/src/ReactFiberHotReloading.old.js';
  },

  // Different dialogs for caught errors.
  './packages/react-reconciler/src/ReactFiberErrorDialog.js': (
    bundleType,
    entry
  ) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        // Use the www fork which shows an error dialog.
        return './packages/react-reconciler/src/forks/ReactFiberErrorDialog.www.js';
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
            return './packages/react-reconciler/src/forks/ReactFiberErrorDialog.native.js';
          default:
            return null;
        }
      default:
        return null;
    }
  },

  './packages/react-reconciler/src/ReactFiberHostConfig.js': (
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
        return `./packages/react-reconciler/src/forks/ReactFiberHostConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactFiberHostConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  './packages/react-server/src/ReactServerStreamConfig.js': (
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
        return `./packages/react-server/src/forks/ReactServerStreamConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactServerStreamConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  './packages/react-server/src/ReactServerFormatConfig.js': (
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
        return `./packages/react-server/src/forks/ReactServerFormatConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactServerFormatConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  './packages/react-server/src/ReactFlightServerConfig.js': (
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
        return `./packages/react-server/src/forks/ReactFlightServerConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactFlightServerConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  './packages/react-client/src/ReactFlightClientHostConfig.js': (
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
        return `./packages/react-client/src/forks/ReactFlightClientHostConfig.${rendererInfo.shortName}.js`;
      }
    }
    throw new Error(
      'Expected ReactFlightClientHostConfig to always be replaced with a shim, but ' +
        `found no mention of "${entry}" entry point in ./scripts/shared/inlinedHostConfigs.js. ` +
        'Did you mean to add it there to associate it with a specific renderer?'
    );
  },

  // We wrap top-level listeners into guards on www.
  './packages/react-dom/src/events/EventListener.js': (bundleType, entry) => {
    switch (bundleType) {
      case FB_WWW_DEV:
      case FB_WWW_PROD:
      case FB_WWW_PROFILING:
        if (__EXPERIMENTAL__) {
          // In modern builds we don't use the indirection. We just use raw DOM.
          return null;
        } else {
          // Use the www fork which is integrated with TimeSlice profiling.
          return './packages/react-dom/src/events/forks/EventListener-www.js';
        }
      default:
        return null;
    }
  },

  './packages/use-sync-external-store/src/useSyncExternalStore.js': (
    bundleType,
    entry
  ) => {
    if (entry.startsWith('use-sync-external-store/shim')) {
      return './packages/use-sync-external-store/src/forks/useSyncExternalStore.forward-to-shim.js';
    }
    if (entry !== 'use-sync-external-store') {
      // Internal modules that aren't shims should use the native API from the
      // react package.
      return './packages/use-sync-external-store/src/forks/useSyncExternalStore.forward-to-built-in.js';
    }
    return null;
  },

  './packages/use-sync-external-store/src/isServerEnvironment.js': (
    bundleType,
    entry
  ) => {
    if (entry.endsWith('.native')) {
      return './packages/use-sync-external-store/src/forks/isServerEnvironment.native.js';
    }
  },
});

module.exports = forks;
