'use strict';

var visitors = require('./vendor/fbtransform/visitors');
var transform = require('jstransform').transform;
var Buffer = require('buffer').Buffer;

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
    visitorSets.push('type-annotations');
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
