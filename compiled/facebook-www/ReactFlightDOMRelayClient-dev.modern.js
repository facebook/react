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
"use strict";

var ReactFlightDOMRelayClientIntegration = require("ReactFlightDOMRelayClientIntegration");
var ReactDOM = require("react-dom");
var React = require("react");

var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

function isArray(a) {
  return isArrayImpl(a);
}

function resolveClientReference(bundlerConfig, metadata) {
  return ReactFlightDOMRelayClientIntegration.resolveClientReference(metadata);
}

function parseModelRecursively(response, parentObj, key, value) {
  if (typeof value === "string") {
    return parseModelString(response, parentObj, key, value);
  }

  if (typeof value === "object" && value !== null) {
    if (isArray(value)) {
      var parsedValue = [];

      for (var i = 0; i < value.length; i++) {
        parsedValue[i] = parseModelRecursively(
          response,
          value,
          "" + i,
          value[i]
        );
      }

      return parseModelTuple(response, parsedValue);
    } else {
      var _parsedValue = {};

      for (var innerKey in value) {
        _parsedValue[innerKey] = parseModelRecursively(
          response,
          value,
          innerKey,
          value[innerKey]
        );
      }

      return _parsedValue;
    }
  }

  return value;
}

var dummy = {};
function parseModel(response, json) {
  return parseModelRecursively(response, dummy, "", json);
}

var ReactDOMSharedInternals =
  ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

// This client file is in the shared folder because it applies to both SSR and browser contexts.
var ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;
function dispatchHint(code, model) {
  var dispatcher = ReactDOMCurrentDispatcher.current;

  if (dispatcher) {
    var href, options;

    if (typeof model === "string") {
      href = model;
    } else {
      href = model[0];
      options = model[1];
    }

    switch (code) {
      case "D": {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        dispatcher.prefetchDNS(href, options);
        return;
      }

      case "C": {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        dispatcher.preconnect(href, options);
        return;
      }

      case "L": {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        // $FlowFixMe[incompatible-call] options are not refined to their types by code
        dispatcher.preload(href, options);
        return;
      }

      case "I": {
        // $FlowFixMe[prop-missing] options are not refined to their types by code
        // $FlowFixMe[incompatible-call] options are not refined to their types by code
        dispatcher.preinit(href, options);
        return;
      }
    }
  }
}

// This refers to a WWW module.
var warningWWW = require("warning");
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

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
var REACT_ELEMENT_TYPE = Symbol.for("react.element");
var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
var REACT_MEMO_TYPE = Symbol.for("react.memo");
var REACT_LAZY_TYPE = Symbol.for("react.lazy");
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

// in case they error.

var jsxPropsParents = new WeakMap();
var jsxChildrenParents = new WeakMap();

function isObjectPrototype(object) {
  if (!object) {
    return false;
  }

  var ObjectPrototype = Object.prototype;

  if (object === ObjectPrototype) {
    return true;
  } // It might be an object from a different Realm which is
  // still just a plain simple object.

  if (Object.getPrototypeOf(object)) {
    return false;
  }

  var names = Object.getOwnPropertyNames(object);

  for (var i = 0; i < names.length; i++) {
    if (!(names[i] in ObjectPrototype)) {
      return false;
    }
  }

  return true;
}

function isSimpleObject(object) {
  if (!isObjectPrototype(Object.getPrototypeOf(object))) {
    return false;
  }

  var names = Object.getOwnPropertyNames(object);

  for (var i = 0; i < names.length; i++) {
    var descriptor = Object.getOwnPropertyDescriptor(object, names[i]);

    if (!descriptor) {
      return false;
    }

    if (!descriptor.enumerable) {
      if (
        (names[i] === "key" || names[i] === "ref") &&
        typeof descriptor.get === "function"
      ) {
        // React adds key and ref getters to props objects to issue warnings.
        // Those getters will not be transferred to the client, but that's ok,
        // so we'll special case them.
        continue;
      }

      return false;
    }
  }

  return true;
}
function objectName(object) {
  // $FlowFixMe[method-unbinding]
  var name = Object.prototype.toString.call(object);
  return name.replace(/^\[object (.*)\]$/, function (m, p0) {
    return p0;
  });
}

function describeKeyForErrorMessage(key) {
  var encodedKey = JSON.stringify(key);
  return '"' + key + '"' === encodedKey ? key : encodedKey;
}

function describeValueForErrorMessage(value) {
  switch (typeof value) {
    case "string": {
      return JSON.stringify(
        value.length <= 10 ? value : value.slice(0, 10) + "..."
      );
    }

    case "object": {
      if (isArray(value)) {
        return "[...]";
      }

      var name = objectName(value);

      if (name === "Object") {
        return "{...}";
      }

      return name;
    }

    case "function":
      return "function";

    default:
      // eslint-disable-next-line react-internal/safe-string-coercion
      return String(value);
  }
}

function describeElementType(type) {
  if (typeof type === "string") {
    return type;
  }

  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return "Suspense";

    case REACT_SUSPENSE_LIST_TYPE:
      return "SuspenseList";
  }

  if (typeof type === "object") {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeElementType(type.render);

      case REACT_MEMO_TYPE:
        return describeElementType(type.type);

      case REACT_LAZY_TYPE: {
        var lazyComponent = type;
        var payload = lazyComponent._payload;
        var init = lazyComponent._init;

        try {
          // Lazy may contain any component type so we recursively resolve it.
          return describeElementType(init(payload));
        } catch (x) {}
      }
    }
  }

  return "";
}

function describeObjectForErrorMessage(objectOrArray, expandedName) {
  var objKind = objectName(objectOrArray);

  if (objKind !== "Object" && objKind !== "Array") {
    return objKind;
  }

  var str = "";
  var start = -1;
  var length = 0;

  if (isArray(objectOrArray)) {
    if (jsxChildrenParents.has(objectOrArray)) {
      // Print JSX Children
      var type = jsxChildrenParents.get(objectOrArray);
      str = "<" + describeElementType(type) + ">";
      var array = objectOrArray;

      for (var i = 0; i < array.length; i++) {
        var value = array[i];
        var substr = void 0;

        if (typeof value === "string") {
          substr = value;
        } else if (typeof value === "object" && value !== null) {
          substr = "{" + describeObjectForErrorMessage(value) + "}";
        } else {
          substr = "{" + describeValueForErrorMessage(value) + "}";
        }

        if ("" + i === expandedName) {
          start = str.length;
          length = substr.length;
          str += substr;
        } else if (substr.length < 15 && str.length + substr.length < 40) {
          str += substr;
        } else {
          str += "{...}";
        }
      }

      str += "</" + describeElementType(type) + ">";
    } else {
      // Print Array
      str = "[";
      var _array = objectOrArray;

      for (var _i = 0; _i < _array.length; _i++) {
        if (_i > 0) {
          str += ", ";
        }

        var _value = _array[_i];

        var _substr = void 0;

        if (typeof _value === "object" && _value !== null) {
          _substr = describeObjectForErrorMessage(_value);
        } else {
          _substr = describeValueForErrorMessage(_value);
        }

        if ("" + _i === expandedName) {
          start = str.length;
          length = _substr.length;
          str += _substr;
        } else if (_substr.length < 10 && str.length + _substr.length < 40) {
          str += _substr;
        } else {
          str += "...";
        }
      }

      str += "]";
    }
  } else {
    if (objectOrArray.$$typeof === REACT_ELEMENT_TYPE) {
      str = "<" + describeElementType(objectOrArray.type) + "/>";
    } else if (jsxPropsParents.has(objectOrArray)) {
      // Print JSX
      var _type = jsxPropsParents.get(objectOrArray);

      str = "<" + (describeElementType(_type) || "...");
      var object = objectOrArray;
      var names = Object.keys(object);

      for (var _i2 = 0; _i2 < names.length; _i2++) {
        str += " ";
        var name = names[_i2];
        str += describeKeyForErrorMessage(name) + "=";
        var _value2 = object[name];

        var _substr2 = void 0;

        if (
          name === expandedName &&
          typeof _value2 === "object" &&
          _value2 !== null
        ) {
          _substr2 = describeObjectForErrorMessage(_value2);
        } else {
          _substr2 = describeValueForErrorMessage(_value2);
        }

        if (typeof _value2 !== "string") {
          _substr2 = "{" + _substr2 + "}";
        }

        if (name === expandedName) {
          start = str.length;
          length = _substr2.length;
          str += _substr2;
        } else if (_substr2.length < 10 && str.length + _substr2.length < 40) {
          str += _substr2;
        } else {
          str += "...";
        }
      }

      str += ">";
    } else {
      // Print Object
      str = "{";
      var _object = objectOrArray;

      var _names = Object.keys(_object);

      for (var _i3 = 0; _i3 < _names.length; _i3++) {
        if (_i3 > 0) {
          str += ", ";
        }

        var _name = _names[_i3];
        str += describeKeyForErrorMessage(_name) + ": ";
        var _value3 = _object[_name];

        var _substr3 = void 0;

        if (typeof _value3 === "object" && _value3 !== null) {
          _substr3 = describeObjectForErrorMessage(_value3);
        } else {
          _substr3 = describeValueForErrorMessage(_value3);
        }

        if (_name === expandedName) {
          start = str.length;
          length = _substr3.length;
          str += _substr3;
        } else if (_substr3.length < 10 && str.length + _substr3.length < 40) {
          str += _substr3;
        } else {
          str += "...";
        }
      }

      str += "}";
    }
  }

  if (expandedName === undefined) {
    return str;
  }

  if (start > -1 && length > 0) {
    var highlight = " ".repeat(start) + "^".repeat(length);
    return "\n  " + str + "\n  " + highlight;
  }

  return "\n  " + str;
}

var knownServerReferences = new WeakMap(); // Serializable values
// Thenable<ReactServerValue>
// function serializeByValueID(id: number): string {
//   return '$' + id.toString(16);
// }

function serializePromiseID(id) {
  return "$@" + id.toString(16);
}

function serializeServerReferenceID(id) {
  return "$F" + id.toString(16);
}

function serializeSymbolReference(name) {
  return "$S" + name;
}

function serializeFormDataReference(id) {
  // Why K? F is "Function". D is "Date". What else?
  return "$K" + id.toString(16);
}

function serializeNumber(number) {
  if (Number.isFinite(number)) {
    if (number === 0 && 1 / number === -Infinity) {
      return "$-0";
    } else {
      return number;
    }
  } else {
    if (number === Infinity) {
      return "$Infinity";
    } else if (number === -Infinity) {
      return "$-Infinity";
    } else {
      return "$NaN";
    }
  }
}

function serializeUndefined() {
  return "$undefined";
}

function serializeDateFromDateJSON(dateJSON) {
  // JSON.stringify automatically calls Date.prototype.toJSON which calls toISOString.
  // We need only tack on a $D prefix.
  return "$D" + dateJSON;
}

function serializeBigInt(n) {
  return "$n" + n.toString(10);
}

function escapeStringValue(value) {
  if (value[0] === "$") {
    // We need to escape $ prefixed strings since we use those to encode
    // references to IDs and as special symbol values.
    return "$" + value;
  } else {
    return value;
  }
}

function processReply(root, formFieldPrefix, resolve, reject) {
  var nextPartId = 1;
  var pendingParts = 0;
  var formData = null;

  function resolveToJSON(key, value) {
    var parent = this; // Make sure that `parent[key]` wasn't JSONified before `value` was passed to us

    {
      // $FlowFixMe[incompatible-use]
      var originalValue = parent[key];

      if (
        typeof originalValue === "object" &&
        originalValue !== value &&
        !(originalValue instanceof Date)
      ) {
        if (objectName(originalValue) !== "Object") {
          error(
            "Only plain objects can be passed to Server Functions from the Client. " +
              "%s objects are not supported.%s",
            objectName(originalValue),
            describeObjectForErrorMessage(parent, key)
          );
        } else {
          error(
            "Only plain objects can be passed to Server Functions from the Client. " +
              "Objects with toJSON methods are not supported. Convert it manually " +
              "to a simple value before passing it to props.%s",
            describeObjectForErrorMessage(parent, key)
          );
        }
      }
    }

    if (value === null) {
      return null;
    }

    if (typeof value === "object") {
      // $FlowFixMe[method-unbinding]
      if (typeof value.then === "function") {
        // We assume that any object with a .then property is a "Thenable" type,
        // or a Promise type. Either of which can be represented by a Promise.
        if (formData === null) {
          // Upgrade to use FormData to allow us to stream this value.
          formData = new FormData();
        }

        pendingParts++;
        var promiseId = nextPartId++;
        var thenable = value;
        thenable.then(
          function (partValue) {
            var partJSON = JSON.stringify(partValue, resolveToJSON); // $FlowFixMe[incompatible-type] We know it's not null because we assigned it above.

            var data = formData; // eslint-disable-next-line react-internal/safe-string-coercion

            data.append(formFieldPrefix + promiseId, partJSON);
            pendingParts--;

            if (pendingParts === 0) {
              resolve(data);
            }
          },
          function (reason) {
            // In the future we could consider serializing this as an error
            // that throws on the server instead.
            reject(reason);
          }
        );
        return serializePromiseID(promiseId);
      } // TODO: Should we the Object.prototype.toString.call() to test for cross-realm objects?

      if (value instanceof FormData) {
        if (formData === null) {
          // Upgrade to use FormData to allow us to use rich objects as its values.
          formData = new FormData();
        }

        var data = formData;
        var refId = nextPartId++; // Copy all the form fields with a prefix for this reference.
        // These must come first in the form order because we assume that all the
        // fields are available before this is referenced.

        var prefix = formFieldPrefix + refId + "_"; // $FlowFixMe[prop-missing]: FormData has forEach.

        value.forEach(function (originalValue, originalKey) {
          data.append(prefix + originalKey, originalValue);
        });
        return serializeFormDataReference(refId);
      }

      if (!isArray(value)) {
        var iteratorFn = getIteratorFn(value);

        if (iteratorFn) {
          return Array.from(value);
        }
      }

      {
        if (value !== null && !isArray(value)) {
          // Verify that this is a simple plain object.
          if (value.$$typeof === REACT_ELEMENT_TYPE) {
            error(
              "React Element cannot be passed to Server Functions from the Client.%s",
              describeObjectForErrorMessage(parent, key)
            );
          } else if (value.$$typeof === REACT_LAZY_TYPE) {
            error(
              "React Lazy cannot be passed to Server Functions from the Client.%s",
              describeObjectForErrorMessage(parent, key)
            );
          } else if (value.$$typeof === REACT_PROVIDER_TYPE) {
            error(
              "React Context Providers cannot be passed to Server Functions from the Client.%s",
              describeObjectForErrorMessage(parent, key)
            );
          } else if (objectName(value) !== "Object") {
            error(
              "Only plain objects can be passed to Client Components from Server Components. " +
                "%s objects are not supported.%s",
              objectName(value),
              describeObjectForErrorMessage(parent, key)
            );
          } else if (!isSimpleObject(value)) {
            error(
              "Only plain objects can be passed to Client Components from Server Components. " +
                "Classes or other objects with methods are not supported.%s",
              describeObjectForErrorMessage(parent, key)
            );
          } else if (Object.getOwnPropertySymbols) {
            var symbols = Object.getOwnPropertySymbols(value);

            if (symbols.length > 0) {
              error(
                "Only plain objects can be passed to Client Components from Server Components. " +
                  "Objects with symbol properties like %s are not supported.%s",
                symbols[0].description,
                describeObjectForErrorMessage(parent, key)
              );
            }
          }
        }
      } // $FlowFixMe[incompatible-return]

      return value;
    }

    if (typeof value === "string") {
      // TODO: Maybe too clever. If we support URL there's no similar trick.
      if (value[value.length - 1] === "Z") {
        // Possibly a Date, whose toJSON automatically calls toISOString
        // $FlowFixMe[incompatible-use]
        var _originalValue = parent[key];

        if (_originalValue instanceof Date) {
          return serializeDateFromDateJSON(value);
        }
      }

      return escapeStringValue(value);
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return serializeNumber(value);
    }

    if (typeof value === "undefined") {
      return serializeUndefined();
    }

    if (typeof value === "function") {
      var metaData = knownServerReferences.get(value);

      if (metaData !== undefined) {
        var metaDataJSON = JSON.stringify(metaData, resolveToJSON);

        if (formData === null) {
          // Upgrade to use FormData to allow us to stream this value.
          formData = new FormData();
        } // The reference to this function came from the same client so we can pass it back.

        var _refId = nextPartId++; // eslint-disable-next-line react-internal/safe-string-coercion

        formData.set(formFieldPrefix + _refId, metaDataJSON);
        return serializeServerReferenceID(_refId);
      }

      throw new Error(
        "Client Functions cannot be passed directly to Server Functions. " +
          "Only Functions passed from the Server can be passed back again."
      );
    }

    if (typeof value === "symbol") {
      // $FlowFixMe[incompatible-type] `description` might be undefined
      var name = value.description;

      if (Symbol.for(name) !== value) {
        throw new Error(
          "Only global symbols received from Symbol.for(...) can be passed to Server Functions. " +
            ("The symbol Symbol.for(" + // $FlowFixMe[incompatible-type] `description` might be undefined
              value.description +
              ") cannot be found among global symbols.")
        );
      }

      return serializeSymbolReference(name);
    }

    if (typeof value === "bigint") {
      return serializeBigInt(value);
    }

    throw new Error(
      "Type " +
        typeof value +
        " is not supported as an argument to a Server Function."
    );
  } // $FlowFixMe[incompatible-type] it's not going to be undefined because we'll encode it.

  var json = JSON.stringify(root, resolveToJSON);

  if (formData === null) {
    // If it's a simple data structure, we just use plain JSON.
    resolve(json);
  } else {
    // Otherwise, we use FormData to let us stream in the result.
    formData.set(formFieldPrefix + "0", json);

    if (pendingParts === 0) {
      // $FlowFixMe[incompatible-call] this has already been refined.
      resolve(formData);
    }
  }
}
var boundCache = new WeakMap();

function encodeFormData(reference) {
  var resolve, reject; // We need to have a handle on the thenable so that we can synchronously set
  // its status from processReply, when it can complete synchronously.

  var thenable = new Promise(function (res, rej) {
    resolve = res;
    reject = rej;
  });
  processReply(
    reference,
    "",
    function (body) {
      if (typeof body === "string") {
        var data = new FormData();
        data.append("0", body);
        body = data;
      }

      var fulfilled = thenable;
      fulfilled.status = "fulfilled";
      fulfilled.value = body;
      resolve(body);
    },
    function (e) {
      var rejected = thenable;
      rejected.status = "rejected";
      rejected.reason = e;
      reject(e);
    }
  );
  return thenable;
}

function encodeFormAction(identifierPrefix) {
  var reference = knownServerReferences.get(this);

  if (!reference) {
    throw new Error(
      "Tried to encode a Server Action from a different instance than the encoder is from. " +
        "This is a bug in React."
    );
  }

  var data = null;
  var name;
  var boundPromise = reference.bound;

  if (boundPromise !== null) {
    var thenable = boundCache.get(reference);

    if (!thenable) {
      thenable = encodeFormData(reference);
      boundCache.set(reference, thenable);
    }

    if (thenable.status === "rejected") {
      throw thenable.reason;
    } else if (thenable.status !== "fulfilled") {
      throw thenable;
    }

    var encodedFormData = thenable.value; // This is hacky but we need the identifier prefix to be added to
    // all fields but the suspense cache would break since we might get
    // a new identifier each time. So we just append it at the end instead.

    var prefixedData = new FormData(); // $FlowFixMe[prop-missing]

    encodedFormData.forEach(function (value, key) {
      prefixedData.append("$ACTION_" + identifierPrefix + ":" + key, value);
    });
    data = prefixedData; // We encode the name of the prefix containing the data.

    name = "$ACTION_REF_" + identifierPrefix;
  } else {
    // This is the simple case so we can just encode the ID.
    name = "$ACTION_ID_" + reference.id;
  }

  return {
    name: name,
    method: "POST",
    encType: "multipart/form-data",
    data: data
  };
}

var ReactSharedInternals =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

var ContextRegistry = ReactSharedInternals.ContextRegistry;
function getOrCreateServerContext(globalName) {
  if (!ContextRegistry[globalName]) {
    ContextRegistry[globalName] = React.createServerContext(
      globalName, // $FlowFixMe[incompatible-call] function signature doesn't reflect the symbol value
      REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED
    );
  }

  return ContextRegistry[globalName];
}

var PENDING = "pending";
var BLOCKED = "blocked";
var RESOLVED_MODEL = "resolved_model";
var RESOLVED_MODULE = "resolved_module";
var INITIALIZED = "fulfilled";
var ERRORED = "rejected"; // $FlowFixMe[missing-this-annot]

function Chunk(status, value, reason, response) {
  this.status = status;
  this.value = value;
  this.reason = reason;
  this._response = response;
} // We subclass Promise.prototype so that we get other methods like .catch

Chunk.prototype = Object.create(Promise.prototype); // TODO: This doesn't return a new Promise chain unlike the real .then

Chunk.prototype.then = function (resolve, reject) {
  var chunk = this; // If we have resolved content, we try to initialize it first which
  // might put us back into one of the other states.

  switch (chunk.status) {
    case RESOLVED_MODEL:
      initializeModelChunk(chunk);
      break;

    case RESOLVED_MODULE:
      initializeModuleChunk(chunk);
      break;
  } // The status might have changed after initialization.

  switch (chunk.status) {
    case INITIALIZED:
      resolve(chunk.value);
      break;

    case PENDING:
    case BLOCKED:
      if (resolve) {
        if (chunk.value === null) {
          chunk.value = [];
        }

        chunk.value.push(resolve);
      }

      if (reject) {
        if (chunk.reason === null) {
          chunk.reason = [];
        }

        chunk.reason.push(reject);
      }

      break;

    default:
      reject(chunk.reason);
      break;
  }
};

function readChunk(chunk) {
  // If we have resolved content, we try to initialize it first which
  // might put us back into one of the other states.
  switch (chunk.status) {
    case RESOLVED_MODEL:
      initializeModelChunk(chunk);
      break;

    case RESOLVED_MODULE:
      initializeModuleChunk(chunk);
      break;
  } // The status might have changed after initialization.

  switch (chunk.status) {
    case INITIALIZED:
      return chunk.value;

    case PENDING:
    case BLOCKED:
      // eslint-disable-next-line no-throw-literal
      throw chunk;

    default:
      throw chunk.reason;
  }
}

function getRoot(response) {
  var chunk = getChunk(response, 0);
  return chunk;
}

function createPendingChunk(response) {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new Chunk(PENDING, null, null, response);
}

function createBlockedChunk(response) {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new Chunk(BLOCKED, null, null, response);
}

function createErrorChunk(response, error) {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new Chunk(ERRORED, null, error, response);
}

function wakeChunk(listeners, value) {
  for (var i = 0; i < listeners.length; i++) {
    var listener = listeners[i];
    listener(value);
  }
}

function wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners) {
  switch (chunk.status) {
    case INITIALIZED:
      wakeChunk(resolveListeners, chunk.value);
      break;

    case PENDING:
    case BLOCKED:
      chunk.value = resolveListeners;
      chunk.reason = rejectListeners;
      break;

    case ERRORED:
      if (rejectListeners) {
        wakeChunk(rejectListeners, chunk.reason);
      }

      break;
  }
}

function triggerErrorOnChunk(chunk, error) {
  if (chunk.status !== PENDING && chunk.status !== BLOCKED) {
    // We already resolved. We didn't expect to see this.
    return;
  }

  var listeners = chunk.reason;
  var erroredChunk = chunk;
  erroredChunk.status = ERRORED;
  erroredChunk.reason = error;

  if (listeners !== null) {
    wakeChunk(listeners, error);
  }
}

function createResolvedModelChunk(response, value) {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new Chunk(RESOLVED_MODEL, value, null, response);
}

function createResolvedModuleChunk(response, value) {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new Chunk(RESOLVED_MODULE, value, null, response);
}

function resolveModelChunk(chunk, value) {
  if (chunk.status !== PENDING) {
    // We already resolved. We didn't expect to see this.
    return;
  }

  var resolveListeners = chunk.value;
  var rejectListeners = chunk.reason;
  var resolvedChunk = chunk;
  resolvedChunk.status = RESOLVED_MODEL;
  resolvedChunk.value = value;

  if (resolveListeners !== null) {
    // This is unfortunate that we're reading this eagerly if
    // we already have listeners attached since they might no
    // longer be rendered or might not be the highest pri.
    initializeModelChunk(resolvedChunk); // The status might have changed after initialization.

    wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners);
  }
}

function resolveModuleChunk(chunk, value) {
  if (chunk.status !== PENDING && chunk.status !== BLOCKED) {
    // We already resolved. We didn't expect to see this.
    return;
  }

  var resolveListeners = chunk.value;
  var rejectListeners = chunk.reason;
  var resolvedChunk = chunk;
  resolvedChunk.status = RESOLVED_MODULE;
  resolvedChunk.value = value;

  if (resolveListeners !== null) {
    initializeModuleChunk(resolvedChunk);
    wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners);
  }
}

var initializingChunk = null;
var initializingChunkBlockedModel = null;

function initializeModelChunk(chunk) {
  var prevChunk = initializingChunk;
  var prevBlocked = initializingChunkBlockedModel;
  initializingChunk = chunk;
  initializingChunkBlockedModel = null;

  try {
    var value = parseModel(chunk._response, chunk.value);

    if (
      initializingChunkBlockedModel !== null &&
      initializingChunkBlockedModel.deps > 0
    ) {
      initializingChunkBlockedModel.value = value; // We discovered new dependencies on modules that are not yet resolved.
      // We have to go the BLOCKED state until they're resolved.

      var blockedChunk = chunk;
      blockedChunk.status = BLOCKED;
      blockedChunk.value = null;
      blockedChunk.reason = null;
    } else {
      var initializedChunk = chunk;
      initializedChunk.status = INITIALIZED;
      initializedChunk.value = value;
    }
  } catch (error) {
    var erroredChunk = chunk;
    erroredChunk.status = ERRORED;
    erroredChunk.reason = error;
  } finally {
    initializingChunk = prevChunk;
    initializingChunkBlockedModel = prevBlocked;
  }
}

function initializeModuleChunk(chunk) {
  try {
    var value = ReactFlightDOMRelayClientIntegration.requireModule(chunk.value);
    var initializedChunk = chunk;
    initializedChunk.status = INITIALIZED;
    initializedChunk.value = value;
  } catch (error) {
    var erroredChunk = chunk;
    erroredChunk.status = ERRORED;
    erroredChunk.reason = error;
  }
} // Report that any missing chunks in the model is now going to throw this
// error upon read. Also notify any pending promises.

function reportGlobalError(response, error) {
  response._chunks.forEach(function (chunk) {
    // If this chunk was already resolved or errored, it won't
    // trigger an error but if it wasn't then we need to
    // because we won't be getting any new data to resolve it.
    if (chunk.status === PENDING) {
      triggerErrorOnChunk(chunk, error);
    }
  });
}

function createElement(type, key, props) {
  var element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,
    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: null,
    props: props,
    // Record the component responsible for creating this element.
    _owner: null
  };

  {
    // We don't really need to add any of these but keeping them for good measure.
    // Unfortunately, _store is enumerable in jest matchers so for equality to
    // work, I need to keep it or make _store non-enumerable in the other file.
    element._store = {};
    Object.defineProperty(element._store, "validated", {
      configurable: false,
      enumerable: false,
      writable: true,
      value: true // This element has already been validated on the server.
    });
    Object.defineProperty(element, "_self", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: null
    });
    Object.defineProperty(element, "_source", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: null
    });
  }

  return element;
}

function createLazyChunkWrapper(chunk) {
  var lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: chunk,
    _init: readChunk
  };
  return lazyType;
}

function getChunk(response, id) {
  var chunks = response._chunks;
  var chunk = chunks.get(id);

  if (!chunk) {
    chunk = createPendingChunk(response);
    chunks.set(id, chunk);
  }

  return chunk;
}

function createModelResolver(chunk, parentObject, key) {
  var blocked;

  if (initializingChunkBlockedModel) {
    blocked = initializingChunkBlockedModel;
    blocked.deps++;
  } else {
    blocked = initializingChunkBlockedModel = {
      deps: 1,
      value: null
    };
  }

  return function (value) {
    parentObject[key] = value;
    blocked.deps--;

    if (blocked.deps === 0) {
      if (chunk.status !== BLOCKED) {
        return;
      }

      var resolveListeners = chunk.value;
      var initializedChunk = chunk;
      initializedChunk.status = INITIALIZED;
      initializedChunk.value = blocked.value;

      if (resolveListeners !== null) {
        wakeChunk(resolveListeners, blocked.value);
      }
    }
  };
}

function createModelReject(chunk) {
  return function (error) {
    return triggerErrorOnChunk(chunk, error);
  };
}

function createServerReferenceProxy(response, metaData) {
  var callServer = response._callServer;

  var proxy = function () {
    // $FlowFixMe[method-unbinding]
    var args = Array.prototype.slice.call(arguments);
    var p = metaData.bound;

    if (!p) {
      return callServer(metaData.id, args);
    }

    if (p.status === INITIALIZED) {
      var bound = p.value;
      return callServer(metaData.id, bound.concat(args));
    } // Since this is a fake Promise whose .then doesn't chain, we have to wrap it.
    // TODO: Remove the wrapper once that's fixed.

    return Promise.resolve(p).then(function (bound) {
      return callServer(metaData.id, bound.concat(args));
    });
  }; // Expose encoder for use by SSR.
  // TODO: Only expose this in SSR builds and not the browser client.

  proxy.$$FORM_ACTION = encodeFormAction;
  knownServerReferences.set(proxy, metaData);
  return proxy;
}

function parseModelString(response, parentObject, key, value) {
  if (value[0] === "$") {
    if (value === "$") {
      // A very common symbol.
      return REACT_ELEMENT_TYPE;
    }

    switch (value[1]) {
      case "$": {
        // This was an escaped string value.
        return value.slice(1);
      }

      case "L": {
        // Lazy node
        var id = parseInt(value.slice(2), 16);
        var chunk = getChunk(response, id); // We create a React.lazy wrapper around any lazy values.
        // When passed into React, we'll know how to suspend on this.

        return createLazyChunkWrapper(chunk);
      }

      case "@": {
        // Promise
        var _id = parseInt(value.slice(2), 16);

        var _chunk = getChunk(response, _id);

        return _chunk;
      }

      case "S": {
        // Symbol
        return Symbol.for(value.slice(2));
      }

      case "P": {
        // Server Context Provider
        return getOrCreateServerContext(value.slice(2)).Provider;
      }

      case "F": {
        // Server Reference
        var _id2 = parseInt(value.slice(2), 16);

        var _chunk2 = getChunk(response, _id2);

        switch (_chunk2.status) {
          case RESOLVED_MODEL:
            initializeModelChunk(_chunk2);
            break;
        } // The status might have changed after initialization.

        switch (_chunk2.status) {
          case INITIALIZED: {
            var metadata = _chunk2.value;
            return createServerReferenceProxy(response, metadata);
          }
          // We always encode it first in the stream so it won't be pending.

          default:
            throw _chunk2.reason;
        }
      }

      case "I": {
        // $Infinity
        return Infinity;
      }

      case "-": {
        // $-0 or $-Infinity
        if (value === "$-0") {
          return -0;
        } else {
          return -Infinity;
        }
      }

      case "N": {
        // $NaN
        return NaN;
      }

      case "u": {
        // matches "$undefined"
        // Special encoding for `undefined` which can't be serialized as JSON otherwise.
        return undefined;
      }

      case "D": {
        // Date
        return new Date(Date.parse(value.slice(2)));
      }

      case "n": {
        // BigInt
        return BigInt(value.slice(2));
      }

      default: {
        // We assume that anything else is a reference ID.
        var _id3 = parseInt(value.slice(1), 16);

        var _chunk3 = getChunk(response, _id3);

        switch (_chunk3.status) {
          case RESOLVED_MODEL:
            initializeModelChunk(_chunk3);
            break;

          case RESOLVED_MODULE:
            initializeModuleChunk(_chunk3);
            break;
        } // The status might have changed after initialization.

        switch (_chunk3.status) {
          case INITIALIZED:
            return _chunk3.value;

          case PENDING:
          case BLOCKED:
            var parentChunk = initializingChunk;

            _chunk3.then(
              createModelResolver(parentChunk, parentObject, key),
              createModelReject(parentChunk)
            );

            return null;

          default:
            throw _chunk3.reason;
        }
      }
    }
  }

  return value;
}
function parseModelTuple(response, value) {
  var tuple = value;

  if (tuple[0] === REACT_ELEMENT_TYPE) {
    // TODO: Consider having React just directly accept these arrays as elements.
    // Or even change the ReactElement type to be an array.
    return createElement(tuple[1], tuple[2], tuple[3]);
  }

  return value;
}

function missingCall() {
  throw new Error(
    'Trying to call a function from "use server" but the callServer option ' +
      "was not implemented in your router runtime."
  );
}

function createResponse(bundlerConfig, callServer) {
  var chunks = new Map();
  var response = {
    _bundlerConfig: bundlerConfig,
    _callServer: callServer !== undefined ? callServer : missingCall,
    _chunks: chunks
  };
  return response;
}
function resolveModel(response, id, model) {
  var chunks = response._chunks;
  var chunk = chunks.get(id);

  if (!chunk) {
    chunks.set(id, createResolvedModelChunk(response, model));
  } else {
    resolveModelChunk(chunk, model);
  }
}
function resolveModule(response, id, model) {
  var chunks = response._chunks;
  var chunk = chunks.get(id);
  var clientReferenceMetadata = parseModel(response, model);
  var clientReference = resolveClientReference(
    response._bundlerConfig,
    clientReferenceMetadata
  ); // TODO: Add an option to encode modules that are lazy loaded.
  // For now we preload all modules as early as possible since it's likely
  // that we'll need them.

  var promise =
    ReactFlightDOMRelayClientIntegration.preloadModule(clientReference);

  if (promise) {
    var blockedChunk;

    if (!chunk) {
      // Technically, we should just treat promise as the chunk in this
      // case. Because it'll just behave as any other promise.
      blockedChunk = createBlockedChunk(response);
      chunks.set(id, blockedChunk);
    } else {
      // This can't actually happen because we don't have any forward
      // references to modules.
      blockedChunk = chunk;
      blockedChunk.status = BLOCKED;
    }

    promise.then(
      function () {
        return resolveModuleChunk(blockedChunk, clientReference);
      },
      function (error) {
        return triggerErrorOnChunk(blockedChunk, error);
      }
    );
  } else {
    if (!chunk) {
      chunks.set(id, createResolvedModuleChunk(response, clientReference));
    } else {
      // This can't actually happen because we don't have any forward
      // references to modules.
      resolveModuleChunk(chunk, clientReference);
    }
  }
}
function resolveErrorDev(response, id, digest, message, stack) {
  var error = new Error(
    message ||
      "An error occurred in the Server Components render but no message was provided"
  );
  error.stack = stack;
  error.digest = digest;
  var errorWithDigest = error;
  var chunks = response._chunks;
  var chunk = chunks.get(id);

  if (!chunk) {
    chunks.set(id, createErrorChunk(response, errorWithDigest));
  } else {
    triggerErrorOnChunk(chunk, errorWithDigest);
  }
}
function resolveHint(response, code, model) {
  var hintModel = parseModel(response, model);
  dispatchHint(code, hintModel);
}
function close(response) {
  // In case there are any remaining unresolved chunks, they won't
  // be resolved now. So we need to issue an error to those.
  // Ideally we should be able to early bail out if we kept a
  // ref count of pending chunks.
  reportGlobalError(response, new Error("Connection closed."));
}

function resolveRow(response, chunk) {
  if (chunk[0] === "O") {
    // $FlowFixMe[incompatible-call] unable to refine on array indices
    resolveModel(response, chunk[1], chunk[2]);
  } else if (chunk[0] === "I") {
    // $FlowFixMe[incompatible-call] unable to refine on array indices
    resolveModule(response, chunk[1], chunk[2]);
  } else if (chunk[0] === "H") {
    // $FlowFixMe[incompatible-call] unable to refine on array indices
    resolveHint(response, chunk[1], chunk[2]);
  } else {
    {
      resolveErrorDev(
        response, // $FlowFixMe[incompatible-call]: Flow doesn't support disjoint unions on tuples.
        chunk[1], // $FlowFixMe[incompatible-call]: Flow doesn't support disjoint unions on tuples.
        // $FlowFixMe[prop-missing]
        // $FlowFixMe[incompatible-use]
        chunk[2].digest, // $FlowFixMe[incompatible-call]: Flow doesn't support disjoint unions on tuples.
        // $FlowFixMe[incompatible-use]
        chunk[2].message || "", // $FlowFixMe[incompatible-call]: Flow doesn't support disjoint unions on tuples.
        // $FlowFixMe[incompatible-use]
        chunk[2].stack || ""
      );
    }
  }
}

exports.close = close;
exports.createResponse = createResponse;
exports.getRoot = getRoot;
exports.resolveRow = resolveRow;

  })();
}
