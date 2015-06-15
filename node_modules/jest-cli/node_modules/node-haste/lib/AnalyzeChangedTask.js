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
var MessageList = require('./MessageList');

function AnalyzeChangedTask(loaders, configurationTrie, options) {
  this.loaders = loaders;
  this.configurationTrie = configurationTrie;
  this.maxOpenFiles = options && options.maxOpenFiles || 200;
  this.maxProcesses = options && options.maxProcesses || 4;
}

AnalyzeChangedTask.fromObject = function(object) {
  var ResourceLoader = require('./loader/ResourceLoader');
  var loaders = object.loaders.map(ResourceLoader.fromObject, this);
  var ConfigurationTrie = require('./ConfigurationTrie');
  var trie = new ConfigurationTrie.fromObject(object.trie);
  return new AnalyzeChangedTask(loaders, trie, {
    maxOpenFiles: object.maxOpenFiles
  });
};

AnalyzeChangedTask.prototype.toObject = function() {
  return {
    loaders: this.loaders.map(function(l) {
      return l.toObject();
    }),
    trie: this.configurationTrie.toObject(),
    maxOpenFiles: this.maxOpenFiles
  };
};

AnalyzeChangedTask.prototype.runInForks = function(n, paths, callback) {
  var buckets = [];
  var waiting = n;
  for (var i = 0; i < n; i++) {
    buckets[i] = [];
  }
  paths.forEach(function(p, i) {
    buckets[i % n].push(p);
  });

  var skipped = [];
  var messages = MessageList.create();
  var resources = [];
  var complete = function() {
    if (--waiting === 0) {
      callback(messages, resources, skipped);
    }
  };

  var typeMap = {};
  this.loaders.forEach(function(loader) {
    loader.getResourceTypes().forEach(function(type) {
      typeMap[type.prototype.type] = type;
    });
  });

  var cp = require('child_process');
  buckets.forEach(function() {
    var child = cp.fork(__dirname + '/analyze-changed.js', [], {
      // Passing --debug to child processes interferes with the --debug socket
      // of the parent process.
      execArgv: process.execArgv.filter(function(arg) {
        return arg.indexOf('--debug') === -1;
      })
    });


    child.on('message', function(m) {
      messages.mergeAndRecycle(MessageList.fromObject(m.messages));
      m.resources.forEach(function(obj) {
        var type = typeMap[obj.type];
        resources.push(type.fromObject(obj));
      });
      skipped = skipped.concat(m.skipped);
      if (paths.length === 0) {
        child.send({ exit: 1 });
        complete();
      } else {
        var chunkSize = Math.min(
          this.maxOpenFiles,
          Math.ceil(paths.length / n));
        child.send({ paths: paths.splice(0, chunkSize) });
      }
    }.bind(this));

    child.send({
      task: this.toObject(),
      paths: paths.splice(0, this.maxOpenFiles)
    });
  }, this);
};

AnalyzeChangedTask.prototype.runOptimaly = function(paths, callback) {
  var n = Math.min(
    this.maxProcesses,
    Math.floor(paths.length / this.maxOpenFiles));
  if (n > 1) {
    this.runInForks(n, paths, callback);
  } else {
    this.run(paths, callback);
  }
};

AnalyzeChangedTask.prototype.run = function(paths, callback) {
  var trie = this.configurationTrie;
  var loaders = this.loaders;
  var maxOpenFiles = this.maxOpenFiles;

  var messages = MessageList.create();
  var waiting = paths.length;
  var active = 0;
  var next;
  var result = [];
  var skipped = [];

  function resourceLoaded(m, resource) {
    messages.mergeAndRecycle(m);
    result.push(resource);
    waiting--;
    active--;
    next();
  }

  next = function() {
    var node_path = require('path');
    while (active < maxOpenFiles && paths.length) {
      var path = paths.shift();
      var loader = null;

      for (var i = 0; i < loaders.length; i++) {
        if (loaders[i].matchPath(path)) {
          loader = loaders[i];
          break;
        }
      }

      if (loader) {
        active++;
        var configuration = trie.findConfiguration(node_path.normalize(path));
        loader.loadFromPath(path, configuration, resourceLoaded);
      } else {
        // if we reached this point the resource was not analyzed because of the
        // missing type
        skipped.push(path);
        waiting--;
      }
    }
    if (waiting === 0 && paths.length === 0) {
      callback(messages, result, skipped);
    }
  };

  next();
};

module.exports = AnalyzeChangedTask;
