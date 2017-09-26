'use strict';

var fs = require('fs');
var grunt = require('grunt');

var src = 'packages/react/';
var dest = 'build/packages/react/';
var modSrc = 'build/node_modules/react/lib';
var lib = dest + 'lib/';
var dist = dest + 'dist/';
var distFiles = [
  'react.js',
  'react.min.js',
  'react-with-addons.js',
  'react-with-addons.min.js',
];

function buildRelease() {
  // delete build/react-core for fresh start
  if (grunt.file.exists(dest)) {
    grunt.file.delete(dest);
  }

  // mkdir -p build/react-core/lib
  grunt.file.mkdir(lib);

  // Copy npm-react/**/* to build/npm-react
  // and build/modules/**/* to build/react-core/lib
  var mappings = [].concat(
    grunt.file.expandMapping('**/*', dest, {cwd: src}),
    grunt.file.expandMapping('**/*', lib, {cwd: modSrc}),
    grunt.file.expandMapping('LICENSE', dest)
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

  // Make built source available inside npm package
  grunt.file.mkdir(dist);
  distFiles.forEach(function(file) {
    grunt.file.copy('build/' + file, dist + file);
  });

  // modify build/react-core/package.json to set version ##
  var pkg = grunt.file.readJSON(dest + 'package.json');
  pkg.version = grunt.config.data.pkg.version;
  grunt.file.write(dest + 'package.json', JSON.stringify(pkg, null, 2));
}

function packRelease() {
  var done = this.async();
  var spawnCmd = {
    cmd: 'npm',
    args: ['pack', 'packages/react'],
    opts: {
      cwd: 'build/',
    },
  };
  grunt.util.spawn(spawnCmd, function() {
    var buildSrc = 'build/react-' + grunt.config.data.pkg.version + '.tgz';
    var buildDest = 'build/packages/react.tgz';
    fs.rename(buildSrc, buildDest, done);
  });
}

module.exports = {
  buildRelease: buildRelease,
  packRelease: packRelease,
};
