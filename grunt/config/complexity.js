"use strict";
var grunt = require('grunt');

module.exports.generic = {
  src: grunt.file.expand({
    filter: function(path){
      return !(/__\w+__|\btest\b/).test(path);
    }
  }, ['./build/modules/**/*.js']),
  options: {
    errorsOnly: false, // show only maintainability errors
    cyclomatic: 3,
    halstead: 8,
    maintainability: 100
  }
};
