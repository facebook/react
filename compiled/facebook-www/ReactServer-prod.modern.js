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
var assign = Object.assign,
  dynamicFeatureFlags = require("ReactFeatureFlags"),
  enableTransitionTracing = dynamicFeatureFlags.enableTransitionTracing,
  enableRefAsProp = dynamicFeatureFlags.enableRefAsProp,
  disableDefaultPropsExceptForClasses =
    dynamicFeatureFlags.disableDefaultPropsExceptForClasses,
  ReactSharedInternals = { H: null, C: null, owner: null };
function formatProdErrorMessage(code) {
  var url = "https://react.dev/errors/" + code;
  if (1 < arguments.length) {
    url += "?args[]=" + encodeURIComponent(arguments[1]);
    for (var i = 2; i < arguments.length; i++)
      url += "&args[]=" + encodeURIComponent(arguments[i]);
  }
  return (
    "Minified React error #" +
    code +
    "; visit " +
    url +
    " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
  );
}
var isArrayImpl = Array.isArray,
  REACT_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_PORTAL_TYPE = Symbol.for("react.portal"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
  REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
  REACT_MEMO_TYPE = Symbol.for("react.memo"),
  REACT_LAZY_TYPE = Symbol.for("react.lazy"),
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
function ReactElement(type, key, _ref, self, source, owner, props) {
  enableRefAsProp &&
    ((_ref = props.ref), (_ref = void 0 !== _ref ? _ref : null));
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: _ref,
    props: props,
    _owner: owner
  };
}
function jsxProd(type, config, maybeKey) {
  var key = null,
    ref = null;
  void 0 !== maybeKey && (key = "" + maybeKey);
  void 0 !== config.key && (key = "" + config.key);
  void 0 === config.ref ||
    enableRefAsProp ||
    ((ref = config.ref),
    (ref = coerceStringRef(ref, ReactSharedInternals.owner, type)));
  maybeKey = {};
  for (var propName in config)
    "key" === propName ||
      (!enableRefAsProp && "ref" === propName) ||
      (enableRefAsProp && "ref" === propName
        ? (maybeKey.ref = coerceStringRef(
            config[propName],
            ReactSharedInternals.owner,
            type
          ))
        : (maybeKey[propName] = config[propName]));
  if (!disableDefaultPropsExceptForClasses && type && type.defaultProps) {
    config = type.defaultProps;
    for (var propName$0 in config)
      void 0 === maybeKey[propName$0] &&
        (maybeKey[propName$0] = config[propName$0]);
  }
  return ReactElement(
    type,
    key,
    ref,
    void 0,
    void 0,
    ReactSharedInternals.owner,
    maybeKey
  );
}
function cloneAndReplaceKey(oldElement, newKey) {
  return ReactElement(
    oldElement.type,
    newKey,
    enableRefAsProp ? null : oldElement.ref,
    void 0,
    void 0,
    oldElement._owner,
    oldElement.props
  );
}
function isValidElement(object) {
  return (
    "object" === typeof object &&
    null !== object &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
function coerceStringRef(mixedRef, owner, type) {
  if ("string" !== typeof mixedRef)
    if ("number" === typeof mixedRef || "boolean" === typeof mixedRef)
      mixedRef = "" + mixedRef;
    else return mixedRef;
  return stringRefAsCallbackRef.bind(null, mixedRef, type, owner);
}
function stringRefAsCallbackRef(stringRef, type, owner, value) {
  if (!owner) throw Error(formatProdErrorMessage(290, stringRef));
  if (1 !== owner.tag) throw Error(formatProdErrorMessage(309));
  type = owner.stateNode;
  if (!type) throw Error(formatProdErrorMessage(147, stringRef));
  type = type.refs;
  null === value ? delete type[stringRef] : (type[stringRef] = value);
}
function escape(key) {
  var escaperLookup = { "=": "=0", ":": "=2" };
  return (
    "$" +
    key.replace(/[=:]/g, function (match) {
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
function noop$1() {}
function resolveThenable(thenable) {
  switch (thenable.status) {
    case "fulfilled":
      return thenable.value;
    case "rejected":
      throw thenable.reason;
    default:
      switch (
        ("string" === typeof thenable.status
          ? thenable.then(noop$1, noop$1)
          : ((thenable.status = "pending"),
            thenable.then(
              function (fulfilledValue) {
                "pending" === thenable.status &&
                  ((thenable.status = "fulfilled"),
                  (thenable.value = fulfilledValue));
              },
              function (error) {
                "pending" === thenable.status &&
                  ((thenable.status = "rejected"), (thenable.reason = error));
              }
            )),
        thenable.status)
      ) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
      }
  }
  throw thenable;
}
function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;
  if ("undefined" === type || "boolean" === type) children = null;
  var invokeCallback = !1;
  if (null === children) invokeCallback = !0;
  else
    switch (type) {
      case "bigint":
      case "string":
      case "number":
        invokeCallback = !0;
        break;
      case "object":
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = !0;
            break;
          case REACT_LAZY_TYPE:
            return (
              (invokeCallback = children._init),
              mapIntoArray(
                invokeCallback(children._payload),
                array,
                escapedPrefix,
                nameSoFar,
                callback
              )
            );
        }
    }
  if (invokeCallback)
    return (
      (callback = callback(children)),
      (invokeCallback =
        "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar),
      isArrayImpl(callback)
        ? ((escapedPrefix = ""),
          null != invokeCallback &&
            (escapedPrefix =
              invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"),
          mapIntoArray(callback, array, escapedPrefix, "", function (c) {
            return c;
          }))
        : null != callback &&
          (isValidElement(callback) &&
            (callback = cloneAndReplaceKey(
              callback,
              escapedPrefix +
                (!callback.key || (children && children.key === callback.key)
                  ? ""
                  : ("" + callback.key).replace(
                      userProvidedKeyEscapeRegex,
                      "$&/"
                    ) + "/") +
                invokeCallback
            )),
          array.push(callback)),
      1
    );
  invokeCallback = 0;
  var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
  if (isArrayImpl(children))
    for (var i = 0; i < children.length; i++)
      (nameSoFar = children[i]),
        (type = nextNamePrefix + getElementKey(nameSoFar, i)),
        (invokeCallback += mapIntoArray(
          nameSoFar,
          array,
          escapedPrefix,
          type,
          callback
        ));
  else if (((i = getIteratorFn(children)), "function" === typeof i))
    for (
      children = i.call(children), i = 0;
      !(nameSoFar = children.next()).done;

    )
      (nameSoFar = nameSoFar.value),
        (type = nextNamePrefix + getElementKey(nameSoFar, i++)),
        (invokeCallback += mapIntoArray(
          nameSoFar,
          array,
          escapedPrefix,
          type,
          callback
        ));
  else if ("object" === type) {
    if ("function" === typeof children.then)
      return mapIntoArray(
        resolveThenable(children),
        array,
        escapedPrefix,
        nameSoFar,
        callback
      );
    array = String(children);
    throw Error(
      formatProdErrorMessage(
        31,
        "[object Object]" === array
          ? "object with keys {" + Object.keys(children).join(", ") + "}"
          : array
      )
    );
  }
  return invokeCallback;
}
function mapChildren(children, func, context) {
  if (null == children) return children;
  var result = [],
    count = 0;
  mapIntoArray(children, result, "", "", function (child) {
    return func.call(context, child, count++);
  });
  return result;
}
function lazyInitializer(payload) {
  if (-1 === payload._status) {
    var ctor = payload._result;
    ctor = ctor();
    ctor.then(
      function (moduleObject) {
        if (0 === payload._status || -1 === payload._status)
          (payload._status = 1), (payload._result = moduleObject);
      },
      function (error) {
        if (0 === payload._status || -1 === payload._status)
          (payload._status = 2), (payload._result = error);
      }
    );
    -1 === payload._status && ((payload._status = 0), (payload._result = ctor));
  }
  if (1 === payload._status) return payload._result.default;
  throw payload._result;
}
function createCacheRoot() {
  return new WeakMap();
}
function createCacheNode() {
  return { s: 0, v: void 0, o: null, p: null };
}
var reportGlobalError =
  "function" === typeof reportError
    ? reportError
    : function (error) {
        if (
          "object" === typeof window &&
          "function" === typeof window.ErrorEvent
        ) {
          var event = new window.ErrorEvent("error", {
            bubbles: !0,
            cancelable: !0,
            message:
              "object" === typeof error &&
              null !== error &&
              "string" === typeof error.message
                ? String(error.message)
                : String(error),
            error: error
          });
          if (!window.dispatchEvent(event)) return;
        } else if (
          "object" === typeof process &&
          "function" === typeof process.emit
        ) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      };
function noop() {}
exports.Children = {
  map: mapChildren,
  forEach: function (children, forEachFunc, forEachContext) {
    mapChildren(
      children,
      function () {
        forEachFunc.apply(this, arguments);
      },
      forEachContext
    );
  },
  count: function (children) {
    var n = 0;
    mapChildren(children, function () {
      n++;
    });
    return n;
  },
  toArray: function (children) {
    return (
      mapChildren(children, function (child) {
        return child;
      }) || []
    );
  },
  only: function (children) {
    if (!isValidElement(children)) throw Error(formatProdErrorMessage(143));
    return children;
  }
};
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.Profiler = REACT_PROFILER_TYPE;
exports.StrictMode = REACT_STRICT_MODE_TYPE;
exports.Suspense = REACT_SUSPENSE_TYPE;
exports.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
  ReactSharedInternals;
exports.cache = function (fn) {
  return function () {
    var dispatcher = ReactSharedInternals.C;
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
exports.cloneElement = function (element, config, children) {
  if (null === element || void 0 === element)
    throw Error(formatProdErrorMessage(267, element));
  var props = assign({}, element.props),
    key = element.key,
    ref = enableRefAsProp ? null : element.ref,
    owner = element._owner;
  if (null != config) {
    void 0 !== config.ref &&
      ((owner = ReactSharedInternals.owner),
      enableRefAsProp ||
        ((ref = config.ref),
        (ref = coerceStringRef(ref, owner, element.type))));
    void 0 !== config.key && (key = "" + config.key);
    if (
      !disableDefaultPropsExceptForClasses &&
      element.type &&
      element.type.defaultProps
    )
      var defaultProps = element.type.defaultProps;
    for (propName in config)
      !hasOwnProperty.call(config, propName) ||
        "key" === propName ||
        (!enableRefAsProp && "ref" === propName) ||
        "__self" === propName ||
        "__source" === propName ||
        (enableRefAsProp && "ref" === propName && void 0 === config.ref) ||
        (disableDefaultPropsExceptForClasses ||
        void 0 !== config[propName] ||
        void 0 === defaultProps
          ? enableRefAsProp && "ref" === propName
            ? (props.ref = coerceStringRef(
                config[propName],
                owner,
                element.type
              ))
            : (props[propName] = config[propName])
          : (props[propName] = defaultProps[propName]));
  }
  var propName = arguments.length - 2;
  if (1 === propName) props.children = children;
  else if (1 < propName) {
    defaultProps = Array(propName);
    for (var i = 0; i < propName; i++) defaultProps[i] = arguments[i + 2];
    props.children = defaultProps;
  }
  return ReactElement(element.type, key, ref, void 0, void 0, owner, props);
};
exports.createElement = function (type, config, children) {
  var propName,
    props = {},
    key = null,
    ref = null;
  if (null != config)
    for (propName in (void 0 === config.ref ||
      enableRefAsProp ||
      ((ref = config.ref),
      (ref = coerceStringRef(ref, ReactSharedInternals.owner, type))),
    void 0 !== config.key && (key = "" + config.key),
    config))
      hasOwnProperty.call(config, propName) &&
        "key" !== propName &&
        (enableRefAsProp || "ref" !== propName) &&
        "__self" !== propName &&
        "__source" !== propName &&
        (enableRefAsProp && "ref" === propName
          ? (props.ref = coerceStringRef(
              config[propName],
              ReactSharedInternals.owner,
              type
            ))
          : (props[propName] = config[propName]));
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
  return ReactElement(
    type,
    key,
    ref,
    void 0,
    void 0,
    ReactSharedInternals.owner,
    props
  );
};
exports.createRef = function () {
  return { current: null };
};
exports.forwardRef = function (render) {
  return { $$typeof: REACT_FORWARD_REF_TYPE, render: render };
};
exports.isValidElement = isValidElement;
exports.jsx = jsxProd;
exports.jsxDEV = void 0;
exports.jsxs = jsxProd;
exports.lazy = function (ctor) {
  return {
    $$typeof: REACT_LAZY_TYPE,
    _payload: { _status: -1, _result: ctor },
    _init: lazyInitializer
  };
};
exports.memo = function (type, compare) {
  return {
    $$typeof: REACT_MEMO_TYPE,
    type: type,
    compare: void 0 === compare ? null : compare
  };
};
exports.startTransition = function (scope, options) {
  var prevTransition = ReactSharedInternals.T,
    callbacks = new Set();
  ReactSharedInternals.T = { _callbacks: callbacks };
  var currentTransition = ReactSharedInternals.T;
  enableTransitionTracing &&
    void 0 !== options &&
    void 0 !== options.name &&
    ((ReactSharedInternals.T.name = options.name),
    (ReactSharedInternals.T.startTime = -1));
  try {
    var returnValue = scope();
    "object" === typeof returnValue &&
      null !== returnValue &&
      "function" === typeof returnValue.then &&
      (callbacks.forEach(function (callback) {
        return callback(currentTransition, returnValue);
      }),
      returnValue.then(noop, reportGlobalError));
  } catch (error) {
    reportGlobalError(error);
  } finally {
    ReactSharedInternals.T = prevTransition;
  }
};
exports.use = function (usable) {
  return ReactSharedInternals.H.use(usable);
};
exports.useActionState = function (action, initialState, permalink) {
  return ReactSharedInternals.H.useActionState(action, initialState, permalink);
};
exports.useCallback = function (callback, deps) {
  return ReactSharedInternals.H.useCallback(callback, deps);
};
exports.useDebugValue = function () {};
exports.useId = function () {
  return ReactSharedInternals.H.useId();
};
exports.useMemo = function (create, deps) {
  return ReactSharedInternals.H.useMemo(create, deps);
};
exports.version = "19.0.0-www-modern-3ff8d311";
