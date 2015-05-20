/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
* @providesModule ReactDataTracker
*/
'use strict';

// TODO: Using the ES6 Polyfill
// Using expando properties might be a possibility, but I opted away from this because:
//  1.  This code isn't production-ready yet anyway, this code is mostly to demo purposes
//  2.  New browsers support ES6 maps, so this only has perf ramifications on legacy browsers
//  3.  Perhaps most importantly: The data entities are user data objects, meaning that
//      they could be frozen, or iterated over, or any number of other edge cases that
//      would make adding expando properties a fairly unfriendly thing to do.
var Es6Map = (typeof Map !== 'undefined' ? Map : require('es6-collections').Map);

var ReactDataTracker = function(dataFunction) {
  var tracker = {
    _cacheValid: false,
    _cachedResult: undefined,
    _dataFunction: dataFunction,
    read: function() {
      ReactDataTracker.startRead();
      ReactDataTracker.endRead();
      if (!tracker._cacheValid) {
        ReactDataTracker.startRender(tracker);
        tracker._cachedResult = tracker._dataFunction();
        ReactDataTracker.endRender(tracker);
        tracker._cacheValid = true;
      }
      return tracker._cachedResult;
    },
    setCallback: function(callback) {
      tracker._callback = callback;
    },
    destroy: function() {
      ReactDataTracker.unmount(tracker);
    }
  };
  return tracker;
};

ReactDataTracker.startRender = function(component) {
    ReactDataTracker.currentContext = [];
    if (ReactDataTracker.listeners === undefined) {
      ReactDataTracker.listeners = new Es6Map();
    }
    if (ReactDataTracker.dataSources === undefined) {
      ReactDataTracker.dataSources = new Es6Map();
    }
    if (!ReactDataTracker.dataSources.has(component)) {
      ReactDataTracker.dataSources.set(component, []);
    }
  };

ReactDataTracker.endRender = function(component) {
    var oldDataSources = ReactDataTracker.dataSources.get(component);
    var newDataSources = ReactDataTracker.currentContext;
    var index = 0;

    for (index = 0; index < oldDataSources.length; index++) {
      if (newDataSources.indexOf(oldDataSources[index]) === -1) {
        var oldListeners = ReactDataTracker.listeners.get(oldDataSources[index]);
        oldListeners.splice(oldListeners.indexOf(component), 1);
        oldDataSources.splice(index, 1);
        index--;
      }
    }
    for (index = 0; index < newDataSources.length; index++) {
      if (oldDataSources.indexOf(newDataSources[index]) === -1) {
        if (!ReactDataTracker.listeners.has(newDataSources[index])) {
          ReactDataTracker.listeners.set(newDataSources[index], []);
        }
        ReactDataTracker.listeners.get(newDataSources[index]).push(component);
        ReactDataTracker.dataSources.get(component).push(newDataSources[index]);
      }
    }
  };

ReactDataTracker.startRead = function(entity) {
    if (ReactDataTracker.activeReaders === undefined) {
      ReactDataTracker.activeReaders = 0;
    }
    ReactDataTracker.activeReaders++;
  };

ReactDataTracker.endRead = function(entity) {
    if (ReactDataTracker.currentContext !== undefined && ReactDataTracker.currentContext.indexOf(entity) === -1) {
      ReactDataTracker.currentContext.push(entity);
    }
    ReactDataTracker.activeReaders--;
    if (ReactDataTracker.activeReaders < 0) {
      throw new Error('Number of active readers dropped below zero');
    }
  };

ReactDataTracker.startWrite = function(entity) {
    if (ReactDataTracker.writers === undefined) {
      ReactDataTracker.writers = [];
    }
    if (ReactDataTracker.writers.indexOf(entity) === -1) {
      ReactDataTracker.writers.push(entity);
    }
    if (ReactDataTracker.activeWriters === undefined) {
      ReactDataTracker.activeWriters = 0;
    }
    ReactDataTracker.activeWriters++;
  };

ReactDataTracker.endWrite = function(entity) {
    if (ReactDataTracker.activeWriters === undefined) {
      throw new Error('Can not end write without starting write');
    }
    if (ReactDataTracker.writers.indexOf(entity) === -1) {
      throw new Error('Can not end write without starting write');
    }
    ReactDataTracker.activeWriters--;

    if (ReactDataTracker.activeWriters === 0) {
      // for each writer that wrote during this batch
      var componentsToNotify = [];
      for (var writerIndex = 0; writerIndex < ReactDataTracker.writers.length; writerIndex++) {
        var writer = ReactDataTracker.writers[writerIndex];
        if (ReactDataTracker.listeners === undefined) {
          continue;
        }
        if (!ReactDataTracker.listeners.has(writer)) {
          continue;
        }
        var listenersList = ReactDataTracker.listeners.get(writer);
        for (var index = 0; index < listenersList.length; index++) {
          if (componentsToNotify.indexOf(listenersList[index]) === -1) {
            componentsToNotify.push(listenersList[index]);
          }
        }
      }

      for (var componentIndex = 0; componentIndex < componentsToNotify.length; componentIndex++) {
        var component = componentsToNotify[componentIndex];
        var invokeCallback = component._cacheValid && component._callback !== undefined;
        component._cacheValid = false; // Invalidate cache before calling callback
        if (invokeCallback) {
          component._callback();
        }
      }
      ReactDataTracker.writers = [];
    }
  };

ReactDataTracker.unmount = function(component) {
    var oldDataSources = ReactDataTracker.dataSources.get(component);
    if (oldDataSources === undefined) {
      return;
    }
    for (var index = 0; index < oldDataSources.length; index++) {
      var entityListeners = ReactDataTracker.listeners.get(oldDataSources[index]);
      var entityListenerPosition = entityListeners.indexOf(component);
      if (entityListenerPosition > -1) {
        entityListeners.splice(entityListeners.indexOf(component), 1);
      } else {
        throw new Error('Unable to find listener when unmounting component');
      }
    }
    ReactDataTracker.dataSources.delete(component);
  };

module.exports = ReactDataTracker;
