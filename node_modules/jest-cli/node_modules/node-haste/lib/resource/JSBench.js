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
 * Resource for __benchmarks__ / *.js files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function JSBench(path) {
  Resource.call(this, path);

  this.id = null;

  this.contacts = [];
  this.requiredModules = [];
}
inherits(JSBench, Resource);
JSBench.__proto__ = Resource;

JSBench.prototype.type = 'JSBench';
JSBench.prototype.version = '0.1';


module.exports = JSBench;
