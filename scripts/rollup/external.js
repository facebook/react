"use strict";

const { resolve } = require('path');

function getExternalModules() {
  return {
    reactProdInvariant: resolve('./src/shared/utils/reactProdInvariant.js'),
    'object-assign': resolve('./node_modules/object-assign/index.js'),
    'ReactCurrentOwner': resolve('./src/isomorphic/classic/element/ReactCurrentOwner.js'),
    'ReactComponentTreeHook': resolve('./src/isomorphic/hooks/ReactComponentTreeHook.js'),
    'react/lib/ReactCurrentOwner': resolve('./src/isomorphic/classic/element/ReactCurrentOwner.js'),
    'react/lib/checkPropTypes': resolve('./src/isomorphic/classic/types/checkPropTypes.js'),
    'react/lib/ReactDebugCurrentFrame': resolve('./src/isomorphic/classic/element/ReactDebugCurrentFrame.js'),
    'react/lib/ReactComponentTreeHook': resolve('./src/isomorphic/hooks/ReactComponentTreeHook.js'),
  };
}

function replaceExternalModules() {
  return {
    'react-dom/lib/ReactPerf': resolve('./src/renderers/shared/ReactPerf.js'),
    'react-dom/lib/ReactTestUtils': resolve('./src/test/ReactTestUtils.js'),
    'react-dom/lib/ReactInstanceMap': resolve('./src/renderers/shared/shared/ReactInstanceMap.js'),
    'react-dom': resolve('./src/renderers/dom/ReactDOM.js'),
  };
}

module.exports = {
  getExternalModules,
  replaceExternalModules,
};
