'use strict';

var grunt = require('grunt');

var tests = grunt.file.expand(__dirname + '/../../perf/tests/*');

var maxTime = 5;

var reactVersions = [
  'edge',
  'previous'
];

var params = []
  .concat('headless=false')
  .concat('maxTime=' + maxTime)
  .concat(tests
    .map(function(path){ return path.split(/tests./i).reverse()[0]; })
    .map(encodeURIComponent)
    .map(function(filename){ return 'test=' + filename; })
  )
  .concat(reactVersions
    .map(encodeURIComponent)
    .map(function(version){ return 'react=' + version; }
  )
);

module.exports = require('./webdriver-all')({

  url: "http://127.0.0.1:9999/perf/index.html?" + params.join('&'),

  isDoneTimeout: 15 * 60 * 1000,

  onStart: function(){
    grunt.event.on('perf results', function(results){
      console.log(results);
    });
  },

  onComplete: function(completedTestKeys){
    grunt.verbose.writeln('onComplete ' + JSON.stringify(completedTestKeys));
  },

  onError: function(error){
    grunt.fatal(error);
  }

});
