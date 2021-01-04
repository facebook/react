'use strict';

var visitors = require('./vendor/fbtransform/visitors');
var transform = require('jstransform').transform;

module.exports = {
  transform: function(code, options) {
    var visitorList;
    if (options && options.harmony) {
      visitorList = visitors.getAllVisitors();
    } else {
      visitorList = visitors.transformVisitors.react;
    }
    return transform(visitorList, code).code;
  }
};
