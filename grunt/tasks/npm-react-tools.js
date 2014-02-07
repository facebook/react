'use strict';

var fs = require('fs');
var grunt = require('grunt');

function pack() {
  var done = this.async();
  var spawnCmd = {
    cmd: 'npm',
    args: ['pack']
  };
  grunt.util.spawn(spawnCmd, function() {
    var src = 'react-tools-' + grunt.config.data.pkg.version + '.tgz';
    var dest = 'build/react-tools.tgz';
    fs.rename(src, dest, done);
  });
}

module.exports = {
  pack: pack
};
