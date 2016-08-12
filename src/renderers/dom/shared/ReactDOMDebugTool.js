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

var ReactDOMNullInputValuePropHook = require('ReactDOMNullInputValuePropHook');
var ReactDOMUnknownPropertyHook = require('ReactDOMUnknownPropertyHook');
var ReactDebugTool = require('ReactDebugTool');

var warning = require('warning');

var handlersForEvent = {};
var didHandlerThrowForEvent = {};

function callHandler(handler, event, arg1, arg2, arg3, arg4, arg5) {
  try {
    handler(arg1, arg2, arg3, arg4, arg5);
  } catch (e) {
    warning(
      didHandlerThrowForEvent[event],
      'Exception thrown by hook while handling %s: %s',
      event,
      e + '\n' + e.stack
    );
    didHandlerThrowForEvent[event] = true;
  }
}

function emitEvent(event, arg1, arg2, arg3, arg4, arg5) {
  var handlers = handlersForEvent[event];
  if (!handlers) {
    return;
  }
  for (var i = 0; i < handlers.length; i++) {
    var handler = handlers[i];
    callHandler(handler, event, arg1, arg2, arg3, arg4, arg5);
  }
}

var ReactDOMDebugTool = {
  addHook(hook) {
    ReactDebugTool.addHook(hook);

    for (var event in hook) {
      if (!hook.hasOwnProperty(event)) {
        continue;
      }

      var handler = hook[event];
      handlersForEvent[event] = handlersForEvent[event] || [];
      handlersForEvent[event].push(handler);
    }
  },
  removeHook(hook) {
    ReactDebugTool.removeHook(hook);

    for (var event in hook) {
      if (!hook.hasOwnProperty(event) || !handlersForEvent[event]) {
        continue;
      }

      var handler = hook[event];
      handlersForEvent[event] = handlersForEvent[event].filter(h =>
        h !== handler
      );
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
  onTestEvent() {
    emitEvent('onTestEvent');
  },
};

ReactDOMDebugTool.addHook(ReactDOMUnknownPropertyHook);
ReactDOMDebugTool.addHook(ReactDOMNullInputValuePropHook);

module.exports = ReactDOMDebugTool;
