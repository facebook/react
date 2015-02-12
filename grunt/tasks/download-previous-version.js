'use strict';

var grunt = require('grunt');
var http = require('http');
var fs = require('fs');
var path = require('path');

function get(url, targetFilePath, completedSuccessfully) {
  grunt.verbose.writeln('getting url \'' + url + '\'');
  http.get(url, function(response) {
    grunt.verbose.writeln('Received status code ' + response.statusCode + ' for \'' + url + '\'');

    if (response.statusCode !== 200) {
      if (response.headers.location) {
        get(response.headers.location, targetFilePath);
        return;
      } else {
        grunt.fatal('Nothing else to do.');
        completedSuccessfully(false);
        return;
      }
    }
    grunt.verbose.writeln('Writing url to \'' + targetFilePath + '\'');
    response.pipe(fs.createWriteStream(targetFilePath))
      .on('close', function() {
        completedSuccessfully(true);
      });
  });
}

module.exports = function() {
  var completedSuccessfully = this.async();
  get(
    'http://react.zpao.com/builds/master/latest/react.min.js',
    path.join(__dirname, '/../../build/react-previous.min.js'),
    function(success) {
      if (!success) {
        return completedSuccessfully(success);
      }
      get(
        'http://react.zpao.com/builds/master/latest/JSXTransformer.js',
        path.join(__dirname, '/../../build/JSXTransformer-previous.js'),
        completedSuccessfully
      );
    }
  );
};
