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
var React = require("react"),
  ReactDOM = require("react-dom"),
  requestedClientReferencesKeys = new Set(),
  checkIsClientReference;
function isClientReference(reference) {
  if (null == checkIsClientReference)
    throw Error("Expected implementation for checkIsClientReference.");
  return checkIsClientReference(reference);
}
require("ReactFeatureFlags");
var byteLengthImpl = null;
function writeChunkAndReturn(destination, chunk) {
  destination.write(chunk);
  return !0;
}
var ReactDOMFlightServerDispatcher = {
  prefetchDNS: prefetchDNS,
  preconnect: preconnect,
  preload: preload,
  preloadModule: preloadModule,
  preinitStyle: preinitStyle,
  preinitScript: preinitScript,
  preinitModuleScript: preinitModuleScript
};
function prefetchDNS(href) {
  if ("string" === typeof href && href) {
    var request = currentRequest ? currentRequest : null;
    if (request) {
      var hints = request.hints,
        key = "D|" + href;
      hints.has(key) || (hints.add(key), emitHint(request, "D", href));
    }
  }
}
function preconnect(href, crossOrigin) {
  if ("string" === typeof href) {
    var request = currentRequest ? currentRequest : null;
    if (request) {
      var hints = request.hints,
        key = "C|" + (null == crossOrigin ? "null" : crossOrigin) + "|" + href;
      hints.has(key) ||
        (hints.add(key),
        "string" === typeof crossOrigin
          ? emitHint(request, "C", [href, crossOrigin])
          : emitHint(request, "C", href));
    }
  }
}
function preload(href, as, options) {
  if ("string" === typeof href) {
    var request = currentRequest ? currentRequest : null;
    if (request) {
      var hints = request.hints,
        key = "L";
      if ("image" === as && options) {
        var imageSrcSet = options.imageSrcSet,
          imageSizes = options.imageSizes,
          uniquePart = "";
        "string" === typeof imageSrcSet && "" !== imageSrcSet
          ? ((uniquePart += "[" + imageSrcSet + "]"),
            "string" === typeof imageSizes &&
              (uniquePart += "[" + imageSizes + "]"))
          : (uniquePart += "[][]" + href);
        key += "[image]" + uniquePart;
      } else key += "[" + as + "]" + href;
      hints.has(key) ||
        (hints.add(key),
        (options = trimOptions(options))
          ? emitHint(request, "L", [href, as, options])
          : emitHint(request, "L", [href, as]));
    }
  }
}
function preloadModule(href, options) {
  if ("string" === typeof href) {
    var request = currentRequest ? currentRequest : null;
    if (request) {
      var hints = request.hints,
        key = "m|" + href;
      if (!hints.has(key))
        return (
          hints.add(key),
          (options = trimOptions(options))
            ? emitHint(request, "m", [href, options])
            : emitHint(request, "m", href)
        );
    }
  }
}
function preinitStyle(href, precedence, options) {
  if ("string" === typeof href) {
    var request = currentRequest ? currentRequest : null;
    if (request) {
      var hints = request.hints,
        key = "S|" + href;
      if (!hints.has(key))
        return (
          hints.add(key),
          (options = trimOptions(options))
            ? emitHint(request, "S", [
                href,
                "string" === typeof precedence ? precedence : 0,
                options
              ])
            : "string" === typeof precedence
            ? emitHint(request, "S", [href, precedence])
            : emitHint(request, "S", href)
        );
    }
  }
}
function preinitScript(href, options) {
  if ("string" === typeof href) {
    var request = currentRequest ? currentRequest : null;
    if (request) {
      var hints = request.hints,
        key = "X|" + href;
      if (!hints.has(key))
        return (
          hints.add(key),
          (options = trimOptions(options))
            ? emitHint(request, "X", [href, options])
            : emitHint(request, "X", href)
        );
    }
  }
}
function preinitModuleScript(href, options) {
  if ("string" === typeof href) {
    var request = currentRequest ? currentRequest : null;
    if (request) {
      var hints = request.hints,
        key = "M|" + href;
      if (!hints.has(key))
        return (
          hints.add(key),
          (options = trimOptions(options))
            ? emitHint(request, "M", [href, options])
            : emitHint(request, "M", href)
        );
    }
  }
}
function trimOptions(options) {
  if (null == options) return null;
  var hasProperties = !1,
    trimmed = {},
    key;
  for (key in options)
    null != options[key] &&
      ((hasProperties = !0), (trimmed[key] = options[key]));
  return hasProperties ? trimmed : null;
}
var ReactDOMCurrentDispatcher =
    ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Dispatcher,
  REACT_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
  REACT_CONTEXT_TYPE = Symbol.for("react.context"),
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
  REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
  REACT_MEMO_TYPE = Symbol.for("react.memo"),
  REACT_LAZY_TYPE = Symbol.for("react.lazy"),
  REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel"),
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator,
  SuspenseException = Error(
    "Suspense Exception: This is not a real error! It's an implementation detail of `use` to interrupt the current render. You must either rethrow it immediately, or move the `use` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary, or call the promise's `.catch` method and pass the result to `use`"
  );
function noop() {}
function trackUsedThenable(thenableState, thenable, index) {
  index = thenableState[index];
  void 0 === index
    ? thenableState.push(thenable)
    : index !== thenable && (thenable.then(noop, noop), (thenable = index));
  switch (thenable.status) {
    case "fulfilled":
      return thenable.value;
    case "rejected":
      throw thenable.reason;
    default:
      if ("string" !== typeof thenable.status)
        switch (
          ((thenableState = thenable),
          (thenableState.status = "pending"),
          thenableState.then(
            function (fulfilledValue) {
              if ("pending" === thenable.status) {
                var fulfilledThenable = thenable;
                fulfilledThenable.status = "fulfilled";
                fulfilledThenable.value = fulfilledValue;
              }
            },
            function (error) {
              if ("pending" === thenable.status) {
                var rejectedThenable = thenable;
                rejectedThenable.status = "rejected";
                rejectedThenable.reason = error;
              }
            }
          ),
          thenable.status)
        ) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
        }
      suspendedThenable = thenable;
      throw SuspenseException;
  }
}
var suspendedThenable = null;
function getSuspendedThenable() {
  if (null === suspendedThenable)
    throw Error(
      "Expected a suspended thenable. This is a bug in React. Please file an issue."
    );
  var thenable = suspendedThenable;
  suspendedThenable = null;
  return thenable;
}
var currentRequest$1 = null,
  thenableIndexCounter = 0,
  thenableState = null;
function getThenableStateAfterSuspending() {
  var state = thenableState || [];
  thenableState = null;
  return state;
}
var HooksDispatcher = {
  useMemo: function (nextCreate) {
    return nextCreate();
  },
  useCallback: function (callback) {
    return callback;
  },
  useDebugValue: function () {},
  useDeferredValue: unsupportedHook,
  useTransition: unsupportedHook,
  readContext: unsupportedContext,
  useContext: unsupportedContext,
  useReducer: unsupportedHook,
  useRef: unsupportedHook,
  useState: unsupportedHook,
  useInsertionEffect: unsupportedHook,
  useLayoutEffect: unsupportedHook,
  useImperativeHandle: unsupportedHook,
  useEffect: unsupportedHook,
  useId: useId,
  useSyncExternalStore: unsupportedHook,
  useCacheRefresh: function () {
    return unsupportedRefresh;
  },
  useMemoCache: function (size) {
    for (var data = Array(size), i = 0; i < size; i++)
      data[i] = REACT_MEMO_CACHE_SENTINEL;
    return data;
  },
  use: use
};
function unsupportedHook() {
  throw Error("This Hook is not supported in Server Components.");
}
function unsupportedRefresh() {
  throw Error("Refreshing the cache is not supported in Server Components.");
}
function unsupportedContext() {
  throw Error("Cannot read a Client Context from a Server Component.");
}
function useId() {
  if (null === currentRequest$1)
    throw Error("useId can only be used while React is rendering");
  var id = currentRequest$1.identifierCount++;
  return ":" + currentRequest$1.identifierPrefix + "S" + id.toString(32) + ":";
}
function use(usable) {
  if (
    (null !== usable && "object" === typeof usable) ||
    "function" === typeof usable
  ) {
    if ("function" === typeof usable.then) {
      var index = thenableIndexCounter;
      thenableIndexCounter += 1;
      null === thenableState && (thenableState = []);
      return trackUsedThenable(thenableState, usable, index);
    }
    usable.$$typeof === REACT_CONTEXT_TYPE && unsupportedContext();
  }
  if (isClientReference(usable)) {
    if (null != usable.value && usable.value.$$typeof === REACT_CONTEXT_TYPE)
      throw Error("Cannot read a Client Context from a Server Component.");
    throw Error("Cannot use() an already resolved Client Reference.");
  }
  throw Error("An unsupported type was passed to use(): " + String(usable));
}
function createSignal() {
  return new AbortController().signal;
}
function resolveCache() {
  var request = currentRequest ? currentRequest : null;
  return request ? request.cache : new Map();
}
var DefaultCacheDispatcher = {
    getCacheSignal: function () {
      var cache = resolveCache(),
        entry = cache.get(createSignal);
      void 0 === entry &&
        ((entry = createSignal()), cache.set(createSignal, entry));
      return entry;
    },
    getCacheForType: function (resourceType) {
      var cache = resolveCache(),
        entry = cache.get(resourceType);
      void 0 === entry &&
        ((entry = resourceType()), cache.set(resourceType, entry));
      return entry;
    }
  },
  isArrayImpl = Array.isArray,
  getPrototypeOf = Object.getPrototypeOf;
function objectName(object) {
  return Object.prototype.toString
    .call(object)
    .replace(/^\[object (.*)\]$/, function (m, p0) {
      return p0;
    });
}
function describeValueForErrorMessage(value) {
  switch (typeof value) {
    case "string":
      return JSON.stringify(
        10 >= value.length ? value : value.slice(0, 10) + "..."
      );
    case "object":
      if (isArrayImpl(value)) return "[...]";
      if (null !== value && value.$$typeof === CLIENT_REFERENCE_TAG)
        return "client";
      value = objectName(value);
      return "Object" === value ? "{...}" : value;
    case "function":
      return value.$$typeof === CLIENT_REFERENCE_TAG
        ? "client"
        : (value = value.displayName || value.name)
        ? "function " + value
        : "function";
    default:
      return String(value);
  }
}
function describeElementType(type) {
  if ("string" === typeof type) return type;
  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return "Suspense";
    case REACT_SUSPENSE_LIST_TYPE:
      return "SuspenseList";
  }
  if ("object" === typeof type)
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeElementType(type.render);
      case REACT_MEMO_TYPE:
        return describeElementType(type.type);
      case REACT_LAZY_TYPE:
        var payload = type._payload;
        type = type._init;
        try {
          return describeElementType(type(payload));
        } catch (x) {}
    }
  return "";
}
var CLIENT_REFERENCE_TAG = Symbol.for("react.client.reference");
function describeObjectForErrorMessage(objectOrArray, expandedName) {
  var objKind = objectName(objectOrArray);
  if ("Object" !== objKind && "Array" !== objKind) return objKind;
  objKind = -1;
  var length = 0;
  if (isArrayImpl(objectOrArray)) {
    var str = "[";
    for (var i = 0; i < objectOrArray.length; i++) {
      0 < i && (str += ", ");
      var value = objectOrArray[i];
      value =
        "object" === typeof value && null !== value
          ? describeObjectForErrorMessage(value)
          : describeValueForErrorMessage(value);
      "" + i === expandedName
        ? ((objKind = str.length), (length = value.length), (str += value))
        : (str =
            10 > value.length && 40 > str.length + value.length
              ? str + value
              : str + "...");
    }
    str += "]";
  } else if (objectOrArray.$$typeof === REACT_ELEMENT_TYPE)
    str = "<" + describeElementType(objectOrArray.type) + "/>";
  else {
    if (objectOrArray.$$typeof === CLIENT_REFERENCE_TAG) return "client";
    str = "{";
    i = Object.keys(objectOrArray);
    for (value = 0; value < i.length; value++) {
      0 < value && (str += ", ");
      var name = i[value],
        encodedKey = JSON.stringify(name);
      str += ('"' + name + '"' === encodedKey ? name : encodedKey) + ": ";
      encodedKey = objectOrArray[name];
      encodedKey =
        "object" === typeof encodedKey && null !== encodedKey
          ? describeObjectForErrorMessage(encodedKey)
          : describeValueForErrorMessage(encodedKey);
      name === expandedName
        ? ((objKind = str.length),
          (length = encodedKey.length),
          (str += encodedKey))
        : (str =
            10 > encodedKey.length && 40 > str.length + encodedKey.length
              ? str + encodedKey
              : str + "...");
    }
    str += "}";
  }
  return void 0 === expandedName
    ? str
    : -1 < objKind && 0 < length
    ? ((objectOrArray = " ".repeat(objKind) + "^".repeat(length)),
      "\n  " + str + "\n  " + objectOrArray)
    : "\n  " + str;
}
var ReactSharedInternals =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  ReactSharedServerInternals =
    React.__SECRET_SERVER_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
if (!ReactSharedServerInternals)
  throw Error(
    'The "react" package in this environment is not configured correctly. The "react-server" condition must be enabled in any environment that runs React Server Components.'
  );
var ObjectPrototype = Object.prototype,
  stringify = JSON.stringify,
  ReactCurrentCache = ReactSharedServerInternals.ReactCurrentCache,
  ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
function defaultErrorHandler(error) {
  console.error(error);
}
function defaultPostponeHandler() {}
var currentRequest = null;
function serializeThenable(request, task, thenable) {
  var newTask = createTask(
    request,
    null,
    task.keyPath,
    task.implicitSlot,
    request.abortableTasks
  );
  switch (thenable.status) {
    case "fulfilled":
      return (
        (newTask.model = thenable.value), pingTask(request, newTask), newTask.id
      );
    case "rejected":
      return (
        (task = logRecoverableError(request, thenable.reason)),
        emitErrorChunk(request, newTask.id, task),
        newTask.id
      );
    default:
      "string" !== typeof thenable.status &&
        ((thenable.status = "pending"),
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
        ));
  }
  thenable.then(
    function (value) {
      newTask.model = value;
      pingTask(request, newTask);
    },
    function (reason) {
      newTask.status = 4;
      reason = logRecoverableError(request, reason);
      emitErrorChunk(request, newTask.id, reason);
      request.abortableTasks.delete(newTask);
      null !== request.destination &&
        flushCompletedChunks(request, request.destination);
    }
  );
  return newTask.id;
}
function emitHint(request, code, model) {
  model = stringify(model);
  var id = request.nextChunkId++;
  code = "H" + code;
  code = id.toString(16) + ":" + code;
  request.completedHintChunks.push(code + model + "\n");
  !1 === request.flushScheduled &&
    0 === request.pingedTasks.length &&
    null !== request.destination &&
    ((model = request.destination),
    (request.flushScheduled = !0),
    flushCompletedChunks(request, model));
}
function readThenable(thenable) {
  if ("fulfilled" === thenable.status) return thenable.value;
  if ("rejected" === thenable.status) throw thenable.reason;
  throw thenable;
}
function createLazyWrapperAroundWakeable(wakeable) {
  switch (wakeable.status) {
    case "fulfilled":
    case "rejected":
      break;
    default:
      "string" !== typeof wakeable.status &&
        ((wakeable.status = "pending"),
        wakeable.then(
          function (fulfilledValue) {
            "pending" === wakeable.status &&
              ((wakeable.status = "fulfilled"),
              (wakeable.value = fulfilledValue));
          },
          function (error) {
            "pending" === wakeable.status &&
              ((wakeable.status = "rejected"), (wakeable.reason = error));
          }
        ));
  }
  return { $$typeof: REACT_LAZY_TYPE, _payload: wakeable, _init: readThenable };
}
function renderFunctionComponent(request, task, key, Component, props) {
  var prevThenableState = task.thenableState;
  task.thenableState = null;
  thenableIndexCounter = 0;
  thenableState = prevThenableState;
  Component = Component(props, void 0);
  if (
    "object" === typeof Component &&
    null !== Component &&
    "function" === typeof Component.then
  ) {
    props = Component;
    if ("fulfilled" === props.status) return props.value;
    Component = createLazyWrapperAroundWakeable(Component);
  }
  props = task.keyPath;
  prevThenableState = task.implicitSlot;
  null !== key
    ? (task.keyPath = null === props ? key : props + "," + key)
    : null === props && (task.implicitSlot = !0);
  request = renderModelDestructive(request, task, emptyRoot, "", Component);
  task.keyPath = props;
  task.implicitSlot = prevThenableState;
  return request;
}
function renderFragment(request, task, children) {
  return null !== task.keyPath
    ? ((request = [
        REACT_ELEMENT_TYPE,
        REACT_FRAGMENT_TYPE,
        task.keyPath,
        { children: children }
      ]),
      task.implicitSlot ? [request] : request)
    : children;
}
function renderClientElement(task, type, key, props) {
  var keyPath = task.keyPath;
  null === key
    ? (key = keyPath)
    : null !== keyPath && (key = keyPath + "," + key);
  type = [REACT_ELEMENT_TYPE, type, key, props];
  return task.implicitSlot && null !== key ? [type] : type;
}
function renderElement(request, task, type, key, ref, props) {
  if (null !== ref && void 0 !== ref)
    throw Error(
      "Refs cannot be used in Server Components, nor passed to Client Components."
    );
  if ("function" === typeof type)
    return isClientReference(type)
      ? renderClientElement(task, type, key, props)
      : renderFunctionComponent(request, task, key, type, props);
  if ("string" === typeof type)
    return renderClientElement(task, type, key, props);
  if ("symbol" === typeof type)
    return type === REACT_FRAGMENT_TYPE && null === key
      ? ((key = task.implicitSlot),
        null === task.keyPath && (task.implicitSlot = !0),
        (request = renderModelDestructive(
          request,
          task,
          emptyRoot,
          "",
          props.children
        )),
        (task.implicitSlot = key),
        request)
      : renderClientElement(task, type, key, props);
  if (null != type && "object" === typeof type) {
    if (isClientReference(type))
      return renderClientElement(task, type, key, props);
    switch (type.$$typeof) {
      case REACT_LAZY_TYPE:
        var init = type._init;
        type = init(type._payload);
        return renderElement(request, task, type, key, ref, props);
      case REACT_FORWARD_REF_TYPE:
        return renderFunctionComponent(request, task, key, type.render, props);
      case REACT_MEMO_TYPE:
        return renderElement(request, task, type.type, key, ref, props);
    }
  }
  throw Error(
    "Unsupported Server Component type: " + describeValueForErrorMessage(type)
  );
}
function pingTask(request, task) {
  var pingedTasks = request.pingedTasks;
  pingedTasks.push(task);
  1 === pingedTasks.length &&
    ((request.flushScheduled = null !== request.destination),
    performWork(request));
}
function createTask(request, model, keyPath, implicitSlot, abortSet) {
  request.pendingChunks++;
  var id = request.nextChunkId++;
  "object" !== typeof model ||
    null === model ||
    null !== keyPath ||
    implicitSlot ||
    request.writtenObjects.set(model, id);
  var task = {
    id: id,
    status: 0,
    model: model,
    keyPath: keyPath,
    implicitSlot: implicitSlot,
    ping: function () {
      return pingTask(request, task);
    },
    toJSON: function (parentPropertyName, value) {
      var prevKeyPath = task.keyPath,
        prevImplicitSlot = task.implicitSlot;
      try {
        var JSCompiler_inline_result = renderModelDestructive(
          request,
          task,
          this,
          parentPropertyName,
          value
        );
      } catch (thrownValue) {
        if (
          ((parentPropertyName =
            thrownValue === SuspenseException
              ? getSuspendedThenable()
              : thrownValue),
          (value = task.model),
          (value =
            "object" === typeof value &&
            null !== value &&
            (value.$$typeof === REACT_ELEMENT_TYPE ||
              value.$$typeof === REACT_LAZY_TYPE)),
          "object" === typeof parentPropertyName &&
            null !== parentPropertyName &&
            "function" === typeof parentPropertyName.then)
        ) {
          JSCompiler_inline_result = createTask(
            request,
            task.model,
            task.keyPath,
            task.implicitSlot,
            request.abortableTasks
          );
          var ping = JSCompiler_inline_result.ping;
          parentPropertyName.then(ping, ping);
          JSCompiler_inline_result.thenableState =
            getThenableStateAfterSuspending();
          task.keyPath = prevKeyPath;
          task.implicitSlot = prevImplicitSlot;
          JSCompiler_inline_result = value
            ? "$L" + JSCompiler_inline_result.id.toString(16)
            : serializeByValueID(JSCompiler_inline_result.id);
        } else if (
          ((task.keyPath = prevKeyPath),
          (task.implicitSlot = prevImplicitSlot),
          value)
        )
          request.pendingChunks++,
            (prevKeyPath = request.nextChunkId++),
            (prevImplicitSlot = logRecoverableError(
              request,
              parentPropertyName
            )),
            emitErrorChunk(request, prevKeyPath, prevImplicitSlot),
            (JSCompiler_inline_result = "$L" + prevKeyPath.toString(16));
        else throw parentPropertyName;
      }
      return JSCompiler_inline_result;
    },
    thenableState: null
  };
  abortSet.add(task);
  return task;
}
function serializeByValueID(id) {
  return "$" + id.toString(16);
}
function serializeClientReference(
  request,
  parent,
  parentPropertyName,
  clientReference
) {
  var JSCompiler_inline_result = clientReference.getModuleId();
  requestedClientReferencesKeys.add(JSCompiler_inline_result);
  JSCompiler_inline_result = clientReference.getModuleId();
  var writtenClientReferences = request.writtenClientReferences,
    existingId = writtenClientReferences.get(JSCompiler_inline_result);
  if (void 0 !== existingId)
    return parent[0] === REACT_ELEMENT_TYPE && "1" === parentPropertyName
      ? "$L" + existingId.toString(16)
      : serializeByValueID(existingId);
  try {
    var clientReferenceMetadata = {
      moduleId: clientReference.getModuleId(),
      exportName: "default"
    };
    request.pendingChunks++;
    var importId = request.nextChunkId++,
      json = stringify(clientReferenceMetadata),
      processedChunk = importId.toString(16) + ":I" + json + "\n";
    request.completedImportChunks.push(processedChunk);
    writtenClientReferences.set(JSCompiler_inline_result, importId);
    return parent[0] === REACT_ELEMENT_TYPE && "1" === parentPropertyName
      ? "$L" + importId.toString(16)
      : serializeByValueID(importId);
  } catch (x) {
    return (
      request.pendingChunks++,
      (parent = request.nextChunkId++),
      (parentPropertyName = logRecoverableError(request, x)),
      emitErrorChunk(request, parent, parentPropertyName),
      serializeByValueID(parent)
    );
  }
}
function outlineModel(request, value) {
  value = createTask(request, value, null, !1, request.abortableTasks);
  retryTask(request, value);
  return value.id;
}
var modelRoot = !1;
function renderModelDestructive(
  request,
  task,
  parent,
  parentPropertyName,
  value
) {
  task.model = value;
  if (value === REACT_ELEMENT_TYPE) return "$";
  if (null === value) return null;
  if ("object" === typeof value) {
    switch (value.$$typeof) {
      case REACT_ELEMENT_TYPE:
        parent = request.writtenObjects;
        parentPropertyName = parent.get(value);
        if (void 0 !== parentPropertyName) {
          if (null === task.keyPath && !task.implicitSlot)
            if (modelRoot === value) modelRoot = null;
            else
              return -1 === parentPropertyName
                ? ((request = outlineModel(request, value)),
                  serializeByValueID(request))
                : serializeByValueID(parentPropertyName);
        } else parent.set(value, -1);
        return renderElement(
          request,
          task,
          value.type,
          value.key,
          value.ref,
          value.props
        );
      case REACT_LAZY_TYPE:
        return (
          (task.thenableState = null),
          (parent = value._init),
          (value = parent(value._payload)),
          renderModelDestructive(request, task, emptyRoot, "", value)
        );
    }
    if (isClientReference(value))
      return serializeClientReference(
        request,
        parent,
        parentPropertyName,
        value
      );
    parent = request.writtenObjects;
    parentPropertyName = parent.get(value);
    if ("function" === typeof value.then) {
      if (void 0 !== parentPropertyName) {
        if (null !== task.keyPath || task.implicitSlot)
          return "$@" + serializeThenable(request, task, value).toString(16);
        if (modelRoot === value) modelRoot = null;
        else return "$@" + parentPropertyName.toString(16);
      }
      request = serializeThenable(request, task, value);
      parent.set(value, request);
      return "$@" + request.toString(16);
    }
    if (void 0 !== parentPropertyName)
      if (modelRoot === value) modelRoot = null;
      else
        return -1 === parentPropertyName
          ? ((request = outlineModel(request, value)),
            serializeByValueID(request))
          : serializeByValueID(parentPropertyName);
    else parent.set(value, -1);
    if (isArrayImpl(value)) return renderFragment(request, task, value);
    if (value instanceof Map) {
      value = Array.from(value);
      for (task = 0; task < value.length; task++)
        (parent = value[task][0]),
          "object" === typeof parent &&
            null !== parent &&
            ((parentPropertyName = request.writtenObjects),
            void 0 === parentPropertyName.get(parent) &&
              parentPropertyName.set(parent, -1));
      return "$Q" + outlineModel(request, value).toString(16);
    }
    if (value instanceof Set) {
      value = Array.from(value);
      for (task = 0; task < value.length; task++)
        (parent = value[task]),
          "object" === typeof parent &&
            null !== parent &&
            ((parentPropertyName = request.writtenObjects),
            void 0 === parentPropertyName.get(parent) &&
              parentPropertyName.set(parent, -1));
      return "$W" + outlineModel(request, value).toString(16);
    }
    null === value || "object" !== typeof value
      ? (parent = null)
      : ((parent =
          (MAYBE_ITERATOR_SYMBOL && value[MAYBE_ITERATOR_SYMBOL]) ||
          value["@@iterator"]),
        (parent = "function" === typeof parent ? parent : null));
    if (parent) return renderFragment(request, task, Array.from(value));
    request = getPrototypeOf(value);
    if (
      request !== ObjectPrototype &&
      (null === request || null !== getPrototypeOf(request))
    )
      throw Error(
        "Only plain objects, and a few built-ins, can be passed to Client Components from Server Components. Classes or null prototypes are not supported."
      );
    return value;
  }
  if ("string" === typeof value) {
    if (
      "Z" === value[value.length - 1] &&
      parent[parentPropertyName] instanceof Date
    )
      return "$D" + value;
    if (1024 <= value.length) {
      request.pendingChunks += 2;
      task = request.nextChunkId++;
      if (null == byteLengthImpl)
        throw Error(
          "byteLengthOfChunk implementation is not configured. Please, provide the implementation via ReactFlightDOMServer.setConfig(...);"
        );
      parent = byteLengthImpl(value);
      parent = task.toString(16) + ":T" + parent.toString(16) + ",";
      request.completedRegularChunks.push(parent, value);
      return serializeByValueID(task);
    }
    request = "$" === value[0] ? "$" + value : value;
    return request;
  }
  if ("boolean" === typeof value) return value;
  if ("number" === typeof value)
    return Number.isFinite(value)
      ? 0 === value && -Infinity === 1 / value
        ? "$-0"
        : value
      : Infinity === value
      ? "$Infinity"
      : -Infinity === value
      ? "$-Infinity"
      : "$NaN";
  if ("undefined" === typeof value) return "$undefined";
  if ("function" === typeof value) {
    if (isClientReference(value))
      return serializeClientReference(
        request,
        parent,
        parentPropertyName,
        value
      );
    throw Error("isServerReference: Not Implemented.");
  }
  if ("symbol" === typeof value) {
    task = request.writtenSymbols;
    var existingId$9 = task.get(value);
    if (void 0 !== existingId$9) return serializeByValueID(existingId$9);
    existingId$9 = value.description;
    if (Symbol.for(existingId$9) !== value)
      throw Error(
        "Only global symbols received from Symbol.for(...) can be passed to Client Components. The symbol Symbol.for(" +
          (value.description + ") cannot be found among global symbols.") +
          describeObjectForErrorMessage(parent, parentPropertyName)
      );
    request.pendingChunks++;
    parent = request.nextChunkId++;
    parentPropertyName = stringify("$S" + existingId$9);
    parentPropertyName = parent.toString(16) + ":" + parentPropertyName + "\n";
    request.completedImportChunks.push(parentPropertyName);
    task.set(value, parent);
    return serializeByValueID(parent);
  }
  if ("bigint" === typeof value) return "$n" + value.toString(10);
  throw Error(
    "Type " +
      typeof value +
      " is not supported in Client Component props." +
      describeObjectForErrorMessage(parent, parentPropertyName)
  );
}
function logRecoverableError(request, error) {
  var prevRequest = currentRequest;
  currentRequest = null;
  try {
    var onError = request.onError;
    var errorDigest = onError(error);
  } finally {
    currentRequest = prevRequest;
  }
  if (null != errorDigest && "string" !== typeof errorDigest)
    throw Error(
      'onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "' +
        typeof errorDigest +
        '" instead'
    );
  return errorDigest || "";
}
function fatalError(request, error) {
  null !== request.destination
    ? ((request.status = 2),
      (request = request.destination),
      request.onError(error),
      request.close())
    : ((request.status = 1), (request.fatalError = error));
}
function emitErrorChunk(request, id, digest) {
  digest = { digest: digest };
  id = id.toString(16) + ":E" + stringify(digest) + "\n";
  request.completedErrorChunks.push(id);
}
var emptyRoot = {};
function retryTask(request, task) {
  if (0 === task.status)
    try {
      modelRoot = task.model;
      var resolvedModel = renderModelDestructive(
        request,
        task,
        emptyRoot,
        "",
        task.model
      );
      modelRoot = resolvedModel;
      task.keyPath = null;
      task.implicitSlot = !1;
      var json =
          "object" === typeof resolvedModel && null !== resolvedModel
            ? stringify(resolvedModel, task.toJSON)
            : stringify(resolvedModel),
        processedChunk = task.id.toString(16) + ":" + json + "\n";
      request.completedRegularChunks.push(processedChunk);
      request.abortableTasks.delete(task);
      task.status = 1;
    } catch (thrownValue) {
      var x =
        thrownValue === SuspenseException
          ? getSuspendedThenable()
          : thrownValue;
      if ("object" === typeof x && null !== x && "function" === typeof x.then) {
        var ping = task.ping;
        x.then(ping, ping);
        task.thenableState = getThenableStateAfterSuspending();
      } else {
        request.abortableTasks.delete(task);
        task.status = 4;
        var digest = logRecoverableError(request, x);
        emitErrorChunk(request, task.id, digest);
      }
    } finally {
    }
}
function performWork(request) {
  var prevDispatcher = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = HooksDispatcher;
  var prevRequest = currentRequest;
  currentRequest$1 = currentRequest = request;
  try {
    var pingedTasks = request.pingedTasks;
    request.pingedTasks = [];
    for (var i = 0; i < pingedTasks.length; i++)
      retryTask(request, pingedTasks[i]);
    null !== request.destination &&
      flushCompletedChunks(request, request.destination);
  } catch (error) {
    logRecoverableError(request, error), fatalError(request, error);
  } finally {
    (ReactCurrentDispatcher.current = prevDispatcher),
      (currentRequest$1 = null),
      (currentRequest = prevRequest);
  }
}
function flushCompletedChunks(request, destination) {
  destination.beginWriting();
  try {
    for (
      var importsChunks = request.completedImportChunks, i = 0;
      i < importsChunks.length;
      i++
    )
      request.pendingChunks--,
        writeChunkAndReturn(destination, importsChunks[i]);
    importsChunks.splice(0, i);
    var hintChunks = request.completedHintChunks;
    for (i = 0; i < hintChunks.length; i++)
      writeChunkAndReturn(destination, hintChunks[i]);
    hintChunks.splice(0, i);
    var regularChunks = request.completedRegularChunks;
    for (i = 0; i < regularChunks.length; i++)
      request.pendingChunks--,
        writeChunkAndReturn(destination, regularChunks[i]);
    regularChunks.splice(0, i);
    var errorChunks = request.completedErrorChunks;
    for (i = 0; i < errorChunks.length; i++)
      request.pendingChunks--, writeChunkAndReturn(destination, errorChunks[i]);
    errorChunks.splice(0, i);
  } finally {
    (request.flushScheduled = !1), destination.completeWriting();
  }
  destination.flushBuffered();
  0 === request.pendingChunks && destination.close();
}
var configured = !1;
exports.clearRequestedClientReferencesKeysSet = function () {
  requestedClientReferencesKeys.clear();
};
exports.getRequestedClientReferencesKeys = function () {
  return Array.from(requestedClientReferencesKeys);
};
exports.registerClientReference = function () {};
exports.registerServerReference = function () {
  throw Error("registerServerReference: Not Implemented.");
};
exports.renderToDestination = function (destination, model, options) {
  if (!configured)
    throw Error(
      "Please make sure to call `setConfig(...)` before calling `renderToDestination`."
    );
  var onError = options ? options.onError : void 0;
  if (
    null !== ReactCurrentCache.current &&
    ReactCurrentCache.current !== DefaultCacheDispatcher
  )
    throw Error("Currently React only supports one RSC renderer at a time.");
  ReactDOMCurrentDispatcher.current = ReactDOMFlightServerDispatcher;
  ReactCurrentCache.current = DefaultCacheDispatcher;
  var abortSet = new Set();
  options = [];
  var hints = new Set();
  onError = {
    status: 0,
    flushScheduled: !1,
    fatalError: null,
    destination: null,
    bundlerConfig: null,
    cache: new Map(),
    nextChunkId: 0,
    pendingChunks: 0,
    hints: hints,
    abortableTasks: abortSet,
    pingedTasks: options,
    completedImportChunks: [],
    completedHintChunks: [],
    completedRegularChunks: [],
    completedErrorChunks: [],
    writtenSymbols: new Map(),
    writtenClientReferences: new Map(),
    writtenServerReferences: new Map(),
    writtenObjects: new WeakMap(),
    identifierPrefix: "",
    identifierCount: 1,
    taintCleanupQueue: [],
    onError: void 0 === onError ? defaultErrorHandler : onError,
    onPostpone: defaultPostponeHandler
  };
  model = createTask(onError, model, null, !1, abortSet);
  options.push(model);
  onError.flushScheduled = null !== onError.destination;
  performWork(onError);
  if (1 === onError.status)
    (onError.status = 2),
      destination.onError(onError.fatalError),
      destination.close();
  else if (2 !== onError.status && null === onError.destination) {
    onError.destination = destination;
    try {
      flushCompletedChunks(onError, destination);
    } catch (error) {
      logRecoverableError(onError, error), fatalError(onError, error);
    }
  }
};
exports.setCheckIsClientReference = function (impl) {
  checkIsClientReference = impl;
};
exports.setConfig = function (config) {
  byteLengthImpl = config.byteLength;
  checkIsClientReference = config.isClientReference;
  configured = !0;
};
