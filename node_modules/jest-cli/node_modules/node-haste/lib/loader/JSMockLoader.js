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

var extract = require('../parse/extract');
var ResourceLoader = require('./ResourceLoader');
var JSMock = require('../resource/JSMock');

/**
 * @class Loads and parses __mocks__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function JSMockLoader(options) {
  ResourceLoader.call(this, options);

  this.pathRe = this.options.matchSubDirs ?
    /(?:[\\/]|^)__mocks__[\\/](.+)\.js$/ :
    /(?:[\\/]|^)__mocks__[\\/]([^\/]+)\.js$/;
}
inherits(JSMockLoader, ResourceLoader);
JSMockLoader.prototype.path = __filename;

JSMockLoader.prototype.getResourceTypes = function() {
  return [JSMock];
};

JSMockLoader.prototype.getExtensions = function() {
  return ['.js'];
};


/**
 * Initialize a resource with the source code and configuration
 * Loader can parse, gzip, minify the source code to build the resulting
 * Resource value object.
 *
 * @protected
 * @param {String}               path      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {String}               sourceCode
 * @param {Function}             callback
 */
JSMockLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, messages, callback) {
  var mock = new JSMock(path);
  mock.id = path.match(this.pathRe)[1];
  mock.requiredModules = extract.requireCalls(sourceCode);
  callback(messages, mock);
};

/**
 * Only match __mocks__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Boolean}
 */
JSMockLoader.prototype.matchPath = function(filePath) {
  return this.pathRe.test(filePath);
};


module.exports = JSMockLoader;
