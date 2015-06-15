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

/**
 * A map holding resource by id
 * @param {Array.<Resource>} resources
 */
function ResourceMap(resources, typeToMap) {
  this.resourceCache = null;
  this.inferredProjectPaths = null;
  this.configurationTrie = null;
  this.resourceMap = {};
  this.resourcePathMap = {};
  this.typeToMap = typeToMap || {};
  this.inferredProjectPaths = null;
  resources && resources.forEach(this.addResource, this);
}

ResourceMap.prototype.getResource = function(type, id) {
  type = this.typeToMap[type] || type;
  var typeMap = this.resourceMap[type];
  return typeMap && typeMap[id];
};


/**
 * Node-haste allows defining arbitrary search paths, and will recurse
 * directories to find files/projects. Think of it like a shortcut to having to
 * manually set up all the NODE_PATH variables every time you add a new project
 * somewhere on the file system. This function extracts out a list of those
 * automatically created project roots.
 *
 * WARNING: Do not call this frequently, only once/twice per entire postProcess,
 * definitely never on a single module load.
 *
 * @param {ResourceMap} resourceMap Resource map to extract project paths from.
 * @return {Array<string>} List of absolute paths to project roots that are
 * inferred from loaded resources that assume the role of a "project".
 */
ResourceMap.prototype.getAllInferredProjectPaths = function() {
  if (!this.inferredProjectPaths) {
    var found = {};
    this.getAllResources().forEach(function(resource) {
      if (resource.getInferredProjectPath) {
        found[resource.getInferredProjectPath()] = true;
      }
    }, this);
    this.inferredProjectPaths = Object.keys(found);
  }
  return this.inferredProjectPaths;
};


ResourceMap.prototype.getConfigurationForResource = function(resource) {
  return this.getConfigurationByPath(resource.path);
};

ResourceMap.prototype.getConfigurationByPath = function(path) {
  if (!this.configurationTrie) {
    var ConfigurationTrie = require('./ConfigurationTrie');
    this.configurationTrie = new ConfigurationTrie(
      this.getAllResourcesByType('ProjectConfiguration'));
  }
  return this.configurationTrie.findConfiguration(path);
};

ResourceMap.prototype.getResourceByPath = function(path) {
  return this.resourcePathMap[path];
};

ResourceMap.prototype.getAllResources = function() {
  if (!this.resourceCache) {
    var cache = [];
    var map = this.resourcePathMap;
    Object.keys(map).forEach(function(k) {
      map[k] && cache.push(map[k]);
    }, this);
    this.resourceCache = cache;
  }
  return this.resourceCache;
};

ResourceMap.prototype.getAllResourcesByType = function(type) {
  type = this.typeToMap[type] || type;
  if (!this.resourceMap[type]) {
    return [];
  }
  return Object.keys(this.resourceMap[type]).map(function(key) {
    return this.resourceMap[type][key];
  }, this).filter(function(r) {
    return r;
  });
};

ResourceMap.prototype.addResource = function(resource) {
  this.configurationTrie = this.resourceCache = null;
  this.inferredProjectPaths = null;
  var type = this.typeToMap[resource.type] || resource.type;
  if (!this.resourceMap[type]) {
    this.resourceMap[type] = {};
  }
  this.resourcePathMap[resource.path] = resource;
  this.resourceMap[type][resource.id] = resource;
};

ResourceMap.prototype.updateResource = function(oldResource, newResource) {
  this.configurationTrie = this.resourceCache = null;
  this.inferredProjectPaths = null;
  this.removeResource(oldResource);
  this.addResource(newResource);
};

ResourceMap.prototype.removeResource = function(resource) {
  var type = this.typeToMap[resource.type] || resource.type;
  this.configurationTrie = this.resourceCache = null;
  this.inferredProjectPaths = null;
  this.resourcePathMap[resource.path] = undefined;
  if (this.resourceMap[type] && this.resourceMap[type][resource.id]) {
    this.resourceMap[type][resource.id] = undefined;
  }
};


module.exports = ResourceMap;
