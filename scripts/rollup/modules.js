'use strict';

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

// bundle types for shorthand
const { UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD, RN } = bundleTypes;

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

// these files need to be copied to the facebook-www build
const facebookWWWSrcDependencies = [
  'src/test/reactComponentExpect.js',
  'src/renderers/dom/shared/eventPlugins/TapEventPlugin.js',
];

const devOnlyFilesToStubOut = [
  "'ReactComponentTreeHook'",
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
    const files = sync(path, exclude);
    
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
      };
    case NODE_DEV:
    case NODE_PROD:
    case FB_DEV:
    case FB_PROD:
    case RN:
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
        externalModules.push(
          'react'
        );
      }
      break;
    case NODE_DEV:
    case NODE_PROD:
    case RN:
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
    case FB_DEV:
    case FB_PROD:
      externalModules.push(
        ...fbjsModules,
        'react/lib/ReactCurrentOwner',
        'ReactCurrentOwner'
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

function getInternalModules() {
  // we tell Rollup where these files are located internally, otherwise
  // it doesn't pick them up and assumes they're external
  return {
    reactProdInvariant: resolve('./src/shared/utils/reactProdInvariant.js'),
    'react/lib/ReactDebugCurrentFrame': resolve('./src/isomorphic/classic/element/ReactDebugCurrentFrame.js'),
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
    case RN:
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
    case RN:
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
const shimReactCurrentOwner = resolve('./scripts/rollup/shims/rollup/ReactCurrentOwnerRollupShim.js');
const realReactCurrentOwner = resolve('./src/isomorphic/classic/element/ReactCurrentOwner.js');

function getReactCurrentOwnerModuleAlias(bundleType, isRenderer) {
  if (bundleType === FB_DEV || bundleType === FB_DEV) {
    return {};
  }
  if (isRenderer) {
    return {
      'ReactCurrentOwner': shimReactCurrentOwner,
      'react/lib/ReactCurrentOwner': shimReactCurrentOwner,
    };
  } else {
    return {
      'ReactCurrentOwner': realReactCurrentOwner,
      'react/lib/ReactCurrentOwner': realReactCurrentOwner,
    };
  }
}

// this works almost identically to the ReactCurrentOwner shim above
const shimReactCheckPropTypes = resolve('./scripts/rollup/shims/rollup/ReactCheckPropTypesRollupShim.js');
const realCheckPropTypes = resolve('./src/isomorphic/classic/types/checkPropTypes.js');

function getReactCheckPropTypesModuleAlias(bundleType, isRenderer) {
  if (isRenderer) {
    return {
      'checkPropTypes': shimReactCheckPropTypes,
      'react/lib/checkPropTypes': shimReactCheckPropTypes,
    };
  } else {
    return {
      'checkPropTypes': realCheckPropTypes,
      'react/lib/checkPropTypes': realCheckPropTypes,
    };
  }
}

// this works almost identically to the ReactCurrentOwner shim above
const shimReactComponentTreeHook = resolve('./scripts/rollup/shims/rollup/ReactComponentTreeHookRollupShim.js');
const realReactComponentTreeHook = resolve('./src/isomorphic/hooks/ReactComponentTreeHook.js');

function getReactComponentTreeHookModuleAlias(bundleType, isRenderer) {
  if (isRenderer) {
    return {
      'ReactComponentTreeHook': shimReactComponentTreeHook,
      'react/lib/ReactComponentTreeHook': shimReactComponentTreeHook,
    };
  } else {
    return {
      'ReactComponentTreeHook': realReactComponentTreeHook,
      'react/lib/ReactComponentTreeHook': realReactComponentTreeHook,
    };
  }
}

const devOnlyModuleStub = `'${resolve('./scripts/rollup/shims/rollup/DevOnlyStubShim.js')}'`;

function replaceDevOnlyStubbedModules(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case NODE_DEV:
    case FB_DEV:
    case RN:
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
  getReactCheckPropTypesModuleAlias,
  getReactComponentTreeHookModuleAlias,
  facebookWWWSrcDependencies,
  replaceDevOnlyStubbedModules,
};
