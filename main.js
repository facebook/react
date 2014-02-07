'use strict';

var visitors = require('./vendor/fbtransform/visitors').transformVisitors;
var transform = require('jstransform').transform;

module.exports = {
  transform: function(code) {
    return transform(visitors.react, code).code;
  }
};
