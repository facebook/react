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
/*jslint proto:true*/

var inherits = require('util').inherits;
var Resource = require('./Resource');

/**
 * Resource for *.js files
 * A heavier version of JS that does extract more information (gziped size).
 * @extends {JSLite}
 * @class
 * @param {String} path path of the resource
 */
function JS(path) {
  Resource.call(this, path);

  this.id = null;

  this.options = {};
  this._requiredCSSMap = {};
  this._requiredModuleMap = {};
  this._requiredLegacyComponentsMap = {};
  this._requiredTextToResolvedID = {};
}
inherits(JS, Resource);
JS.__proto__ = Resource;


// move default options to the prototype, to reduce serialized size
JS.prototype.jsxDOMImplementor = null;
JS.prototype.networkSize = 0;
JS.prototype.isJSXEnabled = false;
JS.prototype.isModule = false;
JS.prototype.isJavelin = false;
JS.prototype.isRunWhenReady = false;
JS.prototype.isPolyfill = false;
JS.prototype.isLegacy = false;
JS.prototype.isPermanent = false;
JS.prototype.isNopackage = false;

// do not modify this arrays in loader, only override
JS.prototype.definedJavelinSymbols = [];
JS.prototype.requiredJavelinSymbols = [];
JS.prototype.requiredDynamicModules = [];
JS.prototype.requiredLazyModules = [];
JS.prototype.requiredCSS = [];

/**
 * Initially, these are the strings inside of calls to `require()`. They may not
 * be the moduleIDs that you intend to load - they could be relative require
 * paths etc. After `postProcess`, each item in the array is replaced with the
 * actual resource IDs that the `require()` call resolved to - if it differs
 * from the original text argument. The `_requiredTextToResolvedID` records
 * which required "text" was resolved to which ID in the final `requiredModules`
 * array, so that you can packaging tools are free to use that "history" of the
 * the resolution to statically replace the argument to require().
 */
JS.prototype.requiredModules = [];
JS.prototype.requiredLegacyComponents = [];
JS.prototype.suggests = [];
JS.prototype.polyfillUAs = [];

JS.prototype.type = 'JS';

JS.prototype.addRequiredModule = function(x) {
  this._requiredModuleMap[x] = true;
};

JS.prototype.addRequiredLegacyComponent = function(x) {
  this._requiredLegacyComponentsMap[x] = true;
};

JS.prototype.addRequiredCSS = function(x) {
  this._requiredCSSMap[x] = true;
};

JS.prototype.finalize = function() {
  var keys = Object.keys(this._requiredModuleMap);
  if (keys.length) {
    this.requiredModules = keys;
  }
  keys = Object.keys(this._requiredLegacyComponentsMap);
  if (keys.length) {
    this.requiredLegacyComponents = keys;
  }
  keys = Object.keys(this._requiredCSSMap);
  if (keys.length) {
    this.requiredCSS = keys;
  }
};


/**
 * `_requiredModuleMap` records the original form that the module was required
 * in, before `postProcess` has normalized it to the canonical ID form.
 * `_requiredTextToResolvedID` associates the two. So if your JS has
 * `require('./path/comp.js')`, then the JS resource instance will have:
 *
 *   _requiredModuleMap: {'./path/comp.js': true}
 *   requiredModules: ['package-name/path/comp.js']
 *   _requiredTextToResolvedID: {'./path/comp.js': 'package-name/path/comp.js'}
 *
 * @param {string} origName String passsed to require() in js file.
 * @param {string} modID Canonical module ID origName resolves to from the
 * perspective of this particular resource.
 */
JS.prototype.recordRequiredModuleOrigin = function(origName, modID) {
  this._requiredTextToResolvedID[origName] = modID;
};

/**
 * @param {str} origName Originally required name as in `require('./x/y.js')`
 * @return {string} canonical module ID - which might have been redirected using
 * `recordRequiredModuleOrigin` or not.
 */
JS.prototype.getModuleIDByOrigin = function(origName) {
  return this._requiredTextToResolvedID[origName] || origName;
};

module.exports = JS;
