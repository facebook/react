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
var ReactDOMNodeMapping = require('ReactDOMNodeMapping');

var invariant = require('invariant');
var keyMirror = require('keyMirror');

var ELEMENT_NODE_TYPE = 1;

var numContainerIDs = 0;
var CONTAINER_ID_PREFIX = '.reactContainer.' + Date.now().toString(36) + '.';

var ReactDOMNodeHandleTypes = keyMirror({
  REACT_ID: null,
  REACT_ID_TOP_LEVEL: null,
  CONTAINER: null
});

var ReactDOMNodeHandle = {
  getHandleForReactID: function(reactID) {
    return {
      type: ReactDOMNodeHandleTypes.REACT_ID,
      reactID: reactID
    };
  },

  getHandleForReactIDTopLevel: function(reactID) {
    return {
      type: ReactDOMNodeHandleTypes.REACT_ID_TOP_LEVEL,
      reactID: reactID
    };
  },

  getHandleForContainer: function(domNode) {
    var id = domNode.id;
    if (!id || id.length === 0) {
      id = domNode.id = CONTAINER_ID_PREFIX + (numContainerIDs++);
    }
    return {
      type: ReactDOMNodeHandleTypes.CONTAINER,
      id: id
    };
  },

  resolveHandle: function(handle) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'Cannot resolveHandle() in a worker!'
    );


    if (handle.type === ReactDOMNodeHandleTypes.REACT_ID_TOP_LEVEL) {
      var container = ReactDOMNodeMapping.findReactContainerForID(handle.reactID);
      if (container) {
        return container.nodeType === ELEMENT_NODE_TYPE ?
          container.ownerDocument :
          container;
      }
      return null;
    } else if (handle.type === ReactDOMNodeHandleTypes.REACT_ID) {
      return ReactDOMNodeMapping.getNode(handle.reactID);
    } else {
      return document.getElementById(handle.id);
    }
  }
};

module.exports = ReactDOMNodeHandle;