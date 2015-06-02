'use strict';

var fs = require('fs');
var grunt = require('grunt');

var src = 'npm-react-tools';
var srcSrc = 'src/**/*.js';
var dest = 'build/npm-react-tools/';

function buildRelease() {
  if (grunt.file.exists(dest)) {
    grunt.file.delete(dest);
  }

  // copy all files from src first, includes custom README
  var mappings = grunt.file.expandMapping('**/*', dest, {cwd: src});

  // Also copy all files from src/ (for react-native)
  mappings = mappings.concat(
    grunt.file.expandMapping(srcSrc, dest)
  );

  mappings.forEach(function(mapping) {
    var mappingSrc = mapping.src[0];
    var mappingDest = mapping.dest;
    if (grunt.file.isDir(mappingSrc)) {
      grunt.file.mkdir(mappingDest);
    } else {
      grunt.file.copy(mappingSrc, mappingDest);
    }
  });
}

function packRelease() {
  var done = this.async();
  var spawnCmd = {
    cmd: 'npm',
    args: ['pack', 'npm-react-tools'],
    opts: {
      cwd: 'build/',
    },
  };
  grunt.util.spawn(spawnCmd, function() {
    var buildSrc = 'build/react-tools-' + grunt.config.data.pkg.version + '.tgz';
    var buildDest = 'build/react-tools.tgz';
    fs.rename(buildSrc, buildDest, done);
  });
}

module.exports = {
  buildRelease: buildRelease,
  packRelease: packRelease,
};
