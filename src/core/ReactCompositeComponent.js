/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCompositeComponent
 */

"use strict";

var ReactComponent = require('ReactComponent');
var ReactContext = require('ReactContext');
var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactElement = require('ReactElement');
var ReactEmptyComponent = require('ReactEmptyComponent');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactOwner = require('ReactOwner');
var ReactPerf = require('ReactPerf');
var ReactPropTypeLocations = require('ReactPropTypeLocations');
var ReactUpdates = require('ReactUpdates');

var assign = require('Object.assign');
var invariant = require('invariant');
var keyMirror = require('keyMirror');
var shouldUpdateReactComponent = require('shouldUpdateReactComponent');
var warning = require('warning');

function getDeclarationErrorAddendum(component) {
  var owner = component._owner || null;
  if (owner) {
    var constructor = owner._instance.constructor;
    if (constructor && constructor.displayName) {
      return ' Check the render method of `' + constructor.displayName + '`.';
    }
  }
  return '';
}

function validateLifeCycleOnReplaceState(instance) {
  var compositeLifeCycleState = instance._compositeLifeCycleState;
  invariant(
    ReactCurrentOwner.current == null,
    'replaceState(...): Cannot update during an existing state transition ' +
    '(such as within `render`). Render methods should be a pure function ' +
    'of props and state.'
  );
  invariant(compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING,
    'replaceState(...): Cannot update while unmounting component. This ' +
    'usually means you called setState() on an unmounted component.'
  );
}

/**
 * `ReactCompositeComponent` maintains an auxiliary life cycle state in
 * `this._compositeLifeCycleState` (which can be null).
 *
 * This is different from the life cycle state maintained by `ReactComponent` in
 * `this._lifeCycleState`. The following diagram shows how the states overlap in
 * time. There are times when the CompositeLifeCycle is null - at those times it
 * is only meaningful to look at ComponentLifeCycle alone.
 *
 * Top Row: ReactComponent.ComponentLifeCycle
 * Low Row: ReactComponent.CompositeLifeCycle
 *
 * +-------+---------------------------------+--------+
 * |  UN   |             MOUNTED             |   UN   |
 * |MOUNTED|                                 | MOUNTED|
 * +-------+---------------------------------+--------+
 * |       ^--------+   +-------+   +--------^        |
 * |       |        |   |       |   |        |        |
 * |    0--|MOUNTING|-0-|RECEIVE|-0-|   UN   |--->0   |
 * |       |        |   |PROPS  |   |MOUNTING|        |
 * |       |        |   |       |   |        |        |
 * |       |        |   |       |   |        |        |
 * |       +--------+   +-------+   +--------+        |
 * |       |                                 |        |
 * +-------+---------------------------------+--------+
 */
var CompositeLifeCycle = keyMirror({
  /**
   * Components in the process of being mounted respond to state changes
   * differently.
   */
  MOUNTING: null,
  /**
   * Components in the process of being unmounted are guarded against state
   * changes.
   */
  UNMOUNTING: null,
  /**
   * Components that are mounted and receiving new props respond to state
   * changes differently.
   */
  RECEIVING_PROPS: null
});

/**
 * @lends {ReactCompositeComponent.prototype}
 */
var ReactCompositeComponentMixin = assign({},
  ReactComponent.Mixin,
  ReactOwner.Mixin, {

  /**
   * Base constructor for all composite component.
   *
   * @param {ReactElement} element
   * @final
   * @internal
   */
  construct: function(element) {
    this._instance.props = element.props;
    this._instance.state = null;
    this._instance.context = null;

    this._pendingState = null;
    this._compositeLifeCycleState = null;

    // Children can be either an array or more than one argument
    ReactComponent.Mixin.construct.apply(this, arguments);
    ReactOwner.Mixin.construct.apply(this, arguments);
  },

  /**
   * Checks whether or not this composite component is mounted.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function() {
    return ReactComponent.Mixin.isMounted.call(this) &&
      this._compositeLifeCycleState !== CompositeLifeCycle.MOUNTING;
  },

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {number} mountDepth number of components in the owner hierarchy
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    'mountComponent',
    function(rootID, transaction, mountDepth) {
      ReactComponent.Mixin.mountComponent.call(
        this,
        rootID,
        transaction,
        mountDepth
      );

      var inst = this._instance;

      // Store a reference from the instance back to the internal representation
      ReactInstanceMap.set(inst, this);

      this._compositeLifeCycleState = CompositeLifeCycle.MOUNTING;

      inst.context = this._processContext(this._currentElement._context);
      inst.props = this._processProps(this._currentElement.props);

      var initialState = inst.getInitialState ? inst.getInitialState() : null;
      if (__DEV__) {
        // We allow auto-mocks to proceed as if they're returning null.
        if (typeof initialState === 'undefined' &&
            inst.getInitialState._isMockFunction) {
          // This is probably bad practice. Consider warning here and
          // deprecating this convenience.
          initialState = null;
        }
      }
      invariant(
        typeof initialState === 'object' && !Array.isArray(initialState),
        '%s.getInitialState(): must return an object or null',
        inst.constructor.displayName || 'ReactCompositeComponent'
      );
      inst.state = initialState;

      this._pendingState = null;
      this._pendingForceUpdate = false;

      if (inst.componentWillMount) {
        inst.componentWillMount();
        // When mounting, calls to `setState` by `componentWillMount` will set
        // `this._pendingState` without triggering a re-render.
        if (this._pendingState) {
          inst.state = this._pendingState;
          this._pendingState = null;
        }
      }

      var renderedElement = this._renderValidatedComponent();
      if (renderedElement === ReactEmptyComponent.emptyElement) {
        ReactEmptyComponent.registerNullComponentID(this._rootNodeID);
      }

      this._renderedComponent = this._instantiateReactComponent(
        renderedElement,
        this._currentElement.type // The wrapping type
      );

      // Done with mounting, `setState` will now trigger UI changes.
      this._compositeLifeCycleState = null;
      var markup = this._renderedComponent.mountComponent(
        rootID,
        transaction,
        mountDepth + 1
      );
      if (inst.componentDidMount) {
        transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);
      }
      return markup;
    }
  ),

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function() {
    var inst = this._instance;

    this._compositeLifeCycleState = CompositeLifeCycle.UNMOUNTING;
    if (inst.componentWillUnmount) {
      inst.componentWillUnmount();
    }
    this._compositeLifeCycleState = null;

    if (this._renderedComponent._currentElement ===
        ReactEmptyComponent.emptyElement) {
      ReactEmptyComponent.deregisterNullComponentID(this._rootNodeID);
    }

    this._renderedComponent.unmountComponent();
    this._renderedComponent = null;

    ReactComponent.Mixin.unmountComponent.call(this);

    // Delete the reference from the instance to this internal representation
    // which allow the internals to be properly cleaned up even if the user
    // leaks a reference to the public instance.
    ReactInstanceMap.remove(inst);

    // Some existing components rely on inst.props even after they've been
    // destroyed (in event handlers).
    // TODO: inst.props = null;
    // TODO: inst.state = null;
    // TODO: inst.context = null;
  },

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {object} partialState Next partial state to be merged with state.
   * @param {?function} callback Called after state is updated.
   * @final
   * @protected
   */
  setState: function(partialState, callback) {
    // Merge with `_pendingState` if it exists, otherwise with existing state.
    this.replaceState(
      assign({}, this._pendingState || this._instance.state, partialState),
      callback
    );
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {object} completeState Next state.
   * @param {?function} callback Called after state is updated.
   * @final
   * @protected
   */
  replaceState: function(completeState, callback) {
    validateLifeCycleOnReplaceState(this);
    this._pendingState = completeState;
    if (this._compositeLifeCycleState !== CompositeLifeCycle.MOUNTING) {
      // If we're in a componentWillMount handler, don't enqueue a rerender
      // because ReactUpdates assumes we're in a browser context (which is wrong
      // for server rendering) and we're about to do a render anyway.
      // TODO: The callback here is ignored when setState is called from
      // componentWillMount. Either fix it or disallow doing so completely in
      // favor of getInitialState.
      ReactUpdates.enqueueUpdate(this, callback);
    }
  },

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldUpdateComponent`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {?function} callback Called after update is complete.isM
   * @final
   * @protected
   */
  forceUpdate: function(callback) {
    var compositeLifeCycleState = this._compositeLifeCycleState;
    invariant(
      compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE &&
      compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING,
      'forceUpdate(...): Cannot force an update while unmounting component ' +
      'or during an existing state transition (such as within `render`).'
    );
    this._pendingForceUpdate = true;
    ReactUpdates.enqueueUpdate(this, callback);
  },

  /**
   * Filters the context object to only contain keys specified in
   * `contextTypes`, and asserts that they are valid.
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _processContext: function(context) {
    var maskedContext = null;
    var contextTypes = this._instance.constructor.contextTypes;
    if (contextTypes) {
      maskedContext = {};
      for (var contextName in contextTypes) {
        maskedContext[contextName] = context[contextName];
      }
      if (__DEV__) {
        this._checkPropTypes(
          contextTypes,
          maskedContext,
          ReactPropTypeLocations.context
        );
      }
    }
    return maskedContext;
  },

  /**
   * @param {object} currentContext
   * @return {object}
   * @private
   */
  _processChildContext: function(currentContext) {
    var inst = this._instance;
    var childContext = inst.getChildContext && inst.getChildContext();
    var displayName = inst.constructor.displayName || 'ReactCompositeComponent';
    if (childContext) {
      invariant(
        typeof inst.constructor.childContextTypes === 'object',
        '%s.getChildContext(): childContextTypes must be defined in order to ' +
        'use getChildContext().',
        displayName
      );
      if (__DEV__) {
        this._checkPropTypes(
          inst.constructor.childContextTypes,
          childContext,
          ReactPropTypeLocations.childContext
        );
      }
      for (var name in childContext) {
        invariant(
          name in inst.constructor.childContextTypes,
          '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
          displayName,
          name
        );
      }
      return assign({}, currentContext, childContext);
    }
    return currentContext;
  },

  /**
   * Processes props by setting default values for unspecified props and
   * asserting that the props are valid. Does not mutate its argument; returns
   * a new props object with defaults merged in.
   *
   * @param {object} newProps
   * @return {object}
   * @private
   */
  _processProps: function(newProps) {
    if (__DEV__) {
      var inst = this._instance;
      var propTypes = inst.constructor.propTypes;
      if (propTypes) {
        this._checkPropTypes(propTypes, newProps, ReactPropTypeLocations.prop);
      }
    }
    return newProps;
  },

  /**
   * Assert that the props are valid
   *
   * @param {object} propTypes Map of prop name to a ReactPropType
   * @param {object} props
   * @param {string} location e.g. "prop", "context", "child context"
   * @private
   */
  _checkPropTypes: function(propTypes, props, location) {
    // TODO: Stop validating prop types here and only use the element
    // validation.
    var componentName = this._instance.constructor.displayName;
    for (var propName in propTypes) {
      if (propTypes.hasOwnProperty(propName)) {
        var error =
          propTypes[propName](props, propName, componentName, location);
        if (error instanceof Error) {
          // We may want to extend this logic for similar errors in
          // renderComponent calls, so I'm abstracting it away into
          // a function to minimize refactoring in the future
          var addendum = getDeclarationErrorAddendum(this);
          warning(false, error.message + addendum);
        }
      }
    }
  },

  receiveComponent: function(nextElement, transaction) {
    if (nextElement === this._currentElement &&
        nextElement._owner != null) {
      // Since elements are immutable after the owner is rendered,
      // we can do a cheap identity compare here to determine if this is a
      // superfluous reconcile. It's possible for state to be mutable but such
      // change should trigger an update of the owner which would recreate
      // the element. We explicitly check for the existence of an owner since
      // it's possible for an element created outside a composite to be
      // deeply mutated and reused.
      return;
    }

    ReactComponent.Mixin.receiveComponent.call(
      this,
      nextElement,
      transaction
    );
  },

  /**
   * If any of `_pendingElement`, `_pendingState`, or `_pendingForceUpdate`
   * is set, update the component.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function(transaction) {
    var compositeLifeCycleState = this._compositeLifeCycleState;
    // Do not trigger a state transition if we are in the middle of mounting or
    // receiving props because both of those will already be doing this.
    if (compositeLifeCycleState === CompositeLifeCycle.MOUNTING ||
        compositeLifeCycleState === CompositeLifeCycle.RECEIVING_PROPS) {
      return;
    }

    if (this._pendingElement == null &&
        this._pendingState == null &&
        !this._pendingForceUpdate) {
      return;
    }

    var prevElement = this._currentElement;
    var nextElement = prevElement;
    if (this._pendingElement != null) {
      nextElement = this._pendingElement;
      this._pendingElement = null;
    }

    this.updateComponent(
      transaction,
      prevElement,
      nextElement
    );
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
  updateComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    'updateComponent',
    function(transaction, prevParentElement, nextParentElement) {
      // Update refs regardless of what shouldComponentUpdate returns
      ReactComponent.Mixin.updateComponent.call(
        this,
        transaction,
        prevParentElement,
        nextParentElement
      );

      var inst = this._instance;

      var prevContext = inst.context;
      var prevProps = inst.props;
      var nextContext = prevContext;
      var nextProps = prevProps;
      // Distinguish between a props update versus a simple state update
      if (prevParentElement !== nextParentElement) {
        nextContext = this._processContext(nextParentElement._context);
        nextProps = this._processProps(nextParentElement.props);

        this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_PROPS;
        if (inst.componentWillReceiveProps) {
          inst.componentWillReceiveProps(nextProps, nextContext);
        }
      }

      this._compositeLifeCycleState = null;

      var nextState = this._pendingState || inst.state;
      this._pendingState = null;

      var shouldUpdate =
        this._pendingForceUpdate ||
        !inst.shouldComponentUpdate ||
        inst.shouldComponentUpdate(nextProps, nextState, nextContext);

      if (__DEV__) {
        if (typeof shouldUpdate === "undefined") {
          console.warn(
            (inst.constructor.displayName || 'ReactCompositeComponent') +
            '.shouldComponentUpdate(): Returned undefined instead of a ' +
            'boolean value. Make sure to return true or false.'
          );
        }
      }

      if (!shouldUpdate) {
        // If it's determined that a component should not update, we still want
        // to set props and state but we shortcut the rest of the update.
        this._currentElement = nextParentElement;
        inst.props = nextProps;
        inst.state = nextState;
        inst.context = nextContext;

        // Owner cannot change because shouldUpdateReactComponent doesn't allow
        // it. TODO: Remove this._owner completely.
        this._owner = nextParentElement._owner;

        return;
      }

      this._pendingForceUpdate = false;
      // Will set `this.props`, `this.state` and `this.context`.
      this._performComponentUpdate(
        nextParentElement,
        nextProps,
        nextState,
        nextContext,
        transaction
      );
    }),

  /**
   * Merges new props and state, notifies delegate methods of update and
   * performs update.
   *
   * @param {ReactElement} nextElement Next element
   * @param {object} nextProps Next public object to set as properties.
   * @param {?object} nextState Next object to set as state.
   * @param {?object} nextContext Next public object to set as context.
   * @param {ReactReconcileTransaction} transaction
   * @private
   */
  _performComponentUpdate: function(
    nextElement,
    nextProps,
    nextState,
    nextContext,
    transaction
  ) {
    var inst = this._instance;

    var prevProps = inst.props;
    var prevState = inst.state;
    var prevContext = inst.context;

    if (inst.componentWillUpdate) {
      inst.componentWillUpdate(nextProps, nextState, nextContext);
    }

    this._currentElement = nextElement;
    inst.props = nextProps;
    inst.state = nextState;
    inst.context = nextContext;

    // Owner cannot change because shouldUpdateReactComponent doesn't allow
    // it. TODO: Remove this._owner completely.
    this._owner = nextElement._owner;

    this._updateRenderedComponent(transaction);

    if (inst.componentDidUpdate) {
      transaction.getReactMountReady().enqueue(
        inst.componentDidUpdate.bind(inst, prevProps, prevState, prevContext),
        inst
      );
    }
  },

  /**
   * Call the component's `render` method and update the DOM accordingly.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  _updateRenderedComponent: function(transaction) {
    var prevComponentInstance = this._renderedComponent;
    var prevRenderedElement = prevComponentInstance._currentElement;
    var nextRenderedElement = this._renderValidatedComponent();
    if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
      prevComponentInstance.receiveComponent(
        nextRenderedElement,
        transaction
      );
    } else {
      // These two IDs are actually the same! But nothing should rely on that.
      var thisID = this._rootNodeID;
      var prevComponentID = prevComponentInstance._rootNodeID;
      prevComponentInstance.unmountComponent();

      if (nextRenderedElement === ReactEmptyComponent.emptyElement) {
        ReactEmptyComponent.registerNullComponentID(this._rootNodeID);
      } else if (prevRenderedElement === ReactEmptyComponent.emptyElement) {
        ReactEmptyComponent.deregisterNullComponentID(this._rootNodeID);
      }

      this._renderedComponent = this._instantiateReactComponent(
        nextRenderedElement,
        this._currentElement.type
      );
      var nextMarkup = this._renderedComponent.mountComponent(
        thisID,
        transaction,
        this._mountDepth + 1
      );
      ReactComponent.BackendIDOperations.dangerouslyReplaceNodeWithMarkupByID(
        prevComponentID,
        nextMarkup
      );
    }
  },

  /**
   * @private
   */
  _renderValidatedComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    '_renderValidatedComponent',
    function() {
      var renderedComponent;
      var previousContext = ReactContext.current;
      ReactContext.current = this._processChildContext(
        this._currentElement._context
      );
      ReactCurrentOwner.current = this;
      var inst = this._instance;
      try {
        renderedComponent = inst.render();
        if (__DEV__) {
          // We allow auto-mocks to proceed as if they're returning null.
          if (typeof renderedComponent === 'undefined' &&
              inst.render._isMockFunction) {
            // This is probably bad practice. Consider warning here and
            // deprecating this convenience.
            renderedComponent = null;
          }
        }
        if (renderedComponent === null || renderedComponent === false) {
          renderedComponent = ReactEmptyComponent.emptyElement;
        }
      } finally {
        ReactContext.current = previousContext;
        ReactCurrentOwner.current = null;
      }
      invariant(
        ReactElement.isValidElement(renderedComponent),
        '%s.render(): A valid ReactComponent must be returned. You may have ' +
          'returned undefined, an array or some other invalid object.',
        inst.constructor.displayName || 'ReactCompositeComponent'
      );
      return renderedComponent;
    }
  ),

  /**
   * Get the publicly accessible representation of this component - i.e. what
   * is exposed by refs and renderComponent. Can be null for stateless
   * components.
   *
   * @return {ReactComponent} the public component instance.
   * @internal
   */
  getPublicInstance: function() {
    return this._instance;
  },

  // Stub
  _instantiateReactComponent: null

});

var ReactCompositeComponent = {

  LifeCycle: CompositeLifeCycle,

  Mixin: ReactCompositeComponentMixin

};

module.exports = ReactCompositeComponent;
