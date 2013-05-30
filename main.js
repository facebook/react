'use strict';

var React = require('./build/react');
var visitors = require('./vendor/fbtransform/visitors').transformVisitors;
var transform = require('./vendor/fbtransform/lib/transform').transform;

module.exports = {
  React: React,
  transform: function(code) {
    return transform(visitors.react, code).code;
  }
};
