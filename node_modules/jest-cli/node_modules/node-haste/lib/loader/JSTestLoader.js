/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var inherits = require('util').inherits;
var path = require('path');

var docblock = require('../parse/docblock');
var extract = require('../parse/extract');
var ResourceLoader = require('./ResourceLoader');
var JSTest = require('../resource/JSTest');

function escapeStrForRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * @class Loads and parses __tests__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function JSTestLoader(options) {
  ResourceLoader.call(this, options);

  this.pathRe = new RegExp(
    '(?:/|^)__tests__/' +
    (this.options.matchSubDirs ? '(.+)' : '([^/]+)') +
    '(' + this.getExtensions().map(escapeStrForRegex).join('|') + ')$'
  );
}
inherits(JSTestLoader, ResourceLoader);
JSTestLoader.prototype.path = __filename;

var requireRe = /(?:\brequire|\.map)\s*\(\s*[\'"]([^"\']+)["\']\s*\)/g;

JSTestLoader.prototype.getResourceTypes = function() {
  return [JSTest];
};

JSTestLoader.prototype.getExtensions = function() {
  return this.options.extensions || ['.js'];
};


/**
 * Initialize a resource with the source code and configuration
 * Loader can parse, gzip, minify the source code to build the resulting
 * Resource value object
 *
 * @protected
 * @param {String}               filePath      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {String}               sourceCode
 * @param {Function}             callback
 */
JSTestLoader.prototype.loadFromSource =
  function(filePath, configuration, sourceCode, messages, callback) {

  var test = new JSTest(filePath);
  var match = filePath.match(this.pathRe);
  test.id = match ? match[1] : path.basename(filePath, '.js');

  docblock.parse(docblock.extract(sourceCode)).forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];

    switch (name) {
      case 'emails':
        test.contacts = value.split(/\s/);
        break;
      default:
        // do nothing
    }
  });

  test.requiredModules = extract.strings(sourceCode, requireRe, 1);
  callback(messages, test);
};

/**
 * Only match __tests__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Boolean}
 */
JSTestLoader.prototype.matchPath = function(filePath) {
  return this.pathRe.test(filePath);
};


module.exports = JSTestLoader;
