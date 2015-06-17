'use strict';

var fs = require('fs');
var grunt = require('grunt');

function packRelease() {
  var done = this.async();
  var spawnCmd = {
    cmd: 'npm',
    args: ['pack', 'packages/react-dom'],
  };
  grunt.util.spawn(spawnCmd, function() {
    var buildSrc = 'react-dom-' + grunt.config.data.pkg.version + '.tgz';
    var buildDest = 'build/packages/react-dom.tgz';
    fs.rename(buildSrc, buildDest, done);
  });
}

module.exports = {
  packRelease: packRelease,
};
