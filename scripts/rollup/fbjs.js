"use strict";

const { resolve } = require('path');

function getFbjsModuleAliases() {
  return {
    hyphenateStyleName: resolve('./node_modules/fbjs/lib/hyphenateStyleName.js'),
    getUnboundedScrollPosition: resolve('./node_modules/fbjs/lib/getUnboundedScrollPosition.js'),
    emptyFunction: resolve('./node_modules/fbjs/lib/emptyFunction.js'),
    emptyObject: resolve('./node_modules/fbjs/lib/emptyObject.js'),
    camelizeStyleName: resolve('./node_modules/fbjs/lib/camelizeStyleName.js'),
    containsNode: resolve('./node_modules/fbjs/lib/containsNode.js'),
    shallowEqual: resolve('./node_modules/fbjs/lib/shallowEqual.js'),
    getActiveElement: resolve('./node_modules/fbjs/lib/getActiveElement.js'),
    focusNode: resolve('./node_modules/fbjs/lib/focusNode.js'),
    EventListener: resolve('./node_modules/fbjs/lib/EventListener.js'),
    memoizeStringOnly: resolve('./node_modules/fbjs/lib/memoizeStringOnly.js'),
    ExecutionEnvironment: resolve('./node_modules/fbjs/lib/ExecutionEnvironment.js'),
    warning: resolve('./node_modules/fbjs/lib/warning.js'),
    reactProdInvariant: resolve('./src/shared/utils/reactProdInvariant.js'),
    invariant: resolve('./test/stub.js'),
  };
}

module.exports = {
  getFbjsModuleAliases,
};
