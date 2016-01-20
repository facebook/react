/*eslint-disable no-multi-str */

'use strict';

var envify = require('envify/custom');
var grunt = require('grunt');
var UglifyJS = require('uglify-js');
var uglifyify = require('uglifyify');
var derequire = require('derequire');
var collapser = require('bundle-collapser/plugin');

var envifyDev = envify({NODE_ENV: process.env.NODE_ENV || 'development'});
var envifyProd = envify({NODE_ENV: process.env.NODE_ENV || 'production'});

var SIMPLE_TEMPLATE =
  grunt.file.read('./grunt/data/header-template-short.txt');

var LICENSE_TEMPLATE =
  grunt.file.read('./grunt/data/header-template-extended.txt');

function minify(src) {
  return UglifyJS.minify(src, {fromString: true}).code;
}

// TODO: move this out to another build step maybe.
function bannerify(src) {
  var version = grunt.config.data.pkg.version;
  var packageName = this.data.packageName || this.data.standalone;
  return (
    grunt.template.process(
      LICENSE_TEMPLATE,
      {data: {package: packageName, version: version}}
    ) +
    src
  );
}

function simpleBannerify(src) {
  var version = grunt.config.data.pkg.version;
  var packageName = this.data.packageName || this.data.standalone;
  return (
    grunt.template.process(
      SIMPLE_TEMPLATE,
      {data: {package: packageName, version: version}}
    ) +
    src
  );
}

// Our basic config which we'll add to to make our other builds
var basic = {
  entries: [
    './build/modules/React.js',
  ],
  outfile: './build/react.js',
  debug: false,
  standalone: 'React',
  // Apply as global transform so that we also envify fbjs and any other deps
  globalTransforms: [envifyDev],
  plugins: [collapser],
  after: [derequire, simpleBannerify],
};

var min = {
  entries: [
    './build/modules/React.js',
  ],
  outfile: './build/react.min.js',
  debug: false,
  standalone: 'React',
  // Envify twice. The first ensures that when we uglifyify, we have the right
  // conditions to exclude requires. The global transform runs on deps.
  transforms: [envifyProd, uglifyify],
  globalTransforms: [envifyProd],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [minify, bannerify],
};

var addons = {
  entries: [
    './build/modules/ReactWithAddons.js',
  ],
  outfile: './build/react-with-addons.js',
  debug: false,
  standalone: 'React',
  packageName: 'React (with addons)',
  globalTransforms: [envifyDev],
  plugins: [collapser],
  after: [derequire, simpleBannerify],
};

var addonsMin = {
  entries: [
    './build/modules/ReactWithAddons.js',
  ],
  outfile: './build/react-with-addons.min.js',
  debug: false,
  standalone: 'React',
  packageName: 'React (with addons)',
  transforms: [envifyProd, uglifyify],
  globalTransforms: [envifyProd],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [minify, bannerify],
};

module.exports = {
  basic: basic,
  min: min,
  addons: addons,
  addonsMin: addonsMin,
};
