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

var JSLoader = require('./JSLoader');

function TMPLLoader(options) {
  JSLoader.call(this, options);
}
inherits(TMPLLoader, JSLoader);
TMPLLoader.prototype.path = __filename;

TMPLLoader.prototype.matchPath = function(filePath) {
  return filePath.lastIndexOf('.tmpl') === filePath.length - 5;
};

TMPLLoader.prototype.getExtensions = function() {
  return ['.tmpl'];
};

module.exports = TMPLLoader;

