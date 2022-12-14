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
  Transform = require("art/core/transform"),
  Mode$1 = require("art/modes/current"),
  Scheduler = require("scheduler"),
  FastNoSideEffects = require("art/modes/fast-noSideEffects");
function _extends() {
  _extends =
    Object.assign ||
    function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i],
          key;
        for (key in source)
          Object.prototype.hasOwnProperty.call(source, key) &&
            (target[key] = source[key]);
      }
      return target;
    };
  return _extends.apply(this, arguments);
}
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}
function _assertThisInitialized(self) {
  if (void 0 === self)
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  return self;
}
var assign = Object.assign;
function formatProdErrorMessage(code) {
  for (
    var url = "https://reactjs.org/docs/error-decoder.html?invariant=" + code,
      i = 1;
    i < arguments.length;
    i++
  )
    url += "&args[]=" + encodeURIComponent(arguments[i]);
  return (
    "Minified React error #" +
    code +
    "; visit " +
    url +
    " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
  );
}
var ReactSharedInternals =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  dynamicFeatureFlags = require("ReactFeatureFlags"),
  deferRenderPhaseUpdateToNextBatch =
    dynamicFeatureFlags.deferRenderPhaseUpdateToNextBatch,
  enableDebugTracing = dynamicFeatureFlags.enableDebugTracing,
  skipUnmountedBoundaries = dynamicFeatureFlags.skipUnmountedBoundaries,
  enableUseRefAccessWarning = dynamicFeatureFlags.enableUseRefAccessWarning,
  disableNativeComponentFrames =
    dynamicFeatureFlags.disableNativeComponentFrames,
  disableSchedulerTimeoutInWorkLoop =
    dynamicFeatureFlags.disableSchedulerTimeoutInWorkLoop,
  enableLazyContextPropagation =
    dynamicFeatureFlags.enableLazyContextPropagation,
  enableTransitionTracing = dynamicFeatureFlags.enableTransitionTracing,
  REACT_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_PORTAL_TYPE = Symbol.for("react.portal"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
  REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
  REACT_PROVIDER_TYPE = Symbol.for("react.provider"),
  REACT_CONTEXT_TYPE = Symbol.for("react.context"),
  REACT_SERVER_CONTEXT_TYPE = Symbol.for("react.server_context"),
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
  REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
  REACT_MEMO_TYPE = Symbol.for("react.memo"),
  REACT_LAZY_TYPE = Symbol.for("react.lazy"),
  REACT_SCOPE_TYPE = Symbol.for("react.scope"),
  REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode"),
  REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen"),
  REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden"),
  REACT_CACHE_TYPE = Symbol.for("react.cache"),
  REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker"),
  REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for(
    "react.default_value"
  ),
  REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel"),
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
function getNearestMountedFiber(fiber) {
  var node = fiber,
    nearestMounted = fiber;
  if (fiber.alternate) for (; node.return; ) node = node.return;
  else {
    fiber = node;
    do
      (node = fiber),
        0 !== (node.flags & 4098) && (nearestMounted = node.return),
        (fiber = node.return);
    while (fiber);
  }
  return 3 === node.tag ? nearestMounted : null;
}
function assertIsMounted(fiber) {
  if (getNearestMountedFiber(fiber) !== fiber)
    throw Error(formatProdErrorMessage(188));
}
function findCurrentFiberUsingSlowPath(fiber) {
  var alternate = fiber.alternate;
  if (!alternate) {
    alternate = getNearestMountedFiber(fiber);
    if (null === alternate) throw Error(formatProdErrorMessage(188));
    return alternate !== fiber ? null : fiber;
  }
  for (var a = fiber, b = alternate; ; ) {
    var parentA = a.return;
    if (null === parentA) break;
    var parentB = parentA.alternate;
    if (null === parentB) {
      b = parentA.return;
      if (null !== b) {
        a = b;
        continue;
      }
      break;
    }
    if (parentA.child === parentB.child) {
      for (parentB = parentA.child; parentB; ) {
        if (parentB === a) return assertIsMounted(parentA), fiber;
        if (parentB === b) return assertIsMounted(parentA), alternate;
        parentB = parentB.sibling;
      }
      throw Error(formatProdErrorMessage(188));
    }
    if (a.return !== b.return) (a = parentA), (b = parentB);
    else {
      for (var didFindChild = !1, child$0 = parentA.child; child$0; ) {
        if (child$0 === a) {
          didFindChild = !0;
          a = parentA;
          b = parentB;
          break;
        }
        if (child$0 === b) {
          didFindChild = !0;
          b = parentA;
          a = parentB;
          break;
        }
        child$0 = child$0.sibling;
      }
      if (!didFindChild) {
        for (child$0 = parentB.child; child$0; ) {
          if (child$0 === a) {
            didFindChild = !0;
            a = parentB;
            b = parentA;
            break;
          }
          if (child$0 === b) {
            didFindChild = !0;
            b = parentB;
            a = parentA;
            break;
          }
          child$0 = child$0.sibling;
        }
        if (!didFindChild) throw Error(formatProdErrorMessage(189));
      }
    }
    if (a.alternate !== b) throw Error(formatProdErrorMessage(190));
  }
  if (3 !== a.tag) throw Error(formatProdErrorMessage(188));
  return a.stateNode.current === a ? fiber : alternate;
}
function findCurrentHostFiberImpl(node) {
  var tag = node.tag;
  if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
  for (node = node.child; null !== node; ) {
    tag = findCurrentHostFiberImpl(node);
    if (null !== tag) return tag;
    node = node.sibling;
  }
  return null;
}
function isFiberSuspenseAndTimedOut(fiber) {
  var memoizedState = fiber.memoizedState;
  return (
    13 === fiber.tag &&
    null !== memoizedState &&
    null === memoizedState.dehydrated
  );
}
function doesFiberContain(parentFiber, childFiber) {
  for (
    var parentFiberAlternate = parentFiber.alternate;
    null !== childFiber;

  ) {
    if (childFiber === parentFiber || childFiber === parentFiberAlternate)
      return !0;
    childFiber = childFiber.return;
  }
  return !1;
}
var isArrayImpl = Array.isArray,
  TYPES = {
    CLIPPING_RECTANGLE: "ClippingRectangle",
    GROUP: "Group",
    SHAPE: "Shape",
    TEXT: "Text"
  },
  EVENT_TYPES = {
    onClick: "click",
    onMouseMove: "mousemove",
    onMouseOver: "mouseover",
    onMouseOut: "mouseout",
    onMouseUp: "mouseup",
    onMouseDown: "mousedown"
  };
function childrenAsString(children) {
  return children
    ? "string" === typeof children
      ? children
      : children.length
      ? children.join("")
      : ""
    : "";
}
var scheduleCallback = Scheduler.unstable_scheduleCallback,
  cancelCallback = Scheduler.unstable_cancelCallback,
  shouldYield = Scheduler.unstable_shouldYield,
  requestPaint = Scheduler.unstable_requestPaint,
  now = Scheduler.unstable_now,
  ImmediatePriority = Scheduler.unstable_ImmediatePriority,
  UserBlockingPriority = Scheduler.unstable_UserBlockingPriority,
  NormalPriority = Scheduler.unstable_NormalPriority,
  IdlePriority = Scheduler.unstable_IdlePriority,
  rendererID = null,
  injectedHook = null;
function onCommitRoot(root) {
  if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
    try {
      injectedHook.onCommitFiberRoot(
        rendererID,
        root,
        void 0,
        128 === (root.current.flags & 128)
      );
    } catch (err) {}
}
var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback,
  log = Math.log,
  LN2 = Math.LN2;
function clz32Fallback(x) {
  x >>>= 0;
  return 0 === x ? 32 : (31 - ((log(x) / LN2) | 0)) | 0;
}
var nextTransitionLane = 64,
  nextRetryLane = 4194304;
function getHighestPriorityLanes(lanes) {
  switch (lanes & -lanes) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return lanes & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return lanes & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return lanes;
  }
}
function getNextLanes(root, wipLanes) {
  var pendingLanes = root.pendingLanes;
  if (0 === pendingLanes) return 0;
  var nextLanes = 0,
    suspendedLanes = root.suspendedLanes,
    pingedLanes = root.pingedLanes,
    nonIdlePendingLanes = pendingLanes & 268435455;
  if (0 !== nonIdlePendingLanes) {
    var nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
    0 !== nonIdleUnblockedLanes
      ? (nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes))
      : ((pingedLanes &= nonIdlePendingLanes),
        0 !== pingedLanes &&
          (nextLanes = getHighestPriorityLanes(pingedLanes)));
  } else
    (nonIdlePendingLanes = pendingLanes & ~suspendedLanes),
      0 !== nonIdlePendingLanes
        ? (nextLanes = getHighestPriorityLanes(nonIdlePendingLanes))
        : 0 !== pingedLanes &&
          (nextLanes = getHighestPriorityLanes(pingedLanes));
  if (0 === nextLanes) return 0;
  if (
    0 !== wipLanes &&
    wipLanes !== nextLanes &&
    0 === (wipLanes & suspendedLanes) &&
    ((suspendedLanes = nextLanes & -nextLanes),
    (pingedLanes = wipLanes & -wipLanes),
    suspendedLanes >= pingedLanes ||
      (16 === suspendedLanes && 0 !== (pingedLanes & 4194240)))
  )
    return wipLanes;
  0 === (root.current.mode & 32) &&
    0 !== (nextLanes & 4) &&
    (nextLanes |= pendingLanes & 16);
  wipLanes = root.entangledLanes;
  if (0 !== wipLanes)
    for (root = root.entanglements, wipLanes &= nextLanes; 0 < wipLanes; )
      (pendingLanes = 31 - clz32(wipLanes)),
        (suspendedLanes = 1 << pendingLanes),
        (nextLanes |= root[pendingLanes]),
        (wipLanes &= ~suspendedLanes);
  return nextLanes;
}
function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case 1:
    case 2:
    case 4:
      return currentTime + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return currentTime + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function getLanesToRetrySynchronouslyOnError(root, originallyAttemptedLanes) {
  if (root.errorRecoveryDisabledLanes & originallyAttemptedLanes) return 0;
  root = root.pendingLanes & -1073741825;
  return 0 !== root ? root : root & 1073741824 ? 1073741824 : 0;
}
function includesBlockingLane(root, lanes) {
  return 0 !== (root.current.mode & 32) ? !1 : 0 !== (lanes & 30);
}
function claimNextTransitionLane() {
  var lane = nextTransitionLane;
  nextTransitionLane <<= 1;
  0 === (nextTransitionLane & 4194240) && (nextTransitionLane = 64);
  return lane;
}
function createLaneMap(initial) {
  for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
  return laneMap;
}
function markRootUpdated(root, updateLane, eventTime) {
  root.pendingLanes |= updateLane;
  536870912 !== updateLane &&
    ((root.suspendedLanes = 0), (root.pingedLanes = 0));
  root = root.eventTimes;
  updateLane = 31 - clz32(updateLane);
  root[updateLane] = eventTime;
}
function markRootFinished(root, remainingLanes) {
  var noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
  root.pendingLanes = remainingLanes;
  root.suspendedLanes = 0;
  root.pingedLanes = 0;
  root.expiredLanes &= remainingLanes;
  root.mutableReadLanes &= remainingLanes;
  root.entangledLanes &= remainingLanes;
  root.errorRecoveryDisabledLanes &= remainingLanes;
  remainingLanes = root.entanglements;
  var eventTimes = root.eventTimes,
    expirationTimes = root.expirationTimes;
  for (root = root.hiddenUpdates; 0 < noLongerPendingLanes; ) {
    var index$5 = 31 - clz32(noLongerPendingLanes),
      lane = 1 << index$5;
    remainingLanes[index$5] = 0;
    eventTimes[index$5] = -1;
    expirationTimes[index$5] = -1;
    var hiddenUpdatesForLane = root[index$5];
    if (null !== hiddenUpdatesForLane)
      for (
        root[index$5] = null, index$5 = 0;
        index$5 < hiddenUpdatesForLane.length;
        index$5++
      ) {
        var update = hiddenUpdatesForLane[index$5];
        null !== update && (update.lane &= -1073741825);
      }
    noLongerPendingLanes &= ~lane;
  }
}
function markRootEntangled(root, entangledLanes) {
  var rootEntangledLanes = (root.entangledLanes |= entangledLanes);
  for (root = root.entanglements; rootEntangledLanes; ) {
    var index$6 = 31 - clz32(rootEntangledLanes),
      lane = 1 << index$6;
    (lane & entangledLanes) | (root[index$6] & entangledLanes) &&
      (root[index$6] |= entangledLanes);
    rootEntangledLanes &= ~lane;
  }
}
function getTransitionsForLanes(root, lanes) {
  if (!enableTransitionTracing) return null;
  for (var transitionsForLanes = []; 0 < lanes; ) {
    var index$8 = 31 - clz32(lanes),
      lane = 1 << index$8;
    index$8 = root.transitionLanes[index$8];
    null !== index$8 &&
      index$8.forEach(function(transition) {
        transitionsForLanes.push(transition);
      });
    lanes &= ~lane;
  }
  return 0 === transitionsForLanes.length ? null : transitionsForLanes;
}
function clearTransitionsForLanes(root, lanes) {
  if (enableTransitionTracing)
    for (; 0 < lanes; ) {
      var index$9 = 31 - clz32(lanes),
        lane = 1 << index$9;
      null !== root.transitionLanes[index$9] &&
        (root.transitionLanes[index$9] = null);
      lanes &= ~lane;
    }
}
var currentUpdatePriority = 0;
function lanesToEventPriority(lanes) {
  lanes &= -lanes;
  return 1 < lanes
    ? 4 < lanes
      ? 0 !== (lanes & 268435455)
        ? 16
        : 536870912
      : 4
    : 1;
}
function shim() {
  throw Error(formatProdErrorMessage(305));
}
function shim$1() {
  throw Error(formatProdErrorMessage(357));
}
var pooledTransform = new Transform(),
  NO_CONTEXT = {},
  UPDATE_SIGNAL = {};
function createEventHandler(instance) {
  return function(event) {
    var listener = instance._listeners[event.type];
    listener &&
      ("function" === typeof listener
        ? listener.call(instance, event)
        : listener.handleEvent && listener.handleEvent(event));
  };
}
function destroyEventListeners(instance) {
  if (instance._subscriptions)
    for (var type in instance._subscriptions) instance._subscriptions[type]();
  instance._subscriptions = null;
  instance._listeners = null;
}
function applyClippingRectangleProps(instance, props) {
  applyNodeProps(
    instance,
    props,
    2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {}
  );
  instance.width = props.width;
  instance.height = props.height;
}
function applyGroupProps(instance, props) {
  applyNodeProps(
    instance,
    props,
    2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {}
  );
  instance.width = props.width;
  instance.height = props.height;
}
function applyNodeProps(instance, props) {
  var prevProps =
    2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {};
  var JSCompiler_inline_result =
    null != props.scaleX ? props.scaleX : null != props.scale ? props.scale : 1;
  var JSCompiler_inline_result$jscomp$0 =
    null != props.scaleY ? props.scaleY : null != props.scale ? props.scale : 1;
  pooledTransform
    .transformTo(1, 0, 0, 1, 0, 0)
    .move(props.x || 0, props.y || 0)
    .rotate(props.rotation || 0, props.originX, props.originY)
    .scale(
      JSCompiler_inline_result,
      JSCompiler_inline_result$jscomp$0,
      props.originX,
      props.originY
    );
  null != props.transform && pooledTransform.transform(props.transform);
  (instance.xx === pooledTransform.xx &&
    instance.yx === pooledTransform.yx &&
    instance.xy === pooledTransform.xy &&
    instance.yy === pooledTransform.yy &&
    instance.x === pooledTransform.x &&
    instance.y === pooledTransform.y) ||
    instance.transformTo(pooledTransform);
  (props.cursor === prevProps.cursor && props.title === prevProps.title) ||
    instance.indicate(props.cursor, props.title);
  instance.blend &&
    props.opacity !== prevProps.opacity &&
    instance.blend(null == props.opacity ? 1 : props.opacity);
  props.visible !== prevProps.visible &&
    (null == props.visible || props.visible
      ? instance.show()
      : instance.hide());
  for (var type in EVENT_TYPES)
    (prevProps = instance),
      (JSCompiler_inline_result = EVENT_TYPES[type]),
      (JSCompiler_inline_result$jscomp$0 = props[type]),
      prevProps._listeners ||
        ((prevProps._listeners = {}), (prevProps._subscriptions = {})),
      (prevProps._listeners[
        JSCompiler_inline_result
      ] = JSCompiler_inline_result$jscomp$0)
        ? prevProps._subscriptions[JSCompiler_inline_result] ||
          (prevProps._subscriptions[
            JSCompiler_inline_result
          ] = prevProps.subscribe(
            JSCompiler_inline_result,
            createEventHandler(prevProps),
            prevProps
          ))
        : prevProps._subscriptions[JSCompiler_inline_result] &&
          (prevProps._subscriptions[JSCompiler_inline_result](),
          delete prevProps._subscriptions[JSCompiler_inline_result]);
}
function applyRenderableNodeProps(instance, props) {
  var prevProps =
    2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {};
  applyNodeProps(instance, props, prevProps);
  prevProps.fill !== props.fill &&
    (props.fill && props.fill.applyFill
      ? props.fill.applyFill(instance)
      : instance.fill(props.fill));
  (prevProps.stroke === props.stroke &&
    prevProps.strokeWidth === props.strokeWidth &&
    prevProps.strokeCap === props.strokeCap &&
    prevProps.strokeJoin === props.strokeJoin &&
    prevProps.strokeDash === props.strokeDash) ||
    instance.stroke(
      props.stroke,
      props.strokeWidth,
      props.strokeCap,
      props.strokeJoin,
      props.strokeDash
    );
}
function applyShapeProps(instance, props) {
  var prevProps =
    2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {};
  applyRenderableNodeProps(instance, props, prevProps);
  var path = props.d || childrenAsString(props.children),
    prevDelta = instance._prevDelta;
  if (
    path !== instance._prevPath ||
    path.delta !== prevDelta ||
    prevProps.height !== props.height ||
    prevProps.width !== props.width
  )
    instance.draw(path, props.width, props.height),
      (instance._prevDelta = path.delta),
      (instance._prevPath = path);
}
function applyTextProps(instance, props) {
  var prevProps =
    2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {};
  applyRenderableNodeProps(instance, props, prevProps);
  var string = props.children,
    JSCompiler_temp;
  if (!(JSCompiler_temp = instance._currentString !== string)) {
    JSCompiler_temp = props.font;
    var newFont = prevProps.font;
    JSCompiler_temp =
      JSCompiler_temp === newFont
        ? !0
        : "string" === typeof newFont || "string" === typeof JSCompiler_temp
        ? !1
        : newFont.fontSize === JSCompiler_temp.fontSize &&
          newFont.fontStyle === JSCompiler_temp.fontStyle &&
          newFont.fontVariant === JSCompiler_temp.fontVariant &&
          newFont.fontWeight === JSCompiler_temp.fontWeight &&
          newFont.fontFamily === JSCompiler_temp.fontFamily;
    JSCompiler_temp = !JSCompiler_temp;
  }
  if (
    JSCompiler_temp ||
    props.alignment !== prevProps.alignment ||
    props.path !== prevProps.path
  )
    instance.draw(string, props.font, props.alignment, props.path),
      (instance._currentString = string);
}
var scheduleTimeout = setTimeout,
  cancelTimeout = clearTimeout;
function shouldSetTextContent(type, props) {
  return (
    "string" === typeof props.children || "number" === typeof props.children
  );
}
var prefix;
function describeBuiltInComponentFrame(name) {
  if (void 0 === prefix)
    try {
      throw Error();
    } catch (x) {
      var match = x.stack.trim().match(/\n( *(at )?)/);
      prefix = (match && match[1]) || "";
    }
  return "\n" + prefix + name;
}
var reentry = !1;
function describeNativeComponentFrame(fn, construct) {
  if (disableNativeComponentFrames || !fn || reentry) return "";
  reentry = !0;
  var previousPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (construct)
      if (
        ((construct = function() {
          throw Error();
        }),
        Object.defineProperty(construct.prototype, "props", {
          set: function() {
            throw Error();
          }
        }),
        "object" === typeof Reflect && Reflect.construct)
      ) {
        try {
          Reflect.construct(construct, []);
        } catch (x) {
          var control = x;
        }
        Reflect.construct(fn, [], construct);
      } else {
        try {
          construct.call();
        } catch (x$10) {
          control = x$10;
        }
        fn.call(construct.prototype);
      }
    else {
      try {
        throw Error();
      } catch (x$11) {
        control = x$11;
      }
      fn();
    }
  } catch (sample) {
    if (sample && control && "string" === typeof sample.stack) {
      for (
        var sampleLines = sample.stack.split("\n"),
          controlLines = control.stack.split("\n"),
          s = sampleLines.length - 1,
          c = controlLines.length - 1;
        1 <= s && 0 <= c && sampleLines[s] !== controlLines[c];

      )
        c--;
      for (; 1 <= s && 0 <= c; s--, c--)
        if (sampleLines[s] !== controlLines[c]) {
          if (1 !== s || 1 !== c) {
            do
              if ((s--, c--, 0 > c || sampleLines[s] !== controlLines[c])) {
                var frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                fn.displayName &&
                  frame.includes("<anonymous>") &&
                  (frame = frame.replace("<anonymous>", fn.displayName));
                return frame;
              }
            while (1 <= s && 0 <= c);
          }
          break;
        }
    }
  } finally {
    (reentry = !1), (Error.prepareStackTrace = previousPrepareStackTrace);
  }
  return (fn = fn ? fn.displayName || fn.name : "")
    ? describeBuiltInComponentFrame(fn)
    : "";
}
var hasOwnProperty = Object.prototype.hasOwnProperty,
  valueStack = [],
  index = -1;
function createCursor(defaultValue) {
  return { current: defaultValue };
}
function pop(cursor) {
  0 > index ||
    ((cursor.current = valueStack[index]), (valueStack[index] = null), index--);
}
function push(cursor, value) {
  index++;
  valueStack[index] = cursor.current;
  cursor.current = value;
}
var emptyContextObject = {};
function is(x, y) {
  return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
}
var objectIs = "function" === typeof Object.is ? Object.is : is,
  syncQueue = null,
  includesLegacySyncCallbacks = !1,
  isFlushingSyncQueue = !1;
function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && null !== syncQueue) {
    isFlushingSyncQueue = !0;
    var i = 0,
      previousUpdatePriority = currentUpdatePriority;
    try {
      var queue = syncQueue;
      for (currentUpdatePriority = 1; i < queue.length; i++) {
        var callback = queue[i];
        do callback = callback(!0);
        while (null !== callback);
      }
      syncQueue = null;
      includesLegacySyncCallbacks = !1;
    } catch (error) {
      throw (null !== syncQueue && (syncQueue = syncQueue.slice(i + 1)),
      scheduleCallback(ImmediatePriority, flushSyncCallbacks),
      error);
    } finally {
      (currentUpdatePriority = previousUpdatePriority),
        (isFlushingSyncQueue = !1);
    }
  }
  return null;
}
var forkStack = [],
  forkStackIndex = 0,
  treeForkProvider = null,
  idStack = [],
  idStackIndex = 0,
  treeContextProvider = null;
function popTreeContext(workInProgress) {
  for (; workInProgress === treeForkProvider; )
    (treeForkProvider = forkStack[--forkStackIndex]),
      (forkStack[forkStackIndex] = null),
      --forkStackIndex,
      (forkStack[forkStackIndex] = null);
  for (; workInProgress === treeContextProvider; )
    (treeContextProvider = idStack[--idStackIndex]),
      (idStack[idStackIndex] = null),
      --idStackIndex,
      (idStack[idStackIndex] = null),
      --idStackIndex,
      (idStack[idStackIndex] = null);
}
var contextStackCursor = createCursor(null),
  contextFiberStackCursor = createCursor(null),
  rootInstanceStackCursor = createCursor(null);
function pushHostContainer(fiber, nextRootInstance) {
  push(rootInstanceStackCursor, nextRootInstance);
  push(contextFiberStackCursor, fiber);
  push(contextStackCursor, null);
  pop(contextStackCursor);
  push(contextStackCursor, NO_CONTEXT);
}
function popHostContainer() {
  pop(contextStackCursor);
  pop(contextFiberStackCursor);
  pop(rootInstanceStackCursor);
}
function pushHostContext(fiber) {
  contextStackCursor.current !== NO_CONTEXT &&
    (push(contextFiberStackCursor, fiber),
    push(contextStackCursor, NO_CONTEXT));
}
function popHostContext(fiber) {
  contextFiberStackCursor.current === fiber &&
    (pop(contextStackCursor), pop(contextFiberStackCursor));
}
var hydrationErrors = null,
  concurrentQueues = [],
  concurrentQueuesIndex = 0,
  concurrentlyUpdatedLanes = 0;
function finishQueueingConcurrentUpdates() {
  for (
    var endIndex = concurrentQueuesIndex,
      i = (concurrentlyUpdatedLanes = concurrentQueuesIndex = 0);
    i < endIndex;

  ) {
    var fiber = concurrentQueues[i];
    concurrentQueues[i++] = null;
    var queue = concurrentQueues[i];
    concurrentQueues[i++] = null;
    var update = concurrentQueues[i];
    concurrentQueues[i++] = null;
    var lane = concurrentQueues[i];
    concurrentQueues[i++] = null;
    if (null !== queue && null !== update) {
      var pending = queue.pending;
      null === pending
        ? (update.next = update)
        : ((update.next = pending.next), (pending.next = update));
      queue.pending = update;
    }
    0 !== lane && markUpdateLaneFromFiberToRoot(fiber, update, lane);
  }
}
function enqueueUpdate(fiber, queue, update, lane) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  concurrentQueues[concurrentQueuesIndex++] = lane;
  concurrentlyUpdatedLanes |= lane;
  fiber.lanes |= lane;
  fiber = fiber.alternate;
  null !== fiber && (fiber.lanes |= lane);
}
function enqueueConcurrentRenderForLane(fiber, lane) {
  enqueueUpdate(fiber, null, null, lane);
  return getRootForUpdatedFiber(fiber);
}
function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
  sourceFiber.lanes |= lane;
  var alternate = sourceFiber.alternate;
  null !== alternate && (alternate.lanes |= lane);
  for (var isHidden = !1, parent = sourceFiber.return; null !== parent; )
    (parent.childLanes |= lane),
      (alternate = parent.alternate),
      null !== alternate && (alternate.childLanes |= lane),
      22 === parent.tag &&
        ((sourceFiber = parent.stateNode),
        null === sourceFiber || sourceFiber._visibility & 1 || (isHidden = !0)),
      (sourceFiber = parent),
      (parent = parent.return);
  isHidden &&
    null !== update &&
    3 === sourceFiber.tag &&
    ((parent = sourceFiber.stateNode),
    (isHidden = 31 - clz32(lane)),
    (parent = parent.hiddenUpdates),
    (sourceFiber = parent[isHidden]),
    null === sourceFiber
      ? (parent[isHidden] = [update])
      : sourceFiber.push(update),
    (update.lane = lane | 1073741824));
}
function getRootForUpdatedFiber(sourceFiber) {
  if (50 < nestedUpdateCount)
    throw ((nestedUpdateCount = 0),
    (rootWithNestedUpdates = null),
    Error(formatProdErrorMessage(185)));
  for (var parent = sourceFiber.return; null !== parent; )
    (sourceFiber = parent), (parent = sourceFiber.return);
  return 3 === sourceFiber.tag ? sourceFiber.stateNode : null;
}
var hasForceUpdate = !1;
function initializeUpdateQueue(fiber) {
  fiber.updateQueue = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, lanes: 0, hiddenCallbacks: null },
    callbacks: null
  };
}
function cloneUpdateQueue(current, workInProgress) {
  current = current.updateQueue;
  workInProgress.updateQueue === current &&
    (workInProgress.updateQueue = {
      baseState: current.baseState,
      firstBaseUpdate: current.firstBaseUpdate,
      lastBaseUpdate: current.lastBaseUpdate,
      shared: current.shared,
      callbacks: null
    });
}
function createUpdate(eventTime, lane) {
  return {
    eventTime: eventTime,
    lane: lane,
    tag: 0,
    payload: null,
    callback: null,
    next: null
  };
}
function enqueueUpdate$1(fiber, update, lane) {
  var updateQueue = fiber.updateQueue;
  if (null === updateQueue) return null;
  updateQueue = updateQueue.shared;
  if (
    (deferRenderPhaseUpdateToNextBatch && 0 !== (fiber.mode & 1)) ||
    0 === (executionContext & 2)
  )
    return (
      enqueueUpdate(fiber, updateQueue, update, lane),
      getRootForUpdatedFiber(fiber)
    );
  var pending = updateQueue.pending;
  null === pending
    ? (update.next = update)
    : ((update.next = pending.next), (pending.next = update));
  updateQueue.pending = update;
  update = getRootForUpdatedFiber(fiber);
  markUpdateLaneFromFiberToRoot(fiber, null, lane);
  return update;
}
function entangleTransitions(root, fiber, lane) {
  fiber = fiber.updateQueue;
  if (null !== fiber && ((fiber = fiber.shared), 0 !== (lane & 4194240))) {
    var queueLanes = fiber.lanes;
    queueLanes &= root.pendingLanes;
    lane |= queueLanes;
    fiber.lanes = lane;
    markRootEntangled(root, lane);
  }
}
function enqueueCapturedUpdate(workInProgress, capturedUpdate) {
  var queue = workInProgress.updateQueue,
    current = workInProgress.alternate;
  if (
    null !== current &&
    ((current = current.updateQueue), queue === current)
  ) {
    var newFirst = null,
      newLast = null;
    queue = queue.firstBaseUpdate;
    if (null !== queue) {
      do {
        var clone = {
          eventTime: queue.eventTime,
          lane: queue.lane,
          tag: queue.tag,
          payload: queue.payload,
          callback: null,
          next: null
        };
        null === newLast
          ? (newFirst = newLast = clone)
          : (newLast = newLast.next = clone);
        queue = queue.next;
      } while (null !== queue);
      null === newLast
        ? (newFirst = newLast = capturedUpdate)
        : (newLast = newLast.next = capturedUpdate);
    } else newFirst = newLast = capturedUpdate;
    queue = {
      baseState: current.baseState,
      firstBaseUpdate: newFirst,
      lastBaseUpdate: newLast,
      shared: current.shared,
      callbacks: current.callbacks
    };
    workInProgress.updateQueue = queue;
    return;
  }
  workInProgress = queue.lastBaseUpdate;
  null === workInProgress
    ? (queue.firstBaseUpdate = capturedUpdate)
    : (workInProgress.next = capturedUpdate);
  queue.lastBaseUpdate = capturedUpdate;
}
function processUpdateQueue(
  workInProgress$jscomp$0,
  props,
  instance,
  renderLanes
) {
  var queue = workInProgress$jscomp$0.updateQueue;
  hasForceUpdate = !1;
  var firstBaseUpdate = queue.firstBaseUpdate,
    lastBaseUpdate = queue.lastBaseUpdate,
    pendingQueue = queue.shared.pending;
  if (null !== pendingQueue) {
    queue.shared.pending = null;
    var lastPendingUpdate = pendingQueue,
      firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;
    null === lastBaseUpdate
      ? (firstBaseUpdate = firstPendingUpdate)
      : (lastBaseUpdate.next = firstPendingUpdate);
    lastBaseUpdate = lastPendingUpdate;
    var current = workInProgress$jscomp$0.alternate;
    null !== current &&
      ((current = current.updateQueue),
      (pendingQueue = current.lastBaseUpdate),
      pendingQueue !== lastBaseUpdate &&
        (null === pendingQueue
          ? (current.firstBaseUpdate = firstPendingUpdate)
          : (pendingQueue.next = firstPendingUpdate),
        (current.lastBaseUpdate = lastPendingUpdate)));
  }
  if (null !== firstBaseUpdate) {
    var newState = queue.baseState;
    lastBaseUpdate = 0;
    current = firstPendingUpdate = lastPendingUpdate = null;
    pendingQueue = firstBaseUpdate;
    do {
      var updateEventTime = pendingQueue.eventTime,
        updateLane = pendingQueue.lane & -1073741825,
        isHiddenUpdate = updateLane !== pendingQueue.lane;
      if (
        isHiddenUpdate
          ? (workInProgressRootRenderLanes & updateLane) === updateLane
          : (renderLanes & updateLane) === updateLane
      ) {
        null !== current &&
          (current = current.next = {
            eventTime: updateEventTime,
            lane: 0,
            tag: pendingQueue.tag,
            payload: pendingQueue.payload,
            callback: null,
            next: null
          });
        a: {
          var workInProgress = workInProgress$jscomp$0,
            update = pendingQueue;
          updateLane = props;
          updateEventTime = instance;
          switch (update.tag) {
            case 1:
              workInProgress = update.payload;
              if ("function" === typeof workInProgress) {
                newState = workInProgress.call(
                  updateEventTime,
                  newState,
                  updateLane
                );
                break a;
              }
              newState = workInProgress;
              break a;
            case 3:
              workInProgress.flags = (workInProgress.flags & -65537) | 128;
            case 0:
              workInProgress = update.payload;
              updateLane =
                "function" === typeof workInProgress
                  ? workInProgress.call(updateEventTime, newState, updateLane)
                  : workInProgress;
              if (null === updateLane || void 0 === updateLane) break a;
              newState = assign({}, newState, updateLane);
              break a;
            case 2:
              hasForceUpdate = !0;
          }
        }
        updateLane = pendingQueue.callback;
        null !== updateLane &&
          ((workInProgress$jscomp$0.flags |= 64),
          isHiddenUpdate && (workInProgress$jscomp$0.flags |= 8192),
          (isHiddenUpdate = queue.callbacks),
          null === isHiddenUpdate
            ? (queue.callbacks = [updateLane])
            : isHiddenUpdate.push(updateLane));
      } else
        (isHiddenUpdate = {
          eventTime: updateEventTime,
          lane: updateLane,
          tag: pendingQueue.tag,
          payload: pendingQueue.payload,
          callback: pendingQueue.callback,
          next: null
        }),
          null === current
            ? ((firstPendingUpdate = current = isHiddenUpdate),
              (lastPendingUpdate = newState))
            : (current = current.next = isHiddenUpdate),
          (lastBaseUpdate |= updateLane);
      pendingQueue = pendingQueue.next;
      if (null === pendingQueue)
        if (((pendingQueue = queue.shared.pending), null === pendingQueue))
          break;
        else
          (isHiddenUpdate = pendingQueue),
            (pendingQueue = isHiddenUpdate.next),
            (isHiddenUpdate.next = null),
            (queue.lastBaseUpdate = isHiddenUpdate),
            (queue.shared.pending = null);
    } while (1);
    null === current && (lastPendingUpdate = newState);
    queue.baseState = lastPendingUpdate;
    queue.firstBaseUpdate = firstPendingUpdate;
    queue.lastBaseUpdate = current;
    null === firstBaseUpdate && (queue.shared.lanes = 0);
    workInProgressRootSkippedLanes |= lastBaseUpdate;
    workInProgress$jscomp$0.lanes = lastBaseUpdate;
    workInProgress$jscomp$0.memoizedState = newState;
  }
}
function callCallback(callback, context) {
  if ("function" !== typeof callback)
    throw Error(formatProdErrorMessage(191, callback));
  callback.call(context);
}
function commitCallbacks(updateQueue, context) {
  var callbacks = updateQueue.callbacks;
  if (null !== callbacks)
    for (
      updateQueue.callbacks = null, updateQueue = 0;
      updateQueue < callbacks.length;
      updateQueue++
    )
      callCallback(callbacks[updateQueue], context);
}
function shallowEqual(objA, objB) {
  if (objectIs(objA, objB)) return !0;
  if (
    "object" !== typeof objA ||
    null === objA ||
    "object" !== typeof objB ||
    null === objB
  )
    return !1;
  var keysA = Object.keys(objA),
    keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return !1;
  for (keysB = 0; keysB < keysA.length; keysB++) {
    var currentKey = keysA[keysB];
    if (
      !hasOwnProperty.call(objB, currentKey) ||
      !objectIs(objA[currentKey], objB[currentKey])
    )
      return !1;
  }
  return !0;
}
function describeFiber(fiber) {
  switch (fiber.tag) {
    case 26:
    case 27:
    case 5:
      return describeBuiltInComponentFrame(fiber.type);
    case 16:
      return describeBuiltInComponentFrame("Lazy");
    case 13:
      return describeBuiltInComponentFrame("Suspense");
    case 19:
      return describeBuiltInComponentFrame("SuspenseList");
    case 0:
    case 2:
    case 15:
      return (fiber = describeNativeComponentFrame(fiber.type, !1)), fiber;
    case 11:
      return (
        (fiber = describeNativeComponentFrame(fiber.type.render, !1)), fiber
      );
    case 1:
      return (fiber = describeNativeComponentFrame(fiber.type, !0)), fiber;
    default:
      return "";
  }
}
function coerceRef(returnFiber, current, element) {
  returnFiber = element.ref;
  if (
    null !== returnFiber &&
    "function" !== typeof returnFiber &&
    "object" !== typeof returnFiber
  ) {
    if (element._owner) {
      element = element._owner;
      if (element) {
        if (1 !== element.tag) throw Error(formatProdErrorMessage(309));
        var inst = element.stateNode;
      }
      if (!inst) throw Error(formatProdErrorMessage(147, returnFiber));
      var resolvedInst = inst,
        stringRef = "" + returnFiber;
      if (
        null !== current &&
        null !== current.ref &&
        "function" === typeof current.ref &&
        current.ref._stringRef === stringRef
      )
        return current.ref;
      current = function(value) {
        var refs = resolvedInst.refs;
        null === value ? delete refs[stringRef] : (refs[stringRef] = value);
      };
      current._stringRef = stringRef;
      return current;
    }
    if ("string" !== typeof returnFiber)
      throw Error(formatProdErrorMessage(284));
    if (!element._owner) throw Error(formatProdErrorMessage(290, returnFiber));
  }
  return returnFiber;
}
function throwOnInvalidObjectType(returnFiber, newChild) {
  returnFiber = Object.prototype.toString.call(newChild);
  throw Error(
    formatProdErrorMessage(
      31,
      "[object Object]" === returnFiber
        ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
        : returnFiber
    )
  );
}
function resolveLazy(lazyType) {
  var init = lazyType._init;
  return init(lazyType._payload);
}
function createChildReconciler(shouldTrackSideEffects) {
  function deleteChild(returnFiber, childToDelete) {
    if (shouldTrackSideEffects) {
      var deletions = returnFiber.deletions;
      null === deletions
        ? ((returnFiber.deletions = [childToDelete]), (returnFiber.flags |= 16))
        : deletions.push(childToDelete);
    }
  }
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return null;
    for (; null !== currentFirstChild; )
      deleteChild(returnFiber, currentFirstChild),
        (currentFirstChild = currentFirstChild.sibling);
    return null;
  }
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    for (returnFiber = new Map(); null !== currentFirstChild; )
      null !== currentFirstChild.key
        ? returnFiber.set(currentFirstChild.key, currentFirstChild)
        : returnFiber.set(currentFirstChild.index, currentFirstChild),
        (currentFirstChild = currentFirstChild.sibling);
    return returnFiber;
  }
  function useFiber(fiber, pendingProps) {
    fiber = createWorkInProgress(fiber, pendingProps);
    fiber.index = 0;
    fiber.sibling = null;
    return fiber;
  }
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects)
      return (newFiber.flags |= 1048576), lastPlacedIndex;
    newIndex = newFiber.alternate;
    if (null !== newIndex)
      return (
        (newIndex = newIndex.index),
        newIndex < lastPlacedIndex
          ? ((newFiber.flags |= 16777218), lastPlacedIndex)
          : newIndex
      );
    newFiber.flags |= 16777218;
    return lastPlacedIndex;
  }
  function placeSingleChild(newFiber) {
    shouldTrackSideEffects &&
      null === newFiber.alternate &&
      (newFiber.flags |= 16777218);
    return newFiber;
  }
  function updateTextNode(returnFiber, current, textContent, lanes) {
    if (null === current || 6 !== current.tag)
      return (
        (current = createFiberFromText(textContent, returnFiber.mode, lanes)),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, textContent);
    current.return = returnFiber;
    return current;
  }
  function updateElement(returnFiber, current, element, lanes) {
    var elementType = element.type;
    if (elementType === REACT_FRAGMENT_TYPE)
      return updateFragment(
        returnFiber,
        current,
        element.props.children,
        lanes,
        element.key
      );
    if (
      null !== current &&
      (current.elementType === elementType ||
        ("object" === typeof elementType &&
          null !== elementType &&
          elementType.$$typeof === REACT_LAZY_TYPE &&
          resolveLazy(elementType) === current.type))
    )
      return (
        (lanes = useFiber(current, element.props)),
        (lanes.ref = coerceRef(returnFiber, current, element)),
        (lanes.return = returnFiber),
        lanes
      );
    lanes = createFiberFromTypeAndProps(
      element.type,
      element.key,
      element.props,
      null,
      returnFiber.mode,
      lanes
    );
    lanes.ref = coerceRef(returnFiber, current, element);
    lanes.return = returnFiber;
    return lanes;
  }
  function updatePortal(returnFiber, current, portal, lanes) {
    if (
      null === current ||
      4 !== current.tag ||
      current.stateNode.containerInfo !== portal.containerInfo ||
      current.stateNode.implementation !== portal.implementation
    )
      return (
        (current = createFiberFromPortal(portal, returnFiber.mode, lanes)),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, portal.children || []);
    current.return = returnFiber;
    return current;
  }
  function updateFragment(returnFiber, current, fragment, lanes, key) {
    if (null === current || 7 !== current.tag)
      return (
        (current = createFiberFromFragment(
          fragment,
          returnFiber.mode,
          lanes,
          key
        )),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, fragment);
    current.return = returnFiber;
    return current;
  }
  function createChild(returnFiber, newChild, lanes) {
    if (
      ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild
    )
      return (
        (newChild = createFiberFromText(
          "" + newChild,
          returnFiber.mode,
          lanes
        )),
        (newChild.return = returnFiber),
        newChild
      );
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return (
            (lanes = createFiberFromTypeAndProps(
              newChild.type,
              newChild.key,
              newChild.props,
              null,
              returnFiber.mode,
              lanes
            )),
            (lanes.ref = coerceRef(returnFiber, null, newChild)),
            (lanes.return = returnFiber),
            lanes
          );
        case REACT_PORTAL_TYPE:
          return (
            (newChild = createFiberFromPortal(
              newChild,
              returnFiber.mode,
              lanes
            )),
            (newChild.return = returnFiber),
            newChild
          );
        case REACT_LAZY_TYPE:
          var init = newChild._init;
          return createChild(returnFiber, init(newChild._payload), lanes);
      }
      if (isArrayImpl(newChild) || getIteratorFn(newChild))
        return (
          (newChild = createFiberFromFragment(
            newChild,
            returnFiber.mode,
            lanes,
            null
          )),
          (newChild.return = returnFiber),
          newChild
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function updateSlot(returnFiber, oldFiber, newChild, lanes) {
    var key = null !== oldFiber ? oldFiber.key : null;
    if (
      ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild
    )
      return null !== key
        ? null
        : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return newChild.key === key
            ? updateElement(returnFiber, oldFiber, newChild, lanes)
            : null;
        case REACT_PORTAL_TYPE:
          return newChild.key === key
            ? updatePortal(returnFiber, oldFiber, newChild, lanes)
            : null;
        case REACT_LAZY_TYPE:
          return (
            (key = newChild._init),
            updateSlot(returnFiber, oldFiber, key(newChild._payload), lanes)
          );
      }
      if (isArrayImpl(newChild) || getIteratorFn(newChild))
        return null !== key
          ? null
          : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function updateFromMap(
    existingChildren,
    returnFiber,
    newIdx,
    newChild,
    lanes
  ) {
    if (
      ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild
    )
      return (
        (existingChildren = existingChildren.get(newIdx) || null),
        updateTextNode(returnFiber, existingChildren, "" + newChild, lanes)
      );
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return (
            (existingChildren =
              existingChildren.get(
                null === newChild.key ? newIdx : newChild.key
              ) || null),
            updateElement(returnFiber, existingChildren, newChild, lanes)
          );
        case REACT_PORTAL_TYPE:
          return (
            (existingChildren =
              existingChildren.get(
                null === newChild.key ? newIdx : newChild.key
              ) || null),
            updatePortal(returnFiber, existingChildren, newChild, lanes)
          );
        case REACT_LAZY_TYPE:
          var init = newChild._init;
          return updateFromMap(
            existingChildren,
            returnFiber,
            newIdx,
            init(newChild._payload),
            lanes
          );
      }
      if (isArrayImpl(newChild) || getIteratorFn(newChild))
        return (
          (existingChildren = existingChildren.get(newIdx) || null),
          updateFragment(returnFiber, existingChildren, newChild, lanes, null)
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function reconcileChildrenArray(
    returnFiber,
    currentFirstChild,
    newChildren,
    lanes
  ) {
    for (
      var resultingFirstChild = null,
        previousNewFiber = null,
        oldFiber = currentFirstChild,
        newIdx = (currentFirstChild = 0),
        nextOldFiber = null;
      null !== oldFiber && newIdx < newChildren.length;
      newIdx++
    ) {
      oldFiber.index > newIdx
        ? ((nextOldFiber = oldFiber), (oldFiber = null))
        : (nextOldFiber = oldFiber.sibling);
      var newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        lanes
      );
      if (null === newFiber) {
        null === oldFiber && (oldFiber = nextOldFiber);
        break;
      }
      shouldTrackSideEffects &&
        oldFiber &&
        null === newFiber.alternate &&
        deleteChild(returnFiber, oldFiber);
      currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
      null === previousNewFiber
        ? (resultingFirstChild = newFiber)
        : (previousNewFiber.sibling = newFiber);
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (newIdx === newChildren.length)
      return (
        deleteRemainingChildren(returnFiber, oldFiber), resultingFirstChild
      );
    if (null === oldFiber) {
      for (; newIdx < newChildren.length; newIdx++)
        (oldFiber = createChild(returnFiber, newChildren[newIdx], lanes)),
          null !== oldFiber &&
            ((currentFirstChild = placeChild(
              oldFiber,
              currentFirstChild,
              newIdx
            )),
            null === previousNewFiber
              ? (resultingFirstChild = oldFiber)
              : (previousNewFiber.sibling = oldFiber),
            (previousNewFiber = oldFiber));
      return resultingFirstChild;
    }
    for (
      oldFiber = mapRemainingChildren(returnFiber, oldFiber);
      newIdx < newChildren.length;
      newIdx++
    )
      (nextOldFiber = updateFromMap(
        oldFiber,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        lanes
      )),
        null !== nextOldFiber &&
          (shouldTrackSideEffects &&
            null !== nextOldFiber.alternate &&
            oldFiber.delete(
              null === nextOldFiber.key ? newIdx : nextOldFiber.key
            ),
          (currentFirstChild = placeChild(
            nextOldFiber,
            currentFirstChild,
            newIdx
          )),
          null === previousNewFiber
            ? (resultingFirstChild = nextOldFiber)
            : (previousNewFiber.sibling = nextOldFiber),
          (previousNewFiber = nextOldFiber));
    shouldTrackSideEffects &&
      oldFiber.forEach(function(child) {
        return deleteChild(returnFiber, child);
      });
    return resultingFirstChild;
  }
  function reconcileChildrenIterator(
    returnFiber,
    currentFirstChild,
    newChildrenIterable,
    lanes
  ) {
    var iteratorFn = getIteratorFn(newChildrenIterable);
    if ("function" !== typeof iteratorFn)
      throw Error(formatProdErrorMessage(150));
    newChildrenIterable = iteratorFn.call(newChildrenIterable);
    if (null == newChildrenIterable) throw Error(formatProdErrorMessage(151));
    for (
      var previousNewFiber = (iteratorFn = null),
        oldFiber = currentFirstChild,
        newIdx = (currentFirstChild = 0),
        nextOldFiber = null,
        step = newChildrenIterable.next();
      null !== oldFiber && !step.done;
      newIdx++, step = newChildrenIterable.next()
    ) {
      oldFiber.index > newIdx
        ? ((nextOldFiber = oldFiber), (oldFiber = null))
        : (nextOldFiber = oldFiber.sibling);
      var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
      if (null === newFiber) {
        null === oldFiber && (oldFiber = nextOldFiber);
        break;
      }
      shouldTrackSideEffects &&
        oldFiber &&
        null === newFiber.alternate &&
        deleteChild(returnFiber, oldFiber);
      currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
      null === previousNewFiber
        ? (iteratorFn = newFiber)
        : (previousNewFiber.sibling = newFiber);
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (step.done)
      return deleteRemainingChildren(returnFiber, oldFiber), iteratorFn;
    if (null === oldFiber) {
      for (; !step.done; newIdx++, step = newChildrenIterable.next())
        (step = createChild(returnFiber, step.value, lanes)),
          null !== step &&
            ((currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
            null === previousNewFiber
              ? (iteratorFn = step)
              : (previousNewFiber.sibling = step),
            (previousNewFiber = step));
      return iteratorFn;
    }
    for (
      oldFiber = mapRemainingChildren(returnFiber, oldFiber);
      !step.done;
      newIdx++, step = newChildrenIterable.next()
    )
      (step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes)),
        null !== step &&
          (shouldTrackSideEffects &&
            null !== step.alternate &&
            oldFiber.delete(null === step.key ? newIdx : step.key),
          (currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
          null === previousNewFiber
            ? (iteratorFn = step)
            : (previousNewFiber.sibling = step),
          (previousNewFiber = step));
    shouldTrackSideEffects &&
      oldFiber.forEach(function(child) {
        return deleteChild(returnFiber, child);
      });
    return iteratorFn;
  }
  function reconcileChildFibers(
    returnFiber,
    currentFirstChild,
    newChild,
    lanes
  ) {
    "object" === typeof newChild &&
      null !== newChild &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      null === newChild.key &&
      (newChild = newChild.props.children);
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          a: {
            for (
              var key = newChild.key, child = currentFirstChild;
              null !== child;

            ) {
              if (child.key === key) {
                key = newChild.type;
                if (key === REACT_FRAGMENT_TYPE) {
                  if (7 === child.tag) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    currentFirstChild = useFiber(
                      child,
                      newChild.props.children
                    );
                    currentFirstChild.return = returnFiber;
                    returnFiber = currentFirstChild;
                    break a;
                  }
                } else if (
                  child.elementType === key ||
                  ("object" === typeof key &&
                    null !== key &&
                    key.$$typeof === REACT_LAZY_TYPE &&
                    resolveLazy(key) === child.type)
                ) {
                  deleteRemainingChildren(returnFiber, child.sibling);
                  currentFirstChild = useFiber(child, newChild.props);
                  currentFirstChild.ref = coerceRef(
                    returnFiber,
                    child,
                    newChild
                  );
                  currentFirstChild.return = returnFiber;
                  returnFiber = currentFirstChild;
                  break a;
                }
                deleteRemainingChildren(returnFiber, child);
                break;
              } else deleteChild(returnFiber, child);
              child = child.sibling;
            }
            newChild.type === REACT_FRAGMENT_TYPE
              ? ((currentFirstChild = createFiberFromFragment(
                  newChild.props.children,
                  returnFiber.mode,
                  lanes,
                  newChild.key
                )),
                (currentFirstChild.return = returnFiber),
                (returnFiber = currentFirstChild))
              : ((lanes = createFiberFromTypeAndProps(
                  newChild.type,
                  newChild.key,
                  newChild.props,
                  null,
                  returnFiber.mode,
                  lanes
                )),
                (lanes.ref = coerceRef(
                  returnFiber,
                  currentFirstChild,
                  newChild
                )),
                (lanes.return = returnFiber),
                (returnFiber = lanes));
          }
          return placeSingleChild(returnFiber);
        case REACT_PORTAL_TYPE:
          a: {
            for (child = newChild.key; null !== currentFirstChild; ) {
              if (currentFirstChild.key === child)
                if (
                  4 === currentFirstChild.tag &&
                  currentFirstChild.stateNode.containerInfo ===
                    newChild.containerInfo &&
                  currentFirstChild.stateNode.implementation ===
                    newChild.implementation
                ) {
                  deleteRemainingChildren(
                    returnFiber,
                    currentFirstChild.sibling
                  );
                  currentFirstChild = useFiber(
                    currentFirstChild,
                    newChild.children || []
                  );
                  currentFirstChild.return = returnFiber;
                  returnFiber = currentFirstChild;
                  break a;
                } else {
                  deleteRemainingChildren(returnFiber, currentFirstChild);
                  break;
                }
              else deleteChild(returnFiber, currentFirstChild);
              currentFirstChild = currentFirstChild.sibling;
            }
            currentFirstChild = createFiberFromPortal(
              newChild,
              returnFiber.mode,
              lanes
            );
            currentFirstChild.return = returnFiber;
            returnFiber = currentFirstChild;
          }
          return placeSingleChild(returnFiber);
        case REACT_LAZY_TYPE:
          return (
            (child = newChild._init),
            reconcileChildFibers(
              returnFiber,
              currentFirstChild,
              child(newChild._payload),
              lanes
            )
          );
      }
      if (isArrayImpl(newChild))
        return reconcileChildrenArray(
          returnFiber,
          currentFirstChild,
          newChild,
          lanes
        );
      if (getIteratorFn(newChild))
        return reconcileChildrenIterator(
          returnFiber,
          currentFirstChild,
          newChild,
          lanes
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild
      ? ((newChild = "" + newChild),
        null !== currentFirstChild && 6 === currentFirstChild.tag
          ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling),
            (currentFirstChild = useFiber(currentFirstChild, newChild)),
            (currentFirstChild.return = returnFiber),
            (returnFiber = currentFirstChild))
          : (deleteRemainingChildren(returnFiber, currentFirstChild),
            (currentFirstChild = createFiberFromText(
              newChild,
              returnFiber.mode,
              lanes
            )),
            (currentFirstChild.return = returnFiber),
            (returnFiber = currentFirstChild)),
        placeSingleChild(returnFiber))
      : deleteRemainingChildren(returnFiber, currentFirstChild);
  }
  return reconcileChildFibers;
}
var reconcileChildFibers = createChildReconciler(!0),
  mountChildFibers = createChildReconciler(!1),
  currentTreeHiddenStackCursor = createCursor(null),
  prevRenderLanesStackCursor = createCursor(0);
function pushHiddenContext(fiber, context) {
  fiber = renderLanes$1;
  push(prevRenderLanesStackCursor, fiber);
  push(currentTreeHiddenStackCursor, context);
  renderLanes$1 = fiber | context.baseLanes;
}
function reuseHiddenContextOnStack() {
  push(prevRenderLanesStackCursor, renderLanes$1);
  push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
}
function popHiddenContext() {
  renderLanes$1 = prevRenderLanesStackCursor.current;
  pop(currentTreeHiddenStackCursor);
  pop(prevRenderLanesStackCursor);
}
var suspenseHandlerStackCursor = createCursor(null);
function isBadSuspenseFallback(current, nextProps) {
  return (null !== current &&
    null === current.memoizedState &&
    null === currentTreeHiddenStackCursor.current) ||
    !0 === nextProps.unstable_avoidThisFallback
    ? !0
    : !1;
}
function pushPrimaryTreeSuspenseHandler(handler) {
  var handlerOnStack = suspenseHandlerStackCursor.current,
    JSCompiler_temp;
  if (
    (JSCompiler_temp =
      !0 === handler.pendingProps.unstable_avoidThisFallback &&
      null !== handlerOnStack)
  )
    null === handlerOnStack.alternate ||
    null !== currentTreeHiddenStackCursor.current
      ? 13 === handlerOnStack.tag &&
        !0 === handlerOnStack.memoizedProps.unstable_avoidThisFallback
        ? (JSCompiler_temp = !0)
        : ((JSCompiler_temp = handler.memoizedState),
          (JSCompiler_temp =
            null !== JSCompiler_temp && null !== JSCompiler_temp.dehydrated
              ? !0
              : !1))
      : (JSCompiler_temp = !0),
      (JSCompiler_temp = !JSCompiler_temp);
  JSCompiler_temp
    ? push(suspenseHandlerStackCursor, handlerOnStack)
    : push(suspenseHandlerStackCursor, handler);
}
function pushOffscreenSuspenseHandler(fiber) {
  22 === fiber.tag
    ? push(suspenseHandlerStackCursor, fiber)
    : reuseSuspenseHandlerOnStack();
}
function reuseSuspenseHandlerOnStack() {
  push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
}
var suspenseStackCursor = createCursor(0);
function findFirstSuspended(row) {
  for (var node = row; null !== node; ) {
    if (13 === node.tag) {
      var state = node.memoizedState;
      if (null !== state && (null === state.dehydrated || shim() || shim()))
        return node;
    } else if (19 === node.tag && void 0 !== node.memoizedProps.revealOrder) {
      if (0 !== (node.flags & 128)) return node;
    } else if (null !== node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === row) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === row) return null;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
  return null;
}
var workInProgressSources = [];
function resetWorkInProgressVersions() {
  for (var i = 0; i < workInProgressSources.length; i++)
    workInProgressSources[i]._workInProgressVersionSecondary = null;
  workInProgressSources.length = 0;
}
var SuspenseException = Error(formatProdErrorMessage(460));
function isThenableResolved(thenable) {
  thenable = thenable.status;
  return "fulfilled" === thenable || "rejected" === thenable;
}
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
            function(fulfilledValue) {
              if ("pending" === thenable.status) {
                var fulfilledThenable = thenable;
                fulfilledThenable.status = "fulfilled";
                fulfilledThenable.value = fulfilledValue;
              }
            },
            function(error) {
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
var suspendedThenable = null,
  ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig,
  renderLanes = 0,
  currentlyRenderingFiber = null,
  currentHook = null,
  workInProgressHook = null,
  didScheduleRenderPhaseUpdate = !1,
  didScheduleRenderPhaseUpdateDuringThisPass = !1,
  shouldDoubleInvokeUserFnsInHooksDEV = !1,
  thenableIndexCounter = 0,
  thenableState = null,
  globalClientIdCounter = 0;
function throwInvalidHookError() {
  throw Error(formatProdErrorMessage(321));
}
function areHookInputsEqual(nextDeps, prevDeps) {
  if (null === prevDeps) return !1;
  for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
    if (!objectIs(nextDeps[i], prevDeps[i])) return !1;
  return !0;
}
function renderWithHooks(
  current,
  workInProgress,
  Component,
  props,
  secondArg,
  nextRenderLanes
) {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = 0;
  ReactCurrentDispatcher$1.current =
    null === current || null === current.memoizedState
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;
  shouldDoubleInvokeUserFnsInHooksDEV = !1;
  nextRenderLanes = Component(props, secondArg);
  shouldDoubleInvokeUserFnsInHooksDEV = !1;
  didScheduleRenderPhaseUpdateDuringThisPass &&
    (nextRenderLanes = renderWithHooksAgain(
      workInProgress,
      Component,
      props,
      secondArg
    ));
  finishRenderingHooks(current);
  return nextRenderLanes;
}
function finishRenderingHooks(current) {
  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
  var didRenderTooFewHooks = null !== currentHook && null !== currentHook.next;
  renderLanes = 0;
  workInProgressHook = currentHook = currentlyRenderingFiber = null;
  didScheduleRenderPhaseUpdate = !1;
  thenableIndexCounter = 0;
  thenableState = null;
  if (didRenderTooFewHooks) throw Error(formatProdErrorMessage(300));
  enableLazyContextPropagation &&
    null !== current &&
    !didReceiveUpdate &&
    ((current = current.dependencies),
    null !== current &&
      checkIfContextChanged(current) &&
      (didReceiveUpdate = !0));
}
function renderWithHooksAgain(workInProgress, Component, props, secondArg) {
  var numberOfReRenders = 0;
  do {
    didScheduleRenderPhaseUpdateDuringThisPass = !1;
    thenableIndexCounter = 0;
    if (25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
    numberOfReRenders += 1;
    workInProgressHook = currentHook = null;
    workInProgress.updateQueue = null;
    ReactCurrentDispatcher$1.current = HooksDispatcherOnRerender;
    var children = Component(props, secondArg);
  } while (didScheduleRenderPhaseUpdateDuringThisPass);
  return children;
}
function bailoutHooks(current, workInProgress, lanes) {
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.flags &= -2053;
  current.lanes &= ~lanes;
}
function resetHooksOnUnwind() {
  if (didScheduleRenderPhaseUpdate) {
    for (var hook = currentlyRenderingFiber.memoizedState; null !== hook; ) {
      var queue = hook.queue;
      null !== queue && (queue.pending = null);
      hook = hook.next;
    }
    didScheduleRenderPhaseUpdate = !1;
  }
  renderLanes = 0;
  workInProgressHook = currentHook = currentlyRenderingFiber = null;
  didScheduleRenderPhaseUpdateDuringThisPass = !1;
  thenableIndexCounter = 0;
  thenableState = null;
}
function mountWorkInProgressHook() {
  var hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null
  };
  null === workInProgressHook
    ? (currentlyRenderingFiber.memoizedState = workInProgressHook = hook)
    : (workInProgressHook = workInProgressHook.next = hook);
  return workInProgressHook;
}
function updateWorkInProgressHook() {
  if (null === currentHook) {
    var nextCurrentHook = currentlyRenderingFiber.alternate;
    nextCurrentHook =
      null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
  } else nextCurrentHook = currentHook.next;
  var nextWorkInProgressHook =
    null === workInProgressHook
      ? currentlyRenderingFiber.memoizedState
      : workInProgressHook.next;
  if (null !== nextWorkInProgressHook)
    (workInProgressHook = nextWorkInProgressHook),
      (currentHook = nextCurrentHook);
  else {
    if (null === nextCurrentHook)
      if (null === currentlyRenderingFiber.alternate)
        nextCurrentHook = {
          memoizedState: null,
          baseState: null,
          baseQueue: null,
          queue: null,
          next: null
        };
      else throw Error(formatProdErrorMessage(310));
    currentHook = nextCurrentHook;
    nextCurrentHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null
    };
    null === workInProgressHook
      ? (currentlyRenderingFiber.memoizedState = workInProgressHook = nextCurrentHook)
      : (workInProgressHook = workInProgressHook.next = nextCurrentHook);
  }
  return workInProgressHook;
}
var createFunctionComponentUpdateQueue;
createFunctionComponentUpdateQueue = function() {
  return { lastEffect: null, events: null, stores: null, memoCache: null };
};
function use(usable) {
  if (null !== usable && "object" === typeof usable) {
    if ("function" === typeof usable.then) {
      var index$29 = thenableIndexCounter;
      thenableIndexCounter += 1;
      null === thenableState && (thenableState = []);
      return trackUsedThenable(thenableState, usable, index$29);
    }
    if (
      usable.$$typeof === REACT_CONTEXT_TYPE ||
      usable.$$typeof === REACT_SERVER_CONTEXT_TYPE
    )
      return readContext(usable);
  }
  throw Error(formatProdErrorMessage(438, String(usable)));
}
function useMemoCache(size) {
  var memoCache = null,
    updateQueue = currentlyRenderingFiber.updateQueue;
  null !== updateQueue && (memoCache = updateQueue.memoCache);
  if (null == memoCache) {
    var current = currentlyRenderingFiber.alternate;
    null !== current &&
      ((current = current.updateQueue),
      null !== current &&
        ((current = current.memoCache),
        null != current &&
          (memoCache = {
            data: current.data.map(function(array) {
              return array.slice();
            }),
            index: 0
          })));
  }
  null == memoCache && (memoCache = { data: [], index: 0 });
  null === updateQueue &&
    ((updateQueue = createFunctionComponentUpdateQueue()),
    (currentlyRenderingFiber.updateQueue = updateQueue));
  updateQueue.memoCache = memoCache;
  updateQueue = memoCache.data[memoCache.index];
  if (void 0 === updateQueue)
    for (
      updateQueue = memoCache.data[memoCache.index] = Array(size), current = 0;
      current < size;
      current++
    )
      updateQueue[current] = REACT_MEMO_CACHE_SENTINEL;
  memoCache.index++;
  return updateQueue;
}
function basicStateReducer(state, action) {
  return "function" === typeof action ? action(state) : action;
}
function updateReducer(reducer) {
  var hook = updateWorkInProgressHook(),
    queue = hook.queue;
  if (null === queue) throw Error(formatProdErrorMessage(311));
  queue.lastRenderedReducer = reducer;
  var current = currentHook,
    baseQueue = current.baseQueue,
    pendingQueue = queue.pending;
  if (null !== pendingQueue) {
    if (null !== baseQueue) {
      var baseFirst = baseQueue.next;
      baseQueue.next = pendingQueue.next;
      pendingQueue.next = baseFirst;
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }
  if (null !== baseQueue) {
    pendingQueue = baseQueue.next;
    current = current.baseState;
    var newBaseQueueFirst = (baseFirst = null),
      newBaseQueueLast = null,
      update = pendingQueue;
    do {
      var updateLane = update.lane & -1073741825;
      if (
        updateLane !== update.lane
          ? (workInProgressRootRenderLanes & updateLane) === updateLane
          : (renderLanes & updateLane) === updateLane
      )
        null !== newBaseQueueLast &&
          (newBaseQueueLast = newBaseQueueLast.next = {
            lane: 0,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: null
          }),
          (updateLane = update.action),
          shouldDoubleInvokeUserFnsInHooksDEV && reducer(current, updateLane),
          (current = update.hasEagerState
            ? update.eagerState
            : reducer(current, updateLane));
      else {
        var clone = {
          lane: updateLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: null
        };
        null === newBaseQueueLast
          ? ((newBaseQueueFirst = newBaseQueueLast = clone),
            (baseFirst = current))
          : (newBaseQueueLast = newBaseQueueLast.next = clone);
        currentlyRenderingFiber.lanes |= updateLane;
        workInProgressRootSkippedLanes |= updateLane;
      }
      update = update.next;
    } while (null !== update && update !== pendingQueue);
    null === newBaseQueueLast
      ? (baseFirst = current)
      : (newBaseQueueLast.next = newBaseQueueFirst);
    objectIs(current, hook.memoizedState) || (didReceiveUpdate = !0);
    hook.memoizedState = current;
    hook.baseState = baseFirst;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = current;
  }
  null === baseQueue && (queue.lanes = 0);
  return [hook.memoizedState, queue.dispatch];
}
function rerenderReducer(reducer) {
  var hook = updateWorkInProgressHook(),
    queue = hook.queue;
  if (null === queue) throw Error(formatProdErrorMessage(311));
  queue.lastRenderedReducer = reducer;
  var dispatch = queue.dispatch,
    lastRenderPhaseUpdate = queue.pending,
    newState = hook.memoizedState;
  if (null !== lastRenderPhaseUpdate) {
    queue.pending = null;
    var update = (lastRenderPhaseUpdate = lastRenderPhaseUpdate.next);
    do (newState = reducer(newState, update.action)), (update = update.next);
    while (update !== lastRenderPhaseUpdate);
    objectIs(newState, hook.memoizedState) || (didReceiveUpdate = !0);
    hook.memoizedState = newState;
    null === hook.baseQueue && (hook.baseState = newState);
    queue.lastRenderedState = newState;
  }
  return [newState, dispatch];
}
function readFromUnsubscribedMutableSource(root, source, getSnapshot) {
  var getVersion = source._getVersion;
  getVersion = getVersion(source._source);
  var JSCompiler_inline_result = source._workInProgressVersionSecondary;
  if (null !== JSCompiler_inline_result)
    root = JSCompiler_inline_result === getVersion;
  else if (
    ((root = root.mutableReadLanes), (root = (renderLanes & root) === root))
  )
    (source._workInProgressVersionSecondary = getVersion),
      workInProgressSources.push(source);
  if (root) return getSnapshot(source._source);
  workInProgressSources.push(source);
  throw Error(formatProdErrorMessage(350));
}
function useMutableSource(hook, source, getSnapshot, subscribe) {
  var root = workInProgressRoot;
  if (null === root) throw Error(formatProdErrorMessage(349));
  var getVersion = source._getVersion,
    version = getVersion(source._source),
    dispatcher = ReactCurrentDispatcher$1.current,
    _dispatcher$useState = dispatcher.useState(function() {
      return readFromUnsubscribedMutableSource(root, source, getSnapshot);
    }),
    setSnapshot = _dispatcher$useState[1],
    snapshot = _dispatcher$useState[0];
  _dispatcher$useState = workInProgressHook;
  var memoizedState = hook.memoizedState,
    refs = memoizedState.refs,
    prevGetSnapshot = refs.getSnapshot,
    prevSource = memoizedState.source;
  memoizedState = memoizedState.subscribe;
  var fiber = currentlyRenderingFiber;
  hook.memoizedState = { refs: refs, source: source, subscribe: subscribe };
  dispatcher.useEffect(
    function() {
      refs.getSnapshot = getSnapshot;
      refs.setSnapshot = setSnapshot;
      var maybeNewVersion = getVersion(source._source);
      objectIs(version, maybeNewVersion) ||
        ((maybeNewVersion = getSnapshot(source._source)),
        objectIs(snapshot, maybeNewVersion) ||
          (setSnapshot(maybeNewVersion),
          (maybeNewVersion = requestUpdateLane(fiber)),
          (root.mutableReadLanes |= maybeNewVersion & root.pendingLanes)),
        markRootEntangled(root, root.mutableReadLanes));
    },
    [getSnapshot, source, subscribe]
  );
  dispatcher.useEffect(
    function() {
      return subscribe(source._source, function() {
        var latestGetSnapshot = refs.getSnapshot,
          latestSetSnapshot = refs.setSnapshot;
        try {
          latestSetSnapshot(latestGetSnapshot(source._source));
          var lane = requestUpdateLane(fiber);
          root.mutableReadLanes |= lane & root.pendingLanes;
        } catch (error) {
          latestSetSnapshot(function() {
            throw error;
          });
        }
      });
    },
    [source, subscribe]
  );
  (objectIs(prevGetSnapshot, getSnapshot) &&
    objectIs(prevSource, source) &&
    objectIs(memoizedState, subscribe)) ||
    ((hook = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: snapshot
    }),
    (hook.dispatch = setSnapshot = dispatchSetState.bind(
      null,
      currentlyRenderingFiber,
      hook
    )),
    (_dispatcher$useState.queue = hook),
    (_dispatcher$useState.baseQueue = null),
    (snapshot = readFromUnsubscribedMutableSource(root, source, getSnapshot)),
    (_dispatcher$useState.memoizedState = _dispatcher$useState.baseState = snapshot));
  return snapshot;
}
function updateMutableSource(source, getSnapshot, subscribe) {
  var hook = updateWorkInProgressHook();
  return useMutableSource(hook, source, getSnapshot, subscribe);
}
function updateSyncExternalStore(subscribe, getSnapshot) {
  var fiber = currentlyRenderingFiber,
    hook = updateWorkInProgressHook(),
    nextSnapshot = getSnapshot(),
    snapshotChanged = !objectIs(
      (currentHook || hook).memoizedState,
      nextSnapshot
    );
  snapshotChanged &&
    ((hook.memoizedState = nextSnapshot), (didReceiveUpdate = !0));
  hook = hook.queue;
  updateEffect(subscribeToStore.bind(null, fiber, hook, subscribe), [
    subscribe
  ]);
  if (
    hook.getSnapshot !== getSnapshot ||
    snapshotChanged ||
    (null !== workInProgressHook && workInProgressHook.memoizedState.tag & 1)
  ) {
    fiber.flags |= 2048;
    pushEffect(
      9,
      updateStoreInstance.bind(null, fiber, hook, nextSnapshot, getSnapshot),
      void 0,
      null
    );
    subscribe = workInProgressRoot;
    if (null === subscribe) throw Error(formatProdErrorMessage(349));
    includesBlockingLane(subscribe, renderLanes) ||
      pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
  }
  return nextSnapshot;
}
function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
  fiber.flags |= 16384;
  fiber = { getSnapshot: getSnapshot, value: renderedSnapshot };
  getSnapshot = currentlyRenderingFiber.updateQueue;
  null === getSnapshot
    ? ((getSnapshot = createFunctionComponentUpdateQueue()),
      (currentlyRenderingFiber.updateQueue = getSnapshot),
      (getSnapshot.stores = [fiber]))
    : ((renderedSnapshot = getSnapshot.stores),
      null === renderedSnapshot
        ? (getSnapshot.stores = [fiber])
        : renderedSnapshot.push(fiber));
}
function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
  inst.value = nextSnapshot;
  inst.getSnapshot = getSnapshot;
  checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
}
function subscribeToStore(fiber, inst, subscribe) {
  return subscribe(function() {
    checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
  });
}
function checkIfSnapshotChanged(inst) {
  var latestGetSnapshot = inst.getSnapshot;
  inst = inst.value;
  try {
    var nextValue = latestGetSnapshot();
    return !objectIs(inst, nextValue);
  } catch (error) {
    return !0;
  }
}
function forceStoreRerender(fiber) {
  var root = enqueueConcurrentRenderForLane(fiber, 1);
  null !== root && scheduleUpdateOnFiber(root, fiber, 1, -1);
}
function mountState(initialState) {
  var hook = mountWorkInProgressHook();
  "function" === typeof initialState && (initialState = initialState());
  hook.memoizedState = hook.baseState = initialState;
  initialState = {
    pending: null,
    lanes: 0,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState
  };
  hook.queue = initialState;
  initialState = initialState.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    initialState
  );
  return [hook.memoizedState, initialState];
}
function pushEffect(tag, create, destroy, deps) {
  tag = { tag: tag, create: create, destroy: destroy, deps: deps, next: null };
  create = currentlyRenderingFiber.updateQueue;
  null === create
    ? ((create = createFunctionComponentUpdateQueue()),
      (currentlyRenderingFiber.updateQueue = create),
      (create.lastEffect = tag.next = tag))
    : ((destroy = create.lastEffect),
      null === destroy
        ? (create.lastEffect = tag.next = tag)
        : ((deps = destroy.next),
          (destroy.next = tag),
          (tag.next = deps),
          (create.lastEffect = tag)));
  return tag;
}
function updateRef() {
  return updateWorkInProgressHook().memoizedState;
}
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  var hook = mountWorkInProgressHook();
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    1 | hookFlags,
    create,
    void 0,
    void 0 === deps ? null : deps
  );
}
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var destroy = void 0;
  if (null !== currentHook) {
    var prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (null !== deps && areHookInputsEqual(deps, prevEffect.deps)) {
      hook.memoizedState = pushEffect(hookFlags, create, destroy, deps);
      return;
    }
  }
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(1 | hookFlags, create, destroy, deps);
}
function mountEffect(create, deps) {
  mountEffectImpl(8390656, 8, create, deps);
}
function updateEffect(create, deps) {
  updateEffectImpl(2048, 8, create, deps);
}
function useEffectEventImpl(payload) {
  currentlyRenderingFiber.flags |= 4;
  var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (null === componentUpdateQueue)
    (componentUpdateQueue = createFunctionComponentUpdateQueue()),
      (currentlyRenderingFiber.updateQueue = componentUpdateQueue),
      (componentUpdateQueue.events = [payload]);
  else {
    var events = componentUpdateQueue.events;
    null === events
      ? (componentUpdateQueue.events = [payload])
      : events.push(payload);
  }
}
function updateEvent(callback) {
  var ref = updateWorkInProgressHook().memoizedState;
  useEffectEventImpl({ ref: ref, nextImpl: callback });
  return function() {
    if (0 !== (executionContext & 2)) throw Error(formatProdErrorMessage(440));
    return ref.impl.apply(void 0, arguments);
  };
}
function updateInsertionEffect(create, deps) {
  return updateEffectImpl(4, 2, create, deps);
}
function updateLayoutEffect(create, deps) {
  return updateEffectImpl(4, 4, create, deps);
}
function imperativeHandleEffect(create, ref) {
  if ("function" === typeof ref)
    return (
      (create = create()),
      ref(create),
      function() {
        ref(null);
      }
    );
  if (null !== ref && void 0 !== ref)
    return (
      (create = create()),
      (ref.current = create),
      function() {
        ref.current = null;
      }
    );
}
function updateImperativeHandle(ref, create, deps) {
  deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
  updateEffectImpl(4, 4, imperativeHandleEffect.bind(null, create, ref), deps);
}
function mountDebugValue() {}
function updateCallback(callback, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var prevState = hook.memoizedState;
  if (
    null !== prevState &&
    null !== deps &&
    areHookInputsEqual(deps, prevState[1])
  )
    return prevState[0];
  hook.memoizedState = [callback, deps];
  return callback;
}
function updateMemo(nextCreate, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var prevState = hook.memoizedState;
  if (
    null !== prevState &&
    null !== deps &&
    areHookInputsEqual(deps, prevState[1])
  )
    return prevState[0];
  shouldDoubleInvokeUserFnsInHooksDEV && nextCreate();
  nextCreate = nextCreate();
  hook.memoizedState = [nextCreate, deps];
  return nextCreate;
}
function updateDeferredValueImpl(hook, prevValue, value) {
  if (0 === (renderLanes & 21))
    return (
      hook.baseState && ((hook.baseState = !1), (didReceiveUpdate = !0)),
      (hook.memoizedState = value)
    );
  objectIs(value, prevValue) ||
    ((value = claimNextTransitionLane()),
    (currentlyRenderingFiber.lanes |= value),
    (workInProgressRootSkippedLanes |= value),
    (hook.baseState = !0));
  return prevValue;
}
function startTransition(setPending, callback, options) {
  var previousPriority = currentUpdatePriority;
  currentUpdatePriority =
    0 !== previousPriority && 4 > previousPriority ? previousPriority : 4;
  setPending(!0);
  var prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};
  enableTransitionTracing &&
    void 0 !== options &&
    void 0 !== options.name &&
    ((ReactCurrentBatchConfig.transition.name = options.name),
    (ReactCurrentBatchConfig.transition.startTime = now()));
  try {
    setPending(!1), callback();
  } finally {
    (currentUpdatePriority = previousPriority),
      (ReactCurrentBatchConfig.transition = prevTransition);
  }
}
function updateId() {
  return updateWorkInProgressHook().memoizedState;
}
function updateRefresh() {
  return updateWorkInProgressHook().memoizedState;
}
function refreshCache(fiber, seedKey, seedValue) {
  for (var provider = fiber.return; null !== provider; ) {
    switch (provider.tag) {
      case 24:
      case 3:
        var lane = requestUpdateLane(provider),
          eventTime = requestEventTime();
        fiber = createUpdate(eventTime, lane);
        var root = enqueueUpdate$1(provider, fiber, lane);
        null !== root &&
          (scheduleUpdateOnFiber(root, provider, lane, eventTime),
          entangleTransitions(root, provider, lane));
        provider = createCache();
        null !== seedKey &&
          void 0 !== seedKey &&
          null !== root &&
          provider.data.set(seedKey, seedValue);
        fiber.payload = { cache: provider };
        return;
    }
    provider = provider.return;
  }
}
function dispatchReducerAction(fiber, queue, action) {
  var lane = requestUpdateLane(fiber);
  action = {
    lane: lane,
    action: action,
    hasEagerState: !1,
    eagerState: null,
    next: null
  };
  if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, action);
  else if (
    (enqueueUpdate(fiber, queue, action, lane),
    (action = getRootForUpdatedFiber(fiber)),
    null !== action)
  ) {
    var eventTime = requestEventTime();
    scheduleUpdateOnFiber(action, fiber, lane, eventTime);
    entangleTransitionUpdate(action, queue, lane);
  }
}
function dispatchSetState(fiber, queue, action) {
  var lane = requestUpdateLane(fiber),
    update = {
      lane: lane,
      action: action,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
  if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, update);
  else {
    var alternate = fiber.alternate;
    if (
      0 === fiber.lanes &&
      (null === alternate || 0 === alternate.lanes) &&
      ((alternate = queue.lastRenderedReducer), null !== alternate)
    )
      try {
        var currentState = queue.lastRenderedState,
          eagerState = alternate(currentState, action);
        update.hasEagerState = !0;
        update.eagerState = eagerState;
        if (objectIs(eagerState, currentState)) {
          enqueueUpdate(fiber, queue, update, 0);
          null === workInProgressRoot && finishQueueingConcurrentUpdates();
          return;
        }
      } catch (error) {
      } finally {
      }
    enqueueUpdate(fiber, queue, update, lane);
    action = getRootForUpdatedFiber(fiber);
    null !== action &&
      ((update = requestEventTime()),
      scheduleUpdateOnFiber(action, fiber, lane, update),
      entangleTransitionUpdate(action, queue, lane));
  }
}
function isRenderPhaseUpdate(fiber) {
  var alternate = fiber.alternate;
  return (
    fiber === currentlyRenderingFiber ||
    (null !== alternate && alternate === currentlyRenderingFiber)
  );
}
function enqueueRenderPhaseUpdate(queue, update) {
  didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = !0;
  var pending = queue.pending;
  null === pending
    ? (update.next = update)
    : ((update.next = pending.next), (pending.next = update));
  queue.pending = update;
}
function entangleTransitionUpdate(root, queue, lane) {
  if (0 !== (lane & 4194240)) {
    var queueLanes = queue.lanes;
    queueLanes &= root.pendingLanes;
    lane |= queueLanes;
    queue.lanes = lane;
    markRootEntangled(root, lane);
  }
}
var ContextOnlyDispatcher = {
  readContext: readContext,
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useInsertionEffect: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  useDebugValue: throwInvalidHookError,
  useDeferredValue: throwInvalidHookError,
  useTransition: throwInvalidHookError,
  useMutableSource: throwInvalidHookError,
  useSyncExternalStore: throwInvalidHookError,
  useId: throwInvalidHookError
};
ContextOnlyDispatcher.useCacheRefresh = throwInvalidHookError;
ContextOnlyDispatcher.use = throwInvalidHookError;
ContextOnlyDispatcher.useMemoCache = throwInvalidHookError;
ContextOnlyDispatcher.useEffectEvent = throwInvalidHookError;
var HooksDispatcherOnMount = {
  readContext: readContext,
  useCallback: function(callback, deps) {
    mountWorkInProgressHook().memoizedState = [
      callback,
      void 0 === deps ? null : deps
    ];
    return callback;
  },
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: function(ref, create, deps) {
    deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
    mountEffectImpl(
      4194308,
      4,
      imperativeHandleEffect.bind(null, create, ref),
      deps
    );
  },
  useLayoutEffect: function(create, deps) {
    return mountEffectImpl(4194308, 4, create, deps);
  },
  useInsertionEffect: function(create, deps) {
    mountEffectImpl(4, 2, create, deps);
  },
  useMemo: function(nextCreate, deps) {
    var hook = mountWorkInProgressHook();
    deps = void 0 === deps ? null : deps;
    shouldDoubleInvokeUserFnsInHooksDEV && nextCreate();
    nextCreate = nextCreate();
    hook.memoizedState = [nextCreate, deps];
    return nextCreate;
  },
  useReducer: function(reducer, initialArg, init) {
    var hook = mountWorkInProgressHook();
    initialArg = void 0 !== init ? init(initialArg) : initialArg;
    hook.memoizedState = hook.baseState = initialArg;
    reducer = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: reducer,
      lastRenderedState: initialArg
    };
    hook.queue = reducer;
    reducer = reducer.dispatch = dispatchReducerAction.bind(
      null,
      currentlyRenderingFiber,
      reducer
    );
    return [hook.memoizedState, reducer];
  },
  useRef: function(initialValue) {
    var hook = mountWorkInProgressHook();
    if (enableUseRefAccessWarning)
      return (
        (initialValue = { current: initialValue }),
        (hook.memoizedState = initialValue)
      );
    initialValue = { current: initialValue };
    return (hook.memoizedState = initialValue);
  },
  useState: mountState,
  useDebugValue: mountDebugValue,
  useDeferredValue: function(value) {
    return (mountWorkInProgressHook().memoizedState = value);
  },
  useTransition: function() {
    var _mountState = mountState(!1),
      isPending = _mountState[0];
    _mountState = startTransition.bind(null, _mountState[1]);
    mountWorkInProgressHook().memoizedState = _mountState;
    return [isPending, _mountState];
  },
  useMutableSource: function(source, getSnapshot, subscribe) {
    var hook = mountWorkInProgressHook();
    hook.memoizedState = {
      refs: { getSnapshot: getSnapshot, setSnapshot: null },
      source: source,
      subscribe: subscribe
    };
    return useMutableSource(hook, source, getSnapshot, subscribe);
  },
  useSyncExternalStore: function(subscribe, getSnapshot) {
    var fiber = currentlyRenderingFiber,
      hook = mountWorkInProgressHook();
    var nextSnapshot = getSnapshot();
    var root = workInProgressRoot;
    if (null === root) throw Error(formatProdErrorMessage(349));
    includesBlockingLane(root, renderLanes) ||
      pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
    hook.memoizedState = nextSnapshot;
    root = { value: nextSnapshot, getSnapshot: getSnapshot };
    hook.queue = root;
    mountEffect(subscribeToStore.bind(null, fiber, root, subscribe), [
      subscribe
    ]);
    fiber.flags |= 2048;
    pushEffect(
      9,
      updateStoreInstance.bind(null, fiber, root, nextSnapshot, getSnapshot),
      void 0,
      null
    );
    return nextSnapshot;
  },
  useId: function() {
    var hook = mountWorkInProgressHook(),
      identifierPrefix = workInProgressRoot.identifierPrefix,
      globalClientId = globalClientIdCounter++;
    identifierPrefix =
      ":" + identifierPrefix + "r" + globalClientId.toString(32) + ":";
    return (hook.memoizedState = identifierPrefix);
  },
  useCacheRefresh: function() {
    return (mountWorkInProgressHook().memoizedState = refreshCache.bind(
      null,
      currentlyRenderingFiber
    ));
  }
};
HooksDispatcherOnMount.use = use;
HooksDispatcherOnMount.useMemoCache = useMemoCache;
HooksDispatcherOnMount.useEffectEvent = function(callback) {
  var hook = mountWorkInProgressHook(),
    ref = { impl: callback };
  hook.memoizedState = ref;
  return function() {
    if (0 !== (executionContext & 2)) throw Error(formatProdErrorMessage(440));
    return ref.impl.apply(void 0, arguments);
  };
};
var HooksDispatcherOnUpdate = {
  readContext: readContext,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: function() {
    return updateReducer(basicStateReducer);
  },
  useDebugValue: mountDebugValue,
  useDeferredValue: function(value) {
    var hook = updateWorkInProgressHook();
    return updateDeferredValueImpl(hook, currentHook.memoizedState, value);
  },
  useTransition: function() {
    var isPending = updateReducer(basicStateReducer)[0],
      start = updateWorkInProgressHook().memoizedState;
    return [isPending, start];
  },
  useMutableSource: updateMutableSource,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId
};
HooksDispatcherOnUpdate.useCacheRefresh = updateRefresh;
HooksDispatcherOnUpdate.useMemoCache = useMemoCache;
HooksDispatcherOnUpdate.use = use;
HooksDispatcherOnUpdate.useEffectEvent = updateEvent;
var HooksDispatcherOnRerender = {
  readContext: readContext,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: rerenderReducer,
  useRef: updateRef,
  useState: function() {
    return rerenderReducer(basicStateReducer);
  },
  useDebugValue: mountDebugValue,
  useDeferredValue: function(value) {
    var hook = updateWorkInProgressHook();
    return null === currentHook
      ? (hook.memoizedState = value)
      : updateDeferredValueImpl(hook, currentHook.memoizedState, value);
  },
  useTransition: function() {
    var isPending = rerenderReducer(basicStateReducer)[0],
      start = updateWorkInProgressHook().memoizedState;
    return [isPending, start];
  },
  useMutableSource: updateMutableSource,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId
};
HooksDispatcherOnRerender.useCacheRefresh = updateRefresh;
HooksDispatcherOnRerender.use = use;
HooksDispatcherOnRerender.useMemoCache = useMemoCache;
HooksDispatcherOnRerender.useEffectEvent = updateEvent;
function resolveDefaultProps(Component, baseProps) {
  if (Component && Component.defaultProps) {
    baseProps = assign({}, baseProps);
    Component = Component.defaultProps;
    for (var propName in Component)
      void 0 === baseProps[propName] &&
        (baseProps[propName] = Component[propName]);
    return baseProps;
  }
  return baseProps;
}
function applyDerivedStateFromProps(
  workInProgress,
  ctor,
  getDerivedStateFromProps,
  nextProps
) {
  ctor = workInProgress.memoizedState;
  getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor);
  getDerivedStateFromProps =
    null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps
      ? ctor
      : assign({}, ctor, getDerivedStateFromProps);
  workInProgress.memoizedState = getDerivedStateFromProps;
  0 === workInProgress.lanes &&
    (workInProgress.updateQueue.baseState = getDerivedStateFromProps);
}
var classComponentUpdater = {
  isMounted: function(component) {
    return (component = component._reactInternals)
      ? getNearestMountedFiber(component) === component
      : !1;
  },
  enqueueSetState: function(inst, payload, callback) {
    inst = inst._reactInternals;
    var eventTime = requestEventTime(),
      lane = requestUpdateLane(inst),
      update = createUpdate(eventTime, lane);
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    payload = enqueueUpdate$1(inst, update, lane);
    null !== payload &&
      (scheduleUpdateOnFiber(payload, inst, lane, eventTime),
      entangleTransitions(payload, inst, lane));
  },
  enqueueReplaceState: function(inst, payload, callback) {
    inst = inst._reactInternals;
    var eventTime = requestEventTime(),
      lane = requestUpdateLane(inst),
      update = createUpdate(eventTime, lane);
    update.tag = 1;
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    payload = enqueueUpdate$1(inst, update, lane);
    null !== payload &&
      (scheduleUpdateOnFiber(payload, inst, lane, eventTime),
      entangleTransitions(payload, inst, lane));
  },
  enqueueForceUpdate: function(inst, callback) {
    inst = inst._reactInternals;
    var eventTime = requestEventTime(),
      lane = requestUpdateLane(inst),
      update = createUpdate(eventTime, lane);
    update.tag = 2;
    void 0 !== callback && null !== callback && (update.callback = callback);
    callback = enqueueUpdate$1(inst, update, lane);
    null !== callback &&
      (scheduleUpdateOnFiber(callback, inst, lane, eventTime),
      entangleTransitions(callback, inst, lane));
  }
};
function checkShouldComponentUpdate(
  workInProgress,
  ctor,
  oldProps,
  newProps,
  oldState,
  newState,
  nextContext
) {
  workInProgress = workInProgress.stateNode;
  return "function" === typeof workInProgress.shouldComponentUpdate
    ? workInProgress.shouldComponentUpdate(newProps, newState, nextContext)
    : ctor.prototype && ctor.prototype.isPureReactComponent
    ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
    : !0;
}
function constructClassInstance(workInProgress, ctor, props) {
  var context = emptyContextObject,
    contextType = ctor.contextType;
  "object" === typeof contextType &&
    null !== contextType &&
    (context = readContext(contextType));
  ctor = new ctor(props, context);
  workInProgress.memoizedState =
    null !== ctor.state && void 0 !== ctor.state ? ctor.state : null;
  ctor.updater = classComponentUpdater;
  workInProgress.stateNode = ctor;
  ctor._reactInternals = workInProgress;
  return ctor;
}
function callComponentWillReceiveProps(
  workInProgress,
  instance,
  newProps,
  nextContext
) {
  workInProgress = instance.state;
  "function" === typeof instance.componentWillReceiveProps &&
    instance.componentWillReceiveProps(newProps, nextContext);
  "function" === typeof instance.UNSAFE_componentWillReceiveProps &&
    instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
  instance.state !== workInProgress &&
    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
}
function mountClassInstance(workInProgress, ctor, newProps, renderLanes) {
  var instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = {};
  initializeUpdateQueue(workInProgress);
  var contextType = ctor.contextType;
  instance.context =
    "object" === typeof contextType && null !== contextType
      ? readContext(contextType)
      : emptyContextObject;
  instance.state = workInProgress.memoizedState;
  contextType = ctor.getDerivedStateFromProps;
  "function" === typeof contextType &&
    (applyDerivedStateFromProps(workInProgress, ctor, contextType, newProps),
    (instance.state = workInProgress.memoizedState));
  "function" === typeof ctor.getDerivedStateFromProps ||
    "function" === typeof instance.getSnapshotBeforeUpdate ||
    ("function" !== typeof instance.UNSAFE_componentWillMount &&
      "function" !== typeof instance.componentWillMount) ||
    ((ctor = instance.state),
    "function" === typeof instance.componentWillMount &&
      instance.componentWillMount(),
    "function" === typeof instance.UNSAFE_componentWillMount &&
      instance.UNSAFE_componentWillMount(),
    ctor !== instance.state &&
      classComponentUpdater.enqueueReplaceState(instance, instance.state, null),
    processUpdateQueue(workInProgress, newProps, instance, renderLanes),
    (instance.state = workInProgress.memoizedState));
  "function" === typeof instance.componentDidMount &&
    (workInProgress.flags |= 4194308);
}
function createCapturedValueAtFiber(value, source) {
  try {
    var info = "",
      node = source;
    do (info += describeFiber(node)), (node = node.return);
    while (node);
    var JSCompiler_inline_result = info;
  } catch (x) {
    JSCompiler_inline_result =
      "\nError generating stack: " + x.message + "\n" + x.stack;
  }
  return {
    value: value,
    source: source,
    stack: JSCompiler_inline_result,
    digest: null
  };
}
function createCapturedValue(value, digest, stack) {
  return {
    value: value,
    source: null,
    stack: null != stack ? stack : null,
    digest: null != digest ? digest : null
  };
}
var ReactFiberErrorDialogWWW = require("ReactFiberErrorDialog");
if ("function" !== typeof ReactFiberErrorDialogWWW.showErrorDialog)
  throw Error(formatProdErrorMessage(320));
function logCapturedError(boundary, errorInfo) {
  try {
    !1 !==
      ReactFiberErrorDialogWWW.showErrorDialog({
        componentStack: null !== errorInfo.stack ? errorInfo.stack : "",
        error: errorInfo.value,
        errorBoundary:
          null !== boundary && 1 === boundary.tag ? boundary.stateNode : null
      }) && console.error(errorInfo.value);
  } catch (e) {
    setTimeout(function() {
      throw e;
    });
  }
}
function createRootErrorUpdate(fiber, errorInfo, lane) {
  lane = createUpdate(-1, lane);
  lane.tag = 3;
  lane.payload = { element: null };
  var error = errorInfo.value;
  lane.callback = function() {
    hasUncaughtError || ((hasUncaughtError = !0), (firstUncaughtError = error));
    logCapturedError(fiber, errorInfo);
  };
  return lane;
}
function createClassErrorUpdate(fiber, errorInfo, lane) {
  lane = createUpdate(-1, lane);
  lane.tag = 3;
  var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
  if ("function" === typeof getDerivedStateFromError) {
    var error = errorInfo.value;
    lane.payload = function() {
      return getDerivedStateFromError(error);
    };
    lane.callback = function() {
      logCapturedError(fiber, errorInfo);
    };
  }
  var inst = fiber.stateNode;
  null !== inst &&
    "function" === typeof inst.componentDidCatch &&
    (lane.callback = function() {
      logCapturedError(fiber, errorInfo);
      "function" !== typeof getDerivedStateFromError &&
        (null === legacyErrorBoundariesThatAlreadyFailed
          ? (legacyErrorBoundariesThatAlreadyFailed = new Set([this]))
          : legacyErrorBoundariesThatAlreadyFailed.add(this));
      var stack = errorInfo.stack;
      this.componentDidCatch(errorInfo.value, {
        componentStack: null !== stack ? stack : ""
      });
    });
  return lane;
}
function processTransitionCallbacks(pendingTransitions, endTime, callbacks) {
  if (enableTransitionTracing && null !== pendingTransitions) {
    var transitionStart = pendingTransitions.transitionStart,
      onTransitionStart = callbacks.onTransitionStart;
    null !== transitionStart &&
      null != onTransitionStart &&
      transitionStart.forEach(function(transition) {
        return onTransitionStart(transition.name, transition.startTime);
      });
    transitionStart = pendingTransitions.markerProgress;
    var onMarkerProgress = callbacks.onMarkerProgress;
    null != onMarkerProgress &&
      null !== transitionStart &&
      transitionStart.forEach(function(markerInstance, markerName) {
        if (null !== markerInstance.transitions) {
          var pending =
            null !== markerInstance.pendingBoundaries
              ? Array.from(markerInstance.pendingBoundaries.values())
              : [];
          markerInstance.transitions.forEach(function(transition) {
            onMarkerProgress(
              transition.name,
              markerName,
              transition.startTime,
              endTime,
              pending
            );
          });
        }
      });
    transitionStart = pendingTransitions.markerComplete;
    var onMarkerComplete = callbacks.onMarkerComplete;
    null !== transitionStart &&
      null != onMarkerComplete &&
      transitionStart.forEach(function(transitions, markerName) {
        transitions.forEach(function(transition) {
          onMarkerComplete(
            transition.name,
            markerName,
            transition.startTime,
            endTime
          );
        });
      });
    transitionStart = pendingTransitions.markerIncomplete;
    var onMarkerIncomplete = callbacks.onMarkerIncomplete;
    null != onMarkerIncomplete &&
      null !== transitionStart &&
      transitionStart.forEach(function(_ref, markerName) {
        var aborts = _ref.aborts;
        _ref.transitions.forEach(function(transition) {
          var filteredAborts = [];
          aborts.forEach(function(abort) {
            switch (abort.reason) {
              case "marker":
                filteredAborts.push({
                  type: "marker",
                  name: abort.name,
                  endTime: endTime
                });
                break;
              case "suspense":
                filteredAborts.push({
                  type: "suspense",
                  name: abort.name,
                  endTime: endTime
                });
            }
          });
          0 < filteredAborts.length &&
            onMarkerIncomplete(
              transition.name,
              markerName,
              transition.startTime,
              filteredAborts
            );
        });
      });
    transitionStart = pendingTransitions.transitionProgress;
    var onTransitionProgress = callbacks.onTransitionProgress;
    null != onTransitionProgress &&
      null !== transitionStart &&
      transitionStart.forEach(function(pending, transition) {
        onTransitionProgress(
          transition.name,
          transition.startTime,
          endTime,
          Array.from(pending.values())
        );
      });
    pendingTransitions = pendingTransitions.transitionComplete;
    var onTransitionComplete = callbacks.onTransitionComplete;
    null !== pendingTransitions &&
      null != onTransitionComplete &&
      pendingTransitions.forEach(function(transition) {
        return onTransitionComplete(
          transition.name,
          transition.startTime,
          endTime
        );
      });
  }
}
var markerInstanceStack = createCursor(null);
function pushRootMarkerInstance(workInProgress) {
  if (enableTransitionTracing) {
    var transitions = workInProgressTransitions,
      root = workInProgress.stateNode;
    null !== transitions &&
      transitions.forEach(function(transition) {
        if (!root.incompleteTransitions.has(transition)) {
          var markerInstance = {
            tag: 0,
            transitions: new Set([transition]),
            pendingBoundaries: null,
            aborts: null,
            name: null
          };
          root.incompleteTransitions.set(transition, markerInstance);
        }
      });
    var markerInstances = [];
    root.incompleteTransitions.forEach(function(markerInstance) {
      markerInstances.push(markerInstance);
    });
    push(markerInstanceStack, markerInstances);
  }
}
function pushMarkerInstance(workInProgress, markerInstance) {
  enableTransitionTracing &&
    (null === markerInstanceStack.current
      ? push(markerInstanceStack, [markerInstance])
      : push(
          markerInstanceStack,
          markerInstanceStack.current.concat(markerInstance)
        ));
}
var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner,
  didReceiveUpdate = !1;
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  workInProgress.child =
    null === current
      ? mountChildFibers(workInProgress, null, nextChildren, renderLanes)
      : reconcileChildFibers(
          workInProgress,
          current.child,
          nextChildren,
          renderLanes
        );
}
function updateForwardRef(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  Component = Component.render;
  var ref = workInProgress.ref;
  prepareToReadContext(workInProgress, renderLanes);
  nextProps = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    ref,
    renderLanes
  );
  if (null !== current && !didReceiveUpdate)
    return (
      bailoutHooks(current, workInProgress, renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  workInProgress.flags |= 1;
  reconcileChildren(current, workInProgress, nextProps, renderLanes);
  return workInProgress.child;
}
function updateMemoComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  if (null === current) {
    var type = Component.type;
    if (
      "function" === typeof type &&
      !shouldConstruct(type) &&
      void 0 === type.defaultProps &&
      null === Component.compare &&
      void 0 === Component.defaultProps
    )
      return (
        (workInProgress.tag = 15),
        (workInProgress.type = type),
        updateSimpleMemoComponent(
          current,
          workInProgress,
          type,
          nextProps,
          renderLanes
        )
      );
    current = createFiberFromTypeAndProps(
      Component.type,
      null,
      nextProps,
      workInProgress,
      workInProgress.mode,
      renderLanes
    );
    current.ref = workInProgress.ref;
    current.return = workInProgress;
    return (workInProgress.child = current);
  }
  type = current.child;
  if (!checkScheduledUpdateOrContext(current, renderLanes)) {
    var prevProps = type.memoizedProps;
    Component = Component.compare;
    Component = null !== Component ? Component : shallowEqual;
    if (Component(prevProps, nextProps) && current.ref === workInProgress.ref)
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  workInProgress.flags |= 1;
  current = createWorkInProgress(type, nextProps);
  current.ref = workInProgress.ref;
  current.return = workInProgress;
  return (workInProgress.child = current);
}
function updateSimpleMemoComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  if (null !== current) {
    var prevProps = current.memoizedProps;
    if (
      shallowEqual(prevProps, nextProps) &&
      current.ref === workInProgress.ref
    )
      if (
        ((didReceiveUpdate = !1),
        (workInProgress.pendingProps = nextProps = prevProps),
        checkScheduledUpdateOrContext(current, renderLanes))
      )
        0 !== (current.flags & 131072) && (didReceiveUpdate = !0);
      else
        return (
          (workInProgress.lanes = current.lanes),
          bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
        );
  }
  return updateFunctionComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    renderLanes
  );
}
function updateOffscreenComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    nextChildren = nextProps.children,
    nextIsDetached = 0 !== (workInProgress.stateNode._pendingVisibility & 2),
    prevState = null !== current ? current.memoizedState : null;
  markRef(current, workInProgress);
  if (
    "hidden" === nextProps.mode ||
    "unstable-defer-without-hiding" === nextProps.mode ||
    nextIsDetached
  ) {
    if (0 !== (workInProgress.flags & 128)) {
      nextChildren =
        null !== prevState ? prevState.baseLanes | renderLanes : renderLanes;
      if (null !== current) {
        prevState = workInProgress.child = current.child;
        for (nextProps = 0; null !== prevState; )
          (nextProps = nextProps | prevState.lanes | prevState.childLanes),
            (prevState = prevState.sibling);
        workInProgress.childLanes = nextProps & ~nextChildren;
      } else (workInProgress.childLanes = 0), (workInProgress.child = null);
      return deferHiddenOffscreenComponent(
        current,
        workInProgress,
        nextChildren,
        renderLanes
      );
    }
    if (0 === (workInProgress.mode & 1))
      (workInProgress.memoizedState = { baseLanes: 0, cachePool: null }),
        null !== current && pushTransition(workInProgress, null, null),
        reuseHiddenContextOnStack(),
        pushOffscreenSuspenseHandler(workInProgress);
    else if (0 !== (renderLanes & 1073741824))
      (workInProgress.memoizedState = { baseLanes: 0, cachePool: null }),
        null !== current &&
          pushTransition(
            workInProgress,
            null !== prevState ? prevState.cachePool : null,
            null
          ),
        null !== prevState
          ? pushHiddenContext(workInProgress, prevState)
          : reuseHiddenContextOnStack(),
        pushOffscreenSuspenseHandler(workInProgress);
    else
      return (
        (workInProgress.lanes = workInProgress.childLanes = 1073741824),
        deferHiddenOffscreenComponent(
          current,
          workInProgress,
          null !== prevState ? prevState.baseLanes | renderLanes : renderLanes,
          renderLanes
        )
      );
  } else if (null !== prevState) {
    nextProps = prevState.cachePool;
    nextIsDetached = null;
    if (enableTransitionTracing) {
      var instance = workInProgress.stateNode;
      null !== instance &&
        null != instance._transitions &&
        (nextIsDetached = Array.from(instance._transitions));
    }
    pushTransition(workInProgress, nextProps, nextIsDetached);
    pushHiddenContext(workInProgress, prevState);
    reuseSuspenseHandlerOnStack();
    workInProgress.memoizedState = null;
  } else
    null !== current && pushTransition(workInProgress, null, null),
      reuseHiddenContextOnStack(),
      reuseSuspenseHandlerOnStack();
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function deferHiddenOffscreenComponent(
  current,
  workInProgress,
  nextBaseLanes,
  renderLanes
) {
  var JSCompiler_inline_result = peekCacheFromPool();
  JSCompiler_inline_result =
    null === JSCompiler_inline_result
      ? null
      : { parent: CacheContext._currentValue2, pool: JSCompiler_inline_result };
  workInProgress.memoizedState = {
    baseLanes: nextBaseLanes,
    cachePool: JSCompiler_inline_result
  };
  null !== current && pushTransition(workInProgress, null, null);
  reuseHiddenContextOnStack();
  pushOffscreenSuspenseHandler(workInProgress);
  enableLazyContextPropagation &&
    null !== current &&
    propagateParentContextChanges(current, workInProgress, renderLanes, !0);
  return null;
}
function markRef(current, workInProgress) {
  var ref = workInProgress.ref;
  if (
    (null === current && null !== ref) ||
    (null !== current && current.ref !== ref)
  )
    (workInProgress.flags |= 512), (workInProgress.flags |= 2097152);
}
function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  prepareToReadContext(workInProgress, renderLanes);
  Component = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    void 0,
    renderLanes
  );
  if (null !== current && !didReceiveUpdate)
    return (
      bailoutHooks(current, workInProgress, renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  workInProgress.flags |= 1;
  reconcileChildren(current, workInProgress, Component, renderLanes);
  return workInProgress.child;
}
function replayFunctionComponent(
  current,
  workInProgress,
  nextProps,
  Component,
  renderLanes
) {
  prepareToReadContext(workInProgress, renderLanes);
  nextProps = renderWithHooksAgain(
    workInProgress,
    Component,
    nextProps,
    void 0
  );
  finishRenderingHooks(current);
  if (null !== current && !didReceiveUpdate)
    return (
      bailoutHooks(current, workInProgress, renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  workInProgress.flags |= 1;
  reconcileChildren(current, workInProgress, nextProps, renderLanes);
  return workInProgress.child;
}
function updateClassComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  prepareToReadContext(workInProgress, renderLanes);
  if (null === workInProgress.stateNode)
    resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
      constructClassInstance(workInProgress, Component, nextProps),
      mountClassInstance(workInProgress, Component, nextProps, renderLanes),
      (nextProps = !0);
  else if (null === current) {
    var instance = workInProgress.stateNode,
      oldProps = workInProgress.memoizedProps;
    instance.props = oldProps;
    var oldContext = instance.context,
      contextType = Component.contextType,
      nextContext = emptyContextObject;
    "object" === typeof contextType &&
      null !== contextType &&
      (nextContext = readContext(contextType));
    var getDerivedStateFromProps = Component.getDerivedStateFromProps;
    (contextType =
      "function" === typeof getDerivedStateFromProps ||
      "function" === typeof instance.getSnapshotBeforeUpdate) ||
      ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
        "function" !== typeof instance.componentWillReceiveProps) ||
      ((oldProps !== nextProps || oldContext !== nextContext) &&
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          nextProps,
          nextContext
        ));
    hasForceUpdate = !1;
    var oldState = workInProgress.memoizedState;
    instance.state = oldState;
    processUpdateQueue(workInProgress, nextProps, instance, renderLanes);
    oldContext = workInProgress.memoizedState;
    oldProps !== nextProps || oldState !== oldContext || hasForceUpdate
      ? ("function" === typeof getDerivedStateFromProps &&
          (applyDerivedStateFromProps(
            workInProgress,
            Component,
            getDerivedStateFromProps,
            nextProps
          ),
          (oldContext = workInProgress.memoizedState)),
        (oldProps =
          hasForceUpdate ||
          checkShouldComponentUpdate(
            workInProgress,
            Component,
            oldProps,
            nextProps,
            oldState,
            oldContext,
            nextContext
          ))
          ? (contextType ||
              ("function" !== typeof instance.UNSAFE_componentWillMount &&
                "function" !== typeof instance.componentWillMount) ||
              ("function" === typeof instance.componentWillMount &&
                instance.componentWillMount(),
              "function" === typeof instance.UNSAFE_componentWillMount &&
                instance.UNSAFE_componentWillMount()),
            "function" === typeof instance.componentDidMount &&
              (workInProgress.flags |= 4194308))
          : ("function" === typeof instance.componentDidMount &&
              (workInProgress.flags |= 4194308),
            (workInProgress.memoizedProps = nextProps),
            (workInProgress.memoizedState = oldContext)),
        (instance.props = nextProps),
        (instance.state = oldContext),
        (instance.context = nextContext),
        (nextProps = oldProps))
      : ("function" === typeof instance.componentDidMount &&
          (workInProgress.flags |= 4194308),
        (nextProps = !1));
  } else {
    instance = workInProgress.stateNode;
    cloneUpdateQueue(current, workInProgress);
    nextContext = workInProgress.memoizedProps;
    contextType =
      workInProgress.type === workInProgress.elementType
        ? nextContext
        : resolveDefaultProps(workInProgress.type, nextContext);
    instance.props = contextType;
    getDerivedStateFromProps = workInProgress.pendingProps;
    var oldContext$jscomp$0 = instance.context;
    oldContext = Component.contextType;
    oldProps = emptyContextObject;
    "object" === typeof oldContext &&
      null !== oldContext &&
      (oldProps = readContext(oldContext));
    oldState = Component.getDerivedStateFromProps;
    (oldContext =
      "function" === typeof oldState ||
      "function" === typeof instance.getSnapshotBeforeUpdate) ||
      ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
        "function" !== typeof instance.componentWillReceiveProps) ||
      ((nextContext !== getDerivedStateFromProps ||
        oldContext$jscomp$0 !== oldProps) &&
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          nextProps,
          oldProps
        ));
    hasForceUpdate = !1;
    oldContext$jscomp$0 = workInProgress.memoizedState;
    instance.state = oldContext$jscomp$0;
    processUpdateQueue(workInProgress, nextProps, instance, renderLanes);
    var newState = workInProgress.memoizedState;
    nextContext !== getDerivedStateFromProps ||
    oldContext$jscomp$0 !== newState ||
    hasForceUpdate ||
    (enableLazyContextPropagation &&
      null !== current &&
      null !== current.dependencies &&
      checkIfContextChanged(current.dependencies))
      ? ("function" === typeof oldState &&
          (applyDerivedStateFromProps(
            workInProgress,
            Component,
            oldState,
            nextProps
          ),
          (newState = workInProgress.memoizedState)),
        (contextType =
          hasForceUpdate ||
          checkShouldComponentUpdate(
            workInProgress,
            Component,
            contextType,
            nextProps,
            oldContext$jscomp$0,
            newState,
            oldProps
          ) ||
          (enableLazyContextPropagation &&
            null !== current &&
            null !== current.dependencies &&
            checkIfContextChanged(current.dependencies)))
          ? (oldContext ||
              ("function" !== typeof instance.UNSAFE_componentWillUpdate &&
                "function" !== typeof instance.componentWillUpdate) ||
              ("function" === typeof instance.componentWillUpdate &&
                instance.componentWillUpdate(nextProps, newState, oldProps),
              "function" === typeof instance.UNSAFE_componentWillUpdate &&
                instance.UNSAFE_componentWillUpdate(
                  nextProps,
                  newState,
                  oldProps
                )),
            "function" === typeof instance.componentDidUpdate &&
              (workInProgress.flags |= 4),
            "function" === typeof instance.getSnapshotBeforeUpdate &&
              (workInProgress.flags |= 1024))
          : ("function" !== typeof instance.componentDidUpdate ||
              (nextContext === current.memoizedProps &&
                oldContext$jscomp$0 === current.memoizedState) ||
              (workInProgress.flags |= 4),
            "function" !== typeof instance.getSnapshotBeforeUpdate ||
              (nextContext === current.memoizedProps &&
                oldContext$jscomp$0 === current.memoizedState) ||
              (workInProgress.flags |= 1024),
            (workInProgress.memoizedProps = nextProps),
            (workInProgress.memoizedState = newState)),
        (instance.props = nextProps),
        (instance.state = newState),
        (instance.context = oldProps),
        (nextProps = contextType))
      : ("function" !== typeof instance.componentDidUpdate ||
          (nextContext === current.memoizedProps &&
            oldContext$jscomp$0 === current.memoizedState) ||
          (workInProgress.flags |= 4),
        "function" !== typeof instance.getSnapshotBeforeUpdate ||
          (nextContext === current.memoizedProps &&
            oldContext$jscomp$0 === current.memoizedState) ||
          (workInProgress.flags |= 1024),
        (nextProps = !1));
  }
  return finishClassComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    !1,
    renderLanes
  );
}
function finishClassComponent(
  current,
  workInProgress,
  Component,
  shouldUpdate,
  hasContext,
  renderLanes
) {
  markRef(current, workInProgress);
  hasContext = 0 !== (workInProgress.flags & 128);
  if (!shouldUpdate && !hasContext)
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  shouldUpdate = workInProgress.stateNode;
  ReactCurrentOwner$1.current = workInProgress;
  Component =
    hasContext && "function" !== typeof Component.getDerivedStateFromError
      ? null
      : shouldUpdate.render();
  workInProgress.flags |= 1;
  null !== current && hasContext
    ? ((workInProgress.child = reconcileChildFibers(
        workInProgress,
        current.child,
        null,
        renderLanes
      )),
      (workInProgress.child = reconcileChildFibers(
        workInProgress,
        null,
        Component,
        renderLanes
      )))
    : reconcileChildren(current, workInProgress, Component, renderLanes);
  workInProgress.memoizedState = shouldUpdate.state;
  return workInProgress.child;
}
var SUSPENDED_MARKER = { dehydrated: null, treeContext: null, retryLane: 0 };
function mountSuspenseOffscreenState(renderLanes) {
  return { baseLanes: renderLanes, cachePool: getSuspendedCache() };
}
function updateSuspenseComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    showFallback = !1,
    didSuspend = 0 !== (workInProgress.flags & 128),
    JSCompiler_temp;
  (JSCompiler_temp = didSuspend) ||
    (JSCompiler_temp =
      null !== current && null === current.memoizedState
        ? !1
        : 0 !== (suspenseStackCursor.current & 2));
  JSCompiler_temp && ((showFallback = !0), (workInProgress.flags &= -129));
  if (null === current) {
    current = nextProps.children;
    didSuspend = nextProps.fallback;
    if (showFallback)
      return (
        reuseSuspenseHandlerOnStack(),
        (current = mountSuspenseFallbackChildren(
          workInProgress,
          current,
          didSuspend,
          renderLanes
        )),
        (nextProps = workInProgress.child),
        (nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes)),
        (workInProgress.memoizedState = SUSPENDED_MARKER),
        enableTransitionTracing &&
          ((workInProgress = enableTransitionTracing
            ? transitionStack.current
            : null),
          null !== workInProgress &&
            ((renderLanes = enableTransitionTracing
              ? markerInstanceStack.current
              : null),
            (showFallback = nextProps.updateQueue),
            null === showFallback
              ? (nextProps.updateQueue = {
                  transitions: workInProgress,
                  markerInstances: renderLanes,
                  wakeables: null
                })
              : ((showFallback.transitions = workInProgress),
                (showFallback.markerInstances = renderLanes)))),
        current
      );
    if ("number" === typeof nextProps.unstable_expectedLoadTime)
      return (
        reuseSuspenseHandlerOnStack(),
        (current = mountSuspenseFallbackChildren(
          workInProgress,
          current,
          didSuspend,
          renderLanes
        )),
        (workInProgress.child.memoizedState = mountSuspenseOffscreenState(
          renderLanes
        )),
        (workInProgress.memoizedState = SUSPENDED_MARKER),
        (workInProgress.lanes = 4194304),
        current
      );
    pushPrimaryTreeSuspenseHandler(workInProgress);
    return mountSuspensePrimaryChildren(workInProgress, current);
  }
  JSCompiler_temp = current.memoizedState;
  if (null !== JSCompiler_temp) {
    var dehydrated = JSCompiler_temp.dehydrated;
    if (null !== dehydrated)
      return updateDehydratedSuspenseComponent(
        current,
        workInProgress,
        didSuspend,
        nextProps,
        dehydrated,
        JSCompiler_temp,
        renderLanes
      );
  }
  if (showFallback) {
    reuseSuspenseHandlerOnStack();
    showFallback = nextProps.fallback;
    didSuspend = workInProgress.mode;
    JSCompiler_temp = current.child;
    dehydrated = JSCompiler_temp.sibling;
    var primaryChildProps = { mode: "hidden", children: nextProps.children };
    0 === (didSuspend & 1) && workInProgress.child !== JSCompiler_temp
      ? ((nextProps = workInProgress.child),
        (nextProps.childLanes = 0),
        (nextProps.pendingProps = primaryChildProps),
        (workInProgress.deletions = null))
      : ((nextProps = createWorkInProgress(JSCompiler_temp, primaryChildProps)),
        (nextProps.subtreeFlags = JSCompiler_temp.subtreeFlags & 14680064));
    null !== dehydrated
      ? (showFallback = createWorkInProgress(dehydrated, showFallback))
      : ((showFallback = createFiberFromFragment(
          showFallback,
          didSuspend,
          renderLanes,
          null
        )),
        (showFallback.flags |= 2));
    showFallback.return = workInProgress;
    nextProps.return = workInProgress;
    nextProps.sibling = showFallback;
    workInProgress.child = nextProps;
    nextProps = showFallback;
    showFallback = workInProgress.child;
    didSuspend = current.child.memoizedState;
    null === didSuspend
      ? (didSuspend = mountSuspenseOffscreenState(renderLanes))
      : ((JSCompiler_temp = didSuspend.cachePool),
        null !== JSCompiler_temp
          ? ((dehydrated = CacheContext._currentValue2),
            (JSCompiler_temp =
              JSCompiler_temp.parent !== dehydrated
                ? { parent: dehydrated, pool: dehydrated }
                : JSCompiler_temp))
          : (JSCompiler_temp = getSuspendedCache()),
        (didSuspend = {
          baseLanes: didSuspend.baseLanes | renderLanes,
          cachePool: JSCompiler_temp
        }));
    showFallback.memoizedState = didSuspend;
    enableTransitionTracing &&
      ((didSuspend = enableTransitionTracing ? transitionStack.current : null),
      null !== didSuspend &&
        ((JSCompiler_temp = enableTransitionTracing
          ? markerInstanceStack.current
          : null),
        (dehydrated = showFallback.updateQueue),
        (primaryChildProps = current.updateQueue),
        null === dehydrated
          ? (showFallback.updateQueue = {
              transitions: didSuspend,
              markerInstances: JSCompiler_temp,
              wakeables: null
            })
          : dehydrated === primaryChildProps
          ? (showFallback.updateQueue = {
              transitions: didSuspend,
              markerInstances: JSCompiler_temp,
              wakeables:
                null !== primaryChildProps ? primaryChildProps.wakeables : null
            })
          : ((dehydrated.transitions = didSuspend),
            (dehydrated.markerInstances = JSCompiler_temp))));
    showFallback.childLanes = current.childLanes & ~renderLanes;
    workInProgress.memoizedState = SUSPENDED_MARKER;
    return nextProps;
  }
  pushPrimaryTreeSuspenseHandler(workInProgress);
  showFallback = current.child;
  current = showFallback.sibling;
  nextProps = createWorkInProgress(showFallback, {
    mode: "visible",
    children: nextProps.children
  });
  0 === (workInProgress.mode & 1) && (nextProps.lanes = renderLanes);
  nextProps.return = workInProgress;
  nextProps.sibling = null;
  null !== current &&
    ((renderLanes = workInProgress.deletions),
    null === renderLanes
      ? ((workInProgress.deletions = [current]), (workInProgress.flags |= 16))
      : renderLanes.push(current));
  workInProgress.child = nextProps;
  workInProgress.memoizedState = null;
  return nextProps;
}
function mountSuspensePrimaryChildren(workInProgress, primaryChildren) {
  primaryChildren = createFiberFromOffscreen(
    { mode: "visible", children: primaryChildren },
    workInProgress.mode,
    0,
    null
  );
  primaryChildren.return = workInProgress;
  return (workInProgress.child = primaryChildren);
}
function mountSuspenseFallbackChildren(
  workInProgress,
  primaryChildren,
  fallbackChildren,
  renderLanes
) {
  var mode = workInProgress.mode,
    progressedPrimaryFragment = workInProgress.child;
  primaryChildren = { mode: "hidden", children: primaryChildren };
  0 === (mode & 1) && null !== progressedPrimaryFragment
    ? ((progressedPrimaryFragment.childLanes = 0),
      (progressedPrimaryFragment.pendingProps = primaryChildren))
    : (progressedPrimaryFragment = createFiberFromOffscreen(
        primaryChildren,
        mode,
        0,
        null
      ));
  fallbackChildren = createFiberFromFragment(
    fallbackChildren,
    mode,
    renderLanes,
    null
  );
  progressedPrimaryFragment.return = workInProgress;
  fallbackChildren.return = workInProgress;
  progressedPrimaryFragment.sibling = fallbackChildren;
  workInProgress.child = progressedPrimaryFragment;
  return fallbackChildren;
}
function retrySuspenseComponentWithoutHydrating(
  current,
  workInProgress,
  renderLanes,
  recoverableError
) {
  null !== recoverableError &&
    (null === hydrationErrors
      ? (hydrationErrors = [recoverableError])
      : hydrationErrors.push(recoverableError));
  reconcileChildFibers(workInProgress, current.child, null, renderLanes);
  current = mountSuspensePrimaryChildren(
    workInProgress,
    workInProgress.pendingProps.children
  );
  current.flags |= 2;
  workInProgress.memoizedState = null;
  return current;
}
function updateDehydratedSuspenseComponent(
  current,
  workInProgress,
  didSuspend,
  nextProps,
  suspenseInstance,
  suspenseState,
  renderLanes
) {
  if (didSuspend) {
    if (workInProgress.flags & 256)
      return (
        pushPrimaryTreeSuspenseHandler(workInProgress),
        (workInProgress.flags &= -257),
        (suspenseState = createCapturedValue(
          Error(formatProdErrorMessage(422))
        )),
        retrySuspenseComponentWithoutHydrating(
          current,
          workInProgress,
          renderLanes,
          suspenseState
        )
      );
    if (null !== workInProgress.memoizedState)
      return (
        reuseSuspenseHandlerOnStack(),
        (workInProgress.child = current.child),
        (workInProgress.flags |= 128),
        null
      );
    reuseSuspenseHandlerOnStack();
    suspenseState = nextProps.fallback;
    didSuspend = workInProgress.mode;
    nextProps = createFiberFromOffscreen(
      { mode: "visible", children: nextProps.children },
      didSuspend,
      0,
      null
    );
    suspenseState = createFiberFromFragment(
      suspenseState,
      didSuspend,
      renderLanes,
      null
    );
    suspenseState.flags |= 2;
    nextProps.return = workInProgress;
    suspenseState.return = workInProgress;
    nextProps.sibling = suspenseState;
    workInProgress.child = nextProps;
    0 !== (workInProgress.mode & 1) &&
      reconcileChildFibers(workInProgress, current.child, null, renderLanes);
    workInProgress.child.memoizedState = mountSuspenseOffscreenState(
      renderLanes
    );
    workInProgress.memoizedState = SUSPENDED_MARKER;
    return suspenseState;
  }
  pushPrimaryTreeSuspenseHandler(workInProgress);
  if (0 === (workInProgress.mode & 1))
    return retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
      null
    );
  if (shim())
    return (
      (suspenseState = shim().digest),
      (nextProps = Error(formatProdErrorMessage(419))),
      (nextProps.digest = suspenseState),
      (suspenseState = createCapturedValue(nextProps, suspenseState, void 0)),
      retrySuspenseComponentWithoutHydrating(
        current,
        workInProgress,
        renderLanes,
        suspenseState
      )
    );
  enableLazyContextPropagation &&
    !didReceiveUpdate &&
    propagateParentContextChanges(current, workInProgress, renderLanes, !1);
  didSuspend = 0 !== (renderLanes & current.childLanes);
  if (didReceiveUpdate || didSuspend) {
    nextProps = workInProgressRoot;
    if (null !== nextProps) {
      switch (renderLanes & -renderLanes) {
        case 4:
          didSuspend = 2;
          break;
        case 16:
          didSuspend = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          didSuspend = 32;
          break;
        case 536870912:
          didSuspend = 268435456;
          break;
        default:
          didSuspend = 0;
      }
      didSuspend =
        0 !== (didSuspend & (nextProps.suspendedLanes | renderLanes))
          ? 0
          : didSuspend;
      0 !== didSuspend &&
        didSuspend !== suspenseState.retryLane &&
        ((suspenseState.retryLane = didSuspend),
        enqueueConcurrentRenderForLane(current, didSuspend),
        scheduleUpdateOnFiber(nextProps, current, didSuspend, -1));
    }
    renderDidSuspendDelayIfPossible();
    return retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
      null
    );
  }
  if (shim())
    return (
      (workInProgress.flags |= 128),
      (workInProgress.child = current.child),
      retryDehydratedSuspenseBoundary.bind(null, current),
      shim(),
      null
    );
  current = mountSuspensePrimaryChildren(workInProgress, nextProps.children);
  current.flags |= 4096;
  return current;
}
function scheduleSuspenseWorkOnFiber(fiber, renderLanes, propagationRoot) {
  fiber.lanes |= renderLanes;
  var alternate = fiber.alternate;
  null !== alternate && (alternate.lanes |= renderLanes);
  scheduleContextWorkOnParentPath(fiber.return, renderLanes, propagationRoot);
}
function initSuspenseListRenderState(
  workInProgress,
  isBackwards,
  tail,
  lastContentRow,
  tailMode
) {
  var renderState = workInProgress.memoizedState;
  null === renderState
    ? (workInProgress.memoizedState = {
        isBackwards: isBackwards,
        rendering: null,
        renderingStartTime: 0,
        last: lastContentRow,
        tail: tail,
        tailMode: tailMode
      })
    : ((renderState.isBackwards = isBackwards),
      (renderState.rendering = null),
      (renderState.renderingStartTime = 0),
      (renderState.last = lastContentRow),
      (renderState.tail = tail),
      (renderState.tailMode = tailMode));
}
function updateSuspenseListComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    revealOrder = nextProps.revealOrder,
    tailMode = nextProps.tail;
  reconcileChildren(current, workInProgress, nextProps.children, renderLanes);
  nextProps = suspenseStackCursor.current;
  if (0 !== (nextProps & 2))
    (nextProps = (nextProps & 1) | 2), (workInProgress.flags |= 128);
  else {
    if (null !== current && 0 !== (current.flags & 128))
      a: for (current = workInProgress.child; null !== current; ) {
        if (13 === current.tag)
          null !== current.memoizedState &&
            scheduleSuspenseWorkOnFiber(current, renderLanes, workInProgress);
        else if (19 === current.tag)
          scheduleSuspenseWorkOnFiber(current, renderLanes, workInProgress);
        else if (null !== current.child) {
          current.child.return = current;
          current = current.child;
          continue;
        }
        if (current === workInProgress) break a;
        for (; null === current.sibling; ) {
          if (null === current.return || current.return === workInProgress)
            break a;
          current = current.return;
        }
        current.sibling.return = current.return;
        current = current.sibling;
      }
    nextProps &= 1;
  }
  push(suspenseStackCursor, nextProps);
  if (0 === (workInProgress.mode & 1)) workInProgress.memoizedState = null;
  else
    switch (revealOrder) {
      case "forwards":
        renderLanes = workInProgress.child;
        for (revealOrder = null; null !== renderLanes; )
          (current = renderLanes.alternate),
            null !== current &&
              null === findFirstSuspended(current) &&
              (revealOrder = renderLanes),
            (renderLanes = renderLanes.sibling);
        renderLanes = revealOrder;
        null === renderLanes
          ? ((revealOrder = workInProgress.child),
            (workInProgress.child = null))
          : ((revealOrder = renderLanes.sibling), (renderLanes.sibling = null));
        initSuspenseListRenderState(
          workInProgress,
          !1,
          revealOrder,
          renderLanes,
          tailMode
        );
        break;
      case "backwards":
        renderLanes = null;
        revealOrder = workInProgress.child;
        for (workInProgress.child = null; null !== revealOrder; ) {
          current = revealOrder.alternate;
          if (null !== current && null === findFirstSuspended(current)) {
            workInProgress.child = revealOrder;
            break;
          }
          current = revealOrder.sibling;
          revealOrder.sibling = renderLanes;
          renderLanes = revealOrder;
          revealOrder = current;
        }
        initSuspenseListRenderState(
          workInProgress,
          !0,
          renderLanes,
          null,
          tailMode
        );
        break;
      case "together":
        initSuspenseListRenderState(workInProgress, !1, null, null, void 0);
        break;
      default:
        workInProgress.memoizedState = null;
    }
  return workInProgress.child;
}
function resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress) {
  0 === (workInProgress.mode & 1) &&
    null !== current &&
    ((current.alternate = null),
    (workInProgress.alternate = null),
    (workInProgress.flags |= 2));
}
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
  null !== current && (workInProgress.dependencies = current.dependencies);
  workInProgressRootSkippedLanes |= workInProgress.lanes;
  if (0 === (renderLanes & workInProgress.childLanes))
    if (enableLazyContextPropagation && null !== current) {
      if (
        (propagateParentContextChanges(
          current,
          workInProgress,
          renderLanes,
          !1
        ),
        0 === (renderLanes & workInProgress.childLanes))
      )
        return null;
    } else return null;
  if (null !== current && workInProgress.child !== current.child)
    throw Error(formatProdErrorMessage(153));
  if (null !== workInProgress.child) {
    current = workInProgress.child;
    renderLanes = createWorkInProgress(current, current.pendingProps);
    workInProgress.child = renderLanes;
    for (renderLanes.return = workInProgress; null !== current.sibling; )
      (current = current.sibling),
        (renderLanes = renderLanes.sibling = createWorkInProgress(
          current,
          current.pendingProps
        )),
        (renderLanes.return = workInProgress);
    renderLanes.sibling = null;
  }
  return workInProgress.child;
}
function checkScheduledUpdateOrContext(current, renderLanes) {
  return 0 !== (current.lanes & renderLanes) ||
    (enableLazyContextPropagation &&
      ((current = current.dependencies),
      null !== current && checkIfContextChanged(current)))
    ? !0
    : !1;
}
function attemptEarlyBailoutIfNoScheduledUpdate(
  current,
  workInProgress,
  renderLanes
) {
  switch (workInProgress.tag) {
    case 3:
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      enableTransitionTracing &&
        push(transitionStack, workInProgressTransitions);
      enableTransitionTracing && pushRootMarkerInstance(workInProgress);
      pushProvider(workInProgress, CacheContext, current.memoizedState.cache);
      break;
    case 26:
    case 27:
    case 5:
      pushHostContext(workInProgress);
      break;
    case 4:
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      break;
    case 10:
      pushProvider(
        workInProgress,
        workInProgress.type._context,
        workInProgress.memoizedProps.value
      );
      break;
    case 13:
      var state = workInProgress.memoizedState;
      if (null !== state) {
        if (null !== state.dehydrated)
          return (
            pushPrimaryTreeSuspenseHandler(workInProgress),
            (workInProgress.flags |= 128),
            null
          );
        if (0 !== (renderLanes & workInProgress.child.childLanes))
          return updateSuspenseComponent(current, workInProgress, renderLanes);
        pushPrimaryTreeSuspenseHandler(workInProgress);
        current = bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes
        );
        return null !== current ? current.sibling : null;
      }
      pushPrimaryTreeSuspenseHandler(workInProgress);
      break;
    case 19:
      var didSuspendBefore = 0 !== (current.flags & 128);
      state = 0 !== (renderLanes & workInProgress.childLanes);
      enableLazyContextPropagation &&
        !state &&
        (propagateParentContextChanges(
          current,
          workInProgress,
          renderLanes,
          !1
        ),
        (state = 0 !== (renderLanes & workInProgress.childLanes)));
      if (didSuspendBefore) {
        if (state)
          return updateSuspenseListComponent(
            current,
            workInProgress,
            renderLanes
          );
        workInProgress.flags |= 128;
      }
      didSuspendBefore = workInProgress.memoizedState;
      null !== didSuspendBefore &&
        ((didSuspendBefore.rendering = null),
        (didSuspendBefore.tail = null),
        (didSuspendBefore.lastEffect = null));
      push(suspenseStackCursor, suspenseStackCursor.current);
      if (state) break;
      else return null;
    case 22:
    case 23:
      return (
        (workInProgress.lanes = 0),
        updateOffscreenComponent(current, workInProgress, renderLanes)
      );
    case 24:
      pushProvider(workInProgress, CacheContext, current.memoizedState.cache);
      break;
    case 25:
      enableTransitionTracing &&
        ((state = workInProgress.stateNode),
        null !== state && pushMarkerInstance(workInProgress, state));
  }
  return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
}
var valueCursor = createCursor(null),
  currentlyRenderingFiber$1 = null,
  lastContextDependency = null,
  lastFullyObservedContext = null;
function resetContextDependencies() {
  lastFullyObservedContext = lastContextDependency = currentlyRenderingFiber$1 = null;
}
function pushProvider(providerFiber, context, nextValue) {
  push(valueCursor, context._currentValue2);
  context._currentValue2 = nextValue;
}
function popProvider(context) {
  var currentValue = valueCursor.current;
  pop(valueCursor);
  context._currentValue2 =
    currentValue === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED
      ? context._defaultValue
      : currentValue;
}
function scheduleContextWorkOnParentPath(parent, renderLanes, propagationRoot) {
  for (; null !== parent; ) {
    var alternate = parent.alternate;
    (parent.childLanes & renderLanes) !== renderLanes
      ? ((parent.childLanes |= renderLanes),
        null !== alternate && (alternate.childLanes |= renderLanes))
      : null !== alternate &&
        (alternate.childLanes & renderLanes) !== renderLanes &&
        (alternate.childLanes |= renderLanes);
    if (parent === propagationRoot) break;
    parent = parent.return;
  }
}
function propagateContextChange(workInProgress, context, renderLanes) {
  if (enableLazyContextPropagation)
    propagateContextChanges(workInProgress, [context], renderLanes, !0);
  else if (!enableLazyContextPropagation) {
    var fiber = workInProgress.child;
    null !== fiber && (fiber.return = workInProgress);
    for (; null !== fiber; ) {
      var list = fiber.dependencies;
      if (null !== list) {
        var nextFiber = fiber.child;
        for (var dependency = list.firstContext; null !== dependency; ) {
          if (dependency.context === context) {
            if (1 === fiber.tag) {
              dependency = createUpdate(-1, renderLanes & -renderLanes);
              dependency.tag = 2;
              var updateQueue = fiber.updateQueue;
              if (null !== updateQueue) {
                updateQueue = updateQueue.shared;
                var pending = updateQueue.pending;
                null === pending
                  ? (dependency.next = dependency)
                  : ((dependency.next = pending.next),
                    (pending.next = dependency));
                updateQueue.pending = dependency;
              }
            }
            fiber.lanes |= renderLanes;
            dependency = fiber.alternate;
            null !== dependency && (dependency.lanes |= renderLanes);
            scheduleContextWorkOnParentPath(
              fiber.return,
              renderLanes,
              workInProgress
            );
            list.lanes |= renderLanes;
            break;
          }
          dependency = dependency.next;
        }
      } else if (10 === fiber.tag)
        nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
      else if (18 === fiber.tag) {
        nextFiber = fiber.return;
        if (null === nextFiber) throw Error(formatProdErrorMessage(341));
        nextFiber.lanes |= renderLanes;
        list = nextFiber.alternate;
        null !== list && (list.lanes |= renderLanes);
        scheduleContextWorkOnParentPath(nextFiber, renderLanes, workInProgress);
        nextFiber = fiber.sibling;
      } else nextFiber = fiber.child;
      if (null !== nextFiber) nextFiber.return = fiber;
      else
        for (nextFiber = fiber; null !== nextFiber; ) {
          if (nextFiber === workInProgress) {
            nextFiber = null;
            break;
          }
          fiber = nextFiber.sibling;
          if (null !== fiber) {
            fiber.return = nextFiber.return;
            nextFiber = fiber;
            break;
          }
          nextFiber = nextFiber.return;
        }
      fiber = nextFiber;
    }
  }
}
function propagateContextChanges(
  workInProgress,
  contexts,
  renderLanes,
  forcePropagateEntireTree
) {
  if (enableLazyContextPropagation) {
    var fiber = workInProgress.child;
    null !== fiber && (fiber.return = workInProgress);
    for (; null !== fiber; ) {
      var list = fiber.dependencies;
      if (null !== list) {
        var nextFiber = fiber.child;
        list = list.firstContext;
        a: for (; null !== list; ) {
          var dependency = list;
          list = fiber;
          for (var i = 0; i < contexts.length; i++)
            if (dependency.context === contexts[i]) {
              list.lanes |= renderLanes;
              dependency = list.alternate;
              null !== dependency && (dependency.lanes |= renderLanes);
              scheduleContextWorkOnParentPath(
                list.return,
                renderLanes,
                workInProgress
              );
              forcePropagateEntireTree || (nextFiber = null);
              break a;
            }
          list = dependency.next;
        }
      } else if (18 === fiber.tag) {
        nextFiber = fiber.return;
        if (null === nextFiber) throw Error(formatProdErrorMessage(341));
        nextFiber.lanes |= renderLanes;
        list = nextFiber.alternate;
        null !== list && (list.lanes |= renderLanes);
        scheduleContextWorkOnParentPath(nextFiber, renderLanes, workInProgress);
        nextFiber = null;
      } else nextFiber = fiber.child;
      if (null !== nextFiber) nextFiber.return = fiber;
      else
        for (nextFiber = fiber; null !== nextFiber; ) {
          if (nextFiber === workInProgress) {
            nextFiber = null;
            break;
          }
          fiber = nextFiber.sibling;
          if (null !== fiber) {
            fiber.return = nextFiber.return;
            nextFiber = fiber;
            break;
          }
          nextFiber = nextFiber.return;
        }
      fiber = nextFiber;
    }
  }
}
function propagateParentContextChanges(
  current,
  workInProgress,
  renderLanes,
  forcePropagateEntireTree
) {
  if (enableLazyContextPropagation) {
    current = null;
    for (
      var parent = workInProgress, isInsidePropagationBailout = !1;
      null !== parent;

    ) {
      if (!isInsidePropagationBailout)
        if (0 !== (parent.flags & 524288)) isInsidePropagationBailout = !0;
        else if (0 !== (parent.flags & 262144)) break;
      if (10 === parent.tag) {
        var currentParent = parent.alternate;
        if (null === currentParent) throw Error(formatProdErrorMessage(387));
        currentParent = currentParent.memoizedProps;
        if (null !== currentParent) {
          var context = parent.type._context;
          objectIs(parent.pendingProps.value, currentParent.value) ||
            (null !== current ? current.push(context) : (current = [context]));
        }
      }
      parent = parent.return;
    }
    null !== current &&
      propagateContextChanges(
        workInProgress,
        current,
        renderLanes,
        forcePropagateEntireTree
      );
    workInProgress.flags |= 262144;
  }
}
function checkIfContextChanged(currentDependencies) {
  if (!enableLazyContextPropagation) return !1;
  for (
    currentDependencies = currentDependencies.firstContext;
    null !== currentDependencies;

  ) {
    if (
      !objectIs(
        currentDependencies.context._currentValue2,
        currentDependencies.memoizedValue
      )
    )
      return !0;
    currentDependencies = currentDependencies.next;
  }
  return !1;
}
function prepareToReadContext(workInProgress, renderLanes) {
  currentlyRenderingFiber$1 = workInProgress;
  lastFullyObservedContext = lastContextDependency = null;
  workInProgress = workInProgress.dependencies;
  null !== workInProgress &&
    (enableLazyContextPropagation
      ? (workInProgress.firstContext = null)
      : null !== workInProgress.firstContext &&
        (0 !== (workInProgress.lanes & renderLanes) && (didReceiveUpdate = !0),
        (workInProgress.firstContext = null)));
}
function readContext(context) {
  var value = context._currentValue2;
  if (lastFullyObservedContext !== context)
    if (
      ((context = { context: context, memoizedValue: value, next: null }),
      null === lastContextDependency)
    ) {
      if (null === currentlyRenderingFiber$1)
        throw Error(formatProdErrorMessage(308));
      lastContextDependency = context;
      currentlyRenderingFiber$1.dependencies = {
        lanes: 0,
        firstContext: context
      };
      enableLazyContextPropagation &&
        (currentlyRenderingFiber$1.flags |= 524288);
    } else lastContextDependency = lastContextDependency.next = context;
  return value;
}
var AbortControllerLocal =
    "undefined" !== typeof AbortController
      ? AbortController
      : function() {
          var listeners = [],
            signal = (this.signal = {
              aborted: !1,
              addEventListener: function(type, listener) {
                listeners.push(listener);
              }
            });
          this.abort = function() {
            signal.aborted = !0;
            listeners.forEach(function(listener) {
              return listener();
            });
          };
        },
  scheduleCallback$1 = Scheduler.unstable_scheduleCallback,
  NormalPriority$1 = Scheduler.unstable_NormalPriority,
  CacheContext = {
    $$typeof: REACT_CONTEXT_TYPE,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0,
    _defaultValue: null,
    _globalName: null
  };
function createCache() {
  return {
    controller: new AbortControllerLocal(),
    data: new Map(),
    refCount: 0
  };
}
function releaseCache(cache) {
  cache.refCount--;
  0 === cache.refCount &&
    scheduleCallback$1(NormalPriority$1, function() {
      cache.controller.abort();
    });
}
var ReactCurrentBatchConfig$1 = ReactSharedInternals.ReactCurrentBatchConfig,
  resumedCache = createCursor(null),
  transitionStack = createCursor(null);
function peekCacheFromPool() {
  var cacheResumedFromPreviousRender = resumedCache.current;
  return null !== cacheResumedFromPreviousRender
    ? cacheResumedFromPreviousRender
    : workInProgressRoot.pooledCache;
}
function pushTransition(
  offscreenWorkInProgress,
  prevCachePool,
  newTransitions
) {
  null === prevCachePool
    ? push(resumedCache, resumedCache.current)
    : push(resumedCache, prevCachePool.pool);
  enableTransitionTracing &&
    (null === transitionStack.current
      ? push(transitionStack, newTransitions)
      : null === newTransitions
      ? push(transitionStack, transitionStack.current)
      : push(transitionStack, transitionStack.current.concat(newTransitions)));
}
function popTransition(workInProgress, current) {
  null !== current &&
    (enableTransitionTracing && pop(transitionStack), pop(resumedCache));
}
function getSuspendedCache() {
  var cacheFromPool = peekCacheFromPool();
  return null === cacheFromPool
    ? null
    : { parent: CacheContext._currentValue2, pool: cacheFromPool };
}
var emptyObject = {};
function collectScopedNodesFromChildren(
  startingChild,
  fn$jscomp$0,
  scopedNodes$jscomp$0
) {
  for (; null !== startingChild; ) {
    var node = startingChild,
      fn = fn$jscomp$0,
      scopedNodes = scopedNodes$jscomp$0;
    if (5 === node.tag) {
      var type = node.type,
        memoizedProps = node.memoizedProps,
        instance = node.stateNode;
      null !== instance &&
        !0 === fn(type, memoizedProps || emptyObject, instance) &&
        scopedNodes.push(instance);
    }
    type = node.child;
    isFiberSuspenseAndTimedOut(node) && (type = node.child.sibling.child);
    null !== type && collectScopedNodesFromChildren(type, fn, scopedNodes);
    startingChild = startingChild.sibling;
  }
}
function collectFirstScopedNodeFromChildren(startingChild, fn$jscomp$0) {
  for (; null !== startingChild; ) {
    a: {
      var JSCompiler_inline_result = startingChild;
      var fn = fn$jscomp$0;
      if (5 === JSCompiler_inline_result.tag) {
        var type = JSCompiler_inline_result.type,
          memoizedProps = JSCompiler_inline_result.memoizedProps,
          instance = JSCompiler_inline_result.stateNode;
        if (null !== instance && !0 === fn(type, memoizedProps, instance)) {
          JSCompiler_inline_result = instance;
          break a;
        }
      }
      type = JSCompiler_inline_result.child;
      isFiberSuspenseAndTimedOut(JSCompiler_inline_result) &&
        (type = JSCompiler_inline_result.child.sibling.child);
      JSCompiler_inline_result =
        null !== type ? collectFirstScopedNodeFromChildren(type, fn) : null;
    }
    if (null !== JSCompiler_inline_result) return JSCompiler_inline_result;
    startingChild = startingChild.sibling;
  }
  return null;
}
function collectNearestChildContextValues(
  startingChild,
  context$jscomp$0,
  childContextValues$jscomp$0
) {
  for (; null !== startingChild; ) {
    var node = startingChild,
      context = context$jscomp$0,
      childContextValues = childContextValues$jscomp$0;
    if (10 === node.tag && node.type._context === context)
      childContextValues.push(node.memoizedProps.value);
    else {
      var child = node.child;
      isFiberSuspenseAndTimedOut(node) && (child = node.child.sibling.child);
      null !== child &&
        collectNearestChildContextValues(child, context, childContextValues);
    }
    startingChild = startingChild.sibling;
  }
}
function DO_NOT_USE_queryAllNodes(fn) {
  var currentFiber = shim$1();
  if (null === currentFiber) return null;
  currentFiber = currentFiber.child;
  var scopedNodes = [];
  null !== currentFiber &&
    collectScopedNodesFromChildren(currentFiber, fn, scopedNodes);
  return 0 === scopedNodes.length ? null : scopedNodes;
}
function DO_NOT_USE_queryFirstNode(fn) {
  var currentFiber = shim$1();
  if (null === currentFiber) return null;
  currentFiber = currentFiber.child;
  return null !== currentFiber
    ? collectFirstScopedNodeFromChildren(currentFiber, fn)
    : null;
}
function containsNode() {
  throw Error(formatProdErrorMessage(248));
}
function getChildContextValues(context) {
  var currentFiber = shim$1();
  if (null === currentFiber) return [];
  currentFiber = currentFiber.child;
  var childContextValues = [];
  null !== currentFiber &&
    collectNearestChildContextValues(currentFiber, context, childContextValues);
  return childContextValues;
}
var appendAllChildren,
  updateHostContainer,
  updateHostComponent$1,
  updateHostText$1;
appendAllChildren = function(parent, workInProgress) {
  for (var node = workInProgress.child; null !== node; ) {
    if (5 === node.tag || 6 === node.tag) {
      var parentInstance = parent,
        child = node.stateNode;
      if ("string" === typeof child) throw Error(formatProdErrorMessage(216));
      child.inject(parentInstance);
    } else if (4 !== node.tag && null !== node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === workInProgress) return;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
};
updateHostContainer = function() {};
updateHostComponent$1 = function(current, workInProgress, type, newProps) {
  current.memoizedProps !== newProps &&
    (workInProgress.updateQueue = UPDATE_SIGNAL) &&
    (workInProgress.flags |= 4);
};
updateHostText$1 = function(current, workInProgress, oldText, newText) {
  oldText !== newText && (workInProgress.flags |= 4);
};
function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
  switch (renderState.tailMode) {
    case "hidden":
      hasRenderedATailFallback = renderState.tail;
      for (var lastTailNode = null; null !== hasRenderedATailFallback; )
        null !== hasRenderedATailFallback.alternate &&
          (lastTailNode = hasRenderedATailFallback),
          (hasRenderedATailFallback = hasRenderedATailFallback.sibling);
      null === lastTailNode
        ? (renderState.tail = null)
        : (lastTailNode.sibling = null);
      break;
    case "collapsed":
      lastTailNode = renderState.tail;
      for (var lastTailNode$73 = null; null !== lastTailNode; )
        null !== lastTailNode.alternate && (lastTailNode$73 = lastTailNode),
          (lastTailNode = lastTailNode.sibling);
      null === lastTailNode$73
        ? hasRenderedATailFallback || null === renderState.tail
          ? (renderState.tail = null)
          : (renderState.tail.sibling = null)
        : (lastTailNode$73.sibling = null);
  }
}
function bubbleProperties(completedWork) {
  var didBailout =
      null !== completedWork.alternate &&
      completedWork.alternate.child === completedWork.child,
    newChildLanes = 0,
    subtreeFlags = 0;
  if (didBailout)
    for (var child$74 = completedWork.child; null !== child$74; )
      (newChildLanes |= child$74.lanes | child$74.childLanes),
        (subtreeFlags |= child$74.subtreeFlags & 14680064),
        (subtreeFlags |= child$74.flags & 14680064),
        (child$74.return = completedWork),
        (child$74 = child$74.sibling);
  else
    for (child$74 = completedWork.child; null !== child$74; )
      (newChildLanes |= child$74.lanes | child$74.childLanes),
        (subtreeFlags |= child$74.subtreeFlags),
        (subtreeFlags |= child$74.flags),
        (child$74.return = completedWork),
        (child$74 = child$74.sibling);
  completedWork.subtreeFlags |= subtreeFlags;
  completedWork.childLanes = newChildLanes;
  return didBailout;
}
function completeWork(current, workInProgress, renderLanes) {
  var newProps = workInProgress.pendingProps;
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return bubbleProperties(workInProgress), null;
    case 1:
      return bubbleProperties(workInProgress), null;
    case 3:
      return (
        (renderLanes = workInProgress.stateNode),
        enableTransitionTracing &&
          null !== workInProgressTransitions &&
          (workInProgress.flags |= 2048),
        (newProps = null),
        null !== current && (newProps = current.memoizedState.cache),
        workInProgress.memoizedState.cache !== newProps &&
          (workInProgress.flags |= 2048),
        popProvider(CacheContext),
        enableTransitionTracing &&
          enableTransitionTracing &&
          pop(markerInstanceStack),
        enableTransitionTracing && pop(transitionStack),
        popHostContainer(),
        resetWorkInProgressVersions(),
        renderLanes.pendingContext &&
          ((renderLanes.context = renderLanes.pendingContext),
          (renderLanes.pendingContext = null)),
        (null !== current && null !== current.child) ||
          null === current ||
          (current.memoizedState.isDehydrated &&
            0 === (workInProgress.flags & 256)) ||
          ((workInProgress.flags |= 1024),
          null !== hydrationErrors &&
            (queueRecoverableErrors(hydrationErrors),
            (hydrationErrors = null))),
        updateHostContainer(current, workInProgress),
        bubbleProperties(workInProgress),
        enableTransitionTracing &&
          0 !== (workInProgress.subtreeFlags & 8192) &&
          (workInProgress.flags |= 2048),
        null
      );
    case 26:
    case 27:
    case 5:
      popHostContext(workInProgress);
      renderLanes = workInProgress.type;
      if (null !== current && null != workInProgress.stateNode)
        updateHostComponent$1(current, workInProgress, renderLanes, newProps),
          current.ref !== workInProgress.ref &&
            (workInProgress.flags |= 2097664);
      else {
        if (!newProps) {
          if (null === workInProgress.stateNode)
            throw Error(formatProdErrorMessage(166));
          bubbleProperties(workInProgress);
          return null;
        }
        switch (renderLanes) {
          case TYPES.CLIPPING_RECTANGLE:
            var instance = Mode$1.ClippingRectangle();
            instance._applyProps = applyClippingRectangleProps;
            break;
          case TYPES.GROUP:
            instance = Mode$1.Group();
            instance._applyProps = applyGroupProps;
            break;
          case TYPES.SHAPE:
            instance = Mode$1.Shape();
            instance._applyProps = applyShapeProps;
            break;
          case TYPES.TEXT:
            (instance = Mode$1.Text(
              newProps.children,
              newProps.font,
              newProps.alignment,
              newProps.path
            )),
              (instance._applyProps = applyTextProps);
        }
        if (!instance) throw Error(formatProdErrorMessage(217, renderLanes));
        instance._applyProps(instance, newProps);
        current = instance;
        appendAllChildren(current, workInProgress, !1, !1);
        workInProgress.stateNode = current;
        null !== workInProgress.ref && (workInProgress.flags |= 2097664);
      }
      bubbleProperties(workInProgress);
      return null;
    case 6:
      if (current && null != workInProgress.stateNode)
        updateHostText$1(
          current,
          workInProgress,
          current.memoizedProps,
          newProps
        );
      else {
        if ("string" !== typeof newProps && null === workInProgress.stateNode)
          throw Error(formatProdErrorMessage(166));
        workInProgress.stateNode = newProps;
      }
      bubbleProperties(workInProgress);
      return null;
    case 13:
      pop(suspenseHandlerStackCursor);
      instance = workInProgress.memoizedState;
      if (
        null === current ||
        (null !== current.memoizedState &&
          null !== current.memoizedState.dehydrated)
      ) {
        if (null !== instance && null !== instance.dehydrated) {
          if (null === current) {
            throw Error(formatProdErrorMessage(318));
            throw Error(formatProdErrorMessage(344));
          }
          0 === (workInProgress.flags & 128) &&
            (workInProgress.memoizedState = null);
          workInProgress.flags |= 4;
          bubbleProperties(workInProgress);
          var JSCompiler_inline_result = !1;
        } else
          null !== hydrationErrors &&
            (queueRecoverableErrors(hydrationErrors), (hydrationErrors = null)),
            (JSCompiler_inline_result = !0);
        if (!JSCompiler_inline_result)
          return workInProgress.flags & 65536 ? workInProgress : null;
      }
      if (0 !== (workInProgress.flags & 128))
        return (workInProgress.lanes = renderLanes), workInProgress;
      renderLanes = null !== instance;
      instance = null !== current && null !== current.memoizedState;
      if (renderLanes) {
        JSCompiler_inline_result = workInProgress.child;
        var previousCache$77 = null;
        null !== JSCompiler_inline_result.alternate &&
          null !== JSCompiler_inline_result.alternate.memoizedState &&
          null !== JSCompiler_inline_result.alternate.memoizedState.cachePool &&
          (previousCache$77 =
            JSCompiler_inline_result.alternate.memoizedState.cachePool.pool);
        var cache$78 = null;
        null !== JSCompiler_inline_result.memoizedState &&
          null !== JSCompiler_inline_result.memoizedState.cachePool &&
          (cache$78 = JSCompiler_inline_result.memoizedState.cachePool.pool);
        cache$78 !== previousCache$77 &&
          (JSCompiler_inline_result.flags |= 2048);
      }
      renderLanes !== instance &&
        (enableTransitionTracing && (workInProgress.child.flags |= 2048),
        renderLanes &&
          ((workInProgress.child.flags |= 8192),
          0 !== (workInProgress.mode & 1) &&
            (isBadSuspenseFallback(current, newProps)
              ? renderDidSuspendDelayIfPossible()
              : 0 === workInProgressRootExitStatus &&
                (workInProgressRootExitStatus = 3))));
      null !== workInProgress.updateQueue && (workInProgress.flags |= 4);
      null !== workInProgress.updateQueue &&
        null != workInProgress.memoizedProps.suspenseCallback &&
        (workInProgress.flags |= 4);
      bubbleProperties(workInProgress);
      return null;
    case 4:
      return (
        popHostContainer(),
        updateHostContainer(current, workInProgress),
        bubbleProperties(workInProgress),
        null
      );
    case 10:
      return (
        popProvider(workInProgress.type._context),
        bubbleProperties(workInProgress),
        null
      );
    case 17:
      return bubbleProperties(workInProgress), null;
    case 19:
      pop(suspenseStackCursor);
      instance = workInProgress.memoizedState;
      if (null === instance) return bubbleProperties(workInProgress), null;
      newProps = 0 !== (workInProgress.flags & 128);
      JSCompiler_inline_result = instance.rendering;
      if (null === JSCompiler_inline_result)
        if (newProps) cutOffTailIfNeeded(instance, !1);
        else {
          if (
            0 !== workInProgressRootExitStatus ||
            (null !== current && 0 !== (current.flags & 128))
          )
            for (current = workInProgress.child; null !== current; ) {
              JSCompiler_inline_result = findFirstSuspended(current);
              if (null !== JSCompiler_inline_result) {
                workInProgress.flags |= 128;
                cutOffTailIfNeeded(instance, !1);
                current = JSCompiler_inline_result.updateQueue;
                null !== current &&
                  ((workInProgress.updateQueue = current),
                  (workInProgress.flags |= 4));
                workInProgress.subtreeFlags = 0;
                current = renderLanes;
                for (renderLanes = workInProgress.child; null !== renderLanes; )
                  resetWorkInProgress(renderLanes, current),
                    (renderLanes = renderLanes.sibling);
                push(
                  suspenseStackCursor,
                  (suspenseStackCursor.current & 1) | 2
                );
                return workInProgress.child;
              }
              current = current.sibling;
            }
          null !== instance.tail &&
            now() > workInProgressRootRenderTargetTime &&
            ((workInProgress.flags |= 128),
            (newProps = !0),
            cutOffTailIfNeeded(instance, !1),
            (workInProgress.lanes = 4194304));
        }
      else {
        if (!newProps)
          if (
            ((current = findFirstSuspended(JSCompiler_inline_result)),
            null !== current)
          ) {
            if (
              ((workInProgress.flags |= 128),
              (newProps = !0),
              (current = current.updateQueue),
              null !== current &&
                ((workInProgress.updateQueue = current),
                (workInProgress.flags |= 4)),
              cutOffTailIfNeeded(instance, !0),
              null === instance.tail &&
                "hidden" === instance.tailMode &&
                !JSCompiler_inline_result.alternate)
            )
              return bubbleProperties(workInProgress), null;
          } else
            2 * now() - instance.renderingStartTime >
              workInProgressRootRenderTargetTime &&
              1073741824 !== renderLanes &&
              ((workInProgress.flags |= 128),
              (newProps = !0),
              cutOffTailIfNeeded(instance, !1),
              (workInProgress.lanes = 4194304));
        instance.isBackwards
          ? ((JSCompiler_inline_result.sibling = workInProgress.child),
            (workInProgress.child = JSCompiler_inline_result))
          : ((current = instance.last),
            null !== current
              ? (current.sibling = JSCompiler_inline_result)
              : (workInProgress.child = JSCompiler_inline_result),
            (instance.last = JSCompiler_inline_result));
      }
      if (null !== instance.tail)
        return (
          (workInProgress = instance.tail),
          (instance.rendering = workInProgress),
          (instance.tail = workInProgress.sibling),
          (instance.renderingStartTime = now()),
          (workInProgress.sibling = null),
          (current = suspenseStackCursor.current),
          push(suspenseStackCursor, newProps ? (current & 1) | 2 : current & 1),
          workInProgress
        );
      bubbleProperties(workInProgress);
      return null;
    case 21:
      return (
        null === current
          ? ((workInProgress.stateNode = {
              DO_NOT_USE_queryAllNodes: DO_NOT_USE_queryAllNodes,
              DO_NOT_USE_queryFirstNode: DO_NOT_USE_queryFirstNode,
              containsNode: containsNode,
              getChildContextValues: getChildContextValues
            }),
            shim$1(),
            null !== workInProgress.ref &&
              ((workInProgress.flags |= 2097664), (workInProgress.flags |= 4)))
          : (null !== workInProgress.ref && (workInProgress.flags |= 4),
            current.ref !== workInProgress.ref &&
              (workInProgress.flags |= 2097664)),
        bubbleProperties(workInProgress),
        null
      );
    case 22:
    case 23:
      return (
        pop(suspenseHandlerStackCursor),
        popHiddenContext(),
        (newProps = null !== workInProgress.memoizedState),
        23 !== workInProgress.tag &&
          (null !== current
            ? (null !== current.memoizedState) !== newProps &&
              (workInProgress.flags |= 8192)
            : newProps && (workInProgress.flags |= 8192)),
        newProps && 0 !== (workInProgress.mode & 1)
          ? 0 !== (renderLanes & 1073741824) &&
            0 === (workInProgress.flags & 128) &&
            (bubbleProperties(workInProgress),
            23 !== workInProgress.tag &&
              workInProgress.subtreeFlags & 6 &&
              (workInProgress.flags |= 8192))
          : bubbleProperties(workInProgress),
        null !== workInProgress.updateQueue && (workInProgress.flags |= 4),
        (renderLanes = null),
        null !== current &&
          null !== current.memoizedState &&
          null !== current.memoizedState.cachePool &&
          (renderLanes = current.memoizedState.cachePool.pool),
        (newProps = null),
        null !== workInProgress.memoizedState &&
          null !== workInProgress.memoizedState.cachePool &&
          (newProps = workInProgress.memoizedState.cachePool.pool),
        newProps !== renderLanes && (workInProgress.flags |= 2048),
        popTransition(workInProgress, current),
        null
      );
    case 24:
      return (
        (renderLanes = null),
        null !== current && (renderLanes = current.memoizedState.cache),
        workInProgress.memoizedState.cache !== renderLanes &&
          (workInProgress.flags |= 2048),
        popProvider(CacheContext),
        bubbleProperties(workInProgress),
        null
      );
    case 25:
      return (
        enableTransitionTracing &&
          (null !== workInProgress.stateNode &&
            enableTransitionTracing &&
            pop(markerInstanceStack),
          bubbleProperties(workInProgress)),
        null
      );
  }
  throw Error(formatProdErrorMessage(156, workInProgress.tag));
}
function unwindWork(current, workInProgress) {
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case 1:
      return (
        (current = workInProgress.flags),
        current & 65536
          ? ((workInProgress.flags = (current & -65537) | 128), workInProgress)
          : null
      );
    case 3:
      return (
        popProvider(CacheContext),
        enableTransitionTracing &&
          enableTransitionTracing &&
          pop(markerInstanceStack),
        enableTransitionTracing && pop(transitionStack),
        popHostContainer(),
        resetWorkInProgressVersions(),
        (current = workInProgress.flags),
        0 !== (current & 65536) && 0 === (current & 128)
          ? ((workInProgress.flags = (current & -65537) | 128), workInProgress)
          : null
      );
    case 26:
    case 27:
    case 5:
      return popHostContext(workInProgress), null;
    case 13:
      pop(suspenseHandlerStackCursor);
      current = workInProgress.memoizedState;
      if (
        null !== current &&
        null !== current.dehydrated &&
        null === workInProgress.alternate
      )
        throw Error(formatProdErrorMessage(340));
      current = workInProgress.flags;
      return current & 65536
        ? ((workInProgress.flags = (current & -65537) | 128), workInProgress)
        : null;
    case 19:
      return pop(suspenseStackCursor), null;
    case 4:
      return popHostContainer(), null;
    case 10:
      return popProvider(workInProgress.type._context), null;
    case 22:
    case 23:
      return (
        pop(suspenseHandlerStackCursor),
        popHiddenContext(),
        popTransition(workInProgress, current),
        (current = workInProgress.flags),
        current & 65536
          ? ((workInProgress.flags = (current & -65537) | 128), workInProgress)
          : null
      );
    case 24:
      return popProvider(CacheContext), null;
    case 25:
      return (
        enableTransitionTracing &&
          null !== workInProgress.stateNode &&
          enableTransitionTracing &&
          pop(markerInstanceStack),
        null
      );
    default:
      return null;
  }
}
function unwindInterruptedWork(current, interruptedWork) {
  popTreeContext(interruptedWork);
  switch (interruptedWork.tag) {
    case 3:
      popProvider(CacheContext);
      enableTransitionTracing &&
        enableTransitionTracing &&
        pop(markerInstanceStack);
      enableTransitionTracing && pop(transitionStack);
      popHostContainer();
      resetWorkInProgressVersions();
      break;
    case 26:
    case 27:
    case 5:
      popHostContext(interruptedWork);
      break;
    case 4:
      popHostContainer();
      break;
    case 13:
      pop(suspenseHandlerStackCursor);
      break;
    case 19:
      pop(suspenseStackCursor);
      break;
    case 10:
      popProvider(interruptedWork.type._context);
      break;
    case 22:
    case 23:
      pop(suspenseHandlerStackCursor);
      popHiddenContext();
      popTransition(interruptedWork, current);
      break;
    case 24:
      popProvider(CacheContext);
      break;
    case 25:
      enableTransitionTracing &&
        null !== interruptedWork.stateNode &&
        enableTransitionTracing &&
        pop(markerInstanceStack);
  }
}
if ("function" !== typeof require("ReactFbErrorUtils").invokeGuardedCallback)
  throw Error(formatProdErrorMessage(255));
var offscreenSubtreeIsHidden = !1,
  offscreenSubtreeWasHidden = !1,
  PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set,
  nextEffect = null;
function safelyAttachRef(current, nearestMountedAncestor) {
  try {
    var ref = current.ref;
    if (null !== ref) {
      var instance = current.stateNode;
      switch (current.tag) {
        case 26:
        case 27:
        case 5:
          var instanceToUse = instance;
          break;
        default:
          instanceToUse = instance;
      }
      21 === current.tag && (instanceToUse = instance);
      "function" === typeof ref
        ? (current.refCleanup = ref(instanceToUse))
        : (ref.current = instanceToUse);
    }
  } catch (error) {
    captureCommitPhaseError(current, nearestMountedAncestor, error);
  }
}
function safelyDetachRef(current, nearestMountedAncestor) {
  var ref = current.ref,
    refCleanup = current.refCleanup;
  if (null !== ref)
    if ("function" === typeof refCleanup)
      try {
        refCleanup();
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      } finally {
        (current.refCleanup = null),
          (current = current.alternate),
          null != current && (current.refCleanup = null);
      }
    else if ("function" === typeof ref)
      try {
        ref(null);
      } catch (error$96) {
        captureCommitPhaseError(current, nearestMountedAncestor, error$96);
      }
    else ref.current = null;
}
function safelyCallDestroy(current, nearestMountedAncestor, destroy) {
  try {
    destroy();
  } catch (error) {
    captureCommitPhaseError(current, nearestMountedAncestor, error);
  }
}
var focusedInstanceHandle = null,
  shouldFireAfterActiveInstanceBlur = !1;
function commitBeforeMutationEffects(root, firstChild) {
  focusedInstanceHandle = null;
  for (nextEffect = firstChild; null !== nextEffect; ) {
    root = nextEffect;
    firstChild = root.deletions;
    if (null !== firstChild)
      for (var i = 0; i < firstChild.length; i++)
        doesFiberContain(firstChild[i], focusedInstanceHandle) &&
          (shouldFireAfterActiveInstanceBlur = !0);
    firstChild = root.child;
    if (0 !== (root.subtreeFlags & 9236) && null !== firstChild)
      (firstChild.return = root), (nextEffect = firstChild);
    else
      for (; null !== nextEffect; ) {
        root = nextEffect;
        try {
          var current = root.alternate,
            flags = root.flags;
          if (
            !shouldFireAfterActiveInstanceBlur &&
            null !== focusedInstanceHandle
          ) {
            var JSCompiler_temp;
            if ((JSCompiler_temp = 13 === root.tag))
              a: {
                if (null !== current) {
                  var oldState = current.memoizedState;
                  if (null === oldState || null !== oldState.dehydrated) {
                    var newState = root.memoizedState;
                    JSCompiler_temp =
                      null !== newState && null === newState.dehydrated;
                    break a;
                  }
                }
                JSCompiler_temp = !1;
              }
            JSCompiler_temp &&
              doesFiberContain(root, focusedInstanceHandle) &&
              (shouldFireAfterActiveInstanceBlur = !0);
          }
          switch (root.tag) {
            case 0:
              if (0 !== (flags & 4)) {
                var updateQueue = root.updateQueue,
                  eventPayloads =
                    null !== updateQueue ? updateQueue.events : null;
                if (null !== eventPayloads)
                  for (
                    firstChild = 0;
                    firstChild < eventPayloads.length;
                    firstChild++
                  ) {
                    var _eventPayloads$ii = eventPayloads[firstChild];
                    _eventPayloads$ii.ref.impl = _eventPayloads$ii.nextImpl;
                  }
              }
              break;
            case 11:
            case 15:
              break;
            case 1:
              if (0 !== (flags & 1024) && null !== current) {
                var prevProps = current.memoizedProps,
                  prevState = current.memoizedState,
                  instance = root.stateNode,
                  snapshot = instance.getSnapshotBeforeUpdate(
                    root.elementType === root.type
                      ? prevProps
                      : resolveDefaultProps(root.type, prevProps),
                    prevState
                  );
                instance.__reactInternalSnapshotBeforeUpdate = snapshot;
              }
              break;
            case 3:
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if (0 !== (flags & 1024))
                throw Error(formatProdErrorMessage(163));
          }
        } catch (error) {
          captureCommitPhaseError(root, root.return, error);
        }
        firstChild = root.sibling;
        if (null !== firstChild) {
          firstChild.return = root.return;
          nextEffect = firstChild;
          break;
        }
        nextEffect = root.return;
      }
  }
  current = shouldFireAfterActiveInstanceBlur;
  shouldFireAfterActiveInstanceBlur = !1;
  focusedInstanceHandle = null;
  return current;
}
function commitHookEffectListUnmount(
  flags,
  finishedWork,
  nearestMountedAncestor
) {
  var updateQueue = finishedWork.updateQueue;
  updateQueue = null !== updateQueue ? updateQueue.lastEffect : null;
  if (null !== updateQueue) {
    var effect = (updateQueue = updateQueue.next);
    do {
      if ((effect.tag & flags) === flags) {
        var destroy = effect.destroy;
        effect.destroy = void 0;
        void 0 !== destroy &&
          safelyCallDestroy(finishedWork, nearestMountedAncestor, destroy);
      }
      effect = effect.next;
    } while (effect !== updateQueue);
  }
}
function commitHookEffectListMount(flags, finishedWork) {
  finishedWork = finishedWork.updateQueue;
  finishedWork = null !== finishedWork ? finishedWork.lastEffect : null;
  if (null !== finishedWork) {
    var effect = (finishedWork = finishedWork.next);
    do {
      if ((effect.tag & flags) === flags) {
        var create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== finishedWork);
  }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
  try {
    commitHookEffectListMount(hookFlags, finishedWork);
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitClassCallbacks(finishedWork) {
  var updateQueue = finishedWork.updateQueue;
  if (null !== updateQueue) {
    var instance = finishedWork.stateNode;
    try {
      commitCallbacks(updateQueue, instance);
    } catch (error) {
      captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
  }
}
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  var flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      flags & 4 && commitHookLayoutEffects(finishedWork, 5);
      break;
    case 1:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & 4)
        if (((finishedRoot = finishedWork.stateNode), null === current))
          try {
            finishedRoot.componentDidMount();
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        else {
          var prevProps =
            finishedWork.elementType === finishedWork.type
              ? current.memoizedProps
              : resolveDefaultProps(finishedWork.type, current.memoizedProps);
          current = current.memoizedState;
          try {
            finishedRoot.componentDidUpdate(
              prevProps,
              current,
              finishedRoot.__reactInternalSnapshotBeforeUpdate
            );
          } catch (error$97) {
            captureCommitPhaseError(
              finishedWork,
              finishedWork.return,
              error$97
            );
          }
        }
      flags & 64 && commitClassCallbacks(finishedWork);
      flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
      break;
    case 3:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & 64 && ((flags = finishedWork.updateQueue), null !== flags)) {
        finishedRoot = null;
        if (null !== finishedWork.child)
          switch (finishedWork.child.tag) {
            case 27:
            case 5:
              finishedRoot = finishedWork.child.stateNode;
              break;
            case 1:
              finishedRoot = finishedWork.child.stateNode;
          }
        try {
          commitCallbacks(flags, finishedRoot);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      break;
    case 26:
    case 27:
    case 5:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
      break;
    case 12:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    case 13:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    case 22:
      if (0 !== (finishedWork.mode & 1)) {
        if (
          ((prevProps =
            null !== finishedWork.memoizedState || offscreenSubtreeIsHidden),
          !prevProps)
        ) {
          current =
            (null !== current && null !== current.memoizedState) ||
            offscreenSubtreeWasHidden;
          var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden,
            prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
          offscreenSubtreeIsHidden = prevProps;
          (offscreenSubtreeWasHidden = current) &&
          !prevOffscreenSubtreeWasHidden
            ? recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                0 !== (finishedWork.subtreeFlags & 8772)
              )
            : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
          offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
        }
      } else recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      flags & 512 &&
        ("manual" === finishedWork.memoizedProps.mode
          ? safelyAttachRef(finishedWork, finishedWork.return)
          : safelyDetachRef(finishedWork, finishedWork.return));
      break;
    default:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
  }
}
function abortRootTransitions(
  root,
  abort,
  deletedTransitions,
  deletedOffscreenInstance
) {
  if (enableTransitionTracing) {
    var rootTransitions = root.incompleteTransitions;
    deletedTransitions.forEach(function(transition) {
      rootTransitions.has(transition) &&
        ((transition = rootTransitions.get(transition)),
        null === transition.aborts && (transition.aborts = []),
        transition.aborts.push(abort),
        null !== deletedOffscreenInstance &&
          null !== transition.pendingBoundaries &&
          transition.pendingBoundaries.has(deletedOffscreenInstance) &&
          transition.pendingBoundaries.delete(deletedOffscreenInstance));
    });
  }
}
function abortTracingMarkerTransitions(
  abortedFiber,
  abort,
  deletedTransitions,
  deletedOffscreenInstance,
  isInDeletedTree
) {
  if (enableTransitionTracing) {
    var markerInstance = abortedFiber.stateNode,
      markerTransitions = markerInstance.transitions,
      pendingBoundaries = markerInstance.pendingBoundaries;
    null !== markerTransitions &&
      deletedTransitions.forEach(function(transition) {
        if (
          null !== abortedFiber &&
          markerTransitions.has(transition) &&
          (null === markerInstance.aborts ||
            !markerInstance.aborts.includes(abort)) &&
          null !== markerInstance.transitions
        ) {
          if (null === markerInstance.aborts) {
            markerInstance.aborts = [abort];
            transition = abortedFiber.memoizedProps.name;
            var transitions = markerInstance.transitions,
              aborts = markerInstance.aborts;
            enableTransitionTracing &&
              (null === currentPendingTransitionCallbacks &&
                (currentPendingTransitionCallbacks = {
                  transitionStart: null,
                  transitionProgress: null,
                  transitionComplete: null,
                  markerProgress: null,
                  markerIncomplete: new Map(),
                  markerComplete: null
                }),
              null === currentPendingTransitionCallbacks.markerIncomplete &&
                (currentPendingTransitionCallbacks.markerIncomplete = new Map()),
              currentPendingTransitionCallbacks.markerIncomplete.set(
                transition,
                { transitions: transitions, aborts: aborts }
              ));
          } else markerInstance.aborts.push(abort);
          null !== deletedOffscreenInstance &&
            !isInDeletedTree &&
            null !== pendingBoundaries &&
            pendingBoundaries.has(deletedOffscreenInstance) &&
            (pendingBoundaries.delete(deletedOffscreenInstance),
            addMarkerProgressCallbackToPendingTransition(
              abortedFiber.memoizedProps.name,
              deletedTransitions,
              pendingBoundaries
            ));
        }
      });
  }
}
function abortParentMarkerTransitionsForDeletedFiber(
  abortedFiber,
  abort,
  deletedTransitions,
  deletedOffscreenInstance,
  isInDeletedTree
) {
  if (enableTransitionTracing)
    for (; null !== abortedFiber; ) {
      switch (abortedFiber.tag) {
        case 25:
          abortTracingMarkerTransitions(
            abortedFiber,
            abort,
            deletedTransitions,
            deletedOffscreenInstance,
            isInDeletedTree
          );
          break;
        case 3:
          abortRootTransitions(
            abortedFiber.stateNode,
            abort,
            deletedTransitions,
            deletedOffscreenInstance
          );
      }
      abortedFiber = abortedFiber.return;
    }
}
function commitTransitionProgress(offscreenFiber) {
  if (enableTransitionTracing) {
    var offscreenInstance = offscreenFiber.stateNode,
      prevState = null,
      previousFiber = offscreenFiber.alternate;
    null !== previousFiber &&
      null !== previousFiber.memoizedState &&
      (prevState = previousFiber.memoizedState);
    prevState = null !== prevState;
    previousFiber = null !== offscreenFiber.memoizedState;
    var pendingMarkers = offscreenInstance._pendingMarkers,
      name = null;
    offscreenFiber = offscreenFiber.return;
    null !== offscreenFiber &&
      13 === offscreenFiber.tag &&
      offscreenFiber.memoizedProps.unstable_name &&
      (name = offscreenFiber.memoizedProps.unstable_name);
    !prevState && previousFiber
      ? null !== pendingMarkers &&
        pendingMarkers.forEach(function(markerInstance) {
          var pendingBoundaries = markerInstance.pendingBoundaries,
            transitions = markerInstance.transitions,
            markerName = markerInstance.name;
          null === pendingBoundaries ||
            pendingBoundaries.has(offscreenInstance) ||
            (pendingBoundaries.set(offscreenInstance, { name: name }),
            null !== transitions &&
              (1 === markerInstance.tag && null !== markerName
                ? addMarkerProgressCallbackToPendingTransition(
                    markerName,
                    transitions,
                    pendingBoundaries
                  )
                : 0 === markerInstance.tag &&
                  transitions.forEach(function(transition) {
                    addTransitionProgressCallbackToPendingTransition(
                      transition,
                      pendingBoundaries
                    );
                  })));
        })
      : prevState &&
        !previousFiber &&
        null !== pendingMarkers &&
        pendingMarkers.forEach(function(markerInstance) {
          var pendingBoundaries = markerInstance.pendingBoundaries,
            transitions = markerInstance.transitions,
            markerName = markerInstance.name;
          null !== pendingBoundaries &&
            pendingBoundaries.has(offscreenInstance) &&
            (pendingBoundaries.delete(offscreenInstance),
            null !== transitions &&
              (1 === markerInstance.tag && null !== markerName
                ? (addMarkerProgressCallbackToPendingTransition(
                    markerName,
                    transitions,
                    pendingBoundaries
                  ),
                  0 === pendingBoundaries.size &&
                    (null === markerInstance.aborts &&
                      addMarkerCompleteCallbackToPendingTransition(
                        markerName,
                        transitions
                      ),
                    (markerInstance.transitions = null),
                    (markerInstance.pendingBoundaries = null),
                    (markerInstance.aborts = null)))
                : 0 === markerInstance.tag &&
                  transitions.forEach(function(transition) {
                    addTransitionProgressCallbackToPendingTransition(
                      transition,
                      pendingBoundaries
                    );
                  })));
        });
  }
}
function detachFiberAfterEffects(fiber) {
  var alternate = fiber.alternate;
  null !== alternate &&
    ((fiber.alternate = null), detachFiberAfterEffects(alternate));
  fiber.child = null;
  fiber.deletions = null;
  fiber.sibling = null;
  fiber.stateNode = null;
  fiber.return = null;
  fiber.dependencies = null;
  fiber.memoizedProps = null;
  fiber.memoizedState = null;
  fiber.pendingProps = null;
  fiber.stateNode = null;
  fiber.updateQueue = null;
}
function isHostParent(fiber) {
  return 5 === fiber.tag || 3 === fiber.tag || 4 === fiber.tag;
}
function getHostSibling(fiber) {
  a: for (;;) {
    for (; null === fiber.sibling; ) {
      if (null === fiber.return || isHostParent(fiber.return)) return null;
      fiber = fiber.return;
    }
    fiber.sibling.return = fiber.return;
    for (
      fiber = fiber.sibling;
      5 !== fiber.tag && 6 !== fiber.tag && 18 !== fiber.tag;

    ) {
      if (fiber.flags & 2) continue a;
      if (null === fiber.child || 4 === fiber.tag) continue a;
      else (fiber.child.return = fiber), (fiber = fiber.child);
    }
    if (!(fiber.flags & 2)) return fiber.stateNode;
  }
}
function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
  var tag = node.tag;
  if (5 === tag || 6 === tag)
    if (((node = node.stateNode), before)) {
      if (node === before) throw Error(formatProdErrorMessage(218));
      node.injectBefore(before);
    } else node.parentNode === parent && node.eject(), node.inject(parent);
  else if (4 !== tag && ((node = node.child), null !== node))
    for (
      insertOrAppendPlacementNodeIntoContainer(node, before, parent),
        node = node.sibling;
      null !== node;

    )
      insertOrAppendPlacementNodeIntoContainer(node, before, parent),
        (node = node.sibling);
}
function insertOrAppendPlacementNode(node, before, parent) {
  var tag = node.tag;
  if (5 === tag || 6 === tag)
    if (((node = node.stateNode), before)) {
      if (node === before) throw Error(formatProdErrorMessage(218));
      node.injectBefore(before);
    } else node.parentNode === parent && node.eject(), node.inject(parent);
  else if (4 !== tag && ((node = node.child), null !== node))
    for (
      insertOrAppendPlacementNode(node, before, parent), node = node.sibling;
      null !== node;

    )
      insertOrAppendPlacementNode(node, before, parent), (node = node.sibling);
}
var hostParent = null,
  hostParentIsContainer = !1;
function recursivelyTraverseDeletionEffects(
  finishedRoot,
  nearestMountedAncestor,
  parent
) {
  for (parent = parent.child; null !== parent; )
    commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent),
      (parent = parent.sibling);
}
function commitDeletionEffectsOnFiber(
  finishedRoot,
  nearestMountedAncestor,
  deletedFiber
) {
  if (injectedHook && "function" === typeof injectedHook.onCommitFiberUnmount)
    try {
      injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
    } catch (err) {}
  switch (deletedFiber.tag) {
    case 26:
    case 27:
    case 5:
      offscreenSubtreeWasHidden ||
        safelyDetachRef(deletedFiber, nearestMountedAncestor);
    case 6:
      var prevHostParent = hostParent,
        prevHostParentIsContainer = hostParentIsContainer;
      hostParent = null;
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      hostParent = prevHostParent;
      hostParentIsContainer = prevHostParentIsContainer;
      null !== hostParent &&
        ((deletedFiber = deletedFiber.stateNode),
        destroyEventListeners(deletedFiber),
        deletedFiber.eject());
      break;
    case 18:
      finishedRoot = finishedRoot.hydrationCallbacks;
      null !== finishedRoot &&
        (finishedRoot = finishedRoot.onDeleted) &&
        finishedRoot(deletedFiber.stateNode);
      null !== hostParent && shim(hostParent, deletedFiber.stateNode);
      break;
    case 4:
      prevHostParent = hostParent;
      prevHostParentIsContainer = hostParentIsContainer;
      hostParent = deletedFiber.stateNode.containerInfo;
      hostParentIsContainer = !0;
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      hostParent = prevHostParent;
      hostParentIsContainer = prevHostParentIsContainer;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (
        !offscreenSubtreeWasHidden &&
        ((prevHostParent = deletedFiber.updateQueue),
        null !== prevHostParent &&
          ((prevHostParent = prevHostParent.lastEffect),
          null !== prevHostParent))
      ) {
        prevHostParentIsContainer = prevHostParent = prevHostParent.next;
        do {
          var _effect = prevHostParentIsContainer,
            destroy = _effect.destroy;
          _effect = _effect.tag;
          void 0 !== destroy &&
            (0 !== (_effect & 2)
              ? safelyCallDestroy(deletedFiber, nearestMountedAncestor, destroy)
              : 0 !== (_effect & 4) &&
                safelyCallDestroy(
                  deletedFiber,
                  nearestMountedAncestor,
                  destroy
                ));
          prevHostParentIsContainer = prevHostParentIsContainer.next;
        } while (prevHostParentIsContainer !== prevHostParent);
      }
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
    case 1:
      if (
        !offscreenSubtreeWasHidden &&
        (safelyDetachRef(deletedFiber, nearestMountedAncestor),
        (prevHostParent = deletedFiber.stateNode),
        "function" === typeof prevHostParent.componentWillUnmount)
      )
        try {
          (prevHostParent.props = deletedFiber.memoizedProps),
            (prevHostParent.state = deletedFiber.memoizedState),
            prevHostParent.componentWillUnmount();
        } catch (error) {
          captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
        }
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
    case 21:
      safelyDetachRef(deletedFiber, nearestMountedAncestor);
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
    case 22:
      safelyDetachRef(deletedFiber, nearestMountedAncestor);
      deletedFiber.mode & 1
        ? ((offscreenSubtreeWasHidden =
            (prevHostParent = offscreenSubtreeWasHidden) ||
            null !== deletedFiber.memoizedState),
          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          ),
          (offscreenSubtreeWasHidden = prevHostParent))
        : recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
      break;
    default:
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
  }
}
function getRetryCache(finishedWork) {
  switch (finishedWork.tag) {
    case 13:
    case 19:
      var retryCache = finishedWork.stateNode;
      null === retryCache &&
        (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
      return retryCache;
    case 22:
      return (
        (finishedWork = finishedWork.stateNode),
        (retryCache = finishedWork._retryCache),
        null === retryCache &&
          (retryCache = finishedWork._retryCache = new PossiblyWeakSet()),
        retryCache
      );
    default:
      throw Error(formatProdErrorMessage(435, finishedWork.tag));
  }
}
function detachOffscreenInstance(instance) {
  var fiber = instance._current;
  if (null === fiber) throw Error(formatProdErrorMessage(456));
  if (0 === (instance._pendingVisibility & 2)) {
    var root = enqueueConcurrentRenderForLane(fiber, 1);
    null !== root &&
      ((instance._pendingVisibility |= 2),
      scheduleUpdateOnFiber(root, fiber, 1, -1));
  }
}
function attachOffscreenInstance(instance) {
  var fiber = instance._current;
  if (null === fiber) throw Error(formatProdErrorMessage(456));
  if (0 !== (instance._pendingVisibility & 2)) {
    var root = enqueueConcurrentRenderForLane(fiber, 1);
    null !== root &&
      ((instance._pendingVisibility &= -3),
      scheduleUpdateOnFiber(root, fiber, 1, -1));
  }
}
function attachSuspenseRetryListeners(finishedWork, wakeables) {
  var retryCache = getRetryCache(finishedWork);
  wakeables.forEach(function(wakeable) {
    var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
    retryCache.has(wakeable) ||
      (retryCache.add(wakeable), wakeable.then(retry, retry));
  });
}
function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber) {
  var deletions = parentFiber.deletions;
  if (null !== deletions)
    for (var i = 0; i < deletions.length; i++) {
      var childToDelete = deletions[i];
      try {
        var root = root$jscomp$0,
          returnFiber = parentFiber,
          parent = returnFiber;
        a: for (; null !== parent; ) {
          switch (parent.tag) {
            case 27:
            case 5:
              hostParent = parent.stateNode;
              hostParentIsContainer = !1;
              break a;
            case 3:
              hostParent = parent.stateNode.containerInfo;
              hostParentIsContainer = !0;
              break a;
            case 4:
              hostParent = parent.stateNode.containerInfo;
              hostParentIsContainer = !0;
              break a;
          }
          parent = parent.return;
        }
        if (null === hostParent) throw Error(formatProdErrorMessage(160));
        commitDeletionEffectsOnFiber(root, returnFiber, childToDelete);
        hostParent = null;
        hostParentIsContainer = !1;
        var alternate = childToDelete.alternate;
        null !== alternate && (alternate.return = null);
        childToDelete.return = null;
      } catch (error) {
        captureCommitPhaseError(childToDelete, parentFiber, error);
      }
    }
  if (parentFiber.subtreeFlags & 12854)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitMutationEffectsOnFiber(parentFiber, root$jscomp$0),
        (parentFiber = parentFiber.sibling);
}
function commitMutationEffectsOnFiber(finishedWork, root) {
  var current = finishedWork.alternate,
    flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      if (flags & 4) {
        try {
          commitHookEffectListUnmount(3, finishedWork, finishedWork.return),
            commitHookEffectListMount(3, finishedWork);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
        try {
          commitHookEffectListUnmount(5, finishedWork, finishedWork.return);
        } catch (error$105) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$105);
        }
      }
      break;
    case 1:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        null !== current &&
        safelyDetachRef(current, current.return);
      flags & 64 &&
        offscreenSubtreeIsHidden &&
        ((finishedWork = finishedWork.updateQueue),
        null !== finishedWork &&
          ((flags = finishedWork.callbacks),
          null !== flags &&
            ((current = finishedWork.shared.hiddenCallbacks),
            (finishedWork.shared.hiddenCallbacks =
              null === current ? flags : current.concat(flags)))));
      break;
    case 26:
    case 27:
    case 5:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        null !== current &&
        safelyDetachRef(current, current.return);
      if (flags & 4 && ((flags = finishedWork.stateNode), null != flags)) {
        var newProps = finishedWork.memoizedProps;
        current = null !== current ? current.memoizedProps : newProps;
        var updatePayload = finishedWork.updateQueue;
        finishedWork.updateQueue = null;
        if (null !== updatePayload)
          try {
            flags._applyProps(flags, newProps, current);
          } catch (error$108) {
            captureCommitPhaseError(
              finishedWork,
              finishedWork.return,
              error$108
            );
          }
      }
      break;
    case 6:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      if (flags & 4 && null === finishedWork.stateNode)
        throw Error(formatProdErrorMessage(162));
      break;
    case 3:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      break;
    case 4:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      break;
    case 13:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      current = finishedWork.child;
      current.flags & 8192 &&
        null !== current.memoizedState &&
        (null === current.alternate ||
          null === current.alternate.memoizedState) &&
        (globalMostRecentFallbackTime = now());
      if (flags & 4) {
        try {
          if (null !== finishedWork.memoizedState) {
            var suspenseCallback = finishedWork.memoizedProps.suspenseCallback;
            if ("function" === typeof suspenseCallback) {
              var wakeables = finishedWork.updateQueue;
              null !== wakeables && suspenseCallback(new Set(wakeables));
            }
          }
        } catch (error$110) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$110);
        }
        flags = finishedWork.updateQueue;
        null !== flags &&
          ((finishedWork.updateQueue = null),
          attachSuspenseRetryListeners(finishedWork, flags));
      }
      break;
    case 22:
      flags & 512 &&
        null !== current &&
        safelyDetachRef(current, current.return);
      suspenseCallback = null !== finishedWork.memoizedState;
      wakeables = null !== current && null !== current.memoizedState;
      if (finishedWork.mode & 1) {
        var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden,
          prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
        offscreenSubtreeIsHidden =
          prevOffscreenSubtreeIsHidden || suspenseCallback;
        offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || wakeables;
        recursivelyTraverseMutationEffects(root, finishedWork);
        offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
        offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
      } else recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      root = finishedWork.stateNode;
      root._current = finishedWork;
      root._visibility &= -3;
      root._visibility |= root._pendingVisibility & 2;
      if (
        flags & 8192 &&
        ((root._visibility = suspenseCallback
          ? root._visibility & -2
          : root._visibility | 1),
        suspenseCallback &&
          ((root = offscreenSubtreeIsHidden || offscreenSubtreeWasHidden),
          null === current ||
            wakeables ||
            root ||
            (0 !== (finishedWork.mode & 1) &&
              recursivelyTraverseDisappearLayoutEffects(finishedWork))),
        null === finishedWork.memoizedProps ||
          "manual" !== finishedWork.memoizedProps.mode)
      )
        a: for (current = null, root = finishedWork; ; ) {
          if (5 === root.tag) {
            if (null === current) {
              current = root;
              try {
                (newProps = root.stateNode),
                  suspenseCallback
                    ? newProps.hide()
                    : ((updatePayload = root.memoizedProps),
                      (null == updatePayload.visible ||
                        updatePayload.visible) &&
                        root.stateNode.show());
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }
          } else if (
            6 !== root.tag &&
            ((22 !== root.tag && 23 !== root.tag) ||
              null === root.memoizedState ||
              root === finishedWork) &&
            null !== root.child
          ) {
            root.child.return = root;
            root = root.child;
            continue;
          }
          if (root === finishedWork) break a;
          for (; null === root.sibling; ) {
            if (null === root.return || root.return === finishedWork) break a;
            current === root && (current = null);
            root = root.return;
          }
          current === root && (current = null);
          root.sibling.return = root.return;
          root = root.sibling;
        }
      flags & 4 &&
        ((flags = finishedWork.updateQueue),
        null !== flags &&
          ((current = flags.wakeables),
          null !== current &&
            ((flags.wakeables = null),
            attachSuspenseRetryListeners(finishedWork, current))));
      break;
    case 19:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      flags & 4 &&
        ((flags = finishedWork.updateQueue),
        null !== flags &&
          ((finishedWork.updateQueue = null),
          attachSuspenseRetryListeners(finishedWork, flags)));
      break;
    case 21:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        (null !== current && safelyDetachRef(finishedWork, finishedWork.return),
        safelyAttachRef(finishedWork, finishedWork.return));
      flags & 4 && shim$1();
      break;
    default:
      recursivelyTraverseMutationEffects(root, finishedWork),
        commitReconciliationEffects(finishedWork);
  }
}
function commitReconciliationEffects(finishedWork) {
  var flags = finishedWork.flags;
  if (flags & 2) {
    try {
      a: {
        for (var parent = finishedWork.return; null !== parent; ) {
          if (isHostParent(parent)) {
            var JSCompiler_inline_result = parent;
            break a;
          }
          parent = parent.return;
        }
        throw Error(formatProdErrorMessage(160));
      }
      switch (JSCompiler_inline_result.tag) {
        case 27:
        case 5:
          var parent$jscomp$0 = JSCompiler_inline_result.stateNode;
          JSCompiler_inline_result.flags & 32 &&
            (JSCompiler_inline_result.flags &= -33);
          var before = getHostSibling(finishedWork);
          insertOrAppendPlacementNode(finishedWork, before, parent$jscomp$0);
          break;
        case 3:
        case 4:
          var parent$100 = JSCompiler_inline_result.stateNode.containerInfo,
            before$101 = getHostSibling(finishedWork);
          insertOrAppendPlacementNodeIntoContainer(
            finishedWork,
            before$101,
            parent$100
          );
          break;
        default:
          throw Error(formatProdErrorMessage(161));
      }
    } catch (error) {
      captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
    finishedWork.flags &= -3;
  }
  flags & 4096 && (finishedWork.flags &= -4097);
}
function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & 8772)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitLayoutEffectOnFiber(root, parentFiber.alternate, parentFiber),
        (parentFiber = parentFiber.sibling);
}
function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    var finishedWork = parentFiber;
    switch (finishedWork.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        commitHookEffectListUnmount(4, finishedWork, finishedWork.return);
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 1:
        safelyDetachRef(finishedWork, finishedWork.return);
        var instance = finishedWork.stateNode;
        if ("function" === typeof instance.componentWillUnmount) {
          var current = finishedWork,
            nearestMountedAncestor = finishedWork.return;
          try {
            var current$jscomp$0 = current;
            instance.props = current$jscomp$0.memoizedProps;
            instance.state = current$jscomp$0.memoizedState;
            instance.componentWillUnmount();
          } catch (error) {
            captureCommitPhaseError(current, nearestMountedAncestor, error);
          }
        }
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 26:
      case 27:
      case 5:
        safelyDetachRef(finishedWork, finishedWork.return);
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 22:
        safelyDetachRef(finishedWork, finishedWork.return);
        null === finishedWork.memoizedState &&
          recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      default:
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
    }
    parentFiber = parentFiber.sibling;
  }
}
function recursivelyTraverseReappearLayoutEffects(
  finishedRoot$jscomp$0,
  parentFiber,
  includeWorkInProgressEffects
) {
  includeWorkInProgressEffects =
    includeWorkInProgressEffects && 0 !== (parentFiber.subtreeFlags & 8772);
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    var finishedRoot = finishedRoot$jscomp$0,
      finishedWork = parentFiber,
      flags = finishedWork.flags;
    switch (finishedWork.tag) {
      case 0:
      case 11:
      case 15:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        commitHookLayoutEffects(finishedWork, 4);
        break;
      case 1:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        var instance = finishedWork.stateNode;
        if ("function" === typeof instance.componentDidMount)
          try {
            instance.componentDidMount();
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        finishedRoot = finishedWork.updateQueue;
        if (null !== finishedRoot) {
          var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
          if (null !== hiddenCallbacks)
            for (
              finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0;
              finishedRoot < hiddenCallbacks.length;
              finishedRoot++
            )
              callCallback(hiddenCallbacks[finishedRoot], instance);
        }
        includeWorkInProgressEffects &&
          flags & 64 &&
          commitClassCallbacks(finishedWork);
        safelyAttachRef(finishedWork, finishedWork.return);
        break;
      case 26:
      case 27:
      case 5:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        safelyAttachRef(finishedWork, finishedWork.return);
        break;
      case 12:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        break;
      case 13:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        break;
      case 22:
        null === finishedWork.memoizedState &&
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          );
        safelyAttachRef(finishedWork, finishedWork.return);
        break;
      default:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
    }
    parentFiber = parentFiber.sibling;
  }
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  try {
    commitHookEffectListMount(hookFlags, finishedWork);
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitOffscreenPassiveMountEffects(current, finishedWork, instance) {
  var previousCache = null;
  null !== current &&
    null !== current.memoizedState &&
    null !== current.memoizedState.cachePool &&
    (previousCache = current.memoizedState.cachePool.pool);
  current = null;
  null !== finishedWork.memoizedState &&
    null !== finishedWork.memoizedState.cachePool &&
    (current = finishedWork.memoizedState.cachePool.pool);
  current !== previousCache &&
    (null != current && current.refCount++,
    null != previousCache && releaseCache(previousCache));
  if (enableTransitionTracing) {
    current = finishedWork.updateQueue;
    previousCache = null !== finishedWork.memoizedState;
    if (null !== current) {
      if (previousCache) {
        var transitions = current.transitions;
        null !== transitions &&
          transitions.forEach(function(transition) {
            null === instance._transitions &&
              (instance._transitions = new Set());
            instance._transitions.add(transition);
          });
        current = current.markerInstances;
        null !== current &&
          current.forEach(function(markerInstance) {
            var markerTransitions = markerInstance.transitions;
            null !== markerTransitions &&
              markerTransitions.forEach(function(transition) {
                null === instance._transitions
                  ? (instance._transitions = new Set())
                  : instance._transitions.has(transition) &&
                    (null === markerInstance.pendingBoundaries &&
                      (markerInstance.pendingBoundaries = new Map()),
                    null === instance._pendingMarkers &&
                      (instance._pendingMarkers = new Set()),
                    instance._pendingMarkers.add(markerInstance));
              });
          });
      }
      finishedWork.updateQueue = null;
    }
    commitTransitionProgress(finishedWork);
    previousCache ||
      ((instance._transitions = null), (instance._pendingMarkers = null));
  }
}
function commitCachePassiveMountEffect(current, finishedWork) {
  current = null;
  null !== finishedWork.alternate &&
    (current = finishedWork.alternate.memoizedState.cache);
  finishedWork = finishedWork.memoizedState.cache;
  finishedWork !== current &&
    (finishedWork.refCount++, null != current && releaseCache(current));
}
function commitTracingMarkerPassiveMountEffect(finishedWork) {
  var instance = finishedWork.stateNode;
  null !== instance.transitions &&
    null === instance.pendingBoundaries &&
    (addMarkerCompleteCallbackToPendingTransition(
      finishedWork.memoizedProps.name,
      instance.transitions
    ),
    (instance.transitions = null),
    (instance.pendingBoundaries = null),
    (instance.aborts = null),
    (instance.name = null));
}
function recursivelyTraversePassiveMountEffects(
  root,
  parentFiber,
  committedLanes,
  committedTransitions
) {
  if (parentFiber.subtreeFlags & 10256)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitPassiveMountOnFiber(
        root,
        parentFiber,
        committedLanes,
        committedTransitions
      ),
        (parentFiber = parentFiber.sibling);
}
function commitPassiveMountOnFiber(
  finishedRoot,
  finishedWork,
  committedLanes,
  committedTransitions
) {
  var flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions
      );
      flags & 2048 && commitHookPassiveMountEffects(finishedWork, 9);
      break;
    case 3:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions
      );
      if (flags & 2048) {
        flags = null;
        null !== finishedWork.alternate &&
          (flags = finishedWork.alternate.memoizedState.cache);
        var nextCache = finishedWork.memoizedState.cache;
        nextCache !== flags &&
          (nextCache.refCount++, null != flags && releaseCache(flags));
        if (enableTransitionTracing) {
          var incompleteTransitions =
            finishedWork.stateNode.incompleteTransitions;
          null !== committedTransitions &&
            (committedTransitions.forEach(function(transition) {
              enableTransitionTracing &&
                (null === currentPendingTransitionCallbacks &&
                  (currentPendingTransitionCallbacks = {
                    transitionStart: [],
                    transitionProgress: null,
                    transitionComplete: null,
                    markerProgress: null,
                    markerIncomplete: null,
                    markerComplete: null
                  }),
                null === currentPendingTransitionCallbacks.transitionStart &&
                  (currentPendingTransitionCallbacks.transitionStart = []),
                currentPendingTransitionCallbacks.transitionStart.push(
                  transition
                ));
            }),
            clearTransitionsForLanes(finishedRoot, committedLanes));
          incompleteTransitions.forEach(function(markerInstance, transition) {
            var pendingBoundaries = markerInstance.pendingBoundaries;
            if (null === pendingBoundaries || 0 === pendingBoundaries.size)
              null === markerInstance.aborts &&
                enableTransitionTracing &&
                (null === currentPendingTransitionCallbacks &&
                  (currentPendingTransitionCallbacks = {
                    transitionStart: null,
                    transitionProgress: null,
                    transitionComplete: [],
                    markerProgress: null,
                    markerIncomplete: null,
                    markerComplete: null
                  }),
                null === currentPendingTransitionCallbacks.transitionComplete &&
                  (currentPendingTransitionCallbacks.transitionComplete = []),
                currentPendingTransitionCallbacks.transitionComplete.push(
                  transition
                )),
                incompleteTransitions.delete(transition);
          });
          clearTransitionsForLanes(finishedRoot, committedLanes);
        }
      }
      break;
    case 23:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions
      );
      flags & 2048 &&
        commitOffscreenPassiveMountEffects(
          finishedWork.alternate,
          finishedWork,
          finishedWork.stateNode
        );
      break;
    case 22:
      nextCache = finishedWork.stateNode;
      null !== finishedWork.memoizedState
        ? nextCache._visibility & 4
          ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            )
          : finishedWork.mode & 1
          ? recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork)
          : ((nextCache._visibility |= 4),
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ))
        : nextCache._visibility & 4
        ? recursivelyTraversePassiveMountEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions
          )
        : ((nextCache._visibility |= 4),
          recursivelyTraverseReconnectPassiveEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions,
            0 !== (finishedWork.subtreeFlags & 10256)
          ));
      flags & 2048 &&
        commitOffscreenPassiveMountEffects(
          finishedWork.alternate,
          finishedWork,
          nextCache
        );
      break;
    case 24:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions
      );
      flags & 2048 &&
        commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
      break;
    case 25:
      if (enableTransitionTracing) {
        recursivelyTraversePassiveMountEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions
        );
        flags & 2048 && commitTracingMarkerPassiveMountEffect(finishedWork);
        break;
      }
    default:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions
      );
  }
}
function recursivelyTraverseReconnectPassiveEffects(
  finishedRoot$jscomp$0,
  parentFiber,
  committedLanes$jscomp$0,
  committedTransitions$jscomp$0,
  includeWorkInProgressEffects
) {
  includeWorkInProgressEffects =
    includeWorkInProgressEffects && 0 !== (parentFiber.subtreeFlags & 10256);
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    var finishedRoot = finishedRoot$jscomp$0,
      finishedWork = parentFiber,
      committedLanes = committedLanes$jscomp$0,
      committedTransitions = committedTransitions$jscomp$0,
      flags = finishedWork.flags;
    switch (finishedWork.tag) {
      case 0:
      case 11:
      case 15:
        recursivelyTraverseReconnectPassiveEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions,
          includeWorkInProgressEffects
        );
        commitHookPassiveMountEffects(finishedWork, 8);
        break;
      case 23:
        recursivelyTraverseReconnectPassiveEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions,
          includeWorkInProgressEffects
        );
        includeWorkInProgressEffects &&
          flags & 2048 &&
          commitOffscreenPassiveMountEffects(
            finishedWork.alternate,
            finishedWork,
            finishedWork.stateNode
          );
        break;
      case 22:
        var instance$119 = finishedWork.stateNode;
        null !== finishedWork.memoizedState
          ? instance$119._visibility & 4
            ? recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              )
            : finishedWork.mode & 1
            ? recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork
              )
            : ((instance$119._visibility |= 4),
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ))
          : ((instance$119._visibility |= 4),
            recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              includeWorkInProgressEffects
            ));
        includeWorkInProgressEffects &&
          flags & 2048 &&
          commitOffscreenPassiveMountEffects(
            finishedWork.alternate,
            finishedWork,
            instance$119
          );
        break;
      case 24:
        recursivelyTraverseReconnectPassiveEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions,
          includeWorkInProgressEffects
        );
        includeWorkInProgressEffects &&
          flags & 2048 &&
          commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
        break;
      case 25:
        if (enableTransitionTracing) {
          recursivelyTraverseReconnectPassiveEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions,
            includeWorkInProgressEffects
          );
          includeWorkInProgressEffects &&
            flags & 2048 &&
            commitTracingMarkerPassiveMountEffect(finishedWork);
          break;
        }
      default:
        recursivelyTraverseReconnectPassiveEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions,
          includeWorkInProgressEffects
        );
    }
    parentFiber = parentFiber.sibling;
  }
}
function recursivelyTraverseAtomicPassiveEffects(
  finishedRoot$jscomp$0,
  parentFiber
) {
  if (parentFiber.subtreeFlags & 10256)
    for (parentFiber = parentFiber.child; null !== parentFiber; ) {
      var finishedRoot = finishedRoot$jscomp$0,
        finishedWork = parentFiber,
        flags = finishedWork.flags;
      switch (finishedWork.tag) {
        case 22:
          recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
          flags & 2048 &&
            commitOffscreenPassiveMountEffects(
              finishedWork.alternate,
              finishedWork,
              finishedWork.stateNode
            );
          break;
        case 24:
          recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
          flags & 2048 &&
            commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
          break;
        default:
          recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
      }
      parentFiber = parentFiber.sibling;
    }
}
function detachAlternateSiblings(parentFiber) {
  var previousFiber = parentFiber.alternate;
  if (
    null !== previousFiber &&
    ((parentFiber = previousFiber.child), null !== parentFiber)
  ) {
    previousFiber.child = null;
    do
      (previousFiber = parentFiber.sibling),
        (parentFiber.sibling = null),
        (parentFiber = previousFiber);
    while (null !== parentFiber);
  }
}
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  var deletions = parentFiber.deletions;
  if (0 !== (parentFiber.flags & 16)) {
    if (null !== deletions)
      for (var i = 0; i < deletions.length; i++) {
        var childToDelete = deletions[i];
        nextEffect = childToDelete;
        commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
          childToDelete,
          parentFiber
        );
      }
    detachAlternateSiblings(parentFiber);
  }
  if (parentFiber.subtreeFlags & 10256)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitPassiveUnmountOnFiber(parentFiber),
        (parentFiber = parentFiber.sibling);
}
function commitPassiveUnmountOnFiber(finishedWork) {
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      finishedWork.flags & 2048 &&
        commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
      break;
    case 22:
      var instance = finishedWork.stateNode;
      null !== finishedWork.memoizedState &&
      instance._visibility & 4 &&
      (null === finishedWork.return || 13 !== finishedWork.return.tag)
        ? ((instance._visibility &= -5),
          recursivelyTraverseDisconnectPassiveEffects(finishedWork))
        : recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    default:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
  }
}
function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
  var deletions = parentFiber.deletions;
  if (0 !== (parentFiber.flags & 16)) {
    if (null !== deletions)
      for (var i = 0; i < deletions.length; i++) {
        var childToDelete = deletions[i];
        nextEffect = childToDelete;
        commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
          childToDelete,
          parentFiber
        );
      }
    detachAlternateSiblings(parentFiber);
  }
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    deletions = parentFiber;
    switch (deletions.tag) {
      case 0:
      case 11:
      case 15:
        commitHookEffectListUnmount(8, deletions, deletions.return);
        recursivelyTraverseDisconnectPassiveEffects(deletions);
        break;
      case 22:
        i = deletions.stateNode;
        i._visibility & 4 &&
          ((i._visibility &= -5),
          recursivelyTraverseDisconnectPassiveEffects(deletions));
        break;
      default:
        recursivelyTraverseDisconnectPassiveEffects(deletions);
    }
    parentFiber = parentFiber.sibling;
  }
}
function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
  deletedSubtreeRoot,
  nearestMountedAncestor$jscomp$0
) {
  for (; null !== nextEffect; ) {
    var fiber = nextEffect,
      nearestMountedAncestor = nearestMountedAncestor$jscomp$0;
    switch (fiber.tag) {
      case 0:
      case 11:
      case 15:
        commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
        break;
      case 23:
      case 22:
        null !== fiber.memoizedState &&
          null !== fiber.memoizedState.cachePool &&
          ((nearestMountedAncestor = fiber.memoizedState.cachePool.pool),
          null != nearestMountedAncestor && nearestMountedAncestor.refCount++);
        break;
      case 13:
        if (enableTransitionTracing) {
          var offscreenFiber = fiber.child,
            instance = offscreenFiber.stateNode,
            transitions = instance._transitions;
          if (null !== transitions) {
            var abortReason = {
              reason: "suspense",
              name: fiber.memoizedProps.unstable_name || null
            };
            if (
              null === fiber.memoizedState ||
              null === fiber.memoizedState.dehydrated
            )
              abortParentMarkerTransitionsForDeletedFiber(
                offscreenFiber,
                abortReason,
                transitions,
                instance,
                !0
              ),
                null !== nearestMountedAncestor &&
                  abortParentMarkerTransitionsForDeletedFiber(
                    nearestMountedAncestor,
                    abortReason,
                    transitions,
                    instance,
                    !1
                  );
          }
        }
        break;
      case 24:
        releaseCache(fiber.memoizedState.cache);
        break;
      case 25:
        enableTransitionTracing &&
          ((offscreenFiber = fiber.stateNode.transitions),
          null !== offscreenFiber &&
            ((instance = { reason: "marker", name: fiber.memoizedProps.name }),
            abortParentMarkerTransitionsForDeletedFiber(
              fiber,
              instance,
              offscreenFiber,
              null,
              !0
            ),
            null !== nearestMountedAncestor &&
              abortParentMarkerTransitionsForDeletedFiber(
                nearestMountedAncestor,
                instance,
                offscreenFiber,
                null,
                !1
              )));
    }
    nearestMountedAncestor = fiber.child;
    if (null !== nearestMountedAncestor)
      (nearestMountedAncestor.return = fiber),
        (nextEffect = nearestMountedAncestor);
    else
      a: for (fiber = deletedSubtreeRoot; null !== nextEffect; ) {
        nearestMountedAncestor = nextEffect;
        offscreenFiber = nearestMountedAncestor.sibling;
        instance = nearestMountedAncestor.return;
        detachFiberAfterEffects(nearestMountedAncestor);
        if (nearestMountedAncestor === fiber) {
          nextEffect = null;
          break a;
        }
        if (null !== offscreenFiber) {
          offscreenFiber.return = instance;
          nextEffect = offscreenFiber;
          break a;
        }
        nextEffect = instance;
      }
  }
}
var DefaultCacheDispatcher = {
    getCacheSignal: function() {
      return readContext(CacheContext).controller.signal;
    },
    getCacheForType: function(resourceType) {
      var cache = readContext(CacheContext),
        cacheForType = cache.data.get(resourceType);
      void 0 === cacheForType &&
        ((cacheForType = resourceType()),
        cache.data.set(resourceType, cacheForType));
      return cacheForType;
    }
  },
  ceil = Math.ceil,
  PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map,
  ReactCurrentDispatcher$2 = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentCache = ReactSharedInternals.ReactCurrentCache,
  ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner,
  ReactCurrentBatchConfig$2 = ReactSharedInternals.ReactCurrentBatchConfig,
  executionContext = 0,
  workInProgressRoot = null,
  workInProgress = null,
  workInProgressRootRenderLanes = 0,
  workInProgressSuspendedReason = 0,
  workInProgressThrownValue = null,
  workInProgressRootDidAttachPingListener = !1,
  renderLanes$1 = 0,
  workInProgressRootExitStatus = 0,
  workInProgressRootFatalError = null,
  workInProgressRootSkippedLanes = 0,
  workInProgressRootInterleavedUpdatedLanes = 0,
  workInProgressRootPingedLanes = 0,
  workInProgressRootConcurrentErrors = null,
  workInProgressRootRecoverableErrors = null,
  globalMostRecentFallbackTime = 0,
  workInProgressRootRenderTargetTime = Infinity,
  workInProgressTransitions = null,
  currentPendingTransitionCallbacks = null,
  currentEndTime = null;
function addMarkerProgressCallbackToPendingTransition(
  markerName,
  transitions,
  pendingBoundaries
) {
  enableTransitionTracing &&
    (null === currentPendingTransitionCallbacks &&
      (currentPendingTransitionCallbacks = {
        transitionStart: null,
        transitionProgress: null,
        transitionComplete: null,
        markerProgress: new Map(),
        markerIncomplete: null,
        markerComplete: null
      }),
    null === currentPendingTransitionCallbacks.markerProgress &&
      (currentPendingTransitionCallbacks.markerProgress = new Map()),
    currentPendingTransitionCallbacks.markerProgress.set(markerName, {
      pendingBoundaries: pendingBoundaries,
      transitions: transitions
    }));
}
function addMarkerCompleteCallbackToPendingTransition(markerName, transitions) {
  enableTransitionTracing &&
    (null === currentPendingTransitionCallbacks &&
      (currentPendingTransitionCallbacks = {
        transitionStart: null,
        transitionProgress: null,
        transitionComplete: null,
        markerProgress: null,
        markerIncomplete: null,
        markerComplete: new Map()
      }),
    null === currentPendingTransitionCallbacks.markerComplete &&
      (currentPendingTransitionCallbacks.markerComplete = new Map()),
    currentPendingTransitionCallbacks.markerComplete.set(
      markerName,
      transitions
    ));
}
function addTransitionProgressCallbackToPendingTransition(
  transition,
  boundaries
) {
  enableTransitionTracing &&
    (null === currentPendingTransitionCallbacks &&
      (currentPendingTransitionCallbacks = {
        transitionStart: null,
        transitionProgress: new Map(),
        transitionComplete: null,
        markerProgress: null,
        markerIncomplete: null,
        markerComplete: null
      }),
    null === currentPendingTransitionCallbacks.transitionProgress &&
      (currentPendingTransitionCallbacks.transitionProgress = new Map()),
    currentPendingTransitionCallbacks.transitionProgress.set(
      transition,
      boundaries
    ));
}
var hasUncaughtError = !1,
  firstUncaughtError = null,
  legacyErrorBoundariesThatAlreadyFailed = null,
  rootDoesHavePassiveEffects = !1,
  rootWithPendingPassiveEffects = null,
  pendingPassiveEffectsLanes = 0,
  pendingPassiveEffectsRemainingLanes = 0,
  pendingPassiveTransitions = null,
  nestedUpdateCount = 0,
  rootWithNestedUpdates = null,
  currentEventTime = -1,
  currentEventTransitionLane = 0;
function requestEventTime() {
  return 0 !== (executionContext & 6)
    ? now()
    : -1 !== currentEventTime
    ? currentEventTime
    : (currentEventTime = now());
}
function requestUpdateLane(fiber) {
  if (0 === (fiber.mode & 1)) return 1;
  if (
    !deferRenderPhaseUpdateToNextBatch &&
    0 !== (executionContext & 2) &&
    0 !== workInProgressRootRenderLanes
  )
    return workInProgressRootRenderLanes & -workInProgressRootRenderLanes;
  if (null !== ReactCurrentBatchConfig$1.transition)
    return (
      0 === currentEventTransitionLane &&
        (currentEventTransitionLane = claimNextTransitionLane()),
      currentEventTransitionLane
    );
  fiber = currentUpdatePriority;
  return 0 !== fiber ? fiber : 16;
}
function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
  2 === workInProgressSuspendedReason &&
    root === workInProgressRoot &&
    (prepareFreshStack(root, 0),
    markRootSuspended$1(root, workInProgressRootRenderLanes));
  markRootUpdated(root, lane, eventTime);
  if (0 === (executionContext & 2) || root !== workInProgressRoot) {
    if (enableTransitionTracing) {
      var transition = ReactCurrentBatchConfig$2.transition;
      if (
        null !== transition &&
        null != transition.name &&
        (-1 === transition.startTime && (transition.startTime = now()),
        enableTransitionTracing)
      ) {
        var transitionLanesMap = root.transitionLanes,
          index$7 = 31 - clz32(lane),
          transitions = transitionLanesMap[index$7];
        null === transitions && (transitions = new Set());
        transitions.add(transition);
        transitionLanesMap[index$7] = transitions;
      }
    }
    if (root === workInProgressRoot) {
      if (deferRenderPhaseUpdateToNextBatch || 0 === (executionContext & 2))
        workInProgressRootInterleavedUpdatedLanes |= lane;
      4 === workInProgressRootExitStatus &&
        markRootSuspended$1(root, workInProgressRootRenderLanes);
    }
    ensureRootIsScheduled(root, eventTime);
    1 === lane &&
      0 === executionContext &&
      0 === (fiber.mode & 1) &&
      ((workInProgressRootRenderTargetTime = now() + 500),
      includesLegacySyncCallbacks && flushSyncCallbacks());
  }
}
function ensureRootIsScheduled(root, currentTime) {
  for (
    var existingCallbackNode = root.callbackNode,
      suspendedLanes = root.suspendedLanes,
      pingedLanes = root.pingedLanes,
      expirationTimes = root.expirationTimes,
      lanes = root.pendingLanes & -130023425;
    0 < lanes;

  ) {
    var index$3 = 31 - clz32(lanes),
      lane = 1 << index$3,
      expirationTime = expirationTimes[index$3];
    if (-1 === expirationTime) {
      if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes))
        expirationTimes[index$3] = computeExpirationTime(lane, currentTime);
    } else expirationTime <= currentTime && (root.expiredLanes |= lane);
    lanes &= ~lane;
  }
  suspendedLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : 0
  );
  if (0 === suspendedLanes)
    null !== existingCallbackNode && cancelCallback(existingCallbackNode),
      (root.callbackNode = null),
      (root.callbackPriority = 0);
  else if (
    ((currentTime = suspendedLanes & -suspendedLanes),
    root.callbackPriority !== currentTime)
  ) {
    null != existingCallbackNode && cancelCallback(existingCallbackNode);
    if (1 === currentTime)
      0 === root.tag
        ? ((existingCallbackNode = performSyncWorkOnRoot.bind(null, root)),
          (includesLegacySyncCallbacks = !0),
          null === syncQueue
            ? (syncQueue = [existingCallbackNode])
            : syncQueue.push(existingCallbackNode))
        : ((existingCallbackNode = performSyncWorkOnRoot.bind(null, root)),
          null === syncQueue
            ? (syncQueue = [existingCallbackNode])
            : syncQueue.push(existingCallbackNode)),
        scheduleCallback(ImmediatePriority, flushSyncCallbacks),
        (existingCallbackNode = null);
    else {
      switch (lanesToEventPriority(suspendedLanes)) {
        case 1:
          existingCallbackNode = ImmediatePriority;
          break;
        case 4:
          existingCallbackNode = UserBlockingPriority;
          break;
        case 16:
          existingCallbackNode = NormalPriority;
          break;
        case 536870912:
          existingCallbackNode = IdlePriority;
          break;
        default:
          existingCallbackNode = NormalPriority;
      }
      existingCallbackNode = scheduleCallback$2(
        existingCallbackNode,
        performConcurrentWorkOnRoot.bind(null, root)
      );
    }
    root.callbackPriority = currentTime;
    root.callbackNode = existingCallbackNode;
  }
}
function performConcurrentWorkOnRoot(root, didTimeout) {
  currentEventTime = -1;
  currentEventTransitionLane = 0;
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
  var originalCallbackNode = root.callbackNode;
  if (flushPassiveEffects() && root.callbackNode !== originalCallbackNode)
    return null;
  var lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : 0
  );
  if (0 === lanes) return null;
  didTimeout =
    includesBlockingLane(root, lanes) ||
    0 !== (lanes & root.expiredLanes) ||
    (!disableSchedulerTimeoutInWorkLoop && didTimeout)
      ? renderRootSync(root, lanes)
      : renderRootConcurrent(root, lanes);
  if (0 !== didTimeout) {
    if (2 === didTimeout) {
      var originallyAttemptedLanes = lanes,
        errorRetryLanes = getLanesToRetrySynchronouslyOnError(
          root,
          originallyAttemptedLanes
        );
      0 !== errorRetryLanes &&
        ((lanes = errorRetryLanes),
        (didTimeout = recoverFromConcurrentError(
          root,
          originallyAttemptedLanes,
          errorRetryLanes
        )));
    }
    if (1 === didTimeout)
      throw ((originalCallbackNode = workInProgressRootFatalError),
      prepareFreshStack(root, 0),
      markRootSuspended$1(root, lanes),
      ensureRootIsScheduled(root, now()),
      originalCallbackNode);
    if (6 === didTimeout) markRootSuspended$1(root, lanes);
    else {
      errorRetryLanes = !includesBlockingLane(root, lanes);
      originallyAttemptedLanes = root.current.alternate;
      if (
        errorRetryLanes &&
        !isRenderConsistentWithExternalStores(originallyAttemptedLanes)
      ) {
        didTimeout = renderRootSync(root, lanes);
        if (2 === didTimeout) {
          errorRetryLanes = lanes;
          var errorRetryLanes$128 = getLanesToRetrySynchronouslyOnError(
            root,
            errorRetryLanes
          );
          0 !== errorRetryLanes$128 &&
            ((lanes = errorRetryLanes$128),
            (didTimeout = recoverFromConcurrentError(
              root,
              errorRetryLanes,
              errorRetryLanes$128
            )));
        }
        if (1 === didTimeout)
          throw ((originalCallbackNode = workInProgressRootFatalError),
          prepareFreshStack(root, 0),
          markRootSuspended$1(root, lanes),
          ensureRootIsScheduled(root, now()),
          originalCallbackNode);
      }
      root.finishedWork = originallyAttemptedLanes;
      root.finishedLanes = lanes;
      switch (didTimeout) {
        case 0:
        case 1:
          throw Error(formatProdErrorMessage(345));
        case 2:
          commitRoot(
            root,
            workInProgressRootRecoverableErrors,
            workInProgressTransitions
          );
          break;
        case 3:
          markRootSuspended$1(root, lanes);
          if (
            (lanes & 130023424) === lanes &&
            ((didTimeout = globalMostRecentFallbackTime + 500 - now()),
            10 < didTimeout)
          ) {
            if (0 !== getNextLanes(root, 0)) break;
            originallyAttemptedLanes = root.suspendedLanes;
            if ((originallyAttemptedLanes & lanes) !== lanes) {
              requestEventTime();
              root.pingedLanes |=
                root.suspendedLanes & originallyAttemptedLanes;
              break;
            }
            root.timeoutHandle = scheduleTimeout(
              commitRoot.bind(
                null,
                root,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions
              ),
              didTimeout
            );
            break;
          }
          commitRoot(
            root,
            workInProgressRootRecoverableErrors,
            workInProgressTransitions
          );
          break;
        case 4:
          markRootSuspended$1(root, lanes);
          if ((lanes & 4194240) === lanes) break;
          didTimeout = root.eventTimes;
          for (originallyAttemptedLanes = -1; 0 < lanes; )
            (errorRetryLanes$128 = 31 - clz32(lanes)),
              (errorRetryLanes = 1 << errorRetryLanes$128),
              (errorRetryLanes$128 = didTimeout[errorRetryLanes$128]),
              errorRetryLanes$128 > originallyAttemptedLanes &&
                (originallyAttemptedLanes = errorRetryLanes$128),
              (lanes &= ~errorRetryLanes);
          lanes = originallyAttemptedLanes;
          lanes = now() - lanes;
          lanes =
            (120 > lanes
              ? 120
              : 480 > lanes
              ? 480
              : 1080 > lanes
              ? 1080
              : 1920 > lanes
              ? 1920
              : 3e3 > lanes
              ? 3e3
              : 4320 > lanes
              ? 4320
              : 1960 * ceil(lanes / 1960)) - lanes;
          if (10 < lanes) {
            root.timeoutHandle = scheduleTimeout(
              commitRoot.bind(
                null,
                root,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions
              ),
              lanes
            );
            break;
          }
          commitRoot(
            root,
            workInProgressRootRecoverableErrors,
            workInProgressTransitions
          );
          break;
        case 5:
          commitRoot(
            root,
            workInProgressRootRecoverableErrors,
            workInProgressTransitions
          );
          break;
        default:
          throw Error(formatProdErrorMessage(329));
      }
    }
  }
  ensureRootIsScheduled(root, now());
  return root.callbackNode === originalCallbackNode
    ? 2 === workInProgressSuspendedReason && workInProgressRoot === root
      ? ((root.callbackPriority = 0), (root.callbackNode = null))
      : performConcurrentWorkOnRoot.bind(null, root)
    : null;
}
function recoverFromConcurrentError(
  root,
  originallyAttemptedLanes,
  errorRetryLanes
) {
  var errorsFromFirstAttempt = workInProgressRootConcurrentErrors,
    JSCompiler_inline_result;
  (JSCompiler_inline_result = root.current.memoizedState.isDehydrated) &&
    (prepareFreshStack(root, errorRetryLanes).flags |= 256);
  errorRetryLanes = renderRootSync(root, errorRetryLanes);
  if (2 !== errorRetryLanes) {
    if (workInProgressRootDidAttachPingListener && !JSCompiler_inline_result)
      return (
        (root.errorRecoveryDisabledLanes |= originallyAttemptedLanes),
        (workInProgressRootInterleavedUpdatedLanes |= originallyAttemptedLanes),
        4
      );
    root = workInProgressRootRecoverableErrors;
    workInProgressRootRecoverableErrors = errorsFromFirstAttempt;
    null !== root && queueRecoverableErrors(root);
  }
  return errorRetryLanes;
}
function queueRecoverableErrors(errors) {
  null === workInProgressRootRecoverableErrors
    ? (workInProgressRootRecoverableErrors = errors)
    : workInProgressRootRecoverableErrors.push.apply(
        workInProgressRootRecoverableErrors,
        errors
      );
}
function isRenderConsistentWithExternalStores(finishedWork) {
  for (var node = finishedWork; ; ) {
    if (node.flags & 16384) {
      var updateQueue = node.updateQueue;
      if (
        null !== updateQueue &&
        ((updateQueue = updateQueue.stores), null !== updateQueue)
      )
        for (var i = 0; i < updateQueue.length; i++) {
          var check = updateQueue[i],
            getSnapshot = check.getSnapshot;
          check = check.value;
          try {
            if (!objectIs(getSnapshot(), check)) return !1;
          } catch (error) {
            return !1;
          }
        }
    }
    updateQueue = node.child;
    if (node.subtreeFlags & 16384 && null !== updateQueue)
      (updateQueue.return = node), (node = updateQueue);
    else {
      if (node === finishedWork) break;
      for (; null === node.sibling; ) {
        if (null === node.return || node.return === finishedWork) return !0;
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
  return !0;
}
function markRootSuspended$1(root, suspendedLanes) {
  suspendedLanes &= ~workInProgressRootPingedLanes;
  suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
  root.suspendedLanes |= suspendedLanes;
  root.pingedLanes &= ~suspendedLanes;
  for (root = root.expirationTimes; 0 < suspendedLanes; ) {
    var index$4 = 31 - clz32(suspendedLanes),
      lane = 1 << index$4;
    root[index$4] = -1;
    suspendedLanes &= ~lane;
  }
}
function performSyncWorkOnRoot(root) {
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
  flushPassiveEffects();
  var lanes = getNextLanes(root, 0);
  if (0 === (lanes & 1)) return ensureRootIsScheduled(root, now()), null;
  var exitStatus = renderRootSync(root, lanes);
  if (0 !== root.tag && 2 === exitStatus) {
    var originallyAttemptedLanes = lanes,
      errorRetryLanes = getLanesToRetrySynchronouslyOnError(
        root,
        originallyAttemptedLanes
      );
    0 !== errorRetryLanes &&
      ((lanes = errorRetryLanes),
      (exitStatus = recoverFromConcurrentError(
        root,
        originallyAttemptedLanes,
        errorRetryLanes
      )));
  }
  if (1 === exitStatus)
    throw ((exitStatus = workInProgressRootFatalError),
    prepareFreshStack(root, 0),
    markRootSuspended$1(root, lanes),
    ensureRootIsScheduled(root, now()),
    exitStatus);
  if (6 === exitStatus)
    return (
      markRootSuspended$1(root, lanes), ensureRootIsScheduled(root, now()), null
    );
  root.finishedWork = root.current.alternate;
  root.finishedLanes = lanes;
  commitRoot(
    root,
    workInProgressRootRecoverableErrors,
    workInProgressTransitions
  );
  ensureRootIsScheduled(root, now());
  return null;
}
function prepareFreshStack(root, lanes) {
  root.finishedWork = null;
  root.finishedLanes = 0;
  var timeoutHandle = root.timeoutHandle;
  -1 !== timeoutHandle &&
    ((root.timeoutHandle = -1), cancelTimeout(timeoutHandle));
  if (null !== workInProgress)
    for (
      0 === workInProgressSuspendedReason
        ? (timeoutHandle = workInProgress.return)
        : (resetContextDependencies(),
          resetHooksOnUnwind(),
          (timeoutHandle = workInProgress));
      null !== timeoutHandle;

    )
      unwindInterruptedWork(timeoutHandle.alternate, timeoutHandle),
        (timeoutHandle = timeoutHandle.return);
  workInProgressRoot = root;
  workInProgress = root = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = renderLanes$1 = lanes;
  workInProgressSuspendedReason = 0;
  workInProgressThrownValue = null;
  workInProgressRootDidAttachPingListener = !1;
  workInProgressRootExitStatus = 0;
  workInProgressRootFatalError = null;
  workInProgressRootPingedLanes = workInProgressRootInterleavedUpdatedLanes = workInProgressRootSkippedLanes = 0;
  workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors = null;
  finishQueueingConcurrentUpdates();
  return root;
}
function handleThrow(root, thrownValue) {
  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
  ReactCurrentOwner$2.current = null;
  if (thrownValue === SuspenseException) {
    if (null === suspendedThenable) throw Error(formatProdErrorMessage(459));
    root = suspendedThenable;
    suspendedThenable = null;
    thrownValue = root;
    workInProgressSuspendedReason = shouldAttemptToSuspendUntilDataResolves()
      ? 2
      : 3;
  } else
    workInProgressSuspendedReason =
      null !== thrownValue &&
      "object" === typeof thrownValue &&
      "function" === typeof thrownValue.then
        ? 4
        : 1;
  workInProgressThrownValue = thrownValue;
  null === workInProgress &&
    ((workInProgressRootExitStatus = 1),
    (workInProgressRootFatalError = thrownValue));
}
function shouldAttemptToSuspendUntilDataResolves() {
  if (
    (workInProgressRootRenderLanes & 130023424) ===
    workInProgressRootRenderLanes
  )
    return !0;
  if (
    0 !== (workInProgressRootSkippedLanes & 268435455) ||
    0 !== (workInProgressRootInterleavedUpdatedLanes & 268435455)
  )
    return !1;
  if (
    (workInProgressRootRenderLanes & 4194240) ===
    workInProgressRootRenderLanes
  ) {
    var suspenseHandler = suspenseHandlerStackCursor.current;
    return null === suspenseHandler ||
      13 !== suspenseHandler.tag ||
      isBadSuspenseFallback(
        suspenseHandler.alternate,
        suspenseHandler.memoizedProps
      )
      ? !0
      : !1;
  }
  return !1;
}
function pushDispatcher() {
  var prevDispatcher = ReactCurrentDispatcher$2.current;
  ReactCurrentDispatcher$2.current = ContextOnlyDispatcher;
  return null === prevDispatcher ? ContextOnlyDispatcher : prevDispatcher;
}
function pushCacheDispatcher() {
  var prevCacheDispatcher = ReactCurrentCache.current;
  ReactCurrentCache.current = DefaultCacheDispatcher;
  return prevCacheDispatcher;
}
function renderDidSuspendDelayIfPossible() {
  workInProgressRootExitStatus = 4;
  null === workInProgressRoot ||
    (0 === (workInProgressRootSkippedLanes & 268435455) &&
      0 === (workInProgressRootInterleavedUpdatedLanes & 268435455)) ||
    markRootSuspended$1(workInProgressRoot, workInProgressRootRenderLanes);
}
function renderRootSync(root, lanes) {
  var prevExecutionContext = executionContext;
  executionContext |= 2;
  var prevDispatcher = pushDispatcher(root.containerInfo),
    prevCacheDispatcher = pushCacheDispatcher();
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes)
    (workInProgressTransitions = getTransitionsForLanes(root, lanes)),
      prepareFreshStack(root, lanes);
  do
    try {
      if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
        lanes = workInProgress;
        var thrownValue = workInProgressThrownValue;
        workInProgressSuspendedReason = 0;
        workInProgressThrownValue = null;
        unwindSuspendedUnitOfWork(lanes, thrownValue);
      }
      workLoopSync();
      break;
    } catch (thrownValue$131) {
      handleThrow(root, thrownValue$131);
    }
  while (1);
  resetContextDependencies();
  executionContext = prevExecutionContext;
  ReactCurrentDispatcher$2.current = prevDispatcher;
  ReactCurrentCache.current = prevCacheDispatcher;
  if (null !== workInProgress) throw Error(formatProdErrorMessage(261));
  workInProgressRoot = null;
  workInProgressRootRenderLanes = 0;
  finishQueueingConcurrentUpdates();
  return workInProgressRootExitStatus;
}
function workLoopSync() {
  for (; null !== workInProgress; ) performUnitOfWork(workInProgress);
}
function renderRootConcurrent(root, lanes) {
  var prevExecutionContext = executionContext;
  executionContext |= 2;
  var prevDispatcher = pushDispatcher(root.containerInfo),
    prevCacheDispatcher = pushCacheDispatcher();
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes)
    (workInProgressTransitions = getTransitionsForLanes(root, lanes)),
      (workInProgressRootRenderTargetTime = now() + 500),
      prepareFreshStack(root, lanes);
  a: do
    try {
      if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
        lanes = workInProgress;
        var thrownValue = workInProgressThrownValue;
        switch (workInProgressSuspendedReason) {
          case 1:
            workInProgressSuspendedReason = 0;
            workInProgressThrownValue = null;
            unwindSuspendedUnitOfWork(lanes, thrownValue);
            break;
          case 2:
            if (isThenableResolved(thrownValue)) {
              workInProgressSuspendedReason = 0;
              workInProgressThrownValue = null;
              replaySuspendedUnitOfWork(lanes);
              break;
            }
            lanes = function() {
              ensureRootIsScheduled(root, now());
            };
            thrownValue.then(lanes, lanes);
            break a;
          case 3:
            workInProgressSuspendedReason = 5;
            break a;
          case 5:
            isThenableResolved(thrownValue)
              ? ((workInProgressSuspendedReason = 0),
                (workInProgressThrownValue = null),
                replaySuspendedUnitOfWork(lanes))
              : ((workInProgressSuspendedReason = 0),
                (workInProgressThrownValue = null),
                unwindSuspendedUnitOfWork(lanes, thrownValue));
            break;
          case 4:
            workInProgressSuspendedReason = 0;
            workInProgressThrownValue = null;
            unwindSuspendedUnitOfWork(lanes, thrownValue);
            break;
          default:
            throw Error(formatProdErrorMessage(462));
        }
      }
      workLoopConcurrent();
      break;
    } catch (thrownValue$133) {
      handleThrow(root, thrownValue$133);
    }
  while (1);
  resetContextDependencies();
  ReactCurrentDispatcher$2.current = prevDispatcher;
  ReactCurrentCache.current = prevCacheDispatcher;
  executionContext = prevExecutionContext;
  if (null !== workInProgress) return 0;
  workInProgressRoot = null;
  workInProgressRootRenderLanes = 0;
  finishQueueingConcurrentUpdates();
  return workInProgressRootExitStatus;
}
function workLoopConcurrent() {
  for (; null !== workInProgress && !shouldYield(); )
    performUnitOfWork(workInProgress);
}
function performUnitOfWork(unitOfWork) {
  var next = beginWork$1(unitOfWork.alternate, unitOfWork, renderLanes$1);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  null === next ? completeUnitOfWork(unitOfWork) : (workInProgress = next);
  ReactCurrentOwner$2.current = null;
}
function replaySuspendedUnitOfWork(unitOfWork) {
  var current = unitOfWork.alternate;
  switch (unitOfWork.tag) {
    case 2:
      unitOfWork.tag = 0;
    case 0:
    case 11:
      var Component = unitOfWork.type,
        unresolvedProps = unitOfWork.pendingProps;
      unresolvedProps =
        unitOfWork.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      current = replayFunctionComponent(
        current,
        unitOfWork,
        unresolvedProps,
        Component,
        workInProgressRootRenderLanes
      );
      break;
    case 15:
      current = replayFunctionComponent(
        current,
        unitOfWork,
        unitOfWork.pendingProps,
        unitOfWork.type,
        workInProgressRootRenderLanes
      );
      break;
    default:
      resetContextDependencies(),
        resetHooksOnUnwind(),
        unwindInterruptedWork(current, unitOfWork),
        (unitOfWork = workInProgress = resetWorkInProgress(
          unitOfWork,
          renderLanes$1
        )),
        (current = beginWork$1(current, unitOfWork, renderLanes$1));
  }
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  null === current
    ? completeUnitOfWork(unitOfWork)
    : (workInProgress = current);
  ReactCurrentOwner$2.current = null;
}
function unwindSuspendedUnitOfWork(unitOfWork, thrownValue) {
  resetContextDependencies();
  resetHooksOnUnwind();
  var returnFiber = unitOfWork.return;
  if (null === returnFiber || null === workInProgressRoot)
    (workInProgressRootExitStatus = 1),
      (workInProgressRootFatalError = thrownValue),
      (workInProgress = null);
  else {
    try {
      a: {
        var root = workInProgressRoot,
          value = thrownValue;
        thrownValue = workInProgressRootRenderLanes;
        unitOfWork.flags |= 32768;
        if (
          null !== value &&
          "object" === typeof value &&
          "function" === typeof value.then
        ) {
          var wakeable = value;
          if (enableLazyContextPropagation) {
            var currentSourceFiber = unitOfWork.alternate;
            null !== currentSourceFiber &&
              propagateParentContextChanges(
                currentSourceFiber,
                unitOfWork,
                thrownValue,
                !0
              );
          }
          var tag = unitOfWork.tag;
          if (
            0 === (unitOfWork.mode & 1) &&
            (0 === tag || 11 === tag || 15 === tag)
          ) {
            var currentSource = unitOfWork.alternate;
            currentSource
              ? ((unitOfWork.updateQueue = currentSource.updateQueue),
                (unitOfWork.memoizedState = currentSource.memoizedState),
                (unitOfWork.lanes = currentSource.lanes))
              : ((unitOfWork.updateQueue = null),
                (unitOfWork.memoizedState = null));
          }
          var suspenseBoundary = suspenseHandlerStackCursor.current;
          if (null !== suspenseBoundary) {
            switch (suspenseBoundary.tag) {
              case 13:
                suspenseBoundary.flags &= -257;
                if (0 === (suspenseBoundary.mode & 1))
                  if (suspenseBoundary === returnFiber)
                    suspenseBoundary.flags |= 65536;
                  else {
                    suspenseBoundary.flags |= 128;
                    unitOfWork.flags |= 131072;
                    unitOfWork.flags &= -52805;
                    if (1 === unitOfWork.tag)
                      if (null === unitOfWork.alternate) unitOfWork.tag = 17;
                      else {
                        var update = createUpdate(-1, 1);
                        update.tag = 2;
                        enqueueUpdate$1(unitOfWork, update, 1);
                      }
                    unitOfWork.lanes |= 1;
                  }
                else
                  (suspenseBoundary.flags |= 65536),
                    (suspenseBoundary.lanes = thrownValue);
                var wakeables = suspenseBoundary.updateQueue;
                null === wakeables
                  ? (suspenseBoundary.updateQueue = new Set([wakeable]))
                  : wakeables.add(wakeable);
                break;
              case 22:
                if (suspenseBoundary.mode & 1) {
                  suspenseBoundary.flags |= 65536;
                  var offscreenQueue = suspenseBoundary.updateQueue;
                  if (null === offscreenQueue) {
                    var newOffscreenQueue = {
                      transitions: null,
                      markerInstances: null,
                      wakeables: new Set([wakeable])
                    };
                    suspenseBoundary.updateQueue = newOffscreenQueue;
                  } else {
                    var wakeables$35 = offscreenQueue.wakeables;
                    null === wakeables$35
                      ? (offscreenQueue.wakeables = new Set([wakeable]))
                      : wakeables$35.add(wakeable);
                  }
                  break;
                }
              default:
                throw Error(formatProdErrorMessage(435, suspenseBoundary.tag));
            }
            suspenseBoundary.mode & 1 &&
              attachPingListener(root, wakeable, thrownValue);
            break a;
          } else if (1 === root.tag) {
            attachPingListener(root, wakeable, thrownValue);
            renderDidSuspendDelayIfPossible();
            break a;
          } else value = Error(formatProdErrorMessage(426));
        }
        root = value = createCapturedValueAtFiber(value, unitOfWork);
        4 !== workInProgressRootExitStatus &&
          (workInProgressRootExitStatus = 2);
        null === workInProgressRootConcurrentErrors
          ? (workInProgressRootConcurrentErrors = [root])
          : workInProgressRootConcurrentErrors.push(root);
        root = returnFiber;
        do {
          switch (root.tag) {
            case 3:
              var errorInfo = value;
              root.flags |= 65536;
              thrownValue &= -thrownValue;
              root.lanes |= thrownValue;
              var update$jscomp$0 = createRootErrorUpdate(
                root,
                errorInfo,
                thrownValue
              );
              enqueueCapturedUpdate(root, update$jscomp$0);
              break a;
            case 1:
              currentSourceFiber = value;
              var ctor = root.type,
                instance = root.stateNode;
              if (
                0 === (root.flags & 128) &&
                ("function" === typeof ctor.getDerivedStateFromError ||
                  (null !== instance &&
                    "function" === typeof instance.componentDidCatch &&
                    (null === legacyErrorBoundariesThatAlreadyFailed ||
                      !legacyErrorBoundariesThatAlreadyFailed.has(instance))))
              ) {
                root.flags |= 65536;
                update$jscomp$0 = thrownValue & -thrownValue;
                root.lanes |= update$jscomp$0;
                errorInfo = createClassErrorUpdate(
                  root,
                  currentSourceFiber,
                  update$jscomp$0
                );
                enqueueCapturedUpdate(root, errorInfo);
                break a;
              }
          }
          root = root.return;
        } while (null !== root);
      }
    } catch (error) {
      throw ((workInProgress = returnFiber), error);
    }
    completeUnitOfWork(unitOfWork);
  }
}
function completeUnitOfWork(unitOfWork) {
  var completedWork = unitOfWork;
  do {
    var current = completedWork.alternate;
    unitOfWork = completedWork.return;
    if (0 === (completedWork.flags & 32768)) {
      if (
        ((current = completeWork(current, completedWork, renderLanes$1)),
        null !== current)
      ) {
        workInProgress = current;
        return;
      }
    } else {
      current = unwindWork(current, completedWork);
      if (null !== current) {
        current.flags &= 16383;
        workInProgress = current;
        return;
      }
      if (null !== unitOfWork)
        (unitOfWork.flags |= 32768),
          (unitOfWork.subtreeFlags = 0),
          (unitOfWork.deletions = null);
      else {
        workInProgressRootExitStatus = 6;
        workInProgress = null;
        return;
      }
    }
    completedWork = completedWork.sibling;
    if (null !== completedWork) {
      workInProgress = completedWork;
      return;
    }
    workInProgress = completedWork = unitOfWork;
  } while (null !== completedWork);
  0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 5);
}
function commitRoot(root, recoverableErrors, transitions) {
  var previousUpdateLanePriority = currentUpdatePriority,
    prevTransition = ReactCurrentBatchConfig$2.transition;
  try {
    (ReactCurrentBatchConfig$2.transition = null),
      (currentUpdatePriority = 1),
      commitRootImpl(
        root,
        recoverableErrors,
        transitions,
        previousUpdateLanePriority
      );
  } finally {
    (ReactCurrentBatchConfig$2.transition = prevTransition),
      (currentUpdatePriority = previousUpdateLanePriority);
  }
  return null;
}
function commitRootImpl(
  root,
  recoverableErrors,
  transitions,
  renderPriorityLevel
) {
  do flushPassiveEffects();
  while (null !== rootWithPendingPassiveEffects);
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
  var finishedWork = root.finishedWork,
    lanes = root.finishedLanes;
  if (null === finishedWork) return null;
  root.finishedWork = null;
  root.finishedLanes = 0;
  if (finishedWork === root.current) throw Error(formatProdErrorMessage(177));
  root.callbackNode = null;
  root.callbackPriority = 0;
  var remainingLanes = finishedWork.lanes | finishedWork.childLanes;
  remainingLanes |= concurrentlyUpdatedLanes;
  markRootFinished(root, remainingLanes);
  root === workInProgressRoot &&
    ((workInProgress = workInProgressRoot = null),
    (workInProgressRootRenderLanes = 0));
  (0 === (finishedWork.subtreeFlags & 10256) &&
    0 === (finishedWork.flags & 10256)) ||
    rootDoesHavePassiveEffects ||
    ((rootDoesHavePassiveEffects = !0),
    (pendingPassiveEffectsRemainingLanes = remainingLanes),
    (pendingPassiveTransitions = transitions),
    scheduleCallback$2(NormalPriority, function() {
      flushPassiveEffects();
      return null;
    }));
  transitions = 0 !== (finishedWork.flags & 15990);
  if (0 !== (finishedWork.subtreeFlags & 15990) || transitions) {
    transitions = ReactCurrentBatchConfig$2.transition;
    ReactCurrentBatchConfig$2.transition = null;
    var previousPriority = currentUpdatePriority;
    currentUpdatePriority = 1;
    var prevExecutionContext = executionContext;
    executionContext |= 4;
    ReactCurrentOwner$2.current = null;
    commitBeforeMutationEffects(root, finishedWork);
    commitMutationEffectsOnFiber(finishedWork, root);
    root.current = finishedWork;
    commitLayoutEffectOnFiber(root, finishedWork.alternate, finishedWork);
    requestPaint();
    executionContext = prevExecutionContext;
    currentUpdatePriority = previousPriority;
    ReactCurrentBatchConfig$2.transition = transitions;
  } else root.current = finishedWork;
  rootDoesHavePassiveEffects
    ? ((rootDoesHavePassiveEffects = !1),
      (rootWithPendingPassiveEffects = root),
      (pendingPassiveEffectsLanes = lanes))
    : releaseRootPooledCache(root, remainingLanes);
  remainingLanes = root.pendingLanes;
  0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
  onCommitRoot(finishedWork.stateNode, renderPriorityLevel);
  ensureRootIsScheduled(root, now());
  if (null !== recoverableErrors)
    for (
      renderPriorityLevel = root.onRecoverableError, finishedWork = 0;
      finishedWork < recoverableErrors.length;
      finishedWork++
    )
      (lanes = recoverableErrors[finishedWork]),
        (remainingLanes = {
          digest: lanes.digest,
          componentStack: lanes.stack
        }),
        renderPriorityLevel(lanes.value, remainingLanes);
  if (hasUncaughtError)
    throw ((hasUncaughtError = !1),
    (root = firstUncaughtError),
    (firstUncaughtError = null),
    root);
  0 !== (pendingPassiveEffectsLanes & 1) &&
    0 !== root.tag &&
    flushPassiveEffects();
  remainingLanes = root.pendingLanes;
  0 !== (remainingLanes & 1)
    ? root === rootWithNestedUpdates
      ? nestedUpdateCount++
      : ((nestedUpdateCount = 0), (rootWithNestedUpdates = root))
    : (nestedUpdateCount = 0);
  flushSyncCallbacks();
  return null;
}
function releaseRootPooledCache(root, remainingLanes) {
  0 === (root.pooledCacheLanes &= remainingLanes) &&
    ((remainingLanes = root.pooledCache),
    null != remainingLanes &&
      ((root.pooledCache = null), releaseCache(remainingLanes)));
}
function flushPassiveEffects() {
  if (null !== rootWithPendingPassiveEffects) {
    var root = rootWithPendingPassiveEffects,
      remainingLanes = pendingPassiveEffectsRemainingLanes;
    pendingPassiveEffectsRemainingLanes = 0;
    var renderPriority = lanesToEventPriority(pendingPassiveEffectsLanes);
    renderPriority = 16 > renderPriority ? 16 : renderPriority;
    var prevTransition = ReactCurrentBatchConfig$2.transition,
      previousPriority = currentUpdatePriority;
    try {
      return (
        (ReactCurrentBatchConfig$2.transition = null),
        (currentUpdatePriority = renderPriority),
        flushPassiveEffectsImpl()
      );
    } finally {
      (currentUpdatePriority = previousPriority),
        (ReactCurrentBatchConfig$2.transition = prevTransition),
        releaseRootPooledCache(root, remainingLanes);
    }
  }
  return !1;
}
function flushPassiveEffectsImpl() {
  if (null === rootWithPendingPassiveEffects) return !1;
  var transitions = pendingPassiveTransitions;
  pendingPassiveTransitions = null;
  var root = rootWithPendingPassiveEffects,
    lanes = pendingPassiveEffectsLanes;
  rootWithPendingPassiveEffects = null;
  pendingPassiveEffectsLanes = 0;
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(331));
  var prevExecutionContext = executionContext;
  executionContext |= 4;
  commitPassiveUnmountOnFiber(root.current);
  commitPassiveMountOnFiber(root, root.current, lanes, transitions);
  executionContext = prevExecutionContext;
  flushSyncCallbacks();
  if (enableTransitionTracing) {
    var prevPendingTransitionCallbacks = currentPendingTransitionCallbacks,
      prevRootTransitionCallbacks = root.transitionCallbacks,
      prevEndTime = currentEndTime;
    null !== prevPendingTransitionCallbacks &&
      null !== prevRootTransitionCallbacks &&
      null !== prevEndTime &&
      ((currentEndTime = currentPendingTransitionCallbacks = null),
      scheduleCallback$2(IdlePriority, function() {
        processTransitionCallbacks(
          prevPendingTransitionCallbacks,
          prevEndTime,
          prevRootTransitionCallbacks
        );
      }));
  }
  if (injectedHook && "function" === typeof injectedHook.onPostCommitFiberRoot)
    try {
      injectedHook.onPostCommitFiberRoot(rendererID, root);
    } catch (err) {}
  return !0;
}
function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
  sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
  sourceFiber = createRootErrorUpdate(rootFiber, sourceFiber, 1);
  rootFiber = enqueueUpdate$1(rootFiber, sourceFiber, 1);
  sourceFiber = requestEventTime();
  null !== rootFiber &&
    (markRootUpdated(rootFiber, 1, sourceFiber),
    ensureRootIsScheduled(rootFiber, sourceFiber));
}
function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
  if (3 === sourceFiber.tag)
    captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
  else
    for (
      nearestMountedAncestor = skipUnmountedBoundaries
        ? nearestMountedAncestor
        : sourceFiber.return;
      null !== nearestMountedAncestor;

    ) {
      if (3 === nearestMountedAncestor.tag) {
        captureCommitPhaseErrorOnRoot(
          nearestMountedAncestor,
          sourceFiber,
          error
        );
        break;
      } else if (1 === nearestMountedAncestor.tag) {
        var instance = nearestMountedAncestor.stateNode;
        if (
          "function" ===
            typeof nearestMountedAncestor.type.getDerivedStateFromError ||
          ("function" === typeof instance.componentDidCatch &&
            (null === legacyErrorBoundariesThatAlreadyFailed ||
              !legacyErrorBoundariesThatAlreadyFailed.has(instance)))
        ) {
          sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
          sourceFiber = createClassErrorUpdate(
            nearestMountedAncestor,
            sourceFiber,
            1
          );
          nearestMountedAncestor = enqueueUpdate$1(
            nearestMountedAncestor,
            sourceFiber,
            1
          );
          sourceFiber = requestEventTime();
          null !== nearestMountedAncestor &&
            (markRootUpdated(nearestMountedAncestor, 1, sourceFiber),
            ensureRootIsScheduled(nearestMountedAncestor, sourceFiber));
          break;
        }
      }
      nearestMountedAncestor = nearestMountedAncestor.return;
    }
}
function attachPingListener(root, wakeable, lanes) {
  var pingCache = root.pingCache;
  if (null === pingCache) {
    pingCache = root.pingCache = new PossiblyWeakMap();
    var threadIDs = new Set();
    pingCache.set(wakeable, threadIDs);
  } else
    (threadIDs = pingCache.get(wakeable)),
      void 0 === threadIDs &&
        ((threadIDs = new Set()), pingCache.set(wakeable, threadIDs));
  threadIDs.has(lanes) ||
    ((workInProgressRootDidAttachPingListener = !0),
    threadIDs.add(lanes),
    (root = pingSuspendedRoot.bind(null, root, wakeable, lanes)),
    wakeable.then(root, root));
}
function pingSuspendedRoot(root, wakeable, pingedLanes) {
  var pingCache = root.pingCache;
  null !== pingCache && pingCache.delete(wakeable);
  wakeable = requestEventTime();
  root.pingedLanes |= root.suspendedLanes & pingedLanes;
  workInProgressRoot === root &&
    (workInProgressRootRenderLanes & pingedLanes) === pingedLanes &&
    (4 === workInProgressRootExitStatus ||
    (3 === workInProgressRootExitStatus &&
      (workInProgressRootRenderLanes & 130023424) ===
        workInProgressRootRenderLanes &&
      500 > now() - globalMostRecentFallbackTime)
      ? prepareFreshStack(root, 0)
      : (workInProgressRootPingedLanes |= pingedLanes));
  ensureRootIsScheduled(root, wakeable);
}
function retryTimedOutBoundary(boundaryFiber, retryLane) {
  0 === retryLane &&
    (0 === (boundaryFiber.mode & 1)
      ? (retryLane = 1)
      : ((retryLane = nextRetryLane),
        (nextRetryLane <<= 1),
        0 === (nextRetryLane & 130023424) && (nextRetryLane = 4194304)));
  var eventTime = requestEventTime();
  boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
  null !== boundaryFiber &&
    (markRootUpdated(boundaryFiber, retryLane, eventTime),
    ensureRootIsScheduled(boundaryFiber, eventTime));
}
function retryDehydratedSuspenseBoundary(boundaryFiber) {
  var suspenseState = boundaryFiber.memoizedState,
    retryLane = 0;
  null !== suspenseState && (retryLane = suspenseState.retryLane);
  retryTimedOutBoundary(boundaryFiber, retryLane);
}
function resolveRetryWakeable(boundaryFiber, wakeable) {
  var retryLane = 0;
  switch (boundaryFiber.tag) {
    case 13:
      var retryCache = boundaryFiber.stateNode;
      var suspenseState = boundaryFiber.memoizedState;
      null !== suspenseState && (retryLane = suspenseState.retryLane);
      break;
    case 19:
      retryCache = boundaryFiber.stateNode;
      break;
    case 22:
      retryCache = boundaryFiber.stateNode._retryCache;
      break;
    default:
      throw Error(formatProdErrorMessage(314));
  }
  null !== retryCache && retryCache.delete(wakeable);
  retryTimedOutBoundary(boundaryFiber, retryLane);
}
var beginWork$1;
beginWork$1 = function(current, workInProgress, renderLanes) {
  if (null !== current)
    if (current.memoizedProps !== workInProgress.pendingProps)
      didReceiveUpdate = !0;
    else {
      if (
        !checkScheduledUpdateOrContext(current, renderLanes) &&
        0 === (workInProgress.flags & 128)
      )
        return (
          (didReceiveUpdate = !1),
          attemptEarlyBailoutIfNoScheduledUpdate(
            current,
            workInProgress,
            renderLanes
          )
        );
      didReceiveUpdate = 0 !== (current.flags & 131072) ? !0 : !1;
    }
  else didReceiveUpdate = !1;
  workInProgress.lanes = 0;
  switch (workInProgress.tag) {
    case 2:
      var Component = workInProgress.type;
      resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress);
      current = workInProgress.pendingProps;
      prepareToReadContext(workInProgress, renderLanes);
      current = renderWithHooks(
        null,
        workInProgress,
        Component,
        current,
        void 0,
        renderLanes
      );
      workInProgress.flags |= 1;
      workInProgress.tag = 0;
      reconcileChildren(null, workInProgress, current, renderLanes);
      workInProgress = workInProgress.child;
      return workInProgress;
    case 16:
      Component = workInProgress.elementType;
      a: {
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress);
        current = workInProgress.pendingProps;
        var init = Component._init;
        Component = init(Component._payload);
        workInProgress.type = Component;
        init = workInProgress.tag = resolveLazyComponentTag(Component);
        current = resolveDefaultProps(Component, current);
        switch (init) {
          case 0:
            workInProgress = updateFunctionComponent(
              null,
              workInProgress,
              Component,
              current,
              renderLanes
            );
            break a;
          case 1:
            workInProgress = updateClassComponent(
              null,
              workInProgress,
              Component,
              current,
              renderLanes
            );
            break a;
          case 11:
            workInProgress = updateForwardRef(
              null,
              workInProgress,
              Component,
              current,
              renderLanes
            );
            break a;
          case 14:
            workInProgress = updateMemoComponent(
              null,
              workInProgress,
              Component,
              resolveDefaultProps(Component.type, current),
              renderLanes
            );
            break a;
        }
        throw Error(formatProdErrorMessage(306, Component, ""));
      }
      return workInProgress;
    case 0:
      return (
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (init =
          workInProgress.elementType === Component
            ? init
            : resolveDefaultProps(Component, init)),
        updateFunctionComponent(
          current,
          workInProgress,
          Component,
          init,
          renderLanes
        )
      );
    case 1:
      return (
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (init =
          workInProgress.elementType === Component
            ? init
            : resolveDefaultProps(Component, init)),
        updateClassComponent(
          current,
          workInProgress,
          Component,
          init,
          renderLanes
        )
      );
    case 3:
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      if (null === current) throw Error(formatProdErrorMessage(387));
      var nextProps = workInProgress.pendingProps;
      init = workInProgress.memoizedState;
      Component = init.element;
      cloneUpdateQueue(current, workInProgress);
      processUpdateQueue(workInProgress, nextProps, null, renderLanes);
      nextProps = workInProgress.memoizedState;
      enableTransitionTracing &&
        push(transitionStack, workInProgressTransitions);
      enableTransitionTracing && pushRootMarkerInstance(workInProgress);
      var nextCache = nextProps.cache;
      pushProvider(workInProgress, CacheContext, nextCache);
      nextCache !== init.cache &&
        propagateContextChange(workInProgress, CacheContext, renderLanes);
      init = nextProps.element;
      init === Component
        ? (workInProgress = bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderLanes
          ))
        : (reconcileChildren(current, workInProgress, init, renderLanes),
          (workInProgress = workInProgress.child));
      return workInProgress;
    case 26:
    case 27:
    case 5:
      return (
        pushHostContext(workInProgress),
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (nextProps = null !== current ? current.memoizedProps : null),
        (nextCache = init.children),
        shouldSetTextContent(Component, init)
          ? (nextCache = null)
          : null !== nextProps &&
            shouldSetTextContent(Component, nextProps) &&
            (workInProgress.flags |= 32),
        markRef(current, workInProgress),
        reconcileChildren(current, workInProgress, nextCache, renderLanes),
        workInProgress.child
      );
    case 6:
      return null;
    case 13:
      return updateSuspenseComponent(current, workInProgress, renderLanes);
    case 4:
      return (
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        ),
        (Component = workInProgress.pendingProps),
        null === current
          ? (workInProgress.child = reconcileChildFibers(
              workInProgress,
              null,
              Component,
              renderLanes
            ))
          : reconcileChildren(current, workInProgress, Component, renderLanes),
        workInProgress.child
      );
    case 11:
      return (
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (init =
          workInProgress.elementType === Component
            ? init
            : resolveDefaultProps(Component, init)),
        updateForwardRef(current, workInProgress, Component, init, renderLanes)
      );
    case 7:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps,
          renderLanes
        ),
        workInProgress.child
      );
    case 8:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 12:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 10:
      a: {
        Component = workInProgress.type._context;
        init = workInProgress.pendingProps;
        nextProps = workInProgress.memoizedProps;
        nextCache = init.value;
        pushProvider(workInProgress, Component, nextCache);
        if (!enableLazyContextPropagation && null !== nextProps)
          if (objectIs(nextProps.value, nextCache)) {
            if (nextProps.children === init.children) {
              workInProgress = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress,
                renderLanes
              );
              break a;
            }
          } else propagateContextChange(workInProgress, Component, renderLanes);
        reconcileChildren(current, workInProgress, init.children, renderLanes);
        workInProgress = workInProgress.child;
      }
      return workInProgress;
    case 9:
      return (
        (init = workInProgress.type),
        (Component = workInProgress.pendingProps.children),
        prepareToReadContext(workInProgress, renderLanes),
        (init = readContext(init)),
        (Component = Component(init)),
        (workInProgress.flags |= 1),
        reconcileChildren(current, workInProgress, Component, renderLanes),
        workInProgress.child
      );
    case 14:
      return (
        (Component = workInProgress.type),
        (init = resolveDefaultProps(Component, workInProgress.pendingProps)),
        (init = resolveDefaultProps(Component.type, init)),
        updateMemoComponent(
          current,
          workInProgress,
          Component,
          init,
          renderLanes
        )
      );
    case 15:
      return updateSimpleMemoComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        renderLanes
      );
    case 17:
      return (
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (init =
          workInProgress.elementType === Component
            ? init
            : resolveDefaultProps(Component, init)),
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
        (workInProgress.tag = 1),
        prepareToReadContext(workInProgress, renderLanes),
        constructClassInstance(workInProgress, Component, init),
        mountClassInstance(workInProgress, Component, init, renderLanes),
        finishClassComponent(
          null,
          workInProgress,
          Component,
          !0,
          !1,
          renderLanes
        )
      );
    case 19:
      return updateSuspenseListComponent(current, workInProgress, renderLanes);
    case 21:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 22:
      return updateOffscreenComponent(current, workInProgress, renderLanes);
    case 23:
      return updateOffscreenComponent(current, workInProgress, renderLanes);
    case 24:
      return (
        prepareToReadContext(workInProgress, renderLanes),
        (Component = readContext(CacheContext)),
        null === current
          ? ((init = peekCacheFromPool()),
            null === init &&
              ((init = workInProgressRoot),
              (nextProps = createCache()),
              (init.pooledCache = nextProps),
              nextProps.refCount++,
              null !== nextProps && (init.pooledCacheLanes |= renderLanes),
              (init = nextProps)),
            (workInProgress.memoizedState = { parent: Component, cache: init }),
            initializeUpdateQueue(workInProgress),
            pushProvider(workInProgress, CacheContext, init))
          : (0 !== (current.lanes & renderLanes) &&
              (cloneUpdateQueue(current, workInProgress),
              processUpdateQueue(workInProgress, null, null, renderLanes)),
            (init = current.memoizedState),
            (nextProps = workInProgress.memoizedState),
            init.parent !== Component
              ? ((init = { parent: Component, cache: Component }),
                (workInProgress.memoizedState = init),
                0 === workInProgress.lanes &&
                  (workInProgress.memoizedState = workInProgress.updateQueue.baseState = init),
                pushProvider(workInProgress, CacheContext, Component))
              : ((Component = nextProps.cache),
                pushProvider(workInProgress, CacheContext, Component),
                Component !== init.cache &&
                  propagateContextChange(
                    workInProgress,
                    CacheContext,
                    renderLanes
                  ))),
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 25:
      if (enableTransitionTracing)
        return (
          enableTransitionTracing
            ? (null === current &&
                ((Component = enableTransitionTracing
                  ? transitionStack.current
                  : null),
                null !== Component &&
                  ((Component = {
                    tag: 1,
                    transitions: new Set(Component),
                    pendingBoundaries: null,
                    name: workInProgress.pendingProps.name,
                    aborts: null
                  }),
                  (workInProgress.stateNode = Component),
                  (workInProgress.flags |= 2048))),
              (Component = workInProgress.stateNode),
              null !== Component &&
                pushMarkerInstance(workInProgress, Component),
              reconcileChildren(
                current,
                workInProgress,
                workInProgress.pendingProps.children,
                renderLanes
              ),
              (workInProgress = workInProgress.child))
            : (workInProgress = null),
          workInProgress
        );
  }
  throw Error(formatProdErrorMessage(156, workInProgress.tag));
};
function scheduleCallback$2(priorityLevel, callback) {
  return scheduleCallback(priorityLevel, callback);
}
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;
  this.key = key;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.refCleanup = this.ref = null;
  this.pendingProps = pendingProps;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = mode;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function createFiber(tag, pendingProps, key, mode) {
  return new FiberNode(tag, pendingProps, key, mode);
}
function shouldConstruct(Component) {
  Component = Component.prototype;
  return !(!Component || !Component.isReactComponent);
}
function resolveLazyComponentTag(Component) {
  if ("function" === typeof Component)
    return shouldConstruct(Component) ? 1 : 0;
  if (void 0 !== Component && null !== Component) {
    Component = Component.$$typeof;
    if (Component === REACT_FORWARD_REF_TYPE) return 11;
    if (Component === REACT_MEMO_TYPE) return 14;
  }
  return 2;
}
function createWorkInProgress(current, pendingProps) {
  var workInProgress = current.alternate;
  null === workInProgress
    ? ((workInProgress = createFiber(
        current.tag,
        pendingProps,
        current.key,
        current.mode
      )),
      (workInProgress.elementType = current.elementType),
      (workInProgress.type = current.type),
      (workInProgress.stateNode = current.stateNode),
      (workInProgress.alternate = current),
      (current.alternate = workInProgress))
    : ((workInProgress.pendingProps = pendingProps),
      (workInProgress.type = current.type),
      (workInProgress.flags = 0),
      (workInProgress.subtreeFlags = 0),
      (workInProgress.deletions = null));
  workInProgress.flags = current.flags & 14680064;
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  pendingProps = current.dependencies;
  workInProgress.dependencies =
    null === pendingProps
      ? null
      : { lanes: pendingProps.lanes, firstContext: pendingProps.firstContext };
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  workInProgress.refCleanup = current.refCleanup;
  return workInProgress;
}
function resetWorkInProgress(workInProgress, renderLanes) {
  workInProgress.flags &= 14680066;
  var current = workInProgress.alternate;
  null === current
    ? ((workInProgress.childLanes = 0),
      (workInProgress.lanes = renderLanes),
      (workInProgress.child = null),
      (workInProgress.subtreeFlags = 0),
      (workInProgress.memoizedProps = null),
      (workInProgress.memoizedState = null),
      (workInProgress.updateQueue = null),
      (workInProgress.dependencies = null),
      (workInProgress.stateNode = null))
    : ((workInProgress.childLanes = current.childLanes),
      (workInProgress.lanes = current.lanes),
      (workInProgress.child = current.child),
      (workInProgress.subtreeFlags = 0),
      (workInProgress.deletions = null),
      (workInProgress.memoizedProps = current.memoizedProps),
      (workInProgress.memoizedState = current.memoizedState),
      (workInProgress.updateQueue = current.updateQueue),
      (workInProgress.type = current.type),
      (renderLanes = current.dependencies),
      (workInProgress.dependencies =
        null === renderLanes
          ? null
          : {
              lanes: renderLanes.lanes,
              firstContext: renderLanes.firstContext
            }));
  return workInProgress;
}
function createFiberFromTypeAndProps(
  type,
  key,
  pendingProps,
  owner,
  mode,
  lanes
) {
  var fiberTag = 2;
  owner = type;
  if ("function" === typeof type) shouldConstruct(type) && (fiberTag = 1);
  else if ("string" === typeof type) fiberTag = 5;
  else
    a: switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(pendingProps.children, mode, lanes, key);
      case REACT_STRICT_MODE_TYPE:
        fiberTag = 8;
        mode |= 8;
        0 !== (mode & 1) && (mode |= 16);
        break;
      case REACT_PROFILER_TYPE:
        return (
          (type = createFiber(12, pendingProps, key, mode | 2)),
          (type.elementType = REACT_PROFILER_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_SUSPENSE_TYPE:
        return (
          (type = createFiber(13, pendingProps, key, mode)),
          (type.elementType = REACT_SUSPENSE_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_SUSPENSE_LIST_TYPE:
        return (
          (type = createFiber(19, pendingProps, key, mode)),
          (type.elementType = REACT_SUSPENSE_LIST_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_OFFSCREEN_TYPE:
        return createFiberFromOffscreen(pendingProps, mode, lanes, key);
      case REACT_LEGACY_HIDDEN_TYPE:
        return createFiberFromLegacyHidden(pendingProps, mode, lanes, key);
      case REACT_SCOPE_TYPE:
        return (
          (pendingProps = createFiber(21, pendingProps, key, mode)),
          (pendingProps.type = type),
          (pendingProps.elementType = type),
          (pendingProps.lanes = lanes),
          pendingProps
        );
      case REACT_CACHE_TYPE:
        return (
          (type = createFiber(24, pendingProps, key, mode)),
          (type.elementType = REACT_CACHE_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_TRACING_MARKER_TYPE:
        if (enableTransitionTracing)
          return (
            (type = createFiber(25, pendingProps, key, mode)),
            (type.elementType = REACT_TRACING_MARKER_TYPE),
            (type.lanes = lanes),
            (type.stateNode = {
              tag: 1,
              transitions: null,
              pendingBoundaries: null,
              aborts: null,
              name: pendingProps.name
            }),
            type
          );
      case REACT_DEBUG_TRACING_MODE_TYPE:
        if (enableDebugTracing) {
          fiberTag = 8;
          mode |= 4;
          break;
        }
      default:
        if ("object" === typeof type && null !== type)
          switch (type.$$typeof) {
            case REACT_PROVIDER_TYPE:
              fiberTag = 10;
              break a;
            case REACT_CONTEXT_TYPE:
              fiberTag = 9;
              break a;
            case REACT_FORWARD_REF_TYPE:
              fiberTag = 11;
              break a;
            case REACT_MEMO_TYPE:
              fiberTag = 14;
              break a;
            case REACT_LAZY_TYPE:
              fiberTag = 16;
              owner = null;
              break a;
          }
        throw Error(
          formatProdErrorMessage(130, null == type ? type : typeof type, "")
        );
    }
  pendingProps = createFiber(fiberTag, pendingProps, key, mode);
  pendingProps.elementType = type;
  pendingProps.type = owner;
  pendingProps.lanes = lanes;
  return pendingProps;
}
function createFiberFromFragment(elements, mode, lanes, key) {
  elements = createFiber(7, elements, key, mode);
  elements.lanes = lanes;
  return elements;
}
function createFiberFromOffscreen(pendingProps, mode, lanes, key) {
  pendingProps = createFiber(22, pendingProps, key, mode);
  pendingProps.elementType = REACT_OFFSCREEN_TYPE;
  pendingProps.lanes = lanes;
  var primaryChildInstance = {
    _visibility: 1,
    _pendingVisibility: 1,
    _pendingMarkers: null,
    _retryCache: null,
    _transitions: null,
    _current: null,
    detach: function() {
      return detachOffscreenInstance(primaryChildInstance);
    },
    attach: function() {
      return attachOffscreenInstance(primaryChildInstance);
    }
  };
  pendingProps.stateNode = primaryChildInstance;
  return pendingProps;
}
function createFiberFromLegacyHidden(pendingProps, mode, lanes, key) {
  pendingProps = createFiber(23, pendingProps, key, mode);
  pendingProps.elementType = REACT_LEGACY_HIDDEN_TYPE;
  pendingProps.lanes = lanes;
  var instance = {
    _visibility: 1,
    _pendingVisibility: 1,
    _pendingMarkers: null,
    _transitions: null,
    _retryCache: null,
    _current: null,
    detach: function() {
      return detachOffscreenInstance(instance);
    },
    attach: function() {
      return attachOffscreenInstance(instance);
    }
  };
  pendingProps.stateNode = instance;
  return pendingProps;
}
function createFiberFromText(content, mode, lanes) {
  content = createFiber(6, content, null, mode);
  content.lanes = lanes;
  return content;
}
function createFiberFromPortal(portal, mode, lanes) {
  mode = createFiber(
    4,
    null !== portal.children ? portal.children : [],
    portal.key,
    mode
  );
  mode.lanes = lanes;
  mode.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null,
    implementation: portal.implementation
  };
  return mode;
}
function FiberRootNode(
  containerInfo,
  tag,
  hydrate,
  identifierPrefix,
  onRecoverableError
) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.callbackNode = this.pendingContext = this.context = null;
  this.callbackPriority = 0;
  this.eventTimes = createLaneMap(0);
  this.expirationTimes = createLaneMap(-1);
  this.entangledLanes = this.errorRecoveryDisabledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
  this.entanglements = createLaneMap(0);
  this.hiddenUpdates = createLaneMap(null);
  this.identifierPrefix = identifierPrefix;
  this.onRecoverableError = onRecoverableError;
  this.pooledCache = null;
  this.pooledCacheLanes = 0;
  this.hydrationCallbacks = null;
  this.incompleteTransitions = new Map();
  if (enableTransitionTracing)
    for (
      this.transitionCallbacks = null,
        containerInfo = this.transitionLanes = [],
        tag = 0;
      31 > tag;
      tag++
    )
      containerInfo.push(null);
}
function updateContainer(element, container, parentComponent, callback) {
  parentComponent = container.current;
  var eventTime = requestEventTime(),
    lane = requestUpdateLane(parentComponent);
  null === container.context
    ? (container.context = emptyContextObject)
    : (container.pendingContext = emptyContextObject);
  container = createUpdate(eventTime, lane);
  container.payload = { element: element };
  callback = void 0 === callback ? null : callback;
  null !== callback && (container.callback = callback);
  element = enqueueUpdate$1(parentComponent, container, lane);
  null !== element &&
    (scheduleUpdateOnFiber(element, parentComponent, lane, eventTime),
    entangleTransitions(element, parentComponent, lane));
  return lane;
}
function emptyFindFiberByHostInstance() {
  return null;
}
Mode$1.setCurrent(FastNoSideEffects);
var slice = Array.prototype.slice,
  LinearGradient = (function() {
    function LinearGradient(stops, x1, y1, x2, y2) {
      this._args = slice.call(arguments);
    }
    LinearGradient.prototype.applyFill = function(node) {
      node.fillLinear.apply(node, this._args);
    };
    return LinearGradient;
  })(),
  RadialGradient = (function() {
    function RadialGradient(stops, fx, fy, rx, ry, cx, cy) {
      this._args = slice.call(arguments);
    }
    RadialGradient.prototype.applyFill = function(node) {
      node.fillRadial.apply(node, this._args);
    };
    return RadialGradient;
  })(),
  Pattern = (function() {
    function Pattern(url, width, height, left, top) {
      this._args = slice.call(arguments);
    }
    Pattern.prototype.applyFill = function(node) {
      node.fillImage.apply(node, this._args);
    };
    return Pattern;
  })(),
  Surface = (function(_React$Component) {
    function Surface() {
      return _React$Component.apply(this, arguments) || this;
    }
    _inheritsLoose(Surface, _React$Component);
    var _proto4 = Surface.prototype;
    _proto4.componentDidMount = function() {
      var _this$props = this.props;
      this._surface = Mode$1.Surface(
        +_this$props.width,
        +_this$props.height,
        this._tagRef
      );
      _this$props = new FiberRootNode(this._surface, 0, !1, "", void 0);
      _this$props.hydrationCallbacks = null;
      enableTransitionTracing && (_this$props.transitionCallbacks = void 0);
      var JSCompiler_inline_result = createFiber(3, null, null, 0);
      _this$props.current = JSCompiler_inline_result;
      JSCompiler_inline_result.stateNode = _this$props;
      var initialCache = createCache();
      initialCache.refCount++;
      _this$props.pooledCache = initialCache;
      initialCache.refCount++;
      JSCompiler_inline_result.memoizedState = {
        element: null,
        isDehydrated: !1,
        cache: initialCache
      };
      initializeUpdateQueue(JSCompiler_inline_result);
      this._mountNode = _this$props;
      updateContainer(this.props.children, this._mountNode, this);
    };
    _proto4.componentDidUpdate = function(prevProps) {
      var props = this.props;
      (props.height === prevProps.height && props.width === prevProps.width) ||
        this._surface.resize(+props.width, +props.height);
      updateContainer(this.props.children, this._mountNode, this);
      this._surface.render && this._surface.render();
    };
    _proto4.componentWillUnmount = function() {
      updateContainer(null, this._mountNode, this);
    };
    _proto4.render = function() {
      var $jscomp$this = this,
        props = this.props;
      return React.createElement(Mode$1.Surface.tagName, {
        ref: function(ref) {
          return ($jscomp$this._tagRef = ref);
        },
        accessKey: props.accessKey,
        className: props.className,
        draggable: props.draggable,
        role: props.role,
        style: props.style,
        tabIndex: props.tabIndex,
        title: props.title
      });
    };
    return Surface;
  })(React.Component),
  Text = (function(_React$Component2) {
    function Text(props) {
      var _this = _React$Component2.call(this, props) || this;
      ["height", "width", "x", "y"].forEach(function(key) {
        Object.defineProperty(_assertThisInitialized(_this), key, {
          get: function() {
            return this._text ? this._text[key] : void 0;
          }
        });
      });
      return _this;
    }
    _inheritsLoose(Text, _React$Component2);
    Text.prototype.render = function() {
      var $jscomp$this = this;
      return React.createElement(
        TYPES.TEXT,
        _extends({}, this.props, {
          ref: function(t) {
            return ($jscomp$this._text = t);
          }
        }),
        childrenAsString(this.props.children)
      );
    };
    return Text;
  })(React.Component),
  devToolsConfig$jscomp$inline_1154 = {
    findFiberByHostInstance: function() {
      return null;
    },
    bundleType: 0,
    version: "18.3.0-www-modern-84a0a171e-20221214",
    rendererPackageName: "react-art"
  };
var internals$jscomp$inline_1329 = {
  bundleType: devToolsConfig$jscomp$inline_1154.bundleType,
  version: devToolsConfig$jscomp$inline_1154.version,
  rendererPackageName: devToolsConfig$jscomp$inline_1154.rendererPackageName,
  rendererConfig: devToolsConfig$jscomp$inline_1154.rendererConfig,
  overrideHookState: null,
  overrideHookStateDeletePath: null,
  overrideHookStateRenamePath: null,
  overrideProps: null,
  overridePropsDeletePath: null,
  overridePropsRenamePath: null,
  setErrorHandler: null,
  setSuspenseHandler: null,
  scheduleUpdate: null,
  currentDispatcherRef: ReactSharedInternals.ReactCurrentDispatcher,
  findHostInstanceByFiber: function(fiber) {
    fiber = findCurrentFiberUsingSlowPath(fiber);
    fiber = null !== fiber ? findCurrentHostFiberImpl(fiber) : null;
    return null === fiber ? null : fiber.stateNode;
  },
  findFiberByHostInstance:
    devToolsConfig$jscomp$inline_1154.findFiberByHostInstance ||
    emptyFindFiberByHostInstance,
  findHostInstancesForRefresh: null,
  scheduleRefresh: null,
  scheduleRoot: null,
  setRefreshHandler: null,
  getCurrentFiber: null,
  reconcilerVersion: "18.3.0-next-84a0a171e-20221214"
};
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var hook$jscomp$inline_1330 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (
    !hook$jscomp$inline_1330.isDisabled &&
    hook$jscomp$inline_1330.supportsFiber
  )
    try {
      (rendererID = hook$jscomp$inline_1330.inject(
        internals$jscomp$inline_1329
      )),
        (injectedHook = hook$jscomp$inline_1330);
    } catch (err) {}
}
var Path = Mode$1.Path;
exports.Transform = Transform;
exports.ClippingRectangle = TYPES.CLIPPING_RECTANGLE;
exports.Group = TYPES.GROUP;
exports.LinearGradient = LinearGradient;
exports.Path = Path;
exports.Pattern = Pattern;
exports.RadialGradient = RadialGradient;
exports.Shape = TYPES.SHAPE;
exports.Surface = Surface;
exports.Text = Text;
