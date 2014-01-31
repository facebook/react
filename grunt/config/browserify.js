/* jshint multistr:true */
/* jshint -W040 */

'use strict';

var deamdify = require('deamdify');
var envify = require('envify/custom');
var grunt = require('grunt');
var UglifyJS = require('uglify-js');
var uglifyify = require('uglifyify');
var _ = require('lodash');

var SIMPLE_TEMPLATE =
'/**\n\
 * @PACKAGE@ v@VERSION@\n\
 */';

var LICENSE_TEMPLATE =
'/**\n\
 * @PACKAGE@ v@VERSION@\n\
 *\n\
 * Copyright 2013 Facebook, Inc.\n\
 *\n\
 * Licensed under the Apache License, Version 2.0 (the "License");\n\
 * you may not use this file except in compliance with the License.\n\
 * You may obtain a copy of the License at\n\
 *\n\
 * http://www.apache.org/licenses/LICENSE-2.0\n\
 *\n\
 * Unless required by applicable law or agreed to in writing, software\n\
 * distributed under the License is distributed on an "AS IS" BASIS,\n\
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n\
 * See the License for the specific language governing permissions and\n\
 * limitations under the License.\n\
 */';

function minify(src) {
  return UglifyJS.minify(src, { fromString: true }).code;
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
  after: [simpleBannerify]
};

var min = _.merge({}, basic, {
  outfile: './build/react.min.js',
  debug: false,
  transforms: [envify({NODE_ENV: 'production'}), uglifyify],
  after: [minify, bannerify]
});

var transformer = {
  entries:[
    './vendor/browser-transforms.js'
  ],
  outfile: './build/JSXTransformer.js',
  debug: false,
  standalone: 'JSXTransformer',
  transforms: [deamdify],
  after: [simpleBannerify]
};

var addons = {
  entries: [
    './build/modules/ReactWithAddons.js'
  ],
  outfile: './build/react-with-addons.js',
  debug: false,
  standalone: 'React',
  transforms: [envify({NODE_ENV: 'development'})],
  packageName: 'React (with addons)',
  after: [simpleBannerify]
};

var addonsMin = _.merge({}, addons, {
  outfile: './build/react-with-addons.min.js',
  debug: false,
  transforms: [envify({NODE_ENV: 'production'}), uglifyify],
  after: [minify, bannerify]
});

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
  ]
};

module.exports = {
  basic: basic,
  min: min,
  transformer: transformer,
  addons: addons,
  addonsMin: addonsMin,
  withCodeCoverageLogging: withCodeCoverageLogging
};
