/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TransitionUtils
 */

'use strict';

var mountListeners = [];
var updateListeners = [];

/**
 * Notify all listeners within the instance's sub-array.
 *
 * @param {array} listeners
 * @param {array} args
 */
function notify(listeners, args) {
  var inst = args[0];
  var instListeners = listeners[inst._rootNodeID] || [];

  if (!instListeners.length) {
    return;
  }

  instListeners.forEach(listener => listener.apply(listener, args));
}

/**
 * Remove a listener from an instance's sub-array.
 *
 * @param {array} listeners
 * @param {ReactDOMComponent} inst
 * @param {function} callback
 */
function remove(listeners, inst, callback) {
  var instListeners = listeners[inst._rootNodeID] || [];
  var index = -1;

  if (!instListeners.length) {
    return;
  }

  for (var i = 0; i < instListeners.length; i++) {
    if (instListeners[i] === callback) {
      index = i;
      break;
    }
  }

  if (index !== -1) {
    instListeners.splice(index, 1);
  }
}

var TransitionUtils = {
  /**
   * Add a listener that is notified when a component mounts.
   *
   * @param {ReactDOMComponent} inst
   * @param {function} callback
   */
  monitorMount: function(inst, callback) {
    var listeners = mountListeners[inst._rootNodeID] || [];
    listeners.push(callback);

    updateListeners[inst._rootNodeID] = listeners;
  },

  /**
   * Add a listener that is notified when a component updates.
   *
   * @param {ReactDOMComponent} inst
   * @param {function} callback
   */
  monitorUpdate: function(inst, callback) {
    var listeners = updateListeners[inst._rootNodeID] || [];
    listeners.push(callback);

    updateListeners[inst._rootNodeID] = listeners;
  },

  /**
   * Notifies all listeners about a mount.
   */
  notifyMount: function() {
    notify(mountListeners, [this]);
  },

  /**
   * Notifies all listeners about an update.
   *
   * @param {object} prevProps
   * @param {object} nextProps
   */
  notifyUpdate: function(prevProps, nextProps) {
    notify(updateListeners, [this, prevProps, nextProps]);
  },

  /**
   * Removes a listener from the mount list.
   *
   * @param {ReactDOMComponent} inst
   * @param {function} callback
   */
  unmonitorMount: function(inst, callback) {
    remove(mountListeners, inst, callback);
  },

  /**
   * Removes a listener from the update list.
   *
   * @param {ReactDOMComponent} inst
   * @param {function} callback
   */
  unmonitorUpdate: function(inst, callback) {
    remove(updateListeners, inst, callback);
  },
};

module.exports = TransitionUtils;
