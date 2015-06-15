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
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var loaders = require('./loaders');
var fs = require('fs');

var MapUpdateTask = require('./MapUpdateTask');
var ResourceMap = require('./ResourceMap');
var ResourceMapSerializer = require('./ResourceMapSerializer');
var FileFinder = require('./FileFinder');

var ProjectConfigurationLoader = loaders.ProjectConfigurationLoader;

/*
 *
 *                             ____________________________
 *                                                           .OOo
 *                                                           OOOOL
 *                                  __________________    .. JOOO?
 *                                                     .eSSSSSS**'
 *                                                   gSSSSSSSSSS    6.
 *                                                   oo  SSSSSSSs  .G
 *                                      ___________   oo SSSSSSSSSgG
 *                                                     *ISSSSSS  **
 *                                                      SSSSSSS
 *                                                    .oYSSSSSY.
 *                                                    OOOOOOOOOOOg
 *                                                   .OOOOT**TOOOOO.
 *                        ______________________    .OOOO'     'OOOOO.
 *                                                 .OOOO'         OOOO'
 *                                              .oOOOO*        .OOOO*
 *                                            .OOOOO''       .OOOOO
 *                                         .JOOOO*         .##OOO'
 *                                        C##?/             T##I
 *                                         Y#|                'V
 *    Node Haste ________________________   C
 *
 */

/**
 * @class Haste. A nice facade to node-haste system
 *
 * Running a node haste update task is a pretty complicated matter. You have
 * to manually create a FileFinder, a MapUpdateTask, a ResourceMapSerializer.
 * Haste class automates all of this providing a task oriented API with a
 * broad set of configuration options. The only 2 required parameters are
 * loaders and scanDirs
 *
 * @extends {EventEmitter}
 *
 * @example
 *   var Haste = require('node-haste/Haste');
 *   var loaders = require('node-haste/loaders');
 *
 *   var haste = new Haste(
 *   [
 *     new loaders.JSLoader({ networkSize: true }),
 *     new loaders.CSSLoader({ networkSize: true }),
 *     new ProjectConfigurationLoader(),
 *     new ResourceLoader()
 *   ],
 *   ['html']);
 *
 *   haste.update('.cache', function(map) {
 *     assert(map instanceof ResourceMap);
 *   });
 *
 *
 * @param {Array.<Loader>}  loaders              Preconfigured Loader instances
 * @param {Array.<String>}  scanDirs
 * @param {FileFinder|null} options.finder       Custom finder instance
 * @param {ResourceMapSerializer|null} options.serializer Custom serializer
 * @param {Number|null}   options.maxOpenFiles   Maximum number of loaders
 *                                               MapUpdateTask can use
 * @param {Number|null}   options.maxProcesses   Maximum number of loader forks
 *                                               MapUpdateTask can use
 * @param {Boolean|null}  options.useNativeFind  Whether to use native shell
 *                                               find command (faster) or node
 *                                               implementation (safer)
 * @param {function|null} options.ignorePaths    Function to reject paths
 * @param {String|null}   options.version        Version of the cache. If
 *                                               the version mismatches the
 *                                               cached on, cache will be
 *                                               ignored
 *
 */
function Haste(loaders, scanDirs, options) {
  EventEmitter.call(this);

  this.loaders = loaders;
  this.scanDirs = scanDirs;
  this.options = options || {};
  this.finder = this.options.finder || null;
  this.serializer = this.options.serializer || null;
}
inherits(Haste, EventEmitter);

/**
 * All in one function:
 *  1) load cache if exists
 *  2) compare to the existing files
 *  3) analyze changes,
 *  4) update map,
 *  5) write cache back to disk
 *  6) return map
 *
 * @param  {String}   path
 * @param  {Function} callback
 */
Haste.prototype.update = function(path, callback, options) {
  var map, files;
  var me = this;

  var run = function() {
    if (!map || !files) {
      return;
    }
    var task = me.createUpdateTask(files, map).on('complete', function(map) {
      // only store map if it's changed
      var mapChanged = task.changed.length > task.skipped.length;
      if (mapChanged) {
        me.storeMap(path, map, function() {
          me.emit('mapStored');
          callback(map, task.messages);
        });
      } else {
        callback(map, task.messages);
      }
    }).run();
  }

  this.getFinder().find(function(f) {
    files = f;
    me.emit('found', files);
    run();
  });

  if (options && options.forceRescan) {
    map = new ResourceMap();
  } else {
    this.loadOrCreateMap(path, function(m) {
      map = m;
      me.emit('mapLoaded');
      run();
    });
  }
};

/**
 * Same as update but will also rerun the update every time something changes
 *
 * TODO: (voloko) add support for inotify and FSEvent instead of constantly
 * running finder
 *
 * @param  {String}   path
 * @param  {Function} callback
 * @param  {Number}   options.timeout How often to rerun finder
 * @param  {Boolean}  options.forceRescan
 */
Haste.prototype.watch = function(path, callback, options) {
  var timeout = options && options.timeout || 1000;
  var finder = this.getFinder();
  var map, files, task;
  var me = this;
  var firstRun = true;

  function find() {
    finder.find(function(f) {
      files = f;
      if (map) {
        update();
      }
    });
  }

  function updated(m) {
    map = m;
    var mapChanged = task.changed.length > task.skipped.length;
    // if changed, store the map and only then callback and schedule next run
    if (mapChanged) {
      me.storeMap(path, map, function() {
        callback(map, task.changed, task.messages);
        setTimeout(find, timeout);
      });
      return;
    }

    // callback on the first run even if the map is unchanged
    if (firstRun) {
      firstRun = false;
      callback(map, task.changed, task.messages);
    }
    setTimeout(find, timeout);
  }

  function update() {
    task = me.createUpdateTask(files, map).on('complete', updated).run();
  }

  if (options && options.forceRescan) {
    map = new ResourceMap();
  } else {
    this.loadOrCreateMap(path, function(m) {
      map = m;
      if (files) {
        update();
      }
    });
  }

  find();
};

/**
 * Updates a map using the configuration options from constructor
 * @param  {ResourceMap}   map
 * @param  {Function} callback
 */
Haste.prototype.updateMap = function(map, callback) {
  this.getFinder().find(function(files) {
     this.createUpdateTask(files, map).on('complete', callback).run();
  }.bind(this));
};

/**
 * Loads map from a file
 * @param  {String}   path
 * @param  {Function} callback
 */
Haste.prototype.loadMap = function(path, callback) {
  this.getSerializer().loadFromPath(path, callback);
};

/**
 * @param  {String}   path
 * @return  {ResourceMap|null}
 */
Haste.prototype.loadMapSync = function(path) {
  return this.getSerializer().loadFromPathSync(path);
};

/**
 * Loads map from a file or creates one if cache is not available
 * @param  {String}   path
 * @param  {Function} callback
 */
Haste.prototype.loadOrCreateMap = function(path, callback) {
  this.getSerializer().loadFromPath(path, function(err, map) {
    callback(map || new ResourceMap());
  });
};

/**
 * @param  {String}   path
 * @return  {ResourceMap}
 */
Haste.prototype.loadOrCreateMapSync = function(path) {
  return this.loadMapSync(path) || new ResourceMap();
};

/**
 * Stores the map cache
 * @param  {String}   path
 * @param  {ResourceMap}   map
 * @param  {Function} callback
 */
Haste.prototype.storeMap = function(path, map, callback) {
  this.getSerializer().storeToPath(path, map, callback);
};



/**
 * @protected
 * @param {ResourceMap} map
 * @return {MapUpdateTask}
 */
Haste.prototype.createUpdateTask = function(files, map) {
  var task = new MapUpdateTask(
    files,
    this.loaders,
    map,
    {
      maxOpenFiles: this.options.maxOpenFiles,
      maxProcesses: this.options.maxProcesses
    });

  var events =
    ['found', 'changed', 'analyzed', 'mapUpdated', 'postProcessed', 'complete'];
  var me = this;
  events.forEach(function(name) {
    task.on(name, function(value) {
      me.emit(name, value);
    });
  });
  return task;
};

/**
 * @protected
 * @return {FileFinder}
 */
Haste.prototype.getFinder = function() {
  if (!this.finder) {
    var ext = {};
    this.loaders.forEach(function(loader) {
      loader.getExtensions().forEach(function(e) {
        ext[e] = true;
      });
    });
    this.finder = new FileFinder({
      scanDirs: this.scanDirs,
      extensions: Object.keys(ext),
      useNative: this.options.useNativeFind,
      ignore: this.options.ignorePaths
    });
  }
  return this.finder;
};

/**
 * @protected
 * @return {ResourceMapSerializer}
 */
Haste.prototype.getSerializer = function() {
  return this.serializer || new ResourceMapSerializer(
    this.loaders,
    { version: this.options.version });
};

module.exports = Haste;
