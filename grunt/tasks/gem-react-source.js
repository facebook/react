'use strict';

var fs = require('fs');
var grunt = require('grunt');

var src = 'gem-react-source/';
var dest = 'build/gem-react-source/';
var build = dest + 'build/';
var buildFiles = [
  'react.js', 'react.min.js', 'JSXTransformer.js',
  'react-with-addons.js', 'react-with-addons.min.js'
];

function buildRelease() {
  grunt.file.exists(dest) && grunt.file.delete(dest);

  // Copy gem-react-source/**/* to build/gem-react-source
  var mappings = [].concat(
    grunt.file.expandMapping('**/*', dest, {cwd: src})
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
  grunt.file.mkdir(build);
  buildFiles.forEach(function(file) {
    grunt.file.copy('build/' + file, build + file);
  });
}

function packRelease() {
  /*jshint validthis:true */
  var done = this.async();
  var spawnCmd = {
    cmd: 'gem',
    args: ['build', 'react-source.gemspec'],
    opts: {
      cwd: dest
    }
  };
  grunt.util.spawn(spawnCmd, function(err, result) {
    // Gem packing does weird things to versions so 0.12.0-alpha becomes
    // 0.12.0.pre.alpha. We need to get the filename printed to stdout.
    var filename = result.stdout.match(/File: (.*)$/)[1];
    var src = 'build/gem-react-source/' + filename;
    var dest = 'build/react-source.tgz';
    fs.rename(src, dest, done);
  });
}

module.exports = {
  buildRelease: buildRelease,
  packRelease: packRelease
};
