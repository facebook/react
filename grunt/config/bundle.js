/* jshint multistr:true */
/* jshint -W040 */

'use strict';

var deamdify = require('deamdify');
var envify = require('envify/custom');
var es3ify = require('es3ify');
var grunt = require('grunt');
var UglifyJS = require('uglify-js');
var _ = require('lodash');

var SIMPLE_TEMPLATE =
'/**\n\
 * @PACKAGE@ v@VERSION@\n\
 */';

var LICENSE_TEMPLATE =
'/**\n\
 * @PACKAGE@ v@VERSION@\n\
 *\n\
 * Copyright 2013-2014 Facebook, Inc.\n\
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

function override(obj1, obj2) {
  return _.merge({}, obj1, obj2, function (a, b) {
    if (_.isArray(a)) {
      return b;
    }
  })
}

var basic = {
  src: './build/modules/React.js',
  dest: './build/react.js',
  options: {
    debug: false,
    standalone: 'React',
    transforms: [envify({NODE_ENV: 'development'})],
    after: [es3ify.transform, simpleBannerify]
  }
};

var min = override(basic, {
  dest: './build/react.min.js',
  options: {
    debug: false,
    transforms: [envify({NODE_ENV: 'production'})],
    after: [minify, bannerify]
  }
});

var transformer = {
  src: './vendor/browser-transforms.js',
  dest: './build/JSXTransformer.js',
  options: {
    debug: false,
    standalone: 'JSXTransformer',
    transforms: [deamdify],
    after: [es3ify.transform, simpleBannerify]
  }
};

var addons = {
  src: './build/modules/ReactWithAddons.js',
  dest: './build/react-with-addons.js',
  options: {
    debug: false,
    standalone: 'React',
    transforms: [envify({NODE_ENV: 'development'})],
    packageName: 'React (with addons)',
    after: [es3ify.transform, simpleBannerify]
  }
};

var addonsMin = override(addons, {
  dest: './build/react-with-addons.min.js',
  options: {
    debug: false,
    transforms: [envify({NODE_ENV: 'production'})],
    after: [minify, bannerify]
  }
});

var withCodeCoverageLogging = override(basic, {
  options: {
    debug: true,
    transforms: [
      envify({NODE_ENV: 'development'}),
      require('coverify')
    ],
    after: []
  }
});

module.exports = {
  basic: basic,
  min: min,
  transformer: transformer,
  addons: addons,
  addonsMin: addonsMin,
  withCodeCoverageLogging: withCodeCoverageLogging
};
