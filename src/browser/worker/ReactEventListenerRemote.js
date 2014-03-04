/**
 * Copyright 2013-2014 Facebook, Inc.
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
 *
 * @providesModule ReactEventListenerRemote
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');
var RemoteModule = require('RemoteModule');

var copyProperties = require('copyProperties');
var emptyFunction = require('emptyFunction');
var keyOf = require('keyOf');

var enabled = true;

var ReactEventListenerRemote = new RemoteModule(
  ExecutionEnvironment.global,
  keyOf({ReactEventListener: null}),
  {
    monitorScrollValue: null,
    setEnabled: null,
    trapBubbledEvent: null,
    trapCapturedEvent: null
  }
);

var _setEnabled = ReactEventListenerRemote.setEnabled;

copyProperties(ReactEventListenerRemote, {
  setEnabled: function(value) {
    enabled = value;
    _setEnabled(value);
  },

  isEnabled: function() {
    return enabled;
  },

  // This is handled by RemoteModuleServer
  setHandleTopLevel: emptyFunction
});

module.exports = ReactEventListenerRemote;
