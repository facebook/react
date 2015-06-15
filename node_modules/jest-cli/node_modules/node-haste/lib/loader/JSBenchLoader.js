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

var docblock = require('../parse/docblock');
var extract = require('../parse/extract');
var ResourceLoader = require('./ResourceLoader');
var JSBench = require('../resource/JSBench');


/**
 * @class Loads and parses __benchmarks__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function JSBenchLoader(options) {
  ResourceLoader.call(this, options);

  this.pathRe = this.options.matchSubDirs ?
    /(?:[\\/]|^)__benchmarks__[\\/](.+)\.js$/ :
    /(?:[\\/]|^)__benchmarks__[\\/]([^\/]+)\.js$/;
}
inherits(JSBenchLoader, ResourceLoader);
JSBenchLoader.prototype.path = __filename;

JSBenchLoader.prototype.getResourceTypes = function() {
  return [JSBench];
};

JSBenchLoader.prototype.getExtensions = function() {
  return ['.js'];
};


/**
 * Initialize a resource with the source code and configuration
 * Loader can parse, gzip, minify the source code to build the resulting
 * Resource value object
 *
 * @protected
 * @param {String}               path      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {String}               sourceCode
 * @param {Function}             callback
 */
JSBenchLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, messages, callback) {

  var bench = new JSBench(path);

  docblock.parse(docblock.extract(sourceCode)).forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];

    switch (name) {
      case 'emails':
        bench.contacts = value.split(/\s/);
        break;
      default:
        // do nothing
    }
  });

  bench.id = configuration && configuration.resolveID(path);
  if (!bench.id) {
    bench.id = path.match(this.pathRe)[1];
  }
  bench.requiredModules = extract.requireCalls(sourceCode);
  callback(messages, bench);
};

/**
 * Only match __benchmarks__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Boolean}
 */
JSBenchLoader.prototype.matchPath = function(filePath) {
  return this.pathRe.test(filePath);
};


module.exports = JSBenchLoader;
