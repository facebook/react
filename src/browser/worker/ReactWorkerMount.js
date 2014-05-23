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
 * @providesModule ReactWorkerMount
 */

"use strict";

var ReactDOMNodeHandle = require('ReactDOMNodeHandle');
var ReactDOMNodeHandleMapping = require('ReactDOMNodeHandleMapping');
var ReactDOMNodeMappingRemote = require('ReactDOMNodeMappingRemote');
var ReactPerf = require('ReactPerf');

var instantiateReactComponent = require('instantiateReactComponent');
var invariant = require('invariant');
var shouldUpdateReactComponent = require('shouldUpdateReactComponent');

var ReactWorkerMount = {
  /**
   * Render a new component into the DOM.
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @param {boolean} shouldReuseMarkup if we should skip the markup insertion
   * @return {ReactComponent} nextComponent
   */
  _renderNewRootComponent: ReactPerf.measure(
    'ReactMount',
    '_renderNewRootComponent',
    function(
        nextComponent,
        containerHandle,
        shouldReuseMarkup) {
      var componentInstance = instantiateReactComponent(nextComponent);

      ReactDOMNodeMappingRemote.registerContainerHandle(containerHandle);

      var reactRootID = ReactDOMNodeHandleMapping.registerComponent(
        componentInstance,
        containerHandle
      );

      ReactDOMNodeMappingRemote.registerComponentInContainer(
        reactRootID,
        containerHandle
      );

      componentInstance.mountComponentIntoNode(
        reactRootID,
        containerHandle,
        shouldReuseMarkup
      );

      return componentInstance;
    }
  ),

  /**
   * Renders a React component into the DOM in the supplied `container`.
   *
   * If the React component was previously rendered into `container`, this will
   * perform an update on it and only mutate the DOM as necessary to reflect the
   * latest React component.
   *
   * @param {ReactDescriptor} nextDescriptor Component descriptor to render.
   * @param {DOMElement} container DOM element to render into.
   * @param {?function} callback function triggered on completion
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  renderComponent: function(nextDescriptor, containerID, callback) {
    var containerHandle = ReactDOMNodeHandle.getHandleForContainerID(
      containerID
    );

    var prevComponent = ReactDOMNodeHandleMapping.getInstanceFromContainer(containerHandle);

    if (prevComponent) {
      var prevDescriptor = prevComponent._descriptor;
      if (shouldUpdateReactComponent(prevDescriptor, nextDescriptor)) {
        return ReactWorkerMount._updateRootComponent(
          prevComponent,
          nextDescriptor,
          containerHandle,
          callback
        );
      } else {
        ReactWorkerMount.unmountComponentAtHandle(containerHandle);
      }
    }

    var component = ReactWorkerMount._renderNewRootComponent(
      nextDescriptor,
      containerHandle,
      false // TODO: figure out hwo to reuse markup from a worker
    );
    callback && callback.call(component);
    return component;
  },

  _updateRootComponent: function(
      prevComponent,
      nextComponent,
      containerHandle,
      callback) {
    var nextProps = nextComponent.props;
    prevComponent.replaceProps(nextProps, callback);

    return prevComponent;
  },

  unmountComponentAtHandle: function(handle) {
    ReactDOMNodeMappingRemote.unmountComponentAtHandle(handle);
  },

  /**
   * This is a hook provided to support rendering React components while
   * ensuring that the apparent scroll position of its `container` does not
   * change.
   *
   * @param {DOMElement} container The `container` being rendered into.
   * @param {function} renderCallback This must be called once to do the render.
   */
  scrollMonitor: function(containerHandle, renderCallback) {
    renderCallback();
  }
};

module.exports = ReactWorkerMount;
