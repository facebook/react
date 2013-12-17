'use strict';

var grunt = require('grunt');

module.exports = require('./webdriver-all')({
  url: "http://127.0.0.1:9999/test/index.html",
  onComplete: function(passed){
    if (!passed){
      grunt.fatal("tests failed");
    }
  },
  onError: function(error){
    grunt.fatal(error);
  }
});
