/**
 * react.development.js v16.0.0-beta.5
 */

(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
        ? define(factory)
        : (global.React = factory());
})(this, function() {
  'use strict';
  /*
object-assign
(c) Sindre Sorhus
@license MIT
*/

  /* eslint-disable no-unused-vars */
  var getOwnPropertySymbols = Object.getOwnPropertySymbols;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var propIsEnumerable = Object.prototype.propertyIsEnumerable;

  function toObject(val) {
    if (val === null || val === undefined) {
      throw new TypeError(
        'Object.assign cannot be called with null or undefined'
      );
    }

    return Object(val);
  }

  function shouldUseNative() {
    try {
      if (!Object.assign) {
        return false;
      }

      // Detect buggy property enumeration order in older V8 versions.

      // https://bugs.chromium.org/p/v8/issues/detail?id=4118
      var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
      test1[5] = 'de';
      if (Object.getOwnPropertyNames(test1)[0] === '5') {
        return false;
      }

      // https://bugs.chromium.org/p/v8/issues/detail?id=3056
      var test2 = {};
      for (var i = 0; i < 10; i++) {
        test2['_' + String.fromCharCode(i)] = i;
      }
      var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
        return test2[n];
      });
      if (order2.join('') !== '0123456789') {
        return false;
      }

      // https://bugs.chromium.org/p/v8/issues/detail?id=3056
      var test3 = {};
      'abcdefghijklmnopqrst'.split('').forEach(function(letter) {
        test3[letter] = letter;
      });
      if (
        Object.keys(Object.assign({}, test3)).join('') !==
        'abcdefghijklmnopqrst'
      ) {
        return false;
      }

      return true;
    } catch (err) {
      // We don't expect any of the above to throw, but better to be safe.
      return false;
    }
  }

  var index = shouldUseNative()
    ? Object.assign
    : function(target, source) {
        var from;
        var to = toObject(target);
        var symbols;

        for (var s = 1; s < arguments.length; s++) {
          from = Object(arguments[s]);

          for (var key in from) {
            if (hasOwnProperty.call(from, key)) {
              to[key] = from[key];
            }
          }

          if (getOwnPropertySymbols) {
            symbols = getOwnPropertySymbols(from);
            for (var i = 0; i < symbols.length; i++) {
              if (propIsEnumerable.call(from, symbols[i])) {
                to[symbols[i]] = from[symbols[i]];
              }
            }
          }
        }

        return to;
      };

  /**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule reactProdInvariant
 * 
 */

  /**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

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
  var emptyFunction = function emptyFunction() {};

  emptyFunction.thatReturns = makeEmptyFunction;
  emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
  emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
  emptyFunction.thatReturnsNull = makeEmptyFunction(null);
  emptyFunction.thatReturnsThis = function() {
    return this;
  };
  emptyFunction.thatReturnsArgument = function(arg) {
    return arg;
  };

  var emptyFunction_1 = emptyFunction;

  /**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

  var warning$1 = emptyFunction_1;

  {
    (function() {
      var printWarning = function printWarning(format) {
        for (
          var _len = arguments.length,
            args = Array(_len > 1 ? _len - 1 : 0),
            _key = 1;
          _key < _len;
          _key++
        ) {
          args[_key - 1] = arguments[_key];
        }

        var argIndex = 0;
        var message =
          'Warning: ' +
          format.replace(/%s/g, function() {
            return args[argIndex++];
          });
        if (typeof console !== 'undefined') {
          console.error(message);
        }
        try {
          // --- Welcome to debugging React ---
          // This error was thrown as a convenience so that you can use this stack
          // to find the callsite that caused this warning to fire.
          throw new Error(message);
        } catch (x) {}
      };

      warning$1 = function warning(condition, format) {
        if (format === undefined) {
          throw new Error(
            '`warning(condition, format, ...args)` requires a warning ' +
              'message argument'
          );
        }

        if (format.indexOf('Failed Composite propType: ') === 0) {
          return; // Ignore CompositeComponent proptype check.
        }

        if (!condition) {
          for (
            var _len2 = arguments.length,
              args = Array(_len2 > 2 ? _len2 - 2 : 0),
              _key2 = 2;
            _key2 < _len2;
            _key2++
          ) {
            args[_key2 - 2] = arguments[_key2];
          }

          printWarning.apply(undefined, [format].concat(args));
        }
      };
    })();
  }

  var warning_1 = warning$1;

  {
    var warning = warning_1;
  }

  function warnNoop(publicInstance, callerName) {
    {
      var constructor = publicInstance.constructor;
      warning(
        false,
        '%s(...): Can only update a mounted or mounting component. ' +
          'This usually means you called %s() on an unmounted component. ' +
          'This is a no-op.\n\nPlease check the code for the %s component.',
        callerName,
        callerName,
        (constructor && (constructor.displayName || constructor.name)) ||
          'ReactClass'
      );
    }
  }

  /**
 * This is the abstract API for an update queue.
 */
  var ReactNoopUpdateQueue = {
    /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
    isMounted: function(publicInstance) {
      return false;
    },

    /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {?function} callback Called after component is updated.
   * @param {?string} callerName name of the calling function in the public API.
   * @internal
   */
    enqueueForceUpdate: function(publicInstance, callback, callerName) {
      warnNoop(publicInstance, 'forceUpdate');
    },

    /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} completeState Next state.
   * @param {?function} callback Called after component is updated.
   * @param {?string} callerName name of the calling function in the public API.
   * @internal
   */
    enqueueReplaceState: function(
      publicInstance,
      completeState,
      callback,
      callerName
    ) {
      warnNoop(publicInstance, 'replaceState');
    },

    /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @param {?function} callback Called after component is updated.
   * @param {?string} Name of the calling function in the public API.
   * @internal
   */
    enqueueSetState: function(
      publicInstance,
      partialState,
      callback,
      callerName
    ) {
      warnNoop(publicInstance, 'setState');
    },
  };

  var ReactNoopUpdateQueue_1 = ReactNoopUpdateQueue;

  /**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

  var emptyObject = {};

  {
    Object.freeze(emptyObject);
  }

  var emptyObject_1 = emptyObject;

  /**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

  /**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

  var validateFormat = function validateFormat(format) {};

  {
    validateFormat = function validateFormat(format) {
      if (format === undefined) {
        throw new Error('invariant requires an error message argument');
      }
    };
  }

  function invariant(condition, format, a, b, c, d, e, f) {
    validateFormat(format);

    if (!condition) {
      var error;
      if (format === undefined) {
        error = new Error(
          'Minified exception occurred; use the non-minified dev environment ' +
            'for the full error message and additional helpful warnings.'
        );
      } else {
        var args = [a, b, c, d, e, f];
        var argIndex = 0;
        error = new Error(
          format.replace(/%s/g, function() {
            return args[argIndex++];
          })
        );
        error.name = 'Invariant Violation';
      }

      error.framesToPop = 1; // we don't care about invariant's own frame
      throw error;
    }
  }

  var invariant_1 = invariant;

  /**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule lowPriorityWarning
 */

  /**
 * Forked from fbjs/warning:
 * https://github.com/facebook/fbjs/blob/e66ba20ad5be433eb54423f2b097d829324d9de6/packages/fbjs/src/__forks__/warning.js
 *
 * Only change is we use console.warn instead of console.error,
 * and do nothing when 'console' is not supported.
 * This really simplifies the code.
 * ---
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

  var lowPriorityWarning = function() {};

  {
    var printWarning = function(format) {
      for (
        var _len = arguments.length,
          args = Array(_len > 1 ? _len - 1 : 0),
          _key = 1;
        _key < _len;
        _key++
      ) {
        args[_key - 1] = arguments[_key];
      }

      var argIndex = 0;
      var message =
        'Warning: ' +
        format.replace(/%s/g, function() {
          return args[argIndex++];
        });
      if (typeof console !== 'undefined') {
        console.warn(message);
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };

    lowPriorityWarning = function(condition, format) {
      if (format === undefined) {
        throw new Error(
          '`warning(condition, format, ...args)` requires a warning ' +
            'message argument'
        );
      }
      if (!condition) {
        for (
          var _len2 = arguments.length,
            args = Array(_len2 > 2 ? _len2 - 2 : 0),
            _key2 = 2;
          _key2 < _len2;
          _key2++
        ) {
          args[_key2 - 2] = arguments[_key2];
        }

        printWarning.apply(undefined, [format].concat(args));
      }
    };
  }

  var lowPriorityWarning_1 = lowPriorityWarning;

  /**
 * Base class helpers for the updating state of a component.
 */
  function ReactComponent(props, context, updater) {
    this.props = props;
    this.context = context;
    this.refs = emptyObject_1;
    // We initialize the default updater but the real one gets injected by the
    // renderer.
    this.updater = updater || ReactNoopUpdateQueue_1;
  }

  ReactComponent.prototype.isReactComponent = {};

  /**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
  ReactComponent.prototype.setState = function(partialState, callback) {
    !(typeof partialState === 'object' ||
      typeof partialState === 'function' ||
      partialState == null)
      ? invariant_1(
          false,
          'setState(...): takes an object of state variables to update or a function which returns an object of state variables.'
        )
      : void 0;
    this.updater.enqueueSetState(this, partialState, callback, 'setState');
  };

  /**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 *
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
  ReactComponent.prototype.forceUpdate = function(callback) {
    this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
  };

  /**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
  {
    var deprecatedAPIs = {
      isMounted: [
        'isMounted',
        'Instead, make sure to clean up subscriptions and pending requests in ' +
          'componentWillUnmount to prevent memory leaks.',
      ],
      replaceState: [
        'replaceState',
        'Refactor your code to use setState instead (see ' +
          'https://github.com/facebook/react/issues/3236).',
      ],
    };
    var defineDeprecationWarning = function(methodName, info) {
      Object.defineProperty(ReactComponent.prototype, methodName, {
        get: function() {
          lowPriorityWarning_1(
            false,
            '%s(...) is deprecated in plain JavaScript React classes. %s',
            info[0],
            info[1]
          );
          return undefined;
        },
      });
    };
    for (var fnName in deprecatedAPIs) {
      if (deprecatedAPIs.hasOwnProperty(fnName)) {
        defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      }
    }
  }

  /**
 * Base class helpers for the updating state of a component.
 */
  function ReactPureComponent(props, context, updater) {
    // Duplicated from ReactComponent.
    this.props = props;
    this.context = context;
    this.refs = emptyObject_1;
    // We initialize the default updater but the real one gets injected by the
    // renderer.
    this.updater = updater || ReactNoopUpdateQueue_1;
  }

  function ComponentDummy() {}
  ComponentDummy.prototype = ReactComponent.prototype;
  var pureComponentPrototype = (ReactPureComponent.prototype = new ComponentDummy());
  pureComponentPrototype.constructor = ReactPureComponent;
  // Avoid an extra prototype jump for these methods.
  index(pureComponentPrototype, ReactComponent.prototype);
  pureComponentPrototype.isPureReactComponent = true;

  function ReactAsyncComponent(props, context, updater) {
    // Duplicated from ReactComponent.
    this.props = props;
    this.context = context;
    this.refs = emptyObject_1;
    // We initialize the default updater but the real one gets injected by the
    // renderer.
    this.updater = updater || ReactNoopUpdateQueue_1;
  }

  var asyncComponentPrototype = (ReactAsyncComponent.prototype = new ComponentDummy());
  asyncComponentPrototype.constructor = ReactAsyncComponent;
  // Avoid an extra prototype jump for these methods.
  index(asyncComponentPrototype, ReactComponent.prototype);
  asyncComponentPrototype.unstable_isAsyncReactComponent = true;
  asyncComponentPrototype.render = function() {
    return this.props.children;
  };

  var ReactBaseClasses = {
    Component: ReactComponent,
    PureComponent: ReactPureComponent,
    AsyncComponent: ReactAsyncComponent,
  };

  /**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCurrentOwner
 * 
 */

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
    current: null,
  };

  var ReactCurrentOwner_1 = ReactCurrentOwner;

  var hasOwnProperty$1 = Object.prototype.hasOwnProperty;

  {
    var warning$3 = warning_1;
  }

  // The Symbol used to tag the ReactElement type. If there is no native Symbol
  // nor polyfill, then a plain number is used for performance.
  var REACT_ELEMENT_TYPE$1 =
    (typeof Symbol === 'function' &&
      Symbol['for'] &&
      Symbol['for']('react.element')) ||
    0xeac7;

  var RESERVED_PROPS = {
    key: true,
    ref: true,
    __self: true,
    __source: true,
  };

  var specialPropKeyWarningShown;
  var specialPropRefWarningShown;

  function hasValidRef(config) {
    {
      if (hasOwnProperty$1.call(config, 'ref')) {
        var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
        if (getter && getter.isReactWarning) {
          return false;
        }
      }
    }
    return config.ref !== undefined;
  }

  function hasValidKey(config) {
    {
      if (hasOwnProperty$1.call(config, 'key')) {
        var getter = Object.getOwnPropertyDescriptor(config, 'key').get;
        if (getter && getter.isReactWarning) {
          return false;
        }
      }
    }
    return config.key !== undefined;
  }

  function defineKeyPropWarningGetter(props, displayName) {
    var warnAboutAccessingKey = function() {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;
        warning$3(
          false,
          '%s: `key` is not a prop. Trying to access it will result ' +
            'in `undefined` being returned. If you need to access the same ' +
            'value within the child component, you should pass it as a different ' +
            'prop. (https://fb.me/react-special-props)',
          displayName
        );
      }
    };
    warnAboutAccessingKey.isReactWarning = true;
    Object.defineProperty(props, 'key', {
      get: warnAboutAccessingKey,
      configurable: true,
    });
  }

  function defineRefPropWarningGetter(props, displayName) {
    var warnAboutAccessingRef = function() {
      if (!specialPropRefWarningShown) {
        specialPropRefWarningShown = true;
        warning$3(
          false,
          '%s: `ref` is not a prop. Trying to access it will result ' +
            'in `undefined` being returned. If you need to access the same ' +
            'value within the child component, you should pass it as a different ' +
            'prop. (https://fb.me/react-special-props)',
          displayName
        );
      }
    };
    warnAboutAccessingRef.isReactWarning = true;
    Object.defineProperty(props, 'ref', {
      get: warnAboutAccessingRef,
      configurable: true,
    });
  }

  /**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, no instanceof check
 * will work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} key
 * @param {string|object} ref
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @param {*} owner
 * @param {*} props
 * @internal
 */
  var ReactElement = function(type, key, ref, self, source, owner, props) {
    var element = {
      // This tag allow us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE$1,

      // Built-in properties that belong on the element
      type: type,
      key: key,
      ref: ref,
      props: props,

      // Record the component responsible for creating this element.
      _owner: owner,
    };

    {
      // The validation flag is currently mutative. We put it on
      // an external backing store so that we can freeze the whole object.
      // This can be replaced with a WeakMap once they are implemented in
      // commonly used development environments.
      element._store = {};

      // To make comparing ReactElements easier for testing purposes, we make
      // the validation flag non-enumerable (where possible, which should
      // include every environment we run tests in), so the test framework
      // ignores it.
      Object.defineProperty(element._store, 'validated', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: false,
      });
      // self and source are DEV only properties.
      Object.defineProperty(element, '_self', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: self,
      });
      // Two elements created in two different places should be considered
      // equal for testing purposes and therefore we hide it from enumeration.
      Object.defineProperty(element, '_source', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: source,
      });
      if (Object.freeze) {
        Object.freeze(element.props);
        Object.freeze(element);
      }
    }

    return element;
  };

  /**
 * Create and return a new ReactElement of the given type.
 * See https://facebook.github.io/react/docs/react-api.html#createelement
 */
  ReactElement.createElement = function(type, config, children) {
    var propName;

    // Reserved names are extracted
    var props = {};

    var key = null;
    var ref = null;
    var self = null;
    var source = null;

    if (config != null) {
      if (hasValidRef(config)) {
        ref = config.ref;
      }
      if (hasValidKey(config)) {
        key = '' + config.key;
      }

      self = config.__self === undefined ? null : config.__self;
      source = config.__source === undefined ? null : config.__source;
      // Remaining properties are added to a new props object
      for (propName in config) {
        if (
          hasOwnProperty$1.call(config, propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)
        ) {
          props[propName] = config[propName];
        }
      }
    }

    // Children can be more than one argument, and those are transferred onto
    // the newly allocated props object.
    var childrenLength = arguments.length - 2;
    if (childrenLength === 1) {
      props.children = children;
    } else if (childrenLength > 1) {
      var childArray = Array(childrenLength);
      for (var i = 0; i < childrenLength; i++) {
        childArray[i] = arguments[i + 2];
      }
      {
        if (Object.freeze) {
          Object.freeze(childArray);
        }
      }
      props.children = childArray;
    }

    // Resolve default props
    if (type && type.defaultProps) {
      var defaultProps = type.defaultProps;
      for (propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
        }
      }
    }
    {
      if (key || ref) {
        if (
          typeof props.$$typeof === 'undefined' ||
          props.$$typeof !== REACT_ELEMENT_TYPE$1
        ) {
          var displayName = typeof type === 'function'
            ? type.displayName || type.name || 'Unknown'
            : type;
          if (key) {
            defineKeyPropWarningGetter(props, displayName);
          }
          if (ref) {
            defineRefPropWarningGetter(props, displayName);
          }
        }
      }
    }
    return ReactElement(
      type,
      key,
      ref,
      self,
      source,
      ReactCurrentOwner_1.current,
      props
    );
  };

  /**
 * Return a function that produces ReactElements of a given type.
 * See https://facebook.github.io/react/docs/react-api.html#createfactory
 */
  ReactElement.createFactory = function(type) {
    var factory = ReactElement.createElement.bind(null, type);
    // Expose the type on the factory and the prototype so that it can be
    // easily accessed on elements. E.g. `<Foo />.type === Foo`.
    // This should not be named `constructor` since this may not be the function
    // that created the element, and it may not even be a constructor.
    // Legacy hook TODO: Warn if this is accessed
    factory.type = type;
    return factory;
  };

  ReactElement.cloneAndReplaceKey = function(oldElement, newKey) {
    var newElement = ReactElement(
      oldElement.type,
      newKey,
      oldElement.ref,
      oldElement._self,
      oldElement._source,
      oldElement._owner,
      oldElement.props
    );

    return newElement;
  };

  /**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://facebook.github.io/react/docs/react-api.html#cloneelement
 */
  ReactElement.cloneElement = function(element, config, children) {
    var propName;

    // Original props are copied
    var props = index({}, element.props);

    // Reserved names are extracted
    var key = element.key;
    var ref = element.ref;
    // Self is preserved since the owner is preserved.
    var self = element._self;
    // Source is preserved since cloneElement is unlikely to be targeted by a
    // transpiler, and the original source is probably a better indicator of the
    // true owner.
    var source = element._source;

    // Owner will be preserved, unless ref is overridden
    var owner = element._owner;

    if (config != null) {
      if (hasValidRef(config)) {
        // Silently steal the ref from the parent.
        ref = config.ref;
        owner = ReactCurrentOwner_1.current;
      }
      if (hasValidKey(config)) {
        key = '' + config.key;
      }

      // Remaining properties override existing props
      var defaultProps;
      if (element.type && element.type.defaultProps) {
        defaultProps = element.type.defaultProps;
      }
      for (propName in config) {
        if (
          hasOwnProperty$1.call(config, propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)
        ) {
          if (config[propName] === undefined && defaultProps !== undefined) {
            // Resolve default props
            props[propName] = defaultProps[propName];
          } else {
            props[propName] = config[propName];
          }
        }
      }
    }

    // Children can be more than one argument, and those are transferred onto
    // the newly allocated props object.
    var childrenLength = arguments.length - 2;
    if (childrenLength === 1) {
      props.children = children;
    } else if (childrenLength > 1) {
      var childArray = Array(childrenLength);
      for (var i = 0; i < childrenLength; i++) {
        childArray[i] = arguments[i + 2];
      }
      props.children = childArray;
    }

    return ReactElement(element.type, key, ref, self, source, owner, props);
  };

  /**
 * Verifies the object is a ReactElement.
 * See https://facebook.github.io/react/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a valid component.
 * @final
 */
  ReactElement.isValidElement = function(object) {
    return (
      typeof object === 'object' &&
      object !== null &&
      object.$$typeof === REACT_ELEMENT_TYPE$1
    );
  };

  var ReactElement_1 = ReactElement;

  /**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugCurrentFrame
 * 
 */

  var ReactDebugCurrentFrame = {};

  {
    // Component that is being worked on
    ReactDebugCurrentFrame.getCurrentStack = null;

    ReactDebugCurrentFrame.getStackAddendum = function() {
      var impl = ReactDebugCurrentFrame.getCurrentStack;
      if (impl) {
        return impl();
      }
      return null;
    };
  }

  var ReactDebugCurrentFrame_1 = ReactDebugCurrentFrame;

  {
    var warning$2 = warning_1;

    var _require = ReactDebugCurrentFrame_1,
      getStackAddendum = _require.getStackAddendum;
  }

  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.
  // The Symbol used to tag the ReactElement type. If there is no native Symbol
  // nor polyfill, then a plain number is used for performance.
  var REACT_ELEMENT_TYPE =
    (typeof Symbol === 'function' &&
      Symbol['for'] &&
      Symbol['for']('react.element')) ||
    0xeac7;

  var SEPARATOR = '.';
  var SUBSEPARATOR = ':';

  /**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */
  function escape(key) {
    var escapeRegex = /[=:]/g;
    var escaperLookup = {
      '=': '=0',
      ':': '=2',
    };
    var escapedString = ('' + key).replace(escapeRegex, function(match) {
      return escaperLookup[match];
    });

    return '$' + escapedString;
  }

  /**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */

  var didWarnAboutMaps = false;

  var userProvidedKeyEscapeRegex = /\/+/g;
  function escapeUserProvidedKey(text) {
    return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/');
  }

  var POOL_SIZE = 10;
  var traverseContextPool = [];
  function getPooledTraverseContext(
    mapResult,
    keyPrefix,
    mapFunction,
    mapContext
  ) {
    if (traverseContextPool.length) {
      var traverseContext = traverseContextPool.pop();
      traverseContext.result = mapResult;
      traverseContext.keyPrefix = keyPrefix;
      traverseContext.func = mapFunction;
      traverseContext.context = mapContext;
      traverseContext.count = 0;
      return traverseContext;
    } else {
      return {
        result: mapResult,
        keyPrefix: keyPrefix,
        func: mapFunction,
        context: mapContext,
        count: 0,
      };
    }
  }

  function releaseTraverseContext(traverseContext) {
    traverseContext.result = null;
    traverseContext.keyPrefix = null;
    traverseContext.func = null;
    traverseContext.context = null;
    traverseContext.count = 0;
    if (traverseContextPool.length < POOL_SIZE) {
      traverseContextPool.push(traverseContext);
    }
  }

  /**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
  function traverseAllChildrenImpl(
    children,
    nameSoFar,
    callback,
    traverseContext
  ) {
    var type = typeof children;

    if (type === 'undefined' || type === 'boolean') {
      // All of the above are perceived as null.
      children = null;
    }

    if (
      children === null ||
      type === 'string' ||
      type === 'number' ||
      // The following is inlined from ReactElement. This means we can optimize
      // some checks. React Fiber also inlines this logic for similar purposes.
      (type === 'object' && children.$$typeof === REACT_ELEMENT_TYPE)
    ) {
      callback(
        traverseContext,
        children,
        // If it's the only child, treat the name as if it was wrapped in an array
        // so that it's consistent if the number of children grows.
        nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar
      );
      return 1;
    }

    var child;
    var nextName;
    var subtreeCount = 0; // Count of children found in the current subtree.
    var nextNamePrefix = nameSoFar === ''
      ? SEPARATOR
      : nameSoFar + SUBSEPARATOR;

    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        child = children[i];
        nextName = nextNamePrefix + getComponentKey(child, i);
        subtreeCount += traverseAllChildrenImpl(
          child,
          nextName,
          callback,
          traverseContext
        );
      }
    } else {
      var iteratorFn =
        (ITERATOR_SYMBOL && children[ITERATOR_SYMBOL]) ||
        children[FAUX_ITERATOR_SYMBOL];
      if (typeof iteratorFn === 'function') {
        {
          // Warn about using Maps as children
          if (iteratorFn === children.entries) {
            warning$2(
              didWarnAboutMaps,
              'Using Maps as children is unsupported and will likely yield ' +
                'unexpected results. Convert it to a sequence/iterable of keyed ' +
                'ReactElements instead.%s',
              getStackAddendum()
            );
            didWarnAboutMaps = true;
          }
        }

        var iterator = iteratorFn.call(children);
        var step;
        var ii = 0;
        while (!(step = iterator.next()).done) {
          child = step.value;
          nextName = nextNamePrefix + getComponentKey(child, ii++);
          subtreeCount += traverseAllChildrenImpl(
            child,
            nextName,
            callback,
            traverseContext
          );
        }
      } else if (type === 'object') {
        var addendum = '';
        {
          addendum =
            ' If you meant to render a collection of children, use an array ' +
            'instead.' +
            getStackAddendum();
        }
        var childrenString = '' + children;
        invariant_1(
          false,
          'Objects are not valid as a React child (found: %s).%s',
          childrenString === '[object Object]'
            ? 'object with keys {' + Object.keys(children).join(', ') + '}'
            : childrenString,
          addendum
        );
      }
    }

    return subtreeCount;
  }

  /**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 * @return {!number} The number of children in this subtree.
 */
  function traverseAllChildren(children, callback, traverseContext) {
    if (children == null) {
      return 0;
    }

    return traverseAllChildrenImpl(children, '', callback, traverseContext);
  }

  /**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
  function getComponentKey(component, index) {
    // Do some typechecking here since we call this blindly. We want to ensure
    // that we don't block potential future ES APIs.
    if (
      typeof component === 'object' &&
      component !== null &&
      component.key != null
    ) {
      // Explicit key
      return escape(component.key);
    }
    // Implicit key determined by the index in the set
    return index.toString(36);
  }

  function forEachSingleChild(bookKeeping, child, name) {
    var func = bookKeeping.func, context = bookKeeping.context;

    func.call(context, child, bookKeeping.count++);
  }

  /**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/react-api.html#react.children.foreach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext Context for forEachContext.
 */
  function forEachChildren(children, forEachFunc, forEachContext) {
    if (children == null) {
      return children;
    }
    var traverseContext = getPooledTraverseContext(
      null,
      null,
      forEachFunc,
      forEachContext
    );
    traverseAllChildren(children, forEachSingleChild, traverseContext);
    releaseTraverseContext(traverseContext);
  }

  function mapSingleChildIntoContext(bookKeeping, child, childKey) {
    var result = bookKeeping.result,
      keyPrefix = bookKeeping.keyPrefix,
      func = bookKeeping.func,
      context = bookKeeping.context;

    var mappedChild = func.call(context, child, bookKeeping.count++);
    if (Array.isArray(mappedChild)) {
      mapIntoWithKeyPrefixInternal(
        mappedChild,
        result,
        childKey,
        emptyFunction_1.thatReturnsArgument
      );
    } else if (mappedChild != null) {
      if (ReactElement_1.isValidElement(mappedChild)) {
        mappedChild = ReactElement_1.cloneAndReplaceKey(
          mappedChild,
          // Keep both the (mapped) and old keys if they differ, just as
          // traverseAllChildren used to do for objects as children
          keyPrefix +
            (mappedChild.key && (!child || child.key !== mappedChild.key)
              ? escapeUserProvidedKey(mappedChild.key) + '/'
              : '') +
            childKey
        );
      }
      result.push(mappedChild);
    }
  }

  function mapIntoWithKeyPrefixInternal(
    children,
    array,
    prefix,
    func,
    context
  ) {
    var escapedPrefix = '';
    if (prefix != null) {
      escapedPrefix = escapeUserProvidedKey(prefix) + '/';
    }
    var traverseContext = getPooledTraverseContext(
      array,
      escapedPrefix,
      func,
      context
    );
    traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
    releaseTraverseContext(traverseContext);
  }

  /**
 * Maps children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/react-api.html#react.children.map
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} func The map function.
 * @param {*} context Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
  function mapChildren(children, func, context) {
    if (children == null) {
      return children;
    }
    var result = [];
    mapIntoWithKeyPrefixInternal(children, result, null, func, context);
    return result;
  }

  /**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * See https://facebook.github.io/react/docs/react-api.html#react.children.count
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */
  function countChildren(children, context) {
    return traverseAllChildren(children, emptyFunction_1.thatReturnsNull, null);
  }

  /**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://facebook.github.io/react/docs/react-api.html#react.children.toarray
 */
  function toArray(children) {
    var result = [];
    mapIntoWithKeyPrefixInternal(
      children,
      result,
      null,
      emptyFunction_1.thatReturnsArgument
    );
    return result;
  }

  var ReactChildren = {
    forEach: forEachChildren,
    map: mapChildren,
    count: countChildren,
    toArray: toArray,
  };

  var ReactChildren_1 = ReactChildren;

  /**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactVersion
 */

  var ReactVersion = '16.0.0-beta.5';

  /**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection.
 *
 * See https://facebook.github.io/react/docs/react-api.html#react.children.only
 *
 * The current implementation of this function assumes that a single child gets
 * passed without a wrapper, but the purpose of this helper function is to
 * abstract away the particular structure of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactElement} The first and only `ReactElement` contained in the
 * structure.
 */
  function onlyChild(children) {
    !ReactElement_1.isValidElement(children)
      ? invariant_1(
          false,
          'React.Children.only expected to receive a single React element child.'
        )
      : void 0;
    return children;
  }

  var onlyChild_1 = onlyChild;

  /**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

  var ReactPropTypesSecret$1 = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

  var ReactPropTypesSecret_1 = ReactPropTypesSecret$1;

  {
    var invariant$2 = invariant_1;
    var warning$5 = warning_1;
    var ReactPropTypesSecret = ReactPropTypesSecret_1;
    var loggedTypeFailures = {};
  }

  /**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?Function} getStack Returns the component stack.
 * @private
 */
  function checkPropTypes$1(
    typeSpecs,
    values,
    location,
    componentName,
    getStack
  ) {
    {
      for (var typeSpecName in typeSpecs) {
        if (typeSpecs.hasOwnProperty(typeSpecName)) {
          var error;
          // Prop type validation may throw. In case they do, we don't want to
          // fail the render phase where it didn't fail before. So we log it.
          // After these have been cleaned up, we'll let them throw.
          try {
            // This is intentionally an invariant that gets caught. It's the same
            // behavior as without this statement except with a better message.
            invariant$2(
              typeof typeSpecs[typeSpecName] === 'function',
              '%s: %s type `%s` is invalid; it must be a function, usually from ' +
                'React.PropTypes.',
              componentName || 'React class',
              location,
              typeSpecName
            );
            error = typeSpecs[typeSpecName](
              values,
              typeSpecName,
              componentName,
              location,
              null,
              ReactPropTypesSecret
            );
          } catch (ex) {
            error = ex;
          }
          warning$5(
            !error || error instanceof Error,
            '%s: type specification of %s `%s` is invalid; the type checker ' +
              'function must return `null` or an `Error` but returned a %s. ' +
              'You may have forgotten to pass an argument to the type checker ' +
              'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
              'shape all require an argument).',
            componentName || 'React class',
            location,
            typeSpecName,
            typeof error
          );
          if (
            error instanceof Error &&
            !(error.message in loggedTypeFailures)
          ) {
            // Only monitor this failure once because there tends to be a lot of the
            // same error.
            loggedTypeFailures[error.message] = true;

            var stack = getStack ? getStack() : '';

            warning$5(
              false,
              'Failed %s type: %s%s',
              location,
              error.message,
              stack != null ? stack : ''
            );
          }
        }
      }
    }
  }

  var checkPropTypes_1 = checkPropTypes$1;

  /**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @providesModule describeComponentFrame
 */

  var describeComponentFrame$1 = function(name, source, ownerName) {
    return (
      '\n    in ' +
      (name || 'Unknown') +
      (source
        ? ' (at ' +
            source.fileName.replace(/^.*[\\\/]/, '') +
            ':' +
            source.lineNumber +
            ')'
        : ownerName ? ' (created by ' + ownerName + ')' : '')
    );
  };

  /**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getComponentName
 * 
 */

  function getComponentName$1(instanceOrFiber) {
    if (typeof instanceOrFiber.getName === 'function') {
      // Stack reconciler
      var instance = instanceOrFiber;
      return instance.getName();
    }
    if (typeof instanceOrFiber.tag === 'number') {
      // Fiber reconciler
      var fiber = instanceOrFiber;
      var type = fiber.type;

      if (typeof type === 'string') {
        return type;
      }
      if (typeof type === 'function') {
        return type.displayName || type.name;
      }
    }
    return null;
  }

  var getComponentName_1 = getComponentName$1;

  {
    var checkPropTypes = checkPropTypes_1;
    var lowPriorityWarning$1 = lowPriorityWarning_1;
    var ReactDebugCurrentFrame$1 = ReactDebugCurrentFrame_1;
    var warning$4 = warning_1;
    var describeComponentFrame = describeComponentFrame$1;
    var getComponentName = getComponentName_1;

    var currentlyValidatingElement = null;

    var getDisplayName = function(element) {
      if (element == null) {
        return '#empty';
      } else if (typeof element === 'string' || typeof element === 'number') {
        return '#text';
      } else if (typeof element.type === 'string') {
        return element.type;
      } else {
        return element.type.displayName || element.type.name || 'Unknown';
      }
    };

    var getStackAddendum$1 = function() {
      var stack = '';
      if (currentlyValidatingElement) {
        var name = getDisplayName(currentlyValidatingElement);
        var owner = currentlyValidatingElement._owner;
        stack += describeComponentFrame(
          name,
          currentlyValidatingElement._source,
          owner && getComponentName(owner)
        );
      }
      stack += ReactDebugCurrentFrame$1.getStackAddendum() || '';
      return stack;
    };
  }

  var ITERATOR_SYMBOL$1 = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL$1 = '@@iterator'; // Before Symbol spec.

  function getDeclarationErrorAddendum() {
    if (ReactCurrentOwner_1.current) {
      var name = getComponentName(ReactCurrentOwner_1.current);
      if (name) {
        return '\n\nCheck the render method of `' + name + '`.';
      }
    }
    return '';
  }

  function getSourceInfoErrorAddendum(elementProps) {
    if (
      elementProps !== null &&
      elementProps !== undefined &&
      elementProps.__source !== undefined
    ) {
      var source = elementProps.__source;
      var fileName = source.fileName.replace(/^.*[\\\/]/, '');
      var lineNumber = source.lineNumber;
      return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
    }
    return '';
  }

  /**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
  var ownerHasKeyUseWarning = {};

  function getCurrentComponentErrorInfo(parentType) {
    var info = getDeclarationErrorAddendum();

    if (!info) {
      var parentName = typeof parentType === 'string'
        ? parentType
        : parentType.displayName || parentType.name;
      if (parentName) {
        info =
          '\n\nCheck the top-level render call using <' + parentName + '>.';
      }
    }
    return info;
  }

  /**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */
  function validateExplicitKey(element, parentType) {
    if (!element._store || element._store.validated || element.key != null) {
      return;
    }
    element._store.validated = true;

    var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
      return;
    }
    ownerHasKeyUseWarning[currentComponentErrorInfo] = true;

    // Usually the current owner is the offender, but if it accepts children as a
    // property, it may be the creator of the child that's responsible for
    // assigning it a key.
    var childOwner = '';
    if (
      element &&
      element._owner &&
      element._owner !== ReactCurrentOwner_1.current
    ) {
      // Give the component that originally created this child.
      childOwner =
        ' It was passed a child from ' + getComponentName(element._owner) + '.';
    }

    currentlyValidatingElement = element;
    {
      warning$4(
        false,
        'Each child in an array or iterator should have a unique "key" prop.' +
          '%s%s See https://fb.me/react-warning-keys for more information.%s',
        currentComponentErrorInfo,
        childOwner,
        getStackAddendum$1()
      );
    }
    currentlyValidatingElement = null;
  }

  /**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */
  function validateChildKeys(node, parentType) {
    if (typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        var child = node[i];
        if (ReactElement_1.isValidElement(child)) {
          validateExplicitKey(child, parentType);
        }
      }
    } else if (ReactElement_1.isValidElement(node)) {
      // This element was passed in a valid location.
      if (node._store) {
        node._store.validated = true;
      }
    } else if (node) {
      var iteratorFn =
        (ITERATOR_SYMBOL$1 && node[ITERATOR_SYMBOL$1]) ||
        node[FAUX_ITERATOR_SYMBOL$1];
      if (typeof iteratorFn === 'function') {
        // Entry iterators used to provide implicit keys,
        // but now we print a separate warning for them later.
        if (iteratorFn !== node.entries) {
          var iterator = iteratorFn.call(node);
          var step;
          while (!(step = iterator.next()).done) {
            if (ReactElement_1.isValidElement(step.value)) {
              validateExplicitKey(step.value, parentType);
            }
          }
        }
      }
    }
  }

  /**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */
  function validatePropTypes(element) {
    var componentClass = element.type;
    if (typeof componentClass !== 'function') {
      return;
    }
    var name = componentClass.displayName || componentClass.name;

    // ReactNative `View.propTypes` have been deprecated in favor of `ViewPropTypes`.
    // In their place a temporary getter has been added with a deprecated warning message.
    // Avoid triggering that warning during validation using the temporary workaround,
    // __propTypesSecretDontUseThesePlease.
    // TODO (bvaughn) Revert this particular change any time after April 1 ReactNative tag.
    var propTypes = typeof componentClass.__propTypesSecretDontUseThesePlease ===
      'object'
      ? componentClass.__propTypesSecretDontUseThesePlease
      : componentClass.propTypes;

    if (propTypes) {
      currentlyValidatingElement = element;
      checkPropTypes(
        propTypes,
        element.props,
        'prop',
        name,
        getStackAddendum$1
      );
      currentlyValidatingElement = null;
    }
    if (typeof componentClass.getDefaultProps === 'function') {
      warning$4(
        componentClass.getDefaultProps.isReactClassApproved,
        'getDefaultProps is only used on classic React.createClass ' +
          'definitions. Use a static property named `defaultProps` instead.'
      );
    }
  }

  var ReactElementValidator$1 = {
    createElement: function(type, props, children) {
      var validType = typeof type === 'string' || typeof type === 'function';
      // We warn in this case but don't throw. We expect the element creation to
      // succeed and there will likely be errors in render.
      if (!validType) {
        var info = '';
        if (
          type === undefined ||
          (typeof type === 'object' &&
            type !== null &&
            Object.keys(type).length === 0)
        ) {
          info +=
            ' You likely forgot to export your component from the file ' +
            "it's defined in.";
        }

        var sourceInfo = getSourceInfoErrorAddendum(props);
        if (sourceInfo) {
          info += sourceInfo;
        } else {
          info += getDeclarationErrorAddendum();
        }

        info += ReactDebugCurrentFrame$1.getStackAddendum() || '';

        warning$4(
          false,
          'React.createElement: type is invalid -- expected a string (for ' +
            'built-in components) or a class/function (for composite ' +
            'components) but got: %s.%s',
          type == null ? type : typeof type,
          info
        );
      }

      var element = ReactElement_1.createElement.apply(this, arguments);

      // The result can be nullish if a mock or a custom function is used.
      // TODO: Drop this when these are no longer allowed as the type argument.
      if (element == null) {
        return element;
      }

      // Skip key warning if the type isn't valid since our key validation logic
      // doesn't expect a non-string/function type and can throw confusing errors.
      // We don't want exception behavior to differ between dev and prod.
      // (Rendering will throw with a helpful message and as soon as the type is
      // fixed, the key warnings will appear.)
      if (validType) {
        for (var i = 2; i < arguments.length; i++) {
          validateChildKeys(arguments[i], type);
        }
      }

      validatePropTypes(element);

      return element;
    },

    createFactory: function(type) {
      var validatedFactory = ReactElementValidator$1.createElement.bind(
        null,
        type
      );
      // Legacy hook TODO: Warn if this is accessed
      validatedFactory.type = type;

      {
        Object.defineProperty(validatedFactory, 'type', {
          enumerable: false,
          get: function() {
            lowPriorityWarning$1(
              false,
              'Factory.type is deprecated. Access the class directly ' +
                'before passing it to createFactory.'
            );
            Object.defineProperty(this, 'type', {
              value: type,
            });
            return type;
          },
        });
      }

      return validatedFactory;
    },

    cloneElement: function(element, props, children) {
      var newElement = ReactElement_1.cloneElement.apply(this, arguments);
      for (var i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], newElement.type);
      }
      validatePropTypes(newElement);
      return newElement;
    },
  };

  var ReactElementValidator_1 = ReactElementValidator$1;

  {
    var warning$6 = warning_1;
  }

  function isNative(fn) {
    // Based on isNative() from Lodash
    var funcToString = Function.prototype.toString;
    var reIsNative = RegExp(
      '^' +
        funcToString
          // Take an example native function source for comparison
          .call(Object.prototype.hasOwnProperty)
          // Strip regex characters so we can use it for regex
          .replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
          // Remove hasOwnProperty from the template to make it generic
          .replace(
            /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
            '$1.*?'
          ) +
        '$'
    );
    try {
      var source = funcToString.call(fn);
      return reIsNative.test(source);
    } catch (err) {
      return false;
    }
  }

  var canUseCollections =
    // Array.from
    typeof Array.from === 'function' &&
    // Map
    typeof Map === 'function' &&
    isNative(Map) &&
    // Map.prototype.keys
    Map.prototype != null &&
    typeof Map.prototype.keys === 'function' &&
    isNative(Map.prototype.keys) &&
    // Set
    typeof Set === 'function' &&
    isNative(Set) &&
    // Set.prototype.keys
    Set.prototype != null &&
    typeof Set.prototype.keys === 'function' &&
    isNative(Set.prototype.keys);

  var setItem;
  var getItem;
  var removeItem;
  var getItemIDs;
  var addRoot;
  var removeRoot;
  var getRootIDs;

  if (canUseCollections) {
    var itemMap = new Map();
    var rootIDSet = new Set();

    setItem = function(id, item) {
      itemMap.set(id, item);
    };
    getItem = function(id) {
      return itemMap.get(id);
    };
    removeItem = function(id) {
      itemMap['delete'](id);
    };
    getItemIDs = function() {
      return Array.from(itemMap.keys());
    };

    addRoot = function(id) {
      rootIDSet.add(id);
    };
    removeRoot = function(id) {
      rootIDSet['delete'](id);
    };
    getRootIDs = function() {
      return Array.from(rootIDSet.keys());
    };
  } else {
    var itemByKey = {};
    var rootByKey = {};

    // Use non-numeric keys to prevent V8 performance issues:
    // https://github.com/facebook/react/pull/7232
    var getKeyFromID = function(id) {
      return '.' + id;
    };
    var getIDFromKey = function(key) {
      return parseInt(key.substr(1), 10);
    };

    setItem = function(id, item) {
      var key = getKeyFromID(id);
      itemByKey[key] = item;
    };
    getItem = function(id) {
      var key = getKeyFromID(id);
      return itemByKey[key];
    };
    removeItem = function(id) {
      var key = getKeyFromID(id);
      delete itemByKey[key];
    };
    getItemIDs = function() {
      return Object.keys(itemByKey).map(getIDFromKey);
    };

    addRoot = function(id) {
      var key = getKeyFromID(id);
      rootByKey[key] = true;
    };
    removeRoot = function(id) {
      var key = getKeyFromID(id);
      delete rootByKey[key];
    };
    getRootIDs = function() {
      return Object.keys(rootByKey).map(getIDFromKey);
    };
  }

  var unmountedIDs = [];

  function purgeDeep(id) {
    var item = getItem(id);
    if (item) {
      var childIDs = item.childIDs;

      removeItem(id);
      childIDs.forEach(purgeDeep);
    }
  }

  function getDisplayName$1(element) {
    if (element == null) {
      return '#empty';
    } else if (typeof element === 'string' || typeof element === 'number') {
      return '#text';
    } else if (typeof element.type === 'string') {
      return element.type;
    } else {
      return element.type.displayName || element.type.name || 'Unknown';
    }
  }

  function describeID(id) {
    var name = ReactComponentTreeHook.getDisplayName(id);
    var element = ReactComponentTreeHook.getElement(id);
    var ownerID = ReactComponentTreeHook.getOwnerID(id);
    var ownerName = void 0;

    if (ownerID) {
      ownerName = ReactComponentTreeHook.getDisplayName(ownerID);
    }
    warning$6(
      element,
      'ReactComponentTreeHook: Missing React element for debugID %s when ' +
        'building stack',
      id
    );
    return describeComponentFrame$1(
      name || '',
      element && element._source,
      ownerName || ''
    );
  }

  var ReactComponentTreeHook = {
    onSetChildren: function(id, nextChildIDs) {
      var item = getItem(id);
      !item ? invariant_1(false, 'Item must have been set') : void 0;
      item.childIDs = nextChildIDs;

      for (var i = 0; i < nextChildIDs.length; i++) {
        var nextChildID = nextChildIDs[i];
        var nextChild = getItem(nextChildID);
        !nextChild
          ? invariant_1(
              false,
              'Expected hook events to fire for the child before its parent includes it in onSetChildren().'
            )
          : void 0;
        !(nextChild.childIDs != null ||
          typeof nextChild.element !== 'object' ||
          nextChild.element == null)
          ? invariant_1(
              false,
              'Expected onSetChildren() to fire for a container child before its parent includes it in onSetChildren().'
            )
          : void 0;
        !nextChild.isMounted
          ? invariant_1(
              false,
              'Expected onMountComponent() to fire for the child before its parent includes it in onSetChildren().'
            )
          : void 0;
        if (nextChild.parentID == null) {
          nextChild.parentID = id;
          // TODO: This shouldn't be necessary but mounting a new root during in
          // componentWillMount currently causes not-yet-mounted components to
          // be purged from our tree data so their parent id is missing.
        }
        !(nextChild.parentID === id)
          ? invariant_1(
              false,
              'Expected onBeforeMountComponent() parent and onSetChildren() to be consistent (%s has parents %s and %s).',
              nextChildID,
              nextChild.parentID,
              id
            )
          : void 0;
      }
    },
    onBeforeMountComponent: function(id, element, parentID) {
      var item = {
        element: element,
        parentID: parentID,
        text: null,
        childIDs: [],
        isMounted: false,
        updateCount: 0,
      };
      setItem(id, item);
    },
    onBeforeUpdateComponent: function(id, element) {
      var item = getItem(id);
      if (!item || !item.isMounted) {
        // We may end up here as a result of setState() in componentWillUnmount().
        // In this case, ignore the element.
        return;
      }
      item.element = element;
    },
    onMountComponent: function(id) {
      var item = getItem(id);
      !item ? invariant_1(false, 'Item must have been set') : void 0;
      item.isMounted = true;
      var isRoot = item.parentID === 0;
      if (isRoot) {
        addRoot(id);
      }
    },
    onUpdateComponent: function(id) {
      var item = getItem(id);
      if (!item || !item.isMounted) {
        // We may end up here as a result of setState() in componentWillUnmount().
        // In this case, ignore the element.
        return;
      }
      item.updateCount++;
    },
    onUnmountComponent: function(id) {
      var item = getItem(id);
      if (item) {
        // We need to check if it exists.
        // `item` might not exist if it is inside an error boundary, and a sibling
        // error boundary child threw while mounting. Then this instance never
        // got a chance to mount, but it still gets an unmounting event during
        // the error boundary cleanup.
        item.isMounted = false;
        var isRoot = item.parentID === 0;
        if (isRoot) {
          removeRoot(id);
        }
      }
      unmountedIDs.push(id);
    },
    purgeUnmountedComponents: function() {
      if (ReactComponentTreeHook._preventPurging) {
        // Should only be used for testing.
        return;
      }

      for (var i = 0; i < unmountedIDs.length; i++) {
        var id = unmountedIDs[i];
        purgeDeep(id);
      }
      unmountedIDs.length = 0;
    },
    isMounted: function(id) {
      var item = getItem(id);
      return item ? item.isMounted : false;
    },
    getCurrentStackAddendum: function() {
      var info = '';
      var currentOwner = ReactCurrentOwner_1.current;
      if (currentOwner) {
        !(typeof currentOwner.tag !== 'number')
          ? invariant_1(
              false,
              'Fiber owners should not show up in Stack stack traces.'
            )
          : void 0;
        if (typeof currentOwner._debugID === 'number') {
          info += ReactComponentTreeHook.getStackAddendumByID(
            currentOwner._debugID
          );
        }
      }
      return info;
    },
    getStackAddendumByID: function(id) {
      var info = '';
      while (id) {
        info += describeID(id);
        id = ReactComponentTreeHook.getParentID(id);
      }
      return info;
    },
    getChildIDs: function(id) {
      var item = getItem(id);
      return item ? item.childIDs : [];
    },
    getDisplayName: function(id) {
      var element = ReactComponentTreeHook.getElement(id);
      if (!element) {
        return null;
      }
      return getDisplayName$1(element);
    },
    getElement: function(id) {
      var item = getItem(id);
      return item ? item.element : null;
    },
    getOwnerID: function(id) {
      var element = ReactComponentTreeHook.getElement(id);
      if (!element || !element._owner) {
        return null;
      }
      return element._owner._debugID;
    },
    getParentID: function(id) {
      var item = getItem(id);
      return item ? item.parentID : null;
    },
    getSource: function(id) {
      var item = getItem(id);
      var element = item ? item.element : null;
      var source = element != null ? element._source : null;
      return source;
    },
    getText: function(id) {
      var element = ReactComponentTreeHook.getElement(id);
      if (typeof element === 'string') {
        return element;
      } else if (typeof element === 'number') {
        return '' + element;
      } else {
        return null;
      }
    },
    getUpdateCount: function(id) {
      var item = getItem(id);
      return item ? item.updateCount : 0;
    },

    getRootIDs: getRootIDs,
    getRegisteredIDs: getItemIDs,
  };

  var ReactComponentTreeHook_1 = ReactComponentTreeHook;

  var createElement = ReactElement_1.createElement;
  var createFactory = ReactElement_1.createFactory;
  var cloneElement = ReactElement_1.cloneElement;

  {
    var ReactElementValidator = ReactElementValidator_1;
    createElement = ReactElementValidator.createElement;
    createFactory = ReactElementValidator.createFactory;
    cloneElement = ReactElementValidator.cloneElement;
  }

  var React = {
    Children: {
      map: ReactChildren_1.map,
      forEach: ReactChildren_1.forEach,
      count: ReactChildren_1.count,
      toArray: ReactChildren_1.toArray,
      only: onlyChild_1,
    },

    Component: ReactBaseClasses.Component,
    PureComponent: ReactBaseClasses.PureComponent,
    unstable_AsyncComponent: ReactBaseClasses.AsyncComponent,

    createElement: createElement,
    cloneElement: cloneElement,
    isValidElement: ReactElement_1.isValidElement,

    createFactory: createFactory,

    version: ReactVersion,

    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
      ReactCurrentOwner: ReactCurrentOwner_1,
    },
  };

  {
    index(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
      // These should not be included in production.
      ReactComponentTreeHook: ReactComponentTreeHook_1,
      ReactDebugCurrentFrame: ReactDebugCurrentFrame_1,
    });
  }

  var ReactEntry = React;

  return ReactEntry;
});
