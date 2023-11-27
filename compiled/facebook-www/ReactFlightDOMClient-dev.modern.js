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

if (__DEV__) {
  (function () {
    "use strict";

    var ReactDOM = require("react-dom");
    var React = require("react");

    // Re-export dynamic flags from the www version.
    require("ReactFeatureFlags");
    var enableBinaryFlight = false;

    function createStringDecoder() {
      return new TextDecoder();
    }
    var decoderOptions = {
      stream: true
    };
    function readPartialStringChunk(decoder, buffer) {
      return decoder.decode(buffer, decoderOptions);
    }
    function readFinalStringChunk(decoder, buffer) {
      return decoder.decode(buffer);
    }

    var ReactDOMSharedInternals =
      ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    // This client file is in the shared folder because it applies to both SSR and browser contexts.
    var ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;
    function dispatchHint(code, model) {
      var dispatcher = ReactDOMCurrentDispatcher.current;

      if (dispatcher) {
        switch (code) {
          case "D": {
            var refined = refineModel(code, model);
            var href = refined;
            dispatcher.prefetchDNS(href);
            return;
          }

          case "C": {
            var _refined = refineModel(code, model);

            if (typeof _refined === "string") {
              var _href = _refined;
              dispatcher.preconnect(_href);
            } else {
              var _href2 = _refined[0];
              var crossOrigin = _refined[1];
              dispatcher.preconnect(_href2, crossOrigin);
            }

            return;
          }

          case "L": {
            var _refined2 = refineModel(code, model);

            var _href3 = _refined2[0];
            var as = _refined2[1];

            if (_refined2.length === 3) {
              var options = _refined2[2];
              dispatcher.preload(_href3, as, options);
            } else {
              dispatcher.preload(_href3, as);
            }

            return;
          }

          case "m": {
            var _refined3 = refineModel(code, model);

            if (typeof _refined3 === "string") {
              var _href4 = _refined3;
              dispatcher.preloadModule(_href4);
            } else {
              var _href5 = _refined3[0];
              var _options = _refined3[1];
              dispatcher.preloadModule(_href5, _options);
            }

            return;
          }

          case "S": {
            var _refined4 = refineModel(code, model);

            if (typeof _refined4 === "string") {
              var _href6 = _refined4;
              dispatcher.preinitStyle(_href6);
            } else {
              var _href7 = _refined4[0];
              var precedence = _refined4[1] === 0 ? undefined : _refined4[1];

              var _options2 = _refined4.length === 3 ? _refined4[2] : undefined;

              dispatcher.preinitStyle(_href7, precedence, _options2);
            }

            return;
          }

          case "X": {
            var _refined5 = refineModel(code, model);

            if (typeof _refined5 === "string") {
              var _href8 = _refined5;
              dispatcher.preinitScript(_href8);
            } else {
              var _href9 = _refined5[0];
              var _options3 = _refined5[1];
              dispatcher.preinitScript(_href9, _options3);
            }

            return;
          }

          case "M": {
            var _refined6 = refineModel(code, model);

            if (typeof _refined6 === "string") {
              var _href10 = _refined6;
              dispatcher.preinitModuleScript(_href10);
            } else {
              var _href11 = _refined6[0];
              var _options4 = _refined6[1];
              dispatcher.preinitModuleScript(_href11, _options4);
            }

            return;
          }
        }
      }
    } // Flow is having trouble refining the HintModels so we help it a bit.
    // This should be compiled out in the production build.

    function refineModel(code, model) {
      return model;
    }

    function resolveClientReference(moduleMap, metadata) {
      if (typeof moduleMap.resolveClientReference === "function") {
        return moduleMap.resolveClientReference(metadata);
      } else {
        throw new Error(
          "Expected `resolveClientReference` to be defined on the moduleMap."
        );
      }
    }
    var asyncModuleCache = new Map();
    function preloadModule(clientReference) {
      var existingPromise = asyncModuleCache.get(clientReference.getModuleId());

      if (existingPromise) {
        if (existingPromise.status === "fulfilled") {
          return null;
        }

        return existingPromise;
      } else {
        var modulePromise = clientReference.load();
        modulePromise.then(
          function (value) {
            var fulfilledThenable = modulePromise;
            fulfilledThenable.status = "fulfilled";
            fulfilledThenable.value = value;
          },
          function (reason) {
            var rejectedThenable = modulePromise;
            rejectedThenable.status = "rejected";
            rejectedThenable.reason = reason;
          }
        );
        asyncModuleCache.set(clientReference.getModuleId(), modulePromise);
        return modulePromise;
      }
    }
    function requireModule(clientReference) {
      var module; // We assume that preloadModule has been called before, which
      // should have added something to the module cache.

      var promise = asyncModuleCache.get(clientReference.getModuleId());

      if (promise.status === "fulfilled") {
        module = promise.value;
      } else {
        throw promise.reason;
      } // We are currently only support default exports for client components

      return module;
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
          var ReactDebugCurrentFrame =
            ReactSharedInternals.ReactDebugCurrentFrame;
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
    var REACT_SERVER_CONTEXT_TYPE = Symbol.for("react.server_context");
    var REACT_LAZY_TYPE = Symbol.for("react.lazy");
    var REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for(
      "react.default_value"
    );

    var knownServerReferences = new WeakMap(); // Serializable values

    function registerServerReference(proxy, reference) {
      knownServerReferences.set(proxy, reference);
    } // $FlowFixMe[method-unbinding]

    var ReactSharedInternals =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    var ContextRegistry = ReactSharedInternals.ContextRegistry;
    function getOrCreateServerContext(globalName) {
      if (!ContextRegistry[globalName]) {
        var context = {
          $$typeof: REACT_SERVER_CONTEXT_TYPE,
          // As a workaround to support multiple concurrent renderers, we categorize
          // some renderers as primary and others as secondary. We only expect
          // there to be two concurrent renderers at most: React Native (primary) and
          // Fabric (secondary); React DOM (primary) and React ART (secondary).
          // Secondary renderers store their context values on separate fields.
          _currentValue: REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED,
          _currentValue2: REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED,
          _defaultValue: REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED,
          // Used to track how many concurrent renderers this context currently
          // supports within in a single renderer. Such as parallel server rendering.
          _threadCount: 0,
          // These are circular
          Provider: null,
          Consumer: null,
          _globalName: globalName
        };
        context.Provider = {
          $$typeof: REACT_PROVIDER_TYPE,
          _context: context
        };

        {
          var hasWarnedAboutUsingConsumer;
          context._currentRenderer = null;
          context._currentRenderer2 = null;
          Object.defineProperties(context, {
            Consumer: {
              get: function () {
                if (!hasWarnedAboutUsingConsumer) {
                  error(
                    "Consumer pattern is not supported by ReactServerContext"
                  );

                  hasWarnedAboutUsingConsumer = true;
                }

                return null;
              }
            }
          });
        }

        ContextRegistry[globalName] = context;
      }

      return ContextRegistry[globalName];
    }

    var ROW_ID = 0;
    var ROW_TAG = 1;
    var ROW_LENGTH = 2;
    var ROW_CHUNK_BY_NEWLINE = 3;
    var ROW_CHUNK_BY_LENGTH = 4;
    var PENDING = "pending";
    var BLOCKED = "blocked";
    var CYCLIC = "cyclic";
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
        case CYCLIC:
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
        case CYCLIC:
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
        case CYCLIC:
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

    function createInitializedTextChunk(response, value) {
      // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
      return new Chunk(INITIALIZED, value, null, response);
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
      var resolvedModel = chunk.value; // We go to the CYCLIC state until we've fully resolved this.
      // We do this before parsing in case we try to initialize the same chunk
      // while parsing the model. Such as in a cyclic reference.

      var cyclicChunk = chunk;
      cyclicChunk.status = CYCLIC;
      cyclicChunk.value = null;
      cyclicChunk.reason = null;

      try {
        var value = parseModel(chunk._response, resolvedModel);

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
          var resolveListeners = cyclicChunk.value;
          var initializedChunk = chunk;
          initializedChunk.status = INITIALIZED;
          initializedChunk.value = value;

          if (resolveListeners !== null) {
            wakeChunk(resolveListeners, value);
          }
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
        var value = requireModule(chunk.value);
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

    function createModelResolver(chunk, parentObject, key, cyclic) {
      var blocked;

      if (initializingChunkBlockedModel) {
        blocked = initializingChunkBlockedModel;

        if (!cyclic) {
          blocked.deps++;
        }
      } else {
        blocked = initializingChunkBlockedModel = {
          deps: cyclic ? 0 : 1,
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
      };

      registerServerReference(proxy, metaData);
      return proxy;
    }

    function getOutlinedModel(response, id) {
      var chunk = getChunk(response, id);

      switch (chunk.status) {
        case RESOLVED_MODEL:
          initializeModelChunk(chunk);
          break;
      } // The status might have changed after initialization.

      switch (chunk.status) {
        case INITIALIZED: {
          return chunk.value;
        }
        // We always encode it first in the stream so it won't be pending.

        default:
          throw chunk.reason;
      }
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

            var metadata = getOutlinedModel(response, _id2);
            return createServerReferenceProxy(response, metadata);
          }

          case "Q": {
            // Map
            var _id3 = parseInt(value.slice(2), 16);

            var data = getOutlinedModel(response, _id3);
            return new Map(data);
          }

          case "W": {
            // Set
            var _id4 = parseInt(value.slice(2), 16);

            var _data = getOutlinedModel(response, _id4);

            return new Set(_data);
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
            var _id5 = parseInt(value.slice(1), 16);

            var _chunk2 = getChunk(response, _id5);

            switch (_chunk2.status) {
              case RESOLVED_MODEL:
                initializeModelChunk(_chunk2);
                break;

              case RESOLVED_MODULE:
                initializeModuleChunk(_chunk2);
                break;
            } // The status might have changed after initialization.

            switch (_chunk2.status) {
              case INITIALIZED:
                return _chunk2.value;

              case PENDING:
              case BLOCKED:
              case CYCLIC:
                var parentChunk = initializingChunk;

                _chunk2.then(
                  createModelResolver(
                    parentChunk,
                    parentObject,
                    key,
                    _chunk2.status === CYCLIC
                  ),
                  createModelReject(parentChunk)
                );

                return null;

              default:
                throw _chunk2.reason;
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

    function createResponse(bundlerConfig, moduleLoading, callServer, nonce) {
      var chunks = new Map();
      var response = {
        _bundlerConfig: bundlerConfig,
        _moduleLoading: moduleLoading,
        _callServer: callServer !== undefined ? callServer : missingCall,
        _nonce: nonce,
        _chunks: chunks,
        _stringDecoder: createStringDecoder(),
        _fromJSON: null,
        _rowState: 0,
        _rowID: 0,
        _rowTag: 0,
        _rowLength: 0,
        _buffer: []
      }; // Don't inline this call because it causes closure to outline the call above.

      response._fromJSON = createFromJSONCallback(response);
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

    function resolveText(response, id, text) {
      var chunks = response._chunks; // We assume that we always reference large strings after they've been
      // emitted.

      chunks.set(id, createInitializedTextChunk(response, text));
    }

    function resolveModule(response, id, model) {
      var chunks = response._chunks;
      var chunk = chunks.get(id);
      var clientReferenceMetadata = parseModel(response, model);
      var clientReference = resolveClientReference(
        response._bundlerConfig,
        clientReferenceMetadata
      );
      // For now we preload all modules as early as possible since it's likely
      // that we'll need them.

      var promise = preloadModule(clientReference);

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

    function processFullRow(response, id, tag, buffer, chunk) {
      var stringDecoder = response._stringDecoder;
      var row = "";

      for (var i = 0; i < buffer.length; i++) {
        row += readPartialStringChunk(stringDecoder, buffer[i]);
      }

      row += readFinalStringChunk(stringDecoder, chunk);

      switch (tag) {
        case 73: /* "I" */
        {
          resolveModule(response, id, row);
          return;
        }

        case 72: /* "H" */
        {
          var code = row[0];
          resolveHint(response, code, row.slice(1));
          return;
        }

        case 69: /* "E" */
        {
          var errorInfo = JSON.parse(row);

          {
            resolveErrorDev(
              response,
              id,
              errorInfo.digest,
              errorInfo.message,
              errorInfo.stack
            );
          }

          return;
        }

        case 84: /* "T" */
        {
          resolveText(response, id, row);
          return;
        }

        case 80:
        /* "P" */
        // Fallthrough

        default: /* """ "{" "[" "t" "f" "n" "0" - "9" */
        {
          // We assume anything else is JSON.
          resolveModel(response, id, row);
          return;
        }
      }
    }

    function processBinaryChunk(response, chunk) {
      var i = 0;
      var rowState = response._rowState;
      var rowID = response._rowID;
      var rowTag = response._rowTag;
      var rowLength = response._rowLength;
      var buffer = response._buffer;
      var chunkLength = chunk.length;

      while (i < chunkLength) {
        var lastIdx = -1;

        switch (rowState) {
          case ROW_ID: {
            var byte = chunk[i++];

            if (
              byte === 58
              /* ":" */
            ) {
              // Finished the rowID, next we'll parse the tag.
              rowState = ROW_TAG;
            } else {
              rowID = (rowID << 4) | (byte > 96 ? byte - 87 : byte - 48);
            }

            continue;
          }

          case ROW_TAG: {
            var resolvedRowTag = chunk[i];

            if (
              resolvedRowTag === 84 ||
              /* "T" */
              enableBinaryFlight
              /* "V" */
            ) {
              rowTag = resolvedRowTag;
              rowState = ROW_LENGTH;
              i++;
            } else if (
              resolvedRowTag > 64 &&
              resolvedRowTag < 91
              /* "A"-"Z" */
            ) {
              rowTag = resolvedRowTag;
              rowState = ROW_CHUNK_BY_NEWLINE;
              i++;
            } else {
              rowTag = 0;
              rowState = ROW_CHUNK_BY_NEWLINE; // This was an unknown tag so it was probably part of the data.
            }

            continue;
          }

          case ROW_LENGTH: {
            var _byte = chunk[i++];

            if (
              _byte === 44
              /* "," */
            ) {
              // Finished the rowLength, next we'll buffer up to that length.
              rowState = ROW_CHUNK_BY_LENGTH;
            } else {
              rowLength =
                (rowLength << 4) | (_byte > 96 ? _byte - 87 : _byte - 48);
            }

            continue;
          }

          case ROW_CHUNK_BY_NEWLINE: {
            // We're looking for a newline
            lastIdx = chunk.indexOf(
              10,
              /* "\n" */
              i
            );
            break;
          }

          case ROW_CHUNK_BY_LENGTH: {
            // We're looking for the remaining byte length
            lastIdx = i + rowLength;

            if (lastIdx > chunk.length) {
              lastIdx = -1;
            }

            break;
          }
        }

        var offset = chunk.byteOffset + i;

        if (lastIdx > -1) {
          // We found the last chunk of the row
          var length = lastIdx - i;
          var lastChunk = new Uint8Array(chunk.buffer, offset, length);
          processFullRow(response, rowID, rowTag, buffer, lastChunk); // Reset state machine for a new row

          i = lastIdx;

          if (rowState === ROW_CHUNK_BY_NEWLINE) {
            // If we're trailing by a newline we need to skip it.
            i++;
          }

          rowState = ROW_ID;
          rowTag = 0;
          rowID = 0;
          rowLength = 0;
          buffer.length = 0;
        } else {
          // The rest of this row is in a future chunk. We stash the rest of the
          // current chunk until we can process the full row.
          var _length = chunk.byteLength - i;

          var remainingSlice = new Uint8Array(chunk.buffer, offset, _length);
          buffer.push(remainingSlice); // Update how many bytes we're still waiting for. If we're looking for
          // a newline, this doesn't hurt since we'll just ignore it.

          rowLength -= remainingSlice.byteLength;
          break;
        }
      }

      response._rowState = rowState;
      response._rowID = rowID;
      response._rowTag = rowTag;
      response._rowLength = rowLength;
    }

    function parseModel(response, json) {
      return JSON.parse(json, response._fromJSON);
    }

    function createFromJSONCallback(response) {
      // $FlowFixMe[missing-this-annot]
      return function (key, value) {
        if (typeof value === "string") {
          // We can't use .bind here because we need the "this" value.
          return parseModelString(response, this, key, value);
        }

        if (typeof value === "object" && value !== null) {
          return parseModelTuple(response, value);
        }

        return value;
      };
    }

    function close(response) {
      // In case there are any remaining unresolved chunks, they won't
      // be resolved now. So we need to issue an error to those.
      // Ideally we should be able to early bail out if we kept a
      // ref count of pending chunks.
      reportGlobalError(response, new Error("Connection closed."));
    }

    function createResponseFromOptions(options) {
      var moduleMap = options && options.moduleMap;

      if (moduleMap == null) {
        throw new Error("Expected `moduleMap` to be defined.");
      }

      return createResponse(moduleMap, null, undefined, undefined);
    }

    function processChunk(response, chunk) {
      var buffer = typeof chunk !== "string" ? chunk : encodeString(chunk);
      processBinaryChunk(response, buffer);
    }

    function encodeString(string) {
      var textEncoder = new TextEncoder();
      return textEncoder.encode(string);
    }

    function startReadingFromStream(response, stream) {
      var reader = stream.getReader();

      function progress(_ref) {
        var done = _ref.done,
          value = _ref.value;

        if (done) {
          close(response);
          return;
        }

        var buffer = value;
        processChunk(response, buffer);
        return reader.read().then(progress).catch(error);
      }

      function error(e) {
        reportGlobalError(response, e);
      }

      reader.read().then(progress).catch(error);
    }

    function createFromReadableStream(stream, options) {
      var response = createResponseFromOptions(options);
      startReadingFromStream(response, stream);
      return getRoot(response);
    }

    exports.createFromReadableStream = createFromReadableStream;
  })();
}
