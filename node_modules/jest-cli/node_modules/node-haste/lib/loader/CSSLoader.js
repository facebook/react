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
var zlib = require('zlib');

var docblock = require('../parse/docblock');
var ResourceLoader = require('./ResourceLoader');
var extractFBSprites = require('../parse/css').extractFBSprites;
var CSS = require('../resource/CSS');
var MessageList = require('../MessageList');


/**
 * @class Loads and parses CSS files
 * Extracts options from the docblock, calculates gziped network size. Network
 * size calculation is off by default due to it's perf cost. Use options
 * parameter to switch them on.
 *
 * @extends {ResourceLoader}
 * @param {Object|null} options Object with the following options:
 *                              - extractNetworkSize
 *                              - extractFBSprites
 */
function CSSLoader(options) {
  ResourceLoader.call(this, options);
  var extractNetworkSize = !!this.options.networkSize;

  if (extractNetworkSize) {
    this.extractExtra = this.extractNetworkSize;
  } else {
    this.extractExtra = function(css, sourceCode, messages, callback) {
      // make async to break long stack traces
      process.nextTick(function() {
        callback(messages, css);
      });
    };
  }
}
inherits(CSSLoader, ResourceLoader);
CSSLoader.prototype.path = __filename;

CSSLoader.prototype.getResourceTypes = function() {
  return [CSS];
};

CSSLoader.prototype.getExtensions = function() {
  return ['.css'];
};

/**
 * Extracts aproximate network size by gziping the source
 * @todo (voloko) why not minify?
 * Off by default due to perf cost
 *
 * @protected
 * @param  {CSS}   css
 * @param  {String}   sourceCode
 * @param  {Function} callback
 */
CSSLoader.prototype.extractNetworkSize =
  function(css, sourceCode, messages, callback) {
  zlib.deflate(sourceCode, function(err, buffer) {
    css.networkSize = buffer.length;
    callback(messages, css);
  });
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
CSSLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, messages, callback) {
  var css = new CSS(path);

  var props = docblock.parse(docblock.extract(sourceCode));

  props.forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];

    switch (name) {
      case 'provides':
        css.id = value;
        break;
      case 'providesModule':
        css.isModule = true;
        css.id = 'css:' + value;
        break;
      case 'css':
        value.split(/\s+/).forEach(css.addRequiredCSS, css);
        break;
      case 'requires':
        value.split(/\s+/).forEach(css.addRequiredLegacyComponent, css);
        break;
      case 'nonblocking':
        css.isNonblocking = true;
        break;
      case 'nopackage':
        css.isNopackage = true;
        break;
      case 'permanent':
        css.isPermanent = true;
        break;
      case 'option':
      case 'options':
        value.split(/\s+/).forEach(function(key) {
          css.options[key] = true;
        });
        break;
      case 'author':
      case 'deprecated':
        // Support these so Diviner can pick them up.
        break;
      case 'nolint':
      case 'generated':
      case 'preserve-header':
        // various options
        break;
      case 'layer':
        // This directive is currently used by Connect JS library
        break;
      default:
        messages.addClowntownError(css.path, 'docblock',
          'Unknown directive ' + name);
    }
  });

  if (this.options.extractFBSprites) {
    css.fbSprites = extractFBSprites(sourceCode);
  }

  css.finalize();

  this.extractExtra(css, sourceCode, messages, callback);
};


/**
 * Only match *.css files
 * @param  {String} filePath
 * @return {Boolean}
 */
CSSLoader.prototype.matchPath = function(filePath) {
  return filePath.lastIndexOf('.css') === filePath.length - 4;
};

/**
 * Post process is called after the map is updated but before the update
 * task is complete.
 * Used to resolve local required paths and /index.js directory requires
 *
 * @param  {ResourceMap}      map
 * @param  {Array.<Resource>} resources
 * @param  {Function}         callback
 */
CSSLoader.prototype.postProcess = function(map, resources, callback) {
  var messages = MessageList.create();

  resources.forEach(function(r) {
    var resource, i, required;

    required = r.requiredCSS;
    for (i = 0; i < required.length; i++) {
      resource = map.getResource('CSS', 'css:' + required[i]);
      if (resource && resource.isModule) {
        required[i] = 'css:' + required[i];
      }
    }
  });

  process.nextTick(function() {
    callback(messages);
  });
};


module.exports = CSSLoader;
