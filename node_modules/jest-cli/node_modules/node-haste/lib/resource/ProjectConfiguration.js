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
var node_path = path = require('path');
var fs = require('fs');

var Resource = require('./Resource');

/**
 * Resource for package.json files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 * @param {Object} data source code of the resource
 */
function ProjectConfiguration(path, data) {
  this.path = node_path.normalize(path);
  this.id = path;
  this.data = data;
}
inherits(ProjectConfiguration, Resource);
ProjectConfiguration.__proto__ = Resource;

ProjectConfiguration.prototype.type = 'ProjectConfiguration';

/**
 * Returns haste specific prefix
 * @return {String}
 */
ProjectConfiguration.prototype.getHastePrefix = function() {
  return this.data.haste && this.data.haste.prefix !== undefined ?
    this.data.haste.prefix :
    path.basename(path.dirname(this.path));
};

/**
 * Returns all roots affected by this package
 * @return {Array.<String>}
 */
ProjectConfiguration.prototype.getHasteRoots = function() {
  var dirname = path.dirname(this.path);
  if (this.data.haste && this.data.haste.roots) {
    return this.data.haste.roots.map(function(root) {
      return path.join(dirname, root);
    });
  }
  return [dirname];
};

/**
 * The "Project Path" is the absolute path of the directory where "projects"
 * live. Projects consist of a root folder `myProject` which contains a
 * `package.json` file at `myProject/package.json`.
 *
 * If a `package.json` lives at /some/dir/myProject/package.json then, the
 * inferred project dir would be /some/dir/
 *
 * Note that the project path is the directory *above* the module root.
 */
ProjectConfiguration.prototype.getInferredProjectPath = function() {
  return path.resolve(this.path, '..', '..');
};

/**
 * Simple convention for determining uniqueness of commonJS style modules.
 *
 * We don't try to "pre-resolve" any IDs here - To do this properly, we'd need a
 * more complete picture of the resource map, that is only available at
 * `postProcess` time. Our only job at this point is to come up with *something*
 * to uniquely identify the 'JS' resource. The convention used here is to take
 * the project (`package.json` "name" field) and append the path to the physical
 * file.
 *
 * Attempting to choose an ID that has _meaning_ (by trying to pre-resolve
 * `projectName/index.js` to `projectName` etc) is impossible at this time. An
 * ambiguity occurs when we later discover that the `package.json` pointed the
 * "main" module to another file. We couldn't possibly know which should claim
 * the `projectName` ID until we've processed all resources. This is why
 * dependency resolution can't *properly* happen until `postProcess`.
 *
 * By convention, the ID that we use to store commonJS resources is the
 * `package.json` project name followed by the relative path from `package.json`
 * to the file.
 *
 *   > projectName/index.js
 *   > projectName/path/to.js
 *
 * A nice side effect of the particular convention chosen here, is when
 * statically analyzing dependencies in `postProcess`:
 *
 *   > require('x/y/z.js')
 *
 * requiring files by IDs always resolves to the module with that ID. Other
 * conventions don't have this property. So if you can simply lookup 'JS'
 * resource `'x/y/z.js'` and quickly get a hit, you don't need to fall back to
 * more expensive path resolutions - which must analyze `package.json` files
 * etc.
 *
 * Another loader will assign IDs to `@providesModule` JS files.
 *
 * Any resource "path" identifies the physical resource, but the resource ID
 * doesn't yet identify a physical resource, until the "type" of resource is
 * specified. You might have two resources, with the same ID and different
 * types. For example {id: 'hello/hello.js'} does not identify a physical file,
 * but {type: 'JS', id: 'hello/hello.js'} might.
 *
 * Two physical files might have the same module ID, but different types, as is
 * the case with mock files.
 *
 * A:
 *   id: myProject/x.js
 *   path: /home/myProject/x.js
 *   type: 'JS'
 *
 * A-mock:
 *   id: myProject/x.js
 *   path: /home/myProject/x-mock.js
 *   type: 'JSMock'
 *
 * However, no two distinct files have the same resource ID and the same
 * resource type and obviously no two distinct files have the same absolute
 * "path".
 *
 *
 * @param  {String} filePath
 * @return {String|null}
 */
ProjectConfiguration.prototype.resolveID = function(filePath) {
  var hasteDirectories = this.getHasteRoots();
  var prefix = this.getHastePrefix();

  for (var i = 0; i < hasteDirectories.length; i++) {
    var hasteDirectory = hasteDirectories[i];
    if (filePath.indexOf(hasteDirectory + path.sep) === 0) {
      var result = path.relative(hasteDirectory, filePath);
      if (prefix) {
        result = path.join(prefix, result);
      }
      return result;
    }
  }

  return null;
};

module.exports = ProjectConfiguration;
