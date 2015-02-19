/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';
/*eslint-disable no-undef*/
var visitors = require('./vendor/fbtransform/visitors');
var transform = require('jstransform').transform;
var typesSyntax = require('jstransform/visitors/type-syntax');
var inlineSourceMap = require('./vendor/inline-source-map');

module.exports = {
  transform: function(input, options) {
    var output = innerTransform(input, options);
    var result = output.code;
    if (options && options.sourceMap) {
      var map = inlineSourceMap(
        output.sourceMap,
        input,
        options.sourceFilename
      );
      result += '\n' + map;
    }
    return result;
  },
  transformWithDetails: function(input, options) {
    var output = innerTransform(input, options);
    var result = {};
    result.code = output.code;
    if (options && options.sourceMap) {
      result.sourceMap = output.sourceMap.toJSON();
    }
    if (options && options.sourceFilename) {
      result.sourceMap.sources = [options.sourceFilename];
    }
    return result;
  }
};

function innerTransform(input, options) {
  options = options || {};

  var visitorSets = ['react'];
  if (options.harmony) {
    visitorSets.push('harmony');
  }
  if (options.stripTypes) {
    // Stripping types needs to happen before the other transforms
    // unfortunately, due to bad interactions. For example,
    // es6-rest-param-visitors conflict with stripping rest param type
    // annotation
    input = transform(typesSyntax.visitorList, input, options).code;
  }

  var visitorList = visitors.getVisitorsBySet(visitorSets);
  if (options.sourceFilename) {
    options.filename = options.sourceFilename;
  }
  return transform(visitorList, input, options);
}
