'use strict';
/*eslint-disable no-undef*/
var visitors = require('./vendor/fbtransform/visitors');
var transform = require('jstransform').transform;
var typesSyntax = require('jstransform/visitors/type-syntax');
var Buffer = require('buffer').Buffer;

module.exports = {
  transform: function(input, options) {
    options = processOptions(options);
    var output = innerTransform(input, options);
    var result = output.code;
    if (options.sourceMap) {
      var map = inlineSourceMap(
        output.sourceMap,
        input,
        options.filename
      );
      result += '\n' + map;
    }
    return result;
  },
  transformWithDetails: function(input, options) {
    options = processOptions(options);
    var output = innerTransform(input, options);
    var result = {};
    result.code = output.code;
    if (options.sourceMap) {
      result.sourceMap = output.sourceMap.toJSON();
    }
    if (options.filename) {
      result.sourceMap.sources = [options.filename];
    }
    return result;
  }
};

/**
 * Only copy the values that we need. We'll do some preprocessing to account for
 * converting command line flags to options that jstransform can actually use.
 */
function processOptions(opts) {
  opts = opts || {};
  var options = {};

  options.harmony = opts.harmony;
  options.stripTypes = opts.stripTypes;
  options.sourceMap = opts.sourceMap;
  options.filename = opts.sourceFilename;

  if (opts.es6module) {
    options.sourceType = 'module';
  }
  if (opts.nonStrictEs6Module) {
    options.sourceType = 'nonStrict6Module';
  }

  return options;
}

function innerTransform(input, options) {
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
  return transform(visitorList, input, options);
}

function inlineSourceMap(sourceMap, sourceCode, sourceFilename) {
  var json = sourceMap.toJSON();
  json.sources = [sourceFilename];
  json.sourcesContent = [sourceCode];
  var base64 = Buffer(JSON.stringify(json)).toString('base64');
  return '//# sourceMappingURL=data:application/json;base64,' +
         base64;
}
