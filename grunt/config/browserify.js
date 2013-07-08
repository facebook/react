/* jshint multistr:true */
/* jshint -W040 */

'use strict';

var grunt = require('grunt');
var UglifyJS = require('uglify-js');

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
  return LICENSE_TEMPLATE.replace('@PACKAGE@', this.data.standalone)
                         .replace('@VERSION@', version) +
         '\n' + src;
}

function simpleBannerify(src) {
  var version = grunt.config.data.pkg.version;
  return SIMPLE_TEMPLATE.replace('@PACKAGE@', this.data.standalone)
                        .replace('@VERSION@', version) +
         '\n' + src;
}

var TEST_PRELUDE = [
  "(function(modules, cache, entry) {",
  "  var hasOwn = cache.hasOwnProperty;",
  "  function require(name) {",
  "    if (!hasOwn.call(cache, name)) {",
  "      var m = cache[name] = { exports: {} };",
  "      modules[name][0].call(m.exports, function(relID) {",
  "        var id = modules[name][1][relID];",
  "        return require(id ? id : relID);",
  "      }, m, m.exports);",
  "    }",
  "    return cache[name].exports;",
  "  }",
  "",
  "  require.dumpCache = function() { cache = {} };",
  "",
  "  for(var i = 0, len = entry.length; i < len; ++i)",
  "    require(entry[i]);",
  "",
  "  return require;",
  "})"
].join("\n");

function monkeyPatchDumpCache(src) {
  var ch, start = 0, depth = 0;

  // Parsing the entire source with Esprima would be cleaner but also
  // prohibitively expensive (multiple seconds), and regular expressions
  // don't balance parentheses well. So we take a hybrid parenthesis
  // counting approach that fails noisily if things go awry.
  for (var i = 0, len = src.length; i < len; ++i) {
    ch = src.charAt(i);
    if (ch === "(") {
      if (depth++ === 0) {
        var expected = "(function";
        if (src.slice(i, i + expected.length) !== expected) {
          throw new Error(
            "Refusing to replace react-test.js prelude because first " +
            "opening parenthesis did not begin a function expression: " +
            src.slice(i, 100) + "..."
          );
        }
        start = i;
      }
    } else if (ch === ")") {
      if (--depth === 0) {
        return src.slice(0, start) + TEST_PRELUDE + src.slice(i + 1);
      }
    }
  }

  throw new Error("Unable to replace react-test.js prelude.");
}

// Our basic config which we'll add to to make our other builds
var basic = {
  entries: [
    './build/modules/React.js'
  ],
  outfile: './build/react.js',
  debug: false,
  standalone: 'React',
  after: [simpleBannerify]
};

var min = grunt.util._.merge({}, basic, {
  outfile: './build/react.min.js',
  debug: false,
  after: [minify, bannerify]
});

var transformer = {
  entries:[
    './vendor/browser-transforms.js'
  ],
  outfile: './build/JSXTransformer.js',
  debug: false,
  standalone: 'JSXTransformer',
  after: [simpleBannerify]
};

var jasmine = {
  entries: [
    "./build/jasmine/all.js"
  ],
  requires: {
    "jasmine": "./build/jasmine/all.js"
  },
  outfile: "./build/jasmine.js",
  debug: false
};

var test = {
  entries: [
    "./build/modules/test/all.js",
  ],
  requires: [
    "**/__tests__/*-test.js"
  ],
  outfile: './build/react-test.js',
  debug: false,
  standalone: false,
  after: [monkeyPatchDumpCache]
};

module.exports = {
  basic: basic,
  jasmine: jasmine,
  test: test,
  min: min,
  transformer: transformer
};
