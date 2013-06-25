/**
 * Copyright 2013 Facebook, Inc.
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
 * @providesModule ReactMount
 */

"use strict";

var ReactEventEmitter = require('ReactEventEmitter');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactEventTopLevelCallback = require('ReactEventTopLevelCallback');
var ReactID = require('ReactID');

var $ = require('$');

/** Mapping from reactRoot DOM ID to React component instance. */
var instanceByReactRootID = {};

/** Mapping from reactRoot DOM ID to `container` nodes. */
var containersByReactRootID = {};

/**
 * @param {DOMElement} container DOM element that may contain a React component
 * @return {?*} DOM element that may have the reactRoot ID, or null.
 */
function getReactRootElementInContainer(container) {
  return container && container.firstChild;
}

/**
 * @param {DOMElement} container DOM element that may contain a React component.
 * @return {?string} A "reactRoot" ID, if a React component is rendered.
 */
function getReactRootID(container) {
  var rootElement = getReactRootElementInContainer(container);
  return rootElement && ReactID.getID(rootElement);
}

/**
 * Mounting is the process of initializing a React component by creatings its
 * representative DOM elements and inserting them into a supplied `container`.
 * Any prior content inside `container` is destroyed in the process.
 *
 *   ReactMount.renderComponent(component, $('container'));
 *
 *   TODO Update this comment when ReactID.ATTR_NAME changes.
 *   <div id="container">         <-- Supplied `container`.
 *     <div id=".reactRoot[3]">   <-- Rendered reactRoot of React component.
 *       // ...
 *     </div>
 *   </div>
 *
 * Inside of `container`, the first element rendered is the "reactRoot".
 */
var ReactMount = {

  /** Time spent generating markup. */
  totalInstantiationTime: 0,

  /** Time spent inserting markup into the DOM. */
  totalInjectionTime: 0,

  /** Whether support for touch events should be initialized. */
  useTouchEvents: false,

  /**
   * This is a hook provided to support rendering React components while
   * ensuring that the apparent scroll position of its `container` does not
   * change.
   *
   * @param {DOMElement} container The `container` being rendered into.
   * @param {function} renderCallback This must be called once to do the render.
   */
  scrollMonitor: function(container, renderCallback) {
    renderCallback();
  },

  /**
   * Ensures that the top-level event delegation listener is set up. This will
   * be invoked some time before the first time any React component is rendered.
   *
   * @param {object} TopLevelCallbackCreator
   * @private
   */
  prepareTopLevelEvents: function(TopLevelCallbackCreator) {
    ReactEventEmitter.ensureListening(
      ReactMount.useTouchEvents,
      TopLevelCallbackCreator
    );
  },

  /**
   * Take a component that's already mounted into the DOM and replace its props
   * @param {ReactComponent} prevComponent component instance already in the DOM
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   */
  _updateRootComponent: function(prevComponent, nextComponent, container) {
    var nextProps = nextComponent.props;
    ReactMount.scrollMonitor(container, function() {
      prevComponent.replaceProps(nextProps);
    });
    return prevComponent;
  },

  /**
   * Register a component into the instance map and start the events system.
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @return {string} reactRoot ID prefix
   */
  _registerComponent: function(nextComponent, container) {
    ReactMount.prepareTopLevelEvents(ReactEventTopLevelCallback);

    var reactRootID = ReactMount.registerContainer(container);
    instanceByReactRootID[reactRootID] = nextComponent;
    return reactRootID;
  },

  /**
   * Render a new component into the DOM.
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @param {boolean} shouldReuseMarkup if we should skip the markup insertion
   * @return {ReactComponent} nextComponent
   */
  _renderNewRootComponent: function(
      nextComponent,
      container,
      shouldReuseMarkup) {
    var reactRootID = ReactMount._registerComponent(nextComponent, container);
    nextComponent.mountComponentIntoNode(
      reactRootID,
      container,
      shouldReuseMarkup
    );
    return nextComponent;
  },

  /**
   * Renders a React component into the DOM in the supplied `container`.
   *
   * If the React component was previously rendered into `container`, this will
   * perform an update on it and only mutate the DOM as necessary to reflect the
   * latest React component.
   *
   * @param {ReactComponent} nextComponent Component instance to render.
   * @param {DOMElement} container DOM element to render into.
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  renderComponent: function(nextComponent, container) {
    var registeredComponent = instanceByReactRootID[getReactRootID(container)];

    if (registeredComponent) {
      if (registeredComponent.constructor === nextComponent.constructor) {
        return ReactMount._updateRootComponent(
          registeredComponent,
          nextComponent,
          container
        );
      } else {
        ReactMount.unmountAndReleaseReactRootNode(container);
      }
    }

    var reactRootElement = getReactRootElementInContainer(container);
    var containerHasReactMarkup =
      reactRootElement &&
        ReactInstanceHandles.isRenderedByReact(reactRootElement);

    var shouldReuseMarkup = containerHasReactMarkup && !registeredComponent;

    return ReactMount._renderNewRootComponent(
      nextComponent,
      container,
      shouldReuseMarkup
    );
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into the supplied `container`.
   *
   * @param {function} constructor React component constructor.
   * @param {?object} props Initial props of the component instance.
   * @param {DOMElement} container DOM element to render into.
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  constructAndRenderComponent: function(constructor, props, container) {
    return ReactMount.renderComponent(constructor(props), container);
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into a container node identified by supplied `id`.
   *
   * @param {function} componentConstructor React component constructor
   * @param {?object} props Initial props of the component instance.
   * @param {string} id ID of the DOM element to render into.
   * @return {ReactComponent} Component instance rendered in the container node.
   */
  constructAndRenderComponentByID: function(constructor, props, id) {
    return ReactMount.constructAndRenderComponent(constructor, props, $(id));
  },

  /**
   * Registers a container node into which React components will be rendered.
   * This also creates the "reatRoot" ID that will be assigned to the element
   * rendered within.
   *
   * @param {DOMElement} container DOM element to register as a container.
   * @return {string} The "reactRoot" ID of elements rendered within.
   */
  registerContainer: function(container) {
    var reactRootID = getReactRootID(container);
    if (reactRootID) {
      // If one exists, make sure it is a valid "reactRoot" ID.
      reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);
    }
    if (!reactRootID) {
      // No valid "reactRoot" ID found, create one.
      reactRootID = ReactInstanceHandles.createReactRootID();
    }
    containersByReactRootID[reactRootID] = container;
    return reactRootID;
  },

  /**
   * Unmounts and destroys the React component rendered in the `container`.
   *
   * @param {DOMElement} container DOM element containing a React component.
   * @return {boolean} True if a component was found in and unmounted from
   *                   `container`
   */
  unmountAndReleaseReactRootNode: function(container) {
    var reactRootID = getReactRootID(container);
    var component = instanceByReactRootID[reactRootID];
    if (!component) {
      return false;
    }
    component.unmountComponentFromNode(container);
    delete instanceByReactRootID[reactRootID];
    delete containersByReactRootID[reactRootID];
    return true;
  },

  /**
   * Finds the container DOM element that contains React component to which the
   * supplied DOM `id` belongs.
   *
   * @param {string} id The ID of an element rendered by a React component.
   * @return {?DOMElement} DOM element that contains the `id`.
   */
  findReactContainerForID: function(id) {
    var reatRootID = ReactInstanceHandles.getReactRootIDFromNodeID(id);
    // TODO: Consider throwing if `id` is not a valid React element ID.
    return containersByReactRootID[reatRootID];
  },

  /**
   * Given the ID of a DOM node rendered by a React component, finds the root
   * DOM node of the React component.
   *
   * @param {string} id ID of a DOM node in the React component.
   * @return {?DOMElement} Root DOM node of the React component.
   */
  findReactRenderedDOMNodeSlow: function(id) {
    var reactRoot = ReactMount.findReactContainerForID(id);
    return ReactInstanceHandles.findComponentRoot(reactRoot, id);
  }

};

module.exports = ReactMount;
