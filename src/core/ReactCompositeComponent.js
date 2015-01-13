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
var ReactComponentEnvironment = require('ReactComponentEnvironment');
var ReactContext = require('ReactContext');
var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactElement = require('ReactElement');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactPerf = require('ReactPerf');
var ReactPropTypeLocations = require('ReactPropTypeLocations');
var ReactPropTypeLocationNames = require('ReactPropTypeLocationNames');
var ReactUpdates = require('ReactUpdates');

var assign = require('Object.assign');
var emptyObject = require('emptyObject');
var invariant = require('invariant');
var keyMirror = require('keyMirror');
var shouldUpdateReactComponent = require('shouldUpdateReactComponent');
var warning = require('warning');

function getDeclarationErrorAddendum(component) {
  var owner = component._currentElement._owner || null;
  if (owner) {
    var name = owner.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
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
 * This is different from the life cycle state maintained by `ReactComponent`.
 * The following diagram shows how the states overlap in
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
 * An incrementing ID assigned to each component when it is mounted. This is
 * used to enforce the order in which `ReactUpdates` updates dirty components.
 *
 * @private
 */
var nextMountID = 1;

/**
 * @lends {ReactCompositeComponent.prototype}
 */
var ReactCompositeComponentMixin = assign({},
  ReactComponent.Mixin, {

  /**
   * Base constructor for all composite component.
   *
   * @param {ReactElement} element
   * @final
   * @internal
   */
  construct: function(element) {
    this._rootNodeID = null;

    this._instance.props = element.props;
    this._instance.state = null;
    this._instance.context = null;
    this._instance.refs = emptyObject;

    this._pendingElement = null;
    this._pendingContext = null;
    this._pendingState = null;
    this._pendingForceUpdate = false;
    this._compositeLifeCycleState = null;

    this._renderedComponent = null;

    // Children can be either an array or more than one argument
    ReactComponent.Mixin.construct.apply(this, arguments);

    this._context = null;
    this._mountOrder = 0;
    this._isTopLevel = false;

    // See ReactUpdates.
    this._pendingCallbacks = null;
  },

  /**
   * Checks whether or not this composite component is mounted.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function() {
    return this._compositeLifeCycleState !== CompositeLifeCycle.MOUNTING;
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
    ReactComponent.Mixin.mountComponent.call(
      this,
      rootID,
      transaction,
      context
    );

    this._context = context;
    this._mountOrder = nextMountID++;
    this._rootNodeID = rootID;

    var inst = this._instance;

    // Store a reference from the instance back to the internal representation
    ReactInstanceMap.set(inst, this);

    this._compositeLifeCycleState = CompositeLifeCycle.MOUNTING;

    inst.context = this._processContext(this._currentElement._context);
    if (__DEV__) {
      this._warnIfContextsDiffer(this._currentElement._context, context);
    }
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
      // Since plain JS classes are defined without any special initialization
      // logic, we can not catch common errors early. Therefore, we have to
      // catch them here, at initialization time, instead.
      warning(
        !inst.getInitialState ||
        inst.getInitialState._isReactClassApproved,
        'getInitialState was defined on %s, a plain JavaScript class. ' +
        'This is only supported for classes created using React.createClass. ' +
        'Did you mean to define a state property instead?',
        this.getName() || 'a component'
      );
      warning(
        !inst.componentWillMount ||
        inst.componentWillMount._isReactClassApproved,
        'componentWillMount was defined on %s, a plain JavaScript class. ' +
        'This is only supported for classes created using React.createClass. ' +
        'Did you mean to define a constructor instead?',
        this.getName() || 'a component'
      );
      warning(
        !inst.propTypes,
        'propTypes was defined as an instance property on %s. Use a static ' +
        'property to define propTypes instead.',
        this.getName() || 'a component'
      );
      warning(
        !inst.contextTypes,
        'contextTypes was defined as an instance property on %s. Use a ' +
        'static property to define contextTypes instead.',
        this.getName() || 'a component'
      );
      warning(
        typeof inst.componentShouldUpdate !== 'function',
        '%s has a method called ' +
        'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
        'The name is phrased as a question because the function is ' +
        'expected to return a value.',
        (this.getName() || 'A component')
      );
    }
    invariant(
      typeof initialState === 'object' && !Array.isArray(initialState),
      '%s.getInitialState(): must return an object or null',
      this.getName() || 'ReactCompositeComponent'
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
    this._renderedComponent = this._instantiateReactComponent(
      renderedElement,
      this._currentElement.type // The wrapping type
    );

    // Done with mounting, `setState` will now trigger UI changes.
    this._compositeLifeCycleState = null;
    var markup = this._renderedComponent.mountComponent(
      rootID,
      transaction,
      this._processChildContext(context)
    );
    if (inst.componentDidMount) {
      transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);
    }
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

    this._compositeLifeCycleState = CompositeLifeCycle.UNMOUNTING;
    if (inst.componentWillUnmount) {
      inst.componentWillUnmount();
    }
    this._compositeLifeCycleState = null;

    this._renderedComponent.unmountComponent();
    this._renderedComponent = null;

    // Reset pending fields
    this._pendingState = null;
    this._pendingForceUpdate = false;
    this._pendingCallbacks = null;
    this._pendingElement = null;

    ReactComponent.Mixin.unmountComponent.call(this);

    ReactComponentEnvironment.unmountIDFromEnvironment(this._rootNodeID);

    this._context = null;
    this._rootNodeID = null;

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
   * Sets a subset of the props.
   *
   * @param {object} partialProps Subset of the next props.
   * @param {?function} callback Called after props are updated.
   * @final
   * @public
   */
  setProps: function(partialProps, callback) {
    // Merge with the pending element if it exists, otherwise with existing
    // element props.
    var element = this._pendingElement || this._currentElement;
    this.replaceProps(
      assign({}, element.props, partialProps),
      callback
    );
  },

  /**
   * Replaces all of the props.
   *
   * @param {object} props New props.
   * @param {?function} callback Called after props are updated.
   * @final
   * @public
   */
  replaceProps: function(props, callback) {
    invariant(
      this._isTopLevel,
      'replaceProps(...): You called `setProps` or `replaceProps` on a ' +
      'component with a parent. This is an anti-pattern since props will ' +
      'get reactively updated when rendered. Instead, change the owner\'s ' +
      '`render` method to pass the correct value as props to the component ' +
      'where it is created.'
    );
    // This is a deoptimized path. We optimize for always having an element.
    // This creates an extra internal element.
    this._pendingElement = ReactElement.cloneAndReplaceProps(
      this._pendingElement || this._currentElement,
      props
    );
    ReactUpdates.enqueueUpdate(this, callback);
  },

  /**
   * Schedule a partial update to the props. Only used for internal testing.
   *
   * @param {object} partialProps Subset of the next props.
   * @param {?function} callback Called after props are updated.
   * @final
   * @internal
   */
  _setPropsInternal: function(partialProps, callback) {
    // This is a deoptimized path. We optimize for always having an element.
    // This creates an extra internal element.
    var element = this._pendingElement || this._currentElement;
    this._pendingElement = ReactElement.cloneAndReplaceProps(
      element,
      assign({}, element.props, partialProps)
    );
    ReactUpdates.enqueueUpdate(this, callback);
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
   * `contextTypes`
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _maskContext: function(context) {
    var maskedContext = null;
    var contextTypes = this._instance.constructor.contextTypes;
    if (!contextTypes) {
      return emptyObject;
    }
    maskedContext = {};
    for (var contextName in contextTypes) {
      maskedContext[contextName] = context[contextName];
    }
    return maskedContext;
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
    var maskedContext = this._maskContext(context);
    var contextTypes = this._instance.constructor.contextTypes;
    if (!contextTypes) {
      return emptyObject;
    }
    if (__DEV__) {
      this._checkPropTypes(
        contextTypes,
        maskedContext,
        ReactPropTypeLocations.context
      );
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
    if (childContext) {
      invariant(
        typeof inst.constructor.childContextTypes === 'object',
        '%s.getChildContext(): childContextTypes must be defined in order to ' +
        'use getChildContext().',
        this.getName() || 'ReactCompositeComponent'
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
          this.getName() || 'ReactCompositeComponent',
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
    var componentName = this.getName();
    for (var propName in propTypes) {
      if (propTypes.hasOwnProperty(propName)) {
        var error;
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          invariant(
            typeof propTypes[propName] === 'function',
            '%s: %s type `%s` is invalid; it must be a function, usually ' +
            'from React.PropTypes.',
            componentName || 'React class',
            ReactPropTypeLocationNames[location],
            propName
          );
          error = propTypes[propName](props, propName, componentName, location);
        } catch (ex) {
          error = ex;
        }
        if (error instanceof Error) {
          // We may want to extend this logic for similar errors in
          // React.render calls, so I'm abstracting it away into
          // a function to minimize refactoring in the future
          var addendum = getDeclarationErrorAddendum(this);
          warning(false, error.message + addendum);
        }
      }
    }
  },

  receiveComponent: function(nextElement, transaction, context) {
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

    this._pendingElement = nextElement;
    this._pendingContext = context;
    this.performUpdateIfNecessary(transaction);
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
        this._pendingContext == null &&
        !this._pendingForceUpdate) {
      return;
    }

    var prevElement = this._currentElement;
    var nextElement = prevElement;
    if (this._pendingElement != null) {
      nextElement = this._pendingElement;
      this._pendingElement = null;
    }

    var prevContext = this._context;
    var nextContext = prevContext;
    if (this._pendingContext != null) {
      nextContext = this._pendingContext;
      this._pendingContext = null;
    }

    this.updateComponent(
      transaction,
      prevElement,
      nextElement,
      prevContext,
      nextContext
    );
  },

  /**
   * Compare two contexts, warning if they are different
   * TODO: Remove this check when owner-context is removed
   */
   _warnIfContextsDiffer: function(ownerBasedContext, parentBasedContext) {
    ownerBasedContext = this._maskContext(ownerBasedContext);
    parentBasedContext = this._maskContext(parentBasedContext);
    var ownerKeys = Object.keys(ownerBasedContext).sort();
    var parentKeys = Object.keys(parentBasedContext).sort();
    var displayName = this.getName() || 'ReactCompositeComponent';
    for (var i = 0; i < parentKeys.length; i++) {
      var key = parentKeys[i];
      warning(
        ownerBasedContext[key] === parentBasedContext[key],
        'owner-based and parent-based contexts differ '  +
        '(values: `%s` vs `%s`) for key (%s) while mounting %s ' +
        '(see: http://fb.me/react-context-by-parent)',
        ownerBasedContext[key],
        parentBasedContext[key],
        key,
        displayName
      );
    }
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
    prevUnmaskedContext,
    nextUnmaskedContext
  ) {
    // Update refs regardless of what shouldComponentUpdate returns
    ReactComponent.Mixin.updateComponent.call(
      this,
      transaction,
      prevParentElement,
      nextParentElement,
      prevUnmaskedContext,
      nextUnmaskedContext
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

      if (__DEV__) {
        if (nextUnmaskedContext != null) {
          this._warnIfContextsDiffer(nextParentElement._context, nextUnmaskedContext);
        }
      }

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
          (this.getName() || 'ReactCompositeComponent') +
          '.shouldComponentUpdate(): Returned undefined instead of a ' +
          'boolean value. Make sure to return true or false.'
        );
      }
    }

    if (!shouldUpdate) {
      // If it's determined that a component should not update, we still want
      // to set props and state but we shortcut the rest of the update.
      this._currentElement = nextParentElement;
      this._context = nextUnmaskedContext;
      inst.props = nextProps;
      inst.state = nextState;
      inst.context = nextContext;
      return;
    }

    this._pendingForceUpdate = false;
    // Will set `this.props`, `this.state` and `this.context`.
    this._performComponentUpdate(
      nextParentElement,
      nextProps,
      nextState,
      nextContext,
      transaction,
      nextUnmaskedContext
    );
  },

  /**
   * Merges new props and state, notifies delegate methods of update and
   * performs update.
   *
   * @param {ReactElement} nextElement Next element
   * @param {object} nextProps Next public object to set as properties.
   * @param {?object} nextState Next object to set as state.
   * @param {?object} nextContext Next public object to set as context.
   * @param {ReactReconcileTransaction} transaction
   * @param {?object} unmaskedContext
   * @private
   */
  _performComponentUpdate: function(
    nextElement,
    nextProps,
    nextState,
    nextContext,
    transaction,
    unmaskedContext
  ) {
    var inst = this._instance;

    var prevProps = inst.props;
    var prevState = inst.state;
    var prevContext = inst.context;

    if (inst.componentWillUpdate) {
      inst.componentWillUpdate(nextProps, nextState, nextContext);
    }

    this._currentElement = nextElement;
    this._context = unmaskedContext;
    inst.props = nextProps;
    inst.state = nextState;
    inst.context = nextContext;

    this._updateRenderedComponent(transaction, unmaskedContext);

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
  _updateRenderedComponent: function(transaction, context) {
    var prevComponentInstance = this._renderedComponent;
    var prevRenderedElement = prevComponentInstance._currentElement;
    var nextRenderedElement = this._renderValidatedComponent();
    if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
      prevComponentInstance.receiveComponent(
        nextRenderedElement,
        transaction,
        this._processChildContext(context)
      );
    } else {
      // These two IDs are actually the same! But nothing should rely on that.
      var thisID = this._rootNodeID;
      var prevComponentID = prevComponentInstance._rootNodeID;
      prevComponentInstance.unmountComponent();

      this._renderedComponent = this._instantiateReactComponent(
        nextRenderedElement,
        this._currentElement.type
      );
      var nextMarkup = this._renderedComponent.mountComponent(
        thisID,
        transaction,
        context
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
  _renderValidatedComponentWithoutOwnerOrContext: function() {
    var inst = this._instance;
    var renderedComponent = inst.render();
    if (__DEV__) {
      // We allow auto-mocks to proceed as if they're returning null.
      if (typeof renderedComponent === 'undefined' &&
          inst.render._isMockFunction) {
        // This is probably bad practice. Consider warning here and
        // deprecating this convenience.
        renderedComponent = null;
      }
    }

    return renderedComponent;
  },

  /**
   * @private
   */
  _renderValidatedComponent: function() {
    var renderedComponent;
    var previousContext = ReactContext.current;
    ReactContext.current = this._processChildContext(
      this._currentElement._context
    );
    ReactCurrentOwner.current = this;
    var inst = this._instance;
    try {
      renderedComponent =
        this._renderValidatedComponentWithoutOwnerOrContext();
    } finally {
      ReactContext.current = previousContext;
      ReactCurrentOwner.current = null;
    }
    invariant(
      // TODO: An `isValidNode` function would probably be more appropriate
      renderedComponent === null || renderedComponent === false ||
      ReactElement.isValidElement(renderedComponent),
      '%s.render(): A valid ReactComponent must be returned. You may have ' +
        'returned undefined, an array or some other invalid object.',
      this.getName() || 'ReactCompositeComponent'
    );
    return renderedComponent;
  },

  /**
   * Lazily allocates the refs object and stores `component` as `ref`.
   *
   * @param {string} ref Reference name.
   * @param {component} component Component to store as `ref`.
   * @final
   * @private
   */
  attachRef: function(ref, component) {
    var inst = this.getPublicInstance();
    var refs = inst.refs === emptyObject ? (inst.refs = {}) : inst.refs;
    refs[ref] = component.getPublicInstance();
  },

  /**
   * Detaches a reference name.
   *
   * @param {string} ref Name to dereference.
   * @final
   * @private
   */
  detachRef: function(ref) {
    var refs = this.getPublicInstance().refs;
    delete refs[ref];
  },
 
  /**
   * Get a text description of the component that can be used to identify it
   * in error messages.
   * @return {string} The name or null.
   * @internal
   */
  getName: function() {
    var type = this._currentElement.type;
    var constructor = this._instance.constructor;
    return (
      type.displayName || (constructor && constructor.displayName) ||
      type.name || (constructor && constructor.name) ||
      null
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
  _instantiateReactComponent: null

});

var ShallowMixin = assign({},
  ReactCompositeComponentMixin, {

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {ReactElement} Shallow rendering of the component.
   * @final
   * @internal
   */
  mountComponent: function(rootID, transaction, context) {
    ReactComponent.Mixin.mountComponent.call(
      this,
      rootID,
      transaction,
      context
    );

    var inst = this._instance;

    // Store a reference from the instance back to the internal representation
    ReactInstanceMap.set(inst, this);

    this._compositeLifeCycleState = CompositeLifeCycle.MOUNTING;

    // No context for shallow-mounted components.
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
      this.getName() || 'ReactCompositeComponent'
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

    // No recursive call to instantiateReactComponent for shallow rendering.
    this._renderedComponent =
      this._renderValidatedComponentWithoutOwnerOrContext();

    // Done with mounting, `setState` will now trigger UI changes.
    this._compositeLifeCycleState = null;

    // No call to this._renderedComponent.mountComponent for shallow
    // rendering.

    if (inst.componentDidMount) {
      transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);
    }

    return this._renderedComponent;
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
    // Use the without-owner-or-context variant of _rVC below:
    var nextRenderedElement =
      this._renderValidatedComponentWithoutOwnerOrContext();
    // This is a noop in shallow render
    shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement);
    this._renderedComponent = nextRenderedElement;
  }

});

ReactPerf.measureMethods(
  ReactCompositeComponentMixin,
  'ReactCompositeComponent',
  {
    mountComponent: 'mountComponent',
    updateComponent: 'updateComponent',
    _renderValidatedComponent: '_renderValidatedComponent'
  }
);

var ReactCompositeComponent = {

  LifeCycle: CompositeLifeCycle,

  Mixin: ReactCompositeComponentMixin,

  ShallowMixin: ShallowMixin

};

module.exports = ReactCompositeComponent;
