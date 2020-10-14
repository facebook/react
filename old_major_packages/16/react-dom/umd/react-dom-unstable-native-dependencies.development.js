/** @license React v16.13.1
 * react-dom-unstable-native-dependencies.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react-dom'), require('react')) :
  typeof define === 'function' && define.amd ? define(['react-dom', 'react'], factory) :
  (global = global || self, global.ReactDOMUnstableNativeDependencies = factory(global.ReactDOM, global.React));
}(this, (function (ReactDOM, React) { 'use strict';

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
   * Standard/simple iteration through an event's collected dispatches, but stops
   * at the first dispatch execution returning true, and returns that id.
   *
   * @return {?string} id of the first dispatch execution who's listener returns
   * true, or null if no listener returned true.
   */

  function executeDispatchesInOrderStopAtTrueImpl(event) {
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


        if (dispatchListeners[i](event, dispatchInstances[i])) {
          return dispatchInstances[i];
        }
      }
    } else if (dispatchListeners) {
      if (dispatchListeners(event, dispatchInstances)) {
        return dispatchInstances;
      }
    }

    return null;
  }
  /**
   * @see executeDispatchesInOrderStopAtTrueImpl
   */


  function executeDispatchesInOrderStopAtTrue(event) {
    var ret = executeDispatchesInOrderStopAtTrueImpl(event);
    event._dispatchInstances = null;
    event._dispatchListeners = null;
    return ret;
  }
  /**
   * Execution of a "direct" dispatch - there must be at most one dispatch
   * accumulated on the event or it is considered an error. It doesn't really make
   * sense for an event with multiple dispatches (bubbled) to keep track of the
   * return values at each dispatch execution, but it does tend to make sense when
   * dealing with "direct" dispatches.
   *
   * @return {*} The return value of executing the single dispatch.
   */

  function executeDirectDispatch(event) {
    {
      validateEventDispatches(event);
    }

    var dispatchListener = event._dispatchListeners;
    var dispatchInstance = event._dispatchInstances;

    if (!!Array.isArray(dispatchListener)) {
      {
        throw Error( "executeDirectDispatch(...): Invalid `event`." );
      }
    }

    event.currentTarget = dispatchListener ? getNodeFromInstance(dispatchInstance) : null;
    var res = dispatchListener ? dispatchListener(event) : null;
    event.currentTarget = null;
    event._dispatchListeners = null;
    event._dispatchInstances = null;
    return res;
  }
  /**
   * @param {SyntheticEvent} event
   * @return {boolean} True iff number of dispatches accumulated is greater than 0.
   */

  function hasDispatches(event) {
    return !!event._dispatchListeners;
  }

  var HostComponent = 5;

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
   * Return if A is an ancestor of B.
   */

  function isAncestor(instA, instB) {
    while (instB) {
      if (instA === instB || instA === instB.alternate) {
        return true;
      }

      instB = getParent(instB);
    }

    return false;
  }
  /**
   * Return the parent instance of the passed-in instance.
   */

  function getParentInstance(inst) {
    return getParent(inst);
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
   * Same as `accumulateTwoPhaseDispatchesSingle`, but skips over the targetID.
   */


  function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
    if (event && event.dispatchConfig.phasedRegistrationNames) {
      var targetInst = event._targetInst;
      var parentInst = targetInst ? getParentInstance(targetInst) : null;
      traverseTwoPhase(parentInst, accumulateDirectionalDispatches, event);
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
  function accumulateTwoPhaseDispatchesSkipTarget(events) {
    forEachAccumulated(events, accumulateTwoPhaseDispatchesSingleSkipTarget);
  }
  function accumulateDirectDispatches(events) {
    forEachAccumulated(events, accumulateDirectDispatchesSingle);
  }

  var ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  var _assign = ReactInternals.assign;

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
   * `touchHistory` isn't actually on the native event, but putting it in the
   * interface will ensure that it is cleaned up when pooled/destroyed. The
   * `ResponderEventPlugin` will populate it appropriately.
   */

  var ResponderSyntheticEvent = SyntheticEvent.extend({
    touchHistory: function (nativeEvent) {
      return null; // Actually doesn't even look at the native event.
    }
  });

  // Note: ideally these would be imported from DOMTopLevelEventTypes,
  // but our build system currently doesn't let us do that from a fork.
  var TOP_TOUCH_START = 'touchstart';
  var TOP_TOUCH_MOVE = 'touchmove';
  var TOP_TOUCH_END = 'touchend';
  var TOP_TOUCH_CANCEL = 'touchcancel';
  var TOP_SCROLL = 'scroll';
  var TOP_SELECTION_CHANGE = 'selectionchange';
  var TOP_MOUSE_DOWN = 'mousedown';
  var TOP_MOUSE_MOVE = 'mousemove';
  var TOP_MOUSE_UP = 'mouseup';
  function isStartish(topLevelType) {
    return topLevelType === TOP_TOUCH_START || topLevelType === TOP_MOUSE_DOWN;
  }
  function isMoveish(topLevelType) {
    return topLevelType === TOP_TOUCH_MOVE || topLevelType === TOP_MOUSE_MOVE;
  }
  function isEndish(topLevelType) {
    return topLevelType === TOP_TOUCH_END || topLevelType === TOP_TOUCH_CANCEL || topLevelType === TOP_MOUSE_UP;
  }
  var startDependencies = [TOP_TOUCH_START, TOP_MOUSE_DOWN];
  var moveDependencies = [TOP_TOUCH_MOVE, TOP_MOUSE_MOVE];
  var endDependencies = [TOP_TOUCH_CANCEL, TOP_TOUCH_END, TOP_MOUSE_UP];

  /**
   * Tracks the position and time of each active touch by `touch.identifier`. We
   * should typically only see IDs in the range of 1-20 because IDs get recycled
   * when touches end and start again.
   */

  var MAX_TOUCH_BANK = 20;
  var touchBank = [];
  var touchHistory = {
    touchBank: touchBank,
    numberActiveTouches: 0,
    // If there is only one active touch, we remember its location. This prevents
    // us having to loop through all of the touches all the time in the most
    // common case.
    indexOfSingleActiveTouch: -1,
    mostRecentTimeStamp: 0
  };

  function timestampForTouch(touch) {
    // The legacy internal implementation provides "timeStamp", which has been
    // renamed to "timestamp". Let both work for now while we iron it out
    // TODO (evv): rename timeStamp to timestamp in internal code
    return touch.timeStamp || touch.timestamp;
  }
  /**
   * TODO: Instead of making gestures recompute filtered velocity, we could
   * include a built in velocity computation that can be reused globally.
   */


  function createTouchRecord(touch) {
    return {
      touchActive: true,
      startPageX: touch.pageX,
      startPageY: touch.pageY,
      startTimeStamp: timestampForTouch(touch),
      currentPageX: touch.pageX,
      currentPageY: touch.pageY,
      currentTimeStamp: timestampForTouch(touch),
      previousPageX: touch.pageX,
      previousPageY: touch.pageY,
      previousTimeStamp: timestampForTouch(touch)
    };
  }

  function resetTouchRecord(touchRecord, touch) {
    touchRecord.touchActive = true;
    touchRecord.startPageX = touch.pageX;
    touchRecord.startPageY = touch.pageY;
    touchRecord.startTimeStamp = timestampForTouch(touch);
    touchRecord.currentPageX = touch.pageX;
    touchRecord.currentPageY = touch.pageY;
    touchRecord.currentTimeStamp = timestampForTouch(touch);
    touchRecord.previousPageX = touch.pageX;
    touchRecord.previousPageY = touch.pageY;
    touchRecord.previousTimeStamp = timestampForTouch(touch);
  }

  function getTouchIdentifier(_ref) {
    var identifier = _ref.identifier;

    if (!(identifier != null)) {
      {
        throw Error( "Touch object is missing identifier." );
      }
    }

    {
      if (identifier > MAX_TOUCH_BANK) {
        error('Touch identifier %s is greater than maximum supported %s which causes ' + 'performance issues backfilling array locations for all of the indices.', identifier, MAX_TOUCH_BANK);
      }
    }

    return identifier;
  }

  function recordTouchStart(touch) {
    var identifier = getTouchIdentifier(touch);
    var touchRecord = touchBank[identifier];

    if (touchRecord) {
      resetTouchRecord(touchRecord, touch);
    } else {
      touchBank[identifier] = createTouchRecord(touch);
    }

    touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
  }

  function recordTouchMove(touch) {
    var touchRecord = touchBank[getTouchIdentifier(touch)];

    if (touchRecord) {
      touchRecord.touchActive = true;
      touchRecord.previousPageX = touchRecord.currentPageX;
      touchRecord.previousPageY = touchRecord.currentPageY;
      touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
      touchRecord.currentPageX = touch.pageX;
      touchRecord.currentPageY = touch.pageY;
      touchRecord.currentTimeStamp = timestampForTouch(touch);
      touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
    } else {
      {
        warn('Cannot record touch move without a touch start.\n' + 'Touch Move: %s\n' + 'Touch Bank: %s', printTouch(touch), printTouchBank());
      }
    }
  }

  function recordTouchEnd(touch) {
    var touchRecord = touchBank[getTouchIdentifier(touch)];

    if (touchRecord) {
      touchRecord.touchActive = false;
      touchRecord.previousPageX = touchRecord.currentPageX;
      touchRecord.previousPageY = touchRecord.currentPageY;
      touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
      touchRecord.currentPageX = touch.pageX;
      touchRecord.currentPageY = touch.pageY;
      touchRecord.currentTimeStamp = timestampForTouch(touch);
      touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
    } else {
      {
        warn('Cannot record touch end without a touch start.\n' + 'Touch End: %s\n' + 'Touch Bank: %s', printTouch(touch), printTouchBank());
      }
    }
  }

  function printTouch(touch) {
    return JSON.stringify({
      identifier: touch.identifier,
      pageX: touch.pageX,
      pageY: touch.pageY,
      timestamp: timestampForTouch(touch)
    });
  }

  function printTouchBank() {
    var printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));

    if (touchBank.length > MAX_TOUCH_BANK) {
      printed += ' (original size: ' + touchBank.length + ')';
    }

    return printed;
  }

  var ResponderTouchHistoryStore = {
    recordTouchTrack: function (topLevelType, nativeEvent) {
      if (isMoveish(topLevelType)) {
        nativeEvent.changedTouches.forEach(recordTouchMove);
      } else if (isStartish(topLevelType)) {
        nativeEvent.changedTouches.forEach(recordTouchStart);
        touchHistory.numberActiveTouches = nativeEvent.touches.length;

        if (touchHistory.numberActiveTouches === 1) {
          touchHistory.indexOfSingleActiveTouch = nativeEvent.touches[0].identifier;
        }
      } else if (isEndish(topLevelType)) {
        nativeEvent.changedTouches.forEach(recordTouchEnd);
        touchHistory.numberActiveTouches = nativeEvent.touches.length;

        if (touchHistory.numberActiveTouches === 1) {
          for (var i = 0; i < touchBank.length; i++) {
            var touchTrackToCheck = touchBank[i];

            if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
              touchHistory.indexOfSingleActiveTouch = i;
              break;
            }
          }

          {
            var activeRecord = touchBank[touchHistory.indexOfSingleActiveTouch];

            if (activeRecord == null || !activeRecord.touchActive) {
              error('Cannot find single active touch.');
            }
          }
        }
      }
    },
    touchHistory: touchHistory
  };

  /**
   * Accumulates items that must not be null or undefined.
   *
   * This is used to conserve memory by avoiding array allocations.
   *
   * @return {*|array<*>} An accumulation of items.
   */

  function accumulate(current, next) {
    if (!(next != null)) {
      {
        throw Error( "accumulate(...): Accumulated items must not be null or undefined." );
      }
    }

    if (current == null) {
      return next;
    } // Both are not empty. Warning: Never call x.concat(y) when you are not
    // certain that x is an Array (x could be a string with concat method).


    if (Array.isArray(current)) {
      return current.concat(next);
    }

    if (Array.isArray(next)) {
      return [current].concat(next);
    }

    return [current, next];
  }

  /**
   * Instance of element that should respond to touch/move types of interactions,
   * as indicated explicitly by relevant callbacks.
   */

  var responderInst = null;
  /**
   * Count of current touches. A textInput should become responder iff the
   * selection changes while there is a touch on the screen.
   */

  var trackedTouchCount = 0;

  var changeResponder = function (nextResponderInst, blockHostResponder) {
    var oldResponderInst = responderInst;
    responderInst = nextResponderInst;

    if (ResponderEventPlugin.GlobalResponderHandler !== null) {
      ResponderEventPlugin.GlobalResponderHandler.onChange(oldResponderInst, nextResponderInst, blockHostResponder);
    }
  };

  var eventTypes = {
    /**
     * On a `touchStart`/`mouseDown`, is it desired that this element become the
     * responder?
     */
    startShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: 'onStartShouldSetResponder',
        captured: 'onStartShouldSetResponderCapture'
      },
      dependencies: startDependencies
    },

    /**
     * On a `scroll`, is it desired that this element become the responder? This
     * is usually not needed, but should be used to retroactively infer that a
     * `touchStart` had occurred during momentum scroll. During a momentum scroll,
     * a touch start will be immediately followed by a scroll event if the view is
     * currently scrolling.
     *
     * TODO: This shouldn't bubble.
     */
    scrollShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: 'onScrollShouldSetResponder',
        captured: 'onScrollShouldSetResponderCapture'
      },
      dependencies: [TOP_SCROLL]
    },

    /**
     * On text selection change, should this element become the responder? This
     * is needed for text inputs or other views with native selection, so the
     * JS view can claim the responder.
     *
     * TODO: This shouldn't bubble.
     */
    selectionChangeShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: 'onSelectionChangeShouldSetResponder',
        captured: 'onSelectionChangeShouldSetResponderCapture'
      },
      dependencies: [TOP_SELECTION_CHANGE]
    },

    /**
     * On a `touchMove`/`mouseMove`, is it desired that this element become the
     * responder?
     */
    moveShouldSetResponder: {
      phasedRegistrationNames: {
        bubbled: 'onMoveShouldSetResponder',
        captured: 'onMoveShouldSetResponderCapture'
      },
      dependencies: moveDependencies
    },

    /**
     * Direct responder events dispatched directly to responder. Do not bubble.
     */
    responderStart: {
      registrationName: 'onResponderStart',
      dependencies: startDependencies
    },
    responderMove: {
      registrationName: 'onResponderMove',
      dependencies: moveDependencies
    },
    responderEnd: {
      registrationName: 'onResponderEnd',
      dependencies: endDependencies
    },
    responderRelease: {
      registrationName: 'onResponderRelease',
      dependencies: endDependencies
    },
    responderTerminationRequest: {
      registrationName: 'onResponderTerminationRequest',
      dependencies: []
    },
    responderGrant: {
      registrationName: 'onResponderGrant',
      dependencies: []
    },
    responderReject: {
      registrationName: 'onResponderReject',
      dependencies: []
    },
    responderTerminate: {
      registrationName: 'onResponderTerminate',
      dependencies: []
    }
  };
  /**
   *
   * Responder System:
   * ----------------
   *
   * - A global, solitary "interaction lock" on a view.
   * - If a node becomes the responder, it should convey visual feedback
   *   immediately to indicate so, either by highlighting or moving accordingly.
   * - To be the responder means, that touches are exclusively important to that
   *   responder view, and no other view.
   * - While touches are still occurring, the responder lock can be transferred to
   *   a new view, but only to increasingly "higher" views (meaning ancestors of
   *   the current responder).
   *
   * Responder being granted:
   * ------------------------
   *
   * - Touch starts, moves, and scrolls can cause an ID to become the responder.
   * - We capture/bubble `startShouldSetResponder`/`moveShouldSetResponder` to
   *   the "appropriate place".
   * - If nothing is currently the responder, the "appropriate place" is the
   *   initiating event's `targetID`.
   * - If something *is* already the responder, the "appropriate place" is the
   *   first common ancestor of the event target and the current `responderInst`.
   * - Some negotiation happens: See the timing diagram below.
   * - Scrolled views automatically become responder. The reasoning is that a
   *   platform scroll view that isn't built on top of the responder system has
   *   began scrolling, and the active responder must now be notified that the
   *   interaction is no longer locked to it - the system has taken over.
   *
   * - Responder being released:
   *   As soon as no more touches that *started* inside of descendants of the
   *   *current* responderInst, an `onResponderRelease` event is dispatched to the
   *   current responder, and the responder lock is released.
   *
   * TODO:
   * - on "end", a callback hook for `onResponderEndShouldRemainResponder` that
   *   determines if the responder lock should remain.
   * - If a view shouldn't "remain" the responder, any active touches should by
   *   default be considered "dead" and do not influence future negotiations or
   *   bubble paths. It should be as if those touches do not exist.
   * -- For multitouch: Usually a translate-z will choose to "remain" responder
   *  after one out of many touches ended. For translate-y, usually the view
   *  doesn't wish to "remain" responder after one of many touches end.
   * - Consider building this on top of a `stopPropagation` model similar to
   *   `W3C` events.
   * - Ensure that `onResponderTerminate` is called on touch cancels, whether or
   *   not `onResponderTerminationRequest` returns `true` or `false`.
   *
   */

  /*                                             Negotiation Performed
                                               +-----------------------+
                                              /                         \
  Process low level events to    +     Current Responder      +   wantsResponderID
  determine who to perform negot-|   (if any exists at all)   |
  iation/transition              | Otherwise just pass through|
  -------------------------------+----------------------------+------------------+
  Bubble to find first ID        |                            |
  to return true:wantsResponderID|                            |
                                 |                            |
       +-------------+           |                            |
       | onTouchStart|           |                            |
       +------+------+     none  |                            |
              |            return|                            |
  +-----------v-------------+true| +------------------------+ |
  |onStartShouldSetResponder|----->|onResponderStart (cur)  |<-----------+
  +-----------+-------------+    | +------------------------+ |          |
              |                  |                            | +--------+-------+
              | returned true for|       false:REJECT +-------->|onResponderReject
              | wantsResponderID |                    |       | +----------------+
              | (now attempt     | +------------------+-----+ |
              |  handoff)        | |   onResponder          | |
              +------------------->|      TerminationRequest| |
                                 | +------------------+-----+ |
                                 |                    |       | +----------------+
                                 |         true:GRANT +-------->|onResponderGrant|
                                 |                            | +--------+-------+
                                 | +------------------------+ |          |
                                 | |   onResponderTerminate |<-----------+
                                 | +------------------+-----+ |
                                 |                    |       | +----------------+
                                 |                    +-------->|onResponderStart|
                                 |                            | +----------------+
  Bubble to find first ID        |                            |
  to return true:wantsResponderID|                            |
                                 |                            |
       +-------------+           |                            |
       | onTouchMove |           |                            |
       +------+------+     none  |                            |
              |            return|                            |
  +-----------v-------------+true| +------------------------+ |
  |onMoveShouldSetResponder |----->|onResponderMove (cur)   |<-----------+
  +-----------+-------------+    | +------------------------+ |          |
              |                  |                            | +--------+-------+
              | returned true for|       false:REJECT +-------->|onResponderRejec|
              | wantsResponderID |                    |       | +----------------+
              | (now attempt     | +------------------+-----+ |
              |  handoff)        | |   onResponder          | |
              +------------------->|      TerminationRequest| |
                                 | +------------------+-----+ |
                                 |                    |       | +----------------+
                                 |         true:GRANT +-------->|onResponderGrant|
                                 |                            | +--------+-------+
                                 | +------------------------+ |          |
                                 | |   onResponderTerminate |<-----------+
                                 | +------------------+-----+ |
                                 |                    |       | +----------------+
                                 |                    +-------->|onResponderMove |
                                 |                            | +----------------+
                                 |                            |
                                 |                            |
        Some active touch started|                            |
        inside current responder | +------------------------+ |
        +------------------------->|      onResponderEnd    | |
        |                        | +------------------------+ |
    +---+---------+              |                            |
    | onTouchEnd  |              |                            |
    +---+---------+              |                            |
        |                        | +------------------------+ |
        +------------------------->|     onResponderEnd     | |
        No active touches started| +-----------+------------+ |
        inside current responder |             |              |
                                 |             v              |
                                 | +------------------------+ |
                                 | |    onResponderRelease  | |
                                 | +------------------------+ |
                                 |                            |
                                 +                            + */

  /**
   * A note about event ordering in the `EventPluginRegistry`.
   *
   * Suppose plugins are injected in the following order:
   *
   * `[R, S, C]`
   *
   * To help illustrate the example, assume `S` is `SimpleEventPlugin` (for
   * `onClick` etc) and `R` is `ResponderEventPlugin`.
   *
   * "Deferred-Dispatched Events":
   *
   * - The current event plugin system will traverse the list of injected plugins,
   *   in order, and extract events by collecting the plugin's return value of
   *   `extractEvents()`.
   * - These events that are returned from `extractEvents` are "deferred
   *   dispatched events".
   * - When returned from `extractEvents`, deferred-dispatched events contain an
   *   "accumulation" of deferred dispatches.
   * - These deferred dispatches are accumulated/collected before they are
   *   returned, but processed at a later time by the `EventPluginRegistry` (hence the
   *   name deferred).
   *
   * In the process of returning their deferred-dispatched events, event plugins
   * themselves can dispatch events on-demand without returning them from
   * `extractEvents`. Plugins might want to do this, so that they can use event
   * dispatching as a tool that helps them decide which events should be extracted
   * in the first place.
   *
   * "On-Demand-Dispatched Events":
   *
   * - On-demand-dispatched events are not returned from `extractEvents`.
   * - On-demand-dispatched events are dispatched during the process of returning
   *   the deferred-dispatched events.
   * - They should not have side effects.
   * - They should be avoided, and/or eventually be replaced with another
   *   abstraction that allows event plugins to perform multiple "rounds" of event
   *   extraction.
   *
   * Therefore, the sequence of event dispatches becomes:
   *
   * - `R`s on-demand events (if any)   (dispatched by `R` on-demand)
   * - `S`s on-demand events (if any)   (dispatched by `S` on-demand)
   * - `C`s on-demand events (if any)   (dispatched by `C` on-demand)
   * - `R`s extracted events (if any)   (dispatched by `EventPluginRegistry`)
   * - `S`s extracted events (if any)   (dispatched by `EventPluginRegistry`)
   * - `C`s extracted events (if any)   (dispatched by `EventPluginRegistry`)
   *
   * In the case of `ResponderEventPlugin`: If the `startShouldSetResponder`
   * on-demand dispatch returns `true` (and some other details are satisfied) the
   * `onResponderGrant` deferred dispatched event is returned from
   * `extractEvents`. The sequence of dispatch executions in this case
   * will appear as follows:
   *
   * - `startShouldSetResponder` (`ResponderEventPlugin` dispatches on-demand)
   * - `touchStartCapture`       (`EventPluginRegistry` dispatches as usual)
   * - `touchStart`              (`EventPluginRegistry` dispatches as usual)
   * - `responderGrant/Reject`   (`EventPluginRegistry` dispatches as usual)
   */

  function setResponderAndExtractTransfer(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var shouldSetEventType = isStartish(topLevelType) ? eventTypes.startShouldSetResponder : isMoveish(topLevelType) ? eventTypes.moveShouldSetResponder : topLevelType === TOP_SELECTION_CHANGE ? eventTypes.selectionChangeShouldSetResponder : eventTypes.scrollShouldSetResponder; // TODO: stop one short of the current responder.

    var bubbleShouldSetFrom = !responderInst ? targetInst : getLowestCommonAncestor(responderInst, targetInst); // When capturing/bubbling the "shouldSet" event, we want to skip the target
    // (deepest ID) if it happens to be the current responder. The reasoning:
    // It's strange to get an `onMoveShouldSetResponder` when you're *already*
    // the responder.

    var skipOverBubbleShouldSetFrom = bubbleShouldSetFrom === responderInst;
    var shouldSetEvent = ResponderSyntheticEvent.getPooled(shouldSetEventType, bubbleShouldSetFrom, nativeEvent, nativeEventTarget);
    shouldSetEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;

    if (skipOverBubbleShouldSetFrom) {
      accumulateTwoPhaseDispatchesSkipTarget(shouldSetEvent);
    } else {
      accumulateTwoPhaseDispatches(shouldSetEvent);
    }

    var wantsResponderInst = executeDispatchesInOrderStopAtTrue(shouldSetEvent);

    if (!shouldSetEvent.isPersistent()) {
      shouldSetEvent.constructor.release(shouldSetEvent);
    }

    if (!wantsResponderInst || wantsResponderInst === responderInst) {
      return null;
    }

    var extracted;
    var grantEvent = ResponderSyntheticEvent.getPooled(eventTypes.responderGrant, wantsResponderInst, nativeEvent, nativeEventTarget);
    grantEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
    accumulateDirectDispatches(grantEvent);
    var blockHostResponder = executeDirectDispatch(grantEvent) === true;

    if (responderInst) {
      var terminationRequestEvent = ResponderSyntheticEvent.getPooled(eventTypes.responderTerminationRequest, responderInst, nativeEvent, nativeEventTarget);
      terminationRequestEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
      accumulateDirectDispatches(terminationRequestEvent);
      var shouldSwitch = !hasDispatches(terminationRequestEvent) || executeDirectDispatch(terminationRequestEvent);

      if (!terminationRequestEvent.isPersistent()) {
        terminationRequestEvent.constructor.release(terminationRequestEvent);
      }

      if (shouldSwitch) {
        var terminateEvent = ResponderSyntheticEvent.getPooled(eventTypes.responderTerminate, responderInst, nativeEvent, nativeEventTarget);
        terminateEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
        accumulateDirectDispatches(terminateEvent);
        extracted = accumulate(extracted, [grantEvent, terminateEvent]);
        changeResponder(wantsResponderInst, blockHostResponder);
      } else {
        var rejectEvent = ResponderSyntheticEvent.getPooled(eventTypes.responderReject, wantsResponderInst, nativeEvent, nativeEventTarget);
        rejectEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
        accumulateDirectDispatches(rejectEvent);
        extracted = accumulate(extracted, rejectEvent);
      }
    } else {
      extracted = accumulate(extracted, grantEvent);
      changeResponder(wantsResponderInst, blockHostResponder);
    }

    return extracted;
  }
  /**
   * A transfer is a negotiation between a currently set responder and the next
   * element to claim responder status. Any start event could trigger a transfer
   * of responderInst. Any move event could trigger a transfer.
   *
   * @param {string} topLevelType Record from `BrowserEventConstants`.
   * @return {boolean} True if a transfer of responder could possibly occur.
   */


  function canTriggerTransfer(topLevelType, topLevelInst, nativeEvent) {
    return topLevelInst && ( // responderIgnoreScroll: We are trying to migrate away from specifically
    // tracking native scroll events here and responderIgnoreScroll indicates we
    // will send topTouchCancel to handle canceling touch events instead
    topLevelType === TOP_SCROLL && !nativeEvent.responderIgnoreScroll || trackedTouchCount > 0 && topLevelType === TOP_SELECTION_CHANGE || isStartish(topLevelType) || isMoveish(topLevelType));
  }
  /**
   * Returns whether or not this touch end event makes it such that there are no
   * longer any touches that started inside of the current `responderInst`.
   *
   * @param {NativeEvent} nativeEvent Native touch end event.
   * @return {boolean} Whether or not this touch end event ends the responder.
   */


  function noResponderTouches(nativeEvent) {
    var touches = nativeEvent.touches;

    if (!touches || touches.length === 0) {
      return true;
    }

    for (var i = 0; i < touches.length; i++) {
      var activeTouch = touches[i];
      var target = activeTouch.target;

      if (target !== null && target !== undefined && target !== 0) {
        // Is the original touch location inside of the current responder?
        var targetInst = getInstanceFromNode(target);

        if (isAncestor(responderInst, targetInst)) {
          return false;
        }
      }
    }

    return true;
  }

  var ResponderEventPlugin = {
    /* For unit testing only */
    _getResponder: function () {
      return responderInst;
    },
    eventTypes: eventTypes,

    /**
     * We must be resilient to `targetInst` being `null` on `touchMove` or
     * `touchEnd`. On certain platforms, this means that a native scroll has
     * assumed control and the original touch targets are destroyed.
     */
    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) {
      if (isStartish(topLevelType)) {
        trackedTouchCount += 1;
      } else if (isEndish(topLevelType)) {
        if (trackedTouchCount >= 0) {
          trackedTouchCount -= 1;
        } else {
          {
            warn('Ended a touch event which was not counted in `trackedTouchCount`.');
          }

          return null;
        }
      }

      ResponderTouchHistoryStore.recordTouchTrack(topLevelType, nativeEvent);
      var extracted = canTriggerTransfer(topLevelType, targetInst, nativeEvent) ? setResponderAndExtractTransfer(topLevelType, targetInst, nativeEvent, nativeEventTarget) : null; // Responder may or may not have transferred on a new touch start/move.
      // Regardless, whoever is the responder after any potential transfer, we
      // direct all touch start/move/ends to them in the form of
      // `onResponderMove/Start/End`. These will be called for *every* additional
      // finger that move/start/end, dispatched directly to whoever is the
      // current responder at that moment, until the responder is "released".
      //
      // These multiple individual change touch events are are always bookended
      // by `onResponderGrant`, and one of
      // (`onResponderRelease/onResponderTerminate`).

      var isResponderTouchStart = responderInst && isStartish(topLevelType);
      var isResponderTouchMove = responderInst && isMoveish(topLevelType);
      var isResponderTouchEnd = responderInst && isEndish(topLevelType);
      var incrementalTouch = isResponderTouchStart ? eventTypes.responderStart : isResponderTouchMove ? eventTypes.responderMove : isResponderTouchEnd ? eventTypes.responderEnd : null;

      if (incrementalTouch) {
        var gesture = ResponderSyntheticEvent.getPooled(incrementalTouch, responderInst, nativeEvent, nativeEventTarget);
        gesture.touchHistory = ResponderTouchHistoryStore.touchHistory;
        accumulateDirectDispatches(gesture);
        extracted = accumulate(extracted, gesture);
      }

      var isResponderTerminate = responderInst && topLevelType === TOP_TOUCH_CANCEL;
      var isResponderRelease = responderInst && !isResponderTerminate && isEndish(topLevelType) && noResponderTouches(nativeEvent);
      var finalTouch = isResponderTerminate ? eventTypes.responderTerminate : isResponderRelease ? eventTypes.responderRelease : null;

      if (finalTouch) {
        var finalEvent = ResponderSyntheticEvent.getPooled(finalTouch, responderInst, nativeEvent, nativeEventTarget);
        finalEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
        accumulateDirectDispatches(finalEvent);
        extracted = accumulate(extracted, finalEvent);
        changeResponder(null);
      }

      return extracted;
    },
    GlobalResponderHandler: null,
    injection: {
      /**
       * @param {{onChange: (ReactID, ReactID) => void} GlobalResponderHandler
       * Object that handles any change in responder. Use this to inject
       * integration with an existing touch handling system etc.
       */
      injectGlobalResponderHandler: function (GlobalResponderHandler) {
        ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
      }
    }
  };

  // Keep in sync with ReactDOM.js, ReactTestUtils.js, and ReactTestUtilsAct.js:

  var _ReactDOM$__SECRET_IN = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events,
      getInstanceFromNode$1 = _ReactDOM$__SECRET_IN[0],
      getNodeFromInstance$1 = _ReactDOM$__SECRET_IN[1],
      getFiberCurrentPropsFromNode$1 = _ReactDOM$__SECRET_IN[2],
      injectEventPluginsByName = _ReactDOM$__SECRET_IN[3];
  setComponentTree(getFiberCurrentPropsFromNode$1, getInstanceFromNode$1, getNodeFromInstance$1);

  var ReactDOMUnstableNativeDependencies = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ResponderEventPlugin: ResponderEventPlugin,
    ResponderTouchHistoryStore: ResponderTouchHistoryStore,
    injectEventPluginsByName: injectEventPluginsByName
  });

  var unstableNativeDependencies = ReactDOMUnstableNativeDependencies;

  return unstableNativeDependencies;

})));
