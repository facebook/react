'use strict';

var grunt = require('grunt');

var src = 'npm-react-core/';
var dest = 'build/react-core/';
var modSrc = 'build/modules/';
var lib = dest + 'lib/';

function buildRelease() {
  // delete build/react-core for fresh start
  grunt.file.exists(dest) && grunt.file.delete(dest);

  // mkdir -p build/react-core/lib
  grunt.file.mkdir(lib);

  // Copy everything over
  // console.log(grunt.file.expandMapping(src + '**/*', dest, {flatten: true}));
  grunt.file.expandMapping(src + '**/*', dest, {flatten: true}).forEach(function(mapping) {
    var src = mapping.src[0];
    var dest = mapping.dest;
    if (grunt.file.isDir(src)) {
      grunt.file.mkdir(dest);
    } else {
      grunt.file.copy(src, dest);
    }
  });

  // copy build/modules/*.js to build/react-core/lib
  grunt.file.expandMapping(modSrc + '*.js', lib, { flatten: true }).forEach(function(mapping) {
    grunt.file.copy(mapping.src[0], mapping.dest);
  });

  // modify build/react-core/package.json to set version ##
  var pkg = grunt.file.readJSON(dest + 'package.json');
  pkg.version = grunt.config.data.pkg.version;
  grunt.file.write(dest + 'package.json', JSON.stringify(pkg, null, 2));
}

function buildDev() {
  // TODO: same as above except different destination
}

module.exports = {
  buildRelease: buildRelease,
  buildDev: buildDev
};
