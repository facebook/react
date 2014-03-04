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
 * @providesModule ReactDOMNodeHandle
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');
var ReactMount = require('ReactMount');

var invariant = require('invariant');
var keyMirror = require('keyMirror');

var ELEMENT_NODE_TYPE = 1;

var ReactDOMNodeHandle = {
  getHandleForReactID: function(reactID) {
    return {
      reactID: reactID,
      topLevel: false
    };
  },

  getHandleForReactIDTopLevel: function(reactID) {
    return {
      reactID: reactID,
      topLevel: true
    };
  },

  resolveHandle: function(handle) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'Cannot resolveHandle() in a worker!'
    );


    if (handle.topLevel) {
      var container = ReactMount.findReactContainerForID(handle.reactID);
      if (container) {
        return container.nodeType === ELEMENT_NODE_TYPE ?
          container.ownerDocument :
          container;
      }
      return null;
    }
    return ReactMount.getNode(handle.reactID);
  }
};

module.exports = ReactDOMNodeHandle;