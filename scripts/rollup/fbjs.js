"use strict";

const { resolve } = require('path');

function getFbjsModuleAliases() {
  return {
    'fbjs/lib/warning': resolve('./node_modules/fbjs/lib/warning.js'),
    'fbjs/lib/invariant': resolve('./node_modules/fbjs/lib/invariant.js'),
    'fbjs/lib/emptyFunction': resolve('./node_modules/fbjs/lib/emptyFunction.js'),
    'fbjs/lib/emptyObject': resolve('./node_modules/fbjs/lib/emptyObject.js'),
    'fbjs/lib/hyphenateStyleName': resolve('./node_modules/fbjs/lib/hyphenateStyleName.js'),
    'fbjs/lib/getUnboundedScrollPosition': resolve('./node_modules/fbjs/lib/getUnboundedScrollPosition.js'),
    'fbjs/lib/camelizeStyleName': resolve('./node_modules/fbjs/lib/camelizeStyleName.js'),
    'fbjs/lib/containsNode': resolve('./node_modules/fbjs/lib/containsNode.js'),
    'fbjs/lib/shallowEqual': resolve('./node_modules/fbjs/lib/shallowEqual.js'),
    'fbjs/lib/getActiveElement': resolve('./node_modules/fbjs/lib/getActiveElement.js'),
    'fbjs/lib/focusNode': resolve('./node_modules/fbjs/lib/focusNode.js'),
    'fbjs/lib/EventListener': resolve('./node_modules/fbjs/lib/EventListener.js'),
    'fbjs/lib/memoizeStringOnly': resolve('./node_modules/fbjs/lib/memoizeStringOnly.js'),
    'fbjs/lib/ExecutionEnvironment': resolve('./node_modules/fbjs/lib/ExecutionEnvironment.js'),
    'fbjs/lib/createNodesFromMarkup': resolve('./node_modules/fbjs/lib/createNodesFromMarkup.js'),
    'fbjs/lib/performanceNow': resolve('./node_modules/fbjs/lib/performanceNow.js'),
  };
}

module.exports = {
  getFbjsModuleAliases,
};
