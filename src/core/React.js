/**
 * @providesModule React
 */

"use strict";

var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactComponent = require('ReactComponent');
var ReactDOM = require('ReactDOM');
var ReactMount = require('ReactMount');

var ReactDefaultInjection = require('ReactDefaultInjection');

ReactDefaultInjection.inject();

var React = {
  DOM: ReactDOM,
  initializeTouchEvents: function(shouldUseTouch) {
    ReactMount.useTouchEvents = shouldUseTouch;
  },
  autoBind: ReactCompositeComponent.autoBind,
  createClass: ReactCompositeComponent.createClass,
  createComponentRenderer: ReactMount.createComponentRenderer,
  constructAndRenderComponent: ReactMount.constructAndRenderComponent,
  constructAndRenderComponentByID: ReactMount.constructAndRenderComponentByID,
  renderComponent: ReactMount.renderComponent,
  unmountAndReleaseReactRootNode: ReactMount.unmountAndReleaseReactRootNode,
  isValidComponent: ReactComponent.isValidComponent
};

module.exports = React;
