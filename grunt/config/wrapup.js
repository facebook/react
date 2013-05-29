'use strict';

var grunt = require('grunt');
var UglifyJS = require('uglify-js');

function minify(src) {
  return UglifyJS.minify(src, { fromString: true }).code;
}

// Our basic config which we'll add to to make our other builds
var basic = {
  outfile: './build/react-global.js',
  requires: {
    React: './build/modules/React.js'
  },
  debug: true
};

module.exports = {
  basic: basic
};

// Create minified versions of each build
for (var buildName in module.exports) {
  var build = module.exports[buildName];
  module.exports[buildName + '-min'] = grunt.util._.merge({}, build, {
    outfile: build.outfile.replace('.js', '.min.js'),
    debug: false,
    after: minify
  });
}
