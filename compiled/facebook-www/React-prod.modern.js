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

"use strict";
var REACT_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_PORTAL_TYPE = Symbol.for("react.portal"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
  REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
  REACT_PROVIDER_TYPE = Symbol.for("react.provider"),
  REACT_CONTEXT_TYPE = Symbol.for("react.context"),
  REACT_SERVER_CONTEXT_TYPE = Symbol.for("react.server_context"),
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
  REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
  REACT_MEMO_TYPE = Symbol.for("react.memo"),
  REACT_LAZY_TYPE = Symbol.for("react.lazy"),
  REACT_SCOPE_TYPE = Symbol.for("react.scope"),
  REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode"),
  REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen"),
  REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden"),
  REACT_CACHE_TYPE = Symbol.for("react.cache"),
  REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for(
    "react.default_value"
  ),
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
var ReactNoopUpdateQueue = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {},
    enqueueReplaceState: function() {},
    enqueueSetState: function() {}
  },
  assign = Object.assign,
  emptyObject = {};
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
Component.prototype.isReactComponent = {};
Component.prototype.setState = function(partialState, callback) {
  if (
    "object" !== typeof partialState &&
    "function" !== typeof partialState &&
    null != partialState
  )
    throw Error(
      "setState(...): takes an object of state variables to update or a function which returns an object of state variables."
    );
  this.updater.enqueueSetState(this, partialState, callback, "setState");
};
Component.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
};
function ComponentDummy() {}
ComponentDummy.prototype = Component.prototype;
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
var pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent;
assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = !0;
var isArrayImpl = Array.isArray,
  enableTransitionTracing = require("ReactFeatureFlags")
    .enableTransitionTracing,
  hasOwnProperty = Object.prototype.hasOwnProperty,
  ReactCurrentOwner = { current: null },
  RESERVED_PROPS = { key: !0, ref: !0, __self: !0, __source: !0 };
function cloneAndReplaceKey(oldElement, newKey) {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: oldElement.type,
    key: newKey,
    ref: oldElement.ref,
    props: oldElement.props,
    _owner: oldElement._owner
  };
}
function isValidElement(object) {
  return (
    "object" === typeof object &&
    null !== object &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
function escape(key) {
  var escaperLookup = { "=": "=0", ":": "=2" };
  return (
    "$" +
    key.replace(/[=:]/g, function(match) {
      return escaperLookup[match];
    })
  );
}
var userProvidedKeyEscapeRegex = /\/+/g;
function getElementKey(element, index) {
  return "object" === typeof element && null !== element && null != element.key
    ? escape("" + element.key)
    : index.toString(36);
}
function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;
  if ("undefined" === type || "boolean" === type) children = null;
  var invokeCallback = !1;
  if (null === children) invokeCallback = !0;
  else
    switch (type) {
      case "string":
      case "number":
        invokeCallback = !0;
        break;
      case "object":
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = !0;
        }
    }
  if (invokeCallback)
    return (
      (invokeCallback = children),
      (callback = callback(invokeCallback)),
      (children =
        "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar),
      isArrayImpl(callback)
        ? ((escapedPrefix = ""),
          null != children &&
            (escapedPrefix =
              children.replace(userProvidedKeyEscapeRegex, "$&/") + "/"),
          mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          }))
        : null != callback &&
          (isValidElement(callback) &&
            (callback = cloneAndReplaceKey(
              callback,
              escapedPrefix +
                (!callback.key ||
                (invokeCallback && invokeCallback.key === callback.key)
                  ? ""
                  : ("" + callback.key).replace(
                      userProvidedKeyEscapeRegex,
                      "$&/"
                    ) + "/") +
                children
            )),
          array.push(callback)),
      1
    );
  invokeCallback = 0;
  nameSoFar = "" === nameSoFar ? "." : nameSoFar + ":";
  if (isArrayImpl(children))
    for (var i = 0; i < children.length; i++) {
      type = children[i];
      var nextName = nameSoFar + getElementKey(type, i);
      invokeCallback += mapIntoArray(
        type,
        array,
        escapedPrefix,
        nextName,
        callback
      );
    }
  else if (
    ((nextName = getIteratorFn(children)), "function" === typeof nextName)
  )
    for (
      children = nextName.call(children), i = 0;
      !(type = children.next()).done;

    )
      (type = type.value),
        (nextName = nameSoFar + getElementKey(type, i++)),
        (invokeCallback += mapIntoArray(
          type,
          array,
          escapedPrefix,
          nextName,
          callback
        ));
  else if ("object" === type)
    throw ((array = String(children)),
    Error(
      "Objects are not valid as a React child (found: " +
        ("[object Object]" === array
          ? "object with keys {" + Object.keys(children).join(", ") + "}"
          : array) +
        "). If you meant to render a collection of children, use an array instead."
    ));
  return invokeCallback;
}
function mapChildren(children, func, context) {
  if (null == children) return children;
  var result = [],
    count = 0;
  mapIntoArray(children, result, "", "", function(child) {
    return func.call(context, child, count++);
  });
  return result;
}
function lazyInitializer(payload) {
  if (-1 === payload._status) {
    var ctor = payload._result;
    ctor = ctor();
    ctor.then(
      function(moduleObject) {
        if (0 === payload._status || -1 === payload._status)
          (payload._status = 1), (payload._result = moduleObject);
      },
      function(error) {
        if (0 === payload._status || -1 === payload._status)
          (payload._status = 2), (payload._result = error);
      }
    );
    -1 === payload._status && ((payload._status = 0), (payload._result = ctor));
  }
  if (1 === payload._status) return payload._result.default;
  throw payload._result;
}
var ReactCurrentCache = { current: null };
function createCacheRoot() {
  return new WeakMap();
}
function createCacheNode() {
  return { s: 0, v: void 0, o: null, p: null };
}
var ReactCurrentDispatcher = { current: null };
function useTransition() {
  return ReactCurrentDispatcher.current.useTransition();
}
function useDeferredValue(value) {
  return ReactCurrentDispatcher.current.useDeferredValue(value);
}
function useMutableSource(source, getSnapshot, subscribe) {
  return ReactCurrentDispatcher.current.useMutableSource(
    source,
    getSnapshot,
    subscribe
  );
}
var ReactCurrentBatchConfig = { transition: null },
  ReactSharedInternals = {
    ReactCurrentDispatcher: ReactCurrentDispatcher,
    ReactCurrentCache: ReactCurrentCache,
    ReactCurrentBatchConfig: ReactCurrentBatchConfig,
    ReactCurrentOwner: ReactCurrentOwner,
    ContextRegistry: {}
  },
  ContextRegistry$1 = ReactSharedInternals.ContextRegistry;
function createMutableSource(source, getVersion) {
  return {
    _getVersion: getVersion,
    _source: source,
    _workInProgressVersionPrimary: null,
    _workInProgressVersionSecondary: null
  };
}
function startTransition(scope, options) {
  var prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};
  enableTransitionTracing &&
    void 0 !== options &&
    void 0 !== options.name &&
    ((ReactCurrentBatchConfig.transition.name = options.name),
    (ReactCurrentBatchConfig.transition.startTime = -1));
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}
var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner,
  RESERVED_PROPS$1 = { key: !0, ref: !0, __self: !0, __source: !0 };
function jsx(type, config, maybeKey) {
  var propName,
    props = {},
    key = null,
    ref = null;
  void 0 !== maybeKey && (key = "" + maybeKey);
  void 0 !== config.key && (key = "" + config.key);
  void 0 !== config.ref && (ref = config.ref);
  for (propName in config)
    hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS$1.hasOwnProperty(propName) &&
      (props[propName] = config[propName]);
  if (type && type.defaultProps)
    for (propName in ((config = type.defaultProps), config))
      void 0 === props[propName] && (props[propName] = config[propName]);
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: ref,
    props: props,
    _owner: ReactCurrentOwner$1.current
  };
}
exports.Children = {
  map: mapChildren,
  forEach: function(children, forEachFunc, forEachContext) {
    mapChildren(
      children,
      function() {
        forEachFunc.apply(this, arguments);
      },
      forEachContext
    );
  },
  count: function(children) {
    var n = 0;
    mapChildren(children, function() {
      n++;
    });
    return n;
  },
  toArray: function(children) {
    return (
      mapChildren(children, function(child) {
        return child;
      }) || []
    );
  },
  only: function(children) {
    if (!isValidElement(children))
      throw Error(
        "React.Children.only expected to receive a single React element child."
      );
    return children;
  }
};
exports.Component = Component;
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.Profiler = REACT_PROFILER_TYPE;
exports.PureComponent = PureComponent;
exports.StrictMode = REACT_STRICT_MODE_TYPE;
exports.Suspense = REACT_SUSPENSE_TYPE;
exports.SuspenseList = REACT_SUSPENSE_LIST_TYPE;
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
exports.cache = function(fn) {
  return function() {
    var dispatcher = ReactCurrentCache.current;
    if (!dispatcher) return fn.apply(null, arguments);
    var fnMap = dispatcher.getCacheForType(createCacheRoot);
    dispatcher = fnMap.get(fn);
    void 0 === dispatcher &&
      ((dispatcher = createCacheNode()), fnMap.set(fn, dispatcher));
    fnMap = 0;
    for (var l = arguments.length; fnMap < l; fnMap++) {
      var arg = arguments[fnMap];
      if (
        "function" === typeof arg ||
        ("object" === typeof arg && null !== arg)
      ) {
        var objectCache = dispatcher.o;
        null === objectCache && (dispatcher.o = objectCache = new WeakMap());
        dispatcher = objectCache.get(arg);
        void 0 === dispatcher &&
          ((dispatcher = createCacheNode()), objectCache.set(arg, dispatcher));
      } else
        (objectCache = dispatcher.p),
          null === objectCache && (dispatcher.p = objectCache = new Map()),
          (dispatcher = objectCache.get(arg)),
          void 0 === dispatcher &&
            ((dispatcher = createCacheNode()),
            objectCache.set(arg, dispatcher));
    }
    if (1 === dispatcher.s) return dispatcher.v;
    if (2 === dispatcher.s) throw dispatcher.v;
    try {
      var result = fn.apply(null, arguments);
      fnMap = dispatcher;
      fnMap.s = 1;
      return (fnMap.v = result);
    } catch (error) {
      throw ((result = dispatcher), (result.s = 2), (result.v = error), error);
    }
  };
};
exports.cloneElement = function(element, config, children) {
  if (null === element || void 0 === element)
    throw Error(
      "React.cloneElement(...): The argument must be a React element, but you passed " +
        element +
        "."
    );
  var props = assign({}, element.props),
    key = element.key,
    ref = element.ref,
    owner = element._owner;
  if (null != config) {
    void 0 !== config.ref &&
      ((ref = config.ref), (owner = ReactCurrentOwner.current));
    void 0 !== config.key && (key = "" + config.key);
    if (element.type && element.type.defaultProps)
      var defaultProps = element.type.defaultProps;
    for (propName in config)
      hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName) &&
        (props[propName] =
          void 0 === config[propName] && void 0 !== defaultProps
            ? defaultProps[propName]
            : config[propName]);
  }
  var propName = arguments.length - 2;
  if (1 === propName) props.children = children;
  else if (1 < propName) {
    defaultProps = Array(propName);
    for (var i = 0; i < propName; i++) defaultProps[i] = arguments[i + 2];
    props.children = defaultProps;
  }
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: element.type,
    key: key,
    ref: ref,
    props: props,
    _owner: owner
  };
};
exports.createContext = function(defaultValue) {
  defaultValue = {
    $$typeof: REACT_CONTEXT_TYPE,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    Provider: null,
    Consumer: null,
    _defaultValue: null,
    _globalName: null
  };
  defaultValue.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: defaultValue
  };
  return (defaultValue.Consumer = defaultValue);
};
exports.createElement = function(type, config, children) {
  var propName,
    props = {},
    key = null,
    ref = null;
  if (null != config)
    for (propName in (void 0 !== config.ref && (ref = config.ref),
    void 0 !== config.key && (key = "" + config.key),
    config))
      hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName) &&
        (props[propName] = config[propName]);
  var childrenLength = arguments.length - 2;
  if (1 === childrenLength) props.children = children;
  else if (1 < childrenLength) {
    for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
      childArray[i] = arguments[i + 2];
    props.children = childArray;
  }
  if (type && type.defaultProps)
    for (propName in ((childrenLength = type.defaultProps), childrenLength))
      void 0 === props[propName] &&
        (props[propName] = childrenLength[propName]);
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: ref,
    props: props,
    _owner: ReactCurrentOwner.current
  };
};
exports.createMutableSource = createMutableSource;
exports.createRef = function() {
  return { current: null };
};
exports.createServerContext = function(globalName, defaultValue) {
  var wasDefined = !0;
  if (!ContextRegistry$1[globalName]) {
    wasDefined = !1;
    var context$1 = {
      $$typeof: REACT_SERVER_CONTEXT_TYPE,
      _currentValue: defaultValue,
      _currentValue2: defaultValue,
      _defaultValue: defaultValue,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
      _globalName: globalName
    };
    context$1.Provider = { $$typeof: REACT_PROVIDER_TYPE, _context: context$1 };
    ContextRegistry$1[globalName] = context$1;
  }
  context$1 = ContextRegistry$1[globalName];
  if (context$1._defaultValue === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED)
    (context$1._defaultValue = defaultValue),
      context$1._currentValue ===
        REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED &&
        (context$1._currentValue = defaultValue),
      context$1._currentValue2 ===
        REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED &&
        (context$1._currentValue2 = defaultValue);
  else if (wasDefined)
    throw Error("ServerContext: " + globalName + " already defined");
  return context$1;
};
exports.experimental_useEvent = function(callback) {
  return ReactCurrentDispatcher.current.useEvent(callback);
};
exports.forwardRef = function(render) {
  return { $$typeof: REACT_FORWARD_REF_TYPE, render: render };
};
exports.isValidElement = isValidElement;
exports.jsx = jsx;
exports.jsxDEV = void 0;
exports.jsxs = jsx;
exports.lazy = function(ctor) {
  return {
    $$typeof: REACT_LAZY_TYPE,
    _payload: { _status: -1, _result: ctor },
    _init: lazyInitializer
  };
};
exports.memo = function(type, compare) {
  return {
    $$typeof: REACT_MEMO_TYPE,
    type: type,
    compare: void 0 === compare ? null : compare
  };
};
exports.startTransition = startTransition;
exports.unstable_Cache = REACT_CACHE_TYPE;
exports.unstable_DebugTracingMode = REACT_DEBUG_TRACING_MODE_TYPE;
exports.unstable_LegacyHidden = REACT_LEGACY_HIDDEN_TYPE;
exports.unstable_Offscreen = REACT_OFFSCREEN_TYPE;
exports.unstable_Scope = REACT_SCOPE_TYPE;
exports.unstable_SuspenseList = REACT_SUSPENSE_LIST_TYPE;
exports.unstable_act = function() {
  throw Error("act(...) is not supported in production builds of React.");
};
exports.unstable_createMutableSource = createMutableSource;
exports.unstable_getCacheForType = function(resourceType) {
  var dispatcher = ReactCurrentCache.current;
  return dispatcher ? dispatcher.getCacheForType(resourceType) : resourceType();
};
exports.unstable_getCacheSignal = function() {
  var dispatcher = ReactCurrentCache.current;
  return dispatcher
    ? dispatcher.getCacheSignal()
    : ((dispatcher = new AbortController()),
      dispatcher.abort(
        Error(
          "This CacheSignal was requested outside React which means that it is immediately aborted."
        )
      ),
      dispatcher.signal);
};
exports.unstable_startTransition = startTransition;
exports.unstable_useCacheRefresh = function() {
  return ReactCurrentDispatcher.current.useCacheRefresh();
};
exports.unstable_useDeferredValue = useDeferredValue;
exports.unstable_useMemoCache = function(size) {
  return ReactCurrentDispatcher.current.useMemoCache(size);
};
exports.unstable_useMutableSource = useMutableSource;
exports.unstable_useTransition = useTransition;
exports.use = function(usable) {
  return ReactCurrentDispatcher.current.use(usable);
};
exports.useCallback = function(callback, deps) {
  return ReactCurrentDispatcher.current.useCallback(callback, deps);
};
exports.useContext = function(Context) {
  return ReactCurrentDispatcher.current.useContext(Context);
};
exports.useDebugValue = function() {};
exports.useDeferredValue = useDeferredValue;
exports.useEffect = function(create, deps) {
  return ReactCurrentDispatcher.current.useEffect(create, deps);
};
exports.useId = function() {
  return ReactCurrentDispatcher.current.useId();
};
exports.useImperativeHandle = function(ref, create, deps) {
  return ReactCurrentDispatcher.current.useImperativeHandle(ref, create, deps);
};
exports.useInsertionEffect = function(create, deps) {
  return ReactCurrentDispatcher.current.useInsertionEffect(create, deps);
};
exports.useLayoutEffect = function(create, deps) {
  return ReactCurrentDispatcher.current.useLayoutEffect(create, deps);
};
exports.useMemo = function(create, deps) {
  return ReactCurrentDispatcher.current.useMemo(create, deps);
};
exports.useMutableSource = useMutableSource;
exports.useReducer = function(reducer, initialArg, init) {
  return ReactCurrentDispatcher.current.useReducer(reducer, initialArg, init);
};
exports.useRef = function(initialValue) {
  return ReactCurrentDispatcher.current.useRef(initialValue);
};
exports.useState = function(initialState) {
  return ReactCurrentDispatcher.current.useState(initialState);
};
exports.useSyncExternalStore = function(
  subscribe,
  getSnapshot,
  getServerSnapshot
) {
  return ReactCurrentDispatcher.current.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
};
exports.useTransition = useTransition;
exports.version = "18.3.0-www-modern-0077544d2-20221121";
