/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMDebugToolDev
 */

'use strict';

var ReactDebugToolDev = require('ReactDebugToolDev');
var ReactDOMNullInputValuePropDevtoolDev = require('ReactDOMNullInputValuePropDevtoolDev');
var ReactDOMUnknownPropertyDevtoolDev = require('ReactDOMUnknownPropertyDevtoolDev');

var warning = require('warning');

var ReactDOMDebugToolDev = {};

if (__DEV__) {
  var eventHandlers = [];
  var handlerDoesThrowForEvent = {};

  var emitEvent = function(handlerFunctionName, arg1, arg2, arg3, arg4, arg5) {
    eventHandlers.forEach(function(handler) {
      try {
        if (handler[handlerFunctionName]) {
          handler[handlerFunctionName](arg1, arg2, arg3, arg4, arg5);
        }
      } catch (e) {
        warning(
          handlerDoesThrowForEvent[handlerFunctionName],
          'exception thrown by devtool while handling %s: %s',
          handlerFunctionName,
          e + '\n' + e.stack
        );
        handlerDoesThrowForEvent[handlerFunctionName] = true;
      }
    });
  };

  var ReactDOMDebugToolDev = {
    addDevtool(devtool) {
      ReactDebugToolDev.addDevtool(devtool);
      eventHandlers.push(devtool);
    },
    removeDevtool(devtool) {
      ReactDebugToolDev.removeDevtool(devtool);
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
    onTestEvent() {
      emitEvent('onTestEvent');
    },
  };

  ReactDOMDebugToolDev.addDevtool(ReactDOMUnknownPropertyDevtoolDev);
  ReactDOMDebugToolDev.addDevtool(ReactDOMNullInputValuePropDevtoolDev);
}

module.exports = ReactDOMDebugToolDev;
