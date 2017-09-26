'use strict';

var fs = require('fs');
var grunt = require('grunt');

var src = 'packages/react-dom/';
var dest = 'build/packages/react-dom/';
var modSrc = 'build/node_modules/react-dom/lib';
var lib = dest + 'lib/';
var dist = dest + 'dist/';
var distFiles = [
  'react-dom.js',
  'react-dom.min.js',
  'react-dom-server.js',
  'react-dom-server.min.js',
];

function buildRelease() {
  if (grunt.file.exists(dest)) {
    grunt.file.delete(dest);
  }

  // Copy to build/packages/react-dom
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
}

function packRelease() {
  var done = this.async();
  var spawnCmd = {
    cmd: 'npm',
    args: ['pack', 'react-dom'],
    opts: {
      cwd: 'build/packages/',
    },
  };
  grunt.util.spawn(spawnCmd, function() {
    fs.rename(
      'build/packages/react-dom-' + grunt.config.data.pkg.version + '.tgz',
      'build/packages/react-dom.tgz',
      done
    );
  });
}

module.exports = {
  buildRelease: buildRelease,
  packRelease: packRelease,
};
