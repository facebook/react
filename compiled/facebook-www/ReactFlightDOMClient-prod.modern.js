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
var ReactDOM = require("react-dom");
require("ReactFeatureFlags");
var decoderOptions = { stream: !0 },
  ReactDOMSharedInternals =
    ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
function resolveClientReference(moduleMap, metadata) {
  if ("function" === typeof moduleMap.resolveClientReference)
    return moduleMap.resolveClientReference(metadata);
  throw Error(
    "Expected `resolveClientReference` to be defined on the moduleMap."
  );
}
var asyncModuleCache = new Map();
function preloadModule(clientReference) {
  var existingPromise = asyncModuleCache.get(clientReference.getModuleId());
  if (existingPromise)
    return "fulfilled" === existingPromise.status ? null : existingPromise;
  var modulePromise = clientReference.load();
  modulePromise.then(
    function (value) {
      modulePromise.status = "fulfilled";
      modulePromise.value = value;
    },
    function (reason) {
      modulePromise.status = "rejected";
      modulePromise.reason = reason;
    }
  );
  asyncModuleCache.set(clientReference.getModuleId(), modulePromise);
  return modulePromise;
}
var REACT_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_LAZY_TYPE = Symbol.for("react.lazy"),
  knownServerReferences = new WeakMap();
function Chunk(status, value, reason, response) {
  this.status = status;
  this.value = value;
  this.reason = reason;
  this._response = response;
}
Chunk.prototype = Object.create(Promise.prototype);
Chunk.prototype.then = function (resolve, reject) {
  switch (this.status) {
    case "resolved_model":
      initializeModelChunk(this);
      break;
    case "resolved_module":
      initializeModuleChunk(this);
  }
  switch (this.status) {
    case "fulfilled":
      resolve(this.value);
      break;
    case "pending":
    case "blocked":
    case "cyclic":
      resolve &&
        (null === this.value && (this.value = []), this.value.push(resolve));
      reject &&
        (null === this.reason && (this.reason = []), this.reason.push(reject));
      break;
    default:
      reject && reject(this.reason);
  }
};
function readChunk(chunk) {
  switch (chunk.status) {
    case "resolved_model":
      initializeModelChunk(chunk);
      break;
    case "resolved_module":
      initializeModuleChunk(chunk);
  }
  switch (chunk.status) {
    case "fulfilled":
      return chunk.value;
    case "pending":
    case "blocked":
    case "cyclic":
      throw chunk;
    default:
      throw chunk.reason;
  }
}
function wakeChunk(listeners, value) {
  for (var i = 0; i < listeners.length; i++) (0, listeners[i])(value);
}
function wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners) {
  switch (chunk.status) {
    case "fulfilled":
      wakeChunk(resolveListeners, chunk.value);
      break;
    case "pending":
    case "blocked":
    case "cyclic":
      chunk.value = resolveListeners;
      chunk.reason = rejectListeners;
      break;
    case "rejected":
      rejectListeners && wakeChunk(rejectListeners, chunk.reason);
  }
}
function triggerErrorOnChunk(chunk, error) {
  if ("pending" === chunk.status || "blocked" === chunk.status) {
    var listeners = chunk.reason;
    chunk.status = "rejected";
    chunk.reason = error;
    null !== listeners && wakeChunk(listeners, error);
  }
}
function resolveModuleChunk(chunk, value) {
  if ("pending" === chunk.status || "blocked" === chunk.status) {
    var resolveListeners = chunk.value,
      rejectListeners = chunk.reason;
    chunk.status = "resolved_module";
    chunk.value = value;
    null !== resolveListeners &&
      (initializeModuleChunk(chunk),
      wakeChunkIfInitialized(chunk, resolveListeners, rejectListeners));
  }
}
var initializingChunk = null,
  initializingChunkBlockedModel = null;
function initializeModelChunk(chunk) {
  var prevChunk = initializingChunk,
    prevBlocked = initializingChunkBlockedModel;
  initializingChunk = chunk;
  initializingChunkBlockedModel = null;
  var resolvedModel = chunk.value;
  chunk.status = "cyclic";
  chunk.value = null;
  chunk.reason = null;
  try {
    var value = JSON.parse(resolvedModel, chunk._response._fromJSON);
    if (
      null !== initializingChunkBlockedModel &&
      0 < initializingChunkBlockedModel.deps
    )
      (initializingChunkBlockedModel.value = value),
        (chunk.status = "blocked"),
        (chunk.value = null),
        (chunk.reason = null);
    else {
      var resolveListeners = chunk.value;
      chunk.status = "fulfilled";
      chunk.value = value;
      null !== resolveListeners && wakeChunk(resolveListeners, value);
    }
  } catch (error) {
    (chunk.status = "rejected"), (chunk.reason = error);
  } finally {
    (initializingChunk = prevChunk),
      (initializingChunkBlockedModel = prevBlocked);
  }
}
function initializeModuleChunk(chunk) {
  try {
    var promise = asyncModuleCache.get(chunk.value.getModuleId());
    if ("fulfilled" === promise.status) var module = promise.value;
    else throw promise.reason;
    chunk.status = "fulfilled";
    chunk.value = module;
  } catch (error) {
    (chunk.status = "rejected"), (chunk.reason = error);
  }
}
function reportGlobalError(response, error) {
  response._chunks.forEach(function (chunk) {
    "pending" === chunk.status && triggerErrorOnChunk(chunk, error);
  });
}
function getChunk(response, id) {
  var chunks = response._chunks,
    chunk = chunks.get(id);
  chunk ||
    ((chunk = new Chunk("pending", null, null, response)),
    chunks.set(id, chunk));
  return chunk;
}
function createModelResolver(chunk, parentObject, key, cyclic, response, map) {
  if (initializingChunkBlockedModel) {
    var blocked = initializingChunkBlockedModel;
    cyclic || blocked.deps++;
  } else
    blocked = initializingChunkBlockedModel = {
      deps: cyclic ? 0 : 1,
      value: null
    };
  return function (value) {
    parentObject[key] = map(response, value);
    "" === key && null === blocked.value && (blocked.value = parentObject[key]);
    blocked.deps--;
    0 === blocked.deps &&
      "blocked" === chunk.status &&
      ((value = chunk.value),
      (chunk.status = "fulfilled"),
      (chunk.value = blocked.value),
      null !== value && wakeChunk(value, blocked.value));
  };
}
function createModelReject(chunk) {
  return function (error) {
    return triggerErrorOnChunk(chunk, error);
  };
}
function createServerReferenceProxy(response, metaData) {
  function proxy() {
    var args = Array.prototype.slice.call(arguments),
      p = metaData.bound;
    return p
      ? "fulfilled" === p.status
        ? callServer(metaData.id, p.value.concat(args))
        : Promise.resolve(p).then(function (bound) {
            return callServer(metaData.id, bound.concat(args));
          })
      : callServer(metaData.id, args);
  }
  var callServer = response._callServer;
  knownServerReferences.set(proxy, metaData);
  return proxy;
}
function getOutlinedModel(response, id, parentObject, key, map) {
  id = getChunk(response, id);
  switch (id.status) {
    case "resolved_model":
      initializeModelChunk(id);
      break;
    case "resolved_module":
      initializeModuleChunk(id);
  }
  switch (id.status) {
    case "fulfilled":
      return map(response, id.value);
    case "pending":
    case "blocked":
    case "cyclic":
      var parentChunk = initializingChunk;
      id.then(
        createModelResolver(
          parentChunk,
          parentObject,
          key,
          "cyclic" === id.status,
          response,
          map
        ),
        createModelReject(parentChunk)
      );
      return null;
    default:
      throw id.reason;
  }
}
function createMap(response, model) {
  return new Map(model);
}
function createSet(response, model) {
  return new Set(model);
}
function createFormData(response, model) {
  response = new FormData();
  for (var i = 0; i < model.length; i++)
    response.append(model[i][0], model[i][1]);
  return response;
}
function createModel(response, model) {
  return model;
}
function parseModelString(response, parentObject, key, value) {
  if ("$" === value[0]) {
    if ("$" === value) return REACT_ELEMENT_TYPE;
    switch (value[1]) {
      case "$":
        return value.slice(1);
      case "L":
        return (
          (parentObject = parseInt(value.slice(2), 16)),
          (response = getChunk(response, parentObject)),
          { $$typeof: REACT_LAZY_TYPE, _payload: response, _init: readChunk }
        );
      case "@":
        if (2 === value.length) return new Promise(function () {});
        parentObject = parseInt(value.slice(2), 16);
        return getChunk(response, parentObject);
      case "S":
        return Symbol.for(value.slice(2));
      case "F":
        return (
          (value = parseInt(value.slice(2), 16)),
          getOutlinedModel(
            response,
            value,
            parentObject,
            key,
            createServerReferenceProxy
          )
        );
      case "T":
        parentObject = parseInt(value.slice(2), 16);
        response = response._tempRefs;
        if (null == response)
          throw Error(
            "Missing a temporary reference set but the RSC response returned a temporary reference. Pass a temporaryReference option with the set that was used with the reply."
          );
        if (0 > parentObject || parentObject >= response.length)
          throw Error(
            "The RSC response contained a reference that doesn't exist in the temporary reference set. Always pass the matching set that was used to create the reply when parsing its response."
          );
        return response[parentObject];
      case "Q":
        return (
          (value = parseInt(value.slice(2), 16)),
          getOutlinedModel(response, value, parentObject, key, createMap)
        );
      case "W":
        return (
          (value = parseInt(value.slice(2), 16)),
          getOutlinedModel(response, value, parentObject, key, createSet)
        );
      case "B":
        return;
      case "K":
        return (
          (value = parseInt(value.slice(2), 16)),
          getOutlinedModel(response, value, parentObject, key, createFormData)
        );
      case "I":
        return Infinity;
      case "-":
        return "$-0" === value ? -0 : -Infinity;
      case "N":
        return NaN;
      case "u":
        return;
      case "D":
        return new Date(Date.parse(value.slice(2)));
      case "n":
        return BigInt(value.slice(2));
      default:
        return (
          (value = parseInt(value.slice(1), 16)),
          getOutlinedModel(response, value, parentObject, key, createModel)
        );
    }
  }
  return value;
}
function missingCall() {
  throw Error(
    'Trying to call a function from "use server" but the callServer option was not implemented in your router runtime.'
  );
}
function resolveModule(response, id, model) {
  var chunks = response._chunks,
    chunk = chunks.get(id);
  model = JSON.parse(model, response._fromJSON);
  var clientReference = resolveClientReference(response._bundlerConfig, model);
  if ((model = preloadModule(clientReference))) {
    if (chunk) {
      var blockedChunk = chunk;
      blockedChunk.status = "blocked";
    } else
      (blockedChunk = new Chunk("blocked", null, null, response)),
        chunks.set(id, blockedChunk);
    model.then(
      function () {
        return resolveModuleChunk(blockedChunk, clientReference);
      },
      function (error) {
        return triggerErrorOnChunk(blockedChunk, error);
      }
    );
  } else
    chunk
      ? resolveModuleChunk(chunk, clientReference)
      : chunks.set(
          id,
          new Chunk("resolved_module", clientReference, null, response)
        );
}
function createFromJSONCallback(response) {
  return function (key, value) {
    return "string" === typeof value
      ? parseModelString(response, this, key, value)
      : "object" === typeof value && null !== value
      ? ((key =
          value[0] === REACT_ELEMENT_TYPE
            ? {
                $$typeof: REACT_ELEMENT_TYPE,
                type: value[1],
                key: value[2],
                ref: null,
                props: value[3],
                _owner: null
              }
            : value),
        key)
      : value;
  };
}
function startReadingFromStream(response, stream) {
  function progress(_ref) {
    var value = _ref.value;
    if (_ref.done) reportGlobalError(response, Error("Connection closed."));
    else {
      value =
        "string" !== typeof value ? value : new TextEncoder().encode(value);
      var i = 0,
        rowState = response._rowState,
        rowID = response._rowID,
        rowTag = response._rowTag,
        rowLength = response._rowLength;
      _ref = response._buffer;
      for (var chunkLength = value.length; i < chunkLength; ) {
        var lastIdx = -1;
        switch (rowState) {
          case 0:
            lastIdx = value[i++];
            58 === lastIdx
              ? (rowState = 1)
              : (rowID =
                  (rowID << 4) | (96 < lastIdx ? lastIdx - 87 : lastIdx - 48));
            continue;
          case 1:
            rowState = value[i];
            84 === rowState
              ? ((rowTag = rowState), (rowState = 2), i++)
              : (64 < rowState && 91 > rowState) ||
                114 === rowState ||
                120 === rowState
              ? ((rowTag = rowState), (rowState = 3), i++)
              : ((rowTag = 0), (rowState = 3));
            continue;
          case 2:
            lastIdx = value[i++];
            44 === lastIdx
              ? (rowState = 4)
              : (rowLength =
                  (rowLength << 4) |
                  (96 < lastIdx ? lastIdx - 87 : lastIdx - 48));
            continue;
          case 3:
            lastIdx = value.indexOf(10, i);
            break;
          case 4:
            (lastIdx = i + rowLength), lastIdx > value.length && (lastIdx = -1);
        }
        var offset = value.byteOffset + i;
        if (-1 < lastIdx) {
          i = new Uint8Array(value.buffer, offset, lastIdx - i);
          rowLength = response;
          offset = rowTag;
          var stringDecoder = rowLength._stringDecoder;
          rowTag = "";
          for (var i$jscomp$0 = 0; i$jscomp$0 < _ref.length; i$jscomp$0++)
            rowTag += stringDecoder.decode(_ref[i$jscomp$0], decoderOptions);
          rowTag += stringDecoder.decode(i);
          switch (offset) {
            case 73:
              resolveModule(rowLength, rowID, rowTag);
              break;
            case 72:
              rowID = rowTag[0];
              rowTag = rowTag.slice(1);
              rowLength = JSON.parse(rowTag, rowLength._fromJSON);
              rowTag = ReactDOMSharedInternals.d;
              switch (rowID) {
                case "D":
                  rowTag.D(rowLength);
                  break;
                case "C":
                  "string" === typeof rowLength
                    ? rowTag.C(rowLength)
                    : rowTag.C(rowLength[0], rowLength[1]);
                  break;
                case "L":
                  rowID = rowLength[0];
                  i = rowLength[1];
                  3 === rowLength.length
                    ? rowTag.L(rowID, i, rowLength[2])
                    : rowTag.L(rowID, i);
                  break;
                case "m":
                  "string" === typeof rowLength
                    ? rowTag.m(rowLength)
                    : rowTag.m(rowLength[0], rowLength[1]);
                  break;
                case "X":
                  "string" === typeof rowLength
                    ? rowTag.X(rowLength)
                    : rowTag.X(rowLength[0], rowLength[1]);
                  break;
                case "S":
                  "string" === typeof rowLength
                    ? rowTag.S(rowLength)
                    : rowTag.S(
                        rowLength[0],
                        0 === rowLength[1] ? void 0 : rowLength[1],
                        3 === rowLength.length ? rowLength[2] : void 0
                      );
                  break;
                case "M":
                  "string" === typeof rowLength
                    ? rowTag.M(rowLength)
                    : rowTag.M(rowLength[0], rowLength[1]);
              }
              break;
            case 69:
              rowTag = JSON.parse(rowTag);
              i = rowTag.digest;
              rowTag = Error(
                "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error."
              );
              rowTag.stack = "Error: " + rowTag.message;
              rowTag.digest = i;
              i = rowLength._chunks;
              (offset = i.get(rowID))
                ? triggerErrorOnChunk(offset, rowTag)
                : i.set(rowID, new Chunk("rejected", null, rowTag, rowLength));
              break;
            case 84:
              rowLength._chunks.set(
                rowID,
                new Chunk("fulfilled", rowTag, null, rowLength)
              );
              break;
            case 68:
            case 87:
              throw Error(
                "Failed to read a RSC payload created by a development version of React on the server while using a production version on the client. Always use matching versions on the server and the client."
              );
            default:
              (i = rowLength._chunks),
                (offset = i.get(rowID))
                  ? ((rowLength = offset),
                    (rowID = rowTag),
                    "pending" === rowLength.status &&
                      ((rowTag = rowLength.value),
                      (i = rowLength.reason),
                      (rowLength.status = "resolved_model"),
                      (rowLength.value = rowID),
                      null !== rowTag &&
                        (initializeModelChunk(rowLength),
                        wakeChunkIfInitialized(rowLength, rowTag, i))))
                  : i.set(
                      rowID,
                      new Chunk("resolved_model", rowTag, null, rowLength)
                    );
          }
          i = lastIdx;
          3 === rowState && i++;
          rowLength = rowID = rowTag = rowState = 0;
          _ref.length = 0;
        } else {
          value = new Uint8Array(value.buffer, offset, value.byteLength - i);
          _ref.push(value);
          rowLength -= value.byteLength;
          break;
        }
      }
      response._rowState = rowState;
      response._rowID = rowID;
      response._rowTag = rowTag;
      response._rowLength = rowLength;
      return reader.read().then(progress).catch(error);
    }
  }
  function error(e) {
    reportGlobalError(response, e);
  }
  var reader = stream.getReader();
  reader.read().then(progress).catch(error);
}
exports.createFromReadableStream = function (stream, options) {
  options = options && options.moduleMap;
  if (null == options) throw Error("Expected `moduleMap` to be defined.");
  var chunks = new Map();
  options = {
    _bundlerConfig: options,
    _moduleLoading: null,
    _callServer: missingCall,
    _encodeFormAction: void 0,
    _nonce: void 0,
    _chunks: chunks,
    _stringDecoder: new TextDecoder(),
    _fromJSON: null,
    _rowState: 0,
    _rowID: 0,
    _rowTag: 0,
    _rowLength: 0,
    _buffer: [],
    _tempRefs: void 0
  };
  options._fromJSON = createFromJSONCallback(options);
  startReadingFromStream(options, stream);
  return getChunk(options, 0);
};
