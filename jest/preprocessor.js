"use strict";

var ReactTools = require('../main.js');

var coffee = require('coffee-script');

module.exports = {
  process: function(src, path) {
    if (path.match(/\.coffee$/)) {
      return coffee.compile(src, {'bare': true});
    }
    return ReactTools.transform(src, {harmony: true});
  }
};
