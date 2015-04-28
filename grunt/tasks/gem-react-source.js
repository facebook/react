'use strict';

var fs = require('fs');
var grunt = require('grunt');

var src = 'gem-react-source/';
var dest = 'build/gem-react-source/';
var build = dest + 'build/';
var buildFiles = [
  ['react.js', 'development/', 'react.js'],
  ['react-with-addons.js', 'development-with-addons/', 'react.js'],
  ['react.min.js', 'production/', 'react.js'],
  ['react-with-addons.min.js', 'production-with-addons/', 'react.js'],
  ['JSXTransformer.js', '', 'JSXTransformer.js']
];

function buildRelease() {
  if (grunt.file.exists(dest)) {
    grunt.file.delete(dest);
  }

  // Copy gem-react-source/**/* to build/gem-react-source
  var mappings = [].concat(
    grunt.file.expandMapping('**/*', dest, {cwd: src})
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
  buildFiles.forEach(function(file) {
    var source = file[0];
    var destDir = build + file[1];
    var destPath = destDir + file[2];
    grunt.file.mkdir(destDir);
    grunt.file.copy('build/' + source, destPath);
  });
}

function packRelease() {
  var done = this.async();
  var spawnCmd = {
    cmd: 'gem',
    args: ['build', 'react-source.gemspec'],
    opts: {
      cwd: dest
    }
  };
  grunt.util.spawn(spawnCmd, function(err, result) {
    if (err) {
      grunt.log.error(err);
    }
    // Gem packing does weird things to versions so 0.12.0-alpha becomes
    // 0.12.0.pre.alpha. We need to get the filename printed to stdout.
    var filename = result.stdout.match(/File: (.*)$/)[1];
    var buildSrc = 'build/gem-react-source/' + filename;
    var buildDest = 'build/react-source.tgz';
    fs.rename(buildSrc, buildDest, done);
  });
}

module.exports = {
  buildRelease: buildRelease,
  packRelease: packRelease
};
