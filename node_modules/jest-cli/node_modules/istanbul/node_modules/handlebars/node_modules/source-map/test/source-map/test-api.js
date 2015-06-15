/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2012 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var sourceMap;
  try {
    sourceMap = require('../../lib/source-map');
  } catch (e) {
    sourceMap = {};
    Components.utils.import('resource:///modules/devtools/SourceMap.jsm', sourceMap);
  }

  exports['test that the api is properly exposed in the top level'] = function (assert, util) {
    assert.equal(typeof sourceMap.SourceMapGenerator, "function");
    assert.equal(typeof sourceMap.SourceMapConsumer, "function");
    assert.equal(typeof sourceMap.SourceNode, "function");
  };

});
