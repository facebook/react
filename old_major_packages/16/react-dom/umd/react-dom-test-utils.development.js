/** @license React v16.14.0
 * react-dom-test-utils.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react'), require('react-dom')) :
  typeof define === 'function' && define.amd ? define(['react', 'react-dom'], factory) :
  (global = global || self, global.ReactTestUtils = factory(global.React, global.ReactDOM));
}(this, (function (React, ReactDOM) { 'use strict';

  var ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  var _assign = ReactInternals.assign;

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

  var FunctionComponent = 0;
  var ClassComponent = 1;

  var HostRoot = 3; // Root of a host tree. Could be nested inside another node.

  var HostComponent = 5;
  var HostText = 6;

  // Don't change these two values. They're used by React Dev Tools.
  var NoEffect =
  /*              */
  0;

  var Placement =
  /*             */
  2;
  var Hydrating =
  /*             */
  1024;

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
   * HTML nodeType values that represent the type of the node
   */
  var ELEMENT_NODE = 1;

  // Do not use the below two methods directly!
  // Instead use constants exported from DOMTopLevelEventTypes in ReactDOM.
  // (It is the only module that is allowed to access these methods.)
  function unsafeCastStringToDOMTopLevelType(topLevelType) {
    return topLevelType;
  }

  var canUseDOM = !!(typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.document.createElement !== 'undefined');

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
  var TOP_INPUT = unsafeCastStringToDOMTopLevelType('input');
  var TOP_KEY_DOWN = unsafeCastStringToDOMTopLevelType('keydown');
  var TOP_KEY_PRESS = unsafeCastStringToDOMTopLevelType('keypress');
  var TOP_KEY_UP = unsafeCastStringToDOMTopLevelType('keyup');
  var TOP_LOAD = unsafeCastStringToDOMTopLevelType('load');
  var TOP_LOAD_START = unsafeCastStringToDOMTopLevelType('loadstart');
  var TOP_LOADED_DATA = unsafeCastStringToDOMTopLevelType('loadeddata');
  var TOP_LOADED_METADATA = unsafeCastStringToDOMTopLevelType('loadedmetadata');
  var TOP_MOUSE_DOWN = unsafeCastStringToDOMTopLevelType('mousedown');
  var TOP_MOUSE_MOVE = unsafeCastStringToDOMTopLevelType('mousemove');
  var TOP_MOUSE_OUT = unsafeCastStringToDOMTopLevelType('mouseout');
  var TOP_MOUSE_OVER = unsafeCastStringToDOMTopLevelType('mouseover');
  var TOP_MOUSE_UP = unsafeCastStringToDOMTopLevelType('mouseup');
  var TOP_PASTE = unsafeCastStringToDOMTopLevelType('paste');
  var TOP_PAUSE = unsafeCastStringToDOMTopLevelType('pause');
  var TOP_PLAY = unsafeCastStringToDOMTopLevelType('play');
  var TOP_PLAYING = unsafeCastStringToDOMTopLevelType('playing');
  var TOP_PROGRESS = unsafeCastStringToDOMTopLevelType('progress');
  var TOP_RATE_CHANGE = unsafeCastStringToDOMTopLevelType('ratechange');
  var TOP_SCROLL = unsafeCastStringToDOMTopLevelType('scroll');
  var TOP_SEEKED = unsafeCastStringToDOMTopLevelType('seeked');
  var TOP_SEEKING = unsafeCastStringToDOMTopLevelType('seeking');
  var TOP_SELECTION_CHANGE = unsafeCastStringToDOMTopLevelType('selectionchange');
  var TOP_STALLED = unsafeCastStringToDOMTopLevelType('stalled');
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

  var PLUGIN_EVENT_SYSTEM = 1;

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

        enqueueTaskImpl = nodeRequire('timers').setImmediate;
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

  // ReactDOM.js, and ReactTestUtils.js:

  var _ReactDOM$__SECRET_IN = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events,

  /* eslint-disable no-unused-vars */
  getInstanceFromNode = _ReactDOM$__SECRET_IN[0],
      getNodeFromInstance = _ReactDOM$__SECRET_IN[1],
      getFiberCurrentPropsFromNode = _ReactDOM$__SECRET_IN[2],
      injectEventPluginsByName = _ReactDOM$__SECRET_IN[3],
      eventNameDispatchConfigs = _ReactDOM$__SECRET_IN[4],
      accumulateTwoPhaseDispatches = _ReactDOM$__SECRET_IN[5],
      accumulateDirectDispatches = _ReactDOM$__SECRET_IN[6],
      enqueueStateRestore = _ReactDOM$__SECRET_IN[7],
      restoreStateIfNeeded = _ReactDOM$__SECRET_IN[8],
      dispatchEvent = _ReactDOM$__SECRET_IN[9],
      runEventsInBatch = _ReactDOM$__SECRET_IN[10],

  /* eslint-enable no-unused-vars */
  flushPassiveEffects = _ReactDOM$__SECRET_IN[11],
      IsThisRendererActing = _ReactDOM$__SECRET_IN[12];
  var batchedUpdates = ReactDOM.unstable_batchedUpdates;
  var IsSomeRendererActing = ReactSharedInternals.IsSomeRendererActing; // this implementation should be exactly the same in
  // ReactTestUtilsAct.js, ReactTestRendererAct.js, createReactNoop.js

  var isSchedulerMocked = typeof unstable_flushAllWithoutAsserting === 'function';

  var flushWork = unstable_flushAllWithoutAsserting || function () {
    var didFlushWork = false;

    while (flushPassiveEffects()) {
      didFlushWork = true;
    }

    return didFlushWork;
  };

  function flushWorkAndMicroTasks(onDone) {
    try {
      flushWork();
      enqueueTask(function () {
        if (flushWork()) {
          flushWorkAndMicroTasks(onDone);
        } else {
          onDone();
        }
      });
    } catch (err) {
      onDone(err);
    }
  } // we track the 'depth' of the act() calls with this counter,
  // so we can tell if any async act() calls try to run in parallel.


  var actingUpdatesScopeDepth = 0;

  function act(callback) {

    var previousActingUpdatesScopeDepth = actingUpdatesScopeDepth;
    var previousIsSomeRendererActing;
    var previousIsThisRendererActing;
    actingUpdatesScopeDepth++;
    previousIsSomeRendererActing = IsSomeRendererActing.current;
    previousIsThisRendererActing = IsThisRendererActing.current;
    IsSomeRendererActing.current = true;
    IsThisRendererActing.current = true;

    function onDone() {
      actingUpdatesScopeDepth--;
      IsSomeRendererActing.current = previousIsSomeRendererActing;
      IsThisRendererActing.current = previousIsThisRendererActing;

      {
        if (actingUpdatesScopeDepth > previousActingUpdatesScopeDepth) {
          // if it's _less than_ previousActingUpdatesScopeDepth, then we can assume the 'other' one has warned
          error('You seem to have overlapping act() calls, this is not supported. ' + 'Be sure to await previous act() calls before making a new one. ');
        }
      }
    }

    var result;

    try {
      result = batchedUpdates(callback);
    } catch (error) {
      // on sync errors, we still want to 'cleanup' and decrement actingUpdatesScopeDepth
      onDone();
      throw error;
    }

    if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
      // setup a boolean that gets set to true only
      // once this act() call is await-ed
      var called = false;

      {
        if (typeof Promise !== 'undefined') {
          //eslint-disable-next-line no-undef
          Promise.resolve().then(function () {}).then(function () {
            if (called === false) {
              error('You called act(async () => ...) without await. ' + 'This could lead to unexpected testing behaviour, interleaving multiple act ' + 'calls and mixing their scopes. You should - await act(async () => ...);');
            }
          });
        }
      } // in the async case, the returned thenable runs the callback, flushes
      // effects and  microtasks in a loop until flushPassiveEffects() === false,
      // and cleans up


      return {
        then: function (resolve, reject) {
          called = true;
          result.then(function () {
            if (actingUpdatesScopeDepth > 1 || isSchedulerMocked === true && previousIsSomeRendererActing === true) {
              onDone();
              resolve();
              return;
            } // we're about to exit the act() scope,
            // now's the time to flush tasks/effects


            flushWorkAndMicroTasks(function (err) {
              onDone();

              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }, function (err) {
            onDone();
            reject(err);
          });
        }
      };
    } else {
      {
        if (result !== undefined) {
          error('The callback passed to act(...) function ' + 'must return undefined, or a Promise. You returned %s', result);
        }
      } // flush effects until none remain, and cleanup


      try {
        if (actingUpdatesScopeDepth === 1 && (isSchedulerMocked === false || previousIsSomeRendererActing === false)) {
          // we're about to exit the act() scope,
          // now's the time to flush effects
          flushWork();
        }

        onDone();
      } catch (err) {
        onDone();
        throw err;
      } // in the sync case, the returned thenable only warns *if* await-ed


      return {
        then: function (resolve) {
          {
            error('Do not await the result of calling act(...) with sync logic, it is not a Promise.');
          }

          resolve();
        }
      };
    }
  }

  var findDOMNode = ReactDOM.findDOMNode; // Keep in sync with ReactDOMUnstableNativeDependencies.js
  // ReactDOM.js, and ReactTestUtilsAct.js:

  var _ReactDOM$__SECRET_IN$1 = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events,
      getInstanceFromNode$1 = _ReactDOM$__SECRET_IN$1[0],

  /* eslint-disable no-unused-vars */
  getNodeFromInstance$1 = _ReactDOM$__SECRET_IN$1[1],
      getFiberCurrentPropsFromNode$1 = _ReactDOM$__SECRET_IN$1[2],
      injectEventPluginsByName$1 = _ReactDOM$__SECRET_IN$1[3],

  /* eslint-enable no-unused-vars */
  eventNameDispatchConfigs$1 = _ReactDOM$__SECRET_IN$1[4],
      accumulateTwoPhaseDispatches$1 = _ReactDOM$__SECRET_IN$1[5],
      accumulateDirectDispatches$1 = _ReactDOM$__SECRET_IN$1[6],
      enqueueStateRestore$1 = _ReactDOM$__SECRET_IN$1[7],
      restoreStateIfNeeded$1 = _ReactDOM$__SECRET_IN$1[8],
      dispatchEvent$1 = _ReactDOM$__SECRET_IN$1[9],
      runEventsInBatch$1 = _ReactDOM$__SECRET_IN$1[10],

  /* eslint-disable no-unused-vars */
  flushPassiveEffects$1 = _ReactDOM$__SECRET_IN$1[11],
      IsThisRendererActing$1
  /* eslint-enable no-unused-vars */
  = _ReactDOM$__SECRET_IN$1[12];

  function Event(suffix) {}

  var hasWarnedAboutDeprecatedMockComponent = false;
  /**
   * @class ReactTestUtils
   */

  /**
   * Simulates a top level event being dispatched from a raw event that occurred
   * on an `Element` node.
   * @param {number} topLevelType A number from `TopLevelEventTypes`
   * @param {!Element} node The dom to simulate an event occurring on.
   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
   */

  function simulateNativeEventOnNode(topLevelType, node, fakeNativeEvent) {
    fakeNativeEvent.target = node;
    dispatchEvent$1(topLevelType, PLUGIN_EVENT_SYSTEM, document, fakeNativeEvent);
  }
  /**
   * Simulates a top level event being dispatched from a raw event that occurred
   * on the `ReactDOMComponent` `comp`.
   * @param {Object} topLevelType A type from `BrowserEventConstants.topLevelTypes`.
   * @param {!ReactDOMComponent} comp
   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
   */


  function simulateNativeEventOnDOMComponent(topLevelType, comp, fakeNativeEvent) {
    simulateNativeEventOnNode(topLevelType, findDOMNode(comp), fakeNativeEvent);
  }

  function findAllInRenderedFiberTreeInternal(fiber, test) {
    if (!fiber) {
      return [];
    }

    var currentParent = findCurrentFiberUsingSlowPath(fiber);

    if (!currentParent) {
      return [];
    }

    var node = currentParent;
    var ret = [];

    while (true) {
      if (node.tag === HostComponent || node.tag === HostText || node.tag === ClassComponent || node.tag === FunctionComponent) {
        var publicInst = node.stateNode;

        if (test(publicInst)) {
          ret.push(publicInst);
        }
      }

      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }

      if (node === currentParent) {
        return ret;
      }

      while (!node.sibling) {
        if (!node.return || node.return === currentParent) {
          return ret;
        }

        node = node.return;
      }

      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function validateClassInstance(inst, methodName) {
    if (!inst) {
      // This is probably too relaxed but it's existing behavior.
      return;
    }

    if (get(inst)) {
      // This is a public instance indeed.
      return;
    }

    var received;
    var stringified = '' + inst;

    if (Array.isArray(inst)) {
      received = 'an array';
    } else if (inst && inst.nodeType === ELEMENT_NODE && inst.tagName) {
      received = 'a DOM node';
    } else if (stringified === '[object Object]') {
      received = 'object with keys {' + Object.keys(inst).join(', ') + '}';
    } else {
      received = stringified;
    }

    {
      {
        throw Error( methodName + "(...): the first argument must be a React class instance. Instead received: " + received + "." );
      }
    }
  }
  /**
   * Utilities for making it easy to test React components.
   *
   * See https://reactjs.org/docs/test-utils.html
   *
   * Todo: Support the entire DOM.scry query syntax. For now, these simple
   * utilities will suffice for testing purposes.
   * @lends ReactTestUtils
   */


  var ReactTestUtils = {
    renderIntoDocument: function (element) {
      var div = document.createElement('div'); // None of our tests actually require attaching the container to the
      // DOM, and doing so creates a mess that we rely on test isolation to
      // clean up, so we're going to stop honoring the name of this method
      // (and probably rename it eventually) if no problems arise.
      // document.documentElement.appendChild(div);

      return ReactDOM.render(element, div);
    },
    isElement: function (element) {
      return React.isValidElement(element);
    },
    isElementOfType: function (inst, convenienceConstructor) {
      return React.isValidElement(inst) && inst.type === convenienceConstructor;
    },
    isDOMComponent: function (inst) {
      return !!(inst && inst.nodeType === ELEMENT_NODE && inst.tagName);
    },
    isDOMComponentElement: function (inst) {
      return !!(inst && React.isValidElement(inst) && !!inst.tagName);
    },
    isCompositeComponent: function (inst) {
      if (ReactTestUtils.isDOMComponent(inst)) {
        // Accessing inst.setState warns; just return false as that'll be what
        // this returns when we have DOM nodes as refs directly
        return false;
      }

      return inst != null && typeof inst.render === 'function' && typeof inst.setState === 'function';
    },
    isCompositeComponentWithType: function (inst, type) {
      if (!ReactTestUtils.isCompositeComponent(inst)) {
        return false;
      }

      var internalInstance = get(inst);
      var constructor = internalInstance.type;
      return constructor === type;
    },
    findAllInRenderedTree: function (inst, test) {
      validateClassInstance(inst, 'findAllInRenderedTree');

      if (!inst) {
        return [];
      }

      var internalInstance = get(inst);
      return findAllInRenderedFiberTreeInternal(internalInstance, test);
    },

    /**
     * Finds all instance of components in the rendered tree that are DOM
     * components with the class name matching `className`.
     * @return {array} an array of all the matches.
     */
    scryRenderedDOMComponentsWithClass: function (root, classNames) {
      validateClassInstance(root, 'scryRenderedDOMComponentsWithClass');
      return ReactTestUtils.findAllInRenderedTree(root, function (inst) {
        if (ReactTestUtils.isDOMComponent(inst)) {
          var className = inst.className;

          if (typeof className !== 'string') {
            // SVG, probably.
            className = inst.getAttribute('class') || '';
          }

          var classList = className.split(/\s+/);

          if (!Array.isArray(classNames)) {
            if (!(classNames !== undefined)) {
              {
                throw Error( "TestUtils.scryRenderedDOMComponentsWithClass expects a className as a second argument." );
              }
            }

            classNames = classNames.split(/\s+/);
          }

          return classNames.every(function (name) {
            return classList.indexOf(name) !== -1;
          });
        }

        return false;
      });
    },

    /**
     * Like scryRenderedDOMComponentsWithClass but expects there to be one result,
     * and returns that one result, or throws exception if there is any other
     * number of matches besides one.
     * @return {!ReactDOMComponent} The one match.
     */
    findRenderedDOMComponentWithClass: function (root, className) {
      validateClassInstance(root, 'findRenderedDOMComponentWithClass');
      var all = ReactTestUtils.scryRenderedDOMComponentsWithClass(root, className);

      if (all.length !== 1) {
        throw new Error('Did not find exactly one match (found: ' + all.length + ') ' + 'for class:' + className);
      }

      return all[0];
    },

    /**
     * Finds all instance of components in the rendered tree that are DOM
     * components with the tag name matching `tagName`.
     * @return {array} an array of all the matches.
     */
    scryRenderedDOMComponentsWithTag: function (root, tagName) {
      validateClassInstance(root, 'scryRenderedDOMComponentsWithTag');
      return ReactTestUtils.findAllInRenderedTree(root, function (inst) {
        return ReactTestUtils.isDOMComponent(inst) && inst.tagName.toUpperCase() === tagName.toUpperCase();
      });
    },

    /**
     * Like scryRenderedDOMComponentsWithTag but expects there to be one result,
     * and returns that one result, or throws exception if there is any other
     * number of matches besides one.
     * @return {!ReactDOMComponent} The one match.
     */
    findRenderedDOMComponentWithTag: function (root, tagName) {
      validateClassInstance(root, 'findRenderedDOMComponentWithTag');
      var all = ReactTestUtils.scryRenderedDOMComponentsWithTag(root, tagName);

      if (all.length !== 1) {
        throw new Error('Did not find exactly one match (found: ' + all.length + ') ' + 'for tag:' + tagName);
      }

      return all[0];
    },

    /**
     * Finds all instances of components with type equal to `componentType`.
     * @return {array} an array of all the matches.
     */
    scryRenderedComponentsWithType: function (root, componentType) {
      validateClassInstance(root, 'scryRenderedComponentsWithType');
      return ReactTestUtils.findAllInRenderedTree(root, function (inst) {
        return ReactTestUtils.isCompositeComponentWithType(inst, componentType);
      });
    },

    /**
     * Same as `scryRenderedComponentsWithType` but expects there to be one result
     * and returns that one result, or throws exception if there is any other
     * number of matches besides one.
     * @return {!ReactComponent} The one match.
     */
    findRenderedComponentWithType: function (root, componentType) {
      validateClassInstance(root, 'findRenderedComponentWithType');
      var all = ReactTestUtils.scryRenderedComponentsWithType(root, componentType);

      if (all.length !== 1) {
        throw new Error('Did not find exactly one match (found: ' + all.length + ') ' + 'for componentType:' + componentType);
      }

      return all[0];
    },

    /**
     * Pass a mocked component module to this method to augment it with
     * useful methods that allow it to be used as a dummy React component.
     * Instead of rendering as usual, the component will become a simple
     * <div> containing any provided children.
     *
     * @param {object} module the mock function object exported from a
     *                        module that defines the component to be mocked
     * @param {?string} mockTagName optional dummy root tag name to return
     *                              from render method (overrides
     *                              module.mockTagName if provided)
     * @return {object} the ReactTestUtils object (for chaining)
     */
    mockComponent: function (module, mockTagName) {
      {
        if (!hasWarnedAboutDeprecatedMockComponent) {
          hasWarnedAboutDeprecatedMockComponent = true;

          warn('ReactTestUtils.mockComponent() is deprecated. ' + 'Use shallow rendering or jest.mock() instead.\n\n' + 'See https://fb.me/test-utils-mock-component for more information.');
        }
      }

      mockTagName = mockTagName || module.mockTagName || 'div';
      module.prototype.render.mockImplementation(function () {
        return React.createElement(mockTagName, null, this.props.children);
      });
      return this;
    },
    nativeTouchData: function (x, y) {
      return {
        touches: [{
          pageX: x,
          pageY: y
        }]
      };
    },
    Simulate: null,
    SimulateNative: {},
    act: act
  };
  /**
   * Exports:
   *
   * - `ReactTestUtils.Simulate.click(Element)`
   * - `ReactTestUtils.Simulate.mouseMove(Element)`
   * - `ReactTestUtils.Simulate.change(Element)`
   * - ... (All keys from event plugin `eventTypes` objects)
   */

  function makeSimulator(eventType) {
    return function (domNode, eventData) {
      if (!!React.isValidElement(domNode)) {
        {
          throw Error( "TestUtils.Simulate expected a DOM node as the first argument but received a React element. Pass the DOM node you wish to simulate the event on instead. Note that TestUtils.Simulate will not work if you are using shallow rendering." );
        }
      }

      if (!!ReactTestUtils.isCompositeComponent(domNode)) {
        {
          throw Error( "TestUtils.Simulate expected a DOM node as the first argument but received a component instance. Pass the DOM node you wish to simulate the event on instead." );
        }
      }

      var dispatchConfig = eventNameDispatchConfigs$1[eventType];
      var fakeNativeEvent = new Event();
      fakeNativeEvent.target = domNode;
      fakeNativeEvent.type = eventType.toLowerCase(); // We don't use SyntheticEvent.getPooled in order to not have to worry about
      // properly destroying any properties assigned from `eventData` upon release

      var targetInst = getInstanceFromNode$1(domNode);
      var event = new SyntheticEvent(dispatchConfig, targetInst, fakeNativeEvent, domNode); // Since we aren't using pooling, always persist the event. This will make
      // sure it's marked and won't warn when setting additional properties.

      event.persist();

      _assign(event, eventData);

      if (dispatchConfig.phasedRegistrationNames) {
        accumulateTwoPhaseDispatches$1(event);
      } else {
        accumulateDirectDispatches$1(event);
      }

      ReactDOM.unstable_batchedUpdates(function () {
        // Normally extractEvent enqueues a state restore, but we'll just always
        // do that since we're by-passing it here.
        enqueueStateRestore$1(domNode);
        runEventsInBatch$1(event);
      });
      restoreStateIfNeeded$1();
    };
  }

  function buildSimulators() {
    ReactTestUtils.Simulate = {};
    var eventType;

    for (eventType in eventNameDispatchConfigs$1) {
      /**
       * @param {!Element|ReactDOMComponent} domComponentOrNode
       * @param {?object} eventData Fake event data to use in SyntheticEvent.
       */
      ReactTestUtils.Simulate[eventType] = makeSimulator(eventType);
    }
  }

  buildSimulators();
  /**
   * Exports:
   *
   * - `ReactTestUtils.SimulateNative.click(Element/ReactDOMComponent)`
   * - `ReactTestUtils.SimulateNative.mouseMove(Element/ReactDOMComponent)`
   * - `ReactTestUtils.SimulateNative.mouseIn/ReactDOMComponent)`
   * - `ReactTestUtils.SimulateNative.mouseOut(Element/ReactDOMComponent)`
   * - ... (All keys from `BrowserEventConstants.topLevelTypes`)
   *
   * Note: Top level event types are a subset of the entire set of handler types
   * (which include a broader set of "synthetic" events). For example, onDragDone
   * is a synthetic event. Except when testing an event plugin or React's event
   * handling code specifically, you probably want to use ReactTestUtils.Simulate
   * to dispatch synthetic events.
   */

  function makeNativeSimulator(eventType, topLevelType) {
    return function (domComponentOrNode, nativeEventData) {
      var fakeNativeEvent = new Event(eventType);

      _assign(fakeNativeEvent, nativeEventData);

      if (ReactTestUtils.isDOMComponent(domComponentOrNode)) {
        simulateNativeEventOnDOMComponent(topLevelType, domComponentOrNode, fakeNativeEvent);
      } else if (domComponentOrNode.tagName) {
        // Will allow on actual dom nodes.
        simulateNativeEventOnNode(topLevelType, domComponentOrNode, fakeNativeEvent);
      }
    };
  }

  [[TOP_ABORT, 'abort'], [TOP_ANIMATION_END, 'animationEnd'], [TOP_ANIMATION_ITERATION, 'animationIteration'], [TOP_ANIMATION_START, 'animationStart'], [TOP_BLUR, 'blur'], [TOP_CAN_PLAY_THROUGH, 'canPlayThrough'], [TOP_CAN_PLAY, 'canPlay'], [TOP_CANCEL, 'cancel'], [TOP_CHANGE, 'change'], [TOP_CLICK, 'click'], [TOP_CLOSE, 'close'], [TOP_COMPOSITION_END, 'compositionEnd'], [TOP_COMPOSITION_START, 'compositionStart'], [TOP_COMPOSITION_UPDATE, 'compositionUpdate'], [TOP_CONTEXT_MENU, 'contextMenu'], [TOP_COPY, 'copy'], [TOP_CUT, 'cut'], [TOP_DOUBLE_CLICK, 'doubleClick'], [TOP_DRAG_END, 'dragEnd'], [TOP_DRAG_ENTER, 'dragEnter'], [TOP_DRAG_EXIT, 'dragExit'], [TOP_DRAG_LEAVE, 'dragLeave'], [TOP_DRAG_OVER, 'dragOver'], [TOP_DRAG_START, 'dragStart'], [TOP_DRAG, 'drag'], [TOP_DROP, 'drop'], [TOP_DURATION_CHANGE, 'durationChange'], [TOP_EMPTIED, 'emptied'], [TOP_ENCRYPTED, 'encrypted'], [TOP_ENDED, 'ended'], [TOP_ERROR, 'error'], [TOP_FOCUS, 'focus'], [TOP_INPUT, 'input'], [TOP_KEY_DOWN, 'keyDown'], [TOP_KEY_PRESS, 'keyPress'], [TOP_KEY_UP, 'keyUp'], [TOP_LOAD_START, 'loadStart'], [TOP_LOAD_START, 'loadStart'], [TOP_LOAD, 'load'], [TOP_LOADED_DATA, 'loadedData'], [TOP_LOADED_METADATA, 'loadedMetadata'], [TOP_MOUSE_DOWN, 'mouseDown'], [TOP_MOUSE_MOVE, 'mouseMove'], [TOP_MOUSE_OUT, 'mouseOut'], [TOP_MOUSE_OVER, 'mouseOver'], [TOP_MOUSE_UP, 'mouseUp'], [TOP_PASTE, 'paste'], [TOP_PAUSE, 'pause'], [TOP_PLAY, 'play'], [TOP_PLAYING, 'playing'], [TOP_PROGRESS, 'progress'], [TOP_RATE_CHANGE, 'rateChange'], [TOP_SCROLL, 'scroll'], [TOP_SEEKED, 'seeked'], [TOP_SEEKING, 'seeking'], [TOP_SELECTION_CHANGE, 'selectionChange'], [TOP_STALLED, 'stalled'], [TOP_SUSPEND, 'suspend'], [TOP_TEXT_INPUT, 'textInput'], [TOP_TIME_UPDATE, 'timeUpdate'], [TOP_TOGGLE, 'toggle'], [TOP_TOUCH_CANCEL, 'touchCancel'], [TOP_TOUCH_END, 'touchEnd'], [TOP_TOUCH_MOVE, 'touchMove'], [TOP_TOUCH_START, 'touchStart'], [TOP_TRANSITION_END, 'transitionEnd'], [TOP_VOLUME_CHANGE, 'volumeChange'], [TOP_WAITING, 'waiting'], [TOP_WHEEL, 'wheel']].forEach(function (_ref) {
    var topLevelType = _ref[0],
        eventType = _ref[1];

    /**
     * @param {!Element|ReactDOMComponent} domComponentOrNode
     * @param {?Event} nativeEventData Fake native event to use in SyntheticEvent.
     */
    ReactTestUtils.SimulateNative[eventType] = makeNativeSimulator(eventType, topLevelType);
  });

  // TODO: decide on the top-level export form.
  // This is hacky but makes it work with both Rollup and Jest.


  var testUtils = ReactTestUtils.default || ReactTestUtils;

  return testUtils;

})));
