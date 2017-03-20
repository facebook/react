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
    case bundleTypes.DEV:
    case bundleTypes.PROD:
      return {
        'object-assign': resolve('./node_modules/object-assign/index.js'),
      };
    case bundleTypes.NODE:
    case bundleTypes.FB:
    case bundleTypes.RN:
      return {};
  }
}

function ignoreFBModules() {
  return [
    // Shared mutable state.
    // We forked an implementation of this into forwarding/.
    'react/lib/ReactCurrentOwner',
    'ReactCurrentOwner',
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
  let externalModules = [];

  switch (bundleType) {
    case bundleTypes.DEV:
    case bundleTypes.PROD:
      if (isRenderer) {
        externalModules = [
          'react',
        ];
      }
      break;
    case bundleTypes.NODE:
    case bundleTypes.RN:
      externalModules = [
        'object-assign',
        'fbjs/lib/warning',
        'fbjs/lib/emptyObject',
        'fbjs/lib/emptyFunction',
        'fbjs/lib/invariant',
        'react/lib/ReactCurrentOwner',
      ];

      if (isRenderer) {
        externalModules.push(
          'react',
          'ReactCurrentOwner',
          ...fbjsModules
        );
      }
      break;
    case bundleTypes.FB:
      externalModules = [
        // note: we don't put "ReactCurrentOwner" in here
        // as we we're ignoring it from being processed
        // by rollup so it remains inline in the bundle        
        'warning',
        'emptyObject',
        'emptyFunction',
        'invariant',
      ];
      if (isRenderer) {
        const replacedFbModuleAliases = replaceFbjsModuleAliases(bundleType);
        const aliases = Object.keys(replacedFbModuleAliases).map(
          alias => replacedFbModuleAliases[alias]
        );
        externalModules.push(
          'React',
          ...aliases
        );
      }
      break;
  }
  externalModules.push(...externals);
  return externalModules;
}

function getCommonInternalModules() {
  // we tell Rollup where these files are located internally, otherwise
  // it doesn't pick them up and assumes they're external
  return {
      reactProdInvariant: resolve('./src/shared/utils/reactProdInvariant.js'),
      'ReactComponentTreeHook': resolve('./src/isomorphic/hooks/ReactComponentTreeHook.js'),
      'react/lib/checkPropTypes': resolve('./src/isomorphic/classic/types/checkPropTypes.js'),
      'react/lib/ReactDebugCurrentFrame': resolve('./src/isomorphic/classic/element/ReactDebugCurrentFrame.js'),
      'react/lib/ReactComponentTreeHook': resolve('./src/isomorphic/hooks/ReactComponentTreeHook.js'),
    };
}

function getInternalModules(bundleType) {
  switch (bundleType) {
    case bundleTypes.DEV:
    case bundleTypes.PROD:
      // for DEV and PROD UMD bundles we also need to bundle ReactCurrentOwner
      return Object.assign(getCommonInternalModules(), {
        'ReactCurrentOwner': resolve('./src/isomorphic/classic/element/ReactCurrentOwner.js'),
        'react/lib/ReactCurrentOwner': resolve('./src/isomorphic/classic/element/ReactCurrentOwner.js'),
      });
    case bundleTypes.NODE:
    case bundleTypes.FB:
      return getCommonInternalModules();
    case bundleTypes.RN:
      return {};
  }
}

function replaceInternalModules(bundleType) {
  switch (bundleType) {
    case bundleTypes.DEV:
    case bundleTypes.PROD:
    case bundleTypes.NODE:
    case bundleTypes.FB:
    case bundleTypes.RN:
      // we inline these modules in the bundles rather than leave them as external
      return {
        'react-dom/lib/ReactPerf': resolve('./src/renderers/shared/ReactPerf.js'),
        'react-dom/lib/ReactTestUtils': resolve('./src/test/ReactTestUtils.js'),
        'react-dom/lib/ReactInstanceMap': resolve('./src/renderers/shared/shared/ReactInstanceMap.js'),
        'react-dom': resolve('./src/renderers/dom/ReactDOM.js'),
      };
  }
}

function getFbjsModuleAliases(bundleType) {
  switch (bundleType) {
    case bundleTypes.DEV:
    case bundleTypes.PROD:
      // we want to bundle these modules, so we re-alias them to the actual
      // file so Rollup can bundle them up
      const fbjsModulesAlias = {};
      fbjsModules.forEach(fbjsModule => {
        fbjsModulesAlias[fbjsModule] = resolve(`./node_modules/${fbjsModule}`);
      });    

      return fbjsModulesAlias;
    case bundleTypes.NODE:
    case bundleTypes.FB:
    case bundleTypes.RN:
      // for FB we don't want to bundle the above modules, instead keep them
      // as external require() calls in the bundle
      return {};
  }
}

function replaceFbjsModuleAliases(bundleType) {
  switch (bundleType) {
    case bundleTypes.DEV:
    case bundleTypes.PROD:
    case bundleTypes.NODE:
    case bundleTypes.RN:
      return {};
    case bundleTypes.FB:
      // the diff for Haste to support fbjs/lib/* hasn't landed, so this
      // re-aliases them back to the non fbjs/lib/* versions
      // to do this, we ge the fbjsModules list of names and put them in
      // an alias object removing the fbjs/lib/ bit from the name
      const fbjsModulesAlias = {};
      fbjsModules.forEach(fbjsModule => {
        fbjsModulesAlias[fbjsModule] = fbjsModule.replace('fbjs/lib/', '');
      });

      // additionally we add mappings for "ReactCurrentOwner" and "react"
      // so they work correctly on FB
      return Object.assign(fbjsModulesAlias, {
        'react/lib/ReactCurrentOwner': 'ReactCurrentOwner',
        "'react'": "'React'",
      });
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
};
