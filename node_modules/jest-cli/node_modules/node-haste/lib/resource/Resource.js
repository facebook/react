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

/**
 * Base class for all Resource types
 * Resource is a value object that holds the information about a particular
 * resource. See properties.
 *
 * @abstract
 * @class
 * @param {String} path path of the resource
 */
var node_path = require('path');
function Resource(path) {
  this.path = node_path.normalize(path);
  this.id = node_path.normalize(path);
}

Resource.prototype.mtime = 0;
Resource.prototype.type = 'Resource';

/**
 * Converts Resource to serializable object
 * @return {Object}
 */
Resource.prototype.toObject = function() {
  var object = { type: this.type };
  for (var i in this) {
    if (i.charAt(0) != '_' && this.hasOwnProperty(i)) {
      object[i] = this[i];
    }
  }
  return object;
};

/**
 * Creates a new resource from object
 * @static
 * @param  {Object} object
 * @return {Resource}
 */
Resource.fromObject = function(object) {
  var type = this;
  var instance = new type(object.path);
  for (var i in object) {
    instance[i] = object[i];
  }
  return instance;
};


module.exports = Resource;
