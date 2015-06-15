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

var path = require('path');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var ProjectConfigurationLoader =
  require('./loader/ProjectConfigurationLoader');
var ConfigurationTrie = require('./ConfigurationTrie');
var MessageList = require('./MessageList');
var AnalyzeChangedTask = require('./AnalyzeChangedTask');

/**
 * A task represention a map rebuild operation
 * @class
 * @extends {EventEmitter}
 *
 * @param {Array}                  files
 * @param {Array.<ResourceLoader>} loaders
 * @param {ResourceMap}            map
 */
function MapUpdateTask(files, loaders, map, options) {
  EventEmitter.call(this);

  this.files = files.map(function(file){
    file[0] = path.normalize(file[0]);
    return file;
  });
  this.map = map;
  this.loaders = loaders;
  this.configurationLoader = null;
  this.maxOpenFiles = options && options.maxOpenFiles || 200;
  this.maxProcesses = options && options.maxProcesses || 1;

  this.messages = MessageList.create();
  this.changed = [];
  this.changedPaths = {};
  this.newConfigurations = {};
  this.skipped = [];

  // setup ProjectConfigurationLoader, so that MapUpdateTask can resolve
  // configurations
  this.loaders.forEach(function(loader) {
    if (loader.isConfiguration) {
      this.configurationLoader = loader;
    }
  }, this);
  if (!this.configurationLoader) {
    this.configurationLoader = new ProjectConfigurationLoader();
  }
}
inherits(MapUpdateTask, EventEmitter);

/**
 * Runs the task
 * @public
 */
MapUpdateTask.prototype.run = function() {
  this.markChangedFiles(function() {
    this.emit('changed-files', this.changed);
    this.processChangedConfigurations(function() {
      this.emit('changed', this.changed);
      this.analyzeChanged(function() {
        this.emit('analyzed', this.changed);
        this.updateMap(function() {
          this.emit('mapUpdated', this.changed);
          this.postProcess(function() {
            this.emit('postProcessed', this.map);
            this.emit('complete', this.map);
          });
        });
      });
    });
  });
  return this;
};

/**
 * @protected
 * @param {String}   newPath
 * @param {Resource} oldResource
 */
MapUpdateTask.prototype.markAsChanged = function(mtime, newPath, oldResource) {
  var filePath = newPath || oldResource.path;
  if (!this.changedPaths[filePath]) {
    this.changed.push(this.changedPaths[filePath] = {
      mtime: mtime,
      newPath: newPath,
      oldResource: oldResource,
      path: filePath
    });
  }
};

/**
 * Go through found files and existing map and mark files as changed
 * @param  {Function} callback
 */
MapUpdateTask.prototype.markChangedFiles = function(callback) {
  var visited = {};
  var path = require('path');

  this.files.forEach(function(pair) {
    var filePath = pair[0];
    var mtime = pair[1];
    visited[filePath] = true;
    var resource = this.map.getResourceByPath(filePath);
    if (!resource) {
      this.markAsChanged(mtime, filePath, null);
    } else if (resource.mtime < mtime) {
      this.markAsChanged(mtime, filePath, resource);
    }
  }, this);

  this.map.getAllResources().forEach(function(resource) {
    if (!visited[resource.path]) {
      this.markAsChanged(resource.mtime, null, resource);
    }
  }, this);
  callback.call(this);
};

/**
 * Mark all files touched by changes in configuration
 * @param  {Function} callback
 */
MapUpdateTask.prototype.processChangedConfigurations = function(callback) {
  var toLoad = [];
  var affected = [];

  var changedConfigurations = this.changed.filter(function(record) {
    return this.configurationLoader.matchPath(record.path);
  }, this);
  changedConfigurations.forEach(function(record) {
    if (record.newPath) {
      toLoad.push(record);
    }
    if (record.oldResource) {
      affected.push(record.oldResource);
    }
  });

  var next = function() {
    var affectedDirectories = [];
    affected.forEach(function(resource) {
      affectedDirectories.push
        .apply(affectedDirectories, resource.getHasteRoots());
    }, this);
    if (affectedDirectories.length) {
      var regex = new RegExp('^' + '(' + affectedDirectories.join('|').replace('\\','\\\\') + ')');
      this.files.forEach(function(pair) {
        if (regex.test(pair[0])) {
          this.markAsChanged(
            pair[1],
            pair[0],
            this.map.getResourceByPath(pair[0]));
        }
      }, this);
    }
    callback.call(this);
  }.bind(this);

  if (toLoad.length) {
    var waiting = toLoad.length;
    var me = this;
    toLoad.forEach(function(record) {
      this.configurationLoader
        .loadFromPath(record.newPath, null, function(messages, resource) {
          resource.mtime = record.mtime;
          record.newResource = resource;
          me.newConfigurations[resource.path] = resource;
          me.messages.mergeAndRecycle(messages);
          affected.push(resource);
          if (--waiting === 0) {
            next();
          }
        });
    }, this);
  } else {
    next();
  }
};

/**
 * Parse and analyze changed files
 * @protected
 * @param  {Function} callback
 */
MapUpdateTask.prototype.analyzeChanged = function(callback) {
  if (!this.changed.length) {
    callback.call(this);
    return;
  }

  var configurations = this.files.filter(function(pair) {
    return this.configurationLoader.matchPath(pair[0]);
  }, this).map(function(pair) {
    return this.newConfigurations[pair[0]] ||
      this.map.getResourceByPath(pair[0]);
  }, this);

  var trie = new ConfigurationTrie(configurations);

  // if resource was preloaded earlier just skip
  var paths = this.changed.filter(function(record) {
    return !record.newResource && record.newPath;
  }).map(function(r) {
    return r.path;
  });

  var task = new AnalyzeChangedTask(
    this.loaders,
    trie,
    {
      maxOpenFiles: this.maxOpenFiles,
      maxProcesses: this.maxProcesses
    });

  task.runOptimaly(paths, function(messages, resources, skipped) {
    this.messages.mergeAndRecycle(messages);
    resources = resources.filter(function(r) { return !!r; });
    resources.forEach(function(resource) {
      var record = this.changedPaths[resource.path];
      if (record) {
        resource.mtime = record.mtime;
        record.newResource = resource;
      }
    }, this);

    this.skipped = skipped;
    callback.call(this);
  }.bind(this));
};

MapUpdateTask.prototype.postProcess = function(callback) {
  var waiting = 0;
  var me = this;
  var toPostProcess = this.loaders.map(function() {
    return [];
  });
  var loaders = this.loaders;

  this.changed.forEach(function(record) {
    if (record.newResource) {
      for (var i = 0; i < loaders.length; i++) {
        if (loaders[i].matchPath(record.path)) {
          toPostProcess[i].push(record.newResource);
          break;
        }
      }
    }
  });

  function finished(messages) {
    me.messages.mergeAndRecycle(messages);
    if (--waiting === 0) {
      callback.call(me);
    }
  }
  waiting = toPostProcess.length;

  toPostProcess.forEach(function(resources, index) {
    loaders[index].postProcess(this.map, resources, finished);
  }, this);

  if (waiting === 0) {
    callback.call(this);
  }
};

/**
 * Update existing map with the changes
 * @param  {Function} callback
 */
MapUpdateTask.prototype.updateMap = function(callback) {
  this.changed.forEach(function(record) {
    if (!record.newPath) {
      this.map.removeResource(record.oldResource);
    } else if (record.newResource && record.oldResource) {
      this.map.updateResource(record.oldResource, record.newResource);
    } else if (record.newResource) {
      this.map.addResource(record.newResource);
    }
  }, this);
  callback.call(this);
};

module.exports = MapUpdateTask;
