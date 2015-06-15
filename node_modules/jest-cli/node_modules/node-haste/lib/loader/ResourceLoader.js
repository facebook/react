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
var fs = require('fs');
var Resource = require('../resource/Resource');
var MessageList = require('../MessageList');

/**
 * @class Base ResourceLoader. ResourceLoader works together with
 * MapUpdateTask to analyze different resource type. Each loader type can load
 * one or more resource types. Each loader can accept a number of options
 * to configure loading process. By default loader will read the file's code
 * and parse it to extract useful information.
 */
function ResourceLoader(options) {
  this.options = options || {};
}
ResourceLoader.prototype.path = __filename;

ResourceLoader.fromObject = function(object) {
  var C = require(object.path);
  return new C(object.options);
};

ResourceLoader.prototype.toObject = function() {
  return {
    path: this.path,
    options: this.options
  };
};

ResourceLoader.prototype.getResourceTypes = function() {
  return [Resource];
};

ResourceLoader.prototype.getExtensions = function() {
  return [];
};

/**
 * Creates a new resource for a given path. Can be overridden in a sublcass
 * to perform different loading
 *
 * @static
 * @param  {String}   path
 * @param  {ProjectConfiguration} configuration
 * @param  {Function} callback
 */
ResourceLoader.prototype.loadFromPath =
  function(path, configuration, callback) {
  var me = this;
  var messages = MessageList.create();

  // node's 0.6 async I/O adds more overhead than the actuall reading time
  // when disk cache is warm. Use sync version
  // var sourceCode;
  // try {
  //   sourceCode = fs.readFileSync(path, 'utf-8');
  // } catch(e) {
  //   messages.addClowntownError(this.path, 'resource', e.toString());
  //   callback(messages, null);
  //   return;
  // }
  // process.nextTick(function() {
  //   me.loadFromSource(
  //     path,
  //     configuration,
  //     sourceCode || '',
  //     messages,
  //     callback);
  // });

  fs.readFile(path, 'utf-8', function(err, sourceCode) {
    if (err) {
      console.error('Error reading file: `' + path + '`');
      throw err;
    } else {
      me.loadFromSource(
        path,
        configuration,
        sourceCode || '',
        messages,
        callback);
    }
  });
};

/**
 * Initialize a resource with the source code and configuration
 * Loader can parse, gzip, minify the source code to build the resulting
 * Resource value object
 *
 * TODO: @jordwalke: Actually cache the file contents here so that future
 * packaging stages can read the cached file!
 *
 * @protected
 * @param {String}               path      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {String}               sourceCode
 * @param {MessageList}          messages
 * @param {Function}             callback
 */
ResourceLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, messages, callback) {
  var resource = new Resource(path);
  process.nextTick(function() { callback(messages, resource); }, 10);
};

/**
 * Checks if resource can parse the given path. Map builder will match
 * all available resource types to find the one that can parse the given path
 * Base resource always returns true, since it can potentially parse any file,
 * though without much value
 * @static
 *
 * @param  {String} path
 * @return {Boolean}
 */
ResourceLoader.prototype.matchPath = function(path) {
  return true;
};

/**
 * Post process is called after the map is updated but before the update
 * task is complete.
 * Can be used to resolve dependencies or to bulk process all loaded resources
 * @param  {ResourceMap}      map
 * @param  {Array.<Resource>} resources
 * @param  {Function}         callback
 */
ResourceLoader.prototype.postProcess = function(map, resources, callback) {
  process.nextTick(function() {
    callback(MessageList.create());
  });
};


module.exports = ResourceLoader;
