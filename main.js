'use strict';

var React = require('./build/modules/React');
var visitors = require('./vendor/fbtransform/visitors').transformVisitors;
var transform = require('jstransform').transform;

module.exports = {
  React: React,
  transform: function(code) {
    return transform(visitors.react, code).code;
  }
};
