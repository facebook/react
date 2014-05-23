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
 * @providesModule ReactDOMNodeHandleMapping
 * @typechecks static-only
 */

"use strict";

var ReactDOMNodeHandle = require('ReactDOMNodeHandle');
var ReactInstanceHandles = require('ReactInstanceHandles');

/** Mapping from reactRootID to React component instance. */
var instancesByReactRootID = {};

/** inverse of above */
var reactRootIDByContainerKey = {};

/**
 * @param {object} container DOM node handle that may contain a React component.
 * @return {?string} A "reactRoot" ID, if a React component is rendered.
 */
function getReactRootID(containerHandle) {
  return reactRootIDByContainerKey[
    ReactDOMNodeHandle.getKey(containerHandle)
  ];
}

var ReactDOMNodeHandleMapping = {
  /** Exposed for debugging purposes **/
  _instancesByReactRootID: instancesByReactRootID,

  getReactRootID: getReactRootID,

  /**
   * Register a component into the instance map and starts scroll value
   * monitoring
   * @param {ReactComponent} nextComponent component instance to render
   * @param {object} containerHandle container to render into
   * @param {string} forceReactRootID reactRootID to use (rather than generating one)
   * @return {string} reactRoot ID prefix
   */
  registerComponent: function(nextComponent, containerHandle, forceReactRootID) {
    var reactRootID = ReactDOMNodeHandleMapping.registerContainer(
      containerHandle,
      forceReactRootID
    );
    instancesByReactRootID[reactRootID] = nextComponent;
    return reactRootID;
  },

  /**
   * Registers a container node into which React components will be rendered.
   * This also creates the "reactRoot" ID that will be assigned to the element
   * rendered within.
   *
   * @param {object} containerHandle DOM node handle to register as a container.
   * @param {string} forceReactRootID reactRootID to use (rather than generating one)
   * @return {string} The "reactRoot" ID of elements rendered within.
   */
  registerContainer: function(containerHandle, forceReactRootID) {
    var reactRootID = forceReactRootID || getReactRootID(containerHandle);
    if (reactRootID) {
      // If one exists, make sure it is a valid "reactRoot" ID.
      reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);
    }
    if (!reactRootID) {
      // No valid "reactRoot" ID found, create one.
      reactRootID = ReactInstanceHandles.createReactRootID();
    }
    reactRootIDByContainerKey[
      ReactDOMNodeHandle.getKey(containerHandle)
    ] = reactRootID;
    return reactRootID;
  },

  /**
   * Unmounts and destroys the React component rendered in the `container`.
   *
   * @param {object} containerHandle DOM node handle containing a React component.
   * @return {?string} reactRootID that was just unmounted or null if no component is there.
   */
  unmountComponentAtNode: function(containerHandle) {
    var reactRootID = getReactRootID(containerHandle);
    var component = instancesByReactRootID[reactRootID];

    if (!component) {
      return null;
    }
    delete instancesByReactRootID[reactRootID];

    component.unmountComponent();
    return reactRootID;
  },

  getInstanceFromContainer: function(containerHandle) {
    return instancesByReactRootID[getReactRootID(containerHandle)];
  }
};

module.exports = ReactDOMNodeHandleMapping;
