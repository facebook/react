/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @generated SignedSource<<839a1ddc7e6dd708b23f2243d86967ce>>
 */

/*
 Modernizr 3.0.0pre (Custom Build) | MIT
*/
"use strict";
var dynamicFlagsUntyped = require("ReactNativeInternalFeatureFlags"),
  Scheduler = require("scheduler"),
  React = require("react"),
  ReactDOM = require("react-dom");
function formatProdErrorMessage(code) {
  var url = "https://react.dev/errors/" + code;
  if (1 < arguments.length) {
    url += "?args[]=" + encodeURIComponent(arguments[1]);
    for (var i = 2; i < arguments.length; i++)
      url += "&args[]=" + encodeURIComponent(arguments[i]);
  }
  return (
    "Minified React error #" +
    code +
    "; visit " +
    url +
    " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
  );
}
var alwaysThrottleRetries = dynamicFlagsUntyped.alwaysThrottleRetries,
  enableHiddenSubtreeInsertionEffectCleanup =
    dynamicFlagsUntyped.enableHiddenSubtreeInsertionEffectCleanup,
  enableObjectFiber = dynamicFlagsUntyped.enableObjectFiber,
  renameElementSymbol = dynamicFlagsUntyped.renameElementSymbol,
  enableFragmentRefs = dynamicFlagsUntyped.enableFragmentRefs,
  enableFragmentRefsScrollIntoView =
    dynamicFlagsUntyped.enableFragmentRefsScrollIntoView,
  enableComponentPerformanceTrack =
    dynamicFlagsUntyped.enableComponentPerformanceTrack;
function isValidContainer(node) {
  return !(
    !node ||
    (1 !== node.nodeType && 9 !== node.nodeType && 11 !== node.nodeType)
  );
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
function getSuspenseInstanceFromFiber(fiber) {
  if (13 === fiber.tag) {
    var suspenseState = fiber.memoizedState;
    null === suspenseState &&
      ((fiber = fiber.alternate),
      null !== fiber && (suspenseState = fiber.memoizedState));
    if (null !== suspenseState) return suspenseState.dehydrated;
  }
  return null;
}
function getActivityInstanceFromFiber(fiber) {
  if (31 === fiber.tag) {
    var activityState = fiber.memoizedState;
    null === activityState &&
      ((fiber = fiber.alternate),
      null !== fiber && (activityState = fiber.memoizedState));
    if (null !== activityState) return activityState.dehydrated;
  }
  return null;
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
function traverseVisibleHostChildren(child, searchWithinHosts, fn, a, b, c) {
  for (; null !== child; ) {
    if (
      (5 === child.tag && fn(child, a, b, c)) ||
      ((22 !== child.tag || null === child.memoizedState) &&
        (searchWithinHosts || 5 !== child.tag) &&
        traverseVisibleHostChildren(
          child.child,
          searchWithinHosts,
          fn,
          a,
          b,
          c
        ))
    )
      return !0;
    child = child.sibling;
  }
  return !1;
}
function getFragmentParentHostFiber(fiber) {
  for (fiber = fiber.return; null !== fiber; ) {
    if (3 === fiber.tag || 5 === fiber.tag) return fiber;
    fiber = fiber.return;
  }
  return null;
}
function findFragmentInstanceSiblings(result, self, child) {
  for (
    var foundSelf =
      3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : !1;
    null !== child;

  ) {
    if (child === self)
      if (((foundSelf = !0), child.sibling)) child = child.sibling;
      else return !0;
    if (5 === child.tag) {
      if (foundSelf) return (result[1] = child), !0;
      result[0] = child;
    } else if (
      (22 !== child.tag || null === child.memoizedState) &&
      findFragmentInstanceSiblings(result, self, child.child, foundSelf)
    )
      return !0;
    child = child.sibling;
  }
  return !1;
}
function getInstanceFromHostFiber(fiber) {
  switch (fiber.tag) {
    case 5:
      return fiber.stateNode;
    case 3:
      return fiber.stateNode.containerInfo;
    default:
      throw Error(formatProdErrorMessage(559));
  }
}
var searchTarget = null,
  searchBoundary = null;
function findNextSibling(child) {
  searchTarget = child;
  return !0;
}
function isFiberPrecedingCheck(child, target, boundary) {
  return child === boundary
    ? !0
    : child === target
      ? ((searchTarget = child), !0)
      : !1;
}
function isFiberFollowingCheck(child, target, boundary) {
  return child === boundary
    ? ((searchBoundary = child), !1)
    : child === target
      ? (null !== searchBoundary && (searchTarget = child), !0)
      : !1;
}
function getParentForFragmentAncestors(inst) {
  if (null === inst) return null;
  do inst = null === inst ? null : inst.return;
  while (inst && 5 !== inst.tag && 27 !== inst.tag && 3 !== inst.tag);
  return inst ? inst : null;
}
function getLowestCommonAncestor(instA, instB, getParent) {
  for (var depthA = 0, tempA = instA; tempA; tempA = getParent(tempA)) depthA++;
  tempA = 0;
  for (var tempB = instB; tempB; tempB = getParent(tempB)) tempA++;
  for (; 0 < depthA - tempA; ) (instA = getParent(instA)), depthA--;
  for (; 0 < tempA - depthA; ) (instB = getParent(instB)), tempA--;
  for (; depthA--; ) {
    if (instA === instB || (null !== instB && instA === instB.alternate))
      return instA;
    instA = getParent(instA);
    instB = getParent(instB);
  }
  return null;
}
var assign = Object.assign,
  REACT_LEGACY_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_ELEMENT_TYPE = renameElementSymbol
    ? Symbol.for("react.transitional.element")
    : REACT_LEGACY_ELEMENT_TYPE,
  REACT_PORTAL_TYPE = Symbol.for("react.portal"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
  REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
  REACT_CONSUMER_TYPE = Symbol.for("react.consumer"),
  REACT_CONTEXT_TYPE = Symbol.for("react.context"),
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
  REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
  REACT_MEMO_TYPE = Symbol.for("react.memo"),
  REACT_LAZY_TYPE = Symbol.for("react.lazy");
Symbol.for("react.scope");
var REACT_ACTIVITY_TYPE = Symbol.for("react.activity");
Symbol.for("react.legacy_hidden");
Symbol.for("react.tracing_marker");
var REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel");
Symbol.for("react.view_transition");
var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
var REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
function getComponentNameFromType(type) {
  if (null == type) return null;
  if ("function" === typeof type)
    return type.$$typeof === REACT_CLIENT_REFERENCE
      ? null
      : type.displayName || type.name || null;
  if ("string" === typeof type) return type;
  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return "Fragment";
    case REACT_PROFILER_TYPE:
      return "Profiler";
    case REACT_STRICT_MODE_TYPE:
      return "StrictMode";
    case REACT_SUSPENSE_TYPE:
      return "Suspense";
    case REACT_SUSPENSE_LIST_TYPE:
      return "SuspenseList";
    case REACT_ACTIVITY_TYPE:
      return "Activity";
  }
  if ("object" === typeof type)
    switch (type.$$typeof) {
      case REACT_PORTAL_TYPE:
        return "Portal";
      case REACT_CONTEXT_TYPE:
        return type.displayName || "Context";
      case REACT_CONSUMER_TYPE:
        return (type._context.displayName || "Context") + ".Consumer";
      case REACT_FORWARD_REF_TYPE:
        var innerType = type.render;
        type = type.displayName;
        type ||
          ((type = innerType.displayName || innerType.name || ""),
          (type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef"));
        return type;
      case REACT_MEMO_TYPE:
        return (
          (innerType = type.displayName || null),
          null !== innerType
            ? innerType
            : getComponentNameFromType(type.type) || "Memo"
        );
      case REACT_LAZY_TYPE:
        innerType = type._payload;
        type = type._init;
        try {
          return getComponentNameFromType(type(innerType));
        } catch (x) {}
    }
  return null;
}
function getComponentNameFromFiber(fiber) {
  var type = fiber.type;
  switch (fiber.tag) {
    case 31:
      return "Activity";
    case 24:
      return "Cache";
    case 9:
      return (type._context.displayName || "Context") + ".Consumer";
    case 10:
      return type.displayName || "Context";
    case 18:
      return "DehydratedFragment";
    case 11:
      return (
        (fiber = type.render),
        (fiber = fiber.displayName || fiber.name || ""),
        type.displayName ||
          ("" !== fiber ? "ForwardRef(" + fiber + ")" : "ForwardRef")
      );
    case 7:
      return "Fragment";
    case 26:
    case 27:
    case 5:
      return type;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return getComponentNameFromType(type);
    case 8:
      return type === REACT_STRICT_MODE_TYPE ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 30:
    case 17:
    case 28:
    case 1:
    case 0:
    case 14:
    case 15:
      if ("function" === typeof type)
        return type.displayName || type.name || null;
      if ("string" === typeof type) return type;
  }
  return null;
}
var isArrayImpl = Array.isArray,
  ReactSharedInternals =
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  ReactDOMSharedInternals =
    ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  sharedNotPendingObject = {
    pending: !1,
    data: null,
    method: null,
    action: null
  },
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
var contextStackCursor$1 = createCursor(null),
  contextFiberStackCursor = createCursor(null),
  rootInstanceStackCursor = createCursor(null),
  hostTransitionProviderCursor = createCursor(null);
function pushHostContainer(fiber, nextRootInstance) {
  push(rootInstanceStackCursor, nextRootInstance);
  push(contextFiberStackCursor, fiber);
  push(contextStackCursor$1, null);
  switch (nextRootInstance.nodeType) {
    case 9:
    case 11:
      fiber = (fiber = nextRootInstance.documentElement)
        ? (fiber = fiber.namespaceURI)
          ? getOwnHostContext(fiber)
          : 0
        : 0;
      break;
    default:
      if (
        ((fiber = nextRootInstance.tagName),
        (nextRootInstance = nextRootInstance.namespaceURI))
      )
        (nextRootInstance = getOwnHostContext(nextRootInstance)),
          (fiber = getChildHostContextProd(nextRootInstance, fiber));
      else
        switch (fiber) {
          case "svg":
            fiber = 1;
            break;
          case "math":
            fiber = 2;
            break;
          default:
            fiber = 0;
        }
  }
  pop(contextStackCursor$1);
  push(contextStackCursor$1, fiber);
}
function popHostContainer() {
  pop(contextStackCursor$1);
  pop(contextFiberStackCursor);
  pop(rootInstanceStackCursor);
}
function pushHostContext(fiber) {
  null !== fiber.memoizedState && push(hostTransitionProviderCursor, fiber);
  var context = contextStackCursor$1.current;
  var JSCompiler_inline_result = getChildHostContextProd(context, fiber.type);
  context !== JSCompiler_inline_result &&
    (push(contextFiberStackCursor, fiber),
    push(contextStackCursor$1, JSCompiler_inline_result));
}
function popHostContext(fiber) {
  contextFiberStackCursor.current === fiber &&
    (pop(contextStackCursor$1), pop(contextFiberStackCursor));
  hostTransitionProviderCursor.current === fiber &&
    (pop(hostTransitionProviderCursor),
    (HostTransitionContext._currentValue = sharedNotPendingObject));
}
var prefix, suffix;
function describeBuiltInComponentFrame(name) {
  if (void 0 === prefix)
    try {
      throw Error();
    } catch (x) {
      var match = x.stack.trim().match(/\n( *(at )?)/);
      prefix = (match && match[1]) || "";
      suffix =
        -1 < x.stack.indexOf("\n    at")
          ? " (<anonymous>)"
          : -1 < x.stack.indexOf("@")
            ? "@unknown:0:0"
            : "";
    }
  return "\n" + prefix + name + suffix;
}
var reentry = !1;
function describeNativeComponentFrame(fn, construct) {
  if (!fn || reentry) return "";
  reentry = !0;
  var previousPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    var RunInRootFrame = {
      DetermineComponentFrameRoot: function () {
        try {
          if (construct) {
            var Fake = function () {
              throw Error();
            };
            Object.defineProperty(Fake.prototype, "props", {
              set: function () {
                throw Error();
              }
            });
            if ("object" === typeof Reflect && Reflect.construct) {
              try {
                Reflect.construct(Fake, []);
              } catch (x) {
                var control = x;
              }
              Reflect.construct(fn, [], Fake);
            } else {
              try {
                Fake.call();
              } catch (x$1) {
                control = x$1;
              }
              fn.call(Fake.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (x$2) {
              control = x$2;
            }
            (Fake = fn()) &&
              "function" === typeof Fake.catch &&
              Fake.catch(function () {});
          }
        } catch (sample) {
          if (sample && control && "string" === typeof sample.stack)
            return [sample.stack, control.stack];
        }
        return [null, null];
      }
    };
    RunInRootFrame.DetermineComponentFrameRoot.displayName =
      "DetermineComponentFrameRoot";
    var namePropDescriptor = Object.getOwnPropertyDescriptor(
      RunInRootFrame.DetermineComponentFrameRoot,
      "name"
    );
    namePropDescriptor &&
      namePropDescriptor.configurable &&
      Object.defineProperty(
        RunInRootFrame.DetermineComponentFrameRoot,
        "name",
        { value: "DetermineComponentFrameRoot" }
      );
    var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(),
      sampleStack = _RunInRootFrame$Deter[0],
      controlStack = _RunInRootFrame$Deter[1];
    if (sampleStack && controlStack) {
      var sampleLines = sampleStack.split("\n"),
        controlLines = controlStack.split("\n");
      for (
        namePropDescriptor = RunInRootFrame = 0;
        RunInRootFrame < sampleLines.length &&
        !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot");

      )
        RunInRootFrame++;
      for (
        ;
        namePropDescriptor < controlLines.length &&
        !controlLines[namePropDescriptor].includes(
          "DetermineComponentFrameRoot"
        );

      )
        namePropDescriptor++;
      if (
        RunInRootFrame === sampleLines.length ||
        namePropDescriptor === controlLines.length
      )
        for (
          RunInRootFrame = sampleLines.length - 1,
            namePropDescriptor = controlLines.length - 1;
          1 <= RunInRootFrame &&
          0 <= namePropDescriptor &&
          sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor];

        )
          namePropDescriptor--;
      for (
        ;
        1 <= RunInRootFrame && 0 <= namePropDescriptor;
        RunInRootFrame--, namePropDescriptor--
      )
        if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
          if (1 !== RunInRootFrame || 1 !== namePropDescriptor) {
            do
              if (
                (RunInRootFrame--,
                namePropDescriptor--,
                0 > namePropDescriptor ||
                  sampleLines[RunInRootFrame] !==
                    controlLines[namePropDescriptor])
              ) {
                var frame =
                  "\n" +
                  sampleLines[RunInRootFrame].replace(" at new ", " at ");
                fn.displayName &&
                  frame.includes("<anonymous>") &&
                  (frame = frame.replace("<anonymous>", fn.displayName));
                return frame;
              }
            while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
          }
          break;
        }
    }
  } finally {
    (reentry = !1), (Error.prepareStackTrace = previousPrepareStackTrace);
  }
  return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "")
    ? describeBuiltInComponentFrame(previousPrepareStackTrace)
    : "";
}
function describeFiber(fiber, childFiber) {
  switch (fiber.tag) {
    case 26:
    case 27:
    case 5:
      return describeBuiltInComponentFrame(fiber.type);
    case 16:
      return describeBuiltInComponentFrame("Lazy");
    case 13:
      return fiber.child !== childFiber && null !== childFiber
        ? describeBuiltInComponentFrame("Suspense Fallback")
        : describeBuiltInComponentFrame("Suspense");
    case 19:
      return describeBuiltInComponentFrame("SuspenseList");
    case 0:
    case 15:
      return describeNativeComponentFrame(fiber.type, !1);
    case 11:
      return describeNativeComponentFrame(fiber.type.render, !1);
    case 1:
      return describeNativeComponentFrame(fiber.type, !0);
    case 31:
      return describeBuiltInComponentFrame("Activity");
    default:
      return "";
  }
}
function getStackByFiberInDevAndProd(workInProgress) {
  try {
    var info = "",
      previous = null;
    do
      (info += describeFiber(workInProgress, previous)),
        (previous = workInProgress),
        (workInProgress = workInProgress.return);
    while (workInProgress);
    return info;
  } catch (x) {
    return "\nError generating stack: " + x.message + "\n" + x.stack;
  }
}
var hasOwnProperty = Object.prototype.hasOwnProperty,
  scheduleCallback$3 = Scheduler.unstable_scheduleCallback,
  cancelCallback$1 = Scheduler.unstable_cancelCallback,
  shouldYield = Scheduler.unstable_shouldYield,
  requestPaint = Scheduler.unstable_requestPaint,
  now$1 = Scheduler.unstable_now,
  getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel,
  ImmediatePriority = Scheduler.unstable_ImmediatePriority,
  UserBlockingPriority = Scheduler.unstable_UserBlockingPriority,
  NormalPriority$1 = Scheduler.unstable_NormalPriority,
  LowPriority = Scheduler.unstable_LowPriority,
  IdlePriority = Scheduler.unstable_IdlePriority,
  log$1 = Scheduler.log,
  unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue,
  rendererID = null,
  injectedHook = null,
  injectedProfilingHooks = null,
  isDevToolsPresent = "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__;
function setIsStrictModeForDevtools(newIsStrictMode) {
  "function" === typeof log$1 && unstable_setDisableYieldValue(newIsStrictMode);
  if (injectedHook && "function" === typeof injectedHook.setStrictMode)
    try {
      injectedHook.setStrictMode(rendererID, newIsStrictMode);
    } catch (err) {}
}
function markCommitStopped() {
  null !== injectedProfilingHooks &&
    "function" === typeof injectedProfilingHooks.markCommitStopped &&
    injectedProfilingHooks.markCommitStopped();
}
function markComponentRenderStarted(fiber) {
  null !== injectedProfilingHooks &&
    "function" === typeof injectedProfilingHooks.markComponentRenderStarted &&
    injectedProfilingHooks.markComponentRenderStarted(fiber);
}
function markComponentRenderStopped() {
  null !== injectedProfilingHooks &&
    "function" === typeof injectedProfilingHooks.markComponentRenderStopped &&
    injectedProfilingHooks.markComponentRenderStopped();
}
function markRenderStarted(lanes) {
  null !== injectedProfilingHooks &&
    "function" === typeof injectedProfilingHooks.markRenderStarted &&
    injectedProfilingHooks.markRenderStarted(lanes);
}
function markRenderStopped() {
  null !== injectedProfilingHooks &&
    "function" === typeof injectedProfilingHooks.markRenderStopped &&
    injectedProfilingHooks.markRenderStopped();
}
function markStateUpdateScheduled(fiber, lane) {
  null !== injectedProfilingHooks &&
    "function" === typeof injectedProfilingHooks.markStateUpdateScheduled &&
    injectedProfilingHooks.markStateUpdateScheduled(fiber, lane);
}
var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback,
  log = Math.log,
  LN2 = Math.LN2;
function clz32Fallback(x) {
  x >>>= 0;
  return 0 === x ? 32 : (31 - ((log(x) / LN2) | 0)) | 0;
}
function getLabelForLane(lane) {
  if (lane & 1) return "SyncHydrationLane";
  if (lane & 2) return "Sync";
  if (lane & 4) return "InputContinuousHydration";
  if (lane & 8) return "InputContinuous";
  if (lane & 16) return "DefaultHydration";
  if (lane & 32) return "Default";
  if (lane & 128) return "TransitionHydration";
  if (lane & 4194048) return "Transition";
  if (lane & 62914560) return "Retry";
  if (lane & 67108864) return "SelectiveHydration";
  if (lane & 134217728) return "IdleHydration";
  if (lane & 268435456) return "Idle";
  if (lane & 536870912) return "Offscreen";
  if (lane & 1073741824) return "Deferred";
}
var nextTransitionUpdateLane = 256,
  nextTransitionDeferredLane = 262144,
  nextRetryLane = 4194304;
function getHighestPriorityLanes(lanes) {
  var pendingSyncLanes = lanes & 42;
  if (0 !== pendingSyncLanes) return pendingSyncLanes;
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
      return 64;
    case 128:
      return 128;
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
      return lanes & 261888;
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return lanes & 3932160;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
      return lanes & 62914560;
    case 67108864:
      return 67108864;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 0;
    default:
      return lanes;
  }
}
function getNextLanes(root, wipLanes, rootHasPendingCommit) {
  var pendingLanes = root.pendingLanes;
  if (0 === pendingLanes) return 0;
  var nextLanes = 0,
    suspendedLanes = root.suspendedLanes,
    pingedLanes = root.pingedLanes;
  root = root.warmLanes;
  var nonIdlePendingLanes = pendingLanes & 134217727;
  0 !== nonIdlePendingLanes
    ? ((pendingLanes = nonIdlePendingLanes & ~suspendedLanes),
      0 !== pendingLanes
        ? (nextLanes = getHighestPriorityLanes(pendingLanes))
        : ((pingedLanes &= nonIdlePendingLanes),
          0 !== pingedLanes
            ? (nextLanes = getHighestPriorityLanes(pingedLanes))
            : rootHasPendingCommit ||
              ((rootHasPendingCommit = nonIdlePendingLanes & ~root),
              0 !== rootHasPendingCommit &&
                (nextLanes = getHighestPriorityLanes(rootHasPendingCommit)))))
    : ((nonIdlePendingLanes = pendingLanes & ~suspendedLanes),
      0 !== nonIdlePendingLanes
        ? (nextLanes = getHighestPriorityLanes(nonIdlePendingLanes))
        : 0 !== pingedLanes
          ? (nextLanes = getHighestPriorityLanes(pingedLanes))
          : rootHasPendingCommit ||
            ((rootHasPendingCommit = pendingLanes & ~root),
            0 !== rootHasPendingCommit &&
              (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))));
  return 0 === nextLanes
    ? 0
    : 0 !== wipLanes &&
        wipLanes !== nextLanes &&
        0 === (wipLanes & suspendedLanes) &&
        ((suspendedLanes = nextLanes & -nextLanes),
        (rootHasPendingCommit = wipLanes & -wipLanes),
        suspendedLanes >= rootHasPendingCommit ||
          (32 === suspendedLanes && 0 !== (rootHasPendingCommit & 4194048)))
      ? wipLanes
      : nextLanes;
}
function checkIfRootIsPrerendering(root, renderLanes) {
  return (
    0 ===
    (root.pendingLanes &
      ~(root.suspendedLanes & ~root.pingedLanes) &
      renderLanes)
  );
}
function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case 1:
    case 2:
    case 4:
    case 8:
    case 64:
      return currentTime + 250;
    case 16:
    case 32:
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
      return -1;
    case 67108864:
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function claimNextRetryLane() {
  var lane = nextRetryLane;
  nextRetryLane <<= 1;
  0 === (nextRetryLane & 62914560) && (nextRetryLane = 4194304);
  return lane;
}
function createLaneMap(initial) {
  for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
  return laneMap;
}
function markRootUpdated$1(root, updateLane) {
  root.pendingLanes |= updateLane;
  root.indicatorLanes |= updateLane & 4194048;
  268435456 !== updateLane &&
    ((root.suspendedLanes = 0), (root.pingedLanes = 0), (root.warmLanes = 0));
}
function markRootFinished(
  root,
  finishedLanes,
  remainingLanes,
  spawnedLane,
  updatedLanes,
  suspendedRetryLanes
) {
  var previouslyPendingLanes = root.pendingLanes;
  root.pendingLanes = remainingLanes;
  root.suspendedLanes = 0;
  root.pingedLanes = 0;
  root.warmLanes = 0;
  root.indicatorLanes &= remainingLanes;
  root.expiredLanes &= remainingLanes;
  root.entangledLanes &= remainingLanes;
  root.errorRecoveryDisabledLanes &= remainingLanes;
  root.shellSuspendCounter = 0;
  var entanglements = root.entanglements,
    expirationTimes = root.expirationTimes,
    hiddenUpdates = root.hiddenUpdates;
  for (
    remainingLanes = previouslyPendingLanes & ~remainingLanes;
    0 < remainingLanes;

  ) {
    var index$7 = 31 - clz32(remainingLanes),
      lane = 1 << index$7;
    entanglements[index$7] = 0;
    expirationTimes[index$7] = -1;
    var hiddenUpdatesForLane = hiddenUpdates[index$7];
    if (null !== hiddenUpdatesForLane)
      for (
        hiddenUpdates[index$7] = null, index$7 = 0;
        index$7 < hiddenUpdatesForLane.length;
        index$7++
      ) {
        var update = hiddenUpdatesForLane[index$7];
        null !== update && (update.lane &= -536870913);
      }
    remainingLanes &= ~lane;
  }
  0 !== spawnedLane && markSpawnedDeferredLane(root, spawnedLane, 0);
  0 !== suspendedRetryLanes &&
    0 === updatedLanes &&
    (root.suspendedLanes |=
      suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
}
function markSpawnedDeferredLane(root, spawnedLane, entangledLanes) {
  root.pendingLanes |= spawnedLane;
  root.suspendedLanes &= ~spawnedLane;
  var spawnedLaneIndex = 31 - clz32(spawnedLane);
  root.entangledLanes |= spawnedLane;
  root.entanglements[spawnedLaneIndex] =
    root.entanglements[spawnedLaneIndex] |
    1073741824 |
    (entangledLanes & 261930);
}
function markRootEntangled(root, entangledLanes) {
  var rootEntangledLanes = (root.entangledLanes |= entangledLanes);
  for (root = root.entanglements; rootEntangledLanes; ) {
    var index$8 = 31 - clz32(rootEntangledLanes),
      lane = 1 << index$8;
    (lane & entangledLanes) | (root[index$8] & entangledLanes) &&
      (root[index$8] |= entangledLanes);
    rootEntangledLanes &= ~lane;
  }
}
function getBumpedLaneForHydration(root, renderLanes) {
  var renderLane = renderLanes & -renderLanes;
  renderLane =
    0 !== (renderLane & 42) ? 1 : getBumpedLaneForHydrationByLane(renderLane);
  return 0 !== (renderLane & (root.suspendedLanes | renderLanes))
    ? 0
    : renderLane;
}
function getBumpedLaneForHydrationByLane(lane) {
  switch (lane) {
    case 2:
      lane = 1;
      break;
    case 8:
      lane = 4;
      break;
    case 32:
      lane = 16;
      break;
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
      lane = 128;
      break;
    case 268435456:
      lane = 134217728;
      break;
    default:
      lane = 0;
  }
  return lane;
}
function addFiberToLanesMap(root, fiber, lanes) {
  if (isDevToolsPresent)
    for (root = root.pendingUpdatersLaneMap; 0 < lanes; ) {
      var index$10 = 31 - clz32(lanes),
        lane = 1 << index$10;
      root[index$10].add(fiber);
      lanes &= ~lane;
    }
}
function movePendingFibersToMemoized(root, lanes) {
  if (isDevToolsPresent)
    for (
      var pendingUpdatersLaneMap = root.pendingUpdatersLaneMap,
        memoizedUpdaters = root.memoizedUpdaters;
      0 < lanes;

    ) {
      var index$11 = 31 - clz32(lanes);
      root = 1 << index$11;
      index$11 = pendingUpdatersLaneMap[index$11];
      0 < index$11.size &&
        (index$11.forEach(function (fiber) {
          var alternate = fiber.alternate;
          (null !== alternate && memoizedUpdaters.has(alternate)) ||
            memoizedUpdaters.add(fiber);
        }),
        index$11.clear());
      lanes &= ~root;
    }
}
function lanesToEventPriority(lanes) {
  lanes &= -lanes;
  return 2 < lanes
    ? 8 < lanes
      ? 0 !== (lanes & 134217727)
        ? 32
        : 268435456
      : 8
    : 2;
}
function resolveUpdatePriority() {
  var updatePriority = ReactDOMSharedInternals.p;
  if (0 !== updatePriority) return updatePriority;
  updatePriority = window.event;
  return void 0 === updatePriority ? 32 : getEventPriority(updatePriority.type);
}
function runWithPriority(priority, fn) {
  var previousPriority = ReactDOMSharedInternals.p;
  try {
    return (ReactDOMSharedInternals.p = priority), fn();
  } finally {
    ReactDOMSharedInternals.p = previousPriority;
  }
}
var randomKey = Math.random().toString(36).slice(2),
  internalInstanceKey = "__reactFiber$" + randomKey,
  internalPropsKey = "__reactProps$" + randomKey,
  internalContainerInstanceKey = "__reactContainer$" + randomKey,
  internalEventHandlersKey = "__reactEvents$" + randomKey,
  internalEventHandlerListenersKey = "__reactListeners$" + randomKey,
  internalEventHandlesSetKey = "__reactHandles$" + randomKey,
  internalRootNodeResourcesKey = "__reactResources$" + randomKey,
  internalHoistableMarker = "__reactMarker$" + randomKey,
  internalScrollTimer = "__reactScroll$" + randomKey;
function detachDeletedInstance(node) {
  delete node[internalInstanceKey];
  delete node[internalPropsKey];
  delete node[internalEventHandlersKey];
  delete node[internalEventHandlerListenersKey];
  delete node[internalEventHandlesSetKey];
}
function getClosestInstanceFromNode(targetNode) {
  var targetInst = targetNode[internalInstanceKey];
  if (targetInst) return targetInst;
  for (var parentNode = targetNode.parentNode; parentNode; ) {
    if (
      (targetInst =
        parentNode[internalContainerInstanceKey] ||
        parentNode[internalInstanceKey])
    ) {
      parentNode = targetInst.alternate;
      if (
        null !== targetInst.child ||
        (null !== parentNode && null !== parentNode.child)
      )
        for (
          targetNode = getParentHydrationBoundary(targetNode);
          null !== targetNode;

        ) {
          if ((parentNode = targetNode[internalInstanceKey])) return parentNode;
          targetNode = getParentHydrationBoundary(targetNode);
        }
      return targetInst;
    }
    targetNode = parentNode;
    parentNode = targetNode.parentNode;
  }
  return null;
}
function getInstanceFromNode(node) {
  if (
    (node = node[internalInstanceKey] || node[internalContainerInstanceKey])
  ) {
    var tag = node.tag;
    if (
      5 === tag ||
      6 === tag ||
      13 === tag ||
      31 === tag ||
      26 === tag ||
      27 === tag ||
      3 === tag
    )
      return node;
  }
  return null;
}
function getNodeFromInstance(inst) {
  var tag = inst.tag;
  if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return inst.stateNode;
  throw Error(formatProdErrorMessage(33));
}
function getResourcesFromRoot(root) {
  var resources = root[internalRootNodeResourcesKey];
  resources ||
    (resources = root[internalRootNodeResourcesKey] =
      { hoistableStyles: new Map(), hoistableScripts: new Map() });
  return resources;
}
function markNodeAsHoistable(node) {
  node[internalHoistableMarker] = !0;
}
var allNativeEvents = new Set(),
  registrationNameDependencies = {};
function registerTwoPhaseEvent(registrationName, dependencies) {
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(registrationName + "Capture", dependencies);
}
function registerDirectEvent(registrationName, dependencies) {
  registrationNameDependencies[registrationName] = dependencies;
  for (
    registrationName = 0;
    registrationName < dependencies.length;
    registrationName++
  )
    allNativeEvents.add(dependencies[registrationName]);
}
var VALID_ATTRIBUTE_NAME_REGEX = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ),
  illegalAttributeNameCache = {},
  validatedAttributeNameCache = {};
function isAttributeNameSafe(attributeName) {
  if (hasOwnProperty.call(validatedAttributeNameCache, attributeName))
    return !0;
  if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) return !1;
  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName))
    return (validatedAttributeNameCache[attributeName] = !0);
  illegalAttributeNameCache[attributeName] = !0;
  return !1;
}
var rootMutationContext = !1;
function setValueForAttribute(node, name, value) {
  if (isAttributeNameSafe(name))
    if (null === value) node.removeAttribute(name);
    else {
      switch (typeof value) {
        case "undefined":
        case "function":
        case "symbol":
          node.removeAttribute(name);
          return;
        case "boolean":
          var prefix$12 = name.toLowerCase().slice(0, 5);
          if ("data-" !== prefix$12 && "aria-" !== prefix$12) {
            node.removeAttribute(name);
            return;
          }
      }
      node.setAttribute(name, "" + value);
    }
}
function setValueForKnownAttribute(node, name, value) {
  if (null === value) node.removeAttribute(name);
  else {
    switch (typeof value) {
      case "undefined":
      case "function":
      case "symbol":
      case "boolean":
        node.removeAttribute(name);
        return;
    }
    node.setAttribute(name, "" + value);
  }
}
function setValueForNamespacedAttribute(node, namespace, name, value) {
  if (null === value) node.removeAttribute(name);
  else {
    switch (typeof value) {
      case "undefined":
      case "function":
      case "symbol":
      case "boolean":
        node.removeAttribute(name);
        return;
    }
    node.setAttributeNS(namespace, name, "" + value);
  }
}
function getToStringValue(value) {
  switch (typeof value) {
    case "bigint":
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return value;
    case "object":
      return value;
    default:
      return "";
  }
}
function isCheckable(elem) {
  var type = elem.type;
  return (
    (elem = elem.nodeName) &&
    "input" === elem.toLowerCase() &&
    ("checkbox" === type || "radio" === type)
  );
}
function trackValueOnNode(node, valueField, currentValue) {
  var descriptor = Object.getOwnPropertyDescriptor(
    node.constructor.prototype,
    valueField
  );
  if (
    !node.hasOwnProperty(valueField) &&
    "undefined" !== typeof descriptor &&
    "function" === typeof descriptor.get &&
    "function" === typeof descriptor.set
  ) {
    var get = descriptor.get,
      set = descriptor.set;
    Object.defineProperty(node, valueField, {
      configurable: !0,
      get: function () {
        return get.call(this);
      },
      set: function (value) {
        currentValue = "" + value;
        set.call(this, value);
      }
    });
    Object.defineProperty(node, valueField, {
      enumerable: descriptor.enumerable
    });
    return {
      getValue: function () {
        return currentValue;
      },
      setValue: function (value) {
        currentValue = "" + value;
      },
      stopTracking: function () {
        node._valueTracker = null;
        delete node[valueField];
      }
    };
  }
}
function track(node) {
  if (!node._valueTracker) {
    var valueField = isCheckable(node) ? "checked" : "value";
    node._valueTracker = trackValueOnNode(
      node,
      valueField,
      "" + node[valueField]
    );
  }
}
function trackHydrated(node, initialValue, initialChecked) {
  if (node._valueTracker) return !1;
  if (isCheckable(node)) {
    var valueField = "checked";
    initialValue = "" + initialChecked;
  } else valueField = "value";
  initialChecked = "" + node[valueField];
  node._valueTracker = trackValueOnNode(node, valueField, initialValue);
  return initialChecked !== initialValue;
}
function updateValueIfChanged(node) {
  if (!node) return !1;
  var tracker = node._valueTracker;
  if (!tracker) return !0;
  var lastValue = tracker.getValue();
  var value = "";
  node &&
    (value = isCheckable(node)
      ? node.checked
        ? "true"
        : "false"
      : node.value);
  node = value;
  return node !== lastValue ? (tracker.setValue(node), !0) : !1;
}
function getActiveElement(doc) {
  doc = doc || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof doc) return null;
  try {
    return doc.activeElement || doc.body;
  } catch (e) {
    return doc.body;
  }
}
var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n"\\]/g;
function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
  return value.replace(
    escapeSelectorAttributeValueInsideDoubleQuotesRegex,
    function (ch) {
      return "\\" + ch.charCodeAt(0).toString(16) + " ";
    }
  );
}
function updateInput(
  element,
  value,
  defaultValue,
  lastDefaultValue,
  checked,
  defaultChecked,
  type,
  name
) {
  element.name = "";
  null != type &&
  "function" !== typeof type &&
  "symbol" !== typeof type &&
  "boolean" !== typeof type
    ? (element.type = type)
    : element.removeAttribute("type");
  if (null != value)
    if ("number" === type) {
      if ((0 === value && "" === element.value) || element.value != value)
        element.value = "" + getToStringValue(value);
    } else
      element.value !== "" + getToStringValue(value) &&
        (element.value = "" + getToStringValue(value));
  else
    ("submit" !== type && "reset" !== type) || element.removeAttribute("value");
  null != value
    ? setDefaultValue(element, type, getToStringValue(value))
    : null != defaultValue
      ? setDefaultValue(element, type, getToStringValue(defaultValue))
      : null != lastDefaultValue && element.removeAttribute("value");
  null == checked &&
    null != defaultChecked &&
    (element.defaultChecked = !!defaultChecked);
  null != checked &&
    (element.checked =
      checked && "function" !== typeof checked && "symbol" !== typeof checked);
  null != name &&
  "function" !== typeof name &&
  "symbol" !== typeof name &&
  "boolean" !== typeof name
    ? (element.name = "" + getToStringValue(name))
    : element.removeAttribute("name");
}
function setDefaultValue(node, type, value) {
  ("number" === type && getActiveElement(node.ownerDocument) === node) ||
    node.defaultValue === "" + value ||
    (node.defaultValue = "" + value);
}
function updateOptions(node, multiple, propValue, setDefaultSelected) {
  node = node.options;
  if (multiple) {
    multiple = {};
    for (var i = 0; i < propValue.length; i++)
      multiple["$" + propValue[i]] = !0;
    for (propValue = 0; propValue < node.length; propValue++)
      (i = multiple.hasOwnProperty("$" + node[propValue].value)),
        node[propValue].selected !== i && (node[propValue].selected = i),
        i && setDefaultSelected && (node[propValue].defaultSelected = !0);
  } else {
    propValue = "" + getToStringValue(propValue);
    multiple = null;
    for (i = 0; i < node.length; i++) {
      if (node[i].value === propValue) {
        node[i].selected = !0;
        setDefaultSelected && (node[i].defaultSelected = !0);
        return;
      }
      null !== multiple || node[i].disabled || (multiple = node[i]);
    }
    null !== multiple && (multiple.selected = !0);
  }
}
function updateTextarea(element, value, defaultValue) {
  if (
    null != value &&
    ((value = "" + getToStringValue(value)),
    value !== element.value && (element.value = value),
    null == defaultValue)
  ) {
    element.defaultValue !== value && (element.defaultValue = value);
    return;
  }
  element.defaultValue =
    null != defaultValue ? "" + getToStringValue(defaultValue) : "";
}
function setTextContent(node, text) {
  if (text) {
    var firstChild = node.firstChild;
    if (
      firstChild &&
      firstChild === node.lastChild &&
      3 === firstChild.nodeType
    ) {
      firstChild.nodeValue = text;
      return;
    }
  }
  node.textContent = text;
}
var unitlessNumbers = new Set(
  "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
    " "
  )
);
function setValueForStyle(style, styleName, value) {
  var isCustomProperty = 0 === styleName.indexOf("--");
  null == value || "boolean" === typeof value || "" === value
    ? isCustomProperty
      ? style.setProperty(styleName, "")
      : "float" === styleName
        ? (style.cssFloat = "")
        : (style[styleName] = "")
    : isCustomProperty
      ? style.setProperty(styleName, value)
      : "number" !== typeof value ||
          0 === value ||
          unitlessNumbers.has(styleName)
        ? "float" === styleName
          ? (style.cssFloat = value)
          : (style[styleName] = ("" + value).trim())
        : (style[styleName] = value + "px");
}
function setValueForStyles(node, styles, prevStyles) {
  if (null != styles && "object" !== typeof styles)
    throw Error(formatProdErrorMessage(62));
  node = node.style;
  if (null != prevStyles) {
    for (var styleName in prevStyles)
      !prevStyles.hasOwnProperty(styleName) ||
        (null != styles && styles.hasOwnProperty(styleName)) ||
        (0 === styleName.indexOf("--")
          ? node.setProperty(styleName, "")
          : "float" === styleName
            ? (node.cssFloat = "")
            : (node[styleName] = ""),
        (rootMutationContext = !0));
    for (var styleName$22 in styles)
      (styleName = styles[styleName$22]),
        styles.hasOwnProperty(styleName$22) &&
          prevStyles[styleName$22] !== styleName &&
          (setValueForStyle(node, styleName$22, styleName),
          (rootMutationContext = !0));
  } else
    for (var styleName$23 in styles)
      styles.hasOwnProperty(styleName$23) &&
        setValueForStyle(node, styleName$23, styles[styleName$23]);
}
function isCustomElement(tagName) {
  if (-1 === tagName.indexOf("-")) return !1;
  switch (tagName) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var aliases = new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]),
  isJavaScriptProtocol =
    /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
function sanitizeURL(url) {
  return isJavaScriptProtocol.test("" + url)
    ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')"
    : url;
}
function noop$1() {}
var currentReplayingEvent = null;
function getEventTarget(nativeEvent) {
  nativeEvent = nativeEvent.target || nativeEvent.srcElement || window;
  nativeEvent.correspondingUseElement &&
    (nativeEvent = nativeEvent.correspondingUseElement);
  return 3 === nativeEvent.nodeType ? nativeEvent.parentNode : nativeEvent;
}
var restoreTarget = null,
  restoreQueue = null;
function restoreStateOfTarget(target) {
  var internalInstance = getInstanceFromNode(target);
  if (internalInstance && (target = internalInstance.stateNode)) {
    var props = target[internalPropsKey] || null;
    a: switch (((target = internalInstance.stateNode), internalInstance.type)) {
      case "input":
        updateInput(
          target,
          props.value,
          props.defaultValue,
          props.defaultValue,
          props.checked,
          props.defaultChecked,
          props.type,
          props.name
        );
        internalInstance = props.name;
        if ("radio" === props.type && null != internalInstance) {
          for (props = target; props.parentNode; ) props = props.parentNode;
          props = props.querySelectorAll(
            'input[name="' +
              escapeSelectorAttributeValueInsideDoubleQuotes(
                "" + internalInstance
              ) +
              '"][type="radio"]'
          );
          for (
            internalInstance = 0;
            internalInstance < props.length;
            internalInstance++
          ) {
            var otherNode = props[internalInstance];
            if (otherNode !== target && otherNode.form === target.form) {
              var otherProps = otherNode[internalPropsKey] || null;
              if (!otherProps) throw Error(formatProdErrorMessage(90));
              updateInput(
                otherNode,
                otherProps.value,
                otherProps.defaultValue,
                otherProps.defaultValue,
                otherProps.checked,
                otherProps.defaultChecked,
                otherProps.type,
                otherProps.name
              );
            }
          }
          for (
            internalInstance = 0;
            internalInstance < props.length;
            internalInstance++
          )
            (otherNode = props[internalInstance]),
              otherNode.form === target.form && updateValueIfChanged(otherNode);
        }
        break a;
      case "textarea":
        updateTextarea(target, props.value, props.defaultValue);
        break a;
      case "select":
        (internalInstance = props.value),
          null != internalInstance &&
            updateOptions(target, !!props.multiple, internalInstance, !1);
    }
  }
}
var isInsideEventHandler = !1;
function batchedUpdates$1(fn, a, b) {
  if (isInsideEventHandler) return fn(a, b);
  isInsideEventHandler = !0;
  try {
    a: {
      b = executionContext;
      executionContext |= 1;
      try {
        var JSCompiler_inline_result = fn(a);
        break a;
      } finally {
        (executionContext = b),
          0 === executionContext &&
            ((workInProgressRootRenderTargetTime = now$1() + 500),
            flushSyncWorkAcrossRoots_impl(0, !0));
      }
      JSCompiler_inline_result = void 0;
    }
    return JSCompiler_inline_result;
  } finally {
    if (
      ((isInsideEventHandler = !1),
      null !== restoreTarget || null !== restoreQueue)
    )
      if (
        (flushSyncWork(),
        restoreTarget &&
          ((a = restoreTarget),
          (fn = restoreQueue),
          (restoreQueue = restoreTarget = null),
          restoreStateOfTarget(a),
          fn))
      )
        for (a = 0; a < fn.length; a++) restoreStateOfTarget(fn[a]);
  }
}
function getListener(inst, registrationName) {
  var stateNode = inst.stateNode;
  if (null === stateNode) return null;
  var props = stateNode[internalPropsKey] || null;
  if (null === props) return null;
  stateNode = props[registrationName];
  a: switch (registrationName) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (props = !props.disabled) ||
        ((inst = inst.type),
        (props = !(
          "button" === inst ||
          "input" === inst ||
          "select" === inst ||
          "textarea" === inst
        )));
      inst = !props;
      break a;
    default:
      inst = !1;
  }
  if (inst) return null;
  if (stateNode && "function" !== typeof stateNode)
    throw Error(
      formatProdErrorMessage(231, registrationName, typeof stateNode)
    );
  return stateNode;
}
var canUseDOM = !(
    "undefined" === typeof window ||
    "undefined" === typeof window.document ||
    "undefined" === typeof window.document.createElement
  ),
  passiveBrowserEventsSupported = !1;
if (canUseDOM)
  try {
    var options = {};
    Object.defineProperty(options, "passive", {
      get: function () {
        passiveBrowserEventsSupported = !0;
      }
    });
    window.addEventListener("test", options, options);
    window.removeEventListener("test", options, options);
  } catch (e) {
    passiveBrowserEventsSupported = !1;
  }
var root = null,
  startText = null,
  fallbackText = null;
function getData() {
  if (fallbackText) return fallbackText;
  var start,
    startValue = startText,
    startLength = startValue.length,
    end,
    endValue = "value" in root ? root.value : root.textContent,
    endLength = endValue.length;
  for (
    start = 0;
    start < startLength && startValue[start] === endValue[start];
    start++
  );
  var minEnd = startLength - start;
  for (
    end = 1;
    end <= minEnd &&
    startValue[startLength - end] === endValue[endLength - end];
    end++
  );
  return (fallbackText = endValue.slice(start, 1 < end ? 1 - end : void 0));
}
function getEventCharCode(nativeEvent) {
  var keyCode = nativeEvent.keyCode;
  "charCode" in nativeEvent
    ? ((nativeEvent = nativeEvent.charCode),
      0 === nativeEvent && 13 === keyCode && (nativeEvent = 13))
    : (nativeEvent = keyCode);
  10 === nativeEvent && (nativeEvent = 13);
  return 32 <= nativeEvent || 13 === nativeEvent ? nativeEvent : 0;
}
function functionThatReturnsTrue() {
  return !0;
}
function functionThatReturnsFalse() {
  return !1;
}
function createSyntheticEvent(Interface) {
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    this._reactName = reactName;
    this._targetInst = targetInst;
    this.type = reactEventType;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;
    this.currentTarget = null;
    for (var propName in Interface)
      Interface.hasOwnProperty(propName) &&
        ((reactName = Interface[propName]),
        (this[propName] = reactName
          ? reactName(nativeEvent)
          : nativeEvent[propName]));
    this.isDefaultPrevented = (
      null != nativeEvent.defaultPrevented
        ? nativeEvent.defaultPrevented
        : !1 === nativeEvent.returnValue
    )
      ? functionThatReturnsTrue
      : functionThatReturnsFalse;
    this.isPropagationStopped = functionThatReturnsFalse;
    return this;
  }
  assign(SyntheticBaseEvent.prototype, {
    preventDefault: function () {
      this.defaultPrevented = !0;
      var event = this.nativeEvent;
      event &&
        (event.preventDefault
          ? event.preventDefault()
          : "unknown" !== typeof event.returnValue && (event.returnValue = !1),
        (this.isDefaultPrevented = functionThatReturnsTrue));
    },
    stopPropagation: function () {
      var event = this.nativeEvent;
      event &&
        (event.stopPropagation
          ? event.stopPropagation()
          : "unknown" !== typeof event.cancelBubble &&
            (event.cancelBubble = !0),
        (this.isPropagationStopped = functionThatReturnsTrue));
    },
    persist: function () {},
    isPersistent: functionThatReturnsTrue
  });
  return SyntheticBaseEvent;
}
var EventInterface = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (event) {
      return event.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  },
  SyntheticEvent = createSyntheticEvent(EventInterface),
  UIEventInterface = assign({}, EventInterface, { view: 0, detail: 0 }),
  SyntheticUIEvent = createSyntheticEvent(UIEventInterface),
  lastMovementX,
  lastMovementY,
  lastMouseEvent,
  MouseEventInterface = assign({}, UIEventInterface, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: getEventModifierState,
    button: 0,
    buttons: 0,
    relatedTarget: function (event) {
      return void 0 === event.relatedTarget
        ? event.fromElement === event.srcElement
          ? event.toElement
          : event.fromElement
        : event.relatedTarget;
    },
    movementX: function (event) {
      if ("movementX" in event) return event.movementX;
      event !== lastMouseEvent &&
        (lastMouseEvent && "mousemove" === event.type
          ? ((lastMovementX = event.screenX - lastMouseEvent.screenX),
            (lastMovementY = event.screenY - lastMouseEvent.screenY))
          : (lastMovementY = lastMovementX = 0),
        (lastMouseEvent = event));
      return lastMovementX;
    },
    movementY: function (event) {
      return "movementY" in event ? event.movementY : lastMovementY;
    }
  }),
  SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface),
  DragEventInterface = assign({}, MouseEventInterface, { dataTransfer: 0 }),
  SyntheticDragEvent = createSyntheticEvent(DragEventInterface),
  FocusEventInterface = assign({}, UIEventInterface, { relatedTarget: 0 }),
  SyntheticFocusEvent = createSyntheticEvent(FocusEventInterface),
  AnimationEventInterface = assign({}, EventInterface, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }),
  SyntheticAnimationEvent = createSyntheticEvent(AnimationEventInterface),
  ClipboardEventInterface = assign({}, EventInterface, {
    clipboardData: function (event) {
      return "clipboardData" in event
        ? event.clipboardData
        : window.clipboardData;
    }
  }),
  SyntheticClipboardEvent = createSyntheticEvent(ClipboardEventInterface),
  CompositionEventInterface = assign({}, EventInterface, { data: 0 }),
  SyntheticCompositionEvent = createSyntheticEvent(CompositionEventInterface),
  normalizeKey = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  },
  translateToKey = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  },
  modifierKeyToProp = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
function modifierStateGetter(keyArg) {
  var nativeEvent = this.nativeEvent;
  return nativeEvent.getModifierState
    ? nativeEvent.getModifierState(keyArg)
    : (keyArg = modifierKeyToProp[keyArg])
      ? !!nativeEvent[keyArg]
      : !1;
}
function getEventModifierState() {
  return modifierStateGetter;
}
var KeyboardEventInterface = assign({}, UIEventInterface, {
    key: function (nativeEvent) {
      if (nativeEvent.key) {
        var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
        if ("Unidentified" !== key) return key;
      }
      return "keypress" === nativeEvent.type
        ? ((nativeEvent = getEventCharCode(nativeEvent)),
          13 === nativeEvent ? "Enter" : String.fromCharCode(nativeEvent))
        : "keydown" === nativeEvent.type || "keyup" === nativeEvent.type
          ? translateToKey[nativeEvent.keyCode] || "Unidentified"
          : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: getEventModifierState,
    charCode: function (event) {
      return "keypress" === event.type ? getEventCharCode(event) : 0;
    },
    keyCode: function (event) {
      return "keydown" === event.type || "keyup" === event.type
        ? event.keyCode
        : 0;
    },
    which: function (event) {
      return "keypress" === event.type
        ? getEventCharCode(event)
        : "keydown" === event.type || "keyup" === event.type
          ? event.keyCode
          : 0;
    }
  }),
  SyntheticKeyboardEvent = createSyntheticEvent(KeyboardEventInterface),
  PointerEventInterface = assign({}, MouseEventInterface, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }),
  SyntheticPointerEvent = createSyntheticEvent(PointerEventInterface),
  TouchEventInterface = assign({}, UIEventInterface, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: getEventModifierState
  }),
  SyntheticTouchEvent = createSyntheticEvent(TouchEventInterface),
  TransitionEventInterface = assign({}, EventInterface, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }),
  SyntheticTransitionEvent = createSyntheticEvent(TransitionEventInterface),
  WheelEventInterface = assign({}, MouseEventInterface, {
    deltaX: function (event) {
      return "deltaX" in event
        ? event.deltaX
        : "wheelDeltaX" in event
          ? -event.wheelDeltaX
          : 0;
    },
    deltaY: function (event) {
      return "deltaY" in event
        ? event.deltaY
        : "wheelDeltaY" in event
          ? -event.wheelDeltaY
          : "wheelDelta" in event
            ? -event.wheelDelta
            : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }),
  SyntheticWheelEvent = createSyntheticEvent(WheelEventInterface),
  ToggleEventInterface = assign({}, EventInterface, {
    newState: 0,
    oldState: 0
  }),
  SyntheticToggleEvent = createSyntheticEvent(ToggleEventInterface),
  END_KEYCODES = [9, 13, 27, 32],
  canUseCompositionEvent = canUseDOM && "CompositionEvent" in window,
  documentMode = null;
canUseDOM &&
  "documentMode" in document &&
  (documentMode = document.documentMode);
var canUseTextInputEvent = canUseDOM && "TextEvent" in window && !documentMode,
  useFallbackCompositionData =
    canUseDOM &&
    (!canUseCompositionEvent ||
      (documentMode && 8 < documentMode && 11 >= documentMode)),
  SPACEBAR_CHAR = String.fromCharCode(32),
  hasSpaceKeypress = !1;
function isFallbackCompositionEnd(domEventName, nativeEvent) {
  switch (domEventName) {
    case "keyup":
      return -1 !== END_KEYCODES.indexOf(nativeEvent.keyCode);
    case "keydown":
      return 229 !== nativeEvent.keyCode;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function getDataFromCustomEvent(nativeEvent) {
  nativeEvent = nativeEvent.detail;
  return "object" === typeof nativeEvent && "data" in nativeEvent
    ? nativeEvent.data
    : null;
}
var isComposing = !1;
function getNativeBeforeInputChars(domEventName, nativeEvent) {
  switch (domEventName) {
    case "compositionend":
      return getDataFromCustomEvent(nativeEvent);
    case "keypress":
      if (32 !== nativeEvent.which) return null;
      hasSpaceKeypress = !0;
      return SPACEBAR_CHAR;
    case "textInput":
      return (
        (domEventName = nativeEvent.data),
        domEventName === SPACEBAR_CHAR && hasSpaceKeypress ? null : domEventName
      );
    default:
      return null;
  }
}
function getFallbackBeforeInputChars(domEventName, nativeEvent) {
  if (isComposing)
    return "compositionend" === domEventName ||
      (!canUseCompositionEvent &&
        isFallbackCompositionEnd(domEventName, nativeEvent))
      ? ((domEventName = getData()),
        (fallbackText = startText = root = null),
        (isComposing = !1),
        domEventName)
      : null;
  switch (domEventName) {
    case "paste":
      return null;
    case "keypress":
      if (
        !(nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) ||
        (nativeEvent.ctrlKey && nativeEvent.altKey)
      ) {
        if (nativeEvent.char && 1 < nativeEvent.char.length)
          return nativeEvent.char;
        if (nativeEvent.which) return String.fromCharCode(nativeEvent.which);
      }
      return null;
    case "compositionend":
      return useFallbackCompositionData && "ko" !== nativeEvent.locale
        ? null
        : nativeEvent.data;
    default:
      return null;
  }
}
var supportedInputTypes = {
  color: !0,
  date: !0,
  datetime: !0,
  "datetime-local": !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0
};
function isTextInputElement(elem) {
  var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
  return "input" === nodeName
    ? !!supportedInputTypes[elem.type]
    : "textarea" === nodeName
      ? !0
      : !1;
}
function isEventSupported(eventNameSuffix) {
  if (!canUseDOM) return !1;
  eventNameSuffix = "on" + eventNameSuffix;
  var isSupported = eventNameSuffix in document;
  isSupported ||
    ((isSupported = document.createElement("div")),
    isSupported.setAttribute(eventNameSuffix, "return;"),
    (isSupported = "function" === typeof isSupported[eventNameSuffix]));
  return isSupported;
}
function createAndAccumulateChangeEvent(
  dispatchQueue,
  inst,
  nativeEvent,
  target
) {
  restoreTarget
    ? restoreQueue
      ? restoreQueue.push(target)
      : (restoreQueue = [target])
    : (restoreTarget = target);
  inst = accumulateTwoPhaseListeners(inst, "onChange");
  0 < inst.length &&
    ((nativeEvent = new SyntheticEvent(
      "onChange",
      "change",
      null,
      nativeEvent,
      target
    )),
    dispatchQueue.push({ event: nativeEvent, listeners: inst }));
}
var activeElement$1 = null,
  activeElementInst$1 = null;
function runEventInBatch$1(dispatchQueue) {
  processDispatchQueue(dispatchQueue, 0);
}
function getInstIfValueChanged(targetInst) {
  var targetNode = getNodeFromInstance(targetInst);
  if (updateValueIfChanged(targetNode)) return targetInst;
}
function getTargetInstForChangeEvent(domEventName, targetInst) {
  if ("change" === domEventName) return targetInst;
}
var isInputEventSupported = !1;
canUseDOM &&
  (isInputEventSupported =
    isEventSupported("input") &&
    (!document.documentMode || 9 < document.documentMode));
function stopWatchingForValueChange() {
  activeElement$1 &&
    (activeElement$1.detachEvent("onpropertychange", handlePropertyChange),
    (activeElementInst$1 = activeElement$1 = null));
}
function handlePropertyChange(nativeEvent) {
  if (
    "value" === nativeEvent.propertyName &&
    getInstIfValueChanged(activeElementInst$1)
  ) {
    var dispatchQueue = [];
    createAndAccumulateChangeEvent(
      dispatchQueue,
      activeElementInst$1,
      nativeEvent,
      getEventTarget(nativeEvent)
    );
    batchedUpdates$1(runEventInBatch$1, dispatchQueue);
  }
}
function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
  "focusin" === domEventName
    ? (stopWatchingForValueChange(),
      (activeElement$1 = target),
      (activeElementInst$1 = targetInst),
      activeElement$1.attachEvent("onpropertychange", handlePropertyChange))
    : "focusout" === domEventName && stopWatchingForValueChange();
}
function getTargetInstForInputEventPolyfill(domEventName) {
  if (
    "selectionchange" === domEventName ||
    "keyup" === domEventName ||
    "keydown" === domEventName
  )
    return getInstIfValueChanged(activeElementInst$1);
}
function getTargetInstForClickEvent(domEventName, targetInst) {
  if ("click" === domEventName) return getInstIfValueChanged(targetInst);
}
function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
  if ("input" === domEventName || "change" === domEventName)
    return getInstIfValueChanged(targetInst);
}
function is(x, y) {
  return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
}
var objectIs = "function" === typeof Object.is ? Object.is : is;
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
function getLeafNode(node) {
  for (; node && node.firstChild; ) node = node.firstChild;
  return node;
}
function getNodeForCharacterOffset(root, offset) {
  var node = getLeafNode(root);
  root = 0;
  for (var nodeEnd; node; ) {
    if (3 === node.nodeType) {
      nodeEnd = root + node.textContent.length;
      if (root <= offset && nodeEnd >= offset)
        return { node: node, offset: offset - root };
      root = nodeEnd;
    }
    a: {
      for (; node; ) {
        if (node.nextSibling) {
          node = node.nextSibling;
          break a;
        }
        node = node.parentNode;
      }
      node = void 0;
    }
    node = getLeafNode(node);
  }
}
function containsNode(outerNode, innerNode) {
  return outerNode && innerNode
    ? outerNode === innerNode
      ? !0
      : outerNode && 3 === outerNode.nodeType
        ? !1
        : innerNode && 3 === innerNode.nodeType
          ? containsNode(outerNode, innerNode.parentNode)
          : "contains" in outerNode
            ? outerNode.contains(innerNode)
            : outerNode.compareDocumentPosition
              ? !!(outerNode.compareDocumentPosition(innerNode) & 16)
              : !1
    : !1;
}
function getActiveElementDeep(containerInfo) {
  containerInfo =
    null != containerInfo &&
    null != containerInfo.ownerDocument &&
    null != containerInfo.ownerDocument.defaultView
      ? containerInfo.ownerDocument.defaultView
      : window;
  for (
    var element = getActiveElement(containerInfo.document);
    element instanceof containerInfo.HTMLIFrameElement;

  ) {
    try {
      var JSCompiler_inline_result =
        "string" === typeof element.contentWindow.location.href;
    } catch (err) {
      JSCompiler_inline_result = !1;
    }
    if (JSCompiler_inline_result) containerInfo = element.contentWindow;
    else break;
    element = getActiveElement(containerInfo.document);
  }
  return element;
}
function hasSelectionCapabilities(elem) {
  var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName &&
    (("input" === nodeName &&
      ("text" === elem.type ||
        "search" === elem.type ||
        "tel" === elem.type ||
        "url" === elem.type ||
        "password" === elem.type)) ||
      "textarea" === nodeName ||
      "true" === elem.contentEditable)
  );
}
var skipSelectionChangeEvent =
    canUseDOM && "documentMode" in document && 11 >= document.documentMode,
  activeElement = null,
  activeElementInst = null,
  lastSelection = null,
  mouseDown = !1;
function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
  var doc =
    nativeEventTarget.window === nativeEventTarget
      ? nativeEventTarget.document
      : 9 === nativeEventTarget.nodeType
        ? nativeEventTarget
        : nativeEventTarget.ownerDocument;
  mouseDown ||
    null == activeElement ||
    activeElement !== getActiveElement(doc) ||
    ((doc = activeElement),
    "selectionStart" in doc && hasSelectionCapabilities(doc)
      ? (doc = { start: doc.selectionStart, end: doc.selectionEnd })
      : ((doc = (
          (doc.ownerDocument && doc.ownerDocument.defaultView) ||
          window
        ).getSelection()),
        (doc = {
          anchorNode: doc.anchorNode,
          anchorOffset: doc.anchorOffset,
          focusNode: doc.focusNode,
          focusOffset: doc.focusOffset
        })),
    (lastSelection && shallowEqual(lastSelection, doc)) ||
      ((lastSelection = doc),
      (doc = accumulateTwoPhaseListeners(activeElementInst, "onSelect")),
      0 < doc.length &&
        ((nativeEvent = new SyntheticEvent(
          "onSelect",
          "select",
          null,
          nativeEvent,
          nativeEventTarget
        )),
        dispatchQueue.push({ event: nativeEvent, listeners: doc }),
        (nativeEvent.target = activeElement))));
}
function makePrefixMap(styleProp, eventName) {
  var prefixes = {};
  prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
  prefixes["Webkit" + styleProp] = "webkit" + eventName;
  prefixes["Moz" + styleProp] = "moz" + eventName;
  return prefixes;
}
var vendorPrefixes = {
    animationend: makePrefixMap("Animation", "AnimationEnd"),
    animationiteration: makePrefixMap("Animation", "AnimationIteration"),
    animationstart: makePrefixMap("Animation", "AnimationStart"),
    transitionrun: makePrefixMap("Transition", "TransitionRun"),
    transitionstart: makePrefixMap("Transition", "TransitionStart"),
    transitioncancel: makePrefixMap("Transition", "TransitionCancel"),
    transitionend: makePrefixMap("Transition", "TransitionEnd")
  },
  prefixedEventNames = {},
  style = {};
canUseDOM &&
  ((style = document.createElement("div").style),
  "AnimationEvent" in window ||
    (delete vendorPrefixes.animationend.animation,
    delete vendorPrefixes.animationiteration.animation,
    delete vendorPrefixes.animationstart.animation),
  "TransitionEvent" in window ||
    delete vendorPrefixes.transitionend.transition);
function getVendorPrefixedEventName(eventName) {
  if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
  if (!vendorPrefixes[eventName]) return eventName;
  var prefixMap = vendorPrefixes[eventName],
    styleProp;
  for (styleProp in prefixMap)
    if (prefixMap.hasOwnProperty(styleProp) && styleProp in style)
      return (prefixedEventNames[eventName] = prefixMap[styleProp]);
  return eventName;
}
var ANIMATION_END = getVendorPrefixedEventName("animationend"),
  ANIMATION_ITERATION = getVendorPrefixedEventName("animationiteration"),
  ANIMATION_START = getVendorPrefixedEventName("animationstart"),
  TRANSITION_RUN = getVendorPrefixedEventName("transitionrun"),
  TRANSITION_START = getVendorPrefixedEventName("transitionstart"),
  TRANSITION_CANCEL = getVendorPrefixedEventName("transitioncancel"),
  TRANSITION_END = getVendorPrefixedEventName("transitionend"),
  topLevelEventsToReactNames = new Map(),
  simpleEventPluginEvents =
    "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
      " "
    );
function registerSimpleEvent(domEventName, reactName) {
  topLevelEventsToReactNames.set(domEventName, reactName);
  registerTwoPhaseEvent(reactName, [domEventName]);
}
var reportGlobalError =
    "function" === typeof reportError
      ? reportError
      : function (error) {
          if (
            "object" === typeof window &&
            "function" === typeof window.ErrorEvent
          ) {
            var event = new window.ErrorEvent("error", {
              bubbles: !0,
              cancelable: !0,
              message:
                "object" === typeof error &&
                null !== error &&
                "string" === typeof error.message
                  ? String(error.message)
                  : String(error),
              error: error
            });
            if (!window.dispatchEvent(event)) return;
          } else if (
            "object" === typeof process &&
            "function" === typeof process.emit
          ) {
            process.emit("uncaughtException", error);
            return;
          }
          console.error(error);
        },
  supportsUserTiming =
    "undefined" !== typeof console &&
    "function" === typeof console.timeStamp &&
    !0,
  currentTrack = "Blocking";
function setCurrentTrackFromLanes(lanes) {
  currentTrack =
    lanes & 63
      ? "Blocking"
      : lanes & 64
        ? "Gesture"
        : lanes & 4194176
          ? "Transition"
          : lanes & 62914560
            ? "Suspense"
            : lanes & 2080374784
              ? "Idle"
              : "Other";
}
function logComponentTrigger(fiber, startTime, endTime, trigger) {
  supportsUserTiming &&
    ((reusableComponentOptions.start = startTime),
    (reusableComponentOptions.end = endTime),
    (reusableComponentDevToolDetails.color = "warning"),
    (reusableComponentDevToolDetails.tooltipText = trigger),
    (reusableComponentDevToolDetails.properties = null),
    performance.measure(trigger, reusableComponentOptions),
    performance.clearMeasures(trigger));
}
function logComponentReappeared(fiber, startTime, endTime) {
  logComponentTrigger(fiber, startTime, endTime, "Reconnect");
}
var reusableComponentDevToolDetails = {
    color: "primary",
    properties: null,
    tooltipText: "",
    track: "Components \u269b"
  },
  reusableComponentOptions = {
    start: -0,
    end: -0,
    detail: { devtools: reusableComponentDevToolDetails }
  };
function logComponentRender(fiber, startTime, endTime, wasHydrated) {
  var name = getComponentNameFromFiber(fiber);
  if (null !== name && supportsUserTiming) {
    var alternate = fiber.alternate,
      selfTime = fiber.actualDuration;
    if (null === alternate || alternate.child !== fiber.child)
      for (fiber = fiber.child; null !== fiber; fiber = fiber.sibling)
        selfTime -= fiber.actualDuration;
    console.timeStamp(
      name,
      startTime,
      endTime,
      "Components \u269b",
      void 0,
      0.5 > selfTime
        ? wasHydrated
          ? "tertiary-light"
          : "primary-light"
        : 10 > selfTime
          ? wasHydrated
            ? "tertiary"
            : "primary"
          : 100 > selfTime
            ? wasHydrated
              ? "tertiary-dark"
              : "primary-dark"
            : "error"
    );
  }
}
function logComponentErrored(fiber, startTime, endTime) {
  supportsUserTiming &&
    ((fiber = getComponentNameFromFiber(fiber)),
    null !== fiber &&
      console.timeStamp(
        fiber,
        startTime,
        endTime,
        "Components \u269b",
        void 0,
        "error"
      ));
}
function logComponentEffect(fiber, startTime, endTime, selfTime, errors) {
  null !== errors
    ? supportsUserTiming &&
      ((selfTime = getComponentNameFromFiber(fiber)),
      null !== selfTime &&
        console.timeStamp(
          selfTime,
          startTime,
          endTime,
          "Components \u269b",
          void 0,
          "error"
        ))
    : ((fiber = getComponentNameFromFiber(fiber)),
      null !== fiber &&
        supportsUserTiming &&
        console.timeStamp(
          fiber,
          startTime,
          endTime,
          "Components \u269b",
          void 0,
          1 > selfTime
            ? "secondary-light"
            : 100 > selfTime
              ? "secondary"
              : 500 > selfTime
                ? "secondary-dark"
                : "error"
        ));
}
function logSuspendedRenderPhase(startTime, endTime, lanes) {
  !supportsUserTiming ||
    endTime <= startTime ||
    console.timeStamp(
      "Prewarm",
      startTime,
      endTime,
      currentTrack,
      "Scheduler \u269b",
      (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark"
    );
}
function logSuspendedWithDelayPhase(startTime, endTime, lanes) {
  !supportsUserTiming ||
    endTime <= startTime ||
    console.timeStamp(
      "Suspended",
      startTime,
      endTime,
      currentTrack,
      "Scheduler \u269b",
      (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark"
    );
}
function logErroredRenderPhase(startTime, endTime) {
  !supportsUserTiming ||
    endTime <= startTime ||
    console.timeStamp(
      "Errored",
      startTime,
      endTime,
      currentTrack,
      "Scheduler \u269b",
      "error"
    );
}
function logCommitErrored(startTime, endTime) {
  !supportsUserTiming ||
    endTime <= startTime ||
    console.timeStamp(
      "Errored",
      startTime,
      endTime,
      currentTrack,
      "Scheduler \u269b",
      "error"
    );
}
var concurrentQueues = [],
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
function enqueueUpdate$1(fiber, queue, update, lane) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  concurrentQueues[concurrentQueuesIndex++] = lane;
  concurrentlyUpdatedLanes |= lane;
  fiber.lanes |= lane;
  fiber = fiber.alternate;
  null !== fiber && (fiber.lanes |= lane);
}
function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
  enqueueUpdate$1(fiber, queue, update, lane);
  return getRootForUpdatedFiber(fiber);
}
function enqueueConcurrentRenderForLane(fiber, lane) {
  enqueueUpdate$1(fiber, null, null, lane);
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
  return 3 === sourceFiber.tag
    ? ((parent = sourceFiber.stateNode),
      isHidden &&
        null !== update &&
        ((isHidden = 31 - clz32(lane)),
        (sourceFiber = parent.hiddenUpdates),
        (alternate = sourceFiber[isHidden]),
        null === alternate
          ? (sourceFiber[isHidden] = [update])
          : alternate.push(update),
        (update.lane = lane | 536870912)),
      parent)
    : null;
}
function getRootForUpdatedFiber(sourceFiber) {
  if (50 < nestedUpdateCount)
    throw (
      ((nestedUpdateCount = 0),
      (rootWithNestedUpdates = null),
      Error(formatProdErrorMessage(185)))
    );
  for (var parent = sourceFiber.return; null !== parent; )
    (sourceFiber = parent), (parent = sourceFiber.return);
  return 3 === sourceFiber.tag ? sourceFiber.stateNode : null;
}
var emptyContextObject = {},
  contextStackCursor = createCursor(emptyContextObject),
  didPerformWorkStackCursor = createCursor(!1),
  previousContext = emptyContextObject;
function getMaskedContext(workInProgress, unmaskedContext) {
  var contextTypes = workInProgress.type.contextTypes;
  if (!contextTypes) return emptyContextObject;
  var instance = workInProgress.stateNode;
  if (
    instance &&
    instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext
  )
    return instance.__reactInternalMemoizedMaskedChildContext;
  var context = {},
    key;
  for (key in contextTypes) context[key] = unmaskedContext[key];
  instance &&
    ((workInProgress = workInProgress.stateNode),
    (workInProgress.__reactInternalMemoizedUnmaskedChildContext =
      unmaskedContext),
    (workInProgress.__reactInternalMemoizedMaskedChildContext = context));
  return context;
}
function isContextProvider(type) {
  type = type.childContextTypes;
  return null !== type && void 0 !== type;
}
function popContext() {
  pop(didPerformWorkStackCursor);
  pop(contextStackCursor);
}
function pushTopLevelContextObject(fiber, context, didChange) {
  if (contextStackCursor.current !== emptyContextObject)
    throw Error(formatProdErrorMessage(168));
  push(contextStackCursor, context);
  push(didPerformWorkStackCursor, didChange);
}
function processChildContext(fiber, type, parentContext) {
  var instance = fiber.stateNode;
  type = type.childContextTypes;
  if ("function" !== typeof instance.getChildContext) return parentContext;
  instance = instance.getChildContext();
  for (var contextKey in instance)
    if (!(contextKey in type))
      throw Error(
        formatProdErrorMessage(
          108,
          getComponentNameFromFiber(fiber) || "Unknown",
          contextKey
        )
      );
  return assign({}, parentContext, instance);
}
function pushContextProvider(workInProgress) {
  workInProgress =
    ((workInProgress = workInProgress.stateNode) &&
      workInProgress.__reactInternalMemoizedMergedChildContext) ||
    emptyContextObject;
  previousContext = contextStackCursor.current;
  push(contextStackCursor, workInProgress);
  push(didPerformWorkStackCursor, didPerformWorkStackCursor.current);
  return !0;
}
function invalidateContextProvider(workInProgress, type, didChange) {
  var instance = workInProgress.stateNode;
  if (!instance) throw Error(formatProdErrorMessage(169));
  didChange
    ? ((workInProgress = processChildContext(
        workInProgress,
        type,
        previousContext
      )),
      (instance.__reactInternalMemoizedMergedChildContext = workInProgress),
      pop(didPerformWorkStackCursor),
      pop(contextStackCursor),
      push(contextStackCursor, workInProgress))
    : pop(didPerformWorkStackCursor);
  push(didPerformWorkStackCursor, didChange);
}
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;
  this.key = key;
  this.sibling =
    this.child =
    this.return =
    this.stateNode =
    this.type =
    this.elementType =
      null;
  this.index = 0;
  this.refCleanup = this.ref = null;
  this.pendingProps = pendingProps;
  this.dependencies =
    this.memoizedState =
    this.updateQueue =
    this.memoizedProps =
      null;
  this.mode = mode;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
  this.actualDuration = -0;
  this.actualStartTime = -1.1;
  this.treeBaseDuration = this.selfBaseDuration = -0;
}
function createFiberImplClass(tag, pendingProps, key, mode) {
  return new FiberNode(tag, pendingProps, key, mode);
}
function createFiberImplObject(tag, pendingProps, key, mode) {
  return {
    elementType: null,
    type: null,
    stateNode: null,
    return: null,
    child: null,
    sibling: null,
    index: 0,
    ref: null,
    refCleanup: null,
    memoizedProps: null,
    updateQueue: null,
    memoizedState: null,
    dependencies: null,
    flags: 0,
    subtreeFlags: 0,
    deletions: null,
    lanes: 0,
    childLanes: 0,
    alternate: null,
    tag: tag,
    key: key,
    pendingProps: pendingProps,
    mode: mode,
    actualDuration: -0,
    actualStartTime: -1.1,
    selfBaseDuration: -0,
    treeBaseDuration: -0
  };
}
var createFiber = enableObjectFiber
  ? createFiberImplObject
  : createFiberImplClass;
function shouldConstruct(Component) {
  Component = Component.prototype;
  return !(!Component || !Component.isReactComponent);
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
      (workInProgress.deletions = null),
      (workInProgress.actualDuration = -0),
      (workInProgress.actualStartTime = -1.1));
  workInProgress.flags = current.flags & 65011712;
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
  workInProgress.selfBaseDuration = current.selfBaseDuration;
  workInProgress.treeBaseDuration = current.treeBaseDuration;
  return workInProgress;
}
function resetWorkInProgress(workInProgress, renderLanes) {
  workInProgress.flags &= 65011714;
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
      (workInProgress.stateNode = null),
      (workInProgress.selfBaseDuration = 0),
      (workInProgress.treeBaseDuration = 0))
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
            }),
      (workInProgress.selfBaseDuration = current.selfBaseDuration),
      (workInProgress.treeBaseDuration = current.treeBaseDuration));
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
  var fiberTag = 0;
  owner = type;
  if ("function" === typeof type) shouldConstruct(type) && (fiberTag = 1);
  else if ("string" === typeof type)
    fiberTag = isHostHoistableType(
      type,
      pendingProps,
      contextStackCursor$1.current
    )
      ? 26
      : "html" === type || "head" === type || "body" === type
        ? 27
        : 5;
  else
    a: switch (type) {
      case REACT_ACTIVITY_TYPE:
        return (
          (type = createFiber(31, pendingProps, key, mode)),
          (type.elementType = REACT_ACTIVITY_TYPE),
          (type.lanes = lanes),
          type
        );
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
          (type.stateNode = { effectDuration: 0, passiveEffectDuration: 0 }),
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
      default:
        if ("object" === typeof type && null !== type)
          switch (type.$$typeof) {
            case REACT_CONTEXT_TYPE:
              fiberTag = 10;
              break a;
            case REACT_CONSUMER_TYPE:
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
        fiberTag = 29;
        pendingProps = Error(
          formatProdErrorMessage(130, null === type ? "null" : typeof type, "")
        );
        owner = null;
    }
  key = createFiber(fiberTag, pendingProps, key, mode);
  key.elementType = type;
  key.type = owner;
  key.lanes = lanes;
  return key;
}
function createFiberFromFragment(elements, mode, lanes, key) {
  elements = createFiber(7, elements, key, mode);
  elements.lanes = lanes;
  return elements;
}
function createFiberFromText(content, mode, lanes) {
  content = createFiber(6, content, null, mode);
  content.lanes = lanes;
  return content;
}
function createFiberFromDehydratedFragment(dehydratedNode) {
  var fiber = createFiber(18, null, null, 0);
  fiber.stateNode = dehydratedNode;
  return fiber;
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
var CapturedStacks = new WeakMap();
function createCapturedValueAtFiber(value, source) {
  if ("object" === typeof value && null !== value) {
    var existing = CapturedStacks.get(value);
    if (void 0 !== existing) return existing;
    source = {
      value: value,
      source: source,
      stack: getStackByFiberInDevAndProd(source)
    };
    CapturedStacks.set(value, source);
    return source;
  }
  return {
    value: value,
    source: source,
    stack: getStackByFiberInDevAndProd(source)
  };
}
var forkStack = [],
  forkStackIndex = 0,
  treeForkProvider = null,
  treeForkCount = 0,
  idStack = [],
  idStackIndex = 0,
  treeContextProvider = null,
  treeContextId = 1,
  treeContextOverflow = "";
function pushTreeFork(workInProgress, totalChildren) {
  forkStack[forkStackIndex++] = treeForkCount;
  forkStack[forkStackIndex++] = treeForkProvider;
  treeForkProvider = workInProgress;
  treeForkCount = totalChildren;
}
function pushTreeId(workInProgress, totalChildren, index) {
  idStack[idStackIndex++] = treeContextId;
  idStack[idStackIndex++] = treeContextOverflow;
  idStack[idStackIndex++] = treeContextProvider;
  treeContextProvider = workInProgress;
  var baseIdWithLeadingBit = treeContextId;
  workInProgress = treeContextOverflow;
  var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
  baseIdWithLeadingBit &= ~(1 << baseLength);
  index += 1;
  var length = 32 - clz32(totalChildren) + baseLength;
  if (30 < length) {
    var numberOfOverflowBits = baseLength - (baseLength % 5);
    length = (
      baseIdWithLeadingBit &
      ((1 << numberOfOverflowBits) - 1)
    ).toString(32);
    baseIdWithLeadingBit >>= numberOfOverflowBits;
    baseLength -= numberOfOverflowBits;
    treeContextId =
      (1 << (32 - clz32(totalChildren) + baseLength)) |
      (index << baseLength) |
      baseIdWithLeadingBit;
    treeContextOverflow = length + workInProgress;
  } else
    (treeContextId =
      (1 << length) | (index << baseLength) | baseIdWithLeadingBit),
      (treeContextOverflow = workInProgress);
}
function pushMaterializedTreeId(workInProgress) {
  null !== workInProgress.return &&
    (pushTreeFork(workInProgress, 1), pushTreeId(workInProgress, 1, 0));
}
function popTreeContext(workInProgress) {
  for (; workInProgress === treeForkProvider; )
    (treeForkProvider = forkStack[--forkStackIndex]),
      (forkStack[forkStackIndex] = null),
      (treeForkCount = forkStack[--forkStackIndex]),
      (forkStack[forkStackIndex] = null);
  for (; workInProgress === treeContextProvider; )
    (treeContextProvider = idStack[--idStackIndex]),
      (idStack[idStackIndex] = null),
      (treeContextOverflow = idStack[--idStackIndex]),
      (idStack[idStackIndex] = null),
      (treeContextId = idStack[--idStackIndex]),
      (idStack[idStackIndex] = null);
}
function restoreSuspendedTreeContext(workInProgress, suspendedContext) {
  idStack[idStackIndex++] = treeContextId;
  idStack[idStackIndex++] = treeContextOverflow;
  idStack[idStackIndex++] = treeContextProvider;
  treeContextId = suspendedContext.id;
  treeContextOverflow = suspendedContext.overflow;
  treeContextProvider = workInProgress;
}
var hydrationParentFiber = null,
  nextHydratableInstance = null,
  isHydrating = !1,
  hydrationErrors = null,
  rootOrSingletonContext = !1,
  HydrationMismatchException = Error(formatProdErrorMessage(519));
function throwOnHydrationMismatch(fiber) {
  var error = Error(
    formatProdErrorMessage(
      418,
      1 < arguments.length && void 0 !== arguments[1] && arguments[1]
        ? "text"
        : "HTML",
      ""
    )
  );
  queueHydrationError(createCapturedValueAtFiber(error, fiber));
  throw HydrationMismatchException;
}
function prepareToHydrateHostInstance(fiber) {
  var instance = fiber.stateNode,
    type = fiber.type,
    props = fiber.memoizedProps;
  instance[internalInstanceKey] = fiber;
  instance[internalPropsKey] = props;
  switch (type) {
    case "dialog":
      listenToNonDelegatedEvent("cancel", instance);
      listenToNonDelegatedEvent("close", instance);
      break;
    case "iframe":
    case "object":
    case "embed":
      listenToNonDelegatedEvent("load", instance);
      break;
    case "video":
    case "audio":
      for (type = 0; type < mediaEventTypes.length; type++)
        listenToNonDelegatedEvent(mediaEventTypes[type], instance);
      break;
    case "source":
      listenToNonDelegatedEvent("error", instance);
      break;
    case "img":
    case "image":
    case "link":
      listenToNonDelegatedEvent("error", instance);
      listenToNonDelegatedEvent("load", instance);
      break;
    case "details":
      listenToNonDelegatedEvent("toggle", instance);
      break;
    case "input":
      listenToNonDelegatedEvent("invalid", instance);
      break;
    case "select":
      listenToNonDelegatedEvent("invalid", instance);
      break;
    case "textarea":
      listenToNonDelegatedEvent("invalid", instance);
  }
  type = props.children;
  ("string" !== typeof type &&
    "number" !== typeof type &&
    "bigint" !== typeof type) ||
  instance.textContent === "" + type ||
  !0 === props.suppressHydrationWarning ||
  checkForUnmatchedText(instance.textContent, type)
    ? (null != props.popover &&
        (listenToNonDelegatedEvent("beforetoggle", instance),
        listenToNonDelegatedEvent("toggle", instance)),
      null != props.onScroll && listenToNonDelegatedEvent("scroll", instance),
      null != props.onScrollEnd &&
        (listenToNonDelegatedEvent("scrollend", instance),
        listenToNonDelegatedEvent("scroll", instance)),
      null != props.onClick && (instance.onclick = noop$1),
      (instance = !0))
    : (instance = !1);
  instance || throwOnHydrationMismatch(fiber, !0);
}
function popToNextHostParent(fiber) {
  for (hydrationParentFiber = fiber.return; hydrationParentFiber; )
    switch (hydrationParentFiber.tag) {
      case 5:
      case 31:
      case 13:
        rootOrSingletonContext = !1;
        return;
      case 27:
      case 3:
        rootOrSingletonContext = !0;
        return;
      default:
        hydrationParentFiber = hydrationParentFiber.return;
    }
}
function popHydrationState(fiber) {
  if (fiber !== hydrationParentFiber) return !1;
  if (!isHydrating) return popToNextHostParent(fiber), (isHydrating = !0), !1;
  var tag = fiber.tag,
    JSCompiler_temp;
  if ((JSCompiler_temp = 3 !== tag && 27 !== tag)) {
    if ((JSCompiler_temp = 5 === tag))
      (JSCompiler_temp = fiber.type),
        (JSCompiler_temp =
          !("form" !== JSCompiler_temp && "button" !== JSCompiler_temp) ||
          shouldSetTextContent(fiber.type, fiber.memoizedProps));
    JSCompiler_temp = !JSCompiler_temp;
  }
  JSCompiler_temp && nextHydratableInstance && throwOnHydrationMismatch(fiber);
  popToNextHostParent(fiber);
  if (13 === tag) {
    fiber = fiber.memoizedState;
    fiber = null !== fiber ? fiber.dehydrated : null;
    if (!fiber) throw Error(formatProdErrorMessage(317));
    nextHydratableInstance =
      getNextHydratableInstanceAfterHydrationBoundary(fiber);
  } else if (31 === tag) {
    fiber = fiber.memoizedState;
    fiber = null !== fiber ? fiber.dehydrated : null;
    if (!fiber) throw Error(formatProdErrorMessage(317));
    nextHydratableInstance =
      getNextHydratableInstanceAfterHydrationBoundary(fiber);
  } else
    27 === tag
      ? ((tag = nextHydratableInstance),
        isSingletonScope(fiber.type)
          ? ((fiber = previousHydratableOnEnteringScopedSingleton),
            (previousHydratableOnEnteringScopedSingleton = null),
            (nextHydratableInstance = fiber))
          : (nextHydratableInstance = tag))
      : (nextHydratableInstance = hydrationParentFiber
          ? getNextHydratable(fiber.stateNode.nextSibling)
          : null);
  return !0;
}
function resetHydrationState() {
  nextHydratableInstance = hydrationParentFiber = null;
  isHydrating = !1;
}
function upgradeHydrationErrorsToRecoverable() {
  var queuedErrors = hydrationErrors;
  null !== queuedErrors &&
    (null === workInProgressRootRecoverableErrors
      ? (workInProgressRootRecoverableErrors = queuedErrors)
      : workInProgressRootRecoverableErrors.push.apply(
          workInProgressRootRecoverableErrors,
          queuedErrors
        ),
    (hydrationErrors = null));
  return queuedErrors;
}
function queueHydrationError(error) {
  null === hydrationErrors
    ? (hydrationErrors = [error])
    : hydrationErrors.push(error);
}
var valueCursor = createCursor(null),
  currentlyRenderingFiber$1 = null,
  lastContextDependency = null;
function pushProvider(providerFiber, context, nextValue) {
  push(valueCursor, context._currentValue);
  context._currentValue = nextValue;
}
function popProvider(context) {
  context._currentValue = valueCursor.current;
  pop(valueCursor);
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
function propagateContextChanges(
  workInProgress,
  contexts,
  renderLanes,
  forcePropagateEntireTree
) {
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
function propagateParentContextChanges(
  current,
  workInProgress,
  renderLanes,
  forcePropagateEntireTree
) {
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
        var context = parent.type;
        objectIs(parent.pendingProps.value, currentParent.value) ||
          (null !== current ? current.push(context) : (current = [context]));
      }
    } else if (parent === hostTransitionProviderCursor.current) {
      currentParent = parent.alternate;
      if (null === currentParent) throw Error(formatProdErrorMessage(387));
      currentParent.memoizedState.memoizedState !==
        parent.memoizedState.memoizedState &&
        (null !== current
          ? current.push(HostTransitionContext)
          : (current = [HostTransitionContext]));
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
function checkIfContextChanged(currentDependencies) {
  for (
    currentDependencies = currentDependencies.firstContext;
    null !== currentDependencies;

  ) {
    if (
      !objectIs(
        currentDependencies.context._currentValue,
        currentDependencies.memoizedValue
      )
    )
      return !0;
    currentDependencies = currentDependencies.next;
  }
  return !1;
}
function prepareToReadContext(workInProgress) {
  currentlyRenderingFiber$1 = workInProgress;
  lastContextDependency = null;
  workInProgress = workInProgress.dependencies;
  null !== workInProgress && (workInProgress.firstContext = null);
}
function readContext(context) {
  return readContextForConsumer(currentlyRenderingFiber$1, context);
}
function readContextDuringReconciliation(consumer, context) {
  null === currentlyRenderingFiber$1 && prepareToReadContext(consumer);
  return readContextForConsumer(consumer, context);
}
function readContextForConsumer(consumer, context) {
  var value = context._currentValue;
  context = { context: context, memoizedValue: value, next: null };
  if (null === lastContextDependency) {
    if (null === consumer) throw Error(formatProdErrorMessage(308));
    lastContextDependency = context;
    consumer.dependencies = { lanes: 0, firstContext: context };
    consumer.flags |= 524288;
  } else lastContextDependency = lastContextDependency.next = context;
  return value;
}
var AbortControllerLocal =
    "undefined" !== typeof AbortController
      ? AbortController
      : function () {
          var listeners = [],
            signal = (this.signal = {
              aborted: !1,
              addEventListener: function (type, listener) {
                listeners.push(listener);
              }
            });
          this.abort = function () {
            signal.aborted = !0;
            listeners.forEach(function (listener) {
              return listener();
            });
          };
        },
  scheduleCallback$2 = Scheduler.unstable_scheduleCallback,
  NormalPriority = Scheduler.unstable_NormalPriority,
  CacheContext = {
    $$typeof: REACT_CONTEXT_TYPE,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
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
    scheduleCallback$2(NormalPriority, function () {
      cache.controller.abort();
    });
}
var now = Scheduler.unstable_now,
  renderStartTime = -0,
  commitStartTime = -0,
  commitEndTime = -0,
  commitErrors = null,
  profilerStartTime = -1.1,
  profilerEffectDuration = -0,
  componentEffectDuration = -0,
  componentEffectStartTime = -1.1,
  componentEffectEndTime = -1.1,
  componentEffectErrors = null,
  componentEffectSpawnedUpdate = !1,
  blockingClampTime = -0,
  blockingUpdateTime = -1.1,
  blockingUpdateType = 0,
  blockingEventTime = -1.1,
  blockingEventType = null,
  blockingEventRepeatTime = -1.1,
  blockingSuspendedTime = -1.1,
  transitionClampTime = -0,
  transitionStartTime = -1.1,
  transitionUpdateTime = -1.1,
  transitionUpdateType = 0,
  transitionEventTime = -1.1,
  transitionEventType = null,
  transitionEventRepeatTime = -1.1,
  transitionSuspendedTime = -1.1,
  yieldReason = 0,
  yieldStartTime = -1.1;
function startUpdateTimerByLane(lane) {
  if (enableComponentPerformanceTrack)
    if (0 !== (lane & 127)) {
      if (0 > blockingUpdateTime) {
        blockingUpdateTime = now();
        0 !== (executionContext & 6) &&
          ((componentEffectSpawnedUpdate = !0), (blockingUpdateType = 1));
        lane = resolveEventTimeStamp();
        var newEventType$34 = resolveEventType();
        lane !== blockingEventRepeatTime ||
        newEventType$34 !== blockingEventType
          ? (blockingEventRepeatTime = -1.1)
          : null !== newEventType$34 && (blockingUpdateType = 1);
        blockingEventTime = lane;
        blockingEventType = newEventType$34;
      }
    } else if (
      0 !== (lane & 4194048) &&
      0 > transitionUpdateTime &&
      ((transitionUpdateTime = now()), 0 > transitionStartTime)
    ) {
      lane = resolveEventTimeStamp();
      newEventType$34 = resolveEventType();
      if (
        lane !== transitionEventRepeatTime ||
        newEventType$34 !== transitionEventType
      )
        transitionEventRepeatTime = -1.1;
      transitionEventTime = lane;
      transitionEventType = newEventType$34;
    }
}
function startHostActionTimer() {
  if (enableComponentPerformanceTrack) {
    if (0 > blockingUpdateTime) {
      blockingUpdateTime = now();
      0 !== (executionContext & 6) && (blockingUpdateType = 1);
      var newEventTime = resolveEventTimeStamp(),
        newEventType = resolveEventType();
      newEventTime !== blockingEventRepeatTime ||
      newEventType !== blockingEventType
        ? (blockingEventRepeatTime = -1.1)
        : null !== newEventType && (blockingUpdateType = 1);
      blockingEventTime = newEventTime;
      blockingEventType = newEventType;
    }
    if (
      0 > transitionUpdateTime &&
      ((transitionUpdateTime = now()), 0 > transitionStartTime)
    ) {
      newEventTime = resolveEventTimeStamp();
      newEventType = resolveEventType();
      if (
        newEventTime !== transitionEventRepeatTime ||
        newEventType !== transitionEventType
      )
        transitionEventRepeatTime = -1.1;
      transitionEventTime = newEventTime;
      transitionEventType = newEventType;
    }
  }
}
function pushNestedEffectDurations() {
  var prevEffectDuration = profilerEffectDuration;
  profilerEffectDuration = 0;
  return prevEffectDuration;
}
function popNestedEffectDurations(prevEffectDuration) {
  var elapsedTime = profilerEffectDuration;
  profilerEffectDuration = prevEffectDuration;
  return elapsedTime;
}
function bubbleNestedEffectDurations(prevEffectDuration) {
  var elapsedTime = profilerEffectDuration;
  profilerEffectDuration += prevEffectDuration;
  return elapsedTime;
}
function resetComponentEffectTimers() {
  componentEffectEndTime = componentEffectStartTime = -1.1;
}
function pushComponentEffectStart() {
  var prevEffectStart = componentEffectStartTime;
  componentEffectStartTime = -1.1;
  return prevEffectStart;
}
function popComponentEffectStart(prevEffectStart) {
  0 <= prevEffectStart && (componentEffectStartTime = prevEffectStart);
}
function pushComponentEffectDuration() {
  var prevEffectDuration = componentEffectDuration;
  componentEffectDuration = -0;
  return prevEffectDuration;
}
function popComponentEffectDuration(prevEffectDuration) {
  0 <= prevEffectDuration && (componentEffectDuration = prevEffectDuration);
}
function pushComponentEffectErrors() {
  var prevErrors = componentEffectErrors;
  componentEffectErrors = null;
  return prevErrors;
}
function pushComponentEffectDidSpawnUpdate() {
  var prev = componentEffectSpawnedUpdate;
  componentEffectSpawnedUpdate = !1;
  return prev;
}
var currentUpdateIsNested = !1,
  nestedUpdateScheduled = !1;
function startProfilerTimer(fiber) {
  profilerStartTime = now();
  0 > fiber.actualStartTime && (fiber.actualStartTime = profilerStartTime);
}
function stopProfilerTimerIfRunningAndRecordDuration(fiber) {
  if (0 <= profilerStartTime) {
    var elapsedTime = now() - profilerStartTime;
    fiber.actualDuration += elapsedTime;
    fiber.selfBaseDuration = elapsedTime;
    profilerStartTime = -1;
  }
}
function stopProfilerTimerIfRunningAndRecordIncompleteDuration(fiber) {
  if (0 <= profilerStartTime) {
    var elapsedTime = now() - profilerStartTime;
    fiber.actualDuration += elapsedTime;
    profilerStartTime = -1;
  }
}
function recordEffectDuration() {
  if (0 <= profilerStartTime) {
    var endTime = now(),
      elapsedTime = endTime - profilerStartTime;
    profilerStartTime = -1;
    profilerEffectDuration += elapsedTime;
    componentEffectDuration += elapsedTime;
    componentEffectEndTime = endTime;
  }
}
function recordEffectError(errorInfo) {
  null === componentEffectErrors && (componentEffectErrors = []);
  componentEffectErrors.push(errorInfo);
  null === commitErrors && (commitErrors = []);
  commitErrors.push(errorInfo);
}
function startEffectTimer() {
  profilerStartTime = now();
  0 > componentEffectStartTime &&
    (componentEffectStartTime = profilerStartTime);
}
function transferActualDuration(fiber) {
  for (var child = fiber.child; child; )
    (fiber.actualDuration += child.actualDuration), (child = child.sibling);
}
var currentEntangledListeners = null,
  currentEntangledPendingCount = 0,
  currentEntangledLane = 0,
  currentEntangledActionThenable = null,
  isomorphicDefaultTransitionIndicator = void 0,
  pendingIsomorphicIndicator = null,
  pendingEntangledRoots = 0,
  needsIsomorphicIndicator = !1;
function entangleAsyncAction(transition, thenable) {
  if (null === currentEntangledListeners) {
    var entangledListeners = (currentEntangledListeners = []);
    currentEntangledPendingCount = 0;
    currentEntangledLane = requestTransitionLane();
    currentEntangledActionThenable = {
      status: "pending",
      value: void 0,
      then: function (resolve) {
        entangledListeners.push(resolve);
      }
    };
    needsIsomorphicIndicator = !0;
    didScheduleMicrotask ||
      ((didScheduleMicrotask = !0), scheduleImmediateRootScheduleTask());
  }
  currentEntangledPendingCount++;
  thenable.then(pingEngtangledActionScope, pingEngtangledActionScope);
  return thenable;
}
function pingEngtangledActionScope() {
  if (
    0 === --currentEntangledPendingCount &&
    (enableComponentPerformanceTrack &&
      (-1 < transitionUpdateTime || (transitionStartTime = -1.1)),
    0 === pendingEntangledRoots && stopIsomorphicDefaultIndicator(),
    null !== currentEntangledListeners)
  ) {
    null !== currentEntangledActionThenable &&
      (currentEntangledActionThenable.status = "fulfilled");
    var listeners = currentEntangledListeners;
    currentEntangledListeners = null;
    currentEntangledLane = 0;
    currentEntangledActionThenable = null;
    needsIsomorphicIndicator = !1;
    for (var i = 0; i < listeners.length; i++) (0, listeners[i])();
  }
}
function chainThenableValue(thenable, result) {
  var listeners = [],
    thenableWithOverride = {
      status: "pending",
      value: null,
      reason: null,
      then: function (resolve) {
        listeners.push(resolve);
      }
    };
  thenable.then(
    function () {
      thenableWithOverride.status = "fulfilled";
      thenableWithOverride.value = result;
      for (var i = 0; i < listeners.length; i++) (0, listeners[i])(result);
    },
    function (error) {
      thenableWithOverride.status = "rejected";
      thenableWithOverride.reason = error;
      for (error = 0; error < listeners.length; error++)
        (0, listeners[error])(void 0);
    }
  );
  return thenableWithOverride;
}
function registerDefaultIndicator(onDefaultTransitionIndicator) {
  void 0 === isomorphicDefaultTransitionIndicator
    ? (isomorphicDefaultTransitionIndicator = onDefaultTransitionIndicator)
    : isomorphicDefaultTransitionIndicator !== onDefaultTransitionIndicator &&
      ((isomorphicDefaultTransitionIndicator = null),
      stopIsomorphicDefaultIndicator());
}
function stopIsomorphicDefaultIndicator() {
  if (null !== pendingIsomorphicIndicator) {
    var cleanup = pendingIsomorphicIndicator;
    pendingIsomorphicIndicator = null;
    cleanup();
  }
}
function releaseIsomorphicIndicator() {
  0 === --pendingEntangledRoots && stopIsomorphicDefaultIndicator();
}
var prevOnStartTransitionFinish = ReactSharedInternals.S;
ReactSharedInternals.S = function (transition, returnValue) {
  globalMostRecentTransitionTime = now$1();
  if (
    "object" === typeof returnValue &&
    null !== returnValue &&
    "function" === typeof returnValue.then
  ) {
    if (
      enableComponentPerformanceTrack &&
      0 > transitionStartTime &&
      0 > transitionUpdateTime
    ) {
      transitionStartTime = now();
      var newEventTime = resolveEventTimeStamp(),
        newEventType = resolveEventType();
      if (
        newEventTime !== transitionEventRepeatTime ||
        newEventType !== transitionEventType
      )
        transitionEventRepeatTime = -1.1;
      transitionEventTime = newEventTime;
      transitionEventType = newEventType;
    }
    entangleAsyncAction(transition, returnValue);
  }
  null !== prevOnStartTransitionFinish &&
    prevOnStartTransitionFinish(transition, returnValue);
};
var resumedCache = createCursor(null);
function peekCacheFromPool() {
  var cacheResumedFromPreviousRender = resumedCache.current;
  return null !== cacheResumedFromPreviousRender
    ? cacheResumedFromPreviousRender
    : workInProgressRoot.pooledCache;
}
function pushTransition(offscreenWorkInProgress, prevCachePool) {
  null === prevCachePool
    ? push(resumedCache, resumedCache.current)
    : push(resumedCache, prevCachePool.pool);
}
function getSuspendedCache() {
  var cacheFromPool = peekCacheFromPool();
  return null === cacheFromPool
    ? null
    : { parent: CacheContext._currentValue, pool: cacheFromPool };
}
var SuspenseException = Error(formatProdErrorMessage(460)),
  SuspenseyCommitException = Error(formatProdErrorMessage(474)),
  SuspenseActionException = Error(formatProdErrorMessage(542)),
  noopSuspenseyCommitThenable = { then: function () {} };
function isThenableResolved(thenable) {
  thenable = thenable.status;
  return "fulfilled" === thenable || "rejected" === thenable;
}
function trackUsedThenable(thenableState, thenable, index) {
  index = thenableState[index];
  void 0 === index
    ? thenableState.push(thenable)
    : index !== thenable && (thenable.then(noop$1, noop$1), (thenable = index));
  switch (thenable.status) {
    case "fulfilled":
      return thenable.value;
    case "rejected":
      throw (
        ((thenableState = thenable.reason),
        checkIfUseWrappedInAsyncCatch(thenableState),
        thenableState)
      );
    default:
      if ("string" === typeof thenable.status) thenable.then(noop$1, noop$1);
      else {
        thenableState = workInProgressRoot;
        if (null !== thenableState && 100 < thenableState.shellSuspendCounter)
          throw Error(formatProdErrorMessage(482));
        thenableState = thenable;
        thenableState.status = "pending";
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
        );
      }
      switch (thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw (
            ((thenableState = thenable.reason),
            checkIfUseWrappedInAsyncCatch(thenableState),
            thenableState)
          );
      }
      suspendedThenable = thenable;
      throw SuspenseException;
  }
}
function resolveLazy(lazyType) {
  try {
    var init = lazyType._init;
    return init(lazyType._payload);
  } catch (x) {
    if (null !== x && "object" === typeof x && "function" === typeof x.then)
      throw ((suspendedThenable = x), SuspenseException);
    throw x;
  }
}
var suspendedThenable = null;
function getSuspendedThenable() {
  if (null === suspendedThenable) throw Error(formatProdErrorMessage(459));
  var thenable = suspendedThenable;
  suspendedThenable = null;
  return thenable;
}
function checkIfUseWrappedInAsyncCatch(rejectedReason) {
  if (
    rejectedReason === SuspenseException ||
    rejectedReason === SuspenseActionException
  )
    throw Error(formatProdErrorMessage(483));
}
var thenableState$1 = null,
  thenableIndexCounter$1 = 0;
function unwrapThenable(thenable) {
  var index = thenableIndexCounter$1;
  thenableIndexCounter$1 += 1;
  null === thenableState$1 && (thenableState$1 = []);
  return trackUsedThenable(thenableState$1, thenable, index);
}
function coerceRef(workInProgress, element) {
  element = element.props.ref;
  workInProgress.ref = void 0 !== element ? element : null;
}
function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
  if (newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE)
    throw Error(formatProdErrorMessage(525));
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
  function mapRemainingChildren(currentFirstChild) {
    for (var existingChildren = new Map(); null !== currentFirstChild; )
      null !== currentFirstChild.key
        ? existingChildren.set(currentFirstChild.key, currentFirstChild)
        : existingChildren.set(currentFirstChild.index, currentFirstChild),
        (currentFirstChild = currentFirstChild.sibling);
    return existingChildren;
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
          ? ((newFiber.flags |= 67108866), lastPlacedIndex)
          : newIndex
      );
    newFiber.flags |= 67108866;
    return lastPlacedIndex;
  }
  function placeSingleChild(newFiber) {
    shouldTrackSideEffects &&
      null === newFiber.alternate &&
      (newFiber.flags |= 67108866);
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
      return (
        (returnFiber = updateFragment(
          returnFiber,
          current,
          element.props.children,
          lanes,
          element.key
        )),
        enableFragmentRefs && coerceRef(returnFiber, element),
        returnFiber
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
        (current = useFiber(current, element.props)),
        coerceRef(current, element),
        (current.return = returnFiber),
        current
      );
    current = createFiberFromTypeAndProps(
      element.type,
      element.key,
      element.props,
      null,
      returnFiber.mode,
      lanes
    );
    coerceRef(current, element);
    current.return = returnFiber;
    return current;
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
      "number" === typeof newChild ||
      "bigint" === typeof newChild
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
            coerceRef(lanes, newChild),
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
          return (
            (newChild = resolveLazy(newChild)),
            createChild(returnFiber, newChild, lanes)
          );
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
      if ("function" === typeof newChild.then)
        return createChild(returnFiber, unwrapThenable(newChild), lanes);
      if (newChild.$$typeof === REACT_CONTEXT_TYPE)
        return createChild(
          returnFiber,
          readContextDuringReconciliation(returnFiber, newChild),
          lanes
        );
      throwOnInvalidObjectTypeImpl(returnFiber, newChild);
    }
    return null;
  }
  function updateSlot(returnFiber, oldFiber, newChild, lanes) {
    var key = null !== oldFiber ? oldFiber.key : null;
    if (
      ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild ||
      "bigint" === typeof newChild
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
            (newChild = resolveLazy(newChild)),
            updateSlot(returnFiber, oldFiber, newChild, lanes)
          );
      }
      if (isArrayImpl(newChild) || getIteratorFn(newChild))
        return null !== key
          ? null
          : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
      if ("function" === typeof newChild.then)
        return updateSlot(
          returnFiber,
          oldFiber,
          unwrapThenable(newChild),
          lanes
        );
      if (newChild.$$typeof === REACT_CONTEXT_TYPE)
        return updateSlot(
          returnFiber,
          oldFiber,
          readContextDuringReconciliation(returnFiber, newChild),
          lanes
        );
      throwOnInvalidObjectTypeImpl(returnFiber, newChild);
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
      "number" === typeof newChild ||
      "bigint" === typeof newChild
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
          return (
            (newChild = resolveLazy(newChild)),
            updateFromMap(
              existingChildren,
              returnFiber,
              newIdx,
              newChild,
              lanes
            )
          );
      }
      if (isArrayImpl(newChild) || getIteratorFn(newChild))
        return (
          (existingChildren = existingChildren.get(newIdx) || null),
          updateFragment(returnFiber, existingChildren, newChild, lanes, null)
        );
      if ("function" === typeof newChild.then)
        return updateFromMap(
          existingChildren,
          returnFiber,
          newIdx,
          unwrapThenable(newChild),
          lanes
        );
      if (newChild.$$typeof === REACT_CONTEXT_TYPE)
        return updateFromMap(
          existingChildren,
          returnFiber,
          newIdx,
          readContextDuringReconciliation(returnFiber, newChild),
          lanes
        );
      throwOnInvalidObjectTypeImpl(returnFiber, newChild);
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
        deleteRemainingChildren(returnFiber, oldFiber),
        isHydrating && pushTreeFork(returnFiber, newIdx),
        resultingFirstChild
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
      isHydrating && pushTreeFork(returnFiber, newIdx);
      return resultingFirstChild;
    }
    for (
      oldFiber = mapRemainingChildren(oldFiber);
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
      oldFiber.forEach(function (child) {
        return deleteChild(returnFiber, child);
      });
    isHydrating && pushTreeFork(returnFiber, newIdx);
    return resultingFirstChild;
  }
  function reconcileChildrenIterator(
    returnFiber,
    currentFirstChild,
    newChildren,
    lanes
  ) {
    if (null == newChildren) throw Error(formatProdErrorMessage(151));
    for (
      var resultingFirstChild = null,
        previousNewFiber = null,
        oldFiber = currentFirstChild,
        newIdx = (currentFirstChild = 0),
        nextOldFiber = null,
        step = newChildren.next();
      null !== oldFiber && !step.done;
      newIdx++, step = newChildren.next()
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
        ? (resultingFirstChild = newFiber)
        : (previousNewFiber.sibling = newFiber);
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (step.done)
      return (
        deleteRemainingChildren(returnFiber, oldFiber),
        isHydrating && pushTreeFork(returnFiber, newIdx),
        resultingFirstChild
      );
    if (null === oldFiber) {
      for (; !step.done; newIdx++, step = newChildren.next())
        (step = createChild(returnFiber, step.value, lanes)),
          null !== step &&
            ((currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
            null === previousNewFiber
              ? (resultingFirstChild = step)
              : (previousNewFiber.sibling = step),
            (previousNewFiber = step));
      isHydrating && pushTreeFork(returnFiber, newIdx);
      return resultingFirstChild;
    }
    for (
      oldFiber = mapRemainingChildren(oldFiber);
      !step.done;
      newIdx++, step = newChildren.next()
    )
      (step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes)),
        null !== step &&
          (shouldTrackSideEffects &&
            null !== step.alternate &&
            oldFiber.delete(null === step.key ? newIdx : step.key),
          (currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
          null === previousNewFiber
            ? (resultingFirstChild = step)
            : (previousNewFiber.sibling = step),
          (previousNewFiber = step));
    shouldTrackSideEffects &&
      oldFiber.forEach(function (child) {
        return deleteChild(returnFiber, child);
      });
    isHydrating && pushTreeFork(returnFiber, newIdx);
    return resultingFirstChild;
  }
  function reconcileChildFibersImpl(
    returnFiber,
    currentFirstChild,
    newChild,
    lanes
  ) {
    "object" === typeof newChild &&
      null !== newChild &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      null === newChild.key &&
      (enableFragmentRefs ? void 0 === newChild.props.ref : 1) &&
      (newChild = newChild.props.children);
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          a: {
            for (var key = newChild.key; null !== currentFirstChild; ) {
              if (currentFirstChild.key === key) {
                key = newChild.type;
                if (key === REACT_FRAGMENT_TYPE) {
                  if (7 === currentFirstChild.tag) {
                    deleteRemainingChildren(
                      returnFiber,
                      currentFirstChild.sibling
                    );
                    lanes = useFiber(
                      currentFirstChild,
                      newChild.props.children
                    );
                    enableFragmentRefs && coerceRef(lanes, newChild);
                    lanes.return = returnFiber;
                    returnFiber = lanes;
                    break a;
                  }
                } else if (
                  currentFirstChild.elementType === key ||
                  ("object" === typeof key &&
                    null !== key &&
                    key.$$typeof === REACT_LAZY_TYPE &&
                    resolveLazy(key) === currentFirstChild.type)
                ) {
                  deleteRemainingChildren(
                    returnFiber,
                    currentFirstChild.sibling
                  );
                  lanes = useFiber(currentFirstChild, newChild.props);
                  coerceRef(lanes, newChild);
                  lanes.return = returnFiber;
                  returnFiber = lanes;
                  break a;
                }
                deleteRemainingChildren(returnFiber, currentFirstChild);
                break;
              } else deleteChild(returnFiber, currentFirstChild);
              currentFirstChild = currentFirstChild.sibling;
            }
            newChild.type === REACT_FRAGMENT_TYPE
              ? ((lanes = createFiberFromFragment(
                  newChild.props.children,
                  returnFiber.mode,
                  lanes,
                  newChild.key
                )),
                enableFragmentRefs && coerceRef(lanes, newChild),
                (lanes.return = returnFiber),
                (returnFiber = lanes))
              : ((lanes = createFiberFromTypeAndProps(
                  newChild.type,
                  newChild.key,
                  newChild.props,
                  null,
                  returnFiber.mode,
                  lanes
                )),
                coerceRef(lanes, newChild),
                (lanes.return = returnFiber),
                (returnFiber = lanes));
          }
          return placeSingleChild(returnFiber);
        case REACT_PORTAL_TYPE:
          a: {
            for (key = newChild.key; null !== currentFirstChild; ) {
              if (currentFirstChild.key === key)
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
                  lanes = useFiber(currentFirstChild, newChild.children || []);
                  lanes.return = returnFiber;
                  returnFiber = lanes;
                  break a;
                } else {
                  deleteRemainingChildren(returnFiber, currentFirstChild);
                  break;
                }
              else deleteChild(returnFiber, currentFirstChild);
              currentFirstChild = currentFirstChild.sibling;
            }
            lanes = createFiberFromPortal(newChild, returnFiber.mode, lanes);
            lanes.return = returnFiber;
            returnFiber = lanes;
          }
          return placeSingleChild(returnFiber);
        case REACT_LAZY_TYPE:
          return (
            (newChild = resolveLazy(newChild)),
            reconcileChildFibersImpl(
              returnFiber,
              currentFirstChild,
              newChild,
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
      if (getIteratorFn(newChild)) {
        key = getIteratorFn(newChild);
        if ("function" !== typeof key) throw Error(formatProdErrorMessage(150));
        newChild = key.call(newChild);
        return reconcileChildrenIterator(
          returnFiber,
          currentFirstChild,
          newChild,
          lanes
        );
      }
      if ("function" === typeof newChild.then)
        return reconcileChildFibersImpl(
          returnFiber,
          currentFirstChild,
          unwrapThenable(newChild),
          lanes
        );
      if (newChild.$$typeof === REACT_CONTEXT_TYPE)
        return reconcileChildFibersImpl(
          returnFiber,
          currentFirstChild,
          readContextDuringReconciliation(returnFiber, newChild),
          lanes
        );
      throwOnInvalidObjectTypeImpl(returnFiber, newChild);
    }
    return ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild ||
      "bigint" === typeof newChild
      ? ((newChild = "" + newChild),
        null !== currentFirstChild && 6 === currentFirstChild.tag
          ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling),
            (lanes = useFiber(currentFirstChild, newChild)),
            (lanes.return = returnFiber),
            (returnFiber = lanes))
          : (deleteRemainingChildren(returnFiber, currentFirstChild),
            (lanes = createFiberFromText(newChild, returnFiber.mode, lanes)),
            (lanes.return = returnFiber),
            (returnFiber = lanes)),
        placeSingleChild(returnFiber))
      : deleteRemainingChildren(returnFiber, currentFirstChild);
  }
  return function (returnFiber, currentFirstChild, newChild, lanes) {
    try {
      thenableIndexCounter$1 = 0;
      var firstChildFiber = reconcileChildFibersImpl(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes
      );
      thenableState$1 = null;
      return firstChildFiber;
    } catch (x) {
      if (
        x === SuspenseException ||
        x === SuspenseActionException ||
        (0 === (returnFiber.mode & 1) &&
          "object" === typeof x &&
          null !== x &&
          "function" === typeof x.then)
      )
        throw x;
      var fiber = createFiber(29, x, null, returnFiber.mode);
      fiber.lanes = lanes;
      fiber.return = returnFiber;
      return fiber;
    } finally {
    }
  };
}
var reconcileChildFibers = createChildReconciler(!0),
  mountChildFibers = createChildReconciler(!1),
  hasForceUpdate = !1;
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
function createUpdate(lane) {
  return { lane: lane, tag: 0, payload: null, callback: null, next: null };
}
function enqueueUpdate(fiber, update, lane) {
  var updateQueue = fiber.updateQueue;
  if (null === updateQueue) return null;
  updateQueue = updateQueue.shared;
  if (0 !== (executionContext & 2)) {
    var pending = updateQueue.pending;
    null === pending
      ? (update.next = update)
      : ((update.next = pending.next), (pending.next = update));
    updateQueue.pending = update;
    update = getRootForUpdatedFiber(fiber);
    markUpdateLaneFromFiberToRoot(fiber, null, lane);
    return update;
  }
  enqueueUpdate$1(fiber, updateQueue, update, lane);
  return getRootForUpdatedFiber(fiber);
}
function entangleTransitions(root, fiber, lane) {
  fiber = fiber.updateQueue;
  if (null !== fiber && ((fiber = fiber.shared), 0 !== (lane & 4194048))) {
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
var didReadFromEntangledAsyncAction = !1;
function suspendIfUpdateReadFromEntangledAsyncAction() {
  if (didReadFromEntangledAsyncAction) {
    var entangledActionThenable = currentEntangledActionThenable;
    if (null !== entangledActionThenable) throw entangledActionThenable;
  }
}
function processUpdateQueue(
  workInProgress$jscomp$0,
  props,
  instance$jscomp$0,
  renderLanes
) {
  didReadFromEntangledAsyncAction = !1;
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
      var updateLane = pendingQueue.lane & -536870913,
        isHiddenUpdate = updateLane !== pendingQueue.lane;
      if (
        isHiddenUpdate
          ? (workInProgressRootRenderLanes & updateLane) === updateLane
          : (renderLanes & updateLane) === updateLane
      ) {
        0 !== updateLane &&
          updateLane === currentEntangledLane &&
          (didReadFromEntangledAsyncAction = !0);
        null !== current &&
          (current = current.next =
            {
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
          var instance = instance$jscomp$0;
          switch (update.tag) {
            case 1:
              workInProgress = update.payload;
              if ("function" === typeof workInProgress) {
                newState = workInProgress.call(instance, newState, updateLane);
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
                  ? workInProgress.call(instance, newState, updateLane)
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
var currentTreeHiddenStackCursor = createCursor(null),
  prevEntangledRenderLanesCursor = createCursor(0);
function pushHiddenContext(fiber, context) {
  fiber = entangledRenderLanes;
  push(prevEntangledRenderLanesCursor, fiber);
  push(currentTreeHiddenStackCursor, context);
  entangledRenderLanes = fiber | context.baseLanes;
}
function reuseHiddenContextOnStack() {
  push(prevEntangledRenderLanesCursor, entangledRenderLanes);
  push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
}
function popHiddenContext() {
  entangledRenderLanes = prevEntangledRenderLanesCursor.current;
  pop(currentTreeHiddenStackCursor);
  pop(prevEntangledRenderLanesCursor);
}
var suspenseHandlerStackCursor = createCursor(null),
  shellBoundary = null;
function pushPrimaryTreeSuspenseHandler(handler) {
  var current = handler.alternate;
  push(suspenseStackCursor, suspenseStackCursor.current & 1);
  push(suspenseHandlerStackCursor, handler);
  null === shellBoundary &&
    (null === current || null !== currentTreeHiddenStackCursor.current
      ? (shellBoundary = handler)
      : null !== current.memoizedState && (shellBoundary = handler));
}
function pushDehydratedActivitySuspenseHandler(fiber) {
  push(suspenseStackCursor, suspenseStackCursor.current);
  push(suspenseHandlerStackCursor, fiber);
  null === shellBoundary && (shellBoundary = fiber);
}
function pushOffscreenSuspenseHandler(fiber) {
  22 === fiber.tag
    ? (push(suspenseStackCursor, suspenseStackCursor.current),
      push(suspenseHandlerStackCursor, fiber),
      null === shellBoundary && (shellBoundary = fiber))
    : reuseSuspenseHandlerOnStack(fiber);
}
function reuseSuspenseHandlerOnStack() {
  push(suspenseStackCursor, suspenseStackCursor.current);
  push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
}
function popSuspenseHandler(fiber) {
  pop(suspenseHandlerStackCursor);
  shellBoundary === fiber && (shellBoundary = null);
  pop(suspenseStackCursor);
}
var suspenseStackCursor = createCursor(0);
function findFirstSuspended(row) {
  for (var node = row; null !== node; ) {
    if (13 === node.tag) {
      var state = node.memoizedState;
      if (
        null !== state &&
        ((state = state.dehydrated),
        null === state ||
          isSuspenseInstancePending(state) ||
          isSuspenseInstanceFallback(state))
      )
        return node;
    } else if (
      19 === node.tag &&
      ("forwards" === node.memoizedProps.revealOrder ||
        "backwards" === node.memoizedProps.revealOrder ||
        "unstable_legacy-backwards" === node.memoizedProps.revealOrder ||
        "together" === node.memoizedProps.revealOrder)
    ) {
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
var renderLanes = 0,
  currentlyRenderingFiber = null,
  currentHook = null,
  workInProgressHook = null,
  didScheduleRenderPhaseUpdate = !1,
  didScheduleRenderPhaseUpdateDuringThisPass = !1,
  shouldDoubleInvokeUserFnsInHooksDEV = !1,
  localIdCounter = 0,
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
  ReactSharedInternals.H =
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
  ReactSharedInternals.H = ContextOnlyDispatcher;
  var didRenderTooFewHooks = null !== currentHook && null !== currentHook.next;
  renderLanes = 0;
  workInProgressHook = currentHook = currentlyRenderingFiber = null;
  didScheduleRenderPhaseUpdate = !1;
  thenableIndexCounter = 0;
  thenableState = null;
  if (didRenderTooFewHooks) throw Error(formatProdErrorMessage(300));
  null === current ||
    didReceiveUpdate ||
    ((current = current.dependencies),
    null !== current &&
      checkIfContextChanged(current) &&
      (didReceiveUpdate = !0));
}
function renderWithHooksAgain(workInProgress, Component, props, secondArg) {
  currentlyRenderingFiber = workInProgress;
  var numberOfReRenders = 0;
  do {
    didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null);
    thenableIndexCounter = 0;
    didScheduleRenderPhaseUpdateDuringThisPass = !1;
    if (25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
    numberOfReRenders += 1;
    workInProgressHook = currentHook = null;
    if (null != workInProgress.updateQueue) {
      var children = workInProgress.updateQueue;
      children.lastEffect = null;
      children.events = null;
      children.stores = null;
      null != children.memoCache && (children.memoCache.index = 0);
    }
    ReactSharedInternals.H = HooksDispatcherOnRerender;
    children = Component(props, secondArg);
  } while (didScheduleRenderPhaseUpdateDuringThisPass);
  return children;
}
function TransitionAwareHostComponent() {
  var dispatcher = ReactSharedInternals.H,
    maybeThenable = dispatcher.useState()[0];
  maybeThenable =
    "function" === typeof maybeThenable.then
      ? useThenable(maybeThenable)
      : maybeThenable;
  dispatcher = dispatcher.useState()[0];
  (null !== currentHook ? currentHook.memoizedState : null) !== dispatcher &&
    (currentlyRenderingFiber.flags |= 1024);
  return maybeThenable;
}
function checkDidRenderIdHook() {
  var didRenderIdHook = 0 !== localIdCounter;
  localIdCounter = 0;
  return didRenderIdHook;
}
function bailoutHooks(current, workInProgress, lanes) {
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.flags &= -2053;
  current.lanes &= ~lanes;
}
function resetHooksOnUnwind(workInProgress) {
  if (didScheduleRenderPhaseUpdate) {
    for (
      workInProgress = workInProgress.memoizedState;
      null !== workInProgress;

    ) {
      var queue = workInProgress.queue;
      null !== queue && (queue.pending = null);
      workInProgress = workInProgress.next;
    }
    didScheduleRenderPhaseUpdate = !1;
  }
  renderLanes = 0;
  workInProgressHook = currentHook = currentlyRenderingFiber = null;
  didScheduleRenderPhaseUpdateDuringThisPass = !1;
  thenableIndexCounter = localIdCounter = 0;
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
    if (null === nextCurrentHook) {
      if (null === currentlyRenderingFiber.alternate)
        throw Error(formatProdErrorMessage(467));
      throw Error(formatProdErrorMessage(310));
    }
    currentHook = nextCurrentHook;
    nextCurrentHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null
    };
    null === workInProgressHook
      ? (currentlyRenderingFiber.memoizedState = workInProgressHook =
          nextCurrentHook)
      : (workInProgressHook = workInProgressHook.next = nextCurrentHook);
  }
  return workInProgressHook;
}
function createFunctionComponentUpdateQueue() {
  return { lastEffect: null, events: null, stores: null, memoCache: null };
}
function useThenable(thenable) {
  var index = thenableIndexCounter;
  thenableIndexCounter += 1;
  null === thenableState && (thenableState = []);
  thenable = trackUsedThenable(thenableState, thenable, index);
  index = currentlyRenderingFiber;
  null ===
    (null === workInProgressHook
      ? index.memoizedState
      : workInProgressHook.next) &&
    ((index = index.alternate),
    (ReactSharedInternals.H =
      null === index || null === index.memoizedState
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate));
  return thenable;
}
function use(usable) {
  if (null !== usable && "object" === typeof usable) {
    if ("function" === typeof usable.then) return useThenable(usable);
    if (usable.$$typeof === REACT_CONTEXT_TYPE) return readContext(usable);
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
            data: current.data.map(function (array) {
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
  var hook = updateWorkInProgressHook();
  return updateReducerImpl(hook, currentHook, reducer);
}
function updateReducerImpl(hook, current, reducer) {
  var queue = hook.queue;
  if (null === queue) throw Error(formatProdErrorMessage(311));
  queue.lastRenderedReducer = reducer;
  var baseQueue = hook.baseQueue,
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
  pendingQueue = hook.baseState;
  if (null === baseQueue) hook.memoizedState = pendingQueue;
  else {
    current = baseQueue.next;
    var newBaseQueueFirst = (baseFirst = null),
      newBaseQueueLast = null,
      update = current,
      didReadFromEntangledAsyncAction$73 = !1;
    do {
      var updateLane = update.lane & -536870913;
      if (
        updateLane !== update.lane
          ? (workInProgressRootRenderLanes & updateLane) === updateLane
          : (renderLanes & updateLane) === updateLane
      ) {
        var revertLane = update.revertLane;
        if (0 === revertLane)
          null !== newBaseQueueLast &&
            (newBaseQueueLast = newBaseQueueLast.next =
              {
                lane: 0,
                revertLane: 0,
                gesture: null,
                action: update.action,
                hasEagerState: update.hasEagerState,
                eagerState: update.eagerState,
                next: null
              }),
            updateLane === currentEntangledLane &&
              (didReadFromEntangledAsyncAction$73 = !0);
        else if ((renderLanes & revertLane) === revertLane) {
          update = update.next;
          revertLane === currentEntangledLane &&
            (didReadFromEntangledAsyncAction$73 = !0);
          continue;
        } else
          (updateLane = {
            lane: 0,
            revertLane: update.revertLane,
            gesture: null,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: null
          }),
            null === newBaseQueueLast
              ? ((newBaseQueueFirst = newBaseQueueLast = updateLane),
                (baseFirst = pendingQueue))
              : (newBaseQueueLast = newBaseQueueLast.next = updateLane),
            (currentlyRenderingFiber.lanes |= revertLane),
            (workInProgressRootSkippedLanes |= revertLane);
        updateLane = update.action;
        shouldDoubleInvokeUserFnsInHooksDEV &&
          reducer(pendingQueue, updateLane);
        pendingQueue = update.hasEagerState
          ? update.eagerState
          : reducer(pendingQueue, updateLane);
      } else
        (revertLane = {
          lane: updateLane,
          revertLane: update.revertLane,
          gesture: update.gesture,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: null
        }),
          null === newBaseQueueLast
            ? ((newBaseQueueFirst = newBaseQueueLast = revertLane),
              (baseFirst = pendingQueue))
            : (newBaseQueueLast = newBaseQueueLast.next = revertLane),
          (currentlyRenderingFiber.lanes |= updateLane),
          (workInProgressRootSkippedLanes |= updateLane);
      update = update.next;
    } while (null !== update && update !== current);
    null === newBaseQueueLast
      ? (baseFirst = pendingQueue)
      : (newBaseQueueLast.next = newBaseQueueFirst);
    if (
      !objectIs(pendingQueue, hook.memoizedState) &&
      ((didReceiveUpdate = !0),
      didReadFromEntangledAsyncAction$73 &&
        ((reducer = currentEntangledActionThenable), null !== reducer))
    )
      throw reducer;
    hook.memoizedState = pendingQueue;
    hook.baseState = baseFirst;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = pendingQueue;
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
function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  var fiber = currentlyRenderingFiber,
    hook = updateWorkInProgressHook(),
    isHydrating$jscomp$0 = isHydrating;
  if (isHydrating$jscomp$0) {
    if (void 0 === getServerSnapshot) throw Error(formatProdErrorMessage(407));
    getServerSnapshot = getServerSnapshot();
  } else getServerSnapshot = getSnapshot();
  var snapshotChanged = !objectIs(
    (currentHook || hook).memoizedState,
    getServerSnapshot
  );
  snapshotChanged &&
    ((hook.memoizedState = getServerSnapshot), (didReceiveUpdate = !0));
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
    pushSimpleEffect(
      9,
      { destroy: void 0 },
      updateStoreInstance.bind(
        null,
        fiber,
        hook,
        getServerSnapshot,
        getSnapshot
      ),
      null
    );
    if (null === workInProgressRoot) throw Error(formatProdErrorMessage(349));
    isHydrating$jscomp$0 ||
      0 !== (renderLanes & 127) ||
      pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
  }
  return getServerSnapshot;
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
  return subscribe(function () {
    checkIfSnapshotChanged(inst) &&
      (startUpdateTimerByLane(2), forceStoreRerender(fiber));
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
  var root = enqueueConcurrentRenderForLane(fiber, 2);
  null !== root && scheduleUpdateOnFiber(root, fiber, 2);
}
function mountStateImpl(initialState) {
  var hook = mountWorkInProgressHook();
  if ("function" === typeof initialState) {
    var initialStateInitializer = initialState;
    initialState = initialStateInitializer();
    if (shouldDoubleInvokeUserFnsInHooksDEV) {
      setIsStrictModeForDevtools(!0);
      try {
        initialStateInitializer();
      } finally {
        setIsStrictModeForDevtools(!1);
      }
    }
  }
  hook.memoizedState = hook.baseState = initialState;
  hook.queue = {
    pending: null,
    lanes: 0,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState
  };
  return hook;
}
function updateOptimisticImpl(hook, current, passthrough, reducer) {
  hook.baseState = passthrough;
  return updateReducerImpl(
    hook,
    currentHook,
    "function" === typeof reducer ? reducer : basicStateReducer
  );
}
function dispatchActionState(
  fiber,
  actionQueue,
  setPendingState,
  setState,
  payload
) {
  if (isRenderPhaseUpdate(fiber)) throw Error(formatProdErrorMessage(485));
  fiber = actionQueue.action;
  if (null !== fiber) {
    var actionNode = {
      payload: payload,
      action: fiber,
      next: null,
      isTransition: !0,
      status: "pending",
      value: null,
      reason: null,
      listeners: [],
      then: function (listener) {
        actionNode.listeners.push(listener);
      }
    };
    null !== ReactSharedInternals.T
      ? setPendingState(!0)
      : (actionNode.isTransition = !1);
    setState(actionNode);
    setPendingState = actionQueue.pending;
    null === setPendingState
      ? ((actionNode.next = actionQueue.pending = actionNode),
        runActionStateAction(actionQueue, actionNode))
      : ((actionNode.next = setPendingState.next),
        (actionQueue.pending = setPendingState.next = actionNode));
  }
}
function runActionStateAction(actionQueue, node) {
  var action = node.action,
    payload = node.payload,
    prevState = actionQueue.state;
  if (node.isTransition) {
    var prevTransition = ReactSharedInternals.T,
      currentTransition = {};
    ReactSharedInternals.T = currentTransition;
    try {
      var returnValue = action(prevState, payload),
        onStartTransitionFinish = ReactSharedInternals.S;
      null !== onStartTransitionFinish &&
        onStartTransitionFinish(currentTransition, returnValue);
      handleActionReturnValue(actionQueue, node, returnValue);
    } catch (error) {
      onActionError(actionQueue, node, error);
    } finally {
      null !== prevTransition &&
        null !== currentTransition.types &&
        (prevTransition.types = currentTransition.types),
        (ReactSharedInternals.T = prevTransition);
    }
  } else
    try {
      (prevTransition = action(prevState, payload)),
        handleActionReturnValue(actionQueue, node, prevTransition);
    } catch (error$79) {
      onActionError(actionQueue, node, error$79);
    }
}
function handleActionReturnValue(actionQueue, node, returnValue) {
  null !== returnValue &&
  "object" === typeof returnValue &&
  "function" === typeof returnValue.then
    ? returnValue.then(
        function (nextState) {
          onActionSuccess(actionQueue, node, nextState);
        },
        function (error) {
          return onActionError(actionQueue, node, error);
        }
      )
    : onActionSuccess(actionQueue, node, returnValue);
}
function onActionSuccess(actionQueue, actionNode, nextState) {
  actionNode.status = "fulfilled";
  actionNode.value = nextState;
  notifyActionListeners(actionNode);
  actionQueue.state = nextState;
  actionNode = actionQueue.pending;
  null !== actionNode &&
    ((nextState = actionNode.next),
    nextState === actionNode
      ? (actionQueue.pending = null)
      : ((nextState = nextState.next),
        (actionNode.next = nextState),
        runActionStateAction(actionQueue, nextState)));
}
function onActionError(actionQueue, actionNode, error) {
  var last = actionQueue.pending;
  actionQueue.pending = null;
  if (null !== last) {
    last = last.next;
    do
      (actionNode.status = "rejected"),
        (actionNode.reason = error),
        notifyActionListeners(actionNode),
        (actionNode = actionNode.next);
    while (actionNode !== last);
  }
  actionQueue.action = null;
}
function notifyActionListeners(actionNode) {
  actionNode = actionNode.listeners;
  for (var i = 0; i < actionNode.length; i++) (0, actionNode[i])();
}
function actionStateReducer(oldState, newState) {
  return newState;
}
function mountActionState(action, initialStateProp) {
  if (isHydrating) {
    var ssrFormState = workInProgressRoot.formState;
    if (null !== ssrFormState) {
      a: {
        var JSCompiler_inline_result = currentlyRenderingFiber;
        if (isHydrating) {
          if (nextHydratableInstance) {
            b: {
              var JSCompiler_inline_result$jscomp$0 = nextHydratableInstance;
              for (
                var inRootOrSingleton = rootOrSingletonContext;
                8 !== JSCompiler_inline_result$jscomp$0.nodeType;

              ) {
                if (!inRootOrSingleton) {
                  JSCompiler_inline_result$jscomp$0 = null;
                  break b;
                }
                JSCompiler_inline_result$jscomp$0 = getNextHydratable(
                  JSCompiler_inline_result$jscomp$0.nextSibling
                );
                if (null === JSCompiler_inline_result$jscomp$0) {
                  JSCompiler_inline_result$jscomp$0 = null;
                  break b;
                }
              }
              inRootOrSingleton = JSCompiler_inline_result$jscomp$0.data;
              JSCompiler_inline_result$jscomp$0 =
                "F!" === inRootOrSingleton || "F" === inRootOrSingleton
                  ? JSCompiler_inline_result$jscomp$0
                  : null;
            }
            if (JSCompiler_inline_result$jscomp$0) {
              nextHydratableInstance = getNextHydratable(
                JSCompiler_inline_result$jscomp$0.nextSibling
              );
              JSCompiler_inline_result =
                "F!" === JSCompiler_inline_result$jscomp$0.data;
              break a;
            }
          }
          throwOnHydrationMismatch(JSCompiler_inline_result);
        }
        JSCompiler_inline_result = !1;
      }
      JSCompiler_inline_result && (initialStateProp = ssrFormState[0]);
    }
  }
  ssrFormState = mountWorkInProgressHook();
  ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp;
  JSCompiler_inline_result = {
    pending: null,
    lanes: 0,
    dispatch: null,
    lastRenderedReducer: actionStateReducer,
    lastRenderedState: initialStateProp
  };
  ssrFormState.queue = JSCompiler_inline_result;
  ssrFormState = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    JSCompiler_inline_result
  );
  JSCompiler_inline_result.dispatch = ssrFormState;
  JSCompiler_inline_result = mountStateImpl(!1);
  inRootOrSingleton = dispatchOptimisticSetState.bind(
    null,
    currentlyRenderingFiber,
    !1,
    JSCompiler_inline_result.queue
  );
  JSCompiler_inline_result = mountWorkInProgressHook();
  JSCompiler_inline_result$jscomp$0 = {
    state: initialStateProp,
    dispatch: null,
    action: action,
    pending: null
  };
  JSCompiler_inline_result.queue = JSCompiler_inline_result$jscomp$0;
  ssrFormState = dispatchActionState.bind(
    null,
    currentlyRenderingFiber,
    JSCompiler_inline_result$jscomp$0,
    inRootOrSingleton,
    ssrFormState
  );
  JSCompiler_inline_result$jscomp$0.dispatch = ssrFormState;
  JSCompiler_inline_result.memoizedState = action;
  return [initialStateProp, ssrFormState, !1];
}
function updateActionState(action) {
  var stateHook = updateWorkInProgressHook();
  return updateActionStateImpl(stateHook, currentHook, action);
}
function updateActionStateImpl(stateHook, currentStateHook, action) {
  currentStateHook = updateReducerImpl(
    stateHook,
    currentStateHook,
    actionStateReducer
  )[0];
  stateHook = updateReducer(basicStateReducer)[0];
  if (
    "object" === typeof currentStateHook &&
    null !== currentStateHook &&
    "function" === typeof currentStateHook.then
  )
    try {
      var state = useThenable(currentStateHook);
    } catch (x) {
      if (x === SuspenseException) throw SuspenseActionException;
      throw x;
    }
  else state = currentStateHook;
  currentStateHook = updateWorkInProgressHook();
  var actionQueue = currentStateHook.queue,
    dispatch = actionQueue.dispatch;
  action !== currentStateHook.memoizedState &&
    ((currentlyRenderingFiber.flags |= 2048),
    pushSimpleEffect(
      9,
      { destroy: void 0 },
      actionStateActionEffect.bind(null, actionQueue, action),
      null
    ));
  return [state, dispatch, stateHook];
}
function actionStateActionEffect(actionQueue, action) {
  actionQueue.action = action;
}
function rerenderActionState(action) {
  var stateHook = updateWorkInProgressHook(),
    currentStateHook = currentHook;
  if (null !== currentStateHook)
    return updateActionStateImpl(stateHook, currentStateHook, action);
  updateWorkInProgressHook();
  stateHook = stateHook.memoizedState;
  currentStateHook = updateWorkInProgressHook();
  var dispatch = currentStateHook.queue.dispatch;
  currentStateHook.memoizedState = action;
  return [stateHook, dispatch, !1];
}
function pushSimpleEffect(tag, inst, create, deps) {
  tag = { tag: tag, create: create, deps: deps, inst: inst, next: null };
  inst = currentlyRenderingFiber.updateQueue;
  null === inst &&
    ((inst = createFunctionComponentUpdateQueue()),
    (currentlyRenderingFiber.updateQueue = inst));
  create = inst.lastEffect;
  null === create
    ? (inst.lastEffect = tag.next = tag)
    : ((deps = create.next),
      (create.next = tag),
      (tag.next = deps),
      (inst.lastEffect = tag));
  return tag;
}
function updateRef() {
  return updateWorkInProgressHook().memoizedState;
}
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  var hook = mountWorkInProgressHook();
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushSimpleEffect(
    1 | hookFlags,
    { destroy: void 0 },
    create,
    void 0 === deps ? null : deps
  );
}
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var inst = hook.memoizedState.inst;
  null !== currentHook &&
  null !== deps &&
  areHookInputsEqual(deps, currentHook.memoizedState.deps)
    ? (hook.memoizedState = pushSimpleEffect(hookFlags, inst, create, deps))
    : ((currentlyRenderingFiber.flags |= fiberFlags),
      (hook.memoizedState = pushSimpleEffect(
        1 | hookFlags,
        inst,
        create,
        deps
      )));
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
  return function () {
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
  if ("function" === typeof ref) {
    create = create();
    var refCleanup = ref(create);
    return function () {
      "function" === typeof refCleanup ? refCleanup() : ref(null);
    };
  }
  if (null !== ref && void 0 !== ref)
    return (
      (create = create()),
      (ref.current = create),
      function () {
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
  if (null !== deps && areHookInputsEqual(deps, prevState[1]))
    return prevState[0];
  hook.memoizedState = [callback, deps];
  return callback;
}
function updateMemo(nextCreate, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var prevState = hook.memoizedState;
  if (null !== deps && areHookInputsEqual(deps, prevState[1]))
    return prevState[0];
  prevState = nextCreate();
  if (shouldDoubleInvokeUserFnsInHooksDEV) {
    setIsStrictModeForDevtools(!0);
    try {
      nextCreate();
    } finally {
      setIsStrictModeForDevtools(!1);
    }
  }
  hook.memoizedState = [prevState, deps];
  return prevState;
}
function mountDeferredValueImpl(hook, value, initialValue) {
  if (
    void 0 === initialValue ||
    (0 !== (renderLanes & 1073741824) &&
      0 === (workInProgressRootRenderLanes & 261930))
  )
    return (hook.memoizedState = value);
  hook.memoizedState = initialValue;
  hook = requestDeferredLane();
  currentlyRenderingFiber.lanes |= hook;
  workInProgressRootSkippedLanes |= hook;
  return initialValue;
}
function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
  if (objectIs(value, prevValue)) return value;
  if (null !== currentTreeHiddenStackCursor.current)
    return (
      (hook = mountDeferredValueImpl(hook, value, initialValue)),
      objectIs(hook, prevValue) || (didReceiveUpdate = !0),
      hook
    );
  if (
    0 === (renderLanes & 42) ||
    (0 !== (renderLanes & 1073741824) &&
      0 === (workInProgressRootRenderLanes & 261930))
  )
    return (didReceiveUpdate = !0), (hook.memoizedState = value);
  hook = requestDeferredLane();
  currentlyRenderingFiber.lanes |= hook;
  workInProgressRootSkippedLanes |= hook;
  return prevValue;
}
function startTransition(fiber, queue, pendingState, finishedState, callback) {
  var previousPriority = ReactDOMSharedInternals.p;
  ReactDOMSharedInternals.p =
    0 !== previousPriority && 8 > previousPriority ? previousPriority : 8;
  var prevTransition = ReactSharedInternals.T,
    currentTransition = {};
  ReactSharedInternals.T = currentTransition;
  dispatchOptimisticSetState(fiber, !1, queue, pendingState);
  try {
    var returnValue = callback(),
      onStartTransitionFinish = ReactSharedInternals.S;
    null !== onStartTransitionFinish &&
      onStartTransitionFinish(currentTransition, returnValue);
    if (
      null !== returnValue &&
      "object" === typeof returnValue &&
      "function" === typeof returnValue.then
    ) {
      var thenableForFinishedState = chainThenableValue(
        returnValue,
        finishedState
      );
      dispatchSetStateInternal(
        fiber,
        queue,
        thenableForFinishedState,
        requestUpdateLane(fiber)
      );
    } else
      dispatchSetStateInternal(
        fiber,
        queue,
        finishedState,
        requestUpdateLane(fiber)
      );
  } catch (error) {
    dispatchSetStateInternal(
      fiber,
      queue,
      { then: function () {}, status: "rejected", reason: error },
      requestUpdateLane(fiber)
    );
  } finally {
    (ReactDOMSharedInternals.p = previousPriority),
      null !== prevTransition &&
        null !== currentTransition.types &&
        (prevTransition.types = currentTransition.types),
      (ReactSharedInternals.T = prevTransition);
  }
}
function noop() {}
function startHostTransition(formFiber, pendingState, action, formData) {
  if (5 !== formFiber.tag) throw Error(formatProdErrorMessage(476));
  var queue = ensureFormComponentIsStateful(formFiber).queue;
  startHostActionTimer();
  startTransition(
    formFiber,
    queue,
    pendingState,
    sharedNotPendingObject,
    null === action
      ? noop
      : function () {
          requestFormReset$1(formFiber);
          return action(formData);
        }
  );
}
function ensureFormComponentIsStateful(formFiber) {
  var existingStateHook = formFiber.memoizedState;
  if (null !== existingStateHook) return existingStateHook;
  existingStateHook = {
    memoizedState: sharedNotPendingObject,
    baseState: sharedNotPendingObject,
    baseQueue: null,
    queue: {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: sharedNotPendingObject
    },
    next: null
  };
  var initialResetState = {};
  existingStateHook.next = {
    memoizedState: initialResetState,
    baseState: initialResetState,
    baseQueue: null,
    queue: {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: initialResetState
    },
    next: null
  };
  formFiber.memoizedState = existingStateHook;
  formFiber = formFiber.alternate;
  null !== formFiber && (formFiber.memoizedState = existingStateHook);
  return existingStateHook;
}
function requestFormReset$1(formFiber) {
  var stateHook = ensureFormComponentIsStateful(formFiber);
  null === stateHook.next && (stateHook = formFiber.alternate.memoizedState);
  dispatchSetStateInternal(
    formFiber,
    stateHook.next.queue,
    {},
    requestUpdateLane(formFiber)
  );
}
function useHostTransitionStatus() {
  return readContext(HostTransitionContext);
}
function updateId() {
  return updateWorkInProgressHook().memoizedState;
}
function updateRefresh() {
  return updateWorkInProgressHook().memoizedState;
}
function refreshCache(fiber) {
  for (var provider = fiber.return; null !== provider; ) {
    switch (provider.tag) {
      case 24:
      case 3:
        var lane = requestUpdateLane(provider);
        fiber = createUpdate(lane);
        var root$82 = enqueueUpdate(provider, fiber, lane);
        null !== root$82 &&
          (startUpdateTimerByLane(lane),
          scheduleUpdateOnFiber(root$82, provider, lane),
          entangleTransitions(root$82, provider, lane));
        provider = { cache: createCache() };
        fiber.payload = provider;
        return;
    }
    provider = provider.return;
  }
}
function dispatchReducerAction(fiber, queue, action) {
  var lane = requestUpdateLane(fiber);
  action = {
    lane: lane,
    revertLane: 0,
    gesture: null,
    action: action,
    hasEagerState: !1,
    eagerState: null,
    next: null
  };
  isRenderPhaseUpdate(fiber)
    ? enqueueRenderPhaseUpdate(queue, action)
    : ((action = enqueueConcurrentHookUpdate(fiber, queue, action, lane)),
      null !== action &&
        (startUpdateTimerByLane(lane),
        scheduleUpdateOnFiber(action, fiber, lane),
        entangleTransitionUpdate(action, queue, lane)));
  markStateUpdateScheduled(fiber, lane);
}
function dispatchSetState(fiber, queue, action) {
  var lane = requestUpdateLane(fiber);
  dispatchSetStateInternal(fiber, queue, action, lane) &&
    startUpdateTimerByLane(lane);
  markStateUpdateScheduled(fiber, lane);
}
function dispatchSetStateInternal(fiber, queue, action, lane) {
  var update = {
    lane: lane,
    revertLane: 0,
    gesture: null,
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
        if (objectIs(eagerState, currentState))
          return (
            enqueueUpdate$1(fiber, queue, update, 0),
            null === workInProgressRoot && finishQueueingConcurrentUpdates(),
            !1
          );
      } catch (error) {
      } finally {
      }
    action = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
    if (null !== action)
      return (
        scheduleUpdateOnFiber(action, fiber, lane),
        entangleTransitionUpdate(action, queue, lane),
        !0
      );
  }
  return !1;
}
function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
  action = {
    lane: 2,
    revertLane: requestTransitionLane(),
    gesture: null,
    action: action,
    hasEagerState: !1,
    eagerState: null,
    next: null
  };
  if (isRenderPhaseUpdate(fiber)) {
    if (throwIfDuringRender) throw Error(formatProdErrorMessage(479));
  } else
    (throwIfDuringRender = enqueueConcurrentHookUpdate(
      fiber,
      queue,
      action,
      2
    )),
      null !== throwIfDuringRender &&
        (startUpdateTimerByLane(2),
        scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2));
  markStateUpdateScheduled(fiber, 2);
}
function isRenderPhaseUpdate(fiber) {
  var alternate = fiber.alternate;
  return (
    fiber === currentlyRenderingFiber ||
    (null !== alternate && alternate === currentlyRenderingFiber)
  );
}
function enqueueRenderPhaseUpdate(queue, update) {
  didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate =
    !0;
  var pending = queue.pending;
  null === pending
    ? (update.next = update)
    : ((update.next = pending.next), (pending.next = update));
  queue.pending = update;
}
function entangleTransitionUpdate(root, queue, lane) {
  if (0 !== (lane & 4194048)) {
    var queueLanes = queue.lanes;
    queueLanes &= root.pendingLanes;
    lane |= queueLanes;
    queue.lanes = lane;
    markRootEntangled(root, lane);
  }
}
var ContextOnlyDispatcher = {
  readContext: readContext,
  use: use,
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useInsertionEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  useDebugValue: throwInvalidHookError,
  useDeferredValue: throwInvalidHookError,
  useTransition: throwInvalidHookError,
  useSyncExternalStore: throwInvalidHookError,
  useId: throwInvalidHookError,
  useHostTransitionStatus: throwInvalidHookError,
  useFormState: throwInvalidHookError,
  useActionState: throwInvalidHookError,
  useOptimistic: throwInvalidHookError,
  useMemoCache: throwInvalidHookError,
  useCacheRefresh: throwInvalidHookError
};
ContextOnlyDispatcher.useEffectEvent = throwInvalidHookError;
var HooksDispatcherOnMount = {
    readContext: readContext,
    use: use,
    useCallback: function (callback, deps) {
      mountWorkInProgressHook().memoizedState = [
        callback,
        void 0 === deps ? null : deps
      ];
      return callback;
    },
    useContext: readContext,
    useEffect: mountEffect,
    useImperativeHandle: function (ref, create, deps) {
      deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
      mountEffectImpl(
        4194308,
        4,
        imperativeHandleEffect.bind(null, create, ref),
        deps
      );
    },
    useLayoutEffect: function (create, deps) {
      return mountEffectImpl(4194308, 4, create, deps);
    },
    useInsertionEffect: function (create, deps) {
      mountEffectImpl(4, 2, create, deps);
    },
    useMemo: function (nextCreate, deps) {
      var hook = mountWorkInProgressHook();
      deps = void 0 === deps ? null : deps;
      var nextValue = nextCreate();
      if (shouldDoubleInvokeUserFnsInHooksDEV) {
        setIsStrictModeForDevtools(!0);
        try {
          nextCreate();
        } finally {
          setIsStrictModeForDevtools(!1);
        }
      }
      hook.memoizedState = [nextValue, deps];
      return nextValue;
    },
    useReducer: function (reducer, initialArg, init) {
      var hook = mountWorkInProgressHook();
      if (void 0 !== init) {
        var initialState = init(initialArg);
        if (shouldDoubleInvokeUserFnsInHooksDEV) {
          setIsStrictModeForDevtools(!0);
          try {
            init(initialArg);
          } finally {
            setIsStrictModeForDevtools(!1);
          }
        }
      } else initialState = initialArg;
      hook.memoizedState = hook.baseState = initialState;
      reducer = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: initialState
      };
      hook.queue = reducer;
      reducer = reducer.dispatch = dispatchReducerAction.bind(
        null,
        currentlyRenderingFiber,
        reducer
      );
      return [hook.memoizedState, reducer];
    },
    useRef: function (initialValue) {
      var hook = mountWorkInProgressHook();
      initialValue = { current: initialValue };
      return (hook.memoizedState = initialValue);
    },
    useState: function (initialState) {
      initialState = mountStateImpl(initialState);
      var queue = initialState.queue,
        dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
      queue.dispatch = dispatch;
      return [initialState.memoizedState, dispatch];
    },
    useDebugValue: mountDebugValue,
    useDeferredValue: function (value, initialValue) {
      var hook = mountWorkInProgressHook();
      return mountDeferredValueImpl(hook, value, initialValue);
    },
    useTransition: function () {
      var stateHook = mountStateImpl(!1);
      stateHook = startTransition.bind(
        null,
        currentlyRenderingFiber,
        stateHook.queue,
        !0,
        !1
      );
      mountWorkInProgressHook().memoizedState = stateHook;
      return [!1, stateHook];
    },
    useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
      var fiber = currentlyRenderingFiber,
        hook = mountWorkInProgressHook();
      if (isHydrating) {
        if (void 0 === getServerSnapshot)
          throw Error(formatProdErrorMessage(407));
        getServerSnapshot = getServerSnapshot();
      } else {
        getServerSnapshot = getSnapshot();
        if (null === workInProgressRoot)
          throw Error(formatProdErrorMessage(349));
        0 !== (workInProgressRootRenderLanes & 127) ||
          pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
      }
      hook.memoizedState = getServerSnapshot;
      var inst = { value: getServerSnapshot, getSnapshot: getSnapshot };
      hook.queue = inst;
      mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
        subscribe
      ]);
      fiber.flags |= 2048;
      pushSimpleEffect(
        9,
        { destroy: void 0 },
        updateStoreInstance.bind(
          null,
          fiber,
          inst,
          getServerSnapshot,
          getSnapshot
        ),
        null
      );
      return getServerSnapshot;
    },
    useId: function () {
      var hook = mountWorkInProgressHook(),
        identifierPrefix = workInProgressRoot.identifierPrefix;
      if (isHydrating) {
        var JSCompiler_inline_result = treeContextOverflow;
        var idWithLeadingBit = treeContextId;
        JSCompiler_inline_result =
          (
            idWithLeadingBit & ~(1 << (32 - clz32(idWithLeadingBit) - 1))
          ).toString(32) + JSCompiler_inline_result;
        identifierPrefix =
          "_" + identifierPrefix + "R_" + JSCompiler_inline_result;
        JSCompiler_inline_result = localIdCounter++;
        0 < JSCompiler_inline_result &&
          (identifierPrefix += "H" + JSCompiler_inline_result.toString(32));
        identifierPrefix += "_";
      } else
        (JSCompiler_inline_result = globalClientIdCounter++),
          (identifierPrefix =
            "_" +
            identifierPrefix +
            "r_" +
            JSCompiler_inline_result.toString(32) +
            "_");
      return (hook.memoizedState = identifierPrefix);
    },
    useHostTransitionStatus: useHostTransitionStatus,
    useFormState: mountActionState,
    useActionState: mountActionState,
    useOptimistic: function (passthrough) {
      var hook = mountWorkInProgressHook();
      hook.memoizedState = hook.baseState = passthrough;
      var queue = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      hook.queue = queue;
      hook = dispatchOptimisticSetState.bind(
        null,
        currentlyRenderingFiber,
        !0,
        queue
      );
      queue.dispatch = hook;
      return [passthrough, hook];
    },
    useMemoCache: useMemoCache,
    useCacheRefresh: function () {
      return (mountWorkInProgressHook().memoizedState = refreshCache.bind(
        null,
        currentlyRenderingFiber
      ));
    },
    useEffectEvent: function (callback) {
      var hook = mountWorkInProgressHook(),
        ref = { impl: callback };
      hook.memoizedState = ref;
      return function () {
        if (0 !== (executionContext & 2))
          throw Error(formatProdErrorMessage(440));
        return ref.impl.apply(void 0, arguments);
      };
    }
  },
  HooksDispatcherOnUpdate = {
    readContext: readContext,
    use: use,
    useCallback: updateCallback,
    useContext: readContext,
    useEffect: updateEffect,
    useImperativeHandle: updateImperativeHandle,
    useInsertionEffect: updateInsertionEffect,
    useLayoutEffect: updateLayoutEffect,
    useMemo: updateMemo,
    useReducer: updateReducer,
    useRef: updateRef,
    useState: function () {
      return updateReducer(basicStateReducer);
    },
    useDebugValue: mountDebugValue,
    useDeferredValue: function (value, initialValue) {
      var hook = updateWorkInProgressHook();
      return updateDeferredValueImpl(
        hook,
        currentHook.memoizedState,
        value,
        initialValue
      );
    },
    useTransition: function () {
      var booleanOrThenable = updateReducer(basicStateReducer)[0],
        start = updateWorkInProgressHook().memoizedState;
      return [
        "boolean" === typeof booleanOrThenable
          ? booleanOrThenable
          : useThenable(booleanOrThenable),
        start
      ];
    },
    useSyncExternalStore: updateSyncExternalStore,
    useId: updateId,
    useHostTransitionStatus: useHostTransitionStatus,
    useFormState: updateActionState,
    useActionState: updateActionState,
    useOptimistic: function (passthrough, reducer) {
      var hook = updateWorkInProgressHook();
      return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
    },
    useMemoCache: useMemoCache,
    useCacheRefresh: updateRefresh
  };
HooksDispatcherOnUpdate.useEffectEvent = updateEvent;
var HooksDispatcherOnRerender = {
  readContext: readContext,
  use: use,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: rerenderReducer,
  useRef: updateRef,
  useState: function () {
    return rerenderReducer(basicStateReducer);
  },
  useDebugValue: mountDebugValue,
  useDeferredValue: function (value, initialValue) {
    var hook = updateWorkInProgressHook();
    return null === currentHook
      ? mountDeferredValueImpl(hook, value, initialValue)
      : updateDeferredValueImpl(
          hook,
          currentHook.memoizedState,
          value,
          initialValue
        );
  },
  useTransition: function () {
    var booleanOrThenable = rerenderReducer(basicStateReducer)[0],
      start = updateWorkInProgressHook().memoizedState;
    return [
      "boolean" === typeof booleanOrThenable
        ? booleanOrThenable
        : useThenable(booleanOrThenable),
      start
    ];
  },
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId,
  useHostTransitionStatus: useHostTransitionStatus,
  useFormState: rerenderActionState,
  useActionState: rerenderActionState,
  useOptimistic: function (passthrough, reducer) {
    var hook = updateWorkInProgressHook();
    if (null !== currentHook)
      return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
    hook.baseState = passthrough;
    return [passthrough, hook.queue.dispatch];
  },
  useMemoCache: useMemoCache,
  useCacheRefresh: updateRefresh
};
HooksDispatcherOnRerender.useEffectEvent = updateEvent;
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
  enqueueSetState: function (inst, payload, callback) {
    inst = inst._reactInternals;
    var lane = requestUpdateLane(inst),
      update = createUpdate(lane);
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    payload = enqueueUpdate(inst, update, lane);
    null !== payload &&
      (startUpdateTimerByLane(lane),
      scheduleUpdateOnFiber(payload, inst, lane),
      entangleTransitions(payload, inst, lane));
    markStateUpdateScheduled(inst, lane);
  },
  enqueueReplaceState: function (inst, payload, callback) {
    inst = inst._reactInternals;
    var lane = requestUpdateLane(inst),
      update = createUpdate(lane);
    update.tag = 1;
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    payload = enqueueUpdate(inst, update, lane);
    null !== payload &&
      (startUpdateTimerByLane(lane),
      scheduleUpdateOnFiber(payload, inst, lane),
      entangleTransitions(payload, inst, lane));
    markStateUpdateScheduled(inst, lane);
  },
  enqueueForceUpdate: function (inst, callback) {
    inst = inst._reactInternals;
    var lane = requestUpdateLane(inst),
      update = createUpdate(lane);
    update.tag = 2;
    void 0 !== callback && null !== callback && (update.callback = callback);
    callback = enqueueUpdate(inst, update, lane);
    null !== callback &&
      (startUpdateTimerByLane(lane),
      scheduleUpdateOnFiber(callback, inst, lane),
      entangleTransitions(callback, inst, lane));
    null !== injectedProfilingHooks &&
      "function" === typeof injectedProfilingHooks.markForceUpdateScheduled &&
      injectedProfilingHooks.markForceUpdateScheduled(inst, lane);
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
  var isLegacyContextConsumer = !1,
    unmaskedContext = emptyContextObject;
  var context = ctor.contextType;
  "object" === typeof context && null !== context
    ? (context = readContext(context))
    : ((unmaskedContext = isContextProvider(ctor)
        ? previousContext
        : contextStackCursor.current),
      (isLegacyContextConsumer = ctor.contextTypes),
      (context = (isLegacyContextConsumer =
        null !== isLegacyContextConsumer && void 0 !== isLegacyContextConsumer)
        ? getMaskedContext(workInProgress, unmaskedContext)
        : emptyContextObject));
  ctor = new ctor(props, context);
  workInProgress.memoizedState =
    null !== ctor.state && void 0 !== ctor.state ? ctor.state : null;
  ctor.updater = classComponentUpdater;
  workInProgress.stateNode = ctor;
  ctor._reactInternals = workInProgress;
  isLegacyContextConsumer &&
    ((workInProgress = workInProgress.stateNode),
    (workInProgress.__reactInternalMemoizedUnmaskedChildContext =
      unmaskedContext),
    (workInProgress.__reactInternalMemoizedMaskedChildContext = context));
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
  "object" === typeof contextType && null !== contextType
    ? (instance.context = readContext(contextType))
    : ((contextType = isContextProvider(ctor)
        ? previousContext
        : contextStackCursor.current),
      (instance.context = getMaskedContext(workInProgress, contextType)));
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
    suspendIfUpdateReadFromEntangledAsyncAction(),
    (instance.state = workInProgress.memoizedState));
  "function" === typeof instance.componentDidMount &&
    (workInProgress.flags |= 4194308);
}
function resolveClassComponentProps(Component, baseProps) {
  var newProps = baseProps;
  if ("ref" in baseProps) {
    newProps = {};
    for (var propName in baseProps)
      "ref" !== propName && (newProps[propName] = baseProps[propName]);
  }
  if ((Component = Component.defaultProps)) {
    newProps === baseProps && (newProps = assign({}, newProps));
    for (var propName$86 in Component)
      void 0 === newProps[propName$86] &&
        (newProps[propName$86] = Component[propName$86]);
  }
  return newProps;
}
function defaultOnUncaughtError(error) {
  reportGlobalError(error);
}
function defaultOnCaughtError(error) {
  console.error(error);
}
function defaultOnRecoverableError(error) {
  reportGlobalError(error);
}
function logUncaughtError(root, errorInfo) {
  try {
    var onUncaughtError = root.onUncaughtError;
    onUncaughtError(errorInfo.value, { componentStack: errorInfo.stack });
  } catch (e$87) {
    setTimeout(function () {
      throw e$87;
    });
  }
}
function logCaughtError(root, boundary, errorInfo) {
  try {
    var onCaughtError = root.onCaughtError;
    onCaughtError(errorInfo.value, {
      componentStack: errorInfo.stack,
      errorBoundary: 1 === boundary.tag ? boundary.stateNode : null
    });
  } catch (e$88) {
    setTimeout(function () {
      throw e$88;
    });
  }
}
function createRootErrorUpdate(root, errorInfo, lane) {
  lane = createUpdate(lane);
  lane.tag = 3;
  lane.payload = { element: null };
  lane.callback = function () {
    logUncaughtError(root, errorInfo);
  };
  return lane;
}
function createClassErrorUpdate(lane) {
  lane = createUpdate(lane);
  lane.tag = 3;
  return lane;
}
function initializeClassErrorUpdate(update, root, fiber, errorInfo) {
  var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
  if ("function" === typeof getDerivedStateFromError) {
    var error = errorInfo.value;
    update.payload = function () {
      return getDerivedStateFromError(error);
    };
    update.callback = function () {
      logCaughtError(root, fiber, errorInfo);
    };
  }
  var inst = fiber.stateNode;
  null !== inst &&
    "function" === typeof inst.componentDidCatch &&
    (update.callback = function () {
      logCaughtError(root, fiber, errorInfo);
      "function" !== typeof getDerivedStateFromError &&
        (null === legacyErrorBoundariesThatAlreadyFailed
          ? (legacyErrorBoundariesThatAlreadyFailed = new Set([this]))
          : legacyErrorBoundariesThatAlreadyFailed.add(this));
      var stack = errorInfo.stack;
      this.componentDidCatch(errorInfo.value, {
        componentStack: null !== stack ? stack : ""
      });
    });
}
function markSuspenseBoundaryShouldCapture(
  suspenseBoundary,
  returnFiber,
  sourceFiber,
  root,
  rootRenderLanes
) {
  if (0 === (suspenseBoundary.mode & 1))
    return (
      suspenseBoundary === returnFiber
        ? (suspenseBoundary.flags |= 65536)
        : ((suspenseBoundary.flags |= 128),
          (sourceFiber.flags |= 131072),
          (sourceFiber.flags &= -52805),
          1 === sourceFiber.tag
            ? null === sourceFiber.alternate
              ? (sourceFiber.tag = 17)
              : ((returnFiber = createUpdate(2)),
                (returnFiber.tag = 2),
                enqueueUpdate(sourceFiber, returnFiber, 2))
            : 0 === sourceFiber.tag &&
              null === sourceFiber.alternate &&
              (sourceFiber.tag = 28),
          (sourceFiber.lanes |= 2)),
      suspenseBoundary
    );
  suspenseBoundary.flags |= 65536;
  suspenseBoundary.lanes = rootRenderLanes;
  return suspenseBoundary;
}
function throwException(
  root,
  returnFiber,
  sourceFiber,
  value,
  rootRenderLanes
) {
  sourceFiber.flags |= 32768;
  isDevToolsPresent && restorePendingUpdaters(root, rootRenderLanes);
  if (
    null !== value &&
    "object" === typeof value &&
    "function" === typeof value.then
  ) {
    var currentSourceFiber = sourceFiber.alternate;
    null !== currentSourceFiber &&
      propagateParentContextChanges(
        currentSourceFiber,
        sourceFiber,
        rootRenderLanes,
        !0
      );
    currentSourceFiber = sourceFiber.tag;
    0 !== (sourceFiber.mode & 1) ||
      (0 !== currentSourceFiber &&
        11 !== currentSourceFiber &&
        15 !== currentSourceFiber) ||
      ((currentSourceFiber = sourceFiber.alternate)
        ? ((sourceFiber.updateQueue = currentSourceFiber.updateQueue),
          (sourceFiber.memoizedState = currentSourceFiber.memoizedState),
          (sourceFiber.lanes = currentSourceFiber.lanes))
        : ((sourceFiber.updateQueue = null),
          (sourceFiber.memoizedState = null)));
    currentSourceFiber = suspenseHandlerStackCursor.current;
    if (null !== currentSourceFiber) {
      switch (currentSourceFiber.tag) {
        case 31:
        case 13:
          return (
            sourceFiber.mode & 1 &&
              (null === shellBoundary
                ? renderDidSuspendDelayIfPossible()
                : null === currentSourceFiber.alternate &&
                  0 === workInProgressRootExitStatus &&
                  (workInProgressRootExitStatus = 3)),
            (currentSourceFiber.flags &= -257),
            markSuspenseBoundaryShouldCapture(
              currentSourceFiber,
              returnFiber,
              sourceFiber,
              root,
              rootRenderLanes
            ),
            value === noopSuspenseyCommitThenable
              ? (currentSourceFiber.flags |= 16384)
              : ((sourceFiber = currentSourceFiber.updateQueue),
                null === sourceFiber
                  ? (currentSourceFiber.updateQueue = new Set([value]))
                  : sourceFiber.add(value),
                currentSourceFiber.mode & 1 &&
                  attachPingListener(root, value, rootRenderLanes)),
            !1
          );
        case 22:
          if (currentSourceFiber.mode & 1)
            return (
              (currentSourceFiber.flags |= 65536),
              value === noopSuspenseyCommitThenable
                ? (currentSourceFiber.flags |= 16384)
                : ((sourceFiber = currentSourceFiber.updateQueue),
                  null === sourceFiber
                    ? ((sourceFiber = {
                        transitions: null,
                        markerInstances: null,
                        retryQueue: new Set([value])
                      }),
                      (currentSourceFiber.updateQueue = sourceFiber))
                    : ((returnFiber = sourceFiber.retryQueue),
                      null === returnFiber
                        ? (sourceFiber.retryQueue = new Set([value]))
                        : returnFiber.add(value)),
                  attachPingListener(root, value, rootRenderLanes)),
              !1
            );
      }
      throw Error(formatProdErrorMessage(435, currentSourceFiber.tag));
    }
    if (1 === root.tag)
      return (
        attachPingListener(root, value, rootRenderLanes),
        renderDidSuspendDelayIfPossible(),
        !1
      );
    value = Error(formatProdErrorMessage(426));
  }
  if (isHydrating && sourceFiber.mode & 1)
    return (
      (currentSourceFiber = suspenseHandlerStackCursor.current),
      null !== currentSourceFiber
        ? (0 === (currentSourceFiber.flags & 65536) &&
            (currentSourceFiber.flags |= 256),
          markSuspenseBoundaryShouldCapture(
            currentSourceFiber,
            returnFiber,
            sourceFiber,
            root,
            rootRenderLanes
          ),
          value !== HydrationMismatchException &&
            ((root = Error(formatProdErrorMessage(422), { cause: value })),
            queueHydrationError(createCapturedValueAtFiber(root, sourceFiber))))
        : (value !== HydrationMismatchException &&
            ((returnFiber = Error(formatProdErrorMessage(423), {
              cause: value
            })),
            queueHydrationError(
              createCapturedValueAtFiber(returnFiber, sourceFiber)
            )),
          (root = root.current.alternate),
          (root.flags |= 65536),
          (rootRenderLanes &= -rootRenderLanes),
          (root.lanes |= rootRenderLanes),
          (sourceFiber = createCapturedValueAtFiber(value, sourceFiber)),
          (rootRenderLanes = createRootErrorUpdate(
            root.stateNode,
            sourceFiber,
            rootRenderLanes
          )),
          enqueueCapturedUpdate(root, rootRenderLanes),
          4 !== workInProgressRootExitStatus &&
            (workInProgressRootExitStatus = 2)),
      !1
    );
  currentSourceFiber = Error(formatProdErrorMessage(520), { cause: value });
  currentSourceFiber = createCapturedValueAtFiber(
    currentSourceFiber,
    sourceFiber
  );
  null === workInProgressRootConcurrentErrors
    ? (workInProgressRootConcurrentErrors = [currentSourceFiber])
    : workInProgressRootConcurrentErrors.push(currentSourceFiber);
  4 !== workInProgressRootExitStatus && (workInProgressRootExitStatus = 2);
  if (null === returnFiber) return !0;
  sourceFiber = createCapturedValueAtFiber(value, sourceFiber);
  do {
    switch (returnFiber.tag) {
      case 3:
        return (
          (returnFiber.flags |= 65536),
          (root = rootRenderLanes & -rootRenderLanes),
          (returnFiber.lanes |= root),
          (root = createRootErrorUpdate(
            returnFiber.stateNode,
            sourceFiber,
            root
          )),
          enqueueCapturedUpdate(returnFiber, root),
          !1
        );
      case 1:
        if (
          ((value = returnFiber.type),
          (currentSourceFiber = returnFiber.stateNode),
          0 === (returnFiber.flags & 128) &&
            ("function" === typeof value.getDerivedStateFromError ||
              (null !== currentSourceFiber &&
                "function" === typeof currentSourceFiber.componentDidCatch &&
                (null === legacyErrorBoundariesThatAlreadyFailed ||
                  !legacyErrorBoundariesThatAlreadyFailed.has(
                    currentSourceFiber
                  )))))
        )
          return (
            (returnFiber.flags |= 65536),
            (rootRenderLanes &= -rootRenderLanes),
            (returnFiber.lanes |= rootRenderLanes),
            (rootRenderLanes = createClassErrorUpdate(rootRenderLanes)),
            initializeClassErrorUpdate(
              rootRenderLanes,
              root,
              returnFiber,
              sourceFiber
            ),
            enqueueCapturedUpdate(returnFiber, rootRenderLanes),
            !1
          );
    }
    returnFiber = returnFiber.return;
  } while (null !== returnFiber);
  return !1;
}
var SelectiveHydrationException = Error(formatProdErrorMessage(461)),
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
  if ("ref" in nextProps) {
    var propsWithoutRef = {};
    for (var key in nextProps)
      "ref" !== key && (propsWithoutRef[key] = nextProps[key]);
  } else propsWithoutRef = nextProps;
  prepareToReadContext(workInProgress);
  markComponentRenderStarted(workInProgress);
  nextProps = renderWithHooks(
    current,
    workInProgress,
    Component,
    propsWithoutRef,
    ref,
    renderLanes
  );
  key = checkDidRenderIdHook();
  markComponentRenderStopped();
  if (null !== current && !didReceiveUpdate)
    return (
      bailoutHooks(current, workInProgress, renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  isHydrating && key && pushMaterializedTreeId(workInProgress);
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
      null === Component.compare
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
function updateOffscreenComponent(
  current,
  workInProgress,
  renderLanes,
  nextProps
) {
  var nextChildren = nextProps.children,
    prevState = null !== current ? current.memoizedState : null;
  null === current &&
    null === workInProgress.stateNode &&
    (workInProgress.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    });
  if ("hidden" === nextProps.mode) {
    if (0 !== (workInProgress.flags & 128)) {
      prevState =
        null !== prevState ? prevState.baseLanes | renderLanes : renderLanes;
      if (null !== current) {
        nextProps = workInProgress.child = current.child;
        for (nextChildren = 0; null !== nextProps; )
          (nextChildren =
            nextChildren | nextProps.lanes | nextProps.childLanes),
            (nextProps = nextProps.sibling);
        nextProps = nextChildren & ~prevState;
      } else (nextProps = 0), (workInProgress.child = null);
      return deferHiddenOffscreenComponent(
        current,
        workInProgress,
        prevState,
        renderLanes,
        nextProps
      );
    }
    if (0 === (workInProgress.mode & 1))
      (workInProgress.memoizedState = { baseLanes: 0, cachePool: null }),
        null !== current && pushTransition(workInProgress, null),
        reuseHiddenContextOnStack(),
        pushOffscreenSuspenseHandler(workInProgress);
    else if (0 !== (renderLanes & 536870912))
      (workInProgress.memoizedState = { baseLanes: 0, cachePool: null }),
        null !== current &&
          pushTransition(
            workInProgress,
            null !== prevState ? prevState.cachePool : null
          ),
        null !== prevState
          ? pushHiddenContext(workInProgress, prevState)
          : reuseHiddenContextOnStack(),
        pushOffscreenSuspenseHandler(workInProgress);
    else
      return (
        (nextProps = workInProgress.lanes = 536870912),
        deferHiddenOffscreenComponent(
          current,
          workInProgress,
          null !== prevState ? prevState.baseLanes | renderLanes : renderLanes,
          renderLanes,
          nextProps
        )
      );
  } else
    null !== prevState
      ? (pushTransition(workInProgress, prevState.cachePool),
        pushHiddenContext(workInProgress, prevState),
        reuseSuspenseHandlerOnStack(workInProgress),
        (workInProgress.memoizedState = null))
      : (null !== current && pushTransition(workInProgress, null),
        reuseHiddenContextOnStack(),
        reuseSuspenseHandlerOnStack(workInProgress));
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function bailoutOffscreenComponent(current, workInProgress) {
  (null !== current && 22 === current.tag) ||
    null !== workInProgress.stateNode ||
    (workInProgress.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    });
  return workInProgress.sibling;
}
function deferHiddenOffscreenComponent(
  current,
  workInProgress,
  nextBaseLanes,
  renderLanes,
  remainingChildLanes
) {
  var JSCompiler_inline_result = peekCacheFromPool();
  JSCompiler_inline_result =
    null === JSCompiler_inline_result
      ? null
      : { parent: CacheContext._currentValue, pool: JSCompiler_inline_result };
  workInProgress.memoizedState = {
    baseLanes: nextBaseLanes,
    cachePool: JSCompiler_inline_result
  };
  null !== current && pushTransition(workInProgress, null);
  reuseHiddenContextOnStack();
  pushOffscreenSuspenseHandler(workInProgress);
  null !== current &&
    propagateParentContextChanges(current, workInProgress, renderLanes, !0);
  workInProgress.childLanes = remainingChildLanes;
  return null;
}
function mountActivityChildren(workInProgress, nextProps) {
  nextProps = mountWorkInProgressOffscreenFiber(
    { mode: nextProps.mode, children: nextProps.children },
    workInProgress.mode
  );
  nextProps.ref = workInProgress.ref;
  workInProgress.child = nextProps;
  nextProps.return = workInProgress;
  return nextProps;
}
function retryActivityComponentWithoutHydrating(
  current,
  workInProgress,
  renderLanes
) {
  reconcileChildFibers(workInProgress, current.child, null, renderLanes);
  current = mountActivityChildren(workInProgress, workInProgress.pendingProps);
  current.flags |= 2;
  popSuspenseHandler(workInProgress);
  workInProgress.memoizedState = null;
  return current;
}
function updateActivityComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    didSuspend = 0 !== (workInProgress.flags & 128);
  workInProgress.flags &= -129;
  if (null === current) {
    if (isHydrating) {
      if ("hidden" === nextProps.mode)
        return (
          (current = mountActivityChildren(workInProgress, nextProps)),
          (workInProgress.lanes = 536870912),
          bailoutOffscreenComponent(null, current)
        );
      pushDehydratedActivitySuspenseHandler(workInProgress);
      (current = nextHydratableInstance)
        ? ((current = canHydrateHydrationBoundary(
            current,
            rootOrSingletonContext
          )),
          (current = null !== current && "&" === current.data ? current : null),
          null !== current &&
            ((workInProgress.memoizedState = {
              dehydrated: current,
              treeContext:
                null !== treeContextProvider
                  ? { id: treeContextId, overflow: treeContextOverflow }
                  : null,
              retryLane: 536870912,
              hydrationErrors: null
            }),
            (renderLanes = createFiberFromDehydratedFragment(current)),
            (renderLanes.return = workInProgress),
            (workInProgress.child = renderLanes),
            (hydrationParentFiber = workInProgress),
            (nextHydratableInstance = null)))
        : (current = null);
      if (null === current) throw throwOnHydrationMismatch(workInProgress);
      workInProgress.lanes = 536870912;
      return null;
    }
    return mountActivityChildren(workInProgress, nextProps);
  }
  var prevState = current.memoizedState;
  if (null !== prevState) {
    var dehydrated = prevState.dehydrated;
    pushDehydratedActivitySuspenseHandler(workInProgress);
    if (didSuspend)
      if (workInProgress.flags & 256)
        (workInProgress.flags &= -257),
          (workInProgress = retryActivityComponentWithoutHydrating(
            current,
            workInProgress,
            renderLanes
          ));
      else if (null !== workInProgress.memoizedState)
        (workInProgress.child = current.child),
          (workInProgress.flags |= 128),
          (workInProgress = null);
      else throw Error(formatProdErrorMessage(558));
    else if (
      (didReceiveUpdate ||
        propagateParentContextChanges(current, workInProgress, renderLanes, !1),
      (didSuspend = 0 !== (renderLanes & current.childLanes)),
      didReceiveUpdate || didSuspend)
    ) {
      nextProps = workInProgressRoot;
      if (
        null !== nextProps &&
        ((dehydrated = getBumpedLaneForHydration(nextProps, renderLanes)),
        0 !== dehydrated && dehydrated !== prevState.retryLane)
      )
        throw (
          ((prevState.retryLane = dehydrated),
          enqueueConcurrentRenderForLane(current, dehydrated),
          scheduleUpdateOnFiber(nextProps, current, dehydrated),
          SelectiveHydrationException)
        );
      renderDidSuspendDelayIfPossible();
      workInProgress = retryActivityComponentWithoutHydrating(
        current,
        workInProgress,
        renderLanes
      );
    } else
      (current = prevState.treeContext),
        (nextHydratableInstance = getNextHydratable(dehydrated.nextSibling)),
        (hydrationParentFiber = workInProgress),
        (isHydrating = !0),
        (hydrationErrors = null),
        (rootOrSingletonContext = !1),
        null !== current &&
          restoreSuspendedTreeContext(workInProgress, current),
        (workInProgress = mountActivityChildren(workInProgress, nextProps)),
        (workInProgress.flags |= 4096);
    return workInProgress;
  }
  current = createWorkInProgress(current.child, {
    mode: nextProps.mode,
    children: nextProps.children
  });
  current.ref = workInProgress.ref;
  workInProgress.child = current;
  current.return = workInProgress;
  return current;
}
function markRef(current, workInProgress) {
  var ref = workInProgress.ref;
  if (null === ref)
    null !== current &&
      null !== current.ref &&
      (workInProgress.flags |= 4194816);
  else {
    if ("function" !== typeof ref && "object" !== typeof ref)
      throw Error(formatProdErrorMessage(284));
    if (null === current || current.ref !== ref)
      workInProgress.flags |= 4194816;
  }
}
function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  var context = isContextProvider(Component)
    ? previousContext
    : contextStackCursor.current;
  context = getMaskedContext(workInProgress, context);
  prepareToReadContext(workInProgress);
  markComponentRenderStarted(workInProgress);
  Component = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    context,
    renderLanes
  );
  nextProps = checkDidRenderIdHook();
  markComponentRenderStopped();
  if (null !== current && !didReceiveUpdate)
    return (
      bailoutHooks(current, workInProgress, renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  isHydrating && nextProps && pushMaterializedTreeId(workInProgress);
  workInProgress.flags |= 1;
  reconcileChildren(current, workInProgress, Component, renderLanes);
  return workInProgress.child;
}
function replayFunctionComponent(
  current,
  workInProgress,
  nextProps,
  Component,
  secondArg,
  renderLanes
) {
  prepareToReadContext(workInProgress);
  markComponentRenderStarted(workInProgress);
  workInProgress.updateQueue = null;
  nextProps = renderWithHooksAgain(
    workInProgress,
    Component,
    nextProps,
    secondArg
  );
  finishRenderingHooks(current);
  Component = checkDidRenderIdHook();
  markComponentRenderStopped();
  if (null !== current && !didReceiveUpdate)
    return (
      bailoutHooks(current, workInProgress, renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  isHydrating && Component && pushMaterializedTreeId(workInProgress);
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
  if (isContextProvider(Component)) {
    var hasContext = !0;
    pushContextProvider(workInProgress);
  } else hasContext = !1;
  prepareToReadContext(workInProgress);
  if (null === workInProgress.stateNode)
    resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
      constructClassInstance(workInProgress, Component, nextProps),
      mountClassInstance(workInProgress, Component, nextProps, renderLanes),
      (nextProps = !0);
  else if (null === current) {
    var instance = workInProgress.stateNode,
      unresolvedOldProps = workInProgress.memoizedProps,
      oldProps = resolveClassComponentProps(Component, unresolvedOldProps);
    instance.props = oldProps;
    var oldContext = instance.context,
      contextType = Component.contextType;
    "object" === typeof contextType && null !== contextType
      ? (contextType = readContext(contextType))
      : ((contextType = isContextProvider(Component)
          ? previousContext
          : contextStackCursor.current),
        (contextType = getMaskedContext(workInProgress, contextType)));
    var getDerivedStateFromProps = Component.getDerivedStateFromProps,
      hasNewLifecycles =
        "function" === typeof getDerivedStateFromProps ||
        "function" === typeof instance.getSnapshotBeforeUpdate;
    unresolvedOldProps = workInProgress.pendingProps !== unresolvedOldProps;
    hasNewLifecycles ||
      ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
        "function" !== typeof instance.componentWillReceiveProps) ||
      ((unresolvedOldProps || oldContext !== contextType) &&
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          nextProps,
          contextType
        ));
    hasForceUpdate = !1;
    var oldState = workInProgress.memoizedState;
    instance.state = oldState;
    processUpdateQueue(workInProgress, nextProps, instance, renderLanes);
    suspendIfUpdateReadFromEntangledAsyncAction();
    oldContext = workInProgress.memoizedState;
    unresolvedOldProps ||
    oldState !== oldContext ||
    didPerformWorkStackCursor.current ||
    hasForceUpdate
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
            contextType
          ))
          ? (hasNewLifecycles ||
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
        (instance.context = contextType),
        (nextProps = oldProps))
      : ("function" === typeof instance.componentDidMount &&
          (workInProgress.flags |= 4194308),
        (nextProps = !1));
  } else {
    instance = workInProgress.stateNode;
    cloneUpdateQueue(current, workInProgress);
    oldProps = workInProgress.memoizedProps;
    contextType = resolveClassComponentProps(Component, oldProps);
    instance.props = contextType;
    hasNewLifecycles = workInProgress.pendingProps;
    unresolvedOldProps = instance.context;
    oldContext = Component.contextType;
    "object" === typeof oldContext && null !== oldContext
      ? (oldContext = readContext(oldContext))
      : ((oldContext = isContextProvider(Component)
          ? previousContext
          : contextStackCursor.current),
        (oldContext = getMaskedContext(workInProgress, oldContext)));
    oldState = Component.getDerivedStateFromProps;
    (getDerivedStateFromProps =
      "function" === typeof oldState ||
      "function" === typeof instance.getSnapshotBeforeUpdate) ||
      ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
        "function" !== typeof instance.componentWillReceiveProps) ||
      ((oldProps !== hasNewLifecycles || unresolvedOldProps !== oldContext) &&
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          nextProps,
          oldContext
        ));
    hasForceUpdate = !1;
    unresolvedOldProps = workInProgress.memoizedState;
    instance.state = unresolvedOldProps;
    processUpdateQueue(workInProgress, nextProps, instance, renderLanes);
    suspendIfUpdateReadFromEntangledAsyncAction();
    var newState = workInProgress.memoizedState;
    oldProps !== hasNewLifecycles ||
    unresolvedOldProps !== newState ||
    didPerformWorkStackCursor.current ||
    hasForceUpdate ||
    (null !== current &&
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
            unresolvedOldProps,
            newState,
            oldContext
          ) ||
          (null !== current &&
            null !== current.dependencies &&
            checkIfContextChanged(current.dependencies)))
          ? (getDerivedStateFromProps ||
              ("function" !== typeof instance.UNSAFE_componentWillUpdate &&
                "function" !== typeof instance.componentWillUpdate) ||
              ("function" === typeof instance.componentWillUpdate &&
                instance.componentWillUpdate(nextProps, newState, oldContext),
              "function" === typeof instance.UNSAFE_componentWillUpdate &&
                instance.UNSAFE_componentWillUpdate(
                  nextProps,
                  newState,
                  oldContext
                )),
            "function" === typeof instance.componentDidUpdate &&
              (workInProgress.flags |= 4),
            "function" === typeof instance.getSnapshotBeforeUpdate &&
              (workInProgress.flags |= 1024))
          : ("function" !== typeof instance.componentDidUpdate ||
              (oldProps === current.memoizedProps &&
                unresolvedOldProps === current.memoizedState) ||
              (workInProgress.flags |= 4),
            "function" !== typeof instance.getSnapshotBeforeUpdate ||
              (oldProps === current.memoizedProps &&
                unresolvedOldProps === current.memoizedState) ||
              (workInProgress.flags |= 1024),
            (workInProgress.memoizedProps = nextProps),
            (workInProgress.memoizedState = newState)),
        (instance.props = nextProps),
        (instance.state = newState),
        (instance.context = oldContext),
        (nextProps = contextType))
      : ("function" !== typeof instance.componentDidUpdate ||
          (oldProps === current.memoizedProps &&
            unresolvedOldProps === current.memoizedState) ||
          (workInProgress.flags |= 4),
        "function" !== typeof instance.getSnapshotBeforeUpdate ||
          (oldProps === current.memoizedProps &&
            unresolvedOldProps === current.memoizedState) ||
          (workInProgress.flags |= 1024),
        (nextProps = !1));
  }
  return finishClassComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    hasContext,
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
  var didCaptureError = 0 !== (workInProgress.flags & 128);
  if (!shouldUpdate && !didCaptureError)
    return (
      hasContext && invalidateContextProvider(workInProgress, Component, !1),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  shouldUpdate = workInProgress.stateNode;
  if (
    didCaptureError &&
    "function" !== typeof Component.getDerivedStateFromError
  ) {
    var nextChildren = null;
    profilerStartTime = -1;
  } else
    markComponentRenderStarted(workInProgress),
      (nextChildren = shouldUpdate.render()),
      markComponentRenderStopped();
  workInProgress.flags |= 1;
  null !== current && didCaptureError
    ? ((didCaptureError = nextChildren),
      (workInProgress.child = reconcileChildFibers(
        workInProgress,
        current.child,
        null,
        renderLanes
      )),
      (workInProgress.child = reconcileChildFibers(
        workInProgress,
        null,
        didCaptureError,
        renderLanes
      )))
    : reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  workInProgress.memoizedState = shouldUpdate.state;
  hasContext && invalidateContextProvider(workInProgress, Component, !0);
  return workInProgress.child;
}
function pushHostRootContext(workInProgress) {
  var root = workInProgress.stateNode;
  root.pendingContext
    ? pushTopLevelContextObject(
        workInProgress,
        root.pendingContext,
        root.pendingContext !== root.context
      )
    : root.context &&
      pushTopLevelContextObject(workInProgress, root.context, !1);
  pushHostContainer(workInProgress, root.containerInfo);
}
function mountHostRootWithoutHydrating(
  current,
  workInProgress,
  nextChildren,
  renderLanes
) {
  resetHydrationState();
  workInProgress.flags |= 256;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
var SUSPENDED_MARKER = {
  dehydrated: null,
  treeContext: null,
  retryLane: 0,
  hydrationErrors: null
};
function mountSuspenseOffscreenState(renderLanes) {
  return { baseLanes: renderLanes, cachePool: getSuspendedCache() };
}
function getRemainingWorkInPrimaryTree(
  current,
  primaryTreeDidDefer,
  renderLanes
) {
  current = null !== current ? current.childLanes & ~renderLanes : 0;
  primaryTreeDidDefer && (current |= workInProgressDeferredLane);
  return current;
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
  JSCompiler_temp = 0 !== (workInProgress.flags & 32);
  workInProgress.flags &= -33;
  if (null === current) {
    if (isHydrating) {
      showFallback
        ? pushPrimaryTreeSuspenseHandler(workInProgress)
        : reuseSuspenseHandlerOnStack(workInProgress);
      (renderLanes = nextHydratableInstance)
        ? ((renderLanes = canHydrateHydrationBoundary(
            renderLanes,
            rootOrSingletonContext
          )),
          (renderLanes =
            null !== renderLanes && "&" !== renderLanes.data
              ? renderLanes
              : null),
          null !== renderLanes &&
            ((workInProgress.memoizedState = {
              dehydrated: renderLanes,
              treeContext:
                null !== treeContextProvider
                  ? { id: treeContextId, overflow: treeContextOverflow }
                  : null,
              retryLane: 536870912,
              hydrationErrors: null
            }),
            (current = createFiberFromDehydratedFragment(renderLanes)),
            (current.return = workInProgress),
            (workInProgress.child = current),
            (hydrationParentFiber = workInProgress),
            (nextHydratableInstance = null)))
        : (renderLanes = null);
      if (null === renderLanes) throw throwOnHydrationMismatch(workInProgress);
      isSuspenseInstanceFallback(renderLanes)
        ? (workInProgress.lanes = 32)
        : (workInProgress.lanes = 536870912);
      return null;
    }
    var nextPrimaryChildren = nextProps.children,
      nextFallbackChildren = nextProps.fallback;
    if (showFallback)
      return (
        reuseSuspenseHandlerOnStack(workInProgress),
        mountSuspenseFallbackChildren(
          workInProgress,
          nextPrimaryChildren,
          nextFallbackChildren,
          renderLanes
        ),
        (nextProps = workInProgress.child),
        (nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes)),
        (nextProps.childLanes = getRemainingWorkInPrimaryTree(
          current,
          JSCompiler_temp,
          renderLanes
        )),
        (workInProgress.memoizedState = SUSPENDED_MARKER),
        bailoutOffscreenComponent(null, nextProps)
      );
    if ("number" === typeof nextProps.unstable_expectedLoadTime)
      return (
        reuseSuspenseHandlerOnStack(workInProgress),
        mountSuspenseFallbackChildren(
          workInProgress,
          nextPrimaryChildren,
          nextFallbackChildren,
          renderLanes
        ),
        (nextProps = workInProgress.child),
        (nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes)),
        (nextProps.childLanes = getRemainingWorkInPrimaryTree(
          current,
          JSCompiler_temp,
          renderLanes
        )),
        (workInProgress.memoizedState = SUSPENDED_MARKER),
        (workInProgress.lanes = 4194304),
        bailoutOffscreenComponent(null, nextProps)
      );
    pushPrimaryTreeSuspenseHandler(workInProgress);
    return mountSuspensePrimaryChildren(workInProgress, nextPrimaryChildren);
  }
  nextFallbackChildren = current.memoizedState;
  if (
    null !== nextFallbackChildren &&
    ((nextPrimaryChildren = nextFallbackChildren.dehydrated),
    null !== nextPrimaryChildren)
  ) {
    if (didSuspend)
      workInProgress.flags & 256
        ? (pushPrimaryTreeSuspenseHandler(workInProgress),
          (workInProgress.flags &= -257),
          (workInProgress = retrySuspenseComponentWithoutHydrating(
            current,
            workInProgress,
            renderLanes
          )))
        : null !== workInProgress.memoizedState
          ? (reuseSuspenseHandlerOnStack(workInProgress),
            (workInProgress.child = current.child),
            (workInProgress.flags |= 128),
            (workInProgress = null))
          : (reuseSuspenseHandlerOnStack(workInProgress),
            (nextPrimaryChildren = nextProps.fallback),
            (showFallback = workInProgress.mode),
            (nextProps = mountWorkInProgressOffscreenFiber(
              { mode: "visible", children: nextProps.children },
              showFallback
            )),
            (nextPrimaryChildren = createFiberFromFragment(
              nextPrimaryChildren,
              showFallback,
              renderLanes,
              null
            )),
            (nextPrimaryChildren.flags |= 2),
            (nextProps.return = workInProgress),
            (nextPrimaryChildren.return = workInProgress),
            (nextProps.sibling = nextPrimaryChildren),
            (workInProgress.child = nextProps),
            0 !== (workInProgress.mode & 1) &&
              reconcileChildFibers(
                workInProgress,
                current.child,
                null,
                renderLanes
              ),
            (nextProps = workInProgress.child),
            (nextProps.memoizedState =
              mountSuspenseOffscreenState(renderLanes)),
            (nextProps.childLanes = getRemainingWorkInPrimaryTree(
              current,
              JSCompiler_temp,
              renderLanes
            )),
            (workInProgress.memoizedState = SUSPENDED_MARKER),
            (workInProgress = bailoutOffscreenComponent(null, nextProps)));
    else if (
      (pushPrimaryTreeSuspenseHandler(workInProgress),
      isSuspenseInstanceFallback(nextPrimaryChildren))
    ) {
      JSCompiler_temp =
        nextPrimaryChildren.nextSibling &&
        nextPrimaryChildren.nextSibling.dataset;
      if (JSCompiler_temp) var digest = JSCompiler_temp.dgst;
      JSCompiler_temp = digest;
      nextProps = Error(formatProdErrorMessage(419));
      nextProps.stack = "";
      nextProps.digest = JSCompiler_temp;
      queueHydrationError({ value: nextProps, source: null, stack: null });
      workInProgress = retrySuspenseComponentWithoutHydrating(
        current,
        workInProgress,
        renderLanes
      );
    } else if (
      (didReceiveUpdate ||
        propagateParentContextChanges(current, workInProgress, renderLanes, !1),
      (JSCompiler_temp = 0 !== (renderLanes & current.childLanes)),
      didReceiveUpdate || JSCompiler_temp)
    ) {
      JSCompiler_temp = workInProgressRoot;
      if (
        null !== JSCompiler_temp &&
        ((nextProps = getBumpedLaneForHydration(JSCompiler_temp, renderLanes)),
        0 !== nextProps && nextProps !== nextFallbackChildren.retryLane)
      )
        throw (
          ((nextFallbackChildren.retryLane = nextProps),
          enqueueConcurrentRenderForLane(current, nextProps),
          scheduleUpdateOnFiber(JSCompiler_temp, current, nextProps),
          SelectiveHydrationException)
        );
      isSuspenseInstancePending(nextPrimaryChildren) ||
        renderDidSuspendDelayIfPossible();
      workInProgress = retrySuspenseComponentWithoutHydrating(
        current,
        workInProgress,
        renderLanes
      );
    } else
      isSuspenseInstancePending(nextPrimaryChildren)
        ? ((workInProgress.flags |= 192),
          (workInProgress.child = current.child),
          (workInProgress = null))
        : ((renderLanes = nextFallbackChildren.treeContext),
          (nextHydratableInstance = getNextHydratable(
            nextPrimaryChildren.nextSibling
          )),
          (hydrationParentFiber = workInProgress),
          (isHydrating = !0),
          (hydrationErrors = null),
          (rootOrSingletonContext = !1),
          null !== renderLanes &&
            restoreSuspendedTreeContext(workInProgress, renderLanes),
          (workInProgress = mountSuspensePrimaryChildren(
            workInProgress,
            nextProps.children
          )),
          (workInProgress.flags |= 4096));
    return workInProgress;
  }
  if (showFallback)
    return (
      reuseSuspenseHandlerOnStack(workInProgress),
      (nextPrimaryChildren = nextProps.fallback),
      (showFallback = workInProgress.mode),
      (nextFallbackChildren = current.child),
      (digest = nextFallbackChildren.sibling),
      (didSuspend = { mode: "hidden", children: nextProps.children }),
      0 === (showFallback & 1) && workInProgress.child !== nextFallbackChildren
        ? ((nextProps = workInProgress.child),
          (nextProps.childLanes = 0),
          (nextProps.pendingProps = didSuspend),
          workInProgress.mode & 2 &&
            ((nextProps.actualDuration = -0),
            (nextProps.actualStartTime = -1.1),
            (nextProps.selfBaseDuration =
              nextFallbackChildren.selfBaseDuration),
            (nextProps.treeBaseDuration =
              nextFallbackChildren.treeBaseDuration)),
          (workInProgress.deletions = null))
        : ((nextProps = createWorkInProgress(nextFallbackChildren, didSuspend)),
          (nextProps.subtreeFlags =
            nextFallbackChildren.subtreeFlags & 65011712)),
      null !== digest
        ? (nextPrimaryChildren = createWorkInProgress(
            digest,
            nextPrimaryChildren
          ))
        : ((nextPrimaryChildren = createFiberFromFragment(
            nextPrimaryChildren,
            showFallback,
            renderLanes,
            null
          )),
          (nextPrimaryChildren.flags |= 2)),
      (nextPrimaryChildren.return = workInProgress),
      (nextProps.return = workInProgress),
      (nextProps.sibling = nextPrimaryChildren),
      (workInProgress.child = nextProps),
      bailoutOffscreenComponent(null, nextProps),
      (nextProps = workInProgress.child),
      (nextPrimaryChildren = current.child.memoizedState),
      null === nextPrimaryChildren
        ? (nextPrimaryChildren = mountSuspenseOffscreenState(renderLanes))
        : ((showFallback = nextPrimaryChildren.cachePool),
          null !== showFallback
            ? ((nextFallbackChildren = CacheContext._currentValue),
              (showFallback =
                showFallback.parent !== nextFallbackChildren
                  ? { parent: nextFallbackChildren, pool: nextFallbackChildren }
                  : showFallback))
            : (showFallback = getSuspendedCache()),
          (nextPrimaryChildren = {
            baseLanes: nextPrimaryChildren.baseLanes | renderLanes,
            cachePool: showFallback
          })),
      (nextProps.memoizedState = nextPrimaryChildren),
      (nextProps.childLanes = getRemainingWorkInPrimaryTree(
        current,
        JSCompiler_temp,
        renderLanes
      )),
      (workInProgress.memoizedState = SUSPENDED_MARKER),
      bailoutOffscreenComponent(current.child, nextProps)
    );
  pushPrimaryTreeSuspenseHandler(workInProgress);
  JSCompiler_temp = current.child;
  current = JSCompiler_temp.sibling;
  JSCompiler_temp = createWorkInProgress(JSCompiler_temp, {
    mode: "visible",
    children: nextProps.children
  });
  0 === (workInProgress.mode & 1) && (JSCompiler_temp.lanes = renderLanes);
  JSCompiler_temp.return = workInProgress;
  JSCompiler_temp.sibling = null;
  null !== current &&
    ((renderLanes = workInProgress.deletions),
    null === renderLanes
      ? ((workInProgress.deletions = [current]), (workInProgress.flags |= 16))
      : renderLanes.push(current));
  workInProgress.child = JSCompiler_temp;
  workInProgress.memoizedState = null;
  return JSCompiler_temp;
}
function mountSuspensePrimaryChildren(workInProgress, primaryChildren) {
  primaryChildren = mountWorkInProgressOffscreenFiber(
    { mode: "visible", children: primaryChildren },
    workInProgress.mode
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
      (progressedPrimaryFragment.pendingProps = primaryChildren),
      workInProgress.mode & 2 &&
        ((progressedPrimaryFragment.actualDuration = -0),
        (progressedPrimaryFragment.actualStartTime = -1.1),
        (progressedPrimaryFragment.selfBaseDuration = -0),
        (progressedPrimaryFragment.treeBaseDuration = -0)))
    : (progressedPrimaryFragment = mountWorkInProgressOffscreenFiber(
        primaryChildren,
        mode
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
function mountWorkInProgressOffscreenFiber(offscreenProps, mode) {
  offscreenProps = createFiber(22, offscreenProps, null, mode);
  offscreenProps.lanes = 0;
  return offscreenProps;
}
function retrySuspenseComponentWithoutHydrating(
  current,
  workInProgress,
  renderLanes
) {
  reconcileChildFibers(workInProgress, current.child, null, renderLanes);
  current = mountSuspensePrimaryChildren(
    workInProgress,
    workInProgress.pendingProps.children
  );
  current.flags |= 2;
  workInProgress.memoizedState = null;
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
  tailMode,
  treeForkCount
) {
  var renderState = workInProgress.memoizedState;
  null === renderState
    ? (workInProgress.memoizedState = {
        isBackwards: isBackwards,
        rendering: null,
        renderingStartTime: 0,
        last: lastContentRow,
        tail: tail,
        tailMode: tailMode,
        treeForkCount: treeForkCount
      })
    : ((renderState.isBackwards = isBackwards),
      (renderState.rendering = null),
      (renderState.renderingStartTime = 0),
      (renderState.last = lastContentRow),
      (renderState.tail = tail),
      (renderState.tailMode = tailMode),
      (renderState.treeForkCount = treeForkCount));
}
function updateSuspenseListComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    revealOrder = nextProps.revealOrder,
    tailMode = nextProps.tail;
  nextProps = nextProps.children;
  var suspenseContext = suspenseStackCursor.current,
    shouldForceFallback = 0 !== (suspenseContext & 2);
  shouldForceFallback
    ? ((suspenseContext = (suspenseContext & 1) | 2),
      (workInProgress.flags |= 128))
    : (suspenseContext &= 1);
  push(suspenseStackCursor, suspenseContext);
  reconcileChildren(current, workInProgress, nextProps, renderLanes);
  nextProps = isHydrating ? treeForkCount : 0;
  if (!shouldForceFallback && null !== current && 0 !== (current.flags & 128))
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
          tailMode,
          nextProps
        );
        break;
      case "backwards":
      case "unstable_legacy-backwards":
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
          tailMode,
          nextProps
        );
        break;
      case "together":
        initSuspenseListRenderState(
          workInProgress,
          !1,
          null,
          null,
          void 0,
          nextProps
        );
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
  profilerStartTime = -1;
  workInProgressRootSkippedLanes |= workInProgress.lanes;
  if (0 === (renderLanes & workInProgress.childLanes))
    if (null !== current) {
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
        (renderLanes = renderLanes.sibling =
          createWorkInProgress(current, current.pendingProps)),
        (renderLanes.return = workInProgress);
    renderLanes.sibling = null;
  }
  return workInProgress.child;
}
function checkScheduledUpdateOrContext(current, renderLanes) {
  if (0 !== (current.lanes & renderLanes)) return !0;
  current = current.dependencies;
  return null !== current && checkIfContextChanged(current) ? !0 : !1;
}
function attemptEarlyBailoutIfNoScheduledUpdate(
  current,
  workInProgress,
  renderLanes
) {
  switch (workInProgress.tag) {
    case 3:
      pushHostRootContext(workInProgress);
      pushProvider(workInProgress, CacheContext, current.memoizedState.cache);
      resetHydrationState();
      break;
    case 27:
    case 5:
      pushHostContext(workInProgress);
      break;
    case 1:
      isContextProvider(workInProgress.type) &&
        pushContextProvider(workInProgress);
      break;
    case 4:
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      break;
    case 10:
      pushProvider(
        workInProgress,
        workInProgress.type,
        workInProgress.memoizedProps.value
      );
      break;
    case 12:
      0 !== (renderLanes & workInProgress.childLanes) &&
        (workInProgress.flags |= 4);
      workInProgress.flags |= 2048;
      var stateNode = workInProgress.stateNode;
      stateNode.effectDuration = -0;
      stateNode.passiveEffectDuration = -0;
      break;
    case 31:
      if (null !== workInProgress.memoizedState)
        return (
          (workInProgress.flags |= 128),
          pushDehydratedActivitySuspenseHandler(workInProgress),
          null
        );
      break;
    case 13:
      stateNode = workInProgress.memoizedState;
      if (null !== stateNode) {
        if (null !== stateNode.dehydrated)
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
      stateNode = 0 !== (renderLanes & workInProgress.childLanes);
      stateNode ||
        (propagateParentContextChanges(
          current,
          workInProgress,
          renderLanes,
          !1
        ),
        (stateNode = 0 !== (renderLanes & workInProgress.childLanes)));
      if (didSuspendBefore) {
        if (stateNode)
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
      if (stateNode) break;
      else return null;
    case 22:
      return (
        (workInProgress.lanes = 0),
        updateOffscreenComponent(
          current,
          workInProgress,
          renderLanes,
          workInProgress.pendingProps
        )
      );
    case 24:
      pushProvider(workInProgress, CacheContext, current.memoizedState.cache);
  }
  return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
}
function beginWork(current, workInProgress, renderLanes) {
  if (null !== current)
    if (
      current.memoizedProps !== workInProgress.pendingProps ||
      didPerformWorkStackCursor.current
    )
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
  else
    (didReceiveUpdate = !1),
      isHydrating &&
        0 !== (workInProgress.flags & 1048576) &&
        pushTreeId(workInProgress, treeForkCount, workInProgress.index);
  workInProgress.lanes = 0;
  switch (workInProgress.tag) {
    case 16:
      var elementType = workInProgress.elementType;
      a: if (
        (resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
        (current = workInProgress.pendingProps),
        (elementType = resolveLazy(elementType)),
        (workInProgress.type = elementType),
        "function" === typeof elementType)
      )
        shouldConstruct(elementType)
          ? ((current = resolveClassComponentProps(elementType, current)),
            (workInProgress.tag = 1),
            (workInProgress = updateClassComponent(
              null,
              workInProgress,
              elementType,
              current,
              renderLanes
            )))
          : ((workInProgress.tag = 0),
            (workInProgress = updateFunctionComponent(
              null,
              workInProgress,
              elementType,
              current,
              renderLanes
            )));
      else {
        if (void 0 !== elementType && null !== elementType) {
          var $$typeof = elementType.$$typeof;
          if ($$typeof === REACT_FORWARD_REF_TYPE) {
            workInProgress.tag = 11;
            workInProgress = updateForwardRef(
              null,
              workInProgress,
              elementType,
              current,
              renderLanes
            );
            break a;
          } else if ($$typeof === REACT_MEMO_TYPE) {
            workInProgress.tag = 14;
            workInProgress = updateMemoComponent(
              null,
              workInProgress,
              elementType,
              current,
              renderLanes
            );
            break a;
          }
        }
        workInProgress = getComponentNameFromType(elementType) || elementType;
        throw Error(formatProdErrorMessage(306, workInProgress, ""));
      }
      return workInProgress;
    case 0:
      return updateFunctionComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        renderLanes
      );
    case 1:
      return (
        (elementType = workInProgress.type),
        ($$typeof = resolveClassComponentProps(
          elementType,
          workInProgress.pendingProps
        )),
        updateClassComponent(
          current,
          workInProgress,
          elementType,
          $$typeof,
          renderLanes
        )
      );
    case 3:
      a: {
        pushHostRootContext(workInProgress);
        if (null === current) throw Error(formatProdErrorMessage(387));
        elementType = workInProgress.pendingProps;
        var prevState = workInProgress.memoizedState;
        $$typeof = prevState.element;
        cloneUpdateQueue(current, workInProgress);
        processUpdateQueue(workInProgress, elementType, null, renderLanes);
        var nextState = workInProgress.memoizedState;
        elementType = nextState.cache;
        pushProvider(workInProgress, CacheContext, elementType);
        elementType !== prevState.cache &&
          propagateContextChanges(
            workInProgress,
            [CacheContext],
            renderLanes,
            !0
          );
        suspendIfUpdateReadFromEntangledAsyncAction();
        elementType = nextState.element;
        if (prevState.isDehydrated)
          if (
            ((prevState = {
              element: elementType,
              isDehydrated: !1,
              cache: nextState.cache
            }),
            (workInProgress.updateQueue.baseState = prevState),
            (workInProgress.memoizedState = prevState),
            workInProgress.flags & 256)
          ) {
            workInProgress = mountHostRootWithoutHydrating(
              current,
              workInProgress,
              elementType,
              renderLanes
            );
            break a;
          } else if (elementType !== $$typeof) {
            $$typeof = createCapturedValueAtFiber(
              Error(formatProdErrorMessage(424)),
              workInProgress
            );
            queueHydrationError($$typeof);
            workInProgress = mountHostRootWithoutHydrating(
              current,
              workInProgress,
              elementType,
              renderLanes
            );
            break a;
          } else {
            current = workInProgress.stateNode.containerInfo;
            switch (current.nodeType) {
              case 9:
                current = current.body;
                break;
              default:
                current =
                  "HTML" === current.nodeName
                    ? current.ownerDocument.body
                    : current;
            }
            nextHydratableInstance = getNextHydratable(current.firstChild);
            hydrationParentFiber = workInProgress;
            isHydrating = !0;
            hydrationErrors = null;
            rootOrSingletonContext = !0;
            renderLanes = mountChildFibers(
              workInProgress,
              null,
              elementType,
              renderLanes
            );
            for (workInProgress.child = renderLanes; renderLanes; )
              (renderLanes.flags = (renderLanes.flags & -3) | 4096),
                (renderLanes = renderLanes.sibling);
          }
        else {
          resetHydrationState();
          if (elementType === $$typeof) {
            workInProgress = bailoutOnAlreadyFinishedWork(
              current,
              workInProgress,
              renderLanes
            );
            break a;
          }
          reconcileChildren(current, workInProgress, elementType, renderLanes);
        }
        workInProgress = workInProgress.child;
      }
      return workInProgress;
    case 26:
      return (
        markRef(current, workInProgress),
        null === current
          ? (renderLanes = getResource(
              workInProgress.type,
              null,
              workInProgress.pendingProps,
              null
            ))
            ? (workInProgress.memoizedState = renderLanes)
            : isHydrating ||
              ((renderLanes = workInProgress.type),
              (current = workInProgress.pendingProps),
              (elementType = getOwnerDocumentFromRootContainer(
                rootInstanceStackCursor.current
              ).createElement(renderLanes)),
              (elementType[internalInstanceKey] = workInProgress),
              (elementType[internalPropsKey] = current),
              setInitialProperties(elementType, renderLanes, current),
              markNodeAsHoistable(elementType),
              (workInProgress.stateNode = elementType))
          : (workInProgress.memoizedState = getResource(
              workInProgress.type,
              current.memoizedProps,
              workInProgress.pendingProps,
              current.memoizedState
            )),
        null
      );
    case 27:
      return (
        pushHostContext(workInProgress),
        null === current &&
          isHydrating &&
          ((elementType = workInProgress.stateNode =
            resolveSingletonInstance(
              workInProgress.type,
              workInProgress.pendingProps,
              rootInstanceStackCursor.current
            )),
          (hydrationParentFiber = workInProgress),
          (rootOrSingletonContext = !0),
          ($$typeof = nextHydratableInstance),
          isSingletonScope(workInProgress.type)
            ? ((previousHydratableOnEnteringScopedSingleton = $$typeof),
              (nextHydratableInstance = getNextHydratable(
                elementType.firstChild
              )))
            : (nextHydratableInstance = $$typeof)),
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        markRef(current, workInProgress),
        null === current && (workInProgress.flags |= 4194304),
        workInProgress.child
      );
    case 5:
      if (null === current && isHydrating) {
        if (($$typeof = elementType = nextHydratableInstance))
          (elementType = canHydrateInstance(
            elementType,
            workInProgress.type,
            workInProgress.pendingProps,
            rootOrSingletonContext
          )),
            null !== elementType
              ? ((workInProgress.stateNode = elementType),
                (hydrationParentFiber = workInProgress),
                (nextHydratableInstance = getNextHydratable(
                  elementType.firstChild
                )),
                (rootOrSingletonContext = !1),
                ($$typeof = !0))
              : ($$typeof = !1);
        $$typeof || throwOnHydrationMismatch(workInProgress);
      }
      pushHostContext(workInProgress);
      $$typeof = workInProgress.type;
      prevState = workInProgress.pendingProps;
      nextState = null !== current ? current.memoizedProps : null;
      elementType = prevState.children;
      shouldSetTextContent($$typeof, prevState)
        ? (elementType = null)
        : null !== nextState &&
          shouldSetTextContent($$typeof, nextState) &&
          (workInProgress.flags |= 32);
      null !== workInProgress.memoizedState &&
        (($$typeof = renderWithHooks(
          current,
          workInProgress,
          TransitionAwareHostComponent,
          null,
          null,
          renderLanes
        )),
        (HostTransitionContext._currentValue = $$typeof));
      markRef(current, workInProgress);
      reconcileChildren(current, workInProgress, elementType, renderLanes);
      return workInProgress.child;
    case 6:
      if (null === current && isHydrating) {
        if ((current = renderLanes = nextHydratableInstance))
          (renderLanes = canHydrateTextInstance(
            renderLanes,
            workInProgress.pendingProps,
            rootOrSingletonContext
          )),
            null !== renderLanes
              ? ((workInProgress.stateNode = renderLanes),
                (hydrationParentFiber = workInProgress),
                (nextHydratableInstance = null),
                (current = !0))
              : (current = !1);
        current || throwOnHydrationMismatch(workInProgress);
      }
      return null;
    case 13:
      return updateSuspenseComponent(current, workInProgress, renderLanes);
    case 4:
      return (
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        ),
        (elementType = workInProgress.pendingProps),
        null === current
          ? (workInProgress.child = reconcileChildFibers(
              workInProgress,
              null,
              elementType,
              renderLanes
            ))
          : reconcileChildren(
              current,
              workInProgress,
              elementType,
              renderLanes
            ),
        workInProgress.child
      );
    case 11:
      return updateForwardRef(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        renderLanes
      );
    case 7:
      return (
        (elementType = workInProgress.pendingProps),
        enableFragmentRefs && markRef(current, workInProgress),
        reconcileChildren(current, workInProgress, elementType, renderLanes),
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
        (workInProgress.flags |= 4),
        (workInProgress.flags |= 2048),
        (elementType = workInProgress.stateNode),
        (elementType.effectDuration = -0),
        (elementType.passiveEffectDuration = -0),
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 10:
      return (
        (elementType = workInProgress.pendingProps),
        pushProvider(workInProgress, workInProgress.type, elementType.value),
        reconcileChildren(
          current,
          workInProgress,
          elementType.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 9:
      return (
        ($$typeof = workInProgress.type._context),
        (elementType = workInProgress.pendingProps.children),
        prepareToReadContext(workInProgress),
        ($$typeof = readContext($$typeof)),
        markComponentRenderStarted(workInProgress),
        (elementType = elementType($$typeof)),
        markComponentRenderStopped(),
        (workInProgress.flags |= 1),
        reconcileChildren(current, workInProgress, elementType, renderLanes),
        workInProgress.child
      );
    case 14:
      return updateMemoComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        renderLanes
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
        (elementType = workInProgress.type),
        ($$typeof = resolveClassComponentProps(
          elementType,
          workInProgress.pendingProps
        )),
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
        (workInProgress.tag = 1),
        isContextProvider(elementType)
          ? ((current = !0), pushContextProvider(workInProgress))
          : (current = !1),
        prepareToReadContext(workInProgress),
        constructClassInstance(workInProgress, elementType, $$typeof),
        mountClassInstance(workInProgress, elementType, $$typeof, renderLanes),
        finishClassComponent(
          null,
          workInProgress,
          elementType,
          !0,
          current,
          renderLanes
        )
      );
    case 28:
      return (
        (elementType = workInProgress.type),
        ($$typeof = resolveClassComponentProps(
          elementType,
          workInProgress.pendingProps
        )),
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
        (workInProgress.tag = 0),
        updateFunctionComponent(
          null,
          workInProgress,
          elementType,
          $$typeof,
          renderLanes
        )
      );
    case 19:
      return updateSuspenseListComponent(current, workInProgress, renderLanes);
    case 31:
      return updateActivityComponent(current, workInProgress, renderLanes);
    case 22:
      return updateOffscreenComponent(
        current,
        workInProgress,
        renderLanes,
        workInProgress.pendingProps
      );
    case 24:
      return (
        prepareToReadContext(workInProgress),
        (elementType = readContext(CacheContext)),
        null === current
          ? (($$typeof = peekCacheFromPool()),
            null === $$typeof &&
              (($$typeof = workInProgressRoot),
              (prevState = createCache()),
              ($$typeof.pooledCache = prevState),
              prevState.refCount++,
              null !== prevState && ($$typeof.pooledCacheLanes |= renderLanes),
              ($$typeof = prevState)),
            (workInProgress.memoizedState = {
              parent: elementType,
              cache: $$typeof
            }),
            initializeUpdateQueue(workInProgress),
            pushProvider(workInProgress, CacheContext, $$typeof))
          : (0 !== (current.lanes & renderLanes) &&
              (cloneUpdateQueue(current, workInProgress),
              processUpdateQueue(workInProgress, null, null, renderLanes),
              suspendIfUpdateReadFromEntangledAsyncAction()),
            ($$typeof = current.memoizedState),
            (prevState = workInProgress.memoizedState),
            $$typeof.parent !== elementType
              ? (($$typeof = { parent: elementType, cache: elementType }),
                (workInProgress.memoizedState = $$typeof),
                0 === workInProgress.lanes &&
                  (workInProgress.memoizedState =
                    workInProgress.updateQueue.baseState =
                      $$typeof),
                pushProvider(workInProgress, CacheContext, elementType))
              : ((elementType = prevState.cache),
                pushProvider(workInProgress, CacheContext, elementType),
                elementType !== $$typeof.cache &&
                  propagateContextChanges(
                    workInProgress,
                    [CacheContext],
                    renderLanes,
                    !0
                  ))),
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 29:
      throw workInProgress.pendingProps;
  }
  throw Error(formatProdErrorMessage(156, workInProgress.tag));
}
function markUpdate(workInProgress) {
  workInProgress.flags |= 4;
}
function preloadInstanceAndSuspendIfNeeded(
  workInProgress,
  type,
  oldProps,
  newProps,
  renderLanes
) {
  if ((type = 0 !== (workInProgress.mode & 32))) type = !1;
  if (type) {
    if (
      ((workInProgress.flags |= 16777216),
      (renderLanes & 335544128) === renderLanes)
    )
      if (workInProgress.stateNode.complete) workInProgress.flags |= 8192;
      else if (shouldRemainOnPreviousScreen()) workInProgress.flags |= 8192;
      else
        throw (
          ((suspendedThenable = noopSuspenseyCommitThenable),
          SuspenseyCommitException)
        );
  } else workInProgress.flags &= -16777217;
}
function preloadResourceAndSuspendIfNeeded(workInProgress, resource) {
  if ("stylesheet" !== resource.type || 0 !== (resource.state.loading & 4))
    workInProgress.flags &= -16777217;
  else if (((workInProgress.flags |= 16777216), !preloadResource(resource)))
    if (shouldRemainOnPreviousScreen()) workInProgress.flags |= 8192;
    else
      throw (
        ((suspendedThenable = noopSuspenseyCommitThenable),
        SuspenseyCommitException)
      );
}
function scheduleRetryEffect(workInProgress, retryQueue) {
  null !== retryQueue && (workInProgress.flags |= 4);
  workInProgress.flags & 16384 &&
    ((retryQueue =
      22 !== workInProgress.tag ? claimNextRetryLane() : 536870912),
    (workInProgress.lanes |= retryQueue),
    (workInProgressSuspendedRetryLanes |= retryQueue));
}
function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
  if (!isHydrating)
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
        for (var lastTailNode$129 = null; null !== lastTailNode; )
          null !== lastTailNode.alternate && (lastTailNode$129 = lastTailNode),
            (lastTailNode = lastTailNode.sibling);
        null === lastTailNode$129
          ? hasRenderedATailFallback || null === renderState.tail
            ? (renderState.tail = null)
            : (renderState.tail.sibling = null)
          : (lastTailNode$129.sibling = null);
    }
}
function bubbleProperties(completedWork) {
  var didBailout =
      null !== completedWork.alternate &&
      completedWork.alternate.child === completedWork.child,
    newChildLanes = 0,
    subtreeFlags = 0;
  if (didBailout)
    if (0 !== (completedWork.mode & 2)) {
      for (
        var treeBaseDuration$131 = completedWork.selfBaseDuration,
          child$132 = completedWork.child;
        null !== child$132;

      )
        (newChildLanes |= child$132.lanes | child$132.childLanes),
          (subtreeFlags |= child$132.subtreeFlags & 65011712),
          (subtreeFlags |= child$132.flags & 65011712),
          (treeBaseDuration$131 += child$132.treeBaseDuration),
          (child$132 = child$132.sibling);
      completedWork.treeBaseDuration = treeBaseDuration$131;
    } else
      for (
        treeBaseDuration$131 = completedWork.child;
        null !== treeBaseDuration$131;

      )
        (newChildLanes |=
          treeBaseDuration$131.lanes | treeBaseDuration$131.childLanes),
          (subtreeFlags |= treeBaseDuration$131.subtreeFlags & 65011712),
          (subtreeFlags |= treeBaseDuration$131.flags & 65011712),
          (treeBaseDuration$131.return = completedWork),
          (treeBaseDuration$131 = treeBaseDuration$131.sibling);
  else if (0 !== (completedWork.mode & 2)) {
    treeBaseDuration$131 = completedWork.actualDuration;
    child$132 = completedWork.selfBaseDuration;
    for (var child = completedWork.child; null !== child; )
      (newChildLanes |= child.lanes | child.childLanes),
        (subtreeFlags |= child.subtreeFlags),
        (subtreeFlags |= child.flags),
        (treeBaseDuration$131 += child.actualDuration),
        (child$132 += child.treeBaseDuration),
        (child = child.sibling);
    completedWork.actualDuration = treeBaseDuration$131;
    completedWork.treeBaseDuration = child$132;
  } else
    for (
      treeBaseDuration$131 = completedWork.child;
      null !== treeBaseDuration$131;

    )
      (newChildLanes |=
        treeBaseDuration$131.lanes | treeBaseDuration$131.childLanes),
        (subtreeFlags |= treeBaseDuration$131.subtreeFlags),
        (subtreeFlags |= treeBaseDuration$131.flags),
        (treeBaseDuration$131.return = completedWork),
        (treeBaseDuration$131 = treeBaseDuration$131.sibling);
  completedWork.subtreeFlags |= subtreeFlags;
  completedWork.childLanes = newChildLanes;
  return didBailout;
}
function completeWork(current, workInProgress, renderLanes) {
  var newProps = workInProgress.pendingProps;
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case 28:
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
      return (
        isContextProvider(workInProgress.type) && popContext(),
        bubbleProperties(workInProgress),
        null
      );
    case 3:
      renderLanes = workInProgress.stateNode;
      newProps = null;
      null !== current && (newProps = current.memoizedState.cache);
      workInProgress.memoizedState.cache !== newProps &&
        (workInProgress.flags |= 2048);
      popProvider(CacheContext);
      popHostContainer();
      pop(didPerformWorkStackCursor);
      pop(contextStackCursor);
      renderLanes.pendingContext &&
        ((renderLanes.context = renderLanes.pendingContext),
        (renderLanes.pendingContext = null));
      if (null === current || null === current.child)
        popHydrationState(workInProgress)
          ? markUpdate(workInProgress)
          : null === current ||
            (current.memoizedState.isDehydrated &&
              0 === (workInProgress.flags & 256)) ||
            ((workInProgress.flags |= 1024),
            upgradeHydrationErrorsToRecoverable());
      bubbleProperties(workInProgress);
      return null;
    case 26:
      var type = workInProgress.type,
        nextResource = workInProgress.memoizedState;
      null === current
        ? (markUpdate(workInProgress),
          null !== nextResource
            ? (bubbleProperties(workInProgress),
              preloadResourceAndSuspendIfNeeded(workInProgress, nextResource))
            : (bubbleProperties(workInProgress),
              preloadInstanceAndSuspendIfNeeded(
                workInProgress,
                type,
                null,
                newProps,
                renderLanes
              )))
        : nextResource
          ? nextResource !== current.memoizedState
            ? (markUpdate(workInProgress),
              bubbleProperties(workInProgress),
              preloadResourceAndSuspendIfNeeded(workInProgress, nextResource))
            : (bubbleProperties(workInProgress),
              (workInProgress.flags &= -16777217))
          : ((current = current.memoizedProps),
            current !== newProps && markUpdate(workInProgress),
            bubbleProperties(workInProgress),
            preloadInstanceAndSuspendIfNeeded(
              workInProgress,
              type,
              current,
              newProps,
              renderLanes
            ));
      return null;
    case 27:
      popHostContext(workInProgress);
      renderLanes = rootInstanceStackCursor.current;
      type = workInProgress.type;
      if (null !== current && null != workInProgress.stateNode)
        current.memoizedProps !== newProps && markUpdate(workInProgress);
      else {
        if (!newProps) {
          if (null === workInProgress.stateNode)
            throw Error(formatProdErrorMessage(166));
          bubbleProperties(workInProgress);
          return null;
        }
        current = contextStackCursor$1.current;
        popHydrationState(workInProgress)
          ? prepareToHydrateHostInstance(workInProgress, current)
          : ((current = resolveSingletonInstance(type, newProps, renderLanes)),
            (workInProgress.stateNode = current),
            markUpdate(workInProgress));
      }
      bubbleProperties(workInProgress);
      return null;
    case 5:
      popHostContext(workInProgress);
      type = workInProgress.type;
      if (null !== current && null != workInProgress.stateNode)
        current.memoizedProps !== newProps && markUpdate(workInProgress);
      else {
        if (!newProps) {
          if (null === workInProgress.stateNode)
            throw Error(formatProdErrorMessage(166));
          bubbleProperties(workInProgress);
          return null;
        }
        nextResource = contextStackCursor$1.current;
        if (popHydrationState(workInProgress)) {
          prepareToHydrateHostInstance(workInProgress, nextResource);
          a: switch (type) {
            case "input":
            case "select":
            case "textarea":
            case "img":
              newProps = !0;
              break a;
            default:
              newProps = !1;
          }
          newProps && (workInProgress.flags |= 64);
        } else {
          var ownerDocument = getOwnerDocumentFromRootContainer(
            rootInstanceStackCursor.current
          );
          switch (nextResource) {
            case 1:
              nextResource = ownerDocument.createElementNS(
                "http://www.w3.org/2000/svg",
                type
              );
              break;
            case 2:
              nextResource = ownerDocument.createElementNS(
                "http://www.w3.org/1998/Math/MathML",
                type
              );
              break;
            default:
              switch (type) {
                case "svg":
                  nextResource = ownerDocument.createElementNS(
                    "http://www.w3.org/2000/svg",
                    type
                  );
                  break;
                case "math":
                  nextResource = ownerDocument.createElementNS(
                    "http://www.w3.org/1998/Math/MathML",
                    type
                  );
                  break;
                case "script":
                  nextResource = ownerDocument.createElement("div");
                  nextResource.innerHTML = "<script>\x3c/script>";
                  nextResource = nextResource.removeChild(
                    nextResource.firstChild
                  );
                  break;
                case "select":
                  nextResource =
                    "string" === typeof newProps.is
                      ? ownerDocument.createElement("select", {
                          is: newProps.is
                        })
                      : ownerDocument.createElement("select");
                  newProps.multiple
                    ? (nextResource.multiple = !0)
                    : newProps.size && (nextResource.size = newProps.size);
                  break;
                default:
                  nextResource =
                    "string" === typeof newProps.is
                      ? ownerDocument.createElement(type, { is: newProps.is })
                      : ownerDocument.createElement(type);
              }
          }
          nextResource[internalInstanceKey] = workInProgress;
          nextResource[internalPropsKey] = newProps;
          a: for (
            ownerDocument = workInProgress.child;
            null !== ownerDocument;

          ) {
            if (5 === ownerDocument.tag || 6 === ownerDocument.tag)
              nextResource.appendChild(ownerDocument.stateNode);
            else if (
              4 !== ownerDocument.tag &&
              27 !== ownerDocument.tag &&
              null !== ownerDocument.child
            ) {
              ownerDocument.child.return = ownerDocument;
              ownerDocument = ownerDocument.child;
              continue;
            }
            if (ownerDocument === workInProgress) break a;
            for (; null === ownerDocument.sibling; ) {
              if (
                null === ownerDocument.return ||
                ownerDocument.return === workInProgress
              )
                break a;
              ownerDocument = ownerDocument.return;
            }
            ownerDocument.sibling.return = ownerDocument.return;
            ownerDocument = ownerDocument.sibling;
          }
          workInProgress.stateNode = nextResource;
          a: switch (
            (setInitialProperties(nextResource, type, newProps), type)
          ) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              newProps = !!newProps.autoFocus;
              break a;
            case "img":
              newProps = !0;
              break a;
            default:
              newProps = !1;
          }
          newProps && markUpdate(workInProgress);
        }
      }
      bubbleProperties(workInProgress);
      preloadInstanceAndSuspendIfNeeded(
        workInProgress,
        workInProgress.type,
        null === current ? null : current.memoizedProps,
        workInProgress.pendingProps,
        renderLanes
      );
      return null;
    case 6:
      if (current && null != workInProgress.stateNode)
        current.memoizedProps !== newProps && markUpdate(workInProgress);
      else {
        if ("string" !== typeof newProps && null === workInProgress.stateNode)
          throw Error(formatProdErrorMessage(166));
        current = rootInstanceStackCursor.current;
        if (popHydrationState(workInProgress)) {
          current = workInProgress.stateNode;
          renderLanes = workInProgress.memoizedProps;
          newProps = null;
          type = hydrationParentFiber;
          if (null !== type)
            switch (type.tag) {
              case 27:
              case 5:
                newProps = type.memoizedProps;
            }
          current[internalInstanceKey] = workInProgress;
          current =
            current.nodeValue === renderLanes ||
            (null !== newProps && !0 === newProps.suppressHydrationWarning) ||
            checkForUnmatchedText(current.nodeValue, renderLanes)
              ? !0
              : !1;
          current || throwOnHydrationMismatch(workInProgress, !0);
        } else
          (current =
            getOwnerDocumentFromRootContainer(current).createTextNode(
              newProps
            )),
            (current[internalInstanceKey] = workInProgress),
            (workInProgress.stateNode = current);
      }
      bubbleProperties(workInProgress);
      return null;
    case 31:
      renderLanes = workInProgress.memoizedState;
      if (null === current || null !== current.memoizedState) {
        newProps = popHydrationState(workInProgress);
        if (null !== renderLanes) {
          if (null === current) {
            if (!newProps) throw Error(formatProdErrorMessage(318));
            current = workInProgress.memoizedState;
            current = null !== current ? current.dehydrated : null;
            if (!current) throw Error(formatProdErrorMessage(557));
            current[internalInstanceKey] = workInProgress;
            bubbleProperties(workInProgress);
            0 !== (workInProgress.mode & 2) &&
              null !== renderLanes &&
              ((current = workInProgress.child),
              null !== current &&
                (workInProgress.treeBaseDuration -= current.treeBaseDuration));
          } else
            resetHydrationState(),
              0 === (workInProgress.flags & 128) &&
                (renderLanes = workInProgress.memoizedState = null),
              (workInProgress.flags |= 4),
              bubbleProperties(workInProgress),
              0 !== (workInProgress.mode & 2) &&
                null !== renderLanes &&
                ((current = workInProgress.child),
                null !== current &&
                  (workInProgress.treeBaseDuration -=
                    current.treeBaseDuration));
          current = !1;
        } else
          (renderLanes = upgradeHydrationErrorsToRecoverable()),
            null !== current &&
              null !== current.memoizedState &&
              (current.memoizedState.hydrationErrors = renderLanes),
            (current = !0);
        if (!current) {
          if (workInProgress.flags & 256)
            return popSuspenseHandler(workInProgress), workInProgress;
          popSuspenseHandler(workInProgress);
          return null;
        }
        if (0 !== (workInProgress.flags & 128))
          throw Error(formatProdErrorMessage(558));
      }
      bubbleProperties(workInProgress);
      return null;
    case 13:
      newProps = workInProgress.memoizedState;
      if (
        null === current ||
        (null !== current.memoizedState &&
          null !== current.memoizedState.dehydrated)
      ) {
        type = newProps;
        nextResource = popHydrationState(workInProgress);
        if (null !== type && null !== type.dehydrated) {
          if (null === current) {
            if (!nextResource) throw Error(formatProdErrorMessage(318));
            nextResource = workInProgress.memoizedState;
            nextResource =
              null !== nextResource ? nextResource.dehydrated : null;
            if (!nextResource) throw Error(formatProdErrorMessage(317));
            nextResource[internalInstanceKey] = workInProgress;
            bubbleProperties(workInProgress);
            0 !== (workInProgress.mode & 2) &&
              null !== type &&
              ((type = workInProgress.child),
              null !== type &&
                (workInProgress.treeBaseDuration -= type.treeBaseDuration));
          } else
            resetHydrationState(),
              0 === (workInProgress.flags & 128) &&
                (type = workInProgress.memoizedState = null),
              (workInProgress.flags |= 4),
              bubbleProperties(workInProgress),
              0 !== (workInProgress.mode & 2) &&
                null !== type &&
                ((type = workInProgress.child),
                null !== type &&
                  (workInProgress.treeBaseDuration -= type.treeBaseDuration));
          type = !1;
        } else
          (type = upgradeHydrationErrorsToRecoverable()),
            null !== current &&
              null !== current.memoizedState &&
              (current.memoizedState.hydrationErrors = type),
            (type = !0);
        if (!type) {
          if (workInProgress.flags & 256)
            return popSuspenseHandler(workInProgress), workInProgress;
          popSuspenseHandler(workInProgress);
          return null;
        }
      }
      popSuspenseHandler(workInProgress);
      if (0 !== (workInProgress.flags & 128))
        return (
          (workInProgress.lanes = renderLanes),
          0 !== (workInProgress.mode & 2) &&
            transferActualDuration(workInProgress),
          workInProgress
        );
      renderLanes = null !== newProps;
      current = null !== current && null !== current.memoizedState;
      renderLanes &&
        ((newProps = workInProgress.child),
        (type = null),
        null !== newProps.alternate &&
          null !== newProps.alternate.memoizedState &&
          null !== newProps.alternate.memoizedState.cachePool &&
          (type = newProps.alternate.memoizedState.cachePool.pool),
        (nextResource = null),
        null !== newProps.memoizedState &&
          null !== newProps.memoizedState.cachePool &&
          (nextResource = newProps.memoizedState.cachePool.pool),
        nextResource !== type && (newProps.flags |= 2048));
      renderLanes !== current &&
        renderLanes &&
        (workInProgress.child.flags |= 8192);
      scheduleRetryEffect(workInProgress, workInProgress.updateQueue);
      null !== workInProgress.updateQueue &&
        null != workInProgress.memoizedProps.suspenseCallback &&
        (workInProgress.flags |= 4);
      bubbleProperties(workInProgress);
      0 !== (workInProgress.mode & 2) &&
        renderLanes &&
        ((current = workInProgress.child),
        null !== current &&
          (workInProgress.treeBaseDuration -= current.treeBaseDuration));
      return null;
    case 4:
      return (
        popHostContainer(),
        null === current &&
          listenToAllSupportedEvents(workInProgress.stateNode.containerInfo),
        bubbleProperties(workInProgress),
        null
      );
    case 10:
      return (
        popProvider(workInProgress.type), bubbleProperties(workInProgress), null
      );
    case 17:
      return (
        isContextProvider(workInProgress.type) && popContext(),
        bubbleProperties(workInProgress),
        null
      );
    case 19:
      pop(suspenseStackCursor);
      newProps = workInProgress.memoizedState;
      if (null === newProps) return bubbleProperties(workInProgress), null;
      type = 0 !== (workInProgress.flags & 128);
      nextResource = newProps.rendering;
      if (null === nextResource)
        if (type) cutOffTailIfNeeded(newProps, !1);
        else {
          if (
            0 !== workInProgressRootExitStatus ||
            (null !== current && 0 !== (current.flags & 128))
          )
            for (current = workInProgress.child; null !== current; ) {
              nextResource = findFirstSuspended(current);
              if (null !== nextResource) {
                workInProgress.flags |= 128;
                cutOffTailIfNeeded(newProps, !1);
                current = nextResource.updateQueue;
                workInProgress.updateQueue = current;
                scheduleRetryEffect(workInProgress, current);
                workInProgress.subtreeFlags = 0;
                current = renderLanes;
                for (renderLanes = workInProgress.child; null !== renderLanes; )
                  resetWorkInProgress(renderLanes, current),
                    (renderLanes = renderLanes.sibling);
                push(
                  suspenseStackCursor,
                  (suspenseStackCursor.current & 1) | 2
                );
                isHydrating &&
                  pushTreeFork(workInProgress, newProps.treeForkCount);
                return workInProgress.child;
              }
              current = current.sibling;
            }
          null !== newProps.tail &&
            now$1() > workInProgressRootRenderTargetTime &&
            ((workInProgress.flags |= 128),
            (type = !0),
            cutOffTailIfNeeded(newProps, !1),
            (workInProgress.lanes = 4194304));
        }
      else {
        if (!type)
          if (
            ((current = findFirstSuspended(nextResource)), null !== current)
          ) {
            if (
              ((workInProgress.flags |= 128),
              (type = !0),
              (current = current.updateQueue),
              (workInProgress.updateQueue = current),
              scheduleRetryEffect(workInProgress, current),
              cutOffTailIfNeeded(newProps, !0),
              null === newProps.tail &&
                "hidden" === newProps.tailMode &&
                !nextResource.alternate &&
                !isHydrating)
            )
              return bubbleProperties(workInProgress), null;
          } else
            2 * now$1() - newProps.renderingStartTime >
              workInProgressRootRenderTargetTime &&
              536870912 !== renderLanes &&
              ((workInProgress.flags |= 128),
              (type = !0),
              cutOffTailIfNeeded(newProps, !1),
              (workInProgress.lanes = 4194304));
        newProps.isBackwards
          ? ((nextResource.sibling = workInProgress.child),
            (workInProgress.child = nextResource))
          : ((current = newProps.last),
            null !== current
              ? (current.sibling = nextResource)
              : (workInProgress.child = nextResource),
            (newProps.last = nextResource));
      }
      if (null !== newProps.tail)
        return (
          (current = newProps.tail),
          (newProps.rendering = current),
          (newProps.tail = current.sibling),
          (newProps.renderingStartTime = now$1()),
          (current.sibling = null),
          (renderLanes = suspenseStackCursor.current),
          push(
            suspenseStackCursor,
            type ? (renderLanes & 1) | 2 : renderLanes & 1
          ),
          isHydrating && pushTreeFork(workInProgress, newProps.treeForkCount),
          current
        );
      bubbleProperties(workInProgress);
      return null;
    case 22:
    case 23:
      return (
        popSuspenseHandler(workInProgress),
        popHiddenContext(),
        (newProps = null !== workInProgress.memoizedState),
        null !== current
          ? (null !== current.memoizedState) !== newProps &&
            (workInProgress.flags |= 8192)
          : newProps && (workInProgress.flags |= 8192),
        newProps && 0 !== (workInProgress.mode & 1)
          ? 0 !== (renderLanes & 536870912) &&
            0 === (workInProgress.flags & 128) &&
            (bubbleProperties(workInProgress),
            workInProgress.subtreeFlags & 6 && (workInProgress.flags |= 8192))
          : bubbleProperties(workInProgress),
        (renderLanes = workInProgress.updateQueue),
        null !== renderLanes &&
          scheduleRetryEffect(workInProgress, renderLanes.retryQueue),
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
        null !== current && pop(resumedCache),
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
      return null;
    case 30:
      return null;
    case 29:
      return null;
  }
  throw Error(formatProdErrorMessage(156, workInProgress.tag));
}
function unwindWork(current, workInProgress) {
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case 1:
      return (
        isContextProvider(workInProgress.type) && popContext(),
        (current = workInProgress.flags),
        current & 65536
          ? ((workInProgress.flags = (current & -65537) | 128),
            0 !== (workInProgress.mode & 2) &&
              transferActualDuration(workInProgress),
            workInProgress)
          : null
      );
    case 3:
      return (
        popProvider(CacheContext),
        popHostContainer(),
        pop(didPerformWorkStackCursor),
        pop(contextStackCursor),
        (current = workInProgress.flags),
        0 !== (current & 65536) && 0 === (current & 128)
          ? ((workInProgress.flags = (current & -65537) | 128), workInProgress)
          : null
      );
    case 26:
    case 27:
    case 5:
      return popHostContext(workInProgress), null;
    case 31:
      if (null !== workInProgress.memoizedState) {
        popSuspenseHandler(workInProgress);
        if (null === workInProgress.alternate)
          throw Error(formatProdErrorMessage(340));
        resetHydrationState();
      }
      current = workInProgress.flags;
      return current & 65536
        ? ((workInProgress.flags = (current & -65537) | 128),
          0 !== (workInProgress.mode & 2) &&
            transferActualDuration(workInProgress),
          workInProgress)
        : null;
    case 13:
      popSuspenseHandler(workInProgress);
      current = workInProgress.memoizedState;
      if (null !== current && null !== current.dehydrated) {
        if (null === workInProgress.alternate)
          throw Error(formatProdErrorMessage(340));
        resetHydrationState();
      }
      current = workInProgress.flags;
      return current & 65536
        ? ((workInProgress.flags = (current & -65537) | 128),
          0 !== (workInProgress.mode & 2) &&
            transferActualDuration(workInProgress),
          workInProgress)
        : null;
    case 19:
      return pop(suspenseStackCursor), null;
    case 4:
      return popHostContainer(), null;
    case 10:
      return popProvider(workInProgress.type), null;
    case 22:
    case 23:
      return (
        popSuspenseHandler(workInProgress),
        popHiddenContext(),
        null !== current && pop(resumedCache),
        (current = workInProgress.flags),
        current & 65536
          ? ((workInProgress.flags = (current & -65537) | 128),
            0 !== (workInProgress.mode & 2) &&
              transferActualDuration(workInProgress),
            workInProgress)
          : null
      );
    case 24:
      return popProvider(CacheContext), null;
    case 25:
      return null;
    default:
      return null;
  }
}
function unwindInterruptedWork(current, interruptedWork) {
  popTreeContext(interruptedWork);
  switch (interruptedWork.tag) {
    case 1:
      current = interruptedWork.type.childContextTypes;
      null !== current && void 0 !== current && popContext();
      break;
    case 3:
      popProvider(CacheContext);
      popHostContainer();
      pop(didPerformWorkStackCursor);
      pop(contextStackCursor);
      break;
    case 26:
    case 27:
    case 5:
      popHostContext(interruptedWork);
      break;
    case 4:
      popHostContainer();
      break;
    case 31:
      null !== interruptedWork.memoizedState &&
        popSuspenseHandler(interruptedWork);
      break;
    case 13:
      popSuspenseHandler(interruptedWork);
      break;
    case 19:
      pop(suspenseStackCursor);
      break;
    case 10:
      popProvider(interruptedWork.type);
      break;
    case 22:
    case 23:
      popSuspenseHandler(interruptedWork);
      popHiddenContext();
      null !== current && pop(resumedCache);
      break;
    case 24:
      popProvider(CacheContext);
  }
}
function shouldProfile(current) {
  return 0 !== (current.mode & 2);
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
  shouldProfile(finishedWork)
    ? (startEffectTimer(),
      commitHookEffectListMount(hookFlags, finishedWork),
      recordEffectDuration())
    : commitHookEffectListMount(hookFlags, finishedWork);
}
function commitHookLayoutUnmountEffects(
  finishedWork,
  nearestMountedAncestor,
  hookFlags
) {
  shouldProfile(finishedWork)
    ? (startEffectTimer(),
      commitHookEffectListUnmount(
        hookFlags,
        finishedWork,
        nearestMountedAncestor
      ),
      recordEffectDuration())
    : commitHookEffectListUnmount(
        hookFlags,
        finishedWork,
        nearestMountedAncestor
      );
}
function commitHookEffectListMount(flags, finishedWork) {
  try {
    var updateQueue = finishedWork.updateQueue,
      lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
    if (null !== lastEffect) {
      var firstEffect = lastEffect.next;
      updateQueue = firstEffect;
      do {
        if ((updateQueue.tag & flags) === flags) {
          0 !== (flags & 8)
            ? null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markComponentPassiveEffectMountStarted &&
              injectedProfilingHooks.markComponentPassiveEffectMountStarted(
                finishedWork
              )
            : 0 !== (flags & 4) &&
              null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markComponentLayoutEffectMountStarted &&
              injectedProfilingHooks.markComponentLayoutEffectMountStarted(
                finishedWork
              );
          lastEffect = void 0;
          var create = updateQueue.create,
            inst = updateQueue.inst;
          lastEffect = create();
          inst.destroy = lastEffect;
          0 !== (flags & 8)
            ? null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markComponentPassiveEffectMountStopped &&
              injectedProfilingHooks.markComponentPassiveEffectMountStopped()
            : 0 !== (flags & 4) &&
              null !== injectedProfilingHooks &&
              "function" ===
                typeof injectedProfilingHooks.markComponentLayoutEffectMountStopped &&
              injectedProfilingHooks.markComponentLayoutEffectMountStopped();
        }
        updateQueue = updateQueue.next;
      } while (updateQueue !== firstEffect);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitHookEffectListUnmount(
  flags,
  finishedWork,
  nearestMountedAncestor$jscomp$0
) {
  try {
    var updateQueue = finishedWork.updateQueue,
      lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
    if (null !== lastEffect) {
      var firstEffect = lastEffect.next;
      updateQueue = firstEffect;
      do {
        if ((updateQueue.tag & flags) === flags) {
          var inst = updateQueue.inst,
            destroy = inst.destroy;
          if (void 0 !== destroy) {
            inst.destroy = void 0;
            0 !== (flags & 8)
              ? null !== injectedProfilingHooks &&
                "function" ===
                  typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStarted &&
                injectedProfilingHooks.markComponentPassiveEffectUnmountStarted(
                  finishedWork
                )
              : 0 !== (flags & 4) &&
                null !== injectedProfilingHooks &&
                "function" ===
                  typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStarted &&
                injectedProfilingHooks.markComponentLayoutEffectUnmountStarted(
                  finishedWork
                );
            lastEffect = finishedWork;
            var nearestMountedAncestor = nearestMountedAncestor$jscomp$0,
              destroy_ = destroy;
            try {
              destroy_();
            } catch (error) {
              captureCommitPhaseError(
                lastEffect,
                nearestMountedAncestor,
                error
              );
            }
            0 !== (flags & 8)
              ? null !== injectedProfilingHooks &&
                "function" ===
                  typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStopped &&
                injectedProfilingHooks.markComponentPassiveEffectUnmountStopped()
              : 0 !== (flags & 4) &&
                null !== injectedProfilingHooks &&
                "function" ===
                  typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStopped &&
                injectedProfilingHooks.markComponentLayoutEffectUnmountStopped();
          }
        }
        updateQueue = updateQueue.next;
      } while (updateQueue !== firstEffect);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  shouldProfile(finishedWork)
    ? (startEffectTimer(),
      commitHookEffectListMount(hookFlags, finishedWork),
      recordEffectDuration())
    : commitHookEffectListMount(hookFlags, finishedWork);
}
function commitHookPassiveUnmountEffects(
  finishedWork,
  nearestMountedAncestor,
  hookFlags
) {
  shouldProfile(finishedWork)
    ? (startEffectTimer(),
      commitHookEffectListUnmount(
        hookFlags,
        finishedWork,
        nearestMountedAncestor
      ),
      recordEffectDuration())
    : commitHookEffectListUnmount(
        hookFlags,
        finishedWork,
        nearestMountedAncestor
      );
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
function safelyCallComponentWillUnmount(
  current,
  nearestMountedAncestor,
  instance
) {
  instance.props = resolveClassComponentProps(
    current.type,
    current.memoizedProps
  );
  instance.state = current.memoizedState;
  if (shouldProfile(current)) {
    startEffectTimer();
    try {
      instance.componentWillUnmount();
    } catch (error) {
      captureCommitPhaseError(current, nearestMountedAncestor, error);
    }
    recordEffectDuration();
  } else
    try {
      instance.componentWillUnmount();
    } catch (error$173) {
      captureCommitPhaseError(current, nearestMountedAncestor, error$173);
    }
}
function safelyAttachRef(current, nearestMountedAncestor) {
  try {
    var ref = current.ref;
    if (null !== ref) {
      switch (current.tag) {
        case 26:
        case 27:
        case 5:
          var instanceToUse = current.stateNode;
          break;
        case 30:
          instanceToUse = current.stateNode;
          break;
        case 7:
          if (enableFragmentRefs) {
            null === current.stateNode &&
              (current.stateNode = new FragmentInstance(current));
            instanceToUse = current.stateNode;
            break;
          }
        default:
          instanceToUse = current.stateNode;
      }
      if ("function" === typeof ref)
        if (shouldProfile(current))
          try {
            startEffectTimer(), (current.refCleanup = ref(instanceToUse));
          } finally {
            recordEffectDuration();
          }
        else current.refCleanup = ref(instanceToUse);
      else ref.current = instanceToUse;
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
        if (shouldProfile(current))
          try {
            startEffectTimer(), refCleanup();
          } finally {
            recordEffectDuration(current);
          }
        else refCleanup();
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      } finally {
        (current.refCleanup = null),
          (current = current.alternate),
          null != current && (current.refCleanup = null);
      }
    else if ("function" === typeof ref)
      try {
        if (shouldProfile(current))
          try {
            startEffectTimer(), ref(null);
          } finally {
            recordEffectDuration(current);
          }
        else ref(null);
      } catch (error$174) {
        captureCommitPhaseError(current, nearestMountedAncestor, error$174);
      }
    else ref.current = null;
}
function commitProfilerUpdate(
  finishedWork,
  current,
  commitStartTime,
  effectDuration
) {
  try {
    var _finishedWork$memoize = finishedWork.memoizedProps,
      id = _finishedWork$memoize.id,
      onCommit = _finishedWork$memoize.onCommit,
      onRender = _finishedWork$memoize.onRender;
    current = null === current ? "mount" : "update";
    currentUpdateIsNested && (current = "nested-update");
    "function" === typeof onRender &&
      onRender(
        id,
        current,
        finishedWork.actualDuration,
        finishedWork.treeBaseDuration,
        finishedWork.actualStartTime,
        commitStartTime
      );
    "function" === typeof onCommit &&
      onCommit(id, current, effectDuration, commitStartTime);
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitHostMount(finishedWork) {
  var type = finishedWork.type,
    props = finishedWork.memoizedProps,
    instance = finishedWork.stateNode;
  try {
    a: switch (type) {
      case "button":
      case "input":
      case "select":
      case "textarea":
        props.autoFocus && instance.focus();
        break a;
      case "img":
        props.src
          ? (instance.src = props.src)
          : props.srcSet && (instance.srcset = props.srcSet);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitHostUpdate(finishedWork, newProps, oldProps) {
  try {
    var domElement = finishedWork.stateNode;
    updateProperties(domElement, finishedWork.type, oldProps, newProps);
    domElement[internalPropsKey] = newProps;
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitNewChildToFragmentInstances(fiber, parentFragmentInstances) {
  if (
    5 === fiber.tag &&
    null === fiber.alternate &&
    null !== parentFragmentInstances
  )
    for (var i = 0; i < parentFragmentInstances.length; i++)
      commitNewChildToFragmentInstance(
        fiber.stateNode,
        parentFragmentInstances[i]
      );
}
function commitFragmentInstanceDeletionEffects(fiber) {
  for (var parent = fiber.return; null !== parent; ) {
    if (isFragmentInstanceParent(parent)) {
      var childElement = fiber.stateNode,
        eventListeners = parent.stateNode._eventListeners;
      if (null !== eventListeners)
        for (var i = 0; i < eventListeners.length; i++) {
          var _eventListeners$i4 = eventListeners[i];
          childElement.removeEventListener(
            _eventListeners$i4.type,
            _eventListeners$i4.listener,
            _eventListeners$i4.optionsOrUseCapture
          );
        }
    }
    if (isHostParent(parent)) break;
    parent = parent.return;
  }
}
function isHostParent(fiber) {
  return (
    5 === fiber.tag ||
    3 === fiber.tag ||
    26 === fiber.tag ||
    (27 === fiber.tag && isSingletonScope(fiber.type)) ||
    4 === fiber.tag
  );
}
function isFragmentInstanceParent(fiber) {
  return fiber && 7 === fiber.tag && null !== fiber.stateNode;
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
      if (27 === fiber.tag && isSingletonScope(fiber.type)) continue a;
      if (fiber.flags & 2) continue a;
      if (null === fiber.child || 4 === fiber.tag) continue a;
      else (fiber.child.return = fiber), (fiber = fiber.child);
    }
    if (!(fiber.flags & 2)) return fiber.stateNode;
  }
}
function insertOrAppendPlacementNodeIntoContainer(
  node,
  before,
  parent,
  parentFragmentInstances
) {
  var tag = node.tag;
  if (5 === tag || 6 === tag)
    (tag = node.stateNode),
      before
        ? ((parent =
            9 === parent.nodeType
              ? parent.body
              : "HTML" === parent.nodeName
                ? parent.ownerDocument.body
                : parent),
          supportsMoveBefore && null !== tag.parentNode
            ? parent.moveBefore(tag, before)
            : parent.insertBefore(tag, before))
        : ((before = parent),
          (parent =
            9 === before.nodeType
              ? before.body
              : "HTML" === before.nodeName
                ? before.ownerDocument.body
                : before),
          supportsMoveBefore && null !== tag.parentNode
            ? parent.moveBefore(tag, null)
            : parent.appendChild(tag),
          (tag = before._reactRootContainer),
          (null !== tag && void 0 !== tag) ||
            null !== parent.onclick ||
            (parent.onclick = noop$1)),
      enableFragmentRefs &&
        commitNewChildToFragmentInstances(node, parentFragmentInstances),
      (rootMutationContext = !0);
  else if (
    4 !== tag &&
    (27 === tag &&
      isSingletonScope(node.type) &&
      ((parent = node.stateNode), (before = null)),
    (node = node.child),
    null !== node)
  )
    for (
      insertOrAppendPlacementNodeIntoContainer(
        node,
        before,
        parent,
        parentFragmentInstances
      ),
        node = node.sibling;
      null !== node;

    )
      insertOrAppendPlacementNodeIntoContainer(
        node,
        before,
        parent,
        parentFragmentInstances
      ),
        (node = node.sibling);
}
function insertOrAppendPlacementNode(
  node,
  before,
  parent,
  parentFragmentInstances
) {
  var tag = node.tag;
  if (5 === tag || 6 === tag)
    (tag = node.stateNode),
      before
        ? supportsMoveBefore && null !== tag.parentNode
          ? parent.moveBefore(tag, before)
          : parent.insertBefore(tag, before)
        : ((before = parent),
          supportsMoveBefore && null !== tag.parentNode
            ? before.moveBefore(tag, null)
            : before.appendChild(tag)),
      enableFragmentRefs &&
        commitNewChildToFragmentInstances(node, parentFragmentInstances),
      (rootMutationContext = !0);
  else if (
    4 !== tag &&
    (27 === tag && isSingletonScope(node.type) && (parent = node.stateNode),
    (node = node.child),
    null !== node)
  )
    for (
      insertOrAppendPlacementNode(
        node,
        before,
        parent,
        parentFragmentInstances
      ),
        node = node.sibling;
      null !== node;

    )
      insertOrAppendPlacementNode(
        node,
        before,
        parent,
        parentFragmentInstances
      ),
        (node = node.sibling);
}
function commitHostSingletonAcquisition(finishedWork) {
  var singleton = finishedWork.stateNode,
    props = finishedWork.memoizedProps;
  try {
    for (
      var type = finishedWork.type, attributes = singleton.attributes;
      attributes.length;

    )
      singleton.removeAttributeNode(attributes[0]);
    setInitialProperties(singleton, type, props);
    singleton[internalInstanceKey] = finishedWork;
    singleton[internalPropsKey] = props;
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
var offscreenSubtreeIsHidden = !1,
  offscreenSubtreeWasHidden = !1,
  offscreenDirectParentIsHidden = !1,
  needsFormReset = !1,
  PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set,
  nextEffect = null,
  inProgressLanes = null,
  inProgressRoot = null;
function isHydratingParent(current, finishedWork) {
  return 31 === finishedWork.tag
    ? ((finishedWork = finishedWork.memoizedState),
      null !== current.memoizedState && null === finishedWork)
    : 13 === finishedWork.tag
      ? ((current = current.memoizedState),
        (finishedWork = finishedWork.memoizedState),
        null !== current &&
          null !== current.dehydrated &&
          (null === finishedWork || null === finishedWork.dehydrated))
      : 3 === finishedWork.tag
        ? current.memoizedState.isDehydrated && 0 === (finishedWork.flags & 256)
        : !1;
}
function commitBeforeMutationEffects(root, firstChild) {
  root = root.containerInfo;
  eventsEnabled = _enabled;
  root = getActiveElementDeep(root);
  if (hasSelectionCapabilities(root)) {
    if ("selectionStart" in root)
      var JSCompiler_temp = {
        start: root.selectionStart,
        end: root.selectionEnd
      };
    else
      a: {
        JSCompiler_temp =
          ((JSCompiler_temp = root.ownerDocument) &&
            JSCompiler_temp.defaultView) ||
          window;
        var selection =
          JSCompiler_temp.getSelection && JSCompiler_temp.getSelection();
        if (selection && 0 !== selection.rangeCount) {
          JSCompiler_temp = selection.anchorNode;
          var anchorOffset = selection.anchorOffset,
            focusNode = selection.focusNode;
          selection = selection.focusOffset;
          try {
            JSCompiler_temp.nodeType, focusNode.nodeType;
          } catch (e$26) {
            JSCompiler_temp = null;
            break a;
          }
          var length = 0,
            start = -1,
            end = -1,
            indexWithinAnchor = 0,
            indexWithinFocus = 0,
            node = root,
            parentNode = null;
          b: for (;;) {
            for (var next; ; ) {
              node !== JSCompiler_temp ||
                (0 !== anchorOffset && 3 !== node.nodeType) ||
                (start = length + anchorOffset);
              node !== focusNode ||
                (0 !== selection && 3 !== node.nodeType) ||
                (end = length + selection);
              3 === node.nodeType && (length += node.nodeValue.length);
              if (null === (next = node.firstChild)) break;
              parentNode = node;
              node = next;
            }
            for (;;) {
              if (node === root) break b;
              parentNode === JSCompiler_temp &&
                ++indexWithinAnchor === anchorOffset &&
                (start = length);
              parentNode === focusNode &&
                ++indexWithinFocus === selection &&
                (end = length);
              if (null !== (next = node.nextSibling)) break;
              node = parentNode;
              parentNode = node.parentNode;
            }
            node = next;
          }
          JSCompiler_temp =
            -1 === start || -1 === end ? null : { start: start, end: end };
        } else JSCompiler_temp = null;
      }
    JSCompiler_temp = JSCompiler_temp || { start: 0, end: 0 };
  } else JSCompiler_temp = null;
  selectionInformation = { focusedElem: root, selectionRange: JSCompiler_temp };
  _enabled = !1;
  for (nextEffect = firstChild; null !== nextEffect; )
    if (
      ((firstChild = nextEffect),
      (root = firstChild.child),
      0 !== (firstChild.subtreeFlags & 1028) && null !== root)
    )
      (root.return = firstChild), (nextEffect = root);
    else
      for (; null !== nextEffect; ) {
        firstChild = nextEffect;
        focusNode = firstChild.alternate;
        root = firstChild.flags;
        switch (firstChild.tag) {
          case 0:
          case 11:
          case 15:
            if (
              0 !== (root & 4) &&
              ((root = firstChild.updateQueue),
              (root = null !== root ? root.events : null),
              null !== root)
            )
              for (
                JSCompiler_temp = 0;
                JSCompiler_temp < root.length;
                JSCompiler_temp++
              )
                (anchorOffset = root[JSCompiler_temp]),
                  (anchorOffset.ref.impl = anchorOffset.nextImpl);
            break;
          case 1:
            if (0 !== (root & 1024) && null !== focusNode) {
              root = void 0;
              JSCompiler_temp = firstChild;
              anchorOffset = focusNode.memoizedProps;
              focusNode = focusNode.memoizedState;
              selection = JSCompiler_temp.stateNode;
              try {
                var resolvedPrevProps = resolveClassComponentProps(
                  JSCompiler_temp.type,
                  anchorOffset
                );
                root = selection.getSnapshotBeforeUpdate(
                  resolvedPrevProps,
                  focusNode
                );
                selection.__reactInternalSnapshotBeforeUpdate = root;
              } catch (error) {
                captureCommitPhaseError(
                  JSCompiler_temp,
                  JSCompiler_temp.return,
                  error
                );
              }
            }
            break;
          case 3:
            if (0 !== (root & 1024))
              if (
                ((root = firstChild.stateNode.containerInfo),
                (JSCompiler_temp = root.nodeType),
                9 === JSCompiler_temp)
              )
                clearContainerSparingly(root);
              else if (1 === JSCompiler_temp)
                switch (root.nodeName) {
                  case "HEAD":
                  case "HTML":
                  case "BODY":
                    clearContainerSparingly(root);
                    break;
                  default:
                    root.textContent = "";
                }
            break;
          case 5:
          case 26:
          case 27:
          case 6:
          case 4:
          case 17:
            break;
          default:
            if (0 !== (root & 1024)) throw Error(formatProdErrorMessage(163));
        }
        root = firstChild.sibling;
        if (null !== root) {
          root.return = firstChild.return;
          nextEffect = root;
          break;
        }
        nextEffect = firstChild.return;
      }
}
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  var prevEffectStart = pushComponentEffectStart(),
    prevEffectDuration = pushComponentEffectDuration(),
    prevEffectErrors = pushComponentEffectErrors(),
    prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(),
    flags = finishedWork.flags;
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
          if (shouldProfile(finishedWork)) {
            startEffectTimer();
            try {
              finishedRoot.componentDidMount();
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
            recordEffectDuration();
          } else
            try {
              finishedRoot.componentDidMount();
            } catch (error$170) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$170
              );
            }
        else {
          var prevProps = resolveClassComponentProps(
              finishedWork.type,
              current.memoizedProps
            ),
            prevState = current.memoizedState;
          if (shouldProfile(finishedWork)) {
            startEffectTimer();
            try {
              finishedRoot.componentDidUpdate(
                prevProps,
                prevState,
                finishedRoot.__reactInternalSnapshotBeforeUpdate
              );
            } catch (error$171) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$171
              );
            }
            recordEffectDuration();
          } else
            try {
              finishedRoot.componentDidUpdate(
                prevProps,
                prevState,
                finishedRoot.__reactInternalSnapshotBeforeUpdate
              );
            } catch (error$172) {
              captureCommitPhaseError(
                finishedWork,
                finishedWork.return,
                error$172
              );
            }
        }
      flags & 64 && commitClassCallbacks(finishedWork);
      flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
      break;
    case 3:
      prevProps = pushNestedEffectDurations();
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & 64 && ((flags = finishedWork.updateQueue), null !== flags)) {
        prevState = null;
        if (null !== finishedWork.child)
          switch (finishedWork.child.tag) {
            case 27:
            case 5:
              prevState = finishedWork.child.stateNode;
              break;
            case 1:
              prevState = finishedWork.child.stateNode;
          }
        try {
          commitCallbacks(flags, prevState);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      finishedRoot.effectDuration += popNestedEffectDurations(prevProps);
      break;
    case 27:
      null === current &&
        flags & 4 &&
        commitHostSingletonAcquisition(finishedWork);
    case 26:
    case 5:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (null === current)
        if (flags & 4) commitHostMount(finishedWork);
        else if (flags & 64) {
          var type = finishedWork.type;
          current = finishedWork.memoizedProps;
          finishedRoot = finishedWork.stateNode;
          try {
            switch (type) {
              case "input":
                var value = current.value,
                  defaultValue = current.defaultValue,
                  checked = current.checked,
                  defaultChecked = current.defaultChecked,
                  defaultValueStr =
                    null != defaultValue
                      ? "" + getToStringValue(defaultValue)
                      : "",
                  initialValue =
                    null != value
                      ? "" + getToStringValue(value)
                      : defaultValueStr;
                prevProps = null != checked ? checked : defaultChecked;
                finishedRoot.checked = finishedRoot.checked;
                trackHydrated(
                  finishedRoot,
                  initialValue,
                  "function" !== typeof prevProps &&
                    "symbol" !== typeof prevProps &&
                    !!prevProps
                ) &&
                  ("radio" !== finishedRoot.type || finishedRoot.checked) &&
                  queueChangeEvent(finishedRoot);
                break;
              case "select":
                var value$jscomp$0 = current.value;
                prevProps = finishedRoot.options;
                var propValue =
                  null != value$jscomp$0
                    ? value$jscomp$0
                    : current.defaultValue;
                initialValue = !1;
                if (current.multiple) {
                  current = {};
                  if (null != propValue)
                    for (var i = 0; i < propValue.length; i++)
                      current["$" + propValue[i]] = !0;
                  for (propValue = 0; propValue < prevProps.length; propValue++)
                    if (
                      ((prevState = current.hasOwnProperty(
                        "$" + prevProps[propValue].value
                      )),
                      prevProps[propValue].selected !== prevState)
                    ) {
                      initialValue = !0;
                      break;
                    }
                } else
                  for (
                    i =
                      null == propValue
                        ? null
                        : "" + getToStringValue(propValue),
                      prevState = 0;
                    prevState < prevProps.length;
                    prevState++
                  )
                    if (
                      (null != i ||
                        prevProps[prevState].disabled ||
                        (i = prevProps[prevState].value),
                      prevProps[prevState].selected !==
                        (prevProps[prevState].value === i))
                    ) {
                      initialValue = !0;
                      break;
                    }
                initialValue && queueChangeEvent(finishedRoot);
                break;
              case "textarea":
                var defaultValue$jscomp$0 = current.defaultValue,
                  initialValue$jscomp$0 = current.value;
                null == initialValue$jscomp$0 &&
                  (null == defaultValue$jscomp$0 &&
                    (defaultValue$jscomp$0 = ""),
                  (initialValue$jscomp$0 = defaultValue$jscomp$0));
                var stringValue = "" + getToStringValue(initialValue$jscomp$0);
                trackHydrated(finishedRoot, stringValue, !1) &&
                  queueChangeEvent(finishedRoot);
            }
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
      break;
    case 12:
      flags & 4
        ? ((flags = pushNestedEffectDurations()),
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork),
          (finishedRoot = finishedWork.stateNode),
          (finishedRoot.effectDuration += bubbleNestedEffectDurations(flags)),
          commitProfilerUpdate(
            finishedWork,
            current,
            commitStartTime,
            finishedRoot.effectDuration
          ))
        : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    case 31:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
      break;
    case 13:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
      flags & 64 &&
        ((flags = finishedWork.memoizedState),
        null !== flags &&
          ((flags = flags.dehydrated),
          null !== flags &&
            ((finishedRoot = retryDehydratedSuspenseBoundary.bind(
              null,
              finishedWork
            )),
            registerSuspenseInstanceRetry(flags, finishedRoot))));
      break;
    case 22:
      0 !== (finishedWork.mode & 1)
        ? ((flags =
            null !== finishedWork.memoizedState || offscreenSubtreeIsHidden),
          flags ||
            ((prevProps =
              (null !== current && null !== current.memoizedState) ||
              offscreenSubtreeWasHidden),
            (prevState = offscreenSubtreeIsHidden),
            (propValue = offscreenSubtreeWasHidden),
            (offscreenSubtreeIsHidden = flags),
            (offscreenSubtreeWasHidden = prevProps) && !propValue
              ? (recursivelyTraverseReappearLayoutEffects(
                  finishedRoot,
                  finishedWork,
                  0 !== (finishedWork.subtreeFlags & 8772)
                ),
                enableComponentPerformanceTrack &&
                  0 !== (finishedWork.mode & 2) &&
                  0 <= componentEffectStartTime &&
                  0 <= componentEffectEndTime &&
                  0.05 < componentEffectEndTime - componentEffectStartTime &&
                  logComponentReappeared(
                    finishedWork,
                    componentEffectStartTime,
                    componentEffectEndTime
                  ))
              : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork),
            (offscreenSubtreeIsHidden = prevState),
            (offscreenSubtreeWasHidden = propValue)))
        : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    case 30:
      break;
    case 7:
      enableFragmentRefs &&
        flags & 512 &&
        safelyAttachRef(finishedWork, finishedWork.return);
    default:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
  }
  enableComponentPerformanceTrack &&
    0 !== (finishedWork.mode & 2) &&
    0 <= componentEffectStartTime &&
    0 <= componentEffectEndTime &&
    ((componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
      logComponentEffect(
        finishedWork,
        componentEffectStartTime,
        componentEffectEndTime,
        componentEffectDuration,
        componentEffectErrors
      ),
    null === finishedWork.alternate &&
      null !== finishedWork.return &&
      null !== finishedWork.return.alternate &&
      0.05 < componentEffectEndTime - componentEffectStartTime &&
      (isHydratingParent(finishedWork.return.alternate, finishedWork.return) ||
        logComponentTrigger(
          finishedWork,
          componentEffectStartTime,
          componentEffectEndTime,
          "Mount"
        )));
  popComponentEffectStart(prevEffectStart);
  popComponentEffectDuration(prevEffectDuration);
  componentEffectErrors = prevEffectErrors;
  componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
}
function detachFiberAfterEffects(fiber) {
  var alternate = fiber.alternate;
  null !== alternate &&
    ((fiber.alternate = null), detachFiberAfterEffects(alternate));
  fiber.child = null;
  fiber.deletions = null;
  fiber.sibling = null;
  5 === fiber.tag &&
    ((alternate = fiber.stateNode),
    null !== alternate && detachDeletedInstance(alternate));
  fiber.stateNode = null;
  fiber.return = null;
  fiber.dependencies = null;
  fiber.memoizedProps = null;
  fiber.memoizedState = null;
  fiber.pendingProps = null;
  fiber.stateNode = null;
  fiber.updateQueue = null;
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
  var prevEffectStart = pushComponentEffectStart(),
    prevEffectDuration = pushComponentEffectDuration(),
    prevEffectErrors = pushComponentEffectErrors(),
    prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
  switch (deletedFiber.tag) {
    case 26:
      offscreenSubtreeWasHidden ||
        safelyDetachRef(deletedFiber, nearestMountedAncestor);
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      deletedFiber.memoizedState
        ? deletedFiber.memoizedState.count--
        : deletedFiber.stateNode &&
          ((nearestMountedAncestor = deletedFiber.stateNode),
          nearestMountedAncestor.parentNode.removeChild(
            nearestMountedAncestor
          ));
      break;
    case 27:
      offscreenSubtreeWasHidden ||
        safelyDetachRef(deletedFiber, nearestMountedAncestor);
      var prevHostParent = hostParent,
        prevHostParentIsContainer = hostParentIsContainer;
      isSingletonScope(deletedFiber.type) &&
        ((hostParent = deletedFiber.stateNode), (hostParentIsContainer = !1));
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      releaseSingletonInstance(deletedFiber.stateNode);
      hostParent = prevHostParent;
      hostParentIsContainer = prevHostParentIsContainer;
      break;
    case 5:
      offscreenSubtreeWasHidden ||
        safelyDetachRef(deletedFiber, nearestMountedAncestor),
        enableFragmentRefs &&
          5 === deletedFiber.tag &&
          commitFragmentInstanceDeletionEffects(deletedFiber);
    case 6:
      prevHostParent = hostParent;
      prevHostParentIsContainer = hostParentIsContainer;
      hostParent = null;
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      hostParent = prevHostParent;
      hostParentIsContainer = prevHostParentIsContainer;
      if (null !== hostParent)
        if (hostParentIsContainer)
          try {
            (9 === hostParent.nodeType
              ? hostParent.body
              : "HTML" === hostParent.nodeName
                ? hostParent.ownerDocument.body
                : hostParent
            ).removeChild(deletedFiber.stateNode),
              (rootMutationContext = !0);
          } catch (error) {
            captureCommitPhaseError(
              deletedFiber,
              nearestMountedAncestor,
              error
            );
          }
        else
          try {
            hostParent.removeChild(deletedFiber.stateNode),
              (rootMutationContext = !0);
          } catch (error) {
            captureCommitPhaseError(
              deletedFiber,
              nearestMountedAncestor,
              error
            );
          }
      break;
    case 18:
      finishedRoot = finishedRoot.hydrationCallbacks;
      if (null !== finishedRoot)
        try {
          (prevHostParent = finishedRoot.onDeleted) &&
            prevHostParent(deletedFiber.stateNode);
        } catch (error) {
          captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
        }
      null !== hostParent &&
        (hostParentIsContainer
          ? ((nearestMountedAncestor = hostParent),
            clearHydrationBoundary(
              9 === nearestMountedAncestor.nodeType
                ? nearestMountedAncestor.body
                : "HTML" === nearestMountedAncestor.nodeName
                  ? nearestMountedAncestor.ownerDocument.body
                  : nearestMountedAncestor,
              deletedFiber.stateNode
            ),
            retryIfBlockedOn(nearestMountedAncestor))
          : clearHydrationBoundary(hostParent, deletedFiber.stateNode));
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
      (!enableHiddenSubtreeInsertionEffectCleanup &&
        offscreenSubtreeWasHidden) ||
        commitHookEffectListUnmount(2, deletedFiber, nearestMountedAncestor);
      offscreenSubtreeWasHidden ||
        commitHookLayoutUnmountEffects(deletedFiber, nearestMountedAncestor, 4);
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
    case 1:
      offscreenSubtreeWasHidden ||
        (safelyDetachRef(deletedFiber, nearestMountedAncestor),
        (prevHostParent = deletedFiber.stateNode),
        "function" === typeof prevHostParent.componentWillUnmount &&
          safelyCallComponentWillUnmount(
            deletedFiber,
            nearestMountedAncestor,
            prevHostParent
          ));
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
    case 21:
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
    case 22:
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
    case 30:
    case 7:
      if (enableFragmentRefs) {
        offscreenSubtreeWasHidden ||
          safelyDetachRef(deletedFiber, nearestMountedAncestor);
        recursivelyTraverseDeletionEffects(
          finishedRoot,
          nearestMountedAncestor,
          deletedFiber
        );
        break;
      }
    default:
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
  }
  enableComponentPerformanceTrack &&
    0 !== (deletedFiber.mode & 2) &&
    0 <= componentEffectStartTime &&
    0 <= componentEffectEndTime &&
    (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
    logComponentEffect(
      deletedFiber,
      componentEffectStartTime,
      componentEffectEndTime,
      componentEffectDuration,
      componentEffectErrors
    );
  popComponentEffectStart(prevEffectStart);
  popComponentEffectDuration(prevEffectDuration);
  componentEffectErrors = prevEffectErrors;
  componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
}
function commitActivityHydrationCallbacks(finishedRoot, finishedWork) {
  if (null === finishedWork.memoizedState) {
    var current = finishedWork.alternate;
    if (
      null !== current &&
      ((current = current.memoizedState), null !== current)
    ) {
      current = current.dehydrated;
      try {
        retryIfBlockedOn(current);
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
      try {
        var hydrationCallbacks = finishedRoot.hydrationCallbacks;
        if (null !== hydrationCallbacks) {
          var onHydrated = hydrationCallbacks.onHydrated;
          onHydrated && onHydrated(current);
        }
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
  }
}
function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
  if (null === finishedWork.memoizedState) {
    var current = finishedWork.alternate;
    if (
      null !== current &&
      ((current = current.memoizedState),
      null !== current && ((current = current.dehydrated), null !== current))
    ) {
      try {
        retryIfBlockedOn(current);
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
      try {
        var hydrationCallbacks = finishedRoot.hydrationCallbacks;
        if (null !== hydrationCallbacks) {
          var onHydrated = hydrationCallbacks.onHydrated;
          onHydrated && onHydrated(current);
        }
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
  }
}
function getRetryCache(finishedWork) {
  switch (finishedWork.tag) {
    case 31:
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
function attachSuspenseRetryListeners(finishedWork, wakeables) {
  var retryCache = getRetryCache(finishedWork);
  wakeables.forEach(function (wakeable) {
    if (!retryCache.has(wakeable)) {
      retryCache.add(wakeable);
      if (isDevToolsPresent)
        if (null !== inProgressLanes && null !== inProgressRoot)
          restorePendingUpdaters(inProgressRoot, inProgressLanes);
        else throw Error(formatProdErrorMessage(413));
      var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
      wakeable.then(retry, retry);
    }
  });
}
function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber, lanes) {
  var deletions = parentFiber.deletions;
  if (null !== deletions)
    for (var i = 0; i < deletions.length; i++) {
      var childToDelete = deletions[i],
        root = root$jscomp$0,
        returnFiber = parentFiber,
        prevEffectStart = pushComponentEffectStart(),
        parent = returnFiber;
      a: for (; null !== parent; ) {
        switch (parent.tag) {
          case 27:
            if (isSingletonScope(parent.type)) {
              hostParent = parent.stateNode;
              hostParentIsContainer = !1;
              break a;
            }
            break;
          case 5:
            hostParent = parent.stateNode;
            hostParentIsContainer = !1;
            break a;
          case 3:
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
      enableComponentPerformanceTrack &&
        0 !== (childToDelete.mode & 2) &&
        0 <= componentEffectStartTime &&
        0 <= componentEffectEndTime &&
        0.05 < componentEffectEndTime - componentEffectStartTime &&
        logComponentTrigger(
          childToDelete,
          componentEffectStartTime,
          componentEffectEndTime,
          "Unmount"
        );
      popComponentEffectStart(prevEffectStart);
      root = childToDelete.alternate;
      null !== root && (root.return = null);
      childToDelete.return = null;
    }
  if (parentFiber.subtreeFlags & 13886)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitMutationEffectsOnFiber(parentFiber, root$jscomp$0, lanes),
        (parentFiber = parentFiber.sibling);
}
var currentHoistableRoot = null;
function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
  var prevEffectStart = pushComponentEffectStart(),
    prevEffectDuration = pushComponentEffectDuration(),
    prevEffectErrors = pushComponentEffectErrors(),
    prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(),
    current = finishedWork.alternate,
    flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      flags & 4 &&
        (commitHookEffectListUnmount(3, finishedWork, finishedWork.return),
        commitHookEffectListMount(3, finishedWork),
        commitHookLayoutUnmountEffects(finishedWork, finishedWork.return, 5));
      break;
    case 1:
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        (offscreenSubtreeWasHidden ||
          null === current ||
          safelyDetachRef(current, current.return));
      flags & 64 &&
        offscreenSubtreeIsHidden &&
        ((flags = finishedWork.updateQueue),
        null !== flags &&
          ((current = flags.callbacks),
          null !== current &&
            ((root = flags.shared.hiddenCallbacks),
            (flags.shared.hiddenCallbacks =
              null === root ? current : root.concat(current)))));
      break;
    case 26:
      var hoistableRoot = currentHoistableRoot;
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        (offscreenSubtreeWasHidden ||
          null === current ||
          safelyDetachRef(current, current.return));
      if (flags & 4)
        if (
          ((root = null !== current ? current.memoizedState : null),
          (flags = finishedWork.memoizedState),
          null === current)
        )
          if (null === flags)
            if (null === finishedWork.stateNode) {
              a: {
                flags = finishedWork.type;
                current = finishedWork.memoizedProps;
                root = hoistableRoot.ownerDocument || hoistableRoot;
                b: switch (flags) {
                  case "title":
                    lanes = root.getElementsByTagName("title")[0];
                    if (
                      !lanes ||
                      lanes[internalHoistableMarker] ||
                      lanes[internalInstanceKey] ||
                      "http://www.w3.org/2000/svg" === lanes.namespaceURI ||
                      lanes.hasAttribute("itemprop")
                    )
                      (lanes = root.createElement(flags)),
                        root.head.insertBefore(
                          lanes,
                          root.querySelector("head > title")
                        );
                    setInitialProperties(lanes, flags, current);
                    lanes[internalInstanceKey] = finishedWork;
                    markNodeAsHoistable(lanes);
                    flags = lanes;
                    break a;
                  case "link":
                    if (
                      (hoistableRoot = getHydratableHoistableCache(
                        "link",
                        "href",
                        root
                      ).get(flags + (current.href || "")))
                    )
                      for (var i = 0; i < hoistableRoot.length; i++)
                        if (
                          ((lanes = hoistableRoot[i]),
                          lanes.getAttribute("href") ===
                            (null == current.href || "" === current.href
                              ? null
                              : current.href) &&
                            lanes.getAttribute("rel") ===
                              (null == current.rel ? null : current.rel) &&
                            lanes.getAttribute("title") ===
                              (null == current.title ? null : current.title) &&
                            lanes.getAttribute("crossorigin") ===
                              (null == current.crossOrigin
                                ? null
                                : current.crossOrigin))
                        ) {
                          hoistableRoot.splice(i, 1);
                          break b;
                        }
                    lanes = root.createElement(flags);
                    setInitialProperties(lanes, flags, current);
                    root.head.appendChild(lanes);
                    break;
                  case "meta":
                    if (
                      (hoistableRoot = getHydratableHoistableCache(
                        "meta",
                        "content",
                        root
                      ).get(flags + (current.content || "")))
                    )
                      for (i = 0; i < hoistableRoot.length; i++)
                        if (
                          ((lanes = hoistableRoot[i]),
                          lanes.getAttribute("content") ===
                            (null == current.content
                              ? null
                              : "" + current.content) &&
                            lanes.getAttribute("name") ===
                              (null == current.name ? null : current.name) &&
                            lanes.getAttribute("property") ===
                              (null == current.property
                                ? null
                                : current.property) &&
                            lanes.getAttribute("http-equiv") ===
                              (null == current.httpEquiv
                                ? null
                                : current.httpEquiv) &&
                            lanes.getAttribute("charset") ===
                              (null == current.charSet
                                ? null
                                : current.charSet))
                        ) {
                          hoistableRoot.splice(i, 1);
                          break b;
                        }
                    lanes = root.createElement(flags);
                    setInitialProperties(lanes, flags, current);
                    root.head.appendChild(lanes);
                    break;
                  default:
                    throw Error(formatProdErrorMessage(468, flags));
                }
                lanes[internalInstanceKey] = finishedWork;
                markNodeAsHoistable(lanes);
                flags = lanes;
              }
              finishedWork.stateNode = flags;
            } else
              mountHoistable(
                hoistableRoot,
                finishedWork.type,
                finishedWork.stateNode
              );
          else
            finishedWork.stateNode = acquireResource(
              hoistableRoot,
              flags,
              finishedWork.memoizedProps
            );
        else
          root !== flags
            ? (null === root
                ? null !== current.stateNode &&
                  ((current = current.stateNode),
                  current.parentNode.removeChild(current))
                : root.count--,
              null === flags
                ? mountHoistable(
                    hoistableRoot,
                    finishedWork.type,
                    finishedWork.stateNode
                  )
                : acquireResource(
                    hoistableRoot,
                    flags,
                    finishedWork.memoizedProps
                  ))
            : null === flags &&
              null !== finishedWork.stateNode &&
              commitHostUpdate(
                finishedWork,
                finishedWork.memoizedProps,
                current.memoizedProps
              );
      break;
    case 27:
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        (offscreenSubtreeWasHidden ||
          null === current ||
          safelyDetachRef(current, current.return));
      null !== current &&
        flags & 4 &&
        commitHostUpdate(
          finishedWork,
          finishedWork.memoizedProps,
          current.memoizedProps
        );
      break;
    case 5:
      hoistableRoot = offscreenDirectParentIsHidden;
      offscreenDirectParentIsHidden = !1;
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      offscreenDirectParentIsHidden = hoistableRoot;
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        (offscreenSubtreeWasHidden ||
          null === current ||
          safelyDetachRef(current, current.return));
      if (finishedWork.flags & 32) {
        root = finishedWork.stateNode;
        try {
          setTextContent(root, ""), (rootMutationContext = !0);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      flags & 4 &&
        null != finishedWork.stateNode &&
        ((root = finishedWork.memoizedProps),
        commitHostUpdate(
          finishedWork,
          root,
          null !== current ? current.memoizedProps : root
        ));
      flags & 1024 && (needsFormReset = !0);
      break;
    case 6:
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      if (flags & 4) {
        if (null === finishedWork.stateNode)
          throw Error(formatProdErrorMessage(162));
        flags = finishedWork.memoizedProps;
        current = finishedWork.stateNode;
        try {
          (current.nodeValue = flags), (rootMutationContext = !0);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      break;
    case 3:
      hoistableRoot = pushNestedEffectDurations();
      rootMutationContext = !1;
      tagCaches = null;
      i = currentHoistableRoot;
      currentHoistableRoot = getHoistableRoot(root.containerInfo);
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      currentHoistableRoot = i;
      commitReconciliationEffects(finishedWork);
      if (flags & 4 && null !== current && current.memoizedState.isDehydrated)
        try {
          retryIfBlockedOn(root.containerInfo);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      needsFormReset &&
        ((needsFormReset = !1), recursivelyResetForms(finishedWork));
      root.effectDuration += popNestedEffectDurations(hoistableRoot);
      rootMutationContext &&
        0 !== (lanes & 34) &&
        ((root.indicatorLanes &= ~currentEventTransitionLane),
        (needsIsomorphicIndicator = !1));
      break;
    case 4:
      flags = currentHoistableRoot;
      currentHoistableRoot = getHoistableRoot(
        finishedWork.stateNode.containerInfo
      );
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      currentHoistableRoot = flags;
      break;
    case 12:
      flags = pushNestedEffectDurations();
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      finishedWork.stateNode.effectDuration +=
        bubbleNestedEffectDurations(flags);
      break;
    case 31:
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      flags & 4 &&
        ((flags = finishedWork.updateQueue),
        null !== flags &&
          ((finishedWork.updateQueue = null),
          attachSuspenseRetryListeners(finishedWork, flags)));
      break;
    case 13:
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      finishedWork.child.flags & 8192 &&
        ((root = null !== finishedWork.memoizedState),
        (current = null !== current && null !== current.memoizedState),
        alwaysThrottleRetries
          ? root !== current && (globalMostRecentFallbackTime = now$1())
          : root && !current && (globalMostRecentFallbackTime = now$1()));
      if (flags & 4) {
        try {
          if (null !== finishedWork.memoizedState) {
            var suspenseCallback = finishedWork.memoizedProps.suspenseCallback;
            if ("function" === typeof suspenseCallback) {
              var retryQueue = finishedWork.updateQueue;
              null !== retryQueue && suspenseCallback(new Set(retryQueue));
            }
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
        flags = finishedWork.updateQueue;
        null !== flags &&
          ((finishedWork.updateQueue = null),
          attachSuspenseRetryListeners(finishedWork, flags));
      }
      break;
    case 22:
      suspenseCallback = null !== finishedWork.memoizedState;
      retryQueue = null !== current && null !== current.memoizedState;
      if (finishedWork.mode & 1) {
        var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden,
          prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden,
          prevOffscreenDirectParentIsHidden$193 = offscreenDirectParentIsHidden;
        offscreenSubtreeIsHidden =
          prevOffscreenSubtreeIsHidden || suspenseCallback;
        offscreenDirectParentIsHidden =
          prevOffscreenDirectParentIsHidden$193 || suspenseCallback;
        offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || retryQueue;
        recursivelyTraverseMutationEffects(root, finishedWork, lanes);
        offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
        offscreenDirectParentIsHidden = prevOffscreenDirectParentIsHidden$193;
        offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
        retryQueue &&
          !suspenseCallback &&
          !prevOffscreenSubtreeIsHidden &&
          !prevOffscreenSubtreeWasHidden &&
          enableComponentPerformanceTrack &&
          0 !== (finishedWork.mode & 2) &&
          0 <= componentEffectStartTime &&
          0 <= componentEffectEndTime &&
          0.05 < componentEffectEndTime - componentEffectStartTime &&
          logComponentReappeared(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime
          );
      } else recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      if (
        flags & 8192 &&
        ((root = finishedWork.stateNode),
        (root._visibility = suspenseCallback
          ? root._visibility & -2
          : root._visibility | 1),
        !suspenseCallback ||
          null === current ||
          retryQueue ||
          offscreenSubtreeIsHidden ||
          offscreenSubtreeWasHidden ||
          0 === (finishedWork.mode & 1) ||
          (recursivelyTraverseDisappearLayoutEffects(finishedWork),
          enableComponentPerformanceTrack &&
            0 !== (finishedWork.mode & 2) &&
            0 <= componentEffectStartTime &&
            0 <= componentEffectEndTime &&
            0.05 < componentEffectEndTime - componentEffectStartTime &&
            logComponentTrigger(
              finishedWork,
              componentEffectStartTime,
              componentEffectEndTime,
              "Disconnect"
            )),
        suspenseCallback || !offscreenDirectParentIsHidden)
      )
        a: for (current = null, root = finishedWork; ; ) {
          if (5 === root.tag || 26 === root.tag) {
            if (null === current) {
              lanes = current = root;
              try {
                if (((hoistableRoot = lanes.stateNode), suspenseCallback))
                  (i = hoistableRoot.style),
                    "function" === typeof i.setProperty
                      ? i.setProperty("display", "none", "important")
                      : (i.display = "none");
                else {
                  var instance = lanes.stateNode,
                    styleProp = lanes.memoizedProps.style,
                    display =
                      void 0 !== styleProp &&
                      null !== styleProp &&
                      styleProp.hasOwnProperty("display")
                        ? styleProp.display
                        : null;
                  instance.style.display =
                    null == display || "boolean" === typeof display
                      ? ""
                      : ("" + display).trim();
                }
              } catch (error) {
                captureCommitPhaseError(lanes, lanes.return, error);
              }
            }
          } else if (6 === root.tag) {
            if (null === current) {
              lanes = root;
              try {
                (lanes.stateNode.nodeValue = suspenseCallback
                  ? ""
                  : lanes.memoizedProps),
                  (rootMutationContext = !0);
              } catch (error) {
                captureCommitPhaseError(lanes, lanes.return, error);
              }
            }
          } else if (18 === root.tag) {
            if (null === current) {
              lanes = root;
              try {
                var instance$jscomp$0 = lanes.stateNode;
                suspenseCallback
                  ? hideOrUnhideDehydratedBoundary(instance$jscomp$0, !0)
                  : hideOrUnhideDehydratedBoundary(lanes.stateNode, !1);
              } catch (error) {
                captureCommitPhaseError(lanes, lanes.return, error);
              }
            }
          } else if (
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
          ((current = flags.retryQueue),
          null !== current &&
            ((flags.retryQueue = null),
            attachSuspenseRetryListeners(finishedWork, current))));
      break;
    case 19:
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);
      flags & 4 &&
        ((flags = finishedWork.updateQueue),
        null !== flags &&
          ((finishedWork.updateQueue = null),
          attachSuspenseRetryListeners(finishedWork, flags)));
      break;
    case 30:
      break;
    case 21:
      break;
    case 7:
      enableFragmentRefs &&
        current &&
        null !== current.stateNode &&
        (current.stateNode._fragmentFiber = finishedWork);
    default:
      recursivelyTraverseMutationEffects(root, finishedWork, lanes),
        commitReconciliationEffects(finishedWork);
  }
  enableComponentPerformanceTrack &&
    0 !== (finishedWork.mode & 2) &&
    0 <= componentEffectStartTime &&
    0 <= componentEffectEndTime &&
    ((componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
      logComponentEffect(
        finishedWork,
        componentEffectStartTime,
        componentEffectEndTime,
        componentEffectDuration,
        componentEffectErrors
      ),
    null === finishedWork.alternate &&
      null !== finishedWork.return &&
      null !== finishedWork.return.alternate &&
      0.05 < componentEffectEndTime - componentEffectStartTime &&
      (isHydratingParent(finishedWork.return.alternate, finishedWork.return) ||
        logComponentTrigger(
          finishedWork,
          componentEffectStartTime,
          componentEffectEndTime,
          "Mount"
        )));
  popComponentEffectStart(prevEffectStart);
  popComponentEffectDuration(prevEffectDuration);
  componentEffectErrors = prevEffectErrors;
  componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
}
function commitReconciliationEffects(finishedWork) {
  var flags = finishedWork.flags;
  if (flags & 2) {
    try {
      for (
        var hostParentFiber,
          parentFragmentInstances = null,
          parentFiber = finishedWork.return;
        null !== parentFiber;

      ) {
        if (enableFragmentRefs && isFragmentInstanceParent(parentFiber)) {
          var fragmentInstance = parentFiber.stateNode;
          null === parentFragmentInstances
            ? (parentFragmentInstances = [fragmentInstance])
            : parentFragmentInstances.push(fragmentInstance);
        }
        if (isHostParent(parentFiber)) {
          hostParentFiber = parentFiber;
          break;
        }
        parentFiber = parentFiber.return;
      }
      if (null == hostParentFiber) throw Error(formatProdErrorMessage(160));
      switch (hostParentFiber.tag) {
        case 27:
          var parent = hostParentFiber.stateNode,
            before = getHostSibling(finishedWork);
          insertOrAppendPlacementNode(
            finishedWork,
            before,
            parent,
            parentFragmentInstances
          );
          break;
        case 5:
          var parent$175 = hostParentFiber.stateNode;
          hostParentFiber.flags & 32 &&
            (setTextContent(parent$175, ""), (hostParentFiber.flags &= -33));
          var before$176 = getHostSibling(finishedWork);
          insertOrAppendPlacementNode(
            finishedWork,
            before$176,
            parent$175,
            parentFragmentInstances
          );
          break;
        case 3:
        case 4:
          var parent$177 = hostParentFiber.stateNode.containerInfo,
            before$178 = getHostSibling(finishedWork);
          insertOrAppendPlacementNodeIntoContainer(
            finishedWork,
            before$178,
            parent$177,
            parentFragmentInstances
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
function recursivelyResetForms(parentFiber) {
  if (parentFiber.subtreeFlags & 1024)
    for (parentFiber = parentFiber.child; null !== parentFiber; ) {
      var fiber = parentFiber;
      recursivelyResetForms(fiber);
      5 === fiber.tag && fiber.flags & 1024 && fiber.stateNode.reset();
      parentFiber = parentFiber.sibling;
    }
}
function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & 8772)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitLayoutEffectOnFiber(root, parentFiber.alternate, parentFiber),
        (parentFiber = parentFiber.sibling);
}
function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    var finishedWork = parentFiber,
      prevEffectStart = pushComponentEffectStart(),
      prevEffectDuration = pushComponentEffectDuration(),
      prevEffectErrors = pushComponentEffectErrors(),
      prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
    switch (finishedWork.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        commitHookLayoutUnmountEffects(finishedWork, finishedWork.return, 4);
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 1:
        safelyDetachRef(finishedWork, finishedWork.return);
        var instance = finishedWork.stateNode;
        "function" === typeof instance.componentWillUnmount &&
          safelyCallComponentWillUnmount(
            finishedWork,
            finishedWork.return,
            instance
          );
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 27:
        releaseSingletonInstance(finishedWork.stateNode);
      case 26:
      case 5:
        safelyDetachRef(finishedWork, finishedWork.return);
        enableFragmentRefs &&
          5 === finishedWork.tag &&
          commitFragmentInstanceDeletionEffects(finishedWork);
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 22:
        null === finishedWork.memoizedState &&
          recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 30:
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 7:
        enableFragmentRefs &&
          safelyDetachRef(finishedWork, finishedWork.return);
      default:
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
    }
    enableComponentPerformanceTrack &&
      0 !== (finishedWork.mode & 2) &&
      0 <= componentEffectStartTime &&
      0 <= componentEffectEndTime &&
      (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
      logComponentEffect(
        finishedWork,
        componentEffectStartTime,
        componentEffectEndTime,
        componentEffectDuration,
        componentEffectErrors
      );
    popComponentEffectStart(prevEffectStart);
    popComponentEffectDuration(prevEffectDuration);
    componentEffectErrors = prevEffectErrors;
    componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
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
    var current = parentFiber.alternate,
      finishedRoot = finishedRoot$jscomp$0,
      finishedWork = parentFiber,
      prevEffectStart = pushComponentEffectStart(),
      prevEffectDuration = pushComponentEffectDuration(),
      prevEffectErrors = pushComponentEffectErrors(),
      prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(),
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
        current = finishedWork;
        finishedRoot = current.stateNode;
        if ("function" === typeof finishedRoot.componentDidMount)
          try {
            finishedRoot.componentDidMount();
          } catch (error) {
            captureCommitPhaseError(current, current.return, error);
          }
        current = finishedWork;
        finishedRoot = current.updateQueue;
        if (null !== finishedRoot) {
          var instance = current.stateNode;
          try {
            var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
            if (null !== hiddenCallbacks)
              for (
                finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0;
                finishedRoot < hiddenCallbacks.length;
                finishedRoot++
              )
                callCallback(hiddenCallbacks[finishedRoot], instance);
          } catch (error) {
            captureCommitPhaseError(current, current.return, error);
          }
        }
        includeWorkInProgressEffects &&
          flags & 64 &&
          commitClassCallbacks(finishedWork);
        safelyAttachRef(finishedWork, finishedWork.return);
        break;
      case 27:
        commitHostSingletonAcquisition(finishedWork);
      case 26:
      case 5:
        if (enableFragmentRefs && 5 === finishedWork.tag) {
          instance = finishedWork;
          for (var parent = instance.return; null !== parent; ) {
            isFragmentInstanceParent(parent) &&
              commitNewChildToFragmentInstance(
                instance.stateNode,
                parent.stateNode
              );
            if (isHostParent(parent)) break;
            parent = parent.return;
          }
        }
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        includeWorkInProgressEffects &&
          null === current &&
          flags & 4 &&
          commitHostMount(finishedWork);
        safelyAttachRef(finishedWork, finishedWork.return);
        break;
      case 12:
        includeWorkInProgressEffects && flags & 4
          ? ((flags = pushNestedEffectDurations()),
            recursivelyTraverseReappearLayoutEffects(
              finishedRoot,
              finishedWork,
              includeWorkInProgressEffects
            ),
            (finishedRoot = finishedWork.stateNode),
            (finishedRoot.effectDuration += bubbleNestedEffectDurations(flags)),
            commitProfilerUpdate(
              finishedWork,
              current,
              commitStartTime,
              finishedRoot.effectDuration
            ))
          : recursivelyTraverseReappearLayoutEffects(
              finishedRoot,
              finishedWork,
              includeWorkInProgressEffects
            );
        break;
      case 31:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        includeWorkInProgressEffects &&
          flags & 4 &&
          commitActivityHydrationCallbacks(finishedRoot, finishedWork);
        break;
      case 13:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        includeWorkInProgressEffects &&
          flags & 4 &&
          commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
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
      case 30:
        break;
      case 7:
        enableFragmentRefs &&
          safelyAttachRef(finishedWork, finishedWork.return);
      default:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
    }
    enableComponentPerformanceTrack &&
      0 !== (finishedWork.mode & 2) &&
      0 <= componentEffectStartTime &&
      0 <= componentEffectEndTime &&
      (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
      logComponentEffect(
        finishedWork,
        componentEffectStartTime,
        componentEffectEndTime,
        componentEffectDuration,
        componentEffectErrors
      );
    popComponentEffectStart(prevEffectStart);
    popComponentEffectDuration(prevEffectDuration);
    componentEffectErrors = prevEffectErrors;
    componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
    parentFiber = parentFiber.sibling;
  }
}
function commitOffscreenPassiveMountEffects(current, finishedWork) {
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
}
function commitCachePassiveMountEffect(current, finishedWork) {
  current = null;
  null !== finishedWork.alternate &&
    (current = finishedWork.alternate.memoizedState.cache);
  finishedWork = finishedWork.memoizedState.cache;
  finishedWork !== current &&
    (finishedWork.refCount++, null != current && releaseCache(current));
}
function recursivelyTraversePassiveMountEffects(
  root,
  parentFiber,
  committedLanes,
  committedTransitions,
  endTime
) {
  if (
    parentFiber.subtreeFlags & 10256 ||
    (enableComponentPerformanceTrack &&
      0 !== parentFiber.actualDuration &&
      (null === parentFiber.alternate ||
        parentFiber.alternate.child !== parentFiber.child))
  )
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      if (enableComponentPerformanceTrack) {
        var nextSibling = parentFiber.sibling;
        commitPassiveMountOnFiber(
          root,
          parentFiber,
          committedLanes,
          committedTransitions,
          null !== nextSibling ? nextSibling.actualStartTime : endTime
        );
        parentFiber = nextSibling;
      } else
        commitPassiveMountOnFiber(
          root,
          parentFiber,
          committedLanes,
          committedTransitions,
          0
        ),
          (parentFiber = parentFiber.sibling);
}
var inHydratedSubtree = !1;
function commitPassiveMountOnFiber(
  finishedRoot,
  finishedWork,
  committedLanes,
  committedTransitions,
  endTime
) {
  var prevEffectStart = pushComponentEffectStart(),
    prevEffectDuration = pushComponentEffectDuration(),
    prevEffectErrors = pushComponentEffectErrors(),
    prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(),
    flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      enableComponentPerformanceTrack &&
        0 !== (finishedWork.mode & 2) &&
        0 < finishedWork.actualStartTime &&
        0 !== (finishedWork.flags & 1) &&
        logComponentRender(
          finishedWork,
          finishedWork.actualStartTime,
          endTime,
          inHydratedSubtree
        );
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
      flags & 2048 && commitHookPassiveMountEffects(finishedWork, 9);
      break;
    case 1:
      enableComponentPerformanceTrack &&
        0 !== (finishedWork.mode & 2) &&
        0 < finishedWork.actualStartTime &&
        (0 !== (finishedWork.flags & 128)
          ? logComponentErrored(
              finishedWork,
              finishedWork.actualStartTime,
              endTime
            )
          : 0 !== (finishedWork.flags & 1) &&
            logComponentRender(
              finishedWork,
              finishedWork.actualStartTime,
              endTime,
              inHydratedSubtree
            ));
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
      break;
    case 3:
      var prevProfilerEffectDuration = pushNestedEffectDurations(),
        wasInHydratedSubtree = inHydratedSubtree;
      enableComponentPerformanceTrack &&
        (inHydratedSubtree =
          null !== finishedWork.alternate &&
          finishedWork.alternate.memoizedState.isDehydrated &&
          0 === (finishedWork.flags & 256));
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
      enableComponentPerformanceTrack &&
        (inHydratedSubtree = wasInHydratedSubtree);
      flags & 2048 &&
        ((committedLanes = null),
        null !== finishedWork.alternate &&
          (committedLanes = finishedWork.alternate.memoizedState.cache),
        (committedTransitions = finishedWork.memoizedState.cache),
        committedTransitions !== committedLanes &&
          (committedTransitions.refCount++,
          null != committedLanes && releaseCache(committedLanes)));
      finishedRoot.passiveEffectDuration += popNestedEffectDurations(
        prevProfilerEffectDuration
      );
      break;
    case 12:
      if (flags & 2048) {
        flags = pushNestedEffectDurations();
        recursivelyTraversePassiveMountEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions,
          endTime
        );
        finishedRoot = finishedWork.stateNode;
        finishedRoot.passiveEffectDuration +=
          bubbleNestedEffectDurations(flags);
        try {
          prevProfilerEffectDuration = finishedWork.memoizedProps;
          wasInHydratedSubtree = prevProfilerEffectDuration.id;
          var onPostCommit = prevProfilerEffectDuration.onPostCommit,
            phase = null === finishedWork.alternate ? "mount" : "update";
          currentUpdateIsNested && (phase = "nested-update");
          "function" === typeof onPostCommit &&
            onPostCommit(
              wasInHydratedSubtree,
              phase,
              finishedRoot.passiveEffectDuration,
              commitStartTime
            );
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      } else
        recursivelyTraversePassiveMountEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions,
          endTime
        );
      break;
    case 31:
      flags = inHydratedSubtree;
      enableComponentPerformanceTrack &&
        ((prevProfilerEffectDuration =
          null !== finishedWork.alternate
            ? finishedWork.alternate.memoizedState
            : null),
        (wasInHydratedSubtree = finishedWork.memoizedState),
        null !== prevProfilerEffectDuration && null === wasInHydratedSubtree
          ? ((wasInHydratedSubtree = finishedWork.deletions),
            null !== wasInHydratedSubtree &&
            0 < wasInHydratedSubtree.length &&
            18 === wasInHydratedSubtree[0].tag
              ? ((inHydratedSubtree = !1),
                null !== prevProfilerEffectDuration.hydrationErrors &&
                  logComponentErrored(
                    finishedWork,
                    finishedWork.actualStartTime,
                    endTime
                  ))
              : (inHydratedSubtree = !0))
          : (inHydratedSubtree = !1));
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
      enableComponentPerformanceTrack && (inHydratedSubtree = flags);
      break;
    case 13:
      flags = inHydratedSubtree;
      enableComponentPerformanceTrack &&
        ((prevProfilerEffectDuration =
          null !== finishedWork.alternate
            ? finishedWork.alternate.memoizedState
            : null),
        (wasInHydratedSubtree = finishedWork.memoizedState),
        null === prevProfilerEffectDuration ||
        null === prevProfilerEffectDuration.dehydrated ||
        (null !== wasInHydratedSubtree &&
          null !== wasInHydratedSubtree.dehydrated)
          ? (inHydratedSubtree = !1)
          : ((wasInHydratedSubtree = finishedWork.deletions),
            null !== wasInHydratedSubtree &&
            0 < wasInHydratedSubtree.length &&
            18 === wasInHydratedSubtree[0].tag
              ? ((inHydratedSubtree = !1),
                null !== prevProfilerEffectDuration.hydrationErrors &&
                  logComponentErrored(
                    finishedWork,
                    finishedWork.actualStartTime,
                    endTime
                  ))
              : (inHydratedSubtree = !0)));
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
      enableComponentPerformanceTrack && (inHydratedSubtree = flags);
      break;
    case 23:
      break;
    case 22:
      wasInHydratedSubtree = finishedWork.stateNode;
      prevProfilerEffectDuration = finishedWork.alternate;
      null !== finishedWork.memoizedState
        ? wasInHydratedSubtree._visibility & 2
          ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              endTime
            )
          : finishedWork.mode & 1
            ? recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              )
            : ((wasInHydratedSubtree._visibility |= 2),
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              ))
        : wasInHydratedSubtree._visibility & 2
          ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              endTime
            )
          : ((wasInHydratedSubtree._visibility |= 2),
            recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              0 !== (finishedWork.subtreeFlags & 10256) ||
                (enableComponentPerformanceTrack &&
                  0 !== finishedWork.actualDuration &&
                  (null === finishedWork.alternate ||
                    finishedWork.alternate.child !== finishedWork.child)),
              endTime
            ),
            enableComponentPerformanceTrack &&
              0 !== (finishedWork.mode & 2) &&
              !inHydratedSubtree &&
              ((finishedRoot = finishedWork.actualStartTime),
              0 <= finishedRoot &&
                0.05 < endTime - finishedRoot &&
                logComponentReappeared(finishedWork, finishedRoot, endTime),
              0 <= componentEffectStartTime &&
                0 <= componentEffectEndTime &&
                0.05 < componentEffectEndTime - componentEffectStartTime &&
                logComponentReappeared(
                  finishedWork,
                  componentEffectStartTime,
                  componentEffectEndTime
                )));
      flags & 2048 &&
        commitOffscreenPassiveMountEffects(
          prevProfilerEffectDuration,
          finishedWork
        );
      break;
    case 24:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
      flags & 2048 &&
        commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
      break;
    default:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
  }
  if (enableComponentPerformanceTrack && 0 !== (finishedWork.mode & 2)) {
    if (
      (finishedRoot =
        !inHydratedSubtree &&
        null === finishedWork.alternate &&
        null !== finishedWork.return &&
        null !== finishedWork.return.alternate)
    )
      (committedLanes = finishedWork.actualStartTime),
        0 <= committedLanes &&
          0.05 < endTime - committedLanes &&
          logComponentTrigger(finishedWork, committedLanes, endTime, "Mount");
    0 <= componentEffectStartTime &&
      0 <= componentEffectEndTime &&
      ((componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
        logComponentEffect(
          finishedWork,
          componentEffectStartTime,
          componentEffectEndTime,
          componentEffectDuration,
          componentEffectErrors
        ),
      finishedRoot &&
        0.05 < componentEffectEndTime - componentEffectStartTime &&
        logComponentTrigger(
          finishedWork,
          componentEffectStartTime,
          componentEffectEndTime,
          "Mount"
        ));
  }
  popComponentEffectStart(prevEffectStart);
  popComponentEffectDuration(prevEffectDuration);
  componentEffectErrors = prevEffectErrors;
  componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
}
function recursivelyTraverseReconnectPassiveEffects(
  finishedRoot,
  parentFiber,
  committedLanes,
  committedTransitions,
  includeWorkInProgressEffects,
  endTime
) {
  includeWorkInProgressEffects =
    includeWorkInProgressEffects &&
    (0 !== (parentFiber.subtreeFlags & 10256) ||
      (enableComponentPerformanceTrack &&
        0 !== parentFiber.actualDuration &&
        (null === parentFiber.alternate ||
          parentFiber.alternate.child !== parentFiber.child)));
  for (parentFiber = parentFiber.child; null !== parentFiber; )
    if (enableComponentPerformanceTrack) {
      var nextSibling = parentFiber.sibling;
      reconnectPassiveEffects(
        finishedRoot,
        parentFiber,
        committedLanes,
        committedTransitions,
        includeWorkInProgressEffects,
        null !== nextSibling ? nextSibling.actualStartTime : endTime
      );
      parentFiber = nextSibling;
    } else
      reconnectPassiveEffects(
        finishedRoot,
        parentFiber,
        committedLanes,
        committedTransitions,
        includeWorkInProgressEffects,
        endTime
      ),
        (parentFiber = parentFiber.sibling);
}
function reconnectPassiveEffects(
  finishedRoot,
  finishedWork,
  committedLanes,
  committedTransitions,
  includeWorkInProgressEffects,
  endTime
) {
  var prevEffectStart = pushComponentEffectStart(),
    prevEffectDuration = pushComponentEffectDuration(),
    prevEffectErrors = pushComponentEffectErrors(),
    prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
  enableComponentPerformanceTrack &&
    includeWorkInProgressEffects &&
    0 !== (finishedWork.mode & 2) &&
    0 < finishedWork.actualStartTime &&
    0 !== (finishedWork.flags & 1) &&
    logComponentRender(
      finishedWork,
      finishedWork.actualStartTime,
      endTime,
      inHydratedSubtree
    );
  var flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      recursivelyTraverseReconnectPassiveEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        includeWorkInProgressEffects,
        endTime
      );
      commitHookPassiveMountEffects(finishedWork, 8);
      break;
    case 23:
      break;
    case 22:
      var instance = finishedWork.stateNode;
      null !== finishedWork.memoizedState
        ? instance._visibility & 2
          ? recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              includeWorkInProgressEffects,
              endTime
            )
          : finishedWork.mode & 1
            ? recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              )
            : ((instance._visibility |= 2),
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects,
                endTime
              ))
        : ((instance._visibility |= 2),
          recursivelyTraverseReconnectPassiveEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions,
            includeWorkInProgressEffects,
            endTime
          ));
      includeWorkInProgressEffects &&
        flags & 2048 &&
        commitOffscreenPassiveMountEffects(
          finishedWork.alternate,
          finishedWork
        );
      break;
    case 24:
      recursivelyTraverseReconnectPassiveEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        includeWorkInProgressEffects,
        endTime
      );
      includeWorkInProgressEffects &&
        flags & 2048 &&
        commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
      break;
    default:
      recursivelyTraverseReconnectPassiveEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        includeWorkInProgressEffects,
        endTime
      );
  }
  enableComponentPerformanceTrack &&
    0 !== (finishedWork.mode & 2) &&
    0 <= componentEffectStartTime &&
    0 <= componentEffectEndTime &&
    (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
    logComponentEffect(
      finishedWork,
      componentEffectStartTime,
      componentEffectEndTime,
      componentEffectDuration,
      componentEffectErrors
    );
  popComponentEffectStart(prevEffectStart);
  popComponentEffectDuration(prevEffectDuration);
  componentEffectErrors = prevEffectErrors;
  componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
}
function recursivelyTraverseAtomicPassiveEffects(
  finishedRoot,
  parentFiber,
  committedLanes,
  committedTransitions,
  endTime
) {
  if (
    parentFiber.subtreeFlags & 10256 ||
    (enableComponentPerformanceTrack &&
      0 !== parentFiber.actualDuration &&
      (null === parentFiber.alternate ||
        parentFiber.alternate.child !== parentFiber.child))
  )
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      if (enableComponentPerformanceTrack) {
        var nextSibling = parentFiber.sibling;
        commitAtomicPassiveEffects(
          finishedRoot,
          parentFiber,
          committedLanes,
          committedTransitions,
          null !== nextSibling ? nextSibling.actualStartTime : endTime
        );
        parentFiber = nextSibling;
      } else
        commitAtomicPassiveEffects(
          finishedRoot,
          parentFiber,
          committedLanes,
          committedTransitions,
          endTime
        ),
          (parentFiber = parentFiber.sibling);
}
function commitAtomicPassiveEffects(
  finishedRoot,
  finishedWork,
  committedLanes,
  committedTransitions,
  endTime
) {
  enableComponentPerformanceTrack &&
    0 !== (finishedWork.mode & 2) &&
    0 < finishedWork.actualStartTime &&
    0 !== (finishedWork.flags & 1) &&
    logComponentRender(
      finishedWork,
      finishedWork.actualStartTime,
      endTime,
      inHydratedSubtree
    );
  var flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 22:
      recursivelyTraverseAtomicPassiveEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
      flags & 2048 &&
        commitOffscreenPassiveMountEffects(
          finishedWork.alternate,
          finishedWork
        );
      break;
    case 24:
      recursivelyTraverseAtomicPassiveEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
      flags & 2048 &&
        commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
      break;
    default:
      recursivelyTraverseAtomicPassiveEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions,
        endTime
      );
  }
}
var suspenseyCommitFlag = 8192;
function recursivelyAccumulateSuspenseyCommit(
  parentFiber,
  committedLanes,
  suspendedState
) {
  if (parentFiber.subtreeFlags & suspenseyCommitFlag)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      accumulateSuspenseyCommitOnFiber(
        parentFiber,
        committedLanes,
        suspendedState
      ),
        (parentFiber = parentFiber.sibling);
}
function accumulateSuspenseyCommitOnFiber(
  fiber,
  committedLanes,
  suspendedState
) {
  switch (fiber.tag) {
    case 26:
      recursivelyAccumulateSuspenseyCommit(
        fiber,
        committedLanes,
        suspendedState
      );
      fiber.flags & suspenseyCommitFlag &&
        null !== fiber.memoizedState &&
        suspendResource(
          suspendedState,
          currentHoistableRoot,
          fiber.memoizedState,
          fiber.memoizedProps
        );
      break;
    case 5:
      recursivelyAccumulateSuspenseyCommit(
        fiber,
        committedLanes,
        suspendedState
      );
      break;
    case 3:
    case 4:
      var previousHoistableRoot = currentHoistableRoot;
      currentHoistableRoot = getHoistableRoot(fiber.stateNode.containerInfo);
      recursivelyAccumulateSuspenseyCommit(
        fiber,
        committedLanes,
        suspendedState
      );
      currentHoistableRoot = previousHoistableRoot;
      break;
    case 22:
      null === fiber.memoizedState &&
        ((previousHoistableRoot = fiber.alternate),
        null !== previousHoistableRoot &&
        null !== previousHoistableRoot.memoizedState
          ? ((previousHoistableRoot = suspenseyCommitFlag),
            (suspenseyCommitFlag = 16777216),
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ),
            (suspenseyCommitFlag = previousHoistableRoot))
          : recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ));
      break;
    default:
      recursivelyAccumulateSuspenseyCommit(
        fiber,
        committedLanes,
        suspendedState
      );
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
        var childToDelete = deletions[i],
          prevEffectStart = pushComponentEffectStart();
        nextEffect = childToDelete;
        commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
          childToDelete,
          parentFiber
        );
        enableComponentPerformanceTrack &&
          0 !== (childToDelete.mode & 2) &&
          0 <= componentEffectStartTime &&
          0 <= componentEffectEndTime &&
          0.05 < componentEffectEndTime - componentEffectStartTime &&
          logComponentTrigger(
            childToDelete,
            componentEffectStartTime,
            componentEffectEndTime,
            "Unmount"
          );
        popComponentEffectStart(prevEffectStart);
      }
    detachAlternateSiblings(parentFiber);
  }
  if (parentFiber.subtreeFlags & 10256)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitPassiveUnmountOnFiber(parentFiber),
        (parentFiber = parentFiber.sibling);
}
function commitPassiveUnmountOnFiber(finishedWork) {
  var prevEffectStart = pushComponentEffectStart(),
    prevEffectDuration = pushComponentEffectDuration(),
    prevEffectErrors = pushComponentEffectErrors(),
    prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      finishedWork.flags & 2048 &&
        commitHookPassiveUnmountEffects(finishedWork, finishedWork.return, 9);
      break;
    case 3:
      var prevProfilerEffectDuration = pushNestedEffectDurations();
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      finishedWork.stateNode.passiveEffectDuration += popNestedEffectDurations(
        prevProfilerEffectDuration
      );
      break;
    case 12:
      prevProfilerEffectDuration = pushNestedEffectDurations();
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      finishedWork.stateNode.passiveEffectDuration +=
        bubbleNestedEffectDurations(prevProfilerEffectDuration);
      break;
    case 22:
      prevProfilerEffectDuration = finishedWork.stateNode;
      null !== finishedWork.memoizedState &&
      prevProfilerEffectDuration._visibility & 2 &&
      (null === finishedWork.return || 13 !== finishedWork.return.tag)
        ? ((prevProfilerEffectDuration._visibility &= -3),
          recursivelyTraverseDisconnectPassiveEffects(finishedWork),
          enableComponentPerformanceTrack &&
            0 !== (finishedWork.mode & 2) &&
            0 <= componentEffectStartTime &&
            0 <= componentEffectEndTime &&
            0.05 < componentEffectEndTime - componentEffectStartTime &&
            logComponentTrigger(
              finishedWork,
              componentEffectStartTime,
              componentEffectEndTime,
              "Disconnect"
            ))
        : recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    default:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
  }
  enableComponentPerformanceTrack &&
    0 !== (finishedWork.mode & 2) &&
    0 <= componentEffectStartTime &&
    0 <= componentEffectEndTime &&
    (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
    logComponentEffect(
      finishedWork,
      componentEffectStartTime,
      componentEffectEndTime,
      componentEffectDuration,
      componentEffectErrors
    );
  popComponentEffectStart(prevEffectStart);
  popComponentEffectDuration(prevEffectDuration);
  componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
  componentEffectErrors = prevEffectErrors;
}
function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
  var deletions = parentFiber.deletions;
  if (0 !== (parentFiber.flags & 16)) {
    if (null !== deletions)
      for (var i = 0; i < deletions.length; i++) {
        var childToDelete = deletions[i],
          prevEffectStart = pushComponentEffectStart();
        nextEffect = childToDelete;
        commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
          childToDelete,
          parentFiber
        );
        enableComponentPerformanceTrack &&
          0 !== (childToDelete.mode & 2) &&
          0 <= componentEffectStartTime &&
          0 <= componentEffectEndTime &&
          0.05 < componentEffectEndTime - componentEffectStartTime &&
          logComponentTrigger(
            childToDelete,
            componentEffectStartTime,
            componentEffectEndTime,
            "Unmount"
          );
        popComponentEffectStart(prevEffectStart);
      }
    detachAlternateSiblings(parentFiber);
  }
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    deletions = parentFiber;
    i = pushComponentEffectStart();
    childToDelete = pushComponentEffectDuration();
    prevEffectStart = pushComponentEffectErrors();
    var prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
    switch (deletions.tag) {
      case 0:
      case 11:
      case 15:
        commitHookPassiveUnmountEffects(deletions, deletions.return, 8);
        recursivelyTraverseDisconnectPassiveEffects(deletions);
        break;
      case 22:
        var instance = deletions.stateNode;
        instance._visibility & 2 &&
          ((instance._visibility &= -3),
          recursivelyTraverseDisconnectPassiveEffects(deletions));
        break;
      default:
        recursivelyTraverseDisconnectPassiveEffects(deletions);
    }
    enableComponentPerformanceTrack &&
      0 !== (deletions.mode & 2) &&
      0 <= componentEffectStartTime &&
      0 <= componentEffectEndTime &&
      (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
      logComponentEffect(
        deletions,
        componentEffectStartTime,
        componentEffectEndTime,
        componentEffectDuration,
        componentEffectErrors
      );
    popComponentEffectStart(i);
    popComponentEffectDuration(childToDelete);
    componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
    componentEffectErrors = prevEffectStart;
    parentFiber = parentFiber.sibling;
  }
}
function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
  deletedSubtreeRoot,
  nearestMountedAncestor$jscomp$0
) {
  for (; null !== nextEffect; ) {
    var fiber = nextEffect,
      nearestMountedAncestor = nearestMountedAncestor$jscomp$0,
      prevEffectStart = pushComponentEffectStart(),
      prevEffectDuration = pushComponentEffectDuration(),
      prevEffectErrors = pushComponentEffectErrors(),
      prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
    switch (fiber.tag) {
      case 0:
      case 11:
      case 15:
        commitHookPassiveUnmountEffects(fiber, nearestMountedAncestor, 8);
        break;
      case 23:
      case 22:
        null !== fiber.memoizedState &&
          null !== fiber.memoizedState.cachePool &&
          ((nearestMountedAncestor = fiber.memoizedState.cachePool.pool),
          null != nearestMountedAncestor && nearestMountedAncestor.refCount++);
        break;
      case 24:
        releaseCache(fiber.memoizedState.cache);
    }
    enableComponentPerformanceTrack &&
      0 !== (fiber.mode & 2) &&
      0 <= componentEffectStartTime &&
      0 <= componentEffectEndTime &&
      (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) &&
      logComponentEffect(
        fiber,
        componentEffectStartTime,
        componentEffectEndTime,
        componentEffectDuration,
        componentEffectErrors
      );
    popComponentEffectStart(prevEffectStart);
    popComponentEffectDuration(prevEffectDuration);
    componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
    componentEffectErrors = prevEffectErrors;
    prevEffectStart = fiber.child;
    if (null !== prevEffectStart)
      (prevEffectStart.return = fiber), (nextEffect = prevEffectStart);
    else
      a: for (fiber = deletedSubtreeRoot; null !== nextEffect; ) {
        prevEffectStart = nextEffect;
        prevEffectDuration = prevEffectStart.sibling;
        prevEffectErrors = prevEffectStart.return;
        detachFiberAfterEffects(prevEffectStart);
        if (prevEffectStart === fiber) {
          nextEffect = null;
          break a;
        }
        if (null !== prevEffectDuration) {
          prevEffectDuration.return = prevEffectErrors;
          nextEffect = prevEffectDuration;
          break a;
        }
        nextEffect = prevEffectErrors;
      }
  }
}
var DefaultAsyncDispatcher = {
    getCacheForType: function (resourceType) {
      var cache = readContext(CacheContext),
        cacheForType = cache.data.get(resourceType);
      void 0 === cacheForType &&
        ((cacheForType = resourceType()),
        cache.data.set(resourceType, cacheForType));
      return cacheForType;
    },
    cacheSignal: function () {
      return readContext(CacheContext).controller.signal;
    }
  },
  PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map,
  executionContext = 0,
  workInProgressRoot = null,
  workInProgress = null,
  workInProgressRootRenderLanes = 0,
  workInProgressSuspendedReason = 0,
  workInProgressThrownValue = null,
  workInProgressRootDidSkipSuspendedSiblings = !1,
  workInProgressRootIsPrerendering = !1,
  workInProgressRootDidAttachPingListener = !1,
  entangledRenderLanes = 0,
  workInProgressRootExitStatus = 0,
  workInProgressRootSkippedLanes = 0,
  workInProgressRootInterleavedUpdatedLanes = 0,
  workInProgressRootPingedLanes = 0,
  workInProgressDeferredLane = 0,
  workInProgressSuspendedRetryLanes = 0,
  workInProgressRootConcurrentErrors = null,
  workInProgressRootRecoverableErrors = null,
  workInProgressRootDidIncludeRecursiveRenderUpdate = !1,
  globalMostRecentFallbackTime = 0,
  globalMostRecentTransitionTime = 0,
  workInProgressRootRenderTargetTime = Infinity,
  workInProgressTransitions = null,
  legacyErrorBoundariesThatAlreadyFailed = null,
  pendingEffectsStatus = 0,
  pendingEffectsRoot = null,
  pendingFinishedWork = null,
  pendingEffectsLanes = 0,
  pendingEffectsRemainingLanes = 0,
  pendingEffectsRenderEndTime = -0,
  pendingPassiveTransitions = null,
  pendingRecoverableErrors = null,
  pendingSuspendedCommitReason = null,
  pendingDelayedCommitReason = 0,
  pendingSuspendedViewTransitionReason = null,
  nestedUpdateCount = 0,
  rootWithNestedUpdates = null;
function requestUpdateLane(fiber) {
  return 0 === (fiber.mode & 1)
    ? 2
    : 0 !== (executionContext & 2) && 0 !== workInProgressRootRenderLanes
      ? workInProgressRootRenderLanes & -workInProgressRootRenderLanes
      : null !== ReactSharedInternals.T
        ? requestTransitionLane()
        : resolveUpdatePriority();
}
function requestDeferredLane() {
  if (0 === workInProgressDeferredLane)
    if (0 === (workInProgressRootRenderLanes & 536870912) || isHydrating) {
      var lane = nextTransitionDeferredLane;
      nextTransitionDeferredLane <<= 1;
      0 === (nextTransitionDeferredLane & 3932160) &&
        (nextTransitionDeferredLane = 262144);
      workInProgressDeferredLane = lane;
    } else workInProgressDeferredLane = 536870912;
  lane = suspenseHandlerStackCursor.current;
  null !== lane && (lane.flags |= 32);
  return workInProgressDeferredLane;
}
function scheduleUpdateOnFiber(root, fiber, lane) {
  if (
    (root === workInProgressRoot &&
      (2 === workInProgressSuspendedReason ||
        9 === workInProgressSuspendedReason)) ||
    null !== root.cancelPendingCommit
  )
    prepareFreshStack(root, 0),
      markRootSuspended(
        root,
        workInProgressRootRenderLanes,
        workInProgressDeferredLane,
        !1
      );
  markRootUpdated$1(root, lane);
  if (0 === (executionContext & 2) || root !== workInProgressRoot)
    isDevToolsPresent && addFiberToLanesMap(root, fiber, lane),
      root === workInProgressRoot &&
        (0 === (executionContext & 2) &&
          (workInProgressRootInterleavedUpdatedLanes |= lane),
        4 === workInProgressRootExitStatus &&
          markRootSuspended(
            root,
            workInProgressRootRenderLanes,
            workInProgressDeferredLane,
            !1
          )),
      ensureRootIsScheduled(root),
      2 === lane &&
        0 === executionContext &&
        0 === (fiber.mode & 1) &&
        ((workInProgressRootRenderTargetTime = now$1() + 500),
        flushSyncWorkAcrossRoots_impl(0, !0));
}
function performWorkOnRoot(root$jscomp$0, lanes, forceSync) {
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
  if (
    enableComponentPerformanceTrack &&
    0 !== workInProgressRootRenderLanes &&
    null !== workInProgress
  ) {
    var yieldEndTime = now$1();
    switch (yieldReason) {
      case 3:
      case 2:
        supportsUserTiming &&
          console.timeStamp(
            "Suspended",
            yieldStartTime,
            yieldEndTime,
            "Components \u269b",
            void 0,
            "primary-light"
          );
        break;
      case 9:
        supportsUserTiming &&
          console.timeStamp(
            "Action",
            yieldStartTime,
            yieldEndTime,
            "Components \u269b",
            void 0,
            "primary-light"
          );
        break;
      default:
        if (supportsUserTiming) {
          var yieldDuration = yieldEndTime - yieldStartTime;
          3 > yieldDuration ||
            console.timeStamp(
              "Blocked",
              yieldStartTime,
              yieldEndTime,
              "Components \u269b",
              void 0,
              5 > yieldDuration
                ? "primary-light"
                : 10 > yieldDuration
                  ? "primary"
                  : 100 > yieldDuration
                    ? "primary-dark"
                    : "error"
            );
        }
    }
  }
  var exitStatus = (yieldDuration =
      (!forceSync &&
        0 === (lanes & 127) &&
        0 === (lanes & root$jscomp$0.expiredLanes)) ||
      checkIfRootIsPrerendering(root$jscomp$0, lanes))
      ? renderRootConcurrent(root$jscomp$0, lanes)
      : renderRootSync(root$jscomp$0, lanes, !0),
    renderWasConcurrent = yieldDuration;
  do {
    if (0 === exitStatus) {
      workInProgressRootIsPrerendering &&
        !yieldDuration &&
        markRootSuspended(root$jscomp$0, lanes, 0, !1);
      enableComponentPerformanceTrack &&
        ((lanes = workInProgressSuspendedReason),
        enableComponentPerformanceTrack &&
          ((yieldStartTime = now()), (yieldReason = lanes)));
      break;
    } else {
      yieldEndTime = 0;
      enableComponentPerformanceTrack && (yieldEndTime = now$1());
      forceSync = root$jscomp$0.current.alternate;
      if (
        renderWasConcurrent &&
        !isRenderConsistentWithExternalStores(forceSync)
      ) {
        enableComponentPerformanceTrack &&
          (setCurrentTrackFromLanes(lanes),
          !supportsUserTiming ||
            yieldEndTime <= renderStartTime ||
            console.timeStamp(
              "Teared Render",
              renderStartTime,
              yieldEndTime,
              currentTrack,
              "Scheduler \u269b",
              "error"
            ),
          finalizeRender(lanes, yieldEndTime));
        exitStatus = renderRootSync(root$jscomp$0, lanes, !1);
        renderWasConcurrent = !1;
        continue;
      }
      if (0 !== root$jscomp$0.tag && 2 === exitStatus) {
        renderWasConcurrent = lanes;
        if (root$jscomp$0.errorRecoveryDisabledLanes & renderWasConcurrent)
          var JSCompiler_inline_result = 0;
        else
          (JSCompiler_inline_result = root$jscomp$0.pendingLanes & -536870913),
            (JSCompiler_inline_result =
              0 !== JSCompiler_inline_result
                ? JSCompiler_inline_result
                : JSCompiler_inline_result & 536870912
                  ? 536870912
                  : 0);
        if (0 !== JSCompiler_inline_result) {
          enableComponentPerformanceTrack &&
            (setCurrentTrackFromLanes(lanes),
            logErroredRenderPhase(renderStartTime, yieldEndTime),
            finalizeRender(lanes, yieldEndTime));
          lanes = JSCompiler_inline_result;
          a: {
            var root = root$jscomp$0;
            exitStatus = workInProgressRootConcurrentErrors;
            var wasRootDehydrated = root.current.memoizedState.isDehydrated;
            wasRootDehydrated &&
              (prepareFreshStack(root, JSCompiler_inline_result).flags |= 256);
            JSCompiler_inline_result = renderRootSync(
              root,
              JSCompiler_inline_result,
              !1
            );
            if (2 !== JSCompiler_inline_result) {
              if (
                workInProgressRootDidAttachPingListener &&
                !wasRootDehydrated
              ) {
                root.errorRecoveryDisabledLanes |= renderWasConcurrent;
                workInProgressRootInterleavedUpdatedLanes |=
                  renderWasConcurrent;
                exitStatus = 4;
                break a;
              }
              renderWasConcurrent = workInProgressRootRecoverableErrors;
              workInProgressRootRecoverableErrors = exitStatus;
              null !== renderWasConcurrent &&
                (null === workInProgressRootRecoverableErrors
                  ? (workInProgressRootRecoverableErrors = renderWasConcurrent)
                  : workInProgressRootRecoverableErrors.push.apply(
                      workInProgressRootRecoverableErrors,
                      renderWasConcurrent
                    ));
            }
            exitStatus = JSCompiler_inline_result;
          }
          renderWasConcurrent = !1;
          if (2 !== exitStatus) continue;
          else enableComponentPerformanceTrack && (yieldEndTime = now$1());
        }
      }
      if (1 === exitStatus) {
        enableComponentPerformanceTrack &&
          (setCurrentTrackFromLanes(lanes),
          logErroredRenderPhase(renderStartTime, yieldEndTime),
          finalizeRender(lanes, yieldEndTime));
        prepareFreshStack(root$jscomp$0, 0);
        markRootSuspended(root$jscomp$0, lanes, 0, !0);
        break;
      }
      a: {
        yieldDuration = root$jscomp$0;
        renderWasConcurrent = exitStatus;
        switch (renderWasConcurrent) {
          case 0:
          case 1:
            throw Error(formatProdErrorMessage(345));
          case 4:
            if ((lanes & 4194048) !== lanes) break;
          case 6:
            enableComponentPerformanceTrack &&
              (setCurrentTrackFromLanes(lanes),
              logSuspendedRenderPhase(renderStartTime, yieldEndTime, lanes),
              finalizeRender(lanes, yieldEndTime),
              (forceSync = lanes),
              enableComponentPerformanceTrack &&
                (0 !== (forceSync & 127)
                  ? (blockingSuspendedTime = yieldEndTime)
                  : 0 !== (forceSync & 4194048) &&
                    (transitionSuspendedTime = yieldEndTime)));
            markRootSuspended(
              yieldDuration,
              lanes,
              workInProgressDeferredLane,
              !workInProgressRootDidSkipSuspendedSiblings
            );
            break a;
          case 2:
            workInProgressRootRecoverableErrors = null;
            break;
          case 3:
          case 5:
            break;
          default:
            throw Error(formatProdErrorMessage(329));
        }
        if (
          (lanes & 62914560) === lanes &&
          (alwaysThrottleRetries || 3 === renderWasConcurrent) &&
          ((exitStatus = globalMostRecentFallbackTime + 300 - now$1()),
          10 < exitStatus)
        ) {
          markRootSuspended(
            yieldDuration,
            lanes,
            workInProgressDeferredLane,
            !workInProgressRootDidSkipSuspendedSiblings
          );
          if (0 !== getNextLanes(yieldDuration, 0, !0)) break a;
          pendingEffectsLanes = lanes;
          yieldDuration.timeoutHandle = scheduleTimeout(
            commitRootWhenReady.bind(
              null,
              yieldDuration,
              forceSync,
              workInProgressRootRecoverableErrors,
              workInProgressTransitions,
              workInProgressRootDidIncludeRecursiveRenderUpdate,
              lanes,
              workInProgressDeferredLane,
              workInProgressRootInterleavedUpdatedLanes,
              workInProgressSuspendedRetryLanes,
              workInProgressRootDidSkipSuspendedSiblings,
              renderWasConcurrent,
              "Throttled",
              renderStartTime,
              yieldEndTime
            ),
            exitStatus
          );
          break a;
        }
        commitRootWhenReady(
          yieldDuration,
          forceSync,
          workInProgressRootRecoverableErrors,
          workInProgressTransitions,
          workInProgressRootDidIncludeRecursiveRenderUpdate,
          lanes,
          workInProgressDeferredLane,
          workInProgressRootInterleavedUpdatedLanes,
          workInProgressSuspendedRetryLanes,
          workInProgressRootDidSkipSuspendedSiblings,
          renderWasConcurrent,
          null,
          renderStartTime,
          yieldEndTime
        );
      }
    }
    break;
  } while (1);
  ensureRootIsScheduled(root$jscomp$0);
}
function commitRootWhenReady(
  root,
  finishedWork,
  recoverableErrors,
  transitions,
  didIncludeRenderPhaseUpdate,
  lanes,
  spawnedLane,
  updatedLanes,
  suspendedRetryLanes,
  didSkipSuspendedSiblings,
  exitStatus,
  suspendedCommitReason,
  completedRenderStartTime,
  completedRenderEndTime
) {
  root.timeoutHandle = -1;
  var subtreeFlags = finishedWork.subtreeFlags,
    suspendedState = null;
  if (subtreeFlags & 8192 || 16785408 === (subtreeFlags & 16785408))
    if (
      ((suspendedState = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: noop$1
      }),
      accumulateSuspenseyCommitOnFiber(finishedWork, lanes, suspendedState),
      (subtreeFlags =
        (lanes & 62914560) === lanes
          ? globalMostRecentFallbackTime - now$1()
          : (lanes & 4194048) === lanes
            ? globalMostRecentTransitionTime - now$1()
            : 0),
      (subtreeFlags = waitForCommitToBeReady(suspendedState, subtreeFlags)),
      null !== subtreeFlags)
    ) {
      pendingEffectsLanes = lanes;
      root.cancelPendingCommit = subtreeFlags(
        commitRoot.bind(
          null,
          root,
          finishedWork,
          lanes,
          recoverableErrors,
          transitions,
          didIncludeRenderPhaseUpdate,
          spawnedLane,
          updatedLanes,
          suspendedRetryLanes,
          exitStatus,
          suspendedState,
          suspendedState.waitingForViewTransition
            ? "Waiting for the previous Animation"
            : 0 < suspendedState.count
              ? 0 < suspendedState.imgCount
                ? "Suspended on CSS and Images"
                : "Suspended on CSS"
              : 1 === suspendedState.imgCount
                ? "Suspended on an Image"
                : 0 < suspendedState.imgCount
                  ? "Suspended on Images"
                  : null,
          completedRenderStartTime,
          completedRenderEndTime
        )
      );
      markRootSuspended(root, lanes, spawnedLane, !didSkipSuspendedSiblings);
      return;
    }
  commitRoot(
    root,
    finishedWork,
    lanes,
    recoverableErrors,
    transitions,
    didIncludeRenderPhaseUpdate,
    spawnedLane,
    updatedLanes,
    suspendedRetryLanes,
    exitStatus,
    suspendedState,
    suspendedCommitReason,
    completedRenderStartTime,
    completedRenderEndTime
  );
}
function isRenderConsistentWithExternalStores(finishedWork) {
  for (var node = finishedWork; ; ) {
    var tag = node.tag;
    if (
      (0 === tag || 11 === tag || 15 === tag) &&
      node.flags & 16384 &&
      ((tag = node.updateQueue),
      null !== tag && ((tag = tag.stores), null !== tag))
    )
      for (var i = 0; i < tag.length; i++) {
        var check = tag[i],
          getSnapshot = check.getSnapshot;
        check = check.value;
        try {
          if (!objectIs(getSnapshot(), check)) return !1;
        } catch (error) {
          return !1;
        }
      }
    tag = node.child;
    if (node.subtreeFlags & 16384 && null !== tag)
      (tag.return = node), (node = tag);
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
function markRootSuspended(
  root,
  suspendedLanes,
  spawnedLane,
  didAttemptEntireTree
) {
  suspendedLanes &= ~workInProgressRootPingedLanes;
  suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
  root.suspendedLanes |= suspendedLanes;
  root.pingedLanes &= ~suspendedLanes;
  didAttemptEntireTree && (root.warmLanes |= suspendedLanes);
  didAttemptEntireTree = root.expirationTimes;
  for (var lanes = suspendedLanes; 0 < lanes; ) {
    var index$6 = 31 - clz32(lanes),
      lane = 1 << index$6;
    didAttemptEntireTree[index$6] = -1;
    lanes &= ~lane;
  }
  0 !== spawnedLane &&
    markSpawnedDeferredLane(root, spawnedLane, suspendedLanes);
}
function flushSyncWork() {
  return 0 === (executionContext & 6)
    ? (flushSyncWorkAcrossRoots_impl(0, !1), !1)
    : !0;
}
function resetWorkInProgressStack() {
  if (null !== workInProgress) {
    if (0 === workInProgressSuspendedReason)
      var interruptedWork = workInProgress.return;
    else
      (interruptedWork = workInProgress),
        (lastContextDependency = currentlyRenderingFiber$1 = null),
        resetHooksOnUnwind(interruptedWork),
        (thenableState$1 = null),
        (thenableIndexCounter$1 = 0),
        (interruptedWork = workInProgress);
    for (; null !== interruptedWork; )
      unwindInterruptedWork(interruptedWork.alternate, interruptedWork),
        (interruptedWork = interruptedWork.return);
    workInProgress = null;
  }
}
function finalizeRender(lanes, finalizationTime) {
  enableComponentPerformanceTrack &&
    (0 !== (lanes & 127) &&
      enableComponentPerformanceTrack &&
      (blockingClampTime = finalizationTime),
    0 !== (lanes & 4194048) &&
      enableComponentPerformanceTrack &&
      (transitionClampTime = finalizationTime));
}
function prepareFreshStack(root, lanes) {
  if (enableComponentPerformanceTrack) {
    supportsUserTiming &&
      (console.timeStamp(
        "Blocking Track",
        0.003,
        0.003,
        "Blocking",
        "Scheduler \u269b",
        "primary-light"
      ),
      console.timeStamp(
        "Transition Track",
        0.003,
        0.003,
        "Transition",
        "Scheduler \u269b",
        "primary-light"
      ),
      console.timeStamp(
        "Suspense Track",
        0.003,
        0.003,
        "Suspense",
        "Scheduler \u269b",
        "primary-light"
      ),
      console.timeStamp(
        "Idle Track",
        0.003,
        0.003,
        "Idle",
        "Scheduler \u269b",
        "primary-light"
      ));
    var previousRenderStartTime = renderStartTime;
    enableComponentPerformanceTrack && (renderStartTime = now());
    if (0 !== workInProgressRootRenderLanes && 0 < previousRenderStartTime) {
      setCurrentTrackFromLanes(workInProgressRootRenderLanes);
      if (
        3 === workInProgressRootExitStatus ||
        4 === workInProgressRootExitStatus
      )
        logSuspendedRenderPhase(
          previousRenderStartTime,
          renderStartTime,
          lanes
        );
      else {
        var endTime = renderStartTime;
        !supportsUserTiming ||
          endTime <= previousRenderStartTime ||
          console.timeStamp(
            (lanes & 536870912) === lanes
              ? "Prewarm"
              : (lanes & 201326741) === lanes
                ? "Interrupted Hydration"
                : "Interrupted Render",
            previousRenderStartTime,
            endTime,
            currentTrack,
            "Scheduler \u269b",
            (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark"
          );
      }
      finalizeRender(workInProgressRootRenderLanes, renderStartTime);
    }
    if (0 !== (lanes & 127)) {
      previousRenderStartTime =
        0 <= blockingUpdateTime && blockingUpdateTime < blockingClampTime
          ? blockingClampTime
          : blockingUpdateTime;
      endTime =
        0 <= blockingEventTime && blockingEventTime < blockingClampTime
          ? blockingClampTime
          : blockingEventTime;
      var clampedRenderStartTime$218 =
        0 <= endTime
          ? endTime
          : 0 <= previousRenderStartTime
            ? previousRenderStartTime
            : renderStartTime;
      0 <= blockingSuspendedTime &&
        (setCurrentTrackFromLanes(2),
        logSuspendedWithDelayPhase(
          blockingSuspendedTime,
          clampedRenderStartTime$218,
          lanes
        ));
      clampedRenderStartTime$218 = blockingEventType;
      var eventIsRepeat = 0 < blockingEventRepeatTime,
        isSpawnedUpdate = 1 === blockingUpdateType,
        isPingedUpdate = 2 === blockingUpdateType,
        renderStartTime$jscomp$0 = renderStartTime;
      supportsUserTiming &&
        ((currentTrack = "Blocking"),
        0 < previousRenderStartTime
          ? previousRenderStartTime > renderStartTime$jscomp$0 &&
            (previousRenderStartTime = renderStartTime$jscomp$0)
          : (previousRenderStartTime = renderStartTime$jscomp$0),
        0 < endTime
          ? endTime > previousRenderStartTime &&
            (endTime = previousRenderStartTime)
          : (endTime = previousRenderStartTime),
        null !== clampedRenderStartTime$218 &&
          previousRenderStartTime > endTime &&
          console.timeStamp(
            eventIsRepeat
              ? "Consecutive"
              : "Event: " + clampedRenderStartTime$218,
            endTime,
            previousRenderStartTime,
            currentTrack,
            "Scheduler \u269b",
            eventIsRepeat ? "secondary-light" : "warning"
          ),
        renderStartTime$jscomp$0 > previousRenderStartTime &&
          console.timeStamp(
            isPingedUpdate
              ? "Promise Resolved"
              : isSpawnedUpdate
                ? "Cascading Update"
                : 5 < renderStartTime$jscomp$0 - previousRenderStartTime
                  ? "Update Blocked"
                  : "Update",
            previousRenderStartTime,
            renderStartTime$jscomp$0,
            currentTrack,
            "Scheduler \u269b",
            isSpawnedUpdate
              ? "error"
              : (lanes & 738197653) === lanes
                ? "tertiary-light"
                : "primary-light"
          ));
      blockingUpdateTime = -1.1;
      blockingUpdateType = 0;
      blockingSuspendedTime = -1.1;
      blockingEventRepeatTime = blockingEventTime;
      blockingEventTime = -1.1;
      blockingClampTime = now();
    }
    0 !== (lanes & 4194048) &&
      ((previousRenderStartTime =
        0 <= transitionStartTime && transitionStartTime < transitionClampTime
          ? transitionClampTime
          : transitionStartTime),
      (endTime =
        0 <= transitionUpdateTime && transitionUpdateTime < transitionClampTime
          ? transitionClampTime
          : transitionUpdateTime),
      (clampedRenderStartTime$218 =
        0 <= transitionEventTime && transitionEventTime < transitionClampTime
          ? transitionClampTime
          : transitionEventTime),
      (eventIsRepeat =
        0 <= clampedRenderStartTime$218
          ? clampedRenderStartTime$218
          : 0 <= endTime
            ? endTime
            : renderStartTime),
      0 <= transitionSuspendedTime &&
        (setCurrentTrackFromLanes(256),
        logSuspendedWithDelayPhase(
          transitionSuspendedTime,
          eventIsRepeat,
          lanes
        )),
      (eventIsRepeat = transitionEventType),
      (isSpawnedUpdate = 0 < transitionEventRepeatTime),
      (isPingedUpdate = 2 === transitionUpdateType),
      (renderStartTime$jscomp$0 = renderStartTime),
      supportsUserTiming &&
        ((currentTrack = "Transition"),
        0 < endTime
          ? endTime > renderStartTime$jscomp$0 &&
            (endTime = renderStartTime$jscomp$0)
          : (endTime = renderStartTime$jscomp$0),
        0 < previousRenderStartTime
          ? previousRenderStartTime > endTime &&
            (previousRenderStartTime = endTime)
          : (previousRenderStartTime = endTime),
        0 < clampedRenderStartTime$218
          ? clampedRenderStartTime$218 > previousRenderStartTime &&
            (clampedRenderStartTime$218 = previousRenderStartTime)
          : (clampedRenderStartTime$218 = previousRenderStartTime),
        previousRenderStartTime > clampedRenderStartTime$218 &&
          null !== eventIsRepeat &&
          console.timeStamp(
            isSpawnedUpdate ? "Consecutive" : "Event: " + eventIsRepeat,
            clampedRenderStartTime$218,
            previousRenderStartTime,
            currentTrack,
            "Scheduler \u269b",
            isSpawnedUpdate ? "secondary-light" : "warning"
          ),
        endTime > previousRenderStartTime &&
          console.timeStamp(
            "Action",
            previousRenderStartTime,
            endTime,
            currentTrack,
            "Scheduler \u269b",
            "primary-dark"
          ),
        renderStartTime$jscomp$0 > endTime &&
          console.timeStamp(
            isPingedUpdate
              ? "Promise Resolved"
              : 5 < renderStartTime$jscomp$0 - endTime
                ? "Update Blocked"
                : "Update",
            endTime,
            renderStartTime$jscomp$0,
            currentTrack,
            "Scheduler \u269b",
            "primary-light"
          )),
      (transitionUpdateTime = transitionStartTime = -1.1),
      (transitionUpdateType = 0),
      (transitionSuspendedTime = -1.1),
      (transitionEventRepeatTime = transitionEventTime),
      (transitionEventTime = -1.1),
      (transitionClampTime = now()));
  }
  previousRenderStartTime = root.timeoutHandle;
  -1 !== previousRenderStartTime &&
    ((root.timeoutHandle = -1), cancelTimeout(previousRenderStartTime));
  previousRenderStartTime = root.cancelPendingCommit;
  null !== previousRenderStartTime &&
    ((root.cancelPendingCommit = null), previousRenderStartTime());
  pendingEffectsLanes = 0;
  resetWorkInProgressStack();
  workInProgressRoot = root;
  workInProgress = previousRenderStartTime = createWorkInProgress(
    root.current,
    null
  );
  workInProgressRootRenderLanes = lanes;
  workInProgressSuspendedReason = 0;
  workInProgressThrownValue = null;
  workInProgressRootDidSkipSuspendedSiblings = !1;
  workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root, lanes);
  workInProgressRootDidAttachPingListener = !1;
  workInProgressSuspendedRetryLanes =
    workInProgressDeferredLane =
    workInProgressRootPingedLanes =
    workInProgressRootInterleavedUpdatedLanes =
    workInProgressRootSkippedLanes =
    workInProgressRootExitStatus =
      0;
  workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors =
    null;
  workInProgressRootDidIncludeRecursiveRenderUpdate = !1;
  0 !== (lanes & 8) && (lanes |= lanes & 32);
  endTime = root.entangledLanes;
  if (0 !== endTime)
    for (root = root.entanglements, endTime &= lanes; 0 < endTime; )
      (clampedRenderStartTime$218 = 31 - clz32(endTime)),
        (eventIsRepeat = 1 << clampedRenderStartTime$218),
        (lanes |= root[clampedRenderStartTime$218]),
        (endTime &= ~eventIsRepeat);
  entangledRenderLanes = lanes;
  finishQueueingConcurrentUpdates();
  return previousRenderStartTime;
}
function handleThrow(root, thrownValue) {
  currentlyRenderingFiber = null;
  ReactSharedInternals.H = ContextOnlyDispatcher;
  thrownValue === SuspenseException || thrownValue === SuspenseActionException
    ? ((thrownValue = getSuspendedThenable()),
      (workInProgressSuspendedReason = 3))
    : thrownValue === SuspenseyCommitException
      ? ((thrownValue = getSuspendedThenable()),
        (workInProgressSuspendedReason = 4))
      : (workInProgressSuspendedReason =
          thrownValue === SelectiveHydrationException
            ? 8
            : null !== thrownValue &&
                "object" === typeof thrownValue &&
                "function" === typeof thrownValue.then
              ? 6
              : 1);
  workInProgressThrownValue = thrownValue;
  var erroredWork = workInProgress;
  if (null === erroredWork)
    (workInProgressRootExitStatus = 1),
      logUncaughtError(
        root,
        createCapturedValueAtFiber(thrownValue, root.current)
      );
  else
    switch (
      (erroredWork.mode & 2 &&
        stopProfilerTimerIfRunningAndRecordDuration(erroredWork),
      markComponentRenderStopped(),
      workInProgressSuspendedReason)
    ) {
      case 1:
        null !== injectedProfilingHooks &&
          "function" === typeof injectedProfilingHooks.markComponentErrored &&
          injectedProfilingHooks.markComponentErrored(
            erroredWork,
            thrownValue,
            workInProgressRootRenderLanes
          );
        break;
      case 2:
      case 9:
      case 3:
      case 6:
      case 7:
        null !== injectedProfilingHooks &&
          "function" === typeof injectedProfilingHooks.markComponentSuspended &&
          injectedProfilingHooks.markComponentSuspended(
            erroredWork,
            thrownValue,
            workInProgressRootRenderLanes
          );
    }
}
function shouldRemainOnPreviousScreen() {
  var handler = suspenseHandlerStackCursor.current;
  return null === handler
    ? !0
    : (workInProgressRootRenderLanes & 4194048) ===
        workInProgressRootRenderLanes
      ? null === shellBoundary
        ? !0
        : !1
      : (workInProgressRootRenderLanes & 62914560) ===
            workInProgressRootRenderLanes ||
          0 !== (workInProgressRootRenderLanes & 536870912)
        ? handler === shellBoundary
        : !1;
}
function pushDispatcher() {
  var prevDispatcher = ReactSharedInternals.H;
  ReactSharedInternals.H = ContextOnlyDispatcher;
  return null === prevDispatcher ? ContextOnlyDispatcher : prevDispatcher;
}
function pushAsyncDispatcher() {
  var prevAsyncDispatcher = ReactSharedInternals.A;
  ReactSharedInternals.A = DefaultAsyncDispatcher;
  return prevAsyncDispatcher;
}
function renderDidSuspendDelayIfPossible() {
  workInProgressRootExitStatus = 4;
  workInProgressRootDidSkipSuspendedSiblings ||
    ((workInProgressRootRenderLanes & 4194048) !==
      workInProgressRootRenderLanes &&
      null !== suspenseHandlerStackCursor.current) ||
    (workInProgressRootIsPrerendering = !0);
  (0 === (workInProgressRootSkippedLanes & 134217727) &&
    0 === (workInProgressRootInterleavedUpdatedLanes & 134217727)) ||
    null === workInProgressRoot ||
    markRootSuspended(
      workInProgressRoot,
      workInProgressRootRenderLanes,
      workInProgressDeferredLane,
      !1
    );
}
function renderRootSync(root, lanes, shouldYieldForPrerendering) {
  var prevExecutionContext = executionContext;
  executionContext |= 2;
  var prevDispatcher = pushDispatcher(),
    prevAsyncDispatcher = pushAsyncDispatcher();
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    if (isDevToolsPresent) {
      var memoizedUpdaters = root.memoizedUpdaters;
      0 < memoizedUpdaters.size &&
        (restorePendingUpdaters(root, workInProgressRootRenderLanes),
        memoizedUpdaters.clear());
      movePendingFibersToMemoized(root, lanes);
    }
    workInProgressTransitions = null;
    prepareFreshStack(root, lanes);
  }
  markRenderStarted(lanes);
  lanes = !1;
  memoizedUpdaters = workInProgressRootExitStatus;
  a: do
    try {
      if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
        var unitOfWork = workInProgress,
          thrownValue = workInProgressThrownValue;
        switch (workInProgressSuspendedReason) {
          case 8:
            resetWorkInProgressStack();
            memoizedUpdaters = 6;
            break a;
          case 3:
          case 2:
          case 9:
          case 6:
            null === suspenseHandlerStackCursor.current && (lanes = !0);
            var reason = workInProgressSuspendedReason;
            workInProgressSuspendedReason = 0;
            workInProgressThrownValue = null;
            throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, reason);
            if (
              shouldYieldForPrerendering &&
              workInProgressRootIsPrerendering
            ) {
              memoizedUpdaters = 0;
              break a;
            }
            break;
          default:
            (reason = workInProgressSuspendedReason),
              (workInProgressSuspendedReason = 0),
              (workInProgressThrownValue = null),
              throwAndUnwindWorkLoop(root, unitOfWork, thrownValue, reason);
        }
      }
      workLoopSync();
      memoizedUpdaters = workInProgressRootExitStatus;
      break;
    } catch (thrownValue$223) {
      handleThrow(root, thrownValue$223);
    }
  while (1);
  lanes && root.shellSuspendCounter++;
  lastContextDependency = currentlyRenderingFiber$1 = null;
  executionContext = prevExecutionContext;
  ReactSharedInternals.H = prevDispatcher;
  ReactSharedInternals.A = prevAsyncDispatcher;
  markRenderStopped();
  null === workInProgress &&
    ((workInProgressRoot = null),
    (workInProgressRootRenderLanes = 0),
    finishQueueingConcurrentUpdates());
  return memoizedUpdaters;
}
function workLoopSync() {
  for (; null !== workInProgress; ) performUnitOfWork(workInProgress);
}
function renderRootConcurrent(root, lanes) {
  var prevExecutionContext = executionContext;
  executionContext |= 2;
  var prevDispatcher = pushDispatcher(),
    prevAsyncDispatcher = pushAsyncDispatcher();
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    if (isDevToolsPresent) {
      var memoizedUpdaters = root.memoizedUpdaters;
      0 < memoizedUpdaters.size &&
        (restorePendingUpdaters(root, workInProgressRootRenderLanes),
        memoizedUpdaters.clear());
      movePendingFibersToMemoized(root, lanes);
    }
    workInProgressTransitions = null;
    workInProgressRootRenderTargetTime = now$1() + 500;
    prepareFreshStack(root, lanes);
  } else
    workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root, lanes);
  markRenderStarted(lanes);
  a: do
    try {
      if (0 !== workInProgressSuspendedReason && null !== workInProgress)
        b: switch (
          ((lanes = workInProgress),
          (memoizedUpdaters = workInProgressThrownValue),
          workInProgressSuspendedReason)
        ) {
          case 1:
            workInProgressSuspendedReason = 0;
            workInProgressThrownValue = null;
            throwAndUnwindWorkLoop(root, lanes, memoizedUpdaters, 1);
            break;
          case 2:
          case 9:
            if (isThenableResolved(memoizedUpdaters)) {
              workInProgressSuspendedReason = 0;
              workInProgressThrownValue = null;
              replaySuspendedUnitOfWork(lanes);
              break;
            }
            lanes = function () {
              (2 !== workInProgressSuspendedReason &&
                9 !== workInProgressSuspendedReason) ||
                workInProgressRoot !== root ||
                (workInProgressSuspendedReason = 7);
              ensureRootIsScheduled(root);
            };
            memoizedUpdaters.then(lanes, lanes);
            break a;
          case 3:
            workInProgressSuspendedReason = 7;
            break a;
          case 4:
            workInProgressSuspendedReason = 5;
            break a;
          case 7:
            isThenableResolved(memoizedUpdaters)
              ? ((workInProgressSuspendedReason = 0),
                (workInProgressThrownValue = null),
                replaySuspendedUnitOfWork(lanes))
              : ((workInProgressSuspendedReason = 0),
                (workInProgressThrownValue = null),
                throwAndUnwindWorkLoop(root, lanes, memoizedUpdaters, 7));
            break;
          case 5:
            var resource = null;
            switch (workInProgress.tag) {
              case 26:
                resource = workInProgress.memoizedState;
              case 5:
              case 27:
                var hostFiber = workInProgress;
                if (
                  resource
                    ? preloadResource(resource)
                    : hostFiber.stateNode.complete
                ) {
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  var sibling = hostFiber.sibling;
                  if (null !== sibling) workInProgress = sibling;
                  else {
                    var returnFiber = hostFiber.return;
                    null !== returnFiber
                      ? ((workInProgress = returnFiber),
                        completeUnitOfWork(returnFiber))
                      : (workInProgress = null);
                  }
                  break b;
                }
            }
            workInProgressSuspendedReason = 0;
            workInProgressThrownValue = null;
            throwAndUnwindWorkLoop(root, lanes, memoizedUpdaters, 5);
            break;
          case 6:
            workInProgressSuspendedReason = 0;
            workInProgressThrownValue = null;
            throwAndUnwindWorkLoop(root, lanes, memoizedUpdaters, 6);
            break;
          case 8:
            resetWorkInProgressStack();
            workInProgressRootExitStatus = 6;
            break a;
          default:
            throw Error(formatProdErrorMessage(462));
        }
      workLoopConcurrentByScheduler();
      break;
    } catch (thrownValue$225) {
      handleThrow(root, thrownValue$225);
    }
  while (1);
  lastContextDependency = currentlyRenderingFiber$1 = null;
  ReactSharedInternals.H = prevDispatcher;
  ReactSharedInternals.A = prevAsyncDispatcher;
  executionContext = prevExecutionContext;
  if (null !== workInProgress)
    return (
      null !== injectedProfilingHooks &&
        "function" === typeof injectedProfilingHooks.markRenderYielded &&
        injectedProfilingHooks.markRenderYielded(),
      0
    );
  markRenderStopped();
  workInProgressRoot = null;
  workInProgressRootRenderLanes = 0;
  finishQueueingConcurrentUpdates();
  return workInProgressRootExitStatus;
}
function workLoopConcurrentByScheduler() {
  for (; null !== workInProgress && !shouldYield(); )
    performUnitOfWork(workInProgress);
}
function performUnitOfWork(unitOfWork) {
  var current = unitOfWork.alternate;
  0 !== (unitOfWork.mode & 2)
    ? (startProfilerTimer(unitOfWork),
      (current = beginWork(current, unitOfWork, entangledRenderLanes)),
      stopProfilerTimerIfRunningAndRecordDuration(unitOfWork))
    : (current = beginWork(current, unitOfWork, entangledRenderLanes));
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  null === current
    ? completeUnitOfWork(unitOfWork)
    : (workInProgress = current);
}
function replaySuspendedUnitOfWork(unitOfWork) {
  var next = unitOfWork;
  var current = next.alternate,
    isProfilingMode = 0 !== (next.mode & 2);
  isProfilingMode && startProfilerTimer(next);
  switch (next.tag) {
    case 15:
    case 0:
      var Component = next.type;
      var context = isContextProvider(Component)
        ? previousContext
        : contextStackCursor.current;
      context = getMaskedContext(next, context);
      current = replayFunctionComponent(
        current,
        next,
        next.pendingProps,
        Component,
        context,
        workInProgressRootRenderLanes
      );
      break;
    case 11:
      current = replayFunctionComponent(
        current,
        next,
        next.pendingProps,
        next.type.render,
        next.ref,
        workInProgressRootRenderLanes
      );
      break;
    case 5:
      resetHooksOnUnwind(next);
    default:
      unwindInterruptedWork(current, next),
        (next = workInProgress =
          resetWorkInProgress(next, entangledRenderLanes)),
        (current = beginWork(current, next, entangledRenderLanes));
  }
  isProfilingMode && stopProfilerTimerIfRunningAndRecordDuration(next);
  next = current;
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  null === next ? completeUnitOfWork(unitOfWork) : (workInProgress = next);
}
function throwAndUnwindWorkLoop(
  root,
  unitOfWork,
  thrownValue,
  suspendedReason
) {
  lastContextDependency = currentlyRenderingFiber$1 = null;
  resetHooksOnUnwind(unitOfWork);
  thenableState$1 = null;
  thenableIndexCounter$1 = 0;
  var returnFiber = unitOfWork.return;
  try {
    if (
      throwException(
        root,
        returnFiber,
        unitOfWork,
        thrownValue,
        workInProgressRootRenderLanes
      )
    ) {
      workInProgressRootExitStatus = 1;
      logUncaughtError(
        root,
        createCapturedValueAtFiber(thrownValue, root.current)
      );
      workInProgress = null;
      return;
    }
  } catch (error) {
    if (null !== returnFiber) throw ((workInProgress = returnFiber), error);
    workInProgressRootExitStatus = 1;
    logUncaughtError(
      root,
      createCapturedValueAtFiber(thrownValue, root.current)
    );
    workInProgress = null;
    return;
  }
  if (unitOfWork.flags & 32768) {
    if (isHydrating || 1 === suspendedReason) root = !0;
    else if (
      workInProgressRootIsPrerendering ||
      0 !== (workInProgressRootRenderLanes & 536870912)
    )
      root = !1;
    else if (
      ((workInProgressRootDidSkipSuspendedSiblings = root = !0),
      2 === suspendedReason ||
        9 === suspendedReason ||
        3 === suspendedReason ||
        6 === suspendedReason)
    )
      (suspendedReason = suspenseHandlerStackCursor.current),
        null !== suspendedReason &&
          13 === suspendedReason.tag &&
          (suspendedReason.flags |= 16384);
    unwindUnitOfWork(unitOfWork, root);
  } else completeUnitOfWork(unitOfWork);
}
function completeUnitOfWork(unitOfWork) {
  var completedWork = unitOfWork;
  do {
    if (0 !== (completedWork.flags & 32768)) {
      unwindUnitOfWork(
        completedWork,
        workInProgressRootDidSkipSuspendedSiblings
      );
      return;
    }
    var current = completedWork.alternate;
    unitOfWork = completedWork.return;
    startProfilerTimer(completedWork);
    current = completeWork(current, completedWork, entangledRenderLanes);
    0 !== (completedWork.mode & 2) &&
      stopProfilerTimerIfRunningAndRecordIncompleteDuration(completedWork);
    if (null !== current) {
      workInProgress = current;
      return;
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
function unwindUnitOfWork(unitOfWork, skipSiblings) {
  do {
    var next = unwindWork(unitOfWork.alternate, unitOfWork);
    if (null !== next) {
      next.flags &= 32767;
      workInProgress = next;
      return;
    }
    if (0 !== (unitOfWork.mode & 2)) {
      stopProfilerTimerIfRunningAndRecordIncompleteDuration(unitOfWork);
      next = unitOfWork.actualDuration;
      for (var child = unitOfWork.child; null !== child; )
        (next += child.actualDuration), (child = child.sibling);
      unitOfWork.actualDuration = next;
    }
    next = unitOfWork.return;
    null !== next &&
      ((next.flags |= 32768), (next.subtreeFlags = 0), (next.deletions = null));
    if (
      !skipSiblings &&
      ((unitOfWork = unitOfWork.sibling), null !== unitOfWork)
    ) {
      workInProgress = unitOfWork;
      return;
    }
    workInProgress = unitOfWork = next;
  } while (null !== unitOfWork);
  workInProgressRootExitStatus = 6;
  workInProgress = null;
}
function commitRoot(
  root,
  finishedWork,
  lanes,
  recoverableErrors,
  transitions,
  didIncludeRenderPhaseUpdate,
  spawnedLane,
  updatedLanes,
  suspendedRetryLanes,
  exitStatus,
  suspendedState,
  suspendedCommitReason,
  completedRenderStartTime,
  completedRenderEndTime
) {
  root.cancelPendingCommit = null;
  do flushPendingEffects();
  while (0 !== pendingEffectsStatus);
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
  enableComponentPerformanceTrack &&
    (setCurrentTrackFromLanes(lanes),
    2 === exitStatus
      ? logErroredRenderPhase(completedRenderStartTime, completedRenderEndTime)
      : null !== recoverableErrors
        ? !supportsUserTiming ||
          completedRenderEndTime <= completedRenderStartTime ||
          console.timeStamp(
            "Recovered",
            completedRenderStartTime,
            completedRenderEndTime,
            currentTrack,
            "Scheduler \u269b",
            "error"
          )
        : !supportsUserTiming ||
          completedRenderEndTime <= completedRenderStartTime ||
          console.timeStamp(
            (lanes & 536870912) === lanes
              ? "Prepared"
              : (lanes & 201326741) === lanes
                ? "Hydrated"
                : "Render",
            completedRenderStartTime,
            completedRenderEndTime,
            currentTrack,
            "Scheduler \u269b",
            (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark"
          ));
  null !== injectedProfilingHooks &&
    "function" === typeof injectedProfilingHooks.markCommitStarted &&
    injectedProfilingHooks.markCommitStarted(lanes);
  if (null === finishedWork) markCommitStopped();
  else {
    if (finishedWork === root.current) throw Error(formatProdErrorMessage(177));
    didIncludeRenderPhaseUpdate = finishedWork.lanes | finishedWork.childLanes;
    didIncludeRenderPhaseUpdate |= concurrentlyUpdatedLanes;
    markRootFinished(
      root,
      lanes,
      didIncludeRenderPhaseUpdate,
      spawnedLane,
      updatedLanes,
      suspendedRetryLanes
    );
    root === workInProgressRoot &&
      ((workInProgress = workInProgressRoot = null),
      (workInProgressRootRenderLanes = 0));
    pendingFinishedWork = finishedWork;
    pendingEffectsRoot = root;
    pendingEffectsLanes = lanes;
    pendingEffectsRemainingLanes = didIncludeRenderPhaseUpdate;
    pendingPassiveTransitions = transitions;
    pendingRecoverableErrors = recoverableErrors;
    pendingEffectsRenderEndTime = completedRenderEndTime;
    pendingSuspendedCommitReason = suspendedCommitReason;
    pendingDelayedCommitReason = 0;
    pendingSuspendedViewTransitionReason = null;
    (enableComponentPerformanceTrack && 0 !== finishedWork.actualDuration) ||
    0 !== (finishedWork.subtreeFlags & 10256) ||
    0 !== (finishedWork.flags & 10256)
      ? ((root.callbackNode = null),
        (root.callbackPriority = 0),
        scheduleCallback$1(NormalPriority$1, function () {
          enableComponentPerformanceTrack && (schedulerEvent = window.event);
          0 === pendingDelayedCommitReason && (pendingDelayedCommitReason = 2);
          flushPassiveEffects();
          return null;
        }))
      : ((root.callbackNode = null), (root.callbackPriority = 0));
    commitErrors = null;
    commitStartTime = now();
    enableComponentPerformanceTrack &&
      null !== suspendedCommitReason &&
      (!supportsUserTiming ||
        commitStartTime <= completedRenderEndTime ||
        console.timeStamp(
          suspendedCommitReason,
          completedRenderEndTime,
          commitStartTime,
          currentTrack,
          "Scheduler \u269b",
          "secondary-light"
        ));
    recoverableErrors = 0 !== (finishedWork.flags & 13878);
    if (0 !== (finishedWork.subtreeFlags & 13878) || recoverableErrors) {
      recoverableErrors = ReactSharedInternals.T;
      ReactSharedInternals.T = null;
      transitions = ReactDOMSharedInternals.p;
      ReactDOMSharedInternals.p = 2;
      spawnedLane = executionContext;
      executionContext |= 4;
      try {
        commitBeforeMutationEffects(root, finishedWork, lanes);
      } finally {
        (executionContext = spawnedLane),
          (ReactDOMSharedInternals.p = transitions),
          (ReactSharedInternals.T = recoverableErrors);
      }
    }
    pendingEffectsStatus = 1;
    flushMutationEffects();
    flushLayoutEffects();
    flushSpawnedWork();
  }
}
function flushMutationEffects() {
  if (1 === pendingEffectsStatus) {
    pendingEffectsStatus = 0;
    var root = pendingEffectsRoot,
      finishedWork = pendingFinishedWork,
      lanes = pendingEffectsLanes,
      rootMutationHasEffect = 0 !== (finishedWork.flags & 13878);
    if (0 !== (finishedWork.subtreeFlags & 13878) || rootMutationHasEffect) {
      rootMutationHasEffect = ReactSharedInternals.T;
      ReactSharedInternals.T = null;
      var previousPriority = ReactDOMSharedInternals.p;
      ReactDOMSharedInternals.p = 2;
      var prevExecutionContext = executionContext;
      executionContext |= 4;
      try {
        inProgressLanes = lanes;
        inProgressRoot = root;
        resetComponentEffectTimers();
        commitMutationEffectsOnFiber(finishedWork, root, lanes);
        inProgressRoot = inProgressLanes = null;
        lanes = selectionInformation;
        var curFocusedElem = getActiveElementDeep(root.containerInfo),
          priorFocusedElem = lanes.focusedElem,
          priorSelectionRange = lanes.selectionRange;
        if (
          curFocusedElem !== priorFocusedElem &&
          priorFocusedElem &&
          priorFocusedElem.ownerDocument &&
          containsNode(
            priorFocusedElem.ownerDocument.documentElement,
            priorFocusedElem
          )
        ) {
          if (
            null !== priorSelectionRange &&
            hasSelectionCapabilities(priorFocusedElem)
          ) {
            var start = priorSelectionRange.start,
              end = priorSelectionRange.end;
            void 0 === end && (end = start);
            if ("selectionStart" in priorFocusedElem)
              (priorFocusedElem.selectionStart = start),
                (priorFocusedElem.selectionEnd = Math.min(
                  end,
                  priorFocusedElem.value.length
                ));
            else {
              var doc = priorFocusedElem.ownerDocument || document,
                win = (doc && doc.defaultView) || window;
              if (win.getSelection) {
                var selection = win.getSelection(),
                  length = priorFocusedElem.textContent.length,
                  start$jscomp$0 = Math.min(priorSelectionRange.start, length),
                  end$jscomp$0 =
                    void 0 === priorSelectionRange.end
                      ? start$jscomp$0
                      : Math.min(priorSelectionRange.end, length);
                !selection.extend &&
                  start$jscomp$0 > end$jscomp$0 &&
                  ((curFocusedElem = end$jscomp$0),
                  (end$jscomp$0 = start$jscomp$0),
                  (start$jscomp$0 = curFocusedElem));
                var startMarker = getNodeForCharacterOffset(
                    priorFocusedElem,
                    start$jscomp$0
                  ),
                  endMarker = getNodeForCharacterOffset(
                    priorFocusedElem,
                    end$jscomp$0
                  );
                if (
                  startMarker &&
                  endMarker &&
                  (1 !== selection.rangeCount ||
                    selection.anchorNode !== startMarker.node ||
                    selection.anchorOffset !== startMarker.offset ||
                    selection.focusNode !== endMarker.node ||
                    selection.focusOffset !== endMarker.offset)
                ) {
                  var range = doc.createRange();
                  range.setStart(startMarker.node, startMarker.offset);
                  selection.removeAllRanges();
                  start$jscomp$0 > end$jscomp$0
                    ? (selection.addRange(range),
                      selection.extend(endMarker.node, endMarker.offset))
                    : (range.setEnd(endMarker.node, endMarker.offset),
                      selection.addRange(range));
                }
              }
            }
          }
          doc = [];
          for (
            selection = priorFocusedElem;
            (selection = selection.parentNode);

          )
            1 === selection.nodeType &&
              doc.push({
                element: selection,
                left: selection.scrollLeft,
                top: selection.scrollTop
              });
          "function" === typeof priorFocusedElem.focus &&
            priorFocusedElem.focus();
          for (
            priorFocusedElem = 0;
            priorFocusedElem < doc.length;
            priorFocusedElem++
          ) {
            var info = doc[priorFocusedElem];
            info.element.scrollLeft = info.left;
            info.element.scrollTop = info.top;
          }
        }
        _enabled = !!eventsEnabled;
        selectionInformation = eventsEnabled = null;
      } finally {
        (executionContext = prevExecutionContext),
          (ReactDOMSharedInternals.p = previousPriority),
          (ReactSharedInternals.T = rootMutationHasEffect);
      }
    }
    root.current = finishedWork;
    pendingEffectsStatus = 2;
  }
}
function flushLayoutEffects() {
  if (2 === pendingEffectsStatus) {
    pendingEffectsStatus = 0;
    if (enableComponentPerformanceTrack) {
      var suspendedViewTransitionReason = pendingSuspendedViewTransitionReason;
      null !== suspendedViewTransitionReason &&
        ((commitStartTime = now()),
        !supportsUserTiming ||
          commitStartTime <= commitEndTime ||
          console.timeStamp(
            suspendedViewTransitionReason,
            commitEndTime,
            commitStartTime,
            currentTrack,
            "Scheduler \u269b",
            "secondary-light"
          ));
    }
    suspendedViewTransitionReason = pendingEffectsRoot;
    var finishedWork = pendingFinishedWork,
      lanes = pendingEffectsLanes,
      cleanUpIndicator = suspendedViewTransitionReason.pendingIndicator;
    if (
      null !== cleanUpIndicator &&
      0 === suspendedViewTransitionReason.indicatorLanes
    ) {
      var prevTransition = ReactSharedInternals.T;
      ReactSharedInternals.T = null;
      var previousPriority = ReactDOMSharedInternals.p;
      ReactDOMSharedInternals.p = 2;
      var prevExecutionContext = executionContext;
      executionContext |= 4;
      suspendedViewTransitionReason.pendingIndicator = null;
      try {
        cleanUpIndicator();
      } catch (x) {
        reportGlobalError(x);
      } finally {
        (executionContext = prevExecutionContext),
          (ReactDOMSharedInternals.p = previousPriority),
          (ReactSharedInternals.T = prevTransition);
      }
    }
    cleanUpIndicator = 0 !== (finishedWork.flags & 8772);
    if (0 !== (finishedWork.subtreeFlags & 8772) || cleanUpIndicator) {
      cleanUpIndicator = ReactSharedInternals.T;
      ReactSharedInternals.T = null;
      prevTransition = ReactDOMSharedInternals.p;
      ReactDOMSharedInternals.p = 2;
      previousPriority = executionContext;
      executionContext |= 4;
      try {
        null !== injectedProfilingHooks &&
          "function" ===
            typeof injectedProfilingHooks.markLayoutEffectsStarted &&
          injectedProfilingHooks.markLayoutEffectsStarted(lanes),
          (inProgressLanes = lanes),
          (inProgressRoot = suspendedViewTransitionReason),
          resetComponentEffectTimers(),
          commitLayoutEffectOnFiber(
            suspendedViewTransitionReason,
            finishedWork.alternate,
            finishedWork
          ),
          (inProgressRoot = inProgressLanes = null),
          null !== injectedProfilingHooks &&
            "function" ===
              typeof injectedProfilingHooks.markLayoutEffectsStopped &&
            injectedProfilingHooks.markLayoutEffectsStopped();
      } finally {
        (executionContext = previousPriority),
          (ReactDOMSharedInternals.p = prevTransition),
          (ReactSharedInternals.T = cleanUpIndicator);
      }
    }
    suspendedViewTransitionReason = pendingEffectsRenderEndTime;
    finishedWork = pendingSuspendedCommitReason;
    enableComponentPerformanceTrack &&
      ((commitEndTime = now()),
      (suspendedViewTransitionReason =
        null === finishedWork
          ? suspendedViewTransitionReason
          : commitStartTime),
      (finishedWork = commitEndTime),
      (lanes = 1 === pendingDelayedCommitReason),
      null !== commitErrors
        ? logCommitErrored(suspendedViewTransitionReason, finishedWork)
        : !supportsUserTiming ||
          finishedWork <= suspendedViewTransitionReason ||
          console.timeStamp(
            lanes ? "Commit Interrupted View Transition" : "Commit",
            suspendedViewTransitionReason,
            finishedWork,
            currentTrack,
            "Scheduler \u269b",
            lanes ? "error" : "secondary-dark"
          ));
    pendingEffectsStatus = 3;
  }
}
function flushSpawnedWork() {
  if (4 === pendingEffectsStatus || 3 === pendingEffectsStatus) {
    if (enableComponentPerformanceTrack && 4 === pendingEffectsStatus) {
      var startViewTransitionStartTime = commitEndTime;
      commitEndTime = now();
      var abortedViewTransition = 1 === pendingDelayedCommitReason;
      !supportsUserTiming ||
        commitEndTime <= startViewTransitionStartTime ||
        console.timeStamp(
          abortedViewTransition
            ? "Interrupted View Transition"
            : "Starting Animation",
          startViewTransitionStartTime,
          commitEndTime,
          currentTrack,
          "Scheduler \u269b",
          abortedViewTransition ? " error" : "secondary-light"
        );
      1 !== pendingDelayedCommitReason && (pendingDelayedCommitReason = 3);
    }
    pendingEffectsStatus = 0;
    requestPaint();
    startViewTransitionStartTime = pendingEffectsRoot;
    var finishedWork = pendingFinishedWork;
    abortedViewTransition = pendingEffectsLanes;
    var recoverableErrors = pendingRecoverableErrors,
      rootDidHavePassiveEffects =
        (enableComponentPerformanceTrack &&
          0 !== finishedWork.actualDuration) ||
        0 !== (finishedWork.subtreeFlags & 10256) ||
        0 !== (finishedWork.flags & 10256);
    rootDidHavePassiveEffects
      ? (pendingEffectsStatus = 5)
      : ((pendingEffectsStatus = 0),
        (pendingFinishedWork = pendingEffectsRoot = null),
        releaseRootPooledCache(
          startViewTransitionStartTime,
          startViewTransitionStartTime.pendingLanes
        ));
    var remainingLanes = startViewTransitionStartTime.pendingLanes;
    0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
    remainingLanes = lanesToEventPriority(abortedViewTransition);
    finishedWork = finishedWork.stateNode;
    if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
      try {
        var didError = 128 === (finishedWork.current.flags & 128);
        switch (remainingLanes) {
          case 2:
            var schedulerPriority = ImmediatePriority;
            break;
          case 8:
            schedulerPriority = UserBlockingPriority;
            break;
          case 32:
            schedulerPriority = NormalPriority$1;
            break;
          case 268435456:
            schedulerPriority = IdlePriority;
            break;
          default:
            schedulerPriority = NormalPriority$1;
        }
        injectedHook.onCommitFiberRoot(
          rendererID,
          finishedWork,
          schedulerPriority,
          didError
        );
      } catch (err) {}
    isDevToolsPresent && startViewTransitionStartTime.memoizedUpdaters.clear();
    if (null !== recoverableErrors) {
      didError = ReactSharedInternals.T;
      schedulerPriority = ReactDOMSharedInternals.p;
      ReactDOMSharedInternals.p = 2;
      ReactSharedInternals.T = null;
      try {
        var onRecoverableError =
          startViewTransitionStartTime.onRecoverableError;
        for (
          finishedWork = 0;
          finishedWork < recoverableErrors.length;
          finishedWork++
        ) {
          var recoverableError = recoverableErrors[finishedWork];
          onRecoverableError(recoverableError.value, {
            componentStack: recoverableError.stack
          });
        }
      } finally {
        (ReactSharedInternals.T = didError),
          (ReactDOMSharedInternals.p = schedulerPriority);
      }
    }
    0 !== (pendingEffectsLanes & 3) &&
      0 !== startViewTransitionStartTime.tag &&
      flushPendingEffects();
    ensureRootIsScheduled(startViewTransitionStartTime);
    remainingLanes = startViewTransitionStartTime.pendingLanes;
    0 !== (abortedViewTransition & 261930) && 0 !== (remainingLanes & 42)
      ? ((nestedUpdateScheduled = !0),
        startViewTransitionStartTime === rootWithNestedUpdates
          ? nestedUpdateCount++
          : ((nestedUpdateCount = 0),
            (rootWithNestedUpdates = startViewTransitionStartTime)))
      : (nestedUpdateCount = 0);
    enableComponentPerformanceTrack &&
      (rootDidHavePassiveEffects ||
        finalizeRender(abortedViewTransition, commitEndTime));
    if (hasScheduledReplayAttempt) {
      hasScheduledReplayAttempt = !1;
      null !== queuedFocus &&
        attemptReplayContinuousQueuedEvent(queuedFocus) &&
        (queuedFocus = null);
      null !== queuedDrag &&
        attemptReplayContinuousQueuedEvent(queuedDrag) &&
        (queuedDrag = null);
      null !== queuedMouse &&
        attemptReplayContinuousQueuedEvent(queuedMouse) &&
        (queuedMouse = null);
      queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
      queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
      for (
        onRecoverableError = 0;
        onRecoverableError < queuedChangeEventTargets.length;
        onRecoverableError++
      )
        (recoverableError = queuedChangeEventTargets[onRecoverableError]),
          "INPUT" === recoverableError.nodeName
            ? "checkbox" === recoverableError.type ||
              "radio" === recoverableError.type
              ? (recoverableError.dispatchEvent(
                  new ("function" === typeof PointerEvent
                    ? PointerEvent
                    : Event)("click", { bubbles: !0 })
                ),
                recoverableError.dispatchEvent(
                  new Event("input", { bubbles: !0 })
                ))
              : "function" === typeof InputEvent &&
                recoverableError.dispatchEvent(
                  new InputEvent("input", { bubbles: !0 })
                )
            : "TEXTAREA" === recoverableError.nodeName &&
              "function" === typeof InputEvent &&
              recoverableError.dispatchEvent(
                new InputEvent("input", { bubbles: !0 })
              ),
          recoverableError.dispatchEvent(new Event("change", { bubbles: !0 }));
      queuedChangeEventTargets.length = 0;
    }
    flushSyncWorkAcrossRoots_impl(0, !1);
    markCommitStopped();
  }
}
function releaseRootPooledCache(root, remainingLanes) {
  0 === (root.pooledCacheLanes &= remainingLanes) &&
    ((remainingLanes = root.pooledCache),
    null != remainingLanes &&
      ((root.pooledCache = null), releaseCache(remainingLanes)));
}
function flushPendingEffects() {
  flushMutationEffects();
  flushLayoutEffects();
  flushSpawnedWork();
  return flushPassiveEffects();
}
function flushPassiveEffects() {
  if (5 !== pendingEffectsStatus) return !1;
  var root = pendingEffectsRoot,
    remainingLanes = pendingEffectsRemainingLanes;
  pendingEffectsRemainingLanes = 0;
  var renderPriority = lanesToEventPriority(pendingEffectsLanes),
    prevTransition = ReactSharedInternals.T,
    previousPriority = ReactDOMSharedInternals.p;
  try {
    ReactDOMSharedInternals.p = 32 > renderPriority ? 32 : renderPriority;
    ReactSharedInternals.T = null;
    var transitions = pendingPassiveTransitions;
    pendingPassiveTransitions = null;
    renderPriority = pendingEffectsRoot;
    var lanes = pendingEffectsLanes;
    pendingEffectsStatus = 0;
    pendingFinishedWork = pendingEffectsRoot = null;
    pendingEffectsLanes = 0;
    if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(331));
    enableComponentPerformanceTrack && setCurrentTrackFromLanes(lanes);
    var passiveEffectStartTime = 0;
    enableComponentPerformanceTrack &&
      ((commitErrors = null),
      (passiveEffectStartTime = now$1()),
      3 === pendingDelayedCommitReason
        ? !supportsUserTiming ||
          passiveEffectStartTime <= commitEndTime ||
          console.timeStamp(
            "Animating",
            commitEndTime,
            passiveEffectStartTime,
            currentTrack,
            "Scheduler \u269b",
            "secondary-dark"
          )
        : !supportsUserTiming ||
          passiveEffectStartTime <= commitEndTime ||
          console.timeStamp(
            2 === pendingDelayedCommitReason ? "Waiting for Paint" : "Waiting",
            commitEndTime,
            passiveEffectStartTime,
            currentTrack,
            "Scheduler \u269b",
            "secondary-light"
          ));
    null !== injectedProfilingHooks &&
      "function" === typeof injectedProfilingHooks.markPassiveEffectsStarted &&
      injectedProfilingHooks.markPassiveEffectsStarted(lanes);
    var prevExecutionContext = executionContext;
    executionContext |= 4;
    var finishedWork = renderPriority.current;
    resetComponentEffectTimers();
    commitPassiveUnmountOnFiber(finishedWork);
    var finishedWork$jscomp$0 = renderPriority.current;
    finishedWork = pendingEffectsRenderEndTime;
    resetComponentEffectTimers();
    commitPassiveMountOnFiber(
      renderPriority,
      finishedWork$jscomp$0,
      lanes,
      transitions,
      enableComponentPerformanceTrack ? finishedWork : 0
    );
    null !== injectedProfilingHooks &&
      "function" === typeof injectedProfilingHooks.markPassiveEffectsStopped &&
      injectedProfilingHooks.markPassiveEffectsStopped();
    executionContext = prevExecutionContext;
    if (enableComponentPerformanceTrack) {
      var passiveEffectsEndTime = now$1();
      finishedWork$jscomp$0 = passiveEffectStartTime;
      null !== commitErrors
        ? logCommitErrored(finishedWork$jscomp$0, passiveEffectsEndTime)
        : !supportsUserTiming ||
          passiveEffectsEndTime <= finishedWork$jscomp$0 ||
          console.timeStamp(
            "Remaining Effects",
            finishedWork$jscomp$0,
            passiveEffectsEndTime,
            currentTrack,
            "Scheduler \u269b",
            "secondary-dark"
          );
      finalizeRender(lanes, passiveEffectsEndTime);
    }
    flushSyncWorkAcrossRoots_impl(0, !1);
    if (
      injectedHook &&
      "function" === typeof injectedHook.onPostCommitFiberRoot
    )
      try {
        injectedHook.onPostCommitFiberRoot(rendererID, renderPriority);
      } catch (err) {}
    var stateNode = renderPriority.current.stateNode;
    stateNode.effectDuration = 0;
    stateNode.passiveEffectDuration = 0;
    return !0;
  } finally {
    (ReactDOMSharedInternals.p = previousPriority),
      (ReactSharedInternals.T = prevTransition),
      releaseRootPooledCache(root, remainingLanes);
  }
}
function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
  sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
  enableComponentPerformanceTrack && recordEffectError(sourceFiber);
  sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2);
  rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2);
  null !== rootFiber &&
    (markRootUpdated$1(rootFiber, 2), ensureRootIsScheduled(rootFiber));
}
function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
  if (3 === sourceFiber.tag)
    captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
  else
    for (; null !== nearestMountedAncestor; ) {
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
          enableComponentPerformanceTrack && recordEffectError(sourceFiber);
          error = createClassErrorUpdate(2);
          instance = enqueueUpdate(nearestMountedAncestor, error, 2);
          null !== instance &&
            (initializeClassErrorUpdate(
              error,
              instance,
              nearestMountedAncestor,
              sourceFiber
            ),
            markRootUpdated$1(instance, 2),
            ensureRootIsScheduled(instance));
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
    (pingCache = pingSuspendedRoot.bind(null, root, wakeable, lanes)),
    isDevToolsPresent && restorePendingUpdaters(root, lanes),
    wakeable.then(pingCache, pingCache));
}
function pingSuspendedRoot(root, wakeable, pingedLanes) {
  var pingCache = root.pingCache;
  null !== pingCache && pingCache.delete(wakeable);
  root.pingedLanes |= root.suspendedLanes & pingedLanes;
  root.warmLanes &= ~pingedLanes;
  enableComponentPerformanceTrack &&
    enableComponentPerformanceTrack &&
    (0 !== (pingedLanes & 127)
      ? 0 > blockingUpdateTime &&
        ((blockingClampTime = blockingUpdateTime = now()),
        (blockingUpdateType = 2))
      : 0 !== (pingedLanes & 4194048) &&
        0 > transitionUpdateTime &&
        ((transitionClampTime = transitionUpdateTime = now()),
        (transitionUpdateType = 2)));
  workInProgressRoot === root &&
    (workInProgressRootRenderLanes & pingedLanes) === pingedLanes &&
    (4 === workInProgressRootExitStatus ||
    (3 === workInProgressRootExitStatus &&
      (workInProgressRootRenderLanes & 62914560) ===
        workInProgressRootRenderLanes &&
      300 > now$1() - globalMostRecentFallbackTime)
      ? 0 === (executionContext & 2) && prepareFreshStack(root, 0)
      : (workInProgressRootPingedLanes |= pingedLanes),
    workInProgressSuspendedRetryLanes === workInProgressRootRenderLanes &&
      (workInProgressSuspendedRetryLanes = 0));
  ensureRootIsScheduled(root);
}
function retryTimedOutBoundary(boundaryFiber, retryLane) {
  0 === retryLane &&
    (retryLane = 0 === (boundaryFiber.mode & 1) ? 2 : claimNextRetryLane());
  boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
  null !== boundaryFiber &&
    (markRootUpdated$1(boundaryFiber, retryLane),
    ensureRootIsScheduled(boundaryFiber));
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
    case 31:
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
function restorePendingUpdaters(root, lanes) {
  isDevToolsPresent &&
    root.memoizedUpdaters.forEach(function (schedulingFiber) {
      addFiberToLanesMap(root, schedulingFiber, lanes);
    });
}
function scheduleCallback$1(priorityLevel, callback) {
  return scheduleCallback$3(priorityLevel, callback);
}
var firstScheduledRoot = null,
  lastScheduledRoot = null,
  didScheduleMicrotask = !1,
  mightHavePendingSyncWork = !1,
  isFlushingWork = !1,
  currentEventTransitionLane = 0;
function ensureRootIsScheduled(root) {
  root !== lastScheduledRoot &&
    null === root.next &&
    (null === lastScheduledRoot
      ? (firstScheduledRoot = lastScheduledRoot = root)
      : (lastScheduledRoot = lastScheduledRoot.next = root));
  mightHavePendingSyncWork = !0;
  didScheduleMicrotask ||
    ((didScheduleMicrotask = !0), scheduleImmediateRootScheduleTask());
}
function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
  if (!isFlushingWork && mightHavePendingSyncWork) {
    isFlushingWork = !0;
    do {
      var didPerformSomeWork = !1;
      for (var root$231 = firstScheduledRoot; null !== root$231; ) {
        if (!onlyLegacy || 0 === root$231.tag)
          if (0 !== syncTransitionLanes) {
            var pendingLanes = root$231.pendingLanes;
            if (0 === pendingLanes) var JSCompiler_inline_result = 0;
            else {
              var suspendedLanes = root$231.suspendedLanes,
                pingedLanes = root$231.pingedLanes;
              JSCompiler_inline_result =
                (1 << (31 - clz32(42 | syncTransitionLanes) + 1)) - 1;
              JSCompiler_inline_result &=
                pendingLanes & ~(suspendedLanes & ~pingedLanes);
              JSCompiler_inline_result =
                JSCompiler_inline_result & 201326741
                  ? (JSCompiler_inline_result & 201326741) | 1
                  : JSCompiler_inline_result
                    ? JSCompiler_inline_result | 2
                    : 0;
            }
            0 !== JSCompiler_inline_result &&
              ((didPerformSomeWork = !0),
              performSyncWorkOnRoot(root$231, JSCompiler_inline_result));
          } else
            (JSCompiler_inline_result = workInProgressRootRenderLanes),
              (JSCompiler_inline_result = getNextLanes(
                root$231,
                root$231 === workInProgressRoot ? JSCompiler_inline_result : 0,
                null !== root$231.cancelPendingCommit ||
                  -1 !== root$231.timeoutHandle
              )),
              0 === (JSCompiler_inline_result & 3) ||
                checkIfRootIsPrerendering(root$231, JSCompiler_inline_result) ||
                ((didPerformSomeWork = !0),
                performSyncWorkOnRoot(root$231, JSCompiler_inline_result));
        root$231 = root$231.next;
      }
    } while (didPerformSomeWork);
    isFlushingWork = !1;
  }
}
function processRootScheduleInImmediateTask() {
  enableComponentPerformanceTrack && (schedulerEvent = window.event);
  processRootScheduleInMicrotask();
}
function processRootScheduleInMicrotask() {
  mightHavePendingSyncWork = didScheduleMicrotask = !1;
  var syncTransitionLanes = 0;
  0 !== currentEventTransitionLane &&
    (syncTransitionLanes = shouldAttemptEagerTransition()
      ? currentEventTransitionLane
      : 32);
  for (
    var currentTime = now$1(), prev = null, root = firstScheduledRoot;
    null !== root;

  ) {
    var next = root.next,
      nextLanes = scheduleTaskForRootDuringMicrotask(root, currentTime);
    if (0 === nextLanes)
      (root.next = null),
        null === prev ? (firstScheduledRoot = next) : (prev.next = next),
        null === next && (lastScheduledRoot = prev);
    else if (
      ((prev = root), 0 !== syncTransitionLanes || 0 !== (nextLanes & 3))
    )
      mightHavePendingSyncWork = !0;
    root = next;
  }
  (0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus) ||
    flushSyncWorkAcrossRoots_impl(syncTransitionLanes, !1);
  if (0 !== currentEventTransitionLane) {
    currentEventTransitionLane = 0;
    if (
      needsIsomorphicIndicator &&
      null != isomorphicDefaultTransitionIndicator &&
      null === pendingIsomorphicIndicator
    )
      try {
        pendingIsomorphicIndicator =
          isomorphicDefaultTransitionIndicator() || noop$1;
      } catch (x) {
        (pendingIsomorphicIndicator = noop$1), reportGlobalError(x);
      }
    for (
      syncTransitionLanes = firstScheduledRoot;
      null !== syncTransitionLanes;

    ) {
      if (
        0 !== syncTransitionLanes.indicatorLanes &&
        null === syncTransitionLanes.pendingIndicator
      )
        if (null !== pendingIsomorphicIndicator)
          (currentTime = syncTransitionLanes),
            pendingEntangledRoots++,
            (currentTime.pendingIndicator = releaseIsomorphicIndicator);
        else
          try {
            var onDefaultTransitionIndicator =
              syncTransitionLanes.onDefaultTransitionIndicator;
            syncTransitionLanes.pendingIndicator =
              onDefaultTransitionIndicator() || noop$1;
          } catch (x) {
            (syncTransitionLanes.pendingIndicator = noop$1),
              reportGlobalError(x);
          }
      syncTransitionLanes = syncTransitionLanes.next;
    }
  }
}
function scheduleTaskForRootDuringMicrotask(root, currentTime) {
  for (
    var suspendedLanes = root.suspendedLanes,
      pingedLanes = root.pingedLanes,
      expirationTimes = root.expirationTimes,
      lanes = root.pendingLanes & -62914561;
    0 < lanes;

  ) {
    var index$5 = 31 - clz32(lanes),
      lane = 1 << index$5,
      expirationTime = expirationTimes[index$5];
    if (-1 === expirationTime) {
      if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes))
        expirationTimes[index$5] = computeExpirationTime(lane, currentTime);
    } else expirationTime <= currentTime && (root.expiredLanes |= lane);
    lanes &= ~lane;
  }
  currentTime = workInProgressRoot;
  suspendedLanes = workInProgressRootRenderLanes;
  suspendedLanes = getNextLanes(
    root,
    root === currentTime ? suspendedLanes : 0,
    null !== root.cancelPendingCommit || -1 !== root.timeoutHandle
  );
  pingedLanes = root.callbackNode;
  if (
    0 === suspendedLanes ||
    (root === currentTime &&
      (2 === workInProgressSuspendedReason ||
        9 === workInProgressSuspendedReason)) ||
    null !== root.cancelPendingCommit
  )
    return (
      null !== pingedLanes &&
        null !== pingedLanes &&
        cancelCallback$1(pingedLanes),
      (root.callbackNode = null),
      (root.callbackPriority = 0)
    );
  if (
    0 === (suspendedLanes & 3) ||
    checkIfRootIsPrerendering(root, suspendedLanes)
  ) {
    currentTime = suspendedLanes & -suspendedLanes;
    if (currentTime === root.callbackPriority) return currentTime;
    null !== pingedLanes && cancelCallback$1(pingedLanes);
    switch (lanesToEventPriority(suspendedLanes)) {
      case 2:
      case 8:
        suspendedLanes = UserBlockingPriority;
        break;
      case 32:
        suspendedLanes = NormalPriority$1;
        break;
      case 268435456:
        suspendedLanes = IdlePriority;
        break;
      default:
        suspendedLanes = NormalPriority$1;
    }
    pingedLanes = performWorkOnRootViaSchedulerTask.bind(null, root);
    suspendedLanes = scheduleCallback$3(suspendedLanes, pingedLanes);
    root.callbackPriority = currentTime;
    root.callbackNode = suspendedLanes;
    return currentTime;
  }
  null !== pingedLanes && null !== pingedLanes && cancelCallback$1(pingedLanes);
  root.callbackPriority = 2;
  root.callbackNode = null;
  return 2;
}
function performWorkOnRootViaSchedulerTask(root, didTimeout) {
  nestedUpdateScheduled = currentUpdateIsNested = !1;
  enableComponentPerformanceTrack && (schedulerEvent = window.event);
  if (0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus)
    return (root.callbackNode = null), (root.callbackPriority = 0), null;
  var originalCallbackNode = root.callbackNode;
  0 === pendingDelayedCommitReason && (pendingDelayedCommitReason = 2);
  if (flushPendingEffects() && root.callbackNode !== originalCallbackNode)
    return null;
  var workInProgressRootRenderLanes$jscomp$0 = workInProgressRootRenderLanes;
  workInProgressRootRenderLanes$jscomp$0 = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes$jscomp$0 : 0,
    null !== root.cancelPendingCommit || -1 !== root.timeoutHandle
  );
  if (0 === workInProgressRootRenderLanes$jscomp$0) return null;
  performWorkOnRoot(root, workInProgressRootRenderLanes$jscomp$0, didTimeout);
  scheduleTaskForRootDuringMicrotask(root, now$1());
  return null != root.callbackNode && root.callbackNode === originalCallbackNode
    ? performWorkOnRootViaSchedulerTask.bind(null, root)
    : null;
}
function performSyncWorkOnRoot(root, lanes) {
  if (flushPendingEffects()) return null;
  currentUpdateIsNested = nestedUpdateScheduled;
  nestedUpdateScheduled = !1;
  performWorkOnRoot(root, lanes, !0);
}
function scheduleImmediateRootScheduleTask() {
  scheduleMicrotask(function () {
    0 !== (executionContext & 6)
      ? scheduleCallback$3(
          ImmediatePriority,
          processRootScheduleInImmediateTask
        )
      : processRootScheduleInMicrotask();
  });
}
function requestTransitionLane() {
  if (0 === currentEventTransitionLane) {
    var actionScopeLane = currentEntangledLane;
    0 === actionScopeLane &&
      ((actionScopeLane = nextTransitionUpdateLane),
      (nextTransitionUpdateLane <<= 1),
      0 === (nextTransitionUpdateLane & 261888) &&
        (nextTransitionUpdateLane = 256));
    currentEventTransitionLane = actionScopeLane;
  }
  return currentEventTransitionLane;
}
function coerceFormActionProp(actionProp) {
  return null == actionProp ||
    "symbol" === typeof actionProp ||
    "boolean" === typeof actionProp
    ? null
    : "function" === typeof actionProp
      ? actionProp
      : sanitizeURL("" + actionProp);
}
function createFormDataWithSubmitter(form, submitter) {
  var temp = submitter.ownerDocument.createElement("input");
  temp.name = submitter.name;
  temp.value = submitter.value;
  form.id && temp.setAttribute("form", form.id);
  submitter.parentNode.insertBefore(temp, submitter);
  form = new FormData(form);
  temp.parentNode.removeChild(temp);
  return form;
}
function extractEvents$2(
  dispatchQueue,
  domEventName,
  maybeTargetInst,
  nativeEvent,
  nativeEventTarget
) {
  if (
    "submit" === domEventName &&
    maybeTargetInst &&
    maybeTargetInst.stateNode === nativeEventTarget
  ) {
    var action = coerceFormActionProp(
        (nativeEventTarget[internalPropsKey] || null).action
      ),
      submitter = nativeEvent.submitter;
    submitter &&
      ((domEventName = (domEventName = submitter[internalPropsKey] || null)
        ? coerceFormActionProp(domEventName.formAction)
        : submitter.getAttribute("formAction")),
      null !== domEventName && ((action = domEventName), (submitter = null)));
    var event = new SyntheticEvent(
      "action",
      "action",
      null,
      nativeEvent,
      nativeEventTarget
    );
    dispatchQueue.push({
      event: event,
      listeners: [
        {
          instance: null,
          listener: function () {
            if (nativeEvent.defaultPrevented) {
              if (0 !== currentEventTransitionLane) {
                var formData = submitter
                  ? createFormDataWithSubmitter(nativeEventTarget, submitter)
                  : new FormData(nativeEventTarget);
                startHostTransition(
                  maybeTargetInst,
                  {
                    pending: !0,
                    data: formData,
                    method: nativeEventTarget.method,
                    action: action
                  },
                  null,
                  formData
                );
              }
            } else
              "function" === typeof action &&
                (event.preventDefault(),
                (formData = submitter
                  ? createFormDataWithSubmitter(nativeEventTarget, submitter)
                  : new FormData(nativeEventTarget)),
                startHostTransition(
                  maybeTargetInst,
                  {
                    pending: !0,
                    data: formData,
                    method: nativeEventTarget.method,
                    action: action
                  },
                  action,
                  formData
                ));
          },
          currentTarget: nativeEventTarget
        }
      ]
    });
  }
}
var isScrollEndEventSupported = canUseDOM && isEventSupported("scrollend"),
  isTouchStarted = !1,
  isMouseDown = !1;
function runEventInBatch(dispatchQueue) {
  processDispatchQueue(dispatchQueue, 0);
}
function fireScrollEnd(targetInst, nativeEvent, nativeEventTarget) {
  nativeEventTarget[internalScrollTimer] = void 0;
  if (isMouseDown || isTouchStarted)
    debounceScrollEnd(targetInst, nativeEvent, nativeEventTarget);
  else {
    var dispatchQueue = [];
    targetInst = accumulateTwoPhaseListeners(targetInst, "onScrollEnd");
    0 < targetInst.length &&
      ((nativeEvent = new SyntheticUIEvent(
        "onScrollEnd",
        "scrollend",
        null,
        nativeEvent,
        nativeEventTarget
      )),
      dispatchQueue.push({ event: nativeEvent, listeners: targetInst }));
    batchedUpdates$1(runEventInBatch, dispatchQueue);
  }
}
function debounceScrollEnd(targetInst, nativeEvent, nativeEventTarget) {
  var existingTimer = nativeEventTarget[internalScrollTimer];
  null != existingTimer && clearTimeout(existingTimer);
  null !== targetInst &&
    ((targetInst = setTimeout(
      fireScrollEnd.bind(null, targetInst, nativeEvent, nativeEventTarget),
      200
    )),
    (nativeEventTarget[internalScrollTimer] = targetInst));
}
for (
  var i$jscomp$inline_1964 = 0;
  i$jscomp$inline_1964 < simpleEventPluginEvents.length;
  i$jscomp$inline_1964++
) {
  var eventName$jscomp$inline_1965 =
      simpleEventPluginEvents[i$jscomp$inline_1964],
    domEventName$jscomp$inline_1966 =
      eventName$jscomp$inline_1965.toLowerCase(),
    capitalizedEvent$jscomp$inline_1967 =
      eventName$jscomp$inline_1965[0].toUpperCase() +
      eventName$jscomp$inline_1965.slice(1);
  registerSimpleEvent(
    domEventName$jscomp$inline_1966,
    "on" + capitalizedEvent$jscomp$inline_1967
  );
}
registerSimpleEvent(ANIMATION_END, "onAnimationEnd");
registerSimpleEvent(ANIMATION_ITERATION, "onAnimationIteration");
registerSimpleEvent(ANIMATION_START, "onAnimationStart");
registerSimpleEvent("dblclick", "onDoubleClick");
registerSimpleEvent("focusin", "onFocus");
registerSimpleEvent("focusout", "onBlur");
registerSimpleEvent(TRANSITION_RUN, "onTransitionRun");
registerSimpleEvent(TRANSITION_START, "onTransitionStart");
registerSimpleEvent(TRANSITION_CANCEL, "onTransitionCancel");
registerSimpleEvent(TRANSITION_END, "onTransitionEnd");
registerDirectEvent("onMouseEnter", ["mouseout", "mouseover"]);
registerDirectEvent("onMouseLeave", ["mouseout", "mouseover"]);
registerDirectEvent("onPointerEnter", ["pointerout", "pointerover"]);
registerDirectEvent("onPointerLeave", ["pointerout", "pointerover"]);
registerTwoPhaseEvent(
  "onChange",
  "change click focusin focusout input keydown keyup selectionchange".split(" ")
);
registerTwoPhaseEvent(
  "onSelect",
  "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
    " "
  )
);
registerTwoPhaseEvent("onBeforeInput", [
  "compositionend",
  "keypress",
  "textInput",
  "paste"
]);
registerTwoPhaseEvent(
  "onCompositionEnd",
  "compositionend focusout keydown keypress keyup mousedown".split(" ")
);
registerTwoPhaseEvent(
  "onCompositionStart",
  "compositionstart focusout keydown keypress keyup mousedown".split(" ")
);
registerTwoPhaseEvent(
  "onCompositionUpdate",
  "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
);
registerTwoPhaseEvent(
  "onScrollEnd",
  "scroll scrollend touchstart touchcancel touchend mousedown mouseup".split(
    " "
  )
);
var mediaEventTypes =
    "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
      " "
    ),
  nonDelegatedEvents = new Set(
    "beforetoggle cancel close invalid load scroll scrollend toggle"
      .split(" ")
      .concat(mediaEventTypes)
  );
function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  eventSystemFlags = 0 !== (eventSystemFlags & 4);
  for (var i = 0; i < dispatchQueue.length; i++) {
    var _dispatchQueue$i = dispatchQueue[i],
      event = _dispatchQueue$i.event;
    _dispatchQueue$i = _dispatchQueue$i.listeners;
    a: {
      var previousInstance = void 0;
      if (eventSystemFlags)
        for (
          var i$jscomp$0 = _dispatchQueue$i.length - 1;
          0 <= i$jscomp$0;
          i$jscomp$0--
        ) {
          var _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0],
            instance = _dispatchListeners$i.instance,
            currentTarget = _dispatchListeners$i.currentTarget;
          _dispatchListeners$i = _dispatchListeners$i.listener;
          if (instance !== previousInstance && event.isPropagationStopped())
            break a;
          previousInstance = _dispatchListeners$i;
          event.currentTarget = currentTarget;
          try {
            previousInstance(event);
          } catch (error) {
            reportGlobalError(error);
          }
          event.currentTarget = null;
          previousInstance = instance;
        }
      else
        for (
          i$jscomp$0 = 0;
          i$jscomp$0 < _dispatchQueue$i.length;
          i$jscomp$0++
        ) {
          _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0];
          instance = _dispatchListeners$i.instance;
          currentTarget = _dispatchListeners$i.currentTarget;
          _dispatchListeners$i = _dispatchListeners$i.listener;
          if (instance !== previousInstance && event.isPropagationStopped())
            break a;
          previousInstance = _dispatchListeners$i;
          event.currentTarget = currentTarget;
          try {
            previousInstance(event);
          } catch (error) {
            reportGlobalError(error);
          }
          event.currentTarget = null;
          previousInstance = instance;
        }
    }
  }
}
function listenToNonDelegatedEvent(domEventName, targetElement) {
  var JSCompiler_inline_result = targetElement[internalEventHandlersKey];
  void 0 === JSCompiler_inline_result &&
    (JSCompiler_inline_result = targetElement[internalEventHandlersKey] =
      new Set());
  var listenerSetKey = domEventName + "__bubble";
  JSCompiler_inline_result.has(listenerSetKey) ||
    (addTrappedEventListener(targetElement, domEventName, 2, !1),
    JSCompiler_inline_result.add(listenerSetKey));
}
function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  var eventSystemFlags = 0;
  isCapturePhaseListener && (eventSystemFlags |= 4);
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}
var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
function listenToAllSupportedEvents(rootContainerElement) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = !0;
    allNativeEvents.forEach(function (domEventName) {
      "selectionchange" !== domEventName &&
        (nonDelegatedEvents.has(domEventName) ||
          listenToNativeEvent(domEventName, !1, rootContainerElement),
        listenToNativeEvent(domEventName, !0, rootContainerElement));
    });
    var ownerDocument =
      9 === rootContainerElement.nodeType
        ? rootContainerElement
        : rootContainerElement.ownerDocument;
    null === ownerDocument ||
      ownerDocument[listeningMarker] ||
      ((ownerDocument[listeningMarker] = !0),
      listenToNativeEvent("selectionchange", !1, ownerDocument));
  }
}
function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  switch (getEventPriority(domEventName)) {
    case 2:
      var listenerWrapper = dispatchDiscreteEvent;
      break;
    case 8:
      listenerWrapper = dispatchContinuousEvent;
      break;
    default:
      listenerWrapper = dispatchEvent;
  }
  eventSystemFlags = listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
  listenerWrapper = void 0;
  !passiveBrowserEventsSupported ||
    ("touchstart" !== domEventName &&
      "touchmove" !== domEventName &&
      "wheel" !== domEventName) ||
    (listenerWrapper = !0);
  isCapturePhaseListener
    ? void 0 !== listenerWrapper
      ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          capture: !0,
          passive: listenerWrapper
        })
      : targetContainer.addEventListener(domEventName, eventSystemFlags, !0)
    : void 0 !== listenerWrapper
      ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          passive: listenerWrapper
        })
      : targetContainer.addEventListener(domEventName, eventSystemFlags, !1);
}
function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst$jscomp$0,
  targetContainer
) {
  var ancestorInst = targetInst$jscomp$0;
  if (
    0 === (eventSystemFlags & 1) &&
    0 === (eventSystemFlags & 2) &&
    null !== targetInst$jscomp$0
  )
    a: for (;;) {
      if (null === targetInst$jscomp$0) return;
      var nodeTag = targetInst$jscomp$0.tag;
      if (3 === nodeTag || 4 === nodeTag) {
        var container = targetInst$jscomp$0.stateNode.containerInfo;
        if (container === targetContainer) break;
        if (4 === nodeTag)
          for (nodeTag = targetInst$jscomp$0.return; null !== nodeTag; ) {
            var grandTag = nodeTag.tag;
            if (
              (3 === grandTag || 4 === grandTag) &&
              nodeTag.stateNode.containerInfo === targetContainer
            )
              return;
            nodeTag = nodeTag.return;
          }
        for (; null !== container; ) {
          nodeTag = getClosestInstanceFromNode(container);
          if (null === nodeTag) return;
          grandTag = nodeTag.tag;
          if (
            5 === grandTag ||
            6 === grandTag ||
            26 === grandTag ||
            27 === grandTag
          ) {
            targetInst$jscomp$0 = ancestorInst = nodeTag;
            continue a;
          }
          container = container.parentNode;
        }
      }
      targetInst$jscomp$0 = targetInst$jscomp$0.return;
    }
  batchedUpdates$1(function () {
    var targetInst = ancestorInst,
      nativeEventTarget = getEventTarget(nativeEvent),
      dispatchQueue = [];
    a: {
      var reactName = topLevelEventsToReactNames.get(domEventName);
      if (void 0 !== reactName) {
        var SyntheticEventCtor = SyntheticEvent,
          reactEventType = domEventName;
        switch (domEventName) {
          case "keypress":
            if (0 === getEventCharCode(nativeEvent)) break a;
          case "keydown":
          case "keyup":
            SyntheticEventCtor = SyntheticKeyboardEvent;
            break;
          case "focusin":
            reactEventType = "focus";
            SyntheticEventCtor = SyntheticFocusEvent;
            break;
          case "focusout":
            reactEventType = "blur";
            SyntheticEventCtor = SyntheticFocusEvent;
            break;
          case "beforeblur":
          case "afterblur":
            SyntheticEventCtor = SyntheticFocusEvent;
            break;
          case "click":
            if (2 === nativeEvent.button) break a;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            SyntheticEventCtor = SyntheticMouseEvent;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            SyntheticEventCtor = SyntheticDragEvent;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            SyntheticEventCtor = SyntheticTouchEvent;
            break;
          case ANIMATION_END:
          case ANIMATION_ITERATION:
          case ANIMATION_START:
            SyntheticEventCtor = SyntheticAnimationEvent;
            break;
          case TRANSITION_END:
            SyntheticEventCtor = SyntheticTransitionEvent;
            break;
          case "scroll":
          case "scrollend":
            SyntheticEventCtor = SyntheticUIEvent;
            break;
          case "wheel":
            SyntheticEventCtor = SyntheticWheelEvent;
            break;
          case "copy":
          case "cut":
          case "paste":
            SyntheticEventCtor = SyntheticClipboardEvent;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            SyntheticEventCtor = SyntheticPointerEvent;
            break;
          case "toggle":
          case "beforetoggle":
            SyntheticEventCtor = SyntheticToggleEvent;
        }
        var inCapturePhase = 0 !== (eventSystemFlags & 4);
        inCapturePhase = accumulateSinglePhaseListeners(
          targetInst,
          reactName,
          nativeEvent.type,
          inCapturePhase,
          !inCapturePhase &&
            ("scroll" === domEventName || "scrollend" === domEventName)
        );
        0 < inCapturePhase.length &&
          ((reactName = new SyntheticEventCtor(
            reactName,
            reactEventType,
            null,
            nativeEvent,
            nativeEventTarget
          )),
          dispatchQueue.push({ event: reactName, listeners: inCapturePhase }));
      }
    }
    if (0 === (eventSystemFlags & 7)) {
      a: {
        SyntheticEventCtor =
          "mouseover" === domEventName || "pointerover" === domEventName;
        reactName =
          "mouseout" === domEventName || "pointerout" === domEventName;
        if (
          SyntheticEventCtor &&
          nativeEvent !== currentReplayingEvent &&
          (reactEventType =
            nativeEvent.relatedTarget || nativeEvent.fromElement) &&
          (getClosestInstanceFromNode(reactEventType) ||
            reactEventType[internalContainerInstanceKey])
        )
          break a;
        if (reactName || SyntheticEventCtor) {
          reactEventType =
            nativeEventTarget.window === nativeEventTarget
              ? nativeEventTarget
              : (SyntheticEventCtor = nativeEventTarget.ownerDocument)
                ? SyntheticEventCtor.defaultView ||
                  SyntheticEventCtor.parentWindow
                : window;
          if (reactName) {
            if (
              ((SyntheticEventCtor =
                nativeEvent.relatedTarget || nativeEvent.toElement),
              (reactName = targetInst),
              (SyntheticEventCtor = SyntheticEventCtor
                ? getClosestInstanceFromNode(SyntheticEventCtor)
                : null),
              null !== SyntheticEventCtor)
            ) {
              inCapturePhase = getNearestMountedFiber(SyntheticEventCtor);
              var tag = SyntheticEventCtor.tag;
              if (
                SyntheticEventCtor !== inCapturePhase ||
                (5 !== tag && 27 !== tag && 6 !== tag)
              )
                SyntheticEventCtor = null;
            }
          } else (reactName = null), (SyntheticEventCtor = targetInst);
          if (reactName !== SyntheticEventCtor) {
            tag = SyntheticMouseEvent;
            var leaveEventType = "onMouseLeave",
              enterEventType = "onMouseEnter",
              eventTypePrefix = "mouse";
            if ("pointerout" === domEventName || "pointerover" === domEventName)
              (tag = SyntheticPointerEvent),
                (leaveEventType = "onPointerLeave"),
                (enterEventType = "onPointerEnter"),
                (eventTypePrefix = "pointer");
            inCapturePhase =
              null == reactName
                ? reactEventType
                : getNodeFromInstance(reactName);
            var toNode =
              null == SyntheticEventCtor
                ? reactEventType
                : getNodeFromInstance(SyntheticEventCtor);
            reactEventType = new tag(
              leaveEventType,
              eventTypePrefix + "leave",
              reactName,
              nativeEvent,
              nativeEventTarget
            );
            reactEventType.target = inCapturePhase;
            reactEventType.relatedTarget = toNode;
            leaveEventType = null;
            getClosestInstanceFromNode(nativeEventTarget) === targetInst &&
              ((tag = new tag(
                enterEventType,
                eventTypePrefix + "enter",
                SyntheticEventCtor,
                nativeEvent,
                nativeEventTarget
              )),
              (tag.target = toNode),
              (tag.relatedTarget = inCapturePhase),
              (leaveEventType = tag));
            inCapturePhase = leaveEventType;
            tag =
              reactName && SyntheticEventCtor
                ? getLowestCommonAncestor(
                    reactName,
                    SyntheticEventCtor,
                    getParent
                  )
                : null;
            null !== reactName &&
              accumulateEnterLeaveListenersForEvent(
                dispatchQueue,
                reactEventType,
                reactName,
                tag,
                !1
              );
            null !== SyntheticEventCtor &&
              null !== inCapturePhase &&
              accumulateEnterLeaveListenersForEvent(
                dispatchQueue,
                inCapturePhase,
                SyntheticEventCtor,
                tag,
                !0
              );
          }
        }
      }
      a: {
        reactName = targetInst ? getNodeFromInstance(targetInst) : window;
        SyntheticEventCtor =
          reactName.nodeName && reactName.nodeName.toLowerCase();
        if (
          "select" === SyntheticEventCtor ||
          ("input" === SyntheticEventCtor && "file" === reactName.type)
        )
          var getTargetInstFunc = getTargetInstForChangeEvent;
        else if (isTextInputElement(reactName))
          if (isInputEventSupported)
            getTargetInstFunc = getTargetInstForInputOrChangeEvent;
          else {
            getTargetInstFunc = getTargetInstForInputEventPolyfill;
            var handleEventFunc = handleEventsForInputEventPolyfill;
          }
        else
          (SyntheticEventCtor = reactName.nodeName),
            !SyntheticEventCtor ||
            "input" !== SyntheticEventCtor.toLowerCase() ||
            ("checkbox" !== reactName.type && "radio" !== reactName.type)
              ? targetInst &&
                isCustomElement(targetInst.elementType) &&
                (getTargetInstFunc = getTargetInstForChangeEvent)
              : (getTargetInstFunc = getTargetInstForClickEvent);
        if (
          getTargetInstFunc &&
          (getTargetInstFunc = getTargetInstFunc(domEventName, targetInst))
        ) {
          createAndAccumulateChangeEvent(
            dispatchQueue,
            getTargetInstFunc,
            nativeEvent,
            nativeEventTarget
          );
          break a;
        }
        handleEventFunc && handleEventFunc(domEventName, reactName, targetInst);
        "focusout" === domEventName &&
          targetInst &&
          "number" === reactName.type &&
          null != targetInst.memoizedProps.value &&
          setDefaultValue(reactName, "number", reactName.value);
      }
      handleEventFunc = targetInst ? getNodeFromInstance(targetInst) : window;
      switch (domEventName) {
        case "focusin":
          if (
            isTextInputElement(handleEventFunc) ||
            "true" === handleEventFunc.contentEditable
          )
            (activeElement = handleEventFunc),
              (activeElementInst = targetInst),
              (lastSelection = null);
          break;
        case "focusout":
          lastSelection = activeElementInst = activeElement = null;
          break;
        case "mousedown":
          mouseDown = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          mouseDown = !1;
          constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
          break;
        case "selectionchange":
          if (skipSelectionChangeEvent) break;
        case "keydown":
        case "keyup":
          constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
      }
      var fallbackData;
      if (canUseCompositionEvent)
        b: {
          switch (domEventName) {
            case "compositionstart":
              var eventType = "onCompositionStart";
              break b;
            case "compositionend":
              eventType = "onCompositionEnd";
              break b;
            case "compositionupdate":
              eventType = "onCompositionUpdate";
              break b;
          }
          eventType = void 0;
        }
      else
        isComposing
          ? isFallbackCompositionEnd(domEventName, nativeEvent) &&
            (eventType = "onCompositionEnd")
          : "keydown" === domEventName &&
            229 === nativeEvent.keyCode &&
            (eventType = "onCompositionStart");
      eventType &&
        (useFallbackCompositionData &&
          "ko" !== nativeEvent.locale &&
          (isComposing || "onCompositionStart" !== eventType
            ? "onCompositionEnd" === eventType &&
              isComposing &&
              (fallbackData = getData())
            : ((root = nativeEventTarget),
              (startText = "value" in root ? root.value : root.textContent),
              (isComposing = !0))),
        (handleEventFunc = accumulateTwoPhaseListeners(targetInst, eventType)),
        0 < handleEventFunc.length &&
          ((eventType = new SyntheticCompositionEvent(
            eventType,
            domEventName,
            null,
            nativeEvent,
            nativeEventTarget
          )),
          dispatchQueue.push({ event: eventType, listeners: handleEventFunc }),
          fallbackData
            ? (eventType.data = fallbackData)
            : ((fallbackData = getDataFromCustomEvent(nativeEvent)),
              null !== fallbackData && (eventType.data = fallbackData))));
      if (
        (fallbackData = canUseTextInputEvent
          ? getNativeBeforeInputChars(domEventName, nativeEvent)
          : getFallbackBeforeInputChars(domEventName, nativeEvent))
      )
        (eventType = accumulateTwoPhaseListeners(targetInst, "onBeforeInput")),
          0 < eventType.length &&
            ((handleEventFunc = new SyntheticCompositionEvent(
              "onBeforeInput",
              "beforeinput",
              null,
              nativeEvent,
              nativeEventTarget
            )),
            dispatchQueue.push({
              event: handleEventFunc,
              listeners: eventType
            }),
            (handleEventFunc.data = fallbackData));
      extractEvents$2(
        dispatchQueue,
        domEventName,
        targetInst,
        nativeEvent,
        nativeEventTarget
      );
    }
    a: if (
      ((fallbackData = 0 !== (eventSystemFlags & 4)),
      "scrollend" !== domEventName)
    ) {
      if (!isScrollEndEventSupported && fallbackData)
        switch (domEventName) {
          case "scroll":
            null !== nativeEventTarget &&
              debounceScrollEnd(targetInst, nativeEvent, nativeEventTarget);
            break;
          case "touchstart":
            isTouchStarted = !0;
            break;
          case "touchcancel":
          case "touchend":
            isTouchStarted = !1;
            break;
          case "mousedown":
            isMouseDown = !0;
            break;
          case "mouseup":
            isMouseDown = !1;
        }
    } else {
      if (!isScrollEndEventSupported && null !== nativeEventTarget)
        if (
          ((eventType = nativeEventTarget[internalScrollTimer]),
          null != eventType)
        )
          clearTimeout(eventType),
            (nativeEventTarget[internalScrollTimer] = void 0);
        else break a;
      targetInst = accumulateSinglePhaseListeners(
        targetInst,
        "onScrollEnd",
        "scrollend",
        fallbackData,
        !fallbackData
      );
      0 < targetInst.length &&
        ((nativeEventTarget = new SyntheticUIEvent(
          "onScrollEnd",
          "scrollend",
          null,
          nativeEvent,
          nativeEventTarget
        )),
        dispatchQueue.push({
          event: nativeEventTarget,
          listeners: targetInst
        }));
    }
    processDispatchQueue(dispatchQueue, eventSystemFlags);
  });
}
function createDispatchListener(instance, listener, currentTarget) {
  return {
    instance: instance,
    listener: listener,
    currentTarget: currentTarget
  };
}
function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  inCapturePhase,
  accumulateTargetOnly
) {
  reactName = inCapturePhase
    ? null !== reactName
      ? reactName + "Capture"
      : null
    : reactName;
  for (nativeEventType = []; null !== targetFiber; ) {
    var _instance = targetFiber;
    inCapturePhase = _instance.stateNode;
    _instance = _instance.tag;
    (5 !== _instance && 26 !== _instance && 27 !== _instance) ||
      null === inCapturePhase ||
      null === reactName ||
      ((_instance = getListener(targetFiber, reactName)),
      null != _instance &&
        nativeEventType.push(
          createDispatchListener(targetFiber, _instance, inCapturePhase)
        ));
    if (accumulateTargetOnly) break;
    targetFiber = targetFiber.return;
  }
  return nativeEventType;
}
function accumulateTwoPhaseListeners(targetFiber, reactName) {
  for (
    var captureName = reactName + "Capture", listeners = [];
    null !== targetFiber;

  ) {
    var _instance2 = targetFiber,
      stateNode = _instance2.stateNode;
    _instance2 = _instance2.tag;
    (5 !== _instance2 && 26 !== _instance2 && 27 !== _instance2) ||
      null === stateNode ||
      ((_instance2 = getListener(targetFiber, captureName)),
      null != _instance2 &&
        listeners.unshift(
          createDispatchListener(targetFiber, _instance2, stateNode)
        ),
      (_instance2 = getListener(targetFiber, reactName)),
      null != _instance2 &&
        listeners.push(
          createDispatchListener(targetFiber, _instance2, stateNode)
        ));
    if (3 === targetFiber.tag) return listeners;
    targetFiber = targetFiber.return;
  }
  return [];
}
function getParent(inst) {
  if (null === inst) return null;
  do inst = inst.return;
  while (inst && 5 !== inst.tag && 27 !== inst.tag);
  return inst ? inst : null;
}
function accumulateEnterLeaveListenersForEvent(
  dispatchQueue,
  event,
  target,
  common,
  inCapturePhase
) {
  for (
    var registrationName = event._reactName, listeners = [];
    null !== target && target !== common;

  ) {
    var _instance3 = target,
      alternate = _instance3.alternate,
      stateNode = _instance3.stateNode;
    _instance3 = _instance3.tag;
    if (null !== alternate && alternate === common) break;
    (5 !== _instance3 && 26 !== _instance3 && 27 !== _instance3) ||
      null === stateNode ||
      ((alternate = stateNode),
      inCapturePhase
        ? ((stateNode = getListener(target, registrationName)),
          null != stateNode &&
            listeners.unshift(
              createDispatchListener(target, stateNode, alternate)
            ))
        : inCapturePhase ||
          ((stateNode = getListener(target, registrationName)),
          null != stateNode &&
            listeners.push(
              createDispatchListener(target, stateNode, alternate)
            )));
    target = target.return;
  }
  0 !== listeners.length &&
    dispatchQueue.push({ event: event, listeners: listeners });
}
var NORMALIZE_NEWLINES_REGEX = /\r\n?/g,
  NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
function normalizeMarkupForTextOrAttribute(markup) {
  return ("string" === typeof markup ? markup : "" + markup)
    .replace(NORMALIZE_NEWLINES_REGEX, "\n")
    .replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
}
function checkForUnmatchedText(serverText, clientText) {
  clientText = normalizeMarkupForTextOrAttribute(clientText);
  return normalizeMarkupForTextOrAttribute(serverText) === clientText ? !0 : !1;
}
function setProp(domElement, tag, key, value, props, prevValue) {
  switch (key) {
    case "children":
      if ("string" === typeof value)
        "body" === tag ||
          ("textarea" === tag && "" === value) ||
          setTextContent(domElement, value);
      else if ("number" === typeof value || "bigint" === typeof value)
        "body" !== tag && setTextContent(domElement, "" + value);
      else return;
      break;
    case "className":
      setValueForKnownAttribute(domElement, "class", value);
      break;
    case "tabIndex":
      setValueForKnownAttribute(domElement, "tabindex", value);
      break;
    case "dir":
    case "role":
    case "viewBox":
    case "width":
    case "height":
      setValueForKnownAttribute(domElement, key, value);
      break;
    case "style":
      setValueForStyles(domElement, value, prevValue);
      return;
    case "data":
      if ("object" !== tag) {
        setValueForKnownAttribute(domElement, "data", value);
        break;
      }
    case "src":
    case "href":
      if ("" === value && ("a" !== tag || "href" !== key)) {
        domElement.removeAttribute(key);
        break;
      }
      if (
        null == value ||
        "function" === typeof value ||
        "symbol" === typeof value ||
        "boolean" === typeof value
      ) {
        domElement.removeAttribute(key);
        break;
      }
      value = sanitizeURL("" + value);
      domElement.setAttribute(key, value);
      break;
    case "action":
    case "formAction":
      if ("function" === typeof value) {
        domElement.setAttribute(
          key,
          "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
        );
        break;
      } else
        "function" === typeof prevValue &&
          ("formAction" === key
            ? ("input" !== tag &&
                setProp(domElement, tag, "name", props.name, props, null),
              setProp(
                domElement,
                tag,
                "formEncType",
                props.formEncType,
                props,
                null
              ),
              setProp(
                domElement,
                tag,
                "formMethod",
                props.formMethod,
                props,
                null
              ),
              setProp(
                domElement,
                tag,
                "formTarget",
                props.formTarget,
                props,
                null
              ))
            : (setProp(domElement, tag, "encType", props.encType, props, null),
              setProp(domElement, tag, "method", props.method, props, null),
              setProp(domElement, tag, "target", props.target, props, null)));
      if (
        null == value ||
        "symbol" === typeof value ||
        "boolean" === typeof value
      ) {
        domElement.removeAttribute(key);
        break;
      }
      value = sanitizeURL("" + value);
      domElement.setAttribute(key, value);
      break;
    case "onClick":
      null != value && (domElement.onclick = noop$1);
      return;
    case "onScroll":
      null != value && listenToNonDelegatedEvent("scroll", domElement);
      return;
    case "onScrollEnd":
      null != value &&
        (listenToNonDelegatedEvent("scrollend", domElement),
        listenToNonDelegatedEvent("scroll", domElement));
      return;
    case "dangerouslySetInnerHTML":
      if (null != value) {
        if ("object" !== typeof value || !("__html" in value))
          throw Error(formatProdErrorMessage(61));
        key = value.__html;
        if (null != key) {
          if (null != props.children) throw Error(formatProdErrorMessage(60));
          domElement.innerHTML = key;
        }
      }
      break;
    case "multiple":
      domElement.multiple =
        value && "function" !== typeof value && "symbol" !== typeof value;
      break;
    case "muted":
      domElement.muted =
        value && "function" !== typeof value && "symbol" !== typeof value;
      break;
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
    case "defaultValue":
    case "defaultChecked":
    case "innerHTML":
    case "ref":
      break;
    case "autoFocus":
      break;
    case "xlinkHref":
      if (
        null == value ||
        "function" === typeof value ||
        "boolean" === typeof value ||
        "symbol" === typeof value
      ) {
        domElement.removeAttribute("xlink:href");
        break;
      }
      key = sanitizeURL("" + value);
      domElement.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "xlink:href",
        key
      );
      break;
    case "contentEditable":
    case "spellCheck":
    case "draggable":
    case "value":
    case "autoReverse":
    case "externalResourcesRequired":
    case "focusable":
    case "preserveAlpha":
      null != value && "function" !== typeof value && "symbol" !== typeof value
        ? domElement.setAttribute(key, "" + value)
        : domElement.removeAttribute(key);
      break;
    case "inert":
    case "allowFullScreen":
    case "async":
    case "autoPlay":
    case "controls":
    case "default":
    case "defer":
    case "disabled":
    case "disablePictureInPicture":
    case "disableRemotePlayback":
    case "formNoValidate":
    case "hidden":
    case "loop":
    case "noModule":
    case "noValidate":
    case "open":
    case "playsInline":
    case "readOnly":
    case "required":
    case "reversed":
    case "scoped":
    case "seamless":
    case "itemScope":
      value && "function" !== typeof value && "symbol" !== typeof value
        ? domElement.setAttribute(key, "")
        : domElement.removeAttribute(key);
      break;
    case "capture":
    case "download":
      !0 === value
        ? domElement.setAttribute(key, "")
        : !1 !== value &&
            null != value &&
            "function" !== typeof value &&
            "symbol" !== typeof value
          ? domElement.setAttribute(key, value)
          : domElement.removeAttribute(key);
      break;
    case "cols":
    case "rows":
    case "size":
    case "span":
      null != value &&
      "function" !== typeof value &&
      "symbol" !== typeof value &&
      !isNaN(value) &&
      1 <= value
        ? domElement.setAttribute(key, value)
        : domElement.removeAttribute(key);
      break;
    case "rowSpan":
    case "start":
      null == value ||
      "function" === typeof value ||
      "symbol" === typeof value ||
      isNaN(value)
        ? domElement.removeAttribute(key)
        : domElement.setAttribute(key, value);
      break;
    case "popover":
      listenToNonDelegatedEvent("beforetoggle", domElement);
      listenToNonDelegatedEvent("toggle", domElement);
      setValueForAttribute(domElement, "popover", value);
      break;
    case "xlinkActuate":
      setValueForNamespacedAttribute(
        domElement,
        "http://www.w3.org/1999/xlink",
        "xlink:actuate",
        value
      );
      break;
    case "xlinkArcrole":
      setValueForNamespacedAttribute(
        domElement,
        "http://www.w3.org/1999/xlink",
        "xlink:arcrole",
        value
      );
      break;
    case "xlinkRole":
      setValueForNamespacedAttribute(
        domElement,
        "http://www.w3.org/1999/xlink",
        "xlink:role",
        value
      );
      break;
    case "xlinkShow":
      setValueForNamespacedAttribute(
        domElement,
        "http://www.w3.org/1999/xlink",
        "xlink:show",
        value
      );
      break;
    case "xlinkTitle":
      setValueForNamespacedAttribute(
        domElement,
        "http://www.w3.org/1999/xlink",
        "xlink:title",
        value
      );
      break;
    case "xlinkType":
      setValueForNamespacedAttribute(
        domElement,
        "http://www.w3.org/1999/xlink",
        "xlink:type",
        value
      );
      break;
    case "xmlBase":
      setValueForNamespacedAttribute(
        domElement,
        "http://www.w3.org/XML/1998/namespace",
        "xml:base",
        value
      );
      break;
    case "xmlLang":
      setValueForNamespacedAttribute(
        domElement,
        "http://www.w3.org/XML/1998/namespace",
        "xml:lang",
        value
      );
      break;
    case "xmlSpace":
      setValueForNamespacedAttribute(
        domElement,
        "http://www.w3.org/XML/1998/namespace",
        "xml:space",
        value
      );
      break;
    case "is":
      setValueForAttribute(domElement, "is", value);
      break;
    case "innerText":
    case "textContent":
      return;
    default:
      if (
        !(2 < key.length) ||
        ("o" !== key[0] && "O" !== key[0]) ||
        ("n" !== key[1] && "N" !== key[1])
      )
        (key = aliases.get(key) || key),
          setValueForAttribute(domElement, key, value);
      else return;
  }
  rootMutationContext = !0;
}
function setPropOnCustomElement(domElement, tag, key, value, props, prevValue) {
  switch (key) {
    case "style":
      setValueForStyles(domElement, value, prevValue);
      return;
    case "dangerouslySetInnerHTML":
      if (null != value) {
        if ("object" !== typeof value || !("__html" in value))
          throw Error(formatProdErrorMessage(61));
        key = value.__html;
        if (null != key) {
          if (null != props.children) throw Error(formatProdErrorMessage(60));
          domElement.innerHTML = key;
        }
      }
      break;
    case "children":
      if ("string" === typeof value) setTextContent(domElement, value);
      else if ("number" === typeof value || "bigint" === typeof value)
        setTextContent(domElement, "" + value);
      else return;
      break;
    case "onScroll":
      null != value && listenToNonDelegatedEvent("scroll", domElement);
      return;
    case "onScrollEnd":
      null != value &&
        (listenToNonDelegatedEvent("scrollend", domElement),
        listenToNonDelegatedEvent("scroll", domElement));
      return;
    case "onClick":
      null != value && (domElement.onclick = noop$1);
      return;
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
    case "innerHTML":
    case "ref":
      return;
    case "innerText":
    case "textContent":
      return;
    default:
      if (!registrationNameDependencies.hasOwnProperty(key))
        a: {
          if (
            "o" === key[0] &&
            "n" === key[1] &&
            ((props = key.endsWith("Capture")),
            (tag = key.slice(2, props ? key.length - 7 : void 0)),
            (prevValue = domElement[internalPropsKey] || null),
            (prevValue = null != prevValue ? prevValue[key] : null),
            "function" === typeof prevValue &&
              domElement.removeEventListener(tag, prevValue, props),
            "function" === typeof value)
          ) {
            "function" !== typeof prevValue &&
              null !== prevValue &&
              (key in domElement
                ? (domElement[key] = null)
                : domElement.hasAttribute(key) &&
                  domElement.removeAttribute(key));
            domElement.addEventListener(tag, value, props);
            break a;
          }
          rootMutationContext = !0;
          key in domElement
            ? (domElement[key] = value)
            : !0 === value
              ? domElement.setAttribute(key, "")
              : setValueForAttribute(domElement, key, value);
        }
      return;
  }
  rootMutationContext = !0;
}
function setInitialProperties(domElement, tag, props) {
  switch (tag) {
    case "div":
    case "span":
    case "svg":
    case "path":
    case "a":
    case "g":
    case "p":
    case "li":
      break;
    case "img":
      listenToNonDelegatedEvent("error", domElement);
      listenToNonDelegatedEvent("load", domElement);
      var hasSrc = !1,
        hasSrcSet = !1;
      for (propKey in props)
        if (props.hasOwnProperty(propKey)) {
          var propValue = props[propKey];
          if (null != propValue)
            switch (propKey) {
              case "src":
                hasSrc = !0;
                break;
              case "srcSet":
                hasSrcSet = !0;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(formatProdErrorMessage(137, tag));
              default:
                setProp(domElement, tag, propKey, propValue, props, null);
            }
        }
      hasSrcSet &&
        setProp(domElement, tag, "srcSet", props.srcSet, props, null);
      hasSrc && setProp(domElement, tag, "src", props.src, props, null);
      return;
    case "input":
      listenToNonDelegatedEvent("invalid", domElement);
      var value = (propValue = hasSrcSet = null),
        defaultValue = null,
        checked = null;
      var propKey = null;
      for (hasSrc in props)
        if (props.hasOwnProperty(hasSrc)) {
          var propValue$245 = props[hasSrc];
          if (null != propValue$245)
            switch (hasSrc) {
              case "name":
                hasSrcSet = propValue$245;
                break;
              case "type":
                propValue = propValue$245;
                break;
              case "checked":
                checked = propValue$245;
                break;
              case "defaultChecked":
                propKey = propValue$245;
                break;
              case "value":
                value = propValue$245;
                break;
              case "defaultValue":
                defaultValue = propValue$245;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (null != propValue$245)
                  throw Error(formatProdErrorMessage(137, tag));
                break;
              default:
                setProp(domElement, tag, hasSrc, propValue$245, props, null);
            }
        }
      a: {
        tag = value;
        hasSrc = defaultValue;
        props = checked;
        null != propValue &&
          "function" !== typeof propValue &&
          "symbol" !== typeof propValue &&
          "boolean" !== typeof propValue &&
          (domElement.type = propValue);
        if (null != tag || null != hasSrc) {
          if (
            !(
              ("submit" !== propValue && "reset" !== propValue) ||
              (void 0 !== tag && null !== tag)
            )
          ) {
            track(domElement);
            break a;
          }
          hasSrc = null != hasSrc ? "" + getToStringValue(hasSrc) : "";
          tag = null != tag ? "" + getToStringValue(tag) : hasSrc;
          tag !== domElement.value && (domElement.value = tag);
          domElement.defaultValue = tag;
        }
        tag = null != props ? props : propKey;
        tag = "function" !== typeof tag && "symbol" !== typeof tag && !!tag;
        domElement.checked = !!tag;
        domElement.defaultChecked = !!tag;
        null != hasSrcSet &&
          "function" !== typeof hasSrcSet &&
          "symbol" !== typeof hasSrcSet &&
          "boolean" !== typeof hasSrcSet &&
          (domElement.name = hasSrcSet);
        track(domElement);
      }
      return;
    case "select":
      listenToNonDelegatedEvent("invalid", domElement);
      hasSrc = propValue = propKey = null;
      for (hasSrcSet in props)
        if (
          props.hasOwnProperty(hasSrcSet) &&
          ((checked = props[hasSrcSet]), null != checked)
        )
          switch (hasSrcSet) {
            case "value":
              propKey = checked;
              break;
            case "defaultValue":
              propValue = checked;
              break;
            case "multiple":
              hasSrc = checked;
            default:
              setProp(domElement, tag, hasSrcSet, checked, props, null);
          }
      tag = propKey;
      props = propValue;
      domElement.multiple = !!hasSrc;
      null != tag
        ? updateOptions(domElement, !!hasSrc, tag, !1)
        : null != props && updateOptions(domElement, !!hasSrc, props, !0);
      return;
    case "textarea":
      listenToNonDelegatedEvent("invalid", domElement);
      hasSrcSet = propKey = hasSrc = null;
      for (propValue in props)
        if (
          props.hasOwnProperty(propValue) &&
          ((checked = props[propValue]), null != checked)
        )
          switch (propValue) {
            case "value":
              hasSrc = checked;
              break;
            case "defaultValue":
              propKey = checked;
              break;
            case "children":
              hasSrcSet = checked;
              break;
            case "dangerouslySetInnerHTML":
              if (null != checked) throw Error(formatProdErrorMessage(91));
              break;
            default:
              setProp(domElement, tag, propValue, checked, props, null);
          }
      tag = propKey;
      props = hasSrcSet;
      if (null == hasSrc) {
        if (null != props) {
          if (null != tag) throw Error(formatProdErrorMessage(92));
          if (isArrayImpl(props)) {
            if (1 < props.length) throw Error(formatProdErrorMessage(93));
            props = props[0];
          }
          tag = props;
        }
        null == tag && (tag = "");
        hasSrc = tag;
      }
      tag = getToStringValue(hasSrc);
      domElement.defaultValue = tag;
      props = domElement.textContent;
      props === tag &&
        "" !== props &&
        null !== props &&
        (domElement.value = props);
      track(domElement);
      return;
    case "option":
      for (defaultValue in props)
        if (
          props.hasOwnProperty(defaultValue) &&
          ((hasSrc = props[defaultValue]), null != hasSrc)
        )
          switch (defaultValue) {
            case "selected":
              domElement.selected =
                hasSrc &&
                "function" !== typeof hasSrc &&
                "symbol" !== typeof hasSrc;
              break;
            default:
              setProp(domElement, tag, defaultValue, hasSrc, props, null);
          }
      return;
    case "dialog":
      listenToNonDelegatedEvent("beforetoggle", domElement);
      listenToNonDelegatedEvent("toggle", domElement);
      listenToNonDelegatedEvent("cancel", domElement);
      listenToNonDelegatedEvent("close", domElement);
      break;
    case "iframe":
    case "object":
      listenToNonDelegatedEvent("load", domElement);
      break;
    case "video":
    case "audio":
      for (hasSrc = 0; hasSrc < mediaEventTypes.length; hasSrc++)
        listenToNonDelegatedEvent(mediaEventTypes[hasSrc], domElement);
      break;
    case "image":
      listenToNonDelegatedEvent("error", domElement);
      listenToNonDelegatedEvent("load", domElement);
      break;
    case "details":
      listenToNonDelegatedEvent("toggle", domElement);
      break;
    case "embed":
    case "source":
    case "link":
      listenToNonDelegatedEvent("error", domElement),
        listenToNonDelegatedEvent("load", domElement);
    case "area":
    case "base":
    case "br":
    case "col":
    case "hr":
    case "keygen":
    case "meta":
    case "param":
    case "track":
    case "wbr":
    case "menuitem":
      for (value in props)
        if (
          props.hasOwnProperty(value) &&
          ((hasSrc = props[value]), null != hasSrc)
        )
          switch (value) {
            case "children":
            case "dangerouslySetInnerHTML":
              throw Error(formatProdErrorMessage(137, tag));
            default:
              setProp(domElement, tag, value, hasSrc, props, null);
          }
      return;
    default:
      if (isCustomElement(tag)) {
        for (propValue$245 in props)
          props.hasOwnProperty(propValue$245) &&
            ((hasSrc = props[propValue$245]),
            void 0 !== hasSrc &&
              setPropOnCustomElement(
                domElement,
                tag,
                propValue$245,
                hasSrc,
                props,
                void 0
              ));
        return;
      }
  }
  for (checked in props)
    props.hasOwnProperty(checked) &&
      ((hasSrc = props[checked]),
      null != hasSrc && setProp(domElement, tag, checked, hasSrc, props, null));
}
function updateProperties(domElement, tag, lastProps, nextProps) {
  switch (tag) {
    case "div":
    case "span":
    case "svg":
    case "path":
    case "a":
    case "g":
    case "p":
    case "li":
      break;
    case "input":
      var name = null,
        type = null,
        value = null,
        defaultValue = null,
        lastDefaultValue = null,
        checked = null,
        defaultChecked = null;
      for (propKey in lastProps) {
        var lastProp = lastProps[propKey];
        if (lastProps.hasOwnProperty(propKey) && null != lastProp)
          switch (propKey) {
            case "checked":
              break;
            case "value":
              break;
            case "defaultValue":
              lastDefaultValue = lastProp;
            default:
              nextProps.hasOwnProperty(propKey) ||
                setProp(domElement, tag, propKey, null, nextProps, lastProp);
          }
      }
      for (var propKey$262 in nextProps) {
        var propKey = nextProps[propKey$262];
        lastProp = lastProps[propKey$262];
        if (
          nextProps.hasOwnProperty(propKey$262) &&
          (null != propKey || null != lastProp)
        )
          switch (propKey$262) {
            case "type":
              propKey !== lastProp && (rootMutationContext = !0);
              type = propKey;
              break;
            case "name":
              propKey !== lastProp && (rootMutationContext = !0);
              name = propKey;
              break;
            case "checked":
              propKey !== lastProp && (rootMutationContext = !0);
              checked = propKey;
              break;
            case "defaultChecked":
              propKey !== lastProp && (rootMutationContext = !0);
              defaultChecked = propKey;
              break;
            case "value":
              propKey !== lastProp && (rootMutationContext = !0);
              value = propKey;
              break;
            case "defaultValue":
              propKey !== lastProp && (rootMutationContext = !0);
              defaultValue = propKey;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (null != propKey)
                throw Error(formatProdErrorMessage(137, tag));
              break;
            default:
              propKey !== lastProp &&
                setProp(
                  domElement,
                  tag,
                  propKey$262,
                  propKey,
                  nextProps,
                  lastProp
                );
          }
      }
      updateInput(
        domElement,
        value,
        defaultValue,
        lastDefaultValue,
        checked,
        defaultChecked,
        type,
        name
      );
      return;
    case "select":
      propKey = value = defaultValue = propKey$262 = null;
      for (type in lastProps)
        if (
          ((lastDefaultValue = lastProps[type]),
          lastProps.hasOwnProperty(type) && null != lastDefaultValue)
        )
          switch (type) {
            case "value":
              break;
            case "multiple":
              propKey = lastDefaultValue;
            default:
              nextProps.hasOwnProperty(type) ||
                setProp(
                  domElement,
                  tag,
                  type,
                  null,
                  nextProps,
                  lastDefaultValue
                );
          }
      for (name in nextProps)
        if (
          ((type = nextProps[name]),
          (lastDefaultValue = lastProps[name]),
          nextProps.hasOwnProperty(name) &&
            (null != type || null != lastDefaultValue))
        )
          switch (name) {
            case "value":
              type !== lastDefaultValue && (rootMutationContext = !0);
              propKey$262 = type;
              break;
            case "defaultValue":
              type !== lastDefaultValue && (rootMutationContext = !0);
              defaultValue = type;
              break;
            case "multiple":
              type !== lastDefaultValue && (rootMutationContext = !0),
                (value = type);
            default:
              type !== lastDefaultValue &&
                setProp(
                  domElement,
                  tag,
                  name,
                  type,
                  nextProps,
                  lastDefaultValue
                );
          }
      tag = defaultValue;
      lastProps = value;
      nextProps = propKey;
      null != propKey$262
        ? updateOptions(domElement, !!lastProps, propKey$262, !1)
        : !!nextProps !== !!lastProps &&
          (null != tag
            ? updateOptions(domElement, !!lastProps, tag, !0)
            : updateOptions(domElement, !!lastProps, lastProps ? [] : "", !1));
      return;
    case "textarea":
      propKey = propKey$262 = null;
      for (defaultValue in lastProps)
        if (
          ((name = lastProps[defaultValue]),
          lastProps.hasOwnProperty(defaultValue) &&
            null != name &&
            !nextProps.hasOwnProperty(defaultValue))
        )
          switch (defaultValue) {
            case "value":
              break;
            case "children":
              break;
            default:
              setProp(domElement, tag, defaultValue, null, nextProps, name);
          }
      for (value in nextProps)
        if (
          ((name = nextProps[value]),
          (type = lastProps[value]),
          nextProps.hasOwnProperty(value) && (null != name || null != type))
        )
          switch (value) {
            case "value":
              name !== type && (rootMutationContext = !0);
              propKey$262 = name;
              break;
            case "defaultValue":
              name !== type && (rootMutationContext = !0);
              propKey = name;
              break;
            case "children":
              break;
            case "dangerouslySetInnerHTML":
              if (null != name) throw Error(formatProdErrorMessage(91));
              break;
            default:
              name !== type &&
                setProp(domElement, tag, value, name, nextProps, type);
          }
      updateTextarea(domElement, propKey$262, propKey);
      return;
    case "option":
      for (var propKey$278 in lastProps)
        if (
          ((propKey$262 = lastProps[propKey$278]),
          lastProps.hasOwnProperty(propKey$278) &&
            null != propKey$262 &&
            !nextProps.hasOwnProperty(propKey$278))
        )
          switch (propKey$278) {
            case "selected":
              domElement.selected = !1;
              break;
            default:
              setProp(
                domElement,
                tag,
                propKey$278,
                null,
                nextProps,
                propKey$262
              );
          }
      for (lastDefaultValue in nextProps)
        if (
          ((propKey$262 = nextProps[lastDefaultValue]),
          (propKey = lastProps[lastDefaultValue]),
          nextProps.hasOwnProperty(lastDefaultValue) &&
            propKey$262 !== propKey &&
            (null != propKey$262 || null != propKey))
        )
          switch (lastDefaultValue) {
            case "selected":
              propKey$262 !== propKey && (rootMutationContext = !0);
              domElement.selected =
                propKey$262 &&
                "function" !== typeof propKey$262 &&
                "symbol" !== typeof propKey$262;
              break;
            default:
              setProp(
                domElement,
                tag,
                lastDefaultValue,
                propKey$262,
                nextProps,
                propKey
              );
          }
      return;
    case "img":
    case "link":
    case "area":
    case "base":
    case "br":
    case "col":
    case "embed":
    case "hr":
    case "keygen":
    case "meta":
    case "param":
    case "source":
    case "track":
    case "wbr":
    case "menuitem":
      for (var propKey$283 in lastProps)
        (propKey$262 = lastProps[propKey$283]),
          lastProps.hasOwnProperty(propKey$283) &&
            null != propKey$262 &&
            !nextProps.hasOwnProperty(propKey$283) &&
            setProp(domElement, tag, propKey$283, null, nextProps, propKey$262);
      for (checked in nextProps)
        if (
          ((propKey$262 = nextProps[checked]),
          (propKey = lastProps[checked]),
          nextProps.hasOwnProperty(checked) &&
            propKey$262 !== propKey &&
            (null != propKey$262 || null != propKey))
        )
          switch (checked) {
            case "children":
            case "dangerouslySetInnerHTML":
              if (null != propKey$262)
                throw Error(formatProdErrorMessage(137, tag));
              break;
            default:
              setProp(
                domElement,
                tag,
                checked,
                propKey$262,
                nextProps,
                propKey
              );
          }
      return;
    default:
      if (isCustomElement(tag)) {
        for (var propKey$288 in lastProps)
          (propKey$262 = lastProps[propKey$288]),
            lastProps.hasOwnProperty(propKey$288) &&
              void 0 !== propKey$262 &&
              !nextProps.hasOwnProperty(propKey$288) &&
              setPropOnCustomElement(
                domElement,
                tag,
                propKey$288,
                void 0,
                nextProps,
                propKey$262
              );
        for (defaultChecked in nextProps)
          (propKey$262 = nextProps[defaultChecked]),
            (propKey = lastProps[defaultChecked]),
            !nextProps.hasOwnProperty(defaultChecked) ||
              propKey$262 === propKey ||
              (void 0 === propKey$262 && void 0 === propKey) ||
              setPropOnCustomElement(
                domElement,
                tag,
                defaultChecked,
                propKey$262,
                nextProps,
                propKey
              );
        return;
      }
  }
  for (var propKey$293 in lastProps)
    (propKey$262 = lastProps[propKey$293]),
      lastProps.hasOwnProperty(propKey$293) &&
        null != propKey$262 &&
        !nextProps.hasOwnProperty(propKey$293) &&
        setProp(domElement, tag, propKey$293, null, nextProps, propKey$262);
  for (lastProp in nextProps)
    (propKey$262 = nextProps[lastProp]),
      (propKey = lastProps[lastProp]),
      !nextProps.hasOwnProperty(lastProp) ||
        propKey$262 === propKey ||
        (null == propKey$262 && null == propKey) ||
        setProp(domElement, tag, lastProp, propKey$262, nextProps, propKey);
}
function isLikelyStaticResource(initiatorType) {
  switch (initiatorType) {
    case "css":
    case "script":
    case "font":
    case "img":
    case "image":
    case "input":
    case "link":
      return !0;
    default:
      return !1;
  }
}
function estimateBandwidth() {
  if ("function" === typeof performance.getEntriesByType) {
    for (
      var count = 0,
        bits = 0,
        resourceEntries = performance.getEntriesByType("resource"),
        i = 0;
      i < resourceEntries.length;
      i++
    ) {
      var entry = resourceEntries[i],
        transferSize = entry.transferSize,
        initiatorType = entry.initiatorType,
        duration = entry.duration;
      if (transferSize && duration && isLikelyStaticResource(initiatorType)) {
        initiatorType = 0;
        duration = entry.responseEnd;
        for (i += 1; i < resourceEntries.length; i++) {
          var overlapEntry = resourceEntries[i],
            overlapStartTime = overlapEntry.startTime;
          if (overlapStartTime > duration) break;
          var overlapTransferSize = overlapEntry.transferSize,
            overlapInitiatorType = overlapEntry.initiatorType;
          overlapTransferSize &&
            isLikelyStaticResource(overlapInitiatorType) &&
            ((overlapEntry = overlapEntry.responseEnd),
            (initiatorType +=
              overlapTransferSize *
              (overlapEntry < duration
                ? 1
                : (duration - overlapStartTime) /
                  (overlapEntry - overlapStartTime))));
        }
        --i;
        bits += (8 * (transferSize + initiatorType)) / (entry.duration / 1e3);
        count++;
        if (10 < count) break;
      }
    }
    if (0 < count) return bits / count / 1e6;
  }
  return navigator.connection &&
    ((count = navigator.connection.downlink), "number" === typeof count)
    ? count
    : 5;
}
var eventsEnabled = null,
  selectionInformation = null;
function getOwnerDocumentFromRootContainer(rootContainerElement) {
  return 9 === rootContainerElement.nodeType
    ? rootContainerElement
    : rootContainerElement.ownerDocument;
}
function getOwnHostContext(namespaceURI) {
  switch (namespaceURI) {
    case "http://www.w3.org/2000/svg":
      return 1;
    case "http://www.w3.org/1998/Math/MathML":
      return 2;
    default:
      return 0;
  }
}
function getChildHostContextProd(parentNamespace, type) {
  if (0 === parentNamespace)
    switch (type) {
      case "svg":
        return 1;
      case "math":
        return 2;
      default:
        return 0;
    }
  return 1 === parentNamespace && "foreignObject" === type
    ? 0
    : parentNamespace;
}
function shouldSetTextContent(type, props) {
  return (
    "textarea" === type ||
    "noscript" === type ||
    "string" === typeof props.children ||
    "number" === typeof props.children ||
    "bigint" === typeof props.children ||
    ("object" === typeof props.dangerouslySetInnerHTML &&
      null !== props.dangerouslySetInnerHTML &&
      null != props.dangerouslySetInnerHTML.__html)
  );
}
var currentPopstateTransitionEvent = null;
function shouldAttemptEagerTransition() {
  var event = window.event;
  if (event && "popstate" === event.type) {
    if (event === currentPopstateTransitionEvent) return !1;
    currentPopstateTransitionEvent = event;
    return !0;
  }
  currentPopstateTransitionEvent = null;
  return !1;
}
var schedulerEvent = void 0;
function resolveEventType() {
  var event = window.event;
  return event && event !== schedulerEvent ? event.type : null;
}
function resolveEventTimeStamp() {
  var event = window.event;
  return event && event !== schedulerEvent ? event.timeStamp : -1.1;
}
var scheduleTimeout = "function" === typeof setTimeout ? setTimeout : void 0,
  cancelTimeout = "function" === typeof clearTimeout ? clearTimeout : void 0,
  localPromise = "function" === typeof Promise ? Promise : void 0,
  scheduleMicrotask =
    "function" === typeof queueMicrotask
      ? queueMicrotask
      : "undefined" !== typeof localPromise
        ? function (callback) {
            return localPromise
              .resolve(null)
              .then(callback)
              .catch(handleErrorInNextTick);
          }
        : scheduleTimeout;
function handleErrorInNextTick(error) {
  setTimeout(function () {
    throw error;
  });
}
var supportsMoveBefore =
  "undefined" !== typeof window &&
  "function" === typeof window.Element.prototype.moveBefore;
function isSingletonScope(type) {
  return "head" === type;
}
function clearHydrationBoundary(parentInstance, hydrationInstance) {
  var node = hydrationInstance,
    depth = 0;
  do {
    var nextNode = node.nextSibling;
    parentInstance.removeChild(node);
    if (nextNode && 8 === nextNode.nodeType)
      if (((node = nextNode.data), "/$" === node || "/&" === node)) {
        if (0 === depth) {
          parentInstance.removeChild(nextNode);
          retryIfBlockedOn(hydrationInstance);
          return;
        }
        depth--;
      } else if (
        "$" === node ||
        "$?" === node ||
        "$~" === node ||
        "$!" === node ||
        "&" === node
      )
        depth++;
      else if ("html" === node)
        releaseSingletonInstance(parentInstance.ownerDocument.documentElement);
      else if ("head" === node) {
        node = parentInstance.ownerDocument.head;
        releaseSingletonInstance(node);
        for (var node$jscomp$0 = node.firstChild; node$jscomp$0; ) {
          var nextNode$jscomp$0 = node$jscomp$0.nextSibling,
            nodeName = node$jscomp$0.nodeName;
          node$jscomp$0[internalHoistableMarker] ||
            "SCRIPT" === nodeName ||
            "STYLE" === nodeName ||
            ("LINK" === nodeName &&
              "stylesheet" === node$jscomp$0.rel.toLowerCase()) ||
            node.removeChild(node$jscomp$0);
          node$jscomp$0 = nextNode$jscomp$0;
        }
      } else
        "body" === node &&
          releaseSingletonInstance(parentInstance.ownerDocument.body);
    node = nextNode;
  } while (node);
  retryIfBlockedOn(hydrationInstance);
}
function hideOrUnhideDehydratedBoundary(suspenseInstance, isHidden) {
  var node = suspenseInstance;
  suspenseInstance = 0;
  do {
    var nextNode = node.nextSibling;
    1 === node.nodeType
      ? isHidden
        ? ((node._stashedDisplay = node.style.display),
          (node.style.display = "none"))
        : ((node.style.display = node._stashedDisplay || ""),
          "" === node.getAttribute("style") && node.removeAttribute("style"))
      : 3 === node.nodeType &&
        (isHidden
          ? ((node._stashedText = node.nodeValue), (node.nodeValue = ""))
          : (node.nodeValue = node._stashedText || ""));
    if (nextNode && 8 === nextNode.nodeType)
      if (((node = nextNode.data), "/$" === node))
        if (0 === suspenseInstance) break;
        else suspenseInstance--;
      else
        ("$" !== node && "$?" !== node && "$~" !== node && "$!" !== node) ||
          suspenseInstance++;
    node = nextNode;
  } while (node);
}
function FragmentInstance(fragmentFiber) {
  this._fragmentFiber = fragmentFiber;
  this._observers = this._eventListeners = null;
}
FragmentInstance.prototype.addEventListener = function (
  type,
  listener,
  optionsOrUseCapture
) {
  null === this._eventListeners && (this._eventListeners = []);
  var listeners = this._eventListeners;
  -1 === indexOfEventListener(listeners, type, listener, optionsOrUseCapture) &&
    (listeners.push({
      type: type,
      listener: listener,
      optionsOrUseCapture: optionsOrUseCapture
    }),
    traverseVisibleHostChildren(
      this._fragmentFiber.child,
      !1,
      addEventListenerToChild,
      type,
      listener,
      optionsOrUseCapture
    ));
  this._eventListeners = listeners;
};
function addEventListenerToChild(child, type, listener, optionsOrUseCapture) {
  getInstanceFromHostFiber(child).addEventListener(
    type,
    listener,
    optionsOrUseCapture
  );
  return !1;
}
FragmentInstance.prototype.removeEventListener = function (
  type,
  listener,
  optionsOrUseCapture
) {
  var listeners = this._eventListeners;
  null !== listeners &&
    "undefined" !== typeof listeners &&
    0 < listeners.length &&
    (traverseVisibleHostChildren(
      this._fragmentFiber.child,
      !1,
      removeEventListenerFromChild,
      type,
      listener,
      optionsOrUseCapture
    ),
    (type = indexOfEventListener(
      listeners,
      type,
      listener,
      optionsOrUseCapture
    )),
    null !== this._eventListeners && this._eventListeners.splice(type, 1));
};
function removeEventListenerFromChild(
  child,
  type,
  listener,
  optionsOrUseCapture
) {
  getInstanceFromHostFiber(child).removeEventListener(
    type,
    listener,
    optionsOrUseCapture
  );
  return !1;
}
function normalizeListenerOptions(opts) {
  return null == opts
    ? "0"
    : "boolean" === typeof opts
      ? "c=" + (opts ? "1" : "0")
      : "c=" +
        (opts.capture ? "1" : "0") +
        "&o=" +
        (opts.once ? "1" : "0") +
        "&p=" +
        (opts.passive ? "1" : "0");
}
function indexOfEventListener(
  eventListeners,
  type,
  listener,
  optionsOrUseCapture
) {
  for (var i = 0; i < eventListeners.length; i++) {
    var item = eventListeners[i];
    if (
      item.type === type &&
      item.listener === listener &&
      normalizeListenerOptions(item.optionsOrUseCapture) ===
        normalizeListenerOptions(optionsOrUseCapture)
    )
      return i;
  }
  return -1;
}
FragmentInstance.prototype.dispatchEvent = function (event) {
  var parentHostFiber = getFragmentParentHostFiber(this._fragmentFiber);
  if (null === parentHostFiber) return !0;
  parentHostFiber = getInstanceFromHostFiber(parentHostFiber);
  var eventListeners = this._eventListeners;
  if (
    (null !== eventListeners && 0 < eventListeners.length) ||
    !event.bubbles
  ) {
    var temp = document.createTextNode("");
    if (eventListeners)
      for (var i = 0; i < eventListeners.length; i++) {
        var _eventListeners$i = eventListeners[i];
        temp.addEventListener(
          _eventListeners$i.type,
          _eventListeners$i.listener,
          _eventListeners$i.optionsOrUseCapture
        );
      }
    parentHostFiber.appendChild(temp);
    event = temp.dispatchEvent(event);
    if (eventListeners)
      for (i = 0; i < eventListeners.length; i++)
        (_eventListeners$i = eventListeners[i]),
          temp.removeEventListener(
            _eventListeners$i.type,
            _eventListeners$i.listener,
            _eventListeners$i.optionsOrUseCapture
          );
    parentHostFiber.removeChild(temp);
    return event;
  }
  return parentHostFiber.dispatchEvent(event);
};
FragmentInstance.prototype.focus = function (focusOptions) {
  traverseVisibleHostChildren(
    this._fragmentFiber.child,
    !0,
    setFocusOnFiberIfFocusable,
    focusOptions,
    void 0,
    void 0
  );
};
function setFocusOnFiberIfFocusable(fiber, focusOptions) {
  fiber = getInstanceFromHostFiber(fiber);
  return setFocusIfFocusable(fiber, focusOptions);
}
FragmentInstance.prototype.focusLast = function (focusOptions) {
  var children = [];
  traverseVisibleHostChildren(
    this._fragmentFiber.child,
    !0,
    collectChildren,
    children,
    void 0,
    void 0
  );
  for (
    var i = children.length - 1;
    0 <= i && !setFocusOnFiberIfFocusable(children[i], focusOptions);
    i--
  );
};
function collectChildren(child, collection) {
  collection.push(child);
  return !1;
}
FragmentInstance.prototype.blur = function () {
  traverseVisibleHostChildren(
    this._fragmentFiber.child,
    !1,
    blurActiveElementWithinFragment,
    void 0,
    void 0,
    void 0
  );
};
function blurActiveElementWithinFragment(child) {
  child = getInstanceFromHostFiber(child);
  return child === child.ownerDocument.activeElement ? (child.blur(), !0) : !1;
}
FragmentInstance.prototype.observeUsing = function (observer) {
  null === this._observers && (this._observers = new Set());
  this._observers.add(observer);
  traverseVisibleHostChildren(
    this._fragmentFiber.child,
    !1,
    observeChild,
    observer,
    void 0,
    void 0
  );
};
function observeChild(child, observer) {
  child = getInstanceFromHostFiber(child);
  observer.observe(child);
  return !1;
}
FragmentInstance.prototype.unobserveUsing = function (observer) {
  var observers = this._observers;
  null !== observers &&
    observers.has(observer) &&
    (observers.delete(observer),
    traverseVisibleHostChildren(
      this._fragmentFiber.child,
      !1,
      unobserveChild,
      observer,
      void 0,
      void 0
    ));
};
function unobserveChild(child, observer) {
  child = getInstanceFromHostFiber(child);
  observer.unobserve(child);
  return !1;
}
FragmentInstance.prototype.getClientRects = function () {
  var rects = [];
  traverseVisibleHostChildren(
    this._fragmentFiber.child,
    !1,
    collectClientRects,
    rects,
    void 0,
    void 0
  );
  return rects;
};
function collectClientRects(child, rects) {
  child = getInstanceFromHostFiber(child);
  rects.push.apply(rects, child.getClientRects());
  return !1;
}
FragmentInstance.prototype.getRootNode = function (getRootNodeOptions) {
  var parentHostFiber = getFragmentParentHostFiber(this._fragmentFiber);
  return null === parentHostFiber
    ? this
    : getInstanceFromHostFiber(parentHostFiber).getRootNode(getRootNodeOptions);
};
FragmentInstance.prototype.compareDocumentPosition = function (otherNode) {
  var parentHostFiber = getFragmentParentHostFiber(this._fragmentFiber);
  if (null === parentHostFiber) return Node.DOCUMENT_POSITION_DISCONNECTED;
  var children = [];
  traverseVisibleHostChildren(
    this._fragmentFiber.child,
    !1,
    collectChildren,
    children,
    void 0,
    void 0
  );
  var parentHostInstance = getInstanceFromHostFiber(parentHostFiber);
  if (0 === children.length) {
    children = this._fragmentFiber;
    var parentResult = parentHostInstance.compareDocumentPosition(otherNode);
    parentHostFiber = parentResult;
    parentHostInstance === otherNode
      ? (parentHostFiber = Node.DOCUMENT_POSITION_CONTAINS)
      : parentResult & Node.DOCUMENT_POSITION_CONTAINED_BY &&
        (traverseVisibleHostChildren(children.sibling, !1, findNextSibling),
        (children = searchTarget),
        (searchTarget = null),
        null === children
          ? (parentHostFiber = Node.DOCUMENT_POSITION_PRECEDING)
          : ((otherNode =
              getInstanceFromHostFiber(children).compareDocumentPosition(
                otherNode
              )),
            (parentHostFiber =
              0 === otherNode || otherNode & Node.DOCUMENT_POSITION_FOLLOWING
                ? Node.DOCUMENT_POSITION_FOLLOWING
                : Node.DOCUMENT_POSITION_PRECEDING)));
    return (parentHostFiber |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC);
  }
  parentHostFiber = getInstanceFromHostFiber(children[0]);
  parentResult = getInstanceFromHostFiber(children[children.length - 1]);
  for (
    var firstInstance = getInstanceFromHostFiber(children[0]),
      foundPortalParent = !1,
      parent = this._fragmentFiber.return;
    null !== parent;

  ) {
    4 === parent.tag && (foundPortalParent = !0);
    if (3 === parent.tag || 5 === parent.tag) break;
    parent = parent.return;
  }
  firstInstance = foundPortalParent
    ? firstInstance.parentElement
    : parentHostInstance;
  if (null == firstInstance) return Node.DOCUMENT_POSITION_DISCONNECTED;
  parentHostInstance =
    firstInstance.compareDocumentPosition(parentHostFiber) &
    Node.DOCUMENT_POSITION_CONTAINED_BY;
  firstInstance =
    firstInstance.compareDocumentPosition(parentResult) &
    Node.DOCUMENT_POSITION_CONTAINED_BY;
  foundPortalParent = parentHostFiber.compareDocumentPosition(otherNode);
  var lastResult = parentResult.compareDocumentPosition(otherNode);
  parent =
    foundPortalParent & Node.DOCUMENT_POSITION_CONTAINED_BY ||
    lastResult & Node.DOCUMENT_POSITION_CONTAINED_BY;
  lastResult =
    parentHostInstance &&
    firstInstance &&
    foundPortalParent & Node.DOCUMENT_POSITION_FOLLOWING &&
    lastResult & Node.DOCUMENT_POSITION_PRECEDING;
  parentHostFiber =
    (parentHostInstance && parentHostFiber === otherNode) ||
    (firstInstance && parentResult === otherNode) ||
    parent ||
    lastResult
      ? Node.DOCUMENT_POSITION_CONTAINED_BY
      : (!parentHostInstance && parentHostFiber === otherNode) ||
          (!firstInstance && parentResult === otherNode)
        ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC
        : foundPortalParent;
  return parentHostFiber & Node.DOCUMENT_POSITION_DISCONNECTED ||
    parentHostFiber & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC ||
    validateDocumentPositionWithFiberTree(
      parentHostFiber,
      this._fragmentFiber,
      children[0],
      children[children.length - 1],
      otherNode
    )
    ? parentHostFiber
    : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
};
function validateDocumentPositionWithFiberTree(
  documentPosition,
  fragmentFiber,
  precedingBoundaryFiber,
  followingBoundaryFiber,
  otherNode
) {
  var otherFiber = getClosestInstanceFromNode(otherNode);
  if (documentPosition & Node.DOCUMENT_POSITION_CONTAINED_BY) {
    if ((precedingBoundaryFiber = !!otherFiber))
      a: {
        for (; null !== otherFiber; ) {
          if (
            7 === otherFiber.tag &&
            (otherFiber === fragmentFiber ||
              otherFiber.alternate === fragmentFiber)
          ) {
            precedingBoundaryFiber = !0;
            break a;
          }
          otherFiber = otherFiber.return;
        }
        precedingBoundaryFiber = !1;
      }
    return precedingBoundaryFiber;
  }
  if (documentPosition & Node.DOCUMENT_POSITION_CONTAINS) {
    if (null === otherFiber)
      return (
        (otherFiber = otherNode.ownerDocument),
        otherNode === otherFiber || otherNode === otherFiber.body
      );
    a: {
      otherFiber = fragmentFiber;
      for (
        fragmentFiber = getFragmentParentHostFiber(fragmentFiber);
        null !== otherFiber;

      ) {
        if (
          !(
            (5 !== otherFiber.tag && 3 !== otherFiber.tag) ||
            (otherFiber !== fragmentFiber &&
              otherFiber.alternate !== fragmentFiber)
          )
        ) {
          otherFiber = !0;
          break a;
        }
        otherFiber = otherFiber.return;
      }
      otherFiber = !1;
    }
    return otherFiber;
  }
  return documentPosition & Node.DOCUMENT_POSITION_PRECEDING
    ? ((fragmentFiber = !!otherFiber) &&
        !(fragmentFiber = otherFiber === precedingBoundaryFiber) &&
        ((fragmentFiber = getLowestCommonAncestor(
          precedingBoundaryFiber,
          otherFiber,
          getParentForFragmentAncestors
        )),
        null === fragmentFiber
          ? (fragmentFiber = !1)
          : (traverseVisibleHostChildren(
              fragmentFiber,
              !0,
              isFiberPrecedingCheck,
              otherFiber,
              precedingBoundaryFiber
            ),
            (otherFiber = searchTarget),
            (searchTarget = null),
            (fragmentFiber = null !== otherFiber))),
      fragmentFiber)
    : documentPosition & Node.DOCUMENT_POSITION_FOLLOWING
      ? ((fragmentFiber = !!otherFiber) &&
          !(fragmentFiber = otherFiber === followingBoundaryFiber) &&
          ((fragmentFiber = getLowestCommonAncestor(
            followingBoundaryFiber,
            otherFiber,
            getParentForFragmentAncestors
          )),
          null === fragmentFiber
            ? (fragmentFiber = !1)
            : (traverseVisibleHostChildren(
                fragmentFiber,
                !0,
                isFiberFollowingCheck,
                otherFiber,
                followingBoundaryFiber
              ),
              (otherFiber = searchTarget),
              (searchBoundary = searchTarget = null),
              (fragmentFiber = null !== otherFiber))),
        fragmentFiber)
      : !1;
}
enableFragmentRefsScrollIntoView &&
  (FragmentInstance.prototype.scrollIntoView = function (alignToTop) {
    if ("object" === typeof alignToTop)
      throw Error(formatProdErrorMessage(566));
    var children = [];
    traverseVisibleHostChildren(
      this._fragmentFiber.child,
      !1,
      collectChildren,
      children,
      void 0,
      void 0
    );
    var resolvedAlignToTop = !1 !== alignToTop;
    if (0 === children.length) {
      children = this._fragmentFiber;
      var result = [null, null],
        parentHostFiber = getFragmentParentHostFiber(children);
      null !== parentHostFiber &&
        findFragmentInstanceSiblings(result, children, parentHostFiber.child);
      resolvedAlignToTop = resolvedAlignToTop
        ? result[1] ||
          result[0] ||
          getFragmentParentHostFiber(this._fragmentFiber)
        : result[0] || result[1];
      null !== resolvedAlignToTop &&
        getInstanceFromHostFiber(resolvedAlignToTop).scrollIntoView(alignToTop);
    } else
      for (
        result = resolvedAlignToTop ? children.length - 1 : 0;
        result !== (resolvedAlignToTop ? -1 : children.length);

      )
        getInstanceFromHostFiber(children[result]).scrollIntoView(alignToTop),
          (result += resolvedAlignToTop ? -1 : 1);
  });
function commitNewChildToFragmentInstance(childInstance, fragmentInstance) {
  var eventListeners = fragmentInstance._eventListeners;
  if (null !== eventListeners)
    for (var i = 0; i < eventListeners.length; i++) {
      var _eventListeners$i3 = eventListeners[i];
      childInstance.addEventListener(
        _eventListeners$i3.type,
        _eventListeners$i3.listener,
        _eventListeners$i3.optionsOrUseCapture
      );
    }
  null !== fragmentInstance._observers &&
    fragmentInstance._observers.forEach(function (observer) {
      observer.observe(childInstance);
    });
}
function clearContainerSparingly(container) {
  var nextNode = container.firstChild;
  nextNode && 10 === nextNode.nodeType && (nextNode = nextNode.nextSibling);
  for (; nextNode; ) {
    var node = nextNode;
    nextNode = nextNode.nextSibling;
    switch (node.nodeName) {
      case "HTML":
      case "HEAD":
      case "BODY":
        clearContainerSparingly(node);
        detachDeletedInstance(node);
        continue;
      case "SCRIPT":
      case "STYLE":
        continue;
      case "LINK":
        if ("stylesheet" === node.rel.toLowerCase()) continue;
    }
    container.removeChild(node);
  }
}
function canHydrateInstance(instance, type, props, inRootOrSingleton) {
  for (; 1 === instance.nodeType; ) {
    var anyProps = props;
    if (instance.nodeName.toLowerCase() !== type.toLowerCase()) {
      if (
        !inRootOrSingleton &&
        ("INPUT" !== instance.nodeName || "hidden" !== instance.type)
      )
        break;
    } else if (!inRootOrSingleton)
      if ("input" === type && "hidden" === instance.type) {
        var name = null == anyProps.name ? null : "" + anyProps.name;
        if (
          "hidden" === anyProps.type &&
          instance.getAttribute("name") === name
        )
          return instance;
      } else return instance;
    else if (!instance[internalHoistableMarker])
      switch (type) {
        case "meta":
          if (!instance.hasAttribute("itemprop")) break;
          return instance;
        case "link":
          name = instance.getAttribute("rel");
          if ("stylesheet" === name && instance.hasAttribute("data-precedence"))
            break;
          else if (
            name !== anyProps.rel ||
            instance.getAttribute("href") !==
              (null == anyProps.href || "" === anyProps.href
                ? null
                : anyProps.href) ||
            instance.getAttribute("crossorigin") !==
              (null == anyProps.crossOrigin ? null : anyProps.crossOrigin) ||
            instance.getAttribute("title") !==
              (null == anyProps.title ? null : anyProps.title)
          )
            break;
          return instance;
        case "style":
          if (instance.hasAttribute("data-precedence")) break;
          return instance;
        case "script":
          name = instance.getAttribute("src");
          if (
            (name !== (null == anyProps.src ? null : anyProps.src) ||
              instance.getAttribute("type") !==
                (null == anyProps.type ? null : anyProps.type) ||
              instance.getAttribute("crossorigin") !==
                (null == anyProps.crossOrigin ? null : anyProps.crossOrigin)) &&
            name &&
            instance.hasAttribute("async") &&
            !instance.hasAttribute("itemprop")
          )
            break;
          return instance;
        default:
          return instance;
      }
    instance = getNextHydratable(instance.nextSibling);
    if (null === instance) break;
  }
  return null;
}
function canHydrateTextInstance(instance, text, inRootOrSingleton) {
  if ("" === text) return null;
  for (; 3 !== instance.nodeType; ) {
    if (
      (1 !== instance.nodeType ||
        "INPUT" !== instance.nodeName ||
        "hidden" !== instance.type) &&
      !inRootOrSingleton
    )
      return null;
    instance = getNextHydratable(instance.nextSibling);
    if (null === instance) return null;
  }
  return instance;
}
function canHydrateHydrationBoundary(instance, inRootOrSingleton) {
  for (; 8 !== instance.nodeType; ) {
    if (
      (1 !== instance.nodeType ||
        "INPUT" !== instance.nodeName ||
        "hidden" !== instance.type) &&
      !inRootOrSingleton
    )
      return null;
    instance = getNextHydratable(instance.nextSibling);
    if (null === instance) return null;
  }
  return instance;
}
function isSuspenseInstancePending(instance) {
  return "$?" === instance.data || "$~" === instance.data;
}
function isSuspenseInstanceFallback(instance) {
  return (
    "$!" === instance.data ||
    ("$?" === instance.data && "loading" !== instance.ownerDocument.readyState)
  );
}
function registerSuspenseInstanceRetry(instance, callback) {
  var ownerDocument = instance.ownerDocument;
  if ("$~" === instance.data) instance._reactRetry = callback;
  else if ("$?" !== instance.data || "loading" !== ownerDocument.readyState)
    callback();
  else {
    var listener = function () {
      callback();
      ownerDocument.removeEventListener("DOMContentLoaded", listener);
    };
    ownerDocument.addEventListener("DOMContentLoaded", listener);
    instance._reactRetry = listener;
  }
}
function getNextHydratable(node) {
  for (; null != node; node = node.nextSibling) {
    var nodeType = node.nodeType;
    if (1 === nodeType || 3 === nodeType) break;
    if (8 === nodeType) {
      nodeType = node.data;
      if (
        "$" === nodeType ||
        "$!" === nodeType ||
        "$?" === nodeType ||
        "$~" === nodeType ||
        "&" === nodeType ||
        "F!" === nodeType ||
        "F" === nodeType
      )
        break;
      if ("/$" === nodeType || "/&" === nodeType) return null;
    }
  }
  return node;
}
var previousHydratableOnEnteringScopedSingleton = null;
function getNextHydratableInstanceAfterHydrationBoundary(hydrationInstance) {
  hydrationInstance = hydrationInstance.nextSibling;
  for (var depth = 0; hydrationInstance; ) {
    if (8 === hydrationInstance.nodeType) {
      var data = hydrationInstance.data;
      if ("/$" === data || "/&" === data) {
        if (0 === depth)
          return getNextHydratable(hydrationInstance.nextSibling);
        depth--;
      } else
        ("$" !== data &&
          "$!" !== data &&
          "$?" !== data &&
          "$~" !== data &&
          "&" !== data) ||
          depth++;
    }
    hydrationInstance = hydrationInstance.nextSibling;
  }
  return null;
}
function getParentHydrationBoundary(targetInstance) {
  targetInstance = targetInstance.previousSibling;
  for (var depth = 0; targetInstance; ) {
    if (8 === targetInstance.nodeType) {
      var data = targetInstance.data;
      if (
        "$" === data ||
        "$!" === data ||
        "$?" === data ||
        "$~" === data ||
        "&" === data
      ) {
        if (0 === depth) return targetInstance;
        depth--;
      } else ("/$" !== data && "/&" !== data) || depth++;
    }
    targetInstance = targetInstance.previousSibling;
  }
  return null;
}
function setFocusIfFocusable(node, focusOptions) {
  function handleFocus() {
    didFocus = !0;
  }
  var didFocus = !1;
  try {
    node.addEventListener("focus", handleFocus),
      (node.focus || HTMLElement.prototype.focus).call(node, focusOptions);
  } finally {
    node.removeEventListener("focus", handleFocus);
  }
  return didFocus;
}
function resolveSingletonInstance(type, props, rootContainerInstance) {
  props = getOwnerDocumentFromRootContainer(rootContainerInstance);
  switch (type) {
    case "html":
      type = props.documentElement;
      if (!type) throw Error(formatProdErrorMessage(452));
      return type;
    case "head":
      type = props.head;
      if (!type) throw Error(formatProdErrorMessage(453));
      return type;
    case "body":
      type = props.body;
      if (!type) throw Error(formatProdErrorMessage(454));
      return type;
    default:
      throw Error(formatProdErrorMessage(451));
  }
}
function releaseSingletonInstance(instance) {
  for (var attributes = instance.attributes; attributes.length; )
    instance.removeAttributeNode(attributes[0]);
  detachDeletedInstance(instance);
}
var preloadPropsMap = new Map(),
  preconnectsSet = new Set();
function getHoistableRoot(container) {
  return "function" === typeof container.getRootNode
    ? container.getRootNode()
    : 9 === container.nodeType
      ? container
      : container.ownerDocument;
}
var previousDispatcher = ReactDOMSharedInternals.d;
ReactDOMSharedInternals.d = {
  f: previousDispatcher.f,
  r: requestFormReset,
  D: prefetchDNS,
  C: preconnect,
  L: preload,
  m: preloadModule,
  X: preinitScript,
  S: preinitStyle,
  M: preinitModuleScript
};
function requestFormReset(form) {
  var formInst = getInstanceFromNode(form);
  null !== formInst && 5 === formInst.tag && "form" === formInst.type
    ? requestFormReset$1(formInst)
    : previousDispatcher.r(form);
}
var globalDocument = "undefined" === typeof document ? null : document;
function preconnectAs(rel, href, crossOrigin) {
  var ownerDocument = globalDocument;
  if (ownerDocument && "string" === typeof href && href) {
    var limitedEscapedHref =
      escapeSelectorAttributeValueInsideDoubleQuotes(href);
    limitedEscapedHref =
      'link[rel="' + rel + '"][href="' + limitedEscapedHref + '"]';
    "string" === typeof crossOrigin &&
      (limitedEscapedHref += '[crossorigin="' + crossOrigin + '"]');
    preconnectsSet.has(limitedEscapedHref) ||
      (preconnectsSet.add(limitedEscapedHref),
      (rel = { rel: rel, crossOrigin: crossOrigin, href: href }),
      null === ownerDocument.querySelector(limitedEscapedHref) &&
        ((href = ownerDocument.createElement("link")),
        setInitialProperties(href, "link", rel),
        markNodeAsHoistable(href),
        ownerDocument.head.appendChild(href)));
  }
}
function prefetchDNS(href) {
  previousDispatcher.D(href);
  preconnectAs("dns-prefetch", href, null);
}
function preconnect(href, crossOrigin) {
  previousDispatcher.C(href, crossOrigin);
  preconnectAs("preconnect", href, crossOrigin);
}
function preload(href, as, options) {
  previousDispatcher.L(href, as, options);
  var ownerDocument = globalDocument;
  if (ownerDocument && href && as) {
    var preloadSelector =
      'link[rel="preload"][as="' +
      escapeSelectorAttributeValueInsideDoubleQuotes(as) +
      '"]';
    "image" === as
      ? options && options.imageSrcSet
        ? ((preloadSelector +=
            '[imagesrcset="' +
            escapeSelectorAttributeValueInsideDoubleQuotes(
              options.imageSrcSet
            ) +
            '"]'),
          "string" === typeof options.imageSizes &&
            (preloadSelector +=
              '[imagesizes="' +
              escapeSelectorAttributeValueInsideDoubleQuotes(
                options.imageSizes
              ) +
              '"]'))
        : (preloadSelector +=
            '[href="' +
            escapeSelectorAttributeValueInsideDoubleQuotes(href) +
            '"]')
      : (preloadSelector +=
          '[href="' +
          escapeSelectorAttributeValueInsideDoubleQuotes(href) +
          '"]');
    var key = preloadSelector;
    switch (as) {
      case "style":
        key = getStyleKey(href);
        break;
      case "script":
        key = getScriptKey(href);
    }
    preloadPropsMap.has(key) ||
      ((href = assign(
        {
          rel: "preload",
          href:
            "image" === as && options && options.imageSrcSet ? void 0 : href,
          as: as
        },
        options
      )),
      preloadPropsMap.set(key, href),
      null !== ownerDocument.querySelector(preloadSelector) ||
        ("style" === as &&
          ownerDocument.querySelector(getStylesheetSelectorFromKey(key))) ||
        ("script" === as &&
          ownerDocument.querySelector(getScriptSelectorFromKey(key))) ||
        ((as = ownerDocument.createElement("link")),
        setInitialProperties(as, "link", href),
        markNodeAsHoistable(as),
        ownerDocument.head.appendChild(as)));
  }
}
function preloadModule(href, options) {
  previousDispatcher.m(href, options);
  var ownerDocument = globalDocument;
  if (ownerDocument && href) {
    var as = options && "string" === typeof options.as ? options.as : "script",
      preloadSelector =
        'link[rel="modulepreload"][as="' +
        escapeSelectorAttributeValueInsideDoubleQuotes(as) +
        '"][href="' +
        escapeSelectorAttributeValueInsideDoubleQuotes(href) +
        '"]',
      key = preloadSelector;
    switch (as) {
      case "audioworklet":
      case "paintworklet":
      case "serviceworker":
      case "sharedworker":
      case "worker":
      case "script":
        key = getScriptKey(href);
    }
    if (
      !preloadPropsMap.has(key) &&
      ((href = assign({ rel: "modulepreload", href: href }, options)),
      preloadPropsMap.set(key, href),
      null === ownerDocument.querySelector(preloadSelector))
    ) {
      switch (as) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          if (ownerDocument.querySelector(getScriptSelectorFromKey(key)))
            return;
      }
      as = ownerDocument.createElement("link");
      setInitialProperties(as, "link", href);
      markNodeAsHoistable(as);
      ownerDocument.head.appendChild(as);
    }
  }
}
function preinitStyle(href, precedence, options) {
  previousDispatcher.S(href, precedence, options);
  var ownerDocument = globalDocument;
  if (ownerDocument && href) {
    var styles = getResourcesFromRoot(ownerDocument).hoistableStyles,
      key = getStyleKey(href);
    precedence = precedence || "default";
    var resource = styles.get(key);
    if (!resource) {
      var state = { loading: 0, preload: null };
      if (
        (resource = ownerDocument.querySelector(
          getStylesheetSelectorFromKey(key)
        ))
      )
        state.loading = 5;
      else {
        href = assign(
          { rel: "stylesheet", href: href, "data-precedence": precedence },
          options
        );
        (options = preloadPropsMap.get(key)) &&
          adoptPreloadPropsForStylesheet(href, options);
        var link = (resource = ownerDocument.createElement("link"));
        markNodeAsHoistable(link);
        setInitialProperties(link, "link", href);
        link._p = new Promise(function (resolve, reject) {
          link.onload = resolve;
          link.onerror = reject;
        });
        link.addEventListener("load", function () {
          state.loading |= 1;
        });
        link.addEventListener("error", function () {
          state.loading |= 2;
        });
        state.loading |= 4;
        insertStylesheet(resource, precedence, ownerDocument);
      }
      resource = {
        type: "stylesheet",
        instance: resource,
        count: 1,
        state: state
      };
      styles.set(key, resource);
    }
  }
}
function preinitScript(src, options) {
  previousDispatcher.X(src, options);
  var ownerDocument = globalDocument;
  if (ownerDocument && src) {
    var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts,
      key = getScriptKey(src),
      resource = scripts.get(key);
    resource ||
      ((resource = ownerDocument.querySelector(getScriptSelectorFromKey(key))),
      resource ||
        ((src = assign({ src: src, async: !0 }, options)),
        (options = preloadPropsMap.get(key)) &&
          adoptPreloadPropsForScript(src, options),
        (resource = ownerDocument.createElement("script")),
        markNodeAsHoistable(resource),
        setInitialProperties(resource, "link", src),
        ownerDocument.head.appendChild(resource)),
      (resource = {
        type: "script",
        instance: resource,
        count: 1,
        state: null
      }),
      scripts.set(key, resource));
  }
}
function preinitModuleScript(src, options) {
  previousDispatcher.M(src, options);
  var ownerDocument = globalDocument;
  if (ownerDocument && src) {
    var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts,
      key = getScriptKey(src),
      resource = scripts.get(key);
    resource ||
      ((resource = ownerDocument.querySelector(getScriptSelectorFromKey(key))),
      resource ||
        ((src = assign({ src: src, async: !0, type: "module" }, options)),
        (options = preloadPropsMap.get(key)) &&
          adoptPreloadPropsForScript(src, options),
        (resource = ownerDocument.createElement("script")),
        markNodeAsHoistable(resource),
        setInitialProperties(resource, "link", src),
        ownerDocument.head.appendChild(resource)),
      (resource = {
        type: "script",
        instance: resource,
        count: 1,
        state: null
      }),
      scripts.set(key, resource));
  }
}
function getResource(type, currentProps, pendingProps, currentResource) {
  var JSCompiler_inline_result = (JSCompiler_inline_result =
    rootInstanceStackCursor.current)
    ? getHoistableRoot(JSCompiler_inline_result)
    : null;
  if (!JSCompiler_inline_result) throw Error(formatProdErrorMessage(446));
  switch (type) {
    case "meta":
    case "title":
      return null;
    case "style":
      return "string" === typeof pendingProps.precedence &&
        "string" === typeof pendingProps.href
        ? ((currentProps = getStyleKey(pendingProps.href)),
          (pendingProps = getResourcesFromRoot(
            JSCompiler_inline_result
          ).hoistableStyles),
          (currentResource = pendingProps.get(currentProps)),
          currentResource ||
            ((currentResource = {
              type: "style",
              instance: null,
              count: 0,
              state: null
            }),
            pendingProps.set(currentProps, currentResource)),
          currentResource)
        : { type: "void", instance: null, count: 0, state: null };
    case "link":
      if (
        "stylesheet" === pendingProps.rel &&
        "string" === typeof pendingProps.href &&
        "string" === typeof pendingProps.precedence
      ) {
        type = getStyleKey(pendingProps.href);
        var styles$309 = getResourcesFromRoot(
            JSCompiler_inline_result
          ).hoistableStyles,
          resource$310 = styles$309.get(type);
        resource$310 ||
          ((JSCompiler_inline_result =
            JSCompiler_inline_result.ownerDocument || JSCompiler_inline_result),
          (resource$310 = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: { loading: 0, preload: null }
          }),
          styles$309.set(type, resource$310),
          (styles$309 = JSCompiler_inline_result.querySelector(
            getStylesheetSelectorFromKey(type)
          )) &&
            !styles$309._p &&
            ((resource$310.instance = styles$309),
            (resource$310.state.loading = 5)),
          preloadPropsMap.has(type) ||
            ((pendingProps = {
              rel: "preload",
              as: "style",
              href: pendingProps.href,
              crossOrigin: pendingProps.crossOrigin,
              integrity: pendingProps.integrity,
              media: pendingProps.media,
              hrefLang: pendingProps.hrefLang,
              referrerPolicy: pendingProps.referrerPolicy
            }),
            preloadPropsMap.set(type, pendingProps),
            styles$309 ||
              preloadStylesheet(
                JSCompiler_inline_result,
                type,
                pendingProps,
                resource$310.state
              )));
        if (currentProps && null === currentResource)
          throw Error(formatProdErrorMessage(528, ""));
        return resource$310;
      }
      if (currentProps && null !== currentResource)
        throw Error(formatProdErrorMessage(529, ""));
      return null;
    case "script":
      return (
        (currentProps = pendingProps.async),
        (pendingProps = pendingProps.src),
        "string" === typeof pendingProps &&
        currentProps &&
        "function" !== typeof currentProps &&
        "symbol" !== typeof currentProps
          ? ((currentProps = getScriptKey(pendingProps)),
            (pendingProps = getResourcesFromRoot(
              JSCompiler_inline_result
            ).hoistableScripts),
            (currentResource = pendingProps.get(currentProps)),
            currentResource ||
              ((currentResource = {
                type: "script",
                instance: null,
                count: 0,
                state: null
              }),
              pendingProps.set(currentProps, currentResource)),
            currentResource)
          : { type: "void", instance: null, count: 0, state: null }
      );
    default:
      throw Error(formatProdErrorMessage(444, type));
  }
}
function getStyleKey(href) {
  return 'href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"';
}
function getStylesheetSelectorFromKey(key) {
  return 'link[rel="stylesheet"][' + key + "]";
}
function stylesheetPropsFromRawProps(rawProps) {
  return assign({}, rawProps, {
    "data-precedence": rawProps.precedence,
    precedence: null
  });
}
function preloadStylesheet(ownerDocument, key, preloadProps, state) {
  ownerDocument.querySelector('link[rel="preload"][as="style"][' + key + "]")
    ? (state.loading = 1)
    : ((key = ownerDocument.createElement("link")),
      (state.preload = key),
      key.addEventListener("load", function () {
        return (state.loading |= 1);
      }),
      key.addEventListener("error", function () {
        return (state.loading |= 2);
      }),
      setInitialProperties(key, "link", preloadProps),
      markNodeAsHoistable(key),
      ownerDocument.head.appendChild(key));
}
function getScriptKey(src) {
  return '[src="' + escapeSelectorAttributeValueInsideDoubleQuotes(src) + '"]';
}
function getScriptSelectorFromKey(key) {
  return "script[async]" + key;
}
function acquireResource(hoistableRoot, resource, props) {
  resource.count++;
  if (null === resource.instance)
    switch (resource.type) {
      case "style":
        var instance = hoistableRoot.querySelector(
          'style[data-href~="' +
            escapeSelectorAttributeValueInsideDoubleQuotes(props.href) +
            '"]'
        );
        if (instance)
          return (
            (resource.instance = instance),
            markNodeAsHoistable(instance),
            instance
          );
        var styleProps = assign({}, props, {
          "data-href": props.href,
          "data-precedence": props.precedence,
          href: null,
          precedence: null
        });
        instance = (hoistableRoot.ownerDocument || hoistableRoot).createElement(
          "style"
        );
        markNodeAsHoistable(instance);
        setInitialProperties(instance, "style", styleProps);
        insertStylesheet(instance, props.precedence, hoistableRoot);
        return (resource.instance = instance);
      case "stylesheet":
        styleProps = getStyleKey(props.href);
        var instance$315 = hoistableRoot.querySelector(
          getStylesheetSelectorFromKey(styleProps)
        );
        if (instance$315)
          return (
            (resource.state.loading |= 4),
            (resource.instance = instance$315),
            markNodeAsHoistable(instance$315),
            instance$315
          );
        instance = stylesheetPropsFromRawProps(props);
        (styleProps = preloadPropsMap.get(styleProps)) &&
          adoptPreloadPropsForStylesheet(instance, styleProps);
        instance$315 = (
          hoistableRoot.ownerDocument || hoistableRoot
        ).createElement("link");
        markNodeAsHoistable(instance$315);
        var linkInstance = instance$315;
        linkInstance._p = new Promise(function (resolve, reject) {
          linkInstance.onload = resolve;
          linkInstance.onerror = reject;
        });
        setInitialProperties(instance$315, "link", instance);
        resource.state.loading |= 4;
        insertStylesheet(instance$315, props.precedence, hoistableRoot);
        return (resource.instance = instance$315);
      case "script":
        instance$315 = getScriptKey(props.src);
        if (
          (styleProps = hoistableRoot.querySelector(
            getScriptSelectorFromKey(instance$315)
          ))
        )
          return (
            (resource.instance = styleProps),
            markNodeAsHoistable(styleProps),
            styleProps
          );
        instance = props;
        if ((styleProps = preloadPropsMap.get(instance$315)))
          (instance = assign({}, props)),
            adoptPreloadPropsForScript(instance, styleProps);
        hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
        styleProps = hoistableRoot.createElement("script");
        markNodeAsHoistable(styleProps);
        setInitialProperties(styleProps, "link", instance);
        hoistableRoot.head.appendChild(styleProps);
        return (resource.instance = styleProps);
      case "void":
        return null;
      default:
        throw Error(formatProdErrorMessage(443, resource.type));
    }
  else
    "stylesheet" === resource.type &&
      0 === (resource.state.loading & 4) &&
      ((instance = resource.instance),
      (resource.state.loading |= 4),
      insertStylesheet(instance, props.precedence, hoistableRoot));
  return resource.instance;
}
function insertStylesheet(instance, precedence, root) {
  for (
    var nodes = root.querySelectorAll(
        'link[rel="stylesheet"][data-precedence],style[data-precedence]'
      ),
      last = nodes.length ? nodes[nodes.length - 1] : null,
      prior = last,
      i = 0;
    i < nodes.length;
    i++
  ) {
    var node = nodes[i];
    if (node.dataset.precedence === precedence) prior = node;
    else if (prior !== last) break;
  }
  prior
    ? prior.parentNode.insertBefore(instance, prior.nextSibling)
    : ((precedence = 9 === root.nodeType ? root.head : root),
      precedence.insertBefore(instance, precedence.firstChild));
}
function adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps) {
  null == stylesheetProps.crossOrigin &&
    (stylesheetProps.crossOrigin = preloadProps.crossOrigin);
  null == stylesheetProps.referrerPolicy &&
    (stylesheetProps.referrerPolicy = preloadProps.referrerPolicy);
  null == stylesheetProps.title && (stylesheetProps.title = preloadProps.title);
}
function adoptPreloadPropsForScript(scriptProps, preloadProps) {
  null == scriptProps.crossOrigin &&
    (scriptProps.crossOrigin = preloadProps.crossOrigin);
  null == scriptProps.referrerPolicy &&
    (scriptProps.referrerPolicy = preloadProps.referrerPolicy);
  null == scriptProps.integrity &&
    (scriptProps.integrity = preloadProps.integrity);
}
var tagCaches = null;
function getHydratableHoistableCache(type, keyAttribute, ownerDocument) {
  if (null === tagCaches) {
    var cache = new Map();
    var caches = (tagCaches = new Map());
    caches.set(ownerDocument, cache);
  } else
    (caches = tagCaches),
      (cache = caches.get(ownerDocument)),
      cache || ((cache = new Map()), caches.set(ownerDocument, cache));
  if (cache.has(type)) return cache;
  cache.set(type, null);
  ownerDocument = ownerDocument.getElementsByTagName(type);
  for (caches = 0; caches < ownerDocument.length; caches++) {
    var node = ownerDocument[caches];
    if (
      !(
        node[internalHoistableMarker] ||
        node[internalInstanceKey] ||
        ("link" === type && "stylesheet" === node.getAttribute("rel"))
      ) &&
      "http://www.w3.org/2000/svg" !== node.namespaceURI
    ) {
      var nodeKey = node.getAttribute(keyAttribute) || "";
      nodeKey = type + nodeKey;
      var existing = cache.get(nodeKey);
      existing ? existing.push(node) : cache.set(nodeKey, [node]);
    }
  }
  return cache;
}
function mountHoistable(hoistableRoot, type, instance) {
  hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
  hoistableRoot.head.insertBefore(
    instance,
    "title" === type ? hoistableRoot.querySelector("head > title") : null
  );
}
function isHostHoistableType(type, props, hostContext) {
  if (1 === hostContext || null != props.itemProp) return !1;
  switch (type) {
    case "meta":
    case "title":
      return !0;
    case "style":
      if (
        "string" !== typeof props.precedence ||
        "string" !== typeof props.href ||
        "" === props.href
      )
        break;
      return !0;
    case "link":
      if (
        "string" !== typeof props.rel ||
        "string" !== typeof props.href ||
        "" === props.href ||
        props.onLoad ||
        props.onError
      )
        break;
      switch (props.rel) {
        case "stylesheet":
          return (
            (type = props.disabled),
            "string" === typeof props.precedence && null == type
          );
        default:
          return !0;
      }
    case "script":
      if (
        props.async &&
        "function" !== typeof props.async &&
        "symbol" !== typeof props.async &&
        !props.onLoad &&
        !props.onError &&
        props.src &&
        "string" === typeof props.src
      )
        return !0;
  }
  return !1;
}
function preloadResource(resource) {
  return "stylesheet" === resource.type && 0 === (resource.state.loading & 3)
    ? !1
    : !0;
}
function suspendResource(state, hoistableRoot, resource, props) {
  if (
    "stylesheet" === resource.type &&
    ("string" !== typeof props.media ||
      !1 !== matchMedia(props.media).matches) &&
    0 === (resource.state.loading & 4)
  ) {
    if (null === resource.instance) {
      var key = getStyleKey(props.href),
        instance = hoistableRoot.querySelector(
          getStylesheetSelectorFromKey(key)
        );
      if (instance) {
        hoistableRoot = instance._p;
        null !== hoistableRoot &&
          "object" === typeof hoistableRoot &&
          "function" === typeof hoistableRoot.then &&
          (state.count++,
          (state = onUnsuspend.bind(state)),
          hoistableRoot.then(state, state));
        resource.state.loading |= 4;
        resource.instance = instance;
        markNodeAsHoistable(instance);
        return;
      }
      instance = hoistableRoot.ownerDocument || hoistableRoot;
      props = stylesheetPropsFromRawProps(props);
      (key = preloadPropsMap.get(key)) &&
        adoptPreloadPropsForStylesheet(props, key);
      instance = instance.createElement("link");
      markNodeAsHoistable(instance);
      var linkInstance = instance;
      linkInstance._p = new Promise(function (resolve, reject) {
        linkInstance.onload = resolve;
        linkInstance.onerror = reject;
      });
      setInitialProperties(instance, "link", props);
      resource.instance = instance;
    }
    null === state.stylesheets && (state.stylesheets = new Map());
    state.stylesheets.set(resource, hoistableRoot);
    (hoistableRoot = resource.state.preload) &&
      0 === (resource.state.loading & 3) &&
      (state.count++,
      (resource = onUnsuspend.bind(state)),
      hoistableRoot.addEventListener("load", resource),
      hoistableRoot.addEventListener("error", resource));
  }
}
var estimatedBytesWithinLimit = 0;
function waitForCommitToBeReady(state, timeoutOffset) {
  state.stylesheets &&
    0 === state.count &&
    insertSuspendedStylesheets(state, state.stylesheets);
  return 0 < state.count || 0 < state.imgCount
    ? function (commit) {
        var stylesheetTimer = setTimeout(function () {
          state.stylesheets &&
            insertSuspendedStylesheets(state, state.stylesheets);
          if (state.unsuspend) {
            var unsuspend = state.unsuspend;
            state.unsuspend = null;
            unsuspend();
          }
        }, 6e4 + timeoutOffset);
        0 < state.imgBytes &&
          0 === estimatedBytesWithinLimit &&
          (estimatedBytesWithinLimit = 62500 * estimateBandwidth());
        var imgTimer = setTimeout(
          function () {
            state.waitingForImages = !1;
            if (
              0 === state.count &&
              (state.stylesheets &&
                insertSuspendedStylesheets(state, state.stylesheets),
              state.unsuspend)
            ) {
              var unsuspend = state.unsuspend;
              state.unsuspend = null;
              unsuspend();
            }
          },
          (state.imgBytes > estimatedBytesWithinLimit ? 50 : 800) +
            timeoutOffset
        );
        state.unsuspend = commit;
        return function () {
          state.unsuspend = null;
          clearTimeout(stylesheetTimer);
          clearTimeout(imgTimer);
        };
      }
    : null;
}
function onUnsuspend() {
  this.count--;
  if (0 === this.count && (0 === this.imgCount || !this.waitingForImages))
    if (this.stylesheets) insertSuspendedStylesheets(this, this.stylesheets);
    else if (this.unsuspend) {
      var unsuspend = this.unsuspend;
      this.unsuspend = null;
      unsuspend();
    }
}
var precedencesByRoot = null;
function insertSuspendedStylesheets(state, resources) {
  state.stylesheets = null;
  null !== state.unsuspend &&
    (state.count++,
    (precedencesByRoot = new Map()),
    resources.forEach(insertStylesheetIntoRoot, state),
    (precedencesByRoot = null),
    onUnsuspend.call(state));
}
function insertStylesheetIntoRoot(root, resource) {
  if (!(resource.state.loading & 4)) {
    var precedences = precedencesByRoot.get(root);
    if (precedences) var last = precedences.get(null);
    else {
      precedences = new Map();
      precedencesByRoot.set(root, precedences);
      for (
        var nodes = root.querySelectorAll(
            "link[data-precedence],style[data-precedence]"
          ),
          i = 0;
        i < nodes.length;
        i++
      ) {
        var node = nodes[i];
        if (
          "LINK" === node.nodeName ||
          "not all" !== node.getAttribute("media")
        )
          precedences.set(node.dataset.precedence, node), (last = node);
      }
      last && precedences.set(null, last);
    }
    nodes = resource.instance;
    node = nodes.getAttribute("data-precedence");
    i = precedences.get(node) || last;
    i === last && precedences.set(null, nodes);
    precedences.set(node, nodes);
    this.count++;
    last = onUnsuspend.bind(this);
    nodes.addEventListener("load", last);
    nodes.addEventListener("error", last);
    i
      ? i.parentNode.insertBefore(nodes, i.nextSibling)
      : ((root = 9 === root.nodeType ? root.head : root),
        root.insertBefore(nodes, root.firstChild));
    resource.state.loading |= 4;
  }
}
var HostTransitionContext = {
  $$typeof: REACT_CONTEXT_TYPE,
  Provider: null,
  Consumer: null,
  _currentValue: sharedNotPendingObject,
  _currentValue2: sharedNotPendingObject,
  _threadCount: 0
};
function FiberRootNode(
  containerInfo,
  tag,
  hydrate,
  identifierPrefix,
  onUncaughtError,
  onCaughtError,
  onRecoverableError,
  onDefaultTransitionIndicator,
  formState
) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.callbackNode =
    this.next =
    this.pendingContext =
    this.context =
    this.cancelPendingCommit =
      null;
  this.callbackPriority = 0;
  this.expirationTimes = createLaneMap(-1);
  this.entangledLanes =
    this.shellSuspendCounter =
    this.errorRecoveryDisabledLanes =
    this.indicatorLanes =
    this.expiredLanes =
    this.warmLanes =
    this.pingedLanes =
    this.suspendedLanes =
    this.pendingLanes =
      0;
  this.entanglements = createLaneMap(0);
  this.hiddenUpdates = createLaneMap(null);
  this.identifierPrefix = identifierPrefix;
  this.onUncaughtError = onUncaughtError;
  this.onCaughtError = onCaughtError;
  this.onRecoverableError = onRecoverableError;
  this.onDefaultTransitionIndicator = onDefaultTransitionIndicator;
  this.pooledCache = this.pendingIndicator = null;
  this.pooledCacheLanes = 0;
  this.hydrationCallbacks = null;
  this.formState = formState;
  this.incompleteTransitions = new Map();
  this.passiveEffectDuration = this.effectDuration = -0;
  this.memoizedUpdaters = new Set();
  containerInfo = this.pendingUpdatersLaneMap = [];
  for (tag = 0; 31 > tag; tag++) containerInfo.push(new Set());
}
function createFiberRoot(
  containerInfo,
  tag,
  hydrate,
  initialChildren,
  hydrationCallbacks,
  isStrictMode,
  identifierPrefix,
  formState,
  onUncaughtError,
  onCaughtError,
  onRecoverableError,
  onDefaultTransitionIndicator
) {
  containerInfo = new FiberRootNode(
    containerInfo,
    tag,
    hydrate,
    identifierPrefix,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    onDefaultTransitionIndicator,
    formState
  );
  containerInfo.hydrationCallbacks = hydrationCallbacks;
  1 === tag ? ((tag = 1), !0 === isStrictMode && (tag |= 24)) : (tag = 0);
  isDevToolsPresent && (tag |= 2);
  isStrictMode = createFiber(3, null, null, tag);
  containerInfo.current = isStrictMode;
  isStrictMode.stateNode = containerInfo;
  tag = createCache();
  tag.refCount++;
  containerInfo.pooledCache = tag;
  tag.refCount++;
  isStrictMode.memoizedState = {
    element: initialChildren,
    isDehydrated: hydrate,
    cache: tag
  };
  initializeUpdateQueue(isStrictMode);
  return containerInfo;
}
function getContextForSubtree(parentComponent) {
  if (!parentComponent) return emptyContextObject;
  parentComponent = parentComponent._reactInternals;
  a: {
    var JSCompiler_inline_result = parentComponent;
    do {
      switch (JSCompiler_inline_result.tag) {
        case 3:
          JSCompiler_inline_result = JSCompiler_inline_result.stateNode.context;
          break a;
        case 1:
          if (isContextProvider(JSCompiler_inline_result.type)) {
            JSCompiler_inline_result =
              JSCompiler_inline_result.stateNode
                .__reactInternalMemoizedMergedChildContext;
            break a;
          }
      }
      JSCompiler_inline_result = JSCompiler_inline_result.return;
    } while (null !== JSCompiler_inline_result);
    throw Error(formatProdErrorMessage(171));
  }
  if (1 === parentComponent.tag) {
    var Component = parentComponent.type;
    if (isContextProvider(Component))
      return processChildContext(
        parentComponent,
        Component,
        JSCompiler_inline_result
      );
  }
  return JSCompiler_inline_result;
}
function updateContainerImpl(
  rootFiber,
  lane,
  element,
  container,
  parentComponent,
  callback
) {
  null !== injectedProfilingHooks &&
    "function" === typeof injectedProfilingHooks.markRenderScheduled &&
    injectedProfilingHooks.markRenderScheduled(lane);
  parentComponent = getContextForSubtree(parentComponent);
  null === container.context
    ? (container.context = parentComponent)
    : (container.pendingContext = parentComponent);
  container = createUpdate(lane);
  container.payload = { element: element };
  callback = void 0 === callback ? null : callback;
  null !== callback && (container.callback = callback);
  element = enqueueUpdate(rootFiber, container, lane);
  null !== element &&
    (startUpdateTimerByLane(lane),
    scheduleUpdateOnFiber(element, rootFiber, lane),
    entangleTransitions(element, rootFiber, lane));
}
function markRetryLaneImpl(fiber, retryLane) {
  fiber = fiber.memoizedState;
  if (null !== fiber && null !== fiber.dehydrated) {
    var a = fiber.retryLane;
    fiber.retryLane = 0 !== a && a < retryLane ? a : retryLane;
  }
}
function markRetryLaneIfNotHydrated(fiber, retryLane) {
  markRetryLaneImpl(fiber, retryLane);
  (fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
}
function attemptContinuousHydration(fiber) {
  if (13 === fiber.tag || 31 === fiber.tag) {
    var root = enqueueConcurrentRenderForLane(fiber, 67108864);
    null !== root && scheduleUpdateOnFiber(root, fiber, 67108864);
    markRetryLaneIfNotHydrated(fiber, 67108864);
  }
}
function attemptHydrationAtCurrentPriority(fiber) {
  if (13 === fiber.tag || 31 === fiber.tag) {
    var lane = requestUpdateLane(fiber);
    lane = getBumpedLaneForHydrationByLane(lane);
    var root = enqueueConcurrentRenderForLane(fiber, lane);
    null !== root && scheduleUpdateOnFiber(root, fiber, lane);
    markRetryLaneIfNotHydrated(fiber, lane);
  }
}
var _enabled = !0;
function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  var prevTransition = ReactSharedInternals.T;
  ReactSharedInternals.T = null;
  var previousPriority = ReactDOMSharedInternals.p;
  try {
    (ReactDOMSharedInternals.p = 2),
      dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    (ReactDOMSharedInternals.p = previousPriority),
      (ReactSharedInternals.T = prevTransition);
  }
}
function dispatchContinuousEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  var prevTransition = ReactSharedInternals.T;
  ReactSharedInternals.T = null;
  var previousPriority = ReactDOMSharedInternals.p;
  try {
    (ReactDOMSharedInternals.p = 8),
      dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    (ReactDOMSharedInternals.p = previousPriority),
      (ReactSharedInternals.T = prevTransition);
  }
}
function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  if (_enabled) {
    var blockedOn = findInstanceBlockingEvent(nativeEvent);
    if (null === blockedOn)
      dispatchEventForPluginEventSystem(
        domEventName,
        eventSystemFlags,
        nativeEvent,
        return_targetInst,
        targetContainer
      ),
        clearIfContinuousEvent(domEventName, nativeEvent);
    else if (
      queueIfContinuousEvent(
        blockedOn,
        domEventName,
        eventSystemFlags,
        targetContainer,
        nativeEvent
      )
    )
      nativeEvent.stopPropagation();
    else if (
      (clearIfContinuousEvent(domEventName, nativeEvent),
      eventSystemFlags & 4 &&
        -1 < discreteReplayableEvents.indexOf(domEventName))
    ) {
      for (; null !== blockedOn; ) {
        var fiber = getInstanceFromNode(blockedOn);
        if (null !== fiber)
          switch (fiber.tag) {
            case 3:
              fiber = fiber.stateNode;
              if (fiber.current.memoizedState.isDehydrated) {
                var lanes = getHighestPriorityLanes(fiber.pendingLanes);
                if (0 !== lanes) {
                  var root = fiber;
                  root.pendingLanes |= 2;
                  for (root.entangledLanes |= 2; lanes; ) {
                    var lane = 1 << (31 - clz32(lanes));
                    root.entanglements[1] |= lane;
                    lanes &= ~lane;
                  }
                  ensureRootIsScheduled(fiber);
                  0 === (executionContext & 6) &&
                    ((workInProgressRootRenderTargetTime = now$1() + 500),
                    flushSyncWorkAcrossRoots_impl(0, !1));
                }
              }
              break;
            case 31:
            case 13:
              (root = enqueueConcurrentRenderForLane(fiber, 2)),
                null !== root && scheduleUpdateOnFiber(root, fiber, 2),
                flushSyncWork(),
                markRetryLaneIfNotHydrated(fiber, 2);
          }
        fiber = findInstanceBlockingEvent(nativeEvent);
        null === fiber &&
          dispatchEventForPluginEventSystem(
            domEventName,
            eventSystemFlags,
            nativeEvent,
            return_targetInst,
            targetContainer
          );
        if (fiber === blockedOn) break;
        blockedOn = fiber;
      }
      null !== blockedOn && nativeEvent.stopPropagation();
    } else
      dispatchEventForPluginEventSystem(
        domEventName,
        eventSystemFlags,
        nativeEvent,
        null,
        targetContainer
      );
  }
}
function findInstanceBlockingEvent(nativeEvent) {
  nativeEvent = getEventTarget(nativeEvent);
  return findInstanceBlockingTarget(nativeEvent);
}
var return_targetInst = null;
function findInstanceBlockingTarget(targetNode) {
  return_targetInst = null;
  targetNode = getClosestInstanceFromNode(targetNode);
  if (null !== targetNode) {
    var nearestMounted = getNearestMountedFiber(targetNode);
    if (null === nearestMounted) targetNode = null;
    else {
      var tag = nearestMounted.tag;
      if (13 === tag) {
        targetNode = getSuspenseInstanceFromFiber(nearestMounted);
        if (null !== targetNode) return targetNode;
        targetNode = null;
      } else if (31 === tag) {
        targetNode = getActivityInstanceFromFiber(nearestMounted);
        if (null !== targetNode) return targetNode;
        targetNode = null;
      } else if (3 === tag) {
        if (nearestMounted.stateNode.current.memoizedState.isDehydrated)
          return 3 === nearestMounted.tag
            ? nearestMounted.stateNode.containerInfo
            : null;
        targetNode = null;
      } else nearestMounted !== targetNode && (targetNode = null);
    }
  }
  return_targetInst = targetNode;
  return null;
}
function getEventPriority(domEventName) {
  switch (domEventName) {
    case "beforetoggle":
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "toggle":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 2;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 8;
    case "message":
      switch (getCurrentPriorityLevel()) {
        case ImmediatePriority:
          return 2;
        case UserBlockingPriority:
          return 8;
        case NormalPriority$1:
        case LowPriority:
          return 32;
        case IdlePriority:
          return 268435456;
        default:
          return 32;
      }
    default:
      return 32;
  }
}
var hasScheduledReplayAttempt = !1,
  queuedFocus = null,
  queuedDrag = null,
  queuedMouse = null,
  queuedPointers = new Map(),
  queuedPointerCaptures = new Map(),
  queuedChangeEventTargets = [],
  queuedExplicitHydrationTargets = [],
  discreteReplayableEvents =
    "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
      " "
    );
function clearIfContinuousEvent(domEventName, nativeEvent) {
  switch (domEventName) {
    case "focusin":
    case "focusout":
      queuedFocus = null;
      break;
    case "dragenter":
    case "dragleave":
      queuedDrag = null;
      break;
    case "mouseover":
    case "mouseout":
      queuedMouse = null;
      break;
    case "pointerover":
    case "pointerout":
      queuedPointers.delete(nativeEvent.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      queuedPointerCaptures.delete(nativeEvent.pointerId);
  }
}
function accumulateOrCreateContinuousQueuedReplayableEvent(
  existingQueuedEvent,
  blockedOn,
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  if (
    null === existingQueuedEvent ||
    existingQueuedEvent.nativeEvent !== nativeEvent
  )
    return (
      (existingQueuedEvent = {
        blockedOn: blockedOn,
        domEventName: domEventName,
        eventSystemFlags: eventSystemFlags,
        nativeEvent: nativeEvent,
        targetContainers: [targetContainer]
      }),
      null !== blockedOn &&
        ((blockedOn = getInstanceFromNode(blockedOn)),
        null !== blockedOn && attemptContinuousHydration(blockedOn)),
      existingQueuedEvent
    );
  existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
  blockedOn = existingQueuedEvent.targetContainers;
  null !== targetContainer &&
    -1 === blockedOn.indexOf(targetContainer) &&
    blockedOn.push(targetContainer);
  return existingQueuedEvent;
}
function queueIfContinuousEvent(
  blockedOn,
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  switch (domEventName) {
    case "focusin":
      return (
        (queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedFocus,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          nativeEvent
        )),
        !0
      );
    case "dragenter":
      return (
        (queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedDrag,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          nativeEvent
        )),
        !0
      );
    case "mouseover":
      return (
        (queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedMouse,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          nativeEvent
        )),
        !0
      );
    case "pointerover":
      var pointerId = nativeEvent.pointerId;
      queuedPointers.set(
        pointerId,
        accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedPointers.get(pointerId) || null,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          nativeEvent
        )
      );
      return !0;
    case "gotpointercapture":
      return (
        (pointerId = nativeEvent.pointerId),
        queuedPointerCaptures.set(
          pointerId,
          accumulateOrCreateContinuousQueuedReplayableEvent(
            queuedPointerCaptures.get(pointerId) || null,
            blockedOn,
            domEventName,
            eventSystemFlags,
            targetContainer,
            nativeEvent
          )
        ),
        !0
      );
  }
  return !1;
}
function attemptExplicitHydrationTarget(queuedTarget) {
  var targetInst = getClosestInstanceFromNode(queuedTarget.target);
  if (null !== targetInst) {
    var nearestMounted = getNearestMountedFiber(targetInst);
    if (null !== nearestMounted)
      if (((targetInst = nearestMounted.tag), 13 === targetInst)) {
        if (
          ((targetInst = getSuspenseInstanceFromFiber(nearestMounted)),
          null !== targetInst)
        ) {
          queuedTarget.blockedOn = targetInst;
          runWithPriority(queuedTarget.priority, function () {
            attemptHydrationAtCurrentPriority(nearestMounted);
          });
          return;
        }
      } else if (31 === targetInst) {
        if (
          ((targetInst = getActivityInstanceFromFiber(nearestMounted)),
          null !== targetInst)
        ) {
          queuedTarget.blockedOn = targetInst;
          runWithPriority(queuedTarget.priority, function () {
            attemptHydrationAtCurrentPriority(nearestMounted);
          });
          return;
        }
      } else if (
        3 === targetInst &&
        nearestMounted.stateNode.current.memoizedState.isDehydrated
      ) {
        queuedTarget.blockedOn =
          3 === nearestMounted.tag
            ? nearestMounted.stateNode.containerInfo
            : null;
        return;
      }
  }
  queuedTarget.blockedOn = null;
}
function attemptReplayContinuousQueuedEvent(queuedEvent) {
  if (null !== queuedEvent.blockedOn) return !1;
  for (
    var targetContainers = queuedEvent.targetContainers;
    0 < targetContainers.length;

  ) {
    var nextBlockedOn = findInstanceBlockingEvent(queuedEvent.nativeEvent);
    if (null === nextBlockedOn) {
      nextBlockedOn = queuedEvent.nativeEvent;
      var nativeEventClone = new nextBlockedOn.constructor(
        nextBlockedOn.type,
        nextBlockedOn
      );
      currentReplayingEvent = nativeEventClone;
      nextBlockedOn.target.dispatchEvent(nativeEventClone);
      currentReplayingEvent = null;
    } else
      return (
        (targetContainers = getInstanceFromNode(nextBlockedOn)),
        null !== targetContainers &&
          attemptContinuousHydration(targetContainers),
        (queuedEvent.blockedOn = nextBlockedOn),
        !1
      );
    targetContainers.shift();
  }
  return !0;
}
function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
  attemptReplayContinuousQueuedEvent(queuedEvent) && map.delete(key);
}
function queueChangeEvent(target) {
  queuedChangeEventTargets.push(target);
  hasScheduledReplayAttempt || (hasScheduledReplayAttempt = !0);
}
function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
  queuedEvent.blockedOn === unblocked &&
    ((queuedEvent.blockedOn = null),
    hasScheduledReplayAttempt || (hasScheduledReplayAttempt = !0));
}
var lastScheduledReplayQueue = null;
function scheduleReplayQueueIfNeeded(formReplayingQueue) {
  lastScheduledReplayQueue !== formReplayingQueue &&
    ((lastScheduledReplayQueue = formReplayingQueue),
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      function () {
        lastScheduledReplayQueue === formReplayingQueue &&
          (lastScheduledReplayQueue = null);
        for (var i = 0; i < formReplayingQueue.length; i += 3) {
          var form = formReplayingQueue[i],
            submitterOrAction = formReplayingQueue[i + 1],
            formData = formReplayingQueue[i + 2];
          if ("function" !== typeof submitterOrAction)
            if (null === findInstanceBlockingTarget(submitterOrAction || form))
              continue;
            else break;
          var formInst = getInstanceFromNode(form);
          null !== formInst &&
            (formReplayingQueue.splice(i, 3),
            (i -= 3),
            startHostTransition(
              formInst,
              {
                pending: !0,
                data: formData,
                method: form.method,
                action: submitterOrAction
              },
              submitterOrAction,
              formData
            ));
        }
      }
    ));
}
function retryIfBlockedOn(unblocked) {
  function unblock(queuedEvent) {
    return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
  }
  null !== queuedFocus && scheduleCallbackIfUnblocked(queuedFocus, unblocked);
  null !== queuedDrag && scheduleCallbackIfUnblocked(queuedDrag, unblocked);
  null !== queuedMouse && scheduleCallbackIfUnblocked(queuedMouse, unblocked);
  queuedPointers.forEach(unblock);
  queuedPointerCaptures.forEach(unblock);
  for (var i = 0; i < queuedExplicitHydrationTargets.length; i++) {
    var queuedTarget = queuedExplicitHydrationTargets[i];
    queuedTarget.blockedOn === unblocked && (queuedTarget.blockedOn = null);
  }
  for (
    ;
    0 < queuedExplicitHydrationTargets.length &&
    ((i = queuedExplicitHydrationTargets[0]), null === i.blockedOn);

  )
    attemptExplicitHydrationTarget(i),
      null === i.blockedOn && queuedExplicitHydrationTargets.shift();
  i = (unblocked.ownerDocument || unblocked).$$reactFormReplay;
  if (null != i)
    for (queuedTarget = 0; queuedTarget < i.length; queuedTarget += 3) {
      var form = i[queuedTarget],
        submitterOrAction = i[queuedTarget + 1],
        formProps = form[internalPropsKey] || null;
      if ("function" === typeof submitterOrAction)
        formProps || scheduleReplayQueueIfNeeded(i);
      else if (formProps) {
        var action = null;
        if (submitterOrAction && submitterOrAction.hasAttribute("formAction"))
          if (
            ((form = submitterOrAction),
            (formProps = submitterOrAction[internalPropsKey] || null))
          )
            action = formProps.formAction;
          else {
            if (null !== findInstanceBlockingTarget(form)) continue;
          }
        else action = formProps.action;
        "function" === typeof action
          ? (i[queuedTarget + 1] = action)
          : (i.splice(queuedTarget, 3), (queuedTarget -= 3));
        scheduleReplayQueueIfNeeded(i);
      }
    }
}
function defaultOnDefaultTransitionIndicator() {
  function handleNavigate(event) {
    event.canIntercept &&
      "react-transition" === event.info &&
      event.intercept({
        handler: function () {
          return new Promise(function (resolve) {
            return (pendingResolve = resolve);
          });
        },
        focusReset: "manual",
        scroll: "manual"
      });
  }
  function handleNavigateComplete() {
    null !== pendingResolve && (pendingResolve(), (pendingResolve = null));
    isCancelled || setTimeout(startFakeNavigation, 20);
  }
  function startFakeNavigation() {
    if (!isCancelled && !navigation.transition) {
      var currentEntry = navigation.currentEntry;
      currentEntry &&
        null != currentEntry.url &&
        navigation.navigate(currentEntry.url, {
          state: currentEntry.getState(),
          info: "react-transition",
          history: "replace"
        });
    }
  }
  if ("object" === typeof navigation) {
    var isCancelled = !1,
      pendingResolve = null;
    navigation.addEventListener("navigate", handleNavigate);
    navigation.addEventListener("navigatesuccess", handleNavigateComplete);
    navigation.addEventListener("navigateerror", handleNavigateComplete);
    setTimeout(startFakeNavigation, 100);
    return function () {
      isCancelled = !0;
      navigation.removeEventListener("navigate", handleNavigate);
      navigation.removeEventListener("navigatesuccess", handleNavigateComplete);
      navigation.removeEventListener("navigateerror", handleNavigateComplete);
      null !== pendingResolve && (pendingResolve(), (pendingResolve = null));
    };
  }
}
function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}
ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render =
  function (children) {
    var root = this._internalRoot;
    if (null === root) throw Error(formatProdErrorMessage(409));
    var current = root.current,
      lane = requestUpdateLane(current);
    updateContainerImpl(current, lane, children, root, null, null);
  };
ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount =
  function () {
    var root = this._internalRoot;
    if (null !== root) {
      this._internalRoot = null;
      var container = root.containerInfo;
      0 === root.tag && flushPendingEffects();
      updateContainerImpl(root.current, 2, null, root, null, null);
      flushSyncWork();
      container[internalContainerInstanceKey] = null;
    }
  };
function ReactDOMHydrationRoot(internalRoot) {
  this._internalRoot = internalRoot;
}
ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = function (target) {
  if (target) {
    var updatePriority = resolveUpdatePriority();
    target = { blockedOn: null, target: target, priority: updatePriority };
    for (
      var i = 0;
      i < queuedExplicitHydrationTargets.length &&
      0 !== updatePriority &&
      updatePriority < queuedExplicitHydrationTargets[i].priority;
      i++
    );
    queuedExplicitHydrationTargets.splice(i, 0, target);
    0 === i && attemptExplicitHydrationTarget(target);
  }
};
var isomorphicReactPackageVersion$jscomp$inline_2375 = React.version;
if (
  "19.3.0-native-fb-ed1351c4-20251016" !==
  isomorphicReactPackageVersion$jscomp$inline_2375
)
  throw Error(
    formatProdErrorMessage(
      527,
      isomorphicReactPackageVersion$jscomp$inline_2375,
      "19.3.0-native-fb-ed1351c4-20251016"
    )
  );
ReactDOMSharedInternals.findDOMNode = function (componentOrElement) {
  var fiber = componentOrElement._reactInternals;
  if (void 0 === fiber) {
    if ("function" === typeof componentOrElement.render)
      throw Error(formatProdErrorMessage(188));
    componentOrElement = Object.keys(componentOrElement).join(",");
    throw Error(formatProdErrorMessage(268, componentOrElement));
  }
  componentOrElement = findCurrentFiberUsingSlowPath(fiber);
  componentOrElement =
    null !== componentOrElement
      ? findCurrentHostFiberImpl(componentOrElement)
      : null;
  componentOrElement =
    null === componentOrElement ? null : componentOrElement.stateNode;
  return componentOrElement;
};
var internals$jscomp$inline_2382 = {
  bundleType: 0,
  version: "19.3.0-native-fb-ed1351c4-20251016",
  rendererPackageName: "react-dom",
  currentDispatcherRef: ReactSharedInternals,
  reconcilerVersion: "19.3.0-native-fb-ed1351c4-20251016",
  getLaneLabelMap: function () {
    for (
      var map = new Map(), lane = 1, index$332 = 0;
      31 > index$332;
      index$332++
    ) {
      var label = getLabelForLane(lane);
      map.set(lane, label);
      lane *= 2;
    }
    return map;
  },
  injectProfilingHooks: function (profilingHooks) {
    injectedProfilingHooks = profilingHooks;
  }
};
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var hook$jscomp$inline_2962 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (
    !hook$jscomp$inline_2962.isDisabled &&
    hook$jscomp$inline_2962.supportsFiber
  )
    try {
      (rendererID = hook$jscomp$inline_2962.inject(
        internals$jscomp$inline_2382
      )),
        (injectedHook = hook$jscomp$inline_2962);
    } catch (err) {}
}
exports.createRoot = function (container, options) {
  if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
  var isStrictMode = !1,
    identifierPrefix = "",
    onUncaughtError = defaultOnUncaughtError,
    onCaughtError = defaultOnCaughtError,
    onRecoverableError = defaultOnRecoverableError,
    onDefaultTransitionIndicator = defaultOnDefaultTransitionIndicator;
  null !== options &&
    void 0 !== options &&
    (!0 === options.unstable_strictMode && (isStrictMode = !0),
    void 0 !== options.identifierPrefix &&
      (identifierPrefix = options.identifierPrefix),
    void 0 !== options.onUncaughtError &&
      (onUncaughtError = options.onUncaughtError),
    void 0 !== options.onCaughtError && (onCaughtError = options.onCaughtError),
    void 0 !== options.onRecoverableError &&
      (onRecoverableError = options.onRecoverableError),
    void 0 !== options.onDefaultTransitionIndicator &&
      (onDefaultTransitionIndicator = options.onDefaultTransitionIndicator));
  options = onDefaultTransitionIndicator;
  isStrictMode = createFiberRoot(
    container,
    1,
    !1,
    null,
    null,
    isStrictMode,
    identifierPrefix,
    null,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    options
  );
  registerDefaultIndicator(options);
  container[internalContainerInstanceKey] = isStrictMode.current;
  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(isStrictMode);
};
exports.hydrateRoot = function (container, initialChildren, options) {
  if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
  var isStrictMode = !1,
    identifierPrefix = "",
    onUncaughtError = defaultOnUncaughtError,
    onCaughtError = defaultOnCaughtError,
    onRecoverableError = defaultOnRecoverableError,
    onDefaultTransitionIndicator = defaultOnDefaultTransitionIndicator,
    formState = null;
  null !== options &&
    void 0 !== options &&
    (!0 === options.unstable_strictMode && (isStrictMode = !0),
    void 0 !== options.identifierPrefix &&
      (identifierPrefix = options.identifierPrefix),
    void 0 !== options.onUncaughtError &&
      (onUncaughtError = options.onUncaughtError),
    void 0 !== options.onCaughtError && (onCaughtError = options.onCaughtError),
    void 0 !== options.onRecoverableError &&
      (onRecoverableError = options.onRecoverableError),
    void 0 !== options.onDefaultTransitionIndicator &&
      (onDefaultTransitionIndicator = options.onDefaultTransitionIndicator),
    void 0 !== options.formState && (formState = options.formState));
  initialChildren = createFiberRoot(
    container,
    1,
    !0,
    initialChildren,
    null != options ? options : null,
    isStrictMode,
    identifierPrefix,
    formState,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    onDefaultTransitionIndicator
  );
  registerDefaultIndicator(onDefaultTransitionIndicator);
  initialChildren.context = getContextForSubtree(null);
  options = initialChildren.current;
  isStrictMode = requestUpdateLane(options);
  isStrictMode = getBumpedLaneForHydrationByLane(isStrictMode);
  identifierPrefix = createUpdate(isStrictMode);
  identifierPrefix.callback = null;
  enqueueUpdate(options, identifierPrefix, isStrictMode);
  startUpdateTimerByLane(isStrictMode);
  options = isStrictMode;
  initialChildren.current.lanes = options;
  markRootUpdated$1(initialChildren, options);
  ensureRootIsScheduled(initialChildren);
  container[internalContainerInstanceKey] = initialChildren.current;
  listenToAllSupportedEvents(container);
  return new ReactDOMHydrationRoot(initialChildren);
};
exports.version = "19.3.0-native-fb-ed1351c4-20251016";
