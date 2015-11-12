/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMDevtools
 */

'use strict';

var warning = require('warning');

var eventHandlers = [];
var handlerDoesThrowForEvent = {};

var ReactDOMDevtools = {
  addDevtool(devtool) {
    eventHandlers.push(devtool);
  },

  removeDevtool(devtool) {
    for (var i = 0; i < eventHandlers.length; i++) {
      if (eventHandlers[i] === devtool) {
        eventHandlers.splice(i, 1);
        i--;
      }
    }
  },

  emitEvent(eventName, eventData) {
    if (__DEV__) {
      eventHandlers.forEach(function(handler) {
        try {
          handler.handleEvent(eventName, eventData);
        } catch (e) {
          warning(
            !handlerDoesThrowForEvent[eventName],
            'exception thrown by devtool while handling %s: %s',
            eventName,
            e.message
          );
          handlerDoesThrowForEvent[eventName] = true;
        }
      });
    }
  },
};

module.exports = ReactDOMDevtools;
