/** @license React v16.14.0
 * react-test-renderer-shallow.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';



if (process.env.NODE_ENV !== "production") {
  (function() {
'use strict';

var _assign = require('object-assign');
var React = require('react');
var reactIs = require('react-is');
var checkPropTypes = require('prop-types/checkPropTypes');

// Do not require this module directly! Use normal `invariant` calls with
// template literal strings. The messages will be replaced with error codes
// during build.
function formatProdErrorMessage(code) {
  var url = 'https://reactjs.org/docs/error-decoder.html?invariant=' + code;

  for (var i = 1; i < arguments.length; i++) {
    url += '&args[]=' + encodeURIComponent(arguments[i]);
  }

  return "Minified React error #" + code + "; visit " + url + " for the full message or " + 'use the non-minified dev environment for full errors and additional ' + 'helpful warnings.';
}

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
var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;

var Resolved = 1;
function refineResolvedLazyComponent(lazyComponent) {
  return lazyComponent._status === Resolved ? lazyComponent._result : null;
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

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
  return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y // eslint-disable-line no-self-compare
  ;
}

var objectIs = typeof Object.is === 'function' ? Object.is : is;

var hasOwnProperty = Object.prototype.hasOwnProperty;
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
    if (!hasOwnProperty.call(objB, keysA[i]) || !objectIs(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
var RE_RENDER_LIMIT = 25;
var emptyObject = {};

{
  Object.freeze(emptyObject);
} // In DEV, this is the name of the currently executing primitive hook


var currentHookNameInDev;

function areHookInputsEqual(nextDeps, prevDeps) {
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
      error('The final argument passed to %s changed size between renders. The ' + 'order and size of this array must remain constant.\n\n' + 'Previous: %s\n' + 'Incoming: %s', currentHookNameInDev, "[" + nextDeps.join(', ') + "]", "[" + prevDeps.join(', ') + "]");
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

var Updater =
/*#__PURE__*/
function () {
  function Updater(renderer) {
    this._renderer = renderer;
    this._callbacks = [];
  }

  var _proto = Updater.prototype;

  _proto._enqueueCallback = function _enqueueCallback(callback, publicInstance) {
    if (typeof callback === 'function' && publicInstance) {
      this._callbacks.push({
        callback: callback,
        publicInstance: publicInstance
      });
    }
  };

  _proto._invokeCallbacks = function _invokeCallbacks() {
    var callbacks = this._callbacks;
    this._callbacks = [];
    callbacks.forEach(function (_ref) {
      var callback = _ref.callback,
          publicInstance = _ref.publicInstance;
      callback.call(publicInstance);
    });
  };

  _proto.isMounted = function isMounted(publicInstance) {
    return !!this._renderer._element;
  };

  _proto.enqueueForceUpdate = function enqueueForceUpdate(publicInstance, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);

    this._renderer._forcedUpdate = true;

    this._renderer.render(this._renderer._element, this._renderer._context);
  };

  _proto.enqueueReplaceState = function enqueueReplaceState(publicInstance, completeState, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);

    this._renderer._newState = completeState;

    this._renderer.render(this._renderer._element, this._renderer._context);
  };

  _proto.enqueueSetState = function enqueueSetState(publicInstance, partialState, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);

    var currentState = this._renderer._newState || publicInstance.state;

    if (typeof partialState === 'function') {
      partialState = partialState.call(publicInstance, currentState, publicInstance.props);
    } // Null and undefined are treated as no-ops.


    if (partialState === null || partialState === undefined) {
      return;
    }

    this._renderer._newState = _assign({}, currentState, {}, partialState);

    this._renderer.render(this._renderer._element, this._renderer._context);
  };

  return Updater;
}();

function createHook() {
  return {
    memoizedState: null,
    queue: null,
    next: null
  };
}

function basicStateReducer(state, action) {
  // $FlowFixMe: Flow doesn't like mixed types
  return typeof action === 'function' ? action(state) : action;
}

var ReactShallowRenderer =
/*#__PURE__*/
function () {
  function ReactShallowRenderer() {
    this._reset();
  }

  var _proto2 = ReactShallowRenderer.prototype;

  _proto2._reset = function _reset() {
    this._context = null;
    this._element = null;
    this._instance = null;
    this._newState = null;
    this._rendered = null;
    this._rendering = false;
    this._forcedUpdate = false;
    this._updater = new Updater(this);
    this._dispatcher = this._createDispatcher();
    this._workInProgressHook = null;
    this._firstWorkInProgressHook = null;
    this._isReRender = false;
    this._didScheduleRenderPhaseUpdate = false;
    this._renderPhaseUpdates = null;
    this._numberOfReRenders = 0;
  };

  _proto2._validateCurrentlyRenderingComponent = function _validateCurrentlyRenderingComponent() {
    if (!(this._rendering && !this._instance)) {
      {
        throw Error( "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem." );
      }
    }
  };

  _proto2._createDispatcher = function _createDispatcher() {
    var _this = this;

    var useReducer = function (reducer, initialArg, init) {
      _this._validateCurrentlyRenderingComponent();

      _this._createWorkInProgressHook();

      var workInProgressHook = _this._workInProgressHook;

      if (_this._isReRender) {
        // This is a re-render.
        var queue = workInProgressHook.queue;
        var dispatch = queue.dispatch;

        if (_this._numberOfReRenders > 0) {
          // Apply the new render phase updates to the previous current hook.
          if (_this._renderPhaseUpdates !== null) {
            // Render phase updates are stored in a map of queue -> linked list
            var firstRenderPhaseUpdate = _this._renderPhaseUpdates.get(queue);

            if (firstRenderPhaseUpdate !== undefined) {
              _this._renderPhaseUpdates.delete(queue);

              var _newState = workInProgressHook.memoizedState;
              var _update = firstRenderPhaseUpdate;

              do {
                var action = _update.action;
                _newState = reducer(_newState, action);
                _update = _update.next;
              } while (_update !== null);

              workInProgressHook.memoizedState = _newState;
              return [_newState, dispatch];
            }
          }

          return [workInProgressHook.memoizedState, dispatch];
        } // Process updates outside of render


        var newState = workInProgressHook.memoizedState;
        var update = queue.first;

        if (update !== null) {
          do {
            var _action = update.action;
            newState = reducer(newState, _action);
            update = update.next;
          } while (update !== null);

          queue.first = null;
          workInProgressHook.memoizedState = newState;
        }

        return [newState, dispatch];
      } else {
        var initialState;

        if (reducer === basicStateReducer) {
          // Special case for `useState`.
          initialState = typeof initialArg === 'function' ? initialArg() : initialArg;
        } else {
          initialState = init !== undefined ? init(initialArg) : initialArg;
        }

        workInProgressHook.memoizedState = initialState;

        var _queue = workInProgressHook.queue = {
          first: null,
          dispatch: null
        };

        var _dispatch = _queue.dispatch = _this._dispatchAction.bind(_this, _queue);

        return [workInProgressHook.memoizedState, _dispatch];
      }
    };

    var useState = function (initialState) {
      return useReducer(basicStateReducer, // useReducer has a special case to support lazy useState initializers
      initialState);
    };

    var useMemo = function (nextCreate, deps) {
      _this._validateCurrentlyRenderingComponent();

      _this._createWorkInProgressHook();

      var nextDeps = deps !== undefined ? deps : null;

      if (_this._workInProgressHook !== null && _this._workInProgressHook.memoizedState !== null) {
        var prevState = _this._workInProgressHook.memoizedState;
        var prevDeps = prevState[1];

        if (nextDeps !== null) {
          if (areHookInputsEqual(nextDeps, prevDeps)) {
            return prevState[0];
          }
        }
      }

      var nextValue = nextCreate();
      _this._workInProgressHook.memoizedState = [nextValue, nextDeps];
      return nextValue;
    };

    var useRef = function (initialValue) {
      _this._validateCurrentlyRenderingComponent();

      _this._createWorkInProgressHook();

      var previousRef = _this._workInProgressHook.memoizedState;

      if (previousRef === null) {
        var ref = {
          current: initialValue
        };

        {
          Object.seal(ref);
        }

        _this._workInProgressHook.memoizedState = ref;
        return ref;
      } else {
        return previousRef;
      }
    };

    var readContext = function (context, observedBits) {
      return context._currentValue;
    };

    var noOp = function () {
      _this._validateCurrentlyRenderingComponent();
    };

    var identity = function (fn) {
      return fn;
    };

    var useResponder = function (responder, props) {
      return {
        props: props,
        responder: responder
      };
    }; // TODO: implement if we decide to keep the shallow renderer


    var useTransition = function (config) {
      _this._validateCurrentlyRenderingComponent();

      var startTransition = function (callback) {
        callback();
      };

      return [startTransition, false];
    }; // TODO: implement if we decide to keep the shallow renderer


    var useDeferredValue = function (value, config) {
      _this._validateCurrentlyRenderingComponent();

      return value;
    };

    return {
      readContext: readContext,
      useCallback: identity,
      useContext: function (context) {
        _this._validateCurrentlyRenderingComponent();

        return readContext(context);
      },
      useDebugValue: noOp,
      useEffect: noOp,
      useImperativeHandle: noOp,
      useLayoutEffect: noOp,
      useMemo: useMemo,
      useReducer: useReducer,
      useRef: useRef,
      useState: useState,
      useResponder: useResponder,
      useTransition: useTransition,
      useDeferredValue: useDeferredValue
    };
  };

  _proto2._dispatchAction = function _dispatchAction(queue, action) {
    if (!(this._numberOfReRenders < RE_RENDER_LIMIT)) {
      {
        throw Error( "Too many re-renders. React limits the number of renders to prevent an infinite loop." );
      }
    }

    if (this._rendering) {
      // This is a render phase update. Stash it in a lazily-created map of
      // queue -> linked list of updates. After this render pass, we'll restart
      // and apply the stashed updates on top of the work-in-progress hook.
      this._didScheduleRenderPhaseUpdate = true;
      var update = {
        action: action,
        next: null
      };
      var renderPhaseUpdates = this._renderPhaseUpdates;

      if (renderPhaseUpdates === null) {
        this._renderPhaseUpdates = renderPhaseUpdates = new Map();
      }

      var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

      if (firstRenderPhaseUpdate === undefined) {
        renderPhaseUpdates.set(queue, update);
      } else {
        // Append the update to the end of the list.
        var lastRenderPhaseUpdate = firstRenderPhaseUpdate;

        while (lastRenderPhaseUpdate.next !== null) {
          lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
        }

        lastRenderPhaseUpdate.next = update;
      }
    } else {
      var _update2 = {
        action: action,
        next: null
      }; // Append the update to the end of the list.

      var last = queue.first;

      if (last === null) {
        queue.first = _update2;
      } else {
        while (last.next !== null) {
          last = last.next;
        }

        last.next = _update2;
      } // Re-render now.


      this.render(this._element, this._context);
    }
  };

  _proto2._createWorkInProgressHook = function _createWorkInProgressHook() {
    if (this._workInProgressHook === null) {
      // This is the first hook in the list
      if (this._firstWorkInProgressHook === null) {
        this._isReRender = false;
        this._firstWorkInProgressHook = this._workInProgressHook = createHook();
      } else {
        // There's already a work-in-progress. Reuse it.
        this._isReRender = true;
        this._workInProgressHook = this._firstWorkInProgressHook;
      }
    } else {
      if (this._workInProgressHook.next === null) {
        this._isReRender = false; // Append to the end of the list

        this._workInProgressHook = this._workInProgressHook.next = createHook();
      } else {
        // There's already a work-in-progress. Reuse it.
        this._isReRender = true;
        this._workInProgressHook = this._workInProgressHook.next;
      }
    }

    return this._workInProgressHook;
  };

  _proto2._finishHooks = function _finishHooks(element, context) {
    if (this._didScheduleRenderPhaseUpdate) {
      // Updates were scheduled during the render phase. They are stored in
      // the `renderPhaseUpdates` map. Call the component again, reusing the
      // work-in-progress hooks and applying the additional updates on top. Keep
      // restarting until no more updates are scheduled.
      this._didScheduleRenderPhaseUpdate = false;
      this._numberOfReRenders += 1; // Start over from the beginning of the list

      this._workInProgressHook = null;
      this._rendering = false;
      this.render(element, context);
    } else {
      this._workInProgressHook = null;
      this._renderPhaseUpdates = null;
      this._numberOfReRenders = 0;
    }
  };

  _proto2.getMountedInstance = function getMountedInstance() {
    return this._instance;
  };

  _proto2.getRenderOutput = function getRenderOutput() {
    return this._rendered;
  };

  _proto2.render = function render(element) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : emptyObject;

    if (!React.isValidElement(element)) {
      {
        throw Error( "ReactShallowRenderer render(): Invalid component element." + (typeof element === 'function' ? ' Instead of passing a component class, make sure to instantiate ' + 'it by passing it to React.createElement.' : '') );
      }
    }

    element = element; // Show a special message for host elements since it's a common case.

    if (!(typeof element.type !== 'string')) {
      {
        throw Error( "ReactShallowRenderer render(): Shallow rendering works only with custom components, not primitives (" + element.type + "). Instead of calling `.render(el)` and inspecting the rendered output, look at `el.props` directly instead." );
      }
    }

    if (!(reactIs.isForwardRef(element) || typeof element.type === 'function' || reactIs.isMemo(element))) {
      {
        throw Error( "ReactShallowRenderer render(): Shallow rendering works only with custom components, but the provided element type was `" + (Array.isArray(element.type) ? 'array' : element.type === null ? 'null' : typeof element.type) + "`." );
      }
    }

    if (this._rendering) {
      return;
    }

    if (this._element != null && this._element.type !== element.type) {
      this._reset();
    }

    var elementType = reactIs.isMemo(element) ? element.type.type : element.type;
    var previousElement = this._element;
    this._rendering = true;
    this._element = element;
    this._context = getMaskedContext(elementType.contextTypes, context); // Inner memo component props aren't currently validated in createElement.

    if (reactIs.isMemo(element) && elementType.propTypes) {
      currentlyValidatingElement = element;
      checkPropTypes(elementType.propTypes, element.props, 'prop', getComponentName(elementType), getStackAddendum);
    }

    if (this._instance) {
      this._updateClassComponent(elementType, element, this._context);
    } else {
      if (shouldConstruct(elementType)) {
        this._instance = new elementType(element.props, this._context, this._updater);

        if (typeof elementType.getDerivedStateFromProps === 'function') {
          var partialState = elementType.getDerivedStateFromProps.call(null, element.props, this._instance.state);

          if (partialState != null) {
            this._instance.state = _assign({}, this._instance.state, partialState);
          }
        }

        if (elementType.contextTypes) {
          currentlyValidatingElement = element;
          checkPropTypes(elementType.contextTypes, this._context, 'context', getName(elementType, this._instance), getStackAddendum);
          currentlyValidatingElement = null;
        }

        this._mountClassComponent(elementType, element, this._context);
      } else {
        var shouldRender = true;

        if (reactIs.isMemo(element) && previousElement !== null) {
          // This is a Memo component that is being re-rendered.
          var compare = element.type.compare || shallowEqual;

          if (compare(previousElement.props, element.props)) {
            shouldRender = false;
          }
        }

        if (shouldRender) {
          var prevDispatcher = ReactCurrentDispatcher.current;
          ReactCurrentDispatcher.current = this._dispatcher;

          try {
            // elementType could still be a ForwardRef if it was
            // nested inside Memo.
            if (elementType.$$typeof === reactIs.ForwardRef) {
              if (!(typeof elementType.render === 'function')) {
                {
                  throw Error(true ? "forwardRef requires a render function but was given " + typeof elementType.render + "." : formatProdErrorMessage(322, typeof elementType.render));
                }
              }

              this._rendered = elementType.render.call(undefined, element.props, element.ref);
            } else {
              this._rendered = elementType(element.props, this._context);
            }
          } finally {
            ReactCurrentDispatcher.current = prevDispatcher;
          }

          this._finishHooks(element, context);
        }
      }
    }

    this._rendering = false;

    this._updater._invokeCallbacks();

    return this.getRenderOutput();
  };

  _proto2.unmount = function unmount() {
    if (this._instance) {
      if (typeof this._instance.componentWillUnmount === 'function') {
        this._instance.componentWillUnmount();
      }
    }

    this._reset();
  };

  _proto2._mountClassComponent = function _mountClassComponent(elementType, element, context) {
    this._instance.context = context;
    this._instance.props = element.props;
    this._instance.state = this._instance.state || null;
    this._instance.updater = this._updater;

    if (typeof this._instance.UNSAFE_componentWillMount === 'function' || typeof this._instance.componentWillMount === 'function') {
      var beforeState = this._newState; // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.

      if (typeof elementType.getDerivedStateFromProps !== 'function' && typeof this._instance.getSnapshotBeforeUpdate !== 'function') {
        if (typeof this._instance.componentWillMount === 'function') {
          this._instance.componentWillMount();
        }

        if (typeof this._instance.UNSAFE_componentWillMount === 'function') {
          this._instance.UNSAFE_componentWillMount();
        }
      } // setState may have been called during cWM


      if (beforeState !== this._newState) {
        this._instance.state = this._newState || emptyObject;
      }
    }

    this._rendered = this._instance.render(); // Intentionally do not call componentDidMount()
    // because DOM refs are not available.
  };

  _proto2._updateClassComponent = function _updateClassComponent(elementType, element, context) {
    var props = element.props;
    var oldState = this._instance.state || emptyObject;
    var oldProps = this._instance.props;

    if (oldProps !== props) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (typeof elementType.getDerivedStateFromProps !== 'function' && typeof this._instance.getSnapshotBeforeUpdate !== 'function') {
        if (typeof this._instance.componentWillReceiveProps === 'function') {
          this._instance.componentWillReceiveProps(props, context);
        }

        if (typeof this._instance.UNSAFE_componentWillReceiveProps === 'function') {
          this._instance.UNSAFE_componentWillReceiveProps(props, context);
        }
      }
    } // Read state after cWRP in case it calls setState


    var state = this._newState || oldState;

    if (typeof elementType.getDerivedStateFromProps === 'function') {
      var partialState = elementType.getDerivedStateFromProps.call(null, props, state);

      if (partialState != null) {
        state = _assign({}, state, partialState);
      }
    }

    var shouldUpdate = true;

    if (this._forcedUpdate) {
      shouldUpdate = true;
      this._forcedUpdate = false;
    } else if (typeof this._instance.shouldComponentUpdate === 'function') {
      shouldUpdate = !!this._instance.shouldComponentUpdate(props, state, context);
    } else if (elementType.prototype && elementType.prototype.isPureReactComponent) {
      shouldUpdate = !shallowEqual(oldProps, props) || !shallowEqual(oldState, state);
    }

    if (shouldUpdate) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (typeof elementType.getDerivedStateFromProps !== 'function' && typeof this._instance.getSnapshotBeforeUpdate !== 'function') {
        if (typeof this._instance.componentWillUpdate === 'function') {
          this._instance.componentWillUpdate(props, state, context);
        }

        if (typeof this._instance.UNSAFE_componentWillUpdate === 'function') {
          this._instance.UNSAFE_componentWillUpdate(props, state, context);
        }
      }
    }

    this._instance.context = context;
    this._instance.props = props;
    this._instance.state = state;
    this._newState = null;

    if (shouldUpdate) {
      this._rendered = this._instance.render();
    } // Intentionally do not call componentDidUpdate()
    // because DOM refs are not available.

  };

  return ReactShallowRenderer;
}();

ReactShallowRenderer.createRenderer = function () {
  return new ReactShallowRenderer();
};

var currentlyValidatingElement = null;

function getDisplayName(element) {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    var elementType = reactIs.isMemo(element) ? element.type.type : element.type;
    return elementType.displayName || elementType.name || 'Unknown';
  }
}

function getStackAddendum() {
  var stack = '';

  if (currentlyValidatingElement) {
    var name = getDisplayName(currentlyValidatingElement);
    var owner = currentlyValidatingElement._owner;
    stack += describeComponentFrame(name, currentlyValidatingElement._source, owner && getComponentName(owner.type));
  }

  return stack;
}

function getName(type, instance) {
  var constructor = instance && instance.constructor;
  return type.displayName || constructor && constructor.displayName || type.name || constructor && constructor.name || null;
}

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

function getMaskedContext(contextTypes, unmaskedContext) {
  if (!contextTypes || !unmaskedContext) {
    return emptyObject;
  }

  var context = {};

  for (var key in contextTypes) {
    context[key] = unmaskedContext[key];
  }

  return context;
}

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest.


var shallow = ReactShallowRenderer.default || ReactShallowRenderer;

module.exports = shallow;
  })();
}
