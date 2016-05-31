/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMDebugTool
 */

'use strict';

var ReactDOMUnknownPropertyDevtool = require('ReactDOMUnknownPropertyDevtool');

var warning = require('warning');

var eventHandlers = [];
var handlerDoesThrowForEvent = {};

function emitEvent(handlerFunctionName, arg1, arg2, arg3, arg4, arg5) {
  if (__DEV__) {
    eventHandlers.forEach(function(handler) {
      try {
        if (handler[handlerFunctionName]) {
          handler[handlerFunctionName](arg1, arg2, arg3, arg4, arg5);
        }
      } catch (e) {
        warning(
          !handlerDoesThrowForEvent[handlerFunctionName],
          'exception thrown by devtool while handling %s: %s',
          handlerFunctionName,
          e.message
        );
        handlerDoesThrowForEvent[handlerFunctionName] = true;
      }
    });
  }
}

var ReactDOMDebugTool = {
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
  onCreateMarkupForProperty(name, value) {
    emitEvent('onCreateMarkupForProperty', name, value);
  },
  onSetValueForProperty(node, name, value) {
    emitEvent('onSetValueForProperty', node, name, value);
  },
  onDeleteValueForProperty(node, name) {
    emitEvent('onDeleteValueForProperty', node, name);
  },
};

ReactDOMDebugTool.addDevtool(ReactDOMUnknownPropertyDevtool);

module.exports = ReactDOMDebugTool;
