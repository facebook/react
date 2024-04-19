/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @generated SignedSource<<1ccd58cd787da0b40cbf5543503953db>>
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
          var dynamicFlagsUntyped = require('ReactNativeInternalFeatureFlags');

var ReactVersion = '19.0.0-canary-c627bf44';

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
var REACT_ELEMENT_TYPE = Symbol.for('react.element');
var REACT_PORTAL_TYPE = Symbol.for('react.portal');
var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
var REACT_PROVIDER_TYPE = Symbol.for('react.provider'); // TODO: Delete with enableRenderableContext

var REACT_CONSUMER_TYPE = Symbol.for('react.consumer');
var REACT_CONTEXT_TYPE = Symbol.for('react.context');
var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
var REACT_MEMO_TYPE = Symbol.for('react.memo');
var REACT_LAZY_TYPE = Symbol.for('react.lazy');
var REACT_SCOPE_TYPE = Symbol.for('react.scope');
var REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for('react.debug_trace_mode');
var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
var REACT_LEGACY_HIDDEN_TYPE = Symbol.for('react.legacy_hidden');
var REACT_TRACING_MARKER_TYPE = Symbol.for('react.tracing_marker');
var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator';
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }

  var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }

  return null;
}

// Re-export dynamic flags from the internal module.
var dynamicFlags = dynamicFlagsUntyped; // We destructure each value before re-exporting to avoid a dynamic look-up on
// the exports object every time a flag is read.

var enableAsyncActions = dynamicFlags.enableAsyncActions,
    enableComponentStackLocations = dynamicFlags.enableComponentStackLocations,
    enableRenderableContext = dynamicFlags.enableRenderableContext,
    disableDefaultPropsExceptForClasses = dynamicFlags.disableDefaultPropsExceptForClasses; // The rest of the flags are static for better dead code elimination.
var enableDebugTracing = false;
var enableScopeAPI = false;
var enableLegacyHidden = false;
var enableTransitionTracing = false;
// because JSX is an extremely hot path.

var enableRefAsProp = false;
var disableLegacyMode = false;

var ReactSharedInternals = {
  H: null,
  C: null,
  T: null
};

{
  ReactSharedInternals.owner = null;
}

{
  ReactSharedInternals.actQueue = null;
  ReactSharedInternals.isBatchingLegacy = false;
  ReactSharedInternals.didScheduleLegacyUpdate = false;
  ReactSharedInternals.didUsePromise = false;
  ReactSharedInternals.thrownErrors = [];
  var currentExtraStackFrame = null;

  ReactSharedInternals.setExtraStackFrame = function (stack) {
    currentExtraStackFrame = stack;
  }; // Stack implementation injected by the current renderer.


  ReactSharedInternals.getCurrentStack = null;

  ReactSharedInternals.getStackAddendum = function () {
    var stack = ''; // Add an extra top frame while an element is being validated

    if (currentExtraStackFrame) {
      stack += currentExtraStackFrame;
    } // Delegate to the injected renderer-specific implementation


    var impl = ReactSharedInternals.getCurrentStack;

    if (impl) {
      stack += impl() || '';
    }

    return stack;
  };
}

// by calls to these methods by a Babel plugin.
//
// In PROD (or in packages without access to React internals),
// they are left as they are instead.

function warn(format) {
  {
    {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      printWarning('warn', format, args);
    }
  }
}
function error(format) {
  {
    {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      printWarning('error', format, args);
    }
  }
}

function printWarning(level, format, args) {
  // When changing this logic, you might want to also
  // update consoleWithStackDev.www.js as well.
  {
    var stack = ReactSharedInternals.getStackAddendum();

    if (stack !== '') {
      format += '%s';
      args = args.concat([stack]);
    } // eslint-disable-next-line react-internal/safe-string-coercion


    var argsWithFormat = args.map(function (item) {
      return String(item);
    }); // Careful: RN currently depends on this prefix

    argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
    // breaks IE9: https://github.com/facebook/react/issues/13610
    // eslint-disable-next-line react-internal/no-production-logging

    Function.prototype.apply.call(console[level], console, argsWithFormat);
  }
}

var didWarnStateUpdateForUnmountedComponent = {};

function warnNoop(publicInstance, callerName) {
  {
    var _constructor = publicInstance.constructor;
    var componentName = _constructor && (_constructor.displayName || _constructor.name) || 'ReactClass';
    var warningKey = componentName + "." + callerName;

    if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
      return;
    }

    error("Can't call %s on a component that is not yet mounted. " + 'This is a no-op, but it might indicate a bug in your application. ' + 'Instead, assign to `this.state` directly or define a `state = {};` ' + 'class property with the desired state in the %s component.', callerName, componentName);

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
  isMounted: function (publicInstance) {
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
  enqueueForceUpdate: function (publicInstance, callback, callerName) {
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
  enqueueReplaceState: function (publicInstance, completeState, callback, callerName) {
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
  enqueueSetState: function (publicInstance, partialState, callback, callerName) {
    warnNoop(publicInstance, 'setState');
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

Component.prototype.setState = function (partialState, callback) {
  if (typeof partialState !== 'object' && typeof partialState !== 'function' && partialState != null) {
    throw new Error('takes an object of state variables to update or a ' + 'function which returns an object of state variables.');
  }

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


Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};
/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */


{
  var deprecatedAPIs = {
    isMounted: ['isMounted', 'Instead, make sure to clean up subscriptions and pending requests in ' + 'componentWillUnmount to prevent memory leaks.'],
    replaceState: ['replaceState', 'Refactor your code to use setState instead (see ' + 'https://github.com/facebook/react/issues/3236).']
  };

  var defineDeprecationWarning = function (methodName, info) {
    Object.defineProperty(Component.prototype, methodName, {
      get: function () {
        warn('%s(...) is deprecated in plain JavaScript React classes. %s', info[0], info[1]);

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

var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
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
// $FlowFixMe[incompatible-return] only called in DEV, so void return is not possible.
function typeName(value) {
  {
    // toStringTag is needed for namespaced types like Temporal.Instant
    var hasToStringTag = typeof Symbol === 'function' && Symbol.toStringTag;
    var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || 'Object'; // $FlowFixMe[incompatible-return]

    return type;
  }
} // $FlowFixMe[incompatible-return] only called in DEV, so void return is not possible.


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
  return '' + value;
}
function checkKeyStringCoercion(value) {
  {
    if (willCoercionThrow(value)) {
      error('The provided key is an unsupported type %s.' + ' This value must be coerced to a string before using it here.', typeName(value));

      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
    }
  }
}
function checkPropStringCoercion(value, propName) {
  {
    if (willCoercionThrow(value)) {
      error('The provided `%s` prop is an unsupported type %s.' + ' This value must be coerced to a string before using it here.', propName, typeName(value));

      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
    }
  }
}

function getWrappedName$1(outerType, innerType, wrapperName) {
  var displayName = outerType.displayName;

  if (displayName) {
    return displayName;
  }

  var functionName = innerType.displayName || innerType.name || '';
  return functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName;
} // Keep in sync with react-reconciler/getComponentNameFromFiber


function getContextName$1(type) {
  return type.displayName || 'Context';
}

var REACT_CLIENT_REFERENCE$2 = Symbol.for('react.client.reference'); // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.

function getComponentNameFromType(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }

  if (typeof type === 'function') {
    if (type.$$typeof === REACT_CLIENT_REFERENCE$2) {
      // TODO: Create a convention for naming client references with debug info.
      return null;
    }

    return type.displayName || type.name || null;
  }

  if (typeof type === 'string') {
    return type;
  }

  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return 'Fragment';

    case REACT_PORTAL_TYPE:
      return 'Portal';

    case REACT_PROFILER_TYPE:
      return 'Profiler';

    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode';

    case REACT_SUSPENSE_TYPE:
      return 'Suspense';

    case REACT_SUSPENSE_LIST_TYPE:
      return 'SuspenseList';

  }

  if (typeof type === 'object') {
    {
      if (typeof type.tag === 'number') {
        error('Received an unexpected object in getComponentNameFromType(). ' + 'This is likely a bug in React. Please file an issue.');
      }
    }

    switch (type.$$typeof) {
      case REACT_PROVIDER_TYPE:
        if (enableRenderableContext) {
          return null;
        } else {
          var provider = type;
          return getContextName$1(provider._context) + '.Provider';
        }

      case REACT_CONTEXT_TYPE:
        var context = type;

        if (enableRenderableContext) {
          return getContextName$1(context) + '.Provider';
        } else {
          return getContextName$1(context) + '.Consumer';
        }

      case REACT_CONSUMER_TYPE:
        if (enableRenderableContext) {
          var consumer = type;
          return getContextName$1(consumer._context) + '.Consumer';
        } else {
          return null;
        }

      case REACT_FORWARD_REF_TYPE:
        return getWrappedName$1(type, type.render, 'ForwardRef');

      case REACT_MEMO_TYPE:
        var outerName = type.displayName || null;

        if (outerName !== null) {
          return outerName;
        }

        return getComponentNameFromType(type.type) || 'Memo';

      case REACT_LAZY_TYPE:
        {
          var lazyComponent = type;
          var payload = lazyComponent._payload;
          var init = lazyComponent._init;

          try {
            return getComponentNameFromType(init(payload));
          } catch (x) {
            return null;
          }
        }
    }
  }

  return null;
}

// $FlowFixMe[method-unbinding]
var hasOwnProperty = Object.prototype.hasOwnProperty;

var REACT_CLIENT_REFERENCE$1 = Symbol.for('react.client.reference');
function isValidElementType(type) {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).


  if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing  || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden  || type === REACT_OFFSCREEN_TYPE || enableScopeAPI  || enableTransitionTracing ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || !enableRenderableContext && type.$$typeof === REACT_PROVIDER_TYPE || enableRenderableContext && type.$$typeof === REACT_CONSUMER_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
    // types supported by any Flight configuration anywhere since
    // we don't know which Flight build this will end up being used
    // with.
    type.$$typeof === REACT_CLIENT_REFERENCE$1 || type.getModuleId !== undefined) {
      return true;
    }
  }

  return false;
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
      }; // $FlowFixMe[cannot-write] Flow thinks console is immutable.

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
      }; // $FlowFixMe[cannot-write] Flow thinks console is immutable.

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
      error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
    }
  }
}

var prefix;
function describeBuiltInComponentFrame(name) {
  if (enableComponentStackLocations) {
    if (prefix === undefined) {
      // Extract the VM specific prefix used by each line.
      try {
        throw Error();
      } catch (x) {
        var match = x.stack.trim().match(/\n( *(at )?)/);
        prefix = match && match[1] || '';
      }
    } // We use the prefix to ensure our stacks line up with native stack frames.


    return '\n' + prefix + name;
  } else {
    return describeComponentFrame(name);
  }
}
var reentry = false;
var componentFrameCache;

{
  var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
  componentFrameCache = new PossiblyWeakMap();
}
/**
 * Leverages native browser/VM stack frames to get proper details (e.g.
 * filename, line + col number) for a single component in a component stack. We
 * do this by:
 *   (1) throwing and catching an error in the function - this will be our
 *       control error.
 *   (2) calling the component which will eventually throw an error that we'll
 *       catch - this will be our sample error.
 *   (3) diffing the control and sample error stacks to find the stack frame
 *       which represents our component.
 */


function describeNativeComponentFrame(fn, construct) {
  // If something asked for a stack inside a fake render, it should get ignored.
  if (!fn || reentry) {
    return '';
  }

  {
    var frame = componentFrameCache.get(fn);

    if (frame !== undefined) {
      return frame;
    }
  }

  reentry = true;
  var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe[incompatible-type] It does accept undefined.

  Error.prepareStackTrace = undefined;
  var previousDispatcher = null;

  {
    previousDispatcher = ReactSharedInternals.H; // Set the dispatcher in DEV because this might be call in the render function
    // for warnings.

    ReactSharedInternals.H = null;
    disableLogs();
  }
  /**
   * Finding a common stack frame between sample and control errors can be
   * tricky given the different types and levels of stack trace truncation from
   * different JS VMs. So instead we'll attempt to control what that common
   * frame should be through this object method:
   * Having both the sample and control errors be in the function under the
   * `DescribeNativeComponentFrameRoot` property, + setting the `name` and
   * `displayName` properties of the function ensures that a stack
   * frame exists that has the method name `DescribeNativeComponentFrameRoot` in
   * it for both control and sample stacks.
   */


  var RunInRootFrame = {
    DetermineComponentFrameRoot: function () {
      var control;

      try {
        // This should throw.
        if (construct) {
          // Something should be setting the props in the constructor.
          var Fake = function () {
            throw Error();
          }; // $FlowFixMe[prop-missing]


          Object.defineProperty(Fake.prototype, 'props', {
            set: function () {
              // We use a throwing setter instead of frozen or non-writable props
              // because that won't throw in a non-strict mode function.
              throw Error();
            }
          });

          if (typeof Reflect === 'object' && Reflect.construct) {
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


          var maybePromise = fn(); // If the function component returns a promise, it's likely an async
          // component, which we don't yet support. Attach a noop catch handler to
          // silence the error.
          // TODO: Implement component stacks for async client components?

          if (maybePromise && typeof maybePromise.catch === 'function') {
            maybePromise.catch(function () {});
          }
        }
      } catch (sample) {
        // This is inlined manually because closure doesn't do it for us.
        if (sample && control && typeof sample.stack === 'string') {
          return [sample.stack, control.stack];
        }
      }

      return [null, null];
    }
  }; // $FlowFixMe[prop-missing]

  RunInRootFrame.DetermineComponentFrameRoot.displayName = 'DetermineComponentFrameRoot';
  var namePropDescriptor = Object.getOwnPropertyDescriptor(RunInRootFrame.DetermineComponentFrameRoot, 'name'); // Before ES6, the `name` property was not configurable.

  if (namePropDescriptor && namePropDescriptor.configurable) {
    // V8 utilizes a function's `name` property when generating a stack trace.
    Object.defineProperty(RunInRootFrame.DetermineComponentFrameRoot, // Configurable properties can be updated even if its writable descriptor
    // is set to `false`.
    // $FlowFixMe[cannot-write]
    'name', {
      value: 'DetermineComponentFrameRoot'
    });
  }

  try {
    var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(),
        sampleStack = _RunInRootFrame$Deter[0],
        controlStack = _RunInRootFrame$Deter[1];

    if (sampleStack && controlStack) {
      // This extracts the first frame from the sample that isn't also in the control.
      // Skipping one frame that we assume is the frame that calls the two.
      var sampleLines = sampleStack.split('\n');
      var controlLines = controlStack.split('\n');
      var s = 0;
      var c = 0;

      while (s < sampleLines.length && !sampleLines[s].includes('DetermineComponentFrameRoot')) {
        s++;
      }

      while (c < controlLines.length && !controlLines[c].includes('DetermineComponentFrameRoot')) {
        c++;
      } // We couldn't find our intentionally injected common root frame, attempt
      // to find another common root frame by search from the bottom of the
      // control stack...


      if (s === sampleLines.length || c === controlLines.length) {
        s = sampleLines.length - 1;
        c = controlLines.length - 1;

        while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
          // We expect at least one stack frame to be shared.
          // Typically this will be the root most one. However, stack frames may be
          // cut off due to maximum stack limits. In this case, one maybe cut off
          // earlier than the other. We assume that the sample is longer or the same
          // and there for cut off earlier. So we should find the root most frame in
          // the sample somewhere in the control.
          c--;
        }
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
                var _frame = '\n' + sampleLines[s].replace(' at new ', ' at '); // If our component frame is labeled "<anonymous>"
                // but we have a user-provided "displayName"
                // splice it in to make the stack more readable.


                if (fn.displayName && _frame.includes('<anonymous>')) {
                  _frame = _frame.replace('<anonymous>', fn.displayName);
                }

                if (true) {
                  if (typeof fn === 'function') {
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
      ReactSharedInternals.H = previousDispatcher;
      reenableLogs();
    }

    Error.prepareStackTrace = previousPrepareStackTrace;
  } // Fallback to just using the name if we couldn't make it throw.


  var name = fn ? fn.displayName || fn.name : '';
  var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';

  {
    if (typeof fn === 'function') {
      componentFrameCache.set(fn, syntheticFrame);
    }
  }

  return syntheticFrame;
}

function describeComponentFrame(name) {
  return '\n    in ' + (name || 'Unknown');
}
function describeFunctionComponentFrame(fn) {
  if (enableComponentStackLocations) {
    return describeNativeComponentFrame(fn, false);
  } else {
    if (!fn) {
      return '';
    }

    var name = fn.displayName || fn.name || null;
    return describeComponentFrame(name);
  }
}

function shouldConstruct(Component) {
  var prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

function describeUnknownElementTypeFrameInDEV(type) {

  if (type == null) {
    return '';
  }

  if (typeof type === 'function') {
    if (enableComponentStackLocations) {
      return describeNativeComponentFrame(type, shouldConstruct(type));
    } else {
      return describeFunctionComponentFrame(type);
    }
  }

  if (typeof type === 'string') {
    return describeBuiltInComponentFrame(type);
  }

  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return describeBuiltInComponentFrame('Suspense');

    case REACT_SUSPENSE_LIST_TYPE:
      return describeBuiltInComponentFrame('SuspenseList');
  }

  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeFunctionComponentFrame(type.render);

      case REACT_MEMO_TYPE:
        // Memo may contain any component type so we recursively resolve it.
        return describeUnknownElementTypeFrameInDEV(type.type);

      case REACT_LAZY_TYPE:
        {
          var lazyComponent = type;
          var payload = lazyComponent._payload;
          var init = lazyComponent._init;

          try {
            // Lazy may contain any component type so we recursively resolve it.
            return describeUnknownElementTypeFrameInDEV(init(payload));
          } catch (x) {}
        }
    }
  }

  return '';
}

var FunctionComponent = 0;
var ClassComponent = 1;
var HostRoot = 3; // Root of a host tree. Could be nested inside another node.

var HostPortal = 4; // A subtree. Could be an entry point to a different renderer.

var HostComponent = 5;
var HostText = 6;
var Fragment = 7;
var Mode = 8;
var ContextConsumer = 9;
var ContextProvider = 10;
var ForwardRef = 11;
var Profiler = 12;
var SuspenseComponent = 13;
var MemoComponent = 14;
var SimpleMemoComponent = 15;
var LazyComponent = 16;
var IncompleteClassComponent = 17;
var DehydratedFragment = 18;
var SuspenseListComponent = 19;
var ScopeComponent = 21;
var OffscreenComponent = 22;
var CacheComponent = 24;
var TracingMarkerComponent = 25;
var HostHoistable = 26;
var HostSingleton = 27;
var IncompleteFunctionComponent = 28;

function getWrappedName(outerType, innerType, wrapperName) {
  var functionName = innerType.displayName || innerType.name || '';
  return outerType.displayName || (functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName);
} // Keep in sync with shared/getComponentNameFromType


function getContextName(type) {
  return type.displayName || 'Context';
}
function getComponentNameFromFiber(fiber) {
  var tag = fiber.tag,
      type = fiber.type;

  switch (tag) {
    case CacheComponent:
      return 'Cache';

    case ContextConsumer:
      if (enableRenderableContext) {
        var consumer = type;
        return getContextName(consumer._context) + '.Consumer';
      } else {
        var context = type;
        return getContextName(context) + '.Consumer';
      }

    case ContextProvider:
      if (enableRenderableContext) {
        var _context = type;
        return getContextName(_context) + '.Provider';
      } else {
        var provider = type;
        return getContextName(provider._context) + '.Provider';
      }

    case DehydratedFragment:
      return 'DehydratedFragment';

    case ForwardRef:
      return getWrappedName(type, type.render, 'ForwardRef');

    case Fragment:
      return 'Fragment';

    case HostHoistable:
    case HostSingleton:
    case HostComponent:
      // Host component type is the display name (e.g. "div", "View")
      return type;

    case HostPortal:
      return 'Portal';

    case HostRoot:
      return 'Root';

    case HostText:
      return 'Text';

    case LazyComponent:
      // Name comes from the type in this case; we don't have a tag.
      return getComponentNameFromType(type);

    case Mode:
      if (type === REACT_STRICT_MODE_TYPE) {
        // Don't be less specific than shared/getComponentNameFromType
        return 'StrictMode';
      }

      return 'Mode';

    case OffscreenComponent:
      return 'Offscreen';

    case Profiler:
      return 'Profiler';

    case ScopeComponent:
      return 'Scope';

    case SuspenseComponent:
      return 'Suspense';

    case SuspenseListComponent:
      return 'SuspenseList';

    case TracingMarkerComponent:
      return 'TracingMarker';
    // The display name for these tags come from the user-provided type:

    case IncompleteClassComponent:
    case IncompleteFunctionComponent:

    // Fallthrough

    case ClassComponent:
    case FunctionComponent:
    case MemoComponent:
    case SimpleMemoComponent:
      if (typeof type === 'function') {
        return type.displayName || type.name || null;
      }

      if (typeof type === 'string') {
        return type;
      }

      break;

  }

  return null;
}

var REACT_CLIENT_REFERENCE = Symbol.for('react.client.reference');
var specialPropKeyWarningShown;
var specialPropRefWarningShown;
var didWarnAboutStringRefs;
var didWarnAboutOldJSXRuntime;

{
  didWarnAboutStringRefs = {};
}

function hasValidRef(config) {
  {
    if (hasOwnProperty.call(config, 'ref')) {
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
    if (hasOwnProperty.call(config, 'key')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.key !== undefined;
}

function warnIfStringRefCannotBeAutoConverted(config, self) {
  {
    if (typeof config.ref === 'string' && ReactSharedInternals.owner && self && ReactSharedInternals.owner.stateNode !== self) {
      var componentName = getComponentNameFromType(ReactSharedInternals.owner.type);

      if (!didWarnAboutStringRefs[componentName]) {
        error('Component "%s" contains the string ref "%s". ' + 'Support for string refs will be removed in a future major release. ' + 'This case cannot be automatically converted to an arrow function. ' + 'We ask you to manually fix this case by using useRef() or createRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://react.dev/link/strict-mode-string-ref', getComponentNameFromType(ReactSharedInternals.owner.type), config.ref);

        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }
}

function defineKeyPropWarningGetter(props, displayName) {
  {
    var warnAboutAccessingKey = function () {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;

        error('%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://react.dev/link/special-props)', displayName);
      }
    };

    warnAboutAccessingKey.isReactWarning = true;
    Object.defineProperty(props, 'key', {
      get: warnAboutAccessingKey,
      configurable: true
    });
  }
}

function defineRefPropWarningGetter(props, displayName) {
  {
    {
      var warnAboutAccessingRef = function () {
        if (!specialPropRefWarningShown) {
          specialPropRefWarningShown = true;

          error('%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://react.dev/link/special-props)', displayName);
        }
      };

      warnAboutAccessingRef.isReactWarning = true;
      Object.defineProperty(props, 'ref', {
        get: warnAboutAccessingRef,
        configurable: true
      });
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


function ReactElement(type, key, _ref, self, source, owner, props) {
  var ref;

  {
    ref = _ref;
  }

  var element;

  {
    // In prod, `ref` is a regular property. It will be removed in a
    // future release.
    element = {
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
  }

  {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {}; // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.

    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false
    }); // debugInfo contains Server Component debug information.

    Object.defineProperty(element, '_debugInfo', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null
    });

    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
}
// support `jsx` and `jsxs` when running in development. This supports the case
// where a third-party dependency ships code that was compiled for production;
// we want to still provide warnings in development.
//
// So these functions are the _dev_ implementations of the _production_
// API signatures.
//
// Since these functions are dev-only, it's ok to add an indirection here. They
// only exist to provide different versions of `isStaticChildren`. (We shouldn't
// use this pattern for the prod versions, though, because it will add an call
// frame.)

function jsxProdSignatureRunningInDevWithDynamicChildren(type, config, maybeKey, source, self) {
  {
    var isStaticChildren = false;
    return jsxDEV$1(type, config, maybeKey, isStaticChildren, source, self);
  }
}
function jsxProdSignatureRunningInDevWithStaticChildren(type, config, maybeKey, source, self) {
  {
    var isStaticChildren = true;
    return jsxDEV$1(type, config, maybeKey, isStaticChildren, source, self);
  }
}
var didWarnAboutKeySpread = {};
/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {object} props
 * @param {string} key
 */

function jsxDEV$1(type, config, maybeKey, isStaticChildren, source, self) {
  {
    if (!isValidElementType(type)) {
      // This is an invalid element type.
      //
      // We warn in this case but don't throw. We expect the element creation to
      // succeed and there will likely be errors in render.
      var info = '';

      if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
        info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and named imports.";
      }

      var typeString;

      if (type === null) {
        typeString = 'null';
      } else if (isArray(type)) {
        typeString = 'array';
      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
        typeString = "<" + (getComponentNameFromType(type.type) || 'Unknown') + " />";
        info = ' Did you accidentally export a JSX literal instead of a component?';
      } else {
        typeString = typeof type;
      }

      error('React.jsx: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', typeString, info);
    } else {
      // This is a valid element type.
      // Skip key warning if the type isn't valid since our key validation logic
      // doesn't expect a non-string/function type and can throw confusing
      // errors. We don't want exception behavior to differ between dev and
      // prod. (Rendering will throw with a helpful message and as soon as the
      // type is fixed, the key warnings will appear.)
      var children = config.children;

      if (children !== undefined) {
        if (isStaticChildren) {
          if (isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              validateChildKeys(children[i], type);
            }

            if (Object.freeze) {
              Object.freeze(children);
            }
          } else {
            error('React.jsx: Static children should always be an array. ' + 'You are likely explicitly calling React.jsxs or React.jsxDEV. ' + 'Use the Babel transform instead.');
          }
        } else {
          validateChildKeys(children, type);
        }
      }
    } // Warn about key spread regardless of whether the type is valid.


    if (hasOwnProperty.call(config, 'key')) {
      var componentName = getComponentNameFromType(type);
      var keys = Object.keys(config).filter(function (k) {
        return k !== 'key';
      });
      var beforeExample = keys.length > 0 ? '{key: someKey, ' + keys.join(': ..., ') + ': ...}' : '{key: someKey}';

      if (!didWarnAboutKeySpread[componentName + beforeExample]) {
        var afterExample = keys.length > 0 ? '{' + keys.join(': ..., ') + ': ...}' : '{}';

        error('A props object containing a "key" prop is being spread into JSX:\n' + '  let props = %s;\n' + '  <%s {...props} />\n' + 'React keys must be passed directly to JSX without using spread:\n' + '  let props = %s;\n' + '  <%s key={someKey} {...props} />', beforeExample, componentName, afterExample, componentName);

        didWarnAboutKeySpread[componentName + beforeExample] = true;
      }
    }

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

      key = '' + maybeKey;
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = '' + config.key;
    }

    if (hasValidRef(config)) {
      {
        ref = config.ref;

        {
          ref = coerceStringRef(ref, ReactSharedInternals.owner, type);
        }
      }

      {
        warnIfStringRefCannotBeAutoConverted(config, self);
      }
    }

    var props;

    {
      // We need to remove reserved props (key, prop, ref). Create a fresh props
      // object and copy over all the non-reserved props. We don't use `delete`
      // because in V8 it will deopt the object to dictionary mode.
      props = {};

      for (var propName in config) {
        // Skip over reserved prop names
        if (propName !== 'key' && (propName !== 'ref')) {
          {
            props[propName] = config[propName];
          }
        }
      }
    }

    if (!disableDefaultPropsExceptForClasses) {
      // Resolve default props
      if (type && type.defaultProps) {
        var defaultProps = type.defaultProps;

        for (var _propName2 in defaultProps) {
          if (props[_propName2] === undefined) {
            props[_propName2] = defaultProps[_propName2];
          }
        }
      }
    }

    if (key || ref) {
      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;

      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }

      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }

    var element = ReactElement(type, key, ref, self, source, ReactSharedInternals.owner, props);

    if (type === REACT_FRAGMENT_TYPE) {
      validateFragmentProps(element);
    }

    return element;
  }
}
/**
 * Create and return a new ReactElement of the given type.
 * See https://reactjs.org/docs/react-api.html#createelement
 */

function createElement(type, config, children) {
  {
    if (!isValidElementType(type)) {
      // This is an invalid element type.
      //
      // We warn in this case but don't throw. We expect the element creation to
      // succeed and there will likely be errors in render.
      var info = '';

      if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
        info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and named imports.";
      }

      var typeString;

      if (type === null) {
        typeString = 'null';
      } else if (isArray(type)) {
        typeString = 'array';
      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
        typeString = "<" + (getComponentNameFromType(type.type) || 'Unknown') + " />";
        info = ' Did you accidentally export a JSX literal instead of a component?';
      } else {
        typeString = typeof type;
      }

      error('React.createElement: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', typeString, info);
    } else {
      // This is a valid element type.
      // Skip key warning if the type isn't valid since our key validation logic
      // doesn't expect a non-string/function type and can throw confusing
      // errors. We don't want exception behavior to differ between dev and
      // prod. (Rendering will throw with a helpful message and as soon as the
      // type is fixed, the key warnings will appear.)
      for (var i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], type);
      }
    } // Unlike the jsx() runtime, createElement() doesn't warn about key spread.

  }

  var propName; // Reserved names are extracted

  var props = {};
  var key = null;
  var ref = null;

  if (config != null) {
    {
      if (!didWarnAboutOldJSXRuntime && '__self' in config && // Do not assume this is the result of an oudated JSX transform if key
      // is present, because the modern JSX transform sometimes outputs
      // createElement to preserve precedence between a static key and a
      // spread key. To avoid false positive warnings, we never warn if
      // there's a key.
      !('key' in config)) {
        didWarnAboutOldJSXRuntime = true;

        warn('Your app (or one of its dependencies) is using an outdated JSX ' + 'transform. Update to the modern JSX transform for ' + 'faster performance: ' + // TODO: Create a short link for this
        'https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html');
      }
    }

    if (hasValidRef(config)) {
      {
        ref = config.ref;

        {
          ref = coerceStringRef(ref, ReactSharedInternals.owner, type);
        }
      }

      {
        warnIfStringRefCannotBeAutoConverted(config, config.__self);
      }
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = '' + config.key;
    } // Remaining properties are added to a new props object


    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && // Skip over reserved prop names
      propName !== 'key' && (propName !== 'ref') && // Even though we don't use these anymore in the runtime, we don't want
      // them to appear as props, so in createElement we filter them out.
      // We don't have to do this in the jsx() runtime because the jsx()
      // transform never passed these as props; it used separate arguments.
      propName !== '__self' && propName !== '__source') {
        {
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

    for (var _i = 0; _i < childrenLength; _i++) {
      childArray[_i] = arguments[_i + 2];
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
      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;

      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }

      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }

  var element = ReactElement(type, key, ref, undefined, undefined, ReactSharedInternals.owner, props);

  if (type === REACT_FRAGMENT_TYPE) {
    validateFragmentProps(element);
  }

  return element;
}
function cloneAndReplaceKey(oldElement, newKey) {
  return ReactElement(oldElement.type, newKey, // When enableRefAsProp is on, this argument is ignored. This check only
  // exists to avoid the `ref` access warning.
  oldElement.ref, undefined, undefined, oldElement._owner, oldElement.props);
}
/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://reactjs.org/docs/react-api.html#cloneelement
 */

function cloneElement(element, config, children) {
  if (element === null || element === undefined) {
    throw new Error("The argument must be a React element, but you passed " + element + ".");
  }

  var propName; // Original props are copied

  var props = assign({}, element.props); // Reserved names are extracted

  var key = element.key;
  var ref = element.ref; // Owner will be preserved, unless ref is overridden

  var owner = element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      owner = ReactSharedInternals.owner;

      {
        // Silently steal the ref from the parent.
        ref = config.ref;

        {
          ref = coerceStringRef(ref, owner, element.type);
        }
      }
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = '' + config.key;
    } // Remaining properties override existing props


    var defaultProps;

    if (!disableDefaultPropsExceptForClasses && element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }

    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && // Skip over reserved prop names
      propName !== 'key' && (propName !== 'ref') && // ...and maybe these, too, though we currently rely on them for
      // warnings and debug information in dev. Need to decide if we're OK
      // with dropping them. In the jsx() runtime it's not an issue because
      // the data gets passed as separate arguments instead of props, but
      // it would be nice to stop relying on them entirely so we can drop
      // them from the internal Fiber field.
      propName !== '__self' && propName !== '__source' && // Undefined `ref` is ignored by cloneElement. We treat it the same as
      // if the property were missing. This is mostly for
      // backwards compatibility.
      !(enableRefAsProp  )) {
        if (!disableDefaultPropsExceptForClasses && config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          {
            props[propName] = config[propName];
          }
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

  var clonedElement = ReactElement(element.type, key, ref, undefined, undefined, owner, props);

  for (var _i2 = 2; _i2 < arguments.length; _i2++) {
    validateChildKeys(arguments[_i2], clonedElement.type);
  }

  return clonedElement;
}

function getDeclarationErrorAddendum() {
  {
    if (ReactSharedInternals.owner) {
      var name = getComponentNameFromType(ReactSharedInternals.owner.type);

      if (name) {
        return '\n\nCheck the render method of `' + name + '`.';
      }
    }

    return '';
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
  {
    if (typeof node !== 'object' || !node) {
      return;
    }

    if (node.$$typeof === REACT_CLIENT_REFERENCE) ; else if (isArray(node)) {
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
    } else {
      var iteratorFn = getIteratorFn(node);

      if (typeof iteratorFn === 'function') {
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
}
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */


function isValidElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}
var ownerHasKeyUseWarning = {};
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
  {
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

    var childOwner = '';

    if (element && element._owner != null && element._owner !== ReactSharedInternals.owner) {
      var ownerName = null;

      if (typeof element._owner.tag === 'number') {
        ownerName = getComponentNameFromType(element._owner.type);
      } else if (typeof element._owner.name === 'string') {
        ownerName = element._owner.name;
      } // Give the component that originally created this child.


      childOwner = " It was passed a child from " + ownerName + ".";
    }

    setCurrentlyValidatingElement(element);

    error('Each child in a list should have a unique "key" prop.' + '%s%s See https://react.dev/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);

    setCurrentlyValidatingElement(null);
  }
}

function setCurrentlyValidatingElement(element) {
  {
    if (element) {
      var stack = describeUnknownElementTypeFrameInDEV(element.type);
      ReactSharedInternals.setExtraStackFrame(stack);
    } else {
      ReactSharedInternals.setExtraStackFrame(null);
    }
  }
}

function getCurrentComponentErrorInfo(parentType) {
  {
    var info = getDeclarationErrorAddendum();

    if (!info) {
      var parentName = getComponentNameFromType(parentType);

      if (parentName) {
        info = "\n\nCheck the top-level render call using <" + parentName + ">.";
      }
    }

    return info;
  }
}
/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */


function validateFragmentProps(fragment) {
  // TODO: Move this to render phase instead of at element creation.
  {
    var keys = Object.keys(fragment.props);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (key !== 'children' && key !== 'key') {
        setCurrentlyValidatingElement(fragment);

        error('Invalid prop `%s` supplied to `React.Fragment`. ' + 'React.Fragment can only have `key` and `children` props.', key);

        setCurrentlyValidatingElement(null);
        break;
      }
    }

    if (fragment.ref !== null) {
      setCurrentlyValidatingElement(fragment);

      error('Invalid attribute `ref` supplied to `React.Fragment`.');

      setCurrentlyValidatingElement(null);
    }
  }
}

function coerceStringRef(mixedRef, owner, type) {

  var stringRef;

  if (typeof mixedRef === 'string') {
    stringRef = mixedRef;
  } else {
    if (typeof mixedRef === 'number' || typeof mixedRef === 'boolean') {
      {
        checkPropStringCoercion(mixedRef, 'ref');
      }

      stringRef = '' + mixedRef;
    } else {
      return mixedRef;
    }
  }

  var callback = stringRefAsCallbackRef.bind(null, stringRef, type, owner); // This is used to check whether two callback refs conceptually represent
  // the same string ref, and can therefore be reused by the reconciler. Needed
  // for backwards compatibility with old Meta code that relies on string refs
  // not being reattached on every render.

  callback.__stringRef = stringRef;
  callback.__type = type;
  callback.__owner = owner;
  return callback;
}

function stringRefAsCallbackRef(stringRef, type, owner, value) {

  if (!owner) {
    throw new Error("Element ref was specified as a string (" + stringRef + ") but no owner was set. This could happen for one of" + ' the following reasons:\n' + '1. You may be adding a ref to a function component\n' + "2. You may be adding a ref to a component that was not created inside a component's render method\n" + '3. You have multiple copies of React loaded\n' + 'See https://react.dev/link/refs-must-have-owner for more information.');
  }

  if (owner.tag !== ClassComponent) {
    throw new Error('Function components cannot have string refs. ' + 'We recommend using useRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://react.dev/link/strict-mode-string-ref');
  }

  {
    if ( // Will already warn with "Function components cannot be given refs"
    !(typeof type === 'function' && !isReactClass(type))) {
      var componentName = getComponentNameFromFiber(owner) || 'Component';

      if (!didWarnAboutStringRefs[componentName]) {
        error('Component "%s" contains the string ref "%s". Support for string refs ' + 'will be removed in a future major release. We recommend using ' + 'useRef() or createRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://react.dev/link/strict-mode-string-ref', componentName, stringRef);

        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }

  var inst = owner.stateNode;

  if (!inst) {
    throw new Error("Missing owner for string ref " + stringRef + ". This error is likely caused by a " + 'bug in React. Please file an issue.');
  }

  var refs = inst.refs;

  if (value === null) {
    delete refs[stringRef];
  } else {
    refs[stringRef] = value;
  }
}

function isReactClass(type) {
  return type.prototype && type.prototype.isReactComponent;
}

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
    ':': '=2'
  };
  var escapedString = key.replace(escapeRegex, function (match) {
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
  return text.replace(userProvidedKeyEscapeRegex, '$&/');
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
  if (typeof element === 'object' && element !== null && element.key != null) {
    // Explicit key
    {
      checkKeyStringCoercion(element.key);
    }

    return escape('' + element.key);
  } // Implicit key determined by the index in the set


  return index.toString(36);
}

function noop$1() {}

function resolveThenable(thenable) {
  switch (thenable.status) {
    case 'fulfilled':
      {
        var fulfilledValue = thenable.value;
        return fulfilledValue;
      }

    case 'rejected':
      {
        var rejectedError = thenable.reason;
        throw rejectedError;
      }

    default:
      {
        if (typeof thenable.status === 'string') {
          // Only instrument the thenable if the status if not defined. If
          // it's defined, but an unknown value, assume it's been instrumented by
          // some custom userspace implementation. We treat it as "pending".
          // Attach a dummy listener, to ensure that any lazy initialization can
          // happen. Flight lazily parses JSON when the value is actually awaited.
          thenable.then(noop$1, noop$1);
        } else {
          // This is an uncached thenable that we haven't seen before.
          // TODO: Detect infinite ping loops caused by uncached promises.
          var pendingThenable = thenable;
          pendingThenable.status = 'pending';
          pendingThenable.then(function (fulfilledValue) {
            if (thenable.status === 'pending') {
              var fulfilledThenable = thenable;
              fulfilledThenable.status = 'fulfilled';
              fulfilledThenable.value = fulfilledValue;
            }
          }, function (error) {
            if (thenable.status === 'pending') {
              var rejectedThenable = thenable;
              rejectedThenable.status = 'rejected';
              rejectedThenable.reason = error;
            }
          });
        } // Check one more time in case the thenable resolved synchronously.


        switch (thenable.status) {
          case 'fulfilled':
            {
              var fulfilledThenable = thenable;
              return fulfilledThenable.value;
            }

          case 'rejected':
            {
              var rejectedThenable = thenable;
              var _rejectedError = rejectedThenable.reason;
              throw _rejectedError;
            }
        }
      }
  }

  throw thenable;
}

function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  var invokeCallback = false;

  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'bigint':
      case 'string':
      case 'number':
        invokeCallback = true;
        break;

      case 'object':
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
            break;

          case REACT_LAZY_TYPE:
            var payload = children._payload;
            var init = children._init;
            return mapIntoArray(init(payload), array, escapedPrefix, nameSoFar, callback);
        }

    }
  }

  if (invokeCallback) {
    var _child = children;
    var mappedChild = callback(_child); // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows:

    var childKey = nameSoFar === '' ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;

    if (isArray(mappedChild)) {
      var escapedChildKey = '';

      if (childKey != null) {
        escapedChildKey = escapeUserProvidedKey(childKey) + '/';
      }

      mapIntoArray(mappedChild, array, escapedChildKey, '', function (c) {
        return c;
      });
    } else if (mappedChild != null) {
      if (isValidElement(mappedChild)) {
        {
          // The `if` statement here prevents auto-disabling of the safe
          // coercion ESLint rule, so we must manually disable it below.
          // $FlowFixMe[incompatible-type] Flow incorrectly thinks React.Portal doesn't have a key
          if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
            checkKeyStringCoercion(mappedChild.key);
          }
        }

        mappedChild = cloneAndReplaceKey(mappedChild, // Keep both the (mapped) and old keys if they differ, just as
        // traverseAllChildren used to do for objects as children
        escapedPrefix + ( // $FlowFixMe[incompatible-type] Flow incorrectly thinks React.Portal doesn't have a key
        mappedChild.key && (!_child || _child.key !== mappedChild.key) ? escapeUserProvidedKey( // $FlowFixMe[unsafe-addition]
        '' + mappedChild.key // eslint-disable-line react-internal/safe-string-coercion
        ) + '/' : '') + childKey);
      }

      array.push(mappedChild);
    }

    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.

  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getElementKey(child, i);
      subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
    }
  } else {
    var iteratorFn = getIteratorFn(children);

    if (typeof iteratorFn === 'function') {
      var iterableChildren = children;

      {
        // Warn about using Maps as children
        if (iteratorFn === iterableChildren.entries) {
          if (!didWarnAboutMaps) {
            warn('Using Maps as children is not supported. ' + 'Use an array of keyed ReactElements instead.');
          }

          didWarnAboutMaps = true;
        }
      }

      var iterator = iteratorFn.call(iterableChildren);
      var step;
      var ii = 0; // $FlowFixMe[incompatible-use] `iteratorFn` might return null according to typing.

      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getElementKey(child, ii++);
        subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
      }
    } else if (type === 'object') {
      if (typeof children.then === 'function') {
        return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
      } // eslint-disable-next-line react-internal/safe-string-coercion


      var childrenString = String(children);
      throw new Error("Objects are not valid as a React child (found: " + (childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString) + "). " + 'If you meant to render a collection of children, use an array ' + 'instead.');
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
    // $FlowFixMe limitation refining abstract types in Flow
    return children;
  }

  var result = [];
  var count = 0;
  mapIntoArray(children, result, '', '', function (child) {
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
  mapChildren(children, function () {
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
  mapChildren(children, // $FlowFixMe[missing-this-annot]
  function () {
    forEachFunc.apply(this, arguments); // Don't return anything.
  }, forEachContext);
}
/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrentoarray
 */


function toArray(children) {
  return mapChildren(children, function (child) {
    return child;
  }) || [];
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
    throw new Error('React.Children.only expected to receive a single React element child.');
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
    Consumer: null
  };

  if (enableRenderableContext) {
    context.Provider = context;
    context.Consumer = {
      $$typeof: REACT_CONSUMER_TYPE,
      _context: context
    };
  } else {
    context.Provider = {
      $$typeof: REACT_PROVIDER_TYPE,
      _context: context
    };

    {
      var Consumer = {
        $$typeof: REACT_CONTEXT_TYPE,
        _context: context
      };
      Object.defineProperties(Consumer, {
        Provider: {
          get: function () {
            return context.Provider;
          },
          set: function (_Provider) {
            context.Provider = _Provider;
          }
        },
        _currentValue: {
          get: function () {
            return context._currentValue;
          },
          set: function (_currentValue) {
            context._currentValue = _currentValue;
          }
        },
        _currentValue2: {
          get: function () {
            return context._currentValue2;
          },
          set: function (_currentValue2) {
            context._currentValue2 = _currentValue2;
          }
        },
        _threadCount: {
          get: function () {
            return context._threadCount;
          },
          set: function (_threadCount) {
            context._threadCount = _threadCount;
          }
        },
        Consumer: {
          get: function () {
            return context.Consumer;
          }
        },
        displayName: {
          get: function () {
            return context.displayName;
          },
          set: function (displayName) {}
        }
      });
      context.Consumer = Consumer;
    }
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

    thenable.then(function (moduleObject) {
      if (payload._status === Pending || payload._status === Uninitialized) {
        // Transition to the next state.
        var resolved = payload;
        resolved._status = Resolved;
        resolved._result = moduleObject;
      }
    }, function (error) {
      if (payload._status === Pending || payload._status === Uninitialized) {
        // Transition to the next state.
        var rejected = payload;
        rejected._status = Rejected;
        rejected._result = error;
      }
    });

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
        error('lazy: Expected the result of a dynamic imp' + 'ort() call. ' + 'Instead received: %s\n\nYour code should look like: \n  ' + // Break up imports to avoid accidentally parsing them as dependencies.
        'const MyComponent = lazy(() => imp' + "ort('./MyComponent'))\n\n" + 'Did you accidentally put curly braces around the import?', moduleObject);
      }
    }

    {
      if (!('default' in moduleObject)) {
        error('lazy: Expected the result of a dynamic imp' + 'ort() call. ' + 'Instead received: %s\n\nYour code should look like: \n  ' + // Break up imports to avoid accidentally parsing them as dependencies.
        'const MyComponent = lazy(() => imp' + "ort('./MyComponent'))", moduleObject);
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

  if (!disableDefaultPropsExceptForClasses) {
    {
      // In production, this would just set it on the object.
      var defaultProps; // $FlowFixMe[prop-missing]

      Object.defineProperties(lazyType, {
        defaultProps: {
          configurable: true,
          get: function () {
            return defaultProps;
          },
          // $FlowFixMe[missing-local-annot]
          set: function (newDefaultProps) {
            error('It is not supported to assign `defaultProps` to ' + 'a lazy component import. Either specify them where the component ' + 'is defined, or create a wrapping component around it.');

            defaultProps = newDefaultProps; // Match production behavior more closely:
            // $FlowFixMe[prop-missing]

            Object.defineProperty(lazyType, 'defaultProps', {
              enumerable: true
            });
          }
        }
      });
    }
  }

  return lazyType;
}

function forwardRef(render) {
  {
    if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
      error('forwardRef requires a render function but received a `memo` ' + 'component. Instead of forwardRef(memo(...)), use ' + 'memo(forwardRef(...)).');
    } else if (typeof render !== 'function') {
      error('forwardRef requires a render function but was given %s.', render === null ? 'null' : typeof render);
    } else {
      if (render.length !== 0 && render.length !== 2) {
        error('forwardRef render functions accept exactly two parameters: props and ref. %s', render.length === 1 ? 'Did you forget to use the ref parameter?' : 'Any additional parameter will be undefined.');
      }
    }

    if (render != null) {
      if (render.defaultProps != null) {
        error('forwardRef render functions do not support defaultProps. ' + 'Did you accidentally pass a React component?');
      }
    }
  }

  var elementType = {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render: render
  };

  {
    var ownName;
    Object.defineProperty(elementType, 'displayName', {
      enumerable: false,
      configurable: true,
      get: function () {
        return ownName;
      },
      set: function (name) {
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

function memo(type, compare) {
  {
    if (!isValidElementType(type)) {
      error('memo: The first argument must be a component. Instead ' + 'received: %s', type === null ? 'null' : typeof type);
    }
  }

  var elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type: type,
    compare: compare === undefined ? null : compare
  };

  {
    var ownName;
    Object.defineProperty(elementType, 'displayName', {
      enumerable: false,
      configurable: true,
      get: function () {
        return ownName;
      },
      set: function (name) {
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

function noopCache(fn) {
  // On the client (i.e. not a Server Components environment) `cache` has
  // no caching behavior. We just return the function as-is.
  //
  // We intend to implement client caching in a future major release. In the
  // meantime, it's only exposed as an API so that Shared Components can use
  // per-request caching on the server without breaking on the client. But it
  // does mean they need to be aware of the behavioral difference.
  //
  // The rest of the behavior is the same as the server implementation — it
  // returns a new reference, extra properties like `displayName` are not
  // preserved, the length of the new function is 0, etc. That way apps can't
  // accidentally depend on those details.
  return function () {
    // $FlowFixMe[incompatible-call]: We don't want to use rest arguments since we transpile the code.
    return fn.apply(null, arguments);
  };
}
var cache = noopCache ;

function resolveDispatcher() {
  var dispatcher = ReactSharedInternals.H;

  {
    if (dispatcher === null) {
      error('Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' + ' one of the following reasons:\n' + '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' + '2. You might be breaking the Rules of Hooks\n' + '3. You might have more than one copy of React in the same app\n' + 'See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.');
    }
  } // Will result in a null access error if accessed outside render phase. We
  // intentionally don't throw our own error because this is in a hot path.
  // Also helps ensure this is inlined.


  return dispatcher;
}

function getCacheForType(resourceType) {
  var dispatcher = ReactSharedInternals.C;

  if (!dispatcher) {
    // If there is no dispatcher, then we treat this as not being cached.
    return resourceType();
  }

  return dispatcher.getCacheForType(resourceType);
}
function useContext(Context) {
  var dispatcher = resolveDispatcher();

  {
    if (Context.$$typeof === REACT_CONSUMER_TYPE) {
      error('Calling useContext(Context.Consumer) is not supported and will cause bugs. ' + 'Did you mean to call useContext(Context) instead?');
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
function useDeferredValue(value, initialValue) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useDeferredValue(value, initialValue);
}
function useId() {
  var dispatcher = resolveDispatcher();
  return dispatcher.useId();
}
function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
function useCacheRefresh() {
  var dispatcher = resolveDispatcher(); // $FlowFixMe[not-a-function] This is unstable, thus optional

  return dispatcher.useCacheRefresh();
}
function use(usable) {
  var dispatcher = resolveDispatcher();
  return dispatcher.use(usable);
}
function useMemoCache(size) {
  var dispatcher = resolveDispatcher(); // $FlowFixMe[not-a-function] This is unstable, thus optional

  return dispatcher.useMemoCache(size);
}
function useEffectEvent(callback) {
  var dispatcher = resolveDispatcher(); // $FlowFixMe[not-a-function] This is unstable, thus optional

  return dispatcher.useEffectEvent(callback);
}
function useOptimistic(passthrough, reducer) {
  var dispatcher = resolveDispatcher(); // $FlowFixMe[not-a-function] This is unstable, thus optional

  return dispatcher.useOptimistic(passthrough, reducer);
}
function useActionState(action, initialState, permalink) {
  if (!enableAsyncActions) {
    throw new Error('Not implemented.');
  } else {
    var dispatcher = resolveDispatcher(); // $FlowFixMe[not-a-function] This is unstable, thus optional

    return dispatcher.useActionState(action, initialState, permalink);
  }
}

var reportGlobalError = typeof reportError === 'function' ? // In modern browsers, reportError will dispatch an error event,
// emulating an uncaught JavaScript error.
reportError : function (error) {
  if (typeof window === 'object' && typeof window.ErrorEvent === 'function') {
    // Browser Polyfill
    var message = typeof error === 'object' && error !== null && typeof error.message === 'string' ? // eslint-disable-next-line react-internal/safe-string-coercion
    String(error.message) : // eslint-disable-next-line react-internal/safe-string-coercion
    String(error);
    var event = new window.ErrorEvent('error', {
      bubbles: true,
      cancelable: true,
      message: message,
      error: error
    });
    var shouldLog = window.dispatchEvent(event);

    if (!shouldLog) {
      return;
    }
  } else if (typeof process === 'object' && // $FlowFixMe[method-unbinding]
  typeof process.emit === 'function') {
    // Node Polyfill
    process.emit('uncaughtException', error);
    return;
  } // eslint-disable-next-line react-internal/no-production-logging


  console['error'](error);
};

function startTransition(scope, options) {
  var prevTransition = ReactSharedInternals.T; // Each renderer registers a callback to receive the return value of
  // the scope function. This is used to implement async actions.

  var callbacks = new Set();
  var transition = {
    _callbacks: callbacks
  };
  ReactSharedInternals.T = transition;
  var currentTransition = ReactSharedInternals.T;

  {
    ReactSharedInternals.T._updatedFibers = new Set();
  }

  if (enableAsyncActions) {
    try {
      var returnValue = scope();

      if (typeof returnValue === 'object' && returnValue !== null && typeof returnValue.then === 'function') {
        callbacks.forEach(function (callback) {
          return callback(currentTransition, returnValue);
        });
        returnValue.then(noop, reportGlobalError);
      }
    } catch (error) {
      reportGlobalError(error);
    } finally {
      warnAboutTransitionSubscriptions(prevTransition, currentTransition);
      ReactSharedInternals.T = prevTransition;
    }
  } else {
    // When async actions are not enabled, startTransition does not
    // capture errors.
    try {
      scope();
    } finally {
      warnAboutTransitionSubscriptions(prevTransition, currentTransition);
      ReactSharedInternals.T = prevTransition;
    }
  }
}

function warnAboutTransitionSubscriptions(prevTransition, currentTransition) {
  {
    if (prevTransition === null && currentTransition._updatedFibers) {
      var updatedFibersCount = currentTransition._updatedFibers.size;

      currentTransition._updatedFibers.clear();

      if (updatedFibersCount > 10) {
        warn('Detected a large number of updates inside startTransition. ' + 'If this is due to a subscription please re-write it to use React provided hooks. ' + 'Otherwise concurrent mode guarantees are off the table.');
      }
    }
  }
}

function noop() {}

var didWarnAboutMessageChannel = false;
var enqueueTaskImpl = null;
function enqueueTask(task) {
  if (enqueueTaskImpl === null) {
    try {
      // read require off the module object to get around the bundlers.
      // we don't want them to detect a require and bundle a Node polyfill.
      var requireString = ('require' + Math.random()).slice(0, 7);
      var nodeRequire = module && module[requireString]; // assuming we're in node, let's try to get node's
      // version of setImmediate, bypassing fake timers if any.

      enqueueTaskImpl = nodeRequire.call(module, 'timers').setImmediate;
    } catch (_err) {
      // we're in a browser
      // we can't use regular timers because they may still be faked
      // so we try MessageChannel+postMessage instead
      enqueueTaskImpl = function (callback) {
        {
          if (didWarnAboutMessageChannel === false) {
            didWarnAboutMessageChannel = true;

            if (typeof MessageChannel === 'undefined') {
              error('This browser does not have a MessageChannel implementation, ' + 'so enqueuing tasks via await act(async () => ...) will fail. ' + 'Please file an issue at https://github.com/facebook/react/issues ' + 'if you encounter this warning.');
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

function aggregateErrors(errors) {
  if (errors.length > 1 && typeof AggregateError === 'function') {
    // eslint-disable-next-line no-undef
    return new AggregateError(errors);
  }

  return errors[0];
}

function act(callback) {
  {
    // When ReactSharedInternals.actQueue is not null, it signals to React that
    // we're currently inside an `act` scope. React will push all its tasks to
    // this queue instead of scheduling them with platform APIs.
    //
    // We set this to an empty array when we first enter an `act` scope, and
    // only unset it once we've left the outermost `act` scope — remember that
    // `act` calls can be nested.
    //
    // If we're already inside an `act` scope, reuse the existing queue.
    var prevIsBatchingLegacy = ReactSharedInternals.isBatchingLegacy ;
    var prevActQueue = ReactSharedInternals.actQueue;
    var prevActScopeDepth = actScopeDepth;
    actScopeDepth++;
    var queue = ReactSharedInternals.actQueue = prevActQueue !== null ? prevActQueue : []; // Used to reproduce behavior of `batchedUpdates` in legacy mode. Only
    // set to `true` while the given callback is executed, not for updates
    // triggered during an async event, because this is how the legacy
    // implementation of `act` behaved.

    {
      ReactSharedInternals.isBatchingLegacy = true;
    }

    var result; // This tracks whether the `act` call is awaited. In certain cases, not
    // awaiting it is a mistake, so we will detect that and warn.

    var didAwaitActCall = false;

    try {
      // Reset this to `false` right before entering the React work loop. The
      // only place we ever read this fields is just below, right after running
      // the callback. So we don't need to reset after the callback runs.
      if (!disableLegacyMode) {
        ReactSharedInternals.didScheduleLegacyUpdate = false;
      }

      result = callback();
      var didScheduleLegacyUpdate = !disableLegacyMode ? ReactSharedInternals.didScheduleLegacyUpdate : false; // Replicate behavior of original `act` implementation in legacy mode,
      // which flushed updates immediately after the scope function exits, even
      // if it's an async function.

      if (!prevIsBatchingLegacy && didScheduleLegacyUpdate) {
        flushActQueue(queue);
      } // `isBatchingLegacy` gets reset using the regular stack, not the async
      // one used to track `act` scopes. Why, you may be wondering? Because
      // that's how it worked before version 18. Yes, it's confusing! We should
      // delete legacy mode!!


      if (!disableLegacyMode) {
        ReactSharedInternals.isBatchingLegacy = prevIsBatchingLegacy;
      }
    } catch (error) {
      // `isBatchingLegacy` gets reset using the regular stack, not the async
      // one used to track `act` scopes. Why, you may be wondering? Because
      // that's how it worked before version 18. Yes, it's confusing! We should
      // delete legacy mode!!
      ReactSharedInternals.thrownErrors.push(error);
    }

    if (ReactSharedInternals.thrownErrors.length > 0) {
      {
        ReactSharedInternals.isBatchingLegacy = prevIsBatchingLegacy;
      }

      popActScope(prevActQueue, prevActScopeDepth);
      var thrownError = aggregateErrors(ReactSharedInternals.thrownErrors);
      ReactSharedInternals.thrownErrors.length = 0;
      throw thrownError;
    }

    if (result !== null && typeof result === 'object' && // $FlowFixMe[method-unbinding]
    typeof result.then === 'function') {
      // A promise/thenable was returned from the callback. Wait for it to
      // resolve before flushing the queue.
      //
      // If `act` were implemented as an async function, this whole block could
      // be a single `await` call. That's really the only difference between
      // this branch and the next one.
      var thenable = result; // Warn if the an `act` call with an async scope is not awaited. In a
      // future release, consider making this an error.

      queueSeveralMicrotasks(function () {
        if (!didAwaitActCall && !didWarnNoAwaitAct) {
          didWarnNoAwaitAct = true;

          error('You called act(async () => ...) without await. ' + 'This could lead to unexpected testing behaviour, ' + 'interleaving multiple act calls and mixing their ' + 'scopes. ' + 'You should - await act(async () => ...);');
        }
      });
      return {
        then: function (resolve, reject) {
          didAwaitActCall = true;
          thenable.then(function (returnValue) {
            popActScope(prevActQueue, prevActScopeDepth);

            if (prevActScopeDepth === 0) {
              // We're exiting the outermost `act` scope. Flush the queue.
              try {
                flushActQueue(queue);
                enqueueTask(function () {
                  return (// Recursively flush tasks scheduled by a microtask.
                    recursivelyFlushAsyncActWork(returnValue, resolve, reject)
                  );
                });
              } catch (error) {
                // `thenable` might not be a real promise, and `flushActQueue`
                // might throw, so we need to wrap `flushActQueue` in a
                // try/catch.
                ReactSharedInternals.thrownErrors.push(error);
              }

              if (ReactSharedInternals.thrownErrors.length > 0) {
                var _thrownError = aggregateErrors(ReactSharedInternals.thrownErrors);

                ReactSharedInternals.thrownErrors.length = 0;
                reject(_thrownError);
              }
            } else {
              resolve(returnValue);
            }
          }, function (error) {
            popActScope(prevActQueue, prevActScopeDepth);

            if (ReactSharedInternals.thrownErrors.length > 0) {
              var _thrownError2 = aggregateErrors(ReactSharedInternals.thrownErrors);

              ReactSharedInternals.thrownErrors.length = 0;
              reject(_thrownError2);
            } else {
              reject(error);
            }
          });
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
          queueSeveralMicrotasks(function () {
            if (!didAwaitActCall && !didWarnNoAwaitAct) {
              didWarnNoAwaitAct = true;

              error('A component suspended inside an `act` scope, but the ' + '`act` call was not awaited. When testing React ' + 'components that depend on asynchronous data, you must ' + 'await the result:\n\n' + 'await act(() => ...)');
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


        ReactSharedInternals.actQueue = null;
      }

      if (ReactSharedInternals.thrownErrors.length > 0) {
        var _thrownError3 = aggregateErrors(ReactSharedInternals.thrownErrors);

        ReactSharedInternals.thrownErrors.length = 0;
        throw _thrownError3;
      }

      return {
        then: function (resolve, reject) {
          didAwaitActCall = true;

          if (prevActScopeDepth === 0) {
            // If the `act` call is awaited, restore the queue we were
            // using before (see long comment above) so we can flush it.
            ReactSharedInternals.actQueue = queue;
            enqueueTask(function () {
              return (// Recursively flush tasks scheduled by a microtask.
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
      error('You seem to have overlapping act() calls, this is not supported. ' + 'Be sure to await previous act() calls before making a new one. ');
    }

    actScopeDepth = prevActScopeDepth;
  }
}

function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
  {
    // Check if any tasks were scheduled asynchronously.
    var queue = ReactSharedInternals.actQueue;

    if (queue !== null) {
      if (queue.length !== 0) {
        // Async tasks were scheduled, mostly likely in a microtask.
        // Keep flushing until there are no more.
        try {
          flushActQueue(queue); // The work we just performed may have schedule additional async
          // tasks. Wait a macrotask and check again.

          enqueueTask(function () {
            return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
          });
          return;
        } catch (error) {
          // Leave remaining tasks on the queue if something throws.
          ReactSharedInternals.thrownErrors.push(error);
        }
      } else {
        // The queue is empty. We can finish.
        ReactSharedInternals.actQueue = null;
      }
    }

    if (ReactSharedInternals.thrownErrors.length > 0) {
      var thrownError = aggregateErrors(ReactSharedInternals.thrownErrors);
      ReactSharedInternals.thrownErrors.length = 0;
      reject(thrownError);
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
            ReactSharedInternals.didUsePromise = false;
            var continuation = callback(false);

            if (continuation !== null) {
              if (ReactSharedInternals.didUsePromise) {
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
        ReactSharedInternals.thrownErrors.push(error);
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


var queueSeveralMicrotasks = typeof queueMicrotask === 'function' ? function (callback) {
  queueMicrotask(function () {
    return queueMicrotask(callback);
  });
} : enqueueTask;

var Children = {
  map: mapChildren,
  forEach: forEachChildren,
  count: countChildren,
  toArray: toArray,
  only: onlyChild
};

var jsx = jsxProdSignatureRunningInDevWithDynamicChildren ; // we may want to special case jsxs internally to take advantage of static children.
// for now we can ship identical prod functions

var jsxs = jsxProdSignatureRunningInDevWithStaticChildren ;
var jsxDEV = jsxDEV$1 ;

exports.Children = Children;
exports.Component = Component;
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.Profiler = REACT_PROFILER_TYPE;
exports.PureComponent = PureComponent;
exports.StrictMode = REACT_STRICT_MODE_TYPE;
exports.Suspense = REACT_SUSPENSE_TYPE;
exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
exports.act = act;
exports.cache = cache;
exports.cloneElement = cloneElement;
exports.createContext = createContext;
exports.createElement = createElement;
exports.createRef = createRef;
exports.experimental_useEffectEvent = useEffectEvent;
exports.forwardRef = forwardRef;
exports.isValidElement = isValidElement;
exports.jsx = jsx;
exports.jsxDEV = jsxDEV;
exports.jsxs = jsxs;
exports.lazy = lazy;
exports.memo = memo;
exports.startTransition = startTransition;
exports.unstable_Activity = REACT_OFFSCREEN_TYPE;
exports.unstable_DebugTracingMode = REACT_DEBUG_TRACING_MODE_TYPE;
exports.unstable_LegacyHidden = REACT_LEGACY_HIDDEN_TYPE;
exports.unstable_Scope = REACT_SCOPE_TYPE;
exports.unstable_SuspenseList = REACT_SUSPENSE_LIST_TYPE;
exports.unstable_TracingMarker = REACT_TRACING_MARKER_TYPE;
exports.unstable_getCacheForType = getCacheForType;
exports.unstable_useCacheRefresh = useCacheRefresh;
exports.unstable_useMemoCache = useMemoCache;
exports.use = use;
exports.useActionState = useActionState;
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
exports.useOptimistic = useOptimistic;
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
