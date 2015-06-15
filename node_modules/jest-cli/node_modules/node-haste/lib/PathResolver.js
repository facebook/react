// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var path = require('path');


var modulePaths = [];

var NODE_PATH_ENV = 'NODE_PATH';

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
 *
 * This module is heavily inspired from the base module.js file in node's repo.
 * The license at the top of this JS module applies to this file only. Its
 * purpose is to contain only the logic needed to reason about paths - which is
 * perfectly compatible with node's own resolution, but in a way that works with
 * a logical resource map input, that doesn't require reading from the disk.
 * Often when building your own tooling, you'll already have read the resources
 * needed, and path lookup can reuse that cached information (ResourceMap) to
 * reason about path lookups much more quickly.
 *
 * The main entrypoints to this module (`_resolvefileName`) expects a
 * `ResourceMap` argument, which is expected to be of Type `{getResourceByPath:
 * string-> {data: string, path: string}`
 */

/**
 * given a module name, and a list of paths to test, returns the first matching
 * file in the following precedence.
 *
 * require("a.<ext>")
 *   -> a.<ext>
 *
 * require("a")
 *   -> a
 *   -> a.<ext>
 *   -> a/index.<ext>
 *
 * @param {string} basePath Base path to search for "main" entrypoint of a
 * package.
 * @param {object} exts Extensions to search.
 * @param {ResourceMap} resourceMap ResourceMap containing projects and files.
 * @return {string} Absolutely resolved file path or null if no package is found
 * in the ResourceMap.
 */
function tryPackage(basePath, exts, resourceMap) {
  var projectConfigurationResource =
    resourceMap.getResourceByPath(path.join(basePath, 'package.json'));
  if (!projectConfigurationResource) {
    return false;
  }
  var data = projectConfigurationResource && projectConfigurationResource.data;
  var mainFileBase = data && data.main ?
    path.resolve(projectConfigurationResource.path, '..', data.main) :
    basePath;
  return tryFile(mainFileBase, resourceMap) ||
      tryExtensions(mainFileBase, exts, resourceMap) ||
      tryExtensions(path.resolve(mainFileBase, 'index'), exts, resourceMap);
}

/**
 * Check if the file exists and is not a directory.
 */
function tryFile(requestPath, resourceMap) {
  var resourceAtPath = resourceMap.getResourceByPath(requestPath);
  return resourceAtPath &&
    !resourceAtPath.isLegacy &&
    resourceAtPath.path;
}

/**
 * Given a path check a the file exists with any of the set extensions
 */
function tryExtensions(p, exts, resourceMap) {
  for (var i = 0, EL = exts.length; i < EL; i++) {
    var fileName = tryFile(p + exts[i], resourceMap);
    if (fileName) {
      return fileName;
    }
  }
  return false;
}

var _extensions = {'.js': true};

var _extensionKeys = Object.keys(_extensions);

var PathResolver = {

  _findPath: function(request, paths, resourceMap) {
    var exts = _extensionKeys;

    if (request.charAt(0) === '/') {
      paths = [''];
    }

    var trailingSlash = (request.slice(-1) === '/');

    // For each path
    for (var i = 0, PL = paths.length; i < PL; i++) {
      var basePath = path.resolve(paths[i], request);
      var fileName;
      if (!trailingSlash) {
        // try to join the request to the path
        fileName = tryFile(basePath, resourceMap);

        if (!fileName && !trailingSlash) {
          // try it with each of the extensions
          fileName = tryExtensions(basePath, exts, resourceMap);
        }
      }

      if (!fileName) {
        fileName = tryPackage(basePath, exts, resourceMap);
      }

      if (!fileName) {
        // try it with each of the extensions at "index"
        fileName = tryExtensions(path.resolve(basePath, 'index'), exts, resourceMap);
      }

      if (fileName) {
        return fileName;
      }
    }
    return false;
  },

  // 'from' is the __dirname of the module.
  _nodeModulePaths: function(from) {
    // guarantee that 'from' is absolute.
    from = path.resolve(from);

    // note: this approach *only* works when the path is guaranteed
    // to be absolute.  Doing a fully-edge-case-correct path.split
    // that works on both Windows and Posix is non-trivial.
    var splitRe = process.platform === 'win32' ? /[\/\\]/ : /\//;
    var paths = [];
    var parts = from.split(splitRe);

    for (var tip = parts.length - 1; tip >= 0; tip--) {
      // don't search in .../node_modules/node_modules
      if (parts[tip] === 'node_modules') {
        continue;
      }
      var dir = parts.slice(0, tip + 1).concat('node_modules').join(path.sep);
      paths.push(dir);
    }

    return paths;
  },


  _resolveLookupPaths: function(request, parent) {
    var start = request.substring(0, 2);
    if (start !== './' && start !== '..') {
      var paths = modulePaths;
      if (parent) {
        if (!parent.paths) {
          parent.paths = [];
        }
        paths = parent.paths.concat(paths);
      }
      return paths;
    }

    // with --eval, parent.id is not set and parent.fileName is null
    if (!parent || !parent.id || !parent.fileName) {
      // make require('./path/to/foo') work - normally the path is taken
      // from realpath(__fileName) but with eval there is no fileName
      var mainPaths = ['.'].concat(modulePaths);
      mainPaths = PathResolver._nodeModulePaths('.').concat(mainPaths);
      return mainPaths;
    }

    // Is the parent an index module?
    // We can assume the parent has a valid extension,
    // as it already has been accepted as a module.
    var isIndex = /^index\.\w+?$/.test(path.basename(parent.fileName));
    var parentIdPath = isIndex ? parent.id : path.dirname(parent.id);
    var id = path.resolve(parentIdPath, request);

    // make sure require('./path') and require('path') get distinct ids, even
    // when called from the toplevel js file
    if (parentIdPath === '.' && id.indexOf('/') === -1) {
      id = './' + id;
    }

    return [path.dirname(parent.fileName)];
  },

  /**
   * @param {string} request Argument to require()
   * @param {string} parent path of module that is calling require.
   * @param {ResourceMap} resourceMap ResourceMap for looking up project
   * configuration etc so that we don't need to read from the disk.
   * @return {string} Resolved absolute path of the module corresponding to the
   * callers require(request).
   */
  _resolveFileName: function(request, parent, resourceMap) {
    var resolvedPaths = PathResolver._resolveLookupPaths(request, parent);
    return PathResolver._findPath(request, resolvedPaths, resourceMap);
  },

  _initPaths: function() {
    var isWindows = process.platform === 'win32';
    var homeDir = isWindows ? process.env.USERPROFILE : process.env.HOME;
    var paths = [path.resolve(process.execPath, '..', '..', 'lib', 'node')];
    if (homeDir) {
      paths.unshift(path.resolve(homeDir, '.node_libraries'));
      paths.unshift(path.resolve(homeDir, '.node_modules'));
    }
    if (process.env[NODE_PATH_ENV]) {
      paths = process.env[NODE_PATH_ENV].split(path.delimiter).concat(paths);
    }

    modulePaths = paths;
  }
};

PathResolver._initPaths();

module.exports = PathResolver;
