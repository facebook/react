/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

'use strict';

if (__DEV__) {
  (function() {

          'use strict';

/* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart ===
    'function'
) {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
}
          "use strict";

var ReactVersion = "18.3.0-www-classic-cb1620118-20230127";

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
var REACT_ELEMENT_TYPE = Symbol.for("react.element");
var REACT_PORTAL_TYPE = Symbol.for("react.portal");
var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
var REACT_CONTEXT_TYPE = Symbol.for("react.context");
var REACT_SERVER_CONTEXT_TYPE = Symbol.for("react.server_context");
var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
var REACT_MEMO_TYPE = Symbol.for("react.memo");
var REACT_LAZY_TYPE = Symbol.for("react.lazy");
var REACT_SCOPE_TYPE = Symbol.for("react.scope");
var REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode");
var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
var REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden");
var REACT_CACHE_TYPE = Symbol.for("react.cache");
var REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker");
var REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for(
  "react.default_value"
);
var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = "@@iterator";
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== "object") {
    return null;
  }

  var maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];

  if (typeof maybeIterator === "function") {
    return maybeIterator;
  }

  return null;
}

// This refers to a WWW module.
var warningWWW = require("warning");
function warn(format) {
  {
    {
      for (
        var _len = arguments.length,
          args = new Array(_len > 1 ? _len - 1 : 0),
          _key = 1;
        _key < _len;
        _key++
      ) {
        args[_key - 1] = arguments[_key];
      }

      printWarning("warn", format, args);
    }
  }
}
function error(format) {
  {
    {
      for (
        var _len2 = arguments.length,
          args = new Array(_len2 > 1 ? _len2 - 1 : 0),
          _key2 = 1;
        _key2 < _len2;
        _key2++
      ) {
        args[_key2 - 1] = arguments[_key2];
      }

      printWarning("error", format, args);
    }
  }
}

function printWarning(level, format, args) {
  {
    var React = require("react");

    var ReactSharedInternals =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED; // Defensive in case this is fired before React is initialized.

    if (ReactSharedInternals != null) {
      var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
      var stack = ReactDebugCurrentFrame.getStackAddendum();

      if (stack !== "") {
        format += "%s";
        args.push(stack);
      }
    } // TODO: don't ignore level and pass it down somewhere too.

    args.unshift(format);
    args.unshift(false);
    warningWWW.apply(null, args);
  }
}

var didWarnStateUpdateForUnmountedComponent = {};

function warnNoop(publicInstance, callerName) {
  {
    var _constructor = publicInstance.constructor;
    var componentName =
      (_constructor && (_constructor.displayName || _constructor.name)) ||
      "ReactClass";
    var warningKey = componentName + "." + callerName;

    if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
      return;
    }

    error(
      "Can't call %s on a component that is not yet mounted. " +
        "This is a no-op, but it might indicate a bug in your application. " +
        "Instead, assign to `this.state` directly or define a `state = {};` " +
        "class property with the desired state in the %s component.",
      callerName,
      componentName
    );

    didWarnStateUpdateForUnmountedComponent[warningKey] = true;
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
    warnNoop(publicInstance, "forceUpdate");
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
    warnNoop(publicInstance, "replaceState");
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
    warnNoop(publicInstance, "setState");
  }
};

var assign = Object.assign;

var emptyObject = {};

{
  Object.freeze(emptyObject);
}
/**
 * Base class helpers for the updating state of a component.
 */

function Component(props, context, updater) {
  this.props = props;
  this.context = context; // If a component has string refs, we will assign a different object later.

  this.refs = emptyObject; // We initialize the default updater but the real one gets injected by the
  // renderer.

  this.updater = updater || ReactNoopUpdateQueue;
}

Component.prototype.isReactComponent = {};
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

Component.prototype.setState = function(partialState, callback) {
  if (
    typeof partialState !== "object" &&
    typeof partialState !== "function" &&
    partialState != null
  ) {
    throw new Error(
      "setState(...): takes an object of state variables to update or a " +
        "function which returns an object of state variables."
    );
  }

  this.updater.enqueueSetState(this, partialState, callback, "setState");
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

Component.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
};
/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */

{
  var deprecatedAPIs = {
    isMounted: [
      "isMounted",
      "Instead, make sure to clean up subscriptions and pending requests in " +
        "componentWillUnmount to prevent memory leaks."
    ],
    replaceState: [
      "replaceState",
      "Refactor your code to use setState instead (see " +
        "https://github.com/facebook/react/issues/3236)."
    ]
  };

  var defineDeprecationWarning = function(methodName, info) {
    Object.defineProperty(Component.prototype, methodName, {
      get: function() {
        warn(
          "%s(...) is deprecated in plain JavaScript React classes. %s",
          info[0],
          info[1]
        );

        return undefined;
      }
    });
  };

  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

function ComponentDummy() {}

ComponentDummy.prototype = Component.prototype;
/**
 * Convenience component with default shallow equality check for sCU.
 */

function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context; // If a component has string refs, we will assign a different object later.

  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

var pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent; // Avoid an extra prototype jump for these methods.

assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;

// an immutable object with a single mutable value
function createRef() {
  var refObject = {
    current: null
  };

  {
    Object.seal(refObject);
  }

  return refObject;
}

var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

function isArray(a) {
  return isArrayImpl(a);
}

/*
 * The `'' + value` pattern (used in perf-sensitive code) throws for Symbol
 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
 *
 * The functions in this module will throw an easier-to-understand,
 * easier-to-debug exception with a clear errors message message explaining the
 * problem. (Instead of a confusing exception thrown inside the implementation
 * of the `value` object).
 */
// $FlowFixMe only called in DEV, so void return is not possible.
function typeName(value) {
  {
    // toStringTag is needed for namespaced types like Temporal.Instant
    var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
    var type =
      (hasToStringTag && value[Symbol.toStringTag]) ||
      value.constructor.name ||
      "Object"; // $FlowFixMe

    return type;
  }
} // $FlowFixMe only called in DEV, so void return is not possible.

function willCoercionThrow(value) {
  {
    try {
      testStringCoercion(value);
      return false;
    } catch (e) {
      return true;
    }
  }
}

function testStringCoercion(value) {
  // If you ended up here by following an exception call stack, here's what's
  // happened: you supplied an object or symbol value to React (as a prop, key,
  // DOM attribute, CSS property, string ref, etc.) and when React tried to
  // coerce it to a string using `'' + value`, an exception was thrown.
  //
  // The most common types that will cause this exception are `Symbol` instances
  // and Temporal objects like `Temporal.Instant`. But any object that has a
  // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
  // exception. (Library authors do this to prevent users from using built-in
  // numeric operators like `+` or comparison operators like `>=` because custom
  // methods are needed to perform accurate arithmetic or comparison.)
  //
  // To fix the problem, coerce this object or symbol value to a string before
  // passing it to React. The most reliable way is usually `String(value)`.
  //
  // To find which value is throwing, check the browser or debugger console.
  // Before this exception was thrown, there should be `console.error` output
  // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
  // problem and how that type was used: key, atrribute, input value prop, etc.
  // In most cases, this console output also shows the component and its
  // ancestor components where the exception happened.
  //
  // eslint-disable-next-line react-internal/safe-string-coercion
  return "" + value;
}
function checkKeyStringCoercion(value) {
  {
    if (willCoercionThrow(value)) {
      error(
        "The provided key is an unsupported type %s." +
          " This value must be coerced to a string before before using it here.",
        typeName(value)
      );

      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
    }
  }
}

// Re-export dynamic flags from the www version.
var dynamicFeatureFlags = require("ReactFeatureFlags");

var disableInputAttributeSyncing =
    dynamicFeatureFlags.disableInputAttributeSyncing,
  disableSchedulerTimeoutBasedOnReactExpirationTime =
    dynamicFeatureFlags.disableSchedulerTimeoutBasedOnReactExpirationTime,
  warnAboutSpreadingKeyToJSX = dynamicFeatureFlags.warnAboutSpreadingKeyToJSX,
  replayFailedUnitOfWorkWithInvokeGuardedCallback =
    dynamicFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback,
  enableFilterEmptyStringAttributesDOM =
    dynamicFeatureFlags.enableFilterEmptyStringAttributesDOM,
  enableLegacyFBSupport = dynamicFeatureFlags.enableLegacyFBSupport,
  deferRenderPhaseUpdateToNextBatch =
    dynamicFeatureFlags.deferRenderPhaseUpdateToNextBatch,
  enableDebugTracing = dynamicFeatureFlags.enableDebugTracing,
  skipUnmountedBoundaries = dynamicFeatureFlags.skipUnmountedBoundaries,
  enableUseRefAccessWarning = dynamicFeatureFlags.enableUseRefAccessWarning,
  disableNativeComponentFrames =
    dynamicFeatureFlags.disableNativeComponentFrames,
  disableSchedulerTimeoutInWorkLoop =
    dynamicFeatureFlags.disableSchedulerTimeoutInWorkLoop,
  enableLazyContextPropagation =
    dynamicFeatureFlags.enableLazyContextPropagation,
  enableSyncDefaultUpdates = dynamicFeatureFlags.enableSyncDefaultUpdates,
  enableUnifiedSyncLane = dynamicFeatureFlags.enableUnifiedSyncLane,
  enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay =
    dynamicFeatureFlags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
  enableTransitionTracing = dynamicFeatureFlags.enableTransitionTracing; // On WWW, false is used for a new modern build.
var enableProfilerNestedUpdateScheduledHook =
  dynamicFeatureFlags.enableProfilerNestedUpdateScheduledHook;

var enableSchedulingProfiler = dynamicFeatureFlags.enableSchedulingProfiler; // Note: we'll want to remove this when we to userland implementation.

function getWrappedName(outerType, innerType, wrapperName) {
  var displayName = outerType.displayName;

  if (displayName) {
    return displayName;
  }

  var functionName = innerType.displayName || innerType.name || "";
  return functionName !== ""
    ? wrapperName + "(" + functionName + ")"
    : wrapperName;
} // Keep in sync with react-reconciler/getComponentNameFromFiber

function getContextName(type) {
  return type.displayName || "Context";
} // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.

function getComponentNameFromType(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }

  {
    if (typeof type.tag === "number") {
      error(
        "Received an unexpected object in getComponentNameFromType(). " +
          "This is likely a bug in React. Please file an issue."
      );
    }
  }

  if (typeof type === "function") {
    return type.displayName || type.name || null;
  }

  if (typeof type === "string") {
    return type;
  }

  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return "Fragment";

    case REACT_PORTAL_TYPE:
      return "Portal";

    case REACT_PROFILER_TYPE:
      return "Profiler";

    case REACT_STRICT_MODE_TYPE:
      return "StrictMode";

    case REACT_SUSPENSE_TYPE:
      return "Suspense";

    case REACT_SUSPENSE_LIST_TYPE:
      return "SuspenseList";

    case REACT_CACHE_TYPE: {
      return "Cache";
    }

    // eslint-disable-next-line no-fallthrough

    case REACT_TRACING_MARKER_TYPE:
      if (enableTransitionTracing) {
        return "TracingMarker";
      }
  }

  if (typeof type === "object") {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        var context = type;
        return getContextName(context) + ".Consumer";

      case REACT_PROVIDER_TYPE:
        var provider = type;
        return getContextName(provider._context) + ".Provider";

      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, "ForwardRef");

      case REACT_MEMO_TYPE:
        var outerName = type.displayName || null;

        if (outerName !== null) {
          return outerName;
        }

        return getComponentNameFromType(type.type) || "Memo";

      case REACT_LAZY_TYPE: {
        var lazyComponent = type;
        var payload = lazyComponent._payload;
        var init = lazyComponent._init;

        try {
          return getComponentNameFromType(init(payload));
        } catch (x) {
          return null;
        }
      }

      case REACT_SERVER_CONTEXT_TYPE: {
        var context2 = type;
        return (context2.displayName || context2._globalName) + ".Provider";
      }

      // eslint-disable-next-line no-fallthrough
    }
  }

  return null;
}

// $FlowFixMe[method-unbinding]
var hasOwnProperty = Object.prototype.hasOwnProperty;

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

var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};
var specialPropKeyWarningShown,
  specialPropRefWarningShown,
  didWarnAboutStringRefs;

{
  didWarnAboutStringRefs = {};
}

function hasValidRef(config) {
  {
    if (hasOwnProperty.call(config, "ref")) {
      var getter = Object.getOwnPropertyDescriptor(config, "ref").get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.ref !== undefined;
}

function hasValidKey(config) {
  {
    if (hasOwnProperty.call(config, "key")) {
      var getter = Object.getOwnPropertyDescriptor(config, "key").get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.key !== undefined;
}

function defineKeyPropWarningGetter(props, displayName) {
  var warnAboutAccessingKey = function() {
    {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;

        error(
          "%s: `key` is not a prop. Trying to access it will result " +
            "in `undefined` being returned. If you need to access the same " +
            "value within the child component, you should pass it as a different " +
            "prop. (https://reactjs.org/link/special-props)",
          displayName
        );
      }
    }
  };

  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, "key", {
    get: warnAboutAccessingKey,
    configurable: true
  });
}

function defineRefPropWarningGetter(props, displayName) {
  var warnAboutAccessingRef = function() {
    {
      if (!specialPropRefWarningShown) {
        specialPropRefWarningShown = true;

        error(
          "%s: `ref` is not a prop. Trying to access it will result " +
            "in `undefined` being returned. If you need to access the same " +
            "value within the child component, you should pass it as a different " +
            "prop. (https://reactjs.org/link/special-props)",
          displayName
        );
      }
    }
  };

  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, "ref", {
    get: warnAboutAccessingRef,
    configurable: true
  });
}

function warnIfStringRefCannotBeAutoConverted(config) {
  {
    if (
      typeof config.ref === "string" &&
      ReactCurrentOwner.current &&
      config.__self &&
      ReactCurrentOwner.current.stateNode !== config.__self
    ) {
      var componentName = getComponentNameFromType(
        ReactCurrentOwner.current.type
      );

      if (!didWarnAboutStringRefs[componentName]) {
        error(
          'Component "%s" contains the string ref "%s". ' +
            "Support for string refs will be removed in a future major release. " +
            "This case cannot be automatically converted to an arrow function. " +
            "We ask you to manually fix this case by using useRef() or createRef() instead. " +
            "Learn more about using refs safely here: " +
            "https://reactjs.org/link/strict-mode-string-ref",
          componentName,
          config.ref
        );

        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }
}
/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, instanceof check
 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @internal
 */

var ReactElement = function(type, key, ref, self, source, owner, props) {
  var element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,
    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,
    // Record the component responsible for creating this element.
    _owner: owner
  };

  {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {}; // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.

    Object.defineProperty(element._store, "validated", {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false
    }); // self and source are DEV only properties.

    Object.defineProperty(element, "_self", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self
    }); // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.

    Object.defineProperty(element, "_source", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source
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
 * See https://reactjs.org/docs/react-api.html#createelement
 */

function createElement(type, config, children) {
  var propName; // Reserved names are extracted

  var props = {};
  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;

      {
        warnIfStringRefCannotBeAutoConverted(config);
      }
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = "" + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source; // Remaining properties are added to a new props object

    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  } // Children can be more than one argument, and those are transferred onto
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
  } // Resolve default props

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
      var displayName =
        typeof type === "function"
          ? type.displayName || type.name || "Unknown"
          : type;

      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }

      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props
  );
}
function cloneAndReplaceKey(oldElement, newKey) {
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
}
/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://reactjs.org/docs/react-api.html#cloneelement
 */

function cloneElement(element, config, children) {
  if (element === null || element === undefined) {
    throw new Error(
      "React.cloneElement(...): The argument must be a React element, but you passed " +
        element +
        "."
    );
  }

  var propName; // Original props are copied

  var props = assign({}, element.props); // Reserved names are extracted

  var key = element.key;
  var ref = element.ref; // Self is preserved since the owner is preserved.

  var self = element._self; // Source is preserved since cloneElement is unlikely to be targeted by a
  // transpiler, and the original source is probably a better indicator of the
  // true owner.

  var source = element._source; // Owner will be preserved, unless ref is overridden

  var owner = element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = "" + config.key;
    } // Remaining properties override existing props

    var defaultProps;

    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }

    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
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
  } // Children can be more than one argument, and those are transferred onto
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
}
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */

function isValidElement(object) {
  return (
    typeof object === "object" &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}

var SEPARATOR = ".";
var SUBSEPARATOR = ":";
/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */

function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    "=": "=0",
    ":": "=2"
  };
  var escapedString = key.replace(escapeRegex, function(match) {
    return escaperLookup[match];
  });
  return "$" + escapedString;
}
/**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */

var didWarnAboutMaps = false;
var userProvidedKeyEscapeRegex = /\/+/g;

function escapeUserProvidedKey(text) {
  return text.replace(userProvidedKeyEscapeRegex, "$&/");
}
/**
 * Generate a key string that identifies a element within a set.
 *
 * @param {*} element A element that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */

function getElementKey(element, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  if (typeof element === "object" && element !== null && element.key != null) {
    // Explicit key
    {
      checkKeyStringCoercion(element.key);
    }

    return escape("" + element.key);
  } // Implicit key determined by the index in the set

  return index.toString(36);
}

function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;

  if (type === "undefined" || type === "boolean") {
    // All of the above are perceived as null.
    children = null;
  }

  var invokeCallback = false;

  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case "string":
      case "number":
        invokeCallback = true;
        break;

      case "object":
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
        }
    }
  }

  if (invokeCallback) {
    var _child = children;
    var mappedChild = callback(_child); // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows:

    var childKey =
      nameSoFar === "" ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;

    if (isArray(mappedChild)) {
      var escapedChildKey = "";

      if (childKey != null) {
        escapedChildKey = escapeUserProvidedKey(childKey) + "/";
      }

      mapIntoArray(mappedChild, array, escapedChildKey, "", function(c) {
        return c;
      });
    } else if (mappedChild != null) {
      if (isValidElement(mappedChild)) {
        {
          // The `if` statement here prevents auto-disabling of the safe
          // coercion ESLint rule, so we must manually disable it below.
          // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
          if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
            checkKeyStringCoercion(mappedChild.key);
          }
        }

        mappedChild = cloneAndReplaceKey(
          mappedChild, // Keep both the (mapped) and old keys if they differ, just as
          // traverseAllChildren used to do for objects as children
          escapedPrefix + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
            (mappedChild.key && (!_child || _child.key !== mappedChild.key)
              ? escapeUserProvidedKey(
                  // eslint-disable-next-line react-internal/safe-string-coercion
                  "" + mappedChild.key // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
                ) + "/"
              : "") +
            childKey
        );
      }

      array.push(mappedChild);
    }

    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.

  var nextNamePrefix = nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getElementKey(child, i);
      subtreeCount += mapIntoArray(
        child,
        array,
        escapedPrefix,
        nextName,
        callback
      );
    }
  } else {
    var iteratorFn = getIteratorFn(children);

    if (typeof iteratorFn === "function") {
      var iterableChildren = children;

      {
        // Warn about using Maps as children
        if (iteratorFn === iterableChildren.entries) {
          if (!didWarnAboutMaps) {
            warn(
              "Using Maps as children is not supported. " +
                "Use an array of keyed ReactElements instead."
            );
          }

          didWarnAboutMaps = true;
        }
      }

      var iterator = iteratorFn.call(iterableChildren);
      var step;
      var ii = 0; // $FlowFixMe `iteratorFn` might return null according to typing.

      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getElementKey(child, ii++);
        subtreeCount += mapIntoArray(
          child,
          array,
          escapedPrefix,
          nextName,
          callback
        );
      }
    } else if (type === "object") {
      // eslint-disable-next-line react-internal/safe-string-coercion
      var childrenString = String(children);
      throw new Error(
        "Objects are not valid as a React child (found: " +
          (childrenString === "[object Object]"
            ? "object with keys {" + Object.keys(children).join(", ") + "}"
            : childrenString) +
          "). " +
          "If you meant to render a collection of children, use an array " +
          "instead."
      );
    }
  }

  return subtreeCount;
}
/**
 * Maps children that are typically specified as `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenmap
 *
 * The provided mapFunction(child, index) will be called for each
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
  var count = 0;
  mapIntoArray(children, result, "", "", function(child) {
    return func.call(context, child, count++);
  });
  return result;
}
/**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrencount
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */

function countChildren(children) {
  var n = 0;
  mapChildren(children, function() {
    n++; // Don't return anything
  });
  return n;
}
/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenforeach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext Context for forEachContext.
 */

function forEachChildren(children, forEachFunc, forEachContext) {
  mapChildren(
    children, // $FlowFixMe[missing-this-annot]
    function() {
      forEachFunc.apply(this, arguments); // Don't return anything.
    },
    forEachContext
  );
}
/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrentoarray
 */

function toArray(children) {
  return (
    mapChildren(children, function(child) {
      return child;
    }) || []
  );
}
/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenonly
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
  if (!isValidElement(children)) {
    throw new Error(
      "React.Children.only expected to receive a single React element child."
    );
  }

  return children;
}

function createContext(defaultValue) {
  // TODO: Second argument used to be an optional `calculateChangedBits`
  // function. Warn to reserve for future use?
  var context = {
    $$typeof: REACT_CONTEXT_TYPE,
    // As a workaround to support multiple concurrent renderers, we categorize
    // some renderers as primary and others as secondary. We only expect
    // there to be two concurrent renderers at most: React Native (primary) and
    // Fabric (secondary); React DOM (primary) and React ART (secondary).
    // Secondary renderers store their context values on separate fields.
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    // Used to track how many concurrent renderers this context currently
    // supports within in a single renderer. Such as parallel server rendering.
    _threadCount: 0,
    // These are circular
    Provider: null,
    Consumer: null,
    // Add these to use same hidden class in VM as ServerContext
    _defaultValue: null,
    _globalName: null
  };
  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context
  };
  var hasWarnedAboutUsingNestedContextConsumers = false;
  var hasWarnedAboutUsingConsumerProvider = false;
  var hasWarnedAboutDisplayNameOnConsumer = false;

  {
    // A separate object, but proxies back to the original context object for
    // backwards compatibility. It has a different $$typeof, so we can properly
    // warn for the incorrect usage of Context as a Consumer.
    var Consumer = {
      $$typeof: REACT_CONTEXT_TYPE,
      _context: context
    }; // $FlowFixMe: Flow complains about not setting a value, which is intentional here

    Object.defineProperties(Consumer, {
      Provider: {
        get: function() {
          if (!hasWarnedAboutUsingConsumerProvider) {
            hasWarnedAboutUsingConsumerProvider = true;

            error(
              "Rendering <Context.Consumer.Provider> is not supported and will be removed in " +
                "a future major release. Did you mean to render <Context.Provider> instead?"
            );
          }

          return context.Provider;
        },
        set: function(_Provider) {
          context.Provider = _Provider;
        }
      },
      _currentValue: {
        get: function() {
          return context._currentValue;
        },
        set: function(_currentValue) {
          context._currentValue = _currentValue;
        }
      },
      _currentValue2: {
        get: function() {
          return context._currentValue2;
        },
        set: function(_currentValue2) {
          context._currentValue2 = _currentValue2;
        }
      },
      _threadCount: {
        get: function() {
          return context._threadCount;
        },
        set: function(_threadCount) {
          context._threadCount = _threadCount;
        }
      },
      Consumer: {
        get: function() {
          if (!hasWarnedAboutUsingNestedContextConsumers) {
            hasWarnedAboutUsingNestedContextConsumers = true;

            error(
              "Rendering <Context.Consumer.Consumer> is not supported and will be removed in " +
                "a future major release. Did you mean to render <Context.Consumer> instead?"
            );
          }

          return context.Consumer;
        }
      },
      displayName: {
        get: function() {
          return context.displayName;
        },
        set: function(displayName) {
          if (!hasWarnedAboutDisplayNameOnConsumer) {
            warn(
              "Setting `displayName` on Context.Consumer has no effect. " +
                "You should set it directly on the context with Context.displayName = '%s'.",
              displayName
            );

            hasWarnedAboutDisplayNameOnConsumer = true;
          }
        }
      }
    }); // $FlowFixMe: Flow complains about missing properties because it doesn't understand defineProperty

    context.Consumer = Consumer;
  }

  {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }

  return context;
}

var Uninitialized = -1;
var Pending = 0;
var Resolved = 1;
var Rejected = 2;

function lazyInitializer(payload) {
  if (payload._status === Uninitialized) {
    var ctor = payload._result;
    var thenable = ctor(); // Transition to the next state.
    // This might throw either because it's missing or throws. If so, we treat it
    // as still uninitialized and try again next time. Which is the same as what
    // happens if the ctor or any wrappers processing the ctor throws. This might
    // end up fixing it if the resolution was a concurrency bug.

    thenable.then(
      function(moduleObject) {
        if (payload._status === Pending || payload._status === Uninitialized) {
          // Transition to the next state.
          var resolved = payload;
          resolved._status = Resolved;
          resolved._result = moduleObject;
        }
      },
      function(error) {
        if (payload._status === Pending || payload._status === Uninitialized) {
          // Transition to the next state.
          var rejected = payload;
          rejected._status = Rejected;
          rejected._result = error;
        }
      }
    );

    if (payload._status === Uninitialized) {
      // In case, we're still uninitialized, then we're waiting for the thenable
      // to resolve. Set it as pending in the meantime.
      var pending = payload;
      pending._status = Pending;
      pending._result = thenable;
    }
  }

  if (payload._status === Resolved) {
    var moduleObject = payload._result;

    {
      if (moduleObject === undefined) {
        error(
          "lazy: Expected the result of a dynamic imp" +
          "ort() call. " +
          "Instead received: %s\n\nYour code should look like: \n  " + // Break up imports to avoid accidentally parsing them as dependencies.
            "const MyComponent = lazy(() => imp" +
            "ort('./MyComponent'))\n\n" +
            "Did you accidentally put curly braces around the import?",
          moduleObject
        );
      }
    }

    {
      if (!("default" in moduleObject)) {
        error(
          "lazy: Expected the result of a dynamic imp" +
          "ort() call. " +
          "Instead received: %s\n\nYour code should look like: \n  " + // Break up imports to avoid accidentally parsing them as dependencies.
            "const MyComponent = lazy(() => imp" +
            "ort('./MyComponent'))",
          moduleObject
        );
      }
    }

    return moduleObject.default;
  } else {
    throw payload._result;
  }
}

function lazy(ctor) {
  var payload = {
    // We use these fields to store the result.
    _status: Uninitialized,
    _result: ctor
  };
  var lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: payload,
    _init: lazyInitializer
  };

  {
    // In production, this would just set it on the object.
    var defaultProps;
    var propTypes; // $FlowFixMe

    Object.defineProperties(lazyType, {
      defaultProps: {
        configurable: true,
        get: function() {
          return defaultProps;
        },
        // $FlowFixMe[missing-local-annot]
        set: function(newDefaultProps) {
          error(
            "React.lazy(...): It is not supported to assign `defaultProps` to " +
              "a lazy component import. Either specify them where the component " +
              "is defined, or create a wrapping component around it."
          );

          defaultProps = newDefaultProps; // Match production behavior more closely:
          // $FlowFixMe

          Object.defineProperty(lazyType, "defaultProps", {
            enumerable: true
          });
        }
      },
      propTypes: {
        configurable: true,
        get: function() {
          return propTypes;
        },
        // $FlowFixMe[missing-local-annot]
        set: function(newPropTypes) {
          error(
            "React.lazy(...): It is not supported to assign `propTypes` to " +
              "a lazy component import. Either specify them where the component " +
              "is defined, or create a wrapping component around it."
          );

          propTypes = newPropTypes; // Match production behavior more closely:
          // $FlowFixMe

          Object.defineProperty(lazyType, "propTypes", {
            enumerable: true
          });
        }
      }
    });
  }

  return lazyType;
}

function forwardRef(render) {
  {
    if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
      error(
        "forwardRef requires a render function but received a `memo` " +
          "component. Instead of forwardRef(memo(...)), use " +
          "memo(forwardRef(...))."
      );
    } else if (typeof render !== "function") {
      error(
        "forwardRef requires a render function but was given %s.",
        render === null ? "null" : typeof render
      );
    } else {
      if (render.length !== 0 && render.length !== 2) {
        error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          render.length === 1
            ? "Did you forget to use the ref parameter?"
            : "Any additional parameter will be undefined."
        );
      }
    }

    if (render != null) {
      if (render.defaultProps != null || render.propTypes != null) {
        error(
          "forwardRef render functions do not support propTypes or defaultProps. " +
            "Did you accidentally pass a React component?"
        );
      }
    }
  }

  var elementType = {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render: render
  };

  {
    var ownName;
    Object.defineProperty(elementType, "displayName", {
      enumerable: false,
      configurable: true,
      get: function() {
        return ownName;
      },
      set: function(name) {
        ownName = name; // The inner component shouldn't inherit this display name in most cases,
        // because the component may be used elsewhere.
        // But it's nice for anonymous functions to inherit the name,
        // so that our component-stack generation logic will display their frames.
        // An anonymous function generally suggests a pattern like:
        //   React.forwardRef((props, ref) => {...});
        // This kind of inner function is not used elsewhere so the side effect is okay.

        if (!render.name && !render.displayName) {
          render.displayName = name;
        }
      }
    });
  }

  return elementType;
}

var REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
function isValidElementType(type) {
  if (typeof type === "string" || typeof type === "function") {
    return true;
  } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).

  if (
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_PROFILER_TYPE ||
    (enableDebugTracing && type === REACT_DEBUG_TRACING_MODE_TYPE) ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE ||
    type === REACT_LEGACY_HIDDEN_TYPE ||
    type === REACT_OFFSCREEN_TYPE ||
    type === REACT_SCOPE_TYPE ||
    type === REACT_CACHE_TYPE ||
    (enableTransitionTracing && type === REACT_TRACING_MARKER_TYPE)
  ) {
    return true;
  }

  if (typeof type === "object" && type !== null) {
    if (
      type.$$typeof === REACT_LAZY_TYPE ||
      type.$$typeof === REACT_MEMO_TYPE ||
      type.$$typeof === REACT_PROVIDER_TYPE ||
      type.$$typeof === REACT_CONTEXT_TYPE ||
      type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      type.$$typeof === REACT_MODULE_REFERENCE ||
      type.getModuleId !== undefined
    ) {
      return true;
    }
  }

  return false;
}

function memo(type, compare) {
  {
    if (!isValidElementType(type)) {
      error(
        "memo: The first argument must be a component. Instead " +
          "received: %s",
        type === null ? "null" : typeof type
      );
    }
  }

  var elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type: type,
    compare: compare === undefined ? null : compare
  };

  {
    var ownName;
    Object.defineProperty(elementType, "displayName", {
      enumerable: false,
      configurable: true,
      get: function() {
        return ownName;
      },
      set: function(name) {
        ownName = name; // The inner component shouldn't inherit this display name in most cases,
        // because the component may be used elsewhere.
        // But it's nice for anonymous functions to inherit the name,
        // so that our component-stack generation logic will display their frames.
        // An anonymous function generally suggests a pattern like:
        //   React.memo((props) => {...});
        // This kind of inner function is not used elsewhere so the side effect is okay.

        if (!type.name && !type.displayName) {
          type.displayName = name;
        }
      }
    });
  }

  return elementType;
}

/**
 * Keeps track of the current Cache dispatcher.
 */
var ReactCurrentCache = {
  current: null
};

var UNTERMINATED = 0;
var TERMINATED = 1;
var ERRORED = 2;

function createCacheRoot() {
  return new WeakMap();
}

function createCacheNode() {
  return {
    s: UNTERMINATED,
    // status, represents whether the cached computation returned a value or threw an error
    v: undefined,
    // value, either the cached result or an error, depending on s
    o: null,
    // object cache, a WeakMap where non-primitive arguments are stored
    p: null // primitive cache, a regular Map where primitive arguments are stored.
  };
}

function cache(fn) {
  return function() {
    var dispatcher = ReactCurrentCache.current;

    if (!dispatcher) {
      // If there is no dispatcher, then we treat this as not being cached.
      // $FlowFixMe: We don't want to use rest arguments since we transpile the code.
      return fn.apply(null, arguments);
    }

    var fnMap = dispatcher.getCacheForType(createCacheRoot);
    var fnNode = fnMap.get(fn);
    var cacheNode;

    if (fnNode === undefined) {
      cacheNode = createCacheNode();
      fnMap.set(fn, cacheNode);
    } else {
      cacheNode = fnNode;
    }

    for (var i = 0, l = arguments.length; i < l; i++) {
      var arg = arguments[i];

      if (
        typeof arg === "function" ||
        (typeof arg === "object" && arg !== null)
      ) {
        // Objects go into a WeakMap
        var objectCache = cacheNode.o;

        if (objectCache === null) {
          cacheNode.o = objectCache = new WeakMap();
        }

        var objectNode = objectCache.get(arg);

        if (objectNode === undefined) {
          cacheNode = createCacheNode();
          objectCache.set(arg, cacheNode);
        } else {
          cacheNode = objectNode;
        }
      } else {
        // Primitives go into a regular Map
        var primitiveCache = cacheNode.p;

        if (primitiveCache === null) {
          cacheNode.p = primitiveCache = new Map();
        }

        var primitiveNode = primitiveCache.get(arg);

        if (primitiveNode === undefined) {
          cacheNode = createCacheNode();
          primitiveCache.set(arg, cacheNode);
        } else {
          cacheNode = primitiveNode;
        }
      }
    }

    if (cacheNode.s === TERMINATED) {
      return cacheNode.v;
    }

    if (cacheNode.s === ERRORED) {
      throw cacheNode.v;
    }

    try {
      // $FlowFixMe: We don't want to use rest arguments since we transpile the code.
      var result = fn.apply(null, arguments);
      var terminatedNode = cacheNode;
      terminatedNode.s = TERMINATED;
      terminatedNode.v = result;
      return result;
    } catch (error) {
      // We store the first error that's thrown and rethrow it.
      var erroredNode = cacheNode;
      erroredNode.s = ERRORED;
      erroredNode.v = error;
      throw error;
    }
  };
}

/**
 * Keeps track of the current dispatcher.
 */
var ReactCurrentDispatcher = {
  current: null
};

function resolveDispatcher() {
  var dispatcher = ReactCurrentDispatcher.current;

  {
    if (dispatcher === null) {
      error(
        "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for" +
          " one of the following reasons:\n" +
          "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" +
          "2. You might be breaking the Rules of Hooks\n" +
          "3. You might have more than one copy of React in the same app\n" +
          "See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem."
      );
    }
  } // Will result in a null access error if accessed outside render phase. We
  // intentionally don't throw our own error because this is in a hot path.
  // Also helps ensure this is inlined.

  return dispatcher;
}

function getCacheSignal() {
  var dispatcher = ReactCurrentCache.current;

  if (!dispatcher) {
    // If we have no cache to associate with this call, then we don't know
    // its lifetime. We abort early since that's safer than letting it live
    // for ever. Unlike just caching which can be a functional noop outside
    // of React, these should generally always be associated with some React
    // render but we're not limiting quite as much as making it a Hook.
    // It's safer than erroring early at runtime.
    var controller = new AbortController();
    var reason = new Error(
      "This CacheSignal was requested outside React which means that it is " +
        "immediately aborted."
    ); // $FlowFixMe Flow doesn't yet know about this argument.

    controller.abort(reason);
    return controller.signal;
  }

  return dispatcher.getCacheSignal();
}
function getCacheForType(resourceType) {
  var dispatcher = ReactCurrentCache.current;

  if (!dispatcher) {
    // If there is no dispatcher, then we treat this as not being cached.
    return resourceType();
  }

  return dispatcher.getCacheForType(resourceType);
}
function useContext(Context) {
  var dispatcher = resolveDispatcher();

  {
    // TODO: add a more generic warning for invalid values.
    if (Context._context !== undefined) {
      var realContext = Context._context; // Don't deduplicate because this legitimately causes bugs
      // and nobody should be using this in existing code.

      if (realContext.Consumer === Context) {
        error(
          "Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be " +
            "removed in a future major release. Did you mean to call useContext(Context) instead?"
        );
      } else if (realContext.Provider === Context) {
        error(
          "Calling useContext(Context.Provider) is not supported. " +
            "Did you mean to call useContext(Context) instead?"
        );
      }
    }
  }

  return dispatcher.useContext(Context);
}
function useState(initialState) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
function useReducer(reducer, initialArg, init) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}
function useRef(initialValue) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}
function useEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}
function useInsertionEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useInsertionEffect(create, deps);
}
function useLayoutEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}
function useCallback(callback, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, deps);
}
function useMemo(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, deps);
}
function useImperativeHandle(ref, create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, deps);
}
function useDebugValue(value, formatterFn) {
  {
    var dispatcher = resolveDispatcher();
    return dispatcher.useDebugValue(value, formatterFn);
  }
}
function useTransition() {
  var dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
}
function useDeferredValue(value) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useDeferredValue(value);
}
function useId() {
  var dispatcher = resolveDispatcher();
  return dispatcher.useId();
}
function useMutableSource(source, getSnapshot, subscribe) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useMutableSource(source, getSnapshot, subscribe);
}
function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}
function useCacheRefresh() {
  var dispatcher = resolveDispatcher(); // $FlowFixMe This is unstable, thus optional

  return dispatcher.useCacheRefresh();
}
function use(usable) {
  var dispatcher = resolveDispatcher(); // $FlowFixMe This is unstable, thus optional

  return dispatcher.use(usable);
}
function useMemoCache(size) {
  var dispatcher = resolveDispatcher(); // $FlowFixMe This is unstable, thus optional

  return dispatcher.useMemoCache(size);
}
function useEffectEvent(callback) {
  var dispatcher = resolveDispatcher(); // $FlowFixMe This is unstable, thus optional

  return dispatcher.useEffectEvent(callback);
}

// Helpers to patch console.logs to avoid logging during side-effect free
// replaying on render function. This currently only patches the object
// lazily which won't cover if the log function was extracted eagerly.
// We could also eagerly patch the method.
var disabledDepth = 0;
var prevLog;
var prevInfo;
var prevWarn;
var prevError;
var prevGroup;
var prevGroupCollapsed;
var prevGroupEnd;

function disabledLog() {}

disabledLog.__reactDisabledLog = true;
function disableLogs() {
  {
    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      prevLog = console.log;
      prevInfo = console.info;
      prevWarn = console.warn;
      prevError = console.error;
      prevGroup = console.group;
      prevGroupCollapsed = console.groupCollapsed;
      prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

      var props = {
        configurable: true,
        enumerable: true,
        value: disabledLog,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        info: props,
        log: props,
        warn: props,
        error: props,
        group: props,
        groupCollapsed: props,
        groupEnd: props
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    disabledDepth++;
  }
}
function reenableLogs() {
  {
    disabledDepth--;

    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      var props = {
        configurable: true,
        enumerable: true,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        log: assign({}, props, {
          value: prevLog
        }),
        info: assign({}, props, {
          value: prevInfo
        }),
        warn: assign({}, props, {
          value: prevWarn
        }),
        error: assign({}, props, {
          value: prevError
        }),
        group: assign({}, props, {
          value: prevGroup
        }),
        groupCollapsed: assign({}, props, {
          value: prevGroupCollapsed
        }),
        groupEnd: assign({}, props, {
          value: prevGroupEnd
        })
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    if (disabledDepth < 0) {
      error(
        "disabledDepth fell below zero. " +
          "This is a bug in React. Please file an issue."
      );
    }
  }
}

/**
 * Keeps track of the current batch's configuration such as how long an update
 * should suspend for if it needs to.
 */
var ReactCurrentBatchConfig = {
  transition: null
};

var ReactCurrentActQueue = {
  current: null,
  // Used to reproduce behavior of `batchedUpdates` in legacy mode.
  isBatchingLegacy: false,
  didScheduleLegacyUpdate: false,
  // Tracks whether something called `use` during the current batch of work.
  // Determines whether we should yield to microtasks to unwrap already resolved
  // promises without suspending.
  didUsePromise: false
};

var ReactDebugCurrentFrame = {};
var currentExtraStackFrame = null;
function setExtraStackFrame(stack) {
  {
    currentExtraStackFrame = stack;
  }
}

{
  ReactDebugCurrentFrame.setExtraStackFrame = function(stack) {
    {
      currentExtraStackFrame = stack;
    }
  }; // Stack implementation injected by the current renderer.

  ReactDebugCurrentFrame.getCurrentStack = null;

  ReactDebugCurrentFrame.getStackAddendum = function() {
    var stack = ""; // Add an extra top frame while an element is being validated

    if (currentExtraStackFrame) {
      stack += currentExtraStackFrame;
    } // Delegate to the injected renderer-specific implementation

    var impl = ReactDebugCurrentFrame.getCurrentStack;

    if (impl) {
      stack += impl() || "";
    }

    return stack;
  };
}

var ContextRegistry = {};

var ReactSharedInternals = {
  ReactCurrentDispatcher: ReactCurrentDispatcher,
  ReactCurrentCache: ReactCurrentCache,
  ReactCurrentBatchConfig: ReactCurrentBatchConfig,
  ReactCurrentOwner: ReactCurrentOwner
};

{
  ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
  ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
}

{
  ReactSharedInternals.ContextRegistry = ContextRegistry;
}

var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
var prefix;
function describeBuiltInComponentFrame(name, source, ownerFn) {
  {
    if (prefix === undefined) {
      // Extract the VM specific prefix used by each line.
      try {
        throw Error();
      } catch (x) {
        var match = x.stack.trim().match(/\n( *(at )?)/);
        prefix = (match && match[1]) || "";
      }
    } // We use the prefix to ensure our stacks line up with native stack frames.

    return "\n" + prefix + name;
  }
}
var reentry = false;
var componentFrameCache;

{
  var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
  componentFrameCache = new PossiblyWeakMap();
}

function describeNativeComponentFrame(fn, construct) {
  // If something asked for a stack inside a fake render, it should get ignored.
  if (disableNativeComponentFrames || !fn || reentry) {
    return "";
  }

  {
    var frame = componentFrameCache.get(fn);

    if (frame !== undefined) {
      return frame;
    }
  }

  var control;
  reentry = true;
  var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.

  Error.prepareStackTrace = undefined;
  var previousDispatcher;

  {
    previousDispatcher = ReactCurrentDispatcher$1.current; // Set the dispatcher in DEV because this might be call in the render function
    // for warnings.

    ReactCurrentDispatcher$1.current = null;
    disableLogs();
  }

  try {
    // This should throw.
    if (construct) {
      // Something should be setting the props in the constructor.
      var Fake = function() {
        throw Error();
      }; // $FlowFixMe

      Object.defineProperty(Fake.prototype, "props", {
        set: function() {
          // We use a throwing setter instead of frozen or non-writable props
          // because that won't throw in a non-strict mode function.
          throw Error();
        }
      });

      if (typeof Reflect === "object" && Reflect.construct) {
        // We construct a different control for this case to include any extra
        // frames added by the construct call.
        try {
          Reflect.construct(Fake, []);
        } catch (x) {
          control = x;
        }

        Reflect.construct(fn, [], Fake);
      } else {
        try {
          Fake.call();
        } catch (x) {
          control = x;
        } // $FlowFixMe[prop-missing] found when upgrading Flow

        fn.call(Fake.prototype);
      }
    } else {
      try {
        throw Error();
      } catch (x) {
        control = x;
      } // TODO(luna): This will currently only throw if the function component
      // tries to access React/ReactDOM/props. We should probably make this throw
      // in simple components too

      fn();
    }
  } catch (sample) {
    // This is inlined manually because closure doesn't do it for us.
    if (sample && control && typeof sample.stack === "string") {
      // This extracts the first frame from the sample that isn't also in the control.
      // Skipping one frame that we assume is the frame that calls the two.
      var sampleLines = sample.stack.split("\n");
      var controlLines = control.stack.split("\n");
      var s = sampleLines.length - 1;
      var c = controlLines.length - 1;

      while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
        // We expect at least one stack frame to be shared.
        // Typically this will be the root most one. However, stack frames may be
        // cut off due to maximum stack limits. In this case, one maybe cut off
        // earlier than the other. We assume that the sample is longer or the same
        // and there for cut off earlier. So we should find the root most frame in
        // the sample somewhere in the control.
        c--;
      }

      for (; s >= 1 && c >= 0; s--, c--) {
        // Next we find the first one that isn't the same which should be the
        // frame that called our sample function and the control.
        if (sampleLines[s] !== controlLines[c]) {
          // In V8, the first line is describing the message but other VMs don't.
          // If we're about to return the first line, and the control is also on the same
          // line, that's a pretty good indicator that our sample threw at same line as
          // the control. I.e. before we entered the sample frame. So we ignore this result.
          // This can happen if you passed a class to function component, or non-function.
          if (s !== 1 || c !== 1) {
            do {
              s--;
              c--; // We may still have similar intermediate frames from the construct call.
              // The next one that isn't the same should be our match though.

              if (c < 0 || sampleLines[s] !== controlLines[c]) {
                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                var _frame = "\n" + sampleLines[s].replace(" at new ", " at "); // If our component frame is labeled "<anonymous>"
                // but we have a user-provided "displayName"
                // splice it in to make the stack more readable.

                if (fn.displayName && _frame.includes("<anonymous>")) {
                  _frame = _frame.replace("<anonymous>", fn.displayName);
                }

                {
                  if (typeof fn === "function") {
                    componentFrameCache.set(fn, _frame);
                  }
                } // Return the line we found.

                return _frame;
              }
            } while (s >= 1 && c >= 0);
          }

          break;
        }
      }
    }
  } finally {
    reentry = false;

    {
      ReactCurrentDispatcher$1.current = previousDispatcher;
      reenableLogs();
    }

    Error.prepareStackTrace = previousPrepareStackTrace;
  } // Fallback to just using the name if we couldn't make it throw.

  var name = fn ? fn.displayName || fn.name : "";
  var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";

  {
    if (typeof fn === "function") {
      componentFrameCache.set(fn, syntheticFrame);
    }
  }

  return syntheticFrame;
}
function describeFunctionComponentFrame(fn, source, ownerFn) {
  {
    return describeNativeComponentFrame(fn, false);
  }
}

function shouldConstruct(Component) {
  var prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
  if (type == null) {
    return "";
  }

  if (typeof type === "function") {
    {
      return describeNativeComponentFrame(type, shouldConstruct(type));
    }
  }

  if (typeof type === "string") {
    return describeBuiltInComponentFrame(type);
  }

  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return describeBuiltInComponentFrame("Suspense");

    case REACT_SUSPENSE_LIST_TYPE:
      return describeBuiltInComponentFrame("SuspenseList");
  }

  if (typeof type === "object") {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeFunctionComponentFrame(type.render);

      case REACT_MEMO_TYPE:
        // Memo may contain any component type so we recursively resolve it.
        return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);

      case REACT_LAZY_TYPE: {
        var lazyComponent = type;
        var payload = lazyComponent._payload;
        var init = lazyComponent._init;

        try {
          // Lazy may contain any component type so we recursively resolve it.
          return describeUnknownElementTypeFrameInDEV(
            init(payload),
            source,
            ownerFn
          );
        } catch (x) {}
      }
    }
  }

  return "";
}

var loggedTypeFailures = {};
var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement(element) {
  {
    if (element) {
      var owner = element._owner;
      var stack = describeUnknownElementTypeFrameInDEV(
        element.type,
        element._source,
        owner ? owner.type : null
      );
      ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
    } else {
      ReactDebugCurrentFrame$1.setExtraStackFrame(null);
    }
  }
}

function checkPropTypes(typeSpecs, values, location, componentName, element) {
  {
    // $FlowFixMe This is okay but Flow doesn't know it.
    var has = Function.call.bind(hasOwnProperty);

    for (var typeSpecName in typeSpecs) {
      if (has(typeSpecs, typeSpecName)) {
        var error$1 = void 0; // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.

        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== "function") {
            // eslint-disable-next-line react-internal/prod-error-codes
            var err = Error(
              (componentName || "React class") +
                ": " +
                location +
                " type `" +
                typeSpecName +
                "` is invalid; " +
                "it must be a function, usually from the `prop-types` package, but received `" +
                typeof typeSpecs[typeSpecName] +
                "`." +
                "This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
            );
            err.name = "Invariant Violation";
            throw err;
          }

          error$1 = typeSpecs[typeSpecName](
            values,
            typeSpecName,
            componentName,
            location,
            null,
            "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"
          );
        } catch (ex) {
          error$1 = ex;
        }

        if (error$1 && !(error$1 instanceof Error)) {
          setCurrentlyValidatingElement(element);

          error(
            "%s: type specification of %s" +
              " `%s` is invalid; the type checker " +
              "function must return `null` or an `Error` but returned a %s. " +
              "You may have forgotten to pass an argument to the type checker " +
              "creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and " +
              "shape all require an argument).",
            componentName || "React class",
            location,
            typeSpecName,
            typeof error$1
          );

          setCurrentlyValidatingElement(null);
        }

        if (
          error$1 instanceof Error &&
          !(error$1.message in loggedTypeFailures)
        ) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error$1.message] = true;
          setCurrentlyValidatingElement(element);

          error("Failed %s type: %s", location, error$1.message);

          setCurrentlyValidatingElement(null);
        }
      }
    }
  }
}

function setCurrentlyValidatingElement$1(element) {
  {
    if (element) {
      var owner = element._owner;
      var stack = describeUnknownElementTypeFrameInDEV(
        element.type,
        element._source,
        owner ? owner.type : null
      );
      setExtraStackFrame(stack);
    } else {
      setExtraStackFrame(null);
    }
  }
}

var propTypesMisspellWarningShown;

{
  propTypesMisspellWarningShown = false;
}

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner.current) {
    var name = getComponentNameFromType(ReactCurrentOwner.current.type);

    if (name) {
      return "\n\nCheck the render method of `" + name + "`.";
    }
  }

  return "";
}

function getSourceInfoErrorAddendum(source) {
  if (source !== undefined) {
    var fileName = source.fileName.replace(/^.*[\\\/]/, "");
    var lineNumber = source.lineNumber;
    return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
  }

  return "";
}

function getSourceInfoErrorAddendumForProps(elementProps) {
  if (elementProps !== null && elementProps !== undefined) {
    return getSourceInfoErrorAddendum(elementProps.__source);
  }

  return "";
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
    var parentName =
      typeof parentType === "string"
        ? parentType
        : parentType.displayName || parentType.name;

    if (parentName) {
      info = "\n\nCheck the top-level render call using <" + parentName + ">.";
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

  ownerHasKeyUseWarning[currentComponentErrorInfo] = true; // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.

  var childOwner = "";

  if (
    element &&
    element._owner &&
    element._owner !== ReactCurrentOwner.current
  ) {
    // Give the component that originally created this child.
    childOwner =
      " It was passed a child from " +
      getComponentNameFromType(element._owner.type) +
      ".";
  }

  {
    setCurrentlyValidatingElement$1(element);

    error(
      'Each child in a list should have a unique "key" prop.' +
        "%s%s See https://reactjs.org/link/warning-keys for more information.",
      currentComponentErrorInfo,
      childOwner
    );

    setCurrentlyValidatingElement$1(null);
  }
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
  if (typeof node !== "object") {
    return;
  }

  if (isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var child = node[i];

      if (isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (isValidElement(node)) {
    // This element was passed in a valid location.
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    var iteratorFn = getIteratorFn(node);

    if (typeof iteratorFn === "function") {
      // Entry iterators used to provide implicit keys,
      // but now we print a separate warning for them later.
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step;

        while (!(step = iterator.next()).done) {
          if (isValidElement(step.value)) {
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
  {
    var type = element.type;

    if (type === null || type === undefined || typeof type === "string") {
      return;
    }

    var propTypes;

    if (typeof type === "function") {
      propTypes = type.propTypes;
    } else if (
      typeof type === "object" &&
      (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        type.$$typeof === REACT_MEMO_TYPE)
    ) {
      propTypes = type.propTypes;
    } else {
      return;
    }

    if (propTypes) {
      // Intentionally inside to avoid triggering lazy initializers:
      var name = getComponentNameFromType(type);
      checkPropTypes(propTypes, element.props, "prop", name, element);
    } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
      propTypesMisspellWarningShown = true; // Intentionally inside to avoid triggering lazy initializers:

      var _name = getComponentNameFromType(type);

      error(
        "Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?",
        _name || "Unknown"
      );
    }

    if (
      typeof type.getDefaultProps === "function" &&
      !type.getDefaultProps.isReactClassApproved
    ) {
      error(
        "getDefaultProps is only used on classic React.createClass " +
          "definitions. Use a static property named `defaultProps` instead."
      );
    }
  }
}
/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */

function validateFragmentProps(fragment) {
  {
    var keys = Object.keys(fragment.props);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (key !== "children" && key !== "key") {
        setCurrentlyValidatingElement$1(fragment);

        error(
          "Invalid prop `%s` supplied to `React.Fragment`. " +
            "React.Fragment can only have `key` and `children` props.",
          key
        );

        setCurrentlyValidatingElement$1(null);
        break;
      }
    }

    if (fragment.ref !== null) {
      setCurrentlyValidatingElement$1(fragment);

      error("Invalid attribute `ref` supplied to `React.Fragment`.");

      setCurrentlyValidatingElement$1(null);
    }
  }
}
function createElementWithValidation(type, props, children) {
  var validType = isValidElementType(type); // We warn in this case but don't throw. We expect the element creation to
  // succeed and there will likely be errors in render.

  if (!validType) {
    var info = "";

    if (
      type === undefined ||
      (typeof type === "object" &&
        type !== null &&
        Object.keys(type).length === 0)
    ) {
      info +=
        " You likely forgot to export your component from the file " +
        "it's defined in, or you might have mixed up default and named imports.";
    }

    var sourceInfo = getSourceInfoErrorAddendumForProps(props);

    if (sourceInfo) {
      info += sourceInfo;
    } else {
      info += getDeclarationErrorAddendum();
    }

    var typeString;

    if (type === null) {
      typeString = "null";
    } else if (isArray(type)) {
      typeString = "array";
    } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
      typeString =
        "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
      info =
        " Did you accidentally export a JSX literal instead of a component?";
    } else {
      typeString = typeof type;
    }

    {
      error(
        "React.createElement: type is invalid -- expected a string (for " +
          "built-in components) or a class/function (for composite " +
          "components) but got: %s.%s",
        typeString,
        info
      );
    }
  }

  var element = createElement.apply(this, arguments); // The result can be nullish if a mock or a custom function is used.
  // TODO: Drop this when these are no longer allowed as the type argument.

  if (element == null) {
    return element;
  } // Skip key warning if the type isn't valid since our key validation logic
  // doesn't expect a non-string/function type and can throw confusing errors.
  // We don't want exception behavior to differ between dev and prod.
  // (Rendering will throw with a helpful message and as soon as the type is
  // fixed, the key warnings will appear.)

  if (validType) {
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], type);
    }
  }

  if (type === REACT_FRAGMENT_TYPE) {
    validateFragmentProps(element);
  } else {
    validatePropTypes(element);
  }

  return element;
}
var didWarnAboutDeprecatedCreateFactory = false;
function createFactoryWithValidation(type) {
  var validatedFactory = createElementWithValidation.bind(null, type);
  validatedFactory.type = type;

  {
    if (!didWarnAboutDeprecatedCreateFactory) {
      didWarnAboutDeprecatedCreateFactory = true;

      warn(
        "React.createFactory() is deprecated and will be removed in " +
          "a future major release. Consider using JSX " +
          "or use React.createElement() directly instead."
      );
    } // Legacy hook: remove it

    Object.defineProperty(validatedFactory, "type", {
      enumerable: false,
      get: function() {
        warn(
          "Factory.type is deprecated. Access the class directly " +
            "before passing it to createFactory."
        );

        Object.defineProperty(this, "type", {
          value: type
        });
        return type;
      }
    });
  }

  return validatedFactory;
}
function cloneElementWithValidation(element, props, children) {
  var newElement = cloneElement.apply(this, arguments);

  for (var i = 2; i < arguments.length; i++) {
    validateChildKeys(arguments[i], newElement.type);
  }

  validatePropTypes(newElement);
  return newElement;
}

var ContextRegistry$1 = ReactSharedInternals.ContextRegistry;
function createServerContext(globalName, defaultValue) {
  var wasDefined = true;

  if (!ContextRegistry$1[globalName]) {
    wasDefined = false;
    var _context = {
      $$typeof: REACT_SERVER_CONTEXT_TYPE,
      // As a workaround to support multiple concurrent renderers, we categorize
      // some renderers as primary and others as secondary. We only expect
      // there to be two concurrent renderers at most: React Native (primary) and
      // Fabric (secondary); React DOM (primary) and React ART (secondary).
      // Secondary renderers store their context values on separate fields.
      _currentValue: defaultValue,
      _currentValue2: defaultValue,
      _defaultValue: defaultValue,
      // Used to track how many concurrent renderers this context currently
      // supports within in a single renderer. Such as parallel server rendering.
      _threadCount: 0,
      // These are circular
      Provider: null,
      Consumer: null,
      _globalName: globalName
    };
    _context.Provider = {
      $$typeof: REACT_PROVIDER_TYPE,
      _context: _context
    };

    {
      var hasWarnedAboutUsingConsumer;
      _context._currentRenderer = null;
      _context._currentRenderer2 = null;
      Object.defineProperties(_context, {
        Consumer: {
          get: function() {
            if (!hasWarnedAboutUsingConsumer) {
              error("Consumer pattern is not supported by ReactServerContext");

              hasWarnedAboutUsingConsumer = true;
            }

            return null;
          }
        }
      });
    }

    ContextRegistry$1[globalName] = _context;
  }

  var context = ContextRegistry$1[globalName];

  if (context._defaultValue === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED) {
    context._defaultValue = defaultValue;

    if (
      context._currentValue === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED
    ) {
      context._currentValue = defaultValue;
    }

    if (
      context._currentValue2 === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED
    ) {
      context._currentValue2 = defaultValue;
    }
  } else if (wasDefined) {
    throw new Error("ServerContext: " + globalName + " already defined");
  }

  return context;
}

function createMutableSource(source, getVersion) {
  var mutableSource = {
    _getVersion: getVersion,
    _source: source,
    _workInProgressVersionPrimary: null,
    _workInProgressVersionSecondary: null
  };

  {
    mutableSource._currentPrimaryRenderer = null;
    mutableSource._currentSecondaryRenderer = null; // Used to detect side effects that update a mutable source during render.
    // See https://github.com/facebook/react/issues/19948

    mutableSource._currentlyRenderingFiber = null;
    mutableSource._initialVersionAsOfFirstRender = null;
  }

  return mutableSource;
}

function startTransition(scope, options) {
  var prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};
  var currentTransition = ReactCurrentBatchConfig.transition;

  {
    ReactCurrentBatchConfig.transition._updatedFibers = new Set();
  }

  if (enableTransitionTracing) {
    if (options !== undefined && options.name !== undefined) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      ReactCurrentBatchConfig.transition.name = options.name; // $FlowFixMe[incompatible-use] found when upgrading Flow

      ReactCurrentBatchConfig.transition.startTime = -1;
    }
  }

  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;

    {
      if (prevTransition === null && currentTransition._updatedFibers) {
        var updatedFibersCount = currentTransition._updatedFibers.size;

        currentTransition._updatedFibers.clear();

        if (updatedFibersCount > 10) {
          warn(
            "Detected a large number of updates inside startTransition. " +
              "If this is due to a subscription please re-write it to use React provided hooks. " +
              "Otherwise concurrent mode guarantees are off the table."
          );
        }
      }
    }
  }
}

var didWarnAboutMessageChannel = false;
var enqueueTaskImpl = null;
function enqueueTask(task) {
  if (enqueueTaskImpl === null) {
    try {
      // read require off the module object to get around the bundlers.
      // we don't want them to detect a require and bundle a Node polyfill.
      var requireString = ("require" + Math.random()).slice(0, 7);
      var nodeRequire = module && module[requireString]; // assuming we're in node, let's try to get node's
      // version of setImmediate, bypassing fake timers if any.

      enqueueTaskImpl = nodeRequire.call(module, "timers").setImmediate;
    } catch (_err) {
      // we're in a browser
      // we can't use regular timers because they may still be faked
      // so we try MessageChannel+postMessage instead
      enqueueTaskImpl = function(callback) {
        {
          if (didWarnAboutMessageChannel === false) {
            didWarnAboutMessageChannel = true;

            if (typeof MessageChannel === "undefined") {
              error(
                "This browser does not have a MessageChannel implementation, " +
                  "so enqueuing tasks via await act(async () => ...) will fail. " +
                  "Please file an issue at https://github.com/facebook/react/issues " +
                  "if you encounter this warning."
              );
            }
          }
        }

        var channel = new MessageChannel();
        channel.port1.onmessage = callback;
        channel.port2.postMessage(undefined);
      };
    }
  }

  return enqueueTaskImpl(task);
}

// number of `act` scopes on the stack.

var actScopeDepth = 0; // We only warn the first time you neglect to await an async `act` scope.

var didWarnNoAwaitAct = false;
function act(callback) {
  {
    // When ReactCurrentActQueue.current is not null, it signals to React that
    // we're currently inside an `act` scope. React will push all its tasks to
    // this queue instead of scheduling them with platform APIs.
    //
    // We set this to an empty array when we first enter an `act` scope, and
    // only unset it once we've left the outermost `act` scope — remember that
    // `act` calls can be nested.
    //
    // If we're already inside an `act` scope, reuse the existing queue.
    var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
    var prevActQueue = ReactCurrentActQueue.current;
    var prevActScopeDepth = actScopeDepth;
    actScopeDepth++;
    var queue = (ReactCurrentActQueue.current =
      prevActQueue !== null ? prevActQueue : []); // Used to reproduce behavior of `batchedUpdates` in legacy mode. Only
    // set to `true` while the given callback is executed, not for updates
    // triggered during an async event, because this is how the legacy
    // implementation of `act` behaved.

    ReactCurrentActQueue.isBatchingLegacy = true;
    var result; // This tracks whether the `act` call is awaited. In certain cases, not
    // awaiting it is a mistake, so we will detect that and warn.

    var didAwaitActCall = false;

    try {
      // Reset this to `false` right before entering the React work loop. The
      // only place we ever read this fields is just below, right after running
      // the callback. So we don't need to reset after the callback runs.
      ReactCurrentActQueue.didScheduleLegacyUpdate = false;
      result = callback();
      var didScheduleLegacyUpdate =
        ReactCurrentActQueue.didScheduleLegacyUpdate; // Replicate behavior of original `act` implementation in legacy mode,
      // which flushed updates immediately after the scope function exits, even
      // if it's an async function.

      if (!prevIsBatchingLegacy && didScheduleLegacyUpdate) {
        flushActQueue(queue);
      } // `isBatchingLegacy` gets reset using the regular stack, not the async
      // one used to track `act` scopes. Why, you may be wondering? Because
      // that's how it worked before version 18. Yes, it's confusing! We should
      // delete legacy mode!!

      ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
    } catch (error) {
      // `isBatchingLegacy` gets reset using the regular stack, not the async
      // one used to track `act` scopes. Why, you may be wondering? Because
      // that's how it worked before version 18. Yes, it's confusing! We should
      // delete legacy mode!!
      ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
      popActScope(prevActQueue, prevActScopeDepth);
      throw error;
    }

    if (
      result !== null &&
      typeof result === "object" && // $FlowFixMe[method-unbinding]
      typeof result.then === "function"
    ) {
      // A promise/thenable was returned from the callback. Wait for it to
      // resolve before flushing the queue.
      //
      // If `act` were implemented as an async function, this whole block could
      // be a single `await` call. That's really the only difference between
      // this branch and the next one.
      var thenable = result; // Warn if the an `act` call with an async scope is not awaited. In a
      // future release, consider making this an error.

      queueSeveralMicrotasks(function() {
        if (!didAwaitActCall && !didWarnNoAwaitAct) {
          didWarnNoAwaitAct = true;

          error(
            "You called act(async () => ...) without await. " +
              "This could lead to unexpected testing behaviour, " +
              "interleaving multiple act calls and mixing their " +
              "scopes. " +
              "You should - await act(async () => ...);"
          );
        }
      });
      return {
        then: function(resolve, reject) {
          didAwaitActCall = true;
          thenable.then(
            function(returnValue) {
              popActScope(prevActQueue, prevActScopeDepth);

              if (prevActScopeDepth === 0) {
                // We're exiting the outermost `act` scope. Flush the queue.
                try {
                  flushActQueue(queue);
                  enqueueTask(function() {
                    return (
                      // Recursively flush tasks scheduled by a microtask.
                      recursivelyFlushAsyncActWork(returnValue, resolve, reject)
                    );
                  });
                } catch (error) {
                  // `thenable` might not be a real promise, and `flushActQueue`
                  // might throw, so we need to wrap `flushActQueue` in a
                  // try/catch.
                  reject(error);
                }
              } else {
                resolve(returnValue);
              }
            },
            function(error) {
              popActScope(prevActQueue, prevActScopeDepth);
              reject(error);
            }
          );
        }
      };
    } else {
      var returnValue = result; // The callback is not an async function. Exit the current
      // scope immediately.

      popActScope(prevActQueue, prevActScopeDepth);

      if (prevActScopeDepth === 0) {
        // We're exiting the outermost `act` scope. Flush the queue.
        flushActQueue(queue); // If the queue is not empty, it implies that we intentionally yielded
        // to the main thread, because something suspended. We will continue
        // in an asynchronous task.
        //
        // Warn if something suspends but the `act` call is not awaited.
        // In a future release, consider making this an error.

        if (queue.length !== 0) {
          queueSeveralMicrotasks(function() {
            if (!didAwaitActCall && !didWarnNoAwaitAct) {
              didWarnNoAwaitAct = true;

              error(
                "A component suspended inside an `act` scope, but the " +
                  "`act` call was not awaited. When testing React " +
                  "components that depend on asynchronous data, you must " +
                  "await the result:\n\n" +
                  "await act(() => ...)"
              );
            }
          });
        } // Like many things in this module, this is next part is confusing.
        //
        // We do not currently require every `act` call that is passed a
        // callback to be awaited, through arguably we should. Since this
        // callback was synchronous, we need to exit the current scope before
        // returning.
        //
        // However, if thenable we're about to return *is* awaited, we'll
        // immediately restore the current scope. So it shouldn't observable.
        //
        // This doesn't affect the case where the scope callback is async,
        // because we always require those calls to be awaited.
        //
        // TODO: In a future version, consider always requiring all `act` calls
        // to be awaited, regardless of whether the callback is sync or async.

        ReactCurrentActQueue.current = null;
      }

      return {
        then: function(resolve, reject) {
          didAwaitActCall = true;

          if (prevActScopeDepth === 0) {
            // If the `act` call is awaited, restore the queue we were
            // using before (see long comment above) so we can flush it.
            ReactCurrentActQueue.current = queue;
            enqueueTask(function() {
              return (
                // Recursively flush tasks scheduled by a microtask.
                recursivelyFlushAsyncActWork(returnValue, resolve, reject)
              );
            });
          } else {
            resolve(returnValue);
          }
        }
      };
    }
  }
}

function popActScope(prevActQueue, prevActScopeDepth) {
  {
    if (prevActScopeDepth !== actScopeDepth - 1) {
      error(
        "You seem to have overlapping act() calls, this is not supported. " +
          "Be sure to await previous act() calls before making a new one. "
      );
    }

    actScopeDepth = prevActScopeDepth;
  }
}

function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
  {
    // Check if any tasks were scheduled asynchronously.
    var queue = ReactCurrentActQueue.current;

    if (queue !== null) {
      if (queue.length !== 0) {
        // Async tasks were scheduled, mostly likely in a microtask.
        // Keep flushing until there are no more.
        try {
          flushActQueue(queue); // The work we just performed may have schedule additional async
          // tasks. Wait a macrotask and check again.

          enqueueTask(function() {
            return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
          });
        } catch (error) {
          // Leave remaining tasks on the queue if something throws.
          reject(error);
        }
      } else {
        // The queue is empty. We can finish.
        ReactCurrentActQueue.current = null;
        resolve(returnValue);
      }
    } else {
      resolve(returnValue);
    }
  }
}

var isFlushing = false;

function flushActQueue(queue) {
  {
    if (!isFlushing) {
      // Prevent re-entrance.
      isFlushing = true;
      var i = 0;

      try {
        for (; i < queue.length; i++) {
          var callback = queue[i];

          do {
            ReactCurrentActQueue.didUsePromise = false;
            var continuation = callback(false);

            if (continuation !== null) {
              if (ReactCurrentActQueue.didUsePromise) {
                // The component just suspended. Yield to the main thread in
                // case the promise is already resolved. If so, it will ping in
                // a microtask and we can resume without unwinding the stack.
                queue[i] = callback;
                queue.splice(0, i);
                return;
              }

              callback = continuation;
            } else {
              break;
            }
          } while (true);
        } // We flushed the entire queue.

        queue.length = 0;
      } catch (error) {
        // If something throws, leave the remaining callbacks on the queue.
        queue.splice(0, i + 1);
        throw error;
      } finally {
        isFlushing = false;
      }
    }
  }
} // Some of our warnings attempt to detect if the `act` call is awaited by
// checking in an asynchronous task. Wait a few microtasks before checking. The
// only reason one isn't sufficient is we want to accommodate the case where an
// `act` call is returned from an async function without first being awaited,
// since that's a somewhat common pattern. If you do this too many times in a
// nested sequence, you might get a warning, but you can always fix by awaiting
// the call.
//
// A macrotask would also work (and is the fallback) but depending on the test
// environment it may cause the warning to fire too late.

var queueSeveralMicrotasks =
  typeof queueMicrotask === "function"
    ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      }
    : enqueueTask;

var createElement$1 = createElementWithValidation;
var cloneElement$1 = cloneElementWithValidation;
var createFactory = createFactoryWithValidation;
var Children = {
  map: mapChildren,
  forEach: forEachChildren,
  count: countChildren,
  toArray: toArray,
  only: onlyChild
};

var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
var RESERVED_PROPS$1 = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};
var specialPropKeyWarningShown$1;
var specialPropRefWarningShown$1;
var didWarnAboutStringRefs$1;

{
  didWarnAboutStringRefs$1 = {};
}

function hasValidRef$1(config) {
  {
    if (hasOwnProperty.call(config, "ref")) {
      var getter = Object.getOwnPropertyDescriptor(config, "ref").get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.ref !== undefined;
}

function hasValidKey$1(config) {
  {
    if (hasOwnProperty.call(config, "key")) {
      var getter = Object.getOwnPropertyDescriptor(config, "key").get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.key !== undefined;
}

function warnIfStringRefCannotBeAutoConverted$1(config, self) {
  {
    if (
      typeof config.ref === "string" &&
      ReactCurrentOwner$1.current &&
      self &&
      ReactCurrentOwner$1.current.stateNode !== self
    ) {
      var componentName = getComponentNameFromType(
        ReactCurrentOwner$1.current.type
      );

      if (!didWarnAboutStringRefs$1[componentName]) {
        error(
          'Component "%s" contains the string ref "%s". ' +
            "Support for string refs will be removed in a future major release. " +
            "This case cannot be automatically converted to an arrow function. " +
            "We ask you to manually fix this case by using useRef() or createRef() instead. " +
            "Learn more about using refs safely here: " +
            "https://reactjs.org/link/strict-mode-string-ref",
          getComponentNameFromType(ReactCurrentOwner$1.current.type),
          config.ref
        );

        didWarnAboutStringRefs$1[componentName] = true;
      }
    }
  }
}

function defineKeyPropWarningGetter$1(props, displayName) {
  {
    var warnAboutAccessingKey = function() {
      if (!specialPropKeyWarningShown$1) {
        specialPropKeyWarningShown$1 = true;

        error(
          "%s: `key` is not a prop. Trying to access it will result " +
            "in `undefined` being returned. If you need to access the same " +
            "value within the child component, you should pass it as a different " +
            "prop. (https://reactjs.org/link/special-props)",
          displayName
        );
      }
    };

    warnAboutAccessingKey.isReactWarning = true;
    Object.defineProperty(props, "key", {
      get: warnAboutAccessingKey,
      configurable: true
    });
  }
}

function defineRefPropWarningGetter$1(props, displayName) {
  {
    var warnAboutAccessingRef = function() {
      if (!specialPropRefWarningShown$1) {
        specialPropRefWarningShown$1 = true;

        error(
          "%s: `ref` is not a prop. Trying to access it will result " +
            "in `undefined` being returned. If you need to access the same " +
            "value within the child component, you should pass it as a different " +
            "prop. (https://reactjs.org/link/special-props)",
          displayName
        );
      }
    };

    warnAboutAccessingRef.isReactWarning = true;
    Object.defineProperty(props, "ref", {
      get: warnAboutAccessingRef,
      configurable: true
    });
  }
}
/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, instanceof check
 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @internal
 */

var ReactElement$1 = function(type, key, ref, self, source, owner, props) {
  var element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,
    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,
    // Record the component responsible for creating this element.
    _owner: owner
  };

  {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {}; // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.

    Object.defineProperty(element._store, "validated", {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false
    }); // self and source are DEV only properties.

    Object.defineProperty(element, "_self", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self
    }); // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.

    Object.defineProperty(element, "_source", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source
    });

    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};
/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {object} props
 * @param {string} key
 */

function jsxDEV(type, config, maybeKey, source, self) {
  {
    var propName; // Reserved names are extracted

    var props = {};
    var key = null;
    var ref = null; // Currently, key can be spread in as a prop. This causes a potential
    // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
    // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
    // but as an intermediary step, we will use jsxDEV for everything except
    // <div {...props} key="Hi" />, because we aren't currently able to tell if
    // key is explicitly declared to be undefined or not.

    if (maybeKey !== undefined) {
      {
        checkKeyStringCoercion(maybeKey);
      }

      key = "" + maybeKey;
    }

    if (hasValidKey$1(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = "" + config.key;
    }

    if (hasValidRef$1(config)) {
      ref = config.ref;
      warnIfStringRefCannotBeAutoConverted$1(config, self);
    } // Remaining properties are added to a new props object

    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS$1.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    } // Resolve default props

    if (type && type.defaultProps) {
      var defaultProps = type.defaultProps;

      for (propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
        }
      }
    }

    if (key || ref) {
      var displayName =
        typeof type === "function"
          ? type.displayName || type.name || "Unknown"
          : type;

      if (key) {
        defineKeyPropWarningGetter$1(props, displayName);
      }

      if (ref) {
        defineRefPropWarningGetter$1(props, displayName);
      }
    }

    return ReactElement$1(
      type,
      key,
      ref,
      self,
      source,
      ReactCurrentOwner$1.current,
      props
    );
  }
}

var ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner;
var ReactDebugCurrentFrame$2 = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement$2(element) {
  {
    if (element) {
      var owner = element._owner;
      var stack = describeUnknownElementTypeFrameInDEV(
        element.type,
        element._source,
        owner ? owner.type : null
      );
      ReactDebugCurrentFrame$2.setExtraStackFrame(stack);
    } else {
      ReactDebugCurrentFrame$2.setExtraStackFrame(null);
    }
  }
}

var propTypesMisspellWarningShown$1;

{
  propTypesMisspellWarningShown$1 = false;
}
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */

function isValidElement$1(object) {
  {
    return (
      typeof object === "object" &&
      object !== null &&
      object.$$typeof === REACT_ELEMENT_TYPE
    );
  }
}

function getDeclarationErrorAddendum$1() {
  {
    if (ReactCurrentOwner$2.current) {
      var name = getComponentNameFromType(ReactCurrentOwner$2.current.type);

      if (name) {
        return "\n\nCheck the render method of `" + name + "`.";
      }
    }

    return "";
  }
}

function getSourceInfoErrorAddendum$1(source) {
  {
    if (source !== undefined) {
      var fileName = source.fileName.replace(/^.*[\\\/]/, "");
      var lineNumber = source.lineNumber;
      return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
    }

    return "";
  }
}
/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */

var ownerHasKeyUseWarning$1 = {};

function getCurrentComponentErrorInfo$1(parentType) {
  {
    var info = getDeclarationErrorAddendum$1();

    if (!info) {
      var parentName =
        typeof parentType === "string"
          ? parentType
          : parentType.displayName || parentType.name;

      if (parentName) {
        info =
          "\n\nCheck the top-level render call using <" + parentName + ">.";
      }
    }

    return info;
  }
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

function validateExplicitKey$1(element, parentType) {
  {
    if (!element._store || element._store.validated || element.key != null) {
      return;
    }

    element._store.validated = true;
    var currentComponentErrorInfo = getCurrentComponentErrorInfo$1(parentType);

    if (ownerHasKeyUseWarning$1[currentComponentErrorInfo]) {
      return;
    }

    ownerHasKeyUseWarning$1[currentComponentErrorInfo] = true; // Usually the current owner is the offender, but if it accepts children as a
    // property, it may be the creator of the child that's responsible for
    // assigning it a key.

    var childOwner = "";

    if (
      element &&
      element._owner &&
      element._owner !== ReactCurrentOwner$2.current
    ) {
      // Give the component that originally created this child.
      childOwner =
        " It was passed a child from " +
        getComponentNameFromType(element._owner.type) +
        ".";
    }

    setCurrentlyValidatingElement$2(element);

    error(
      'Each child in a list should have a unique "key" prop.' +
        "%s%s See https://reactjs.org/link/warning-keys for more information.",
      currentComponentErrorInfo,
      childOwner
    );

    setCurrentlyValidatingElement$2(null);
  }
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

function validateChildKeys$1(node, parentType) {
  {
    if (typeof node !== "object") {
      return;
    }

    if (isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        var child = node[i];

        if (isValidElement$1(child)) {
          validateExplicitKey$1(child, parentType);
        }
      }
    } else if (isValidElement$1(node)) {
      // This element was passed in a valid location.
      if (node._store) {
        node._store.validated = true;
      }
    } else if (node) {
      var iteratorFn = getIteratorFn(node);

      if (typeof iteratorFn === "function") {
        // Entry iterators used to provide implicit keys,
        // but now we print a separate warning for them later.
        if (iteratorFn !== node.entries) {
          var iterator = iteratorFn.call(node);
          var step;

          while (!(step = iterator.next()).done) {
            if (isValidElement$1(step.value)) {
              validateExplicitKey$1(step.value, parentType);
            }
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

function validatePropTypes$1(element) {
  {
    var type = element.type;

    if (type === null || type === undefined || typeof type === "string") {
      return;
    }

    var propTypes;

    if (typeof type === "function") {
      propTypes = type.propTypes;
    } else if (
      typeof type === "object" &&
      (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        type.$$typeof === REACT_MEMO_TYPE)
    ) {
      propTypes = type.propTypes;
    } else {
      return;
    }

    if (propTypes) {
      // Intentionally inside to avoid triggering lazy initializers:
      var name = getComponentNameFromType(type);
      checkPropTypes(propTypes, element.props, "prop", name, element);
    } else if (
      type.PropTypes !== undefined &&
      !propTypesMisspellWarningShown$1
    ) {
      propTypesMisspellWarningShown$1 = true; // Intentionally inside to avoid triggering lazy initializers:

      var _name = getComponentNameFromType(type);

      error(
        "Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?",
        _name || "Unknown"
      );
    }

    if (
      typeof type.getDefaultProps === "function" &&
      !type.getDefaultProps.isReactClassApproved
    ) {
      error(
        "getDefaultProps is only used on classic React.createClass " +
          "definitions. Use a static property named `defaultProps` instead."
      );
    }
  }
}
/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */

function validateFragmentProps$1(fragment) {
  {
    var keys = Object.keys(fragment.props);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (key !== "children" && key !== "key") {
        setCurrentlyValidatingElement$2(fragment);

        error(
          "Invalid prop `%s` supplied to `React.Fragment`. " +
            "React.Fragment can only have `key` and `children` props.",
          key
        );

        setCurrentlyValidatingElement$2(null);
        break;
      }
    }

    if (fragment.ref !== null) {
      setCurrentlyValidatingElement$2(fragment);

      error("Invalid attribute `ref` supplied to `React.Fragment`.");

      setCurrentlyValidatingElement$2(null);
    }
  }
}

var didWarnAboutKeySpread = {};
function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
  {
    var validType = isValidElementType(type); // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.

    if (!validType) {
      var info = "";

      if (
        type === undefined ||
        (typeof type === "object" &&
          type !== null &&
          Object.keys(type).length === 0)
      ) {
        info +=
          " You likely forgot to export your component from the file " +
          "it's defined in, or you might have mixed up default and named imports.";
      }

      var sourceInfo = getSourceInfoErrorAddendum$1(source);

      if (sourceInfo) {
        info += sourceInfo;
      } else {
        info += getDeclarationErrorAddendum$1();
      }

      var typeString;

      if (type === null) {
        typeString = "null";
      } else if (isArray(type)) {
        typeString = "array";
      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
        typeString =
          "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
        info =
          " Did you accidentally export a JSX literal instead of a component?";
      } else {
        typeString = typeof type;
      }

      error(
        "React.jsx: type is invalid -- expected a string (for " +
          "built-in components) or a class/function (for composite " +
          "components) but got: %s.%s",
        typeString,
        info
      );
    }

    var element = jsxDEV(type, props, key, source, self); // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.

    if (element == null) {
      return element;
    } // Skip key warning if the type isn't valid since our key validation logic
    // doesn't expect a non-string/function type and can throw confusing errors.
    // We don't want exception behavior to differ between dev and prod.
    // (Rendering will throw with a helpful message and as soon as the type is
    // fixed, the key warnings will appear.)

    if (validType) {
      var children = props.children;

      if (children !== undefined) {
        if (isStaticChildren) {
          if (isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              validateChildKeys$1(children[i], type);
            }

            if (Object.freeze) {
              Object.freeze(children);
            }
          } else {
            error(
              "React.jsx: Static children should always be an array. " +
                "You are likely explicitly calling React.jsxs or React.jsxDEV. " +
                "Use the Babel transform instead."
            );
          }
        } else {
          validateChildKeys$1(children, type);
        }
      }
    }

    if (warnAboutSpreadingKeyToJSX) {
      if (hasOwnProperty.call(props, "key")) {
        var componentName = getComponentNameFromType(type);
        var keys = Object.keys(props).filter(function(k) {
          return k !== "key";
        });
        var beforeExample =
          keys.length > 0
            ? "{key: someKey, " + keys.join(": ..., ") + ": ...}"
            : "{key: someKey}";

        if (!didWarnAboutKeySpread[componentName + beforeExample]) {
          var afterExample =
            keys.length > 0 ? "{" + keys.join(": ..., ") + ": ...}" : "{}";

          error(
            'A props object containing a "key" prop is being spread into JSX:\n' +
              "  let props = %s;\n" +
              "  <%s {...props} />\n" +
              "React keys must be passed directly to JSX without using spread:\n" +
              "  let props = %s;\n" +
              "  <%s key={someKey} {...props} />",
            beforeExample,
            componentName,
            afterExample,
            componentName
          );

          didWarnAboutKeySpread[componentName + beforeExample] = true;
        }
      }
    }

    if (type === REACT_FRAGMENT_TYPE) {
      validateFragmentProps$1(element);
    } else {
      validatePropTypes$1(element);
    }

    return element;
  }
} // These two functions exist to still get child warnings in dev
// even with the prod transform. This means that jsxDEV is purely
// opt-in behavior for better messages but that we won't stop
// giving you warnings if you use production apis.

function jsxWithValidationStatic(type, props, key) {
  {
    return jsxWithValidation(type, props, key, true);
  }
}
function jsxWithValidationDynamic(type, props, key) {
  {
    return jsxWithValidation(type, props, key, false);
  }
}

var jsx = jsxWithValidationDynamic; // we may want to special case jsxs internally to take advantage of static children.
// for now we can ship identical prod functions

var jsxs = jsxWithValidationStatic;
var jsxDEV$1 = jsxWithValidation;

exports.Children = Children;
exports.Component = Component;
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.Profiler = REACT_PROFILER_TYPE;
exports.PureComponent = PureComponent;
exports.StrictMode = REACT_STRICT_MODE_TYPE;
exports.Suspense = REACT_SUSPENSE_TYPE;
exports.SuspenseList = REACT_SUSPENSE_LIST_TYPE;
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
exports.cache = cache;
exports.cloneElement = cloneElement$1;
exports.createContext = createContext;
exports.createElement = createElement$1;
exports.createFactory = createFactory;
exports.createMutableSource = createMutableSource;
exports.createRef = createRef;
exports.createServerContext = createServerContext;
exports.experimental_useEffectEvent = useEffectEvent;
exports.forwardRef = forwardRef;
exports.isValidElement = isValidElement;
exports.jsx = jsx;
exports.jsxDEV = jsxDEV$1;
exports.jsxs = jsxs;
exports.lazy = lazy;
exports.memo = memo;
exports.startTransition = startTransition;
exports.unstable_Cache = REACT_CACHE_TYPE;
exports.unstable_DebugTracingMode = REACT_DEBUG_TRACING_MODE_TYPE;
exports.unstable_LegacyHidden = REACT_LEGACY_HIDDEN_TYPE;
exports.unstable_Offscreen = REACT_OFFSCREEN_TYPE;
exports.unstable_Scope = REACT_SCOPE_TYPE;
exports.unstable_SuspenseList = REACT_SUSPENSE_LIST_TYPE;
exports.unstable_TracingMarker = REACT_TRACING_MARKER_TYPE;
exports.unstable_act = act;
exports.unstable_createMutableSource = createMutableSource;
exports.unstable_getCacheForType = getCacheForType;
exports.unstable_getCacheSignal = getCacheSignal;
exports.unstable_startTransition = startTransition;
exports.unstable_useCacheRefresh = useCacheRefresh;
exports.unstable_useDeferredValue = useDeferredValue;
exports.unstable_useMemoCache = useMemoCache;
exports.unstable_useMutableSource = useMutableSource;
exports.unstable_useTransition = useTransition;
exports.use = use;
exports.useCallback = useCallback;
exports.useContext = useContext;
exports.useDebugValue = useDebugValue;
exports.useDeferredValue = useDeferredValue;
exports.useEffect = useEffect;
exports.useId = useId;
exports.useImperativeHandle = useImperativeHandle;
exports.useInsertionEffect = useInsertionEffect;
exports.useLayoutEffect = useLayoutEffect;
exports.useMemo = useMemo;
exports.useMutableSource = useMutableSource;
exports.useReducer = useReducer;
exports.useRef = useRef;
exports.useState = useState;
exports.useSyncExternalStore = useSyncExternalStore;
exports.useTransition = useTransition;
exports.version = ReactVersion;

          /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop ===
    'function'
) {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
}
        
  })();
}
