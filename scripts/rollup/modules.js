'use strict';

const resolve = require('path').resolve;
const basename = require('path').basename;
const sync = require('glob').sync;
const bundleTypes = require('./bundles').bundleTypes;
const extractErrorCodes = require('../error-codes/extract-errors');

const exclude = [
  'src/**/__benchmarks__/**/*.js',
  'src/**/__tests__/**/*.js',
  'src/**/__mocks__/**/*.js',
];

const UMD_DEV = bundleTypes.UMD_DEV;
const UMD_PROD = bundleTypes.UMD_PROD;
const NODE_DEV = bundleTypes.NODE_DEV;
const NODE_PROD = bundleTypes.NODE_PROD;
const FB_DEV = bundleTypes.FB_DEV;
const FB_PROD = bundleTypes.FB_PROD;
const RN_DEV = bundleTypes.RN_DEV;
const RN_PROD = bundleTypes.RN_PROD;

const errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};

// these are the FBJS modules that are used throughout our bundles
const fbjsModules = [
  'fbjs/lib/warning',
  'fbjs/lib/invariant',
  'fbjs/lib/emptyFunction',
  'fbjs/lib/emptyObject',
  'fbjs/lib/hyphenateStyleName',
  'fbjs/lib/getUnboundedScrollPosition',
  'fbjs/lib/camelizeStyleName',
  'fbjs/lib/containsNode',
  'fbjs/lib/shallowEqual',
  'fbjs/lib/getActiveElement',
  'fbjs/lib/focusNode',
  'fbjs/lib/EventListener',
  'fbjs/lib/memoizeStringOnly',
  'fbjs/lib/ExecutionEnvironment',
  'fbjs/lib/createNodesFromMarkup',
  'fbjs/lib/performanceNow',
];

const devOnlyFilesToStubOut = [
  "'ReactDebugCurrentFrame'",
  "'ReactComponentTreeHook'",
  "'react/lib/ReactDebugCurrentFrame'",
  "'react/lib/ReactComponentTreeHook'",
  "'react-dom/lib/ReactPerf'",
  "'react-dom/lib/ReactTestUtils'",
];

// this function builds up a very niave Haste-like moduleMap
// that works to create up an alias map for modules to link
// up to their actual disk location so Rollup can properly
// bundle them
function createModuleMap(paths, extractErrors, bundleType) {
  const moduleMap = {};

  paths.forEach(path => {
    const files = sync(path, {ignore: exclude});

    files.forEach(file => {
      if (extractErrors) {
        extractErrors(file);
      }
      const moduleName = basename(file, '.js');

      moduleMap[moduleName] = resolve(file);
    });
  });
  // if this is FB, we want to remove ReactCurrentOwner, so we can
  // handle it with a different case
  if (bundleType === FB_DEV || bundleType === FB_PROD) {
    delete moduleMap.ReactCurrentOwner;
  }
  return moduleMap;
}

function getNodeModules(bundleType) {
  // rather than adding the rollup node resolve plugin,
  // we can instead deal with the only node module that is used
  // for UMD bundles - object-assign
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
      return {
        'object-assign': resolve('./node_modules/object-assign/index.js'),
        // include the ART package modules directly by aliasing them from node_modules
        'art/modes/current': resolve('./node_modules/art/modes/current.js'),
        'art/modes/fast-noSideEffects': resolve(
          './node_modules/art/modes/fast-noSideEffects.js'
        ),
        'art/core/transform': resolve('./node_modules/art/core/transform.js'),
      };
    case NODE_DEV:
    case NODE_PROD:
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
      return {};
  }
}

function ignoreFBModules() {
  return [
    // At FB, we don't know them statically:
    'ReactFeatureFlags',
    'ReactDOMFeatureFlags',
    // In FB bundles, we preserve an inline require to ReactCurrentOwner.
    // See the explanation in FB version of ReactCurrentOwner in www:
    'react/lib/ReactCurrentOwner',
    'ReactCurrentOwner',
  ];
}

function ignoreReactNativeModules() {
  return [
    // This imports NativeMethodsMixin, causing
    // a circular dependency.
    'View',
  ];
}

function getExternalModules(externals, bundleType, isRenderer) {
  // external modules tell Rollup that we should not attempt
  // to bundle these modules and instead treat them as
  // external depedencies to the bundle. so for CJS bundles
  // this means having a require("name-of-external-module") at
  // the top of the bundle. for UMD bundles this means having
  // both a require and a global check for them
  let externalModules = externals;

  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
      if (isRenderer) {
        externalModules.push('react');
      }
      break;
    case NODE_DEV:
    case NODE_PROD:
    case RN_DEV:
    case RN_PROD:
      fbjsModules.forEach(module => externalModules.push(module));
      externalModules.push('object-assign');

      if (isRenderer) {
        externalModules.push('react');
      }
      break;
    case FB_DEV:
    case FB_PROD:
      fbjsModules.forEach(module => externalModules.push(module));
      externalModules.push('react/lib/ReactCurrentOwner', 'ReactCurrentOwner');
      if (isRenderer) {
        externalModules.push('React');
      }
      break;
  }
  return externalModules;
}

function getInternalModules() {
  // we tell Rollup where these files are located internally, otherwise
  // it doesn't pick them up and assumes they're external
  return {
    reactProdInvariant: resolve('./src/shared/utils/reactProdInvariant.js'),
  };
}

function replaceInternalModules() {
  // we inline these modules in the bundles rather than leave them as external
  return {
    "'react-dom/lib/ReactPerf'": `'${resolve('./src/renderers/shared/ReactPerf.js')}'`,
    "'react-dom/lib/ReactTestUtils'": `'${resolve('./src/test/ReactTestUtils.js')}'`,
    "'react-dom/lib/ReactInstanceMap'": `'${resolve('./src/renderers/shared/shared/ReactInstanceMap.js')}'`,
    "'react-dom'": `'${resolve('./src/renderers/dom/ReactDOM.js')}'`,
  };
}

function getFbjsModuleAliases(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
      // we want to bundle these modules, so we re-alias them to the actual
      // file so Rollup can bundle them up
      const fbjsModulesAlias = {};
      fbjsModules.forEach(fbjsModule => {
        fbjsModulesAlias[fbjsModule] = resolve(`./node_modules/${fbjsModule}`);
      });
      return fbjsModulesAlias;
    case NODE_DEV:
    case NODE_PROD:
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
      // for FB we don't want to bundle the above modules, instead keep them
      // as external require() calls in the bundle
      return {};
  }
}

function replaceFbjsModuleAliases(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
    case NODE_DEV:
    case NODE_PROD:
    case RN_DEV:
    case RN_PROD:
      return {};
    case FB_DEV:
    case FB_PROD:
      // additionally we add mappings for "react"
      // so they work correctly on FB, this will change soon
      return {
        "'react'": "'React'",
      };
  }
}

// for renderers, we want them to require the __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner
// on the React bundle itself rather than require module directly.
// For the React bundle, ReactCurrentOwner should be bundled as part of the bundle
// itself and exposed on __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
const shimReactCurrentOwner = resolve(
  './scripts/rollup/shims/rollup/ReactCurrentOwnerRollupShim.js'
);
const realReactCurrentOwner = resolve(
  './src/isomorphic/classic/element/ReactCurrentOwner.js'
);

function getReactCurrentOwnerModuleAlias(bundleType, isRenderer) {
  if (bundleType === FB_DEV || bundleType === FB_DEV) {
    return {};
  }
  if (isRenderer) {
    return {
      ReactCurrentOwner: shimReactCurrentOwner,
      'react/lib/ReactCurrentOwner': shimReactCurrentOwner,
    };
  } else {
    return {
      ReactCurrentOwner: realReactCurrentOwner,
      'react/lib/ReactCurrentOwner': realReactCurrentOwner,
    };
  }
}

// this works almost identically to the ReactCurrentOwner shim above
const shimReactComponentTreeHook = resolve(
  './scripts/rollup/shims/rollup/ReactComponentTreeHookRollupShim.js'
);
const realReactComponentTreeHook = resolve(
  './src/isomorphic/hooks/ReactComponentTreeHook.js'
);

function getReactComponentTreeHookModuleAlias(bundleType, isRenderer) {
  if (isRenderer) {
    return {
      ReactComponentTreeHook: shimReactComponentTreeHook,
      'react/lib/ReactComponentTreeHook': shimReactComponentTreeHook,
    };
  } else {
    return {
      ReactComponentTreeHook: realReactComponentTreeHook,
      'react/lib/ReactComponentTreeHook': realReactComponentTreeHook,
    };
  }
}

// this works almost identically to the ReactCurrentOwner shim above
const shimReactDebugCurrentFrame = resolve(
  './scripts/rollup/shims/rollup/ReactDebugCurrentFrameRollupShim.js'
);
const realReactDebugCurrentFrame = resolve(
  './src/isomorphic/classic/element/ReactDebugCurrentFrame.js'
);

function getReactDebugCurrentFrameModuleAlias(bundleType, isRenderer) {
  if (isRenderer) {
    return {
      ReactDebugCurrentFrame: shimReactDebugCurrentFrame,
      'react/lib/ReactDebugCurrentFrame': shimReactDebugCurrentFrame,
    };
  } else {
    return {
      ReactDebugCurrentFrame: realReactDebugCurrentFrame,
      'react/lib/ReactDebugCurrentFrame': realReactDebugCurrentFrame,
    };
  }
}

const devOnlyModuleStub = `'${resolve('./scripts/rollup/shims/rollup/DevOnlyStubShim.js')}'`;

function replaceDevOnlyStubbedModules(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case NODE_DEV:
    case FB_DEV:
    case RN_DEV:
    case RN_PROD:
      return {};
    case FB_PROD:
    case UMD_PROD:
    case NODE_PROD:
      const devOnlyModuleAliases = {};
      devOnlyFilesToStubOut.forEach(devOnlyModule => {
        devOnlyModuleAliases[devOnlyModule] = devOnlyModuleStub;
      });
      return devOnlyModuleAliases;
  }
}

function getAliases(paths, bundleType, isRenderer, extractErrors) {
  return Object.assign(
    getReactCurrentOwnerModuleAlias(bundleType, isRenderer),
    getReactComponentTreeHookModuleAlias(bundleType, isRenderer),
    getReactDebugCurrentFrameModuleAlias(bundleType, isRenderer),
    createModuleMap(
      paths,
      extractErrors && extractErrorCodes(errorCodeOpts),
      bundleType
    ),
    getInternalModules(),
    getNodeModules(bundleType),
    getFbjsModuleAliases(bundleType)
  );
}

function getDefaultReplaceModules(bundleType) {
  return Object.assign(
    {},
    replaceInternalModules(),
    replaceFbjsModuleAliases(bundleType),
    replaceDevOnlyStubbedModules(bundleType)
  );
}

function getExcludedHasteGlobs() {
  return exclude;
}

module.exports = {
  getExcludedHasteGlobs,
  getDefaultReplaceModules,
  getAliases,
  ignoreFBModules,
  ignoreReactNativeModules,
  getExternalModules,
};
