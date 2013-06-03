/**
 * React v0.3.0
 */
(function(e){if("function"==typeof bootstrap)bootstrap("react",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeReact=e}else"undefined"!=typeof window?window.React=e():global.React=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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
 * @providesModule React
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactComponent = require("./ReactComponent");
var ReactDOM = require("./ReactDOM");
var ReactMount = require("./ReactMount");

var ReactDefaultInjection = require("./ReactDefaultInjection");

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

},{"./ReactCompositeComponent":2,"./ReactComponent":3,"./ReactDOM":4,"./ReactMount":5,"./ReactDefaultInjection":6}],2:[function(require,module,exports){
(function(){/**
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
 * @providesModule ReactCompositeComponent
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactOwner = require("./ReactOwner");
var ReactPropTransferer = require("./ReactPropTransferer");

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");
var merge = require("./merge");
var mixInto = require("./mixInto");

/**
 * Policies that describe methods in `ReactCompositeComponentInterface`.
 */
var SpecPolicy = keyMirror({
  /**
   * These methods may be defined only once by the class specification or mixin.
   */
  DEFINE_ONCE: null,
  /**
   * These methods may be defined by both the class specification and mixins.
   * Subsequent definitions will be chained. These methods must return void.
   */
  DEFINE_MANY: null,
  /**
   * These methods are overriding the base ReactCompositeComponent class.
   */
  OVERRIDE_BASE: null
});

/**
 * Composite components are higher-level components that compose other composite
 * or native components.
 *
 * To create a new type of `ReactCompositeComponent`, pass a specification of
 * your new class to `React.createClass`. The only requirement of your class
 * specification is that you implement a `render` method.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return <div>Hello World</div>;
 *     }
 *   });
 *
 * The class specification supports a specific protocol of methods that have
 * special meaning (e.g. `render`). See `ReactCompositeComponentInterface` for
 * more the comprehensive protocol. Any other properties and methods in the
 * class specification will available on the prototype.
 *
 * @interface ReactCompositeComponentInterface
 * @internal
 */
var ReactCompositeComponentInterface = {

  /**
   * An array of Mixin objects to include when defining your component.
   *
   * @type {array}
   * @optional
   */
  mixins: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of props for this component.
   *
   * @type {array}
   * @optional
   */
  props: SpecPolicy.DEFINE_ONCE,



  // ==== Definition methods ====

  /**
   * Invoked once before the component is mounted. The return value will be used
   * as the initial value of `this.state`.
   *
   *   getInitialState: function() {
   *     return {
   *       isOn: false,
   *       fooBaz: new BazFoo()
   *     }
   *   }
   *
   * @return {object}
   * @optional
   */
  getInitialState: SpecPolicy.DEFINE_ONCE,

  /**
   * Uses props from `this.props` and state from `this.state` to render the
   * structure of the component.
   *
   * No guarantees are made about when or how often this method is invoked, so
   * it must not have side effects.
   *
   *   render: function() {
   *     var name = this.props.name;
   *     return <div>Hello, {name}!</div>;
   *   }
   *
   * @return {ReactComponent}
   * @nosideeffects
   * @required
   */
  render: SpecPolicy.DEFINE_ONCE,



  // ==== Delegate methods ====

  /**
   * Invoked when the component is initially created and about to be mounted.
   * This may have side effects, but any external subscriptions or data created
   * by this method must be cleaned up in `componentWillUnmount`.
   *
   * @optional
   */
  componentWillMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component has been mounted and has a DOM representation.
   * However, there is no guarantee that the DOM node is in the document.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been mounted (initialized and rendered) for the first time.
   *
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked before the component receives new props.
   *
   * Use this as an opportunity to react to a prop transition by updating the
   * state using `this.setState`. Current props are accessed via `this.props`.
   *
   *   componentWillReceiveProps: function(nextProps) {
   *     this.setState({
   *       likesIncreasing: nextProps.likeCount > this.props.likeCount
   *     });
   *   }
   *
   * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
   * transition may cause a state change, but the opposite is not true. If you
   * need it, you are probably looking for `componentWillUpdate`.
   *
   * @param {object} nextProps
   * @optional
   */
  componentWillReceiveProps: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked while deciding if the component should be updated as a result of
   * receiving new props and state.
   *
   * Use this as an opportunity to `return false` when you're certain that the
   * transition to the new props and state will not require a component update.
   *
   *   shouldComponentUpdate: function(nextProps, nextState) {
   *     return !equal(nextProps, this.props) || !equal(nextState, this.state);
   *   }
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @return {boolean} True if the component should update.
   * @optional
   */
  shouldComponentUpdate: SpecPolicy.DEFINE_ONCE,

  /**
   * Invoked when the component is about to update due to a transition from
   * `this.props` and `this.state` to `nextProps` and `nextState`.
   *
   * Use this as an opportunity to perform preparation before an update occurs.
   *
   * NOTE: You **cannot** use `this.setState()` in this method.
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {ReactReconcileTransaction} transaction
   * @optional
   */
  componentWillUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component's DOM representation has been updated.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been updated.
   *
   * @param {object} prevProps
   * @param {?object} prevState
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component is about to be removed from its parent and have
   * its DOM representation destroyed.
   *
   * Use this as an opportunity to deallocate any external resources.
   *
   * NOTE: There is no `componentDidUnmount` since your component will have been
   * destroyed by that point.
   *
   * @optional
   */
  componentWillUnmount: SpecPolicy.DEFINE_MANY,



  // ==== Advanced methods ====

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   * @overridable
   */
  updateComponent: SpecPolicy.OVERRIDE_BASE

};

/**
 * Mapping from class specification keys to special processing functions.
 *
 * Although these are declared in the specification when defining classes
 * using `React.createClass`, they will not be on the component's prototype.
 */
var RESERVED_SPEC_KEYS = {
  displayName: function(Constructor, displayName) {
    Constructor.displayName = displayName;
  },
  mixins: function(Constructor, mixins) {
    if (mixins) {
      for (var i = 0; i < mixins.length; i++) {
        mixSpecIntoComponent(Constructor, mixins[i]);
      }
    }
  },
  props: function(Constructor, props) {
    Constructor.propDeclarations = props;
  }
};

/**
 * Custom version of `mixInto` which handles policy validation and reserved
 * specification keys when building `ReactCompositeComponent` classses.
 */
function mixSpecIntoComponent(Constructor, spec) {
  var proto = Constructor.prototype;
  for (var name in spec) {
    if (!spec.hasOwnProperty(name)) {
      continue;
    }
    var property = spec[name];
    var specPolicy = ReactCompositeComponentInterface[name];

    // Disallow overriding of base class methods unless explicitly allowed.
    if (ReactCompositeComponentMixin.hasOwnProperty(name)) {
      invariant(
        specPolicy === SpecPolicy.OVERRIDE_BASE,
        'ReactCompositeComponentInterface: You are attempting to override ' +
        '`%s` from your class specification. Ensure that your method names ' +
        'do not overlap with React methods.',
        name
      );
    }

    // Disallow using `React.autoBind` on internal methods.
    if (specPolicy != null) {
      invariant(
        !property || !property.__reactAutoBind,
        'ReactCompositeComponentInterface: You are attempting to use ' +
        '`React.autoBind` on `%s`, a method that is internal to React.' +
        'Internal methods are called with the component as the context.',
        name
      );
    }

    // Disallow defining methods more than once unless explicitly allowed.
    if (proto.hasOwnProperty(name)) {
      invariant(
        specPolicy === SpecPolicy.DEFINE_MANY,
        'ReactCompositeComponentInterface: You are attempting to define ' +
        '`%s` on your component more than once. This conflict may be due ' +
        'to a mixin.',
        name
      );
    }

    if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
      RESERVED_SPEC_KEYS[name](Constructor, property);
    } else if (property && property.__reactAutoBind) {
      if (!proto.__reactAutoBindMap) {
        proto.__reactAutoBindMap = {};
      }
      proto.__reactAutoBindMap[name] = property.__reactAutoBind;
    } else if (proto.hasOwnProperty(name)) {
      // For methods which are defined more than once, call the existing methods
      // before calling the new property.
      proto[name] = createChainedFunction(proto[name], property);
    } else {
      proto[name] = property;
    }
  }
}

/**
 * Creates a function that invokes two functions and ignores their return vales.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createChainedFunction(one, two) {
  return function chainedFunction(a, b, c, d, e, tooMany) {
    invariant(
      typeof tooMany === 'undefined',
      'Chained function can only take a maximum of 5 arguments.'
    );
    one.call(this, a, b, c, d, e);
    two.call(this, a, b, c, d, e);
  };
}

/**
 * `ReactCompositeComponent` maintains an auxiliary life cycle state in
 * `this._compositeLifeCycleState` (which can be null).
 *
 * This is different from the life cycle state maintained by `ReactComponent` in
 * `this._lifeCycleState`.
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
  RECEIVING_PROPS: null,
  /**
   * Components that are mounted and receiving new state are guarded against
   * additional state changes.
   */
  RECEIVING_STATE: null
});

/**
 * @lends {ReactCompositeComponent.prototype}
 */
var ReactCompositeComponentMixin = {

  /**
   * Base constructor for all composite component.
   *
   * @param {?object} initialProps
   * @param {*} children
   * @final
   * @internal
   */
  construct: function(initialProps, children) {
    ReactComponent.Mixin.construct.call(this, initialProps, children);
    this.state = null;
    this._pendingState = null;
    this._compositeLifeCycleState = null;
  },

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction} transaction
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: function(rootID, transaction) {
    ReactComponent.Mixin.mountComponent.call(this, rootID, transaction);

    // Unset `this._lifeCycleState` until after this method is finished.
    this._lifeCycleState = ReactComponent.LifeCycle.UNMOUNTED;
    this._compositeLifeCycleState = CompositeLifeCycle.MOUNTING;

    if (this.constructor.propDeclarations) {
      this._assertValidProps(this.props);
    }

    if (this.__reactAutoBindMap) {
      this._bindAutoBindMethods();
    }

    this.state = this.getInitialState ? this.getInitialState() : null;
    this._pendingState = null;

    if (this.componentWillMount) {
      this.componentWillMount();
      // When mounting, calls to `setState` by `componentWillMount` will set
      // `this._pendingState` without triggering a re-render.
      if (this._pendingState) {
        this.state = this._pendingState;
        this._pendingState = null;
      }
    }

    if (this.componentDidMount) {
      transaction.getReactOnDOMReady().enqueue(this, this.componentDidMount);
    }

    this._renderedComponent = this._renderValidatedComponent();

    // Done with mounting, `setState` will now trigger UI changes.
    this._compositeLifeCycleState = null;
    this._lifeCycleState = ReactComponent.LifeCycle.MOUNTED;

    return this._renderedComponent.mountComponent(rootID, transaction);
  },

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function() {
    this._compositeLifeCycleState = CompositeLifeCycle.UNMOUNTING;
    if (this.componentWillUnmount) {
      this.componentWillUnmount();
    }
    this._compositeLifeCycleState = null;

    ReactComponent.Mixin.unmountComponent.call(this);
    this._renderedComponent.unmountComponent();
    this._renderedComponent = null;

    if (this.refs) {
      this.refs = null;
    }

    // Some existing components rely on this.props even after they've been
    // destroyed (in event handlers).
    // TODO: this.props = null;
    // TODO: this.state = null;
  },

  /**
   * Updates the rendered DOM nodes given a new set of props.
   *
   * @param {object} nextProps Next set of properties.
   * @param {ReactReconcileTransaction} transaction
   * @final
   * @internal
   */
  receiveProps: function(nextProps, transaction) {
    if (this.constructor.propDeclarations) {
      this._assertValidProps(nextProps);
    }
    ReactComponent.Mixin.receiveProps.call(this, nextProps, transaction);

    this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_PROPS;
    if (this.componentWillReceiveProps) {
      this.componentWillReceiveProps(nextProps, transaction);
    }
    this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_STATE;
    // When receiving props, calls to `setState` by `componentWillReceiveProps`
    // will set `this._pendingState` without triggering a re-render.
    var nextState = this._pendingState || this.state;
    this._pendingState = null;
    this._receivePropsAndState(nextProps, nextState, transaction);
    this._compositeLifeCycleState = null;
  },

  /**
   * Sets a subset of the state. Always use this or `replaceState` to mutate
   * state. You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {object} partialState Next partial state to be merged with state.
   * @final
   * @protected
   */
  setState: function(partialState) {
    // Merge with `_pendingState` if it exists, otherwise with existing state.
    this.replaceState(merge(this._pendingState || this.state, partialState));
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {object} completeState Next state.
   * @final
   * @protected
   */
  replaceState: function(completeState) {
    var compositeLifeCycleState = this._compositeLifeCycleState;
    invariant(
      this._lifeCycleState === ReactComponent.LifeCycle.MOUNTED ||
      compositeLifeCycleState === CompositeLifeCycle.MOUNTING,
      'replaceState(...): Can only update a mounted (or mounting) component.'
    );
    invariant(
      compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE &&
      compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING,
      'replaceState(...): Cannot update while unmounting component or during ' +
      'an existing state transition (such as within `render`).'
    );

    this._pendingState = completeState;

    // Do not trigger a state transition if we are in the middle of mounting or
    // receiving props because both of those will already be doing this.
    if (compositeLifeCycleState !== CompositeLifeCycle.MOUNTING &&
        compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_PROPS) {
      this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_STATE;

      var nextState = this._pendingState;
      this._pendingState = null;

      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(
        this._receivePropsAndState,
        this,
        this.props,
        nextState,
        transaction
      );
      ReactComponent.ReactReconcileTransaction.release(transaction);

      this._compositeLifeCycleState = null;
    }
  },

  /**
   * Receives next props and next state, and negotiates whether or not the
   * component should update as a result.
   *
   * @param {object} nextProps Next object to set as props.
   * @param {?object} nextState Next object to set as state.
   * @param {ReactReconcileTransaction} transaction
   * @private
   */
  _receivePropsAndState: function(nextProps, nextState, transaction) {
    if (!this.shouldComponentUpdate ||
        this.shouldComponentUpdate(nextProps, nextState)) {
      // Will set `this.props` and `this.state`.
      this._performComponentUpdate(nextProps, nextState, transaction);
    } else {
      // If it's determined that a component should not update, we still want
      // to set props and state.
      this.props = nextProps;
      this.state = nextState;
    }
  },

  /**
   * Merges new props and state, notifies delegate methods of update and
   * performs update.
   *
   * @param {object} nextProps Next object to set as properties.
   * @param {?object} nextState Next object to set as state.
   * @param {ReactReconcileTransaction} transaction
   * @private
   */
  _performComponentUpdate: function(nextProps, nextState, transaction) {
    var prevProps = this.props;
    var prevState = this.state;

    if (this.componentWillUpdate) {
      this.componentWillUpdate(nextProps, nextState, transaction);
    }

    this.props = nextProps;
    this.state = nextState;

    this.updateComponent(transaction);

    if (this.componentDidUpdate) {
      transaction.getReactOnDOMReady().enqueue(
        this,
        this.componentDidUpdate.bind(this, prevProps, prevState)
      );
    }
  },

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   * @overridable
   */
  updateComponent: function(transaction) {
    var currentComponent = this._renderedComponent;
    var nextComponent = this._renderValidatedComponent();
    if (currentComponent.constructor === nextComponent.constructor) {
      if (!nextComponent.props.isStatic) {
        currentComponent.receiveProps(nextComponent.props, transaction);
      }
    } else {
      // These two IDs are actually the same! But nothing should rely on that.
      var thisID = this._rootNodeID;
      var currentComponentID = currentComponent._rootNodeID;
      currentComponent.unmountComponent();
      var nextMarkup = nextComponent.mountComponent(thisID, transaction);
      ReactComponent.DOMIDOperations.dangerouslyReplaceNodeWithMarkupByID(
        currentComponentID,
        nextMarkup
      );
      this._renderedComponent = nextComponent;
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
   * @final
   * @protected
   */
  forceUpdate: function() {
    var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
    transaction.perform(
      this._performComponentUpdate,
      this,
      this.props,
      this.state,
      transaction
    );
    ReactComponent.ReactReconcileTransaction.release(transaction);
  },

  /**
   * @private
   */
  _renderValidatedComponent: function() {
    ReactCurrentOwner.current = this;
    var renderedComponent = this.render();
    ReactCurrentOwner.current = null;
    invariant(
      ReactComponent.isValidComponent(renderedComponent),
      '%s.render(): A valid ReactComponent must be returned.',
      this.constructor.displayName || 'ReactCompositeComponent'
    );
    return renderedComponent;
  },

  /**
   * @param {object} props
   * @private
   */
  _assertValidProps: function(props) {
    var propDeclarations = this.constructor.propDeclarations;
    var componentName = this.constructor.displayName;
    for (var propName in propDeclarations) {
      var checkProp = propDeclarations[propName];
      if (checkProp) {
        checkProp(props, propName, componentName);
      }
    }
  },

  /**
   * @private
   */
  _bindAutoBindMethods: function() {
    for (var autoBindKey in this.__reactAutoBindMap) {
      if (!this.__reactAutoBindMap.hasOwnProperty(autoBindKey)) {
        continue;
      }
      var method = this.__reactAutoBindMap[autoBindKey];
      this[autoBindKey] = this._bindAutoBindMethod(method);
    }
  },

  /**
   * Binds a method to the component.
   *
   * @param {function} method Method to be bound.
   * @private
   */
  _bindAutoBindMethod: function(method) {
    var component = this;
    var hasWarned = false;
    function autoBound(a, b, c, d, e, tooMany) {
      invariant(
        typeof tooMany === 'undefined',
        'React.autoBind(...): Methods can only take a maximum of 5 arguments.'
      );
      if (component._lifeCycleState === ReactComponent.LifeCycle.MOUNTED) {
        return method.call(component, a, b, c, d, e);
      } else if (!hasWarned) {
        hasWarned = true;
        if (true) {
          console.warn(
            'React.autoBind(...): Attempted to invoke an auto-bound method ' +
            'on an unmounted instance of `%s`. You either have a memory leak ' +
            'or an event handler that is being run after unmounting.',
            component.constructor.displayName || 'ReactCompositeComponent'
          );
        }
      }
    }
    return autoBound;
  }

};

var ReactCompositeComponentBase = function() {};
mixInto(ReactCompositeComponentBase, ReactComponent.Mixin);
mixInto(ReactCompositeComponentBase, ReactOwner.Mixin);
mixInto(ReactCompositeComponentBase, ReactPropTransferer.Mixin);
mixInto(ReactCompositeComponentBase, ReactCompositeComponentMixin);

/**
 * Module for creating composite components.
 *
 * @class ReactCompositeComponent
 * @extends ReactComponent
 * @extends ReactOwner
 * @extends ReactPropTransferer
 */
var ReactCompositeComponent = {

  LifeCycle: CompositeLifeCycle,

  Base: ReactCompositeComponentBase,

  /**
   * Creates a composite component class given a class specification.
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  createClass: function(spec) {
    var Constructor = function(initialProps, children) {
      this.construct(initialProps, children);
    };
    Constructor.prototype = new ReactCompositeComponentBase();
    Constructor.prototype.constructor = Constructor;
    mixSpecIntoComponent(Constructor, spec);
    invariant(
      Constructor.prototype.render,
      'createClass(...): Class specification must implement a `render` method.'
    );

    var ConvenienceConstructor = function(props, children) {
      return new Constructor(props, children);
    };
    ConvenienceConstructor.componentConstructor = Constructor;
    ConvenienceConstructor.originalSpec = spec;
    return ConvenienceConstructor;
  },

  /**
   * Marks the provided method to be automatically bound to the component.
   * This means the method's context will always be the component.
   *
   *   React.createClass({
   *     handleClick: React.autoBind(function() {
   *       this.setState({jumping: true});
   *     }),
   *     render: function() {
   *       return <a onClick={this.handleClick}>Jump</a>;
   *     }
   *   });
   *
   * @param {function} method Method to be bound.
   * @public
   */
  autoBind: function(method) {
    function unbound() {
      invariant(
        false,
        'React.autoBind(...): Attempted to invoke an auto-bound method that ' +
        'was not correctly defined on the class specification.'
      );
    }
    unbound.__reactAutoBind = method;
    return unbound;
  }

};

module.exports = ReactCompositeComponent;

})()
},{"./ReactComponent":3,"./ReactCurrentOwner":7,"./ReactOwner":8,"./ReactPropTransferer":9,"./invariant":10,"./keyMirror":11,"./merge":12,"./mixInto":13}],3:[function(require,module,exports){
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
 * @providesModule ReactComponent
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactDOMIDOperations = require("./ReactDOMIDOperations");
var ReactMount = require("./ReactMount");
var ReactOwner = require("./ReactOwner");
var ReactReconcileTransaction = require("./ReactReconcileTransaction");

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");
var merge = require("./merge");

/**
 * Prop key that references a component's owner.
 * @private
 */
var OWNER = '{owner}';

/**
 * Every React component is in one of these life cycles.
 */
var ComponentLifeCycle = keyMirror({
  /**
   * Mounted components have a DOM node representation and are capable of
   * receiving new props.
   */
  MOUNTED: null,
  /**
   * Unmounted components are inactive and cannot receive new props.
   */
  UNMOUNTED: null
});

/**
 * Components are the basic units of composition in React.
 *
 * Every component accepts a set of keyed input parameters known as "props" that
 * are initialized by the constructor. Once a component is mounted, the props
 * can be mutated using `setProps` or `replaceProps`.
 *
 * Every component is capable of the following operations:
 *
 *   `mountComponent`
 *     Initializes the component, renders markup, and registers event listeners.
 *
 *   `receiveProps`
 *     Updates the rendered DOM nodes given a new set of props.
 *
 *   `unmountComponent`
 *     Releases any resources allocated by this component.
 *
 * Components can also be "owned" by other components. Being owned by another
 * component means being constructed by that component. This is different from
 * being the child of a component, which means having a DOM representation that
 * is a child of the DOM representation of that component.
 *
 * @class ReactComponent
 */
var ReactComponent = {

  /**
   * @param {?object} object
   * @return {boolean} True if `object` is a valid component.
   * @final
   */
  isValidComponent: function(object) {
    return !!(
      object &&
      typeof object.mountComponentIntoNode === 'function' &&
      typeof object.receiveProps === 'function'
    );
  },

  /**
   * @internal
   */
  LifeCycle: ComponentLifeCycle,

  /**
   * React references `ReactDOMIDOperations` using this property in order to
   * allow dependency injection.
   *
   * @internal
   */
  DOMIDOperations: ReactDOMIDOperations,

  /**
   * React references `ReactReconcileTransaction` using this property in order
   * to allow dependency injection.
   *
   * @internal
   */
  ReactReconcileTransaction: ReactReconcileTransaction,

  /**
   * @param {object} DOMIDOperations
   * @final
   */
  setDOMOperations: function(DOMIDOperations) {
    ReactComponent.DOMIDOperations = DOMIDOperations;
  },

  /**
   * @param {Transaction} ReactReconcileTransaction
   * @final
   */
  setReactReconcileTransaction: function(ReactReconcileTransaction) {
    ReactComponent.ReactReconcileTransaction = ReactReconcileTransaction;
  },

  /**
   * Base functionality for every ReactComponent constructor.
   *
   * @lends {ReactComponent.prototype}
   */
  Mixin: {

    /**
     * Returns the DOM node rendered by this component.
     *
     * @return {?DOMElement} The root node of this component.
     * @final
     * @protected
     */
    getDOMNode: function() {
      invariant(
        ExecutionEnvironment.canUseDOM,
        'getDOMNode(): The DOM is not supported in the current environment.'
      );
      invariant(
        this._lifeCycleState === ComponentLifeCycle.MOUNTED,
        'getDOMNode(): A component must be mounted to have a DOM node.'
      );
      var rootNode = this._rootNode;
      if (!rootNode) {
        rootNode = document.getElementById(this._rootNodeID);
        if (!rootNode) {
          // TODO: Log the frequency that we reach this path.
          rootNode = ReactMount.findReactRenderedDOMNodeSlow(this._rootNodeID);
        }
        this._rootNode = rootNode;
      }
      return rootNode;
    },

    /**
     * Sets a subset of the props.
     *
     * @param {object} partialProps Subset of the next props.
     * @final
     * @public
     */
    setProps: function(partialProps) {
      this.replaceProps(merge(this.props, partialProps));
    },

    /**
     * Replaces all of the props.
     *
     * @param {object} props New props.
     * @final
     * @public
     */
    replaceProps: function(props) {
      invariant(
        !this.props[OWNER],
        'replaceProps(...): You called `setProps` or `replaceProps` on a ' +
        'component with an owner. This is an anti-pattern since props will ' +
        'get reactively updated when rendered. Instead, change the owner\'s ' +
        '`render` method to pass the correct value as props to the component ' +
        'where it is created.'
      );
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(this.receiveProps, this, props, transaction);
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * Base constructor for all React component.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.construct.call(this, ...)`.
     *
     * @param {?object} initialProps
     * @param {*} children
     * @internal
     */
    construct: function(initialProps, children) {
      this.props = initialProps || {};
      if (typeof children !== 'undefined') {
        this.props.children = children;
      }
      // Record the component responsible for creating this component.
      this.props[OWNER] = ReactCurrentOwner.current;
      // All components start unmounted.
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;
    },

    /**
     * Initializes the component, renders markup, and registers event listeners.
     *
     * NOTE: This does not insert any nodes into the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.mountComponent.call(this, ...)`.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {ReactReconcileTransaction} transaction
     * @return {?string} Rendered markup to be inserted into the DOM.
     * @internal
     */
    mountComponent: function(rootID, transaction) {
      invariant(
        this._lifeCycleState === ComponentLifeCycle.UNMOUNTED,
        'mountComponent(%s, ...): Can only mount an unmounted component.',
        rootID
      );
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.addComponentAsRefTo(this, props.ref, props[OWNER]);
      }
      this._rootNodeID = rootID;
      this._lifeCycleState = ComponentLifeCycle.MOUNTED;
      // Effectively: return '';
    },

    /**
     * Releases any resources allocated by `mountComponent`.
     *
     * NOTE: This does not remove any nodes from the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.unmountComponent.call(this)`.
     *
     * @internal
     */
    unmountComponent: function() {
      invariant(
        this._lifeCycleState === ComponentLifeCycle.MOUNTED,
        'unmountComponent(): Can only unmount a mounted component.'
      );
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.removeComponentAsRefFrom(this, props.ref, props[OWNER]);
      }
      this._rootNode = null;
      this._rootNodeID = null;
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;
    },

    /**
     * Updates the rendered DOM nodes given a new set of props.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.receiveProps.call(this, ...)`.
     *
     * @param {object} nextProps Next set of properties.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    receiveProps: function(nextProps, transaction) {
      invariant(
        this._lifeCycleState === ComponentLifeCycle.MOUNTED,
        'receiveProps(...): Can only update a mounted component.'
      );
      var props = this.props;
      // If either the owner or a `ref` has changed, make sure the newest owner
      // has stored a reference to `this`, and the previous owner (if different)
      // has forgotten the reference to `this`.
      if (nextProps[OWNER] !== props[OWNER] || nextProps.ref !== props.ref) {
        if (props.ref != null) {
          ReactOwner.removeComponentAsRefFrom(this, props.ref, props[OWNER]);
        }
        // Correct, even if the owner is the same, and only the ref has changed.
        if (nextProps.ref != null) {
          ReactOwner.addComponentAsRefTo(this, nextProps.ref, nextProps[OWNER]);
        }
      }
    },

    /**
     * Mounts this component and inserts it into the DOM.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @final
     * @internal
     * @see {ReactMount.renderComponent}
     */
    mountComponentIntoNode: function(rootID, container) {
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(
        this._mountComponentIntoNode,
        this,
        rootID,
        container,
        transaction
      );
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @param {ReactReconcileTransaction} transaction
     * @final
     * @private
     */
    _mountComponentIntoNode: function(rootID, container, transaction) {
      var renderStart = Date.now();
      var markup = this.mountComponent(rootID, transaction);
      ReactMount.totalInstantiationTime += (Date.now() - renderStart);

      var injectionStart = Date.now();
      // Asynchronously inject markup by ensuring that the container is not in
      // the document when settings its `innerHTML`.
      var parent = container.parentNode;
      if (parent) {
        var next = container.nextSibling;
        parent.removeChild(container);
        container.innerHTML = markup;
        if (next) {
          parent.insertBefore(container, next);
        } else {
          parent.appendChild(container);
        }
      } else {
        container.innerHTML = markup;
      }
      ReactMount.totalInjectionTime += (Date.now() - injectionStart);
    },

    /**
     * Unmounts this component and removes it from the DOM.
     *
     * @param {DOMElement} container DOM element to unmount from.
     * @final
     * @internal
     * @see {ReactMount.unmountAndReleaseReactRootNode}
     */
    unmountComponentFromNode: function(container) {
      this.unmountComponent();
      // http://jsperf.com/emptying-a-node
      while (container.lastChild) {
        container.removeChild(container.lastChild);
      }
    },

    /**
     * Checks if this component is owned by the supplied `owner` component.
     *
     * @param {ReactComponent} owner Component to check.
     * @return {boolean} True if `owners` owns this component.
     * @final
     * @internal
     */
    isOwnedBy: function(owner) {
      return this.props[OWNER] === owner;
    }

  }

};

function logDeprecated(msg) {
  if (true) {
    throw new Error(msg);
  }
}

/**
 * @deprecated
 */
ReactComponent.Mixin.update = function(props) {
  logDeprecated('this.update() is deprecated. Use this.setProps()');
  this.setProps(props);
};
ReactComponent.Mixin.updateAll = function(props) {
  logDeprecated('this.updateAll() is deprecated. Use this.replaceProps()');
  this.replaceProps(props);
};

module.exports = ReactComponent;

},{"./ExecutionEnvironment":14,"./ReactCurrentOwner":7,"./ReactDOMIDOperations":15,"./ReactMount":5,"./ReactOwner":8,"./ReactReconcileTransaction":16,"./invariant":10,"./keyMirror":11,"./merge":12}],4:[function(require,module,exports){
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
 * @providesModule ReactDOM
 * @typechecks
 */

"use strict";

var ReactNativeComponent = require("./ReactNativeComponent");

var mergeInto = require("./mergeInto");
var objMapKeyVal = require("./objMapKeyVal");

/**
 * Creates a new React class that is idempotent and capable of containing other
 * React components. It accepts event listeners and DOM properties that are
 * valid according to `DOMProperty`.
 *
 *  - Event listeners: `onClick`, `onMouseDown`, etc.
 *  - DOM properties: `className`, `name`, `title`, etc.
 *
 * The `style` property functions differently from the DOM API. It accepts an
 * object mapping of style properties to values.
 *
 * @param {string} tag Tag name (e.g. `div`).
 * @param {boolean} omitClose True if the close tag should be omitted.
 * @private
 */
function createDOMComponentClass(tag, omitClose) {
  var Constructor = function(initialProps, children) {
    this.construct(initialProps, children);
  };

  Constructor.prototype = new ReactNativeComponent(tag, omitClose);
  Constructor.prototype.constructor = Constructor;

  return function(props, children) {
    return new Constructor(props, children);
  };
}

/**
 * Creates a mapping from supported HTML tags to `ReactNativeComponent` classes.
 * This is also accessible via `React.DOM`.
 *
 * @public
 */
var ReactDOM = objMapKeyVal({
  a: false,
  abbr: false,
  address: false,
  audio: false,
  b: false,
  body: false,
  br: true,
  button: false,
  code: false,
  col: true,
  colgroup: false,
  dd: false,
  div: false,
  section: false,
  dl: false,
  dt: false,
  em: false,
  embed: true,
  fieldset: false,
  footer: false,
  // Danger: this gets monkeypatched! See ReactDOMForm for more info.
  form: false,
  h1: false,
  h2: false,
  h3: false,
  h4: false,
  h5: false,
  h6: false,
  header: false,
  hr: true,
  i: false,
  iframe: false,
  img: true,
  input: true,
  label: false,
  legend: false,
  li: false,
  line: false,
  nav: false,
  object: false,
  ol: false,
  optgroup: false,
  option: false,
  p: false,
  param: true,
  pre: false,
  select: false,
  small: false,
  source: false,
  span: false,
  sub: false,
  sup: false,
  strong: false,
  table: false,
  tbody: false,
  td: false,
  textarea: false,
  tfoot: false,
  th: false,
  thead: false,
  time: false,
  title: false,
  tr: false,
  u: false,
  ul: false,
  video: false,
  wbr: false,

  // SVG
  circle: false,
  g: false,
  path: false,
  polyline: false,
  rect: false,
  svg: false,
  text: false
}, createDOMComponentClass);

var injection = {
  injectComponentClasses: function(componentClasses) {
    mergeInto(ReactDOM, componentClasses);
  }
};

ReactDOM.injection = injection;

module.exports = ReactDOM;

},{"./ReactNativeComponent":17,"./mergeInto":18,"./objMapKeyVal":19}],5:[function(require,module,exports){
(function(){/**
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

var ReactEvent = require("./ReactEvent");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactEventTopLevelCallback = require("./ReactEventTopLevelCallback");

var $ = require("./$");

var globalMountPointCounter = 0;

/** Mapping from reactRoot DOM ID to React component instance. */
var instanceByReactRootID = {};

/** Mapping from reactRoot DOM ID to `container` nodes. */
var containersByReactRootID = {};

/**
 * @param {DOMElement} container DOM element that may contain a React component.
 * @return {?string} A "reactRoot" ID, if a React component is rendered.
 */
function getReactRootID(container) {
  return container.firstChild && container.firstChild.id;
}

/**
 * Mounting is the process of initializing a React component by creatings its
 * representative DOM elements and inserting them into a supplied `container`.
 * Any prior content inside `container` is destroyed in the process.
 *
 *   ReactMount.renderComponent(component, $('container'));
 *
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
   * Ensures tht the top-level event delegation listener is set up. This will be
   * invoked some time before the first time any React component is rendered.
   *
   * @param {object} TopLevelCallbackCreator
   * @private
   */
  prepareTopLevelEvents: function(TopLevelCallbackCreator) {
    ReactEvent.ensureListening(
      ReactMount.useTouchEvents,
      TopLevelCallbackCreator
    );
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
    var prevComponent = instanceByReactRootID[getReactRootID(container)];
    if (prevComponent) {
      var nextProps = nextComponent.props;
      ReactMount.scrollMonitor(container, function() {
        prevComponent.replaceProps(nextProps);
      });
      return prevComponent;
    }

    ReactMount.prepareTopLevelEvents(ReactEventTopLevelCallback);

    var reactRootID = ReactMount.registerContainer(container);
    instanceByReactRootID[reactRootID] = nextComponent;
    nextComponent.mountComponentIntoNode(reactRootID, container);
    return nextComponent;
  },

  /**
   * Creates a function that accepts a `container` and renders the supplied
   * React component instance into it.
   *
   *   var renderInto = ReactMount.createComponentRenderer(component);
   *   // ...
   *   var component = renderInto($('container'));
   *
   * @param {ReactComponent} component Component instance to render.
   * @return {function(DOMElement): ReactComponent}
   */
  createComponentRenderer: function(component) {
    return function(container) {
      return ReactMount.renderComponent(component, container);
    };
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
      reactRootID = ReactInstanceHandles.getReactRootID(
        globalMountPointCounter++
      );
    }
    containersByReactRootID[reactRootID] = container;
    return reactRootID;
  },

  /**
   * Unmounts and destroys the React component rendered in the `container`.
   *
   * @param {DOMElement} container DOM element containing a React component.
   */
  unmountAndReleaseReactRootNode: function(container) {
    var reactRootID = getReactRootID(container);
    var component = instanceByReactRootID[reactRootID];
    // TODO: Consider throwing if no `component` was found.
    component.unmountComponentFromNode(container);
    delete instanceByReactRootID[reactRootID];
    delete containersByReactRootID[reactRootID];
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

})()
},{"./ReactEvent":20,"./ReactInstanceHandles":21,"./ReactEventTopLevelCallback":22,"./$":23}],6:[function(require,module,exports){
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
 * @providesModule ReactDefaultInjection
 */

"use strict";

var ReactDOM = require("./ReactDOM");
var ReactDOMForm = require("./ReactDOMForm");

var DefaultEventPluginOrder = require("./DefaultEventPluginOrder");
var EnterLeaveEventPlugin = require("./EnterLeaveEventPlugin");
var EventPluginHub = require("./EventPluginHub");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var SimpleEventPlugin = require("./SimpleEventPlugin");

function inject() {
  /**
   * Inject module for resolving DOM hierarchy and plugin ordering.
   */
  EventPluginHub.injection.injectEventPluginOrder(DefaultEventPluginOrder);
  EventPluginHub.injection.injectInstanceHandle(ReactInstanceHandles);

  /**
   * Two important event plugins included by default (without having to require
   * them).
   */
  EventPluginHub.injection.injectEventPluginsByName({
    'SimpleEventPlugin': SimpleEventPlugin,
    'EnterLeaveEventPlugin': EnterLeaveEventPlugin
  });

  /*
   * This is a bit of a hack. We need to override the <form> element
   * to be a composite component because IE8 does not bubble or capture
   * submit to the top level. In order to make this work with our
   * dependency graph we need to inject it here.
   */
  ReactDOM.injection.injectComponentClasses({
    form: ReactDOMForm
  });
}

module.exports = {
  inject: inject
};

},{"./ReactDOM":4,"./ReactDOMForm":24,"./DefaultEventPluginOrder":25,"./EnterLeaveEventPlugin":26,"./EventPluginHub":27,"./ReactInstanceHandles":21,"./SimpleEventPlugin":28}],7:[function(require,module,exports){
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
 * @providesModule ReactCurrentOwner
 */

"use strict";

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 */
var ReactCurrentOwner = {

  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null

};

module.exports = ReactCurrentOwner;

},{}],10:[function(require,module,exports){
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
 * @providesModule invariant
 */

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf style format and arguments to provide information about
 * what broke and what you were expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

function invariant(condition) {
  if (!condition) {
    throw new Error('Invariant Violation');
  }
}

module.exports = invariant;

if (true) {
  var invariantDev = function(condition, format, a, b, c, d, e, f) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }

    if (!condition) {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      throw new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }
  };

  module.exports = invariantDev;
}

},{}],13:[function(require,module,exports){
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
 * @providesModule mixInto
 */

"use strict";

/**
 * Simply copies properties to the prototype.
 */
var mixInto = function(constructor, methodBag) {
  var methodName;
  for (methodName in methodBag) {
    if (!methodBag.hasOwnProperty(methodName)) {
      continue;
    }
    constructor.prototype[methodName] = methodBag[methodName];
  }
};

module.exports = mixInto;

},{}],14:[function(require,module,exports){
(function(){/**
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
 * @providesModule ExecutionEnvironment
 */

/*jslint evil: true */

"use strict";

var canUseDOM = typeof window !== 'undefined';

/**
 * Simple, lightweight module assisting with the detection and context of
 * Worker. Helps avoid circular dependencies and allows code to reason about
 * whether or not they are in a Worker, even if they never include the main
 * `ReactWorker` dependency.
 */
var ExecutionEnvironment = {

  canUseDOM: canUseDOM,

  canUseWorkers: typeof Worker !== 'undefined',

  isInWorker: !canUseDOM, // For now, this is true - might change in the future.

  global: new Function('return this;')()

};

module.exports = ExecutionEnvironment;

})()
},{}],19:[function(require,module,exports){
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
 * @providesModule objMapKeyVal
 */

"use strict";

/**
 * Behaves the same as `objMap` but invokes func with the key first, and value
 * second. Use `objMap` unless you need this special case.
 * Invokes func as:
 *
 *   func(key, value, iteration)
 *
 * @param {?object} obj Object to map keys over
 * @param {!function} func Invoked for each key/val pair.
 * @param {?*} context
 * @return {?object} Result of mapping or null if obj is falsey
 */
function objMapKeyVal(obj, func, context) {
  if (!obj) {
    return null;
  }
  var i = 0;
  var ret = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret[key] = func.call(context, key, obj[key], i++);
    }
  }
  return ret;
}

module.exports = objMapKeyVal;

},{}],8:[function(require,module,exports){
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
 * @providesModule ReactOwner
 */

"use strict";

var invariant = require("./invariant");

/**
 * ReactOwners are capable of storing references to owned components.
 *
 * All components are capable of //being// referenced by owner components, but
 * only ReactOwner components are capable of //referencing// owned components.
 * The named reference is known as a "ref".
 *
 * Refs are available when mounted and updated during reconciliation.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return (
 *         <div onClick={this.handleClick}>
 *           <CustomComponent ref="custom" />
 *         </div>
 *       );
 *     },
 *     handleClick: React.autoBind(function() {
 *       this.refs.custom.handleClick();
 *     }),
 *     componentDidMount: function() {
 *       this.refs.custom.initialize();
 *     }
 *   });
 *
 * Refs should rarely be used. When refs are used, they should only be done to
 * control data that is not handled by React's data flow.
 *
 * @class ReactOwner
 */
var ReactOwner = {

  /**
   * @param {?object} object
   * @return {boolean} True if `object` is a valid owner.
   * @final
   */
  isValidOwner: function(object) {
    return !!(
      object &&
      typeof object.attachRef === 'function' &&
      typeof object.detachRef === 'function'
    );
  },

  /**
   * Adds a component by ref to an owner component.
   *
   * @param {ReactComponent} component Component to reference.
   * @param {string} ref Name by which to refer to the component.
   * @param {ReactOwner} owner Component on which to record the ref.
   * @final
   * @internal
   */
  addComponentAsRefTo: function(component, ref, owner) {
    invariant(
      ReactOwner.isValidOwner(owner),
      'addComponentAsRefTo(...): Only a ReactOwner can have refs.'
    );
    owner.attachRef(ref, component);
  },

  /**
   * Removes a component by ref from an owner component.
   *
   * @param {ReactComponent} component Component to dereference.
   * @param {string} ref Name of the ref to remove.
   * @param {ReactOwner} owner Component on which the ref is recorded.
   * @final
   * @internal
   */
  removeComponentAsRefFrom: function(component, ref, owner) {
    invariant(
      ReactOwner.isValidOwner(owner),
      'removeComponentAsRefFrom(...): Only a ReactOwner can have refs.'
    );
    // Check that `component` is still the current ref because we do not want to
    // detach the ref if another component stole it.
    if (owner.refs[ref] === component) {
      owner.detachRef(ref);
    }
  },

  /**
   * A ReactComponent must mix this in to have refs.
   *
   * @lends {ReactOwner.prototype}
   */
  Mixin: {

    /**
     * Lazily allocates the refs object and stores `component` as `ref`.
     *
     * @param {string} ref Reference name.
     * @param {component} component Component to store as `ref`.
     * @final
     * @private
     */
    attachRef: function(ref, component) {
      invariant(
        component.isOwnedBy(this),
        'attachRef(%s, ...): Only a component\'s owner can store a ref to it.',
        ref
      );
      var refs = this.refs || (this.refs = {});
      refs[ref] = component;
    },

    /**
     * Detaches a reference name.
     *
     * @param {string} ref Name to dereference.
     * @final
     * @private
     */
    detachRef: function(ref) {
      delete this.refs[ref];
    }

  }

};

module.exports = ReactOwner;

},{"./invariant":10}],9:[function(require,module,exports){
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
 * @providesModule ReactPropTransferer
 */

"use strict";

var emptyFunction = require("./emptyFunction");
var joinClasses = require("./joinClasses");
var merge = require("./merge");

/**
 * Creates a transfer strategy that will merge prop values using the supplied
 * `mergeStrategy`. If a prop was previously unset, this just sets it.
 *
 * @param {function} mergeStrategy
 * @return {function}
 */
function createTransferStrategy(mergeStrategy) {
  return function(props, key, value) {
    if (!props.hasOwnProperty(key)) {
      props[key] = value;
    } else {
      props[key] = mergeStrategy(props[key], value);
    }
  };
}

/**
 * Transfer strategies dictate how props are transferred by `transferPropsTo`.
 */
var TransferStrategies = {
  /**
   * Never transfer the `ref` prop.
   */
  ref: emptyFunction,
  /**
   * Transfer the `className` prop by merging them.
   */
  className: createTransferStrategy(joinClasses),
  /**
   * Transfer the `style` prop (which is an object) by merging them.
   */
  style: createTransferStrategy(merge)
};

/**
 * ReactPropTransferer are capable of transferring props to another component
 * using a `transferPropsTo` method.
 *
 * @class ReactPropTransferer
 */
var ReactPropTransferer = {

  TransferStrategies: TransferStrategies,

  /**
   * @lends {ReactPropTransferer.prototype}
   */
  Mixin: {

    /**
     * Transfer props from this component to a target component.
     *
     * Props that do not have an explicit transfer strategy will be transferred
     * only if the target component does not already have the prop set.
     *
     * This is usually used to pass down props to a returned root component.
     *
     * @param {ReactComponent} component Component receiving the properties.
     * @return {ReactComponent} The supplied `component`.
     * @final
     * @protected
     */
    transferPropsTo: function(component) {
      var props = {};
      for (var thatKey in component.props) {
        if (component.props.hasOwnProperty(thatKey)) {
          props[thatKey] = component.props[thatKey];
        }
      }
      for (var thisKey in this.props) {
        if (!this.props.hasOwnProperty(thisKey)) {
          continue;
        }
        var transferStrategy = TransferStrategies[thisKey];
        if (transferStrategy) {
          transferStrategy(props, thisKey, this.props[thisKey]);
        } else if (!props.hasOwnProperty(thisKey)) {
          props[thisKey] = this.props[thisKey];
        }
      }
      component.props = props;
      return component;
    }

  }

};

module.exports = ReactPropTransferer;

},{"./emptyFunction":29,"./joinClasses":30,"./merge":12}],11:[function(require,module,exports){
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
 * @providesModule keyMirror
 */

"use strict";

var throwIf = require("./throwIf");

var NOT_OBJECT_ERROR = 'NOT_OBJECT_ERROR';
if (true) {
  NOT_OBJECT_ERROR = 'keyMirror only works on objects';
}

/**
 * Utility for constructing enums with keys being equal to the associated
 * values, even when using advanced key crushing. This is useful for debugging,
 * but also for using the values themselves as lookups into the enum.
 * Example:
 * var COLORS = keyMirror({blue: null, red: null});
 * var myColor = COLORS.blue;
 * var isColorValid = !!COLORS[myColor]
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 * Input:  {key1: val1, key2: val2}
 * Output: {key1: key1, key2: key2}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;

  throwIf(!(obj instanceof Object) || Array.isArray(obj), NOT_OBJECT_ERROR);

  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

},{"./throwIf":31}],12:[function(require,module,exports){
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
 * @providesModule merge
 */

"use strict";

var mergeInto = require("./mergeInto");

/**
 * Shallow merges two structures into a return value, without mutating either.
 *
 * @param {?object} one Optional object with properties to merge from.
 * @param {?object} two Optional object with properties to merge from.
 * @return {object} The shallow extension of one by two.
 */
var merge = function(one, two) {
  var result = {};
  mergeInto(result, one);
  mergeInto(result, two);
  return result;
};

module.exports = merge;

},{"./mergeInto":18}],15:[function(require,module,exports){
(function(){/**
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
 * @providesModule ReactDOMIDOperations
 * @typechecks
 */

/*jslint evil: true */

"use strict";

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMChildrenOperations = require("./DOMChildrenOperations");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactDOMNodeCache = require("./ReactDOMNodeCache");

var getTextContentAccessor = require("./getTextContentAccessor");
var invariant = require("./invariant");

/**
 * Errors for properties that should not be updated with `updatePropertyById()`.
 *
 * @type {object}
 * @private
 */
var INVALID_PROPERTY_ERRORS = {
  content: '`content` must be set using `updateTextContentByID()`.',
  dangerouslySetInnerHTML:
    '`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.',
  style: '`style` must be set using `updateStylesByID()`.'
};

/**
 * The DOM property to use when setting text content.
 *
 * @type {string}
 * @private
 */
var textContentAccessor = getTextContentAccessor() || 'NA';

/**
 * Operations used to process updates to DOM nodes. This is made injectable via
 * `ReactComponent.DOMIDOperations`.
 */
var ReactDOMIDOperations = {

  /**
   * Updates a DOM node with new property values. This should only be used to
   * update DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A valid property name, see `DOMProperty`.
   * @param {*} value New value of the property.
   * @internal
   */
  updatePropertyByID: function(id, name, value) {
    var node = ReactDOMNodeCache.getCachedNodeByID(id);
    invariant(
      !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
      'updatePropertyByID(...): %s',
      INVALID_PROPERTY_ERRORS[name]
    );
    DOMPropertyOperations.setValueForProperty(node, name, value);
  },

  /**
   * This should almost never be used instead of `updatePropertyByID()` due to
   * the extra object allocation required by the API. That said, this is useful
   * for batching up several operations across worker thread boundaries.
   *
   * @param {string} id ID of the node to update.
   * @param {object} properties A mapping of valid property names.
   * @internal
   * @see {ReactDOMIDOperations.updatePropertyByID}
   */
  updatePropertiesByID: function(id, properties) {
    for (var name in properties) {
      if (!properties.hasOwnProperty(name)) {
        continue;
      }
      ReactDOMIDOperations.updatePropertiesByID(id, name, properties[name]);
    }
  },

  /**
   * Updates a DOM node with new style values.
   *
   * @param {string} id ID of the node to update.
   * @param {object} styles Mapping from styles to values.
   * @internal
   */
  updateStylesByID: function(id, styles) {
    var node = ReactDOMNodeCache.getCachedNodeByID(id);
    CSSPropertyOperations.setValueForStyles(node, styles);
  },

  /**
   * Updates a DOM node's innerHTML set by `props.dangerouslySetInnerHTML`.
   *
   * @param {string} id ID of the node to update.
   * @param {object} html An HTML object with the `__html` property.
   * @internal
   */
  updateInnerHTMLByID: function(id, html) {
    var node = ReactDOMNodeCache.getCachedNodeByID(id);
    // HACK: IE8- normalize whitespace in innerHTML, removing leading spaces.
    // @see quirksmode.org/bugreports/archives/2004/11/innerhtml_and_t.html
    node.innerHTML = (html && html.__html || '').replace(/^ /g, '&nbsp;');
  },

  /**
   * Updates a DOM node's text content set by `props.content`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} content Text content.
   * @internal
   */
  updateTextContentByID: function(id, content) {
    var node = ReactDOMNodeCache.getCachedNodeByID(id);
    node[textContentAccessor] = content;
  },

  /**
   * Replaces a DOM node that exists in the document with markup.
   *
   * @param {string} id ID of child to be replaced.
   * @param {string} markup Dangerous markup to inject in place of child.
   * @internal
   * @see {Danger.dangerouslyReplaceNodeWithMarkup}
   */
  dangerouslyReplaceNodeWithMarkupByID: function(id, markup) {
    var node = ReactDOMNodeCache.getCachedNodeByID(id);
    DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node, markup);
    ReactDOMNodeCache.purgeEntireCache();
  },

  /**
   * TODO: We only actually *need* to purge the cache when we remove elements.
   *       Detect if any elements were removed instead of blindly purging.
   */
  manageChildrenByParentID: function(parentID, domOperations) {
    var parent = ReactDOMNodeCache.getCachedNodeByID(parentID);
    DOMChildrenOperations.manageChildren(parent, domOperations);
    ReactDOMNodeCache.purgeEntireCache();
  },

  setTextNodeValueAtIndexByParentID: function(parentID, index, value) {
    var parent = ReactDOMNodeCache.getCachedNodeByID(parentID);
    DOMChildrenOperations.setTextNodeValueAtIndex(parent, index, value);
  }

};

module.exports = ReactDOMIDOperations;

})()
},{"./CSSPropertyOperations":32,"./DOMChildrenOperations":33,"./DOMPropertyOperations":34,"./ReactDOMNodeCache":35,"./getTextContentAccessor":36,"./invariant":10}],16:[function(require,module,exports){
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
 * @providesModule ReactReconcileTransaction
 * @typechecks
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");
var PooledClass = require("./PooledClass");
var ReactEvent = require("./ReactEvent");
var ReactInputSelection = require("./ReactInputSelection");
var ReactOnDOMReady = require("./ReactOnDOMReady");
var Transaction = require("./Transaction");

var mixInto = require("./mixInto");

/**
 * Ensures that, when possible, the selection range (currently selected text
 * input) is not disturbed by performing the transaction.
 */
var SELECTION_RESTORATION = {
  /**
   * @return {Selection} Selection information.
   */
  initialize: ReactInputSelection.getSelectionInformation,
  /**
   * @param {Selection} sel Selection information returned from `initialize`.
   */
  close: ReactInputSelection.restoreSelection
};

/**
 * Suppresses events (blur/focus) that could be inadvertently dispatched due to
 * high level DOM manipulations (like temporarily removing a text input from the
 * DOM).
 */
var EVENT_SUPPRESSION = {
  /**
   * @return {boolean} The enabled status of `ReactEvent` before the
   * reconciliation.
   */
  initialize: function() {
    var currentlyEnabled = ReactEvent.isEnabled();
    ReactEvent.setEnabled(false);
    return currentlyEnabled;
  },

  /**
   * @param {boolean} previouslyEnabled The enabled status of `ReactEvent`
   *   before the reconciliation occured. `close` restores the previous value.
   */
  close: function(previouslyEnabled) {
    ReactEvent.setEnabled(previouslyEnabled);
  }
};

/**
 * Provides a `ReactOnDOMReady` queue for collecting `onDOMReady` callbacks
 * during the performing of the transaction.
 */
var ON_DOM_READY_QUEUEING = {
  /**
   * Initializes the internal `onDOMReady` queue.
   */
  initialize: function() {
    this.reactOnDOMReady.reset();
  },

  /**
   * After DOM is flushed, invoke all registered `onDOMReady` callbacks.
   */
  close: function() {
    this.reactOnDOMReady.notifyAll();
  }
};

/**
 * Executed within the scope of the `Transaction` instance. Consider these as
 * being member methods, but with an implied ordering while being isolated from
 * each other.
 */
var TRANSACTION_WRAPPERS = [
  SELECTION_RESTORATION,
  EVENT_SUPPRESSION,
  ON_DOM_READY_QUEUEING
];

/**
 * Currently:
 * - The order that these are listed in the transaction is critical:
 * - Suppresses events.
 * - Restores selection range.
 *
 * Future:
 * - Restore document/overflow scroll positions that were unintentionally
 *   modified via DOM insertions above the top viewport boundary.
 * - Implement/integrate with customized constraint based layout system and keep
 *   track of which dimensions must be remeasured.
 *
 * @class ReactReconcileTransaction
 */
function ReactReconcileTransaction() {
  this.reinitializeTransaction();
  this.reactOnDOMReady = ReactOnDOMReady.getPooled(null);
}

var Mixin = {
  /**
   * @see Transaction
   * @abstract
   * @final
   * @return {array<object>} List of operation wrap proceedures.
   *   TODO: convert to array<TransactionWrapper>
   */
  getTransactionWrappers: function() {
    if (ExecutionEnvironment.canUseDOM) {
      return TRANSACTION_WRAPPERS;
    } else {
      return [];
    }
  },

  /**
   * @return {object} The queue to collect `onDOMReady` callbacks with.
   *   TODO: convert to ReactOnDOMReady
   */
  getReactOnDOMReady: function() {
    return this.reactOnDOMReady;
  },

  /**
   * `PooledClass` looks for this, and will invoke this before allowing this
   * instance to be resused.
   */
  destructor: function() {
    ReactOnDOMReady.release(this.reactOnDOMReady);
    this.reactOnDOMReady = null;
  }
};


mixInto(ReactReconcileTransaction, Transaction.Mixin);
mixInto(ReactReconcileTransaction, Mixin);

PooledClass.addPoolingTo(ReactReconcileTransaction);

module.exports = ReactReconcileTransaction;

},{"./ExecutionEnvironment":14,"./PooledClass":37,"./ReactEvent":20,"./ReactInputSelection":38,"./ReactOnDOMReady":39,"./Transaction":40,"./mixInto":13}],17:[function(require,module,exports){
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
 * @providesModule ReactNativeComponent
 * @typechecks
 */

"use strict";

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactComponent = require("./ReactComponent");
var ReactEvent = require("./ReactEvent");
var ReactMultiChild = require("./ReactMultiChild");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var flattenChildren = require("./flattenChildren");
var invariant = require("./invariant");
var keyOf = require("./keyOf");
var merge = require("./merge");
var mixInto = require("./mixInto");

var putListener = ReactEvent.putListener;
var registrationNames = ReactEvent.registrationNames;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

var CONTENT = keyOf({content: null});
var DANGEROUSLY_SET_INNER_HTML = keyOf({dangerouslySetInnerHTML: null});
var STYLE = keyOf({style: null});

/**
 * @param {?object} props
 */
function assertValidProps(props) {
  if (!props) {
    return;
  }
  // Note the use of `!=` which checks for null or undefined.
  var hasChildren = props.children != null ? 1 : 0;
  var hasContent = props.content != null ? 1 : 0;
  var hasInnerHTML = props.dangerouslySetInnerHTML != null ? 1 : 0;
  invariant(
    hasChildren + hasContent + hasInnerHTML <= 1,
    'Can only set one of `children`, `props.content`, or ' +
    '`props.dangerouslySetInnerHTML`.'
  );
  invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
    'not a string.'
  );
}

/**
 * @constructor ReactNativeComponent
 * @extends ReactComponent
 * @extends ReactMultiChild
 */
function ReactNativeComponent(tag, omitClose) {
  this._tagOpen = '<' + tag + ' ';
  this._tagClose = omitClose ? '' : '</' + tag + '>';
  this.tagName = tag.toUpperCase();
}

ReactNativeComponent.Mixin = {

  /**
   * Generates root tag markup then recurses. This method has side effects and
   * is not idempotent.
   *
   * @internal
   * @param {string} rootID The root DOM ID for this node.
   * @param {ReactReconcileTransaction} transaction
   * @return {string} The computed markup.
   */
  mountComponent: function(rootID, transaction) {
    ReactComponent.Mixin.mountComponent.call(this, rootID, transaction);
    assertValidProps(this.props);
    return (
      this._createOpenTagMarkup() +
      this._createContentMarkup(transaction) +
      this._tagClose
    );
  },

  /**
   * Creates markup for the open tag and all attributes.
   *
   * This method has side effects because events get registered.
   *
   * Iterating over object properties is faster than iterating over arrays.
   * @see http://jsperf.com/obj-vs-arr-iteration
   *
   * @private
   * @return {string} Markup of opening tag.
   */
  _createOpenTagMarkup: function() {
    var props = this.props;
    var ret = this._tagOpen;

    for (var propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      var propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      if (registrationNames[propKey]) {
        putListener(this._rootNodeID, propKey, propValue);
      } else {
        if (propKey === STYLE) {
          if (propValue) {
            propValue = props.style = merge(props.style);
          }
          propValue = CSSPropertyOperations.createMarkupForStyles(propValue);
        }
        var markup =
          DOMPropertyOperations.createMarkupForProperty(propKey, propValue);
        if (markup) {
          ret += ' ' + markup;
        }
      }
    }

    return ret + ' id="' + this._rootNodeID + '">';
  },

  /**
   * Creates markup for the content between the tags.
   *
   * @private
   * @param {ReactReconcileTransaction} transaction
   * @return {string} Content markup.
   */
  _createContentMarkup: function(transaction) {
    // Intentional use of != to avoid catching zero/false.
    var innerHTML = this.props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        return innerHTML.__html;
      }
    } else {
      var contentToUse = this.props.content != null ? this.props.content :
        CONTENT_TYPES[typeof this.props.children] ? this.props.children : null;
      var childrenToUse = contentToUse != null ? null : this.props.children;
      if (contentToUse != null) {
        return escapeTextForBrowser(contentToUse);
      } else if (childrenToUse != null) {
        return this.mountMultiChild(
          flattenChildren(childrenToUse),
          transaction
        );
      }
    }
    return '';
  },

  /**
   * Controls a native DOM component after it has already been allocated and
   * attached to the DOM. Reconciles the root DOM node, then recurses.
   *
   * @internal
   * @param {object} nextProps
   * @param {ReactReconcileTransaction} transaction
   */
  receiveProps: function(nextProps, transaction) {
    invariant(
      this._rootNodeID,
      'Trying to control a native dom element without a backing id'
    );
    assertValidProps(nextProps);
    ReactComponent.Mixin.receiveProps.call(this, nextProps, transaction);
    this._updateDOMProperties(nextProps);
    this._updateDOMChildren(nextProps, transaction);
    this.props = nextProps;
  },

  /**
   * Reconciles the properties by detecting differences in property values and
   * updating the DOM as necessary. This function is probably the single most
   * critical path for performance optimization.
   *
   * TODO: Benchmark whether checking for changed values in memory actually
   *       improves performance (especially statically positioned elements).
   * TODO: Benchmark the effects of putting this at the top since 99% of props
   *       do not change for a given reconciliation.
   * TODO: Benchmark areas that can be improved with caching.
   *
   * @private
   * @param {object} nextProps
   */
  _updateDOMProperties: function(nextProps) {
    var lastProps = this.props;
    for (var propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp = lastProps[propKey];
      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp) {
        continue;
      }
      if (propKey === STYLE) {
        if (nextProp) {
          nextProp = nextProps.style = merge(nextProp);
        }
        var styleUpdates;
        for (var styleName in nextProp) {
          if (!nextProp.hasOwnProperty(styleName)) {
            continue;
          }
          if (!lastProp || lastProp[styleName] !== nextProp[styleName]) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = nextProp[styleName];
          }
        }
        if (styleUpdates) {
          ReactComponent.DOMIDOperations.updateStylesByID(
            this._rootNodeID,
            styleUpdates
          );
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
        var lastHtml = lastProp && lastProp.__html;
        var nextHtml = nextProp && nextProp.__html;
        if (lastHtml !== nextHtml) {
          ReactComponent.DOMIDOperations.updateInnerHTMLByID(
            this._rootNodeID,
            nextProp
          );
        }
      } else if (propKey === CONTENT) {
        ReactComponent.DOMIDOperations.updateTextContentByID(
          this._rootNodeID,
          '' + nextProp
        );
      } else if (registrationNames[propKey]) {
        putListener(this._rootNodeID, propKey, nextProp);
      } else {
        ReactComponent.DOMIDOperations.updatePropertyByID(
          this._rootNodeID,
          propKey,
          nextProp
        );
      }
    }
  },

  /**
   * Reconciles the children with the various properties that affect the
   * children content.
   *
   * @param {object} nextProps
   * @param {ReactReconcileTransaction} transaction
   */
  _updateDOMChildren: function(nextProps, transaction) {
    var thisPropsContentType = typeof this.props.content;
    var thisPropsContentEmpty =
      this.props.content == null || thisPropsContentType === 'boolean';
    var nextPropsContentType = typeof nextProps.content;
    var nextPropsContentEmpty =
      nextProps.content == null || nextPropsContentType === 'boolean';

    var lastUsedContent = !thisPropsContentEmpty ? this.props.content :
      CONTENT_TYPES[typeof this.props.children] ? this.props.children : null;

    var contentToUse = !nextPropsContentEmpty ? nextProps.content :
      CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;

    // Note the use of `!=` which checks for null or undefined.

    var lastUsedChildren =
      lastUsedContent != null ? null : this.props.children;
    var childrenToUse = contentToUse != null ? null : nextProps.children;

    if (contentToUse != null) {
      var childrenRemoved = lastUsedChildren != null && childrenToUse == null;
      if (childrenRemoved) {
        this.updateMultiChild(null, transaction);
      }
      if (lastUsedContent !== contentToUse) {
        ReactComponent.DOMIDOperations.updateTextContentByID(
          this._rootNodeID,
          '' + contentToUse
        );
      }
    } else {
      var contentRemoved = lastUsedContent != null && contentToUse == null;
      if (contentRemoved) {
        ReactComponent.DOMIDOperations.updateTextContentByID(
          this._rootNodeID,
          ''
        );
      }
      this.updateMultiChild(flattenChildren(nextProps.children), transaction);
    }
  },

  /**
   * Destroys all event registrations for this instance. Does not remove from
   * the DOM. That must be done by the parent.
   *
   * @internal
   */
  unmountComponent: function() {
    ReactComponent.Mixin.unmountComponent.call(this);
    this.unmountMultiChild();
    ReactEvent.deleteAllListeners(this._rootNodeID);
  }

};

mixInto(ReactNativeComponent, ReactComponent.Mixin);
mixInto(ReactNativeComponent, ReactNativeComponent.Mixin);
mixInto(ReactNativeComponent, ReactMultiChild.Mixin);

module.exports = ReactNativeComponent;

},{"./DOMPropertyOperations":34,"./CSSPropertyOperations":32,"./ReactComponent":3,"./ReactEvent":20,"./ReactMultiChild":41,"./escapeTextForBrowser":42,"./flattenChildren":43,"./invariant":10,"./merge":12,"./keyOf":44,"./mixInto":13}],18:[function(require,module,exports){
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
 * @providesModule mergeInto
 * @typechecks
 */

"use strict";

var mergeHelpers = require("./mergeHelpers");

var checkMergeObjectArg = mergeHelpers.checkMergeObjectArg;

/**
 * Shallow merges two structures by mutating the first parameter.
 *
 * @param {object} one Object to be merged into.
 * @param {?object} two Optional object with properties to merge from.
 */
function mergeInto(one, two) {
  checkMergeObjectArg(one);
  if (two != null) {
    checkMergeObjectArg(two);
    for (var key in two) {
      if (!two.hasOwnProperty(key)) {
        continue;
      }
      one[key] = two[key];
    }
  }
}

module.exports = mergeInto;

},{"./mergeHelpers":45}],20:[function(require,module,exports){
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
 * @providesModule ReactEvent
 */

"use strict";

var BrowserEnv = require("./BrowserEnv");
var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var NormalizedEventListener = require("./NormalizedEventListener");

var invariant = require("./invariant");
var isEventSupported = require("./isEventSupported");

var registrationNames = EventPluginHub.registrationNames;
var topLevelTypes = EventConstants.topLevelTypes;
var listen = NormalizedEventListener.listen;
var capture = NormalizedEventListener.capture;

/**
 * `ReactEvent` is used to attach top-level event listeners. For example:
 *
 *   ReactEvent.putListener('myID', 'onClick', myFunction);
 *
 * This would allocate a "registration" of `('onClick', myFunction)` on 'myID'.
 */

/**
 * Overview of React and the event system:
 *
 *                    .
 * +-------------+    .
 * |    DOM      |    .
 * +-------------+    .                          +-----------+
 *       +            .                +--------+|SimpleEvent|
 *       |            .                |         |Plugin     |
 * +-----|-------+    .                v         +-----------+
 * |     |       |    .     +--------------+                    +------------+
 * |     +------------.---->|EventPluginHub|                    |    Event   |
 * |             |    .     |              |     +-----------+  | Propagators|
 * | ReactEvent  |    .     |              |     |TapEvent   |  |------------|
 * |             |    .     |              |<---+|Plugin     |  |other plugin|
 * |     +------------.---------+          |     +-----------+  |  utilities |
 * |     |       |    .     |   |          |                    +------------+
 * |     |       |    .     +---|----------+
 * |     |       |    .         |       ^        +-----------+
 * |     |       |    .         |       |        |Enter/Leave|
 * +-----| ------+    .         |       +-------+|Plugin     |
 *       |            .         v                +-----------+
 *       +            .      +--------+
 * +-------------+    .      |callback|
 * | application |    .      |registry|
 * |-------------|    .      +--------+
 * |             |    .
 * |             |    .
 * |             |    .
 * |             |    .
 * +-------------+    .
 *                    .
 *    React Core      .  General Purpose Event Plugin System
 */

/**
 * We listen for bubbled touch events on the document object.
 *
 * Firefox v8.01 (and possibly others) exhibited strange behavior when mounting
 * `onmousemove` events at some node that was not the document element. The
 * symptoms were that if your mouse is not moving over something contained
 * within that mount point (for example on the background) the top-level
 * listeners for `onmousemove` won't be called. However, if you register the
 * `mousemove` on the document object, then it will of course catch all
 * `mousemove`s. This along with iOS quirks, justifies restricting top-level
 * listeners to the document object only, at least for these movement types of
 * events and possibly all events.
 *
 * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
 *
 * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
 * they bubble to document.
 *
 * @see http://www.quirksmode.org/dom/events/keys.html.
 */

var _isListening = false;

var EVENT_LISTEN_MISUSE;
var WORKER_DISABLE;

if (true) {
  EVENT_LISTEN_MISUSE =
    'You must register listeners at the top of the document, only once - ' +
    'and only in the main UI thread of a browser - if you are attempting ' +
    'listen in a worker, the framework is probably doing something wrong ' +
    'and you should report this immediately.';
  WORKER_DISABLE =
    'Cannot disable event listening in Worker thread. This is likely a ' +
    'bug in the framework. Please report immediately.';
}


/**
 * Traps top-level events that bubble. Delegates to the main dispatcher
 * `handleTopLevel` after performing some basic normalization via
 * `TopLevelCallbackCreator.createTopLevelCallback`.
 */
function trapBubbledEvent(topLevelType, handlerBaseName, onWhat) {
  listen(
    onWhat,
    handlerBaseName,
    ReactEvent.TopLevelCallbackCreator.createTopLevelCallback(topLevelType)
  );
}

/**
 * Traps a top-level event by using event capturing.
 */
function trapCapturedEvent(topLevelType, handlerBaseName, onWhat) {
  capture(
    onWhat,
    handlerBaseName,
    ReactEvent.TopLevelCallbackCreator.createTopLevelCallback(topLevelType)
  );
}

/**
 * Listens to document scroll and window resize events that may change the
 * document scroll values. We store those results so as to discourage
 * application code from asking the DOM itself which could trigger additional
 * reflows.
 */
function registerDocumentScrollListener() {
  listen(window, 'scroll', function(nativeEvent) {
    if (nativeEvent.target === window) {
      BrowserEnv.refreshAuthoritativeScrollValues();
    }
  });
}

function registerDocumentResizeListener() {
  listen(window, 'resize', function(nativeEvent) {
    if (nativeEvent.target === window) {
      BrowserEnv.refreshAuthoritativeScrollValues();
    }
  });
}

/**
 * Summary of `ReactEvent` event handling:
 *
 *  - We trap low level 'top-level' events.
 *
 *  - We dedupe cross-browser event names into these 'top-level types' so that
 *    `DOMMouseScroll` or `mouseWheel` both become `topMouseWheel`.
 *
 *  - At this point we have native browser events with the top-level type that
 *    was used to catch it at the top-level.
 *
 *  - We continuously stream these native events (and their respective top-level
 *    types) to the event plugin system `EventPluginHub` and ask the plugin
 *    system if it was able to extract `AbstractEvent` objects. `AbstractEvent`
 *    objects are the events that applications actually deal with - they are not
 *    native browser events but cross-browser wrappers.
 *
 *  - When returning the `AbstractEvent` objects, `EventPluginHub` will make
 *    sure each abstract event is annotated with "dispatches", which are the
 *    sequence of listeners (and IDs) that care about the event.
 *
 *  - These `AbstractEvent` objects are fed back into the event plugin system,
 *    which in turn executes these dispatches.
 *
 * @private
 */
function listenAtTopLevel(touchNotMouse) {
  invariant(
    !_isListening,
    'listenAtTopLevel(...): Cannot setup top-level listener more than once.'
  );
  var mountAt = document;

  registerDocumentScrollListener();
  registerDocumentResizeListener();
  trapBubbledEvent(topLevelTypes.topMouseOver, 'mouseover', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseDown, 'mousedown', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseUp, 'mouseup', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseMove, 'mousemove', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseOut, 'mouseout', mountAt);
  trapBubbledEvent(topLevelTypes.topClick, 'click', mountAt);
  trapBubbledEvent(topLevelTypes.topDoubleClick, 'dblclick', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseWheel, 'mousewheel', mountAt);
  if (touchNotMouse) {
    trapBubbledEvent(topLevelTypes.topTouchStart, 'touchstart', mountAt);
    trapBubbledEvent(topLevelTypes.topTouchEnd, 'touchend', mountAt);
    trapBubbledEvent(topLevelTypes.topTouchMove, 'touchmove', mountAt);
    trapBubbledEvent(topLevelTypes.topTouchCancel, 'touchcancel', mountAt);
  }
  trapBubbledEvent(topLevelTypes.topKeyUp, 'keyup', mountAt);
  trapBubbledEvent(topLevelTypes.topKeyPress, 'keypress', mountAt);
  trapBubbledEvent(topLevelTypes.topKeyDown, 'keydown', mountAt);
  trapBubbledEvent(topLevelTypes.topChange, 'change', mountAt);
  trapBubbledEvent(
    topLevelTypes.topDOMCharacterDataModified,
    'DOMCharacterDataModified',
    mountAt
  );

  // Firefox needs to capture a different mouse scroll event.
  // @see http://www.quirksmode.org/dom/events/tests/scroll.html
  trapBubbledEvent(topLevelTypes.topMouseWheel, 'DOMMouseScroll', mountAt);
  // IE < 9 doesn't support capturing so just trap the bubbled event there.
  if (isEventSupported('scroll', true)) {
    trapCapturedEvent(topLevelTypes.topScroll, 'scroll', mountAt);
  } else {
    trapBubbledEvent(topLevelTypes.topScroll, 'scroll', window);
  }

  if (isEventSupported('focus', true)) {
    trapCapturedEvent(topLevelTypes.topFocus, 'focus', mountAt);
    trapCapturedEvent(topLevelTypes.topBlur, 'blur', mountAt);
  } else if (isEventSupported('focusin')) {
    // IE has `focusin` and `focusout` events which bubble.
    // @see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
    trapBubbledEvent(topLevelTypes.topFocus, 'focusin', mountAt);
    trapBubbledEvent(topLevelTypes.topBlur, 'focusout', mountAt);
  }
}

/**
 * This is the heart of `ReactEvent`. It simply streams the top-level native
 * events to `EventPluginHub`.
 *
 * @param {object} topLevelType Record from `EventConstants`.
 * @param {Event} nativeEvent A Standard Event with fixed `target` property.
 * @param {DOMElement} renderedTarget Element of interest to the framework.
 * @param {string} renderedTargetID string ID of `renderedTarget`.
 * @internal
 */
function handleTopLevel(
    topLevelType,
    nativeEvent,
    renderedTargetID,
    renderedTarget) {
  var abstractEvents = EventPluginHub.extractAbstractEvents(
    topLevelType,
    nativeEvent,
    renderedTargetID,
    renderedTarget
  );

  // The event queue being processed in the same cycle allows preventDefault.
  EventPluginHub.enqueueAbstractEvents(abstractEvents);
  EventPluginHub.processAbstractEventQueue();
}

function setEnabled(enabled) {
  invariant(
    ExecutionEnvironment.canUseDOM,
    'setEnabled(...): Cannot toggle event listening in a Worker thread. This ' +
    'is likely a bug in the framework. Please report immediately.'
  );
  ReactEvent.TopLevelCallbackCreator.setEnabled(enabled);
}

function isEnabled() {
  return ReactEvent.TopLevelCallbackCreator.isEnabled();
}

/**
 * Ensures that top-level event delegation listeners are listening at `mountAt`.
 * There are issues with listening to both touch events and mouse events on the
 * top-level, so we make the caller choose which one to listen to. (If there's a
 * touch top-level listeners, anchors don't receive clicks for some reason, and
 * only in some cases).
 *
 * @param {boolean} touchNotMouse Listen to touch events instead of mouse.
 * @param {object} TopLevelCallbackCreator Module that can create top-level
 *   callback handlers.
 * @internal
 */
function ensureListening(touchNotMouse, TopLevelCallbackCreator) {
  invariant(
    ExecutionEnvironment.canUseDOM,
    'ensureListening(...): Cannot toggle event listening in a Worker thread. ' +
    'This is likely a bug in the framework. Please report immediately.'
  );
  if (!_isListening) {
    ReactEvent.TopLevelCallbackCreator = TopLevelCallbackCreator;
    listenAtTopLevel(touchNotMouse);
    _isListening = true;
  }
}

var ReactEvent = {
  TopLevelCallbackCreator: null, // Injectable callback creator.
  handleTopLevel: handleTopLevel,
  setEnabled: setEnabled,
  isEnabled: isEnabled,
  ensureListening: ensureListening,
  registrationNames: registrationNames,
  putListener: EventPluginHub.putListener,
  getListener: EventPluginHub.getListener,
  deleteAllListeners: EventPluginHub.deleteAllListeners,
  trapBubbledEvent: trapBubbledEvent,
  trapCapturedEvent: trapCapturedEvent
};

module.exports = ReactEvent;

},{"./BrowserEnv":46,"./EventConstants":47,"./EventPluginHub":27,"./ExecutionEnvironment":14,"./invariant":10,"./NormalizedEventListener":48,"./isEventSupported":49}],21:[function(require,module,exports){
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
 * @providesModule ReactInstanceHandles
 */

"use strict";

var getDOMNodeID = require("./getDOMNodeID");
var invariant = require("./invariant");

var SEPARATOR = '.';
var SEPARATOR_LENGTH = SEPARATOR.length;

/**
 * Maximum depth of traversals before we consider the possibility of a bad ID.
 */
var MAX_TREE_DEPTH = 100;

/**
 * Checks if a character in the supplied ID is a separator or the end.
 *
 * @param {string} id A React DOM ID.
 * @param {number} index Index of the character to check.
 * @return {boolean} True if the character is a separator or end of the ID.
 * @private
 */
function isMarker(id, index) {
  return id.charAt(index) === SEPARATOR || index === id.length;
}

/**
 * Checks if the supplied string is a valid React DOM ID.
 *
 * @param {string} id A React DOM ID, maybe.
 * @return {boolean} True if the string is a valid React DOM ID.
 * @private
 */
function isValidID(id) {
  return id === '' || (
    id.charAt(0) === SEPARATOR && id.charAt(id.length - 1) !== SEPARATOR
  );
}

/**
 * True if the supplied `node` is rendered by React.
 *
 * @param {DOMElement} node DOM Element to check.
 * @return {boolean} True if the DOM Element appears to be rendered by React.
 * @private
 */
function isRenderedByReact(node) {
  var id = getDOMNodeID(node);
  return id && id.charAt(0) === SEPARATOR;
}

/**
 * Gets the parent ID of the supplied React DOM ID, `id`.
 *
 * @param {string} id ID of a component.
 * @return {string} ID of the parent, or an empty string.
 * @private
 */
function parentID(id) {
  return id ? id.substr(0, id.lastIndexOf(SEPARATOR)) : '';
}

/**
 * Traverses the parent path between two IDs (either up or down). The IDs must
 * not be the same, and there must exist a parent path between them.
 *
 * @param {?string} start ID at which to start traversal.
 * @param {?string} stop ID at which to end traversal.
 * @param {function} cb Callback to invoke each ID with.
 * @param {?boolean} skipFirst Whether or not to skip the first node.
 * @param {?boolean} skipLast Whether or not to skip the last node.
 * @private
 */
function traverseParentPath(start, stop, cb, arg, skipFirst, skipLast) {
  start = start || '';
  stop = stop || '';
  invariant(
    start !== stop,
    'traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.',
    start
  );
  var ancestorID = ReactInstanceHandles.getFirstCommonAncestorID(start, stop);
  var traverseUp = ancestorID === stop;
  invariant(
    traverseUp || ancestorID === start,
    'traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do ' +
    'not have a parent path.',
    start,
    stop
  );
  // Traverse from `start` to `stop` one depth at a time.
  var depth = 0;
  var traverse = traverseUp ? parentID : ReactInstanceHandles.nextDescendantID;
  for (var id = start; /* until break */; id = traverse(id, stop)) {
    if ((!skipFirst || id !== start) && (!skipLast || id !== stop)) {
      cb(id, traverseUp, arg);
    }
    if (id === stop) {
      // Only break //after// visiting `stop`.
      break;
    }
    invariant(
      depth++ < MAX_TREE_DEPTH,
      'traverseParentPath(%s, %s, ...): Detected an infinite loop while ' +
      'traversing the React DOM ID tree. This may be due to malformed IDs: %s',
      start, stop
    );
  }
}

/**
 * Manages the IDs assigned to DOM representations of React components. This
 * uses a specific scheme in order to traverse the DOM efficiently (e.g. in
 * order to simulate events).
 *
 * @internal
 */
var ReactInstanceHandles = {

  separator: SEPARATOR,

  /**
   * Traverses up the ancestors of the supplied node to find a node that is a
   * DOM representation of a React component.
   *
   * @param {DOMElement} node
   * @return {?DOMElement}
   * @internal
   */
  getFirstReactDOM: function(node) {
    var current = node;
    while (current && current.parentNode !== current) {
      if (isRenderedByReact(current)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  },

  /**
   * Finds a node with the supplied `id` inside of the supplied `ancestorNode`.
   * Exploits the ID naming scheme to perform the search quickly.
   *
   * @param {DOMElement} ancestorNode Search from this root.
   * @pararm {string} id ID of the DOM representation of the component.
   * @return {?DOMElement} DOM element with the supplied `id`, if one exists.
   * @internal
   */
  findComponentRoot: function(ancestorNode, id) {
    var child = ancestorNode.firstChild;
    while (child) {
      if (id === child.id) {
        return child;
      } else if (id.indexOf(child.id) === 0) {
        return ReactInstanceHandles.findComponentRoot(child, id);
      }
      child = child.nextSibling;
    }
    // Effectively: return null;
  },

  /**
   * Gets the nearest common ancestor ID of two IDs.
   *
   * Using this ID scheme, the nearest common ancestor ID is the longest common
   * prefix of the two IDs that immediately preceded a "marker" in both strings.
   *
   * @param {string} oneID
   * @param {string} twoID
   * @return {string} Nearest common ancestor ID, or the empty string if none.
   * @internal
   */
  getFirstCommonAncestorID: function(oneID, twoID) {
    var minLength = Math.min(oneID.length, twoID.length);
    if (minLength === 0) {
      return '';
    }
    var lastCommonMarkerIndex = 0;
    // Use `<=` to traverse until the "EOL" of the shorter string.
    for (var i = 0; i <= minLength; i++) {
      if (isMarker(oneID, i) && isMarker(twoID, i)) {
        lastCommonMarkerIndex = i;
      } else if (oneID.charAt(i) !== twoID.charAt(i)) {
        break;
      }
    }
    var longestCommonID = oneID.substr(0, lastCommonMarkerIndex);
    invariant(
      isValidID(longestCommonID),
      'getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s',
      oneID,
      twoID,
      longestCommonID
    );
    return longestCommonID;
  },
  /**
   * Creates a DOM ID to use when mounting React components.
   *
   * @param {number} mountPointCount The count of React renders so far.
   * @return {string} React root ID.
   * @internal
   */
  getReactRootID: function(mountPointCount) {
    return '.reactRoot[' + mountPointCount + ']';
  },

  /**
   * Gets the DOM ID of the React component that is the root of the tree that
   * contains the React component with the supplied DOM ID.
   *
   * @param {string} id DOM ID of a React component.
   * @return {string} DOM ID of the React component that is the root.
   * @internal
   */
  getReactRootIDFromNodeID: function(id) {
    var regexResult = /\.reactRoot\[[^\]]+\]/.exec(id);
    return regexResult && regexResult[0];
  },

  /**
   * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
   * should would receive a `mouseEnter` or `mouseLeave` event.
   *
   * NOTE: Does not invoke the callback on the nearest common ancestor because
   * nothing "entered" or "left" that element.
   *
   * @param {string} leaveID ID being left.
   * @param {string} enterID ID being entered.
   * @param {function} cb Callback to invoke on each entered/left ID.
   * @param {*} upArg Argument to invoke the callback with on left IDs.
   * @param {*} downArg Argument to invoke the callback with on entered IDs.
   * @internal
   */
  traverseEnterLeave: function(leaveID, enterID, cb, upArg, downArg) {
    var longestCommonID = ReactInstanceHandles.getFirstCommonAncestorID(
      leaveID,
      enterID
    );
    if (longestCommonID !== leaveID) {
      traverseParentPath(leaveID, longestCommonID, cb, upArg, false, true);
    }
    if (longestCommonID !== enterID) {
      traverseParentPath(longestCommonID, enterID, cb, downArg, true, false);
    }
  },

  /**
   * Simulates the traversal of a two-phase, capture/bubble event dispatch.
   *
   * NOTE: This traversal happens on IDs without touching the DOM.
   *
   * @param {string} targetID ID of the target node.
   * @param {function} cb Callback to invoke.
   * @param {*} arg Argument to invoke the callback with.
   * @internal
   */
  traverseTwoPhase: function(targetID, cb, arg) {
    if (targetID) {
      traverseParentPath('', targetID, cb, arg, true, false);
      traverseParentPath(targetID, '', cb, arg, false, true);
    }
  },

  /**
   * Gets the next DOM ID on the tree path from the supplied `ancestorID` to the
   * supplied `destinationID`. If they are equal, the ID is returned.
   *
   * @param {string} ancestorID ID of an ancestor node of `destinationID`.
   * @param {string} destinationID ID of the destination node.
   * @return {string} Next ID on the path from `ancestorID` to `destinationID`.
   * @internal
   */
  nextDescendantID: function(ancestorID, destinationID) {
    invariant(
      isValidID(ancestorID) && isValidID(destinationID),
      'nextDescendantID(%s, %s): Received an invalid React DOM ID.',
      ancestorID,
      destinationID
    );
    var longestCommonID = ReactInstanceHandles.getFirstCommonAncestorID(
      ancestorID,
      destinationID
    );
    invariant(
      longestCommonID === ancestorID,
      'nextDescendantID(...): React has made an invalid assumption about the ' +
      'DOM hierarchy. Expected `%s` to be an ancestor of `%s`.',
      ancestorID,
      destinationID
    );
    if (ancestorID === destinationID) {
      return ancestorID;
    }
    // Skip over the ancestor and the immediate separator. Traverse until we hit
    // another separator or we reach the end of `destinationID`.
    var start = ancestorID.length + SEPARATOR_LENGTH;
    for (var i = start; i < destinationID.length; i++) {
      if (isMarker(destinationID, i)) {
        break;
      }
    }
    return destinationID.substr(0, i);
  }

};

module.exports = ReactInstanceHandles;

},{"./invariant":10,"./getDOMNodeID":50}],22:[function(require,module,exports){
(function(){/**
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
 * @providesModule ReactEventTopLevelCallback
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactEvent = require("./ReactEvent");
var ReactInstanceHandles = require("./ReactInstanceHandles");

var getDOMNodeID = require("./getDOMNodeID");

var _topLevelListenersEnabled = true;

var ReactEventTopLevelCallback = {

  /**
   * @param {boolean} enabled Whether or not all callbacks that have ever been
   * created with this module should be enabled.
   */
  setEnabled: function(enabled) {
    _topLevelListenersEnabled = !!enabled;
  },

  isEnabled: function() {
    return _topLevelListenersEnabled;
  },

  /**
   * For a given `topLevelType`, creates a callback that could be added as a
   * listener to the document. That top level callback will simply fix the
   * native events before invoking `handleTopLevel`.
   *
   * - Raw native events cannot be trusted to describe their targets correctly
   *   so we expect that the argument to the nested function has already been
   *   fixed.  But the `target` property may not be something of interest to
   *   React, so we find the most suitable target.  But even at that point, DOM
   *   Elements (the target ) can't be trusted to describe their IDs correctly
   *   so we obtain the ID in a reliable manner and pass it to
   *   `handleTopLevel`. The target/id that we found to be relevant to our
   *   framework are called `renderedTarget`/`renderedTargetID` respectively.
   */
  createTopLevelCallback: function(topLevelType) {
    return function(fixedNativeEvent) {
      if (!_topLevelListenersEnabled) {
        return;
      }
      var renderedTarget = ReactInstanceHandles.getFirstReactDOM(
        fixedNativeEvent.target
      ) || ExecutionEnvironment.global;
      var renderedTargetID = getDOMNodeID(renderedTarget);
      var event = fixedNativeEvent;
      var target = renderedTarget;
      ReactEvent.handleTopLevel(topLevelType, event, renderedTargetID, target);
    };
  }

};

module.exports = ReactEventTopLevelCallback;

})()
},{"./ExecutionEnvironment":14,"./ReactEvent":20,"./ReactInstanceHandles":21,"./getDOMNodeID":50}],23:[function(require,module,exports){
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
 * @providesModule $
 */

var ge = require("./ge");

/**
 * Find a node by ID.
 *
 * If your application code depends on the existence of the element, use $,
 * which will throw if the element doesn't exist.
 *
 * If you're not sure whether or not the element exists, use ge instead, and
 * manually check for the element's existence in your application code.
 */
function $(arg) {
  var element = ge(arg);
  if (!element) {
    if (typeof arg == 'undefined') {
      arg = 'undefined';
    } else if (arg === null) {
      arg = 'null';
    }
    throw new Error(
      'Tried to get element "' + arg.toString() + '" but it is not present ' +
      'on the page.'
    );
  }
  return element;
}

module.exports = $;

},{"./ge":51}],24:[function(require,module,exports){
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
 * @providesModule ReactDOMForm
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");
var ReactEvent = require("./ReactEvent");
var EventConstants = require("./EventConstants");

// Store a reference to the <form> `ReactNativeComponent`.
var form = ReactDOM.form;

/**
 * Since onSubmit doesn't bubble OR capture on the top level in IE8, we need
 * to capture it on the <form> element itself. There are lots of hacks we could
 * do to accomplish this, but the most reliable is to make <form> a
 * composite component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMForm = ReactCompositeComponent.createClass({
  render: function() {
    // TODO: Instead of using `ReactDOM` directly, we should use JSX. However,
    // `jshint` fails to parse JSX so in order for linting to work in the open
    // source repo, we need to just use `ReactDOM.form`.
    return this.transferPropsTo(form(null, this.props.children));
  },

  componentDidMount: function(node) {
    ReactEvent.trapBubbledEvent(
      EventConstants.topLevelTypes.topSubmit,
      'submit',
      node
    );
  }
});

module.exports = ReactDOMForm;

},{"./ReactCompositeComponent":2,"./ReactDOM":4,"./ReactEvent":20,"./EventConstants":47}],25:[function(require,module,exports){
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
 * @providesModule DefaultEventPluginOrder
 */

"use strict";

 var keyOf = require("./keyOf");

/**
 * Module that is injectable into `EventPluginHub`, that specifies a
 * deterministic ordering of `EventPlugin`s. A convenient way to reason about
 * plugins, without having to package every one of them. This is better than
 * having plugins be ordered in the same order that they are injected because
 * that ordering would be influenced by the packaging order.
 * `ResponderEventPlugin` must occur before `SimpleEventPlugin` so that
 * preventing default on events is convenient in `SimpleEventPlugin` handlers.
 */
var DefaultEventPluginOrder = [
  keyOf({ResponderEventPlugin: null}),
  keyOf({SimpleEventPlugin: null}),
  keyOf({TapEventPlugin: null}),
  keyOf({EnterLeaveEventPlugin: null}),
  keyOf({AnalyticsEventPlugin: null})
];

module.exports = DefaultEventPluginOrder;

},{"./keyOf":44}],26:[function(require,module,exports){
(function(){/**
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
 * @providesModule EnterLeaveEventPlugin
 */

"use strict";

var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var AbstractEvent = require("./AbstractEvent");
var EventConstants = require("./EventConstants");
var ReactInstanceHandles = require("./ReactInstanceHandles");

var getDOMNodeID = require("./getDOMNodeID");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;
var getFirstReactDOM = ReactInstanceHandles.getFirstReactDOM;

var abstractEventTypes = {
  mouseEnter: {registrationName: keyOf({onMouseEnter: null})},
  mouseLeave: {registrationName: keyOf({onMouseLeave: null})}
};

/**
 * For almost every interaction we care about, there will be a top level
 * `mouseOver` and `mouseOut` event that occur so we can usually only pay
 * attention to one of the two (we'll pay attention to the `mouseOut` event) to
 * avoid extracting a duplicate event. However, there's one interaction where
 * there will be no `mouseOut` event to rely on - mousing from outside the
 * browser *into* the chrome. We detect this scenario and only in that case, we
 * use the `mouseOver` event.
 *
 * @see EventPluginHub.extractAbstractEvents
 */
var extractAbstractEvents = function(
    topLevelType,
    nativeEvent,
    renderedTargetID,
    renderedTarget) {

  if (topLevelType === topLevelTypes.topMouseOver &&
      (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
    return;
  }
  if (topLevelType !== topLevelTypes.topMouseOut &&
     topLevelType !== topLevelTypes.topMouseOver){
    return null;  // Must not be a mouse in or mouse out - ignoring.
  }

  var to, from;
  if (topLevelType === topLevelTypes.topMouseOut) {
    to = getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) ||
      ExecutionEnvironment.global;
    from = renderedTarget;
  } else {
    to = renderedTarget;
    from = ExecutionEnvironment.global;
  }

  // Nothing pertains to our managed components.
  if (from === to ) {
    return;
  }

  var fromID = from ? getDOMNodeID(from) : '';
  var toID = to ? getDOMNodeID(to) : '';
  var leave = AbstractEvent.getPooled(
    abstractEventTypes.mouseLeave,
    fromID,
    topLevelType,
    nativeEvent
  );
  var enter = AbstractEvent.getPooled(
    abstractEventTypes.mouseEnter,
    toID,
    topLevelType,
    nativeEvent
  );
  EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);
  return [leave, enter];
};

var EnterLeaveEventPlugin = {
  abstractEventTypes: abstractEventTypes,
  extractAbstractEvents: extractAbstractEvents
};

module.exports = EnterLeaveEventPlugin;

})()
},{"./EventPropagators":52,"./ExecutionEnvironment":14,"./AbstractEvent":53,"./EventConstants":47,"./ReactInstanceHandles":21,"./getDOMNodeID":50,"./keyOf":44}],27:[function(require,module,exports){
(function(){/**
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
 * @providesModule EventPluginHub
 */

"use strict";

var AbstractEvent = require("./AbstractEvent");
var CallbackRegistry = require("./CallbackRegistry");
var EventPluginUtils = require("./EventPluginUtils");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");

var accumulate = require("./accumulate");
var forEachAccumulated = require("./forEachAccumulated");
var keyMirror = require("./keyMirror");
var merge = require("./merge");
var throwIf = require("./throwIf");

var deleteListener = CallbackRegistry.deleteListener;

var ERRORS = keyMirror({
  DOUBLE_REGISTER: null,
  DOUBLE_ENQUEUE: null,
  DEPENDENCY_ERROR: null
});

if (true) {
  ERRORS.DOUBLE_REGISTER =
    'You\'ve included an event plugin that extracts an ' +
    'event type with the exact same or identity as an event that ' +
    'had previously been injected - or, one of the registration names ' +
    'used by an plugin has already been used.';
  ERRORS.DOUBLE_ENQUEUE =
    'During the processing of events, more events were enqueued. This ' +
    'is strange and should not happen. Please report immediately. ';
  ERRORS.DEPENDENCY_ERROR =
    'You have either attempted to load an event plugin that has no ' +
    'entry in EventPluginOrder, or have attempted to extract events ' +
    'when some critical dependencies have not yet been injected.';
}


/**
 * EventPluginHub: To see a diagram and explanation of the overall architecture
 * of the plugin hub system, @see ReactEvents.js
 */

/**
 * Injected Dependencies:
 */
var injection = {
  /**
   * [required] Dependency of `EventPropagators`.
   */
  injectInstanceHandle: function(InjectedInstanceHandle) {
    EventPropagators.injection.injectInstanceHandle(InjectedInstanceHandle);
  },

  /**
   * `EventPluginOrder`: [optional] Provides deterministic ordering of
   * `EventPlugin`s. Ordering decoupled from the injection of actual
   * plugins so that there is always a deterministic and permanent ordering
   * regardless of the plugins that happen to become packaged, or applications
   * that happen to inject on-the-fly event plugins.
   */
  EventPluginOrder: null,
  injectEventPluginOrder: function(InjectedEventPluginOrder) {
    injection.EventPluginOrder = InjectedEventPluginOrder;
    injection._recomputePluginsList();
  },

  /**
   * `EventPlugins`: [optional][lazy-loadable] Plugins that must be listed in
   * the `EventPluginOrder` injected dependency. The list of plugins may grow as
   * custom plugins are injected into the system at page as part of the
   * initialization process, or even after the initialization process (on-the-
   * fly). Plugins injected into the hub have an opportunity to infer abstract
   * events when top level events are streamed through the `EventPluginHub`.
   */
  plugins: [],
  injectEventPluginsByName: function(pluginsByName) {
    injection.pluginsByName = merge(injection.pluginsByName, pluginsByName);
    injection._recomputePluginsList();
  },

  /**
   * A reference of all injected plugins by their name. Both plugins and
   * `EventPluginOrder` can be injected on-the-fly. Any time either dependency
   * is (re)injected, the resulting list of plugins in correct order is
   * recomputed.
   */
  pluginsByName: {},
  _recomputePluginsList: function() {
    var injectPluginByName = function(name, PluginModule) {
      var pluginIndex = injection.EventPluginOrder.indexOf(name);
      throwIf(pluginIndex === -1, ERRORS.DEPENDENCY_ERROR + name);
      if (!injection.plugins[pluginIndex]) {
        injection.plugins[pluginIndex] = PluginModule;
        for (var eventName in PluginModule.abstractEventTypes) {
          var eventType = PluginModule.abstractEventTypes[eventName];
          recordAllRegistrationNames(eventType, PluginModule);
        }
      }
    };
    if (injection.EventPluginOrder) {  // Else, do when plugin order injected
      var injectedPluginsByName = injection.pluginsByName;
      for (var name in injectedPluginsByName) {
        injectPluginByName(name, injectedPluginsByName[name]);
      }
    }
  }
};


/**
 * `renderedTarget`: We'll refer to the concept of a "rendered target". Any
 * framework code that uses the `EventPluginHub` will stream events to the
 * `EventPluginHub`. In order for registered plugins to make sense of the native
 * events, it helps to allow plugins to not only have access to the native
 * `Event` object but also the notion of a "rendered target", which is the
 * conceptual target `Element` of the `Event` that the framework (user of
 * `EventPluginHub`) deems as being the "important" target.
 */
/**
 * Keeps track of all valid "registration names" (`onClick` etc). We expose
 * these structures to other modules, who will always see updates that we apply
 * to these structures. They should never have a desire to mutate these.
 */
var registrationNames = {};

/**
 * This prevents the need for clients to call `Object.keys(registrationNames)`
 * every time they want to loop through the possible registration names.
 */
var registrationNamesArr = [];

/**
 * Internal queue of events that have accumulated their dispatches and are
 * waiting to have their dispatches executed.
 */
var abstractEventQueue = [];

/**
 * Records all the registration names that the event plugin makes available
 * to the general event system. These are things like
 * `onClick`/`onClickCapture`.
 */
function recordAllRegistrationNames(eventType, PluginModule) {
  var phaseName;
  var phasedRegistrationNames = eventType.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (phaseName in phasedRegistrationNames) {
      if (!phasedRegistrationNames.hasOwnProperty(phaseName)) {
        continue;
      }
      if (true) {
        throwIf(
          registrationNames[phasedRegistrationNames[phaseName]],
          ERRORS.DOUBLE_REGISTER
        );
      }
      registrationNames[phasedRegistrationNames[phaseName]] = PluginModule;
      registrationNamesArr.push(phasedRegistrationNames[phaseName]);
    }
  } else if (eventType.registrationName) {
    if (true) {
      throwIf(
        registrationNames[eventType.registrationName],
        ERRORS.DOUBLE_REGISTER
      );
    }
    registrationNames[eventType.registrationName] = PluginModule;
    registrationNamesArr.push(eventType.registrationName);
  }
}

/**
 * A hacky way to reverse engineer which event plugin module created an
 * AbstractEvent.
 * @param {AbstractEvent} abstractEvent to look at
 */
function getPluginModuleForAbstractEvent(abstractEvent) {
  if (abstractEvent.type.registrationName) {
    return registrationNames[abstractEvent.type.registrationName];
  } else {
    for (var phase in abstractEvent.type.phasedRegistrationNames) {
      if (!abstractEvent.type.phasedRegistrationNames.hasOwnProperty(phase)) {
        continue;
      }
      var PluginModule = registrationNames[
        abstractEvent.type.phasedRegistrationNames[phase]
      ];
      if (PluginModule) {
        return PluginModule;
      }
    }
  }
  return null;
}

var deleteAllListeners = function(domID) {
  var ii;
  for (ii = 0; ii < registrationNamesArr.length; ii++) {
    deleteListener(domID, registrationNamesArr[ii]);
  }
};

/**
 * Accepts the stream of top level native events, and gives every registered
 * plugin an opportunity to extract `AbstractEvent`s with annotated dispatches.
 *
 * @param {Enum} topLevelType Record from `EventConstants`.
 * @param {Event} nativeEvent A Standard Event with fixed `target` property.
 * @param {Element} renderedTarget Element of interest to the framework, usually
 *  the same as `nativeEvent.target` but occasionally an element immediately
 *  above `nativeEvent.target` (the first DOM node recognized as one "rendered"
 *  by the framework at hand.)
 * @param {string} renderedTargetID string ID of `renderedTarget`.
 */
var extractAbstractEvents =
  function(topLevelType, nativeEvent, renderedTargetID, renderedTarget) {
    var abstractEvents;
    var plugins = injection.plugins;
    var len = plugins.length;
    for (var i = 0; i < len; i++) {
      // Not every plugin in the ordering may be loaded at runtime.
      var possiblePlugin = plugins[i];
      var extractedAbstractEvents =
        possiblePlugin &&
        possiblePlugin.extractAbstractEvents(
          topLevelType,
          nativeEvent,
          renderedTargetID,
          renderedTarget
        );
      if (extractedAbstractEvents) {
        abstractEvents = accumulate(abstractEvents, extractedAbstractEvents);
      }
    }
    return abstractEvents;
  };

var enqueueAbstractEvents = function(abstractEvents) {
  if (abstractEvents) {
    abstractEventQueue = accumulate(abstractEventQueue, abstractEvents);
  }
};

/**
 * Executes a single abstract event dispatch. Returns a value, but this return
 * value doesn't make much sense when executing dispatches for a list of a
 * events. However, if a plugin executes a single dispatch, mostly bypassing
 * `EventPluginHub`, it can execute dispatches directly and assign special
 * meaning to the return value. So this will return the result of executing the
 * dispatch, though for most use cases, it gets dropped.
 */
var executeDispatchesAndRelease = function(abstractEvent) {
  if (abstractEvent) {
    var PluginModule = getPluginModuleForAbstractEvent(abstractEvent);
    var pluginExecuteDispatch = PluginModule && PluginModule.executeDispatch;
    EventPluginUtils.executeDispatchesInOrder(
      abstractEvent,
      pluginExecuteDispatch || EventPluginUtils.executeDispatch
    );
    AbstractEvent.release(abstractEvent);
  }
};

/**
 * Sets `abstractEventQueue` to null before processing it, so that we can tell
 * if in the process of processing events, more were enqueued. We throw if we
 * find that any were enqueued though this use case could be supported in the
 * future. For now, throwing an error as it's something we don't expect to
 * occur.
 */
var processAbstractEventQueue = function() {
  var processingAbstractEventQueue = abstractEventQueue;
  abstractEventQueue = null;
  forEachAccumulated(processingAbstractEventQueue, executeDispatchesAndRelease);
  if (true) {
    throwIf(abstractEventQueue, ERRORS.DOUBLE_ENQUEUE);
  }
};

/**
 * Provides a unified interface for an arbitrary and dynamic set of event
 * plugins. Loosely, a hub, where several "event plugins" may act as a single
 * event plugin behind the facade of `EventPluginHub`. Each event plugin injects
 * themselves into the HUB, and will immediately become operable upon injection.
 *
 * @constructor EventPluginHub
 */
var EventPluginHub = {
  registrationNames: registrationNames,
  registrationNamesArr: registrationNamesArr,
  putListener: CallbackRegistry.putListener,
  getListener: CallbackRegistry.getListener,
  deleteAllListeners: deleteAllListeners,
  extractAbstractEvents: extractAbstractEvents,
  enqueueAbstractEvents: enqueueAbstractEvents,
  processAbstractEventQueue: processAbstractEventQueue,
  injection: injection
};


if (ExecutionEnvironment.canUseDOM) {
  window.EventPluginHub = EventPluginHub;
}

module.exports = EventPluginHub;

})()
},{"./AbstractEvent":53,"./CallbackRegistry":54,"./EventPluginUtils":55,"./EventPropagators":52,"./ExecutionEnvironment":14,"./accumulate":56,"./forEachAccumulated":57,"./keyMirror":11,"./throwIf":31,"./merge":12}],28:[function(require,module,exports){
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
 * @providesModule SimpleEventPlugin
 */

"use strict";

var AbstractEvent = require("./AbstractEvent");
var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");

var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;

var SimpleEventPlugin = {
  abstractEventTypes: {
    // Note: We do not allow listening to mouseOver events. Instead, use the
    // onMouseEnter/onMouseLeave created by `EnterLeaveEventPlugin`.
    mouseDown: {
      phasedRegistrationNames: {
        bubbled: keyOf({onMouseDown: true}),
        captured: keyOf({onMouseDownCapture: true})
      }
    },
    mouseUp: {
      phasedRegistrationNames: {
        bubbled: keyOf({onMouseUp: true}),
        captured: keyOf({onMouseUpCapture: true})
      }
    },
    mouseMove: {
      phasedRegistrationNames: {
        bubbled: keyOf({onMouseMove: true}),
        captured: keyOf({onMouseMoveCapture: true})
      }
    },
    doubleClick: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDoubleClick: true}),
        captured: keyOf({onDoubleClickCapture: true})
      }
    },
    click: {
      phasedRegistrationNames: {
        bubbled: keyOf({onClick: true}),
        captured: keyOf({onClickCapture: true})
      }
    },
    mouseWheel: {
      phasedRegistrationNames: {
        bubbled: keyOf({onMouseWheel: true}),
        captured: keyOf({onMouseWheelCapture: true})
      }
    },
    touchStart: {
      phasedRegistrationNames: {
        bubbled: keyOf({onTouchStart: true}),
        captured: keyOf({onTouchStartCapture: true})
      }
    },
    touchEnd: {
      phasedRegistrationNames: {
        bubbled: keyOf({onTouchEnd: true}),
        captured: keyOf({onTouchEndCapture: true})
      }
    },
    touchCancel: {
      phasedRegistrationNames: {
        bubbled: keyOf({onTouchCancel: true}),
        captured: keyOf({onTouchCancelCapture: true})
      }
    },
    touchMove: {
      phasedRegistrationNames: {
        bubbled: keyOf({onTouchMove: true}),
        captured: keyOf({onTouchMoveCapture: true})
      }
    },
    keyUp: {
      phasedRegistrationNames: {
        bubbled: keyOf({onKeyUp: true}),
        captured: keyOf({onKeyUpCapture: true})
      }
    },
    keyPress: {
      phasedRegistrationNames: {
        bubbled: keyOf({onKeyPress: true}),
        captured: keyOf({onKeyPressCapture: true})
      }
    },
    keyDown: {
      phasedRegistrationNames: {
        bubbled: keyOf({onKeyDown: true}),
        captured: keyOf({onKeyDownCapture: true})
      }
    },
    focus: {
      phasedRegistrationNames: {
        bubbled: keyOf({onFocus: true}),
        captured: keyOf({onFocusCapture: true})
      }
    },
    blur: {
      phasedRegistrationNames: {
        bubbled: keyOf({onBlur: true}),
        captured: keyOf({onBlurCapture: true})
      }
    },
    scroll: {
      phasedRegistrationNames: {
        bubbled: keyOf({onScroll: true}),
        captured: keyOf({onScrollCapture: true})
      }
    },
    change: {
      phasedRegistrationNames: {
        bubbled: keyOf({onChange: true}),
        captured: keyOf({onChangeCapture: true})
      }
    },
    submit: {
      phasedRegistrationNames: {
        bubbled: keyOf({onSubmit: true}),
        captured: keyOf({onSubmitCapture: true})
      }
    },
    DOMCharacterDataModified: {
      phasedRegistrationNames: {
        bubbled: keyOf({onDOMCharacterDataModified: true}),
        captured: keyOf({onDOMCharacterDataModifiedCapture: true})
      }
    }
  },

  /**
   * Same as the default implementation, except cancels the event when return
   * value is false.
   * @param {AbstractEvent} AbstractEvent to handle
   * @param {function} Application-level callback
   * @param {string} domID DOM id to pass to the callback.
   */
  executeDispatch: function(abstractEvent, listener, domID) {
    var returnValue = listener(abstractEvent, domID);
    if (returnValue === false) {
      abstractEvent.stopPropagation();
      abstractEvent.preventDefault();
    }
  },

  /**
   * @see EventPluginHub.extractAbstractEvents
   */
  extractAbstractEvents:
    function(topLevelType, nativeEvent, renderedTargetID, renderedTarget) {
      var data;
      var abstractEventType =
        SimpleEventPlugin.topLevelTypesToAbstract[topLevelType];
      if (!abstractEventType) {
        return null;
      }
      switch(topLevelType) {
        case topLevelTypes.topMouseWheel:
          data = AbstractEvent.normalizeMouseWheelData(nativeEvent);
          break;
        case topLevelTypes.topScroll:
          data = AbstractEvent.normalizeScrollDataFromTarget(renderedTarget);
          break;
        case topLevelTypes.topClick:
        case topLevelTypes.topDoubleClick:
        case topLevelTypes.topChange:
        case topLevelTypes.topDOMCharacterDataModified:
        case topLevelTypes.topMouseDown:
        case topLevelTypes.topMouseUp:
        case topLevelTypes.topMouseMove:
        case topLevelTypes.topTouchMove:
        case topLevelTypes.topTouchStart:
        case topLevelTypes.topTouchEnd:
          data = AbstractEvent.normalizePointerData(nativeEvent);
          break;
        default:
          data = null;
      }
      var abstractEvent = AbstractEvent.getPooled(
        abstractEventType,
        renderedTargetID,
        topLevelType,
        nativeEvent,
        data
      );
      EventPropagators.accumulateTwoPhaseDispatches(abstractEvent);
      return abstractEvent;
    }
};

SimpleEventPlugin.topLevelTypesToAbstract = {
  topMouseDown:   SimpleEventPlugin.abstractEventTypes.mouseDown,
  topMouseUp:     SimpleEventPlugin.abstractEventTypes.mouseUp,
  topMouseMove:   SimpleEventPlugin.abstractEventTypes.mouseMove,
  topClick:       SimpleEventPlugin.abstractEventTypes.click,
  topDoubleClick: SimpleEventPlugin.abstractEventTypes.doubleClick,
  topMouseWheel:  SimpleEventPlugin.abstractEventTypes.mouseWheel,
  topTouchStart:  SimpleEventPlugin.abstractEventTypes.touchStart,
  topTouchEnd:    SimpleEventPlugin.abstractEventTypes.touchEnd,
  topTouchMove:   SimpleEventPlugin.abstractEventTypes.touchMove,
  topTouchCancel: SimpleEventPlugin.abstractEventTypes.touchCancel,
  topKeyUp:       SimpleEventPlugin.abstractEventTypes.keyUp,
  topKeyPress:    SimpleEventPlugin.abstractEventTypes.keyPress,
  topKeyDown:     SimpleEventPlugin.abstractEventTypes.keyDown,
  topFocus:       SimpleEventPlugin.abstractEventTypes.focus,
  topBlur:        SimpleEventPlugin.abstractEventTypes.blur,
  topScroll:      SimpleEventPlugin.abstractEventTypes.scroll,
  topChange:      SimpleEventPlugin.abstractEventTypes.change,
  topSubmit:      SimpleEventPlugin.abstractEventTypes.submit,
  topDOMCharacterDataModified:
                  SimpleEventPlugin.abstractEventTypes.DOMCharacterDataModified
};

module.exports = SimpleEventPlugin;

},{"./AbstractEvent":53,"./EventConstants":47,"./EventPropagators":52,"./keyOf":44}],30:[function(require,module,exports){
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
 * @providesModule joinClasses
 * @typechecks
 */

"use strict";

/**
 * Combines multiple className strings into one.
 * http://jsperf.com/joinclasses-args-vs-array
 *
 * @param {...?string} classes
 * @return {string}
 */
function joinClasses(className/*, ... */) {
  if (!className) {
    className = '';
  }
  var nextClass;
  var argLength = arguments.length;
  if (argLength > 1) {
    for (var ii = 1; ii < argLength; ii++) {
      nextClass = arguments[ii];
      nextClass && (className += ' ' + nextClass);
    }
  }
  return className;
}

module.exports = joinClasses;

},{}],31:[function(require,module,exports){
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
 * @providesModule throwIf
 */

"use strict";

var throwIf = function(condition, err) {
  if (condition) {
    throw new Error(err);
  }
};

module.exports = throwIf;

},{}],37:[function(require,module,exports){
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
 * @providesModule PooledClass
 */

"use strict";

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function(copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function(a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var fiveArgumentPooler = function(a1, a2, a3, a4, a5) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4, a5);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4, a5);
  }
};

var standardReleaser = function(instance) {
  var Klass = this;
  if (instance.destructor) {
    instance.destructor();
  }
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances (optional).
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function(CopyConstructor, pooler) {
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  fiveArgumentPooler: fiveArgumentPooler
};

module.exports = PooledClass;

},{}],38:[function(require,module,exports){
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
 * @providesModule ReactInputSelection
 */

"use strict";

// It is not safe to read the document.activeElement property in IE if there's
// nothing focused.
function getActiveElement() {
  try {
    return document.activeElement;
  } catch (e) {
  }
}

/**
 * @ReactInputSelection: React input selection module. Based on Selection.js,
 * but modified to be suitable for react and has a couple of bug fixes (doesn't
 * assume buttons have range selections allowed).
 * Input selection module for React.
 */
var ReactInputSelection = {

  hasSelectionCapabilities: function(elem) {
    return elem && (
      (elem.nodeName === 'INPUT' && elem.type === 'text') ||
      elem.nodeName === 'TEXTAREA' ||
      elem.contentEditable === 'true'
    );
  },

  getSelectionInformation: function() {
    var focusedElem = getActiveElement();
    return {
      focusedElem: focusedElem,
      selectionRange:
          ReactInputSelection.hasSelectionCapabilities(focusedElem) ?
          ReactInputSelection.getSelection(focusedElem) :
          null
    };
  },

  /**
   * @restoreSelection: If any selection information was potentially lost,
   * restore it. This is useful when performing operations that could remove dom
   * nodes and place them back in, resulting in focus being lost.
   */
  restoreSelection: function(priorSelectionInformation) {
    var curFocusedElem = getActiveElement();
    var priorFocusedElem = priorSelectionInformation.focusedElem;
    var priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem &&
        document.getElementById(priorFocusedElem.id)) {
      if (ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)) {
        ReactInputSelection.setSelection(
          priorFocusedElem,
          priorSelectionRange
        );
      }
      priorFocusedElem.focus();
    }
  },

  /**
   * @getSelection: Gets the selection bounds of a textarea or input.
   * -@input: Look up selection bounds of this input or textarea
   * -@return {start: selectionStart, end: selectionEnd}
   */
  getSelection: function(input) {
    var range;
    if (input.contentEditable === 'true' && window.getSelection) {
      range = window.getSelection().getRangeAt(0);
      var commonAncestor = range.commonAncestorContainer;
      if (commonAncestor && commonAncestor.nodeType === 3) {
        commonAncestor = commonAncestor.parentNode;
      }
      if (commonAncestor !== input) {
        return {start: 0, end: 0};
      } else {
        return {start: range.startOffset, end: range.endOffset};
      }
    }

    if (!document.selection) {
      // Mozilla, Safari, etc.
      return {start: input.selectionStart, end: input.selectionEnd};
    }

    range = document.selection.createRange();
    if (range.parentElement() !== input) {
      // There can only be one selection per document in IE, so if the
      // containing element of the document's selection isn't our text field,
      // our text field must have no selection.
      return {start: 0, end: 0};
    }

    var length = input.value.length;

    if (input.nodeName === 'INPUT') {
      return {
        start: -range.moveStart('character', -length),
        end: -range.moveEnd('character', -length)
      };
    } else {
      var range2 = range.duplicate();
      range2.moveToElementText(input);
      range2.setEndPoint('StartToEnd', range);
      var end = length - range2.text.length;
      range2.setEndPoint('StartToStart', range);
      return {
        start: length - range2.text.length,
        end:   end
      };
    }
  },

  /**
   * @setSelection: Sets the selection bounds of a textarea or input and focuses
   * the input.
   * -@input     Set selection bounds of this input or textarea
   * -@rangeObj Object of same form that is returned from get*
   */
  setSelection: function(input, rangeObj) {
    var range;
    var start = rangeObj.start;
    var end = rangeObj.end;
    if (typeof end === 'undefined') {
      end = start;
    }
    if (document.selection) {
      // IE is inconsistent about character offsets when it comes to carriage
      // returns, so we need to manually take them into account
      if (input.tagName === 'TEXTAREA') {
        var cr_before =
          (input.value.slice(0, start).match(/\r/g) || []).length;
        var cr_inside =
          (input.value.slice(start, end).match(/\r/g) || []).length;
        start -= cr_before;
        end -= cr_before + cr_inside;
      }
      range = input.createTextRange();
      range.collapse(true);
      range.moveStart('character', start);
      range.moveEnd('character', end - start);
      range.select();
    } else {
      if (input.contentEditable === 'true') {
        if (input.childNodes.length === 1) {
          range = document.createRange();
          range.setStart(input.childNodes[0], start);
          range.setEnd(input.childNodes[0], end);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else {
        input.selectionStart = start;
        input.selectionEnd = Math.min(end, input.value.length);
        input.focus();
      }
    }
  }

};

module.exports = ReactInputSelection;

},{}],44:[function(require,module,exports){
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
 * @providesModule keyOf
 */

/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Suppose you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
var keyOf = function(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};


module.exports = keyOf;

},{}],46:[function(require,module,exports){
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
 * @providesModule BrowserEnv
 */

"use strict";

/**
 * A place to share/cache browser/chrome level computations.
 */
var BrowserEnv = {
  currentScrollLeft: 0,
  currentScrollTop: 0,
  browserInfo: null,
  refreshAuthoritativeScrollValues: function() {
    BrowserEnv.currentScrollLeft =
      document.body.scrollLeft + document.documentElement.scrollLeft;
    BrowserEnv.currentScrollTop =
      document.body.scrollTop + document.documentElement.scrollTop;
  }
};

module.exports = BrowserEnv;

},{}],50:[function(require,module,exports){
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
 * @providesModule getDOMNodeID
 */

"use strict";

/**
 * Accessing "id" or calling getAttribute('id') on a form element can return its
 * control whose name or ID is "id". However, not all DOM nodes support
 * `getAttributeNode` (document - which is not a form) so that is checked first.
 *
 * @param {Element} domNode DOM node element to return ID of.
 * @returns {string} The ID of `domNode`.
 */
function getDOMNodeID(domNode) {
  if (domNode.getAttributeNode) {
    var attributeNode = domNode.getAttributeNode('id');
    return attributeNode && attributeNode.value || '';
  } else {
    return domNode.id || '';
  }
}

module.exports = getDOMNodeID;

},{}],51:[function(require,module,exports){
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
 * @providesModule ge
 */

/**
 * Find a node by ID.  Optionally search a sub-tree outside of the document
 *
 * Use ge if you're not sure whether or not the element exists. You can test
 * for existence yourself in your application code.
 *
 * If your application code depends on the existence of the element, use $
 * instead, which will throw in DEV if the element doesn't exist.
 */
function ge(arg, root, tag) {
  return typeof arg != 'string' ? arg :
    !root ? document.getElementById(arg) :
    _geFromSubtree(arg, root, tag);
}

function _geFromSubtree(id, root, tag) {
  var elem, children, ii;

  if (_getNodeID(root) == id) {
    return root;
  } else if (root.getElementsByTagName) {
    // All Elements implement this, which does an iterative DFS, which is
    // faster than recursion and doesn't run into stack depth issues.
    children = root.getElementsByTagName(tag || '*');
    for (ii = 0; ii < children.length; ii++) {
      if (_getNodeID(children[ii]) == id) {
        return children[ii];
      }
    }
  } else {
    // DocumentFragment does not implement getElementsByTagName, so
    // recurse over its children. Its children must be Elements, so
    // each child will use the getElementsByTagName case instead.
    children = root.childNodes;
    for (ii = 0; ii < children.length; ii++) {
      elem = _geFromSubtree(id, children[ii]);
      if (elem) {
        return elem;
      }
    }
  }

  return null;
}

/**
 * Return the ID value for a given node. This allows us to avoid issues
 * with forms that contain inputs with name="id".
 *
 * @return string (null if attribute not set)
 */
function _getNodeID(node) {
  // #document and #document-fragment do not have getAttributeNode.
  var id = node.getAttributeNode && node.getAttributeNode('id');
  return id ? id.value : null;
}

module.exports = ge;

},{}],54:[function(require,module,exports){
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
 * @providesModule CallbackRegistry
 */

"use strict";

var listenerBank = {};

/**
 * Stores "listeners" by `registrationName`/`id`. There should be at most one
 * "listener" per `registrationName/id` in the `listenerBank`.
 * Access listeners via `listenerBank[registrationName][id]`
 *
 * @constructor CallbackRegistry
 */
var CallbackRegistry = {

  /**
   * Stores `listener` at `listenerBank[registrationName][id]. Is idempotent.
   * @param {string} domID The id of the DOM node.
   * @param {string} registrationName The name of listener (`onClick` etc).
   * @param {Function} listener The callback to to store.
   */
  putListener: function(id, registrationName, listener) {
    var bankForRegistrationName =
      listenerBank[registrationName] || (listenerBank[registrationName] = {});
    bankForRegistrationName[id] = listener;
  },

  /**
   * @param {string} id.
   * @param {string} registrationName Name of registration (`onClick` etc).
   * @return {Function?} The Listener
   */
  getListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    return bankForRegistrationName && bankForRegistrationName[id];
  },

  /**
   * Deletes the listener from the registration bank.
   * @param {string} id
   * @param {string} registrationName (`onClick` etc).
   */
  deleteListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    if (bankForRegistrationName) {
      delete bankForRegistrationName[id];
    }
  },

  // This is needed for tests only. Do not use in real life
  __purge: function() {
    listenerBank = {};
  }
};

module.exports = CallbackRegistry;

},{}],57:[function(require,module,exports){
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
 * @providesModule forEachAccumulated
 */

"use strict";

/**
 * @param {array} an "accumulation" of items which is either an Array or
 * a single item. Useful when paired with the `accumulate` module. This is a
 * simple utility that allows us to reason about a collection of items, but
 * handling the case when there is exactly one item (and we do not need to
 * allocate an array).
 */
var forEachAccumulated = function(arr, cb, scope) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope);
  } else if (arr) {
    cb.call(scope, arr);
  }
};

module.exports = forEachAccumulated;

},{}],29:[function(require,module,exports){
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
 * @providesModule emptyFunction
 */

var copyProperties = require("./copyProperties");

function makeEmptyFunction(arg) {
  return function() {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
function emptyFunction() {}

copyProperties(emptyFunction, {
  thatReturns: makeEmptyFunction,
  thatReturnsFalse: makeEmptyFunction(false),
  thatReturnsTrue: makeEmptyFunction(true),
  thatReturnsNull: makeEmptyFunction(null),
  thatReturnsThis: function() { return this; },
  thatReturnsArgument: function(arg) { return arg; },
  mustImplement: function(module, property) {
    return function() {
      if (true) {
        throw new Error(module + '.' + property + ' must be implemented!');
      }
    };
  }
});

module.exports = emptyFunction;

},{"./copyProperties":58}],32:[function(require,module,exports){
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
 * @providesModule CSSPropertyOperations
 * @typechecks
 */

"use strict";

var dangerousStyleValue = require("./dangerousStyleValue");
var escapeTextForBrowser = require("./escapeTextForBrowser");
var hyphenate = require("./hyphenate");
var memoizeStringOnly = require("./memoizeStringOnly");

var processStyleName = memoizeStringOnly(function(styleName) {
  return escapeTextForBrowser(hyphenate(styleName));
});

/**
 * Operations for dealing with CSS properties.
 */
var CSSPropertyOperations = {

  /**
   * Serializes a mapping of style properties for use as inline styles:
   *
   *   > createMarkupForStyles({width: '200px', height: 0})
   *   "width:200px;height:0;"
   *
   * Undefined values are ignored so that declarative programming is easier.
   *
   * @param {object} styles
   * @return {string}
   */
  createMarkupForStyles: function(styles) {
    var serialized = '';
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = styles[styleName];
      if (typeof styleValue !== 'undefined') {
        serialized += processStyleName(styleName) + ':';
        serialized += dangerousStyleValue(styleName, styleValue) + ';';
      }
    }
    return serialized;
  },

  /**
   * Sets the value for multiple styles on a node.
   *
   * @param {DOMElement} node
   * @param {object} styles
   */
  setValueForStyles: function(node, styles) {
    var style = node.style;
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = styles[styleName];
      style[styleName] = dangerousStyleValue(styleName, styleValue);
    }
  }

};

module.exports = CSSPropertyOperations;

},{"./dangerousStyleValue":59,"./escapeTextForBrowser":42,"./hyphenate":60,"./memoizeStringOnly":61}],33:[function(require,module,exports){
(function(){/**
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
 * @providesModule DOMChildrenOperations
 */

"use strict";

var Danger = require("./Danger");

var insertNodeAt = require("./insertNodeAt");
var keyOf = require("./keyOf");
var throwIf = require("./throwIf");

var NON_INCREASING_OPERATIONS;
if (true) {
  NON_INCREASING_OPERATIONS =
    'DOM child management operations must be provided in order ' +
    'of increasing destination index. This is likely an issue with ' +
    'the core framework.';
}

var MOVE_NODE_AT_ORIG_INDEX = keyOf({moveFrom: null});
var INSERT_MARKUP = keyOf({insertMarkup: null});
var REMOVE_AT = keyOf({removeAt: null});

/**
 * In order to carry out movement of DOM nodes without knowing their IDs, we
 * have to first store knowledge about nodes' original indices before beginning
 * to carry out the sequence of operations. Once we begin the sequence, the DOM
 * indices in future instructions are no longer valid.
 *
 * @param {Element} parent Parent DOM node.
 * @param {Object} childOperations Description of child operations.
 * @returns {Array?} Sparse array containing elements by their current index in
 * the DOM.
 */
var _getNodesByOriginalIndex = function(parent, childOperations) {
  var nodesByOriginalIndex; // Sparse array.
  var childOperation;
  var origIndex;
  for (var i = 0; i < childOperations.length; i++) {
    childOperation = childOperations[i];
    if (MOVE_NODE_AT_ORIG_INDEX in childOperation) {
      nodesByOriginalIndex = nodesByOriginalIndex || [];
      origIndex = childOperation.moveFrom;
      nodesByOriginalIndex[origIndex] = parent.childNodes[origIndex];
    } else if (REMOVE_AT in childOperation) {
      nodesByOriginalIndex = nodesByOriginalIndex || [];
      origIndex = childOperation.removeAt;
      nodesByOriginalIndex[origIndex] = parent.childNodes[origIndex];
    }
  }
  return nodesByOriginalIndex;
};

/**
 * Removes DOM elements from their parent, or moved.
 * @param {Element} parent Parent DOM node.
 * @param {Array} nodesByOriginalIndex Child nodes by their original index
 * (potentially sparse.)
 */
var _removeChildrenByOriginalIndex = function(parent, nodesByOriginalIndex) {
  for (var j = 0; j < nodesByOriginalIndex.length; j++) {
    var nodeToRemove = nodesByOriginalIndex[j];
    if (nodeToRemove) {     // We used a sparse array.
      parent.removeChild(nodesByOriginalIndex[j]);
    }
  }
};

/**
 * Once all nodes that will be removed or moved - are removed from the parent
 * node, we can begin the process of placing nodes into their final locations.
 * We must perform all operations in the order of the final DOM index -
 * otherwise, we couldn't count on the fact that an insertion at index X, will
 * remain at index X. This will iterate through the child operations, adding
 * content where needed, skip over removals (they've already been removed) and
 * insert "moved" Elements that were previously removed. The "moved" elements
 * are only temporarily removed from the parent, so that index calculations can
 * be manageable and perform well in the cases that matter.
 */
var _placeNodesAtDestination =
  function(parent, childOperations, nodesByOriginalIndex) {
    var origNode;
    var finalIndex;
    var lastFinalIndex = -1;
    var childOperation;
    for (var k = 0; k < childOperations.length; k++) {
      childOperation = childOperations[k];
      if (MOVE_NODE_AT_ORIG_INDEX in childOperation) {
        origNode = nodesByOriginalIndex[childOperation.moveFrom];
        finalIndex = childOperation.finalIndex;
        insertNodeAt(parent, origNode, finalIndex);
        if (true) {
          throwIf(finalIndex <= lastFinalIndex, NON_INCREASING_OPERATIONS);
          lastFinalIndex = finalIndex;
        }
      } else if (REMOVE_AT in childOperation) {
      } else if (INSERT_MARKUP in childOperation) {
        finalIndex = childOperation.finalIndex;
        var markup = childOperation.insertMarkup;
        Danger.dangerouslyInsertMarkupAt(parent, markup, finalIndex);
        if (true) {
          throwIf(finalIndex <= lastFinalIndex, NON_INCREASING_OPERATIONS);
          lastFinalIndex = finalIndex;
        }
      }
    }
  };

var manageChildren = function(parent, childOperations) {
  var nodesByOriginalIndex = _getNodesByOriginalIndex(parent, childOperations);
  if (nodesByOriginalIndex) {
    _removeChildrenByOriginalIndex(parent, nodesByOriginalIndex);
  }
  _placeNodesAtDestination(parent, childOperations, nodesByOriginalIndex);
};

var setTextNodeValueAtIndex = function(parent, index, val) {
  parent.childNodes[index].nodeValue = val;
};

/**
 * Also reexport all of the dangerous functions. It helps to have all dangerous
 * functions located in a single module `Danger`.
 */
var DOMChildrenOperations = {
  dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,
  manageChildren: manageChildren,
  setTextNodeValueAtIndex: setTextNodeValueAtIndex
};

module.exports = DOMChildrenOperations;

})()
},{"./Danger":62,"./insertNodeAt":63,"./keyOf":44,"./throwIf":31}],34:[function(require,module,exports){
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
 * @providesModule DOMPropertyOperations
 * @typechecks
 */

"use strict";

var DOMProperty = require("./DOMProperty");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var memoizeStringOnly = require("./memoizeStringOnly");

var processAttributeNameAndPrefix = memoizeStringOnly(function(name) {
  return escapeTextForBrowser(name) + '="';
});

/**
 * Operations for dealing with DOM properties.
 */
var DOMPropertyOperations = {

  /**
   * Creates markup for a property.
   *
   * @param {string} name
   * @param {*} value
   * @return {?string} Markup string, or null if the property was invalid.
   */
  createMarkupForProperty: function(name, value) {
    if (DOMProperty.isStandardName[name]) {
      if (value == null || DOMProperty.hasBooleanValue[name] && !value) {
        return '';
      }
      var attributeName = DOMProperty.getAttributeName[name];
      return processAttributeNameAndPrefix(attributeName) +
        escapeTextForBrowser(value) + '"';
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        return '';
      }
      return processAttributeNameAndPrefix(name) +
        escapeTextForBrowser(value) + '"';
    } else {
      return null;
    }
  },

  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */
  setValueForProperty: function(node, name, value) {
    if (DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, value);
      } else if (DOMProperty.mustUseAttribute[name]) {
        if (DOMProperty.hasBooleanValue[name] && !value) {
          node.removeAttribute(DOMProperty.getAttributeName[name]);
        } else {
          node.setAttribute(DOMProperty.getAttributeName[name], value);
        }
      } else {
        var propName = DOMProperty.getPropertyName[name];
        if (!DOMProperty.hasSideEffects[name] || node[propName] !== value) {
          node[propName] = value;
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      node.setAttribute(name, value);
    }
  }

};

module.exports = DOMPropertyOperations;

},{"./DOMProperty":64,"./escapeTextForBrowser":42,"./memoizeStringOnly":61}],35:[function(require,module,exports){
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
 * @providesModule ReactDOMNodeCache
 */

"use strict";

var ReactMount = require("./ReactMount");

var nodeCache = {};

/**
 * DOM node cache only intended for use by React. Placed into a shared module so
 * that both read and write utilities may benefit from a shared cache.
 */
var ReactDOMNodeCache = {
  /**
   * Releases fast id lookups (node/style cache). This implementation is
   * aggressive with purging because the bookkeeping associated with doing fine
   * grained deleted from the cache may outweight the benefits of the cache. The
   * heuristic that should be used to purge is 'any time anything is deleted'.
   * Typically this means that a large amount of content is being replaced and
   * several elements would need purging regardless. It's also a time when an
   * application is likely not in the middle of a "smooth operation" (such as
   * animating/scrolling).
   */
  purgeEntireCache: function() {
    nodeCache = {};
    return nodeCache;
  },
  getCachedNodeByID: function(id) {
    return nodeCache[id] ||
      (nodeCache[id] =
        document.getElementById(id) ||
        ReactMount.findReactRenderedDOMNodeSlow(id));
  }
};

module.exports = ReactDOMNodeCache;

},{"./ReactMount":5}],36:[function(require,module,exports){
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
 * @providesModule getTextContentAccessor
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var contentKey = null;

/**
 * Gets the key used to access text content on a DOM node.
 *
 * @return {?string} Key used to access text content.
 * @internal
 */
function getTextContentAccessor() {
  if (!contentKey && ExecutionEnvironment.canUseDOM) {
    contentKey = 'innerText' in document.createElement('div') ?
      'innerText' :
      'textContent';
  }
  return contentKey;
}

module.exports = getTextContentAccessor;

},{"./ExecutionEnvironment":14}],39:[function(require,module,exports){
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
 * @providesModule ReactOnDOMReady
 */

"use strict";

var PooledClass = require("./PooledClass");

var mixInto = require("./mixInto");

/**
 * A specialized pseudo-event module to help keep track of components waiting to
 * be notified when their DOM representations are available for use.
 *
 * This implements `PooledClass`, so you should never need to instantiate this.
 * Instead, use `ReactOnDOMReady.getPooled()`.
 *
 * @param {?array<function>} initialCollection
 * @class ReactOnDOMReady
 * @implements PooledClass
 * @internal
 */
function ReactOnDOMReady(initialCollection) {
  this._queue = initialCollection || null;
}

mixInto(ReactOnDOMReady, {

  /**
   * Enqueues a callback to be invoked when `notifyAll` is invoked. This is used
   * to enqueue calls to `componentDidMount` and `componentDidUpdate`.
   *
   * @param {ReactComponent} component Component being rendered.
   * @param {function(DOMElement)} callback Invoked when `notifyAll` is invoked.
   * @internal
   */
  enqueue: function(component, callback) {
    this._queue = this._queue || [];
    this._queue.push({component: component, callback: callback});
  },

  /**
   * Invokes all enqueued callbacks and clears the queue. This is invoked after
   * the DOM representation of a component has been created or updated.
   *
   * @internal
   */
  notifyAll: function() {
    var queue = this._queue;
    if (queue) {
      this._queue = null;
      for (var i = 0, l = queue.length; i < l; i++) {
        var component = queue[i].component;
        var callback = queue[i].callback;
        callback.call(component, component.getDOMNode());
      }
      queue.length = 0;
    }
  },

  /**
   * Resets the internal queue.
   *
   * @internal
   */
  reset: function() {
    this._queue = null;
  },

  /**
   * `PooledClass` looks for this.
   */
  destructor: function() {
    this.reset();
  }

});

PooledClass.addPoolingTo(ReactOnDOMReady);

module.exports = ReactOnDOMReady;

},{"./PooledClass":37,"./mixInto":13}],40:[function(require,module,exports){
(function(){/**
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
 * @providesModule Transaction
 */

"use strict";

var throwIf = require("./throwIf");

var DUAL_TRANSACTION = 'DUAL_TRANSACTION';
var MISSING_TRANSACTION = 'MISSING_TRANSACTION';
if (true) {
  DUAL_TRANSACTION =
    'Cannot initialize transaction when there is already an outstanding ' +
    'transaction. Common causes of this are trying to render a component ' +
    'when you are already rendering a component or attempting a state ' +
    'transition while in a render function. Another possibility is that ' +
    'you are rendering new content (or state transitioning) in a ' +
    'componentDidRender callback. If this is not the case, please report the ' +
    'issue immediately.';

  MISSING_TRANSACTION =
    'Cannot close transaction when there is none open.';
}

/**
 * `Transaction` creates a black box that is able to wrap any method such that
 * certain invariants are maintained before and after the method is invoked
 * (Even if an exception is thrown while invoking the wrapped method). Whoever
 * instantiates a transaction can provide enforcers of the invariants at
 * creation time. The `Transaction` class itself will supply one additional
 * automatic invariant for you - the invariant that any transaction instance
 * should not be ran while it is already being ran. You would typically create a
 * single instance of a `Transaction` for reuse multiple times, that potentially
 * is used to wrap several different methods. Wrappers are extremely simple -
 * they only require implementing two methods.
 *
 * <pre>
 *                       wrappers (injected at creation time)
 *                                      +        +
 *                                      |        |
 *                    +-----------------|--------|--------------+
 *                    |                 v        |              |
 *                    |      +---------------+   |              |
 *                    |   +--|    wrapper1   |---|----+         |
 *                    |   |  +---------------+   v    |         |
 *                    |   |          +-------------+  |         |
 *                    |   |     +----|   wrapper2  |--------+   |
 *                    |   |     |    +-------------+  |     |   |
 *                    |   |     |                     |     |   |
 *                    |   v     v                     v     v   | wrapper
 *                    | +---+ +---+   +---------+   +---+ +---+ | invariants
 * perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
 * +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | +---+ +---+   +---------+   +---+ +---+ |
 *                    |  initialize                    close    |
 *                    +-----------------------------------------+
 * </pre>
 *
 * Bonus:
 * - Reports timing metrics by method name and wrapper index.
 *
 * Use cases:
 * - Preserving the input selection ranges before/after reconciliation.
 *   Restoring selection even in the event of an unexpected error.
 * - Deactivating events while rearranging the DOM, preventing blurs/focuses,
 *   while guaranteeing that afterwards, the event system is reactivated.
 * - Flushing a queue of collected DOM mutations to the main UI thread after a
 *   reconciliation takes place in a worker thread.
 * - Invoking any collected `componentDidRender` callbacks after rendering new
 *   content.
 * - (Future use case): Wrapping particular flushes of the `ReactWorker` queue
 *   to preserve the `scrollTop` (an automatic scroll aware DOM).
 * - (Future use case): Layout calculations before and after DOM upates.
 *
 * Transactional plugin API:
 * - A module that has an `initialize` method that returns any precomputation.
 * - and a `close` method that accepts the precomputation. `close` is invoked
 *   when the wrapped process is completed, or has failed.
 *
 * @param {Array<TransactionalWrapper>} transactionWrapper Wrapper modules
 * that implement `initialize` and `close`.
 * @return {Transaction} Single transaction for reuse in thread.
 *
 * @class Transaction
 */
var Mixin = {
  /**
   * Sets up this instance so that it is prepared for collecting metrics. Does
   * so such that this setup method may be used on an instance that is already
   * initialized, in a way that does not consume additional memory upon reuse.
   * That can be useful if you decide to make your subclass of this mixin a
   * "PooledClass".
   */
  reinitializeTransaction: function() {
    this.transactionWrappers = this.getTransactionWrappers();
    if (!this.wrapperInitData) {
      this.wrapperInitData = [];
    } else {
      this.wrapperInitData.length = 0;
    }
    if (!this.timingMetrics) {
      this.timingMetrics = {};
    }
    this.timingMetrics.methodInvocationTime = 0;
    if (!this.timingMetrics.wrapperInitTimes) {
      this.timingMetrics.wrapperInitTimes = [];
    } else {
      this.timingMetrics.wrapperInitTimes.length = 0;
    }
    if (!this.timingMetrics.wrapperCloseTimes) {
      this.timingMetrics.wrapperCloseTimes = [];
    } else {
      this.timingMetrics.wrapperCloseTimes.length = 0;
    }
    this._isInTransaction = false;
  },

  _isInTransaction: false,

  /**
   * @abstract
   * @return {Array<TransactionWrapper>} Array of transaction wrappers.
   */
  getTransactionWrappers: null,

  isInTransaction: function() {
    return !!this._isInTransaction;
  },

  /**
   * Executes the function within a safety window. Use this for the top level
   * methods that result in large amounts of computation/mutations that would
   * need to be safety checked.
   *
   * @param {function} method Member of scope to call.
   * @param {Object} scope Scope to invoke from.
   * @param {Object?=} args... Arguments to pass to the method (optional).
   *                           Helps prevent need to bind in many cases.
   * @returns Return value from `method`.
   */
  perform: function(method, scope, a, b, c, d, e, f) {
    throwIf(this.isInTransaction(), DUAL_TRANSACTION);
    var memberStart = Date.now();
    var err = null;
    var ret;
    try {
      this.initializeAll();
      ret = method.call(scope, a, b, c, d, e, f);
    } catch (ie_requires_catch) {
      err = ie_requires_catch;
    } finally {
      var memberEnd = Date.now();
      this.methodInvocationTime += (memberEnd - memberStart);
      try {
        this.closeAll();
      } catch (closeAllErr) {
        err = err || closeAllErr;
      }
    }
    if (err) {
      throw err;
    }
    return ret;
  },

  initializeAll: function() {
    this._isInTransaction = true;
    var transactionWrappers = this.transactionWrappers;
    var wrapperInitTimes = this.timingMetrics.wrapperInitTimes;
    var err = null;
    for (var i = 0; i < transactionWrappers.length; i++) {
      var initStart = Date.now();
      var wrapper = transactionWrappers[i];
      try {
        this.wrapperInitData[i] =
          wrapper.initialize ? wrapper.initialize.call(this) : null;
      } catch (initErr) {
        err = err || initErr;  // Remember the first error.
        this.wrapperInitData[i] = Transaction.OBSERVED_ERROR;
      } finally {
        var curInitTime = wrapperInitTimes[i];
        var initEnd = Date.now();
        wrapperInitTimes[i] = (curInitTime || 0) + (initEnd - initStart);
      }
    }
    if (err) {
      throw err;
    }
  },

  /**
   * Invokes each of `this.transactionWrappers.close[i]` functions, passing into
   * them the respective return values of `this.transactionWrappers.init[i]`
   * (`close`rs that correspond to initializers that failed will not be
   * invoked).
   */
  closeAll: function() {
    throwIf(!this.isInTransaction(), MISSING_TRANSACTION);
    var transactionWrappers = this.transactionWrappers;
    var wrapperCloseTimes = this.timingMetrics.wrapperCloseTimes;
    var err = null;
    for (var i = 0; i < transactionWrappers.length; i++) {
      var wrapper = transactionWrappers[i];
      var closeStart = Date.now();
      var initData = this.wrapperInitData[i];
      try {
        if (initData !== Transaction.OBSERVED_ERROR) {
          wrapper.close && wrapper.close.call(this, initData);
        }
      } catch (closeErr) {
        err = err || closeErr;  // Remember the first error.
      } finally {
        var closeEnd = Date.now();
        var curCloseTime = wrapperCloseTimes[i];
        wrapperCloseTimes[i] = (curCloseTime || 0) + (closeEnd - closeStart);
      }
    }
    this.wrapperInitData.length = 0;
    this._isInTransaction = false;
    if (err) {
      throw err;
    }
  }
};

var Transaction = {
  Mixin: Mixin,
  /**
   * Token to look for to determine if an error occured.
   */
  OBSERVED_ERROR: {}

};

module.exports = Transaction;

})()
},{"./throwIf":31}],42:[function(require,module,exports){
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
 * @providesModule escapeTextForBrowser
 */

"use strict";

var throwIf = require("./throwIf");

var ESCAPE_TYPE_ERR;

if (true) {
  ESCAPE_TYPE_ERR =
    'The React core has attempted to escape content that is of a ' +
    'mysterious type (object etc) Escaping only works on numbers and strings';
}

var ESCAPE_LOOKUP = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  "\"": "&quot;",
  "'": "&#x27;",
  "/": "&#x2f;"
};

function escaper(match) {
  return ESCAPE_LOOKUP[match];
}

var escapeTextForBrowser = function (text) {
  var type = typeof text;
  var invalid = type === 'object';
  if (true) {
    throwIf(invalid, ESCAPE_TYPE_ERR);
  }
  if (text === '' || invalid) {
    return '';
  } else {
    if (type === 'string') {
      return text.replace(/[&><"'\/]/g, escaper);
    } else {
      return (''+text).replace(/[&><"'\/]/g, escaper);
    }
  }
};

module.exports = escapeTextForBrowser;

},{"./throwIf":31}],41:[function(require,module,exports){
(function(){/**
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
 * @providesModule ReactMultiChild
 */

"use strict";

var ReactComponent = require("./ReactComponent");

/**
 * Given a `curChild` and `newChild`, determines if `curChild` should be managed
 * as it exists, as opposed to being destroyed and/or replaced.
 * @param {?ReactComponent} curChild
 * @param {?ReactComponent} newChild
 * @return {!boolean} Whether or not `curChild` should be updated with
 * `newChild`'s props
 */
function shouldManageExisting(curChild, newChild) {
  return curChild && newChild && curChild.constructor === newChild.constructor;
}

/**
 * `ReactMultiChild` provides common functionality for components that have
 * multiple children. Standard `ReactCompositeComponent`s do not currently have
 * multiple children. `ReactNativeComponent`s do, however. Other specially
 * reconciled components will also have multiple children. Contains three
 * internally used properties that are used to keep track of state throughout
 * the `updateMultiChild` process.
 *
 * @class ReactMultiChild
 */

/**
 * @lends `ReactMultiChildMixin`.
 */
var ReactMultiChildMixin = {

  enqueueMarkupAt: function(markup, insertAt) {
    this.domOperations = this.domOperations || [];
    this.domOperations.push({insertMarkup: markup, finalIndex: insertAt});
  },

  enqueueMove: function(originalIndex, finalIndex) {
    this.domOperations = this.domOperations || [];
    this.domOperations.push({moveFrom: originalIndex, finalIndex: finalIndex});
  },

  enqueueUnmountChildByName: function(name, removeChild) {
    if (ReactComponent.isValidComponent(removeChild)) {
      this.domOperations = this.domOperations || [];
      this.domOperations.push({removeAt: removeChild._domIndex});
      removeChild.unmountComponent && removeChild.unmountComponent();
      delete this._renderedChildren[name];
    }
  },

  /**
   * Process any pending DOM operations that have been accumulated when updating
   * the UI. By default, we execute the injected `DOMIDOperations` module's
   * `manageChildrenByParentID` which does executes the DOM operations without
   * any animation. It can be used as a reference implementation for special
   * animation based implementations.
   *
   * @abstract
   */
  processChildDOMOperationsQueue: function() {
    if (this.domOperations) {
      ReactComponent.DOMIDOperations
        .manageChildrenByParentID(this._rootNodeID, this.domOperations);
      this.domOperations = null;
    }
  },

  unmountMultiChild: function() {
    var renderedChildren = this._renderedChildren;
    for (var name in renderedChildren) {
      if (renderedChildren.hasOwnProperty(name) && renderedChildren[name]) {
        var renderedChild = renderedChildren[name];
        renderedChild.unmountComponent && renderedChild.unmountComponent();
      }
    }
    this._renderedChildren = null;
  },

  /**
   * Generates markup for a component that holds multiple children. #todo: Allow
   * all `ReactMultiChildMixin`s to support having arrays of children without a
   * container node. This current implementation may assume that children exist
   * at domIndices [0, parentNode.length].
   *
   * Has side effects of (likely) causing events to be registered. Also, every
   * component instance may only be rendered once.
   *
   * @param {?Object} children Flattened children object.
   * @return {!String} The rendered markup.
   */
  mountMultiChild: function(children, transaction) {
    var accum = '';
    var index = 0;
    for (var name in children) {
      var child = children[name];
      if (children.hasOwnProperty(name) && child) {
        accum += child.mountComponent(
          this._rootNodeID + '.' + name,
          transaction
        );
        child._domIndex = index;
        index++;
      }
    }
    this._renderedChildren = children; // children are in just the right form!
    this.domOperations = null;
    return accum;
  },

  /**
   * Reconciles new children with old children in three phases.
   *
   * - Adds new content while updating existing children that should remain.
   * - Remove children that are no longer present in the next children.
   * - As a very last step, moves existing dom structures around.
   * - (Comment 1) `curChildrenDOMIndex` is the largest index of the current
   *   rendered children that appears in the next children and did not need to
   *   be "moved".
   * - (Comment 2) This is the key insight. If any non-removed child's previous
   *   index is less than `curChildrenDOMIndex` it must be moved.
   *
   * @param {?Object} children Flattened children object.
   */
  updateMultiChild: function(nextChildren, transaction) {
    if (!nextChildren && !this._renderedChildren) {
      return;
    } else if (nextChildren && !this._renderedChildren) {
      this._renderedChildren = {}; // lazily allocate backing store with nothing
    } else if (!nextChildren && this._renderedChildren) {
      nextChildren = {};
    }
    var rootDomIdDot = this._rootNodeID + '.';
    var markupBuffer = null;  // Accumulate adjacent new children markup.
    var numPendingInsert = 0; // How many root nodes are waiting in markupBuffer
    var loopDomIndex = 0;     // Index of loop through new children.
    var curChildrenDOMIndex = 0;  // See (Comment 1)
    for (var name in nextChildren) {
      if (!nextChildren.hasOwnProperty(name)) {continue;}
      var curChild = this._renderedChildren[name];
      var nextChild = nextChildren[name];
      if (shouldManageExisting(curChild, nextChild)) {
        if (markupBuffer) {
          this.enqueueMarkupAt(markupBuffer, loopDomIndex - numPendingInsert);
          markupBuffer = null;
        }
        numPendingInsert = 0;
        if (curChild._domIndex < curChildrenDOMIndex) { // (Comment 2)
          this.enqueueMove(curChild._domIndex, loopDomIndex);
        }
        curChildrenDOMIndex = Math.max(curChild._domIndex, curChildrenDOMIndex);
        !nextChild.props.isStatic &&
          curChild.receiveProps(nextChild.props, transaction);
        curChild._domIndex = loopDomIndex;
      } else {
        if (curChild) {               // !shouldUpdate && curChild => delete
          this.enqueueUnmountChildByName(name, curChild);
          curChildrenDOMIndex =
            Math.max(curChild._domIndex, curChildrenDOMIndex);
        }
        if (nextChild) {              // !shouldUpdate && nextChild => insert
          this._renderedChildren[name] = nextChild;
          var nextMarkup =
            nextChild.mountComponent(rootDomIdDot + name, transaction);
          markupBuffer = markupBuffer ? markupBuffer + nextMarkup : nextMarkup;
          numPendingInsert++;
          nextChild._domIndex = loopDomIndex;
        }
      }
      loopDomIndex = nextChild ? loopDomIndex + 1 : loopDomIndex;
    }
    if (markupBuffer) {
      this.enqueueMarkupAt(markupBuffer, loopDomIndex - numPendingInsert);
    }
    for (var childName in this._renderedChildren) { // from other direction
      if (!this._renderedChildren.hasOwnProperty(childName)) { continue; }
      var child = this._renderedChildren[childName];
      if (child && !nextChildren[childName]) {
        this.enqueueUnmountChildByName(childName, child);
      }
    }
    this.processChildDOMOperationsQueue();
  }
};

var ReactMultiChild = {
  Mixin: ReactMultiChildMixin
};

module.exports = ReactMultiChild;

})()
},{"./ReactComponent":3}],43:[function(require,module,exports){
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
 * @providesModule flattenChildren
 */

"use strict";

var ReactTextComponent = require("./ReactTextComponent");

var escapeTextForBrowser = require("./escapeTextForBrowser");

var throwIf = require("./throwIf");

/**
 * @polyFill Array.isArray
 */


var INVALID_CHILD = 'INVALID_CHILD';
if (true) {
  INVALID_CHILD =
    'You may not pass a child of that type to a React component. It ' +
    'is a common mistake to try to pass a standard browser DOM element ' +
    'as a child of a React component.';
}

/**
 * If there is only a single child, it still needs a name.
 */
var ONLY_CHILD_NAME = '0';

var flattenChildrenImpl = function(res, children, nameSoFar) {
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      flattenChildrenImpl(res, children[i], nameSoFar + '[' + i + ']');
    }
  } else {
    var type = typeof children;
    var isOnlyChild = nameSoFar === '';
    var storageName = isOnlyChild ? ONLY_CHILD_NAME : nameSoFar;
    if (children === null || children === undefined || type === 'boolean') {
      res[storageName] = null;
    } else if (children.mountComponentIntoNode) {
      /* We found a component instance */
      res[storageName] = children;
    } else {
      if (type === 'object') {
        throwIf(children && children.nodeType === 1, INVALID_CHILD);
        for (var key in children) {
          if (children.hasOwnProperty(key)) {
            flattenChildrenImpl(
              res,
              children[key],
              nameSoFar + '{' + escapeTextForBrowser(key) + '}'
            );
          }
        }
      } else if (type === 'string') {
        res[storageName] = new ReactTextComponent(children);
      } else if (type === 'number') {
        res[storageName] = new ReactTextComponent('' + children);
      }
    }
  }
};

/**
 * Flattens children that are typically specified as `props.children`.
 * @return {!Object} flattened children keyed by name.
 */
function flattenChildren(children) {
  if (children === null || children === undefined) {
    return children;
  }
  var result = {};
  flattenChildrenImpl(result, children, '');
  return result;
}

module.exports = flattenChildren;

},{"./ReactTextComponent":65,"./escapeTextForBrowser":42,"./throwIf":31}],45:[function(require,module,exports){
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
 * @providesModule mergeHelpers
 *
 * requiresPolyfills: Array.isArray
 */

"use strict";

var keyMirror = require("./keyMirror");
var throwIf = require("./throwIf");

/*
 * Maximum number of levels to traverse. Will catch circular structures.
 * @const
 */
var MAX_MERGE_DEPTH = 36;

var ERRORS = keyMirror({
  MERGE_ARRAY_FAIL: null,
  MERGE_CORE_FAILURE: null,
  MERGE_TYPE_USAGE_FAILURE: null,
  MERGE_DEEP_MAX_LEVELS: null,
  MERGE_DEEP_NO_ARR_STRATEGY: null
});

if (true) {
  ERRORS = {
    MERGE_ARRAY_FAIL:
      'Unsupported type passed to a merge function. You may have passed a ' +
      'structure that contains an array and the merge function does not know ' +
      'how to merge arrays. ',

    MERGE_CORE_FAILURE:
      'Critical assumptions about the merge functions have been violated. ' +
      'This is the fault of the merge functions themselves, not necessarily ' +
      'the callers.',

    MERGE_TYPE_USAGE_FAILURE:
      'Calling merge function with invalid types. You may call merge ' +
      'functions (non-array non-terminal) OR (null/undefined) arguments. ' +
      'mergeInto functions have the same requirements but with an added ' +
      'restriction that the first parameter must not be null/undefined.',

    MERGE_DEEP_MAX_LEVELS:
      'Maximum deep merge depth exceeded. You may attempting to merge ' +
      'circular structures in an unsupported way.',
    MERGE_DEEP_NO_ARR_STRATEGY:
      'You must provide an array strategy to deep merge functions to ' +
      'instruct the deep merge how to resolve merging two arrays.'
  };
}

/**
 * We won't worry about edge cases like new String('x') or new Boolean(true).
 * Functions are considered terminals, and arrays are not.
 * @param {*} o The item/object/value to test.
 * @return {boolean} true iff the argument is a terminal.
 */
var isTerminal = function(o) {
  return typeof o !== 'object' || o === null;
};

var mergeHelpers = {

  MAX_MERGE_DEPTH: MAX_MERGE_DEPTH,

  isTerminal: isTerminal,

  /**
   * Converts null/undefined values into empty object.
   *
   * @param {?Object=} arg Argument to be normalized (nullable optional)
   * @return {!Object}
   */
  normalizeMergeArg: function(arg) {
    return arg === undefined || arg === null ? {} : arg;
  },

  /**
   * If merging Arrays, a merge strategy *must* be supplied. If not, it is
   * likely the caller's fault. If this function is ever called with anything
   * but `one` and `two` being `Array`s, it is the fault of the merge utilities.
   *
   * @param {*} one Array to merge into.
   * @param {*} two Array to merge from.
   */
  checkMergeArrayArgs: function(one, two) {
    throwIf(
      !Array.isArray(one) || !Array.isArray(two),
      ERRORS.MERGE_CORE_FAILURE
    );
  },

  /**
   * @param {*} one Object to merge into.
   * @param {*} two Object to merge from.
   */
  checkMergeObjectArgs: function(one, two) {
    mergeHelpers.checkMergeObjectArg(one);
    mergeHelpers.checkMergeObjectArg(two);
  },

  /**
   * @param {*} arg
   */
  checkMergeObjectArg: function(arg) {
    throwIf(isTerminal(arg) || Array.isArray(arg), ERRORS.MERGE_CORE_FAILURE);
  },

  /**
   * Checks that a merge was not given a circular object or an object that had
   * too great of depth.
   *
   * @param {number} Level of recursion to validate against maximum.
   */
  checkMergeLevel: function(level) {
    throwIf(level >= MAX_MERGE_DEPTH, ERRORS.MERGE_DEEP_MAX_LEVELS);
  },

  /**
   * Checks that a merge was not given a circular object or an object that had
   * too great of depth.
   *
   * @param {number} Level of recursion to validate against maximum.
   */
  checkArrayStrategy: function(strategy) {
    throwIf(
      strategy !== undefined && !(strategy in mergeHelpers.ArrayStrategies),
      ERRORS.MERGE_DEEP_NO_ARR_STRATEGY
    );
  },

  /**
   * Set of possible behaviors of merge algorithms when encountering two Arrays
   * that must be merged together.
   * - `clobber`: The left `Array` is ignored.
   * - `indexByIndex`: The result is achieved by recursively deep merging at
   *   each index. (not yet supported.)
   */
  ArrayStrategies: keyMirror({
    Clobber: true,
    IndexByIndex: true
  }),

  ERRORS: ERRORS
};

module.exports = mergeHelpers;

},{"./keyMirror":11,"./throwIf":31}],47:[function(require,module,exports){
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
 * @providesModule EventConstants
 */

"use strict";

var keyMirror = require("./keyMirror");

var PropagationPhases = keyMirror({bubbled: null, captured: null});

/**
 * Types of raw signals from the browser caught at the top level.
 */
var topLevelTypes = keyMirror({
  topBlur: null,
  topChange: null,
  topClick: null,
  topDOMCharacterDataModified: null,
  topDoubleClick: null,
  topFocus: null,
  topKeyDown: null,
  topKeyPress: null,
  topKeyUp: null,
  topMouseDown: null,
  topMouseMove: null,
  topMouseOut: null,
  topMouseOver: null,
  topMouseUp: null,
  topMouseWheel: null,
  topScroll: null,
  topSubmit: null,
  topTouchCancel: null,
  topTouchEnd: null,
  topTouchMove: null,
  topTouchStart: null
});

var EventConstants = {
  topLevelTypes: topLevelTypes,
  PropagationPhases: PropagationPhases
};

module.exports = EventConstants;

},{"./keyMirror":11}],48:[function(require,module,exports){
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
 * @providesModule NormalizedEventListener
 */

"use strict";

var EventListener = require("./EventListener");

/**
 * @param {?Event} eventParam Event parameter from an attached listener.
 * @return {Event} Normalized event object.
 * @private
 */
function normalizeEvent(eventParam) {
  var normalized = eventParam || window.event;
  // In some browsers (OLD FF), setting the target throws an error. A good way
  // to tell if setting the target will throw an error, is to check if the event
  // has a `target` property. Safari events have a `target` but it's not always
  // normalized. Even if a `target` property exists, it's good to only set the
  // target property if we realize that a change will actually take place.
  var hasTargetProperty = 'target' in normalized;
  var eventTarget = normalized.target || normalized.srcElement || window;
  // Safari may fire events on text nodes (Node.TEXT_NODE is 3)
  // @see http://www.quirksmode.org/js/events_properties.html
  var textNodeNormalizedTarget =
    (eventTarget.nodeType === 3) ? eventTarget.parentNode : eventTarget;
  if (!hasTargetProperty || normalized.target !== textNodeNormalizedTarget) {
    // Create an object that inherits from the native event so that we can set
    // `target` on it. (It is read-only and setting it throws in strict mode).
    normalized = Object.create(normalized);
    normalized.target = textNodeNormalizedTarget;
  }
  return normalized;
}

function createNormalizedCallback(cb) {
  return function(unfixedNativeEvent) {
    cb(normalizeEvent(unfixedNativeEvent));
  };
}

var NormalizedEventListener = {

  /**
   * Listens to bubbled events on a DOM node.
   *
   * NOTE: The listener will be invoked with a normalized event object.
   *
   * @param {DOMElement} el DOM element to register listener on.
   * @param {string} handlerBaseName Event name, e.g. "click".
   * @param {function} cb Callback function.
   * @public
   */
  listen: function(el, handlerBaseName, cb) {
    EventListener.listen(el, handlerBaseName, createNormalizedCallback(cb));
  },

  /**
   * Listens to captured events on a DOM node.
   *
   * NOTE: The listener will be invoked with a normalized event object.
   *
   * @param {DOMElement} el DOM element to register listener on.
   * @param {string} handlerBaseName Event name, e.g. "click".
   * @param {function} cb Callback function.
   * @public
   */
  capture: function(el, handlerBaseName, cb) {
    EventListener.capture(el, handlerBaseName, createNormalizedCallback(cb));
  }

};

module.exports = NormalizedEventListener;

},{"./EventListener":66}],49:[function(require,module,exports){
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
 * @providesModule isEventSupported
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var testNode;
if (ExecutionEnvironment.canUseDOM) {
  testNode = document.createElement('div');
}

/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @param {?boolean} capture Check if the capture phase is supported.
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
function isEventSupported(eventNameSuffix, capture) {
  if (!testNode || (capture && !testNode.addEventListener)) {
    return false;
  }
  var element = document.createElement('div');
  var eventName = 'on' + eventNameSuffix;
  var isSupported = eventName in element;

  if (!isSupported) {
    element.setAttribute(eventName, '');
    isSupported = typeof element[eventName] === 'function';
    if (typeof element[eventName] !== 'undefined') {
      element[eventName] = undefined;
    }
    element.removeAttribute(eventName);
  }
  element = null;
  return isSupported;
}

module.exports = isEventSupported;

},{"./ExecutionEnvironment":14}],52:[function(require,module,exports){
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
 * @providesModule EventPropagators
 */

"use strict";

var CallbackRegistry = require("./CallbackRegistry");
var EventConstants = require("./EventConstants");

var accumulate = require("./accumulate");
var forEachAccumulated = require("./forEachAccumulated");
var getListener = CallbackRegistry.getListener;
var PropagationPhases = EventConstants.PropagationPhases;

/**
 * Injected dependencies:
 */

/**
 * - `InstanceHandle`: [required] Module that performs logical traversals of DOM
 *   hierarchy given ids of the logical DOM elements involved.
 */
var injection = {
  InstanceHandle: null,
  injectInstanceHandle: function(InjectedInstanceHandle) {
    injection.InstanceHandle = InjectedInstanceHandle;
    if (true) {
      injection.validate();
    }
  },
  validate: function() {
    var invalid = !injection.InstanceHandle||
      !injection.InstanceHandle.traverseTwoPhase ||
      !injection.InstanceHandle.traverseEnterLeave;
    if (invalid) {
      throw new Error('InstanceHandle not injected before use!');
    }
  }
};

/**
 * Some event types have a notion of different registration names for different
 * "phases" of propagation. This finds listeners by a given phase.
 */
function listenerAtPhase(id, abstractEvent, propagationPhase) {
  var registrationName =
    abstractEvent.type.phasedRegistrationNames[propagationPhase];
  return getListener(id, registrationName);
}

/**
 * Tags an `AbstractEvent` with dispatched listeners. Creating this function
 * here, allows us to not have to bind or create functions for each event.
 * Mutating the event's members allows us to not have to create a wrapping
 * "dispatch" object that pairs the event with the listener.
 */
function accumulateDirectionalDispatches(domID, upwards, abstractEvent) {
  if (true) {
    if (!domID) {
      throw new Error('Dispatching id must not be null');
    }
    injection.validate();
  }
  var phase = upwards ? PropagationPhases.bubbled : PropagationPhases.captured;
  var listener = listenerAtPhase(domID, abstractEvent, phase);
  if (listener) {
    abstractEvent._dispatchListeners =
      accumulate(abstractEvent._dispatchListeners, listener);
    abstractEvent._dispatchIDs = accumulate(abstractEvent._dispatchIDs, domID);
  }
}

/**
 * Collect dispatches (must be entirely collected before dispatching - see unit
 * tests). Lazily allocate the array to conserve memory.  We must loop through
 * each event and perform the traversal for each one. We can not perform a
 * single traversal for the entire collection of events because each event may
 * have a different target.
 */
function accumulateTwoPhaseDispatchesSingle(abstractEvent) {
  if (abstractEvent && abstractEvent.type.phasedRegistrationNames) {
    injection.InstanceHandle.traverseTwoPhase(
      abstractEvent.abstractTargetID,
      accumulateDirectionalDispatches,
      abstractEvent
    );
  }
}


/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `abstractTargetID` be the same as the dispatched ID.
 */
function accumulateDispatches(id, ignoredDirection, abstractEvent) {
  if (abstractEvent && abstractEvent.type.registrationName) {
    var listener = getListener(id, abstractEvent.type.registrationName);
    if (listener) {
      abstractEvent._dispatchListeners =
        accumulate(abstractEvent._dispatchListeners, listener);
      abstractEvent._dispatchIDs = accumulate(abstractEvent._dispatchIDs, id);
    }
  }
}

/**
 * Accumulates dispatches on an `AbstractEvent`, but only for the
 * `abstractTargetID`.
 * @param {AbstractEvent} abstractEvent
 */
function accumulateDirectDispatchesSingle(abstractEvent) {
  if (abstractEvent && abstractEvent.type.registrationName) {
    accumulateDispatches(abstractEvent.abstractTargetID, null, abstractEvent);
  }
}

function accumulateTwoPhaseDispatches(abstractEvents) {
  if (true) {
    injection.validate();
  }
  forEachAccumulated(abstractEvents, accumulateTwoPhaseDispatchesSingle);
}

function accumulateEnterLeaveDispatches(leave, enter, fromID, toID) {
  if (true) {
    injection.validate();
  }
  injection.InstanceHandle.traverseEnterLeave(
    fromID,
    toID,
    accumulateDispatches,
    leave,
    enter
  );
}


function accumulateDirectDispatches(abstractEvents) {
  if (true) {
    injection.validate();
  }
  forEachAccumulated(abstractEvents, accumulateDirectDispatchesSingle);
}



/**
 * A small set of propagation patterns, each of which will accept a small amount
 * of information, and generate a set of "dispatch ready event objects" - which
 * are sets of events that have already been annotated with a set of dispatched
 * listener functions/ids. The API is designed this way to discourage these
 * propagation strategies from actually executing the dispatches, since we
 * always want to collect the entire set of dispatches before executing event a
 * single one.
 *
 * @constructor EventPropagators
 */
var EventPropagators = {
  accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
  accumulateDirectDispatches: accumulateDirectDispatches,
  accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches,
  injection: injection
};

module.exports = EventPropagators;

},{"./CallbackRegistry":54,"./EventConstants":47,"./accumulate":56,"./forEachAccumulated":57}],55:[function(require,module,exports){
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
 * @providesModule EventPluginUtils
 */

"use strict";

var EventConstants = require("./EventConstants");
var AbstractEvent = require("./AbstractEvent");

var invariant = require("./invariant");

var topLevelTypes = EventConstants.topLevelTypes;

function isEndish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseUp ||
         topLevelType === topLevelTypes.topTouchEnd ||
         topLevelType === topLevelTypes.topTouchCancel;
}

function isMoveish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseMove ||
         topLevelType === topLevelTypes.topTouchMove;
}
function isStartish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseDown ||
         topLevelType === topLevelTypes.topTouchStart;
}

function storePageCoordsIn(obj, nativeEvent) {
  var pageX = AbstractEvent.eventPageX(nativeEvent);
  var pageY = AbstractEvent.eventPageY(nativeEvent);
  obj.pageX = pageX;
  obj.pageY = pageY;
}

function eventDistance(coords, nativeEvent) {
  var pageX = AbstractEvent.eventPageX(nativeEvent);
  var pageY = AbstractEvent.eventPageY(nativeEvent);
  return Math.pow(
    Math.pow(pageX - coords.pageX, 2) + Math.pow(pageY - coords.pageY, 2),
    0.5
  );
}

var validateEventDispatches;
if (true) {
  validateEventDispatches = function(abstractEvent) {
    var dispatchListeners = abstractEvent._dispatchListeners;
    var dispatchIDs = abstractEvent._dispatchIDs;

    var listenersIsArr = Array.isArray(dispatchListeners);
    var idsIsArr = Array.isArray(dispatchIDs);
    var IDsLen = idsIsArr ? dispatchIDs.length : dispatchIDs ? 1 : 0;
    var listenersLen = listenersIsArr ?
      dispatchListeners.length :
      dispatchListeners ? 1 : 0;

    invariant(
      idsIsArr === listenersIsArr && IDsLen === listenersLen,
      'EventPluginUtils: Invalid `abstractEvent`.'
    );
  };
}

/**
 * Invokes `cb(abstractEvent, listener, id)`. Avoids using call if no scope is
 * provided. The `(listener,id)` pair effectively forms the "dispatch" but are
 * kept separate to conserve memory.
 */
function forEachEventDispatch(abstractEvent, cb) {
  var dispatchListeners = abstractEvent._dispatchListeners;
  var dispatchIDs = abstractEvent._dispatchIDs;
  if (true) {
    validateEventDispatches(abstractEvent);
  }
  if (Array.isArray(dispatchListeners)) {
    var i;
    for (
      i = 0;
      i < dispatchListeners.length && !abstractEvent.isPropagationStopped;
      i++) {
      // Listeners and IDs are two parallel arrays that are always in sync.
      cb(abstractEvent, dispatchListeners[i], dispatchIDs[i]);
    }
  } else if (dispatchListeners) {
    cb(abstractEvent, dispatchListeners, dispatchIDs);
  }
}

/**
 * Default implementation of PluginModule.executeDispatch().
 * @param {AbstractEvent} AbstractEvent to handle
 * @param {function} Application-level callback
 * @param {string} domID DOM id to pass to the callback.
 */
function executeDispatch(abstractEvent, listener, domID) {
  listener(abstractEvent, domID);
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
function executeDispatchesInOrder(abstractEvent, executeDispatch) {
  forEachEventDispatch(abstractEvent, executeDispatch);
  abstractEvent._dispatchListeners = null;
  abstractEvent._dispatchIDs = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @returns id of the first dispatch execution who's listener returns true, or
 * null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrue(abstractEvent) {
  var dispatchListeners = abstractEvent._dispatchListeners;
  var dispatchIDs = abstractEvent._dispatchIDs;
  if (true) {
    validateEventDispatches(abstractEvent);
  }
  if (Array.isArray(dispatchListeners)) {
    var i;
    for (
      i = 0;
      i < dispatchListeners.length && !abstractEvent.isPropagationStopped;
      i++) {
      // Listeners and IDs are two parallel arrays that are always in sync.
      if (dispatchListeners[i](abstractEvent, dispatchIDs[i])) {
        return dispatchIDs[i];
      }
    }
  } else if (dispatchListeners) {
    if (dispatchListeners(abstractEvent, dispatchIDs)) {
      return dispatchIDs;
    }
  }
  return null;
}

/**
 * Execution of a "direct" dispatch - there must be at most one dispatch
 * accumulated on the event or it is considered an error. It doesn't really make
 * sense for an event with multiple dispatches (bubbled) to keep track of the
 * return values at each dispatch execution, but it does tend to make sense when
 * dealing with "direct" dispatches.
 *
 * @returns The return value of executing the single dispatch.
 */
function executeDirectDispatch(abstractEvent) {
  if (true) {
    validateEventDispatches(abstractEvent);
  }
  var dispatchListener = abstractEvent._dispatchListeners;
  var dispatchID = abstractEvent._dispatchIDs;
  invariant(
    !Array.isArray(dispatchListener),
    'executeDirectDispatch(...): Invalid `abstractEvent`.'
  );
  var res = dispatchListener ?
    dispatchListener(abstractEvent, dispatchID) :
    null;
  abstractEvent._dispatchListeners = null;
  abstractEvent._dispatchIDs = null;
  return res;
}

/**
 * @param {AbstractEvent} abstractEvent
 * @returns {bool} True iff number of dispatches accumulated is greater than 0.
 */
function hasDispatches(abstractEvent) {
  return !!abstractEvent._dispatchListeners;
}

/**
 * General utilities that are useful in creating custom Event Plugins.
 */
var EventPluginUtils = {
  isEndish: isEndish,
  isMoveish: isMoveish,
  isStartish: isStartish,
  storePageCoordsIn: storePageCoordsIn,
  eventDistance: eventDistance,
  executeDispatchesInOrder: executeDispatchesInOrder,
  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
  executeDirectDispatch: executeDirectDispatch,
  hasDispatches: hasDispatches,
  executeDispatch: executeDispatch
};

module.exports = EventPluginUtils;

},{"./EventConstants":47,"./AbstractEvent":53,"./invariant":10}],56:[function(require,module,exports){
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
 * @providesModule accumulate
 */

"use strict";

var throwIf = require("./throwIf");

var INVALID_ARGS = 'INVALID_ACCUM_ARGS';

if (true) {
  INVALID_ARGS =
    'accumulate requires non empty (non-null, defined) next ' +
    'values. All arrays accumulated must not contain any empty items.';
}

/**
 * Accumulates items that must never be empty, into a result in a manner that
 * conserves memory - avoiding allocation of arrays until they are needed. The
 * accumulation may start and/or end up being a single element or an array
 * depending on the total count (if greater than one, an array is allocated).
 * Handles most common case first (starting with an empty current value and
 * acquiring one).
 * @returns {Accumulation} An accumulation which is either a single item or an
 * Array of items.
 */
function accumulate(cur, next) {
  var curValIsEmpty = cur == null;   // Will test for emptiness (null/undef)
  var nextValIsEmpty = next === null;
  if (true) {
    throwIf(nextValIsEmpty, INVALID_ARGS);
  }
  if (nextValIsEmpty) {
    return cur;
  } else {
    if (curValIsEmpty) {
      return next;
    } else {
      // Both are not empty. Warning: Never call x.concat(y) when you are not
      // certain that x is an Array (x could be a string with concat method).
      var curIsArray = Array.isArray(cur);
      var nextIsArray = Array.isArray(next);
      if (curIsArray) {
        return cur.concat(next);
      } else {
        if (nextIsArray) {
          return [cur].concat(next);
        } else {
          return [cur, next];
        }
      }
    }
  }
}

module.exports = accumulate;

},{"./throwIf":31}],53:[function(require,module,exports){
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
 * @providesModule AbstractEvent
 */

"use strict";

var BrowserEnv = require("./BrowserEnv");
var PooledClass = require("./PooledClass");
var TouchEventUtils = require("./TouchEventUtils");

var throwIf = require("./throwIf");


// Only accessed in __DEV__
var CLONE_TYPE_ERR;
if (true) {
  CLONE_TYPE_ERR =
    'You may only clone instances of AbstractEvent for ' +
    'persistent references. Check yourself.';
}
var MAX_POOL_SIZE = 20;

/**
 * AbstractEvent copy constructor. @see `PooledClass`. Provides a single place
 * to define all cross browser normalization of DOM events. Does not attempt to
 * extend a native event, rather creates a completely new object that has a
 * reference to the nativeEvent through .nativeEvent member. The property .data
 * should hold all data that is extracted from the event in a cross browser
 * manner. Application code should use the data field when possible, not the
 * unreliable native event.
 */
function AbstractEvent(
    abstractEventType,
    abstractTargetID,  // Allows the abstract target to differ from native.
    originatingTopLevelEventType,
    nativeEvent,
    data) {
  this.type = abstractEventType;
  this.abstractTargetID = abstractTargetID || '';
  this.originatingTopLevelEventType = originatingTopLevelEventType;
  this.nativeEvent = nativeEvent;
  this.data = data;
  // TODO: Deprecate storing target - doesn't always make sense for some types
  this.target = nativeEvent && nativeEvent.target;

  /**
   * As a performance optimization, we tag the existing event with the listeners
   * (or listener [singular] if only one). This avoids having to package up an
   * abstract event along with the set of listeners into a wrapping "dispatch"
   * object. No one should ever read this property except event system and
   * plugin/dispatcher code. We also tag the abstract event with a parallel
   * ID array. _dispatchListeners[i] is being dispatched to a DOM node at ID
   * _dispatchIDs[i]. The lengths should never, ever, ever be different.
   */
  this._dispatchListeners = null;
  this._dispatchIDs = null;

  this.isPropagationStopped = false;
}

/** `PooledClass` looks for this. */
AbstractEvent.poolSize = MAX_POOL_SIZE;

/**
 * `PooledClass` looks for `destructor` on each instance it releases. We need to
 * ensure that we remove all references to listeners which could trap large
 * amounts of memory in their closures.
 */
AbstractEvent.prototype.destructor = function() {
  this.target = null;
  this._dispatchListeners = null;
  this._dispatchIDs = null;
};

/**
 * Enhance the `AbstractEvent` class to have pooling abilities. We instruct
 * `PooledClass` that our copy constructor accepts five arguments (this is just
 * a performance optimization). These objects are instantiated frequently.
 */
PooledClass.addPoolingTo(AbstractEvent, PooledClass.fiveArgumentPooler);

AbstractEvent.prototype.stopPropagation = function() {
  this.isPropagationStopped = true;
  if (this.nativeEvent.stopPropagation) {
    this.nativeEvent.stopPropagation();
  }
  // IE8 only understands cancelBubble, not stopPropagation().
  this.nativeEvent.cancelBubble = true;
};

AbstractEvent.prototype.preventDefault = function() {
  AbstractEvent.preventDefaultOnNativeEvent(this.nativeEvent);
};

/**
 * Utility function for preventing default in cross browser manner.
 */
AbstractEvent.preventDefaultOnNativeEvent = function(nativeEvent) {
  if (nativeEvent.preventDefault) {
    nativeEvent.preventDefault();
  } else {
    nativeEvent.returnValue = false;
  }
};

/**
 * @param {Element} target The target element.
 */
AbstractEvent.normalizeScrollDataFromTarget = function(target) {
  return {
    scrollTop: target.scrollTop,
    scrollLeft: target.scrollLeft,
    clientWidth: target.clientWidth,
    clientHeight: target.clientHeight,
    scrollHeight: target.scrollHeight,
    scrollWidth: target.scrollWidth
  };
};

/*
 * There are some normalizations that need to happen for various browsers. In
 * addition to replacing the general event fixing with a framework such as
 * jquery, we need to normalize mouse events here. Code below is mostly borrowed
 * from: jScrollPane/script/jquery.mousewheel.js
 */
AbstractEvent.normalizeMouseWheelData = function(nativeEvent) {
  var delta = 0;
  var deltaX = 0;
  var deltaY = 0;

  /* traditional scroll wheel data */
  if ( nativeEvent.wheelDelta ) { delta = nativeEvent.wheelDelta/120; }
  if ( nativeEvent.detail     ) { delta = -nativeEvent.detail/3; }

  /* Multidimensional scroll (touchpads) with deltas */
  deltaY = delta;

  /* Gecko based browsers */
  if (nativeEvent.axis !== undefined &&
      nativeEvent.axis === nativeEvent.HORIZONTAL_AXIS ) {
    deltaY = 0;
    deltaX = -delta;
  }

  /* Webkit based browsers */
  if (nativeEvent.wheelDeltaY !== undefined ) {
    deltaY = nativeEvent.wheelDeltaY/120;
  }
  if (nativeEvent.wheelDeltaX !== undefined ) {
    deltaX = -nativeEvent.wheelDeltaX/120;
  }

  return { delta: delta, deltaX: deltaX, deltaY: deltaY };
};

/**
 * I <3 Quirksmode.org:
 * http://www.quirksmode.org/js/events_properties.html
 */
AbstractEvent.isNativeClickEventRightClick = function(nativeEvent) {
  return nativeEvent.which ? nativeEvent.which === 3 :
    nativeEvent.button ? nativeEvent.button === 2 :
    false;
};

AbstractEvent.normalizePointerData = function(nativeEvent) {
  return {
    globalX: AbstractEvent.eventPageX(nativeEvent),
    globalY: AbstractEvent.eventPageY(nativeEvent),
    rightMouseButton:
      AbstractEvent.isNativeClickEventRightClick(nativeEvent)
  };
};

AbstractEvent.normalizeDragEventData =
  function(nativeEvent, globalX, globalY, startX, startY) {
    return {
      globalX: globalX,
      globalY: globalY,
      startX: startX,
      startY: startY
    };
  };

/**
 * Warning: It is possible to move your finger on a touch surface, yet not
 * effect the `eventPageX/Y` because the touch had caused a scroll that
 * compensated for your movement. To track movements across the page, prevent
 * default to avoid scrolling, and control scrolling in javascript.
 */

/**
 * Gets the exact position of a touch/mouse event on the page with respect to
 * the document body. The only reason why this method is needed instead of using
 * `TouchEventUtils.extractSingleTouch` is to support IE8-. Mouse events in all
 * browsers except IE8- contain a pageY. IE8 and below require clientY
 * computation:
 *
 * @param {Event} nativeEvent Native event, possibly touch or mouse.
 * @return {number} Coordinate with respect to document body.
 */
AbstractEvent.eventPageY = function(nativeEvent) {
  var singleTouch = TouchEventUtils.extractSingleTouch(nativeEvent);
  if (singleTouch) {
    return singleTouch.pageY;
  } else if (typeof nativeEvent.pageY !== 'undefined') {
    return nativeEvent.pageY;
  } else {
    return nativeEvent.clientY + BrowserEnv.currentPageScrollTop;
  }
};

/**
 * @see `AbstractEvent.eventPageY`.
 *
 * @param {Event} nativeEvent Native event, possibly touch or mouse.
 * @return {number} Coordinate with respect to document body.
 */
AbstractEvent.eventPageX = function(nativeEvent) {
  var singleTouch = TouchEventUtils.extractSingleTouch(nativeEvent);
  if (singleTouch) {
    return singleTouch.pageX;
  } else if (typeof nativeEvent.pageX !== 'undefined') {
    return nativeEvent.pageX;
  } else {
    return nativeEvent.clientX + BrowserEnv.currentPageScrollLeft;
  }
};

/**
 * A semantic API around cloning an event for use in another event loop. We
 * clear out all dispatched `AbstractEvent`s after each event loop, adding them
 * back into the pool. This allows a way to hold onto a reference that won't be
 * added back into the pool. Please note that `AbstractEvent.nativeEvent` is
 * *not* cloned and you will run into problems in IE if you assume that it will
 * be! The moral of that story is to always normalize any data you need into the
 * `.data` field. The data field is not cloned either, but there won't be any
 * issues related to use of `.data` in a future event cycle so long as no part
 * of your application mutates it. We don't clone the private fields because
 * your application should never be accessing them.
 *
 * - TODO: In __DEV__ when "releasing" events, don't put them back into the
 *   pool. Instead add ES5 getters on all their fields that throw errors so you
 *   can detect any application that's hanging onto events and reusing them.
 *   In prod - we can put them back into the pool for reuse.
 */
AbstractEvent.persistentCloneOf = function(abstractEvent) {
  if (true) {
    throwIf(!(abstractEvent instanceof AbstractEvent), CLONE_TYPE_ERR);
  }
  return new AbstractEvent(
    abstractEvent.type,
    abstractEvent.abstractTargetID,
    abstractEvent.originatingTopLevelEventType,
    abstractEvent.nativeEvent,
    abstractEvent.data,
    abstractEvent.target
  );
};

module.exports = AbstractEvent;


},{"./BrowserEnv":46,"./TouchEventUtils":67,"./throwIf":31,"./PooledClass":37}],58:[function(require,module,exports){
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
 * @providesModule copyProperties
 */

/**
 * Copy properties from one or more objects (up to 5) into the first object.
 * This is a shallow copy. It mutates the first object and also returns it.
 *
 * NOTE: `arguments` has a very significant performance penalty, which is why
 * we don't support unlimited arguments.
 */
function copyProperties(obj, a, b, c, d, e, f) {
  obj = obj || {};

  if (true) {
    if (f) {
      throw new Error('Too many arguments passed to copyProperties');
    }
  }

  var args = [a, b, c, d, e];
  var ii = 0, v;
  while (args[ii]) {
    v = args[ii++];
    for (var k in v) {
      obj[k] = v[k];
    }

    // IE ignores toString in object iteration.. See:
    // webreflection.blogspot.com/2007/07/quick-fix-internet-explorer-and.html
    if (v.hasOwnProperty && v.hasOwnProperty('toString') &&
        (typeof v.toString != 'undefined') && (obj.toString !== v.toString)) {
      obj.toString = v.toString;
    }
  }

  return obj;
}

module.exports = copyProperties;

},{}],60:[function(require,module,exports){
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
 * @providesModule hyphenate
 * @typechecks
 */

var _uppercasePattern = /([A-Z])/g;

/**
 * Hyphenates a camelcased string, for example:
 *
 *   > hyphenate('backgroundColor')
 *   < "background-color"
 *
 * @param {string} string
 * @return {string}
 */
function hyphenate(string) {
  return string.replace(_uppercasePattern, '-$1').toLowerCase();
}

module.exports = hyphenate;

},{}],61:[function(require,module,exports){
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
 * @providesModule memoizeStringOnly
 * @typechecks
 */

"use strict";

/**
 * Memoizes the return value of a function that accepts one string argument.
 *
 * @param {function} callback
 * @return {function}
 */
function memoizeStringOnly(callback) {
  var cache = {};
  return function(string) {
    if (cache.hasOwnProperty(string)) {
      return cache[string];
    } else {
      return cache[string] = callback.call(this, string);
    }
  };
}

module.exports = memoizeStringOnly;

},{}],63:[function(require,module,exports){
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
 * @providesModule insertNodeAt
 */

"use strict";

/**
 * Inserts `node` at a particular child index. Other nodes move to make room.
 * @param {!Element} root The parent root node to insert into.
 * @param {!node} node The node to insert.
 * @param {!number} atIndex The index in `root` that `node` should exist at.
 */
function insertNodeAt(root, node, atIndex) {
  var childNodes = root.childNodes;
  // Remove from parent so that if node is already child of root,
  // `childNodes[atIndex]` already takes into account the removal.
  var curAtIndex = root.childNodes[atIndex];
  if (curAtIndex === node) {
    return node;
  }
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
  if (atIndex >= childNodes.length) {
    root.appendChild(node);
  } else {
    root.insertBefore(node, childNodes[atIndex]);
  }
  return node;
}

module.exports = insertNodeAt;

},{}],66:[function(require,module,exports){
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
 * @providesModule EventListener
 */

/**
 * Upstream version of event listener. Does not take into account specific
 * nature of platform.
 */
var EventListener = {
  /**
   * Listens to bubbled events on a DOM node.
   *
   * @param {Element} el DOM element to register listener on.
   * @param {string} handlerBaseName 'click'/'mouseover'
   * @param {Function!} cb Callback function
   */
  listen: function(el, handlerBaseName, cb) {
    if (el.addEventListener) {
      el.addEventListener(handlerBaseName, cb, false);
    } else if (el.attachEvent) {
      el.attachEvent('on' + handlerBaseName, cb);
    }
  },

  /**
   * Listens to captured events on a DOM node.
   *
   * @see `EventListener.listen` for params.
   * @throws Exception if addEventListener is not supported.
   */
  capture: function(el, handlerBaseName, cb) {
    if (!el.addEventListener) {
      console.error(
        'You are attempting to use addEventlistener ' +
        'in a browser that does not support it support it.' +
        'This likely means that you will not receive events that ' +
        'your application relies on (such as scroll).');
      return;
    } else {
      el.addEventListener(handlerBaseName, cb, true);
    }
  }
};

module.exports = EventListener;

},{}],67:[function(require,module,exports){
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
 * @providesModule TouchEventUtils
 */

var TouchEventUtils = {
  /**
   * Utility function for common case of extracting out the primary touch from a
   * touch event.
   * - `touchEnd` events usually do not have the `touches` property.
   *   http://stackoverflow.com/questions/3666929/
   *   mobile-sarai-touchend-event-not-firing-when-last-touch-is-removed
   *
   * @param {Event} nativeEvent Native event that may or may not be a touch.
   * @return {TouchesObject?} an object with pageX and pageY or null.
   */
  extractSingleTouch: function(nativeEvent) {
    var touches = nativeEvent.touches;
    var changedTouches = nativeEvent.changedTouches;
    var hasTouches = touches && touches.length > 0;
    var hasChangedTouches = changedTouches && changedTouches.length > 0;

    return !hasTouches && hasChangedTouches ? changedTouches[0] :
           hasTouches ? touches[0] :
           nativeEvent;
  }
};

module.exports = TouchEventUtils;

},{}],59:[function(require,module,exports){
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
 * @providesModule dangerousStyleValue
 * @typechecks
 */

"use strict";

var CSSProperty = require("./CSSProperty");

/**
 * Convert a value into the proper css writable value. The `styleName` name
 * name should be logical (no hyphens), as specified in `CSSProperty.isNumber`.
 *
 * @param {string} styleName CSS property name such as `topMargin`.
 * @param {*} value CSS property value such as `10px`.
 * @return {string} Normalized style value with dimensions applied.
 */
function dangerousStyleValue(styleName, value) {
  // Note that we've removed escapeTextForBrowser() calls here since the
  // whole string will be escaped when the attribute is injected into
  // the markup. If you provide unsafe user data here they can inject
  // arbitrary CSS which may be problematic (I couldn't repro this):
  // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
  // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
  // This is not an XSS hole but instead a potential CSS injection issue
  // which has lead to a greater discussion about how we're going to
  // trust URLs moving forward. See #2115901
  if (value === null || value === false || value === true || value === '') {
    return '';
  }
  if (isNaN(value)) {
    return !value ? '' : '' + value;
  }
  return CSSProperty.isNumber[styleName] ? '' + value : (value + 'px');
}

module.exports = dangerousStyleValue;

},{"./CSSProperty":68}],62:[function(require,module,exports){
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
 * @providesModule Danger
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var throwIf = require("./throwIf");

var DOM_UNSUPPORTED;
var NO_MARKUP_PARENT;
var NO_MULTI_MARKUP;
if (true) {
  DOM_UNSUPPORTED =
    'You may not insert markup into the document while you are in a worker ' +
    'thread. It\'s not you, it\'s me. This is likely the fault of the ' +
    'framework. Please report this immediately.';
  NO_MARKUP_PARENT =
    'You have attempted to inject markup without a suitable parent. This is ' +
    'likely the fault of the framework - please report immediately.';
  NO_MULTI_MARKUP =
    'The framework has attempted to either insert zero or multiple markup ' +
    'roots into a single location when it should not. This is a serious ' +
    'error - a fault of the framework - please report immediately.';
}

var validateMarkupParams;
if (true) {
  validateMarkupParams = function(parentNode, markup) {
    throwIf(!ExecutionEnvironment.canUseDOM, DOM_UNSUPPORTED);
    throwIf(!parentNode || !parentNode.tagName, NO_MARKUP_PARENT);
    throwIf(!markup, NO_MULTI_MARKUP);
  };
}

var dummies = {};

function getParentDummy(parent) {
  var parentTag = parent.tagName;
  return dummies[parentTag] ||
    (dummies[parentTag] = document.createElement(parentTag));
}

/**
 * Inserts node after 'after'. If 'after' is null, inserts it after nothing,
 * which is inserting it at the beginning.
 *
 * @param {Element} elem Parent element.
 * @param {Element} insert Element to insert.
 * @param {Element} after Element to insert after.
 * @returns {Element} Element that was inserted.
 */
function insertNodeAfterNode(elem, insert, after) {
  if (true) {
    throwIf(!ExecutionEnvironment.canUseDOM, DOM_UNSUPPORTED);
  }
  if (after) {
    if (after.nextSibling) {
      return elem.insertBefore(insert, after.nextSibling);
    } else {
      return elem.appendChild(insert);
    }
  } else {
    return elem.insertBefore(insert, elem.firstChild);
  }
}

/**
 * Slow: Should only be used when it is known there are a few (or one) element
 * in the node list.
 * @param {Element} parentRootDomNode Parent element.
 * @param {HTMLCollection} htmlCollection HTMLCollection to insert.
 * @param {Element} after Element to insert the node list after.
 */
function inefficientlyInsertHTMLCollectionAfter(
    parentRootDomNode,
    htmlCollection,
    after) {

  if (true) {
    throwIf(!ExecutionEnvironment.canUseDOM, DOM_UNSUPPORTED);
  }
  var ret;
  var originalLength = htmlCollection.length;
  // Access htmlCollection[0] because htmlCollection shrinks as we remove items.
  // `insertNodeAfterNode` will remove items from the htmlCollection.
  for (var i = 0; i < originalLength; i++) {
    ret =
      insertNodeAfterNode(parentRootDomNode, htmlCollection[0], ret || after);
  }
}

/**
 * Super-dangerously inserts markup into existing DOM structure. Seriously, you
 * don't want to use this module unless you are building a framework. This
 * requires that the markup that you are inserting represents the root of a
 * tree. We do not support the case where there `markup` represents several
 * roots.
 *
 * @param {Element} parentNode Parent DOM element.
 * @param {string} markup Markup to dangerously insert.
 * @param {number} index Position to insert markup at.
 */
function dangerouslyInsertMarkupAt(parentNode, markup, index) {
  if (true) {
    validateMarkupParams(parentNode, markup);
  }
  var parentDummy = getParentDummy(parentNode);
  parentDummy.innerHTML = markup;
  var htmlCollection = parentDummy.childNodes;
  var afterNode = index ? parentNode.childNodes[index - 1] : null;
  inefficientlyInsertHTMLCollectionAfter(parentNode, htmlCollection, afterNode);
}

/**
 * Replaces a node with a string of markup at its current position within its
 * parent. `childNode` must be in the document (or at least within a parent
 * node). The string of markup must represent a tree of markup with a single
 * root.
 *
 * @param {Element} childNode Child node to replace.
 * @param {string} markup Markup to dangerously replace child with.
 */
function dangerouslyReplaceNodeWithMarkup(childNode, markup) {
  var parentNode = childNode.parentNode;
  if (true) {
    validateMarkupParams(parentNode, markup);
  }
  var parentDummy = getParentDummy(parentNode);
  parentDummy.innerHTML = markup;
  var htmlCollection = parentDummy.childNodes;
  if (true) {
    throwIf(htmlCollection.length !== 1, NO_MULTI_MARKUP);
  }
  parentNode.replaceChild(htmlCollection[0], childNode);
}

var Danger = {
  dangerouslyInsertMarkupAt: dangerouslyInsertMarkupAt,
  dangerouslyReplaceNodeWithMarkup: dangerouslyReplaceNodeWithMarkup
};

module.exports = Danger;

},{"./ExecutionEnvironment":14,"./throwIf":31}],64:[function(require,module,exports){
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
 * @providesModule DOMProperty
 * @typechecks
 */

/*jslint bitwise: true */

"use strict";

var invariant = require("./invariant");

/**
 * DOMProperty exports lookup objects that can be used like functions:
 *
 *   > DOMProperty.isValid['id']
 *   true
 *   > DOMProperty.isValid['foobar']
 *   undefined
 *
 * Although this may be confusing, it performs better in general.
 *
 * @see http://jsperf.com/key-exists
 * @see http://jsperf.com/key-missing
 */
var DOMProperty = {

  /**
   * Checks whether a property name is a standard property.
   * @type {Object}
   */
  isStandardName: {},

  /**
   * Mapping from normalized names to attribute names that differ. Attribute
   * names are used when rendering markup or with `*Attribute()`.
   * @type {Object}
   */
  getAttributeName: {},

  /**
   * Mapping from normalized names to properties on DOM node instances.
   * (This includes properties that mutate due to external factors.)
   * @type {Object}
   */
  getPropertyName: {},

  /**
   * Mapping from normalized names to mutation methods. This will only exist if
   * mutation cannot be set simply by the property or `setAttribute()`.
   * @type {Object}
   */
  getMutationMethod: {},

  /**
   * Whether the property must be accessed and mutated as an object property.
   * @type {Object}
   */
  mustUseAttribute: {},

  /**
   * Whether the property must be accessed and mutated using `*Attribute()`.
   * (This includes anything that fails `<propName> in <element>`.)
   * @type {Object}
   */
  mustUseProperty: {},

  /**
   * Whether the property should be removed when set to a falsey value.
   * @type {Object}
   */
  hasBooleanValue: {},

  /**
   * Whether or not setting a value causes side effects such as triggering
   * resources to be loaded or text selection changes. We must ensure that
   * the value is only set if it has changed.
   * @type {Object}
   */
  hasSideEffects: {},

  /**
   * Checks whether a property name is a custom attribute.
   * @method
   */
  isCustomAttribute: RegExp.prototype.test.bind(
    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
  )
};

/**
 * Mapping from normalized, camelcased property names to a configuration that
 * specifies how the associated DOM property should be accessed or rendered.
 */
var MustUseAttribute  = 0x1;
var MustUseProperty   = 0x2;
var HasBooleanValue   = 0x4;
var HasSideEffects    = 0x8;

var Properties = {
  /**
   * Standard Properties
   */
  accept: null,
  action: null,
  ajaxify: MustUseAttribute,
  allowFullScreen: MustUseAttribute | HasBooleanValue,
  alt: null,
  autoComplete: null,
  autoplay: HasBooleanValue,
  cellPadding: null,
  cellSpacing: null,
  checked: MustUseProperty | HasBooleanValue,
  className: MustUseProperty,
  colSpan: null,
  contentEditable: null,
  controls: MustUseProperty | HasBooleanValue,
  data: null, // For `<object />` acts as `src`.
  dir: null,
  disabled: MustUseProperty | HasBooleanValue,
  enctype: null,
  height: null,
  href: null,
  htmlFor: null,
  method: null,
  multiple: MustUseProperty | HasBooleanValue,
  name: null,
  poster: null,
  preload: null,
  placeholder: null,
  rel: null,
  required: HasBooleanValue,
  role: MustUseAttribute,
  scrollLeft: MustUseProperty,
  scrollTop: MustUseProperty,
  selected: MustUseProperty | HasBooleanValue,
  spellCheck: null,
  src: null,
  style: null,
  tabIndex: null,
  target: null,
  title: null,
  type: null,
  value: MustUseProperty | HasSideEffects,
  width: null,
  wmode: MustUseAttribute,
  /**
   * SVG Properties
   */
  cx: MustUseProperty,
  cy: MustUseProperty,
  d: MustUseProperty,
  fill: MustUseProperty,
  fx: MustUseProperty,
  fy: MustUseProperty,
  points: MustUseProperty,
  r: MustUseProperty,
  stroke: MustUseProperty,
  strokeLinecap: MustUseProperty,
  strokeWidth: MustUseProperty,
  transform: MustUseProperty,
  x: MustUseProperty,
  x1: MustUseProperty,
  x2: MustUseProperty,
  version: MustUseProperty,
  viewBox: MustUseProperty,
  y: MustUseProperty,
  y1: MustUseProperty,
  y2: MustUseProperty,
  spreadMethod: MustUseProperty,
  offset: MustUseProperty,
  stopColor: MustUseProperty,
  stopOpacity: MustUseProperty,
  gradientUnits: MustUseProperty,
  gradientTransform: MustUseProperty
};

/**
 * Attribute names not specified use the **lowercase** normalized name.
 */
var DOMAttributeNames = {
  className: 'class',
  htmlFor: 'for',
  strokeLinecap: 'stroke-linecap',
  strokeWidth: 'stroke-width',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity'
};

/**
 * Property names not specified use the normalized name.
 */
var DOMPropertyNames = {
  autoComplete: 'autocomplete',
  spellCheck: 'spellcheck'
};

/**
 * Properties that require special mutation methods.
 */
var DOMMutationMethods = {
  /**
   * Setting `className` to null may cause it to be set to the string "null".
   *
   * @param {DOMElement} node
   * @param {*} value
   */
  className: function(node, value) {
    node.className = value || '';
  }
};

for (var propName in Properties) {
  DOMProperty.isStandardName[propName] = true;

  DOMProperty.getAttributeName[propName] =
    DOMAttributeNames[propName] || propName.toLowerCase();

  DOMProperty.getPropertyName[propName] =
    DOMPropertyNames[propName] || propName;

  var mutationMethod = DOMMutationMethods[propName];
  if (mutationMethod) {
    DOMProperty.getMutationMethod[propName] = mutationMethod;
  }

  var propConfig = Properties[propName];
  DOMProperty.mustUseAttribute[propName] = propConfig & MustUseAttribute;
  DOMProperty.mustUseProperty[propName]  = propConfig & MustUseProperty;
  DOMProperty.hasBooleanValue[propName]  = propConfig & HasBooleanValue;
  DOMProperty.hasSideEffects[propName]   = propConfig & HasSideEffects;

  invariant(
    !DOMProperty.mustUseAttribute[propName] ||
    !DOMProperty.mustUseProperty[propName],
    'DOMProperty: Cannot use require using both attribute and property: %s',
    propName
  );
  invariant(
    DOMProperty.mustUseProperty[propName] ||
    !DOMProperty.hasSideEffects[propName],
    'DOMProperty: Properties that have side effects must use property: %s',
    propName
  );
}

module.exports = DOMProperty;

},{"./invariant":10}],65:[function(require,module,exports){
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
 * @providesModule ReactTextComponent
 * @typechecks
 */

"use strict";

var ReactComponent = require("./ReactComponent");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var mixInto = require("./mixInto");

/**
 * Text nodes violate a couple assumptions that React makes about components:
 *
 *  - When mounting text into the DOM, adjacent text nodes are merged.
 *  - Text nodes cannot be assigned a React root ID.
 *
 * This component is used to wrap strings in elements so that they can undergo
 * the same reconciliation that is applied to elements.
 *
 * TODO: Investigate representing React components in the DOM with text nodes.
 *
 * @class ReactTextComponent
 * @extends ReactComponent
 * @internal
 */
var ReactTextComponent = function(initialText) {
  this.construct({text: initialText});
};

mixInto(ReactTextComponent, ReactComponent.Mixin);
mixInto(ReactTextComponent, {

  /**
   * Creates the markup for this text node. This node is not intended to have
   * any features besides containing text content.
   *
   * @param {string} rootID DOM ID of the root node.
   * @return {string} Markup for this text node.
   * @internal
   */
  mountComponent: function(rootID) {
    ReactComponent.Mixin.mountComponent.call(this, rootID);
    return (
      '<span id="' + rootID + '">' +
        escapeTextForBrowser(this.props.text) +
      '</span>'
    );
  },

  /**
   * Updates this component by updating the text content.
   *
   * @param {object} nextProps Contains the next text content.
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  receiveProps: function(nextProps, transaction) {
    if (nextProps.text !== this.props.text) {
      this.props.text = nextProps.text;
      ReactComponent.DOMIDOperations.updateTextContentByID(
        this._rootNodeID,
        nextProps.text
      );
    }
  }

});

module.exports = ReactTextComponent;

},{"./ReactComponent":3,"./escapeTextForBrowser":42,"./mixInto":13}],68:[function(require,module,exports){
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
 * @providesModule CSSProperty
 */

"use strict";

/**
 * CSS properties for which we do not append "px".
 */
var isNumber = {
  fillOpacity: true,
  fontWeight: true,
  opacity: true,
  orphans: true,
  textDecoration: true,
  zIndex: true,
  zoom: true
};

var CSSProperty = {
  isNumber: isNumber
};

module.exports = CSSProperty;

},{}]},{},[1])(1)
});
;