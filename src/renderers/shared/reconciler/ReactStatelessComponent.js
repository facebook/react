/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactStatelessComponent
 */

'use strict';

var ReactComponentEnvironment = require('ReactComponentEnvironment');
var ReactElement = require('ReactElement');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactLifeCycle = require('ReactLifeCycle');
var ReactPerf = require('ReactPerf');
var ReactReconciler = require('ReactReconciler');

var emptyObject = require('emptyObject');
var invariant = require('invariant');
var shouldUpdateReactComponent = require('shouldUpdateReactComponent');

/**
 * @lends {ReactStatelessComponent.prototype}
 */
var ReactStatelessComponentMixin = {

  /**
   * Base constructor for all stateless component.
   *
   * @param {ReactElement} element
   * @final
   * @internal
   */
  construct: function(element) {
    this._currentElement = element;
    this._rootNodeID = null;
    this._instance = null;

    this._renderedComponent = null;

    this._isTopLevel = false;
  },

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: function(rootID, transaction, context) {
    this._rootNodeID = rootID;

    var publicProps = this._currentElement.props;

    // Initialize the public class
    var inst = {};

    // These should be set up in the constructor, but as a convenience for
    // simpler class abstractions, we set them up after the fact.
    inst.props = publicProps;
    inst.refs = emptyObject;

    this._instance = inst;

    // Store a reference from the instance back to the internal representation
    ReactInstanceMap.set(inst, this);

    var renderedElement;

    var previouslyMounting = ReactLifeCycle.currentlyMountingInstance;
    ReactLifeCycle.currentlyMountingInstance = this;
    try {
      renderedElement = this._renderValidatedComponent();
    } finally {
      ReactLifeCycle.currentlyMountingInstance = previouslyMounting;
    }

    this._renderedComponent = this._instantiateReactComponent(
      renderedElement,
      this._currentElement.type // The wrapping type
    );

    var markup = ReactReconciler.mountComponent(
      this._renderedComponent,
      rootID,
      transaction,
      context
    );

    return markup;
  },

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function() {
    var inst = this._instance;

    ReactReconciler.unmountComponent(this._renderedComponent);
    this._renderedComponent = null;

    // These fields do not really need to be reset since this object is no
    // longer accessible.
    this._rootNodeID = null;

    // Delete the reference from the instance to this internal representation
    // which allow the internals to be properly cleaned up even if the user
    // leaks a reference to the public instance.
    ReactInstanceMap.remove(inst);
  },

  receiveComponent: function(nextElement, transaction, nextContext) {
    var prevElement = this._currentElement;

    this.updateComponent(
      transaction,
      prevElement,
      nextElement,
      nextContext
    );
  },

  /**
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function(transaction) {
  },

  /**
   * Perform an update to a mounted component. The componentWillReceiveProps and
   * shouldComponentUpdate methods are called, then (assuming the update isn't
   * skipped) the remaining update lifecycle methods are called and the DOM
   * representation is updated.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {ReactElement} prevParentElement
   * @param {ReactElement} nextParentElement
   * @internal
   * @overridable
   */
  updateComponent: function(
    transaction,
    prevParentElement,
    nextParentElement,
    nextContext
  ) {
    var inst = this._instance;

    // Distinguish between a props update versus a simple state update
    if (prevParentElement !== nextParentElement) {
      inst.props = nextParentElement.props;
    }

    this._currentElement = nextParentElement;

    var prevComponentInstance = this._renderedComponent;
    var prevRenderedElement = prevComponentInstance._currentElement;
    var nextRenderedElement = this._renderValidatedComponent();
    if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
      ReactReconciler.receiveComponent(
        prevComponentInstance,
        nextRenderedElement,
        transaction,
        nextContext
      );
    } else {
      // These two IDs are actually the same! But nothing should rely on that.
      var thisID = this._rootNodeID;
      var prevComponentID = prevComponentInstance._rootNodeID;
      ReactReconciler.unmountComponent(prevComponentInstance);

      this._renderedComponent = this._instantiateReactComponent(
        nextRenderedElement,
        this._currentElement.type
      );
      var nextMarkup = ReactReconciler.mountComponent(
        this._renderedComponent,
        thisID,
        transaction,
        nextContext
      );
      ReactComponentEnvironment.replaceNodeWithMarkupByID(
        prevComponentID,
        nextMarkup
      );
    }
  },

  /**
   * @private
   */
  _renderValidatedComponent: function() {
    var inst = this._instance;
    var render = this._currentElement.type;

    var renderedComponent = render(inst.props);

    if (__DEV__) {
      // We allow auto-mocks to proceed as if they're returning null.
      if (typeof renderedComponent === 'undefined' &&
          render._isMockFunction) {
        // This is probably bad practice. Consider warning here and
        // deprecating this convenience.
        renderedComponent = null;
      }
    }

    invariant(
      // TODO: An `isValidNode` function would probably be more appropriate
      renderedComponent === null || renderedComponent === false ||
      ReactElement.isValidElement(renderedComponent),
      '%s.render(): A valid ReactComponent must be returned. You may have ' +
        'returned undefined, an array or some other invalid object.',
      this.getName() || 'ReactStatelessComponent'
    );

    return renderedComponent;
  },

  /**
   * Get a text description of the component that can be used to identify it
   * in error messages.
   * @return {string} The name or null.
   * @internal
   */
  getName: function() {
    var type = this._currentElement.type;

    return (
      type.displayName || type.name || null
    );
  },

  /**
   * Get the publicly accessible representation of this component - i.e. what
   * is exposed by refs and returned by React.render. Can be null for stateless
   * components.
   *
   * @return {ReactComponent} the public component instance.
   * @internal
   */
  getPublicInstance: function() {
    return this._instance;
  },

  // Stub
  _instantiateReactComponent: null,

};

ReactPerf.measureMethods(
  ReactStatelessComponentMixin,
  'ReactStatelessComponent',
  {
    mountComponent: 'mountComponent',
    updateComponent: 'updateComponent',
    _renderValidatedComponent: '_renderValidatedComponent',
  }
);

var ReactStatelessComponent = {

  Mixin: ReactStatelessComponentMixin,

};

module.exports = ReactStatelessComponent;
