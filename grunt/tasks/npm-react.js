'use strict';

var fs = require('fs');
var grunt = require('grunt');

var src = 'npm-react/';
var dest = 'build/npm-react/';
var modSrc = 'build/modules/';
var lib = dest + 'lib/';
var dist = dest + 'dist/';
var distFiles = [
  'react.js', 'react.min.js', 'JSXTransformer.js',
  'react-with-addons.js', 'react-with-addons.min.js'
];

function buildRelease() {
  // delete build/react-core for fresh start
  grunt.file.exists(dest) && grunt.file.delete(dest);

  // mkdir -p build/react-core/lib
  grunt.file.mkdir(lib);

  // Copy npm-react/**/* to build/npm-react
  // and build/modules/**/* to build/react-core/lib
  var mappings = [].concat(
    grunt.file.expandMapping('**/*', dest, {cwd: src}),
    grunt.file.expandMapping('**/*', lib, {cwd: modSrc})
  );
  mappings.forEach(function(mapping) {
    var src = mapping.src[0];
    var dest = mapping.dest;
    if (grunt.file.isDir(src)) {
      grunt.file.mkdir(dest);
    } else {
      grunt.file.copy(src, dest);
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
  /*jshint validthis:true */
  var done = this.async();
  var spawnCmd = {
    cmd: 'npm',
    args: ['pack', 'npm-react'],
    opts: {
      cwd: 'build/'
    }
  };
  grunt.util.spawn(spawnCmd, function() {
    var src = 'build/react-' + grunt.config.data.pkg.version + '.tgz';
    var dest = 'build/react.tgz';
    fs.rename(src, dest, done);
  });
}

module.exports = {
  buildRelease: buildRelease,
  packRelease: packRelease
};
