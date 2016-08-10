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

var hooks = [];
var didHookThrowForEvent = {};

function callHook(event, fn, context, arg1, arg2, arg3, arg4, arg5) {
  try {
    fn.call(context, arg1, arg2, arg3, arg4, arg5);
  } catch (e) {
    warning(
      didHookThrowForEvent[event],
      'Exception thrown by hook while handling %s: %s',
      event,
      e + '\n' + e.stack
    );
    didHookThrowForEvent[event] = true;
  }
}

function emitEvent(event, arg1, arg2, arg3, arg4, arg5) {
  for (var i = 0; i < hooks.length; i++) {
    var hook = hooks[i];
    var fn = hook[event];
    if (fn) {
      callHook(event, fn, hook, arg1, arg2, arg3, arg4, arg5);
    }
  }
}

var ReactDOMDebugTool = {
  addHook(hook) {
    ReactDebugTool.addHook(hook);
    hooks.push(hook);
  },
  removeHook(hook) {
    ReactDebugTool.removeHook(hook);
    for (var i = 0; i < hooks.length; i++) {
      if (hooks[i] === hook) {
        hooks.splice(i, 1);
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
  onTestEvent() {
    emitEvent('onTestEvent');
  },
};

ReactDOMDebugTool.addHook(ReactDOMUnknownPropertyHook);
ReactDOMDebugTool.addHook(ReactDOMNullInputValuePropHook);

module.exports = ReactDOMDebugTool;
