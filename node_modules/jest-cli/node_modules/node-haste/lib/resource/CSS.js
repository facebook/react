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
 * Resource for *.css files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function CSS(path) {
  Resource.call(this, path);

  this.id = null;

  this.fbSprites = [];
  this.options = {};
  this._requiredCSSMap = {};
  this._requiredLegacyComponentsMap = [];
}
inherits(CSS, Resource);
CSS.__proto__ = Resource;


CSS.prototype.isNopackage = false;
CSS.prototype.isNonblocking = false;
CSS.prototype.isModule = false;
CSS.prototype.isPermanent = false;
CSS.prototype.networkSize = 0;
CSS.prototype.type = 'CSS';
CSS.prototype.requiredCSS = [];
CSS.prototype.requiredLegacyComponents = [];


CSS.prototype.addRequiredLegacyComponent = function(x) {
  this._requiredLegacyComponentsMap[x] = true;
};

CSS.prototype.addRequiredCSS = function(x) {
  this._requiredCSSMap[x] = true;
};

CSS.prototype.finalize = function() {
  var keys = Object.keys(this._requiredLegacyComponentsMap);
  if (keys.length) {
    this.requiredLegacyComponents = keys;
  }
  keys = Object.keys(this._requiredCSSMap);
  if (keys.length) {
    this.requiredCSS = keys;
  }
};


module.exports = CSS;
