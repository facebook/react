/** @license React v16.13.1
 * react-dom.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (global = global || self, factory(global.ReactDOM = {}, global.React));
}(this, (function (exports, React) { 'use strict';

  var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED; // Prevent newer renderers from RTE when used with older react package versions.
  // Current owner and dispatcher used to share the same ref,
  // but PR #14548 split them out to better support the react-debug-tools package.

  if (!ReactSharedInternals.hasOwnProperty('ReactCurrentDispatcher')) {
    ReactSharedInternals.ReactCurrentDispatcher = {
      current: null
    };
  }

  if (!ReactSharedInternals.hasOwnProperty('ReactCurrentBatchConfig')) {
    ReactSharedInternals.ReactCurrentBatchConfig = {
      suspense: null
    };
  }

  // by calls to these methods by a Babel plugin.
  //
  // In PROD (or in packages without access to React internals),
  // they are left as they are instead.

  function warn(format) {
    {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      printWarning('warn', format, args);
    }
  }
  function error(format) {
    {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      printWarning('error', format, args);
    }
  }

  function printWarning(level, format, args) {
    // When changing this logic, you might want to also
    // update consoleWithStackDev.www.js as well.
    {
      var hasExistingStack = args.length > 0 && typeof args[args.length - 1] === 'string' && args[args.length - 1].indexOf('\n    in') === 0;

      if (!hasExistingStack) {
        var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
        var stack = ReactDebugCurrentFrame.getStackAddendum();

        if (stack !== '') {
          format += '%s';
          args = args.concat([stack]);
        }
      }

      var argsWithFormat = args.map(function (item) {
        return '' + item;
      }); // Careful: RN currently depends on this prefix

      argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
      // breaks IE9: https://github.com/facebook/react/issues/13610
      // eslint-disable-next-line react-internal/no-production-logging

      Function.prototype.apply.call(console[level], console, argsWithFormat);

      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        var argIndex = 0;
        var message = 'Warning: ' + format.replace(/%s/g, function () {
          return args[argIndex++];
        });
        throw new Error(message);
      } catch (x) {}
    }
  }

  if (!React) {
    {
      throw Error( "ReactDOM was loaded before React. Make sure you load the React package before loading ReactDOM." );
    }
  }

  var invokeGuardedCallbackImpl = function (name, func, context, a, b, c, d, e, f) {
    var funcArgs = Array.prototype.slice.call(arguments, 3);

    try {
      func.apply(context, funcArgs);
    } catch (error) {
      this.onError(error);
    }
  };

  {
    // In DEV mode, we swap out invokeGuardedCallback for a special version
    // that plays more nicely with the browser's DevTools. The idea is to preserve
    // "Pause on exceptions" behavior. Because React wraps all user-provided
    // functions in invokeGuardedCallback, and the production version of
    // invokeGuardedCallback uses a try-catch, all user exceptions are treated
    // like caught exceptions, and the DevTools won't pause unless the developer
    // takes the extra step of enabling pause on caught exceptions. This is
    // unintuitive, though, because even though React has caught the error, from
    // the developer's perspective, the error is uncaught.
    //
    // To preserve the expected "Pause on exceptions" behavior, we don't use a
    // try-catch in DEV. Instead, we synchronously dispatch a fake event to a fake
    // DOM node, and call the user-provided callback from inside an event handler
    // for that fake event. If the callback throws, the error is "captured" using
    // a global event handler. But because the error happens in a different
    // event loop context, it does not interrupt the normal program flow.
    // Effectively, this gives us try-catch behavior without actually using
    // try-catch. Neat!
    // Check that the browser supports the APIs we need to implement our special
    // DEV version of invokeGuardedCallback
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof document !== 'undefined' && typeof document.createEvent === 'function') {
      var fakeNode = document.createElement('react');

      var invokeGuardedCallbackDev = function (name, func, context, a, b, c, d, e, f) {
        // If document doesn't exist we know for sure we will crash in this method
        // when we call document.createEvent(). However this can cause confusing
        // errors: https://github.com/facebookincubator/create-react-app/issues/3482
        // So we preemptively throw with a better message instead.
        if (!(typeof document !== 'undefined')) {
          {
            throw Error( "The `document` global was defined when React was initialized, but is not defined anymore. This can happen in a test environment if a component schedules an update from an asynchronous callback, but the test has already finished running. To solve this, you can either unmount the component at the end of your test (and ensure that any asynchronous operations get canceled in `componentWillUnmount`), or you can change the test itself to be asynchronous." );
          }
        }

        var evt = document.createEvent('Event'); // Keeps track of whether the user-provided callback threw an error. We
        // set this to true at the beginning, then set it to false right after
        // calling the function. If the function errors, `didError` will never be
        // set to false. This strategy works even if the browser is flaky and
        // fails to call our global error handler, because it doesn't rely on
        // the error event at all.

        var didError = true; // Keeps track of the value of window.event so that we can reset it
        // during the callback to let user code access window.event in the
        // browsers that support it.

        var windowEvent = window.event; // Keeps track of the descriptor of window.event to restore it after event
        // dispatching: https://github.com/facebook/react/issues/13688

        var windowEventDescriptor = Object.getOwnPropertyDescriptor(window, 'event'); // Create an event handler for our fake event. We will synchronously
        // dispatch our fake event using `dispatchEvent`. Inside the handler, we
        // call the user-provided callback.

        var funcArgs = Array.prototype.slice.call(arguments, 3);

        function callCallback() {
          // We immediately remove the callback from event listeners so that
          // nested `invokeGuardedCallback` calls do not clash. Otherwise, a
          // nested call would trigger the fake event handlers of any call higher
          // in the stack.
          fakeNode.removeEventListener(evtType, callCallback, false); // We check for window.hasOwnProperty('event') to prevent the
          // window.event assignment in both IE <= 10 as they throw an error
          // "Member not found" in strict mode, and in Firefox which does not
          // support window.event.

          if (typeof window.event !== 'undefined' && window.hasOwnProperty('event')) {
            window.event = windowEvent;
          }

          func.apply(context, funcArgs);
          didError = false;
        } // Create a global error event handler. We use this to capture the value
        // that was thrown. It's possible that this error handler will fire more
        // than once; for example, if non-React code also calls `dispatchEvent`
        // and a handler for that event throws. We should be resilient to most of
        // those cases. Even if our error event handler fires more than once, the
        // last error event is always used. If the callback actually does error,
        // we know that the last error event is the correct one, because it's not
        // possible for anything else to have happened in between our callback
        // erroring and the code that follows the `dispatchEvent` call below. If
        // the callback doesn't error, but the error event was fired, we know to
        // ignore it because `didError` will be false, as described above.


        var error; // Use this to track whether the error event is ever called.

        var didSetError = false;
        var isCrossOriginError = false;

        function handleWindowError(event) {
          error = event.error;
          didSetError = true;

          if (error === null && event.colno === 0 && event.lineno === 0) {
            isCrossOriginError = true;
          }

          if (event.defaultPrevented) {
            // Some other error handler has prevented default.
            // Browsers silence the error report if this happens.
            // We'll remember this to later decide whether to log it or not.
            if (error != null && typeof error === 'object') {
              try {
                error._suppressLogging = true;
              } catch (inner) {// Ignore.
              }
            }
          }
        } // Create a fake event type.


        var evtType = "react-" + (name ? name : 'invokeguardedcallback'); // Attach our event handlers

        window.addEventListener('error', handleWindowError);
        fakeNode.addEventListener(evtType, callCallback, false); // Synchronously dispatch our fake event. If the user-provided function
        // errors, it will trigger our global error handler.

        evt.initEvent(evtType, false, false);
        fakeNode.dispatchEvent(evt);

        if (windowEventDescriptor) {
          Object.defineProperty(window, 'event', windowEventDescriptor);
        }

        if (didError) {
          if (!didSetError) {
            // The callback errored, but the error event never fired.
            error = new Error('An error was thrown inside one of your components, but React ' + "doesn't know what it was. This is likely due to browser " + 'flakiness. React does its best to preserve the "Pause on ' + 'exceptions" behavior of the DevTools, which requires some ' + "DEV-mode only tricks. It's possible that these don't work in " + 'your browser. Try triggering the error in production mode, ' + 'or switching to a modern browser. If you suspect that this is ' + 'actually an issue with React, please file an issue.');
          } else if (isCrossOriginError) {
            error = new Error("A cross-origin error was thrown. React doesn't have access to " + 'the actual error object in development. ' + 'See https://fb.me/react-crossorigin-error for more information.');
          }

          this.onError(error);
        } // Remove our event listeners


        window.removeEventListener('error', handleWindowError);
      };

      invokeGuardedCallbackImpl = invokeGuardedCallbackDev;
    }
  }

  var invokeGuardedCallbackImpl$1 = invokeGuardedCallbackImpl;

  var hasError = false;
  var caughtError = null; // Used by event system to capture/rethrow the first error.

  var hasRethrowError = false;
  var rethrowError = null;
  var reporter = {
    onError: function (error) {
      hasError = true;
      caughtError = error;
    }
  };
  /**
   * Call a function while guarding against errors that happens within it.
   * Returns an error if it throws, otherwise null.
   *
   * In production, this is implemented using a try-catch. The reason we don't
   * use a try-catch directly is so that we can swap out a different
   * implementation in DEV mode.
   *
   * @param {String} name of the guard to use for logging or debugging
   * @param {Function} func The function to invoke
   * @param {*} context The context to use when calling the function
   * @param {...*} args Arguments for function
   */

  function invokeGuardedCallback(name, func, context, a, b, c, d, e, f) {
    hasError = false;
    caughtError = null;
    invokeGuardedCallbackImpl$1.apply(reporter, arguments);
  }
  /**
   * Same as invokeGuardedCallback, but instead of returning an error, it stores
   * it in a global so it can be rethrown by `rethrowCaughtError` later.
   * TODO: See if caughtError and rethrowError can be unified.
   *
   * @param {String} name of the guard to use for logging or debugging
   * @param {Function} func The function to invoke
   * @param {*} context The context to use when calling the function
   * @param {...*} args Arguments for function
   */

  function invokeGuardedCallbackAndCatchFirstError(name, func, context, a, b, c, d, e, f) {
    invokeGuardedCallback.apply(this, arguments);

    if (hasError) {
      var error = clearCaughtError();

      if (!hasRethrowError) {
        hasRethrowError = true;
        rethrowError = error;
      }
    }
  }
  /**
   * During execution of guarded functions we will capture the first error which
   * we will rethrow to be handled by the top level error handler.
   */

  function rethrowCaughtError() {
    if (hasRethrowError) {
      var error = rethrowError;
      hasRethrowError = false;
      rethrowError = null;
      throw error;
    }
  }
  function hasCaughtError() {
    return hasError;
  }
  function clearCaughtError() {
    if (hasError) {
      var error = caughtError;
      hasError = false;
      caughtError = null;
      return error;
    } else {
      {
        {
          throw Error( "clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue." );
        }
      }
    }
  }

  var getFiberCurrentPropsFromNode = null;
  var getInstanceFromNode = null;
  var getNodeFromInstance = null;
  function setComponentTree(getFiberCurrentPropsFromNodeImpl, getInstanceFromNodeImpl, getNodeFromInstanceImpl) {
    getFiberCurrentPropsFromNode = getFiberCurrentPropsFromNodeImpl;
    getInstanceFromNode = getInstanceFromNodeImpl;
    getNodeFromInstance = getNodeFromInstanceImpl;

    {
      if (!getNodeFromInstance || !getInstanceFromNode) {
        error('EventPluginUtils.setComponentTree(...): Injected ' + 'module is missing getNodeFromInstance or getInstanceFromNode.');
      }
    }
  }
  var validateEventDispatches;

  {
    validateEventDispatches = function (event) {
      var dispatchListeners = event._dispatchListeners;
      var dispatchInstances = event._dispatchInstances;
      var listenersIsArr = Array.isArray(dispatchListeners);
      var listenersLen = listenersIsArr ? dispatchListeners.length : dispatchListeners ? 1 : 0;
      var instancesIsArr = Array.isArray(dispatchInstances);
      var instancesLen = instancesIsArr ? dispatchInstances.length : dispatchInstances ? 1 : 0;

      if (instancesIsArr !== listenersIsArr || instancesLen !== listenersLen) {
        error('EventPluginUtils: Invalid `event`.');
      }
    };
  }
  /**
   * Dispatch the event to the listener.
   * @param {SyntheticEvent} event SyntheticEvent to handle
   * @param {function} listener Application-level callback
   * @param {*} inst Internal component instance
   */


  function executeDispatch(event, listener, inst) {
    var type = event.type || 'unknown-event';
    event.currentTarget = getNodeFromInstance(inst);
    invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
    event.currentTarget = null;
  }
  /**
   * Standard/simple iteration through an event's collected dispatches.
   */

  function executeDispatchesInOrder(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchInstances = event._dispatchInstances;

    {
      validateEventDispatches(event);
    }

    if (Array.isArray(dispatchListeners)) {
      for (var i = 0; i < dispatchListeners.length; i++) {
        if (event.isPropagationStopped()) {
          break;
        } // Listeners and Instances are two parallel arrays that are always in sync.


        executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
      }
    } else if (dispatchListeners) {
      executeDispatch(event, dispatchListeners, dispatchInstances);
    }

    event._dispatchListeners = null;
    event._dispatchInstances = null;
  }

  var FunctionComponent = 0;
  var ClassComponent = 1;
  var IndeterminateComponent = 2; // Before we know whether it is function or class

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
  var FundamentalComponent = 20;
  var ScopeComponent = 21;
  var Block = 22;

  /**
   * Injectable ordering of event plugins.
   */
  var eventPluginOrder = null;
  /**
   * Injectable mapping from names to event plugin modules.
   */

  var namesToPlugins = {};
  /**
   * Recomputes the plugin list using the injected plugins and plugin ordering.
   *
   * @private
   */

  function recomputePluginOrdering() {
    if (!eventPluginOrder) {
      // Wait until an `eventPluginOrder` is injected.
      return;
    }

    for (var pluginName in namesToPlugins) {
      var pluginModule = namesToPlugins[pluginName];
      var pluginIndex = eventPluginOrder.indexOf(pluginName);

      if (!(pluginIndex > -1)) {
        {
          throw Error( "EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `" + pluginName + "`." );
        }
      }

      if (plugins[pluginIndex]) {
        continue;
      }

      if (!pluginModule.extractEvents) {
        {
          throw Error( "EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `" + pluginName + "` does not." );
        }
      }

      plugins[pluginIndex] = pluginModule;
      var publishedEvents = pluginModule.eventTypes;

      for (var eventName in publishedEvents) {
        if (!publishEventForPlugin(publishedEvents[eventName], pluginModule, eventName)) {
          {
            throw Error( "EventPluginRegistry: Failed to publish event `" + eventName + "` for plugin `" + pluginName + "`." );
          }
        }
      }
    }
  }
  /**
   * Publishes an event so that it can be dispatched by the supplied plugin.
   *
   * @param {object} dispatchConfig Dispatch configuration for the event.
   * @param {object} PluginModule Plugin publishing the event.
   * @return {boolean} True if the event was successfully published.
   * @private
   */


  function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
    if (!!eventNameDispatchConfigs.hasOwnProperty(eventName)) {
      {
        throw Error( "EventPluginRegistry: More than one plugin attempted to publish the same event name, `" + eventName + "`." );
      }
    }

    eventNameDispatchConfigs[eventName] = dispatchConfig;
    var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;

    if (phasedRegistrationNames) {
      for (var phaseName in phasedRegistrationNames) {
        if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
          var phasedRegistrationName = phasedRegistrationNames[phaseName];
          publishRegistrationName(phasedRegistrationName, pluginModule, eventName);
        }
      }

      return true;
    } else if (dispatchConfig.registrationName) {
      publishRegistrationName(dispatchConfig.registrationName, pluginModule, eventName);
      return true;
    }

    return false;
  }
  /**
   * Publishes a registration name that is used to identify dispatched events.
   *
   * @param {string} registrationName Registration name to add.
   * @param {object} PluginModule Plugin publishing the event.
   * @private
   */


  function publishRegistrationName(registrationName, pluginModule, eventName) {
    if (!!registrationNameModules[registrationName]) {
      {
        throw Error( "EventPluginRegistry: More than one plugin attempted to publish the same registration name, `" + registrationName + "`." );
      }
    }

    registrationNameModules[registrationName] = pluginModule;
    registrationNameDependencies[registrationName] = pluginModule.eventTypes[eventName].dependencies;

    {
      var lowerCasedName = registrationName.toLowerCase();
      possibleRegistrationNames[lowerCasedName] = registrationName;

      if (registrationName === 'onDoubleClick') {
        possibleRegistrationNames.ondblclick = registrationName;
      }
    }
  }
  /**
   * Registers plugins so that they can extract and dispatch events.
   */

  /**
   * Ordered list of injected plugins.
   */


  var plugins = [];
  /**
   * Mapping from event name to dispatch config
   */

  var eventNameDispatchConfigs = {};
  /**
   * Mapping from registration name to plugin module
   */

  var registrationNameModules = {};
  /**
   * Mapping from registration name to event name
   */

  var registrationNameDependencies = {};
  /**
   * Mapping from lowercase registration names to the properly cased version,
   * used to warn in the case of missing event handlers. Available
   * only in true.
   * @type {Object}
   */

  var possibleRegistrationNames =  {} ; // Trust the developer to only use possibleRegistrationNames in true

  /**
   * Injects an ordering of plugins (by plugin name). This allows the ordering
   * to be decoupled from injection of the actual plugins so that ordering is
   * always deterministic regardless of packaging, on-the-fly injection, etc.
   *
   * @param {array} InjectedEventPluginOrder
   * @internal
   */

  function injectEventPluginOrder(injectedEventPluginOrder) {
    if (!!eventPluginOrder) {
      {
        throw Error( "EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React." );
      }
    } // Clone the ordering so it cannot be dynamically mutated.


    eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
    recomputePluginOrdering();
  }
  /**
   * Injects plugins to be used by plugin event system. The plugin names must be
   * in the ordering injected by `injectEventPluginOrder`.
   *
   * Plugins can be injected as part of page initialization or on-the-fly.
   *
   * @param {object} injectedNamesToPlugins Map from names to plugin modules.
   * @internal
   */

  function injectEventPluginsByName(injectedNamesToPlugins) {
    var isOrderingDirty = false;

    for (var pluginName in injectedNamesToPlugins) {
      if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
        continue;
      }

      var pluginModule = injectedNamesToPlugins[pluginName];

      if (!namesToPlugins.hasOwnProperty(pluginName) || namesToPlugins[pluginName] !== pluginModule) {
        if (!!namesToPlugins[pluginName]) {
          {
            throw Error( "EventPluginRegistry: Cannot inject two different event plugins using the same name, `" + pluginName + "`." );
          }
        }

        namesToPlugins[pluginName] = pluginModule;
        isOrderingDirty = true;
      }
    }

    if (isOrderingDirty) {
      recomputePluginOrdering();
    }
  }

  var canUseDOM = !!(typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.document.createElement !== 'undefined');

  var ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  var _assign = ReactInternals.assign;

  var PLUGIN_EVENT_SYSTEM = 1;
  var IS_REPLAYED = 1 << 5;
  var IS_FIRST_ANCESTOR = 1 << 6;

  var restoreImpl = null;
  var restoreTarget = null;
  var restoreQueue = null;

  function restoreStateOfTarget(target) {
    // We perform this translation at the end of the event loop so that we
    // always receive the correct fiber here
    var internalInstance = getInstanceFromNode(target);

    if (!internalInstance) {
      // Unmounted
      return;
    }

    if (!(typeof restoreImpl === 'function')) {
      {
        throw Error( "setRestoreImplementation() needs to be called to handle a target for controlled events. This error is likely caused by a bug in React. Please file an issue." );
      }
    }

    var stateNode = internalInstance.stateNode; // Guard against Fiber being unmounted.

    if (stateNode) {
      var _props = getFiberCurrentPropsFromNode(stateNode);

      restoreImpl(internalInstance.stateNode, internalInstance.type, _props);
    }
  }

  function setRestoreImplementation(impl) {
    restoreImpl = impl;
  }
  function enqueueStateRestore(target) {
    if (restoreTarget) {
      if (restoreQueue) {
        restoreQueue.push(target);
      } else {
        restoreQueue = [target];
      }
    } else {
      restoreTarget = target;
    }
  }
  function needsStateRestore() {
    return restoreTarget !== null || restoreQueue !== null;
  }
  function restoreStateIfNeeded() {
    if (!restoreTarget) {
      return;
    }

    var target = restoreTarget;
    var queuedTargets = restoreQueue;
    restoreTarget = null;
    restoreQueue = null;
    restoreStateOfTarget(target);

    if (queuedTargets) {
      for (var i = 0; i < queuedTargets.length; i++) {
        restoreStateOfTarget(queuedTargets[i]);
      }
    }
  }

  var enableProfilerTimer = true; // Trace which interactions trigger each commit.

  var enableDeprecatedFlareAPI = false; // Experimental Host Component support.

  var enableFundamentalAPI = false; // Experimental Scope support.
  var warnAboutStringRefs = false;

  // the renderer. Such as when we're dispatching events or if third party
  // libraries need to call batchedUpdates. Eventually, this API will go away when
  // everything is batched by default. We'll then have a similar API to opt-out of
  // scheduled work and instead do synchronous work.
  // Defaults

  var batchedUpdatesImpl = function (fn, bookkeeping) {
    return fn(bookkeeping);
  };

  var discreteUpdatesImpl = function (fn, a, b, c, d) {
    return fn(a, b, c, d);
  };

  var flushDiscreteUpdatesImpl = function () {};

  var batchedEventUpdatesImpl = batchedUpdatesImpl;
  var isInsideEventHandler = false;
  var isBatchingEventUpdates = false;

  function finishEventHandler() {
    // Here we wait until all updates have propagated, which is important
    // when using controlled components within layers:
    // https://github.com/facebook/react/issues/1698
    // Then we restore state of any controlled component.
    var controlledComponentsHavePendingUpdates = needsStateRestore();

    if (controlledComponentsHavePendingUpdates) {
      // If a controlled event was fired, we may need to restore the state of
      // the DOM node back to the controlled value. This is necessary when React
      // bails out of the update without touching the DOM.
      flushDiscreteUpdatesImpl();
      restoreStateIfNeeded();
    }
  }

  function batchedUpdates(fn, bookkeeping) {
    if (isInsideEventHandler) {
      // If we are currently inside another batch, we need to wait until it
      // fully completes before restoring state.
      return fn(bookkeeping);
    }

    isInsideEventHandler = true;

    try {
      return batchedUpdatesImpl(fn, bookkeeping);
    } finally {
      isInsideEventHandler = false;
      finishEventHandler();
    }
  }
  function batchedEventUpdates(fn, a, b) {
    if (isBatchingEventUpdates) {
      // If we are currently inside another batch, we need to wait until it
      // fully completes before restoring state.
      return fn(a, b);
    }

    isBatchingEventUpdates = true;

    try {
      return batchedEventUpdatesImpl(fn, a, b);
    } finally {
      isBatchingEventUpdates = false;
      finishEventHandler();
    }
  } // This is for the React Flare event system
  function discreteUpdates(fn, a, b, c, d) {
    var prevIsInsideEventHandler = isInsideEventHandler;
    isInsideEventHandler = true;

    try {
      return discreteUpdatesImpl(fn, a, b, c, d);
    } finally {
      isInsideEventHandler = prevIsInsideEventHandler;

      if (!isInsideEventHandler) {
        finishEventHandler();
      }
    }
  }
  function flushDiscreteUpdatesIfNeeded(timeStamp) {
    // event.timeStamp isn't overly reliable due to inconsistencies in
    // how different browsers have historically provided the time stamp.
    // Some browsers provide high-resolution time stamps for all events,
    // some provide low-resolution time stamps for all events. FF < 52
    // even mixes both time stamps together. Some browsers even report
    // negative time stamps or time stamps that are 0 (iOS9) in some cases.
    // Given we are only comparing two time stamps with equality (!==),
    // we are safe from the resolution differences. If the time stamp is 0
    // we bail-out of preventing the flush, which can affect semantics,
    // such as if an earlier flush removes or adds event listeners that
    // are fired in the subsequent flush. However, this is the same
    // behaviour as we had before this change, so the risks are low.
    if (!isInsideEventHandler && (!enableDeprecatedFlareAPI  )) {
      flushDiscreteUpdatesImpl();
    }
  }
  function setBatchingImplementation(_batchedUpdatesImpl, _discreteUpdatesImpl, _flushDiscreteUpdatesImpl, _batchedEventUpdatesImpl) {
    batchedUpdatesImpl = _batchedUpdatesImpl;
    discreteUpdatesImpl = _discreteUpdatesImpl;
    flushDiscreteUpdatesImpl = _flushDiscreteUpdatesImpl;
    batchedEventUpdatesImpl = _batchedEventUpdatesImpl;
  }

  var DiscreteEvent = 0;
  var UserBlockingEvent = 1;
  var ContinuousEvent = 2;

  var ReactInternals$1 = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  var _ReactInternals$Sched = ReactInternals$1.Scheduler,
      unstable_cancelCallback = _ReactInternals$Sched.unstable_cancelCallback,
      unstable_now = _ReactInternals$Sched.unstable_now,
      unstable_scheduleCallback = _ReactInternals$Sched.unstable_scheduleCallback,
      unstable_shouldYield = _ReactInternals$Sched.unstable_shouldYield,
      unstable_requestPaint = _ReactInternals$Sched.unstable_requestPaint,
      unstable_getFirstCallbackNode = _ReactInternals$Sched.unstable_getFirstCallbackNode,
      unstable_runWithPriority = _ReactInternals$Sched.unstable_runWithPriority,
      unstable_next = _ReactInternals$Sched.unstable_next,
      unstable_continueExecution = _ReactInternals$Sched.unstable_continueExecution,
      unstable_pauseExecution = _ReactInternals$Sched.unstable_pauseExecution,
      unstable_getCurrentPriorityLevel = _ReactInternals$Sched.unstable_getCurrentPriorityLevel,
      unstable_ImmediatePriority = _ReactInternals$Sched.unstable_ImmediatePriority,
      unstable_UserBlockingPriority = _ReactInternals$Sched.unstable_UserBlockingPriority,
      unstable_NormalPriority = _ReactInternals$Sched.unstable_NormalPriority,
      unstable_LowPriority = _ReactInternals$Sched.unstable_LowPriority,
      unstable_IdlePriority = _ReactInternals$Sched.unstable_IdlePriority,
      unstable_forceFrameRate = _ReactInternals$Sched.unstable_forceFrameRate,
      unstable_flushAllWithoutAsserting = _ReactInternals$Sched.unstable_flushAllWithoutAsserting;

  // A reserved attribute.
  // It is handled by React separately and shouldn't be written to the DOM.
  var RESERVED = 0; // A simple string attribute.
  // Attributes that aren't in the whitelist are presumed to have this type.

  var STRING = 1; // A string attribute that accepts booleans in React. In HTML, these are called
  // "enumerated" attributes with "true" and "false" as possible values.
  // When true, it should be set to a "true" string.
  // When false, it should be set to a "false" string.

  var BOOLEANISH_STRING = 2; // A real boolean attribute.
  // When true, it should be present (set either to an empty string or its name).
  // When false, it should be omitted.

  var BOOLEAN = 3; // An attribute that can be used as a flag as well as with a value.
  // When true, it should be present (set either to an empty string or its name).
  // When false, it should be omitted.
  // For any other value, should be present with that value.

  var OVERLOADED_BOOLEAN = 4; // An attribute that must be numeric or parse as a numeric.
  // When falsy, it should be removed.

  var NUMERIC = 5; // An attribute that must be positive numeric or parse as a positive numeric.
  // When falsy, it should be removed.

  var POSITIVE_NUMERIC = 6;

  /* eslint-disable max-len */
  var ATTRIBUTE_NAME_START_CHAR = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  /* eslint-enable max-len */

  var ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
  var ROOT_ATTRIBUTE_NAME = 'data-reactroot';
  var VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var illegalAttributeNameCache = {};
  var validatedAttributeNameCache = {};
  function isAttributeNameSafe(attributeName) {
    if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
      return true;
    }

    if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
      return false;
    }

    if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
      validatedAttributeNameCache[attributeName] = true;
      return true;
    }

    illegalAttributeNameCache[attributeName] = true;

    {
      error('Invalid attribute name: `%s`', attributeName);
    }

    return false;
  }
  function shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag) {
    if (propertyInfo !== null) {
      return propertyInfo.type === RESERVED;
    }

    if (isCustomComponentTag) {
      return false;
    }

    if (name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')) {
      return true;
    }

    return false;
  }
  function shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag) {
    if (propertyInfo !== null && propertyInfo.type === RESERVED) {
      return false;
    }

    switch (typeof value) {
      case 'function': // $FlowIssue symbol is perfectly valid here

      case 'symbol':
        // eslint-disable-line
        return true;

      case 'boolean':
        {
          if (isCustomComponentTag) {
            return false;
          }

          if (propertyInfo !== null) {
            return !propertyInfo.acceptsBooleans;
          } else {
            var prefix = name.toLowerCase().slice(0, 5);
            return prefix !== 'data-' && prefix !== 'aria-';
          }
        }

      default:
        return false;
    }
  }
  function shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag) {
    if (value === null || typeof value === 'undefined') {
      return true;
    }

    if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag)) {
      return true;
    }

    if (isCustomComponentTag) {
      return false;
    }

    if (propertyInfo !== null) {
      switch (propertyInfo.type) {
        case BOOLEAN:
          return !value;

        case OVERLOADED_BOOLEAN:
          return value === false;

        case NUMERIC:
          return isNaN(value);

        case POSITIVE_NUMERIC:
          return isNaN(value) || value < 1;
      }
    }

    return false;
  }
  function getPropertyInfo(name) {
    return properties.hasOwnProperty(name) ? properties[name] : null;
  }

  function PropertyInfoRecord(name, type, mustUseProperty, attributeName, attributeNamespace, sanitizeURL) {
    this.acceptsBooleans = type === BOOLEANISH_STRING || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
    this.attributeName = attributeName;
    this.attributeNamespace = attributeNamespace;
    this.mustUseProperty = mustUseProperty;
    this.propertyName = name;
    this.type = type;
    this.sanitizeURL = sanitizeURL;
  } // When adding attributes to this list, be sure to also add them to
  // the `possibleStandardNames` module to ensure casing and incorrect
  // name warnings.


  var properties = {}; // These props are reserved by React. They shouldn't be written to the DOM.

  var reservedProps = ['children', 'dangerouslySetInnerHTML', // TODO: This prevents the assignment of defaultValue to regular
  // elements (not just inputs). Now that ReactDOMInput assigns to the
  // defaultValue property -- do we need this?
  'defaultValue', 'defaultChecked', 'innerHTML', 'suppressContentEditableWarning', 'suppressHydrationWarning', 'style'];

  reservedProps.forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, RESERVED, false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false);
  }); // A few React string attributes have a different name.
  // This is a mapping from React prop names to the attribute names.

  [['acceptCharset', 'accept-charset'], ['className', 'class'], ['htmlFor', 'for'], ['httpEquiv', 'http-equiv']].forEach(function (_ref) {
    var name = _ref[0],
        attributeName = _ref[1];
    properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
    attributeName, // attributeName
    null, // attributeNamespace
    false);
  }); // These are "enumerated" HTML attributes that accept "true" and "false".
  // In React, we let users pass `true` and `false` even though technically
  // these aren't boolean attributes (they are coerced to strings).

  ['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, BOOLEANISH_STRING, false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
    false);
  }); // These are "enumerated" SVG attributes that accept "true" and "false".
  // In React, we let users pass `true` and `false` even though technically
  // these aren't boolean attributes (they are coerced to strings).
  // Since these are SVG attributes, their attribute names are case-sensitive.

  ['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, BOOLEANISH_STRING, false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false);
  }); // These are HTML boolean attributes.

  ['allowFullScreen', 'async', // Note: there is a special case that prevents it from being written to the DOM
  // on the client side because the browsers are inconsistent. Instead we call focus().
  'autoFocus', 'autoPlay', 'controls', 'default', 'defer', 'disabled', 'disablePictureInPicture', 'formNoValidate', 'hidden', 'loop', 'noModule', 'noValidate', 'open', 'playsInline', 'readOnly', 'required', 'reversed', 'scoped', 'seamless', // Microdata
  'itemScope'].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, BOOLEAN, false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
    false);
  }); // These are the few React props that we set as DOM properties
  // rather than attributes. These are all booleans.

  ['checked', // Note: `option.selected` is not updated if `select.multiple` is
  // disabled with `removeAttribute`. We have special logic for handling this.
  'multiple', 'muted', 'selected' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, BOOLEAN, true, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false);
  }); // These are HTML attributes that are "overloaded booleans": they behave like
  // booleans, but can also accept a string value.

  ['capture', 'download' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, OVERLOADED_BOOLEAN, false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false);
  }); // These are HTML attributes that must be positive numbers.

  ['cols', 'rows', 'size', 'span' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, POSITIVE_NUMERIC, false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false);
  }); // These are HTML attributes that must be numbers.

  ['rowSpan', 'start'].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, NUMERIC, false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
    false);
  });
  var CAMELIZE = /[\-\:]([a-z])/g;

  var capitalize = function (token) {
    return token[1].toUpperCase();
  }; // This is a list of all SVG attributes that need special casing, namespacing,
  // or boolean value assignment. Regular attributes that just accept strings
  // and have the same names are omitted, just like in the HTML whitelist.
  // Some of these attributes can be hard to find. This list was created by
  // scraping the MDN documentation.


  ['accent-height', 'alignment-baseline', 'arabic-form', 'baseline-shift', 'cap-height', 'clip-path', 'clip-rule', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'dominant-baseline', 'enable-background', 'fill-opacity', 'fill-rule', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-name', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'horiz-adv-x', 'horiz-origin-x', 'image-rendering', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'overline-position', 'overline-thickness', 'paint-order', 'panose-1', 'pointer-events', 'rendering-intent', 'shape-rendering', 'stop-color', 'stop-opacity', 'strikethrough-position', 'strikethrough-thickness', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'underline-position', 'underline-thickness', 'unicode-bidi', 'unicode-range', 'units-per-em', 'v-alphabetic', 'v-hanging', 'v-ideographic', 'v-mathematical', 'vector-effect', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'word-spacing', 'writing-mode', 'xmlns:xlink', 'x-height' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (attributeName) {
    var name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
    attributeName, null, // attributeNamespace
    false);
  }); // String SVG attributes with the xlink namespace.

  ['xlink:actuate', 'xlink:arcrole', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (attributeName) {
    var name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
    attributeName, 'http://www.w3.org/1999/xlink', false);
  }); // String SVG attributes with the xml namespace.

  ['xml:base', 'xml:lang', 'xml:space' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (attributeName) {
    var name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
    attributeName, 'http://www.w3.org/XML/1998/namespace', false);
  }); // These attribute exists both in HTML and SVG.
  // The attribute name is case-sensitive in SVG so we can't just use
  // the React name like we do for attributes that exist only in HTML.

  ['tabIndex', 'crossOrigin'].forEach(function (attributeName) {
    properties[attributeName] = new PropertyInfoRecord(attributeName, STRING, false, // mustUseProperty
    attributeName.toLowerCase(), // attributeName
    null, // attributeNamespace
    false);
  }); // These attributes accept URLs. These must not allow javascript: URLS.
  // These will also need to accept Trusted Types object in the future.

  var xlinkHref = 'xlinkHref';
  properties[xlinkHref] = new PropertyInfoRecord('xlinkHref', STRING, false, // mustUseProperty
  'xlink:href', 'http://www.w3.org/1999/xlink', true);
  ['src', 'href', 'action', 'formAction'].forEach(function (attributeName) {
    properties[attributeName] = new PropertyInfoRecord(attributeName, STRING, false, // mustUseProperty
    attributeName.toLowerCase(), // attributeName
    null, // attributeNamespace
    true);
  });

  var ReactDebugCurrentFrame = null;

  {
    ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
  } // A javascript: URL can contain leading C0 control or \u0020 SPACE,
  // and any newline or tab are filtered out as if they're not part of the URL.
  // https://url.spec.whatwg.org/#url-parsing
  // Tab or newline are defined as \r\n\t:
  // https://infra.spec.whatwg.org/#ascii-tab-or-newline
  // A C0 control is a code point in the range \u0000 NULL to \u001F
  // INFORMATION SEPARATOR ONE, inclusive:
  // https://infra.spec.whatwg.org/#c0-control-or-space

  /* eslint-disable max-len */


  var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;
  var didWarn = false;

  function sanitizeURL(url) {
    {
      if (!didWarn && isJavaScriptProtocol.test(url)) {
        didWarn = true;

        error('A future version of React will block javascript: URLs as a security precaution. ' + 'Use event handlers instead if you can. If you need to generate unsafe HTML try ' + 'using dangerouslySetInnerHTML instead. React was passed %s.', JSON.stringify(url));
      }
    }
  }

  /**
   * Get the value for a property on a node. Only used in DEV for SSR validation.
   * The "expected" argument is used as a hint of what the expected value is.
   * Some properties have multiple equivalent values.
   */
  function getValueForProperty(node, name, expected, propertyInfo) {
    {
      if (propertyInfo.mustUseProperty) {
        var propertyName = propertyInfo.propertyName;
        return node[propertyName];
      } else {
        if ( propertyInfo.sanitizeURL) {
          // If we haven't fully disabled javascript: URLs, and if
          // the hydration is successful of a javascript: URL, we
          // still want to warn on the client.
          sanitizeURL('' + expected);
        }

        var attributeName = propertyInfo.attributeName;
        var stringValue = null;

        if (propertyInfo.type === OVERLOADED_BOOLEAN) {
          if (node.hasAttribute(attributeName)) {
            var value = node.getAttribute(attributeName);

            if (value === '') {
              return true;
            }

            if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
              return value;
            }

            if (value === '' + expected) {
              return expected;
            }

            return value;
          }
        } else if (node.hasAttribute(attributeName)) {
          if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
            // We had an attribute but shouldn't have had one, so read it
            // for the error message.
            return node.getAttribute(attributeName);
          }

          if (propertyInfo.type === BOOLEAN) {
            // If this was a boolean, it doesn't matter what the value is
            // the fact that we have it is the same as the expected.
            return expected;
          } // Even if this property uses a namespace we use getAttribute
          // because we assume its namespaced name is the same as our config.
          // To use getAttributeNS we need the local name which we don't have
          // in our config atm.


          stringValue = node.getAttribute(attributeName);
        }

        if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
          return stringValue === null ? expected : stringValue;
        } else if (stringValue === '' + expected) {
          return expected;
        } else {
          return stringValue;
        }
      }
    }
  }
  /**
   * Get the value for a attribute on a node. Only used in DEV for SSR validation.
   * The third argument is used as a hint of what the expected value is. Some
   * attributes have multiple equivalent values.
   */

  function getValueForAttribute(node, name, expected) {
    {
      if (!isAttributeNameSafe(name)) {
        return;
      }

      if (!node.hasAttribute(name)) {
        return expected === undefined ? undefined : null;
      }

      var value = node.getAttribute(name);

      if (value === '' + expected) {
        return expected;
      }

      return value;
    }
  }
  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */

  function setValueForProperty(node, name, value, isCustomComponentTag) {
    var propertyInfo = getPropertyInfo(name);

    if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) {
      return;
    }

    if (shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)) {
      value = null;
    } // If the prop isn't in the special list, treat it as a simple attribute.


    if (isCustomComponentTag || propertyInfo === null) {
      if (isAttributeNameSafe(name)) {
        var _attributeName = name;

        if (value === null) {
          node.removeAttribute(_attributeName);
        } else {
          node.setAttribute(_attributeName,  '' + value);
        }
      }

      return;
    }

    var mustUseProperty = propertyInfo.mustUseProperty;

    if (mustUseProperty) {
      var propertyName = propertyInfo.propertyName;

      if (value === null) {
        var type = propertyInfo.type;
        node[propertyName] = type === BOOLEAN ? false : '';
      } else {
        // Contrary to `setAttribute`, object properties are properly
        // `toString`ed by IE8/9.
        node[propertyName] = value;
      }

      return;
    } // The rest are treated as attributes with special cases.


    var attributeName = propertyInfo.attributeName,
        attributeNamespace = propertyInfo.attributeNamespace;

    if (value === null) {
      node.removeAttribute(attributeName);
    } else {
      var _type = propertyInfo.type;
      var attributeValue;

      if (_type === BOOLEAN || _type === OVERLOADED_BOOLEAN && value === true) {
        // If attribute type is boolean, we know for sure it won't be an execution sink
        // and we won't require Trusted Type here.
        attributeValue = '';
      } else {
        // `setAttribute` with objects becomes only `[object]` in IE8/9,
        // ('' + value) makes it output the correct toString()-value.
        {
          attributeValue = '' + value;
        }

        if (propertyInfo.sanitizeURL) {
          sanitizeURL(attributeValue.toString());
        }
      }

      if (attributeNamespace) {
        node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
      } else {
        node.setAttribute(attributeName, attributeValue);
      }
    }
  }

  var BEFORE_SLASH_RE = /^(.*)[\\\/]/;
  function describeComponentFrame (name, source, ownerName) {
    var sourceInfo = '';

    if (source) {
      var path = source.fileName;
      var fileName = path.replace(BEFORE_SLASH_RE, '');

      {
        // In DEV, include code for a common special case:
        // prefer "folder/index.js" instead of just "index.js".
        if (/^index\./.test(fileName)) {
          var match = path.match(BEFORE_SLASH_RE);

          if (match) {
            var pathBeforeSlash = match[1];

            if (pathBeforeSlash) {
              var folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, '');
              fileName = folderName + '/' + fileName;
            }
          }
        }
      }

      sourceInfo = ' (at ' + fileName + ':' + source.lineNumber + ')';
    } else if (ownerName) {
      sourceInfo = ' (created by ' + ownerName + ')';
    }

    return '\n    in ' + (name || 'Unknown') + sourceInfo;
  }

  // The Symbol used to tag the ReactElement-like types. If there is no native Symbol
  // nor polyfill, then a plain number is used for performance.
  var hasSymbol = typeof Symbol === 'function' && Symbol.for;
  var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
  var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
  var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
  var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
  var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
  var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
  var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
  var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
  var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
  var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
  var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
  var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
  var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
  var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
  var MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
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

  var Uninitialized = -1;
  var Pending = 0;
  var Resolved = 1;
  var Rejected = 2;
  function refineResolvedLazyComponent(lazyComponent) {
    return lazyComponent._status === Resolved ? lazyComponent._result : null;
  }
  function initializeLazyComponentType(lazyComponent) {
    if (lazyComponent._status === Uninitialized) {
      lazyComponent._status = Pending;
      var ctor = lazyComponent._ctor;
      var thenable = ctor();
      lazyComponent._result = thenable;
      thenable.then(function (moduleObject) {
        if (lazyComponent._status === Pending) {
          var defaultExport = moduleObject.default;

          {
            if (defaultExport === undefined) {
              error('lazy: Expected the result of a dynamic import() call. ' + 'Instead received: %s\n\nYour code should look like: \n  ' + "const MyComponent = lazy(() => import('./MyComponent'))", moduleObject);
            }
          }

          lazyComponent._status = Resolved;
          lazyComponent._result = defaultExport;
        }
      }, function (error) {
        if (lazyComponent._status === Pending) {
          lazyComponent._status = Rejected;
          lazyComponent._result = error;
        }
      });
    }
  }

  function getWrappedName(outerType, innerType, wrapperName) {
    var functionName = innerType.displayName || innerType.name || '';
    return outerType.displayName || (functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName);
  }

  function getComponentName(type) {
    if (type == null) {
      // Host root, text node or just invalid type.
      return null;
    }

    {
      if (typeof type.tag === 'number') {
        error('Received an unexpected object in getComponentName(). ' + 'This is likely a bug in React. Please file an issue.');
      }
    }

    if (typeof type === 'function') {
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
        return "Profiler";

      case REACT_STRICT_MODE_TYPE:
        return 'StrictMode';

      case REACT_SUSPENSE_TYPE:
        return 'Suspense';

      case REACT_SUSPENSE_LIST_TYPE:
        return 'SuspenseList';
    }

    if (typeof type === 'object') {
      switch (type.$$typeof) {
        case REACT_CONTEXT_TYPE:
          return 'Context.Consumer';

        case REACT_PROVIDER_TYPE:
          return 'Context.Provider';

        case REACT_FORWARD_REF_TYPE:
          return getWrappedName(type, type.render, 'ForwardRef');

        case REACT_MEMO_TYPE:
          return getComponentName(type.type);

        case REACT_BLOCK_TYPE:
          return getComponentName(type.render);

        case REACT_LAZY_TYPE:
          {
            var thenable = type;
            var resolvedThenable = refineResolvedLazyComponent(thenable);

            if (resolvedThenable) {
              return getComponentName(resolvedThenable);
            }

            break;
          }
      }
    }

    return null;
  }

  var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;

  function describeFiber(fiber) {
    switch (fiber.tag) {
      case HostRoot:
      case HostPortal:
      case HostText:
      case Fragment:
      case ContextProvider:
      case ContextConsumer:
        return '';

      default:
        var owner = fiber._debugOwner;
        var source = fiber._debugSource;
        var name = getComponentName(fiber.type);
        var ownerName = null;

        if (owner) {
          ownerName = getComponentName(owner.type);
        }

        return describeComponentFrame(name, source, ownerName);
    }
  }

  function getStackByFiberInDevAndProd(workInProgress) {
    var info = '';
    var node = workInProgress;

    do {
      info += describeFiber(node);
      node = node.return;
    } while (node);

    return info;
  }
  var current = null;
  var isRendering = false;
  function getCurrentFiberOwnerNameInDevOrNull() {
    {
      if (current === null) {
        return null;
      }

      var owner = current._debugOwner;

      if (owner !== null && typeof owner !== 'undefined') {
        return getComponentName(owner.type);
      }
    }

    return null;
  }
  function getCurrentFiberStackInDev() {
    {
      if (current === null) {
        return '';
      } // Safe because if current fiber exists, we are reconciling,
      // and it is guaranteed to be the work-in-progress version.


      return getStackByFiberInDevAndProd(current);
    }
  }
  function resetCurrentFiber() {
    {
      ReactDebugCurrentFrame$1.getCurrentStack = null;
      current = null;
      isRendering = false;
    }
  }
  function setCurrentFiber(fiber) {
    {
      ReactDebugCurrentFrame$1.getCurrentStack = getCurrentFiberStackInDev;
      current = fiber;
      isRendering = false;
    }
  }
  function setIsRendering(rendering) {
    {
      isRendering = rendering;
    }
  }

  // Flow does not allow string concatenation of most non-string types. To work
  // around this limitation, we use an opaque type that can only be obtained by
  // passing the value through getToStringValue first.
  function toString(value) {
    return '' + value;
  }
  function getToStringValue(value) {
    switch (typeof value) {
      case 'boolean':
      case 'number':
      case 'object':
      case 'string':
      case 'undefined':
        return value;

      default:
        // function, symbol are assigned as empty strings
        return '';
    }
  }

  /**
   * Copyright (c) 2013-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

  var ReactPropTypesSecret_1 = ReactPropTypesSecret;

  var printWarning$1 = function() {};

  {
    var ReactPropTypesSecret$1 = ReactPropTypesSecret_1;
    var loggedTypeFailures = {};
    var has = Function.call.bind(Object.prototype.hasOwnProperty);

    printWarning$1 = function(text) {
      var message = 'Warning: ' + text;
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
  function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
    {
      for (var typeSpecName in typeSpecs) {
        if (has(typeSpecs, typeSpecName)) {
          var error;
          // Prop type validation may throw. In case they do, we don't want to
          // fail the render phase where it didn't fail before. So we log it.
          // After these have been cleaned up, we'll let them throw.
          try {
            // This is intentionally an invariant that gets caught. It's the same
            // behavior as without this statement except with a better message.
            if (typeof typeSpecs[typeSpecName] !== 'function') {
              var err = Error(
                (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
                'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.'
              );
              err.name = 'Invariant Violation';
              throw err;
            }
            error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret$1);
          } catch (ex) {
            error = ex;
          }
          if (error && !(error instanceof Error)) {
            printWarning$1(
              (componentName || 'React class') + ': type specification of ' +
              location + ' `' + typeSpecName + '` is invalid; the type checker ' +
              'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
              'You may have forgotten to pass an argument to the type checker ' +
              'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
              'shape all require an argument).'
            );
          }
          if (error instanceof Error && !(error.message in loggedTypeFailures)) {
            // Only monitor this failure once because there tends to be a lot of the
            // same error.
            loggedTypeFailures[error.message] = true;

            var stack = getStack ? getStack() : '';

            printWarning$1(
              'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
            );
          }
        }
      }
    }
  }

  /**
   * Resets warning cache when testing.
   *
   * @private
   */
  checkPropTypes.resetWarningCache = function() {
    {
      loggedTypeFailures = {};
    }
  };

  var checkPropTypes_1 = checkPropTypes;

  var ReactDebugCurrentFrame$2 = null;
  var ReactControlledValuePropTypes = {
    checkPropTypes: null
  };

  {
    ReactDebugCurrentFrame$2 = ReactSharedInternals.ReactDebugCurrentFrame;
    var hasReadOnlyValue = {
      button: true,
      checkbox: true,
      image: true,
      hidden: true,
      radio: true,
      reset: true,
      submit: true
    };
    var propTypes = {
      value: function (props, propName, componentName) {
        if (hasReadOnlyValue[props.type] || props.onChange || props.readOnly || props.disabled || props[propName] == null || enableDeprecatedFlareAPI ) {
          return null;
        }

        return new Error('You provided a `value` prop to a form field without an ' + '`onChange` handler. This will render a read-only field. If ' + 'the field should be mutable use `defaultValue`. Otherwise, ' + 'set either `onChange` or `readOnly`.');
      },
      checked: function (props, propName, componentName) {
        if (props.onChange || props.readOnly || props.disabled || props[propName] == null || enableDeprecatedFlareAPI ) {
          return null;
        }

        return new Error('You provided a `checked` prop to a form field without an ' + '`onChange` handler. This will render a read-only field. If ' + 'the field should be mutable use `defaultChecked`. Otherwise, ' + 'set either `onChange` or `readOnly`.');
      }
    };
    /**
     * Provide a linked `value` attribute for controlled forms. You should not use
     * this outside of the ReactDOM controlled form components.
     */

    ReactControlledValuePropTypes.checkPropTypes = function (tagName, props) {
      checkPropTypes_1(propTypes, props, 'prop', tagName, ReactDebugCurrentFrame$2.getStackAddendum);
    };
  }

  function isCheckable(elem) {
    var type = elem.type;
    var nodeName = elem.nodeName;
    return nodeName && nodeName.toLowerCase() === 'input' && (type === 'checkbox' || type === 'radio');
  }

  function getTracker(node) {
    return node._valueTracker;
  }

  function detachTracker(node) {
    node._valueTracker = null;
  }

  function getValueFromNode(node) {
    var value = '';

    if (!node) {
      return value;
    }

    if (isCheckable(node)) {
      value = node.checked ? 'true' : 'false';
    } else {
      value = node.value;
    }

    return value;
  }

  function trackValueOnNode(node) {
    var valueField = isCheckable(node) ? 'checked' : 'value';
    var descriptor = Object.getOwnPropertyDescriptor(node.constructor.prototype, valueField);
    var currentValue = '' + node[valueField]; // if someone has already defined a value or Safari, then bail
    // and don't track value will cause over reporting of changes,
    // but it's better then a hard failure
    // (needed for certain tests that spyOn input values and Safari)

    if (node.hasOwnProperty(valueField) || typeof descriptor === 'undefined' || typeof descriptor.get !== 'function' || typeof descriptor.set !== 'function') {
      return;
    }

    var get = descriptor.get,
        set = descriptor.set;
    Object.defineProperty(node, valueField, {
      configurable: true,
      get: function () {
        return get.call(this);
      },
      set: function (value) {
        currentValue = '' + value;
        set.call(this, value);
      }
    }); // We could've passed this the first time
    // but it triggers a bug in IE11 and Edge 14/15.
    // Calling defineProperty() again should be equivalent.
    // https://github.com/facebook/react/issues/11768

    Object.defineProperty(node, valueField, {
      enumerable: descriptor.enumerable
    });
    var tracker = {
      getValue: function () {
        return currentValue;
      },
      setValue: function (value) {
        currentValue = '' + value;
      },
      stopTracking: function () {
        detachTracker(node);
        delete node[valueField];
      }
    };
    return tracker;
  }

  function track(node) {
    if (getTracker(node)) {
      return;
    } // TODO: Once it's just Fiber we can move this to node._wrapperState


    node._valueTracker = trackValueOnNode(node);
  }
  function updateValueIfChanged(node) {
    if (!node) {
      return false;
    }

    var tracker = getTracker(node); // if there is no tracker at this point it's unlikely
    // that trying again will succeed

    if (!tracker) {
      return true;
    }

    var lastValue = tracker.getValue();
    var nextValue = getValueFromNode(node);

    if (nextValue !== lastValue) {
      tracker.setValue(nextValue);
      return true;
    }

    return false;
  }

  var didWarnValueDefaultValue = false;
  var didWarnCheckedDefaultChecked = false;
  var didWarnControlledToUncontrolled = false;
  var didWarnUncontrolledToControlled = false;

  function isControlled(props) {
    var usesChecked = props.type === 'checkbox' || props.type === 'radio';
    return usesChecked ? props.checked != null : props.value != null;
  }
  /**
   * Implements an <input> host component that allows setting these optional
   * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
   *
   * If `checked` or `value` are not supplied (or null/undefined), user actions
   * that affect the checked state or value will trigger updates to the element.
   *
   * If they are supplied (and not null/undefined), the rendered element will not
   * trigger updates to the element. Instead, the props must change in order for
   * the rendered element to be updated.
   *
   * The rendered element will be initialized as unchecked (or `defaultChecked`)
   * with an empty value (or `defaultValue`).
   *
   * See http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
   */


  function getHostProps(element, props) {
    var node = element;
    var checked = props.checked;

    var hostProps = _assign({}, props, {
      defaultChecked: undefined,
      defaultValue: undefined,
      value: undefined,
      checked: checked != null ? checked : node._wrapperState.initialChecked
    });

    return hostProps;
  }
  function initWrapperState(element, props) {
    {
      ReactControlledValuePropTypes.checkPropTypes('input', props);

      if (props.checked !== undefined && props.defaultChecked !== undefined && !didWarnCheckedDefaultChecked) {
        error('%s contains an input of type %s with both checked and defaultChecked props. ' + 'Input elements must be either controlled or uncontrolled ' + '(specify either the checked prop, or the defaultChecked prop, but not ' + 'both). Decide between using a controlled or uncontrolled input ' + 'element and remove one of these props. More info: ' + 'https://fb.me/react-controlled-components', getCurrentFiberOwnerNameInDevOrNull() || 'A component', props.type);

        didWarnCheckedDefaultChecked = true;
      }

      if (props.value !== undefined && props.defaultValue !== undefined && !didWarnValueDefaultValue) {
        error('%s contains an input of type %s with both value and defaultValue props. ' + 'Input elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled input ' + 'element and remove one of these props. More info: ' + 'https://fb.me/react-controlled-components', getCurrentFiberOwnerNameInDevOrNull() || 'A component', props.type);

        didWarnValueDefaultValue = true;
      }
    }

    var node = element;
    var defaultValue = props.defaultValue == null ? '' : props.defaultValue;
    node._wrapperState = {
      initialChecked: props.checked != null ? props.checked : props.defaultChecked,
      initialValue: getToStringValue(props.value != null ? props.value : defaultValue),
      controlled: isControlled(props)
    };
  }
  function updateChecked(element, props) {
    var node = element;
    var checked = props.checked;

    if (checked != null) {
      setValueForProperty(node, 'checked', checked, false);
    }
  }
  function updateWrapper(element, props) {
    var node = element;

    {
      var controlled = isControlled(props);

      if (!node._wrapperState.controlled && controlled && !didWarnUncontrolledToControlled) {
        error('A component is changing an uncontrolled input of type %s to be controlled. ' + 'Input elements should not switch from uncontrolled to controlled (or vice versa). ' + 'Decide between using a controlled or uncontrolled input ' + 'element for the lifetime of the component. More info: https://fb.me/react-controlled-components', props.type);

        didWarnUncontrolledToControlled = true;
      }

      if (node._wrapperState.controlled && !controlled && !didWarnControlledToUncontrolled) {
        error('A component is changing a controlled input of type %s to be uncontrolled. ' + 'Input elements should not switch from controlled to uncontrolled (or vice versa). ' + 'Decide between using a controlled or uncontrolled input ' + 'element for the lifetime of the component. More info: https://fb.me/react-controlled-components', props.type);

        didWarnControlledToUncontrolled = true;
      }
    }

    updateChecked(element, props);
    var value = getToStringValue(props.value);
    var type = props.type;

    if (value != null) {
      if (type === 'number') {
        if (value === 0 && node.value === '' || // We explicitly want to coerce to number here if possible.
        // eslint-disable-next-line
        node.value != value) {
          node.value = toString(value);
        }
      } else if (node.value !== toString(value)) {
        node.value = toString(value);
      }
    } else if (type === 'submit' || type === 'reset') {
      // Submit/reset inputs need the attribute removed completely to avoid
      // blank-text buttons.
      node.removeAttribute('value');
      return;
    }

    {
      // When syncing the value attribute, the value comes from a cascade of
      // properties:
      //  1. The value React property
      //  2. The defaultValue React property
      //  3. Otherwise there should be no change
      if (props.hasOwnProperty('value')) {
        setDefaultValue(node, props.type, value);
      } else if (props.hasOwnProperty('defaultValue')) {
        setDefaultValue(node, props.type, getToStringValue(props.defaultValue));
      }
    }

    {
      // When syncing the checked attribute, it only changes when it needs
      // to be removed, such as transitioning from a checkbox into a text input
      if (props.checked == null && props.defaultChecked != null) {
        node.defaultChecked = !!props.defaultChecked;
      }
    }
  }
  function postMountWrapper(element, props, isHydrating) {
    var node = element; // Do not assign value if it is already set. This prevents user text input
    // from being lost during SSR hydration.

    if (props.hasOwnProperty('value') || props.hasOwnProperty('defaultValue')) {
      var type = props.type;
      var isButton = type === 'submit' || type === 'reset'; // Avoid setting value attribute on submit/reset inputs as it overrides the
      // default value provided by the browser. See: #12872

      if (isButton && (props.value === undefined || props.value === null)) {
        return;
      }

      var initialValue = toString(node._wrapperState.initialValue); // Do not assign value if it is already set. This prevents user text input
      // from being lost during SSR hydration.

      if (!isHydrating) {
        {
          // When syncing the value attribute, the value property should use
          // the wrapperState._initialValue property. This uses:
          //
          //   1. The value React property when present
          //   2. The defaultValue React property when present
          //   3. An empty string
          if (initialValue !== node.value) {
            node.value = initialValue;
          }
        }
      }

      {
        // Otherwise, the value attribute is synchronized to the property,
        // so we assign defaultValue to the same thing as the value property
        // assignment step above.
        node.defaultValue = initialValue;
      }
    } // Normally, we'd just do `node.checked = node.checked` upon initial mount, less this bug
    // this is needed to work around a chrome bug where setting defaultChecked
    // will sometimes influence the value of checked (even after detachment).
    // Reference: https://bugs.chromium.org/p/chromium/issues/detail?id=608416
    // We need to temporarily unset name to avoid disrupting radio button groups.


    var name = node.name;

    if (name !== '') {
      node.name = '';
    }

    {
      // When syncing the checked attribute, both the checked property and
      // attribute are assigned at the same time using defaultChecked. This uses:
      //
      //   1. The checked React property when present
      //   2. The defaultChecked React property when present
      //   3. Otherwise, false
      node.defaultChecked = !node.defaultChecked;
      node.defaultChecked = !!node._wrapperState.initialChecked;
    }

    if (name !== '') {
      node.name = name;
    }
  }
  function restoreControlledState(element, props) {
    var node = element;
    updateWrapper(node, props);
    updateNamedCousins(node, props);
  }

  function updateNamedCousins(rootNode, props) {
    var name = props.name;

    if (props.type === 'radio' && name != null) {
      var queryRoot = rootNode;

      while (queryRoot.parentNode) {
        queryRoot = queryRoot.parentNode;
      } // If `rootNode.form` was non-null, then we could try `form.elements`,
      // but that sometimes behaves strangely in IE8. We could also try using
      // `form.getElementsByName`, but that will only return direct children
      // and won't include inputs that use the HTML5 `form=` attribute. Since
      // the input might not even be in a form. It might not even be in the
      // document. Let's just use the local `querySelectorAll` to ensure we don't
      // miss anything.


      var group = queryRoot.querySelectorAll('input[name=' + JSON.stringify('' + name) + '][type="radio"]');

      for (var i = 0; i < group.length; i++) {
        var otherNode = group[i];

        if (otherNode === rootNode || otherNode.form !== rootNode.form) {
          continue;
        } // This will throw if radio buttons rendered by different copies of React
        // and the same name are rendered into the same form (same as #1939).
        // That's probably okay; we don't support it just as we don't support
        // mixing React radio buttons with non-React ones.


        var otherProps = getFiberCurrentPropsFromNode$1(otherNode);

        if (!otherProps) {
          {
            throw Error( "ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported." );
          }
        } // We need update the tracked value on the named cousin since the value
        // was changed but the input saw no event or value set


        updateValueIfChanged(otherNode); // If this is a controlled radio button group, forcing the input that
        // was previously checked to update will cause it to be come re-checked
        // as appropriate.

        updateWrapper(otherNode, otherProps);
      }
    }
  } // In Chrome, assigning defaultValue to certain input types triggers input validation.
  // For number inputs, the display value loses trailing decimal points. For email inputs,
  // Chrome raises "The specified value <x> is not a valid email address".
  //
  // Here we check to see if the defaultValue has actually changed, avoiding these problems
  // when the user is inputting text
  //
  // https://github.com/facebook/react/issues/7253


  function setDefaultValue(node, type, value) {
    if ( // Focused number inputs synchronize on blur. See ChangeEventPlugin.js
    type !== 'number' || node.ownerDocument.activeElement !== node) {
      if (value == null) {
        node.defaultValue = toString(node._wrapperState.initialValue);
      } else if (node.defaultValue !== toString(value)) {
        node.defaultValue = toString(value);
      }
    }
  }

  var didWarnSelectedSetOnOption = false;
  var didWarnInvalidChild = false;

  function flattenChildren(children) {
    var content = ''; // Flatten children. We'll warn if they are invalid
    // during validateProps() which runs for hydration too.
    // Note that this would throw on non-element objects.
    // Elements are stringified (which is normally irrelevant
    // but matters for <fbt>).

    React.Children.forEach(children, function (child) {
      if (child == null) {
        return;
      }

      content += child; // Note: we don't warn about invalid children here.
      // Instead, this is done separately below so that
      // it happens during the hydration codepath too.
    });
    return content;
  }
  /**
   * Implements an <option> host component that warns when `selected` is set.
   */


  function validateProps(element, props) {
    {
      // This mirrors the codepath above, but runs for hydration too.
      // Warn about invalid children here so that client and hydration are consistent.
      // TODO: this seems like it could cause a DEV-only throw for hydration
      // if children contains a non-element object. We should try to avoid that.
      if (typeof props.children === 'object' && props.children !== null) {
        React.Children.forEach(props.children, function (child) {
          if (child == null) {
            return;
          }

          if (typeof child === 'string' || typeof child === 'number') {
            return;
          }

          if (typeof child.type !== 'string') {
            return;
          }

          if (!didWarnInvalidChild) {
            didWarnInvalidChild = true;

            error('Only strings and numbers are supported as <option> children.');
          }
        });
      } // TODO: Remove support for `selected` in <option>.


      if (props.selected != null && !didWarnSelectedSetOnOption) {
        error('Use the `defaultValue` or `value` props on <select> instead of ' + 'setting `selected` on <option>.');

        didWarnSelectedSetOnOption = true;
      }
    }
  }
  function postMountWrapper$1(element, props) {
    // value="" should make a value attribute (#6219)
    if (props.value != null) {
      element.setAttribute('value', toString(getToStringValue(props.value)));
    }
  }
  function getHostProps$1(element, props) {
    var hostProps = _assign({
      children: undefined
    }, props);

    var content = flattenChildren(props.children);

    if (content) {
      hostProps.children = content;
    }

    return hostProps;
  }

  var didWarnValueDefaultValue$1;

  {
    didWarnValueDefaultValue$1 = false;
  }

  function getDeclarationErrorAddendum() {
    var ownerName = getCurrentFiberOwnerNameInDevOrNull();

    if (ownerName) {
      return '\n\nCheck the render method of `' + ownerName + '`.';
    }

    return '';
  }

  var valuePropNames = ['value', 'defaultValue'];
  /**
   * Validation function for `value` and `defaultValue`.
   */

  function checkSelectPropTypes(props) {
    {
      ReactControlledValuePropTypes.checkPropTypes('select', props);

      for (var i = 0; i < valuePropNames.length; i++) {
        var propName = valuePropNames[i];

        if (props[propName] == null) {
          continue;
        }

        var isArray = Array.isArray(props[propName]);

        if (props.multiple && !isArray) {
          error('The `%s` prop supplied to <select> must be an array if ' + '`multiple` is true.%s', propName, getDeclarationErrorAddendum());
        } else if (!props.multiple && isArray) {
          error('The `%s` prop supplied to <select> must be a scalar ' + 'value if `multiple` is false.%s', propName, getDeclarationErrorAddendum());
        }
      }
    }
  }

  function updateOptions(node, multiple, propValue, setDefaultSelected) {
    var options = node.options;

    if (multiple) {
      var selectedValues = propValue;
      var selectedValue = {};

      for (var i = 0; i < selectedValues.length; i++) {
        // Prefix to avoid chaos with special keys.
        selectedValue['$' + selectedValues[i]] = true;
      }

      for (var _i = 0; _i < options.length; _i++) {
        var selected = selectedValue.hasOwnProperty('$' + options[_i].value);

        if (options[_i].selected !== selected) {
          options[_i].selected = selected;
        }

        if (selected && setDefaultSelected) {
          options[_i].defaultSelected = true;
        }
      }
    } else {
      // Do not set `select.value` as exact behavior isn't consistent across all
      // browsers for all cases.
      var _selectedValue = toString(getToStringValue(propValue));

      var defaultSelected = null;

      for (var _i2 = 0; _i2 < options.length; _i2++) {
        if (options[_i2].value === _selectedValue) {
          options[_i2].selected = true;

          if (setDefaultSelected) {
            options[_i2].defaultSelected = true;
          }

          return;
        }

        if (defaultSelected === null && !options[_i2].disabled) {
          defaultSelected = options[_i2];
        }
      }

      if (defaultSelected !== null) {
        defaultSelected.selected = true;
      }
    }
  }
  /**
   * Implements a <select> host component that allows optionally setting the
   * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
   * stringable. If `multiple` is true, the prop must be an array of stringables.
   *
   * If `value` is not supplied (or null/undefined), user actions that change the
   * selected option will trigger updates to the rendered options.
   *
   * If it is supplied (and not null/undefined), the rendered options will not
   * update in response to user actions. Instead, the `value` prop must change in
   * order for the rendered options to update.
   *
   * If `defaultValue` is provided, any options with the supplied values will be
   * selected.
   */


  function getHostProps$2(element, props) {
    return _assign({}, props, {
      value: undefined
    });
  }
  function initWrapperState$1(element, props) {
    var node = element;

    {
      checkSelectPropTypes(props);
    }

    node._wrapperState = {
      wasMultiple: !!props.multiple
    };

    {
      if (props.value !== undefined && props.defaultValue !== undefined && !didWarnValueDefaultValue$1) {
        error('Select elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled select ' + 'element and remove one of these props. More info: ' + 'https://fb.me/react-controlled-components');

        didWarnValueDefaultValue$1 = true;
      }
    }
  }
  function postMountWrapper$2(element, props) {
    var node = element;
    node.multiple = !!props.multiple;
    var value = props.value;

    if (value != null) {
      updateOptions(node, !!props.multiple, value, false);
    } else if (props.defaultValue != null) {
      updateOptions(node, !!props.multiple, props.defaultValue, true);
    }
  }
  function postUpdateWrapper(element, props) {
    var node = element;
    var wasMultiple = node._wrapperState.wasMultiple;
    node._wrapperState.wasMultiple = !!props.multiple;
    var value = props.value;

    if (value != null) {
      updateOptions(node, !!props.multiple, value, false);
    } else if (wasMultiple !== !!props.multiple) {
      // For simplicity, reapply `defaultValue` if `multiple` is toggled.
      if (props.defaultValue != null) {
        updateOptions(node, !!props.multiple, props.defaultValue, true);
      } else {
        // Revert the select back to its default unselected state.
        updateOptions(node, !!props.multiple, props.multiple ? [] : '', false);
      }
    }
  }
  function restoreControlledState$1(element, props) {
    var node = element;
    var value = props.value;

    if (value != null) {
      updateOptions(node, !!props.multiple, value, false);
    }
  }

  var didWarnValDefaultVal = false;

  /**
   * Implements a <textarea> host component that allows setting `value`, and
   * `defaultValue`. This differs from the traditional DOM API because value is
   * usually set as PCDATA children.
   *
   * If `value` is not supplied (or null/undefined), user actions that affect the
   * value will trigger updates to the element.
   *
   * If `value` is supplied (and not null/undefined), the rendered element will
   * not trigger updates to the element. Instead, the `value` prop must change in
   * order for the rendered element to be updated.
   *
   * The rendered element will be initialized with an empty value, the prop
   * `defaultValue` if specified, or the children content (deprecated).
   */
  function getHostProps$3(element, props) {
    var node = element;

    if (!(props.dangerouslySetInnerHTML == null)) {
      {
        throw Error( "`dangerouslySetInnerHTML` does not make sense on <textarea>." );
      }
    } // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.  We could add a check in setTextContent
    // to only set the value if/when the value differs from the node value (which would
    // completely solve this IE9 bug), but Sebastian+Sophie seemed to like this
    // solution. The value can be a boolean or object so that's why it's forced
    // to be a string.


    var hostProps = _assign({}, props, {
      value: undefined,
      defaultValue: undefined,
      children: toString(node._wrapperState.initialValue)
    });

    return hostProps;
  }
  function initWrapperState$2(element, props) {
    var node = element;

    {
      ReactControlledValuePropTypes.checkPropTypes('textarea', props);

      if (props.value !== undefined && props.defaultValue !== undefined && !didWarnValDefaultVal) {
        error('%s contains a textarea with both value and defaultValue props. ' + 'Textarea elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled textarea ' + 'and remove one of these props. More info: ' + 'https://fb.me/react-controlled-components', getCurrentFiberOwnerNameInDevOrNull() || 'A component');

        didWarnValDefaultVal = true;
      }
    }

    var initialValue = props.value; // Only bother fetching default value if we're going to use it

    if (initialValue == null) {
      var children = props.children,
          defaultValue = props.defaultValue;

      if (children != null) {
        {
          error('Use the `defaultValue` or `value` props instead of setting ' + 'children on <textarea>.');
        }

        {
          if (!(defaultValue == null)) {
            {
              throw Error( "If you supply `defaultValue` on a <textarea>, do not pass children." );
            }
          }

          if (Array.isArray(children)) {
            if (!(children.length <= 1)) {
              {
                throw Error( "<textarea> can only have at most one child." );
              }
            }

            children = children[0];
          }

          defaultValue = children;
        }
      }

      if (defaultValue == null) {
        defaultValue = '';
      }

      initialValue = defaultValue;
    }

    node._wrapperState = {
      initialValue: getToStringValue(initialValue)
    };
  }
  function updateWrapper$1(element, props) {
    var node = element;
    var value = getToStringValue(props.value);
    var defaultValue = getToStringValue(props.defaultValue);

    if (value != null) {
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      var newValue = toString(value); // To avoid side effects (such as losing text selection), only set value if changed

      if (newValue !== node.value) {
        node.value = newValue;
      }

      if (props.defaultValue == null && node.defaultValue !== newValue) {
        node.defaultValue = newValue;
      }
    }

    if (defaultValue != null) {
      node.defaultValue = toString(defaultValue);
    }
  }
  function postMountWrapper$3(element, props) {
    var node = element; // This is in postMount because we need access to the DOM node, which is not
    // available until after the component has mounted.

    var textContent = node.textContent; // Only set node.value if textContent is equal to the expected
    // initial value. In IE10/IE11 there is a bug where the placeholder attribute
    // will populate textContent as well.
    // https://developer.microsoft.com/microsoft-edge/platform/issues/101525/

    if (textContent === node._wrapperState.initialValue) {
      if (textContent !== '' && textContent !== null) {
        node.value = textContent;
      }
    }
  }
  function restoreControlledState$2(element, props) {
    // DOM component is still mounted; update
    updateWrapper$1(element, props);
  }

  var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
  var MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
  var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  var Namespaces = {
    html: HTML_NAMESPACE,
    mathml: MATH_NAMESPACE,
    svg: SVG_NAMESPACE
  }; // Assumes there is no parent namespace.

  function getIntrinsicNamespace(type) {
    switch (type) {
      case 'svg':
        return SVG_NAMESPACE;

      case 'math':
        return MATH_NAMESPACE;

      default:
        return HTML_NAMESPACE;
    }
  }
  function getChildNamespace(parentNamespace, type) {
    if (parentNamespace == null || parentNamespace === HTML_NAMESPACE) {
      // No (or default) parent namespace: potential entry point.
      return getIntrinsicNamespace(type);
    }

    if (parentNamespace === SVG_NAMESPACE && type === 'foreignObject') {
      // We're leaving SVG.
      return HTML_NAMESPACE;
    } // By default, pass namespace below.


    return parentNamespace;
  }

  /* globals MSApp */

  /**
   * Create a function which has 'unsafe' privileges (required by windows8 apps)
   */
  var createMicrosoftUnsafeLocalFunction = function (func) {
    if (typeof MSApp !== 'undefined' && MSApp.execUnsafeLocalFunction) {
      return function (arg0, arg1, arg2, arg3) {
        MSApp.execUnsafeLocalFunction(function () {
          return func(arg0, arg1, arg2, arg3);
        });
      };
    } else {
      return func;
    }
  };

  var reusableSVGContainer;
  /**
   * Set the innerHTML property of a node
   *
   * @param {DOMElement} node
   * @param {string} html
   * @internal
   */

  var setInnerHTML = createMicrosoftUnsafeLocalFunction(function (node, html) {
    if (node.namespaceURI === Namespaces.svg) {

      if (!('innerHTML' in node)) {
        // IE does not have innerHTML for SVG nodes, so instead we inject the
        // new markup in a temp node and then move the child nodes across into
        // the target node
        reusableSVGContainer = reusableSVGContainer || document.createElement('div');
        reusableSVGContainer.innerHTML = '<svg>' + html.valueOf().toString() + '</svg>';
        var svgNode = reusableSVGContainer.firstChild;

        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }

        while (svgNode.firstChild) {
          node.appendChild(svgNode.firstChild);
        }

        return;
      }
    }

    node.innerHTML = html;
  });

  /**
   * HTML nodeType values that represent the type of the node
   */
  var ELEMENT_NODE = 1;
  var TEXT_NODE = 3;
  var COMMENT_NODE = 8;
  var DOCUMENT_NODE = 9;
  var DOCUMENT_FRAGMENT_NODE = 11;

  /**
   * Set the textContent property of a node. For text updates, it's faster
   * to set the `nodeValue` of the Text node directly instead of using
   * `.textContent` which will remove the existing node and create a new one.
   *
   * @param {DOMElement} node
   * @param {string} text
   * @internal
   */

  var setTextContent = function (node, text) {
    if (text) {
      var firstChild = node.firstChild;

      if (firstChild && firstChild === node.lastChild && firstChild.nodeType === TEXT_NODE) {
        firstChild.nodeValue = text;
        return;
      }
    }

    node.textContent = text;
  };

  // Do not use the below two methods directly!
  // Instead use constants exported from DOMTopLevelEventTypes in ReactDOM.
  // (It is the only module that is allowed to access these methods.)
  function unsafeCastStringToDOMTopLevelType(topLevelType) {
    return topLevelType;
  }
  function unsafeCastDOMTopLevelTypeToString(topLevelType) {
    return topLevelType;
  }

  /**
   * Generate a mapping of standard vendor prefixes using the defined style property and event name.
   *
   * @param {string} styleProp
   * @param {string} eventName
   * @returns {object}
   */

  function makePrefixMap(styleProp, eventName) {
    var prefixes = {};
    prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
    prefixes['Webkit' + styleProp] = 'webkit' + eventName;
    prefixes['Moz' + styleProp] = 'moz' + eventName;
    return prefixes;
  }
  /**
   * A list of event names to a configurable list of vendor prefixes.
   */


  var vendorPrefixes = {
    animationend: makePrefixMap('Animation', 'AnimationEnd'),
    animationiteration: makePrefixMap('Animation', 'AnimationIteration'),
    animationstart: makePrefixMap('Animation', 'AnimationStart'),
    transitionend: makePrefixMap('Transition', 'TransitionEnd')
  };
  /**
   * Event names that have already been detected and prefixed (if applicable).
   */

  var prefixedEventNames = {};
  /**
   * Element to check for prefixes on.
   */

  var style = {};
  /**
   * Bootstrap if a DOM exists.
   */

  if (canUseDOM) {
    style = document.createElement('div').style; // On some platforms, in particular some releases of Android 4.x,
    // the un-prefixed "animation" and "transition" properties are defined on the
    // style object but the events that fire will still be prefixed, so we need
    // to check if the un-prefixed events are usable, and if not remove them from the map.

    if (!('AnimationEvent' in window)) {
      delete vendorPrefixes.animationend.animation;
      delete vendorPrefixes.animationiteration.animation;
      delete vendorPrefixes.animationstart.animation;
    } // Same as above


    if (!('TransitionEvent' in window)) {
      delete vendorPrefixes.transitionend.transition;
    }
  }
  /**
   * Attempts to determine the correct vendor prefixed event name.
   *
   * @param {string} eventName
   * @returns {string}
   */


  function getVendorPrefixedEventName(eventName) {
    if (prefixedEventNames[eventName]) {
      return prefixedEventNames[eventName];
    } else if (!vendorPrefixes[eventName]) {
      return eventName;
    }

    var prefixMap = vendorPrefixes[eventName];

    for (var styleProp in prefixMap) {
      if (prefixMap.hasOwnProperty(styleProp) && styleProp in style) {
        return prefixedEventNames[eventName] = prefixMap[styleProp];
      }
    }

    return eventName;
  }

  /**
   * To identify top level events in ReactDOM, we use constants defined by this
   * module. This is the only module that uses the unsafe* methods to express
   * that the constants actually correspond to the browser event names. This lets
   * us save some bundle size by avoiding a top level type -> event name map.
   * The rest of ReactDOM code should import top level types from this file.
   */

  var TOP_ABORT = unsafeCastStringToDOMTopLevelType('abort');
  var TOP_ANIMATION_END = unsafeCastStringToDOMTopLevelType(getVendorPrefixedEventName('animationend'));
  var TOP_ANIMATION_ITERATION = unsafeCastStringToDOMTopLevelType(getVendorPrefixedEventName('animationiteration'));
  var TOP_ANIMATION_START = unsafeCastStringToDOMTopLevelType(getVendorPrefixedEventName('animationstart'));
  var TOP_BLUR = unsafeCastStringToDOMTopLevelType('blur');
  var TOP_CAN_PLAY = unsafeCastStringToDOMTopLevelType('canplay');
  var TOP_CAN_PLAY_THROUGH = unsafeCastStringToDOMTopLevelType('canplaythrough');
  var TOP_CANCEL = unsafeCastStringToDOMTopLevelType('cancel');
  var TOP_CHANGE = unsafeCastStringToDOMTopLevelType('change');
  var TOP_CLICK = unsafeCastStringToDOMTopLevelType('click');
  var TOP_CLOSE = unsafeCastStringToDOMTopLevelType('close');
  var TOP_COMPOSITION_END = unsafeCastStringToDOMTopLevelType('compositionend');
  var TOP_COMPOSITION_START = unsafeCastStringToDOMTopLevelType('compositionstart');
  var TOP_COMPOSITION_UPDATE = unsafeCastStringToDOMTopLevelType('compositionupdate');
  var TOP_CONTEXT_MENU = unsafeCastStringToDOMTopLevelType('contextmenu');
  var TOP_COPY = unsafeCastStringToDOMTopLevelType('copy');
  var TOP_CUT = unsafeCastStringToDOMTopLevelType('cut');
  var TOP_DOUBLE_CLICK = unsafeCastStringToDOMTopLevelType('dblclick');
  var TOP_AUX_CLICK = unsafeCastStringToDOMTopLevelType('auxclick');
  var TOP_DRAG = unsafeCastStringToDOMTopLevelType('drag');
  var TOP_DRAG_END = unsafeCastStringToDOMTopLevelType('dragend');
  var TOP_DRAG_ENTER = unsafeCastStringToDOMTopLevelType('dragenter');
  var TOP_DRAG_EXIT = unsafeCastStringToDOMTopLevelType('dragexit');
  var TOP_DRAG_LEAVE = unsafeCastStringToDOMTopLevelType('dragleave');
  var TOP_DRAG_OVER = unsafeCastStringToDOMTopLevelType('dragover');
  var TOP_DRAG_START = unsafeCastStringToDOMTopLevelType('dragstart');
  var TOP_DROP = unsafeCastStringToDOMTopLevelType('drop');
  var TOP_DURATION_CHANGE = unsafeCastStringToDOMTopLevelType('durationchange');
  var TOP_EMPTIED = unsafeCastStringToDOMTopLevelType('emptied');
  var TOP_ENCRYPTED = unsafeCastStringToDOMTopLevelType('encrypted');
  var TOP_ENDED = unsafeCastStringToDOMTopLevelType('ended');
  var TOP_ERROR = unsafeCastStringToDOMTopLevelType('error');
  var TOP_FOCUS = unsafeCastStringToDOMTopLevelType('focus');
  var TOP_GOT_POINTER_CAPTURE = unsafeCastStringToDOMTopLevelType('gotpointercapture');
  var TOP_INPUT = unsafeCastStringToDOMTopLevelType('input');
  var TOP_INVALID = unsafeCastStringToDOMTopLevelType('invalid');
  var TOP_KEY_DOWN = unsafeCastStringToDOMTopLevelType('keydown');
  var TOP_KEY_PRESS = unsafeCastStringToDOMTopLevelType('keypress');
  var TOP_KEY_UP = unsafeCastStringToDOMTopLevelType('keyup');
  var TOP_LOAD = unsafeCastStringToDOMTopLevelType('load');
  var TOP_LOAD_START = unsafeCastStringToDOMTopLevelType('loadstart');
  var TOP_LOADED_DATA = unsafeCastStringToDOMTopLevelType('loadeddata');
  var TOP_LOADED_METADATA = unsafeCastStringToDOMTopLevelType('loadedmetadata');
  var TOP_LOST_POINTER_CAPTURE = unsafeCastStringToDOMTopLevelType('lostpointercapture');
  var TOP_MOUSE_DOWN = unsafeCastStringToDOMTopLevelType('mousedown');
  var TOP_MOUSE_MOVE = unsafeCastStringToDOMTopLevelType('mousemove');
  var TOP_MOUSE_OUT = unsafeCastStringToDOMTopLevelType('mouseout');
  var TOP_MOUSE_OVER = unsafeCastStringToDOMTopLevelType('mouseover');
  var TOP_MOUSE_UP = unsafeCastStringToDOMTopLevelType('mouseup');
  var TOP_PASTE = unsafeCastStringToDOMTopLevelType('paste');
  var TOP_PAUSE = unsafeCastStringToDOMTopLevelType('pause');
  var TOP_PLAY = unsafeCastStringToDOMTopLevelType('play');
  var TOP_PLAYING = unsafeCastStringToDOMTopLevelType('playing');
  var TOP_POINTER_CANCEL = unsafeCastStringToDOMTopLevelType('pointercancel');
  var TOP_POINTER_DOWN = unsafeCastStringToDOMTopLevelType('pointerdown');
  var TOP_POINTER_MOVE = unsafeCastStringToDOMTopLevelType('pointermove');
  var TOP_POINTER_OUT = unsafeCastStringToDOMTopLevelType('pointerout');
  var TOP_POINTER_OVER = unsafeCastStringToDOMTopLevelType('pointerover');
  var TOP_POINTER_UP = unsafeCastStringToDOMTopLevelType('pointerup');
  var TOP_PROGRESS = unsafeCastStringToDOMTopLevelType('progress');
  var TOP_RATE_CHANGE = unsafeCastStringToDOMTopLevelType('ratechange');
  var TOP_RESET = unsafeCastStringToDOMTopLevelType('reset');
  var TOP_SCROLL = unsafeCastStringToDOMTopLevelType('scroll');
  var TOP_SEEKED = unsafeCastStringToDOMTopLevelType('seeked');
  var TOP_SEEKING = unsafeCastStringToDOMTopLevelType('seeking');
  var TOP_SELECTION_CHANGE = unsafeCastStringToDOMTopLevelType('selectionchange');
  var TOP_STALLED = unsafeCastStringToDOMTopLevelType('stalled');
  var TOP_SUBMIT = unsafeCastStringToDOMTopLevelType('submit');
  var TOP_SUSPEND = unsafeCastStringToDOMTopLevelType('suspend');
  var TOP_TEXT_INPUT = unsafeCastStringToDOMTopLevelType('textInput');
  var TOP_TIME_UPDATE = unsafeCastStringToDOMTopLevelType('timeupdate');
  var TOP_TOGGLE = unsafeCastStringToDOMTopLevelType('toggle');
  var TOP_TOUCH_CANCEL = unsafeCastStringToDOMTopLevelType('touchcancel');
  var TOP_TOUCH_END = unsafeCastStringToDOMTopLevelType('touchend');
  var TOP_TOUCH_MOVE = unsafeCastStringToDOMTopLevelType('touchmove');
  var TOP_TOUCH_START = unsafeCastStringToDOMTopLevelType('touchstart');
  var TOP_TRANSITION_END = unsafeCastStringToDOMTopLevelType(getVendorPrefixedEventName('transitionend'));
  var TOP_VOLUME_CHANGE = unsafeCastStringToDOMTopLevelType('volumechange');
  var TOP_WAITING = unsafeCastStringToDOMTopLevelType('waiting');
  var TOP_WHEEL = unsafeCastStringToDOMTopLevelType('wheel'); // List of events that need to be individually attached to media elements.
  // Note that events in this list will *not* be listened to at the top level
  // unless they're explicitly whitelisted in `ReactBrowserEventEmitter.listenTo`.

  var mediaEventTypes = [TOP_ABORT, TOP_CAN_PLAY, TOP_CAN_PLAY_THROUGH, TOP_DURATION_CHANGE, TOP_EMPTIED, TOP_ENCRYPTED, TOP_ENDED, TOP_ERROR, TOP_LOADED_DATA, TOP_LOADED_METADATA, TOP_LOAD_START, TOP_PAUSE, TOP_PLAY, TOP_PLAYING, TOP_PROGRESS, TOP_RATE_CHANGE, TOP_SEEKED, TOP_SEEKING, TOP_STALLED, TOP_SUSPEND, TOP_TIME_UPDATE, TOP_VOLUME_CHANGE, TOP_WAITING];
  function getRawEventName(topLevelType) {
    return unsafeCastDOMTopLevelTypeToString(topLevelType);
  }

  var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map; // prettier-ignore

  var elementListenerMap = new PossiblyWeakMap();
  function getListenerMapForElement(element) {
    var listenerMap = elementListenerMap.get(element);

    if (listenerMap === undefined) {
      listenerMap = new Map();
      elementListenerMap.set(element, listenerMap);
    }

    return listenerMap;
  }

  /**
   * `ReactInstanceMap` maintains a mapping from a public facing stateful
   * instance (key) and the internal representation (value). This allows public
   * methods to accept the user facing instance as an argument and map them back
   * to internal methods.
   *
   * Note that this module is currently shared and assumed to be stateless.
   * If this becomes an actual Map, that will break.
   */
  function get(key) {
    return key._reactInternalFiber;
  }
  function has$1(key) {
    return key._reactInternalFiber !== undefined;
  }
  function set(key, value) {
    key._reactInternalFiber = value;
  }

  // Don't change these two values. They're used by React Dev Tools.
  var NoEffect =
  /*              */
  0;
  var PerformedWork =
  /*         */
  1; // You can change the rest (and add more).

  var Placement =
  /*             */
  2;
  var Update =
  /*                */
  4;
  var PlacementAndUpdate =
  /*    */
  6;
  var Deletion =
  /*              */
  8;
  var ContentReset =
  /*          */
  16;
  var Callback =
  /*              */
  32;
  var DidCapture =
  /*            */
  64;
  var Ref =
  /*                   */
  128;
  var Snapshot =
  /*              */
  256;
  var Passive =
  /*               */
  512;
  var Hydrating =
  /*             */
  1024;
  var HydratingAndUpdate =
  /*    */
  1028; // Passive & Update & Callback & Ref & Snapshot

  var LifecycleEffectMask =
  /*   */
  932; // Union of all host effects

  var HostEffectMask =
  /*        */
  2047;
  var Incomplete =
  /*            */
  2048;
  var ShouldCapture =
  /*         */
  4096;

  var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
  function getNearestMountedFiber(fiber) {
    var node = fiber;
    var nearestMounted = fiber;

    if (!fiber.alternate) {
      // If there is no alternate, this might be a new tree that isn't inserted
      // yet. If it is, then it will have a pending insertion effect on it.
      var nextNode = node;

      do {
        node = nextNode;

        if ((node.effectTag & (Placement | Hydrating)) !== NoEffect) {
          // This is an insertion or in-progress hydration. The nearest possible
          // mounted fiber is the parent but we need to continue to figure out
          // if that one is still mounted.
          nearestMounted = node.return;
        }

        nextNode = node.return;
      } while (nextNode);
    } else {
      while (node.return) {
        node = node.return;
      }
    }

    if (node.tag === HostRoot) {
      // TODO: Check if this was a nested HostRoot when used with
      // renderContainerIntoSubtree.
      return nearestMounted;
    } // If we didn't hit the root, that means that we're in an disconnected tree
    // that has been unmounted.


    return null;
  }
  function getSuspenseInstanceFromFiber(fiber) {
    if (fiber.tag === SuspenseComponent) {
      var suspenseState = fiber.memoizedState;

      if (suspenseState === null) {
        var current = fiber.alternate;

        if (current !== null) {
          suspenseState = current.memoizedState;
        }
      }

      if (suspenseState !== null) {
        return suspenseState.dehydrated;
      }
    }

    return null;
  }
  function getContainerFromFiber(fiber) {
    return fiber.tag === HostRoot ? fiber.stateNode.containerInfo : null;
  }
  function isFiberMounted(fiber) {
    return getNearestMountedFiber(fiber) === fiber;
  }
  function isMounted(component) {
    {
      var owner = ReactCurrentOwner.current;

      if (owner !== null && owner.tag === ClassComponent) {
        var ownerFiber = owner;
        var instance = ownerFiber.stateNode;

        if (!instance._warnedAboutRefsInRender) {
          error('%s is accessing isMounted inside its render() function. ' + 'render() should be a pure function of props and state. It should ' + 'never access something that requires stale data from the previous ' + 'render, such as refs. Move this logic to componentDidMount and ' + 'componentDidUpdate instead.', getComponentName(ownerFiber.type) || 'A component');
        }

        instance._warnedAboutRefsInRender = true;
      }
    }

    var fiber = get(component);

    if (!fiber) {
      return false;
    }

    return getNearestMountedFiber(fiber) === fiber;
  }

  function assertIsMounted(fiber) {
    if (!(getNearestMountedFiber(fiber) === fiber)) {
      {
        throw Error( "Unable to find node on an unmounted component." );
      }
    }
  }

  function findCurrentFiberUsingSlowPath(fiber) {
    var alternate = fiber.alternate;

    if (!alternate) {
      // If there is no alternate, then we only need to check if it is mounted.
      var nearestMounted = getNearestMountedFiber(fiber);

      if (!(nearestMounted !== null)) {
        {
          throw Error( "Unable to find node on an unmounted component." );
        }
      }

      if (nearestMounted !== fiber) {
        return null;
      }

      return fiber;
    } // If we have two possible branches, we'll walk backwards up to the root
    // to see what path the root points to. On the way we may hit one of the
    // special cases and we'll deal with them.


    var a = fiber;
    var b = alternate;

    while (true) {
      var parentA = a.return;

      if (parentA === null) {
        // We're at the root.
        break;
      }

      var parentB = parentA.alternate;

      if (parentB === null) {
        // There is no alternate. This is an unusual case. Currently, it only
        // happens when a Suspense component is hidden. An extra fragment fiber
        // is inserted in between the Suspense fiber and its children. Skip
        // over this extra fragment fiber and proceed to the next parent.
        var nextParent = parentA.return;

        if (nextParent !== null) {
          a = b = nextParent;
          continue;
        } // If there's no parent, we're at the root.


        break;
      } // If both copies of the parent fiber point to the same child, we can
      // assume that the child is current. This happens when we bailout on low
      // priority: the bailed out fiber's child reuses the current child.


      if (parentA.child === parentB.child) {
        var child = parentA.child;

        while (child) {
          if (child === a) {
            // We've determined that A is the current branch.
            assertIsMounted(parentA);
            return fiber;
          }

          if (child === b) {
            // We've determined that B is the current branch.
            assertIsMounted(parentA);
            return alternate;
          }

          child = child.sibling;
        } // We should never have an alternate for any mounting node. So the only
        // way this could possibly happen is if this was unmounted, if at all.


        {
          {
            throw Error( "Unable to find node on an unmounted component." );
          }
        }
      }

      if (a.return !== b.return) {
        // The return pointer of A and the return pointer of B point to different
        // fibers. We assume that return pointers never criss-cross, so A must
        // belong to the child set of A.return, and B must belong to the child
        // set of B.return.
        a = parentA;
        b = parentB;
      } else {
        // The return pointers point to the same fiber. We'll have to use the
        // default, slow path: scan the child sets of each parent alternate to see
        // which child belongs to which set.
        //
        // Search parent A's child set
        var didFindChild = false;
        var _child = parentA.child;

        while (_child) {
          if (_child === a) {
            didFindChild = true;
            a = parentA;
            b = parentB;
            break;
          }

          if (_child === b) {
            didFindChild = true;
            b = parentA;
            a = parentB;
            break;
          }

          _child = _child.sibling;
        }

        if (!didFindChild) {
          // Search parent B's child set
          _child = parentB.child;

          while (_child) {
            if (_child === a) {
              didFindChild = true;
              a = parentB;
              b = parentA;
              break;
            }

            if (_child === b) {
              didFindChild = true;
              b = parentB;
              a = parentA;
              break;
            }

            _child = _child.sibling;
          }

          if (!didFindChild) {
            {
              throw Error( "Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue." );
            }
          }
        }
      }

      if (!(a.alternate === b)) {
        {
          throw Error( "Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue." );
        }
      }
    } // If the root is not a host container, we're in a disconnected tree. I.e.
    // unmounted.


    if (!(a.tag === HostRoot)) {
      {
        throw Error( "Unable to find node on an unmounted component." );
      }
    }

    if (a.stateNode.current === a) {
      // We've determined that A is the current branch.
      return fiber;
    } // Otherwise B has to be current branch.


    return alternate;
  }
  function findCurrentHostFiber(parent) {
    var currentParent = findCurrentFiberUsingSlowPath(parent);

    if (!currentParent) {
      return null;
    } // Next we'll drill down this component to find the first HostComponent/Text.


    var node = currentParent;

    while (true) {
      if (node.tag === HostComponent || node.tag === HostText) {
        return node;
      } else if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }

      if (node === currentParent) {
        return null;
      }

      while (!node.sibling) {
        if (!node.return || node.return === currentParent) {
          return null;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    } // Flow needs the return null here, but ESLint complains about it.
    // eslint-disable-next-line no-unreachable


    return null;
  }
  function findCurrentHostFiberWithNoPortals(parent) {
    var currentParent = findCurrentFiberUsingSlowPath(parent);

    if (!currentParent) {
      return null;
    } // Next we'll drill down this component to find the first HostComponent/Text.


    var node = currentParent;

    while (true) {
      if (node.tag === HostComponent || node.tag === HostText || enableFundamentalAPI ) {
        return node;
      } else if (node.child && node.tag !== HostPortal) {
        node.child.return = node;
        node = node.child;
        continue;
      }

      if (node === currentParent) {
        return null;
      }

      while (!node.sibling) {
        if (!node.return || node.return === currentParent) {
          return null;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    } // Flow needs the return null here, but ESLint complains about it.
    // eslint-disable-next-line no-unreachable


    return null;
  }

  /**
   * Accumulates items that must not be null or undefined into the first one. This
   * is used to conserve memory by avoiding array allocations, and thus sacrifices
   * API cleanness. Since `current` can be null before being passed in and not
   * null after this function, make sure to assign it back to `current`:
   *
   * `a = accumulateInto(a, b);`
   *
   * This API should be sparingly used. Try `accumulate` for something cleaner.
   *
   * @return {*|array<*>} An accumulation of items.
   */

  function accumulateInto(current, next) {
    if (!(next != null)) {
      {
        throw Error( "accumulateInto(...): Accumulated items must not be null or undefined." );
      }
    }

    if (current == null) {
      return next;
    } // Both are not empty. Warning: Never call x.concat(y) when you are not
    // certain that x is an Array (x could be a string with concat method).


    if (Array.isArray(current)) {
      if (Array.isArray(next)) {
        current.push.apply(current, next);
        return current;
      }

      current.push(next);
      return current;
    }

    if (Array.isArray(next)) {
      // A bit too dangerous to mutate `next`.
      return [current].concat(next);
    }

    return [current, next];
  }

  /**
   * @param {array} arr an "accumulation" of items which is either an Array or
   * a single item. Useful when paired with the `accumulate` module. This is a
   * simple utility that allows us to reason about a collection of items, but
   * handling the case when there is exactly one item (and we do not need to
   * allocate an array).
   * @param {function} cb Callback invoked with each element or a collection.
   * @param {?} [scope] Scope used as `this` in a callback.
   */
  function forEachAccumulated(arr, cb, scope) {
    if (Array.isArray(arr)) {
      arr.forEach(cb, scope);
    } else if (arr) {
      cb.call(scope, arr);
    }
  }

  /**
   * Internal queue of events that have accumulated their dispatches and are
   * waiting to have their dispatches executed.
   */

  var eventQueue = null;
  /**
   * Dispatches an event and releases it back into the pool, unless persistent.
   *
   * @param {?object} event Synthetic event to be dispatched.
   * @private
   */

  var executeDispatchesAndRelease = function (event) {
    if (event) {
      executeDispatchesInOrder(event);

      if (!event.isPersistent()) {
        event.constructor.release(event);
      }
    }
  };

  var executeDispatchesAndReleaseTopLevel = function (e) {
    return executeDispatchesAndRelease(e);
  };

  function runEventsInBatch(events) {
    if (events !== null) {
      eventQueue = accumulateInto(eventQueue, events);
    } // Set `eventQueue` to null before processing it so that we can tell if more
    // events get enqueued while processing.


    var processingEventQueue = eventQueue;
    eventQueue = null;

    if (!processingEventQueue) {
      return;
    }

    forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel);

    if (!!eventQueue) {
      {
        throw Error( "processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented." );
      }
    } // This would be a good time to rethrow if any of the event handlers threw.


    rethrowCaughtError();
  }

  /**
   * Gets the target node from a native browser event by accounting for
   * inconsistencies in browser DOM APIs.
   *
   * @param {object} nativeEvent Native browser event.
   * @return {DOMEventTarget} Target node.
   */

  function getEventTarget(nativeEvent) {
    // Fallback to nativeEvent.srcElement for IE9
    // https://github.com/facebook/react/issues/12506
    var target = nativeEvent.target || nativeEvent.srcElement || window; // Normalize SVG <use> element events #4963

    if (target.correspondingUseElement) {
      target = target.correspondingUseElement;
    } // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
    // @see http://www.quirksmode.org/js/events_properties.html


    return target.nodeType === TEXT_NODE ? target.parentNode : target;
  }

  /**
   * Checks if an event is supported in the current execution environment.
   *
   * NOTE: This will not work correctly for non-generic events such as `change`,
   * `reset`, `load`, `error`, and `select`.
   *
   * Borrows from Modernizr.
   *
   * @param {string} eventNameSuffix Event name, e.g. "click".
   * @return {boolean} True if the event is supported.
   * @internal
   * @license Modernizr 3.0.0pre (Custom Build) | MIT
   */

  function isEventSupported(eventNameSuffix) {
    if (!canUseDOM) {
      return false;
    }

    var eventName = 'on' + eventNameSuffix;
    var isSupported = eventName in document;

    if (!isSupported) {
      var element = document.createElement('div');
      element.setAttribute(eventName, 'return;');
      isSupported = typeof element[eventName] === 'function';
    }

    return isSupported;
  }

  /**
   * Summary of `DOMEventPluginSystem` event handling:
   *
   *  - Top-level delegation is used to trap most native browser events. This
   *    may only occur in the main thread and is the responsibility of
   *    ReactDOMEventListener, which is injected and can therefore support
   *    pluggable event sources. This is the only work that occurs in the main
   *    thread.
   *
   *  - We normalize and de-duplicate events to account for browser quirks. This
   *    may be done in the worker thread.
   *
   *  - Forward these native events (with the associated top-level type used to
   *    trap it) to `EventPluginRegistry`, which in turn will ask plugins if they want
   *    to extract any synthetic events.
   *
   *  - The `EventPluginRegistry` will then process each event by annotating them with
   *    "dispatches", a sequence of listeners and IDs that care about that event.
   *
   *  - The `EventPluginRegistry` then dispatches the events.
   *
   * Overview of React and the event system:
   *
   * +------------+    .
   * |    DOM     |    .
   * +------------+    .
   *       |           .
   *       v           .
   * +------------+    .
   * | ReactEvent |    .
   * |  Listener  |    .
   * +------------+    .                         +-----------+
   *       |           .               +--------+|SimpleEvent|
   *       |           .               |         |Plugin     |
   * +-----|------+    .               v         +-----------+
   * |     |      |    .    +--------------+                    +------------+
   * |     +-----------.--->|PluginRegistry|                    |    Event   |
   * |            |    .    |              |     +-----------+  | Propagators|
   * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
   * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
   * |            |    .    |              |     +-----------+  |  utilities |
   * |     +-----------.--->|              |                    +------------+
   * |     |      |    .    +--------------+
   * +-----|------+    .                ^        +-----------+
   *       |           .                |        |Enter/Leave|
   *       +           .                +-------+|Plugin     |
   * +-------------+   .                         +-----------+
   * | application |   .
   * |-------------|   .
   * |             |   .
   * |             |   .
   * +-------------+   .
   *                   .
   *    React Core     .  General Purpose Event Plugin System
   */

  var CALLBACK_BOOKKEEPING_POOL_SIZE = 10;
  var callbackBookkeepingPool = [];

  function releaseTopLevelCallbackBookKeeping(instance) {
    instance.topLevelType = null;
    instance.nativeEvent = null;
    instance.targetInst = null;
    instance.ancestors.length = 0;

    if (callbackBookkeepingPool.length < CALLBACK_BOOKKEEPING_POOL_SIZE) {
      callbackBookkeepingPool.push(instance);
    }
  } // Used to store ancestor hierarchy in top level callback


  function getTopLevelCallbackBookKeeping(topLevelType, nativeEvent, targetInst, eventSystemFlags) {
    if (callbackBookkeepingPool.length) {
      var instance = callbackBookkeepingPool.pop();
      instance.topLevelType = topLevelType;
      instance.eventSystemFlags = eventSystemFlags;
      instance.nativeEvent = nativeEvent;
      instance.targetInst = targetInst;
      return instance;
    }

    return {
      topLevelType: topLevelType,
      eventSystemFlags: eventSystemFlags,
      nativeEvent: nativeEvent,
      targetInst: targetInst,
      ancestors: []
    };
  }
  /**
   * Find the deepest React component completely containing the root of the
   * passed-in instance (for use when entire React trees are nested within each
   * other). If React trees are not nested, returns null.
   */


  function findRootContainerNode(inst) {
    if (inst.tag === HostRoot) {
      return inst.stateNode.containerInfo;
    } // TODO: It may be a good idea to cache this to prevent unnecessary DOM
    // traversal, but caching is difficult to do correctly without using a
    // mutation observer to listen for all DOM changes.


    while (inst.return) {
      inst = inst.return;
    }

    if (inst.tag !== HostRoot) {
      // This can happen if we're in a detached tree.
      return null;
    }

    return inst.stateNode.containerInfo;
  }
  /**
   * Allows registered plugins an opportunity to extract events from top-level
   * native browser events.
   *
   * @return {*} An accumulation of synthetic events.
   * @internal
   */


  function extractPluginEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) {
    var events = null;

    for (var i = 0; i < plugins.length; i++) {
      // Not every plugin in the ordering may be loaded at runtime.
      var possiblePlugin = plugins[i];

      if (possiblePlugin) {
        var extractedEvents = possiblePlugin.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags);

        if (extractedEvents) {
          events = accumulateInto(events, extractedEvents);
        }
      }
    }

    return events;
  }

  function runExtractedPluginEventsInBatch(topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) {
    var events = extractPluginEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags);
    runEventsInBatch(events);
  }

  function handleTopLevel(bookKeeping) {
    var targetInst = bookKeeping.targetInst; // Loop through the hierarchy, in case there's any nested components.
    // It's important that we build the array of ancestors before calling any
    // event handlers, because event handlers can modify the DOM, leading to
    // inconsistencies with ReactMount's node cache. See #1105.

    var ancestor = targetInst;

    do {
      if (!ancestor) {
        var ancestors = bookKeeping.ancestors;
        ancestors.push(ancestor);
        break;
      }

      var root = findRootContainerNode(ancestor);

      if (!root) {
        break;
      }

      var tag = ancestor.tag;

      if (tag === HostComponent || tag === HostText) {
        bookKeeping.ancestors.push(ancestor);
      }

      ancestor = getClosestInstanceFromNode(root);
    } while (ancestor);

    for (var i = 0; i < bookKeeping.ancestors.length; i++) {
      targetInst = bookKeeping.ancestors[i];
      var eventTarget = getEventTarget(bookKeeping.nativeEvent);
      var topLevelType = bookKeeping.topLevelType;
      var nativeEvent = bookKeeping.nativeEvent;
      var eventSystemFlags = bookKeeping.eventSystemFlags; // If this is the first ancestor, we mark it on the system flags

      if (i === 0) {
        eventSystemFlags |= IS_FIRST_ANCESTOR;
      }

      runExtractedPluginEventsInBatch(topLevelType, targetInst, nativeEvent, eventTarget, eventSystemFlags);
    }
  }

  function dispatchEventForLegacyPluginEventSystem(topLevelType, eventSystemFlags, nativeEvent, targetInst) {
    var bookKeeping = getTopLevelCallbackBookKeeping(topLevelType, nativeEvent, targetInst, eventSystemFlags);

    try {
      // Event queue being processed in the same cycle allows
      // `preventDefault`.
      batchedEventUpdates(handleTopLevel, bookKeeping);
    } finally {
      releaseTopLevelCallbackBookKeeping(bookKeeping);
    }
  }
  /**
   * We listen for bubbled touch events on the document object.
   *
   * Firefox v8.01 (and possibly others) exhibited strange behavior when
   * mounting `onmousemove` events at some node that was not the document
   * element. The symptoms were that if your mouse is not moving over something
   * contained within that mount point (for example on the background) the
   * top-level listeners for `onmousemove` won't be called. However, if you
   * register the `mousemove` on the document object, then it will of course
   * catch all `mousemove`s. This along with iOS quirks, justifies restricting
   * top-level listeners to the document object only, at least for these
   * movement types of events and possibly all events.
   *
   * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
   *
   * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
   * they bubble to document.
   *
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {object} mountAt Container where to mount the listener
   */

  function legacyListenToEvent(registrationName, mountAt) {
    var listenerMap = getListenerMapForElement(mountAt);
    var dependencies = registrationNameDependencies[registrationName];

    for (var i = 0; i < dependencies.length; i++) {
      var dependency = dependencies[i];
      legacyListenToTopLevelEvent(dependency, mountAt, listenerMap);
    }
  }
  function legacyListenToTopLevelEvent(topLevelType, mountAt, listenerMap) {
    if (!listenerMap.has(topLevelType)) {
      switch (topLevelType) {
        case TOP_SCROLL:
          trapCapturedEvent(TOP_SCROLL, mountAt);
          break;

        case TOP_FOCUS:
        case TOP_BLUR:
          trapCapturedEvent(TOP_FOCUS, mountAt);
          trapCapturedEvent(TOP_BLUR, mountAt); // We set the flag for a single dependency later in this function,
          // but this ensures we mark both as attached rather than just one.

          listenerMap.set(TOP_BLUR, null);
          listenerMap.set(TOP_FOCUS, null);
          break;

        case TOP_CANCEL:
        case TOP_CLOSE:
          if (isEventSupported(getRawEventName(topLevelType))) {
            trapCapturedEvent(topLevelType, mountAt);
          }

          break;

        case TOP_INVALID:
        case TOP_SUBMIT:
        case TOP_RESET:
          // We listen to them on the target DOM elements.
          // Some of them bubble so we don't want them to fire twice.
          break;

        default:
          // By default, listen on the top level to all non-media events.
          // Media events don't bubble so adding the listener wouldn't do anything.
          var isMediaEvent = mediaEventTypes.indexOf(topLevelType) !== -1;

          if (!isMediaEvent) {
            trapBubbledEvent(topLevelType, mountAt);
          }

          break;
      }

      listenerMap.set(topLevelType, null);
    }
  }
  function isListeningToAllDependencies(registrationName, mountAt) {
    var listenerMap = getListenerMapForElement(mountAt);
    var dependencies = registrationNameDependencies[registrationName];

    for (var i = 0; i < dependencies.length; i++) {
      var dependency = dependencies[i];

      if (!listenerMap.has(dependency)) {
        return false;
      }
    }

    return true;
  }

  var attemptUserBlockingHydration;
  function setAttemptUserBlockingHydration(fn) {
    attemptUserBlockingHydration = fn;
  }
  var attemptContinuousHydration;
  function setAttemptContinuousHydration(fn) {
    attemptContinuousHydration = fn;
  }
  var attemptHydrationAtCurrentPriority;
  function setAttemptHydrationAtCurrentPriority(fn) {
    attemptHydrationAtCurrentPriority = fn;
  } // TODO: Upgrade this definition once we're on a newer version of Flow that
  var hasScheduledReplayAttempt = false; // The queue of discrete events to be replayed.

  var queuedDiscreteEvents = []; // Indicates if any continuous event targets are non-null for early bailout.
  // if the last target was dehydrated.

  var queuedFocus = null;
  var queuedDrag = null;
  var queuedMouse = null; // For pointer events there can be one latest event per pointerId.

  var queuedPointers = new Map();
  var queuedPointerCaptures = new Map(); // We could consider replaying selectionchange and touchmoves too.

  var queuedExplicitHydrationTargets = [];
  function hasQueuedDiscreteEvents() {
    return queuedDiscreteEvents.length > 0;
  }
  var discreteReplayableEvents = [TOP_MOUSE_DOWN, TOP_MOUSE_UP, TOP_TOUCH_CANCEL, TOP_TOUCH_END, TOP_TOUCH_START, TOP_AUX_CLICK, TOP_DOUBLE_CLICK, TOP_POINTER_CANCEL, TOP_POINTER_DOWN, TOP_POINTER_UP, TOP_DRAG_END, TOP_DRAG_START, TOP_DROP, TOP_COMPOSITION_END, TOP_COMPOSITION_START, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_INPUT, TOP_TEXT_INPUT, TOP_CLOSE, TOP_CANCEL, TOP_COPY, TOP_CUT, TOP_PASTE, TOP_CLICK, TOP_CHANGE, TOP_CONTEXT_MENU, TOP_RESET, TOP_SUBMIT];
  var continuousReplayableEvents = [TOP_FOCUS, TOP_BLUR, TOP_DRAG_ENTER, TOP_DRAG_LEAVE, TOP_MOUSE_OVER, TOP_MOUSE_OUT, TOP_POINTER_OVER, TOP_POINTER_OUT, TOP_GOT_POINTER_CAPTURE, TOP_LOST_POINTER_CAPTURE];
  function isReplayableDiscreteEvent(eventType) {
    return discreteReplayableEvents.indexOf(eventType) > -1;
  }

  function trapReplayableEventForDocument(topLevelType, document, listenerMap) {
    legacyListenToTopLevelEvent(topLevelType, document, listenerMap);
  }

  function eagerlyTrapReplayableEvents(container, document) {
    var listenerMapForDoc = getListenerMapForElement(document); // Discrete

    discreteReplayableEvents.forEach(function (topLevelType) {
      trapReplayableEventForDocument(topLevelType, document, listenerMapForDoc);
    }); // Continuous

    continuousReplayableEvents.forEach(function (topLevelType) {
      trapReplayableEventForDocument(topLevelType, document, listenerMapForDoc);
    });
  }

  function createQueuedReplayableEvent(blockedOn, topLevelType, eventSystemFlags, container, nativeEvent) {
    return {
      blockedOn: blockedOn,
      topLevelType: topLevelType,
      eventSystemFlags: eventSystemFlags | IS_REPLAYED,
      nativeEvent: nativeEvent,
      container: container
    };
  }

  function queueDiscreteEvent(blockedOn, topLevelType, eventSystemFlags, container, nativeEvent) {
    var queuedEvent = createQueuedReplayableEvent(blockedOn, topLevelType, eventSystemFlags, container, nativeEvent);
    queuedDiscreteEvents.push(queuedEvent);
  } // Resets the replaying for this type of continuous event to no event.

  function clearIfContinuousEvent(topLevelType, nativeEvent) {
    switch (topLevelType) {
      case TOP_FOCUS:
      case TOP_BLUR:
        queuedFocus = null;
        break;

      case TOP_DRAG_ENTER:
      case TOP_DRAG_LEAVE:
        queuedDrag = null;
        break;

      case TOP_MOUSE_OVER:
      case TOP_MOUSE_OUT:
        queuedMouse = null;
        break;

      case TOP_POINTER_OVER:
      case TOP_POINTER_OUT:
        {
          var pointerId = nativeEvent.pointerId;
          queuedPointers.delete(pointerId);
          break;
        }

      case TOP_GOT_POINTER_CAPTURE:
      case TOP_LOST_POINTER_CAPTURE:
        {
          var _pointerId = nativeEvent.pointerId;
          queuedPointerCaptures.delete(_pointerId);
          break;
        }
    }
  }

  function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, topLevelType, eventSystemFlags, container, nativeEvent) {
    if (existingQueuedEvent === null || existingQueuedEvent.nativeEvent !== nativeEvent) {
      var queuedEvent = createQueuedReplayableEvent(blockedOn, topLevelType, eventSystemFlags, container, nativeEvent);

      if (blockedOn !== null) {
        var _fiber2 = getInstanceFromNode$1(blockedOn);

        if (_fiber2 !== null) {
          // Attempt to increase the priority of this target.
          attemptContinuousHydration(_fiber2);
        }
      }

      return queuedEvent;
    } // If we have already queued this exact event, then it's because
    // the different event systems have different DOM event listeners.
    // We can accumulate the flags and store a single event to be
    // replayed.


    existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
    return existingQueuedEvent;
  }

  function queueIfContinuousEvent(blockedOn, topLevelType, eventSystemFlags, container, nativeEvent) {
    // These set relatedTarget to null because the replayed event will be treated as if we
    // moved from outside the window (no target) onto the target once it hydrates.
    // Instead of mutating we could clone the event.
    switch (topLevelType) {
      case TOP_FOCUS:
        {
          var focusEvent = nativeEvent;
          queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(queuedFocus, blockedOn, topLevelType, eventSystemFlags, container, focusEvent);
          return true;
        }

      case TOP_DRAG_ENTER:
        {
          var dragEvent = nativeEvent;
          queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(queuedDrag, blockedOn, topLevelType, eventSystemFlags, container, dragEvent);
          return true;
        }

      case TOP_MOUSE_OVER:
        {
          var mouseEvent = nativeEvent;
          queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(queuedMouse, blockedOn, topLevelType, eventSystemFlags, container, mouseEvent);
          return true;
        }

      case TOP_POINTER_OVER:
        {
          var pointerEvent = nativeEvent;
          var pointerId = pointerEvent.pointerId;
          queuedPointers.set(pointerId, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointers.get(pointerId) || null, blockedOn, topLevelType, eventSystemFlags, container, pointerEvent));
          return true;
        }

      case TOP_GOT_POINTER_CAPTURE:
        {
          var _pointerEvent = nativeEvent;
          var _pointerId2 = _pointerEvent.pointerId;
          queuedPointerCaptures.set(_pointerId2, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointerCaptures.get(_pointerId2) || null, blockedOn, topLevelType, eventSystemFlags, container, _pointerEvent));
          return true;
        }
    }

    return false;
  } // Check if this target is unblocked. Returns true if it's unblocked.

  function attemptExplicitHydrationTarget(queuedTarget) {
    // TODO: This function shares a lot of logic with attemptToDispatchEvent.
    // Try to unify them. It's a bit tricky since it would require two return
    // values.
    var targetInst = getClosestInstanceFromNode(queuedTarget.target);

    if (targetInst !== null) {
      var nearestMounted = getNearestMountedFiber(targetInst);

      if (nearestMounted !== null) {
        var tag = nearestMounted.tag;

        if (tag === SuspenseComponent) {
          var instance = getSuspenseInstanceFromFiber(nearestMounted);

          if (instance !== null) {
            // We're blocked on hydrating this boundary.
            // Increase its priority.
            queuedTarget.blockedOn = instance;
            unstable_runWithPriority(queuedTarget.priority, function () {
              attemptHydrationAtCurrentPriority(nearestMounted);
            });
            return;
          }
        } else if (tag === HostRoot) {
          var root = nearestMounted.stateNode;

          if (root.hydrate) {
            queuedTarget.blockedOn = getContainerFromFiber(nearestMounted); // We don't currently have a way to increase the priority of
            // a root other than sync.

            return;
          }
        }
      }
    }

    queuedTarget.blockedOn = null;
  }

  function attemptReplayContinuousQueuedEvent(queuedEvent) {
    if (queuedEvent.blockedOn !== null) {
      return false;
    }

    var nextBlockedOn = attemptToDispatchEvent(queuedEvent.topLevelType, queuedEvent.eventSystemFlags, queuedEvent.container, queuedEvent.nativeEvent);

    if (nextBlockedOn !== null) {
      // We're still blocked. Try again later.
      var _fiber3 = getInstanceFromNode$1(nextBlockedOn);

      if (_fiber3 !== null) {
        attemptContinuousHydration(_fiber3);
      }

      queuedEvent.blockedOn = nextBlockedOn;
      return false;
    }

    return true;
  }

  function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
    if (attemptReplayContinuousQueuedEvent(queuedEvent)) {
      map.delete(key);
    }
  }

  function replayUnblockedEvents() {
    hasScheduledReplayAttempt = false; // First replay discrete events.

    while (queuedDiscreteEvents.length > 0) {
      var nextDiscreteEvent = queuedDiscreteEvents[0];

      if (nextDiscreteEvent.blockedOn !== null) {
        // We're still blocked.
        // Increase the priority of this boundary to unblock
        // the next discrete event.
        var _fiber4 = getInstanceFromNode$1(nextDiscreteEvent.blockedOn);

        if (_fiber4 !== null) {
          attemptUserBlockingHydration(_fiber4);
        }

        break;
      }

      var nextBlockedOn = attemptToDispatchEvent(nextDiscreteEvent.topLevelType, nextDiscreteEvent.eventSystemFlags, nextDiscreteEvent.container, nextDiscreteEvent.nativeEvent);

      if (nextBlockedOn !== null) {
        // We're still blocked. Try again later.
        nextDiscreteEvent.blockedOn = nextBlockedOn;
      } else {
        // We've successfully replayed the first event. Let's try the next one.
        queuedDiscreteEvents.shift();
      }
    } // Next replay any continuous events.


    if (queuedFocus !== null && attemptReplayContinuousQueuedEvent(queuedFocus)) {
      queuedFocus = null;
    }

    if (queuedDrag !== null && attemptReplayContinuousQueuedEvent(queuedDrag)) {
      queuedDrag = null;
    }

    if (queuedMouse !== null && attemptReplayContinuousQueuedEvent(queuedMouse)) {
      queuedMouse = null;
    }

    queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
    queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
  }

  function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
    if (queuedEvent.blockedOn === unblocked) {
      queuedEvent.blockedOn = null;

      if (!hasScheduledReplayAttempt) {
        hasScheduledReplayAttempt = true; // Schedule a callback to attempt replaying as many events as are
        // now unblocked. This first might not actually be unblocked yet.
        // We could check it early to avoid scheduling an unnecessary callback.

        unstable_scheduleCallback(unstable_NormalPriority, replayUnblockedEvents);
      }
    }
  }

  function retryIfBlockedOn(unblocked) {
    // Mark anything that was blocked on this as no longer blocked
    // and eligible for a replay.
    if (queuedDiscreteEvents.length > 0) {
      scheduleCallbackIfUnblocked(queuedDiscreteEvents[0], unblocked); // This is a exponential search for each boundary that commits. I think it's
      // worth it because we expect very few discrete events to queue up and once
      // we are actually fully unblocked it will be fast to replay them.

      for (var i = 1; i < queuedDiscreteEvents.length; i++) {
        var queuedEvent = queuedDiscreteEvents[i];

        if (queuedEvent.blockedOn === unblocked) {
          queuedEvent.blockedOn = null;
        }
      }
    }

    if (queuedFocus !== null) {
      scheduleCallbackIfUnblocked(queuedFocus, unblocked);
    }

    if (queuedDrag !== null) {
      scheduleCallbackIfUnblocked(queuedDrag, unblocked);
    }

    if (queuedMouse !== null) {
      scheduleCallbackIfUnblocked(queuedMouse, unblocked);
    }

    var unblock = function (queuedEvent) {
      return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
    };

    queuedPointers.forEach(unblock);
    queuedPointerCaptures.forEach(unblock);

    for (var _i = 0; _i < queuedExplicitHydrationTargets.length; _i++) {
      var queuedTarget = queuedExplicitHydrationTargets[_i];

      if (queuedTarget.blockedOn === unblocked) {
        queuedTarget.blockedOn = null;
      }
    }

    while (queuedExplicitHydrationTargets.length > 0) {
      var nextExplicitTarget = queuedExplicitHydrationTargets[0];

      if (nextExplicitTarget.blockedOn !== null) {
        // We're still blocked.
        break;
      } else {
        attemptExplicitHydrationTarget(nextExplicitTarget);

        if (nextExplicitTarget.blockedOn === null) {
          // We're unblocked.
          queuedExplicitHydrationTargets.shift();
        }
      }
    }
  }

  function addEventBubbleListener(element, eventType, listener) {
    element.addEventListener(eventType, listener, false);
  }
  function addEventCaptureListener(element, eventType, listener) {
    element.addEventListener(eventType, listener, true);
  }

  // do it in two places, which duplicates logic
  // and increases the bundle size, we do it all
  // here once. If we remove or refactor the
  // SimpleEventPlugin, we should also remove or
  // update the below line.

  var simpleEventPluginEventTypes = {};
  var topLevelEventsToDispatchConfig = new Map();
  var eventPriorities = new Map(); // We store most of the events in this module in pairs of two strings so we can re-use
  // the code required to apply the same logic for event prioritization and that of the
  // SimpleEventPlugin. This complicates things slightly, but the aim is to reduce code
  // duplication (for which there would be quite a bit). For the events that are not needed
  // for the SimpleEventPlugin (otherDiscreteEvents) we process them separately as an
  // array of top level events.
  // Lastly, we ignore prettier so we can keep the formatting sane.
  // prettier-ignore

  var discreteEventPairsForSimpleEventPlugin = [TOP_BLUR, 'blur', TOP_CANCEL, 'cancel', TOP_CLICK, 'click', TOP_CLOSE, 'close', TOP_CONTEXT_MENU, 'contextMenu', TOP_COPY, 'copy', TOP_CUT, 'cut', TOP_AUX_CLICK, 'auxClick', TOP_DOUBLE_CLICK, 'doubleClick', TOP_DRAG_END, 'dragEnd', TOP_DRAG_START, 'dragStart', TOP_DROP, 'drop', TOP_FOCUS, 'focus', TOP_INPUT, 'input', TOP_INVALID, 'invalid', TOP_KEY_DOWN, 'keyDown', TOP_KEY_PRESS, 'keyPress', TOP_KEY_UP, 'keyUp', TOP_MOUSE_DOWN, 'mouseDown', TOP_MOUSE_UP, 'mouseUp', TOP_PASTE, 'paste', TOP_PAUSE, 'pause', TOP_PLAY, 'play', TOP_POINTER_CANCEL, 'pointerCancel', TOP_POINTER_DOWN, 'pointerDown', TOP_POINTER_UP, 'pointerUp', TOP_RATE_CHANGE, 'rateChange', TOP_RESET, 'reset', TOP_SEEKED, 'seeked', TOP_SUBMIT, 'submit', TOP_TOUCH_CANCEL, 'touchCancel', TOP_TOUCH_END, 'touchEnd', TOP_TOUCH_START, 'touchStart', TOP_VOLUME_CHANGE, 'volumeChange'];
  var otherDiscreteEvents = [TOP_CHANGE, TOP_SELECTION_CHANGE, TOP_TEXT_INPUT, TOP_COMPOSITION_START, TOP_COMPOSITION_END, TOP_COMPOSITION_UPDATE]; // prettier-ignore

  var userBlockingPairsForSimpleEventPlugin = [TOP_DRAG, 'drag', TOP_DRAG_ENTER, 'dragEnter', TOP_DRAG_EXIT, 'dragExit', TOP_DRAG_LEAVE, 'dragLeave', TOP_DRAG_OVER, 'dragOver', TOP_MOUSE_MOVE, 'mouseMove', TOP_MOUSE_OUT, 'mouseOut', TOP_MOUSE_OVER, 'mouseOver', TOP_POINTER_MOVE, 'pointerMove', TOP_POINTER_OUT, 'pointerOut', TOP_POINTER_OVER, 'pointerOver', TOP_SCROLL, 'scroll', TOP_TOGGLE, 'toggle', TOP_TOUCH_MOVE, 'touchMove', TOP_WHEEL, 'wheel']; // prettier-ignore

  var continuousPairsForSimpleEventPlugin = [TOP_ABORT, 'abort', TOP_ANIMATION_END, 'animationEnd', TOP_ANIMATION_ITERATION, 'animationIteration', TOP_ANIMATION_START, 'animationStart', TOP_CAN_PLAY, 'canPlay', TOP_CAN_PLAY_THROUGH, 'canPlayThrough', TOP_DURATION_CHANGE, 'durationChange', TOP_EMPTIED, 'emptied', TOP_ENCRYPTED, 'encrypted', TOP_ENDED, 'ended', TOP_ERROR, 'error', TOP_GOT_POINTER_CAPTURE, 'gotPointerCapture', TOP_LOAD, 'load', TOP_LOADED_DATA, 'loadedData', TOP_LOADED_METADATA, 'loadedMetadata', TOP_LOAD_START, 'loadStart', TOP_LOST_POINTER_CAPTURE, 'lostPointerCapture', TOP_PLAYING, 'playing', TOP_PROGRESS, 'progress', TOP_SEEKING, 'seeking', TOP_STALLED, 'stalled', TOP_SUSPEND, 'suspend', TOP_TIME_UPDATE, 'timeUpdate', TOP_TRANSITION_END, 'transitionEnd', TOP_WAITING, 'waiting'];
  /**
   * Turns
   * ['abort', ...]
   * into
   * eventTypes = {
   *   'abort': {
   *     phasedRegistrationNames: {
   *       bubbled: 'onAbort',
   *       captured: 'onAbortCapture',
   *     },
   *     dependencies: [TOP_ABORT],
   *   },
   *   ...
   * };
   * topLevelEventsToDispatchConfig = new Map([
   *   [TOP_ABORT, { sameConfig }],
   * ]);
   */

  function processSimpleEventPluginPairsByPriority(eventTypes, priority) {
    // As the event types are in pairs of two, we need to iterate
    // through in twos. The events are in pairs of two to save code
    // and improve init perf of processing this array, as it will
    // result in far fewer object allocations and property accesses
    // if we only use three arrays to process all the categories of
    // instead of tuples.
    for (var i = 0; i < eventTypes.length; i += 2) {
      var topEvent = eventTypes[i];
      var event = eventTypes[i + 1];
      var capitalizedEvent = event[0].toUpperCase() + event.slice(1);
      var onEvent = 'on' + capitalizedEvent;
      var config = {
        phasedRegistrationNames: {
          bubbled: onEvent,
          captured: onEvent + 'Capture'
        },
        dependencies: [topEvent],
        eventPriority: priority
      };
      eventPriorities.set(topEvent, priority);
      topLevelEventsToDispatchConfig.set(topEvent, config);
      simpleEventPluginEventTypes[event] = config;
    }
  }

  function processTopEventPairsByPriority(eventTypes, priority) {
    for (var i = 0; i < eventTypes.length; i++) {
      eventPriorities.set(eventTypes[i], priority);
    }
  } // SimpleEventPlugin


  processSimpleEventPluginPairsByPriority(discreteEventPairsForSimpleEventPlugin, DiscreteEvent);
  processSimpleEventPluginPairsByPriority(userBlockingPairsForSimpleEventPlugin, UserBlockingEvent);
  processSimpleEventPluginPairsByPriority(continuousPairsForSimpleEventPlugin, ContinuousEvent); // Not used by SimpleEventPlugin

  processTopEventPairsByPriority(otherDiscreteEvents, DiscreteEvent);
  function getEventPriorityForPluginSystem(topLevelType) {
    var priority = eventPriorities.get(topLevelType); // Default to a ContinuousEvent. Note: we might
    // want to warn if we can't detect the priority
    // for the event.

    return priority === undefined ? ContinuousEvent : priority;
  }

  // Intentionally not named imports because Rollup would use dynamic dispatch for
  var UserBlockingPriority = unstable_UserBlockingPriority,
      runWithPriority = unstable_runWithPriority; // TODO: can we stop exporting these?

  var _enabled = true;
  function setEnabled(enabled) {
    _enabled = !!enabled;
  }
  function isEnabled() {
    return _enabled;
  }
  function trapBubbledEvent(topLevelType, element) {
    trapEventForPluginEventSystem(element, topLevelType, false);
  }
  function trapCapturedEvent(topLevelType, element) {
    trapEventForPluginEventSystem(element, topLevelType, true);
  }

  function trapEventForPluginEventSystem(container, topLevelType, capture) {
    var listener;

    switch (getEventPriorityForPluginSystem(topLevelType)) {
      case DiscreteEvent:
        listener = dispatchDiscreteEvent.bind(null, topLevelType, PLUGIN_EVENT_SYSTEM, container);
        break;

      case UserBlockingEvent:
        listener = dispatchUserBlockingUpdate.bind(null, topLevelType, PLUGIN_EVENT_SYSTEM, container);
        break;

      case ContinuousEvent:
      default:
        listener = dispatchEvent.bind(null, topLevelType, PLUGIN_EVENT_SYSTEM, container);
        break;
    }

    var rawEventName = getRawEventName(topLevelType);

    if (capture) {
      addEventCaptureListener(container, rawEventName, listener);
    } else {
      addEventBubbleListener(container, rawEventName, listener);
    }
  }

  function dispatchDiscreteEvent(topLevelType, eventSystemFlags, container, nativeEvent) {
    flushDiscreteUpdatesIfNeeded(nativeEvent.timeStamp);
    discreteUpdates(dispatchEvent, topLevelType, eventSystemFlags, container, nativeEvent);
  }

  function dispatchUserBlockingUpdate(topLevelType, eventSystemFlags, container, nativeEvent) {
    runWithPriority(UserBlockingPriority, dispatchEvent.bind(null, topLevelType, eventSystemFlags, container, nativeEvent));
  }

  function dispatchEvent(topLevelType, eventSystemFlags, container, nativeEvent) {
    if (!_enabled) {
      return;
    }

    if (hasQueuedDiscreteEvents() && isReplayableDiscreteEvent(topLevelType)) {
      // If we already have a queue of discrete events, and this is another discrete
      // event, then we can't dispatch it regardless of its target, since they
      // need to dispatch in order.
      queueDiscreteEvent(null, // Flags that we're not actually blocked on anything as far as we know.
      topLevelType, eventSystemFlags, container, nativeEvent);
      return;
    }

    var blockedOn = attemptToDispatchEvent(topLevelType, eventSystemFlags, container, nativeEvent);

    if (blockedOn === null) {
      // We successfully dispatched this event.
      clearIfContinuousEvent(topLevelType, nativeEvent);
      return;
    }

    if (isReplayableDiscreteEvent(topLevelType)) {
      // This this to be replayed later once the target is available.
      queueDiscreteEvent(blockedOn, topLevelType, eventSystemFlags, container, nativeEvent);
      return;
    }

    if (queueIfContinuousEvent(blockedOn, topLevelType, eventSystemFlags, container, nativeEvent)) {
      return;
    } // We need to clear only if we didn't queue because
    // queueing is accummulative.


    clearIfContinuousEvent(topLevelType, nativeEvent); // This is not replayable so we'll invoke it but without a target,
    // in case the event system needs to trace it.

    {
      dispatchEventForLegacyPluginEventSystem(topLevelType, eventSystemFlags, nativeEvent, null);
    }
  } // Attempt dispatching an event. Returns a SuspenseInstance or Container if it's blocked.

  function attemptToDispatchEvent(topLevelType, eventSystemFlags, container, nativeEvent) {
    // TODO: Warn if _enabled is false.
    var nativeEventTarget = getEventTarget(nativeEvent);
    var targetInst = getClosestInstanceFromNode(nativeEventTarget);

    if (targetInst !== null) {
      var nearestMounted = getNearestMountedFiber(targetInst);

      if (nearestMounted === null) {
        // This tree has been unmounted already. Dispatch without a target.
        targetInst = null;
      } else {
        var tag = nearestMounted.tag;

        if (tag === SuspenseComponent) {
          var instance = getSuspenseInstanceFromFiber(nearestMounted);

          if (instance !== null) {
            // Queue the event to be replayed later. Abort dispatching since we
            // don't want this event dispatched twice through the event system.
            // TODO: If this is the first discrete event in the queue. Schedule an increased
            // priority for this boundary.
            return instance;
          } // This shouldn't happen, something went wrong but to avoid blocking
          // the whole system, dispatch the event without a target.
          // TODO: Warn.


          targetInst = null;
        } else if (tag === HostRoot) {
          var root = nearestMounted.stateNode;

          if (root.hydrate) {
            // If this happens during a replay something went wrong and it might block
            // the whole system.
            return getContainerFromFiber(nearestMounted);
          }

          targetInst = null;
        } else if (nearestMounted !== targetInst) {
          // If we get an event (ex: img onload) before committing that
          // component's mount, ignore it for now (that is, treat it as if it was an
          // event on a non-React tree). We might also consider queueing events and
          // dispatching them after the mount.
          targetInst = null;
        }
      }
    }

    {
      dispatchEventForLegacyPluginEventSystem(topLevelType, eventSystemFlags, nativeEvent, targetInst);
    } // We're not blocked on anything.


    return null;
  }

  // List derived from Gecko source code:
  // https://github.com/mozilla/gecko-dev/blob/4e638efc71/layout/style/test/property_database.js
  var shorthandToLonghand = {
    animation: ['animationDelay', 'animationDirection', 'animationDuration', 'animationFillMode', 'animationIterationCount', 'animationName', 'animationPlayState', 'animationTimingFunction'],
    background: ['backgroundAttachment', 'backgroundClip', 'backgroundColor', 'backgroundImage', 'backgroundOrigin', 'backgroundPositionX', 'backgroundPositionY', 'backgroundRepeat', 'backgroundSize'],
    backgroundPosition: ['backgroundPositionX', 'backgroundPositionY'],
    border: ['borderBottomColor', 'borderBottomStyle', 'borderBottomWidth', 'borderImageOutset', 'borderImageRepeat', 'borderImageSlice', 'borderImageSource', 'borderImageWidth', 'borderLeftColor', 'borderLeftStyle', 'borderLeftWidth', 'borderRightColor', 'borderRightStyle', 'borderRightWidth', 'borderTopColor', 'borderTopStyle', 'borderTopWidth'],
    borderBlockEnd: ['borderBlockEndColor', 'borderBlockEndStyle', 'borderBlockEndWidth'],
    borderBlockStart: ['borderBlockStartColor', 'borderBlockStartStyle', 'borderBlockStartWidth'],
    borderBottom: ['borderBottomColor', 'borderBottomStyle', 'borderBottomWidth'],
    borderColor: ['borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor'],
    borderImage: ['borderImageOutset', 'borderImageRepeat', 'borderImageSlice', 'borderImageSource', 'borderImageWidth'],
    borderInlineEnd: ['borderInlineEndColor', 'borderInlineEndStyle', 'borderInlineEndWidth'],
    borderInlineStart: ['borderInlineStartColor', 'borderInlineStartStyle', 'borderInlineStartWidth'],
    borderLeft: ['borderLeftColor', 'borderLeftStyle', 'borderLeftWidth'],
    borderRadius: ['borderBottomLeftRadius', 'borderBottomRightRadius', 'borderTopLeftRadius', 'borderTopRightRadius'],
    borderRight: ['borderRightColor', 'borderRightStyle', 'borderRightWidth'],
    borderStyle: ['borderBottomStyle', 'borderLeftStyle', 'borderRightStyle', 'borderTopStyle'],
    borderTop: ['borderTopColor', 'borderTopStyle', 'borderTopWidth'],
    borderWidth: ['borderBottomWidth', 'borderLeftWidth', 'borderRightWidth', 'borderTopWidth'],
    columnRule: ['columnRuleColor', 'columnRuleStyle', 'columnRuleWidth'],
    columns: ['columnCount', 'columnWidth'],
    flex: ['flexBasis', 'flexGrow', 'flexShrink'],
    flexFlow: ['flexDirection', 'flexWrap'],
    font: ['fontFamily', 'fontFeatureSettings', 'fontKerning', 'fontLanguageOverride', 'fontSize', 'fontSizeAdjust', 'fontStretch', 'fontStyle', 'fontVariant', 'fontVariantAlternates', 'fontVariantCaps', 'fontVariantEastAsian', 'fontVariantLigatures', 'fontVariantNumeric', 'fontVariantPosition', 'fontWeight', 'lineHeight'],
    fontVariant: ['fontVariantAlternates', 'fontVariantCaps', 'fontVariantEastAsian', 'fontVariantLigatures', 'fontVariantNumeric', 'fontVariantPosition'],
    gap: ['columnGap', 'rowGap'],
    grid: ['gridAutoColumns', 'gridAutoFlow', 'gridAutoRows', 'gridTemplateAreas', 'gridTemplateColumns', 'gridTemplateRows'],
    gridArea: ['gridColumnEnd', 'gridColumnStart', 'gridRowEnd', 'gridRowStart'],
    gridColumn: ['gridColumnEnd', 'gridColumnStart'],
    gridColumnGap: ['columnGap'],
    gridGap: ['columnGap', 'rowGap'],
    gridRow: ['gridRowEnd', 'gridRowStart'],
    gridRowGap: ['rowGap'],
    gridTemplate: ['gridTemplateAreas', 'gridTemplateColumns', 'gridTemplateRows'],
    listStyle: ['listStyleImage', 'listStylePosition', 'listStyleType'],
    margin: ['marginBottom', 'marginLeft', 'marginRight', 'marginTop'],
    marker: ['markerEnd', 'markerMid', 'markerStart'],
    mask: ['maskClip', 'maskComposite', 'maskImage', 'maskMode', 'maskOrigin', 'maskPositionX', 'maskPositionY', 'maskRepeat', 'maskSize'],
    maskPosition: ['maskPositionX', 'maskPositionY'],
    outline: ['outlineColor', 'outlineStyle', 'outlineWidth'],
    overflow: ['overflowX', 'overflowY'],
    padding: ['paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop'],
    placeContent: ['alignContent', 'justifyContent'],
    placeItems: ['alignItems', 'justifyItems'],
    placeSelf: ['alignSelf', 'justifySelf'],
    textDecoration: ['textDecorationColor', 'textDecorationLine', 'textDecorationStyle'],
    textEmphasis: ['textEmphasisColor', 'textEmphasisStyle'],
    transition: ['transitionDelay', 'transitionDuration', 'transitionProperty', 'transitionTimingFunction'],
    wordWrap: ['overflowWrap']
  };

  /**
   * CSS properties which accept numbers but are not in units of "px".
   */
  var isUnitlessNumber = {
    animationIterationCount: true,
    borderImageOutset: true,
    borderImageSlice: true,
    borderImageWidth: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    columns: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridArea: true,
    gridRow: true,
    gridRowEnd: true,
    gridRowSpan: true,
    gridRowStart: true,
    gridColumn: true,
    gridColumnEnd: true,
    gridColumnSpan: true,
    gridColumnStart: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,
    // SVG-related properties
    fillOpacity: true,
    floodOpacity: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeDashoffset: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true
  };
  /**
   * @param {string} prefix vendor-specific prefix, eg: Webkit
   * @param {string} key style name, eg: transitionDuration
   * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
   * WebkitTransitionDuration
   */

  function prefixKey(prefix, key) {
    return prefix + key.charAt(0).toUpperCase() + key.substring(1);
  }
  /**
   * Support style names that may come passed in prefixed by adding permutations
   * of vendor prefixes.
   */


  var prefixes = ['Webkit', 'ms', 'Moz', 'O']; // Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
  // infinite loop, because it iterates over the newly added props too.

  Object.keys(isUnitlessNumber).forEach(function (prop) {
    prefixes.forEach(function (prefix) {
      isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
    });
  });

  /**
   * Convert a value into the proper css writable value. The style name `name`
   * should be logical (no hyphens), as specified
   * in `CSSProperty.isUnitlessNumber`.
   *
   * @param {string} name CSS property name such as `topMargin`.
   * @param {*} value CSS property value such as `10px`.
   * @return {string} Normalized style value with dimensions applied.
   */

  function dangerousStyleValue(name, value, isCustomProperty) {
    // Note that we've removed escapeTextForBrowser() calls here since the
    // whole string will be escaped when the attribute is injected into
    // the markup. If you provide unsafe user data here they can inject
    // arbitrary CSS which may be problematic (I couldn't repro this):
    // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
    // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
    // This is not an XSS hole but instead a potential CSS injection issue
    // which has lead to a greater discussion about how we're going to
    // trust URLs moving forward. See #2115901
    var isEmpty = value == null || typeof value === 'boolean' || value === '';

    if (isEmpty) {
      return '';
    }

    if (!isCustomProperty && typeof value === 'number' && value !== 0 && !(isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name])) {
      return value + 'px'; // Presumes implicit 'px' suffix for unitless numbers
    }

    return ('' + value).trim();
  }

  var uppercasePattern = /([A-Z])/g;
  var msPattern = /^ms-/;
  /**
   * Hyphenates a camelcased CSS property name, for example:
   *
   *   > hyphenateStyleName('backgroundColor')
   *   < "background-color"
   *   > hyphenateStyleName('MozTransition')
   *   < "-moz-transition"
   *   > hyphenateStyleName('msTransition')
   *   < "-ms-transition"
   *
   * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
   * is converted to `-ms-`.
   */

  function hyphenateStyleName(name) {
    return name.replace(uppercasePattern, '-$1').toLowerCase().replace(msPattern, '-ms-');
  }

  var warnValidStyle = function () {};

  {
    // 'msTransform' is correct, but the other prefixes should be capitalized
    var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;
    var msPattern$1 = /^-ms-/;
    var hyphenPattern = /-(.)/g; // style values shouldn't contain a semicolon

    var badStyleValueWithSemicolonPattern = /;\s*$/;
    var warnedStyleNames = {};
    var warnedStyleValues = {};
    var warnedForNaNValue = false;
    var warnedForInfinityValue = false;

    var camelize = function (string) {
      return string.replace(hyphenPattern, function (_, character) {
        return character.toUpperCase();
      });
    };

    var warnHyphenatedStyleName = function (name) {
      if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
        return;
      }

      warnedStyleNames[name] = true;

      error('Unsupported style property %s. Did you mean %s?', name, // As Andi Smith suggests
      // (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
      // is converted to lowercase `ms`.
      camelize(name.replace(msPattern$1, 'ms-')));
    };

    var warnBadVendoredStyleName = function (name) {
      if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
        return;
      }

      warnedStyleNames[name] = true;

      error('Unsupported vendor-prefixed style property %s. Did you mean %s?', name, name.charAt(0).toUpperCase() + name.slice(1));
    };

    var warnStyleValueWithSemicolon = function (name, value) {
      if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
        return;
      }

      warnedStyleValues[value] = true;

      error("Style property values shouldn't contain a semicolon. " + 'Try "%s: %s" instead.', name, value.replace(badStyleValueWithSemicolonPattern, ''));
    };

    var warnStyleValueIsNaN = function (name, value) {
      if (warnedForNaNValue) {
        return;
      }

      warnedForNaNValue = true;

      error('`NaN` is an invalid value for the `%s` css style property.', name);
    };

    var warnStyleValueIsInfinity = function (name, value) {
      if (warnedForInfinityValue) {
        return;
      }

      warnedForInfinityValue = true;

      error('`Infinity` is an invalid value for the `%s` css style property.', name);
    };

    warnValidStyle = function (name, value) {
      if (name.indexOf('-') > -1) {
        warnHyphenatedStyleName(name);
      } else if (badVendoredStyleNamePattern.test(name)) {
        warnBadVendoredStyleName(name);
      } else if (badStyleValueWithSemicolonPattern.test(value)) {
        warnStyleValueWithSemicolon(name, value);
      }

      if (typeof value === 'number') {
        if (isNaN(value)) {
          warnStyleValueIsNaN(name, value);
        } else if (!isFinite(value)) {
          warnStyleValueIsInfinity(name, value);
        }
      }
    };
  }

  var warnValidStyle$1 = warnValidStyle;

  /**
   * Operations for dealing with CSS properties.
   */

  /**
   * This creates a string that is expected to be equivalent to the style
   * attribute generated by server-side rendering. It by-passes warnings and
   * security checks so it's not safe to use this value for anything other than
   * comparison. It is only used in DEV for SSR validation.
   */

  function createDangerousStringForStyles(styles) {
    {
      var serialized = '';
      var delimiter = '';

      for (var styleName in styles) {
        if (!styles.hasOwnProperty(styleName)) {
          continue;
        }

        var styleValue = styles[styleName];

        if (styleValue != null) {
          var isCustomProperty = styleName.indexOf('--') === 0;
          serialized += delimiter + (isCustomProperty ? styleName : hyphenateStyleName(styleName)) + ':';
          serialized += dangerousStyleValue(styleName, styleValue, isCustomProperty);
          delimiter = ';';
        }
      }

      return serialized || null;
    }
  }
  /**
   * Sets the value for multiple styles on a node.  If a value is specified as
   * '' (empty string), the corresponding style property will be unset.
   *
   * @param {DOMElement} node
   * @param {object} styles
   */

  function setValueForStyles(node, styles) {
    var style = node.style;

    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }

      var isCustomProperty = styleName.indexOf('--') === 0;

      {
        if (!isCustomProperty) {
          warnValidStyle$1(styleName, styles[styleName]);
        }
      }

      var styleValue = dangerousStyleValue(styleName, styles[styleName], isCustomProperty);

      if (styleName === 'float') {
        styleName = 'cssFloat';
      }

      if (isCustomProperty) {
        style.setProperty(styleName, styleValue);
      } else {
        style[styleName] = styleValue;
      }
    }
  }

  function isValueEmpty(value) {
    return value == null || typeof value === 'boolean' || value === '';
  }
  /**
   * Given {color: 'red', overflow: 'hidden'} returns {
   *   color: 'color',
   *   overflowX: 'overflow',
   *   overflowY: 'overflow',
   * }. This can be read as "the overflowY property was set by the overflow
   * shorthand". That is, the values are the property that each was derived from.
   */


  function expandShorthandMap(styles) {
    var expanded = {};

    for (var key in styles) {
      var longhands = shorthandToLonghand[key] || [key];

      for (var i = 0; i < longhands.length; i++) {
        expanded[longhands[i]] = key;
      }
    }

    return expanded;
  }
  /**
   * When mixing shorthand and longhand property names, we warn during updates if
   * we expect an incorrect result to occur. In particular, we warn for:
   *
   * Updating a shorthand property (longhand gets overwritten):
   *   {font: 'foo', fontVariant: 'bar'} -> {font: 'baz', fontVariant: 'bar'}
   *   becomes .style.font = 'baz'
   * Removing a shorthand property (longhand gets lost too):
   *   {font: 'foo', fontVariant: 'bar'} -> {fontVariant: 'bar'}
   *   becomes .style.font = ''
   * Removing a longhand property (should revert to shorthand; doesn't):
   *   {font: 'foo', fontVariant: 'bar'} -> {font: 'foo'}
   *   becomes .style.fontVariant = ''
   */


  function validateShorthandPropertyCollisionInDev(styleUpdates, nextStyles) {
    {

      if (!nextStyles) {
        return;
      }

      var expandedUpdates = expandShorthandMap(styleUpdates);
      var expandedStyles = expandShorthandMap(nextStyles);
      var warnedAbout = {};

      for (var key in expandedUpdates) {
        var originalKey = expandedUpdates[key];
        var correctOriginalKey = expandedStyles[key];

        if (correctOriginalKey && originalKey !== correctOriginalKey) {
          var warningKey = originalKey + ',' + correctOriginalKey;

          if (warnedAbout[warningKey]) {
            continue;
          }

          warnedAbout[warningKey] = true;

          error('%s a style property during rerender (%s) when a ' + 'conflicting property is set (%s) can lead to styling bugs. To ' + "avoid this, don't mix shorthand and non-shorthand properties " + 'for the same value; instead, replace the shorthand with ' + 'separate values.', isValueEmpty(styleUpdates[originalKey]) ? 'Removing' : 'Updating', originalKey, correctOriginalKey);
        }
      }
    }
  }

  // For HTML, certain tags should omit their close tag. We keep a whitelist for
  // those special-case tags.
  var omittedCloseTags = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true // NOTE: menuitem's close tag should be omitted, but that causes problems.

  };

  // `omittedCloseTags` except that `menuitem` should still have its closing tag.

  var voidElementTags = _assign({
    menuitem: true
  }, omittedCloseTags);

  var HTML = '__html';
  var ReactDebugCurrentFrame$3 = null;

  {
    ReactDebugCurrentFrame$3 = ReactSharedInternals.ReactDebugCurrentFrame;
  }

  function assertValidProps(tag, props) {
    if (!props) {
      return;
    } // Note the use of `==` which checks for null or undefined.


    if (voidElementTags[tag]) {
      if (!(props.children == null && props.dangerouslySetInnerHTML == null)) {
        {
          throw Error( tag + " is a void element tag and must neither have `children` nor use `dangerouslySetInnerHTML`." + ( ReactDebugCurrentFrame$3.getStackAddendum() ) );
        }
      }
    }

    if (props.dangerouslySetInnerHTML != null) {
      if (!(props.children == null)) {
        {
          throw Error( "Can only set one of `children` or `props.dangerouslySetInnerHTML`." );
        }
      }

      if (!(typeof props.dangerouslySetInnerHTML === 'object' && HTML in props.dangerouslySetInnerHTML)) {
        {
          throw Error( "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://fb.me/react-invariant-dangerously-set-inner-html for more information." );
        }
      }
    }

    {
      if (!props.suppressContentEditableWarning && props.contentEditable && props.children != null) {
        error('A component is `contentEditable` and contains `children` managed by ' + 'React. It is now your responsibility to guarantee that none of ' + 'those nodes are unexpectedly modified or duplicated. This is ' + 'probably not intentional.');
      }
    }

    if (!(props.style == null || typeof props.style === 'object')) {
      {
        throw Error( "The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX." + ( ReactDebugCurrentFrame$3.getStackAddendum() ) );
      }
    }
  }

  function isCustomComponent(tagName, props) {
    if (tagName.indexOf('-') === -1) {
      return typeof props.is === 'string';
    }

    switch (tagName) {
      // These are reserved SVG and MathML elements.
      // We don't mind this whitelist too much because we expect it to never grow.
      // The alternative is to track the namespace in a few places which is convoluted.
      // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
      case 'annotation-xml':
      case 'color-profile':
      case 'font-face':
      case 'font-face-src':
      case 'font-face-uri':
      case 'font-face-format':
      case 'font-face-name':
      case 'missing-glyph':
        return false;

      default:
        return true;
    }
  }

  // When adding attributes to the HTML or SVG whitelist, be sure to
  // also add them to this module to ensure casing and incorrect name
  // warnings.
  var possibleStandardNames = {
    // HTML
    accept: 'accept',
    acceptcharset: 'acceptCharset',
    'accept-charset': 'acceptCharset',
    accesskey: 'accessKey',
    action: 'action',
    allowfullscreen: 'allowFullScreen',
    alt: 'alt',
    as: 'as',
    async: 'async',
    autocapitalize: 'autoCapitalize',
    autocomplete: 'autoComplete',
    autocorrect: 'autoCorrect',
    autofocus: 'autoFocus',
    autoplay: 'autoPlay',
    autosave: 'autoSave',
    capture: 'capture',
    cellpadding: 'cellPadding',
    cellspacing: 'cellSpacing',
    challenge: 'challenge',
    charset: 'charSet',
    checked: 'checked',
    children: 'children',
    cite: 'cite',
    class: 'className',
    classid: 'classID',
    classname: 'className',
    cols: 'cols',
    colspan: 'colSpan',
    content: 'content',
    contenteditable: 'contentEditable',
    contextmenu: 'contextMenu',
    controls: 'controls',
    controlslist: 'controlsList',
    coords: 'coords',
    crossorigin: 'crossOrigin',
    dangerouslysetinnerhtml: 'dangerouslySetInnerHTML',
    data: 'data',
    datetime: 'dateTime',
    default: 'default',
    defaultchecked: 'defaultChecked',
    defaultvalue: 'defaultValue',
    defer: 'defer',
    dir: 'dir',
    disabled: 'disabled',
    disablepictureinpicture: 'disablePictureInPicture',
    download: 'download',
    draggable: 'draggable',
    enctype: 'encType',
    for: 'htmlFor',
    form: 'form',
    formmethod: 'formMethod',
    formaction: 'formAction',
    formenctype: 'formEncType',
    formnovalidate: 'formNoValidate',
    formtarget: 'formTarget',
    frameborder: 'frameBorder',
    headers: 'headers',
    height: 'height',
    hidden: 'hidden',
    high: 'high',
    href: 'href',
    hreflang: 'hrefLang',
    htmlfor: 'htmlFor',
    httpequiv: 'httpEquiv',
    'http-equiv': 'httpEquiv',
    icon: 'icon',
    id: 'id',
    innerhtml: 'innerHTML',
    inputmode: 'inputMode',
    integrity: 'integrity',
    is: 'is',
    itemid: 'itemID',
    itemprop: 'itemProp',
    itemref: 'itemRef',
    itemscope: 'itemScope',
    itemtype: 'itemType',
    keyparams: 'keyParams',
    keytype: 'keyType',
    kind: 'kind',
    label: 'label',
    lang: 'lang',
    list: 'list',
    loop: 'loop',
    low: 'low',
    manifest: 'manifest',
    marginwidth: 'marginWidth',
    marginheight: 'marginHeight',
    max: 'max',
    maxlength: 'maxLength',
    media: 'media',
    mediagroup: 'mediaGroup',
    method: 'method',
    min: 'min',
    minlength: 'minLength',
    multiple: 'multiple',
    muted: 'muted',
    name: 'name',
    nomodule: 'noModule',
    nonce: 'nonce',
    novalidate: 'noValidate',
    open: 'open',
    optimum: 'optimum',
    pattern: 'pattern',
    placeholder: 'placeholder',
    playsinline: 'playsInline',
    poster: 'poster',
    preload: 'preload',
    profile: 'profile',
    radiogroup: 'radioGroup',
    readonly: 'readOnly',
    referrerpolicy: 'referrerPolicy',
    rel: 'rel',
    required: 'required',
    reversed: 'reversed',
    role: 'role',
    rows: 'rows',
    rowspan: 'rowSpan',
    sandbox: 'sandbox',
    scope: 'scope',
    scoped: 'scoped',
    scrolling: 'scrolling',
    seamless: 'seamless',
    selected: 'selected',
    shape: 'shape',
    size: 'size',
    sizes: 'sizes',
    span: 'span',
    spellcheck: 'spellCheck',
    src: 'src',
    srcdoc: 'srcDoc',
    srclang: 'srcLang',
    srcset: 'srcSet',
    start: 'start',
    step: 'step',
    style: 'style',
    summary: 'summary',
    tabindex: 'tabIndex',
    target: 'target',
    title: 'title',
    type: 'type',
    usemap: 'useMap',
    value: 'value',
    width: 'width',
    wmode: 'wmode',
    wrap: 'wrap',
    // SVG
    about: 'about',
    accentheight: 'accentHeight',
    'accent-height': 'accentHeight',
    accumulate: 'accumulate',
    additive: 'additive',
    alignmentbaseline: 'alignmentBaseline',
    'alignment-baseline': 'alignmentBaseline',
    allowreorder: 'allowReorder',
    alphabetic: 'alphabetic',
    amplitude: 'amplitude',
    arabicform: 'arabicForm',
    'arabic-form': 'arabicForm',
    ascent: 'ascent',
    attributename: 'attributeName',
    attributetype: 'attributeType',
    autoreverse: 'autoReverse',
    azimuth: 'azimuth',
    basefrequency: 'baseFrequency',
    baselineshift: 'baselineShift',
    'baseline-shift': 'baselineShift',
    baseprofile: 'baseProfile',
    bbox: 'bbox',
    begin: 'begin',
    bias: 'bias',
    by: 'by',
    calcmode: 'calcMode',
    capheight: 'capHeight',
    'cap-height': 'capHeight',
    clip: 'clip',
    clippath: 'clipPath',
    'clip-path': 'clipPath',
    clippathunits: 'clipPathUnits',
    cliprule: 'clipRule',
    'clip-rule': 'clipRule',
    color: 'color',
    colorinterpolation: 'colorInterpolation',
    'color-interpolation': 'colorInterpolation',
    colorinterpolationfilters: 'colorInterpolationFilters',
    'color-interpolation-filters': 'colorInterpolationFilters',
    colorprofile: 'colorProfile',
    'color-profile': 'colorProfile',
    colorrendering: 'colorRendering',
    'color-rendering': 'colorRendering',
    contentscripttype: 'contentScriptType',
    contentstyletype: 'contentStyleType',
    cursor: 'cursor',
    cx: 'cx',
    cy: 'cy',
    d: 'd',
    datatype: 'datatype',
    decelerate: 'decelerate',
    descent: 'descent',
    diffuseconstant: 'diffuseConstant',
    direction: 'direction',
    display: 'display',
    divisor: 'divisor',
    dominantbaseline: 'dominantBaseline',
    'dominant-baseline': 'dominantBaseline',
    dur: 'dur',
    dx: 'dx',
    dy: 'dy',
    edgemode: 'edgeMode',
    elevation: 'elevation',
    enablebackground: 'enableBackground',
    'enable-background': 'enableBackground',
    end: 'end',
    exponent: 'exponent',
    externalresourcesrequired: 'externalResourcesRequired',
    fill: 'fill',
    fillopacity: 'fillOpacity',
    'fill-opacity': 'fillOpacity',
    fillrule: 'fillRule',
    'fill-rule': 'fillRule',
    filter: 'filter',
    filterres: 'filterRes',
    filterunits: 'filterUnits',
    floodopacity: 'floodOpacity',
    'flood-opacity': 'floodOpacity',
    floodcolor: 'floodColor',
    'flood-color': 'floodColor',
    focusable: 'focusable',
    fontfamily: 'fontFamily',
    'font-family': 'fontFamily',
    fontsize: 'fontSize',
    'font-size': 'fontSize',
    fontsizeadjust: 'fontSizeAdjust',
    'font-size-adjust': 'fontSizeAdjust',
    fontstretch: 'fontStretch',
    'font-stretch': 'fontStretch',
    fontstyle: 'fontStyle',
    'font-style': 'fontStyle',
    fontvariant: 'fontVariant',
    'font-variant': 'fontVariant',
    fontweight: 'fontWeight',
    'font-weight': 'fontWeight',
    format: 'format',
    from: 'from',
    fx: 'fx',
    fy: 'fy',
    g1: 'g1',
    g2: 'g2',
    glyphname: 'glyphName',
    'glyph-name': 'glyphName',
    glyphorientationhorizontal: 'glyphOrientationHorizontal',
    'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
    glyphorientationvertical: 'glyphOrientationVertical',
    'glyph-orientation-vertical': 'glyphOrientationVertical',
    glyphref: 'glyphRef',
    gradienttransform: 'gradientTransform',
    gradientunits: 'gradientUnits',
    hanging: 'hanging',
    horizadvx: 'horizAdvX',
    'horiz-adv-x': 'horizAdvX',
    horizoriginx: 'horizOriginX',
    'horiz-origin-x': 'horizOriginX',
    ideographic: 'ideographic',
    imagerendering: 'imageRendering',
    'image-rendering': 'imageRendering',
    in2: 'in2',
    in: 'in',
    inlist: 'inlist',
    intercept: 'intercept',
    k1: 'k1',
    k2: 'k2',
    k3: 'k3',
    k4: 'k4',
    k: 'k',
    kernelmatrix: 'kernelMatrix',
    kernelunitlength: 'kernelUnitLength',
    kerning: 'kerning',
    keypoints: 'keyPoints',
    keysplines: 'keySplines',
    keytimes: 'keyTimes',
    lengthadjust: 'lengthAdjust',
    letterspacing: 'letterSpacing',
    'letter-spacing': 'letterSpacing',
    lightingcolor: 'lightingColor',
    'lighting-color': 'lightingColor',
    limitingconeangle: 'limitingConeAngle',
    local: 'local',
    markerend: 'markerEnd',
    'marker-end': 'markerEnd',
    markerheight: 'markerHeight',
    markermid: 'markerMid',
    'marker-mid': 'markerMid',
    markerstart: 'markerStart',
    'marker-start': 'markerStart',
    markerunits: 'markerUnits',
    markerwidth: 'markerWidth',
    mask: 'mask',
    maskcontentunits: 'maskContentUnits',
    maskunits: 'maskUnits',
    mathematical: 'mathematical',
    mode: 'mode',
    numoctaves: 'numOctaves',
    offset: 'offset',
    opacity: 'opacity',
    operator: 'operator',
    order: 'order',
    orient: 'orient',
    orientation: 'orientation',
    origin: 'origin',
    overflow: 'overflow',
    overlineposition: 'overlinePosition',
    'overline-position': 'overlinePosition',
    overlinethickness: 'overlineThickness',
    'overline-thickness': 'overlineThickness',
    paintorder: 'paintOrder',
    'paint-order': 'paintOrder',
    panose1: 'panose1',
    'panose-1': 'panose1',
    pathlength: 'pathLength',
    patterncontentunits: 'patternContentUnits',
    patterntransform: 'patternTransform',
    patternunits: 'patternUnits',
    pointerevents: 'pointerEvents',
    'pointer-events': 'pointerEvents',
    points: 'points',
    pointsatx: 'pointsAtX',
    pointsaty: 'pointsAtY',
    pointsatz: 'pointsAtZ',
    prefix: 'prefix',
    preservealpha: 'preserveAlpha',
    preserveaspectratio: 'preserveAspectRatio',
    primitiveunits: 'primitiveUnits',
    property: 'property',
    r: 'r',
    radius: 'radius',
    refx: 'refX',
    refy: 'refY',
    renderingintent: 'renderingIntent',
    'rendering-intent': 'renderingIntent',
    repeatcount: 'repeatCount',
    repeatdur: 'repeatDur',
    requiredextensions: 'requiredExtensions',
    requiredfeatures: 'requiredFeatures',
    resource: 'resource',
    restart: 'restart',
    result: 'result',
    results: 'results',
    rotate: 'rotate',
    rx: 'rx',
    ry: 'ry',
    scale: 'scale',
    security: 'security',
    seed: 'seed',
    shaperendering: 'shapeRendering',
    'shape-rendering': 'shapeRendering',
    slope: 'slope',
    spacing: 'spacing',
    specularconstant: 'specularConstant',
    specularexponent: 'specularExponent',
    speed: 'speed',
    spreadmethod: 'spreadMethod',
    startoffset: 'startOffset',
    stddeviation: 'stdDeviation',
    stemh: 'stemh',
    stemv: 'stemv',
    stitchtiles: 'stitchTiles',
    stopcolor: 'stopColor',
    'stop-color': 'stopColor',
    stopopacity: 'stopOpacity',
    'stop-opacity': 'stopOpacity',
    strikethroughposition: 'strikethroughPosition',
    'strikethrough-position': 'strikethroughPosition',
    strikethroughthickness: 'strikethroughThickness',
    'strikethrough-thickness': 'strikethroughThickness',
    string: 'string',
    stroke: 'stroke',
    strokedasharray: 'strokeDasharray',
    'stroke-dasharray': 'strokeDasharray',
    strokedashoffset: 'strokeDashoffset',
    'stroke-dashoffset': 'strokeDashoffset',
    strokelinecap: 'strokeLinecap',
    'stroke-linecap': 'strokeLinecap',
    strokelinejoin: 'strokeLinejoin',
    'stroke-linejoin': 'strokeLinejoin',
    strokemiterlimit: 'strokeMiterlimit',
    'stroke-miterlimit': 'strokeMiterlimit',
    strokewidth: 'strokeWidth',
    'stroke-width': 'strokeWidth',
    strokeopacity: 'strokeOpacity',
    'stroke-opacity': 'strokeOpacity',
    suppresscontenteditablewarning: 'suppressContentEditableWarning',
    suppresshydrationwarning: 'suppressHydrationWarning',
    surfacescale: 'surfaceScale',
    systemlanguage: 'systemLanguage',
    tablevalues: 'tableValues',
    targetx: 'targetX',
    targety: 'targetY',
    textanchor: 'textAnchor',
    'text-anchor': 'textAnchor',
    textdecoration: 'textDecoration',
    'text-decoration': 'textDecoration',
    textlength: 'textLength',
    textrendering: 'textRendering',
    'text-rendering': 'textRendering',
    to: 'to',
    transform: 'transform',
    typeof: 'typeof',
    u1: 'u1',
    u2: 'u2',
    underlineposition: 'underlinePosition',
    'underline-position': 'underlinePosition',
    underlinethickness: 'underlineThickness',
    'underline-thickness': 'underlineThickness',
    unicode: 'unicode',
    unicodebidi: 'unicodeBidi',
    'unicode-bidi': 'unicodeBidi',
    unicoderange: 'unicodeRange',
    'unicode-range': 'unicodeRange',
    unitsperem: 'unitsPerEm',
    'units-per-em': 'unitsPerEm',
    unselectable: 'unselectable',
    valphabetic: 'vAlphabetic',
    'v-alphabetic': 'vAlphabetic',
    values: 'values',
    vectoreffect: 'vectorEffect',
    'vector-effect': 'vectorEffect',
    version: 'version',
    vertadvy: 'vertAdvY',
    'vert-adv-y': 'vertAdvY',
    vertoriginx: 'vertOriginX',
    'vert-origin-x': 'vertOriginX',
    vertoriginy: 'vertOriginY',
    'vert-origin-y': 'vertOriginY',
    vhanging: 'vHanging',
    'v-hanging': 'vHanging',
    videographic: 'vIdeographic',
    'v-ideographic': 'vIdeographic',
    viewbox: 'viewBox',
    viewtarget: 'viewTarget',
    visibility: 'visibility',
    vmathematical: 'vMathematical',
    'v-mathematical': 'vMathematical',
    vocab: 'vocab',
    widths: 'widths',
    wordspacing: 'wordSpacing',
    'word-spacing': 'wordSpacing',
    writingmode: 'writingMode',
    'writing-mode': 'writingMode',
    x1: 'x1',
    x2: 'x2',
    x: 'x',
    xchannelselector: 'xChannelSelector',
    xheight: 'xHeight',
    'x-height': 'xHeight',
    xlinkactuate: 'xlinkActuate',
    'xlink:actuate': 'xlinkActuate',
    xlinkarcrole: 'xlinkArcrole',
    'xlink:arcrole': 'xlinkArcrole',
    xlinkhref: 'xlinkHref',
    'xlink:href': 'xlinkHref',
    xlinkrole: 'xlinkRole',
    'xlink:role': 'xlinkRole',
    xlinkshow: 'xlinkShow',
    'xlink:show': 'xlinkShow',
    xlinktitle: 'xlinkTitle',
    'xlink:title': 'xlinkTitle',
    xlinktype: 'xlinkType',
    'xlink:type': 'xlinkType',
    xmlbase: 'xmlBase',
    'xml:base': 'xmlBase',
    xmllang: 'xmlLang',
    'xml:lang': 'xmlLang',
    xmlns: 'xmlns',
    'xml:space': 'xmlSpace',
    xmlnsxlink: 'xmlnsXlink',
    'xmlns:xlink': 'xmlnsXlink',
    xmlspace: 'xmlSpace',
    y1: 'y1',
    y2: 'y2',
    y: 'y',
    ychannelselector: 'yChannelSelector',
    z: 'z',
    zoomandpan: 'zoomAndPan'
  };

  var ariaProperties = {
    'aria-current': 0,
    // state
    'aria-details': 0,
    'aria-disabled': 0,
    // state
    'aria-hidden': 0,
    // state
    'aria-invalid': 0,
    // state
    'aria-keyshortcuts': 0,
    'aria-label': 0,
    'aria-roledescription': 0,
    // Widget Attributes
    'aria-autocomplete': 0,
    'aria-checked': 0,
    'aria-expanded': 0,
    'aria-haspopup': 0,
    'aria-level': 0,
    'aria-modal': 0,
    'aria-multiline': 0,
    'aria-multiselectable': 0,
    'aria-orientation': 0,
    'aria-placeholder': 0,
    'aria-pressed': 0,
    'aria-readonly': 0,
    'aria-required': 0,
    'aria-selected': 0,
    'aria-sort': 0,
    'aria-valuemax': 0,
    'aria-valuemin': 0,
    'aria-valuenow': 0,
    'aria-valuetext': 0,
    // Live Region Attributes
    'aria-atomic': 0,
    'aria-busy': 0,
    'aria-live': 0,
    'aria-relevant': 0,
    // Drag-and-Drop Attributes
    'aria-dropeffect': 0,
    'aria-grabbed': 0,
    // Relationship Attributes
    'aria-activedescendant': 0,
    'aria-colcount': 0,
    'aria-colindex': 0,
    'aria-colspan': 0,
    'aria-controls': 0,
    'aria-describedby': 0,
    'aria-errormessage': 0,
    'aria-flowto': 0,
    'aria-labelledby': 0,
    'aria-owns': 0,
    'aria-posinset': 0,
    'aria-rowcount': 0,
    'aria-rowindex': 0,
    'aria-rowspan': 0,
    'aria-setsize': 0
  };

  var warnedProperties = {};
  var rARIA = new RegExp('^(aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$');
  var rARIACamel = new RegExp('^(aria)[A-Z][' + ATTRIBUTE_NAME_CHAR + ']*$');
  var hasOwnProperty$1 = Object.prototype.hasOwnProperty;

  function validateProperty(tagName, name) {
    {
      if (hasOwnProperty$1.call(warnedProperties, name) && warnedProperties[name]) {
        return true;
      }

      if (rARIACamel.test(name)) {
        var ariaName = 'aria-' + name.slice(4).toLowerCase();
        var correctName = ariaProperties.hasOwnProperty(ariaName) ? ariaName : null; // If this is an aria-* attribute, but is not listed in the known DOM
        // DOM properties, then it is an invalid aria-* attribute.

        if (correctName == null) {
          error('Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.', name);

          warnedProperties[name] = true;
          return true;
        } // aria-* attributes should be lowercase; suggest the lowercase version.


        if (name !== correctName) {
          error('Invalid ARIA attribute `%s`. Did you mean `%s`?', name, correctName);

          warnedProperties[name] = true;
          return true;
        }
      }

      if (rARIA.test(name)) {
        var lowerCasedName = name.toLowerCase();
        var standardName = ariaProperties.hasOwnProperty(lowerCasedName) ? lowerCasedName : null; // If this is an aria-* attribute, but is not listed in the known DOM
        // DOM properties, then it is an invalid aria-* attribute.

        if (standardName == null) {
          warnedProperties[name] = true;
          return false;
        } // aria-* attributes should be lowercase; suggest the lowercase version.


        if (name !== standardName) {
          error('Unknown ARIA attribute `%s`. Did you mean `%s`?', name, standardName);

          warnedProperties[name] = true;
          return true;
        }
      }
    }

    return true;
  }

  function warnInvalidARIAProps(type, props) {
    {
      var invalidProps = [];

      for (var key in props) {
        var isValid = validateProperty(type, key);

        if (!isValid) {
          invalidProps.push(key);
        }
      }

      var unknownPropString = invalidProps.map(function (prop) {
        return '`' + prop + '`';
      }).join(', ');

      if (invalidProps.length === 1) {
        error('Invalid aria prop %s on <%s> tag. ' + 'For details, see https://fb.me/invalid-aria-prop', unknownPropString, type);
      } else if (invalidProps.length > 1) {
        error('Invalid aria props %s on <%s> tag. ' + 'For details, see https://fb.me/invalid-aria-prop', unknownPropString, type);
      }
    }
  }

  function validateProperties(type, props) {
    if (isCustomComponent(type, props)) {
      return;
    }

    warnInvalidARIAProps(type, props);
  }

  var didWarnValueNull = false;
  function validateProperties$1(type, props) {
    {
      if (type !== 'input' && type !== 'textarea' && type !== 'select') {
        return;
      }

      if (props != null && props.value === null && !didWarnValueNull) {
        didWarnValueNull = true;

        if (type === 'select' && props.multiple) {
          error('`value` prop on `%s` should not be null. ' + 'Consider using an empty array when `multiple` is set to `true` ' + 'to clear the component or `undefined` for uncontrolled components.', type);
        } else {
          error('`value` prop on `%s` should not be null. ' + 'Consider using an empty string to clear the component or `undefined` ' + 'for uncontrolled components.', type);
        }
      }
    }
  }

  var validateProperty$1 = function () {};

  {
    var warnedProperties$1 = {};
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var EVENT_NAME_REGEX = /^on./;
    var INVALID_EVENT_NAME_REGEX = /^on[^A-Z]/;
    var rARIA$1 = new RegExp('^(aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$');
    var rARIACamel$1 = new RegExp('^(aria)[A-Z][' + ATTRIBUTE_NAME_CHAR + ']*$');

    validateProperty$1 = function (tagName, name, value, canUseEventSystem) {
      if (_hasOwnProperty.call(warnedProperties$1, name) && warnedProperties$1[name]) {
        return true;
      }

      var lowerCasedName = name.toLowerCase();

      if (lowerCasedName === 'onfocusin' || lowerCasedName === 'onfocusout') {
        error('React uses onFocus and onBlur instead of onFocusIn and onFocusOut. ' + 'All React events are normalized to bubble, so onFocusIn and onFocusOut ' + 'are not needed/supported by React.');

        warnedProperties$1[name] = true;
        return true;
      } // We can't rely on the event system being injected on the server.


      if (canUseEventSystem) {
        if (registrationNameModules.hasOwnProperty(name)) {
          return true;
        }

        var registrationName = possibleRegistrationNames.hasOwnProperty(lowerCasedName) ? possibleRegistrationNames[lowerCasedName] : null;

        if (registrationName != null) {
          error('Invalid event handler property `%s`. Did you mean `%s`?', name, registrationName);

          warnedProperties$1[name] = true;
          return true;
        }

        if (EVENT_NAME_REGEX.test(name)) {
          error('Unknown event handler property `%s`. It will be ignored.', name);

          warnedProperties$1[name] = true;
          return true;
        }
      } else if (EVENT_NAME_REGEX.test(name)) {
        // If no event plugins have been injected, we are in a server environment.
        // So we can't tell if the event name is correct for sure, but we can filter
        // out known bad ones like `onclick`. We can't suggest a specific replacement though.
        if (INVALID_EVENT_NAME_REGEX.test(name)) {
          error('Invalid event handler property `%s`. ' + 'React events use the camelCase naming convention, for example `onClick`.', name);
        }

        warnedProperties$1[name] = true;
        return true;
      } // Let the ARIA attribute hook validate ARIA attributes


      if (rARIA$1.test(name) || rARIACamel$1.test(name)) {
        return true;
      }

      if (lowerCasedName === 'innerhtml') {
        error('Directly setting property `innerHTML` is not permitted. ' + 'For more information, lookup documentation on `dangerouslySetInnerHTML`.');

        warnedProperties$1[name] = true;
        return true;
      }

      if (lowerCasedName === 'aria') {
        error('The `aria` attribute is reserved for future use in React. ' + 'Pass individual `aria-` attributes instead.');

        warnedProperties$1[name] = true;
        return true;
      }

      if (lowerCasedName === 'is' && value !== null && value !== undefined && typeof value !== 'string') {
        error('Received a `%s` for a string attribute `is`. If this is expected, cast ' + 'the value to a string.', typeof value);

        warnedProperties$1[name] = true;
        return true;
      }

      if (typeof value === 'number' && isNaN(value)) {
        error('Received NaN for the `%s` attribute. If this is expected, cast ' + 'the value to a string.', name);

        warnedProperties$1[name] = true;
        return true;
      }

      var propertyInfo = getPropertyInfo(name);
      var isReserved = propertyInfo !== null && propertyInfo.type === RESERVED; // Known attributes should match the casing specified in the property config.

      if (possibleStandardNames.hasOwnProperty(lowerCasedName)) {
        var standardName = possibleStandardNames[lowerCasedName];

        if (standardName !== name) {
          error('Invalid DOM property `%s`. Did you mean `%s`?', name, standardName);

          warnedProperties$1[name] = true;
          return true;
        }
      } else if (!isReserved && name !== lowerCasedName) {
        // Unknown attributes should have lowercase casing since that's how they
        // will be cased anyway with server rendering.
        error('React does not recognize the `%s` prop on a DOM element. If you ' + 'intentionally want it to appear in the DOM as a custom ' + 'attribute, spell it as lowercase `%s` instead. ' + 'If you accidentally passed it from a parent component, remove ' + 'it from the DOM element.', name, lowerCasedName);

        warnedProperties$1[name] = true;
        return true;
      }

      if (typeof value === 'boolean' && shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
        if (value) {
          error('Received `%s` for a non-boolean attribute `%s`.\n\n' + 'If you want to write it to the DOM, pass a string instead: ' + '%s="%s" or %s={value.toString()}.', value, name, name, value, name);
        } else {
          error('Received `%s` for a non-boolean attribute `%s`.\n\n' + 'If you want to write it to the DOM, pass a string instead: ' + '%s="%s" or %s={value.toString()}.\n\n' + 'If you used to conditionally omit it with %s={condition && value}, ' + 'pass %s={condition ? value : undefined} instead.', value, name, name, value, name, name, name);
        }

        warnedProperties$1[name] = true;
        return true;
      } // Now that we've validated casing, do not validate
      // data types for reserved props


      if (isReserved) {
        return true;
      } // Warn when a known attribute is a bad type


      if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
        warnedProperties$1[name] = true;
        return false;
      } // Warn when passing the strings 'false' or 'true' into a boolean prop


      if ((value === 'false' || value === 'true') && propertyInfo !== null && propertyInfo.type === BOOLEAN) {
        error('Received the string `%s` for the boolean attribute `%s`. ' + '%s ' + 'Did you mean %s={%s}?', value, name, value === 'false' ? 'The browser will interpret it as a truthy value.' : 'Although this works, it will not work as expected if you pass the string "false".', name, value);

        warnedProperties$1[name] = true;
        return true;
      }

      return true;
    };
  }

  var warnUnknownProperties = function (type, props, canUseEventSystem) {
    {
      var unknownProps = [];

      for (var key in props) {
        var isValid = validateProperty$1(type, key, props[key], canUseEventSystem);

        if (!isValid) {
          unknownProps.push(key);
        }
      }

      var unknownPropString = unknownProps.map(function (prop) {
        return '`' + prop + '`';
      }).join(', ');

      if (unknownProps.length === 1) {
        error('Invalid value for prop %s on <%s> tag. Either remove it from the element, ' + 'or pass a string or number value to keep it in the DOM. ' + 'For details, see https://fb.me/react-attribute-behavior', unknownPropString, type);
      } else if (unknownProps.length > 1) {
        error('Invalid values for props %s on <%s> tag. Either remove them from the element, ' + 'or pass a string or number value to keep them in the DOM. ' + 'For details, see https://fb.me/react-attribute-behavior', unknownPropString, type);
      }
    }
  };

  function validateProperties$2(type, props, canUseEventSystem) {
    if (isCustomComponent(type, props)) {
      return;
    }

    warnUnknownProperties(type, props, canUseEventSystem);
  }

  var didWarnInvalidHydration = false;
  var DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
  var SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
  var SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
  var AUTOFOCUS = 'autoFocus';
  var CHILDREN = 'children';
  var STYLE = 'style';
  var HTML$1 = '__html';
  var HTML_NAMESPACE$1 = Namespaces.html;
  var warnedUnknownTags;
  var suppressHydrationWarning;
  var validatePropertiesInDevelopment;
  var warnForTextDifference;
  var warnForPropDifference;
  var warnForExtraAttributes;
  var warnForInvalidEventListener;
  var canDiffStyleForHydrationWarning;
  var normalizeMarkupForTextOrAttribute;
  var normalizeHTML;

  {
    warnedUnknownTags = {
      // Chrome is the only major browser not shipping <time>. But as of July
      // 2017 it intends to ship it due to widespread usage. We intentionally
      // *don't* warn for <time> even if it's unrecognized by Chrome because
      // it soon will be, and many apps have been using it anyway.
      time: true,
      // There are working polyfills for <dialog>. Let people use it.
      dialog: true,
      // Electron ships a custom <webview> tag to display external web content in
      // an isolated frame and process.
      // This tag is not present in non Electron environments such as JSDom which
      // is often used for testing purposes.
      // @see https://electronjs.org/docs/api/webview-tag
      webview: true
    };

    validatePropertiesInDevelopment = function (type, props) {
      validateProperties(type, props);
      validateProperties$1(type, props);
      validateProperties$2(type, props,
      /* canUseEventSystem */
      true);
    }; // IE 11 parses & normalizes the style attribute as opposed to other
    // browsers. It adds spaces and sorts the properties in some
    // non-alphabetical order. Handling that would require sorting CSS
    // properties in the client & server versions or applying
    // `expectedStyle` to a temporary DOM node to read its `style` attribute
    // normalized. Since it only affects IE, we're skipping style warnings
    // in that browser completely in favor of doing all that work.
    // See https://github.com/facebook/react/issues/11807


    canDiffStyleForHydrationWarning = canUseDOM && !document.documentMode; // HTML parsing normalizes CR and CRLF to LF.
    // It also can turn \u0000 into \uFFFD inside attributes.
    // https://www.w3.org/TR/html5/single-page.html#preprocessing-the-input-stream
    // If we have a mismatch, it might be caused by that.
    // We will still patch up in this case but not fire the warning.

    var NORMALIZE_NEWLINES_REGEX = /\r\n?/g;
    var NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;

    normalizeMarkupForTextOrAttribute = function (markup) {
      var markupString = typeof markup === 'string' ? markup : '' + markup;
      return markupString.replace(NORMALIZE_NEWLINES_REGEX, '\n').replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, '');
    };

    warnForTextDifference = function (serverText, clientText) {
      if (didWarnInvalidHydration) {
        return;
      }

      var normalizedClientText = normalizeMarkupForTextOrAttribute(clientText);
      var normalizedServerText = normalizeMarkupForTextOrAttribute(serverText);

      if (normalizedServerText === normalizedClientText) {
        return;
      }

      didWarnInvalidHydration = true;

      error('Text content did not match. Server: "%s" Client: "%s"', normalizedServerText, normalizedClientText);
    };

    warnForPropDifference = function (propName, serverValue, clientValue) {
      if (didWarnInvalidHydration) {
        return;
      }

      var normalizedClientValue = normalizeMarkupForTextOrAttribute(clientValue);
      var normalizedServerValue = normalizeMarkupForTextOrAttribute(serverValue);

      if (normalizedServerValue === normalizedClientValue) {
        return;
      }

      didWarnInvalidHydration = true;

      error('Prop `%s` did not match. Server: %s Client: %s', propName, JSON.stringify(normalizedServerValue), JSON.stringify(normalizedClientValue));
    };

    warnForExtraAttributes = function (attributeNames) {
      if (didWarnInvalidHydration) {
        return;
      }

      didWarnInvalidHydration = true;
      var names = [];
      attributeNames.forEach(function (name) {
        names.push(name);
      });

      error('Extra attributes from the server: %s', names);
    };

    warnForInvalidEventListener = function (registrationName, listener) {
      if (listener === false) {
        error('Expected `%s` listener to be a function, instead got `false`.\n\n' + 'If you used to conditionally omit it with %s={condition && value}, ' + 'pass %s={condition ? value : undefined} instead.', registrationName, registrationName, registrationName);
      } else {
        error('Expected `%s` listener to be a function, instead got a value of `%s` type.', registrationName, typeof listener);
      }
    }; // Parse the HTML and read it back to normalize the HTML string so that it
    // can be used for comparison.


    normalizeHTML = function (parent, html) {
      // We could have created a separate document here to avoid
      // re-initializing custom elements if they exist. But this breaks
      // how <noscript> is being handled. So we use the same document.
      // See the discussion in https://github.com/facebook/react/pull/11157.
      var testElement = parent.namespaceURI === HTML_NAMESPACE$1 ? parent.ownerDocument.createElement(parent.tagName) : parent.ownerDocument.createElementNS(parent.namespaceURI, parent.tagName);
      testElement.innerHTML = html;
      return testElement.innerHTML;
    };
  }

  function ensureListeningTo(rootContainerElement, registrationName) {
    var isDocumentOrFragment = rootContainerElement.nodeType === DOCUMENT_NODE || rootContainerElement.nodeType === DOCUMENT_FRAGMENT_NODE;
    var doc = isDocumentOrFragment ? rootContainerElement : rootContainerElement.ownerDocument;
    legacyListenToEvent(registrationName, doc);
  }

  function getOwnerDocumentFromRootContainer(rootContainerElement) {
    return rootContainerElement.nodeType === DOCUMENT_NODE ? rootContainerElement : rootContainerElement.ownerDocument;
  }

  function noop() {}

  function trapClickOnNonInteractiveElement(node) {
    // Mobile Safari does not fire properly bubble click events on
    // non-interactive elements, which means delegated click listeners do not
    // fire. The workaround for this bug involves attaching an empty click
    // listener on the target node.
    // http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
    // Just set it using the onclick property so that we don't have to manage any
    // bookkeeping for it. Not sure if we need to clear it when the listener is
    // removed.
    // TODO: Only do this for the relevant Safaris maybe?
    node.onclick = noop;
  }

  function setInitialDOMProperties(tag, domElement, rootContainerElement, nextProps, isCustomComponentTag) {
    for (var propKey in nextProps) {
      if (!nextProps.hasOwnProperty(propKey)) {
        continue;
      }

      var nextProp = nextProps[propKey];

      if (propKey === STYLE) {
        {
          if (nextProp) {
            // Freeze the next style object so that we can assume it won't be
            // mutated. We have already warned for this in the past.
            Object.freeze(nextProp);
          }
        } // Relies on `updateStylesByID` not mutating `styleUpdates`.


        setValueForStyles(domElement, nextProp);
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
        var nextHtml = nextProp ? nextProp[HTML$1] : undefined;

        if (nextHtml != null) {
          setInnerHTML(domElement, nextHtml);
        }
      } else if (propKey === CHILDREN) {
        if (typeof nextProp === 'string') {
          // Avoid setting initial textContent when the text is empty. In IE11 setting
          // textContent on a <textarea> will cause the placeholder to not
          // show within the <textarea> until it has been focused and blurred again.
          // https://github.com/facebook/react/issues/6731#issuecomment-254874553
          var canSetTextContent = tag !== 'textarea' || nextProp !== '';

          if (canSetTextContent) {
            setTextContent(domElement, nextProp);
          }
        } else if (typeof nextProp === 'number') {
          setTextContent(domElement, '' + nextProp);
        }
      } else if ( propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING) ; else if (propKey === AUTOFOCUS) ; else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (nextProp != null) {
          if ( typeof nextProp !== 'function') {
            warnForInvalidEventListener(propKey, nextProp);
          }

          ensureListeningTo(rootContainerElement, propKey);
        }
      } else if (nextProp != null) {
        setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag);
      }
    }
  }

  function updateDOMProperties(domElement, updatePayload, wasCustomComponentTag, isCustomComponentTag) {
    // TODO: Handle wasCustomComponentTag
    for (var i = 0; i < updatePayload.length; i += 2) {
      var propKey = updatePayload[i];
      var propValue = updatePayload[i + 1];

      if (propKey === STYLE) {
        setValueForStyles(domElement, propValue);
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
        setInnerHTML(domElement, propValue);
      } else if (propKey === CHILDREN) {
        setTextContent(domElement, propValue);
      } else {
        setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
      }
    }
  }

  function createElement(type, props, rootContainerElement, parentNamespace) {
    var isCustomComponentTag; // We create tags in the namespace of their parent container, except HTML
    // tags get no namespace.

    var ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
    var domElement;
    var namespaceURI = parentNamespace;

    if (namespaceURI === HTML_NAMESPACE$1) {
      namespaceURI = getIntrinsicNamespace(type);
    }

    if (namespaceURI === HTML_NAMESPACE$1) {
      {
        isCustomComponentTag = isCustomComponent(type, props); // Should this check be gated by parent namespace? Not sure we want to
        // allow <SVG> or <mATH>.

        if (!isCustomComponentTag && type !== type.toLowerCase()) {
          error('<%s /> is using incorrect casing. ' + 'Use PascalCase for React components, ' + 'or lowercase for HTML elements.', type);
        }
      }

      if (type === 'script') {
        // Create the script via .innerHTML so its "parser-inserted" flag is
        // set to true and it does not execute
        var div = ownerDocument.createElement('div');

        div.innerHTML = '<script><' + '/script>'; // eslint-disable-line
        // This is guaranteed to yield a script element.

        var firstChild = div.firstChild;
        domElement = div.removeChild(firstChild);
      } else if (typeof props.is === 'string') {
        // $FlowIssue `createElement` should be updated for Web Components
        domElement = ownerDocument.createElement(type, {
          is: props.is
        });
      } else {
        // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
        // See discussion in https://github.com/facebook/react/pull/6896
        // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
        domElement = ownerDocument.createElement(type); // Normally attributes are assigned in `setInitialDOMProperties`, however the `multiple` and `size`
        // attributes on `select`s needs to be added before `option`s are inserted.
        // This prevents:
        // - a bug where the `select` does not scroll to the correct option because singular
        //  `select` elements automatically pick the first item #13222
        // - a bug where the `select` set the first item as selected despite the `size` attribute #14239
        // See https://github.com/facebook/react/issues/13222
        // and https://github.com/facebook/react/issues/14239

        if (type === 'select') {
          var node = domElement;

          if (props.multiple) {
            node.multiple = true;
          } else if (props.size) {
            // Setting a size greater than 1 causes a select to behave like `multiple=true`, where
            // it is possible that no option is selected.
            //
            // This is only necessary when a select in "single selection mode".
            node.size = props.size;
          }
        }
      }
    } else {
      domElement = ownerDocument.createElementNS(namespaceURI, type);
    }

    {
      if (namespaceURI === HTML_NAMESPACE$1) {
        if (!isCustomComponentTag && Object.prototype.toString.call(domElement) === '[object HTMLUnknownElement]' && !Object.prototype.hasOwnProperty.call(warnedUnknownTags, type)) {
          warnedUnknownTags[type] = true;

          error('The tag <%s> is unrecognized in this browser. ' + 'If you meant to render a React component, start its name with ' + 'an uppercase letter.', type);
        }
      }
    }

    return domElement;
  }
  function createTextNode(text, rootContainerElement) {
    return getOwnerDocumentFromRootContainer(rootContainerElement).createTextNode(text);
  }
  function setInitialProperties(domElement, tag, rawProps, rootContainerElement) {
    var isCustomComponentTag = isCustomComponent(tag, rawProps);

    {
      validatePropertiesInDevelopment(tag, rawProps);
    } // TODO: Make sure that we check isMounted before firing any of these events.


    var props;

    switch (tag) {
      case 'iframe':
      case 'object':
      case 'embed':
        trapBubbledEvent(TOP_LOAD, domElement);
        props = rawProps;
        break;

      case 'video':
      case 'audio':
        // Create listener for each media event
        for (var i = 0; i < mediaEventTypes.length; i++) {
          trapBubbledEvent(mediaEventTypes[i], domElement);
        }

        props = rawProps;
        break;

      case 'source':
        trapBubbledEvent(TOP_ERROR, domElement);
        props = rawProps;
        break;

      case 'img':
      case 'image':
      case 'link':
        trapBubbledEvent(TOP_ERROR, domElement);
        trapBubbledEvent(TOP_LOAD, domElement);
        props = rawProps;
        break;

      case 'form':
        trapBubbledEvent(TOP_RESET, domElement);
        trapBubbledEvent(TOP_SUBMIT, domElement);
        props = rawProps;
        break;

      case 'details':
        trapBubbledEvent(TOP_TOGGLE, domElement);
        props = rawProps;
        break;

      case 'input':
        initWrapperState(domElement, rawProps);
        props = getHostProps(domElement, rawProps);
        trapBubbledEvent(TOP_INVALID, domElement); // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.

        ensureListeningTo(rootContainerElement, 'onChange');
        break;

      case 'option':
        validateProps(domElement, rawProps);
        props = getHostProps$1(domElement, rawProps);
        break;

      case 'select':
        initWrapperState$1(domElement, rawProps);
        props = getHostProps$2(domElement, rawProps);
        trapBubbledEvent(TOP_INVALID, domElement); // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.

        ensureListeningTo(rootContainerElement, 'onChange');
        break;

      case 'textarea':
        initWrapperState$2(domElement, rawProps);
        props = getHostProps$3(domElement, rawProps);
        trapBubbledEvent(TOP_INVALID, domElement); // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.

        ensureListeningTo(rootContainerElement, 'onChange');
        break;

      default:
        props = rawProps;
    }

    assertValidProps(tag, props);
    setInitialDOMProperties(tag, domElement, rootContainerElement, props, isCustomComponentTag);

    switch (tag) {
      case 'input':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        track(domElement);
        postMountWrapper(domElement, rawProps, false);
        break;

      case 'textarea':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        track(domElement);
        postMountWrapper$3(domElement);
        break;

      case 'option':
        postMountWrapper$1(domElement, rawProps);
        break;

      case 'select':
        postMountWrapper$2(domElement, rawProps);
        break;

      default:
        if (typeof props.onClick === 'function') {
          // TODO: This cast may not be sound for SVG, MathML or custom elements.
          trapClickOnNonInteractiveElement(domElement);
        }

        break;
    }
  } // Calculate the diff between the two objects.

  function diffProperties(domElement, tag, lastRawProps, nextRawProps, rootContainerElement) {
    {
      validatePropertiesInDevelopment(tag, nextRawProps);
    }

    var updatePayload = null;
    var lastProps;
    var nextProps;

    switch (tag) {
      case 'input':
        lastProps = getHostProps(domElement, lastRawProps);
        nextProps = getHostProps(domElement, nextRawProps);
        updatePayload = [];
        break;

      case 'option':
        lastProps = getHostProps$1(domElement, lastRawProps);
        nextProps = getHostProps$1(domElement, nextRawProps);
        updatePayload = [];
        break;

      case 'select':
        lastProps = getHostProps$2(domElement, lastRawProps);
        nextProps = getHostProps$2(domElement, nextRawProps);
        updatePayload = [];
        break;

      case 'textarea':
        lastProps = getHostProps$3(domElement, lastRawProps);
        nextProps = getHostProps$3(domElement, nextRawProps);
        updatePayload = [];
        break;

      default:
        lastProps = lastRawProps;
        nextProps = nextRawProps;

        if (typeof lastProps.onClick !== 'function' && typeof nextProps.onClick === 'function') {
          // TODO: This cast may not be sound for SVG, MathML or custom elements.
          trapClickOnNonInteractiveElement(domElement);
        }

        break;
    }

    assertValidProps(tag, nextProps);
    var propKey;
    var styleName;
    var styleUpdates = null;

    for (propKey in lastProps) {
      if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey) || lastProps[propKey] == null) {
        continue;
      }

      if (propKey === STYLE) {
        var lastStyle = lastProps[propKey];

        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            if (!styleUpdates) {
              styleUpdates = {};
            }

            styleUpdates[styleName] = '';
          }
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML || propKey === CHILDREN) ; else if ( propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING) ; else if (propKey === AUTOFOCUS) ; else if (registrationNameModules.hasOwnProperty(propKey)) {
        // This is a special case. If any listener updates we need to ensure
        // that the "current" fiber pointer gets updated so we need a commit
        // to update this element.
        if (!updatePayload) {
          updatePayload = [];
        }
      } else {
        // For all other deleted properties we add it to the queue. We use
        // the whitelist in the commit phase instead.
        (updatePayload = updatePayload || []).push(propKey, null);
      }
    }

    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp = lastProps != null ? lastProps[propKey] : undefined;

      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || nextProp == null && lastProp == null) {
        continue;
      }

      if (propKey === STYLE) {
        {
          if (nextProp) {
            // Freeze the next style object so that we can assume it won't be
            // mutated. We have already warned for this in the past.
            Object.freeze(nextProp);
          }
        }

        if (lastProp) {
          // Unset styles on `lastProp` but not on `nextProp`.
          for (styleName in lastProp) {
            if (lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
              if (!styleUpdates) {
                styleUpdates = {};
              }

              styleUpdates[styleName] = '';
            }
          } // Update styles that changed since `lastProp`.


          for (styleName in nextProp) {
            if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]) {
              if (!styleUpdates) {
                styleUpdates = {};
              }

              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          if (!styleUpdates) {
            if (!updatePayload) {
              updatePayload = [];
            }

            updatePayload.push(propKey, styleUpdates);
          }

          styleUpdates = nextProp;
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
        var nextHtml = nextProp ? nextProp[HTML$1] : undefined;
        var lastHtml = lastProp ? lastProp[HTML$1] : undefined;

        if (nextHtml != null) {
          if (lastHtml !== nextHtml) {
            (updatePayload = updatePayload || []).push(propKey, nextHtml);
          }
        }
      } else if (propKey === CHILDREN) {
        if (lastProp !== nextProp && (typeof nextProp === 'string' || typeof nextProp === 'number')) {
          (updatePayload = updatePayload || []).push(propKey, '' + nextProp);
        }
      } else if ( propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING) ; else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (nextProp != null) {
          // We eagerly listen to this even though we haven't committed yet.
          if ( typeof nextProp !== 'function') {
            warnForInvalidEventListener(propKey, nextProp);
          }

          ensureListeningTo(rootContainerElement, propKey);
        }

        if (!updatePayload && lastProp !== nextProp) {
          // This is a special case. If any listener updates we need to ensure
          // that the "current" props pointer gets updated so we need a commit
          // to update this element.
          updatePayload = [];
        }
      } else {
        // For any other property we always add it to the queue and then we
        // filter it out using the whitelist during the commit.
        (updatePayload = updatePayload || []).push(propKey, nextProp);
      }
    }

    if (styleUpdates) {
      {
        validateShorthandPropertyCollisionInDev(styleUpdates, nextProps[STYLE]);
      }

      (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
    }

    return updatePayload;
  } // Apply the diff.

  function updateProperties(domElement, updatePayload, tag, lastRawProps, nextRawProps) {
    // Update checked *before* name.
    // In the middle of an update, it is possible to have multiple checked.
    // When a checked radio tries to change name, browser makes another radio's checked false.
    if (tag === 'input' && nextRawProps.type === 'radio' && nextRawProps.name != null) {
      updateChecked(domElement, nextRawProps);
    }

    var wasCustomComponentTag = isCustomComponent(tag, lastRawProps);
    var isCustomComponentTag = isCustomComponent(tag, nextRawProps); // Apply the diff.

    updateDOMProperties(domElement, updatePayload, wasCustomComponentTag, isCustomComponentTag); // TODO: Ensure that an update gets scheduled if any of the special props
    // changed.

    switch (tag) {
      case 'input':
        // Update the wrapper around inputs *after* updating props. This has to
        // happen after `updateDOMProperties`. Otherwise HTML5 input validations
        // raise warnings and prevent the new value from being assigned.
        updateWrapper(domElement, nextRawProps);
        break;

      case 'textarea':
        updateWrapper$1(domElement, nextRawProps);
        break;

      case 'select':
        // <select> value update needs to occur after <option> children
        // reconciliation
        postUpdateWrapper(domElement, nextRawProps);
        break;
    }
  }

  function getPossibleStandardName(propName) {
    {
      var lowerCasedName = propName.toLowerCase();

      if (!possibleStandardNames.hasOwnProperty(lowerCasedName)) {
        return null;
      }

      return possibleStandardNames[lowerCasedName] || null;
    }
  }

  function diffHydratedProperties(domElement, tag, rawProps, parentNamespace, rootContainerElement) {
    var isCustomComponentTag;
    var extraAttributeNames;

    {
      suppressHydrationWarning = rawProps[SUPPRESS_HYDRATION_WARNING] === true;
      isCustomComponentTag = isCustomComponent(tag, rawProps);
      validatePropertiesInDevelopment(tag, rawProps);
    } // TODO: Make sure that we check isMounted before firing any of these events.


    switch (tag) {
      case 'iframe':
      case 'object':
      case 'embed':
        trapBubbledEvent(TOP_LOAD, domElement);
        break;

      case 'video':
      case 'audio':
        // Create listener for each media event
        for (var i = 0; i < mediaEventTypes.length; i++) {
          trapBubbledEvent(mediaEventTypes[i], domElement);
        }

        break;

      case 'source':
        trapBubbledEvent(TOP_ERROR, domElement);
        break;

      case 'img':
      case 'image':
      case 'link':
        trapBubbledEvent(TOP_ERROR, domElement);
        trapBubbledEvent(TOP_LOAD, domElement);
        break;

      case 'form':
        trapBubbledEvent(TOP_RESET, domElement);
        trapBubbledEvent(TOP_SUBMIT, domElement);
        break;

      case 'details':
        trapBubbledEvent(TOP_TOGGLE, domElement);
        break;

      case 'input':
        initWrapperState(domElement, rawProps);
        trapBubbledEvent(TOP_INVALID, domElement); // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.

        ensureListeningTo(rootContainerElement, 'onChange');
        break;

      case 'option':
        validateProps(domElement, rawProps);
        break;

      case 'select':
        initWrapperState$1(domElement, rawProps);
        trapBubbledEvent(TOP_INVALID, domElement); // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.

        ensureListeningTo(rootContainerElement, 'onChange');
        break;

      case 'textarea':
        initWrapperState$2(domElement, rawProps);
        trapBubbledEvent(TOP_INVALID, domElement); // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.

        ensureListeningTo(rootContainerElement, 'onChange');
        break;
    }

    assertValidProps(tag, rawProps);

    {
      extraAttributeNames = new Set();
      var attributes = domElement.attributes;

      for (var _i = 0; _i < attributes.length; _i++) {
        var name = attributes[_i].name.toLowerCase();

        switch (name) {
          // Built-in SSR attribute is whitelisted
          case 'data-reactroot':
            break;
          // Controlled attributes are not validated
          // TODO: Only ignore them on controlled tags.

          case 'value':
            break;

          case 'checked':
            break;

          case 'selected':
            break;

          default:
            // Intentionally use the original name.
            // See discussion in https://github.com/facebook/react/pull/10676.
            extraAttributeNames.add(attributes[_i].name);
        }
      }
    }

    var updatePayload = null;

    for (var propKey in rawProps) {
      if (!rawProps.hasOwnProperty(propKey)) {
        continue;
      }

      var nextProp = rawProps[propKey];

      if (propKey === CHILDREN) {
        // For text content children we compare against textContent. This
        // might match additional HTML that is hidden when we read it using
        // textContent. E.g. "foo" will match "f<span>oo</span>" but that still
        // satisfies our requirement. Our requirement is not to produce perfect
        // HTML and attributes. Ideally we should preserve structure but it's
        // ok not to if the visible content is still enough to indicate what
        // even listeners these nodes might be wired up to.
        // TODO: Warn if there is more than a single textNode as a child.
        // TODO: Should we use domElement.firstChild.nodeValue to compare?
        if (typeof nextProp === 'string') {
          if (domElement.textContent !== nextProp) {
            if ( !suppressHydrationWarning) {
              warnForTextDifference(domElement.textContent, nextProp);
            }

            updatePayload = [CHILDREN, nextProp];
          }
        } else if (typeof nextProp === 'number') {
          if (domElement.textContent !== '' + nextProp) {
            if ( !suppressHydrationWarning) {
              warnForTextDifference(domElement.textContent, nextProp);
            }

            updatePayload = [CHILDREN, '' + nextProp];
          }
        }
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (nextProp != null) {
          if ( typeof nextProp !== 'function') {
            warnForInvalidEventListener(propKey, nextProp);
          }

          ensureListeningTo(rootContainerElement, propKey);
        }
      } else if ( // Convince Flow we've calculated it (it's DEV-only in this method.)
      typeof isCustomComponentTag === 'boolean') {
        // Validate that the properties correspond to their expected values.
        var serverValue = void 0;
        var propertyInfo = getPropertyInfo(propKey);

        if (suppressHydrationWarning) ; else if ( propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING || // Controlled attributes are not validated
        // TODO: Only ignore them on controlled tags.
        propKey === 'value' || propKey === 'checked' || propKey === 'selected') ; else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
          var serverHTML = domElement.innerHTML;
          var nextHtml = nextProp ? nextProp[HTML$1] : undefined;
          var expectedHTML = normalizeHTML(domElement, nextHtml != null ? nextHtml : '');

          if (expectedHTML !== serverHTML) {
            warnForPropDifference(propKey, serverHTML, expectedHTML);
          }
        } else if (propKey === STYLE) {
          // $FlowFixMe - Should be inferred as not undefined.
          extraAttributeNames.delete(propKey);

          if (canDiffStyleForHydrationWarning) {
            var expectedStyle = createDangerousStringForStyles(nextProp);
            serverValue = domElement.getAttribute('style');

            if (expectedStyle !== serverValue) {
              warnForPropDifference(propKey, serverValue, expectedStyle);
            }
          }
        } else if (isCustomComponentTag) {
          // $FlowFixMe - Should be inferred as not undefined.
          extraAttributeNames.delete(propKey.toLowerCase());
          serverValue = getValueForAttribute(domElement, propKey, nextProp);

          if (nextProp !== serverValue) {
            warnForPropDifference(propKey, serverValue, nextProp);
          }
        } else if (!shouldIgnoreAttribute(propKey, propertyInfo, isCustomComponentTag) && !shouldRemoveAttribute(propKey, nextProp, propertyInfo, isCustomComponentTag)) {
          var isMismatchDueToBadCasing = false;

          if (propertyInfo !== null) {
            // $FlowFixMe - Should be inferred as not undefined.
            extraAttributeNames.delete(propertyInfo.attributeName);
            serverValue = getValueForProperty(domElement, propKey, nextProp, propertyInfo);
          } else {
            var ownNamespace = parentNamespace;

            if (ownNamespace === HTML_NAMESPACE$1) {
              ownNamespace = getIntrinsicNamespace(tag);
            }

            if (ownNamespace === HTML_NAMESPACE$1) {
              // $FlowFixMe - Should be inferred as not undefined.
              extraAttributeNames.delete(propKey.toLowerCase());
            } else {
              var standardName = getPossibleStandardName(propKey);

              if (standardName !== null && standardName !== propKey) {
                // If an SVG prop is supplied with bad casing, it will
                // be successfully parsed from HTML, but will produce a mismatch
                // (and would be incorrectly rendered on the client).
                // However, we already warn about bad casing elsewhere.
                // So we'll skip the misleading extra mismatch warning in this case.
                isMismatchDueToBadCasing = true; // $FlowFixMe - Should be inferred as not undefined.

                extraAttributeNames.delete(standardName);
              } // $FlowFixMe - Should be inferred as not undefined.


              extraAttributeNames.delete(propKey);
            }

            serverValue = getValueForAttribute(domElement, propKey, nextProp);
          }

          if (nextProp !== serverValue && !isMismatchDueToBadCasing) {
            warnForPropDifference(propKey, serverValue, nextProp);
          }
        }
      }
    }

    {
      // $FlowFixMe - Should be inferred as not undefined.
      if (extraAttributeNames.size > 0 && !suppressHydrationWarning) {
        // $FlowFixMe - Should be inferred as not undefined.
        warnForExtraAttributes(extraAttributeNames);
      }
    }

    switch (tag) {
      case 'input':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        track(domElement);
        postMountWrapper(domElement, rawProps, true);
        break;

      case 'textarea':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        track(domElement);
        postMountWrapper$3(domElement);
        break;

      case 'select':
      case 'option':
        // For input and textarea we current always set the value property at
        // post mount to force it to diverge from attributes. However, for
        // option and select we don't quite do the same thing and select
        // is not resilient to the DOM state changing so we don't do that here.
        // TODO: Consider not doing this for input and textarea.
        break;

      default:
        if (typeof rawProps.onClick === 'function') {
          // TODO: This cast may not be sound for SVG, MathML or custom elements.
          trapClickOnNonInteractiveElement(domElement);
        }

        break;
    }

    return updatePayload;
  }
  function diffHydratedText(textNode, text) {
    var isDifferent = textNode.nodeValue !== text;
    return isDifferent;
  }
  function warnForUnmatchedText(textNode, text) {
    {
      warnForTextDifference(textNode.nodeValue, text);
    }
  }
  function warnForDeletedHydratableElement(parentNode, child) {
    {
      if (didWarnInvalidHydration) {
        return;
      }

      didWarnInvalidHydration = true;

      error('Did not expect server HTML to contain a <%s> in <%s>.', child.nodeName.toLowerCase(), parentNode.nodeName.toLowerCase());
    }
  }
  function warnForDeletedHydratableText(parentNode, child) {
    {
      if (didWarnInvalidHydration) {
        return;
      }

      didWarnInvalidHydration = true;

      error('Did not expect server HTML to contain the text node "%s" in <%s>.', child.nodeValue, parentNode.nodeName.toLowerCase());
    }
  }
  function warnForInsertedHydratedElement(parentNode, tag, props) {
    {
      if (didWarnInvalidHydration) {
        return;
      }

      didWarnInvalidHydration = true;

      error('Expected server HTML to contain a matching <%s> in <%s>.', tag, parentNode.nodeName.toLowerCase());
    }
  }
  function warnForInsertedHydratedText(parentNode, text) {
    {
      if (text === '') {
        // We expect to insert empty text nodes since they're not represented in
        // the HTML.
        // TODO: Remove this special case if we can just avoid inserting empty
        // text nodes.
        return;
      }

      if (didWarnInvalidHydration) {
        return;
      }

      didWarnInvalidHydration = true;

      error('Expected server HTML to contain a matching text node for "%s" in <%s>.', text, parentNode.nodeName.toLowerCase());
    }
  }
  function restoreControlledState$3(domElement, tag, props) {
    switch (tag) {
      case 'input':
        restoreControlledState(domElement, props);
        return;

      case 'textarea':
        restoreControlledState$2(domElement, props);
        return;

      case 'select':
        restoreControlledState$1(domElement, props);
        return;
    }
  }

  function getActiveElement(doc) {
    doc = doc || (typeof document !== 'undefined' ? document : undefined);

    if (typeof doc === 'undefined') {
      return null;
    }

    try {
      return doc.activeElement || doc.body;
    } catch (e) {
      return doc.body;
    }
  }

  /**
   * Given any node return the first leaf node without children.
   *
   * @param {DOMElement|DOMTextNode} node
   * @return {DOMElement|DOMTextNode}
   */

  function getLeafNode(node) {
    while (node && node.firstChild) {
      node = node.firstChild;
    }

    return node;
  }
  /**
   * Get the next sibling within a container. This will walk up the
   * DOM if a node's siblings have been exhausted.
   *
   * @param {DOMElement|DOMTextNode} node
   * @return {?DOMElement|DOMTextNode}
   */


  function getSiblingNode(node) {
    while (node) {
      if (node.nextSibling) {
        return node.nextSibling;
      }

      node = node.parentNode;
    }
  }
  /**
   * Get object describing the nodes which contain characters at offset.
   *
   * @param {DOMElement|DOMTextNode} root
   * @param {number} offset
   * @return {?object}
   */


  function getNodeForCharacterOffset(root, offset) {
    var node = getLeafNode(root);
    var nodeStart = 0;
    var nodeEnd = 0;

    while (node) {
      if (node.nodeType === TEXT_NODE) {
        nodeEnd = nodeStart + node.textContent.length;

        if (nodeStart <= offset && nodeEnd >= offset) {
          return {
            node: node,
            offset: offset - nodeStart
          };
        }

        nodeStart = nodeEnd;
      }

      node = getLeafNode(getSiblingNode(node));
    }
  }

  /**
   * @param {DOMElement} outerNode
   * @return {?object}
   */

  function getOffsets(outerNode) {
    var ownerDocument = outerNode.ownerDocument;
    var win = ownerDocument && ownerDocument.defaultView || window;
    var selection = win.getSelection && win.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    var anchorNode = selection.anchorNode,
        anchorOffset = selection.anchorOffset,
        focusNode = selection.focusNode,
        focusOffset = selection.focusOffset; // In Firefox, anchorNode and focusNode can be "anonymous divs", e.g. the
    // up/down buttons on an <input type="number">. Anonymous divs do not seem to
    // expose properties, triggering a "Permission denied error" if any of its
    // properties are accessed. The only seemingly possible way to avoid erroring
    // is to access a property that typically works for non-anonymous divs and
    // catch any error that may otherwise arise. See
    // https://bugzilla.mozilla.org/show_bug.cgi?id=208427

    try {
      /* eslint-disable no-unused-expressions */
      anchorNode.nodeType;
      focusNode.nodeType;
      /* eslint-enable no-unused-expressions */
    } catch (e) {
      return null;
    }

    return getModernOffsetsFromPoints(outerNode, anchorNode, anchorOffset, focusNode, focusOffset);
  }
  /**
   * Returns {start, end} where `start` is the character/codepoint index of
   * (anchorNode, anchorOffset) within the textContent of `outerNode`, and
   * `end` is the index of (focusNode, focusOffset).
   *
   * Returns null if you pass in garbage input but we should probably just crash.
   *
   * Exported only for testing.
   */

  function getModernOffsetsFromPoints(outerNode, anchorNode, anchorOffset, focusNode, focusOffset) {
    var length = 0;
    var start = -1;
    var end = -1;
    var indexWithinAnchor = 0;
    var indexWithinFocus = 0;
    var node = outerNode;
    var parentNode = null;

    outer: while (true) {
      var next = null;

      while (true) {
        if (node === anchorNode && (anchorOffset === 0 || node.nodeType === TEXT_NODE)) {
          start = length + anchorOffset;
        }

        if (node === focusNode && (focusOffset === 0 || node.nodeType === TEXT_NODE)) {
          end = length + focusOffset;
        }

        if (node.nodeType === TEXT_NODE) {
          length += node.nodeValue.length;
        }

        if ((next = node.firstChild) === null) {
          break;
        } // Moving from `node` to its first child `next`.


        parentNode = node;
        node = next;
      }

      while (true) {
        if (node === outerNode) {
          // If `outerNode` has children, this is always the second time visiting
          // it. If it has no children, this is still the first loop, and the only
          // valid selection is anchorNode and focusNode both equal to this node
          // and both offsets 0, in which case we will have handled above.
          break outer;
        }

        if (parentNode === anchorNode && ++indexWithinAnchor === anchorOffset) {
          start = length;
        }

        if (parentNode === focusNode && ++indexWithinFocus === focusOffset) {
          end = length;
        }

        if ((next = node.nextSibling) !== null) {
          break;
        }

        node = parentNode;
        parentNode = node.parentNode;
      } // Moving from `node` to its next sibling `next`.


      node = next;
    }

    if (start === -1 || end === -1) {
      // This should never happen. (Would happen if the anchor/focus nodes aren't
      // actually inside the passed-in node.)
      return null;
    }

    return {
      start: start,
      end: end
    };
  }
  /**
   * In modern non-IE browsers, we can support both forward and backward
   * selections.
   *
   * Note: IE10+ supports the Selection object, but it does not support
   * the `extend` method, which means that even in modern IE, it's not possible
   * to programmatically create a backward selection. Thus, for all IE
   * versions, we use the old IE API to create our selections.
   *
   * @param {DOMElement|DOMTextNode} node
   * @param {object} offsets
   */

  function setOffsets(node, offsets) {
    var doc = node.ownerDocument || document;
    var win = doc && doc.defaultView || window; // Edge fails with "Object expected" in some scenarios.
    // (For instance: TinyMCE editor used in a list component that supports pasting to add more,
    // fails when pasting 100+ items)

    if (!win.getSelection) {
      return;
    }

    var selection = win.getSelection();
    var length = node.textContent.length;
    var start = Math.min(offsets.start, length);
    var end = offsets.end === undefined ? start : Math.min(offsets.end, length); // IE 11 uses modern selection, but doesn't support the extend method.
    // Flip backward selections, so we can set with a single range.

    if (!selection.extend && start > end) {
      var temp = end;
      end = start;
      start = temp;
    }

    var startMarker = getNodeForCharacterOffset(node, start);
    var endMarker = getNodeForCharacterOffset(node, end);

    if (startMarker && endMarker) {
      if (selection.rangeCount === 1 && selection.anchorNode === startMarker.node && selection.anchorOffset === startMarker.offset && selection.focusNode === endMarker.node && selection.focusOffset === endMarker.offset) {
        return;
      }

      var range = doc.createRange();
      range.setStart(startMarker.node, startMarker.offset);
      selection.removeAllRanges();

      if (start > end) {
        selection.addRange(range);
        selection.extend(endMarker.node, endMarker.offset);
      } else {
        range.setEnd(endMarker.node, endMarker.offset);
        selection.addRange(range);
      }
    }
  }

  function isTextNode(node) {
    return node && node.nodeType === TEXT_NODE;
  }

  function containsNode(outerNode, innerNode) {
    if (!outerNode || !innerNode) {
      return false;
    } else if (outerNode === innerNode) {
      return true;
    } else if (isTextNode(outerNode)) {
      return false;
    } else if (isTextNode(innerNode)) {
      return containsNode(outerNode, innerNode.parentNode);
    } else if ('contains' in outerNode) {
      return outerNode.contains(innerNode);
    } else if (outerNode.compareDocumentPosition) {
      return !!(outerNode.compareDocumentPosition(innerNode) & 16);
    } else {
      return false;
    }
  }

  function isInDocument(node) {
    return node && node.ownerDocument && containsNode(node.ownerDocument.documentElement, node);
  }

  function isSameOriginFrame(iframe) {
    try {
      // Accessing the contentDocument of a HTMLIframeElement can cause the browser
      // to throw, e.g. if it has a cross-origin src attribute.
      // Safari will show an error in the console when the access results in "Blocked a frame with origin". e.g:
      // iframe.contentDocument.defaultView;
      // A safety way is to access one of the cross origin properties: Window or Location
      // Which might result in "SecurityError" DOM Exception and it is compatible to Safari.
      // https://html.spec.whatwg.org/multipage/browsers.html#integration-with-idl
      return typeof iframe.contentWindow.location.href === 'string';
    } catch (err) {
      return false;
    }
  }

  function getActiveElementDeep() {
    var win = window;
    var element = getActiveElement();

    while (element instanceof win.HTMLIFrameElement) {
      if (isSameOriginFrame(element)) {
        win = element.contentWindow;
      } else {
        return element;
      }

      element = getActiveElement(win.document);
    }

    return element;
  }
  /**
   * @ReactInputSelection: React input selection module. Based on Selection.js,
   * but modified to be suitable for react and has a couple of bug fixes (doesn't
   * assume buttons have range selections allowed).
   * Input selection module for React.
   */

  /**
   * @hasSelectionCapabilities: we get the element types that support selection
   * from https://html.spec.whatwg.org/#do-not-apply, looking at `selectionStart`
   * and `selectionEnd` rows.
   */


  function hasSelectionCapabilities(elem) {
    var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
    return nodeName && (nodeName === 'input' && (elem.type === 'text' || elem.type === 'search' || elem.type === 'tel' || elem.type === 'url' || elem.type === 'password') || nodeName === 'textarea' || elem.contentEditable === 'true');
  }
  function getSelectionInformation() {
    var focusedElem = getActiveElementDeep();
    return {
      // Used by Flare
      activeElementDetached: null,
      focusedElem: focusedElem,
      selectionRange: hasSelectionCapabilities(focusedElem) ? getSelection(focusedElem) : null
    };
  }
  /**
   * @restoreSelection: If any selection information was potentially lost,
   * restore it. This is useful when performing operations that could remove dom
   * nodes and place them back in, resulting in focus being lost.
   */

  function restoreSelection(priorSelectionInformation) {
    var curFocusedElem = getActiveElementDeep();
    var priorFocusedElem = priorSelectionInformation.focusedElem;
    var priorSelectionRange = priorSelectionInformation.selectionRange;

    if (curFocusedElem !== priorFocusedElem && isInDocument(priorFocusedElem)) {
      if (priorSelectionRange !== null && hasSelectionCapabilities(priorFocusedElem)) {
        setSelection(priorFocusedElem, priorSelectionRange);
      } // Focusing a node can change the scroll position, which is undesirable


      var ancestors = [];
      var ancestor = priorFocusedElem;

      while (ancestor = ancestor.parentNode) {
        if (ancestor.nodeType === ELEMENT_NODE) {
          ancestors.push({
            element: ancestor,
            left: ancestor.scrollLeft,
            top: ancestor.scrollTop
          });
        }
      }

      if (typeof priorFocusedElem.focus === 'function') {
        priorFocusedElem.focus();
      }

      for (var i = 0; i < ancestors.length; i++) {
        var info = ancestors[i];
        info.element.scrollLeft = info.left;
        info.element.scrollTop = info.top;
      }
    }
  }
  /**
   * @getSelection: Gets the selection bounds of a focused textarea, input or
   * contentEditable node.
   * -@input: Look up selection bounds of this input
   * -@return {start: selectionStart, end: selectionEnd}
   */

  function getSelection(input) {
    var selection;

    if ('selectionStart' in input) {
      // Modern browser with input or textarea.
      selection = {
        start: input.selectionStart,
        end: input.selectionEnd
      };
    } else {
      // Content editable or old IE textarea.
      selection = getOffsets(input);
    }

    return selection || {
      start: 0,
      end: 0
    };
  }
  /**
   * @setSelection: Sets the selection bounds of a textarea or input and focuses
   * the input.
   * -@input     Set selection bounds of this input or textarea
   * -@offsets   Object of same form that is returned from get*
   */

  function setSelection(input, offsets) {
    var start = offsets.start,
        end = offsets.end;

    if (end === undefined) {
      end = start;
    }

    if ('selectionStart' in input) {
      input.selectionStart = start;
      input.selectionEnd = Math.min(end, input.value.length);
    } else {
      setOffsets(input, offsets);
    }
  }

  var validateDOMNesting = function () {};

  var updatedAncestorInfo = function () {};

  {
    // This validation code was written based on the HTML5 parsing spec:
    // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-scope
    //
    // Note: this does not catch all invalid nesting, nor does it try to (as it's
    // not clear what practical benefit doing so provides); instead, we warn only
    // for cases where the parser will give a parse tree differing from what React
    // intended. For example, <b><div></div></b> is invalid but we don't warn
    // because it still parses correctly; we do warn for other cases like nested
    // <p> tags where the beginning of the second element implicitly closes the
    // first, causing a confusing mess.
    // https://html.spec.whatwg.org/multipage/syntax.html#special
    var specialTags = ['address', 'applet', 'area', 'article', 'aside', 'base', 'basefont', 'bgsound', 'blockquote', 'body', 'br', 'button', 'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dir', 'div', 'dl', 'dt', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'iframe', 'img', 'input', 'isindex', 'li', 'link', 'listing', 'main', 'marquee', 'menu', 'menuitem', 'meta', 'nav', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'p', 'param', 'plaintext', 'pre', 'script', 'section', 'select', 'source', 'style', 'summary', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul', 'wbr', 'xmp']; // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-scope

    var inScopeTags = ['applet', 'caption', 'html', 'table', 'td', 'th', 'marquee', 'object', 'template', // https://html.spec.whatwg.org/multipage/syntax.html#html-integration-point
    // TODO: Distinguish by namespace here -- for <title>, including it here
    // errs on the side of fewer warnings
    'foreignObject', 'desc', 'title']; // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-button-scope

    var buttonScopeTags = inScopeTags.concat(['button']); // https://html.spec.whatwg.org/multipage/syntax.html#generate-implied-end-tags

    var impliedEndTags = ['dd', 'dt', 'li', 'option', 'optgroup', 'p', 'rp', 'rt'];
    var emptyAncestorInfo = {
      current: null,
      formTag: null,
      aTagInScope: null,
      buttonTagInScope: null,
      nobrTagInScope: null,
      pTagInButtonScope: null,
      listItemTagAutoclosing: null,
      dlItemTagAutoclosing: null
    };

    updatedAncestorInfo = function (oldInfo, tag) {
      var ancestorInfo = _assign({}, oldInfo || emptyAncestorInfo);

      var info = {
        tag: tag
      };

      if (inScopeTags.indexOf(tag) !== -1) {
        ancestorInfo.aTagInScope = null;
        ancestorInfo.buttonTagInScope = null;
        ancestorInfo.nobrTagInScope = null;
      }

      if (buttonScopeTags.indexOf(tag) !== -1) {
        ancestorInfo.pTagInButtonScope = null;
      } // See rules for 'li', 'dd', 'dt' start tags in
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody


      if (specialTags.indexOf(tag) !== -1 && tag !== 'address' && tag !== 'div' && tag !== 'p') {
        ancestorInfo.listItemTagAutoclosing = null;
        ancestorInfo.dlItemTagAutoclosing = null;
      }

      ancestorInfo.current = info;

      if (tag === 'form') {
        ancestorInfo.formTag = info;
      }

      if (tag === 'a') {
        ancestorInfo.aTagInScope = info;
      }

      if (tag === 'button') {
        ancestorInfo.buttonTagInScope = info;
      }

      if (tag === 'nobr') {
        ancestorInfo.nobrTagInScope = info;
      }

      if (tag === 'p') {
        ancestorInfo.pTagInButtonScope = info;
      }

      if (tag === 'li') {
        ancestorInfo.listItemTagAutoclosing = info;
      }

      if (tag === 'dd' || tag === 'dt') {
        ancestorInfo.dlItemTagAutoclosing = info;
      }

      return ancestorInfo;
    };
    /**
     * Returns whether
     */


    var isTagValidWithParent = function (tag, parentTag) {
      // First, let's check if we're in an unusual parsing mode...
      switch (parentTag) {
        // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inselect
        case 'select':
          return tag === 'option' || tag === 'optgroup' || tag === '#text';

        case 'optgroup':
          return tag === 'option' || tag === '#text';
        // Strictly speaking, seeing an <option> doesn't mean we're in a <select>
        // but

        case 'option':
          return tag === '#text';
        // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intd
        // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-incaption
        // No special behavior since these rules fall back to "in body" mode for
        // all except special table nodes which cause bad parsing behavior anyway.
        // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intr

        case 'tr':
          return tag === 'th' || tag === 'td' || tag === 'style' || tag === 'script' || tag === 'template';
        // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intbody

        case 'tbody':
        case 'thead':
        case 'tfoot':
          return tag === 'tr' || tag === 'style' || tag === 'script' || tag === 'template';
        // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-incolgroup

        case 'colgroup':
          return tag === 'col' || tag === 'template';
        // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intable

        case 'table':
          return tag === 'caption' || tag === 'colgroup' || tag === 'tbody' || tag === 'tfoot' || tag === 'thead' || tag === 'style' || tag === 'script' || tag === 'template';
        // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inhead

        case 'head':
          return tag === 'base' || tag === 'basefont' || tag === 'bgsound' || tag === 'link' || tag === 'meta' || tag === 'title' || tag === 'noscript' || tag === 'noframes' || tag === 'style' || tag === 'script' || tag === 'template';
        // https://html.spec.whatwg.org/multipage/semantics.html#the-html-element

        case 'html':
          return tag === 'head' || tag === 'body' || tag === 'frameset';

        case 'frameset':
          return tag === 'frame';

        case '#document':
          return tag === 'html';
      } // Probably in the "in body" parsing mode, so we outlaw only tag combos
      // where the parsing rules cause implicit opens or closes to be added.
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody


      switch (tag) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return parentTag !== 'h1' && parentTag !== 'h2' && parentTag !== 'h3' && parentTag !== 'h4' && parentTag !== 'h5' && parentTag !== 'h6';

        case 'rp':
        case 'rt':
          return impliedEndTags.indexOf(parentTag) === -1;

        case 'body':
        case 'caption':
        case 'col':
        case 'colgroup':
        case 'frameset':
        case 'frame':
        case 'head':
        case 'html':
        case 'tbody':
        case 'td':
        case 'tfoot':
        case 'th':
        case 'thead':
        case 'tr':
          // These tags are only valid with a few parents that have special child
          // parsing rules -- if we're down here, then none of those matched and
          // so we allow it only if we don't know what the parent is, as all other
          // cases are invalid.
          return parentTag == null;
      }

      return true;
    };
    /**
     * Returns whether
     */


    var findInvalidAncestorForTag = function (tag, ancestorInfo) {
      switch (tag) {
        case 'address':
        case 'article':
        case 'aside':
        case 'blockquote':
        case 'center':
        case 'details':
        case 'dialog':
        case 'dir':
        case 'div':
        case 'dl':
        case 'fieldset':
        case 'figcaption':
        case 'figure':
        case 'footer':
        case 'header':
        case 'hgroup':
        case 'main':
        case 'menu':
        case 'nav':
        case 'ol':
        case 'p':
        case 'section':
        case 'summary':
        case 'ul':
        case 'pre':
        case 'listing':
        case 'table':
        case 'hr':
        case 'xmp':
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return ancestorInfo.pTagInButtonScope;

        case 'form':
          return ancestorInfo.formTag || ancestorInfo.pTagInButtonScope;

        case 'li':
          return ancestorInfo.listItemTagAutoclosing;

        case 'dd':
        case 'dt':
          return ancestorInfo.dlItemTagAutoclosing;

        case 'button':
          return ancestorInfo.buttonTagInScope;

        case 'a':
          // Spec says something about storing a list of markers, but it sounds
          // equivalent to this check.
          return ancestorInfo.aTagInScope;

        case 'nobr':
          return ancestorInfo.nobrTagInScope;
      }

      return null;
    };

    var didWarn$1 = {};

    validateDOMNesting = function (childTag, childText, ancestorInfo) {
      ancestorInfo = ancestorInfo || emptyAncestorInfo;
      var parentInfo = ancestorInfo.current;
      var parentTag = parentInfo && parentInfo.tag;

      if (childText != null) {
        if (childTag != null) {
          error('validateDOMNesting: when childText is passed, childTag should be null');
        }

        childTag = '#text';
      }

      var invalidParent = isTagValidWithParent(childTag, parentTag) ? null : parentInfo;
      var invalidAncestor = invalidParent ? null : findInvalidAncestorForTag(childTag, ancestorInfo);
      var invalidParentOrAncestor = invalidParent || invalidAncestor;

      if (!invalidParentOrAncestor) {
        return;
      }

      var ancestorTag = invalidParentOrAncestor.tag;
      var addendum = getCurrentFiberStackInDev();
      var warnKey = !!invalidParent + '|' + childTag + '|' + ancestorTag + '|' + addendum;

      if (didWarn$1[warnKey]) {
        return;
      }

      didWarn$1[warnKey] = true;
      var tagDisplayName = childTag;
      var whitespaceInfo = '';

      if (childTag === '#text') {
        if (/\S/.test(childText)) {
          tagDisplayName = 'Text nodes';
        } else {
          tagDisplayName = 'Whitespace text nodes';
          whitespaceInfo = " Make sure you don't have any extra whitespace between tags on " + 'each line of your source code.';
        }
      } else {
        tagDisplayName = '<' + childTag + '>';
      }

      if (invalidParent) {
        var info = '';

        if (ancestorTag === 'table' && childTag === 'tr') {
          info += ' Add a <tbody>, <thead> or <tfoot> to your code to match the DOM tree generated by ' + 'the browser.';
        }

        error('validateDOMNesting(...): %s cannot appear as a child of <%s>.%s%s', tagDisplayName, ancestorTag, whitespaceInfo, info);
      } else {
        error('validateDOMNesting(...): %s cannot appear as a descendant of ' + '<%s>.', tagDisplayName, ancestorTag);
      }
    };
  }

  var SUPPRESS_HYDRATION_WARNING$1;

  {
    SUPPRESS_HYDRATION_WARNING$1 = 'suppressHydrationWarning';
  }

  var SUSPENSE_START_DATA = '$';
  var SUSPENSE_END_DATA = '/$';
  var SUSPENSE_PENDING_START_DATA = '$?';
  var SUSPENSE_FALLBACK_START_DATA = '$!';
  var STYLE$1 = 'style';
  var eventsEnabled = null;
  var selectionInformation = null;

  function shouldAutoFocusHostComponent(type, props) {
    switch (type) {
      case 'button':
      case 'input':
      case 'select':
      case 'textarea':
        return !!props.autoFocus;
    }

    return false;
  }
  function getRootHostContext(rootContainerInstance) {
    var type;
    var namespace;
    var nodeType = rootContainerInstance.nodeType;

    switch (nodeType) {
      case DOCUMENT_NODE:
      case DOCUMENT_FRAGMENT_NODE:
        {
          type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
          var root = rootContainerInstance.documentElement;
          namespace = root ? root.namespaceURI : getChildNamespace(null, '');
          break;
        }

      default:
        {
          var container = nodeType === COMMENT_NODE ? rootContainerInstance.parentNode : rootContainerInstance;
          var ownNamespace = container.namespaceURI || null;
          type = container.tagName;
          namespace = getChildNamespace(ownNamespace, type);
          break;
        }
    }

    {
      var validatedTag = type.toLowerCase();
      var ancestorInfo = updatedAncestorInfo(null, validatedTag);
      return {
        namespace: namespace,
        ancestorInfo: ancestorInfo
      };
    }
  }
  function getChildHostContext(parentHostContext, type, rootContainerInstance) {
    {
      var parentHostContextDev = parentHostContext;
      var namespace = getChildNamespace(parentHostContextDev.namespace, type);
      var ancestorInfo = updatedAncestorInfo(parentHostContextDev.ancestorInfo, type);
      return {
        namespace: namespace,
        ancestorInfo: ancestorInfo
      };
    }
  }
  function getPublicInstance(instance) {
    return instance;
  }
  function prepareForCommit(containerInfo) {
    eventsEnabled = isEnabled();
    selectionInformation = getSelectionInformation();
    setEnabled(false);
  }
  function resetAfterCommit(containerInfo) {
    restoreSelection(selectionInformation);
    setEnabled(eventsEnabled);
    eventsEnabled = null;

    selectionInformation = null;
  }
  function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
    var parentNamespace;

    {
      // TODO: take namespace into account when validating.
      var hostContextDev = hostContext;
      validateDOMNesting(type, null, hostContextDev.ancestorInfo);

      if (typeof props.children === 'string' || typeof props.children === 'number') {
        var string = '' + props.children;
        var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type);
        validateDOMNesting(null, string, ownAncestorInfo);
      }

      parentNamespace = hostContextDev.namespace;
    }

    var domElement = createElement(type, props, rootContainerInstance, parentNamespace);
    precacheFiberNode(internalInstanceHandle, domElement);
    updateFiberProps(domElement, props);
    return domElement;
  }
  function appendInitialChild(parentInstance, child) {
    parentInstance.appendChild(child);
  }
  function finalizeInitialChildren(domElement, type, props, rootContainerInstance, hostContext) {
    setInitialProperties(domElement, type, props, rootContainerInstance);
    return shouldAutoFocusHostComponent(type, props);
  }
  function prepareUpdate(domElement, type, oldProps, newProps, rootContainerInstance, hostContext) {
    {
      var hostContextDev = hostContext;

      if (typeof newProps.children !== typeof oldProps.children && (typeof newProps.children === 'string' || typeof newProps.children === 'number')) {
        var string = '' + newProps.children;
        var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type);
        validateDOMNesting(null, string, ownAncestorInfo);
      }
    }

    return diffProperties(domElement, type, oldProps, newProps, rootContainerInstance);
  }
  function shouldSetTextContent(type, props) {
    return type === 'textarea' || type === 'option' || type === 'noscript' || typeof props.children === 'string' || typeof props.children === 'number' || typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML !== null && props.dangerouslySetInnerHTML.__html != null;
  }
  function shouldDeprioritizeSubtree(type, props) {
    return !!props.hidden;
  }
  function createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
    {
      var hostContextDev = hostContext;
      validateDOMNesting(null, text, hostContextDev.ancestorInfo);
    }

    var textNode = createTextNode(text, rootContainerInstance);
    precacheFiberNode(internalInstanceHandle, textNode);
    return textNode;
  }
  // if a component just imports ReactDOM (e.g. for findDOMNode).
  // Some environments might not have setTimeout or clearTimeout.

  var scheduleTimeout = typeof setTimeout === 'function' ? setTimeout : undefined;
  var cancelTimeout = typeof clearTimeout === 'function' ? clearTimeout : undefined;
  var noTimeout = -1; // -------------------
  function commitMount(domElement, type, newProps, internalInstanceHandle) {
    // Despite the naming that might imply otherwise, this method only
    // fires if there is an `Update` effect scheduled during mounting.
    // This happens if `finalizeInitialChildren` returns `true` (which it
    // does to implement the `autoFocus` attribute on the client). But
    // there are also other cases when this might happen (such as patching
    // up text content during hydration mismatch). So we'll check this again.
    if (shouldAutoFocusHostComponent(type, newProps)) {
      domElement.focus();
    }
  }
  function commitUpdate(domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
    // Update the props handle so that we know which props are the ones with
    // with current event handlers.
    updateFiberProps(domElement, newProps); // Apply the diff to the DOM node.

    updateProperties(domElement, updatePayload, type, oldProps, newProps);
  }
  function resetTextContent(domElement) {
    setTextContent(domElement, '');
  }
  function commitTextUpdate(textInstance, oldText, newText) {
    textInstance.nodeValue = newText;
  }
  function appendChild(parentInstance, child) {
    parentInstance.appendChild(child);
  }
  function appendChildToContainer(container, child) {
    var parentNode;

    if (container.nodeType === COMMENT_NODE) {
      parentNode = container.parentNode;
      parentNode.insertBefore(child, container);
    } else {
      parentNode = container;
      parentNode.appendChild(child);
    } // This container might be used for a portal.
    // If something inside a portal is clicked, that click should bubble
    // through the React tree. However, on Mobile Safari the click would
    // never bubble through the *DOM* tree unless an ancestor with onclick
    // event exists. So we wouldn't see it and dispatch it.
    // This is why we ensure that non React root containers have inline onclick
    // defined.
    // https://github.com/facebook/react/issues/11918


    var reactRootContainer = container._reactRootContainer;

    if ((reactRootContainer === null || reactRootContainer === undefined) && parentNode.onclick === null) {
      // TODO: This cast may not be sound for SVG, MathML or custom elements.
      trapClickOnNonInteractiveElement(parentNode);
    }
  }
  function insertBefore(parentInstance, child, beforeChild) {
    parentInstance.insertBefore(child, beforeChild);
  }
  function insertInContainerBefore(container, child, beforeChild) {
    if (container.nodeType === COMMENT_NODE) {
      container.parentNode.insertBefore(child, beforeChild);
    } else {
      container.insertBefore(child, beforeChild);
    }
  }
  function removeChild(parentInstance, child) {
    parentInstance.removeChild(child);
  }
  function removeChildFromContainer(container, child) {
    if (container.nodeType === COMMENT_NODE) {
      container.parentNode.removeChild(child);
    } else {
      container.removeChild(child);
    }
  }

  function hideInstance(instance) {
    // pass host context to this method?


    instance = instance;
    var style = instance.style;

    if (typeof style.setProperty === 'function') {
      style.setProperty('display', 'none', 'important');
    } else {
      style.display = 'none';
    }
  }
  function hideTextInstance(textInstance) {
    textInstance.nodeValue = '';
  }
  function unhideInstance(instance, props) {
    instance = instance;
    var styleProp = props[STYLE$1];
    var display = styleProp !== undefined && styleProp !== null && styleProp.hasOwnProperty('display') ? styleProp.display : null;
    instance.style.display = dangerousStyleValue('display', display);
  }
  function unhideTextInstance(textInstance, text) {
    textInstance.nodeValue = text;
  } // -------------------
  function canHydrateInstance(instance, type, props) {
    if (instance.nodeType !== ELEMENT_NODE || type.toLowerCase() !== instance.nodeName.toLowerCase()) {
      return null;
    } // This has now been refined to an element node.


    return instance;
  }
  function canHydrateTextInstance(instance, text) {
    if (text === '' || instance.nodeType !== TEXT_NODE) {
      // Empty strings are not parsed by HTML so there won't be a correct match here.
      return null;
    } // This has now been refined to a text node.


    return instance;
  }
  function isSuspenseInstancePending(instance) {
    return instance.data === SUSPENSE_PENDING_START_DATA;
  }
  function isSuspenseInstanceFallback(instance) {
    return instance.data === SUSPENSE_FALLBACK_START_DATA;
  }

  function getNextHydratable(node) {
    // Skip non-hydratable nodes.
    for (; node != null; node = node.nextSibling) {
      var nodeType = node.nodeType;

      if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
        break;
      }
    }

    return node;
  }

  function getNextHydratableSibling(instance) {
    return getNextHydratable(instance.nextSibling);
  }
  function getFirstHydratableChild(parentInstance) {
    return getNextHydratable(parentInstance.firstChild);
  }
  function hydrateInstance(instance, type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
    precacheFiberNode(internalInstanceHandle, instance); // TODO: Possibly defer this until the commit phase where all the events
    // get attached.

    updateFiberProps(instance, props);
    var parentNamespace;

    {
      var hostContextDev = hostContext;
      parentNamespace = hostContextDev.namespace;
    }

    return diffHydratedProperties(instance, type, props, parentNamespace, rootContainerInstance);
  }
  function hydrateTextInstance(textInstance, text, internalInstanceHandle) {
    precacheFiberNode(internalInstanceHandle, textInstance);
    return diffHydratedText(textInstance, text);
  }
  function getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance) {
    var node = suspenseInstance.nextSibling; // Skip past all nodes within this suspense boundary.
    // There might be nested nodes so we need to keep track of how
    // deep we are and only break out when we're back on top.

    var depth = 0;

    while (node) {
      if (node.nodeType === COMMENT_NODE) {
        var data = node.data;

        if (data === SUSPENSE_END_DATA) {
          if (depth === 0) {
            return getNextHydratableSibling(node);
          } else {
            depth--;
          }
        } else if (data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA) {
          depth++;
        }
      }

      node = node.nextSibling;
    } // TODO: Warn, we didn't find the end comment boundary.


    return null;
  } // Returns the SuspenseInstance if this node is a direct child of a
  // SuspenseInstance. I.e. if its previous sibling is a Comment with
  // SUSPENSE_x_START_DATA. Otherwise, null.

  function getParentSuspenseInstance(targetInstance) {
    var node = targetInstance.previousSibling; // Skip past all nodes within this suspense boundary.
    // There might be nested nodes so we need to keep track of how
    // deep we are and only break out when we're back on top.

    var depth = 0;

    while (node) {
      if (node.nodeType === COMMENT_NODE) {
        var data = node.data;

        if (data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA) {
          if (depth === 0) {
            return node;
          } else {
            depth--;
          }
        } else if (data === SUSPENSE_END_DATA) {
          depth++;
        }
      }

      node = node.previousSibling;
    }

    return null;
  }
  function commitHydratedContainer(container) {
    // Retry if any event replaying was blocked on this.
    retryIfBlockedOn(container);
  }
  function commitHydratedSuspenseInstance(suspenseInstance) {
    // Retry if any event replaying was blocked on this.
    retryIfBlockedOn(suspenseInstance);
  }
  function didNotMatchHydratedContainerTextInstance(parentContainer, textInstance, text) {
    {
      warnForUnmatchedText(textInstance, text);
    }
  }
  function didNotMatchHydratedTextInstance(parentType, parentProps, parentInstance, textInstance, text) {
    if ( parentProps[SUPPRESS_HYDRATION_WARNING$1] !== true) {
      warnForUnmatchedText(textInstance, text);
    }
  }
  function didNotHydrateContainerInstance(parentContainer, instance) {
    {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentContainer, instance);
      } else if (instance.nodeType === COMMENT_NODE) ; else {
        warnForDeletedHydratableText(parentContainer, instance);
      }
    }
  }
  function didNotHydrateInstance(parentType, parentProps, parentInstance, instance) {
    if ( parentProps[SUPPRESS_HYDRATION_WARNING$1] !== true) {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentInstance, instance);
      } else if (instance.nodeType === COMMENT_NODE) ; else {
        warnForDeletedHydratableText(parentInstance, instance);
      }
    }
  }
  function didNotFindHydratableContainerInstance(parentContainer, type, props) {
    {
      warnForInsertedHydratedElement(parentContainer, type);
    }
  }
  function didNotFindHydratableContainerTextInstance(parentContainer, text) {
    {
      warnForInsertedHydratedText(parentContainer, text);
    }
  }
  function didNotFindHydratableInstance(parentType, parentProps, parentInstance, type, props) {
    if ( parentProps[SUPPRESS_HYDRATION_WARNING$1] !== true) {
      warnForInsertedHydratedElement(parentInstance, type);
    }
  }
  function didNotFindHydratableTextInstance(parentType, parentProps, parentInstance, text) {
    if ( parentProps[SUPPRESS_HYDRATION_WARNING$1] !== true) {
      warnForInsertedHydratedText(parentInstance, text);
    }
  }
  function didNotFindHydratableSuspenseInstance(parentType, parentProps, parentInstance) {
    if ( parentProps[SUPPRESS_HYDRATION_WARNING$1] !== true) ;
  }

  var randomKey = Math.random().toString(36).slice(2);
  var internalInstanceKey = '__reactInternalInstance$' + randomKey;
  var internalEventHandlersKey = '__reactEventHandlers$' + randomKey;
  var internalContainerInstanceKey = '__reactContainere$' + randomKey;
  function precacheFiberNode(hostInst, node) {
    node[internalInstanceKey] = hostInst;
  }
  function markContainerAsRoot(hostRoot, node) {
    node[internalContainerInstanceKey] = hostRoot;
  }
  function unmarkContainerAsRoot(node) {
    node[internalContainerInstanceKey] = null;
  }
  function isContainerMarkedAsRoot(node) {
    return !!node[internalContainerInstanceKey];
  } // Given a DOM node, return the closest HostComponent or HostText fiber ancestor.
  // If the target node is part of a hydrated or not yet rendered subtree, then
  // this may also return a SuspenseComponent or HostRoot to indicate that.
  // Conceptually the HostRoot fiber is a child of the Container node. So if you
  // pass the Container node as the targetNode, you will not actually get the
  // HostRoot back. To get to the HostRoot, you need to pass a child of it.
  // The same thing applies to Suspense boundaries.

  function getClosestInstanceFromNode(targetNode) {
    var targetInst = targetNode[internalInstanceKey];

    if (targetInst) {
      // Don't return HostRoot or SuspenseComponent here.
      return targetInst;
    } // If the direct event target isn't a React owned DOM node, we need to look
    // to see if one of its parents is a React owned DOM node.


    var parentNode = targetNode.parentNode;

    while (parentNode) {
      // We'll check if this is a container root that could include
      // React nodes in the future. We need to check this first because
      // if we're a child of a dehydrated container, we need to first
      // find that inner container before moving on to finding the parent
      // instance. Note that we don't check this field on  the targetNode
      // itself because the fibers are conceptually between the container
      // node and the first child. It isn't surrounding the container node.
      // If it's not a container, we check if it's an instance.
      targetInst = parentNode[internalContainerInstanceKey] || parentNode[internalInstanceKey];

      if (targetInst) {
        // Since this wasn't the direct target of the event, we might have
        // stepped past dehydrated DOM nodes to get here. However they could
        // also have been non-React nodes. We need to answer which one.
        // If we the instance doesn't have any children, then there can't be
        // a nested suspense boundary within it. So we can use this as a fast
        // bailout. Most of the time, when people add non-React children to
        // the tree, it is using a ref to a child-less DOM node.
        // Normally we'd only need to check one of the fibers because if it
        // has ever gone from having children to deleting them or vice versa
        // it would have deleted the dehydrated boundary nested inside already.
        // However, since the HostRoot starts out with an alternate it might
        // have one on the alternate so we need to check in case this was a
        // root.
        var alternate = targetInst.alternate;

        if (targetInst.child !== null || alternate !== null && alternate.child !== null) {
          // Next we need to figure out if the node that skipped past is
          // nested within a dehydrated boundary and if so, which one.
          var suspenseInstance = getParentSuspenseInstance(targetNode);

          while (suspenseInstance !== null) {
            // We found a suspense instance. That means that we haven't
            // hydrated it yet. Even though we leave the comments in the
            // DOM after hydrating, and there are boundaries in the DOM
            // that could already be hydrated, we wouldn't have found them
            // through this pass since if the target is hydrated it would
            // have had an internalInstanceKey on it.
            // Let's get the fiber associated with the SuspenseComponent
            // as the deepest instance.
            var targetSuspenseInst = suspenseInstance[internalInstanceKey];

            if (targetSuspenseInst) {
              return targetSuspenseInst;
            } // If we don't find a Fiber on the comment, it might be because
            // we haven't gotten to hydrate it yet. There might still be a
            // parent boundary that hasn't above this one so we need to find
            // the outer most that is known.


            suspenseInstance = getParentSuspenseInstance(suspenseInstance); // If we don't find one, then that should mean that the parent
            // host component also hasn't hydrated yet. We can return it
            // below since it will bail out on the isMounted check later.
          }
        }

        return targetInst;
      }

      targetNode = parentNode;
      parentNode = targetNode.parentNode;
    }

    return null;
  }
  /**
   * Given a DOM node, return the ReactDOMComponent or ReactDOMTextComponent
   * instance, or null if the node was not rendered by this React.
   */

  function getInstanceFromNode$1(node) {
    var inst = node[internalInstanceKey] || node[internalContainerInstanceKey];

    if (inst) {
      if (inst.tag === HostComponent || inst.tag === HostText || inst.tag === SuspenseComponent || inst.tag === HostRoot) {
        return inst;
      } else {
        return null;
      }
    }

    return null;
  }
  /**
   * Given a ReactDOMComponent or ReactDOMTextComponent, return the corresponding
   * DOM node.
   */

  function getNodeFromInstance$1(inst) {
    if (inst.tag === HostComponent || inst.tag === HostText) {
      // In Fiber this, is just the state node right now. We assume it will be
      // a host component or host text.
      return inst.stateNode;
    } // Without this first invariant, passing a non-DOM-component triggers the next
    // invariant for a missing parent, which is super confusing.


    {
      {
        throw Error( "getNodeFromInstance: Invalid argument." );
      }
    }
  }
  function getFiberCurrentPropsFromNode$1(node) {
    return node[internalEventHandlersKey] || null;
  }
  function updateFiberProps(node, props) {
    node[internalEventHandlersKey] = props;
  }

  function getParent(inst) {
    do {
      inst = inst.return; // TODO: If this is a HostRoot we might want to bail out.
      // That is depending on if we want nested subtrees (layers) to bubble
      // events to their parent. We could also go through parentNode on the
      // host node but that wouldn't work for React Native and doesn't let us
      // do the portal feature.
    } while (inst && inst.tag !== HostComponent);

    if (inst) {
      return inst;
    }

    return null;
  }
  /**
   * Return the lowest common ancestor of A and B, or null if they are in
   * different trees.
   */


  function getLowestCommonAncestor(instA, instB) {
    var depthA = 0;

    for (var tempA = instA; tempA; tempA = getParent(tempA)) {
      depthA++;
    }

    var depthB = 0;

    for (var tempB = instB; tempB; tempB = getParent(tempB)) {
      depthB++;
    } // If A is deeper, crawl up.


    while (depthA - depthB > 0) {
      instA = getParent(instA);
      depthA--;
    } // If B is deeper, crawl up.


    while (depthB - depthA > 0) {
      instB = getParent(instB);
      depthB--;
    } // Walk in lockstep until we find a match.


    var depth = depthA;

    while (depth--) {
      if (instA === instB || instA === instB.alternate) {
        return instA;
      }

      instA = getParent(instA);
      instB = getParent(instB);
    }

    return null;
  }
  /**
   * Simulates the traversal of a two-phase, capture/bubble event dispatch.
   */

  function traverseTwoPhase(inst, fn, arg) {
    var path = [];

    while (inst) {
      path.push(inst);
      inst = getParent(inst);
    }

    var i;

    for (i = path.length; i-- > 0;) {
      fn(path[i], 'captured', arg);
    }

    for (i = 0; i < path.length; i++) {
      fn(path[i], 'bubbled', arg);
    }
  }
  /**
   * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
   * should would receive a `mouseEnter` or `mouseLeave` event.
   *
   * Does not invoke the callback on the nearest common ancestor because nothing
   * "entered" or "left" that element.
   */

  function traverseEnterLeave(from, to, fn, argFrom, argTo) {
    var common = from && to ? getLowestCommonAncestor(from, to) : null;
    var pathFrom = [];

    while (true) {
      if (!from) {
        break;
      }

      if (from === common) {
        break;
      }

      var alternate = from.alternate;

      if (alternate !== null && alternate === common) {
        break;
      }

      pathFrom.push(from);
      from = getParent(from);
    }

    var pathTo = [];

    while (true) {
      if (!to) {
        break;
      }

      if (to === common) {
        break;
      }

      var _alternate = to.alternate;

      if (_alternate !== null && _alternate === common) {
        break;
      }

      pathTo.push(to);
      to = getParent(to);
    }

    for (var i = 0; i < pathFrom.length; i++) {
      fn(pathFrom[i], 'bubbled', argFrom);
    }

    for (var _i = pathTo.length; _i-- > 0;) {
      fn(pathTo[_i], 'captured', argTo);
    }
  }

  function isInteractive(tag) {
    return tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea';
  }

  function shouldPreventMouseEvent(name, type, props) {
    switch (name) {
      case 'onClick':
      case 'onClickCapture':
      case 'onDoubleClick':
      case 'onDoubleClickCapture':
      case 'onMouseDown':
      case 'onMouseDownCapture':
      case 'onMouseMove':
      case 'onMouseMoveCapture':
      case 'onMouseUp':
      case 'onMouseUpCapture':
      case 'onMouseEnter':
        return !!(props.disabled && isInteractive(type));

      default:
        return false;
    }
  }
  /**
   * @param {object} inst The instance, which is the source of events.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @return {?function} The stored callback.
   */


  function getListener(inst, registrationName) {
    var listener; // TODO: shouldPreventMouseEvent is DOM-specific and definitely should not
    // live here; needs to be moved to a better place soon

    var stateNode = inst.stateNode;

    if (!stateNode) {
      // Work in progress (ex: onload events in incremental mode).
      return null;
    }

    var props = getFiberCurrentPropsFromNode(stateNode);

    if (!props) {
      // Work in progress.
      return null;
    }

    listener = props[registrationName];

    if (shouldPreventMouseEvent(registrationName, inst.type, props)) {
      return null;
    }

    if (!(!listener || typeof listener === 'function')) {
      {
        throw Error( "Expected `" + registrationName + "` listener to be a function, instead got a value of `" + typeof listener + "` type." );
      }
    }

    return listener;
  }

  /**
   * Some event types have a notion of different registration names for different
   * "phases" of propagation. This finds listeners by a given phase.
   */
  function listenerAtPhase(inst, event, propagationPhase) {
    var registrationName = event.dispatchConfig.phasedRegistrationNames[propagationPhase];
    return getListener(inst, registrationName);
  }
  /**
   * A small set of propagation patterns, each of which will accept a small amount
   * of information, and generate a set of "dispatch ready event objects" - which
   * are sets of events that have already been annotated with a set of dispatched
   * listener functions/ids. The API is designed this way to discourage these
   * propagation strategies from actually executing the dispatches, since we
   * always want to collect the entire set of dispatches before executing even a
   * single one.
   */

  /**
   * Tags a `SyntheticEvent` with dispatched listeners. Creating this function
   * here, allows us to not have to bind or create functions for each event.
   * Mutating the event's members allows us to not have to create a wrapping
   * "dispatch" object that pairs the event with the listener.
   */


  function accumulateDirectionalDispatches(inst, phase, event) {
    {
      if (!inst) {
        error('Dispatching inst must not be null');
      }
    }

    var listener = listenerAtPhase(inst, event, phase);

    if (listener) {
      event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);
      event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
    }
  }
  /**
   * Collect dispatches (must be entirely collected before dispatching - see unit
   * tests). Lazily allocate the array to conserve memory.  We must loop through
   * each event and perform the traversal for each one. We cannot perform a
   * single traversal for the entire collection of events because each event may
   * have a different target.
   */


  function accumulateTwoPhaseDispatchesSingle(event) {
    if (event && event.dispatchConfig.phasedRegistrationNames) {
      traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
    }
  }
  /**
   * Accumulates without regard to direction, does not look for phased
   * registration names. Same as `accumulateDirectDispatchesSingle` but without
   * requiring that the `dispatchMarker` be the same as the dispatched ID.
   */


  function accumulateDispatches(inst, ignoredDirection, event) {
    if (inst && event && event.dispatchConfig.registrationName) {
      var registrationName = event.dispatchConfig.registrationName;
      var listener = getListener(inst, registrationName);

      if (listener) {
        event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);
        event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
      }
    }
  }
  /**
   * Accumulates dispatches on an `SyntheticEvent`, but only for the
   * `dispatchMarker`.
   * @param {SyntheticEvent} event
   */


  function accumulateDirectDispatchesSingle(event) {
    if (event && event.dispatchConfig.registrationName) {
      accumulateDispatches(event._targetInst, null, event);
    }
  }

  function accumulateTwoPhaseDispatches(events) {
    forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
  }
  function accumulateEnterLeaveDispatches(leave, enter, from, to) {
    traverseEnterLeave(from, to, accumulateDispatches, leave, enter);
  }
  function accumulateDirectDispatches(events) {
    forEachAccumulated(events, accumulateDirectDispatchesSingle);
  }

  /**
   * These variables store information about text content of a target node,
   * allowing comparison of content before and after a given event.
   *
   * Identify the node where selection currently begins, then observe
   * both its text content and its current position in the DOM. Since the
   * browser may natively replace the target node during composition, we can
   * use its position to find its replacement.
   *
   *
   */
  var root = null;
  var startText = null;
  var fallbackText = null;
  function initialize(nativeEventTarget) {
    root = nativeEventTarget;
    startText = getText();
    return true;
  }
  function reset() {
    root = null;
    startText = null;
    fallbackText = null;
  }
  function getData() {
    if (fallbackText) {
      return fallbackText;
    }

    var start;
    var startValue = startText;
    var startLength = startValue.length;
    var end;
    var endValue = getText();
    var endLength = endValue.length;

    for (start = 0; start < startLength; start++) {
      if (startValue[start] !== endValue[start]) {
        break;
      }
    }

    var minEnd = startLength - start;

    for (end = 1; end <= minEnd; end++) {
      if (startValue[startLength - end] !== endValue[endLength - end]) {
        break;
      }
    }

    var sliceTail = end > 1 ? 1 - end : undefined;
    fallbackText = endValue.slice(start, sliceTail);
    return fallbackText;
  }
  function getText() {
    if ('value' in root) {
      return root.value;
    }

    return root.textContent;
  }

  var EVENT_POOL_SIZE = 10;
  /**
   * @interface Event
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */

  var EventInterface = {
    type: null,
    target: null,
    // currentTarget is set when dispatching; no use in copying it here
    currentTarget: function () {
      return null;
    },
    eventPhase: null,
    bubbles: null,
    cancelable: null,
    timeStamp: function (event) {
      return event.timeStamp || Date.now();
    },
    defaultPrevented: null,
    isTrusted: null
  };

  function functionThatReturnsTrue() {
    return true;
  }

  function functionThatReturnsFalse() {
    return false;
  }
  /**
   * Synthetic events are dispatched by event plugins, typically in response to a
   * top-level event delegation handler.
   *
   * These systems should generally use pooling to reduce the frequency of garbage
   * collection. The system should check `isPersistent` to determine whether the
   * event should be released into the pool after being dispatched. Users that
   * need a persisted event should invoke `persist`.
   *
   * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
   * normalizing browser quirks. Subclasses do not necessarily have to implement a
   * DOM interface; custom application-specific events can also subclass this.
   *
   * @param {object} dispatchConfig Configuration used to dispatch this event.
   * @param {*} targetInst Marker identifying the event target.
   * @param {object} nativeEvent Native browser event.
   * @param {DOMEventTarget} nativeEventTarget Target node.
   */


  function SyntheticEvent(dispatchConfig, targetInst, nativeEvent, nativeEventTarget) {
    {
      // these have a getter/setter for warnings
      delete this.nativeEvent;
      delete this.preventDefault;
      delete this.stopPropagation;
      delete this.isDefaultPrevented;
      delete this.isPropagationStopped;
    }

    this.dispatchConfig = dispatchConfig;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;
    var Interface = this.constructor.Interface;

    for (var propName in Interface) {
      if (!Interface.hasOwnProperty(propName)) {
        continue;
      }

      {
        delete this[propName]; // this has a getter/setter for warnings
      }

      var normalize = Interface[propName];

      if (normalize) {
        this[propName] = normalize(nativeEvent);
      } else {
        if (propName === 'target') {
          this.target = nativeEventTarget;
        } else {
          this[propName] = nativeEvent[propName];
        }
      }
    }

    var defaultPrevented = nativeEvent.defaultPrevented != null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === false;

    if (defaultPrevented) {
      this.isDefaultPrevented = functionThatReturnsTrue;
    } else {
      this.isDefaultPrevented = functionThatReturnsFalse;
    }

    this.isPropagationStopped = functionThatReturnsFalse;
    return this;
  }

  _assign(SyntheticEvent.prototype, {
    preventDefault: function () {
      this.defaultPrevented = true;
      var event = this.nativeEvent;

      if (!event) {
        return;
      }

      if (event.preventDefault) {
        event.preventDefault();
      } else if (typeof event.returnValue !== 'unknown') {
        event.returnValue = false;
      }

      this.isDefaultPrevented = functionThatReturnsTrue;
    },
    stopPropagation: function () {
      var event = this.nativeEvent;

      if (!event) {
        return;
      }

      if (event.stopPropagation) {
        event.stopPropagation();
      } else if (typeof event.cancelBubble !== 'unknown') {
        // The ChangeEventPlugin registers a "propertychange" event for
        // IE. This event does not support bubbling or cancelling, and
        // any references to cancelBubble throw "Member not found".  A
        // typeof check of "unknown" circumvents this issue (and is also
        // IE specific).
        event.cancelBubble = true;
      }

      this.isPropagationStopped = functionThatReturnsTrue;
    },

    /**
     * We release all dispatched `SyntheticEvent`s after each event loop, adding
     * them back into the pool. This allows a way to hold onto a reference that
     * won't be added back into the pool.
     */
    persist: function () {
      this.isPersistent = functionThatReturnsTrue;
    },

    /**
     * Checks if this event should be released back into the pool.
     *
     * @return {boolean} True if this should not be released, false otherwise.
     */
    isPersistent: functionThatReturnsFalse,

    /**
     * `PooledClass` looks for `destructor` on each instance it releases.
     */
    destructor: function () {
      var Interface = this.constructor.Interface;

      for (var propName in Interface) {
        {
          Object.defineProperty(this, propName, getPooledWarningPropertyDefinition(propName, Interface[propName]));
        }
      }

      this.dispatchConfig = null;
      this._targetInst = null;
      this.nativeEvent = null;
      this.isDefaultPrevented = functionThatReturnsFalse;
      this.isPropagationStopped = functionThatReturnsFalse;
      this._dispatchListeners = null;
      this._dispatchInstances = null;

      {
        Object.defineProperty(this, 'nativeEvent', getPooledWarningPropertyDefinition('nativeEvent', null));
        Object.defineProperty(this, 'isDefaultPrevented', getPooledWarningPropertyDefinition('isDefaultPrevented', functionThatReturnsFalse));
        Object.defineProperty(this, 'isPropagationStopped', getPooledWarningPropertyDefinition('isPropagationStopped', functionThatReturnsFalse));
        Object.defineProperty(this, 'preventDefault', getPooledWarningPropertyDefinition('preventDefault', function () {}));
        Object.defineProperty(this, 'stopPropagation', getPooledWarningPropertyDefinition('stopPropagation', function () {}));
      }
    }
  });

  SyntheticEvent.Interface = EventInterface;
  /**
   * Helper to reduce boilerplate when creating subclasses.
   */

  SyntheticEvent.extend = function (Interface) {
    var Super = this;

    var E = function () {};

    E.prototype = Super.prototype;
    var prototype = new E();

    function Class() {
      return Super.apply(this, arguments);
    }

    _assign(prototype, Class.prototype);

    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.Interface = _assign({}, Super.Interface, Interface);
    Class.extend = Super.extend;
    addEventPoolingTo(Class);
    return Class;
  };

  addEventPoolingTo(SyntheticEvent);
  /**
   * Helper to nullify syntheticEvent instance properties when destructing
   *
   * @param {String} propName
   * @param {?object} getVal
   * @return {object} defineProperty object
   */

  function getPooledWarningPropertyDefinition(propName, getVal) {
    var isFunction = typeof getVal === 'function';
    return {
      configurable: true,
      set: set,
      get: get
    };

    function set(val) {
      var action = isFunction ? 'setting the method' : 'setting the property';
      warn(action, 'This is effectively a no-op');
      return val;
    }

    function get() {
      var action = isFunction ? 'accessing the method' : 'accessing the property';
      var result = isFunction ? 'This is a no-op function' : 'This is set to null';
      warn(action, result);
      return getVal;
    }

    function warn(action, result) {
      {
        error("This synthetic event is reused for performance reasons. If you're seeing this, " + "you're %s `%s` on a released/nullified synthetic event. %s. " + 'If you must keep the original synthetic event around, use event.persist(). ' + 'See https://fb.me/react-event-pooling for more information.', action, propName, result);
      }
    }
  }

  function getPooledEvent(dispatchConfig, targetInst, nativeEvent, nativeInst) {
    var EventConstructor = this;

    if (EventConstructor.eventPool.length) {
      var instance = EventConstructor.eventPool.pop();
      EventConstructor.call(instance, dispatchConfig, targetInst, nativeEvent, nativeInst);
      return instance;
    }

    return new EventConstructor(dispatchConfig, targetInst, nativeEvent, nativeInst);
  }

  function releasePooledEvent(event) {
    var EventConstructor = this;

    if (!(event instanceof EventConstructor)) {
      {
        throw Error( "Trying to release an event instance into a pool of a different type." );
      }
    }

    event.destructor();

    if (EventConstructor.eventPool.length < EVENT_POOL_SIZE) {
      EventConstructor.eventPool.push(event);
    }
  }

  function addEventPoolingTo(EventConstructor) {
    EventConstructor.eventPool = [];
    EventConstructor.getPooled = getPooledEvent;
    EventConstructor.release = releasePooledEvent;
  }

  /**
   * @interface Event
   * @see http://www.w3.org/TR/DOM-Level-3-Events/#events-compositionevents
   */

  var SyntheticCompositionEvent = SyntheticEvent.extend({
    data: null
  });

  /**
   * @interface Event
   * @see http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105
   *      /#events-inputevents
   */

  var SyntheticInputEvent = SyntheticEvent.extend({
    data: null
  });

  var END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space

  var START_KEYCODE = 229;
  var canUseCompositionEvent = canUseDOM && 'CompositionEvent' in window;
  var documentMode = null;

  if (canUseDOM && 'documentMode' in document) {
    documentMode = document.documentMode;
  } // Webkit offers a very useful `textInput` event that can be used to
  // directly represent `beforeInput`. The IE `textinput` event is not as
  // useful, so we don't use it.


  var canUseTextInputEvent = canUseDOM && 'TextEvent' in window && !documentMode; // In IE9+, we have access to composition events, but the data supplied
  // by the native compositionend event may be incorrect. Japanese ideographic
  // spaces, for instance (\u3000) are not recorded correctly.

  var useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || documentMode && documentMode > 8 && documentMode <= 11);
  var SPACEBAR_CODE = 32;
  var SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE); // Events and their corresponding property names.

  var eventTypes = {
    beforeInput: {
      phasedRegistrationNames: {
        bubbled: 'onBeforeInput',
        captured: 'onBeforeInputCapture'
      },
      dependencies: [TOP_COMPOSITION_END, TOP_KEY_PRESS, TOP_TEXT_INPUT, TOP_PASTE]
    },
    compositionEnd: {
      phasedRegistrationNames: {
        bubbled: 'onCompositionEnd',
        captured: 'onCompositionEndCapture'
      },
      dependencies: [TOP_BLUR, TOP_COMPOSITION_END, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN]
    },
    compositionStart: {
      phasedRegistrationNames: {
        bubbled: 'onCompositionStart',
        captured: 'onCompositionStartCapture'
      },
      dependencies: [TOP_BLUR, TOP_COMPOSITION_START, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN]
    },
    compositionUpdate: {
      phasedRegistrationNames: {
        bubbled: 'onCompositionUpdate',
        captured: 'onCompositionUpdateCapture'
      },
      dependencies: [TOP_BLUR, TOP_COMPOSITION_UPDATE, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN]
    }
  }; // Track whether we've ever handled a keypress on the space key.

  var hasSpaceKeypress = false;
  /**
   * Return whether a native keypress event is assumed to be a command.
   * This is required because Firefox fires `keypress` events for key commands
   * (cut, copy, select-all, etc.) even though no character is inserted.
   */

  function isKeypressCommand(nativeEvent) {
    return (nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) && // ctrlKey && altKey is equivalent to AltGr, and is not a command.
    !(nativeEvent.ctrlKey && nativeEvent.altKey);
  }
  /**
   * Translate native top level events into event types.
   *
   * @param {string} topLevelType
   * @return {object}
   */


  function getCompositionEventType(topLevelType) {
    switch (topLevelType) {
      case TOP_COMPOSITION_START:
        return eventTypes.compositionStart;

      case TOP_COMPOSITION_END:
        return eventTypes.compositionEnd;

      case TOP_COMPOSITION_UPDATE:
        return eventTypes.compositionUpdate;
    }
  }
  /**
   * Does our fallback best-guess model think this event signifies that
   * composition has begun?
   *
   * @param {string} topLevelType
   * @param {object} nativeEvent
   * @return {boolean}
   */


  function isFallbackCompositionStart(topLevelType, nativeEvent) {
    return topLevelType === TOP_KEY_DOWN && nativeEvent.keyCode === START_KEYCODE;
  }
  /**
   * Does our fallback mode think that this event is the end of composition?
   *
   * @param {string} topLevelType
   * @param {object} nativeEvent
   * @return {boolean}
   */


  function isFallbackCompositionEnd(topLevelType, nativeEvent) {
    switch (topLevelType) {
      case TOP_KEY_UP:
        // Command keys insert or clear IME input.
        return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;

      case TOP_KEY_DOWN:
        // Expect IME keyCode on each keydown. If we get any other
        // code we must have exited earlier.
        return nativeEvent.keyCode !== START_KEYCODE;

      case TOP_KEY_PRESS:
      case TOP_MOUSE_DOWN:
      case TOP_BLUR:
        // Events are not possible without cancelling IME.
        return true;

      default:
        return false;
    }
  }
  /**
   * Google Input Tools provides composition data via a CustomEvent,
   * with the `data` property populated in the `detail` object. If this
   * is available on the event object, use it. If not, this is a plain
   * composition event and we have nothing special to extract.
   *
   * @param {object} nativeEvent
   * @return {?string}
   */


  function getDataFromCustomEvent(nativeEvent) {
    var detail = nativeEvent.detail;

    if (typeof detail === 'object' && 'data' in detail) {
      return detail.data;
    }

    return null;
  }
  /**
   * Check if a composition event was triggered by Korean IME.
   * Our fallback mode does not work well with IE's Korean IME,
   * so just use native composition events when Korean IME is used.
   * Although CompositionEvent.locale property is deprecated,
   * it is available in IE, where our fallback mode is enabled.
   *
   * @param {object} nativeEvent
   * @return {boolean}
   */


  function isUsingKoreanIME(nativeEvent) {
    return nativeEvent.locale === 'ko';
  } // Track the current IME composition status, if any.


  var isComposing = false;
  /**
   * @return {?object} A SyntheticCompositionEvent.
   */

  function extractCompositionEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var eventType;
    var fallbackData;

    if (canUseCompositionEvent) {
      eventType = getCompositionEventType(topLevelType);
    } else if (!isComposing) {
      if (isFallbackCompositionStart(topLevelType, nativeEvent)) {
        eventType = eventTypes.compositionStart;
      }
    } else if (isFallbackCompositionEnd(topLevelType, nativeEvent)) {
      eventType = eventTypes.compositionEnd;
    }

    if (!eventType) {
      return null;
    }

    if (useFallbackCompositionData && !isUsingKoreanIME(nativeEvent)) {
      // The current composition is stored statically and must not be
      // overwritten while composition continues.
      if (!isComposing && eventType === eventTypes.compositionStart) {
        isComposing = initialize(nativeEventTarget);
      } else if (eventType === eventTypes.compositionEnd) {
        if (isComposing) {
          fallbackData = getData();
        }
      }
    }

    var event = SyntheticCompositionEvent.getPooled(eventType, targetInst, nativeEvent, nativeEventTarget);

    if (fallbackData) {
      // Inject data generated from fallback path into the synthetic event.
      // This matches the property of native CompositionEventInterface.
      event.data = fallbackData;
    } else {
      var customData = getDataFromCustomEvent(nativeEvent);

      if (customData !== null) {
        event.data = customData;
      }
    }

    accumulateTwoPhaseDispatches(event);
    return event;
  }
  /**
   * @param {TopLevelType} topLevelType Number from `TopLevelType`.
   * @param {object} nativeEvent Native browser event.
   * @return {?string} The string corresponding to this `beforeInput` event.
   */


  function getNativeBeforeInputChars(topLevelType, nativeEvent) {
    switch (topLevelType) {
      case TOP_COMPOSITION_END:
        return getDataFromCustomEvent(nativeEvent);

      case TOP_KEY_PRESS:
        /**
         * If native `textInput` events are available, our goal is to make
         * use of them. However, there is a special case: the spacebar key.
         * In Webkit, preventing default on a spacebar `textInput` event
         * cancels character insertion, but it *also* causes the browser
         * to fall back to its default spacebar behavior of scrolling the
         * page.
         *
         * Tracking at:
         * https://code.google.com/p/chromium/issues/detail?id=355103
         *
         * To avoid this issue, use the keypress event as if no `textInput`
         * event is available.
         */
        var which = nativeEvent.which;

        if (which !== SPACEBAR_CODE) {
          return null;
        }

        hasSpaceKeypress = true;
        return SPACEBAR_CHAR;

      case TOP_TEXT_INPUT:
        // Record the characters to be added to the DOM.
        var chars = nativeEvent.data; // If it's a spacebar character, assume that we have already handled
        // it at the keypress level and bail immediately. Android Chrome
        // doesn't give us keycodes, so we need to ignore it.

        if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
          return null;
        }

        return chars;

      default:
        // For other native event types, do nothing.
        return null;
    }
  }
  /**
   * For browsers that do not provide the `textInput` event, extract the
   * appropriate string to use for SyntheticInputEvent.
   *
   * @param {number} topLevelType Number from `TopLevelEventTypes`.
   * @param {object} nativeEvent Native browser event.
   * @return {?string} The fallback string for this `beforeInput` event.
   */


  function getFallbackBeforeInputChars(topLevelType, nativeEvent) {
    // If we are currently composing (IME) and using a fallback to do so,
    // try to extract the composed characters from the fallback object.
    // If composition event is available, we extract a string only at
    // compositionevent, otherwise extract it at fallback events.
    if (isComposing) {
      if (topLevelType === TOP_COMPOSITION_END || !canUseCompositionEvent && isFallbackCompositionEnd(topLevelType, nativeEvent)) {
        var chars = getData();
        reset();
        isComposing = false;
        return chars;
      }

      return null;
    }

    switch (topLevelType) {
      case TOP_PASTE:
        // If a paste event occurs after a keypress, throw out the input
        // chars. Paste events should not lead to BeforeInput events.
        return null;

      case TOP_KEY_PRESS:
        /**
         * As of v27, Firefox may fire keypress events even when no character
         * will be inserted. A few possibilities:
         *
         * - `which` is `0`. Arrow keys, Esc key, etc.
         *
         * - `which` is the pressed key code, but no char is available.
         *   Ex: 'AltGr + d` in Polish. There is no modified character for
         *   this key combination and no character is inserted into the
         *   document, but FF fires the keypress for char code `100` anyway.
         *   No `input` event will occur.
         *
         * - `which` is the pressed key code, but a command combination is
         *   being used. Ex: `Cmd+C`. No character is inserted, and no
         *   `input` event will occur.
         */
        if (!isKeypressCommand(nativeEvent)) {
          // IE fires the `keypress` event when a user types an emoji via
          // Touch keyboard of Windows.  In such a case, the `char` property
          // holds an emoji character like `\uD83D\uDE0A`.  Because its length
          // is 2, the property `which` does not represent an emoji correctly.
          // In such a case, we directly return the `char` property instead of
          // using `which`.
          if (nativeEvent.char && nativeEvent.char.length > 1) {
            return nativeEvent.char;
          } else if (nativeEvent.which) {
            return String.fromCharCode(nativeEvent.which);
          }
        }

        return null;

      case TOP_COMPOSITION_END:
        return useFallbackCompositionData && !isUsingKoreanIME(nativeEvent) ? null : nativeEvent.data;

      default:
        return null;
    }
  }
  /**
   * Extract a SyntheticInputEvent for `beforeInput`, based on either native
   * `textInput` or fallback behavior.
   *
   * @return {?object} A SyntheticInputEvent.
   */


  function extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var chars;

    if (canUseTextInputEvent) {
      chars = getNativeBeforeInputChars(topLevelType, nativeEvent);
    } else {
      chars = getFallbackBeforeInputChars(topLevelType, nativeEvent);
    } // If no characters are being inserted, no BeforeInput event should
    // be fired.


    if (!chars) {
      return null;
    }

    var event = SyntheticInputEvent.getPooled(eventTypes.beforeInput, targetInst, nativeEvent, nativeEventTarget);
    event.data = chars;
    accumulateTwoPhaseDispatches(event);
    return event;
  }
  /**
   * Create an `onBeforeInput` event to match
   * http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105/#events-inputevents.
   *
   * This event plugin is based on the native `textInput` event
   * available in Chrome, Safari, Opera, and IE. This event fires after
   * `onKeyPress` and `onCompositionEnd`, but before `onInput`.
   *
   * `beforeInput` is spec'd but not implemented in any browsers, and
   * the `input` event does not provide any useful information about what has
   * actually been added, contrary to the spec. Thus, `textInput` is the best
   * available event to identify the characters that have actually been inserted
   * into the target node.
   *
   * This plugin is also responsible for emitting `composition` events, thus
   * allowing us to share composition fallback code for both `beforeInput` and
   * `composition` event types.
   */


  var BeforeInputEventPlugin = {
    eventTypes: eventTypes,
    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) {
      var composition = extractCompositionEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);
      var beforeInput = extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);

      if (composition === null) {
        return beforeInput;
      }

      if (beforeInput === null) {
        return composition;
      }

      return [composition, beforeInput];
    }
  };

  /**
   * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
   */
  var supportedInputTypes = {
    color: true,
    date: true,
    datetime: true,
    'datetime-local': true,
    email: true,
    month: true,
    number: true,
    password: true,
    range: true,
    search: true,
    tel: true,
    text: true,
    time: true,
    url: true,
    week: true
  };

  function isTextInputElement(elem) {
    var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();

    if (nodeName === 'input') {
      return !!supportedInputTypes[elem.type];
    }

    if (nodeName === 'textarea') {
      return true;
    }

    return false;
  }

  var eventTypes$1 = {
    change: {
      phasedRegistrationNames: {
        bubbled: 'onChange',
        captured: 'onChangeCapture'
      },
      dependencies: [TOP_BLUR, TOP_CHANGE, TOP_CLICK, TOP_FOCUS, TOP_INPUT, TOP_KEY_DOWN, TOP_KEY_UP, TOP_SELECTION_CHANGE]
    }
  };

  function createAndAccumulateChangeEvent(inst, nativeEvent, target) {
    var event = SyntheticEvent.getPooled(eventTypes$1.change, inst, nativeEvent, target);
    event.type = 'change'; // Flag this event loop as needing state restore.

    enqueueStateRestore(target);
    accumulateTwoPhaseDispatches(event);
    return event;
  }
  /**
   * For IE shims
   */


  var activeElement = null;
  var activeElementInst = null;
  /**
   * SECTION: handle `change` event
   */

  function shouldUseChangeEvent(elem) {
    var nodeName = elem.nodeName && elem.nodeName.toLowerCase();
    return nodeName === 'select' || nodeName === 'input' && elem.type === 'file';
  }

  function manualDispatchChangeEvent(nativeEvent) {
    var event = createAndAccumulateChangeEvent(activeElementInst, nativeEvent, getEventTarget(nativeEvent)); // If change and propertychange bubbled, we'd just bind to it like all the
    // other events and have it go through ReactBrowserEventEmitter. Since it
    // doesn't, we manually listen for the events and so we have to enqueue and
    // process the abstract event manually.
    //
    // Batching is necessary here in order to ensure that all event handlers run
    // before the next rerender (including event handlers attached to ancestor
    // elements instead of directly on the input). Without this, controlled
    // components don't work properly in conjunction with event bubbling because
    // the component is rerendered and the value reverted before all the event
    // handlers can run. See https://github.com/facebook/react/issues/708.

    batchedUpdates(runEventInBatch, event);
  }

  function runEventInBatch(event) {
    runEventsInBatch(event);
  }

  function getInstIfValueChanged(targetInst) {
    var targetNode = getNodeFromInstance$1(targetInst);

    if (updateValueIfChanged(targetNode)) {
      return targetInst;
    }
  }

  function getTargetInstForChangeEvent(topLevelType, targetInst) {
    if (topLevelType === TOP_CHANGE) {
      return targetInst;
    }
  }
  /**
   * SECTION: handle `input` event
   */


  var isInputEventSupported = false;

  if (canUseDOM) {
    // IE9 claims to support the input event but fails to trigger it when
    // deleting text, so we ignore its input events.
    isInputEventSupported = isEventSupported('input') && (!document.documentMode || document.documentMode > 9);
  }
  /**
   * (For IE <=9) Starts tracking propertychange events on the passed-in element
   * and override the value property so that we can distinguish user events from
   * value changes in JS.
   */


  function startWatchingForValueChange(target, targetInst) {
    activeElement = target;
    activeElementInst = targetInst;
    activeElement.attachEvent('onpropertychange', handlePropertyChange);
  }
  /**
   * (For IE <=9) Removes the event listeners from the currently-tracked element,
   * if any exists.
   */


  function stopWatchingForValueChange() {
    if (!activeElement) {
      return;
    }

    activeElement.detachEvent('onpropertychange', handlePropertyChange);
    activeElement = null;
    activeElementInst = null;
  }
  /**
   * (For IE <=9) Handles a propertychange event, sending a `change` event if
   * the value of the active element has changed.
   */


  function handlePropertyChange(nativeEvent) {
    if (nativeEvent.propertyName !== 'value') {
      return;
    }

    if (getInstIfValueChanged(activeElementInst)) {
      manualDispatchChangeEvent(nativeEvent);
    }
  }

  function handleEventsForInputEventPolyfill(topLevelType, target, targetInst) {
    if (topLevelType === TOP_FOCUS) {
      // In IE9, propertychange fires for most input events but is buggy and
      // doesn't fire when text is deleted, but conveniently, selectionchange
      // appears to fire in all of the remaining cases so we catch those and
      // forward the event if the value has changed
      // In either case, we don't want to call the event handler if the value
      // is changed from JS so we redefine a setter for `.value` that updates
      // our activeElementValue variable, allowing us to ignore those changes
      //
      // stopWatching() should be a noop here but we call it just in case we
      // missed a blur event somehow.
      stopWatchingForValueChange();
      startWatchingForValueChange(target, targetInst);
    } else if (topLevelType === TOP_BLUR) {
      stopWatchingForValueChange();
    }
  } // For IE8 and IE9.


  function getTargetInstForInputEventPolyfill(topLevelType, targetInst) {
    if (topLevelType === TOP_SELECTION_CHANGE || topLevelType === TOP_KEY_UP || topLevelType === TOP_KEY_DOWN) {
      // On the selectionchange event, the target is just document which isn't
      // helpful for us so just check activeElement instead.
      //
      // 99% of the time, keydown and keyup aren't necessary. IE8 fails to fire
      // propertychange on the first input event after setting `value` from a
      // script and fires only keydown, keypress, keyup. Catching keyup usually
      // gets it and catching keydown lets us fire an event for the first
      // keystroke if user does a key repeat (it'll be a little delayed: right
      // before the second keystroke). Other input methods (e.g., paste) seem to
      // fire selectionchange normally.
      return getInstIfValueChanged(activeElementInst);
    }
  }
  /**
   * SECTION: handle `click` event
   */


  function shouldUseClickEvent(elem) {
    // Use the `click` event to detect changes to checkbox and radio inputs.
    // This approach works across all browsers, whereas `change` does not fire
    // until `blur` in IE8.
    var nodeName = elem.nodeName;
    return nodeName && nodeName.toLowerCase() === 'input' && (elem.type === 'checkbox' || elem.type === 'radio');
  }

  function getTargetInstForClickEvent(topLevelType, targetInst) {
    if (topLevelType === TOP_CLICK) {
      return getInstIfValueChanged(targetInst);
    }
  }

  function getTargetInstForInputOrChangeEvent(topLevelType, targetInst) {
    if (topLevelType === TOP_INPUT || topLevelType === TOP_CHANGE) {
      return getInstIfValueChanged(targetInst);
    }
  }

  function handleControlledInputBlur(node) {
    var state = node._wrapperState;

    if (!state || !state.controlled || node.type !== 'number') {
      return;
    }

    {
      // If controlled, assign the value attribute to the current value on blur
      setDefaultValue(node, 'number', node.value);
    }
  }
  /**
   * This plugin creates an `onChange` event that normalizes change events
   * across form elements. This event fires at a time when it's possible to
   * change the element's value without seeing a flicker.
   *
   * Supported elements are:
   * - input (see `isTextInputElement`)
   * - textarea
   * - select
   */


  var ChangeEventPlugin = {
    eventTypes: eventTypes$1,
    _isInputEventSupported: isInputEventSupported,
    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) {
      var targetNode = targetInst ? getNodeFromInstance$1(targetInst) : window;
      var getTargetInstFunc, handleEventFunc;

      if (shouldUseChangeEvent(targetNode)) {
        getTargetInstFunc = getTargetInstForChangeEvent;
      } else if (isTextInputElement(targetNode)) {
        if (isInputEventSupported) {
          getTargetInstFunc = getTargetInstForInputOrChangeEvent;
        } else {
          getTargetInstFunc = getTargetInstForInputEventPolyfill;
          handleEventFunc = handleEventsForInputEventPolyfill;
        }
      } else if (shouldUseClickEvent(targetNode)) {
        getTargetInstFunc = getTargetInstForClickEvent;
      }

      if (getTargetInstFunc) {
        var inst = getTargetInstFunc(topLevelType, targetInst);

        if (inst) {
          var event = createAndAccumulateChangeEvent(inst, nativeEvent, nativeEventTarget);
          return event;
        }
      }

      if (handleEventFunc) {
        handleEventFunc(topLevelType, targetNode, targetInst);
      } // When blurring, set the value attribute for number inputs


      if (topLevelType === TOP_BLUR) {
        handleControlledInputBlur(targetNode);
      }
    }
  };

  var SyntheticUIEvent = SyntheticEvent.extend({
    view: null,
    detail: null
  });

  /**
   * Translation from modifier key to the associated property in the event.
   * @see http://www.w3.org/TR/DOM-Level-3-Events/#keys-Modifiers
   */
  var modifierKeyToProp = {
    Alt: 'altKey',
    Control: 'ctrlKey',
    Meta: 'metaKey',
    Shift: 'shiftKey'
  }; // Older browsers (Safari <= 10, iOS Safari <= 10.2) do not support
  // getModifierState. If getModifierState is not supported, we map it to a set of
  // modifier keys exposed by the event. In this case, Lock-keys are not supported.

  function modifierStateGetter(keyArg) {
    var syntheticEvent = this;
    var nativeEvent = syntheticEvent.nativeEvent;

    if (nativeEvent.getModifierState) {
      return nativeEvent.getModifierState(keyArg);
    }

    var keyProp = modifierKeyToProp[keyArg];
    return keyProp ? !!nativeEvent[keyProp] : false;
  }

  function getEventModifierState(nativeEvent) {
    return modifierStateGetter;
  }

  var previousScreenX = 0;
  var previousScreenY = 0; // Use flags to signal movementX/Y has already been set

  var isMovementXSet = false;
  var isMovementYSet = false;
  /**
   * @interface MouseEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */

  var SyntheticMouseEvent = SyntheticUIEvent.extend({
    screenX: null,
    screenY: null,
    clientX: null,
    clientY: null,
    pageX: null,
    pageY: null,
    ctrlKey: null,
    shiftKey: null,
    altKey: null,
    metaKey: null,
    getModifierState: getEventModifierState,
    button: null,
    buttons: null,
    relatedTarget: function (event) {
      return event.relatedTarget || (event.fromElement === event.srcElement ? event.toElement : event.fromElement);
    },
    movementX: function (event) {
      if ('movementX' in event) {
        return event.movementX;
      }

      var screenX = previousScreenX;
      previousScreenX = event.screenX;

      if (!isMovementXSet) {
        isMovementXSet = true;
        return 0;
      }

      return event.type === 'mousemove' ? event.screenX - screenX : 0;
    },
    movementY: function (event) {
      if ('movementY' in event) {
        return event.movementY;
      }

      var screenY = previousScreenY;
      previousScreenY = event.screenY;

      if (!isMovementYSet) {
        isMovementYSet = true;
        return 0;
      }

      return event.type === 'mousemove' ? event.screenY - screenY : 0;
    }
  });

  /**
   * @interface PointerEvent
   * @see http://www.w3.org/TR/pointerevents/
   */

  var SyntheticPointerEvent = SyntheticMouseEvent.extend({
    pointerId: null,
    width: null,
    height: null,
    pressure: null,
    tangentialPressure: null,
    tiltX: null,
    tiltY: null,
    twist: null,
    pointerType: null,
    isPrimary: null
  });

  var eventTypes$2 = {
    mouseEnter: {
      registrationName: 'onMouseEnter',
      dependencies: [TOP_MOUSE_OUT, TOP_MOUSE_OVER]
    },
    mouseLeave: {
      registrationName: 'onMouseLeave',
      dependencies: [TOP_MOUSE_OUT, TOP_MOUSE_OVER]
    },
    pointerEnter: {
      registrationName: 'onPointerEnter',
      dependencies: [TOP_POINTER_OUT, TOP_POINTER_OVER]
    },
    pointerLeave: {
      registrationName: 'onPointerLeave',
      dependencies: [TOP_POINTER_OUT, TOP_POINTER_OVER]
    }
  };
  var EnterLeaveEventPlugin = {
    eventTypes: eventTypes$2,

    /**
     * For almost every interaction we care about, there will be both a top-level
     * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
     * we do not extract duplicate events. However, moving the mouse into the
     * browser from outside will not fire a `mouseout` event. In this case, we use
     * the `mouseover` top-level event.
     */
    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) {
      var isOverEvent = topLevelType === TOP_MOUSE_OVER || topLevelType === TOP_POINTER_OVER;
      var isOutEvent = topLevelType === TOP_MOUSE_OUT || topLevelType === TOP_POINTER_OUT;

      if (isOverEvent && (eventSystemFlags & IS_REPLAYED) === 0 && (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
        // If this is an over event with a target, then we've already dispatched
        // the event in the out event of the other target. If this is replayed,
        // then it's because we couldn't dispatch against this target previously
        // so we have to do it now instead.
        return null;
      }

      if (!isOutEvent && !isOverEvent) {
        // Must not be a mouse or pointer in or out - ignoring.
        return null;
      }

      var win;

      if (nativeEventTarget.window === nativeEventTarget) {
        // `nativeEventTarget` is probably a window object.
        win = nativeEventTarget;
      } else {
        // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
        var doc = nativeEventTarget.ownerDocument;

        if (doc) {
          win = doc.defaultView || doc.parentWindow;
        } else {
          win = window;
        }
      }

      var from;
      var to;

      if (isOutEvent) {
        from = targetInst;
        var related = nativeEvent.relatedTarget || nativeEvent.toElement;
        to = related ? getClosestInstanceFromNode(related) : null;

        if (to !== null) {
          var nearestMounted = getNearestMountedFiber(to);

          if (to !== nearestMounted || to.tag !== HostComponent && to.tag !== HostText) {
            to = null;
          }
        }
      } else {
        // Moving to a node from outside the window.
        from = null;
        to = targetInst;
      }

      if (from === to) {
        // Nothing pertains to our managed components.
        return null;
      }

      var eventInterface, leaveEventType, enterEventType, eventTypePrefix;

      if (topLevelType === TOP_MOUSE_OUT || topLevelType === TOP_MOUSE_OVER) {
        eventInterface = SyntheticMouseEvent;
        leaveEventType = eventTypes$2.mouseLeave;
        enterEventType = eventTypes$2.mouseEnter;
        eventTypePrefix = 'mouse';
      } else if (topLevelType === TOP_POINTER_OUT || topLevelType === TOP_POINTER_OVER) {
        eventInterface = SyntheticPointerEvent;
        leaveEventType = eventTypes$2.pointerLeave;
        enterEventType = eventTypes$2.pointerEnter;
        eventTypePrefix = 'pointer';
      }

      var fromNode = from == null ? win : getNodeFromInstance$1(from);
      var toNode = to == null ? win : getNodeFromInstance$1(to);
      var leave = eventInterface.getPooled(leaveEventType, from, nativeEvent, nativeEventTarget);
      leave.type = eventTypePrefix + 'leave';
      leave.target = fromNode;
      leave.relatedTarget = toNode;
      var enter = eventInterface.getPooled(enterEventType, to, nativeEvent, nativeEventTarget);
      enter.type = eventTypePrefix + 'enter';
      enter.target = toNode;
      enter.relatedTarget = fromNode;
      accumulateEnterLeaveDispatches(leave, enter, from, to); // If we are not processing the first ancestor, then we
      // should not process the same nativeEvent again, as we
      // will have already processed it in the first ancestor.

      if ((eventSystemFlags & IS_FIRST_ANCESTOR) === 0) {
        return [leave];
      }

      return [leave, enter];
    }
  };

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  function is(x, y) {
    return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y // eslint-disable-line no-self-compare
    ;
  }

  var objectIs = typeof Object.is === 'function' ? Object.is : is;

  var hasOwnProperty$2 = Object.prototype.hasOwnProperty;
  /**
   * Performs equality by iterating through keys on an object and returning false
   * when any key has values which are not strictly equal between the arguments.
   * Returns true when the values of all keys are strictly equal.
   */

  function shallowEqual(objA, objB) {
    if (objectIs(objA, objB)) {
      return true;
    }

    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
      return false;
    }

    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
      return false;
    } // Test for A's keys different from B.


    for (var i = 0; i < keysA.length; i++) {
      if (!hasOwnProperty$2.call(objB, keysA[i]) || !objectIs(objA[keysA[i]], objB[keysA[i]])) {
        return false;
      }
    }

    return true;
  }

  var skipSelectionChangeEvent = canUseDOM && 'documentMode' in document && document.documentMode <= 11;
  var eventTypes$3 = {
    select: {
      phasedRegistrationNames: {
        bubbled: 'onSelect',
        captured: 'onSelectCapture'
      },
      dependencies: [TOP_BLUR, TOP_CONTEXT_MENU, TOP_DRAG_END, TOP_FOCUS, TOP_KEY_DOWN, TOP_KEY_UP, TOP_MOUSE_DOWN, TOP_MOUSE_UP, TOP_SELECTION_CHANGE]
    }
  };
  var activeElement$1 = null;
  var activeElementInst$1 = null;
  var lastSelection = null;
  var mouseDown = false;
  /**
   * Get an object which is a unique representation of the current selection.
   *
   * The return value will not be consistent across nodes or browsers, but
   * two identical selections on the same node will return identical objects.
   *
   * @param {DOMElement} node
   * @return {object}
   */

  function getSelection$1(node) {
    if ('selectionStart' in node && hasSelectionCapabilities(node)) {
      return {
        start: node.selectionStart,
        end: node.selectionEnd
      };
    } else {
      var win = node.ownerDocument && node.ownerDocument.defaultView || window;
      var selection = win.getSelection();
      return {
        anchorNode: selection.anchorNode,
        anchorOffset: selection.anchorOffset,
        focusNode: selection.focusNode,
        focusOffset: selection.focusOffset
      };
    }
  }
  /**
   * Get document associated with the event target.
   *
   * @param {object} nativeEventTarget
   * @return {Document}
   */


  function getEventTargetDocument(eventTarget) {
    return eventTarget.window === eventTarget ? eventTarget.document : eventTarget.nodeType === DOCUMENT_NODE ? eventTarget : eventTarget.ownerDocument;
  }
  /**
   * Poll selection to see whether it's changed.
   *
   * @param {object} nativeEvent
   * @param {object} nativeEventTarget
   * @return {?SyntheticEvent}
   */


  function constructSelectEvent(nativeEvent, nativeEventTarget) {
    // Ensure we have the right element, and that the user is not dragging a
    // selection (this matches native `select` event behavior). In HTML5, select
    // fires only on input and textarea thus if there's no focused element we
    // won't dispatch.
    var doc = getEventTargetDocument(nativeEventTarget);

    if (mouseDown || activeElement$1 == null || activeElement$1 !== getActiveElement(doc)) {
      return null;
    } // Only fire when selection has actually changed.


    var currentSelection = getSelection$1(activeElement$1);

    if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
      lastSelection = currentSelection;
      var syntheticEvent = SyntheticEvent.getPooled(eventTypes$3.select, activeElementInst$1, nativeEvent, nativeEventTarget);
      syntheticEvent.type = 'select';
      syntheticEvent.target = activeElement$1;
      accumulateTwoPhaseDispatches(syntheticEvent);
      return syntheticEvent;
    }

    return null;
  }
  /**
   * This plugin creates an `onSelect` event that normalizes select events
   * across form elements.
   *
   * Supported elements are:
   * - input (see `isTextInputElement`)
   * - textarea
   * - contentEditable
   *
   * This differs from native browser implementations in the following ways:
   * - Fires on contentEditable fields as well as inputs.
   * - Fires for collapsed selection.
   * - Fires after user input.
   */


  var SelectEventPlugin = {
    eventTypes: eventTypes$3,
    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, container) {
      var containerOrDoc = container || getEventTargetDocument(nativeEventTarget); // Track whether all listeners exists for this plugin. If none exist, we do
      // not extract events. See #3639.

      if (!containerOrDoc || !isListeningToAllDependencies('onSelect', containerOrDoc)) {
        return null;
      }

      var targetNode = targetInst ? getNodeFromInstance$1(targetInst) : window;

      switch (topLevelType) {
        // Track the input node that has focus.
        case TOP_FOCUS:
          if (isTextInputElement(targetNode) || targetNode.contentEditable === 'true') {
            activeElement$1 = targetNode;
            activeElementInst$1 = targetInst;
            lastSelection = null;
          }

          break;

        case TOP_BLUR:
          activeElement$1 = null;
          activeElementInst$1 = null;
          lastSelection = null;
          break;
        // Don't fire the event while the user is dragging. This matches the
        // semantics of the native select event.

        case TOP_MOUSE_DOWN:
          mouseDown = true;
          break;

        case TOP_CONTEXT_MENU:
        case TOP_MOUSE_UP:
        case TOP_DRAG_END:
          mouseDown = false;
          return constructSelectEvent(nativeEvent, nativeEventTarget);
        // Chrome and IE fire non-standard event when selection is changed (and
        // sometimes when it hasn't). IE's event fires out of order with respect
        // to key and input events on deletion, so we discard it.
        //
        // Firefox doesn't support selectionchange, so check selection status
        // after each key entry. The selection changes after keydown and before
        // keyup, but we check on keydown as well in the case of holding down a
        // key, when multiple keydown events are fired but only one keyup is.
        // This is also our approach for IE handling, for the reason above.

        case TOP_SELECTION_CHANGE:
          if (skipSelectionChangeEvent) {
            break;
          }

        // falls through

        case TOP_KEY_DOWN:
        case TOP_KEY_UP:
          return constructSelectEvent(nativeEvent, nativeEventTarget);
      }

      return null;
    }
  };

  /**
   * @interface Event
   * @see http://www.w3.org/TR/css3-animations/#AnimationEvent-interface
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AnimationEvent
   */

  var SyntheticAnimationEvent = SyntheticEvent.extend({
    animationName: null,
    elapsedTime: null,
    pseudoElement: null
  });

  /**
   * @interface Event
   * @see http://www.w3.org/TR/clipboard-apis/
   */

  var SyntheticClipboardEvent = SyntheticEvent.extend({
    clipboardData: function (event) {
      return 'clipboardData' in event ? event.clipboardData : window.clipboardData;
    }
  });

  /**
   * @interface FocusEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */

  var SyntheticFocusEvent = SyntheticUIEvent.extend({
    relatedTarget: null
  });

  /**
   * `charCode` represents the actual "character code" and is safe to use with
   * `String.fromCharCode`. As such, only keys that correspond to printable
   * characters produce a valid `charCode`, the only exception to this is Enter.
   * The Tab-key is considered non-printable and does not have a `charCode`,
   * presumably because it does not produce a tab-character in browsers.
   *
   * @param {object} nativeEvent Native browser event.
   * @return {number} Normalized `charCode` property.
   */
  function getEventCharCode(nativeEvent) {
    var charCode;
    var keyCode = nativeEvent.keyCode;

    if ('charCode' in nativeEvent) {
      charCode = nativeEvent.charCode; // FF does not set `charCode` for the Enter-key, check against `keyCode`.

      if (charCode === 0 && keyCode === 13) {
        charCode = 13;
      }
    } else {
      // IE8 does not implement `charCode`, but `keyCode` has the correct value.
      charCode = keyCode;
    } // IE and Edge (on Windows) and Chrome / Safari (on Windows and Linux)
    // report Enter as charCode 10 when ctrl is pressed.


    if (charCode === 10) {
      charCode = 13;
    } // Some non-printable keys are reported in `charCode`/`keyCode`, discard them.
    // Must not discard the (non-)printable Enter-key.


    if (charCode >= 32 || charCode === 13) {
      return charCode;
    }

    return 0;
  }

  /**
   * Normalization of deprecated HTML5 `key` values
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
   */

  var normalizeKey = {
    Esc: 'Escape',
    Spacebar: ' ',
    Left: 'ArrowLeft',
    Up: 'ArrowUp',
    Right: 'ArrowRight',
    Down: 'ArrowDown',
    Del: 'Delete',
    Win: 'OS',
    Menu: 'ContextMenu',
    Apps: 'ContextMenu',
    Scroll: 'ScrollLock',
    MozPrintableKey: 'Unidentified'
  };
  /**
   * Translation from legacy `keyCode` to HTML5 `key`
   * Only special keys supported, all others depend on keyboard layout or browser
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
   */

  var translateToKey = {
    '8': 'Backspace',
    '9': 'Tab',
    '12': 'Clear',
    '13': 'Enter',
    '16': 'Shift',
    '17': 'Control',
    '18': 'Alt',
    '19': 'Pause',
    '20': 'CapsLock',
    '27': 'Escape',
    '32': ' ',
    '33': 'PageUp',
    '34': 'PageDown',
    '35': 'End',
    '36': 'Home',
    '37': 'ArrowLeft',
    '38': 'ArrowUp',
    '39': 'ArrowRight',
    '40': 'ArrowDown',
    '45': 'Insert',
    '46': 'Delete',
    '112': 'F1',
    '113': 'F2',
    '114': 'F3',
    '115': 'F4',
    '116': 'F5',
    '117': 'F6',
    '118': 'F7',
    '119': 'F8',
    '120': 'F9',
    '121': 'F10',
    '122': 'F11',
    '123': 'F12',
    '144': 'NumLock',
    '145': 'ScrollLock',
    '224': 'Meta'
  };
  /**
   * @param {object} nativeEvent Native browser event.
   * @return {string} Normalized `key` property.
   */

  function getEventKey(nativeEvent) {
    if (nativeEvent.key) {
      // Normalize inconsistent values reported by browsers due to
      // implementations of a working draft specification.
      // FireFox implements `key` but returns `MozPrintableKey` for all
      // printable characters (normalized to `Unidentified`), ignore it.
      var key = normalizeKey[nativeEvent.key] || nativeEvent.key;

      if (key !== 'Unidentified') {
        return key;
      }
    } // Browser does not implement `key`, polyfill as much of it as we can.


    if (nativeEvent.type === 'keypress') {
      var charCode = getEventCharCode(nativeEvent); // The enter-key is technically both printable and non-printable and can
      // thus be captured by `keypress`, no other non-printable key should.

      return charCode === 13 ? 'Enter' : String.fromCharCode(charCode);
    }

    if (nativeEvent.type === 'keydown' || nativeEvent.type === 'keyup') {
      // While user keyboard layout determines the actual meaning of each
      // `keyCode` value, almost all function keys have a universal value.
      return translateToKey[nativeEvent.keyCode] || 'Unidentified';
    }

    return '';
  }

  /**
   * @interface KeyboardEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */

  var SyntheticKeyboardEvent = SyntheticUIEvent.extend({
    key: getEventKey,
    location: null,
    ctrlKey: null,
    shiftKey: null,
    altKey: null,
    metaKey: null,
    repeat: null,
    locale: null,
    getModifierState: getEventModifierState,
    // Legacy Interface
    charCode: function (event) {
      // `charCode` is the result of a KeyPress event and represents the value of
      // the actual printable character.
      // KeyPress is deprecated, but its replacement is not yet final and not
      // implemented in any major browser. Only KeyPress has charCode.
      if (event.type === 'keypress') {
        return getEventCharCode(event);
      }

      return 0;
    },
    keyCode: function (event) {
      // `keyCode` is the result of a KeyDown/Up event and represents the value of
      // physical keyboard key.
      // The actual meaning of the value depends on the users' keyboard layout
      // which cannot be detected. Assuming that it is a US keyboard layout
      // provides a surprisingly accurate mapping for US and European users.
      // Due to this, it is left to the user to implement at this time.
      if (event.type === 'keydown' || event.type === 'keyup') {
        return event.keyCode;
      }

      return 0;
    },
    which: function (event) {
      // `which` is an alias for either `keyCode` or `charCode` depending on the
      // type of the event.
      if (event.type === 'keypress') {
        return getEventCharCode(event);
      }

      if (event.type === 'keydown' || event.type === 'keyup') {
        return event.keyCode;
      }

      return 0;
    }
  });

  /**
   * @interface DragEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */

  var SyntheticDragEvent = SyntheticMouseEvent.extend({
    dataTransfer: null
  });

  /**
   * @interface TouchEvent
   * @see http://www.w3.org/TR/touch-events/
   */

  var SyntheticTouchEvent = SyntheticUIEvent.extend({
    touches: null,
    targetTouches: null,
    changedTouches: null,
    altKey: null,
    metaKey: null,
    ctrlKey: null,
    shiftKey: null,
    getModifierState: getEventModifierState
  });

  /**
   * @interface Event
   * @see http://www.w3.org/TR/2009/WD-css3-transitions-20090320/#transition-events-
   * @see https://developer.mozilla.org/en-US/docs/Web/API/TransitionEvent
   */

  var SyntheticTransitionEvent = SyntheticEvent.extend({
    propertyName: null,
    elapsedTime: null,
    pseudoElement: null
  });

  /**
   * @interface WheelEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */

  var SyntheticWheelEvent = SyntheticMouseEvent.extend({
    deltaX: function (event) {
      return 'deltaX' in event ? event.deltaX : // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
      'wheelDeltaX' in event ? -event.wheelDeltaX : 0;
    },
    deltaY: function (event) {
      return 'deltaY' in event ? event.deltaY : // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
      'wheelDeltaY' in event ? -event.wheelDeltaY : // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
      'wheelDelta' in event ? -event.wheelDelta : 0;
    },
    deltaZ: null,
    // Browsers without "deltaMode" is reporting in raw wheel delta where one
    // notch on the scroll is always +/- 120, roughly equivalent to pixels.
    // A good approximation of DOM_DELTA_LINE (1) is 5% of viewport size or
    // ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5% of viewport size.
    deltaMode: null
  });

  var knownHTMLTopLevelTypes = [TOP_ABORT, TOP_CANCEL, TOP_CAN_PLAY, TOP_CAN_PLAY_THROUGH, TOP_CLOSE, TOP_DURATION_CHANGE, TOP_EMPTIED, TOP_ENCRYPTED, TOP_ENDED, TOP_ERROR, TOP_INPUT, TOP_INVALID, TOP_LOAD, TOP_LOADED_DATA, TOP_LOADED_METADATA, TOP_LOAD_START, TOP_PAUSE, TOP_PLAY, TOP_PLAYING, TOP_PROGRESS, TOP_RATE_CHANGE, TOP_RESET, TOP_SEEKED, TOP_SEEKING, TOP_STALLED, TOP_SUBMIT, TOP_SUSPEND, TOP_TIME_UPDATE, TOP_TOGGLE, TOP_VOLUME_CHANGE, TOP_WAITING];
  var SimpleEventPlugin = {
    // simpleEventPluginEventTypes gets populated from
    // the DOMEventProperties module.
    eventTypes: simpleEventPluginEventTypes,
    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) {
      var dispatchConfig = topLevelEventsToDispatchConfig.get(topLevelType);

      if (!dispatchConfig) {
        return null;
      }

      var EventConstructor;

      switch (topLevelType) {
        case TOP_KEY_PRESS:
          // Firefox creates a keypress event for function keys too. This removes
          // the unwanted keypress events. Enter is however both printable and
          // non-printable. One would expect Tab to be as well (but it isn't).
          if (getEventCharCode(nativeEvent) === 0) {
            return null;
          }

        /* falls through */

        case TOP_KEY_DOWN:
        case TOP_KEY_UP:
          EventConstructor = SyntheticKeyboardEvent;
          break;

        case TOP_BLUR:
        case TOP_FOCUS:
          EventConstructor = SyntheticFocusEvent;
          break;

        case TOP_CLICK:
          // Firefox creates a click event on right mouse clicks. This removes the
          // unwanted click events.
          if (nativeEvent.button === 2) {
            return null;
          }

        /* falls through */

        case TOP_AUX_CLICK:
        case TOP_DOUBLE_CLICK:
        case TOP_MOUSE_DOWN:
        case TOP_MOUSE_MOVE:
        case TOP_MOUSE_UP: // TODO: Disabled elements should not respond to mouse events

        /* falls through */

        case TOP_MOUSE_OUT:
        case TOP_MOUSE_OVER:
        case TOP_CONTEXT_MENU:
          EventConstructor = SyntheticMouseEvent;
          break;

        case TOP_DRAG:
        case TOP_DRAG_END:
        case TOP_DRAG_ENTER:
        case TOP_DRAG_EXIT:
        case TOP_DRAG_LEAVE:
        case TOP_DRAG_OVER:
        case TOP_DRAG_START:
        case TOP_DROP:
          EventConstructor = SyntheticDragEvent;
          break;

        case TOP_TOUCH_CANCEL:
        case TOP_TOUCH_END:
        case TOP_TOUCH_MOVE:
        case TOP_TOUCH_START:
          EventConstructor = SyntheticTouchEvent;
          break;

        case TOP_ANIMATION_END:
        case TOP_ANIMATION_ITERATION:
        case TOP_ANIMATION_START:
          EventConstructor = SyntheticAnimationEvent;
          break;

        case TOP_TRANSITION_END:
          EventConstructor = SyntheticTransitionEvent;
          break;

        case TOP_SCROLL:
          EventConstructor = SyntheticUIEvent;
          break;

        case TOP_WHEEL:
          EventConstructor = SyntheticWheelEvent;
          break;

        case TOP_COPY:
        case TOP_CUT:
        case TOP_PASTE:
          EventConstructor = SyntheticClipboardEvent;
          break;

        case TOP_GOT_POINTER_CAPTURE:
        case TOP_LOST_POINTER_CAPTURE:
        case TOP_POINTER_CANCEL:
        case TOP_POINTER_DOWN:
        case TOP_POINTER_MOVE:
        case TOP_POINTER_OUT:
        case TOP_POINTER_OVER:
        case TOP_POINTER_UP:
          EventConstructor = SyntheticPointerEvent;
          break;

        default:
          {
            if (knownHTMLTopLevelTypes.indexOf(topLevelType) === -1) {
              error('SimpleEventPlugin: Unhandled event type, `%s`. This warning ' + 'is likely caused by a bug in React. Please file an issue.', topLevelType);
            }
          } // HTML Events
          // @see http://www.w3.org/TR/html5/index.html#events-0


          EventConstructor = SyntheticEvent;
          break;
      }

      var event = EventConstructor.getPooled(dispatchConfig, targetInst, nativeEvent, nativeEventTarget);
      accumulateTwoPhaseDispatches(event);
      return event;
    }
  };

  /**
   * Specifies a deterministic ordering of `EventPlugin`s. A convenient way to
   * reason about plugins, without having to package every one of them. This
   * is better than having plugins be ordered in the same order that they
   * are injected because that ordering would be influenced by the packaging order.
   * `ResponderEventPlugin` must occur before `SimpleEventPlugin` so that
   * preventing default on events is convenient in `SimpleEventPlugin` handlers.
   */

  var DOMEventPluginOrder = ['ResponderEventPlugin', 'SimpleEventPlugin', 'EnterLeaveEventPlugin', 'ChangeEventPlugin', 'SelectEventPlugin', 'BeforeInputEventPlugin'];
  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */

  injectEventPluginOrder(DOMEventPluginOrder);
  setComponentTree(getFiberCurrentPropsFromNode$1, getInstanceFromNode$1, getNodeFromInstance$1);
  /**
   * Some important event plugins included by default (without having to require
   * them).
   */

  injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin
  });

  // Prefix measurements so that it's possible to filter them.
  // Longer prefixes are hard to read in DevTools.
  var reactEmoji = "\u269B";
  var warningEmoji = "\u26D4";
  var supportsUserTiming = typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.clearMarks === 'function' && typeof performance.measure === 'function' && typeof performance.clearMeasures === 'function'; // Keep track of current fiber so that we know the path to unwind on pause.
  // TODO: this looks the same as nextUnitOfWork in scheduler. Can we unify them?

  var currentFiber = null; // If we're in the middle of user code, which fiber and method is it?
  // Reusing `currentFiber` would be confusing for this because user code fiber
  // can change during commit phase too, but we don't need to unwind it (since
  // lifecycles in the commit phase don't resemble a tree).

  var currentPhase = null;
  var currentPhaseFiber = null; // Did lifecycle hook schedule an update? This is often a performance problem,
  // so we will keep track of it, and include it in the report.
  // Track commits caused by cascading updates.

  var isCommitting = false;
  var hasScheduledUpdateInCurrentCommit = false;
  var hasScheduledUpdateInCurrentPhase = false;
  var commitCountInCurrentWorkLoop = 0;
  var effectCountInCurrentCommit = 0;
  // to avoid stretch the commit phase with measurement overhead.

  var labelsInCurrentCommit = new Set();

  var formatMarkName = function (markName) {
    return reactEmoji + " " + markName;
  };

  var formatLabel = function (label, warning) {
    var prefix = warning ? warningEmoji + " " : reactEmoji + " ";
    var suffix = warning ? " Warning: " + warning : '';
    return "" + prefix + label + suffix;
  };

  var beginMark = function (markName) {
    performance.mark(formatMarkName(markName));
  };

  var clearMark = function (markName) {
    performance.clearMarks(formatMarkName(markName));
  };

  var endMark = function (label, markName, warning) {
    var formattedMarkName = formatMarkName(markName);
    var formattedLabel = formatLabel(label, warning);

    try {
      performance.measure(formattedLabel, formattedMarkName);
    } catch (err) {} // If previous mark was missing for some reason, this will throw.
    // This could only happen if React crashed in an unexpected place earlier.
    // Don't pile on with more errors.
    // Clear marks immediately to avoid growing buffer.


    performance.clearMarks(formattedMarkName);
    performance.clearMeasures(formattedLabel);
  };

  var getFiberMarkName = function (label, debugID) {
    return label + " (#" + debugID + ")";
  };

  var getFiberLabel = function (componentName, isMounted, phase) {
    if (phase === null) {
      // These are composite component total time measurements.
      return componentName + " [" + (isMounted ? 'update' : 'mount') + "]";
    } else {
      // Composite component methods.
      return componentName + "." + phase;
    }
  };

  var beginFiberMark = function (fiber, phase) {
    var componentName = getComponentName(fiber.type) || 'Unknown';
    var debugID = fiber._debugID;
    var isMounted = fiber.alternate !== null;
    var label = getFiberLabel(componentName, isMounted, phase);

    if (isCommitting && labelsInCurrentCommit.has(label)) {
      // During the commit phase, we don't show duplicate labels because
      // there is a fixed overhead for every measurement, and we don't
      // want to stretch the commit phase beyond necessary.
      return false;
    }

    labelsInCurrentCommit.add(label);
    var markName = getFiberMarkName(label, debugID);
    beginMark(markName);
    return true;
  };

  var clearFiberMark = function (fiber, phase) {
    var componentName = getComponentName(fiber.type) || 'Unknown';
    var debugID = fiber._debugID;
    var isMounted = fiber.alternate !== null;
    var label = getFiberLabel(componentName, isMounted, phase);
    var markName = getFiberMarkName(label, debugID);
    clearMark(markName);
  };

  var endFiberMark = function (fiber, phase, warning) {
    var componentName = getComponentName(fiber.type) || 'Unknown';
    var debugID = fiber._debugID;
    var isMounted = fiber.alternate !== null;
    var label = getFiberLabel(componentName, isMounted, phase);
    var markName = getFiberMarkName(label, debugID);
    endMark(label, markName, warning);
  };

  var shouldIgnoreFiber = function (fiber) {
    // Host components should be skipped in the timeline.
    // We could check typeof fiber.type, but does this work with RN?
    switch (fiber.tag) {
      case HostRoot:
      case HostComponent:
      case HostText:
      case HostPortal:
      case Fragment:
      case ContextProvider:
      case ContextConsumer:
      case Mode:
        return true;

      default:
        return false;
    }
  };

  var clearPendingPhaseMeasurement = function () {
    if (currentPhase !== null && currentPhaseFiber !== null) {
      clearFiberMark(currentPhaseFiber, currentPhase);
    }

    currentPhaseFiber = null;
    currentPhase = null;
    hasScheduledUpdateInCurrentPhase = false;
  };

  var pauseTimers = function () {
    // Stops all currently active measurements so that they can be resumed
    // if we continue in a later deferred loop from the same unit of work.
    var fiber = currentFiber;

    while (fiber) {
      if (fiber._debugIsCurrentlyTiming) {
        endFiberMark(fiber, null, null);
      }

      fiber = fiber.return;
    }
  };

  var resumeTimersRecursively = function (fiber) {
    if (fiber.return !== null) {
      resumeTimersRecursively(fiber.return);
    }

    if (fiber._debugIsCurrentlyTiming) {
      beginFiberMark(fiber, null);
    }
  };

  var resumeTimers = function () {
    // Resumes all measurements that were active during the last deferred loop.
    if (currentFiber !== null) {
      resumeTimersRecursively(currentFiber);
    }
  };

  function recordEffect() {
    {
      effectCountInCurrentCommit++;
    }
  }
  function recordScheduleUpdate() {
    {
      if (isCommitting) {
        hasScheduledUpdateInCurrentCommit = true;
      }

      if (currentPhase !== null && currentPhase !== 'componentWillMount' && currentPhase !== 'componentWillReceiveProps') {
        hasScheduledUpdateInCurrentPhase = true;
      }
    }
  }
  function startWorkTimer(fiber) {
    {
      if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
        return;
      } // If we pause, this is the fiber to unwind from.


      currentFiber = fiber;

      if (!beginFiberMark(fiber, null)) {
        return;
      }

      fiber._debugIsCurrentlyTiming = true;
    }
  }
  function cancelWorkTimer(fiber) {
    {
      if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
        return;
      } // Remember we shouldn't complete measurement for this fiber.
      // Otherwise flamechart will be deep even for small updates.


      fiber._debugIsCurrentlyTiming = false;
      clearFiberMark(fiber, null);
    }
  }
  function stopWorkTimer(fiber) {
    {
      if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
        return;
      } // If we pause, its parent is the fiber to unwind from.


      currentFiber = fiber.return;

      if (!fiber._debugIsCurrentlyTiming) {
        return;
      }

      fiber._debugIsCurrentlyTiming = false;
      endFiberMark(fiber, null, null);
    }
  }
  function stopFailedWorkTimer(fiber) {
    {
      if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
        return;
      } // If we pause, its parent is the fiber to unwind from.


      currentFiber = fiber.return;

      if (!fiber._debugIsCurrentlyTiming) {
        return;
      }

      fiber._debugIsCurrentlyTiming = false;
      var warning = fiber.tag === SuspenseComponent ? 'Rendering was suspended' : 'An error was thrown inside this error boundary';
      endFiberMark(fiber, null, warning);
    }
  }
  function startPhaseTimer(fiber, phase) {
    {
      if (!supportsUserTiming) {
        return;
      }

      clearPendingPhaseMeasurement();

      if (!beginFiberMark(fiber, phase)) {
        return;
      }

      currentPhaseFiber = fiber;
      currentPhase = phase;
    }
  }
  function stopPhaseTimer() {
    {
      if (!supportsUserTiming) {
        return;
      }

      if (currentPhase !== null && currentPhaseFiber !== null) {
        var warning = hasScheduledUpdateInCurrentPhase ? 'Scheduled a cascading update' : null;
        endFiberMark(currentPhaseFiber, currentPhase, warning);
      }

      currentPhase = null;
      currentPhaseFiber = null;
    }
  }
  function startWorkLoopTimer(nextUnitOfWork) {
    {
      currentFiber = nextUnitOfWork;

      if (!supportsUserTiming) {
        return;
      }

      commitCountInCurrentWorkLoop = 0; // This is top level call.
      // Any other measurements are performed within.

      beginMark('(React Tree Reconciliation)'); // Resume any measurements that were in progress during the last loop.

      resumeTimers();
    }
  }
  function stopWorkLoopTimer(interruptedBy, didCompleteRoot) {
    {
      if (!supportsUserTiming) {
        return;
      }

      var warning = null;

      if (interruptedBy !== null) {
        if (interruptedBy.tag === HostRoot) {
          warning = 'A top-level update interrupted the previous render';
        } else {
          var componentName = getComponentName(interruptedBy.type) || 'Unknown';
          warning = "An update to " + componentName + " interrupted the previous render";
        }
      } else if (commitCountInCurrentWorkLoop > 1) {
        warning = 'There were cascading updates';
      }

      commitCountInCurrentWorkLoop = 0;
      var label = didCompleteRoot ? '(React Tree Reconciliation: Completed Root)' : '(React Tree Reconciliation: Yielded)'; // Pause any measurements until the next loop.

      pauseTimers();
      endMark(label, '(React Tree Reconciliation)', warning);
    }
  }
  function startCommitTimer() {
    {
      if (!supportsUserTiming) {
        return;
      }

      isCommitting = true;
      hasScheduledUpdateInCurrentCommit = false;
      labelsInCurrentCommit.clear();
      beginMark('(Committing Changes)');
    }
  }
  function stopCommitTimer() {
    {
      if (!supportsUserTiming) {
        return;
      }

      var warning = null;

      if (hasScheduledUpdateInCurrentCommit) {
        warning = 'Lifecycle hook scheduled a cascading update';
      } else if (commitCountInCurrentWorkLoop > 0) {
        warning = 'Caused by a cascading update in earlier commit';
      }

      hasScheduledUpdateInCurrentCommit = false;
      commitCountInCurrentWorkLoop++;
      isCommitting = false;
      labelsInCurrentCommit.clear();
      endMark('(Committing Changes)', '(Committing Changes)', warning);
    }
  }
  function startCommitSnapshotEffectsTimer() {
    {
      if (!supportsUserTiming) {
        return;
      }

      effectCountInCurrentCommit = 0;
      beginMark('(Committing Snapshot Effects)');
    }
  }
  function stopCommitSnapshotEffectsTimer() {
    {
      if (!supportsUserTiming) {
        return;
      }

      var count = effectCountInCurrentCommit;
      effectCountInCurrentCommit = 0;
      endMark("(Committing Snapshot Effects: " + count + " Total)", '(Committing Snapshot Effects)', null);
    }
  }
  function startCommitHostEffectsTimer() {
    {
      if (!supportsUserTiming) {
        return;
      }

      effectCountInCurrentCommit = 0;
      beginMark('(Committing Host Effects)');
    }
  }
  function stopCommitHostEffectsTimer() {
    {
      if (!supportsUserTiming) {
        return;
      }

      var count = effectCountInCurrentCommit;
      effectCountInCurrentCommit = 0;
      endMark("(Committing Host Effects: " + count + " Total)", '(Committing Host Effects)', null);
    }
  }
  function startCommitLifeCyclesTimer() {
    {
      if (!supportsUserTiming) {
        return;
      }

      effectCountInCurrentCommit = 0;
      beginMark('(Calling Lifecycle Methods)');
    }
  }
  function stopCommitLifeCyclesTimer() {
    {
      if (!supportsUserTiming) {
        return;
      }

      var count = effectCountInCurrentCommit;
      effectCountInCurrentCommit = 0;
      endMark("(Calling Lifecycle Methods: " + count + " Total)", '(Calling Lifecycle Methods)', null);
    }
  }

  var valueStack = [];
  var fiberStack;

  {
    fiberStack = [];
  }

  var index = -1;

  function createCursor(defaultValue) {
    return {
      current: defaultValue
    };
  }

  function pop(cursor, fiber) {
    if (index < 0) {
      {
        error('Unexpected pop.');
      }

      return;
    }

    {
      if (fiber !== fiberStack[index]) {
        error('Unexpected Fiber popped.');
      }
    }

    cursor.current = valueStack[index];
    valueStack[index] = null;

    {
      fiberStack[index] = null;
    }

    index--;
  }

  function push(cursor, value, fiber) {
    index++;
    valueStack[index] = cursor.current;

    {
      fiberStack[index] = fiber;
    }

    cursor.current = value;
  }

  var warnedAboutMissingGetChildContext;

  {
    warnedAboutMissingGetChildContext = {};
  }

  var emptyContextObject = {};

  {
    Object.freeze(emptyContextObject);
  } // A cursor to the current merged context object on the stack.


  var contextStackCursor = createCursor(emptyContextObject); // A cursor to a boolean indicating whether the context has changed.

  var didPerformWorkStackCursor = createCursor(false); // Keep track of the previous context object that was on the stack.
  // We use this to get access to the parent context after we have already
  // pushed the next context provider, and now need to merge their contexts.

  var previousContext = emptyContextObject;

  function getUnmaskedContext(workInProgress, Component, didPushOwnContextIfProvider) {
    {
      if (didPushOwnContextIfProvider && isContextProvider(Component)) {
        // If the fiber is a context provider itself, when we read its context
        // we may have already pushed its own child context on the stack. A context
        // provider should not "see" its own child context. Therefore we read the
        // previous (parent) context instead for a context provider.
        return previousContext;
      }

      return contextStackCursor.current;
    }
  }

  function cacheContext(workInProgress, unmaskedContext, maskedContext) {
    {
      var instance = workInProgress.stateNode;
      instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
      instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
    }
  }

  function getMaskedContext(workInProgress, unmaskedContext) {
    {
      var type = workInProgress.type;
      var contextTypes = type.contextTypes;

      if (!contextTypes) {
        return emptyContextObject;
      } // Avoid recreating masked context unless unmasked context has changed.
      // Failing to do this will result in unnecessary calls to componentWillReceiveProps.
      // This may trigger infinite loops if componentWillReceiveProps calls setState.


      var instance = workInProgress.stateNode;

      if (instance && instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext) {
        return instance.__reactInternalMemoizedMaskedChildContext;
      }

      var context = {};

      for (var key in contextTypes) {
        context[key] = unmaskedContext[key];
      }

      {
        var name = getComponentName(type) || 'Unknown';
        checkPropTypes_1(contextTypes, context, 'context', name, getCurrentFiberStackInDev);
      } // Cache unmasked context so we can avoid recreating masked context unless necessary.
      // Context is created before the class component is instantiated so check for instance.


      if (instance) {
        cacheContext(workInProgress, unmaskedContext, context);
      }

      return context;
    }
  }

  function hasContextChanged() {
    {
      return didPerformWorkStackCursor.current;
    }
  }

  function isContextProvider(type) {
    {
      var childContextTypes = type.childContextTypes;
      return childContextTypes !== null && childContextTypes !== undefined;
    }
  }

  function popContext(fiber) {
    {
      pop(didPerformWorkStackCursor, fiber);
      pop(contextStackCursor, fiber);
    }
  }

  function popTopLevelContextObject(fiber) {
    {
      pop(didPerformWorkStackCursor, fiber);
      pop(contextStackCursor, fiber);
    }
  }

  function pushTopLevelContextObject(fiber, context, didChange) {
    {
      if (!(contextStackCursor.current === emptyContextObject)) {
        {
          throw Error( "Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue." );
        }
      }

      push(contextStackCursor, context, fiber);
      push(didPerformWorkStackCursor, didChange, fiber);
    }
  }

  function processChildContext(fiber, type, parentContext) {
    {
      var instance = fiber.stateNode;
      var childContextTypes = type.childContextTypes; // TODO (bvaughn) Replace this behavior with an invariant() in the future.
      // It has only been added in Fiber to match the (unintentional) behavior in Stack.

      if (typeof instance.getChildContext !== 'function') {
        {
          var componentName = getComponentName(type) || 'Unknown';

          if (!warnedAboutMissingGetChildContext[componentName]) {
            warnedAboutMissingGetChildContext[componentName] = true;

            error('%s.childContextTypes is specified but there is no getChildContext() method ' + 'on the instance. You can either define getChildContext() on %s or remove ' + 'childContextTypes from it.', componentName, componentName);
          }
        }

        return parentContext;
      }

      var childContext;
      startPhaseTimer(fiber, 'getChildContext');
      childContext = instance.getChildContext();
      stopPhaseTimer();

      for (var contextKey in childContext) {
        if (!(contextKey in childContextTypes)) {
          {
            throw Error( (getComponentName(type) || 'Unknown') + ".getChildContext(): key \"" + contextKey + "\" is not defined in childContextTypes." );
          }
        }
      }

      {
        var name = getComponentName(type) || 'Unknown';
        checkPropTypes_1(childContextTypes, childContext, 'child context', name, // In practice, there is one case in which we won't get a stack. It's when
        // somebody calls unstable_renderSubtreeIntoContainer() and we process
        // context from the parent component instance. The stack will be missing
        // because it's outside of the reconciliation, and so the pointer has not
        // been set. This is rare and doesn't matter. We'll also remove that API.
        getCurrentFiberStackInDev);
      }

      return _assign({}, parentContext, {}, childContext);
    }
  }

  function pushContextProvider(workInProgress) {
    {
      var instance = workInProgress.stateNode; // We push the context as early as possible to ensure stack integrity.
      // If the instance does not exist yet, we will push null at first,
      // and replace it on the stack later when invalidating the context.

      var memoizedMergedChildContext = instance && instance.__reactInternalMemoizedMergedChildContext || emptyContextObject; // Remember the parent context so we can merge with it later.
      // Inherit the parent's did-perform-work value to avoid inadvertently blocking updates.

      previousContext = contextStackCursor.current;
      push(contextStackCursor, memoizedMergedChildContext, workInProgress);
      push(didPerformWorkStackCursor, didPerformWorkStackCursor.current, workInProgress);
      return true;
    }
  }

  function invalidateContextProvider(workInProgress, type, didChange) {
    {
      var instance = workInProgress.stateNode;

      if (!instance) {
        {
          throw Error( "Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue." );
        }
      }

      if (didChange) {
        // Merge parent and own context.
        // Skip this if we're not updating due to sCU.
        // This avoids unnecessarily recomputing memoized values.
        var mergedContext = processChildContext(workInProgress, type, previousContext);
        instance.__reactInternalMemoizedMergedChildContext = mergedContext; // Replace the old (or empty) context with the new one.
        // It is important to unwind the context in the reverse order.

        pop(didPerformWorkStackCursor, workInProgress);
        pop(contextStackCursor, workInProgress); // Now push the new context and mark that it has changed.

        push(contextStackCursor, mergedContext, workInProgress);
        push(didPerformWorkStackCursor, didChange, workInProgress);
      } else {
        pop(didPerformWorkStackCursor, workInProgress);
        push(didPerformWorkStackCursor, didChange, workInProgress);
      }
    }
  }

  function findCurrentUnmaskedContext(fiber) {
    {
      // Currently this is only used with renderSubtreeIntoContainer; not sure if it
      // makes sense elsewhere
      if (!(isFiberMounted(fiber) && fiber.tag === ClassComponent)) {
        {
          throw Error( "Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue." );
        }
      }

      var node = fiber;

      do {
        switch (node.tag) {
          case HostRoot:
            return node.stateNode.context;

          case ClassComponent:
            {
              var Component = node.type;

              if (isContextProvider(Component)) {
                return node.stateNode.__reactInternalMemoizedMergedChildContext;
              }

              break;
            }
        }

        node = node.return;
      } while (node !== null);

      {
        {
          throw Error( "Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue." );
        }
      }
    }
  }

  var LegacyRoot = 0;
  var BlockingRoot = 1;
  var ConcurrentRoot = 2;

  var ReactInternals$2 = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  var _ReactInternals$Sched$1 = ReactInternals$2.SchedulerTracing,
      __interactionsRef = _ReactInternals$Sched$1.__interactionsRef,
      __subscriberRef = _ReactInternals$Sched$1.__subscriberRef,
      unstable_clear = _ReactInternals$Sched$1.unstable_clear,
      unstable_getCurrent = _ReactInternals$Sched$1.unstable_getCurrent,
      unstable_getThreadID = _ReactInternals$Sched$1.unstable_getThreadID,
      unstable_subscribe = _ReactInternals$Sched$1.unstable_subscribe,
      unstable_trace = _ReactInternals$Sched$1.unstable_trace,
      unstable_unsubscribe = _ReactInternals$Sched$1.unstable_unsubscribe,
      unstable_wrap = _ReactInternals$Sched$1.unstable_wrap;

  var Scheduler_runWithPriority = unstable_runWithPriority,
      Scheduler_scheduleCallback = unstable_scheduleCallback,
      Scheduler_cancelCallback = unstable_cancelCallback,
      Scheduler_shouldYield = unstable_shouldYield,
      Scheduler_requestPaint = unstable_requestPaint,
      Scheduler_now = unstable_now,
      Scheduler_getCurrentPriorityLevel = unstable_getCurrentPriorityLevel,
      Scheduler_ImmediatePriority = unstable_ImmediatePriority,
      Scheduler_UserBlockingPriority = unstable_UserBlockingPriority,
      Scheduler_NormalPriority = unstable_NormalPriority,
      Scheduler_LowPriority = unstable_LowPriority,
      Scheduler_IdlePriority = unstable_IdlePriority;

  {
    // Provide explicit error message when production+profiling bundle of e.g.
    // react-dom is used with production (non-profiling) bundle of
    // scheduler/tracing
    if (!(__interactionsRef != null && __interactionsRef.current != null)) {
      {
        throw Error( "It is not supported to run the profiling version of a renderer (for example, `react-dom/profiling`) without also replacing the `scheduler/tracing` module with `scheduler/tracing-profiling`. Your bundler might have a setting for aliasing both modules. Learn more at http://fb.me/react-profiling" );
      }
    }
  }

  var fakeCallbackNode = {}; // Except for NoPriority, these correspond to Scheduler priorities. We use
  // ascending numbers so we can compare them like numbers. They start at 90 to
  // avoid clashing with Scheduler's priorities.

  var ImmediatePriority = 99;
  var UserBlockingPriority$1 = 98;
  var NormalPriority = 97;
  var LowPriority = 96;
  var IdlePriority = 95; // NoPriority is the absence of priority. Also React-only.

  var NoPriority = 90;
  var shouldYield = Scheduler_shouldYield;
  var requestPaint = // Fall back gracefully if we're running an older version of Scheduler.
  Scheduler_requestPaint !== undefined ? Scheduler_requestPaint : function () {};
  var syncQueue = null;
  var immediateQueueCallbackNode = null;
  var isFlushingSyncQueue = false;
  var initialTimeMs = Scheduler_now(); // If the initial timestamp is reasonably small, use Scheduler's `now` directly.
  // This will be the case for modern browsers that support `performance.now`. In
  // older browsers, Scheduler falls back to `Date.now`, which returns a Unix
  // timestamp. In that case, subtract the module initialization time to simulate
  // the behavior of performance.now and keep our times small enough to fit
  // within 32 bits.
  // TODO: Consider lifting this into Scheduler.

  var now = initialTimeMs < 10000 ? Scheduler_now : function () {
    return Scheduler_now() - initialTimeMs;
  };
  function getCurrentPriorityLevel() {
    switch (Scheduler_getCurrentPriorityLevel()) {
      case Scheduler_ImmediatePriority:
        return ImmediatePriority;

      case Scheduler_UserBlockingPriority:
        return UserBlockingPriority$1;

      case Scheduler_NormalPriority:
        return NormalPriority;

      case Scheduler_LowPriority:
        return LowPriority;

      case Scheduler_IdlePriority:
        return IdlePriority;

      default:
        {
          {
            throw Error( "Unknown priority level." );
          }
        }

    }
  }

  function reactPriorityToSchedulerPriority(reactPriorityLevel) {
    switch (reactPriorityLevel) {
      case ImmediatePriority:
        return Scheduler_ImmediatePriority;

      case UserBlockingPriority$1:
        return Scheduler_UserBlockingPriority;

      case NormalPriority:
        return Scheduler_NormalPriority;

      case LowPriority:
        return Scheduler_LowPriority;

      case IdlePriority:
        return Scheduler_IdlePriority;

      default:
        {
          {
            throw Error( "Unknown priority level." );
          }
        }

    }
  }

  function runWithPriority$1(reactPriorityLevel, fn) {
    var priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
    return Scheduler_runWithPriority(priorityLevel, fn);
  }
  function scheduleCallback(reactPriorityLevel, callback, options) {
    var priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
    return Scheduler_scheduleCallback(priorityLevel, callback, options);
  }
  function scheduleSyncCallback(callback) {
    // Push this callback into an internal queue. We'll flush these either in
    // the next tick, or earlier if something calls `flushSyncCallbackQueue`.
    if (syncQueue === null) {
      syncQueue = [callback]; // Flush the queue in the next tick, at the earliest.

      immediateQueueCallbackNode = Scheduler_scheduleCallback(Scheduler_ImmediatePriority, flushSyncCallbackQueueImpl);
    } else {
      // Push onto existing queue. Don't need to schedule a callback because
      // we already scheduled one when we created the queue.
      syncQueue.push(callback);
    }

    return fakeCallbackNode;
  }
  function cancelCallback(callbackNode) {
    if (callbackNode !== fakeCallbackNode) {
      Scheduler_cancelCallback(callbackNode);
    }
  }
  function flushSyncCallbackQueue() {
    if (immediateQueueCallbackNode !== null) {
      var node = immediateQueueCallbackNode;
      immediateQueueCallbackNode = null;
      Scheduler_cancelCallback(node);
    }

    flushSyncCallbackQueueImpl();
  }

  function flushSyncCallbackQueueImpl() {
    if (!isFlushingSyncQueue && syncQueue !== null) {
      // Prevent re-entrancy.
      isFlushingSyncQueue = true;
      var i = 0;

      try {
        var _isSync = true;
        var queue = syncQueue;
        runWithPriority$1(ImmediatePriority, function () {
          for (; i < queue.length; i++) {
            var callback = queue[i];

            do {
              callback = callback(_isSync);
            } while (callback !== null);
          }
        });
        syncQueue = null;
      } catch (error) {
        // If something throws, leave the remaining callbacks on the queue.
        if (syncQueue !== null) {
          syncQueue = syncQueue.slice(i + 1);
        } // Resume flushing in the next tick


        Scheduler_scheduleCallback(Scheduler_ImmediatePriority, flushSyncCallbackQueue);
        throw error;
      } finally {
        isFlushingSyncQueue = false;
      }
    }
  }

  var NoMode = 0;
  var StrictMode = 1; // TODO: Remove BlockingMode and ConcurrentMode by reading from the root
  // tag instead

  var BlockingMode = 2;
  var ConcurrentMode = 4;
  var ProfileMode = 8;

  // Max 31 bit integer. The max integer size in V8 for 32-bit systems.
  // Math.pow(2, 30) - 1
  // 0b111111111111111111111111111111
  var MAX_SIGNED_31_BIT_INT = 1073741823;

  var NoWork = 0; // TODO: Think of a better name for Never. The key difference with Idle is that
  // Never work can be committed in an inconsistent state without tearing the UI.
  // The main example is offscreen content, like a hidden subtree. So one possible
  // name is Offscreen. However, it also includes dehydrated Suspense boundaries,
  // which are inconsistent in the sense that they haven't finished yet, but
  // aren't visibly inconsistent because the server rendered HTML matches what the
  // hydrated tree would look like.

  var Never = 1; // Idle is slightly higher priority than Never. It must completely finish in
  // order to be consistent.

  var Idle = 2; // Continuous Hydration is slightly higher than Idle and is used to increase
  // priority of hover targets.

  var ContinuousHydration = 3;
  var Sync = MAX_SIGNED_31_BIT_INT;
  var Batched = Sync - 1;
  var UNIT_SIZE = 10;
  var MAGIC_NUMBER_OFFSET = Batched - 1; // 1 unit of expiration time represents 10ms.

  function msToExpirationTime(ms) {
    // Always subtract from the offset so that we don't clash with the magic number for NoWork.
    return MAGIC_NUMBER_OFFSET - (ms / UNIT_SIZE | 0);
  }
  function expirationTimeToMs(expirationTime) {
    return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
  }

  function ceiling(num, precision) {
    return ((num / precision | 0) + 1) * precision;
  }

  function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs) {
    return MAGIC_NUMBER_OFFSET - ceiling(MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE, bucketSizeMs / UNIT_SIZE);
  } // TODO: This corresponds to Scheduler's NormalPriority, not LowPriority. Update
  // the names to reflect.


  var LOW_PRIORITY_EXPIRATION = 5000;
  var LOW_PRIORITY_BATCH_SIZE = 250;
  function computeAsyncExpiration(currentTime) {
    return computeExpirationBucket(currentTime, LOW_PRIORITY_EXPIRATION, LOW_PRIORITY_BATCH_SIZE);
  }
  function computeSuspenseExpiration(currentTime, timeoutMs) {
    // TODO: Should we warn if timeoutMs is lower than the normal pri expiration time?
    return computeExpirationBucket(currentTime, timeoutMs, LOW_PRIORITY_BATCH_SIZE);
  } // We intentionally set a higher expiration time for interactive updates in
  // dev than in production.
  //
  // If the main thread is being blocked so long that you hit the expiration,
  // it's a problem that could be solved with better scheduling.
  //
  // People will be more likely to notice this and fix it with the long
  // expiration time in development.
  //
  // In production we opt for better UX at the risk of masking scheduling
  // problems, by expiring fast.

  var HIGH_PRIORITY_EXPIRATION =  500 ;
  var HIGH_PRIORITY_BATCH_SIZE = 100;
  function computeInteractiveExpiration(currentTime) {
    return computeExpirationBucket(currentTime, HIGH_PRIORITY_EXPIRATION, HIGH_PRIORITY_BATCH_SIZE);
  }
  function inferPriorityFromExpirationTime(currentTime, expirationTime) {
    if (expirationTime === Sync) {
      return ImmediatePriority;
    }

    if (expirationTime === Never || expirationTime === Idle) {
      return IdlePriority;
    }

    var msUntil = expirationTimeToMs(expirationTime) - expirationTimeToMs(currentTime);

    if (msUntil <= 0) {
      return ImmediatePriority;
    }

    if (msUntil <= HIGH_PRIORITY_EXPIRATION + HIGH_PRIORITY_BATCH_SIZE) {
      return UserBlockingPriority$1;
    }

    if (msUntil <= LOW_PRIORITY_EXPIRATION + LOW_PRIORITY_BATCH_SIZE) {
      return NormalPriority;
    } // TODO: Handle LowPriority
    // Assume anything lower has idle priority


    return IdlePriority;
  }

  var ReactStrictModeWarnings = {
    recordUnsafeLifecycleWarnings: function (fiber, instance) {},
    flushPendingUnsafeLifecycleWarnings: function () {},
    recordLegacyContextWarning: function (fiber, instance) {},
    flushLegacyContextWarning: function () {},
    discardPendingWarnings: function () {}
  };

  {
    var findStrictRoot = function (fiber) {
      var maybeStrictRoot = null;
      var node = fiber;

      while (node !== null) {
        if (node.mode & StrictMode) {
          maybeStrictRoot = node;
        }

        node = node.return;
      }

      return maybeStrictRoot;
    };

    var setToSortedString = function (set) {
      var array = [];
      set.forEach(function (value) {
        array.push(value);
      });
      return array.sort().join(', ');
    };

    var pendingComponentWillMountWarnings = [];
    var pendingUNSAFE_ComponentWillMountWarnings = [];
    var pendingComponentWillReceivePropsWarnings = [];
    var pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
    var pendingComponentWillUpdateWarnings = [];
    var pendingUNSAFE_ComponentWillUpdateWarnings = []; // Tracks components we have already warned about.

    var didWarnAboutUnsafeLifecycles = new Set();

    ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = function (fiber, instance) {
      // Dedup strategy: Warn once per component.
      if (didWarnAboutUnsafeLifecycles.has(fiber.type)) {
        return;
      }

      if (typeof instance.componentWillMount === 'function' && // Don't warn about react-lifecycles-compat polyfilled components.
      instance.componentWillMount.__suppressDeprecationWarning !== true) {
        pendingComponentWillMountWarnings.push(fiber);
      }

      if (fiber.mode & StrictMode && typeof instance.UNSAFE_componentWillMount === 'function') {
        pendingUNSAFE_ComponentWillMountWarnings.push(fiber);
      }

      if (typeof instance.componentWillReceiveProps === 'function' && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
        pendingComponentWillReceivePropsWarnings.push(fiber);
      }

      if (fiber.mode & StrictMode && typeof instance.UNSAFE_componentWillReceiveProps === 'function') {
        pendingUNSAFE_ComponentWillReceivePropsWarnings.push(fiber);
      }

      if (typeof instance.componentWillUpdate === 'function' && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
        pendingComponentWillUpdateWarnings.push(fiber);
      }

      if (fiber.mode & StrictMode && typeof instance.UNSAFE_componentWillUpdate === 'function') {
        pendingUNSAFE_ComponentWillUpdateWarnings.push(fiber);
      }
    };

    ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = function () {
      // We do an initial pass to gather component names
      var componentWillMountUniqueNames = new Set();

      if (pendingComponentWillMountWarnings.length > 0) {
        pendingComponentWillMountWarnings.forEach(function (fiber) {
          componentWillMountUniqueNames.add(getComponentName(fiber.type) || 'Component');
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        });
        pendingComponentWillMountWarnings = [];
      }

      var UNSAFE_componentWillMountUniqueNames = new Set();

      if (pendingUNSAFE_ComponentWillMountWarnings.length > 0) {
        pendingUNSAFE_ComponentWillMountWarnings.forEach(function (fiber) {
          UNSAFE_componentWillMountUniqueNames.add(getComponentName(fiber.type) || 'Component');
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        });
        pendingUNSAFE_ComponentWillMountWarnings = [];
      }

      var componentWillReceivePropsUniqueNames = new Set();

      if (pendingComponentWillReceivePropsWarnings.length > 0) {
        pendingComponentWillReceivePropsWarnings.forEach(function (fiber) {
          componentWillReceivePropsUniqueNames.add(getComponentName(fiber.type) || 'Component');
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        });
        pendingComponentWillReceivePropsWarnings = [];
      }

      var UNSAFE_componentWillReceivePropsUniqueNames = new Set();

      if (pendingUNSAFE_ComponentWillReceivePropsWarnings.length > 0) {
        pendingUNSAFE_ComponentWillReceivePropsWarnings.forEach(function (fiber) {
          UNSAFE_componentWillReceivePropsUniqueNames.add(getComponentName(fiber.type) || 'Component');
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        });
        pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
      }

      var componentWillUpdateUniqueNames = new Set();

      if (pendingComponentWillUpdateWarnings.length > 0) {
        pendingComponentWillUpdateWarnings.forEach(function (fiber) {
          componentWillUpdateUniqueNames.add(getComponentName(fiber.type) || 'Component');
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        });
        pendingComponentWillUpdateWarnings = [];
      }

      var UNSAFE_componentWillUpdateUniqueNames = new Set();

      if (pendingUNSAFE_ComponentWillUpdateWarnings.length > 0) {
        pendingUNSAFE_ComponentWillUpdateWarnings.forEach(function (fiber) {
          UNSAFE_componentWillUpdateUniqueNames.add(getComponentName(fiber.type) || 'Component');
          didWarnAboutUnsafeLifecycles.add(fiber.type);
        });
        pendingUNSAFE_ComponentWillUpdateWarnings = [];
      } // Finally, we flush all the warnings
      // UNSAFE_ ones before the deprecated ones, since they'll be 'louder'


      if (UNSAFE_componentWillMountUniqueNames.size > 0) {
        var sortedNames = setToSortedString(UNSAFE_componentWillMountUniqueNames);

        error('Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. ' + 'See https://fb.me/react-unsafe-component-lifecycles for details.\n\n' + '* Move code with side effects to componentDidMount, and set initial state in the constructor.\n' + '\nPlease update the following components: %s', sortedNames);
      }

      if (UNSAFE_componentWillReceivePropsUniqueNames.size > 0) {
        var _sortedNames = setToSortedString(UNSAFE_componentWillReceivePropsUniqueNames);

        error('Using UNSAFE_componentWillReceiveProps in strict mode is not recommended ' + 'and may indicate bugs in your code. ' + 'See https://fb.me/react-unsafe-component-lifecycles for details.\n\n' + '* Move data fetching code or side effects to componentDidUpdate.\n' + "* If you're updating state whenever props change, " + 'refactor your code to use memoization techniques or move it to ' + 'static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state\n' + '\nPlease update the following components: %s', _sortedNames);
      }

      if (UNSAFE_componentWillUpdateUniqueNames.size > 0) {
        var _sortedNames2 = setToSortedString(UNSAFE_componentWillUpdateUniqueNames);

        error('Using UNSAFE_componentWillUpdate in strict mode is not recommended ' + 'and may indicate bugs in your code. ' + 'See https://fb.me/react-unsafe-component-lifecycles for details.\n\n' + '* Move data fetching code or side effects to componentDidUpdate.\n' + '\nPlease update the following components: %s', _sortedNames2);
      }

      if (componentWillMountUniqueNames.size > 0) {
        var _sortedNames3 = setToSortedString(componentWillMountUniqueNames);

        warn('componentWillMount has been renamed, and is not recommended for use. ' + 'See https://fb.me/react-unsafe-component-lifecycles for details.\n\n' + '* Move code with side effects to componentDidMount, and set initial state in the constructor.\n' + '* Rename componentWillMount to UNSAFE_componentWillMount to suppress ' + 'this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. ' + 'To rename all deprecated lifecycles to their new names, you can run ' + '`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n' + '\nPlease update the following components: %s', _sortedNames3);
      }

      if (componentWillReceivePropsUniqueNames.size > 0) {
        var _sortedNames4 = setToSortedString(componentWillReceivePropsUniqueNames);

        warn('componentWillReceiveProps has been renamed, and is not recommended for use. ' + 'See https://fb.me/react-unsafe-component-lifecycles for details.\n\n' + '* Move data fetching code or side effects to componentDidUpdate.\n' + "* If you're updating state whenever props change, refactor your " + 'code to use memoization techniques or move it to ' + 'static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state\n' + '* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress ' + 'this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. ' + 'To rename all deprecated lifecycles to their new names, you can run ' + '`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n' + '\nPlease update the following components: %s', _sortedNames4);
      }

      if (componentWillUpdateUniqueNames.size > 0) {
        var _sortedNames5 = setToSortedString(componentWillUpdateUniqueNames);

        warn('componentWillUpdate has been renamed, and is not recommended for use. ' + 'See https://fb.me/react-unsafe-component-lifecycles for details.\n\n' + '* Move data fetching code or side effects to componentDidUpdate.\n' + '* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress ' + 'this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. ' + 'To rename all deprecated lifecycles to their new names, you can run ' + '`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n' + '\nPlease update the following components: %s', _sortedNames5);
      }
    };

    var pendingLegacyContextWarning = new Map(); // Tracks components we have already warned about.

    var didWarnAboutLegacyContext = new Set();

    ReactStrictModeWarnings.recordLegacyContextWarning = function (fiber, instance) {
      var strictRoot = findStrictRoot(fiber);

      if (strictRoot === null) {
        error('Expected to find a StrictMode component in a strict mode tree. ' + 'This error is likely caused by a bug in React. Please file an issue.');

        return;
      } // Dedup strategy: Warn once per component.


      if (didWarnAboutLegacyContext.has(fiber.type)) {
        return;
      }

      var warningsForRoot = pendingLegacyContextWarning.get(strictRoot);

      if (fiber.type.contextTypes != null || fiber.type.childContextTypes != null || instance !== null && typeof instance.getChildContext === 'function') {
        if (warningsForRoot === undefined) {
          warningsForRoot = [];
          pendingLegacyContextWarning.set(strictRoot, warningsForRoot);
        }

        warningsForRoot.push(fiber);
      }
    };

    ReactStrictModeWarnings.flushLegacyContextWarning = function () {
      pendingLegacyContextWarning.forEach(function (fiberArray, strictRoot) {
        if (fiberArray.length === 0) {
          return;
        }

        var firstFiber = fiberArray[0];
        var uniqueNames = new Set();
        fiberArray.forEach(function (fiber) {
          uniqueNames.add(getComponentName(fiber.type) || 'Component');
          didWarnAboutLegacyContext.add(fiber.type);
        });
        var sortedNames = setToSortedString(uniqueNames);
        var firstComponentStack = getStackByFiberInDevAndProd(firstFiber);

        error('Legacy context API has been detected within a strict-mode tree.' + '\n\nThe old API will be supported in all 16.x releases, but applications ' + 'using it should migrate to the new version.' + '\n\nPlease update the following components: %s' + '\n\nLearn more about this warning here: https://fb.me/react-legacy-context' + '%s', sortedNames, firstComponentStack);
      });
    };

    ReactStrictModeWarnings.discardPendingWarnings = function () {
      pendingComponentWillMountWarnings = [];
      pendingUNSAFE_ComponentWillMountWarnings = [];
      pendingComponentWillReceivePropsWarnings = [];
      pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
      pendingComponentWillUpdateWarnings = [];
      pendingUNSAFE_ComponentWillUpdateWarnings = [];
      pendingLegacyContextWarning = new Map();
    };
  }

  var resolveFamily = null; // $FlowFixMe Flow gets confused by a WeakSet feature check below.

  var failedBoundaries = null;
  var setRefreshHandler = function (handler) {
    {
      resolveFamily = handler;
    }
  };
  function resolveFunctionForHotReloading(type) {
    {
      if (resolveFamily === null) {
        // Hot reloading is disabled.
        return type;
      }

      var family = resolveFamily(type);

      if (family === undefined) {
        return type;
      } // Use the latest known implementation.


      return family.current;
    }
  }
  function resolveClassForHotReloading(type) {
    // No implementation differences.
    return resolveFunctionForHotReloading(type);
  }
  function resolveForwardRefForHotReloading(type) {
    {
      if (resolveFamily === null) {
        // Hot reloading is disabled.
        return type;
      }

      var family = resolveFamily(type);

      if (family === undefined) {
        // Check if we're dealing with a real forwardRef. Don't want to crash early.
        if (type !== null && type !== undefined && typeof type.render === 'function') {
          // ForwardRef is special because its resolved .type is an object,
          // but it's possible that we only have its inner render function in the map.
          // If that inner render function is different, we'll build a new forwardRef type.
          var currentRender = resolveFunctionForHotReloading(type.render);

          if (type.render !== currentRender) {
            var syntheticType = {
              $$typeof: REACT_FORWARD_REF_TYPE,
              render: currentRender
            };

            if (type.displayName !== undefined) {
              syntheticType.displayName = type.displayName;
            }

            return syntheticType;
          }
        }

        return type;
      } // Use the latest known implementation.


      return family.current;
    }
  }
  function isCompatibleFamilyForHotReloading(fiber, element) {
    {
      if (resolveFamily === null) {
        // Hot reloading is disabled.
        return false;
      }

      var prevType = fiber.elementType;
      var nextType = element.type; // If we got here, we know types aren't === equal.

      var needsCompareFamilies = false;
      var $$typeofNextType = typeof nextType === 'object' && nextType !== null ? nextType.$$typeof : null;

      switch (fiber.tag) {
        case ClassComponent:
          {
            if (typeof nextType === 'function') {
              needsCompareFamilies = true;
            }

            break;
          }

        case FunctionComponent:
          {
            if (typeof nextType === 'function') {
              needsCompareFamilies = true;
            } else if ($$typeofNextType === REACT_LAZY_TYPE) {
              // We don't know the inner type yet.
              // We're going to assume that the lazy inner type is stable,
              // and so it is sufficient to avoid reconciling it away.
              // We're not going to unwrap or actually use the new lazy type.
              needsCompareFamilies = true;
            }

            break;
          }

        case ForwardRef:
          {
            if ($$typeofNextType === REACT_FORWARD_REF_TYPE) {
              needsCompareFamilies = true;
            } else if ($$typeofNextType === REACT_LAZY_TYPE) {
              needsCompareFamilies = true;
            }

            break;
          }

        case MemoComponent:
        case SimpleMemoComponent:
          {
            if ($$typeofNextType === REACT_MEMO_TYPE) {
              // TODO: if it was but can no longer be simple,
              // we shouldn't set this.
              needsCompareFamilies = true;
            } else if ($$typeofNextType === REACT_LAZY_TYPE) {
              needsCompareFamilies = true;
            }

            break;
          }

        default:
          return false;
      } // Check if both types have a family and it's the same one.


      if (needsCompareFamilies) {
        // Note: memo() and forwardRef() we'll compare outer rather than inner type.
        // This means both of them need to be registered to preserve state.
        // If we unwrapped and compared the inner types for wrappers instead,
        // then we would risk falsely saying two separate memo(Foo)
        // calls are equivalent because they wrap the same Foo function.
        var prevFamily = resolveFamily(prevType);

        if (prevFamily !== undefined && prevFamily === resolveFamily(nextType)) {
          return true;
        }
      }

      return false;
    }
  }
  function markFailedErrorBoundaryForHotReloading(fiber) {
    {
      if (resolveFamily === null) {
        // Hot reloading is disabled.
        return;
      }

      if (typeof WeakSet !== 'function') {
        return;
      }

      if (failedBoundaries === null) {
        failedBoundaries = new WeakSet();
      }

      failedBoundaries.add(fiber);
    }
  }
  var scheduleRefresh = function (root, update) {
    {
      if (resolveFamily === null) {
        // Hot reloading is disabled.
        return;
      }

      var staleFamilies = update.staleFamilies,
          updatedFamilies = update.updatedFamilies;
      flushPassiveEffects();
      flushSync(function () {
        scheduleFibersWithFamiliesRecursively(root.current, updatedFamilies, staleFamilies);
      });
    }
  };
  var scheduleRoot = function (root, element) {
    {
      if (root.context !== emptyContextObject) {
        // Super edge case: root has a legacy _renderSubtree context
        // but we don't know the parentComponent so we can't pass it.
        // Just ignore. We'll delete this with _renderSubtree code path later.
        return;
      }

      flushPassiveEffects();
      syncUpdates(function () {
        updateContainer(element, root, null, null);
      });
    }
  };

  function scheduleFibersWithFamiliesRecursively(fiber, updatedFamilies, staleFamilies) {
    {
      var alternate = fiber.alternate,
          child = fiber.child,
          sibling = fiber.sibling,
          tag = fiber.tag,
          type = fiber.type;
      var candidateType = null;

      switch (tag) {
        case FunctionComponent:
        case SimpleMemoComponent:
        case ClassComponent:
          candidateType = type;
          break;

        case ForwardRef:
          candidateType = type.render;
          break;
      }

      if (resolveFamily === null) {
        throw new Error('Expected resolveFamily to be set during hot reload.');
      }

      var needsRender = false;
      var needsRemount = false;

      if (candidateType !== null) {
        var family = resolveFamily(candidateType);

        if (family !== undefined) {
          if (staleFamilies.has(family)) {
            needsRemount = true;
          } else if (updatedFamilies.has(family)) {
            if (tag === ClassComponent) {
              needsRemount = true;
            } else {
              needsRender = true;
            }
          }
        }
      }

      if (failedBoundaries !== null) {
        if (failedBoundaries.has(fiber) || alternate !== null && failedBoundaries.has(alternate)) {
          needsRemount = true;
        }
      }

      if (needsRemount) {
        fiber._debugNeedsRemount = true;
      }

      if (needsRemount || needsRender) {
        scheduleWork(fiber, Sync);
      }

      if (child !== null && !needsRemount) {
        scheduleFibersWithFamiliesRecursively(child, updatedFamilies, staleFamilies);
      }

      if (sibling !== null) {
        scheduleFibersWithFamiliesRecursively(sibling, updatedFamilies, staleFamilies);
      }
    }
  }

  var findHostInstancesForRefresh = function (root, families) {
    {
      var hostInstances = new Set();
      var types = new Set(families.map(function (family) {
        return family.current;
      }));
      findHostInstancesForMatchingFibersRecursively(root.current, types, hostInstances);
      return hostInstances;
    }
  };

  function findHostInstancesForMatchingFibersRecursively(fiber, types, hostInstances) {
    {
      var child = fiber.child,
          sibling = fiber.sibling,
          tag = fiber.tag,
          type = fiber.type;
      var candidateType = null;

      switch (tag) {
        case FunctionComponent:
        case SimpleMemoComponent:
        case ClassComponent:
          candidateType = type;
          break;

        case ForwardRef:
          candidateType = type.render;
          break;
      }

      var didMatch = false;

      if (candidateType !== null) {
        if (types.has(candidateType)) {
          didMatch = true;
        }
      }

      if (didMatch) {
        // We have a match. This only drills down to the closest host components.
        // There's no need to search deeper because for the purpose of giving
        // visual feedback, "flashing" outermost parent rectangles is sufficient.
        findHostInstancesForFiberShallowly(fiber, hostInstances);
      } else {
        // If there's no match, maybe there will be one further down in the child tree.
        if (child !== null) {
          findHostInstancesForMatchingFibersRecursively(child, types, hostInstances);
        }
      }

      if (sibling !== null) {
        findHostInstancesForMatchingFibersRecursively(sibling, types, hostInstances);
      }
    }
  }

  function findHostInstancesForFiberShallowly(fiber, hostInstances) {
    {
      var foundHostInstances = findChildHostInstancesForFiberShallowly(fiber, hostInstances);

      if (foundHostInstances) {
        return;
      } // If we didn't find any host children, fallback to closest host parent.


      var node = fiber;

      while (true) {
        switch (node.tag) {
          case HostComponent:
            hostInstances.add(node.stateNode);
            return;

          case HostPortal:
            hostInstances.add(node.stateNode.containerInfo);
            return;

          case HostRoot:
            hostInstances.add(node.stateNode.containerInfo);
            return;
        }

        if (node.return === null) {
          throw new Error('Expected to reach root first.');
        }

        node = node.return;
      }
    }
  }

  function findChildHostInstancesForFiberShallowly(fiber, hostInstances) {
    {
      var node = fiber;
      var foundHostInstances = false;

      while (true) {
        if (node.tag === HostComponent) {
          // We got a match.
          foundHostInstances = true;
          hostInstances.add(node.stateNode); // There may still be more, so keep searching.
        } else if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }

        if (node === fiber) {
          return foundHostInstances;
        }

        while (node.sibling === null) {
          if (node.return === null || node.return === fiber) {
            return foundHostInstances;
          }

          node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;
      }
    }

    return false;
  }

  function resolveDefaultProps(Component, baseProps) {
    if (Component && Component.defaultProps) {
      // Resolve default props. Taken from ReactElement
      var props = _assign({}, baseProps);

      var defaultProps = Component.defaultProps;

      for (var propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
        }
      }

      return props;
    }

    return baseProps;
  }
  function readLazyComponentType(lazyComponent) {
    initializeLazyComponentType(lazyComponent);

    if (lazyComponent._status !== Resolved) {
      throw lazyComponent._result;
    }

    return lazyComponent._result;
  }

  var valueCursor = createCursor(null);
  var rendererSigil;

  {
    // Use this to detect multiple renderers using the same context
    rendererSigil = {};
  }

  var currentlyRenderingFiber = null;
  var lastContextDependency = null;
  var lastContextWithAllBitsObserved = null;
  var isDisallowedContextReadInDEV = false;
  function resetContextDependencies() {
    // This is called right before React yields execution, to ensure `readContext`
    // cannot be called outside the render phase.
    currentlyRenderingFiber = null;
    lastContextDependency = null;
    lastContextWithAllBitsObserved = null;

    {
      isDisallowedContextReadInDEV = false;
    }
  }
  function enterDisallowedContextReadInDEV() {
    {
      isDisallowedContextReadInDEV = true;
    }
  }
  function exitDisallowedContextReadInDEV() {
    {
      isDisallowedContextReadInDEV = false;
    }
  }
  function pushProvider(providerFiber, nextValue) {
    var context = providerFiber.type._context;

    {
      push(valueCursor, context._currentValue, providerFiber);
      context._currentValue = nextValue;

      {
        if (context._currentRenderer !== undefined && context._currentRenderer !== null && context._currentRenderer !== rendererSigil) {
          error('Detected multiple renderers concurrently rendering the ' + 'same context provider. This is currently unsupported.');
        }

        context._currentRenderer = rendererSigil;
      }
    }
  }
  function popProvider(providerFiber) {
    var currentValue = valueCursor.current;
    pop(valueCursor, providerFiber);
    var context = providerFiber.type._context;

    {
      context._currentValue = currentValue;
    }
  }
  function calculateChangedBits(context, newValue, oldValue) {
    if (objectIs(oldValue, newValue)) {
      // No change
      return 0;
    } else {
      var changedBits = typeof context._calculateChangedBits === 'function' ? context._calculateChangedBits(oldValue, newValue) : MAX_SIGNED_31_BIT_INT;

      {
        if ((changedBits & MAX_SIGNED_31_BIT_INT) !== changedBits) {
          error('calculateChangedBits: Expected the return value to be a ' + '31-bit integer. Instead received: %s', changedBits);
        }
      }

      return changedBits | 0;
    }
  }
  function scheduleWorkOnParentPath(parent, renderExpirationTime) {
    // Update the child expiration time of all the ancestors, including
    // the alternates.
    var node = parent;

    while (node !== null) {
      var alternate = node.alternate;

      if (node.childExpirationTime < renderExpirationTime) {
        node.childExpirationTime = renderExpirationTime;

        if (alternate !== null && alternate.childExpirationTime < renderExpirationTime) {
          alternate.childExpirationTime = renderExpirationTime;
        }
      } else if (alternate !== null && alternate.childExpirationTime < renderExpirationTime) {
        alternate.childExpirationTime = renderExpirationTime;
      } else {
        // Neither alternate was updated, which means the rest of the
        // ancestor path already has sufficient priority.
        break;
      }

      node = node.return;
    }
  }
  function propagateContextChange(workInProgress, context, changedBits, renderExpirationTime) {
    var fiber = workInProgress.child;

    if (fiber !== null) {
      // Set the return pointer of the child to the work-in-progress fiber.
      fiber.return = workInProgress;
    }

    while (fiber !== null) {
      var nextFiber = void 0; // Visit this fiber.

      var list = fiber.dependencies;

      if (list !== null) {
        nextFiber = fiber.child;
        var dependency = list.firstContext;

        while (dependency !== null) {
          // Check if the context matches.
          if (dependency.context === context && (dependency.observedBits & changedBits) !== 0) {
            // Match! Schedule an update on this fiber.
            if (fiber.tag === ClassComponent) {
              // Schedule a force update on the work-in-progress.
              var update = createUpdate(renderExpirationTime, null);
              update.tag = ForceUpdate; // TODO: Because we don't have a work-in-progress, this will add the
              // update to the current fiber, too, which means it will persist even if
              // this render is thrown away. Since it's a race condition, not sure it's
              // worth fixing.

              enqueueUpdate(fiber, update);
            }

            if (fiber.expirationTime < renderExpirationTime) {
              fiber.expirationTime = renderExpirationTime;
            }

            var alternate = fiber.alternate;

            if (alternate !== null && alternate.expirationTime < renderExpirationTime) {
              alternate.expirationTime = renderExpirationTime;
            }

            scheduleWorkOnParentPath(fiber.return, renderExpirationTime); // Mark the expiration time on the list, too.

            if (list.expirationTime < renderExpirationTime) {
              list.expirationTime = renderExpirationTime;
            } // Since we already found a match, we can stop traversing the
            // dependency list.


            break;
          }

          dependency = dependency.next;
        }
      } else if (fiber.tag === ContextProvider) {
        // Don't scan deeper if this is a matching provider
        nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
      } else {
        // Traverse down.
        nextFiber = fiber.child;
      }

      if (nextFiber !== null) {
        // Set the return pointer of the child to the work-in-progress fiber.
        nextFiber.return = fiber;
      } else {
        // No child. Traverse to next sibling.
        nextFiber = fiber;

        while (nextFiber !== null) {
          if (nextFiber === workInProgress) {
            // We're back to the root of this subtree. Exit.
            nextFiber = null;
            break;
          }

          var sibling = nextFiber.sibling;

          if (sibling !== null) {
            // Set the return pointer of the sibling to the work-in-progress fiber.
            sibling.return = nextFiber.return;
            nextFiber = sibling;
            break;
          } // No more siblings. Traverse up.


          nextFiber = nextFiber.return;
        }
      }

      fiber = nextFiber;
    }
  }
  function prepareToReadContext(workInProgress, renderExpirationTime) {
    currentlyRenderingFiber = workInProgress;
    lastContextDependency = null;
    lastContextWithAllBitsObserved = null;
    var dependencies = workInProgress.dependencies;

    if (dependencies !== null) {
      var firstContext = dependencies.firstContext;

      if (firstContext !== null) {
        if (dependencies.expirationTime >= renderExpirationTime) {
          // Context list has a pending update. Mark that this fiber performed work.
          markWorkInProgressReceivedUpdate();
        } // Reset the work-in-progress list


        dependencies.firstContext = null;
      }
    }
  }
  function readContext(context, observedBits) {
    {
      // This warning would fire if you read context inside a Hook like useMemo.
      // Unlike the class check below, it's not enforced in production for perf.
      if (isDisallowedContextReadInDEV) {
        error('Context can only be read while React is rendering. ' + 'In classes, you can read it in the render method or getDerivedStateFromProps. ' + 'In function components, you can read it directly in the function body, but not ' + 'inside Hooks like useReducer() or useMemo().');
      }
    }

    if (lastContextWithAllBitsObserved === context) ; else if (observedBits === false || observedBits === 0) ; else {
      var resolvedObservedBits; // Avoid deopting on observable arguments or heterogeneous types.

      if (typeof observedBits !== 'number' || observedBits === MAX_SIGNED_31_BIT_INT) {
        // Observe all updates.
        lastContextWithAllBitsObserved = context;
        resolvedObservedBits = MAX_SIGNED_31_BIT_INT;
      } else {
        resolvedObservedBits = observedBits;
      }

      var contextItem = {
        context: context,
        observedBits: resolvedObservedBits,
        next: null
      };

      if (lastContextDependency === null) {
        if (!(currentlyRenderingFiber !== null)) {
          {
            throw Error( "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()." );
          }
        } // This is the first dependency for this component. Create a new list.


        lastContextDependency = contextItem;
        currentlyRenderingFiber.dependencies = {
          expirationTime: NoWork,
          firstContext: contextItem,
          responders: null
        };
      } else {
        // Append a new context item.
        lastContextDependency = lastContextDependency.next = contextItem;
      }
    }

    return  context._currentValue ;
  }

  var UpdateState = 0;
  var ReplaceState = 1;
  var ForceUpdate = 2;
  var CaptureUpdate = 3; // Global state that is reset at the beginning of calling `processUpdateQueue`.
  // It should only be read right after calling `processUpdateQueue`, via
  // `checkHasForceUpdateAfterProcessing`.

  var hasForceUpdate = false;
  var didWarnUpdateInsideUpdate;
  var currentlyProcessingQueue;

  {
    didWarnUpdateInsideUpdate = false;
    currentlyProcessingQueue = null;
  }

  function initializeUpdateQueue(fiber) {
    var queue = {
      baseState: fiber.memoizedState,
      baseQueue: null,
      shared: {
        pending: null
      },
      effects: null
    };
    fiber.updateQueue = queue;
  }
  function cloneUpdateQueue(current, workInProgress) {
    // Clone the update queue from current. Unless it's already a clone.
    var queue = workInProgress.updateQueue;
    var currentQueue = current.updateQueue;

    if (queue === currentQueue) {
      var clone = {
        baseState: currentQueue.baseState,
        baseQueue: currentQueue.baseQueue,
        shared: currentQueue.shared,
        effects: currentQueue.effects
      };
      workInProgress.updateQueue = clone;
    }
  }
  function createUpdate(expirationTime, suspenseConfig) {
    var update = {
      expirationTime: expirationTime,
      suspenseConfig: suspenseConfig,
      tag: UpdateState,
      payload: null,
      callback: null,
      next: null
    };
    update.next = update;

    {
      update.priority = getCurrentPriorityLevel();
    }

    return update;
  }
  function enqueueUpdate(fiber, update) {
    var updateQueue = fiber.updateQueue;

    if (updateQueue === null) {
      // Only occurs if the fiber has been unmounted.
      return;
    }

    var sharedQueue = updateQueue.shared;
    var pending = sharedQueue.pending;

    if (pending === null) {
      // This is the first update. Create a circular list.
      update.next = update;
    } else {
      update.next = pending.next;
      pending.next = update;
    }

    sharedQueue.pending = update;

    {
      if (currentlyProcessingQueue === sharedQueue && !didWarnUpdateInsideUpdate) {
        error('An update (setState, replaceState, or forceUpdate) was scheduled ' + 'from inside an update function. Update functions should be pure, ' + 'with zero side-effects. Consider using componentDidUpdate or a ' + 'callback.');

        didWarnUpdateInsideUpdate = true;
      }
    }
  }
  function enqueueCapturedUpdate(workInProgress, update) {
    var current = workInProgress.alternate;

    if (current !== null) {
      // Ensure the work-in-progress queue is a clone
      cloneUpdateQueue(current, workInProgress);
    } // Captured updates go only on the work-in-progress queue.


    var queue = workInProgress.updateQueue; // Append the update to the end of the list.

    var last = queue.baseQueue;

    if (last === null) {
      queue.baseQueue = update.next = update;
      update.next = update;
    } else {
      update.next = last.next;
      last.next = update;
    }
  }

  function getStateFromUpdate(workInProgress, queue, update, prevState, nextProps, instance) {
    switch (update.tag) {
      case ReplaceState:
        {
          var payload = update.payload;

          if (typeof payload === 'function') {
            // Updater function
            {
              enterDisallowedContextReadInDEV();

              if ( workInProgress.mode & StrictMode) {
                payload.call(instance, prevState, nextProps);
              }
            }

            var nextState = payload.call(instance, prevState, nextProps);

            {
              exitDisallowedContextReadInDEV();
            }

            return nextState;
          } // State object


          return payload;
        }

      case CaptureUpdate:
        {
          workInProgress.effectTag = workInProgress.effectTag & ~ShouldCapture | DidCapture;
        }
      // Intentional fallthrough

      case UpdateState:
        {
          var _payload = update.payload;
          var partialState;

          if (typeof _payload === 'function') {
            // Updater function
            {
              enterDisallowedContextReadInDEV();

              if ( workInProgress.mode & StrictMode) {
                _payload.call(instance, prevState, nextProps);
              }
            }

            partialState = _payload.call(instance, prevState, nextProps);

            {
              exitDisallowedContextReadInDEV();
            }
          } else {
            // Partial state object
            partialState = _payload;
          }

          if (partialState === null || partialState === undefined) {
            // Null and undefined are treated as no-ops.
            return prevState;
          } // Merge the partial state and the previous state.


          return _assign({}, prevState, partialState);
        }

      case ForceUpdate:
        {
          hasForceUpdate = true;
          return prevState;
        }
    }

    return prevState;
  }

  function processUpdateQueue(workInProgress, props, instance, renderExpirationTime) {
    // This is always non-null on a ClassComponent or HostRoot
    var queue = workInProgress.updateQueue;
    hasForceUpdate = false;

    {
      currentlyProcessingQueue = queue.shared;
    } // The last rebase update that is NOT part of the base state.


    var baseQueue = queue.baseQueue; // The last pending update that hasn't been processed yet.

    var pendingQueue = queue.shared.pending;

    if (pendingQueue !== null) {
      // We have new updates that haven't been processed yet.
      // We'll add them to the base queue.
      if (baseQueue !== null) {
        // Merge the pending queue and the base queue.
        var baseFirst = baseQueue.next;
        var pendingFirst = pendingQueue.next;
        baseQueue.next = pendingFirst;
        pendingQueue.next = baseFirst;
      }

      baseQueue = pendingQueue;
      queue.shared.pending = null; // TODO: Pass `current` as argument

      var current = workInProgress.alternate;

      if (current !== null) {
        var currentQueue = current.updateQueue;

        if (currentQueue !== null) {
          currentQueue.baseQueue = pendingQueue;
        }
      }
    } // These values may change as we process the queue.


    if (baseQueue !== null) {
      var first = baseQueue.next; // Iterate through the list of updates to compute the result.

      var newState = queue.baseState;
      var newExpirationTime = NoWork;
      var newBaseState = null;
      var newBaseQueueFirst = null;
      var newBaseQueueLast = null;

      if (first !== null) {
        var update = first;

        do {
          var updateExpirationTime = update.expirationTime;

          if (updateExpirationTime < renderExpirationTime) {
            // Priority is insufficient. Skip this update. If this is the first
            // skipped update, the previous update/state is the new base
            // update/state.
            var clone = {
              expirationTime: update.expirationTime,
              suspenseConfig: update.suspenseConfig,
              tag: update.tag,
              payload: update.payload,
              callback: update.callback,
              next: null
            };

            if (newBaseQueueLast === null) {
              newBaseQueueFirst = newBaseQueueLast = clone;
              newBaseState = newState;
            } else {
              newBaseQueueLast = newBaseQueueLast.next = clone;
            } // Update the remaining priority in the queue.


            if (updateExpirationTime > newExpirationTime) {
              newExpirationTime = updateExpirationTime;
            }
          } else {
            // This update does have sufficient priority.
            if (newBaseQueueLast !== null) {
              var _clone = {
                expirationTime: Sync,
                // This update is going to be committed so we never want uncommit it.
                suspenseConfig: update.suspenseConfig,
                tag: update.tag,
                payload: update.payload,
                callback: update.callback,
                next: null
              };
              newBaseQueueLast = newBaseQueueLast.next = _clone;
            } // Mark the event time of this update as relevant to this render pass.
            // TODO: This should ideally use the true event time of this update rather than
            // its priority which is a derived and not reverseable value.
            // TODO: We should skip this update if it was already committed but currently
            // we have no way of detecting the difference between a committed and suspended
            // update here.


            markRenderEventTimeAndConfig(updateExpirationTime, update.suspenseConfig); // Process this update.

            newState = getStateFromUpdate(workInProgress, queue, update, newState, props, instance);
            var callback = update.callback;

            if (callback !== null) {
              workInProgress.effectTag |= Callback;
              var effects = queue.effects;

              if (effects === null) {
                queue.effects = [update];
              } else {
                effects.push(update);
              }
            }
          }

          update = update.next;

          if (update === null || update === first) {
            pendingQueue = queue.shared.pending;

            if (pendingQueue === null) {
              break;
            } else {
              // An update was scheduled from inside a reducer. Add the new
              // pending updates to the end of the list and keep processing.
              update = baseQueue.next = pendingQueue.next;
              pendingQueue.next = first;
              queue.baseQueue = baseQueue = pendingQueue;
              queue.shared.pending = null;
            }
          }
        } while (true);
      }

      if (newBaseQueueLast === null) {
        newBaseState = newState;
      } else {
        newBaseQueueLast.next = newBaseQueueFirst;
      }

      queue.baseState = newBaseState;
      queue.baseQueue = newBaseQueueLast; // Set the remaining expiration time to be whatever is remaining in the queue.
      // This should be fine because the only two other things that contribute to
      // expiration time are props and context. We're already in the middle of the
      // begin phase by the time we start processing the queue, so we've already
      // dealt with the props. Context in components that specify
      // shouldComponentUpdate is tricky; but we'll have to account for
      // that regardless.

      markUnprocessedUpdateTime(newExpirationTime);
      workInProgress.expirationTime = newExpirationTime;
      workInProgress.memoizedState = newState;
    }

    {
      currentlyProcessingQueue = null;
    }
  }

  function callCallback(callback, context) {
    if (!(typeof callback === 'function')) {
      {
        throw Error( "Invalid argument passed as callback. Expected a function. Instead received: " + callback );
      }
    }

    callback.call(context);
  }

  function resetHasForceUpdateBeforeProcessing() {
    hasForceUpdate = false;
  }
  function checkHasForceUpdateAfterProcessing() {
    return hasForceUpdate;
  }
  function commitUpdateQueue(finishedWork, finishedQueue, instance) {
    // Commit the effects
    var effects = finishedQueue.effects;
    finishedQueue.effects = null;

    if (effects !== null) {
      for (var i = 0; i < effects.length; i++) {
        var effect = effects[i];
        var callback = effect.callback;

        if (callback !== null) {
          effect.callback = null;
          callCallback(callback, instance);
        }
      }
    }
  }

  var ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig;
  function requestCurrentSuspenseConfig() {
    return ReactCurrentBatchConfig.suspense;
  }

  var fakeInternalInstance = {};
  var isArray = Array.isArray; // React.Component uses a shared frozen object by default.
  // We'll use it to determine whether we need to initialize legacy refs.

  var emptyRefsObject = new React.Component().refs;
  var didWarnAboutStateAssignmentForComponent;
  var didWarnAboutUninitializedState;
  var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate;
  var didWarnAboutLegacyLifecyclesAndDerivedState;
  var didWarnAboutUndefinedDerivedState;
  var warnOnUndefinedDerivedState;
  var warnOnInvalidCallback;
  var didWarnAboutDirectlyAssigningPropsToState;
  var didWarnAboutContextTypeAndContextTypes;
  var didWarnAboutInvalidateContextType;

  {
    didWarnAboutStateAssignmentForComponent = new Set();
    didWarnAboutUninitializedState = new Set();
    didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
    didWarnAboutLegacyLifecyclesAndDerivedState = new Set();
    didWarnAboutDirectlyAssigningPropsToState = new Set();
    didWarnAboutUndefinedDerivedState = new Set();
    didWarnAboutContextTypeAndContextTypes = new Set();
    didWarnAboutInvalidateContextType = new Set();
    var didWarnOnInvalidCallback = new Set();

    warnOnInvalidCallback = function (callback, callerName) {
      if (callback === null || typeof callback === 'function') {
        return;
      }

      var key = callerName + "_" + callback;

      if (!didWarnOnInvalidCallback.has(key)) {
        didWarnOnInvalidCallback.add(key);

        error('%s(...): Expected the last optional `callback` argument to be a ' + 'function. Instead received: %s.', callerName, callback);
      }
    };

    warnOnUndefinedDerivedState = function (type, partialState) {
      if (partialState === undefined) {
        var componentName = getComponentName(type) || 'Component';

        if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
          didWarnAboutUndefinedDerivedState.add(componentName);

          error('%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. ' + 'You have returned undefined.', componentName);
        }
      }
    }; // This is so gross but it's at least non-critical and can be removed if
    // it causes problems. This is meant to give a nicer error message for
    // ReactDOM15.unstable_renderSubtreeIntoContainer(reactDOM16Component,
    // ...)) which otherwise throws a "_processChildContext is not a function"
    // exception.


    Object.defineProperty(fakeInternalInstance, '_processChildContext', {
      enumerable: false,
      value: function () {
        {
          {
            throw Error( "_processChildContext is not available in React 16+. This likely means you have multiple copies of React and are attempting to nest a React 15 tree inside a React 16 tree using unstable_renderSubtreeIntoContainer, which isn't supported. Try to make sure you have only one copy of React (and ideally, switch to ReactDOM.createPortal)." );
          }
        }
      }
    });
    Object.freeze(fakeInternalInstance);
  }

  function applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, nextProps) {
    var prevState = workInProgress.memoizedState;

    {
      if ( workInProgress.mode & StrictMode) {
        // Invoke the function an extra time to help detect side-effects.
        getDerivedStateFromProps(nextProps, prevState);
      }
    }

    var partialState = getDerivedStateFromProps(nextProps, prevState);

    {
      warnOnUndefinedDerivedState(ctor, partialState);
    } // Merge the partial state and the previous state.


    var memoizedState = partialState === null || partialState === undefined ? prevState : _assign({}, prevState, partialState);
    workInProgress.memoizedState = memoizedState; // Once the update queue is empty, persist the derived state onto the
    // base state.

    if (workInProgress.expirationTime === NoWork) {
      // Queue is always non-null for classes
      var updateQueue = workInProgress.updateQueue;
      updateQueue.baseState = memoizedState;
    }
  }
  var classComponentUpdater = {
    isMounted: isMounted,
    enqueueSetState: function (inst, payload, callback) {
      var fiber = get(inst);
      var currentTime = requestCurrentTimeForUpdate();
      var suspenseConfig = requestCurrentSuspenseConfig();
      var expirationTime = computeExpirationForFiber(currentTime, fiber, suspenseConfig);
      var update = createUpdate(expirationTime, suspenseConfig);
      update.payload = payload;

      if (callback !== undefined && callback !== null) {
        {
          warnOnInvalidCallback(callback, 'setState');
        }

        update.callback = callback;
      }

      enqueueUpdate(fiber, update);
      scheduleWork(fiber, expirationTime);
    },
    enqueueReplaceState: function (inst, payload, callback) {
      var fiber = get(inst);
      var currentTime = requestCurrentTimeForUpdate();
      var suspenseConfig = requestCurrentSuspenseConfig();
      var expirationTime = computeExpirationForFiber(currentTime, fiber, suspenseConfig);
      var update = createUpdate(expirationTime, suspenseConfig);
      update.tag = ReplaceState;
      update.payload = payload;

      if (callback !== undefined && callback !== null) {
        {
          warnOnInvalidCallback(callback, 'replaceState');
        }

        update.callback = callback;
      }

      enqueueUpdate(fiber, update);
      scheduleWork(fiber, expirationTime);
    },
    enqueueForceUpdate: function (inst, callback) {
      var fiber = get(inst);
      var currentTime = requestCurrentTimeForUpdate();
      var suspenseConfig = requestCurrentSuspenseConfig();
      var expirationTime = computeExpirationForFiber(currentTime, fiber, suspenseConfig);
      var update = createUpdate(expirationTime, suspenseConfig);
      update.tag = ForceUpdate;

      if (callback !== undefined && callback !== null) {
        {
          warnOnInvalidCallback(callback, 'forceUpdate');
        }

        update.callback = callback;
      }

      enqueueUpdate(fiber, update);
      scheduleWork(fiber, expirationTime);
    }
  };

  function checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext) {
    var instance = workInProgress.stateNode;

    if (typeof instance.shouldComponentUpdate === 'function') {
      {
        if ( workInProgress.mode & StrictMode) {
          // Invoke the function an extra time to help detect side-effects.
          instance.shouldComponentUpdate(newProps, newState, nextContext);
        }
      }

      startPhaseTimer(workInProgress, 'shouldComponentUpdate');
      var shouldUpdate = instance.shouldComponentUpdate(newProps, newState, nextContext);
      stopPhaseTimer();

      {
        if (shouldUpdate === undefined) {
          error('%s.shouldComponentUpdate(): Returned undefined instead of a ' + 'boolean value. Make sure to return true or false.', getComponentName(ctor) || 'Component');
        }
      }

      return shouldUpdate;
    }

    if (ctor.prototype && ctor.prototype.isPureReactComponent) {
      return !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState);
    }

    return true;
  }

  function checkClassInstance(workInProgress, ctor, newProps) {
    var instance = workInProgress.stateNode;

    {
      var name = getComponentName(ctor) || 'Component';
      var renderPresent = instance.render;

      if (!renderPresent) {
        if (ctor.prototype && typeof ctor.prototype.render === 'function') {
          error('%s(...): No `render` method found on the returned component ' + 'instance: did you accidentally return an object from the constructor?', name);
        } else {
          error('%s(...): No `render` method found on the returned component ' + 'instance: you may have forgotten to define `render`.', name);
        }
      }

      if (instance.getInitialState && !instance.getInitialState.isReactClassApproved && !instance.state) {
        error('getInitialState was defined on %s, a plain JavaScript class. ' + 'This is only supported for classes created using React.createClass. ' + 'Did you mean to define a state property instead?', name);
      }

      if (instance.getDefaultProps && !instance.getDefaultProps.isReactClassApproved) {
        error('getDefaultProps was defined on %s, a plain JavaScript class. ' + 'This is only supported for classes created using React.createClass. ' + 'Use a static property to define defaultProps instead.', name);
      }

      if (instance.propTypes) {
        error('propTypes was defined as an instance property on %s. Use a static ' + 'property to define propTypes instead.', name);
      }

      if (instance.contextType) {
        error('contextType was defined as an instance property on %s. Use a static ' + 'property to define contextType instead.', name);
      }

      {
        if (instance.contextTypes) {
          error('contextTypes was defined as an instance property on %s. Use a static ' + 'property to define contextTypes instead.', name);
        }

        if (ctor.contextType && ctor.contextTypes && !didWarnAboutContextTypeAndContextTypes.has(ctor)) {
          didWarnAboutContextTypeAndContextTypes.add(ctor);

          error('%s declares both contextTypes and contextType static properties. ' + 'The legacy contextTypes property will be ignored.', name);
        }
      }

      if (typeof instance.componentShouldUpdate === 'function') {
        error('%s has a method called ' + 'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' + 'The name is phrased as a question because the function is ' + 'expected to return a value.', name);
      }

      if (ctor.prototype && ctor.prototype.isPureReactComponent && typeof instance.shouldComponentUpdate !== 'undefined') {
        error('%s has a method called shouldComponentUpdate(). ' + 'shouldComponentUpdate should not be used when extending React.PureComponent. ' + 'Please extend React.Component if shouldComponentUpdate is used.', getComponentName(ctor) || 'A pure component');
      }

      if (typeof instance.componentDidUnmount === 'function') {
        error('%s has a method called ' + 'componentDidUnmount(). But there is no such lifecycle method. ' + 'Did you mean componentWillUnmount()?', name);
      }

      if (typeof instance.componentDidReceiveProps === 'function') {
        error('%s has a method called ' + 'componentDidReceiveProps(). But there is no such lifecycle method. ' + 'If you meant to update the state in response to changing props, ' + 'use componentWillReceiveProps(). If you meant to fetch data or ' + 'run side-effects or mutations after React has updated the UI, use componentDidUpdate().', name);
      }

      if (typeof instance.componentWillRecieveProps === 'function') {
        error('%s has a method called ' + 'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?', name);
      }

      if (typeof instance.UNSAFE_componentWillRecieveProps === 'function') {
        error('%s has a method called ' + 'UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?', name);
      }

      var hasMutatedProps = instance.props !== newProps;

      if (instance.props !== undefined && hasMutatedProps) {
        error('%s(...): When calling super() in `%s`, make sure to pass ' + "up the same props that your component's constructor was passed.", name, name);
      }

      if (instance.defaultProps) {
        error('Setting defaultProps as an instance property on %s is not supported and will be ignored.' + ' Instead, define defaultProps as a static property on %s.', name, name);
      }

      if (typeof instance.getSnapshotBeforeUpdate === 'function' && typeof instance.componentDidUpdate !== 'function' && !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor)) {
        didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor);

        error('%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). ' + 'This component defines getSnapshotBeforeUpdate() only.', getComponentName(ctor));
      }

      if (typeof instance.getDerivedStateFromProps === 'function') {
        error('%s: getDerivedStateFromProps() is defined as an instance method ' + 'and will be ignored. Instead, declare it as a static method.', name);
      }

      if (typeof instance.getDerivedStateFromError === 'function') {
        error('%s: getDerivedStateFromError() is defined as an instance method ' + 'and will be ignored. Instead, declare it as a static method.', name);
      }

      if (typeof ctor.getSnapshotBeforeUpdate === 'function') {
        error('%s: getSnapshotBeforeUpdate() is defined as a static method ' + 'and will be ignored. Instead, declare it as an instance method.', name);
      }

      var _state = instance.state;

      if (_state && (typeof _state !== 'object' || isArray(_state))) {
        error('%s.state: must be set to an object or null', name);
      }

      if (typeof instance.getChildContext === 'function' && typeof ctor.childContextTypes !== 'object') {
        error('%s.getChildContext(): childContextTypes must be defined in order to ' + 'use getChildContext().', name);
      }
    }
  }

  function adoptClassInstance(workInProgress, instance) {
    instance.updater = classComponentUpdater;
    workInProgress.stateNode = instance; // The instance needs access to the fiber so that it can schedule updates

    set(instance, workInProgress);

    {
      instance._reactInternalInstance = fakeInternalInstance;
    }
  }

  function constructClassInstance(workInProgress, ctor, props) {
    var isLegacyContextConsumer = false;
    var unmaskedContext = emptyContextObject;
    var context = emptyContextObject;
    var contextType = ctor.contextType;

    {
      if ('contextType' in ctor) {
        var isValid = // Allow null for conditional declaration
        contextType === null || contextType !== undefined && contextType.$$typeof === REACT_CONTEXT_TYPE && contextType._context === undefined; // Not a <Context.Consumer>

        if (!isValid && !didWarnAboutInvalidateContextType.has(ctor)) {
          didWarnAboutInvalidateContextType.add(ctor);
          var addendum = '';

          if (contextType === undefined) {
            addendum = ' However, it is set to undefined. ' + 'This can be caused by a typo or by mixing up named and default imports. ' + 'This can also happen due to a circular dependency, so ' + 'try moving the createContext() call to a separate file.';
          } else if (typeof contextType !== 'object') {
            addendum = ' However, it is set to a ' + typeof contextType + '.';
          } else if (contextType.$$typeof === REACT_PROVIDER_TYPE) {
            addendum = ' Did you accidentally pass the Context.Provider instead?';
          } else if (contextType._context !== undefined) {
            // <Context.Consumer>
            addendum = ' Did you accidentally pass the Context.Consumer instead?';
          } else {
            addendum = ' However, it is set to an object with keys {' + Object.keys(contextType).join(', ') + '}.';
          }

          error('%s defines an invalid contextType. ' + 'contextType should point to the Context object returned by React.createContext().%s', getComponentName(ctor) || 'Component', addendum);
        }
      }
    }

    if (typeof contextType === 'object' && contextType !== null) {
      context = readContext(contextType);
    } else {
      unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
      var contextTypes = ctor.contextTypes;
      isLegacyContextConsumer = contextTypes !== null && contextTypes !== undefined;
      context = isLegacyContextConsumer ? getMaskedContext(workInProgress, unmaskedContext) : emptyContextObject;
    } // Instantiate twice to help detect side-effects.


    {
      if ( workInProgress.mode & StrictMode) {
        new ctor(props, context); // eslint-disable-line no-new
      }
    }

    var instance = new ctor(props, context);
    var state = workInProgress.memoizedState = instance.state !== null && instance.state !== undefined ? instance.state : null;
    adoptClassInstance(workInProgress, instance);

    {
      if (typeof ctor.getDerivedStateFromProps === 'function' && state === null) {
        var componentName = getComponentName(ctor) || 'Component';

        if (!didWarnAboutUninitializedState.has(componentName)) {
          didWarnAboutUninitializedState.add(componentName);

          error('`%s` uses `getDerivedStateFromProps` but its initial state is ' + '%s. This is not recommended. Instead, define the initial state by ' + 'assigning an object to `this.state` in the constructor of `%s`. ' + 'This ensures that `getDerivedStateFromProps` arguments have a consistent shape.', componentName, instance.state === null ? 'null' : 'undefined', componentName);
        }
      } // If new component APIs are defined, "unsafe" lifecycles won't be called.
      // Warn about these lifecycles if they are present.
      // Don't warn about react-lifecycles-compat polyfilled methods though.


      if (typeof ctor.getDerivedStateFromProps === 'function' || typeof instance.getSnapshotBeforeUpdate === 'function') {
        var foundWillMountName = null;
        var foundWillReceivePropsName = null;
        var foundWillUpdateName = null;

        if (typeof instance.componentWillMount === 'function' && instance.componentWillMount.__suppressDeprecationWarning !== true) {
          foundWillMountName = 'componentWillMount';
        } else if (typeof instance.UNSAFE_componentWillMount === 'function') {
          foundWillMountName = 'UNSAFE_componentWillMount';
        }

        if (typeof instance.componentWillReceiveProps === 'function' && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
          foundWillReceivePropsName = 'componentWillReceiveProps';
        } else if (typeof instance.UNSAFE_componentWillReceiveProps === 'function') {
          foundWillReceivePropsName = 'UNSAFE_componentWillReceiveProps';
        }

        if (typeof instance.componentWillUpdate === 'function' && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
          foundWillUpdateName = 'componentWillUpdate';
        } else if (typeof instance.UNSAFE_componentWillUpdate === 'function') {
          foundWillUpdateName = 'UNSAFE_componentWillUpdate';
        }

        if (foundWillMountName !== null || foundWillReceivePropsName !== null || foundWillUpdateName !== null) {
          var _componentName = getComponentName(ctor) || 'Component';

          var newApiName = typeof ctor.getDerivedStateFromProps === 'function' ? 'getDerivedStateFromProps()' : 'getSnapshotBeforeUpdate()';

          if (!didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)) {
            didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);

            error('Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' + '%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n' + 'The above lifecycles should be removed. Learn more about this warning here:\n' + 'https://fb.me/react-unsafe-component-lifecycles', _componentName, newApiName, foundWillMountName !== null ? "\n  " + foundWillMountName : '', foundWillReceivePropsName !== null ? "\n  " + foundWillReceivePropsName : '', foundWillUpdateName !== null ? "\n  " + foundWillUpdateName : '');
          }
        }
      }
    } // Cache unmasked context so we can avoid recreating masked context unless necessary.
    // ReactFiberContext usually updates this cache but can't for newly-created instances.


    if (isLegacyContextConsumer) {
      cacheContext(workInProgress, unmaskedContext, context);
    }

    return instance;
  }

  function callComponentWillMount(workInProgress, instance) {
    startPhaseTimer(workInProgress, 'componentWillMount');
    var oldState = instance.state;

    if (typeof instance.componentWillMount === 'function') {
      instance.componentWillMount();
    }

    if (typeof instance.UNSAFE_componentWillMount === 'function') {
      instance.UNSAFE_componentWillMount();
    }

    stopPhaseTimer();

    if (oldState !== instance.state) {
      {
        error('%s.componentWillMount(): Assigning directly to this.state is ' + "deprecated (except inside a component's " + 'constructor). Use setState instead.', getComponentName(workInProgress.type) || 'Component');
      }

      classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
    }
  }

  function callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext) {
    var oldState = instance.state;
    startPhaseTimer(workInProgress, 'componentWillReceiveProps');

    if (typeof instance.componentWillReceiveProps === 'function') {
      instance.componentWillReceiveProps(newProps, nextContext);
    }

    if (typeof instance.UNSAFE_componentWillReceiveProps === 'function') {
      instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
    }

    stopPhaseTimer();

    if (instance.state !== oldState) {
      {
        var componentName = getComponentName(workInProgress.type) || 'Component';

        if (!didWarnAboutStateAssignmentForComponent.has(componentName)) {
          didWarnAboutStateAssignmentForComponent.add(componentName);

          error('%s.componentWillReceiveProps(): Assigning directly to ' + "this.state is deprecated (except inside a component's " + 'constructor). Use setState instead.', componentName);
        }
      }

      classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
    }
  } // Invokes the mount life-cycles on a previously never rendered instance.


  function mountClassInstance(workInProgress, ctor, newProps, renderExpirationTime) {
    {
      checkClassInstance(workInProgress, ctor, newProps);
    }

    var instance = workInProgress.stateNode;
    instance.props = newProps;
    instance.state = workInProgress.memoizedState;
    instance.refs = emptyRefsObject;
    initializeUpdateQueue(workInProgress);
    var contextType = ctor.contextType;

    if (typeof contextType === 'object' && contextType !== null) {
      instance.context = readContext(contextType);
    } else {
      var unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
      instance.context = getMaskedContext(workInProgress, unmaskedContext);
    }

    {
      if (instance.state === newProps) {
        var componentName = getComponentName(ctor) || 'Component';

        if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
          didWarnAboutDirectlyAssigningPropsToState.add(componentName);

          error('%s: It is not recommended to assign props directly to state ' + "because updates to props won't be reflected in state. " + 'In most cases, it is better to use props directly.', componentName);
        }
      }

      if (workInProgress.mode & StrictMode) {
        ReactStrictModeWarnings.recordLegacyContextWarning(workInProgress, instance);
      }

      {
        ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(workInProgress, instance);
      }
    }

    processUpdateQueue(workInProgress, newProps, instance, renderExpirationTime);
    instance.state = workInProgress.memoizedState;
    var getDerivedStateFromProps = ctor.getDerivedStateFromProps;

    if (typeof getDerivedStateFromProps === 'function') {
      applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
      instance.state = workInProgress.memoizedState;
    } // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.


    if (typeof ctor.getDerivedStateFromProps !== 'function' && typeof instance.getSnapshotBeforeUpdate !== 'function' && (typeof instance.UNSAFE_componentWillMount === 'function' || typeof instance.componentWillMount === 'function')) {
      callComponentWillMount(workInProgress, instance); // If we had additional state updates during this life-cycle, let's
      // process them now.

      processUpdateQueue(workInProgress, newProps, instance, renderExpirationTime);
      instance.state = workInProgress.memoizedState;
    }

    if (typeof instance.componentDidMount === 'function') {
      workInProgress.effectTag |= Update;
    }
  }

  function resumeMountClassInstance(workInProgress, ctor, newProps, renderExpirationTime) {
    var instance = workInProgress.stateNode;
    var oldProps = workInProgress.memoizedProps;
    instance.props = oldProps;
    var oldContext = instance.context;
    var contextType = ctor.contextType;
    var nextContext = emptyContextObject;

    if (typeof contextType === 'object' && contextType !== null) {
      nextContext = readContext(contextType);
    } else {
      var nextLegacyUnmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
      nextContext = getMaskedContext(workInProgress, nextLegacyUnmaskedContext);
    }

    var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
    var hasNewLifecycles = typeof getDerivedStateFromProps === 'function' || typeof instance.getSnapshotBeforeUpdate === 'function'; // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.

    if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === 'function' || typeof instance.componentWillReceiveProps === 'function')) {
      if (oldProps !== newProps || oldContext !== nextContext) {
        callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext);
      }
    }

    resetHasForceUpdateBeforeProcessing();
    var oldState = workInProgress.memoizedState;
    var newState = instance.state = oldState;
    processUpdateQueue(workInProgress, newProps, instance, renderExpirationTime);
    newState = workInProgress.memoizedState;

    if (oldProps === newProps && oldState === newState && !hasContextChanged() && !checkHasForceUpdateAfterProcessing()) {
      // If an update was already in progress, we should schedule an Update
      // effect even though we're bailing out, so that cWU/cDU are called.
      if (typeof instance.componentDidMount === 'function') {
        workInProgress.effectTag |= Update;
      }

      return false;
    }

    if (typeof getDerivedStateFromProps === 'function') {
      applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
      newState = workInProgress.memoizedState;
    }

    var shouldUpdate = checkHasForceUpdateAfterProcessing() || checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext);

    if (shouldUpdate) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillMount === 'function' || typeof instance.componentWillMount === 'function')) {
        startPhaseTimer(workInProgress, 'componentWillMount');

        if (typeof instance.componentWillMount === 'function') {
          instance.componentWillMount();
        }

        if (typeof instance.UNSAFE_componentWillMount === 'function') {
          instance.UNSAFE_componentWillMount();
        }

        stopPhaseTimer();
      }

      if (typeof instance.componentDidMount === 'function') {
        workInProgress.effectTag |= Update;
      }
    } else {
      // If an update was already in progress, we should schedule an Update
      // effect even though we're bailing out, so that cWU/cDU are called.
      if (typeof instance.componentDidMount === 'function') {
        workInProgress.effectTag |= Update;
      } // If shouldComponentUpdate returned false, we should still update the
      // memoized state to indicate that this work can be reused.


      workInProgress.memoizedProps = newProps;
      workInProgress.memoizedState = newState;
    } // Update the existing instance's state, props, and context pointers even
    // if shouldComponentUpdate returns false.


    instance.props = newProps;
    instance.state = newState;
    instance.context = nextContext;
    return shouldUpdate;
  } // Invokes the update life-cycles and returns false if it shouldn't rerender.


  function updateClassInstance(current, workInProgress, ctor, newProps, renderExpirationTime) {
    var instance = workInProgress.stateNode;
    cloneUpdateQueue(current, workInProgress);
    var oldProps = workInProgress.memoizedProps;
    instance.props = workInProgress.type === workInProgress.elementType ? oldProps : resolveDefaultProps(workInProgress.type, oldProps);
    var oldContext = instance.context;
    var contextType = ctor.contextType;
    var nextContext = emptyContextObject;

    if (typeof contextType === 'object' && contextType !== null) {
      nextContext = readContext(contextType);
    } else {
      var nextUnmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
      nextContext = getMaskedContext(workInProgress, nextUnmaskedContext);
    }

    var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
    var hasNewLifecycles = typeof getDerivedStateFromProps === 'function' || typeof instance.getSnapshotBeforeUpdate === 'function'; // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.

    if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === 'function' || typeof instance.componentWillReceiveProps === 'function')) {
      if (oldProps !== newProps || oldContext !== nextContext) {
        callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext);
      }
    }

    resetHasForceUpdateBeforeProcessing();
    var oldState = workInProgress.memoizedState;
    var newState = instance.state = oldState;
    processUpdateQueue(workInProgress, newProps, instance, renderExpirationTime);
    newState = workInProgress.memoizedState;

    if (oldProps === newProps && oldState === newState && !hasContextChanged() && !checkHasForceUpdateAfterProcessing()) {
      // If an update was already in progress, we should schedule an Update
      // effect even though we're bailing out, so that cWU/cDU are called.
      if (typeof instance.componentDidUpdate === 'function') {
        if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
          workInProgress.effectTag |= Update;
        }
      }

      if (typeof instance.getSnapshotBeforeUpdate === 'function') {
        if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
          workInProgress.effectTag |= Snapshot;
        }
      }

      return false;
    }

    if (typeof getDerivedStateFromProps === 'function') {
      applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
      newState = workInProgress.memoizedState;
    }

    var shouldUpdate = checkHasForceUpdateAfterProcessing() || checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext);

    if (shouldUpdate) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillUpdate === 'function' || typeof instance.componentWillUpdate === 'function')) {
        startPhaseTimer(workInProgress, 'componentWillUpdate');

        if (typeof instance.componentWillUpdate === 'function') {
          instance.componentWillUpdate(newProps, newState, nextContext);
        }

        if (typeof instance.UNSAFE_componentWillUpdate === 'function') {
          instance.UNSAFE_componentWillUpdate(newProps, newState, nextContext);
        }

        stopPhaseTimer();
      }

      if (typeof instance.componentDidUpdate === 'function') {
        workInProgress.effectTag |= Update;
      }

      if (typeof instance.getSnapshotBeforeUpdate === 'function') {
        workInProgress.effectTag |= Snapshot;
      }
    } else {
      // If an update was already in progress, we should schedule an Update
      // effect even though we're bailing out, so that cWU/cDU are called.
      if (typeof instance.componentDidUpdate === 'function') {
        if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
          workInProgress.effectTag |= Update;
        }
      }

      if (typeof instance.getSnapshotBeforeUpdate === 'function') {
        if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
          workInProgress.effectTag |= Snapshot;
        }
      } // If shouldComponentUpdate returned false, we should still update the
      // memoized props/state to indicate that this work can be reused.


      workInProgress.memoizedProps = newProps;
      workInProgress.memoizedState = newState;
    } // Update the existing instance's state, props, and context pointers even
    // if shouldComponentUpdate returns false.


    instance.props = newProps;
    instance.state = newState;
    instance.context = nextContext;
    return shouldUpdate;
  }

  var didWarnAboutMaps;
  var didWarnAboutGenerators;
  var didWarnAboutStringRefs;
  var ownerHasKeyUseWarning;
  var ownerHasFunctionTypeWarning;

  var warnForMissingKey = function (child) {};

  {
    didWarnAboutMaps = false;
    didWarnAboutGenerators = false;
    didWarnAboutStringRefs = {};
    /**
     * Warn if there's no key explicitly set on dynamic arrays of children or
     * object keys are not valid. This allows us to keep track of children between
     * updates.
     */

    ownerHasKeyUseWarning = {};
    ownerHasFunctionTypeWarning = {};

    warnForMissingKey = function (child) {
      if (child === null || typeof child !== 'object') {
        return;
      }

      if (!child._store || child._store.validated || child.key != null) {
        return;
      }

      if (!(typeof child._store === 'object')) {
        {
          throw Error( "React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue." );
        }
      }

      child._store.validated = true;
      var currentComponentErrorInfo = 'Each child in a list should have a unique ' + '"key" prop. See https://fb.me/react-warning-keys for ' + 'more information.' + getCurrentFiberStackInDev();

      if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
        return;
      }

      ownerHasKeyUseWarning[currentComponentErrorInfo] = true;

      error('Each child in a list should have a unique ' + '"key" prop. See https://fb.me/react-warning-keys for ' + 'more information.');
    };
  }

  var isArray$1 = Array.isArray;

  function coerceRef(returnFiber, current, element) {
    var mixedRef = element.ref;

    if (mixedRef !== null && typeof mixedRef !== 'function' && typeof mixedRef !== 'object') {
      {
        // TODO: Clean this up once we turn on the string ref warning for
        // everyone, because the strict mode case will no longer be relevant
        if ((returnFiber.mode & StrictMode || warnAboutStringRefs) && // We warn in ReactElement.js if owner and self are equal for string refs
        // because these cannot be automatically converted to an arrow function
        // using a codemod. Therefore, we don't have to warn about string refs again.
        !(element._owner && element._self && element._owner.stateNode !== element._self)) {
          var componentName = getComponentName(returnFiber.type) || 'Component';

          if (!didWarnAboutStringRefs[componentName]) {
            {
              error('A string ref, "%s", has been found within a strict mode tree. ' + 'String refs are a source of potential bugs and should be avoided. ' + 'We recommend using useRef() or createRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://fb.me/react-strict-mode-string-ref%s', mixedRef, getStackByFiberInDevAndProd(returnFiber));
            }

            didWarnAboutStringRefs[componentName] = true;
          }
        }
      }

      if (element._owner) {
        var owner = element._owner;
        var inst;

        if (owner) {
          var ownerFiber = owner;

          if (!(ownerFiber.tag === ClassComponent)) {
            {
              throw Error( "Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://fb.me/react-strict-mode-string-ref" );
            }
          }

          inst = ownerFiber.stateNode;
        }

        if (!inst) {
          {
            throw Error( "Missing owner for string ref " + mixedRef + ". This error is likely caused by a bug in React. Please file an issue." );
          }
        }

        var stringRef = '' + mixedRef; // Check if previous string ref matches new string ref

        if (current !== null && current.ref !== null && typeof current.ref === 'function' && current.ref._stringRef === stringRef) {
          return current.ref;
        }

        var ref = function (value) {
          var refs = inst.refs;

          if (refs === emptyRefsObject) {
            // This is a lazy pooled frozen object, so we need to initialize.
            refs = inst.refs = {};
          }

          if (value === null) {
            delete refs[stringRef];
          } else {
            refs[stringRef] = value;
          }
        };

        ref._stringRef = stringRef;
        return ref;
      } else {
        if (!(typeof mixedRef === 'string')) {
          {
            throw Error( "Expected ref to be a function, a string, an object returned by React.createRef(), or null." );
          }
        }

        if (!element._owner) {
          {
            throw Error( "Element ref was specified as a string (" + mixedRef + ") but no owner was set. This could happen for one of the following reasons:\n1. You may be adding a ref to a function component\n2. You may be adding a ref to a component that was not created inside a component's render method\n3. You have multiple copies of React loaded\nSee https://fb.me/react-refs-must-have-owner for more information." );
          }
        }
      }
    }

    return mixedRef;
  }

  function throwOnInvalidObjectType(returnFiber, newChild) {
    if (returnFiber.type !== 'textarea') {
      var addendum = '';

      {
        addendum = ' If you meant to render a collection of children, use an array ' + 'instead.' + getCurrentFiberStackInDev();
      }

      {
        {
          throw Error( "Objects are not valid as a React child (found: " + (Object.prototype.toString.call(newChild) === '[object Object]' ? 'object with keys {' + Object.keys(newChild).join(', ') + '}' : newChild) + ")." + addendum );
        }
      }
    }
  }

  function warnOnFunctionType() {
    {
      var currentComponentErrorInfo = 'Functions are not valid as a React child. This may happen if ' + 'you return a Component instead of <Component /> from render. ' + 'Or maybe you meant to call this function rather than return it.' + getCurrentFiberStackInDev();

      if (ownerHasFunctionTypeWarning[currentComponentErrorInfo]) {
        return;
      }

      ownerHasFunctionTypeWarning[currentComponentErrorInfo] = true;

      error('Functions are not valid as a React child. This may happen if ' + 'you return a Component instead of <Component /> from render. ' + 'Or maybe you meant to call this function rather than return it.');
    }
  } // This wrapper function exists because I expect to clone the code in each path
  // to be able to optimize each path individually by branching early. This needs
  // a compiler or we can do it manually. Helpers that don't need this branching
  // live outside of this function.


  function ChildReconciler(shouldTrackSideEffects) {
    function deleteChild(returnFiber, childToDelete) {
      if (!shouldTrackSideEffects) {
        // Noop.
        return;
      } // Deletions are added in reversed order so we add it to the front.
      // At this point, the return fiber's effect list is empty except for
      // deletions, so we can just append the deletion to the list. The remaining
      // effects aren't added until the complete phase. Once we implement
      // resuming, this may not be true.


      var last = returnFiber.lastEffect;

      if (last !== null) {
        last.nextEffect = childToDelete;
        returnFiber.lastEffect = childToDelete;
      } else {
        returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
      }

      childToDelete.nextEffect = null;
      childToDelete.effectTag = Deletion;
    }

    function deleteRemainingChildren(returnFiber, currentFirstChild) {
      if (!shouldTrackSideEffects) {
        // Noop.
        return null;
      } // TODO: For the shouldClone case, this could be micro-optimized a bit by
      // assuming that after the first child we've already added everything.


      var childToDelete = currentFirstChild;

      while (childToDelete !== null) {
        deleteChild(returnFiber, childToDelete);
        childToDelete = childToDelete.sibling;
      }

      return null;
    }

    function mapRemainingChildren(returnFiber, currentFirstChild) {
      // Add the remaining children to a temporary map so that we can find them by
      // keys quickly. Implicit (null) keys get added to this set with their index
      // instead.
      var existingChildren = new Map();
      var existingChild = currentFirstChild;

      while (existingChild !== null) {
        if (existingChild.key !== null) {
          existingChildren.set(existingChild.key, existingChild);
        } else {
          existingChildren.set(existingChild.index, existingChild);
        }

        existingChild = existingChild.sibling;
      }

      return existingChildren;
    }

    function useFiber(fiber, pendingProps) {
      // We currently set sibling to null and index to 0 here because it is easy
      // to forget to do before returning it. E.g. for the single child case.
      var clone = createWorkInProgress(fiber, pendingProps);
      clone.index = 0;
      clone.sibling = null;
      return clone;
    }

    function placeChild(newFiber, lastPlacedIndex, newIndex) {
      newFiber.index = newIndex;

      if (!shouldTrackSideEffects) {
        // Noop.
        return lastPlacedIndex;
      }

      var current = newFiber.alternate;

      if (current !== null) {
        var oldIndex = current.index;

        if (oldIndex < lastPlacedIndex) {
          // This is a move.
          newFiber.effectTag = Placement;
          return lastPlacedIndex;
        } else {
          // This item can stay in place.
          return oldIndex;
        }
      } else {
        // This is an insertion.
        newFiber.effectTag = Placement;
        return lastPlacedIndex;
      }
    }

    function placeSingleChild(newFiber) {
      // This is simpler for the single child case. We only need to do a
      // placement for inserting new children.
      if (shouldTrackSideEffects && newFiber.alternate === null) {
        newFiber.effectTag = Placement;
      }

      return newFiber;
    }

    function updateTextNode(returnFiber, current, textContent, expirationTime) {
      if (current === null || current.tag !== HostText) {
        // Insert
        var created = createFiberFromText(textContent, returnFiber.mode, expirationTime);
        created.return = returnFiber;
        return created;
      } else {
        // Update
        var existing = useFiber(current, textContent);
        existing.return = returnFiber;
        return existing;
      }
    }

    function updateElement(returnFiber, current, element, expirationTime) {
      if (current !== null) {
        if (current.elementType === element.type || ( // Keep this check inline so it only runs on the false path:
         isCompatibleFamilyForHotReloading(current, element) )) {
          // Move based on index
          var existing = useFiber(current, element.props);
          existing.ref = coerceRef(returnFiber, current, element);
          existing.return = returnFiber;

          {
            existing._debugSource = element._source;
            existing._debugOwner = element._owner;
          }

          return existing;
        }
      } // Insert


      var created = createFiberFromElement(element, returnFiber.mode, expirationTime);
      created.ref = coerceRef(returnFiber, current, element);
      created.return = returnFiber;
      return created;
    }

    function updatePortal(returnFiber, current, portal, expirationTime) {
      if (current === null || current.tag !== HostPortal || current.stateNode.containerInfo !== portal.containerInfo || current.stateNode.implementation !== portal.implementation) {
        // Insert
        var created = createFiberFromPortal(portal, returnFiber.mode, expirationTime);
        created.return = returnFiber;
        return created;
      } else {
        // Update
        var existing = useFiber(current, portal.children || []);
        existing.return = returnFiber;
        return existing;
      }
    }

    function updateFragment(returnFiber, current, fragment, expirationTime, key) {
      if (current === null || current.tag !== Fragment) {
        // Insert
        var created = createFiberFromFragment(fragment, returnFiber.mode, expirationTime, key);
        created.return = returnFiber;
        return created;
      } else {
        // Update
        var existing = useFiber(current, fragment);
        existing.return = returnFiber;
        return existing;
      }
    }

    function createChild(returnFiber, newChild, expirationTime) {
      if (typeof newChild === 'string' || typeof newChild === 'number') {
        // Text nodes don't have keys. If the previous node is implicitly keyed
        // we can continue to replace it without aborting even if it is not a text
        // node.
        var created = createFiberFromText('' + newChild, returnFiber.mode, expirationTime);
        created.return = returnFiber;
        return created;
      }

      if (typeof newChild === 'object' && newChild !== null) {
        switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            {
              var _created = createFiberFromElement(newChild, returnFiber.mode, expirationTime);

              _created.ref = coerceRef(returnFiber, null, newChild);
              _created.return = returnFiber;
              return _created;
            }

          case REACT_PORTAL_TYPE:
            {
              var _created2 = createFiberFromPortal(newChild, returnFiber.mode, expirationTime);

              _created2.return = returnFiber;
              return _created2;
            }
        }

        if (isArray$1(newChild) || getIteratorFn(newChild)) {
          var _created3 = createFiberFromFragment(newChild, returnFiber.mode, expirationTime, null);

          _created3.return = returnFiber;
          return _created3;
        }

        throwOnInvalidObjectType(returnFiber, newChild);
      }

      {
        if (typeof newChild === 'function') {
          warnOnFunctionType();
        }
      }

      return null;
    }

    function updateSlot(returnFiber, oldFiber, newChild, expirationTime) {
      // Update the fiber if the keys match, otherwise return null.
      var key = oldFiber !== null ? oldFiber.key : null;

      if (typeof newChild === 'string' || typeof newChild === 'number') {
        // Text nodes don't have keys. If the previous node is implicitly keyed
        // we can continue to replace it without aborting even if it is not a text
        // node.
        if (key !== null) {
          return null;
        }

        return updateTextNode(returnFiber, oldFiber, '' + newChild, expirationTime);
      }

      if (typeof newChild === 'object' && newChild !== null) {
        switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            {
              if (newChild.key === key) {
                if (newChild.type === REACT_FRAGMENT_TYPE) {
                  return updateFragment(returnFiber, oldFiber, newChild.props.children, expirationTime, key);
                }

                return updateElement(returnFiber, oldFiber, newChild, expirationTime);
              } else {
                return null;
              }
            }

          case REACT_PORTAL_TYPE:
            {
              if (newChild.key === key) {
                return updatePortal(returnFiber, oldFiber, newChild, expirationTime);
              } else {
                return null;
              }
            }
        }

        if (isArray$1(newChild) || getIteratorFn(newChild)) {
          if (key !== null) {
            return null;
          }

          return updateFragment(returnFiber, oldFiber, newChild, expirationTime, null);
        }

        throwOnInvalidObjectType(returnFiber, newChild);
      }

      {
        if (typeof newChild === 'function') {
          warnOnFunctionType();
        }
      }

      return null;
    }

    function updateFromMap(existingChildren, returnFiber, newIdx, newChild, expirationTime) {
      if (typeof newChild === 'string' || typeof newChild === 'number') {
        // Text nodes don't have keys, so we neither have to check the old nor
        // new node for the key. If both are text nodes, they match.
        var matchedFiber = existingChildren.get(newIdx) || null;
        return updateTextNode(returnFiber, matchedFiber, '' + newChild, expirationTime);
      }

      if (typeof newChild === 'object' && newChild !== null) {
        switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            {
              var _matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;

              if (newChild.type === REACT_FRAGMENT_TYPE) {
                return updateFragment(returnFiber, _matchedFiber, newChild.props.children, expirationTime, newChild.key);
              }

              return updateElement(returnFiber, _matchedFiber, newChild, expirationTime);
            }

          case REACT_PORTAL_TYPE:
            {
              var _matchedFiber2 = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;

              return updatePortal(returnFiber, _matchedFiber2, newChild, expirationTime);
            }
        }

        if (isArray$1(newChild) || getIteratorFn(newChild)) {
          var _matchedFiber3 = existingChildren.get(newIdx) || null;

          return updateFragment(returnFiber, _matchedFiber3, newChild, expirationTime, null);
        }

        throwOnInvalidObjectType(returnFiber, newChild);
      }

      {
        if (typeof newChild === 'function') {
          warnOnFunctionType();
        }
      }

      return null;
    }
    /**
     * Warns if there is a duplicate or missing key
     */


    function warnOnInvalidKey(child, knownKeys) {
      {
        if (typeof child !== 'object' || child === null) {
          return knownKeys;
        }

        switch (child.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            warnForMissingKey(child);
            var key = child.key;

            if (typeof key !== 'string') {
              break;
            }

            if (knownKeys === null) {
              knownKeys = new Set();
              knownKeys.add(key);
              break;
            }

            if (!knownKeys.has(key)) {
              knownKeys.add(key);
              break;
            }

            error('Encountered two children with the same key, `%s`. ' + 'Keys should be unique so that components maintain their identity ' + 'across updates. Non-unique keys may cause children to be ' + 'duplicated and/or omitted — the behavior is unsupported and ' + 'could change in a future version.', key);

            break;
        }
      }

      return knownKeys;
    }

    function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, expirationTime) {
      // This algorithm can't optimize by searching from both ends since we
      // don't have backpointers on fibers. I'm trying to see how far we can get
      // with that model. If it ends up not being worth the tradeoffs, we can
      // add it later.
      // Even with a two ended optimization, we'd want to optimize for the case
      // where there are few changes and brute force the comparison instead of
      // going for the Map. It'd like to explore hitting that path first in
      // forward-only mode and only go for the Map once we notice that we need
      // lots of look ahead. This doesn't handle reversal as well as two ended
      // search but that's unusual. Besides, for the two ended optimization to
      // work on Iterables, we'd need to copy the whole set.
      // In this first iteration, we'll just live with hitting the bad case
      // (adding everything to a Map) in for every insert/move.
      // If you change this code, also update reconcileChildrenIterator() which
      // uses the same algorithm.
      {
        // First, validate keys.
        var knownKeys = null;

        for (var i = 0; i < newChildren.length; i++) {
          var child = newChildren[i];
          knownKeys = warnOnInvalidKey(child, knownKeys);
        }
      }

      var resultingFirstChild = null;
      var previousNewFiber = null;
      var oldFiber = currentFirstChild;
      var lastPlacedIndex = 0;
      var newIdx = 0;
      var nextOldFiber = null;

      for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
        if (oldFiber.index > newIdx) {
          nextOldFiber = oldFiber;
          oldFiber = null;
        } else {
          nextOldFiber = oldFiber.sibling;
        }

        var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], expirationTime);

        if (newFiber === null) {
          // TODO: This breaks on empty slots like null children. That's
          // unfortunate because it triggers the slow path all the time. We need
          // a better way to communicate whether this was a miss or null,
          // boolean, undefined, etc.
          if (oldFiber === null) {
            oldFiber = nextOldFiber;
          }

          break;
        }

        if (shouldTrackSideEffects) {
          if (oldFiber && newFiber.alternate === null) {
            // We matched the slot, but we didn't reuse the existing fiber, so we
            // need to delete the existing child.
            deleteChild(returnFiber, oldFiber);
          }
        }

        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = newFiber;
        } else {
          // TODO: Defer siblings if we're not at the right index for this slot.
          // I.e. if we had null values before, then we want to defer this
          // for each null value. However, we also don't want to call updateSlot
          // with the previous one.
          previousNewFiber.sibling = newFiber;
        }

        previousNewFiber = newFiber;
        oldFiber = nextOldFiber;
      }

      if (newIdx === newChildren.length) {
        // We've reached the end of the new children. We can delete the rest.
        deleteRemainingChildren(returnFiber, oldFiber);
        return resultingFirstChild;
      }

      if (oldFiber === null) {
        // If we don't have any more existing children we can choose a fast path
        // since the rest will all be insertions.
        for (; newIdx < newChildren.length; newIdx++) {
          var _newFiber = createChild(returnFiber, newChildren[newIdx], expirationTime);

          if (_newFiber === null) {
            continue;
          }

          lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);

          if (previousNewFiber === null) {
            // TODO: Move out of the loop. This only happens for the first run.
            resultingFirstChild = _newFiber;
          } else {
            previousNewFiber.sibling = _newFiber;
          }

          previousNewFiber = _newFiber;
        }

        return resultingFirstChild;
      } // Add all children to a key map for quick lookups.


      var existingChildren = mapRemainingChildren(returnFiber, oldFiber); // Keep scanning and use the map to restore deleted items as moves.

      for (; newIdx < newChildren.length; newIdx++) {
        var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], expirationTime);

        if (_newFiber2 !== null) {
          if (shouldTrackSideEffects) {
            if (_newFiber2.alternate !== null) {
              // The new fiber is a work in progress, but if there exists a
              // current, that means that we reused the fiber. We need to delete
              // it from the child list so that we don't add it to the deletion
              // list.
              existingChildren.delete(_newFiber2.key === null ? newIdx : _newFiber2.key);
            }
          }

          lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);

          if (previousNewFiber === null) {
            resultingFirstChild = _newFiber2;
          } else {
            previousNewFiber.sibling = _newFiber2;
          }

          previousNewFiber = _newFiber2;
        }
      }

      if (shouldTrackSideEffects) {
        // Any existing children that weren't consumed above were deleted. We need
        // to add them to the deletion list.
        existingChildren.forEach(function (child) {
          return deleteChild(returnFiber, child);
        });
      }

      return resultingFirstChild;
    }

    function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildrenIterable, expirationTime) {
      // This is the same implementation as reconcileChildrenArray(),
      // but using the iterator instead.
      var iteratorFn = getIteratorFn(newChildrenIterable);

      if (!(typeof iteratorFn === 'function')) {
        {
          throw Error( "An object is not an iterable. This error is likely caused by a bug in React. Please file an issue." );
        }
      }

      {
        // We don't support rendering Generators because it's a mutation.
        // See https://github.com/facebook/react/issues/12995
        if (typeof Symbol === 'function' && // $FlowFixMe Flow doesn't know about toStringTag
        newChildrenIterable[Symbol.toStringTag] === 'Generator') {
          if (!didWarnAboutGenerators) {
            error('Using Generators as children is unsupported and will likely yield ' + 'unexpected results because enumerating a generator mutates it. ' + 'You may convert it to an array with `Array.from()` or the ' + '`[...spread]` operator before rendering. Keep in mind ' + 'you might need to polyfill these features for older browsers.');
          }

          didWarnAboutGenerators = true;
        } // Warn about using Maps as children


        if (newChildrenIterable.entries === iteratorFn) {
          if (!didWarnAboutMaps) {
            error('Using Maps as children is unsupported and will likely yield ' + 'unexpected results. Convert it to a sequence/iterable of keyed ' + 'ReactElements instead.');
          }

          didWarnAboutMaps = true;
        } // First, validate keys.
        // We'll get a different iterator later for the main pass.


        var _newChildren = iteratorFn.call(newChildrenIterable);

        if (_newChildren) {
          var knownKeys = null;

          var _step = _newChildren.next();

          for (; !_step.done; _step = _newChildren.next()) {
            var child = _step.value;
            knownKeys = warnOnInvalidKey(child, knownKeys);
          }
        }
      }

      var newChildren = iteratorFn.call(newChildrenIterable);

      if (!(newChildren != null)) {
        {
          throw Error( "An iterable object provided no iterator." );
        }
      }

      var resultingFirstChild = null;
      var previousNewFiber = null;
      var oldFiber = currentFirstChild;
      var lastPlacedIndex = 0;
      var newIdx = 0;
      var nextOldFiber = null;
      var step = newChildren.next();

      for (; oldFiber !== null && !step.done; newIdx++, step = newChildren.next()) {
        if (oldFiber.index > newIdx) {
          nextOldFiber = oldFiber;
          oldFiber = null;
        } else {
          nextOldFiber = oldFiber.sibling;
        }

        var newFiber = updateSlot(returnFiber, oldFiber, step.value, expirationTime);

        if (newFiber === null) {
          // TODO: This breaks on empty slots like null children. That's
          // unfortunate because it triggers the slow path all the time. We need
          // a better way to communicate whether this was a miss or null,
          // boolean, undefined, etc.
          if (oldFiber === null) {
            oldFiber = nextOldFiber;
          }

          break;
        }

        if (shouldTrackSideEffects) {
          if (oldFiber && newFiber.alternate === null) {
            // We matched the slot, but we didn't reuse the existing fiber, so we
            // need to delete the existing child.
            deleteChild(returnFiber, oldFiber);
          }
        }

        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = newFiber;
        } else {
          // TODO: Defer siblings if we're not at the right index for this slot.
          // I.e. if we had null values before, then we want to defer this
          // for each null value. However, we also don't want to call updateSlot
          // with the previous one.
          previousNewFiber.sibling = newFiber;
        }

        previousNewFiber = newFiber;
        oldFiber = nextOldFiber;
      }

      if (step.done) {
        // We've reached the end of the new children. We can delete the rest.
        deleteRemainingChildren(returnFiber, oldFiber);
        return resultingFirstChild;
      }

      if (oldFiber === null) {
        // If we don't have any more existing children we can choose a fast path
        // since the rest will all be insertions.
        for (; !step.done; newIdx++, step = newChildren.next()) {
          var _newFiber3 = createChild(returnFiber, step.value, expirationTime);

          if (_newFiber3 === null) {
            continue;
          }

          lastPlacedIndex = placeChild(_newFiber3, lastPlacedIndex, newIdx);

          if (previousNewFiber === null) {
            // TODO: Move out of the loop. This only happens for the first run.
            resultingFirstChild = _newFiber3;
          } else {
            previousNewFiber.sibling = _newFiber3;
          }

          previousNewFiber = _newFiber3;
        }

        return resultingFirstChild;
      } // Add all children to a key map for quick lookups.


      var existingChildren = mapRemainingChildren(returnFiber, oldFiber); // Keep scanning and use the map to restore deleted items as moves.

      for (; !step.done; newIdx++, step = newChildren.next()) {
        var _newFiber4 = updateFromMap(existingChildren, returnFiber, newIdx, step.value, expirationTime);

        if (_newFiber4 !== null) {
          if (shouldTrackSideEffects) {
            if (_newFiber4.alternate !== null) {
              // The new fiber is a work in progress, but if there exists a
              // current, that means that we reused the fiber. We need to delete
              // it from the child list so that we don't add it to the deletion
              // list.
              existingChildren.delete(_newFiber4.key === null ? newIdx : _newFiber4.key);
            }
          }

          lastPlacedIndex = placeChild(_newFiber4, lastPlacedIndex, newIdx);

          if (previousNewFiber === null) {
            resultingFirstChild = _newFiber4;
          } else {
            previousNewFiber.sibling = _newFiber4;
          }

          previousNewFiber = _newFiber4;
        }
      }

      if (shouldTrackSideEffects) {
        // Any existing children that weren't consumed above were deleted. We need
        // to add them to the deletion list.
        existingChildren.forEach(function (child) {
          return deleteChild(returnFiber, child);
        });
      }

      return resultingFirstChild;
    }

    function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent, expirationTime) {
      // There's no need to check for keys on text nodes since we don't have a
      // way to define them.
      if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
        // We already have an existing node so let's just update it and delete
        // the rest.
        deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
        var existing = useFiber(currentFirstChild, textContent);
        existing.return = returnFiber;
        return existing;
      } // The existing first child is not a text node so we need to create one
      // and delete the existing ones.


      deleteRemainingChildren(returnFiber, currentFirstChild);
      var created = createFiberFromText(textContent, returnFiber.mode, expirationTime);
      created.return = returnFiber;
      return created;
    }

    function reconcileSingleElement(returnFiber, currentFirstChild, element, expirationTime) {
      var key = element.key;
      var child = currentFirstChild;

      while (child !== null) {
        // TODO: If key === null and child.key === null, then this only applies to
        // the first item in the list.
        if (child.key === key) {
          switch (child.tag) {
            case Fragment:
              {
                if (element.type === REACT_FRAGMENT_TYPE) {
                  deleteRemainingChildren(returnFiber, child.sibling);
                  var existing = useFiber(child, element.props.children);
                  existing.return = returnFiber;

                  {
                    existing._debugSource = element._source;
                    existing._debugOwner = element._owner;
                  }

                  return existing;
                }

                break;
              }

            case Block:

            // We intentionally fallthrough here if enableBlocksAPI is not on.
            // eslint-disable-next-lined no-fallthrough

            default:
              {
                if (child.elementType === element.type || ( // Keep this check inline so it only runs on the false path:
                 isCompatibleFamilyForHotReloading(child, element) )) {
                  deleteRemainingChildren(returnFiber, child.sibling);

                  var _existing3 = useFiber(child, element.props);

                  _existing3.ref = coerceRef(returnFiber, child, element);
                  _existing3.return = returnFiber;

                  {
                    _existing3._debugSource = element._source;
                    _existing3._debugOwner = element._owner;
                  }

                  return _existing3;
                }

                break;
              }
          } // Didn't match.


          deleteRemainingChildren(returnFiber, child);
          break;
        } else {
          deleteChild(returnFiber, child);
        }

        child = child.sibling;
      }

      if (element.type === REACT_FRAGMENT_TYPE) {
        var created = createFiberFromFragment(element.props.children, returnFiber.mode, expirationTime, element.key);
        created.return = returnFiber;
        return created;
      } else {
        var _created4 = createFiberFromElement(element, returnFiber.mode, expirationTime);

        _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
        _created4.return = returnFiber;
        return _created4;
      }
    }

    function reconcileSinglePortal(returnFiber, currentFirstChild, portal, expirationTime) {
      var key = portal.key;
      var child = currentFirstChild;

      while (child !== null) {
        // TODO: If key === null and child.key === null, then this only applies to
        // the first item in the list.
        if (child.key === key) {
          if (child.tag === HostPortal && child.stateNode.containerInfo === portal.containerInfo && child.stateNode.implementation === portal.implementation) {
            deleteRemainingChildren(returnFiber, child.sibling);
            var existing = useFiber(child, portal.children || []);
            existing.return = returnFiber;
            return existing;
          } else {
            deleteRemainingChildren(returnFiber, child);
            break;
          }
        } else {
          deleteChild(returnFiber, child);
        }

        child = child.sibling;
      }

      var created = createFiberFromPortal(portal, returnFiber.mode, expirationTime);
      created.return = returnFiber;
      return created;
    } // This API will tag the children with the side-effect of the reconciliation
    // itself. They will be added to the side-effect list as we pass through the
    // children and the parent.


    function reconcileChildFibers(returnFiber, currentFirstChild, newChild, expirationTime) {
      // This function is not recursive.
      // If the top level item is an array, we treat it as a set of children,
      // not as a fragment. Nested arrays on the other hand will be treated as
      // fragment nodes. Recursion happens at the normal flow.
      // Handle top level unkeyed fragments as if they were arrays.
      // This leads to an ambiguity between <>{[...]}</> and <>...</>.
      // We treat the ambiguous cases above the same.
      var isUnkeyedTopLevelFragment = typeof newChild === 'object' && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null;

      if (isUnkeyedTopLevelFragment) {
        newChild = newChild.props.children;
      } // Handle object types


      var isObject = typeof newChild === 'object' && newChild !== null;

      if (isObject) {
        switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, expirationTime));

          case REACT_PORTAL_TYPE:
            return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, expirationTime));
        }
      }

      if (typeof newChild === 'string' || typeof newChild === 'number') {
        return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, expirationTime));
      }

      if (isArray$1(newChild)) {
        return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, expirationTime);
      }

      if (getIteratorFn(newChild)) {
        return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, expirationTime);
      }

      if (isObject) {
        throwOnInvalidObjectType(returnFiber, newChild);
      }

      {
        if (typeof newChild === 'function') {
          warnOnFunctionType();
        }
      }

      if (typeof newChild === 'undefined' && !isUnkeyedTopLevelFragment) {
        // If the new child is undefined, and the return fiber is a composite
        // component, throw an error. If Fiber return types are disabled,
        // we already threw above.
        switch (returnFiber.tag) {
          case ClassComponent:
            {
              {
                var instance = returnFiber.stateNode;

                if (instance.render._isMockFunction) {
                  // We allow auto-mocks to proceed as if they're returning null.
                  break;
                }
              }
            }
          // Intentionally fall through to the next case, which handles both
          // functions and classes
          // eslint-disable-next-lined no-fallthrough

          case FunctionComponent:
            {
              var Component = returnFiber.type;

              {
                {
                  throw Error( (Component.displayName || Component.name || 'Component') + "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null." );
                }
              }
            }
        }
      } // Remaining cases are all treated as empty.


      return deleteRemainingChildren(returnFiber, currentFirstChild);
    }

    return reconcileChildFibers;
  }

  var reconcileChildFibers = ChildReconciler(true);
  var mountChildFibers = ChildReconciler(false);
  function cloneChildFibers(current, workInProgress) {
    if (!(current === null || workInProgress.child === current.child)) {
      {
        throw Error( "Resuming work not yet implemented." );
      }
    }

    if (workInProgress.child === null) {
      return;
    }

    var currentChild = workInProgress.child;
    var newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
    workInProgress.child = newChild;
    newChild.return = workInProgress;

    while (currentChild.sibling !== null) {
      currentChild = currentChild.sibling;
      newChild = newChild.sibling = createWorkInProgress(currentChild, currentChild.pendingProps);
      newChild.return = workInProgress;
    }

    newChild.sibling = null;
  } // Reset a workInProgress child set to prepare it for a second pass.

  function resetChildFibers(workInProgress, renderExpirationTime) {
    var child = workInProgress.child;

    while (child !== null) {
      resetWorkInProgress(child, renderExpirationTime);
      child = child.sibling;
    }
  }

  var NO_CONTEXT = {};
  var contextStackCursor$1 = createCursor(NO_CONTEXT);
  var contextFiberStackCursor = createCursor(NO_CONTEXT);
  var rootInstanceStackCursor = createCursor(NO_CONTEXT);

  function requiredContext(c) {
    if (!(c !== NO_CONTEXT)) {
      {
        throw Error( "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue." );
      }
    }

    return c;
  }

  function getRootHostContainer() {
    var rootInstance = requiredContext(rootInstanceStackCursor.current);
    return rootInstance;
  }

  function pushHostContainer(fiber, nextRootInstance) {
    // Push current root instance onto the stack;
    // This allows us to reset root when portals are popped.
    push(rootInstanceStackCursor, nextRootInstance, fiber); // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.

    push(contextFiberStackCursor, fiber, fiber); // Finally, we need to push the host context to the stack.
    // However, we can't just call getRootHostContext() and push it because
    // we'd have a different number of entries on the stack depending on
    // whether getRootHostContext() throws somewhere in renderer code or not.
    // So we push an empty value first. This lets us safely unwind on errors.

    push(contextStackCursor$1, NO_CONTEXT, fiber);
    var nextRootContext = getRootHostContext(nextRootInstance); // Now that we know this function doesn't throw, replace it.

    pop(contextStackCursor$1, fiber);
    push(contextStackCursor$1, nextRootContext, fiber);
  }

  function popHostContainer(fiber) {
    pop(contextStackCursor$1, fiber);
    pop(contextFiberStackCursor, fiber);
    pop(rootInstanceStackCursor, fiber);
  }

  function getHostContext() {
    var context = requiredContext(contextStackCursor$1.current);
    return context;
  }

  function pushHostContext(fiber) {
    var rootInstance = requiredContext(rootInstanceStackCursor.current);
    var context = requiredContext(contextStackCursor$1.current);
    var nextContext = getChildHostContext(context, fiber.type); // Don't push this Fiber's context unless it's unique.

    if (context === nextContext) {
      return;
    } // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.


    push(contextFiberStackCursor, fiber, fiber);
    push(contextStackCursor$1, nextContext, fiber);
  }

  function popHostContext(fiber) {
    // Do not pop unless this Fiber provided the current context.
    // pushHostContext() only pushes Fibers that provide unique contexts.
    if (contextFiberStackCursor.current !== fiber) {
      return;
    }

    pop(contextStackCursor$1, fiber);
    pop(contextFiberStackCursor, fiber);
  }

  var DefaultSuspenseContext = 0; // The Suspense Context is split into two parts. The lower bits is
  // inherited deeply down the subtree. The upper bits only affect
  // this immediate suspense boundary and gets reset each new
  // boundary or suspense list.

  var SubtreeSuspenseContextMask = 1; // Subtree Flags:
  // InvisibleParentSuspenseContext indicates that one of our parent Suspense
  // boundaries is not currently showing visible main content.
  // Either because it is already showing a fallback or is not mounted at all.
  // We can use this to determine if it is desirable to trigger a fallback at
  // the parent. If not, then we might need to trigger undesirable boundaries
  // and/or suspend the commit to avoid hiding the parent content.

  var InvisibleParentSuspenseContext = 1; // Shallow Flags:
  // ForceSuspenseFallback can be used by SuspenseList to force newly added
  // items into their fallback state during one of the render passes.

  var ForceSuspenseFallback = 2;
  var suspenseStackCursor = createCursor(DefaultSuspenseContext);
  function hasSuspenseContext(parentContext, flag) {
    return (parentContext & flag) !== 0;
  }
  function setDefaultShallowSuspenseContext(parentContext) {
    return parentContext & SubtreeSuspenseContextMask;
  }
  function setShallowSuspenseContext(parentContext, shallowContext) {
    return parentContext & SubtreeSuspenseContextMask | shallowContext;
  }
  function addSubtreeSuspenseContext(parentContext, subtreeContext) {
    return parentContext | subtreeContext;
  }
  function pushSuspenseContext(fiber, newContext) {
    push(suspenseStackCursor, newContext, fiber);
  }
  function popSuspenseContext(fiber) {
    pop(suspenseStackCursor, fiber);
  }

  function shouldCaptureSuspense(workInProgress, hasInvisibleParent) {
    // If it was the primary children that just suspended, capture and render the
    // fallback. Otherwise, don't capture and bubble to the next boundary.
    var nextState = workInProgress.memoizedState;

    if (nextState !== null) {
      if (nextState.dehydrated !== null) {
        // A dehydrated boundary always captures.
        return true;
      }

      return false;
    }

    var props = workInProgress.memoizedProps; // In order to capture, the Suspense component must have a fallback prop.

    if (props.fallback === undefined) {
      return false;
    } // Regular boundaries always capture.


    if (props.unstable_avoidThisFallback !== true) {
      return true;
    } // If it's a boundary we should avoid, then we prefer to bubble up to the
    // parent boundary if it is currently invisible.


    if (hasInvisibleParent) {
      return false;
    } // If the parent is not able to handle it, we must handle it.


    return true;
  }
  function findFirstSuspended(row) {
    var node = row;

    while (node !== null) {
      if (node.tag === SuspenseComponent) {
        var state = node.memoizedState;

        if (state !== null) {
          var dehydrated = state.dehydrated;

          if (dehydrated === null || isSuspenseInstancePending(dehydrated) || isSuspenseInstanceFallback(dehydrated)) {
            return node;
          }
        }
      } else if (node.tag === SuspenseListComponent && // revealOrder undefined can't be trusted because it don't
      // keep track of whether it suspended or not.
      node.memoizedProps.revealOrder !== undefined) {
        var didSuspend = (node.effectTag & DidCapture) !== NoEffect;

        if (didSuspend) {
          return node;
        }
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }

      if (node === row) {
        return null;
      }

      while (node.sibling === null) {
        if (node.return === null || node.return === row) {
          return null;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }

    return null;
  }

  function createDeprecatedResponderListener(responder, props) {
    var eventResponderListener = {
      responder: responder,
      props: props
    };

    {
      Object.freeze(eventResponderListener);
    }

    return eventResponderListener;
  }

  var HasEffect =
  /* */
  1; // Represents the phase in which the effect (not the clean-up) fires.

  var Layout =
  /*    */
  2;
  var Passive$1 =
  /*   */
  4;

  var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher,
      ReactCurrentBatchConfig$1 = ReactSharedInternals.ReactCurrentBatchConfig;
  var didWarnAboutMismatchedHooksForComponent;

  {
    didWarnAboutMismatchedHooksForComponent = new Set();
  }

  // These are set right before calling the component.
  var renderExpirationTime = NoWork; // The work-in-progress fiber. I've named it differently to distinguish it from
  // the work-in-progress hook.

  var currentlyRenderingFiber$1 = null; // Hooks are stored as a linked list on the fiber's memoizedState field. The
  // current hook list is the list that belongs to the current fiber. The
  // work-in-progress hook list is a new list that will be added to the
  // work-in-progress fiber.

  var currentHook = null;
  var workInProgressHook = null; // Whether an update was scheduled at any point during the render phase. This
  // does not get reset if we do another render pass; only when we're completely
  // finished evaluating this component. This is an optimization so we know
  // whether we need to clear render phase updates after a throw.

  var didScheduleRenderPhaseUpdate = false;
  var RE_RENDER_LIMIT = 25; // In DEV, this is the name of the currently executing primitive hook

  var currentHookNameInDev = null; // In DEV, this list ensures that hooks are called in the same order between renders.
  // The list stores the order of hooks used during the initial render (mount).
  // Subsequent renders (updates) reference this list.

  var hookTypesDev = null;
  var hookTypesUpdateIndexDev = -1; // In DEV, this tracks whether currently rendering component needs to ignore
  // the dependencies for Hooks that need them (e.g. useEffect or useMemo).
  // When true, such Hooks will always be "remounted". Only used during hot reload.

  var ignorePreviousDependencies = false;

  function mountHookTypesDev() {
    {
      var hookName = currentHookNameInDev;

      if (hookTypesDev === null) {
        hookTypesDev = [hookName];
      } else {
        hookTypesDev.push(hookName);
      }
    }
  }

  function updateHookTypesDev() {
    {
      var hookName = currentHookNameInDev;

      if (hookTypesDev !== null) {
        hookTypesUpdateIndexDev++;

        if (hookTypesDev[hookTypesUpdateIndexDev] !== hookName) {
          warnOnHookMismatchInDev(hookName);
        }
      }
    }
  }

  function checkDepsAreArrayDev(deps) {
    {
      if (deps !== undefined && deps !== null && !Array.isArray(deps)) {
        // Verify deps, but only on mount to avoid extra checks.
        // It's unlikely their type would change as usually you define them inline.
        error('%s received a final argument that is not an array (instead, received `%s`). When ' + 'specified, the final argument must be an array.', currentHookNameInDev, typeof deps);
      }
    }
  }

  function warnOnHookMismatchInDev(currentHookName) {
    {
      var componentName = getComponentName(currentlyRenderingFiber$1.type);

      if (!didWarnAboutMismatchedHooksForComponent.has(componentName)) {
        didWarnAboutMismatchedHooksForComponent.add(componentName);

        if (hookTypesDev !== null) {
          var table = '';
          var secondColumnStart = 30;

          for (var i = 0; i <= hookTypesUpdateIndexDev; i++) {
            var oldHookName = hookTypesDev[i];
            var newHookName = i === hookTypesUpdateIndexDev ? currentHookName : oldHookName;
            var row = i + 1 + ". " + oldHookName; // Extra space so second column lines up
            // lol @ IE not supporting String#repeat

            while (row.length < secondColumnStart) {
              row += ' ';
            }

            row += newHookName + '\n';
            table += row;
          }

          error('React has detected a change in the order of Hooks called by %s. ' + 'This will lead to bugs and errors if not fixed. ' + 'For more information, read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' + '   Previous render            Next render\n' + '   ------------------------------------------------------\n' + '%s' + '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n', componentName, table);
        }
      }
    }
  }

  function throwInvalidHookError() {
    {
      {
        throw Error( "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem." );
      }
    }
  }

  function areHookInputsEqual(nextDeps, prevDeps) {
    {
      if (ignorePreviousDependencies) {
        // Only true when this component is being hot reloaded.
        return false;
      }
    }

    if (prevDeps === null) {
      {
        error('%s received a final argument during this render, but not during ' + 'the previous render. Even though the final argument is optional, ' + 'its type cannot change between renders.', currentHookNameInDev);
      }

      return false;
    }

    {
      // Don't bother comparing lengths in prod because these arrays should be
      // passed inline.
      if (nextDeps.length !== prevDeps.length) {
        error('The final argument passed to %s changed size between renders. The ' + 'order and size of this array must remain constant.\n\n' + 'Previous: %s\n' + 'Incoming: %s', currentHookNameInDev, "[" + prevDeps.join(', ') + "]", "[" + nextDeps.join(', ') + "]");
      }
    }

    for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
      if (objectIs(nextDeps[i], prevDeps[i])) {
        continue;
      }

      return false;
    }

    return true;
  }

  function renderWithHooks(current, workInProgress, Component, props, secondArg, nextRenderExpirationTime) {
    renderExpirationTime = nextRenderExpirationTime;
    currentlyRenderingFiber$1 = workInProgress;

    {
      hookTypesDev = current !== null ? current._debugHookTypes : null;
      hookTypesUpdateIndexDev = -1; // Used for hot reloading:

      ignorePreviousDependencies = current !== null && current.type !== workInProgress.type;
    }

    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;
    workInProgress.expirationTime = NoWork; // The following should have already been reset
    // currentHook = null;
    // workInProgressHook = null;
    // didScheduleRenderPhaseUpdate = false;
    // TODO Warn if no hooks are used at all during mount, then some are used during update.
    // Currently we will identify the update render as a mount because memoizedState === null.
    // This is tricky because it's valid for certain types of components (e.g. React.lazy)
    // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
    // Non-stateful hooks (e.g. context) don't get added to memoizedState,
    // so memoizedState would be null during updates and mounts.

    {
      if (current !== null && current.memoizedState !== null) {
        ReactCurrentDispatcher.current = HooksDispatcherOnUpdateInDEV;
      } else if (hookTypesDev !== null) {
        // This dispatcher handles an edge case where a component is updating,
        // but no stateful hooks have been used.
        // We want to match the production code behavior (which will use HooksDispatcherOnMount),
        // but with the extra DEV validation to ensure hooks ordering hasn't changed.
        // This dispatcher does that.
        ReactCurrentDispatcher.current = HooksDispatcherOnMountWithHookTypesInDEV;
      } else {
        ReactCurrentDispatcher.current = HooksDispatcherOnMountInDEV;
      }
    }

    var children = Component(props, secondArg); // Check if there was a render phase update

    if (workInProgress.expirationTime === renderExpirationTime) {
      // Keep rendering in a loop for as long as render phase updates continue to
      // be scheduled. Use a counter to prevent infinite loops.
      var numberOfReRenders = 0;

      do {
        workInProgress.expirationTime = NoWork;

        if (!(numberOfReRenders < RE_RENDER_LIMIT)) {
          {
            throw Error( "Too many re-renders. React limits the number of renders to prevent an infinite loop." );
          }
        }

        numberOfReRenders += 1;

        {
          // Even when hot reloading, allow dependencies to stabilize
          // after first render to prevent infinite render phase updates.
          ignorePreviousDependencies = false;
        } // Start over from the beginning of the list


        currentHook = null;
        workInProgressHook = null;
        workInProgress.updateQueue = null;

        {
          // Also validate hook order for cascading updates.
          hookTypesUpdateIndexDev = -1;
        }

        ReactCurrentDispatcher.current =  HooksDispatcherOnRerenderInDEV ;
        children = Component(props, secondArg);
      } while (workInProgress.expirationTime === renderExpirationTime);
    } // We can assume the previous dispatcher is always this one, since we set it
    // at the beginning of the render phase and there's no re-entrancy.


    ReactCurrentDispatcher.current = ContextOnlyDispatcher;

    {
      workInProgress._debugHookTypes = hookTypesDev;
    } // This check uses currentHook so that it works the same in DEV and prod bundles.
    // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.


    var didRenderTooFewHooks = currentHook !== null && currentHook.next !== null;
    renderExpirationTime = NoWork;
    currentlyRenderingFiber$1 = null;
    currentHook = null;
    workInProgressHook = null;

    {
      currentHookNameInDev = null;
      hookTypesDev = null;
      hookTypesUpdateIndexDev = -1;
    }

    didScheduleRenderPhaseUpdate = false;

    if (!!didRenderTooFewHooks) {
      {
        throw Error( "Rendered fewer hooks than expected. This may be caused by an accidental early return statement." );
      }
    }

    return children;
  }
  function bailoutHooks(current, workInProgress, expirationTime) {
    workInProgress.updateQueue = current.updateQueue;
    workInProgress.effectTag &= ~(Passive | Update);

    if (current.expirationTime <= expirationTime) {
      current.expirationTime = NoWork;
    }
  }
  function resetHooksAfterThrow() {
    // We can assume the previous dispatcher is always this one, since we set it
    // at the beginning of the render phase and there's no re-entrancy.
    ReactCurrentDispatcher.current = ContextOnlyDispatcher;

    if (didScheduleRenderPhaseUpdate) {
      // There were render phase updates. These are only valid for this render
      // phase, which we are now aborting. Remove the updates from the queues so
      // they do not persist to the next render. Do not remove updates from hooks
      // that weren't processed.
      //
      // Only reset the updates from the queue if it has a clone. If it does
      // not have a clone, that means it wasn't processed, and the updates were
      // scheduled before we entered the render phase.
      var hook = currentlyRenderingFiber$1.memoizedState;

      while (hook !== null) {
        var queue = hook.queue;

        if (queue !== null) {
          queue.pending = null;
        }

        hook = hook.next;
      }
    }

    renderExpirationTime = NoWork;
    currentlyRenderingFiber$1 = null;
    currentHook = null;
    workInProgressHook = null;

    {
      hookTypesDev = null;
      hookTypesUpdateIndexDev = -1;
      currentHookNameInDev = null;
    }

    didScheduleRenderPhaseUpdate = false;
  }

  function mountWorkInProgressHook() {
    var hook = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };

    if (workInProgressHook === null) {
      // This is the first hook in the list
      currentlyRenderingFiber$1.memoizedState = workInProgressHook = hook;
    } else {
      // Append to the end of the list
      workInProgressHook = workInProgressHook.next = hook;
    }

    return workInProgressHook;
  }

  function updateWorkInProgressHook() {
    // This function is used both for updates and for re-renders triggered by a
    // render phase update. It assumes there is either a current hook we can
    // clone, or a work-in-progress hook from a previous render pass that we can
    // use as a base. When we reach the end of the base list, we must switch to
    // the dispatcher used for mounts.
    var nextCurrentHook;

    if (currentHook === null) {
      var current = currentlyRenderingFiber$1.alternate;

      if (current !== null) {
        nextCurrentHook = current.memoizedState;
      } else {
        nextCurrentHook = null;
      }
    } else {
      nextCurrentHook = currentHook.next;
    }

    var nextWorkInProgressHook;

    if (workInProgressHook === null) {
      nextWorkInProgressHook = currentlyRenderingFiber$1.memoizedState;
    } else {
      nextWorkInProgressHook = workInProgressHook.next;
    }

    if (nextWorkInProgressHook !== null) {
      // There's already a work-in-progress. Reuse it.
      workInProgressHook = nextWorkInProgressHook;
      nextWorkInProgressHook = workInProgressHook.next;
      currentHook = nextCurrentHook;
    } else {
      // Clone from the current hook.
      if (!(nextCurrentHook !== null)) {
        {
          throw Error( "Rendered more hooks than during the previous render." );
        }
      }

      currentHook = nextCurrentHook;
      var newHook = {
        memoizedState: currentHook.memoizedState,
        baseState: currentHook.baseState,
        baseQueue: currentHook.baseQueue,
        queue: currentHook.queue,
        next: null
      };

      if (workInProgressHook === null) {
        // This is the first hook in the list.
        currentlyRenderingFiber$1.memoizedState = workInProgressHook = newHook;
      } else {
        // Append to the end of the list.
        workInProgressHook = workInProgressHook.next = newHook;
      }
    }

    return workInProgressHook;
  }

  function createFunctionComponentUpdateQueue() {
    return {
      lastEffect: null
    };
  }

  function basicStateReducer(state, action) {
    // $FlowFixMe: Flow doesn't like mixed types
    return typeof action === 'function' ? action(state) : action;
  }

  function mountReducer(reducer, initialArg, init) {
    var hook = mountWorkInProgressHook();
    var initialState;

    if (init !== undefined) {
      initialState = init(initialArg);
    } else {
      initialState = initialArg;
    }

    hook.memoizedState = hook.baseState = initialState;
    var queue = hook.queue = {
      pending: null,
      dispatch: null,
      lastRenderedReducer: reducer,
      lastRenderedState: initialState
    };
    var dispatch = queue.dispatch = dispatchAction.bind(null, currentlyRenderingFiber$1, queue);
    return [hook.memoizedState, dispatch];
  }

  function updateReducer(reducer, initialArg, init) {
    var hook = updateWorkInProgressHook();
    var queue = hook.queue;

    if (!(queue !== null)) {
      {
        throw Error( "Should have a queue. This is likely a bug in React. Please file an issue." );
      }
    }

    queue.lastRenderedReducer = reducer;
    var current = currentHook; // The last rebase update that is NOT part of the base state.

    var baseQueue = current.baseQueue; // The last pending update that hasn't been processed yet.

    var pendingQueue = queue.pending;

    if (pendingQueue !== null) {
      // We have new updates that haven't been processed yet.
      // We'll add them to the base queue.
      if (baseQueue !== null) {
        // Merge the pending queue and the base queue.
        var baseFirst = baseQueue.next;
        var pendingFirst = pendingQueue.next;
        baseQueue.next = pendingFirst;
        pendingQueue.next = baseFirst;
      }

      current.baseQueue = baseQueue = pendingQueue;
      queue.pending = null;
    }

    if (baseQueue !== null) {
      // We have a queue to process.
      var first = baseQueue.next;
      var newState = current.baseState;
      var newBaseState = null;
      var newBaseQueueFirst = null;
      var newBaseQueueLast = null;
      var update = first;

      do {
        var updateExpirationTime = update.expirationTime;

        if (updateExpirationTime < renderExpirationTime) {
          // Priority is insufficient. Skip this update. If this is the first
          // skipped update, the previous update/state is the new base
          // update/state.
          var clone = {
            expirationTime: update.expirationTime,
            suspenseConfig: update.suspenseConfig,
            action: update.action,
            eagerReducer: update.eagerReducer,
            eagerState: update.eagerState,
            next: null
          };

          if (newBaseQueueLast === null) {
            newBaseQueueFirst = newBaseQueueLast = clone;
            newBaseState = newState;
          } else {
            newBaseQueueLast = newBaseQueueLast.next = clone;
          } // Update the remaining priority in the queue.


          if (updateExpirationTime > currentlyRenderingFiber$1.expirationTime) {
            currentlyRenderingFiber$1.expirationTime = updateExpirationTime;
            markUnprocessedUpdateTime(updateExpirationTime);
          }
        } else {
          // This update does have sufficient priority.
          if (newBaseQueueLast !== null) {
            var _clone = {
              expirationTime: Sync,
              // This update is going to be committed so we never want uncommit it.
              suspenseConfig: update.suspenseConfig,
              action: update.action,
              eagerReducer: update.eagerReducer,
              eagerState: update.eagerState,
              next: null
            };
            newBaseQueueLast = newBaseQueueLast.next = _clone;
          } // Mark the event time of this update as relevant to this render pass.
          // TODO: This should ideally use the true event time of this update rather than
          // its priority which is a derived and not reverseable value.
          // TODO: We should skip this update if it was already committed but currently
          // we have no way of detecting the difference between a committed and suspended
          // update here.


          markRenderEventTimeAndConfig(updateExpirationTime, update.suspenseConfig); // Process this update.

          if (update.eagerReducer === reducer) {
            // If this update was processed eagerly, and its reducer matches the
            // current reducer, we can use the eagerly computed state.
            newState = update.eagerState;
          } else {
            var action = update.action;
            newState = reducer(newState, action);
          }
        }

        update = update.next;
      } while (update !== null && update !== first);

      if (newBaseQueueLast === null) {
        newBaseState = newState;
      } else {
        newBaseQueueLast.next = newBaseQueueFirst;
      } // Mark that the fiber performed work, but only if the new state is
      // different from the current state.


      if (!objectIs(newState, hook.memoizedState)) {
        markWorkInProgressReceivedUpdate();
      }

      hook.memoizedState = newState;
      hook.baseState = newBaseState;
      hook.baseQueue = newBaseQueueLast;
      queue.lastRenderedState = newState;
    }

    var dispatch = queue.dispatch;
    return [hook.memoizedState, dispatch];
  }

  function rerenderReducer(reducer, initialArg, init) {
    var hook = updateWorkInProgressHook();
    var queue = hook.queue;

    if (!(queue !== null)) {
      {
        throw Error( "Should have a queue. This is likely a bug in React. Please file an issue." );
      }
    }

    queue.lastRenderedReducer = reducer; // This is a re-render. Apply the new render phase updates to the previous
    // work-in-progress hook.

    var dispatch = queue.dispatch;
    var lastRenderPhaseUpdate = queue.pending;
    var newState = hook.memoizedState;

    if (lastRenderPhaseUpdate !== null) {
      // The queue doesn't persist past this render pass.
      queue.pending = null;
      var firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      var update = firstRenderPhaseUpdate;

      do {
        // Process this render phase update. We don't have to check the
        // priority because it will always be the same as the current
        // render's.
        var action = update.action;
        newState = reducer(newState, action);
        update = update.next;
      } while (update !== firstRenderPhaseUpdate); // Mark that the fiber performed work, but only if the new state is
      // different from the current state.


      if (!objectIs(newState, hook.memoizedState)) {
        markWorkInProgressReceivedUpdate();
      }

      hook.memoizedState = newState; // Don't persist the state accumulated from the render phase updates to
      // the base state unless the queue is empty.
      // TODO: Not sure if this is the desired semantics, but it's what we
      // do for gDSFP. I can't remember why.

      if (hook.baseQueue === null) {
        hook.baseState = newState;
      }

      queue.lastRenderedState = newState;
    }

    return [newState, dispatch];
  }

  function mountState(initialState) {
    var hook = mountWorkInProgressHook();

    if (typeof initialState === 'function') {
      // $FlowFixMe: Flow doesn't like mixed types
      initialState = initialState();
    }

    hook.memoizedState = hook.baseState = initialState;
    var queue = hook.queue = {
      pending: null,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: initialState
    };
    var dispatch = queue.dispatch = dispatchAction.bind(null, currentlyRenderingFiber$1, queue);
    return [hook.memoizedState, dispatch];
  }

  function updateState(initialState) {
    return updateReducer(basicStateReducer);
  }

  function rerenderState(initialState) {
    return rerenderReducer(basicStateReducer);
  }

  function pushEffect(tag, create, destroy, deps) {
    var effect = {
      tag: tag,
      create: create,
      destroy: destroy,
      deps: deps,
      // Circular
      next: null
    };
    var componentUpdateQueue = currentlyRenderingFiber$1.updateQueue;

    if (componentUpdateQueue === null) {
      componentUpdateQueue = createFunctionComponentUpdateQueue();
      currentlyRenderingFiber$1.updateQueue = componentUpdateQueue;
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      var lastEffect = componentUpdateQueue.lastEffect;

      if (lastEffect === null) {
        componentUpdateQueue.lastEffect = effect.next = effect;
      } else {
        var firstEffect = lastEffect.next;
        lastEffect.next = effect;
        effect.next = firstEffect;
        componentUpdateQueue.lastEffect = effect;
      }
    }

    return effect;
  }

  function mountRef(initialValue) {
    var hook = mountWorkInProgressHook();
    var ref = {
      current: initialValue
    };

    {
      Object.seal(ref);
    }

    hook.memoizedState = ref;
    return ref;
  }

  function updateRef(initialValue) {
    var hook = updateWorkInProgressHook();
    return hook.memoizedState;
  }

  function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
    var hook = mountWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    currentlyRenderingFiber$1.effectTag |= fiberEffectTag;
    hook.memoizedState = pushEffect(HasEffect | hookEffectTag, create, undefined, nextDeps);
  }

  function updateEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
    var hook = updateWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    var destroy = undefined;

    if (currentHook !== null) {
      var prevEffect = currentHook.memoizedState;
      destroy = prevEffect.destroy;

      if (nextDeps !== null) {
        var prevDeps = prevEffect.deps;

        if (areHookInputsEqual(nextDeps, prevDeps)) {
          pushEffect(hookEffectTag, create, destroy, nextDeps);
          return;
        }
      }
    }

    currentlyRenderingFiber$1.effectTag |= fiberEffectTag;
    hook.memoizedState = pushEffect(HasEffect | hookEffectTag, create, destroy, nextDeps);
  }

  function mountEffect(create, deps) {
    {
      // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
      if ('undefined' !== typeof jest) {
        warnIfNotCurrentlyActingEffectsInDEV(currentlyRenderingFiber$1);
      }
    }

    return mountEffectImpl(Update | Passive, Passive$1, create, deps);
  }

  function updateEffect(create, deps) {
    {
      // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
      if ('undefined' !== typeof jest) {
        warnIfNotCurrentlyActingEffectsInDEV(currentlyRenderingFiber$1);
      }
    }

    return updateEffectImpl(Update | Passive, Passive$1, create, deps);
  }

  function mountLayoutEffect(create, deps) {
    return mountEffectImpl(Update, Layout, create, deps);
  }

  function updateLayoutEffect(create, deps) {
    return updateEffectImpl(Update, Layout, create, deps);
  }

  function imperativeHandleEffect(create, ref) {
    if (typeof ref === 'function') {
      var refCallback = ref;

      var _inst = create();

      refCallback(_inst);
      return function () {
        refCallback(null);
      };
    } else if (ref !== null && ref !== undefined) {
      var refObject = ref;

      {
        if (!refObject.hasOwnProperty('current')) {
          error('Expected useImperativeHandle() first argument to either be a ' + 'ref callback or React.createRef() object. Instead received: %s.', 'an object with keys {' + Object.keys(refObject).join(', ') + '}');
        }
      }

      var _inst2 = create();

      refObject.current = _inst2;
      return function () {
        refObject.current = null;
      };
    }
  }

  function mountImperativeHandle(ref, create, deps) {
    {
      if (typeof create !== 'function') {
        error('Expected useImperativeHandle() second argument to be a function ' + 'that creates a handle. Instead received: %s.', create !== null ? typeof create : 'null');
      }
    } // TODO: If deps are provided, should we skip comparing the ref itself?


    var effectDeps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
    return mountEffectImpl(Update, Layout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
  }

  function updateImperativeHandle(ref, create, deps) {
    {
      if (typeof create !== 'function') {
        error('Expected useImperativeHandle() second argument to be a function ' + 'that creates a handle. Instead received: %s.', create !== null ? typeof create : 'null');
      }
    } // TODO: If deps are provided, should we skip comparing the ref itself?


    var effectDeps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
    return updateEffectImpl(Update, Layout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
  }

  function mountDebugValue(value, formatterFn) {// This hook is normally a no-op.
    // The react-debug-hooks package injects its own implementation
    // so that e.g. DevTools can display custom hook values.
  }

  var updateDebugValue = mountDebugValue;

  function mountCallback(callback, deps) {
    var hook = mountWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    hook.memoizedState = [callback, nextDeps];
    return callback;
  }

  function updateCallback(callback, deps) {
    var hook = updateWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    var prevState = hook.memoizedState;

    if (prevState !== null) {
      if (nextDeps !== null) {
        var prevDeps = prevState[1];

        if (areHookInputsEqual(nextDeps, prevDeps)) {
          return prevState[0];
        }
      }
    }

    hook.memoizedState = [callback, nextDeps];
    return callback;
  }

  function mountMemo(nextCreate, deps) {
    var hook = mountWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    var nextValue = nextCreate();
    hook.memoizedState = [nextValue, nextDeps];
    return nextValue;
  }

  function updateMemo(nextCreate, deps) {
    var hook = updateWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;
    var prevState = hook.memoizedState;

    if (prevState !== null) {
      // Assume these are defined. If they're not, areHookInputsEqual will warn.
      if (nextDeps !== null) {
        var prevDeps = prevState[1];

        if (areHookInputsEqual(nextDeps, prevDeps)) {
          return prevState[0];
        }
      }
    }

    var nextValue = nextCreate();
    hook.memoizedState = [nextValue, nextDeps];
    return nextValue;
  }

  function mountDeferredValue(value, config) {
    var _mountState = mountState(value),
        prevValue = _mountState[0],
        setValue = _mountState[1];

    mountEffect(function () {
      var previousConfig = ReactCurrentBatchConfig$1.suspense;
      ReactCurrentBatchConfig$1.suspense = config === undefined ? null : config;

      try {
        setValue(value);
      } finally {
        ReactCurrentBatchConfig$1.suspense = previousConfig;
      }
    }, [value, config]);
    return prevValue;
  }

  function updateDeferredValue(value, config) {
    var _updateState = updateState(),
        prevValue = _updateState[0],
        setValue = _updateState[1];

    updateEffect(function () {
      var previousConfig = ReactCurrentBatchConfig$1.suspense;
      ReactCurrentBatchConfig$1.suspense = config === undefined ? null : config;

      try {
        setValue(value);
      } finally {
        ReactCurrentBatchConfig$1.suspense = previousConfig;
      }
    }, [value, config]);
    return prevValue;
  }

  function rerenderDeferredValue(value, config) {
    var _rerenderState = rerenderState(),
        prevValue = _rerenderState[0],
        setValue = _rerenderState[1];

    updateEffect(function () {
      var previousConfig = ReactCurrentBatchConfig$1.suspense;
      ReactCurrentBatchConfig$1.suspense = config === undefined ? null : config;

      try {
        setValue(value);
      } finally {
        ReactCurrentBatchConfig$1.suspense = previousConfig;
      }
    }, [value, config]);
    return prevValue;
  }

  function startTransition(setPending, config, callback) {
    var priorityLevel = getCurrentPriorityLevel();
    runWithPriority$1(priorityLevel < UserBlockingPriority$1 ? UserBlockingPriority$1 : priorityLevel, function () {
      setPending(true);
    });
    runWithPriority$1(priorityLevel > NormalPriority ? NormalPriority : priorityLevel, function () {
      var previousConfig = ReactCurrentBatchConfig$1.suspense;
      ReactCurrentBatchConfig$1.suspense = config === undefined ? null : config;

      try {
        setPending(false);
        callback();
      } finally {
        ReactCurrentBatchConfig$1.suspense = previousConfig;
      }
    });
  }

  function mountTransition(config) {
    var _mountState2 = mountState(false),
        isPending = _mountState2[0],
        setPending = _mountState2[1];

    var start = mountCallback(startTransition.bind(null, setPending, config), [setPending, config]);
    return [start, isPending];
  }

  function updateTransition(config) {
    var _updateState2 = updateState(),
        isPending = _updateState2[0],
        setPending = _updateState2[1];

    var start = updateCallback(startTransition.bind(null, setPending, config), [setPending, config]);
    return [start, isPending];
  }

  function rerenderTransition(config) {
    var _rerenderState2 = rerenderState(),
        isPending = _rerenderState2[0],
        setPending = _rerenderState2[1];

    var start = updateCallback(startTransition.bind(null, setPending, config), [setPending, config]);
    return [start, isPending];
  }

  function dispatchAction(fiber, queue, action) {
    {
      if (typeof arguments[3] === 'function') {
        error("State updates from the useState() and useReducer() Hooks don't support the " + 'second callback argument. To execute a side effect after ' + 'rendering, declare it in the component body with useEffect().');
      }
    }

    var currentTime = requestCurrentTimeForUpdate();
    var suspenseConfig = requestCurrentSuspenseConfig();
    var expirationTime = computeExpirationForFiber(currentTime, fiber, suspenseConfig);
    var update = {
      expirationTime: expirationTime,
      suspenseConfig: suspenseConfig,
      action: action,
      eagerReducer: null,
      eagerState: null,
      next: null
    };

    {
      update.priority = getCurrentPriorityLevel();
    } // Append the update to the end of the list.


    var pending = queue.pending;

    if (pending === null) {
      // This is the first update. Create a circular list.
      update.next = update;
    } else {
      update.next = pending.next;
      pending.next = update;
    }

    queue.pending = update;
    var alternate = fiber.alternate;

    if (fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1) {
      // This is a render phase update. Stash it in a lazily-created map of
      // queue -> linked list of updates. After this render pass, we'll restart
      // and apply the stashed updates on top of the work-in-progress hook.
      didScheduleRenderPhaseUpdate = true;
      update.expirationTime = renderExpirationTime;
      currentlyRenderingFiber$1.expirationTime = renderExpirationTime;
    } else {
      if (fiber.expirationTime === NoWork && (alternate === null || alternate.expirationTime === NoWork)) {
        // The queue is currently empty, which means we can eagerly compute the
        // next state before entering the render phase. If the new state is the
        // same as the current state, we may be able to bail out entirely.
        var lastRenderedReducer = queue.lastRenderedReducer;

        if (lastRenderedReducer !== null) {
          var prevDispatcher;

          {
            prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          }

          try {
            var currentState = queue.lastRenderedState;
            var eagerState = lastRenderedReducer(currentState, action); // Stash the eagerly computed state, and the reducer used to compute
            // it, on the update object. If the reducer hasn't changed by the
            // time we enter the render phase, then the eager state can be used
            // without calling the reducer again.

            update.eagerReducer = lastRenderedReducer;
            update.eagerState = eagerState;

            if (objectIs(eagerState, currentState)) {
              // Fast path. We can bail out without scheduling React to re-render.
              // It's still possible that we'll need to rebase this update later,
              // if the component re-renders for a different reason and by that
              // time the reducer has changed.
              return;
            }
          } catch (error) {// Suppress the error. It will throw again in the render phase.
          } finally {
            {
              ReactCurrentDispatcher.current = prevDispatcher;
            }
          }
        }
      }

      {
        // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
        if ('undefined' !== typeof jest) {
          warnIfNotScopedWithMatchingAct(fiber);
          warnIfNotCurrentlyActingUpdatesInDev(fiber);
        }
      }

      scheduleWork(fiber, expirationTime);
    }
  }

  var ContextOnlyDispatcher = {
    readContext: readContext,
    useCallback: throwInvalidHookError,
    useContext: throwInvalidHookError,
    useEffect: throwInvalidHookError,
    useImperativeHandle: throwInvalidHookError,
    useLayoutEffect: throwInvalidHookError,
    useMemo: throwInvalidHookError,
    useReducer: throwInvalidHookError,
    useRef: throwInvalidHookError,
    useState: throwInvalidHookError,
    useDebugValue: throwInvalidHookError,
    useResponder: throwInvalidHookError,
    useDeferredValue: throwInvalidHookError,
    useTransition: throwInvalidHookError
  };
  var HooksDispatcherOnMountInDEV = null;
  var HooksDispatcherOnMountWithHookTypesInDEV = null;
  var HooksDispatcherOnUpdateInDEV = null;
  var HooksDispatcherOnRerenderInDEV = null;
  var InvalidNestedHooksDispatcherOnMountInDEV = null;
  var InvalidNestedHooksDispatcherOnUpdateInDEV = null;
  var InvalidNestedHooksDispatcherOnRerenderInDEV = null;

  {
    var warnInvalidContextAccess = function () {
      error('Context can only be read while React is rendering. ' + 'In classes, you can read it in the render method or getDerivedStateFromProps. ' + 'In function components, you can read it directly in the function body, but not ' + 'inside Hooks like useReducer() or useMemo().');
    };

    var warnInvalidHookAccess = function () {
      error('Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. ' + 'You can only call Hooks at the top level of your React function. ' + 'For more information, see ' + 'https://fb.me/rules-of-hooks');
    };

    HooksDispatcherOnMountInDEV = {
      readContext: function (context, observedBits) {
        return readContext(context, observedBits);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = 'useCallback';
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        return mountCallback(callback, deps);
      },
      useContext: function (context, observedBits) {
        currentHookNameInDev = 'useContext';
        mountHookTypesDev();
        return readContext(context, observedBits);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = 'useEffect';
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        return mountEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = 'useImperativeHandle';
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        return mountImperativeHandle(ref, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = 'useLayoutEffect';
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        return mountLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = 'useMemo';
        mountHookTypesDev();
        checkDepsAreArrayDev(deps);
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;

        try {
          return mountMemo(create, deps);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = 'useReducer';
        mountHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;

        try {
          return mountReducer(reducer, initialArg, init);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = 'useRef';
        mountHookTypesDev();
        return mountRef(initialValue);
      },
      useState: function (initialState) {
        currentHookNameInDev = 'useState';
        mountHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;

        try {
          return mountState(initialState);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useDebugValue: function (value, formatterFn) {
        currentHookNameInDev = 'useDebugValue';
        mountHookTypesDev();
        return mountDebugValue();
      },
      useResponder: function (responder, props) {
        currentHookNameInDev = 'useResponder';
        mountHookTypesDev();
        return createDeprecatedResponderListener(responder, props);
      },
      useDeferredValue: function (value, config) {
        currentHookNameInDev = 'useDeferredValue';
        mountHookTypesDev();
        return mountDeferredValue(value, config);
      },
      useTransition: function (config) {
        currentHookNameInDev = 'useTransition';
        mountHookTypesDev();
        return mountTransition(config);
      }
    };
    HooksDispatcherOnMountWithHookTypesInDEV = {
      readContext: function (context, observedBits) {
        return readContext(context, observedBits);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = 'useCallback';
        updateHookTypesDev();
        return mountCallback(callback, deps);
      },
      useContext: function (context, observedBits) {
        currentHookNameInDev = 'useContext';
        updateHookTypesDev();
        return readContext(context, observedBits);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = 'useEffect';
        updateHookTypesDev();
        return mountEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = 'useImperativeHandle';
        updateHookTypesDev();
        return mountImperativeHandle(ref, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = 'useLayoutEffect';
        updateHookTypesDev();
        return mountLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = 'useMemo';
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;

        try {
          return mountMemo(create, deps);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = 'useReducer';
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;

        try {
          return mountReducer(reducer, initialArg, init);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = 'useRef';
        updateHookTypesDev();
        return mountRef(initialValue);
      },
      useState: function (initialState) {
        currentHookNameInDev = 'useState';
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;

        try {
          return mountState(initialState);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useDebugValue: function (value, formatterFn) {
        currentHookNameInDev = 'useDebugValue';
        updateHookTypesDev();
        return mountDebugValue();
      },
      useResponder: function (responder, props) {
        currentHookNameInDev = 'useResponder';
        updateHookTypesDev();
        return createDeprecatedResponderListener(responder, props);
      },
      useDeferredValue: function (value, config) {
        currentHookNameInDev = 'useDeferredValue';
        updateHookTypesDev();
        return mountDeferredValue(value, config);
      },
      useTransition: function (config) {
        currentHookNameInDev = 'useTransition';
        updateHookTypesDev();
        return mountTransition(config);
      }
    };
    HooksDispatcherOnUpdateInDEV = {
      readContext: function (context, observedBits) {
        return readContext(context, observedBits);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = 'useCallback';
        updateHookTypesDev();
        return updateCallback(callback, deps);
      },
      useContext: function (context, observedBits) {
        currentHookNameInDev = 'useContext';
        updateHookTypesDev();
        return readContext(context, observedBits);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = 'useEffect';
        updateHookTypesDev();
        return updateEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = 'useImperativeHandle';
        updateHookTypesDev();
        return updateImperativeHandle(ref, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = 'useLayoutEffect';
        updateHookTypesDev();
        return updateLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = 'useMemo';
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

        try {
          return updateMemo(create, deps);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = 'useReducer';
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

        try {
          return updateReducer(reducer, initialArg, init);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = 'useRef';
        updateHookTypesDev();
        return updateRef();
      },
      useState: function (initialState) {
        currentHookNameInDev = 'useState';
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

        try {
          return updateState(initialState);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useDebugValue: function (value, formatterFn) {
        currentHookNameInDev = 'useDebugValue';
        updateHookTypesDev();
        return updateDebugValue();
      },
      useResponder: function (responder, props) {
        currentHookNameInDev = 'useResponder';
        updateHookTypesDev();
        return createDeprecatedResponderListener(responder, props);
      },
      useDeferredValue: function (value, config) {
        currentHookNameInDev = 'useDeferredValue';
        updateHookTypesDev();
        return updateDeferredValue(value, config);
      },
      useTransition: function (config) {
        currentHookNameInDev = 'useTransition';
        updateHookTypesDev();
        return updateTransition(config);
      }
    };
    HooksDispatcherOnRerenderInDEV = {
      readContext: function (context, observedBits) {
        return readContext(context, observedBits);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = 'useCallback';
        updateHookTypesDev();
        return updateCallback(callback, deps);
      },
      useContext: function (context, observedBits) {
        currentHookNameInDev = 'useContext';
        updateHookTypesDev();
        return readContext(context, observedBits);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = 'useEffect';
        updateHookTypesDev();
        return updateEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = 'useImperativeHandle';
        updateHookTypesDev();
        return updateImperativeHandle(ref, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = 'useLayoutEffect';
        updateHookTypesDev();
        return updateLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = 'useMemo';
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnRerenderInDEV;

        try {
          return updateMemo(create, deps);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = 'useReducer';
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnRerenderInDEV;

        try {
          return rerenderReducer(reducer, initialArg, init);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = 'useRef';
        updateHookTypesDev();
        return updateRef();
      },
      useState: function (initialState) {
        currentHookNameInDev = 'useState';
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnRerenderInDEV;

        try {
          return rerenderState(initialState);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useDebugValue: function (value, formatterFn) {
        currentHookNameInDev = 'useDebugValue';
        updateHookTypesDev();
        return updateDebugValue();
      },
      useResponder: function (responder, props) {
        currentHookNameInDev = 'useResponder';
        updateHookTypesDev();
        return createDeprecatedResponderListener(responder, props);
      },
      useDeferredValue: function (value, config) {
        currentHookNameInDev = 'useDeferredValue';
        updateHookTypesDev();
        return rerenderDeferredValue(value, config);
      },
      useTransition: function (config) {
        currentHookNameInDev = 'useTransition';
        updateHookTypesDev();
        return rerenderTransition(config);
      }
    };
    InvalidNestedHooksDispatcherOnMountInDEV = {
      readContext: function (context, observedBits) {
        warnInvalidContextAccess();
        return readContext(context, observedBits);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = 'useCallback';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountCallback(callback, deps);
      },
      useContext: function (context, observedBits) {
        currentHookNameInDev = 'useContext';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return readContext(context, observedBits);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = 'useEffect';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = 'useImperativeHandle';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountImperativeHandle(ref, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = 'useLayoutEffect';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = 'useMemo';
        warnInvalidHookAccess();
        mountHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;

        try {
          return mountMemo(create, deps);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = 'useReducer';
        warnInvalidHookAccess();
        mountHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;

        try {
          return mountReducer(reducer, initialArg, init);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = 'useRef';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountRef(initialValue);
      },
      useState: function (initialState) {
        currentHookNameInDev = 'useState';
        warnInvalidHookAccess();
        mountHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;

        try {
          return mountState(initialState);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useDebugValue: function (value, formatterFn) {
        currentHookNameInDev = 'useDebugValue';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountDebugValue();
      },
      useResponder: function (responder, props) {
        currentHookNameInDev = 'useResponder';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return createDeprecatedResponderListener(responder, props);
      },
      useDeferredValue: function (value, config) {
        currentHookNameInDev = 'useDeferredValue';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountDeferredValue(value, config);
      },
      useTransition: function (config) {
        currentHookNameInDev = 'useTransition';
        warnInvalidHookAccess();
        mountHookTypesDev();
        return mountTransition(config);
      }
    };
    InvalidNestedHooksDispatcherOnUpdateInDEV = {
      readContext: function (context, observedBits) {
        warnInvalidContextAccess();
        return readContext(context, observedBits);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = 'useCallback';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateCallback(callback, deps);
      },
      useContext: function (context, observedBits) {
        currentHookNameInDev = 'useContext';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return readContext(context, observedBits);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = 'useEffect';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = 'useImperativeHandle';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateImperativeHandle(ref, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = 'useLayoutEffect';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = 'useMemo';
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

        try {
          return updateMemo(create, deps);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = 'useReducer';
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

        try {
          return updateReducer(reducer, initialArg, init);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = 'useRef';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateRef();
      },
      useState: function (initialState) {
        currentHookNameInDev = 'useState';
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

        try {
          return updateState(initialState);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useDebugValue: function (value, formatterFn) {
        currentHookNameInDev = 'useDebugValue';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateDebugValue();
      },
      useResponder: function (responder, props) {
        currentHookNameInDev = 'useResponder';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return createDeprecatedResponderListener(responder, props);
      },
      useDeferredValue: function (value, config) {
        currentHookNameInDev = 'useDeferredValue';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateDeferredValue(value, config);
      },
      useTransition: function (config) {
        currentHookNameInDev = 'useTransition';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateTransition(config);
      }
    };
    InvalidNestedHooksDispatcherOnRerenderInDEV = {
      readContext: function (context, observedBits) {
        warnInvalidContextAccess();
        return readContext(context, observedBits);
      },
      useCallback: function (callback, deps) {
        currentHookNameInDev = 'useCallback';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateCallback(callback, deps);
      },
      useContext: function (context, observedBits) {
        currentHookNameInDev = 'useContext';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return readContext(context, observedBits);
      },
      useEffect: function (create, deps) {
        currentHookNameInDev = 'useEffect';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateEffect(create, deps);
      },
      useImperativeHandle: function (ref, create, deps) {
        currentHookNameInDev = 'useImperativeHandle';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateImperativeHandle(ref, create, deps);
      },
      useLayoutEffect: function (create, deps) {
        currentHookNameInDev = 'useLayoutEffect';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateLayoutEffect(create, deps);
      },
      useMemo: function (create, deps) {
        currentHookNameInDev = 'useMemo';
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

        try {
          return updateMemo(create, deps);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useReducer: function (reducer, initialArg, init) {
        currentHookNameInDev = 'useReducer';
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

        try {
          return rerenderReducer(reducer, initialArg, init);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useRef: function (initialValue) {
        currentHookNameInDev = 'useRef';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateRef();
      },
      useState: function (initialState) {
        currentHookNameInDev = 'useState';
        warnInvalidHookAccess();
        updateHookTypesDev();
        var prevDispatcher = ReactCurrentDispatcher.current;
        ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;

        try {
          return rerenderState(initialState);
        } finally {
          ReactCurrentDispatcher.current = prevDispatcher;
        }
      },
      useDebugValue: function (value, formatterFn) {
        currentHookNameInDev = 'useDebugValue';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return updateDebugValue();
      },
      useResponder: function (responder, props) {
        currentHookNameInDev = 'useResponder';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return createDeprecatedResponderListener(responder, props);
      },
      useDeferredValue: function (value, config) {
        currentHookNameInDev = 'useDeferredValue';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return rerenderDeferredValue(value, config);
      },
      useTransition: function (config) {
        currentHookNameInDev = 'useTransition';
        warnInvalidHookAccess();
        updateHookTypesDev();
        return rerenderTransition(config);
      }
    };
  }

  var now$1 = unstable_now;
  var commitTime = 0;
  var profilerStartTime = -1;

  function getCommitTime() {
    return commitTime;
  }

  function recordCommitTime() {

    commitTime = now$1();
  }

  function startProfilerTimer(fiber) {

    profilerStartTime = now$1();

    if (fiber.actualStartTime < 0) {
      fiber.actualStartTime = now$1();
    }
  }

  function stopProfilerTimerIfRunning(fiber) {

    profilerStartTime = -1;
  }

  function stopProfilerTimerIfRunningAndRecordDelta(fiber, overrideBaseTime) {

    if (profilerStartTime >= 0) {
      var elapsedTime = now$1() - profilerStartTime;
      fiber.actualDuration += elapsedTime;

      if (overrideBaseTime) {
        fiber.selfBaseDuration = elapsedTime;
      }

      profilerStartTime = -1;
    }
  }

  // This may have been an insertion or a hydration.

  var hydrationParentFiber = null;
  var nextHydratableInstance = null;
  var isHydrating = false;

  function enterHydrationState(fiber) {

    var parentInstance = fiber.stateNode.containerInfo;
    nextHydratableInstance = getFirstHydratableChild(parentInstance);
    hydrationParentFiber = fiber;
    isHydrating = true;
    return true;
  }

  function deleteHydratableInstance(returnFiber, instance) {
    {
      switch (returnFiber.tag) {
        case HostRoot:
          didNotHydrateContainerInstance(returnFiber.stateNode.containerInfo, instance);
          break;

        case HostComponent:
          didNotHydrateInstance(returnFiber.type, returnFiber.memoizedProps, returnFiber.stateNode, instance);
          break;
      }
    }

    var childToDelete = createFiberFromHostInstanceForDeletion();
    childToDelete.stateNode = instance;
    childToDelete.return = returnFiber;
    childToDelete.effectTag = Deletion; // This might seem like it belongs on progressedFirstDeletion. However,
    // these children are not part of the reconciliation list of children.
    // Even if we abort and rereconcile the children, that will try to hydrate
    // again and the nodes are still in the host tree so these will be
    // recreated.

    if (returnFiber.lastEffect !== null) {
      returnFiber.lastEffect.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
  }

  function insertNonHydratedInstance(returnFiber, fiber) {
    fiber.effectTag = fiber.effectTag & ~Hydrating | Placement;

    {
      switch (returnFiber.tag) {
        case HostRoot:
          {
            var parentContainer = returnFiber.stateNode.containerInfo;

            switch (fiber.tag) {
              case HostComponent:
                var type = fiber.type;
                var props = fiber.pendingProps;
                didNotFindHydratableContainerInstance(parentContainer, type);
                break;

              case HostText:
                var text = fiber.pendingProps;
                didNotFindHydratableContainerTextInstance(parentContainer, text);
                break;
            }

            break;
          }

        case HostComponent:
          {
            var parentType = returnFiber.type;
            var parentProps = returnFiber.memoizedProps;
            var parentInstance = returnFiber.stateNode;

            switch (fiber.tag) {
              case HostComponent:
                var _type = fiber.type;
                var _props = fiber.pendingProps;
                didNotFindHydratableInstance(parentType, parentProps, parentInstance, _type);
                break;

              case HostText:
                var _text = fiber.pendingProps;
                didNotFindHydratableTextInstance(parentType, parentProps, parentInstance, _text);
                break;

              case SuspenseComponent:
                didNotFindHydratableSuspenseInstance(parentType, parentProps);
                break;
            }

            break;
          }

        default:
          return;
      }
    }
  }

  function tryHydrate(fiber, nextInstance) {
    switch (fiber.tag) {
      case HostComponent:
        {
          var type = fiber.type;
          var props = fiber.pendingProps;
          var instance = canHydrateInstance(nextInstance, type);

          if (instance !== null) {
            fiber.stateNode = instance;
            return true;
          }

          return false;
        }

      case HostText:
        {
          var text = fiber.pendingProps;
          var textInstance = canHydrateTextInstance(nextInstance, text);

          if (textInstance !== null) {
            fiber.stateNode = textInstance;
            return true;
          }

          return false;
        }

      case SuspenseComponent:
        {

          return false;
        }

      default:
        return false;
    }
  }

  function tryToClaimNextHydratableInstance(fiber) {
    if (!isHydrating) {
      return;
    }

    var nextInstance = nextHydratableInstance;

    if (!nextInstance) {
      // Nothing to hydrate. Make it an insertion.
      insertNonHydratedInstance(hydrationParentFiber, fiber);
      isHydrating = false;
      hydrationParentFiber = fiber;
      return;
    }

    var firstAttemptedInstance = nextInstance;

    if (!tryHydrate(fiber, nextInstance)) {
      // If we can't hydrate this instance let's try the next one.
      // We use this as a heuristic. It's based on intuition and not data so it
      // might be flawed or unnecessary.
      nextInstance = getNextHydratableSibling(firstAttemptedInstance);

      if (!nextInstance || !tryHydrate(fiber, nextInstance)) {
        // Nothing to hydrate. Make it an insertion.
        insertNonHydratedInstance(hydrationParentFiber, fiber);
        isHydrating = false;
        hydrationParentFiber = fiber;
        return;
      } // We matched the next one, we'll now assume that the first one was
      // superfluous and we'll delete it. Since we can't eagerly delete it
      // we'll have to schedule a deletion. To do that, this node needs a dummy
      // fiber associated with it.


      deleteHydratableInstance(hydrationParentFiber, firstAttemptedInstance);
    }

    hydrationParentFiber = fiber;
    nextHydratableInstance = getFirstHydratableChild(nextInstance);
  }

  function prepareToHydrateHostInstance(fiber, rootContainerInstance, hostContext) {

    var instance = fiber.stateNode;
    var updatePayload = hydrateInstance(instance, fiber.type, fiber.memoizedProps, rootContainerInstance, hostContext, fiber); // TODO: Type this specific to this type of component.

    fiber.updateQueue = updatePayload; // If the update payload indicates that there is a change or if there
    // is a new ref we mark this as an update.

    if (updatePayload !== null) {
      return true;
    }

    return false;
  }

  function prepareToHydrateHostTextInstance(fiber) {

    var textInstance = fiber.stateNode;
    var textContent = fiber.memoizedProps;
    var shouldUpdate = hydrateTextInstance(textInstance, textContent, fiber);

    {
      if (shouldUpdate) {
        // We assume that prepareToHydrateHostTextInstance is called in a context where the
        // hydration parent is the parent host component of this host text.
        var returnFiber = hydrationParentFiber;

        if (returnFiber !== null) {
          switch (returnFiber.tag) {
            case HostRoot:
              {
                var parentContainer = returnFiber.stateNode.containerInfo;
                didNotMatchHydratedContainerTextInstance(parentContainer, textInstance, textContent);
                break;
              }

            case HostComponent:
              {
                var parentType = returnFiber.type;
                var parentProps = returnFiber.memoizedProps;
                var parentInstance = returnFiber.stateNode;
                didNotMatchHydratedTextInstance(parentType, parentProps, parentInstance, textInstance, textContent);
                break;
              }
          }
        }
      }
    }

    return shouldUpdate;
  }

  function skipPastDehydratedSuspenseInstance(fiber) {

    var suspenseState = fiber.memoizedState;
    var suspenseInstance = suspenseState !== null ? suspenseState.dehydrated : null;

    if (!suspenseInstance) {
      {
        throw Error( "Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue." );
      }
    }

    return getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance);
  }

  function popToNextHostParent(fiber) {
    var parent = fiber.return;

    while (parent !== null && parent.tag !== HostComponent && parent.tag !== HostRoot && parent.tag !== SuspenseComponent) {
      parent = parent.return;
    }

    hydrationParentFiber = parent;
  }

  function popHydrationState(fiber) {

    if (fiber !== hydrationParentFiber) {
      // We're deeper than the current hydration context, inside an inserted
      // tree.
      return false;
    }

    if (!isHydrating) {
      // If we're not currently hydrating but we're in a hydration context, then
      // we were an insertion and now need to pop up reenter hydration of our
      // siblings.
      popToNextHostParent(fiber);
      isHydrating = true;
      return false;
    }

    var type = fiber.type; // If we have any remaining hydratable nodes, we need to delete them now.
    // We only do this deeper than head and body since they tend to have random
    // other nodes in them. We also ignore components with pure text content in
    // side of them.
    // TODO: Better heuristic.

    if (fiber.tag !== HostComponent || type !== 'head' && type !== 'body' && !shouldSetTextContent(type, fiber.memoizedProps)) {
      var nextInstance = nextHydratableInstance;

      while (nextInstance) {
        deleteHydratableInstance(fiber, nextInstance);
        nextInstance = getNextHydratableSibling(nextInstance);
      }
    }

    popToNextHostParent(fiber);

    if (fiber.tag === SuspenseComponent) {
      nextHydratableInstance = skipPastDehydratedSuspenseInstance(fiber);
    } else {
      nextHydratableInstance = hydrationParentFiber ? getNextHydratableSibling(fiber.stateNode) : null;
    }

    return true;
  }

  function resetHydrationState() {

    hydrationParentFiber = null;
    nextHydratableInstance = null;
    isHydrating = false;
  }

  var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
  var didReceiveUpdate = false;
  var didWarnAboutBadClass;
  var didWarnAboutModulePatternComponent;
  var didWarnAboutContextTypeOnFunctionComponent;
  var didWarnAboutGetDerivedStateOnFunctionComponent;
  var didWarnAboutFunctionRefs;
  var didWarnAboutReassigningProps;
  var didWarnAboutRevealOrder;
  var didWarnAboutTailOptions;

  {
    didWarnAboutBadClass = {};
    didWarnAboutModulePatternComponent = {};
    didWarnAboutContextTypeOnFunctionComponent = {};
    didWarnAboutGetDerivedStateOnFunctionComponent = {};
    didWarnAboutFunctionRefs = {};
    didWarnAboutReassigningProps = false;
    didWarnAboutRevealOrder = {};
    didWarnAboutTailOptions = {};
  }

  function reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime) {
    if (current === null) {
      // If this is a fresh new component that hasn't been rendered yet, we
      // won't update its child set by applying minimal side-effects. Instead,
      // we will add them all to the child before it gets rendered. That means
      // we can optimize this reconciliation pass by not tracking side-effects.
      workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
    } else {
      // If the current child is the same as the work in progress, it means that
      // we haven't yet started any work on these children. Therefore, we use
      // the clone algorithm to create a copy of all the current children.
      // If we had any progressed work already, that is invalid at this point so
      // let's throw it out.
      workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderExpirationTime);
    }
  }

  function forceUnmountCurrentAndReconcile(current, workInProgress, nextChildren, renderExpirationTime) {
    // This function is fork of reconcileChildren. It's used in cases where we
    // want to reconcile without matching against the existing set. This has the
    // effect of all current children being unmounted; even if the type and key
    // are the same, the old child is unmounted and a new child is created.
    //
    // To do this, we're going to go through the reconcile algorithm twice. In
    // the first pass, we schedule a deletion for all the current children by
    // passing null.
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, null, renderExpirationTime); // In the second pass, we mount the new children. The trick here is that we
    // pass null in place of where we usually pass the current child set. This has
    // the effect of remounting all children regardless of whether their
    // identities match.

    workInProgress.child = reconcileChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
  }

  function updateForwardRef(current, workInProgress, Component, nextProps, renderExpirationTime) {
    // TODO: current can be non-null here even if the component
    // hasn't yet mounted. This happens after the first render suspends.
    // We'll need to figure out if this is fine or can cause issues.
    {
      if (workInProgress.type !== workInProgress.elementType) {
        // Lazy component props can't be validated in createElement
        // because they're only guaranteed to be resolved here.
        var innerPropTypes = Component.propTypes;

        if (innerPropTypes) {
          checkPropTypes_1(innerPropTypes, nextProps, // Resolved props
          'prop', getComponentName(Component), getCurrentFiberStackInDev);
        }
      }
    }

    var render = Component.render;
    var ref = workInProgress.ref; // The rest is a fork of updateFunctionComponent

    var nextChildren;
    prepareToReadContext(workInProgress, renderExpirationTime);

    {
      ReactCurrentOwner$1.current = workInProgress;
      setIsRendering(true);
      nextChildren = renderWithHooks(current, workInProgress, render, nextProps, ref, renderExpirationTime);

      if ( workInProgress.mode & StrictMode) {
        // Only double-render components with Hooks
        if (workInProgress.memoizedState !== null) {
          nextChildren = renderWithHooks(current, workInProgress, render, nextProps, ref, renderExpirationTime);
        }
      }

      setIsRendering(false);
    }

    if (current !== null && !didReceiveUpdate) {
      bailoutHooks(current, workInProgress, renderExpirationTime);
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
    } // React DevTools reads this flag.


    workInProgress.effectTag |= PerformedWork;
    reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
  }

  function updateMemoComponent(current, workInProgress, Component, nextProps, updateExpirationTime, renderExpirationTime) {
    if (current === null) {
      var type = Component.type;

      if (isSimpleFunctionComponent(type) && Component.compare === null && // SimpleMemoComponent codepath doesn't resolve outer props either.
      Component.defaultProps === undefined) {
        var resolvedType = type;

        {
          resolvedType = resolveFunctionForHotReloading(type);
        } // If this is a plain function component without default props,
        // and with only the default shallow comparison, we upgrade it
        // to a SimpleMemoComponent to allow fast path updates.


        workInProgress.tag = SimpleMemoComponent;
        workInProgress.type = resolvedType;

        {
          validateFunctionComponentInDev(workInProgress, type);
        }

        return updateSimpleMemoComponent(current, workInProgress, resolvedType, nextProps, updateExpirationTime, renderExpirationTime);
      }

      {
        var innerPropTypes = type.propTypes;

        if (innerPropTypes) {
          // Inner memo component props aren't currently validated in createElement.
          // We could move it there, but we'd still need this for lazy code path.
          checkPropTypes_1(innerPropTypes, nextProps, // Resolved props
          'prop', getComponentName(type), getCurrentFiberStackInDev);
        }
      }

      var child = createFiberFromTypeAndProps(Component.type, null, nextProps, null, workInProgress.mode, renderExpirationTime);
      child.ref = workInProgress.ref;
      child.return = workInProgress;
      workInProgress.child = child;
      return child;
    }

    {
      var _type = Component.type;
      var _innerPropTypes = _type.propTypes;

      if (_innerPropTypes) {
        // Inner memo component props aren't currently validated in createElement.
        // We could move it there, but we'd still need this for lazy code path.
        checkPropTypes_1(_innerPropTypes, nextProps, // Resolved props
        'prop', getComponentName(_type), getCurrentFiberStackInDev);
      }
    }

    var currentChild = current.child; // This is always exactly one child

    if (updateExpirationTime < renderExpirationTime) {
      // This will be the props with resolved defaultProps,
      // unlike current.memoizedProps which will be the unresolved ones.
      var prevProps = currentChild.memoizedProps; // Default to shallow comparison

      var compare = Component.compare;
      compare = compare !== null ? compare : shallowEqual;

      if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
      }
    } // React DevTools reads this flag.


    workInProgress.effectTag |= PerformedWork;
    var newChild = createWorkInProgress(currentChild, nextProps);
    newChild.ref = workInProgress.ref;
    newChild.return = workInProgress;
    workInProgress.child = newChild;
    return newChild;
  }

  function updateSimpleMemoComponent(current, workInProgress, Component, nextProps, updateExpirationTime, renderExpirationTime) {
    // TODO: current can be non-null here even if the component
    // hasn't yet mounted. This happens when the inner render suspends.
    // We'll need to figure out if this is fine or can cause issues.
    {
      if (workInProgress.type !== workInProgress.elementType) {
        // Lazy component props can't be validated in createElement
        // because they're only guaranteed to be resolved here.
        var outerMemoType = workInProgress.elementType;

        if (outerMemoType.$$typeof === REACT_LAZY_TYPE) {
          // We warn when you define propTypes on lazy()
          // so let's just skip over it to find memo() outer wrapper.
          // Inner props for memo are validated later.
          outerMemoType = refineResolvedLazyComponent(outerMemoType);
        }

        var outerPropTypes = outerMemoType && outerMemoType.propTypes;

        if (outerPropTypes) {
          checkPropTypes_1(outerPropTypes, nextProps, // Resolved (SimpleMemoComponent has no defaultProps)
          'prop', getComponentName(outerMemoType), getCurrentFiberStackInDev);
        } // Inner propTypes will be validated in the function component path.

      }
    }

    if (current !== null) {
      var prevProps = current.memoizedProps;

      if (shallowEqual(prevProps, nextProps) && current.ref === workInProgress.ref && ( // Prevent bailout if the implementation changed due to hot reload.
       workInProgress.type === current.type )) {
        didReceiveUpdate = false;

        if (updateExpirationTime < renderExpirationTime) {
          // The pending update priority was cleared at the beginning of
          // beginWork. We're about to bail out, but there might be additional
          // updates at a lower priority. Usually, the priority level of the
          // remaining updates is accumlated during the evaluation of the
          // component (i.e. when processing the update queue). But since since
          // we're bailing out early *without* evaluating the component, we need
          // to account for it here, too. Reset to the value of the current fiber.
          // NOTE: This only applies to SimpleMemoComponent, not MemoComponent,
          // because a MemoComponent fiber does not have hooks or an update queue;
          // rather, it wraps around an inner component, which may or may not
          // contains hooks.
          // TODO: Move the reset at in beginWork out of the common path so that
          // this is no longer necessary.
          workInProgress.expirationTime = current.expirationTime;
          return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
        }
      }
    }

    return updateFunctionComponent(current, workInProgress, Component, nextProps, renderExpirationTime);
  }

  function updateFragment(current, workInProgress, renderExpirationTime) {
    var nextChildren = workInProgress.pendingProps;
    reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
  }

  function updateMode(current, workInProgress, renderExpirationTime) {
    var nextChildren = workInProgress.pendingProps.children;
    reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
  }

  function updateProfiler(current, workInProgress, renderExpirationTime) {
    {
      workInProgress.effectTag |= Update;
    }

    var nextProps = workInProgress.pendingProps;
    var nextChildren = nextProps.children;
    reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
  }

  function markRef(current, workInProgress) {
    var ref = workInProgress.ref;

    if (current === null && ref !== null || current !== null && current.ref !== ref) {
      // Schedule a Ref effect
      workInProgress.effectTag |= Ref;
    }
  }

  function updateFunctionComponent(current, workInProgress, Component, nextProps, renderExpirationTime) {
    {
      if (workInProgress.type !== workInProgress.elementType) {
        // Lazy component props can't be validated in createElement
        // because they're only guaranteed to be resolved here.
        var innerPropTypes = Component.propTypes;

        if (innerPropTypes) {
          checkPropTypes_1(innerPropTypes, nextProps, // Resolved props
          'prop', getComponentName(Component), getCurrentFiberStackInDev);
        }
      }
    }

    var context;

    {
      var unmaskedContext = getUnmaskedContext(workInProgress, Component, true);
      context = getMaskedContext(workInProgress, unmaskedContext);
    }

    var nextChildren;
    prepareToReadContext(workInProgress, renderExpirationTime);

    {
      ReactCurrentOwner$1.current = workInProgress;
      setIsRendering(true);
      nextChildren = renderWithHooks(current, workInProgress, Component, nextProps, context, renderExpirationTime);

      if ( workInProgress.mode & StrictMode) {
        // Only double-render components with Hooks
        if (workInProgress.memoizedState !== null) {
          nextChildren = renderWithHooks(current, workInProgress, Component, nextProps, context, renderExpirationTime);
        }
      }

      setIsRendering(false);
    }

    if (current !== null && !didReceiveUpdate) {
      bailoutHooks(current, workInProgress, renderExpirationTime);
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
    } // React DevTools reads this flag.


    workInProgress.effectTag |= PerformedWork;
    reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
  }

  function updateClassComponent(current, workInProgress, Component, nextProps, renderExpirationTime) {
    {
      if (workInProgress.type !== workInProgress.elementType) {
        // Lazy component props can't be validated in createElement
        // because they're only guaranteed to be resolved here.
        var innerPropTypes = Component.propTypes;

        if (innerPropTypes) {
          checkPropTypes_1(innerPropTypes, nextProps, // Resolved props
          'prop', getComponentName(Component), getCurrentFiberStackInDev);
        }
      }
    } // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.


    var hasContext;

    if (isContextProvider(Component)) {
      hasContext = true;
      pushContextProvider(workInProgress);
    } else {
      hasContext = false;
    }

    prepareToReadContext(workInProgress, renderExpirationTime);
    var instance = workInProgress.stateNode;
    var shouldUpdate;

    if (instance === null) {
      if (current !== null) {
        // A class component without an instance only mounts if it suspended
        // inside a non-concurrent tree, in an inconsistent state. We want to
        // treat it like a new mount, even though an empty version of it already
        // committed. Disconnect the alternate pointers.
        current.alternate = null;
        workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

        workInProgress.effectTag |= Placement;
      } // In the initial pass we might need to construct the instance.


      constructClassInstance(workInProgress, Component, nextProps);
      mountClassInstance(workInProgress, Component, nextProps, renderExpirationTime);
      shouldUpdate = true;
    } else if (current === null) {
      // In a resume, we'll already have an instance we can reuse.
      shouldUpdate = resumeMountClassInstance(workInProgress, Component, nextProps, renderExpirationTime);
    } else {
      shouldUpdate = updateClassInstance(current, workInProgress, Component, nextProps, renderExpirationTime);
    }

    var nextUnitOfWork = finishClassComponent(current, workInProgress, Component, shouldUpdate, hasContext, renderExpirationTime);

    {
      var inst = workInProgress.stateNode;

      if (inst.props !== nextProps) {
        if (!didWarnAboutReassigningProps) {
          error('It looks like %s is reassigning its own `this.props` while rendering. ' + 'This is not supported and can lead to confusing bugs.', getComponentName(workInProgress.type) || 'a component');
        }

        didWarnAboutReassigningProps = true;
      }
    }

    return nextUnitOfWork;
  }

  function finishClassComponent(current, workInProgress, Component, shouldUpdate, hasContext, renderExpirationTime) {
    // Refs should update even if shouldComponentUpdate returns false
    markRef(current, workInProgress);
    var didCaptureError = (workInProgress.effectTag & DidCapture) !== NoEffect;

    if (!shouldUpdate && !didCaptureError) {
      // Context providers should defer to sCU for rendering
      if (hasContext) {
        invalidateContextProvider(workInProgress, Component, false);
      }

      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
    }

    var instance = workInProgress.stateNode; // Rerender

    ReactCurrentOwner$1.current = workInProgress;
    var nextChildren;

    if (didCaptureError && typeof Component.getDerivedStateFromError !== 'function') {
      // If we captured an error, but getDerivedStateFromError is not defined,
      // unmount all the children. componentDidCatch will schedule an update to
      // re-render a fallback. This is temporary until we migrate everyone to
      // the new API.
      // TODO: Warn in a future release.
      nextChildren = null;

      {
        stopProfilerTimerIfRunning();
      }
    } else {
      {
        setIsRendering(true);
        nextChildren = instance.render();

        if ( workInProgress.mode & StrictMode) {
          instance.render();
        }

        setIsRendering(false);
      }
    } // React DevTools reads this flag.


    workInProgress.effectTag |= PerformedWork;

    if (current !== null && didCaptureError) {
      // If we're recovering from an error, reconcile without reusing any of
      // the existing children. Conceptually, the normal children and the children
      // that are shown on error are two different sets, so we shouldn't reuse
      // normal children even if their identities match.
      forceUnmountCurrentAndReconcile(current, workInProgress, nextChildren, renderExpirationTime);
    } else {
      reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    } // Memoize state using the values we just used to render.
    // TODO: Restructure so we never read values from the instance.


    workInProgress.memoizedState = instance.state; // The context might have changed so we need to recalculate it.

    if (hasContext) {
      invalidateContextProvider(workInProgress, Component, true);
    }

    return workInProgress.child;
  }

  function pushHostRootContext(workInProgress) {
    var root = workInProgress.stateNode;

    if (root.pendingContext) {
      pushTopLevelContextObject(workInProgress, root.pendingContext, root.pendingContext !== root.context);
    } else if (root.context) {
      // Should always be set
      pushTopLevelContextObject(workInProgress, root.context, false);
    }

    pushHostContainer(workInProgress, root.containerInfo);
  }

  function updateHostRoot(current, workInProgress, renderExpirationTime) {
    pushHostRootContext(workInProgress);
    var updateQueue = workInProgress.updateQueue;

    if (!(current !== null && updateQueue !== null)) {
      {
        throw Error( "If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue." );
      }
    }

    var nextProps = workInProgress.pendingProps;
    var prevState = workInProgress.memoizedState;
    var prevChildren = prevState !== null ? prevState.element : null;
    cloneUpdateQueue(current, workInProgress);
    processUpdateQueue(workInProgress, nextProps, null, renderExpirationTime);
    var nextState = workInProgress.memoizedState; // Caution: React DevTools currently depends on this property
    // being called "element".

    var nextChildren = nextState.element;

    if (nextChildren === prevChildren) {
      // If the state is the same as before, that's a bailout because we had
      // no work that expires at this time.
      resetHydrationState();
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
    }

    var root = workInProgress.stateNode;

    if (root.hydrate && enterHydrationState(workInProgress)) {
      // If we don't have any current children this might be the first pass.
      // We always try to hydrate. If this isn't a hydration pass there won't
      // be any children to hydrate which is effectively the same thing as
      // not hydrating.
      var child = mountChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
      workInProgress.child = child;
      var node = child;

      while (node) {
        // Mark each child as hydrating. This is a fast path to know whether this
        // tree is part of a hydrating tree. This is used to determine if a child
        // node has fully mounted yet, and for scheduling event replaying.
        // Conceptually this is similar to Placement in that a new subtree is
        // inserted into the React tree here. It just happens to not need DOM
        // mutations because it already exists.
        node.effectTag = node.effectTag & ~Placement | Hydrating;
        node = node.sibling;
      }
    } else {
      // Otherwise reset hydration state in case we aborted and resumed another
      // root.
      reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
      resetHydrationState();
    }

    return workInProgress.child;
  }

  function updateHostComponent(current, workInProgress, renderExpirationTime) {
    pushHostContext(workInProgress);

    if (current === null) {
      tryToClaimNextHydratableInstance(workInProgress);
    }

    var type = workInProgress.type;
    var nextProps = workInProgress.pendingProps;
    var prevProps = current !== null ? current.memoizedProps : null;
    var nextChildren = nextProps.children;
    var isDirectTextChild = shouldSetTextContent(type, nextProps);

    if (isDirectTextChild) {
      // We special case a direct text child of a host node. This is a common
      // case. We won't handle it as a reified child. We will instead handle
      // this in the host environment that also has access to this prop. That
      // avoids allocating another HostText fiber and traversing it.
      nextChildren = null;
    } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
      // If we're switching from a direct text child to a normal child, or to
      // empty, we need to schedule the text content to be reset.
      workInProgress.effectTag |= ContentReset;
    }

    markRef(current, workInProgress); // Check the host config to see if the children are offscreen/hidden.

    if (workInProgress.mode & ConcurrentMode && renderExpirationTime !== Never && shouldDeprioritizeSubtree(type, nextProps)) {
      {
        markSpawnedWork(Never);
      } // Schedule this fiber to re-render at offscreen priority. Then bailout.


      workInProgress.expirationTime = workInProgress.childExpirationTime = Never;
      return null;
    }

    reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
  }

  function updateHostText(current, workInProgress) {
    if (current === null) {
      tryToClaimNextHydratableInstance(workInProgress);
    } // Nothing to do here. This is terminal. We'll do the completion step
    // immediately after.


    return null;
  }

  function mountLazyComponent(_current, workInProgress, elementType, updateExpirationTime, renderExpirationTime) {
    if (_current !== null) {
      // A lazy component only mounts if it suspended inside a non-
      // concurrent tree, in an inconsistent state. We want to treat it like
      // a new mount, even though an empty version of it already committed.
      // Disconnect the alternate pointers.
      _current.alternate = null;
      workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

      workInProgress.effectTag |= Placement;
    }

    var props = workInProgress.pendingProps; // We can't start a User Timing measurement with correct label yet.
    // Cancel and resume right after we know the tag.

    cancelWorkTimer(workInProgress);
    var Component = readLazyComponentType(elementType); // Store the unwrapped component in the type.

    workInProgress.type = Component;
    var resolvedTag = workInProgress.tag = resolveLazyComponentTag(Component);
    startWorkTimer(workInProgress);
    var resolvedProps = resolveDefaultProps(Component, props);
    var child;

    switch (resolvedTag) {
      case FunctionComponent:
        {
          {
            validateFunctionComponentInDev(workInProgress, Component);
            workInProgress.type = Component = resolveFunctionForHotReloading(Component);
          }

          child = updateFunctionComponent(null, workInProgress, Component, resolvedProps, renderExpirationTime);
          return child;
        }

      case ClassComponent:
        {
          {
            workInProgress.type = Component = resolveClassForHotReloading(Component);
          }

          child = updateClassComponent(null, workInProgress, Component, resolvedProps, renderExpirationTime);
          return child;
        }

      case ForwardRef:
        {
          {
            workInProgress.type = Component = resolveForwardRefForHotReloading(Component);
          }

          child = updateForwardRef(null, workInProgress, Component, resolvedProps, renderExpirationTime);
          return child;
        }

      case MemoComponent:
        {
          {
            if (workInProgress.type !== workInProgress.elementType) {
              var outerPropTypes = Component.propTypes;

              if (outerPropTypes) {
                checkPropTypes_1(outerPropTypes, resolvedProps, // Resolved for outer only
                'prop', getComponentName(Component), getCurrentFiberStackInDev);
              }
            }
          }

          child = updateMemoComponent(null, workInProgress, Component, resolveDefaultProps(Component.type, resolvedProps), // The inner type can have defaults too
          updateExpirationTime, renderExpirationTime);
          return child;
        }
    }

    var hint = '';

    {
      if (Component !== null && typeof Component === 'object' && Component.$$typeof === REACT_LAZY_TYPE) {
        hint = ' Did you wrap a component in React.lazy() more than once?';
      }
    } // This message intentionally doesn't mention ForwardRef or MemoComponent
    // because the fact that it's a separate type of work is an
    // implementation detail.


    {
      {
        throw Error( "Element type is invalid. Received a promise that resolves to: " + Component + ". Lazy element type must resolve to a class or function." + hint );
      }
    }
  }

  function mountIncompleteClassComponent(_current, workInProgress, Component, nextProps, renderExpirationTime) {
    if (_current !== null) {
      // An incomplete component only mounts if it suspended inside a non-
      // concurrent tree, in an inconsistent state. We want to treat it like
      // a new mount, even though an empty version of it already committed.
      // Disconnect the alternate pointers.
      _current.alternate = null;
      workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

      workInProgress.effectTag |= Placement;
    } // Promote the fiber to a class and try rendering again.


    workInProgress.tag = ClassComponent; // The rest of this function is a fork of `updateClassComponent`
    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.

    var hasContext;

    if (isContextProvider(Component)) {
      hasContext = true;
      pushContextProvider(workInProgress);
    } else {
      hasContext = false;
    }

    prepareToReadContext(workInProgress, renderExpirationTime);
    constructClassInstance(workInProgress, Component, nextProps);
    mountClassInstance(workInProgress, Component, nextProps, renderExpirationTime);
    return finishClassComponent(null, workInProgress, Component, true, hasContext, renderExpirationTime);
  }

  function mountIndeterminateComponent(_current, workInProgress, Component, renderExpirationTime) {
    if (_current !== null) {
      // An indeterminate component only mounts if it suspended inside a non-
      // concurrent tree, in an inconsistent state. We want to treat it like
      // a new mount, even though an empty version of it already committed.
      // Disconnect the alternate pointers.
      _current.alternate = null;
      workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

      workInProgress.effectTag |= Placement;
    }

    var props = workInProgress.pendingProps;
    var context;

    {
      var unmaskedContext = getUnmaskedContext(workInProgress, Component, false);
      context = getMaskedContext(workInProgress, unmaskedContext);
    }

    prepareToReadContext(workInProgress, renderExpirationTime);
    var value;

    {
      if (Component.prototype && typeof Component.prototype.render === 'function') {
        var componentName = getComponentName(Component) || 'Unknown';

        if (!didWarnAboutBadClass[componentName]) {
          error("The <%s /> component appears to have a render method, but doesn't extend React.Component. " + 'This is likely to cause errors. Change %s to extend React.Component instead.', componentName, componentName);

          didWarnAboutBadClass[componentName] = true;
        }
      }

      if (workInProgress.mode & StrictMode) {
        ReactStrictModeWarnings.recordLegacyContextWarning(workInProgress, null);
      }

      setIsRendering(true);
      ReactCurrentOwner$1.current = workInProgress;
      value = renderWithHooks(null, workInProgress, Component, props, context, renderExpirationTime);
      setIsRendering(false);
    } // React DevTools reads this flag.


    workInProgress.effectTag |= PerformedWork;

    if (typeof value === 'object' && value !== null && typeof value.render === 'function' && value.$$typeof === undefined) {
      {
        var _componentName = getComponentName(Component) || 'Unknown';

        if (!didWarnAboutModulePatternComponent[_componentName]) {
          error('The <%s /> component appears to be a function component that returns a class instance. ' + 'Change %s to a class that extends React.Component instead. ' + "If you can't use a class try assigning the prototype on the function as a workaround. " + "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " + 'cannot be called with `new` by React.', _componentName, _componentName, _componentName);

          didWarnAboutModulePatternComponent[_componentName] = true;
        }
      } // Proceed under the assumption that this is a class instance


      workInProgress.tag = ClassComponent; // Throw out any hooks that were used.

      workInProgress.memoizedState = null;
      workInProgress.updateQueue = null; // Push context providers early to prevent context stack mismatches.
      // During mounting we don't know the child context yet as the instance doesn't exist.
      // We will invalidate the child context in finishClassComponent() right after rendering.

      var hasContext = false;

      if (isContextProvider(Component)) {
        hasContext = true;
        pushContextProvider(workInProgress);
      } else {
        hasContext = false;
      }

      workInProgress.memoizedState = value.state !== null && value.state !== undefined ? value.state : null;
      initializeUpdateQueue(workInProgress);
      var getDerivedStateFromProps = Component.getDerivedStateFromProps;

      if (typeof getDerivedStateFromProps === 'function') {
        applyDerivedStateFromProps(workInProgress, Component, getDerivedStateFromProps, props);
      }

      adoptClassInstance(workInProgress, value);
      mountClassInstance(workInProgress, Component, props, renderExpirationTime);
      return finishClassComponent(null, workInProgress, Component, true, hasContext, renderExpirationTime);
    } else {
      // Proceed under the assumption that this is a function component
      workInProgress.tag = FunctionComponent;

      {

        if ( workInProgress.mode & StrictMode) {
          // Only double-render components with Hooks
          if (workInProgress.memoizedState !== null) {
            value = renderWithHooks(null, workInProgress, Component, props, context, renderExpirationTime);
          }
        }
      }

      reconcileChildren(null, workInProgress, value, renderExpirationTime);

      {
        validateFunctionComponentInDev(workInProgress, Component);
      }

      return workInProgress.child;
    }
  }

  function validateFunctionComponentInDev(workInProgress, Component) {
    {
      if (Component) {
        if (Component.childContextTypes) {
          error('%s(...): childContextTypes cannot be defined on a function component.', Component.displayName || Component.name || 'Component');
        }
      }

      if (workInProgress.ref !== null) {
        var info = '';
        var ownerName = getCurrentFiberOwnerNameInDevOrNull();

        if (ownerName) {
          info += '\n\nCheck the render method of `' + ownerName + '`.';
        }

        var warningKey = ownerName || workInProgress._debugID || '';
        var debugSource = workInProgress._debugSource;

        if (debugSource) {
          warningKey = debugSource.fileName + ':' + debugSource.lineNumber;
        }

        if (!didWarnAboutFunctionRefs[warningKey]) {
          didWarnAboutFunctionRefs[warningKey] = true;

          error('Function components cannot be given refs. ' + 'Attempts to access this ref will fail. ' + 'Did you mean to use React.forwardRef()?%s', info);
        }
      }

      if (typeof Component.getDerivedStateFromProps === 'function') {
        var _componentName2 = getComponentName(Component) || 'Unknown';

        if (!didWarnAboutGetDerivedStateOnFunctionComponent[_componentName2]) {
          error('%s: Function components do not support getDerivedStateFromProps.', _componentName2);

          didWarnAboutGetDerivedStateOnFunctionComponent[_componentName2] = true;
        }
      }

      if (typeof Component.contextType === 'object' && Component.contextType !== null) {
        var _componentName3 = getComponentName(Component) || 'Unknown';

        if (!didWarnAboutContextTypeOnFunctionComponent[_componentName3]) {
          error('%s: Function components do not support contextType.', _componentName3);

          didWarnAboutContextTypeOnFunctionComponent[_componentName3] = true;
        }
      }
    }
  }

  var SUSPENDED_MARKER = {
    dehydrated: null,
    retryTime: NoWork
  };

  function shouldRemainOnFallback(suspenseContext, current, workInProgress) {
    // If the context is telling us that we should show a fallback, and we're not
    // already showing content, then we should show the fallback instead.
    return hasSuspenseContext(suspenseContext, ForceSuspenseFallback) && (current === null || current.memoizedState !== null);
  }

  function updateSuspenseComponent(current, workInProgress, renderExpirationTime) {
    var mode = workInProgress.mode;
    var nextProps = workInProgress.pendingProps; // This is used by DevTools to force a boundary to suspend.

    {
      if (shouldSuspend(workInProgress)) {
        workInProgress.effectTag |= DidCapture;
      }
    }

    var suspenseContext = suspenseStackCursor.current;
    var nextDidTimeout = false;
    var didSuspend = (workInProgress.effectTag & DidCapture) !== NoEffect;

    if (didSuspend || shouldRemainOnFallback(suspenseContext, current)) {
      // Something in this boundary's subtree already suspended. Switch to
      // rendering the fallback children.
      nextDidTimeout = true;
      workInProgress.effectTag &= ~DidCapture;
    } else {
      // Attempting the main content
      if (current === null || current.memoizedState !== null) {
        // This is a new mount or this boundary is already showing a fallback state.
        // Mark this subtree context as having at least one invisible parent that could
        // handle the fallback state.
        // Boundaries without fallbacks or should be avoided are not considered since
        // they cannot handle preferred fallback states.
        if (nextProps.fallback !== undefined && nextProps.unstable_avoidThisFallback !== true) {
          suspenseContext = addSubtreeSuspenseContext(suspenseContext, InvisibleParentSuspenseContext);
        }
      }
    }

    suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
    pushSuspenseContext(workInProgress, suspenseContext); // This next part is a bit confusing. If the children timeout, we switch to
    // showing the fallback children in place of the "primary" children.
    // However, we don't want to delete the primary children because then their
    // state will be lost (both the React state and the host state, e.g.
    // uncontrolled form inputs). Instead we keep them mounted and hide them.
    // Both the fallback children AND the primary children are rendered at the
    // same time. Once the primary children are un-suspended, we can delete
    // the fallback children — don't need to preserve their state.
    //
    // The two sets of children are siblings in the host environment, but
    // semantically, for purposes of reconciliation, they are two separate sets.
    // So we store them using two fragment fibers.
    //
    // However, we want to avoid allocating extra fibers for every placeholder.
    // They're only necessary when the children time out, because that's the
    // only time when both sets are mounted.
    //
    // So, the extra fragment fibers are only used if the children time out.
    // Otherwise, we render the primary children directly. This requires some
    // custom reconciliation logic to preserve the state of the primary
    // children. It's essentially a very basic form of re-parenting.

    if (current === null) {
      // If we're currently hydrating, try to hydrate this boundary.
      // But only if this has a fallback.
      if (nextProps.fallback !== undefined) {
        tryToClaimNextHydratableInstance(workInProgress); // This could've been a dehydrated suspense component.
      } // This is the initial mount. This branch is pretty simple because there's
      // no previous state that needs to be preserved.


      if (nextDidTimeout) {
        // Mount separate fragments for primary and fallback children.
        var nextFallbackChildren = nextProps.fallback;
        var primaryChildFragment = createFiberFromFragment(null, mode, NoWork, null);
        primaryChildFragment.return = workInProgress;

        if ((workInProgress.mode & BlockingMode) === NoMode) {
          // Outside of blocking mode, we commit the effects from the
          // partially completed, timed-out tree, too.
          var progressedState = workInProgress.memoizedState;
          var progressedPrimaryChild = progressedState !== null ? workInProgress.child.child : workInProgress.child;
          primaryChildFragment.child = progressedPrimaryChild;
          var progressedChild = progressedPrimaryChild;

          while (progressedChild !== null) {
            progressedChild.return = primaryChildFragment;
            progressedChild = progressedChild.sibling;
          }
        }

        var fallbackChildFragment = createFiberFromFragment(nextFallbackChildren, mode, renderExpirationTime, null);
        fallbackChildFragment.return = workInProgress;
        primaryChildFragment.sibling = fallbackChildFragment; // Skip the primary children, and continue working on the
        // fallback children.

        workInProgress.memoizedState = SUSPENDED_MARKER;
        workInProgress.child = primaryChildFragment;
        return fallbackChildFragment;
      } else {
        // Mount the primary children without an intermediate fragment fiber.
        var nextPrimaryChildren = nextProps.children;
        workInProgress.memoizedState = null;
        return workInProgress.child = mountChildFibers(workInProgress, null, nextPrimaryChildren, renderExpirationTime);
      }
    } else {
      // This is an update. This branch is more complicated because we need to
      // ensure the state of the primary children is preserved.
      var prevState = current.memoizedState;

      if (prevState !== null) {
        // wrapped in a fragment fiber.


        var currentPrimaryChildFragment = current.child;
        var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;

        if (nextDidTimeout) {
          // Still timed out. Reuse the current primary children by cloning
          // its fragment. We're going to skip over these entirely.
          var _nextFallbackChildren2 = nextProps.fallback;

          var _primaryChildFragment2 = createWorkInProgress(currentPrimaryChildFragment, currentPrimaryChildFragment.pendingProps);

          _primaryChildFragment2.return = workInProgress;

          if ((workInProgress.mode & BlockingMode) === NoMode) {
            // Outside of blocking mode, we commit the effects from the
            // partially completed, timed-out tree, too.
            var _progressedState = workInProgress.memoizedState;

            var _progressedPrimaryChild = _progressedState !== null ? workInProgress.child.child : workInProgress.child;

            if (_progressedPrimaryChild !== currentPrimaryChildFragment.child) {
              _primaryChildFragment2.child = _progressedPrimaryChild;
              var _progressedChild2 = _progressedPrimaryChild;

              while (_progressedChild2 !== null) {
                _progressedChild2.return = _primaryChildFragment2;
                _progressedChild2 = _progressedChild2.sibling;
              }
            }
          } // Because primaryChildFragment is a new fiber that we're inserting as the
          // parent of a new tree, we need to set its treeBaseDuration.


          if ( workInProgress.mode & ProfileMode) {
            // treeBaseDuration is the sum of all the child tree base durations.
            var _treeBaseDuration = 0;
            var _hiddenChild = _primaryChildFragment2.child;

            while (_hiddenChild !== null) {
              _treeBaseDuration += _hiddenChild.treeBaseDuration;
              _hiddenChild = _hiddenChild.sibling;
            }

            _primaryChildFragment2.treeBaseDuration = _treeBaseDuration;
          } // Clone the fallback child fragment, too. These we'll continue
          // working on.


          var _fallbackChildFragment2 = createWorkInProgress(currentFallbackChildFragment, _nextFallbackChildren2);

          _fallbackChildFragment2.return = workInProgress;
          _primaryChildFragment2.sibling = _fallbackChildFragment2;
          _primaryChildFragment2.childExpirationTime = NoWork; // Skip the primary children, and continue working on the
          // fallback children.

          workInProgress.memoizedState = SUSPENDED_MARKER;
          workInProgress.child = _primaryChildFragment2;
          return _fallbackChildFragment2;
        } else {
          // No longer suspended. Switch back to showing the primary children,
          // and remove the intermediate fragment fiber.
          var _nextPrimaryChildren = nextProps.children;
          var currentPrimaryChild = currentPrimaryChildFragment.child;
          var primaryChild = reconcileChildFibers(workInProgress, currentPrimaryChild, _nextPrimaryChildren, renderExpirationTime); // If this render doesn't suspend, we need to delete the fallback
          // children. Wait until the complete phase, after we've confirmed the
          // fallback is no longer needed.
          // TODO: Would it be better to store the fallback fragment on
          // the stateNode?
          // Continue rendering the children, like we normally do.

          workInProgress.memoizedState = null;
          return workInProgress.child = primaryChild;
        }
      } else {
        // The current tree has not already timed out. That means the primary
        // children are not wrapped in a fragment fiber.
        var _currentPrimaryChild = current.child;

        if (nextDidTimeout) {
          // Timed out. Wrap the children in a fragment fiber to keep them
          // separate from the fallback children.
          var _nextFallbackChildren3 = nextProps.fallback;

          var _primaryChildFragment3 = createFiberFromFragment( // It shouldn't matter what the pending props are because we aren't
          // going to render this fragment.
          null, mode, NoWork, null);

          _primaryChildFragment3.return = workInProgress;
          _primaryChildFragment3.child = _currentPrimaryChild;

          if (_currentPrimaryChild !== null) {
            _currentPrimaryChild.return = _primaryChildFragment3;
          } // Even though we're creating a new fiber, there are no new children,
          // because we're reusing an already mounted tree. So we don't need to
          // schedule a placement.
          // primaryChildFragment.effectTag |= Placement;


          if ((workInProgress.mode & BlockingMode) === NoMode) {
            // Outside of blocking mode, we commit the effects from the
            // partially completed, timed-out tree, too.
            var _progressedState2 = workInProgress.memoizedState;

            var _progressedPrimaryChild2 = _progressedState2 !== null ? workInProgress.child.child : workInProgress.child;

            _primaryChildFragment3.child = _progressedPrimaryChild2;
            var _progressedChild3 = _progressedPrimaryChild2;

            while (_progressedChild3 !== null) {
              _progressedChild3.return = _primaryChildFragment3;
              _progressedChild3 = _progressedChild3.sibling;
            }
          } // Because primaryChildFragment is a new fiber that we're inserting as the
          // parent of a new tree, we need to set its treeBaseDuration.


          if ( workInProgress.mode & ProfileMode) {
            // treeBaseDuration is the sum of all the child tree base durations.
            var _treeBaseDuration2 = 0;
            var _hiddenChild2 = _primaryChildFragment3.child;

            while (_hiddenChild2 !== null) {
              _treeBaseDuration2 += _hiddenChild2.treeBaseDuration;
              _hiddenChild2 = _hiddenChild2.sibling;
            }

            _primaryChildFragment3.treeBaseDuration = _treeBaseDuration2;
          } // Create a fragment from the fallback children, too.


          var _fallbackChildFragment3 = createFiberFromFragment(_nextFallbackChildren3, mode, renderExpirationTime, null);

          _fallbackChildFragment3.return = workInProgress;
          _primaryChildFragment3.sibling = _fallbackChildFragment3;
          _fallbackChildFragment3.effectTag |= Placement;
          _primaryChildFragment3.childExpirationTime = NoWork; // Skip the primary children, and continue working on the
          // fallback children.

          workInProgress.memoizedState = SUSPENDED_MARKER;
          workInProgress.child = _primaryChildFragment3;
          return _fallbackChildFragment3;
        } else {
          // Still haven't timed out. Continue rendering the children, like we
          // normally do.
          workInProgress.memoizedState = null;
          var _nextPrimaryChildren2 = nextProps.children;
          return workInProgress.child = reconcileChildFibers(workInProgress, _currentPrimaryChild, _nextPrimaryChildren2, renderExpirationTime);
        }
      }
    }
  }

  function scheduleWorkOnFiber(fiber, renderExpirationTime) {
    if (fiber.expirationTime < renderExpirationTime) {
      fiber.expirationTime = renderExpirationTime;
    }

    var alternate = fiber.alternate;

    if (alternate !== null && alternate.expirationTime < renderExpirationTime) {
      alternate.expirationTime = renderExpirationTime;
    }

    scheduleWorkOnParentPath(fiber.return, renderExpirationTime);
  }

  function propagateSuspenseContextChange(workInProgress, firstChild, renderExpirationTime) {
    // Mark any Suspense boundaries with fallbacks as having work to do.
    // If they were previously forced into fallbacks, they may now be able
    // to unblock.
    var node = firstChild;

    while (node !== null) {
      if (node.tag === SuspenseComponent) {
        var state = node.memoizedState;

        if (state !== null) {
          scheduleWorkOnFiber(node, renderExpirationTime);
        }
      } else if (node.tag === SuspenseListComponent) {
        // If the tail is hidden there might not be an Suspense boundaries
        // to schedule work on. In this case we have to schedule it on the
        // list itself.
        // We don't have to traverse to the children of the list since
        // the list will propagate the change when it rerenders.
        scheduleWorkOnFiber(node, renderExpirationTime);
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }

      if (node === workInProgress) {
        return;
      }

      while (node.sibling === null) {
        if (node.return === null || node.return === workInProgress) {
          return;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function findLastContentRow(firstChild) {
    // This is going to find the last row among these children that is already
    // showing content on the screen, as opposed to being in fallback state or
    // new. If a row has multiple Suspense boundaries, any of them being in the
    // fallback state, counts as the whole row being in a fallback state.
    // Note that the "rows" will be workInProgress, but any nested children
    // will still be current since we haven't rendered them yet. The mounted
    // order may not be the same as the new order. We use the new order.
    var row = firstChild;
    var lastContentRow = null;

    while (row !== null) {
      var currentRow = row.alternate; // New rows can't be content rows.

      if (currentRow !== null && findFirstSuspended(currentRow) === null) {
        lastContentRow = row;
      }

      row = row.sibling;
    }

    return lastContentRow;
  }

  function validateRevealOrder(revealOrder) {
    {
      if (revealOrder !== undefined && revealOrder !== 'forwards' && revealOrder !== 'backwards' && revealOrder !== 'together' && !didWarnAboutRevealOrder[revealOrder]) {
        didWarnAboutRevealOrder[revealOrder] = true;

        if (typeof revealOrder === 'string') {
          switch (revealOrder.toLowerCase()) {
            case 'together':
            case 'forwards':
            case 'backwards':
              {
                error('"%s" is not a valid value for revealOrder on <SuspenseList />. ' + 'Use lowercase "%s" instead.', revealOrder, revealOrder.toLowerCase());

                break;
              }

            case 'forward':
            case 'backward':
              {
                error('"%s" is not a valid value for revealOrder on <SuspenseList />. ' + 'React uses the -s suffix in the spelling. Use "%ss" instead.', revealOrder, revealOrder.toLowerCase());

                break;
              }

            default:
              error('"%s" is not a supported revealOrder on <SuspenseList />. ' + 'Did you mean "together", "forwards" or "backwards"?', revealOrder);

              break;
          }
        } else {
          error('%s is not a supported value for revealOrder on <SuspenseList />. ' + 'Did you mean "together", "forwards" or "backwards"?', revealOrder);
        }
      }
    }
  }

  function validateTailOptions(tailMode, revealOrder) {
    {
      if (tailMode !== undefined && !didWarnAboutTailOptions[tailMode]) {
        if (tailMode !== 'collapsed' && tailMode !== 'hidden') {
          didWarnAboutTailOptions[tailMode] = true;

          error('"%s" is not a supported value for tail on <SuspenseList />. ' + 'Did you mean "collapsed" or "hidden"?', tailMode);
        } else if (revealOrder !== 'forwards' && revealOrder !== 'backwards') {
          didWarnAboutTailOptions[tailMode] = true;

          error('<SuspenseList tail="%s" /> is only valid if revealOrder is ' + '"forwards" or "backwards". ' + 'Did you mean to specify revealOrder="forwards"?', tailMode);
        }
      }
    }
  }

  function validateSuspenseListNestedChild(childSlot, index) {
    {
      var isArray = Array.isArray(childSlot);
      var isIterable = !isArray && typeof getIteratorFn(childSlot) === 'function';

      if (isArray || isIterable) {
        var type = isArray ? 'array' : 'iterable';

        error('A nested %s was passed to row #%s in <SuspenseList />. Wrap it in ' + 'an additional SuspenseList to configure its revealOrder: ' + '<SuspenseList revealOrder=...> ... ' + '<SuspenseList revealOrder=...>{%s}</SuspenseList> ... ' + '</SuspenseList>', type, index, type);

        return false;
      }
    }

    return true;
  }

  function validateSuspenseListChildren(children, revealOrder) {
    {
      if ((revealOrder === 'forwards' || revealOrder === 'backwards') && children !== undefined && children !== null && children !== false) {
        if (Array.isArray(children)) {
          for (var i = 0; i < children.length; i++) {
            if (!validateSuspenseListNestedChild(children[i], i)) {
              return;
            }
          }
        } else {
          var iteratorFn = getIteratorFn(children);

          if (typeof iteratorFn === 'function') {
            var childrenIterator = iteratorFn.call(children);

            if (childrenIterator) {
              var step = childrenIterator.next();
              var _i = 0;

              for (; !step.done; step = childrenIterator.next()) {
                if (!validateSuspenseListNestedChild(step.value, _i)) {
                  return;
                }

                _i++;
              }
            }
          } else {
            error('A single row was passed to a <SuspenseList revealOrder="%s" />. ' + 'This is not useful since it needs multiple rows. ' + 'Did you mean to pass multiple children or an array?', revealOrder);
          }
        }
      }
    }
  }

  function initSuspenseListRenderState(workInProgress, isBackwards, tail, lastContentRow, tailMode, lastEffectBeforeRendering) {
    var renderState = workInProgress.memoizedState;

    if (renderState === null) {
      workInProgress.memoizedState = {
        isBackwards: isBackwards,
        rendering: null,
        renderingStartTime: 0,
        last: lastContentRow,
        tail: tail,
        tailExpiration: 0,
        tailMode: tailMode,
        lastEffect: lastEffectBeforeRendering
      };
    } else {
      // We can reuse the existing object from previous renders.
      renderState.isBackwards = isBackwards;
      renderState.rendering = null;
      renderState.renderingStartTime = 0;
      renderState.last = lastContentRow;
      renderState.tail = tail;
      renderState.tailExpiration = 0;
      renderState.tailMode = tailMode;
      renderState.lastEffect = lastEffectBeforeRendering;
    }
  } // This can end up rendering this component multiple passes.
  // The first pass splits the children fibers into two sets. A head and tail.
  // We first render the head. If anything is in fallback state, we do another
  // pass through beginWork to rerender all children (including the tail) with
  // the force suspend context. If the first render didn't have anything in
  // in fallback state. Then we render each row in the tail one-by-one.
  // That happens in the completeWork phase without going back to beginWork.


  function updateSuspenseListComponent(current, workInProgress, renderExpirationTime) {
    var nextProps = workInProgress.pendingProps;
    var revealOrder = nextProps.revealOrder;
    var tailMode = nextProps.tail;
    var newChildren = nextProps.children;
    validateRevealOrder(revealOrder);
    validateTailOptions(tailMode, revealOrder);
    validateSuspenseListChildren(newChildren, revealOrder);
    reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
    var suspenseContext = suspenseStackCursor.current;
    var shouldForceFallback = hasSuspenseContext(suspenseContext, ForceSuspenseFallback);

    if (shouldForceFallback) {
      suspenseContext = setShallowSuspenseContext(suspenseContext, ForceSuspenseFallback);
      workInProgress.effectTag |= DidCapture;
    } else {
      var didSuspendBefore = current !== null && (current.effectTag & DidCapture) !== NoEffect;

      if (didSuspendBefore) {
        // If we previously forced a fallback, we need to schedule work
        // on any nested boundaries to let them know to try to render
        // again. This is the same as context updating.
        propagateSuspenseContextChange(workInProgress, workInProgress.child, renderExpirationTime);
      }

      suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
    }

    pushSuspenseContext(workInProgress, suspenseContext);

    if ((workInProgress.mode & BlockingMode) === NoMode) {
      // Outside of blocking mode, SuspenseList doesn't work so we just
      // use make it a noop by treating it as the default revealOrder.
      workInProgress.memoizedState = null;
    } else {
      switch (revealOrder) {
        case 'forwards':
          {
            var lastContentRow = findLastContentRow(workInProgress.child);
            var tail;

            if (lastContentRow === null) {
              // The whole list is part of the tail.
              // TODO: We could fast path by just rendering the tail now.
              tail = workInProgress.child;
              workInProgress.child = null;
            } else {
              // Disconnect the tail rows after the content row.
              // We're going to render them separately later.
              tail = lastContentRow.sibling;
              lastContentRow.sibling = null;
            }

            initSuspenseListRenderState(workInProgress, false, // isBackwards
            tail, lastContentRow, tailMode, workInProgress.lastEffect);
            break;
          }

        case 'backwards':
          {
            // We're going to find the first row that has existing content.
            // At the same time we're going to reverse the list of everything
            // we pass in the meantime. That's going to be our tail in reverse
            // order.
            var _tail = null;
            var row = workInProgress.child;
            workInProgress.child = null;

            while (row !== null) {
              var currentRow = row.alternate; // New rows can't be content rows.

              if (currentRow !== null && findFirstSuspended(currentRow) === null) {
                // This is the beginning of the main content.
                workInProgress.child = row;
                break;
              }

              var nextRow = row.sibling;
              row.sibling = _tail;
              _tail = row;
              row = nextRow;
            } // TODO: If workInProgress.child is null, we can continue on the tail immediately.


            initSuspenseListRenderState(workInProgress, true, // isBackwards
            _tail, null, // last
            tailMode, workInProgress.lastEffect);
            break;
          }

        case 'together':
          {
            initSuspenseListRenderState(workInProgress, false, // isBackwards
            null, // tail
            null, // last
            undefined, workInProgress.lastEffect);
            break;
          }

        default:
          {
            // The default reveal order is the same as not having
            // a boundary.
            workInProgress.memoizedState = null;
          }
      }
    }

    return workInProgress.child;
  }

  function updatePortalComponent(current, workInProgress, renderExpirationTime) {
    pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
    var nextChildren = workInProgress.pendingProps;

    if (current === null) {
      // Portals are special because we don't append the children during mount
      // but at commit. Therefore we need to track insertions which the normal
      // flow doesn't do during mount. This doesn't happen at the root because
      // the root always starts with a "current" with a null child.
      // TODO: Consider unifying this with how the root works.
      workInProgress.child = reconcileChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
    } else {
      reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    }

    return workInProgress.child;
  }

  function updateContextProvider(current, workInProgress, renderExpirationTime) {
    var providerType = workInProgress.type;
    var context = providerType._context;
    var newProps = workInProgress.pendingProps;
    var oldProps = workInProgress.memoizedProps;
    var newValue = newProps.value;

    {
      var providerPropTypes = workInProgress.type.propTypes;

      if (providerPropTypes) {
        checkPropTypes_1(providerPropTypes, newProps, 'prop', 'Context.Provider', getCurrentFiberStackInDev);
      }
    }

    pushProvider(workInProgress, newValue);

    if (oldProps !== null) {
      var oldValue = oldProps.value;
      var changedBits = calculateChangedBits(context, newValue, oldValue);

      if (changedBits === 0) {
        // No change. Bailout early if children are the same.
        if (oldProps.children === newProps.children && !hasContextChanged()) {
          return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
        }
      } else {
        // The context value changed. Search for matching consumers and schedule
        // them to update.
        propagateContextChange(workInProgress, context, changedBits, renderExpirationTime);
      }
    }

    var newChildren = newProps.children;
    reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
    return workInProgress.child;
  }

  var hasWarnedAboutUsingContextAsConsumer = false;

  function updateContextConsumer(current, workInProgress, renderExpirationTime) {
    var context = workInProgress.type; // The logic below for Context differs depending on PROD or DEV mode. In
    // DEV mode, we create a separate object for Context.Consumer that acts
    // like a proxy to Context. This proxy object adds unnecessary code in PROD
    // so we use the old behaviour (Context.Consumer references Context) to
    // reduce size and overhead. The separate object references context via
    // a property called "_context", which also gives us the ability to check
    // in DEV mode if this property exists or not and warn if it does not.

    {
      if (context._context === undefined) {
        // This may be because it's a Context (rather than a Consumer).
        // Or it may be because it's older React where they're the same thing.
        // We only want to warn if we're sure it's a new React.
        if (context !== context.Consumer) {
          if (!hasWarnedAboutUsingContextAsConsumer) {
            hasWarnedAboutUsingContextAsConsumer = true;

            error('Rendering <Context> directly is not supported and will be removed in ' + 'a future major release. Did you mean to render <Context.Consumer> instead?');
          }
        }
      } else {
        context = context._context;
      }
    }

    var newProps = workInProgress.pendingProps;
    var render = newProps.children;

    {
      if (typeof render !== 'function') {
        error('A context consumer was rendered with multiple children, or a child ' + "that isn't a function. A context consumer expects a single child " + 'that is a function. If you did pass a function, make sure there ' + 'is no trailing or leading whitespace around it.');
      }
    }

    prepareToReadContext(workInProgress, renderExpirationTime);
    var newValue = readContext(context, newProps.unstable_observedBits);
    var newChildren;

    {
      ReactCurrentOwner$1.current = workInProgress;
      setIsRendering(true);
      newChildren = render(newValue);
      setIsRendering(false);
    } // React DevTools reads this flag.


    workInProgress.effectTag |= PerformedWork;
    reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
    return workInProgress.child;
  }

  function markWorkInProgressReceivedUpdate() {
    didReceiveUpdate = true;
  }

  function bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime) {
    cancelWorkTimer(workInProgress);

    if (current !== null) {
      // Reuse previous dependencies
      workInProgress.dependencies = current.dependencies;
    }

    {
      // Don't update "base" render times for bailouts.
      stopProfilerTimerIfRunning();
    }

    var updateExpirationTime = workInProgress.expirationTime;

    if (updateExpirationTime !== NoWork) {
      markUnprocessedUpdateTime(updateExpirationTime);
    } // Check if the children have any pending work.


    var childExpirationTime = workInProgress.childExpirationTime;

    if (childExpirationTime < renderExpirationTime) {
      // The children don't have any work either. We can skip them.
      // TODO: Once we add back resuming, we should check if the children are
      // a work-in-progress set. If so, we need to transfer their effects.
      return null;
    } else {
      // This fiber doesn't have work, but its subtree does. Clone the child
      // fibers and continue.
      cloneChildFibers(current, workInProgress);
      return workInProgress.child;
    }
  }

  function remountFiber(current, oldWorkInProgress, newWorkInProgress) {
    {
      var returnFiber = oldWorkInProgress.return;

      if (returnFiber === null) {
        throw new Error('Cannot swap the root fiber.');
      } // Disconnect from the old current.
      // It will get deleted.


      current.alternate = null;
      oldWorkInProgress.alternate = null; // Connect to the new tree.

      newWorkInProgress.index = oldWorkInProgress.index;
      newWorkInProgress.sibling = oldWorkInProgress.sibling;
      newWorkInProgress.return = oldWorkInProgress.return;
      newWorkInProgress.ref = oldWorkInProgress.ref; // Replace the child/sibling pointers above it.

      if (oldWorkInProgress === returnFiber.child) {
        returnFiber.child = newWorkInProgress;
      } else {
        var prevSibling = returnFiber.child;

        if (prevSibling === null) {
          throw new Error('Expected parent to have a child.');
        }

        while (prevSibling.sibling !== oldWorkInProgress) {
          prevSibling = prevSibling.sibling;

          if (prevSibling === null) {
            throw new Error('Expected to find the previous sibling.');
          }
        }

        prevSibling.sibling = newWorkInProgress;
      } // Delete the old fiber and place the new one.
      // Since the old fiber is disconnected, we have to schedule it manually.


      var last = returnFiber.lastEffect;

      if (last !== null) {
        last.nextEffect = current;
        returnFiber.lastEffect = current;
      } else {
        returnFiber.firstEffect = returnFiber.lastEffect = current;
      }

      current.nextEffect = null;
      current.effectTag = Deletion;
      newWorkInProgress.effectTag |= Placement; // Restart work from the new fiber.

      return newWorkInProgress;
    }
  }

  function beginWork(current, workInProgress, renderExpirationTime) {
    var updateExpirationTime = workInProgress.expirationTime;

    {
      if (workInProgress._debugNeedsRemount && current !== null) {
        // This will restart the begin phase with a new fiber.
        return remountFiber(current, workInProgress, createFiberFromTypeAndProps(workInProgress.type, workInProgress.key, workInProgress.pendingProps, workInProgress._debugOwner || null, workInProgress.mode, workInProgress.expirationTime));
      }
    }

    if (current !== null) {
      var oldProps = current.memoizedProps;
      var newProps = workInProgress.pendingProps;

      if (oldProps !== newProps || hasContextChanged() || ( // Force a re-render if the implementation changed due to hot reload:
       workInProgress.type !== current.type )) {
        // If props or context changed, mark the fiber as having performed work.
        // This may be unset if the props are determined to be equal later (memo).
        didReceiveUpdate = true;
      } else if (updateExpirationTime < renderExpirationTime) {
        didReceiveUpdate = false; // This fiber does not have any pending work. Bailout without entering
        // the begin phase. There's still some bookkeeping we that needs to be done
        // in this optimized path, mostly pushing stuff onto the stack.

        switch (workInProgress.tag) {
          case HostRoot:
            pushHostRootContext(workInProgress);
            resetHydrationState();
            break;

          case HostComponent:
            pushHostContext(workInProgress);

            if (workInProgress.mode & ConcurrentMode && renderExpirationTime !== Never && shouldDeprioritizeSubtree(workInProgress.type, newProps)) {
              {
                markSpawnedWork(Never);
              } // Schedule this fiber to re-render at offscreen priority. Then bailout.


              workInProgress.expirationTime = workInProgress.childExpirationTime = Never;
              return null;
            }

            break;

          case ClassComponent:
            {
              var Component = workInProgress.type;

              if (isContextProvider(Component)) {
                pushContextProvider(workInProgress);
              }

              break;
            }

          case HostPortal:
            pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
            break;

          case ContextProvider:
            {
              var newValue = workInProgress.memoizedProps.value;
              pushProvider(workInProgress, newValue);
              break;
            }

          case Profiler:
            {
              // Profiler should only call onRender when one of its descendants actually rendered.
              var hasChildWork = workInProgress.childExpirationTime >= renderExpirationTime;

              if (hasChildWork) {
                workInProgress.effectTag |= Update;
              }
            }

            break;

          case SuspenseComponent:
            {
              var state = workInProgress.memoizedState;

              if (state !== null) {
                // whether to retry the primary children, or to skip over it and
                // go straight to the fallback. Check the priority of the primary
                // child fragment.


                var primaryChildFragment = workInProgress.child;
                var primaryChildExpirationTime = primaryChildFragment.childExpirationTime;

                if (primaryChildExpirationTime !== NoWork && primaryChildExpirationTime >= renderExpirationTime) {
                  // The primary children have pending work. Use the normal path
                  // to attempt to render the primary children again.
                  return updateSuspenseComponent(current, workInProgress, renderExpirationTime);
                } else {
                  pushSuspenseContext(workInProgress, setDefaultShallowSuspenseContext(suspenseStackCursor.current)); // The primary children do not have pending work with sufficient
                  // priority. Bailout.

                  var child = bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);

                  if (child !== null) {
                    // The fallback children have pending work. Skip over the
                    // primary children and work on the fallback.
                    return child.sibling;
                  } else {
                    return null;
                  }
                }
              } else {
                pushSuspenseContext(workInProgress, setDefaultShallowSuspenseContext(suspenseStackCursor.current));
              }

              break;
            }

          case SuspenseListComponent:
            {
              var didSuspendBefore = (current.effectTag & DidCapture) !== NoEffect;

              var _hasChildWork = workInProgress.childExpirationTime >= renderExpirationTime;

              if (didSuspendBefore) {
                if (_hasChildWork) {
                  // If something was in fallback state last time, and we have all the
                  // same children then we're still in progressive loading state.
                  // Something might get unblocked by state updates or retries in the
                  // tree which will affect the tail. So we need to use the normal
                  // path to compute the correct tail.
                  return updateSuspenseListComponent(current, workInProgress, renderExpirationTime);
                } // If none of the children had any work, that means that none of
                // them got retried so they'll still be blocked in the same way
                // as before. We can fast bail out.


                workInProgress.effectTag |= DidCapture;
              } // If nothing suspended before and we're rendering the same children,
              // then the tail doesn't matter. Anything new that suspends will work
              // in the "together" mode, so we can continue from the state we had.


              var renderState = workInProgress.memoizedState;

              if (renderState !== null) {
                // Reset to the "together" mode in case we've started a different
                // update in the past but didn't complete it.
                renderState.rendering = null;
                renderState.tail = null;
              }

              pushSuspenseContext(workInProgress, suspenseStackCursor.current);

              if (_hasChildWork) {
                break;
              } else {
                // If none of the children had any work, that means that none of
                // them got retried so they'll still be blocked in the same way
                // as before. We can fast bail out.
                return null;
              }
            }
        }

        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
      } else {
        // An update was scheduled on this fiber, but there are no new props
        // nor legacy context. Set this to false. If an update queue or context
        // consumer produces a changed value, it will set this to true. Otherwise,
        // the component will assume the children have not changed and bail out.
        didReceiveUpdate = false;
      }
    } else {
      didReceiveUpdate = false;
    } // Before entering the begin phase, clear pending update priority.
    // TODO: This assumes that we're about to evaluate the component and process
    // the update queue. However, there's an exception: SimpleMemoComponent
    // sometimes bails out later in the begin phase. This indicates that we should
    // move this assignment out of the common path and into each branch.


    workInProgress.expirationTime = NoWork;

    switch (workInProgress.tag) {
      case IndeterminateComponent:
        {
          return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderExpirationTime);
        }

      case LazyComponent:
        {
          var elementType = workInProgress.elementType;
          return mountLazyComponent(current, workInProgress, elementType, updateExpirationTime, renderExpirationTime);
        }

      case FunctionComponent:
        {
          var _Component = workInProgress.type;
          var unresolvedProps = workInProgress.pendingProps;
          var resolvedProps = workInProgress.elementType === _Component ? unresolvedProps : resolveDefaultProps(_Component, unresolvedProps);
          return updateFunctionComponent(current, workInProgress, _Component, resolvedProps, renderExpirationTime);
        }

      case ClassComponent:
        {
          var _Component2 = workInProgress.type;
          var _unresolvedProps = workInProgress.pendingProps;

          var _resolvedProps = workInProgress.elementType === _Component2 ? _unresolvedProps : resolveDefaultProps(_Component2, _unresolvedProps);

          return updateClassComponent(current, workInProgress, _Component2, _resolvedProps, renderExpirationTime);
        }

      case HostRoot:
        return updateHostRoot(current, workInProgress, renderExpirationTime);

      case HostComponent:
        return updateHostComponent(current, workInProgress, renderExpirationTime);

      case HostText:
        return updateHostText(current, workInProgress);

      case SuspenseComponent:
        return updateSuspenseComponent(current, workInProgress, renderExpirationTime);

      case HostPortal:
        return updatePortalComponent(current, workInProgress, renderExpirationTime);

      case ForwardRef:
        {
          var type = workInProgress.type;
          var _unresolvedProps2 = workInProgress.pendingProps;

          var _resolvedProps2 = workInProgress.elementType === type ? _unresolvedProps2 : resolveDefaultProps(type, _unresolvedProps2);

          return updateForwardRef(current, workInProgress, type, _resolvedProps2, renderExpirationTime);
        }

      case Fragment:
        return updateFragment(current, workInProgress, renderExpirationTime);

      case Mode:
        return updateMode(current, workInProgress, renderExpirationTime);

      case Profiler:
        return updateProfiler(current, workInProgress, renderExpirationTime);

      case ContextProvider:
        return updateContextProvider(current, workInProgress, renderExpirationTime);

      case ContextConsumer:
        return updateContextConsumer(current, workInProgress, renderExpirationTime);

      case MemoComponent:
        {
          var _type2 = workInProgress.type;
          var _unresolvedProps3 = workInProgress.pendingProps; // Resolve outer props first, then resolve inner props.

          var _resolvedProps3 = resolveDefaultProps(_type2, _unresolvedProps3);

          {
            if (workInProgress.type !== workInProgress.elementType) {
              var outerPropTypes = _type2.propTypes;

              if (outerPropTypes) {
                checkPropTypes_1(outerPropTypes, _resolvedProps3, // Resolved for outer only
                'prop', getComponentName(_type2), getCurrentFiberStackInDev);
              }
            }
          }

          _resolvedProps3 = resolveDefaultProps(_type2.type, _resolvedProps3);
          return updateMemoComponent(current, workInProgress, _type2, _resolvedProps3, updateExpirationTime, renderExpirationTime);
        }

      case SimpleMemoComponent:
        {
          return updateSimpleMemoComponent(current, workInProgress, workInProgress.type, workInProgress.pendingProps, updateExpirationTime, renderExpirationTime);
        }

      case IncompleteClassComponent:
        {
          var _Component3 = workInProgress.type;
          var _unresolvedProps4 = workInProgress.pendingProps;

          var _resolvedProps4 = workInProgress.elementType === _Component3 ? _unresolvedProps4 : resolveDefaultProps(_Component3, _unresolvedProps4);

          return mountIncompleteClassComponent(current, workInProgress, _Component3, _resolvedProps4, renderExpirationTime);
        }

      case SuspenseListComponent:
        {
          return updateSuspenseListComponent(current, workInProgress, renderExpirationTime);
        }
    }

    {
      {
        throw Error( "Unknown unit of work tag (" + workInProgress.tag + "). This error is likely caused by a bug in React. Please file an issue." );
      }
    }
  }

  function markUpdate(workInProgress) {
    // Tag the fiber with an update effect. This turns a Placement into
    // a PlacementAndUpdate.
    workInProgress.effectTag |= Update;
  }

  function markRef$1(workInProgress) {
    workInProgress.effectTag |= Ref;
  }

  var appendAllChildren;
  var updateHostContainer;
  var updateHostComponent$1;
  var updateHostText$1;

  {
    // Mutation mode
    appendAllChildren = function (parent, workInProgress, needsVisibilityToggle, isHidden) {
      // We only have the top Fiber that was created but we need recurse down its
      // children to find all the terminal nodes.
      var node = workInProgress.child;

      while (node !== null) {
        if (node.tag === HostComponent || node.tag === HostText) {
          appendInitialChild(parent, node.stateNode);
        } else if (node.tag === HostPortal) ; else if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }

        if (node === workInProgress) {
          return;
        }

        while (node.sibling === null) {
          if (node.return === null || node.return === workInProgress) {
            return;
          }

          node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;
      }
    };

    updateHostContainer = function (workInProgress) {// Noop
    };

    updateHostComponent$1 = function (current, workInProgress, type, newProps, rootContainerInstance) {
      // If we have an alternate, that means this is an update and we need to
      // schedule a side-effect to do the updates.
      var oldProps = current.memoizedProps;

      if (oldProps === newProps) {
        // In mutation mode, this is sufficient for a bailout because
        // we won't touch this node even if children changed.
        return;
      } // If we get updated because one of our children updated, we don't
      // have newProps so we'll have to reuse them.
      // TODO: Split the update API as separate for the props vs. children.
      // Even better would be if children weren't special cased at all tho.


      var instance = workInProgress.stateNode;
      var currentHostContext = getHostContext(); // TODO: Experiencing an error where oldProps is null. Suggests a host
      // component is hitting the resume path. Figure out why. Possibly
      // related to `hidden`.

      var updatePayload = prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, currentHostContext); // TODO: Type this specific to this type of component.

      workInProgress.updateQueue = updatePayload; // If the update payload indicates that there is a change or if there
      // is a new ref we mark this as an update. All the work is done in commitWork.

      if (updatePayload) {
        markUpdate(workInProgress);
      }
    };

    updateHostText$1 = function (current, workInProgress, oldText, newText) {
      // If the text differs, mark it as an update. All the work in done in commitWork.
      if (oldText !== newText) {
        markUpdate(workInProgress);
      }
    };
  }

  function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
    switch (renderState.tailMode) {
      case 'hidden':
        {
          // Any insertions at the end of the tail list after this point
          // should be invisible. If there are already mounted boundaries
          // anything before them are not considered for collapsing.
          // Therefore we need to go through the whole tail to find if
          // there are any.
          var tailNode = renderState.tail;
          var lastTailNode = null;

          while (tailNode !== null) {
            if (tailNode.alternate !== null) {
              lastTailNode = tailNode;
            }

            tailNode = tailNode.sibling;
          } // Next we're simply going to delete all insertions after the
          // last rendered item.


          if (lastTailNode === null) {
            // All remaining items in the tail are insertions.
            renderState.tail = null;
          } else {
            // Detach the insertion after the last node that was already
            // inserted.
            lastTailNode.sibling = null;
          }

          break;
        }

      case 'collapsed':
        {
          // Any insertions at the end of the tail list after this point
          // should be invisible. If there are already mounted boundaries
          // anything before them are not considered for collapsing.
          // Therefore we need to go through the whole tail to find if
          // there are any.
          var _tailNode = renderState.tail;
          var _lastTailNode = null;

          while (_tailNode !== null) {
            if (_tailNode.alternate !== null) {
              _lastTailNode = _tailNode;
            }

            _tailNode = _tailNode.sibling;
          } // Next we're simply going to delete all insertions after the
          // last rendered item.


          if (_lastTailNode === null) {
            // All remaining items in the tail are insertions.
            if (!hasRenderedATailFallback && renderState.tail !== null) {
              // We suspended during the head. We want to show at least one
              // row at the tail. So we'll keep on and cut off the rest.
              renderState.tail.sibling = null;
            } else {
              renderState.tail = null;
            }
          } else {
            // Detach the insertion after the last node that was already
            // inserted.
            _lastTailNode.sibling = null;
          }

          break;
        }
    }
  }

  function completeWork(current, workInProgress, renderExpirationTime) {
    var newProps = workInProgress.pendingProps;

    switch (workInProgress.tag) {
      case IndeterminateComponent:
      case LazyComponent:
      case SimpleMemoComponent:
      case FunctionComponent:
      case ForwardRef:
      case Fragment:
      case Mode:
      case Profiler:
      case ContextConsumer:
      case MemoComponent:
        return null;

      case ClassComponent:
        {
          var Component = workInProgress.type;

          if (isContextProvider(Component)) {
            popContext(workInProgress);
          }

          return null;
        }

      case HostRoot:
        {
          popHostContainer(workInProgress);
          popTopLevelContextObject(workInProgress);
          var fiberRoot = workInProgress.stateNode;

          if (fiberRoot.pendingContext) {
            fiberRoot.context = fiberRoot.pendingContext;
            fiberRoot.pendingContext = null;
          }

          if (current === null || current.child === null) {
            // If we hydrated, pop so that we can delete any remaining children
            // that weren't hydrated.
            var wasHydrated = popHydrationState(workInProgress);

            if (wasHydrated) {
              // If we hydrated, then we'll need to schedule an update for
              // the commit side-effects on the root.
              markUpdate(workInProgress);
            }
          }

          updateHostContainer(workInProgress);
          return null;
        }

      case HostComponent:
        {
          popHostContext(workInProgress);
          var rootContainerInstance = getRootHostContainer();
          var type = workInProgress.type;

          if (current !== null && workInProgress.stateNode != null) {
            updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance);

            if (current.ref !== workInProgress.ref) {
              markRef$1(workInProgress);
            }
          } else {
            if (!newProps) {
              if (!(workInProgress.stateNode !== null)) {
                {
                  throw Error( "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue." );
                }
              } // This can happen when we abort work.


              return null;
            }

            var currentHostContext = getHostContext(); // TODO: Move createInstance to beginWork and keep it on a context
            // "stack" as the parent. Then append children as we go in beginWork
            // or completeWork depending on whether we want to add them top->down or
            // bottom->up. Top->down is faster in IE11.

            var _wasHydrated = popHydrationState(workInProgress);

            if (_wasHydrated) {
              // TODO: Move this and createInstance step into the beginPhase
              // to consolidate.
              if (prepareToHydrateHostInstance(workInProgress, rootContainerInstance, currentHostContext)) {
                // If changes to the hydrated node need to be applied at the
                // commit-phase we mark this as such.
                markUpdate(workInProgress);
              }
            } else {
              var instance = createInstance(type, newProps, rootContainerInstance, currentHostContext, workInProgress);
              appendAllChildren(instance, workInProgress, false, false); // This needs to be set before we mount Flare event listeners

              workInProgress.stateNode = instance;
              // (eg DOM renderer supports auto-focus for certain elements).
              // Make sure such renderers get scheduled for later work.


              if (finalizeInitialChildren(instance, type, newProps, rootContainerInstance)) {
                markUpdate(workInProgress);
              }
            }

            if (workInProgress.ref !== null) {
              // If there is a ref on a host node we need to schedule a callback
              markRef$1(workInProgress);
            }
          }

          return null;
        }

      case HostText:
        {
          var newText = newProps;

          if (current && workInProgress.stateNode != null) {
            var oldText = current.memoizedProps; // If we have an alternate, that means this is an update and we need
            // to schedule a side-effect to do the updates.

            updateHostText$1(current, workInProgress, oldText, newText);
          } else {
            if (typeof newText !== 'string') {
              if (!(workInProgress.stateNode !== null)) {
                {
                  throw Error( "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue." );
                }
              } // This can happen when we abort work.

            }

            var _rootContainerInstance = getRootHostContainer();

            var _currentHostContext = getHostContext();

            var _wasHydrated2 = popHydrationState(workInProgress);

            if (_wasHydrated2) {
              if (prepareToHydrateHostTextInstance(workInProgress)) {
                markUpdate(workInProgress);
              }
            } else {
              workInProgress.stateNode = createTextInstance(newText, _rootContainerInstance, _currentHostContext, workInProgress);
            }
          }

          return null;
        }

      case SuspenseComponent:
        {
          popSuspenseContext(workInProgress);
          var nextState = workInProgress.memoizedState;

          if ((workInProgress.effectTag & DidCapture) !== NoEffect) {
            // Something suspended. Re-render with the fallback children.
            workInProgress.expirationTime = renderExpirationTime; // Do not reset the effect list.

            return workInProgress;
          }

          var nextDidTimeout = nextState !== null;
          var prevDidTimeout = false;

          if (current === null) {
            if (workInProgress.memoizedProps.fallback !== undefined) {
              popHydrationState(workInProgress);
            }
          } else {
            var prevState = current.memoizedState;
            prevDidTimeout = prevState !== null;

            if (!nextDidTimeout && prevState !== null) {
              // We just switched from the fallback to the normal children.
              // Delete the fallback.
              // TODO: Would it be better to store the fallback fragment on
              // the stateNode during the begin phase?
              var currentFallbackChild = current.child.sibling;

              if (currentFallbackChild !== null) {
                // Deletions go at the beginning of the return fiber's effect list
                var first = workInProgress.firstEffect;

                if (first !== null) {
                  workInProgress.firstEffect = currentFallbackChild;
                  currentFallbackChild.nextEffect = first;
                } else {
                  workInProgress.firstEffect = workInProgress.lastEffect = currentFallbackChild;
                  currentFallbackChild.nextEffect = null;
                }

                currentFallbackChild.effectTag = Deletion;
              }
            }
          }

          if (nextDidTimeout && !prevDidTimeout) {
            // If this subtreee is running in blocking mode we can suspend,
            // otherwise we won't suspend.
            // TODO: This will still suspend a synchronous tree if anything
            // in the concurrent tree already suspended during this render.
            // This is a known bug.
            if ((workInProgress.mode & BlockingMode) !== NoMode) {
              // TODO: Move this back to throwException because this is too late
              // if this is a large tree which is common for initial loads. We
              // don't know if we should restart a render or not until we get
              // this marker, and this is too late.
              // If this render already had a ping or lower pri updates,
              // and this is the first time we know we're going to suspend we
              // should be able to immediately restart from within throwException.
              var hasInvisibleChildContext = current === null && workInProgress.memoizedProps.unstable_avoidThisFallback !== true;

              if (hasInvisibleChildContext || hasSuspenseContext(suspenseStackCursor.current, InvisibleParentSuspenseContext)) {
                // If this was in an invisible tree or a new render, then showing
                // this boundary is ok.
                renderDidSuspend();
              } else {
                // Otherwise, we're going to have to hide content so we should
                // suspend for longer if possible.
                renderDidSuspendDelayIfPossible();
              }
            }
          }

          {
            // TODO: Only schedule updates if these values are non equal, i.e. it changed.
            if (nextDidTimeout || prevDidTimeout) {
              // If this boundary just timed out, schedule an effect to attach a
              // retry listener to the promise. This flag is also used to hide the
              // primary children. In mutation mode, we also need the flag to
              // *unhide* children that were previously hidden, so check if this
              // is currently timed out, too.
              workInProgress.effectTag |= Update;
            }
          }

          return null;
        }

      case HostPortal:
        popHostContainer(workInProgress);
        updateHostContainer(workInProgress);
        return null;

      case ContextProvider:
        // Pop provider fiber
        popProvider(workInProgress);
        return null;

      case IncompleteClassComponent:
        {
          // Same as class component case. I put it down here so that the tags are
          // sequential to ensure this switch is compiled to a jump table.
          var _Component = workInProgress.type;

          if (isContextProvider(_Component)) {
            popContext(workInProgress);
          }

          return null;
        }

      case SuspenseListComponent:
        {
          popSuspenseContext(workInProgress);
          var renderState = workInProgress.memoizedState;

          if (renderState === null) {
            // We're running in the default, "independent" mode.
            // We don't do anything in this mode.
            return null;
          }

          var didSuspendAlready = (workInProgress.effectTag & DidCapture) !== NoEffect;
          var renderedTail = renderState.rendering;

          if (renderedTail === null) {
            // We just rendered the head.
            if (!didSuspendAlready) {
              // This is the first pass. We need to figure out if anything is still
              // suspended in the rendered set.
              // If new content unsuspended, but there's still some content that
              // didn't. Then we need to do a second pass that forces everything
              // to keep showing their fallbacks.
              // We might be suspended if something in this render pass suspended, or
              // something in the previous committed pass suspended. Otherwise,
              // there's no chance so we can skip the expensive call to
              // findFirstSuspended.
              var cannotBeSuspended = renderHasNotSuspendedYet() && (current === null || (current.effectTag & DidCapture) === NoEffect);

              if (!cannotBeSuspended) {
                var row = workInProgress.child;

                while (row !== null) {
                  var suspended = findFirstSuspended(row);

                  if (suspended !== null) {
                    didSuspendAlready = true;
                    workInProgress.effectTag |= DidCapture;
                    cutOffTailIfNeeded(renderState, false); // If this is a newly suspended tree, it might not get committed as
                    // part of the second pass. In that case nothing will subscribe to
                    // its thennables. Instead, we'll transfer its thennables to the
                    // SuspenseList so that it can retry if they resolve.
                    // There might be multiple of these in the list but since we're
                    // going to wait for all of them anyway, it doesn't really matter
                    // which ones gets to ping. In theory we could get clever and keep
                    // track of how many dependencies remain but it gets tricky because
                    // in the meantime, we can add/remove/change items and dependencies.
                    // We might bail out of the loop before finding any but that
                    // doesn't matter since that means that the other boundaries that
                    // we did find already has their listeners attached.

                    var newThennables = suspended.updateQueue;

                    if (newThennables !== null) {
                      workInProgress.updateQueue = newThennables;
                      workInProgress.effectTag |= Update;
                    } // Rerender the whole list, but this time, we'll force fallbacks
                    // to stay in place.
                    // Reset the effect list before doing the second pass since that's now invalid.


                    if (renderState.lastEffect === null) {
                      workInProgress.firstEffect = null;
                    }

                    workInProgress.lastEffect = renderState.lastEffect; // Reset the child fibers to their original state.

                    resetChildFibers(workInProgress, renderExpirationTime); // Set up the Suspense Context to force suspense and immediately
                    // rerender the children.

                    pushSuspenseContext(workInProgress, setShallowSuspenseContext(suspenseStackCursor.current, ForceSuspenseFallback));
                    return workInProgress.child;
                  }

                  row = row.sibling;
                }
              }
            } else {
              cutOffTailIfNeeded(renderState, false);
            } // Next we're going to render the tail.

          } else {
            // Append the rendered row to the child list.
            if (!didSuspendAlready) {
              var _suspended = findFirstSuspended(renderedTail);

              if (_suspended !== null) {
                workInProgress.effectTag |= DidCapture;
                didSuspendAlready = true; // Ensure we transfer the update queue to the parent so that it doesn't
                // get lost if this row ends up dropped during a second pass.

                var _newThennables = _suspended.updateQueue;

                if (_newThennables !== null) {
                  workInProgress.updateQueue = _newThennables;
                  workInProgress.effectTag |= Update;
                }

                cutOffTailIfNeeded(renderState, true); // This might have been modified.

                if (renderState.tail === null && renderState.tailMode === 'hidden' && !renderedTail.alternate) {
                  // We need to delete the row we just rendered.
                  // Reset the effect list to what it was before we rendered this
                  // child. The nested children have already appended themselves.
                  var lastEffect = workInProgress.lastEffect = renderState.lastEffect; // Remove any effects that were appended after this point.

                  if (lastEffect !== null) {
                    lastEffect.nextEffect = null;
                  } // We're done.


                  return null;
                }
              } else if ( // The time it took to render last row is greater than time until
              // the expiration.
              now() * 2 - renderState.renderingStartTime > renderState.tailExpiration && renderExpirationTime > Never) {
                // We have now passed our CPU deadline and we'll just give up further
                // attempts to render the main content and only render fallbacks.
                // The assumption is that this is usually faster.
                workInProgress.effectTag |= DidCapture;
                didSuspendAlready = true;
                cutOffTailIfNeeded(renderState, false); // Since nothing actually suspended, there will nothing to ping this
                // to get it started back up to attempt the next item. If we can show
                // them, then they really have the same priority as this render.
                // So we'll pick it back up the very next render pass once we've had
                // an opportunity to yield for paint.

                var nextPriority = renderExpirationTime - 1;
                workInProgress.expirationTime = workInProgress.childExpirationTime = nextPriority;

                {
                  markSpawnedWork(nextPriority);
                }
              }
            }

            if (renderState.isBackwards) {
              // The effect list of the backwards tail will have been added
              // to the end. This breaks the guarantee that life-cycles fire in
              // sibling order but that isn't a strong guarantee promised by React.
              // Especially since these might also just pop in during future commits.
              // Append to the beginning of the list.
              renderedTail.sibling = workInProgress.child;
              workInProgress.child = renderedTail;
            } else {
              var previousSibling = renderState.last;

              if (previousSibling !== null) {
                previousSibling.sibling = renderedTail;
              } else {
                workInProgress.child = renderedTail;
              }

              renderState.last = renderedTail;
            }
          }

          if (renderState.tail !== null) {
            // We still have tail rows to render.
            if (renderState.tailExpiration === 0) {
              // Heuristic for how long we're willing to spend rendering rows
              // until we just give up and show what we have so far.
              var TAIL_EXPIRATION_TIMEOUT_MS = 500;
              renderState.tailExpiration = now() + TAIL_EXPIRATION_TIMEOUT_MS; // TODO: This is meant to mimic the train model or JND but this
              // is a per component value. It should really be since the start
              // of the total render or last commit. Consider using something like
              // globalMostRecentFallbackTime. That doesn't account for being
              // suspended for part of the time or when it's a new render.
              // It should probably use a global start time value instead.
            } // Pop a row.


            var next = renderState.tail;
            renderState.rendering = next;
            renderState.tail = next.sibling;
            renderState.lastEffect = workInProgress.lastEffect;
            renderState.renderingStartTime = now();
            next.sibling = null; // Restore the context.
            // TODO: We can probably just avoid popping it instead and only
            // setting it the first time we go from not suspended to suspended.

            var suspenseContext = suspenseStackCursor.current;

            if (didSuspendAlready) {
              suspenseContext = setShallowSuspenseContext(suspenseContext, ForceSuspenseFallback);
            } else {
              suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
            }

            pushSuspenseContext(workInProgress, suspenseContext); // Do a pass over the next row.

            return next;
          }

          return null;
        }
    }

    {
      {
        throw Error( "Unknown unit of work tag (" + workInProgress.tag + "). This error is likely caused by a bug in React. Please file an issue." );
      }
    }
  }

  function unwindWork(workInProgress, renderExpirationTime) {
    switch (workInProgress.tag) {
      case ClassComponent:
        {
          var Component = workInProgress.type;

          if (isContextProvider(Component)) {
            popContext(workInProgress);
          }

          var effectTag = workInProgress.effectTag;

          if (effectTag & ShouldCapture) {
            workInProgress.effectTag = effectTag & ~ShouldCapture | DidCapture;
            return workInProgress;
          }

          return null;
        }

      case HostRoot:
        {
          popHostContainer(workInProgress);
          popTopLevelContextObject(workInProgress);
          var _effectTag = workInProgress.effectTag;

          if (!((_effectTag & DidCapture) === NoEffect)) {
            {
              throw Error( "The root failed to unmount after an error. This is likely a bug in React. Please file an issue." );
            }
          }

          workInProgress.effectTag = _effectTag & ~ShouldCapture | DidCapture;
          return workInProgress;
        }

      case HostComponent:
        {
          // TODO: popHydrationState
          popHostContext(workInProgress);
          return null;
        }

      case SuspenseComponent:
        {
          popSuspenseContext(workInProgress);

          var _effectTag2 = workInProgress.effectTag;

          if (_effectTag2 & ShouldCapture) {
            workInProgress.effectTag = _effectTag2 & ~ShouldCapture | DidCapture; // Captured a suspense effect. Re-render the boundary.

            return workInProgress;
          }

          return null;
        }

      case SuspenseListComponent:
        {
          popSuspenseContext(workInProgress); // SuspenseList doesn't actually catch anything. It should've been
          // caught by a nested boundary. If not, it should bubble through.

          return null;
        }

      case HostPortal:
        popHostContainer(workInProgress);
        return null;

      case ContextProvider:
        popProvider(workInProgress);
        return null;

      default:
        return null;
    }
  }

  function unwindInterruptedWork(interruptedWork) {
    switch (interruptedWork.tag) {
      case ClassComponent:
        {
          var childContextTypes = interruptedWork.type.childContextTypes;

          if (childContextTypes !== null && childContextTypes !== undefined) {
            popContext(interruptedWork);
          }

          break;
        }

      case HostRoot:
        {
          popHostContainer(interruptedWork);
          popTopLevelContextObject(interruptedWork);
          break;
        }

      case HostComponent:
        {
          popHostContext(interruptedWork);
          break;
        }

      case HostPortal:
        popHostContainer(interruptedWork);
        break;

      case SuspenseComponent:
        popSuspenseContext(interruptedWork);
        break;

      case SuspenseListComponent:
        popSuspenseContext(interruptedWork);
        break;

      case ContextProvider:
        popProvider(interruptedWork);
        break;
    }
  }

  function createCapturedValue(value, source) {
    // If the value is an error, call this function immediately after it is thrown
    // so the stack is accurate.
    return {
      value: value,
      source: source,
      stack: getStackByFiberInDevAndProd(source)
    };
  }

  function logCapturedError(capturedError) {

    var error = capturedError.error;

    {
      var componentName = capturedError.componentName,
          componentStack = capturedError.componentStack,
          errorBoundaryName = capturedError.errorBoundaryName,
          errorBoundaryFound = capturedError.errorBoundaryFound,
          willRetry = capturedError.willRetry; // Browsers support silencing uncaught errors by calling
      // `preventDefault()` in window `error` handler.
      // We record this information as an expando on the error.

      if (error != null && error._suppressLogging) {
        if (errorBoundaryFound && willRetry) {
          // The error is recoverable and was silenced.
          // Ignore it and don't print the stack addendum.
          // This is handy for testing error boundaries without noise.
          return;
        } // The error is fatal. Since the silencing might have
        // been accidental, we'll surface it anyway.
        // However, the browser would have silenced the original error
        // so we'll print it first, and then print the stack addendum.


        console['error'](error); // Don't transform to our wrapper
        // For a more detailed description of this block, see:
        // https://github.com/facebook/react/pull/13384
      }

      var componentNameMessage = componentName ? "The above error occurred in the <" + componentName + "> component:" : 'The above error occurred in one of your React components:';
      var errorBoundaryMessage; // errorBoundaryFound check is sufficient; errorBoundaryName check is to satisfy Flow.

      if (errorBoundaryFound && errorBoundaryName) {
        if (willRetry) {
          errorBoundaryMessage = "React will try to recreate this component tree from scratch " + ("using the error boundary you provided, " + errorBoundaryName + ".");
        } else {
          errorBoundaryMessage = "This error was initially handled by the error boundary " + errorBoundaryName + ".\n" + "Recreating the tree from scratch failed so React will unmount the tree.";
        }
      } else {
        errorBoundaryMessage = 'Consider adding an error boundary to your tree to customize error handling behavior.\n' + 'Visit https://fb.me/react-error-boundaries to learn more about error boundaries.';
      }

      var combinedMessage = "" + componentNameMessage + componentStack + "\n\n" + ("" + errorBoundaryMessage); // In development, we provide our own message with just the component stack.
      // We don't include the original error message and JS stack because the browser
      // has already printed it. Even if the application swallows the error, it is still
      // displayed by the browser thanks to the DEV-only fake event trick in ReactErrorUtils.

      console['error'](combinedMessage); // Don't transform to our wrapper
    }
  }

  var didWarnAboutUndefinedSnapshotBeforeUpdate = null;

  {
    didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
  }

  var PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;
  function logError(boundary, errorInfo) {
    var source = errorInfo.source;
    var stack = errorInfo.stack;

    if (stack === null && source !== null) {
      stack = getStackByFiberInDevAndProd(source);
    }

    var capturedError = {
      componentName: source !== null ? getComponentName(source.type) : null,
      componentStack: stack !== null ? stack : '',
      error: errorInfo.value,
      errorBoundary: null,
      errorBoundaryName: null,
      errorBoundaryFound: false,
      willRetry: false
    };

    if (boundary !== null && boundary.tag === ClassComponent) {
      capturedError.errorBoundary = boundary.stateNode;
      capturedError.errorBoundaryName = getComponentName(boundary.type);
      capturedError.errorBoundaryFound = true;
      capturedError.willRetry = true;
    }

    try {
      logCapturedError(capturedError);
    } catch (e) {
      // This method must not throw, or React internal state will get messed up.
      // If console.error is overridden, or logCapturedError() shows a dialog that throws,
      // we want to report this error outside of the normal stack as a last resort.
      // https://github.com/facebook/react/issues/13188
      setTimeout(function () {
        throw e;
      });
    }
  }

  var callComponentWillUnmountWithTimer = function (current, instance) {
    startPhaseTimer(current, 'componentWillUnmount');
    instance.props = current.memoizedProps;
    instance.state = current.memoizedState;
    instance.componentWillUnmount();
    stopPhaseTimer();
  }; // Capture errors so they don't interrupt unmounting.


  function safelyCallComponentWillUnmount(current, instance) {
    {
      invokeGuardedCallback(null, callComponentWillUnmountWithTimer, null, current, instance);

      if (hasCaughtError()) {
        var unmountError = clearCaughtError();
        captureCommitPhaseError(current, unmountError);
      }
    }
  }

  function safelyDetachRef(current) {
    var ref = current.ref;

    if (ref !== null) {
      if (typeof ref === 'function') {
        {
          invokeGuardedCallback(null, ref, null, null);

          if (hasCaughtError()) {
            var refError = clearCaughtError();
            captureCommitPhaseError(current, refError);
          }
        }
      } else {
        ref.current = null;
      }
    }
  }

  function safelyCallDestroy(current, destroy) {
    {
      invokeGuardedCallback(null, destroy, null);

      if (hasCaughtError()) {
        var error = clearCaughtError();
        captureCommitPhaseError(current, error);
      }
    }
  }

  function commitBeforeMutationLifeCycles(current, finishedWork) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case SimpleMemoComponent:
      case Block:
        {
          return;
        }

      case ClassComponent:
        {
          if (finishedWork.effectTag & Snapshot) {
            if (current !== null) {
              var prevProps = current.memoizedProps;
              var prevState = current.memoizedState;
              startPhaseTimer(finishedWork, 'getSnapshotBeforeUpdate');
              var instance = finishedWork.stateNode; // We could update instance props and state here,
              // but instead we rely on them being set during last render.
              // TODO: revisit this when we implement resuming.

              {
                if (finishedWork.type === finishedWork.elementType && !didWarnAboutReassigningProps) {
                  if (instance.props !== finishedWork.memoizedProps) {
                    error('Expected %s props to match memoized props before ' + 'getSnapshotBeforeUpdate. ' + 'This might either be because of a bug in React, or because ' + 'a component reassigns its own `this.props`. ' + 'Please file an issue.', getComponentName(finishedWork.type) || 'instance');
                  }

                  if (instance.state !== finishedWork.memoizedState) {
                    error('Expected %s state to match memoized state before ' + 'getSnapshotBeforeUpdate. ' + 'This might either be because of a bug in React, or because ' + 'a component reassigns its own `this.props`. ' + 'Please file an issue.', getComponentName(finishedWork.type) || 'instance');
                  }
                }
              }

              var snapshot = instance.getSnapshotBeforeUpdate(finishedWork.elementType === finishedWork.type ? prevProps : resolveDefaultProps(finishedWork.type, prevProps), prevState);

              {
                var didWarnSet = didWarnAboutUndefinedSnapshotBeforeUpdate;

                if (snapshot === undefined && !didWarnSet.has(finishedWork.type)) {
                  didWarnSet.add(finishedWork.type);

                  error('%s.getSnapshotBeforeUpdate(): A snapshot value (or null) ' + 'must be returned. You have returned undefined.', getComponentName(finishedWork.type));
                }
              }

              instance.__reactInternalSnapshotBeforeUpdate = snapshot;
              stopPhaseTimer();
            }
          }

          return;
        }

      case HostRoot:
      case HostComponent:
      case HostText:
      case HostPortal:
      case IncompleteClassComponent:
        // Nothing to do for these component types
        return;
    }

    {
      {
        throw Error( "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue." );
      }
    }
  }

  function commitHookEffectListUnmount(tag, finishedWork) {
    var updateQueue = finishedWork.updateQueue;
    var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

    if (lastEffect !== null) {
      var firstEffect = lastEffect.next;
      var effect = firstEffect;

      do {
        if ((effect.tag & tag) === tag) {
          // Unmount
          var destroy = effect.destroy;
          effect.destroy = undefined;

          if (destroy !== undefined) {
            destroy();
          }
        }

        effect = effect.next;
      } while (effect !== firstEffect);
    }
  }

  function commitHookEffectListMount(tag, finishedWork) {
    var updateQueue = finishedWork.updateQueue;
    var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

    if (lastEffect !== null) {
      var firstEffect = lastEffect.next;
      var effect = firstEffect;

      do {
        if ((effect.tag & tag) === tag) {
          // Mount
          var create = effect.create;
          effect.destroy = create();

          {
            var destroy = effect.destroy;

            if (destroy !== undefined && typeof destroy !== 'function') {
              var addendum = void 0;

              if (destroy === null) {
                addendum = ' You returned null. If your effect does not require clean ' + 'up, return undefined (or nothing).';
              } else if (typeof destroy.then === 'function') {
                addendum = '\n\nIt looks like you wrote useEffect(async () => ...) or returned a Promise. ' + 'Instead, write the async function inside your effect ' + 'and call it immediately:\n\n' + 'useEffect(() => {\n' + '  async function fetchData() {\n' + '    // You can await here\n' + '    const response = await MyAPI.getData(someId);\n' + '    // ...\n' + '  }\n' + '  fetchData();\n' + "}, [someId]); // Or [] if effect doesn't need props or state\n\n" + 'Learn more about data fetching with Hooks: https://fb.me/react-hooks-data-fetching';
              } else {
                addendum = ' You returned: ' + destroy;
              }

              error('An effect function must not return anything besides a function, ' + 'which is used for clean-up.%s%s', addendum, getStackByFiberInDevAndProd(finishedWork));
            }
          }
        }

        effect = effect.next;
      } while (effect !== firstEffect);
    }
  }

  function commitPassiveHookEffects(finishedWork) {
    if ((finishedWork.effectTag & Passive) !== NoEffect) {
      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent:
        case Block:
          {
            // TODO (#17945) We should call all passive destroy functions (for all fibers)
            // before calling any create functions. The current approach only serializes
            // these for a single fiber.
            commitHookEffectListUnmount(Passive$1 | HasEffect, finishedWork);
            commitHookEffectListMount(Passive$1 | HasEffect, finishedWork);
            break;
          }
      }
    }
  }

  function commitLifeCycles(finishedRoot, current, finishedWork, committedExpirationTime) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case SimpleMemoComponent:
      case Block:
        {
          // At this point layout effects have already been destroyed (during mutation phase).
          // This is done to prevent sibling component effects from interfering with each other,
          // e.g. a destroy function in one component should never override a ref set
          // by a create function in another component during the same commit.
          commitHookEffectListMount(Layout | HasEffect, finishedWork);

          return;
        }

      case ClassComponent:
        {
          var instance = finishedWork.stateNode;

          if (finishedWork.effectTag & Update) {
            if (current === null) {
              startPhaseTimer(finishedWork, 'componentDidMount'); // We could update instance props and state here,
              // but instead we rely on them being set during last render.
              // TODO: revisit this when we implement resuming.

              {
                if (finishedWork.type === finishedWork.elementType && !didWarnAboutReassigningProps) {
                  if (instance.props !== finishedWork.memoizedProps) {
                    error('Expected %s props to match memoized props before ' + 'componentDidMount. ' + 'This might either be because of a bug in React, or because ' + 'a component reassigns its own `this.props`. ' + 'Please file an issue.', getComponentName(finishedWork.type) || 'instance');
                  }

                  if (instance.state !== finishedWork.memoizedState) {
                    error('Expected %s state to match memoized state before ' + 'componentDidMount. ' + 'This might either be because of a bug in React, or because ' + 'a component reassigns its own `this.props`. ' + 'Please file an issue.', getComponentName(finishedWork.type) || 'instance');
                  }
                }
              }

              instance.componentDidMount();
              stopPhaseTimer();
            } else {
              var prevProps = finishedWork.elementType === finishedWork.type ? current.memoizedProps : resolveDefaultProps(finishedWork.type, current.memoizedProps);
              var prevState = current.memoizedState;
              startPhaseTimer(finishedWork, 'componentDidUpdate'); // We could update instance props and state here,
              // but instead we rely on them being set during last render.
              // TODO: revisit this when we implement resuming.

              {
                if (finishedWork.type === finishedWork.elementType && !didWarnAboutReassigningProps) {
                  if (instance.props !== finishedWork.memoizedProps) {
                    error('Expected %s props to match memoized props before ' + 'componentDidUpdate. ' + 'This might either be because of a bug in React, or because ' + 'a component reassigns its own `this.props`. ' + 'Please file an issue.', getComponentName(finishedWork.type) || 'instance');
                  }

                  if (instance.state !== finishedWork.memoizedState) {
                    error('Expected %s state to match memoized state before ' + 'componentDidUpdate. ' + 'This might either be because of a bug in React, or because ' + 'a component reassigns its own `this.props`. ' + 'Please file an issue.', getComponentName(finishedWork.type) || 'instance');
                  }
                }
              }

              instance.componentDidUpdate(prevProps, prevState, instance.__reactInternalSnapshotBeforeUpdate);
              stopPhaseTimer();
            }
          }

          var updateQueue = finishedWork.updateQueue;

          if (updateQueue !== null) {
            {
              if (finishedWork.type === finishedWork.elementType && !didWarnAboutReassigningProps) {
                if (instance.props !== finishedWork.memoizedProps) {
                  error('Expected %s props to match memoized props before ' + 'processing the update queue. ' + 'This might either be because of a bug in React, or because ' + 'a component reassigns its own `this.props`. ' + 'Please file an issue.', getComponentName(finishedWork.type) || 'instance');
                }

                if (instance.state !== finishedWork.memoizedState) {
                  error('Expected %s state to match memoized state before ' + 'processing the update queue. ' + 'This might either be because of a bug in React, or because ' + 'a component reassigns its own `this.props`. ' + 'Please file an issue.', getComponentName(finishedWork.type) || 'instance');
                }
              }
            } // We could update instance props and state here,
            // but instead we rely on them being set during last render.
            // TODO: revisit this when we implement resuming.


            commitUpdateQueue(finishedWork, updateQueue, instance);
          }

          return;
        }

      case HostRoot:
        {
          var _updateQueue = finishedWork.updateQueue;

          if (_updateQueue !== null) {
            var _instance = null;

            if (finishedWork.child !== null) {
              switch (finishedWork.child.tag) {
                case HostComponent:
                  _instance = getPublicInstance(finishedWork.child.stateNode);
                  break;

                case ClassComponent:
                  _instance = finishedWork.child.stateNode;
                  break;
              }
            }

            commitUpdateQueue(finishedWork, _updateQueue, _instance);
          }

          return;
        }

      case HostComponent:
        {
          var _instance2 = finishedWork.stateNode; // Renderers may schedule work to be done after host components are mounted
          // (eg DOM renderer may schedule auto-focus for inputs and form controls).
          // These effects should only be committed when components are first mounted,
          // aka when there is no current/alternate.

          if (current === null && finishedWork.effectTag & Update) {
            var type = finishedWork.type;
            var props = finishedWork.memoizedProps;
            commitMount(_instance2, type, props);
          }

          return;
        }

      case HostText:
        {
          // We have no life-cycles associated with text.
          return;
        }

      case HostPortal:
        {
          // We have no life-cycles associated with portals.
          return;
        }

      case Profiler:
        {
          {
            var onRender = finishedWork.memoizedProps.onRender;

            if (typeof onRender === 'function') {
              {
                onRender(finishedWork.memoizedProps.id, current === null ? 'mount' : 'update', finishedWork.actualDuration, finishedWork.treeBaseDuration, finishedWork.actualStartTime, getCommitTime(), finishedRoot.memoizedInteractions);
              }
            }
          }

          return;
        }

      case SuspenseComponent:
        {
          commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
          return;
        }

      case SuspenseListComponent:
      case IncompleteClassComponent:
      case FundamentalComponent:
      case ScopeComponent:
        return;
    }

    {
      {
        throw Error( "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue." );
      }
    }
  }

  function hideOrUnhideAllChildren(finishedWork, isHidden) {
    {
      // We only have the top Fiber that was inserted but we need to recurse down its
      // children to find all the terminal nodes.
      var node = finishedWork;

      while (true) {
        if (node.tag === HostComponent) {
          var instance = node.stateNode;

          if (isHidden) {
            hideInstance(instance);
          } else {
            unhideInstance(node.stateNode, node.memoizedProps);
          }
        } else if (node.tag === HostText) {
          var _instance3 = node.stateNode;

          if (isHidden) {
            hideTextInstance(_instance3);
          } else {
            unhideTextInstance(_instance3, node.memoizedProps);
          }
        } else if (node.tag === SuspenseComponent && node.memoizedState !== null && node.memoizedState.dehydrated === null) {
          // Found a nested Suspense component that timed out. Skip over the
          // primary child fragment, which should remain hidden.
          var fallbackChildFragment = node.child.sibling;
          fallbackChildFragment.return = node;
          node = fallbackChildFragment;
          continue;
        } else if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }

        if (node === finishedWork) {
          return;
        }

        while (node.sibling === null) {
          if (node.return === null || node.return === finishedWork) {
            return;
          }

          node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;
      }
    }
  }

  function commitAttachRef(finishedWork) {
    var ref = finishedWork.ref;

    if (ref !== null) {
      var instance = finishedWork.stateNode;
      var instanceToUse;

      switch (finishedWork.tag) {
        case HostComponent:
          instanceToUse = getPublicInstance(instance);
          break;

        default:
          instanceToUse = instance;
      } // Moved outside to ensure DCE works with this flag

      if (typeof ref === 'function') {
        ref(instanceToUse);
      } else {
        {
          if (!ref.hasOwnProperty('current')) {
            error('Unexpected ref object provided for %s. ' + 'Use either a ref-setter function or React.createRef().%s', getComponentName(finishedWork.type), getStackByFiberInDevAndProd(finishedWork));
          }
        }

        ref.current = instanceToUse;
      }
    }
  }

  function commitDetachRef(current) {
    var currentRef = current.ref;

    if (currentRef !== null) {
      if (typeof currentRef === 'function') {
        currentRef(null);
      } else {
        currentRef.current = null;
      }
    }
  } // User-originating errors (lifecycles and refs) should not interrupt
  // deletion, so don't let them throw. Host-originating errors should
  // interrupt deletion, so it's okay


  function commitUnmount(finishedRoot, current, renderPriorityLevel) {
    onCommitUnmount(current);

    switch (current.tag) {
      case FunctionComponent:
      case ForwardRef:
      case MemoComponent:
      case SimpleMemoComponent:
      case Block:
        {
          var updateQueue = current.updateQueue;

          if (updateQueue !== null) {
            var lastEffect = updateQueue.lastEffect;

            if (lastEffect !== null) {
              var firstEffect = lastEffect.next;

              {
                // When the owner fiber is deleted, the destroy function of a passive
                // effect hook is called during the synchronous commit phase. This is
                // a concession to implementation complexity. Calling it in the
                // passive effect phase (like they usually are, when dependencies
                // change during an update) would require either traversing the
                // children of the deleted fiber again, or including unmount effects
                // as part of the fiber effect list.
                //
                // Because this is during the sync commit phase, we need to change
                // the priority.
                //
                // TODO: Reconsider this implementation trade off.
                var priorityLevel = renderPriorityLevel > NormalPriority ? NormalPriority : renderPriorityLevel;
                runWithPriority$1(priorityLevel, function () {
                  var effect = firstEffect;

                  do {
                    var _destroy = effect.destroy;

                    if (_destroy !== undefined) {
                      safelyCallDestroy(current, _destroy);
                    }

                    effect = effect.next;
                  } while (effect !== firstEffect);
                });
              }
            }
          }

          return;
        }

      case ClassComponent:
        {
          safelyDetachRef(current);
          var instance = current.stateNode;

          if (typeof instance.componentWillUnmount === 'function') {
            safelyCallComponentWillUnmount(current, instance);
          }

          return;
        }

      case HostComponent:
        {

          safelyDetachRef(current);
          return;
        }

      case HostPortal:
        {
          // TODO: this is recursive.
          // We are also not using this parent because
          // the portal will get pushed immediately.
          {
            unmountHostComponents(finishedRoot, current, renderPriorityLevel);
          }

          return;
        }

      case FundamentalComponent:
        {

          return;
        }

      case DehydratedFragment:
        {

          return;
        }

      case ScopeComponent:
        {

          return;
        }
    }
  }

  function commitNestedUnmounts(finishedRoot, root, renderPriorityLevel) {
    // While we're inside a removed host node we don't want to call
    // removeChild on the inner nodes because they're removed by the top
    // call anyway. We also want to call componentWillUnmount on all
    // composites before this host node is removed from the tree. Therefore
    // we do an inner loop while we're still inside the host node.
    var node = root;

    while (true) {
      commitUnmount(finishedRoot, node, renderPriorityLevel); // Visit children because they may contain more composite or host nodes.
      // Skip portals because commitUnmount() currently visits them recursively.

      if (node.child !== null && ( // If we use mutation we drill down into portals using commitUnmount above.
      // If we don't use mutation we drill down into portals here instead.
       node.tag !== HostPortal)) {
        node.child.return = node;
        node = node.child;
        continue;
      }

      if (node === root) {
        return;
      }

      while (node.sibling === null) {
        if (node.return === null || node.return === root) {
          return;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function detachFiber(current) {
    var alternate = current.alternate; // Cut off the return pointers to disconnect it from the tree. Ideally, we
    // should clear the child pointer of the parent alternate to let this
    // get GC:ed but we don't know which for sure which parent is the current
    // one so we'll settle for GC:ing the subtree of this child. This child
    // itself will be GC:ed when the parent updates the next time.

    current.return = null;
    current.child = null;
    current.memoizedState = null;
    current.updateQueue = null;
    current.dependencies = null;
    current.alternate = null;
    current.firstEffect = null;
    current.lastEffect = null;
    current.pendingProps = null;
    current.memoizedProps = null;
    current.stateNode = null;

    if (alternate !== null) {
      detachFiber(alternate);
    }
  }

  function getHostParentFiber(fiber) {
    var parent = fiber.return;

    while (parent !== null) {
      if (isHostParent(parent)) {
        return parent;
      }

      parent = parent.return;
    }

    {
      {
        throw Error( "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue." );
      }
    }
  }

  function isHostParent(fiber) {
    return fiber.tag === HostComponent || fiber.tag === HostRoot || fiber.tag === HostPortal;
  }

  function getHostSibling(fiber) {
    // We're going to search forward into the tree until we find a sibling host
    // node. Unfortunately, if multiple insertions are done in a row we have to
    // search past them. This leads to exponential search for the next sibling.
    // TODO: Find a more efficient way to do this.
    var node = fiber;

    siblings: while (true) {
      // If we didn't find anything, let's try the next sibling.
      while (node.sibling === null) {
        if (node.return === null || isHostParent(node.return)) {
          // If we pop out of the root or hit the parent the fiber we are the
          // last sibling.
          return null;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;

      while (node.tag !== HostComponent && node.tag !== HostText && node.tag !== DehydratedFragment) {
        // If it is not host node and, we might have a host node inside it.
        // Try to search down until we find one.
        if (node.effectTag & Placement) {
          // If we don't have a child, try the siblings instead.
          continue siblings;
        } // If we don't have a child, try the siblings instead.
        // We also skip portals because they are not part of this host tree.


        if (node.child === null || node.tag === HostPortal) {
          continue siblings;
        } else {
          node.child.return = node;
          node = node.child;
        }
      } // Check if this host node is stable or about to be placed.


      if (!(node.effectTag & Placement)) {
        // Found it!
        return node.stateNode;
      }
    }
  }

  function commitPlacement(finishedWork) {


    var parentFiber = getHostParentFiber(finishedWork); // Note: these two variables *must* always be updated together.

    var parent;
    var isContainer;
    var parentStateNode = parentFiber.stateNode;

    switch (parentFiber.tag) {
      case HostComponent:
        parent = parentStateNode;
        isContainer = false;
        break;

      case HostRoot:
        parent = parentStateNode.containerInfo;
        isContainer = true;
        break;

      case HostPortal:
        parent = parentStateNode.containerInfo;
        isContainer = true;
        break;

      case FundamentalComponent:

      // eslint-disable-next-line-no-fallthrough

      default:
        {
          {
            throw Error( "Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue." );
          }
        }

    }

    if (parentFiber.effectTag & ContentReset) {
      // Reset the text content of the parent before doing any insertions
      resetTextContent(parent); // Clear ContentReset from the effect tag

      parentFiber.effectTag &= ~ContentReset;
    }

    var before = getHostSibling(finishedWork); // We only have the top Fiber that was inserted but we need to recurse down its
    // children to find all the terminal nodes.

    if (isContainer) {
      insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
    } else {
      insertOrAppendPlacementNode(finishedWork, before, parent);
    }
  }

  function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
    var tag = node.tag;
    var isHost = tag === HostComponent || tag === HostText;

    if (isHost || enableFundamentalAPI ) {
      var stateNode = isHost ? node.stateNode : node.stateNode.instance;

      if (before) {
        insertInContainerBefore(parent, stateNode, before);
      } else {
        appendChildToContainer(parent, stateNode);
      }
    } else if (tag === HostPortal) ; else {
      var child = node.child;

      if (child !== null) {
        insertOrAppendPlacementNodeIntoContainer(child, before, parent);
        var sibling = child.sibling;

        while (sibling !== null) {
          insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
          sibling = sibling.sibling;
        }
      }
    }
  }

  function insertOrAppendPlacementNode(node, before, parent) {
    var tag = node.tag;
    var isHost = tag === HostComponent || tag === HostText;

    if (isHost || enableFundamentalAPI ) {
      var stateNode = isHost ? node.stateNode : node.stateNode.instance;

      if (before) {
        insertBefore(parent, stateNode, before);
      } else {
        appendChild(parent, stateNode);
      }
    } else if (tag === HostPortal) ; else {
      var child = node.child;

      if (child !== null) {
        insertOrAppendPlacementNode(child, before, parent);
        var sibling = child.sibling;

        while (sibling !== null) {
          insertOrAppendPlacementNode(sibling, before, parent);
          sibling = sibling.sibling;
        }
      }
    }
  }

  function unmountHostComponents(finishedRoot, current, renderPriorityLevel) {
    // We only have the top Fiber that was deleted but we need to recurse down its
    // children to find all the terminal nodes.
    var node = current; // Each iteration, currentParent is populated with node's host parent if not
    // currentParentIsValid.

    var currentParentIsValid = false; // Note: these two variables *must* always be updated together.

    var currentParent;
    var currentParentIsContainer;

    while (true) {
      if (!currentParentIsValid) {
        var parent = node.return;

        findParent: while (true) {
          if (!(parent !== null)) {
            {
              throw Error( "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue." );
            }
          }

          var parentStateNode = parent.stateNode;

          switch (parent.tag) {
            case HostComponent:
              currentParent = parentStateNode;
              currentParentIsContainer = false;
              break findParent;

            case HostRoot:
              currentParent = parentStateNode.containerInfo;
              currentParentIsContainer = true;
              break findParent;

            case HostPortal:
              currentParent = parentStateNode.containerInfo;
              currentParentIsContainer = true;
              break findParent;

          }

          parent = parent.return;
        }

        currentParentIsValid = true;
      }

      if (node.tag === HostComponent || node.tag === HostText) {
        commitNestedUnmounts(finishedRoot, node, renderPriorityLevel); // After all the children have unmounted, it is now safe to remove the
        // node from the tree.

        if (currentParentIsContainer) {
          removeChildFromContainer(currentParent, node.stateNode);
        } else {
          removeChild(currentParent, node.stateNode);
        } // Don't visit children because we already visited them.

      } else if (node.tag === HostPortal) {
        if (node.child !== null) {
          // When we go into a portal, it becomes the parent to remove from.
          // We will reassign it back when we pop the portal on the way up.
          currentParent = node.stateNode.containerInfo;
          currentParentIsContainer = true; // Visit children because portals might contain host components.

          node.child.return = node;
          node = node.child;
          continue;
        }
      } else {
        commitUnmount(finishedRoot, node, renderPriorityLevel); // Visit children because we may find more host components below.

        if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }
      }

      if (node === current) {
        return;
      }

      while (node.sibling === null) {
        if (node.return === null || node.return === current) {
          return;
        }

        node = node.return;

        if (node.tag === HostPortal) {
          // When we go out of the portal, we need to restore the parent.
          // Since we don't keep a stack of them, we will search for it.
          currentParentIsValid = false;
        }
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function commitDeletion(finishedRoot, current, renderPriorityLevel) {
    {
      // Recursively delete all host nodes from the parent.
      // Detach refs and call componentWillUnmount() on the whole subtree.
      unmountHostComponents(finishedRoot, current, renderPriorityLevel);
    }

    detachFiber(current);
  }

  function commitWork(current, finishedWork) {

    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case MemoComponent:
      case SimpleMemoComponent:
      case Block:
        {
          // Layout effects are destroyed during the mutation phase so that all
          // destroy functions for all fibers are called before any create functions.
          // This prevents sibling component effects from interfering with each other,
          // e.g. a destroy function in one component should never override a ref set
          // by a create function in another component during the same commit.
          commitHookEffectListUnmount(Layout | HasEffect, finishedWork);
          return;
        }

      case ClassComponent:
        {
          return;
        }

      case HostComponent:
        {
          var instance = finishedWork.stateNode;

          if (instance != null) {
            // Commit the work prepared earlier.
            var newProps = finishedWork.memoizedProps; // For hydration we reuse the update path but we treat the oldProps
            // as the newProps. The updatePayload will contain the real change in
            // this case.

            var oldProps = current !== null ? current.memoizedProps : newProps;
            var type = finishedWork.type; // TODO: Type the updateQueue to be specific to host components.

            var updatePayload = finishedWork.updateQueue;
            finishedWork.updateQueue = null;

            if (updatePayload !== null) {
              commitUpdate(instance, updatePayload, type, oldProps, newProps);
            }
          }

          return;
        }

      case HostText:
        {
          if (!(finishedWork.stateNode !== null)) {
            {
              throw Error( "This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue." );
            }
          }

          var textInstance = finishedWork.stateNode;
          var newText = finishedWork.memoizedProps; // For hydration we reuse the update path but we treat the oldProps
          // as the newProps. The updatePayload will contain the real change in
          // this case.

          var oldText = current !== null ? current.memoizedProps : newText;
          commitTextUpdate(textInstance, oldText, newText);
          return;
        }

      case HostRoot:
        {
          {
            var _root = finishedWork.stateNode;

            if (_root.hydrate) {
              // We've just hydrated. No need to hydrate again.
              _root.hydrate = false;
              commitHydratedContainer(_root.containerInfo);
            }
          }

          return;
        }

      case Profiler:
        {
          return;
        }

      case SuspenseComponent:
        {
          commitSuspenseComponent(finishedWork);
          attachSuspenseRetryListeners(finishedWork);
          return;
        }

      case SuspenseListComponent:
        {
          attachSuspenseRetryListeners(finishedWork);
          return;
        }

      case IncompleteClassComponent:
        {
          return;
        }
    }

    {
      {
        throw Error( "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue." );
      }
    }
  }

  function commitSuspenseComponent(finishedWork) {
    var newState = finishedWork.memoizedState;
    var newDidTimeout;
    var primaryChildParent = finishedWork;

    if (newState === null) {
      newDidTimeout = false;
    } else {
      newDidTimeout = true;
      primaryChildParent = finishedWork.child;
      markCommitTimeOfFallback();
    }

    if ( primaryChildParent !== null) {
      hideOrUnhideAllChildren(primaryChildParent, newDidTimeout);
    }
  }

  function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {

    var newState = finishedWork.memoizedState;

    if (newState === null) {
      var current = finishedWork.alternate;

      if (current !== null) {
        var prevState = current.memoizedState;

        if (prevState !== null) {
          var suspenseInstance = prevState.dehydrated;

          if (suspenseInstance !== null) {
            commitHydratedSuspenseInstance(suspenseInstance);
          }
        }
      }
    }
  }

  function attachSuspenseRetryListeners(finishedWork) {
    // If this boundary just timed out, then it will have a set of thenables.
    // For each thenable, attach a listener so that when it resolves, React
    // attempts to re-render the boundary in the primary (pre-timeout) state.
    var thenables = finishedWork.updateQueue;

    if (thenables !== null) {
      finishedWork.updateQueue = null;
      var retryCache = finishedWork.stateNode;

      if (retryCache === null) {
        retryCache = finishedWork.stateNode = new PossiblyWeakSet();
      }

      thenables.forEach(function (thenable) {
        // Memoize using the boundary fiber to prevent redundant listeners.
        var retry = resolveRetryThenable.bind(null, finishedWork, thenable);

        if (!retryCache.has(thenable)) {
          {
            if (thenable.__reactDoNotTraceInteractions !== true) {
              retry = unstable_wrap(retry);
            }
          }

          retryCache.add(thenable);
          thenable.then(retry, retry);
        }
      });
    }
  }

  function commitResetTextContent(current) {

    resetTextContent(current.stateNode);
  }

  var PossiblyWeakMap$1 = typeof WeakMap === 'function' ? WeakMap : Map;

  function createRootErrorUpdate(fiber, errorInfo, expirationTime) {
    var update = createUpdate(expirationTime, null); // Unmount the root by rendering null.

    update.tag = CaptureUpdate; // Caution: React DevTools currently depends on this property
    // being called "element".

    update.payload = {
      element: null
    };
    var error = errorInfo.value;

    update.callback = function () {
      onUncaughtError(error);
      logError(fiber, errorInfo);
    };

    return update;
  }

  function createClassErrorUpdate(fiber, errorInfo, expirationTime) {
    var update = createUpdate(expirationTime, null);
    update.tag = CaptureUpdate;
    var getDerivedStateFromError = fiber.type.getDerivedStateFromError;

    if (typeof getDerivedStateFromError === 'function') {
      var error$1 = errorInfo.value;

      update.payload = function () {
        logError(fiber, errorInfo);
        return getDerivedStateFromError(error$1);
      };
    }

    var inst = fiber.stateNode;

    if (inst !== null && typeof inst.componentDidCatch === 'function') {
      update.callback = function callback() {
        {
          markFailedErrorBoundaryForHotReloading(fiber);
        }

        if (typeof getDerivedStateFromError !== 'function') {
          // To preserve the preexisting retry behavior of error boundaries,
          // we keep track of which ones already failed during this batch.
          // This gets reset before we yield back to the browser.
          // TODO: Warn in strict mode if getDerivedStateFromError is
          // not defined.
          markLegacyErrorBoundaryAsFailed(this); // Only log here if componentDidCatch is the only error boundary method defined

          logError(fiber, errorInfo);
        }

        var error$1 = errorInfo.value;
        var stack = errorInfo.stack;
        this.componentDidCatch(error$1, {
          componentStack: stack !== null ? stack : ''
        });

        {
          if (typeof getDerivedStateFromError !== 'function') {
            // If componentDidCatch is the only error boundary method defined,
            // then it needs to call setState to recover from errors.
            // If no state update is scheduled then the boundary will swallow the error.
            if (fiber.expirationTime !== Sync) {
              error('%s: Error boundaries should implement getDerivedStateFromError(). ' + 'In that method, return a state update to display an error message or fallback UI.', getComponentName(fiber.type) || 'Unknown');
            }
          }
        }
      };
    } else {
      update.callback = function () {
        markFailedErrorBoundaryForHotReloading(fiber);
      };
    }

    return update;
  }

  function attachPingListener(root, renderExpirationTime, thenable) {
    // Attach a listener to the promise to "ping" the root and retry. But
    // only if one does not already exist for the current render expiration
    // time (which acts like a "thread ID" here).
    var pingCache = root.pingCache;
    var threadIDs;

    if (pingCache === null) {
      pingCache = root.pingCache = new PossiblyWeakMap$1();
      threadIDs = new Set();
      pingCache.set(thenable, threadIDs);
    } else {
      threadIDs = pingCache.get(thenable);

      if (threadIDs === undefined) {
        threadIDs = new Set();
        pingCache.set(thenable, threadIDs);
      }
    }

    if (!threadIDs.has(renderExpirationTime)) {
      // Memoize using the thread ID to prevent redundant listeners.
      threadIDs.add(renderExpirationTime);
      var ping = pingSuspendedRoot.bind(null, root, thenable, renderExpirationTime);
      thenable.then(ping, ping);
    }
  }

  function throwException(root, returnFiber, sourceFiber, value, renderExpirationTime) {
    // The source fiber did not complete.
    sourceFiber.effectTag |= Incomplete; // Its effect list is no longer valid.

    sourceFiber.firstEffect = sourceFiber.lastEffect = null;

    if (value !== null && typeof value === 'object' && typeof value.then === 'function') {
      // This is a thenable.
      var thenable = value;

      if ((sourceFiber.mode & BlockingMode) === NoMode) {
        // Reset the memoizedState to what it was before we attempted
        // to render it.
        var currentSource = sourceFiber.alternate;

        if (currentSource) {
          sourceFiber.updateQueue = currentSource.updateQueue;
          sourceFiber.memoizedState = currentSource.memoizedState;
          sourceFiber.expirationTime = currentSource.expirationTime;
        } else {
          sourceFiber.updateQueue = null;
          sourceFiber.memoizedState = null;
        }
      }

      var hasInvisibleParentBoundary = hasSuspenseContext(suspenseStackCursor.current, InvisibleParentSuspenseContext); // Schedule the nearest Suspense to re-render the timed out view.

      var _workInProgress = returnFiber;

      do {
        if (_workInProgress.tag === SuspenseComponent && shouldCaptureSuspense(_workInProgress, hasInvisibleParentBoundary)) {
          // Found the nearest boundary.
          // Stash the promise on the boundary fiber. If the boundary times out, we'll
          // attach another listener to flip the boundary back to its normal state.
          var thenables = _workInProgress.updateQueue;

          if (thenables === null) {
            var updateQueue = new Set();
            updateQueue.add(thenable);
            _workInProgress.updateQueue = updateQueue;
          } else {
            thenables.add(thenable);
          } // If the boundary is outside of blocking mode, we should *not*
          // suspend the commit. Pretend as if the suspended component rendered
          // null and keep rendering. In the commit phase, we'll schedule a
          // subsequent synchronous update to re-render the Suspense.
          //
          // Note: It doesn't matter whether the component that suspended was
          // inside a blocking mode tree. If the Suspense is outside of it, we
          // should *not* suspend the commit.


          if ((_workInProgress.mode & BlockingMode) === NoMode) {
            _workInProgress.effectTag |= DidCapture; // We're going to commit this fiber even though it didn't complete.
            // But we shouldn't call any lifecycle methods or callbacks. Remove
            // all lifecycle effect tags.

            sourceFiber.effectTag &= ~(LifecycleEffectMask | Incomplete);

            if (sourceFiber.tag === ClassComponent) {
              var currentSourceFiber = sourceFiber.alternate;

              if (currentSourceFiber === null) {
                // This is a new mount. Change the tag so it's not mistaken for a
                // completed class component. For example, we should not call
                // componentWillUnmount if it is deleted.
                sourceFiber.tag = IncompleteClassComponent;
              } else {
                // When we try rendering again, we should not reuse the current fiber,
                // since it's known to be in an inconsistent state. Use a force update to
                // prevent a bail out.
                var update = createUpdate(Sync, null);
                update.tag = ForceUpdate;
                enqueueUpdate(sourceFiber, update);
              }
            } // The source fiber did not complete. Mark it with Sync priority to
            // indicate that it still has pending work.


            sourceFiber.expirationTime = Sync; // Exit without suspending.

            return;
          } // Confirmed that the boundary is in a concurrent mode tree. Continue
          // with the normal suspend path.
          //
          // After this we'll use a set of heuristics to determine whether this
          // render pass will run to completion or restart or "suspend" the commit.
          // The actual logic for this is spread out in different places.
          //
          // This first principle is that if we're going to suspend when we complete
          // a root, then we should also restart if we get an update or ping that
          // might unsuspend it, and vice versa. The only reason to suspend is
          // because you think you might want to restart before committing. However,
          // it doesn't make sense to restart only while in the period we're suspended.
          //
          // Restarting too aggressively is also not good because it starves out any
          // intermediate loading state. So we use heuristics to determine when.
          // Suspense Heuristics
          //
          // If nothing threw a Promise or all the same fallbacks are already showing,
          // then don't suspend/restart.
          //
          // If this is an initial render of a new tree of Suspense boundaries and
          // those trigger a fallback, then don't suspend/restart. We want to ensure
          // that we can show the initial loading state as quickly as possible.
          //
          // If we hit a "Delayed" case, such as when we'd switch from content back into
          // a fallback, then we should always suspend/restart. SuspenseConfig applies to
          // this case. If none is defined, JND is used instead.
          //
          // If we're already showing a fallback and it gets "retried", allowing us to show
          // another level, but there's still an inner boundary that would show a fallback,
          // then we suspend/restart for 500ms since the last time we showed a fallback
          // anywhere in the tree. This effectively throttles progressive loading into a
          // consistent train of commits. This also gives us an opportunity to restart to
          // get to the completed state slightly earlier.
          //
          // If there's ambiguity due to batching it's resolved in preference of:
          // 1) "delayed", 2) "initial render", 3) "retry".
          //
          // We want to ensure that a "busy" state doesn't get force committed. We want to
          // ensure that new initial loading states can commit as soon as possible.


          attachPingListener(root, renderExpirationTime, thenable);
          _workInProgress.effectTag |= ShouldCapture;
          _workInProgress.expirationTime = renderExpirationTime;
          return;
        } // This boundary already captured during this render. Continue to the next
        // boundary.


        _workInProgress = _workInProgress.return;
      } while (_workInProgress !== null); // No boundary was found. Fallthrough to error mode.
      // TODO: Use invariant so the message is stripped in prod?


      value = new Error((getComponentName(sourceFiber.type) || 'A React component') + ' suspended while rendering, but no fallback UI was specified.\n' + '\n' + 'Add a <Suspense fallback=...> component higher in the tree to ' + 'provide a loading indicator or placeholder to display.' + getStackByFiberInDevAndProd(sourceFiber));
    } // We didn't find a boundary that could handle this type of exception. Start
    // over and traverse parent path again, this time treating the exception
    // as an error.


    renderDidError();
    value = createCapturedValue(value, sourceFiber);
    var workInProgress = returnFiber;

    do {
      switch (workInProgress.tag) {
        case HostRoot:
          {
            var _errorInfo = value;
            workInProgress.effectTag |= ShouldCapture;
            workInProgress.expirationTime = renderExpirationTime;

            var _update = createRootErrorUpdate(workInProgress, _errorInfo, renderExpirationTime);

            enqueueCapturedUpdate(workInProgress, _update);
            return;
          }

        case ClassComponent:
          // Capture and retry
          var errorInfo = value;
          var ctor = workInProgress.type;
          var instance = workInProgress.stateNode;

          if ((workInProgress.effectTag & DidCapture) === NoEffect && (typeof ctor.getDerivedStateFromError === 'function' || instance !== null && typeof instance.componentDidCatch === 'function' && !isAlreadyFailedLegacyErrorBoundary(instance))) {
            workInProgress.effectTag |= ShouldCapture;
            workInProgress.expirationTime = renderExpirationTime; // Schedule the error boundary to re-render using updated state

            var _update2 = createClassErrorUpdate(workInProgress, errorInfo, renderExpirationTime);

            enqueueCapturedUpdate(workInProgress, _update2);
            return;
          }

          break;
      }

      workInProgress = workInProgress.return;
    } while (workInProgress !== null);
  }

  var ceil = Math.ceil;
  var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
      ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner,
      IsSomeRendererActing = ReactSharedInternals.IsSomeRendererActing;
  var NoContext =
  /*                    */
  0;
  var BatchedContext =
  /*               */
  1;
  var EventContext =
  /*                 */
  2;
  var DiscreteEventContext =
  /*         */
  4;
  var LegacyUnbatchedContext =
  /*       */
  8;
  var RenderContext =
  /*                */
  16;
  var CommitContext =
  /*                */
  32;
  var RootIncomplete = 0;
  var RootFatalErrored = 1;
  var RootErrored = 2;
  var RootSuspended = 3;
  var RootSuspendedWithDelay = 4;
  var RootCompleted = 5;
  // Describes where we are in the React execution stack
  var executionContext = NoContext; // The root we're working on

  var workInProgressRoot = null; // The fiber we're working on

  var workInProgress = null; // The expiration time we're rendering

  var renderExpirationTime$1 = NoWork; // Whether to root completed, errored, suspended, etc.

  var workInProgressRootExitStatus = RootIncomplete; // A fatal error, if one is thrown

  var workInProgressRootFatalError = null; // Most recent event time among processed updates during this render.
  // This is conceptually a time stamp but expressed in terms of an ExpirationTime
  // because we deal mostly with expiration times in the hot path, so this avoids
  // the conversion happening in the hot path.

  var workInProgressRootLatestProcessedExpirationTime = Sync;
  var workInProgressRootLatestSuspenseTimeout = Sync;
  var workInProgressRootCanSuspendUsingConfig = null; // The work left over by components that were visited during this render. Only
  // includes unprocessed updates, not work in bailed out children.

  var workInProgressRootNextUnprocessedUpdateTime = NoWork; // If we're pinged while rendering we don't always restart immediately.
  // This flag determines if it might be worthwhile to restart if an opportunity
  // happens latere.

  var workInProgressRootHasPendingPing = false; // The most recent time we committed a fallback. This lets us ensure a train
  // model where we don't commit new loading states in too quick succession.

  var globalMostRecentFallbackTime = 0;
  var FALLBACK_THROTTLE_MS = 500;
  var nextEffect = null;
  var hasUncaughtError = false;
  var firstUncaughtError = null;
  var legacyErrorBoundariesThatAlreadyFailed = null;
  var rootDoesHavePassiveEffects = false;
  var rootWithPendingPassiveEffects = null;
  var pendingPassiveEffectsRenderPriority = NoPriority;
  var pendingPassiveEffectsExpirationTime = NoWork;
  var rootsWithPendingDiscreteUpdates = null; // Use these to prevent an infinite loop of nested updates

  var NESTED_UPDATE_LIMIT = 50;
  var nestedUpdateCount = 0;
  var rootWithNestedUpdates = null;
  var NESTED_PASSIVE_UPDATE_LIMIT = 50;
  var nestedPassiveUpdateCount = 0;
  var interruptedBy = null; // Marks the need to reschedule pending interactions at these expiration times
  // during the commit phase. This enables them to be traced across components
  // that spawn new work during render. E.g. hidden boundaries, suspended SSR
  // hydration or SuspenseList.

  var spawnedWorkDuringRender = null; // Expiration times are computed by adding to the current time (the start
  // time). However, if two updates are scheduled within the same event, we
  // should treat their start times as simultaneous, even if the actual clock
  // time has advanced between the first and second call.
  // In other words, because expiration times determine how updates are batched,
  // we want all updates of like priority that occur within the same event to
  // receive the same expiration time. Otherwise we get tearing.

  var currentEventTime = NoWork;
  function requestCurrentTimeForUpdate() {
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
      // We're inside React, so it's fine to read the actual time.
      return msToExpirationTime(now());
    } // We're not inside React, so we may be in the middle of a browser event.


    if (currentEventTime !== NoWork) {
      // Use the same start time for all updates until we enter React again.
      return currentEventTime;
    } // This is the first update since React yielded. Compute a new start time.


    currentEventTime = msToExpirationTime(now());
    return currentEventTime;
  }
  function getCurrentTime() {
    return msToExpirationTime(now());
  }
  function computeExpirationForFiber(currentTime, fiber, suspenseConfig) {
    var mode = fiber.mode;

    if ((mode & BlockingMode) === NoMode) {
      return Sync;
    }

    var priorityLevel = getCurrentPriorityLevel();

    if ((mode & ConcurrentMode) === NoMode) {
      return priorityLevel === ImmediatePriority ? Sync : Batched;
    }

    if ((executionContext & RenderContext) !== NoContext) {
      // Use whatever time we're already rendering
      // TODO: Should there be a way to opt out, like with `runWithPriority`?
      return renderExpirationTime$1;
    }

    var expirationTime;

    if (suspenseConfig !== null) {
      // Compute an expiration time based on the Suspense timeout.
      expirationTime = computeSuspenseExpiration(currentTime, suspenseConfig.timeoutMs | 0 || LOW_PRIORITY_EXPIRATION);
    } else {
      // Compute an expiration time based on the Scheduler priority.
      switch (priorityLevel) {
        case ImmediatePriority:
          expirationTime = Sync;
          break;

        case UserBlockingPriority$1:
          // TODO: Rename this to computeUserBlockingExpiration
          expirationTime = computeInteractiveExpiration(currentTime);
          break;

        case NormalPriority:
        case LowPriority:
          // TODO: Handle LowPriority
          // TODO: Rename this to... something better.
          expirationTime = computeAsyncExpiration(currentTime);
          break;

        case IdlePriority:
          expirationTime = Idle;
          break;

        default:
          {
            {
              throw Error( "Expected a valid priority level" );
            }
          }

      }
    } // If we're in the middle of rendering a tree, do not update at the same
    // expiration time that is already rendering.
    // TODO: We shouldn't have to do this if the update is on a different root.
    // Refactor computeExpirationForFiber + scheduleUpdate so we have access to
    // the root when we check for this condition.


    if (workInProgressRoot !== null && expirationTime === renderExpirationTime$1) {
      // This is a trick to move this update into a separate batch
      expirationTime -= 1;
    }

    return expirationTime;
  }
  function scheduleUpdateOnFiber(fiber, expirationTime) {
    checkForNestedUpdates();
    warnAboutRenderPhaseUpdatesInDEV(fiber);
    var root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);

    if (root === null) {
      warnAboutUpdateOnUnmountedFiberInDEV(fiber);
      return;
    }

    checkForInterruption(fiber, expirationTime);
    recordScheduleUpdate(); // TODO: computeExpirationForFiber also reads the priority. Pass the
    // priority as an argument to that function and this one.

    var priorityLevel = getCurrentPriorityLevel();

    if (expirationTime === Sync) {
      if ( // Check if we're inside unbatchedUpdates
      (executionContext & LegacyUnbatchedContext) !== NoContext && // Check if we're not already rendering
      (executionContext & (RenderContext | CommitContext)) === NoContext) {
        // Register pending interactions on the root to avoid losing traced interaction data.
        schedulePendingInteractions(root, expirationTime); // This is a legacy edge case. The initial mount of a ReactDOM.render-ed
        // root inside of batchedUpdates should be synchronous, but layout updates
        // should be deferred until the end of the batch.

        performSyncWorkOnRoot(root);
      } else {
        ensureRootIsScheduled(root);
        schedulePendingInteractions(root, expirationTime);

        if (executionContext === NoContext) {
          // Flush the synchronous work now, unless we're already working or inside
          // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
          // scheduleCallbackForFiber to preserve the ability to schedule a callback
          // without immediately flushing it. We only do this for user-initiated
          // updates, to preserve historical behavior of legacy mode.
          flushSyncCallbackQueue();
        }
      }
    } else {
      ensureRootIsScheduled(root);
      schedulePendingInteractions(root, expirationTime);
    }

    if ((executionContext & DiscreteEventContext) !== NoContext && ( // Only updates at user-blocking priority or greater are considered
    // discrete, even inside a discrete event.
    priorityLevel === UserBlockingPriority$1 || priorityLevel === ImmediatePriority)) {
      // This is the result of a discrete event. Track the lowest priority
      // discrete update per root so we can flush them early, if needed.
      if (rootsWithPendingDiscreteUpdates === null) {
        rootsWithPendingDiscreteUpdates = new Map([[root, expirationTime]]);
      } else {
        var lastDiscreteTime = rootsWithPendingDiscreteUpdates.get(root);

        if (lastDiscreteTime === undefined || lastDiscreteTime > expirationTime) {
          rootsWithPendingDiscreteUpdates.set(root, expirationTime);
        }
      }
    }
  }
  var scheduleWork = scheduleUpdateOnFiber; // This is split into a separate function so we can mark a fiber with pending
  // work without treating it as a typical update that originates from an event;
  // e.g. retrying a Suspense boundary isn't an update, but it does schedule work
  // on a fiber.

  function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
    // Update the source fiber's expiration time
    if (fiber.expirationTime < expirationTime) {
      fiber.expirationTime = expirationTime;
    }

    var alternate = fiber.alternate;

    if (alternate !== null && alternate.expirationTime < expirationTime) {
      alternate.expirationTime = expirationTime;
    } // Walk the parent path to the root and update the child expiration time.


    var node = fiber.return;
    var root = null;

    if (node === null && fiber.tag === HostRoot) {
      root = fiber.stateNode;
    } else {
      while (node !== null) {
        alternate = node.alternate;

        if (node.childExpirationTime < expirationTime) {
          node.childExpirationTime = expirationTime;

          if (alternate !== null && alternate.childExpirationTime < expirationTime) {
            alternate.childExpirationTime = expirationTime;
          }
        } else if (alternate !== null && alternate.childExpirationTime < expirationTime) {
          alternate.childExpirationTime = expirationTime;
        }

        if (node.return === null && node.tag === HostRoot) {
          root = node.stateNode;
          break;
        }

        node = node.return;
      }
    }

    if (root !== null) {
      if (workInProgressRoot === root) {
        // Received an update to a tree that's in the middle of rendering. Mark
        // that's unprocessed work on this root.
        markUnprocessedUpdateTime(expirationTime);

        if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
          // The root already suspended with a delay, which means this render
          // definitely won't finish. Since we have a new update, let's mark it as
          // suspended now, right before marking the incoming update. This has the
          // effect of interrupting the current render and switching to the update.
          // TODO: This happens to work when receiving an update during the render
          // phase, because of the trick inside computeExpirationForFiber to
          // subtract 1 from `renderExpirationTime` to move it into a
          // separate bucket. But we should probably model it with an exception,
          // using the same mechanism we use to force hydration of a subtree.
          // TODO: This does not account for low pri updates that were already
          // scheduled before the root started rendering. Need to track the next
          // pending expiration time (perhaps by backtracking the return path) and
          // then trigger a restart in the `renderDidSuspendDelayIfPossible` path.
          markRootSuspendedAtTime(root, renderExpirationTime$1);
        }
      } // Mark that the root has a pending update.


      markRootUpdatedAtTime(root, expirationTime);
    }

    return root;
  }

  function getNextRootExpirationTimeToWorkOn(root) {
    // Determines the next expiration time that the root should render, taking
    // into account levels that may be suspended, or levels that may have
    // received a ping.
    var lastExpiredTime = root.lastExpiredTime;

    if (lastExpiredTime !== NoWork) {
      return lastExpiredTime;
    } // "Pending" refers to any update that hasn't committed yet, including if it
    // suspended. The "suspended" range is therefore a subset.


    var firstPendingTime = root.firstPendingTime;

    if (!isRootSuspendedAtTime(root, firstPendingTime)) {
      // The highest priority pending time is not suspended. Let's work on that.
      return firstPendingTime;
    } // If the first pending time is suspended, check if there's a lower priority
    // pending level that we know about. Or check if we received a ping. Work
    // on whichever is higher priority.


    var lastPingedTime = root.lastPingedTime;
    var nextKnownPendingLevel = root.nextKnownPendingLevel;
    var nextLevel = lastPingedTime > nextKnownPendingLevel ? lastPingedTime : nextKnownPendingLevel;

    if ( nextLevel <= Idle && firstPendingTime !== nextLevel) {
      // Don't work on Idle/Never priority unless everything else is committed.
      return NoWork;
    }

    return nextLevel;
  } // Use this function to schedule a task for a root. There's only one task per
  // root; if a task was already scheduled, we'll check to make sure the
  // expiration time of the existing task is the same as the expiration time of
  // the next level that the root has work on. This function is called on every
  // update, and right before exiting a task.


  function ensureRootIsScheduled(root) {
    var lastExpiredTime = root.lastExpiredTime;

    if (lastExpiredTime !== NoWork) {
      // Special case: Expired work should flush synchronously.
      root.callbackExpirationTime = Sync;
      root.callbackPriority = ImmediatePriority;
      root.callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
      return;
    }

    var expirationTime = getNextRootExpirationTimeToWorkOn(root);
    var existingCallbackNode = root.callbackNode;

    if (expirationTime === NoWork) {
      // There's nothing to work on.
      if (existingCallbackNode !== null) {
        root.callbackNode = null;
        root.callbackExpirationTime = NoWork;
        root.callbackPriority = NoPriority;
      }

      return;
    } // TODO: If this is an update, we already read the current time. Pass the
    // time as an argument.


    var currentTime = requestCurrentTimeForUpdate();
    var priorityLevel = inferPriorityFromExpirationTime(currentTime, expirationTime); // If there's an existing render task, confirm it has the correct priority and
    // expiration time. Otherwise, we'll cancel it and schedule a new one.

    if (existingCallbackNode !== null) {
      var existingCallbackPriority = root.callbackPriority;
      var existingCallbackExpirationTime = root.callbackExpirationTime;

      if ( // Callback must have the exact same expiration time.
      existingCallbackExpirationTime === expirationTime && // Callback must have greater or equal priority.
      existingCallbackPriority >= priorityLevel) {
        // Existing callback is sufficient.
        return;
      } // Need to schedule a new task.
      // TODO: Instead of scheduling a new task, we should be able to change the
      // priority of the existing one.


      cancelCallback(existingCallbackNode);
    }

    root.callbackExpirationTime = expirationTime;
    root.callbackPriority = priorityLevel;
    var callbackNode;

    if (expirationTime === Sync) {
      // Sync React callbacks are scheduled on a special internal queue
      callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    } else {
      callbackNode = scheduleCallback(priorityLevel, performConcurrentWorkOnRoot.bind(null, root), // Compute a task timeout based on the expiration time. This also affects
      // ordering because tasks are processed in timeout order.
      {
        timeout: expirationTimeToMs(expirationTime) - now()
      });
    }

    root.callbackNode = callbackNode;
  } // This is the entry point for every concurrent task, i.e. anything that
  // goes through Scheduler.


  function performConcurrentWorkOnRoot(root, didTimeout) {
    // Since we know we're in a React event, we can clear the current
    // event time. The next update will compute a new event time.
    currentEventTime = NoWork;

    if (didTimeout) {
      // The render task took too long to complete. Mark the current time as
      // expired to synchronously render all expired work in a single batch.
      var currentTime = requestCurrentTimeForUpdate();
      markRootExpiredAtTime(root, currentTime); // This will schedule a synchronous callback.

      ensureRootIsScheduled(root);
      return null;
    } // Determine the next expiration time to work on, using the fields stored
    // on the root.


    var expirationTime = getNextRootExpirationTimeToWorkOn(root);

    if (expirationTime !== NoWork) {
      var originalCallbackNode = root.callbackNode;

      if (!((executionContext & (RenderContext | CommitContext)) === NoContext)) {
        {
          throw Error( "Should not already be working." );
        }
      }

      flushPassiveEffects(); // If the root or expiration time have changed, throw out the existing stack
      // and prepare a fresh one. Otherwise we'll continue where we left off.

      if (root !== workInProgressRoot || expirationTime !== renderExpirationTime$1) {
        prepareFreshStack(root, expirationTime);
        startWorkOnPendingInteractions(root, expirationTime);
      } // If we have a work-in-progress fiber, it means there's still work to do
      // in this root.


      if (workInProgress !== null) {
        var prevExecutionContext = executionContext;
        executionContext |= RenderContext;
        var prevDispatcher = pushDispatcher();
        var prevInteractions = pushInteractions(root);
        startWorkLoopTimer(workInProgress);

        do {
          try {
            workLoopConcurrent();
            break;
          } catch (thrownValue) {
            handleError(root, thrownValue);
          }
        } while (true);

        resetContextDependencies();
        executionContext = prevExecutionContext;
        popDispatcher(prevDispatcher);

        {
          popInteractions(prevInteractions);
        }

        if (workInProgressRootExitStatus === RootFatalErrored) {
          var fatalError = workInProgressRootFatalError;
          stopInterruptedWorkLoopTimer();
          prepareFreshStack(root, expirationTime);
          markRootSuspendedAtTime(root, expirationTime);
          ensureRootIsScheduled(root);
          throw fatalError;
        }

        if (workInProgress !== null) {
          // There's still work left over. Exit without committing.
          stopInterruptedWorkLoopTimer();
        } else {
          // We now have a consistent tree. The next step is either to commit it,
          // or, if something suspended, wait to commit it after a timeout.
          stopFinishedWorkLoopTimer();
          var finishedWork = root.finishedWork = root.current.alternate;
          root.finishedExpirationTime = expirationTime;
          finishConcurrentRender(root, finishedWork, workInProgressRootExitStatus, expirationTime);
        }

        ensureRootIsScheduled(root);

        if (root.callbackNode === originalCallbackNode) {
          // The task node scheduled for this root is the same one that's
          // currently executed. Need to return a continuation.
          return performConcurrentWorkOnRoot.bind(null, root);
        }
      }
    }

    return null;
  }

  function finishConcurrentRender(root, finishedWork, exitStatus, expirationTime) {
    // Set this to null to indicate there's no in-progress render.
    workInProgressRoot = null;

    switch (exitStatus) {
      case RootIncomplete:
      case RootFatalErrored:
        {
          {
            {
              throw Error( "Root did not complete. This is a bug in React." );
            }
          }
        }
      // Flow knows about invariant, so it complains if I add a break
      // statement, but eslint doesn't know about invariant, so it complains
      // if I do. eslint-disable-next-line no-fallthrough

      case RootErrored:
        {
          // If this was an async render, the error may have happened due to
          // a mutation in a concurrent event. Try rendering one more time,
          // synchronously, to see if the error goes away. If there are
          // lower priority updates, let's include those, too, in case they
          // fix the inconsistency. Render at Idle to include all updates.
          // If it was Idle or Never or some not-yet-invented time, render
          // at that time.
          markRootExpiredAtTime(root, expirationTime > Idle ? Idle : expirationTime); // We assume that this second render pass will be synchronous
          // and therefore not hit this path again.

          break;
        }

      case RootSuspended:
        {
          markRootSuspendedAtTime(root, expirationTime);
          var lastSuspendedTime = root.lastSuspendedTime;

          if (expirationTime === lastSuspendedTime) {
            root.nextKnownPendingLevel = getRemainingExpirationTime(finishedWork);
          } // We have an acceptable loading state. We need to figure out if we
          // should immediately commit it or wait a bit.
          // If we have processed new updates during this render, we may now
          // have a new loading state ready. We want to ensure that we commit
          // that as soon as possible.


          var hasNotProcessedNewUpdates = workInProgressRootLatestProcessedExpirationTime === Sync;

          if (hasNotProcessedNewUpdates && // do not delay if we're inside an act() scope
          !( IsThisRendererActing.current)) {
            // If we have not processed any new updates during this pass, then
            // this is either a retry of an existing fallback state or a
            // hidden tree. Hidden trees shouldn't be batched with other work
            // and after that's fixed it can only be a retry. We're going to
            // throttle committing retries so that we don't show too many
            // loading states too quickly.
            var msUntilTimeout = globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now(); // Don't bother with a very short suspense time.

            if (msUntilTimeout > 10) {
              if (workInProgressRootHasPendingPing) {
                var lastPingedTime = root.lastPingedTime;

                if (lastPingedTime === NoWork || lastPingedTime >= expirationTime) {
                  // This render was pinged but we didn't get to restart
                  // earlier so try restarting now instead.
                  root.lastPingedTime = expirationTime;
                  prepareFreshStack(root, expirationTime);
                  break;
                }
              }

              var nextTime = getNextRootExpirationTimeToWorkOn(root);

              if (nextTime !== NoWork && nextTime !== expirationTime) {
                // There's additional work on this root.
                break;
              }

              if (lastSuspendedTime !== NoWork && lastSuspendedTime !== expirationTime) {
                // We should prefer to render the fallback of at the last
                // suspended level. Ping the last suspended level to try
                // rendering it again.
                root.lastPingedTime = lastSuspendedTime;
                break;
              } // The render is suspended, it hasn't timed out, and there's no
              // lower priority work to do. Instead of committing the fallback
              // immediately, wait for more data to arrive.


              root.timeoutHandle = scheduleTimeout(commitRoot.bind(null, root), msUntilTimeout);
              break;
            }
          } // The work expired. Commit immediately.


          commitRoot(root);
          break;
        }

      case RootSuspendedWithDelay:
        {
          markRootSuspendedAtTime(root, expirationTime);
          var _lastSuspendedTime = root.lastSuspendedTime;

          if (expirationTime === _lastSuspendedTime) {
            root.nextKnownPendingLevel = getRemainingExpirationTime(finishedWork);
          }

          if ( // do not delay if we're inside an act() scope
          !( IsThisRendererActing.current)) {
            // We're suspended in a state that should be avoided. We'll try to
            // avoid committing it for as long as the timeouts let us.
            if (workInProgressRootHasPendingPing) {
              var _lastPingedTime = root.lastPingedTime;

              if (_lastPingedTime === NoWork || _lastPingedTime >= expirationTime) {
                // This render was pinged but we didn't get to restart earlier
                // so try restarting now instead.
                root.lastPingedTime = expirationTime;
                prepareFreshStack(root, expirationTime);
                break;
              }
            }

            var _nextTime = getNextRootExpirationTimeToWorkOn(root);

            if (_nextTime !== NoWork && _nextTime !== expirationTime) {
              // There's additional work on this root.
              break;
            }

            if (_lastSuspendedTime !== NoWork && _lastSuspendedTime !== expirationTime) {
              // We should prefer to render the fallback of at the last
              // suspended level. Ping the last suspended level to try
              // rendering it again.
              root.lastPingedTime = _lastSuspendedTime;
              break;
            }

            var _msUntilTimeout;

            if (workInProgressRootLatestSuspenseTimeout !== Sync) {
              // We have processed a suspense config whose expiration time we
              // can use as the timeout.
              _msUntilTimeout = expirationTimeToMs(workInProgressRootLatestSuspenseTimeout) - now();
            } else if (workInProgressRootLatestProcessedExpirationTime === Sync) {
              // This should never normally happen because only new updates
              // cause delayed states, so we should have processed something.
              // However, this could also happen in an offscreen tree.
              _msUntilTimeout = 0;
            } else {
              // If we don't have a suspense config, we're going to use a
              // heuristic to determine how long we can suspend.
              var eventTimeMs = inferTimeFromExpirationTime(workInProgressRootLatestProcessedExpirationTime);
              var currentTimeMs = now();
              var timeUntilExpirationMs = expirationTimeToMs(expirationTime) - currentTimeMs;
              var timeElapsed = currentTimeMs - eventTimeMs;

              if (timeElapsed < 0) {
                // We get this wrong some time since we estimate the time.
                timeElapsed = 0;
              }

              _msUntilTimeout = jnd(timeElapsed) - timeElapsed; // Clamp the timeout to the expiration time. TODO: Once the
              // event time is exact instead of inferred from expiration time
              // we don't need this.

              if (timeUntilExpirationMs < _msUntilTimeout) {
                _msUntilTimeout = timeUntilExpirationMs;
              }
            } // Don't bother with a very short suspense time.


            if (_msUntilTimeout > 10) {
              // The render is suspended, it hasn't timed out, and there's no
              // lower priority work to do. Instead of committing the fallback
              // immediately, wait for more data to arrive.
              root.timeoutHandle = scheduleTimeout(commitRoot.bind(null, root), _msUntilTimeout);
              break;
            }
          } // The work expired. Commit immediately.


          commitRoot(root);
          break;
        }

      case RootCompleted:
        {
          // The work completed. Ready to commit.
          if ( // do not delay if we're inside an act() scope
          !( IsThisRendererActing.current) && workInProgressRootLatestProcessedExpirationTime !== Sync && workInProgressRootCanSuspendUsingConfig !== null) {
            // If we have exceeded the minimum loading delay, which probably
            // means we have shown a spinner already, we might have to suspend
            // a bit longer to ensure that the spinner is shown for
            // enough time.
            var _msUntilTimeout2 = computeMsUntilSuspenseLoadingDelay(workInProgressRootLatestProcessedExpirationTime, expirationTime, workInProgressRootCanSuspendUsingConfig);

            if (_msUntilTimeout2 > 10) {
              markRootSuspendedAtTime(root, expirationTime);
              root.timeoutHandle = scheduleTimeout(commitRoot.bind(null, root), _msUntilTimeout2);
              break;
            }
          }

          commitRoot(root);
          break;
        }

      default:
        {
          {
            {
              throw Error( "Unknown root exit status." );
            }
          }
        }
    }
  } // This is the entry point for synchronous tasks that don't go
  // through Scheduler


  function performSyncWorkOnRoot(root) {
    // Check if there's expired work on this root. Otherwise, render at Sync.
    var lastExpiredTime = root.lastExpiredTime;
    var expirationTime = lastExpiredTime !== NoWork ? lastExpiredTime : Sync;

    if (!((executionContext & (RenderContext | CommitContext)) === NoContext)) {
      {
        throw Error( "Should not already be working." );
      }
    }

    flushPassiveEffects(); // If the root or expiration time have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.

    if (root !== workInProgressRoot || expirationTime !== renderExpirationTime$1) {
      prepareFreshStack(root, expirationTime);
      startWorkOnPendingInteractions(root, expirationTime);
    } // If we have a work-in-progress fiber, it means there's still work to do
    // in this root.


    if (workInProgress !== null) {
      var prevExecutionContext = executionContext;
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher();
      var prevInteractions = pushInteractions(root);
      startWorkLoopTimer(workInProgress);

      do {
        try {
          workLoopSync();
          break;
        } catch (thrownValue) {
          handleError(root, thrownValue);
        }
      } while (true);

      resetContextDependencies();
      executionContext = prevExecutionContext;
      popDispatcher(prevDispatcher);

      {
        popInteractions(prevInteractions);
      }

      if (workInProgressRootExitStatus === RootFatalErrored) {
        var fatalError = workInProgressRootFatalError;
        stopInterruptedWorkLoopTimer();
        prepareFreshStack(root, expirationTime);
        markRootSuspendedAtTime(root, expirationTime);
        ensureRootIsScheduled(root);
        throw fatalError;
      }

      if (workInProgress !== null) {
        // This is a sync render, so we should have finished the whole tree.
        {
          {
            throw Error( "Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue." );
          }
        }
      } else {
        // We now have a consistent tree. Because this is a sync render, we
        // will commit it even if something suspended.
        stopFinishedWorkLoopTimer();
        root.finishedWork = root.current.alternate;
        root.finishedExpirationTime = expirationTime;
        finishSyncRender(root);
      } // Before exiting, make sure there's a callback scheduled for the next
      // pending level.


      ensureRootIsScheduled(root);
    }

    return null;
  }

  function finishSyncRender(root) {
    // Set this to null to indicate there's no in-progress render.
    workInProgressRoot = null;
    commitRoot(root);
  }
  function flushDiscreteUpdates() {
    // TODO: Should be able to flush inside batchedUpdates, but not inside `act`.
    // However, `act` uses `batchedUpdates`, so there's no way to distinguish
    // those two cases. Need to fix this before exposing flushDiscreteUpdates
    // as a public API.
    if ((executionContext & (BatchedContext | RenderContext | CommitContext)) !== NoContext) {
      {
        if ((executionContext & RenderContext) !== NoContext) {
          error('unstable_flushDiscreteUpdates: Cannot flush updates when React is ' + 'already rendering.');
        }
      } // We're already rendering, so we can't synchronously flush pending work.
      // This is probably a nested event dispatch triggered by a lifecycle/effect,
      // like `el.focus()`. Exit.


      return;
    }

    flushPendingDiscreteUpdates(); // If the discrete updates scheduled passive effects, flush them now so that
    // they fire before the next serial event.

    flushPassiveEffects();
  }
  function syncUpdates(fn, a, b, c) {
    return runWithPriority$1(ImmediatePriority, fn.bind(null, a, b, c));
  }

  function flushPendingDiscreteUpdates() {
    if (rootsWithPendingDiscreteUpdates !== null) {
      // For each root with pending discrete updates, schedule a callback to
      // immediately flush them.
      var roots = rootsWithPendingDiscreteUpdates;
      rootsWithPendingDiscreteUpdates = null;
      roots.forEach(function (expirationTime, root) {
        markRootExpiredAtTime(root, expirationTime);
        ensureRootIsScheduled(root);
      }); // Now flush the immediate queue.

      flushSyncCallbackQueue();
    }
  }

  function batchedUpdates$1(fn, a) {
    var prevExecutionContext = executionContext;
    executionContext |= BatchedContext;

    try {
      return fn(a);
    } finally {
      executionContext = prevExecutionContext;

      if (executionContext === NoContext) {
        // Flush the immediate callbacks that were scheduled during this batch
        flushSyncCallbackQueue();
      }
    }
  }
  function batchedEventUpdates$1(fn, a) {
    var prevExecutionContext = executionContext;
    executionContext |= EventContext;

    try {
      return fn(a);
    } finally {
      executionContext = prevExecutionContext;

      if (executionContext === NoContext) {
        // Flush the immediate callbacks that were scheduled during this batch
        flushSyncCallbackQueue();
      }
    }
  }
  function discreteUpdates$1(fn, a, b, c, d) {
    var prevExecutionContext = executionContext;
    executionContext |= DiscreteEventContext;

    try {
      // Should this
      return runWithPriority$1(UserBlockingPriority$1, fn.bind(null, a, b, c, d));
    } finally {
      executionContext = prevExecutionContext;

      if (executionContext === NoContext) {
        // Flush the immediate callbacks that were scheduled during this batch
        flushSyncCallbackQueue();
      }
    }
  }
  function unbatchedUpdates(fn, a) {
    var prevExecutionContext = executionContext;
    executionContext &= ~BatchedContext;
    executionContext |= LegacyUnbatchedContext;

    try {
      return fn(a);
    } finally {
      executionContext = prevExecutionContext;

      if (executionContext === NoContext) {
        // Flush the immediate callbacks that were scheduled during this batch
        flushSyncCallbackQueue();
      }
    }
  }
  function flushSync(fn, a) {
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
      {
        {
          throw Error( "flushSync was called from inside a lifecycle method. It cannot be called when React is already rendering." );
        }
      }
    }

    var prevExecutionContext = executionContext;
    executionContext |= BatchedContext;

    try {
      return runWithPriority$1(ImmediatePriority, fn.bind(null, a));
    } finally {
      executionContext = prevExecutionContext; // Flush the immediate callbacks that were scheduled during this batch.
      // Note that this will happen even if batchedUpdates is higher up
      // the stack.

      flushSyncCallbackQueue();
    }
  }

  function prepareFreshStack(root, expirationTime) {
    root.finishedWork = null;
    root.finishedExpirationTime = NoWork;
    var timeoutHandle = root.timeoutHandle;

    if (timeoutHandle !== noTimeout) {
      // The root previous suspended and scheduled a timeout to commit a fallback
      // state. Now that we have additional work, cancel the timeout.
      root.timeoutHandle = noTimeout; // $FlowFixMe Complains noTimeout is not a TimeoutID, despite the check above

      cancelTimeout(timeoutHandle);
    }

    if (workInProgress !== null) {
      var interruptedWork = workInProgress.return;

      while (interruptedWork !== null) {
        unwindInterruptedWork(interruptedWork);
        interruptedWork = interruptedWork.return;
      }
    }

    workInProgressRoot = root;
    workInProgress = createWorkInProgress(root.current, null);
    renderExpirationTime$1 = expirationTime;
    workInProgressRootExitStatus = RootIncomplete;
    workInProgressRootFatalError = null;
    workInProgressRootLatestProcessedExpirationTime = Sync;
    workInProgressRootLatestSuspenseTimeout = Sync;
    workInProgressRootCanSuspendUsingConfig = null;
    workInProgressRootNextUnprocessedUpdateTime = NoWork;
    workInProgressRootHasPendingPing = false;

    {
      spawnedWorkDuringRender = null;
    }

    {
      ReactStrictModeWarnings.discardPendingWarnings();
    }
  }

  function handleError(root, thrownValue) {
    do {
      try {
        // Reset module-level state that was set during the render phase.
        resetContextDependencies();
        resetHooksAfterThrow();
        resetCurrentFiber();

        if (workInProgress === null || workInProgress.return === null) {
          // Expected to be working on a non-root fiber. This is a fatal error
          // because there's no ancestor that can handle it; the root is
          // supposed to capture all errors that weren't caught by an error
          // boundary.
          workInProgressRootExitStatus = RootFatalErrored;
          workInProgressRootFatalError = thrownValue; // Set `workInProgress` to null. This represents advancing to the next
          // sibling, or the parent if there are no siblings. But since the root
          // has no siblings nor a parent, we set it to null. Usually this is
          // handled by `completeUnitOfWork` or `unwindWork`, but since we're
          // interntionally not calling those, we need set it here.
          // TODO: Consider calling `unwindWork` to pop the contexts.

          workInProgress = null;
          return null;
        }

        if (enableProfilerTimer && workInProgress.mode & ProfileMode) {
          // Record the time spent rendering before an error was thrown. This
          // avoids inaccurate Profiler durations in the case of a
          // suspended render.
          stopProfilerTimerIfRunningAndRecordDelta(workInProgress, true);
        }

        throwException(root, workInProgress.return, workInProgress, thrownValue, renderExpirationTime$1);
        workInProgress = completeUnitOfWork(workInProgress);
      } catch (yetAnotherThrownValue) {
        // Something in the return path also threw.
        thrownValue = yetAnotherThrownValue;
        continue;
      } // Return to the normal work loop.


      return;
    } while (true);
  }

  function pushDispatcher(root) {
    var prevDispatcher = ReactCurrentDispatcher$1.current;
    ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;

    if (prevDispatcher === null) {
      // The React isomorphic package does not include a default dispatcher.
      // Instead the first renderer will lazily attach one, in order to give
      // nicer error messages.
      return ContextOnlyDispatcher;
    } else {
      return prevDispatcher;
    }
  }

  function popDispatcher(prevDispatcher) {
    ReactCurrentDispatcher$1.current = prevDispatcher;
  }

  function pushInteractions(root) {
    {
      var prevInteractions = __interactionsRef.current;
      __interactionsRef.current = root.memoizedInteractions;
      return prevInteractions;
    }
  }

  function popInteractions(prevInteractions) {
    {
      __interactionsRef.current = prevInteractions;
    }
  }

  function markCommitTimeOfFallback() {
    globalMostRecentFallbackTime = now();
  }
  function markRenderEventTimeAndConfig(expirationTime, suspenseConfig) {
    if (expirationTime < workInProgressRootLatestProcessedExpirationTime && expirationTime > Idle) {
      workInProgressRootLatestProcessedExpirationTime = expirationTime;
    }

    if (suspenseConfig !== null) {
      if (expirationTime < workInProgressRootLatestSuspenseTimeout && expirationTime > Idle) {
        workInProgressRootLatestSuspenseTimeout = expirationTime; // Most of the time we only have one config and getting wrong is not bad.

        workInProgressRootCanSuspendUsingConfig = suspenseConfig;
      }
    }
  }
  function markUnprocessedUpdateTime(expirationTime) {
    if (expirationTime > workInProgressRootNextUnprocessedUpdateTime) {
      workInProgressRootNextUnprocessedUpdateTime = expirationTime;
    }
  }
  function renderDidSuspend() {
    if (workInProgressRootExitStatus === RootIncomplete) {
      workInProgressRootExitStatus = RootSuspended;
    }
  }
  function renderDidSuspendDelayIfPossible() {
    if (workInProgressRootExitStatus === RootIncomplete || workInProgressRootExitStatus === RootSuspended) {
      workInProgressRootExitStatus = RootSuspendedWithDelay;
    } // Check if there's a lower priority update somewhere else in the tree.


    if (workInProgressRootNextUnprocessedUpdateTime !== NoWork && workInProgressRoot !== null) {
      // Mark the current render as suspended, and then mark that there's a
      // pending update.
      // TODO: This should immediately interrupt the current render, instead
      // of waiting until the next time we yield.
      markRootSuspendedAtTime(workInProgressRoot, renderExpirationTime$1);
      markRootUpdatedAtTime(workInProgressRoot, workInProgressRootNextUnprocessedUpdateTime);
    }
  }
  function renderDidError() {
    if (workInProgressRootExitStatus !== RootCompleted) {
      workInProgressRootExitStatus = RootErrored;
    }
  } // Called during render to determine if anything has suspended.
  // Returns false if we're not sure.

  function renderHasNotSuspendedYet() {
    // If something errored or completed, we can't really be sure,
    // so those are false.
    return workInProgressRootExitStatus === RootIncomplete;
  }

  function inferTimeFromExpirationTime(expirationTime) {
    // We don't know exactly when the update was scheduled, but we can infer an
    // approximate start time from the expiration time.
    var earliestExpirationTimeMs = expirationTimeToMs(expirationTime);
    return earliestExpirationTimeMs - LOW_PRIORITY_EXPIRATION;
  }

  function inferTimeFromExpirationTimeWithSuspenseConfig(expirationTime, suspenseConfig) {
    // We don't know exactly when the update was scheduled, but we can infer an
    // approximate start time from the expiration time by subtracting the timeout
    // that was added to the event time.
    var earliestExpirationTimeMs = expirationTimeToMs(expirationTime);
    return earliestExpirationTimeMs - (suspenseConfig.timeoutMs | 0 || LOW_PRIORITY_EXPIRATION);
  } // The work loop is an extremely hot path. Tell Closure not to inline it.

  /** @noinline */


  function workLoopSync() {
    // Already timed out, so perform work without checking if we need to yield.
    while (workInProgress !== null) {
      workInProgress = performUnitOfWork(workInProgress);
    }
  }
  /** @noinline */


  function workLoopConcurrent() {
    // Perform work until Scheduler asks us to yield
    while (workInProgress !== null && !shouldYield()) {
      workInProgress = performUnitOfWork(workInProgress);
    }
  }

  function performUnitOfWork(unitOfWork) {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    var current = unitOfWork.alternate;
    startWorkTimer(unitOfWork);
    setCurrentFiber(unitOfWork);
    var next;

    if ( (unitOfWork.mode & ProfileMode) !== NoMode) {
      startProfilerTimer(unitOfWork);
      next = beginWork$1(current, unitOfWork, renderExpirationTime$1);
      stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
    } else {
      next = beginWork$1(current, unitOfWork, renderExpirationTime$1);
    }

    resetCurrentFiber();
    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    if (next === null) {
      // If this doesn't spawn new work, complete the current work.
      next = completeUnitOfWork(unitOfWork);
    }

    ReactCurrentOwner$2.current = null;
    return next;
  }

  function completeUnitOfWork(unitOfWork) {
    // Attempt to complete the current unit of work, then move to the next
    // sibling. If there are no more siblings, return to the parent fiber.
    workInProgress = unitOfWork;

    do {
      // The current, flushed, state of this fiber is the alternate. Ideally
      // nothing should rely on this, but relying on it here means that we don't
      // need an additional field on the work in progress.
      var current = workInProgress.alternate;
      var returnFiber = workInProgress.return; // Check if the work completed or if something threw.

      if ((workInProgress.effectTag & Incomplete) === NoEffect) {
        setCurrentFiber(workInProgress);
        var next = void 0;

        if ( (workInProgress.mode & ProfileMode) === NoMode) {
          next = completeWork(current, workInProgress, renderExpirationTime$1);
        } else {
          startProfilerTimer(workInProgress);
          next = completeWork(current, workInProgress, renderExpirationTime$1); // Update render duration assuming we didn't error.

          stopProfilerTimerIfRunningAndRecordDelta(workInProgress, false);
        }

        stopWorkTimer(workInProgress);
        resetCurrentFiber();
        resetChildExpirationTime(workInProgress);

        if (next !== null) {
          // Completing this fiber spawned new work. Work on that next.
          return next;
        }

        if (returnFiber !== null && // Do not append effects to parents if a sibling failed to complete
        (returnFiber.effectTag & Incomplete) === NoEffect) {
          // Append all the effects of the subtree and this fiber onto the effect
          // list of the parent. The completion order of the children affects the
          // side-effect order.
          if (returnFiber.firstEffect === null) {
            returnFiber.firstEffect = workInProgress.firstEffect;
          }

          if (workInProgress.lastEffect !== null) {
            if (returnFiber.lastEffect !== null) {
              returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
            }

            returnFiber.lastEffect = workInProgress.lastEffect;
          } // If this fiber had side-effects, we append it AFTER the children's
          // side-effects. We can perform certain side-effects earlier if needed,
          // by doing multiple passes over the effect list. We don't want to
          // schedule our own side-effect on our own list because if end up
          // reusing children we'll schedule this effect onto itself since we're
          // at the end.


          var effectTag = workInProgress.effectTag; // Skip both NoWork and PerformedWork tags when creating the effect
          // list. PerformedWork effect is read by React DevTools but shouldn't be
          // committed.

          if (effectTag > PerformedWork) {
            if (returnFiber.lastEffect !== null) {
              returnFiber.lastEffect.nextEffect = workInProgress;
            } else {
              returnFiber.firstEffect = workInProgress;
            }

            returnFiber.lastEffect = workInProgress;
          }
        }
      } else {
        // This fiber did not complete because something threw. Pop values off
        // the stack without entering the complete phase. If this is a boundary,
        // capture values if possible.
        var _next = unwindWork(workInProgress); // Because this fiber did not complete, don't reset its expiration time.


        if ( (workInProgress.mode & ProfileMode) !== NoMode) {
          // Record the render duration for the fiber that errored.
          stopProfilerTimerIfRunningAndRecordDelta(workInProgress, false); // Include the time spent working on failed children before continuing.

          var actualDuration = workInProgress.actualDuration;
          var child = workInProgress.child;

          while (child !== null) {
            actualDuration += child.actualDuration;
            child = child.sibling;
          }

          workInProgress.actualDuration = actualDuration;
        }

        if (_next !== null) {
          // If completing this work spawned new work, do that next. We'll come
          // back here again.
          // Since we're restarting, remove anything that is not a host effect
          // from the effect tag.
          // TODO: The name stopFailedWorkTimer is misleading because Suspense
          // also captures and restarts.
          stopFailedWorkTimer(workInProgress);
          _next.effectTag &= HostEffectMask;
          return _next;
        }

        stopWorkTimer(workInProgress);

        if (returnFiber !== null) {
          // Mark the parent fiber as incomplete and clear its effect list.
          returnFiber.firstEffect = returnFiber.lastEffect = null;
          returnFiber.effectTag |= Incomplete;
        }
      }

      var siblingFiber = workInProgress.sibling;

      if (siblingFiber !== null) {
        // If there is more work to do in this returnFiber, do that next.
        return siblingFiber;
      } // Otherwise, return to the parent


      workInProgress = returnFiber;
    } while (workInProgress !== null); // We've reached the root.


    if (workInProgressRootExitStatus === RootIncomplete) {
      workInProgressRootExitStatus = RootCompleted;
    }

    return null;
  }

  function getRemainingExpirationTime(fiber) {
    var updateExpirationTime = fiber.expirationTime;
    var childExpirationTime = fiber.childExpirationTime;
    return updateExpirationTime > childExpirationTime ? updateExpirationTime : childExpirationTime;
  }

  function resetChildExpirationTime(completedWork) {
    if (renderExpirationTime$1 !== Never && completedWork.childExpirationTime === Never) {
      // The children of this component are hidden. Don't bubble their
      // expiration times.
      return;
    }

    var newChildExpirationTime = NoWork; // Bubble up the earliest expiration time.

    if ( (completedWork.mode & ProfileMode) !== NoMode) {
      // In profiling mode, resetChildExpirationTime is also used to reset
      // profiler durations.
      var actualDuration = completedWork.actualDuration;
      var treeBaseDuration = completedWork.selfBaseDuration; // When a fiber is cloned, its actualDuration is reset to 0. This value will
      // only be updated if work is done on the fiber (i.e. it doesn't bailout).
      // When work is done, it should bubble to the parent's actualDuration. If
      // the fiber has not been cloned though, (meaning no work was done), then
      // this value will reflect the amount of time spent working on a previous
      // render. In that case it should not bubble. We determine whether it was
      // cloned by comparing the child pointer.

      var shouldBubbleActualDurations = completedWork.alternate === null || completedWork.child !== completedWork.alternate.child;
      var child = completedWork.child;

      while (child !== null) {
        var childUpdateExpirationTime = child.expirationTime;
        var childChildExpirationTime = child.childExpirationTime;

        if (childUpdateExpirationTime > newChildExpirationTime) {
          newChildExpirationTime = childUpdateExpirationTime;
        }

        if (childChildExpirationTime > newChildExpirationTime) {
          newChildExpirationTime = childChildExpirationTime;
        }

        if (shouldBubbleActualDurations) {
          actualDuration += child.actualDuration;
        }

        treeBaseDuration += child.treeBaseDuration;
        child = child.sibling;
      }

      completedWork.actualDuration = actualDuration;
      completedWork.treeBaseDuration = treeBaseDuration;
    } else {
      var _child = completedWork.child;

      while (_child !== null) {
        var _childUpdateExpirationTime = _child.expirationTime;
        var _childChildExpirationTime = _child.childExpirationTime;

        if (_childUpdateExpirationTime > newChildExpirationTime) {
          newChildExpirationTime = _childUpdateExpirationTime;
        }

        if (_childChildExpirationTime > newChildExpirationTime) {
          newChildExpirationTime = _childChildExpirationTime;
        }

        _child = _child.sibling;
      }
    }

    completedWork.childExpirationTime = newChildExpirationTime;
  }

  function commitRoot(root) {
    var renderPriorityLevel = getCurrentPriorityLevel();
    runWithPriority$1(ImmediatePriority, commitRootImpl.bind(null, root, renderPriorityLevel));
    return null;
  }

  function commitRootImpl(root, renderPriorityLevel) {
    do {
      // `flushPassiveEffects` will call `flushSyncUpdateQueue` at the end, which
      // means `flushPassiveEffects` will sometimes result in additional
      // passive effects. So we need to keep flushing in a loop until there are
      // no more pending effects.
      // TODO: Might be better if `flushPassiveEffects` did not automatically
      // flush synchronous work at the end, to avoid factoring hazards like this.
      flushPassiveEffects();
    } while (rootWithPendingPassiveEffects !== null);

    flushRenderPhaseStrictModeWarningsInDEV();

    if (!((executionContext & (RenderContext | CommitContext)) === NoContext)) {
      {
        throw Error( "Should not already be working." );
      }
    }

    var finishedWork = root.finishedWork;
    var expirationTime = root.finishedExpirationTime;

    if (finishedWork === null) {
      return null;
    }

    root.finishedWork = null;
    root.finishedExpirationTime = NoWork;

    if (!(finishedWork !== root.current)) {
      {
        throw Error( "Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue." );
      }
    } // commitRoot never returns a continuation; it always finishes synchronously.
    // So we can clear these now to allow a new callback to be scheduled.


    root.callbackNode = null;
    root.callbackExpirationTime = NoWork;
    root.callbackPriority = NoPriority;
    root.nextKnownPendingLevel = NoWork;
    startCommitTimer(); // Update the first and last pending times on this root. The new first
    // pending time is whatever is left on the root fiber.

    var remainingExpirationTimeBeforeCommit = getRemainingExpirationTime(finishedWork);
    markRootFinishedAtTime(root, expirationTime, remainingExpirationTimeBeforeCommit);

    if (root === workInProgressRoot) {
      // We can reset these now that they are finished.
      workInProgressRoot = null;
      workInProgress = null;
      renderExpirationTime$1 = NoWork;
    } // This indicates that the last root we worked on is not the same one that
    // we're committing now. This most commonly happens when a suspended root
    // times out.
    // Get the list of effects.


    var firstEffect;

    if (finishedWork.effectTag > PerformedWork) {
      // A fiber's effect list consists only of its children, not itself. So if
      // the root has an effect, we need to add it to the end of the list. The
      // resulting list is the set that would belong to the root's parent, if it
      // had one; that is, all the effects in the tree including the root.
      if (finishedWork.lastEffect !== null) {
        finishedWork.lastEffect.nextEffect = finishedWork;
        firstEffect = finishedWork.firstEffect;
      } else {
        firstEffect = finishedWork;
      }
    } else {
      // There is no effect on the root.
      firstEffect = finishedWork.firstEffect;
    }

    if (firstEffect !== null) {
      var prevExecutionContext = executionContext;
      executionContext |= CommitContext;
      var prevInteractions = pushInteractions(root); // Reset this to null before calling lifecycles

      ReactCurrentOwner$2.current = null; // The commit phase is broken into several sub-phases. We do a separate pass
      // of the effect list for each phase: all mutation effects come before all
      // layout effects, and so on.
      // The first phase a "before mutation" phase. We use this phase to read the
      // state of the host tree right before we mutate it. This is where
      // getSnapshotBeforeUpdate is called.

      startCommitSnapshotEffectsTimer();
      prepareForCommit(root.containerInfo);
      nextEffect = firstEffect;

      do {
        {
          invokeGuardedCallback(null, commitBeforeMutationEffects, null);

          if (hasCaughtError()) {
            if (!(nextEffect !== null)) {
              {
                throw Error( "Should be working on an effect." );
              }
            }

            var error = clearCaughtError();
            captureCommitPhaseError(nextEffect, error);
            nextEffect = nextEffect.nextEffect;
          }
        }
      } while (nextEffect !== null);

      stopCommitSnapshotEffectsTimer();

      {
        // Mark the current commit time to be shared by all Profilers in this
        // batch. This enables them to be grouped later.
        recordCommitTime();
      } // The next phase is the mutation phase, where we mutate the host tree.


      startCommitHostEffectsTimer();
      nextEffect = firstEffect;

      do {
        {
          invokeGuardedCallback(null, commitMutationEffects, null, root, renderPriorityLevel);

          if (hasCaughtError()) {
            if (!(nextEffect !== null)) {
              {
                throw Error( "Should be working on an effect." );
              }
            }

            var _error = clearCaughtError();

            captureCommitPhaseError(nextEffect, _error);
            nextEffect = nextEffect.nextEffect;
          }
        }
      } while (nextEffect !== null);

      stopCommitHostEffectsTimer();
      resetAfterCommit(root.containerInfo); // The work-in-progress tree is now the current tree. This must come after
      // the mutation phase, so that the previous tree is still current during
      // componentWillUnmount, but before the layout phase, so that the finished
      // work is current during componentDidMount/Update.

      root.current = finishedWork; // The next phase is the layout phase, where we call effects that read
      // the host tree after it's been mutated. The idiomatic use case for this is
      // layout, but class component lifecycles also fire here for legacy reasons.

      startCommitLifeCyclesTimer();
      nextEffect = firstEffect;

      do {
        {
          invokeGuardedCallback(null, commitLayoutEffects, null, root, expirationTime);

          if (hasCaughtError()) {
            if (!(nextEffect !== null)) {
              {
                throw Error( "Should be working on an effect." );
              }
            }

            var _error2 = clearCaughtError();

            captureCommitPhaseError(nextEffect, _error2);
            nextEffect = nextEffect.nextEffect;
          }
        }
      } while (nextEffect !== null);

      stopCommitLifeCyclesTimer();
      nextEffect = null; // Tell Scheduler to yield at the end of the frame, so the browser has an
      // opportunity to paint.

      requestPaint();

      {
        popInteractions(prevInteractions);
      }

      executionContext = prevExecutionContext;
    } else {
      // No effects.
      root.current = finishedWork; // Measure these anyway so the flamegraph explicitly shows that there were
      // no effects.
      // TODO: Maybe there's a better way to report this.

      startCommitSnapshotEffectsTimer();
      stopCommitSnapshotEffectsTimer();

      {
        recordCommitTime();
      }

      startCommitHostEffectsTimer();
      stopCommitHostEffectsTimer();
      startCommitLifeCyclesTimer();
      stopCommitLifeCyclesTimer();
    }

    stopCommitTimer();
    var rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

    if (rootDoesHavePassiveEffects) {
      // This commit has passive effects. Stash a reference to them. But don't
      // schedule a callback until after flushing layout work.
      rootDoesHavePassiveEffects = false;
      rootWithPendingPassiveEffects = root;
      pendingPassiveEffectsExpirationTime = expirationTime;
      pendingPassiveEffectsRenderPriority = renderPriorityLevel;
    } else {
      // We are done with the effect chain at this point so let's clear the
      // nextEffect pointers to assist with GC. If we have passive effects, we'll
      // clear this in flushPassiveEffects.
      nextEffect = firstEffect;

      while (nextEffect !== null) {
        var nextNextEffect = nextEffect.nextEffect;
        nextEffect.nextEffect = null;
        nextEffect = nextNextEffect;
      }
    } // Check if there's remaining work on this root


    var remainingExpirationTime = root.firstPendingTime;

    if (remainingExpirationTime !== NoWork) {
      {
        if (spawnedWorkDuringRender !== null) {
          var expirationTimes = spawnedWorkDuringRender;
          spawnedWorkDuringRender = null;

          for (var i = 0; i < expirationTimes.length; i++) {
            scheduleInteractions(root, expirationTimes[i], root.memoizedInteractions);
          }
        }

        schedulePendingInteractions(root, remainingExpirationTime);
      }
    } else {
      // If there's no remaining work, we can clear the set of already failed
      // error boundaries.
      legacyErrorBoundariesThatAlreadyFailed = null;
    }

    {
      if (!rootDidHavePassiveEffects) {
        // If there are no passive effects, then we can complete the pending interactions.
        // Otherwise, we'll wait until after the passive effects are flushed.
        // Wait to do this until after remaining work has been scheduled,
        // so that we don't prematurely signal complete for interactions when there's e.g. hidden work.
        finishPendingInteractions(root, expirationTime);
      }
    }

    if (remainingExpirationTime === Sync) {
      // Count the number of times the root synchronously re-renders without
      // finishing. If there are too many, it indicates an infinite update loop.
      if (root === rootWithNestedUpdates) {
        nestedUpdateCount++;
      } else {
        nestedUpdateCount = 0;
        rootWithNestedUpdates = root;
      }
    } else {
      nestedUpdateCount = 0;
    }

    onCommitRoot(finishedWork.stateNode, expirationTime); // Always call this before exiting `commitRoot`, to ensure that any
    // additional work on this root is scheduled.

    ensureRootIsScheduled(root);

    if (hasUncaughtError) {
      hasUncaughtError = false;
      var _error3 = firstUncaughtError;
      firstUncaughtError = null;
      throw _error3;
    }

    if ((executionContext & LegacyUnbatchedContext) !== NoContext) {
      // This is a legacy edge case. We just committed the initial mount of
      // a ReactDOM.render-ed root inside of batchedUpdates. The commit fired
      // synchronously, but layout updates should be deferred until the end
      // of the batch.
      return null;
    } // If layout work was scheduled, flush it now.


    flushSyncCallbackQueue();
    return null;
  }

  function commitBeforeMutationEffects() {
    while (nextEffect !== null) {
      var effectTag = nextEffect.effectTag;

      if ((effectTag & Snapshot) !== NoEffect) {
        setCurrentFiber(nextEffect);
        recordEffect();
        var current = nextEffect.alternate;
        commitBeforeMutationLifeCycles(current, nextEffect);
        resetCurrentFiber();
      }

      if ((effectTag & Passive) !== NoEffect) {
        // If there are passive effects, schedule a callback to flush at
        // the earliest opportunity.
        if (!rootDoesHavePassiveEffects) {
          rootDoesHavePassiveEffects = true;
          scheduleCallback(NormalPriority, function () {
            flushPassiveEffects();
            return null;
          });
        }
      }

      nextEffect = nextEffect.nextEffect;
    }
  }

  function commitMutationEffects(root, renderPriorityLevel) {
    // TODO: Should probably move the bulk of this function to commitWork.
    while (nextEffect !== null) {
      setCurrentFiber(nextEffect);
      var effectTag = nextEffect.effectTag;

      if (effectTag & ContentReset) {
        commitResetTextContent(nextEffect);
      }

      if (effectTag & Ref) {
        var current = nextEffect.alternate;

        if (current !== null) {
          commitDetachRef(current);
        }
      } // The following switch statement is only concerned about placement,
      // updates, and deletions. To avoid needing to add a case for every possible
      // bitmap value, we remove the secondary effects from the effect tag and
      // switch on that value.


      var primaryEffectTag = effectTag & (Placement | Update | Deletion | Hydrating);

      switch (primaryEffectTag) {
        case Placement:
          {
            commitPlacement(nextEffect); // Clear the "placement" from effect tag so that we know that this is
            // inserted, before any life-cycles like componentDidMount gets called.
            // TODO: findDOMNode doesn't rely on this any more but isMounted does
            // and isMounted is deprecated anyway so we should be able to kill this.

            nextEffect.effectTag &= ~Placement;
            break;
          }

        case PlacementAndUpdate:
          {
            // Placement
            commitPlacement(nextEffect); // Clear the "placement" from effect tag so that we know that this is
            // inserted, before any life-cycles like componentDidMount gets called.

            nextEffect.effectTag &= ~Placement; // Update

            var _current = nextEffect.alternate;
            commitWork(_current, nextEffect);
            break;
          }

        case Hydrating:
          {
            nextEffect.effectTag &= ~Hydrating;
            break;
          }

        case HydratingAndUpdate:
          {
            nextEffect.effectTag &= ~Hydrating; // Update

            var _current2 = nextEffect.alternate;
            commitWork(_current2, nextEffect);
            break;
          }

        case Update:
          {
            var _current3 = nextEffect.alternate;
            commitWork(_current3, nextEffect);
            break;
          }

        case Deletion:
          {
            commitDeletion(root, nextEffect, renderPriorityLevel);
            break;
          }
      } // TODO: Only record a mutation effect if primaryEffectTag is non-zero.


      recordEffect();
      resetCurrentFiber();
      nextEffect = nextEffect.nextEffect;
    }
  }

  function commitLayoutEffects(root, committedExpirationTime) {
    // TODO: Should probably move the bulk of this function to commitWork.
    while (nextEffect !== null) {
      setCurrentFiber(nextEffect);
      var effectTag = nextEffect.effectTag;

      if (effectTag & (Update | Callback)) {
        recordEffect();
        var current = nextEffect.alternate;
        commitLifeCycles(root, current, nextEffect);
      }

      if (effectTag & Ref) {
        recordEffect();
        commitAttachRef(nextEffect);
      }

      resetCurrentFiber();
      nextEffect = nextEffect.nextEffect;
    }
  }

  function flushPassiveEffects() {
    if (pendingPassiveEffectsRenderPriority !== NoPriority) {
      var priorityLevel = pendingPassiveEffectsRenderPriority > NormalPriority ? NormalPriority : pendingPassiveEffectsRenderPriority;
      pendingPassiveEffectsRenderPriority = NoPriority;
      return runWithPriority$1(priorityLevel, flushPassiveEffectsImpl);
    }
  }

  function flushPassiveEffectsImpl() {
    if (rootWithPendingPassiveEffects === null) {
      return false;
    }

    var root = rootWithPendingPassiveEffects;
    var expirationTime = pendingPassiveEffectsExpirationTime;
    rootWithPendingPassiveEffects = null;
    pendingPassiveEffectsExpirationTime = NoWork;

    if (!((executionContext & (RenderContext | CommitContext)) === NoContext)) {
      {
        throw Error( "Cannot flush passive effects while already rendering." );
      }
    }

    var prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    var prevInteractions = pushInteractions(root);

    {
      // Note: This currently assumes there are no passive effects on the root fiber
      // because the root is not part of its own effect list.
      // This could change in the future.
      var _effect2 = root.current.firstEffect;

      while (_effect2 !== null) {
        {
          setCurrentFiber(_effect2);
          invokeGuardedCallback(null, commitPassiveHookEffects, null, _effect2);

          if (hasCaughtError()) {
            if (!(_effect2 !== null)) {
              {
                throw Error( "Should be working on an effect." );
              }
            }

            var _error5 = clearCaughtError();

            captureCommitPhaseError(_effect2, _error5);
          }

          resetCurrentFiber();
        }

        var nextNextEffect = _effect2.nextEffect; // Remove nextEffect pointer to assist GC

        _effect2.nextEffect = null;
        _effect2 = nextNextEffect;
      }
    }

    {
      popInteractions(prevInteractions);
      finishPendingInteractions(root, expirationTime);
    }

    executionContext = prevExecutionContext;
    flushSyncCallbackQueue(); // If additional passive effects were scheduled, increment a counter. If this
    // exceeds the limit, we'll fire a warning.

    nestedPassiveUpdateCount = rootWithPendingPassiveEffects === null ? 0 : nestedPassiveUpdateCount + 1;
    return true;
  }

  function isAlreadyFailedLegacyErrorBoundary(instance) {
    return legacyErrorBoundariesThatAlreadyFailed !== null && legacyErrorBoundariesThatAlreadyFailed.has(instance);
  }
  function markLegacyErrorBoundaryAsFailed(instance) {
    if (legacyErrorBoundariesThatAlreadyFailed === null) {
      legacyErrorBoundariesThatAlreadyFailed = new Set([instance]);
    } else {
      legacyErrorBoundariesThatAlreadyFailed.add(instance);
    }
  }

  function prepareToThrowUncaughtError(error) {
    if (!hasUncaughtError) {
      hasUncaughtError = true;
      firstUncaughtError = error;
    }
  }

  var onUncaughtError = prepareToThrowUncaughtError;

  function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
    var errorInfo = createCapturedValue(error, sourceFiber);
    var update = createRootErrorUpdate(rootFiber, errorInfo, Sync);
    enqueueUpdate(rootFiber, update);
    var root = markUpdateTimeFromFiberToRoot(rootFiber, Sync);

    if (root !== null) {
      ensureRootIsScheduled(root);
      schedulePendingInteractions(root, Sync);
    }
  }

  function captureCommitPhaseError(sourceFiber, error) {
    if (sourceFiber.tag === HostRoot) {
      // Error was thrown at the root. There is no parent, so the root
      // itself should capture it.
      captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
      return;
    }

    var fiber = sourceFiber.return;

    while (fiber !== null) {
      if (fiber.tag === HostRoot) {
        captureCommitPhaseErrorOnRoot(fiber, sourceFiber, error);
        return;
      } else if (fiber.tag === ClassComponent) {
        var ctor = fiber.type;
        var instance = fiber.stateNode;

        if (typeof ctor.getDerivedStateFromError === 'function' || typeof instance.componentDidCatch === 'function' && !isAlreadyFailedLegacyErrorBoundary(instance)) {
          var errorInfo = createCapturedValue(error, sourceFiber);
          var update = createClassErrorUpdate(fiber, errorInfo, // TODO: This is always sync
          Sync);
          enqueueUpdate(fiber, update);
          var root = markUpdateTimeFromFiberToRoot(fiber, Sync);

          if (root !== null) {
            ensureRootIsScheduled(root);
            schedulePendingInteractions(root, Sync);
          }

          return;
        }
      }

      fiber = fiber.return;
    }
  }
  function pingSuspendedRoot(root, thenable, suspendedTime) {
    var pingCache = root.pingCache;

    if (pingCache !== null) {
      // The thenable resolved, so we no longer need to memoize, because it will
      // never be thrown again.
      pingCache.delete(thenable);
    }

    if (workInProgressRoot === root && renderExpirationTime$1 === suspendedTime) {
      // Received a ping at the same priority level at which we're currently
      // rendering. We might want to restart this render. This should mirror
      // the logic of whether or not a root suspends once it completes.
      // TODO: If we're rendering sync either due to Sync, Batched or expired,
      // we should probably never restart.
      // If we're suspended with delay, we'll always suspend so we can always
      // restart. If we're suspended without any updates, it might be a retry.
      // If it's early in the retry we can restart. We can't know for sure
      // whether we'll eventually process an update during this render pass,
      // but it's somewhat unlikely that we get to a ping before that, since
      // getting to the root most update is usually very fast.
      if (workInProgressRootExitStatus === RootSuspendedWithDelay || workInProgressRootExitStatus === RootSuspended && workInProgressRootLatestProcessedExpirationTime === Sync && now() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS) {
        // Restart from the root. Don't need to schedule a ping because
        // we're already working on this tree.
        prepareFreshStack(root, renderExpirationTime$1);
      } else {
        // Even though we can't restart right now, we might get an
        // opportunity later. So we mark this render as having a ping.
        workInProgressRootHasPendingPing = true;
      }

      return;
    }

    if (!isRootSuspendedAtTime(root, suspendedTime)) {
      // The root is no longer suspended at this time.
      return;
    }

    var lastPingedTime = root.lastPingedTime;

    if (lastPingedTime !== NoWork && lastPingedTime < suspendedTime) {
      // There's already a lower priority ping scheduled.
      return;
    } // Mark the time at which this ping was scheduled.


    root.lastPingedTime = suspendedTime;

    ensureRootIsScheduled(root);
    schedulePendingInteractions(root, suspendedTime);
  }

  function retryTimedOutBoundary(boundaryFiber, retryTime) {
    // The boundary fiber (a Suspense component or SuspenseList component)
    // previously was rendered in its fallback state. One of the promises that
    // suspended it has resolved, which means at least part of the tree was
    // likely unblocked. Try rendering again, at a new expiration time.
    if (retryTime === NoWork) {
      var suspenseConfig = null; // Retries don't carry over the already committed update.

      var currentTime = requestCurrentTimeForUpdate();
      retryTime = computeExpirationForFiber(currentTime, boundaryFiber, suspenseConfig);
    } // TODO: Special case idle priority?


    var root = markUpdateTimeFromFiberToRoot(boundaryFiber, retryTime);

    if (root !== null) {
      ensureRootIsScheduled(root);
      schedulePendingInteractions(root, retryTime);
    }
  }
  function resolveRetryThenable(boundaryFiber, thenable) {
    var retryTime = NoWork; // Default

    var retryCache;

    {
      retryCache = boundaryFiber.stateNode;
    }

    if (retryCache !== null) {
      // The thenable resolved, so we no longer need to memoize, because it will
      // never be thrown again.
      retryCache.delete(thenable);
    }

    retryTimedOutBoundary(boundaryFiber, retryTime);
  } // Computes the next Just Noticeable Difference (JND) boundary.
  // The theory is that a person can't tell the difference between small differences in time.
  // Therefore, if we wait a bit longer than necessary that won't translate to a noticeable
  // difference in the experience. However, waiting for longer might mean that we can avoid
  // showing an intermediate loading state. The longer we have already waited, the harder it
  // is to tell small differences in time. Therefore, the longer we've already waited,
  // the longer we can wait additionally. At some point we have to give up though.
  // We pick a train model where the next boundary commits at a consistent schedule.
  // These particular numbers are vague estimates. We expect to adjust them based on research.

  function jnd(timeElapsed) {
    return timeElapsed < 120 ? 120 : timeElapsed < 480 ? 480 : timeElapsed < 1080 ? 1080 : timeElapsed < 1920 ? 1920 : timeElapsed < 3000 ? 3000 : timeElapsed < 4320 ? 4320 : ceil(timeElapsed / 1960) * 1960;
  }

  function computeMsUntilSuspenseLoadingDelay(mostRecentEventTime, committedExpirationTime, suspenseConfig) {
    var busyMinDurationMs = suspenseConfig.busyMinDurationMs | 0;

    if (busyMinDurationMs <= 0) {
      return 0;
    }

    var busyDelayMs = suspenseConfig.busyDelayMs | 0; // Compute the time until this render pass would expire.

    var currentTimeMs = now();
    var eventTimeMs = inferTimeFromExpirationTimeWithSuspenseConfig(mostRecentEventTime, suspenseConfig);
    var timeElapsed = currentTimeMs - eventTimeMs;

    if (timeElapsed <= busyDelayMs) {
      // If we haven't yet waited longer than the initial delay, we don't
      // have to wait any additional time.
      return 0;
    }

    var msUntilTimeout = busyDelayMs + busyMinDurationMs - timeElapsed; // This is the value that is passed to `setTimeout`.

    return msUntilTimeout;
  }

  function checkForNestedUpdates() {
    if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
      nestedUpdateCount = 0;
      rootWithNestedUpdates = null;

      {
        {
          throw Error( "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops." );
        }
      }
    }

    {
      if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
        nestedPassiveUpdateCount = 0;

        error('Maximum update depth exceeded. This can happen when a component ' + "calls setState inside useEffect, but useEffect either doesn't " + 'have a dependency array, or one of the dependencies changes on ' + 'every render.');
      }
    }
  }

  function flushRenderPhaseStrictModeWarningsInDEV() {
    {
      ReactStrictModeWarnings.flushLegacyContextWarning();

      {
        ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
      }
    }
  }

  function stopFinishedWorkLoopTimer() {
    var didCompleteRoot = true;
    stopWorkLoopTimer(interruptedBy, didCompleteRoot);
    interruptedBy = null;
  }

  function stopInterruptedWorkLoopTimer() {
    // TODO: Track which fiber caused the interruption.
    var didCompleteRoot = false;
    stopWorkLoopTimer(interruptedBy, didCompleteRoot);
    interruptedBy = null;
  }

  function checkForInterruption(fiberThatReceivedUpdate, updateExpirationTime) {
    if ( workInProgressRoot !== null && updateExpirationTime > renderExpirationTime$1) {
      interruptedBy = fiberThatReceivedUpdate;
    }
  }

  var didWarnStateUpdateForUnmountedComponent = null;

  function warnAboutUpdateOnUnmountedFiberInDEV(fiber) {
    {
      var tag = fiber.tag;

      if (tag !== HostRoot && tag !== ClassComponent && tag !== FunctionComponent && tag !== ForwardRef && tag !== MemoComponent && tag !== SimpleMemoComponent && tag !== Block) {
        // Only warn for user-defined components, not internal ones like Suspense.
        return;
      }
      // the problematic code almost always lies inside that component.


      var componentName = getComponentName(fiber.type) || 'ReactComponent';

      if (didWarnStateUpdateForUnmountedComponent !== null) {
        if (didWarnStateUpdateForUnmountedComponent.has(componentName)) {
          return;
        }

        didWarnStateUpdateForUnmountedComponent.add(componentName);
      } else {
        didWarnStateUpdateForUnmountedComponent = new Set([componentName]);
      }

      error("Can't perform a React state update on an unmounted component. This " + 'is a no-op, but it indicates a memory leak in your application. To ' + 'fix, cancel all subscriptions and asynchronous tasks in %s.%s', tag === ClassComponent ? 'the componentWillUnmount method' : 'a useEffect cleanup function', getStackByFiberInDevAndProd(fiber));
    }
  }

  var beginWork$1;

  {
    var dummyFiber = null;

    beginWork$1 = function (current, unitOfWork, expirationTime) {
      // If a component throws an error, we replay it again in a synchronously
      // dispatched event, so that the debugger will treat it as an uncaught
      // error See ReactErrorUtils for more information.
      // Before entering the begin phase, copy the work-in-progress onto a dummy
      // fiber. If beginWork throws, we'll use this to reset the state.
      var originalWorkInProgressCopy = assignFiberPropertiesInDEV(dummyFiber, unitOfWork);

      try {
        return beginWork(current, unitOfWork, expirationTime);
      } catch (originalError) {
        if (originalError !== null && typeof originalError === 'object' && typeof originalError.then === 'function') {
          // Don't replay promises. Treat everything else like an error.
          throw originalError;
        } // Keep this code in sync with handleError; any changes here must have
        // corresponding changes there.


        resetContextDependencies();
        resetHooksAfterThrow(); // Don't reset current debug fiber, since we're about to work on the
        // same fiber again.
        // Unwind the failed stack frame

        unwindInterruptedWork(unitOfWork); // Restore the original properties of the fiber.

        assignFiberPropertiesInDEV(unitOfWork, originalWorkInProgressCopy);

        if ( unitOfWork.mode & ProfileMode) {
          // Reset the profiler timer.
          startProfilerTimer(unitOfWork);
        } // Run beginWork again.


        invokeGuardedCallback(null, beginWork, null, current, unitOfWork, expirationTime);

        if (hasCaughtError()) {
          var replayError = clearCaughtError(); // `invokeGuardedCallback` sometimes sets an expando `_suppressLogging`.
          // Rethrow this error instead of the original one.

          throw replayError;
        } else {
          // This branch is reachable if the render phase is impure.
          throw originalError;
        }
      }
    };
  }

  var didWarnAboutUpdateInRender = false;
  var didWarnAboutUpdateInRenderForAnotherComponent;

  {
    didWarnAboutUpdateInRenderForAnotherComponent = new Set();
  }

  function warnAboutRenderPhaseUpdatesInDEV(fiber) {
    {
      if (isRendering && (executionContext & RenderContext) !== NoContext) {
        switch (fiber.tag) {
          case FunctionComponent:
          case ForwardRef:
          case SimpleMemoComponent:
            {
              var renderingComponentName = workInProgress && getComponentName(workInProgress.type) || 'Unknown'; // Dedupe by the rendering component because it's the one that needs to be fixed.

              var dedupeKey = renderingComponentName;

              if (!didWarnAboutUpdateInRenderForAnotherComponent.has(dedupeKey)) {
                didWarnAboutUpdateInRenderForAnotherComponent.add(dedupeKey);
                var setStateComponentName = getComponentName(fiber.type) || 'Unknown';

                error('Cannot update a component (`%s`) while rendering a ' + 'different component (`%s`). To locate the bad setState() call inside `%s`, ' + 'follow the stack trace as described in https://fb.me/setstate-in-render', setStateComponentName, renderingComponentName, renderingComponentName);
              }

              break;
            }

          case ClassComponent:
            {
              if (!didWarnAboutUpdateInRender) {
                error('Cannot update during an existing state transition (such as ' + 'within `render`). Render methods should be a pure ' + 'function of props and state.');

                didWarnAboutUpdateInRender = true;
              }

              break;
            }
        }
      }
    }
  } // a 'shared' variable that changes when act() opens/closes in tests.


  var IsThisRendererActing = {
    current: false
  };
  function warnIfNotScopedWithMatchingAct(fiber) {
    {
      if ( IsSomeRendererActing.current === true && IsThisRendererActing.current !== true) {
        error("It looks like you're using the wrong act() around your test interactions.\n" + 'Be sure to use the matching version of act() corresponding to your renderer:\n\n' + '// for react-dom:\n' + "import {act} from 'react-dom/test-utils';\n" + '// ...\n' + 'act(() => ...);\n\n' + '// for react-test-renderer:\n' + "import TestRenderer from 'react-test-renderer';\n" + 'const {act} = TestRenderer;\n' + '// ...\n' + 'act(() => ...);' + '%s', getStackByFiberInDevAndProd(fiber));
      }
    }
  }
  function warnIfNotCurrentlyActingEffectsInDEV(fiber) {
    {
      if ( (fiber.mode & StrictMode) !== NoMode && IsSomeRendererActing.current === false && IsThisRendererActing.current === false) {
        error('An update to %s ran an effect, but was not wrapped in act(...).\n\n' + 'When testing, code that causes React state updates should be ' + 'wrapped into act(...):\n\n' + 'act(() => {\n' + '  /* fire events that update state */\n' + '});\n' + '/* assert on the output */\n\n' + "This ensures that you're testing the behavior the user would see " + 'in the browser.' + ' Learn more at https://fb.me/react-wrap-tests-with-act' + '%s', getComponentName(fiber.type), getStackByFiberInDevAndProd(fiber));
      }
    }
  }

  function warnIfNotCurrentlyActingUpdatesInDEV(fiber) {
    {
      if ( executionContext === NoContext && IsSomeRendererActing.current === false && IsThisRendererActing.current === false) {
        error('An update to %s inside a test was not wrapped in act(...).\n\n' + 'When testing, code that causes React state updates should be ' + 'wrapped into act(...):\n\n' + 'act(() => {\n' + '  /* fire events that update state */\n' + '});\n' + '/* assert on the output */\n\n' + "This ensures that you're testing the behavior the user would see " + 'in the browser.' + ' Learn more at https://fb.me/react-wrap-tests-with-act' + '%s', getComponentName(fiber.type), getStackByFiberInDevAndProd(fiber));
      }
    }
  }

  var warnIfNotCurrentlyActingUpdatesInDev = warnIfNotCurrentlyActingUpdatesInDEV; // In tests, we want to enforce a mocked scheduler.

  var didWarnAboutUnmockedScheduler = false; // TODO Before we release concurrent mode, revisit this and decide whether a mocked
  // scheduler is the actual recommendation. The alternative could be a testing build,
  // a new lib, or whatever; we dunno just yet. This message is for early adopters
  // to get their tests right.

  function warnIfUnmockedScheduler(fiber) {
    {
      if (didWarnAboutUnmockedScheduler === false && unstable_flushAllWithoutAsserting === undefined) {
        if (fiber.mode & BlockingMode || fiber.mode & ConcurrentMode) {
          didWarnAboutUnmockedScheduler = true;

          error('In Concurrent or Sync modes, the "scheduler" module needs to be mocked ' + 'to guarantee consistent behaviour across tests and browsers. ' + 'For example, with jest: \n' + "jest.mock('scheduler', () => require('scheduler/unstable_mock'));\n\n" + 'For more info, visit https://fb.me/react-mock-scheduler');
        }
      }
    }
  }

  function computeThreadID(root, expirationTime) {
    // Interaction threads are unique per root and expiration time.
    return expirationTime * 1000 + root.interactionThreadID;
  }

  function markSpawnedWork(expirationTime) {

    if (spawnedWorkDuringRender === null) {
      spawnedWorkDuringRender = [expirationTime];
    } else {
      spawnedWorkDuringRender.push(expirationTime);
    }
  }

  function scheduleInteractions(root, expirationTime, interactions) {

    if (interactions.size > 0) {
      var pendingInteractionMap = root.pendingInteractionMap;
      var pendingInteractions = pendingInteractionMap.get(expirationTime);

      if (pendingInteractions != null) {
        interactions.forEach(function (interaction) {
          if (!pendingInteractions.has(interaction)) {
            // Update the pending async work count for previously unscheduled interaction.
            interaction.__count++;
          }

          pendingInteractions.add(interaction);
        });
      } else {
        pendingInteractionMap.set(expirationTime, new Set(interactions)); // Update the pending async work count for the current interactions.

        interactions.forEach(function (interaction) {
          interaction.__count++;
        });
      }

      var subscriber = __subscriberRef.current;

      if (subscriber !== null) {
        var threadID = computeThreadID(root, expirationTime);
        subscriber.onWorkScheduled(interactions, threadID);
      }
    }
  }

  function schedulePendingInteractions(root, expirationTime) {

    scheduleInteractions(root, expirationTime, __interactionsRef.current);
  }

  function startWorkOnPendingInteractions(root, expirationTime) {
    // we can accurately attribute time spent working on it, And so that cascading
    // work triggered during the render phase will be associated with it.


    var interactions = new Set();
    root.pendingInteractionMap.forEach(function (scheduledInteractions, scheduledExpirationTime) {
      if (scheduledExpirationTime >= expirationTime) {
        scheduledInteractions.forEach(function (interaction) {
          return interactions.add(interaction);
        });
      }
    }); // Store the current set of interactions on the FiberRoot for a few reasons:
    // We can re-use it in hot functions like performConcurrentWorkOnRoot()
    // without having to recalculate it. We will also use it in commitWork() to
    // pass to any Profiler onRender() hooks. This also provides DevTools with a
    // way to access it when the onCommitRoot() hook is called.

    root.memoizedInteractions = interactions;

    if (interactions.size > 0) {
      var subscriber = __subscriberRef.current;

      if (subscriber !== null) {
        var threadID = computeThreadID(root, expirationTime);

        try {
          subscriber.onWorkStarted(interactions, threadID);
        } catch (error) {
          // If the subscriber throws, rethrow it in a separate task
          scheduleCallback(ImmediatePriority, function () {
            throw error;
          });
        }
      }
    }
  }

  function finishPendingInteractions(root, committedExpirationTime) {

    var earliestRemainingTimeAfterCommit = root.firstPendingTime;
    var subscriber;

    try {
      subscriber = __subscriberRef.current;

      if (subscriber !== null && root.memoizedInteractions.size > 0) {
        var threadID = computeThreadID(root, committedExpirationTime);
        subscriber.onWorkStopped(root.memoizedInteractions, threadID);
      }
    } catch (error) {
      // If the subscriber throws, rethrow it in a separate task
      scheduleCallback(ImmediatePriority, function () {
        throw error;
      });
    } finally {
      // Clear completed interactions from the pending Map.
      // Unless the render was suspended or cascading work was scheduled,
      // In which case– leave pending interactions until the subsequent render.
      var pendingInteractionMap = root.pendingInteractionMap;
      pendingInteractionMap.forEach(function (scheduledInteractions, scheduledExpirationTime) {
        // Only decrement the pending interaction count if we're done.
        // If there's still work at the current priority,
        // That indicates that we are waiting for suspense data.
        if (scheduledExpirationTime > earliestRemainingTimeAfterCommit) {
          pendingInteractionMap.delete(scheduledExpirationTime);
          scheduledInteractions.forEach(function (interaction) {
            interaction.__count--;

            if (subscriber !== null && interaction.__count === 0) {
              try {
                subscriber.onInteractionScheduledWorkCompleted(interaction);
              } catch (error) {
                // If the subscriber throws, rethrow it in a separate task
                scheduleCallback(ImmediatePriority, function () {
                  throw error;
                });
              }
            }
          });
        }
      });
    }
  }

  var onScheduleFiberRoot = null;
  var onCommitFiberRoot = null;
  var onCommitFiberUnmount = null;
  var hasLoggedError = false;
  var isDevToolsPresent = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
  function injectInternals(internals) {
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
      // No DevTools
      return false;
    }

    var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;

    if (hook.isDisabled) {
      // This isn't a real property on the hook, but it can be set to opt out
      // of DevTools integration and associated warnings and logs.
      // https://github.com/facebook/react/issues/3877
      return true;
    }

    if (!hook.supportsFiber) {
      {
        error('The installed version of React DevTools is too old and will not work ' + 'with the current version of React. Please update React DevTools. ' + 'https://fb.me/react-devtools');
      } // DevTools exists, even though it doesn't support Fiber.


      return true;
    }

    try {
      var rendererID = hook.inject(internals); // We have successfully injected, so now it is safe to set up hooks.

      if (true) {
        // Only used by Fast Refresh
        if (typeof hook.onScheduleFiberRoot === 'function') {
          onScheduleFiberRoot = function (root, children) {
            try {
              hook.onScheduleFiberRoot(rendererID, root, children);
            } catch (err) {
              if (true && !hasLoggedError) {
                hasLoggedError = true;

                error('React instrumentation encountered an error: %s', err);
              }
            }
          };
        }
      }

      onCommitFiberRoot = function (root, expirationTime) {
        try {
          var didError = (root.current.effectTag & DidCapture) === DidCapture;

          if (enableProfilerTimer) {
            var currentTime = getCurrentTime();
            var priorityLevel = inferPriorityFromExpirationTime(currentTime, expirationTime);
            hook.onCommitFiberRoot(rendererID, root, priorityLevel, didError);
          } else {
            hook.onCommitFiberRoot(rendererID, root, undefined, didError);
          }
        } catch (err) {
          if (true) {
            if (!hasLoggedError) {
              hasLoggedError = true;

              error('React instrumentation encountered an error: %s', err);
            }
          }
        }
      };

      onCommitFiberUnmount = function (fiber) {
        try {
          hook.onCommitFiberUnmount(rendererID, fiber);
        } catch (err) {
          if (true) {
            if (!hasLoggedError) {
              hasLoggedError = true;

              error('React instrumentation encountered an error: %s', err);
            }
          }
        }
      };
    } catch (err) {
      // Catch all errors because it is unsafe to throw during initialization.
      {
        error('React instrumentation encountered an error: %s.', err);
      }
    } // DevTools exists


    return true;
  }
  function onScheduleRoot(root, children) {
    if (typeof onScheduleFiberRoot === 'function') {
      onScheduleFiberRoot(root, children);
    }
  }
  function onCommitRoot(root, expirationTime) {
    if (typeof onCommitFiberRoot === 'function') {
      onCommitFiberRoot(root, expirationTime);
    }
  }
  function onCommitUnmount(fiber) {
    if (typeof onCommitFiberUnmount === 'function') {
      onCommitFiberUnmount(fiber);
    }
  }

  var hasBadMapPolyfill;

  {
    hasBadMapPolyfill = false;

    try {
      var nonExtensibleObject = Object.preventExtensions({});
      var testMap = new Map([[nonExtensibleObject, null]]);
      var testSet = new Set([nonExtensibleObject]); // This is necessary for Rollup to not consider these unused.
      // https://github.com/rollup/rollup/issues/1771
      // TODO: we can remove these if Rollup fixes the bug.

      testMap.set(0, 0);
      testSet.add(0);
    } catch (e) {
      // TODO: Consider warning about bad polyfills
      hasBadMapPolyfill = true;
    }
  }

  var debugCounter = 1;

  function FiberNode(tag, pendingProps, key, mode) {
    // Instance
    this.tag = tag;
    this.key = key;
    this.elementType = null;
    this.type = null;
    this.stateNode = null; // Fiber

    this.return = null;
    this.child = null;
    this.sibling = null;
    this.index = 0;
    this.ref = null;
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.updateQueue = null;
    this.memoizedState = null;
    this.dependencies = null;
    this.mode = mode; // Effects

    this.effectTag = NoEffect;
    this.nextEffect = null;
    this.firstEffect = null;
    this.lastEffect = null;
    this.expirationTime = NoWork;
    this.childExpirationTime = NoWork;
    this.alternate = null;

    {
      // Note: The following is done to avoid a v8 performance cliff.
      //
      // Initializing the fields below to smis and later updating them with
      // double values will cause Fibers to end up having separate shapes.
      // This behavior/bug has something to do with Object.preventExtension().
      // Fortunately this only impacts DEV builds.
      // Unfortunately it makes React unusably slow for some applications.
      // To work around this, initialize the fields below with doubles.
      //
      // Learn more about this here:
      // https://github.com/facebook/react/issues/14365
      // https://bugs.chromium.org/p/v8/issues/detail?id=8538
      this.actualDuration = Number.NaN;
      this.actualStartTime = Number.NaN;
      this.selfBaseDuration = Number.NaN;
      this.treeBaseDuration = Number.NaN; // It's okay to replace the initial doubles with smis after initialization.
      // This won't trigger the performance cliff mentioned above,
      // and it simplifies other profiler code (including DevTools).

      this.actualDuration = 0;
      this.actualStartTime = -1;
      this.selfBaseDuration = 0;
      this.treeBaseDuration = 0;
    } // This is normally DEV-only except www when it adds listeners.
    // TODO: remove the User Timing integration in favor of Root Events.


    {
      this._debugID = debugCounter++;
      this._debugIsCurrentlyTiming = false;
    }

    {
      this._debugSource = null;
      this._debugOwner = null;
      this._debugNeedsRemount = false;
      this._debugHookTypes = null;

      if (!hasBadMapPolyfill && typeof Object.preventExtensions === 'function') {
        Object.preventExtensions(this);
      }
    }
  } // This is a constructor function, rather than a POJO constructor, still
  // please ensure we do the following:
  // 1) Nobody should add any instance methods on this. Instance methods can be
  //    more difficult to predict when they get optimized and they are almost
  //    never inlined properly in static compilers.
  // 2) Nobody should rely on `instanceof Fiber` for type testing. We should
  //    always know when it is a fiber.
  // 3) We might want to experiment with using numeric keys since they are easier
  //    to optimize in a non-JIT environment.
  // 4) We can easily go from a constructor to a createFiber object literal if that
  //    is faster.
  // 5) It should be easy to port this to a C struct and keep a C implementation
  //    compatible.


  var createFiber = function (tag, pendingProps, key, mode) {
    // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
    return new FiberNode(tag, pendingProps, key, mode);
  };

  function shouldConstruct(Component) {
    var prototype = Component.prototype;
    return !!(prototype && prototype.isReactComponent);
  }

  function isSimpleFunctionComponent(type) {
    return typeof type === 'function' && !shouldConstruct(type) && type.defaultProps === undefined;
  }
  function resolveLazyComponentTag(Component) {
    if (typeof Component === 'function') {
      return shouldConstruct(Component) ? ClassComponent : FunctionComponent;
    } else if (Component !== undefined && Component !== null) {
      var $$typeof = Component.$$typeof;

      if ($$typeof === REACT_FORWARD_REF_TYPE) {
        return ForwardRef;
      }

      if ($$typeof === REACT_MEMO_TYPE) {
        return MemoComponent;
      }
    }

    return IndeterminateComponent;
  } // This is used to create an alternate fiber to do work on.

  function createWorkInProgress(current, pendingProps) {
    var workInProgress = current.alternate;

    if (workInProgress === null) {
      // We use a double buffering pooling technique because we know that we'll
      // only ever need at most two versions of a tree. We pool the "other" unused
      // node that we're free to reuse. This is lazily created to avoid allocating
      // extra objects for things that are never updated. It also allow us to
      // reclaim the extra memory if needed.
      workInProgress = createFiber(current.tag, pendingProps, current.key, current.mode);
      workInProgress.elementType = current.elementType;
      workInProgress.type = current.type;
      workInProgress.stateNode = current.stateNode;

      {
        // DEV-only fields
        {
          workInProgress._debugID = current._debugID;
        }

        workInProgress._debugSource = current._debugSource;
        workInProgress._debugOwner = current._debugOwner;
        workInProgress._debugHookTypes = current._debugHookTypes;
      }

      workInProgress.alternate = current;
      current.alternate = workInProgress;
    } else {
      workInProgress.pendingProps = pendingProps; // We already have an alternate.
      // Reset the effect tag.

      workInProgress.effectTag = NoEffect; // The effect list is no longer valid.

      workInProgress.nextEffect = null;
      workInProgress.firstEffect = null;
      workInProgress.lastEffect = null;

      {
        // We intentionally reset, rather than copy, actualDuration & actualStartTime.
        // This prevents time from endlessly accumulating in new commits.
        // This has the downside of resetting values for different priority renders,
        // But works for yielding (the common case) and should support resuming.
        workInProgress.actualDuration = 0;
        workInProgress.actualStartTime = -1;
      }
    }

    workInProgress.childExpirationTime = current.childExpirationTime;
    workInProgress.expirationTime = current.expirationTime;
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue; // Clone the dependencies object. This is mutated during the render phase, so
    // it cannot be shared with the current fiber.

    var currentDependencies = current.dependencies;
    workInProgress.dependencies = currentDependencies === null ? null : {
      expirationTime: currentDependencies.expirationTime,
      firstContext: currentDependencies.firstContext,
      responders: currentDependencies.responders
    }; // These will be overridden during the parent's reconciliation

    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;
    workInProgress.ref = current.ref;

    {
      workInProgress.selfBaseDuration = current.selfBaseDuration;
      workInProgress.treeBaseDuration = current.treeBaseDuration;
    }

    {
      workInProgress._debugNeedsRemount = current._debugNeedsRemount;

      switch (workInProgress.tag) {
        case IndeterminateComponent:
        case FunctionComponent:
        case SimpleMemoComponent:
          workInProgress.type = resolveFunctionForHotReloading(current.type);
          break;

        case ClassComponent:
          workInProgress.type = resolveClassForHotReloading(current.type);
          break;

        case ForwardRef:
          workInProgress.type = resolveForwardRefForHotReloading(current.type);
          break;
      }
    }

    return workInProgress;
  } // Used to reuse a Fiber for a second pass.

  function resetWorkInProgress(workInProgress, renderExpirationTime) {
    // This resets the Fiber to what createFiber or createWorkInProgress would
    // have set the values to before during the first pass. Ideally this wouldn't
    // be necessary but unfortunately many code paths reads from the workInProgress
    // when they should be reading from current and writing to workInProgress.
    // We assume pendingProps, index, key, ref, return are still untouched to
    // avoid doing another reconciliation.
    // Reset the effect tag but keep any Placement tags, since that's something
    // that child fiber is setting, not the reconciliation.
    workInProgress.effectTag &= Placement; // The effect list is no longer valid.

    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
    var current = workInProgress.alternate;

    if (current === null) {
      // Reset to createFiber's initial values.
      workInProgress.childExpirationTime = NoWork;
      workInProgress.expirationTime = renderExpirationTime;
      workInProgress.child = null;
      workInProgress.memoizedProps = null;
      workInProgress.memoizedState = null;
      workInProgress.updateQueue = null;
      workInProgress.dependencies = null;

      {
        // Note: We don't reset the actualTime counts. It's useful to accumulate
        // actual time across multiple render passes.
        workInProgress.selfBaseDuration = 0;
        workInProgress.treeBaseDuration = 0;
      }
    } else {
      // Reset to the cloned values that createWorkInProgress would've.
      workInProgress.childExpirationTime = current.childExpirationTime;
      workInProgress.expirationTime = current.expirationTime;
      workInProgress.child = current.child;
      workInProgress.memoizedProps = current.memoizedProps;
      workInProgress.memoizedState = current.memoizedState;
      workInProgress.updateQueue = current.updateQueue; // Clone the dependencies object. This is mutated during the render phase, so
      // it cannot be shared with the current fiber.

      var currentDependencies = current.dependencies;
      workInProgress.dependencies = currentDependencies === null ? null : {
        expirationTime: currentDependencies.expirationTime,
        firstContext: currentDependencies.firstContext,
        responders: currentDependencies.responders
      };

      {
        // Note: We don't reset the actualTime counts. It's useful to accumulate
        // actual time across multiple render passes.
        workInProgress.selfBaseDuration = current.selfBaseDuration;
        workInProgress.treeBaseDuration = current.treeBaseDuration;
      }
    }

    return workInProgress;
  }
  function createHostRootFiber(tag) {
    var mode;

    if (tag === ConcurrentRoot) {
      mode = ConcurrentMode | BlockingMode | StrictMode;
    } else if (tag === BlockingRoot) {
      mode = BlockingMode | StrictMode;
    } else {
      mode = NoMode;
    }

    if ( isDevToolsPresent) {
      // Always collect profile timings when DevTools are present.
      // This enables DevTools to start capturing timing at any point–
      // Without some nodes in the tree having empty base times.
      mode |= ProfileMode;
    }

    return createFiber(HostRoot, null, null, mode);
  }
  function createFiberFromTypeAndProps(type, // React$ElementType
  key, pendingProps, owner, mode, expirationTime) {
    var fiber;
    var fiberTag = IndeterminateComponent; // The resolved type is set if we know what the final type will be. I.e. it's not lazy.

    var resolvedType = type;

    if (typeof type === 'function') {
      if (shouldConstruct(type)) {
        fiberTag = ClassComponent;

        {
          resolvedType = resolveClassForHotReloading(resolvedType);
        }
      } else {
        {
          resolvedType = resolveFunctionForHotReloading(resolvedType);
        }
      }
    } else if (typeof type === 'string') {
      fiberTag = HostComponent;
    } else {
      getTag: switch (type) {
        case REACT_FRAGMENT_TYPE:
          return createFiberFromFragment(pendingProps.children, mode, expirationTime, key);

        case REACT_CONCURRENT_MODE_TYPE:
          fiberTag = Mode;
          mode |= ConcurrentMode | BlockingMode | StrictMode;
          break;

        case REACT_STRICT_MODE_TYPE:
          fiberTag = Mode;
          mode |= StrictMode;
          break;

        case REACT_PROFILER_TYPE:
          return createFiberFromProfiler(pendingProps, mode, expirationTime, key);

        case REACT_SUSPENSE_TYPE:
          return createFiberFromSuspense(pendingProps, mode, expirationTime, key);

        case REACT_SUSPENSE_LIST_TYPE:
          return createFiberFromSuspenseList(pendingProps, mode, expirationTime, key);

        default:
          {
            if (typeof type === 'object' && type !== null) {
              switch (type.$$typeof) {
                case REACT_PROVIDER_TYPE:
                  fiberTag = ContextProvider;
                  break getTag;

                case REACT_CONTEXT_TYPE:
                  // This is a consumer
                  fiberTag = ContextConsumer;
                  break getTag;

                case REACT_FORWARD_REF_TYPE:
                  fiberTag = ForwardRef;

                  {
                    resolvedType = resolveForwardRefForHotReloading(resolvedType);
                  }

                  break getTag;

                case REACT_MEMO_TYPE:
                  fiberTag = MemoComponent;
                  break getTag;

                case REACT_LAZY_TYPE:
                  fiberTag = LazyComponent;
                  resolvedType = null;
                  break getTag;

                case REACT_BLOCK_TYPE:
                  fiberTag = Block;
                  break getTag;

              }
            }

            var info = '';

            {
              if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
                info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and " + 'named imports.';
              }

              var ownerName = owner ? getComponentName(owner.type) : null;

              if (ownerName) {
                info += '\n\nCheck the render method of `' + ownerName + '`.';
              }
            }

            {
              {
                throw Error( "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " + (type == null ? type : typeof type) + "." + info );
              }
            }
          }
      }
    }

    fiber = createFiber(fiberTag, pendingProps, key, mode);
    fiber.elementType = type;
    fiber.type = resolvedType;
    fiber.expirationTime = expirationTime;
    return fiber;
  }
  function createFiberFromElement(element, mode, expirationTime) {
    var owner = null;

    {
      owner = element._owner;
    }

    var type = element.type;
    var key = element.key;
    var pendingProps = element.props;
    var fiber = createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, expirationTime);

    {
      fiber._debugSource = element._source;
      fiber._debugOwner = element._owner;
    }

    return fiber;
  }
  function createFiberFromFragment(elements, mode, expirationTime, key) {
    var fiber = createFiber(Fragment, elements, key, mode);
    fiber.expirationTime = expirationTime;
    return fiber;
  }

  function createFiberFromProfiler(pendingProps, mode, expirationTime, key) {
    {
      if (typeof pendingProps.id !== 'string' || typeof pendingProps.onRender !== 'function') {
        error('Profiler must specify an "id" string and "onRender" function as props');
      }
    }

    var fiber = createFiber(Profiler, pendingProps, key, mode | ProfileMode); // TODO: The Profiler fiber shouldn't have a type. It has a tag.

    fiber.elementType = REACT_PROFILER_TYPE;
    fiber.type = REACT_PROFILER_TYPE;
    fiber.expirationTime = expirationTime;
    return fiber;
  }

  function createFiberFromSuspense(pendingProps, mode, expirationTime, key) {
    var fiber = createFiber(SuspenseComponent, pendingProps, key, mode); // TODO: The SuspenseComponent fiber shouldn't have a type. It has a tag.
    // This needs to be fixed in getComponentName so that it relies on the tag
    // instead.

    fiber.type = REACT_SUSPENSE_TYPE;
    fiber.elementType = REACT_SUSPENSE_TYPE;
    fiber.expirationTime = expirationTime;
    return fiber;
  }
  function createFiberFromSuspenseList(pendingProps, mode, expirationTime, key) {
    var fiber = createFiber(SuspenseListComponent, pendingProps, key, mode);

    {
      // TODO: The SuspenseListComponent fiber shouldn't have a type. It has a tag.
      // This needs to be fixed in getComponentName so that it relies on the tag
      // instead.
      fiber.type = REACT_SUSPENSE_LIST_TYPE;
    }

    fiber.elementType = REACT_SUSPENSE_LIST_TYPE;
    fiber.expirationTime = expirationTime;
    return fiber;
  }
  function createFiberFromText(content, mode, expirationTime) {
    var fiber = createFiber(HostText, content, null, mode);
    fiber.expirationTime = expirationTime;
    return fiber;
  }
  function createFiberFromHostInstanceForDeletion() {
    var fiber = createFiber(HostComponent, null, null, NoMode); // TODO: These should not need a type.

    fiber.elementType = 'DELETED';
    fiber.type = 'DELETED';
    return fiber;
  }
  function createFiberFromPortal(portal, mode, expirationTime) {
    var pendingProps = portal.children !== null ? portal.children : [];
    var fiber = createFiber(HostPortal, pendingProps, portal.key, mode);
    fiber.expirationTime = expirationTime;
    fiber.stateNode = {
      containerInfo: portal.containerInfo,
      pendingChildren: null,
      // Used by persistent updates
      implementation: portal.implementation
    };
    return fiber;
  } // Used for stashing WIP properties to replay failed work in DEV.

  function assignFiberPropertiesInDEV(target, source) {
    if (target === null) {
      // This Fiber's initial properties will always be overwritten.
      // We only use a Fiber to ensure the same hidden class so DEV isn't slow.
      target = createFiber(IndeterminateComponent, null, null, NoMode);
    } // This is intentionally written as a list of all properties.
    // We tried to use Object.assign() instead but this is called in
    // the hottest path, and Object.assign() was too slow:
    // https://github.com/facebook/react/issues/12502
    // This code is DEV-only so size is not a concern.


    target.tag = source.tag;
    target.key = source.key;
    target.elementType = source.elementType;
    target.type = source.type;
    target.stateNode = source.stateNode;
    target.return = source.return;
    target.child = source.child;
    target.sibling = source.sibling;
    target.index = source.index;
    target.ref = source.ref;
    target.pendingProps = source.pendingProps;
    target.memoizedProps = source.memoizedProps;
    target.updateQueue = source.updateQueue;
    target.memoizedState = source.memoizedState;
    target.dependencies = source.dependencies;
    target.mode = source.mode;
    target.effectTag = source.effectTag;
    target.nextEffect = source.nextEffect;
    target.firstEffect = source.firstEffect;
    target.lastEffect = source.lastEffect;
    target.expirationTime = source.expirationTime;
    target.childExpirationTime = source.childExpirationTime;
    target.alternate = source.alternate;

    {
      target.actualDuration = source.actualDuration;
      target.actualStartTime = source.actualStartTime;
      target.selfBaseDuration = source.selfBaseDuration;
      target.treeBaseDuration = source.treeBaseDuration;
    }

    {
      target._debugID = source._debugID;
    }

    target._debugSource = source._debugSource;
    target._debugOwner = source._debugOwner;
    target._debugIsCurrentlyTiming = source._debugIsCurrentlyTiming;
    target._debugNeedsRemount = source._debugNeedsRemount;
    target._debugHookTypes = source._debugHookTypes;
    return target;
  }

  function FiberRootNode(containerInfo, tag, hydrate) {
    this.tag = tag;
    this.current = null;
    this.containerInfo = containerInfo;
    this.pendingChildren = null;
    this.pingCache = null;
    this.finishedExpirationTime = NoWork;
    this.finishedWork = null;
    this.timeoutHandle = noTimeout;
    this.context = null;
    this.pendingContext = null;
    this.hydrate = hydrate;
    this.callbackNode = null;
    this.callbackPriority = NoPriority;
    this.firstPendingTime = NoWork;
    this.firstSuspendedTime = NoWork;
    this.lastSuspendedTime = NoWork;
    this.nextKnownPendingLevel = NoWork;
    this.lastPingedTime = NoWork;
    this.lastExpiredTime = NoWork;

    {
      this.interactionThreadID = unstable_getThreadID();
      this.memoizedInteractions = new Set();
      this.pendingInteractionMap = new Map();
    }
  }

  function createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks) {
    var root = new FiberRootNode(containerInfo, tag, hydrate);
    // stateNode is any.


    var uninitializedFiber = createHostRootFiber(tag);
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    initializeUpdateQueue(uninitializedFiber);
    return root;
  }
  function isRootSuspendedAtTime(root, expirationTime) {
    var firstSuspendedTime = root.firstSuspendedTime;
    var lastSuspendedTime = root.lastSuspendedTime;
    return firstSuspendedTime !== NoWork && firstSuspendedTime >= expirationTime && lastSuspendedTime <= expirationTime;
  }
  function markRootSuspendedAtTime(root, expirationTime) {
    var firstSuspendedTime = root.firstSuspendedTime;
    var lastSuspendedTime = root.lastSuspendedTime;

    if (firstSuspendedTime < expirationTime) {
      root.firstSuspendedTime = expirationTime;
    }

    if (lastSuspendedTime > expirationTime || firstSuspendedTime === NoWork) {
      root.lastSuspendedTime = expirationTime;
    }

    if (expirationTime <= root.lastPingedTime) {
      root.lastPingedTime = NoWork;
    }

    if (expirationTime <= root.lastExpiredTime) {
      root.lastExpiredTime = NoWork;
    }
  }
  function markRootUpdatedAtTime(root, expirationTime) {
    // Update the range of pending times
    var firstPendingTime = root.firstPendingTime;

    if (expirationTime > firstPendingTime) {
      root.firstPendingTime = expirationTime;
    } // Update the range of suspended times. Treat everything lower priority or
    // equal to this update as unsuspended.


    var firstSuspendedTime = root.firstSuspendedTime;

    if (firstSuspendedTime !== NoWork) {
      if (expirationTime >= firstSuspendedTime) {
        // The entire suspended range is now unsuspended.
        root.firstSuspendedTime = root.lastSuspendedTime = root.nextKnownPendingLevel = NoWork;
      } else if (expirationTime >= root.lastSuspendedTime) {
        root.lastSuspendedTime = expirationTime + 1;
      } // This is a pending level. Check if it's higher priority than the next
      // known pending level.


      if (expirationTime > root.nextKnownPendingLevel) {
        root.nextKnownPendingLevel = expirationTime;
      }
    }
  }
  function markRootFinishedAtTime(root, finishedExpirationTime, remainingExpirationTime) {
    // Update the range of pending times
    root.firstPendingTime = remainingExpirationTime; // Update the range of suspended times. Treat everything higher priority or
    // equal to this update as unsuspended.

    if (finishedExpirationTime <= root.lastSuspendedTime) {
      // The entire suspended range is now unsuspended.
      root.firstSuspendedTime = root.lastSuspendedTime = root.nextKnownPendingLevel = NoWork;
    } else if (finishedExpirationTime <= root.firstSuspendedTime) {
      // Part of the suspended range is now unsuspended. Narrow the range to
      // include everything between the unsuspended time (non-inclusive) and the
      // last suspended time.
      root.firstSuspendedTime = finishedExpirationTime - 1;
    }

    if (finishedExpirationTime <= root.lastPingedTime) {
      // Clear the pinged time
      root.lastPingedTime = NoWork;
    }

    if (finishedExpirationTime <= root.lastExpiredTime) {
      // Clear the expired time
      root.lastExpiredTime = NoWork;
    }
  }
  function markRootExpiredAtTime(root, expirationTime) {
    var lastExpiredTime = root.lastExpiredTime;

    if (lastExpiredTime === NoWork || lastExpiredTime > expirationTime) {
      root.lastExpiredTime = expirationTime;
    }
  }

  var didWarnAboutNestedUpdates;
  var didWarnAboutFindNodeInStrictMode;

  {
    didWarnAboutNestedUpdates = false;
    didWarnAboutFindNodeInStrictMode = {};
  }

  function getContextForSubtree(parentComponent) {
    if (!parentComponent) {
      return emptyContextObject;
    }

    var fiber = get(parentComponent);
    var parentContext = findCurrentUnmaskedContext(fiber);

    if (fiber.tag === ClassComponent) {
      var Component = fiber.type;

      if (isContextProvider(Component)) {
        return processChildContext(fiber, Component, parentContext);
      }
    }

    return parentContext;
  }

  function findHostInstanceWithWarning(component, methodName) {
    {
      var fiber = get(component);

      if (fiber === undefined) {
        if (typeof component.render === 'function') {
          {
            {
              throw Error( "Unable to find node on an unmounted component." );
            }
          }
        } else {
          {
            {
              throw Error( "Argument appears to not be a ReactComponent. Keys: " + Object.keys(component) );
            }
          }
        }
      }

      var hostFiber = findCurrentHostFiber(fiber);

      if (hostFiber === null) {
        return null;
      }

      if (hostFiber.mode & StrictMode) {
        var componentName = getComponentName(fiber.type) || 'Component';

        if (!didWarnAboutFindNodeInStrictMode[componentName]) {
          didWarnAboutFindNodeInStrictMode[componentName] = true;

          if (fiber.mode & StrictMode) {
            error('%s is deprecated in StrictMode. ' + '%s was passed an instance of %s which is inside StrictMode. ' + 'Instead, add a ref directly to the element you want to reference. ' + 'Learn more about using refs safely here: ' + 'https://fb.me/react-strict-mode-find-node%s', methodName, methodName, componentName, getStackByFiberInDevAndProd(hostFiber));
          } else {
            error('%s is deprecated in StrictMode. ' + '%s was passed an instance of %s which renders StrictMode children. ' + 'Instead, add a ref directly to the element you want to reference. ' + 'Learn more about using refs safely here: ' + 'https://fb.me/react-strict-mode-find-node%s', methodName, methodName, componentName, getStackByFiberInDevAndProd(hostFiber));
          }
        }
      }

      return hostFiber.stateNode;
    }
  }

  function createContainer(containerInfo, tag, hydrate, hydrationCallbacks) {
    return createFiberRoot(containerInfo, tag, hydrate);
  }
  function updateContainer(element, container, parentComponent, callback) {
    {
      onScheduleRoot(container, element);
    }

    var current$1 = container.current;
    var currentTime = requestCurrentTimeForUpdate();

    {
      // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
      if ('undefined' !== typeof jest) {
        warnIfUnmockedScheduler(current$1);
        warnIfNotScopedWithMatchingAct(current$1);
      }
    }

    var suspenseConfig = requestCurrentSuspenseConfig();
    var expirationTime = computeExpirationForFiber(currentTime, current$1, suspenseConfig);
    var context = getContextForSubtree(parentComponent);

    if (container.context === null) {
      container.context = context;
    } else {
      container.pendingContext = context;
    }

    {
      if (isRendering && current !== null && !didWarnAboutNestedUpdates) {
        didWarnAboutNestedUpdates = true;

        error('Render methods should be a pure function of props and state; ' + 'triggering nested component updates from render is not allowed. ' + 'If necessary, trigger nested updates in componentDidUpdate.\n\n' + 'Check the render method of %s.', getComponentName(current.type) || 'Unknown');
      }
    }

    var update = createUpdate(expirationTime, suspenseConfig); // Caution: React DevTools currently depends on this property
    // being called "element".

    update.payload = {
      element: element
    };
    callback = callback === undefined ? null : callback;

    if (callback !== null) {
      {
        if (typeof callback !== 'function') {
          error('render(...): Expected the last optional `callback` argument to be a ' + 'function. Instead received: %s.', callback);
        }
      }

      update.callback = callback;
    }

    enqueueUpdate(current$1, update);
    scheduleWork(current$1, expirationTime);
    return expirationTime;
  }
  function getPublicRootInstance(container) {
    var containerFiber = container.current;

    if (!containerFiber.child) {
      return null;
    }

    switch (containerFiber.child.tag) {
      case HostComponent:
        return getPublicInstance(containerFiber.child.stateNode);

      default:
        return containerFiber.child.stateNode;
    }
  }

  function markRetryTimeImpl(fiber, retryTime) {
    var suspenseState = fiber.memoizedState;

    if (suspenseState !== null && suspenseState.dehydrated !== null) {
      if (suspenseState.retryTime < retryTime) {
        suspenseState.retryTime = retryTime;
      }
    }
  } // Increases the priority of thennables when they resolve within this boundary.


  function markRetryTimeIfNotHydrated(fiber, retryTime) {
    markRetryTimeImpl(fiber, retryTime);
    var alternate = fiber.alternate;

    if (alternate) {
      markRetryTimeImpl(alternate, retryTime);
    }
  }

  function attemptUserBlockingHydration$1(fiber) {
    if (fiber.tag !== SuspenseComponent) {
      // We ignore HostRoots here because we can't increase
      // their priority and they should not suspend on I/O,
      // since you have to wrap anything that might suspend in
      // Suspense.
      return;
    }

    var expTime = computeInteractiveExpiration(requestCurrentTimeForUpdate());
    scheduleWork(fiber, expTime);
    markRetryTimeIfNotHydrated(fiber, expTime);
  }
  function attemptContinuousHydration$1(fiber) {
    if (fiber.tag !== SuspenseComponent) {
      // We ignore HostRoots here because we can't increase
      // their priority and they should not suspend on I/O,
      // since you have to wrap anything that might suspend in
      // Suspense.
      return;
    }

    scheduleWork(fiber, ContinuousHydration);
    markRetryTimeIfNotHydrated(fiber, ContinuousHydration);
  }
  function attemptHydrationAtCurrentPriority$1(fiber) {
    if (fiber.tag !== SuspenseComponent) {
      // We ignore HostRoots here because we can't increase
      // their priority other than synchronously flush it.
      return;
    }

    var currentTime = requestCurrentTimeForUpdate();
    var expTime = computeExpirationForFiber(currentTime, fiber, null);
    scheduleWork(fiber, expTime);
    markRetryTimeIfNotHydrated(fiber, expTime);
  }
  function findHostInstanceWithNoPortals(fiber) {
    var hostFiber = findCurrentHostFiberWithNoPortals(fiber);

    if (hostFiber === null) {
      return null;
    }

    if (hostFiber.tag === FundamentalComponent) {
      return hostFiber.stateNode.instance;
    }

    return hostFiber.stateNode;
  }

  var shouldSuspendImpl = function (fiber) {
    return false;
  };

  function shouldSuspend(fiber) {
    return shouldSuspendImpl(fiber);
  }
  var overrideHookState = null;
  var overrideProps = null;
  var scheduleUpdate = null;
  var setSuspenseHandler = null;

  {
    var copyWithSetImpl = function (obj, path, idx, value) {
      if (idx >= path.length) {
        return value;
      }

      var key = path[idx];
      var updated = Array.isArray(obj) ? obj.slice() : _assign({}, obj); // $FlowFixMe number or string is fine here

      updated[key] = copyWithSetImpl(obj[key], path, idx + 1, value);
      return updated;
    };

    var copyWithSet = function (obj, path, value) {
      return copyWithSetImpl(obj, path, 0, value);
    }; // Support DevTools editable values for useState and useReducer.


    overrideHookState = function (fiber, id, path, value) {
      // For now, the "id" of stateful hooks is just the stateful hook index.
      // This may change in the future with e.g. nested hooks.
      var currentHook = fiber.memoizedState;

      while (currentHook !== null && id > 0) {
        currentHook = currentHook.next;
        id--;
      }

      if (currentHook !== null) {
        var newState = copyWithSet(currentHook.memoizedState, path, value);
        currentHook.memoizedState = newState;
        currentHook.baseState = newState; // We aren't actually adding an update to the queue,
        // because there is no update we can add for useReducer hooks that won't trigger an error.
        // (There's no appropriate action type for DevTools overrides.)
        // As a result though, React will see the scheduled update as a noop and bailout.
        // Shallow cloning props works as a workaround for now to bypass the bailout check.

        fiber.memoizedProps = _assign({}, fiber.memoizedProps);
        scheduleWork(fiber, Sync);
      }
    }; // Support DevTools props for function components, forwardRef, memo, host components, etc.


    overrideProps = function (fiber, path, value) {
      fiber.pendingProps = copyWithSet(fiber.memoizedProps, path, value);

      if (fiber.alternate) {
        fiber.alternate.pendingProps = fiber.pendingProps;
      }

      scheduleWork(fiber, Sync);
    };

    scheduleUpdate = function (fiber) {
      scheduleWork(fiber, Sync);
    };

    setSuspenseHandler = function (newShouldSuspendImpl) {
      shouldSuspendImpl = newShouldSuspendImpl;
    };
  }

  function injectIntoDevTools(devToolsConfig) {
    var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
    var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
    return injectInternals(_assign({}, devToolsConfig, {
      overrideHookState: overrideHookState,
      overrideProps: overrideProps,
      setSuspenseHandler: setSuspenseHandler,
      scheduleUpdate: scheduleUpdate,
      currentDispatcherRef: ReactCurrentDispatcher,
      findHostInstanceByFiber: function (fiber) {
        var hostFiber = findCurrentHostFiber(fiber);

        if (hostFiber === null) {
          return null;
        }

        return hostFiber.stateNode;
      },
      findFiberByHostInstance: function (instance) {
        if (!findFiberByHostInstance) {
          // Might not be implemented by the renderer.
          return null;
        }

        return findFiberByHostInstance(instance);
      },
      // React Refresh
      findHostInstancesForRefresh:  findHostInstancesForRefresh ,
      scheduleRefresh:  scheduleRefresh ,
      scheduleRoot:  scheduleRoot ,
      setRefreshHandler:  setRefreshHandler ,
      // Enables DevTools to append owner stacks to error messages in DEV mode.
      getCurrentFiber:  function () {
        return current;
      } 
    }));
  }
  var IsSomeRendererActing$1 = ReactSharedInternals.IsSomeRendererActing;

  function ReactDOMRoot(container, options) {
    this._internalRoot = createRootImpl(container, ConcurrentRoot, options);
  }

  function ReactDOMBlockingRoot(container, tag, options) {
    this._internalRoot = createRootImpl(container, tag, options);
  }

  ReactDOMRoot.prototype.render = ReactDOMBlockingRoot.prototype.render = function (children) {
    var root = this._internalRoot;

    {
      if (typeof arguments[1] === 'function') {
        error('render(...): does not support the second callback argument. ' + 'To execute a side effect after rendering, declare it in a component body with useEffect().');
      }

      var container = root.containerInfo;

      if (container.nodeType !== COMMENT_NODE) {
        var hostInstance = findHostInstanceWithNoPortals(root.current);

        if (hostInstance) {
          if (hostInstance.parentNode !== container) {
            error('render(...): It looks like the React-rendered content of the ' + 'root container was removed without using React. This is not ' + 'supported and will cause errors. Instead, call ' + "root.unmount() to empty a root's container.");
          }
        }
      }
    }

    updateContainer(children, root, null, null);
  };

  ReactDOMRoot.prototype.unmount = ReactDOMBlockingRoot.prototype.unmount = function () {
    {
      if (typeof arguments[0] === 'function') {
        error('unmount(...): does not support a callback argument. ' + 'To execute a side effect after rendering, declare it in a component body with useEffect().');
      }
    }

    var root = this._internalRoot;
    var container = root.containerInfo;
    updateContainer(null, root, null, function () {
      unmarkContainerAsRoot(container);
    });
  };

  function createRootImpl(container, tag, options) {
    // Tag is either LegacyRoot or Concurrent Root
    var hydrate = options != null && options.hydrate === true;
    var hydrationCallbacks = options != null && options.hydrationOptions || null;
    var root = createContainer(container, tag, hydrate);
    markContainerAsRoot(root.current, container);

    if (hydrate && tag !== LegacyRoot) {
      var doc = container.nodeType === DOCUMENT_NODE ? container : container.ownerDocument;
      eagerlyTrapReplayableEvents(container, doc);
    }

    return root;
  }
  function createLegacyRoot(container, options) {
    return new ReactDOMBlockingRoot(container, LegacyRoot, options);
  }
  function isValidContainer(node) {
    return !!(node && (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE || node.nodeType === COMMENT_NODE && node.nodeValue === ' react-mount-point-unstable '));
  }

  var ReactCurrentOwner$3 = ReactSharedInternals.ReactCurrentOwner;
  var topLevelUpdateWarnings;
  var warnedAboutHydrateAPI = false;

  {
    topLevelUpdateWarnings = function (container) {
      if (container._reactRootContainer && container.nodeType !== COMMENT_NODE) {
        var hostInstance = findHostInstanceWithNoPortals(container._reactRootContainer._internalRoot.current);

        if (hostInstance) {
          if (hostInstance.parentNode !== container) {
            error('render(...): It looks like the React-rendered content of this ' + 'container was removed without using React. This is not ' + 'supported and will cause errors. Instead, call ' + 'ReactDOM.unmountComponentAtNode to empty a container.');
          }
        }
      }

      var isRootRenderedBySomeReact = !!container._reactRootContainer;
      var rootEl = getReactRootElementInContainer(container);
      var hasNonRootReactChild = !!(rootEl && getInstanceFromNode$1(rootEl));

      if (hasNonRootReactChild && !isRootRenderedBySomeReact) {
        error('render(...): Replacing React-rendered children with a new root ' + 'component. If you intended to update the children of this node, ' + 'you should instead have the existing children update their state ' + 'and render the new components instead of calling ReactDOM.render.');
      }

      if (container.nodeType === ELEMENT_NODE && container.tagName && container.tagName.toUpperCase() === 'BODY') {
        error('render(): Rendering components directly into document.body is ' + 'discouraged, since its children are often manipulated by third-party ' + 'scripts and browser extensions. This may lead to subtle ' + 'reconciliation issues. Try rendering into a container element created ' + 'for your app.');
      }
    };
  }

  function getReactRootElementInContainer(container) {
    if (!container) {
      return null;
    }

    if (container.nodeType === DOCUMENT_NODE) {
      return container.documentElement;
    } else {
      return container.firstChild;
    }
  }

  function shouldHydrateDueToLegacyHeuristic(container) {
    var rootElement = getReactRootElementInContainer(container);
    return !!(rootElement && rootElement.nodeType === ELEMENT_NODE && rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME));
  }

  function legacyCreateRootFromDOMContainer(container, forceHydrate) {
    var shouldHydrate = forceHydrate || shouldHydrateDueToLegacyHeuristic(container); // First clear any existing content.

    if (!shouldHydrate) {
      var warned = false;
      var rootSibling;

      while (rootSibling = container.lastChild) {
        {
          if (!warned && rootSibling.nodeType === ELEMENT_NODE && rootSibling.hasAttribute(ROOT_ATTRIBUTE_NAME)) {
            warned = true;

            error('render(): Target node has markup rendered by React, but there ' + 'are unrelated nodes as well. This is most commonly caused by ' + 'white-space inserted around server-rendered markup.');
          }
        }

        container.removeChild(rootSibling);
      }
    }

    {
      if (shouldHydrate && !forceHydrate && !warnedAboutHydrateAPI) {
        warnedAboutHydrateAPI = true;

        warn('render(): Calling ReactDOM.render() to hydrate server-rendered markup ' + 'will stop working in React v17. Replace the ReactDOM.render() call ' + 'with ReactDOM.hydrate() if you want React to attach to the server HTML.');
      }
    }

    return createLegacyRoot(container, shouldHydrate ? {
      hydrate: true
    } : undefined);
  }

  function warnOnInvalidCallback$1(callback, callerName) {
    {
      if (callback !== null && typeof callback !== 'function') {
        error('%s(...): Expected the last optional `callback` argument to be a ' + 'function. Instead received: %s.', callerName, callback);
      }
    }
  }

  function legacyRenderSubtreeIntoContainer(parentComponent, children, container, forceHydrate, callback) {
    {
      topLevelUpdateWarnings(container);
      warnOnInvalidCallback$1(callback === undefined ? null : callback, 'render');
    } // TODO: Without `any` type, Flow says "Property cannot be accessed on any
    // member of intersection type." Whyyyyyy.


    var root = container._reactRootContainer;
    var fiberRoot;

    if (!root) {
      // Initial mount
      root = container._reactRootContainer = legacyCreateRootFromDOMContainer(container, forceHydrate);
      fiberRoot = root._internalRoot;

      if (typeof callback === 'function') {
        var originalCallback = callback;

        callback = function () {
          var instance = getPublicRootInstance(fiberRoot);
          originalCallback.call(instance);
        };
      } // Initial mount should not be batched.


      unbatchedUpdates(function () {
        updateContainer(children, fiberRoot, parentComponent, callback);
      });
    } else {
      fiberRoot = root._internalRoot;

      if (typeof callback === 'function') {
        var _originalCallback = callback;

        callback = function () {
          var instance = getPublicRootInstance(fiberRoot);

          _originalCallback.call(instance);
        };
      } // Update


      updateContainer(children, fiberRoot, parentComponent, callback);
    }

    return getPublicRootInstance(fiberRoot);
  }

  function findDOMNode(componentOrElement) {
    {
      var owner = ReactCurrentOwner$3.current;

      if (owner !== null && owner.stateNode !== null) {
        var warnedAboutRefsInRender = owner.stateNode._warnedAboutRefsInRender;

        if (!warnedAboutRefsInRender) {
          error('%s is accessing findDOMNode inside its render(). ' + 'render() should be a pure function of props and state. It should ' + 'never access something that requires stale data from the previous ' + 'render, such as refs. Move this logic to componentDidMount and ' + 'componentDidUpdate instead.', getComponentName(owner.type) || 'A component');
        }

        owner.stateNode._warnedAboutRefsInRender = true;
      }
    }

    if (componentOrElement == null) {
      return null;
    }

    if (componentOrElement.nodeType === ELEMENT_NODE) {
      return componentOrElement;
    }

    {
      return findHostInstanceWithWarning(componentOrElement, 'findDOMNode');
    }
  }
  function hydrate(element, container, callback) {
    if (!isValidContainer(container)) {
      {
        throw Error( "Target container is not a DOM element." );
      }
    }

    {
      var isModernRoot = isContainerMarkedAsRoot(container) && container._reactRootContainer === undefined;

      if (isModernRoot) {
        error('You are calling ReactDOM.hydrate() on a container that was previously ' + 'passed to ReactDOM.createRoot(). This is not supported. ' + 'Did you mean to call createRoot(container, {hydrate: true}).render(element)?');
      }
    } // TODO: throw or warn if we couldn't hydrate?


    return legacyRenderSubtreeIntoContainer(null, element, container, true, callback);
  }
  function render(element, container, callback) {
    if (!isValidContainer(container)) {
      {
        throw Error( "Target container is not a DOM element." );
      }
    }

    {
      var isModernRoot = isContainerMarkedAsRoot(container) && container._reactRootContainer === undefined;

      if (isModernRoot) {
        error('You are calling ReactDOM.render() on a container that was previously ' + 'passed to ReactDOM.createRoot(). This is not supported. ' + 'Did you mean to call root.render(element)?');
      }
    }

    return legacyRenderSubtreeIntoContainer(null, element, container, false, callback);
  }
  function unstable_renderSubtreeIntoContainer(parentComponent, element, containerNode, callback) {
    if (!isValidContainer(containerNode)) {
      {
        throw Error( "Target container is not a DOM element." );
      }
    }

    if (!(parentComponent != null && has$1(parentComponent))) {
      {
        throw Error( "parentComponent must be a valid React Component" );
      }
    }

    return legacyRenderSubtreeIntoContainer(parentComponent, element, containerNode, false, callback);
  }
  function unmountComponentAtNode(container) {
    if (!isValidContainer(container)) {
      {
        throw Error( "unmountComponentAtNode(...): Target container is not a DOM element." );
      }
    }

    {
      var isModernRoot = isContainerMarkedAsRoot(container) && container._reactRootContainer === undefined;

      if (isModernRoot) {
        error('You are calling ReactDOM.unmountComponentAtNode() on a container that was previously ' + 'passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.unmount()?');
      }
    }

    if (container._reactRootContainer) {
      {
        var rootEl = getReactRootElementInContainer(container);
        var renderedByDifferentReact = rootEl && !getInstanceFromNode$1(rootEl);

        if (renderedByDifferentReact) {
          error("unmountComponentAtNode(): The node you're attempting to unmount " + 'was rendered by another copy of React.');
        }
      } // Unmount should not be batched.


      unbatchedUpdates(function () {
        legacyRenderSubtreeIntoContainer(null, null, container, false, function () {
          // $FlowFixMe This should probably use `delete container._reactRootContainer`
          container._reactRootContainer = null;
          unmarkContainerAsRoot(container);
        });
      }); // If you call unmountComponentAtNode twice in quick succession, you'll
      // get `true` twice. That's probably fine?

      return true;
    } else {
      {
        var _rootEl = getReactRootElementInContainer(container);

        var hasNonRootReactChild = !!(_rootEl && getInstanceFromNode$1(_rootEl)); // Check if the container itself is a React root node.

        var isContainerReactRoot = container.nodeType === ELEMENT_NODE && isValidContainer(container.parentNode) && !!container.parentNode._reactRootContainer;

        if (hasNonRootReactChild) {
          error("unmountComponentAtNode(): The node you're attempting to unmount " + 'was rendered by React and is not a top-level container. %s', isContainerReactRoot ? 'You may have accidentally passed in a React root node instead ' + 'of its container.' : 'Instead, have the parent component update its state and ' + 'rerender in order to remove this component.');
        }
      }

      return false;
    }
  }

  function createPortal(children, containerInfo, // TODO: figure out the API for cross-renderer implementation.
  implementation) {
    var key = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    return {
      // This tag allow us to uniquely identify this as a React Portal
      $$typeof: REACT_PORTAL_TYPE,
      key: key == null ? null : '' + key,
      children: children,
      containerInfo: containerInfo,
      implementation: implementation
    };
  }

  var ReactVersion = '16.13.1';

  setAttemptUserBlockingHydration(attemptUserBlockingHydration$1);
  setAttemptContinuousHydration(attemptContinuousHydration$1);
  setAttemptHydrationAtCurrentPriority(attemptHydrationAtCurrentPriority$1);
  var didWarnAboutUnstableCreatePortal = false;

  {
    if (typeof Map !== 'function' || // $FlowIssue Flow incorrectly thinks Map has no prototype
    Map.prototype == null || typeof Map.prototype.forEach !== 'function' || typeof Set !== 'function' || // $FlowIssue Flow incorrectly thinks Set has no prototype
    Set.prototype == null || typeof Set.prototype.clear !== 'function' || typeof Set.prototype.forEach !== 'function') {
      error('React depends on Map and Set built-in types. Make sure that you load a ' + 'polyfill in older browsers. https://fb.me/react-polyfills');
    }
  }

  setRestoreImplementation(restoreControlledState$3);
  setBatchingImplementation(batchedUpdates$1, discreteUpdates$1, flushDiscreteUpdates, batchedEventUpdates$1);

  function createPortal$1(children, container) {
    var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    if (!isValidContainer(container)) {
      {
        throw Error( "Target container is not a DOM element." );
      }
    } // TODO: pass ReactDOM portal implementation as third argument
    // $FlowFixMe The Flow type is opaque but there's no way to actually create it.


    return createPortal(children, container, null, key);
  }

  function renderSubtreeIntoContainer(parentComponent, element, containerNode, callback) {

    return unstable_renderSubtreeIntoContainer(parentComponent, element, containerNode, callback);
  }

  function unstable_createPortal(children, container) {
    var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    {
      if (!didWarnAboutUnstableCreatePortal) {
        didWarnAboutUnstableCreatePortal = true;

        warn('The ReactDOM.unstable_createPortal() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactDOM.createPortal() instead. It has the exact same API, ' + 'but without the "unstable_" prefix.');
      }
    }

    return createPortal$1(children, container, key);
  }

  var Internals = {
    // Keep in sync with ReactDOMUnstableNativeDependencies.js
    // ReactTestUtils.js, and ReactTestUtilsAct.js. This is an array for better minification.
    Events: [getInstanceFromNode$1, getNodeFromInstance$1, getFiberCurrentPropsFromNode$1, injectEventPluginsByName, eventNameDispatchConfigs, accumulateTwoPhaseDispatches, accumulateDirectDispatches, enqueueStateRestore, restoreStateIfNeeded, dispatchEvent, runEventsInBatch, flushPassiveEffects, IsThisRendererActing]
  };
  var foundDevTools = injectIntoDevTools({
    findFiberByHostInstance: getClosestInstanceFromNode,
    bundleType:  1 ,
    version: ReactVersion,
    rendererPackageName: 'react-dom'
  });

  {
    if (!foundDevTools && canUseDOM && window.top === window.self) {
      // If we're in Chrome or Firefox, provide a download link if not installed.
      if (navigator.userAgent.indexOf('Chrome') > -1 && navigator.userAgent.indexOf('Edge') === -1 || navigator.userAgent.indexOf('Firefox') > -1) {
        var protocol = window.location.protocol; // Don't warn in exotic cases like chrome-extension://.

        if (/^(https?|file):$/.test(protocol)) {
          // eslint-disable-next-line react-internal/no-production-logging
          console.info('%cDownload the React DevTools ' + 'for a better development experience: ' + 'https://fb.me/react-devtools' + (protocol === 'file:' ? '\nYou might need to use a local HTTP server (instead of file://): ' + 'https://fb.me/react-devtools-faq' : ''), 'font-weight:bold');
        }
      }
    }
  }

  exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Internals;
  exports.createPortal = createPortal$1;
  exports.findDOMNode = findDOMNode;
  exports.flushSync = flushSync;
  exports.hydrate = hydrate;
  exports.render = render;
  exports.unmountComponentAtNode = unmountComponentAtNode;
  exports.unstable_batchedUpdates = batchedUpdates$1;
  exports.unstable_createPortal = unstable_createPortal;
  exports.unstable_renderSubtreeIntoContainer = renderSubtreeIntoContainer;
  exports.version = ReactVersion;

})));
