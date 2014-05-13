"use strict";

var ReactTools = require('../main.js');

module.exports = {
  process: function(src) {
    return ReactTools.transform(src, {harmony: true});
  }
};
