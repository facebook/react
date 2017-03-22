"use strict";

const { resolve, basename } = require('path');
const { sync } = require('glob');
const {
  bundleTypes,
 } = require('./bundles');

const exclude = [
  'src/**/__benchmarks__/**/*.js',
  'src/**/__tests__/**/*.js',
  'src/**/__mocks__/**/*.js',
];


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

// this function builds up a very niave Haste-like moduleMap
// that works to create up an alias map for modules to link
// up to their actual disk location so Rollup can properly
// bundle them
function createModuleMap(paths) {
  const moduleMap = {};

  paths.forEach(path => {
    const files = sync(path, exclude);
    
    files.forEach(file => {
      const moduleName = basename(file, '.js');

      moduleMap[moduleName] = resolve(file);
    });
  });
  return moduleMap;
}

function getNodeModules(bundleType) {
  // rather than adding the rollup node resolve plugin,
  // we can instead deal with the only node module that is used
  // for UMD bundles - object-assign
  switch (bundleType) {
    case bundleTypes.UMD_DEV:
    case bundleTypes.UMD_PROD:
      return {
        'object-assign': resolve('./node_modules/object-assign/index.js'),
      };
    case bundleTypes.NODE_DEV:
    case bundleTypes.NODE_PROD:
    case bundleTypes.FB:
    case bundleTypes.RN:
      return {};
  }
}

function ignoreFBModules() {
  return [
    // Shared mutable state.
    // We forked an implementation of this into forwarding/.
    // At FB, we don't know them statically:
    'ReactFeatureFlags',
    'ReactDOMFeatureFlags',
    // At FB, we fork this module for custom reporting flow:
    'ReactErrorUtils',
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
    case bundleTypes.UMD_DEV:
    case bundleTypes.UMD_PROD:
      if (isRenderer) {
        externalModules.push(
          'react'
        );
      }
      break;
    case bundleTypes.NODE_DEV:
    case bundleTypes.NODE_PROD:
    case bundleTypes.RN:
      externalModules.push(
        'object-assign',
        ...fbjsModules
      );

      if (isRenderer) {
        externalModules.push(
          'react'
        );
      }
      break;
    case bundleTypes.FB:
      externalModules.push(
        ...fbjsModules
      );
      if (isRenderer) {
        externalModules.push(
          'React'
        );
      }
      break;
  }
  return externalModules;
}

function getInternalModules(bundleType) {
  // we tell Rollup where these files are located internally, otherwise
  // it doesn't pick them up and assumes they're external
  return {
    reactProdInvariant: resolve('./src/shared/utils/reactProdInvariant.js'),
    // 'ReactComponentTreeHook': resolve('./src/isomorphic/hooks/ReactComponentTreeHook.js'),
    // 'react/lib/checkPropTypes': resolve('./src/isomorphic/classic/types/checkPropTypes.js'),
    'react/lib/ReactDebugCurrentFrame': resolve('./src/isomorphic/classic/element/ReactDebugCurrentFrame.js'),
    // 'react/lib/ReactComponentTreeHook': resolve('./src/isomorphic/hooks/ReactComponentTreeHook.js'),
  };
}

function replaceInternalModules() {
   // we inline these modules in the bundles rather than leave them as external
    return {
      'react-dom/lib/ReactPerf': resolve('./src/renderers/shared/ReactPerf.js'),
      'react-dom/lib/ReactTestUtils': resolve('./src/test/ReactTestUtils.js'),
      'react-dom/lib/ReactInstanceMap': resolve('./src/renderers/shared/shared/ReactInstanceMap.js'),
      'react-dom': resolve('./src/renderers/dom/ReactDOM.js'),
    };
}

function getFbjsModuleAliases(bundleType) {
  switch (bundleType) {
    case bundleTypes.UMD_DEV:
    case bundleTypes.UMD_PROD:
      // we want to bundle these modules, so we re-alias them to the actual
      // file so Rollup can bundle them up
      const fbjsModulesAlias = {};
      fbjsModules.forEach(fbjsModule => {
        fbjsModulesAlias[fbjsModule] = resolve(`./node_modules/${fbjsModule}`);
      });    

      return fbjsModulesAlias;
    case bundleTypes.NODE_DEV:
    case bundleTypes.NODE_PROD:
    case bundleTypes.FB:
    case bundleTypes.RN:
      // for FB we don't want to bundle the above modules, instead keep them
      // as external require() calls in the bundle
      return {};
  }
}

function replaceFbjsModuleAliases(bundleType) {
  switch (bundleType) {
    case bundleTypes.UMD_DEV:
    case bundleTypes.UMD_PROD:
    case bundleTypes.NODE_DEV:
    case bundleTypes.NODE_PROD:
    case bundleTypes.RN:
      return {};
    case bundleTypes.FB:
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
const shimReactCurrentOwner = resolve('./scripts/rollup/ReactCurrentOwnerRollupShim.js');

function getReactCurrentOwnerModuleAlias(bundleType, isRenderer) {
  if (isRenderer) {
    return {
      'ReactCurrentOwner': shimReactCurrentOwner,
      'react/lib/ReactCurrentOwner': shimReactCurrentOwner,
    };
  } else {
    return {
      'react/lib/ReactCurrentOwner': resolve('./src/isomorphic/classic/element/ReactCurrentOwner.js'),
    };
  }
}

// for renderers, we want them to require the __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner 
// on the React bundle itself rather than require module directly.
// For the React bundle, ReactCurrentOwner should be bundled as part of the bundle
// itself and exposed on __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
const shimReactCurrentOwner = resolve('./scripts/rollup/ReactCurrentOwnerRollupShim.js');

function getReactCurrentOwnerModuleAlias(bundleType, isRenderer) {
  if (isRenderer) {
    return {
      'ReactCurrentOwner': shimReactCurrentOwner,
      'react/lib/ReactCurrentOwner': shimReactCurrentOwner,
    };
  } else {
    return {
      'react/lib/ReactCurrentOwner': resolve('./src/isomorphic/classic/element/ReactCurrentOwner.js'),
    };
  }
}

module.exports = {
  createModuleMap,
  getNodeModules,
  replaceInternalModules,
  getInternalModules,
  getFbjsModuleAliases,
  replaceFbjsModuleAliases,
  ignoreFBModules,
  ignoreReactNativeModules,
  getExternalModules,
  getReactCurrentOwnerModuleAlias,
};
