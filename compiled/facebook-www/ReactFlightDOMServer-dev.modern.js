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

    // eslint-disable-next-line no-unused-vars
    // eslint-disable-next-line no-unused-vars
    var requestedClientReferencesKeys = new Set();
    var checkIsClientReference;
    function setCheckIsClientReference(impl) {
      checkIsClientReference = impl;
    }
    function registerClientReference(clientReference) {}
    function isClientReference(reference) {
      if (checkIsClientReference == null) {
        throw new Error("Expected implementation for checkIsClientReference.");
      }

      return checkIsClientReference(reference);
    }
    function getClientReferenceKey(clientReference) {
      var moduleId = clientReference.getModuleId();
      requestedClientReferencesKeys.add(moduleId);
      return clientReference.getModuleId();
    }
    function resolveClientReferenceMetadata(config, clientReference) {
      return {
        moduleId: clientReference.getModuleId(),
        exportName: "default"
      };
    }
    function registerServerReference(serverReference, id, exportName) {
      throw new Error("registerServerReference: Not Implemented.");
    }
    function isServerReference(reference) {
      throw new Error("isServerReference: Not Implemented.");
    }
    function getServerReferenceId(config, serverReference) {
      throw new Error("getServerReferenceId: Not Implemented.");
    }
    function getRequestedClientReferencesKeys() {
      return Array.from(requestedClientReferencesKeys);
    }
    function clearRequestedClientReferencesKeysSet() {
      requestedClientReferencesKeys.clear();
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

    // Re-export dynamic flags from the www version.
    require("ReactFeatureFlags");

    function stringToChunk(content) {
      return content;
    }

    var byteLengthImpl = null;
    function setByteLengthOfChunkImplementation(impl) {
      byteLengthImpl = impl;
    }
    function byteLengthOfChunk(chunk) {
      if (byteLengthImpl == null) {
        // eslint-disable-next-line react-internal/prod-error-codes
        throw new Error(
          "byteLengthOfChunk implementation is not configured. Please, provide the implementation via ReactFlightDOMServer.setConfig(...);"
        );
      }

      return byteLengthImpl(chunk);
    }
    function scheduleWork(callback) {
      callback();
    }
    function beginWriting(destination) {
      destination.beginWriting();
    }
    function writeChunkAndReturn(destination, chunk) {
      destination.write(chunk);
      return true;
    }
    function completeWriting(destination) {
      destination.completeWriting();
    }
    function flushBuffered(destination) {
      destination.flushBuffered();
    }
    function close(destination) {
      destination.close();
    }
    function closeWithError(destination, error) {
      destination.onError(error);
      destination.close();
    }

    function getServerReferenceBoundArguments(config, serverReference) {
      throw new Error("getServerReferenceBoundArguments: Not Implemented.");
    }

    var ReactDOMSharedInternals =
      ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

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
      {
        if (typeof href === "string" && href) {
          var request = resolveRequest();

          if (request) {
            var hints = getHints(request);
            var key = "D|" + href;

            if (hints.has(key)) {
              // duplicate hint
              return;
            }

            hints.add(key);
            emitHint(request, "D", href);
          }
        }
      }
    }

    function preconnect(href, crossOrigin) {
      {
        if (typeof href === "string") {
          var request = resolveRequest();

          if (request) {
            var hints = getHints(request);
            var key =
              "C|" + (crossOrigin == null ? "null" : crossOrigin) + "|" + href;

            if (hints.has(key)) {
              // duplicate hint
              return;
            }

            hints.add(key);

            if (typeof crossOrigin === "string") {
              emitHint(request, "C", [href, crossOrigin]);
            } else {
              emitHint(request, "C", href);
            }
          }
        }
      }
    }

    function preload(href, as, options) {
      {
        if (typeof href === "string") {
          var request = resolveRequest();

          if (request) {
            var hints = getHints(request);
            var key = "L";

            if (as === "image" && options) {
              key += getImagePreloadKey(
                href,
                options.imageSrcSet,
                options.imageSizes
              );
            } else {
              key += "[" + as + "]" + href;
            }

            if (hints.has(key)) {
              // duplicate hint
              return;
            }

            hints.add(key);
            var trimmed = trimOptions(options);

            if (trimmed) {
              emitHint(request, "L", [href, as, trimmed]);
            } else {
              emitHint(request, "L", [href, as]);
            }
          }
        }
      }
    }

    function preloadModule(href, options) {
      {
        if (typeof href === "string") {
          var request = resolveRequest();

          if (request) {
            var hints = getHints(request);
            var key = "m|" + href;

            if (hints.has(key)) {
              // duplicate hint
              return;
            }

            hints.add(key);
            var trimmed = trimOptions(options);

            if (trimmed) {
              return emitHint(request, "m", [href, trimmed]);
            } else {
              return emitHint(request, "m", href);
            }
          }
        }
      }
    }

    function preinitStyle(href, precedence, options) {
      {
        if (typeof href === "string") {
          var request = resolveRequest();

          if (request) {
            var hints = getHints(request);
            var key = "S|" + href;

            if (hints.has(key)) {
              // duplicate hint
              return;
            }

            hints.add(key);
            var trimmed = trimOptions(options);

            if (trimmed) {
              return emitHint(request, "S", [
                href,
                typeof precedence === "string" ? precedence : 0,
                trimmed
              ]);
            } else if (typeof precedence === "string") {
              return emitHint(request, "S", [href, precedence]);
            } else {
              return emitHint(request, "S", href);
            }
          }
        }
      }
    }

    function preinitScript(href, options) {
      {
        if (typeof href === "string") {
          var request = resolveRequest();

          if (request) {
            var hints = getHints(request);
            var key = "X|" + href;

            if (hints.has(key)) {
              // duplicate hint
              return;
            }

            hints.add(key);
            var trimmed = trimOptions(options);

            if (trimmed) {
              return emitHint(request, "X", [href, trimmed]);
            } else {
              return emitHint(request, "X", href);
            }
          }
        }
      }
    }

    function preinitModuleScript(href, options) {
      {
        if (typeof href === "string") {
          var request = resolveRequest();

          if (request) {
            var hints = getHints(request);
            var key = "M|" + href;

            if (hints.has(key)) {
              // duplicate hint
              return;
            }

            hints.add(key);
            var trimmed = trimOptions(options);

            if (trimmed) {
              return emitHint(request, "M", [href, trimmed]);
            } else {
              return emitHint(request, "M", href);
            }
          }
        }
      }
    } // Flight normally encodes undefined as a special character however for directive option
    // arguments we don't want to send unnecessary keys and bloat the payload so we create a
    // trimmed object which omits any keys with null or undefined values.
    // This is only typesafe because these option objects have entirely optional fields where
    // null and undefined represent the same thing as no property.

    function trimOptions(options) {
      if (options == null) return null;
      var hasProperties = false;
      var trimmed = {};

      for (var key in options) {
        if (options[key] != null) {
          hasProperties = true;
          trimmed[key] = options[key];
        }
      }

      return hasProperties ? trimmed : null;
    }

    function getImagePreloadKey(href, imageSrcSet, imageSizes) {
      var uniquePart = "";

      if (typeof imageSrcSet === "string" && imageSrcSet !== "") {
        uniquePart += "[" + imageSrcSet + "]";

        if (typeof imageSizes === "string") {
          uniquePart += "[" + imageSizes + "]";
        }
      } else {
        uniquePart += "[][]" + href;
      }

      return "[image]" + uniquePart;
    }

    var ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;
    function prepareHostDispatcher() {
      ReactDOMCurrentDispatcher.current = ReactDOMFlightServerDispatcher;
    } // Used to distinguish these contexts from ones used in other renderers.
    // small, smaller than how we encode undefined, and is unambiguous. We could use
    // a different tuple structure to encode this instead but this makes the runtime
    // cost cheaper by eliminating a type checks in more positions.
    // prettier-ignore

    function createHints() {
  return new Set();
}

    // ATTENTION
    // When adding new symbols to this file,
    // Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
    // The Symbol used to tag the ReactElement-like types.
    var REACT_ELEMENT_TYPE = Symbol.for("react.element");
    var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
    var REACT_SERVER_CONTEXT_TYPE = Symbol.for("react.server_context");
    var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
    var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
    var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
    var REACT_MEMO_TYPE = Symbol.for("react.memo");
    var REACT_LAZY_TYPE = Symbol.for("react.lazy");
    var REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel");
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

    // Forming a reverse tree.
    // The structure of a context snapshot is an implementation of this file.
    // Currently, it's implemented as tracking the current active node.

    var rootContextSnapshot = null; // We assume that this runtime owns the "current" field on all ReactContext instances.
    // This global (actually thread local) state represents what state all those "current",
    // fields are currently in.

    var currentActiveSnapshot = null;

    function popNode(prev) {
      {
        prev.context._currentValue = prev.parentValue;
      }
    }

    function pushNode(next) {
      {
        next.context._currentValue = next.value;
      }
    }

    function popToNearestCommonAncestor(prev, next) {
      if (prev === next);
      else {
        popNode(prev);
        var parentPrev = prev.parent;
        var parentNext = next.parent;

        if (parentPrev === null) {
          if (parentNext !== null) {
            throw new Error(
              "The stacks must reach the root at the same time. This is a bug in React."
            );
          }
        } else {
          if (parentNext === null) {
            throw new Error(
              "The stacks must reach the root at the same time. This is a bug in React."
            );
          }

          popToNearestCommonAncestor(parentPrev, parentNext); // On the way back, we push the new ones that weren't common.

          pushNode(next);
        }
      }
    }

    function popAllPrevious(prev) {
      popNode(prev);
      var parentPrev = prev.parent;

      if (parentPrev !== null) {
        popAllPrevious(parentPrev);
      }
    }

    function pushAllNext(next) {
      var parentNext = next.parent;

      if (parentNext !== null) {
        pushAllNext(parentNext);
      }

      pushNode(next);
    }

    function popPreviousToCommonLevel(prev, next) {
      popNode(prev);
      var parentPrev = prev.parent;

      if (parentPrev === null) {
        throw new Error(
          "The depth must equal at least at zero before reaching the root. This is a bug in React."
        );
      }

      if (parentPrev.depth === next.depth) {
        // We found the same level. Now we just need to find a shared ancestor.
        popToNearestCommonAncestor(parentPrev, next);
      } else {
        // We must still be deeper.
        popPreviousToCommonLevel(parentPrev, next);
      }
    }

    function popNextToCommonLevel(prev, next) {
      var parentNext = next.parent;

      if (parentNext === null) {
        throw new Error(
          "The depth must equal at least at zero before reaching the root. This is a bug in React."
        );
      }

      if (prev.depth === parentNext.depth) {
        // We found the same level. Now we just need to find a shared ancestor.
        popToNearestCommonAncestor(prev, parentNext);
      } else {
        // We must still be deeper.
        popNextToCommonLevel(prev, parentNext);
      }

      pushNode(next);
    } // Perform context switching to the new snapshot.
    // To make it cheap to read many contexts, while not suspending, we make the switch eagerly by
    // updating all the context's current values. That way reads, always just read the current value.
    // At the cost of updating contexts even if they're never read by this subtree.

    function switchContext(newSnapshot) {
      // The basic algorithm we need to do is to pop back any contexts that are no longer on the stack.
      // We also need to update any new contexts that are now on the stack with the deepest value.
      // The easiest way to update new contexts is to just reapply them in reverse order from the
      // perspective of the backpointers. To avoid allocating a lot when switching, we use the stack
      // for that. Therefore this algorithm is recursive.
      // 1) First we pop which ever snapshot tree was deepest. Popping old contexts as we go.
      // 2) Then we find the nearest common ancestor from there. Popping old contexts as we go.
      // 3) Then we reapply new contexts on the way back up the stack.
      var prev = currentActiveSnapshot;
      var next = newSnapshot;

      if (prev !== next) {
        if (prev === null) {
          // $FlowFixMe[incompatible-call]: This has to be non-null since it's not equal to prev.
          pushAllNext(next);
        } else if (next === null) {
          popAllPrevious(prev);
        } else if (prev.depth === next.depth) {
          popToNearestCommonAncestor(prev, next);
        } else if (prev.depth > next.depth) {
          popPreviousToCommonLevel(prev, next);
        } else {
          popNextToCommonLevel(prev, next);
        }

        currentActiveSnapshot = next;
      }
    }
    function getActiveContext() {
      return currentActiveSnapshot;
    }
    function readContext$1(context) {
      var value = context._currentValue;
      return value;
    }

    // Corresponds to ReactFiberWakeable and ReactFizzWakeable modules. Generally,
    // changes to one module should be reflected in the others.
    // TODO: Rename this module and the corresponding Fiber one to "Thenable"
    // instead of "Wakeable". Or some other more appropriate name.
    // An error that is thrown (e.g. by `use`) to trigger Suspense. If we
    // detect this is caught by userspace, we'll log a warning in development.
    var SuspenseException = new Error(
      "Suspense Exception: This is not a real error! It's an implementation " +
        "detail of `use` to interrupt the current render. You must either " +
        "rethrow it immediately, or move the `use` call outside of the " +
        "`try/catch` block. Capturing without rethrowing will lead to " +
        "unexpected behavior.\n\n" +
        "To handle async errors, wrap your component in an error boundary, or " +
        "call the promise's `.catch` method and pass the result to `use`"
    );
    function createThenableState() {
      // The ThenableState is created the first time a component suspends. If it
      // suspends again, we'll reuse the same state.
      return [];
    }

    function noop() {}

    function trackUsedThenable(thenableState, thenable, index) {
      var previous = thenableState[index];

      if (previous === undefined) {
        thenableState.push(thenable);
      } else {
        if (previous !== thenable) {
          // Reuse the previous thenable, and drop the new one. We can assume
          // they represent the same value, because components are idempotent.
          // Avoid an unhandled rejection errors for the Promises that we'll
          // intentionally ignore.
          thenable.then(noop, noop);
          thenable = previous;
        }
      } // We use an expando to track the status and result of a thenable so that we
      // can synchronously unwrap the value. Think of this as an extension of the
      // Promise API, or a custom interface that is a superset of Thenable.
      //
      // If the thenable doesn't have a status, set it to "pending" and attach
      // a listener that will update its status and result when it resolves.

      switch (thenable.status) {
        case "fulfilled": {
          var fulfilledValue = thenable.value;
          return fulfilledValue;
        }

        case "rejected": {
          var rejectedError = thenable.reason;
          throw rejectedError;
        }

        default: {
          if (typeof thenable.status === "string");
          else {
            var pendingThenable = thenable;
            pendingThenable.status = "pending";
            pendingThenable.then(
              function (fulfilledValue) {
                if (thenable.status === "pending") {
                  var fulfilledThenable = thenable;
                  fulfilledThenable.status = "fulfilled";
                  fulfilledThenable.value = fulfilledValue;
                }
              },
              function (error) {
                if (thenable.status === "pending") {
                  var rejectedThenable = thenable;
                  rejectedThenable.status = "rejected";
                  rejectedThenable.reason = error;
                }
              }
            ); // Check one more time in case the thenable resolved synchronously

            switch (thenable.status) {
              case "fulfilled": {
                var fulfilledThenable = thenable;
                return fulfilledThenable.value;
              }

              case "rejected": {
                var rejectedThenable = thenable;
                throw rejectedThenable.reason;
              }
            }
          } // Suspend.
          //
          // Throwing here is an implementation detail that allows us to unwind the
          // call stack. But we shouldn't allow it to leak into userspace. Throw an
          // opaque placeholder value instead of the actual thenable. If it doesn't
          // get captured by the work loop, log a warning, because that means
          // something in userspace must have caught it.

          suspendedThenable = thenable;
          throw SuspenseException;
        }
      }
    } // This is used to track the actual thenable that suspended so it can be
    // passed to the rest of the Suspense implementation — which, for historical
    // reasons, expects to receive a thenable.

    var suspendedThenable = null;
    function getSuspendedThenable() {
      // This is called right after `use` suspends by throwing an exception. `use`
      // throws an opaque value instead of the thenable itself so that it can't be
      // caught in userspace. Then the work loop accesses the actual thenable using
      // this function.
      if (suspendedThenable === null) {
        throw new Error(
          "Expected a suspended thenable. This is a bug in React. Please file " +
            "an issue."
        );
      }

      var thenable = suspendedThenable;
      suspendedThenable = null;
      return thenable;
    }

    var currentRequest$1 = null;
    var thenableIndexCounter = 0;
    var thenableState = null;
    function prepareToUseHooksForRequest(request) {
      currentRequest$1 = request;
    }
    function resetHooksForRequest() {
      currentRequest$1 = null;
    }
    function prepareToUseHooksForComponent(prevThenableState) {
      thenableIndexCounter = 0;
      thenableState = prevThenableState;
    }
    function getThenableStateAfterSuspending() {
      var state = thenableState;
      thenableState = null;
      return state;
    }

    function readContext(context) {
      {
        if (context.$$typeof !== REACT_SERVER_CONTEXT_TYPE) {
          if (isClientReference(context)) {
            error("Cannot read a Client Context from a Server Component.");
          } else {
            error(
              "Only createServerContext is supported in Server Components."
            );
          }
        }

        if (currentRequest$1 === null) {
          error(
            "Context can only be read while React is rendering. " +
              "In classes, you can read it in the render method or getDerivedStateFromProps. " +
              "In function components, you can read it directly in the function body, but not " +
              "inside Hooks like useReducer() or useMemo()."
          );
        }
      }

      return readContext$1(context);
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
      readContext: readContext,
      useContext: readContext,
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
        var data = new Array(size);

        for (var i = 0; i < size; i++) {
          data[i] = REACT_MEMO_CACHE_SENTINEL;
        }

        return data;
      },
      use: use
    };

    function unsupportedHook() {
      throw new Error("This Hook is not supported in Server Components.");
    }

    function unsupportedRefresh() {
      throw new Error(
        "Refreshing the cache is not supported in Server Components."
      );
    }

    function useId() {
      if (currentRequest$1 === null) {
        throw new Error("useId can only be used while React is rendering");
      }

      var id = currentRequest$1.identifierCount++; // use 'S' for Flight components to distinguish from 'R' and 'r' in Fizz/Client

      return (
        ":" + currentRequest$1.identifierPrefix + "S" + id.toString(32) + ":"
      );
    }

    function use(usable) {
      if (
        (usable !== null && typeof usable === "object") ||
        typeof usable === "function"
      ) {
        // $FlowFixMe[method-unbinding]
        if (typeof usable.then === "function") {
          // This is a thenable.
          var thenable = usable; // Track the position of the thenable within this fiber.

          var index = thenableIndexCounter;
          thenableIndexCounter += 1;

          if (thenableState === null) {
            thenableState = createThenableState();
          }

          return trackUsedThenable(thenableState, thenable, index);
        } else if (usable.$$typeof === REACT_SERVER_CONTEXT_TYPE) {
          var context = usable;
          return readContext(context);
        }
      }

      {
        if (isClientReference(usable)) {
          error("Cannot use() an already resolved Client Reference.");
        }
      } // eslint-disable-next-line react-internal/safe-string-coercion

      throw new Error(
        "An unsupported type was passed to use(): " + String(usable)
      );
    }

    function createSignal() {
      return new AbortController().signal;
    }

    function resolveCache() {
      var request = resolveRequest();

      if (request) {
        return getCache(request);
      }

      return new Map();
    }

    var DefaultCacheDispatcher = {
      getCacheSignal: function () {
        var cache = resolveCache();
        var entry = cache.get(createSignal);

        if (entry === undefined) {
          entry = createSignal();
          cache.set(createSignal, entry);
        }

        return entry;
      },
      getCacheForType: function (resourceType) {
        var cache = resolveCache();
        var entry = cache.get(resourceType);

        if (entry === undefined) {
          entry = resourceType(); // TODO: Warn if undefined?

          cache.set(resourceType, entry);
        }

        return entry;
      }
    };

    var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

    function isArray(a) {
      return isArrayImpl(a);
    }

    var getPrototypeOf = Object.getPrototypeOf;

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

      if (getPrototypeOf(object)) {
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
      if (!isObjectPrototype(getPrototypeOf(object))) {
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
            } else if (
              _substr.length < 10 &&
              str.length + _substr.length < 40
            ) {
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
            } else if (
              _substr2.length < 10 &&
              str.length + _substr2.length < 40
            ) {
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
            } else if (
              _substr3.length < 10 &&
              str.length + _substr3.length < 40
            ) {
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

    var ReactSharedInternals =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    var ReactSharedServerInternals = // $FlowFixMe: It's defined in the one we resolve to.
      React.__SECRET_SERVER_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    if (!ReactSharedServerInternals) {
      throw new Error(
        'The "react" package in this environment is not configured correctly. ' +
          'The "react-server" condition must be enabled in any environment that ' +
          "runs React Server Components."
      );
    }

    var ObjectPrototype = Object.prototype;
    var stringify = JSON.stringify; // Serializable values
    // Thenable<ReactClientValue>

    var PENDING = 0;
    var COMPLETED = 1;
    var ERRORED = 4;
    var ReactCurrentCache = ReactSharedServerInternals.ReactCurrentCache;
    var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;

    function defaultErrorHandler(error) {
      console["error"](error); // Don't transform to our wrapper
    }

    function defaultPostponeHandler(reason) {
      // Noop
    }

    var OPEN = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    function createRequest(
      model,
      bundlerConfig,
      onError,
      context,
      identifierPrefix,
      onPostpone
    ) {
      if (
        ReactCurrentCache.current !== null &&
        ReactCurrentCache.current !== DefaultCacheDispatcher
      ) {
        throw new Error(
          "Currently React only supports one RSC renderer at a time."
        );
      }

      prepareHostDispatcher();
      ReactCurrentCache.current = DefaultCacheDispatcher;
      var abortSet = new Set();
      var pingedTasks = [];
      var cleanupQueue = [];

      var hints = createHints();
      var request = {
        status: OPEN,
        flushScheduled: false,
        fatalError: null,
        destination: null,
        bundlerConfig: bundlerConfig,
        cache: new Map(),
        nextChunkId: 0,
        pendingChunks: 0,
        hints: hints,
        abortableTasks: abortSet,
        pingedTasks: pingedTasks,
        completedImportChunks: [],
        completedHintChunks: [],
        completedRegularChunks: [],
        completedErrorChunks: [],
        writtenSymbols: new Map(),
        writtenClientReferences: new Map(),
        writtenServerReferences: new Map(),
        writtenProviders: new Map(),
        writtenObjects: new WeakMap(),
        identifierPrefix: identifierPrefix || "",
        identifierCount: 1,
        taintCleanupQueue: cleanupQueue,
        onError: onError === undefined ? defaultErrorHandler : onError,
        onPostpone:
          onPostpone === undefined ? defaultPostponeHandler : onPostpone,
        // $FlowFixMe[missing-this-annot]
        toJSON: function (key, value) {
          return resolveModelToJSON(request, this, key, value);
        }
      };
      request.pendingChunks++;
      var rootContext = createRootContext();
      var rootTask = createTask(request, model, rootContext, abortSet);
      pingedTasks.push(rootTask);
      return request;
    }
    var currentRequest = null;
    function resolveRequest() {
      if (currentRequest) return currentRequest;

      return null;
    }

    function createRootContext(reqContext) {
      return importServerContexts();
    }

    function serializeThenable(request, thenable) {
      request.pendingChunks++;
      var newTask = createTask(
        request,
        null,
        getActiveContext(),
        request.abortableTasks
      );

      switch (thenable.status) {
        case "fulfilled": {
          // We have the resolved value, we can go ahead and schedule it for serialization.
          newTask.model = thenable.value;
          pingTask(request, newTask);
          return newTask.id;
        }

        case "rejected": {
          var x = thenable.reason;

          {
            var digest = logRecoverableError(request, x);
            emitErrorChunk(request, newTask.id, digest, x);
          }

          return newTask.id;
        }

        default: {
          if (typeof thenable.status === "string") {
            // Only instrument the thenable if the status if not defined. If
            // it's defined, but an unknown value, assume it's been instrumented by
            // some custom userspace implementation. We treat it as "pending".
            break;
          }

          var pendingThenable = thenable;
          pendingThenable.status = "pending";
          pendingThenable.then(
            function (fulfilledValue) {
              if (thenable.status === "pending") {
                var fulfilledThenable = thenable;
                fulfilledThenable.status = "fulfilled";
                fulfilledThenable.value = fulfilledValue;
              }
            },
            function (error) {
              if (thenable.status === "pending") {
                var rejectedThenable = thenable;
                rejectedThenable.status = "rejected";
                rejectedThenable.reason = error;
              }
            }
          );
          break;
        }
      }

      thenable.then(
        function (value) {
          newTask.model = value;
          pingTask(request, newTask);
        },
        function (reason) {
          {
            newTask.status = ERRORED;

            var _digest = logRecoverableError(request, reason);

            emitErrorChunk(request, newTask.id, _digest, reason);
          }

          request.abortableTasks.delete(newTask);

          if (request.destination !== null) {
            flushCompletedChunks(request, request.destination);
          }
        }
      );
      return newTask.id;
    }

    function emitHint(request, code, model) {
      emitHintChunk(request, code, model);
      enqueueFlush(request);
    }
    function getHints(request) {
      return request.hints;
    }
    function getCache(request) {
      return request.cache;
    }

    function readThenable(thenable) {
      if (thenable.status === "fulfilled") {
        return thenable.value;
      } else if (thenable.status === "rejected") {
        throw thenable.reason;
      }

      throw thenable;
    }

    function createLazyWrapperAroundWakeable(wakeable) {
      // This is a temporary fork of the `use` implementation until we accept
      // promises everywhere.
      var thenable = wakeable;

      switch (thenable.status) {
        case "fulfilled":
        case "rejected":
          break;

        default: {
          if (typeof thenable.status === "string") {
            // Only instrument the thenable if the status if not defined. If
            // it's defined, but an unknown value, assume it's been instrumented by
            // some custom userspace implementation. We treat it as "pending".
            break;
          }

          var pendingThenable = thenable;
          pendingThenable.status = "pending";
          pendingThenable.then(
            function (fulfilledValue) {
              if (thenable.status === "pending") {
                var fulfilledThenable = thenable;
                fulfilledThenable.status = "fulfilled";
                fulfilledThenable.value = fulfilledValue;
              }
            },
            function (error) {
              if (thenable.status === "pending") {
                var rejectedThenable = thenable;
                rejectedThenable.status = "rejected";
                rejectedThenable.reason = error;
              }
            }
          );
          break;
        }
      }

      var lazyType = {
        $$typeof: REACT_LAZY_TYPE,
        _payload: thenable,
        _init: readThenable
      };
      return lazyType;
    }

    function attemptResolveElement(
      request,
      type,
      key,
      ref,
      props,
      prevThenableState
    ) {
      if (ref !== null && ref !== undefined) {
        // When the ref moves to the regular props object this will implicitly
        // throw for functions. We could probably relax it to a DEV warning for other
        // cases.
        throw new Error(
          "Refs cannot be used in Server Components, nor passed to Client Components."
        );
      }

      {
        jsxPropsParents.set(props, type);

        if (typeof props.children === "object" && props.children !== null) {
          jsxChildrenParents.set(props.children, type);
        }
      }

      if (typeof type === "function") {
        if (isClientReference(type)) {
          // This is a reference to a Client Component.
          return [REACT_ELEMENT_TYPE, type, key, props];
        } // This is a server-side component.

        prepareToUseHooksForComponent(prevThenableState);
        var result = type(props);

        if (
          typeof result === "object" &&
          result !== null &&
          typeof result.then === "function"
        ) {
          // When the return value is in children position we can resolve it immediately,
          // to its value without a wrapper if it's synchronously available.
          var thenable = result;

          if (thenable.status === "fulfilled") {
            return thenable.value;
          } // TODO: Once we accept Promises as children on the client, we can just return
          // the thenable here.

          return createLazyWrapperAroundWakeable(result);
        }

        return result;
      } else if (typeof type === "string") {
        // This is a host element. E.g. HTML.
        return [REACT_ELEMENT_TYPE, type, key, props];
      } else if (typeof type === "symbol") {
        if (type === REACT_FRAGMENT_TYPE) {
          // For key-less fragments, we add a small optimization to avoid serializing
          // it as a wrapper.
          // TODO: If a key is specified, we should propagate its key to any children.
          // Same as if a Server Component has a key.
          return props.children;
        } // This might be a built-in React component. We'll let the client decide.
        // Any built-in works as long as its props are serializable.

        return [REACT_ELEMENT_TYPE, type, key, props];
      } else if (type != null && typeof type === "object") {
        if (isClientReference(type)) {
          // This is a reference to a Client Component.
          return [REACT_ELEMENT_TYPE, type, key, props];
        }

        switch (type.$$typeof) {
          case REACT_LAZY_TYPE: {
            var payload = type._payload;
            var init = type._init;
            var wrappedType = init(payload);
            return attemptResolveElement(
              request,
              wrappedType,
              key,
              ref,
              props,
              prevThenableState
            );
          }

          case REACT_FORWARD_REF_TYPE: {
            var render = type.render;
            prepareToUseHooksForComponent(prevThenableState);
            return render(props, undefined);
          }

          case REACT_MEMO_TYPE: {
            return attemptResolveElement(
              request,
              type.type,
              key,
              ref,
              props,
              prevThenableState
            );
          }
        }
      }

      throw new Error(
        "Unsupported Server Component type: " +
          describeValueForErrorMessage(type)
      );
    }

    function pingTask(request, task) {
      var pingedTasks = request.pingedTasks;
      pingedTasks.push(task);

      if (pingedTasks.length === 1) {
        request.flushScheduled = request.destination !== null;
        scheduleWork(function () {
          return performWork(request);
        });
      }
    }

    function createTask(request, model, context, abortSet) {
      var id = request.nextChunkId++;
      var task = {
        id: id,
        status: PENDING,
        model: model,
        context: context,
        ping: function () {
          return pingTask(request, task);
        },
        thenableState: null
      };
      abortSet.add(task);
      return task;
    }

    function serializeByValueID(id) {
      return "$" + id.toString(16);
    }

    function serializeLazyID(id) {
      return "$L" + id.toString(16);
    }

    function serializePromiseID(id) {
      return "$@" + id.toString(16);
    }

    function serializeServerReferenceID(id) {
      return "$F" + id.toString(16);
    }

    function serializeSymbolReference(name) {
      return "$S" + name;
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

    function serializeRowHeader(tag, id) {
      return id.toString(16) + ":" + tag;
    }

    function encodeReferenceChunk(request, id, reference) {
      var json = stringify(reference);
      var row = id.toString(16) + ":" + json + "\n";
      return stringToChunk(row);
    }

    function serializeClientReference(request, parent, key, clientReference) {
      var clientReferenceKey = getClientReferenceKey(clientReference);
      var writtenClientReferences = request.writtenClientReferences;
      var existingId = writtenClientReferences.get(clientReferenceKey);

      if (existingId !== undefined) {
        if (parent[0] === REACT_ELEMENT_TYPE && key === "1") {
          // If we're encoding the "type" of an element, we can refer
          // to that by a lazy reference instead of directly since React
          // knows how to deal with lazy values. This lets us suspend
          // on this component rather than its parent until the code has
          // loaded.
          return serializeLazyID(existingId);
        }

        return serializeByValueID(existingId);
      }

      try {
        var clientReferenceMetadata = resolveClientReferenceMetadata(
          request.bundlerConfig,
          clientReference
        );
        request.pendingChunks++;
        var importId = request.nextChunkId++;
        emitImportChunk(request, importId, clientReferenceMetadata);
        writtenClientReferences.set(clientReferenceKey, importId);

        if (parent[0] === REACT_ELEMENT_TYPE && key === "1") {
          // If we're encoding the "type" of an element, we can refer
          // to that by a lazy reference instead of directly since React
          // knows how to deal with lazy values. This lets us suspend
          // on this component rather than its parent until the code has
          // loaded.
          return serializeLazyID(importId);
        }

        return serializeByValueID(importId);
      } catch (x) {
        request.pendingChunks++;
        var errorId = request.nextChunkId++;
        var digest = logRecoverableError(request, x);
        emitErrorChunk(request, errorId, digest, x);
        return serializeByValueID(errorId);
      }
    }

    function outlineModel(request, value) {
      request.pendingChunks++;
      var newTask = createTask(
        request,
        value,
        getActiveContext(),
        request.abortableTasks
      );
      retryTask(request, newTask);
      return newTask.id;
    }

    function serializeServerReference(request, parent, key, serverReference) {
      var writtenServerReferences = request.writtenServerReferences;
      var existingId = writtenServerReferences.get(serverReference);

      if (existingId !== undefined) {
        return serializeServerReferenceID(existingId);
      }

      var bound = getServerReferenceBoundArguments();
      var serverReferenceMetadata = {
        id: getServerReferenceId(),
        bound: bound ? Promise.resolve(bound) : null
      };
      var metadataId = outlineModel(request, serverReferenceMetadata);
      writtenServerReferences.set(serverReference, metadataId);
      return serializeServerReferenceID(metadataId);
    }

    function serializeLargeTextString(request, text) {
      request.pendingChunks += 2;
      var textId = request.nextChunkId++;
      var textChunk = stringToChunk(text);
      var binaryLength = byteLengthOfChunk(textChunk);
      var row = textId.toString(16) + ":T" + binaryLength.toString(16) + ",";
      var headerChunk = stringToChunk(row);
      request.completedRegularChunks.push(headerChunk, textChunk);
      return serializeByValueID(textId);
    }

    function serializeMap(request, map) {
      var entries = Array.from(map);

      for (var i = 0; i < entries.length; i++) {
        var key = entries[i][0];

        if (typeof key === "object" && key !== null) {
          var writtenObjects = request.writtenObjects;
          var existingId = writtenObjects.get(key);

          if (existingId === undefined) {
            // Mark all object keys as seen so that they're always outlined.
            writtenObjects.set(key, -1);
          }
        }
      }

      var id = outlineModel(request, entries);
      return "$Q" + id.toString(16);
    }

    function serializeSet(request, set) {
      var entries = Array.from(set);

      for (var i = 0; i < entries.length; i++) {
        var key = entries[i];

        if (typeof key === "object" && key !== null) {
          var writtenObjects = request.writtenObjects;
          var existingId = writtenObjects.get(key);

          if (existingId === undefined) {
            // Mark all object keys as seen so that they're always outlined.
            writtenObjects.set(key, -1);
          }
        }
      }

      var id = outlineModel(request, entries);
      return "$W" + id.toString(16);
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
    var modelRoot = false;

    function resolveModelToJSON(request, parent, key, value) {
      // Make sure that `parent[key]` wasn't JSONified before `value` was passed to us
      {
        // $FlowFixMe[incompatible-use]
        var originalValue = parent[key];

        if (
          typeof originalValue === "object" &&
          originalValue !== value &&
          !(originalValue instanceof Date)
        ) {
          if (objectName(originalValue) !== "Object") {
            var jsxParentType = jsxChildrenParents.get(parent);

            if (typeof jsxParentType === "string") {
              error(
                "%s objects cannot be rendered as text children. Try formatting it using toString().%s",
                objectName(originalValue),
                describeObjectForErrorMessage(parent, key)
              );
            } else {
              error(
                "Only plain objects can be passed to Client Components from Server Components. " +
                  "%s objects are not supported.%s",
                objectName(originalValue),
                describeObjectForErrorMessage(parent, key)
              );
            }
          } else {
            error(
              "Only plain objects can be passed to Client Components from Server Components. " +
                "Objects with toJSON methods are not supported. Convert it manually " +
                "to a simple value before passing it to props.%s",
              describeObjectForErrorMessage(parent, key)
            );
          }
        }
      } // Special Symbols

      switch (value) {
        case REACT_ELEMENT_TYPE:
          return "$";
      }

      while (
        typeof value === "object" &&
        value !== null &&
        (value.$$typeof === REACT_ELEMENT_TYPE ||
          value.$$typeof === REACT_LAZY_TYPE)
      ) {
        try {
          switch (value.$$typeof) {
            case REACT_ELEMENT_TYPE: {
              var writtenObjects = request.writtenObjects;
              var existingId = writtenObjects.get(value);

              if (existingId !== undefined) {
                if (existingId === -1) {
                  // Seen but not yet outlined.
                  var newId = outlineModel(request, value);
                  return serializeByValueID(newId);
                } else if (modelRoot === value) {
                  // This is the ID we're currently emitting so we need to write it
                  // once but if we discover it again, we refer to it by id.
                  modelRoot = null;
                } else {
                  // We've already emitted this as an outlined object, so we can
                  // just refer to that by its existing ID.
                  return serializeByValueID(existingId);
                }
              } else {
                // This is the first time we've seen this object. We may never see it again
                // so we'll inline it. Mark it as seen. If we see it again, we'll outline.
                writtenObjects.set(value, -1);
              } // TODO: Concatenate keys of parents onto children.

              var element = value; // Attempt to render the Server Component.

              value = attemptResolveElement(
                request,
                element.type,
                element.key,
                element.ref,
                element.props,
                null
              );
              break;
            }

            case REACT_LAZY_TYPE: {
              var payload = value._payload;
              var init = value._init;
              value = init(payload);
              break;
            }
          }
        } catch (thrownValue) {
          var x =
            thrownValue === SuspenseException // This is a special type of exception used for Suspense. For historical
              ? // reasons, the rest of the Suspense implementation expects the thrown
                // value to be a thenable, because before `use` existed that was the
                // (unstable) API for suspending. This implementation detail can change
                // later, once we deprecate the old API in favor of `use`.
                getSuspendedThenable()
              : thrownValue;

          if (typeof x === "object" && x !== null) {
            // $FlowFixMe[method-unbinding]
            if (typeof x.then === "function") {
              // Something suspended, we'll need to create a new task and resolve it later.
              request.pendingChunks++;
              var newTask = createTask(
                request,
                value,
                getActiveContext(),
                request.abortableTasks
              );
              var ping = newTask.ping;
              x.then(ping, ping);
              newTask.thenableState = getThenableStateAfterSuspending();
              return serializeLazyID(newTask.id);
            }
          } // Something errored. We'll still send everything we have up until this point.
          // We'll replace this element with a lazy reference that throws on the client
          // once it gets rendered.

          request.pendingChunks++;
          var errorId = request.nextChunkId++;
          var digest = logRecoverableError(request, x);
          emitErrorChunk(request, errorId, digest, x);
          return serializeLazyID(errorId);
        }
      }

      if (value === null) {
        return null;
      }

      if (typeof value === "object") {
        if (isClientReference(value)) {
          return serializeClientReference(request, parent, key, value);
        }

        var _writtenObjects = request.writtenObjects;

        var _existingId = _writtenObjects.get(value); // $FlowFixMe[method-unbinding]

        if (typeof value.then === "function") {
          if (_existingId !== undefined) {
            if (modelRoot === value) {
              // This is the ID we're currently emitting so we need to write it
              // once but if we discover it again, we refer to it by id.
              modelRoot = null;
            } else {
              // We've seen this promise before, so we can just refer to the same result.
              return serializePromiseID(_existingId);
            }
          } // We assume that any object with a .then property is a "Thenable" type,
          // or a Promise type. Either of which can be represented by a Promise.

          var promiseId = serializeThenable(request, value);

          _writtenObjects.set(value, promiseId);

          return serializePromiseID(promiseId);
        }

        if (_existingId !== undefined) {
          if (_existingId === -1) {
            // Seen but not yet outlined.
            var _newId = outlineModel(request, value);

            return serializeByValueID(_newId);
          } else if (modelRoot === value) {
            // This is the ID we're currently emitting so we need to write it
            // once but if we discover it again, we refer to it by id.
            modelRoot = null;
          } else {
            // We've already emitted this as an outlined object, so we can
            // just refer to that by its existing ID.
            return serializeByValueID(_existingId);
          }
        } else {
          // This is the first time we've seen this object. We may never see it again
          // so we'll inline it. Mark it as seen. If we see it again, we'll outline.
          _writtenObjects.set(value, -1);
        }

        if (isArray(value)) {
          // $FlowFixMe[incompatible-return]
          return value;
        }

        if (value instanceof Map) {
          return serializeMap(request, value);
        }

        if (value instanceof Set) {
          return serializeSet(request, value);
        }

        var iteratorFn = getIteratorFn(value);

        if (iteratorFn) {
          return Array.from(value);
        } // Verify that this is a simple plain object.

        var proto = getPrototypeOf(value);

        if (
          proto !== ObjectPrototype &&
          (proto === null || getPrototypeOf(proto) !== null)
        ) {
          throw new Error(
            "Only plain objects, and a few built-ins, can be passed to Client Components " +
              "from Server Components. Classes or null prototypes are not supported."
          );
        }

        {
          if (objectName(value) !== "Object") {
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
        } // $FlowFixMe[incompatible-return]

        return value;
      }

      if (typeof value === "string") {
        if (value[value.length - 1] === "Z") {
          // Possibly a Date, whose toJSON automatically calls toISOString
          // $FlowFixMe[incompatible-use]
          var _originalValue = parent[key];

          if (_originalValue instanceof Date) {
            return serializeDateFromDateJSON(value);
          }
        }

        if (value.length >= 1024) {
          // For large strings, we encode them outside the JSON payload so that we
          // don't have to double encode and double parse the strings. This can also
          // be more compact in case the string has a lot of escaped characters.
          return serializeLargeTextString(request, value);
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
        if (isClientReference(value)) {
          return serializeClientReference(request, parent, key, value);
        }

        if (isServerReference()) {
          return serializeServerReference(request, parent, key, value);
        }

        if (/^on[A-Z]/.test(key)) {
          throw new Error(
            "Event handlers cannot be passed to Client Component props." +
              describeObjectForErrorMessage(parent, key) +
              "\nIf you need interactivity, consider converting part of this to a Client Component."
          );
        } else {
          throw new Error(
            "Functions cannot be passed directly to Client Components " +
              'unless you explicitly expose it by marking it with "use server".' +
              describeObjectForErrorMessage(parent, key)
          );
        }
      }

      if (typeof value === "symbol") {
        var writtenSymbols = request.writtenSymbols;

        var _existingId2 = writtenSymbols.get(value);

        if (_existingId2 !== undefined) {
          return serializeByValueID(_existingId2);
        } // $FlowFixMe[incompatible-type] `description` might be undefined

        var name = value.description;

        if (Symbol.for(name) !== value) {
          throw new Error(
            "Only global symbols received from Symbol.for(...) can be passed to Client Components. " +
              ("The symbol Symbol.for(" + // $FlowFixMe[incompatible-type] `description` might be undefined
                value.description +
                ") cannot be found among global symbols.") +
              describeObjectForErrorMessage(parent, key)
          );
        }

        request.pendingChunks++;
        var symbolId = request.nextChunkId++;
        emitSymbolChunk(request, symbolId, name);
        writtenSymbols.set(value, symbolId);
        return serializeByValueID(symbolId);
      }

      if (typeof value === "bigint") {
        return serializeBigInt(value);
      }

      throw new Error(
        "Type " +
          typeof value +
          " is not supported in Client Component props." +
          describeObjectForErrorMessage(parent, key)
      );
    }

    function logRecoverableError(request, error) {
      var onError = request.onError;
      var errorDigest = onError(error);

      if (errorDigest != null && typeof errorDigest !== "string") {
        // eslint-disable-next-line react-internal/prod-error-codes
        throw new Error(
          'onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "' +
            typeof errorDigest +
            '" instead'
        );
      }

      return errorDigest || "";
    }

    function fatalError(request, error) {
      if (request.destination !== null) {
        request.status = CLOSED;
        closeWithError(request.destination, error);
      } else {
        request.status = CLOSING;
        request.fatalError = error;
      }
    }

    function emitErrorChunk(request, id, digest, error) {
      var errorInfo;

      {
        var message;
        var stack = "";

        try {
          if (error instanceof Error) {
            // eslint-disable-next-line react-internal/safe-string-coercion
            message = String(error.message); // eslint-disable-next-line react-internal/safe-string-coercion

            stack = String(error.stack);
          } else {
            message = "Error: " + error;
          }
        } catch (x) {
          message =
            "An error occurred but serializing the error message failed.";
        }

        errorInfo = {
          digest: digest,
          message: message,
          stack: stack
        };
      }

      var row = serializeRowHeader("E", id) + stringify(errorInfo) + "\n";
      var processedChunk = stringToChunk(row);
      request.completedErrorChunks.push(processedChunk);
    }

    function emitImportChunk(request, id, clientReferenceMetadata) {
      // $FlowFixMe[incompatible-type] stringify can return null
      var json = stringify(clientReferenceMetadata);
      var row = serializeRowHeader("I", id) + json + "\n";
      var processedChunk = stringToChunk(row);
      request.completedImportChunks.push(processedChunk);
    }

    function emitHintChunk(request, code, model) {
      var json = stringify(model);
      var id = request.nextChunkId++;
      var row = serializeRowHeader("H" + code, id) + json + "\n";
      var processedChunk = stringToChunk(row);
      request.completedHintChunks.push(processedChunk);
    }

    function emitSymbolChunk(request, id, name) {
      var symbolReference = serializeSymbolReference(name);
      var processedChunk = encodeReferenceChunk(request, id, symbolReference);
      request.completedImportChunks.push(processedChunk);
    }

    function emitModelChunk(request, id, model) {
      // Track the root so we know that we have to emit this object even though it
      // already has an ID. This is needed because we might see this object twice
      // in the same toJSON if it is cyclic.
      modelRoot = model; // $FlowFixMe[incompatible-type] stringify can return null

      var json = stringify(model, request.toJSON);
      var row = id.toString(16) + ":" + json + "\n";
      var processedChunk = stringToChunk(row);
      request.completedRegularChunks.push(processedChunk);
    }

    function retryTask(request, task) {
      if (task.status !== PENDING) {
        // We completed this by other means before we had a chance to retry it.
        return;
      }

      switchContext(task.context);

      try {
        var value = task.model;

        if (
          typeof value === "object" &&
          value !== null &&
          value.$$typeof === REACT_ELEMENT_TYPE
        ) {
          request.writtenObjects.set(value, task.id); // TODO: Concatenate keys of parents onto children.

          var element = value; // When retrying a component, reuse the thenableState from the
          // previous attempt.

          var prevThenableState = task.thenableState; // Attempt to render the Server Component.
          // Doing this here lets us reuse this same task if the next component
          // also suspends.

          task.model = value;
          value = attemptResolveElement(
            request,
            element.type,
            element.key,
            element.ref,
            element.props,
            prevThenableState
          ); // Successfully finished this component. We're going to keep rendering
          // using the same task, but we reset its thenable state before continuing.

          task.thenableState = null; // Keep rendering and reuse the same task. This inner loop is separate
          // from the render above because we don't need to reset the thenable state
          // until the next time something suspends and retries.

          while (
            typeof value === "object" &&
            value !== null &&
            value.$$typeof === REACT_ELEMENT_TYPE
          ) {
            request.writtenObjects.set(value, task.id); // TODO: Concatenate keys of parents onto children.

            var nextElement = value;
            task.model = value;
            value = attemptResolveElement(
              request,
              nextElement.type,
              nextElement.key,
              nextElement.ref,
              nextElement.props,
              null
            );
          }
        } // Track that this object is outlined and has an id.

        if (typeof value === "object" && value !== null) {
          request.writtenObjects.set(value, task.id);
        }

        emitModelChunk(request, task.id, value);
        request.abortableTasks.delete(task);
        task.status = COMPLETED;
      } catch (thrownValue) {
        var x =
          thrownValue === SuspenseException // This is a special type of exception used for Suspense. For historical
            ? // reasons, the rest of the Suspense implementation expects the thrown
              // value to be a thenable, because before `use` existed that was the
              // (unstable) API for suspending. This implementation detail can change
              // later, once we deprecate the old API in favor of `use`.
              getSuspendedThenable()
            : thrownValue;

        if (typeof x === "object" && x !== null) {
          // $FlowFixMe[method-unbinding]
          if (typeof x.then === "function") {
            // Something suspended again, let's pick it back up later.
            var ping = task.ping;
            x.then(ping, ping);
            task.thenableState = getThenableStateAfterSuspending();
            return;
          }
        }

        request.abortableTasks.delete(task);
        task.status = ERRORED;
        var digest = logRecoverableError(request, x);
        emitErrorChunk(request, task.id, digest, x);
      }
    }

    function performWork(request) {
      var prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = HooksDispatcher;
      var prevRequest = currentRequest;
      currentRequest = request;
      prepareToUseHooksForRequest(request);

      try {
        var pingedTasks = request.pingedTasks;
        request.pingedTasks = [];

        for (var i = 0; i < pingedTasks.length; i++) {
          var task = pingedTasks[i];
          retryTask(request, task);
        }

        if (request.destination !== null) {
          flushCompletedChunks(request, request.destination);
        }
      } catch (error) {
        logRecoverableError(request, error);
        fatalError(request, error);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
        resetHooksForRequest();
        currentRequest = prevRequest;
      }
    }

    function flushCompletedChunks(request, destination) {
      beginWriting(destination);

      try {
        // We emit module chunks first in the stream so that
        // they can be preloaded as early as possible.
        var importsChunks = request.completedImportChunks;
        var i = 0;

        for (; i < importsChunks.length; i++) {
          request.pendingChunks--;
          var chunk = importsChunks[i];
          var keepWriting = writeChunkAndReturn(destination, chunk);

          if (!keepWriting) {
            request.destination = null;
            i++;
            break;
          }
        }

        importsChunks.splice(0, i); // Next comes hints.

        var hintChunks = request.completedHintChunks;
        i = 0;

        for (; i < hintChunks.length; i++) {
          var _chunk = hintChunks[i];

          var _keepWriting = writeChunkAndReturn(destination, _chunk);

          if (!_keepWriting) {
            request.destination = null;
            i++;
            break;
          }
        }

        hintChunks.splice(0, i); // Next comes model data.

        var regularChunks = request.completedRegularChunks;
        i = 0;

        for (; i < regularChunks.length; i++) {
          request.pendingChunks--;
          var _chunk2 = regularChunks[i];

          var _keepWriting2 = writeChunkAndReturn(destination, _chunk2);

          if (!_keepWriting2) {
            request.destination = null;
            i++;
            break;
          }
        }

        regularChunks.splice(0, i); // Finally, errors are sent. The idea is that it's ok to delay
        // any error messages and prioritize display of other parts of
        // the page.

        var errorChunks = request.completedErrorChunks;
        i = 0;

        for (; i < errorChunks.length; i++) {
          request.pendingChunks--;
          var _chunk3 = errorChunks[i];

          var _keepWriting3 = writeChunkAndReturn(destination, _chunk3);

          if (!_keepWriting3) {
            request.destination = null;
            i++;
            break;
          }
        }

        errorChunks.splice(0, i);
      } finally {
        request.flushScheduled = false;
        completeWriting(destination);
      }

      flushBuffered(destination);

      if (request.pendingChunks === 0) {
        close(destination);
      }
    }

    function startWork(request) {
      request.flushScheduled = request.destination !== null;

      {
        scheduleWork(function () {
          return performWork(request);
        });
      }
    }

    function enqueueFlush(request) {
      if (
        request.flushScheduled === false && // If there are pinged tasks we are going to flush anyway after work completes
        request.pingedTasks.length === 0 && // If there is no destination there is nothing we can flush to. A flush will
        // happen when we start flowing again
        request.destination !== null
      ) {
        var destination = request.destination;
        request.flushScheduled = true;
        scheduleWork(function () {
          return flushCompletedChunks(request, destination);
        });
      }
    }

    function startFlowing(request, destination) {
      if (request.status === CLOSING) {
        request.status = CLOSED;
        closeWithError(destination, request.fatalError);
        return;
      }

      if (request.status === CLOSED) {
        return;
      }

      if (request.destination !== null) {
        // We're already flowing.
        return;
      }

      request.destination = destination;

      try {
        flushCompletedChunks(request, destination);
      } catch (error) {
        logRecoverableError(request, error);
        fatalError(request, error);
      }
    }

    function importServerContexts(contexts) {
      return rootContextSnapshot;
    }

    function renderToDestination(destination, model, options) {
      if (!configured) {
        throw new Error(
          "Please make sure to call `setConfig(...)` before calling `renderToDestination`."
        );
      }

      var request = createRequest(
        model,
        null,
        options ? options.onError : undefined
      );
      startWork(request);
      startFlowing(request, destination);
    }

    var configured = false;

    function setConfig(config) {
      setByteLengthOfChunkImplementation(config.byteLength);
      setCheckIsClientReference(config.isClientReference);
      configured = true;
    }

    exports.clearRequestedClientReferencesKeysSet =
      clearRequestedClientReferencesKeysSet;
    exports.getRequestedClientReferencesKeys = getRequestedClientReferencesKeys;
    exports.registerClientReference = registerClientReference;
    exports.registerServerReference = registerServerReference;
    exports.renderToDestination = renderToDestination;
    exports.setCheckIsClientReference = setCheckIsClientReference;
    exports.setConfig = setConfig;
  })();
}
