/*eslint-disable no-multi-str */

'use strict';

var envify = require('envify/custom');
var es3ify = require('es3ify');
var grunt = require('grunt');
var UglifyJS = require('uglify-js');
var uglifyify = require('uglifyify');
var derequire = require('derequire');
var collapser = require('bundle-collapser/plugin');

var SIMPLE_TEMPLATE =
'/**\n\
 * @PACKAGE@ v@VERSION@\n\
 */';

var LICENSE_TEMPLATE =
'/**\n\
 * @PACKAGE@ v@VERSION@\n\
 *\n\
 * Copyright 2013-2015, Facebook, Inc.\n\
 * All rights reserved.\n\
 *\n\
 * This source code is licensed under the BSD-style license found in the\n\
 * LICENSE file in the root directory of this source tree. An additional grant\n\
 * of patent rights can be found in the PATENTS file in the same directory.\n\
 *\n\
 */';

function minify(src) {
  return UglifyJS.minify(src, {fromString: true}).code;
}

// TODO: move this out to another build step maybe.
function bannerify(src) {
  var version = grunt.config.data.pkg.version;
  var packageName = this.data.packageName || this.data.standalone;
  return LICENSE_TEMPLATE.replace('@PACKAGE@', packageName)
                         .replace('@VERSION@', version) +
         '\n' + src;
}

function simpleBannerify(src) {
  var version = grunt.config.data.pkg.version;
  var packageName = this.data.packageName || this.data.standalone;
  return SIMPLE_TEMPLATE.replace('@PACKAGE@', packageName)
                        .replace('@VERSION@', version) +
         '\n' + src;
}

// Our basic config which we'll add to to make our other builds
var basic = {
  entries: [
    './build/modules/React.js'
  ],
  outfile: './build/react.js',
  debug: false,
  standalone: 'React',
  transforms: [envify({NODE_ENV: 'development'})],
  plugins: [collapser],
  after: [es3ify.transform, derequire, simpleBannerify]
};

var min = {
  entries: [
    './build/modules/React.js'
  ],
  outfile: './build/react.min.js',
  debug: false,
  standalone: 'React',
  transforms: [envify({NODE_ENV: 'production'}), uglifyify],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [es3ify.transform, /*derequire,*/ minify, bannerify]
};

var transformer = {
  entries:[
    './vendor/browser-transforms.js'
  ],
  outfile: './build/JSXTransformer.js',
  debug: false,
  standalone: 'JSXTransformer',
  transforms: [],
  // Source-map-generator uses amdefine, which looks at the type of __dereq__.
  // If it's not a string, it assumes something else (array of strings), but
  // collapser passes a number; this would throw.

  // plugins: [collapser],
  after: [es3ify.transform, derequire, simpleBannerify]
};

var addons = {
  entries: [
    './build/modules/ReactWithAddons.js'
  ],
  outfile: './build/react-with-addons.js',
  debug: false,
  standalone: 'React',
  packageName: 'React (with addons)',
  transforms: [envify({NODE_ENV: 'development'})],
  plugins: [collapser],
  after: [es3ify.transform, derequire, simpleBannerify]
};

var addonsMin = {
  entries: [
    './build/modules/ReactWithAddons.js'
  ],
  outfile: './build/react-with-addons.min.js',
  debug: false,
  standalone: 'React',
  packageName: 'React (with addons)',
  transforms: [envify({NODE_ENV: 'production'}), uglifyify],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [es3ify.transform, /*derequire,*/ minify, bannerify]
};

var withCodeCoverageLogging = {
  entries: [
    './build/modules/React.js'
  ],
  outfile: './build/react.js',
  debug: true,
  standalone: 'React',
  transforms: [
    envify({NODE_ENV: 'development'}),
    require('coverify')
  ],
  plugins: [collapser]
};

module.exports = {
  basic: basic,
  min: min,
  transformer: transformer,
  addons: addons,
  addonsMin: addonsMin,
  withCodeCoverageLogging: withCodeCoverageLogging
};
